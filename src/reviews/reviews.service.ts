import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async getReviews(productId?: string) {
    return this.prisma.review.findMany({
      where: productId ? { productId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
          },
        },
        user: {
          select: {
            id: true,
            displayName: true,
            photoURL: true,
          },
        },
      },
    });
  }

  async getMyReviews(userId: string) {
    return this.prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
          },
        },
      },
    });
  }

  async canUserReview(userId: string, productId: string) {
    const userRecord = await this.prisma.user.findUnique({ where: { id: userId } });
    const userEmail = userRecord?.email;

    // Count completed/delivered orders containing this product
    const deliveredPurchasesCount = await this.prisma.order.count({
      where: {
        OR: [
          { userId },
          ...(userEmail ? [{ guestEmail: userEmail }] : []),
        ],
        status: OrderStatus.DELIVERED,
        items: {
          some: {
            productId,
          },
        },
      },
    });

    if (deliveredPurchasesCount === 0) {
      return {
        canReview: false,
        reason: 'You can only review a product after your order has been delivered.',
        deliveredPurchasesCount: 0,
        userReviewsCount: 0,
      };
    }

    // Count user's existing reviews for this product
    const userReviewsCount = await this.prisma.review.count({
      where: {
        userId,
        productId,
      },
    });

    if (userReviewsCount >= deliveredPurchasesCount) {
      return {
        canReview: false,
        reason: 'You have already reviewed this product for your delivered purchase(s). Buy again to review again.',
        userReviewsCount,
        deliveredPurchasesCount,
      };
    }

    return {
      canReview: true,
      userReviewsCount,
      deliveredPurchasesCount,
      remainingReviews: deliveredPurchasesCount - userReviewsCount,
    };
  }

  async createReview(
    userId: string,
    dto: { productId: string; rating: number; comment: string; reviewerName?: string; avatar?: string }
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Verify customer purchased this product
    const { canReview, reason } = await this.canUserReview(userId, dto.productId);
    if (!canReview) {
      throw new ForbiddenException(reason);
    }

    const createdReview = await this.prisma.review.create({
      data: {
        userId,
        productId: dto.productId,
        rating: Math.min(5, Math.max(1, dto.rating || 5)),
        comment: dto.comment,
        reviewerName: dto.reviewerName,
        avatar: dto.avatar,
        designation: 'Verified Buyer',
      },
      include: {
        product: true,
      },
    });

    // Automatically recalculate and persist real rating & count in database
    const allReviews = await this.prisma.review.findMany({
      where: { productId: dto.productId },
      select: { rating: true },
    });
    const avgRating =
      allReviews.reduce((acc, r) => acc + r.rating, 0) / (allReviews.length || 1);
    await this.prisma.product.update({
      where: { id: dto.productId },
      data: {
        reviewsCount: allReviews.length,
        rating: Math.round(avgRating * 10) / 10,
      },
    });

    return createdReview;
  }

  async replyReview(reviewId: string, adminReply: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        adminReply,
        adminReplyAt: new Date(),
      },
      include: {
        product: true,
        user: true,
      },
    });
  }

  async deleteReview(userId: string, reviewId: string, isAdmin: boolean = false) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('Not authorized to delete this review');
    }

    const deleted = await this.prisma.review.delete({
      where: { id: reviewId },
    });

    // Automatically update product rating and count on delete
    const remaining = await this.prisma.review.findMany({
      where: { productId: review.productId },
      select: { rating: true },
    });
    const avgRating =
      remaining.length > 0
        ? remaining.reduce((acc, r) => acc + r.rating, 0) / remaining.length
        : 5.0;
    await this.prisma.product.update({
      where: { id: review.productId },
      data: {
        reviewsCount: remaining.length,
        rating: Math.round(avgRating * 10) / 10,
      },
    });

    return deleted;
  }
}

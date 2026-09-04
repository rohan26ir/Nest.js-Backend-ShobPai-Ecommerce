import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
    const purchasedOrder = await this.prisma.order.findFirst({
      where: {
        userId,
        items: {
          some: {
            productId,
          },
        },
        status: {
          not: 'CANCELLED',
        },
      },
    });

    return {
      canReview: !!purchasedOrder,
      reason: purchasedOrder ? undefined : 'You must purchase this product before writing a review.',
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

    return this.prisma.review.create({
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

    return this.prisma.review.delete({
      where: { id: reviewId },
    });
  }
}

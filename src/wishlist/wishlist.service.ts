import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ToggleWishlistDto } from './dto/toggle-wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  private mapProduct(p: any) {
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      originalPrice: p.originalPrice ?? undefined,
      discount: p.discount ?? 0,
      images: p.images,
      category: p.category?.slug || '',
      categoryName: p.category?.name || '',
      rating: p.rating,
      reviewsCount: p.reviewsCount,
      stock: p.stock,
      sold: p.sold,
      unit: p.unit,
      description: p.description,
      shortDescription: p.shortDescription,
      nutritionalBenefits: p.nutritionalBenefits,
      isTrending: p.isTrending,
      isFeatured: p.isFeatured,
      isDealOfDay: p.isDealOfDay,
      badge: p.badge ?? undefined,
    };
  }

  async getMyWishlist(userId: string) {
    const items = await this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return items
      .filter((item) => item.product != null)
      .map((item) => this.mapProduct(item.product));
  }

  async toggleWishlist(userId: string, dto: ToggleWishlistDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product '${dto.productId}' not found`);
    }

    const existing = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: dto.productId,
        },
      },
    });

    if (existing) {
      await this.prisma.wishlist.delete({
        where: { id: existing.id },
      });
      return { added: false, message: 'Removed from wishlist' };
    }

    await this.prisma.wishlist.create({
      data: {
        userId,
        productId: dto.productId,
      },
    });

    return { added: true, message: 'Added to wishlist' };
  }

  async removeFromWishlist(userId: string, productId: string) {
    const existing = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      await this.prisma.wishlist.delete({
        where: { id: existing.id },
      });
    }

    return { success: true };
  }
}

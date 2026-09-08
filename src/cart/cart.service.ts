import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto, SyncCartDto } from './dto/cart.dto';

@Injectable()
export class CartService {
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

  async getMyCart(userId: string) {
    const items = await this.prisma.cartItem.findMany({
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
      .map((item) => ({
        product: this.mapProduct(item.product),
        quantity: item.quantity,
      }));
  }

  async addToCart(userId: string, dto: AddToCartDto) {
    const qty = dto.quantity && dto.quantity > 0 ? dto.quantity : 1;

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product '${dto.productId}' not found`);
    }

    const existing = await this.prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: dto.productId,
        },
      },
    });

    if (existing) {
      const updated = await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + qty },
      });
      return { success: true, quantity: updated.quantity };
    }

    const created = await this.prisma.cartItem.create({
      data: {
        userId,
        productId: dto.productId,
        quantity: qty,
      },
    });

    return { success: true, quantity: created.quantity };
  }

  async updateQuantity(userId: string, productId: string, dto: UpdateCartItemDto) {
    const existing = await this.prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!existing) {
      if (dto.quantity && dto.quantity > 0) {
        await this.prisma.cartItem.create({
          data: {
            userId,
            productId,
            quantity: dto.quantity,
          },
        });
        return { success: true, quantity: dto.quantity };
      }
      return { success: true, quantity: 0 };
    }

    let nextQty = existing.quantity;
    if (dto.quantity !== undefined) {
      nextQty = dto.quantity;
    } else if (dto.delta !== undefined) {
      nextQty = existing.quantity + dto.delta;
    }

    if (nextQty <= 0) {
      await this.prisma.cartItem.delete({
        where: { id: existing.id },
      });
      return { success: true, quantity: 0 };
    }

    const updated = await this.prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: nextQty },
    });

    return { success: true, quantity: updated.quantity };
  }

  async removeFromCart(userId: string, productId: string) {
    const existing = await this.prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      await this.prisma.cartItem.delete({
        where: { id: existing.id },
      });
    }

    return { success: true };
  }

  async clearCart(userId: string) {
    await this.prisma.cartItem.deleteMany({
      where: { userId },
    });
    return { success: true };
  }

  async syncCart(userId: string, dto: SyncCartDto) {
    if (!dto.items || dto.items.length === 0) {
      return this.getMyCart(userId);
    }

    for (const item of dto.items) {
      if (!item.productId || item.quantity <= 0) continue;

      const existing = await this.prisma.cartItem.findUnique({
        where: {
          userId_productId: {
            userId,
            productId: item.productId,
          },
        },
      });

      if (existing) {
        // Keep highest or increment
        await this.prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: Math.max(existing.quantity, item.quantity) },
        });
      } else {
        // Verify product exists before creating
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
        });
        if (product) {
          await this.prisma.cartItem.create({
            data: {
              userId,
              productId: item.productId,
              quantity: item.quantity,
            },
          });
        }
      }
    }

    return this.getMyCart(userId);
  }
}

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus, PaymentMethod, PaymentStatus, Role } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private generateOrderNumber(): string {
    const random = Math.floor(100000 + Math.random() * 900000);
    return `ORD-${random}`;
  }

  async createOrder(userId: string | null, dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // Calculate subtotal
    const calculatedSubtotal = dto.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const subtotal = dto.subtotal ?? Number(calculatedSubtotal.toFixed(2));
    const shippingFee = dto.shippingFee ?? (subtotal > 50 ? 0 : 4.99);
    const discountAmount = dto.discountAmount ?? 0;
    const totalAmount = dto.totalAmount ?? Number((subtotal + shippingFee - discountAmount).toFixed(2));

    const method = (dto.paymentMethod || 'COD').toUpperCase();
    const paymentMethod = method === 'GATEWAY' ? PaymentMethod.GATEWAY : PaymentMethod.COD;

    let orderNumber = this.generateOrderNumber();
    while (await this.prisma.order.findUnique({ where: { orderNumber } })) {
      orderNumber = this.generateOrderNumber();
    }

    // Execute order creation and stock decrement in transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // 1. Check stock availability for all items and resolve valid product IDs in DB
      const validatedItems: {
        productId: string | null;
        productName: string;
        productImage?: string;
        price: number;
        quantity: number;
        unit: string;
      }[] = [];

      for (const item of dto.items) {
        let validProductId: string | null = null;
        if (item.productId) {
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (prod) {
            if (prod.stock < item.quantity) {
              throw new BadRequestException(
                `Product '${item.productName || prod.name}' has only ${prod.stock} items left in stock (requested ${item.quantity}).`,
              );
            }
            validProductId = prod.id;
          }
        }

        validatedItems.push({
          productId: validProductId,
          productName: item.productName,
          productImage: item.productImage,
          price: item.price,
          quantity: item.quantity,
          unit: item.unit || '1 kg',
        });
      }

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: userId || null,
          guestEmail: dto.guestEmail || (dto.shippingAddress as any)?.email,
          guestName: dto.guestName || dto.shippingAddress?.fullName || 'Guest Customer',
          guestPhone: dto.guestPhone || dto.shippingAddress?.phone || '',
          shippingAddress: dto.shippingAddress as any,
          status: OrderStatus.PENDING,
          paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          subtotal,
          shippingFee,
          discountAmount,
          totalAmount,
          couponCode: dto.couponCode,
          notes: dto.notes,
          items: {
            create: validatedItems,
          },
        },
        include: {
          items: true,
        },
      });

      // Update product stock and sold counts for valid product IDs
      for (const item of validatedItems) {
        if (item.productId) {
          try {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { decrement: item.quantity },
                sold: { increment: item.quantity },
              },
            });
          } catch {
            // Product update gracefully caught if concurrent change occurs
          }
        }
      }

      return newOrder;
    });

    return order;
  }

  async getMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderDetails(orderId: string, user: any) {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            phoneNumber: true,
            photoURL: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order '${orderId}' not found`);
    }

    // Check authorization: admin or owner
    if (user && user.role !== Role.ADMIN && order.userId && order.userId !== user.id) {
      throw new ForbiddenException('Not authorized to view this order');
    }

    return order;
  }

  async adminListOrders(statusFilter?: string) {
    let status: OrderStatus | undefined;
    if (statusFilter && statusFilter !== 'all') {
      const upper = statusFilter.toUpperCase();
      if (Object.values(OrderStatus).includes(upper as OrderStatus)) {
        status = upper as OrderStatus;
      }
    }

    return this.prisma.order.findMany({
      where: {
        ...(status && { status }),
      },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            phoneNumber: true,
            photoURL: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async adminUpdateOrderStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
    });

    if (!order) {
      throw new NotFoundException(`Order '${orderId}' not found`);
    }

    const upperStatus = dto.status.toUpperCase();
    if (!Object.values(OrderStatus).includes(upperStatus as OrderStatus)) {
      throw new BadRequestException(
        `Invalid status. Valid values: ${Object.values(OrderStatus).join(', ')}`,
      );
    }

    const previousStatus = order.status;
    const newStatus = upperStatus as OrderStatus;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status: newStatus,
          ...(newStatus === OrderStatus.DELIVERED && {
            paymentStatus: PaymentStatus.PAID,
          }),
        },
        include: {
          items: true,
        },
      });

      // If order was cancelled, return items to inventory
      if (previousStatus !== OrderStatus.CANCELLED && newStatus === OrderStatus.CANCELLED) {
        for (const item of updated.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
                sold: { decrement: item.quantity },
              },
            }).catch(() => {});
          }
        }
      } else if (previousStatus === OrderStatus.CANCELLED && newStatus !== OrderStatus.CANCELLED) {
        // Re-decrement if order is revived
        for (const item of updated.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { decrement: item.quantity },
                sold: { increment: item.quantity },
              },
            }).catch(() => {});
          }
        }
      }

      return updated;
    });
  }
}

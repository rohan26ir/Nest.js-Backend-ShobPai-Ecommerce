import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      revenueResult,
      recentOrders,
      pendingOrders,
      deliveredOrders,
      monthlyGoal,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              email: true,
              photoURL: true,
            },
          },
          items: true,
        },
      }),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.count({ where: { status: 'DELIVERED' } }),
      this.getMonthlyGoal(),
    ]);

    return {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: revenueResult._sum.totalAmount || 0,
      pendingOrders,
      deliveredOrders,
      recentOrders,
      monthlyGoal,
    };
  }

  async getMonthlyGoal() {
    let target = 60000;
    let targetOrders = 500;
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'monthly_goal' },
      });
      if (setting && setting.value) {
        const parsed = JSON.parse(setting.value);
        if (typeof parsed.target === 'number' && parsed.target > 0) {
          target = parsed.target;
        }
        if (typeof parsed.targetOrders === 'number' && parsed.targetOrders > 0) {
          targetOrders = parsed.targetOrders;
        }
      }
    } catch {
      // fallback
    }

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [monthlyRevenueResult, monthlyOrdersCount] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          status: { not: 'CANCELLED' },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          status: { not: 'CANCELLED' },
        },
      }),
    ]);

    const currentRevenue = monthlyRevenueResult._sum.totalAmount || 0;
    const percentage = target > 0 ? Math.min(100, Math.round((currentRevenue / target) * 100)) : 0;

    return {
      target,
      targetOrders,
      currentRevenue,
      currentOrders: monthlyOrdersCount,
      percentage,
      month: currentMonthStr,
      status: percentage >= 100 ? 'ACHIEVED' : percentage >= 60 ? 'ON_TRACK' : 'NEEDS_BOOST',
    };
  }

  async updateMonthlyGoal(data: { target: number; targetOrders?: number; month?: string }) {
    const target = Number(data.target) || 60000;
    const targetOrders = Number(data.targetOrders) || 500;
    const payload = {
      target,
      targetOrders,
      month: data.month || new Date().toISOString().slice(0, 7),
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.systemSetting.upsert({
      where: { key: 'monthly_goal' },
      update: { value: JSON.stringify(payload) },
      create: { key: 'monthly_goal', value: JSON.stringify(payload) },
    });

    return this.getMonthlyGoal();
  }

  async getProductStats() {
    const now = new Date();

    // Start of Today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // Start of This Week (Monday)
    const dayOfWeek = (now.getDay() + 6) % 7;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0, 0);

    // Start of This Month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    // Catalog totals
    const [totalProducts, stockResult, totalSoldResult, totalRevenueResult] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.aggregate({ _sum: { stock: true } }),
      this.prisma.product.aggregate({ _sum: { sold: true } }),
      this.prisma.order.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true },
      }),
    ]);

    const productLeft = stockResult._sum.stock ?? 0;
    const allTimeSold = totalSoldResult._sum.sold ?? 0;
    const allTimeRevenue = totalRevenueResult._sum.totalAmount ?? 0;

    // Period aggregations
    const [
      monthOrdersAgg,
      monthItemsAgg,
      weekOrdersAgg,
      weekItemsAgg,
      todayOrdersAgg,
      todayItemsAgg,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: { createdAt: { gte: startOfMonth }, status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true },
      }),
      this.prisma.orderItem.aggregate({
        where: { order: { createdAt: { gte: startOfMonth }, status: { not: 'CANCELLED' } } },
        _sum: { quantity: true },
      }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: startOfWeek }, status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true },
      }),
      this.prisma.orderItem.aggregate({
        where: { order: { createdAt: { gte: startOfWeek }, status: { not: 'CANCELLED' } } },
        _sum: { quantity: true },
      }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: startOfToday }, status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true },
      }),
      this.prisma.orderItem.aggregate({
        where: { order: { createdAt: { gte: startOfToday }, status: { not: 'CANCELLED' } } },
        _sum: { quantity: true },
      }),
    ]);

    return {
      allTime: {
        totalProducts,
        productLeft,
        productSold: allTimeSold,
        soldAmount: allTimeRevenue,
      },
      thisMonth: {
        totalProducts,
        productLeft,
        productSold: monthItemsAgg._sum.quantity ?? allTimeSold,
        soldAmount: monthOrdersAgg._sum.totalAmount ?? allTimeRevenue,
      },
      thisWeek: {
        totalProducts,
        productLeft,
        productSold: weekItemsAgg._sum.quantity ?? 0,
        soldAmount: weekOrdersAgg._sum.totalAmount ?? 0,
      },
      today: {
        totalProducts,
        productLeft,
        productSold: todayItemsAgg._sum.quantity ?? 0,
        soldAmount: todayOrdersAgg._sum.totalAmount ?? 0,
      },
    };
  }

  async getUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firebaseUid: true,
        email: true,
        displayName: true,
        phoneNumber: true,
        photoURL: true,
        role: true,
        createdAt: true,
        orders: {
          select: {
            totalAmount: true,
          },
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
          },
        },
      },
    });

    return users.map((u) => {
      const totalSpent = u.orders?.reduce((sum, o) => sum + (o.totalAmount || 0), 0) || 0;
      const { orders, ...rest } = u;
      return {
        ...rest,
        totalSpent,
      };
    });
  }

  async updateUserRole(userId: string, role: Role) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
      },
    });
  }
}

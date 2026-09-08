import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(onlyActive: boolean = false) {
    return this.prisma.coupon.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async validateCoupon(dto: ValidateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: dto.code.trim().toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Invalid or expired coupon code');
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      throw new BadRequestException('This coupon code has expired');
    }

    if (dto.subtotal < coupon.minSpend) {
      throw new BadRequestException(
        `Minimum spend of $${coupon.minSpend.toFixed(2)} required for this coupon`,
      );
    }

    const discountAmount = Number(
      ((dto.subtotal * coupon.discountPercentage) / 100).toFixed(2),
    );

    return {
      valid: true,
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
      discountAmount,
      description: coupon.description,
      message: `${coupon.discountPercentage}% discount applied successfully!`,
    };
  }

  async create(dto: CreateCouponDto) {
    const code = dto.code.trim().toUpperCase();

    const existing = await this.prisma.coupon.findUnique({
      where: { code },
    });

    if (existing) {
      throw new ConflictException(`Coupon code '${code}' already exists`);
    }

    return this.prisma.coupon.create({
      data: {
        code,
        discountPercentage: dto.discountPercentage,
        minSpend: dto.minSpend ?? 0,
        description: dto.description,
        isActive: dto.isActive ?? true,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  async update(id: string, dto: UpdateCouponDto) {
    const coupon = await this.prisma.coupon.findFirst({
      where: {
        OR: [{ id }, { code: id.toUpperCase() }],
      },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon '${id}' not found`);
    }

    const data: any = {};
    if (dto.code !== undefined) {
      const code = dto.code.trim().toUpperCase();
      if (code !== coupon.code) {
        const existing = await this.prisma.coupon.findUnique({ where: { code } });
        if (existing) {
          throw new ConflictException(`Coupon code '${code}' already exists`);
        }
      }
      data.code = code;
    }
    if (dto.discountPercentage !== undefined) data.discountPercentage = dto.discountPercentage;
    if (dto.minSpend !== undefined) data.minSpend = dto.minSpend;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.expiresAt !== undefined) {
      data.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    }

    return this.prisma.coupon.update({
      where: { id: coupon.id },
      data,
    });
  }

  async remove(id: string) {
    const coupon = await this.prisma.coupon.findFirst({
      where: {
        OR: [{ id }, { code: id.toUpperCase() }],
      },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon '${id}' not found`);
    }

    return this.prisma.coupon.delete({
      where: { id: coupon.id },
    });
  }
}

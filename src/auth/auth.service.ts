import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncUserDto } from './dto/sync-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private isAdminEmail(email?: string | null): boolean {
    if (!email) return false;
    const adminEmails = (process.env.ADMIN_EMAILS || 'rohan26ir@gmail.com,admin@shobpai.com')
      .split(',')
      .map((e) => e.trim().toLowerCase());
    return adminEmails.includes(email.toLowerCase());
  }

  async syncUser(dto: SyncUserDto) {
    const isAdmin = this.isAdminEmail(dto.email);
    const role: Role = isAdmin ? Role.ADMIN : (dto.role === 'ADMIN' ? Role.ADMIN : Role.USER);

    // Try finding by firebaseUid first
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { firebaseUid: dto.firebaseUid },
          ...(dto.email ? [{ email: dto.email }] : []),
        ],
      },
    });

    if (existing) {
      return this.prisma.user.update({
        where: { id: existing.id },
        data: {
          firebaseUid: dto.firebaseUid,
          email: dto.email ?? existing.email,
          displayName: dto.displayName ?? existing.displayName,
          phoneNumber: dto.phoneNumber ?? existing.phoneNumber,
          photoURL: dto.photoURL ?? existing.photoURL,
          role: isAdmin ? Role.ADMIN : existing.role,
        },
      });
    }

    return this.prisma.user.create({
      data: {
        firebaseUid: dto.firebaseUid,
        email: dto.email,
        displayName: dto.displayName || (dto.email ? dto.email.split('@')[0] : 'User'),
        phoneNumber: dto.phoneNumber,
        photoURL: dto.photoURL,
        role: role,
      },
    });
  }

  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            orders: true,
            wishlist: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.displayName && { displayName: dto.displayName }),
        ...(dto.photoURL && { photoURL: dto.photoURL }),
        ...(dto.phoneNumber && { phoneNumber: dto.phoneNumber }),
      },
    });
  }

  async getMyAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.create({
      data: {
        userId,
        fullName: dto.fullName,
        phone: dto.phone,
        addressLine: dto.addressLine,
        city: dto.city,
        state: dto.state,
        zipCode: dto.zipCode,
        country: dto.country || 'Bangladesh',
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found or unauthorized');
    }

    return this.prisma.address.delete({
      where: { id: addressId },
    });
  }
}

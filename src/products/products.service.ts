import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private mapProductToDto(p: any) {
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
      storage: p.storage ?? undefined,
      shelfLife: p.shelfLife ?? undefined,
      certifications: p.certifications ?? undefined,
      isTrending: p.isTrending,
      isFeatured: p.isFeatured,
      isDealOfDay: p.isDealOfDay,
      badge: p.badge ?? undefined,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  async findAll(query: ProductQueryDto) {
    const {
      category_slug,
      category,
      search,
      featured,
      trending,
      dealOfDay,
      min_price,
      max_price,
      sort,
      page = 1,
      limit = 12,
    } = query;

    const catParam = category_slug || category;

    const where: Prisma.ProductWhereInput = {
      ...(catParam &&
        catParam !== 'all' && {
          category: {
            slug: catParam,
          },
        }),
      ...(featured !== undefined && { isFeatured: featured }),
      ...(trending !== undefined && { isTrending: trending }),
      ...(dealOfDay !== undefined && { isDealOfDay: dealOfDay }),
      ...(min_price !== undefined || max_price !== undefined
        ? {
            price: {
              ...(min_price !== undefined && { gte: min_price }),
              ...(max_price !== undefined && { lte: max_price }),
            },
          }
        : {}),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { shortDescription: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };

    switch (sort) {
      case 'price-asc':
        orderBy = { price: 'asc' };
        break;
      case 'price-desc':
        orderBy = { price: 'desc' };
        break;
      case 'rating':
        orderBy = { rating: 'desc' };
        break;
      case 'popular':
        orderBy = { sold: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: { category: true },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return {
      data: items.map((p) => this.mapProductToDto(p)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(slugOrId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [{ id: slugOrId }, { slug: slugOrId }],
      },
      include: {
        category: true,
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product '${slugOrId}' not found`);
    }

    return {
      ...this.mapProductToDto(product),
      reviews: product.reviews,
    };
  }

  async create(dto: CreateProductDto) {
    const slug = dto.slug || this.generateSlug(dto.name);

    const existing = await this.prisma.product.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException(`Product with slug '${slug}' already exists`);
    }

    // Resolve category by ID or Slug
    const categoryRecord = await this.prisma.category.findFirst({
      where: {
        OR: [{ id: dto.category }, { slug: dto.category }],
      },
    });

    if (!categoryRecord) {
      throw new NotFoundException(`Category '${dto.category}' not found`);
    }

    const origPrice = dto.originalPrice ?? dto.price;
    const discount = dto.discount ?? (origPrice > dto.price ? Math.round(((origPrice - dto.price) / origPrice) * 100) : 0);

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        slug,
        price: dto.price,
        originalPrice: origPrice,
        discount: discount,
        images: dto.images && dto.images.length > 0 ? dto.images : [],
        categoryId: categoryRecord.id,
        stock: dto.stock ?? 50,
        unit: dto.unit || '1 kg',
        description: dto.description,
        shortDescription: dto.shortDescription || dto.description.slice(0, 120),
        nutritionalBenefits: dto.nutritionalBenefits || [],
        storage: dto.storage,
        shelfLife: dto.shelfLife,
        certifications: dto.certifications,
        isTrending: dto.isTrending ?? false,
        isFeatured: dto.isFeatured ?? false,
        isDealOfDay: dto.isDealOfDay ?? false,
        badge: dto.badge,
      },
      include: { category: true },
    });

    return this.mapProductToDto(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }

    let categoryId = product.categoryId;
    if (dto.category) {
      const cat = await this.prisma.category.findFirst({
        where: {
          OR: [{ id: dto.category }, { slug: dto.category }],
        },
      });
      if (cat) categoryId = cat.id;
    }

    let slug = dto.slug;
    if (dto.name && !dto.slug) {
      slug = this.generateSlug(dto.name);
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(slug && { slug }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.originalPrice !== undefined && { originalPrice: dto.originalPrice }),
        ...(dto.discount !== undefined && { discount: dto.discount }),
        ...(dto.images && { images: dto.images }),
        categoryId,
        ...(dto.stock !== undefined && { stock: dto.stock }),
        ...(dto.unit && { unit: dto.unit }),
        ...(dto.description && { description: dto.description }),
        ...(dto.shortDescription && { shortDescription: dto.shortDescription }),
        ...(dto.nutritionalBenefits && { nutritionalBenefits: dto.nutritionalBenefits }),
        ...(dto.storage !== undefined && { storage: dto.storage }),
        ...(dto.shelfLife !== undefined && { shelfLife: dto.shelfLife }),
        ...(dto.certifications !== undefined && { certifications: dto.certifications }),
        ...(dto.isTrending !== undefined && { isTrending: dto.isTrending }),
        ...(dto.isFeatured !== undefined && { isFeatured: dto.isFeatured }),
        ...(dto.isDealOfDay !== undefined && { isDealOfDay: dto.isDealOfDay }),
        ...(dto.badge !== undefined && { badge: dto.badge }),
      },
      include: { category: true },
    });

    return this.mapProductToDto(updated);
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }

    return this.prisma.product.delete({
      where: { id },
    });
  }
}

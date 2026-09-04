import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ProductQueryDto {
  @ApiPropertyOptional({ description: 'Category slug to filter by' })
  @IsString()
  @IsOptional()
  category_slug?: string;

  @ApiPropertyOptional({ description: 'Alternative category slug parameter' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Search keywords in name and description' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter featured products' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Filter trending products' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  trending?: boolean;

  @ApiPropertyOptional({ description: 'Filter deal of the day products' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  dealOfDay?: boolean;

  @ApiPropertyOptional({ description: 'Minimum price' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  min_price?: number;

  @ApiPropertyOptional({ description: 'Maximum price' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  max_price?: number;

  @ApiPropertyOptional({
    description: 'Sort criteria: price-asc, price-desc, newest, rating, popular',
    default: 'newest',
  })
  @IsString()
  @IsOptional()
  sort?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page limit', default: 12 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number = 12;
}

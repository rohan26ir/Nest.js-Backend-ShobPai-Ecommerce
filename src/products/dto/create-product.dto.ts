import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Fresh Red Organic Tomatoes' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'fresh-red-organic-tomatoes' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ example: 3.5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 4.8 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  originalPrice?: number;

  @ApiPropertyOptional({ example: 27 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({
    example: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea...'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({
    example: 'vegetables',
    description: 'Category ID or category slug',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ example: 50 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({ example: '1 kg', default: '1 kg' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ example: 'Hand-picked farm fresh organic red tomatoes...' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'Plump, juicy organic tomatoes.' })
  @IsString()
  @IsOptional()
  shortDescription?: string;

  @ApiPropertyOptional({
    example: ['Rich In Dietary Fibre', 'Packed with Essential Minerals'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  nutritionalBenefits?: string[];

  @ApiPropertyOptional({ example: 'Keep refrigerated at 4-8°C' })
  @IsString()
  @IsOptional()
  storage?: string;

  @ApiPropertyOptional({ example: '7 days from delivery' })
  @IsString()
  @IsOptional()
  shelfLife?: string;

  @ApiPropertyOptional({ example: '100% Organic Certified' })
  @IsString()
  @IsOptional()
  certifications?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isTrending?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isDealOfDay?: boolean;

  @ApiPropertyOptional({ example: 'NEW' })
  @IsString()
  @IsOptional()
  badge?: string;
}

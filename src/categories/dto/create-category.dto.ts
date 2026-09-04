import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Fresh Vegetables' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'fresh-vegetables' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ example: 'Farm-fresh organic vegetables straight from the field' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'https://images.unsplash.com/...' })
  @IsString()
  @IsNotEmpty()
  image: string;

  @ApiPropertyOptional({ example: 'bg-emerald-50 text-emerald-800 border-emerald-100' })
  @IsString()
  @IsOptional()
  bgColor?: string;
}

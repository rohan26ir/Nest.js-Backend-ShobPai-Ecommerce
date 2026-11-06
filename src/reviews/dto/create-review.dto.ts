import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: 'prod-1' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Great product, fresh and high quality!' })
  @IsString()
  @IsNotEmpty()
  comment: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  reviewerName?: string;

  @ApiPropertyOptional({ example: 'https://...' })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({ example: 'order-123' })
  @IsString()
  @IsOptional()
  orderId?: string;
}


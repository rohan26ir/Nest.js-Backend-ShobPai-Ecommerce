import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ description: 'Quantity', default: 1 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  quantity?: number;
}

export class UpdateCartItemDto {
  @ApiPropertyOptional({ description: 'New quantity' })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ description: 'Delta to add/subtract (-1 or +1)' })
  @IsNumber()
  @IsOptional()
  delta?: number;
}

export class SyncCartItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Quantity', default: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class SyncCartDto {
  @ApiProperty({ description: 'List of cart items from local session', type: [SyncCartItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncCartItemDto)
  items: SyncCartItemDto[];
}

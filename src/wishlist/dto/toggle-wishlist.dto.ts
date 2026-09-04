import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleWishlistDto {
  @ApiProperty({ example: 'prod-1', description: 'Product ID to add or remove' })
  @IsString()
  @IsNotEmpty()
  productId: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class SyncWishlistDto {
  @ApiProperty({ description: 'Array of product IDs saved locally', type: [String] })
  @IsArray()
  @IsString({ each: true })
  productIds: string[];
}

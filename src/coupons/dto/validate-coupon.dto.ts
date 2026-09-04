import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateCouponDto {
  @ApiProperty({ example: 'FRESH2026' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 45.0 })
  @IsNumber()
  @Min(0)
  subtotal: number;
}

import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Rohan Developer' })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/...' })
  @IsString()
  @IsOptional()
  photoURL?: string;

  @ApiPropertyOptional({ example: '+880 1711-000000' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}

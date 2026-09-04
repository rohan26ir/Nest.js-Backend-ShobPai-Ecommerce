import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SyncUserDto {
  @ApiProperty({ example: 'wJICxG_gCu6dnBbwDZhiEHUs123' })
  @IsString()
  @IsNotEmpty()
  firebaseUid: string;

  @ApiPropertyOptional({ example: 'rohan26ir@gmail.com' })
  @IsEmail()
  @IsOptional()
  email?: string | null;

  @ApiPropertyOptional({ example: 'Rohan Developer' })
  @IsString()
  @IsOptional()
  displayName?: string | null;

  @ApiPropertyOptional({ example: '+880 1711-000000' })
  @IsString()
  @IsOptional()
  phoneNumber?: string | null;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/...' })
  @IsString()
  @IsOptional()
  photoURL?: string | null;

  @ApiPropertyOptional({ enum: ['USER', 'ADMIN'], example: 'USER' })
  @IsString()
  @IsOptional()
  role?: 'USER' | 'ADMIN';
}

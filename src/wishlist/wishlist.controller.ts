import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { ToggleWishlistDto } from './dto/toggle-wishlist.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Wishlist')
@Controller('wishlist')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user saved wishlist products' })
  async getMyWishlist(@CurrentUser('id') userId: string) {
    return this.wishlistService.getMyWishlist(userId);
  }

  @Post('toggle')
  @ApiOperation({ summary: 'Toggle product in user wishlist' })
  async toggleWishlist(
    @CurrentUser('id') userId: string,
    @Body() dto: ToggleWishlistDto,
  ) {
    return this.wishlistService.toggleWishlist(userId, dto);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Remove product from wishlist' })
  async removeFromWishlist(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.removeFromWishlist(userId, productId);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync guest wishlist items after login' })
  async syncWishlist(
    @CurrentUser('id') userId: string,
    @Body() dto: { productIds: string[] },
  ) {
    return this.wishlistService.syncWishlist(userId, dto.productIds || []);
  }
}

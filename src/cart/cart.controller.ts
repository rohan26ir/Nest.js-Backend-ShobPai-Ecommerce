import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto, SyncCartDto } from './dto/cart.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user cart items' })
  async getMyCart(@CurrentUser('id') userId: string) {
    return this.cartService.getMyCart(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Add product to cart or increment quantity' })
  async addToCart(
    @CurrentUser('id') userId: string,
    @Body() dto: AddToCartDto,
  ) {
    return this.cartService.addToCart(userId, dto);
  }

  @Patch(':productId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  async updateQuantity(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateQuantity(userId, productId, dto);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Remove product from cart' })
  async removeFromCart(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeFromCart(userId, productId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all items in cart' })
  async clearCart(@CurrentUser('id') userId: string) {
    return this.cartService.clearCart(userId);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync/merge guest cart items after login' })
  async syncCart(
    @CurrentUser('id') userId: string,
    @Body() dto: SyncCartDto,
  ) {
    return this.cartService.syncCart(userId, dto);
  }
}

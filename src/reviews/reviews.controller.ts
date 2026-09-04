import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all product reviews or filter by product_id' })
  async getReviews(@Query('product_id') productId?: string) {
    return this.reviewsService.getReviews(productId);
  }

  @Get('my')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get reviews submitted by authenticated user' })
  async getMyReviews(@CurrentUser('id') userId: string) {
    return this.reviewsService.getMyReviews(userId);
  }

  @Get('can-review/:productId')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if user purchased product and can review' })
  async canReview(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.reviewsService.canUserReview(userId, productId);
  }

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a product review (verified buyers only)' })
  async createReview(
    @CurrentUser('id') userId: string,
    @Body() dto: { productId: string; rating: number; comment: string; reviewerName?: string; avatar?: string },
  ) {
    return this.reviewsService.createReview(userId, dto);
  }

  @Patch(':id/reply')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin reply to a review' })
  async replyReview(
    @CurrentUser('role') role: string,
    @Param('id') id: string,
    @Body() body: { reply: string },
  ) {
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can reply to reviews');
    }
    return this.reviewsService.replyReview(id, body.reply);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review' })
  async deleteReview(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') id: string,
  ) {
    return this.reviewsService.deleteReview(userId, id, role === 'ADMIN');
  }
}

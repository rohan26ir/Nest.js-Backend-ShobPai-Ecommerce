import {
  Controller,
  Get,
  Put,
  Patch,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Admin Operations')
@Controller('admin')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get overall platform statistics and recent orders' })
  async getOverview() {
    return this.adminService.getOverview();
  }

  @Get('monthly-goal')
  @ApiOperation({ summary: 'Get current monthly goal settings and real-time progress' })
  async getMonthlyGoal() {
    return this.adminService.getMonthlyGoal();
  }

  @Put('monthly-goal')
  @ApiOperation({ summary: 'Update monthly goal target and preferences' })
  async updateMonthlyGoal(
    @Body() body: { target: number; targetOrders?: number; month?: string },
  ) {
    if (!body.target || isNaN(Number(body.target)) || Number(body.target) <= 0) {
      throw new BadRequestException('Valid target revenue amount is required');
    }
    return this.adminService.updateMonthlyGoal(body);
  }

  @Get('products/stats')
  @ApiOperation({ summary: 'Get aggregated product statistics across timeframes' })
  async getProductStats() {
    return this.adminService.getProductStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get list of registered users with stats' })
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role (promote/demote)' })
  async updateUserRole(
    @Param('id') id: string,
    @Body('role') role: Role,
  ) {
    if (!role || !Object.values(Role).includes(role)) {
      throw new BadRequestException(`Invalid role. Allowed values: ${Object.values(Role).join(', ')}`);
    }
    return this.adminService.updateUserRole(id, role);
  }
}

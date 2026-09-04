import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { OptionalAuthGuard } from './guards/optional-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, FirebaseAuthGuard, OptionalAuthGuard, RolesGuard],
  exports: [AuthService, FirebaseAuthGuard, OptionalAuthGuard, RolesGuard],
})
export class AuthModule {}

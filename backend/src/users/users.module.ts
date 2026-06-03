import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersMaintenanceScheduler } from './users-maintenance.scheduler';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersMaintenanceScheduler],
  exports: [UsersService],
})
export class UsersModule {}

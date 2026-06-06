import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { OrganizerService } from './organizer.service';
import { OrganizerController } from './organizer.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [FinanceController, OrganizerController],
  providers: [FinanceService, OrganizerService],
  exports: [FinanceService, OrganizerService],
})
export class FinanceModule {}

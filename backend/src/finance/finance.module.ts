import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { OrganizerService } from './organizer.service';
import { OrganizerController } from './organizer.controller';
import { RecurringTransactionsScheduler } from './recurring-transactions.scheduler';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [FinanceController, OrganizerController],
  providers: [FinanceService, OrganizerService, RecurringTransactionsScheduler],
  exports: [FinanceService, OrganizerService],
})
export class FinanceModule {}

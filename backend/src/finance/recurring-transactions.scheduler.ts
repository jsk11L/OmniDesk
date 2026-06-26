import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { FinanceService } from './finance.service';

/**
 * Materializes due recurring transactions into real Transactions. Runs hourly:
 * recurring cadences are daily-or-coarser, so an hourly tick is ample and keeps
 * occurrences landing close to their scheduled time without per-minute load.
 */
@Injectable()
export class RecurringTransactionsScheduler {
  private readonly logger = new Logger(RecurringTransactionsScheduler.name);
  private running = false;

  constructor(private readonly finance: FinanceService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async tick(): Promise<void> {
    if (this.running) {
      this.logger.warn('Previous tick still running, skipping this run');
      return;
    }
    this.running = true;
    try {
      const created = await this.finance.materializeDueRecurring();
      if (created > 0) {
        this.logger.log(`Materialized ${created} recurring transaction(s)`);
      }
    } catch (err) {
      this.logger.error(
        'Failed to materialize recurring transactions',
        err instanceof Error ? err.stack : err,
      );
    } finally {
      this.running = false;
    }
  }
}

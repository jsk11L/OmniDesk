import { Module } from '@nestjs/common';

import { ImporterController } from './importer.controller';
import { ImporterService } from './importer.service';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [UploadsModule],
  controllers: [ImporterController],
  providers: [ImporterService],
})
export class ImporterModule {}

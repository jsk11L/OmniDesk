import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_GUARD } from '@nestjs/core';
import { join, isAbsolute } from 'path';

import { AppController } from './app.controller';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { MailModule } from './mail/mail.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ThemesModule } from './themes/themes.module';
import { CalendarModule } from './calendar/calendar.module';
import { NotesModule } from './notes/notes.module';
import { TodosModule } from './todos/todos.module';
import { ListsModule } from './lists/lists.module';
import { FinanceModule } from './finance/finance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UploadsModule } from './uploads/uploads.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HabitsModule } from './habits/habits.module';
import { AdminModule } from './admin/admin.module';
import { ExporterModule } from './exporter/exporter.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      validate: validateEnv,
    }),
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uploadsDir = config.get<string>('UPLOADS_DIR', './uploads');
        const rootPath = isAbsolute(uploadsDir) ? uploadsDir : join(process.cwd(), uploadsDir);
        return [{ rootPath, serveRoot: config.get<string>('UPLOADS_BASE_URL', '/uploads') }];
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 15 * 60 * 1000,
        limit: 100,
      },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuditModule,
    MailModule,
    UsersModule,
    AuthModule,
    ThemesModule,
    CalendarModule,
    NotesModule,
    TodosModule,
    ListsModule,
    FinanceModule,
    NotificationsModule,
    UploadsModule,
    DashboardModule,
    HabitsModule,
    AdminModule,
    ExporterModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

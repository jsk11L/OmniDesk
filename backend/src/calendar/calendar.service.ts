import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CalendarEvent, CalendarEventNotification, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { AttachEventNotificationDto } from './dto/attach-notification.dto';

export interface ListEventsParams {
  start?: string;
  end?: string;
}

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, params: ListEventsParams): Promise<CalendarEvent[]> {
    const where: Prisma.CalendarEventWhereInput = { userId };

    if (params.start || params.end) {
      const and: Prisma.CalendarEventWhereInput[] = [];
      if (params.start) {
        and.push({ endDate: { gte: new Date(params.start) } });
      }
      if (params.end) {
        and.push({ startDate: { lte: new Date(params.end) } });
      }
      where.AND = and;
    }

    return this.prisma.calendarEvent.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: { notifications: true },
    });
  }

  async findById(userId: string, id: string): Promise<CalendarEvent> {
    const event = await this.prisma.calendarEvent.findFirst({
      where: { id, userId },
      include: { notifications: true },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  create(userId: string, dto: CreateEventDto): Promise<CalendarEvent> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate < startDate) {
      throw new BadRequestException('endDate must be >= startDate');
    }
    return this.prisma.calendarEvent.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description ?? null,
        startDate,
        endDate,
        allDay: dto.allDay ?? false,
        color: dto.color ?? '#6366f1',
        location: dto.location ?? null,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateEventDto): Promise<CalendarEvent> {
    const event = await this.findById(userId, id);

    const startDate = dto.startDate ? new Date(dto.startDate) : event.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : event.endDate;
    if (endDate < startDate) {
      throw new BadRequestException('endDate must be >= startDate');
    }

    return this.prisma.calendarEvent.update({
      where: { id },
      data: {
        title: dto.title ?? event.title,
        description: dto.description ?? event.description,
        startDate,
        endDate,
        allDay: dto.allDay ?? event.allDay,
        color: dto.color ?? event.color,
        location: dto.location ?? event.location,
      },
    });
  }

  async delete(userId: string, id: string): Promise<{ id: string }> {
    await this.findById(userId, id);
    await this.prisma.calendarEvent.delete({ where: { id } });
    return { id };
  }

  async attachNotification(
    userId: string,
    eventId: string,
    dto: AttachEventNotificationDto,
  ): Promise<CalendarEventNotification> {
    await this.findById(userId, eventId);

    const notification = await this.prisma.notificationConfig.findFirst({
      where: { id: dto.notificationId, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification config not found');
    }

    return this.prisma.calendarEventNotification.create({
      data: {
        eventId,
        notificationId: dto.notificationId,
        minutesBefore: dto.minutesBefore ?? 15,
      },
    });
  }

  async detachNotification(
    userId: string,
    eventId: string,
    entryId: string,
  ): Promise<{ id: string }> {
    await this.findById(userId, eventId);

    const entry = await this.prisma.calendarEventNotification.findFirst({
      where: { id: entryId, eventId },
    });
    if (!entry) {
      throw new NotFoundException('Notification link not found');
    }

    await this.prisma.calendarEventNotification.delete({ where: { id: entryId } });
    return { id: entryId };
  }
}

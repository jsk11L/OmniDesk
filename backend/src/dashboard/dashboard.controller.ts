import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import { DashboardConfigDto } from './dto/dashboard-config.dto';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  async getDashboard(@CurrentUser() user: AuthUser) {
    const data = await this.service.getDashboard(user.id);
    return { data };
  }

  @Get('config')
  async getConfig(@CurrentUser() user: AuthUser) {
    const data = await this.service.getConfig(user.id);
    return { data };
  }

  @Put('config')
  async saveConfig(@CurrentUser() user: AuthUser, @Body() dto: DashboardConfigDto) {
    const data = await this.service.saveConfig(user.id, dto);
    return { data };
  }
}

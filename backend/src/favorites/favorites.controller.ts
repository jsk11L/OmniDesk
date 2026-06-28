import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FavoriteKind } from '@prisma/client';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.favorites.list(user.id);
  }

  @Post()
  add(@CurrentUser() user: AuthUser, @Body() dto: CreateFavoriteDto) {
    return this.favorites.add(user.id, dto.kind, dto.entityId);
  }

  @Delete(':kind/:entityId')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('kind') kind: FavoriteKind,
    @Param('entityId', ParseUUIDPipe) entityId: string,
  ) {
    return this.favorites.remove(user.id, kind, entityId);
  }
}

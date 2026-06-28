import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { SearchService, type SearchResult, type SearchType } from './search.service';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  query(
    @CurrentUser() user: AuthUser,
    @Query('q') q = '',
    @Query('types') types?: string,
  ): Promise<SearchResult[]> {
    const parsed = types
      ? (types.split(',').map((s) => s.trim()).filter(Boolean) as SearchType[])
      : undefined;
    return this.search.search(user.id, q ?? '', parsed);
  }
}

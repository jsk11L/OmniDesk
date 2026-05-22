import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import {
  OrganizerService,
  type ContributionInput,
  type PlannedPurchaseInput,
  type SavingsGoalInput,
  type WishlistInput,
} from './organizer.service';

@UseGuards(JwtAuthGuard)
@Controller('finance')
export class OrganizerController {
  constructor(private readonly organizer: OrganizerService) {}

  // ─── Wishlist ─────
  @Get('boards/:boardId/wishlist')
  listWishlist(@CurrentUser() u: AuthUser, @Param('boardId', ParseUUIDPipe) boardId: string) {
    return this.organizer.listWishlist(u.id, boardId);
  }

  @Post('boards/:boardId/wishlist')
  createWishlist(
    @CurrentUser() u: AuthUser,
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Body() dto: WishlistInput,
  ) {
    return this.organizer.createWishlist(u.id, boardId, dto);
  }

  @Patch('wishlist/:id')
  updateWishlist(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<WishlistInput> & { isArchived?: boolean },
  ) {
    return this.organizer.updateWishlist(u.id, id, dto);
  }

  @Delete('wishlist/:id')
  deleteWishlist(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.organizer.deleteWishlist(u.id, id);
  }

  // ─── Planned Purchases ─────
  @Get('boards/:boardId/planned-purchases')
  listPlanned(@CurrentUser() u: AuthUser, @Param('boardId', ParseUUIDPipe) boardId: string) {
    return this.organizer.listPlannedPurchases(u.id, boardId);
  }

  @Post('boards/:boardId/planned-purchases')
  createPlanned(
    @CurrentUser() u: AuthUser,
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Body() dto: PlannedPurchaseInput,
  ) {
    return this.organizer.createPlannedPurchase(u.id, boardId, dto);
  }

  @Patch('planned-purchases/:id')
  updatePlanned(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<PlannedPurchaseInput> & { isPurchased?: boolean; createTransaction?: boolean },
  ) {
    return this.organizer.updatePlannedPurchase(u.id, id, dto);
  }

  @Delete('planned-purchases/:id')
  deletePlanned(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.organizer.deletePlannedPurchase(u.id, id);
  }

  // ─── Savings Goals ─────
  @Get('boards/:boardId/savings-goals')
  listGoals(@CurrentUser() u: AuthUser, @Param('boardId', ParseUUIDPipe) boardId: string) {
    return this.organizer.listSavingsGoals(u.id, boardId);
  }

  @Post('boards/:boardId/savings-goals')
  createGoal(
    @CurrentUser() u: AuthUser,
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Body() dto: SavingsGoalInput,
  ) {
    return this.organizer.createSavingsGoal(u.id, boardId, dto);
  }

  @Patch('savings-goals/:id')
  updateGoal(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<SavingsGoalInput>,
  ) {
    return this.organizer.updateSavingsGoal(u.id, id, dto);
  }

  @Delete('savings-goals/:id')
  deleteGoal(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.organizer.deleteSavingsGoal(u.id, id);
  }

  @Post('savings-goals/:id/contributions')
  addContribution(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ContributionInput,
  ) {
    return this.organizer.addContribution(u.id, id, dto);
  }

  @Delete('contributions/:id')
  deleteContribution(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.organizer.deleteContribution(u.id, id);
  }
}

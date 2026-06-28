import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { FinanceService } from './finance.service';
import { CreateFinanceBoardDto } from './dto/create-finance-board.dto';
import { UpdateFinanceBoardDto } from './dto/update-finance-board.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';

@UseGuards(JwtAuthGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  // ─── Boards ──────────────────────────────────────────────

  @Get('boards')
  listBoards(@CurrentUser() user: AuthUser) {
    return this.finance.listBoards(user.id);
  }

  @Post('boards')
  createBoard(@CurrentUser() user: AuthUser, @Body() dto: CreateFinanceBoardDto) {
    return this.finance.createBoard(user.id, dto);
  }

  @Get('boards/:id')
  findBoard(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.finance.findBoardById(user.id, id);
  }

  @Patch('boards/:id')
  updateBoard(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFinanceBoardDto,
  ) {
    return this.finance.updateBoard(user.id, id, dto);
  }

  @Delete('boards/:id')
  deleteBoard(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.finance.deleteBoard(user.id, id);
  }

  // ─── Categories ──────────────────────────────────────────

  @Post('boards/:id/categories')
  createCategory(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) boardId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.finance.createCategory(user.id, boardId, dto);
  }

  @Patch('boards/:id/categories/:catId')
  updateCategory(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) boardId: string,
    @Param('catId', ParseUUIDPipe) catId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.finance.updateCategory(user.id, boardId, catId, dto);
  }

  @Delete('boards/:id/categories/:catId')
  deleteCategory(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) boardId: string,
    @Param('catId', ParseUUIDPipe) catId: string,
  ) {
    return this.finance.deleteCategory(user.id, boardId, catId);
  }

  // ─── Transactions ────────────────────────────────────────

  @Get('boards/:id/transactions')
  listTransactions(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) boardId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.finance.listTransactions(user.id, boardId, {
      start,
      end,
      type,
      category,
      page,
      limit,
    });
  }

  @Post('boards/:id/transactions')
  createTransaction(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) boardId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.finance.createTransaction(user.id, boardId, dto);
  }

  @Patch('boards/:id/transactions/:txId')
  updateTransaction(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) boardId: string,
    @Param('txId', ParseUUIDPipe) txId: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.finance.updateTransaction(user.id, boardId, txId, dto);
  }

  @Delete('boards/:id/transactions/:txId')
  deleteTransaction(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) boardId: string,
    @Param('txId', ParseUUIDPipe) txId: string,
  ) {
    return this.finance.deleteTransaction(user.id, boardId, txId);
  }

  // ─── Budgets ─────────────────────────────────────────────

  @Post('boards/:id/budgets')
  createBudget(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) boardId: string,
    @Body() dto: CreateBudgetDto,
  ) {
    return this.finance.createBudget(user.id, boardId, dto);
  }

  @Patch('boards/:id/budgets/:budId')
  updateBudget(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) boardId: string,
    @Param('budId', ParseUUIDPipe) budId: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.finance.updateBudget(user.id, boardId, budId, dto);
  }

  @Delete('boards/:id/budgets/:budId')
  deleteBudget(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) boardId: string,
    @Param('budId', ParseUUIDPipe) budId: string,
  ) {
    return this.finance.deleteBudget(user.id, boardId, budId);
  }

  // ─── Recurring transactions ──────────────────────────────

  @Get('boards/:id/recurring')
  listRecurring(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) boardId: string,
  ) {
    return this.finance.listRecurring(user.id, boardId);
  }

  @Post('boards/:id/recurring')
  createRecurring(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) boardId: string,
    @Body() dto: CreateRecurringTransactionDto,
  ) {
    return this.finance.createRecurring(user.id, boardId, dto);
  }

  @Patch('boards/:id/recurring/:recId')
  updateRecurring(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) boardId: string,
    @Param('recId', ParseUUIDPipe) recId: string,
    @Body() dto: UpdateRecurringTransactionDto,
  ) {
    return this.finance.updateRecurring(user.id, boardId, recId, dto);
  }

  @Delete('boards/:id/recurring/:recId')
  deleteRecurring(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) boardId: string,
    @Param('recId', ParseUUIDPipe) recId: string,
  ) {
    return this.finance.deleteRecurring(user.id, boardId, recId);
  }

  // ─── Summary ─────────────────────────────────────────────

  @Get('boards/:id/summary')
  summary(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) boardId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.finance.summary(user.id, boardId, { start, end });
  }
}

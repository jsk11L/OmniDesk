import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';

import {
  AuthService,
  PublicUser,
  RequestMeta,
  TokenPair,
  TwoFactorChallenge,
} from './auth.service';
import { CaptchaService } from './captcha.service';
import { TwoFactorService, TwoFactorSetup } from './two-factor.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { RestoreAccountDto } from './dto/restore-account.dto';
import { TwoFactorCodeDto, TwoFactorLoginDto } from './dto/two-factor.dto';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

function requestMeta(req: Request): RequestMeta {
  return {
    ipAddress: req.ip ?? null,
    userAgent: req.headers['user-agent'] ?? null,
  };
}

@Throttle({ default: { limit: 10, ttl: 15 * 60 * 1000 } })
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly captcha: CaptchaService,
    private readonly twoFactor: TwoFactorService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto, @Req() req: Request): Promise<{ message: string }> {
    await this.captcha.verify(dto.captchaToken, req.ip);
    return this.auth.register(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ message: string }> {
    return this.auth.verifyEmail(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<TokenPair | TwoFactorChallenge> {
    return this.auth.login(dto);
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  twoFactorLogin(@Body() dto: TwoFactorLoginDto): Promise<TokenPair> {
    return this.auth.twoFactorLogin(dto.tempToken, dto.code);
  }

  @Get('2fa/status')
  @UseGuards(JwtAuthGuard)
  twoFactorStatus(@CurrentUser() user: AuthUser): Promise<{ enabled: boolean }> {
    return this.twoFactor.status(user.id);
  }

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  twoFactorSetup(@CurrentUser() user: AuthUser): Promise<TwoFactorSetup> {
    return this.twoFactor.setup(user.id);
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  twoFactorEnable(
    @CurrentUser() user: AuthUser,
    @Body() dto: TwoFactorCodeDto,
  ): Promise<{ backupCodes: string[] }> {
    return this.twoFactor.enable(user.id, dto.code);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  twoFactorDisable(
    @CurrentUser() user: AuthUser,
    @Body() dto: TwoFactorCodeDto,
  ): Promise<{ message: string }> {
    return this.twoFactor.disable(user.id, dto.code);
  }

  @Post('2fa/regenerate-backup-codes')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  twoFactorRegenerate(
    @CurrentUser() user: AuthUser,
    @Body() dto: TwoFactorCodeDto,
  ): Promise<{ backupCodes: string[] }> {
    return this.twoFactor.regenerateBackupCodes(user.id, dto.code);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto): Promise<{ accessToken: string }> {
    return this.auth.refresh(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    await this.captcha.verify(dto.captchaToken, req.ip);
    return this.auth.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.auth.resetPassword(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser): Promise<PublicUser> {
    return this.auth.me(user.id);
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  deleteAccount(
    @CurrentUser() user: AuthUser,
    @Body() dto: DeleteAccountDto,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    return this.auth.deleteAccount(user.id, dto.password, requestMeta(req));
  }

  @Post('restore-account')
  @HttpCode(HttpStatus.OK)
  restoreAccount(@Body() dto: RestoreAccountDto): Promise<{ message: string }> {
    return this.auth.restoreAccount(dto.token);
  }
}

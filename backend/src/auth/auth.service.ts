import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import type { User } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { AuditLogService } from '../audit/audit-log.service';
import { TwoFactorService } from './two-factor.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { JwtPayload } from './jwt.strategy';

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export interface RequestMeta {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface PublicUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  isAdmin: boolean;
  activeThemeId: string | null;
  createdAt: Date;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TwoFactorChallenge {
  requires2FA: true;
  tempToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly mail: MailService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditLogService,
    private readonly twoFactor: TwoFactorService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // The very first account on a fresh instance becomes the admin and is
    // always allowed (needed to bootstrap the instance).
    const isFirstUser = (await this.prisma.user.count()) === 0;

    // Honour a closed-registration instance (REGISTRATION_OPEN=false).
    if (!isFirstUser && this.config.get<boolean>('REGISTRATION_OPEN', true) === false) {
      throw new ForbiddenException('Registration is currently closed on this instance');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const verificationToken = randomUUID();

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          displayName: dto.displayName ?? null,
          verificationToken,
          isEmailVerified: false,
          isAdmin: isFirstUser,
          acceptedTermsAt: new Date(),
          termsVersion: this.config.get<string>('TERMS_VERSION', '2026-06'),
        },
      });

      await this.users.seedDefaultsForNewUser(created.id, tx);
      return created;
    });

    try {
      await this.mail.sendVerificationEmail(user.email, verificationToken, user.displayName);
    } catch (err) {
      this.logger.error(`Failed to send verification email to ${user.email}`, err as Error);
    }

    return { message: 'Verification email sent' };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: { verificationToken: dto.token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationToken: null,
      },
    });

    return { message: 'Account verified' };
  }

  async login(dto: LoginDto): Promise<TokenPair | TwoFactorChallenge> {
    const user = await this.users.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.deletedAt) {
      throw new ForbiddenException('This account has been deactivated');
    }
    if (user.isSuspended) {
      throw new ForbiddenException('This account is suspended');
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException('Too many failed attempts. Try again later.');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      await this.registerFailedLogin(user.id, user.failedLoginAttempts);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException('Email not verified');
    }

    // Password is correct: clear the lockout counters.
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    // If 2FA is enabled, issue a short-lived challenge token instead of a session.
    if (user.totpEnabledAt) {
      const tempToken = await this.jwt.signAsync(
        { sub: user.id, purpose: '2fa' },
        { secret: this.config.getOrThrow<string>('JWT_SECRET'), expiresIn: '5m' },
      );
      return { requires2FA: true, tempToken };
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return this.issueTokens(user);
  }

  async twoFactorLogin(tempToken: string, code: string): Promise<TokenPair> {
    let payload: { sub: string; purpose?: string };
    try {
      payload = await this.jwt.verifyAsync(tempToken, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired 2FA session');
    }
    if (payload.purpose !== '2fa') {
      throw new UnauthorizedException('Invalid 2FA session');
    }
    const user = await this.users.findById(payload.sub);
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid 2FA session');
    }
    if (user.isSuspended) {
      throw new ForbiddenException('This account is suspended');
    }
    const ok = await this.twoFactor.verifyCode(user.id, code);
    if (!ok) {
      throw new UnauthorizedException('Invalid verification code');
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return this.issueTokens(user);
  }

  private async registerFailedLogin(userId: string, current: number): Promise<void> {
    const attempts = current + 1;
    if (attempts >= MAX_FAILED_LOGINS) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { failedLoginAttempts: 0, lockedUntil: new Date(Date.now() + LOCKOUT_MS) },
      });
    } else {
      await this.prisma.user.update({
        where: { id: userId },
        data: { failedLoginAttempts: attempts },
      });
    }
  }

  async deleteAccount(userId: string, password: string, meta?: RequestMeta): Promise<{ message: string }> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date() } });

    const graceDays = Number(this.config.get('SOFT_DELETE_DAYS', 30)) || 30;
    const token = await this.jwt.signAsync(
      { sub: userId, purpose: 'restore' },
      { secret: this.config.getOrThrow<string>('JWT_SECRET'), expiresIn: `${graceDays}d` },
    );
    const restoreUrl = `${this.config.get<string>('FRONTEND_URL', 'http://localhost:4200')}/auth/restore?token=${encodeURIComponent(token)}`;
    try {
      await this.mail.sendAccountDeletionEmail(user.email, restoreUrl, user.displayName, graceDays);
    } catch (err) {
      this.logger.error(`Failed to send deletion email to ${user.email}`, err as Error);
    }

    await this.audit.log({
      userId,
      action: 'user.soft_deleted',
      entityType: 'User',
      entityId: userId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return {
      message: `Account scheduled for deletion. You have ${graceDays} days to restore it via the link we emailed you.`,
    };
  }

  async restoreAccount(token: string): Promise<{ message: string }> {
    let payload: { sub: string; purpose?: string };
    try {
      payload = await this.jwt.verifyAsync(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new BadRequestException('Invalid or expired restore token');
    }
    if (payload.purpose !== 'restore') {
      throw new BadRequestException('Invalid restore token');
    }
    const user = await this.users.findById(payload.sub);
    if (!user) {
      throw new BadRequestException('Invalid restore token');
    }
    if (!user.deletedAt) {
      return { message: 'Account is already active' };
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { deletedAt: null } });
    await this.audit.log({
      userId: user.id,
      action: 'user.restored',
      entityType: 'User',
      entityId: user.id,
    });
    return { message: 'Account restored. You can now sign in.' };
  }

  async refresh(dto: RefreshDto): Promise<{ accessToken: string }> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(dto.refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.users.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const accessToken = await this.signAccessToken(user);
    return { accessToken };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.users.findByEmail(dto.email);

    if (user) {
      const token = randomUUID();
      const expiry = new Date(Date.now() + RESET_TOKEN_TTL_MS);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: token,
          resetPasswordExpiry: expiry,
        },
      });

      try {
        await this.mail.sendPasswordResetEmail(user.email, token, user.displayName);
      } catch (err) {
        this.logger.error(`Failed to send password reset email to ${user.email}`, err as Error);
      }
    }

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: dto.token,
        resetPasswordExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
      },
    });

    return { message: 'Password updated' };
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.toPublic(user);
  }

  private async issueTokens(user: User): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(user),
      this.signRefreshToken(user),
    ]);
    return { accessToken, refreshToken };
  }

  private signAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
    });
  }

  private signRefreshToken(user: User): Promise<string> {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });
  }

  private toPublic(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      isEmailVerified: user.isEmailVerified,
      isAdmin: user.isAdmin,
      activeThemeId: user.activeThemeId,
      createdAt: user.createdAt,
    };
  }
}

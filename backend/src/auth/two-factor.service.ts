import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';

const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_ROUNDS = 10;
const ISSUER = 'OmniDesk';

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
}

@Injectable()
export class TwoFactorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async status(userId: string): Promise<{ enabled: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totpEnabledAt: true },
    });
    return { enabled: !!user?.totpEnabledAt };
  }

  /** Generate a secret and QR. Stored but not active until confirmed via enable(). */
  async setup(userId: string): Promise<TwoFactorSetup> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, totpEnabledAt: true },
    });
    if (!user) throw new UnauthorizedException();
    if (user.totpEnabledAt) {
      throw new BadRequestException('Two-factor is already enabled. Disable it first to re-setup.');
    }
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, ISSUER, secret);
    await this.prisma.user.update({ where: { id: userId }, data: { totpSecret: secret } });
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
    return { secret, otpauthUrl, qrDataUrl };
  }

  /** Confirm the code, activate 2FA, and return one-time backup codes. */
  async enable(userId: string, code: string): Promise<{ backupCodes: string[] }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totpSecret: true, totpEnabledAt: true },
    });
    if (!user?.totpSecret) throw new BadRequestException('Run setup before enabling two-factor');
    if (user.totpEnabledAt) throw new BadRequestException('Two-factor is already enabled');
    if (!authenticator.verify({ token: code, secret: user.totpSecret })) {
      throw new BadRequestException('Invalid verification code');
    }
    const backupCodes = this.generateBackupCodes();
    const hashed = await Promise.all(backupCodes.map((c) => bcrypt.hash(c, BACKUP_CODE_ROUNDS)));
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabledAt: new Date(), totpBackupCodes: hashed },
    });
    await this.audit.log({ userId, action: 'user.2fa_enabled', entityType: 'User', entityId: userId });
    return { backupCodes };
  }

  async disable(userId: string, code: string): Promise<{ message: string }> {
    const ok = await this.verifyCode(userId, code);
    if (!ok) throw new BadRequestException('Invalid verification code');
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: null, totpEnabledAt: null, totpBackupCodes: [] },
    });
    await this.audit.log({ userId, action: 'user.2fa_disabled', entityType: 'User', entityId: userId });
    return { message: 'Two-factor authentication disabled' };
  }

  async regenerateBackupCodes(userId: string, code: string): Promise<{ backupCodes: string[] }> {
    const ok = await this.verifyCode(userId, code);
    if (!ok) throw new BadRequestException('Invalid verification code');
    const backupCodes = this.generateBackupCodes();
    const hashed = await Promise.all(backupCodes.map((c) => bcrypt.hash(c, BACKUP_CODE_ROUNDS)));
    await this.prisma.user.update({ where: { id: userId }, data: { totpBackupCodes: hashed } });
    return { backupCodes };
  }

  /** Verify a TOTP token or consume a backup code. Used during login and changes. */
  async verifyCode(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totpSecret: true, totpBackupCodes: true },
    });
    if (!user?.totpSecret) return false;
    const normalized = code.trim();
    if (authenticator.verify({ token: normalized, secret: user.totpSecret })) {
      return true;
    }
    // Try backup codes (one-time use).
    for (const hash of user.totpBackupCodes) {
      if (await bcrypt.compare(normalized, hash)) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { totpBackupCodes: user.totpBackupCodes.filter((h) => h !== hash) },
        });
        return true;
      }
    }
    return false;
  }

  private generateBackupCodes(): string[] {
    return Array.from({ length: BACKUP_CODE_COUNT }, () => {
      const raw = randomBytes(4).toString('hex'); // 8 hex chars
      return `${raw.slice(0, 4)}-${raw.slice(4)}`;
    });
  }
}

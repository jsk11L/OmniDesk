import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verifies a human-challenge token. Provider-agnostic with a Cloudflare
 * Turnstile implementation; when CAPTCHA_PROVIDER=none (dev/self-host default)
 * verification is skipped entirely.
 */
@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);
  private readonly provider: string;
  private readonly secret: string;

  constructor(config: ConfigService) {
    this.provider = config.get<string>('CAPTCHA_PROVIDER', 'none');
    this.secret = config.get<string>('CAPTCHA_SECRET', '');
  }

  get enabled(): boolean {
    return this.provider !== 'none';
  }

  async verify(token: string | undefined, ip?: string | null): Promise<void> {
    if (!this.enabled) return;

    if (!token) {
      throw new BadRequestException('Captcha verification is required');
    }

    if (this.provider === 'turnstile') {
      const ok = await this.verifyTurnstile(token, ip);
      if (!ok) throw new BadRequestException('Captcha verification failed');
    }
  }

  private async verifyTurnstile(token: string, ip?: string | null): Promise<boolean> {
    try {
      const body = new URLSearchParams({ secret: this.secret, response: token });
      if (ip) body.set('remoteip', ip);
      const res = await fetch(TURNSTILE_VERIFY_URL, { method: 'POST', body });
      const json = (await res.json()) as { success?: boolean };
      return json.success === true;
    } catch (err) {
      this.logger.error('Turnstile verification request failed', err as Error);
      // Fail closed: a verification outage must not let challenges through.
      return false;
    }
  }
}

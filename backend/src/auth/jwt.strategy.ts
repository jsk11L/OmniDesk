import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from '../users/users.service';

export interface JwtPayload {
  sub: string;
  email: string;
}

interface CachedStatus {
  result: { id: string; email: string } | 'unauthorized' | 'suspended';
  expiresAt: number;
}

/**
 * How long a user's existence/suspension status may be served from memory.
 * Every guarded request used to hit the DB — with Neon's latency that doubled
 * the cost of each API call. Tradeoff: a suspension/deletion takes up to this
 * long to start rejecting requests (was: instant).
 */
const STATUS_CACHE_TTL_MS = 30_000;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly statusCache = new Map<string, CachedStatus>();

  constructor(config: ConfigService, private readonly users: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<{ id: string; email: string }> {
    const now = Date.now();
    let cached = this.statusCache.get(payload.sub);

    if (!cached || cached.expiresAt <= now) {
      const user = await this.users.findById(payload.sub);
      const result: CachedStatus['result'] =
        !user || user.deletedAt
          ? 'unauthorized'
          : user.isSuspended
            ? 'suspended'
            : { id: user.id, email: user.email };
      cached = { result, expiresAt: now + STATUS_CACHE_TTL_MS };
      this.statusCache.set(payload.sub, cached);

      // Opportunistic pruning so the map doesn't grow unbounded.
      if (this.statusCache.size > 10_000) {
        for (const [key, entry] of this.statusCache) {
          if (entry.expiresAt <= now) this.statusCache.delete(key);
        }
      }
    }

    if (cached.result === 'unauthorized') {
      throw new UnauthorizedException('Invalid token subject');
    }
    if (cached.result === 'suspended') {
      throw new ForbiddenException('This account is suspended');
    }
    return cached.result;
  }
}

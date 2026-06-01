import { z } from 'zod';

/**
 * Single source of truth for the backend's environment contract (Principle 2:
 * dev-prod parity, validated at boot). The schema is parsed by `validateEnv`,
 * which is wired into `ConfigModule.forRoot({ validate })` so a missing or
 * malformed variable fails the boot loudly instead of surfacing at runtime.
 *
 * Unknown keys are passed through (process.env carries far more than this), and
 * the variables we own are coerced to their proper types and defaulted.
 */
const PLACEHOLDER = /change[_-]?me|^secret$|^changeme$|example/i;

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

    JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
    JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    FRONTEND_URL: z.string().url().default('http://localhost:4200'),
    // Just needs to be a stable, non-empty identifier consistent with what the
    // database was seeded with — not necessarily a UUID.
    SEED_SYSTEM_USER_ID: z.string().min(1).default('00000000-0000-0000-0000-000000000001'),

    MAIL_HOST: z.string().optional(),
    MAIL_PORT: z.coerce.number().int().positive().default(465),
    MAIL_USER: z.string().optional(),
    MAIL_PASS: z.string().optional(),
    MAIL_FROM: z.string().optional(),

    UPLOADS_DIR: z.string().default('./uploads'),
    UPLOADS_BASE_URL: z.string().default('/uploads'),
    UPLOADS_MAX_BYTES: z.coerce.number().int().positive().default(5_242_880),

    VAPID_PUBLIC_KEY: z.string().optional(),
    VAPID_PRIVATE_KEY: z.string().optional(),
    VAPID_SUBJECT: z.string().optional(),

    SOFT_DELETE_DAYS: z.coerce.number().int().nonnegative().default(30),
  })
  .passthrough()
  .superRefine((env, ctx) => {
    // Stricter guarantees once we are running for real users.
    if (env.NODE_ENV !== 'production') return;

    for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET'] as const) {
      if (PLACEHOLDER.test(env[key])) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${key} looks like a placeholder; set a real secret in production`,
        });
      }
    }

    if (env.JWT_SECRET === env.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_REFRESH_SECRET'],
        message: 'JWT_REFRESH_SECRET must differ from JWT_SECRET',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

/**
 * Validates the raw environment. Throws with an aggregated, human-readable
 * message listing every offending variable so misconfiguration is obvious.
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return result.data;
}

/**
 * Post-migration smoke test (ROADMAP §5.4).
 *
 * Verifies the data invariants the app relies on. Intended to run after
 * `prisma migrate deploy` and before the server accepts traffic (wired into the
 * Docker entrypoint in Block 1). Any failed invariant => exit code 1.
 *
 * Run locally with: `pnpm smoke`
 */
import { access, constants, mkdir } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';

import { PrismaClient } from '@prisma/client';

// Load .env when running standalone; in containers the env is already present.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();
} catch {
  /* dotenv optional — env provided by the runtime */
}

interface SmokeCheck {
  name: string;
  run: () => Promise<void>;
}

const prisma = new PrismaClient();

const SYSTEM_USER_ID =
  process.env.SEED_SYSTEM_USER_ID ?? '00000000-0000-0000-0000-000000000001';
const EXPECTED_SYSTEM_THEMES = 12;
const UPLOADS_DIR = process.env.UPLOADS_DIR ?? './uploads';

const checks: SmokeCheck[] = [
  {
    name: 'system user exists',
    run: async () => {
      const user = await prisma.user.findUnique({ where: { id: SYSTEM_USER_ID } });
      if (!user) throw new Error(`System user ${SYSTEM_USER_ID} not found — did you seed?`);
    },
  },
  {
    name: `all ${EXPECTED_SYSTEM_THEMES} system themes exist`,
    run: async () => {
      const count = await prisma.theme.count({
        where: { isDefault: true, userId: SYSTEM_USER_ID },
      });
      if (count < EXPECTED_SYSTEM_THEMES) {
        throw new Error(`Expected ${EXPECTED_SYSTEM_THEMES} system themes, found ${count}`);
      }
    },
  },
  {
    name: 'no orphan activeThemeId',
    run: async () => {
      const rows = await prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(*)::int AS count FROM "User" u
        LEFT JOIN "Theme" t ON u."activeThemeId" = t.id
        WHERE u."activeThemeId" IS NOT NULL AND t.id IS NULL
      `;
      if (rows[0].count > 0) {
        throw new Error(`${rows[0].count} user(s) reference a missing activeThemeId`);
      }
    },
  },
  {
    name: 'uploads directory is writable',
    run: async () => {
      // Runs before the server starts, so ensure the directory exists (it is
      // owned by the app) and then confirm we can write to it.
      const dir = isAbsolute(UPLOADS_DIR) ? UPLOADS_DIR : join(process.cwd(), UPLOADS_DIR);
      await mkdir(dir, { recursive: true });
      await access(dir, constants.W_OK);
    },
  },
];

async function main(): Promise<void> {
  let failed = 0;
  for (const check of checks) {
    try {
      await check.run();
      console.log(`  ✓ ${check.name}`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${check.name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (failed > 0) {
    console.error(`\nSmoke test FAILED: ${failed}/${checks.length} invariant(s) broken.`);
    process.exitCode = 1;
  } else {
    console.log(`\n✓ Smoke test passed: ${checks.length}/${checks.length} invariants OK.`);
  }
}

main()
  .catch((err) => {
    console.error('Smoke test crashed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

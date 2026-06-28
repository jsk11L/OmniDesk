/**
 * Public entry point for the @omnidesk/shared package (D-011, Stage 1).
 *
 * Re-exports the TypeScript interfaces generated from the Prisma schema
 * (`backend/prisma/schema.prisma` → `pnpm --filter backend prisma generate`).
 * These are the single source of truth for entity shapes shared with the
 * frontend; dates are strings to match the JSON the REST API sends.
 *
 * Do not edit `generated/models.ts` by hand — it is regenerated.
 */
export * from './generated/models';

import request from 'supertest';

import { TestAppContext, createTestApp } from './helpers/app-factory';
import { TestUser, auth, createVerifiedUser } from './helpers/auth-helpers';
import { UsersMaintenanceScheduler } from '../src/users/users-maintenance.scheduler';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('Block 0 Phase A — plainText + soft-delete cron (e2e)', () => {
  let ctx: TestAppContext;
  let user: TestUser;
  const emails: string[] = [];

  beforeAll(async () => {
    ctx = await createTestApp();
    user = await createVerifiedUser(ctx, 'phasea');
    emails.push(user.email);
  });

  afterAll(async () => {
    if (!ctx) return;
    for (const email of emails) {
      await ctx.prisma.user.deleteMany({ where: { email } });
    }
    await ctx.close();
  });

  const server = () => ctx.app.getHttpServer();

  describe('Note.plainText derivation', () => {
    it('extracts flat text from a TipTap JSON document', async () => {
      const content = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Hello' },
              { type: 'text', text: 'world' },
            ],
          },
          { type: 'paragraph', content: [{ type: 'text', text: 'second line' }] },
        ],
      });

      const res = await request(server())
        .post('/notes')
        .set(...auth(user))
        .send({ title: 'JSON note', content })
        .expect(201);

      expect(res.body.data.plainText).toBe('Hello world second line');
    });

    it('recomputes plainText on update', async () => {
      const created = await request(server())
        .post('/notes')
        .set(...auth(user))
        .send({ title: 'To edit', content: '' })
        .expect(201);
      const id = created.body.data.id;

      const newContent = JSON.stringify({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'updated body' }] }],
      });

      const res = await request(server())
        .patch(`/notes/${id}`)
        .set(...auth(user))
        .send({ content: newContent })
        .expect(200);

      expect(res.body.data.plainText).toBe('updated body');
    });
  });

  describe('Soft-delete purge cron', () => {
    it('hard-deletes accounts past the grace window and spares recent ones', async () => {
      const stale = await createVerifiedUser(ctx, 'phasea-stale');
      const recent = await createVerifiedUser(ctx, 'phasea-recent');
      emails.push(stale.email, recent.email);

      // Default grace window is 30 days.
      await ctx.prisma.user.update({
        where: { id: stale.userId },
        data: { deletedAt: new Date(Date.now() - 31 * DAY_MS) },
      });
      await ctx.prisma.user.update({
        where: { id: recent.userId },
        data: { deletedAt: new Date(Date.now() - 1 * DAY_MS) },
      });

      const scheduler = ctx.app.get(UsersMaintenanceScheduler);
      await scheduler.purgeSoftDeletedAccounts();

      const staleAfter = await ctx.prisma.user.findUnique({ where: { id: stale.userId } });
      const recentAfter = await ctx.prisma.user.findUnique({ where: { id: recent.userId } });
      const activeAfter = await ctx.prisma.user.findUnique({ where: { id: user.userId } });

      expect(staleAfter).toBeNull();
      expect(recentAfter).not.toBeNull();
      expect(activeAfter).not.toBeNull(); // never soft-deleted
    });
  });
});

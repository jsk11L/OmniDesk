import request from 'supertest';

import { TestAppContext, createTestApp } from './helpers/app-factory';
import { TestUser, auth, createVerifiedUser } from './helpers/auth-helpers';

/**
 * Regression tests for the Block 0 sanitation bug fixes (ROADMAP §2.5 / §4.2.1).
 * Each test reproduces the original bug and asserts the corrected behaviour.
 */
describe('Block 0 fixes (e2e)', () => {
  let ctx: TestAppContext;
  let user: TestUser;
  const created: string[] = [];

  beforeAll(async () => {
    ctx = await createTestApp();
    user = await createVerifiedUser(ctx, 'block0');
    created.push(user.email);
  });

  afterAll(async () => {
    if (!ctx) return;
    for (const email of created) {
      await ctx.prisma.user.deleteMany({ where: { email } });
    }
    await ctx.close();
  });

  const server = () => ctx.app.getHttpServer();

  // ── Fix #1: avatarUrl accepts /uploads/ paths ──────────────
  describe('Fix #1 — UpdateUserDto.avatarUrl', () => {
    it('accepts an /uploads/ relative path', async () => {
      const res = await request(server())
        .patch('/users/me')
        .set(...auth(user))
        .send({ avatarUrl: '/uploads/abc/def.webp' })
        .expect(200);
      expect(res.body.data.avatarUrl).toBe('/uploads/abc/def.webp');
    });

    it('accepts an absolute https URL', async () => {
      await request(server())
        .patch('/users/me')
        .set(...auth(user))
        .send({ avatarUrl: 'https://cdn.example.com/a.png' })
        .expect(200);
    });

    it('still rejects a non-url, non-upload string', async () => {
      await request(server())
        .patch('/users/me')
        .set(...auth(user))
        .send({ avatarUrl: 'not-a-url' })
        .expect(400);
    });
  });

  // ── Fix #2: notification iconUrl accepts /uploads/ paths ───
  describe('Fix #2 — NotificationDto.iconUrl', () => {
    it('accepts an /uploads/ path on create', async () => {
      await request(server())
        .post('/notifications')
        .set(...auth(user))
        .send({
          title: 'Reminder',
          message: 'Do the thing',
          triggerType: 'MANUAL',
          channels: ['IN_APP'],
          iconUrl: '/uploads/abc/icon.webp',
        })
        .expect(201);
    });
  });

  // ── Fix #5: TodoColumn.isCompletionColumn ──────────────────
  describe('Fix #5 — isCompletionColumn flag', () => {
    let boardId: string;
    let doneColumnId: string;

    beforeAll(async () => {
      const board = await request(server())
        .post('/todos/boards')
        .set(...auth(user))
        .send({ name: 'Block0 Board' })
        .expect(201);
      boardId = board.body.data.id;

      const col = await request(server())
        .post(`/todos/boards/${boardId}/columns`)
        .set(...auth(user))
        .send({ name: 'Shipped', isCompletionColumn: true })
        .expect(201);
      doneColumnId = col.body.data.id;
    });

    it('persists the flag and exposes it on the board', async () => {
      const res = await request(server())
        .get(`/todos/boards/${boardId}`)
        .set(...auth(user))
        .expect(200);
      const col = res.body.data.columns.find((c: { id: string }) => c.id === doneColumnId);
      expect(col.isCompletionColumn).toBe(true);
    });

    it('dashboard counts a due-today todo in a completion column as completed', async () => {
      await request(server())
        .post(`/todos/boards/${boardId}/columns/${doneColumnId}/items`)
        .set(...auth(user))
        .send({ title: 'Done task', dueDate: new Date().toISOString(), hasDueDate: true })
        .expect(201);

      const dash = await request(server())
        .get('/dashboard')
        .set(...auth(user))
        .expect(200);

      const completedTitles = dash.body.data.todayTodos.completed.map(
        (t: { title: string }) => t.title,
      );
      expect(completedTitles).toContain('Done task');
    });
  });

  // ── Fix #7: habit perfectWeeks ─────────────────────────────
  describe('Fix #7 — perfectWeeks calculation', () => {
    it('counts a fully-elapsed week with all active days done as perfect', async () => {
      // A date 8 days ago is guaranteed to sit in a prior, fully-elapsed week.
      const past = new Date();
      past.setUTCHours(0, 0, 0, 0);
      past.setUTCDate(past.getUTCDate() - 8);
      const dow = past.getUTCDay();

      const habit = await request(server())
        .post('/habits')
        .set(...auth(user))
        .send({ name: 'Read', activeDays: [dow] })
        .expect(201);
      const habitId = habit.body.data.id;

      await request(server())
        .post(`/habits/${habitId}/entries`)
        .set(...auth(user))
        .send({ date: past.toISOString(), status: 'DONE' })
        .expect(201);

      const stats = await request(server())
        .get(`/habits/${habitId}/stats`)
        .set(...auth(user))
        .expect(200);

      expect(stats.body.data.perfectWeeks).toBeGreaterThanOrEqual(1);
    });
  });
});

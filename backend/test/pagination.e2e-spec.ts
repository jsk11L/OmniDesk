import request from 'supertest';

import { TestAppContext, createTestApp } from './helpers/app-factory';
import { TestUser, auth, createVerifiedUser } from './helpers/auth-helpers';

/**
 * Pagination contract (D-012): offset-based ?page=&limit= (default 12, max 50)
 * with meta { page, limit, total, totalPages }. Backward-compatible: with no
 * page/limit the full set is returned.
 */
describe('Pagination — notes (e2e)', () => {
  let ctx: TestAppContext;
  let user: TestUser;

  beforeAll(async () => {
    ctx = await createTestApp();
    user = await createVerifiedUser(ctx, 'pagination');
    // 30 notes.
    for (let i = 0; i < 30; i++) {
      await request(ctx.app.getHttpServer())
        .post('/notes')
        .set(...auth(user))
        .send({ title: `Note ${i.toString().padStart(2, '0')}` })
        .expect(201);
    }
  });

  afterAll(async () => {
    if (!ctx) return;
    await ctx.prisma.user.deleteMany({ where: { email: user.email } });
    await ctx.close();
  });

  const server = () => ctx.app.getHttpServer();

  it('returns the full set with single-page meta when no params are given', async () => {
    const res = await request(server())
      .get('/notes')
      .set(...auth(user))
      .expect(200);
    expect(res.body.data).toHaveLength(30);
    expect(res.body.meta.total).toBe(30);
    expect(res.body.meta.totalPages).toBe(1);
  });

  it('returns the first page of 12 with correct meta', async () => {
    const res = await request(server())
      .get('/notes?page=1&limit=12')
      .set(...auth(user))
      .expect(200);
    expect(res.body.data).toHaveLength(12);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 12, total: 30, totalPages: 3 });
  });

  it('returns the remainder on the last page', async () => {
    const res = await request(server())
      .get('/notes?page=3&limit=12')
      .set(...auth(user))
      .expect(200);
    expect(res.body.data).toHaveLength(6);
    expect(res.body.meta.page).toBe(3);
  });

  it('caps limit at the maximum (50)', async () => {
    const res = await request(server())
      .get('/notes?page=1&limit=999')
      .set(...auth(user))
      .expect(200);
    expect(res.body.meta.limit).toBe(50);
  });
});

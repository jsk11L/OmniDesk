import request from 'supertest';

import { TestAppContext, cleanupUserByEmail, createTestApp } from './helpers/app-factory';

describe('Auth flow (e2e)', () => {
  let ctx: TestAppContext;
  const email = `e2e-auth-${Date.now()}@omnidesk.test`;
  const password = 'Password123!';

  beforeAll(async () => {
    ctx = await createTestApp();
    await cleanupUserByEmail(ctx.prisma, email);
  });

  afterAll(async () => {
    if (ctx) {
      await cleanupUserByEmail(ctx.prisma, email);
      await ctx.close();
    }
  });

  it('rejects unknown body fields (whitelist)', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, hacker: true })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  it('register → verify-email → login → /auth/me happy path', async () => {
    const reg = await request(ctx.app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, displayName: 'E2E Auth' })
      .expect(201);

    expect(reg.body.data.message).toMatch(/verification/i);

    const created = await ctx.prisma.user.findUnique({ where: { email } });
    expect(created).not.toBeNull();
    expect(created!.isEmailVerified).toBe(false);
    expect(created!.verificationToken).not.toBeNull();

    await request(ctx.app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: created!.verificationToken })
      .expect(200);

    const verified = await ctx.prisma.user.findUnique({ where: { email } });
    expect(verified!.isEmailVerified).toBe(true);
    expect(verified!.verificationToken).toBeNull();

    const login = await request(ctx.app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    expect(login.body.data.accessToken).toEqual(expect.any(String));
    expect(login.body.data.refreshToken).toEqual(expect.any(String));

    const me = await request(ctx.app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .expect(200);

    expect(me.body.data.email).toBe(email);
    expect(me.body.data.isEmailVerified).toBe(true);

    const refresh = await request(ctx.app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.data.refreshToken })
      .expect(200);

    expect(refresh.body.data.accessToken).toEqual(expect.any(String));
  });

  it('rejects login with wrong password', async () => {
    await request(ctx.app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'WrongPassword!' })
      .expect(401);
  });

  it('rejects /auth/me without token', async () => {
    await request(ctx.app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('rejects /auth/me with malformed token', async () => {
    await request(ctx.app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer not.a.real.token')
      .expect(401);
  });

  it('rejects duplicate registration', async () => {
    await request(ctx.app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(409);
  });

  it('rejects invalid refresh token', async () => {
    await request(ctx.app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'invalid.refresh.token' })
      .expect(401);
  });
});

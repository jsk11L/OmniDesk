import request from 'supertest';

import { TestAppContext, cleanupUserByEmail, createTestApp } from './helpers/app-factory';

describe('Themes CRUD (e2e)', () => {
  let ctx: TestAppContext;
  let accessToken: string;
  const email = `e2e-themes-${Date.now()}@omnidesk.test`;
  const password = 'Password123!';

  beforeAll(async () => {
    ctx = await createTestApp();
    await cleanupUserByEmail(ctx.prisma, email);

    await request(ctx.app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, displayName: 'E2E Themes' })
      .expect(201);

    const user = await ctx.prisma.user.findUnique({ where: { email } });
    await request(ctx.app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: user!.verificationToken })
      .expect(200);

    const login = await request(ctx.app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    accessToken = login.body.data.accessToken;
  });

  afterAll(async () => {
    if (ctx) {
      await cleanupUserByEmail(ctx.prisma, email);
      await ctx.close();
    }
  });

  const auth = (req: request.Test): request.Test =>
    req.set('Authorization', `Bearer ${accessToken}`);

  it('GET /themes lists system defaults', async () => {
    const res = await auth(request(ctx.app.getHttpServer()).get('/themes')).expect(200);
    const themes: Array<{ name: string; isDefault: boolean }> = res.body.data;
    expect(themes.length).toBeGreaterThanOrEqual(5);
    expect(themes.every((t) => typeof t.name === 'string')).toBe(true);
    expect(themes.some((t) => t.isDefault)).toBe(true);
  });

  it('rejects GET /themes without token', async () => {
    await request(ctx.app.getHttpServer()).get('/themes').expect(401);
  });

  it('POST /themes validates hex color', async () => {
    await auth(
      request(ctx.app.getHttpServer())
        .post('/themes')
        .send({ name: 'Bad', colorPrimary: 'not-a-color' }),
    ).expect(400);
  });

  it('POST /themes rejects unknown fields (whitelist)', async () => {
    await auth(
      request(ctx.app.getHttpServer())
        .post('/themes')
        .send({ name: 'Bad', userId: 'attacker-id' }),
    ).expect(400);
  });

  let createdId: string;

  it('POST /themes creates a custom theme', async () => {
    const res = await auth(
      request(ctx.app.getHttpServer())
        .post('/themes')
        .send({
          name: 'My E2E Theme',
          isDark: true,
          colorPrimary: '#ff0066',
          colorAccent: '#00ff99',
        }),
    ).expect(201);

    expect(res.body.data.id).toEqual(expect.any(String));
    expect(res.body.data.name).toBe('My E2E Theme');
    expect(res.body.data.isDefault).toBe(false);
    expect(res.body.data.colorPrimary).toBe('#ff0066');
    createdId = res.body.data.id;
  });

  it('GET /themes/:id returns the created theme', async () => {
    const res = await auth(
      request(ctx.app.getHttpServer()).get(`/themes/${createdId}`),
    ).expect(200);
    expect(res.body.data.id).toBe(createdId);
  });

  it('PATCH /themes/:id updates the theme', async () => {
    const res = await auth(
      request(ctx.app.getHttpServer())
        .patch(`/themes/${createdId}`)
        .send({ name: 'My E2E Theme (renamed)' }),
    ).expect(200);
    expect(res.body.data.name).toBe('My E2E Theme (renamed)');
  });

  it('PATCH /themes/:id/activate sets activeThemeId on the user', async () => {
    const res = await auth(
      request(ctx.app.getHttpServer()).patch(`/themes/${createdId}/activate`),
    ).expect(200);
    expect(res.body.data.activeThemeId).toBe(createdId);

    const user = await ctx.prisma.user.findUnique({ where: { email } });
    expect(user!.activeThemeId).toBe(createdId);
  });

  it('PATCH on system theme returns 403', async () => {
    const system = await ctx.prisma.theme.findFirst({ where: { isDefault: true } });
    expect(system).not.toBeNull();
    await auth(
      request(ctx.app.getHttpServer())
        .patch(`/themes/${system!.id}`)
        .send({ name: 'Hijack' }),
    ).expect(403);
  });

  it('DELETE on system theme returns 403', async () => {
    const system = await ctx.prisma.theme.findFirst({ where: { isDefault: true } });
    await auth(
      request(ctx.app.getHttpServer()).delete(`/themes/${system!.id}`),
    ).expect(403);
  });

  it('GET /themes/:id with random UUID returns 404', async () => {
    await auth(
      request(ctx.app.getHttpServer()).get(
        '/themes/00000000-0000-0000-0000-0000000000ff',
      ),
    ).expect(404);
  });

  it('GET /themes/:id with malformed UUID returns 400', async () => {
    await auth(
      request(ctx.app.getHttpServer()).get('/themes/not-a-uuid'),
    ).expect(400);
  });

  it('DELETE /themes/:id removes the custom theme and clears activeThemeId', async () => {
    const res = await auth(
      request(ctx.app.getHttpServer()).delete(`/themes/${createdId}`),
    ).expect(200);
    expect(res.body.data.id).toBe(createdId);

    const user = await ctx.prisma.user.findUnique({ where: { email } });
    expect(user!.activeThemeId).toBeNull();

    const gone = await ctx.prisma.theme.findUnique({ where: { id: createdId } });
    expect(gone).toBeNull();
  });
});

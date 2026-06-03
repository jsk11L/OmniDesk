import request from 'supertest';

import { TestAppContext } from './app-factory';

export interface TestUser {
  email: string;
  password: string;
  token: string;
  userId: string;
}

const DEFAULT_PASSWORD = 'Password123!';

/**
 * Registers a user, verifies their email using the token persisted by the
 * register flow, logs in, and returns an access token plus the user id.
 *
 * The email is namespaced with the provided label and a timestamp so parallel
 * specs never collide.
 */
export async function createVerifiedUser(
  ctx: TestAppContext,
  label: string,
): Promise<TestUser> {
  const email = `e2e-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@omnidesk.test`;
  const server = ctx.app.getHttpServer();

  await request(server)
    .post('/auth/register')
    .send({ email, password: DEFAULT_PASSWORD, displayName: label })
    .expect(201);

  const created = await ctx.prisma.user.findUnique({ where: { email } });
  if (!created) {
    throw new Error(`Test user not created: ${email}`);
  }

  await request(server)
    .post('/auth/verify-email')
    .send({ token: created.verificationToken })
    .expect(200);

  const login = await request(server)
    .post('/auth/login')
    .send({ email, password: DEFAULT_PASSWORD })
    .expect(200);

  return {
    email,
    password: DEFAULT_PASSWORD,
    token: login.body.data.accessToken,
    userId: created.id,
  };
}

/** Authorization header builder for a logged-in test user. */
export function auth(user: TestUser): [string, string] {
  return ['Authorization', `Bearer ${user.token}`];
}

import request from 'supertest';

import { TestAppContext, createTestApp } from './helpers/app-factory';
import { TestUser, auth, createVerifiedUser } from './helpers/auth-helpers';

/**
 * Multi-tenant isolation contract (ROADMAP §2.8, Block 0 acceptance criteria).
 *
 * Invariant: a user can never read, modify, or delete another user's resource.
 * Cross-user access returns 404 (the resource is filtered out by userId at the
 * query level, so it simply "does not exist" for anyone else).
 *
 * For every functional module we create a resource as user A, then assert that
 * user B gets 404 on GET / PATCH / DELETE, and finally that A still owns it.
 */

interface ModuleCase {
  name: string;
  /** Creates a resource owned by `owner`, returns its id. */
  create: (owner: TestUser) => Promise<string>;
  /** Endpoint paths for a given resource id. */
  paths: (id: string) => { get: string; patch: string; del: string };
  /** A minimal valid PATCH body for the resource. */
  patchBody: Record<string, unknown>;
}

describe('Multi-tenant isolation (e2e)', () => {
  let ctx: TestAppContext;
  let alice: TestUser;
  let bob: TestUser;

  const created: { email: string }[] = [];

  beforeAll(async () => {
    ctx = await createTestApp();
    alice = await createVerifiedUser(ctx, 'mt-alice');
    bob = await createVerifiedUser(ctx, 'mt-bob');
    created.push({ email: alice.email }, { email: bob.email });
  });

  afterAll(async () => {
    if (!ctx) return;
    for (const u of created) {
      await ctx.prisma.user.deleteMany({ where: { email: u.email } });
    }
    await ctx.close();
  });

  const server = () => ctx.app.getHttpServer();
  const idOf = (res: request.Response) => res.body.data.id as string;

  const cases: ModuleCase[] = [
    {
      name: 'Notes',
      create: async (owner) => {
        const res = await request(server())
          .post('/notes')
          .set(...auth(owner))
          .send({ title: 'Alice note' })
          .expect(201);
        return idOf(res);
      },
      paths: (id) => ({ get: `/notes/${id}`, patch: `/notes/${id}`, del: `/notes/${id}` }),
      patchBody: { title: 'hacked' },
    },
    {
      name: 'Lists',
      create: async (owner) => {
        const res = await request(server())
          .post('/lists')
          .set(...auth(owner))
          .send({ name: 'Alice list' })
          .expect(201);
        return idOf(res);
      },
      paths: (id) => ({ get: `/lists/${id}`, patch: `/lists/${id}`, del: `/lists/${id}` }),
      patchBody: { name: 'hacked' },
    },
    {
      name: 'Todo boards',
      create: async (owner) => {
        const res = await request(server())
          .post('/todos/boards')
          .set(...auth(owner))
          .send({ name: 'Alice board' })
          .expect(201);
        return idOf(res);
      },
      paths: (id) => ({
        get: `/todos/boards/${id}`,
        patch: `/todos/boards/${id}`,
        del: `/todos/boards/${id}`,
      }),
      patchBody: { name: 'hacked' },
    },
    {
      name: 'Habits',
      create: async (owner) => {
        const res = await request(server())
          .post('/habits')
          .set(...auth(owner))
          .send({ name: 'Alice habit', activeDays: [1, 2, 3] })
          .expect(201);
        return idOf(res);
      },
      paths: (id) => ({ get: `/habits/${id}`, patch: `/habits/${id}`, del: `/habits/${id}` }),
      patchBody: { name: 'hacked' },
    },
    {
      name: 'Finance boards',
      create: async (owner) => {
        const res = await request(server())
          .post('/finance/boards')
          .set(...auth(owner))
          .send({ name: 'Alice finance' })
          .expect(201);
        return idOf(res);
      },
      paths: (id) => ({
        get: `/finance/boards/${id}`,
        patch: `/finance/boards/${id}`,
        del: `/finance/boards/${id}`,
      }),
      patchBody: { name: 'hacked' },
    },
    {
      name: 'Calendar events',
      create: async (owner) => {
        const res = await request(server())
          .post('/calendar/events')
          .set(...auth(owner))
          .send({
            title: 'Alice event',
            startDate: '2026-06-01T10:00:00.000Z',
            endDate: '2026-06-01T11:00:00.000Z',
          })
          .expect(201);
        return idOf(res);
      },
      paths: (id) => ({
        get: `/calendar/events/${id}`,
        patch: `/calendar/events/${id}`,
        del: `/calendar/events/${id}`,
      }),
      patchBody: { title: 'hacked' },
    },
  ];

  describe.each(cases)('$name', (mod) => {
    let resourceId: string;

    beforeAll(async () => {
      resourceId = await mod.create(alice);
    });

    it('owner (Alice) can read her own resource', async () => {
      await request(server())
        .get(mod.paths(resourceId).get)
        .set(...auth(alice))
        .expect(200);
    });

    it('other user (Bob) cannot READ it', async () => {
      await request(server())
        .get(mod.paths(resourceId).get)
        .set(...auth(bob))
        .expect(404);
    });

    it('other user (Bob) cannot UPDATE it', async () => {
      await request(server())
        .patch(mod.paths(resourceId).patch)
        .set(...auth(bob))
        .send(mod.patchBody)
        .expect(404);
    });

    it('other user (Bob) cannot DELETE it', async () => {
      await request(server())
        .delete(mod.paths(resourceId).del)
        .set(...auth(bob))
        .expect(404);
    });

    it('resource is still intact and owned by Alice after the attacks', async () => {
      await request(server())
        .get(mod.paths(resourceId).get)
        .set(...auth(alice))
        .expect(200);
    });
  });
});

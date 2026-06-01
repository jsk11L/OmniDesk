import { validateEnv } from './env.validation';

const base = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db?schema=public',
  JWT_SECRET: 'a-sufficiently-long-secret',
  JWT_REFRESH_SECRET: 'a-different-long-secret-value',
};

describe('validateEnv', () => {
  it('accepts a minimal valid config and applies defaults', () => {
    const env = validateEnv({ ...base });
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.SOFT_DELETE_DAYS).toBe(30);
  });

  it('coerces numeric strings to numbers', () => {
    const env = validateEnv({ ...base, PORT: '4000', UPLOADS_MAX_BYTES: '1024' });
    expect(env.PORT).toBe(4000);
    expect(env.UPLOADS_MAX_BYTES).toBe(1024);
  });

  it('rejects a missing DATABASE_URL', () => {
    const { DATABASE_URL, ...withoutDb } = base;
    void DATABASE_URL;
    expect(() => validateEnv(withoutDb)).toThrow(/DATABASE_URL/);
  });

  it('rejects a too-short JWT_SECRET', () => {
    expect(() => validateEnv({ ...base, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
  });

  it('rejects placeholder secrets in production', () => {
    expect(() =>
      validateEnv({
        ...base,
        NODE_ENV: 'production',
        JWT_SECRET: 'change_me_please_now',
        JWT_REFRESH_SECRET: 'another-real-looking-secret',
      }),
    ).toThrow(/placeholder/);
  });

  it('rejects identical access/refresh secrets in production', () => {
    expect(() =>
      validateEnv({
        ...base,
        NODE_ENV: 'production',
        JWT_SECRET: 'identical-long-secret-value',
        JWT_REFRESH_SECRET: 'identical-long-secret-value',
      }),
    ).toThrow(/must differ/);
  });

  it('aggregates multiple issues into one error', () => {
    expect(() => validateEnv({})).toThrow(/JWT_SECRET[\s\S]*JWT_REFRESH_SECRET|DATABASE_URL/);
  });
});

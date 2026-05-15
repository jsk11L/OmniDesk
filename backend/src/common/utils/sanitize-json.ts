const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const MAX_DEPTH = 8;
const MAX_KEYS_PER_OBJECT = 200;
const MAX_ARRAY_LENGTH = 500;
const MAX_STRING_LENGTH = 10_000;

export class JsonSanitizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JsonSanitizationError';
  }
}

/**
 * Sanitizes user-provided JSON before persisting to a JSONB column.
 *
 * Rules:
 * - Rejects keys named `__proto__`, `prototype`, `constructor` (prototype-pollution vectors).
 * - Caps depth at 8 levels, keys per object at 200, arrays at 500 items, strings at 10k chars.
 * - Allows null, boolean, number, string, plain objects and arrays only.
 * - Drops functions and other unserializable values silently.
 */
export function sanitizeJson(input: unknown): unknown {
  return walk(input, 0);
}

function walk(value: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH) {
    throw new JsonSanitizationError(`JSON exceeds max depth of ${MAX_DEPTH}`);
  }

  if (value === null || value === undefined) return null;

  const type = typeof value;
  if (type === 'boolean' || type === 'number') {
    if (type === 'number' && !Number.isFinite(value as number)) {
      throw new JsonSanitizationError('JSON contains non-finite number');
    }
    return value;
  }

  if (type === 'string') {
    const str = value as string;
    if (str.length > MAX_STRING_LENGTH) {
      throw new JsonSanitizationError(`JSON string exceeds ${MAX_STRING_LENGTH} chars`);
    }
    return str;
  }

  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_LENGTH) {
      throw new JsonSanitizationError(`JSON array exceeds ${MAX_ARRAY_LENGTH} items`);
    }
    return value.map((item) => walk(item, depth + 1));
  }

  if (type === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length > MAX_KEYS_PER_OBJECT) {
      throw new JsonSanitizationError(`JSON object exceeds ${MAX_KEYS_PER_OBJECT} keys`);
    }
    const out: Record<string, unknown> = Object.create(null);
    for (const key of keys) {
      if (DANGEROUS_KEYS.has(key)) {
        throw new JsonSanitizationError(`JSON contains forbidden key: "${key}"`);
      }
      out[key] = walk(obj[key], depth + 1);
    }
    return out;
  }

  return undefined;
}

/**
 * Offset-based pagination helpers (D-012): `?page=N&limit=12`, default 12,
 * max 50. Responses carry `meta: { page, limit, total, totalPages }`.
 *
 * Pagination is backward-compatible: when the caller passes neither `page` nor
 * `limit`, the full result set is returned (so existing frontend list views
 * keep working until they adopt the pager). When either is present, the slice
 * is enforced.
 */
export const DEFAULT_PAGE_LIMIT = 12;
export const MAX_PAGE_LIMIT = 50;

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface ResolvedPagination {
  /** `skip`/`take` for Prisma; undefined when no pagination was requested. */
  skip?: number;
  take?: number;
  page: number;
  /** Requested page size, or null when returning the full set. */
  limit: number | null;
}

function toPositiveInt(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function resolvePagination(query: PaginationQuery): ResolvedPagination {
  if (query.page === undefined && query.limit === undefined) {
    return { page: 1, limit: null };
  }
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(MAX_PAGE_LIMIT, toPositiveInt(query.limit, DEFAULT_PAGE_LIMIT));
  return { skip: (page - 1) * limit, take: limit, page, limit };
}

export function buildPageMeta(resolved: ResolvedPagination, total: number): PageMeta {
  const limit = resolved.limit ?? (total > 0 ? total : 1);
  return {
    page: resolved.page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

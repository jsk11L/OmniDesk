-- Full-text search index for notes (Block 7). Expression GIN index over the
-- derived plainText + title; not expressible in schema.prisma, applied here.
CREATE INDEX IF NOT EXISTS "Note_fts_idx"
  ON "Note"
  USING GIN (to_tsvector('english', coalesce("plainText", '') || ' ' || coalesce("title", '')));

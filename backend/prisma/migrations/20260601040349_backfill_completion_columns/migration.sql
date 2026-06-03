-- Data backfill for TodoColumn.isCompletionColumn.
-- Before this column existed, the dashboard classified "done" todos with a
-- hardcoded list of column names. Preserve that behaviour for existing boards
-- by flagging any column whose name matched the old heuristic.
UPDATE "TodoColumn"
SET "isCompletionColumn" = true
WHERE lower("name") IN ('hecho', 'done', 'completado', 'completadas', 'completed', 'finalizado');

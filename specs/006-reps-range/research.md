# Research: Rep Range for Routine Exercises

## SQLite ALTER TABLE — Adding NOT NULL Columns to Existing Tables

**Decision**: Add `min_reps` and `max_reps` as `INTEGER NOT NULL DEFAULT <n>` in the `ALTER TABLE` statement, then immediately `UPDATE` all existing rows from `suggested_reps`.

**Rationale**: SQLite allows `ADD COLUMN NOT NULL` only when a non-NULL default is provided. A temporary default (e.g., `DEFAULT 10`) satisfies this constraint during migration; the subsequent `UPDATE` replaces it with each row's actual `suggested_reps` value. All existing rows end up with correct values before the transaction commits.

**Alternatives considered**:
- Add nullable columns, migrate data, then rely on app-level NOT NULL enforcement — rejected because the DB constraint would be weaker than the spec requires.
- Recreate the table with the new schema — unnecessarily complex and carries FK cascade risk; not needed here.

---

## Drizzle Migration Workflow — Manual Augmentation Required

**Decision**: Run `npx drizzle-kit generate` after editing `schema.ts`, then manually insert the data migration `UPDATE` into the generated `.sql` file before the `DROP COLUMN` statement.

**Rationale**: `drizzle-kit generate` produces correct ADD/DROP DDL but has no awareness of the data migration needed to populate `min_reps`/`max_reps` from `suggested_reps`. The generated file must be edited to insert:

```sql
UPDATE `routine_exercise` SET `min_reps` = `suggested_reps`, `max_reps` = `suggested_reps`;
--> statement-breakpoint
```

This edit goes **after** the two `ADD COLUMN` statements and **before** any `DROP COLUMN` statement. The migration runner (`src/db/migrations.ts`) splits on `--> statement-breakpoint` and executes each statement in order within one transaction, so ordering is guaranteed.

**Alternatives considered**:
- Separate migration files (one to add columns, one to migrate data, one to drop) — adds noise to migration history with no benefit; a single file with correct ordering is cleaner.

---

## Dropping `suggested_reps` — Constitutional Validity

**Decision**: Drop `suggested_reps` in the new migration (not preserve it).

**Rationale**: The constitution forbids destructive changes to **already-shipped migration files**. Adding a new forward migration that drops a column is explicitly the prescribed approach. The column is unused after migration and keeping it would leave dead state in the schema and the `RoutineExercise` TypeScript type (which is auto-inferred from the Drizzle schema). SQLite 3.35+ (the version bundled in `@sqlite.org/sqlite-wasm`) supports `ALTER TABLE ... DROP COLUMN`.

**Alternatives considered**:
- Preserve `suggested_reps` as a deprecated column — keeps dead data in every row and pollutes the inferred type; rejected.

---

## TypeScript Types — Auto-Inference from Schema

**Decision**: No manual type changes to `RoutineExercise` needed. The type is `typeof routineExercise.$inferSelect` and will automatically reflect the new columns once `schema.ts` is updated.

**Rationale**: Every component that destructures `exercise.suggestedReps` will get a compile-time error after the schema change, guiding all necessary UI updates. This is the desired migration safety net — tsc catches every callsite.

**Alternatives considered**:
- Manual type alias — redundant and would diverge from the schema over time.

---

## Rep Range Display Format

**Decision**: Display as `"X–Y reps"` (en-dash) when `minReps !== maxReps`; display as `"X reps"` when equal. This is a pure formatting function with no runtime complexity.

**Rationale**: Standard notation in fitness contexts. En-dash (`–`) is the typographically correct separator for ranges. The collapsing behavior avoids the redundant "5–5 reps" display.

---

## Validation — min > max Error

**Decision**: Hard block on save with an inline error message; no auto-swap of values.

**Rationale**: Auto-swapping silently changes user intent and may surprise them. A clear error ("Min reps cannot exceed max reps") tells the user exactly what to fix. This is consistent with how the existing sets validation behaves.

# Contract: Database API — Routine Draft Persistence

All new database operations are exported from `src/database.ts` and backed by `src/db/entities/routine-workout-draft/repository.ts`.

---

## `saveDraft(routineId, data)`

**Signature**
```typescript
export async function saveDraft(
  routineId: number,
  data: StoredDraftData,
): Promise<void>
```

**Behaviour**
- Upserts the singleton row (id = 1). If a row with id = 1 already exists (possibly for a different routine), it is completely replaced — `routine_id`, `draft_data`, and `updated_at` are all overwritten.
- `data` is serialized to JSON before storage. `NaN` field values must be converted to `null` by the caller before passing to this function.

**Errors** — throws on DB failure; caller logs and swallows (draft save is best-effort, see FR-001 edge case).

---

## `getDraft()`

**Signature**
```typescript
export async function getDraft(): Promise<null | RoutineWorkoutDraft>
```

**Behaviour**
- Returns the singleton draft row with `draftData` deserialized from JSON, or `null` if no draft exists.
- If the JSON is malformed, swallows the parse error and returns `null` (FR-008 graceful degradation).

---

## `clearDraft()`

**Signature**
```typescript
export async function clearDraft(): Promise<void>
```

**Behaviour**
- Deletes the singleton row. No-op if no draft exists.
- Called on: successful form submission (FR-007), user-confirmed discard (FR-006), and automatically by the DB cascade when the routine is deleted (FR-010 — no application call needed for delete).

---

## `StoredDraftData` Type

```typescript
// Defined in src/db/entities/routine-workout-draft/types.ts
type StoredSetValues = Array<{ reps: null | number; weight: null | number }>;
type StoredDraftData = Record<string, StoredSetValues>; // key = routineExerciseId.toString()
```

**NaN ↔ null conversion** (performed at the hook layer, not the repository):
- Saving: `Number.isNaN(v) ? null : v` for each reps/weight value.
- Restoring: `v === null ? NaN : v` for each reps/weight value.

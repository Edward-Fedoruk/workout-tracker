# Data Model: Exercise Names in Tables

**Branch**: `016-exercise-names-tables` | **Date**: 2026-06-12

## Schema Changes

None. The `app_setting` table (key `text PK`, value `text NOT NULL`) already exists and handles arbitrary key-value preferences. No Drizzle migration is needed.

## New AppSetting Key

| Key | Type | Values | Default |
|-----|------|--------|---------|
| `exercise_names_in_tables` | string (boolean-encoded) | `"true"` \| `"false"` | absent = `false` |

- Absent row → treated as `false` (images shown).
- Written on first toggle; subsequent writes use `INSERT ... ON CONFLICT DO UPDATE`.

## Repository Methods (new)

Added to `AppSettingRepository` in `src/db/entities/app-setting/repository.ts`:

```
getExerciseNamesInTables(): Promise<boolean>
  - SELECT value WHERE key = 'exercise_names_in_tables'
  - Returns false if row absent or value is not "true"

setExerciseNamesInTables(enabled: boolean): Promise<void>
  - UPSERT key = 'exercise_names_in_tables', value = enabled ? "true" : "false"
```

## Exports added to `src/database.ts`

```
getExerciseNamesInTables: () => appSettingRepository.getExerciseNamesInTables()
setExerciseNamesInTables: (v: boolean) => appSettingRepository.setExerciseNamesInTables(v)
```

## No entity or relationship changes

All existing entities (`workout_log`, `workout_set`, `exercise`, etc.) are untouched. This feature is purely a UI preference backed by a single settings row.

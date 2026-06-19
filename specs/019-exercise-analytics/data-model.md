# Data Model: Exercise Analytics

**Feature**: 019-exercise-analytics | **Date**: 2026-06-19

This feature is **read-only**. It introduces **no new tables, columns, or migrations**.
It reads existing entities and derives in-memory analytics shapes. Below: the source
tables consumed, the derived in-memory types, and the validation/derivation rules.

## Source tables (existing — unchanged)

| Table | Columns used | Role in analytics |
|-------|--------------|-------------------|
| `workout_log` | `id`, `exercise_name`, `workout_date` (ISO `YYYY-MM-DD`) | A dated session of one exercise. Filtered by date range. |
| `workout_set` | `workout_id`, `set_number` (1–5), `reps`, `weight`, `erm` | Per-set values. `erm` is pre-computed/stored (bodyweight-aware). |
| `exercise` | `name`, `classification` (`standard`\|`bodyweight`) | Classification drives effective-weight for volume. |
| `exercise_muscle_group` | `exercise_id`, `muscle_group_id` | Many-to-many mapping; an exercise contributes to each group. |
| `muscle_group` | `id`, `name`, `color` | Wind-rose spoke identity + color. |
| `app_setting` | `body_weight` | Substituted into effective weight for bodyweight sets. |

> Join key note: `workout_log.exercise_name` is a **name** (text), while
> `exercise_muscle_group.exercise_id` references `exercise.id`. The muscle-group query
> joins `workout_log.exercise_name = exercise.name` then `exercise.id = exercise_muscle_group.exercise_id`.

## Derived in-memory types (already defined in `src/utils/analytics/types.ts`)

### AnalyticsSet
| Field | Type | Derivation |
|-------|------|-----------|
| `setNumber` | `number` | `workout_set.set_number` |
| `reps` | `number` | `workout_set.reps` |
| `weight` | `null \| number` | `workout_set.weight` (raw logged) |
| `erm` | `null \| number` | `workout_set.erm` (stored) |
| `effectiveWeight` | `null \| number` | `computeEffectiveWeight({ bodyWeight, classification, loggedWeight: weight })` |

### AnalyticsSession
| Field | Type | Derivation |
|-------|------|-----------|
| `exerciseName` | `string` | `workout_log.exercise_name` |
| `isoDate` | `string` | `workout_log.workout_date` |
| `sets` | `AnalyticsSet[]` | sets of that session, ordered by `set_number` |

## New query-row shapes (read layer)

### AnalyticsSetRow (from `listSetRowsInRange`)
`{ classification, ermValue, exerciseName, isoDate, reps, setNumber, weight, workoutId }`
— one row per logged set in range. Adapter groups by `workoutId` → `AnalyticsSession`.

### AnalyticsMuscleGroupSetRow (from `listMuscleGroupSetRowsInRange`)
`AnalyticsSetRow` **+** `{ muscleGroupColor, muscleGroupId, muscleGroupName }` — one row per
(set × muscle group). Adapter groups by `muscleGroupId` → `{ group, sessions }`, then sessions
by `workoutId`.

## Derived analytics outputs

| Output | Produced by | Shape | Spec |
|--------|-------------|-------|------|
| Per-unit charts | US1 hook over the existing Set1..Set5 pivot rows (time-range filtered) + `sessionErmStrategies` for "Overall eRM" | up to 3 charts grouped by unit (reps / weight / eRM), each `{ id, label, data: (null\|number)[] }[]` over a shared date x-axis | FR-004–010, FR-022 |
| Weekly strength score point | `strengthScoreStrategies.getActive().calculate(weekSessions)` per weekly bucket, for **all weeks since first workout** | `null \| number` per week | FR-011, FR-013 |
| Week-over-week result | `computeWeekOverWeekChange(current, previous)` | `{ current, previous, percentChange, direction }` | FR-012, FR-014–016 |
| Wind-rose spoke value | `muscleGroupMetricStrategies.getActive().calculate(groupSessions)` per **trained** group (radar renders even with 1–2 spokes) | `number` per muscle group | FR-017–021, FR-023 |

## Validation & derivation rules

- **Date filtering** uses ISO string comparison on `workout_date` (`>= start AND <= end`),
  bounds from `timeWindows.ts` (rolling last 7/30/365 days ending today).
- **Missing data is not zero** (FR-008): a parameter/series only plots points for sessions
  where the underlying value is non-null; strategies skip `null` eRM and treat
  non-positive/`null` effective weight as `0` volume contribution.
- **Set cardinality** is DB-capped at 1–5 (`set_number BETWEEN 1 AND 5`), so per-set
  parameters never exceed Set 5.
- **Insufficient comparison** (FR-016): when either compared week has no usable score (or
  previous ≤ 0), `computeWeekOverWeekChange` returns `direction: 'insufficient'` and
  `percentChange: null` so the UI shows a neutral state, never a fabricated percentage.
- **Multi-group attribution** (FR-019): the muscle-group query emits a row per (set × group),
  so an exercise mapped to N groups contributes its volume to all N — no de-duplication.
- **Empty states** (FR-002): every derived output yields an empty/zero result for an empty
  range; the views render a message rather than an errored chart.

## State (non-persisted)

- Active strategy per registry: in-memory module state via `setActive(key)`. **Not persisted**
  (no `app_setting` row) for v1 — formula selection is a code-level concern. UI selection
  state (chosen exercise, selected parameters, active period) is React component state.

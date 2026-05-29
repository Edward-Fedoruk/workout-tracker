# Implementation Plan: eRM & Body Weight Settings

**Branch**: `007-erm-bodyweight` | **Date**: 2026-05-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/007-erm-bodyweight/spec.md`

## Summary

Add per-set estimated 1-Rep Max (Epley formula) display to the workout log, a dedicated Settings page for entering body weight, and exercise classification (`standard` / `bodyweight` / `assisted`) that controls how body weight contributes to the effective load. Three schema changes are required: a new `app_setting` key-value table, a `classification` column on `exercise`, and a workout-set table rebuild to drop the `weight > 0` constraint (assisted exercises need negative weights).

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Vite  
**Primary Dependencies**: Chakra-compatible MUI, Drizzle ORM (schema + codegen), `@sqlite.org/sqlite-wasm`  
**Storage**: SQLite-WASM persisted to OPFS (`app.sqlite3`); in-memory fallback  
**Testing**: None configured (Principle V); manual browser verification required  
**Target Platform**: Browser PWA, mobile-first (≥320 px viewport)  
**Project Type**: Local-first web application  
**Performance Goals**: eRM computed synchronously at render time; no perceptible latency  
**Constraints**: Offline-capable; no backend; COOP/COEP headers required  
**Scale/Scope**: Single-user, single-origin, all data in one SQLite file

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Local-First | ✅ Pass | Body weight stored in SQLite `app_setting` table; no localStorage, no remote API. |
| II. Single Worker, Single Init | ✅ Pass | All new DB access goes through new helpers in `settingsHelpers.ts`, exported via `database.ts`. No additional `initDatabase` calls. |
| III. Schema-Complete Before Ready | ✅ Pass | Migration file `0005_erm_bodyweight.sql` (Drizzle-generated, manually reviewed) runs in `runMigrations` before `initDatabase` resolves. |
| IV. Parameterized SQL Only | ✅ Pass | All new SQL uses `?` placeholders and `bind` arrays. No string interpolation. |
| V. Simplicity & Explicit Scope | ✅ Pass | eRM is derived (not stored). No test runner added. No new abstractions beyond the required helpers and utility file. |
| VI. Mobile-First, Adaptive UI | ✅ Pass | New Settings tab and eRM column must be verified at ≥320 px. Settings input uses touch-friendly target sizing. |
| VII. Component Separation | ✅ Pass | `SettingsPage` is a container; numeric input is presentational. eRM logic extracted to `src/utils/erm.ts`. |
| VIII. File Size ≤ 200 lines | ⚠️ Watch | `WorkoutTable.tsx` is at risk of growing past 200 lines when eRM display is added. If it does, extract a `WorkoutSetRow` presentational component. |
| IX. Strong TypeScript Types | ✅ Pass | `ExerciseClassification` is a typed discriminated union. `getBodyWeight` returns `number | null`. No `any` or double-cast needed. |

**Complexity Tracking**: No violations require justification.

## Project Structure

### Documentation (this feature)

```text
specs/007-erm-bodyweight/
├── plan.md              ← this file
├── research.md          ← Phase 0 decisions
├── data-model.md        ← schema changes and derived-value spec
├── quickstart.md        ← step-by-step implementation guide
├── contracts/
│   ├── settingsHelpers.ts.md
│   └── erm.ts.md
└── tasks.md             ← Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code

```text
src/
├── App.tsx                             ← add 'settings' to ActiveView + new tab
├── database.ts                         ← re-export getBodyWeight, setBodyWeight
├── db/
│   ├── schema.ts                       ← add appSetting table, classification col, drop weight_check
│   ├── exerciseHelpers.ts              ← add classification to Exercise type + queries
│   └── settingsHelpers.ts              ← NEW: getBodyWeight, setBodyWeight
├── utils/
│   └── erm.ts                          ← NEW: computeEffectiveWeight, computeERM
└── components/
    ├── WorkoutTable.tsx                ← add eRM column (+ extract WorkoutSetRow if needed)
    ├── WorkoutForm.tsx                 ← classification-aware weight validation
    ├── settings/
    │   └── SettingsPage.tsx            ← NEW: body weight input with Save button
    └── exercises/
        └── [ExerciseForm components]   ← add classification selector

drizzle/
└── 0005_erm_bodyweight.sql             ← NEW: Drizzle-generated + manually reviewed
```

**Structure Decision**: Single-project web app (Option 1 from template). Source files follow the existing `src/components/`, `src/db/`, `src/utils/` layout. New domain folders added only where warranted (`src/utils/` for the pure eRM function, `src/components/settings/` for the new page).

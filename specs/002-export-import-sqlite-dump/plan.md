# Implementation Plan: Export & Import Workout Data via SQLite Dump File

**Branch**: `002-export-import-sqlite-dump` | **Date**: 2026-05-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-export-import-sqlite-dump/spec.md`

## Summary

Add user-facing Export and Import actions to the workout log. Export downloads a byte-for-byte copy of the OPFS-backed SQLite database as a `.sqlite3` file. Import takes a user-selected `.sqlite3` file, verifies the SQLite magic header, closes the worker's DB handle, replaces the OPFS file, and triggers a full page reload so `initDatabase` opens the new file cleanly. No new dependencies, no schema changes, no migrations.

## Technical Context

**Language/Version**: TypeScript 5.5 (strict), React 18, ES2022 modules
**Primary Dependencies**: `@sqlite.org/sqlite-wasm` (already present), `@mui/material` + `@mui/icons-material` (already present). No new packages required.
**Storage**: SQLite via OPFS (filename `app.sqlite3`, see `database.ts:54`), with `:memory:` fallback. The export reads bytes via the worker's `'export'` command; the import writes bytes directly through the OPFS API (`navigator.storage.getDirectory()` → file handle → writable stream).
**Testing**: None. Per Constitution Principle V, no test runner is configured and this feature does not introduce one. Validation is manual against `quickstart.md`.
**Target Platform**: Modern Chromium/Safari/Firefox PWA. Requires cross-origin isolation (already enforced by `vite.config.ts`). OPFS available everywhere we already support; the in-memory fallback case is documented but lower priority.
**Project Type**: Single-page web application (PWA). Existing layout: `src/{App.tsx, database.ts, components/}`. No new top-level structure.
**Performance Goals**: Export ≤3s for ≤1,000 workout rows (SC-001); import ≤5s including reload (SC-002); UI freeze ≤500ms (SC-003). Database files at this scale are typically <500 KB — comfortable for browser memory and `Blob`/`URL.createObjectURL` download.
**Constraints**: Must not violate the "worker created once" invariant (Principle II) during a normal session. The import flow legitimately tears the worker down — but only as the last step before `location.reload()`, so the next session starts fresh and the invariant continues to hold per page-load.
**Scale/Scope**: Single user, single origin. ~thousands of workout rows max. Two new buttons in the UI; two new helpers in `database.ts`; one new presentational confirmation dialog.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Local-First (NON-NEGOTIABLE) | ✅ Pass | No backend, no remote API, no second persistence layer. Files move via the user's own means (download / cloud drive). |
| II. Single Worker, Single Init (NON-NEGOTIABLE) | ✅ Pass | Export uses the existing memoized `initDatabase()` promiser. Import only tears down the worker as the immediate prelude to `location.reload()`; the next page load re-runs `initDatabase()` once, as normal. No second worker spawned within a session. |
| III. Schema-Complete Before Ready | ✅ Pass | Existing `createSchema()` runs additively (all `CREATE TABLE IF NOT EXISTS`) on every load. After import, the next page load's `initDatabase()` reconciles whatever the imported DB contains — older app schemas get the missing tables created; newer/unrelated SQLite files are tolerated (an unrelated DB simply yields an empty workout view). |
| IV. Parameterized SQL Only | ✅ Pass | No new SQL on the user-data path. The only worker commands invoked are `'export'` and `'close'`; no `exec` with bindable input. |
| V. Simplicity & Explicit Scope | ✅ Pass | No tests added (manual quickstart only). No new packages. No new abstractions beyond two helpers in `database.ts` and one presentational dialog. |
| VI. Mobile-First, Adaptive UI | ✅ Pass | Buttons sized ≥44×44 CSS px, placed in a responsive toolbar/menu; the confirmation dialog uses MUI's responsive `Dialog`. No fixed-pixel widths. Verified at ≤375px viewport during manual quickstart. |
| VII. Component Separation of Concerns | ✅ Pass | A new container `WorkoutDataActions` holds the export/import logic (calls `database.ts` helpers, drives file picker, handles confirm + reload). Presentational pieces (the confirmation dialog and error snackbar) receive props/callbacks only. |

**Initial gate**: PASS — no violations, no Complexity Tracking entry needed.

## Project Structure

### Documentation (this feature)

```text
specs/002-export-import-sqlite-dump/
├── plan.md              # This file
├── spec.md              # Already exists (created by /speckit.specify, refined by /speckit.clarify)
├── research.md          # Phase 0 output (created below)
├── data-model.md        # Phase 1 output (created below)
├── quickstart.md        # Phase 1 output (created below)
├── contracts/
│   └── database.ts.md   # The two new helpers added to src/database.ts
├── checklists/
│   └── requirements.md  # Already exists
└── tasks.md             # Created by /speckit.tasks (NOT here)
```

### Source Code (repository root)

```text
src/
├── App.tsx                              # unchanged
├── database.ts                          # +2 exports: exportDatabaseBytes, replaceDatabaseAndReload
├── components/
│   ├── WorkoutForm.tsx                  # unchanged
│   ├── WorkoutTable.tsx                 # mount <WorkoutDataActions /> in its toolbar
│   ├── WorkoutDataActions.tsx           # NEW container: export + import buttons, file picker, confirm flow
│   └── ConfirmImportDialog.tsx          # NEW presentational: destructive-action confirm dialog
└── main.tsx                             # unchanged
```

**Structure Decision**: Keep the existing flat `src/{App.tsx, database.ts, components/}` layout. All DB access stays in `database.ts` per Principle II. The two new components live alongside the existing `WorkoutTable`/`WorkoutForm`. No new folders, no routing, no service layer.

## Phase 0: Research

See [research.md](./research.md) for decisions, rationales, and rejected alternatives covering:

1. How to extract bytes from the OPFS-backed SQLite database (worker `'export'` command vs. raw OPFS read).
2. How to write a new database file into OPFS so the next `initDatabase()` opens it (direct OPFS write vs. sqlite-wasm import command).
3. How to verify the SQLite magic header efficiently (read first 16 bytes from the `File` object).
4. How to safely close the in-session DB before swapping the file (worker `'close'` command, then `location.reload()`).
5. Filename / MIME / download trigger pattern (`Blob` + `URL.createObjectURL` + anchor click).

## Phase 1: Design & Contracts

- **[data-model.md](./data-model.md)** — confirms no schema change. Documents the bytes-level contract (the dump file = the OPFS `app.sqlite3` file, as-is).
- **[contracts/database.ts.md](./contracts/database.ts.md)** — the two new typed exports added to `src/database.ts` (signatures, behaviors, error modes).
- **[quickstart.md](./quickstart.md)** — step-by-step manual validation procedure mapped to acceptance scenarios SC-001..SC-007.

### Agent context update

Replace the plan reference between the `<!-- SPECKIT START -->` and `<!-- SPECKIT END -->` markers in the root `CLAUDE.md` to point to this file (`specs/002-export-import-sqlite-dump/plan.md`).

## Re-evaluation (post-design)

After Phase 1, the Constitution Check still passes. The two new `database.ts` helpers preserve the single-worker invariant: `exportDatabaseBytes()` uses the existing memoized promiser; `replaceDatabaseAndReload()` is terminal (the only call site is the user's confirmed import action, and it ends in `location.reload()` — no subsequent in-session DB work is possible). No new violations introduced.

## Complexity Tracking

No constitution violations to justify — table omitted.

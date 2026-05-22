# Tasks: Export & Import Workout Data via SQLite Dump File

**Input**: Design documents from `/specs/002-export-import-sqlite-dump/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/database.ts.md ✅, quickstart.md ✅

**Tests**: NOT included. Per Constitution Principle V and plan.md, no test runner is configured for this project. Validation is manual via `quickstart.md`.

**Organization**: Two P1 user stories — US1 (Export) and US2 (Import). US1 is independently deliverable as the MVP; US2 builds on the same UI shell that US1 introduces.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 (Export) or US2 (Import)
- Exact file paths included in every task

## Path Conventions

Single-project Vite + React layout: all source under `src/`. Specs under `specs/002-export-import-sqlite-dump/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: None required. Project is already initialized; no new dependencies; no new build config. Skipping straight to foundational work.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the empty toolbar container both stories will hang their buttons off, and the empty error-surfacing primitive both stories need. Doing this once avoids duplicate work in US1 and US2.

**⚠️ CRITICAL**: Both user stories depend on these.

- [ ] T001 Create empty container component `src/components/WorkoutDataActions.tsx` that renders an MUI `Stack` (responsive, ≥44×44 px touch targets) — initially exports an empty component that will hold the Export and Import buttons.
- [ ] T002 Mount `<WorkoutDataActions />` in the toolbar slot of `src/components/WorkoutTable.tsx`. Verify the table still renders with no visual regression in `npm run dev`.
- [ ] T003 [P] Add a local error-snackbar pattern inside `src/components/WorkoutDataActions.tsx` using MUI `Snackbar` + `Alert` (severity `error`), gated on a `useState<string | null>` for the message. No story-specific copy yet — just the primitive both stories will reuse.

**Checkpoint**: Toolbar shell + error surface in place. US1 and US2 can now be implemented independently.

---

## Phase 3: User Story 1 — Export the whole database to a backup file (Priority: P1) 🎯 MVP

**Goal**: User can click an Export button and receive `workout-log-YYYY-MM-DD.sqlite3` — a byte-for-byte copy of their database.

**Independent Test**: Add workout entries, click Export, verify the downloaded file opens in DB Browser for SQLite and contains the entries. Matches quickstart Scenario 1 (steps 1–4) and Scenario 2.

### Implementation for User Story 1

- [ ] T004 [P] [US1] Add `exportDatabaseBytes()` export to `src/database.ts` per the contract in `specs/002-export-import-sqlite-dump/contracts/database.ts.md`: `await initDatabase()`, then `promiser('export', { dbId })`, normalize the result to `Uint8Array`, return it. Update the `Promiser` type union in `src/database.ts:13-27` to include the `'export'` command signature (returns `{ result: { byteArray: Uint8Array; filename: string; mimetype: string } }`).
- [ ] T005 [US1] In `src/components/WorkoutDataActions.tsx`, add an Export button (MUI `Button` with `DownloadIcon` from `@mui/icons-material`, label "Export"). Wire its `onClick` to a handler that:
  - calls `exportDatabaseBytes()`,
  - wraps the bytes in `new Blob([bytes], { type: 'application/vnd.sqlite3' })`,
  - generates filename `workout-log-${YYYY-MM-DD}.sqlite3` using local date (`new Date().toISOString().slice(0,10)` is acceptable; revisit only if timezone surprises in manual test),
  - triggers download via a hidden `<a>` element (`URL.createObjectURL`, set `download`, click, `URL.revokeObjectURL` in a `setTimeout(0)`),
  - shows the error snackbar (T003) on failure.
- [ ] T006 [US1] Disable the Export button while an export is in progress (loading state, `useState<boolean>`). Required to keep SC-003 (no input freezes) defensible: prevents the user from queueing multiple exports while one is running.
- [ ] T007 [US1] Manually validate US1 against quickstart Scenarios 1 (steps 1–4), 2, 3, and 9 in `specs/002-export-import-sqlite-dump/quickstart.md`. Run `npm run build && npm run preview` and exercise in Chrome.

**Checkpoint**: Export works end-to-end. This is shippable as an MVP — users can back up their data even without import.

---

## Phase 4: User Story 2 — Import a backup file to restore the database (Priority: P1)

**Goal**: User can click Import, pick a `.sqlite3` file, confirm the destructive replacement, and after auto-reload see the imported data.

**Independent Test**: Take a known-good export (from US1 or pre-staged), clear OPFS, click Import, confirm, verify the table renders the imported entries after the reload. Matches quickstart Scenarios 1 (steps 5–8), 4, 5, 6, and the failure-mode walkthrough.

### Implementation for User Story 2

- [ ] T008 [P] [US2] Add `replaceDatabaseAndReload(bytes: Uint8Array): Promise<never>` export to `src/database.ts` per the contract in `specs/002-export-import-sqlite-dump/contracts/database.ts.md`. Implement the 7-step sequence exactly: init → header check (throw on mismatch) → `promiser('close', { dbId })` in try/catch → `navigator.storage.getDirectory()` (skip OPFS steps if unavailable) → `removeEntry` for `app.sqlite3` + `-journal` + `-wal` + `-shm` (each `.catch(() => undefined)`) → `getFileHandle('app.sqlite3', { create: true })` + `createWritable()` + `write(bytes)` + `close()` → `location.reload()`. Update the `Promiser` type union in `src/database.ts:13-27` to include the `'close'` command signature.
- [ ] T009 [P] [US2] Create presentational `src/components/ConfirmImportDialog.tsx` using MUI `Dialog` + `DialogTitle` + `DialogContent` + `DialogActions`. Props: `open: boolean`, `filename: string`, `onConfirm: () => void`, `onCancel: () => void`. Body text explicitly states both consequences from FR-006: (a) entire database will be wiped, (b) app will automatically reload. Cancel button is the default focus; Confirm button uses MUI `color="error"`. No business logic in this file (Principle VII).
- [ ] T010 [US2] In `src/components/WorkoutDataActions.tsx`, add an Import button (MUI `Button` with `UploadIcon`, label "Import") plus a hidden `<input type="file" accept=".sqlite3,application/vnd.sqlite3,application/octet-stream" />` (note: cannot omit `application/octet-stream` — many OSes report `.sqlite3` files as that). Clicking the button programmatically clicks the input.
- [ ] T011 [US2] In `src/components/WorkoutDataActions.tsx`, on file-input change handler: if no file selected, no-op. Otherwise read first 16 bytes via `file.slice(0, 16).arrayBuffer()` and compare against `"SQLite format 3\0"` (latin1). On mismatch → show error snackbar with "Selected file is not a SQLite database." and return. On match → set state to open the `ConfirmImportDialog` with the file's name.
- [ ] T012 [US2] Wire `ConfirmImportDialog`'s `onConfirm` to: read the full file into a `Uint8Array` (`new Uint8Array(await file.arrayBuffer())`), then call `replaceDatabaseAndReload(bytes)`. Do NOT await beyond this — the helper either throws (caller surfaces error) or never resolves (page reloads). Wrap in try/catch; on throw, show a **fatal-mode** error UI (per FR-014): a persistent MUI `Alert severity="error"` (not the dismissible snackbar) in the toolbar area saying the previous database may have been removed and the new one failed to load, with a "Retry import" button that re-opens the file picker. The page MUST NOT auto-reload on this failure.
- [ ] T013 [US2] Disable the Import button and the confirm button while import is in progress (same loading-state pattern as T006).
- [ ] T014 [US2] Reset the file input's `value` to `''` after every selection (success or fail). Otherwise the same filename can't be picked twice in a row.
- [ ] T015 [US2] Manually validate US2 against quickstart Scenarios 1 (steps 5–8), 4, 5, 6, 7, 9, and the FR-014 failure-mode walkthrough in `specs/002-export-import-sqlite-dump/quickstart.md`. Run `npm run build && npm run preview`.

**Checkpoint**: Full round-trip works. Both stories shippable together; with US1 already merged, US2 layers cleanly on top.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T016 [P] Run `npm run typecheck && npm run lint` (the `check` script). Resolve any issues introduced.
- [ ] T017 [P] Mobile-viewport sanity check (iPhone SE / 375 px) per Constitution Principle VI: Export and Import buttons reachable, ≥44×44 px touch targets, no horizontal scroll introduced, confirmation dialog fits viewport.
- [ ] T018 Update `CLAUDE.md` Architecture invariants section if anything in this feature created a new invariant worth documenting (e.g., "`replaceDatabaseAndReload` is the only sanctioned way to swap the OPFS file mid-session"). If nothing new is invariant-worthy, skip — do not add filler.

---

## Dependencies

```
Phase 2 (Foundational)
    │
    ├──► Phase 3 (US1) ──► (shippable MVP)
    │
    └──► Phase 4 (US2) ──► (full feature)
              │
              └──► T008 depends on contract; T009 has no code deps;
                   T010 depends on T008+T009; T011 depends on T010;
                   T012 depends on T008+T009+T011.
    │
    ▼
Phase 5 (Polish, after either or both stories are merged)
```

**Story independence**: US1 and US2 can be implemented in either order or in parallel by two contributors. Their only shared surface is `WorkoutDataActions.tsx` (Phase 2 deliverable) and the `Promiser` type union in `database.ts` (each story extends it with a different command — both edits commute).

## Parallel execution opportunities

- **Within Phase 2**: T003 is `[P]` against T001 (different concerns inside the same new file — feasible if T001 lands first as scaffolding, then T003 adds to it; otherwise serialize).
- **Within Phase 4 (US2)**: T008 and T009 are `[P]` (different files, no shared imports).
- **Across stories** (with two contributors): all of US1's tasks (T004–T007) run in parallel with all of US2's tasks (T008–T015), after Phase 2 lands.
- **Phase 5**: T016 and T017 are `[P]`.

## Implementation strategy

1. **Land Phase 2** (T001–T003) — single small PR, no behavior change.
2. **Ship US1 as the MVP** (T004–T007). At this point the user already has backup capability. This is a defensible release boundary.
3. **Ship US2** (T008–T015). Round-trip is now complete.
4. **Polish** (T016–T018).

If under time pressure: US1 alone is genuinely useful and constitution-compliant. US2 can follow in a second PR without rework.

## Format validation

All tasks above conform to the required format:
- `- [ ]` checkbox prefix ✅
- Sequential `T001`–`T018` IDs ✅
- `[P]` marker only on parallelizable tasks ✅
- `[US1]` / `[US2]` story labels on Phase 3 and Phase 4 only (none on Phase 1, 2, or 5) ✅
- Concrete file paths in every task ✅

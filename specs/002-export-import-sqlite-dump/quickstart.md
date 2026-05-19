# Quickstart: Manual Validation

Validates the feature against Spec acceptance scenarios SC-001..SC-007. No test runner is configured (per Constitution Principle V); this procedure replaces unit tests.

**Prerequisites**:
- `npm install` already run.
- Build the production bundle (PWA + SW behavior off in dev): `npm run build && npm run preview`.
- Open the preview URL in Chrome or Safari.

---

## Scenario 1 — Round-trip on a populated database (SC-001, SC-002, SC-004)

1. In the app, add at least 5 workout entries with varied sets/reps/weights.
2. Click **Export**. A file `workout-log-YYYY-MM-DD.sqlite3` downloads.
3. **Expected (SC-001)**: download completes in < 3 seconds.
4. Open the downloaded file in DB Browser for SQLite (or `sqlite3 <file>`); verify `workout_log` and `workout_set` rows match the entries you added.
5. In the app, clear OPFS: DevTools → Application → Storage → Clear site data. Reload — the table is empty.
6. Click **Import**, pick the file from step 2, confirm the destructive prompt.
7. **Expected (SC-002)**: page reloads within 5 seconds and the table shows the same entries from step 1.
8. **Expected (SC-004)**: row count and every cell value are identical to step 1.

## Scenario 2 — Empty-database export round-trip (SC-004)

1. Start from a cleared OPFS (no entries).
2. Click **Export**. File downloads.
3. Inform message confirms "no entries exported" (or equivalent).
4. Import that file. After reload, the app is still empty and no errors are shown.

## Scenario 3 — UI responsiveness (SC-003)

1. With ~1,000 rows (script-seeded via DevTools console: paste a loop calling `window.__test_seed` if exposed, or insert manually), click Export.
2. While export runs, attempt to scroll/interact with the table.
3. **Expected**: no interaction freeze > 500ms. (The worker handles the export off the main thread.)

## Scenario 4 — Bad file rejection (SC-005, FR-009)

1. Pick any non-SQLite file (e.g., a JPEG, a `.txt`).
2. Click **Import**, select the bad file, confirm the destructive prompt.
3. **Expected**: a clear error message appears, the existing database is intact (refresh the page and verify your data is still there).
4. Verify in DevTools → Application → OPFS that `app.sqlite3` still exists with its original size.

## Scenario 5 — Cancel at file picker (FR-005 edge case)

1. Click **Import**.
2. Close the file picker without selecting anything.
3. **Expected**: no-op; no confirmation dialog appears; no errors.

## Scenario 6 — Cancel at confirmation dialog

1. Click **Import**, pick a valid `.sqlite3` file, then click **Cancel** in the confirmation dialog.
2. **Expected**: no destructive action; data intact; no reload.

## Scenario 7 — Cross-device transfer (SC-007)

1. Export on Device A.
2. Upload the file to a cloud drive; download on Device B (or in a different browser profile).
3. Import on Device B; verify the workout entries from Device A are now visible.

## Scenario 8 — Discoverability (SC-006)

1. Open the app in an incognito window (no prior context).
2. Without any prompting, locate the Export and Import controls.
3. **Expected**: a new user finds and uses both in under 30 seconds. Buttons must be visible in the workout-log toolbar with clear labels and/or recognizable icons.

## Scenario 9 — Mobile viewport (Principle VI)

1. Open DevTools → toggle device toolbar → iPhone SE (375×667).
2. The workout table renders without horizontal scroll; Export and Import controls are touch-sized (≥44×44 px) and reachable.
3. The confirmation dialog fits the viewport without clipping.

---

## Failure-mode walkthrough (FR-014)

This is the only path with permanent risk. To exercise:

1. Get into a state where the OPFS write will fail. Easiest: in DevTools, set OPFS quota to 0 via `await navigator.storage.persist()` and a quota override extension — or simply test the error UI by temporarily throwing in `replaceDatabaseAndReload` between the delete and write steps.
2. Trigger Import with a valid file and confirm.
3. **Expected**: a fatal error UI appears stating that the previous database has been removed and the new one failed to load. The page does NOT auto-reload. The user is given an option to retry the import.

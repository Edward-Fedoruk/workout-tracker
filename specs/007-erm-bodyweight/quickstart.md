# Quickstart: eRM & Body Weight Settings

**Branch**: `007-erm-bodyweight` | For full context: `specs/007-erm-bodyweight/`

## Pre-flight

```bash
git checkout 007-erm-bodyweight
npm install          # ensure deps are current
npm run typecheck    # baseline must be clean
npm run lint         # baseline must be clean
```

---

## Step 1 — DB schema: new migration

Edit `src/db/schema.ts`:
1. Add `classification` to the `exercise` table (see `data-model.md` § 2).
2. Remove `check('weight_check', ...)` from `workoutSet` (see `data-model.md` § 3).
3. Add new `appSetting` table export (see `data-model.md` § 1).

Then generate and inspect the migration:

```bash
npx drizzle-kit generate
```

The tool will generate `drizzle/0005_erm_bodyweight.sql`. **Review it** — Drizzle may not handle the table-rebuild for `workout_set` correctly; if not, edit the generated SQL to match the table-rebuild pattern in `data-model.md` § 3. Commit both the schema update and the SQL file.

---

## Step 2 — New DB helper: `src/db/settingsHelpers.ts`

Create `src/db/settingsHelpers.ts` per the contract in `contracts/settingsHelpers.ts.md`.
- `getBodyWeight(): Promise<number | null>`
- `setBodyWeight(kg: number): Promise<void>`

Re-export both from `src/database.ts`.

---

## Step 3 — Update exercise helpers for `classification`

In `src/db/exerciseHelpers.ts`:
- Add `ExerciseClassification` type and `classification` field to the `Exercise` type.
- Update `ExerciseRow` internal type to include `classification`.
- Update the SELECT in `listExercises` to include `classification`.
- Update `createExercise` and `updateExercise` to accept and persist `classification`.
- Update all return mappings to include `classification`.

---

## Step 4 — New utility: `src/utils/erm.ts`

Create `src/utils/erm.ts` per the contract in `contracts/erm.ts.md`.
- `computeEffectiveWeight({ bodyWeight, classification, loggedWeight }): number | null`
- `computeERM(effectiveWeight, reps): number`

Verify with manual spot checks:
- `computeERM(100, 5)` → `116.666…`
- `computeEffectiveWeight({ bodyWeight: 75, classification: 'bodyweight', loggedWeight: 10 })` → `85`
- `computeEffectiveWeight({ bodyWeight: 75, classification: 'assisted', loggedWeight: -30 })` → `45`
- `computeEffectiveWeight({ bodyWeight: null, classification: 'bodyweight', loggedWeight: 0 })` → `null`
- `computeEffectiveWeight({ bodyWeight: 75, classification: 'assisted', loggedWeight: -80 })` → `null` (result ≤ 0)

---

## Step 5 — Settings page

Create `src/components/settings/SettingsPage.tsx`:
- Container component. On mount, calls `getBodyWeight()` and stores in local state.
- Renders a controlled numeric input pre-filled with the current body weight.
- Has an explicit "Save" button. On click: validates (`> 0`, `<= 500`, `≤ 2 dp`), calls `setBodyWeight(value)`, shows success/error feedback.
- Navigation away without saving discards the uncommitted input (no prompt needed — see FR-006).

Add `'settings'` to the `ActiveView` union in `App.tsx`:
```ts
| { type: 'settings' }
```

Add a "Settings" tab to the `<Tabs>` bar and a branch in `renderContent()`.
Update `showTabBar` to include `activeView.type === 'settings'`.

---

## Step 6 — Exercise classification UI

In the exercise create/edit form (currently in `src/components/exercises/`):
- Add a classification selector (radio group or select) with the three options: Standard, Body weight, Assisted.
- Default to "Standard" for new exercises.
- Pass the value through to `createExercise` / `updateExercise`.

---

## Step 7 — eRM in WorkoutTable

In `src/components/WorkoutTable.tsx`:
- Fetch body weight via `getBodyWeight()` on mount (or accept as prop if a parent provides it).
- Fetch the exercise list (already available via `listExercises`) to look up each `workout_log` row's classification by `exercise_name`.
- For each set row: compute `effectiveWeight = computeEffectiveWeight(...)` and `erm = effectiveWeight !== null ? computeERM(effectiveWeight, reps) : null`.
- Display eRM alongside weight/reps. Show `"—"` when `erm` is `null`.
- Respect the 200-line file limit (Principle VIII): if the component grows, extract a `WorkoutSetRow` presentational component.

---

## Step 8 — Weight input validation in WorkoutForm

In the workout set input form (currently in `WorkoutForm.tsx`):
- Look up the exercise's `classification` before validating the weight field.
- Apply the correct rule per classification (see `data-model.md` § Application-layer weight rules).
- This replaces the removed DB-level `weight > 0` constraint.

---

## Step 9 — Lint, typecheck, verify

```bash
npm run typecheck
npm run lint
npm run dev        # smoke test: log a set, confirm eRM appears
```

Verify key scenarios manually in the browser:
1. Log a standard 100 kg × 5 set → eRM ≈ 116.7 kg displayed.
2. Open Settings → enter 75.25 kg → Save → reload → value persists.
3. Create a "Pull-up" exercise with classification "Body weight" → log 0 kg × 8 → eRM shown (using body weight).
4. Create an "Assisted Pull-up" exercise with classification "Assisted" → log -30 kg → accepted, eRM shown.
5. With no body weight set, log a body-weight exercise → "—" shown for eRM.

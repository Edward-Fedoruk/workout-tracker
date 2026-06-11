# Tasks: Exercise Images (illustrated exercise library)

**Input**: Design documents from `specs/013-exercise-images/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/exercise-image-picker.md ✅

**Tests**: No tests (no test runner configured — constitution Principle V)

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no in-flight dependencies)
- **[US1]**: User Story 1 — exercise list with circular images (P1)
- **[US2]**: User Story 2 — image picker in add/edit form (P2)

---

## Phase 1: Setup (Assets & Catalog Script)

**Purpose**: Copy image assets to `public/`, gitignore the dataset clone, and generate the picker's catalog JSON. All foundational work depends on T004 completing.

- [X] T001 [P] Add `exercises-dataset/` line to `.gitignore` in repo root
- [X] T002 [P] Create `public/exercises/` directory and copy all 1,324 `.jpg` files: `mkdir -p public/exercises && cp exercises-dataset/images/*.jpg public/exercises/`
- [X] T003 [P] Create `scripts/generate-exercise-catalog.js` — reads `exercises-dataset/data/exercises.json`, outputs `src/assets/exercise-catalog.json` with array of `{ filename, name, target, category }` (filename = basename of the `image` field, e.g. `"0025-EIeI8Vf.jpg"`)
- [X] T004 Run `node scripts/generate-exercise-catalog.js` to produce `src/assets/exercise-catalog.json` (1,324 entries). Verify file exists and entry count matches. Depends on T003.

**Checkpoint**: `public/exercises/` contains 1,324 `.jpg` files. `src/assets/exercise-catalog.json` exists with 1,324 entries.

---

## Phase 2: Foundational (DB Schema, Types, Repository, PWA)

**Purpose**: Core changes that MUST be complete before either user story can be implemented. Establishes the `image_filename` column, migration, updated repository methods, and Workbox runtime caching.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 Add `imageFilename: text('image_filename')` (nullable, no default) to the `exercise` sqliteTable definition in `src/db/entities/exercise/schema.ts`
- [X] T006 Run `npx drizzle-kit generate` to produce a new migration SQL file in `drizzle/` (e.g. `drizzle/0003_exercise-image-filename.sql`). Confirm it contains `ALTER TABLE \`exercise\` ADD \`image_filename\` text;` (Note: required adding `compilerOptions.paths` to root `tsconfig.json` so drizzle-kit could resolve the `@/` alias.)
- [X] T007 Append the 24 curated UPDATE statements to `drizzle/0003_exercise-image-filename.sql` after a `\--> statement-breakpoint` separator. Use the mapping from `specs/013-exercise-images/data-model.md § Default Exercise → Image Mapping`. Format: `UPDATE \`exercise\` SET \`image_filename\` = '<filename>' WHERE \`name\` = '<exercise name>';`
- [X] T008 Update `list()` in `src/db/entities/exercise/repository.ts` — add `image_filename` to the SELECT column list in the raw SQL query; include `imageFilename: row.image_filename` in the mapped return object
- [X] T009 Update `create()` and `update()` in `src/db/entities/exercise/repository.ts` — add optional `imageFilename?: string | null` parameter; pass it to the Drizzle insert/update `.values()` / `.set()` calls (depends on T008, same file)
- [X] T010 Update `src/database.ts` — add optional `imageFilename?: string | null` parameter to `createExercise` and `updateExercise` exports; forward it to the repository calls (depends on T009)
- [X] T011 [P] **DEVIATION (full-offline per user request):** Original plan was `workbox.runtimeCaching` (`CacheFirst`), but this project uses `strategies: 'injectManifest'`, where `workbox.runtimeCaching` is **not honored** by vite-plugin-pwa (it only applies in `generateSW` mode) and the custom `src/sw.ts` already `respondWith`s every request. Instead, the 1,324 images (~11 MB) are **precached** by adding `jpg` to `globPatterns` under both the `injectManifest` and `workbox` keys in `vite.config.ts`. Verified: build reports `precache 1341 entries`, with 1,324 `.jpg` in `dist/sw.js`. This gives true offline-after-install for ALL images, not just viewed ones.

**Checkpoint**: `npm run dev` starts. Open DevTools console — confirm `[migrations] Applied 0003_exercise-image-filename.sql`. `listExercises()` returns objects with `imageFilename` field. Default exercises have non-null `imageFilename` values.

---

## Phase 3: User Story 1 — Exercise list with circular images (Priority: P1) 🎯 MVP

**Goal**: Every exercise row in the Exercise Library shows a circular avatar image (or initials placeholder) to the left of the exercise name.

**Independent Test**: Open the Exercise Library on a fresh install (after migration). Confirm "Bench Press" shows a circular image at the left of its row. Confirm a custom exercise with no image shows an initials circle (no broken/empty slot).

- [X] T012 [US1] Modify `src/routes/exercises/Exercise/ExerciseList/index.tsx` — import `Avatar` and `ListItemAvatar` from `@mui/material`; wrap each `ListItem`'s content in `ListItemAvatar` + `Avatar` with `src={exercise.imageFilename ? \`${import.meta.env.BASE_URL}exercises/${exercise.imageFilename}\` : undefined}` and `alt={exercise.name}` and `sx={{ width: 40, height: 40 }}`; shift existing `<Box>` content to a `ListItemText`-style wrapper; ensure the `secondaryAction` (edit/delete buttons) still renders correctly

**Checkpoint**: Exercise Library shows circular images for all 24 default exercises. Exercises without an image show the MUI Avatar initials fallback. No broken image slots.

---

## Phase 4: User Story 2 — Image picker in add/edit exercise form (Priority: P2)

**Goal**: When creating or editing an exercise, the user can open an image picker, search the 1,324-image library, and select or clear an image that is then saved with the exercise.

**Independent Test**: Open "Add Exercise", tap "Select image", search "bench", select an image, save. Confirm the new exercise appears in the list with that circular image. Open "Edit Exercise", change the image, save — list reflects the new image.

- [X] T013 [P] [US2] Create `src/routes/exercises/Exercise/ExerciseImagePicker/index.tsx` — implement the `ExerciseImagePicker` component per the contract in `specs/013-exercise-images/contracts/exercise-image-picker.md`: props `{ open, currentFilename, onSelect, onClose }`, MUI `Dialog` (fullWidth, maxWidth="sm"), debounced search `TextField` (200ms), responsive CSS grid of 72px `Avatar` thumbnails from `src/assets/exercise-catalog.json` filtered by name/target/category, selected item highlighted with border, "Select" confirm button, "Clear" button (only when currentFilename set), "Cancel" button; images loaded with `loading="lazy"` from `${import.meta.env.BASE_URL}exercises/<filename>`
- [X] T014 [P] [US2] Update `src/routes/exercises/Exercise/ExerciseForm/schema.ts` (also enabled `resolveJsonModule` in `tsconfig.app.json` so the catalog JSON can be imported) — add `imageFilename: z.string().nullable().optional()` to the Zod schema object; update `FormValues` type accordingly
- [X] T015 [US2] Update `src/routes/exercises/Exercise/ExerciseForm/index.tsx` — add `imageFilename` to `EMPTY_VALUES` (null); add local `const [pickerOpen, setPickerOpen] = useState(false)`; render a compact "Select image" / "Change image" button below the Classification field that opens picker; render `<ExerciseImagePicker open={pickerOpen} currentFilename={watch('imageFilename') ?? null} onSelect={(f) => { setValue('imageFilename', f); setPickerOpen(false); }} onClose={() => setPickerOpen(false)} />`; display a small preview Avatar of the selected image next to the button (depends on T013, T014)
- [X] T016 [US2] Update `src/routes/exercises/ExerciseLibrary/hooks/useExercises.ts` (and `views/ExercisesSubView.tsx`, where the edit form's `initialValues` are built — added `imageFilename`) — in `handleSave`, pass `values.imageFilename ?? null` as the `imageFilename` argument to `createExercise` and `updateExercise`; update `openEdit` to ensure `editingExercise.imageFilename` is included in form initial values passed down (depends on T010, T015)

**Checkpoint**: Full US2 flow works end-to-end. New exercises can be saved with a chosen image and appear in the list with it. Editing an exercise pre-selects its current image. Clearing works. Saving without an image shows the placeholder.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and final quality gate.

- [X] T017 [P] Add an "Exercise Images Setup" section to `README.md` documenting the one-time copy step: `mkdir -p public/exercises && cp /path/to/exercises-dataset/images/*.jpg public/exercises/` and `node scripts/generate-exercise-catalog.js`
- [X] T018 [P] Run `npm run lint && npm run typecheck` — fix any lint or TypeScript errors introduced by the feature. **typecheck: clean. lint: all feature files clean.** Added `exercises-dataset` + `scripts` to `eslint.config.js` ignores (the gitignored dataset clone was being linted → 9k errors). NOTE: 9 PRE-EXISTING lint errors remain in `src/routes/settings/BodyWeightForm.tsx` (2) and `src/routes/settings/hooks/useDatabaseActions.ts` (7) — these are on the branch independent of this feature and were left untouched (out of scope).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: T005–T007 depend on T004 (catalog ready); T011 is independent
- **US1 (Phase 3)**: Depends on T007 (migration with 24 UPDATEs) and T008 (list returns imageFilename)
- **US2 (Phase 4)**: Depends on full Phase 2 (T010); T013 and T014 are parallel; T015 depends on T013 + T014; T016 depends on T010 + T015
- **Polish (Phase 5)**: Depends on all user stories complete

### Within-Phase Task Dependencies

```
T001 T002 T003 → can all start in parallel
T004 → needs T003
T005 → needs T004
T006 → needs T005
T007 → needs T006
T008 → needs T006 (schema types available)
T009 → needs T008 (same file, sequential)
T010 → needs T009
T011 → independent (parallel with T005–T010)
T012 → needs T007 + T008
T013 T014 → parallel with each other, need Phase 2 complete
T015 → needs T013 + T014
T016 → needs T010 + T015
T017 T018 → parallel, need all stories complete
```

### Parallel Opportunities

**Phase 1**: T001, T002, T003 all run in parallel.  
**Phase 2**: T011 runs in parallel with all DB tasks.  
**Phase 4**: T013 and T014 run in parallel.  
**Phase 5**: T017 and T018 run in parallel.

---

## Parallel Example: Phase 2 Foundational

```bash
# These run in parallel:
Task T011: "Update vite.config.ts with runtimeCaching for exercise images"

# While the DB chain runs sequentially:
T005 → T006 → T007 → T008 → T009 → T010
```

## Parallel Example: Phase 4 (US2)

```bash
# These run in parallel first:
Task T013: "Create ExerciseImagePicker component"
Task T014: "Update ExerciseForm schema with imageFilename"

# Then sequentially:
T015 → T016
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Foundational (T005–T011)
3. Complete Phase 3: User Story 1 (T012 only)
4. **STOP and VALIDATE**: Exercise Library shows circular images for all defaults
5. Ship US1 — already delivers visible value

### Incremental Delivery

1. Setup + Foundational → DB migration applied, images served ✅
2. US1 (T012) → Circular images in exercise list ✅ (MVP)
3. US2 (T013–T016) → Image picker in add/edit form ✅
4. Polish → README + lint/typecheck ✅

---

## Notes

- **Vite base URL**: Use `${import.meta.env.BASE_URL}exercises/<filename>` for all image `src` values — this handles both dev (`/`) and production (`/workout-tracker/`) correctly.
- **MUI Avatar fallback**: When `src` is undefined or fails to load, MUI Avatar automatically renders the first letter of `alt`. No explicit fallback code needed.
- **Migration safety**: The 24 UPDATE statements in T007 use hardcoded name literals that match the existing seed data exactly. If an exercise was renamed, the UPDATE silently no-ops (exercise keeps `NULL` image_filename) — acceptable per the spec.
- **Catalog type**: Add `src/assets/exercise-catalog.d.ts` or use `as const` / `satisfies` if TypeScript cannot infer the JSON type.
- [P] tasks = different files or truly independent operations with no shared in-flight state
- Commit after each phase checkpoint

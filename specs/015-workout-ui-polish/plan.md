# Implementation Plan: Workout UI Polish

**Branch**: `015-workout-ui-polish` | **Date**: 2026-06-12 | **Spec**: [spec.md](./spec.md)

## Summary

Nine targeted UI improvements to the workout log screen: compact set display (icon headers, image exercise column, `80×5` format, 12px font / 10px padding), action-menu consolidation (three-dot menu in both tables), advanced view clean-up (remove Add Workout + fullscreen toggle, add iPhone safe-area padding), and a bottom-drawer add/edit form. The only data change is extending the pivot SQL query to LEFT JOIN the exercise table, adding `exercise_image_filename` to `WorkoutTableRow`.

## Technical Context

**Language/Version**: TypeScript (strict), React 18  
**Primary Dependencies**: MUI v6, MaterialReactTable, react-hook-form, Drizzle ORM, SQLite-WASM  
**Storage**: SQLite via OPFS (no schema changes; query extension only)  
**Testing**: None configured (Constitution Principle V)  
**Target Platform**: PWA — mobile-first, iOS Safari + Chrome Android  
**Performance Goals**: No new async operations; UI-only changes except the JOIN  
**Constraints**: offline-capable, no backend, COOP/COEP headers required  
**Scale/Scope**: Single-user local DB; all changes are presentational or query-level

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Local-First | ✅ Pass | No backend, no new persistence layer |
| II. Single Worker, Single Init | ✅ Pass | No changes to `initDatabase` or worker |
| III. Schema-Complete Before Ready | ✅ Pass | No DDL; query extended, not schema |
| IV. Parameterised SQL | ✅ Pass | Raw SQL stays parameterised (pivot query); no interpolation |
| V. Simplicity & Explicit Scope | ✅ Pass | No new tests, no new infra |
| VI. Mobile-First | ✅ Pass | Bottom drawer, safe-area padding, 44px touch targets |
| VII. Component Separation | ✅ Pass | WorkoutRowActions stays presentational; logic stays in hooks |
| VIII. Code Organisation | ✅ Pass | WorkoutRowActions moved to folder; existing files stay under 200 lines |
| IX. Strong TypeScript | ✅ Pass | WorkoutTableRow extended with proper type; no `any` casts |

No violations. No Complexity Tracking entries required.

## Project Structure

### Documentation (this feature)

```text
specs/015-workout-ui-polish/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   ├── grouped-workout-table.md
│   ├── workout-row-actions.md
│   └── workout-bottom-drawer.md
└── tasks.md             ← Phase 2 output (/speckit-tasks)
```

### Source Code (files touched)

```text
src/
├── db/
│   └── entities/
│       └── workout-log/
│           ├── types.ts              ← add exercise_image_filename field
│           └── repository.ts         ← extend pivot query with LEFT JOIN exercise
├── routes/
│   └── workouts/
│       ├── WorkoutSetRow.tsx          ← formatSetCell, icon color="secondary"
│       ├── WorkoutRowActions/         ← NEW folder (was flat .tsx)
│       │   └── index.tsx              ← three-dot menu; same props as before
│       ├── GroupedWorkoutTable/
│       │   └── index.tsx              ← icon headers, image col, Advanced btn, padding/font
│       ├── AdvancedWorkoutTable/
│       │   └── index.tsx              ← remove Add Workout + fullscreen, safe-area padding
│       └── views/
│           └── WorkoutsView.tsx       ← remove Advanced btn row, FormDialog→SwipeableDrawer
```

## Implementation Steps

### Step 1 — Extend WorkoutTableRow and pivot query

**Files**: `src/db/entities/workout-log/types.ts`, `src/db/entities/workout-log/repository.ts`

- Add `exercise_image_filename: null | string` to the `WorkoutTableRow` type.
- In the raw SQL pivot query, add `LEFT JOIN exercise e ON e.name = w.exercise_name` and select `e.image_filename AS exercise_image_filename`; add it to `GROUP BY`.

### Step 2 — Update formatSetCell and set icon color

**File**: `src/routes/workouts/WorkoutSetRow.tsx`

- Change `formatSetCell`:
  - `weight + reps` → `` `${weight}×${reps}` ``
  - `weight only` → `` `${weight}` ``
  - `reps only` → `` `×${reps}` ``
- Add `color="secondary"` to each `SetIcon` in `buildSetColumns` (the `Header` JSX in both the set column and the eRM column icon).

### Step 3 — Refactor WorkoutRowActions to three-dot menu

**Action**: Delete `src/routes/workouts/WorkoutRowActions.tsx`; create `src/routes/workouts/WorkoutRowActions/index.tsx`.

The new component:
- Renders `IconButton` with `MoreVertIcon`.
- Manages `anchorEl` state locally.
- Opens `Menu` anchored to the button; contains two `MenuItem`s: "Edit" (calls `onEdit`) and "Delete" (calls `onDelete`, styled with `color="error"`).
- Props (`onEdit: () => void`, `onDelete: () => void`) are unchanged — no call-site changes except updating the import path.

### Step 4 — Update GroupedWorkoutTable

**File**: `src/routes/workouts/GroupedWorkoutTable/index.tsx`

Changes:
1. Add `onAdvanced: () => void` prop.
2. Replace `"Set {setNumber}"` text in `<TableCell>` headers with `<SetIcon color="secondary" />` (import LooksOne–Looks5 from `@mui/icons-material`).
3. Replace the exercise text cell with an `<img>` tag (or `FitnessCenterIcon` placeholder) using `exercise_image_filename` from the row:
   - Column width: fixed at 48px (enough for a 40×40px image + 4px padding each side).
   - Image size: 40×40px, `objectFit: "cover"`, `borderRadius: 4px`.
   - Placeholder: `FitnessCenterIcon` at `fontSize="large"` (~40px).
4. Apply `sx={{ fontSize: '12px', px: '10px' }}` to each set `<TableCell>`.
5. Move the "Advanced" button into the last `<TableCell>` of `<TableHead>` (replacing the empty cell that previously held nothing):

   ```tsx
   <TableCell>
     <Button size="small" onClick={onAdvanced} variant="text">Advanced</Button>
   </TableCell>
   ```

### Step 5 — Update AdvancedWorkoutTable

**File**: `src/routes/workouts/AdvancedWorkoutTable/index.tsx`

Changes:
1. Remove `onAdd` prop and the `renderTopToolbarCustomActions` option.
2. Add `enableFullScreenToggle: false` to the table config.
3. Wrap `<MaterialReactTable>` in a `Box` with `sx={{ pt: 'max(env(safe-area-inset-top), 16px)' }}`.
4. The row actions (`renderRowActions`) already use `WorkoutRowActions` — once Step 3 is done the import path updates but no logic changes needed.

Type change: `Props` loses the `onAdd` field; callers updated accordingly.

### Step 6 — Update WorkoutsView

**File**: `src/routes/workouts/views/WorkoutsView.tsx`

Changes:
1. Remove the `<Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>` block containing the standalone "Advanced" button.
2. Pass `onAdvanced={handleAdvancedOpen}` to `<GroupedWorkoutTable>`.
3. Remove `onAdd` from `<AdvancedWorkoutTable>`.
4. Replace `<FormDialog>` with `<SwipeableDrawer>`:

   ```tsx
   <SwipeableDrawer
     anchor="bottom"
     disableSwipeToOpen
     onClose={handleCancelForm}
     onOpen={() => undefined}
     open={formDialog.isOpen}
     sx={{
       '& .MuiDrawer-paper': {
         borderRadius: '12px 12px 0 0',
         maxHeight: '90dvh',
         overflowY: 'auto',
       },
     }}
   >
     <Box sx={{ p: 2 }}>
       <Box sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', mb: 1 }}>
         <Typography variant="h6">
           {editingWorkout ? 'Edit Workout' : 'Add Workout'}
         </Typography>
         <IconButton onClick={handleCancelForm}><CloseIcon /></IconButton>
       </Box>
       <WorkoutForm ... />
     </Box>
   </SwipeableDrawer>
   ```

5. Remove the `FormDialog` import; add `SwipeableDrawer` import.

## Complexity Tracking

*(No constitution violations — section left blank)*

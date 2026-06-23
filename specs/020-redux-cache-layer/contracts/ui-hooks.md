# Contract: UI container-hook migration

Container hooks under `src/routes/**/hooks/` are the migration surface. Each is re-pointed from
`useState` + `refresh()` to the store's generated query/mutation hooks **while preserving its public return
shape**, so presentational components and route layouts need no change (Constitution VII).

## General migration pattern

Before (status quo — `useExercises`):

```ts
const [exercises, setExercises] = useState<Exercise[]>([]);
const refresh = async () => setExercises(await listExercises());
// create → await createExercise(...) → await refresh()
```

After (cache-backed):

```ts
const { data: exercises = [], isLoading, isError } = useListExercisesQuery();
const [createExerciseMut] = useCreateExerciseMutation();
// create → await createExerciseMut(args).unwrap()  (throws on failure; cache auto-updates via tags)
```

## Contract rules

- HR-1: **Return shape is preserved.** Keys the views already consume (`exercises`, `workouts`, `routines`,
  `bodyWeight`, `handleSave`, `openCreate`, dialogs, etc.) keep their names and types. `ReturnType<>`-based
  view props stay valid.
- HR-2: **`refresh()` becomes a no-op or is removed.** Cache invalidation replaces manual refresh. Where a
  caller still imports `refresh`, keep a no-op (resolves immediately) to avoid touching the view, and remove
  it when the view is next edited.
- HR-3: **Reads come from query hooks.** `data` (with a sensible default like `?? []`), `isLoading`,
  `isFetching`, `isError`, `error` map to the view's existing loading/error affordances (FR-012). On a cached
  revisit, `isLoading` is `false` and `data` is present immediately (SC-001).
- HR-4: **Writes call mutation hooks and `.unwrap()`.** `handleSave`/delete handlers `await mut(args).unwrap()`
  and translate a thrown error into the same `string | null` / error-state the view expects today
  (FR-007). No manual `refresh()` after — tags handle it.
- HR-5: **Client-side validation stays in the hook.** E.g. the duplicate-name check reads the cached list
  from the query hook before dispatching the create mutation (unchanged logic).
- HR-6: **No direct `@/database` reads for cached data.** A migrated hook MUST NOT call `listX`/`getX`
  helpers directly for data the store now owns (FR-008). Exception: `getLastExerciseSets` (per store-api
  contract) may remain a direct call.
- HR-7: **Hooks that load multiple data sets** (e.g. `useWorkouts` loads workouts + exercises + body weight +
  display pref) call multiple query hooks; combined loading = `a.isLoading || b.isLoading || ...`.

## Per-hook migration map

| Hook | Query hooks used | Mutation hooks used |
|------|------------------|---------------------|
| `exercises/ExerciseLibrary/hooks/useExercises` | `useListExercisesQuery` | `useCreateExerciseMutation` (+ update/delete where present) |
| `exercises/ExerciseLibrary/hooks/useMuscleGroups` | `useListMuscleGroupsQuery` | create/update/delete muscle group |
| `exercises/Exercise/ExerciseDetail/hooks/useExerciseDetail` | `useGetExerciseQuery`, `useListWorkoutsByExerciseNameQuery` | update/delete exercise |
| `exercises/Analytics/hooks/*` | `useListSetRowsInRangeQuery`, `useListMuscleGroupSetRowsInRangeQuery`, `useListExercisesQuery`, `useListMuscleGroupsQuery` | — (read-only) |
| `workouts/hooks/useWorkouts` | `useListWorkoutsQuery`, `useListExercisesQuery`, `useGetBodyWeightQuery`, `useGetExerciseNamesInTablesQuery` | create/update/delete workout |
| `workouts/StrengthBanner/hooks/useStrengthProgress` | `useListSetRowsInRangeQuery` | — |
| `routines/RoutineList/hooks/useRoutines` | `useListRoutinesQuery`, `useGetDraftQuery` | create/delete routine |
| `routines/RoutineWorkout/hooks/useRoutineStructure` | `useGetRoutineQuery` | routine-exercise mutations |
| `routines/RoutineWorkout/hooks/useRoutineWorkout` | `useGetRoutineQuery`, `useGetDraftQuery` | `saveDraft`, `clearDraft`, `createWorkout` |
| `settings/hooks/useBodyWeight` | `useGetBodyWeightQuery` | `useSetBodyWeightMutation` |
| `settings/hooks/useDisplaySettings` | `useGetExerciseNamesInTablesQuery` | `useSetExerciseNamesInTablesMutation` |
| `settings/hooks/useDatabaseActions` | — (export/import/reload unchanged) | — (still calls `@/database` utilities directly; reload clears the store, FR-010) |

## Acceptance checks for this contract

- AC-4: After migrating a hook, its view file is unchanged (diff touches only the hook), proving HR-1.
- AC-5: Renaming an exercise reflects in the library list, any routine referencing it, and analytics, with no
  manual refresh (FR-004/FR-013).
- AC-6: With the network throttled to offline in `npm run preview`, all read/edit flows still work (FR-011).

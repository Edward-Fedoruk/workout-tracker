# Tasks: Exercise eRM Performance Chart

**Input**: Design documents from `specs/017-exercise-erm-chart/`  
**Branch**: `017-exercise-erm-chart`  
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅ | quickstart.md ✅

**Tests**: Not included — no test runner is configured (Constitution Principle V).

**Organization**: Tasks grouped by user story. All three stories land in the same component (`ExerciseErmChart/index.tsx`), so they build incrementally but each story's tasks produce a testable increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (targets different props/sections of a file, no ordering dependency)
- **[Story]**: User story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Install the one new dependency required by this feature.

- [x] T001 Install `@mui/x-charts` via `npm install @mui/x-charts` and verify it appears in `package.json` dependencies

---

## Phase 2: Foundational (Blocking Prerequisite)

**Purpose**: Expose raw workout rows from the existing hook so the chart component can receive them. Must be complete before any chart work.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Add `rawRows: WorkoutTableRow[]` state (default `[]`) to `src/routes/exercises/Exercise/ExerciseDetail/hooks/useExerciseDetail.ts`; in `loadHistory`, call `setRawRows(rows)` before `setGroups(groupWorkoutsByDate(rows))`; add `rawRows` and `WorkoutTableRow` to the hook's return object and imports from `@/database`

**Checkpoint**: `rawRows` is populated on page load and available in the hook's return value.

---

## Phase 3: User Story 1 — View eRM Trend Per Set (Priority: P1) 🎯 MVP

**Goal**: A line chart appears on the exercise detail page showing one color-coded eRM series per set number (Set 1–5) plotted over workout dates, with a three-option time-range filter.

**Independent Test**: Navigate to an exercise with 2+ logged sessions. Confirm a line chart renders with at least one colored series, workout dates on the X-axis, and three filter buttons (All Time / Last Year / Last Month). Changing the filter updates the chart immediately.

### Implementation for User Story 1

- [x] T003 [US1] Create `src/routes/exercises/Exercise/ExerciseDetail/views/ExerciseErmChart/index.tsx` — export `ExerciseErmChart`; define `ExerciseErmChartProps = { rows: WorkoutTableRow[] }` and `type TimeRange = 'all' | 'year' | 'month'`; add `useState<TimeRange>('all')` for the selected filter; render three filter toggle buttons (All Time / Last Year / Last Month) using MUI `ToggleButtonGroup`
- [x] T004 [US1] In `ExerciseErmChart/index.tsx`, implement `filterByRange(rows, range)` (ISO date string cutoff comparison) and `deriveChartSeries(filteredRows)` (reverse rows to chronological order; build union date array; produce one `{ id, label, data: Array<number|null> }` per set number 1–5 that has at least one non-null eRM value)
- [x] T005 [US1] In `ExerciseErmChart/index.tsx`, render `<LineChart>` from `@mui/x-charts/LineChart` using the derived `xDates` array as `xAxis[0].data` (scaleType `'band'`) and `series` array; set `width` to fill container (`sx={{ width: '100%' }}`), fixed `height={260}`; enable the built-in legend
- [x] T006 [US1] In `src/routes/exercises/Exercise/ExerciseDetail/views/ExerciseDetailView.tsx`, import `ExerciseErmChart`; add `rawRows` to the destructured props (from `UseExerciseDetailReturn`); render `<ExerciseErmChart rows={rawRows} />` between the exercise info header `<Box>` and the `<Divider>` that separates the header from the history table

**Checkpoint**: Chart renders with colored lines per set, date-based X-axis, and working time-range filter. US1 is fully functional.

---

## Phase 4: User Story 2 — Understand eRM Calculation (Priority: P2)

**Goal**: The chart's Y-axis and per-point tooltips make it unambiguous that the metric is Estimated 1-Rep Max, not raw weight.

**Independent Test**: Hover/tap any data point — tooltip must show date, set label ("Set 1", etc.), and the eRM value. The Y-axis label must read "eRM" or "Estimated 1-Rep Max" without opening any tooltip.

### Implementation for User Story 2

- [x] T007 [P] [US2] In `ExerciseErmChart/index.tsx`, add `yAxis={[{ label: 'eRM (kg)' }]}` prop to `<LineChart>` (FR-008 — clear Y-axis identification of the metric)
- [x] T008 [P] [US2] In `ExerciseErmChart/index.tsx`, configure the `<LineChart>` tooltip via the `tooltip` prop or `slotProps` to surface session date, set label, and eRM value per point (FR-007 — MUI X Charts shows tooltips by default; verify the default tooltip includes date, series label, and value, and add explicit `tooltip={{ trigger: 'item' }}` if needed for tap support on mobile)

**Checkpoint**: Tooltip and Y-axis label satisfy FR-007 and FR-008. US2 is fully functional.

---

## Phase 5: User Story 3 — Graceful Empty State (Priority: P3)

**Goal**: When no eRM data exists (no history at all, or none in the selected time range), the chart area shows a clear message rather than a blank or broken chart.

**Independent Test**: Open an exercise with no history — confirm a non-empty message appears instead of the chart. With an exercise that has history, select "Last Month" when no sessions exist in that window — confirm a different "no data for this period" message appears.

### Implementation for User Story 3

- [x] T009 [US3] In `ExerciseErmChart/index.tsx`, before rendering `<LineChart>`, check `series.length === 0`; if true, render a `<Typography color="text.secondary">` empty-state message: use `"No workout history yet."` when `rows.length === 0`, and `"No data for the selected period."` when rows exist but none fall in the selected range (covers FR-006 and FR-012)

**Checkpoint**: Both empty-state variants render correctly. US3 is fully functional. All three user stories are now complete.

---

## Phase 6: Polish & Quality Gate

**Purpose**: Ensure code quality and validate the full feature end-to-end.

- [ ] T010 Run `npm run typecheck && npm run lint` from repo root; resolve any TypeScript errors (no `as any` casts per Principle IX) and ESLint warnings before marking complete
- [ ] T011 Manual smoke test per quickstart.md Step 5: (a) chart renders with history, (b) filter buttons update chart immediately, (c) empty state appears for exercise with no history, (d) layout is correct at 375px viewport width with no horizontal overflow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (T001 must be installed before imports work) — **blocks all user story phases**
- **Phase 3 (US1)**: Depends on Phase 2 completion — T003 → T004 → T005 → T006 (sequential within US1)
- **Phase 4 (US2)**: Depends on T005 (LineChart must exist before configuring its axis/tooltip) — T007 and T008 are parallel
- **Phase 5 (US3)**: Depends on T004 (series derivation must exist to check `series.length === 0`)
- **Phase 6 (Polish)**: Depends on all phases complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependency on US2 or US3
- **US2 (P2)**: Depends on T005 (LineChart rendered) — adds axis label and tooltip config
- **US3 (P3)**: Depends on T004 (series derivation) — adds empty-state branch above the chart

### Parallel Opportunities

- T007 and T008 (both in US2 phase) can run in parallel — they configure different props of `<LineChart>` and do not conflict

---

## Parallel Example: User Story 2

```
# T007 and T008 can be done concurrently (different LineChart props):
Task: "Add yAxis label to LineChart in ExerciseErmChart/index.tsx"
Task: "Configure LineChart tooltip in ExerciseErmChart/index.tsx"
```

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Phase 1: Install `@mui/x-charts` (T001)
2. Phase 2: Add `rawRows` to hook (T002)
3. Phase 3: Build chart component and wire it in (T003–T006)
4. **STOP and VALIDATE**: Chart renders with colored lines and working filter
5. Ship US1 alone if needed — chart is fully usable even without explicit labels/empty-state polish

### Incremental Delivery

1. T001 + T002 → Foundation ready
2. T003–T006 → Chart visible with eRM trends and filter (US1 MVP)
3. T007 + T008 → Chart self-explanatory without prior eRM knowledge (US2)
4. T009 → No blank states for new users or sparse data (US3)
5. T010 + T011 → Quality gate before merge

---

## Notes

- All tasks touch files inside `ExerciseDetail/` — no new routes, no schema migrations
- `ExerciseErmChart/index.tsx` should stay under ~200 lines (Principle VIII); if it grows, extract `filterByRange` and `deriveChartSeries` to a co-located `ermChartUtils.ts`
- Use `@/` imports everywhere; no `../` parent-relative imports (Principle VIII)
- eRM data is already stored in `workout_set.erm` — no DB changes needed

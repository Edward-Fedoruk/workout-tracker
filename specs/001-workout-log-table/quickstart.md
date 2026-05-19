# Quickstart: Implement Workout Log Table

**Duration**: ~1 week of focused development (9 hours estimated)  
**Prerequisite**: Familiarity with React, TypeScript, Chakra UI (or CSS Flex/Grid)  
**Dependencies**: Existing `src/database.ts` patterns, Vite build, SQLite-WASM

---

## What You're Building

A responsive workout logging table that:
- Displays workouts (date, exercise, weight/reps for up to 5 sets) in a single table
- Allows users to add, edit, and delete workout entries
- Persists all data to SQLite-WASM via OPFS (local browser storage)
- Sorts by most recent workout first
- Works on mobile (≥320px) and desktop without horizontal scroll

---

## High-Level Flow

```
1. Database Layer (src/database.ts)
   ├─ Add CREATE TABLE workout_log, workout_set to initDatabase()
   ├─ Export helpers: createWorkout(), listWorkouts(), updateWorkout(), deleteWorkout()
   └─ Format query results for UI (flatten sets into columns)

2. Form Component (src/components/WorkoutForm.tsx)
   ├─ Modal/inline form for create/edit
   ├─ Date picker (past/current dates only)
   ├─ Exercise name input
   ├─ Dynamic set inputs (min 1, max 5)
   └─ Save/Cancel buttons

3. Table Component (src/components/WorkoutTable.tsx)
   ├─ Display workouts sorted by date (DESC)
   ├─ Columns: date | exercise | Set1_weight | Set1_reps | ... | Set5_weight | Set5_reps
   ├─ Edit/Delete buttons per row
   ├─ Responsive: hide low-priority columns on narrow screens
   └─ Integrate with form (modal or separate view)

4. App Integration (src/App.tsx)
   ├─ Mount <WorkoutTable /> inside isDbReady gate
   └─ Pass form component to table (or handle state at App level)
```

---

## File Structure (After Implementation)

```
src/
├── database.ts                   # ADD: workout_log table schema + helpers
├── components/
│   ├── WorkoutTable.tsx          # NEW: Table display + row actions
│   ├── WorkoutForm.tsx           # NEW: Form for create/edit
│   └── [existing components]
├── App.tsx                       # UPDATE: Mount table after isDbReady gate
└── index.css                     # UPDATE: Add responsive table styles (if not using Chakra)
```

---

## Step-by-Step Implementation

### Phase 1: Database Layer (2 hours)

**File**: `src/database.ts`

1. Add schema creation inside `initDatabase()`:
   ```typescript
   // After existing tables, add:
   await promiser('exec', {
     sql: `
       CREATE TABLE IF NOT EXISTS workout_log (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         workout_date DATE NOT NULL CHECK (workout_date <= DATE('now')),
         exercise_name TEXT NOT NULL,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
       );
       
       CREATE TABLE IF NOT EXISTS workout_set (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         workout_id INTEGER NOT NULL REFERENCES workout_log(id) ON DELETE CASCADE,
         set_number INTEGER NOT NULL CHECK (set_number BETWEEN 1 AND 5),
         weight REAL NOT NULL CHECK (weight > 0),
         reps INTEGER NOT NULL CHECK (reps > 0),
         UNIQUE(workout_id, set_number)
       );
     `,
     bind: [],
     dbId,
   });
   ```

2. Export typed helpers:
   ```typescript
   // Create workout + sets
   export async function createWorkout(
     workoutDate: string,
     exerciseName: string,
     sets: { weight: number; reps: number }[]
   ): Promise<number> { /* ... */ }
   
   // List all workouts (flattened for table)
   export async function listWorkouts(): Promise<WorkoutTableRow[]> { /* ... */ }
   
   // Update workout
   export async function updateWorkout(
     id: number,
     workoutDate: string,
     exerciseName: string,
     sets: { weight: number; reps: number }[]
   ): Promise<void> { /* ... */ }
   
   // Delete workout
   export async function deleteWorkout(id: number): Promise<void> { /* ... */ }
   ```

3. **Helper hints**:
   - Use `SELECT ... FROM workout_log JOIN workout_set ...` with grouped results or flatten in JS
   - Handle NULL set columns (sets 4–5 may be empty)
   - Sort by `workout_date DESC`
   - Always use bind arrays: `bind: [param1, param2, ...]`

---

### Phase 2: Form Component (3 hours)

**File**: `src/components/WorkoutForm.tsx`

1. **State**:
   ```typescript
   const [formData, setFormData] = useState<WorkoutFormData>({
     workout_date: new Date().toISOString().split('T')[0], // Today
     exercise_name: '',
     sets: [{ weight: '', reps: '' }],
   });
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   ```

2. **Validation**:
   - Date: must be ≤ today (check at form level; DB enforces)
   - Exercise: non-empty string
   - Sets: 1–5 items, each with weight > 0 and reps > 0
   - Show error messages inline

3. **UI**:
   - Date input (HTML `<input type="date">` or Chakra date picker)
   - Exercise name input
   - Dynamic set rows (add/remove buttons)
   - Set constraints: min 1, max 5 (disable "Add Set" at 5, hide "Remove" at 1)
   - Save / Cancel buttons

4. **On Submit**:
   ```typescript
   const onSave = async () => {
     // Validate
     // Call createWorkout() or updateWorkout()
     // Close form / refresh table
     // Show success toast
   };
   ```

---

### Phase 3: Table Component (3 hours)

**File**: `src/components/WorkoutTable.tsx`

1. **State**:
   ```typescript
   const [workouts, setWorkouts] = useState<WorkoutTableRow[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [editingId, setEditingId] = useState<number | null>(null);
   ```

2. **On Mount** (useEffect):
   ```typescript
   useEffect(() => {
     loadWorkouts();
   }, []);
   
   const loadWorkouts = async () => {
     setIsLoading(true);
     const rows = await listWorkouts();
     setWorkouts(rows);
     setIsLoading(false);
   };
   ```

3. **Table Columns** (Chakra Table or CSS):
   ```
   | Date | Exercise | Set1_W | Set1_R | Set2_W | Set2_R | ... | Set5_R | Actions |
   ```

4. **Responsive Design**:
   - Use Chakra `Table` with responsive props or CSS `@media`
   - On mobile (<640px): hide Set3–5 columns or use horizontal scroll (if unavoidable)
   - Touch targets: ≥44×44px for Edit/Delete buttons

5. **Row Actions**:
   - Edit: open form with pre-filled data
   - Delete: show confirmation, call `deleteWorkout()`, refresh table

6. **Edge Cases**:
   - Empty state: "No workouts yet. Add your first one!"
   - Loading: Show spinner while fetching
   - Error: Display error message with retry button

---

### Phase 4: App Integration (1 hour)

**File**: `src/App.tsx`

1. Mount `<WorkoutTable />` inside the `isDbReady` gate:
   ```typescript
   return (
     <>
       {!isDbReady && <LoadingScreen />}
       {isDbReady && (
         <main>
           <WorkoutTable />
         </main>
       )}
     </>
   );
   ```

2. Wire form state (either lift form state to App or keep in WorkoutTable as modal).

---

## Testing Checklist (Manual)

Before declaring "done":

- [ ] **Create workout**: Add a workout with exercise, date, and 2–3 sets → appears in table
- [ ] **Persistence**: Close and reopen app → workout still visible
- [ ] **Edit workout**: Change weight/reps → table updates immediately
- [ ] **Delete workout**: Remove entry → table refreshes
- [ ] **Validation**: Try saving with no sets → error message
- [ ] **Future date**: Try entering tomorrow's date → error
- [ ] **Mobile responsive**: Test at 375px (iPhone), 768px (iPad), 1024px (desktop)
- [ ] **Column overflow**: Ensure no horizontal scroll at ≥320px (may need to hide Set4–5 on narrow screens)
- [ ] **Touch targets**: Buttons are clickable on mobile (≥44×44px)
- [ ] **Sort order**: Most recent workout appears first
- [ ] **Empty state**: App shows helpful message when no workouts

---

## Key Pitfalls to Avoid

1. **Don't call `initDatabase()` twice**: It's memoized; reusing it is correct (see CLAUDE.md Principle II)
2. **Don't forget `dbId`**: Every `promiser('exec', ...)` call must include it
3. **Don't use string interpolation in SQL**: Always bind parameters: `bind: [...]`
4. **Don't render before `isDbReady`**: Component will crash if DB isn't initialized
5. **Don't hardcode pixel widths**: Use responsive CSS (flex, grid, %) for mobile support
6. **Don't skip the date validation**: Future dates break the data model

---

## Tools & Resources

- **Chakra UI**: [Responsive props](https://chakra-ui.com/docs/styled-system/responsive-styles) and [Table component](https://chakra-ui.com/docs/components/table)
- **HTML Date Input**: [MDN guide](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date)
- **SQLite-WASM**: See `CLAUDE.md` for promiser contract and `src/database.ts` for existing patterns
- **React Hooks**: `useState`, `useEffect`, `useCallback` for form/table state

---

## Estimated Timeline

| Task | Hours | Notes |
|------|-------|-------|
| Database schema + helpers | 2 | Schema definition, validation logic, queries |
| WorkoutForm component | 3 | Form state, validation, date picker, set management |
| WorkoutTable component | 3 | Table rendering, sorting, responsive layout, edit/delete |
| App integration + testing | 1 | Wiring, manual QA at mobile/desktop |
| **Total** | **~9** | Flexible based on experience with React/Chakra |

---

## Next Steps

1. Run `/speckit-tasks` to generate actionable task list with dependencies
2. Create feature branch (already created: `001-workout-log-table`)
3. Start with **Database Layer** (least risky, unblocks form/table)
4. Then **Form** and **Table** (can develop in parallel)
5. Finally **Integration** and manual testing

Good luck! 🏋️

# Feature Specification: Database Repository Pattern Refactor & Component Cleanup

**Feature Branch**: `010-repository-pattern-refactor`
**Created**: 2026-06-01
**Status**: Draft

## Clarifications

### Session 2026-06-01

- Q: Should `database.ts` be kept as a barrel or eliminated so components import directly from repository classes? → A: Keep as barrel — required to register the Drizzle schema and feed it into the ORM initialization. Components keep their current import paths.
- Q: How should per-entity files be organised within `src/db/`? → A: One subdirectory per entity — `src/db/entities/<entity>/{schema,repository,types}.ts`.
- Q: How should repository instances obtain the database connection — call `initDatabase()` per method, or assume the db is ready? → A: Assume the db is initialized when the app starts. Repository classes receive the initialized db instance (constructor injection); they do NOT call `initDatabase()` themselves.
- Q: Where should repository instances be created and wired after db init? → A: Inside `database.ts` — after `initDatabase()` resolves, instantiate all repository classes there and export them. `database.ts` is the single wiring point.
- Q: Should repositories use constructor injection to receive the db, or reference the module-level db object directly? → A: Reference the module-level `db` object directly. No constructor injection, no deferred instantiation. Repository classes are module-level singletons; the `isDbReady` gate in `App.tsx` guarantees `db` is initialized before any repository method is called.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Developer adds a new data operation without touching unrelated code (Priority: P1)

A developer needs to add a new query or mutation for a specific entity (e.g., exercises). Today all database helpers are scattered across multiple flat files with no clear boundary. After this refactor, the developer opens the repository file for that entity, adds a method, and is done — no other files need changing.

**Why this priority**: This is the core value of the repository pattern. Every other story depends on the structure it creates.

**Independent Test**: Can be fully tested by adding a new method to one repository class and confirming nothing outside that class needed to change — and that the new method is immediately usable from a component.

**Acceptance Scenarios**:

1. **Given** the refactored codebase, **When** a developer adds a new query for exercises, **Then** the change is confined to the exercise repository file and its exported types file — no other source files need modification.
2. **Given** an entity repository, **When** a developer imports it in a component, **Then** the TypeScript types for return values are automatically available without manual type annotation.

---

### User Story 2 — Developer works with exercises and sees only "bodyweight" — not "assisted" (Priority: P2)

The exercise classification system previously distinguished between "bodyweight" and "assisted" exercises. These are now unified under a single "bodyweight" category. A developer working on exercise filtering, eRM calculations, or UI labels encounters only `'bodyweight'` and `'standard'` — no `'assisted'` value exists anywhere in the codebase.

**Why this priority**: Eliminates a dead code path and a confusing distinction that was never surfaced to end users. Needs to land with the structural refactor to avoid spreading the old type through new code.

**Independent Test**: Can be tested by grepping the codebase for `'assisted'` after the change — zero results expected outside of comments or spec files.

**Acceptance Scenarios**:

1. **Given** the updated classification type, **When** a developer reads the `ExerciseClassification` type, **Then** it contains exactly two values: `'bodyweight'` and `'standard'`.
2. **Given** the eRM utility and workout form, **When** an exercise with classification `'bodyweight'` is selected, **Then** the bodyweight-adjusted calculation is applied (same behavior as before for bodyweight exercises, previously also applied to assisted).
3. **Given** the exercise creation form, **When** a user opens the classification dropdown, **Then** only "Body weight" and "Standard" options appear.

---

### User Story 3 — Developer inserts a record and gets its ID from a single statement (Priority: P3)

Currently, inserts are followed by a separate `SELECT last_insert_rowid()` query. After this change, every insert that needs to return the new row's ID uses a single statement with a `RETURNING` clause. There is no second round-trip to the database worker.

**Why this priority**: Correctness and simplicity improvement. Eliminates a two-step pattern that is fragile under concurrent writes and verbose to read.

**Independent Test**: Can be tested by reviewing all repository insert methods — none should contain `last_insert_rowid` and all that return an ID should use `RETURNING id`.

**Acceptance Scenarios**:

1. **Given** any repository insert method that returns an ID, **When** the method is called, **Then** the ID is extracted from the `RETURNING` clause of the same statement — no second query is issued.
2. **Given** the full codebase, **When** searching for `last_insert_rowid`, **Then** zero occurrences are found.

---

### User Story 4 — Developer opens a React component file and finds a consistent, predictable structure (Priority: P4)

All React components are refactored using the project's `create-component` scaffold conventions. Each component follows the same file layout, prop typing pattern, and export style.

**Why this priority**: Consistency reduces cognitive overhead when navigating between components. Depends on the repository refactor being complete so component-level data access uses the new repository classes.

**Independent Test**: Can be tested by opening any component and confirming it matches the project's component scaffold conventions — consistent prop interface, export style, and file structure.

**Acceptance Scenarios**:

1. **Given** any refactored component, **When** a developer opens it, **Then** it follows the structure produced by the `create-component` skill — consistent prop typing, named export, no ad-hoc patterns.
2. **Given** a component that accesses data, **When** reviewing its imports, **Then** it imports from repository classes — not directly from raw helper files or `database.ts`.

---

### Edge Cases

- What happens when a component previously imported a type directly from a helper file? The type must now be re-exported from the entity's types file so existing import sites can be updated.
- How does the system handle the `ExerciseClassification` type in the eRM utility (`src/utils/erm.ts`)? It must be updated to remove `'assisted'` and the calculation logic must treat `'bodyweight'` as the sole non-standard case.
- What if the database already has rows with `classification = 'assisted'`? The spec explicitly assumes no such rows exist — no migration is generated. If encountered at runtime, the behaviour is undefined and out of scope.
- How are repository classes instantiated? They are module-level singletons that reference the shared `db` object directly — no constructor injection, no deferred wiring. The `isDbReady` gate in `App.tsx` guarantees `db` is initialized before any component renders and thus before any repository method is invoked.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The database layer MUST be reorganised so each entity (exercise, muscle group, routine, routine exercise, workout, workout set, settings) lives in its own subdirectory under `src/db/entities/<entity-name>/`, containing three files: `schema.ts`, `repository.ts`, and `types.ts`.
- **FR-002**: Each entity MUST have a corresponding Repository class (e.g., `ExerciseRepository`) that contains all data-access methods previously scattered across helper files and `database.ts`. Repository classes MUST reference the module-level `db` object directly — no constructor injection, no internal `initDatabase()` calls.
- **FR-003**: Each entity's TypeScript types MUST be inferred from the ORM schema (not hand-written) and exported from a dedicated `types.ts` file co-located with or alongside the entity file.
- **FR-004**: `src/database.ts` MUST be retained as the barrel that calls `initDatabase()`, registers the Drizzle schema, and re-exports the repository instances and public API consumed by components. Repository classes are module-level singletons exported directly from their entity files — no deferred instantiation required. Components keep their current import paths. No component may import from `@sqlite.org/sqlite-wasm` or the raw promiser.
- **FR-005**: The `ExerciseClassification` type MUST be reduced to `'bodyweight' | 'standard'`. All references to `'assisted'` MUST be removed from source code.
- **FR-006**: All eRM and workout-form logic that previously branched on `'assisted'` MUST be updated to branch only on `'bodyweight'`, preserving identical calculation behaviour.
- **FR-007**: All insert operations that return a new record's ID MUST use a `RETURNING` clause in the same SQL statement. The `SELECT last_insert_rowid()` pattern MUST be eliminated entirely.
- **FR-008**: All React components MUST be refactored to conform to the conventions produced by the `create-component` scaffold skill.
- **FR-009**: All architecture invariants defined in `CLAUDE.md` MUST continue to hold: single worker instance, all DB access through the database layer, no string-interpolated SQL, `isDbReady` gate respected.
- **FR-010**: The app MUST build without TypeScript errors after the refactor.

### Key Entities

- **Exercise**: name, classification (`'bodyweight' | 'standard'`), associated muscle groups
- **MuscleGroup**: name, display colour
- **Routine**: name, ordered list of exercises with target sets
- **RoutineExercise**: join between routine and exercise, with set count
- **WorkoutLog**: date, exercise reference (denormalised name), associated sets
- **WorkoutSet**: weight, reps, set order — child of WorkoutLog
- **Settings**: key-value store for app-level configuration

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero occurrences of the string `last_insert_rowid` remain in source files after the refactor.
- **SC-002**: Zero occurrences of the string `'assisted'` (as a classification value) remain in source files after the refactor.
- **SC-003**: Every entity has exactly one schema file, one repository class, and one types export — no entity's data access logic spans more than its designated files.
- **SC-004**: The app builds (`npm run build`) with zero TypeScript errors and zero ESLint errors.
- **SC-005**: All existing features (workout logging, exercise library, routines, settings import/export) remain fully functional after the refactor — no regressions introduced.
- **SC-006**: Every React component file conforms to the `create-component` scaffold conventions — verifiable by inspection.

## Assumptions

- No database records with `classification = 'assisted'` exist in any user's OPFS database at the time of deployment. No schema migration is generated for this change.
- The ORM layer (`src/db/orm.ts`) supports type inference sufficient to derive entity TypeScript types without hand-writing them. If it does not, types will be manually defined but named consistently and exported from the same types file.
- Repository classes are module-level singletons that close over the shared `db` object. They require no constructor arguments and no deferred instantiation. The `isDbReady` gate in `App.tsx` ensures `db` is initialized before any component renders and therefore before any repository method is called.
- The `create-component` skill defines a canonical component structure for this project; that structure is the authoritative target for all component refactoring.
- `src/database.ts` is retained as a barrel: it registers the Drizzle schema and re-exports repository methods for component consumption. It is not eliminated.
- The `src/db/` directory structure will change significantly; any duplicate files visible in the current tree (e.g., the duplicate view files under `ExerciseLibrary/`) will be resolved as part of the component refactor.

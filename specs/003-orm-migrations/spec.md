# Feature Specification: Drizzle ORM with Database Migrations

**Feature Branch**: `003-orm-migrations`  
**Created**: 2026-05-22  
**Status**: Draft  
**Input**: Add database migration capability on app startup using Drizzle ORM

## Clarifications

### Session 2026-05-25

- Q1: What happens if the app starts with a database schema newer than the code expects (e.g., after a code rollback)? → A: Same blocking modal as a migration failure — offer retry or reset database
- Q2: What should the system do when a migration file has been deleted but its name still appears in the applied migrations table? → A: Fail startup with an error — treat missing applied migration as a data integrity violation
- Q3: Where should FR-007 migration logs be written? → A: Console only — successes recorded in __drizzle_migrations with applied_at timestamp; failures logged to console and surfaced via error modal
- Q4: Should FR-004 permit documented exceptions for queries not expressible in Drizzle? → A: Yes — update FR-004 to permit narrow, documented exceptions (pivot queries, sqlite-wasm binary operations)
- Q5: How should data transformation migrations be structured? → A: Single .sql file with DDL and DML in sequence, executed as one transaction (all-or-nothing)

### Session 2026-05-22

- Q1: What should happen if a migration fails at startup? → A: Block startup with clear error; offer user choice to retry or instantiate fresh empty database
- Q2: How should migration files be named and versioned? → A: Sequential numbering (001_init.sql, 002_add_users.sql, etc.)
- Q3: How should concurrent migrations be handled? → A: Single instance only; no locking mechanism needed (app is local-first PWA with one browser instance)
- Q4: Should data transformation migrations be supported? → A: Yes, support via raw SQL execution within Drizzle migrations
- Q5: Should the system validate schema compatibility at startup? → A: Yes, validate that applied schema matches code's Drizzle definition; fail if mismatch

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Database Migrations Execute at App Startup (Priority: P1)

When the application starts, all pending database migrations are automatically executed. This ensures the database schema is always synchronized with the application code without requiring manual intervention or manual schema management.

**Why this priority**: This is the foundational capability that enables the rest of the feature. Without automatic migrations at startup, the app cannot guarantee schema consistency. This is essential for both initial deployment and updates.

**Independent Test**: Can be fully tested by (1) starting the application with a fresh database, (2) verifying the schema is created correctly, (3) restarting the application and verifying no migration errors occur on subsequent starts.

**Acceptance Scenarios**:

1. **Given** a fresh application install with no database, **When** the app starts, **Then** all migrations run and the database schema is fully created
2. **Given** an app running with an existing database at v1 schema, **When** a new migration is added and the app restarts, **Then** the new migration is applied
3. **Given** an app that already has all current migrations applied, **When** the app restarts without new migrations, **Then** no migration errors occur and the app initializes normally

---

### User Story 2 - Use Drizzle ORM for Database Queries (Priority: P1)

Database queries are written using Drizzle ORM instead of raw SQL strings. This provides type safety, query composition, and better IDE support for developers.

**Why this priority**: Converting to the ORM alongside migrations ensures consistency and leverages the ORM's tooling for managing schema. Mixing raw SQL and ORM would create maintenance complexity.

**Independent Test**: Can be tested by (1) executing a database query through the ORM interface, (2) verifying the query produces correct results, (3) confirming TypeScript provides type hints for columns and tables.

**Acceptance Scenarios**:

1. **Given** a Drizzle-defined table schema, **When** a query is executed via the ORM, **Then** results are returned with correct typing
2. **Given** application code that previously used raw SQL, **When** converted to equivalent Drizzle ORM queries, **Then** results are identical
3. **Given** a developer using the ORM, **When** they access a table column, **Then** TypeScript provides autocomplete suggestions

---

### User Story 3 - Schema Defined via Drizzle (Priority: P1)

The database schema is defined using Drizzle's schema definition API instead of raw SQL DDL statements. This creates a single source of truth for the schema that can be used for both migrations and type generation.

**Why this priority**: Schema definition is foundational to migrations. Drizzle's schema API is where migrations originate from, so this must be in place before migrations can work effectively.

**Independent Test**: Can be tested by (1) defining a table schema in Drizzle, (2) verifying a migration file is generated from the schema, (3) running the migration and confirming the table is created correctly.

**Acceptance Scenarios**:

1. **Given** a Drizzle schema with table and column definitions, **When** migrations are generated, **Then** the migration files contain the correct CREATE TABLE statements
2. **Given** an existing database schema from the old raw-SQL approach, **When** a Drizzle schema definition is created to match it, **Then** the schemas are equivalent
3. **Given** a schema with relationships and constraints, **When** the migration is applied, **Then** all constraints are enforced

---

### Edge Cases

- **Migration Failure Recovery**: If a migration fails at startup (syntax error, constraint violation), the app shows a clear error message and offers the user two options: (1) retry after fixing the migration, or (2) instantiate a fresh empty database and proceed. This allows recovery without data loss while preventing inconsistent schema states.
- **Schema Ahead of Code**: If the database schema is newer than the code expects (e.g., after rolling back to an older app version), FR-010 validation fails and the app shows the same blocking modal as a migration failure — the user can retry (update the app) or reset the database.
- **Data Transformation Migrations**: Schema changes requiring data transformation (e.g., backfilling a new column, splitting a field) are written as a single `.sql` file containing both DDL and DML statements in sequence. The migration runner wraps the entire file in a transaction — all statements apply or none do.
- **Deleted Applied Migration**: If a migration file is absent from the codebase but its name appears in `__drizzle_migrations`, the system MUST fail startup with a data integrity error (same blocking modal). The missing file indicates a code/database divergence that requires developer intervention.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically discover and execute all pending migrations when the application starts
- **FR-002**: System MUST prevent re-running migrations that have already been applied
- **FR-003**: Database schema MUST be defined using Drizzle ORM's schema definition API
- **FR-004**: All database queries MUST use Drizzle ORM instead of raw SQL strings; narrow documented exceptions are permitted for (a) queries not expressible in Drizzle's query builder (e.g., multi-column pivot queries) and (b) sqlite-wasm-specific binary operations (`export`, `close`) that have no Drizzle equivalent — each exception MUST be commented in code
- **FR-005**: System MUST generate migration files when schema changes are made
- **FR-006**: Developers MUST be able to rollback migrations locally during development for testing and schema iteration
- **FR-007**: System MUST log migration execution with timestamps and success/failure status to the browser console; successful migrations are additionally recorded in `__drizzle_migrations` with an `applied_at` timestamp; no separate persistent log table is required
- **FR-008**: System MUST handle migration errors gracefully with clear error messages for debugging; this includes missing applied migration files, which are treated as data integrity violations
- **FR-011**: System MUST fail startup if a migration file referenced in `__drizzle_migrations` is no longer present in the codebase
- **FR-009**: Migrations MUST support data transformation operations (e.g., backfilling columns, renaming fields) via raw SQL; DDL and DML MUST be colocated in the same `.sql` file and executed within a single transaction
- **FR-010**: System MUST validate at startup that the applied database schema matches the code's Drizzle schema definition; fail with clear error and blocking retry/reset modal if mismatch detected (including when the database schema is ahead of the code)

### Key Entities

- **Migration**: A versioned database schema change, containing both the migration forward (apply) and optional rollback logic
- **Schema Definition**: The Drizzle ORM table and column definitions that describe the database structure
- **Database State**: The current applied migration version, tracked to determine which migrations are pending

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All existing database queries are converted to use Drizzle ORM with no functional regressions
- **SC-002**: New database migrations are automatically applied within 1 second of app startup
- **SC-003**: Application initializes successfully on a fresh database without manual schema setup
- **SC-004**: Developers can add new schema changes by modifying Drizzle definitions and have migrations generated automatically
- **SC-005**: Failed migrations are reported with clear error messages indicating the root cause

## Assumptions

- The existing SQLite database with WASM support will continue to be used (no database engine change)
- Initial schema will be reverse-engineered from the current working database structure to create the first Drizzle schema definitions
- Migrations are additive and run in chronological order
- The application has permission to create and modify the database schema at runtime
- Migration files use sequential numbering: `NNN_description.sql` (e.g., `001_init.sql`, `002_add_users_table.sql`)
- Rollback capability is for local development only; production migrations are forward-only
- Drizzle's rollback mechanism will be used for development schema iteration
- The migration system will track applied migrations in a table within the database itself
- Only a single app instance runs at startup (no concurrent migration execution); no database-level locking needed

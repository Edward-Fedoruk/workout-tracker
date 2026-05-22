# Feature Specification: Export & Import Workout Data via SQLite Dump File

**Feature Branch**: `002-export-import-sqlite-dump`
**Created**: 2026-05-19
**Status**: Draft
**Input**: User description: "I want to build export and import to the table we have. export and import should be through sqlite dump file"

## Clarifications

### Session 2026-05-19

- Q: Should the dump file be a SQL text dump (`sqlite3 .dump` output) or a raw binary `.sqlite3` database file? → A: Raw binary `.sqlite3` file — the entire OPFS-backed database file is exported as-is, and import replaces the database file with the chosen one.
- Q: What is the export scope — just the workout log table, or the whole database? → A: Whole database. The export captures the entire SQLite file (all tables, indexes, schema, PRAGMAs); import replaces the entire database state.
- Q: On import, what happens to existing data? → A: Full replacement — the current database is wiped and replaced with the imported file. The user lands in a clean state defined entirely by the imported file.
- Q: What is the precise mechanic when an existing database is in place at import time? → A: Two-step sequence — delete the existing database file from local storage first, then load the imported file as the new database. No residual data, schema, or indexes from the prior database may survive.
- Q: How does the running app pick up the new database after import? → A: Automatic full page reload. After the imported file is written to local storage, the app reloads itself; on the fresh load it opens the new database normally. This respects the "worker created once per session" invariant and guarantees no stale state from the previous database.
- Q: How much validation does the system perform on the imported file? → A: Minimal — a SQLite magic-header sniff only (verify the file begins with the 16-byte string `"SQLite format 3\0"`). No schema compatibility check, no version check. If the header is valid, the file is accepted; the existing `initDatabase` + additive migrations handle whatever schema state the file contains on the next page load. If the header check fails, the import is aborted **before** the existing database is deleted.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Export the whole database to a backup file (Priority: P1)

A user wants to save a portable backup of all their app data so they can store it on a cloud drive (e.g., Google Drive, Dropbox, iCloud) and restore it on another device or after clearing browser data. They trigger an export action and receive a downloadable `.sqlite3` file that is an exact, byte-for-byte snapshot of the app's database.

**Why this priority**: Without export, all data is trapped inside the browser's local storage (OPFS), and the user has no way to back up, transfer between devices, or recover from a cleared browser profile. Export alone — even without import — is immediately valuable: the user owns their data again. It is also a prerequisite for import being meaningful.

**Independent Test**: Open the app, add several workout entries, click "Export", confirm a `.sqlite3` file is downloaded. Open the file in any SQLite viewer (e.g., DB Browser for SQLite) and verify it contains the expected schema and rows. No import functionality is required to validate this story.

**Acceptance Scenarios**:

1. **Given** the database contains one or more workout entries, **When** the user triggers Export, **Then** a binary `.sqlite3` file is downloaded to their device that, when opened with an external SQLite tool, contains the full database state (schema + rows).
2. **Given** the database is empty (no workouts logged yet), **When** the user triggers Export, **Then** a valid `.sqlite3` file is still produced (containing schema but no data rows), and the user is informed the export contained no entries.
3. **Given** an export was just produced, **When** the user uploads the file to a cloud drive and downloads it on another device, **Then** the file remains byte-identical and is a valid SQLite database.

---

### User Story 2 - Import a backup file to restore the database (Priority: P1)

A user has a previously-exported `.sqlite3` file (from this app on another device, or from an earlier backup) and wants to load it back into the app. After import, the app's database is entirely replaced by the contents of the file, and the UI reflects that restored state.

**Why this priority**: Import is the other half of the round-trip and the explicit second half of the user's request. Without it, exports are write-only and cross-device transfer doesn't actually work. Pairing it with export at P1 is necessary for any real backup/restore workflow.

**Independent Test**: Take a known-good `.sqlite3` file (produced by Story 1), open the app in a fresh browser profile or after clearing OPFS, trigger Import, select the file, confirm the destructive replacement prompt, and verify the workout entries from the file are now visible in the table.

**Acceptance Scenarios**:

1. **Given** the user has a valid `.sqlite3` file exported from this app, **When** they trigger Import, select the file, and confirm the replacement prompt, **Then** the app's database is replaced with the contents of the file and the UI displays the restored data without requiring the user to manually reload the page.
2. **Given** the database already contains entries, **When** the user triggers Import, **Then** the user is warned in clear language that the current database will be completely wiped and replaced, and import only proceeds after explicit confirmation.
3. **Given** the user selects a file that does not begin with the SQLite magic header (wrong format, e.g. an image or text file, or a truncated/corrupted file), **When** the import is attempted, **Then** the import is aborted before any destructive change, the existing database is left untouched, and the user is shown a clear error message.
4. **Given** the user selects a valid SQLite file from another app, **When** the import is attempted, **Then** the import proceeds (the magic-header check passes); on the subsequent automatic reload, the app opens the file and the existing additive migrations create any missing tables — the user may see an empty workout log, which is the expected behavior for an unrelated SQLite file.

---

### Edge Cases

- **Empty database export**: Exporting when the database is empty still produces a valid, importable `.sqlite3` file.
- **Existing data on import (the common case)**: When the user imports a file while an existing database is already in place, the system MUST first remove/wipe the existing database file from local storage (OPFS) and then load the imported file as the new database. This is a two-step sequence — delete old, then load new — and must end with the app pointing at the new database, with no residual data, indexes, or schema from the previous one. The user is warned and must explicitly confirm before this destructive sequence begins.
- **Malformed / corrupted file**: Import detects invalid input (not a SQLite file, truncated, corrupted) and fails before touching the existing database.
- **File from an unknown or incompatible schema**: If the file is a valid SQLite database (magic header passes) but its schema is unrelated or older than the current app, the import still proceeds. On the post-import reload, the app's existing additive-migration logic (in `initDatabase`) creates any missing tables. The user may see an empty workout log if the file came from an unrelated SQLite database — this is the accepted tradeoff for keeping import simple.
- **Very large file**: The app remains responsive during import/export for realistic data sizes (see SC-003).
- **Browser without persistent storage (OPFS unavailable)**: Export still works against the in-memory database. Import also works, but imported data will be lost on reload — the user should be made aware in this environment.
- **User cancels the file picker**: No-op; the app returns to its prior state.
- **Import mid-session**: Because the app holds an open handle on the database, importing requires safely "swapping" the database underneath the running app — the UI must end up consistent with the imported file with no stale data left over from the previous database.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST provide a user-facing Export action accessible from the workout log view.
- **FR-002**: Triggering Export MUST produce a downloadable binary `.sqlite3` file that is an exact, byte-for-byte copy of the app's current database.
- **FR-003**: The exported file MUST be a self-contained, valid SQLite database that can be opened by any standard SQLite tool and re-imported into a fresh instance of the app to fully reconstruct the user's data.
- **FR-004**: The app MUST provide a user-facing Import action accessible from the workout log view.
- **FR-005**: Triggering Import MUST allow the user to select a `.sqlite3` file from their device.
- **FR-006**: Before executing an import, the system MUST display a confirmation prompt explaining that (a) the entire current database will be wiped and replaced and (b) the app will automatically reload as part of the import, and proceed only after explicit user confirmation.
- **FR-007**: On successful import, the app's database MUST be completely replaced by the contents of the imported file, and the app MUST automatically reload itself so that the next page load opens the new database and the UI reflects the imported data. The user MUST NOT be required to manually reload.
- **FR-008**: On failed import (not a SQLite file per the magic-header check, or any error during file write before reload), the system MUST leave the existing database unchanged and display a clear error message to the user.
- **FR-009**: Before deleting the existing database, the system MUST verify that the selected file begins with the SQLite magic header (`"SQLite format 3\0"`, the first 16 bytes of any valid SQLite database). If the check fails, the import MUST be aborted with a clear error message and the existing database MUST remain untouched. No further schema or version validation is performed — once the magic header check passes, the file is trusted and written.
- **FR-010**: The exported filename SHOULD include enough context to identify it later (e.g., the date of export and an indication that it is a workout-log backup), using the `.sqlite3` extension.
- **FR-011**: Export and Import actions MUST be discoverable but not so prominent that a user can trigger Import (a destructive action) by accident.
- **FR-012**: The export operation MUST NOT modify the current database state in any way.
- **FR-013**: When importing into an app that already has a database in place, the system MUST delete the existing database file from local storage before writing the imported file, so that no data, schema, or indexes from the previous database survive the import.
- **FR-014**: If the deletion step in FR-013 succeeds but the subsequent load of the new file fails, the system MUST surface this clearly to the user (the previous database is gone and the new one did not load — the user needs to know to re-import or reload). The system MUST NOT silently leave the app in an empty or broken state.

### Key Entities *(include if feature involves data)*

- **Backup File**: A user-visible `.sqlite3` artifact representing a complete, point-in-time snapshot of the app's database. Opaque to the user during normal use but openable in any SQLite tool. Suitable for storage on cloud drives and transfer between devices.
- **Database Snapshot**: The conceptual unit being exported and imported — the entire SQLite database (all tables, indexes, schema, and rows).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can export their database to a file in under 3 seconds for a workout log of up to 1,000 entries.
- **SC-002**: A user can import a previously-exported file in under 5 seconds and see their data restored in the UI for a file containing up to 1,000 entries.
- **SC-003**: For databases up to 1,000 workout entries (a realistic upper bound for an individual's multi-year training history), the UI remains responsive during export and import — no input freezes longer than 500 ms.
- **SC-004**: 100% of round-trips (export → fresh state → import) reproduce the original database exactly: same row count, same column values, no data loss or corruption.
- **SC-005**: 100% of malformed or incompatible files presented to Import result in the existing database being preserved unchanged and a clear error shown to the user — no partial imports, no half-replaced state.
- **SC-006**: A new user can locate and successfully use the Export and Import actions without external documentation in under 30 seconds.
- **SC-007**: An exported file uploaded to a cloud drive and re-downloaded on a different device produces a successful import in 100% of cases (file integrity is preserved by the export format).

## Assumptions

- **Dump file format is the raw binary `.sqlite3` database file**, not a SQL text dump. This is an exact copy of the OPFS-backed database file. Confirmed via clarification.
- **Scope is the entire database**, not just the workout table. Whatever tables and schema exist in the current app are included. Confirmed via clarification.
- **Import is full-replacement**, not merge. The user lands in a clean state defined entirely by the imported file. Row-level merging, conflict resolution, or partial import are explicitly out of scope. Confirmed via clarification.
- **The file's identity is implicit**: there is no in-file marker or app-version stamp beyond the database schema itself. Schema-compatibility validation on import is done by inspecting the file's tables/columns.
- **No sync or cloud transfer is built in**: the user moves files between devices via their own means (download, cloud drive sync, email, etc.). No backend, account, or cloud integration is introduced.
- **No encryption or password protection**: exported files are plain SQLite databases. Users handle confidentiality themselves (e.g., by relying on their cloud drive's protections).
- **Single-user, single-origin**: the app remains per-origin, per-browser, single-user. Export/import does not introduce a notion of user identity in the file.
- **Realistic data volume**: an individual user's database is expected to grow to thousands of rows over years, not millions. Performance targets reflect this scale.

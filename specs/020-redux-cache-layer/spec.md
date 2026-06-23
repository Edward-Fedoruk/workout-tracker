# Feature Specification: Redux Cache Layer

**Feature Branch**: `020-redux-cache-layer`  
**Created**: 2026-06-23  
**Status**: Draft  
**Input**: User description: "add redux toolkit as an intermediary stage for accessing database. The UI should work with Redux as it's main datastore. Under the hood, redux should work with the underlying data in the database. Redux should act as a proxy to provide a caching layer so that the UI doesn't have to wait for the data to come in on page transitions."

## Clarifications

### Session 2026-06-23

- Q: When the user makes an edit, how should the cache and durable storage stay in sync? → A: Write-through — persist to storage first, then update the cache once persistence confirms. The UI may show a brief pending state during the write itself; the "no waiting" guarantee applies to reads/navigation, not to the moment of saving.
- Q: When should each data set be loaded into the cache? → A: Lazy per-data-set — load a data set on first access of its page, then cache it; a brief loading state appears only on that first access.
- Q: Should the cache stay consistent across multiple open browser tabs sharing the same local database? → A: Out of scope — a single active tab is assumed; two tabs may show divergent caches until reload.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Instant page transitions for already-loaded data (Priority: P1)

As someone using the workout app, when I move between pages I have already visited (e.g. back to the exercise library after editing an exercise, or back to the workout log after viewing a routine), the data appears immediately without a loading flash or spinner, because it is served from an in-memory cache rather than re-fetched.

**Why this priority**: This is the core promise of the feature — eliminating the wait on navigation. It is the single change a user would notice and the reason the feature exists. Without it, the feature delivers no observable value.

**Independent Test**: Navigate to a data-backed page (e.g. the exercise library) once so it loads, navigate away to another page, then navigate back. The previously loaded data is displayed immediately on return with no visible loading state and no re-query delay.

**Acceptance Scenarios**:

1. **Given** the exercise library has been opened once and its data loaded, **When** the user navigates away and then returns to it, **Then** the full list of exercises is displayed immediately without a loading indicator.
2. **Given** a list of workouts has been loaded, **When** the user opens a single workout's detail and presses back to the list, **Then** the list is rendered instantly from cache.
3. **Given** any cached page is revisited, **When** no underlying data has changed since it was cached, **Then** the data shown matches what was last loaded with no flicker or reordering.

---

### User Story 2 - Edits are reflected immediately everywhere (Priority: P1)

As someone editing my data (creating, updating, deleting exercises, routines, workouts, settings, etc.), my change is durably saved and then reflected in the UI and in every other view that shows that data, so it survives an app reload. The save itself may briefly show a pending state; once it confirms, the change appears everywhere without a re-fetch.

**Why this priority**: A cache that serves stale data after an edit is worse than no cache. Correctness of writes and cross-view consistency is non-negotiable and must ship together with P1 reads.

**Independent Test**: Edit an item on one screen (e.g. rename an exercise), then navigate to another screen that displays the same item (e.g. a routine that references it, or the analytics views). The new value appears without a manual refresh, and after reloading the app the change is still present.

**Acceptance Scenarios**:

1. **Given** an exercise is displayed in multiple places, **When** the user renames it, **Then** all views reflect the new name without re-fetching from the database.
2. **Given** the user creates a new workout, **When** they navigate to the workout log, **Then** the new workout is present in the list immediately.
3. **Given** the user deletes a routine, **When** the deletion completes, **Then** the routine disappears from every list that showed it, and it remains absent after an app reload.
4. **Given** a write that fails to persist, **When** the failure is detected, **Then** the cache is left unchanged (it is only updated after persistence confirms), the UI does not show the change as succeeded, and the user is informed the change could not be saved.

---

### User Story 3 - First load and offline behavior unchanged (Priority: P2)

As a user opening the app fresh (first visit of a session, or after a reload), I still see my data, and the local-first / offline guarantees of the app are preserved — nothing about adding a cache layer requires a network or breaks offline use.

**Why this priority**: The feature must not regress the app's existing local-first, fully-offline behavior. It is a constraint on the redesign rather than new user-facing value, so it ranks below the two correctness/perf stories but must be verified.

**Independent Test**: With no network connection, cold-start the app, confirm all previously saved data loads and is editable, and confirm edits persist across a reload — all while offline.

**Acceptance Scenarios**:

1. **Given** the app is started cold with previously saved data, **When** the relevant pages are opened, **Then** the data loads from local storage and is shown (a brief initial load on first access of each data set is acceptable).
2. **Given** the device is offline, **When** the user reads and edits data, **Then** all operations succeed exactly as they do online.
3. **Given** the local database was replaced via the existing import/restore flow, **When** the app continues, **Then** the cache reflects the imported data and never shows data from the previous database.

---

### Edge Cases

- **Write-then-immediate-read**: A read issued right after a write returns the updated value, never the pre-write value.
- **Failed persistence**: If saving an edit to local storage fails, the cache is never updated (write-through updates it only after a confirmed save), so it cannot diverge from durable storage; the user is notified the change was not saved.
- **Data not yet loaded**: The first time a data set is needed, it has not been cached; the UI shows an appropriate brief loading state for that initial fetch only, then caches the result.
- **Empty data sets**: A genuinely empty list (e.g. no exercises yet) is cached and shown as empty, and is distinguishable from "not yet loaded".
- **Database/import replacement**: When the entire local database is replaced or restored, the cache is fully discarded so no stale entity survives. (The existing import flow already reloads the app; the cache must not outlive that reload.)
- **Derived/read-only views**: Analytics and other computed views reflect the latest cached source data after edits, without each maintaining its own independent fetch.
- **Concurrent edits in flight**: If two edits to the same entity are issued in quick succession, the final cached state matches the final durably-saved state.
- **Multiple open tabs (out of scope, see Assumptions)**: Two tabs of the same app pointing at the same local database may show divergent caches until reload; this is documented as out of scope for this feature.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The UI MUST read application data (exercises, muscle groups, routines and their exercises, workouts, the active workout draft, and app settings such as body weight and display preferences) from an in-memory cache rather than querying local storage on every render or navigation.
- **FR-002**: The first time a given data set is needed, the system MUST load it from local storage into the cache, and subsequent reads of that data set MUST be served from the cache without re-querying local storage.
- **FR-003**: Returning to a previously visited, already-cached page MUST display its data immediately with no loading indicator and no re-fetch.
- **FR-004**: Every create, update, and delete MUST persist to durable local storage first and, once persistence confirms, MUST update the in-memory cache so that all views observing that data reflect the change without an explicit re-fetch (write-through).
- **FR-005**: Because writes are write-through, a confirmed write is durable by construction; the change MUST survive an app reload.
- **FR-006**: After a write confirms, any read of the affected data — on the same screen or any other — MUST return the post-write value (read-your-writes consistency).
- **FR-007**: If persisting a write to durable storage fails, the system MUST leave the cache unchanged (it is updated only after a confirmed save) and MUST inform the user the change was not saved; it MUST NOT show the change as successful.
- **FR-007a**: While a write is being persisted, the UI MAY show a brief pending state for that action; the "no waiting" guarantee (FR-003) applies to reads and navigation, not to the in-flight save itself.
- **FR-008**: The cache MUST be the single source the UI reads from; the UI MUST NOT bypass it to read application data directly from local storage.
- **FR-009**: All durable persistence MUST continue to go through the existing local storage layer; the cache MUST NOT become a second competing durable store and MUST NOT persist application data to any new location.
- **FR-010**: When the entire local database is replaced or restored (import/restore flow), the cache MUST be fully discarded so no entity from the previous database remains visible.
- **FR-011**: The system MUST continue to function fully offline, with no behavior depending on network availability.
- **FR-012**: The cache MUST distinguish "not yet loaded", "loading", "loaded (including legitimately empty)", and "load failed" states so the UI can render the correct affordance for each.
- **FR-013**: Read-only derived views (e.g. analytics) MUST reflect the current cached source data after edits, rather than maintaining independent, separately-fetched copies that can drift.
- **FR-014**: The introduction of the cache MUST NOT change observable application behavior other than the elimination of redundant loading states — the same data, ordering, and outcomes that exist today MUST be preserved.

### Key Entities *(include if feature involves data)*

The cache mirrors the existing application data sets; no new persisted entities are introduced.

- **Exercise**: A user-defined exercise; referenced by routines, workouts, and analytics.
- **Muscle Group**: A named, colored grouping that exercises map to; used by analytics.
- **Routine**: A named template containing an ordered list of routine-exercises (each with suggested sets and ordering).
- **Workout**: A logged workout entry tied to an exercise name and date, holding set data.
- **Active Workout Draft**: The single in-progress, not-yet-saved workout being built from a routine.
- **App Settings**: User preferences such as body weight and table display options.
- **Cache State (new, in-memory only)**: For each data set above, the loaded entities plus a status flag (not loaded / loading / loaded / failed). Holds no data that is not also durably stored; discarded on database replacement and on reload.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Returning to an already-visited data page shows its content with no visible loading indicator, in under 100 ms perceived (effectively instant) in 100% of revisits where the data is already cached.
- **SC-002**: After any edit, every other view of that data shows the updated value without the user performing a manual refresh, in 100% of cases.
- **SC-003**: 100% of edits that report success to the user are still present after an app reload; edits that cannot be durably saved are reported as failures rather than silently shown as saved.
- **SC-004**: The number of redundant reloads of the same unchanged data set on repeat navigation is reduced to zero (each data set is loaded at most once per session until it changes or the database is replaced).
- **SC-005**: All read and edit flows continue to work with no network connection, verified by exercising the primary flows fully offline.
- **SC-006**: No application data is observed to diverge between what the UI shows and what is durably stored; after a failed write the cache still matches storage (verified by a reload showing the pre-edit state and a "not saved" notification having been shown).

## Assumptions

- **Write-through writes** (resolved — see Clarifications): Edits persist to durable storage first and update the cache only after persistence confirms; a failure leaves the cache unchanged and notifies the user (FR-004, FR-007). The "UI doesn't have to wait" goal is met for reads and navigation via the cache, while the save action itself may briefly show a pending state (FR-007a).
- **Lazy per-data-set hydration** (resolved — see Clarifications): Data sets are loaded into the cache on first access (per page/feature) rather than all eagerly at startup, so cold start is not slowed; a brief loading state on the very first access of each data set is acceptable (FR-002; SC-001 applies to revisits).
- **Single active tab** (resolved — see Clarifications): A single browser tab is assumed, as with the app today. Cross-tab cache synchronization (two tabs sharing the same local database) is out of scope; divergence until reload is accepted and documented.
- **Authoritative-after-load cache**: Because all data lives locally and is only mutated through this app, once a data set is loaded the cache is treated as authoritative; no background polling or time-based staleness/expiry is required. The only full-invalidation trigger is a whole-database replacement/restore (FR-010).
- **Existing durable layer reused**: The current local storage layer remains the sole durable store and the only path to persistence; the cache sits in front of it and does not replace or duplicate it (FR-008, FR-009).
- **Scope is internal state management**: This feature changes how data is read/cached/written within the app. It does not add accounts, sync, a backend, or any new persisted data, and does not alter the data model.
- **No regression mandate**: Existing data, ordering, and outcomes are preserved; the only intended observable change is the removal of redundant loading states (FR-014).

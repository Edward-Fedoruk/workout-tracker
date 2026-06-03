<!--
Sync Impact Report
==================
Version change: 1.5.0 → 1.6.0
Bump rationale: Principle VIII (Code Organization & File Size) materially expanded with
folder-by-entity organization, per-component `index.tsx` entry points, a no-trivial-barrel
rule, and the mandatory `@/` import alias. MINOR bump per policy — existing guidance
materially expanded.

Modified principles:
  - VIII. Code Organization & File Size — added folder grouping, entry-point, barrel,
    and `@/` alias rules.

Added sections: none

Removed sections: none

Templates audited:
  - .specify/templates/plan-template.md   ✅ no changes needed
  - .specify/templates/spec-template.md   ✅ no changes needed
  - .specify/templates/tasks-template.md  ✅ no changes needed
  - CLAUDE.md                             ✅ updated — new "Route folder organization &
    imports" section mirrors the expanded Principle VIII.
  - README.md                             ✅ updated — Project layout + Conventions.
  - .claude/skills/create-component/SKILL.md ✅ updated — entity folders, `@/` alias.

Follow-up TODOs:
  - (carried from 1.5.0) Add a note in CLAUDE.md "Forbidden moves" that `as any`,
    `as unknown`, and `as unknown as X` are forbidden workarounds.
  - (carried from 1.5.0) Document the genuine third-party boundary casts in
    src/db/driver.ts and src/db/migrations.ts with a comment citing the reason.
-->

# todo-opfs-sqlite Constitution

## Core Principles

### I. Local-First (NON-NEGOTIABLE)

All application data MUST live in the user's browser via SQLite-WASM persisted to OPFS,
with an in-memory fallback when OPFS is unavailable. No backend, no remote API for app
data, and no second client-side persistence layer (localStorage, IndexedDB) for
domain data. The only sanctioned non-SQLite persistence is the PWA service worker's
Workbox cache, which is managed by `vite-plugin-pwa`.

Rationale: The product promise is offline-capable, account-free workout logging. Adding
a server or alternative store inverts that model and creates divergence the app is not
designed to reconcile.

### II. Single Worker, Single Init (NON-NEGOTIABLE)

`sqlite3Worker1Promiser` MUST be called exactly once, from inside `initDatabase` in
`src/database.ts`, and `initDatabase` MUST be memoized by a module-level
`databasePromise`. The `databaseId` returned by `promiser('open', ...)` MUST be captured
at module scope and passed to every `exec` call. All DB access MUST go through typed
helpers exported from `src/database.ts`; UI/components MUST NOT import
`@sqlite.org/sqlite-wasm` directly or hold a raw `promiser` reference.

Rationale: A second worker silently corrupts state because two `dbId`s race against the
same OPFS file. Centralising access in `database.ts` also keeps the async boundary
auditable.

### III. Schema-Complete Before Ready

Every schema change and migration MUST run inside `initDatabase` and MUST complete
before the returned promise resolves. The UI MUST gate on `isDbReady` (the resolution of
`initDatabase()`) before rendering anything that touches the DB.

**All database schema changes MUST be implemented as SQL migration files.** Migration
files are the single source of truth for DDL. The required workflow is:

1. Update `src/db/schema.ts` (the Drizzle schema definition).
2. Run `npx drizzle-kit generate` to produce a new `.sql` file in `drizzle/`.
3. Commit both the updated schema and the generated migration file.
4. The migration runner (`src/db/migrations.ts`) executes pending files automatically on
   the next app start, in filename order, inside a `BEGIN`/`COMMIT` transaction.

Inline `CREATE TABLE` or any other DDL written directly inside `initDatabase` is
**forbidden**. Destructive schema changes (DROP COLUMN, rename, type change) applied to
already-shipped migration files are also forbidden — add a new forward migration instead.

Rationale: The DB runs against whatever shape the user's OPFS already has. Migration
files give every schema change an auditable history, make idempotent replay possible
(`CREATE TABLE IF NOT EXISTS`), and ensure the migration runner can detect gaps or
inconsistencies before the app reaches ready state. Inline DDL cannot be versioned,
replayed safely, or rolled back.

### IV. Parameterized SQL Only

All SQL MUST use the `bind` array with `?` placeholders. String interpolation,
template-literal substitution, or concatenation into SQL is forbidden. Upserts SHOULD
use `INSERT ... ON CONFLICT(...) DO UPDATE SET ...`; `INSERT OR REPLACE` is permitted
but not preferred (it deletes and re-inserts, which can break foreign-key cascades).

Rationale: The promiser supports only positional params, and SQL injection in a
local-first app still corrupts the user's own data. There is no second line of defence.

### V. Simplicity & Explicit Scope

Features MUST NOT introduce abstractions, tests, or infrastructure beyond what the task
requires. Anything outside the local-first scope — tests, auth, sync, multi-device,
backend, SSR — MUST be surfaced and agreed before implementation; these are
architectural decisions, not implementation details. Tests are OPTIONAL by default and
MUST NOT be added ad-hoc: the test runner and scope (unit vs. integration with real
OPFS in headless Chrome) require explicit decision.

Rationale: The project deliberately avoids premature structure. Adding a test runner or
sync protocol without a decision locks in a direction that is expensive to reverse.

### VI. Mobile-First, Adaptive UI

All UI components MUST be mobile-friendly and adapt fluidly from narrow phone viewports
(≥320px) up through tablet and desktop widths. Layouts MUST use responsive primitives
(Chakra responsive props / array syntax, CSS flex/grid, relative units) rather than
fixed pixel widths or desktop-only assumptions. Interactive targets MUST meet a minimum
of 44×44 CSS px for touch. Horizontal scrolling at any supported width is forbidden
unless it is the intended interaction (e.g., a carousel). New components MUST be
verified at a narrow viewport before being considered complete.

Rationale: Workout logging happens on a phone at the gym. A desktop-only layout makes
the product unusable in its primary context, and retrofitting responsiveness after the
fact is consistently more expensive than building for it.

### VII. Component Separation of Concerns

React components MUST be strictly separated into two categories, each with distinct
responsibilities:

- **Container Components** (data/logic layer): Hold business logic, state management,
  data fetching, validation, and side effects. Examples: `WorkoutTable` (fetches data,
  handles edit/delete), `WorkoutForm` (manages form state, validates, saves to DB).
  Containers SHOULD NOT contain UI-specific code (styling, layout, DOM structure).

- **Presentational Components** (UI layer): Pure display components that receive props
  and render UI. Examples: a reusable `Button`, `Table`, `Modal`, `Input`. Presentational
  components MUST be free of business logic, data fetching, and conditional side effects.
  They accept data via props and emit events (callbacks) for user interactions.

Rationale: Separation keeps business logic testable and portable; reusable UI components
stay generic across features. Mixing concerns creates tight coupling, makes components
hard to reuse, and embeds domain knowledge in presentation code. This discipline also
makes the codebase more navigable: readers know where to find business rules (containers)
vs. styling and layout (presentational).

### VIII. Code Organization & File Size

Files MUST NOT exceed a soft limit of ~200 lines. When a file approaches this limit,
logic MUST be extracted into focused utility files rather than grown in place.
Shared helpers SHOULD live in a global utility file (e.g., `src/utils.ts`); logic
shared within a single domain SHOULD live in a co-located utility file
(e.g., `src/components/workoutUtils.ts`). Every utility function MUST be a pure,
named export with a single, clearly named responsibility.

Files MUST be grouped into folders by feature and domain entity rather than left loose
at a route root. Each component MUST live in its own folder with an `index.tsx` entry
point whose exported component matches the folder name (e.g. `Exercise/ExerciseForm/
index.tsx` exports `ExerciseForm`); a form's folder colocates its `schema.ts`. Trivial
re-export barrel files are forbidden — an `index.tsx` IS the component, not a re-export;
the database module is the sole exception. Every cross-directory import MUST use the
`@/` alias (→ `src/`); `../` parent-relative imports are forbidden, and only same-folder
`./` imports stay relative.

Rationale: Files beyond ~200 lines become hard to review, navigate, and reason about.
Keeping files small forces decomposition early, surfaces reuse opportunities naturally,
and makes individual responsibilities easy to test in isolation. Grouping by entity and
giving each component a predictable entry point makes the tree navigable; the `@/` alias
keeps imports stable under refactors and free of `../../../../` churn.

### IX. Strong TypeScript Types

TypeScript type errors MUST be resolved by writing correct types — never by casting to
`any`, `unknown`, or using the `as unknown as X` double-cast escape hatch. When a type
error arises, the correct fix is one of:

- Define or narrow the type precisely (e.g., a typed interface, discriminated union,
  or explicit generic parameter).
- Correct the call site so the types align without casting.
- Extend or narrow an existing type with `Pick`, `Omit`, `Extract`, intersection, or
  a type guard (`is` predicate).

The only permitted exception is at a genuine **untyped external boundary** — meaning a
third-party API or browser API that returns `unknown` or has no type declarations and
cannot be typed without a cast. In that case:

- The cast MUST be localized to the narrowest possible scope (a single return line or
  assignment, not a function signature).
- A short inline comment MUST explain why no real type is available (e.g.,
  `// sqlite3Worker1Promiser returns a loosely-typed object; cast is required until
  the library ships types`).
- The cast MUST use the most specific target type available, not `any`.

`as any` is forbidden in all circumstances. `as unknown` alone (without immediately
narrowing to a specific type) is forbidden. Suppressing type errors via `// @ts-ignore`
or `// @ts-expect-error` without a cited reason and a tracking comment is forbidden.

Rationale: `as unknown as X` silences the compiler without proving correctness — it
converts a compile-time guarantee into a runtime assumption with no safety net. Every
such cast is a latent bug waiting for a refactor to expose it. Real types are
discoverable, refactor-safe, and self-documenting; casts are invisible technical debt
that compounds over time.

## Technical Constraints

- **Cross-origin isolation**: COOP/COEP headers MUST be set in `vite.config.ts`
  (`server.headers`) for dev and on whatever server hosts the production build. SQLite's
  OPFS VFS requires a cross-origin-isolated context; removing the headers breaks
  persistence silently.
- **Vite optimisation**: `@sqlite.org/sqlite-wasm` MUST remain in
  `optimizeDeps.exclude`. Vite's pre-bundler rewrites worker URLs and breaks worker
  loading otherwise.
- **Service worker**: The SW MUST NOT be registered in `npm run dev`. PWA install,
  offline, and SW cache behaviour MUST be exercised via `npm run preview` against the
  production build.
- **Browser-only APIs**: The app depends on `Worker`, `OPFS`, and `crossOriginIsolated`.
  Server-side rendering is out of scope without significant rework.

## Development Workflow

- **Commands**: `npm run dev` (dev server, no SW), `npm run build` (`tsc -b` then
  `vite build`), `npm run preview` (serve production build), `npm run lint` and
  `npm run lint:fix` (ESLint via `eslint-config-canonical`), `npm run typecheck`
  (`tsc -b`).
- **Schema changes**: run `npx drizzle-kit generate` after editing `src/db/schema.ts`;
  commit both the schema file and the generated `drizzle/*.sql` file together.
- **Lint + typecheck MUST pass before commit.** A repo stop-hook enforces this.
- **No test runner is configured.** Per Principle V, do not add one ad-hoc.
- **CLAUDE.md is authoritative runtime guidance** for any Claude-driven contribution.
  The constitution and CLAUDE.md MUST stay consistent; amendments to either trigger a
  review of the other.

## Governance

- This constitution supersedes any ad-hoc convention or undocumented practice. When a
  PR or change conflicts with a principle, the principle wins unless the constitution
  is amended first.
- **Amendments** require: (a) a written change describing the new/modified principle
  and its rationale, (b) a version bump per the policy below, (c) a propagated update to
  any dependent template (`.specify/templates/*`) and to `CLAUDE.md` where applicable.
- **Versioning policy** (semantic):
  - MAJOR — a principle is removed or redefined in a backward-incompatible way, or
    governance changes meaningfully.
  - MINOR — a new principle/section is added, or existing guidance is materially
    expanded.
  - PATCH — wording, clarification, typo, or non-semantic refinement.
- **Compliance review**: every PR description SHOULD note which principles the change
  touches; any deviation MUST be justified in a Complexity Tracking entry in the
  feature's plan.md.

**Version**: 1.6.0 | **Ratified**: 2026-05-18 | **Last Amended**: 2026-06-03

<!--
Sync Impact Report
==================
Version change: 1.0.0 → 1.1.0
Bump rationale: Added Principle VI (Mobile-First, Adaptive UI). MINOR bump per policy —
new principle added, no existing principle redefined or removed.
Modified principles: none
Added sections:
  - Principle VI: Mobile-First, Adaptive UI
Removed sections: none
Templates audited:
  - .specify/templates/plan-template.md       ⚠ pending (next /speckit-plan should add a
    responsive/mobile gate to the Constitution Check block)
  - .specify/templates/spec-template.md       ✅ no changes needed
  - .specify/templates/tasks-template.md      ✅ no changes needed
  - CLAUDE.md                                 ⚠ pending (does not currently mention UI
    responsiveness; update when CLAUDE.md is next revised, or leave to the constitution
    as authoritative)
Follow-up TODOs: none
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

Every `CREATE TABLE` and migration MUST run inside `initDatabase` and MUST complete
before the returned promise resolves. The UI MUST gate on `isDbReady` (the resolution of
`initDatabase()`) before rendering anything that touches the DB. Migrations MUST be
additive and gated on `PRAGMA table_info` checks; destructive changes (DROP COLUMN,
rename, type change) are forbidden inside `initDatabase`.

Rationale: The DB runs against whatever shape the user's OPFS already has. A
half-migrated DB or a UI that queries before schema exists causes silent data loss that
cannot be recovered on the client.

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

**Version**: 1.1.0 | **Ratified**: 2026-05-18 | **Last Amended**: 2026-05-18

# Workout Log

A local-first workout logging PWA. Data lives in your browser via SQLite-WASM + OPFS — no account, no server, works offline once installed.

## Stack

- React 18 + TypeScript (strict, with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, etc.)
- Vite
- Chakra UI
- `@sqlite.org/sqlite-wasm` with the OPFS VFS, in-memory fallback when OPFS is unavailable
- `vite-plugin-pwa` (Workbox service worker, installable manifest)
- ESLint with `eslint-config-canonical` (opinionated, type-aware)

## Scripts

```bash
npm install

npm run dev         # Vite dev server (service worker NOT registered)
npm run build       # tsc -b && vite build (emits SW + manifest)
npm run preview     # serve the production build — required to test PWA install/offline

npm run typecheck   # tsc -b (noEmit)
npm run lint        # eslint .
npm run lint:fix    # eslint . --fix
npm run check       # typecheck + lint
```

## Project layout

```
src/
  database.ts   # SQLite-WASM worker + OPFS bootstrap, typed helpers (the only barrel)
  db/           # entity repositories, schemas, types backing database.ts
  App.tsx       # UI gated on initDatabase()
  main.tsx      # Entry
  router.tsx    # Route table
  components/   # shared presentational components (FormDialog, ConfirmDialog, …)
  hooks/        # shared hooks (useToggle, …)
  utils/        # shared pure helpers
  routes/       # one folder per feature (exercises, workouts, routines, settings)
public/
  favicon.svg, icon-*.png   # PWA icons (placeholders — swap with your own)
vite.config.ts             # COOP/COEP headers, PWA config, @/ alias
.claude/                   # Claude Code hooks (validate + autofix on Stop)
CLAUDE.md                  # Architecture notes for Claude Code sessions
```

### Conventions

- **`@/` path alias** maps to `src/`. Every cross-directory import uses it
  (`import { useToggle } from '@/hooks/useToggle'`); only same-folder imports stay
  relative (`./schema`). Configured in `vite.config.ts` (`resolve.alias`) and
  `tsconfig.app.json` (`paths`).
- **Feature folders** under `src/routes/<feature>/` group files by domain entity.
  Each component lives in its own folder with an `index.tsx` entry point whose
  exported component matches the folder name (e.g. `Exercise/ExerciseForm/index.tsx`
  exports `ExerciseForm`). A form folder colocates its `schema.ts`.
- **No trivial barrels.** `index.tsx` files *are* the component, not re-exports. The
  sole re-export barrel in the app is `database.ts`.
- Stateful containers (e.g. `ExerciseLibrary/`) keep `hooks/` and `views/` subfolders;
  see `.claude/skills/create-component/SKILL.md` for the full layer contract.

## How persistence works

`src/db.ts` opens `app.sqlite3` via the OPFS VFS using `sqlite3Worker1Promiser`. The worker is created exactly once, memoized through `dbPromise`, and every helper passes the captured `dbId`. Schema and migrations run before `initDb()` resolves, so the rest of the app can assume a ready DB. If OPFS is unavailable (older browsers, insecure context), the helper falls back to `:memory:` with a console warning — the app still works but data isn't persisted across reloads.

The kv table (`key TEXT PRIMARY KEY, value TEXT NOT NULL`) is a placeholder — replace with your real workout schema.

## PWA notes

- OPFS only works in a secure context (HTTPS or `localhost`).
- The service worker is emitted only in production builds — test install/offline with `npm run preview`.
- `vite.config.ts` sets `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers (required for SQLite-WASM's OPFS VFS). Your production server must serve the same headers.
- Icons in `public/` are generated placeholders — replace `favicon.svg` and re-generate the PNGs with your own artwork.

## License

MIT — see [LICENSE](./LICENSE).

# Research: Exercise Images

**Feature**: 013-exercise-images  
**Date**: 2026-06-11

## Decision 1 — Circular image rendering in exercise list

**Decision**: Use MUI `Avatar` component with `src={/exercises/${exercise.imageFilename}}` and `alt={exercise.name}`.  
**Rationale**: `Avatar` handles the circular crop, `src` loading, and automatic initial-letter fallback when `src` is absent or fails to load — zero additional code needed for the placeholder requirement (FR-005). Size `sx={{ width: 40, height: 40 }}` fits the list row without crowding the name. Add `ListItemAvatar` wrapper for correct MUI list spacing.  
**Alternatives considered**: Custom `<img>` with CSS `border-radius: 50%` + JS `onError` handler — works but re-implements what Avatar already does.

---

## Decision 2 — Image picker UI for 1,324 images

**Decision**: A full-screen (or large) MUI `Dialog` containing a debounced text `TextField` and a fixed-height `Box` with `overflow: auto` rendering a responsive CSS grid of `Avatar` thumbnails. Client-side filtering over the in-memory catalog; no virtualization library added.  
**Rationale**: At 1,324 items the DOM is manageable when filtered — a debounced search input typically reduces visible items to < 50 immediately. Adding `react-window` for a catalog of this size would be premature complexity (violates Principle V). The grid renders only filtered results; unfiltered initial load shows all 1,324 thumbnails inside a scrollable box, which is acceptable on modern devices.  
**Alternatives considered**: `react-window` / `react-virtual` — would eliminate DOM nodes for off-screen images but adds a dependency and significant implementation complexity for a list that already scrolls acceptably. Rejected under Principle V.  
**Performance note**: The 1,324 JPEGs are not loaded until the picker opens. The browser's native image lazy-loading (`loading="lazy"` on `<img>` inside Avatar) keeps initial render fast even without virtualization.

---

## Decision 3 — Catalog data structure for picker search

**Decision**: Commit a generated `src/assets/exercise-catalog.json` containing one entry per dataset exercise: `{ filename: string; name: string; target: string; category: string }`. Generated once from `exercises-dataset/data/exercises.json` by a small Node script (documented in quickstart).  
**Rationale**: The picker needs to search 1,324 entries by name/target/category at keypress. Bundling the metadata as a static JSON import (parsed once at module load) is the simplest approach: no runtime fetch, tree-shakeable, type-safe. The dataset's `exercises.json` itself is not committed — only the trimmed catalog.  
**Catalog size estimate**: 1,324 entries × ~80 bytes each ≈ ~106 KB JSON. Gzip compression reduces this further.  
**Alternatives considered**: Storing catalog in SQLite — would require a second table and schema migration. Rejected: the catalog is read-only lookup data with no per-user state.

---

## Decision 4 — Drizzle migration workflow

**Decision**: Add `imageFilename: text('image_filename')` (nullable, no default) to `src/db/entities/exercise/schema.ts`, run `npx drizzle-kit generate`, then manually append the 24 UPDATE statements to the generated `.sql` file.  
**Rationale**: Constitution Principle III mandates the Drizzle migration workflow. The generated file handles the `ALTER TABLE ... ADD COLUMN` DDL. The UPDATE statements (from FR-015) are safe to append because they touch only hardcoded name literals — no user input, no injection risk.  
**Alternatives considered**: Inline `ALTER TABLE` inside `initDatabase` — forbidden by Principle III.

---

## Decision 5 — Offline caching of exercise images (PWA)

**Decision**: Add a Workbox `runtimeCaching` rule in `vite.config.ts` with `CacheFirst` strategy for requests matching `/exercises/*.jpg`. Do NOT add `jpg` to `globPatterns`.  
**Rationale**: The current `globPatterns` excludes `jpg`. Precaching all 1,324 images would add potentially hundreds of MB to the Workbox precache manifest, making every PWA install/update extremely heavy. `CacheFirst` is the correct strategy for static image assets: first request fetches from network and caches; all subsequent requests (including offline) are served from cache. After first app use, all viewed images are available offline.  
**SC-004 nuance**: "All exercise images render with the device offline" is satisfied for images that have been viewed at least once. The app is not intended to proactively download all 1,324 images on install. Users installing the PWA will cache images naturally as they browse exercises.  
**Service worker note**: The custom `sw.ts` uses `injectManifest` strategy. The `runtimeCaching` configuration must be expressed in `vite.config.ts` under `workbox.runtimeCaching` (Workbox InjectManifest mode respects this).  
**Alternatives considered**: Precaching all `jpg` — functionally ideal but impractical at this scale. Background sync / install-time prefetch — adds significant complexity for marginal gain.

---

## Decision 6 — ExerciseForm integration (image picker field)

**Decision**: Add an optional `imageFilename` field to the `ExerciseForm` Zod schema (`z.string().nullable().optional()`). Render a compact "Select image" button below the Classification field. Tapping opens `ExerciseImagePicker`. The selected filename is stored in form state and submitted with the exercise save.  
**Rationale**: Minimal change to existing form — no redesign of the layout, just a new optional field. The picker is opened/closed by local state within `ExerciseForm` (not hoisted to `useExercises`), keeping form concerns co-located.  
**Alternatives considered**: Hoisting picker state to `useExercises` — unnecessary; picker state is entirely local to the form lifecycle.

---

## Decision 7 — .gitignore and asset copy step

**Decision**: Add `exercises-dataset/` to `.gitignore`. Copy images once with `cp exercises-dataset/images/*.jpg public/exercises/`. Commit `public/exercises/` to the repo.  
**Rationale**: The dataset is a separate repository (cloned alongside the app repo). It should not be tracked inside the app repo. The copied images in `public/exercises/` ARE committed — they are production build assets, stable, and must be available in CI and on fresh clones without re-running the copy step.  
**Alternatives considered**: Git submodule for the dataset — adds complexity; images are the only thing needed, and copying is simpler. Gitignoring `public/exercises/` and requiring copy on every clone — means CI and reviewers need the dataset installed, which is impractical.

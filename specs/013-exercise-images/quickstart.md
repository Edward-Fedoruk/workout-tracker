# Quickstart: Exercise Images

**Feature**: 013-exercise-images  
**Date**: 2026-06-11

## Prerequisites

- Node 20+, npm
- The `hasaneyldrm/exercises-dataset` repo cloned **alongside** this repo (or anywhere on disk)

## One-time Asset Setup

Run from the repo root:

```sh
# 1. Create the public directory
mkdir -p public/exercises

# 2. Copy all .jpg thumbnails from the dataset
cp /path/to/exercises-dataset/images/*.jpg public/exercises/

# 3. Verify: should print 1324
ls public/exercises/*.jpg | wc -l
```

> The `exercises-dataset/` directory is in `.gitignore` — do NOT commit it.
> The copied files in `public/exercises/` ARE committed (they are production build assets).

## Generate the Picker Catalog

Run once after copying images (or re-run if the dataset changes):

```sh
node scripts/generate-exercise-catalog.js
```

This reads `exercises-dataset/data/exercises.json` and writes `src/assets/exercise-catalog.json` (1,324 entries, fields: `filename`, `name`, `target`, `category`).

> The script lives at `scripts/generate-exercise-catalog.js`. If it does not exist yet, create it as part of task implementation.

## DB Migration

After updating `src/db/entities/exercise/schema.ts` (add `imageFilename` column):

```sh
npx drizzle-kit generate
```

This produces `drizzle/0003_exercise-image-filename.sql`. Then manually append the UPDATE statements for the 24 default exercises (see `data-model.md § Default Exercise → Image Mapping`). Commit both files.

## Dev Server

```sh
npm run dev
```

Exercise images are served as static assets. OPFS migration runs on first load — open DevTools console and confirm `[migrations] Applied 0003_exercise-image-filename.sql`.

## Verify Default Mappings

1. Open the Exercise Library.
2. Each of the 24 default exercises should show a circular image on the left.
3. Open any exercise's Edit form — the current image should be pre-selected in the picker.

## PWA / Offline Verification

```sh
npm run build && npm run preview
```

1. Install the PWA.
2. Browse the Exercise Library (this caches images via `CacheFirst` runtime caching).
3. Go offline.
4. Re-open the Exercise Library — previously viewed images should render from cache.

## Lint + Typecheck

```sh
npm run lint && npm run typecheck
```

Both must pass before commit (enforced by repo stop-hook).

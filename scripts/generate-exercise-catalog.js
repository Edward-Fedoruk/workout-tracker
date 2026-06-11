// Generates src/assets/exercise-catalog.json from the exercises-dataset clone.
//
// The catalog is the read-only search index used by ExerciseImagePicker. It is
// a trimmed projection of exercises-dataset/data/exercises.json — only the
// fields the picker searches/displays. Run once after copying images:
//
//   node scripts/generate-exercise-catalog.js
//
// Output: src/assets/exercise-catalog.json — [{ filename, name, target, category }]
// where `filename` is the basename of each entry's `image` field
// (e.g. "images/0025-EIeI8Vf.jpg" -> "0025-EIeI8Vf.jpg").

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const sourcePath = resolve(repoRoot, 'exercises-dataset/data/exercises.json');
const outDir = resolve(repoRoot, 'src/assets');
const outPath = resolve(outDir, 'exercise-catalog.json');

const raw = readFileSync(sourcePath, 'utf8');
const exercises = JSON.parse(raw);

if (!Array.isArray(exercises)) {
  throw new Error(`Expected an array in ${sourcePath}`);
}

const catalog = exercises
  .filter((entry) => typeof entry.image === 'string' && entry.image.length > 0)
  .map((entry) => ({
    category: entry.category ?? '',
    filename: basename(entry.image),
    name: entry.name ?? '',
    target: entry.target ?? '',
  }));

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');

// eslint-disable-next-line no-console -- CLI script progress output
console.log(`Wrote ${catalog.length} entries to ${outPath}`);

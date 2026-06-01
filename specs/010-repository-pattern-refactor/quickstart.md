# Quickstart: Repository Pattern

## Adding a new data operation

1. Open `src/db/entities/<entity>/repository.ts`.
2. Add a method to the repository class. Reference `database` (the Drizzle instance imported from `../../orm`) directly.
3. Export the method name from `src/database.ts` via the singleton: `export const myNewOp = (...args) => entityRepository.myNewOp(...args)`.
4. Import from `src/database.ts` in the component — never from `src/db/` directly.

```ts
// src/db/entities/exercise/repository.ts
import { database } from '../../orm';
import { exercise } from './schema';

class ExerciseRepository {
  async findByName(name: string) {
    return database.select().from(exercise).where(eq(exercise.name, name));
  }
}

export const exerciseRepository = new ExerciseRepository();
```

## Adding a new entity

1. Create `src/db/entities/<entity-name>/` with three files:
   - `schema.ts` — Drizzle table definition
   - `types.ts` — `export type Foo = typeof fooTable.$inferSelect`
   - `repository.ts` — `class FooRepository { ... }` + `export const fooRepository = new FooRepository()`
2. Re-export the table from `src/db/schema.ts`:
   ```ts
   export * from './entities/<entity-name>/schema';
   ```
3. Run `npx drizzle-kit generate` to produce the migration file. Commit both the schema and migration.
4. Wire the repository into `src/database.ts` — add the export.

## Using `.returning()` for inserts

All inserts that need the new ID use `.returning()`. Never use `SELECT last_insert_rowid()`.

```ts
const inserted = await database
  .insert(myTable)
  .values({ name })
  .returning({ id: myTable.id });

const id = inserted[0]?.id;
if (id === undefined) throw new Error('INSERT failed: no row returned');
```

## Using transactions

Multi-step operations use `database.transaction()`:

```ts
async create(name: string, relatedIds: number[]) {
  return database.transaction(async (tx) => {
    const [row] = await tx.insert(myTable).values({ name }).returning({ id: myTable.id });
    if (!row) throw new Error('INSERT failed');
    for (const relId of relatedIds) {
      await tx.insert(joinTable).values({ myId: row.id, relId });
    }
    return row.id;
  });
}
```

## Classification values

`ExerciseClassification` is `'bodyweight' | 'standard'`. There is no `'assisted'` value. The eRM calculation treats `'bodyweight'` as the non-standard case (adds body weight to logged weight). All other classifications use logged weight directly.

## Component conventions

All components follow the `create-component` scaffold:
- Named export (not default)
- Props interface defined in the same file, named `<ComponentName>Props`
- Container components fetch data and pass it to presentational children
- Presentational components are pure functions of props
- No component imports from `src/db/` — always from `src/database.ts`

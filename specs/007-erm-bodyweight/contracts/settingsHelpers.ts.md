# Contract: `src/db/settingsHelpers.ts`

New file. Provides typed async helpers for reading and writing entries in the `app_setting` table. All DB access follows the standard pattern from `CLAUDE.md`.

---

## Exports

### `getBodyWeight(): Promise<number | null>`

Returns the stored body weight in kg, or `null` if the `body_weight` key has never been set.

```ts
export async function getBodyWeight(): Promise<number | null>
```

**Behaviour**:
- Queries `SELECT value FROM app_setting WHERE key = ?` with `bind: ['body_weight']`.
- If `resultRows` is empty → returns `null`.
- Otherwise parses the value with `parseFloat` and returns the number.

---

### `setBodyWeight(kg: number): Promise<void>`

Persists body weight. Validates before writing; throws on invalid input.

```ts
export async function setBodyWeight(kg: number): Promise<void>
```

**Validation** (throws `Error` with a user-readable message):
- `kg` must be a finite number.
- `kg` must be > 0.
- `kg` must be ≤ 500.
- `kg` must have at most 2 decimal places (i.e., `Math.round(kg * 100) / 100 === kg`).

**Behaviour**:
- Uses `INSERT INTO app_setting (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value` (upsert pattern per repo standard).
- Stores the value as a string representation rounded to 2 decimal places: `kg.toFixed(2)`.

---

## Internal row type

```ts
type AppSettingRow = {
  value: string;
};
```

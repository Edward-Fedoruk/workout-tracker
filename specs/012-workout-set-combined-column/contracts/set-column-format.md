# UI Contract: Combined Set Column

The workout table is the UI surface this feature changes. This contract defines the observable
behavior of the per-set column.

## Column structure (per set `n` in 1..5)

Before: 3 columns — `S{n} kg`, `S{n} reps`, `S{n} eRM`.
After: 2 columns — `S{n}` (combined weight × reps), `S{n} eRM` (unchanged).

| Column | id | header | Cell content |
|--------|----|--------|--------------|
| Combined set | `Set{n}` | `S{n}` | `formatSetCell(Set{n}_weight, Set{n}_reps)` |
| eRM | `Set{n}_erm` | `S{n} eRM` | `formatERM(Set{n}_erm)` (unchanged) |

## Cell formatting contract — `formatSetCell(weight, reps)`

```
both present  →  `${weight}kg × ${reps}`   // separator is U+00D7 MULTIPLICATION SIGN
only weight   →  `${weight}kg`
only reps     →  `${reps}`
neither       →  `—`                        // U+2014, matches existing renderNullable placeholder
```

- "present" means the value is a number (including `0`); "absent" means `null`.
- Weight and reps are rendered exactly as stored (no rounding; decimals preserved, e.g. `22.5kg`).

## Default visibility contract

- Set 1 columns (`Set1`, `Set1_erm`) visible by default.
- Sets 2–5 columns (`Set{n}`, `Set{n}_erm`) hidden by default via `HIDDEN_SET_COLUMNS`.
- Users can still toggle hidden columns through the table's column-visibility control (unchanged
  Material React Table behavior).

## Non-goals

- No change to Date / Exercise columns, row actions, sorting controls, or the add/edit/delete flows.
- eRM display logic is untouched.
- No persisted data is read or written differently.

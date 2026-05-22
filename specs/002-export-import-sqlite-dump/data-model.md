# Data Model

This feature introduces **no schema changes**. It is a transport feature: it serializes and deserializes the existing database as-is.

## In-app entities (unchanged)

| Table | Source |
|---|---|
| `kv` | `src/database.ts:71-77` |
| `workout_log` | `src/database.ts:79-89` |
| `workout_set` | `src/database.ts:92-104` |

All three are captured by export and reconstituted by import without any per-table handling.

## External entity — the dump file

The user-facing artifact produced by Export and consumed by Import.

| Aspect | Value |
|---|---|
| Format | Raw binary SQLite 3 database file (the format defined by https://www.sqlite.org/fileformat.html). |
| File extension | `.sqlite3` |
| Suggested filename | `workout-log-YYYY-MM-DD.sqlite3` (local date) |
| MIME type | `application/vnd.sqlite3` |
| First 16 bytes | The literal ASCII `SQLite format 3 ` (15 chars + a `\0` byte). This is the validated magic header on import. |
| Identity / version marker | None. The schema itself is the only signal; the spec accepts an unrelated SQLite file (the import succeeds, the app shows an empty workout view). |
| Encryption | None. |

## State transitions

```
                    ┌──────────────────────────────────────────────┐
                    │              app session                     │
                    │                                              │
   ┌─ Export ──────►│   exportDatabaseBytes()                      │
   │                │     → reads bytes via worker 'export'        │
   │                │     → no state change to OPFS                │
   │                │   download triggered                         │
   │                │                                              │
   └─ Import ──────►│   1. file picked                             │
                    │   2. magic header check (16 bytes)           │
                    │       fail → abort, OPFS untouched           │
                    │   3. user confirms destructive replacement   │
                    │   4. close worker DB ('close' command)       │
                    │   5. delete OPFS app.sqlite3 + sidecars      │
                    │   6. write new bytes to OPFS                 │
                    │       fail at 6 → fatal error to user        │
                    │   7. location.reload()                       │
                    └──────────────────────────────────────────────┘
                                          │
                                          ▼
                    ┌──────────────────────────────────────────────┐
                    │           fresh app session                  │
                    │   initDatabase() opens the new file          │
                    │   createSchema() additively ensures tables   │
                    │   UI renders the imported data               │
                    └──────────────────────────────────────────────┘
```

## Validation rules

- **Import preflight**: file must begin with `SQLite format 3 ` (16 bytes). No other content validation is performed.
- **Schema validation**: none on import. The next `initDatabase()` call after reload runs the existing additive migration (`CREATE TABLE IF NOT EXISTS …`), which is the project's canonical reconciliation path for older schemas.

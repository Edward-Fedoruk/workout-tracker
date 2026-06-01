---
name: "create-component"
description: "scaffolding a new React component for this project."
argument-hint: "Optional user request"
user-invocable: true
disable-model-invocation: false
---

# Create React Component

You are scaffolding a new route-level React component for this project. The request is: $ARGUMENTS

## Step 1 — Gather requirements

If $ARGUMENTS does not clearly specify both the **component name** and the **domain entities** it manages, ask the user before writing any files:

- What is the component name?
- What domain entities does it manage? (e.g. "exercises and muscle groups", "routines", "workouts")
- Does it need a tab/section split between entities, or is it a single view?
- Where should it live in `src/routes/`?

Do not proceed until these are clear.

## Step 2 — Scaffold files in this order

Create all files below. Follow every constraint in the reference section exactly. Do not deviate from the patterns.

### 1. `<ComponentName>/hooks/use<Entity>.ts` — one per entity

- `useState` only — **no `useEffect`**, no DB calls at init time
- `useToggle` for every boolean open/closed state (form dialog, delete confirmation)
- Name toggle return values as nouns: `dialog`, `deleteConfirm`
- Export `type Use<Entity>Return = ReturnType<typeof use<Entity>>`
- Expose a `refresh()` async function that reloads from the DB
- All state-mutating actions returned as named functions

### 2. `<ComponentName>/views/<ComponentName>View.tsx` — dumb shell

- Accepts `children: ReactNode`, tab/nav state, and its setter
- Renders page chrome only: title, tabs/nav, `{children}`
- Defines and exports the tab union type (e.g. `SubView`) — it lives here, not in `index.tsx`
- Zero state, zero effects, zero DB imports

### 3. `<ComponentName>/views/<Entity>View.tsx` — dumb view, one per section

- Props typed as `Use<Entity>Return & { /* extra */ }`
- Renders the section's content: list, form dialog, delete confirmation dialog
- Use `ConfirmDialog` from `src/components/ConfirmDialog.tsx` for all delete confirmations — never a raw MUI `Dialog`
- Pass `on*` props as inline arrows when the referenced function is not named `handle*`

### 4. `<ComponentName>/index.tsx` — smart component

- Calls all domain hooks
- Owns a **single `useEffect`** that loads all entities in parallel on mount:
  ```tsx
  useEffect(() => {
    const load = async () => {
      await Promise.all([entityA.refresh(), entityB.refresh()]);
    };
    load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: runs once on mount to seed data
  }, []);
  ```
- Renders the shell view with the active section view as `children`
- Wires any cross-entity side effects here (e.g. refresh entity A after entity B is deleted)
- **No `<ComponentName>.tsx` barrel file** — importers resolve the folder directly

## Step 3 — Verify

Run `npm run lint && npm run build` and fix any errors before reporting done.

---

## Reference: layer contract

| Layer | Allowed | Forbidden |
|---|---|---|
| `index.tsx` **smart** | hooks, `useState`, `useEffect`, prop passing | substantive JSX beyond the root wrapper |
| `views/*.tsx` **dumb** | JSX, MUI, typed props, callbacks | `useState`, `useEffect`, DB imports |
| `hooks/*.ts` | `useState`, DB calls, `useToggle` | JSX, `useEffect` |

## Reference: things NOT to do

**Do not create `<ComponentName>.tsx` alongside `<ComponentName>/`.** TypeScript resolves the file before the folder, forcing `eslint-disable` comments and explicit `/index` suffixes. Use `<ComponentName>/index.tsx` only — the folder resolves naturally.

**Do not self-fetch in hooks.** Hooks are pure state-and-actions containers. Only the smart component triggers data loading via `useEffect`.

**Do not import DB functions in dumb views.** If a view imports from `../../database`, it is no longer dumb.

**Do not pass a non-`handle*` function directly to an `on*` prop.** The `react/jsx-handler-names` lint rule enforces this. Use a `handle*`-named reference or an inline arrow — never `dialog.onClose` or `hook.refresh` directly.

## Reference: naming conventions

| Thing | Convention | Example |
|---|---|---|
| Boolean state | `is*` / `does*` prefix | `isOpen`, `isDuplicate`, `isLoading` |
| Toggle return object | noun | `dialog`, `deleteConfirm` |
| Handler functions | `handle*` prefix | `handleSave`, `handleConfirmDelete` |
| Async handlers in JSX | `.catch(() => undefined)` | `handleSave(...).catch(() => undefined)` |
| `on*` prop values | `handle*` ref or inline arrow | `() => { dialog.onClose(); }` |

## Reference: domain hook skeleton

```ts
import { useToggle } from '../../../../hooks/useToggle';
import { useState } from 'react';

export type Use<Entity>Return = ReturnType<typeof use<Entity>>;

export const use<Entity> = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [duplicateError, setDuplicateError] = useState<null | string>(null);
  const [pendingDelete, setPendingDelete] = useState<Item | null>(null);

  const dialog = useToggle();
  const deleteConfirm = useToggle();

  const refresh = async () => {
    const list = await listItems();
    setItems(list);
  };

  const openCreate = () => { setEditingItem(null); setDialogMode('create'); setDuplicateError(null); dialog.onOpen(); };
  const openEdit = (item: Item) => { setEditingItem(item); setDialogMode('edit'); setDuplicateError(null); dialog.onOpen(); };

  const handleSave = async (/* form fields */) => {
    // duplicate check → setDuplicateError → return early
    // CRUD call → refresh() → dialog.onClose()
  };

  const requestDelete = (item: Item) => { setPendingDelete(item); deleteConfirm.onOpen(); };
  const confirmDelete = async (onAfterDelete?: () => Promise<void>) => {
    if (!pendingDelete) { return; }
    const target = pendingDelete;
    setPendingDelete(null);
    deleteConfirm.onClose();
    await deleteItem(target.id);
    await Promise.all([refresh(), onAfterDelete?.()]);
  };
  const cancelDelete = () => { setPendingDelete(null); deleteConfirm.onClose(); };

  return {
    cancelDelete, confirmDelete, deleteConfirm, dialog, dialogMode,
    duplicateError, editingItem, handleSave, items, openCreate, openEdit,
    pendingDelete, refresh, requestDelete,
  };
};
```

## Reference: smart component skeleton

```tsx
import { useEffect, useState } from 'react';

export const <ComponentName> = () => {
  const [subView, setSubView] = useState<SubView>('<default>');
  const entityA = use<EntityA>();
  const entityB = use<EntityB>();

  useEffect(() => {
    const load = async () => {
      await Promise.all([entityA.refresh(), entityB.refresh()]);
    };
    load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: runs once on mount to seed data
  }, []);

  return (
    <<ComponentName>View onSubViewChange={setSubView} subView={subView}>
      {subView === '<sectionA>' ? (
        <<EntityA>View {...entityA} entityB={entityB.items} />
      ) : (
        <<EntityB>View {...entityB} onAfterDelete={() => entityA.refresh()} />
      )}
    </<ComponentName>View>
  );
};
```

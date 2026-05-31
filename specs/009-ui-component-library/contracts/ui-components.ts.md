# Contract: src/components/ui/ — Shared UI Components

These are the TypeScript prop interfaces for the three shared presentational components. No business logic, no DB calls, no internal state beyond what MUI needs for controlled behaviour.

## ConfirmDialog

```typescript
// src/components/ui/ConfirmDialog.tsx

type ConfirmDialogProps = {
  /** Whether the dialog is visible. */
  readonly open: boolean;
  /** Dialog title text. */
  readonly title: string;
  /** Body content — text or JSX. */
  readonly children: React.ReactNode;
  /** Primary action button label. */
  readonly confirmLabel: string;
  /** Cancel button label. Defaults to "Cancel". */
  readonly cancelLabel?: string;
  /** Primary button MUI color. Defaults to "primary". */
  readonly confirmColor?: 'error' | 'primary' | 'warning';
  /** Called when the primary action button is clicked. */
  readonly onConfirm: () => void;
  /**
   * Called when cancel is clicked or the backdrop is clicked.
   * When undefined: cancel button is hidden; backdrop click is a no-op.
   * Use undefined for non-dismissible dialogs (e.g. MigrationErrorDialog).
   */
  readonly onCancel?: () => void;
};
```

### Usage examples

**Standard destructive confirmation:**
```tsx
<ConfirmDialog
  confirmColor="error"
  confirmLabel="Delete"
  onCancel={() => setOpen(false)}
  onConfirm={handleDelete}
  open={open}
  title="Delete Workout"
>
  Are you sure you want to delete this workout? This cannot be undone.
</ConfirmDialog>
```

**Non-dismissible error dialog:**
```tsx
<ConfirmDialog
  confirmLabel="Reset Database"
  confirmColor="error"
  onConfirm={handleReset}
  // onCancel omitted → dialog has no cancel button; backdrop is a no-op
  open
  title="Database Error"
>
  A migration error occurred: {error.message}
</ConfirmDialog>
```

---

## FormDialog

```typescript
// src/components/ui/FormDialog.tsx

type FormDialogProps = {
  /** Whether the dialog is visible. */
  readonly open: boolean;
  /** Dialog title text. */
  readonly title: string;
  /** Called when the dialog is dismissed (cancel / backdrop). */
  readonly onClose: () => void;
  /** Form field content rendered in the scrollable body area. */
  readonly children: React.ReactNode;
  /** Action buttons rendered in the footer row. */
  readonly actions: React.ReactNode;
  /** MUI dialog max width. Defaults to "xs". */
  readonly maxWidth?: 'md' | 'sm' | 'xs';
  /** Whether dialog stretches to maxWidth. Defaults to true. */
  readonly fullWidth?: boolean;
};
```

### Usage example

```tsx
<FormDialog
  actions={
    <DialogActionButtons
      cancelLabel="Cancel"
      confirmLabel={mode === 'create' ? 'Add' : 'Save'}
      onCancel={onCancel}
      onConfirm={handleSave}
    />
  }
  onClose={onCancel}
  open={open}
  title={mode === 'create' ? 'Add Exercise' : 'Edit Exercise'}
>
  <Stack spacing={2}>
    <TextField ... />
    <Autocomplete ... />
    <Select ... />
  </Stack>
</FormDialog>
```

---

## DialogActionButtons

```typescript
// src/components/ui/DialogActionButtons.tsx
// Internal helper — callers typically use ConfirmDialog or FormDialog instead.

type DialogActionButtonsProps = {
  /** Cancel button label. Defaults to "Cancel". */
  readonly cancelLabel?: string;
  /** Primary action button label. */
  readonly confirmLabel: string;
  /** Primary button MUI color. Defaults to "primary". */
  readonly confirmColor?: 'error' | 'primary' | 'warning';
  /** Called when cancel is clicked. */
  readonly onCancel: () => void;
  /** Called when the primary action is clicked. */
  readonly onConfirm: () => void;
  /** Disables the primary button (e.g., while saving). */
  readonly confirmDisabled?: boolean;
};
```

All buttons enforce `minHeight: 44` and `minWidth: 44` internally. Callers must not add touch-target `sx` props on top.

---

## Export barrel

```typescript
// src/components/ui/index.ts
export { ConfirmDialog } from './ConfirmDialog';
export { DialogActionButtons } from './DialogActionButtons';
export { FormDialog } from './FormDialog';
```

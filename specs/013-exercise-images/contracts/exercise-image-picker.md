# Contract: ExerciseImagePicker

**Feature**: 013-exercise-images  
**Component**: `src/routes/exercises/Exercise/ExerciseImagePicker/index.tsx`

## Purpose

A modal dialog that lets users search and select one image from the bundled exercise image library (1,324 entries). Used from `ExerciseForm` for both create and edit flows.

## Props Interface

```ts
export type ExerciseImagePickerProps = {
  readonly open: boolean;
  readonly currentFilename: string | null;
  readonly onSelect: (filename: string | null) => void;
  readonly onClose: () => void;
};
```

| Prop | Type | Description |
|---|---|---|
| `open` | `boolean` | Controls Dialog visibility |
| `currentFilename` | `string \| null` | Pre-selects the currently assigned image (shown with a highlight); `null` for no selection |
| `onSelect` | `(filename: string \| null) => void` | Called when user confirms a selection or clears the image. Pass `null` to clear. |
| `onClose` | `() => void` | Called when the dialog is dismissed without confirming |

## Behaviour

1. On open: load `exercise-catalog.json` (static import, already in memory). Pre-highlight `currentFilename` if set. Focus the search input.
2. Search: debounce 200ms. Filter catalog by `name`, `target`, and `category` fields (case-insensitive substring match). Display filtered count.
3. Grid: responsive CSS grid (`grid-template-columns: repeat(auto-fill, minmax(80px, 1fr))`). Each cell is a 72px `Avatar` with the image and a small name label beneath. Selected cell has a visible border highlight.
4. Confirm button: enabled when any image is highlighted (including the pre-selected one). Calls `onSelect(filename)`.
5. Clear button: calls `onSelect(null)` — removes the image association. Only visible if `currentFilename` is set.
6. Cancel / dialog close: calls `onClose()` without calling `onSelect`.

## Layout

```
┌─────────────────────────────────────────────┐
│ Select exercise image              [×]       │
│─────────────────────────────────────────────│
│ 🔍 [Search by name, muscle group…          ]│
│   Showing 42 of 1324                        │
│─────────────────────────────────────────────│
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│ │ img  │ │ img  │ │*img* │ │ img  │  ← grid │
│ │bench │ │squat │ │curl  │ │dips  │         │
│ └──────┘ └──────┘ └──────┘ └──────┘         │
│  … (scrollable)                             │
│─────────────────────────────────────────────│
│              [Clear]    [Cancel]  [Select]  │
└─────────────────────────────────────────────┘
```

## Constraints

- Dialog max-height: `80vh`; grid box is scrollable, header and footer are sticky.
- Touch targets: each grid cell ≥ 72×72 CSS px (satisfies Principle VI ≥ 44px).
- No network requests: all images served from `/exercises/` (static assets).
- `loading="lazy"` on grid images to avoid loading all 1,324 at once.
- Component is purely presentational: no DB access, no direct imports from `@/database`.

## Integration in ExerciseForm

```tsx
// ExerciseForm/index.tsx (simplified)
const [pickerOpen, setPickerOpen] = useState(false);

<ExerciseImagePicker
  currentFilename={watch('imageFilename') ?? null}
  onClose={() => setPickerOpen(false)}
  onSelect={(filename) => {
    setValue('imageFilename', filename);
    setPickerOpen(false);
  }}
  open={pickerOpen}
/>
```

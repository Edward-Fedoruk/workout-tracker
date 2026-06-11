# Feature Specification: Exercise Images (illustrated exercise library)

**Feature Branch**: `013-exercise-images`
**Created**: 2026-06-10
**Status**: Draft
**Input**: User description: "get all images from here hasaneyldrm/exercises-dataset / add it to our repo / check our default set of exercises / match image to exercise / ON each exercise in exercise list add to the left of the record line circled image with the exercise / add capability to select image from the list when adding new exercise"

## Clarifications

### Session 2026-06-10

- Q: How to handle the dataset's non-commercial license? → A: Proceed with **hasaneyldrm/exercises-dataset** as a personal/non-commercial app, accepting the license restriction (no commercial use; media owned by third parties). Risk is acknowledged if the app is ever distributed commercially.
- Q: How much imagery to bundle? → A: Bundle the **full image library (~1,324 images)** so the picker offers everything; rely on search to make a large library usable.

### Session 2026-06-11

- Q: Where in `public/` should the bundled exercise images be placed? → A: `public/exercises/` — flat directory, runtime URL `/exercises/<filename>.jpg`.
- Q: What column name stores the image reference on the `exercise` table? → A: `image_filename` — nullable TEXT, stores just the filename (e.g. `0001-2gPfomN.jpg`); the `/exercises/` prefix is added at render time.
- Q: Two mapping corrections: Abs was matched to a full sit-up; Rear Delt Pec Deck was matched to a dumbbell fly. → A: Abs → `0274` crunch floor (`0274-TFqbd8t.jpg`); Rear Delt Pec Deck → `0602` lever seated reverse fly (`0602-myfUsKf.jpg`).
- Q: How should the default-exercise → image mapping be sourced and delivered? → A: Use `exercises-dataset/data/exercises.json` (fields: `id`, `name`, `target`, `category`, `image`) as the lookup source. The mapping for all 24 default exercises has been curated from this file and is recorded in FR-015. It is applied via an additive `UPDATE` in a new Drizzle migration that sets `image_filename` on each default exercise row by name.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recognize exercises by a circled image in the list (Priority: P1)

A person opens the Exercise Library. Each exercise row now shows a small circular image to the left of the exercise name, illustrating the movement. The built-in (default) exercises already have a matched image, so the list is immediately more scannable and recognizable than a wall of text.

**Why this priority**: This is the primary, visible payoff — every user sees it on the main exercise screen with zero extra effort. It delivers value even before the image-picker (US2) exists, because the default exercises ship pre-matched.

**Independent Test**: Open the Exercise Library on a fresh install. Confirm each default exercise (e.g. "Bench Press", "Barbell Squat") displays a circular image at the left of its row, and exercises without a matched image fall back to a clear placeholder rather than a broken/empty slot.

**Acceptance Scenarios**:

1. **Given** the app's default exercises are loaded, **When** the user views the Exercise Library, **Then** each default exercise that has a matched image shows that image in a circular frame at the left of the row, before the name.
2. **Given** an exercise that has no associated image, **When** the user views its row, **Then** a neutral placeholder (e.g. initials or a generic exercise glyph) appears in the same circular frame — never a broken image.
3. **Given** the app is offline (installed PWA), **When** the user views the Exercise Library, **Then** all exercise images still display (they are available locally, not fetched from the internet at view time).

---

### User Story 2 - Choose an image when adding or editing an exercise (Priority: P2)

When a user adds a new exercise (or edits an existing one), they can pick an illustrative image for it from the bundled image library. They can search/browse the library, select one, and it is saved with the exercise and then shown in the list (US1). Picking an image is optional — an exercise can be saved without one.

**Why this priority**: Extends the value of US1 to user-created (custom) exercises, which otherwise can't be auto-matched because their names are free text. Depends on the library existing but is independently testable.

**Independent Test**: Open "Add Exercise", search the image library, select an image, save, and confirm the new exercise appears in the list with the chosen circular image. Repeat for "Edit Exercise" to change or remove an image.

**Acceptance Scenarios**:

1. **Given** the Add Exercise form, **When** the user opens the image selector, **Then** they can browse and search the available images and pick one.
2. **Given** an image has been selected, **When** the user saves the exercise, **Then** the exercise is stored with that image and the list row shows it.
3. **Given** the Edit Exercise form for an exercise with an image, **When** the user changes or clears the image and saves, **Then** the list reflects the new selection (including reverting to the placeholder when cleared).
4. **Given** the user saves an exercise without choosing an image, **When** it appears in the list, **Then** it shows the placeholder and no error is raised (image is optional).

---

### Edge Cases

- **Unmatched default exercise**: If a default exercise name has no good match in the dataset, it ships with no image and shows the placeholder (it can be matched later via Edit).
- **Custom exercise name with no obvious match**: The user picks an image manually; nothing is auto-assigned.
- **Large image library in the picker**: The selector must stay responsive when browsing a large number of images (search/filter so the user isn't forced to scroll a huge grid).
- **Offline use**: Images must render with no network (bundled with the app and covered by the existing offline/installed-app behavior).
- **App download size**: Bundling images increases the installable app size; the amount of imagery included is a bounded, deliberate decision (see Clarifications / Assumptions).
- **Deleting an exercise**: Removing an exercise does not need to remove any shared image asset; the asset library is independent of individual exercise records.
- **Duplicate/visual mismatch**: A user may pick an image that doesn't perfectly depict their exercise; the image is illustrative only and does not affect logging.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST include a library of exercise illustration images that is available locally (works offline once installed).
- **FR-002**: The system MUST allow each exercise to have at most one associated illustrative image, and MUST treat the image as optional.
- **FR-003**: The built-in default exercises MUST ship pre-matched to an appropriate image from the library wherever a reasonable match exists.
- **FR-004**: The Exercise Library list MUST display each exercise's image in a circular frame positioned at the left of the row, before the name.
- **FR-005**: When an exercise has no associated image, the list MUST show a consistent placeholder in the same circular frame (no broken or empty image).
- **FR-006**: When adding a new exercise, the user MUST be able to select an image for it from the bundled image library, including the ability to search/browse that library.
- **FR-007**: When editing an existing exercise, the user MUST be able to change or remove its image.
- **FR-008**: An exercise's image association MUST persist across app restarts (it is part of the saved exercise, like its name and muscle groups).
- **FR-009**: Adding the image library MUST NOT break the installed/offline experience (the app remains installable and usable without a network).
- **FR-010**: The image attached to an exercise is illustrative only and MUST NOT affect workout logging, calculations, or any existing exercise behavior.
- **FR-011**: The app MUST bundle the full image library (~1,324 images) from the dataset so the image picker can offer every image; because the library is large, the picker MUST provide search/filtering so users are not required to scroll the entire set.
- **FR-012**: The source imagery is the hasaneyldrm/exercises-dataset, used under its educational/non-commercial license; the app is treated as a personal/non-commercial project. The dataset's license/attribution MUST be retained in the repository (e.g. a LICENSE/credits note) alongside the bundled assets.
- **FR-013**: The 1,324 `.jpg` files from `exercises-dataset/images/` MUST be copied into `public/exercises/` as a one-time setup step (e.g. `cp exercises-dataset/images/*.jpg public/exercises/`). The cloned `exercises-dataset/` directory MUST be added to `.gitignore`; only the copied files under `public/exercises/` are committed to the app repository. The copy step MUST be documented in the project README so it can be reproduced on a fresh clone. `exercises-dataset/data/exercises.json` serves as the lookup source for matching; it does not need to be committed to the app repo.
- **FR-014**: The `exercise` table MUST gain a nullable TEXT column `image_filename` via an additive Drizzle migration. It stores the bare filename (e.g. `0001-2gPfomN.jpg`); the runtime prepends `/exercises/` to form the asset URL. A second statement in the same migration MUST apply the curated mapping below via `UPDATE exercise SET image_filename = '<filename>' WHERE name = '<exercise name>'` for each pre-matched default exercise.
- **FR-015**: The curated default-exercise → image mapping (derived from `exercises-dataset/data/exercises.json`) is:

  | Exercise name (DB) | Dataset entry | `image_filename` |
  |---|---|---|
  | Abs | `0274` crunch floor | `0274-TFqbd8t.jpg` |
  | Chin-up | `1326` chin-up | `1326-T2mxWqc.jpg` |
  | Barbell Squat | `0043` barbell full squat | `0043-qXTaZnJ.jpg` |
  | Bench Press | `0025` barbell bench press | `0025-EIeI8Vf.jpg` |
  | Cable Curl (rope) | `0868` cable curl | `0868-G08RZcQ.jpg` |
  | Cable Lateral Raise | `0178` cable lateral raise | `0178-goJ6ezq.jpg` |
  | Cable Pushdown (rope) | `0200` cable pushdown (with rope attachment) | `0200-dU605di.jpg` |
  | Cable Row | `0861` cable seated row | `0861-fUBheHs.jpg` |
  | Close Grip Bench Press | `0030` barbell close-grip bench press | `0030-J6Dx1Mu.jpg` |
  | Dumbbell Lateral Raise | `0334` dumbbell lateral raise | `0334-DsgkuIt.jpg` |
  | Dips | `0251` chest dip | `0251-9WTm7dq.jpg` |
  | Dumbbell Overhead Press | `0426` dumbbell standing overhead press | `0426-A6wtbuL.jpg` |
  | Dumbbell RDL | `1459` dumbbell romanian deadlift | `1459-rR0LJzx.jpg` |
  | Hack Squat Machine | `0743` sled hack squat | `0743-Qa55kX1.jpg` |
  | Hammer Curl | `0313` dumbbell hammer curl | `0313-slDvUAU.jpg` |
  | Incline Press Machine | `1299` lever incline chest press | `1299-jHAnWmT.jpg` |
  | Lat Pull Down | `2330` cable lat pulldown full range of motion | `2330-LEprlgG.jpg` |
  | Leg Curl Machine | `0599` lever seated leg curl | `0599-Zg3XY7P.jpg` |
  | Leg Extension Machine | `0585` lever leg extension | `0585-my33uHU.jpg` |
  | Rear Delt Pec Deck | `0602` lever seated reverse fly | `0602-myfUsKf.jpg` |
  | Reverse Curl | `0080` barbell reverse curl | `0080-xNrS20v.jpg` |
  | Seated Calf Machine | `0594` lever seated calf raise | `0594-bOOdeyc.jpg` |
  | Seated Row | `0180` cable low seated row | `0180-hvV79Si.jpg` |
  | Wrist Curl | `0126` barbell wrist curl | `0126-82LxxkW.jpg` |

  All 24 default exercises are mapped; 0 left as placeholder at migration time.

### Key Entities *(include if data involved)*

- **Exercise** (existing): Gains a new nullable TEXT column `image_filename` (e.g. `0001-2gPfomN.jpg`). At render time the app prepends `/exercises/` to form the URL. All other attributes (name, classification, muscle groups) are unchanged.
- **Exercise Image**: A bundled illustration depicting an exercise/movement, identified by a stable reference and associated with descriptive info (e.g. the movement/target it depicts) used to match and search. Sourced from the external dataset.
- **Image Library**: The browseable collection of Exercise Images that the picker (US2) draws from and that default exercises are matched against (US1).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 80% of the 24 default exercises display a correctly matched image on a fresh install (the remainder show the placeholder, not a broken image).
- **SC-002**: Every exercise row in the library shows either an image or the placeholder — 0 broken/empty image slots.
- **SC-003**: A user can find and select an image for a new exercise in under 30 seconds, using search rather than scrolling the entire library.
- **SC-004**: All exercise images render with the device offline (installed app), 100% of the time.
- **SC-005**: Despite bundling the full library, the installed app still installs and launches successfully and the image picker opens and is searchable without noticeable lag (a large library is made usable via search, not by capping the count).
- **SC-006**: Existing workout-logging flows are unaffected — exercise selection, set entry, and eRM behavior are identical to before the change.

## Assumptions

- "Images" means the dataset's **static thumbnail images**, not the animated GIFs (the user said "image"; GIFs are out of scope unless requested).
- Images are bundled as **app assets** under `public/exercises/` and referenced from exercise records by `image_filename` (bare filename, e.g. `0001-2gPfomN.jpg`). The image *files* are not stored inside the SQLite database — only the filename reference is (consistent with the app's local-first data model, where binary build assets are treated like other static resources). The runtime URL is `/exercises/<image_filename>`.
- The default-exercise → image matching is a **one-time, build-time mapping** (assisted by name/target matching, verified for sanity); it does not need to run at app runtime.
- For **custom exercises**, there is no automatic matching — the user picks an image manually (their names are free text).
- The image is **decorative/illustrative**; it carries no logging semantics.
- Existing offline/PWA behavior (service worker caching of app assets) is reused to keep images available offline; no new persistence layer is introduced for app data.

## Out of Scope

- Animated GIF/video previews of exercises.
- Auto-matching images to arbitrary user-created exercise names.
- Per-image attribution UI, image editing, or user-uploaded custom images (only selecting from the bundled library is in scope).
- Any change to workout logging, routines, or eRM behavior.

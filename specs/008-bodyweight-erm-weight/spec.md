# Feature Specification: Persisted eRM & Optional Weight Entry

**Feature Branch**: `008-bodyweight-erm-weight`
**Created**: 2026-05-31
**Status**: Draft
**Input**: User description: "When user logs a workout or fills in a routine entry, they should be able to leave weight empty or set it to 0. When they do it for assisted or bodyweight exercises, their weight should be used for erm calculations. They should get an error if weight isn't set. Also, user's weight may change with time, so calculated erm need to be persisted in the database for each logged exercise."

## Clarifications

### Session 2026-05-31

- Q: When a set is edited, which body weight is used to recalculate eRM — current body weight or the body weight at original log time? → A: Current body weight at the time of the edit.
- Q: Should a blank weight field in a routine entry be stored as null or 0? → A: null — blank is explicitly absent, distinguishable from a user-entered 0.
- Q: Should pre-existing sets (logged before this feature ships) be backfilled with eRM on migration, or show a placeholder permanently? → A: No backfill — placeholder is acceptable; backfilling with current body weight would produce inaccurate historical values.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Log a bodyweight set with no added weight (Priority: P1)

As a lifter doing pull-ups or push-ups, I want to log a set without entering any weight (or entering 0), so the app automatically uses my recorded body weight to compute eRM without forcing me to type my body weight each time.

**Why this priority**: This is the core quality-of-life improvement. The current model forces the user to think about what weight to enter for bodyweight reps; this story makes the intended zero-weight path explicit and ergonomic.

**Independent Test**: With body weight set to 80 kg and "Pull-up" classified as body-weight, log a set leaving the weight field empty (or entering 0) × 6 reps. The stored set and displayed eRM use an effective weight of 80 kg; eRM ≈ 96 kg.

**Acceptance Scenarios**:

1. **Given** a body-weight exercise is selected in the workout log, **When** the user leaves the weight field blank or enters 0 and submits the set, **Then** the set is accepted without a validation error.
2. **Given** body weight is set to 80 kg and a body-weight exercise, **When** the user logs a set with empty/0 weight × 6 reps, **Then** the stored eRM is calculated as 80 × (1 + 6/30) ≈ 96 kg.
3. **Given** the same scenario as above but for an assisted exercise (e.g., assisted dip with 0 or empty assistance), **When** the set is submitted, **Then** effective weight equals body weight and eRM is computed accordingly.

---

### User Story 2 - Body weight not set: error on submission (Priority: P2)

As a lifter who has not yet recorded their body weight, I want a clear error when I try to log a bodyweight or assisted exercise with empty/0 weight, so I understand why eRM cannot be calculated and know what to do.

**Why this priority**: Without this guardrail, users would either get a silent incorrect eRM (using 0) or a confusing placeholder. An explicit error pointing to the Settings page is the minimum respectful experience.

**Independent Test**: With body weight NOT set, select "Pull-up" (body-weight exercise), leave weight blank, and submit. An error message appears directing the user to set their body weight in Settings. The set is not saved.

**Acceptance Scenarios**:

1. **Given** body weight is not set in Settings and a body-weight exercise is selected, **When** the user submits a set with empty or 0 weight, **Then** the submission is blocked with a clear error message indicating body weight must be set.
2. **Given** the same error state, **When** the user follows the error guidance and sets their body weight in Settings, **Then** they can re-submit the set without error.
3. **Given** body weight is not set but the exercise is standard-classified, **When** the user enters a positive weight and submits, **Then** no body-weight-related error appears (standard exercises are unaffected).

---

### User Story 3 - Persisted eRM reflects body weight at time of logging (Priority: P3)

As a lifter whose body weight changes over time, I want the eRM stored for each logged set to reflect my body weight at the moment I logged it, so that historical eRM values remain accurate even after I update my body weight.

**Why this priority**: This is the architectural change relative to the previous feature (007-erm-bodyweight), which computed eRM on-the-fly from the current body weight. As body weight changes, on-the-fly eRM for past sessions becomes incorrect. Persisting eRM at log time makes history reliable.

**Independent Test**: Log a pull-up set at body weight 80 kg → eRM stored as 96 kg. Then update body weight to 85 kg. Revisit the historical set — it still shows 96 kg (the value at time of logging), not a recalculated value.

**Acceptance Scenarios**:

1. **Given** body weight is 80 kg, **When** a body-weight exercise set is logged, **Then** the eRM is calculated and stored in the database for that set.
2. **Given** an eRM has been stored for a historical set, **When** the user later updates their body weight, **Then** the historical set's eRM does not change.
3. **Given** a standard exercise set is logged, **When** the set is saved, **Then** eRM is also stored (using only the logged weight, same as before, but now persisted rather than derived).
4. **Given** a set's weight or reps are edited, **When** the edit is saved, **Then** the stored eRM is recalculated and updated using the current body weight at the time of the edit.

---

### User Story 4 - Routine entry allows empty/zero weight for bodyweight exercises (Priority: P4)

As a lifter setting up a routine with bodyweight movements, I want to be able to leave the weight field blank or enter 0 in a routine entry for body-weight or assisted exercises, so the routine reflects the intended "use my body weight" intent.

**Why this priority**: Routines are templates; the same empty-weight logic that applies to logging should apply to routine setup. Without this, users must enter a placeholder value they will have to change every session.

**Independent Test**: Create a routine entry for "Push-up" (body-weight) with empty weight. Save the routine. Start a workout from that routine — the Push-up entry shows empty/0 weight and, when logged, uses body weight for eRM.

**Acceptance Scenarios**:

1. **Given** a body-weight or assisted exercise is added to a routine, **When** the user leaves the weight field blank or enters 0 and saves, **Then** the routine entry is saved without a validation error.
2. **Given** a routine entry has an empty/0 weight for a body-weight exercise, **When** the user starts a workout from that routine, **Then** the set entry is pre-populated with empty/0 weight and follows the same body-weight-aware eRM rules as manual logging.
3. **Given** a routine entry with an empty/0 weight for a standard exercise, **When** the user saves the routine, **Then** the app prompts or rejects — standard exercises still require a positive weight.

---

### Edge Cases

- **Empty weight on a standard exercise**: Rejected with a "weight required" validation error. Standard exercises must have a positive weight.
- **Assisted exercise with explicitly negative weight AND body weight not set**: Blocked with a body-weight-not-set error (same as empty/0 weight case, since effective weight depends on body weight).
- **Set edited after body weight update**: eRM is recalculated with the body weight current at edit time (not the original log-time body weight), and the new value overwrites the stored eRM. This is the documented, intentional behavior.
- **eRM storage when effective weight ≤ 0** (e.g., high machine assistance): eRM cannot be computed; a null/no-value is stored and the UI shows a placeholder.
- **Body weight set to a value that makes effective weight ≤ 0 for an existing assisted set**: Displayed as placeholder; the stored eRM is not retroactively recomputed for historical sets.

## Requirements *(mandatory)*

### Functional Requirements

**Weight entry relaxation**

- **FR-001**: For body-weight-classified exercises, System MUST accept an empty or zero weight entry in both workout logging and routine editing; this represents "unweighted body-weight reps."
- **FR-002**: For assisted-classified exercises, System MUST accept an empty or zero weight entry; this represents "full body weight, no machine assistance."
- **FR-003**: For standard-classified exercises, System MUST continue to require a positive (> 0) weight value; empty or zero is rejected with a validation error.

**Body weight requirement and error handling**

- **FR-004**: When a user submits a set for a body-weight or assisted exercise with an empty or zero weight AND body weight is not recorded in Settings, System MUST block the submission and display a clear error directing the user to set their body weight.
- **FR-005**: When body weight IS recorded, submitting a body-weight or assisted exercise with empty or zero weight MUST succeed and use body weight as the effective weight for eRM.

**eRM persistence**

- **FR-006**: System MUST calculate and store the eRM value in the database at the moment a set is first saved (logged).
- **FR-007**: System MUST store eRM as a nullable value: null when it cannot be computed (effective weight ≤ 0, or body weight absent); a decimal value otherwise.
- **FR-008**: When a previously logged set is edited (weight or reps changed), System MUST recalculate and overwrite the stored eRM using the body weight currently saved in Settings at the moment the edit is saved. This is intentional: the original body weight at log time is not stored per-set, and using the current value keeps the data model simple.
- **FR-009**: System MUST NOT retroactively recompute stored eRM for historical sets when the user updates their body weight in Settings; historical eRM values remain as stored.
- **FR-010**: System MUST display the stored eRM for each set; it MUST NOT recompute eRM from current body weight at display time for standard sets or previously logged body-weight sets.

**Routine entries**

- **FR-011**: Routine entries for body-weight and assisted exercises MUST accept empty or zero weight; this is stored as the routine template and carries no eRM (eRM is only computed at log time).
- **FR-012**: When a workout is started from a routine that has an empty/zero-weight body-weight entry, System MUST pre-populate the set entry with empty/0 weight and apply body-weight eRM rules when the set is submitted.

### Key Entities *(include if feature involves data)*

- **Logged Set (updated)**: Each saved set now includes a stored `erm` field (nullable decimal). This is written on save and on edit; not recomputed from current state at display time.
- **Body Weight Setting**: Unchanged from 007 — a single current value. It is used at save/edit time to compute and persist eRM; after that, it has no ongoing effect on the stored eRM.
- **Routine Entry (updated)**: Weight field for body-weight and assisted exercises now accepts empty/0 as a valid stored value. No eRM field — routines are templates, not logged records.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can log a body-weight or assisted set with empty or zero weight in under 5 seconds with no extra steps when body weight is already set.
- **SC-002**: After body weight is updated in Settings, zero previously logged body-weight/assisted sets have their stored eRM changed (history is immutable after initial save).
- **SC-003**: 100% of newly logged sets have a stored eRM value (or an explicit null), with no set having a missing/undefined eRM field.
- **SC-004**: A user who has not set body weight receives an error within one submission attempt and is directed to Settings; no invalid set is stored.
- **SC-005**: Editing a set recalculates and persists the updated eRM in a single save action, with no extra steps for the user.

## Assumptions

- **Builds on 007-erm-bodyweight**: This feature assumes the exercise classification model (standard / bodyweight / assisted) and the Settings page body weight entry introduced in 007 are already present. It does not redesign those — it extends their behavior.
- **eRM formula unchanged**: Epley formula only (`eRM = effective_weight × (1 + reps / 30)`), same as 007.
- **"Empty weight" (null) and "0" are treated the same at calculation time** for body-weight and assisted exercises: both mean "use body weight as the full load." However, they are stored distinctly — a blank field is stored as `null`, and a user-typed `0` is stored as `0`. The UI displays both as blank/empty to the user, but the distinction is available to the data layer if needed.
- **eRM persistence scope**: Only newly logged and edited sets get persisted eRM. Already-logged sets from before this feature is deployed will not have eRM values; the UI treats a missing eRM field the same as a null (shows placeholder).
- **No retroactive backfill**: Existing logged sets will not be backfilled with eRM at deploy time or on app load. The body weight at original log time is unknown for historical sets, so any backfilled value would be inaccurate. Pre-existing sets permanently show a placeholder, which is honest and intentional.
- **Routine entries do not store eRM**: Routines are planning templates; eRM is only meaningful for actual logged records.
- **Body weight unit**: Kilograms only, same as 007.

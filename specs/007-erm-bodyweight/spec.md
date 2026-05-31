# Feature Specification: Estimated 1-Rep Max (eRM) & Body Weight Settings

**Feature Branch**: `007-erm-bodyweight`
**Created**: 2026-05-29
**Status**: Draft
**Input**: User description: "For each logged exercise, the app must calculate eRM using Epley formula. The user should be able to enter and edit their body weight at will. Body weight should be accounted for in free weight exercises (the ones labeled 'assisted', 'body weight', 'bw'). There's also an edge case for assisted exercises, where the weight can be negative. Implement a dedicated settings page where user can enter their body weight."

## Clarifications

### Session 2026-05-29

- Q: Should body weight input accept decimal values, and if so, to what precision? → A: Decimal, 2 decimal places (e.g., 75.25 kg).
- Q: How is body weight saved on the Settings page — explicit Save button or auto-save? → A: Explicit Save button; value only persists on deliberate user action.
- Q: Should eRM appear in any view beyond the per-set workout log (e.g., exercise history, routine view)? → A: Workout log only; eRM is not shown in any other view.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See eRM for every logged set (Priority: P1)

As a lifter logging straight-bar work (bench, squat, deadlift, OHP), I want each set in my workout log to show an estimated 1-Rep Max so I can track strength progress without doing true 1RM tests.

**Why this priority**: This is the headline value of the feature. It applies to the majority of logged sets (standard barbell/dumbbell work that ignores body weight) and is fully usable with no other configuration. Without it, the rest of the feature has no purpose.

**Independent Test**: Log a set of bench press at 100 kg × 5 reps. The set displays an eRM of ~116.7 kg next to it (100 × (1 + 5/30)). No body weight or exercise classification is required.

**Acceptance Scenarios**:

1. **Given** an exercise classified as standard (the default), **When** the user logs a set of 100 kg × 5 reps, **Then** the workout log shows an eRM of ~116.7 kg for that set.
2. **Given** an exercise classified as standard, **When** the user logs a set of 80 kg × 1 rep, **Then** the eRM equals the logged weight (80 kg), because a true 1-rep set is its own 1RM.
3. **Given** a workout with multiple sets of the same exercise, **When** the user views the log, **Then** each set displays its own eRM.
4. **Given** a set is edited (weight or reps changed), **When** the change is saved, **Then** the displayed eRM updates immediately to reflect the new values.

---

### User Story 2 - Enter and edit body weight in a settings page (Priority: P2)

As a lifter, I want a dedicated settings page where I can record my current body weight and update it whenever it changes, so the app can incorporate it into calculations.

**Why this priority**: This is the foundation for body-weight-aware eRM (Story 3) but also has standalone value as a recorded data point. It is small in scope and can be shipped before Story 3 ships.

**Independent Test**: Navigate to the settings page from the app's main navigation, enter "75" into the body weight field, save, reload the app, and confirm the value still reads "75 kg".

**Acceptance Scenarios**:

1. **Given** the user is on any page of the app, **When** they open the main navigation, **Then** they see a clearly labeled "Settings" entry that opens the settings page.
2. **Given** body weight has never been set, **When** the user opens settings, **Then** the body weight field is empty (or shows a clear "not set" state) and is editable.
3. **Given** the user types a valid positive decimal number (up to 2 decimal places) into the body weight field, **When** they press the Save button, **Then** the value is persisted locally and displayed on the settings page after a reload.
4. **Given** body weight is already set to 75 kg, **When** the user changes the field to 73 kg and presses Save, **Then** subsequent views read 73 kg.
5. **Given** the user enters an invalid value (zero, negative, non-numeric, more than 2 decimal places, or absurdly large), **When** they press Save, **Then** the app rejects the input with a clear validation message and the previously saved value is preserved.
6. **Given** the user edits the body weight field but has not yet pressed Save, **When** they navigate away from the Settings page, **Then** the unsaved change is discarded and the previously saved value remains.

---

### User Story 3 - eRM for body-weight and assisted exercises (Priority: P3)

As a lifter doing pull-ups, dips, and assisted variants, I want eRM that accounts for my own body weight (added to the load on body-weight exercises, subtracted on assisted machines) so the number reflects the actual load my body moved.

**Why this priority**: This is the most nuanced part of the feature. It depends on both Story 1 (eRM calculation infrastructure) and Story 2 (a recorded body weight) and adds the most edge cases (assisted machines, negative weight, missing body weight). It is the last slice to ship but is the reason a user with mixed training would want this feature at all.

**Independent Test**: With body weight set to 75 kg and an exercise "Pull-up" classified as "body weight", log a set of +10 kg × 5 reps. The displayed eRM is calculated from an effective weight of 85 kg (75 + 10), giving ~99.2 kg.

**Acceptance Scenarios**:

1. **Given** body weight is 75 kg and "Pull-up" is classified as a body-weight exercise, **When** the user logs 0 kg × 8 reps (unweighted), **Then** the eRM is calculated using an effective weight of 75 kg.
2. **Given** body weight is 75 kg and "Pull-up" is classified as a body-weight exercise, **When** the user logs +20 kg × 3 reps (weighted), **Then** the eRM is calculated using an effective weight of 95 kg (75 + 20).
3. **Given** body weight is 75 kg and "Assisted Pull-up" is classified as an assisted exercise, **When** the user logs -30 kg × 6 reps (30 kg of machine assistance), **Then** the system accepts the negative value and calculates eRM using an effective weight of 45 kg (75 + (-30)).
4. **Given** an assisted exercise, **When** the user enters a negative weight, **Then** the input is accepted without an "invalid weight" error (the existing positive-only weight rule does not apply here).
5. **Given** body weight has never been set, **When** a body-weight or assisted exercise is logged, **Then** the eRM cell shows a placeholder (e.g., "—" or a "Set body weight" hint) instead of an incorrect number, while the set itself still saves normally.
6. **Given** the user updates body weight in settings, **When** they return to the workout log, **Then** eRM values for body-weight and assisted exercises reflect the new body weight.

---

### Edge Cases

- **Body weight not set, body-weight/assisted exercise logged**: eRM displays a placeholder rather than computing with an implicit zero. The set itself is still saved.
- **Assisted machine assistance ≥ body weight** (effective weight ≤ 0): eRM is undefined and displays a placeholder; the set is still saved as logged.
- **Body weight edited after sets have been logged**: eRM values displayed for past body-weight/assisted sets recompute live using the new body weight. This is the documented behavior, not a bug; it is called out in Assumptions.
- **Standard exercise with very high reps (e.g., 20+)**: Epley is still applied; the user accepts the known accuracy degradation at high rep ranges. No warning is shown.
- **Single-rep set**: eRM equals the logged effective weight exactly (Epley collapses to weight × 1).
- **Exercise classification not set on a custom exercise**: defaults to "standard" (no body-weight contribution, weight must be positive — existing behavior is unchanged).
- **Body weight entered with unrealistic value** (e.g., 0, negative, or > 500 kg): rejected at the settings input layer with a validation message.
- **Switching an exercise's classification after sets exist**: previously logged sets remain stored as-is; their displayed eRM recomputes under the new classification on next view. Negative-weight sets logged under "assisted" remain stored even if the exercise is later reclassified as standard; they will simply display a placeholder rather than an eRM under standard rules.

## Requirements *(mandatory)*

### Functional Requirements

**eRM calculation and display**

- **FR-001**: System MUST calculate eRM for every logged set using the Epley formula: `eRM = effective_weight × (1 + reps / 30)`.
- **FR-002**: System MUST display the eRM for each set in the workout log alongside the weight and reps for that set. eRM is shown in the workout log only; it does not appear in the routine view, exercise list, or any other view.
- **FR-003**: System MUST recompute and re-display eRM whenever the underlying set (weight or reps), body weight, or exercise classification changes.
- **FR-004**: When eRM cannot be computed (missing body weight on a body-weight/assisted exercise, or effective weight ≤ 0), System MUST display a clear non-numeric placeholder instead of a misleading value.

**Body weight management**

- **FR-005**: Users MUST be able to open a dedicated Settings page from the app's main navigation.
- **FR-006**: Users MUST be able to view, enter, and edit their current body weight on the Settings page via an explicit Save button; edits that are not saved MUST be discarded on navigation away.
- **FR-007**: System MUST persist the body weight locally so that it survives page reloads, app restarts, and offline usage.
- **FR-008**: System MUST validate body weight input as a positive decimal number with up to 2 decimal places (e.g., 75.25 kg), within reasonable human-bodyweight bounds, and reject invalid input with a clear message, leaving any previously saved value in place.
- **FR-009**: System MUST treat body weight as expressed in kilograms with up to 2 decimal places of precision, matching the existing weight unit convention used elsewhere in the app.

**Exercise classification**

- **FR-010**: System MUST allow each exercise to be classified as one of: standard, body weight (covering both "body weight" and "bw" labels), or assisted.
- **FR-011**: The exercise classification MUST be editable per exercise (during exercise creation and editing) and MUST default to "standard" for newly created exercises and for any existing exercise that has not been classified yet.

**Body-weight-aware effective weight**

- **FR-012**: For sets logged against a body-weight-classified exercise, System MUST compute the effective weight as `body_weight + logged_weight` (where `logged_weight` represents added weight, and `0` is a valid logged weight for unweighted reps).
- **FR-013**: For sets logged against an assisted-classified exercise, System MUST compute the effective weight as `body_weight + logged_weight`, where `logged_weight` is the negative value representing machine assistance.
- **FR-014**: For sets logged against a standard-classified exercise, System MUST compute the effective weight as the logged weight only (body weight is not added).

**Weight input rules**

- **FR-015**: For assisted-classified exercises, System MUST allow negative weight values to be entered, saved, and edited (the standard "weight must be positive" rule MUST NOT apply).
- **FR-016**: For standard-classified exercises, System MUST continue to require weight > 0. For body-weight-classified exercises, System MUST allow weight ≥ 0 (to permit unweighted reps).

### Key Entities *(include if feature involves data)*

- **Body Weight Setting**: A single, user-editable value representing the user's current body weight in kilograms, stored with up to 2 decimal places of precision (e.g., 75.25 kg). There is exactly one such value per app installation; it has no history.
- **Exercise Classification**: An attribute attached to each exercise that determines how the logged weight is combined with body weight for eRM. Values: `standard`, `bodyweight`, `assisted`. Each exercise has exactly one classification at a time.
- **Estimated 1-Rep Max (eRM)**: A derived (not stored) per-set metric. Computed from the set's reps, the set's logged weight, the exercise's classification, and the current body weight setting. Always recomputed on display; never persisted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For every logged set against a standard exercise, an eRM value is displayed (100% coverage), with no user setup required.
- **SC-002**: A new user can locate the Settings page, enter their body weight, and save it in under 30 seconds starting from the app's home view.
- **SC-003**: Body weight survives a full app reload, browser restart, and offline session (same persistence guarantee as workout data).
- **SC-004**: A user can log a set of assisted pull-ups with a negative weight value (e.g., -30 kg) without an input validation error.
- **SC-005**: For a set against a body-weight or assisted exercise, the displayed eRM reflects the current body weight setting within one user action of saving a new body weight (i.e., next view of the log shows updated values).
- **SC-006**: For body-weight or assisted sets where eRM cannot be computed (body weight unset, or effective weight ≤ 0), zero misleading numeric values are shown — only placeholders.

## Assumptions

- **Unit**: Body weight is in kilograms, consistent with how the existing app stores and displays set weights. A units feature is out of scope.
- **Single current body weight, no history**: There is exactly one body weight value. Editing it changes the value used by every eRM calculation, including those displayed against historical sets. The user accepts that historical body-weight/assisted eRMs reflect the *current* body weight, not the body weight at the time of the original workout. Per-session or time-series body weight tracking is out of scope for this feature.
- **Epley formula only**: The feature uses Epley exactly as the user specified. Alternative 1RM estimators (Brzycki, Lombardi, etc.) and user-configurable formulas are out of scope.
- **Classification covers the three named labels**: "body weight" and "bw" collapse to a single `bodyweight` classification (they refer to the same calculation rule). "assisted" is its own classification. There is no auto-detection from the exercise name — classification is set explicitly by the user per exercise.
- **Default classification is `standard`**: All existing exercises retain their current weight semantics until the user reclassifies them. This preserves backward compatibility with already-logged sets and existing exercise definitions.
- **eRM is derived, not stored**: eRM is computed on display from stored set data (weight, reps, classification, body weight). It is not written to the database. Changing classification or body weight does not require migrating set data.
- **Settings page is a new top-level destination**: It will be reachable from the main navigation. The page may host additional settings in the future, but for this feature its sole content is body weight.
- **Validation bounds**: Body weight accepts positive decimal values with up to 2 decimal places within a sane human range (the spec does not pin exact bounds; planning will pick reasonable limits, e.g., 20–500 kg).
- **Schema implication called out for planning**: The existing positive-only weight constraint on logged sets conflicts with FR-015 (negative weights for assisted exercises). The plan will need to relax this constraint while preserving the positive-weight rule for standard exercises at the application layer.

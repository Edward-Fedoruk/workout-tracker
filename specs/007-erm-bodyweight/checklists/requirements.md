# Specification Quality Checklist: Estimated 1-Rep Max (eRM) & Body Weight Settings

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-05-29
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Items marked incomplete require spec updates before `/speckit.clarify` or `/speckit.plan`.
- The spec uses informed assumptions instead of `[NEEDS CLARIFICATION]` markers. The two most consequential assumptions to revisit in clarify/plan are:
  1. **Body weight has no history** — a single mutable value is used for all eRM calculations, including historical sets. Per-session snapshots are out of scope.
  2. **Exercise classification is user-set, not auto-detected from name** — the `standard`/`bodyweight`/`assisted` value is explicitly chosen per exercise, default `standard`.
- The spec calls out a known conflict with the existing `weight > 0` constraint on `workout_set` (FR-015 needs negative weight for assisted exercises). This is flagged for the plan, not resolved in the spec.

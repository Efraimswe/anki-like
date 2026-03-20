<!--
  Sync Impact Report
  ==================
  Version change: 0.0.0 → 1.0.0
  Bump rationale: Initial constitution creation (MAJOR)

  Added principles:
    - I. Algorithm Correctness (SM-2)
    - II. Offline-First
    - III. Test-First
    - IV. Data Integrity
    - V. Critical Path UX
    - VI. Simplicity

  Added sections:
    - Technical Constraints
    - Development Workflow

  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ (no updates needed - Constitution Check section is generic)
    - .specify/templates/spec-template.md ✅ (no updates needed - structure compatible)
    - .specify/templates/tasks-template.md ✅ (no updates needed - phase structure compatible)
    - No command files exist

  Follow-up TODOs: none
-->

# Anki-Like Spaced Repetition System Constitution

## Core Principles

### I. Algorithm Correctness (SM-2)

The SM-2 spaced repetition algorithm is the product's core value proposition.
All scheduling logic MUST implement the SM-2 variant faithfully:
- Quality ratings map to: Again (0), Hard (2), Good (3), Easy (5)
- Ease factor MUST never drop below 1.3
- Interval calculations MUST follow the documented formula:
  `newInterval = interval * easeFactor`
- Card lifecycle phases (New, Learning, Review, Relearning) MUST be
  tracked and transitions enforced correctly
- Any algorithm change MUST be validated against known SM-2 reference
  outputs before merge

### II. Offline-First

The application MUST function fully without network connectivity.
- All card data, review state, and scheduling MUST be available locally
- Reviews MUST never be blocked by network availability
- Sync is an enhancement layered on top of local-first storage
- Conflict resolution strategy MUST be defined before any sync
  implementation begins

### III. Test-First

Tests MUST be written before implementation for all scheduling logic
and review state transitions.
- Red-Green-Refactor cycle enforced for algorithm code
- Edge cases in SM-2 (ease factor floor, interval overflow, phase
  transitions) MUST have dedicated test cases
- UI components MAY use test-after for layout/styling concerns

### IV. Data Integrity

Card state and review history are the user's most valuable data.
- ReviewState mutations MUST be atomic — partial updates are forbidden
- No operation MUST silently discard or corrupt review history
- Database schema changes MUST include migration scripts
- Deck/card deletion MUST be soft-delete or require explicit
  confirmation with data export option

### V. Critical Path UX

The review flow (show front → think → reveal → rate) is the
highest-priority user interaction.
- Review flow MUST load in under 200ms on target devices
- Card transitions MUST feel instant — no loading spinners during
  a review session
- Daily limits (new cards/day, reviews/day) MUST be enforced to
  prevent user burnout
- The four rating buttons (Again, Hard, Good, Easy) MUST always be
  visible and responsive after answer reveal

### VI. Simplicity

Start with the minimum viable feature set; resist premature complexity.
- Card types limited to Basic, Reverse, and Cloze for v1
- No plugin system, no scripting, no custom scheduling until core
  review loop is proven stable
- YAGNI: do not build sync, import/export, or statistics until the
  core review cycle is complete and validated
- Every new feature MUST justify its complexity against the core
  review experience

## Technical Constraints

- **Storage**: Local-first database (SQLite or IndexedDB depending on
  platform); server sync is a later phase
- **Card types**: Basic, Reverse, Cloze only in v1
- **Daily limits**: Configurable max new cards/day and max reviews/day;
  defaults MUST ship with sensible values (e.g., 20 new, 200 reviews)
- **Data models**: Deck, Card, and CardState (ReviewState) MUST be
  separate entities to allow independent evolution
- **Statistics**: Retention rate, reviews/day, time spent, and accuracy
  percentage are required metrics but are Phase 2 scope

## Development Workflow

- All PRs MUST pass existing tests before merge
- Algorithm changes require both unit tests and integration tests
  covering the full review flow
- Code review MUST verify compliance with this constitution's
  principles before approval
- Commits SHOULD be atomic and map to a single logical change

## Governance

This constitution is the authoritative reference for architectural and
design decisions in the Anki-Like project. All PRs and code reviews
MUST verify compliance with these principles.

Amendment procedure:
1. Propose change with rationale in a dedicated PR
2. Document which principles are affected
3. Update version using semantic versioning (MAJOR.MINOR.PATCH)
4. Update all dependent templates if principle names or requirements change

Versioning policy:
- MAJOR: Principle removed or fundamentally redefined
- MINOR: New principle added or existing principle materially expanded
- PATCH: Clarifications, wording fixes, non-semantic refinements

**Version**: 1.0.0 | **Ratified**: 2026-03-19 | **Last Amended**: 2026-03-19

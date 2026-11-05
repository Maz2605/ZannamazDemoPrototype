# Spirit Grove Blockers and Tutorial Implementation Plan

> Use superpowers:executing-plans inline in this session. User selected the proposal and authorized adding the feature. No Git repository exists; work in place without commits or worktrees.

**Goal:** Add one-way/rune constraints and a playable first-level tutorial.
**Architecture:** Board-derived constraints in the existing pure engine; presentation reads the same rule helpers. Tutorial state belongs only to the existing controller.
**Tech Stack:** Vanilla JavaScript/SVG/CSS, Node tests, existing optional bundled Playwright.
**Spec:** ../specs/2026-11-06-blockers-tutorial-design.md

## Global Constraints

- Preserve swipe direction and sensitivity, art layer order, 10 levels and Undo/Restart.
- No package installs; all changed levels need valid solutions and exact shortest paths.

## Review Focus

- Linked rotations validate both wheels before changing the board.
- Preview never calls a forbidden direction just to build its geometry.
- Rune locks close/reopen with state changes and Undo.
- Tutorial wrong input, skipping, Restart and keyboard all remain playable.
- Directed constraints invalidate naive reverse BFS and inverse-move hints.

## Tasks

1. [x] Add failing rule regression tests; implement rotation groups, move rejection, one-way/rune checks and data validation.
2. [x] Add authored constraints to levels 4–10 as appropriate; solve with forward BFS and replace solutions/par where necessary. Update Python validation to use legal directed moves.
3. [x] Render constraint/trigger badges and clear rejection messages; integrate legality with preview and hints. Add guided level-one tutorial with skip/reset and touch/keyboard support.
4. [x] Add browser acceptance scenarios, run Node/catalog/level validation, inspect screenshots of tutorial and blocker levels. Update module docs and report actual limits.

Verified: 26 Node tests; catalog/syntax checks; exact shortest paths for all 10 levels with both the production-engine Node solver and independent Python validator; 13 browser regression scenarios plus native mouse tests at 390px and in a 65% scaled iframe. Inspected tutorial, rune-lock and one-way screenshots. Self-reviewed rule/preview/lifecycle interactions. Level 6 uses seal [1,7,1] after rejecting unsolvable trigger configurations. Real-device touch/Safari and subjective difficulty remain unmeasured.

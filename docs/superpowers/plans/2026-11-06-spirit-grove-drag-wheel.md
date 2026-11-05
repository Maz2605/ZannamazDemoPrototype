# Spirit Grove Drag Wheel Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan in the current session. User approved the design and instructed implementation.

**Goal:** Replace tap arrows with direct circular dragging of four animals.
**Architecture:** A small pure gesture helper measures projected angles; the existing DOM controller owns pointer capture and preview. SVG art supplies the carousel and projected orbit; the engine remains unchanged.
**Tech Stack:** Existing dependency-free JavaScript, SVG, CSS, Node tests.
**Spec:** ../specs/2026-11-06-spirit-grove-drag-wheel-design.md

## Global Constraints

- No packages; preserve standalone entry and iframe paths.
- Preview capped at ±90°; commit at 30° with at least 12 CSS px travel; one move per release.
- Cancel restores state. Preserve locks, linked wheels, all ten levels and keyboard access.

## Review Focus

- Crossing ±180° must not reverse the gesture.
- Starting near or crossing the hub center must not create a sudden turn.
- Secondary pointers and capture loss must not commit moves.
- Level changes, Undo and Restart must clear preview.
- Linked wheels must preview and commit in opposite directions.

## Tasks

1. [x] Add failing Node tests for gesture thresholds, wrapping, reversal, dead zone and projected orbit endpoints; run and observe failures. Implement `G.Gesture.start`, `update`, `direction` and `G.Art.orbitPoint`; rerun tests.
2. [x] Replace SVG arrow buttons with hub, spokes and carousel track. Implement pointer capture on the stable board, preview via SVG transforms, cancellation and quarter-turn settling. Add controller regression tests for pointer ownership, locks, linked previews, lifecycle and keyboard input.
3. [x] Update entry script, styles, instructions, metadata and module documentation. Run Node suite, catalog validation and syntax checks. Use a browser if available to check actual rendered gestures and mobile layout.

## Execution notes

No .git directory or package manifest exists in this workspace. Work in place; no worktree, commit, installation or deployment. User's instruction to implement authorizes continuing without another plan approval. Self-review the final changes in the current session.

Verified 17 Node tests, seven browser regression scenarios and native mouse/pointer capture in both directions at 390px and inside a 65% scaled iframe. Browser QA uses the bundled Playwright runtime with a separate test profile. Inspected idle/drag screenshots; raised the grip and painted foreground animals over the hub to preserve face visibility. Real-device touch and Safari remain unverified.

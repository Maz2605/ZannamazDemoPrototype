# Spirit Grove — blockers and first-level tutorial

User selected one-way wheels plus animal-position rune locks, and requested a tutorial for level one.

- Keep 10 levels, existing swipe direction/sensitivity, wheel art below animals, Undo and Restart.
- One-way wheels carry a visible swipe-direction badge. Moves in the opposite direction are refused without counting a turn.
- Rune locks open only while a specific animal occupies a marked trigger pedestal. They close again when it leaves. Trigger pedestal and wheel share an identifier; state is derived from the board, so Undo restores locks naturally.
- Introduce one-way wheels in level 4, rune locks in level 6, combine them with existing constraints in later levels. Recalculate valid solutions and exact par for any changed level; test all levels.
- Level-one tutorial: highlight the solution wheel, ask the player to select it, then show a right-swipe arrow. Wrong wheel/direction cannot spoil the tutorial board. A skip button enables free play; Restart or re-entering level one starts the tutorial again. Keyboard is supported. Overlay sits in empty sky/UI space, never over animals or the touch target.
- No packages, timer hazards, move-budget losses, persistent storage or new engine framework.

Implementation choices: `oneWay` pairs [wheel, engineDirection], `seals` triples [wheel, triggerCell, animal]. Legal moves validate every member of a linked rotation against the pre-move state. Static authoring validation rejects invalid indexes and incompatible linked one-way rules. Hint on off-path states recommends Undo, since inverse moves may now be illegal.

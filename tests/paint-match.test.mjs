import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('Paint Match loads levels, builds easel canvas and sets up conveyors', async () => {
  const context = vm.createContext({ window: {}, globalThis: {} });
  context.globalThis = context;
  context.window = context;

  const constantsCode = await readFile(new URL('../games/paint-match/src/constants.js', import.meta.url), 'utf8');
  const levelsCode = await readFile(new URL('../games/paint-match/src/levels.js', import.meta.url), 'utf8');
  const engineCode = await readFile(new URL('../games/paint-match/src/engine.js', import.meta.url), 'utf8');

  vm.runInContext(constantsCode, context);
  vm.runInContext(levelsCode, context);
  vm.runInContext(engineCode, context);

  const { PaintMatch } = context;
  assert.ok(PaintMatch.Constants, 'Constants exists');
  assert.ok(PaintMatch.Levels, 'Levels exists');
  assert.ok(PaintMatch.Engine, 'Engine exists');

  assert.equal(PaintMatch.Constants.LAYOUT.PIX_CELL_SIZE, 34, 'Pixel cell size is 34px');
  assert.equal(PaintMatch.Constants.LAYOUT.PIX_CELL_SIZE * 8, 272, 'Canvas total size is 272px');
  assert.equal(PaintMatch.Levels.count(), 10, 'Has 10 levels');

  // Verify level 4 has conveyor belt configured
  const lvl4 = PaintMatch.Levels.get(3);
  assert.ok(lvl4.conveyors && lvl4.conveyors.length > 0, 'Level 4 has conveyor belt');
  assert.equal(lvl4.conveyors[0].row, 3, 'Level 4 conveyor operates on row 3');
});

test('Color Alchemy: Mixing Red + Yellow yields Orange, Blue + Yellow yields Green', async () => {
  const context = vm.createContext({ window: {}, globalThis: {} });
  context.globalThis = context;
  context.window = context;

  const constantsCode = await readFile(new URL('../games/paint-match/src/constants.js', import.meta.url), 'utf8');
  const levelsCode = await readFile(new URL('../games/paint-match/src/levels.js', import.meta.url), 'utf8');
  const engineCode = await readFile(new URL('../games/paint-match/src/engine.js', import.meta.url), 'utf8');

  vm.runInContext(constantsCode, context);
  vm.runInContext(levelsCode, context);
  vm.runInContext(engineCode, context);

  const { PaintMatch } = context;

  // Test color mixing lookup
  assert.equal(PaintMatch.Constants.getMixResult('R', 'Y'), 'O', 'Red + Yellow = Orange');
  assert.equal(PaintMatch.Constants.getMixResult('B', 'Y'), 'G', 'Blue + Yellow = Green');
  assert.equal(PaintMatch.Constants.getMixResult('R', 'B'), 'V', 'Red + Blue = Violet');
  assert.equal(PaintMatch.Constants.getMixResult('R', 'W'), 'P', 'Red + White = Pink');

  // Test game path analysis
  const G = PaintMatch.Engine.createGame(0, PaintMatch.Levels);
  G.grid[0] = { c: 'R', st: 0, cg: 0, hd: 0 };
  G.grid[1] = { c: 'R', st: 0, cg: 0, hd: 0 };
  G.grid[2] = { c: 'Y', st: 0, cg: 0, hd: 0 };

  const analysis = PaintMatch.Engine.analyzePath(G, [0, 1, 2]);
  assert.equal(analysis.isValid, true, 'R + R + Y is a valid path');
  assert.equal(analysis.isMixed, true, 'Path is flagged as color mix');
  assert.equal(analysis.outputColor, 'O', 'Resulting color is Orange (O)');

  // Test execution of mixed connection
  const initialMoves = G.moves;
  const result = PaintMatch.Engine.executeConnect(G, [0, 1, 2], false);
  assert.ok(result && result.success, 'Mixed connect execution succeeds');
  assert.equal(result.isMixed, true, 'Execution marks isMixed true');
  assert.equal(result.outputColor, 'O', 'Fired orange paint');
  assert.equal(G.moves, initialMoves - 1, 'Moves decreased by 1');
});

test('Conveyor Belts shift cells and Star Rating evaluates correctly', async () => {
  const context = vm.createContext({ window: {}, globalThis: {} });
  context.globalThis = context;
  context.window = context;

  const constantsCode = await readFile(new URL('../games/paint-match/src/constants.js', import.meta.url), 'utf8');
  const levelsCode = await readFile(new URL('../games/paint-match/src/levels.js', import.meta.url), 'utf8');
  const engineCode = await readFile(new URL('../games/paint-match/src/engine.js', import.meta.url), 'utf8');

  vm.runInContext(constantsCode, context);
  vm.runInContext(levelsCode, context);
  vm.runInContext(engineCode, context);

  const { PaintMatch } = context;

  // Star rating tests
  assert.equal(PaintMatch.Engine.calculateStars({ moves: 10, initialMoves: 20 }), 3, '50% moves left = 3 stars');
  assert.equal(PaintMatch.Engine.calculateStars({ moves: 5, initialMoves: 20 }), 2, '25% moves left = 2 stars');
  assert.equal(PaintMatch.Engine.calculateStars({ moves: 2, initialMoves: 20 }), 1, '10% moves left = 1 star');

  // Conveyor test on level 4 (row 3, dir: 1)
  const G = PaintMatch.Engine.createGame(3, PaintMatch.Levels);
  // Set identifiable cells on row 3: indices 18..23
  G.grid[18] = { c: 'R', st: 0, cg: 0, hd: 0 };
  G.grid[19] = { c: 'Y', st: 0, cg: 0, hd: 0 };

  // Setup a valid connection on row 0 to trigger turn
  G.grid[0] = { c: 'B', st: 0, cg: 0, hd: 0 };
  G.grid[1] = { c: 'B', st: 0, cg: 0, hd: 0 };
  G.grid[2] = { c: 'B', st: 0, cg: 0, hd: 0 };

  PaintMatch.Engine.executeConnect(G, [0, 1, 2], false);

  // Row 3 shifted right by 1, so what was at 18 is now at 19!
  assert.equal(G.grid[19].c, 'R', 'Cell at index 18 shifted to 19 after conveyor move');
});

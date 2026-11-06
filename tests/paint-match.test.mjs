import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('Paint Match module loads levels and can build all 10 levels', async () => {
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
  assert.ok(PaintMatch, 'PaintMatch object exists');
  assert.ok(PaintMatch.Constants, 'Constants exists');
  assert.ok(PaintMatch.Levels, 'Levels exists');
  assert.ok(PaintMatch.Engine, 'Engine exists');

  assert.equal(PaintMatch.Levels.count(), 10, 'Paint Match has exactly 10 levels');

  for (let i = 0; i < PaintMatch.Levels.count(); i++) {
    const lvl = PaintMatch.Levels.get(i);
    assert.ok(lvl.n, `Level ${i + 1} has a name`);
    assert.equal(lvl.a.length, 8, `Level ${i + 1} pixel art has 8 rows`);
    lvl.a.forEach((row, r) => {
      assert.equal(row.length, 8, `Level ${i + 1} row ${r} has 8 columns`);
    });

    const G = PaintMatch.Engine.createGame(i, PaintMatch.Levels);
    assert.equal(G.moves, lvl.m, `Level ${i + 1} moves match configuration`);
    assert.ok(G.totalPixels > 0, `Level ${i + 1} has non-zero target pixels`);
    assert.equal(G.left, G.totalPixels, `Level ${i + 1} initially has all pixels to paint`);
    assert.equal(G.grid.length, 36, `Level ${i + 1} board has 36 cells (6x6)`);
    assert.equal(G.state, 'play', `Level ${i + 1} starts in play state`);
  }
});

test('Paint Match engine detects runs and resolves matches correctly', async () => {
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
  const G = PaintMatch.Engine.createGame(0, PaintMatch.Levels);

  // Setup deliberate 3-match horizontally: cells 0, 1, 2 have color 'P'
  G.grid[0] = { c: 'P', sp: '', st: 0, cg: 0, hd: 0 };
  G.grid[1] = { c: 'P', sp: '', st: 0, cg: 0, hd: 0 };
  G.grid[2] = { c: 'P', sp: '', st: 0, cg: 0, hd: 0 };

  const runs = PaintMatch.Engine.findRuns(G.grid, 6);
  assert.ok(runs.length >= 1, 'Detected at least 1 match run');
  assert.equal(runs[0].length, 3, 'Run length is 3');
  assert.equal(runs[0][0], 0, 'Run starts at index 0');
  assert.equal(runs[0][1], 1, 'Run has index 1');
  assert.equal(runs[0][2], 2, 'Run ends at index 2');

  // Setting focus on a valid pixel
  const focusSet = PaintMatch.Engine.setFocus(G, 10);
  assert.equal(focusSet, true, 'Can set focus on pixel 10');
  assert.equal(G.focus, 10, 'Focus is set to index 10');
});

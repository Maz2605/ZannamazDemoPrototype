import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('Slice Cut module loads levels and can build all 20 levels with solvable states', async () => {
  const context = vm.createContext({ window: {} });
  const levelsCode = await readFile(new URL('../games/slice-cut/src/levels.js', import.meta.url), 'utf8');
  const engineCode = await readFile(new URL('../games/slice-cut/src/engine.js', import.meta.url), 'utf8');

  vm.runInContext(levelsCode, context);
  vm.runInContext(engineCode, context);

  const { SliceCut } = context.window;
  assert.ok(SliceCut, 'SliceCut object exists');
  assert.equal(SliceCut.LV.length, 20, 'Has 20 levels');

  for (let i = 0; i < SliceCut.LV.length; i++) {
    const G = SliceCut.Engine.build(i, SliceCut.LV, SliceCut.PAL);
    assert.ok(G.pieces.length >= 1, `Level ${i + 1} has base pieces`);
    assert.ok(G.dots.length > 0, `Level ${i + 1} has dots`);
    assert.equal(G.cuts, SliceCut.LV[i].c, `Level ${i + 1} cuts match configuration`);

    // Verify solution cuts
    for (const sol of G.solution) {
      const p = { x: sol[0], y: sol[1] };
      const a = sol[2] * Math.PI / 180;
      const d = { x: Math.cos(a), y: Math.sin(a) };
      const hit = SliceCut.Engine.checkCut(G, p, d, 0);
      assert.equal(hit, null, `Level ${i + 1} solution cut must not hit obstacle`);
      SliceCut.Engine.cut(G, p, d);
    }
    assert.equal(SliceCut.Engine.solved(G), true, `Level ${i + 1} solves correctly`);
  }
});

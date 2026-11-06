import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('all levels have legal solutions; unconstrained inverse moves remain reversible', async () => {
  const context = vm.createContext({ window: {} });
  for (const file of ['levels', 'engine']) vm.runInContext(await readFile(new URL(`../games/spirit-grove/src/${file}.js`, import.meta.url), 'utf8'), context);
  const { Engine: engine, LEVELS: levels } = context.window.SpiritGrove;
  assert.equal(levels.length, 15);
  for (const level of levels) {
    assert.equal(engine.verify(level).length, 0, `level ${level.id}`);
    const start = engine.parse(level);
    for (let wheel = 0; wheel < engine.wheelCount(level); wheel++) {
      if (engine.isBlocked(level, wheel)) continue;
      if (engine.moveError(level,start,wheel,1)) continue;
      const next = engine.spin(level, start, wheel, 1).next;
      if (engine.moveError(level,next,wheel,-1)) { assert.throws(()=>engine.spin(level,next,wheel,-1)); continue; }
      assert.equal(engine.spin(level, next, wheel, -1).next.join(''), start.join(''), `inverse move in level ${level.id}`);
    }
  }
});

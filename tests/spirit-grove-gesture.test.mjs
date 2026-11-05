import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function game() {
  const context = vm.createContext({ window: {} });
  for (const name of ['levels', 'engine', 'art', 'gesture']) {
    vm.runInContext(await readFile(new URL(`../games/spirit-grove/src/${name}.js`, import.meta.url), 'utf8'), context);
  }
  return context.window.SpiritGrove;
}
const point = degrees => ({ x: 102 * Math.cos(degrees * Math.PI / 180), y: 61 * Math.sin(degrees * Math.PI / 180) });

test('short horizontal swipes use the same direction from any start point', async () => {
  const { Gesture: g } = await game();
  for (const sign of [-1, 1]) {
    for (const start of [point(0),point(90),point(180),{x:0,y:0}]) {
    const drag = g.start(start, { x: 0, y: 0 });
    g.update(drag, point(sign * 40), { x: sign*20, y: 0 });
    assert.equal(g.direction(drag), 0);
    g.update(drag, point(sign * 40), { x: sign*28, y: 0 });
    assert.equal(g.direction(drag), -sign);
    assert.equal(Math.sign(drag.angle),-sign,'preview must follow the committed direction');
    assert.ok(Math.abs(drag.angle) < 10 * Math.PI / 180, 'preview should stay restrained');
    }
  }
});

test('preview caps at a quarter turn and reverses without momentum', async () => {
  const { Gesture: g } = await game();
  const drag = g.start(point(170), { x: 0, y: 0 });
  g.update(drag, point(-170), { x: 500, y: 0 });
  assert.equal(drag.angle,-Math.PI/2);
  g.update(drag, point(-60), { x: -28, y: 0 });
  assert.equal(g.direction(drag),1);
  g.update(drag, point(-100), { x: 0, y: 0 });
  assert.equal(drag.angle,0); assert.equal(g.direction(drag),0);
});

test('center-start short swipes work in both directions without tracing a circle', async () => {
  const { Gesture:g } = await game();
  for (const sign of [-1,1]) {
    const drag = g.start({x:0,y:0},{x:0,y:0});
    g.update(drag,{x:sign*12,y:0},{x:sign*12,y:0});
    assert.equal(drag.angle,0,'hand jitter should not move preview');
    g.update(drag,{x:sign*56,y:0},{x:sign*28,y:0});
    assert.equal(g.direction(drag),-sign);
    assert.ok(Math.abs(drag.angle)<Math.PI/4,'short swipe should preview gently');
  }
});

test('foreground animal travels left on a left swipe and right on a right swipe', async () => {
  const {Gesture:g,Art:a,Engine:e,LEVELS:levels}=await game();
  const level=levels[1], wheel=0, front=e.wheelCells(level,wheel)[2];
  for(const sign of [-1,1]) {
    const drag=g.start(null,{x:0,y:0});
    g.update(drag,null,{x:sign*30,y:0});
    const start=a.pointForIndex(level,front);
    const preview=a.orbitPoint(level,wheel,front,drag.angle);
    const end=a.orbitPoint(level,wheel,front,g.direction(drag)*Math.PI/2);
    assert.equal(Math.sign(preview.x-start.x),sign);
    assert.equal(Math.sign(end.x-start.x),sign);
  }
});

test('all visible wheel art is painted beneath animals; only transparent targets are above', async () => {
  const {Art:a,Engine:e,LEVELS:levels}=await game();
  for(const level of levels) {
    const svg=a.scene(level,e.parse(level));
    const firstAnimal=svg.indexOf('data-cell="');
    const lastAnimal=svg.lastIndexOf('data-cell="');
    for(let w=0;w<e.wheelCount(level);w++) {
      assert.ok(svg.indexOf(`data-rotor="${w}"`)<firstAnimal,'wheel covers an animal');
      assert.ok(svg.indexOf(`class="wheel-target" data-wheel="${w}"`)>lastAnimal,'missing accessible touch target');
    }
  }
});

test('tap, vertical movement and mostly vertical diagonals do not turn the wheel', async () => {
  const { Gesture: g } = await game();
  const drag = g.start(point(0), { x: 0, y: 0 });
  assert.equal(g.direction(drag), 0);
  g.update(drag, { x: 0, y: 0 }, { x: 0, y: 0 });
  g.update(drag, point(180), { x: 0, y: 60 });
  assert.equal(g.direction(drag), 0);
  g.update(drag, point(180), { x: 20, y: 50 });
  assert.equal(g.direction(drag), 0);
});

test('hubs sit exactly at four-cell intersections for all levels', async () => {
  const {Art:a,Engine:e,LEVELS:levels}=await game();
  for(const level of levels) for(let w=0;w<e.wheelCount(level);w++) {
    const cells=e.wheelCells(level,w).map(i=>a.pointForIndex(level,i));
    const hub=a.hubPoint(level,w);
    assert.equal(hub.x,cells.reduce((sum,p)=>sum+p.x,0)/4);
    assert.equal(hub.y,cells.reduce((sum,p)=>sum+p.y,0)/4);
  }
});

test('projected quarter-turn lands exactly on engine destinations in both directions', async () => {
  const { Art: a, Engine: e, LEVELS: levels } = await game();
  for (const level of levels) for (let w = 0; w < e.wheelCount(level); w++) {
    const cells = e.wheelCells(level, w);
    for (let i = 0; i < 4; i++) for (const d of [-1, 1]) {
      const actual = a.orbitPoint(level, w, cells[i], d * Math.PI / 2);
      const expected = a.pointForIndex(level, cells[e.mod(i + d, 4)]);
      assert.ok(Math.abs(actual.x - expected.x) < 1e-8);
      assert.ok(Math.abs(actual.y - expected.y) < 1e-8);
    }
  }
});

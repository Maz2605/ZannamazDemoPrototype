import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

async function engine() {
  const c=vm.createContext({window:{SpiritGrove:{}}});
  vm.runInContext(await readFile(new URL('../games/spirit-grove/src/engine.js',import.meta.url),'utf8'),c);
  return c.window.SpiritGrove.Engine;
}
const level=()=>({rows:3,cols:3,start:'012012012',solution:[],par:0});

test('one-way rejects the opposite direction and leaves input unchanged',async()=>{
  const e=await engine(), l={...level(),oneWay:[[0,-1]]}, s=e.parse(l);
  assert.equal(e.moveError(l,s,0,1),'one-way');
  assert.throws(()=>e.spin(l,s,0,1),/one-way/);
  assert.equal(s.join(''),l.start);
  assert.equal(e.moveError(l,s,0,-1),null);
  assert.equal(e.spin(l,s,0,-1).mappings.length,4);
});

test('rune lock derives open/closed status from the trigger animal',async()=>{
  const e=await engine(), l={...level(),seals:[[3,0,1]]}, s=e.parse(l);
  assert.equal(e.moveError(l,s,3,1),'rune');
  assert.throws(()=>e.spin(l,s,3,1),/rune/);
  const opened=e.spin(l,s,0,-1).next;
  assert.equal(opened[0],1);
  assert.equal(e.moveError(l,opened,3,1),null);
  assert.equal(e.moveError(l,s,3,1),'rune','restoring old board restores the lock');
  const closed=e.spin(l,opened,0,1).next;
  assert.equal(e.moveError(l,closed,3,1),'rune','moving trigger animal away closes the lock');
});

test('one-way constraints on a linked partner constrain the selected wheel',async()=>{
  const e=await engine(), l={rows:3,cols:4,start:'012301230123',link:[0,5,-1],oneWay:[[5,-1]]}, s=e.parse(l);
  assert.equal(e.moveError(l,s,0,1),null);
  assert.equal(e.spin(l,s,0,1).mappings.length,8);
  assert.equal(e.moveError(l,s,0,-1),'one-way');
  assert.throws(()=>e.spin(l,s,0,-1),/one-way/);
});

test('linked moves validate the forced wheel before any write',async()=>{
  const e=await engine(), l={rows:3,cols:4,start:'012301230123',link:[0,5,-1],seals:[[5,3,0]]}, s=e.parse(l);
  assert.equal(e.moveError(l,s,0,1),'rune');
  assert.throws(()=>e.spin(l,s,0,1),/rune/);
  assert.equal(s.join(''),l.start);
  assert.equal(e.rotationGroup(l,0,1).length,2,'preview geometry must not require a legal move');
});

test('mirror linked wheels spin in the same direction',async()=>{
  const e=await engine(), l={rows:3,cols:4,start:'012301230123',link:[0,5,1]};
  const moves = e.rotationGroup(l, 0, 1);
  assert.equal(moves.length, 2);
  assert.equal(moves[0][0], 0);
  assert.equal(moves[0][1], 1);
  assert.equal(moves[1][0], 5);
  assert.equal(moves[1][1], 1); // Same direction!
});

test('thorn trap rejects move when forbidden animal enters trap cell',async()=>{
  const e=await engine(), l={...level(),traps:[[4,0]]}, s=e.parse(l);
  // cell 4 is center cell. Wheel 0 contains cells 0, 1, 4, 3.
  // In start '012012012', state[0] = 0 (Fox).
  // Spinning wheel 0 in direction 1 moves cell 0 to cell 1, cell 1 to cell 4 (rabbit to center), etc.
  // Let's test spinning wheel 0 such that cell 3 (0 Fox) moves to cell 0 or cell 1 moves to cell 4.
  // In wheel 0, order clockwise is [0, 1, 4, 3].
  // direction -1 moves 0 -> 3, 3 -> 4 (Fox moves into cell 4!)
  assert.equal(e.moveError(l,s,0,-1),'trap');
  assert.throws(()=>e.spin(l,s,0,-1),/trap/);
});

test('frost lock requires heating animal on the heat cell',async()=>{
  const e=await engine(), l={rows:3,cols:4,start:'012301230123',frost:[[3,2,0]]}, s=e.parse(l);
  // state[2] = 2 !== 0 (Fox is not at cell 2) -> frost locked
  assert.equal(e.moveError(l,s,3,1),'frost');
  // Put Fox (0) at cell 2
  const heated = s.slice(); heated[2] = 0;
  assert.equal(e.moveError(l,heated,3,1),null);
});

test('dual rune lock requires both animals on their designated pedestals',async()=>{
  const e=await engine(), l={rows:3,cols:4,start:'012301230123',dualSeals:[[1,4,1,6,2]]}, s=e.parse(l);
  // state[4] = 0 !== 1 -> dual-rune locked
  assert.equal(e.moveError(l,s,1,1),'dual-rune');
  const unlocked = s.slice(); unlocked[4] = 1; unlocked[6] = 2;
  assert.equal(e.moveError(l,unlocked,1,1),null);
});

test('validator rejects invalid blocker references and conflicting linked directions',async()=>{
  const e=await engine();
  for(const bad of [
    {oneWay:[[99,1]]},{oneWay:[[0,0]]},{oneWay:[[0,1],[0,-1]]},
    {seals:[[0,99,0]]},{seals:[[0,0,9]]},{blocked:[0],seals:[[0,0,0]]},
    {rows:3,cols:4,start:'012301230123',link:[0,5,-1],oneWay:[[0,1],[5,1]]},
    {traps:[[99,0]]},{frost:[[99,0,0]]},{dualSeals:[[0,99,0,1,0]]}
  ]) assert.ok(e.verify({...level(),...bad}).length>0,JSON.stringify(bad));
});

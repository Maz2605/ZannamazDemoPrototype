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

test('validator rejects invalid blocker references and conflicting linked directions',async()=>{
  const e=await engine();
  for(const bad of [
    {oneWay:[[99,1]]},{oneWay:[[0,0]]},{oneWay:[[0,1],[0,-1]]},
    {seals:[[0,99,0]]},{seals:[[0,0,9]]},{blocked:[0],seals:[[0,0,0]]},
    {rows:3,cols:4,start:'012301230123',link:[0,5,-1],oneWay:[[0,1],[5,1]]}
  ]) assert.ok(e.verify({...level(),...bad}).length>0,JSON.stringify(bad));
});

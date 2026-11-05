/** Exact forward BFS using the production rules, including directed/rune moves. */
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const context=vm.createContext({window:{}});
for(const file of ['levels','engine']) vm.runInContext(await readFile(new URL(`../games/spirit-grove/src/${file}.js`,import.meta.url),'utf8'),context);
const {Engine:e,LEVELS:levels}=context.window.SpiritGrove;
export function solve(level) {
  const start=level.start, goal=e.target(level).join('');
  const queue=[start], parents=new Map([[start,null]]);
  for(let head=0;head<queue.length;head++) {
    const key=queue[head];
    if(key===goal) {
      const path=[]; let cursor=key;
      while(parents.get(cursor)) {const [previous,w,d]=parents.get(cursor);path.push([w,d]);cursor=previous;}
      return {solution:path.reverse(),states:parents.size};
    }
    const state=Array.from(key,Number);
    for(let w=0;w<e.wheelCount(level);w++) for(const d of [-1,1]) {
      if(e.moveError(level,state,w,d)) continue;
      const next=e.spin(level,state,w,d).next.join('');
      if(!parents.has(next)) {parents.set(next,[key,w,d]);queue.push(next);}
    }
  }
  return {solution:null,states:parents.size};
}
if(process.argv[1] && pathToFileURL(resolve(process.argv[1])).href===import.meta.url) for(const level of levels) {
  const result=solve(level), errors=e.verify(level);
  const valid=!!result.solution && result.solution.length===level.par && !errors.length;
  console.log(JSON.stringify({id:level.id,par:level.par,shortest:result.solution?.length,valid,...result,errors}));
  if(!valid) process.exitCode=1;
}

#!/usr/bin/env python3
"""Validate Spirit Grove levels and calculate exact shortest path lengths.

Uses Python stdlib only; reads the authored JS data from src/levels.js. The parser
expects the current straightforward object-literal formatting. Any format change
should also update the loader here.

Usage from project root:
    python tools/validate_levels.py

BFS traverses at most 369600 distinct arrangements for the current 3x4 / 4-species
board. Individual board states are encoded as compact byte strings.
"""
from collections import deque
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'src' / 'levels.js'


def read_levels():
    text = SOURCE.read_text(encoding='utf-8')
    blocks = re.findall(r'\{\s*id:\s*\d+\s*,.*?\n  \}', text, flags=re.S)
    if not blocks:
        raise ValueError('No level objects found in src/levels.js')
    result = []
    for block in blocks:
        def integer(field, optional=False):
            match = re.search(rf'\b{field}\s*:\s*(\d+)', block)
            if not match and not optional: raise ValueError(f'Missing {field}')
            return int(match.group(1)) if match else None
        def arr(field):
            match = re.search(rf'\b{field}\s*:\s*\[([^\]]+)\]', block)
            return list(map(int, re.findall(r'-?\d+', match.group(1)))) if match else []
        def nested(field):
            match = re.search(rf'\b{field}\s*:\s*\[((?:\s*\[[^\]]+\]\s*,?\s*)*)\]', block)
            return [tuple(map(int, re.findall(r'-?\d+', pair))) for pair in re.findall(r'\[([^\]]+)\]', match.group(1))] if match else []
        start = re.search(r"\bstart\s*:\s*['\"]([0-9]+)['\"]", block)
        solution = re.search(r'\bsolution\s*:\s*\[((?:\s*\[-?\d+\s*,\s*-?\d+\]\s*,?\s*)*)\]', block)
        if not start or not solution: raise ValueError(f'Bad start/solution formatting in {block[:40]}')
        result.append({
            'id': integer('id'), 'rows': integer('rows'), 'cols': integer('cols'),
            'start': bytes(map(int, start.group(1))), 'par': integer('par'),
            'blocked': arr('blocked'), 'link': arr('link'),
            'oneWay': nested('oneWay'), 'seals': nested('seals'),
            'solution': [tuple(map(int, pair.split(','))) for pair in re.findall(r'\[\s*(-?\d+\s*,\s*-?\d+)\s*\]', solution.group(1))]
        })
    return result


def wheel_cells(level, wheel):
    cols = level['cols']
    r, c = divmod(wheel, cols-1)
    return [r*cols+c, r*cols+c+1, (r+1)*cols+c+1, (r+1)*cols+c]


def spin(level, state, wheel, direction):
    count = (level['rows']-1)*(level['cols']-1)
    if wheel < 0 or wheel >= count or wheel in level['blocked'] or direction not in [-1, 1]:
        raise ValueError(f'Invalid move ({wheel}, {direction})')
    wheels = [(wheel, direction)]
    link = level['link']
    if link and wheel in link[:2]:
        wheels.append((link[1] if wheel == link[0] else link[0], direction * link[2]))
    for w, d in wheels:
        if w in level['blocked']: raise ValueError('sealed')
        if any(w == other and d != allowed for other, allowed in level.get('oneWay', [])): raise ValueError('one-way')
        if any(w == other and state[cell] != animal for other, cell, animal in level.get('seals', [])): raise ValueError('rune')
    new = bytearray(state)
    for w, d in wheels:
        cells = wheel_cells(level, w)
        for i, cell in enumerate(cells):
            new[cells[(i+d)%4]] = state[cell]
    return bytes(new)


def shortest_distance(level, start, goal):
    if start == goal: return 0
    count = (level['rows']-1)*(level['cols']-1)
    moves = [(w,d) for w in range(count) if w not in level['blocked'] for d in (-1,1)]
    # Restrictions are directed and board-dependent: search forward from start.
    visited = {start:0}
    queue = deque([start])
    while queue:
        node = queue.popleft()
        distance = visited[node]+1
        for w,d in moves:
            try: s = spin(level,node,w,d)
            except ValueError: continue
            if s == goal: return distance
            if s not in visited:
                visited[s]=distance
                queue.append(s)
    return None


def main():
    levels=read_levels()
    failed=False
    print(f'Checking {len(levels)} Spirit Grove levels from {SOURCE.relative_to(ROOT)}...')
    print('Level | Moves in authored solution | Actual shortest | Claimed par | Status')
    print('------+----------------------------+-----------------+-------------+---------')
    for level in levels:
        goal=bytes(i%level['cols'] for i in range(level['rows']*level['cols']))
        state=level['start']
        err=[]
        if len(state)!=len(goal): err.append('bad start length')
        if any(v>=level['cols'] for v in state): err.append('bad animal id')
        if level['link']:
            a,b,_=level['link']
            if set(wheel_cells(level,a)) & set(wheel_cells(level,b)): err.append('linked wheels overlap')
            if a in level['blocked'] or b in level['blocked']: err.append('linked wheel blocked')
        try:
            for w,d in level['solution']:state=spin(level,state,w,d)
        except Exception as e:err.append(str(e))
        if state!=goal:err.append('authored solution does not reach target')
        shortest=shortest_distance(level,level['start'],goal) if not err else None
        if shortest!=level['par']:err.append(f'par should be {shortest}')
        if err:failed=True
        print(f"{level['id']:>5} | {len(level['solution']):>26} | {str(shortest):>15} | {level['par']:>11} | {'OK' if not err else '; '.join(err)}")
    if failed:
        print('\nValidation failed. Update src/levels.js and rerun.')
        return 1
    print('\nAll level solutions and shortest-path claims are valid.')
    return 0

if __name__=='__main__':sys.exit(main())

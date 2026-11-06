/** Pure puzzle rules. No DOM, no animation, no rendering dependencies. */
(function (G) {
  'use strict';
  const mod = (x, n) => (x % n + n) % n;
  const parse = (level) => Array.from(level.start, Number);
  const target = (level) => Array.from({ length: level.rows * level.cols }, (_, i) => i % level.cols);
  const isWin = (level, state) => state.every((id, i) => id === i % level.cols);
  const wheelCount = (level) => (level.rows - 1) * (level.cols - 1);
  const wheelGrid = (level, wheel) => ({ row: Math.floor(wheel / (level.cols - 1)), col: wheel % (level.cols - 1) });
  const wheelCells = (level, wheel) => {
    const { row: r, col: c } = wheelGrid(level, wheel), cols = level.cols;
    return [r * cols + c, r * cols + c + 1, (r + 1) * cols + c + 1, (r + 1) * cols + c];
  };

  // 8 BLOCKERS LOGIC:
  // 1. Blocked / Sealed wheel (phong ấn vĩnh viễn)
  const isBlocked = (level, wheel) => (level.blocked || []).includes(wheel);

  // 2. Rune Lock (ấn linh thú đơn)
  const isRuneLocked = (level, state, wheel) => (level.seals || []).some(([w, cell, animal]) => w === wheel && state[cell] !== animal);

  // 3. Dual Rune Lock (ấn linh thú kép: cần cả 2 linh thú ở 2 bệ)
  const isDualLocked = (level, state, wheel) => (level.dualSeals || []).some(([w, c1, a1, c2, a2]) => w === wheel && (state[c1] !== a1 || state[c2] !== a2));

  // 4. Frost Lock (ấn băng vĩnh cửu: trục đóng băng cho đến khi Cáo/hệ lửa sưởi ấm)
  const isFrostLocked = (level, state, wheel) => (level.frost || []).some(([w, cell, animal]) => w === wheel && state[cell] !== animal);

  // 5. Rotation group: handles both counter gears (-1) and parallel / mirror gears (+1)
  function rotationGroup(level, wheel, direction = 1) {
    if (!Number.isInteger(wheel) || wheel < 0 || wheel >= wheelCount(level)) throw Error('Unknown wheel: ' + wheel);
    if (![1, -1].includes(direction)) throw Error('Direction must be 1 or -1');
    const moves = [[wheel, direction]];
    if (level.link && level.link.slice(0, 2).includes(wheel)) {
      const other = level.link[0] === wheel ? level.link[1] : level.link[0];
      moves.push([other, direction * level.link[2]]);
    }
    return moves;
  }

  // 6. Thorn Traps: bẫy gai cấm một loài động vật nhất định bước vào bệ
  function isTrapViolation(level, state, wheel, direction) {
    if (!level.traps || !level.traps.length) return false;
    const moves = rotationGroup(level, wheel, direction);
    for (const [w, d] of moves) {
      const positions = wheelCells(level, w);
      for (let i = 0; i < 4; i++) {
        const from = positions[i], to = positions[mod(i + d, 4)];
        const movingAnimal = state[from];
        if (level.traps.some(([trapCell, badAnimal]) => to === trapCell && movingAnimal === badAnimal)) {
          return true;
        }
      }
    }
    return false;
  }

  function moveError(level, state, wheel, direction) {
    if (!Number.isInteger(wheel) || wheel < 0 || wheel >= wheelCount(level)) return 'unknown-wheel';
    if (![1, -1].includes(direction)) return 'direction';
    const group = rotationGroup(level, wheel, direction);
    for (const [w, d] of group) {
      if (isBlocked(level, w)) return 'sealed';
      if (isRuneLocked(level, state, w)) return 'rune';
      if (isDualLocked(level, state, w)) return 'dual-rune';
      if (isFrostLocked(level, state, w)) return 'frost';
      if ((level.oneWay || []).some(([id, allowed]) => id === w && allowed !== d)) return 'one-way';
    }
    if (isTrapViolation(level, state, wheel, direction)) return 'trap';
    return null;
  }

  function spin(level, state, wheel, direction) {
    const error = moveError(level, state, wheel, direction);
    if (error) throw Error(error);
    const moves = rotationGroup(level, wheel, direction);
    // Simultaneous rotation: all reads refer to the old state, then committed.
    const next = state.slice(), mappings = [];
    for (const [w, d] of moves) {
      const positions = wheelCells(level, w);
      for (let i = 0; i < 4; i++) {
        const from = positions[i], to = positions[mod(i + d, 4)];
        next[to] = state[from];
        mappings.push({ from, to, animal: state[from] });
      }
    }
    return { next, mappings, rotations: moves };
  }

  function verify(level) {
    const errors = [];
    const validWheel = w => Number.isInteger(w) && w >= 0 && w < wheelCount(level);
    const validCell = c => Number.isInteger(c) && c >= 0 && c < level.rows * level.cols;
    if (level.start.length !== level.rows * level.cols) errors.push('start length mismatch');
    if (!Array.from(level.start).every(v => +v >= 0 && +v < level.cols)) errors.push('bad animal ID');
    if ((level.blocked || []).some(w => !validWheel(w))) errors.push('invalid blocked wheel');

    const directed = new Map();
    for (const [w, d] of level.oneWay || []) {
      if (!validWheel(w) || ![1, -1].includes(d) || directed.has(w) || isBlocked(level, w)) errors.push('invalid one-way wheel');
      directed.set(w, d);
    }

    const sealed = new Set();
    for (const [w, c, a] of level.seals || []) {
      if (!validWheel(w) || !validCell(c) || !Number.isInteger(a) || a < 0 || a >= level.cols || isBlocked(level, w) || sealed.has(w)) errors.push('invalid rune seal');
      sealed.add(w);
    }

    for (const [w, c1, a1, c2, a2] of level.dualSeals || []) {
      if (!validWheel(w) || !validCell(c1) || !validCell(c2) || c1 === c2 || !Number.isInteger(a1) || !Number.isInteger(a2) || isBlocked(level, w)) errors.push('invalid dual rune seal');
    }

    for (const [w, c, a] of level.frost || []) {
      if (!validWheel(w) || !validCell(c) || !Number.isInteger(a) || isBlocked(level, w)) errors.push('invalid frost seal');
    }

    for (const [c, a] of level.traps || []) {
      if (!validCell(c) || !Number.isInteger(a) || a < 0 || a >= level.cols) errors.push('invalid thorn trap');
    }

    if (level.link) {
      const [a, b, relation] = level.link;
      if (!validWheel(a) || !validWheel(b) || a === b || ![1, -1].includes(relation)) errors.push('invalid linked wheels');
      if (wheelCells(level, a).some(i => wheelCells(level, b).includes(i))) errors.push('linked wheels overlap');
      if (isBlocked(level, a) || isBlocked(level, b)) errors.push('linked wheel blocked');
      if (directed.has(a) && directed.has(b) && directed.get(b) !== directed.get(a) * relation) errors.push('conflicting linked one-way wheels');
    }

    if (errors.length) return errors;
    let state = parse(level);
    for (const [w, d] of level.solution) {
      try { state = spin(level, state, w, d).next; }
      catch (e) { errors.push(e.message); }
    }
    if (!isWin(level, state)) errors.push('stored solution does not solve level');
    return errors;
  }

  G.Engine = {
    mod, parse, target, isWin, wheelCount, wheelGrid, wheelCells,
    isBlocked, isRuneLocked, isDualLocked, isFrostLocked, isTrapViolation,
    rotationGroup, moveError, spin, verify
  };
})(window.SpiritGrove);

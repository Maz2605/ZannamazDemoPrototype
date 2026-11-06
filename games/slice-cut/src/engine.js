/**
 * Slice Cut - Geometry & Game Engine Logic
 * Handles polygon clipping, point containment, obstacles (steel, rope, ice), cut checking, and level generation.
 */
(function (root) {
  'use strict';

  const SliceCut = root.SliceCut = root.SliceCut || {};

  function shape(k) {
    const p = [];
    if (k === 'c') {
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        p.push({ x: 170 + 150 * Math.cos(a), y: 210 + 150 * Math.sin(a) });
      }
    } else if (k === 'h') {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        p.push({ x: 170 + 155 * Math.cos(a), y: 210 + 155 * Math.sin(a) });
      }
    } else {
      const r = 44;
      [
        [320 - r, 30 + r, -90],
        [320 - r, 390 - r, 0],
        [20 + r, 390 - r, 90],
        [20 + r, 30 + r, 180]
      ].forEach(([cx, cy, s]) => {
        for (let i = 0; i <= 6; i++) {
          const a = (s + i * 15) * Math.PI / 180;
          p.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
        }
      });
    }
    return p;
  }

  // Signed distance / cross-product of point pt relative to line through p along unit direction d
  const sd = (pt, p, d) => d.x * (pt.y - p.y) - d.y * (pt.x - p.x);

  // Polygon area using shoelace formula
  function area(P) {
    let s = 0;
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length];
      s += a.x * b.y - b.x * a.y;
    }
    return Math.abs(s) / 2;
  }

  // Split polygon P into two polygons [A, B] by line (p, d)
  function split(P, p, d) {
    const A = [], B = [], s = P.map(v => sd(v, p, d));
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length];
      const sa = s[i], sb = s[(i + 1) % P.length];
      if (sa >= 0) A.push(a);
      if (sa <= 0) B.push(a);
      if ((sa > 0 && sb < 0) || (sa < 0 && sb > 0)) {
        const t = sa / (sa - sb);
        const m = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
        A.push(m);
        B.push(m);
      }
    }
    return [A, B];
  }

  // Point in simple polygon test
  function inPoly(P, pt) {
    let pos = 0, neg = 0;
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length];
      const c = (b.x - a.x) * (pt.y - a.y) - (b.y - a.y) * (pt.x - a.x);
      if (c > 0) pos++;
      else neg++;
    }
    return !pos || !neg;
  }

  // Distance from point pt to segment [a, b]
  function segDist(pt, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const l = dx * dx + dy * dy || 1;
    let t = ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / l;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(pt.x - a.x - dx * t, pt.y - a.y - dy * t);
  }

  // Wall segment calculation (rope or steel)
  function wallSeg(w) {
    if (w.k === 'rope') return { a: { x: w.x1, y: w.y1 }, b: { x: w.x2, y: w.y2 } };
    const ang = w.a * Math.PI / 180, cx = w.x, cy = w.y;
    const h = w.len / 2, c = Math.cos(ang) * h, s = Math.sin(ang) * h;
    return { a: { x: cx - c, y: cy - s }, b: { x: cx + c, y: cy + s } };
  }

  // Check collision for cut line
  function checkCut(G, p, d, t, dotR = SliceCut.DOT_R || 11, bombR = SliceCut.BOMB_R || 15) {
    // 1. Bombs
    for (const b of G.bombs) {
      if (Math.abs(sd(b, p, d)) < bombR + 3) return 'bomb';
    }
    // 2. Ice blocks (impenetrable ice)
    for (const ice of (G.ices || [])) {
      if (Math.abs(sd(ice, p, d)) < (ice.r || 18) + 2) return 'ice';
    }
    // 3. Dots (candies)
    for (const o of G.dots) {
      if (Math.abs(sd(o, p, d)) < dotR + 3) return 'dot';
    }
    // 4. Walls (steel bars & ropes)
    for (const w of G.walls) {
      const s = wallSeg(w);
      const s1 = sd(s.a, p, d);
      const s2 = sd(s.b, p, d);
      if (s1 * s2 <= 0 || Math.abs(s1) < 4 || Math.abs(s2) < 4) return 'wall';
    }
    return null;
  }

  // Execute slice cut on gameState G
  function cut(G, p, d) {
    const out = [];
    let n = 0;
    G.pieces.forEach(P => {
      const [A, B] = split(P.poly, p, d);
      if (A.length > 2 && B.length > 2 && area(A) > 40 && area(B) > 40) {
        n++;
        const pa = {
          poly: A,
          dots: P.dots.filter(o => sd(o, p, d) > 0),
          pop: 1,
          n: { x: -d.y, y: d.x }
        };
        const pb = {
          poly: B,
          dots: P.dots.filter(o => sd(o, p, d) <= 0),
          pop: 1,
          n: { x: d.y, y: -d.x }
        };
        out.push(pa, pb);
      } else {
        out.push(P);
      }
    });
    if (n) G.pieces = out;
    return n > 0;
  }

  // Check if puzzle is solved (supports Star candies as wildcards)
  function solved(G) {
    return G.pieces.every(P => {
      const normalDots = P.dots.filter(o => !o.star);
      if (normalDots.length <= 1) return true;
      return normalDots.every(o => o.c === normalDots[0].c);
    });
  }

  // Build level state from level config index
  function build(i, levels = SliceCut.LV, pal = SliceCut.PAL) {
    const L = levels[i];
    let rs = 500 + i * 31;
    const rnd = () => {
      rs |= 0;
      rs = rs + 0x6D2B79F5 | 0;
      let t = Math.imul(rs ^ rs >>> 15, 1 | rs);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    const base = shape(L.s);
    const lines = L.L.map(([x, y, a]) => ({
      p: { x, y },
      d: { x: Math.cos(a * Math.PI / 180), y: Math.sin(a * Math.PI / 180) }
    }));
    let regs = [base];
    lines.forEach(l => {
      const nx = [];
      regs.forEach(P => {
        const [A, B] = split(P, l.p, l.d);
        if (A.length > 2 && B.length > 2 && area(A) > 60 && area(B) > 60) nx.push(A, B);
        else nx.push(P);
      });
      regs = nx;
    });

    const order = pal.slice().sort(() => rnd() - .5);
    const walls = (L.walls || []).map(w => ({ ...w }));
    const bombs = (L.bombs || []).map(([x, y]) => ({ x, y }));
    const ices = (L.ices || []).map(ice => ({ ...ice }));
    const dots = [];

    const col = pt => {
      const k = regs.findIndex(R => inPoly(R, pt));
      return order[(k < 0 ? 0 : k) % order.length];
    };

    // Place dots at rope endpoints
    walls.filter(w => w.k === 'rope').forEach(w => {
      const c = col({ x: (w.x1 + w.x2) / 2, y: (w.y1 + w.y2) / 2 });
      dots.push({ x: w.x1, y: w.y1, c }, { x: w.x2, y: w.y2, c });
    });

    const dotR = SliceCut.DOT_R || 11;
    const free = (pt, R) => {
      for (let k = 0; k < R.length; k++) {
        if (segDist(pt, R[k], R[(k + 1) % R.length]) < 15) return false;
      }
      for (const l of lines) {
        if (Math.abs(sd(pt, l.p, l.d)) < 22) return false;
      }
      for (const b of bombs) {
        if (Math.hypot(pt.x - b.x, pt.y - b.y) < 34) return false;
      }
      for (const ice of ices) {
        if (Math.hypot(pt.x - ice.x, pt.y - ice.y) < (ice.r || 18) + 14) return false;
      }
      for (const o of dots) {
        if (Math.hypot(pt.x - o.x, pt.y - o.y) < 28) return false;
      }
      for (const w of walls) {
        const s = wallSeg(w);
        if (segDist(pt, s.a, s.b) < dotR + 14) return false;
      }
      return true;
    };

    regs.forEach((R, k) => {
      const xs = R.map(v => v.x), ys = R.map(v => v.y);
      const x0 = Math.min(...xs), x1 = Math.max(...xs);
      const y0 = Math.min(...ys), y1 = Math.max(...ys);
      const want = 2 + (rnd() < .5 ? 1 : 0);
      let got = 0;
      for (let a = 0; a < 500 && got < want; a++) {
        const pt = { x: x0 + rnd() * (x1 - x0), y: y0 + rnd() * (y1 - y0) };
        if (inPoly(R, pt) && free(pt, R)) {
          dots.push({ x: pt.x, y: pt.y, c: order[k % order.length] });
          got++;
        }
      }
    });

    // Mark Star candies if level has them
    if (L.stars && L.stars > 0 && dots.length > 0) {
      const candidates = dots.slice().sort(() => rnd() - .5);
      for (let s = 0; s < Math.min(L.stars, candidates.length); s++) {
        candidates[s].star = true;
      }
    }

    return {
      lines,
      walls,
      bombs,
      ices,
      dots,
      pieces: [{ poly: base, dots, pop: 0, n: { x: 0, y: 0 } }],
      cuts: L.c,
      ax: !!L.ax,
      tm: L.tm || 0,
      state: 'play',
      t0: null,
      boom: null,
      solution: L.L
    };
  }

  SliceCut.Engine = {
    shape,
    sd,
    area,
    split,
    inPoly,
    segDist,
    wallSeg,
    checkCut,
    cut,
    solved,
    build
  };
})(typeof window !== 'undefined' ? window : globalThis);

/**
 * Paint Match - Engine
 * Xử lý toàn bộ logic Match-3: phát hiện chuỗi nối, hoán đổi, nổ cọ/xô, trọng lực,
 * bắn sơn lên tranh pixel, mở khóa, loang mực và điều kiện thắng/thua.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const Constants = require('./constants.js');
    const Levels = require('./levels.js');
    module.exports = factory(Constants, Levels);
  } else {
    root.PaintMatch = root.PaintMatch || {};
    root.PaintMatch.Engine = factory(root.PaintMatch.Constants, root.PaintMatch.Levels);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Constants, Levels) {
  'use strict';

  const { BOARD_SIZE, PIX_SIZE, SPECIAL, BLOCKER } = Constants;
  const N = BOARD_SIZE;
  const PX = PIX_SIZE;

  // LCG Pseudo-Random Number Generator cho tính tái lập (deterministic)
  function random(G) {
    G.rs = (G.rs * 1664525 + 1013904223) >>> 0;
    return G.rs / 4294967296;
  }

  // Kiểm tra 2 ô trên bàn cờ có kề sát nhau không (không tính đường chéo)
  function isAdjacent(a, b, size = N) {
    if (a < 0 || b < 0 || a >= size * size || b >= size * size) return false;
    const sameRow = Math.floor(a / size) === Math.floor(b / size);
    const sameCol = (a % size) === (b % size);
    return (sameRow && Math.abs(a - b) === 1) || (sameCol && Math.abs(a - b) === size);
  }

  // Tạo một ô kẹo/giọt sơn bình thường ngẫu nhiên
  function makeCell(G) {
    const cols = G.level.cols;
    const color = cols[Math.floor(random(G) * cols.length)];
    return {
      c: color,
      sp: SPECIAL.NONE,
      st: BLOCKER.NONE,
      cg: 0,
      hd: 0,
      fresh: 0
    };
  }

  // Kiểm tra ô có phải là giọt màu có thể ghép được hay không (không phải đá, xô sơn)
  function isColorTile(cell) {
    return !!cell && !cell.st && cell.sp !== SPECIAL.BUCKET;
  }

  /**
   * Khởi tạo trạng thái bàn chơi mới cho level i
   */
  function createGame(levelIndex, levelsSource = Levels) {
    const level = levelsSource.get(levelIndex);
    const G = {
      levelIndex,
      level,
      rs: 900 + levelIndex * 37,
      grid: [],
      pix: [],
      moves: level.m,
      initialMoves: level.m,
      mv: 0,
      focus: -1,
      fx: [],
      state: 'play', // 'play' | 'won' | 'lost'
      left: 0,
      totalPixels: 0,
      msg: '',
      reshuffled: false
    };

    // 1. Tạo lưới tranh pixel (8x8)
    level.a.forEach((row, r) => {
      [...row].forEach((ch, c) => {
        const isFilled = ch !== '.';
        const p = {
          c: isFilled ? ch : null,
          hp: 1,
          done: 0,
          lock: 0,
          pop: 0
        };
        if (isFilled) {
          G.left++;
          G.totalPixels++;
        }
        G.pix.push(p);
      });
    });

    // Thiết lập các ô bị khóa trên tranh
    (level.lock || []).forEach(([r, c]) => {
      const idx = r * PX + c;
      if (G.pix[idx] && G.pix[idx].c) G.pix[idx].lock = 1;
    });

    // Thiết lập các ô sơn 2 lớp trên tranh
    (level.dbl || []).forEach(([r, c]) => {
      const idx = r * PX + c;
      if (G.pix[idx] && G.pix[idx].c) G.pix[idx].hp = 2;
    });

    // 2. Tạo bàn cờ Match-3 (6x6) không tạo chuỗi 3 sẵn
    for (let k = 0; k < N * N; k++) {
      let cell, attempts = 0;
      do {
        cell = makeCell(G);
        attempts++;
      } while (
        attempts < 30 &&
        ((k % N >= 2 && G.grid[k - 1].c === cell.c && G.grid[k - 2].c === cell.c) ||
         (k >= 2 * N && G.grid[k - N].c === cell.c && G.grid[k - 2 * N].c === cell.c))
      );
      G.grid.push(cell);
    }

    // Thiết lập chướng ngại vật trên bàn cờ
    (level.stones || []).forEach(k => {
      if (k >= 0 && k < N * N) {
        G.grid[k] = { c: '#', sp: SPECIAL.NONE, st: BLOCKER.STONE, cg: 0, hd: 0 };
      }
    });

    (level.cages || []).forEach(k => {
      if (k >= 0 && k < N * N && G.grid[k]) {
        G.grid[k].cg = 1;
      }
    });

    for (let h = 0; h < (level.hid || 0); h++) {
      const k = Math.floor(random(G) * N * N);
      if (isColorTile(G.grid[k])) {
        G.grid[k].hd = 1;
      }
    }

    // Đảm bảo bàn cờ luôn có ít nhất một nước đi hợp lệ
    fixMoves(G);

    return G;
  }

  /**
   * Tìm tất cả các chuỗi ghép >= 3 cùng màu theo hàng ngang và hàng dọc
   */
  function findRuns(grid, size = N) {
    const runs = [];

    // Tìm theo từng hàng ngang
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size;) {
        const first = grid[r * size + c];
        let end = c + 1;
        if (isColorTile(first)) {
          while (end < size && isColorTile(grid[r * size + end]) && grid[r * size + end].c === first.c) {
            end++;
          }
        }
        if (end - c >= 3) {
          runs.push(Array.from({ length: end - c }, (_, k) => r * size + c + k));
        }
        c = end;
      }
    }

    // Tìm theo từng cột dọc
    for (let c = 0; c < size; c++) {
      for (let r = 0; r < size;) {
        const first = grid[r * size + c];
        let end = r + 1;
        if (isColorTile(first)) {
          while (end < size && isColorTile(grid[end * size + c]) && grid[end * size + c].c === first.c) {
            end++;
          }
        }
        if (end - r >= 3) {
          runs.push(Array.from({ length: end - r }, (_, k) => (r + k) * size + c));
        }
        r = end;
      }
    }

    return runs;
  }

  /**
   * Bắn giọt sơn lên bức tranh pixel
   */
  function paintPixels(G, color, units, fromIndex) {
    for (let u = 0; u < units; u++) {
      let best = -1;
      let minDistance = Infinity;

      G.pix.forEach((p, i) => {
        if (p.c === color && !p.done && !p.lock) {
          let dist;
          if (G.focus >= 0) {
            const fx = G.focus % PX;
            const fy = Math.floor(G.focus / PX);
            const ix = i % PX;
            const iy = Math.floor(i / PX);
            dist = Math.hypot(ix - fx, iy - fy);
          } else {
            dist = i; // Ưu tiên từ trên xuống dưới
          }

          if (dist < minDistance) {
            minDistance = dist;
            best = i;
          }
        }
      });

      if (best < 0) return; // Không còn ô nào màu này có thể tô

      const targetPixel = G.pix[best];
      targetPixel.hp--;
      targetPixel.pop = 1;

      G.fx.push({
        k: 'fly',
        i: fromIndex,
        p: best,
        c: color
      });

      if (targetPixel.hp <= 0) {
        targetPixel.done = 1;
        G.left--;

        // Khi tô xong 1 ô, tự động mở khóa 4 ô liền kề trong tranh
        const r = Math.floor(best / PX);
        const c = best % PX;
        const neighbors = [
          [r - 1, c],
          [r + 1, c],
          [r, c - 1],
          [r, c + 1]
        ];

        neighbors.forEach(([ny, nx]) => {
          if (ny >= 0 && ny < PX && nx >= 0 && nx < PX) {
            const nIndex = ny * PX + nx;
            if (G.pix[nIndex]) {
              G.pix[nIndex].lock = 0;
            }
          }
        });
      }
    }
  }

  /**
   * Xóa các ô ghép, tính sát thương xung quanh (đá, lồng, ô ẩn), bắn màu và sinh ô kỹ năng
   */
  function clearCells(G, clearSet, spawnList, chain) {
    const countsByColor = {};

    clearSet.forEach(i => {
      const cell = G.grid[i];
      if (cell && !cell.st && cell.c !== '*') {
        countsByColor[cell.c] = (countsByColor[cell.c] || 0) + 1;
      }
    });

    // Kiểm tra sát thương xung quanh các ô bị nổ (phá đá, lồng, mở ô ẩn)
    const damagedSet = new Set();
    clearSet.forEach(i => {
      const neighbors = [
        i - N,
        i + N,
        i % N > 0 ? i - 1 : -1,
        i % N < N - 1 ? i + 1 : -1
      ];

      neighbors.forEach(j => {
        if (j >= 0 && j < N * N && !clearSet.has(j) && G.grid[j]) {
          const neighborCell = G.grid[j];
          if (neighborCell.st) {
            damagedSet.add(j);
          } else {
            neighborCell.cg = 0;
            neighborCell.hd = 0;
          }
        }
      });
    });

    // Tìm màu có số lượng nổ nhiều nhất để thưởng thêm hạt màu theo combo chain
    const colors = Object.keys(countsByColor);
    const primaryColor = colors.sort((a, b) => countsByColor[b] - countsByColor[a])[0];

    colors.forEach(color => {
      const bonus = (color === primaryColor) ? Math.max(0, chain - 1) : 0;
      const totalUnits = countsByColor[color] + bonus;
      const sourceIndex = [...clearSet].find(i => G.grid[i] && G.grid[i].c === color);
      paintPixels(G, color, totalUnits, sourceIndex);
    });

    // Gửi hiệu ứng vỡ nổ (pop fx)
    [...clearSet, ...damagedSet].forEach(i => {
      if (G.grid[i]) {
        G.fx.push({
          k: 'pop',
          i,
          c: G.grid[i].c,
          st: G.grid[i].st
        });
      }
      G.grid[i] = null;
    });

    // Tạo các ô đặc biệt mới sinh ra (cọ hoặc xô)
    spawnList.forEach(item => {
      G.grid[item.at] = {
        c: item.c,
        sp: item.sp,
        st: BLOCKER.NONE,
        cg: 0,
        hd: 0,
        fresh: 0
      };
    });
  }

  /**
   * Áp dụng trọng lực: rớt các ô từ trên xuống và sinh các ô mới ở đỉnh
   */
  function applyGravity(G) {
    for (let c = 0; c < N; c++) {
      const remainingInCol = [];
      for (let r = N - 1; r >= 0; r--) {
        const cell = G.grid[r * N + c];
        if (cell) remainingInCol.push(cell);
      }

      for (let r = N - 1; r >= 0; r--) {
        const k = N - 1 - r;
        if (k < remainingInCol.length) {
          G.grid[r * N + c] = remainingInCol[k];
        } else {
          const freshCell = Object.assign(makeCell(G), { fresh: 1 });
          G.grid[r * N + c] = freshCell;
        }
      }
    }
  }

  /**
   * Giải quyết liên hoàn các combo nối (cascades)
   */
  function resolveBoard(G, preferredCenter = -1, chain = 0) {
    let currentPref = preferredCenter;

    for (;;) {
      const runs = findRuns(G.grid, N);
      if (!runs.length) break;

      chain++;
      const clearSet = new Set();
      const spawnList = [];

      runs.forEach(run => {
        run.forEach(idx => clearSet.add(idx));
      });

      // Nếu trong các ô vỡ có ô Cọ vẽ (Brush 'b'), quét nổ toàn bộ hàng đó
      [...clearSet].forEach(idx => {
        if (G.grid[idx] && G.grid[idx].sp === SPECIAL.BRUSH) {
          const row = Math.floor(idx / N);
          for (let c = 0; c < N; c++) {
            const targetIndex = row * N + c;
            if (G.grid[targetIndex] && !G.grid[targetIndex].st) {
              clearSet.add(targetIndex);
            }
          }
        }
      });

      // Tạo ô Cọ vẽ (ghép 4) hoặc Xô sơn (ghép 5+)
      runs.forEach(run => {
        if (run.length >= 4) {
          const centerIndex = run.includes(currentPref) ? currentPref : run[Math.floor(run.length / 2)];
          if (G.grid[centerIndex] && !G.grid[centerIndex].sp) {
            const isFiveMatch = run.length >= 5;
            spawnList.push({
              at: centerIndex,
              sp: isFiveMatch ? SPECIAL.BUCKET : SPECIAL.BRUSH,
              c: isFiveMatch ? '*' : G.grid[centerIndex].c
            });
            clearSet.delete(centerIndex);
          }
        }
      });

      clearCells(G, clearSet, spawnList, chain);
      applyGravity(G);
      currentPref = -1;
    }

    return chain;
  }

  /**
   * Kiểm tra xem trên bàn cờ còn bất kỳ nước đi hợp lệ nào không
   */
  function hasMove(G) {
    for (let i = 0; i < N * N; i++) {
      const neighbors = [i + 1, i + N];
      for (const j of neighbors) {
        if (j >= N * N || !isAdjacent(i, j, N)) continue;

        const a = G.grid[i];
        const b = G.grid[j];
        if (!a || !b || a.st || b.st || a.cg || b.cg) continue;

        // Nếu một trong 2 ô là Xô sơn, luôn có thể hoán đổi
        if (a.sp === SPECIAL.BUCKET || b.sp === SPECIAL.BUCKET) return true;

        // Thử hoán đổi ảo
        G.grid[i] = b;
        G.grid[j] = a;
        const valid = findRuns(G.grid, N).length > 0;
        G.grid[i] = a;
        G.grid[j] = b;

        if (valid) return true;
      }
    }
    return false;
  }

  /**
   * Tự động xáo lại các ô kẹo nếu bàn cờ bị kẹt không còn nước đi
   */
  function fixMoves(G) {
    let attempts = 0;
    while (attempts < 60 && (!hasMove(G) || findRuns(G.grid, N).length > 0)) {
      attempts++;
      const availableIndices = G.grid
        .map((cell, idx) => (isColorTile(cell) && !cell.cg ? idx : -1))
        .filter(idx => idx >= 0);

      availableIndices.forEach(idx => {
        G.grid[idx].c = G.level.cols[Math.floor(random(G) * G.level.cols.length)];
      });
      G.reshuffled = true;
    }
  }

  /**
   * Cập nhật trạng thái sau mỗi lượt đi (trừ lượt, mực loang, kiểm tra thắng/thua)
   */
  function afterTurn(G) {
    G.moves--;
    G.mv++;

    // Loang mực đen quái vật nếu màn có cấu hình ink
    if (G.level.ink && G.mv % G.level.ink === 0 && G.left > 0) {
      const candidateIndices = G.grid
        .map((cell, idx) => (isColorTile(cell) && !cell.sp ? idx : -1))
        .filter(idx => idx >= 0);

      if (candidateIndices.length > 0) {
        const spreadIndex = candidateIndices[Math.floor(random(G) * candidateIndices.length)];
        G.grid[spreadIndex] = {
          c: '#',
          sp: SPECIAL.NONE,
          st: BLOCKER.INK,
          cg: 0,
          hd: 0
        };
      }
    }

    fixMoves(G);

    if (G.left <= 0) {
      G.state = 'won';
    } else if (G.moves <= 0) {
      G.state = 'lost';
    }

    return true;
  }

  /**
   * Thực hiện hoán đổi 2 ô a và b
   */
  function swap(G, a, b) {
    if (!isAdjacent(a, b, N)) return false;

    const cellA = G.grid[a];
    const cellB = G.grid[b];

    // Không thể hoán đổi ô đá hoặc ô đang bị lồng nhốt
    if (!cellA || !cellB || cellA.st || cellB.st || cellA.cg || cellB.cg) {
      return false;
    }

    // Xử lý Xô sơn thần kỳ (Match 5)
    if (cellA.sp === SPECIAL.BUCKET || cellB.sp === SPECIAL.BUCKET) {
      const isABucket = cellA.sp === SPECIAL.BUCKET;
      const isBBucket = cellB.sp === SPECIAL.BUCKET;

      let targetColor = null;
      if (isABucket && isBBucket) {
        targetColor = null; // Cả hai xô chạm nhau: xóa sạch toàn bàn!
      } else {
        targetColor = isABucket ? cellB.c : cellA.c;
      }

      const clearSet = new Set([a, b]);
      G.grid.forEach((cell, idx) => {
        if (cell && !cell.st && (targetColor === null || cell.c === targetColor)) {
          clearSet.add(idx);
        }
      });

      clearCells(G, clearSet, [], 1);
      applyGravity(G);
      resolveBoard(G, -1, 1);
      afterTurn(G);
      return true;
    }

    // Hoán đổi thông thường
    G.grid[a] = cellB;
    G.grid[b] = cellA;

    // Nếu không tạo được chuỗi >= 3, hoàn tác lại vị trí
    if (!findRuns(G.grid, N).length) {
      G.grid[a] = cellA;
      G.grid[b] = cellB;
      return false;
    }

    // Kích hoạt chuỗi combo nổ
    resolveBoard(G, b, 0);
    afterTurn(G);
    return true;
  }

  /**
   * Đặt ô trọng tâm ưu tiên sơn trên tranh pixel
   */
  function setFocus(G, pixelIndex) {
    if (pixelIndex >= 0 && pixelIndex < G.pix.length) {
      const p = G.pix[pixelIndex];
      if (p.c && !p.done && G.focus !== pixelIndex) {
        G.focus = pixelIndex;
        return true;
      }
    }
    G.focus = -1;
    return false;
  }

  return {
    createGame,
    swap,
    findRuns,
    hasMove,
    fixMoves,
    setFocus,
    isAdjacent,
    resolveBoard
  };
});


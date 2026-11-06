/**
 * Paint Match - Engine (Color Alchemy & Conveyor Mechanics)
 * Đột phá cơ chế:
 * - Nghệ nhân Pha màu (Color Alchemy): Nối dải chuyển màu (Đỏ + Vàng = Cam; Xanh + Vàng = Xanh lá...)
 * - Băng chuyền tự động dịch chuyển ô sau mỗi lượt (Moving Conveyor Belt)
 * - Hệ thống tính điểm 1-3 Sao và Bộ sưu tập Bảo tàng Tranh (Gallery Museum)
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

  const { BOARD_SIZE, PIX_SIZE, BLOCKER, getMixResult } = Constants;
  const N = BOARD_SIZE;
  const PX = PIX_SIZE;

  function random(G) {
    G.rs = (G.rs * 1664525 + 1013904223) >>> 0;
    return G.rs / 4294967296;
  }

  /**
   * KIỂM TRA KỀ CẠNH 4 HƯỚNG (CHỈ NGANG VÀ DỌC)
   */
  function isAdjacent(a, b, size = N) {
    if (a < 0 || b < 0 || a >= size * size || b >= size * size || a === b) return false;
    const r1 = Math.floor(a / size), c1 = a % size;
    const r2 = Math.floor(b / size), c2 = b % size;
    const sameRow = r1 === r2;
    const sameCol = c1 === c2;
    return (sameRow && Math.abs(c1 - c2) === 1) || (sameCol && Math.abs(r1 - r2) === 1);
  }

  function makeCell(G) {
    const cols = G.level.cols;
    const color = cols[Math.floor(random(G) * cols.length)];
    return {
      c: color,
      st: BLOCKER.NONE,
      cg: 0,
      hd: 0,
      fresh: 0
    };
  }

  function isConnectable(cell) {
    return !!cell && !cell.st && !cell.cg;
  }

  /**
   * Khởi tạo bàn chơi mới
   */
  function createGame(levelIndex, levelsSource = Levels) {
    const level = levelsSource.get(levelIndex);
    const G = {
      levelIndex,
      level,
      rs: 960 + levelIndex * 47,
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
      reshuffled: false,
      conveyors: level.conveyors || []
    };

    // 1. Tạo lưới tranh pixel (8x8)
    level.a.forEach(row => {
      [...row].forEach(ch => {
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

    (level.lock || []).forEach(([r, c]) => {
      const idx = r * PX + c;
      if (G.pix[idx] && G.pix[idx].c) G.pix[idx].lock = 1;
    });

    (level.dbl || []).forEach(([r, c]) => {
      const idx = r * PX + c;
      if (G.pix[idx] && G.pix[idx].c) G.pix[idx].hp = 2;
    });

    // 2. Tạo bàn cờ (6x6)
    for (let k = 0; k < N * N; k++) {
      G.grid.push(makeCell(G));
    }

    (level.stones || []).forEach(k => {
      if (k >= 0 && k < N * N) {
        G.grid[k] = { c: '#', st: BLOCKER.STONE, cg: 0, hd: 0 };
      }
    });

    (level.cages || []).forEach(k => {
      if (k >= 0 && k < N * N && G.grid[k]) {
        G.grid[k].cg = 1;
      }
    });

    for (let h = 0; h < (level.hid || 0); h++) {
      const k = Math.floor(random(G) * N * N);
      if (isConnectable(G.grid[k])) {
        G.grid[k].hd = 1;
      }
    }

    fixMoves(G);
    return G;
  }

  /**
   * Thống kê danh sách mục tiêu màu sắc còn thiếu trên tranh
   */
  function getGoals(G) {
    const map = {};
    G.pix.forEach(p => {
      if (!p.c) return;
      if (!map[p.c]) {
        map[p.c] = { color: p.c, needed: 0, total: 0 };
      }
      map[p.c].total++;
      if (!p.done) {
        map[p.c].needed++;
      }
    });
    return Object.values(map);
  }

  /**
   * Phân tích đường nối: Kiểm tra xem là nối thuần màu hay nối Pha Màu (Color Alchemy)
   * Trả về: { isValid: boolean, isMixed: boolean, outputColor: string, colorsInvolved: string[] }
   */
  function analyzePath(G, path) {
    if (!path || path.length < 3) {
      return { isValid: false, isMixed: false, outputColor: null, colorsInvolved: [] };
    }

    const firstCell = G.grid[path[0]];
    if (!firstCell || !isConnectable(firstCell)) {
      return { isValid: false, isMixed: false, outputColor: null, colorsInvolved: [] };
    }

    const colorsInvolved = [];
    let currentColor = firstCell.c;
    colorsInvolved.push(currentColor);

    for (let i = 1; i < path.length; i++) {
      const cell = G.grid[path[i]];
      if (!cell || !isConnectable(cell)) {
        return { isValid: false, isMixed: false, outputColor: null, colorsInvolved: [] };
      }
      if (cell.c !== currentColor) {
        if (!colorsInvolved.includes(cell.c)) {
          colorsInvolved.push(cell.c);
        }
        currentColor = cell.c;
      }
    }

    // 1. Nếu tất cả ô cùng 1 màu: Nối thuần túy
    if (colorsInvolved.length === 1) {
      return {
        isValid: true,
        isMixed: false,
        outputColor: colorsInvolved[0],
        colorsInvolved
      };
    }

    // 2. Nếu có 2 màu: Kiểm tra công thức pha màu
    if (colorsInvolved.length === 2) {
      const mixed = getMixResult(colorsInvolved[0], colorsInvolved[1]);
      if (mixed) {
        return {
          isValid: true,
          isMixed: true,
          outputColor: mixed,
          colorsInvolved
        };
      }
    }

    // Không thể pha quá 2 màu hoặc không có công thức hợp lệ
    return { isValid: false, isMixed: false, outputColor: null, colorsInvolved };
  }

  /**
   * Bắn giọt sơn lên bức tranh pixel
   */
  function paintPixels(G, color, units, fromIndices, isMixed = false) {
    const fromList = Array.isArray(fromIndices) ? fromIndices : [fromIndices];
    let fromCursor = 0;

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
            dist = i;
          }

          if (dist < minDistance) {
            minDistance = dist;
            best = i;
          }
        }
      });

      if (best < 0) return;

      const targetPixel = G.pix[best];
      targetPixel.hp--;
      targetPixel.pop = 1;

      const sourceIndex = fromList[fromCursor % fromList.length];
      fromCursor++;

      G.fx.push({
        k: 'fly',
        i: sourceIndex,
        p: best,
        c: color,
        isMixed
      });

      if (targetPixel.hp <= 0) {
        targetPixel.done = 1;
        G.left--;

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
   * Trọng lực rơi kẹo từ trên xuống
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
   * KÍCH HOẠT BĂNG CHUYỀN ĐỘNG (CONVEYOR BELTS)
   * Sau mỗi lượt đi, các hàng hoặc cột có băng chuyền sẽ trượt 1 bước
   */
  function applyConveyors(G) {
    if (!G.conveyors || !G.conveyors.length) return;

    G.conveyors.forEach(cv => {
      // 1. Băng chuyền theo hàng (Row conveyor)
      if (cv.row !== undefined && cv.row >= 0 && cv.row < N) {
        const r = cv.row;
        const dir = cv.dir >= 0 ? 1 : -1; // 1 = sang phải, -1 = sang trái
        const oldRow = [];
        for (let c = 0; c < N; c++) {
          oldRow.push(G.grid[r * N + c]);
        }
        for (let c = 0; c < N; c++) {
          const fromCol = (c - dir + N) % N;
          G.grid[r * N + c] = oldRow[fromCol];
        }
        G.fx.push({ k: 'conveyor_row', row: r, dir });
      }

      // 2. Băng chuyền theo cột (Column conveyor)
      if (cv.col !== undefined && cv.col >= 0 && cv.col < N) {
        const c = cv.col;
        const dir = cv.dir >= 0 ? 1 : -1; // 1 = xuống dưới, -1 = lên trên
        const oldCol = [];
        for (let r = 0; r < N; r++) {
          oldCol.push(G.grid[r * N + c]);
        }
        for (let r = 0; r < N; r++) {
          const fromRow = (r - dir + N) % N;
          G.grid[r * N + c] = oldCol[fromRow];
        }
        G.fx.push({ k: 'conveyor_col', col: c, dir });
      }
    });
  }

  /**
   * Kiểm tra xem trên bàn cờ có ít nhất một chuỗi nối hợp lệ (cùng màu hoặc pha màu) không
   */
  function hasMove(G) {
    // 1. Kiểm tra dải 3 ô cùng màu kề nhau theo 4 hướng
    for (let i = 0; i < N * N; i++) {
      const cellA = G.grid[i];
      if (!isConnectable(cellA)) continue;

      const r = Math.floor(i / N), c = i % N;
      const deltas = [[-1, 0], [1, 0], [0, -1], [0, 1]];

      for (const [dr1, dc1] of deltas) {
        const nr1 = r + dr1, nc1 = c + dc1;
        if (nr1 >= 0 && nr1 < N && nc1 >= 0 && nc1 < N) {
          const j = nr1 * N + nc1;
          const cellB = G.grid[j];
          if (isConnectable(cellB) && cellB.c === cellA.c) {
            // Kiểm tra tiếp ô thứ 3
            for (const [dr2, dc2] of deltas) {
              const nr2 = nr1 + dr2, nc2 = nc1 + dc2;
              if (nr2 >= 0 && nr2 < N && nc2 >= 0 && nc2 < N) {
                const k = nr2 * N + nc2;
                if (k !== i) {
                  const cellC = G.grid[k];
                  if (isConnectable(cellC) && cellC.c === cellA.c) return true;
                }
              }
            }
          }
        }
      }
    }

    // 2. Kiểm tra chuỗi pha màu hợp lệ (ví dụ: A - A - B hoặc A - B - B)
    for (let i = 0; i < N * N; i++) {
      const cellA = G.grid[i];
      if (!isConnectable(cellA)) continue;

      const r = Math.floor(i / N), c = i % N;
      const deltas = [[-1, 0], [1, 0], [0, -1], [0, 1]];

      for (const [dr, dc] of deltas) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
          const j = nr * N + nc;
          const cellB = G.grid[j];
          if (isConnectable(cellB) && getMixResult(cellA.c, cellB.c)) {
            return true; // Có cơ hội pha màu
          }
        }
      }
    }

    return false;
  }

  function fixMoves(G) {
    let attempts = 0;
    while (attempts < 60 && !hasMove(G)) {
      attempts++;
      const availableIndices = G.grid
        .map((cell, idx) => (isConnectable(cell) ? idx : -1))
        .filter(idx => idx >= 0);

      availableIndices.forEach(idx => {
        G.grid[idx].c = G.level.cols[Math.floor(random(G) * G.level.cols.length)];
      });
      G.reshuffled = true;
    }
  }

  /**
   * Tính số sao đạt được khi chiến thắng (1 đến 3 sao)
   */
  function calculateStars(G) {
    const ratio = G.moves / G.initialMoves;
    if (ratio >= 0.4) return 3; // Dư từ 40% số lượt trở lên -> 3 sao ⭐⭐⭐
    if (ratio >= 0.15) return 2; // Dư từ 15% số lượt trở lên -> 2 sao ⭐⭐
    return 1; // 1 sao ⭐
  }

  /**
   * Cập nhật sau lượt đi (trừ lượt, mực loang, trượt băng chuyền)
   */
  function afterTurn(G) {
    G.moves--;
    G.mv++;

    // 1. Dịch chuyển băng chuyền
    applyConveyors(G);

    // 2. Loang mực
    if (G.level.ink && G.mv % G.level.ink === 0 && G.left > 0) {
      const candidateIndices = G.grid
        .map((cell, idx) => (isConnectable(cell) ? idx : -1))
        .filter(idx => idx >= 0);

      if (candidateIndices.length > 0) {
        const spreadIndex = candidateIndices[Math.floor(random(G) * candidateIndices.length)];
        G.grid[spreadIndex] = {
          c: '#',
          st: BLOCKER.INK,
          cg: 0,
          hd: 0
        };
      }
    }

    fixMoves(G);

    if (G.left <= 0) {
      G.state = 'won';
      G.stars = calculateStars(G);
    } else if (G.moves <= 0) {
      G.state = 'lost';
    }

    return true;
  }

  /**
   * Thực hiện kết nối một đường vẽ (Line Connect)
   * Hỗ trợ cả Nối Thuần Màu và Nối Pha Màu (Color Alchemy)
   */
  function executeConnect(G, path, isLoop = false) {
    const analysis = analyzePath(G, path);
    if (!analysis.isValid) return false;

    const { outputColor, isMixed } = analysis;
    let clearedSet = new Set();

    // Kiểm tra xem màu kết quả có còn thiếu trên tranh không
    const neededOnCanvas = G.pix.filter(p => p.c === outputColor && !p.done).length;
    const isWasteColor = neededOnCanvas === 0;

    // 1. Xử lý Super Nova nếu tạo thành Loop khép kín
    if (isLoop) {
      analysis.colorsInvolved.forEach(col => {
        G.grid.forEach((cell, idx) => {
          if (cell && isConnectable(cell) && cell.c === col) {
            clearedSet.add(idx);
          }
        });
      });
      G.fx.push({ k: 'super_nova', c: outputColor, isMixed, waste: isWasteColor });
    } else {
      path.forEach(idx => clearedSet.add(idx));
      if (isWasteColor) {
        G.fx.push({ k: 'waste', c: outputColor });
      }
    }

    // 2. Gây sát thương các ô blocker lân cận (4 hướng)
    const damagedSet = new Set();
    clearedSet.forEach(idx => {
      const r = Math.floor(idx / N), c = idx % N;
      const deltas = [[-1, 0], [1, 0], [0, -1], [0, 1]];

      for (const [dr, dc] of deltas) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
          const j = nr * N + nc;
          if (!clearedSet.has(j) && G.grid[j]) {
            const neighbor = G.grid[j];
            if (neighbor.st) {
              damagedSet.add(j);
            } else {
              neighbor.cg = 0;
              neighbor.hd = 0;
            }
          }
        }
      }
    });

    // 3. Bắn sơn lên tranh pixel nếu màu này còn thiếu
    if (!isWasteColor) {
      const baseCount = clearedSet.size;
      const lengthBonus = Math.max(0, path.length - 3);
      const loopBonus = isLoop ? 4 : 0;
      const mixBonus = isMixed ? 2 : 0; // Thưởng thêm giọt sơn khi pha màu thành công!
      const totalUnits = baseCount + lengthBonus + loopBonus + mixBonus;
      paintPixels(G, outputColor, totalUnits, Array.from(clearedSet), isMixed);
    }

    // 4. Hiệu ứng nổ ô
    [...clearedSet, ...damagedSet].forEach(idx => {
      if (G.grid[idx]) {
        G.fx.push({
          k: 'pop',
          i: idx,
          c: G.grid[idx].c,
          st: G.grid[idx].st
        });
      }
      G.grid[idx] = null;
    });

    applyGravity(G);
    afterTurn(G);

    return {
      success: true,
      isWasteColor,
      isMixed,
      outputColor,
      clearedCount: clearedSet.size
    };
  }

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
    isAdjacent,
    isConnectable,
    analyzePath,
    executeConnect,
    hasMove,
    fixMoves,
    setFocus,
    getGoals,
    calculateStars,
    paintPixels
  };
});

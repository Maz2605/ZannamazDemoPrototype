/**
 * Paint Match - Canvas Renderer (Color Alchemy & Conveyor Belts)
 * Đồ họa nâng cấp toàn diện:
 * - Giá vẽ tranh khổng lồ 272px x 272px với từng điểm ảnh 32px 3D nổi khối
 * - Đường nối đổi màu dạ quang (Color Alchemy Gradient) khi pha 2 màu
 * - Băng chuyền động (Conveyor Belts) với mũi tên dạ quang trượt động
 * - Hạt lấp lánh ma thuật pha màu, sao băng, sóng loang nước và confetti
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const Constants = require('./constants.js');
    module.exports = factory(Constants);
  } else {
    root.PaintMatch = root.PaintMatch || {};
    root.PaintMatch.Renderer = factory(root.PaintMatch.Constants);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Constants) {
  'use strict';

  const { BOARD_SIZE, PIX_SIZE, COLORS, LAYOUT, BLOCKER } = Constants;
  const N = BOARD_SIZE;
  const PX = PIX_SIZE;

  function getBoardCellCenter(index) {
    const col = index % N;
    const row = Math.floor(index / N);
    return {
      x: LAYOUT.BOARD_X + col * LAYOUT.CELL_SIZE + LAYOUT.CELL_SIZE / 2,
      y: LAYOUT.BOARD_Y + row * LAYOUT.CELL_SIZE + LAYOUT.CELL_SIZE / 2
    };
  }

  function getPixelCellCenter(index) {
    const col = index % PX;
    const row = Math.floor(index / PX);
    return {
      x: LAYOUT.PIX_X + col * LAYOUT.PIX_CELL_SIZE + LAYOUT.PIX_CELL_SIZE / 2,
      y: LAYOUT.PIX_Y + row * LAYOUT.PIX_CELL_SIZE + LAYOUT.PIX_CELL_SIZE / 2
    };
  }

  function roundRect(ctx, x, y, width, height, radius) {
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
    } else {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }
  }

  function drawBlob(ctx, item, x, y, scale = 1, isHighlighted = false, isPulsing = false) {
    const baseColor = item.hd ? '#b9b0c9' : (COLORS[item.c] || '#cccccc');

    ctx.save();
    ctx.translate(x, y);

    const actualScale = scale * (isHighlighted ? 1.15 : (isPulsing ? 1.08 : 1.0));
    ctx.scale(actualScale, actualScale);

    if (isHighlighted || isPulsing) {
      ctx.save();
      ctx.shadowColor = isPulsing ? '#ffd700' : baseColor;
      ctx.shadowBlur = isPulsing ? 22 : 16;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (item.st === BLOCKER.STONE) {
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🪨', 0, 2);
      ctx.restore();
      return;
    }

    if (item.st === BLOCKER.INK) {
      ctx.fillStyle = '#36244d';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-5.5, -3, 3.5, 0, Math.PI * 2);
      ctx.arc(5.5, -3, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#36244d';
      ctx.fillRect(-8.5, -7.5, 7, 2);
      ctx.fillRect(1.5, -7.5, 7, 2);

      ctx.beginPath();
      ctx.arc(-5.5, -3, 1.6, 0, Math.PI * 2);
      ctx.arc(5.5, -3, 1.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillRect(-4.5, 6, 9, 2);
      ctx.restore();
      return;
    }

    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.ellipse(0, 1, 18, 16.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 2.2;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.ellipse(-7, -7.5, 4.5, 2.8, -0.6, 0, Math.PI * 2);
    ctx.fill();

    if (item.hd) {
      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 0, 2);
    } else {
      ctx.fillStyle = '#3a2a4d';
      ctx.beginPath();
      ctx.arc(-6, -2, 2.3, 0, Math.PI * 2);
      ctx.arc(6, -2, 2.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-6.8, -2.8, 0.8, 0, Math.PI * 2);
      ctx.arc(5.2, -2.8, 0.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#3a2a4d';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 2.5, 3, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 107, 154, 0.35)';
      ctx.beginPath();
      ctx.ellipse(-11, 3.5, 3, 1.8, 0, 0, Math.PI * 2);
      ctx.ellipse(11, 3.5, 3, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (item.cg) {
      ctx.strokeStyle = '#686878';
      ctx.lineWidth = 2.5;
      for (let k = -10; k <= 10; k += 7) {
        ctx.beginPath();
        ctx.moveTo(k, -18);
        ctx.lineTo(k, 18);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-18, -7);
      ctx.lineTo(18, -7);
      ctx.moveTo(-18, 7);
      ctx.lineTo(18, 7);
      ctx.stroke();
    }

    ctx.restore();
  }

  function createRenderer(canvas) {
    const ctx = canvas.getContext('2d');
    let visualFx = [];
    let flyParticles = [];
    let splatRipples = [];
    let splatDroplets = [];
    let confettiList = [];
    let hasSpawnedVictoryConfetti = false;
    let animTime = 0;

    function spawnVictoryConfetti() {
      if (hasSpawnedVictoryConfetti) return;
      hasSpawnedVictoryConfetti = true;

      const colors = ['#ff3d57', '#ff8522', '#ffc814', '#38cf70', '#319cf0', '#9154f8', '#ff5c98'];
      for (let i = 0; i < 90; i++) {
        confettiList.push({
          x: Math.random() * LAYOUT.VIRTUAL_WIDTH,
          y: -20 - Math.random() * 80,
          vx: (Math.random() - 0.5) * 80,
          vy: 80 + Math.random() * 140,
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 10,
          w: 6 + Math.random() * 6,
          h: 4 + Math.random() * 4,
          c: colors[Math.floor(Math.random() * colors.length)],
          t: 0,
          life: 3.5 + Math.random() * 2
        });
      }
    }

    function render(G, activePath = [], isLoop = false, pointerPos = null, goals = [], pathAnalysis = null) {
      const scaleFactor = canvas.width / LAYOUT.VIRTUAL_WIDTH;
      ctx.setTransform(scaleFactor, 0, 0, scaleFactor, 0, 0);
      ctx.clearRect(0, 0, LAYOUT.VIRTUAL_WIDTH, LAYOUT.VIRTUAL_HEIGHT);

      const isWon = G.state === 'won';
      if (isWon) spawnVictoryConfetti();

      // =========================================================
      // 1. GIÁ VẼ TRANH KHỔNG LỒ (272px x 272px)
      // =========================================================
      const canvasWidth = PX * LAYOUT.PIX_CELL_SIZE;
      const canvasHeight = PX * LAYOUT.PIX_CELL_SIZE;

      ctx.save();
      ctx.fillStyle = 'rgba(74, 56, 104, 0.16)';
      roundRect(ctx, LAYOUT.PIX_X - 10, LAYOUT.PIX_Y - 6, canvasWidth + 20, canvasHeight + 20, 24);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      roundRect(ctx, LAYOUT.PIX_X - 8, LAYOUT.PIX_Y - 6, canvasWidth + 16, canvasHeight + 16, 22);
      ctx.fill();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = isWon ? '#ffd700' : '#ffc4dc';
      ctx.stroke();

      const rivets = [
        { x: LAYOUT.PIX_X - 2, y: LAYOUT.PIX_Y },
        { x: LAYOUT.PIX_X + canvasWidth + 2, y: LAYOUT.PIX_Y },
        { x: LAYOUT.PIX_X - 2, y: LAYOUT.PIX_Y + canvasHeight + 4 },
        { x: LAYOUT.PIX_X + canvasWidth + 2, y: LAYOUT.PIX_Y + canvasHeight + 4 }
      ];
      rivets.forEach(rv => {
        ctx.fillStyle = '#e8b898';
        ctx.beginPath();
        ctx.arc(rv.x, rv.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#c48e6a';
        ctx.stroke();
      });

      // VẼ TỪNG PIXEL TRANH 3D NỔI KHỐI (32px mỗi ô)
      const cellSize = LAYOUT.PIX_CELL_SIZE;
      const pixelSize = cellSize - 3;

      G.pix.forEach((p, i) => {
        if (!p.c) return;
        const pt = getPixelCellCenter(i);
        const popScale = 1 + (p.pop || 0) * 0.4;

        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.scale(popScale, popScale);

        const hex = COLORS[p.c] || '#dddddd';
        const half = pixelSize / 2;

        if (p.done) {
          ctx.fillStyle = hex;
          roundRect(ctx, -half, -half, pixelSize, pixelSize, 8);
          ctx.fill();

          ctx.lineWidth = 1.5;
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
          ctx.stroke();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
          roundRect(ctx, -half + 3, -half + 3, 9, 4.5, 3);
          ctx.fill();
        } else {
          ctx.globalAlpha = 0.28;
          ctx.fillStyle = hex;
          roundRect(ctx, -half, -half, pixelSize, pixelSize, 8);
          ctx.fill();
          ctx.globalAlpha = 1;

          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#d5c4e8';
          roundRect(ctx, -half, -half, pixelSize, pixelSize, 8);
          ctx.stroke();

          if (p.hp === 2) {
            ctx.fillStyle = hex;
            ctx.fillRect(-half, 0, pixelSize, half);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('x2', 0, 1);
          }

          ctx.fillStyle = hex;
          ctx.beginPath();
          ctx.arc(0, -5, 4.5, 0, Math.PI * 2);
          ctx.fill();

          if (p.lock) {
            ctx.font = '15px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔒', 0, 4);
          }
        }
        ctx.restore();
      });

      if (G.focus >= 0) {
        const pt = getPixelCellCenter(G.focus);
        ctx.strokeStyle = '#ff3377';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([5, 4]);
        roundRect(ctx, pt.x - cellSize / 2 - 2, pt.y - cellSize / 2 - 2, cellSize + 4, cellSize + 4, 10);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();

      // =========================================================
      // 2. THANH MỤC TIÊU MÀU SẮC & GỢI Ý PHA MÀU
      // =========================================================
      if (goals && goals.length > 0) {
        ctx.save();
        const trackerWidth = 310;
        const trackerX = (LAYOUT.VIRTUAL_WIDTH - trackerWidth) / 2;
        const trackerY = LAYOUT.GOALS_Y;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        roundRect(ctx, trackerX, trackerY, trackerWidth, LAYOUT.GOALS_HEIGHT, 14);
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#e6d8f2';
        ctx.stroke();

        const totalItems = goals.length;
        const itemSpacing = trackerWidth / totalItems;

        goals.forEach((g, idx) => {
          const itemX = trackerX + itemSpacing * idx + itemSpacing / 2;
          const itemY = trackerY + LAYOUT.GOALS_HEIGHT / 2;
          const hex = COLORS[g.color] || '#aaaaaa';
          const isDone = g.needed === 0;

          ctx.fillStyle = hex;
          ctx.beginPath();
          ctx.arc(itemX - 8, itemY, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(0,0,0,0.15)';
          ctx.stroke();

          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          if (isDone) {
            ctx.fillStyle = '#2eb85c';
            ctx.fillText('✓', itemX + 2, itemY);
          } else {
            ctx.fillStyle = '#4a3868';
            ctx.fillText(g.needed, itemX + 2, itemY);
          }
        });
        ctx.restore();
      }

      // =========================================================
      // 3. BÀN CHƠI LINE CONNECT 4 HƯỚNG & BĂNG CHUYỀN ĐỘNG
      // =========================================================
      const boardWidth = N * LAYOUT.CELL_SIZE;
      const boardHeight = N * LAYOUT.CELL_SIZE;

      ctx.save();
      ctx.fillStyle = 'rgba(74, 56, 104, 0.08)';
      roundRect(ctx, LAYOUT.BOARD_X - 8, LAYOUT.BOARD_Y - 6, boardWidth + 16, boardHeight + 16, 22);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      roundRect(ctx, LAYOUT.BOARD_X - 6, LAYOUT.BOARD_Y - 6, boardWidth + 12, boardHeight + 12, 20);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#eddcf7';
      ctx.stroke();

      // Nền caro
      for (let i = 0; i < N * N; i++) {
        const pt = getBoardCellCenter(i);
        const isOdd = ((i % N) + Math.floor(i / N)) % 2 === 1;
        ctx.fillStyle = isOdd ? '#f6edfc' : '#fef4f9';
        roundRect(ctx, pt.x - LAYOUT.CELL_SIZE / 2 + 2, pt.y - LAYOUT.CELL_SIZE / 2 + 2, LAYOUT.CELL_SIZE - 4, LAYOUT.CELL_SIZE - 4, 11);
        ctx.fill();
      }

      // VẼ MŨI TÊN BĂNG CHUYỀN ĐỘNG (CONVEYOR BELTS)
      if (G.conveyors && G.conveyors.length > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(156, 100, 254, 0.25)';
        ctx.strokeStyle = 'rgba(156, 100, 254, 0.6)';
        ctx.lineWidth = 2;

        const pulseOffset = Math.sin(animTime * 4) * 3;

        G.conveyors.forEach(cv => {
          if (cv.row !== undefined) {
            const y = LAYOUT.BOARD_Y + cv.row * LAYOUT.CELL_SIZE + LAYOUT.CELL_SIZE / 2;
            const dir = cv.dir >= 0 ? 1 : -1;
            // Vẽ dải mũi tên nhỏ bên mép
            const arrowX = dir > 0 ? LAYOUT.BOARD_X - 3 + pulseOffset : LAYOUT.BOARD_X + boardWidth + 3 - pulseOffset;
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(dir > 0 ? '▶' : '◀', arrowX, y);
          }
          if (cv.col !== undefined) {
            const x = LAYOUT.BOARD_X + cv.col * LAYOUT.CELL_SIZE + LAYOUT.CELL_SIZE / 2;
            const dir = cv.dir >= 0 ? 1 : -1;
            const arrowY = dir > 0 ? LAYOUT.BOARD_Y - 3 + pulseOffset : LAYOUT.BOARD_Y + boardHeight + 3 - pulseOffset;
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(dir > 0 ? '▼' : '▲', x, arrowY);
          }
        });
        ctx.restore();
      }

      // =========================================================
      // VẼ ĐƯỜNG DẠ QUANG PHA MÀU (COLOR ALCHEMY GRADIENT GLOW)
      // =========================================================
      const pathSet = new Set(activePath);
      const isPathLongEnough = activePath.length >= 3;
      const isMixed = pathAnalysis && pathAnalysis.isMixed;
      const outputColor = pathAnalysis ? pathAnalysis.outputColor : null;

      if (activePath.length > 0) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Tạo Gradient nếu đang pha 2 màu
        let strokeStyle;
        if (isLoop) {
          strokeStyle = '#ffd700';
        } else if (isMixed && activePath.length >= 2) {
          const ptStart = getBoardCellCenter(activePath[0]);
          const ptEnd = getBoardCellCenter(activePath[activePath.length - 1]);
          const grad = ctx.createLinearGradient(ptStart.x, ptStart.y, ptEnd.x, ptEnd.y);
          const col1 = G.grid[activePath[0]] ? COLORS[G.grid[activePath[0]].c] : '#ff4d8d';
          const col2 = COLORS[outputColor] || '#ffd026';
          grad.addColorStop(0, col1);
          grad.addColorStop(1, col2);
          strokeStyle = grad;
        } else if (G.grid[activePath[0]]) {
          strokeStyle = COLORS[G.grid[activePath[0]].c] || '#ff4d8d';
        } else {
          strokeStyle = '#ff4d8d';
        }

        const glowWidth = isLoop ? 16 : (isPathLongEnough ? 12 : 7);

        ctx.shadowColor = isLoop ? '#ffd700' : (COLORS[outputColor] || '#ff4d8d');
        ctx.shadowBlur = isPathLongEnough ? (isLoop ? 24 : 16) : 4;
        ctx.strokeStyle = isPathLongEnough ? strokeStyle : 'rgba(160, 140, 180, 0.6)';
        ctx.lineWidth = glowWidth;

        ctx.beginPath();
        activePath.forEach((idx, i) => {
          const pt = getBoardCellCenter(idx);
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        if (pointerPos && activePath.length > 0) {
          ctx.lineTo(pointerPos.x, pointerPos.y);
        }
        ctx.stroke();

        // Lớp lõi sáng
        if (isPathLongEnough) {
          ctx.shadowBlur = 0;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = isLoop ? 6 : 4;
          ctx.stroke();
        }

        ctx.restore();
      }

      // Thông báo trạng thái Pha Màu hoặc Super Nova
      if (activePath.length >= 3 && outputColor) {
        ctx.save();
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;

        if (isLoop) {
          ctx.fillStyle = '#ff3377';
          ctx.fillText('⚡ SIÊU BÃO MÀU (SUPER NOVA)! ⚡', LAYOUT.BOARD_X + boardWidth / 2, LAYOUT.BOARD_Y - 20);
        } else if (isMixed) {
          ctx.fillStyle = COLORS[outputColor] || '#ff8522';
          ctx.fillText(`🧪 PHA MÀU THÀNH CÔNG: ${Constants.COLOR_NAMES[outputColor] || outputColor}! ✨`, LAYOUT.BOARD_X + boardWidth / 2, LAYOUT.BOARD_Y - 20);
        }
        ctx.restore();
      }

      // VẼ CÁC GIỌT SƠN TRÊN BÀN CỜ
      const currentColorCode = activePath.length > 0 && G.grid[activePath[0]] ? G.grid[activePath[0]].c : null;

      G.grid.forEach((cell, i) => {
        if (!cell) return;
        const isSelected = pathSet.has(i);
        const isPulsing = isLoop && (cell.c === currentColorCode || (pathAnalysis && pathAnalysis.colorsInvolved.includes(cell.c)));
        drawBlob(ctx, cell, cell.x, cell.y, 1, isSelected, isPulsing);
      });

      // =========================================================
      // 4. VỆT SAO BĂNG, NƯỚC LOANG & CONFETTI
      // =========================================================
      flyParticles.forEach(p => {
        const t = Math.min(1, p.t / 0.52);
        const easeOut = 1 - Math.pow(1 - t, 3);
        const x = p.x0 + (p.x1 - p.x0) * easeOut;
        const arcY = Math.sin(t * Math.PI) * 70;
        const y = p.y0 + (p.y1 - p.y0) * easeOut - arcY;

        const color = COLORS[p.c] || '#ffffff';

        p.trail = p.trail || [];
        p.trail.push({ x, y });
        if (p.trail.length > 6) p.trail.shift();

        ctx.save();
        for (let j = 0; j < p.trail.length; j++) {
          const pt = p.trail[j];
          const alpha = (j + 1) / p.trail.length * 0.6;
          const r = 3 + (j + 1) / p.trail.length * 4.5;
          ctx.fillStyle = color;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = 1;
        ctx.shadowColor = color;
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 8.5 * (1 - t * 0.25), 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 5.5, 0, Math.PI * 2);
        ctx.fill();

        // Biểu tượng lấp lánh nếu là màu pha
        if (p.isMixed) {
          ctx.font = '12px sans-serif';
          ctx.fillText('✨', x + 6, y - 6);
        }
        ctx.restore();
      });

      splatRipples.forEach(r => {
        const progress = r.t / 0.45;
        const alpha = Math.max(0, 1 - progress);
        const radius = r.maxR * Math.sqrt(progress);

        ctx.save();
        ctx.globalAlpha = alpha * 0.7;
        ctx.strokeStyle = r.c;
        ctx.lineWidth = 3.5 * (1 - progress);
        ctx.beginPath();
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      splatDroplets.forEach(d => {
        const alpha = Math.max(0, 1 - d.t / 0.5);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = d.c;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      visualFx.forEach(fx => {
        const remaining = 1 - fx.t / 0.28;
        if (remaining > 0) {
          ctx.globalAlpha = remaining;
          drawBlob(
            ctx,
            { c: fx.c, st: fx.c === '#' ? BLOCKER.STONE : BLOCKER.NONE, cg: 0, hd: 0 },
            fx.x,
            fx.y,
            1 + (1 - remaining) * 0.6
          );
          ctx.globalAlpha = 1;
        }
      });

      confettiList.forEach(c => {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.fillStyle = c.c;
        ctx.globalAlpha = Math.min(1, Math.max(0, (c.life - c.t) / 1.0));
        ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
        ctx.restore();
      });

      ctx.restore();
    }

    function update(dt, G) {
      animTime += dt;

      G.fx.splice(0).forEach(f => {
        if (f.k === 'pop') {
          const pt = getBoardCellCenter(f.i);
          visualFx.push({ x: pt.x, y: pt.y, c: f.c, t: 0 });
        } else if (f.k === 'fly') {
          const fromPt = getBoardCellCenter(f.i >= 0 ? f.i : 0);
          const toPt = getPixelCellCenter(f.p);
          flyParticles.push({
            x0: fromPt.x,
            y0: fromPt.y,
            x1: toPt.x,
            y1: toPt.y,
            c: f.c,
            p: f.p,
            isMixed: f.isMixed,
            t: -flyParticles.length * 0.035,
            trail: []
          });
        }
      });

      G.grid.forEach((cell, i) => {
        if (!cell) return;
        const targetPt = getBoardCellCenter(i);
        if (cell.fresh) {
          cell.fresh = 0;
          cell.x = targetPt.x;
          cell.y = targetPt.y - N * LAYOUT.CELL_SIZE - 25;
        }
        const smoothRate = Math.min(1, dt * 18);
        cell.x += (targetPt.x - cell.x) * smoothRate;
        cell.y += (targetPt.y - cell.y) * smoothRate;
      });

      visualFx.forEach(fx => (fx.t += dt));
      visualFx = visualFx.filter(fx => fx.t < 0.28);

      flyParticles.forEach(p => (p.t += dt));
      flyParticles = flyParticles.filter(p => {
        if (p.t >= 0.52) {
          const hex = COLORS[p.c] || '#ffffff';
          splatRipples.push({
            x: p.x1,
            y: p.y1,
            maxR: 30,
            c: hex,
            t: 0
          });

          for (let k = 0; k < 7; k++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 70;
            splatDroplets.push({
              x: p.x1,
              y: p.y1,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              r: 2.5 + Math.random() * 2.5,
              c: hex,
              t: 0
            });
          }
          return false;
        }
        return true;
      });

      splatRipples.forEach(r => (r.t += dt));
      splatRipples = splatRipples.filter(r => r.t < 0.45);

      splatDroplets.forEach(d => {
        d.t += dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.vy += 120 * dt;
      });
      splatDroplets = splatDroplets.filter(d => d.t < 0.5);

      confettiList.forEach(c => {
        c.t += dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.rot += c.vrot * dt;
      });
      confettiList = confettiList.filter(c => c.t < c.life && c.y < LAYOUT.VIRTUAL_HEIGHT + 30);

      G.pix.forEach(p => {
        if (p.pop > 0) p.pop = Math.max(0, p.pop - dt * 3.5);
      });
    }

    function clearParticles() {
      visualFx = [];
      flyParticles = [];
      splatRipples = [];
      splatDroplets = [];
      confettiList = [];
      hasSpawnedVictoryConfetti = false;
    }

    function hasActiveFlyingParticles() {
      return flyParticles.length > 0 || splatRipples.length > 0;
    }

    return {
      render,
      update,
      clearParticles,
      hasActiveFlyingParticles,
      getBoardCellCenter,
      getPixelCellCenter
    };
  }

  return {
    createRenderer,
    getBoardCellCenter,
    getPixelCellCenter
  };
});

/**
 * Paint Match - Canvas Renderer
 * Đảm nhiệm toàn bộ việc vẽ tranh pixel, bàn cờ Match-3, các bạn giọt sơn hoạt hình,
 * hiệu ứng giọt sơn bay theo đường cong parabol và tia sáng lấp lánh.
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

  const { BOARD_SIZE, PIX_SIZE, COLORS, LAYOUT, BLOCKER, SPECIAL } = Constants;
  const N = BOARD_SIZE;
  const PX = PIX_SIZE;

  // Tính tọa độ tâm ô bàn cờ (Match-3)
  function getBoardCellCenter(index) {
    const col = index % N;
    const row = Math.floor(index / N);
    return {
      x: LAYOUT.BOARD_X + col * LAYOUT.CELL_SIZE + LAYOUT.CELL_SIZE / 2,
      y: LAYOUT.BOARD_Y + row * LAYOUT.CELL_SIZE + LAYOUT.CELL_SIZE / 2
    };
  }

  // Tính tọa độ tâm ô tranh pixel
  function getPixelCellCenter(index) {
    const col = index % PX;
    const row = Math.floor(index / PX);
    return {
      x: LAYOUT.PIX_X + col * LAYOUT.PIX_CELL_SIZE + LAYOUT.PIX_CELL_SIZE / 2,
      y: LAYOUT.PIX_Y + row * LAYOUT.PIX_CELL_SIZE + LAYOUT.PIX_CELL_SIZE / 2
    };
  }

  // Vẽ hình chữ nhật bo góc tương thích mọi trình duyệt
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

  /**
   * Vẽ một bạn giọt sơn hoặc chướng ngại vật
   */
  function drawBlob(ctx, item, x, y, scale = 1) {
    const color = item.hd ? '#b9b0c9' : (item.c === '*' ? '#ffffff' : (COLORS[item.c] || '#cccccc'));

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // 1. Chướng ngại vật: Ô đá
    if (item.st === BLOCKER.STONE) {
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🪨', 0, 2);
      ctx.restore();
      return;
    }

    // 2. Chướng ngại vật: Quái vật mực loang
    if (item.st === BLOCKER.INK) {
      ctx.fillStyle = '#3b2a55';
      ctx.beginPath();
      ctx.arc(0, 0, 19, 0, Math.PI * 2);
      ctx.fill();

      // Mắt quái vật giận dữ
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-6, -3, 4, 0, Math.PI * 2);
      ctx.arc(6, -3, 4, 0, Math.PI * 2);
      ctx.fill();

      // Lông mày cau có
      ctx.fillStyle = '#3b2a55';
      ctx.fillRect(-9, -8, 8, 2);
      ctx.fillRect(2, -8, 8, 2);

      // Con ngươi tím
      ctx.beginPath();
      ctx.arc(-6, -3, 1.8, 0, Math.PI * 2);
      ctx.arc(6, -3, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Miệng ngậm ngang
      ctx.fillRect(-5, 7, 10, 2);
      ctx.restore();
      return;
    }

    // 3. Giọt sơn màu sắc có đôi mắt dễ thương
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 1, 20, 18.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Viền bóng nhẹ
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#00000022';
    ctx.stroke();

    // Điểm phản chiếu ánh sáng (glossy highlight)
    ctx.fillStyle = '#ffffff88';
    ctx.beginPath();
    ctx.ellipse(-8, -9, 5, 3, -0.6, 0, Math.PI * 2);
    ctx.fill();

    // Ô ẩn dấu hỏi chấm
    if (item.hd) {
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 0, 2);
    }
    // Xô sơn thần kỳ (Match 5)
    else if (item.c === '*' || item.sp === SPECIAL.BUCKET) {
      ctx.font = '26px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🪣', 0, 2);
    }
    // Khuôn mặt kẹo sơn cười ngọt ngào
    else {
      // Đôi mắt to tròn
      ctx.fillStyle = '#3a2a4d';
      ctx.beginPath();
      ctx.arc(-6.5, -2, 2.6, 0, Math.PI * 2);
      ctx.arc(6.5, -2, 2.6, 0, Math.PI * 2);
      ctx.fill();

      // Đốm sáng trong mắt
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-7.3, -3, 0.9, 0, Math.PI * 2);
      ctx.arc(5.7, -3, 0.9, 0, Math.PI * 2);
      ctx.fill();

      // Nụ cười mỉm
      ctx.strokeStyle = '#3a2a4d';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 3, 3.5, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();

      // Đôi má hồng đào
      ctx.fillStyle = '#ff6b9a44';
      ctx.beginPath();
      ctx.ellipse(-12, 4, 3.5, 2, 0, 0, Math.PI * 2);
      ctx.ellipse(12, 4, 3.5, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Biểu tượng Cọ vẽ ở góc (Match 4)
      if (item.sp === SPECIAL.BRUSH) {
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🖌️', 9, -12);
      }
    }

    // Lồng sắt nhốt kẹo
    if (item.cg) {
      ctx.strokeStyle = '#6b6b7a';
      ctx.lineWidth = 3;
      for (let k = -12; k <= 12; k += 8) {
        ctx.beginPath();
        ctx.moveTo(k, -21);
        ctx.lineTo(k, 21);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-21, -9);
      ctx.lineTo(21, -9);
      ctx.moveTo(-21, 9);
      ctx.lineTo(21, 9);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Khởi tạo Renderer gắn với Canvas
   */
  function createRenderer(canvas) {
    const ctx = canvas.getContext('2d');
    let visualFx = [];
    let flyParticles = [];
    let sparkleParticles = [];

    function render(G, selectedIndex = -1) {
      const scaleFactor = canvas.width / LAYOUT.VIRTUAL_WIDTH;
      ctx.setTransform(scaleFactor, 0, 0, scaleFactor, 0, 0);
      ctx.clearRect(0, 0, LAYOUT.VIRTUAL_WIDTH, LAYOUT.VIRTUAL_HEIGHT);

      // 1. VẼ KHUNG TRANH PIXEL NGHỆ THUẬT
      ctx.fillStyle = '#ffffffcc';
      roundRect(ctx, LAYOUT.PIX_X - 12, LAYOUT.PIX_Y - 12, PX * LAYOUT.PIX_CELL_SIZE + 24, PX * LAYOUT.PIX_CELL_SIZE + 24, 22);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffb3d1';
      ctx.stroke();

      // Vẽ từng ô pixel tranh
      G.pix.forEach((p, i) => {
        if (!p.c) return;
        const pt = getPixelCellCenter(i);
        const popScale = 1 + (p.pop || 0) * 0.35;

        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.scale(popScale, popScale);

        const hex = COLORS[p.c] || '#dddddd';

        if (p.done) {
          // Ô đã tô xong: màu tươi rực rỡ và bóng nhẹ
          ctx.fillStyle = hex;
          roundRect(ctx, -10, -10, 20, 20, 6);
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#00000022';
          ctx.stroke();

          // Điểm bóng
          ctx.fillStyle = '#ffffff66';
          roundRect(ctx, -7, -7, 6, 3, 2);
          ctx.fill();
        } else {
          // Ô chưa tô: màu nhạt mờ gợi ý
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = hex;
          roundRect(ctx, -10, -10, 20, 20, 6);
          ctx.fill();
          ctx.globalAlpha = 1;

          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#c9b8dd';
          roundRect(ctx, -10, -10, 20, 20, 6);
          ctx.stroke();

          // Ô cần 2 lớp sơn
          if (p.hp === 2) {
            ctx.fillStyle = hex;
            ctx.fillRect(-10, -2, 20, 12);
            ctx.fillStyle = '#ffffffdd';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('x2', 0, 0);
          }

          // Chấm tròn nhỏ hiển thị màu
          ctx.fillStyle = hex;
          ctx.beginPath();
          ctx.arc(0, -4, 3, 0, Math.PI * 2);
          ctx.fill();

          // Biểu tượng ổ khóa
          if (p.lock) {
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔒', 0, 3);
          }
        }
        ctx.restore();
      });

      // Vòng tròn nét đứt đánh dấu ô trọng tâm đang chọn
      if (G.focus >= 0) {
        const pt = getPixelCellCenter(G.focus);
        ctx.strokeStyle = '#ff4d8d';
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 3]);
        roundRect(ctx, pt.x - 12, pt.y - 12, 24, 24, 7);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 2. VẼ BÀN CỜ MATCH-3
      ctx.fillStyle = '#ffffffcc';
      roundRect(ctx, LAYOUT.BOARD_X - 8, LAYOUT.BOARD_Y - 8, N * LAYOUT.CELL_SIZE + 16, N * LAYOUT.CELL_SIZE + 16, 22);
      ctx.fill();

      // Ô caro nền bàn cờ
      for (let i = 0; i < N * N; i++) {
        const pt = getBoardCellCenter(i);
        const isOdd = ((i % N) + Math.floor(i / N)) % 2 === 1;
        ctx.fillStyle = isOdd ? '#f3e8ff' : '#fdf0f7';
        roundRect(ctx, pt.x - LAYOUT.CELL_SIZE / 2 + 1, pt.y - LAYOUT.CELL_SIZE / 2 + 1, LAYOUT.CELL_SIZE - 2, LAYOUT.CELL_SIZE - 2, 10);
        ctx.fill();
      }

      // Vẽ từng giọt kẹo trên bàn cờ
      G.grid.forEach(cell => {
        if (cell) {
          drawBlob(ctx, cell, cell.x, cell.y, 1);
        }
      });

      // Viền sáng ô đang được bấm chọn
      if (selectedIndex >= 0) {
        const pt = getBoardCellCenter(selectedIndex);
        ctx.strokeStyle = '#ff4d8d';
        ctx.lineWidth = 4;
        roundRect(ctx, pt.x - LAYOUT.CELL_SIZE / 2 + 1, pt.y - LAYOUT.CELL_SIZE / 2 + 1, LAYOUT.CELL_SIZE - 2, LAYOUT.CELL_SIZE - 2, 10);
        ctx.stroke();
      }

      // 3. VẼ HIỆU ỨNG VỠ Ô (POP ANIMATION)
      visualFx.forEach(fx => {
        const remaining = 1 - fx.t / 0.3;
        if (remaining > 0) {
          ctx.globalAlpha = remaining;
          drawBlob(
            ctx,
            { c: fx.c, sp: SPECIAL.NONE, st: fx.c === '#' ? BLOCKER.STONE : BLOCKER.NONE, cg: 0, hd: 0 },
            fx.x,
            fx.y,
            1 + (1 - remaining) * 0.5
          );
          ctx.globalAlpha = 1;
        }
      });

      // 4. VẼ GIỌT SƠN BAY THEO ĐƯỜNG CONG LÊN TRANH (FLYING PARTICLES)
      flyParticles.forEach(p => {
        const t = Math.min(1, p.t / 0.55);
        const easeOutCubic = 1 - Math.pow(1 - t, 3);
        const x = p.x0 + (p.x1 - p.x0) * easeOutCubic;
        const arcY = Math.sin(t * Math.PI) * 50;
        const y = p.y0 + (p.y1 - p.y0) * easeOutCubic - arcY;

        ctx.fillStyle = COLORS[p.c] || '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 6 * (1 - t * 0.3), 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // 5. VẼ TIA SÁNG LẤP LÁNH KHI CHẠM TRANH (SPARKLES)
      sparkleParticles.forEach(s => {
        ctx.globalAlpha = Math.max(0, 1 - s.t / 0.9);
        ctx.fillStyle = s.c;
        ctx.fillRect(s.x, s.y, 6, 6);
        ctx.globalAlpha = 1;
      });
    }

    /**
     * Cập nhật animation vật lý từng frame
     */
    function update(dt, G) {
      // Tiếp nhận hiệu ứng mới từ engine
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
            t: -flyParticles.length * 0.03
          });
        }
      });

      // Làm mượt vị trí rơi của kẹo
      G.grid.forEach((cell, i) => {
        if (!cell) return;
        const targetPt = getBoardCellCenter(i);
        if (cell.fresh) {
          cell.fresh = 0;
          cell.x = targetPt.x;
          cell.y = targetPt.y - N * LAYOUT.CELL_SIZE - 20;
        }
        const smoothRate = Math.min(1, dt * 16);
        cell.x += (targetPt.x - cell.x) * smoothRate;
        cell.y += (targetPt.y - cell.y) * smoothRate;
      });

      // Cập nhật thời gian sống của các particle
      visualFx.forEach(fx => (fx.t += dt));
      visualFx = visualFx.filter(fx => fx.t < 0.3);

      flyParticles.forEach(p => (p.t += dt));
      flyParticles = flyParticles.filter(p => {
        if (p.t >= 0.55) {
          // Bắn tia lấp lánh khi chạm đích
          for (let k = 0; k < 4; k++) {
            sparkleParticles.push({
              x: p.x1 + (Math.random() - 0.5) * 16,
              y: p.y1 + (Math.random() - 0.5) * 16,
              c: COLORS[p.c] || '#ffffff',
              t: 0
            });
          }
          return false;
        }
        return true;
      });

      sparkleParticles.forEach(s => {
        s.t += dt;
        s.y -= dt * 20;
      });
      sparkleParticles = sparkleParticles.filter(s => s.t < 0.9);

      // Giảm hiệu ứng pop của các ô tranh
      G.pix.forEach(p => {
        if (p.pop > 0) p.pop = Math.max(0, p.pop - dt * 3);
      });
    }

    function clearParticles() {
      visualFx = [];
      flyParticles = [];
      sparkleParticles = [];
    }

    function hasActiveFlyingParticles() {
      return flyParticles.length > 0;
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


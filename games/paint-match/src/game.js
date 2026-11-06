/**
 * Paint Match - Game Controller
 * Kết nối giao diện người dùng, điều khiển sự kiện chuột/chạm cảm ứng,
 * âm thanh và vòng lặp đồ họa animation loop.
 */

(function () {
  'use strict';

  const { Constants, Levels, Engine, Renderer, Audio } = window.PaintMatch;
  const { BOARD_SIZE, PIX_SIZE, LAYOUT } = Constants;
  const N = BOARD_SIZE;
  const PX = PIX_SIZE;

  // DOM Elements
  const $ = id => document.getElementById(id);
  const cv = $('cv');
  const lvlSpan = $('lvl');
  const prevBtn = $('prev');
  const nextBtn = $('next');
  const soundBtn = $('sound-btn');
  const lvlPickerBtn = $('lvl-picker-btn');
  const selectLvlBtn = $('select-lvl-btn');
  const resetBtn = $('reset');
  const mvEl = $('mv');
  const pfEl = $('pf');
  const chipsEl = $('chips');
  const msgEl = $('msg');

  // Modals
  const ovModal = $('ov');
  const ovTitle = $('ovt');
  const ovDesc = $('ovp');
  const ovActions = $('ovb');

  const lvlModal = $('lvl-modal');
  const lvlGrid = $('lvl-grid');
  const closeLvlModalBtn = $('close-lvl-modal');

  // Trạng thái điều khiển
  let currentLevel = 0;
  let G = null;
  let renderer = null;
  let selectedCell = -1;
  let pointerStart = null;
  let actionLockUntil = 0;
  let gameTime = 0;
  let hasShownEndModal = false;
  let lastTimestamp = performance.now();

  /**
   * Chuyển đổi tọa độ pointer màn hình sang tọa độ logic canvas (340x540)
   */
  function getCanvasLogicalPos(event) {
    const rect = cv.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * LAYOUT.VIRTUAL_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * LAYOUT.VIRTUAL_HEIGHT
    };
  }

  /**
   * Xác định ô trên bàn cờ Match-3 từ tọa độ logic
   */
  function getCellAtPos(pos) {
    const col = Math.floor((pos.x - LAYOUT.BOARD_X) / LAYOUT.CELL_SIZE);
    const row = Math.floor((pos.y - LAYOUT.BOARD_Y) / LAYOUT.CELL_SIZE);
    if (col >= 0 && col < N && row >= 0 && row < N) {
      return row * N + col;
    }
    return -1;
  }

  /**
   * Cập nhật thông báo nổi ngắn
   */
  function showToast(text) {
    msgEl.textContent = text;
  }

  /**
   * Cập nhật HUD
   */
  function updateHUD() {
    lvlSpan.textContent = `${currentLevel + 1}/${Levels.count()}`;
    prevBtn.disabled = currentLevel === 0;
    nextBtn.disabled = currentLevel === Levels.count() - 1;

    // Cập nhật hướng dẫn màn
    chipsEl.innerHTML = G.level.info.map(t => `<div class="chip-item">${t}</div>`).join('');

    // Số lượt đi
    mvEl.textContent = `👆 ${G.moves}`;

    // Thanh tiến độ hoàn thành tranh
    const completedCount = G.totalPixels - G.left;
    const percent = Math.min(100, Math.round((completedCount / G.totalPixels) * 100));
    pfEl.style.width = `${percent}%`;
    pfEl.setAttribute('aria-valuenow', percent);

    // Cập nhật nút âm thanh
    if (soundBtn) {
      soundBtn.textContent = Audio.isMuted() ? '🔇' : '🔊';
      soundBtn.setAttribute('title', Audio.isMuted() ? 'Bật âm thanh' : 'Tắt âm thanh');
    }
  }

  /**
   * Hiển thị bảng kết thúc (thắng / thua)
   */
  function showOverlay(title, description, buttons) {
    ovTitle.textContent = title;
    ovDesc.textContent = description;
    ovActions.innerHTML = '';

    buttons.forEach(([label, onClick, isPrimary]) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.className = isPrimary ? 'btn-primary' : 'btn-secondary';
      btn.onclick = () => {
        hideOverlay();
        onClick();
      };
      ovActions.appendChild(btn);
    });

    ovModal.classList.add('on');
  }

  function hideOverlay() {
    ovModal.classList.remove('on');
  }

  /**
   * Mở modal chọn màn chơi
   */
  function openLevelModal() {
    lvlGrid.innerHTML = '';
    for (let i = 0; i < Levels.count(); i++) {
      const lvl = Levels.get(i);
      const btn = document.createElement('button');
      btn.className = `lvl-card ${i === currentLevel ? 'active' : ''}`;
      btn.innerHTML = `
        <span class="lvl-icon">${lvl.icon || '🎨'}</span>
        <span class="lvl-num">Màn ${i + 1}</span>
        <span class="lvl-name">${lvl.n}</span>
      `;
      btn.onclick = () => {
        closeLevelModal();
        startLevel(i);
      };
      lvlGrid.appendChild(btn);
    }
    lvlModal.classList.add('on');
  }

  function closeLevelModal() {
    lvlModal.classList.remove('on');
  }

  /**
   * Bắt đầu một màn chơi
   */
  function startLevel(levelIndex) {
    currentLevel = levelIndex;
    G = Engine.createGame(levelIndex, Levels);

    // Đồng bộ tọa độ hạt ban đầu
    G.grid.forEach((cell, idx) => {
      if (cell) {
        const pt = Renderer.getBoardCellCenter(idx);
        cell.x = pt.x;
        cell.y = pt.y;
      }
    });

    selectedCell = -1;
    pointerStart = null;
    actionLockUntil = 0;
    hasShownEndModal = false;

    if (renderer) {
      renderer.clearParticles();
    }

    hideOverlay();
    closeLevelModal();
    showToast('');
    updateHUD();
  }

  /**
   * Xử lý hành động hoán đổi 2 ô
   */
  function performSwap(a, b) {
    if (gameTime < actionLockUntil || G.state !== 'play') return;

    Audio.playSwap();
    const wasReshuffled = G.reshuffled;
    G.reshuffled = false;

    const success = Engine.swap(G, a, b);
    if (success) {
      actionLockUntil = gameTime + 0.45;
      selectedCell = -1;

      Audio.playMatch(1);
      Audio.playSplat();

      if (G.reshuffled) {
        showToast('Bàn cờ đã được tự động xáo lại vì hết nước đi!');
      } else {
        showToast('');
      }
    } else {
      showToast('Nước đi này chưa ghép được 3 ô cùng màu!');
      selectedCell = -1;
    }

    updateHUD();
  }

  // Gắn sự kiện cảm ứng / chuột trên canvas
  cv.addEventListener('pointerdown', e => {
    const pos = getCanvasLogicalPos(e);

    // Chạm vào khung tranh pixel phía trên để đặt trọng tâm bắn màu
    if (pos.y < LAYOUT.BOARD_Y - 10) {
      const col = Math.floor((pos.x - LAYOUT.PIX_X) / LAYOUT.PIX_CELL_SIZE);
      const row = Math.floor((pos.y - LAYOUT.PIX_Y) / LAYOUT.PIX_CELL_SIZE);
      if (col >= 0 && col < PX && row >= 0 && row < PX) {
        const pixelIndex = row * PX + col;
        const changed = Engine.setFocus(G, pixelIndex);
        if (changed) {
          Audio.playSwap();
          showToast(`Đã chọn trọng tâm: (${col + 1}, ${row + 1})`);
        }
      }
      return;
    }

    // Chạm vào bàn cờ Match-3
    cv.setPointerCapture(e.pointerId);
    const cellIndex = getCellAtPos(pos);
    pointerStart = {
      index: cellIndex,
      pos
    };
  });

  cv.addEventListener('pointerup', e => {
    if (!pointerStart) return;

    const currentPos = getCanvasLogicalPos(e);
    const start = pointerStart;
    pointerStart = null;

    if (start.index < 0) return;

    const dx = currentPos.x - start.pos.x;
    const dy = currentPos.y - start.pos.y;
    const distance = Math.hypot(dx, dy);

    // Nếu người chơi vuốt một đoạn đủ dài (> 18px): Thực hiện hoán đổi theo hướng vuốt
    if (distance > 18) {
      const isHorizontal = Math.abs(dx) > Math.abs(dy);
      const targetIndex = isHorizontal
        ? start.index + Math.sign(dx)
        : start.index + N * Math.sign(dy);

      if (targetIndex >= 0 && targetIndex < N * N && Engine.isAdjacent(start.index, targetIndex, N)) {
        performSwap(start.index, targetIndex);
      }
      return;
    }

    // Nếu người chơi chạm / nhấp từng ô liên tiếp
    if (selectedCell >= 0 && selectedCell !== start.index && Engine.isAdjacent(selectedCell, start.index, N)) {
      performSwap(selectedCell, start.index);
    } else {
      const clickedCell = G.grid[start.index];
      // Nếu bấm lại chính ô đó hoặc bấm vào ô đá thì bỏ chọn
      if (selectedCell === start.index || (clickedCell && clickedCell.st)) {
        selectedCell = -1;
      } else {
        selectedCell = start.index;
        Audio.playSwap();
      }
    }
  });

  cv.addEventListener('pointercancel', () => {
    pointerStart = null;
  });

  // UI Event Listeners
  resetBtn.addEventListener('click', () => {
    startLevel(currentLevel);
  });

  prevBtn.addEventListener('click', () => {
    if (currentLevel > 0) startLevel(currentLevel - 1);
  });

  nextBtn.addEventListener('click', () => {
    if (currentLevel < Levels.count() - 1) startLevel(currentLevel + 1);
  });

  lvlPickerBtn.addEventListener('click', openLevelModal);
  selectLvlBtn.addEventListener('click', openLevelModal);
  closeLvlModalBtn.addEventListener('click', closeLevelModal);

  soundBtn.addEventListener('click', () => {
    Audio.toggleMute();
    updateHUD();
  });

  // Đóng modal khi bấm vào vùng nền đen
  lvlModal.addEventListener('click', e => {
    if (e.target === lvlModal) closeLevelModal();
  });

  /**
   * Vòng lặp animation chính
   */
  function gameLoop(now) {
    const dt = Math.min(0.05, (now - lastTimestamp) / 1000);
    lastTimestamp = now;
    gameTime += dt;

    if (G && renderer) {
      renderer.update(dt, G);
      renderer.render(G, selectedCell);

      // Cập nhật trạng thái thắng/thua khi hết hạt bay
      if (G.state !== 'play' && !hasShownEndModal && !renderer.hasActiveFlyingParticles()) {
        hasShownEndModal = true;
        setTimeout(() => {
          if (G.state === 'won') {
            Audio.playWin();
            const isLastLevel = currentLevel >= Levels.count() - 1;
            showOverlay(
              'Bức tranh hoàn thành! 🎉',
              `Bạn đã tô màu tuyệt đẹp cho "${G.level.n}". Còn dư ${G.moves} lượt đi.`,
              [
                ['Chơi lại màn này', () => startLevel(currentLevel), false],
                isLastLevel
                  ? ['Về màn 1 ↺', () => startLevel(0), true]
                  : ['Màn tiếp theo ➔', () => startLevel(currentLevel + 1), true]
              ]
            );
          } else if (G.state === 'lost') {
            Audio.playLose();
            showOverlay(
              'Hết lượt đi rồi!',
              `Bức tranh "${G.level.n}" còn thiếu ${G.left} ô màu chưa hoàn thành. Cố gắng thêm nhé!`,
              [['Thử lại ngay', () => startLevel(currentLevel), true]]
            );
          }
        }, 500);
      }
    }

    requestAnimationFrame(gameLoop);
  }

  // Khởi động game
  renderer = Renderer.createRenderer(cv);
  startLevel(0);
  requestAnimationFrame(gameLoop);
})();


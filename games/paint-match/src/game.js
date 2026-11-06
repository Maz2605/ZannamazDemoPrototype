/**
 * Paint Match - Game Controller (Color Alchemy & Gallery Museum Integration)
 * Điều phối cử chỉ ngón tay nối pha màu, quản lý bộ sưu tập Bảo tàng Tranh (Gallery)
 * và lưu trữ số sao đạt được vào localStorage.
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
  const galleryBtn = $('gallery-btn');
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

  const galleryModal = $('gallery-modal');
  const galleryGrid = $('gallery-grid');
  const closeGalleryBtn = $('close-gallery');
  const totalStarsEl = $('total-stars');

  // Trạng thái game
  let currentLevel = 0;
  let G = null;
  let renderer = null;
  let gameTime = 0;
  let hasShownEndModal = false;
  let lastTimestamp = performance.now();

  // Trạng thái đường vuốt nối
  let activePath = [];
  let isLoop = false;
  let pointerPos = null;
  let isDragging = false;
  let currentAnalysis = null;

  // Dữ liệu Bảo tàng Tranh lưu trong localStorage
  const STORAGE_KEY = 'paint-match-gallery-v2';
  function getGalleryData() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveGalleryData(levelIdx, stars, movesLeft) {
    try {
      const data = getGalleryData();
      const existing = data[levelIdx] || { stars: 0, bestMoves: 0 };
      data[levelIdx] = {
        stars: Math.max(existing.stars, stars),
        bestMoves: Math.max(existing.bestMoves, movesLeft),
        completedAt: new Date().toLocaleDateString('vi-VN')
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function getCanvasLogicalPos(event) {
    const rect = cv.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * LAYOUT.VIRTUAL_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * LAYOUT.VIRTUAL_HEIGHT
    };
  }

  function getCellAtPos(pos) {
    const col = Math.floor((pos.x - LAYOUT.BOARD_X) / LAYOUT.CELL_SIZE);
    const row = Math.floor((pos.y - LAYOUT.BOARD_Y) / LAYOUT.CELL_SIZE);
    if (col >= 0 && col < N && row >= 0 && row < N) {
      return row * N + col;
    }
    return -1;
  }

  function showToast(text) {
    msgEl.textContent = text;
  }

  function updateHUD() {
    lvlSpan.textContent = `${currentLevel + 1}/${Levels.count()}`;
    prevBtn.disabled = currentLevel === 0;
    nextBtn.disabled = currentLevel === Levels.count() - 1;

    chipsEl.innerHTML = G.level.info.map(t => `<div class="chip-item">${t}</div>`).join('');

    mvEl.textContent = `👆 ${G.moves}`;

    const completedCount = G.totalPixels - G.left;
    const percent = Math.min(100, Math.round((completedCount / G.totalPixels) * 100));
    pfEl.style.width = `${percent}%`;
    pfEl.setAttribute('aria-valuenow', percent);

    if (soundBtn) {
      soundBtn.textContent = Audio.isMuted() ? '🔇' : '🔊';
      soundBtn.setAttribute('title', Audio.isMuted() ? 'Bật âm thanh' : 'Tắt âm thanh');
    }
  }

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

  // BẢNG CHỌN MÀN CHƠI
  function openLevelModal() {
    lvlGrid.innerHTML = '';
    const gallery = getGalleryData();

    for (let i = 0; i < Levels.count(); i++) {
      const lvl = Levels.get(i);
      const lvlRecord = gallery[i];
      const stars = lvlRecord ? '⭐'.repeat(lvlRecord.stars) : '';

      const btn = document.createElement('button');
      btn.className = `lvl-card ${i === currentLevel ? 'active' : ''}`;
      btn.innerHTML = `
        <span class="lvl-icon">${lvl.icon || '🎨'}</span>
        <span class="lvl-num">Màn ${i + 1}</span>
        <span class="lvl-name">${lvl.n}</span>
        <span class="lvl-stars">${stars || '⚪⚪⚪'}</span>
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

  // BẢO TÀNG TRANH (GALLERY MUSEUM)
  function openGalleryModal() {
    galleryGrid.innerHTML = '';
    const gallery = getGalleryData();
    let totalStars = 0;

    for (let i = 0; i < Levels.count(); i++) {
      const lvl = Levels.get(i);
      const record = gallery[i];
      const isCompleted = !!record;
      const starsCount = record ? record.stars : 0;
      totalStars += starsCount;

      const card = document.createElement('div');
      card.className = `gallery-card ${isCompleted ? 'completed' : 'locked'}`;

      if (isCompleted) {
        card.innerHTML = `
          <div class="gallery-frame">
            <span class="gallery-icon">${lvl.icon || '🎨'}</span>
            <div class="gallery-stars">${'⭐'.repeat(starsCount)}</div>
          </div>
          <h4 class="gallery-title">${lvl.n}</h4>
          <span class="gallery-badge">Dư ${record.bestMoves} lượt</span>
          <button class="gallery-play-btn" type="button">Vẽ lại ↺</button>
        `;
        card.querySelector('.gallery-play-btn').onclick = () => {
          closeGalleryModal();
          startLevel(i);
        };
      } else {
        card.innerHTML = `
          <div class="gallery-frame locked-frame">
            <span class="lock-icon">🔒</span>
          </div>
          <h4 class="gallery-title">Tác phẩm ${i + 1}</h4>
          <span class="gallery-badge">Chưa mở khóa</span>
        `;
      }
      galleryGrid.appendChild(card);
    }

    if (totalStarsEl) {
      totalStarsEl.textContent = `⭐ ${totalStars} / ${Levels.count() * 3}`;
    }

    galleryModal.classList.add('on');
  }

  function closeGalleryModal() {
    galleryModal.classList.remove('on');
  }

  function startLevel(levelIndex) {
    currentLevel = levelIndex;
    G = Engine.createGame(levelIndex, Levels);

    G.grid.forEach((cell, idx) => {
      if (cell) {
        const pt = Renderer.getBoardCellCenter(idx);
        cell.x = pt.x;
        cell.y = pt.y;
      }
    });

    activePath = [];
    isLoop = false;
    pointerPos = null;
    isDragging = false;
    currentAnalysis = null;
    hasShownEndModal = false;

    if (renderer) {
      renderer.clearParticles();
    }

    hideOverlay();
    closeLevelModal();
    closeGalleryModal();
    showToast('Nối 4 hướng cùng màu hoặc pha màu (tối thiểu 3 giọt)!');
    updateHUD();
  }

  // =========================================================
  // XỬ LÝ CỬ CHỈ NGÓN TAY NỐI & PHA MÀU (COLOR ALCHEMY DRAG)
  // =========================================================
  cv.addEventListener('pointerdown', e => {
    const pos = getCanvasLogicalPos(e);

    // 1. Chạm vào khung tranh pixel để chọn trọng tâm
    if (pos.y < LAYOUT.GOALS_Y - 8) {
      const col = Math.floor((pos.x - LAYOUT.PIX_X) / LAYOUT.PIX_CELL_SIZE);
      const row = Math.floor((pos.y - LAYOUT.PIX_Y) / LAYOUT.PIX_CELL_SIZE);
      if (col >= 0 && col < PX && row >= 0 && row < PX) {
        const pixelIndex = row * PX + col;
        const changed = Engine.setFocus(G, pixelIndex);
        if (changed) {
          Audio.playConnectStep(0);
          showToast(`Trọng tâm sơn: (${col + 1}, ${row + 1})`);
        }
      }
      return;
    }

    // 2. Chạm vào bàn cờ Line Connect
    if (G.state !== 'play') return;

    const cellIndex = getCellAtPos(pos);
    if (cellIndex >= 0 && Engine.isConnectable(G.grid[cellIndex])) {
      cv.setPointerCapture(e.pointerId);
      isDragging = true;
      activePath = [cellIndex];
      isLoop = false;
      pointerPos = pos;
      currentAnalysis = Engine.analyzePath(G, activePath);

      Audio.playConnectStep(0);
      showToast('Nối thêm 2 giọt nữa (ngang/dọc hoặc pha màu)...');
    }
  });

  cv.addEventListener('pointermove', e => {
    if (!isDragging || activePath.length === 0) return;

    const pos = getCanvasLogicalPos(e);
    pointerPos = pos;

    const cellIndex = getCellAtPos(pos);
    if (cellIndex < 0) return;

    const lastIndex = activePath[activePath.length - 1];
    if (cellIndex === lastIndex) return;

    // 1. Rút lùi ngón tay (Backtracking)
    if (activePath.length >= 2 && cellIndex === activePath[activePath.length - 2]) {
      activePath.pop();
      const uniqueCount = new Set(activePath).size;
      isLoop = uniqueCount < activePath.length;
      currentAnalysis = Engine.analyzePath(G, activePath);
      Audio.playConnectStep(activePath.length - 1);
      showToast(activePath.length >= 3 ? `Chuỗi: ${activePath.length} giọt` : 'Cần thêm giọt nữa (tối thiểu 3)...');
      return;
    }

    // 2. Nối tiếp ô mới theo 4 HƯỚNG
    const targetCell = G.grid[cellIndex];
    if (targetCell && Engine.isConnectable(targetCell) && Engine.isAdjacent(lastIndex, cellIndex, N)) {
      // Thử phân tích nếu thêm ô này vào đường nối
      const testPath = [...activePath, cellIndex];
      const testAnalysis = Engine.analyzePath(G, testPath);

      // Cho phép nối nếu cùng màu HOẶC là pha màu hợp lệ
      if (testAnalysis.isValid || testPath.length < 3) {
        const isMixingStep = targetCell.c !== G.grid[lastIndex].c;

        if (activePath.includes(cellIndex)) {
          if (!isLoop) {
            isLoop = true;
            activePath.push(cellIndex);
            currentAnalysis = Engine.analyzePath(G, activePath);
            Audio.playLoopDetected();
            showToast('⚡ SIÊU BÃO MÀU! Xóa sạch trên toàn bàn cờ!');
          }
        } else {
          activePath.push(cellIndex);
          currentAnalysis = testAnalysis;

          if (isMixingStep && testAnalysis.isMixed) {
            Audio.playColorMix();
            showToast(`🧪 ĐANG PHA MÀU: ${Constants.COLOR_NAMES[testAnalysis.outputColor] || testAnalysis.outputColor}! ✨`);
          } else {
            Audio.playConnectStep(activePath.length - 1);
            if (activePath.length < 3) {
              showToast(`Cần thêm 1 giọt nữa (${activePath.length}/3)...`);
            } else {
              showToast(`Chuỗi: ${activePath.length} giọt kẹo!`);
            }
          }
        }
      }
    }
  });

  function finishConnection() {
    if (!isDragging) return;
    isDragging = false;
    pointerPos = null;

    if (activePath.length >= 3) {
      const result = Engine.executeConnect(G, activePath, isLoop);
      if (result && result.success) {
        Audio.playBlast(activePath.length, isLoop, result.isMixed);

        // Kêu âm thanh nếu có băng chuyền
        if (G.conveyors && G.conveyors.length > 0) {
          setTimeout(() => Audio.playConveyor(), 200);
        }

        if (result.isWasteColor) {
          showToast(`⚠️ Màu ${Constants.COLOR_NAMES[result.outputColor]} tranh đã tô xong!`);
        } else if (result.isMixed) {
          showToast(`🧪 PHA MÀU THÀNH CÔNG: Bắn sơn ${Constants.COLOR_NAMES[result.outputColor]} lên tranh! ✨`);
        } else if (isLoop) {
          showToast('⚡ SIÊU BÃO MÀU! Cơn mưa sơn bay lên tranh!');
        } else {
          showToast(`Đã nối thành công ${activePath.length} giọt sơn!`);
        }
      }
    } else {
      if (activePath.length > 0) {
        showToast('⚠️ Cần ít nhất 3 giọt cùng màu hoặc pha màu hợp lệ!');
      }
    }

    activePath = [];
    isLoop = false;
    currentAnalysis = null;
    updateHUD();
  }

  cv.addEventListener('pointerup', finishConnection);
  cv.addEventListener('pointercancel', finishConnection);

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

  if (galleryBtn) {
    galleryBtn.addEventListener('click', openGalleryModal);
  }
  if (closeGalleryBtn) {
    closeGalleryBtn.addEventListener('click', closeGalleryModal);
  }

  soundBtn.addEventListener('click', () => {
    Audio.toggleMute();
    updateHUD();
  });

  lvlModal.addEventListener('click', e => {
    if (e.target === lvlModal) closeLevelModal();
  });

  galleryModal.addEventListener('click', e => {
    if (e.target === galleryModal) closeGalleryModal();
  });

  /**
   * Vòng lặp animation chính
   */
  function gameLoop(now) {
    const dt = Math.min(0.05, (now - lastTimestamp) / 1000);
    lastTimestamp = now;
    gameTime += dt;

    if (G && renderer) {
      const goals = Engine.getGoals(G);
      renderer.update(dt, G);
      renderer.render(G, activePath, isLoop, pointerPos, goals, currentAnalysis);

      if (G.state !== 'play' && !hasShownEndModal && !renderer.hasActiveFlyingParticles()) {
        hasShownEndModal = true;
        setTimeout(() => {
          if (G.state === 'won') {
            const stars = G.stars || Engine.calculateStars(G);
            saveGalleryData(currentLevel, stars, G.moves);
            Audio.playWin(stars);

            const starSymbols = '⭐'.repeat(stars) + '⚪'.repeat(3 - stars);
            const isLastLevel = currentLevel >= Levels.count() - 1;

            showOverlay(
              `Bức tranh hoàn thành! 🎉\n${starSymbols}`,
              `Bạn đã tô màu xuất sắc cho "${G.level.n}". Còn dư ${G.moves} lượt đi. Tác phẩm đã được lưu vào Bảo tàng tranh!`,
              [
                ['Chơi lại màn này', () => startLevel(currentLevel), false],
                ['🏛️ Xem Bảo tàng Tranh', openGalleryModal, false],
                isLastLevel
                  ? ['Về màn 1 ↺', () => startLevel(0), true]
                  : ['Màn tiếp theo ➔', () => startLevel(currentLevel + 1), true]
              ]
            );
          } else if (G.state === 'lost') {
            Audio.playLose();
            showOverlay(
              'Hết lượt đi rồi!',
              `Bức tranh "${G.level.n}" còn thiếu ${G.left} ô màu chưa hoàn thành. Hãy tính toán công thức pha màu và hướng đi nhé!`,
              [['Thử lại ngay', () => startLevel(currentLevel), true]]
            );
          }
        }, 600);
      }
    }

    requestAnimationFrame(gameLoop);
  }

  renderer = Renderer.createRenderer(cv);
  startLevel(0);
  requestAnimationFrame(gameLoop);
})();

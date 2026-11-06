/**
 * Spirit Grove controller — DOM only.
 * Edit mechanics in engine.js; drawing in art.js; level content in levels.js.
 */
(function (G) {
  'use strict';
  const E = G.Engine, A = G.Art, Gesture = G.Gesture, LEVELS = G.LEVELS, Audio = G.Audio;
  const $ = id => document.getElementById(id);
  const UI = {
    nav: $('level-nav'), board: $('board'), scene: $('scene'),
    title: $('level-title'), subtitle: $('level-subtitle'),
    progress: $('progress-value'), progressBar: $('progress-fill'),
    ruleIcon: $('rule-icon'), ruleTitle: $('rule-title'), ruleDescription: $('rule-description'),
    undo: $('undo'), restart: $('restart'), hint: $('hint'),
    moves: $('move-count'), par: $('par-count'), toast: $('toast'),
    win: $('win-overlay'), stars: $('win-stars'), winAnimals: $('win-animals'),
    winTitle: $('win-title'), winMessage: $('win-message'), next: $('next-level'), swipeGuide:$('swipe-guide'),
    tutorial:$('tutorial'), tutorialTitle:$('tutorial-title'), tutorialText:$('tutorial-text'), tutorialSkip:$('tutorial-skip'),
    audioToggle: $('audio-toggle')
  };
  let levelIndex = 0;
  let state = [];
  let history = [];   // [{state, wheel, direction}], one snapshot per player move
  let completed = new Set();
  let busy = false;
  let won = false;
  let hidden = null;
  let winTimeout = null;
  let toastTimeout = null;
  let drag = null;
  let selectedWheel = null;
  let tutorialActive = false;
  const level = () => LEVELS[levelIndex];

  // Fail fast: bad level data should be detected before player sees the game.
  LEVELS.forEach((entry, i) => {
    const errors = E.verify(entry);
    if (errors.length) throw Error(`Invalid level ${i+1}: ${errors.join(', ')}`);
  });

  function updateAudioButton() {
    if (!UI.audioToggle || !Audio) return;
    const muted = Audio.isMuted();
    UI.audioToggle.textContent = muted ? '🔇' : '🔊';
    UI.audioToggle.title = muted ? 'Bật âm thanh' : 'Tắt âm thanh';
  }
  updateAudioButton();

  function toast(message) {
    UI.toast.textContent = message;
    UI.toast.classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => UI.toast.classList.remove('visible'), 2400);
  }

  function renderNavigation() {
    UI.nav.innerHTML = LEVELS.map((l, i) => {
      const isCurrent = i === levelIndex;
      return `<button class="level-button ${isCurrent?'current':''} ${completed.has(i)?'done':''}" type="button" data-level="${i}" aria-label="Màn ${i+1}: ${l.title}" ${isCurrent?'aria-current="step"':''}>${completed.has(i)&&!isCurrent?'✓':i+1}</button>`;
    }).join('');
  }

  function renderLevelInfo() {
    const l = level();
    UI.title.textContent = `${String(levelIndex+1).padStart(2,'0')} · ${l.title}`;
    UI.subtitle.textContent = `${l.rows}×${l.cols} bệ · ${E.wheelCount(l)} vòng phép${l.blocked?.length?' · Có phong ấn':''}`;
    UI.ruleIcon.textContent = l.icon;
    UI.ruleTitle.textContent = l.rule;
    UI.ruleDescription.textContent = l.description;
    UI.par.textContent = ` / tối ưu ${l.par}`;
    UI.moves.textContent = String(history.length);
    UI.undo.disabled = !history.length || busy || won;
    UI.restart.disabled = busy;
    UI.hint.disabled = busy || won;
  }

  function renderBoard() {
    UI.board.innerHTML = A.scene(level(), state, hidden);
    highlightSelection();
    const count = state.reduce((acc,id,i)=>acc+(id===i%level().cols),0);
    UI.progress.textContent = `${count}/${state.length}`;
    UI.progressBar.style.width = `${Math.round(100*count/state.length)}%`;
  }

  function highlightSelection() {
    UI.board.querySelectorAll('.selected, .selected-animal').forEach(node=>node.classList.remove('selected','selected-animal'));
    if (selectedWheel !== null) {
      UI.board.querySelector(`.wheel[data-wheel="${selectedWheel}"]`)?.classList.add('selected');
      UI.board.querySelector(`[data-track="${selectedWheel}"]`)?.classList.add('selected');
      for (const cell of E.wheelCells(level(),selectedWheel)) UI.board.querySelector(`[data-cell="${cell}"]`)?.classList.add('selected-animal');
    }
    UI.swipeGuide.textContent = selectedWheel===null?'Chạm trục ở ngã tư để chọn 4 con':`Đã chọn vòng ${selectedWheel+1} · Vuốt trái / phải ở bất kỳ đâu trên bàn`;
    if (selectedWheel!==null) {
      const one=(level().oneWay||[]).find(([w])=>w===selectedWheel);
      if(one) UI.swipeGuide.textContent=`Vòng ${selectedWheel+1} một chiều · Chỉ vuốt ${one[1]===1?'trái ←':'phải →'}`;
      if(E.rotationGroup(level(),selectedWheel).some(([w])=>E.isRuneLocked(level(),state,w))) UI.swipeGuide.textContent=moveMessage(selectedWheel,'rune');
      if(E.rotationGroup(level(),selectedWheel).some(([w])=>E.isDualLocked(level(),state,w))) UI.swipeGuide.textContent=moveMessage(selectedWheel,'dual-rune');
      if(E.rotationGroup(level(),selectedWheel).some(([w])=>E.isFrostLocked(level(),state,w))) UI.swipeGuide.textContent=moveMessage(selectedWheel,'frost');
    }
    renderTutorial();
  }

  function renderTutorial() {
    UI.tutorial.hidden=!tutorialActive || won;
    UI.board.querySelectorAll('.tutorial-focus').forEach(node=>node.classList.remove('tutorial-focus'));
    if (!tutorialActive || won) return;
    const wheel=level().solution[0][0], chosen=selectedWheel===wheel;
    UI.tutorialTitle.innerHTML=chosen?'2/2 · Vuốt sang phải <span class="tutorial-hand" aria-hidden="true">☝ →</span>':'1/2 · Chạm trục đang phát sáng';
    UI.tutorialText.textContent=chosen?'Vuốt ngắn sang phải ở bất kỳ đâu trên bàn, rồi thả tay.':'Mỗi trục xoay cùng lúc 4 con. Chọn vòng vàng bên phải để bắt đầu.';
    UI.board.querySelector(`.wheel[data-wheel="${wheel}"]`)?.classList.add('tutorial-focus');
    UI.board.querySelector(`[data-track="${wheel}"]`)?.classList.add('tutorial-focus');
  }

  function moveMessage(wheel, code) {
    if(code==='sealed') return '🔒 Vòng phép này đã bị phong ấn đá cổ.';
    if(code==='one-way') {
      const allowed=[1,-1].find(d=>!E.moveError(level(),state,wheel,d));
      return `Trục một chiều · Chỉ vuốt ${allowed===1?'trái ←':'phải →'}.`;
    }
    if(code==='rune') {
      const affected=E.rotationGroup(level(),wheel).map(([w])=>w);
      const seal=(level().seals||[]).find(([w,c,a])=>affected.includes(w)&&state[c]!==a);
      return seal?`Ấn ${'①②③④⑤⑥'[seal[0]]} đang đóng · Đưa ${A.ANIMALS[seal[2]].name} lên bệ cùng dấu để mở.`:'Ấn của vòng liên kết đang đóng.';
    }
    if(code==='dual-rune') {
      const affected=E.rotationGroup(level(),wheel).map(([w])=>w);
      const dSeal=(level().dualSeals||[]).find(([w])=>affected.includes(w));
      return dSeal?`☯ Ấn kép đang đóng · Cần cả ${A.ANIMALS[dSeal[2]].name} trên ☯₁ và ${A.ANIMALS[dSeal[4]].name} trên ☯₂.`:'Ấn kép của vòng liên kết đang đóng.';
    }
    if(code==='frost') {
      const affected=E.rotationGroup(level(),wheel).map(([w])=>w);
      const fSeal=(level().frost||[]).find(([w])=>affected.includes(w));
      return fSeal?`❄ Trục bị đông cứng · Đưa ${A.ANIMALS[fSeal[2]].name} lên bệ sưởi ấm để làm tan băng.`:'Trục liên kết đang bị đóng băng.';
    }
    if(code==='trap') {
      return '🥀 Bẫy gai cấm! Không thể đưa linh thú bị cấm vào bệ có bẫy.';
    }
    return 'Không thể xoay vòng phép này.';
  }

  function render() { renderNavigation(); renderLevelInfo(); renderBoard(); }

  function load(i) {
    if (busy) return false;
    if (!Number.isInteger(i) || i < 0 || i >= LEVELS.length) return false;
    cancelDrag();
    selectedWheel = null;
    tutorialActive=i===0;
    clearTimeout(winTimeout);
    levelIndex = i;
    state = E.parse(level());
    history = [];
    hidden = null;
    won = false;
    UI.win.hidden = true;
    UI.toast.classList.remove('visible');
    render();
    return true;
  }

  function makePreview(wheel, source) {
    const rotations = E.rotationGroup(level(), wheel, 1);
    const sprites = [];
    for (const [w, relation] of rotations) {
      UI.board.querySelector(`.wheel[data-wheel="${w}"]`)?.classList.add('active');
      UI.board.querySelector(`[data-track="${w}"]`)?.classList.add('active');
      for (const cell of E.wheelCells(level(), w)) {
        const original = UI.board.querySelector(`[data-cell="${cell}"]`);
        if (original) original.style.visibility = 'hidden';
        sprites.push({ wheel:w, relation, cell, animal:source[cell] });
      }
    }
    const overlay = UI.board.querySelector('#flying-sprites');
    overlay.innerHTML = sprites.map(s => `<g data-orbit-cell="${s.cell}" pointer-events="none">${A.animalShape(s.animal)}</g>`).join('');
    for (const sprite of sprites) sprite.node = overlay.querySelector(`[data-orbit-cell="${sprite.cell}"]`);
    UI.board.classList.add('dragging');
    return { rotations, sprites, overlay };
  }

  function paintPreview(preview, angle) {
    for (const sprite of preview.sprites) {
      const p = A.orbitPoint(level(), sprite.wheel, sprite.cell, angle * sprite.relation);
      sprite.node.setAttribute('transform', `translate(${p.x} ${p.y-22}) scale(.88)`);
      sprite.depth = p.y;
    }
    // Keep the animals upright and paint frontmost ones last while they orbit.
    preview.sprites.sort((a,b) => a.depth - b.depth).forEach(s => preview.overlay.appendChild(s.node));
    for (const [wheel, relation] of preview.rotations) {
      const rotation = `rotate(${angle * relation * 180 / Math.PI})`;
      UI.board.querySelector(`[data-rotor="${wheel}"] .rotor-spokes`)?.setAttribute('transform', rotation);
      UI.board.querySelector(`[data-arms="${wheel}"] path`)?.setAttribute('transform', rotation);
    }
  }

  function settlePreview(preview, from, to, done) {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const duration = reduced ? 0 : 140;
    const start = performance.now();
    function frame(now) {
      const t = duration ? Math.min(1, (now - start) / duration) : 1;
      paintPreview(preview, from + (to - from) * (1 - (1-t)**2));
      if (t < 1) requestAnimationFrame(frame);
      else { UI.board.classList.remove('dragging'); done(); }
    }
    requestAnimationFrame(frame);
  }

  function releaseDrag() {
    const current = drag;
    drag = null;
    if (current && UI.board.hasPointerCapture(current.pointer)) UI.board.releasePointerCapture(current.pointer);
    return current;
  }

  function cancelDrag() {
    if (!drag) return;
    releaseDrag();
    UI.board.classList.remove('dragging');
    renderBoard();
  }

  function startDrag(e) {
    if (busy || won || drag || !e.isPrimary || e.button !== 0) return;
    Audio?.init();

    // 1. Smart intersection hub snapping: effortlessly select hub by tap proximity
    let hub = null, wheel = null;
    if (UI.board.createSVGPoint && UI.board.getScreenCTM) {
      try {
        const pt = UI.board.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const svgPt = pt.matrixTransform(UI.board.getScreenCTM().inverse());
        let bestDist = Infinity, closestW = null;
        for (let w = 0; w < E.wheelCount(level()); w++) {
          const hp = A.hubPoint(level(), w);
          // Measure distance to elevated floating crystal (cy = hp.y - 24)
          const d = Math.hypot((svgPt.x - hp.x) / 1.15, svgPt.y - (hp.y - 24));
          if (d < bestDist) { bestDist = d; closestW = w; }
        }
        if (bestDist <= 64 && closestW !== null) {
          wheel = closestW;
          hub = UI.board.querySelector(`.wheel[data-wheel="${wheel}"]`);
        }
      } catch (err) {}
    }

    if (!hub) {
      const target = e.target.closest('.wheel, .wheel-target');
      hub = target ? UI.board.querySelector(`.wheel[data-wheel="${Number(target.dataset.wheel)}"]`) : null;
    }
    const animal = !hub && e.target.closest('[data-cell]');
    if (!hub && selectedWheel === null && !animal) return;

    if (hub && wheel === null) wheel = Number(hub.dataset.wheel);
    else if (wheel === null && selectedWheel !== null) wheel = selectedWheel;
    else if (wheel === null && animal) {
      const cell = Number(animal.dataset.cell);
      const candidates = Array.from({length:E.wheelCount(level())},(_,w)=>w).filter(w=>!E.isBlocked(level(),w)&&E.wheelCells(level(),w).includes(cell));
      if (!candidates.length) {
        Audio?.playBlocker('sealed');
        toast('🔒 Hãy chọn một trục không bị phong ấn.');
        return;
      }
      wheel = candidates.includes(selectedWheel)?selectedWheel:candidates[0];
    }

    hub ||= UI.board.querySelector(`.wheel[data-wheel="${wheel}"]`);
    if (E.isBlocked(level(), wheel)) {
      Audio?.playBlocker('sealed');
      toast('🔒 Vòng phép này đã bị phong ấn.');
      return;
    }
    if(tutorialActive && wheel!==level().solution[0][0]) {
      Audio?.playBlocker();
      toast('Chọn trục vàng bên phải theo hướng dẫn nhé.');
      return;
    }

    selectedWheel = wheel;
    highlightSelection();
    Audio?.playSelect();

    const group = E.rotationGroup(level(), wheel);
    if(group.some(([w])=>E.isRuneLocked(level(),state,w))) { Audio?.playBlocker('rune'); toast(moveMessage(wheel,'rune')); return; }
    if(group.some(([w])=>E.isDualLocked(level(),state,w))) { Audio?.playBlocker('dual-rune'); toast(moveMessage(wheel,'dual-rune')); return; }
    if(group.some(([w])=>E.isFrostLocked(level(),state,w))) { Audio?.playBlocker('frost'); toast(moveMessage(wheel,'frost')); return; }

    e.preventDefault();
    UI.board.setPointerCapture(e.pointerId);
    hub.focus({ preventScroll:true });
    drag = { wheel, pointer:e.pointerId, gesture:Gesture.start(null, {x:e.clientX,y:e.clientY}), preview:makePreview(wheel,state) };
    paintPreview(drag.preview, 0);
  }

  function moveDrag(e) {
    if (!drag || drag.pointer !== e.pointerId) return;
    e.preventDefault();
    Gesture.update(drag.gesture, null, { x:e.clientX, y:e.clientY });
    const desired=Math.sign(drag.gesture.angle);
    const invalid=desired && (E.moveError(level(),state,drag.wheel,desired) || (tutorialActive&&desired!==level().solution[0][1]));
    paintPreview(drag.preview, invalid?0:drag.gesture.angle);
    drag.previewAngle=invalid?0:drag.gesture.angle;
  }

  function finishDrag(e) {
    if (!drag || drag.pointer !== e.pointerId) return;
    moveDrag(e);
    const current = releaseDrag(), direction = Gesture.direction(current.gesture);
    if (direction) turn(current.wheel, direction, false, current.previewAngle||0);
    else if (current.gesture.distance <= 12) {
      UI.board.classList.remove('dragging'); renderBoard();
      toast('Vuốt phải ↺ · Vuốt trái ↻ · Không cần kéo vòng tròn.');
    }
    else {
      busy = true;
      renderLevelInfo();
      settlePreview(current.preview, current.previewAngle||0, 0, () => {
        busy = false; renderBoard(); renderLevelInfo();
      });
    }
  }

  function turn(wheel, direction, immediate = false, fromAngle = 0) {
    if (busy || won) return false;
    cancelDrag();
    const l=level();
    const error=E.moveError(l,state,wheel,direction);
    const tutorialError=tutorialActive && (wheel!==l.solution[0][0] || direction!==l.solution[0][1]);
    if (error || tutorialError) {
      UI.board.classList.remove('dragging'); renderBoard();
      Audio?.playBlocker(error);
      toast(tutorialError?'Ở lượt đầu, chọn trục vàng rồi vuốt sang phải nhé.':moveMessage(wheel,error));
      return false;
    }
    let result;
    try { result = E.spin(l, state, wheel, direction); }
    catch(e) {
      Audio?.playBlocker();
      toast('Không thể xoay vòng phép này.');
      return false;
    }
    selectedWheel = wheel;
    const source = state.slice();
    history.push({ state: source, wheel, direction });
    tutorialActive=false;
    state = result.next;
    Audio?.playSpin(direction);

    if (immediate) {
      render();
      if (E.isWin(l,state)) showWin(true);
      return true;
    }
    busy = true;
    hidden = new Set(result.mappings.map(m=>m.to));
    render();
    const preview = makePreview(wheel, source);
    paintPreview(preview, fromAngle);
    settlePreview(preview, fromAngle, direction * Math.PI / 2, () => {
      busy = false;
      hidden = null;
      render();
      UI.board.querySelector(`.wheel[data-wheel="${wheel}"]`)?.focus({preventScroll:true});
      if (E.isWin(l,state)) showWin();
    });
    return true;
  }

  function showWin(immediate = false) {
    if (won) return;
    won = true;
    Audio?.playWin();
    UI.tutorial.hidden=true;
    completed.add(levelIndex);
    const l = level(), moves = history.length;
    const stars = moves<=l.par ? 3 : moves<=l.par+2 ? 2 : 1;
    const isFinalLevel = levelIndex === LEVELS.length - 1;
    UI.stars.textContent = '★'.repeat(stars) + '☆'.repeat(3-stars);
    UI.winAnimals.textContent = A.ANIMALS.slice(0,l.cols).map(a=>a.emoji).join(' ');
    UI.winTitle.textContent = isFinalLevel ? 'Chúc mừng! Bạn đã hoàn thành toàn bộ 15 level!' : 'Hòn đảo linh thú hồi sinh!';
    UI.winMessage.textContent = `Bạn đưa ${state.length} linh thú về đúng vị trí sau ${moves} lượt. Lời giải tối ưu: ${l.par} lượt.`;
    UI.next.textContent = isFinalLevel ? '↻ Chơi lại từ Level 1' : 'Level tiếp theo →';
    renderNavigation();
    renderLevelInfo();
    if (immediate) UI.win.hidden = false;
    else winTimeout = setTimeout(() => UI.win.hidden = false, 280);
  }

  function undo() {
    if (busy || won) return false;
    cancelDrag();
    if (!history.length) return false;
    Audio?.playUndo();
    state = history.pop().state;
    render();
    return true;
  }

  function hint() {
    if (busy || won) return;
    cancelDrag();
    Audio?.playHint();
    const l=level();
    // If player followed the author's path, display the next verified move.
    let pathState=E.parse(l);
    for (const [w,d] of l.solution) {
      if (pathState.every((id,i)=>id===state[i])) {
        const {row,col}=E.wheelGrid(l,w);
        toast(`Gợi ý: chọn vòng hàng ${row+1}, cột ${col+1}, rồi vuốt ${d===1?'trái':'phải'}.`);
        return;
      }
      pathState=E.spin(l,pathState,w,d).next;
    }
    // Directed/rune restrictions can forbid inverse moves. Undo restores snapshots.
    if (history.length) {
      toast('Đang khác lời giải mẫu · Dùng Undo để quay lại; các blocker có thể chặn nước đảo ngược.');
    } else toast('Bấm Restart để thử lại lời giải mẫu.');
  }

  UI.nav.addEventListener('click',e=>{
    const el=e.target.closest('[data-level]');
    if (el) load(Number(el.dataset.level));
  });
  UI.board.addEventListener('pointerdown', startDrag);
  UI.board.addEventListener('pointermove', moveDrag);
  UI.board.addEventListener('pointerup', finishDrag);
  for (const type of ['pointercancel', 'lostpointercapture']) UI.board.addEventListener(type, e => {
    if (drag?.pointer === e.pointerId) cancelDrag();
  });
  window.addEventListener('blur', cancelDrag);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelDrag(); });
  UI.board.addEventListener('keydown',e=>{
    if (e.key === 'Escape' && drag) { e.preventDefault(); e.stopPropagation(); cancelDrag(); return; }
    const hub=e.target.closest('.wheel');
    if (hub && (e.key==='ArrowLeft'||e.key==='ArrowRight')) {
      e.preventDefault();turn(Number(hub.dataset.wheel),e.key==='ArrowRight'?-1:1);
    }
  });
  UI.undo.addEventListener('click',undo);
  UI.restart.addEventListener('click',()=>load(levelIndex));
  UI.hint.addEventListener('click',hint);
  UI.tutorialSkip.addEventListener('click',()=>{cancelDrag();tutorialActive=false;renderTutorial();});
  UI.next.addEventListener('click',()=>load(levelIndex===LEVELS.length-1?0:levelIndex+1));
  UI.audioToggle?.addEventListener('click', () => {
    Audio?.toggleMute();
    updateAudioButton();
  });
  document.addEventListener('keydown',e=>{
    if (e.key.toLowerCase()==='z'&&(e.ctrlKey||e.metaKey)) { e.preventDefault();undo(); }
    if (e.key.toLowerCase()==='r'&&e.altKey) { e.preventDefault();load(levelIndex); }
  });
  // Diagnostic API for local automated tests
  G.Debug = Object.freeze({
    getLevel:()=>levelIndex,
    getState:()=>state.slice(),
    getMoves:()=>history.length,
    isWon:()=>won,
    load,
    turn:(w,d)=>turn(w,d,true),
    undo
  });
  load(0);
})(window.SpiritGrove);

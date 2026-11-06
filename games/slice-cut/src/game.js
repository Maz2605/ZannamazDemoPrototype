/**
 * Slice Cut - Game Controller, UI, Sound & High-Performance Canvas Renderer
 */
(function () {
  'use strict';

  const { W, H, DOT_R, PAL, LV } = window.SliceCut;
  const { checkCut, cut, solved, build, sd, wallSeg } = window.SliceCut.Engine;

  const $ = id => document.getElementById(id);
  const cv = $('cv');
  const ctx = cv.getContext('2d');

  let lv = 0;
  let G = null;
  let tt = 0;
  let drag = null;
  let msgT = 0;
  let conf = [];
  let soundEnabled = true;

  // Lightweight Web Audio API Synthesizer
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playSound(type) {
    if (!soundEnabled) return;
    try {
      const actx = getAudioCtx();
      if (!actx) return;
      const t = actx.currentTime;

      if (type === 'slice') {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.08);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.1);
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start(t);
        osc.stop(t + 0.1);
      } else if (type === 'pop') {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.08);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.08);
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start(t);
        osc.stop(t + 0.08);
      } else if (type === 'win') {
        [587.33, 880].forEach((freq, idx) => {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t + idx * 0.12);
          gain.gain.setValueAtTime(0.2, t + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.12 + 0.3);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(t + idx * 0.12);
          osc.stop(t + idx * 0.12 + 0.3);
        });
      } else if (type === 'fail') {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, t);
        osc.frequency.linearRampToValueAtTime(140, t + 0.22);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.22);
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start(t);
        osc.stop(t + 0.22);
      } else if (type === 'bomb') {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.linearRampToValueAtTime(40, t + 0.35);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start(t);
        osc.stop(t + 0.35);
      } else if (type === 'click') {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, t);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.03);
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start(t);
        osc.stop(t + 0.03);
      }
    } catch (_) {}
  }

  function begin(i) {
    lv = i;
    G = build(i, LV, PAL);
    tt = 0;
    drag = null;
    conf = [];
    hideOv();
    hideLevelModal();
    toast('');
    hud();
  }

  function toast(text, bad) {
    const m = $('msg');
    m.textContent = text;
    m.style.color = bad ? '#ffe3e8' : '#ffffff';
    msgT = text ? 2.4 : 0;
  }

  function hud() {
    const curLevel = LV[lv];
    $('lvl').textContent = (lv + 1) + '/' + LV.length;
    $('prev').disabled = lv === 0;
    $('next').disabled = lv === LV.length - 1;
    $('cuts').innerHTML = '✂️'.repeat(G.cuts) + '<s>' + '✂️'.repeat(Math.max(0, curLevel.c - G.cuts)) + '</s>';
    $('tbar').style.display = G.tm ? 'block' : 'none';
    $('chips').innerHTML = curLevel.info.map(t => '<div>' + t + '</div>').join('');
    updateLevelGridSelection();
  }

  function showOv(t, p, bs) {
    $('ovt').textContent = t;
    $('ovp').textContent = p;
    const b = $('ovb');
    b.innerHTML = '';
    bs.forEach(([label, fn, isPrimary]) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.className = isPrimary ? 'btn-primary-action' : 'btn-sub-action';
      btn.onclick = () => {
        playSound('click');
        fn();
      };
      b.appendChild(btn);
    });
    $('ov').classList.add('on');
  }

  function hideOv() {
    $('ov').classList.remove('on');
  }

  // Level Selection Modal
  function showLevelModal() {
    playSound('click');
    buildLevelGrid();
    $('lvl-modal').classList.add('on');
  }

  function hideLevelModal() {
    $('lvl-modal').classList.remove('on');
  }

  function buildLevelGrid() {
    const grid = $('lvl-grid');
    grid.innerHTML = '';
    LV.forEach((l, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'level-item-btn' + (index === lv ? ' active' : '');
      btn.innerHTML = `
        <div class="level-badge">${index + 1}</div>
        <div class="level-meta">
          <span class="level-name">${l.icon || '🍰'} ${l.title || ('Màn ' + (index + 1))}</span>
          <span class="level-tag">${l.tm ? '⏱️ ' + l.tm + 's · ' : ''}${l.c} nhát</span>
        </div>
      `;
      btn.onclick = () => {
        playSound('click');
        begin(index);
      };
      grid.appendChild(btn);
    });
  }

  function updateLevelGridSelection() {
    const items = document.querySelectorAll('.level-item-btn');
    items.forEach((item, index) => {
      if (index === lv) item.classList.add('active');
      else item.classList.remove('active');
    });
  }

  function lose(t, p) {
    G.state = 'lost';
    playSound('fail');
    setTimeout(() => {
      showOv(
        t,
        p,
        [
          ['↺ Thử lại ngay', () => begin(lv), true],
          ['⭐ Chọn màn khác', () => showLevelModal(), false]
        ]
      );
    }, G.boom ? 750 : 300);
  }

  function win() {
    G.state = 'won';
    playSound('win');

    // 20 lightweight confetti particles for zero lag
    conf = [];
    for (let i = 0; i < 20; i++) {
      conf.push({
        x: W / 2 + (Math.random() - 0.5) * 80,
        y: H / 2 - 20,
        vx: (Math.random() - 0.5) * 260,
        vy: -Math.random() * 260 - 80,
        w: 5 + Math.random() * 4,
        h: 6 + Math.random() * 5,
        c: PAL[i % PAL.length],
        life: 1.0
      });
    }

    setTimeout(() => {
      showOv(
        lv < LV.length - 1 ? '🎉 Giỏi quá bé ơi!' : '👑 Bé đã hoàn thành tất cả các màn!',
        'Bé đã cắt bánh thật khéo léo! Còn dư ' + G.cuts + ' nhát cắt.',
        [
          lv < LV.length - 1 ? ['🍰 Sang màn tiếp theo →', () => begin(lv + 1), true] : ['↺ Chơi lại từ đầu', () => begin(0), true],
          ['⭐ Chọn màn chơi', () => showLevelModal(), false],
          ['↺ Chơi lại màn này', () => begin(lv), false]
        ]
      );
    }, 650);
  }

  function lineOf(dr) {
    const a = dr.a, b = dr.b;
    const dx = b.x - a.x, dy = b.y - a.y;
    const l = Math.hypot(dx, dy);
    if (l < 24) return null;
    if (G.ax) {
      return Math.abs(dx) > Math.abs(dy)
        ? { p: { x: a.x, y: (a.y + b.y) / 2 }, d: { x: 1, y: 0 } }
        : { p: { x: (a.x + b.x) / 2, y: a.y }, d: { x: 0, y: 1 } };
    }
    return { p: a, d: { x: dx / l, y: dy / l } };
  }

  function tryCut(ln) {
    const r = checkCut(G, ln.p, ln.d, tt);
    if (r === 'bomb') {
      let b = G.bombs[0], m = 1e9;
      G.bombs.forEach(o => {
        const q = Math.abs(sd(o, ln.p, ln.d));
        if (q < m) { m = q; b = o; }
      });
      G.boom = { x: b.x, y: b.y, t: 0 };
      playSound('bomb');
      toast('Bùm rồi! Cẩn thận quả bom nha bé! 💣', 1);
      return lose('Bùm! 💥', 'Đường cắt chạm trúng quả bom đen mất rồi.');
    }
    if (r === 'ice') {
      playSound('fail');
      return toast('Chém trúng tảng băng rồi! Băng cứng lắm không cắt qua được! ❄️', 1);
    }
    if (r === 'dot') {
      playSound('fail');
      return toast('Chém trúng bạn kẹo rồi! Cẩn thận nha bé! 🍬', 1);
    }
    if (r === 'wall') {
      playSound('fail');
      return toast('Bị thanh chắn chặn mất rồi! 🛑', 1);
    }
    if (!cut(G, ln.p, ln.d)) {
      return toast('Đường cắt chưa chạm vào chiếc bánh nha!', 1);
    }

    playSound('slice');
    playSound('pop');
    G.cuts--;
    hud();

    if (solved(G)) return win();
    if (G.cuts <= 0) lose('Hết nhát cắt rồi!', 'Bánh vẫn còn lẫn nhiều màu kẹo với nhau.');
  }

  function pos(e) {
    const r = cv.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * W / r.width,
      y: (e.clientY - r.top) * H / r.height
    };
  }

  cv.addEventListener('pointerdown', e => {
    if (G.state !== 'play') return;
    getAudioCtx();
    cv.setPointerCapture(e.pointerId);
    drag = { a: pos(e), b: pos(e) };
    if (G.tm && G.t0 == null) G.t0 = tt;
  });

  cv.addEventListener('pointermove', e => {
    if (drag) drag.b = pos(e);
  });

  cv.addEventListener('pointerup', e => {
    if (!drag) return;
    drag.b = pos(e);
    const ln = lineOf(drag);
    drag = null;
    if (ln && G.state === 'play') tryCut(ln);
  });

  cv.addEventListener('pointercancel', () => {
    drag = null;
  });

  function tint(c, a) {
    ctx.globalAlpha = a;
    ctx.fillStyle = c;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Canvas Drawing
  function draw() {
    const k = cv.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // 1. Draw Cake Pieces (gentle, soft bounce without shrinking)
    G.pieces.forEach(P => {
      const shift = P.pop > 0 ? Math.sin(P.pop * Math.PI) * 3.5 : 0;
      const dx = (P.n ? P.n.x : 0) * shift;
      const dy = (P.n ? P.n.y : 0) * shift;

      ctx.beginPath();
      P.poly.forEach((v, i) => {
        const x = v.x + dx;
        const y = v.y + dy;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.closePath();

      ctx.fillStyle = '#fff3d6';
      ctx.fill();

      const mono = P.dots.length && P.dots.every(o => o.c === P.dots[0].c);
      if (mono) tint(P.dots[0].c, 0.32);

      ctx.lineWidth = 4;
      ctx.strokeStyle = mono ? P.dots[0].c : '#f0b86e';
      ctx.stroke();
    });

    // 2. Draw Obstacles / Walls (Steel & Rope)
    G.walls.forEach(w => {
      const s = wallSeg(w);
      ctx.beginPath();
      ctx.moveTo(s.a.x, s.a.y);
      ctx.lineTo(s.b.x, s.b.y);

      if (w.k === 'rope') {
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#a0673a';
        ctx.setLineDash([9, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // Steel bar
        ctx.lineWidth = 12;
        ctx.strokeStyle = '#5f6b7a';
        ctx.stroke();

        ctx.lineWidth = 5;
        ctx.strokeStyle = '#d5dde5';
        ctx.stroke();
      }
    });

    // 3. Draw Ice Blocks 🧊
    (G.ices || []).forEach(ice => {
      const r = ice.r || 18;
      // Ice shadow
      ctx.beginPath();
      ctx.arc(ice.x, ice.y + 2, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(70, 130, 180, 0.2)';
      ctx.fill();

      // Ice crystal body
      ctx.beginPath();
      ctx.arc(ice.x, ice.y, r, 0, Math.PI * 2);
      ctx.fillStyle = '#e0f7fa';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#26c6da';
      ctx.stroke();

      // Snowflake icon
      ctx.font = '18px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('❄️', ice.x, ice.y + 1);
    });

    // 4. Draw Candies & Star Candies ⭐
    G.pieces.forEach(P => {
      const shift = P.pop > 0 ? Math.sin(P.pop * Math.PI) * 3.5 : 0;
      const dx = (P.n ? P.n.x : 0) * shift;
      const dy = (P.n ? P.n.y : 0) * shift;

      P.dots.forEach(o => {
        const ox = o.x + dx;
        const oy = o.y + dy;

        if (o.star) {
          // Special Star Candy ⭐
          ctx.beginPath();
          ctx.arc(ox, oy, DOT_R + 1, 0, Math.PI * 2);
          ctx.fillStyle = '#ffd166';
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#f77f00';
          ctx.stroke();

          ctx.font = '16px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⭐', ox, oy + 1);
        } else {
          // Normal Fruit Candy
          ctx.beginPath();
          ctx.arc(ox, oy, DOT_R, 0, Math.PI * 2);
          ctx.fillStyle = o.c;
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.stroke();

          // Candy highlight reflection
          ctx.beginPath();
          ctx.arc(ox - 3.5, oy - 4, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fill();
        }
      });
    });

    // 4. Draw Bombs (Crisp and unmistakable emoji 💣)
    if (G.bombs.length > 0) {
      ctx.font = '30px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      G.bombs.forEach(b => {
        ctx.fillText('💣', b.x, b.y + 1);
      });
    }

    // 5. Draw Cut Preview Line
    if (drag && G.state === 'play') {
      const ln = lineOf(drag);
      if (ln) {
        const bad = checkCut(G, ln.p, ln.d, tt);
        ctx.beginPath();
        ctx.moveTo(ln.p.x - ln.d.x * 600, ln.p.y - ln.d.y * 600);
        ctx.lineTo(ln.p.x + ln.d.x * 600, ln.p.y + ln.d.y * 600);
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 8]);
        ctx.strokeStyle = bad ? '#ff3b5c' : '#7c4dff';
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 6. Explosion Animation 💥
    if (G.boom) {
      const s = 1 + G.boom.t * 3;
      ctx.font = (40 * s) + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = Math.max(0, 1 - G.boom.t * 0.9);
      ctx.fillText('💥', G.boom.x, G.boom.y);
      ctx.globalAlpha = 1;
    }

    // 7. Lightweight Win Confetti Particles
    if (conf.length > 0) {
      conf.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, p.w, p.h);
      });
      ctx.globalAlpha = 1;
    }
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    tt += dt;

    if (G) {
      if (G.pieces) {
        G.pieces.forEach(P => {
          if (P.pop > 0) P.pop = Math.max(0, P.pop - dt * 3.5);
        });
      }

      // Fast particle physics & cleanup
      if (conf.length > 0) {
        for (let i = 0; i < conf.length; i++) {
          const p = conf[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 650 * dt;
          p.life -= dt * 0.9;
        }
        conf = conf.filter(p => p.life > 0 && p.y < H + 10);
      }

      if (G.boom) G.boom.t += dt;
      if (msgT > 0) {
        msgT -= dt;
        if (msgT <= 0) $('msg').textContent = '';
      }
      if (G.tm) {
        const left = G.t0 == null ? G.tm : Math.max(0, G.tm - (tt - G.t0));
        $('tfill').style.width = (left / G.tm * 100) + '%';
        if (left <= 0 && G.state === 'play') {
          lose('Hết thời gian rồi! ⏱️', 'Chiếc bánh vẫn chưa được chia xong.');
        }
      }
      draw();
    }
    requestAnimationFrame(frame);
  }

  // Event Listeners
  $('reset').onclick = () => {
    playSound('click');
    begin(lv);
  };
  $('prev').onclick = () => {
    playSound('click');
    begin(Math.max(0, lv - 1));
  };
  $('next').onclick = () => {
    playSound('click');
    begin(Math.min(LV.length - 1, lv + 1));
  };

  $('lvl-picker-btn').onclick = showLevelModal;
  $('select-lvl-btn').onclick = showLevelModal;
  $('close-lvl-modal').onclick = () => {
    playSound('click');
    hideLevelModal();
  };

  // Close modals when clicking outside
  $('lvl-modal').onclick = e => {
    if (e.target === $('lvl-modal')) hideLevelModal();
  };

  // Sound Toggle Button
  const soundBtn = $('sound-btn');
  soundBtn.onclick = () => {
    soundEnabled = !soundEnabled;
    soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
    if (soundEnabled) playSound('click');
  };

  // Start game
  begin(0);
  requestAnimationFrame(frame);
})();

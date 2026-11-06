/**
 * Spirit Grove — Procedural Web Audio Engine.
 * Self-contained, zero external files, no CORS/network dependencies.
 * Uses Web Audio API synthesizers for sound effects and gentle ambient zen BGM.
 */
(function (G) {
  'use strict';
  window.SpiritGrove = window.SpiritGrove || {};

  let ctx = null;
  let muted = false;
  try {
    muted = localStorage.getItem('spirit-grove:muted') === 'true';
  } catch (e) {}

  let bgmTimer = null;
  let bgmPlaying = false;
  const PENTATONIC = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25]; // C D E G A C D E

  function getContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function playTone(freq, duration = 0.2, type = 'sine', gainVal = 0.15, dest = null) {
    if (muted) return null;
    const c = getContext();
    if (!c) return null;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    g.gain.setValueAtTime(gainVal, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
    osc.connect(g);
    g.connect(dest || c.destination);
    osc.start();
    osc.stop(c.currentTime + duration);
    return { osc, gain: g };
  }

  function playSelect() {
    if (muted) return;
    const c = getContext();
    if (!c) return;
    const now = c.currentTime;
    const g = c.createGain();
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    g.connect(c.destination);

    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.1); // A5
    osc.connect(g);
    osc.start();
    osc.stop(now + 0.12);
  }

  function playSpin(direction = 1) {
    if (muted) return;
    const c = getContext();
    if (!c) return;
    const now = c.currentTime;
    // Low stone friction tone + sweep
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'triangle';
    const startF = direction === 1 ? 220 : 330;
    const endF = direction === 1 ? 330 : 220;
    osc.frequency.setValueAtTime(startF, now);
    osc.frequency.exponentialRampToValueAtTime(endF, now + 0.18);
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(g);
    g.connect(c.destination);
    osc.start();
    osc.stop(now + 0.22);
  }

  function playBlocker(code = 'sealed') {
    if (muted) return;
    const c = getContext();
    if (!c) return;
    const now = c.currentTime;
    // Thump / rattle of locked stone
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.14);
    g.gain.setValueAtTime(0.16, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(g);
    g.connect(c.destination);
    osc.start();
    osc.stop(now + 0.16);
  }

  function playUnlock() {
    if (muted) return;
    const c = getContext();
    if (!c) return;
    const now = c.currentTime;
    // Arpeggio chime
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      g.gain.setValueAtTime(0.08, now + idx * 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
      osc.connect(g);
      g.connect(c.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.26);
    });
  }

  function playWin() {
    if (muted) return;
    const c = getContext();
    if (!c) return;
    const now = c.currentTime;
    const chords = [
      [261.63, 329.63, 392.00], // C major
      [293.66, 369.99, 440.00], // D major
      [329.63, 415.30, 493.88], // E major
      [523.25, 659.25, 783.99, 1046.50] // Bright C spread
    ];
    chords.forEach((triad, step) => {
      const t = now + step * 0.16;
      triad.forEach(freq => {
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.07, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.connect(g);
        g.connect(c.destination);
        osc.start(t);
        osc.stop(t + 0.46);
      });
    });
  }

  function playUndo() {
    if (muted) return;
    const c = getContext();
    if (!c) return;
    const now = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);
    g.gain.setValueAtTime(0.1, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(g);
    g.connect(c.destination);
    osc.start();
    osc.stop(now + 0.16);
  }

  function playHint() {
    if (muted) return;
    const c = getContext();
    if (!c) return;
    const now = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    osc.connect(g);
    g.connect(c.destination);
    osc.start();
    osc.stop(now + 0.6);
  }

  // Gentle pentatonic ambient music loop
  function scheduleNextAmbientNote() {
    if (!bgmPlaying || muted) return;
    const c = getContext();
    if (!c) return;
    const note = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)];
    const now = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note, now);
    g.gain.setValueAtTime(0.025, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
    osc.connect(g);
    g.connect(c.destination);
    osc.start();
    osc.stop(now + 1.65);

    const delay = 1400 + Math.random() * 1800; // note every 1.4 - 3.2s
    bgmTimer = setTimeout(scheduleNextAmbientNote, delay);
  }

  function startBgm() {
    if (bgmPlaying || muted) return;
    bgmPlaying = true;
    scheduleNextAmbientNote();
  }

  function stopBgm() {
    bgmPlaying = false;
    clearTimeout(bgmTimer);
  }

  function toggleMute() {
    muted = !muted;
    try {
      localStorage.setItem('spirit-grove:muted', String(muted));
    } catch (e) {}
    if (muted) stopBgm();
    else {
      getContext();
      startBgm();
      playSelect();
    }
    return muted;
  }

  function isMuted() {
    return muted;
  }

  function init() {
    getContext();
    if (!muted && !bgmPlaying) {
      startBgm();
    }
  }

  // Auto init on first user touch/click
  const unlock = () => {
    init();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });

  G.Audio = {
    init,
    isMuted,
    toggleMute,
    playSelect,
    playSpin,
    playBlocker,
    playUnlock,
    playWin,
    playUndo,
    playHint,
    startBgm,
    stopBgm
  };
})(window.SpiritGrove);

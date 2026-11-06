/**
 * Paint Match - Audio
 * Tổng hợp hiệu ứng âm thanh sống động bằng Web Audio API không cần tải file ngoài.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PaintMatch = root.PaintMatch || {};
    root.PaintMatch.Audio = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  let audioCtx = null;
  let isMuted = false;

  // Đọc tùy chọn âm thanh từ localStorage
  try {
    isMuted = localStorage.getItem('paint-match-muted') === 'true';
  } catch (e) {
    // Không truy cập được storage
  }

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function isAudioMuted() {
    return isMuted;
  }

  function toggleMute() {
    isMuted = !isMuted;
    try {
      localStorage.setItem('paint-match-muted', String(isMuted));
    } catch (e) {}
    return isMuted;
  }

  // Âm thanh hoán đổi ô (Whoosh nhẹ)
  function playSwap() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Âm thanh vỡ kẹo / nổ combo (cao dần theo chuỗi combo)
  function playMatch(combo = 1) {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const baseFreq = 440 * Math.pow(1.12, Math.min(8, combo - 1));
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.14);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  // Âm thanh giọt sơn rơi chạm vào tranh (Juicy paint splat)
  function playSplat() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.1);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Âm thanh xuất hiện Cọ hoặc Xô (Magic sparkle)
  function playSpecial() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [587.33, 739.99, 880, 1174.66]; // D5, F#5, A5, D6
    notes.forEach((freq, idx) => {
      const start = ctx.currentTime + idx * 0.04;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.1, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.12);
    });
  }

  // Âm thanh vỡ đá hoặc bẻ khóa lồng nhốt
  function playBreak() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Khúc nhạc mừng chiến thắng
  function playWin() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const melody = [523.25, 659.25, 783.99, 1046.5]; // C - E - G - C
    melody.forEach((freq, idx) => {
      const start = ctx.currentTime + idx * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.35);
    });
  }

  // Âm thanh khi hết lượt chơi
  function playLose() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const tones = [330, 311, 293, 277];
    tones.forEach((freq, idx) => {
      const start = ctx.currentTime + idx * 0.14;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.1, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.25);
    });
  }

  return {
    getAudioContext,
    isMuted: isAudioMuted,
    toggleMute,
    playSwap,
    playMatch,
    playSplat,
    playSpecial,
    playBreak,
    playWin,
    playLose
  };
});


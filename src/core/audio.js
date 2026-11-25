/* Ashen Hollow - fully synthesised audio: material-aware SFX, layered ambience and generative music.
   No audio files are needed; everything is built from oscillators and filtered noise. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U;
  const A = (AH.Audio = { vol: { master: 0.8, music: 0.5, sfx: 0.8 }, listener: { x: 0, y: 0 }, ok: false });
  let ctx, master, sfxG, musG, ambG, verb, verbIn, noiseB, comp;
  let amb = null, ambT = { wind: 0.2, rain: 0, crypt: 0, night: 0 };
  let mus = null, pendingMusic = null;

  A.init = function () {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return; }
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master = ctx.createGain(); master.connect(comp); comp.connect(ctx.destination);
    sfxG = ctx.createGain(); sfxG.connect(master);
    musG = ctx.createGain(); musG.connect(master);
    ambG = ctx.createGain(); ambG.connect(master);
    /* generated impulse response for a stone-hall reverb */
    const len = ctx.sampleRate * 2.6, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    verb = ctx.createConvolver(); verb.buffer = ir; const vg = ctx.createGain(); vg.gain.value = 0.55; verb.connect(vg); vg.connect(master);
    verbIn = ctx.createGain(); verbIn.connect(verb);
    musG.connect(verbIn); sfxG.connect(verbIn);
    const nl = ctx.sampleRate * 3; noiseB = ctx.createBuffer(1, nl, ctx.sampleRate);
    const nd = noiseB.getChannelData(0); for (let i = 0; i < nl; i++) nd[i] = Math.random() * 2 - 1;
    A.applyVolumes(); buildAmbience(); A.ok = true;
    if (pendingMusic) A.music(pendingMusic);
  };
  A.applyVolumes = function () {
    if (!ctx) return;
    master.gain.value = A.vol.master; sfxG.gain.value = A.vol.sfx; musG.gain.value = A.vol.music * 0.7; ambG.gain.value = A.vol.sfx * 0.7;
  };

  /* ---------- building blocks ---------- */
  function osc(o) {
    const t = o.t || ctx.currentTime, a = o.a || 0.004, os = ctx.createOscillator();
    os.type = o.type || 'sine'; os.frequency.setValueAtTime(o.f, t);
    if (o.f2) os.frequency.exponentialRampToValueAtTime(Math.max(1, o.f2), t + a + o.dur);
    if (o.det) os.detune.value = o.det;
    if (o.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = o.vib[0]; lg.gain.value = o.vib[1]; l.connect(lg); lg.connect(os.frequency); l.start(t); l.stop(t + a + o.dur + 0.1); }
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.v || 0.3), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + o.dur);
    let n = os;
    if (o.fl) { const f = ctx.createBiquadFilter(); f.type = o.fl.type || 'lowpass'; f.frequency.setValueAtTime(o.fl.f, t); if (o.fl.f2) f.frequency.exponentialRampToValueAtTime(o.fl.f2, t + a + o.dur); f.Q.value = o.fl.q || 1; os.connect(f); n = f; }
    n.connect(g); g.connect(o.bus || sfxG); os.start(t); os.stop(t + a + o.dur + 0.1);
    return g;
  }
  function nz(o) {
    const t = o.t || ctx.currentTime, a = o.a || 0.004, s = ctx.createBufferSource(); s.buffer = noiseB; s.loop = true;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.v || 0.3), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + o.dur);
    let n = s;
    if (o.fl) { const f = ctx.createBiquadFilter(); f.type = o.fl.type || 'lowpass'; f.frequency.setValueAtTime(o.fl.f, t); if (o.fl.f2) f.frequency.exponentialRampToValueAtTime(o.fl.f2, t + a + o.dur); f.Q.value = o.fl.q || 1; s.connect(f); n = f; }
    n.connect(g); g.connect(o.bus || sfxG); s.start(t, Math.random() * 2); s.stop(t + a + o.dur + 0.1);
  }
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  /* ---------- sound effect recipes ---------- */
  const R = {
    swing: (t, p, v) => nz({ t, dur: 0.13, v: 0.2 * v, a: 0.02, fl: { type: 'bandpass', f: 1100 * p, f2: 350 * p, q: 0.9 } }),
    swing_heavy: (t, p, v) => { nz({ t, dur: 0.28, v: 0.3 * v, a: 0.05, fl: { type: 'bandpass', f: 700 * p, f2: 180 * p, q: 0.8 } }); osc({ t, type: 'sine', f: 110 * p, f2: 50, dur: 0.25, v: 0.2 * v }); },
    hit_flesh: (t, p, v) => { nz({ t, dur: 0.12, v: 0.5 * v, fl: { type: 'lowpass', f: 1600, f2: 200, q: 0.7 } }); osc({ t, type: 'sine', f: 150 * p, f2: 45, dur: 0.15, v: 0.6 * v }); },
    hit_bone: (t, p, v) => { nz({ t, dur: 0.07, v: 0.5 * v, fl: { type: 'highpass', f: 2400 * p, q: 0.7 } }); osc({ t, type: 'triangle', f: 460 * p, f2: 190 * p, dur: 0.09, v: 0.35 * v }); osc({ t: t + 0.02, type: 'square', f: 1200 * p, f2: 700, dur: 0.05, v: 0.08 * v }); },
    hit_ward: (t, p, v) => { osc({ t, type: 'square', f: 760 * p, f2: 380 * p, dur: 0.16, v: 0.2 * v, fl: { type: 'bandpass', f: 1800, q: 4 } }); nz({ t, dur: 0.06, v: 0.3 * v, fl: { type: 'highpass', f: 3000 } }); osc({ t, type: 'sine', f: 1520 * p, dur: 0.3, v: 0.1 * v }); },
    hit_stone: (t, p, v) => { nz({ t, dur: 0.14, v: 0.45 * v, fl: { type: 'lowpass', f: 1100, f2: 160, q: 1 } }); osc({ t, type: 'sine', f: 95 * p, f2: 40, dur: 0.18, v: 0.5 * v }); },
    hit_wood: (t, p, v) => { osc({ t, type: 'triangle', f: 260 * p, f2: 90 * p, dur: 0.1, v: 0.5 * v }); nz({ t, dur: 0.08, v: 0.3 * v, fl: { type: 'bandpass', f: 650, q: 2 } }); },
    hit_spirit: (t, p, v) => { osc({ t, type: 'sine', f: 500 * p, f2: 1300 * p, dur: 0.22, v: 0.25 * v }); nz({ t, dur: 0.15, v: 0.2 * v, fl: { type: 'highpass', f: 3500 } }); },
    crit: (t, p, v) => { osc({ t, type: 'sine', f: 1568 * p, dur: 0.4, v: 0.18 * v }); osc({ t, type: 'sine', f: 2349 * p, dur: 0.3, v: 0.1 * v }); },
    block: (t, p, v) => R.hit_ward(t, p * 0.8, v),
    dodge: (t, p, v) => nz({ t, dur: 0.2, v: 0.22 * v, a: 0.03, fl: { type: 'highpass', f: 500 * p, f2: 3500 * p, q: 0.6 } }),
    perfect: (t, p, v) => { osc({ t, type: 'sine', f: 880, f2: 1760, dur: 0.5, v: 0.2 * v }); osc({ t: t + 0.05, type: 'sine', f: 1320, f2: 2640, dur: 0.5, v: 0.15 * v }); nz({ t, dur: 0.4, v: 0.1, fl: { type: 'highpass', f: 4000 } }); },
    hurt: (t, p, v) => { osc({ t, type: 'sawtooth', f: 230 * p, f2: 70, dur: 0.25, v: 0.3 * v, fl: { type: 'lowpass', f: 900 } }); nz({ t, dur: 0.18, v: 0.35 * v, fl: { type: 'lowpass', f: 700 } }); },
    die: (t, p, v) => { osc({ t, type: 'sawtooth', f: 280 * p, f2: 40, dur: 0.6, v: 0.25 * v, fl: { type: 'lowpass', f: 1200, f2: 120 } }); nz({ t, dur: 0.4, v: 0.3 * v, fl: { type: 'lowpass', f: 900, f2: 100 } }); },
    step_grass: (t, p, v) => nz({ t, dur: 0.07, v: 0.07 * v, fl: { type: 'lowpass', f: 900 * p, q: 0.5 } }),
    step_dirt: (t, p, v) => nz({ t, dur: 0.06, v: 0.1 * v, fl: { type: 'lowpass', f: 600 * p } }),
    step_stone: (t, p, v) => { nz({ t, dur: 0.04, v: 0.12 * v, fl: { type: 'bandpass', f: 1800 * p, q: 1.5 } }); osc({ t, type: 'sine', f: 180 * p, f2: 110, dur: 0.05, v: 0.08 * v }); },
    step_wood: (t, p, v) => { osc({ t, type: 'triangle', f: 150 * p, f2: 90, dur: 0.07, v: 0.16 * v }); nz({ t, dur: 0.05, v: 0.06 * v, fl: { type: 'lowpass', f: 700 } }); },
    step_water: (t, p, v) => { nz({ t, dur: 0.14, v: 0.12 * v, fl: { type: 'bandpass', f: 800 * p, f2: 1600, q: 4 } }); },
    step_bone: (t, p, v) => { nz({ t, dur: 0.06, v: 0.12 * v, fl: { type: 'highpass', f: 1500 * p } }); osc({ t, type: 'triangle', f: 320, f2: 200, dur: 0.04, v: 0.05 * v }); },
    cast_necro: (t, p, v) => { osc({ t, type: 'sawtooth', f: 90 * p, f2: 55 * p, dur: 0.5, v: 0.2 * v, fl: { type: 'lowpass', f: 600, f2: 200 }, det: 8 }); nz({ t, dur: 0.5, v: 0.14 * v, a: 0.1, fl: { type: 'bandpass', f: 900, f2: 1600, q: 9 } }); },
    cast_druid: (t, p, v) => { nz({ t, dur: 0.45, v: 0.2 * v, a: 0.08, fl: { type: 'bandpass', f: 500 * p, f2: 1400 * p, q: 2 } }); osc({ t, type: 'triangle', f: 220 * p, f2: 330 * p, dur: 0.35, v: 0.2 * v }); osc({ t: t + 0.08, type: 'sine', f: 440 * p, f2: 660 * p, dur: 0.3, v: 0.1 * v }); },
    cast_blood: (t, p, v) => { osc({ t, type: 'sine', f: 70, f2: 40, dur: 0.18, v: 0.5 * v }); osc({ t: t + 0.16, type: 'sine', f: 62, f2: 36, dur: 0.2, v: 0.4 * v }); nz({ t: t + 0.05, dur: 0.35, v: 0.2 * v, fl: { type: 'lowpass', f: 500, f2: 150 } }); },
    cast_astral: (t, p, v) => { [0, 4, 7, 12, 16].forEach((s, i) => osc({ t: t + i * 0.05, type: 'sine', f: mtof(84 + s) * p, dur: 0.6, v: 0.09 * v })); osc({ t, type: 'sine', f: 300, f2: 1200, dur: 0.4, v: 0.1 * v }); },
    cast_witch: (t, p, v) => { nz({ t, dur: 0.6, v: 0.25 * v, a: 0.1, fl: { type: 'bandpass', f: 700 * p, f2: 1100, q: 12 } }); nz({ t, dur: 0.6, v: 0.18 * v, a: 0.12, fl: { type: 'bandpass', f: 1500, f2: 900, q: 14 } }); osc({ t: t + 0.3, type: 'sine', f: 2093, dur: 0.5, v: 0.08 * v }); },
    explode: (t, p, v) => { nz({ t, dur: 0.7, v: 0.6 * v, fl: { type: 'lowpass', f: 2600, f2: 90, q: 0.8 } }); osc({ t, type: 'sine', f: 70 * p, f2: 25, dur: 0.6, v: 0.7 * v }); },
    thunder: (t, p, v) => { nz({ t, dur: 2.6, v: 0.7 * v, a: 0.15, fl: { type: 'lowpass', f: 500, f2: 60, q: 0.7 } }); osc({ t, type: 'sine', f: 45, f2: 28, dur: 2, v: 0.5 * v }); },
    zap: (t, p, v) => { nz({ t, dur: 0.25, v: 0.4 * v, fl: { type: 'highpass', f: 1800 } }); osc({ t, type: 'sawtooth', f: 2400, f2: 120, dur: 0.22, v: 0.15 * v }); },
    bell: (t, p, v) => { [1, 2.01, 2.76, 4.07, 5.43].forEach((m, i) => osc({ t, type: 'sine', f: 196 * p * m, dur: 3.6 / (1 + i * 0.6), v: 0.18 * v / (1 + i * 0.5) })); },
    chime: (t, p, v) => { osc({ t, type: 'sine', f: 988 * p, dur: 0.7, v: 0.14 * v }); osc({ t: t + 0.09, type: 'sine', f: 1319 * p, dur: 0.9, v: 0.12 * v }); },
    ui_move: (t, p, v) => osc({ t, type: 'triangle', f: 520 * p, f2: 480 * p, dur: 0.04, v: 0.08 * v }),
    ui_ok: (t, p, v) => { osc({ t, type: 'triangle', f: 440 * p, dur: 0.12, v: 0.14 * v }); osc({ t: t + 0.06, type: 'triangle', f: 660 * p, dur: 0.16, v: 0.12 * v }); },
    ui_back: (t, p, v) => osc({ t, type: 'triangle', f: 330 * p, f2: 220 * p, dur: 0.1, v: 0.12 * v }),
    ui_deny: (t, p, v) => { osc({ t, type: 'square', f: 130, dur: 0.12, v: 0.1 * v, fl: { type: 'lowpass', f: 500 } }); },
    pickup: (t, p, v) => { osc({ t, type: 'sine', f: 660 * p, dur: 0.12, v: 0.15 * v }); osc({ t: t + 0.07, type: 'sine', f: 990 * p, dur: 0.2, v: 0.15 * v }); },
    levelup: (t, p, v) => { [0, 4, 7, 12, 16, 19].forEach((s, i) => osc({ t: t + i * 0.09, type: 'triangle', f: mtof(60 + s), dur: 0.7, v: 0.14 * v })); },
    soul: (t, p, v) => osc({ t, type: 'sine', f: 800 * p, f2: 1400 * p, dur: 0.25, v: 0.1 * v }),
    door: (t, p, v) => { osc({ t, type: 'sawtooth', f: 90 * p, f2: 160 * p, dur: 0.6, v: 0.18 * v, fl: { type: 'lowpass', f: 400, q: 6 }, vib: [18, 10] }); nz({ t, dur: 0.5, v: 0.12 * v, fl: { type: 'lowpass', f: 400 } }); },
    chest: (t, p, v) => { R.door(t, 1.3, v * 0.6); osc({ t: t + 0.45, type: 'sine', f: 1046, dur: 0.6, v: 0.1 * v }); },
    stone_slide: (t, p, v) => { nz({ t, dur: 1.2, v: 0.4 * v, a: 0.2, fl: { type: 'lowpass', f: 300, f2: 120 } }); osc({ t, type: 'sine', f: 50, dur: 1.2, v: 0.3 * v }); },
    caw: (t, p, v) => { for (let i = 0; i < 2; i++) osc({ t: t + i * 0.16, type: 'sawtooth', f: 520 * p, f2: 330 * p, dur: 0.12, v: 0.12 * v, fl: { type: 'bandpass', f: 900, q: 3 }, vib: [55, 40] }); },
    howl: (t, p, v) => { osc({ t, type: 'sine', f: 280 * p, f2: 520 * p, dur: 1.2, a: 0.3, v: 0.18 * v, vib: [5, 8] }); osc({ t, type: 'sawtooth', f: 281 * p, f2: 522 * p, dur: 1.2, a: 0.3, v: 0.05 * v, fl: { type: 'lowpass', f: 900 } }); },
    growl: (t, p, v) => osc({ t, type: 'sawtooth', f: 70 * p, f2: 55, dur: 0.4, a: 0.05, v: 0.2 * v, fl: { type: 'lowpass', f: 300 }, vib: [30, 12] }),
    wail: (t, p, v) => { osc({ t, type: 'sine', f: 400 * p, f2: 700 * p, dur: 0.9, a: 0.2, v: 0.16 * v, vib: [6, 12] }); nz({ t, dur: 0.9, a: 0.2, v: 0.12 * v, fl: { type: 'bandpass', f: 1200, q: 10 } }); },
    whisper: (t, p, v) => nz({ t, dur: 0.9, a: 0.3, v: 0.12 * v, fl: { type: 'bandpass', f: 2400 * p, f2: 1600, q: 5 } }),
    telegraph: (t, p, v) => { osc({ t, type: 'sine', f: 300 * p, f2: 700 * p, dur: 0.18, v: 0.12 * v }); },
    wisp_fire: (t, p, v) => { osc({ t, type: 'sine', f: 900 * p, f2: 400 * p, dur: 0.2, v: 0.12 * v }); nz({ t, dur: 0.15, v: 0.1 * v, fl: { type: 'bandpass', f: 2500, q: 3 } }); },
    crackle: (t, p, v) => nz({ t, dur: 0.02, v: 0.05 * v, fl: { type: 'highpass', f: 2500 } }),
    ritual: (t, p, v) => { R.bell(t, 0.5, v); R.whisper(t, 0.7, v); osc({ t, type: 'sine', f: 55, f2: 30, dur: 2, v: 0.4 * v }); },
    save: (t, p, v) => { [0, 7, 12, 19].forEach((s, i) => osc({ t: t + i * 0.12, type: 'sine', f: mtof(69 + s), dur: 1.4, v: 0.12 * v })); },
  };
  A.sfx = function (name, o) {
    if (!ctx || ctx.state !== 'running') return;
    o = o || {};
    const fn = R[name]; if (!fn) return;
    let v = o.v === undefined ? 1 : o.v;
    if (o.x !== undefined) { const d = U.dist(o.x, o.y, A.listener.x, A.listener.y); v *= Math.pow(U.clamp(1 - d / 280, 0, 1), 1.4); if (v < 0.03) return; }
    const p = (o.pitch || 1) * (1 + (Math.random() - 0.5) * (o.vary === undefined ? 0.08 : o.vary));
    try { fn(ctx.currentTime + (o.delay || 0), p, v); } catch (e) { /* never let audio break the game */ }
  };
  A.footstep = function (mat, x, y) { A.sfx('step_' + (mat || 'dirt'), { x, y, v: 1 }); };

  /* ---------- ambience beds ---------- */
  function loopNoise(filters, gain) {
    const s = ctx.createBufferSource(); s.buffer = noiseB; s.loop = true;
    let n = s; filters.forEach((f) => { const b = ctx.createBiquadFilter(); b.type = f.type; b.frequency.value = f.f; b.Q.value = f.q || 0.7; n.connect(b); n = b; });
    const g = ctx.createGain(); g.gain.value = 0; n.connect(g); g.connect(ambG); s.start(); return { g, s, n };
  }
  function buildAmbience() {
    amb = {};
    amb.wind = loopNoise([{ type: 'lowpass', f: 420, q: 0.5 }, { type: 'highpass', f: 80 }], 0);
    const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 0.12; lg.gain.value = 180; l.connect(lg); lg.connect(amb.wind.n.frequency); l.start();
    amb.rain = loopNoise([{ type: 'highpass', f: 1400 }, { type: 'lowpass', f: 8000 }], 0);
    amb.crypt = loopNoise([{ type: 'lowpass', f: 160, q: 4 }], 0);
    const d1 = ctx.createOscillator(), d2 = ctx.createOscillator(), dg = ctx.createGain();
    d1.type = 'sine'; d2.type = 'sine'; d1.frequency.value = 55; d2.frequency.value = 58.3; dg.gain.value = 0; d1.connect(dg); d2.connect(dg); dg.connect(ambG); d1.start(); d2.start(); amb.drone = { g: dg };
    amb.night = loopNoise([{ type: 'bandpass', f: 5200, q: 14 }], 0);
    const tl = ctx.createOscillator(), tg = ctx.createGain(); tl.type = 'square'; tl.frequency.value = 9; tg.gain.value = 0.6; tl.connect(tg); tg.connect(amb.night.g.gain); tl.start();
  }
  A.ambience = function (o) { Object.assign(ambT, o); };
  const ambCur = { wind: 0, rain: 0, crypt: 0, night: 0 };
  A.tick = function (dt) {
    if (!ctx || !amb) return;
    const mult = { wind: 0.25, rain: 0.28, crypt: 0.5, night: 0.05 };
    Object.keys(ambCur).forEach((k) => {
      ambCur[k] += (ambT[k] - ambCur[k]) * Math.min(1, dt * 0.8);
      const g = k === 'crypt' ? amb.crypt.g : amb[k].g;
      g.gain.value = ambCur[k] * mult[k];
      if (k === 'crypt') amb.drone.g.gain.value = ambCur[k] * 0.05;
    });
  };

  /* ---------- generative music ---------- */
  const SC = { minor: [0, 2, 3, 5, 7, 8, 10], phryg: [0, 1, 3, 5, 7, 8, 10], harm: [0, 2, 3, 5, 7, 8, 11], dim: [0, 1, 3, 4, 6, 7, 9] };
  const TR = {
    title: { bpm: 46, root: 38, sc: SC.minor, pad: [0, 7, 15], dens: 0.5, bell: 0.4, melodyOct: 2, choir: true, perc: 0 },
    hamlet: { bpm: 50, root: 45, sc: SC.minor, pad: [0, 7], dens: 0.35, bell: 0.12, melodyOct: 1, perc: 0 },
    forest: { bpm: 44, root: 40, sc: SC.phryg, pad: [0, 7, 12], dens: 0.22, bell: 0.05, melodyOct: 1, perc: 0.5, whisper: true },
    crypt: { bpm: 40, root: 36, sc: SC.dim, pad: [0, 6, 12], dens: 0.28, bell: 0.35, melodyOct: 1, perc: 0, choir: true },
    boss: { bpm: 88, root: 38, sc: SC.harm, pad: [0, 7, 12, 15], dens: 0.6, bell: 0.3, melodyOct: 2, perc: 1, choir: true, boss: true },
    calm: { bpm: 42, root: 43, sc: SC.minor, pad: [0, 7], dens: 0.2, bell: 0.2, melodyOct: 1, perc: 0, choir: true },
  };
  function startTrack(name) {
    const T = TR[name]; if (!T) return null;
    const out = ctx.createGain(); out.gain.value = 0.0001; out.gain.linearRampToValueAtTime(1, ctx.currentTime + 3.5); out.connect(musG);
    const nodes = [];
    T.pad.forEach((iv, i) => {
      [-7, 7].forEach((det) => {
        const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        o.type = T.choir && i > 0 ? 'sawtooth' : 'triangle'; o.frequency.value = mtof(T.root + iv + (i === 0 ? 0 : 12)); o.detune.value = det;
        f.type = 'lowpass'; f.frequency.value = 380 + i * 90; f.Q.value = 2; g.gain.value = 0.045 / (1 + i * 0.3);
        const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 0.05 + Math.random() * 0.08; lg.gain.value = 150; l.connect(lg); lg.connect(f.frequency);
        o.connect(f); f.connect(g); g.connect(out); o.start(); l.start(); nodes.push(o, l);
      });
    });
    const tr = { name, T, out, nodes, next: ctx.currentTime + 0.3, beat: 0, last: 3 };
    tr.timer = setInterval(() => {
      while (tr.next < ctx.currentTime + 0.5) { beat(tr, tr.next, tr.beat++); tr.next += 60 / T.bpm / 2; }
    }, 120);
    return tr;
  }
  function beat(tr, t, i) {
    const T = tr.T, rate = 60 / T.bpm;
    if (T.perc && i % 2 === 0) {
      const k = T.boss ? 1 : 0.55, hard = T.boss && i % 8 === 4;
      osc({ t, type: 'sine', f: 90, f2: 38, dur: 0.22, v: (hard ? 0.7 : 0.45) * k, bus: tr.out });
      if (T.boss && (i % 8 === 4)) nz({ t, dur: 0.18, v: 0.3, fl: { type: 'bandpass', f: 220, q: 1 }, bus: tr.out });
    }
    if (T.boss && i % 2 === 1) nz({ t, dur: 0.04, v: 0.06, fl: { type: 'highpass', f: 6000 }, bus: tr.out });
    if (i % 4 === 0 && Math.random() < T.dens) {
      tr.last = U.clamp(tr.last + U.pick([-2, -1, -1, 0, 1, 1, 2, 3]), 0, 9);
      const deg = tr.last, note = T.root + 12 * T.melodyOct + T.sc[deg % 7] + 12 * Math.floor(deg / 7);
      const dur = rate * U.pick([1.5, 2, 3]);
      if (T.choir || Math.random() < 0.5) osc({ t, type: 'sine', f: mtof(note), dur: dur + 0.6, a: 0.02, v: 0.09, vib: [5, 3], bus: tr.out });
      else { osc({ t, type: 'triangle', f: mtof(note), dur: 1.6, a: 0.005, v: 0.1, bus: tr.out }); osc({ t, type: 'sine', f: mtof(note + 12), dur: 1.0, v: 0.05, bus: tr.out }); }
    }
    if (Math.random() < T.bell / 8) { const n = T.root + 12 + U.pick(T.sc); [1, 2.76, 5.4].forEach((m, k) => osc({ t, type: 'sine', f: mtof(n) * m, dur: 3 / (1 + k), v: 0.07 / (1 + k * 0.7), bus: tr.out })); }
    if (T.whisper && Math.random() < 0.02) nz({ t, dur: 1.6, a: 0.5, v: 0.05, fl: { type: 'bandpass', f: 2000, f2: 1300, q: 8 }, bus: tr.out });
  }
  A.music = function (name) {
    pendingMusic = name;
    if (!ctx) return;
    if (mus && mus.name === name) return;
    if (mus) { const old = mus; old.out.gain.cancelScheduledValues(ctx.currentTime); old.out.gain.setValueAtTime(old.out.gain.value, ctx.currentTime); old.out.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 2.5); clearInterval(old.timer); setTimeout(() => old.nodes.forEach((n) => { try { n.stop(); } catch (e) { /* already stopped */ } }), 2800); }
    mus = name === 'none' ? null : startTrack(name);
  };
  A.currentMusic = () => (mus ? mus.name : 'none');
  A.suspended = () => !ctx || ctx.state !== 'running';
})();

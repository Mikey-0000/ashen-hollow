/* Ashen Hollow - VFX layer.
   Sits on top of the game without changing its rules: it wraps the hit, slash, cast and death routines, watches the player's
   state each frame, and adds a post pass (chromatic split, speed lines, flashes, god rays). Everything flashy respects
   the "reduce flashing" setting; particles respect the particle-density setting. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, P = AH.Particles, Co = AH.Combat;
  const Gm_level = () => (AH.G && AH.G.level) || 0;
  const V = (AH.VFX = { _rn: 0, _fl: 0, _lvl: 0, _ember: 0, flash: 0, flashCol: '#ffffff', aber: 0, speed: 0, vig: 0, vigCol: '#ffffff', _st: '', _perfect: 0, _x: 0, _y: 0, _step: 0, _ff: 0, _lf: 0, _dm: 0, _trail: 0 });
  const G = () => AH.G, calm = () => !!G().settings.reduceFlash, WR = () => G().world;
  const SCH = {
    necro: ['#7fe0c0', '#d4fff0', '#2a8a70'], druid: ['#8fd06a', '#e0ffb8', '#4a8a30'], blood: ['#d04050', '#ff9aa0', '#7a1420'],
    astral: ['#7fa6ff', '#e0eaff', '#3a56b0'], witch: ['#c27be0', '#f2d0ff', '#7a3ea0'],
  };
  const dot = (g, x, y) => g.fillRect(Math.round(x), Math.round(y), 1, 1);
  function line(g, x0, y0, x1, y1) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0))); for (let i = 0; i <= n; i++) dot(g, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n); }
  const add = (w, o) => { o.k = 'vfx'; o.t = 0; w.fx.push(o); return o; };
  const safe = (fn) => { try { fn(); } catch (e) { if (AH.errors) AH.errors.push('vfx: ' + e); } };

  /* ------------------------------------------------------------------ building blocks */
  /* an expanding ground ring */
  V.ring = (x, y, r, col, life, o) => {
    const w = WR(); if (!w) return; o = o || {};
    add(w, { x, y, z: o.z || 0, max: life || 0.4, r, col, thick: o.thick || 2, sq: o.sq || 0.55, light: o.light || 0, lcol: col,
      draw(g, cam, f) {
        const k = f.t / f.max, rr = f.r * U.ease.outCubic(k), sx = f.x - cam.x, sy = f.y - cam.y - f.z;
        g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = f.col;
        g.globalAlpha = (1 - k) * 0.9; g.lineWidth = Math.max(1, f.thick * (1 - k)); g.beginPath(); g.ellipse(sx, sy, rr, rr * f.sq, 0, 0, 6.283); g.stroke();
        g.globalAlpha = (1 - k) * 0.3; g.lineWidth = 1; g.beginPath(); g.ellipse(sx, sy, rr * 0.72, rr * 0.72 * f.sq, 0, 0, 6.283); g.stroke(); g.restore();
      } });
  };
  /* a bright pop of light that shrinks away */
  V.pop = (x, y, col, r, life) => {
    const w = WR(); if (!w) return;
    add(w, { x, y, max: life || 0.2, r, col, light: r * 2.2, lcol: col,
      draw(g, cam, f) { const k = f.t / f.max; g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = (1 - k) * 0.85; g.fillStyle = f.col; g.beginPath(); g.arc(f.x - cam.x, f.y - cam.y, f.r * (1 - k * 0.5), 0, 6.283); g.fill(); g.globalAlpha = (1 - k); g.fillStyle = '#fff'; g.beginPath(); g.arc(f.x - cam.x, f.y - cam.y, f.r * 0.45 * (1 - k), 0, 6.283); g.fill(); g.restore(); } });
  };
  /* a rotating glyph circle on the ground, one shape per discipline */
  V.rune = (x, y, r, col, life, sides) => {
    const w = WR(); if (!w) return;
    add(w, { x, y, max: life || 0.8, r, col, sides: sides || 6, light: r * 1.8, lcol: col[0],
      draw(g, cam, f, time) {
        const k = f.t / f.max, a = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85, sx = f.x - cam.x, sy = f.y - cam.y, sq = 0.5;
        const rr = f.r * (0.65 + 0.35 * U.ease.outCubic(Math.min(1, k * 3))), spin = time * 1.6 + f.t * 3;
        g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
        g.fillStyle = f.col[2]; for (let i = 0; i < 56; i++) { const t = (i / 56) * 6.283; dot(g, sx + Math.cos(t) * rr, sy + Math.sin(t) * rr * sq); }
        g.fillStyle = f.col[0]; const n = f.sides; const pts = [];
        for (let i = 0; i < n; i++) { const t = spin + (i / n) * 6.283; pts.push([sx + Math.cos(t) * rr * 0.82, sy + Math.sin(t) * rr * 0.82 * sq]); }
        for (let i = 0; i < n; i++) { const a2 = pts[i], b2 = pts[(i + (n > 4 ? 2 : 1)) % n]; line(g, a2[0], a2[1], b2[0], b2[1]); }
        g.fillStyle = f.col[1]; pts.forEach((q) => g.fillRect(Math.round(q[0]) - 1, Math.round(q[1]) - 1, 2, 2));
        for (let i = 0; i < 12; i++) { const t = -spin * 0.6 + (i / 12) * 6.283; line(g, sx + Math.cos(t) * rr * 1.06, sy + Math.sin(t) * rr * 1.06 * sq, sx + Math.cos(t) * rr * 1.18, sy + Math.sin(t) * rr * 1.18 * sq); }
        g.restore();
      } });
  };
  /* a column of light */
  V.pillar = (x, y, col, h, life, wd) => {
    const w = WR(); if (!w) return;
    add(w, { x, y, max: life || 0.5, col, h: h || 60, wd: wd || 6, light: 30, lcol: col,
      draw(g, cam, f) {
        const k = f.t / f.max, sx = Math.round(f.x - cam.x), sy = Math.round(f.y - cam.y), a = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8, ww = f.wd * (1 - k * 0.6);
        const gr = g.createLinearGradient(0, sy - f.h, 0, sy); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, f.col);
        g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * 0.75; g.fillStyle = gr; g.fillRect(Math.round(sx - ww / 2), sy - f.h, Math.max(1, Math.round(ww)), f.h);
        g.globalAlpha = a; g.fillStyle = '#fff'; g.fillRect(sx, sy - f.h * 0.6, 1, f.h * 0.6); g.restore();
      } });
  };
  /* motes that curve from a point into the player */
  V.motes = (x, y, n, col) => {
    const w = WR(), p = G().player; if (!w || !p) return;
    for (let i = 0; i < n; i++) {
      const sx = x, sy = y, cx = x + U.rr(-40, 40), cy = y - U.rr(30, 70), dur = U.rr(0.5, 0.85) + i * 0.04;
      add(w, { x: sx, y: sy, z: 0, max: dur, col, light: 12, lcol: col, upd(f) {
        const k = Math.pow(Math.min(1, f.t / f.max), 2.2), ex = p.x, ey = p.y - 12;
        const a = 1 - k; f.x = a * a * sx + 2 * a * k * cx + k * k * ex; f.y = a * a * sy + 2 * a * k * cy + k * k * ey;
        if (Math.random() < 0.9) P.emit({ x: f.x, y: f.y, vx: U.rr(-6, 6), vy: U.rr(-6, 6), life: 0.28, size: 1, c: f.col, add: true });
        if (f.t + 0.02 >= f.max && !f.done) { f.done = true; P.magic(p.x, p.y - 12, 3, f.col, { min: 5, max: 30 }); }
      },
      draw(g, cam, f) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = f.col; g.fillRect(Math.round(f.x - cam.x) - 1, Math.round(f.y - cam.y) - 1, 2, 2); g.fillStyle = '#fff'; dot(g, f.x - cam.x, f.y - cam.y); g.restore(); } });
    }
  };

  /* ------------------------------------------------------------------ combat */
  V.onHit = (t, r, o) => {
    const def = t.def || {}, mat = def.mat, x = t.x, y = t.y - (def.h || 20) * 0.5, ang = o.ang || 0, big = !!o.big || r >= 16, mine = o.src === G().player;
    const sc = o.school && SCH[o.school];
    const cols = sc ? [sc[1], sc[0], '#ffffff'] : mat === 'flesh' ? ['#ffe0c8', '#ff9078', '#ffffff'] : mat === 'bone' ? ['#fff6dc', '#d8cdb4', '#ffffff'] : mat === 'spirit' ? ['#d8e6ff', '#9ab8ff', '#ffffff'] : ['#fff0c0', '#ffb860', '#ffffff'];
    P.burst(x, y, big ? 16 : 9, { dir: ang, spread: 0.9, min: 70, max: big ? 230 : 160, vz: [-10, 50], g: 130, life: [0.12, 0.32], size: 1, c: cols, add: true, streak: 0.035, drag: 1.2 });
    if (o.melee || big) V.ring(x, t.y, big ? 24 : 15, cols[1], big ? 0.34 : 0.24, { thick: 2, sq: 0.55 });
    if (big) V.pop(x, y, cols[1], 12, 0.16);
    if (mine && !calm()) V.aber = Math.max(V.aber, big ? 0.6 : o.melee ? 0.25 : 0.12);
  };
  V.onDeath = (e, o) => {
    const def = e.def || {}, w = WR(), p = G().player; if (!w) return;
    const mat = def.mat, col = mat === 'flesh' ? '#ff8a70' : mat === 'bone' ? '#fff4d8' : '#9ab8ff', boss = !!def.boss;
    V.ring(e.x, e.y, boss ? 70 : 28, col, boss ? 0.7 : 0.4, { thick: boss ? 3 : 2 });
    V.pop(e.x, e.y - 10, col, boss ? 34 : 16, boss ? 0.4 : 0.22);
    P.burst(e.x, e.y - 8, boss ? 40 : 16, { dir: -Math.PI / 2, spread: 1.6, min: 20, max: boss ? 120 : 70, vz: [30, 110], g: 60, life: [0.5, 1.2], size: 2, size2: 0, c: [col, '#ffffff', '#ffd890'], add: true, streak: 0.03, drag: 1 });
    if (e.ally || !p) return;
    const sch = p.schools && p.schools.necro ? SCH.necro[0] : '#ffd070';
    V.motes(e.x, e.y - 10, boss ? 10 : def.souls ? 4 : 2, sch);
    if (boss && !calm()) { V.flash = Math.max(V.flash, 0.7); V.flashCol = '#ffffff'; V.aber = 1; }
  };
  /* the sweep of a weapon: sparks thrown along the arc and an afterglow that lingers past the white flash */
  V.slashFx = (w, x, y, ang, reach, arc, col) => {
    col = col || '#e8f0ff';
    const dir = 1;
    for (let i = 0; i < 13; i++) {
      const a = ang - arc / 2 + (i / 12) * arc, px2 = x + Math.cos(a) * reach, py2 = y + Math.sin(a) * reach * 0.8 - 8;
      P.emit({ x: px2, y: py2, z: 6, vx: -Math.sin(a) * dir * U.rr(40, 120), vy: Math.cos(a) * dir * U.rr(40, 120) * 0.8, life: U.rr(0.12, 0.3), size: 1, c: i % 3 ? col : '#ffffff', add: true, streak: 0.04, drag: 2 });
    }
    for (let i = 0; i < 5; i++) { const a = ang + U.rr(-arc / 2, arc / 2); P.emit({ x: x + Math.cos(a) * reach, y: y + Math.sin(a) * reach * 0.8 - 8, z: 6, vx: U.rr(-14, 14), vy: U.rr(-14, 14), vz: U.rr(5, 25), life: U.rr(0.35, 0.7), size: 1, c: '#ffe8b0', add: true, drag: 2 }); }
    add(w, { x, y: y - 8, max: 0.36, ang, reach, arc, col,
      draw(g, cam, f) {
        const k = f.t / f.max, sx = f.x - cam.x, sy = f.y - cam.y; g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = f.col;
        const aa = (1 - k) * (1 - k) * 0.55; g.globalAlpha = aa;
        for (let i = 0; i < 26; i++) { const a = f.ang - f.arc / 2 + (i / 25) * f.arc, rr = f.reach + 2 + k * 5; dot(g, sx + Math.cos(a) * rr, sy + Math.sin(a) * rr * 0.8); dot(g, sx + Math.cos(a) * (rr - 1), sy + Math.sin(a) * (rr - 1) * 0.8); }
        g.restore();
      } });
  };
  V.cast = (p, sp) => {
    const w = p.world, c = SCH[sp.school] || SCH.witch, big = !!sp.forbidden, x = p.x, y = p.y;
    V.rune(x, y + 2, big ? 34 : 21, c, big ? 1.1 : 0.7, { necro: 5, druid: 6, blood: 3, astral: 8, witch: 5 }[sp.school] || 6);
    V.pillar(x, y, c[0], big ? 90 : 50, big ? 0.8 : 0.45, big ? 10 : 6);
    const th = { vz: [20, 90], life: [0.4, 1.0], size: 2, size2: 0, add: true, drag: 1.4, min: 8, max: 40 };
    switch (sp.school) {
      case 'necro': P.burst(x, y - 6, 12, Object.assign({}, th, { c: [c[0], c[1]], wob: 12, g: -20 })); break;
      case 'druid': P.burst(x, y - 4, 12, { min: 15, max: 55, vz: [20, 70], g: 80, life: [0.6, 1.2], size: 2, size2: 1, c: ['#6aa84a', '#8fd06a', '#4a7a30'], drag: 1.2, wob: 16 }); break;
      case 'blood': P.burst(x, y - 8, 14, { min: 20, max: 90, vz: [30, 100], g: 240, life: [0.4, 0.9], size: 1, c: ['#a02030', '#d04050', '#ff8a90'], ground: 1 }); break;
      case 'astral': for (let i = 0; i < 10; i++) P.emit({ x: x + U.rr(-22, 22), y: y + U.rr(-14, 8), z: U.rr(6, 40), life: U.rr(0.4, 1.0), size: 1, c: '#ffffff', add: true }); P.burst(x, y - 6, 8, Object.assign({}, th, { c: [c[0], c[1]], streak: 0.05, min: 40, max: 130 })); break;
      default: P.burst(x, y - 4, 10, { min: 5, max: 25, vz: [10, 30], g: -10, life: [0.8, 1.5], size: 2, size2: 6, c: ['#3a2a4a', '#4a3a5c'], drag: 1 }); P.burst(x, y - 8, 12, Object.assign({}, th, { c: [c[0], c[1], '#7fe0a0'] }));
    }
    if (!calm()) { V.aber = Math.max(V.aber, big ? 0.8 : 0.3); V.vig = Math.max(V.vig, big ? 0.7 : 0.35); V.vigCol = c[0]; if (big) { V.flash = Math.max(V.flash, 0.35); V.flashCol = c[1]; } }
  };

  /* ------------------------------------------------------------------ movement */
  V.onDodge = (p) => { P.burst(p.x, p.y, 10, { min: 25, max: 70, vz: [5, 25], g: -5, life: [0.3, 0.6], size: 2, size2: 0, c: ['#7a6e5c', '#5a5040', '#8a7e6a'], drag: 3, flat: 0.5 }); V.ring(p.x, p.y, 17, '#cfe8ff', 0.26, { thick: 1, sq: 0.5 }); };
  V.trail = (p, dt) => {
    V._trail -= dt; const sp = Math.hypot(p.vx || 0, p.vy || 0);
    for (let i = 0; i < 2; i++) P.emit({ x: p.x + U.rr(-4, 4), y: p.y, z: U.rr(3, 20), vx: -(p.vx || 0) * 0.1, vy: -(p.vy || 0) * 0.1, life: 0.22, size: 1, c: i ? '#ffffff' : '#9ad8ff', add: true, streak: 0.06 });
    if (V._trail <= 0 && sp > 30) { V._trail = 0.05; P.dust(p.x, p.y, 2); }
  };
  V.onPerfect = (p) => {
    V.ring(p.x, p.y, 54, '#9ad8ff', 0.55, { thick: 3 }); V.ring(p.x, p.y, 32, '#ffffff', 0.36, { thick: 2 }); V.pop(p.x, p.y - 10, '#9ad8ff', 22, 0.25);
    P.burst(p.x, p.y - 10, 26, { min: 60, max: 240, vz: [-20, 70], g: 60, life: [0.2, 0.55], size: 1, c: ['#ffffff', '#9ad8ff'], add: true, streak: 0.05, drag: 1 });
    if (!calm()) { V.flash = Math.max(V.flash, 0.55); V.flashCol = '#d8ecff'; V.speed = 1; V.aber = 1; V.vig = 0.7; V.vigCol = '#9ad8ff'; }
  };
  V.step = (p, w) => {
    const mat = w.isWater(p.x, p.y + 2) ? 'water' : w.matAt(p.x, p.y), rain = AH.Weather.rainK > 0.3 && !AH.Weather.indoor;
    if (mat === 'water') {
      V.ring(p.x, p.y + 1, 9, '#a8d0ea', 0.55, { thick: 1, sq: 0.5 });
      P.burst(p.x, p.y, 4, { min: 15, max: 45, vz: [30, 75], g: 280, life: [0.3, 0.5], size: 1, c: ['#d8eeff', '#8ab8d8'], add: true, streak: 0.03 });
    } else if (mat === 'grass') P.burst(p.x, p.y, 2, { min: 10, max: 34, vz: [10, 38], g: 90, life: [0.4, 0.8], size: 1, c: ['#4a7a3a', '#6a9a48', '#2e5a2a'], drag: 2 });
    else if (mat === 'stone') P.burst(p.x, p.y, 2, { min: 5, max: 20, vz: [5, 18], g: -4, life: [0.3, 0.5], size: 1, size2: 0, c: ['#8a8a96', '#6a6a76'], drag: 3 });
    else if (mat === 'dirt') P.dust(p.x, p.y, 2);
    if (rain && mat !== 'water') V.ring(p.x, p.y + 1, 6, '#9ab8d8', 0.35, { thick: 1, sq: 0.5 });
  };

  /* ------------------------------------------------------------------ ambience */
  V.ambient = (dt, w) => {
    const We = AH.Weather, hour = G().hour, cam = w.cam, Wd = AH.W, Hd = AH.H;
    if (We.indoor) { if (w.def && w.def.name && /Catacomb/.test(w.def.name) && Math.random() < dt * 1.2) P.emit({ x: cam.x + U.rr(0, Wd), y: cam.y + U.rr(20, Hd), z: U.rr(2, 30), vx: U.rr(-3, 3), vy: U.rr(-3, 3), vz: 2, life: U.rr(5, 9), size: 1, c: '#7fe0c0', add: true, wob: 6 }); return; }
    const night = hour >= 19.5 || hour < 5.5;
    V._ff += dt; if (night && We.rainK < 0.4 && V._ff > 0.32) { V._ff = 0; P.emit({ x: cam.x + U.rr(0, Wd), y: cam.y + U.rr(40, Hd), z: U.rr(4, 26), vx: U.rr(-6, 6), vy: U.rr(-4, 4), vz: U.rr(-2, 3), life: U.rr(5, 9), size: 2, size2: 1, c: '#eaff9a', c2: '#ffe070', add: true, wob: 16 }); }
    else if (!night && hour > 7 && We.rainK < 0.3 && Math.random() < dt * 2) P.emit({ x: cam.x + U.rr(0, Wd), y: cam.y + U.rr(20, Hd), z: U.rr(4, 30), vx: U.rr(-4, 8), vy: U.rr(-3, 3), vz: 2, life: U.rr(5, 9), size: 1, c: '#fff4d0', add: true, wob: 8 });
    if (w.def && w.def.canopy > 0.3) { V._lf += dt; if (V._lf > 0.45) { V._lf = 0; P.emit({ x: cam.x + U.rr(-20, Wd + 20), y: cam.y + U.rr(10, Hd - 30), z: U.rr(26, 60), vx: 8 + We.wind * 22, vy: U.rr(2, 10), vz: -U.rr(8, 18), life: U.rr(3, 6), size: 2, size2: 1, c: U.pick(['#7a5a30', '#9a7a3a', '#5a6a2a']), wob: 22, ground: 1 }); } }
  };


  /* ------------------------------------------------------------------ weather, level-up, bosses */
  V.weather = (dt, w) => {
    const We = AH.Weather, cam = w.cam, Wd = AH.W, Hd = AH.H; if (We.indoor) return;
    /* rain: splash rings and a spit of droplets where the drops land */
    if (We.rainK > 0.3) { V._rn += dt * 38 * We.rainK; while (V._rn >= 1) { V._rn -= 1; const x = cam.x + U.rr(0, Wd), y = cam.y + U.rr(30, Hd);
      P.emit({ x, y, ring: true, size: 1, size2: U.rr(3, 6), life: 0.32, c: '#a8c4dc', add: true, sy: 0.5 });
      if (Math.random() < 0.5) P.emit({ x, y, vz: U.rr(22, 40), g: 220, life: 0.3, size: 1, c: '#d8e8f8', add: true, vx: U.rr(-8, 8), ground: 1 }); } }
    /* storm: wind-streaks and the lightning itself */
    if (We.stormK > 0.4 && Math.random() < dt * 14 * We.stormK) P.emit({ x: cam.x - 12, y: cam.y + U.rr(0, Hd), z: U.rr(0, 30), vx: 240 + U.rr(0, 120), vy: U.rr(10, 40), life: 0.9, size: 1, c: '#aebcd4', add: true, streak: 0.09, fade: 1 });
    if (We.flash > 0.95 && V._fl <= 0.95 && !calm()) V.lightning(w);
    V._fl = We.flash;
  };
  V.lightning = (w) => {
    const cam = w.cam, x = cam.x + U.rr(60, AH.W - 60), y = cam.y + U.rr(90, AH.H - 40);
    w.spawnFx({ k: 'bolt', x, y, t: 0, max: 0.3, col: '#eef4ff', seed: Math.random() * 1000 });
    V.ring(x, y, 34, '#cfe0ff', 0.45, { thick: 2 }); V.pop(x, y - 4, '#cfe0ff', 20, 0.3);
    P.burst(x, y - 4, 22, { min: 40, max: 170, vz: [20, 90], g: 160, life: [0.2, 0.5], size: 1, c: ['#ffffff', '#bcd0ff'], add: true, streak: 0.04 });
    V.flash = Math.max(V.flash, 0.4); V.flashCol = '#cfe0ff';
  };
  V.levelUp = (p) => {
    const c = ['#ffd070', '#fff4c8', '#c88a20'];
    V.rune(p.x, p.y + 2, 40, c, 1.4, 6); V.pillar(p.x, p.y, c[0], 130, 1.1, 12);
    V.ring(p.x, p.y, 70, c[0], 0.9, { thick: 3 }); V.ring(p.x, p.y, 42, c[1], 0.6, { thick: 2 });
    for (let i = 0; i < 36; i++) { const a = (i / 36) * 6.283; P.emit({ x: p.x + Math.cos(a) * 22, y: p.y + Math.sin(a) * 12, z: 0, vx: Math.cos(a) * 12, vy: Math.sin(a) * 7, vz: U.rr(40, 120), g: -14, life: U.rr(0.8, 1.6), size: 2, size2: 0, c: i % 3 ? c[0] : c[1], add: true, streak: 0.03, wob: 6 }); }
    if (!calm()) { V.flash = Math.max(V.flash, 0.45); V.flashCol = '#fff0c0'; V.vig = 0.8; V.vigCol = c[0]; }
  };
  V.bossPhase = (b) => {
    const c = ['#ff5a6a', '#ffd0d0', '#8a1828'], x = b.x, y = b.y;
    [0, 0.12, 0.26].forEach((d, i) => { const w = WR(); if (!w) return; add(w, { x, y, max: d + 0.01, upd(f) { if (!f.done && f.t >= d) { f.done = true; V.ring(x, y, 60 + i * 55, c[i === 2 ? 1 : 0], 0.7 + i * 0.1, { thick: 3 - i * 0.5 }); } }, draw() {} }); });
    V.pillar(x, y, c[0], 150, 0.9, 16); V.pop(x, y - 14, c[1], 36, 0.4);
    P.burst(x, y - 12, 60, { min: 40, max: 260, vz: [10, 120], g: 90, life: [0.4, 1.1], size: 1, c: [c[0], c[1], '#ffd890'], add: true, streak: 0.05, drag: 0.8 });
    if (!calm()) { V.flash = 0.75; V.flashCol = '#ffe0e0'; V.aber = 1; V.vig = 0.9; V.vigCol = c[0]; V.speed = 0.6; }
  };
  /* the hero's lantern: a warm bloom with a flickering flare, brighter the darker it gets */
  function lanternGlow(g, time) {
    const Gm = G(), p = Gm.player, w = Gm.world; if (!p || p.dead || Gm.screen) return;
    const cam = w.cam, dir = p.face === undefined ? 0 : p.face, lx = dir === 2 ? -7 : dir === 3 ? 7 : 6, x = Math.round(p.x - cam.x + lx), y = Math.round(p.y - cam.y - 9);
    const dim = Gm.isDim() || AH.Weather.indoor ? 1 : 0.35, fl = 0.8 + Math.sin(time * 13) * 0.08 + Math.sin(time * 7.3) * 0.08, a = dim * fl * (p.lanternK || 1);
    g.save(); g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(x, y, 0, x, y, 28); gr.addColorStop(0, 'rgba(255,190,90,0.5)'); gr.addColorStop(0.4, 'rgba(255,140,50,0.16)'); gr.addColorStop(1, 'rgba(255,120,40,0)');
    g.globalAlpha = a; g.fillStyle = gr; g.fillRect(x - 28, y - 28, 56, 56);
    g.globalAlpha = a * 0.9; g.fillStyle = '#ffe8b0'; const L = 3 + Math.round(fl * 3);
    for (let i = 1; i <= L; i++) { g.fillRect(x - i, y, 1, 1); g.fillRect(x + i, y, 1, 1); if (i < L - 1) { g.fillRect(x, y - i, 1, 1); g.fillRect(x, y + i, 1, 1); } }
    g.restore();
  }

  /* ------------------------------------------------------------------ per-frame */
  V.update = (dt) => {
    const w = WR(), p = G().player; if (!w || !p || G().mode !== 'play') return;
    V.flash = Math.max(0, V.flash - dt * 3.2); V.aber = Math.max(0, V.aber - dt * 2.4); V.speed = Math.max(0, V.speed - dt * 2.2); V.vig = Math.max(0, V.vig - dt * 1.8);
    safe(() => {
      const st = p.state;
      if (st === 'dodge' && V._st !== 'dodge') V.onDodge(p);
      if (st === 'dodge' || st === 'dash') V.trail(p, dt);
      V._st = st;
      if (p.perfect > V._perfect + 0.5) V.onPerfect(p); V._perfect = p.perfect || 0;
      const mv = Math.hypot(p.x - V._x, p.y - V._y); V._x = p.x; V._y = p.y;
      if (mv > 0 && mv < 12 && st !== 'dodge' && st !== 'dash') { V._step += mv; if (V._step > 11) { V._step = 0; V.step(p, w); } }
      V.ambient(dt, w); V.weather(dt, w);
      if (V._lvl && Gm_level() > V._lvl) V.levelUp(p); V._lvl = Gm_level();
      V._ember -= dt; if (V._ember <= 0 && !G().screen) { V._ember = U.rr(0.25, 0.6); const dir = p.face || 0; P.emit({ x: p.x + (dir === 2 ? -7 : dir === 3 ? 7 : 6), y: p.y, z: 8, vx: U.rr(-5, 5), vy: U.rr(-3, 3), vz: U.rr(8, 22), g: -4, life: U.rr(0.6, 1.2), size: 1, c: '#ffc070', add: true, wob: 5 }); }
    });
  };

  /* ------------------------------------------------------------------ post pass */
  let cp = null, tc = null, cpg = null, tg = null;
  function aberrate(g) {
    if (!cp || cp.width !== AH.W * (AH.SC || 1)) { const K = AH.SC || 1; cp = U.makeCanvas(AH.W * K, AH.H * K); tc = U.makeCanvas(AH.W * K, AH.H * K); cpg = cp.getContext('2d'); tg = tc.getContext('2d'); }
    cpg.globalCompositeOperation = 'copy'; cpg.drawImage(g.canvas, 0, 0);
    const k = Math.max(1, Math.round(V.aber * 3)); g.save(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.fillStyle = '#000'; g.fillRect(0, 0, AH.W, AH.H);
    [['#ff0000', -k, 0], ['#00ff00', 0, 0], ['#0000ff', k, 0]].forEach((c) => {
      tg.globalCompositeOperation = 'copy'; tg.drawImage(cp, 0, 0); tg.globalCompositeOperation = 'multiply'; tg.fillStyle = c[0]; tg.fillRect(0, 0, tc.width, tc.height);
      g.globalCompositeOperation = 'lighter'; g.drawImage(tc, c[1], c[2], AH.W, AH.H);
    });
    g.restore();
  }
  function speedLines(g) {
    const W = AH.W, H = AH.H, cx = W / 2, cy = H / 2, rg = U.mulberry32(11);
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = '#cfe8ff'; g.lineWidth = 1;
    for (let i = 0; i < 30; i++) { const a = rg() * 6.283, r1 = 70 + rg() * 60 + (1 - V.speed) * 90, r2 = r1 + 40 + rg() * 120; g.globalAlpha = V.speed * (0.2 + rg() * 0.4); g.beginPath(); g.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.9); g.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2 * 0.9); g.stroke(); }
    g.restore();
  }
  function godRays(g, time) {
    const We = AH.Weather, hour = G().hour; if (We.indoor || hour < 6.5 || hour > 18.2 || We.rainK > 0.3 || We.fogK > 0.6) return;
    const W = AH.W, H = AH.H, day = Math.sin(((hour - 6.5) / 11.7) * Math.PI), warm = hour < 9 || hour > 16, col = warm ? '#ffc880' : '#fff0c8';
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = col;
    for (let i = 0; i < 6; i++) {
      const x0 = ((i * 104 + time * 4) % (W + 220)) - 110, w0 = 18 + (i % 3) * 14, sl = 90;
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.globalAlpha = (0.03 + 0.025 * Math.sin(time * 0.4 + i * 1.7)) * (0.5 + day * 0.7) * (warm ? 1.4 : 1);
      g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + w0, 0); g.lineTo(x0 + w0 - sl, H); g.lineTo(x0 - sl, H); g.closePath(); g.fill();
    }
    g.restore();
  }
  V.post = (g) => {
    const Gm = G(); if (Gm.mode !== 'play' || !Gm.world) return; const time = performance.now() / 1000, c = calm(), W = AH.W, H = AH.H;
    safe(() => {
      godRays(g, time);
      if (!c && V.aber > 0.04) aberrate(g);
      if (!c && V.speed > 0.04) speedLines(g);
      lanternGlow(g, time);
      if (V.vig > 0.02) { const gr = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.62); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, V.vigCol); g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(0.55, V.vig * (c ? 0.35 : 0.6)); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore(); }
      if (!c && V.flash > 0.02) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(0.5, V.flash * 0.6); g.fillStyle = V.flashCol; g.fillRect(0, 0, W, H); g.restore(); }
    });
  };

  /* ------------------------------------------------------------------ wrap the game's own routines */
  const hitOrig = Co.hit;
  Co.hit = function (t, dmg, o) { const r = hitOrig.apply(this, arguments); if (r > 0 && t && !(o && o.silent)) safe(() => V.onHit(t, r, o || {})); return r; };
  const M = AH.Magic;
  const fireOrig = M.fire; M.fire = function (p, sp) { const r = fireOrig.apply(this, arguments); safe(() => V.cast(p, sp)); return r; };
  const chanOrig = M.channel; M.channel = function (p, sp, k, dt) {
    const r = chanOrig.apply(this, arguments); const c = SCH[sp.school] || SCH.witch;
    safe(() => { if (Math.random() < 0.85) { const a = Math.random() * 6.283; P.emit({ x: p.x + Math.cos(a) * 24, y: p.y + Math.sin(a) * 14, z: U.rr(2, 18), vx: -Math.cos(a) * 46, vy: -Math.sin(a) * 26, life: 0.5, size: 1, c: c[0], add: true }); } });
    return r;
  };
  const dieOrig = AH.Enemy.prototype.die;
  AH.Enemy.prototype.die = function (o) { const was = this.dead; const r = dieOrig.apply(this, arguments); if (!was && this.dead) safe(() => V.onDeath(this, o)); return r; };
  if (AH.Boss && AH.Boss.prototype.phaseShift) { const po = AH.Boss.prototype.phaseShift; AH.Boss.prototype.phaseShift = function () { const r = po.apply(this, arguments); safe(() => V.bossPhase(this)); return r; }; }
  const Wc = AH.World && AH.World.prototype;
  if (Wc && Wc.slash) { const so = Wc.slash; Wc.slash = function (x, y, ang, reach, arc, col, life) { so.apply(this, arguments); safe(() => V.slashFx(this, x, y, ang, reach, arc, col)); }; }
})();

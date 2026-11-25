/* Ashen Hollow - VFX 2: punch, bloom, light shafts, school signatures, third-person camera.
   Sits on top of vfx.js without changing game rules.
   - Punch: harder hit-stop on kills, crits and heavy hits; targets squash and rebound; the camera is kicked along the blow.
   - Bloom: bright parts of the finished picture are blurred back over themselves (cheap chain of shrunken copies; switches itself off if it costs too much).
   - Shafts: slanting light from windows, with dust motes drifting through it.
   - Signatures: each magic school has its own casting flourish, projectile trail and impact.
   - Third-person camera (F9 or Settings): a chase view, zoomed in with the hero held low on the screen so you see further ahead; aim follows the mouse correctly. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, P = AH.Particles, Co = AH.Combat, M = AH.Magic, V = AH.VFX; if (!V) return;
  const G = () => AH.G, safe = (fn) => { try { return fn(); } catch (e) { if (AH.errors) AH.errors.push('vfx2: ' + e); } };
  const S = () => { const s = G().settings; if (s.bloom === undefined) s.bloom = true; if (s.shafts === undefined) s.shafts = true; if (s.chaseCam === undefined) s.chaseCam = false; return s; };
  const calm = () => !!G().settings.reduceFlash;
  const SCH = { necro: ['#7fe0c0', '#d4fff0', '#2a8a70'], druid: ['#8fd06a', '#e0ffb8', '#4a8a30'], blood: ['#d04050', '#ff9aa0', '#7a1420'], astral: ['#7fa6ff', '#e0eaff', '#3a56b0'], witch: ['#c27be0', '#f2d0ff', '#7a3ea0'] };
  const addFx = (w, o) => { o.k = 'vfx'; o.t = 0; w.fx.push(o); return o; };
  const V2 = (AH.VFX2 = { kx: 0, ky: 0, _t: performance.now() });

  /* ---------------------------------------------------------------- decals (long-lived floor marks) */
  V2.decal = (x, y, col, size, life, a) => {
    const w = G().world; if (!w || w.fx.length > 260) return;
    const blobs = []; for (let i = 0; i < 4 + Math.floor(size / 2); i++) blobs.push([U.rr(-size, size), U.rr(-size, size) * 0.5, U.rr(0.35, 1) * size * 0.5]);
    addFx(w, { x, y, max: life || 6, col, blobs, a: a || 0.5, draw(g, cam, f) { const k = f.t / f.max, al = f.a * (k < 0.04 ? k / 0.04 : 1 - k * k * k); g.save(); g.globalAlpha = Math.max(0, al); g.fillStyle = f.col; f.blobs.forEach((b) => { g.beginPath(); g.ellipse(Math.round(f.x - cam.x + b[0]), Math.round(f.y - cam.y + b[1]), Math.max(1, b[2]), Math.max(1, b[2] * 0.55), 0, 0, 6.283); g.fill(); }); g.restore(); } });
  };
  /* a four-point flare used by astral magic */
  V2.flare = (x, y, z, col, life, len) => {
    const w = G().world; if (!w) return;
    addFx(w, { x, y, z, max: life || 0.18, col, len: len || 9, draw(g, cam, f) { const k = f.t / f.max, a = 1 - k, sx = Math.round(f.x - cam.x), sy = Math.round(f.y - cam.y - f.z), L = Math.round(f.len * (0.4 + a)); g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; g.fillStyle = f.col; g.fillRect(sx - L, sy, L * 2 + 1, 1); g.fillRect(sx, sy - Math.round(L * 0.7), 1, Math.round(L * 1.4) + 1); g.fillStyle = '#ffffff'; g.fillRect(sx - 1, sy - 1, 3, 3); g.restore(); } });
  };

  /* ---------------------------------------------------------------- 1. PUNCH */
  const hitOrig = Co.hit;
  Co.hit = function (t, dmg, o) {
    const was = t && t.dead, r = hitOrig.apply(this, arguments);
    if (r > 0 && t && !(o && o.silent)) safe(() => {
      const Gm = G(), p = Gm.player, mine = o && o.src === p, boss = !!(t.def && t.def.boss), kill = !was && t.dead, big = !!(o && (o.big || o.crit)) || r >= 16, hs = Gm.settings.hitstop;
      let stop = 0; if (kill) stop = boss ? 0.16 : big ? 0.1 : 0.075; else if (o && o.crit) stop = 0.085; else if (big) stop = 0.06; else if (boss) stop = 0.04;
      if (mine && stop) Gm.hitstop = Math.max(Gm.hitstop, stop * hs);
      const ang = (o && o.ang) || 0;
      t._pn = { t0: performance.now(), ang, k: kill ? 1.4 : big ? 1 : 0.55 };
      if (mine) { const k = kill ? 5 : big ? 3.5 : 1.8; V2.kx += Math.cos(ang) * k; V2.ky += Math.sin(ang) * k * 0.7; if (big || kill) Z.pulse = Math.max(Z.pulse, kill ? 1 : 0.6); }
    });
    return r;
  };
  const kickHurt = (ang, k) => { V2.kx += Math.cos(ang) * k; V2.ky += Math.sin(ang) * k * 0.7; Z.pulse = Math.max(Z.pulse, 0.7); };
  if (AH.Player && AH.Player.prototype.hurt) { const h0 = AH.Player.prototype.hurt; AH.Player.prototype.hurt = function (dmg, ang) { const hp0 = this.hp, r = h0.apply(this, arguments); if (this.hp < hp0 && !this.dead) safe(() => kickHurt((ang || 0) + Math.PI, Math.min(6, 2 + dmg / 8))); return r; }; }
  /* squash and rebound drawn around the entity's own draw call */
  const wrapDraw = (proto) => {
    if (!Object.prototype.hasOwnProperty.call(proto, 'draw')) return; const d0 = proto.draw;
    proto.draw = function (g, cam) {
      const pn = this._pn; if (!pn || this.dead && !this.corpseOnly) return d0.apply(this, arguments);
      const age = (performance.now() - pn.t0) / 1000, dur = 0.22; if (age > dur) { this._pn = null; return d0.apply(this, arguments); }
      const k = Math.sin((1 - age / dur) * Math.PI * 0.5) * Math.cos(age * 40) * pn.k * (1 - age / dur), horiz = Math.abs(Math.cos(pn.ang)) > 0.55, fx = this.x - cam.x, fy = this.y - cam.y;
      g.save(); g.translate(fx, fy); g.rotate(Math.cos(pn.ang) * 0.05 * k); g.scale(horiz ? 1 - 0.13 * k : 1 + 0.1 * k, horiz ? 1 + 0.1 * k : 1 - 0.13 * k); g.translate(-fx + Math.cos(pn.ang) * 1.5 * k, -fy);
      const r = d0.apply(this, arguments); g.restore(); return r;
    };
  };
  wrapDraw(AH.Enemy.prototype); if (AH.Boss) wrapDraw(AH.Boss.prototype);
  /* camera kick: the world is drawn with a decaying nudge */
  const wd0 = AH.World.prototype.draw;
  AH.World.prototype.draw = function (g) {
    const now = performance.now(), dt = Math.min(0.05, (now - V2._t) / 1000); V2._t = now; const f = Math.pow(0.0006, dt); V2.kx *= f; V2.ky *= f;
    const c = this.cam, kx = calm() ? 0 : Math.round(V2.kx), ky = calm() ? 0 : Math.round(V2.ky); c.x += kx; c.y += ky;
    try { return wd0.apply(this, arguments); } finally { c.x -= kx; c.y -= ky; }
  };

  /* ---------------------------------------------------------------- 2. BLOOM */
  const B = { c: [], cost: 0, n: 0, off: false };
  const small = (i, w, h) => { let c = B.c[i]; if (!c || c.width !== w || c.height !== h) { c = B.c[i] = document.createElement('canvas'); c.width = w; c.height = h; } return c.getContext('2d'); };
  function bloom(g) {
    const s = S(); if (!s.bloom || B.off) return; const t0 = performance.now(), cv = g.canvas, W = cv.width, H = cv.height;
    const q = (ctx, src) => { ctx.globalCompositeOperation = 'copy'; ctx.imageSmoothingEnabled = true; ctx.drawImage(src, 0, 0, ctx.canvas.width, ctx.canvas.height); };
    const a = small(0, W >> 1, H >> 1); q(a, cv);
    const b = small(1, W >> 2, H >> 2); q(b, a.canvas);
    b.globalCompositeOperation = 'multiply'; b.drawImage(b.canvas, 0, 0); b.drawImage(b.canvas, 0, 0);          /* keep only what is very bright */
    const c = small(2, W >> 3, H >> 3); q(c, b.canvas); const d = small(3, W >> 4, H >> 4); q(d, c.canvas);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = true; g.globalCompositeOperation = 'lighter';
    const k = calm() ? 0.6 : 1; g.globalAlpha = 0.34 * k; g.drawImage(b.canvas, 0, 0, W, H); g.globalAlpha = 0.4 * k; g.drawImage(c.canvas, 0, 0, W, H); g.globalAlpha = 0.34 * k; g.drawImage(d.canvas, 0, 0, W, H); g.restore();
    B.cost += performance.now() - t0; if (++B.n >= 150) { if (B.cost / B.n > 6 && AH.SC !== 1) { B.off = true; G().toast('Bloom switched off to keep the game smooth. Re-enable it in Settings if you like.', '#9ab8ff'); } B.cost = 0; B.n = 0; }
  }

  /* ---------------------------------------------------------------- 3. LIGHT SHAFTS */
  function shafts(g, time) {
    if (!S().shafts) return; const w = G().world; if (!w || !w.objs) return; const cam = w.cam, W = AH.W, H = AH.H, hour = G().hour, day = hour > 6.5 && hour < 18.2;
    const tint = day ? '#ffe4a8' : '#8ea8ff', al0 = day ? 0.2 : 0.11;
    g.save(); g.globalCompositeOperation = 'lighter';
    w.objs.forEach((o) => {
      if (!o.d || o.d.spr !== 'window') return; const sx = o.x - cam.x, sy = o.y - cam.y; if (sx < -90 || sx > W + 90 || sy < -90 || sy > H + 30) return;
      const fl = 0.8 + 0.2 * Math.sin(time * 0.5 + o.x * 0.1), L = 74, sh = 38;
      const gr = g.createLinearGradient(sx, sy, sx + sh, sy + L); gr.addColorStop(0, tint); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.globalAlpha = al0 * fl; g.beginPath(); g.moveTo(sx - 8, sy); g.lineTo(sx + 8, sy); g.lineTo(sx + 8 + sh + 14, sy + L); g.lineTo(sx - 8 + sh - 4, sy + L); g.closePath(); g.fill();
      g.globalAlpha = al0 * fl * 0.6; g.beginPath(); g.moveTo(sx - 2, sy); g.lineTo(sx + 3, sy); g.lineTo(sx + 3 + sh * 0.9, sy + L * 0.8); g.lineTo(sx - 2 + sh * 0.7, sy + L * 0.8); g.closePath(); g.fill();
    });
    g.restore();
  }

  /* ---------------------------------------------------------------- 4. SCHOOL SIGNATURES */
  const SIG = {
    necro: { trail(pr, z) { P.emit({ x: pr.x + U.rr(-2, 2), y: pr.y, z, vx: U.rr(-9, 9), vy: U.rr(-6, 6), vz: U.rr(12, 34), life: U.rr(0.4, 0.8), size: 1, size2: 0, c: ['#7fe0c0', '#d4fff0', '#2a8a70'][U.ri(0, 2)], add: true, wob: 12, g: -16 }); if (Math.random() < 0.18) P.emit({ x: pr.x, y: pr.y, z: z + 2, vz: 20, life: 0.7, size: 2, size2: 0, c: '#b8fff0', add: true, wob: 8, g: -10 }); },
      impact(t, x, y) { for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; P.emit({ x: x + Math.cos(a) * 6, y: y + Math.sin(a) * 3, z: 4, vx: -Math.sin(a) * 36, vy: Math.cos(a) * 18, vz: U.rr(34, 70), life: U.rr(0.5, 0.9), size: 1, size2: 0, c: i % 2 ? '#7fe0c0' : '#d4fff0', add: true, wob: 6, g: -20, drag: 1 }); } },
      cast(p, x, y) { for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; P.emit({ x: x + Math.cos(a) * 14, y: y + Math.sin(a) * 7, z: 2, vx: -Math.sin(a) * 28, vy: Math.cos(a) * 14, vz: U.rr(30, 60), life: U.rr(0.6, 1.0), size: 2, size2: 0, c: i % 2 ? '#7fe0c0' : '#d4fff0', add: true, wob: 8, g: -14, drag: 0.8 }); } } },
    druid: { trail(pr, z) { P.emit({ x: pr.x + U.rr(-3, 3), y: pr.y, z, vx: U.rr(-18, 18), vy: U.rr(-10, 10), vz: U.rr(-4, 18), life: U.rr(0.5, 1.0), size: 1, size2: 1, c: ['#6aa84a', '#8fd06a', '#a8854a', '#4a7a30'][U.ri(0, 3)], g: 55, wob: 18, drag: 0.8 }); },
      impact(t, x, y) { P.burst(x, y, 14, { min: 20, max: 80, vz: [30, 90], g: 90, life: [0.5, 1.1], size: 1, size2: 1, c: ['#6aa84a', '#8fd06a', '#e8a8c0', '#a8854a'], wob: 20, drag: 1 }); V.ring && V.ring(x, y, 16, '#8fd06a', 0.3, { thick: 1 }); },
      cast(p, x, y) { P.burst(x, y, 12, { min: 20, max: 60, vz: [30, 80], g: 70, life: [0.6, 1.2], size: 1, size2: 1, c: ['#6aa84a', '#8fd06a', '#e8a8c0'], wob: 22, drag: 1 }); } },
    blood: { trail(pr, z) { P.emit({ x: pr.x + U.rr(-2, 2), y: pr.y, z, vx: U.rr(-14, 14), vy: U.rr(-8, 8), vz: U.rr(0, 20), life: U.rr(0.4, 0.8), size: 1, c: ['#a02030', '#d04050', '#7a1420'][U.ri(0, 2)], g: 260, ground: 1 }); if (Math.random() < 0.08) V2.decal(pr.x, pr.y + 4, '#5a0c18', 2, 5, 0.5); },
      impact(t, x, y) { P.burst(x, y, 16, { min: 40, max: 150, vz: [20, 110], g: 300, life: [0.3, 0.8], size: 1, c: ['#a02030', '#d04050', '#ff8a90'], ground: 1, drag: 0.6 }); V2.decal(x, y + 4, '#6a0e1c', 5, 7, 0.6); },
      cast(p, x, y) { P.burst(x, y - 4, 14, { min: 20, max: 90, vz: [40, 120], g: 280, life: [0.4, 0.9], size: 1, c: ['#a02030', '#d04050', '#ff8a90'], ground: 1 }); V2.decal(x, y + 4, '#5a0c18', 7, 8, 0.55); } },
    astral: { trail(pr, z) { if (Math.random() < 0.7) P.emit({ x: pr.x + U.rr(-3, 3), y: pr.y + U.rr(-2, 2), z: z + U.rr(-3, 3), vx: U.rr(-6, 6), vy: U.rr(-4, 4), vz: U.rr(-4, 8), life: U.rr(0.3, 0.9), size: 1, c: Math.random() < 0.5 ? '#ffffff' : '#9ab8ff', add: true }); },
      head(pr, z) { V2.flare(pr.x, pr.y, z, '#9ab8ff', 0.07, 7); },
      impact(t, x, y) { V2.flare(x, y, 10, '#c8dcff', 0.26, 13); P.burst(x, y - 8, 10, { min: 40, max: 120, vz: [0, 40], g: 0, life: [0.3, 0.7], size: 1, c: ['#ffffff', '#9ab8ff'], add: true, streak: 0.05, drag: 1.4 }); },
      cast(p, x, y) {
        const pts = []; for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283 + U.rr(-0.3, 0.3); pts.push([Math.cos(a) * U.rr(20, 28), Math.sin(a) * U.rr(10, 15) - 14]); }
        const w = G().world; addFx(w, { x, y, max: 0.7, pts, draw(g, cam, f) { const k = f.t / f.max, a = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8, sx = f.x - cam.x, sy = f.y - cam.y; g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * 0.7; g.strokeStyle = '#9ab8ff'; g.lineWidth = 1; g.beginPath(); f.pts.forEach((q, i) => { i ? g.lineTo(sx + q[0], sy + q[1]) : g.moveTo(sx + q[0], sy + q[1]); }); g.stroke(); g.fillStyle = '#ffffff'; g.globalAlpha = a; f.pts.forEach((q, i) => { const s = (Math.sin(f.t * 14 + i * 2) > 0.2) ? 2 : 1; g.fillRect(Math.round(sx + q[0]) - (s > 1 ? 1 : 0), Math.round(sy + q[1]) - (s > 1 ? 1 : 0), s, s); }); g.restore(); } });
      } },
    witch: { trail(pr, z) { P.emit({ x: pr.x + U.rr(-2, 2), y: pr.y, z, vx: U.rr(-8, 8), vy: U.rr(-6, 6), vz: U.rr(6, 22), life: U.rr(0.5, 0.9), size: 2, size2: 5, c: ['#3a2a4a', '#5a3e78'][U.ri(0, 1)], drag: 1 }); if (Math.random() < 0.5) P.emit({ x: pr.x, y: pr.y, z, vx: U.rr(-12, 12), vy: U.rr(-8, 8), vz: U.rr(8, 26), life: 0.45, size: 1, c: Math.random() < 0.5 ? '#c27be0' : '#f2d0ff', add: true }); },
      impact(t, x, y) { P.burst(x, y - 6, 8, { min: 10, max: 40, vz: [10, 40], g: -10, life: [0.6, 1.2], size: 2, size2: 7, c: ['#3a2a4a', '#5a3e78'], drag: 1 }); P.burst(x, y - 8, 10, { min: 30, max: 100, vz: [10, 60], g: 20, life: [0.2, 0.5], size: 1, c: ['#c27be0', '#f2d0ff'], add: true, streak: 0.04 }); },
      cast(p, x, y) { for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; P.emit({ x: x + Math.cos(a) * 12, y: y + Math.sin(a) * 6, z: 2, vx: Math.cos(a) * 18, vy: Math.sin(a) * 9, vz: U.rr(14, 40), life: U.rr(0.6, 1.0), size: 2, size2: 6, c: i % 2 ? '#3a2a4a' : '#5a3e78', drag: 1 }); } } },
  };
  const hitOrig2 = Co.hit;
  Co.hit = function (t, dmg, o) { const r = hitOrig2.apply(this, arguments); if (r > 0 && t && o && o.spell && o.src === G().player) safe(() => { const sg = SIG[o.school]; if (sg) sg.impact(t, t.x, t.y - ((t.def && t.def.h) || 20) * 0.5); }); return r; };
  const fire0 = M.fire; M.fire = function (p, sp) { const r = fire0.apply(this, arguments); safe(() => { const sg = SIG[sp.school]; if (sg) sg.cast(p, p.x, p.y); }); return r; };
  V2.update = (dt) => safe(() => {
    const w = G().world, p = G().player; if (!w || !p) return;
    if (S().shafts) { V2._m = (V2._m || 0) - dt; if (V2._m <= 0) { V2._m = 0.22; const cam = w.cam, day = G().hour > 6.5 && G().hour < 18.2; w.objs.forEach((o) => { if (!o.d || o.d.spr !== 'window') return; const sx = o.x - cam.x, sy = o.y - cam.y; if (sx < -60 || sx > AH.W + 60 || sy < -60 || sy > AH.H) return; const t = Math.random(); P.emit({ x: o.x + t * 38 + U.rr(-6, 6) * (1 + t), y: o.y + t * 70 + 10, z: U.rr(0, 4), vx: U.rr(-3, 3), vy: U.rr(-2, 2), vz: U.rr(-1, 4), life: U.rr(1.4, 2.6), size: 1, c: day ? '#fff0c0' : '#c8d8ff', add: true, wob: 4 }); }); } }
    for (const pr of w.projectiles) {
      if (!pr || !pr.sp || pr.src !== p) continue; const sg = SIG[pr.sp.school]; if (!sg) continue; pr._e = (pr._e || 0) + dt; const z = pr.z || 6;
      while (pr._e > 0.022) { pr._e -= 0.022; sg.trail(pr, z); }
      if (sg.head) sg.head(pr, z);
    }
  });
  const vu0 = V.update; V.update = function (dt) { const r = vu0.apply(this, arguments); V2.update(dt); return r; };

  /* ---------------------------------------------------------------- 5. THIRD-PERSON CAMERA */
  const Z = (AH.Zoom = { z: 1, pulse: 0, rect: null, dx: 0, dy: 0, tmp: null, ax: 0, ay: 0 });
  const zt = () => { const Gm = G(); return Gm.mode === 'play' && S().chaseCam && Gm.screen !== 'photo'; };
  Z.unmap = (m) => { const r = Z.rect; if (!r || Z.z < 1.002) return m; return { x: r.sx + m.x * r.sw / AH.W, y: r.sy + m.y * r.sh / AH.H, down: m.down, pressed: m.pressed }; };
  function zoom(g) {
    const Gm = G(), w = Gm.world, p = Gm.player, W = AH.W, H = AH.H, now = performance.now(), dt = Math.min(0.05, (now - (Z._t || now)) / 1000); Z._t = now;
    const on = zt(), sprint = on && (p.state === 'dodge' ? -0.06 : 0), tgt = on ? 1.55 + sprint : 1;
    Z.z += (tgt - Z.z) * Math.min(1, dt * (on ? 4 : 7)); Z.pulse = Math.max(0, Z.pulse - dt * 4.5);
    if (Z.z < 1.004) { Z.rect = null; Z.z = Math.abs(Z.z - 1) < 0.004 ? 1 : Z.z; if (!on) return; }
    const k = Z.z + Z.pulse * 0.035 * (on ? 1 : 0);
    const fx = Math.cos(p.aimA || 0), fy = Math.sin(p.aimA || 0); Z.ax += (fx - Z.ax) * Math.min(1, dt * 2.2); Z.ay += (fy - Z.ay) * Math.min(1, dt * 2.2);
    const lerp = Math.min(1, (Z.z - 1) / 0.55), Dx = W / 2 - Z.ax * 26 * lerp, Dy = H * (0.5 + 0.13 * lerp) - Z.ay * 16 * lerp;
    const sxp = p.x - w.cam.x, syp = p.y - 8 - w.cam.y, sw = W / k, sh = H / k;
    let sx = sxp - Dx / k, sy = syp - Dy / k; sx = U.clamp(sx, 0, W - sw); sy = U.clamp(sy, 0, H - sh); Z.rect = { sx, sy, sw, sh };
    const cv = g.canvas, BW = cv.width, BH = cv.height; if (!Z.tmp || Z.tmp.width !== BW || Z.tmp.height !== BH) { Z.tmp = document.createElement('canvas'); Z.tmp.width = BW; Z.tmp.height = BH; }
    const tc = Z.tmp.getContext('2d'); tc.globalCompositeOperation = 'copy'; tc.drawImage(cv, 0, 0);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.globalCompositeOperation = 'copy';
    g.drawImage(Z.tmp, sx / W * BW, sy / H * BH, sw / W * BW, sh / H * BH, 0, 0, BW, BH);
    /* depth: darken the edges a touch, as a lens would */
    const vg = g.createRadialGradient(BW / 2, BH * 0.55, BH * 0.38, BW / 2, BH * 0.55, BW * 0.62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,' + (0.38 * lerp) + ')'); g.globalCompositeOperation = 'source-over'; g.fillStyle = vg; g.fillRect(0, 0, BW, BH);
    g.restore();
  }
  document.addEventListener('keydown', (e) => { if (e.code === 'F9') { e.preventDefault(); const Gm = G(); if (!Gm || Gm.mode !== 'play') return; const s = S(); s.chaseCam = !s.chaseCam; Gm.toast('Third-person camera: ' + (s.chaseCam ? 'on' : 'off'), '#9ab8ff'); } });

  /* ---------------------------------------------------------------- hook into the post pass */
  const post0 = V.post;
  V.post = function (g) {
    post0.apply(this, arguments); const Gm = G(); if (Gm.mode !== 'play' || !Gm.world) return;
    safe(() => { shafts(g, performance.now() / 1000); bloom(g); zoom(g); });
  };

  /* ---------------------------------------------------------------- settings rows */
  const SC = AH.UI && AH.UI.screens;
  if (SC && SC.settings) {
    const r0 = SC.settings.rows;
    SC.settings.rows = function () { const a = r0.apply(this, arguments), s = S(), at = Math.max(0, a.length - 1); a.splice(at, 0, { k: 'chaseCam', label: 'Third-person camera (F9)', v: s.chaseCam, type: 'tog' }, { k: 'bloom', label: 'Bloom', v: s.bloom, type: 'tog' }, { k: 'shafts', label: 'Light shafts', v: s.shafts, type: 'tog' }); return a; };
    const d0 = SC.settings.draw;
    SC.settings.draw = function () { return d0.apply(this, arguments); };
  }
})();

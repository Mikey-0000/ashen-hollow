/* Ashen Hollow - pooled particle system. Normal particles are lit by the scene; additive ones
   (embers, sparks, magic) are drawn after lighting so they glow regardless of ambient darkness. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U;
  const P = (AH.Particles = { list: [], density: 1 });
  const MAX = 1800;

  P.emit = function (o) {
    if (P.list.length >= MAX) return null;
    const p = { x: o.x, y: o.y, z: o.z || 0, vx: o.vx || 0, vy: o.vy || 0, vz: o.vz || 0, ax: o.ax || 0, ay: o.ay || 0, g: o.g || 0, drag: o.drag || 0,
      life: o.life || 1, max: o.life || 1, size: o.size || 1, size2: o.size2 === undefined ? o.size || 1 : o.size2, c: o.c || '#fff', c2: o.c2 || null,
      add: !!o.add, wob: o.wob || 0, ph: Math.random() * 6.28, bounce: o.bounce || 0, ground: o.ground || 0, fade: o.fade === undefined ? 1 : o.fade, ring: !!o.ring, sy: o.sy || 1 };
    P.list.push(p); return p;
  };
  const n = (v) => Math.max(1, Math.round(v * P.density));
  P.burst = function (x, y, count, o) {
    o = o || {};
    count = n(count);
    for (let i = 0; i < count; i++) {
      const a = o.dir !== undefined ? o.dir + (Math.random() - 0.5) * (o.spread === undefined ? 1 : o.spread) : Math.random() * Math.PI * 2;
      const s = U.rr(o.min || 20, o.max || 60);
      P.emit({ x: x + U.rr(-(o.jit || 0), o.jit || 0), y: y + U.rr(-(o.jit || 0), o.jit || 0), z: o.z || 0, vx: Math.cos(a) * s, vy: Math.sin(a) * s * (o.flat || 1), vz: o.vz ? U.rr(o.vz[0], o.vz[1]) : 0, g: o.g || 0, drag: o.drag === undefined ? 2 : o.drag,
        life: U.rr(o.life ? o.life[0] : 0.3, o.life ? o.life[1] : 0.7), size: o.size || 1, size2: o.size2, c: Array.isArray(o.c) ? U.pick(o.c) : o.c || '#fff', c2: o.c2, add: o.add, ground: o.ground, bounce: o.bounce });
    }
  };
  /* themed presets */
  P.blood = (x, y, dir, big) => { P.burst(x, y, big ? 14 : 7, { dir, spread: 1.1, min: 30, max: big ? 110 : 80, vz: [20, 70], g: 260, life: [0.3, 0.7], size: 1, c: ['#7a1420', '#a02030', '#5a0e18'], ground: 1, drag: 1 }); };
  P.bones = (x, y, n2) => P.burst(x, y, n2 || 6, { min: 30, max: 90, vz: [40, 90], g: 300, life: [0.4, 0.8], size: 2, size2: 1, c: ['#d8cdb4', '#b6ab92', '#8f866f'], ground: 1, bounce: 0.4 });
  P.dust = (x, y, k) => P.burst(x, y, k || 4, { min: 5, max: 20, vz: [5, 20], g: -5, life: [0.3, 0.6], size: 2, size2: 0, c: ['#6a5e50', '#58503f'], drag: 3 });
  P.sparks = (x, y, k, col) => P.burst(x, y, k || 8, { min: 40, max: 140, vz: [10, 60], g: 220, life: [0.15, 0.4], size: 1, c: col || ['#ffd070', '#fff0b0', '#ff9a3a'], add: true, drag: 1.5 });
  P.magic = (x, y, k, cols, o) => P.burst(x, y, k || 10, Object.assign({ min: 10, max: 70, vz: [-10, 30], g: -20, life: [0.3, 0.8], size: 2, size2: 0, c: cols, add: true, drag: 2 }, o || {}));
  P.smoke = (x, y, k, col) => P.burst(x, y, k || 3, { min: 2, max: 10, vz: [8, 20], g: -6, life: [0.8, 1.6], size: 2, size2: 5, c: col || '#3a3a44', drag: 1 });
  P.ringBurst = (x, y, r, col, life) => P.emit({ x, y, ring: true, size: 2, size2: r, life: life || 0.35, c: col, add: true, sy: 0.6 });
  P.embers = (x, y, k) => P.burst(x, y, k || 1, { min: 2, max: 10, dir: -Math.PI / 2, spread: 1.2, vz: [18, 40], g: -8, life: [0.6, 1.4], size: 1, c: ['#ffb050', '#ff7a30', '#ffd890'], add: true, drag: 0.5, jit: 3 });

  P.update = function (dt) {
    const L = P.list;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i];
      p.life -= dt; if (p.life <= 0) { L[i] = L[L.length - 1]; L.pop(); continue; }
      p.vx += p.ax * dt; p.vy += p.ay * dt; p.vz -= p.g * dt;
      if (p.drag) { const d = Math.max(0, 1 - p.drag * dt); p.vx *= d; p.vy *= d; }
      if (p.wob) { p.x += Math.sin(p.ph + p.life * 3) * p.wob * dt; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.ground && p.z < 0) { p.z = 0; if (p.bounce && Math.abs(p.vz) > 20) p.vz = -p.vz * p.bounce; else { p.vz = 0; p.vx *= 0.8; p.vy *= 0.8; } }
    }
  };
  P.draw = function (g, cam, additive) {
    const L = P.list, pa = g.globalAlpha;
    if (additive) g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < L.length; i++) {
      const p = L[i]; if (p.add !== additive) continue;
      const k = 1 - p.life / p.max, sx = Math.round(p.x - cam.x), sy = Math.round(p.y - p.z - cam.y);
      if (sx < -40 || sy < -40 || sx > AH.W + 40 || sy > AH.H + 40) continue;
      const s = U.lerp(p.size, p.size2, k);
      g.globalAlpha = pa * (p.fade ? Math.min(1, (1 - k) * 2.2) : 1);
      g.fillStyle = p.c2 && k > 0.5 ? p.c2 : p.c;
      if (p.ring) { g.strokeStyle = p.c; g.lineWidth = 1; g.beginPath(); g.ellipse(sx, sy, s, s * p.sy, 0, 0, 6.283); g.stroke(); continue; }
      const sz = Math.max(1, Math.round(s)); g.fillRect(sx - (sz >> 1), sy - (sz >> 1), sz, sz);
    }
    g.globalAlpha = pa; if (additive) g.globalCompositeOperation = 'source-over';
  };
  P.clear = () => (P.list.length = 0);
})();

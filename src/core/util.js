/* Ashen Hollow - core utilities. All modules attach to the global AH namespace
   (classic scripts, so the game runs straight from file:// with no server). */
(function () {
  'use strict';
  const AH = (window.AH = window.AH || {});
  AH.W = 480; AH.H = 270; AH.T = 16;
  AH.VERSION = '0.1.0';
  const U = (AH.U = {});

  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  U.ang = (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax);
  U.rr = (a, b) => a + Math.random() * (b - a);
  U.ri = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  U.pick = (a) => a[Math.floor(Math.random() * a.length)];
  U.chance = (p) => Math.random() < p;
  U.approach = (v, t, s) => (v < t ? Math.min(v + s, t) : Math.max(v - s, t));
  U.smooth = (t) => t * t * (3 - 2 * t);
  U.sign = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
  U.wrapAng = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
  U.angDiff = (a, b) => U.wrapAng(b - a);
  U.ease = {
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inQuad: (t) => t * t,
    inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    outBack: (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  };
  U.pad2 = (n) => (n < 10 ? '0' : '') + n;
  U.timeStr = (h) => { const hh = Math.floor(h) % 24; const mm = Math.floor((h % 1) * 60 / 5) * 5; return U.pad2(hh) + ':' + U.pad2(mm); };
  /* 0 down, 1 up, 2 left, 3 right */
  U.dir4 = (dx, dy) => (Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : dy < 0 ? 1 : 0);
  U.dir4FromAngle = (a) => U.dir4(Math.cos(a), Math.sin(a));
  U.angOfDir4 = (d) => [Math.PI / 2, -Math.PI / 2, Math.PI, 0][d];

  /* seeded random */
  U.mulberry32 = (seed) => {
    let a = seed >>> 0;
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  U.hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + (s || 0) * 982451653) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  U.noise = (x, y, s) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const a = U.hash(xi, yi, s), b = U.hash(xi + 1, yi, s), c = U.hash(xi, yi + 1, s), d = U.hash(xi + 1, yi + 1, s);
    const u = U.smooth(xf), v = U.smooth(yf);
    return U.lerp(U.lerp(a, b, u), U.lerp(c, d, u), v);
  };
  U.fbm = (x, y, s, o) => { let v = 0, amp = 0.5, f = 1; for (let i = 0; i < (o || 3); i++) { v += U.noise(x * f, y * f, (s || 0) + i * 17) * amp; amp /= 2; f *= 2; } return v; };

  /* colour helpers */
  const hexCache = {};
  U.hex = (h) => {
    let c = hexCache[h]; if (c) return c;
    let s = h.replace('#', ''); if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    c = hexCache[h] = [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
    return c;
  };
  U.rgb = (r, g, b) => '#' + [r, g, b].map((v) => U.pad16(Math.round(U.clamp(v, 0, 255)))).join('');
  U.pad16 = (n) => (n < 16 ? '0' : '') + n.toString(16);
  U.mix = (a, b, t) => { const A = U.hex(a), B = U.hex(b); return U.rgb(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };
  U.shade = (h, f) => (f < 0 ? U.mix(h, '#000000', -f) : U.mix(h, '#ffffff', f));
  U.rgba = (h, a) => { const c = U.hex(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; };

  U.clone = (o) => JSON.parse(JSON.stringify(o));
  U.ptInRect = (x, y, r) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;

  U.makeCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return c; };

  /* Shared palette so every system draws from one muted, gothic range */
  AH.C = {
    ink: '#0b0910', night: '#12131f', bone: '#d8cdb4', boneD: '#a89c82', boneDD: '#6c6354',
    parch: '#c9b48a', parchD: '#a38d63', parchDD: '#6e5c3e', iron: '#2a2830', ironL: '#4a4754', ironLL: '#767382',
    gold: '#c79a3a', goldL: '#e8c670', goldD: '#7d5a1c', blood: '#8a1f2b', bloodL: '#c23a45', ember: '#e8863a', emberL: '#ffc46a',
    moss: '#4a5a3a', mossD: '#2c3826', verd: '#7fae7a', astral: '#7fa6ff', astralL: '#c6d8ff', necro: '#7fe0c0', witch: '#c27be0', druid: '#8fd06a',
  };

  /* Event-style debug flag toggled by ?debug in URL */
  AH.DEBUG = /[?&]debug/.test(location.search);
})();

/* Ashen Hollow - procedural prop sprites: trees, gravestones, braziers, shrines, crypt furniture.
   Anchors are at the base of each object so y-sorting and collision line up with the feet. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, S = AH.Sprites;
  const Pr = (AH.Props = { spr: {} });
  const spr = Pr.spr;
  const finish = (P, ax, ay, ol) => S.outline(S.fromCanvas(P.c, ax, ay), ol);
  const rnd = (s) => U.mulberry32(s);

  function drawFlame(P, cx, by, sz, ph) {
    const h = Math.round(sz * (1 + 0.2 * Math.sin(ph * 6.283))), sway = Math.sin(ph * 6.283 + 1) * sz * 0.14;
    for (let i = 0; i < h; i++) {
      const t = i / h, w = Math.max(0.6, sz * 0.46 * (1 - Math.pow(t, 1.6))), x0 = cx + sway * t;
      for (let x = -Math.ceil(w); x <= Math.ceil(w); x++) { const d = Math.abs(x) / w; if (d > 1) continue; P.px(Math.round(x0 + x), by - i, d < 0.35 && t < 0.65 ? '#fff6d0' : d < 0.7 && t < 0.85 ? '#ffc45a' : '#e8702a'); }
    }
  }
  Pr.drawFlame = drawFlame;

  /* ---------------------------------------------------------- trees */
  function tree(kind, seed) {
    const W = 64, H = 84, P = S.painter(W, H), r = rnd(seed * 31 + 5);
    const barkP = kind === 'dead' ? ['#7a705e', '#554c40', '#322c25'] : kind === 'thorn' ? ['#5a4a58', '#3a2e3c', '#201822'] : ['#6a5240', '#463428', '#281c14'];
    const cx = 32, base = 80;
    let top = kind === 'dead' ? 34 : 40;
    /* trunk */
    let x = cx;
    for (let y = base; y > top; y--) {
      const t = (base - y) / (base - top), w = Math.round(U.lerp(kind === 'dead' ? 8 : 10, 5, t) + (t < 0.12 ? 2 : 0)); x += Math.sin(y * 0.18 + seed) * 0.35;
      for (let k = -w; k <= w; k++) { const lit = k < -w * 0.35 ? barkP[0] : k > w * 0.35 ? barkP[2] : barkP[1]; P.px(Math.round(x + k), y, U.hash(k, y, seed) > 0.88 ? barkP[2] : lit); }
    }
    P.limb(cx - 7, base, cx - 14, base + 3, 4, 2, barkP[1]); P.limb(cx + 7, base, cx + 14, base + 2, 4, 2, barkP[2]); P.limb(cx, base + 1, cx + 2, base + 4, 5, 2, barkP[2]);
    for (let i = 0; i < 3; i++) P.line(cx - 3 + i * 3, base - 4 - i * 6, cx - 3 + i * 3, base - 12 - i * 6, barkP[2]);
    if (kind === 'dead') {
      const branch = (x0, y0, a, len, th, depth) => {
        const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len;
        P.limb(x0, y0, x1, y1, th, Math.max(1, th - 1.5), barkP[depth % 2 ? 2 : 1]); P.px(Math.round(x0 - 1), Math.round(y0), barkP[0]);
        if (depth < 4) { const n = r() < 0.7 ? 2 : 1; for (let i = 0; i < n; i++) branch(x1, y1, a + (i ? 0.7 : -0.6) + (r() - 0.5) * 0.5, len * 0.72, Math.max(1, th - 1), depth + 1); }
      };
      branch(cx, top + 2, -Math.PI / 2 - 0.9, 20, 4, 0); branch(cx, top + 4, -Math.PI / 2 + 0.8, 19, 4, 0); branch(cx - 1, top - 2, -Math.PI / 2 - 0.1, 16, 3, 1);
      for (let i = 0; i < 6; i++) P.px(Math.floor(r() * 50) + 6, Math.floor(r() * 30) + 4, '#6a5a3a');
    } else if (kind === 'pine') {
      const cols = [['#35553a', '#263f2c', '#162a1d']];
      for (let i = 0; i < 6; i++) { const y = 70 - i * 10, w = 24 - i * 3.6; for (let yy = 0; yy < 14; yy++) { const ww = w * (yy / 14) + 2; for (let xx = -ww; xx <= ww; xx++) { const lit = xx < -ww * 0.3 ? 0 : xx > ww * 0.4 ? 2 : 1; P.px(Math.round(cx + xx), y - 12 + yy, U.hash(xx, yy + i, seed) > 0.9 ? cols[0][2] : cols[0][lit]); } } }
    } else {
      const cols = kind === 'thorn' ? ['#4a6a48', '#2f4630', '#182818'] : kind === 'autumn' ? ['#9a7a3a', '#6a5028', '#3a2a14'] : ['#52703e', '#385030', '#1f301d'];
      const discs = [];
      for (let i = 0; i < 12; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()); discs.push([cx + Math.cos(a) * d * 22, 28 + Math.sin(a) * d * 13, 8 + r() * 5]); }
      discs.sort((a, b) => a[1] - b[1]);
      discs.forEach((d, i) => P.blob(Math.round(d[0]), Math.round(d[1]), Math.round(d[2]), cols, seed * 10 + i, 3.5));
      for (let i = 0; i < 26; i++) { const px = cx + (r() - 0.5) * 44, py = 22 + r() * 24; P.px(Math.round(px), Math.round(py), cols[0]); P.px(Math.round(px) + 1, Math.round(py), cols[0]); }
      if (kind === 'thorn') for (let i = 0; i < 9; i++) { const px = cx + (r() - 0.5) * 40, py = 22 + r() * 24; P.px(Math.round(px), Math.round(py), '#a8506a'); }
      P.line(cx - 14, 44, cx - 6, 52, barkP[1], 2); P.line(cx + 14, 44, cx + 6, 52, barkP[2], 2);
    }
    return finish(P, cx, base + 2, '#0a0c0a');
  }
  [['oak', 1], ['oak', 2], ['oak', 3], ['dead', 4], ['dead', 5], ['dead', 6], ['thorn', 7], ['thorn', 8], ['pine', 9], ['autumn', 10]].forEach((a) => { (spr['tree_' + a[0]] = spr['tree_' + a[0]] || []).push(tree(a[0], a[1])); });

  /* ---------------------------------------------------------- vegetation */
  function bush(seed, col) {
    const P = S.painter(22, 16), cols = col || ['#4c6a3c', '#324a2c', '#1d2e1c'];
    P.blob(7, 9, 6, cols, seed, 3); P.blob(14, 8, 6, cols, seed + 1, 3); P.blob(11, 6, 5, cols, seed + 2, 3);
    P.speckle(3, 3, 16, 10, [cols[0], '#7a9a56'], 8, seed);
    return finish(P, 11, 14, '#0a0c0a');
  }
  spr.bush = [bush(1), bush(2), bush(3, ['#3e5a3a', '#2a4030', '#182818'])];
  spr.deadbush = [1, 2].map((s) => { const P = S.painter(20, 16), r = rnd(s * 7); for (let i = 0; i < 6; i++) P.limb(10, 15, 10 + (r() - 0.5) * 18, 15 - 6 - r() * 8, 2, 1, ['#5a503f', '#3a3228', '#2a2420'][i % 3]); return finish(P, 10, 15, '#0a0806'); });
  spr.tuft = [1, 2, 3].map((s) => { const P = S.painter(12, 12), r = rnd(s * 3); for (let i = 0; i < 7; i++) { const x = 1 + Math.floor(r() * 10), h = 4 + Math.floor(r() * 6); P.line(x, 11, x + (r() < 0.5 ? -1 : 1), 11 - h, i % 2 ? '#4c6a3c' : '#3a5230'); } return S.fromCanvas(P.c, 6, 11); });
  spr.fern = [1, 2].map((s) => { const P = S.painter(18, 14), r = rnd(s * 9); for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.42; P.limb(9, 13, 9 + Math.cos(a) * 10, 13 + Math.sin(a) * 11, 2, 1, i % 2 ? '#3e6a42' : '#2c5030'); } return finish(P, 9, 13, '#0a100a'); });
  spr.herb = (function () { const P = S.painter(14, 16); [[3, 8], [7, 5], [10, 9]].forEach((p, i) => { P.line(p[0], 15, p[0], p[1], '#3a5a34'); P.disc(p[0], p[1] - 1, 1, '#a070d0'); P.px(p[0], p[1] - 3, '#c8a0f0'); P.px(p[0] - 1, p[1], '#6a4a90'); }); P.line(7, 15, 4, 11, '#3a5a34'); P.line(7, 15, 11, 12, '#3a5a34'); return finish(P, 7, 15, '#0a0c0a'); })();
  spr.shroom = S.frames(3, (i) => { const P = S.painter(14, 12); [[4, 8, 3], [9, 9, 2], [7, 6, 2]].forEach((m) => { P.rect(m[0], m[1], 1, 12 - m[1] - 1, '#b8c8b0'); P.ell(m[0], m[1], m[2], 2, i % 2 ? '#5ad0c0' : '#48b8b0'); P.px(m[0] - 1, m[1] - 1, '#e8fff8'); }); return finish(P, 7, 11, '#0a2a2a'); });
  spr.thicket = (function () { const P = S.painter(40, 34), r = rnd(77); for (let i = 0; i < 26; i++) { const x0 = 4 + r() * 32, a = -Math.PI / 2 + (r() - 0.5) * 2.4; P.limb(x0, 32, x0 + Math.cos(a) * 18, 32 + Math.sin(a) * 26, 3, 1, ['#3a2a34', '#2a1e28', '#4a3446'][i % 3]); } for (let i = 0; i < 40; i++) { const x = 3 + r() * 34, y = 4 + r() * 26; P.px(Math.round(x), Math.round(y), '#a8506a'); P.px(Math.round(x) + 1, Math.round(y) - 1, '#d8a0b0'); } for (let i = 0; i < 24; i++) P.px(3 + Math.floor(r() * 34), 4 + Math.floor(r() * 26), '#4a6a48'); return finish(P, 20, 33, '#0c0610'); })();

  /* ---------------------------------------------------------- graves & statuary */
  function grave(kind, seed) {
    const P = S.painter(20, 26), r = rnd(seed), c = ['#8a8a94', '#64646e', '#3e3e48'];
    if (kind === 'cross') { P.rect(8, 6, 4, 19, c[1]); P.rect(3, 10, 14, 4, c[1]); P.rect(8, 6, 1, 19, c[0]); P.rect(3, 10, 14, 1, c[0]); P.rect(11, 6, 1, 19, c[2]); P.rect(3, 13, 14, 1, c[2]); }
    else if (kind === 'slab') { P.rect(3, 12, 14, 13, c[1]); P.ell(10, 12, 7, 6, c, seed, 0.1); P.rect(3, 14, 14, 11, c[1]); P.rect(3, 14, 2, 11, c[0]); P.rect(15, 14, 2, 11, c[2]); P.rect(9, 12, 2, 7, c[2]); P.rect(7, 14, 6, 2, c[2]); }
    else { P.rect(4, 11, 12, 14, c[1]); P.ell(10, 11, 6, 6, c, seed, 0.1); P.rect(4, 11, 2, 14, c[0]); P.rect(14, 11, 2, 14, c[2]); P.line(8, 14, 12, 14, c[2]); P.line(7, 17, 13, 17, c[2]); P.line(8, 20, 12, 20, c[2]); }
    P.rect(2, 24, 16, 2, '#2a2a32'); P.rect(3, 23, 14, 1, c[2]);
    for (let i = 0; i < 7; i++) P.px(3 + Math.floor(r() * 14), 10 + Math.floor(r() * 14), i % 2 ? '#3e5a34' : '#58783f');
    return finish(P, 10, 25, '#0a0a0e');
  }
  spr.grave = [grave('round', 1), grave('slab', 2), grave('cross', 3), grave('round', 4)];
  spr.angel = (function () {
    const P = S.painter(30, 46), c = ['#a8a8b2', '#7a7a86', '#4a4a56'];
    P.rect(6, 38, 18, 8, c[1]); P.rect(6, 38, 18, 1, c[0]); P.rect(6, 45, 18, 1, c[2]);
    P.ell(15, 30, 5, 9, c, 3, 0.1); P.limb(11, 22, 6, 32, 5, 3, c); P.limb(19, 22, 24, 32, 5, 3, c);
    P.ell(15, 17, 4, 4.4, c, 4, 0.1); P.limb(12, 14, 9, 10, 3, 2, c);
    P.limb(10, 24, 2, 10, 4, 2, c); P.limb(9, 20, 3, 6, 3, 2, c); P.limb(20, 24, 28, 10, 4, 2, c); P.limb(21, 20, 27, 6, 3, 2, c);
    P.px(13, 17, '#2a2a32'); P.px(17, 17, '#2a2a32'); P.line(13, 19, 13, 25, '#5a7a8a'); P.line(17, 19, 17, 25, '#5a7a8a');
    P.speckle(5, 10, 20, 34, ['#3e5a34', '#58783f'], 14, 8);
    return finish(P, 15, 45, '#0a0a0e');
  })();
  spr.pillar = (function () {
    const P = S.painter(22, 56), c = ['#6a6878', '#4a4858', '#2e2c3a'];
    P.rect(3, 50, 16, 6, c[1]); P.rect(3, 50, 16, 1, c[0]); P.rect(5, 47, 12, 3, c[0]);
    P.rect(6, 8, 10, 40, c[1]); P.rect(6, 8, 3, 40, c[0]); P.rect(13, 8, 3, 40, c[2]); for (let y = 10; y < 46; y += 4) P.px(10, y, c[2]);
    P.rect(3, 2, 16, 6, c[0]); P.rect(3, 2, 16, 1, '#8a889a'); P.rect(2, 6, 18, 2, c[1]); P.rect(5, 0, 12, 2, c[1]);
    P.speckle(3, 2, 16, 52, ['#3e5a34', '#2e2c3a'], 14, 12);
    return finish(P, 11, 55, '#08080c');
  })();
  spr.well = (function () {
    const P = S.painter(34, 38), c = ['#7a7886', '#55536a', '#33313f'];
    P.ell(17, 28, 14, 8, c, 5, 0.1); P.ell(17, 25, 11, 5, ['#14202a', '#0c141a', '#060a0e'], 6, 0); P.px(14, 24, '#4a7a88'); P.px(19, 26, '#4a7a88');
    P.rect(5, 5, 3, 26, '#4a3526'); P.rect(26, 5, 3, 26, '#4a3526'); P.rect(5, 5, 1, 26, '#6c523c'); P.rect(5, 3, 24, 4, '#5a4230'); P.rect(5, 3, 24, 1, '#7a5c42'); P.line(17, 7, 17, 20, '#8a7a5a'); P.rect(15, 20, 4, 3, '#3a2a1e');
    P.line(3, 30, 14, 36, c[2]); P.speckle(3, 22, 28, 14, ['#3e5a34'], 12, 3);
    return finish(P, 17, 36, '#08080a');
  })();
  spr.barrel = (function () { const P = S.painter(16, 20), w = ['#6a4c32', '#4a3524', '#2c1f15']; P.ell(8, 11, 6, 8, w, 3, 0.05); P.rect(2, 6, 12, 1, '#2a2830'); P.rect(2, 15, 12, 1, '#2a2830'); P.rect(2, 10, 12, 1, '#3a3840'); P.ell(8, 4, 5, 2, ['#7a5c40', '#5a4430', '#3a2a1c'], 4, 0); return finish(P, 8, 19, '#0a0806'); })();
  spr.crate = (function () { const P = S.painter(18, 18); P.rect(1, 3, 16, 14, '#5a4230'); P.rect(1, 3, 16, 2, '#7a5c42'); P.rect(1, 15, 16, 2, '#3a281c'); P.rect(1, 3, 2, 14, '#6c523c'); P.rect(15, 3, 2, 14, '#3a281c'); P.line(2, 4, 15, 16, '#3a281c'); P.line(15, 4, 2, 16, '#4a3526'); return finish(P, 9, 17, '#0a0806'); })();
  spr.sign = (function () { const P = S.painter(18, 26); P.rect(8, 8, 3, 17, '#4a3526'); P.rect(8, 8, 1, 17, '#6c523c'); P.rect(1, 3, 16, 8, '#5a4230'); P.rect(1, 3, 16, 1, '#7a5c42'); P.rect(1, 10, 16, 1, '#3a281c'); P.line(4, 6, 13, 6, '#2a1c12'); P.line(4, 8, 10, 8, '#2a1c12'); return finish(P, 9, 25, '#0a0806'); })();
  spr.cart = (function () { const P = S.painter(40, 28); P.rect(4, 8, 30, 10, '#4a3526'); P.rect(4, 8, 30, 2, '#6c523c'); P.rect(4, 16, 30, 2, '#2c1f15'); for (let x = 6; x < 34; x += 5) P.rect(x, 8, 1, 10, '#2c1f15'); P.ell(10, 22, 6, 6, ['#5a4230', '#3a281c', '#241810'], 4, 0); P.ell(10, 22, 2, 2, ['#8a7a5a', '#5a4a30', '#2a1c10'], 5, 0); P.limb(34, 12, 40, 18, 2, 2, '#4a3526'); P.line(20, 3, 28, 8, '#3a281c'); return finish(P, 20, 26, '#0a0806'); })();
  spr.bell = (function () { const P = S.painter(24, 32), b = ['#c89a52', '#8e6a32', '#53391b']; P.rect(2, 2, 20, 3, '#3a2a1e'); P.rect(11, 5, 2, 4, '#5a5a62'); for (let y = 9; y < 27; y++) { const w = 4 + (y - 9) * 0.55; for (let x = -w; x <= w; x++) P.px(Math.round(12 + x), y, x < -w * 0.3 ? b[0] : x > w * 0.4 ? b[2] : b[1]); } P.rect(2, 26, 20, 2, '#e0b868'); P.px(12, 29, '#2a1a0a'); P.rect(11, 28, 3, 3, b[1]); return finish(P, 12, 31, '#0a0806'); })();

  /* ---------------------------------------------------------- fire & light sources */
  spr.brazier = S.frames(6, (i) => { const P = S.painter(22, 32), m = ['#6a6874', '#44424e', '#2a2830']; P.rect(9, 18, 4, 11, m[1]); P.rect(9, 18, 1, 11, m[0]); P.rect(6, 28, 10, 3, m[1]); P.rect(6, 28, 10, 1, m[0]); P.ell(11, 17, 8, 3, m, 4, 0); P.ell(11, 16, 6, 2, ['#2a1408', '#1a0c04', '#100802'], 5, 0); drawFlame(P, 11, 16, 11, i / 6); P.px(8, 15, '#ffd070'); return finish(P, 11, 30, '#0a0806'); });
  spr.torch = S.frames(6, (i) => { const P = S.painter(14, 26); P.rect(6, 14, 3, 11, '#4a3526'); P.rect(6, 14, 1, 11, '#6c523c'); P.rect(4, 13, 7, 3, '#44424e'); P.rect(4, 13, 7, 1, '#6a6874'); drawFlame(P, 7, 13, 9, i / 6); return finish(P, 7, 24, '#0a0806'); });
  spr.candle = S.frames(5, (i) => { const P = S.painter(12, 16); P.rect(4, 8, 3, 6, '#d8ccb0'); P.rect(4, 8, 1, 6, '#f0e6cc'); P.rect(6, 8, 1, 6, '#a89c82'); P.rect(3, 14, 5, 1, '#6a6874'); P.px(5, 8, '#2a2018'); drawFlame(P, 5, 7, 4, i / 5 + 0.13); return finish(P, 6, 15, '#0a0806'); });
  spr.candles = S.frames(5, (i) => { const P = S.painter(26, 18), r = rnd(5); [[4, 13, 5], [10, 15, 7], [17, 12, 4], [21, 15, 6], [13, 11, 5]].forEach((c, k) => { P.rect(c[0], c[1] - c[2], 3, c[2], '#cfc4a8'); P.rect(c[0], c[1] - c[2], 1, c[2], '#eee2c6'); P.px(c[0] + 1, c[1] - c[2] - 1, '#2a2018'); drawFlame(P, c[0] + 1, c[1] - c[2] - 1, 3, i / 5 + k * 0.19); P.px(c[0] + 3, c[1], '#a89c82'); }); P.rect(2, 15, 22, 2, 'rgba(180,170,150,0.35)'); return finish(P, 13, 17, '#0a0806'); });
  spr.candelabra = S.frames(6, (i) => { const P = S.painter(26, 44), m = ['#c79a3a', '#8a6a22', '#4e3a12']; P.rect(11, 20, 4, 20, m[1]); P.rect(11, 20, 1, 20, m[0]); P.rect(7, 40, 12, 3, m[1]); P.rect(7, 40, 12, 1, m[0]); P.ell(13, 36, 3, 2, m, 3, 0); [[3, 14], [13, 9], [23, 14]].forEach((c, k) => { P.limb(13, 22, c[0], c[1] + 4, 2, 2, m[1]); P.rect(c[0] - 1, c[1] + 2, 3, 2, m[1]); P.rect(c[0], c[1] - 1, 1, 3, '#e8dcc0'); drawFlame(P, c[0], c[1] - 2, 4, i / 6 + k * 0.3); }); return finish(P, 13, 43, '#0a0806'); });
  spr.chandelier = S.frames(6, (i) => { const P = S.painter(64, 52), m = ['#8a6a22', '#5e4616', '#3a2a0c']; P.line(32, 0, 32, 12, '#3a3a44'); P.ell(32, 18, 24, 5, [m[0], m[1], m[2]], 4, 0); P.ell(32, 17, 18, 3, ['#2a1c08', '#1a1004', '#100a02'], 4, 0); P.line(32, 12, 10, 18, m[1]); P.line(32, 12, 54, 18, m[1]); for (let k = 0; k < 7; k++) { const x = 10 + k * 7.3, y = 16 + Math.sin(k / 6 * Math.PI) * 4; P.rect(Math.round(x), Math.round(y) - 5, 2, 5, '#e8dcc0'); drawFlame(P, Math.round(x) + 1, Math.round(y) - 6, 3, i / 6 + k * 0.23); } P.line(32, 23, 32, 36, m[1]); P.disc(32, 38, 2, m[0]); return finish(P, 32, 51, '#0a0806'); });
  spr.cauldron = S.frames(6, (i) => { const P = S.painter(34, 34), m = ['#5e5e68', '#3a3a44', '#202028']; P.limb(7, 26, 4, 32, 3, 2, m[2]); P.limb(25, 26, 28, 32, 3, 2, m[2]); P.ell(16, 20, 12, 10, m, 3, 0.08); P.ell(16, 12, 11, 4, [m[0], m[1], m[2]], 4, 0); P.ell(16, 12, 9, 3, ['#7affc0', '#3aa878', '#1e6a4a'], 5, 0); for (let b = 0; b < 4; b++) { const t = (i / 6 + b * 0.27) % 1; P.px(Math.round(10 + b * 4), Math.round(13 - t * 3), '#c8ffe0'); } P.rect(5, 12, 22, 1, m[0]); P.rect(3, 15, 3, 2, m[1]); P.rect(26, 15, 3, 2, m[1]); P.speckle(6, 16, 20, 12, ['#4e4e58', '#2a2a32'], 14, 5); P.px(10, 10, '#c8ffe0'); return finish(P, 16, 32, '#08080a'); });
  spr.campfire = S.frames(6, (i) => { const P = S.painter(28, 28); for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.28; P.disc(14 + Math.cos(a) * 8, 22 + Math.sin(a) * 3, 2, k % 2 ? '#5a5a62' : '#3a3a44'); } P.limb(8, 24, 18, 20, 3, 3, '#4a3526'); P.limb(20, 24, 9, 21, 3, 3, '#3a281c'); drawFlame(P, 14, 21, 12, i / 6); return finish(P, 14, 26, '#0a0806'); });
  spr.waystone = S.frames(6, (i) => {
    const P = S.painter(36, 56), c = ['#7a7a92', '#4e4e66', '#2c2c40'];
    P.rect(8, 50, 20, 6, c[1]); P.rect(8, 50, 20, 1, c[0]); P.rect(11, 8, 14, 42, c[1]); for (let y = 10; y < 50; y++) { P.px(11, y, c[0]); P.px(12, y, c[0]); P.px(23, y, c[2]); P.px(24, y, c[2]); }
    for (let y = 0; y < 10; y++) { const w = 7 - y * 0.7; for (let x = -w; x <= w; x++) P.px(Math.round(18 + x), 8 - y + 2, x < 0 ? c[0] : c[2]); }
    const g = ['#a8c8ff', '#7a9ae8', '#5a78c8'], glow = i % 6 < 3 ? g[0] : g[1];
    P.line(18, 14, 18, 44, glow); P.line(14, 22, 18, 18, glow); P.line(22, 22, 18, 18, glow); P.line(14, 32, 22, 32, glow); P.line(14, 40, 18, 36, glow); P.line(22, 40, 18, 36, glow); P.px(18, 14, '#fff'); P.px(18, 30, '#fff');
    P.speckle(8, 10, 20, 44, ['#3e5a34', '#2c2c40'], 14, 6);
    return finish(P, 18, 54, '#0a0a14');
  });
  spr.standing = (function () { const P = S.painter(26, 52), c = ['#7a7a84', '#52525c', '#30303a']; for (let y = 6; y < 50; y++) { const w = 7 - Math.abs(y - 28) * 0.05 + Math.sin(y * 0.4) * 0.8; for (let x = -w; x <= w; x++) P.px(Math.round(13 + x), y, x < -w * 0.3 ? c[0] : x > w * 0.4 ? c[2] : U.hash(x, y, 9) > 0.85 ? c[2] : c[1]); } for (let i = 0; i < 6; i++) P.px(11 + i, 6 - (i % 3 === 1 ? 1 : 0), c[1]); P.rect(5, 49, 16, 2, c[2]); P.line(13, 16, 13, 34, '#6a7a9a'); P.line(10, 22, 16, 22, '#6a7a9a'); P.line(10, 28, 16, 26, '#6a7a9a'); P.speckle(5, 8, 16, 40, ['#3e5a34', '#58783f'], 12, 4); return finish(P, 13, 50, '#08080c'); })();
  spr.standingGlow = (function () { const P = S.painter(26, 52); P.line(13, 16, 13, 34, '#a8c8ff'); P.line(10, 22, 16, 22, '#a8c8ff'); P.line(10, 28, 16, 26, '#a8c8ff'); return S.fromCanvas(P.c, 13, 50); })();

  /* ---------------------------------------------------------- interiors / catacombs */
  spr.altar = (function () { const P = S.painter(44, 40), c = ['#7a7886', '#55536a', '#33313f']; P.rect(3, 22, 38, 17, c[1]); P.rect(3, 22, 38, 3, c[0]); P.rect(3, 36, 38, 3, c[2]); P.rect(3, 22, 3, 17, c[0]); P.rect(38, 22, 3, 17, c[2]); P.rect(0, 20, 44, 3, c[0]); P.rect(0, 22, 44, 1, c[2]); P.rect(16, 26, 12, 8, c[2]); P.line(22, 27, 22, 33, '#8a2e3c'); P.line(19, 29, 25, 29, '#8a2e3c'); P.rect(6, 17, 32, 3, '#5a2028'); P.rect(6, 17, 32, 1, '#7a3038'); return finish(P, 22, 39, '#08080c'); })();
  spr.coffin = (function () { const P = S.painter(40, 30), c = ['#6a6878', '#4a4858', '#2e2c3a']; P.rect(2, 8, 36, 20, c[1]); P.rect(2, 6, 36, 4, c[0]); P.rect(2, 24, 36, 4, c[2]); P.rect(4, 11, 32, 11, c[2]); P.rect(5, 12, 30, 9, c[1]); P.line(20, 12, 20, 20, c[0]); P.line(16, 15, 24, 15, c[0]); P.speckle(2, 6, 36, 22, ['#3e5a34', '#2e2c3a'], 10, 7); return finish(P, 20, 28, '#08080c'); })();
  spr.sarcophagusOpen = (function () { const P = S.painter(40, 30), c = ['#6a6878', '#4a4858', '#2e2c3a']; P.rect(2, 8, 36, 20, c[1]); P.rect(2, 6, 36, 4, c[0]); P.rect(2, 24, 36, 4, c[2]); P.rect(4, 11, 32, 11, '#0c0a10'); P.limb(10, 18, 20, 16, 2, 2, '#c8bea4'); P.disc(31, 16, 3, '#cfc6ae'); P.px(30, 15, '#1a1620'); P.px(32, 15, '#1a1620'); P.limb(6, 22, 28, 20, 2, 2, '#a89e84'); return finish(P, 20, 28, '#08080c'); })();
  spr.skullNiche = (function () { const P = S.painter(18, 18); P.rect(2, 2, 14, 14, '#0e0c12'); P.rect(2, 2, 14, 1, '#4a4858'); P.rect(2, 2, 1, 14, '#38364a'); P.ell(9, 9, 4, 4, ['#d8cdb4', '#a89c82', '#6c6354'], 3, 0.1); P.rect(7, 9, 2, 2, '#0e0c12'); P.rect(10, 9, 2, 2, '#0e0c12'); P.rect(8, 13, 3, 2, '#8c8268'); P.px(9, 12, '#0e0c12'); return S.outline(S.fromCanvas(P.c, 9, 17), '#08080c'); })();
  spr.skull = (function () { const P = S.painter(10, 10); P.ell(5, 4, 3, 3, ['#e0d6bc', '#b0a68c', '#7a7260'], 3, 0.1); P.rect(3, 4, 1, 2, '#1a1620'); P.rect(6, 4, 1, 2, '#1a1620'); P.rect(4, 7, 3, 2, '#9a9078'); return finish(P, 5, 9, '#08080c'); })();
  spr.bones = [1, 2, 3].map((s) => { const P = S.painter(18, 10), r = rnd(s * 5); for (let i = 0; i < 4; i++) { const x = 2 + r() * 12, y = 2 + r() * 5, a = r() * 3; P.line(x, y, x + Math.cos(a) * 5, y + Math.sin(a) * 2, i % 2 ? '#c8bea4' : '#e0d6bc'); P.px(x, y, '#f0e8d0'); } if (s === 2) { P.ell(12, 6, 3, 2, ['#e0d6bc', '#b0a68c', '#7a7260'], 3, 0.1); P.px(11, 6, '#1a1620'); P.px(13, 6, '#1a1620'); } return finish(P, 9, 9, '#08080c'); });
  spr.organ = (function () { const P = S.painter(96, 84), m = ['#c8a860', '#8a6e34', '#4a3a18']; for (let k = 0; k < 9; k++) { const h = 40 + Math.round(Math.sin(k / 8 * Math.PI) * 30), x = 8 + k * 9; for (let y = 0; y < h; y++) { P.px(x, 74 - y, m[0]); P.px(x + 1, 74 - y, m[0]); P.px(x + 2, 74 - y, m[1]); P.px(x + 3, 74 - y, m[1]); P.px(x + 4, 74 - y, m[2]); } P.rect(x + 1, 74 - h - 1, 4, 1, '#e8d08a'); P.rect(x + 1, 74 - h + 4, 3, 5, '#14100a'); } P.rect(2, 74, 92, 10, '#3a2a1e'); P.rect(2, 74, 92, 2, '#5a4230'); P.rect(2, 82, 92, 2, '#1c120a'); P.rect(30, 76, 36, 4, '#d8ccb0'); for (let x = 31; x < 66; x += 4) P.rect(x, 76, 1, 4, '#2a2018'); return finish(P, 48, 83, '#08060a'); })();
  spr.chest = [0, 1].map((o) => { const P = S.painter(24, 22), w = ['#6a4a2e', '#4a3220', '#2a1c10']; P.rect(2, 9, 20, 12, w[1]); P.rect(2, 9, 20, 1, w[0]); P.rect(2, 19, 20, 2, w[2]); P.rect(2, 9, 2, 12, w[0]); if (!o) { P.rect(2, 4, 20, 6, w[0]); P.rect(2, 4, 20, 1, '#8a6a42'); P.rect(2, 8, 20, 1, w[2]); } else { P.rect(2, 1, 20, 5, w[1]); P.rect(3, 6, 18, 3, '#0c0806'); P.rect(6, 7, 12, 1, '#e8c670'); } P.rect(0, 12, 24, 2, '#3a3840'); P.rect(10, 12, 4, 5, '#c79a3a'); P.px(11, 14, '#3a2a10'); P.rect(2, 12, 1, 2, '#6a6874'); return finish(P, 12, 21, '#0a0806'); });
  spr.book = (function () { const P = S.painter(14, 12); P.rect(2, 3, 10, 7, '#5a2028'); P.rect(2, 3, 10, 1, '#8a3038'); P.rect(2, 9, 10, 1, '#2a0a10'); P.rect(3, 4, 1, 5, '#2a0a10'); P.rect(5, 5, 5, 1, '#c79a3a'); P.rect(5, 7, 4, 1, '#c79a3a'); P.rect(11, 4, 1, 5, '#d8ccb0'); return finish(P, 7, 11, '#08060a'); })();
  spr.scroll = (function () { const P = S.painter(14, 12); P.rect(1, 4, 12, 5, '#c9b48a'); P.rect(1, 4, 12, 1, '#e0cfa4'); P.rect(1, 8, 12, 1, '#8a7650'); P.ell(2, 6, 1, 3, ['#d8c398', '#c9b48a', '#8a7650'], 3, 0); P.ell(12, 6, 1, 3, ['#d8c398', '#c9b48a', '#8a7650'], 4, 0); P.line(4, 6, 10, 6, '#5a4630'); return finish(P, 7, 10, '#08060a'); })();
  spr.tablet = (function () { const P = S.painter(22, 30), c = ['#8a8a94', '#64646e', '#3e3e48']; P.rect(3, 6, 16, 22, c[1]); P.ell(11, 6, 8, 5, c, 5, 0.1); P.rect(3, 8, 2, 20, c[0]); P.rect(17, 8, 2, 20, c[2]); P.rect(1, 27, 20, 3, c[2]); for (let i = 0; i < 6; i++) { P.line(7, 9 + i * 3, 9 + (i % 3) * 2 + 3, 9 + i * 3, '#2a2a32'); P.px(14, 9 + i * 3, '#2a2a32'); } P.speckle(3, 6, 16, 22, ['#3e5a34'], 6, 2); return finish(P, 11, 29, '#08080c'); })();
  spr.doorWood = [0, 1].map((o) => { const P = S.painter(20, 30); P.rect(1, 6, 18, 24, '#3a2a20'); P.ell(10, 8, 9, 5, ['#5a4230', '#3a2a20', '#2a1c12'], 3, 0); if (!o) { P.rect(3, 8, 14, 22, '#4a3526'); for (let x = 3; x < 17; x += 4) P.rect(x, 8, 1, 22, '#2a1c12'); P.rect(3, 14, 14, 1, '#2a2830'); P.rect(3, 24, 14, 1, '#2a2830'); P.px(14, 19, '#c79a3a'); } else { P.rect(3, 8, 14, 22, '#07060a'); P.rect(1, 6, 3, 24, '#4a3526'); } return finish(P, 10, 29, '#08060a'); });
  spr.gateIron = [0, 1].map((o) => { const P = S.painter(20, 30); P.rect(0, 4, 3, 26, '#3a3844'); P.rect(17, 4, 3, 26, '#3a3844'); P.rect(0, 2, 20, 3, '#4a4754'); if (!o) for (let x = 4; x < 17; x += 3) { P.rect(x, 5, 1, 25, '#2a2830'); P.px(x, 4, '#6a6874'); } else P.rect(3, 5, 14, 25, '#07060a'); return finish(P, 10, 29, '#08060a'); });
  spr.sealDoor = S.frames(4, (i) => { const P = S.painter(24, 34), c = ['#6a6878', '#4a4858', '#2e2c3a']; P.rect(1, 6, 22, 28, c[1]); P.ell(12, 8, 11, 7, c, 5, 0.05); P.rect(1, 8, 3, 26, c[0]); P.rect(20, 8, 3, 26, c[2]); const g = i % 2 ? '#e0404a' : '#a02a38'; P.line(12, 12, 12, 30, g); P.line(7, 18, 17, 18, g); P.disc(12, 21, 3, g); P.px(12, 21, '#ffb0b0'); P.line(8, 26, 12, 30, g); P.line(16, 26, 12, 30, g); return finish(P, 12, 33, '#08080c'); });
  spr.stairs = (function () { const P = S.painter(40, 34), c = ['#5a5868', '#3e3c4c', '#22202c']; P.rect(0, 0, 40, 34, '#050408'); P.ell(20, 12, 18, 12, c, 5, 0.05); P.rect(2, 12, 36, 22, c[1]); P.ell(20, 12, 14, 10, ['#0e0c14', '#08060c', '#04030a'], 6, 0); P.rect(6, 12, 28, 22, '#08060c'); for (let i = 0; i < 6; i++) { P.rect(8 + i, 18 + i * 3, 24 - i * 2, 2, i % 2 ? '#1c1a24' : '#2a2834'); } return finish(P, 20, 33, '#04030a'); })();
  spr.window = S.frames(4, (i) => { const P = S.painter(16, 24); P.rect(1, 6, 14, 18, '#1a1420'); P.ell(8, 8, 7, 5, ['#2a2230', '#1a1420', '#0c0810'], 3, 0); const cols = ['#e8863a', '#c23a45', '#e8c670', '#a05a9a']; for (let y = 8; y < 22; y++) for (let x = 3; x < 13; x++) { if ((x === 8) || (y % 5 === 0)) { P.px(x, y, '#120c14'); continue; } P.px(x, y, cols[(x * 3 + y) % 4 === 0 ? 3 : (x > 8) ^ (y > 14) ? 0 : 1]); } P.ell(8, 9, 4, 3, ['#e8c670', '#e8863a', '#c23a45'], 4, 0); return finish(P, 8, 23, '#08060a'); });
  spr.banner = (function () { const P = S.painter(16, 36); P.rect(1, 0, 14, 2, '#4a3526'); P.rect(2, 2, 12, 28, '#5a1c28'); for (let y = 2; y < 30; y++) P.px(2, y, '#7a2c38'); P.rect(2, 28, 12, 1, '#3a0e16'); for (let x = 2; x < 14; x++) P.px(x, 30 + (x % 4 < 2 ? 0 : 2), '#5a1c28'); P.line(8, 6, 8, 22, '#c79a3a'); P.line(5, 10, 11, 10, '#c79a3a'); P.disc(8, 16, 2, '#c79a3a'); P.speckle(2, 2, 12, 28, ['#2a0a10'], 12, 3); return finish(P, 8, 35, '#08060a'); })();
  spr.cobweb = (function () { const P = S.painter(18, 18); [[0, 0, 17, 0], [0, 0, 0, 17], [0, 0, 16, 16], [0, 0, 12, 17], [0, 0, 17, 12]].forEach((l) => P.line(l[0], l[1], l[2], l[3], 'rgba(220,220,230,0.55)')); [5, 9, 13].forEach((r) => { for (let a = 0; a < 20; a++) { const t = (a / 19) * Math.PI / 2; P.px(Math.round(Math.cos(t) * r), Math.round(Math.sin(t) * r), 'rgba(220,220,230,0.4)'); } }); return S.fromCanvas(P.c, 0, 0); })();
  spr.hayBale = (function () { const P = S.painter(26, 20); P.ell(13, 11, 11, 8, ['#c8a850', '#9a7e38', '#6a5222'], 4, 0.1); for (let i = 0; i < 14; i++) P.line(3 + Math.floor(U.hash(i, 1, 4) * 20), 5 + Math.floor(U.hash(i, 2, 4) * 12), 6 + Math.floor(U.hash(i, 3, 4) * 20), 5 + Math.floor(U.hash(i, 4, 4) * 12), '#6a5222'); return finish(P, 13, 18, '#0a0806'); })();
  spr.poppet = (function () { const P = S.painter(10, 16); P.rect(3, 7, 4, 7, '#8a7a5a'); P.disc(5, 4, 3, '#c9b48a'); P.px(4, 4, '#1a1214'); P.px(6, 4, '#1a1214'); P.rect(1, 8, 2, 1, '#8a7a5a'); P.rect(7, 8, 2, 1, '#8a7a5a'); P.line(5, 9, 5, 12, '#8a2e3c'); return finish(P, 5, 15, '#0a0806'); })();
  spr.hanging = (function () { const P = S.painter(14, 30); P.line(7, 0, 7, 10, '#3a2a1e'); P.rect(4, 10, 6, 10, '#5a4a36'); P.disc(7, 8, 3, '#8a7a5a'); P.line(4, 13, 2, 20, '#5a4a36'); P.line(10, 13, 12, 20, '#5a4a36'); P.line(5, 20, 5, 28, '#4a3a28'); P.line(9, 20, 9, 28, '#4a3a28'); return finish(P, 7, 29, '#0a0806'); })();
  spr.stump = (function () { const P = S.painter(22, 16); P.ell(11, 10, 9, 5, ['#6a5240', '#463428', '#281c14'], 4, 0.1); P.ell(11, 8, 7, 3, ['#8a7258', '#6a5240', '#463428'], 5, 0); P.line(7, 8, 15, 8, '#463428'); P.line(9, 7, 13, 9, '#463428'); return finish(P, 11, 14, '#08060a'); })();
  spr.rock = [1, 2, 3].map((s) => { const P = S.painter(24, 18); P.blob(12, 10, 7 + s, ['#7a7886', '#55536a', '#33313f'], s * 5, 3); P.speckle(4, 4, 16, 12, ['#3e5a34', '#58783f'], 6, s); return finish(P, 12, 16, '#08080c'); });


  /* ---------------------------------------------------------- additions: furniture, rubble, ritual */
  spr.table = S.frames(5, (i) => { const P = S.painter(56, 30); P.rect(3, 10, 50, 5, '#5a4230'); P.rect(3, 10, 50, 1, '#7a5c42'); P.rect(3, 14, 50, 2, '#2c1f15'); P.rect(5, 16, 3, 10, '#3a281c'); P.rect(48, 16, 3, 10, '#3a281c'); P.rect(20, 16, 3, 8, '#3a281c');
    for (let k = 0; k < 6; k++) { const x = 6 + k * 8; P.ell(x + 2, 9, 2, 1, ['#d8ccb0', '#b0a68c', '#7a7260'], 3, 0); } [[12, 6], [28, 4], [42, 6]].forEach((c, k) => { P.rect(c[0], c[1], 2, 5, '#d8ccb0'); drawFlame(P, c[0] + 1, c[1] - 1, 3, i / 5 + k * 0.3); }); P.ell(36, 9, 3, 1, ['#a8864a', '#8a6a32', '#5a4220'], 4, 0); return finish(P, 28, 26, '#0a0806'); });
  spr.bed = (function () { const P = S.painter(30, 24); P.rect(2, 8, 26, 14, '#4a3526'); P.rect(2, 8, 26, 1, '#6c523c'); P.rect(4, 10, 22, 10, '#6a5a4a'); P.rect(4, 10, 22, 2, '#8a7a66'); P.rect(4, 10, 7, 4, '#c8bca0'); P.rect(2, 20, 3, 4, '#2c1f15'); P.rect(25, 20, 3, 4, '#2c1f15'); return finish(P, 15, 22, '#0a0806'); })();
  spr.rubble = (function () { const P = S.painter(44, 34); for (let i = 0; i < 14; i++) { const x = 4 + Math.floor(U.hash(i, 1, 5) * 36), y = 10 + Math.floor(U.hash(i, 2, 5) * 20); P.blob(x, y, 4 + Math.floor(U.hash(i, 3, 5) * 5), ['#7a7886', '#55536a', '#33313f'], i * 3, 3); } P.speckle(4, 8, 36, 24, ['#2a2830', '#3e5a34'], 14, 4); return finish(P, 22, 32, '#08080c'); })();
  spr.gateBig = [0, 1].map((o) => { const P = S.painter(60, 52), m = ['#5a5868', '#3e3c4c', '#22202c']; P.rect(0, 6, 8, 46, m[1]); P.rect(52, 6, 8, 46, m[1]); P.rect(0, 6, 3, 46, m[0]); P.rect(0, 0, 60, 8, m[1]); P.rect(0, 0, 60, 2, m[0]); if (!o) { for (let x = 11; x < 52; x += 5) { P.rect(x, 8, 2, 44, '#2a2830'); P.px(x, 8, '#6a6874'); P.px(x + 1, 8, '#4a4754'); } P.rect(8, 20, 44, 2, '#3a3844'); P.rect(8, 38, 44, 2, '#3a3844'); P.disc(30, 28, 5, '#4a4754'); P.disc(30, 28, 3, '#14121a'); P.px(30, 28, '#7fa6ff'); } else P.rect(8, 8, 44, 44, '#050408'); return finish(P, 30, 51, '#06060a'); });
  spr.ritual = S.frames(8, (i) => { const P = S.painter(64, 40), ph = i / 8; for (let a = 0; a < 80; a++) { const t = (a / 80) * 6.283; P.px(Math.round(32 + Math.cos(t) * 28), Math.round(20 + Math.sin(t) * 16), a % 6 < 3 ? '#c27be0' : '#6a3a8a'); P.px(Math.round(32 + Math.cos(t) * 22), Math.round(20 + Math.sin(t) * 12), '#6a3a8a'); } for (let k = 0; k < 5; k++) { const t = (k / 5) * 6.283 + ph * 0.3; const x = 32 + Math.cos(t) * 25, y = 20 + Math.sin(t) * 14; P.line(32 + Math.cos(t + 2.5) * 22, 20 + Math.sin(t + 2.5) * 12, x, y, '#a060c8'); } P.disc(32, 20, 2, '#e8c0ff'); return S.fromCanvas(P.c, 32, 20); });
  spr.hood = (function () { const P = S.painter(20, 26); P.rect(0, 0, 0, 0, '#000'); return S.fromCanvas(P.c, 10, 25); })();
  spr.rug = (function () { const P = S.painter(40, 26); for (let y = 0; y < 26; y++) for (let x = 0; x < 40; x++) P.px(x, y, U.hash(x, y, 8) > 0.7 ? '#6a2a30' : '#53202a'); P.rect(0, 0, 40, 2, '#8a6a2a'); P.rect(0, 24, 40, 2, '#8a6a2a'); P.rect(0, 0, 2, 26, '#8a6a2a'); P.rect(38, 0, 2, 26, '#8a6a2a'); P.disc(20, 13, 5, '#8a6a2a'); P.disc(20, 13, 3, '#53202a'); return S.fromCanvas(P.c, 20, 13); })();
  spr.pew = (function () { const P = S.painter(34, 20); P.rect(2, 6, 30, 5, '#4a3526'); P.rect(2, 6, 30, 1, '#6c523c'); P.rect(2, 10, 30, 7, '#3a281c'); P.rect(2, 16, 4, 4, '#2c1f15'); P.rect(28, 16, 4, 4, '#2c1f15'); P.rect(2, 2, 30, 4, '#3a281c'); P.rect(2, 2, 30, 1, '#5a4230'); return finish(P, 17, 19, '#0a0806'); })();
  spr.cage = (function () { const P = S.painter(22, 30); P.line(11, 0, 11, 6, '#3a3844'); P.rect(3, 6, 16, 2, '#4a4754'); for (let x = 3; x <= 19; x += 4) P.rect(x, 8, 1, 16, '#2a2830'); P.rect(3, 24, 16, 2, '#4a4754'); P.ell(11, 18, 3, 4, ['#d8cdb4', '#a89c82', '#6c6354'], 3, 0.1); return finish(P, 11, 29, '#08080c'); })();

  /* ---------------------------------------------------------- lighting helpers */
  spr.moon = (function () { const P = S.painter(24, 24); P.disc(12, 12, 9, '#e8ecf4'); P.disc(15, 10, 8, '#050407'); return S.fromCanvas(P.c, 12, 12); })();
  Pr.sway = (t, x, amp) => (ph) => Math.sin(t * 1.4 + x * 0.05 + ph) * amp;
})();

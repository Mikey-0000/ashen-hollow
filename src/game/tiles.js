/* Ashen Hollow - procedural environmental textures: seamless ground tiles, walls and the area baker
   that blends terrain edges, adds decals and shading. Every tile is generated pixel-by-pixel from noise
   and dithering over a muted palette so the world reads as hand-textured rather than flat fills. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, S = AH.Sprites, T = AH.T;
  const Tiles = (AH.Tiles = {});

  /* tile ids */
  const ID = (Tiles.ID = {
    VOID: 0, GRASS: 1, DIRT: 2, COBBLE: 3, MOSS: 4, WATER: 5, FLAG: 6, WOOD: 7, CRYPT: 8, RUNE: 9, CARPET: 10, MUD: 11, BONES: 12, BRIDGE: 13, LEAVES: 14, ICE: 15, PEAT: 16,
    WALL: 20, CWALL: 21, TIMBER: 22, ROCK: 23, FENCE: 24, HEDGE: 25, TREELINE: 26, DEEP: 27,
  });
  /* terrain info: solid blocks movement, opaque blocks light, mat = footstep material, pri = blend priority */
  const INFO = (Tiles.INFO = {});
  const def = (id, o) => (INFO[id] = Object.assign({ solid: false, opaque: false, mat: 'dirt', pri: 0 }, o));
  def(ID.VOID, { solid: true, opaque: true, pri: 0 });
  def(ID.GRASS, { mat: 'grass', pri: 3, base: '#2f3c2a' }); def(ID.DIRT, { mat: 'dirt', pri: 4, base: '#4a3d30' });
  def(ID.COBBLE, { mat: 'stone', pri: 6, base: '#4a4850' }); def(ID.MOSS, { mat: 'grass', pri: 2, base: '#2a3826' });
  def(ID.WATER, { mat: 'water', pri: 1, base: '#1d3036', water: true }); def(ID.FLAG, { mat: 'stone', pri: 6, base: '#3c3a44' });
  def(ID.WOOD, { mat: 'wood', pri: 7, base: '#4a3526' }); def(ID.CRYPT, { mat: 'stone', pri: 6, base: '#2c2a34' });
  def(ID.RUNE, { mat: 'stone', pri: 6, base: '#2c2a34' }); def(ID.CARPET, { mat: 'wood', pri: 8, base: '#5a2028' });
  def(ID.MUD, { mat: 'dirt', pri: 4, base: '#3a2f26' }); def(ID.BONES, { mat: 'bone', pri: 6, base: '#34303a' });
  def(ID.BRIDGE, { mat: 'wood', pri: 9, base: '#4a3526' }); def(ID.LEAVES, { mat: 'grass', pri: 3, base: '#4a3424' });
  def(ID.ICE, { mat: 'stone', pri: 5, base: '#5c7b90', slick: true }); def(ID.PEAT, { mat: 'dirt', pri: 3, base: '#2c2f22', boggy: true });
  [ID.WALL, ID.CWALL, ID.TIMBER, ID.ROCK, ID.TREELINE].forEach((i) => def(i, { solid: true, opaque: true, mat: 'stone', pri: 20 }));
  def(ID.FENCE, { solid: true, opaque: false, mat: 'wood', pri: 20 }); def(ID.HEDGE, { solid: true, opaque: true, mat: 'grass', pri: 20 }); def(ID.DEEP, { solid: true, opaque: false, mat: 'water', water: true, pri: 0, base: '#101c22' });

  const PAL = {
    grass: ['#38482f', '#2f3c2a', '#26321f', '#4a5e3c'], dirt: ['#5a4a38', '#4a3d30', '#3a3025', '#6a5a46'], stone: ['#5a5862', '#4a4850', '#383640', '#6e6c78'],
    moss: ['#344a2c', '#2a3826', '#1f2c1c', '#4c6a3c'], flag: ['#4a4854', '#3c3a44', '#2e2c36', '#5c5a68'], crypt: ['#38353f', '#2c2a34', '#201e28', '#46434f'],
    wood: ['#5a4230', '#4a3526', '#3a281c', '#6c523c'], mud: ['#46382c', '#3a2f26', '#2c231c', '#54443a'], leaves: ['#5a3e28', '#4a3424', '#382618', '#7a4e2c'],
  };

  function rnd(seed) { return U.mulberry32(seed); }
  /* seamless value noise on a 16x16 torus */
  function tn(x, y, s, f) { const n = 16 / f; const X = x / f, Y = y / f; const x0 = Math.floor(X), y0 = Math.floor(Y), fx = X - x0, fy = Y - y0; const h = (a, b) => U.hash(((a % n) + n) % n, ((b % n) + n) % n, s); const u = U.smooth(fx), v = U.smooth(fy); return U.lerp(U.lerp(h(x0, y0), h(x0 + 1, y0), u), U.lerp(h(x0, y0 + 1), h(x0 + 1, y0 + 1), u), v); }

  function groundTile(kind, seed) {
    const P = S.painter(T, T), p = PAL[kind], r = rnd(seed * 97 + kind.length);
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
      const n = tn(x, y, seed, 8) * 0.6 + tn(x, y, seed + 5, 4) * 0.4, d = ((x + y * 2) % 4) / 4;
      let c = n + (d - 0.5) * 0.12 > 0.62 ? p[0] : n < 0.36 ? p[2] : p[1];
      if (r() < 0.05) c = p[r() < 0.5 ? 2 : 0];
      P.px(x, y, c);
    }
    if (kind === 'grass' || kind === 'moss') {
      for (let i = 0; i < (kind === 'moss' ? 5 : 7); i++) { const x = Math.floor(r() * 14) + 1, y = Math.floor(r() * 12) + 3, h = 2 + Math.floor(r() * 2); for (let k = 0; k < h; k++) P.px(x + (k > 1 ? (r() < 0.5 ? 1 : -1) * 0 : 0), y - k, k === h - 1 ? p[3] : p[0]); }
      if (r() < 0.25) { const x = 2 + Math.floor(r() * 12), y = 3 + Math.floor(r() * 10), fc = U.pick(['#b8a8c8', '#c8b078', '#a07080']); P.px(x, y, fc); P.px(x, y - 1, U.shade(fc, -0.4)); }
    } else if (kind === 'dirt' || kind === 'mud') {
      for (let i = 0; i < 4; i++) { const x = Math.floor(r() * 13) + 1, y = Math.floor(r() * 13) + 1; P.px(x, y, p[3]); P.px(x + 1, y, p[0]); P.px(x, y + 1, p[2]); }
      if (kind === 'mud') for (let i = 0; i < 2; i++) { const x = 2 + Math.floor(r() * 10), y = 2 + Math.floor(r() * 10); P.px(x, y, '#2a3a40'); P.px(x + 1, y, '#35505a'); }
    } else if (kind === 'leaves') {
      for (let i = 0; i < 9; i++) { const x = Math.floor(r() * 14), y = Math.floor(r() * 14); const c = U.pick(['#7a4e2c', '#8a5a30', '#5a3a22', '#9a6a38']); P.px(x, y, c); P.px(x + 1, y, c); P.px(x, y + 1, U.shade(c, -0.35)); }
    }
    return P.c;
  }
  /* cobbles: jittered voronoi on a torus, mortar where two cells meet */
  function cobbleTile(seed, kind) {
    const P = S.painter(T, T), r = rnd(seed * 131), p = kind === 'crypt' ? PAL.crypt : PAL.stone, pts = [];
    for (let i = 0; i < 6; i++) pts.push([((i % 3) * 5.4 + r() * 3.2) | 0, (((i / 3) | 0) * 8 + r() * 4) | 0, 0.82 + r() * 0.26]);
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
      let d1 = 99, d2 = 99, bi = 0;
      pts.forEach((q, i) => { for (let ox = -16; ox <= 16; ox += 16) for (let oy = -16; oy <= 16; oy += 16) { const d = Math.hypot(x - q[0] - ox, y - q[1] - oy) / q[2]; if (d < d1) { d2 = d1; d1 = d; bi = i; } else if (d < d2) d2 = d; } });
      if (d2 - d1 < 1.15) P.px(x, y, p[2]);
      else { const n = tn(x, y, seed, 4), top = d2 - d1 < 2.3 && (x + y) % 2 === 0; P.px(x, y, top ? p[1] : n > 0.6 ? p[0] : n < 0.35 ? p[1] : p[1]); if (!top && d1 < 2.4 && x < pts[bi][0] && y < pts[bi][1] + 1) P.px(x, y, p[3]); }
    }
    for (let i = 0; i < 6; i++) P.px(Math.floor(r() * 16), Math.floor(r() * 16), kind === 'crypt' ? '#3e5a40' : '#4a5e3c');
    return P.c;
  }
  function flagTile(seed, kind) {
    const P = S.painter(T, T), p = PAL[kind], r = rnd(seed * 71);
    P.rect(0, 0, T, T, p[1]);
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const n = tn(x, y, seed, 4); if (n > 0.66) P.px(x, y, p[0]); else if (n < 0.3) P.px(x, y, p[2]); }
    P.rect(0, 0, T, 1, p[2]); P.rect(0, 0, 1, T, p[2]); P.rect(1, 1, T - 2, 1, p[0]); P.rect(1, 1, 1, T - 2, p[0]);
    P.rect(0, T - 1, T, 1, p[2]);
    if (r() < 0.5) { let x = 3 + Math.floor(r() * 8), y = 3; for (let k = 0; k < 8; k++) { P.px(x, y, p[2]); y++; x += r() < 0.5 ? 0 : r() < 0.5 ? 1 : -1; } }
    return P.c;
  }
  function woodTile(seed) {
    const P = S.painter(T, T), p = PAL.wood, r = rnd(seed * 53);
    for (let b = 0; b < 4; b++) {
      const y0 = b * 4, tone = r() < 0.5 ? 1 : r() < 0.5 ? 0 : 2;
      P.rect(0, y0, T, 3, p[tone]); P.rect(0, y0 + 3, T, 1, '#241a12');
      for (let i = 0; i < 6; i++) P.px(Math.floor(r() * 16), y0 + Math.floor(r() * 3), p[r() < 0.5 ? 2 : 3]);
      const nx = Math.floor(r() * 12) + 2; P.px(nx, y0 + 1, '#241a12');
      if (r() < 0.4) P.rect((seed * 3 + b * 5) % 14, y0, 1, 4, '#241a12');
    }
    return P.c;
  }
  function carpetTile(seed) {
    const P = S.painter(T, T);
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const n = U.hash(x, y, seed); P.px(x, y, n > 0.8 ? '#6a2a30' : n < 0.2 ? '#3e141a' : '#53202a'); }
    P.rect(0, 0, T, 2, '#8a6a2a'); P.rect(0, T - 2, T, 2, '#8a6a2a'); P.rect(0, 2, T, 1, '#3a1a10'); P.rect(0, T - 3, T, 1, '#3a1a10');
    for (let x = 2; x < T; x += 4) { P.px(x, 7, '#8a6a2a'); P.px(x, 8, '#8a6a2a'); P.px(x + 1, 7, '#6a4a1a'); }
    P.speckle(0, 0, 16, 16, ['#2a0a10'], 10, seed);
    return P.c;
  }
  function bonesTile(seed) {
    const P = S.painter(T, T), r = rnd(seed * 19);
    P.g.drawImage(flagTile(seed, 'crypt'), 0, 0);
    for (let i = 0; i < 3; i++) {
      const x = 1 + Math.floor(r() * 11), y = 2 + Math.floor(r() * 11), c = U.pick(['#d8cdb4', '#b6ab92', '#8f866f']);
      if (r() < 0.4) { P.px(x, y, c); P.px(x + 1, y, c); P.px(x, y + 1, '#2a2830'); P.px(x + 1, y + 1, c); P.px(x + 2, y + 1, '#2a2830'); } else { P.line(x, y, x + 3, y + 1, c); P.px(x, y, '#e8dec6'); P.px(x + 3, y + 1, '#e8dec6'); }
    }
    return P.c;
  }
  function runeTile() {
    const P = S.painter(T, T); P.g.drawImage(flagTile(3, 'crypt'), 0, 0);
    P.line(8, 2, 13, 8, '#6a7a9a'); P.line(13, 8, 8, 14, '#6a7a9a'); P.line(8, 14, 3, 8, '#6a7a9a'); P.line(3, 8, 8, 2, '#6a7a9a'); P.px(8, 8, '#a8c0ff');
    return P.c;
  }
  function bridgeTile(seed) {
    const P = S.painter(T, T), p = PAL.wood;
    for (let b = 0; b < 4; b++) { P.rect(0, b * 4, T, 3, p[(b + seed) % 3]); P.rect(0, b * 4 + 3, T, 1, '#1a120c'); P.px(2, b * 4 + 1, '#1a120c'); P.px(13, b * 4 + 1, '#1a120c'); }
    P.rect(0, 0, 1, T, '#2a1c12'); P.rect(T - 1, 0, 1, T, '#2a1c12');
    return P.c;
  }
  /* animated water: 4 frames of drifting dark teal with glints */
  function waterFrames(deep) {
    const out = [], base = deep ? ['#142228', '#101c22', '#0b141a', '#1e3238'] : ['#244048', '#1d3036', '#152329', '#38626a'];
    for (let f = 0; f < 4; f++) {
      const P = S.painter(T, T);
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
        const n = tn(x + f * 4, y + Math.sin((x + f * 4) * 0.4) * 2, 9, 8), m = tn(x - f * 2, y + f * 3, 14, 4);
        P.px(x, y, n > 0.66 ? base[0] : n < 0.34 ? base[2] : base[1]);
        if (m > 0.78 && (x + y + f) % 3 === 0) P.px(x, y, base[3]);
      }
      out.push(P.c);
    }
    return out;
  }

  /* ---- walls: brick/slab faces with a lit top ledge. Each variant renders 'cap' (open above) or 'mid' ---- */
  function wallTile(kind, seed, cap) {
    const P = S.painter(T, T), r = rnd(seed * 211 + kind.length);
    const pal = { stone: ['#6c6a76', '#55535f', '#3e3c48', '#2a2832'], crypt: ['#4a4658', '#38364a', '#28263a', '#1a1824'], timber: ['#6a5238', '#523e2a', '#3a2c1e', '#241a12'], rock: ['#5e5a52', '#48443e', '#34302c', '#222020'] }[kind];
    if (kind === 'timber') {
      P.rect(0, 0, T, T, pal[1]);
      for (let x = 0; x < T; x += 4) { P.rect(x, 0, 1, T, pal[3]); P.rect(x + 1, 0, 1, T, pal[0]); for (let i = 0; i < 3; i++) P.px(x + 2, Math.floor(r() * 16), pal[2]); }
      P.rect(0, 5, T, 1, pal[3]); P.rect(0, 11, T, 1, pal[3]);
    } else if (kind === 'rock') {
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const n = tn(x, y, seed + 40, 4) * 0.7 + tn(x, y, seed + 41, 8) * 0.3; P.px(x, y, n > 0.62 ? pal[0] : n < 0.38 ? pal[2] : pal[1]); }
      for (let i = 0; i < 3; i++) { let x = Math.floor(r() * 14), y = Math.floor(r() * 4); for (let k = 0; k < 9; k++) { P.px(x, y, pal[3]); y++; x += r() < 0.4 ? (r() < 0.5 ? -1 : 1) : 0; } }
    } else {
      const bh = kind === 'crypt' ? 8 : 5;
      for (let row = 0; row * bh < T; row++) {
        const y0 = row * bh, off = row % 2 ? (kind === 'crypt' ? 4 : 5) : 0, bw = kind === 'crypt' ? 8 : 10;
        for (let bx = -bw; bx < T + bw; bx += bw) {
          const x0 = bx + off, tone = r() < 0.18 ? 0 : r() < 0.4 ? 2 : 1;
          for (let y = 0; y < bh - 1; y++) for (let x = 0; x < bw - 1; x++) {
            const X = x0 + x, Y = y0 + y; if (X < 0 || X >= T || Y >= T) continue;
            let c = pal[tone]; const n = U.hash(X, Y, seed + row); if (n > 0.86) c = pal[Math.max(0, tone - 1)]; else if (n < 0.1) c = pal[Math.min(2, tone + 1)];
            if (y === 0 && x < bw - 2) c = pal[Math.max(0, tone - 1)]; if (x === 0 && y > 0) c = pal[Math.max(0, tone - 1)]; if (y === bh - 2) c = pal[Math.min(3, tone + 1)];
            P.px(X, Y, c);
          }
          for (let x = 0; x < bw; x++) P.px(x0 + x, y0 + bh - 1, pal[3]);
          for (let y = 0; y < bh; y++) P.px(x0 + bw - 1, y0 + y, pal[3]);
        }
      }
      if (r() < 0.45) { const mx = Math.floor(r() * 12), mw = 3 + Math.floor(r() * 4); for (let i = 0; i < mw; i++) { P.px(mx + i, T - 1 - (i % 2), '#3e5a34'); P.px(mx + i, T - 2, i % 2 ? '#4c6a3c' : '#2e4428'); } }
    }
    if (cap) {
      P.rect(0, 0, T, 3, pal[0]); P.rect(0, 3, T, 1, pal[1]); P.rect(0, 0, T, 1, U.shade(pal[0], 0.18));
      for (let i = 0; i < 5; i++) P.px(Math.floor(r() * 16), Math.floor(r() * 3), pal[1]);
    }
    P.rect(0, T - 1, T, 1, pal[3]);
    return P.c;
  }
  function fenceTile(seed, kind) {
    const P = S.painter(T, T), r = rnd(seed);
    if (kind === 'iron') {
      for (let x = 1; x < T; x += 3) { P.rect(x, 4, 1, 11, '#2a2830'); P.px(x, 2, '#4a4754'); P.px(x, 3, '#2a2830'); P.px(x - 1, 4, '#1a1820'); P.px(x + 1, 4, '#1a1820'); }
      P.rect(0, 6, T, 1, '#4a4754'); P.rect(0, 12, T, 1, '#2a2830');
    } else {
      P.rect(0, 5, T, 2, '#4a3526'); P.rect(0, 10, T, 2, '#3a281c');
      for (let x = 2; x < T; x += 5) { P.rect(x, 2 + Math.floor(r() * 2), 2, 12, '#5a4230'); P.rect(x, 2, 1, 12, '#6c523c'); }
    }
    return P.c;
  }
  function hedgeTile(seed) {
    const P = S.painter(T, T); P.rect(0, 0, T, T, '#1f2c1c');
    for (let i = 0; i < 22; i++) { const x = Math.floor(U.hash(i, 1, seed) * 16), y = Math.floor(U.hash(i, 2, seed) * 16); P.disc(x, y, 2, i % 3 ? '#2c3d26' : '#3a5030'); }
    P.speckle(0, 0, 16, 16, ['#4a6a3a', '#16200f'], 20, seed); return P.c;
  }
  function treelineTile(seed) {
    const P = S.painter(T, T); P.rect(0, 0, T, T, '#0c120c');
    for (let i = 0; i < 14; i++) { const x = Math.floor(U.hash(i, 3, seed) * 16), y = Math.floor(U.hash(i, 4, seed) * 16); P.disc(x, y, 3, i % 2 ? '#16221a' : '#101810'); }
    P.speckle(0, 0, 16, 16, ['#1f3022', '#0a0e0a'], 14, seed); return P.c;
  }

  /* frozen lake ice: pale slabs, hairline cracks, a few glints */
  function iceTile(seed) {
    const P = S.painter(T, T), r = rnd(seed * 53), p = ['#6f8ea2', '#5c7b90', '#47657a', '#8fadbf'];
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const n = tn(x, y, seed, 8) * 0.6 + tn(x, y, seed + 5, 4) * 0.4; P.px(x, y, n > 0.64 ? p[3] : n < 0.38 ? p[2] : p[1]); }
    for (let k = 0; k < 2; k++) { let x = Math.floor(r() * 16), y = Math.floor(r() * 16); for (let i = 0; i < 6 + Math.floor(r() * 4); i++) { P.px(x & 15, y & 15, i % 3 ? '#35566c' : '#b8d4e4'); x += r() < 0.5 ? 1 : 0; y += r() < 0.6 ? 1 : (r() < 0.5 ? -1 : 0); } }
    for (let i = 0; i < 3; i++) { const x = Math.floor(r() * 15), y = Math.floor(r() * 15); P.px(x, y, '#d4e8f4'); }
    return P.c;
  }
  /* bog peat: dark mottled ground with black puddle glints and tufts of reed */
  function peatTile(seed) {
    const P = S.painter(T, T), r = rnd(seed * 71), p = ['#3a3a2a', '#2c2f22', '#20241a', '#4a4a30'];
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const n = tn(x, y, seed, 8) * 0.6 + tn(x, y, seed + 5, 4) * 0.4; P.px(x, y, n > 0.62 ? p[0] : n < 0.4 ? p[2] : p[1]); }
    for (let i = 0; i < 3; i++) { const x = 1 + Math.floor(r() * 12), y = 2 + Math.floor(r() * 11); P.px(x, y, '#1a2a2e'); P.px(x + 1, y, '#2a4650'); P.px(x + 2, y, '#1a2a2e'); }
    for (let i = 0; i < 3; i++) { const x = 1 + Math.floor(r() * 14), y = 5 + Math.floor(r() * 9), h = 2 + Math.floor(r() * 3); for (let k = 0; k < h; k++) P.px(x, y - k, k > 1 ? '#7a8a4a' : '#56683a'); }
    return P.c;
  }
  /* ---- build the library ---- */
  const lib = (Tiles.lib = {});
  function build() {
    lib.grass = [1, 2, 3, 4].map((s) => groundTile('grass', s)); lib.moss = [1, 2, 3].map((s) => groundTile('moss', s));
    lib.dirt = [1, 2, 3, 4].map((s) => groundTile('dirt', s)); lib.mud = [1, 2].map((s) => groundTile('mud', s)); lib.leaves = [1, 2, 3].map((s) => groundTile('leaves', s));
    lib.cobble = [1, 2, 3, 4].map((s) => cobbleTile(s, 'stone')); lib.crypt = [1, 2, 3, 4].map((s) => flagTile(s, 'crypt')); lib.flag = [1, 2, 3, 4].map((s) => flagTile(s, 'flag'));
    lib.cryptCobble = [1, 2].map((s) => cobbleTile(s + 10, 'crypt'));
    lib.wood = [1, 2, 3, 4].map(woodTile); lib.carpet = [1, 2].map(carpetTile); lib.bones = [1, 2, 3, 4].map(bonesTile); lib.rune = [runeTile()]; lib.bridge = [1, 2].map(bridgeTile);
    lib.ice = [1, 2, 3, 4].map(iceTile); lib.peat = [1, 2, 3].map(peatTile); [5, 6, 7, 8].forEach((q) => { lib.grass.push(groundTile('grass', q)); lib.dirt.push(groundTile('dirt', q)); }); [4, 5].forEach((q) => lib.moss.push(groundTile('moss', q)));
    lib.water = waterFrames(false); lib.deep = waterFrames(true);
    ['stone', 'crypt', 'timber', 'rock'].forEach((k) => { lib['wall_' + k] = { mid: [1, 2, 3].map((s) => wallTile(k, s, false)), cap: [1, 2, 3].map((s) => wallTile(k, s, true)) }; });
    lib.fenceIron = [fenceTile(1, 'iron')]; lib.fenceWood = [fenceTile(2, 'wood')]; lib.hedge = [1, 2, 3].map(hedgeTile); lib.treeline = [1, 2, 3].map(treelineTile);
  }
  build();

  const pickV = (arr, x, y) => arr[Math.floor(U.hash(x, y, 7) * arr.length) % arr.length];
  const tileImg = Tiles.tileImg = function (id, x, y, hasWallAbove, theme) {
    switch (id) {
      case ID.GRASS: return pickV(lib.grass, x, y); case ID.MOSS: return pickV(lib.moss, x, y); case ID.DIRT: return pickV(lib.dirt, x, y); case ID.MUD: return pickV(lib.mud, x, y);
      case ID.LEAVES: return pickV(lib.leaves, x, y); case ID.COBBLE: return theme === 'crypt' ? pickV(lib.cryptCobble, x, y) : pickV(lib.cobble, x, y); case ID.FLAG: return pickV(lib.flag, x, y);
      case ID.CRYPT: return pickV(lib.crypt, x, y); case ID.WOOD: return pickV(lib.wood, x, y); case ID.CARPET: return pickV(lib.carpet, x, y); case ID.BONES: return pickV(lib.bones, x, y);
      case ID.ICE: return pickV(lib.ice, x, y); case ID.PEAT: return pickV(lib.peat, x, y);
      case ID.RUNE: return lib.rune[0]; case ID.BRIDGE: return pickV(lib.bridge, x, y);
      case ID.WALL: return pickV(lib.wall_stone[hasWallAbove ? 'mid' : 'cap'], x, y); case ID.CWALL: return pickV(lib.wall_crypt[hasWallAbove ? 'mid' : 'cap'], x, y);
      case ID.TIMBER: return pickV(lib.wall_timber[hasWallAbove ? 'mid' : 'cap'], x, y); case ID.ROCK: return pickV(lib.wall_rock[hasWallAbove ? 'mid' : 'cap'], x, y);
      case ID.FENCE: return theme === 'crypt' ? lib.fenceIron[0] : pickV(theme === 'hamlet' ? lib.fenceWood : lib.fenceWood, x, y);
      case ID.HEDGE: return pickV(lib.hedge, x, y); case ID.TREELINE: return pickV(lib.treeline, x, y);
      default: return null;
    }
  };

  /* ---------- area baker ----------
     Paints the whole static layer once: ground, blended terrain edges, walls with contact shadows. */
  Tiles.bake = function (area) {
    const w = area.w, h = area.h, c = U.makeCanvas(w * T, h * T), g = c.getContext('2d'), tiles = area.tiles;
    const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? ID.VOID : tiles[y * w + x]);
    const isWall = (id) => INFO[id] && INFO[id].solid && id !== ID.FENCE && id !== ID.DEEP && id !== ID.VOID;
    const wanim = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const id = at(x, y), inf = INFO[id];
      if (id === ID.VOID) { g.fillStyle = '#050407'; g.fillRect(x * T, y * T, T, T); continue; }
      if (id === ID.WATER || id === ID.DEEP) { g.drawImage(lib.deep[0], x * T, y * T); wanim.push([x, y, id === ID.DEEP]); continue; }
      if (id === ID.FENCE) { const under = at(x, y + 1) === ID.WOOD || at(x, y) === ID.FENCE ? ID.DIRT : ID.GRASS; g.drawImage(tileImg(area.theme === 'crypt' ? ID.CRYPT : (area.fenceGround || ID.GRASS), x, y, false, area.theme), x * T, y * T); g.drawImage(tileImg(id, x, y, false, area.theme), x * T, y * T); continue; }
      if (isWall(id)) {
        if (id === ID.HEDGE || id === ID.TREELINE) g.drawImage(tileImg(area.floorUnder || ID.GRASS, x, y, false), x * T, y * T);
        g.drawImage(tileImg(id, x, y, isWall(at(x, y - 1)), area.theme), x * T, y * T); continue;
      }
      g.drawImage(tileImg(id, x, y, false, area.theme), x * T, y * T);
    }
    /* terrain blending: higher-priority neighbours bleed dithered pixels across the border */
    const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const id = at(x, y), inf = INFO[id]; if (!inf || inf.solid || id === ID.WATER) continue;
      dirs.forEach((d, di) => {
        const nid = at(x + d[0], y + d[1]), ni = INFO[nid]; if (!ni || ni.solid || nid === id || nid === ID.WATER || nid === ID.DEEP) return;
        if (ni.pri >= inf.pri) return;
        const base = ni.base || '#333'; const cols = [base, U.shade(base, -0.2), U.shade(base, 0.15)];
        for (let i = 0; i < T; i++) { const depth = 1 + Math.floor(U.hash(x * 16 + i, y * 16 + di, 3) * 3.2); for (let k = 0; k < depth; k++) { if (U.hash(x * 16 + i, y * 16 + k, di + 11) < 0.78 - k * 0.2) { const px = d[0] === 0 ? x * T + i : d[0] > 0 ? x * T + T - 1 - k : x * T + k, py = d[1] === 0 ? y * T + i : d[1] > 0 ? y * T + T - 1 - k : y * T + k; g.fillStyle = cols[(i + k) % 3]; g.fillRect(px, py, 1, 1); } } }
      });
    }
    /* water banks: dark rim & lighter foam line */
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (at(x, y) !== ID.WATER && at(x, y) !== ID.DEEP) continue;
      dirs.forEach((d, di) => {
        const nid = at(x + d[0], y + d[1]); if (nid === ID.WATER || nid === ID.DEEP || nid === ID.VOID) return;
        for (let i = 0; i < T; i++) { const px = d[0] === 0 ? x * T + i : d[0] > 0 ? x * T + T - 1 : x * T, py = d[1] === 0 ? y * T + i : d[1] > 0 ? y * T + T - 1 : y * T; g.fillStyle = '#0a1418'; g.fillRect(px, py, 1, 1); const qx = d[0] === 0 ? px : px - d[0], qy = d[1] === 0 ? py : py - d[1]; if (U.hash(px, py, 5) > 0.55) { g.fillStyle = '#5a8a90'; g.fillRect(qx, qy, 1, 1); } }
      });
    }
    /* contact shadow beneath wall faces: a dithered darkening on the floor south of a wall */
    for (let y = 0; y < h - 1; y++) for (let x = 0; x < w; x++) {
      if (!isWall(at(x, y)) || isWall(at(x, y + 1)) || INFO[at(x, y + 1)].solid) continue;
      for (let i = 0; i < T; i++) for (let k = 0; k < 4; k++) if ((i + k) % 2 === 0 || k < 2) { g.fillStyle = 'rgba(5,4,10,' + (0.34 - k * 0.07).toFixed(2) + ')'; g.fillRect(x * T + i, (y + 1) * T + k, 1, 1); }
    }
    area.water = wanim;
    return c;
  };
  Tiles.drawWater = function (g, area, cam, time) {
    const f = Math.floor(time * 2.2) % 4, frames = lib.water;
    area.water.forEach((q) => {
      const sx = q[0] * T - cam.x, sy = q[1] * T - cam.y; if (sx < -T || sy < -T || sx > AH.W || sy > AH.H) return;
      g.drawImage(q[2] ? lib.deep[f] : frames[(f + q[0] + q[1]) % 4], Math.round(sx), Math.round(sy));
    });
  };
})();

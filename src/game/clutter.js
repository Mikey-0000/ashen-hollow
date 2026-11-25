/* Ashen Hollow - ground clutter: pebbles, flowers, leaf litter, twigs, puddles, moss, cracks, ash, candle stubs.
   Sprites are procedural; placement runs after each map is built, using the map's own seeded rng
   (drawn last, so it never shifts existing layouts). Density is deliberately moderate. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, S = AH.Sprites, ID = AH.Tiles.ID;
  const spr = AH.Props.spr, rnd = (s) => U.mulberry32(s);
  const fin = (P, ax, ay) => S.fromCanvas(P.c, ax, ay);
  const set3 = (w, h, fn) => [1, 2, 3].map((s) => { const P = S.painter(w, h), r = rnd(s * 131 + w); fn(P, r, s); return fin(P, w >> 1, h - 1); });

  spr.pebbles = set3(14, 8, (P, r) => { const n = 3 + Math.floor(r() * 3); for (let i = 0; i < n; i++) { const x = 2 + r() * 10, y = 2 + r() * 4, s = r() < 0.3 ? 2 : 1; P.ell(x, y + 1, s + 1, s, '#2c2a30'); P.ell(x, y, s + 1, s, ['#7a7882', '#6a6872', '#8a8690'][i % 3]); P.px(x - 1, y - 1, '#a8a6b0'); } });
  spr.leaves = set3(16, 8, (P, r) => { const cols = ['#8a4a22', '#a8672a', '#6a3a1c', '#7a5a24', '#b07a30']; for (let i = 0; i < 9; i++) { const x = 1 + r() * 14, y = 1 + r() * 6, c = cols[Math.floor(r() * cols.length)]; P.px(x, y, c); P.px(x + 1, y, c); if (r() < 0.5) P.px(x, y + 1, '#3a2412'); } });
  spr.twigs = set3(16, 8, (P, r) => { for (let i = 0; i < 3; i++) { const x = 1 + r() * 8, y = 1 + r() * 5, a = (r() - 0.5) * 1.2, l = 4 + r() * 5; P.line(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l * 0.5, i % 2 ? '#3e2e22' : '#54402e'); if (r() < 0.6) P.px(x + l * 0.5, y - 1, '#54402e'); } });
  spr.flower = [['#c9d6ff', '#8aa0e8'], ['#d9526a', '#a02a44'], ['#e8d27a', '#b09a3a']].map((c, s) => { const P = S.painter(10, 12), r = rnd(s * 17 + 4); for (let i = 0; i < 3; i++) { const x = 2 + i * 3 + (r() < 0.5 ? 0 : 1), h = 4 + Math.floor(r() * 4); P.line(x, 11, x, 11 - h, '#3c5a34'); P.px(x + 1, 11 - Math.floor(h / 2), '#4c6a3c'); P.px(x, 10 - h, c[0]); P.px(x - 1, 11 - h, c[1]); P.px(x + 1, 11 - h, c[1]); P.px(x, 12 - h, c[1]); } return fin(P, 5, 11); });
  spr.puddle = [0, 1, 2].map((s) => { const P = S.painter(24, 10), r = rnd(s * 9 + 2); P.ell(12, 5, 9 + s, 3, 'rgba(20,24,40,0.55)'); P.ell(11, 4, 7 + s, 2, 'rgba(70,90,130,0.45)'); for (let i = 0; i < 5; i++) P.px(5 + r() * 14, 3 + r() * 3, 'rgba(180,200,240,0.5)'); P.px(9, 3, 'rgba(230,240,255,0.7)'); return fin(P, 12, 9); });
  spr.mosspatch = set3(18, 8, (P, r) => { for (let i = 0; i < 26; i++) { const x = 2 + r() * 14, y = 1 + r() * 6, d = Math.hypot(x - 9, (y - 4) * 2.2); if (d < 8) P.px(x, y, ['#3a5a30', '#4a6e38', '#2e4a28'][Math.floor(r() * 3)]); } });
  spr.crack = set3(18, 8, (P, r) => { let x = 1, y = 3 + r() * 2; for (let i = 0; i < 16; i++) { P.px(x, y, '#15121a'); x += 1; y += r() < 0.5 ? 0 : (r() < 0.5 ? -1 : 1); y = U.clamp(y, 1, 6); if (r() < 0.12) P.px(x, y + 1, '#15121a'); } });
  spr.ash = set3(16, 8, (P, r) => { for (let i = 0; i < 22; i++) { const x = 2 + r() * 12, y = 1 + r() * 6; if (Math.hypot(x - 8, (y - 4) * 2) < 7) P.px(x, y, ['#2a2628', '#3a3638', '#1c1a1c', '#58504a'][Math.floor(r() * 4)]); } P.px(8, 4, '#c8602a'); });
  spr.stub = [1, 2, 3].map((s) => { const P = S.painter(8, 10), r = rnd(s * 3 + 1); P.ell(4, 8, 3, 1, '#c8bea4'); P.rect(3, 5 - (s % 2), 3, 3 + (s % 2), '#e0d6bc'); P.px(4, 4 - (s % 2), '#2a2420'); P.px(4, 3 - (s % 2), '#ffcf70'); return fin(P, 4, 9); });
  spr.grassLong = [1, 2, 3].map((s) => { const P = S.painter(14, 14), r = rnd(s * 7); for (let i = 0; i < 10; i++) { const x = 1 + Math.floor(r() * 12), h = 6 + Math.floor(r() * 7); P.line(x, 13, x + (r() < 0.5 ? -2 : 2), 13 - h, i % 3 ? '#3c5a34' : '#58783f'); } return fin(P, 7, 13); });

  /* ---- placement ---- */
  const G = ID.GRASS, D = ID.DIRT, C = ID.COBBLE, M = ID.MOSS, MU = ID.MUD, LE = ID.LEAVES, BO = ID.BONES, CR = ID.CRYPT, FL = ID.FLAG;
  const PLAN = {
    hamlet: [['pebbles', 70, [G, D, M, C]], ['leaves', 46, [G, D, M]], ['twigs', 28, [G, M]], ['flower', 34, [G, M]], ['grassLong', 24, [G, M]], ['puddle', 8, [D, G, C], 1], ['mosspatch', 16, [C, FL]], ['crack', 16, [C, FL]], ['ash', 5, [D, C]], ['stub', 8, [C, FL]], ['shroom', 10, [M, G]]],
    thornwood: [['pebbles', 60, [G, M, LE, D]], ['leaves', 70, [G, M, LE, D]], ['twigs', 44, [G, M, LE]], ['flower', 26, [G, M]], ['grassLong', 36, [G, M, LE]], ['puddle', 12, [MU, M, D], 1], ['mosspatch', 10, [M]], ['shroom', 22, [M, LE, MU]]],
    catacombs: [['pebbles', 70, [CR, FL, C, BO]], ['crack', 36, [CR, FL, C]], ['puddle', 12, [CR, FL], 1], ['mosspatch', 14, [CR, FL]], ['ash', 8, [CR]], ['stub', 14, [CR, FL]], ['twigs', 10, [CR]]]
  };
  function apply(b, plan) {
    for (const [kind, n, only, flat] of plan) {
      if (!spr[kind]) continue;
      const sway = kind === 'flower' || kind === 'grassLong' ? 2 : 0;
      b.deco(2, 2, b.w - 4, b.h - 4, n * 2, kind, only, { flat: kind !== 'flower' && kind !== 'grassLong' && kind !== 'shroom' && kind !== 'stub', sway });
    }
    return b;
  }
  ['hamlet', 'thornwood', 'catacombs'].forEach((id) => {
    const orig = AH.Maps[id]; if (!orig) return;
    AH.Maps[id] = function () { const b = orig.apply(this, arguments); try { apply(b, PLAN[id]); } catch (e) { console.error('clutter', e); } return b; };
  });
  AH.Clutter = { apply, PLAN };
})();

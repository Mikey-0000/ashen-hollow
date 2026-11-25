/* Ashen Hollow - 16x16 icon plates for spells, items and skills, painted procedurally from motifs. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, S = AH.Sprites;
  const Ic = (AH.Icons = { cache: {} });
  const SCHOOL = {
    necro: ['#7fe0c0', '#c8fff0', '#2a8a70'], druid: ['#8fd06a', '#d0ffa8', '#3a7a2a'], blood: ['#c23a45', '#ff8a90', '#6a1420'],
    astral: ['#7fa6ff', '#d0e0ff', '#3a56a8'], witch: ['#c27be0', '#ecc8ff', '#6a3a8a'], neutral: ['#c8bfa8', '#f0e8d0', '#7a7260'], gold: ['#e8c670', '#fff0b0', '#8a6a22'],
    steel: ['#a8aebb', '#e0e4ee', '#5a606c'], wood: ['#a07a50', '#d0a874', '#5a4228'], red: ['#c23a45', '#ff8a90', '#6a1420'],
  };
  const M = {
    flame(P, c) { P.ell(8, 10, 4, 4, c[2]); P.limb(8, 14, 8, 3, 7, 1, c[0]); P.limb(6, 12, 5, 6, 3, 1, c[0]); P.limb(11, 12, 12, 7, 3, 1, c[0]); P.ell(8, 11, 2, 3, c[1]); P.px(8, 8, '#fff'); },
    snow(P, c) { for (let i = 0; i < 3; i++) { const a = (i / 3) * 3.1416; P.line(8 - Math.cos(a) * 6, 8 - Math.sin(a) * 6, 8 + Math.cos(a) * 6, 8 + Math.sin(a) * 6, c[0]); } [[8, 2], [8, 14], [2, 5], [14, 11], [14, 5], [2, 11]].forEach((p, i) => P.px(p[0], p[1], c[1])); P.disc(8, 8, 1, '#fff'); },
    chain(P, c) { P.line(2, 12, 6, 6, c[0], 2); P.line(6, 6, 10, 10, c[0], 2); P.line(10, 10, 14, 3, c[0], 2); P.px(2, 12, c[1]); P.px(14, 3, c[1]); P.disc(6, 6, 1, c[1]); P.disc(10, 10, 1, c[1]); },
    needles(P, c) { [[3, 12, 12, 3], [5, 13, 13, 6], [2, 9, 9, 2]].forEach((l, i) => { P.line(l[0], l[1], l[2], l[3], c[i % 2 ? 0 : 2]); P.px(l[2], l[3], c[1]); }); },
    comet(P, c) { P.limb(2, 3, 10, 11, 1, 4, c[2]); P.limb(4, 2, 11, 9, 1, 3, c[0]); P.disc(11, 11, 3, c[0]); P.disc(11, 11, 1, c[1]); P.px(10, 10, '#fff'); },
    cleaver(P, c) { P.rect(3, 3, 8, 7, c[0]); P.rect(3, 3, 8, 1, c[1]); P.rect(10, 4, 2, 5, c[2]); P.line(7, 10, 12, 14, '#6a4a30', 2); P.px(4, 4, '#fff'); },
    skull(P, c) { P.disc(8, 7, 4, c[0]); P.rect(6, 10, 5, 3, c[0]); P.rect(5, 6, 2, 2, c[2]); P.rect(9, 6, 2, 2, c[2]); P.px(8, 9, c[2]); P.px(7, 12, c[2]); P.px(9, 12, c[2]); P.px(6, 4, c[1]); P.px(7, 4, c[1]); },
    lance(P, c) { P.line(3, 12, 12, 3, c[2], 2); P.line(4, 11, 12, 3, c[0]); P.line(10, 5, 13, 2, c[1], 2); P.px(13, 2, '#fff'); P.line(3, 9, 5, 11, c[0]); },
    ward(P, c) { for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283; P.rect(Math.round(8 + Math.cos(a) * 4.5) - 1, Math.round(8 + Math.sin(a) * 4.5) - 1, 3, 2, i % 2 ? c[0] : c[1]); } P.disc(8, 8, 1, c[2]); },
    thrall(P, c) { P.disc(8, 5, 2, c[0]); P.rect(6, 7, 5, 5, c[0]); P.limb(6, 8, 3, 12, 2, 1, c[0]); P.limb(10, 8, 13, 12, 2, 1, c[0]); P.px(7, 5, c[2]); P.px(9, 5, c[2]); P.rect(6, 12, 2, 2, c[2]); P.rect(9, 12, 2, 2, c[2]); },
    choir(P, c) { [[4, 6], [8, 4], [12, 6]].forEach((p) => { P.disc(p[0], p[1], 2, c[0]); P.px(p[0] - 1, p[1], c[2]); P.px(p[0] + 1, p[1], c[2]); P.rect(p[0] - 1, p[1] + 3, 3, 4, c[1]); }); P.line(2, 13, 14, 13, c[2]); },
    thorn(P, c) { [[4, 12], [8, 12], [12, 12]].forEach((p, i) => { P.limb(p[0], p[1], p[0] + (i - 1) * 2, 3 + i % 2 * 2, 3, 1, c[0]); P.px(p[0] + (i - 1) * 2, 3 + i % 2 * 2, c[1]); }); P.line(2, 13, 14, 13, c[2]); },
    cloud(P, c) { P.disc(5, 9, 3, c[0]); P.disc(9, 7, 4, c[0]); P.disc(12, 10, 3, c[0]); P.rect(5, 10, 8, 3, c[0]); P.px(7, 6, c[1]); P.px(10, 5, c[1]); P.px(4, 14, c[2]); P.px(8, 14, c[2]); P.px(12, 14, c[2]); },
    antler(P, c) { P.line(8, 14, 8, 8, c[2], 2); P.line(8, 8, 4, 3, c[0], 2); P.line(8, 8, 12, 3, c[0], 2); P.line(6, 6, 3, 6, c[0]); P.line(10, 6, 13, 6, c[0]); P.px(4, 3, c[1]); P.px(12, 3, c[1]); P.px(3, 6, c[1]); P.px(13, 6, c[1]); },
    bolt(P, c) { P.line(9, 1, 5, 8, c[0], 2); P.line(5, 8, 10, 8, c[0], 2); P.line(10, 8, 6, 15, c[0], 2); P.px(9, 1, c[1]); P.px(6, 14, c[1]); },
    drop(P, c) { P.disc(8, 10, 4, c[0]); for (let i = 0; i < 5; i++) P.rect(8 - (4 - i) * 0.5 | 0, 2 + i, Math.max(1, (i + 1) | 0), 1, c[0]); P.px(6, 9, c[1]); P.px(6, 10, c[1]); P.px(10, 12, c[2]); },
    chalice(P, c) { P.rect(4, 3, 8, 3, c[0]); P.rect(5, 6, 6, 2, c[0]); P.rect(7, 8, 2, 4, c[2]); P.rect(5, 12, 6, 2, c[0]); P.rect(5, 4, 6, 1, c[2]); P.px(5, 3, c[1]); },
    burst(P, c) { for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283; P.line(8 + Math.cos(a) * 2, 8 + Math.sin(a) * 2, 8 + Math.cos(a) * 6, 8 + Math.sin(a) * 6, i % 2 ? c[0] : c[1]); } P.disc(8, 8, 2, c[1]); },
    step(P, c) { P.limb(3, 12, 11, 4, 3, 1, c[0]); P.line(9, 3, 13, 3, c[1]); P.line(13, 3, 13, 7, c[1]); [[3, 8], [5, 10]].forEach((p) => P.px(p[0], p[1], c[2])); P.px(2, 6, c[2]); },
    star(P, c) { P.line(8, 1, 8, 15, c[0]); P.line(1, 8, 15, 8, c[0]); P.line(4, 4, 12, 12, c[2]); P.line(12, 4, 4, 12, c[2]); P.disc(8, 8, 2, c[1]); },
    spiral(P, c) { for (let t = 0; t < 40; t++) { const a = t * 0.38, r = 0.5 + t * 0.15; P.px(Math.round(8 + Math.cos(a) * r), Math.round(8 + Math.sin(a) * r), t > 28 ? c[1] : c[0]); } P.px(8, 8, '#fff'); },
    eye(P, c) { P.ell(8, 8, 6, 3, [c[0], c[0], c[2]], 3, 0); P.disc(8, 8, 2, c[2]); P.px(8, 8, c[1]); P.px(7, 7, c[1]); },
    salt(P, c) { for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.283; P.px(Math.round(8 + Math.cos(a) * 5.5), Math.round(8 + Math.sin(a) * 5.5), i % 2 ? c[0] : c[1]); } P.disc(8, 8, 1, c[2]); },
    crow(P, c) { P.ell(7, 9, 4, 3, [c[0], c[0], c[2]], 3, 0); P.disc(11, 6, 2, c[0]); P.px(13, 6, c[1]); P.px(14, 6, c[1]); P.line(4, 7, 2, 4, c[0], 2); P.px(11, 5, '#fff'); P.px(6, 12, c[2]); P.px(8, 12, c[2]); },
    hex(P, c) { M.eye(P, c); P.line(3, 3, 13, 13, c[2]); P.line(13, 3, 3, 13, c[2]); },
    sickle(P, c) { for (let t = 0; t < 14; t++) { const a = -2.4 + t * 0.2; P.px(Math.round(8 + Math.cos(a) * 5.5), Math.round(8 + Math.sin(a) * 5.5), c[1]); P.px(Math.round(8 + Math.cos(a) * 4.5), Math.round(8 + Math.sin(a) * 4.5), c[0]); } P.line(8, 8, 4, 13, '#5a4030', 2); },
    blade(P, c) { P.line(3, 13, 12, 4, c[0], 2); P.line(4, 13, 13, 4, c[1]); P.line(2, 9, 7, 14, '#8a6a30', 2); P.px(13, 3, '#fff'); P.px(3, 13, '#5a4030'); },
    staff(P, c) { P.line(4, 14, 11, 5, '#6a4a30', 2); P.disc(12, 4, 2, c[0]); P.px(11, 3, c[1]); },
    cloak(P, c) { for (let y = 2; y < 14; y++) { const w = 2 + (y - 2) * 0.45; P.rect(Math.round(8 - w), y, Math.round(w * 2), 1, y < 5 ? c[1] : c[0]); } P.rect(6, 2, 4, 2, c[2]); P.px(8, 5, '#e8c670'); },
    ring(P, c) { P.disc(8, 9, 4, c[0]); P.disc(8, 9, 2, '#14121a'); P.disc(8, 4, 2, c[1]); P.px(8, 3, '#fff'); },
    amulet(P, c) { P.line(4, 2, 8, 8, c[2]); P.line(12, 2, 8, 8, c[2]); P.disc(8, 11, 3, c[0]); P.px(7, 10, c[1]); P.px(8, 11, c[2]); },
    bottle(P, c) { P.rect(6, 2, 4, 3, '#8a7a5a'); P.rect(7, 5, 2, 2, '#c8d0d8'); P.ell(8, 10, 4, 4, [c[1], c[0], c[2]], 3, 0); P.px(6, 9, '#fff'); },
    leaf(P, c) { P.ell(8, 8, 3, 6, [c[1], c[0], c[2]], 3, 0); P.line(8, 3, 8, 14, c[2]); P.line(8, 7, 5, 5, c[2]); P.line(8, 10, 11, 8, c[2]); },
    feather(P, c) { P.limb(3, 13, 12, 3, 4, 2, c[0]); P.line(3, 13, 13, 2, c[2]); P.px(12, 4, c[1]); P.px(10, 6, c[1]); },
    pile(P, c) { for (let y = 0; y < 8; y++) P.rect(8 - y, 6 + y, 1 + y * 2, 1, y < 3 ? c[1] : y < 6 ? c[0] : c[2]); P.px(8, 5, c[1]); },
    dust(P, c) { for (let i = 0; i < 14; i++) P.px(3 + Math.floor(U.hash(i, 1, 3) * 10), 3 + Math.floor(U.hash(i, 2, 3) * 10), i % 3 ? c[0] : c[1]); },
    book(P, c) { P.rect(3, 2, 10, 12, c[2]); P.rect(3, 2, 10, 1, c[0]); P.rect(4, 3, 8, 10, c[0]); P.rect(5, 5, 6, 1, '#e8c670'); P.rect(5, 8, 5, 1, '#e8c670'); P.rect(3, 2, 1, 12, '#14121a'); P.disc(8, 11, 1, '#e8c670'); },
    key(P, c) { P.disc(5, 5, 3, c[0]); P.disc(5, 5, 1, '#14121a'); P.line(7, 7, 13, 13, c[0], 2); P.rect(11, 11, 3, 1, c[0]); P.rect(9, 9, 2, 1, c[0]); },
    scroll(P, c) { P.rect(4, 3, 8, 10, '#d8c398'); P.rect(3, 3, 1, 10, '#a38d63'); P.rect(12, 3, 1, 10, '#a38d63'); P.line(5, 5, 10, 5, '#5a4630'); P.line(5, 7, 10, 7, '#5a4630'); P.line(5, 9, 8, 9, '#5a4630'); },
    heart(P, c) { P.disc(5, 6, 3, c[0]); P.disc(11, 6, 3, c[0]); for (let i = 0; i < 6; i++) P.rect(3 + i, 8 + i, 11 - i * 2, 1, c[0]); P.px(4, 5, c[1]); P.px(5, 4, c[1]); },
    tooth(P, c) { P.rect(5, 3, 6, 5, c[0]); P.rect(5, 8, 2, 5, c[0]); P.rect(9, 8, 2, 5, c[0]); P.px(6, 4, c[1]); P.px(6, 5, c[1]); P.px(8, 10, c[2]); },
    candle(P, c) { P.rect(6, 6, 4, 8, '#d8ccb0'); Pr_flame(P, 8, 5); },
    rune(P, c) { P.line(8, 2, 8, 14, c[0], 2); P.line(4, 6, 8, 3, c[0]); P.line(12, 6, 8, 3, c[0]); P.line(4, 11, 12, 11, c[1]); },
    bell(P, c) { for (let y = 3; y < 12; y++) { const w = 2 + (y - 3) * 0.45; P.rect(Math.round(8 - w), y, Math.round(w * 2), 1, y < 7 ? c[1] : c[0]); } P.rect(2, 12, 12, 2, c[0]); P.px(8, 14, c[2]); P.rect(7, 1, 2, 2, c[2]); },
    cauldron(P, c) { P.ell(8, 10, 6, 4, [c[0], c[0], c[2]], 3, 0); P.rect(2, 7, 12, 2, c[0]); P.ell(8, 7, 5, 1, ['#7affc0', '#7affc0', '#3aa878'], 3, 0); },
    veil(P, c) { for (let y = 3; y < 14; y++) for (let x = 3; x < 13; x++) if ((x + y) % 2 === 0) P.px(x, y, c[(y > 8) ? 2 : 0]); P.px(8, 8, c[1]); },
    boot(P, c) { P.rect(5, 3, 5, 8, c[2]); P.rect(5, 10, 9, 3, c[0]); P.rect(5, 3, 5, 1, c[1]); },
    shield(P, c) { for (let y = 2; y < 14; y++) { const w = y < 9 ? 5 : 5 - (y - 8); P.rect(8 - w, y, w * 2, 1, (y < 6) ? c[1] : c[0]); } P.line(8, 3, 8, 12, c[2]); P.line(4, 6, 12, 6, c[2]); },
    coin(P, c) { P.disc(8, 8, 5, c[0]); P.disc(8, 8, 3, c[2]); P.px(6, 6, c[1]); P.px(7, 6, c[1]); },
    wing(P, c) { P.limb(3, 12, 13, 3, 4, 1, c[0]); P.limb(5, 12, 12, 6, 3, 1, c[1]); P.limb(7, 13, 12, 9, 2, 1, c[2]); },
  };
  function Pr_flame(P, x, y) { P.px(x, y, '#ffe090'); P.px(x, y - 1, '#ffb040'); P.px(x, y - 2, '#e8702a'); P.px(x - 1, y, '#e8702a'); P.px(x + 1, y, '#e8702a'); }

  /* name -> {motif, scheme}; unknown names fall back to a rune */
  Ic.make = function (motif, scheme, rarityCol) {
    const key = motif + '|' + scheme + '|' + (rarityCol || ''); if (Ic.cache[key]) return Ic.cache[key];
    const P = S.painter(16, 16), c = SCHOOL[scheme] || SCHOOL.neutral;
    P.rect(0, 0, 16, 16, '#15131b'); P.rect(0, 0, 16, 1, '#2c2a36'); P.rect(0, 0, 1, 16, '#2c2a36'); P.rect(0, 15, 16, 1, '#08070c'); P.rect(15, 0, 1, 16, '#08070c');
    for (let i = 0; i < 16; i++) { const t = U.hash(i, 3, 5); if (t > 0.8) P.px(i, 1 + Math.floor(t * 14), '#1c1a24'); }
    (M[motif] || M.rune)(P, c);
    if (rarityCol) { P.px(0, 0, rarityCol); P.px(1, 0, rarityCol); P.px(0, 1, rarityCol); P.px(15, 15, rarityCol); P.px(14, 15, rarityCol); P.px(15, 14, rarityCol); }
    return (Ic.cache[key] = P.c);
  };
  Ic.SCHOOL = SCHOOL;
  Ic.motifs = M;
  /* convenient: icon for a data entry {icon:'skull', scheme:'necro'} */
  Ic.of = (def, rarityCol) => Ic.make(def.icon, def.scheme || def.school || 'neutral', rarityCol);
  Ic.draw = (g, def, x, y, rarityCol) => g.drawImage(Ic.of(def, rarityCol), Math.round(x), Math.round(y));
  /* school sigils (24x24 engraved emblems used on tabs and the character-select cards) */
  Ic.sigil = function (school, size) {
    const key = 'sigil|' + school + '|' + (size || 24); if (Ic.cache[key]) return Ic.cache[key];
    const P = S.painter(24, 24), c = SCHOOL[school] || SCHOOL.neutral;
    P.ell(12, 12, 11, 11, ['#2a2832', '#1c1a24', '#0e0c14'], 3, 0.05); P.ell(12, 12, 9, 9, ['#12101a', '#12101a', '#0a0810'], 3, 0);
    const motif = { necro: 'skull', druid: 'antler', blood: 'drop', astral: 'star', witch: 'eye', neutral: 'rune' }[school] || 'rune';
    const Q = S.painter(16, 16); (M[motif] || M.rune)(Q, c); P.g.drawImage(Q.c, 4, 4);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; P.px(Math.round(12 + Math.cos(a) * 10.4), Math.round(12 + Math.sin(a) * 10.4), c[2]); }
    return (Ic.cache[key] = P.c);
  };
})();

/* Ashen Hollow - UI skin: aged parchment, engraved iron frames, ornaments, etched bars, selection brackets, tooltips.
   Everything is painted procedurally at the game's native 480x270 so it shares the pixel grid of the world. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, S = AH.Sprites, W = AH.W, H = AH.H;
  const UI = (AH.UI = { screens: {} });
  const C = (UI.C = { ink: '#e6dcc4', dim: '#9a8e74', gold: '#e8c670', dgold: '#a88a44', red: '#c8404c', iron: '#3a3a46', ironHi: '#6a6a7a', ironLo: '#16151c', bg: '#0b0910', parch: '#2a2119', parchHi: '#3a2f22' });

  /* tileable aged-parchment texture (dark vellum with fibres and stains) */
  const tex = (function () {
    const n = 96, c = U.makeCanvas(n, n), g = c.getContext('2d'), id = g.createImageData(n, n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const v = U.noise(x * 0.06, y * 0.06, 3) * 0.5 + U.noise(x * 0.25, y * 0.25, 7) * 0.3 + U.hash(x, y, 11) * 0.2, st = Math.pow(U.noise(x * 0.03, y * 0.03, 21), 2.2);
      const i = (y * n + x) * 4, base = [38, 30, 22], k = (v - 0.5) * 22 + st * -14 + ((x * 7 + y * 3) % 17 === 0 ? 5 : 0);
      id.data[i] = base[0] + k; id.data[i + 1] = base[1] + k * 0.85; id.data[i + 2] = base[2] + k * 0.65; id.data[i + 3] = 255;
    }
    g.putImageData(id, 0, 0); return c;
  })();
  UI.tex = tex;
  const CORNER = ['.........', '.gg.gg...', 'gDDgDDg..', 'gD.DD.Dg.', '.gDDDDDg.', '.gD.Dg...', '..gDg....', '..g.g....', '.........'];
  const corner = S.make(CORNER, { g: '#e8c670', D: '#8a6a30', '.': null }, { outline: null, ax: 0, ay: 0 });
  let cornerImg = null;

  UI.panel = function (g, x, y, w, h, o) {
    o = o || {}; x = Math.round(x); y = Math.round(y);
    g.fillStyle = '#05040a'; g.fillRect(x - 2, y - 2, w + 4, h + 4);
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); const pat = g.createPattern(tex, 'repeat'); g.fillStyle = pat; g.fillRect(x, y, w, h);
    /* darkened edges (burnt vellum) */
    const gr = g.createLinearGradient(x, 0, x + 14, 0); gr.addColorStop(0, 'rgba(0,0,0,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x, y, 14, h);
    const gr2 = g.createLinearGradient(x + w, 0, x + w - 14, 0); gr2.addColorStop(0, 'rgba(0,0,0,0.5)'); gr2.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr2; g.fillRect(x + w - 14, y, 14, h);
    const gr3 = g.createLinearGradient(0, y, 0, y + 12); gr3.addColorStop(0, 'rgba(0,0,0,0.5)'); gr3.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr3; g.fillRect(x, y, w, 12);
    const gr4 = g.createLinearGradient(0, y + h, 0, y + h - 12); gr4.addColorStop(0, 'rgba(0,0,0,0.5)'); gr4.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr4; g.fillRect(x, y + h - 12, w, 12);
    g.restore();
    /* iron frame: three bands */
    g.fillStyle = C.ironLo; g.fillRect(x - 2, y - 2, w + 4, 2); g.fillRect(x - 2, y + h, w + 4, 2); g.fillRect(x - 2, y, 2, h); g.fillRect(x + w, y, 2, h);
    g.fillStyle = C.iron; g.fillRect(x - 1, y - 1, w + 2, 1); g.fillRect(x - 1, y + h, w + 2, 1); g.fillRect(x - 1, y, 1, h); g.fillRect(x + w, y, 1, h);
    g.fillStyle = C.ironHi; g.fillRect(x - 1, y - 1, w + 1, 1); g.fillRect(x - 1, y - 1, 1, h + 1);
    g.fillStyle = C.dgold; g.fillRect(x + 2, y + 2, w - 4, 1); g.fillRect(x + 2, y + h - 3, w - 4, 1); g.fillRect(x + 2, y + 2, 1, h - 4); g.fillRect(x + w - 3, y + 2, 1, h - 4);
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x + 3, y + 3, w - 6, 1); g.fillRect(x + 3, y + 3, 1, h - 6);
    /* corners & rivets */
    [[x, y, false, false], [x + w, y, true, false], [x, y + h, false, true], [x + w, y + h, true, true]].forEach((c) => { g.save(); g.translate(c[0], c[1]); g.scale(c[2] ? -1 : 1, c[3] ? -1 : 1); g.drawImage(corner.c, -3, -3); g.restore(); });
    [[x + w / 2, y - 1], [x + w / 2, y + h]].forEach((r) => { g.fillStyle = C.ironLo; g.fillRect(Math.round(r[0]) - 2, r[1] - 1, 5, 3); g.fillStyle = C.gold; g.fillRect(Math.round(r[0]) - 1, r[1], 3, 1); });
    if (o.title) {
      const tw = AH.Font.width(o.title) + 18, tx = Math.round(x + w / 2 - tw / 2);
      g.fillStyle = '#05040a'; g.fillRect(tx - 2, y - 8, tw + 4, 12); g.fillStyle = C.iron; g.fillRect(tx - 1, y - 7, tw + 2, 10); g.fillStyle = '#17151d'; g.fillRect(tx, y - 6, tw, 8); g.fillStyle = C.dgold; g.fillRect(tx, y - 6, tw, 1);
      g.fillStyle = C.gold; g.fillRect(tx + 3, y - 3, 2, 2); g.fillRect(tx + tw - 5, y - 3, 2, 2);
      AH.Font.draw(g, o.title, x + w / 2, y - 5, C.gold, { align: 'center', outline: '#05040a' });
    }
  };
  UI.sub = function (g, x, y, w, h, fill) { g.fillStyle = fill || 'rgba(8,6,12,0.55)'; g.fillRect(x, y, w, h); g.fillStyle = '#6a5a34'; g.fillRect(x, y, w, 1); g.fillRect(x, y + h - 1, w, 1); g.fillRect(x, y, 1, h); g.fillRect(x + w - 1, y, 1, h); g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x + 1, y + 1, w - 2, 1); };
  UI.divider = function (g, x, y, w) { g.fillStyle = '#6a5a34'; g.fillRect(x, y, w, 1); g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x, y + 1, w, 1); g.fillStyle = C.gold; g.fillRect(x + (w >> 1) - 2, y - 1, 5, 3); g.fillStyle = '#17151d'; g.fillRect(x + (w >> 1) - 1, y, 3, 1); };
  /* animated selection brackets with a soft pulse */
  UI.select = function (g, x, y, w, h, time, col) {
    const p = Math.sin(time * 6) * 0.5 + 0.5, o = Math.round(p * 1.5); col = col || C.gold; g.fillStyle = col; g.globalAlpha = 0.14 + p * 0.1; g.fillRect(x, y, w, h); g.globalAlpha = 1;
    [[x - o, y - o, 1, 1], [x + w + o, y - o, -1, 1], [x - o, y + h + o, 1, -1], [x + w + o, y + h + o, -1, -1]].forEach((c) => { g.fillRect(c[2] > 0 ? c[0] : c[0] - 3, c[1] - (c[3] < 0 ? 0 : 0), 4, 1); g.fillRect(c[0] - (c[2] < 0 ? 0 : 0), c[3] > 0 ? c[1] : c[1] - 3, 1, 4); });
  };
  UI.bar = function (g, x, y, w, h, k, c1, c2, back, time) {
    g.fillStyle = '#05040a'; g.fillRect(x - 1, y - 1, w + 2, h + 2); g.fillStyle = back || '#2a0f14'; g.fillRect(x, y, w, h); const fw = Math.round(w * U.clamp(k, 0, 1));
    if (fw > 0) { g.fillStyle = c1; g.fillRect(x, y, fw, h); g.fillStyle = c2; g.fillRect(x, y, fw, 1); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, y + h - 1, fw, 1); }
    g.fillStyle = C.iron; g.fillRect(x - 1, y - 1, w + 2, 1); g.fillRect(x - 1, y + h, w + 2, 1); g.fillRect(x - 1, y, 1, h); g.fillRect(x + w, y, 1, h); g.fillStyle = C.dgold; g.fillRect(x - 1, y - 1, 1, 1); g.fillRect(x + w, y - 1, 1, 1); g.fillRect(x - 1, y + h, 1, 1); g.fillRect(x + w, y + h, 1, 1);
  };
  UI.tooltip = function (g, x, y, lines, title, tcol) {
    const ls = []; lines.forEach((l) => AH.Font.wrap(l, 150).forEach((s) => ls.push(s))); let wd = AH.Font.width(title || '') + 6; ls.forEach((l) => (wd = Math.max(wd, AH.Font.width(l))));
    const w = wd + 10, h = ls.length * 9 + (title ? 14 : 6); x = U.clamp(x, 2, W - w - 2); y = U.clamp(y, 2, H - h - 2);
    g.fillStyle = 'rgba(8,6,12,0.95)'; g.fillRect(x, y, w, h); g.fillStyle = C.dgold; g.fillRect(x, y, w, 1); g.fillRect(x, y + h - 1, w, 1); g.fillRect(x, y, 1, h); g.fillRect(x + w - 1, y, 1, h);
    let yy = y + 4; if (title) { AH.Font.draw(g, title, x + 5, yy, tcol || C.gold); yy += 11; } ls.forEach((l) => { AH.Font.draw(g, l, x + 5, yy, C.ink); yy += 9; });
  };
  UI.text = function (g, t, x, y, col, o) { AH.Font.draw(g, t, x, y, col || C.ink, o); };
  UI.drawCap = function (g, ch, x, y, size) { /* illuminated capital: gold lettering on an ornate square */
    const t = AH.Font.big(ch, size || 3, '#f6e0a0', '#b88a30', '#2a1a08'); g.fillStyle = '#1a1208'; g.fillRect(x, y, 22, 22); g.fillStyle = C.dgold; g.fillRect(x, y, 22, 1); g.fillRect(x, y + 21, 22, 1); g.fillRect(x, y, 1, 22); g.fillRect(x + 21, y, 1, 22); g.fillStyle = '#6a2a2a'; g.fillRect(x + 2, y + 2, 18, 18); g.fillStyle = '#2a0f14'; g.fillRect(x + 3, y + 3, 16, 16);
    g.drawImage(t, x + 11 - (t.width >> 1), y + 11 - (t.height >> 1)); [[x + 1, y + 1], [x + 19, y + 1], [x + 1, y + 19], [x + 19, y + 19]].forEach((c) => { g.fillStyle = C.gold; g.fillRect(c[0], c[1], 2, 2); });
  };
  /* generic vertical menu list; returns nothing, caller handles input via UI.nav */
  UI.menu = function (g, items, sel, x, y, w, time, o) {
    o = o || {}; const lh = o.lh || 14;
    items.forEach((it, i) => {
      const yy = y + i * lh, on = i === sel, dis = it.disabled;
      if (on) UI.select(g, x - 2, yy - 2, w + 4, lh - 2, time);
      AH.Font.draw(g, it.label, o.align === 'center' ? x + w / 2 : x + 6, yy + 1, dis ? '#5a5448' : on ? '#fff0c0' : C.ink, { align: o.align, outline: on ? '#2a1a08' : null });
      if (it.value !== undefined) AH.Font.draw(g, String(it.value), x + w - 4, yy + 1, on ? C.gold : C.dim, { align: 'right' });
    });
  };
  UI.nav = function (n, sel, vert) {
    const I = AH.Input; let d = 0; if (I.repeat(vert === false ? 'left' : 'up')) d = -1; if (I.repeat(vert === false ? 'right' : 'down')) d = 1;
    if (d) { AH.Audio.sfx('ui_move'); return (sel + d + n) % n; } return sel;
  };
})();

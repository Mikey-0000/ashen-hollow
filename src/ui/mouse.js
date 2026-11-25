/* Ashen Hollow - mouse for every menu. Draw code registers clickable rectangles (UI.hotr); this file turns hover into
   selection and click into Enter. Right-click = back, wheel = up/down. Play controls (aim / attack / cast) are unchanged. */
(function () {
  'use strict';
  const AH = window.AH, UI = AH.UI, I = AH.Input, SC = UI.screens, U = AH.U;
  let hot = {}, moved = false;
  UI.hotBegin = () => { hot = {}; };
  UI.hotr = (grp, i, x, y, w, h) => { (hot[grp] || (hot[grp] = {}))[i] = [x, y, w, h]; };
  const inside = (r, m) => m.x >= r[0] && m.x < r[0] + r[2] && m.y >= r[1] && m.y < r[1] + r[3];
  UI.hots = () => hot;
  UI.hit = (grp) => { const a = hot[grp]; if (!a) return -1; for (const k in a) if (inside(a[k], I.mouse)) return +k; return -1; };
  const menuCtx = () => AH.G && (AH.G.mode !== 'play' || AH.G.screen);
  const tap = (a) => { I.simulate(a, true); I.simulate(a, false); };
  window.addEventListener('mousemove', () => { moved = true; });
  window.addEventListener('mousedown', (e) => { if (e.button === 2 && menuCtx()) tap('back'); });
  window.addEventListener('wheel', (e) => { if (menuCtx() && Math.abs(e.deltaY) > 1) tap(e.deltaY > 0 ? 'down' : 'up'); }, { passive: true });
  const endFrame = I.endFrame; I.endFrame = function () { moved = false; endFrame.apply(this, arguments); };

  /* generic lists: UI.nav(n, ...) takes the hovered row; a click also confirms */
  const nav0 = UI.nav;
  UI.nav = function (n, sel, vert) {
    let r = nav0(n, sel, vert); const h = UI.hit('n' + n);
    if (h >= 0 && I.mouseActive()) { if (moved && h !== r) { r = h; AH.Audio.sfx('ui_move'); } if (I.mouse.pressed) { r = h; tap('confirm'); } }
    return r;
  };

  /* the Book */
  const B = SC.book;
  const bookUpdate = B.update;
  B.update = function (dt, Gm) {
    if (Gm.screen === 'book' && I.mouseActive()) {
      const m = I.mouse, t = UI.hit('tab');
      if (I.mouse.pressed && t >= 0 && t !== B.tab) { B.tab = t; B.sel = 0; B.sel2 = 0; AH.Audio.sfx('page'); I.mouse.pressed = false; }
      else {
        const grp = B.tab === 0 ? 'inv' : B.tab === 1 ? 'spl' : null;
        if (grp) { const h = UI.hit(grp); if (h >= 0) { if (moved && h !== B.sel) { B.sel = h; AH.Audio.sfx('ui_move'); } if (m.pressed) { B.sel = h; tap('confirm'); } } }
        else if (B.tab === 2) { const h = UI.hit('sk'); if (h >= 0 && m.pressed) { const bi = Math.floor(h / 100), ni = h % 100; if (bi === B.sel && ni === B.sel2) tap('confirm'); else { B.sel = bi; B.sel2 = ni; AH.Audio.sfx('ui_move'); } } }
      }
    }
    return bookUpdate.call(this, dt, Gm);
  };

  /* settings: click a slider to set it; click a toggle/option to flip it */
  const st = SC.settings, stUpdate = st.update;
  st.update = function (dt, Gm) {
    const rows = this.rows(), h = UI.hit('n' + rows.length);
    if (h >= 0 && I.mouseActive() && I.mouse.pressed && rows[h].type === 'bar') {
      const r = rows[h], m = I.mouse;
      if (m.x >= 256 && m.x <= 350) { Gm.settings[r.k] = U.clamp(Math.round(((m.x - 258) / 90) * 10) / 10, 0, 1); Gm.applySettings(); AH.Audio.sfx('ui_move'); this.sel = h; I.mouse.pressed = false; return; }
    }
    return stUpdate.call(this, dt, Gm);
  };
})();

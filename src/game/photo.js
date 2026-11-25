/* Ashen Hollow - Photo mode (F8): freezes the world, hides the HUD, arrows/WASD pan the camera, Enter saves a PNG, Esc/F8 returns. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, Sc = AH.UI && AH.UI.screens;
  if (!Sc) return;
  const P = Sc.photo = {
    t: 0, shot: 0, flash: 0, hold: 0,
    open(G) { if (G.mode !== 'play' || G.screen || !G.world || (G.player && G.player.dead)) return; G.screen = 'photo'; this.t = 0; this.shot = 0; this.flash = 0; this.saved = ''; this.c0 = { x: G.world.cam.x, y: G.world.cam.y }; AH.Audio.sfx('ui_ok'); },
    close(G) { G.screen = null; AH.Audio.sfx('ui_back'); },
    update(dt, G) {
      const I = AH.Input, w = G.world, c = w.cam, d = dt, sp = 110 * d * (I.held('dodge') ? 2.2 : 1);
      this.t += d; if (this.flash > 0) this.flash -= d * 3;
      let dx = 0, dy = 0; if (I.held('left')) dx--; if (I.held('right')) dx++; if (I.held('up')) dy--; if (I.held('down')) dy++;
      const defw = w.def.w * AH.T, defh = w.def.h * AH.T; c.x = U.clamp(c.x + dx * sp, 0, Math.max(0, defw - AH.W)); c.y = U.clamp(c.y + dy * sp, 0, Math.max(0, defh - AH.H)); c.shake = 0;
      if (this.shot > 0) { this.shot--; if (this.shot === 0) { this.doCap = true; this.capture(G); } }
      else if (!this.doCap && I.pressed('confirm')) { this.shot = 3; AH.Audio.sfx('ui_ok'); }
      if (this.t > 0.2 && (I.pressed('back') || I.pressed('photo') || I.pressed('pause'))) this.close(G);
    },
    capture(G) {
      const cv = document.getElementById('screen'), done = () => { this.doCap = false; this.flash = 1; };
      setTimeout(() => { try { if (!cv) return done(); cv.toBlob((b) => { done(); if (!b) return; const a = document.createElement('a'), n = 'ashen-hollow-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.png'; a.href = URL.createObjectURL(b); a.download = n; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); this.saved = n; this.t = 0; }); } catch (e) { done(); } }, 0);
    },
    draw(g, G) {
      if (this.shot > 0 || this.doCap) return;                          /* clean frame while capturing */
      if (this.flash > 0) { g.fillStyle = 'rgba(255,255,255,' + Math.min(0.8, this.flash) + ')'; g.fillRect(0, 0, AH.W, AH.H); return; }
      const F = AH.Font, a = this.saved ? Math.max(0, 1 - Math.max(0, this.t - 2) / 1) : Math.max(0, 1 - Math.max(0, this.t - 5) / 1.5);
      if (a <= 0) return; g.globalAlpha = a;
      const txt = this.saved ? 'Saved ' + this.saved + ' (Downloads)' : 'PHOTO MODE   Move: pan   Enter: save PNG   Esc: back';
      const w = F.width(txt); g.fillStyle = 'rgba(8,6,12,.7)'; g.fillRect(Math.round(AH.W / 2 - w / 2) - 6, AH.H - 20, w + 12, 13);
      F.draw(g, txt, Math.round(AH.W / 2 - w / 2), AH.H - 17, '#e6dcc4', { outline: '#05040a' }); g.globalAlpha = 1;
    },
  };
  document.addEventListener('keydown', (e) => { if (e.code === 'F8') { e.preventDefault(); const G = AH.G; if (!G) return; if (G.screen !== 'photo') P.open(G); } });
})();

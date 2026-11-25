/* Ashen Hollow - bootstrap and main loop: fixed 60Hz step, hit-stop, slow motion, fades, screen routing. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, G = AH.G, Input = AH.Input, W = AH.W, H = AH.H, SC = AH.UI.screens;
  const canvas = document.getElementById('screen'), buf = U.makeCanvas(W, H), g = buf.getContext('2d'); g.imageSmoothingEnabled = false; AH.Present.init(canvas); AH.Present.size(W, H);
  let scale = 2, offX = 0, offY = 0;
  AH.resize = function () { const stage = document.getElementById('stage'); const iw = stage ? stage.clientWidth : window.innerWidth, ih = stage ? stage.clientHeight : window.innerHeight; let s = Math.min(iw / W, ih / H); if (G.settings.scale === 'integer') s = Math.max(1, Math.floor(s)); const cw = Math.floor(W * s), ch = Math.floor(H * s); canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px'; AH.Present.size(cw, ch); canvas.style.left = Math.floor((iw - cw) / 2) + 'px'; canvas.style.top = Math.floor((ih - ch) / 2) + 'px'; scale = s; };
  window.addEventListener('resize', AH.resize);
  Input.setScaler((cx, cy) => { const r = canvas.getBoundingClientRect(); return { x: (cx - r.left) / r.width * W, y: (cy - r.top) / r.height * H }; });

  /* sound aliases: gameplay asks for names the synth shares under another recipe */
  const aliasMap = { learn: 'levelup', page: 'ui_move', equip: 'ui_ok', drink: 'chime', rustle: 'whisper', blood: 'hit_flesh', rest: 'save' };
  const rawSfx = AH.Audio.sfx; AH.Audio.sfx = function (n, o) { return rawSfx(aliasMap[n] || n, o); };
  let audioStarted = false;
  function startAudio() { if (audioStarted) return; audioStarted = true; AH.Audio.init(); G.applySettings(); AH.Audio.music(G.mode === 'title' ? 'title' : G.world ? G.world.def.music : 'title'); }
  ['keydown', 'mousedown', 'touchstart'].forEach((e) => window.addEventListener(e, startAudio, { once: false }));

  window.addEventListener('keydown', (e) => { if (e.code === 'F2') { e.preventDefault(); const o = ['smooth', 'soft', 'crisp']; G.settings.display = o[(o.indexOf(G.settings.display) + 1) % 3]; try { G.saveSettings(); } catch (er) {} if (G.toast && G.mode === 'play') G.toast('Picture: ' + G.settings.display + '  (F2)', '#9ab8ff'); } });
  G.loadSettings(); AH.resize();
  G.mode = 'title';
  let last = performance.now(), acc = 0, realT = 0;

  function stepFade(dt) { const f = G.fade; if (f.dir === 1) { f.a += dt * 2.6; if (f.a >= 1) { f.a = 1; const cb = f.cb; f.cb = null; f.dir = -1; if (cb) cb(); } } else if (f.dir === -1) { f.a -= dt * 2.6; if (f.a <= 0) { f.a = 0; f.dir = 0; } } }

  function update(dt, real) {
    if (AH.htmlPause) { Input.endFrame(); return; }
    Input.pollPad(); G.toasts.forEach((t) => (t.t += dt)); G.toasts = G.toasts.filter((t) => t.t < 4.2);
    stepFade(real);
    if (G.mode === 'title') { SC.title.update(real, G); if (G.screen === 'settings') SC.settings.update(real, G); }
    else if (G.mode === 'charsel') SC.charsel.update(real, G);
    else if (G.mode === 'epilogue') SC.epilogue.update(real, G);
    else if (G.mode === 'play') {
      const w = G.world, p = G.player;
      if (G.screen) {
        if (SC[G.screen]) SC[G.screen].update(real, G); if (G.screen === 'dead' || G.screen === 'dialogue' || G.screen === 'read') { /* world keeps breathing, slowly */ }
        AH.Particles.update(real * 0.0);
      } else {
        if (G.hitstop > 0) { G.hitstop -= real; }
        else {
          let ts = 1; if (G.slowmo > 0) { G.slowmo -= real; ts = 0.35; } const d = dt * ts;
          w.update(d); G.tickClock(d); AH.Weather.update(d, G); if (AH.VFX) AH.VFX.update(d); AH.Particles.update(d);
          AH.Audio.listener.x = p.x; AH.Audio.listener.y = p.y; AH.Audio.ambience({ wind: AH.Weather.wind * 0.6 + (w.def.indoor ? 0 : 0.2), rain: w.def.indoor ? 0 : AH.Weather.rainK, crypt: w.def.indoor ? 1 : 0, night: G.isNight() && !w.def.indoor ? 1 : 0 });
          if (G.bossIntroT > 0) G.bossIntroT -= real;
          /* player buffs ticking into HUD are handled by Player */
          if (!p.dead && G.fade.dir === 0) {
            if (Input.pressed('pause')) { G.screen = 'pause'; SC.pause.sel = 0; SC.pause.sub = null; AH.Audio.sfx('ui_ok'); }
            ['inventory', 'spells', 'skills', 'map', 'codex'].forEach((k, i) => { if (Input.pressed(k)) AH.UI.openBook(i); });
          }
          if (G.clock - (G.lastAuto || 0) > 180 && !p.dead) { G.lastAuto = G.clock; G.save(0, true); }
        }
      }
    }
    AH.Audio.tick(real); Input.endFrame();
  }

  /* gothic pointer: an aiming sigil in play, a small barbed arrow in menus. Only while the mouse is the active device. */
  function drawCursor() {
    if (!Input.mouseActive()) return;
    const m = Input.mouse, x = Math.round(m.x), y = Math.round(m.y), t = performance.now() / 1000, play = G.mode === 'play' && !G.screen;
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    g.save();
    if (play) {
      const r = 5 + Math.round(Math.sin(t * 4) * 0.6);
      const pts = [[0, -r], [0, r], [-r, 0], [r, 0]];
      g.fillStyle = '#05040a'; pts.forEach((q) => g.fillRect(x + q[0] - 1, y + q[1] - 1, 3, 3));
      g.fillStyle = '#e8c870'; pts.forEach((q) => g.fillRect(x + q[0], y + q[1], 1, 1));
      g.fillStyle = '#c9a45c'; [[-2, -2], [2, -2], [-2, 2], [2, 2]].forEach((q) => g.fillRect(x + q[0], y + q[1], 1, 1));
      g.fillStyle = '#ff9a3c'; g.fillRect(x, y, 1, 1);
    } else {
      const A = ['X.......', 'XX......', 'XoX.....', 'XooX....', 'XoooX...', 'XooooX..', 'XoooXXX.', 'XoXoX...', 'XX.XoX..', 'X..XoX..', '....XX..'];
      A.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const c = row[i]; if (c === '.') continue; g.fillStyle = c === 'X' ? '#05040a' : '#e8c870'; g.fillRect(x + i, y + j, 1, 1); } });
    }
    g.restore();
  }
  function draw() {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H); const time = performance.now() / 1000;
    if (G.mode === 'title') { SC.title.draw(g, G, time); if (G.screen === 'settings') SC.settings.draw(g, G, time); }
    else if (G.mode === 'charsel') SC.charsel.draw(g, G, time);
    else if (G.mode === 'epilogue') SC.epilogue.draw(g, G, time);
    else if (G.mode === 'play' && G.world) {
      G.world.draw(g); if (AH.VFX) AH.VFX.post(g); AH.UI.hud(g, G, time);
      if (G.bossIntroT > 0 && G.world.boss) { const a = U.clamp(Math.min(G.bossIntroT, 3 - G.bossIntroT) * 2, 0, 1); g.globalAlpha = a; const big = AH.Font.big(G.world.boss.name.toUpperCase(), 3, '#f6e2a8', '#a87a30', '#1a0e04'); g.drawImage(big, Math.round(W / 2 - big.width / 2), 62); g.globalAlpha = 1; }
      if (G.screen && SC[G.screen]) SC[G.screen].draw(g, G, time);
    }
    if (G.fade.a > 0) { g.globalAlpha = U.clamp(G.fade.a, 0, 1); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }    drawCursor();
    AH.Present.render(buf);
  }
  function frame(now) {
    const real = Math.min(0.1, (now - last) / 1000); last = now; acc += real; let n = 0;
    while (acc >= 1 / 60 && n++ < 5) { try { update(1 / 60, 1 / 60); } catch (e) { reportError(e); } acc -= 1 / 60; }
    if (n >= 5) acc = 0;
    try { draw(); } catch (e) { reportError(e); }
    requestAnimationFrame(frame);
  }
  const errs = (AH.errors = []);
  function reportError(e) { if (errs.length < 20) errs.push(String(e && e.stack || e)); if (AH.DEBUG) console.error(e); else if (errs.length === 1) console.error(e); }
  window.addEventListener('error', (e) => { if (errs.length < 20) errs.push(String(e.message) + ' @' + e.filename + ':' + e.lineno); });
  AH.step = function (n) { for (let i = 0; i < n; i++) update(1 / 60, 1 / 60); draw(); };
  AH.drawNow = draw;
  requestAnimationFrame(frame);
})();

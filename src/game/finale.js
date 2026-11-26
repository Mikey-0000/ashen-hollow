/* Ashen Hollow - the ending sequence.
   Epilogue (what became of them) -> [The Ashen Dawn, for those who earned it] -> credits -> THE END card with the endings you have seen.
   Four endings: The Open Door (choir freed), The Held Rope (choir bound), The Broken Bell (silence), and The Ashen Dawn (peace made all round). */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, Font = AH.Font, C = AH.UI.C, SC = AH.UI.screens, W = AH.W, H = AH.H;
  if (!SC || !SC.epilogue) return;
  const g = () => AH.G;
  const ENDS = [['free', 'The Open Door', 'The choir was sung home.'], ['bind', 'The Held Rope', 'The dead follow where you walk.'], ['silence', 'The Broken Bell', 'The bell is shattered and the hush is total.'], ['dawn', 'The Ashen Dawn', 'Peace, made all round.']];
  const peace = (Gm) => { const f = Gm.flags; return [f.choir_end === 'free', f.cold_resolved === 'reconcile', !!f.aldric_forgave, !!f.ilse_done, !!f.corwin_dogs_done, !!(Gm.lore && Gm.lore.frozen_bell), !!f.arena_clear].filter(Boolean).length; };
  const which = (Gm) => (Gm.flags.choir_end !== 'bind' && peace(Gm) >= 4 ? 'dawn' : (Gm.flags.choir_end || 'free'));
  AH.Finale = { peace, which, ENDS };
  const seen = () => { try { return JSON.parse(localStorage.getItem('ah_endings') || '[]'); } catch (e) { return []; } };
  const mark = (id) => { try { const s = seen(); if (s.indexOf(id) < 0) { s.push(id); localStorage.setItem('ah_endings', JSON.stringify(s)); } } catch (e) { /* storage may be unavailable */ } };
  const DAWN = ['Morning comes to Ashen Hollow without a bell.', 'Smoke rises from nine hearths, and one of them is new.', 'The inn has taken down the laid table, and sat down at it.', 'The road south is dry. Somebody has started mending the signpost.', 'You stop, and listen, and there is only the wind.'];
  const CREDITS = [['ASHEN HOLLOW', 'big'], ['a village that remembers', 'dim'], ['', ''], ['Design and direction', 'dim'], ['Michael', ''], ['', ''], ['Engineering', 'dim'], ['Claude, by Anthropic', ''], ['', ''], ['Art, music and sound', 'dim'], ['drawn and sung entirely in code', ''], ['', ''], ['Five schools of magic', 'dim'], ['Necromancy   Druidry   Blood   Astral   Witchcraft', ''], ['', ''], ['The people of the Hollow', 'dim'], ['Marta   Vesna   Aldric   Wren   Corwin   Ilse', ''], ['', ''], ['With thanks to', 'dim'], ['everyone who listened to the bell', ''], ['and to you, for answering it, or not.', '']];
  const st = { page: 0, t: 0, tp: 0 };
  const draw0 = SC.epilogue.draw;
  const dim = (gx, a) => { gx.fillStyle = 'rgba(5,4,10,' + a + ')'; gx.fillRect(0, 0, W, H); };
  SC.epilogue.draw = function (gx, Gm, time) {
    const id = which(Gm);
    if (st.page === 0) { draw0.call(this, gx, Gm, time); if (this.t > 5) { Font.draw(gx, '[Enter] continue', W / 2, 252, '#6a6050', { align: 'center' }); } return; }
    AH.UI.drawTitleScene(gx, time); dim(gx, 0.92);
    if (st.page === 1) { /* the Ashen Dawn */
      const big = Font.big('THE ASHEN DAWN', 4, '#ffe9b0', '#d08a38', '#2a1204'); gx.globalAlpha = U.clamp(st.tp, 0, 1); gx.drawImage(big, Math.round(W / 2 - big.width / 2), 40);
      DAWN.forEach((l, i) => { gx.globalAlpha = U.clamp(st.tp - 1.2 - i * 0.9, 0, 1); Font.draw(gx, l, W / 2, 96 + i * 16, i === 4 ? '#f6e2a8' : '#d4c8a8', { align: 'center', outline: '#05040a' }); });
      gx.globalAlpha = 1; if (st.tp > 7) Font.draw(gx, '[Enter]', W / 2, 250, '#6a6050', { align: 'center' });
    } else if (st.page === 2) { /* credits */
      const y0 = H + 10 - st.tp * 20;
      CREDITS.forEach((c, i) => { const y = y0 + i * 18; if (y < -20 || y > H + 10) return; const a = U.clamp(Math.min(y / 40, (H - y) / 40), 0, 1); gx.globalAlpha = a; if (c[1] === 'big') { const b = Font.big(c[0], 3, '#f6e2a8', '#a87a30', '#1a0e04'); gx.drawImage(b, Math.round(W / 2 - b.width / 2), Math.round(y)); } else Font.draw(gx, c[0], W / 2, y, c[1] === 'dim' ? '#7a7062' : '#d4c8a8', { align: 'center', outline: '#05040a' }); });
      gx.globalAlpha = 1; Font.draw(gx, '[Enter] skip', W - 8, H - 12, '#4a4438', { align: 'right' });
    } else { /* THE END */
      const big = Font.big('THE END', 5, '#f6e2a8', '#a87a30', '#1a0e04'); gx.globalAlpha = U.clamp(st.tp, 0, 1); gx.drawImage(big, Math.round(W / 2 - big.width / 2), 18);
      const e = ENDS.find((q) => q[0] === id); Font.draw(gx, 'Ending: ' + e[1], W / 2, 66, C.gold, { align: 'center', outline: '#05040a' });
      const sn = seen(); Font.draw(gx, 'Endings found ' + sn.length + ' / ' + ENDS.length, W / 2, 80, C.dim, { align: 'center' });
      ENDS.forEach((q, i) => { const got = sn.indexOf(q[0]) >= 0, x = 70 + (i % 2) * 190, y = 98 + Math.floor(i / 2) * 26; gx.globalAlpha = U.clamp(st.tp - 0.8 - i * 0.2, 0, 1); gx.fillStyle = 'rgba(30,24,18,0.8)'; gx.fillRect(x - 4, y - 4, 180, 22); gx.strokeStyle = got ? '#a87a30' : '#3a342c'; gx.strokeRect(x - 4.5, y - 4.5, 181, 23); Font.draw(gx, got ? q[1] : '???', x + 4, y, got ? '#f6e2a8' : '#5a5448', { outline: '#05040a' }); Font.draw(gx, got ? q[2] : 'not yet found', x + 4, y + 9, got ? '#b8aa90' : '#4a4438'); });
      gx.globalAlpha = U.clamp(st.tp - 1.6, 0, 1);
      const f = Gm.flags, deeds = [['Choirmaster laid to rest', !!f.boss_done], ['Lake bell stilled', !!(Gm.lore && Gm.lore.frozen_bell)], ['Gauntlet of Ash cleared', !!f.arena_clear], ['Ninth hearth lit', f.cold_resolved === 'reconcile']];
      deeds.forEach((d, i) => Font.draw(gx, (d[1] ? '+ ' : '- ') + d[0], 70 + (i % 2) * 190, 156 + Math.floor(i / 2) * 11, d[1] ? '#9ae890' : '#4a4438'));
      Font.draw(gx, 'Level ' + Gm.level + '   Day ' + Gm.day + '   Slain ' + Gm.kills + '   Deaths ' + Gm.deaths + '   Peace ' + peace(Gm) + '/7', W / 2, 190, C.dim, { align: 'center' });
      Font.draw(gx, 'Thank you for playing.', W / 2, 208, C.gold, { align: 'center', outline: '#05040a' });
      if (st.tp > 3) Font.draw(gx, '[Enter] return to title', W / 2, 240, '#6a6050', { align: 'center' });
      gx.globalAlpha = 1;
    }
  };
  SC.epilogue.update = function (dt, Gm) {
    this.t += dt; AH.Particles.update(dt); const ok = AH.Input.pressed('confirm');
    if (st.page === 0) { if (this.t > 5 && ok) { st.page = which(Gm) === 'dawn' ? 1 : 2; st.tp = 0; AH.Audio.music('calm'); } }
    else { st.tp += dt; if (st.page === 1 && st.tp > 7 && ok) { st.page = 2; st.tp = 0; } else if (st.page === 2) { if (st.tp > CREDITS.length * 0.9 + 14 || (ok && st.tp > 1.5)) { st.page = 3; st.tp = 0; mark(which(Gm)); } } else if (st.page === 3 && st.tp > 3 && ok) { st.page = 0; st.tp = 0; this.t = 0; Gm.mode = 'title'; Gm.screen = null; AH.Audio.music('title'); } }
  };
  /* arriving at the epilogue always starts from its first page */
  const ge = g && AH.G && AH.G.goEpilogue; if (ge) { AH.G.goEpilogue = function () { st.page = 0; st.tp = 0; SC.epilogue.t = 0; return ge.apply(this, arguments); }; }
})();

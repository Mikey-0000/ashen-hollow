/* Ashen Hollow - screens: title, character select, dialogue, the Book (inventory / spellbook / skills / map / codex),
   brewing, pause, settings, saves, death and epilogue. Everything is keyboard navigable. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, UI = AH.UI, C = UI.C, W = AH.W, H = AH.H, Font = AH.Font, I = AH.Input;
  const G = () => AH.G;
  const SC = UI.screens;
  const confirm = () => I.pressed('confirm') || I.pressed('interact') && false;
  const back = () => I.pressed('back') || I.pressed('pause');

  /* ============================== TITLE ============================== */
  const title = { sel: 0, t: 0, sub: null };
  function sky(g, t) { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#07060f'); gr.addColorStop(0.55, '#1a1426'); gr.addColorStop(1, '#2a1e30'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  function ridge(g, base, amp, f, seed, col, off) { g.fillStyle = col; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 3) { const y = base + Math.sin((x + off) * f + seed) * amp + Math.sin((x + off) * f * 2.3 + seed * 2) * amp * 0.4; g.lineTo(x, Math.round(y)); } g.lineTo(W, H); g.fill(); }
  function deadTree(g, x, y, s, col) { g.fillStyle = col; g.fillRect(x, y - 40 * s, 3 * s, 40 * s); for (let i = 0; i < 5; i++) { const dir = i % 2 ? 1 : -1, by = y - (14 + i * 7) * s; for (let k = 0; k < 10 * s; k++) g.fillRect(x + dir * k + (dir > 0 ? 3 : 0), Math.round(by - k * 0.55), 2, 2); } }
  UI.drawTitleScene = function (g, t) {
    sky(g, t); for (let i = 0; i < 50; i++) { const x = (U.hash(i, 1, 2) * W) | 0, y = (U.hash(i, 3, 4) * 120) | 0, b = Math.sin(t * 1.5 + i) * 0.5 + 0.5; g.globalAlpha = 0.3 + b * 0.5; g.fillStyle = '#c8d0f0'; g.fillRect(x, y, 1, 1); } g.globalAlpha = 1;
    g.fillStyle = '#e8e4d0'; g.beginPath(); g.arc(360, 56, 17, 0, 6.3); g.fill(); g.fillStyle = '#c8c4b0'; [[354, 50, 4], [366, 62, 3], [358, 66, 2]].forEach((c) => { g.beginPath(); g.arc(c[0], c[1], c[2], 0, 6.3); g.fill(); }); g.globalAlpha = 0.12; g.fillStyle = '#e8e4d0'; g.beginPath(); g.arc(360, 56, 30, 0, 6.3); g.fill(); g.globalAlpha = 1;
    ridge(g, 150, 14, 0.012, 1, '#1a1426', t * 1.5); ridge(g, 172, 12, 0.017, 4, '#130f1c', t * 3);
    /* the ruined abbey with its bell tower */
    const ax = 150; g.fillStyle = '#0b0912'; g.fillRect(ax, 120, 60, 60); g.fillRect(ax + 62, 96, 26, 84); g.fillRect(ax + 66, 84, 18, 12); for (let i = 0; i < 4; i++) g.fillRect(ax + 66 + i * 5, 80, 3, 5); g.beginPath(); g.moveTo(ax - 4, 120); g.lineTo(ax + 30, 98); g.lineTo(ax + 64, 120); g.fill(); g.fillRect(ax + 90, 130, 30, 50); g.fillStyle = '#0b0912'; g.fillRect(ax + 120, 140, 20, 40);
    const fl = 0.7 + Math.sin(t * 7) * 0.15 + Math.sin(t * 13) * 0.1; g.fillStyle = '#e8a040'; g.globalAlpha = fl; [[ax + 12, 136, 5, 12], [ax + 36, 136, 5, 12], [ax + 71, 106, 4, 10]].forEach((w) => { g.fillRect(w[0], w[1], w[2], w[3]); }); g.globalAlpha = 0.12 * fl; g.fillRect(ax + 66, 100, 14, 22); g.globalAlpha = 1;
    /* the bell swings */
    const sw = Math.sin(t * 1.2) * 0.35; g.save(); g.translate(ax + 75, 86); g.rotate(sw); g.fillStyle = '#8a6a30'; g.fillRect(-3, 0, 7, 8); g.fillRect(-4, 6, 9, 3); g.restore();
    ridge(g, 196, 10, 0.02, 9, '#0c0a12', t * 6);
    deadTree(g, 60, 232, 1.3, '#07060c'); deadTree(g, 410, 240, 1.7, '#050409'); deadTree(g, 330, 214, 1.0, '#0a0810');
    /* fog */
    for (let i = 0; i < 7; i++) {
      const cx = ((t * (3 + (i % 3) * 2.2) + i * 83) % (W + 300)) - 150, cy = 168 + (i % 3) * 26 + Math.sin(t * 0.25 + i * 1.7) * 5, rx = 120 + (i % 2) * 40;
      g.save(); g.translate(cx, cy); g.scale(1, 0.2); const fg = g.createRadialGradient(0, 0, 0, 0, 0, rx); fg.addColorStop(0, 'rgba(154,144,184,0.2)'); fg.addColorStop(1, 'rgba(154,144,184,0)');
      g.fillStyle = fg; g.fillRect(-rx, -rx, rx * 2, rx * 2); g.restore();
    }
    g.globalAlpha = 1;
    { const pg = g.createRadialGradient(240, 138, 8, 240, 138, 105); pg.addColorStop(0, 'rgba(6,4,12,0.72)'); pg.addColorStop(1, 'rgba(6,4,12,0)'); g.fillStyle = pg; g.fillRect(120, 60, 240, 160); }
    g.fillStyle = '#04030a'; g.fillRect(0, 252, W, 18); ridge(g, 256, 3, 0.05, 2, '#04030a', 0);
    /* crows crossing the moon */
    for (let i = 0; i < 3; i++) { const x = ((t * (20 + i * 7) + i * 150) % (W + 80)) - 40, y = 40 + i * 14 + Math.sin(t * 3 + i) * 3; g.fillStyle = '#04030a'; const f = Math.floor(t * 8 + i) % 2; g.fillRect(Math.round(x), Math.round(y), 5, 1); g.fillRect(Math.round(x) + 1, Math.round(y) + (f ? -1 : 1), 1, 1); g.fillRect(Math.round(x) + 3, Math.round(y) + (f ? -1 : 1), 1, 1); }
  };
  SC.title = {
    update(dt, Gm) {
      title.t += dt; const items = title.items = [{ label: 'Continue', k: 'cont', disabled: !Gm.peek(0) }, { label: 'New Game', k: 'new' }, { label: 'Load Game', k: 'load', disabled: !(Gm.peek(0) || Gm.peek(1) || Gm.peek(2)) }, { label: 'Settings', k: 'set' }, { label: 'Controls', k: 'ctl' }];
      if (title.sub === 'ctl') { if (confirm() || back()) title.sub = null; return; } if (title.sub === 'load') { SC.saves.update(dt, Gm, 'load'); return; }
      if (items[title.sel].disabled && !title.init) { title.sel = 1; } title.init = 1; title.sel = UI.nav(items.length, title.sel);
      if (AH.Particles && Math.random() < dt * 8) AH.Particles.emit({ x: U.rr(0, W), y: H + 4, vx: U.rr(-6, 6), vy: -U.rr(10, 30), life: 5, col: '#ff9a40', size: 1, add: true, grav: 0 });
      AH.Particles.update(dt);
      if (confirm()) { const it = items[title.sel]; if (it.disabled) { AH.Audio.sfx('ui_deny'); return; } AH.Audio.sfx('ui_ok'); if (it.k === 'new') { Gm.mode = 'charsel'; SC.charsel.sel = 0; } else if (it.k === 'cont') { Gm.load(0); } else if (it.k === 'load') { title.sub = 'load'; SC.saves.sel = 0; } else if (it.k === 'set') { Gm.screen = 'settings'; Gm.settingsFrom = 'title'; SC.settings.sel = 0; } else if (it.k === 'ctl') title.sub = 'ctl'; }
    },
    draw(g, Gm, time) {
      UI.drawTitleScene(g, title.t); AH.Particles.draw(g, { x: 0, y: 0 }, true);
      const big = Font.big('ASHEN HOLLOW', 5, '#f6e2a8', '#a87a30', '#1a0e04'); g.drawImage(big, Math.round(W / 2 - big.width / 2), 18);
      Font.draw(g, 'A  TALE  OF  FORGOTTEN  GODS', W / 2, 78, '#9a8e74', { align: 'center', outline: '#05040a' });
      if (title.sub === 'ctl') { UI.panel(g, 70, 60, 340, 160, { title: 'Controls' }); const L = [['Move', 'WASD / Arrows / Left stick'], ['Attack (3-hit combo)', 'J / Z / Left click'], ['Dodge (i-frames)', 'Space / K / X'], ['Cast readied spell', 'L / C / Right click'], ['Interact / Speak', 'E / F'], ['Cycle spell / pick slot', 'Q R / 1-4'], ['Book: items, spells, skills, map, codex', 'I B T M N'], ['Pause', 'Esc / P'], ['Aim  /  Witchsight (hold)', 'Mouse  /  V']]; L.forEach((r, i) => { Font.draw(g, r[0], 86, 76 + i * 15, C.ink); Font.draw(g, r[1], 394, 76 + i * 15, C.gold, { align: 'right' }); }); Font.draw(g, 'Dodge just before a telegraphed blow lands for a perfect dodge.', 240, 208, C.dim, { align: 'center' }); return; }
      if (title.sub === 'load') { SC.saves.draw(g, Gm, time, 'load'); return; }
      const items = title.items || []; UI.menu(g, items, title.sel, W / 2 - 60, 110, 120, time, { align: 'center', lh: 16 });
      Font.draw(g, AH.VERSION + '  -  vertical slice', 6, H - 10, '#5a5448'); Font.draw(g, 'Arrows / Enter', W - 6, H - 10, '#5a5448', { align: 'right' });
    },
  };

  /* ============================== CHARACTER SELECT ============================== */
  SC.charsel = {
    sel: 0,
    update(dt, Gm) { this.sel = UI.nav(5, this.sel, false); if (back()) { Gm.mode = 'title'; AH.Audio.sfx('ui_back'); } if (confirm()) { AH.Audio.sfx('ui_ok'); Gm.mode = 'play'; Gm.newGame(AH.SchoolOrder[this.sel]); } },
    draw(g, Gm, time) {
      UI.drawTitleScene(g, time); g.fillStyle = 'rgba(5,4,10,0.7)'; g.fillRect(0, 0, W, H); Font.draw(g, 'CHOOSE YOUR CRAFT', W / 2, 10, C.gold, { align: 'center', outline: '#05040a' });
      AH.SchoolOrder.forEach((s, i) => { const x = 10 + i * 93, y = 28, w = 88, h = 128, on = i === this.sel, S = AH.Schools[s], st = AH.Starts[s];
        UI.panel(g, x, y + (on ? -2 : 0), w, h, {}); g.drawImage(AH.Icons.sigil(s), x + w / 2 - 12, y + 6 + (on ? -2 : 0)); Font.draw(g, st.name, x + w / 2, y + 34 + (on ? -2 : 0), S.col, { align: 'center', outline: '#05040a' }); Font.draw(g, S.name, x + w / 2, y + 44 + (on ? -2 : 0), C.dim, { align: 'center' });
        const lines = Font.wrap(st.blurb, w - 12); lines.slice(0, 7).forEach((l, k) => Font.draw(g, l, x + 6, y + 58 + k * 9 + (on ? -2 : 0), C.ink)); if (on) UI.select(g, x - 2, y - 4, w + 4, h + 4, time, S.col); });
      const s = AH.SchoolOrder[this.sel], S = AH.Schools[s], st = AH.Starts[s]; UI.panel(g, 10, 166, 460, 96, {}); g.drawImage(AH.Icons.of({ icon: AH.Spells[st.spell].icon, scheme: s }, null), 20, 176); Font.draw(g, AH.Spells[st.spell].name, 42, 178, S.col); Font.draw(g, 'Starting spell', 42, 188, C.dim);
      Font.wrap(S.rule, 400).forEach((l, i) => Font.draw(g, l, 20, 204 + i * 9, C.ink)); Font.draw(g, 'Strength: ' + st.strength, 20, 230, '#9ae890'); Font.draw(g, 'Weakness: ' + st.weakness, 20, 242, '#e88a8a');
      Font.draw(g, '< >  choose     Enter  begin     Esc  back', W / 2, H - 9, '#5a5448', { align: 'center' });
    },
  };

  /* ============================== DIALOGUE ============================== */
  SC.dialogue = {
    update(dt, Gm) {
      const d = Gm.dialogue; if (!d) { Gm.screen = null; return; } d.t += dt; const full = d.text.length; d.shown = Math.min(full, d.shown + dt * 55);
      if (Math.floor(d.shown) % 3 === 0 && d.shown < full && d.lastBlip !== Math.floor(d.shown)) { d.lastBlip = Math.floor(d.shown); }
      if (d.shown < full) { if (confirm() || I.mouse.pressed) { d.shown = full; AH.Audio.sfx('ui_move'); } return; }
      d.sel = UI.nav(d.opts.length, d.sel);
      for (let i = 0; i < 4; i++) if (I.pressed('slot' + (i + 1)) && d.opts[i]) { d.sel = i; Gm.dialogueChoose(i); return; }
      if (confirm()) Gm.dialogueChoose(d.sel); if (back() && d.opts.some((o) => o.end && /Leave|Goodbye|Step|Let go/.test(o.t))) { Gm.dialogue = null; Gm.screen = null; }
    },
    draw(g, Gm, time) {
      const d = Gm.dialogue; if (!d) return; const x = 20, w = 440, lines = Font.wrap(d.text.slice(0, Math.floor(d.shown)), w - 50), full = Font.wrap(d.text, w - 50), h = 28 + full.length * 10 + (d.shown >= d.text.length ? d.opts.length * 13 + 6 : 0), y = H - h - 14;
      UI.panel(g, x, y, w, h, { title: d.node.sp }); const first = d.text[0] || ' '; UI.drawCap(g, first.toUpperCase(), x + 8, y + 10, 3);
      lines.forEach((l, i) => Font.draw(g, i === 0 ? l.slice(1) : l, x + (i === 0 ? 34 : 34), y + 12 + i * 10, C.ink));
      if (d.shown >= d.text.length) { const oy = y + 18 + full.length * 10; d.opts.forEach((o, i) => { const yy = oy + i * 13, on = i === d.sel; if (on) UI.select(g, x + 30, yy - 2, w - 44, 12, time); Font.draw(g, (i + 1) + '.', x + 34, yy, on ? C.gold : C.dim); Font.draw(g, o.t, x + 46, yy, on ? '#fff0c0' : '#c8bca0', { outline: on ? '#2a1a08' : null }); }); }
      else Font.draw(g, 'v', x + w - 14, y + h - 12 + Math.round(Math.sin(time * 6)), C.gold);
    },
  };
  SC.read = {
    update(dt, Gm) { if (confirm() || back()) { Gm.screen = null; Gm.reading = null; AH.Audio.sfx('ui_back'); } },
    draw(g, Gm, time) { const L = Gm.reading; if (!L) return; g.fillStyle = 'rgba(5,4,10,0.6)'; g.fillRect(0, 0, W, H); UI.panel(g, 90, 36, 300, 190, { title: L.title }); const lines = Font.wrap(L.text, 270); lines.forEach((l, i) => Font.draw(g, l, 106, 56 + i * 10, C.ink)); Font.draw(g, '[Enter] close', 240, 214, C.dim, { align: 'center' }); },
  };

  /* ============================== THE BOOK ============================== */
  const MODN = { maxHp: 'Vitality', maxStam: 'Stamina', stamRegen: 'Stamina regen', speed: 'Move speed', iframes: 'Dodge window', dmgMelee: 'Melee damage', dmgSpell: 'Spell damage', lantern: 'Lantern radius', corruptGain: 'Taint gain', soulCap: 'Soul capacity', soulChance: 'Extra soul chance', verdCap: 'Verdance cap', verdRegen: 'Verdance regen', hpCostMul: 'Blood cost', bleedMul: 'Bleed damage', leech: 'Lifesteal', armor: 'Damage reduction', sight: 'Hidden sight', reagentSave: 'Reagent saving', hexPower: 'Hex power', aetherCap: 'Aether capacity', aetherRegen: 'Aether regen' };
  const fit = (t, mw) => { if (Font.width(t) <= mw) return t; while (t.length > 1 && Font.width(t + '.') > mw) t = t.slice(0, -1); return t + '.'; };
  const TABS = ['Inventory', 'Spellbook', 'Skills', 'Map', 'Codex'];
  const B = (SC.book = { tab: 0, sel: 0, sel2: 0, fuseA: null, codexTab: 0, scroll: 0 });
  const KEYTAB = { inventory: 0, spells: 1, skills: 2, map: 3, codex: 4 };
  UI.openBook = function (tab) { const Gm = G(); Gm.screen = 'book'; B.tab = tab; B.sel = 0; B.sel2 = 0; B.fuseA = null; AH.Audio.sfx('page'); };
  SC.book = Object.assign(B, {
    update(dt, Gm) {
      Object.keys(KEYTAB).forEach((k) => { if (I.pressed(k)) { if (B.tab === KEYTAB[k]) { Gm.screen = null; AH.Audio.sfx('ui_back'); return; } B.tab = KEYTAB[k]; B.sel = 0; B.sel2 = 0; AH.Audio.sfx('page'); } });
      if (I.pressed('back') && Gm.screen === 'book') { Gm.screen = null; AH.Audio.sfx('ui_back'); return; }
      if (I.pressed('tabL') && !I.pressed('prev')) { } if (Gm.screen !== 'book') return;
      if (I.pressed('prev')) { B.tab = (B.tab + 4) % 5; B.sel = 0; B.sel2 = 0; AH.Audio.sfx('page'); } if (I.pressed('next')) { B.tab = (B.tab + 1) % 5; B.sel = 0; B.sel2 = 0; AH.Audio.sfx('page'); }
      [bookInv, bookSpells, bookSkills, bookMap, bookCodex][B.tab](dt, Gm);
    },
    draw(g, Gm, time) {
      g.fillStyle = 'rgba(5,4,10,0.72)'; g.fillRect(0, 0, W, H); const x = 14, y = 22, w = 452, h = 236; UI.panel(g, x, y, w, h, {});
      TABS.forEach((t, i) => { const tw = 80, tx = x + 6 + i * (tw + 2), on = i === B.tab; g.fillStyle = on ? '#3a3040' : '#17151d'; g.fillRect(tx, y - 11, tw, 12); g.fillStyle = on ? C.gold : C.iron; g.fillRect(tx, y - 11, tw, 1); g.fillRect(tx, y - 11, 1, 12); g.fillRect(tx + tw - 1, y - 11, 1, 12); Font.draw(g, t, tx + tw / 2, y - 8, on ? C.gold : C.dim, { align: 'center', shadow: false }); });
      Font.draw(g, 'Q/R tabs   Esc close', x + w - 10, y + h - 11, '#5a5448', { align: 'right' });
      [drawInv, drawSpells, drawSkills, drawMap, drawCodex][B.tab](g, Gm, time, x, y, w, h);
    },
  });
  /* ---- inventory ---- */
  function invList(Gm) { const out = []; Object.keys(Gm.inv).forEach((id) => { const d = AH.Items[id]; if (d && Gm.inv[id] > 0 && d.type !== 'grimoire' || (d && d.type === 'grimoire')) out.push(id); }); const ord = { weapon: 0, cloak: 1, relic: 2, consumable: 3, reagent: 4, key: 5, grimoire: 6, forbidden: 7 }; out.sort((a, b) => ord[AH.Items[a].type] - ord[AH.Items[b].type] || AH.Items[b].rarity - AH.Items[a].rarity); return out; }
  function bookInv(dt, Gm) {
    const list = invList(Gm), cols = 6; if (!list.length) return; if (I.repeat('left')) B.sel = Math.max(0, B.sel - 1); if (I.repeat('right')) B.sel = Math.min(list.length - 1, B.sel + 1); if (I.repeat('up')) B.sel = Math.max(0, B.sel - cols); if (I.repeat('down')) B.sel = Math.min(list.length - 1, B.sel + cols); B.sel = U.clamp(B.sel, 0, list.length - 1);
    if (I.repeat('left') || I.repeat('right') || I.repeat('up') || I.repeat('down')) AH.Audio.sfx('ui_move');
    if (confirm()) { const id = list[B.sel], d = AH.Items[id]; if (d.type === 'consumable') Gm.useItem(id); else if (d.type === 'weapon' || d.type === 'cloak' || d.type === 'relic') { Gm.equipItem(id); AH.Audio.sfx('ui_ok'); } else AH.Audio.sfx('ui_deny'); }
  }
  function drawInv(g, Gm, time, x, y, w, h) {
    const list = invList(Gm), p = Gm.player, cols = 6;
    UI.sub(g, x + 8, y + 8, 128, 108); Font.draw(g, 'EQUIPPED', x + 72, y + 12, C.gold, { align: 'center' });
    [['weapon', 'Weapon'], ['cloak', 'Cloak'], ['relic1', 'Relic'], ['relic2', 'Relic']].forEach((s, i) => { const it = Gm.equip[s[0]], d = it && AH.Items[it], yy = y + 26 + i * 22; g.fillStyle = '#05040a'; g.fillRect(x + 12, yy, 18, 18); if (d) g.drawImage(AH.Icons.of(d, AH.Rarity[d.rarity].col), x + 13, yy + 1); Font.draw(g, fit(d ? d.name : '(empty)', 96), x + 34, yy + 2, d ? AH.Rarity[d.rarity].col : '#5a5448'); Font.draw(g, s[1], x + 34, yy + 11, C.dim); });
    UI.sub(g, x + 8, y + 120, 128, 108); Font.draw(g, 'ATTRIBUTES', x + 72, y + 124, C.gold, { align: 'center' }); const wp = p.weapon(), st = [['Level', Gm.level], ['Vitality', p.maxHp], ['Stamina', p.maxStam], ['Melee', Math.round(wp.dmg * (1 + p.mod('dmgMelee')))], ['Spell power', '+' + Math.round(p.mod('dmgSpell') * 100) + '%'], ['Taint', Math.round(p.corruption) + '%'], ['Souls slain', Gm.kills]];
    st.forEach((s, i) => { Font.draw(g, s[0], x + 14, y + 138 + i * 12, C.dim); Font.draw(g, String(s[1]), x + 130, y + 138 + i * 12, C.ink, { align: 'right' }); });
    UI.sub(g, x + 144, y + 8, 160, 220); list.forEach((id, i) => { const r = Math.floor(i / cols), c = i % cols, ix = x + 148 + c * 26, iy = y + 12 + r * 26, d = AH.Items[id], on = i === B.sel; g.fillStyle = '#05040a'; g.fillRect(ix, iy, 24, 24); g.drawImage(AH.Icons.of(d, AH.Rarity[d.rarity].col), ix + 4, iy + 4); const eq = Object.keys(Gm.equip).some((k) => Gm.equip[k] === id); if (eq) { g.fillStyle = C.gold; g.fillRect(ix + 1, iy + 1, 3, 3); } if (Gm.inv[id] > 1) Font.draw(g, String(Gm.inv[id]), ix + 22, iy + 15, C.ink, { align: 'right', outline: '#05040a', shadow: false }); if (on) UI.select(g, ix - 1, iy - 1, 26, 26, time); });
    UI.sub(g, x + 312, y + 8, 132, 220); if (list[B.sel]) { const id = list[B.sel], d = AH.Items[id], R = AH.Rarity[d.rarity]; Font.draw(g, d.name, x + 316, y + 14, R.col); Font.draw(g, R.name + ' ' + d.type, x + 316, y + 24, C.dim); Font.wrap(d.desc, 120).forEach((l, i) => Font.draw(g, l, x + 316, y + 38 + i * 9, C.ink));
      let ly = y + 38 + Font.wrap(d.desc, 120).length * 9 + 8; if (d.w) { [['Damage', d.w.dmg], ['Speed', d.w.spd.toFixed(2)], ['Reach', d.w.reach], ['Vs. undead', 'x' + d.w.vsUndead]].forEach((r) => { Font.draw(g, r[0], x + 316, ly, C.dim); Font.draw(g, String(r[1]), x + 440, ly, '#9ae890', { align: 'right' }); ly += 10; }); } if (d.mods) Object.keys(d.mods).forEach((k) => { const v = d.mods[k]; Font.draw(g, MODN[k] || k, x + 316, ly, C.dim); Font.draw(g, (v > 0 ? '+' : '') + (Math.abs(v) < 2 ? Math.round(v * 100) + '%' : v), x + 440, ly, v > 0 ? '#9ae890' : '#e88a8a', { align: 'right' }); ly += 10; });
      const act = d.type === 'consumable' ? 'Use' : ['weapon', 'cloak', 'relic'].indexOf(d.type) >= 0 ? (Object.keys(Gm.equip).some((k) => Gm.equip[k] === id) ? 'Unequip' : 'Equip') : ''; if (act) Font.draw(g, '[Enter] ' + act, x + 378, y + 214, C.gold, { align: 'center' }); } else Font.draw(g, 'Nothing carried.', x + 378, y + 100, C.dim, { align: 'center' });
  }
  /* ---- spellbook ---- */
  function spellList(Gm) { return Gm.knownSpellList(); }
  function bookSpells(dt, Gm) {
    const list = spellList(Gm); if (!list.length) return; if (I.repeat('up')) { B.sel = (B.sel + list.length - 1) % list.length; AH.Audio.sfx('ui_move'); } if (I.repeat('down')) { B.sel = (B.sel + 1) % list.length; AH.Audio.sfx('ui_move'); } B.sel = U.clamp(B.sel, 0, list.length - 1);
    const id = list[B.sel];
    for (let i = 0; i < 4; i++) if (I.pressed('slot' + (i + 1))) { const ex = Gm.slots.indexOf(id); if (ex >= 0) Gm.slots[ex] = Gm.slots[i]; Gm.slots[i] = id; AH.Audio.sfx('ui_ok'); }
    if (I.pressed('interact') && !AH.Spells[id].forbidden || (I.pressed('confirm') && I.held('code:KeyE') === false && false)) { }
    if (I.pressed('confirm')) { const sp = AH.getSpell(id); if (sp.fused) return; if (sp.forbidden) { AH.Audio.sfx('ui_deny'); return; } if (!B.fuseA) { B.fuseA = id; AH.Audio.sfx('ui_ok'); Gm.toast('Choose a second spell to fuse (Enter), Esc to cancel.', '#e0c0f0'); } else if (B.fuseA !== id) { const r = Gm.fuse(B.fuseA, id); if (r === 'ash') Gm.toast('Fusion needs Soul Ash (dismissed thralls leave it).', '#b06a6a'); else if (!r) Gm.toast('Those cannot be fused.', '#b06a6a'); else AH.Audio.sfx('levelup'); B.fuseA = null; } else B.fuseA = null; }
    if (I.pressed('back') && B.fuseA) { B.fuseA = null; I.clearBack = true; }
  }
  function drawSpells(g, Gm, time, x, y, w, h) {
    const list = spellList(Gm); UI.sub(g, x + 8, y + 8, 170, 220); const vis = 15, off = U.clamp(B.sel - 7, 0, Math.max(0, list.length - vis));
    list.slice(off, off + vis).forEach((id, k) => { const i = k + off, sp = AH.getSpell(id), yy = y + 12 + k * 14, on = i === B.sel; if (on) UI.select(g, x + 10, yy - 1, 166, 14, time, AH.Schools[sp.school].col); g.drawImage(AH.Icons.of({ icon: sp.icon, scheme: sp.school }), x + 12, yy - 1 + 0, 12, 12); Font.draw(g, sp.name, x + 28, yy + 2, B.fuseA === id ? '#e0c0f0' : sp.forbidden ? '#d04050' : AH.Schools[sp.school].col); const sl = Gm.slots.indexOf(id); if (sl >= 0) Font.draw(g, String(sl + 1), x + 172, yy + 2, C.gold, { align: 'right' }); });
    UI.sub(g, x + 186, y + 8, 258, 220); const id = list[B.sel]; if (!id) { Font.draw(g, 'No spells known. Find a grimoire.', x + 315, y + 100, C.dim, { align: 'center' }); return; }
    const sp = AH.getSpell(id), S = AH.Schools[sp.school]; g.drawImage(AH.Icons.of({ icon: sp.icon, scheme: sp.school }, sp.forbidden ? '#d04050' : null), x + 194, y + 14, 32, 32); Font.draw(g, sp.name, x + 232, y + 16, S.col); Font.draw(g, (sp.fused ? 'Fused - ' : '') + S.name + (sp.forbidden ? ' - FORBIDDEN' : ''), x + 232, y + 27, sp.forbidden ? '#d04050' : C.dim);
    const c = Gm.player.costOf(sp); Font.draw(g, 'Cost: ' + Object.keys(c).map((k) => (k === 'reagent' ? AH.Items[c[k]].name : k === 'hpTo' ? 'all but 1 vitality' : c[k] + ' ' + (k === 'hp' ? 'vitality' : k))).join(', '), x + 194, y + 52, '#e8c670'); let ly = y + 64; Font.wrap(sp.desc, 240).forEach((l) => { Font.draw(g, l, x + 194, ly, C.ink); ly += 10; }); ly += 4; Font.wrap(sp.hint, 240).forEach((l) => { Font.draw(g, l, x + 194, ly, '#9a8ec4'); ly += 10; });
    ly += 6; UI.divider(g, x + 194, ly, 242); ly += 8; Font.draw(g, 'Rule of ' + S.name + ':', x + 194, ly, S.col); ly += 10; Font.wrap(S.rule, 240).forEach((l) => { Font.draw(g, l, x + 194, ly, C.dim); ly += 10; });
    Font.draw(g, '[1-4] assign slot   [Enter] fuse' + (B.fuseA ? ' (pick 2nd)' : ''), x + 315, y + 214, C.gold, { align: 'center' });
  }
  /* ---- skills ---- */
  const BR = AH.SkillBranches;
  /* the tree is a grid: move to the nearest node in the direction pressed; at an edge, left/right step to the next discipline */
  const skillXY = (n) => (n.br === 'general' ? [8 + (n.x % 2) * 30, 38 + (n.y + 2 * Math.floor(n.x / 2)) * 31] : [8 + n.x * 30, 44 + n.y * 30]);
  function skillStep(nodes, cur, dx, dy) {
    const c = skillXY(nodes[cur]); let best = -1, bs = 1e9;
    nodes.forEach((n, i) => { if (i === cur) return; const q = skillXY(n), ax = q[0] - c[0], ay = q[1] - c[1], along = dx ? ax * dx : ay * dy, off = Math.abs(dx ? ay : ax); if (along <= 3) return; const sc = along + off * 2.2; if (sc < bs) { bs = sc; best = i; } });
    return best;
  }
  function bookSkills(dt, Gm) {
    let nodes = Object.values(AH.Skills).filter((n) => n.br === BR[B.sel].id).sort((a, b) => a.y - b.y || a.x - b.x);
    B.sel2 = Math.min(B.sel2, nodes.length - 1);
    const dirs = [['left', -1, 0], ['right', 1, 0], ['up', 0, -1], ['down', 0, 1]];
    for (const d of dirs) {
      if (!I.repeat(d[0])) continue;
      const j = skillStep(nodes, B.sel2, d[1], d[2]);
      if (j >= 0) { B.sel2 = j; AH.Audio.sfx('ui_move'); }
      else if (d[1]) { const y0 = skillXY(nodes[B.sel2])[1]; B.sel = (B.sel + (d[1] > 0 ? 1 : 5)) % 6; nodes = Object.values(AH.Skills).filter((n) => n.br === BR[B.sel].id).sort((a, b) => a.y - b.y || a.x - b.x); let bi = 0, bd = 1e9; nodes.forEach((n, i) => { const q = skillXY(n), dd = Math.abs(q[1] - y0) * 2 + (d[1] > 0 ? q[0] : -q[0]); if (dd < bd) { bd = dd; bi = i; } }); B.sel2 = bi; AH.Audio.sfx('ui_move'); }
      else { /* wrap vertically to the far end of the column */ const c = skillXY(nodes[B.sel2]); let bi = B.sel2, bd = 1e9; nodes.forEach((n, i) => { const q = skillXY(n), dd = Math.abs(q[0] - c[0]) * 3 - (d[2] > 0 ? -q[1] : q[1]); if (dd < bd) { bd = dd; bi = i; } }); B.sel2 = bi; AH.Audio.sfx('ui_move'); }
    }
    if (confirm()) { const n = nodes[B.sel2]; if (!Gm.buySkill(n.id)) { AH.Audio.sfx('ui_deny'); if (!Gm.skills[n.id]) Gm.toast(Gm.skillPoints < n.cost ? 'Not enough skill points.' : 'Requires: ' + n.req.map((r) => AH.Skills[r].name).join(', '), '#b06a6a'); } }
  }
  function drawSkills(g, Gm, time, x, y, w, h) {
    Font.draw(g, 'Skill points: ' + Gm.skillPoints, x + 12, y + 10, C.gold); Font.draw(g, 'Level ' + Gm.level + (Gm.level < AH.MAX_LEVEL ? '   XP ' + Gm.xp + '/' + AH.xpFor(Gm.level) : '   (max)'), x + w - 12, y + 10, C.dim, { align: 'right' });
    const pos = (n, bx, by) => n.br === 'general' ? [bx + 8 + (n.x % 2) * 30, by + 38 + (n.y + 2 * Math.floor(n.x / 2)) * 31] : [bx + 8 + n.x * 30, by + 44 + n.y * 30];
    BR.forEach((b, bi) => { const bx = x + 10 + bi * 73, by = y + 24, on = bi === B.sel, known = b.id === 'general' || Gm.player.schools[b.school]; UI.sub(g, bx, by, 69, 158, on ? 'rgba(40,30,20,0.6)' : null); Font.draw(g, b.name, bx + 34, by + 4, known ? b.col : '#5a5448', { align: 'center' }); if (b.school !== 'neutral') g.drawImage(AH.Icons.sigil(b.school), bx + 22, by + 14, 24, 24);
      const nodes = Object.values(AH.Skills).filter((n) => n.br === b.id).sort((a, c) => a.y - c.y || a.x - c.x);
      nodes.forEach((n, ni) => { const [nx, ny] = pos(n, bx, by); n.req.forEach((r) => { const q = AH.Skills[r], [qx, qy] = pos(q, bx, by); g.fillStyle = Gm.skills[r] ? b.col : '#3a3640'; const ax = qx + 10, ay = qy + 10, bx2 = nx + 10, by2 = ny + 10; if (ax === bx2 || ay === by2) g.fillRect(Math.min(ax, bx2), Math.min(ay, by2), Math.abs(bx2 - ax) + 1, Math.abs(by2 - ay) + 1); else { g.fillRect(ax, Math.min(ay, by2), 1, Math.abs(by2 - ay) + 1); g.fillRect(Math.min(ax, bx2), by2, Math.abs(bx2 - ax) + 1, 1); } });
        const own = Gm.skills[n.id], can = Gm.canBuy(n.id); g.fillStyle = '#05040a'; g.fillRect(nx - 1, ny - 1, 22, 22); g.globalAlpha = own ? 1 : can ? 0.85 : 0.35; g.drawImage(AH.Icons.of({ icon: n.icon, scheme: b.school === 'neutral' ? 'neutral' : b.school }, own ? b.col : null), nx + 2, ny + 2); g.globalAlpha = 1; g.fillStyle = own ? b.col : can ? C.gold : '#3a3640'; g.fillRect(nx - 1, ny - 1, 22, 1); g.fillRect(nx - 1, ny + 20, 22, 1); g.fillRect(nx - 1, ny - 1, 1, 22); g.fillRect(nx + 20, ny - 1, 1, 22); if (on && ni === B.sel2) UI.select(g, nx - 3, ny - 3, 26, 26, time); }); });
    const nodes = Object.values(AH.Skills).filter((n) => n.br === BR[B.sel].id).sort((a, c) => a.y - c.y || a.x - c.x), n = nodes[B.sel2]; if (n) { UI.sub(g, x + 10, y + 186, w - 20, 44); Font.draw(g, n.name + (Gm.skills[n.id] ? '  (learned)' : '  - cost ' + n.cost), x + 16, y + 187, Gm.skills[n.id] ? '#9ae890' : C.gold); Font.wrap(n.desc, w - 36).forEach((l, i) => Font.draw(g, l, x + 16, y + 198 + i * 10, C.ink)); if (n.req.length) Font.draw(g, 'Requires ' + n.req.map((r) => AH.Skills[r].name).join(', '), x + w - 16, y + 187, C.dim, { align: 'right' }); }
    Font.draw(g, '< > branch   ^ v node   Enter learn', x + w - 16, y + 214, '#5a5448', { align: 'right' });
  }
  /* ---- map ---- */
  function bookMap(dt, Gm) {
    const ws = Object.keys(Gm.waystones); if (!ws.length) return; if (I.repeat('up')) B.sel = (B.sel + ws.length - 1) % ws.length; if (I.repeat('down')) B.sel = (B.sel + 1) % ws.length; B.sel = U.clamp(B.sel, 0, ws.length - 1);
    if (confirm()) { const id = ws[B.sel], wsn = Gm.waystones[id]; const near = Gm.world.objs.some((o) => o.d.waystone && U.dist(o.x, o.y, Gm.player.x, Gm.player.y) < 44); if (!near) { Gm.toast('Stand beside a waystone to travel.', '#b06a6a'); AH.Audio.sfx('ui_deny'); return; } Gm.travelTo(id); }
  }
  function drawMap(g, Gm, time, x, y, w, h) {
    const wd = Gm.world, sc = 3, mw = wd.w * sc, mh = wd.h * sc, ox = x + 10, oy = y + 18; UI.sub(g, x + 8, y + 8, 4 + mw + 4, 4 + mh + 10); Font.draw(g, wd.def.name, ox + mw / 2, y + 10, C.gold, { align: 'center' });
    const ex = wd.state.explored; for (let j = 0; j < wd.h; j++) for (let i = 0; i < wd.w; i++) { if (!ex[j * wd.w + i]) continue; const t = wd.tiles[j * wd.w + i], inf = AH.Tiles.INFO[t]; g.fillStyle = !inf ? '#222' : inf.solid ? '#4a4450' : inf.water ? '#2e4a6a' : t === AH.Tiles.ID.GRASS || t === AH.Tiles.ID.MOSS ? '#3a4a2a' : '#6a5a40'; g.fillRect(ox + i * sc, oy + j * sc, sc, sc); }
    wd.objs.forEach((o) => { if (o.hidden) return; const i = Math.floor(o.x / AH.T), j = Math.floor(o.y / AH.T); if (!ex[j * wd.w + i]) return; if (o.d.waystone) { g.fillStyle = '#9ab8ff'; g.fillRect(ox + i * sc - 1, oy + j * sc - 1, 5, 5); } else if (o.d.act && o.d.act.type === 'chest' && o.state === 0) { g.fillStyle = '#e8c670'; g.fillRect(ox + i * sc, oy + j * sc, 3, 3); } });
    wd.def.exits.forEach((e) => { if (!ex[Math.min(wd.h - 1, e.y) * wd.w + Math.min(wd.w - 1, e.x)]) return; g.fillStyle = '#e8c670'; g.fillRect(ox + e.x * sc, oy + e.y * sc, Math.max(3, e.w * sc), Math.max(3, e.h * sc)); });
    const p = Gm.player; g.fillStyle = Math.floor(time * 3) % 2 ? '#ffffff' : '#e03040'; g.fillRect(ox + Math.floor(p.x / AH.T) * sc - 1, oy + Math.floor(p.y / AH.T) * sc - 1, 5, 5);
    const rx = x + 14 + mw + 14, rw = w - (rx - x) - 10; UI.sub(g, rx, y + 8, rw, 220); Font.draw(g, 'THE HOLLOW', rx + rw / 2, y + 12, C.gold, { align: 'center' });
    const areas = [['hamlet', 'Withering Hamlet'], ['thornwood', 'Thornwood'], ['catacombs', 'Catacombs of the Pale Choir']]; areas.forEach((a, i) => { const yy = y + 28 + i * 20, seen = Gm.visited[a[0]]; Font.draw(g, seen ? a[1] : '???', rx + 8, yy, wd.areaId === a[0] ? C.gold : seen ? C.ink : '#5a5448'); if (i < 2) { g.fillStyle = '#6a5a34'; g.fillRect(rx + 14, yy + 10, 1, 8); } }); if (Gm.flags.drowned_gate) Font.draw(g, 'The Drowned Road (open)', rx + 8, y + 88, '#9ab8ff');
    UI.divider(g, rx + 6, y + 104, rw - 12); Font.draw(g, 'WAYSTONES', rx + rw / 2, y + 110, C.gold, { align: 'center' }); const ws = Object.keys(Gm.waystones); if (!ws.length) Font.draw(g, 'None rested at.', rx + 8, y + 124, C.dim); ws.forEach((id, i) => { const on = i === B.sel; if (on) UI.select(g, rx + 4, y + 122 + i * 12, rw - 8, 11, time, '#9ab8ff'); Font.draw(g, Gm.waystones[id].name, rx + 8, y + 124 + i * 12, on ? '#cfe0ff' : '#8a9ac8'); });
    Font.draw(g, 'Enter: travel (beside a waystone)', rx + rw / 2, y + 214, '#5a5448', { align: 'center' });
  }
  /* ---- codex ---- */
  function codexList(Gm) {
    const t = B.codexTab; if (t === 0) return Object.keys(AH.Lore).filter((k) => Gm.lore[k]).map((k) => ({ id: k, title: AH.Lore[k].title, text: AH.Lore[k].text })); if (t === 1) return Object.keys(AH.Bestiary).filter((k) => Gm.seen[k]).map((k) => ({ id: k, title: AH.Bestiary[k].name + ' (' + Gm.seen[k] + ')', text: AH.Bestiary[k].desc + '\n\n' + AH.Bestiary[k].hint })); return Gm.choices.map((c, i) => ({ id: i, title: 'Day ' + c.day, text: c.text }));
  }
  function bookCodex(dt, Gm) { if (I.pressed('left')) { B.codexTab = (B.codexTab + 2) % 3; B.sel = 0; AH.Audio.sfx('ui_move'); } if (I.pressed('right')) { B.codexTab = (B.codexTab + 1) % 3; B.sel = 0; AH.Audio.sfx('ui_move'); } const l = codexList(Gm); if (l.length) { if (I.repeat('up')) { B.sel = (B.sel + l.length - 1) % l.length; AH.Audio.sfx('ui_move'); } if (I.repeat('down')) { B.sel = (B.sel + 1) % l.length; AH.Audio.sfx('ui_move'); } } B.sel = U.clamp(B.sel, 0, Math.max(0, l.length - 1)); }
  function drawCodex(g, Gm, time, x, y, w, h) {
    ['Lore', 'Bestiary', 'Journal'].forEach((t, i) => Font.draw(g, t, x + 20 + i * 56, y + 10, i === B.codexTab ? C.gold : C.dim)); Font.draw(g, '< >', x + 190, y + 10, '#5a5448'); const l = codexList(Gm); UI.sub(g, x + 8, y + 22, 170, 206); UI.sub(g, x + 186, y + 22, 258, 206);
    if (!l.length) { Font.draw(g, B.codexTab === 0 ? 'Nothing found yet.' : B.codexTab === 1 ? 'No creatures observed.' : 'No choices recorded.', x + 93, y + 120, C.dim, { align: 'center' }); return; }
    const vis = 16, off = U.clamp(B.sel - 8, 0, Math.max(0, l.length - vis)); l.slice(off, off + vis).forEach((e, k) => { const i = k + off, yy = y + 26 + k * 12, on = i === B.sel; if (on) UI.select(g, x + 10, yy - 2, 166, 12, time); Font.draw(g, e.title.length > 26 ? e.title.slice(0, 25) + '.' : e.title, x + 14, yy, on ? '#fff0c0' : C.ink); });
    const e = l[B.sel]; Font.draw(g, e.title, x + 194, y + 28, C.gold); UI.divider(g, x + 194, y + 40, 242); Font.wrap(e.text, 240).forEach((s, i) => Font.draw(g, s, x + 194, y + 50 + i * 10, C.ink));
  }

  /* ============================== BREWING ============================== */
  SC.brew = {
    update(dt, Gm) { const R = AH.Brews; Gm.menuSel = UI.nav(R.length, Gm.menuSel || 0); if (back()) { Gm.screen = null; AH.Audio.sfx('ui_back'); return; } if (confirm()) { const r = R[Gm.menuSel]; if (Object.keys(r.needs).every((k) => Gm.countItem(k) >= r.needs[k])) { Object.keys(r.needs).forEach((k) => Gm.takeItem(k, r.needs[k])); Gm.giveItem(r.out, r.n); AH.Audio.sfx('ritual', { v: 0.4 }); AH.Particles.magic(Gm.player.x, Gm.player.y - 12, 10, '#8fd06a'); } else { AH.Audio.sfx('ui_deny'); Gm.toast('Missing ingredients.', '#b06a6a'); } } },
    draw(g, Gm, time) { g.fillStyle = 'rgba(5,4,10,0.65)'; g.fillRect(0, 0, W, H); UI.panel(g, 100, 50, 280, 170, { title: 'The Cauldron' }); AH.Brews.forEach((r, i) => { const yy = 70 + i * 34, on = i === (Gm.menuSel || 0), ok = Object.keys(r.needs).every((k) => Gm.countItem(k) >= r.needs[k]); if (on) UI.select(g, 108, yy - 3, 264, 30, time); g.drawImage(AH.Icons.of(AH.Items[r.out], AH.Rarity[AH.Items[r.out].rarity].col), 114, yy); Font.draw(g, r.name, 136, yy + 1, ok ? C.ink : '#6a6458'); Font.draw(g, Object.keys(r.needs).map((k) => r.needs[k] + ' ' + AH.Items[k].name + ' (' + Gm.countItem(k) + ')').join(', '), 136, yy + 12, ok ? '#9ae890' : '#8a5a5a'); }); Font.draw(g, 'Enter brew   Esc close', 240, 206, '#5a5448', { align: 'center' }); },
  };

  /* ============================== PAUSE / SETTINGS / SAVES ============================== */
  SC.pause = {
    sel: 0, items: [{ label: 'Resume', k: 'res' }, { label: 'Save Game', k: 'save' }, { label: 'Load Game', k: 'load' }, { label: 'Settings', k: 'set' }, { label: 'Controls', k: 'ctl' }, { label: 'Quit to Title', k: 'quit' }], sub: null,
    update(dt, Gm) {
      if (this.sub === 'ctl') { if (confirm() || back()) this.sub = null; return; } if (this.sub === 'save' || this.sub === 'load') { SC.saves.update(dt, Gm, this.sub); return; }
      if (back()) { Gm.screen = null; AH.Audio.sfx('ui_back'); return; } this.sel = UI.nav(this.items.length, this.sel);
      if (confirm()) { const k = this.items[this.sel].k; AH.Audio.sfx('ui_ok'); if (k === 'res') Gm.screen = null; else if (k === 'save') { this.sub = 'save'; SC.saves.sel = 0; } else if (k === 'load') { this.sub = 'load'; SC.saves.sel = 0; } else if (k === 'set') { Gm.screen = 'settings'; Gm.settingsFrom = 'pause'; SC.settings.sel = 0; } else if (k === 'ctl') this.sub = 'ctl'; else if (k === 'quit') { Gm.save(0, true); Gm.mode = 'title'; Gm.screen = null; title.sel = 0; AH.Audio.music('title'); } }
    },
    draw(g, Gm, time) {
      g.fillStyle = 'rgba(5,4,10,0.7)'; g.fillRect(0, 0, W, H);
      if (this.sub === 'ctl') { UI.panel(g, 70, 60, 340, 150, { title: 'Controls' }); [['Move', 'WASD'], ['Attack', 'J / Click'], ['Dodge', 'Space'], ['Cast', 'L / Right click'], ['Interact', 'E'], ['Spells', 'Q R 1-4'], ['Book', 'I B T M N']].forEach((r, i) => { Font.draw(g, r[0], 90, 78 + i * 16, C.ink); Font.draw(g, r[1], 390, 78 + i * 16, C.gold, { align: 'right' }); }); return; }
      if (this.sub) { SC.saves.draw(g, Gm, time, this.sub); return; }
      UI.panel(g, 170, 60, 140, 150, { title: 'Paused' }); UI.menu(g, this.items, this.sel, 180, 80, 120, time, { lh: 16, align: 'center' }); Font.draw(g, 'Day ' + Gm.day + '  Level ' + Gm.level, 240, 196, C.dim, { align: 'center' });
    },
  };
  SC.saves = {
    sel: 0, update(dt, Gm, mode) { if (back()) { if (Gm.screen === 'pause') SC.pause.sub = null; title.sub = null; AH.Audio.sfx('ui_back'); return; } this.sel = UI.nav(3, this.sel); if (confirm()) { if (mode === 'save') { Gm.save(this.sel); SC.pause.sub = null; } else { if (!Gm.peek(this.sel)) { AH.Audio.sfx('ui_deny'); return; } Gm.load(this.sel); title.sub = null; SC.pause.sub = null; } } },
    draw(g, Gm, time, mode) { UI.panel(g, 100, 70, 280, 130, { title: mode === 'save' ? 'Save' : 'Load' }); for (let i = 0; i < 3; i++) { const pk = Gm.peek(i), yy = 90 + i * 34, on = i === this.sel; if (on) UI.select(g, 108, yy - 3, 264, 30, time); Font.draw(g, 'Slot ' + (i + 1) + (i === 0 ? ' (auto)' : ''), 116, yy, C.gold); if (pk) { Font.draw(g, pk.area + ' - Level ' + pk.level + ' - Day ' + pk.day, 116, yy + 11, C.ink); Font.draw(g, new Date(pk.t).toLocaleString(), 366, yy + 11, C.dim, { align: 'right' }); } else Font.draw(g, 'Empty', 116, yy + 11, '#5a5448'); } },
  };
  SC.settings = {
    sel: 0,
    rows() { const s = G().settings; return [{ k: 'master', label: 'Master volume', v: s.master, type: 'bar' }, { k: 'music', label: 'Music', v: s.music, type: 'bar' }, { k: 'sfx', label: 'Effects', v: s.sfx, type: 'bar' }, { k: 'shake', label: 'Screen shake', v: s.shake, type: 'bar', max: 1 }, { k: 'hitstop', label: 'Hit-stop', v: s.hitstop, type: 'bar', max: 1 }, { k: 'particles', label: 'Particles', v: s.particles, type: 'bar', max: 1 }, { k: 'reduceFlash', label: 'Reduce flashing', v: s.reduceFlash, type: 'tog' }, { k: 'showHints', label: 'Show control hints', v: s.showHints, type: 'tog' }, { k: 'scale', label: 'Scaling', v: s.scale, type: 'opt', opts: ['fit', 'integer'] }, { k: 'display', label: 'Picture (F2)', v: s.display, type: 'opt', opts: ['smooth', 'soft', 'crisp'] }, { k: 'back', label: 'Back', type: 'btn' }]; },
    update(dt, Gm) {
      const rows = this.rows(); this.sel = UI.nav(rows.length, this.sel); const r = rows[this.sel], s = Gm.settings;
      if (r.type === 'bar') { const d = (I.repeat('right') ? 1 : 0) - (I.repeat('left') ? 1 : 0); if (d) { s[r.k] = U.clamp(Math.round((s[r.k] + d * 0.1) * 10) / 10, 0, 1); Gm.applySettings(); AH.Audio.sfx('ui_move'); } }
      else if (r.type === 'tog') { if (confirm() || I.repeat('left') || I.repeat('right')) { s[r.k] = !s[r.k]; AH.Audio.sfx('ui_ok'); } }
      else if (r.type === 'opt') { if (confirm() || I.repeat('right') || I.repeat('left')) { s[r.k] = r.opts[(r.opts.indexOf(s[r.k]) + 1) % r.opts.length]; AH.resize && AH.resize(); AH.Audio.sfx('ui_ok'); } }
      else if (confirm()) { Gm.saveSettings(); Gm.screen = Gm.settingsFrom === 'pause' ? 'pause' : null; AH.Audio.sfx('ui_back'); }
      if (back()) { Gm.saveSettings(); Gm.screen = Gm.settingsFrom === 'pause' ? 'pause' : null; AH.Audio.sfx('ui_back'); }
    },
    draw(g, Gm, time) {
      if (Gm.mode === 'title') UI.drawTitleScene(g, title.t); g.fillStyle = 'rgba(5,4,10,0.75)'; g.fillRect(0, 0, W, H); UI.panel(g, 110, 30, 260, 210, { title: 'Settings' }); const rows = this.rows();
      rows.forEach((r, i) => { const yy = 46 + i * 16, on = i === this.sel; if (on) UI.select(g, 118, yy - 3, 244, 15, time); Font.draw(g, r.label, 126, yy, on ? '#fff0c0' : C.ink); if (r.type === 'bar') { UI.bar(g, 258, yy + 1, 90, 5, r.v, '#a88a44', '#e8c670', '#17151d'); } else if (r.type === 'tog') Font.draw(g, r.v ? 'On' : 'Off', 350, yy, r.v ? '#9ae890' : C.dim, { align: 'right' }); else if (r.type === 'opt') Font.draw(g, String(r.v), 350, yy, C.gold, { align: 'right' }); });
      Font.draw(g, 'Left/Right adjust   Esc back', 240, 228, '#5a5448', { align: 'center' });
    },
  };

  /* ============================== DEATH / EPILOGUE ============================== */
  SC.dead = {
    sel: 0, items: [{ label: 'Wake at the waystone', k: 'resp' }, { label: 'Load last save', k: 'load' }, { label: 'Quit to title', k: 'quit' }],
    update(dt, Gm) { Gm.deadT = (Gm.deadT || 0) + dt; if (Gm.deadT < 1.8) return; this.sel = UI.nav(3, this.sel); if (confirm()) { const k = this.items[this.sel].k; AH.Audio.sfx('ui_ok'); if (k === 'resp') { Gm.screen = null; Gm.respawn(); } else if (k === 'load') { if (!Gm.load(0)) Gm.respawn(), (Gm.screen = null); } else { Gm.mode = 'title'; Gm.screen = null; AH.Audio.music('title'); } } },
    draw(g, Gm, time) { const a = U.clamp((Gm.deadT || 0) / 1.5, 0, 0.85); g.fillStyle = 'rgba(20,3,6,' + a + ')'; g.fillRect(0, 0, W, H); const big = Font.big('YOU HAVE FALLEN', 4, '#c04050', '#6a1420', '#1a0408'); g.globalAlpha = U.clamp((Gm.deadT - 0.5) / 1, 0, 1); g.drawImage(big, Math.round(W / 2 - big.width / 2), 70); if (Gm.deadT > 1.8) UI.menu(g, this.items, this.sel, W / 2 - 80, 140, 160, time, { align: 'center', lh: 16 }); g.globalAlpha = 1; },
  };
  SC.epilogue = {
    t: 0, update(dt, Gm) { this.t += dt; AH.Particles.update(dt); if (this.t > 3 && confirm()) { Gm.mode = 'title'; Gm.screen = null; this.t = 0; AH.Audio.music('title'); } },
    draw(g, Gm, time) { UI.drawTitleScene(g, time); g.fillStyle = 'rgba(5,4,10,' + U.clamp(this.t * 0.4, 0, 0.8) + ')'; g.fillRect(0, 0, W, H); const e = Gm.flags.choir_end || 'free'; const L = { free: 'The choir sings home and the bell goes quiet. The road south is damp with dew and old music.', bind: 'The dead follow in your wake, humming a hymn you can no longer stop hearing. The road south seems to bend toward you.', silence: 'The bell is shattered and the silence is enormous. Somewhere under the hill, something takes a long, slow breath.' }[e]; if (this.t > 1) { const big = Font.big('THE DROWNED ROAD', 4, '#f6e2a8', '#a87a30', '#1a0e04'); g.globalAlpha = U.clamp(this.t - 1, 0, 1); g.drawImage(big, Math.round(W / 2 - big.width / 2), 40); Font.wrap(L, 340).forEach((l, i) => Font.draw(g, l, W / 2, 100 + i * 12, C.ink, { align: 'center', outline: '#05040a' })); Font.draw(g, 'End of the vertical slice. Thank you for playing.', W / 2, 170, C.gold, { align: 'center', outline: '#05040a' }); Font.draw(g, 'Level ' + Gm.level + '   Day ' + Gm.day + '   Slain ' + Gm.kills + '   Deaths ' + Gm.deaths, W / 2, 190, C.dim, { align: 'center' }); if (this.t > 3) Font.draw(g, '[Enter] return to title', W / 2, 230, '#5a5448', { align: 'center' }); g.globalAlpha = 1; } },
  };
})();

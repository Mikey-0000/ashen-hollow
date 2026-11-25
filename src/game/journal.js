/* Ashen Hollow - quest journal (Book tab, key G) and Corwin as a companion.
   The journal reads the same story flags the dialogue sets, so nothing is tracked twice. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, UI = AH.UI, C = UI.C, Font = AH.Font, I = AH.Input, SC = UI.screens;
  const G = () => AH.G, F = (k) => !!(G().flags || {})[k], V = (a) => !!(G().visited || {})[a];
  const sigils = () => Object.keys((G().flags || {}).sigils || {}).filter((k) => G().flags.sigils[k] === true || G().flags.sigils[k]).length;

  /* ---------------------------------------------------------------- quests */
  const QUESTS = [
    { id: 'main', title: 'The Silent Choir', who: 'The Hollow', show: () => true, steps: [
      ['Learn what befell the hamlet. Speak to Marta.', () => F('met_marta')], ['Find a way beneath the church. Aldric holds a key.', () => F('got_key')],
      ['Descend into the Catacombs of the Pale Choir.', () => V('catacombs')], ['Face the Choirmaster.', () => F('boss_done')]],
      done: () => F('boss_done'), note: () => (F('choir_end') ? 'The choir was ' + ({ free: 'released', bind: 'bound to you', silence: 'silenced' }[F('choir_end') && G().flags.choir_end] || 'laid to rest') + '.' : '') },
    { id: 'marta', title: 'Wolfsbane for Marta', who: 'Marta Hollin', show: () => F('marta_quest'), steps: [
      ['Gather three sprigs of wolfsbane in the Thornwood.', () => G().countItem('wolfsbane') >= 3 || F('marta_done')], ['Bring them to Marta.', () => F('marta_done')]],
      done: () => F('marta_done'), note: () => (F('marta_done') ? '' : 'You carry ' + Math.min(3, G().countItem('wolfsbane')) + ' of 3.') },
    { id: 'wren', title: "Wren's Promise", who: 'Wren', show: () => F('met_wren'), steps: [
      ['Wren speaks of a stone that moves in the burnt house.', () => F('cellar_hint')], ['Keep your word. Return for her when it is over.', () => F('choir_end')]],
      done: () => F('choir_end'), note: () => (F('wren_promise') ? 'You promised her.' : F('cellar_hint') ? 'You would not promise.' : '') },
    { id: 'stag', title: 'The Warden of Thorns', who: 'Corwin / Vesna', show: () => F('corwin_stag_hint') || F('vesna_pass') || V('thornwood'), steps: [
      ['A stag guards the oldest green thing in the wood (south-west Thornwood).', () => F('corwin_stag_hint') || V('thornwood')], ['Decide its fate.', () => !!G().flags.stag_done]],
      done: () => !!G().flags.stag_done, note: () => (G().flags.stag_done === 'spare' ? 'You spared it and offered a green hand.' : G().flags.stag_done === 'kill' ? 'You finished it.' : '') },
    { id: 'coven', title: 'The Ninth Hearth', who: 'Vesna', show: () => F('met_vesna'), steps: [
      ['Hear the coven out beside their fire.', () => F('met_vesna')], ['Swear a pact, or walk away.', () => F('coven_ally') || F('coven_hostile') || F('vesna_refused')]],
      done: () => F('coven_ally') || F('coven_hostile') || F('vesna_refused'), note: () => (F('coven_ally') ? 'You swore the pact (+taint).' : F('vesna_refused') ? 'You refused politely.' : F('coven_hostile') ? 'The coven is hostile.' : '') },
    { id: 'ilse', title: "Ilse's Twelve", who: 'Ilse', show: () => F('met_ilse'), steps: [
      ['Twelve of her people went down to look at the bell.', () => F('ilse_bell_known')], ['Ask Ilse what became of them.', () => F('ilse_quest')],
      ["Recover the wardens' tags from the Catacombs.", () => F('ilse_done')]], done: () => F('ilse_done'),
      note: () => (F('ilse_done') ? 'All twelve names are carved.' : F('ilse_quest') ? 'Returned ' + (G().flags.ilse_tags || 0) + '/12. Carrying ' + G().countItem('warden_tag') + '.' : '') },
    { id: 'corwin', title: 'Ash, Tansy and Brute', who: 'Corwin', show: () => F('corwin_dogs'), steps: [
      ['Put down three Hollow Hounds.', () => F('corwin_dogs_done') || ((G().seen.hound || 0) - (G().flags.corwin_hound_base || 0)) >= 3], ['Tell Corwin.', () => F('corwin_dogs_done')]], done: () => F('corwin_dogs_done'),
      note: () => (F('corwin_dogs_done') ? '' : Math.min(3, (G().seen.hound || 0) - (G().flags.corwin_hound_base || 0)) + ' of 3 laid to rest.') },
    { id: 'cold', title: 'The Cold Hearth', who: 'Vesna / Marta', show: () => F('cold_hearth'), steps: [
      ["Find Marta's three torn pages in the Thornwood.", () => [1, 2, 3].every((i) => (G().lore || {})['red_page_' + i])], ['Decide whose hands they belong in.', () => F('cold_resolved')]], done: () => F('cold_resolved'),
      note: () => ({ reconcile: 'You carried her apology. The ninth fire is lit.', burn: 'You burned them with Marta.', expose: 'You gave them to Vesna.' }[G().flags.cold_resolved] || ('Pages found: ' + [1, 2, 3].filter((i) => (G().lore || {})['red_page_' + i]).length + '/3.' + (F('cold_carry') ? ' Carrying Marta\'s apology to Vesna.' : ''))) },
    { id: 'brothers', title: "The Abbot's Brother", who: 'Aldric', show: () => F('aldric_stance') || F('abbot_hint'), steps: [
      ["Find what the Abbot wrote in the lowest hall.", () => !!(G().lore || {}).abbot_journal], ['Read it to Aldric.', () => F('aldric_forgave')]], done: () => F('aldric_forgave'),
      note: () => (F('aldric_forgave') ? 'Aldric forgave him. He asked you to carry the message.' : '') },
    { id: 'lady', title: 'The Caged Lady', who: 'A hanging cage', show: () => F('ghost_freed') || F('ghost_bound') || sigils() > 0, steps: [
      ['A spirit is held in a cage. Look into it.', () => F('ghost_freed') || F('ghost_bound')]], done: () => F('ghost_freed') || F('ghost_bound'),
      note: () => (F('ghost_freed') ? 'You set her free.' : F('ghost_bound') ? 'You bound her to your will.' : '') },
    { id: 'sigil', title: 'Witchsight Sigils', who: 'Hidden', show: () => sigils() > 0, steps: [['Claim sigils with Witchsight (V) in each area.', () => sigils() >= 15]], done: () => sigils() >= 15, note: () => sigils() + ' claimed.' },
  ];
  const active = () => QUESTS.filter((q) => q.show());
  const prog = (q) => q.steps.filter((s) => s[1]()).length;

  /* ---------------------------------------------------------------- journal tab */
  const J = { sel: 0 };
  const hasCorwin = () => F('met_corwin');
  J.update = function (dt, Gm) {
    const list = active(), n = list.length + (hasCorwin() ? 1 : 0); if (!n) return;
    if (I.repeat('up')) { J.sel = (J.sel + n - 1) % n; AH.Audio.sfx('ui_move'); } if (I.repeat('down')) { J.sel = (J.sel + 1) % n; AH.Audio.sfx('ui_move'); }
    const h = UI.hit('jq'); if (h >= 0 && I.mouseActive() && I.mouse.pressed) { if (h === J.sel && h === list.length) toggleCorwin(); J.sel = h; }
    J.sel = U.clamp(J.sel, 0, n - 1);
    if (I.pressed('confirm') && J.sel === list.length && hasCorwin()) toggleCorwin();
  };
  function toggleCorwin() {
    const Gm = G();
    if (F('corwin_ally')) { Gm.setFlag('corwin_ally', false); Gm.toast('Corwin heads back to the hamlet.', '#b8c890'); }
    else if (Gm.level >= 3) { Gm.setFlag('corwin_ally', true); Gm.toast('Corwin takes up his bow and falls in beside you.', '#b8c890'); }
    else { Gm.toast('Corwin will not come yet. Reach level 3.', '#b06a6a'); AH.Audio.sfx('ui_deny'); return; }
    AH.Audio.sfx('ui_ok');
  }
  J.draw = function (g, Gm, time, x, y, w, h) {
    const list = active(); UI.sub(g, x + 8, y + 8, 150, 220); Font.draw(g, 'JOURNAL', x + 83, y + 12, C.gold, { align: 'center' });
    list.forEach((q, i) => {
      const yy = y + 26 + i * 18, on = i === J.sel, d = q.done(); UI.hotr('jq', i, x + 10, yy - 2, 146, 17); if (on) UI.select(g, x + 10, yy - 2, 146, 17, time);
      Font.draw(g, q.title.length > 24 ? q.title.slice(0, 23) + '.' : q.title, x + 14, yy, d ? '#7a8a70' : on ? '#fff0c0' : C.ink);
      Font.draw(g, d ? 'done' : prog(q) + '/' + q.steps.length, x + 152, yy + 8, d ? '#7a8a70' : C.dim, { align: 'right' });
    });
    if (hasCorwin()) { const i = list.length, yy = y + 26 + i * 18 + 6, on = J.sel === i; UI.hotr('jq', i, x + 10, yy - 2, 146, 17); if (on) UI.select(g, x + 10, yy - 2, 146, 17, time);
      Font.draw(g, 'Companion: Corwin', x + 14, yy, on ? '#fff0c0' : '#b8c890'); Font.draw(g, F('corwin_ally') ? 'with you' : 'home', x + 152, yy + 8, F('corwin_ally') ? '#9ae890' : C.dim, { align: 'right' }); }
    UI.sub(g, x + 166, y + 8, 278, 220);
    if (J.sel === list.length && hasCorwin()) {
      Font.draw(g, 'Corwin the Hunter', x + 305, y + 14, '#b8c890', { align: 'center' });
      Font.wrap('A quiet man who knows the wood. He will walk with you, fight at your side and lead his own way back if he falls. Enter to ask him to join (level 3) or to send him home.', 262).forEach((l, i) => Font.draw(g, l, x + 174, y + 30 + i * 10, C.ink));
      Font.draw(g, F('corwin_ally') ? '[Enter] Send him home' : Gm.level >= 3 ? '[Enter] Ask him to join' : 'Needs level 3', x + 305, y + 120, C.gold, { align: 'center' });
    } else if (list[J.sel]) {
      const q = list[J.sel]; Font.draw(g, q.title, x + 174, y + 14, C.gold); Font.draw(g, q.who, x + 438, y + 14, C.dim, { align: 'right' });
      let ly = y + 30; q.steps.forEach((s) => { const d = s[1](); Font.wrap((d ? '[x] ' : '[ ] ') + s[0], 258).forEach((l, k) => { Font.draw(g, l, x + 174 + (k ? 12 : 0), ly, d ? '#7a8a70' : C.ink); ly += 10; }); ly += 3; });
      const nt = q.note(); if (nt) { ly += 4; UI.divider(g, x + 174, ly, 262); ly += 8; Font.wrap(nt, 258).forEach((l) => { Font.draw(g, l, x + 174, ly, '#c8b890'); ly += 10; }); }
    } else Font.draw(g, 'No entries yet. Talk to the people of the hamlet.', x + 305, y + 100, C.dim, { align: 'center' });
    /* decisions you have made */
    const ch = Gm.choices.slice(-4); if (ch.length) { Font.draw(g, 'DECISIONS', x + 174, y + 150, C.gold); ch.forEach((c, i) => Font.draw(g, 'Day ' + c.day + ': ' + (c.text.length > 54 ? c.text.slice(0, 53) + '.' : c.text), x + 174, y + 162 + i * 11, '#a89c84')); }
    Font.draw(g, 'G opens the journal', x + 438, y + 214, '#5a5448', { align: 'right' });
  };
  SC.book.jx = J;

  /* ---------------------------------------------------------------- companion */
  const D = AH.Dialogue.nodes;
  if (D.corwin_hub) {
    D.corwin_join = { id: 'corwin_join', sp: 'Corwin', text: 'Walk with you? Aye. The wood is easier with company, and I have been hiding from the quiet long enough. Open your journal if you want me gone; I will find my own way home.', opts: [{ t: 'Lead on.', end: true }] };
    D.corwin_home = { id: 'corwin_home', sp: 'Corwin', text: 'Understood. I will be by the fire when you need me.', opts: [{ t: 'Thank you.', end: true }] };
    const o = D.corwin_hub.opts, bye = o.pop();
    o.push({ t: 'Will you fight beside me? (companion)', next: 'corwin_join', cond: () => !F('corwin_ally') && G().level >= 3, fx: () => G().setFlag('corwin_ally', true) });
    o.push({ t: 'Go home for now, Corwin.', next: 'corwin_home', cond: () => F('corwin_ally'), fx: () => G().setFlag('corwin_ally', false) });
    o.push(bye);
  }
  const Wd = AH.World && AH.World.prototype;
  if (Wd && Wd.update) {
    const upd = Wd.update; let respawn = 0;
    Wd.update = function (dt) {
      const r = upd.apply(this, arguments), Gm = this.G;
      try {
        const on = Gm.flags && Gm.flags.corwin_ally && Gm.player && !this.def.indoor && !Gm.player.dead;
        this.npcs.forEach((n) => { if (n.def && n.def.art === 'corwin') { n.cwHide = !!(Gm.flags && Gm.flags.corwin_ally); if (n.cwHide) n.alpha = 0; } });
        const mine = this.allies.find((a) => a.companion);
        if (!on) { if (mine) mine.remove = true; return r; }
        if (!mine) { respawn -= dt; if (respawn <= 0) { respawn = 12; spawn(this); } }
        else if (!mine.dead) { mine._bow = (mine._bow || 0) - dt; if (mine._bow <= 0) { let best = null, bd = 150; this.enemies.forEach((e) => { if (e.dead || e.dormant || e.ally || e.def.passive) return; const d = U.dist(e.x, e.y, mine.x, mine.y); if (d < bd && !this.opaqueAt((e.x + mine.x) / 2, (e.y + mine.y) / 2)) { bd = d; best = e; } }); if (best) { mine._bow = 1.15; this.projectiles.push(new Arrow(this, mine, best)); AH.Audio.sfx('whoosh', { v: 0.25 }); } else mine._bow = 0.3; } }
        if (mine && U.dist(mine.x, mine.y, Gm.player.x, Gm.player.y) > 150) { mine.x = Gm.player.x - 14; mine.y = Gm.player.y + 4; }
      } catch (e) { if (AH.reportError) AH.reportError(e); }
      return r;
    };
  }
  function spawn(w) {
    const Gm = w.G, p = Gm.player, e = AH.makeThrall(w, p.x - 16, p.y + 4, 1e9, 8 + Gm.level * 0.9);
    e.companion = true; e.def = Object.assign({}, AH.EnemyDefs.thrall, { ally: true, name: 'Corwin', speed: 66 }); e.hp = e.maxHp = 80 + Gm.level * 6; e.fade = 0.4; w.allies.push(e);
  }
  /* Corwin's arrows */
  class Arrow {
    constructor(w, from, to) { this.w = w; this.x = from.x; this.y = from.y - 10; const a = Math.atan2(to.y - to.def.h * 0.4 - this.y, to.x - this.x); this.ang = a; this.vx = Math.cos(a) * 260; this.vy = Math.sin(a) * 260; this.life = 0.9; this.dead = false; this.dmg = 9 + w.G.level * 1.2; this.z = 0; }
    update(dt) {
      this.life -= dt; this.x += this.vx * dt; this.y += this.vy * dt; if (this.life <= 0 || this.w.opaqueAt(this.x, this.y)) { this.dead = true; return; }
      for (const e of this.w.enemies) { if (e.dead || e.dormant || e.ally) continue; if (U.dist(this.x, this.y, e.x, e.y - e.def.h * 0.4) < e.r + 3) { AH.Combat.hit(e, this.dmg, { src: this.w.G.player, ang: this.ang, silent: false, big: false }); e.shove && e.shove(this.ang, 30); this.dead = true; return; } }
    }
    draw(g, cam) { const x = this.x - cam.x, y = this.y - cam.y, c = Math.cos(this.ang), s = Math.sin(this.ang); g.strokeStyle = '#d8c090'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - c * 6, y - s * 6); g.lineTo(x + c * 3, y + s * 3); g.stroke(); g.fillStyle = '#e8ecf4'; g.fillRect(Math.round(x + c * 3), Math.round(y + s * 3), 1, 1); }
  }
  const En = AH.Enemy, spr0 = En.prototype.sprite, draw0 = En.prototype.draw;
  En.prototype.sprite = function () {
    if (!this.companion) return spr0.apply(this, arguments);
    const mv = Math.hypot(this.vx || 0, this.vy || 0) > 4 || this.moving, ax = Math.abs(this.vx || 0), ay = Math.abs(this.vy || 0);
    if (mv) this._cwDir = ax > ay ? 2 : (this.vy < 0 ? 1 : 0); if (this.vx) this._cwFlip = this.vx < 0;
    return AH.Art.facing(AH.Art.npc.corwin, this._cwDir || 0, mv ? 1 + (Math.floor(this.walkT * 1.2) % 2) : 0);
  };
  En.prototype.draw = function (g, cam, time) {
    if (!this.companion) return draw0.apply(this, arguments);
    const spr = this.sprite(); AH.Sprites.draw(g, spr, this.x - cam.x, this.y - cam.y, { flip: !!this._cwFlip, alpha: Math.min(1, this.fade * 1.2), flash: this.flash > 0.2 ? this.flash * 0.7 : 0 });
  };
})();

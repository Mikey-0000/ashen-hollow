/* Ashen Hollow - more companions: Ilse (holds the line), Wren (mends you), Vesna (hexes from range).
   Up to two companions at once, Corwin included. Each is asked in dialogue and sent home the same way. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, N = AH.Dialogue && AH.Dialogue.nodes; if (!N) return;
  const g = () => AH.G, F = (k) => !!g().flags[k], safe = (fn) => { try { return fn(); } catch (e) { if (AH.errors) AH.errors.push('companions: ' + e); } };
  const COMP = {
    ilse: { name: 'Ilse', art: 'ilse', can: () => F('ilse_done'), hp: (L) => 170 + L * 9, speed: 58, join: 'I walked a stair for twelve names. I can walk a road for one more. Where you stand, I stand. Send me back to the chapel any time; the door is unlocked.', home: 'Understood. The stair will be swept when you return.', ask: 'Stand with me, Warden. (companion)', send: 'Go home for now, Ilse.' },
    wren: { name: 'Wren', art: 'wren', can: () => g().flags.wren_home === 'road', hp: (L) => 60 + L * 3, speed: 66, join: 'Can I come? I will be quiet. I only hum when it is dark. ...I can find the little lights in people, you know. The ones that go out.', home: 'Okay. I will wait where the drawings are.', ask: 'Walk with me, Wren. (companion)', send: 'Go home for now, Wren.' },
    vesna: { name: 'Vesna', art: 'vesna', can: () => g().flags.cold_resolved === 'reconcile', hp: (L) => 90 + L * 5, speed: 54, join: 'The ninth hearth is lit and the road is long. Fine. I will lend you my temper and a few hexes. Do not ask me to be pleasant.', home: 'The fire is warm. I will be there if you need a worse idea.', ask: 'Walk with me, Vesna. (companion)', send: 'Go home for now, Vesna.' },
  };
  const active = () => ['corwin_ally', 'ilse_ally', 'wren_ally', 'vesna_ally'].filter(F).length;
  Object.keys(COMP).forEach((id) => {
    const c = COMP[id];
    N[id + '_join'] = { id: id + '_join', sp: c.name, text: c.join, opts: [{ t: 'Lead on.', end: true }] };
    N[id + '_home'] = { id: id + '_home', sp: c.name, text: c.home, opts: [{ t: 'Thank you.', end: true }] };
    [id + '_hub', id + '_after'].forEach((hub) => {
      const hn = N[hub]; if (!hn || !hn.opts) return; const o = hn.opts, bye = o.pop();
      o.push({ t: c.ask, next: id + '_join', cond: () => !F(id + '_ally') && c.can() && g().level >= 3 && active() < 2, fx: () => g().setFlag(id + '_ally', true) });
      o.push({ t: c.send, next: id + '_home', cond: () => F(id + '_ally'), fx: () => g().setFlag(id + '_ally', false) });
      if (bye) o.push(bye);
    });
  });

  const W = AH.World.prototype, upd0 = W.update, timers = {};
  W.update = function (dt) {
    const r = upd0.apply(this, arguments), Gm = this.G;
    safe(() => {
      Object.keys(COMP).forEach((id) => {
        const c = COMP[id], on = Gm.flags[id + '_ally'] && Gm.player && !this.def.indoor_noally && !Gm.player.dead && this.areaId !== 'arena_none';
        this.npcs.forEach((n) => { if (n.def && n.def.art === c.art) { n.cwHide = !!Gm.flags[id + '_ally']; if (n.cwHide) n.alpha = 0; } });
        const mine = this.allies.find((a) => a.comp === id), p = Gm.player, T = (timers[id] = timers[id] || { re: 0, a: 0 });
        if (!on) { if (mine) mine.remove = true; return; }
        if (!mine) { T.re -= dt; if (T.re <= 0) { T.re = 10; const e = AH.makeThrall(this, p.x - 16, p.y + 6, 1e9, 6 + Gm.level * (id === 'ilse' ? 1.1 : 0.5)); e.comp = id; e.def = Object.assign({}, AH.EnemyDefs.thrall, { ally: true, name: c.name, speed: c.speed }); if (id === 'wren') { e.def.sight = 0; e.def.dmg = 0; } e.hp = e.maxHp = c.hp(Gm.level); e.fade = 0.4; this.allies.push(e); } return; }
        if (mine.dead) return; T.a -= dt;
        if (U.dist(mine.x, mine.y, p.x, p.y) > 170) { mine.x = p.x + (id === 'vesna' ? 14 : -14); mine.y = p.y + 6; }
        if (T.a > 0) return;
        if (id === 'wren') { T.a = 8; if (p.hp < p.maxHp) { const h = Math.round(5 + Gm.level * 0.5); p.hp = Math.min(p.maxHp, p.hp + h); Gm.toast && Gm.toast('Wren mends you (+' + h + ')', '#9ae890'); AH.VFX && AH.VFX.motes && AH.VFX.motes(p.x, p.y, '#9ae890'); AH.Particles.burst(p.x, p.y - 8, 8, { min: 10, max: 40, vz: [20, 60], g: -20, life: [0.5, 1], size: 1, c: ['#9ae890', '#e8ffd0'], add: true }); } return; }
        let best = null, bd = id === 'vesna' ? 150 : 40; this.enemies.forEach((e) => { if (e.dead || e.dormant || e.ally || (e.def && e.def.passive)) return; const d = U.dist(e.x, e.y, mine.x, mine.y); if (d < bd) { bd = d; best = e; } });
        if (!best) { T.a = 0.4; return; }
        if (id === 'vesna') { T.a = 2.2; const ang = Math.atan2(best.y - mine.y, best.x - mine.x); AH.Combat.hit(best, 8 + Gm.level * 1.1, { src: p, ang, spell: true, school: 'witch', silent: false }); AH.VFX && AH.VFX.ring && AH.VFX.ring(mine.x, mine.y, 12, '#c27be0', 0.25, { thick: 1 }); }
        else { T.a = 12; AH.Combat.hit(best, 6 + Gm.level, { src: p, ang: Math.atan2(best.y - mine.y, best.x - mine.x), big: true }); this.enemies.forEach((e) => { if (e.dead || e.ally || U.dist(e.x, e.y, mine.x, mine.y) > 44) return; e.shove && e.shove(Math.atan2(e.y - mine.y, e.x - mine.x), 70); }); AH.VFX && AH.VFX.ring && AH.VFX.ring(mine.x, mine.y, 40, '#c8d0e4', 0.4, { thick: 2 }); }
      });
    });
    return r;
  };
  const En = AH.Enemy, spr0 = En.prototype.sprite, draw0 = En.prototype.draw;
  En.prototype.sprite = function () {
    if (!this.comp) return spr0.apply(this, arguments);
    const mv = Math.hypot(this.vx || 0, this.vy || 0) > 4 || this.moving, ax = Math.abs(this.vx || 0), ay = Math.abs(this.vy || 0);
    if (mv) this._cDir = ax > ay ? 2 : (this.vy < 0 ? 1 : 0); if (this.vx) this._cFlip = this.vx < 0;
    return AH.Art.facing(AH.Art.npc[COMP[this.comp].art], this._cDir || 0, mv ? 1 + (Math.floor((this.walkT || 0) * 1.2) % 2) : 0);
  };
  En.prototype.draw = function (g2, cam, time) {
    if (!this.comp) return draw0.apply(this, arguments);
    AH.Sprites.draw(g2, this.sprite(), this.x - cam.x, this.y - cam.y, { flip: !!this._cFlip, alpha: Math.min(1, this.fade * 1.2), flash: this.flash > 0.2 ? this.flash * 0.7 : 0 });
  };
  AH.Companions = { COMP, active };
})();

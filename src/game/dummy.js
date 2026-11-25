/* Ashen Hollow - Training dummy: a straw man by the hamlet's start that never dies, never fights back, and keeps a live damage meter
   (last hit, damage per second over the last few seconds, total). Useful for trying spells. Cosmetic/testing only; not an enemy in the bestiary. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, En = AH.Enemy, W = AH.World; if (!En || !W) return;
  const DEF = { id: 'dummy', name: 'Training Dummy', hp: 1e9, r: 6, h: 30, w: 20, mat: 'bone', res: {}, shadow: 1, speed: 0, hear: 0, xp: 0, souls: 0, drops: [], corpse: false, passive: true, boss: false, undead: true, sight: 0, dmg: 0 };
  let spr = null;
  function sprite() {
    if (spr) return spr;
    const c = U.makeCanvas(28, 40), g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    px(13, 14, 3, 25, '#3a2616'); px(13, 14, 1, 25, '#5a3c22'); px(10, 37, 9, 3, '#2a1a10'); px(9, 38, 11, 2, '#3a2616');       /* post + foot */
    px(3, 17, 22, 3, '#4a3018'); px(3, 17, 22, 1, '#6a4828'); px(2, 16, 2, 5, '#8a6a30'); px(24, 16, 2, 5, '#8a6a30');             /* crossbar + straw hands */
    px(9, 19, 11, 14, '#b89850'); px(9, 19, 3, 14, '#d4b868'); px(17, 19, 3, 14, '#8a6c34');                                       /* straw torso */
    for (let i = 0; i < 6; i++) px(10 + i * 2, 21 + (i % 3) * 4, 1, 4, '#e8d088');
    px(9, 25, 11, 2, '#6a2a2a'); px(9, 25, 11, 1, '#8a3a3a');                                                                       /* rope belt */
    px(9, 5, 11, 11, '#c8b078'); px(9, 5, 3, 11, '#e0cc94'); px(17, 5, 3, 11, '#a0885a'); px(10, 4, 9, 1, '#c8b078'); px(10, 16, 9, 1, '#a0885a');   /* sack head */
    px(11, 9, 2, 2, '#2a1a10'); px(16, 9, 2, 2, '#2a1a10'); px(12, 13, 5, 1, '#2a1a10'); px(11, 12, 1, 1, '#2a1a10'); px(17, 12, 1, 1, '#2a1a10');   /* stitched face */
    px(13, 3, 3, 2, '#8a6a30'); px(12, 2, 5, 1, '#d4b868');                                                                         /* tuft */
    const o = AH.Sprites.outline ? null : null; spr = { c, w: 28, h: 40, ax: 14, ay: 39 };
    return spr;
  }
  const rec = new WeakMap();
  function R(e) { let r = rec.get(e); if (!r) { r = { ev: [], total: 0, last: 0, idle: 0, wob: 0, dir: 1 }; rec.set(e, r); } return r; }
  const upd0 = En.prototype.update, rcv0 = En.prototype.receive, dot0 = En.prototype.dotDamage, die0 = En.prototype.die, drw0 = En.prototype.draw, spr0 = En.prototype.sprite;
  function note(e, d) { const r = R(e), t = e.w.time || performance.now() / 1000; r.ev.push({ t: performance.now() / 1000, v: d }); r.total += d; r.last = d; r.idle = 0; e.flash = 1; }
  En.prototype.receive = function (dmg, o) { if (!this.isDummy) return rcv0.apply(this, arguments); note(this, dmg); const r = R(this); r.wob = 1; r.dir = o && Math.cos(o.ang || 0) < 0 ? -1 : 1; this.hp = this.maxHp; };
  En.prototype.dotDamage = function (d, k) { if (!this.isDummy) return dot0.apply(this, arguments); note(this, d); this.hp = this.maxHp; };
  En.prototype.die = function () { if (this.isDummy) { this.hp = this.maxHp; this.dead = false; return; } return die0.apply(this, arguments); };
  En.prototype.update = function (dt) {
    if (!this.isDummy) return upd0.apply(this, arguments);
    const r = R(this), now = performance.now() / 1000; this.t = (this.t || 0) + dt; this.fade = 1; this.flash = Math.max(0, this.flash - dt * 4); r.wob = Math.max(0, r.wob - dt * 2.2); r.idle += dt;
    const st = this.status; for (const k in st) { if (st[k] && st[k].t !== undefined) { st[k].t -= dt; if ((k === 'bleed' || k === 'poison' || k === 'burn') && st[k].dps) this.dotDamage(st[k].dps * dt, k); if (st[k].t <= 0) delete st[k]; } }
    while (r.ev.length && now - r.ev[0].t > 5) r.ev.shift();
    if (r.idle > 8 && r.total) { r.total = 0; r.last = 0; }
    this.knock.x = this.knock.y = 0; this.vx = this.vy = 0;
  };
  En.prototype.sprite = function () { return this.isDummy ? sprite() : spr0.apply(this, arguments); };
  En.prototype.draw = function (g, cam, time) {
    if (!this.isDummy) return drw0.apply(this, arguments);
    const r = R(this), x = this.x - cam.x, y = this.y - cam.y, s = sprite(), now = performance.now() / 1000;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(x, y, 9, 3, 0, 0, 7); g.fill();
    g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(r.dir * Math.sin(r.wob * 14) * r.wob * 0.12);
    g.drawImage(s.c, -s.ax, -s.ay, s.w, s.h);
    if (this.flash > 0.1) { g.globalAlpha = this.flash * 0.55; g.globalCompositeOperation = 'lighter'; g.drawImage(s.c, -s.ax, -s.ay, s.w, s.h); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; }
    g.restore();
    const p = this.w.G.player; if (p && U.dist(p.x, p.y, this.x, this.y) < 150) {
      let sum = 0, first = now; r.ev.forEach((q) => { if (now - q.t <= 4) { sum += q.v; first = Math.min(first, q.t); } });
      const dps = sum ? sum / Math.max(1, Math.min(4, now - first)) : 0, F = AH.Font;
      const lines = [['Training Dummy', '#d8c8a0'], [r.total ? 'DPS ' + Math.round(dps) + '   last ' + Math.round(r.last) + '   total ' + Math.round(r.total) : 'hit me', r.total ? '#f4ece0' : '#8d8294']];
      lines.forEach((l, i) => { const wd = F.width(l[0]); F.draw(g, l[0], Math.round(x - wd / 2), Math.round(y - 52 + i * 9), l[1], { outline: '#05040a' }); });
    }
  };
  const load0 = W.prototype.load;
  W.prototype.load = function (areaId) {
    const r = load0.apply(this, arguments);
    try {
      if (areaId === 'hamlet' && !this.def.indoor) {
        const T = AH.T, pt = this.nearestFree((3 + 5.5) * T, 20.5 * T, 8);
        const e = new En(this, DEF, 0, 0, {}); e.isDummy = true; e.x = pt[0]; e.y = pt[1]; e.home = { x: pt[0], y: pt[1] }; e.sleeping = false; e.state = 'idle'; e.status = {};
        this.enemies.push(e);
      }
    } catch (err) { if (AH.reportError) AH.reportError(err); }
    return r;
  };
})();

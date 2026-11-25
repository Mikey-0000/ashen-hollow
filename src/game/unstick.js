/* Ashen Hollow - never be stuck again.
   Found cause: when the Choirmaster's gate shut, the player's hitbox could still overlap the gate tile by a few pixels. Each step is under 2px, so every step was "blocked": the player could not move at all.
   Fixes here:
   1. World.moveEnt frees any entity whose hitbox is embedded in solid tiles before it moves (players, enemies, allies, bosses).
   2. Closing the boss gate pushes everyone clear of the bars; the fight no longer starts until you are three tiles inside; the gate cannot stay shut without a living, active boss.
   3. U key and Pause -> Unstick: frees you, or returns you to the last safe spot you stood on.
   4. Pause -> Flee the Arena (only during the Choirmaster fight): the boss resets, the gate opens, you wait outside.
   5. Bosses that stall against a pillar blink free.
   6. If you hold a direction for a few seconds and go nowhere, a hint tells you about U. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, W = AH.World, P = AH.Player, T = AH.T || 16; if (!W || !P) return;
  const safe = (fn) => { try { return fn(); } catch (e) { if (AH.errors) AH.errors.push('unstick: ' + e); } };

  /* ---------- 1. unembed ---------- */
  W.prototype.unembed = function (e, hx, hy) {
    if (!this.boxBlocked(e.x, e.y, e.r)) return false;
    let best = null, bd = 1e9;
    for (let k = 1; k <= 40; k++) for (let a = 0; a < 24; a++) {
      const ang = a * Math.PI / 12, px = e.x + Math.cos(ang) * k * 1.5, py = e.y + Math.sin(ang) * k * 1.5;
      if (this.boxBlocked(px, py, e.r)) continue;
      const bias = hx !== undefined ? -((px - e.x) * hx + (py - e.y) * (hy || 0)) * 0.02 : 0, d = k + bias;
      if (d < bd) { bd = d; best = [px, py]; }
      if (best && k > 3 && bd < k - 2) break;
    }
    if (!best) { const q = this.nearestFree(e.x, e.y, e.r); if (this.freePoint(q[0], q[1], e.r)) best = q; }
    if (!best) return false;
    e.x = best[0]; e.y = best[1]; if (e.knock) e.knock.x = e.knock.y = 0; return true;
  };
  const mv0 = W.prototype.moveEnt;
  W.prototype.moveEnt = function (e, dx, dy) {
    if (!e.noClip && !(e.def && (e.def.ghost || e.def.flies)) && this.boxBlocked(e.x, e.y, e.r)) safe(() => this.unembed(e, dx, dy));
    return mv0.call(this, e, dx, dy);
  };

  /* ---------- 2. boss gate ---------- */
  const gate0 = W.prototype.setBossGate;
  W.prototype.setBossGate = function (closed) {
    if (closed) {                                                    /* open for a moment so tiles are known, then push everybody off the bars */
      this.bossGate = true; gate0.call(this, true);
      const all = [this.G.player].concat(this.enemies.filter((q) => !q.dormant), this.allies || []);
      all.forEach((q) => { if (!q || q.dead) return; safe(() => { let n = 0; while (this.boxBlocked(q.x, q.y, q.r) && n++ < 24) q.x += 1; if (this.boxBlocked(q.x, q.y, q.r)) this.unembed(q, 1, 0); }); });
      return;
    }
    return gate0.apply(this, arguments);
  };
  const upd0 = W.prototype.update; let gt = 0;
  W.prototype.update = function (dt) {
    const r = upd0.apply(this, arguments);
    gt += dt; if (gt > 0.5) {
      gt = 0; safe(() => {
        const G = this.G, p = G.player;
        if (this.bossGate && (!this.boss || this.boss.dead || this.boss.dormant)) { this.setBossGate(false); }                 /* the gate may never stay shut without a fight */
        if (G.flags.boss_done && this.bossGate) this.setBossGate(false);
        if (!p.dead && this.boxBlocked(p.x, p.y, p.r)) { this.unembed(p); }
        if (!p.dead && this.freePoint(p.x, p.y, p.r) && !p.dodging && !(p.knock && Math.abs(p.knock.x) + Math.abs(p.knock.y) > 30)) { S.t = (S.t || 0) + 0.5; if (S.t >= 2) { S.t = 0; S.x = p.x; S.y = p.y; S.area = this.areaId; } }
      });
    }
    return r;
  };
  /* the fight starts only once you are well inside (was: the instant your centre crossed the line) */
  const S = { t: 0 };   /* last safe spot */
  const zone0 = Object.getOwnPropertyDescriptor(W.prototype, 'areaId');
  (function patchTrigger() {
    const src = W.prototype.update.toString(); /* the trigger lives in World.update's zone loop; guard it by wrapping Events.startBoss */
    const ev = AH.Events; if (!ev || !ev.startBoss) return; const sb = ev.startBoss;
    ev.startBoss = function (w, id) { const p = w.G.player, z = w.zones && w.zones.find((q) => q.arena); if (z && p.x < (z.x + 3) * T) { w.G.flags.boss_started = false; return; } return sb.apply(this, arguments); };
  })();

  /* ---------- 3 & 4. unstick / flee ---------- */
  const API = (AH.Unstick = {});
  API.run = function (G) {
    const w = G.world, p = G.player; if (!w || !p || p.dead) return false;
    if (API.cd > performance.now()) { G.toast('Give it a moment.', '#8d8294'); return false; } API.cd = performance.now() + 1500;
    if (p.knock) p.knock.x = p.knock.y = 0; p.vx = p.vy = 0; if (p.dodge) p.dodge = null;
    if (w.boxBlocked(p.x, p.y, p.r) && w.unembed(p)) { G.toast('Freed.', '#9ab8ff'); AH.Particles.magic(p.x, p.y - 8, 10, '#9ab8ff'); AH.Audio.sfx('ui_ok'); return true; }
    if (S.area === w.areaId && S.x !== undefined && U.dist(S.x, S.y, p.x, p.y) > 12) { const q = w.nearestFree(S.x, S.y, p.r); p.x = q[0]; p.y = q[1]; G.toast('Back to your last safe footing.', '#9ab8ff'); AH.Particles.magic(p.x, p.y - 8, 14, '#9ab8ff'); AH.Audio.sfx('ui_ok'); return true; }
    const q = w.nearestFree(p.x + 20, p.y + 20, p.r); p.x = q[0]; p.y = q[1]; G.toast('Nudged free.', '#9ab8ff'); return true;
  };
  API.fightOn = (G) => !!(G.world && G.world.boss && !G.world.boss.dead && !G.world.boss.dormant && G.flags.boss_started && !G.flags.boss_done);
  API.flee = function (G) {
    const w = G.world, b = w.boss; if (!API.fightOn(G)) return false;
    b.dormant = true; b.hp = b.maxHp; b.phase = 1; b.invuln = false; b.gen = null; b.pose = 'idle'; b.state = 'idle'; b.endingTriggered = false; b.x = 51 * T + 8; b.y = 19 * T + 8; b.knock.x = b.knock.y = 0;
    w.enemies.forEach((e) => { if (e !== b && !e.dead && !e.dormant && !e.ally && w.zones.some((z) => z.arena && e.x > z.x * T && e.x < (z.x + z.w) * T && e.y > z.y * T && e.y < (z.y + z.h) * T)) { e.dead = true; e.remove = true; } });
    w.tele.length = 0; w.projectiles = []; w.boss = null; w.ambientOverride = null; w.arenaRelit = false; G.flags.boss_started = false; G.flags.boss_active = null; w.setBossGate(false);
    const p = G.player, q = w.nearestFree(41.5 * T, 22.5 * T, p.r); p.x = q[0]; p.y = q[1]; if (p.knock) p.knock.x = p.knock.y = 0;
    AH.Audio.music('crypt'); AH.Audio.sfx('door'); G.toast('You retreat. The hall falls quiet and the Choirmaster forgets you.', '#e8c670'); return true;
  };

  /* U key + stuck hint */
  const pu0 = P.prototype.update; let hold = 0, ox = 0, oy = 0, hinted = false;
  P.prototype.update = function (dt) {
    const r = pu0.apply(this, arguments), G = AH.G, I = AH.Input;
    if (G && G.mode === 'play' && !G.screen && !this.dead) safe(() => {
      if (I.pressed('unstick')) API.run(G);
      const moving = I.held('left') || I.held('right') || I.held('up') || I.held('down');
      if (moving && !this.dodge) { if (hold === 0) { ox = this.x; oy = this.y; } hold += dt; if (hold > 0.5 && U.dist(ox, oy, this.x, this.y) > 5) { hold = 0; } if (hold > 3 && !hinted) { hinted = true; G.toast('Stuck? Press U, or open Pause > Unstick.', '#9ab8ff'); hold = 0; } } else hold = 0;
    });
    return r;
  };
  if (AH.Input && AH.Input.map) { /* nothing: action table is static */ }

  /* ---------- 5. bosses that stall blink free ---------- */
  const B = AH.Boss;
  if (B) { const bu0 = B.prototype.update; B.prototype.update = function (dt) {
    bu0.apply(this, arguments);
    if (this.dormant || this.dead) return;
    safe(() => {
      const w = this.w, p = w.G.player; this._sk = (this._sk || 0) + dt;
      if (this._sk < 0.4) return; const el = this._sk; this._sk = 0;
      if (this.moving && !p.dead && U.dist(this.x, this.y, p.x, p.y) > 36 && U.dist(this.x, this.y, this._sx || 0, this._sy || 0) < 0.8 * el * 10 * 0.2) this._stall = (this._stall || 0) + el; else this._stall = 0;
      this._sx = this.x; this._sy = this.y;
      if (w.boxBlocked(this.x, this.y, this.r)) w.unembed(this);
      const z = w.zones && w.zones.find((q) => q.arena), inA = (x, y) => z && x > z.x * T && x < (z.x + z.w) * T && y > z.y * T && y < (z.y + z.h) * T;
      if (this._stall > 1.0 && (!z || inA(p.x, p.y))) {
        this._stall = 0; this._blinks = (this._blinks || 0) + 1; const a = Math.atan2(p.y - this.y, p.x - this.x); let q = null;
        for (let d = 70; d >= 24 && !q; d -= 8) { const px = p.x - Math.cos(a) * d, py = p.y - Math.sin(a) * d; if (w.freePoint(px, py, this.r) && (!z || inA(px, py))) q = [px, py]; }
        if (q) { AH.Particles.dust(this.x, this.y - 8, 12); this.x = q[0]; this.y = q[1]; AH.Particles.dust(this.x, this.y - 8, 12); AH.Audio.sfx('bell', { x: this.x, y: this.y, v: 0.6, pitch: 1.4 }); w.addShake(2); }
      }
    });
  }; }

  /* ---------- pause menu entries ---------- */
  const SC = AH.UI && AH.UI.screens, UI = AH.UI;
  if (SC && SC.pause) {
    const base = [{ label: 'Resume', k: 'res' }, { label: 'Unstick me (U)', k: 'unstick' }, { label: 'Save Game', k: 'save' }, { label: 'Load Game', k: 'load' }, { label: 'Settings', k: 'set' }, { label: 'Controls', k: 'ctl' }, { label: 'Quit to Title', k: 'quit' }];
    const rebuild = () => { const it = base.slice(); if (API.fightOn(AH.G)) it.splice(2, 0, { label: 'Flee the Arena', k: 'flee' }); const old = SC.pause.items[SC.pause.sel]; SC.pause.items = it; if (SC.pause.sel >= it.length) SC.pause.sel = it.length - 1; };
    const pu = SC.pause.update, pd = SC.pause.draw;
    SC.pause.update = function (dt, Gm) {
      if (!this.sub) { rebuild(); if (AH.Input.pressed('confirm')) { const k = this.items[this.sel] && this.items[this.sel].k; if (k === 'unstick') { Gm.screen = null; API.cd = 0; API.run(Gm); return; } if (k === 'flee') { Gm.screen = null; API.flee(Gm); return; } } }
      return pu.apply(this, arguments);
    };
    SC.pause.draw = function (g, Gm, time) {
      if (this.sub) return pd.apply(this, arguments);
      rebuild(); const n = this.items.length, h = 40 + n * 16 + 24;
      g.fillStyle = 'rgba(5,4,10,0.7)'; g.fillRect(0, 0, AH.W, AH.H);
      UI.panel(g, 170, Math.round(135 - h / 2), 140, h, { title: 'Paused' }); UI.menu(g, this.items, this.sel, 180, Math.round(135 - h / 2) + 22, 120, time, { lh: 16, align: 'center' });
      AH.Font.draw(g, 'Day ' + Gm.day + '  Level ' + Gm.level, 240, Math.round(135 + h / 2) - 14, AH.UI.C.dim, { align: 'center' });
    };
  }
})();

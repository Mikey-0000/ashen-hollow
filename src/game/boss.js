/* Ashen Hollow - bosses. Each fight is a JS generator: `yield seconds` waits, `yield 0` is a frame.
   The Weeping Choirmaster has three phases (Hymn, Dirge, Requiem); the Warden of Thorns is an optional guardian who can be spared. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, S = AH.Sprites, Co = AH.Combat;

  /* an expanding ring of force: step through it (dodge) or take the blow */
  class RingWave {
    constructor(w, x, y, o) { Object.assign(this, { w, x, y, r: 6, speed: 80, max: 150, dmg: 14, t: 0, dead: false, hit: false, col: '#c8b070', width: 5 }, o); AH.Audio.sfx('bell', { x, y, v: 0.9, pitch: 1.2 }); }
    update(dt) { this.t += dt; this.r += this.speed * dt; if (this.r > this.max) this.dead = true; const p = this.w.G.player; if (!this.hit && !p.dead) { const d = U.dist(p.x, p.y, this.x, this.y); if (Math.abs(d - this.r) < this.width) { if (p.hurt(this.dmg, Math.atan2(p.y - this.y, p.x - this.x), null, { attack: true, kb: 140 })) this.hit = true; } } }
    draw(g, cam) { const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y); g.save(); g.translate(x, y); g.scale(1, 0.62); g.globalCompositeOperation = 'lighter'; g.strokeStyle = this.col; g.globalAlpha = 0.9 * (1 - this.r / this.max * 0.5); g.lineWidth = 3; g.beginPath(); g.arc(0, 0, this.r, 0, 6.3); g.stroke(); g.lineWidth = 1; g.strokeStyle = '#fff'; g.beginPath(); g.arc(0, 0, this.r, 0, 6.3); g.stroke(); g.restore(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  /* a column of bone-light dropping from the ceiling after a telegraph */
  class Column {
    constructor(w, x, y, o) { Object.assign(this, { w, x, y, r: 16, wind: 0.9, t: 0, dmg: 18, dead: false, fired: false }, o); this.tele = new AH.Tele({ shape: 'circle', x, y, range: this.r, dur: this.wind, col: '#9a78e0' }); w.tele.push(this.tele); }
    update(dt) { this.t += dt; if (this.t >= this.wind && !this.fired) { this.fired = true; const p = this.w.G.player; AH.Audio.sfx('hit_stone', { x: this.x, y: this.y }); this.w.addShake(2); AH.Particles.bones(this.x, this.y - 10, 8, 0); AH.Particles.dust(this.x, this.y, 6); if (U.dist(p.x, p.y, this.x, this.y) < this.r + 3) p.hurt(this.dmg, Math.atan2(p.y - this.y, p.x - this.x), null, { attack: true }); } if (this.t > this.wind + 0.3) this.dead = true; }
    draw(g, cam) { if (!this.fired) return; const k = (this.t - this.wind) / 0.3, x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - k; g.fillStyle = '#c0a8ff'; g.fillRect(x - Math.round(this.r * (1 - k * 0.5)), y - 150, Math.round(this.r * (1 - k * 0.5)) * 2, 150); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  AH.RingWave = RingWave;

  class Boss extends AH.Enemy {
    constructor(w, def, tx, ty, o) { super(w, def, tx, ty, o); this.boss = true; this.phase = 1; this.gen = null; this.wait = 0; this.dt = 0.016; this.invuln = false; this.name = def.name; this.maxHp = def.hp; this.pose = 'idle'; this.poseT = 0; this.endingTriggered = false; this.playerSeen = false; this.hitLock = 0; }
    start() { this.dormant = false; this.fade = 1; this.gen = this.type === 'choirmaster' ? this.choirFight() : this.stagFight(); this.w.boss = this; this.w.G.flags.boss_active = this.type; }
    update(dt) {
      if (this.dead) return; const w = this.w, p = w.G.player; this.st += dt; this.dt = dt; this.sortY = this.y; this.flash = Math.max(0, this.flash - dt * 5); this.poseT += dt; this.walkT += dt * 5;
      if (this.dormant) return;
      Co.statusTick(this, dt); if (this.dead) return;
      if (Math.abs(this.knock.x) + Math.abs(this.knock.y) > 2) { w.moveEnt(this, this.knock.x * dt, this.knock.y * dt); this.knock.x *= Math.pow(0.0008, dt); this.knock.y *= Math.pow(0.0008, dt); }
      if (p.dead) { this.moving = false; return; }
      this.wait -= dt; let guard = 0;
      while (this.wait <= 0 && guard++ < 4) { const r = this.gen.next(); if (r.done) { this.gen = this.type === 'choirmaster' ? this.choirFight() : this.stagFight(); this.wait = 0.5; break; } this.wait = r.value || 0; if (!r.value) break; }
    }
    receive(dmg, o) { if (this.invuln) { return; } this.hp -= dmg; this.flash = 1; if (this.hp <= 0 && this.type === 'stag' && !this.endingTriggered) { this.hp = 1; this.endingTriggered = true; this.beginStagEnding(); return; } if (this.hp <= 0) this.die(o); }
    guarding() { return false; }
    stagger() {}
    heard() {}
    alert() {}
    /* ----- helpers for patterns ----- */
    setPose(k) { this.pose = k; this.poseT = 0; }
    *walkTo(tx, ty, spd, tmax, stopD) { let t = 0; this.moving = true; while (t < tmax && U.dist(this.x, this.y, tx(), ty()) > stopD) { this.moveToward(tx(), ty(), spd, this.dt); t += this.dt; yield 0; } this.moving = false; }
    *wait_(s) { let t = 0; while (t < s) { t += this.dt; yield 0; } }
    face_(p) { this.aimA = Math.atan2(p.y - this.y, p.x - this.x); this.facing = Math.cos(this.aimA) < 0 ? -1 : 1; }
    circleHit(x, y, r, dmg, kb) { const p = this.w.G.player; if (!p.dead && U.dist(p.x, p.y, x, y) < r + 3) return p.hurt(dmg, Math.atan2(p.y - y, p.x - x), this, { attack: true, kb: kb || 160 }); return false; }
    phaseShift(n, text) {
      this.phase = n; this.invuln = true; this.state = 'phase'; this.w.addShake(5); AH.Audio.sfx('bell', { x: this.x, y: this.y, v: 1, pitch: 0.7 }); AH.Audio.sfx('wail', { v: 0.9 }); this.w.ring(this.x, this.y, 140, '#c8b070', 0.8);
      this.w.G.toast(text, '#e8c670'); this.w.tele.forEach((t) => (t.dead = true)); this.w.projectiles = [];
    }
    /* ================= THE WEEPING CHOIRMASTER ================= */
    *choirFight() {
      const w = this.w, p = w.G.player;
      while (true) {
        if (this.phase === 1 && this.hp < this.maxHp * 0.66) { this.setPose('raise'); this.phaseShift(2, 'The Dirge begins...'); w.ambientOverride = 'dark'; yield* this.wait_(1.4); this.invuln = false; AH.Audio.music('boss'); continue; }
        if (this.phase === 2 && this.hp < this.maxHp * 0.33) { this.setPose('raise'); this.phaseShift(3, 'The Requiem.'); w.ambientOverride = null; w.arenaRelit = false; yield* this.wait_(1.6); this.invuln = false; continue; }
        const ph = this.phase, roll = Math.random();
        this.face_(p); this.setPose('idle');
        if (ph === 1) {
          if (roll < 0.4) yield* this.slam(); else if (roll < 0.75) yield* this.toll(3, 0.55); else yield* this.summon(2);
          yield* this.chaseUntil(U.rr(0.6, 1.2), 55);
        } else if (ph === 2) {
          if (roll < 0.28) yield* this.dirge(); else if (roll < 0.52) yield* this.columns(5); else if (roll < 0.8) yield* this.slam(); else yield* this.summon(2);
          yield* this.chaseUntil(U.rr(0.4, 0.9), 60);
        } else {
          const c = Math.random();
          if (c < 0.4) { yield* this.slam(0.7); yield* this.toll(2, 0.35); yield* this.slam(0.65); } else if (c < 0.7) { yield* this.silence(); yield* this.columns(4); } else { yield* this.dirge(); yield* this.toll(3, 0.3); }
          yield* this.exhausted(2.8);
        }
      }
    }
    *chaseUntil(t, d) { const p = this.w.G.player; yield* this.walkTo(() => p.x, () => p.y, this.def.speed * (this.phase === 3 ? 1.35 : 1), t, d); }
    *slam(windK) {
      const w = this.w, p = w.G.player; yield* this.chaseUntil(1.4, 46); this.face_(p); this.setPose('slam'); const wind = 0.9 * (windK || 1), R = 46;
      const tl = new AH.Tele({ shape: 'circle', x: this.x + Math.cos(this.aimA) * 22, y: this.y + Math.sin(this.aimA) * 22 + 0, range: R, dur: wind }); w.tele.push(tl); AH.Audio.sfx('telegraph', { x: this.x, y: this.y });
      yield wind; const cx = tl.x, cy = tl.y; w.addShake(5); AH.Audio.sfx('hit_stone', { x: cx, y: cy, v: 1 }); AH.Audio.sfx('bell', { x: cx, y: cy, v: 0.7, pitch: 0.8 }); AH.Particles.dust(cx, cy, 16); AH.Particles.bones(cx, cy - 4, 10, 0); AH.Particles.ringBurst(cx, cy, R, '#c8b898', 0.5);
      this.circleHit(cx, cy, R, this.def.dmg + 2, 220); w.rings.push(1); if (this.phase >= 2) w.tele.push(new RingWave(w, cx, cy, { max: 100, speed: 120, dmg: 10 }));
      yield 0.55; this.setPose('idle');
    }
    *toll(n, gap) {
      const w = this.w; this.setPose('raise'); const tl = new AH.Tele({ shape: 'circle', x: this.x, y: this.y, range: 30, dur: 0.8, col: '#c8b070' }); w.tele.push(tl); yield 0.8;
      for (let i = 0; i < n; i++) { w.tele.push(new RingWave(w, this.x, this.y, { speed: 74 + this.phase * 14, max: 170, dmg: 12 + this.phase * 2 })); w.addShake(3); AH.Particles.ringBurst(this.x, this.y, 50, '#c8b070', 0.5); yield gap + 0.3; }
      this.setPose('idle'); yield 0.3;
    }
    *summon(n) {
      const w = this.w; this.setPose('raise'); AH.Audio.sfx('wail', { x: this.x, y: this.y }); yield 0.7;
      const alive = w.enemies.filter((e) => e.type === 'wraith' && !e.dead).length; if (alive < 4) for (let i = 0; i < n; i++) { const a = U.rr(0, 6.28), q = w.nearestFree(this.x + Math.cos(a) * 60, this.y + Math.sin(a) * 40, 4); const e = w.addEnemy('wraith', 0, 0, { fadeIn: true }); e.x = q[0]; e.y = q[1]; e.home = { x: q[0], y: q[1] }; e.alert(w.G.player); AH.Particles.magic(q[0], q[1] - 8, 10, '#a8c0e0'); }
      this.setPose('idle'); yield 0.4;
    }
    *dirge() {
      const w = this.w, p = w.G.player; this.setPose('raise'); AH.Audio.sfx('wail', { x: this.x, y: this.y, v: 1 }); yield 0.75; this.face_(p);
      for (let k = 0; k < 3; k++) { const base = Math.atan2(p.y - 10 - this.y, p.x - this.x); for (let i = -2; i <= 2; i++) { const a = base + i * 0.3; w.projectiles.push(new AH.EProj(w, { x: this.x, y: this.y - 10, vx: Math.cos(a) * 62, vy: Math.sin(a) * 62, dmg: 10, color: '#d8b0ff', home: 0.5, life: 4, z: 28, src: this })); } AH.Audio.sfx('wisp_fire', { x: this.x, y: this.y }); yield 0.8; }
      this.setPose('idle'); yield 0.3;
    }
    *columns(n) {
      const w = this.w, p = w.G.player; this.setPose('raise'); yield 0.5;
      for (let i = 0; i < n; i++) { const lead = i % 2 ? 0 : 1; w.tele.push(new Column(w, p.x + p.vx * 0.4 * lead + U.rr(-14, 14), p.y + p.vy * 0.3 * lead + U.rr(-8, 8))); yield 0.45; } yield 0.9; this.setPose('idle');
    }
    *silence() {
      const w = this.w, p = w.G.player; this.setPose('raise'); yield 0.5;
      for (let i = 0; i < 2; i++) { const z = { x: p.x + U.rr(-40, 40), y: p.y + U.rr(-30, 30), r: 38, t: 0, dur: 7, dead: false, silence: true, update(dt) { this.t += dt; if (this.t > this.dur) this.dead = true; }, draw: () => 0, drawGround(g, cam, time) { const k = Math.min(1, this.t / 0.8), x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y); g.save(); g.translate(x, y); g.scale(1, 0.62); g.globalAlpha = 0.28 * k * (this.dur - this.t < 1 ? (this.dur - this.t) : 1); g.fillStyle = '#20143a'; g.beginPath(); g.arc(0, 0, this.r, 0, 6.3); g.fill(); g.globalAlpha = 0.8 * k; g.strokeStyle = '#a090d8'; g.setLineDash([3, 3]); g.lineDashOffset = -time * 8; g.beginPath(); g.arc(0, 0, this.r, 0, 6.3); g.stroke(); g.restore(); g.globalAlpha = 1; } }; w.zones.push(z); }
      w.G.toast('Silence falls over the hall. Spells fail within the circles.', '#a090d8'); yield 0.9; this.setPose('idle');
    }
    *exhausted(t) { this.setPose('kneel'); this.vulnerable = true; this.w.G.toast('The Choirmaster falters - strike now!', '#e8c670'); yield t; this.vulnerable = false; this.setPose('idle'); }
    /* ================= WARDEN OF THORNS (optional) ================= */
    *stagFight() {
      const w = this.w, p = w.G.player;
      while (true) {
        if (this.phase === 1 && this.hp < this.maxHp * 0.5) { this.phaseShift(2, 'The Warden bellows. The briars answer.'); yield* this.wait_(1.0); this.invuln = false; continue; }
        const ph = this.phase, r = Math.random(); this.face_(p);
        if (r < 0.45) yield* this.charge(ph === 2 ? 2 : 1); else if (r < 0.75) yield* this.stomp(); else yield* this.briars(ph === 2 ? 6 : 3);
        yield* this.chaseStag(U.rr(0.5, 1.1));
        if (ph === 2 && Math.random() < 0.3) { this.vulnerable = true; yield 1.6; this.vulnerable = false; }
      }
    }
    *chaseStag(t) { const p = this.w.G.player; yield* this.walkTo(() => p.x, () => p.y, this.def.speed, t, 36); }
    *charge(n) {
      const w = this.w, p = w.G.player;
      for (let i = 0; i < n; i++) {
        this.face_(p); this.setPose('paw'); this.state = 'windup'; const a = this.aimA, len = 150; const tl = new AH.Tele({ shape: 'line', x: this.x, y: this.y, ang: a, range: len, arc: 22, dur: 0.75, col: '#d03030' }); w.tele.push(tl); AH.Audio.sfx('growl', { x: this.x, y: this.y, v: 1 }); yield 0.75;
        this.state = 'attack'; let t = 0, hit = false; AH.Audio.sfx('swing_heavy', { x: this.x, y: this.y });
        while (t < 0.5) { const sp = 270; this.dt; const hitWall = w.moveEnt(this, Math.cos(a) * sp * this.dt, 0) | w.moveEnt(this, 0, Math.sin(a) * sp * this.dt); AH.Particles.dust(this.x, this.y, 1); if (!hit && U.dist(this.x, this.y, p.x, p.y) < this.r + 8) hit = p.hurt(this.def.dmg + 4, a, this, { attack: true, kb: 240 }); if (hitWall) { w.addShake(5); AH.Audio.sfx('hit_wood', { x: this.x, y: this.y }); AH.Particles.bones(this.x, this.y - 12, 6, a); this.vulnerable = true; yield 1.1; this.vulnerable = false; break; } t += this.dt; yield 0; }
        this.state = 'chase'; this.setPose('idle'); yield 0.35;
      }
    }
    *stomp() { const w = this.w; this.setPose('paw'); this.state = 'windup'; const tl = new AH.Tele({ shape: 'circle', x: this.x, y: this.y, range: 50, dur: 0.85 }); w.tele.push(tl); yield 0.85; w.addShake(4); AH.Audio.sfx('hit_stone', { x: this.x, y: this.y }); AH.Particles.dust(this.x, this.y, 14); AH.Particles.ringBurst(this.x, this.y, 50, '#8fd06a', 0.5); this.circleHit(this.x, this.y, 50, this.def.dmg, 200); this.state = 'chase'; this.setPose('idle'); yield 0.5; }
    *briars(n) { const w = this.w, p = w.G.player; this.setPose('paw'); AH.Audio.sfx('rustle', { x: this.x, y: this.y }); yield 0.4; for (let i = 0; i < n; i++) { w.tele.push(new Column(w, p.x + U.rr(-20, 20) + p.vx * 0.4, p.y + U.rr(-12, 12) + p.vy * 0.4, { r: 15, wind: 0.8, dmg: 14 })); yield 0.38; } yield 0.7; this.setPose('idle'); }
    beginStagEnding() { this.invuln = true; this.state = 'kneel'; this.pose = 'kneel'; this.w.tele.forEach((t) => (t.dead = true)); this.gen = (function* () { while (true) yield 1; })(); this.w.G.slowmo = 0.8; setTimeout(() => { AH.G.dialogueStart('stag_end'); }, 700); }
    /* ----- drawing ----- */
    sprite() {
      const A = AH.Art; if (this.type === 'stag') { return this.pose === 'paw' || this.state === 'windup' ? A.stag.paw : this.moving || this.state === 'attack' ? A.stag.walk[Math.floor(this.walkT) % 4] : A.stag.stand; }
      return this.pose === 'raise' ? A.boss.raise : this.pose === 'slam' ? A.boss.slam : this.pose === 'kneel' ? A.boss.kneel : A.boss.idle[Math.floor(this.w.time * 1.4) % 2];
    }
    draw(g, cam, time) {
      if (this.dormant) return; const spr = this.sprite(); const sx = this.x - cam.x, sy = this.y - cam.y; let ox = 0;
      if (this.state === 'phase') ox = Math.sin(time * 70) * 1.2; if (this.pose === 'raise') ox += Math.sin(time * 40) * 0.5;
      g.globalAlpha = this.invuln ? 0.7 + Math.sin(time * 30) * 0.15 : 1;
      S.draw(g, spr, sx + ox, sy - (this.type === 'choirmaster' ? Math.sin(time * 1.5) * 1.5 : 0), { flip: this.type === 'stag' ? this.facing < 0 : false, flash: this.flash * 0.9 + (this.vulnerable ? 0.25 + Math.sin(time * 10) * 0.1 : 0) + (this.status.hex ? 0.15 : 0), flashColor: this.vulnerable && this.flash < 0.2 ? '#ffe090' : '#ffffff' });
      g.globalAlpha = 1;
    }
    shadow(g, cam) { const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y), rr = this.r + 2; g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x - rr, y - 1, rr * 2 + 1, 3); g.fillRect(x - rr + 2, y - 2, rr * 2 - 3, 1); g.fillRect(x - rr + 2, y + 2, rr * 2 - 3, 1); }
  }
  AH.Boss = Boss;
})();

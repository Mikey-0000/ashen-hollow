/* Ashen Hollow - enemies: perception (sight cones, hearing), attack tokens, telegraphed attacks and per-type behaviour.
   Everything dangerous announces itself: a ground telegraph and a distinct pose precede every damaging frame. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, S = AH.Sprites, Co = AH.Combat;

  /* ---------- ground telegraphs ---------- */
  class Tele {
    constructor(o) { Object.assign(this, { t: 0, dur: 0.6, shape: 'circle', x: 0, y: 0, ang: 0, range: 24, arc: 1.4, col: '#d03030', dead: false, follow: null }, o); }
    update(dt) { this.t += dt; if (this.follow && !this.follow.dead) { this.x = this.follow.x; this.y = this.follow.y; if (this.follow.aimA !== undefined && this.shape !== 'circle') this.ang = this.follow.aimA; } if (this.t >= this.dur + 0.04 || (this.follow && this.follow.dead)) this.dead = true; }
    draw(g, cam, time) {
      const k = Math.min(1, this.t / this.dur), x = this.x - cam.x, y = this.y - cam.y; g.save(); g.translate(Math.round(x), Math.round(y)); g.scale(1, 0.62); g.globalAlpha = 0.18 + 0.32 * k; g.fillStyle = this.col;
      if (this.shape === 'circle') { g.beginPath(); g.arc(0, 0, this.range, 0, 6.3); g.fill(); g.globalAlpha = 0.5 + 0.5 * k; g.strokeStyle = '#ff7060'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, this.range * k, 0, 6.3); g.stroke(); g.beginPath(); g.arc(0, 0, this.range, 0, 6.3); g.stroke(); }
      else if (this.shape === 'cone') { g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, this.range, this.ang - this.arc / 2, this.ang + this.arc / 2); g.closePath(); g.fill(); g.globalAlpha = 0.5 + 0.5 * k; g.strokeStyle = '#ff7060'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, this.range * k, this.ang - this.arc / 2, this.ang + this.arc / 2); g.closePath(); g.stroke(); }
      else if (this.shape === 'line') { g.rotate(this.ang); g.fillRect(0, -this.arc / 2, this.range, this.arc); g.globalAlpha = 0.5 + 0.5 * k; g.fillStyle = '#ff7060'; g.fillRect(0, -1, this.range * k, 2); }
      g.restore(); g.globalAlpha = 1;
    }
  }
  AH.Tele = Tele;

  /* ---------- enemy projectiles (orbs, hex bolts, bone shards) ---------- */
  class EProj {
    constructor(w, o) { Object.assign(this, { w, x: 0, y: 0, vx: 0, vy: 0, r: 4, dmg: 8, life: 3, color: '#a8c0ff', home: 0, dead: false, z: 8, light: 40, slow: 0, wave: 0, t: 0, src: null, bleed: false, seed: Math.random() * 9 }, o); }
    update(dt) {
      this.t += dt; this.life -= dt; const p = this.w.G.player;
      if (this.home && !p.dead) { const a = Math.atan2(p.y - 8 - this.y, p.x - this.x), c = Math.atan2(this.vy, this.vx), sp = Math.hypot(this.vx, this.vy); const na = c + U.clamp(U.angDiff(a, c), -this.home * dt, this.home * dt); this.vx = Math.cos(na) * sp; this.vy = Math.sin(na) * sp; }
      this.x += this.vx * dt; this.y += this.vy * dt; if (this.life <= 0 || this.w.solidAt(this.x, this.y)) { this.dead = true; AH.Particles.magic(this.x, this.y - 6, 5, this.color); return; }
      if (AH.Particles.density > 0 && Math.random() < 0.6) AH.Particles.emit({ x: this.x, y: this.y - this.z, vx: U.rr(-6, 6), vy: U.rr(-6, 6), life: 0.35, col: this.color, size: 1, add: true });
      if (U.dist(this.x, this.y, p.x, p.y - 8) < this.r + 5 && !p.dead) { if (p.hurt(this.dmg, Math.atan2(this.vy, this.vx), this.src, { attack: true, kb: 90, slow: this.slow, bleed: this.bleed })) this.dead = true; }
      /* thralls and wards intercept */
      this.w.allies.forEach((a) => { if (!this.dead && !a.dead && U.dist(a.x, a.y - 6, this.x, this.y) < a.r + 3) { a.receive(this.dmg, { ang: Math.atan2(this.vy, this.vx) }); this.dead = true; AH.Particles.magic(this.x, this.y - 6, 5, this.color); } });
    }
    draw(g, cam, time) {
      const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y - this.z); g.fillStyle = this.color; g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5; g.fillRect(x - 3, y - 3, 6, 6); g.globalAlpha = 1; g.fillRect(x - 1, y - 1, 3, 3); g.fillStyle = '#ffffff'; g.fillRect(x, y, 1, 1); g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(Math.round(this.x - cam.x) - 1, Math.round(this.y - cam.y), 3, 1);
    }
  }
  AH.EProj = EProj;

  /* ---------- the Enemy ---------- */
  class Enemy {
    constructor(world, def, tx, ty, o) {
      o = o || {}; this.w = world; this.def = def; this.type = def.id; this.key = def.id + '@' + tx + ',' + ty; this.x = (tx + 0.5) * AH.T; this.y = (ty + 1) * AH.T - 3; this.home = { x: this.x, y: this.y }; this.r = def.r;
      this.hp = def.hp; this.maxHp = def.hp; this.status = {}; this.state = 'idle'; this.st = 0; this.vx = 0; this.vy = 0; this.knock = { x: 0, y: 0 }; this.facing = 1; this.ang = 0; this.aimA = 0; this.seed = Math.random() * 100;
      this.dead = false; this.remove = false; this.dormant = !!o.dormant; this.sleeping = !!o.sleeps; this.ally = !!def.ally; this.id = o.id; this.alertT = 0; this.lastSeen = null; this.wander = 0; this.perc = Math.random(); this.cd = U.rr(0.5, 2); this.flash = 0; this.stagT = 0; this.sortY = this.y;
      this.att = null; this.when = o.when; this.fade = o.fadeIn ? 0 : 1; this.walkT = Math.random() * 4; this.hasToken = false; this.circleDir = Math.random() < 0.5 ? 1 : -1; this.spawnKey = o.key; this.lightR = 0; this.lightCol = '#fff';
      if (def.id === 'wisp') { this.lightR = 50; this.lightCol = '#8fb0ff'; this.bob = Math.random() * 6; }
      if (def.id === 'wraith') { this.lightR = 34; this.lightCol = '#a8c0e0'; }
      if (def.id === 'hexcaller') { this.lightR = 0; }
      this.vulnerable = false;
    }
    alert(t) { if (this.dead || this.dormant) return; this.sleeping = false; if (this.state === 'idle' || this.state === 'search') { this.state = 'chase'; this.st = 0; AH.Audio.sfx(this.type === 'hound' ? 'howl' : 'growl', { x: this.x, y: this.y, v: 0.7 }); this.w.spawnFx({ k: 'text', x: this.x, y: this.y - this.def.h - 6, text: '!', col: '#ff6050', t: 0, max: 0.5 }); } this.alertT = 7; this.lastSeen = { x: t.x, y: t.y }; }
    heard(x, y, src) { if (this.dead || this.dormant || this.state === 'chase' || this.state === 'windup' || this.state === 'attack') return; if (this.sleeping && src !== 'bell' && src !== 'swing') { if (U.dist(x, y, this.x, this.y) > 46) return; } this.sleeping = false; this.state = 'search'; this.st = 0; this.lastSeen = { x, y }; this.alertT = 5; }
    guarding(ang) { if (!this.def.guard || this.state === 'recover' || this.state === 'stagger' || this.state === 'attack' || this.stagT > 0) return false; const front = Math.atan2(this.w.G.player.y - this.y, this.w.G.player.x - this.x); return Math.abs(U.angDiff(front, ang + Math.PI)) < 1.15 || Math.abs(U.angDiff(this.ang, ang + Math.PI)) < 1.0; }
    shove(ang, f) { if (this.def.boss) f *= 0.15; else if (this.def.r > 6) f *= 0.6; this.knock.x += Math.cos(ang) * f; this.knock.y += Math.sin(ang) * f; }
    stagger(t) { if (this.def.boss || this.state === 'windup' && this.def.id === 'sentinel') return; if (this.def.boss) return; this.stagT = Math.max(this.stagT, t); if (this.state === 'windup' || this.state === 'attack') { this.state = 'chase'; this.att = null; this.cleanTele(); } this.flash = 1; }
    cleanTele() { if (this.tele) { this.tele.dead = true; this.tele = null; } }
    receive(dmg, o) {
      this.hp -= dmg; this.flash = 1; if (!this.dormant) { this.alertT = 7; if (this.state === 'idle' || this.state === 'search') { this.state = 'chase'; this.st = 0; } this.sleeping = false; }
      if (this.hp <= 0) this.die(o);
    }
    dotDamage(d, k) { this.hp -= d; this.flash = 0.4; if (k === 'bleed') AH.Particles.blood(this.x, this.y - 8, 1, Math.PI / 2); if (k === 'poison') AH.Particles.magic(this.x, this.y - 10, 1, '#8fd06a'); if (this.hp <= 0) this.die({}); }
    die(o) {
      if (this.dead) return; this.dead = true; const G = this.w.G, p = G.player, def = this.def, w = this.w; this.cleanTele();
      AH.Audio.sfx(def.mat === 'spirit' ? 'wail' : def.mat === 'bone' ? 'hit_bone' : 'die', { x: this.x, y: this.y }); this.w.addShake(def.boss ? 4 : 1.5);
      if (def.mat === 'flesh') AH.Particles.blood(this.x, this.y - 8, 16, o && o.ang || 0); else if (def.mat === 'bone') AH.Particles.bones(this.x, this.y - 10, 12, o && o.ang || 0); else AH.Particles.magic(this.x, this.y - 12, 14, '#a8c0ff');
      if (this.ally) { this.remove = true; return; }
      G.kills++; G.seen[this.type] = (G.seen[this.type] || 0) + 1; if (def.xp) G.addXP(def.xp);
      /* necromancy: souls from the fallen (undead give none) */
      if (p.schools.necro && !def.undead) { let n = def.souls || 0; if (Math.random() < p.mod('soulChance')) n++; if (this.status.mark) n++; if (n > 0) { p.souls = Math.min(p.soulMax(), p.souls + n); AH.Audio.sfx('soul', { x: this.x, y: this.y }); for (let i = 0; i < n; i++) AH.Particles.emit({ x: this.x, y: this.y - 10, vx: U.rr(-18, 18), vy: -26 - i * 4, life: 0.8, col: '#7fe0c0', size: 2, add: true, grav: -20, toward: p }); } }
      if (p.schools.blood && def.mat === 'flesh') p.heal(2, true);
      def.drops.forEach((d) => { if (Math.random() < d.p) w.spawnPickup(this.x + U.rr(-6, 6), this.y + U.rr(-3, 3), d.id, 1); });
      if (Math.random() < 0.08 && def.mat === 'flesh') w.spawnPickup(this.x, this.y, 'raven_feather', 1);
      if (def.corpse) w.corpses.push({ x: this.x, y: this.y, t: 0, type: this.type, def, flip: this.facing < 0, draw: (g, cam) => this.drawCorpse(g, cam) });
      if (this.spawnKey && !def.boss) w.state.killed[this.spawnKey] = G.day;
      /* hexed foes pass the curse on */
      if (this.status.hex) { const nx = w.enemies.filter((e) => e !== this && !e.dead && !e.status.hex && !e.ally).sort((a, b) => U.dist(a.x, a.y, this.x, this.y) - U.dist(b.x, b.y, this.x, this.y))[0]; if (nx && U.dist(nx.x, nx.y, this.x, this.y) < 120) { nx.status.hex = { t: 8 }; AH.Particles.magic(nx.x, nx.y - 10, 8, '#c27be0'); } }
      if (def.boss) AH.Events.onBossDeath(w, this);
      this.deathT = 0;
      /* delay removal for body fade */
      this.remove = true;
    }
    drawCorpse(g, cam) {
      const spr = this.sprite(); if (!spr) return; g.save(); g.translate(Math.round(this.x - cam.x), Math.round(this.y - cam.y - 2)); g.rotate(this.facing < 0 ? -Math.PI / 2 : Math.PI / 2); g.globalAlpha = 0.85; g.drawImage(spr.c, -spr.ax, -spr.ay + 2); g.globalAlpha = 1; g.restore();
    }
    /* ---------- perception ---------- */
    canSee(p) {
      if (p.dead) return false; const d = U.dist(this.x, this.y, p.x, p.y), range = this.def.sight * AH.Weather.sightMult() * (this.w.G.isNight() && this.def.id !== 'wisp' && this.def.id !== 'hound' ? 0.9 : 1) * (p.state === 'dodge' ? 0.8 : 1);
      if (d > range) return false; if (d > 26) { const toP = Math.atan2(p.y - this.y, p.x - this.x); if (Math.abs(U.angDiff(toP, this.ang)) > 1.3 && this.state === 'idle') return false; }
      return this.w.los(this.x, this.y - 8, p.x, p.y - 8);
    }
    /* ---------- update ---------- */
    update(dt) {
      if (this.dead) return; const w = this.w, G = w.G, p = G.player, def = this.def; this.st += dt; this.sortY = this.y; this.flash = Math.max(0, this.flash - dt * 5); this.walkT += dt * 6;
      if (this.fade < 1) this.fade = Math.min(1, this.fade + dt * 0.8);
      if (this.dormant) return;
      Co.statusTick(this, dt); if (this.dead) return;
      /* knockback */
      if (Math.abs(this.knock.x) + Math.abs(this.knock.y) > 2) { w.moveEnt(this, this.knock.x * dt, this.knock.y * dt); this.knock.x *= Math.pow(0.0008, dt); this.knock.y *= Math.pow(0.0008, dt); }
      if (this.stagT > 0) { this.stagT -= dt; return; }
      if (this.status.root) { this.perceive(dt, p); return; }
      let spdK = this.status.slow ? this.status.slow.k : 1; if (def.id === 'wretch') spdK *= G.isNight() ? 1.18 : 0.85; if (def.id === 'wisp') spdK *= AH.Lighting.daylight(G.hour) > 0.6 ? 0.5 : 1; if (this.ally) spdK = 1;
      this.spd = def.speed * spdK; this.cd -= dt; this.alertT -= dt;
      const hasAI = AH.AI[this.type]; if (hasAI) hasAI(this, dt, p, w); else AH.AI.generic(this, dt, p, w);
      if (this.hasToken && this.state !== 'windup' && this.state !== 'attack' && this.state !== 'recover') { this.hasToken = false; w.tokens = w.tokens.filter((t) => t !== this); }
      if (this.status.poison && def.id === 'wisp') this.hp -= dt;
    }
    perceive(dt, p) {
      this.perc -= dt; if (this.perc > 0) return; this.perc = 0.15 + Math.random() * 0.1;
      if (this.sleeping) { if (U.dist(this.x, this.y, p.x, p.y) < 24) this.alert(p); return; }
      /* crows & familiar draw attention first */
      if (this.canSee(p)) { this.lastSeen = { x: p.x, y: p.y }; this.alertT = 6; if (this.state === 'idle' || this.state === 'search') this.alert(p); this.propagate(p); }
    }
    propagate(p) { if (this.propT > this.w.time - 3) return; this.propT = this.w.time; this.w.enemies.forEach((e) => { if (e !== this && !e.dead && !e.ally && !e.dormant && !e.sleeping && e.state === 'idle' && U.dist(e.x, e.y, this.x, this.y) < 60 && e.def.id !== 'wisp') e.alert(p); }); }
    moveToward(tx, ty, spd, dt, avoid) {
      let dx = tx - this.x, dy = ty - this.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      /* steer around obstacles with a short probe */
      if (!this.def.flies) { const probe = 9; if (this.w.solidAt(this.x + dx * probe, this.y + dy * probe)) { const side = this.circleDir; const rx = -dy * side, ry = dx * side; if (!this.w.solidAt(this.x + rx * probe, this.y + ry * probe)) { dx = rx; dy = ry; } else if (!this.w.solidAt(this.x - rx * probe, this.y - ry * probe)) { dx = -rx; dy = -ry; } else { this.circleDir *= -1; } } }
      const ox = this.x, oy = this.y; if (this.def.flies) { this.x += dx * spd * dt; this.y += dy * spd * dt; } else { this.w.moveEnt(this, dx * spd * dt, 0); this.w.moveEnt(this, 0, dy * spd * dt); }
      this.ang = Math.atan2(dy, dx); if (Math.abs(dx) > 0.25) this.facing = dx < 0 ? -1 : 1;
      /* separate from other enemies */
      this.w.enemies.forEach((e) => { if (e !== this && !e.dead && !e.dormant) { const dd = U.dist(e.x, e.y, this.x, this.y); if (dd < this.r + e.r && dd > 0.01) { const k = (this.r + e.r - dd) * 0.5; this.x += (this.x - e.x) / dd * k * 0.3; this.y += (this.y - e.y) / dd * k * 0.3; } } });
      return U.dist(ox, oy, this.x, this.y);
    }
    /* telegraphed attack: windup (pose + ground marker), strike, recover */
    beginAttack(att) {
      this.att = att; this.state = 'windup'; this.st = 0; this.hasToken = true; const p = this.w.G.player; this.aimA = Math.atan2(p.y - this.y, p.x - this.x); this.ang = this.aimA; if (Math.cos(this.aimA) !== 0) this.facing = Math.cos(this.aimA) < 0 ? -1 : 1;
      this.tele = new Tele({ shape: att.shape, x: this.x, y: this.y, ang: this.aimA, range: att.range, arc: att.arc, dur: att.wind, col: att.col || '#d03030', follow: att.track ? this : null });
      if (att.shape !== 'circle' && att.track === undefined) this.tele.follow = null; this.w.tele.push(this.tele); AH.Audio.sfx('telegraph', { x: this.x, y: this.y, v: 0.6 });
    }
    strike() {
      const a = this.att, w = this.w, p = w.G.player; this.state = 'attack'; this.st = 0; this.cleanTele();
      if (a.shape === 'proj') { const n = a.n || 1; for (let i = 0; i < n; i++) { const ang = this.aimA + (i - (n - 1) / 2) * (a.spread || 0.25); w.projectiles.push(new EProj(w, { x: this.x, y: this.y, vx: Math.cos(ang) * a.speed, vy: Math.sin(ang) * a.speed, dmg: a.dmg, color: a.color, home: a.home || 0, src: this, slow: a.slow || 0, z: this.def.h * 0.6 })); } AH.Audio.sfx('wisp_fire', { x: this.x, y: this.y }); return; }
      if (a.lunge) { this.lv = { x: Math.cos(this.aimA) * a.lunge, y: Math.sin(this.aimA) * a.lunge }; }
      this.hitDone = false; AH.Audio.sfx(a.sfx || 'swing', { x: this.x, y: this.y });
    }
    checkHit() {
      const a = this.att, w = this.w, p = w.G.player; if (this.hitDone || p.dead) return; const d = U.dist(this.x, this.y, p.x, p.y); let hit = false;
      if (a.shape === 'cone') hit = d < a.range + 3 && Math.abs(U.angDiff(Math.atan2(p.y - this.y, p.x - this.x), this.aimA)) < a.arc / 2 + 0.1; else if (a.shape === 'circle') hit = d < a.range + 3; else if (a.shape === 'line') { const rel = U.angDiff(Math.atan2(p.y - this.y, p.x - this.x), this.aimA); hit = d < a.range + 6 && Math.abs(Math.sin(rel) * d) < a.arc / 2 + 3 && Math.cos(rel) > 0; }
      if (hit && p.hurt(a.dmg, Math.atan2(p.y - this.y, p.x - this.x), this, { attack: true, kb: a.kb || 130, bleed: a.bleed })) { this.hitDone = true; if (this.def.mat === 'bone') AH.Audio.sfx('hit_bone', { x: p.x, y: p.y }); }
      if (a.shape === 'circle' && !this.slamFx) { this.slamFx = true; w.addShake(2.5); AH.Particles.dust(this.x, this.y, 10); AH.Particles.ringBurst(this.x, this.y, a.range, '#c8b898', 0.4); AH.Audio.sfx('hit_stone', { x: this.x, y: this.y }); }
    }
    sprite() {
      const A = AH.Art, d = this.def.id, t = this.walkT;
      switch (d) {
        case 'wretch': case 'thrall': return this.state === 'windup' ? A.wretch.wind : this.state === 'attack' ? A.wretch.lunge : (Math.hypot(this.vx, this.vy) > 4 || this.moving) ? A.wretch.walk[Math.floor(t) % 4] : A.wretch.stand;
        case 'hound': return this.state === 'windup' ? A.hound.crouch : this.state === 'attack' ? A.hound.air : this.moving ? A.hound.run[Math.floor(t * 1.6) % 4] : A.hound.stand;
        case 'wisp': return A.wisp[Math.floor(t * 0.7) % 6];
        case 'sentinel': return this.state === 'windup' || (this.state === 'attack') ? A.sentinel.slam : this.moving ? A.sentinel.walk[Math.floor(t * 0.6) % 4] : A.sentinel.stand;
        case 'wraith': return A.wraith[Math.floor(t * 0.7) % 4];
        case 'hexcaller': return A.npc.hexcaller.down[Math.floor(t * 0.3) % 3 && this.moving ? 1 + (Math.floor(t * 0.5) % 2) : 0];
        case 'stag': return this.state === 'windup' ? A.stag.paw : this.moving ? A.stag.walk[Math.floor(t * 0.7) % 4] : A.stag.stand;
        default: return A.wretch.stand;
      }
    }
    shadow(g, cam) { const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y), rr = Math.max(3, this.r); g.fillStyle = 'rgba(0,0,0,' + 0.3 * this.fade + ')'; g.fillRect(x - rr, y - 1, rr * 2 + 1, 3); g.fillRect(x - rr + 1, y - 2, rr * 2 - 1, 1); }
    draw(g, cam, time) {
      const spr = this.sprite(); if (!spr) return; const def = this.def; let sx = this.x - cam.x, sy = this.y - cam.y, alpha = this.fade;
      if (def.id === 'wisp') { sy -= 14 + Math.sin(time * 2.4 + this.seed) * 3; alpha *= 0.55 + 0.45 * (1 - AH.Lighting.daylight(this.w.G.hour) * 0.7); }
      if (def.id === 'wraith') { sy -= 6 + Math.sin(time * 3 + this.seed) * 2; alpha *= 0.8; }
      if (this.status.root) sx += Math.sin(time * 60) * 0.6;
      if (this.sleeping) { sy += 1; alpha *= 0.95; }
      let shear = null; if (this.state === 'windup') { const k = this.st / (this.att ? this.att.wind : 1); sx -= Math.cos(this.aimA) * 2 * k; }
      if (this.ally) { g.globalAlpha = alpha * 0.85; S.draw(g, spr, sx, sy, { flip: this.facing < 0, flash: 0.3, flashColor: '#7fe0c0' }); g.globalAlpha = 1; return; }
      g.globalAlpha = alpha; S.draw(g, spr, sx, sy, { flip: this.facing < 0, flash: this.flash * 0.9 + (this.status.hex ? 0.15 + Math.sin(time * 8) * 0.1 : 0) + (this.vulnerable ? 0.2 : 0), flashColor: this.status.hex ? '#c27be0' : this.flash > 0.2 ? '#ffffff' : this.vulnerable ? '#ffe090' : '#ffffff' });
      if (this.status.poison) { g.globalAlpha = 0.25; S.draw(g, spr, sx, sy, { flip: this.facing < 0, flash: 1, flashColor: '#8fd06a' }); }
      g.globalAlpha = 1;
      /* health bar only when hurt */
      if (this.hp < this.maxHp && !def.boss) { const bw = 14, bx = Math.round(sx - bw / 2), by = Math.round(sy - def.h - 5); g.fillStyle = '#0b0910'; g.fillRect(bx - 1, by - 1, bw + 2, 4); g.fillStyle = '#4a1218'; g.fillRect(bx, by, bw, 2); g.fillStyle = '#c03040'; g.fillRect(bx, by, Math.max(1, Math.round(bw * this.hp / this.maxHp)), 2); }
      if (this.status.hex) { g.fillStyle = '#c27be0'; g.fillRect(Math.round(sx) - 1, Math.round(sy - def.h - 9 - Math.sin(time * 5)), 3, 3); }
    }
  }

  /* ---------- behaviours ---------- */
  const AI = (AH.AI = {});
  const ATK = {
    wretch: () => ({ shape: 'cone', range: 24, arc: 1.7, wind: 0.62, act: 0.14, rec: 0.7, dmg: AH.EnemyDefs.wretch.dmg, lunge: 55, kb: 120, sfx: 'swing' }),
    hound: () => ({ shape: 'line', range: 62, arc: 12, wind: 0.5, act: 0.3, rec: 0.75, dmg: AH.EnemyDefs.hound.dmg, lunge: 215, kb: 150, bleed: true, sfx: 'growl', col: '#d04030' }),
    sentinel: () => ({ shape: 'circle', range: 34, wind: 0.95, act: 0.18, rec: 1.2, dmg: AH.EnemyDefs.sentinel.dmg, kb: 190, sfx: 'swing_heavy' }),
    wraith: () => ({ shape: 'line', range: 70, arc: 10, wind: 0.38, act: 0.28, rec: 0.6, dmg: AH.EnemyDefs.wraith.dmg, lunge: 230, kb: 80, sfx: 'wail' }),
    wisp: () => ({ shape: 'proj', wind: 0.55, act: 0.1, rec: 0.9, dmg: AH.EnemyDefs.wisp.dmg, speed: 78, color: '#a8c0ff', home: 0.9, range: 0, col: '#6080d0' }),
    hexcaller: () => ({ shape: 'proj', wind: 0.6, act: 0.1, rec: 1.0, dmg: AH.EnemyDefs.hexcaller.dmg, speed: 100, color: '#c27be0', slow: 2, n: 1, range: 0, col: '#a050c0' }),
  };
  function grabToken(e) { const w = e.w; if (e.hasToken) return true; w.tokens = w.tokens.filter((t) => !t.dead); if (w.tokens.length >= 2) return false; w.tokens.push(e); e.hasToken = true; return true; }
  function attackPhases(e, dt, w, p) {
    const a = e.att;
    if (e.state === 'windup') { e.vx = e.vy = 0; if (a.track) e.aimA = Math.atan2(p.y - e.y, p.x - e.x); if (e.st >= a.wind) e.strike(); return true; }
    if (e.state === 'attack') {
      if (e.lv) { w.moveEnt(e, e.lv.x * dt, 0); w.moveEnt(e, 0, e.lv.y * dt); if (e.def.flies) { e.x += 0; } }
      if (a.shape !== 'proj') e.checkHit(); if (e.st >= a.act) { e.state = 'recover'; e.st = 0; e.lv = null; e.slamFx = false; e.vulnerable = e.def.id === 'sentinel'; } return true;
    }
    if (e.state === 'recover') { if (e.st >= a.rec) { e.state = 'chase'; e.st = 0; e.hasToken = false; w.tokens = w.tokens.filter((t) => t !== e); e.vulnerable = false; e.cd = U.rr(0.6, 1.6); } return true; }
    return false;
  }
  function idleBehaviour(e, dt, p, w) {
    e.perceive(dt, p); e.moving = false;
    if (e.state === 'search') { if (e.lastSeen) { const d = e.moveToward(e.lastSeen.x, e.lastSeen.y, e.spd * 0.8, dt); e.moving = d > 0.05; if (U.dist(e.x, e.y, e.lastSeen.x, e.lastSeen.y) < 8 || e.st > 6) { e.state = 'idle'; e.st = 0; } } else e.state = 'idle'; return true; }
    if (e.state === 'idle') {
      e.wander -= dt; if (e.sleeping) return true;
      if (e.wander <= 0) { e.wander = U.rr(2, 5); e.wp = Math.random() < 0.6 ? { x: e.home.x + U.rr(-36, 36), y: e.home.y + U.rr(-28, 28) } : null; }
      if (e.wp) { const d = e.moveToward(e.wp.x, e.wp.y, e.spd * 0.35, dt); e.moving = d > 0.02; if (U.dist(e.x, e.y, e.wp.x, e.wp.y) < 4) e.wp = null; }
      return true;
    }
    return false;
  }
  function losePlayer(e, p, w) { if (e.alertT <= 0) { e.state = 'search'; e.st = 0; } if (p.dead) { e.state = 'idle'; } }

  AI.generic = function (e, dt, p, w) { /* wretch, thrall-less melee brawlers */
    if (e.ally) return AI.thrall(e, dt, p, w);
    if (attackPhases(e, dt, w, p)) return; if (idleBehaviour(e, dt, p, w)) return;
    if (e.canSee(p)) { e.lastSeen = { x: p.x, y: p.y }; e.alertT = 6; e.propagate(p); } if (e.alertT <= 0) return losePlayer(e, p, w);
    const d = U.dist(e.x, e.y, p.x, p.y), atk = ATK[e.type] && ATK[e.type]();
    e.moving = true;
    if (e.state === 'chase') {
      if (atk && d < (atk.range * (atk.shape === 'line' ? 0.6 : 0.85)) + 6 && e.cd <= 0 && grabToken(e)) { e.beginAttack(Object.assign(atk, { track: true })); return; }
      /* circle at range if no token (pack tactics) */
      if (!e.hasToken && d < 70 && w.tokens.length >= 2) { const a = Math.atan2(e.y - p.y, e.x - p.x) + e.circleDir * 0.6; e.moveToward(p.x + Math.cos(a) * 52, p.y + Math.sin(a) * 52, e.spd, dt); return; }
      e.moveToward(p.x, p.y, e.spd, dt);
    }
  };
  AI.wretch = AI.generic;
  AI.hound = function (e, dt, p, w) {
    if (attackPhases(e, dt, w, p)) return; if (idleBehaviour(e, dt, p, w)) return;
    if (e.canSee(p)) { e.lastSeen = { x: p.x, y: p.y }; e.alertT = 6; e.propagate(p); } if (e.alertT <= 0) return losePlayer(e, p, w);
    const d = U.dist(e.x, e.y, p.x, p.y); e.moving = true;
    if (e.cd <= 0 && d < 110 && d > 30 && grabToken(e)) { e.beginAttack(Object.assign(ATK.hound(), { track: false })); return; }
    /* circle the prey, keeping distance until the pack's turn comes */
    const a = Math.atan2(e.y - p.y, e.x - p.x) + e.circleDir * 0.35; const want = d > 80 ? 60 : 52; e.moveToward(p.x + Math.cos(a) * want, p.y + Math.sin(a) * want, e.spd * (d > 80 ? 1.2 : 0.8), dt);
  };
  AI.wisp = function (e, dt, p, w) {
    if (attackPhases(e, dt, w, p)) return; e.perceive(dt, p); e.moving = true;
    if (e.state === 'idle' || e.state === 'search') { e.wander -= dt; if (e.wander <= 0) { e.wander = U.rr(1.5, 4); e.wp = { x: e.home.x + U.rr(-50, 50), y: e.home.y + U.rr(-40, 40) }; } if (e.wp) e.moveToward(e.wp.x, e.wp.y, e.spd * 0.3, dt); if (e.state === 'search' && e.st > 4) e.state = 'idle'; return; }
    if (e.canSee(p)) { e.alertT = 6; e.lastSeen = { x: p.x, y: p.y }; } if (e.alertT <= 0) return losePlayer(e, p, w);
    const d = U.dist(e.x, e.y, p.x, p.y); if (d < 52) { e.moveToward(e.x + (e.x - p.x), e.y + (e.y - p.y), e.spd, dt); } else if (d > 92) e.moveToward(p.x, p.y, e.spd, dt); else { const a = Math.atan2(e.y - p.y, e.x - p.x) + 0.5 * e.circleDir; e.moveToward(p.x + Math.cos(a) * 72, p.y + Math.sin(a) * 72, e.spd * 0.7, dt); }
    if (e.cd <= 0 && d < 130 && w.los(e.x, e.y, p.x, p.y)) { e.beginAttack(Object.assign(ATK.wisp(), { track: true })); e.cd = U.rr(2.2, 3.4); }
  };
  AI.sentinel = function (e, dt, p, w) {
    if (attackPhases(e, dt, w, p)) return; if (idleBehaviour(e, dt, p, w)) return;
    if (e.canSee(p)) { e.lastSeen = { x: p.x, y: p.y }; e.alertT = 6; e.propagate(p); } if (e.alertT <= 0) return losePlayer(e, p, w);
    const d = U.dist(e.x, e.y, p.x, p.y); e.moving = true; e.ang = Math.atan2(p.y - e.y, p.x - e.x); e.facing = Math.cos(e.ang) < 0 ? -1 : 1;
    if (d < 30 && e.cd <= 0 && grabToken(e)) { e.beginAttack(Object.assign(ATK.sentinel(), { track: false })); return; }
    e.moveToward(p.x, p.y, d < 38 ? e.spd * 0.3 : e.spd, dt);
  };
  AI.wraith = function (e, dt, p, w) {
    if (attackPhases(e, dt, w, p)) return; e.perceive(dt, p); e.moving = true;
    if (e.state === 'idle' || e.state === 'search') { e.wander -= dt; if (e.wander <= 0) { e.wander = U.rr(1, 3); e.wp = { x: e.home.x + U.rr(-60, 60), y: e.home.y + U.rr(-40, 40) }; } if (e.wp) e.moveToward(e.wp.x, e.wp.y, e.spd * 0.4, dt); return; }
    if (e.canSee(p)) { e.alertT = 6; } const d = U.dist(e.x, e.y, p.x, p.y);
    if (e.cd <= 0 && d < 100 && grabToken(e)) { e.beginAttack(Object.assign(ATK.wraith(), { track: false })); e.def.flies && (e.cd = U.rr(1, 2)); return; }
    const a = Math.atan2(e.y - p.y, e.x - p.x) + e.circleDir * 0.5; e.moveToward(p.x + Math.cos(a) * 60, p.y + Math.sin(a) * 60, e.spd, dt);
  };
  AI.hexcaller = function (e, dt, p, w) {
    if (attackPhases(e, dt, w, p)) return; if (idleBehaviour(e, dt, p, w)) return;
    if (e.canSee(p)) { e.lastSeen = { x: p.x, y: p.y }; e.alertT = 6; e.propagate(p); } if (e.alertT <= 0) return losePlayer(e, p, w);
    const d = U.dist(e.x, e.y, p.x, p.y); e.moving = false; e.blinkCd = (e.blinkCd || 0) - dt;
    if (d < 30 && e.blinkCd <= 0) { /* cornered: blink away */ const a = Math.atan2(e.y - p.y, e.x - p.x); const q = w.nearestFree(e.x + Math.cos(a) * 70, e.y + Math.sin(a) * 70, 5); AH.Particles.magic(e.x, e.y - 10, 10, '#c27be0'); e.x = q[0]; e.y = q[1]; AH.Particles.magic(e.x, e.y - 10, 10, '#c27be0'); AH.Audio.sfx('whisper', { x: e.x, y: e.y }); e.blinkCd = 5; return; }
    if (d < 70) { e.moveToward(e.x + (e.x - p.x), e.y + (e.y - p.y), e.spd, dt); e.moving = true; } else if (d > 110) { e.moveToward(p.x, p.y, e.spd, dt); e.moving = true; }
    if (e.cd <= 0 && d < 140 && w.los(e.x, e.y, p.x, p.y)) { e.beginAttack(Object.assign(ATK.hexcaller(), { track: true })); e.cd = U.rr(2, 3); }
  };
  AI.thrall = function (e, dt, p, w) {
    e.life -= dt; if (e.life <= 0) { e.hp = 0; AH.Particles.bones(e.x, e.y - 8, 8, 0); w.giveAsh && 0; e.remove = true; AH.Audio.sfx('hit_bone', { x: e.x, y: e.y }); if (Math.random() < 0.5) w.spawnPickup(e.x, e.y, 'soul_ash', 1); return; }
    if (attackPhases(e, dt, w, p)) return;
    let tgt = null, bd = 140; w.enemies.forEach((q) => { if (!q.dead && !q.dormant && !q.ally && !q.def.boss || (q.def.boss && !q.dormant)) { const d = U.dist(e.x, e.y, q.x, q.y); if (d < bd && !q.dead && !q.ally) { bd = d; tgt = q; } } });
    e.moving = false; const berserk = p.buff.pact ? 1.3 : 1;
    if (tgt) { e.moving = true; if (bd < 20 && e.cd <= 0) { e.aimA = Math.atan2(tgt.y - e.y, tgt.x - e.x); e.facing = Math.cos(e.aimA) < 0 ? -1 : 1; AH.Combat.hit(tgt, e.dmgv * berserk, { src: e, ang: e.aimA, melee: true, school: 'necro', tags: ['necro'] }); tgt.shove(e.aimA, 80); AH.Audio.sfx('swing', { x: e.x, y: e.y }); e.cd = 0.9 / berserk; } else e.moveToward(tgt.x, tgt.y, e.def.speed * berserk, dt); }
    else { const d = U.dist(e.x, e.y, p.x, p.y); if (d > 36) { e.moving = true; e.moveToward(p.x + U.rr(-12, 12), p.y + U.rr(-8, 8), e.def.speed * (d > 90 ? 1.5 : 1), dt); } }
  };
  Enemy.prototype.receiveAlly = null;

  AH.Enemy = Enemy;
  AH.makeEnemy = function (world, type, tx, ty, o) {
    const def = AH.EnemyDefs[type]; if (type === 'stag' || type === 'choirmaster') return new AH.Boss(world, def, tx, ty, o);
    return new Enemy(world, def, tx, ty, o);
  };
  /* allies (thralls) reuse Enemy with ally = true; they take damage via receive() */
  AH.makeThrall = function (world, x, y, life, dmg) {
    const e = new Enemy(world, AH.EnemyDefs.thrall, 0, 0, {}); e.x = x; e.y = y; e.ally = true; e.life = life; e.dmgv = dmg; e.hp = e.maxHp = 40; e.sleeping = false; e.state = 'chase'; e.fade = 0.01; return e;
  };
})();

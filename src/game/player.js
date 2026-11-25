/* Ashen Hollow - the player: movement, 3-hit melee combo, dodge with i-frames and perfect-dodge slow motion,
   casting, discipline resources, corruption and derived stats. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, T = AH.T, Input = AH.Input, S = AH.Sprites;

  class Player {
    constructor(G) {
      this.G = G; this.x = 0; this.y = 0; this.vx = 0; this.vy = 0; this.r = 4; this.face = 0; this.aimA = 0; this.walkT = 0; this.stepD = 0; this.dead = false; this.def = { h: 20, mat: 'flesh', res: {}, undead: false };
      this.maxHp = 100; this.hp = 100; this.maxStam = 100; this.stam = 100; this.stamDelay = 0; this.souls = 0; this.verd = 0; this.aether = 0; this.corruption = 0; this.schools = {}; this.maxHpPerm = 0;
      this.state = 'move'; this.st = 0; this.combo = 0; this.comboT = 0; this.queued = false; this.hitSet = null; this.dashV = null; this.iframes = 0; this.hurtT = 0; this.hurtFlash = 0; this.flash = 0; this.invT = 0;
      this.cd = {}; this.buff = {}; this.castSpell = null; this.status = {}; this.lanternK = 1; this.sortY = 0; this.perfect = 0; this.lungeV = null; this.knock = { x: 0, y: 0 }; this.ghostT = 0; this.drawAng = 0;
      this.slow = 0; this.interactTarget = null; this.afterimages = []; this.regenT = 0; this.world = null; this.speedK = 1;
    }
    place(world, x, y, face) { this.world = world; this.x = x; this.y = y; this.face = face || 0; this.vx = this.vy = 0; this.state = 'move'; this.dashV = null; this.afterimages = []; this.aimA = [Math.PI / 2, -Math.PI / 2, Math.PI, 0][this.face]; }
    revive() { this.dead = false; this.hp = this.maxHp; this.stam = this.maxStam; this.state = 'move'; this.corruption = Math.max(0, this.corruption - 10); this.buff = {}; this.status = {}; this.invT = 2; }
    /* ---------- stats ---------- */
    mod(k) {
      const G = this.G; let v = 0; const add = (m) => { if (m && m[k]) v += m[k]; };
      ['weapon', 'cloak', 'relic1', 'relic2'].forEach((s) => { const it = AH.Items[G.equip[s]]; if (it) add(it.mods); });
      Object.keys(G.skills).forEach((id) => add(AH.Skills[id].mods));
      if (k === 'dmgSpell') v += this.corruption * 0.003; if (k === 'lantern') v -= this.corruption * 0.0015;
      return v;
    }
    flag(k) { return Object.keys(this.G.skills).some((id) => AH.Skills[id].flags && AH.Skills[id].flags[k]); }
    recalc() {
      const G = this.G, st = AH.Starts[G.origin] || { hp: 100 }; const ratio = this.maxHp ? this.hp / this.maxHp : 1;
      this.maxHp = Math.round(st.hp + 6 * (G.level - 1) + this.mod('maxHp') + (this.maxHpPerm || 0)); this.maxStam = Math.round(100 + this.mod('maxStam'));
      this.hp = U.clamp(this.hp > 0 ? this.maxHp * ratio : this.hp, 0, this.maxHp); this.stam = Math.min(this.stam, this.maxStam);
      this.souls = Math.min(this.souls, this.soulMax()); this.verd = Math.min(this.verd, this.verdMax()); this.aether = Math.min(this.aether, this.aetherMax());
    }
    soulMax() { return 8 + this.mod('soulCap'); } verdMax() { return 10 + this.mod('verdCap'); } aetherMax() { return 100 + this.mod('aetherCap'); }
    weapon() { return AH.Items[this.G.equip.weapon].w; }
    heal(n, quiet) { const b = this.hp; this.hp = Math.min(this.maxHp, this.hp + n); if (!quiet && this.hp > b) { AH.Particles.magic(this.x, this.y - 12, 6, '#d8ffd0'); this.world && this.world.spawnFx({ k: 'text', x: this.x, y: this.y - 24, text: '+' + Math.round(this.hp - b), col: '#9ae890', t: 0, max: 0.7 }); } }
    damageSelf(n) { this.hp = Math.max(1, this.hp - n); this.hurtFlash = 0.35; this.flash = 0.4; AH.Audio.sfx('hurt'); AH.Particles.blood(this.x, this.y - 10, 8, -Math.PI / 2); }
    aimVec() { return { x: Math.cos(this.aimA), y: Math.sin(this.aimA) }; }
    centerY() { return this.y - 10; }
    /* ---------- resource checks ---------- */
    costOf(sp) {
      const c = {}, G = this.G; Object.keys(sp.cost).forEach((k) => { let v = sp.cost[k]; if (k === 'hp') v = Math.max(1, Math.round(v * (1 + this.mod('hpCostMul')))); if (k === 'aether' && sp.id === 'astral_step') v = Math.round(v * (1 + this.mod('blinkCost'))); c[k] = v; });
      return c;
    }
    canPay(sp) {
      const c = this.costOf(sp); if (c.souls && this.souls < c.souls) return 'souls'; if (c.verd && this.verd < c.verd) return 'verdance'; if (c.aether && this.aether < c.aether) return 'aether';
      if (c.hp && this.hp <= c.hp + 1) return 'vitality'; if (c.hpTo && this.hp < 4) return 'vitality';
      if (c.reagent && !this.G.countItem(c.reagent)) return AH.Items[c.reagent].name.toLowerCase();
      if (sp.carrier === 'raise' && !this.world.corpses.some((q) => U.dist(q.x, q.y, this.x, this.y) < sp.p.range)) return 'corpse';
      return null;
    }
    pay(sp) {
      const c = this.costOf(sp);
      if (c.souls) this.souls -= c.souls; if (c.verd) this.verd -= c.verd; if (c.aether) this.aether -= c.aether;
      if (c.hp) { this.hp -= c.hp; this.hurtFlash = 0.1; AH.Particles.blood(this.x, this.y - 10, 4, 0); } if (c.hpTo) this.hp = 1;
      if (c.reagent && !(Math.random() < this.mod('reagentSave'))) this.G.takeItem(c.reagent, 1);
    }
    /* ---------- update ---------- */
    update(dt, w) {
      const G = this.G; this.world = w; this.sortY = this.y;
      if (this.dead) { this.st += dt; return; }
      for (const k in this.cd) if (this.cd[k] > 0) this.cd[k] -= dt;
      if (this.invT > 0) this.invT -= dt; this.flash = Math.max(0, this.flash - dt * 4); this.hurtFlash = Math.max(0, this.hurtFlash - dt);
      this.st += dt; this.stamDelay -= dt; this.iframes -= dt; this.perfect = Math.max(0, this.perfect - dt);
      Object.keys(this.buff).forEach((k) => { this.buff[k].t -= dt; if (this.buff[k].t <= 0) delete this.buff[k]; });
      ['slow'].forEach((k) => { if (this.status[k]) { this.status[k].t -= dt; if (this.status[k].t <= 0) delete this.status[k]; } });
      if (this.status.bleed) { this.status.bleed.t -= dt; this.hp -= this.status.bleed.dps * dt; if (this.status.bleed.t <= 0) delete this.status.bleed; if (this.hp <= 1) this.hp = 1; }
      this.regenResources(dt, w);
      this.lanternK = U.approach(this.lanternK, G.isDim() || w.def.indoor ? 1 : 0.85, dt * 0.5);
      const uiBlocked = G.screen || G.mode !== 'play' || G.fade.dir !== 0;
      const ax = uiBlocked ? { x: 0, y: 0 } : Input.axis();
      const moveLen = Math.hypot(ax.x, ax.y);
      /* aim: mouse when active, otherwise move direction / current facing */
      if (!uiBlocked) {
        if (Input.mouseActive()) { const m = Input.mouse; this.aimA = Math.atan2(m.y - (this.y - 10 - w.cam.y), m.x - (this.x - w.cam.x)); }
        else if (moveLen > 0.1) this.aimA = U.wrapAng(U.approachAng ? U.approachAng(this.aimA, Math.atan2(ax.y, ax.x), 14 * dt) : Math.atan2(ax.y, ax.x));
        if (moveLen > 0.1 && !Input.mouseActive()) this.aimA = Math.atan2(ax.y, ax.x);
      }
      /* selection of spell slots */
      if (!uiBlocked) {
        for (let i = 0; i < 8; i++) if (Input.pressed('slot' + (i + 1)) && G.slots[i]) { G.sel = i; AH.Audio.sfx('ui_move'); }
        if (Input.pressed('prev') || Input.pressed('next')) { const d = Input.pressed('next') ? 1 : -1; for (let k = 1; k <= 8; k++) { const i = (G.sel + d * k + 16) % 8; if (G.slots[i]) { G.sel = i; AH.Audio.sfx('ui_move'); break; } } }
      }
      switch (this.state) {
        case 'move': this.stMove(dt, w, ax, moveLen, uiBlocked); break;
        case 'attack': this.stAttack(dt, w, ax, moveLen, uiBlocked); break;
        case 'dodge': this.stDodge(dt, w); break;
        case 'cast': this.stCast(dt, w, ax, moveLen); break;
        case 'hurt': this.stHurt(dt, w); break;
        case 'dash': this.stDash(dt, w); break;
        case 'interact': this.state = 'move'; break;
      }
      /* knockback & slows apply on top */
      if (Math.abs(this.knock.x) + Math.abs(this.knock.y) > 1) { w.moveEnt(this, this.knock.x * dt, this.knock.y * dt); this.knock.x *= Math.pow(0.0005, dt); this.knock.y *= Math.pow(0.0005, dt); }
      this.afterimages.forEach((a) => (a.t -= dt)); this.afterimages = this.afterimages.filter((a) => a.t > 0);
      if (this.corruption >= 50 && Math.random() < dt * 4 * (this.corruption / 100)) AH.Particles.magic(this.x + U.rr(-6, 6), this.y - U.rr(2, 16), 1, this.corruption > 75 ? '#d0407a' : '#8a4aba');
      this.interactTarget = (uiBlocked || this.state !== 'move') ? null : AH.Interact.nearest(w, this);
      if (this.hp <= 0 && !this.dead) this.die();
      this.G.world.markExplored && 0;
    }
    regenResources(dt, w) {
      const G = this.G, tile = w.tileAt(this.x, this.y), inf = AH.Tiles.INFO[tile] || {};
      if (this.stamDelay <= 0) this.stam = Math.min(this.maxStam, this.stam + (36 + 36 * this.mod('stamRegen')) * dt * (this.state === 'move' ? 1 : 0.4));
      /* verdance: lives on grass, moss and in rain; dies on stone */
      if (this.schools.druid) {
        const green = inf.mat === 'grass' || tile === AH.Tiles.ID.MOSS || tile === AH.Tiles.ID.LEAVES; const rain = AH.Weather.rainK > 0.3 && !w.def.indoor;
        const k = (green ? 0.5 : 0) + (rain ? 0.35 : 0); this.regenT += dt * k * (1 + this.mod('verdRegen'));
        if (this.regenT > 1) { this.regenT = 0; this.verd = Math.min(this.verdMax(), this.verd + 1); }
        if (w.def.indoor || inf.mat === 'stone') { this.verdDecay = (this.verdDecay || 0) + dt; if (this.verdDecay > 3 && this.verd > 0) { this.verdDecay = 0; this.verd -= 1; } } else this.verdDecay = 0;
      }
      if (this.schools.astral) { const night = G.isNight() && !w.def.indoor ? 2 : 1; this.aether = Math.min(this.aetherMax(), this.aether + 3.2 * night * (1 + this.mod('aetherRegen')) * dt); }
    }
    dirFromAim() { return U.dir4FromAngle(this.aimA); }
    stMove(dt, w, ax, moveLen, blocked) {
      const G = this.G; let spd = 78 * (1 + this.mod('speed')); if (this.status.slow) spd *= this.status.slow.k; if (w.isWater(this.x, this.y + 2)) spd *= 0.7; if (this.state === 'move' && this.buff.sprint) spd *= 1.2;
      const tvx = ax.x * spd, tvy = ax.y * spd, k = 1 - Math.pow(0.0001, dt);
      this.vx += (tvx - this.vx) * k; this.vy += (tvy - this.vy) * k;
      if (moveLen > 0.1) { this.face = Math.abs(ax.x) > Math.abs(ax.y) + 0.1 ? (ax.x < 0 ? 2 : 3) : ax.y < 0 ? 1 : 0; if (Input.mouseActive() && !blocked) this.face = this.dirFromAim(); }
      else if (!blocked && Input.mouseActive()) this.face = this.dirFromAim();
      const mx = this.vx * dt, my = this.vy * dt; const ox = this.x, oy = this.y; w.moveEnt(this, mx, 0); w.moveEnt(this, 0, my);
      const moved = U.dist(ox, oy, this.x, this.y); this.walkT += moved * 0.16; this.stepD += moved;
      if (this.stepD > 13) { this.stepD = 0; const mat = w.isWater(this.x, this.y + 2) ? 'water' : w.matAt(this.x, this.y); AH.Audio.footstep(mat, this.x, this.y); w.noise(this.x, this.y, 52 * (spd / 78), 'step'); if (mat === 'water') AH.Particles.dust(this.x, this.y, 2); }
      if (blocked) return;
      /* actions */
      const wantAtk = Input.pressed('attack') || (Input.mouse.pressed && Input.mouseActive());
      if (wantAtk) return this.startAttack(0);
      if (Input.pressed('dodge') && this.stam >= 18) return this.startDodge(ax, moveLen);
      if (Input.pressed('cast') || Input.mouse.rpressed) return this.tryCast();
      if (Input.pressed('interact') && this.interactTarget) { AH.Interact.use(this.interactTarget, w, this); return; }
    }
    /* ---------- melee: a three-hit combo with anticipation, active frames and recovery ---------- */
    startAttack(step) {
      const wp = this.weapon(), G = this.G; if (this.stam < 8) { AH.Audio.sfx('ui_deny'); return; }
      this.state = 'attack'; this.st = 0; this.combo = step; this.hitSet = new Set(); this.queued = false;
      this.stam -= 8 + step * 2; this.stamDelay = 0.55; const sp = wp.spd * (1 + (step === 2 ? -0.1 : 0.0));
      this.atk = { wind: 0.09 / sp, act: 0.1 / sp, rec: (step === 2 ? 0.34 : 0.2) / sp, dmgK: [1, 1.1, 1.8][step], arc: wp.arc * (step === 2 ? 1.2 : 1), reach: wp.reach + (step === 2 ? 4 : 0), kb: (step === 2 ? 190 : 100) * wp.kb, side: step % 2 ? -1 : 1, fired: false };
      this.face = Input.mouseActive() ? this.dirFromAim() : this.face; if (!Input.mouseActive()) this.aimA = [Math.PI / 2, -Math.PI / 2, Math.PI, 0][this.face] + 0; if (Input.axis().x || Input.axis().y) { const a = Input.axis(); this.aimA = Math.atan2(a.y, a.x); this.face = this.dirFromAim(); }
      /* lunge forward a little - weight and commitment */
      const L = step === 2 ? 70 : 42; this.lungeV = { x: Math.cos(this.aimA) * L, y: Math.sin(this.aimA) * L * 0.8 };
    }
    stAttack(dt, w, ax, moveLen, blocked) {
      const a = this.atk, t = this.st;
      if (this.lungeV) { w.moveEnt(this, this.lungeV.x * dt, this.lungeV.y * dt); this.lungeV.x *= Math.pow(0.002, dt); this.lungeV.y *= Math.pow(0.002, dt); }
      if (t >= a.wind && !a.fired) {
        a.fired = true; const wp = this.weapon(); AH.Audio.sfx(this.combo === 2 ? 'swing_heavy' : 'swing', { x: this.x, y: this.y }); w.slash(this.x, this.y, this.aimA, a.reach, a.arc, '#e8f0ff', 0.18);
        w.noise(this.x, this.y, 40, 'swing');
        const dmg = wp.dmg * a.dmgK * (1 + this.mod('dmgMelee')) * (this.buff.pact ? this.buff.pact.dmgMul : 1);
        let landed = 0;
        w.enemies.forEach((e) => {
          if (e.dead || e.dormant || e.ally || this.hitSet.has(e)) return;
          const d = U.dist(this.x, this.y, e.x, e.y); if (d > a.reach + e.r + 2) return;
          const ang = Math.atan2(e.y - this.y, e.x - this.x); if (Math.abs(U.angDiff(ang, this.aimA)) > a.arc / 2 + 0.2 && d > e.r + 6) return;
          this.hitSet.add(e); const crit = e.status.stunned || e.vulnerable; const r = AH.Combat.hit(e, dmg, { src: this, ang, melee: true, school: 'phys', undeadMul: wp.vsUndead, crit, big: this.combo === 2, tags: ['melee'] });
          if (r > 0) { landed++; e.shove(ang, a.kb); e.stagger(this.combo === 2 ? 0.45 : 0.2); }
        });
        w.objs.forEach((o) => { if (!o.hidden && (o.d.act || o.d.living) && U.dist(this.x + Math.cos(this.aimA) * 14, this.y + Math.sin(this.aimA) * 14, o.x, o.y - 6) < a.reach) AH.Interact.onHit(o, this); });
        if (landed === 0) { w.world && 0; }
      }
      if (t > a.wind + a.act) {
        if (Input.pressed('attack') || (Input.mouse.pressed)) this.queued = true;
        if (t > a.wind + a.act + a.rec * 0.6 && this.queued && this.combo < 2) return this.startAttack(this.combo + 1);
        if (t > a.wind + a.act + a.rec) { this.state = 'move'; }
        if (Input.pressed('dodge') && this.stam >= 18 && t > a.wind + a.act) return this.startDodge(Input.axis(), 1);
      }
    }
    startDodge(ax, moveLen) {
      const G = this.G; this.state = 'dodge'; this.st = 0; this.stam -= 20; this.stamDelay = 0.7;
      let dx = ax.x, dy = ax.y; if (moveLen < 0.1) { dx = -Math.cos(this.aimA); dy = -Math.sin(this.aimA); } const l = Math.hypot(dx, dy) || 1; this.dashV = { x: dx / l, y: dy / l };
      this.iframes = 0.24 + this.mod('iframes'); this.dodgeT = 0.34; this.dodgeStart = G.clock; this.perfectArmed = true;
      AH.Audio.sfx('dodge', { x: this.x, y: this.y }); AH.Particles.dust(this.x, this.y, 5); if (Math.abs(dx) > Math.abs(dy) * 0.6) this.face = dx < 0 ? 2 : 3; else this.face = dy < 0 ? 1 : 0;
    }
    stDodge(dt, w) {
      const k = 1 - this.st / this.dodgeT; const sp = 175 * Math.max(0.25, k * k + 0.15);
      w.moveEnt(this, this.dashV.x * sp * dt, 0); w.moveEnt(this, 0, this.dashV.y * sp * dt * 0.9);
      this.ghostT -= dt; if (this.ghostT <= 0) { this.ghostT = 0.04; this.afterimages.push({ x: this.x, y: this.y, face: this.face, f: this.frameIdx(), t: 0.22 }); }
      if (this.st > this.dodgeT) { this.state = 'move'; this.vx = this.dashV.x * 40; this.vy = this.dashV.y * 40; }
    }
    /* ---------- spells ---------- */
    tryCast() {
      const G = this.G, id = G.slots[G.sel]; if (!id) { G.toast('No spell readied (B).', '#8a8478'); return; }
      const sp = AH.getSpell(id); if (!sp) return; if ((this.cd[id] || 0) > 0) { AH.Audio.sfx('ui_deny'); return; }
      const why = this.canPay(sp); if (why) { AH.Audio.sfx('ui_deny'); G.toast('Not enough ' + why + '.', '#b06a6a'); return; }
      if (sp.cost.hp && sp.school === 'blood' && this.hp <= this.costOf(sp).hp + 1) return;
      this.state = 'cast'; this.st = 0; this.castSpell = sp; this.castDone = false; this.castTotal = sp.cast * (sp.school === 'astral' ? 1.25 : 1); this.castAim = { x: this.x + Math.cos(this.aimA) * 80, y: this.y + Math.sin(this.aimA) * 80 };
      if (Input.mouseActive()) { this.castAim = { x: Input.mouse.x + w_cam().x, y: Input.mouse.y + w_cam().y }; }
      AH.Audio.sfx('cast_' + sp.school, { x: this.x, y: this.y, v: 0.8 }); AH.Magic.begin(this, sp);
    }
    stCast(dt, w, ax, moveLen) {
      const sp = this.castSpell; const slow = sp.school === 'astral' ? 0.15 : 0.4; this.vx = ax.x * 78 * slow; this.vy = ax.y * 78 * slow; w.moveEnt(this, this.vx * dt, 0); w.moveEnt(this, 0, this.vy * dt);
      if (Input.mouseActive()) this.castAim = { x: Input.mouse.x + w.cam.x, y: Input.mouse.y + w.cam.y };
      else if (moveLen > 0.1) this.castAim = { x: this.x + ax.x * 90, y: this.y + ax.y * 90 };
      this.face = this.dirFromAim();
      AH.Magic.channel && AH.Magic.channel(this, sp, this.st / this.castTotal, dt);
      if (!this.castDone && this.st >= this.castTotal) {
        this.castDone = true; const G = this.G, pre = this.canPay(sp);
        if (pre && !sp.noRecheck) { this.state = 'move'; G.toast('The casting fails.', '#8a8478'); return; }
        this.pay(sp); this.cd[sp.id] = sp.cd; AH.Magic.fire(this, sp, this.castAim);
        if (sp.forbidden) { G.addCorruption(sp.price.corruption || 0); if (sp.price.maxHp) { this.maxHpPerm += sp.price.maxHp; this.recalc(); } G.flags.used_forbidden = true; }
        else if (this.corruption >= 25 && sp.tier >= 2) G.addCorruption(0.5);
        if (this.corruption >= 75 && Math.random() < 0.15) AH.Magic.corruptEcho(this);
      }
      if (this.st >= this.castTotal + sp.rec) this.state = 'move';
      if (Input.pressed('dodge') && this.stam >= 18 && this.st > this.castTotal * 0.5 && sp.school !== 'astral') { this.startDodge(Input.axis(), 1); }
    }
    stDash(dt, w) { /* stag rush: a driven charge. d.t counts down */
      const d = this.dash; d.t -= dt; const hit = w.moveEnt(this, d.vx * dt, 0) | w.moveEnt(this, 0, d.vy * dt);
      this.iframes = Math.max(this.iframes, 0.05); this.ghostT -= dt; if (this.ghostT <= 0) { this.ghostT = 0.035; this.afterimages.push({ x: this.x, y: this.y, face: this.face, f: 1, t: 0.25 }); }
      w.enemies.forEach((e) => { if (e.dead || e.dormant || e.ally || d.hit.has(e)) return; if (U.dist(this.x, this.y, e.x, e.y) < e.r + 10) { d.hit.add(e); AH.Combat.hit(e, d.dmg, { src: this, ang: Math.atan2(d.vy, d.vx), melee: true, school: 'druid', big: true, tags: ['druid'] }); e.shove(Math.atan2(d.vy, d.vx), d.kb); } });
      if (d.t <= 0 || hit) { this.state = 'move'; this.vx = d.vx * 0.2; this.vy = d.vy * 0.2; }
    }
    /* ---------- being hurt ---------- */
    hurt(dmg, ang, src, o) {
      o = o || {}; const G = this.G; if (this.dead || this.invT > 0) return false;
      if (this.iframes > 0) {
        /* perfect dodge: slip a telegraphed blow at the last instant */
        if (o.attack && this.perfectArmed && this.state === 'dodge' && this.perfect <= 0) { this.perfect = 1.2; this.perfectArmed = false; G.slowmo = 0.7; this.stam = Math.min(this.maxStam, this.stam + 30); AH.Audio.sfx('perfect'); this.world.ring(this.x, this.y, 30, '#cfe8ff', 0.4); this.world.spawnFx({ k: 'text', x: this.x, y: this.y - 26, text: 'PERFECT', col: '#cfe8ff', t: 0, max: 0.9 }); }
        return false;
      }
      let d = dmg * (1 - Math.min(0.6, this.mod('armor'))) * (this.buff.pact ? this.buff.pact.takenMul : 1);
      if (this.state === 'cast' && this.castSpell && this.castSpell.school === 'astral') { this.state = 'move'; G.toast('Your casting is broken.', '#8a8478'); }
      this.hp -= d; this.flash = 1; this.hurtFlash = 0.5; this.invT = 0.5; AH.Audio.sfx('hurt', { x: this.x, y: this.y }); AH.Particles.blood(this.x, this.y - 10, 9, ang + Math.PI); this.world.addShake(3);
      G.hitstop = Math.max(G.hitstop, 0.07 * G.settings.hitstop); const kb = o.kb || 130; this.knock.x = Math.cos(ang) * kb; this.knock.y = Math.sin(ang) * kb; this.state = 'hurt'; this.st = 0; this.lungeV = null;
      this.world.spawnFx({ k: 'text', x: this.x, y: this.y - 24, text: String(Math.round(d)), col: '#ff6a6a', t: 0, max: 0.7 });
      if (o.bleed) this.status.bleed = { t: 3, dps: 2 }; if (o.slow) this.status.slow = { t: o.slow, k: 0.6 };
      if (this.hp <= 0) { this.hp = 0; }
      return true;
    }
    stHurt(dt, w) { if (this.st > 0.28) this.state = 'move'; }
    recoil(ang, f) { this.knock.x += Math.cos(ang) * f; this.knock.y += Math.sin(ang) * f; this.lungeV = null; if (this.state === 'attack') { this.st = Math.max(this.st, this.atk.wind + this.atk.act + 0.05); } }
    die() {
      this.dead = true; this.st = 0; this.hp = 0; AH.Audio.sfx('die'); this.world.addShake(5); AH.Particles.blood(this.x, this.y - 8, 24, 0); AH.Audio.music('calm'); this.G.slowmo = 1.2;
      this.G.screen = 'dead'; this.G.deadT = 0;
    }
    /* ---------- drawing ---------- */
    frameIdx() { if (this.state === 'dodge') return 1; if (this.state === 'attack') return this.atk && this.atk.fired ? 2 : 1; const sp = Math.hypot(this.vx, this.vy); if (sp < 6) return 0; return 1 + (Math.floor(this.walkT) % 2); }
    shadow(g, cam) {
      const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y); g.fillStyle = 'rgba(0,0,0,0.38)'; g.fillRect(x - 4, y - 1, 9, 3); g.fillRect(x - 3, y - 2, 7, 1); g.fillRect(x - 3, y + 2, 7, 1);
    }
    draw(g, cam, time) {
      const G = this.G; if (this.dead) { g.globalAlpha = Math.max(0, 1 - this.st * 0.8); }
      const set = AH.Art.hero, dir = this.face;
      this.afterimages.forEach((a) => { const spr = AH.Art.facing(set, a.face, a.f); g.globalAlpha = a.t * 1.6; S.draw(g, spr, a.x - cam.x, a.y - cam.y, { flip: a.face === 2, flash: 0.8, flashColor: '#9ab8ff' }); });
      g.globalAlpha = this.dead ? Math.max(0, 1 - this.st * 0.8) : 1; if (this.invT > 0 && !this.dead && this.state !== 'hurt') g.globalAlpha = 0.6 + Math.sin(time * 40) * 0.2;
      const spr = AH.Art.facing(set, dir, this.frameIdx() % 3); let ox = 0, oy = 0;
      if (this.state === 'attack') { const a = this.atk; const k = this.st < a.wind ? -this.st / a.wind : (this.st - a.wind) / (a.act + 0.05); ox = Math.cos(this.aimA) * (k < 0 ? k * 2 : 3); oy = Math.sin(this.aimA) * (k < 0 ? k * 1.5 : 2); }
      const bob = this.frameIdx() > 0 && this.state === 'move' ? (Math.floor(this.walkT * 2) % 2) : 0;
      const sx = this.x - cam.x + ox, sy = this.y - cam.y + oy - bob * 0;
      const tint = this.corruption >= 50 ? Math.min(0.25, (this.corruption - 45) / 200) : 0;
      /* lantern held low on the near side */
      const lx = dir === 2 ? -7 : dir === 3 ? 7 : 6, ly = -9;
      if (dir === 1) { S.draw(g, AH.Art.lantern[Math.floor(time * 6) % 2], sx + lx, sy + ly + 2, { flip: false }); }
      S.draw(g, spr, sx, sy, { flip: dir === 2, flash: this.flash * 0.9 + (this.state === 'cast' ? Math.sin(time * 30) * 0.08 + 0.08 : 0), flashColor: this.state === 'cast' ? AH.Schools[this.castSpell.school].col : '#ffffff' });
      if (dir !== 1) S.draw(g, AH.Art.lantern[Math.floor(time * 6) % 2], sx + lx, sy + ly + bob, { flip: false });
      if (tint) { g.globalAlpha = tint; S.draw(g, spr, sx, sy, { flip: dir === 2, flash: 1, flashColor: '#a030b0' }); }
      g.globalAlpha = 1;
      if (this.state === 'cast' && this.castSpell) { const c = AH.Schools[this.castSpell.school].col, k = Math.min(1, this.st / this.castTotal); g.fillStyle = c; for (let i = 0; i < 6; i++) { const a = time * 4 + i * 1.047, r = 10 * (1 - k) + 2; g.globalAlpha = 0.8; g.fillRect(Math.round(sx + Math.cos(a) * r), Math.round(sy - 10 + Math.sin(a) * r * 0.6), 1, 1); } g.globalAlpha = 1; }
      if (this.buff.pact) { g.globalAlpha = 0.4 + Math.sin(time * 6) * 0.15; S.draw(g, spr, sx, sy, { flip: dir === 2, flash: 0.5, flashColor: '#d04050' }); g.globalAlpha = 1; }
    }
  }
  function w_cam() { return AH.G.world.cam; }
  AH.Player = Player;
})();

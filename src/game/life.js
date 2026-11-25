/* Ashen Hollow - the living world: NPC routines (A* walking, schedules, weather), creature ecology (night/dim spawns,
   respawn tiers), ambient wildlife and scripted world events (procession, blood moon, boss arena, post-boss changes). */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, T = AH.T, S = AH.Sprites;

  /* ======================================================= NPC */
  class NPC {
    constructor(w, def, pl) {
      this.w = w; this.def = def; this.id = pl.id; this.x = (pl.tx + 0.5) * T; this.y = (pl.ty + 1) * T - 3; this.r = 4; this.face = 0; this.walkT = 0; this.path = null; this.pi = 0; this.alpha = 1; this.target = null; this.act = 'idle'; this.rethink = 0; this.sortY = this.y; this.barkT = U.rr(6, 14); this.ambient = !!def.ambient; this.say = null; this.sayT = 0; this.talking = false; this.hostile = false;
      this.ghost = !!def.ghost; this.lightR = this.ghost ? 46 : 0; this.lightCol = '#b4cadf'; this.stuck = 0; this.moving = false; this.homeTile = [pl.tx, pl.ty];
      if (this.ambient) { this.baseX = this.x; this.baseY = this.y; }
      this.snapToSchedule();
    }
    currentPlan() {
      const G = this.w.G, h = G.hour, d = this.def, rain = AH.Weather.rainK > 0.3 && d.rain && !this.w.def.indoor && true;
      if (rain) return d.rain; const rt = d.routine || []; for (const r of rt) { const inR = r.h0 < r.h1 ? h >= r.h0 && h < r.h1 : h >= r.h0 || h < r.h1; if (inR) return r; } return rt[0] || { at: null, act: 'idle' };
    }
    snapToSchedule() { const pl = this.currentPlan(); this.plan = pl; if (pl.at && !this.ambient) { this.x = (pl.at[0] + 0.5) * T; this.y = (pl.at[1] + 1) * T - 3; } this.alpha = pl.at || this.ambient ? 1 : 0; if (this.ghost) this.alpha = pl.at ? 0.85 : 0; }
    faceTo(p) { const dx = p.x - this.x, dy = p.y - this.y; this.face = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : dy < 0 ? 1 : 0; this.talking = true; }
    convertHostile() { if (this.hostile) return; this.hostile = true; const e = this.w.addEnemy('hexcaller', Math.floor(this.x / T), Math.floor(this.y / T)); e.alert(this.w.G.player); this.w.G.flags['gone_' + this.id] = true; this.dead = true; }
    update(dt) {
      if (this.dead) return; const w = this.w, p = w.G.player; this.sortY = this.y; if (this.sayT > 0) this.sayT -= dt;
      if (!w.G.screen || w.G.screen !== 'dialogue') this.talking = false;
      this.rethink -= dt;
      if (this.rethink <= 0 && !this.ambient) { this.rethink = 1.5; const pl = this.currentPlan(); if (pl !== this.plan) { this.plan = pl; this.path = null; if (pl.at) this.goto(pl.at); } }
      /* fade in/out with the schedule */
      const want = this.plan && (this.plan.at || this.ambient) ? (this.ghost ? 0.85 : 1) : 0; this.alpha = U.approach(this.alpha, want, dt * 0.4);
      if (this.talking || this.ambient || this.alpha < 0.2) { this.moving = false; if (this.ambient) this.ambientSway(dt); return; }
      this.moving = false;
      if (this.path && this.pi < this.path.length) { const t = this.path[this.pi], d = U.dist(this.x, this.y, t[0], t[1]); if (d < 3) this.pi++; else { const a = Math.atan2(t[1] - this.y, t[0] - this.x), sp = this.def.speed * dt; const ox = this.x, oy = this.y; if (this.ghost) { this.x += Math.cos(a) * sp; this.y += Math.sin(a) * sp; } else { w.moveEnt(this, Math.cos(a) * sp, 0); w.moveEnt(this, 0, Math.sin(a) * sp); } this.face = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) < 0 ? 2 : 3) : Math.sin(a) < 0 ? 1 : 0; this.walkT += dt * 7; this.moving = true; if (U.dist(ox, oy, this.x, this.y) < 0.01) { this.stuck += dt; if (this.stuck > 1.5) { this.path = null; this.stuck = 0; } } else this.stuck = 0; } }
      else if (this.plan && this.plan.at) { /* idle behaviour at the destination */ this.idleT = (this.idleT || 0) - dt; if (this.idleT <= 0) { this.idleT = U.rr(3, 8); if (this.plan.act === 'garden' || this.plan.act === 'play' || this.plan.act === 'forage') { const q = [this.plan.at[0] + Math.floor(U.rr(-2, 3)), this.plan.at[1] + Math.floor(U.rr(-1, 2))]; this.goto(q); } else { this.face = U.ri(0, 3); } } }
      /* barks when the player lingers close by */
      this.barkT -= dt; if (this.barkT <= 0 && this.alpha > 0.6 && U.dist(this.x, this.y, p.x, p.y) < 70 && !w.G.screen && this.def.barks) { this.barkT = U.rr(14, 26); this.say = U.pick(this.def.barks); this.sayT = 3.2; }
      if (this.ghost && Math.random() < dt * 8) AH.Particles.emit({ x: this.x + U.rr(-4, 4), y: this.y - 10, vx: 0, vy: -8, life: 0.8, col: '#b4cadf', size: 1, add: true });
      if (this.def.shy && U.dist(this.x, this.y, p.x, p.y) < 16 && !this.talking && this.moving === false && Math.random() < dt) this.say = null;
    }
    ambientSway(dt) { this.walkT += dt; }
    goto(tile) { const p = this.w.path(this.x, this.y, (tile[0] + 0.5) * T, (tile[1] + 0.5) * T); if (p && p.length) { this.path = p; this.pi = 0; } else if (this.ghost) { this.path = [[(tile[0] + 0.5) * T, (tile[1] + 0.5) * T]]; this.pi = 0; } }
    frame() { const idx = this.moving ? 1 + (Math.floor(this.walkT) % 2) : 0; return AH.Art.facing(AH.Art.npc[this.def.art], this.face, idx); }
    shadow(g, cam) { if (this.ghost) return; const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y); g.fillStyle = 'rgba(0,0,0,' + 0.35 * this.alpha + ')'; g.fillRect(x - 4, y - 1, 9, 3); g.fillRect(x - 3, y - 2, 7, 1); }
    draw(g, cam, time) {
      if (this.alpha < 0.02) return; const spr = this.frame(); g.globalAlpha = this.alpha * (this.ghost ? 0.75 + Math.sin(time * 2) * 0.1 : 1); const bob = this.ghost ? Math.sin(time * 2 + this.x) * 2 : 0;
      S.draw(g, spr, this.x - cam.x, this.y - cam.y - bob, { flip: this.face === 2 }); g.globalAlpha = 1;
      if (this.sayT > 0) { const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y - 30); const wd = AH.Font.width(this.say); g.globalAlpha = Math.min(1, this.sayT); g.fillStyle = 'rgba(12,9,16,0.85)'; g.fillRect(x - (wd >> 1) - 3, y - 3, wd + 6, 11); g.strokeStyle = '#6a5a3a'; g.strokeRect(x - (wd >> 1) - 2.5, y - 2.5, wd + 5, 10); AH.Font.draw(g, this.say, x, y, '#e6dcc4', { align: 'center', shadow: false }); g.globalAlpha = 1; }
    }
  }
  AH.NPC = NPC;

  /* ======================================================= ambient wildlife */
  AH.Ambient = {
    makeCrow(w, tx, ty) {
      const c = { w, home: { x: (tx + 0.5) * T, y: (ty + 1) * T - 2 }, x: (tx + 0.5) * T, y: (ty + 1) * T - 2, fly: false, t: Math.random() * 5, state: 'perch', z: 0, vx: 0, vy: 0, sortY: 0, face: 1, back: 0,
        update(dt) { const p = w.G.player; this.t += dt; this.sortY = this.y; if (this.state === 'perch') { const d = U.dist(this.x, this.y, p.x, p.y); if (d < 46 || (w.G.hour > 21 && d < 70 && Math.random() < dt * 0.1)) { this.state = 'flee'; this.fly = true; this.z = 2; const a = Math.atan2(this.y - p.y, this.x - p.x) + U.rr(-0.8, 0.8); this.vx = Math.cos(a) * 70; this.vy = Math.sin(a) * 40; this.back = U.rr(9, 20); this.face = this.vx < 0 ? -1 : 1; AH.Audio.sfx('caw', { x: this.x, y: this.y, v: 0.8 }); w.noise(this.x, this.y, 70, 'crow'); if (Math.random() < 0.3) w.spawnPickup(this.x, this.y, 'raven_feather', 1); } }
          else if (this.state === 'flee') { this.x += this.vx * dt; this.y += this.vy * dt; this.z = Math.min(40, this.z + 36 * dt); this.back -= dt; if (this.back < 0) { this.state = 'return'; } }
          else if (this.state === 'return') { const a = Math.atan2(this.home.y - this.y, this.home.x - this.x), d = U.dist(this.x, this.y, this.home.x, this.home.y); this.x += Math.cos(a) * 60 * dt; this.y += Math.sin(a) * 50 * dt; this.z = Math.max(0, Math.min(this.z, d * 0.5)); this.face = Math.cos(a) < 0 ? -1 : 1; if (d < 3 && U.dist(this.x, this.y, p.x, p.y) > 60) { this.state = 'perch'; this.fly = false; this.x = this.home.x; this.y = this.home.y; this.z = 0; } }
        },
        shadow() {}, draw(g, cam, time) { const spr = this.state === 'perch' ? AH.Art.crow.idle : AH.Art.crow.fly[Math.floor(time * 10) % 2]; const sx = this.x - cam.x, sy = this.y - cam.y; if (this.z > 1) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(Math.round(sx) - 2, Math.round(sy), 5, 2); } S.draw(g, spr, sx, sy - this.z, { flip: this.face < 0 }); } };
      return c;
    },
  };

  /* ======================================================= ecology: what lives here, and when */
  const Eco = (AH.Ecology = {});
  function condOK(spec, G) {
    const wk = AH.Weather; if (spec.when === 'night') return G.isNight() || wk.fogK > 0.6; if (spec.when === 'dim') return G.isDim() || wk.fogK > 0.35 || wk.rainK > 0.5; return true;
  }
  Eco.populate = function (w, first) {
    const G = w.G, st = w.state; w.specs = w.def.enemies.map((s) => Object.assign({}, s, { ref: null, key: s.type + '@' + s.tx + ',' + s.ty }));
    w.specs.forEach((s) => {
      if (s.boss) { if (G.flags.boss_done && s.type === 'choirmaster') return; if (G.flags.stag_done && s.type === 'stag') return; const e = w.addEnemy(s.type, s.tx, s.ty, { dormant: true, id: s.id }); s.ref = e; return; }
      const k = st.killed[s.key]; if (k !== undefined && G.day - k < 2 + (s.type === 'sentinel' ? 2 : 0)) return;
      if (!condOK(s, G)) return; const e = w.addEnemy(s.type, s.tx, s.ty, { sleeps: s.sleeps, key: s.key }); s.ref = e;
    });
    if (G.flags.wraith_allies && w.areaId !== 'catacombs') { /* bound choir follows */ }
  };
  Eco.update = function (w, dt) {
    const G = w.G, p = G.player; w.ecoT = (w.ecoT || 0) - dt; if (w.ecoT > 0) return; w.ecoT = 2;
    w.specs && w.specs.forEach((s) => {
      if (s.boss) return; if (s.ref && (s.ref.dead || s.ref.remove)) { if (!s.ref.dead) s.ref = null; else return; }
      const ok = condOK(s, G), far = U.dist((s.tx + 0.5) * T, (s.ty + 0.5) * T, p.x, p.y);
      if (!s.ref && ok && far > 170 && !(w.state.killed[s.key] !== undefined && G.day - w.state.killed[s.key] < 2)) { s.ref = w.addEnemy(s.type, s.tx, s.ty, { sleeps: s.sleeps, key: s.key, fadeIn: true }); if (s.when === 'night' && s.type === 'hound') AH.Audio.sfx('howl', { v: 0.5 }); }
      else if (s.ref && !ok && U.dist(s.ref.x, s.ref.y, p.x, p.y) > 150 && (s.ref.state === 'idle')) { s.ref.remove = true; s.ref = null; }
    });
    w.enemies = w.enemies.filter((e) => !e.remove);
  };
  Eco.respawnAll = function (w) { w.state.killed = {}; w.enemies.forEach((e) => { if (!e.def.boss && !e.ally) e.remove = true; }); w.enemies = w.enemies.filter((e) => !e.remove); Eco.populate(w); };

  /* ======================================================= events */
  const Ev = (AH.Events = {});
  Ev.onEnter = function (w, areaId) {
    const G = w.G; w.spawnName = w.spawnName || null;
    if (areaId === 'thornwood' && w.spawnName === 'from_catacombs' && !G.flags.chapel_open) { G.flags.chapel_open = true; w.refreshOpenState(); G.toast('You shove the rubble aside from within.', '#e8c670'); }
    if (areaId === 'catacombs') { if (G.flags.boss_started && !G.flags.boss_done) { /* the hall is quiet after a death: reset the fight */ G.flags.boss_started = false; G.flags.boss_active = null; } w.arenaRelit = false; }
    w.ambientOverride = null; w.boss = null;
    if (G.flags.procession_done_day === undefined) G.flags.procession_done_day = -1;
    if (areaId === 'hamlet' && G.flags.altar_crypt) { /* stairs already opened */ }
    /* the bound choir follows you between places */
    if (G.flags.wraith_allies && G.player) { const p = G.player; for (let i = 0; i < 3; i++) { const an = i * 2.1, e = AH.makeThrall(w, p.x + Math.cos(an) * 24, p.y + Math.sin(an) * 18, 1e9, 7 + G.level * 0.5); e.type = 'wraith'; e.def = Object.assign({}, AH.EnemyDefs.wraith, { ally: true, name: 'Bound Chorister', speed: 58 }); e.hp = e.maxHp = 34; e.lightR = 30; e.lightCol = '#9ab8ff'; e.fade = 0.4; w.allies.push(e); } }
  };
  Ev.onNewDay = function (w) { const G = w.G; G.flags.bloodmoon_now = false; if (G.day % 7 === 0) G.toast('The moon is rising red tonight.', '#c04050'); };
  Ev.update = function (w, dt) {
    const G = w.G; const h = G.hour;
    G.flags.bloodmoon_now = G.day % 7 === 0 && (h >= 21 || h < 5);
    /* the Lantern Procession: the dead walk to the church at the deepest hour */
    if (w.areaId === 'hamlet' && h >= 23.4 && h < 23.9 && !w.procession && G.flags.procession_done_day !== G.day) { Ev.startProcession(w); }
    if (w.procession) { const pr = w.procession; pr.t += dt; pr.orbs.forEach((o, i) => { const k = U.clamp((pr.t - i * 1.1) / 14, 0, 1); o.x = U.lerp(pr.from[0], pr.to[0], k); o.y = U.lerp(pr.from[1], pr.to[1], k); o.k = k; if (Math.random() < dt * 14 && k > 0 && k < 1) AH.Particles.emit({ x: o.x, y: o.y - 12, vx: U.rr(-4, 4), vy: -8, life: 0.8, col: '#b8d8ff', size: 1, add: true }); }); if (pr.t > 16 + pr.orbs.length) { Ev.endProcession(w); } }
  };
  Ev.startProcession = function (w) {
    const G = w.G; G.flags.procession_done_day = G.day; const from = [45.5 * T, 22 * T], to = [45.5 * T, 6.5 * T], orbs = [];
    for (let i = 0; i < 6; i++) { const o = { x: from[0] + U.rr(-4, 4), y: from[1], k: 0 }; orbs.push(o); }
    w.procession = { t: 0, from, to, orbs }; G.toast('Pale lights gather at the lych-gate...', '#b8d8ff'); AH.Audio.sfx('whisper', { v: 1 }); G.learnLore('procession');
    orbs.forEach((o, i) => { const l = { x: 0, y: 0, r: 56, color: '#9ab8ff', i: 0.8, flicker: 0.1, seed: i }; o.light = l; });
    const prev = w.collectLights.bind(w); if (!w._pl) { w._pl = true; const orig = w.collectLights; w.collectLights = function () { const L = orig.call(this); if (this.procession) this.procession.orbs.forEach((o) => { if (o.k > 0 && o.k < 1.02) L.push({ x: o.x, y: o.y - 12, r: 52, color: '#9ab8ff', i: 0.8, flicker: 0.1, seed: 5 }); }); return L; }; }
  };
  Ev.endProcession = function (w) {
    const G = w.G; w.procession = null; if (!G.flags.altar_crypt) { G.flags.altar_crypt = true; const s = w.def.secrets.find((q) => q.id === 'altar_crypt'); if (s) { w.state.secrets['altar_crypt'] = true; w.applySecret(s, false); } AH.Audio.sfx('stone_slide'); w.addShake(3); G.toast('Beneath the altar, stone grinds. A stair opens.', '#e8c670'); G.addXP(60, true); }
  };
  Ev.drawProcession = function (w, g, cam, time) {
    if (!w.procession) return; w.procession.orbs.forEach((o) => { if (o.k <= 0 || o.k >= 1.02) return; const x = Math.round(o.x - cam.x), y = Math.round(o.y - cam.y); g.globalAlpha = 0.9; S.draw(g, AH.Art.npc.ghost.down[0], x, y, { flip: false, alpha: 0.35 }); g.globalCompositeOperation = 'lighter'; g.fillStyle = '#b8d8ff'; g.fillRect(x - 1 + 6, y - 12, 3, 3); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; });
  };
  Ev.startBoss = function (w, id) {
    const G = w.G; G.flags.boss_started = true; const b = w.enemies.find((e) => e.def.id === id); if (!b) return; b.start(); w.setBossGate(true); AH.Audio.music('boss'); G.toast(b.def.name, '#e8c670'); G.bossIntroT = 3; w.addShake(3); AH.Audio.sfx('bell', { v: 1, pitch: 0.6 });
  };
  Ev.onBossDeath = function (w, b) {
    const G = w.G; w.boss = null; G.flags.boss_active = null; G.slowmo = 1.4; G.hitstop = 0.25; w.addShake(7); w.tele.forEach((t) => (t.dead = true)); w.projectiles = []; w.enemies.forEach((e) => { if (!e.dead && e !== b && e.def.id === 'wraith') e.die({}); }); w.zones = w.zones.filter((z) => !z.silence); w.ambientOverride = null;
    if (b.type === 'choirmaster') { AH.Audio.music('calm'); w.setBossGate(false); w.refreshOpenState(); setTimeout(() => { G.dialogueStart('ending_1'); }, 1600); }
    else if (b.type === 'stag') { if (!G.flags.stag_done) G.flags.stag_done = 'kill'; AH.Audio.music('forest'); }
  };
})();

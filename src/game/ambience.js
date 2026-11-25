/* Ashen Hollow - ambience: small living things and a worse night.
   - Critters: rats / beetles that scurry from your boots, moths circling light, leaves on the wind.
   - Blood Moon (every 7th day, 21:00-05:00): the world pulses red, embers rise, and the dead walk. Risen spirits
     come for you and pay out XP when laid to rest again.
   - The caged lady: examine her cage for her story; free her (boon) or bind her (taint, a ghost ally). */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, W = AH.W, H = AH.H;
  const A = (AH.Ambience = { crit: [], leaves: [], motes: [], moonT: 0, risen: 0, area: null });
  const safe = (fn) => { try { return fn(); } catch (e) { if (AH.errors) AH.errors.push('ambience: ' + e); } };
  const G_ = () => AH.G, W_ = () => AH.G && AH.G.world;
  const R = Math.random;

  /* ------------------------------------------------------------------ critters */
  const KINDS = { hamlet: ['rat', 'rat', 'beetle'], thornwood: ['beetle', 'beetle', 'rat'], catacombs: ['rat', 'rat', 'rat'] };
  function spawnCritter(w) {
    const p = w.G.player, kinds = KINDS[w.areaId] || ['rat'];
    for (let i = 0; i < 8; i++) {
      const a = R() * 6.283, d = 70 + R() * 150, x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
      if (x < 16 || y < 16 || x > w.w * 16 - 16 || y > w.h * 16 - 16 || !w.freePoint(x, y, 3) || w.isWater(x, y)) continue;
      A.crit.push({ k: kinds[Math.floor(R() * kinds.length)], x, y, vx: 0, vy: 0, ang: R() * 6.283, t: R() * 5, pause: R() * 2, flee: 0 }); return;
    }
  }
  function moveCritter(w, c, dt, p) {
    c.t += dt; const dp = U.dist(c.x, c.y, p.x, p.y), fast = Math.hypot(p.vx || 0, p.vy || 0) > 70;
    if (dp < (fast ? 64 : 40) && c.flee <= 0) { c.flee = 1.1; c.ang = Math.atan2(c.y - p.y, c.x - p.x) + (R() - 0.5) * 0.8; c.pause = 0; }
    let sp = 0;
    if (c.flee > 0) { c.flee -= dt; sp = c.k === 'rat' ? 78 : 44; }
    else if (c.pause > 0) c.pause -= dt;
    else { sp = c.k === 'rat' ? 22 : 12; if (R() < dt * 0.6) { c.ang += (R() - 0.5) * 2.2; if (R() < 0.4) c.pause = 0.4 + R() * 1.6; } }
    const nx = c.x + Math.cos(c.ang) * sp * dt, ny = c.y + Math.sin(c.ang) * sp * dt;
    if (sp > 0) { if (w.freePoint(nx, ny, 2) && !w.isWater(nx, ny)) { c.x = nx; c.y = ny; } else { c.ang += 1.6 + R(); c.flee = Math.max(0, c.flee - 0.3); } }
    c.moving = sp > 0;
  }
  function drawCritter(g, cam, c) {
    const x = Math.round(c.x - cam.x), y = Math.round(c.y - cam.y); if (x < -8 || x > W + 8 || y < -8 || y > H + 8) return;
    const dir = Math.cos(c.ang) >= 0 ? 1 : -1, step = c.moving ? Math.floor(c.t * (c.flee > 0 ? 18 : 8)) % 2 : 0;
    g.globalAlpha = 0.28; g.fillStyle = '#000'; g.fillRect(x - 3, y, 7, 2); g.globalAlpha = 1;
    if (c.k === 'rat') {
      g.fillStyle = '#3a3230'; g.fillRect(x - 3, y - 3, 6, 3); g.fillStyle = '#4e4440'; g.fillRect(x - 2, y - 3, 4, 1);
      g.fillStyle = '#3a3230'; g.fillRect(x + dir * 3 - (dir < 0 ? 1 : 0), y - 3, 2, 2); g.fillStyle = '#d06a6a'; g.fillRect(x + dir * 4 - (dir < 0 ? 1 : 0), y - 3, 1, 1);
      g.fillStyle = '#7a5a58'; g.fillRect(x - dir * 4 - (dir > 0 ? 0 : -1), y - 1 - step, 2, 1); g.fillRect(x - dir * 6 - (dir > 0 ? 1 : -1), y - 1 - step, 2, 1);
      g.fillStyle = '#2a2220'; g.fillRect(x - 2 + step, y, 1, 1); g.fillRect(x + 1 - step, y, 1, 1);
    } else {
      const hue = (Math.sin(c.x * 0.1) > 0) ? ['#2a5a4a', '#58c8a0'] : ['#3a2a5a', '#9a78e0'];
      g.fillStyle = '#14100e'; g.fillRect(x - 2, y - 2, 4, 3); g.fillStyle = hue[0]; g.fillRect(x - 2, y - 2, 4, 2); g.fillStyle = hue[1]; g.fillRect(x - 1, y - 2, 1, 1);
      g.fillStyle = '#14100e'; g.fillRect(x - 3, y - 1 + step, 1, 1); g.fillRect(x + 2, y - step, 1, 1);
    }
  }

  /* moths: pale specks looping round a light source at night */
  function mothTick(w, dt) {
    const G = w.G, dark = w.def.time ? 1 - AH.Lighting.daylight(G.hour) : (w.def.indoor ? 0.4 : 0);
    if (dark < 0.3 || A.moths.length >= 5 || R() > dt * 0.5) return;
    const lits = w.objs.filter((o) => o.light && !o.hidden && U.dist(o.x, o.y, G.player.x, G.player.y) < 220);
    if (!lits.length) return; const o = lits[Math.floor(R() * lits.length)];
    A.moths.push({ o, a: R() * 6.283, r: 8 + R() * 10, sp: 2 + R() * 2, life: 8 + R() * 8, y: -14 - R() * 8 });
  }
  A.moths = [];

  /* wind-blown leaves (open ground only) */
  function leafTick(w, dt) {
    if (w.def.indoor || A.leaves.length > 14) return; const wind = AH.Weather.wind + AH.Weather.stormK;
    if (R() < dt * (1.2 + wind * 3)) A.leaves.push({ x: -6, y: R() * H * 0.8, z: R() * 20, vx: 20 + R() * 30 + wind * 60, ph: R() * 6, c: ['#6a5a2a', '#8a6a2a', '#4a5a2a', '#7a3a2a'][Math.floor(R() * 4)], life: 0 });
  }

  /* ------------------------------------------------------------------ blood moon */
  function risenSpawn(w) {
    const p = w.G.player; if (!w.def.time) return;
    for (let i = 0; i < 12; i++) {
      const a = R() * 6.283, d = 110 + R() * 70, x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
      if (x < 24 || y < 24 || x > w.w * 16 - 24 || y > w.h * 16 - 24 || !w.freePoint(x, y, 5) || w.isWater(x, y)) continue;
      const e = w.addEnemy('wraith', 0, 0, { fadeIn: true }); e.x = x; e.y = y; e.risen = true; e.lightR = 34; e.lightCol = '#ff4a5a'; e.alert(p);
      AH.Particles.magic(x, y - 6, 14, ['#ff5a6a', '#c02a3a', '#ffb0b8']); AH.Audio.sfx('whisper', { v: 0.8 }); return;
    }
  }
  const dieOrig = AH.Enemy.prototype.die;
  AH.Enemy.prototype.die = function () {
    const was = this.dead, r = dieOrig.apply(this, arguments);
    if (!was && this.dead && this.risen) safe(() => { const G = AH.G; G.addXP(30 + G.level * 3, true); G.toast('A risen spirit is laid to rest. (+XP)', '#e87a8a'); AH.Particles.magic(this.x, this.y - 8, 18, ['#ff8a9a', '#fff']); });
    return r;
  };

  /* ------------------------------------------------------------------ the caged lady */
  const key = (w, o) => w.areaId + ':' + o.d.tx + ',' + o.d.ty;
  const store = () => { const G = G_(); return (G.flags.ghosts = G.flags.ghosts || {}); };
  function release(o) {
    const w = o.w, tiles = o.d.solidTiles || [[o.d.tx, o.d.ty]];
    o.taken = true; o.hidden = true; o.light = null; w.lightCache = null; tiles.forEach((t) => { const i = t[1] * w.w + t[0]; if (i >= 0 && i < w.solid.length) w.solid[i] = 0; });
  }
  function freeGhost(o) {
    const w = o.w, G = G_(), p = G.player; store()[key(w, o)] = 'f'; release(o);
    AH.Particles.magic(o.x, o.y - 24, 40, ['#8fb8ff', '#d8e8ff', '#fff'], { max: 110, life: [0.6, 1.4] }); w.ring(o.x, o.y - 20, 70, '#8fb8ff', 0.9);
    p.heal(999); G.addXP(90 + G.level * 4); G.toast('She is free. Her blessing warms you.', '#9ac8ff'); G.setFlag('ghost_freed', true); AH.Audio.sfx('levelup', { v: 0.7 });
    G.learnLore && G.learnLore('caged_lady');
  }
  function bindGhost(o) {
    const w = o.w, G = G_(), p = G.player; store()[key(w, o)] = 'b'; G.addCorruption(8); G.setFlag('ghost_bound', true);
    AH.Particles.magic(o.x, o.y - 24, 30, ['#c860e8', '#8a2aa8', '#fff']); spawnBound(w, o.x, o.y + 6); G.toast('She is yours now. The cage holds nothing.', '#c860e8'); release(o);
  }
  function spawnBound(w, x, y) {
    const G = w.G, e = AH.makeThrall(w, x, y, 1e9, 9 + G.level * 0.5); e.type = 'wraith';
    e.def = Object.assign({}, AH.EnemyDefs.wraith, { ally: true, name: 'Bound Lady', speed: 62 }); e.hp = e.maxHp = 46; e.lightR = 34; e.lightCol = '#d890ff'; e.fade = 0.4; w.allies.push(e);
  }
  const N = AH.Dialogue && AH.Dialogue.nodes;
  if (N) {
    const bye = (t) => ({ t: t || '(Step away)', end: true });
    N.ghost_look = { id: 'ghost_look', sp: 'The Caged Lady', text: 'She hangs in the iron like a held breath, a lace collar, a cameo at her throat, hair drifting though no wind stirs. Her eyes find yours. "They said I would sing for them forever," she whispers. "I stopped. They kept the cage."', opts: [
      { t: 'Break the cage. Let her go.', end: true, fx: () => safe(() => freeGhost(AH.Ambience.target)) },
      { t: 'Bind her to your will. (+8 taint)', end: true, fx: () => safe(() => bindGhost(AH.Ambience.target)) }, bye()], fx: () => { const G = AH.G; if (AH.Lore && AH.Lore.caged_lady) G.learnLore('caged_lady'); } };
    N.ghost_after = { id: 'ghost_after', sp: 'The Cage', text: 'Only iron remains, and a faint scent of lilies.', opts: [bye('(Leave)')] };
  }
  if (AH.Lore) AH.Lore.caged_lady = AH.Lore.caged_lady || { title: 'The Caged Lady', text: 'A woman of the old Hollow, caged for refusing to sing the Choir\'s final note. The cage glows because she has not yet forgiven them. Some say freeing her loosens the Hollow\'s grip; others say a bound ghost serves better than a free one.' };
  AH.Interact.types.ghost = (o, a, w, p, g) => { A.target = o; g.dialogueStart('ghost_look'); };

  /* restore freed/bound cages when an area loads */
  const rs = AH.World.prototype.refreshOpenState;
  AH.World.prototype.refreshOpenState = function () {
    rs.apply(this, arguments); const f = this.G.flags.ghosts; if (!f) return;
    this.objs.forEach((o) => { if (o.d.act && o.d.act.type === 'ghost' && f[key(this, o)]) safe(() => release(o)); });
  };

  /* ------------------------------------------------------------------ hooks */
  const wu = AH.World.prototype.update;
  AH.World.prototype.update = function (dt) {
    wu.apply(this, arguments);
    safe(() => {
      const G = this.G, p = G.player;
      if (A.area !== this) { A.area = this; A.crit.length = 0; A.moths.length = 0; A.leaves.length = 0; A.motes.length = 0; A.risen = 0; A.moonT = 3; }
      /* critters */
      const want = this.areaId === 'catacombs' ? 6 : 9; if (A.crit.length < want && R() < dt * 1.5) spawnCritter(this);
      for (let i = A.crit.length - 1; i >= 0; i--) { const c = A.crit[i]; moveCritter(this, c, dt, p); if (U.dist(c.x, c.y, p.x, p.y) > 300) A.crit.splice(i, 1); }
      mothTick(this, dt);
      for (let i = A.moths.length - 1; i >= 0; i--) { const m = A.moths[i]; m.life -= dt; m.a += dt * m.sp; m.r += Math.sin(m.a * 0.7) * dt * 3; if (m.life <= 0 || m.o.hidden || !m.o.light) A.moths.splice(i, 1); }
      leafTick(this, dt);
      for (let i = A.leaves.length - 1; i >= 0; i--) { const l = A.leaves[i]; l.life += dt; l.x += l.vx * dt; l.y += (Math.sin(l.life * 3 + l.ph) * 14 + 10) * dt; if (l.x > W + 8 || l.y > H + 8) A.leaves.splice(i, 1); }
      /* blood moon */
      const bm = G.flags.bloodmoon_now && this.def.time;
      if (bm) {
        if (!G.flags._bm_toast || G.flags._bm_toast !== G.day) { G.flags._bm_toast = G.day; G.toast('The Blood Moon is up. The dead are restless.', '#d04050'); AH.Audio.sfx('whisper', { v: 1 }); this.addShake && this.addShake(3); }
        A.moonT -= dt; A.risen = this.enemies.filter((e) => e.risen && !e.dead).length;
        if (A.moonT <= 0) { A.moonT = 7 + R() * 5; if (A.risen < 4 && !G.dialogue && !G.screen) risenSpawn(this); }
        if (A.motes.length < 40 && R() < dt * 30) A.motes.push({ x: R() * W, y: H + 4, vy: 14 + R() * 26, ph: R() * 6, a: 0.3 + R() * 0.5 });
      }
      for (let i = A.motes.length - 1; i >= 0; i--) { const m = A.motes[i]; m.y -= m.vy * dt; m.x += Math.sin(m.y * 0.05 + m.ph) * 8 * dt; if (m.y < -4 || !bm) { if (!bm) m.a -= dt; if (m.y < -4 || m.a <= 0) A.motes.splice(i, 1); } }
    });
  };
  const od = AH.World.prototype.drawOverlays;
  AH.World.prototype.drawOverlays = function (g, cam, time) {
    safe(() => {
      A.crit.forEach((c) => drawCritter(g, cam, c));
      g.save(); g.globalCompositeOperation = 'lighter';
      A.moths.forEach((m) => { const x = m.o.x - cam.x + Math.cos(m.a) * m.r, y = m.o.y - cam.y + (m.o.d.light && m.o.d.light.y || -12) + Math.sin(m.a * 1.3) * m.r * 0.5; g.globalAlpha = 0.5 + 0.4 * Math.sin(m.a * 9); g.fillStyle = '#fff4d0'; g.fillRect(Math.round(x), Math.round(y), 1, 1); g.fillRect(Math.round(x) + (Math.sin(m.a * 14) > 0 ? 1 : -1), Math.round(y) - 1, 1, 1); });
      g.restore(); g.globalAlpha = 1;
      A.leaves.forEach((l) => { const f = Math.floor(l.life * 6) % 3; g.fillStyle = l.c; g.fillRect(Math.round(l.x), Math.round(l.y), f === 1 ? 1 : 2, f === 1 ? 2 : 1); });
    });
    od.apply(this, arguments);
    safe(() => {
      const G = this.G, bm = G.flags.bloodmoon_now && this.def.time; if (!bm && !A.motes.length) return;
      const k = bm ? 1 : 0, pulse = 0.5 + 0.5 * Math.sin(time * 1.6);
      if (bm) {
        const gr = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.62); gr.addColorStop(0, 'rgba(120,10,30,0)'); gr.addColorStop(1, 'rgba(150,12,36,' + (0.28 + 0.1 * pulse) + ')');
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
        /* the moon itself, hanging low at the screen's top edge */
        g.save(); g.globalAlpha = 0.9; g.fillStyle = '#d8283e'; g.beginPath(); g.arc(W / 2, 14, 8, 0, 6.283); g.fill(); g.fillStyle = '#ff6a78'; g.beginPath(); g.arc(W / 2 - 2, 12, 5, 0, 6.283); g.fill();
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.18 + 0.08 * pulse; g.fillStyle = '#ff2a40'; g.beginPath(); g.arc(W / 2, 14, 20, 0, 6.283); g.fill(); g.restore();
      }
      g.save(); g.globalCompositeOperation = 'lighter';
      A.motes.forEach((m) => { g.globalAlpha = Math.max(0, m.a * k || m.a * 0.5); g.fillStyle = '#ff5a6a'; g.fillRect(Math.round(m.x), Math.round(m.y), 1, 1); });
      g.restore(); g.globalAlpha = 1;
    });
  };
  AH.Ambience = Object.assign(A, { release, freeGhost, bindGhost, risenSpawn, spawnCritter });
})();

/* Ashen Hollow - the world: area loading, collision, line-of-sight, A* pathfinding, objects, and the
   full render pipeline (parallax layers, y-sorted sprites, dynamic lighting, atmosphere). */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, S = AH.Sprites, W = AH.W, H = AH.H, T = AH.T, ID = AH.Tiles.ID, INFO = AH.Tiles.INFO;
  const OPAQUE_SPR = { pillar: 1, standing: 1, thicket: 1, sealDoor: 1, gateBig: 1, rubble: 1, altar: 0, organ: 1, coffin: 0, well: 0 };

  /* ===================================================== world objects */
  class Obj {
    constructor(world, d) {
      this.w = world; this.d = d; this.id = d.id; this.k = d.k;
      this.x = (d.tx + 0.5) * T + (d.ox || 0); this.y = (d.ty + 1) * T - 1 + (d.oy || 0);
      this.light = d.light ? Object.assign({ seed: Math.random() * 100 }, d.light) : null;
      this.state = 0; this.t = Math.random() * 10; this.hidden = false; this.pulse = 0; this.taken = false;
      this.spr = d.spr && AH.Props.spr[d.spr]; this.sortY = this.y;
      if (d.k === 'prop' && !this.spr && d.spr !== 'crowspot') { this.spr = null; }
    }
    isHidden() { const d = this.d, G = this.w.G; if (d.hiddenUntil) { if (d.hiddenUntil === 'never') return true; if (!G.flags[d.hiddenUntil] && !this.w.secretOpen(d.hiddenUntil)) return true; } if (this.taken) return true; return false; }
    frame(time) {
      const s = this.spr; if (!s) return null;
      if (!Array.isArray(s)) return s;
      if (this.d.anim) return s[Math.floor(time * (this.d.animSpeed || 9) + this.t) % s.length];
      if (this.d.spr === 'chest' || this.d.spr === 'doorWood' || this.d.spr === 'gateIron' || this.d.spr === 'gateBig') return s[Math.min(s.length - 1, this.state)];
      return s[(this.d.variant || 0) % s.length];
    }
    update(dt) { this.t += dt * 0; if (this.pulse > 0) this.pulse -= dt; this.hidden = this.isHidden(); }
    draw(g, cam, time, sun) {
      if (this.hidden) return;
      const spr = this.frame(time); if (!spr) return;
      const sx = this.x - cam.x, sy = this.y - cam.y;
      if (sx < -80 || sx > W + 80 || sy < -30 || sy > H + 110) return;
      let shear = null;
      const sway = this.d.sway;
      if (sway) { const wind = AH.Weather.wind, ph = this.x * 0.04; shear = (r, h) => { const k = 1 - r / h; return Math.sin(time * (1.1 + wind) + ph) * sway * (0.4 + wind) * k * k * (this.d.tall ? 2.2 : 1.2); }; }
      if (this.d.flip) S.draw(g, spr, this.x - cam.x, this.y - cam.y, { flip: true });
      else S.draw(g, spr, this.x - cam.x, this.y - cam.y, { shear, flash: this.pulse > 0 ? this.pulse * 3 : 0 });
      if (this.d.glow && !this.taken) { const b = Math.sin(time * 3 + this.t) * 0.5 + 0.5; g.globalAlpha = 0.5 * b; g.fillStyle = this.d.glow; g.fillRect(Math.round(sx) - 1, Math.round(sy - 12 - b * 2), 2, 2); g.globalAlpha = 1; }
    }
    shadow(g, cam, sun) {
      if (this.hidden || !this.d.shadow) return;
      const spr = this.frame(sun.time); if (!spr) return;
      const sx = this.x - cam.x, sy = this.y - cam.y; if (sx < -90 || sx > W + 90 || sy < -30 || sy > H + 120) return;
      g.save(); const K = AH.SC || 1; g.setTransform(K, 0, sun.k * K, -sun.len * K, Math.round(sx) * K, Math.round(sy) * K); g.globalAlpha = sun.alpha;
      g.drawImage(S.sil(spr, '#000000'), -spr.ax, -spr.ay, spr.w, spr.h); g.restore(); g.globalAlpha = 1;
    }
    interactable() { return !this.hidden && this.d.act && !this.taken; }
  }

  /* ===================================================== A* */
  function astar(world, sx, sy, tx, ty, maxN) {
    const w = world.w, h = world.h, start = (sy | 0) * w + (sx | 0), goal = (ty | 0) * w + (tx | 0);
    if (start === goal) return [];
    const open = [start], g = new Map([[start, 0]]), from = new Map(), f = new Map([[start, 0]]), closed = new Set();
    const hF = (i) => Math.abs((i % w) - (goal % w)) + Math.abs(((i / w) | 0) - ((goal / w) | 0));
    let n = 0;
    while (open.length && n++ < (maxN || 700)) {
      let bi = 0; for (let i = 1; i < open.length; i++) if (f.get(open[i]) < f.get(open[bi])) bi = i;
      const cur = open.splice(bi, 1)[0];
      if (cur === goal) { const path = []; let c = cur; while (from.has(c)) { path.push([(c % w) * T + T / 2, ((c / w) | 0) * T + T / 2]); c = from.get(c); } return path.reverse(); }
      closed.add(cur);
      const cx = cur % w, cy = (cur / w) | 0;
      for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        const nx = cx + d[0], ny = cy + d[1]; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const ni = ny * w + nx; if (closed.has(ni) || (world.solid[ni] && ni !== goal)) continue;
        if (d[0] && d[1] && (world.solid[cy * w + nx] || world.solid[ny * w + cx])) continue;
        const ng = g.get(cur) + (d[0] && d[1] ? 1.41 : 1);
        if (!g.has(ni) || ng < g.get(ni)) { g.set(ni, ng); from.set(ni, cur); f.set(ni, ng + hF(ni)); if (open.indexOf(ni) < 0) open.push(ni); }
      }
    }
    return null;
  }

  /* ===================================================== World */
  class World {
    constructor(G) {
      this.G = G; this.time = 0; this.cam = { x: 0, y: 0, shake: 0, sx: 0, sy: 0, look: { x: 0, y: 0 } };
      this.objs = []; this.enemies = []; this.npcs = []; this.projectiles = []; this.zones = []; this.tele = []; this.fx = []; this.pickups = []; this.corpses = []; this.allies = []; this.ambient = []; this.rings = [];
      this.lights = []; this.sun = { k: 0.6, len: 0.4, alpha: 0.3, time: 0 }; this.w = 1; this.h = 1; this.tokens = [];
      this.areaId = null; this.discovered = {}; this.noises = [];
    }
    /* ---------- loading ---------- */
    load(areaId, spawnName, opts) {
      const G = this.G; opts = opts || {};
      if (this.areaId) this.saveAreaState();
      const def = AH.Maps[areaId](); this.def = def; this.areaId = areaId; this.w = def.w; this.h = def.h;
      this.tiles = new Uint8Array(def.tiles); this.theme = def.theme;
      const st = (G.areaState[areaId] = G.areaState[areaId] || { objs: {}, secrets: {}, killed: {}, explored: null, zones: {} });
      this.state = st;
      if (!st.explored) st.explored = new Uint8Array(def.w * def.h); else if (!(st.explored instanceof Uint8Array)) st.explored = Uint8Array.from(Object.values(st.explored));
      /* secrets already opened */
      def.secrets.forEach((s) => { if (st.secrets[s.id]) this.applySecret(s, true); });
      if (areaId === 'hamlet' && G.flags.altar_crypt) { const s = def.secrets.find((q) => q.id === 'altar_crypt'); if (s) this.applySecret(s, true); }
      this.solid = new Uint8Array(def.w * def.h); this.opaque = new Uint8Array(def.w * def.h);
      this.objs = []; this.enemies = []; this.npcs = []; this.projectiles = []; this.zones = []; this.tele = []; this.fx = []; this.pickups = []; this.corpses = []; this.allies = []; this.ambient = []; this.rings = [];
      this.bossGate = false; this.arena = null; this.boss = null; this.ambientOverride = null; this.tokens = [];
      AH.Particles.clear();
      def.objs.forEach((d) => {
        if (d.k === 'light') { this.objs.push(new Obj(this, d)); return; }
        if (d.spr === 'crowspot') { this.ambient.push(AH.Ambient.makeCrow(this, d.tx, d.ty)); return; }
        const o = new Obj(this, d); const s = st.objs[o.id]; if (s) Object.assign(o, s);
        this.objs.push(o);
      });
      /* collision & opacity from tiles + objects */
      for (let i = 0; i < this.tiles.length; i++) { const inf = INFO[this.tiles[i]] || INFO[0]; this.solid[i] = inf.solid ? 1 : 0; this.opaque[i] = inf.opaque ? 1 : 0; }
      this.objs.forEach((o) => this.applyObjSolid(o));
      this.refreshOpenState();
      this.ground = AH.Tiles.bake({ w: def.w, h: def.h, tiles: this.tiles, theme: def.theme, floorUnder: def.floorUnder, fenceGround: def.fenceGround });
      this.waterList = (AH.Tiles.lastWater = this.ground && []); this.area = { w: def.w, h: def.h, tiles: this.tiles, theme: def.theme, water: [] };
      for (let y = 0; y < def.h; y++) for (let x = 0; x < def.w; x++) { const t = this.tiles[y * def.w + x]; if (t === ID.WATER || t === ID.DEEP) this.area.water.push([x, y, t === ID.DEEP]); }
      /* bake override for water (so animated water is drawn each frame) */
      this.bakeWaterHoles();
      /* npcs */
      def.npcs.forEach((n) => { const nd = AH.NPCDefs[n.id]; if (!nd) return; if (G.flags['gone_' + n.id] && !nd.ambient) return; this.npcs.push(new AH.NPC(this, nd, n)); });
      /* player */
      const sp = def.spawns[spawnName] || def.spawns[Object.keys(def.spawns)[0]];
      G.player.place(this, (sp.tx + 0.5) * T, (sp.ty + 1) * T - 3, sp.face);
      /* creatures */
      AH.Ecology.populate(this, true);
      this.cam.x = U.clamp(G.player.x - W / 2, 0, Math.max(0, def.w * T - W)); this.cam.y = U.clamp(G.player.y - H / 2, 0, Math.max(0, def.h * T - H));
      this.lightCache = null;
      AH.Weather.setArea(def); AH.Audio.music(opts.music || def.music);
      this.spawnName = spawnName || null; AH.Events.onEnter(this, areaId);
      G.visit(areaId);
      this.markExplored();
    }
    bakeWaterHoles() { /* water is drawn per-frame; clear baked water pixels not required (baked uses deep frame) */ }
    saveAreaState() {
      const st = this.state; if (!st) return;
      this.objs.forEach((o) => { if (o.id && (o.state || o.taken || o.opened)) st.objs[o.id] = { state: o.state, taken: o.taken, opened: o.opened }; });
    }
    applySecret(s, silent) {
      if (s.tiles) s.tiles.forEach((t) => (this.tiles[t[1] * this.w + t[0]] = s.to)); else this.tiles[s.ty * this.w + s.tx] = s.to;
      if (!silent) { /* re-bake and refresh collision */ this.rebuildStatic(); }
    }
    openSecret(id) {
      const s = this.def.secrets.find((q) => q.id === id); if (!s) return;
      this.state.secrets[id] = true; this.applySecret(s, false); AH.Audio.sfx('stone_slide'); this.addShake(2.5);
      AH.Particles.dust((s.tx + 0.5) * T, (s.ty + 0.5) * T, 14);
    }
    secretOpen(id) { return !!(this.state && this.state.secrets[id]) || !!this.G.flags['secret_' + id]; }
    rebuildStatic() {
      for (let i = 0; i < this.tiles.length; i++) { const inf = INFO[this.tiles[i]] || INFO[0]; this.solid[i] = inf.solid ? 1 : 0; this.opaque[i] = inf.opaque ? 1 : 0; }
      this.objs.forEach((o) => this.applyObjSolid(o)); this.refreshOpenState();
      this.ground = AH.Tiles.bake({ w: this.w, h: this.h, tiles: this.tiles, theme: this.theme, floorUnder: this.def.floorUnder, fenceGround: this.def.fenceGround });
      this.area.water = []; for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const t = this.tiles[y * this.w + x]; if (t === ID.WATER || t === ID.DEEP) this.area.water.push([x, y, t === ID.DEEP]); }
      this.lightCache = null; this.def.objs.forEach(() => 0); this.objs.forEach((o) => { if (o.light) o.light.poly = null; });
    }
    /* objects whose collision depends on game state */
    refreshOpenState() {
      const G = this.G;
      this.objs.forEach((o) => {
        const d = o.d; if (!d.gateGroup && d.id !== 'crypt_gate' && d.id !== 'thicket' && d.id !== 'blood_seal' && d.id !== 'drowned_gate' && d.id !== 'chapel_rubble' && d.id !== 'chapel_push') return;
        let open = false;
        if (d.gateGroup === 'choir_gate') open = !!G.flags.choir_gate_open; else if (d.gateGroup === 'boss_gate') open = !this.bossGate; else if (d.gateGroup === 'exit_gate') open = !!G.flags.boss_done;
        else if (d.id === 'crypt_gate') open = !!G.flags.crypt_open; else if (d.id === 'thicket') open = !!G.flags.thicket_open; else if (d.id === 'blood_seal') open = !!G.flags.blood_seal_open;
        else if (d.id === 'drowned_gate') open = !!G.flags.drowned_gate; else if (d.id === 'chapel_rubble') open = !!G.flags.chapel_open;
        o.openState = open; o.state = open ? 1 : 0; if (d.id === 'blood_seal') o.hiddenAfter = open;
        const tiles = d.solidTiles || [[d.tx, d.ty]];
        tiles.forEach((t) => { const i = t[1] * this.w + t[0]; if (open) { this.solid[i] = 0; this.opaque[i] = INFO[this.tiles[i]].opaque ? 1 : 0; } else { this.solid[i] = 1; if (OPAQUE_SPR[d.spr]) this.opaque[i] = 1; } });
        if (d.id === 'boss_gate_a' || d.gateGroup === 'boss_gate') { const i = d.ty * this.w + d.tx; this.solid[i] = open ? 0 : 1; }
      });
      if (G.flags.blood_seal_open) this.objs.forEach((o) => { if (o.d.id === 'blood_seal') o.taken = true; });
      if (G.flags.thicket_open) this.objs.forEach((o) => { if (o.d.id === 'thicket') o.taken = true; });
      if (G.flags.chapel_open) this.objs.forEach((o) => { if (o.d.id === 'chapel_rubble') o.taken = true; });
    }
    applyObjSolid(o) {
      const d = o.d; if (d.k !== 'prop' || !d.solid) return;
      if (d.gateGroup === 'boss_gate' || d.id === 'chapel_push') return;
      const tiles = d.solidTiles || [[d.tx, d.ty]];
      tiles.forEach((t) => { const i = t[1] * this.w + t[0]; if (i < 0 || i >= this.solid.length) return; this.solid[i] = 1; if (d.tall && /^tree_/.test(d.spr) || OPAQUE_SPR[d.spr]) this.opaque[i] = 1; });
    }
    setBossGate(closed) { this.bossGate = closed; this.refreshOpenState(); this.objs.forEach((o) => { if (o.d.gateGroup === 'boss_gate') { o.state = closed ? 0 : 1; const i = o.d.ty * this.w + o.d.tx; this.solid[i] = closed ? 1 : 0; } }); AH.Audio.sfx('door'); this.addShake(2); }

    /* ---------- spatial queries ---------- */
    tileAt(px, py) { const x = Math.floor(px / T), y = Math.floor(py / T); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return ID.VOID; return this.tiles[y * this.w + x]; }
    solidAt(px, py) { const x = Math.floor(px / T), y = Math.floor(py / T); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return true; return this.solid[y * this.w + x] === 1; }
    opaqueAt(px, py) { const x = Math.floor(px / T), y = Math.floor(py / T); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return true; return this.opaque[y * this.w + x] === 1; }
    matAt(px, py) { const inf = INFO[this.tileAt(px, py)]; return inf ? inf.mat : 'dirt'; }
    isWater(px, py) { const t = this.tileAt(px, py); return t === ID.WATER; }
    boxBlocked(x, y, r) { const rx = r, ry = r * 0.55; return this.solidAt(x - rx, y - ry) || this.solidAt(x + rx, y - ry) || this.solidAt(x - rx, y + ry) || this.solidAt(x + rx, y + ry); }
    moveEnt(e, dx, dy) {
      let hit = false;
      if (dx) { const nx = e.x + dx; if (!this.boxBlocked(nx, e.y, e.r)) e.x = nx; else { hit = true; const step = Math.sign(dx); for (let i = 0; i < Math.abs(dx); i++) { if (!this.boxBlocked(e.x + step * 0.5, e.y, e.r)) e.x += step * 0.5; else break; } } }
      if (dy) { const ny = e.y + dy; if (!this.boxBlocked(e.x, ny, e.r)) e.y = ny; else { hit = true; const step = Math.sign(dy); for (let i = 0; i < Math.abs(dy); i++) { if (!this.boxBlocked(e.x, e.y + step * 0.5, e.r)) e.y += step * 0.5; else break; } } }
      return hit;
    }
    los(x0, y0, x1, y1) { const d = U.dist(x0, y0, x1, y1), n = Math.ceil(d / 6); for (let i = 1; i < n; i++) { const t = i / n; if (this.opaqueAt(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false; } return true; }
    path(sx, sy, tx, ty) { return astar(this, sx / T, sy / T, tx / T, ty / T, 600); }
    freePoint(x, y, r) { return !this.boxBlocked(x, y, r || 4); }
    /* nearest free spot around a point (for spawns/blinks) */
    nearestFree(x, y, r) { if (this.freePoint(x, y, r)) return [x, y]; for (let k = 1; k < 12; k++) for (let a = 0; a < 8; a++) { const px = x + Math.cos(a * 0.785) * k * 6, py = y + Math.sin(a * 0.785) * k * 6; if (this.freePoint(px, py, r)) return [px, py]; } return [x, y]; }
    noise(x, y, r, src) { this.enemies.forEach((e) => { if (e.dead || e.ally) return; if (U.dist(x, y, e.x, e.y) < r * (e.def.hear / 90)) e.heard(x, y, src); }); }
    enemiesNear(x, y, r) { const out = []; for (const e of this.enemies) if (!e.dead && !e.ally && !e.dormant && U.dist(x, y, e.x, e.y) <= r + e.r) out.push(e); return out; }
    addShake(a) { if (this.G.settings.shake > 0) this.cam.shake = Math.min(7, Math.max(this.cam.shake, a * this.G.settings.shake)); }
    addEnemy(type, tx, ty, o) { const e = AH.makeEnemy(this, type, tx, ty, o); this.enemies.push(e); return e; }
    spawnPickup(x, y, itemId, n) { this.pickups.push({ x, y, z: 8, vz: 60, item: itemId, n: n || 1, t: 0, life: 90 }); }
    spawnFx(o) { this.fx.push(o); return o; }
    impact(x, y, ang, size, col) { this.fx.push({ k: 'impact', x, y, ang, size: size || 1, t: 0, max: 0.14, col: col || '#ffffff' }); }
    slash(x, y, ang, reach, arc, col, life) { this.fx.push({ k: 'slash', x, y, ang, reach, arc, t: 0, max: life || 0.16, col: col || '#e8f0ff' }); }
    ring(x, y, r, col, life, sy) { AH.Particles.ringBurst(x, y, r, col, life); }
    /* a spell/attack struck point (x,y,r): let world objects respond */
    spellHit(x, y, r, spell, extra) {
      this.objs.forEach((o) => { if (o.hidden || o.taken) return; const d = o.d; if (!d.act && !d.ignite && !d.living) return; if (U.dist(x, y, o.x, o.y - 6) > r + 10) return; AH.Interact.onSpell(o, spell, this.G, extra); });
    }
    /* fire-sources the gas can ignite */
    fireNear(x, y, r) { return this.objs.some((o) => !o.hidden && o.d.ignite && U.dist(x, y, o.x, o.y - 8) < r); }

    markExplored() {
      const p = this.G.player; if (!p) return; const ex = this.state.explored, rr = 7; const cx = Math.floor(p.x / T), cy = Math.floor(p.y / T);
      for (let y = cy - rr; y <= cy + rr; y++) for (let x = cx - rr; x <= cx + rr; x++) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) continue; if ((x - cx) ** 2 + (y - cy) ** 2 <= rr * rr) ex[y * this.w + x] = 1; }
    }

    /* ---------- update ---------- */
    update(dt) {
      const G = this.G, p = G.player; this.time += dt;
      p.update(dt, this);
      this.objs.forEach((o) => o.update(dt));
      this.npcs.forEach((n) => n.update(dt));
      for (let i = this.enemies.length - 1; i >= 0; i--) { const e = this.enemies[i]; e.update(dt); if (e.remove) this.enemies.splice(i, 1); }
      this.allies.forEach((a) => a.update(dt)); this.allies = this.allies.filter((a) => !a.remove);
      this.projectiles.forEach((q) => q.update(dt)); this.projectiles = this.projectiles.filter((q) => !q.dead);
      this.zones.forEach((z) => z.update(dt)); this.zones = this.zones.filter((z) => !z.dead);
      this.tele.forEach((t) => t.update(dt)); this.tele = this.tele.filter((t) => !t.dead);
      this.fx.forEach((f) => { f.t += dt; if (f.upd) f.upd(f, dt); }); this.fx = this.fx.filter((f) => f.t < f.max);
      this.ambient.forEach((a) => a.update(dt));
      this.corpses.forEach((c) => (c.t += dt)); this.corpses = this.corpses.filter((c) => c.t < 120 && !c.used);
      for (let i = this.pickups.length - 1; i >= 0; i--) {
        const k = this.pickups[i]; k.t += dt; k.life -= dt; k.z = Math.max(0, k.z + k.vz * dt); k.vz -= 260 * dt; if (k.z === 0 && k.vz < 0) k.vz = 0;
        if (U.dist(k.x, k.y, p.x, p.y) < 14 && k.t > 0.35 && !p.dead) { G.giveItem(k.item, k.n, true); this.pickups.splice(i, 1); } else if (k.life <= 0) this.pickups.splice(i, 1);
      }
      AH.Ecology.update(this, dt); AH.Events.update(this, dt);
      /* camera */
      this.updateCamera(dt);
      /* zones & exits */
      this.checkZones(p); this.checkExits(p);
      this.markExplored();
      /* sun / shadows */
      const hr = G.hour, day = AH.Lighting.daylight(hr), ang = U.clamp((hr - 6) / 12, 0, 1);
      this.sun.time = this.time; this.sun.k = day > 0.3 ? U.lerp(0.9, -0.9, ang) : -0.45; this.sun.len = day > 0.3 ? 0.28 + Math.abs(0.5 - ang) * 0.5 : 0.36; this.sun.alpha = day > 0.3 ? 0.34 * day : 0.2;
      this.sun.alpha *= 1 - AH.Weather.fogK * 0.4 - AH.Weather.rainK * 0.2;
    }
    updateCamera(dt) {
      const p = this.G.player, c = this.cam, ax = p.aimVec ? p.aimVec() : { x: 0, y: 0 };
      const lookX = U.clamp(p.vx * 0.22 + ax.x * 14, -26, 26), lookY = U.clamp(p.vy * 0.22 + ax.y * 10, -18, 18);
      c.look.x += (lookX - c.look.x) * Math.min(1, dt * 3.2); c.look.y += (lookY - c.look.y) * Math.min(1, dt * 3.2);
      const tx = p.x + c.look.x - W / 2 + Math.sin(this.time * 0.6) * 0.7, ty = p.y - 8 + c.look.y - H / 2 + Math.cos(this.time * 0.47) * 0.5;
      const k = 1 - Math.pow(0.0025, dt);
      c.x += (tx - c.x) * k; c.y += (ty - c.y) * k;
      c.x = U.clamp(c.x, 0, Math.max(0, this.w * T - W)); c.y = U.clamp(c.y, 0, Math.max(0, this.h * T - H));
      if (this.w * T < W) c.x = (this.w * T - W) / 2; if (this.h * T < H) c.y = (this.h * T - H) / 2;
      c.shake = Math.max(0, c.shake - dt * 14);
      c.sx = c.shake > 0.05 ? (Math.random() - 0.5) * 2 * c.shake : 0; c.sy = c.shake > 0.05 ? (Math.random() - 0.5) * 2 * c.shake : 0;
    }
    checkZones(p) {
      const G = this.G;
      this.def.zones.forEach((z) => {
        const inside = p.x >= z.x * T && p.y >= z.y * T && p.x < (z.x + z.w) * T && p.y < (z.y + z.h) * T;
        if (inside && !this.state.zones[z.name]) { this.state.zones[z.name] = true; if (z.discover) { G.toast('Discovered: ' + z.discover, '#e8c670'); G.addXP(z.xp || 10, true); AH.Audio.sfx('chime', { v: 0.6 }); } }
        if (z.arena) { if (inside && !this.G.flags.boss_started && !this.G.flags.boss_done) AH.Events.startBoss(this, 'choirmaster'); }
      });
    }
    checkExits(p) {
      if (this.G.fade && this.G.fade.dir !== 0) return;
      for (const ex of this.def.exits) {
        if (p.x >= ex.x * T && p.x < (ex.x + ex.w) * T && p.y >= ex.y * T && p.y < (ex.y + ex.h) * T + 6) {
          if (ex.cond && !this.G.flags[ex.cond] && !this.secretOpen(ex.cond)) continue;
          if (ex.to === 'epilogue') { this.G.goEpilogue(); return; }
          this.G.changeArea(ex.to, ex.spawn); return;
        }
      }
    }
    /* ---------- lights ---------- */
    collectLights() {
      const G = this.G, p = G.player, L = [], def = this.def;
      this.objs.forEach((o) => {
        if (o.hidden || !o.light) return; const l = o.light, d = o.d;
        if (d.arenaLight && this.ambientOverride === 'dark' && !this.arenaRelit) return;
        if (d.glowNight && AH.Lighting.daylight(G.hour) > 0.5) return;
        if (d.hiddenUntil === 'veil') return;
        if (!l._o) l._o = { x: 0, y: 0, r: 0, color: l.color, i: l.i || 1, flicker: l.flicker, seed: l.seed, shadow: l.shadow, poly: null, glow: l.glow };
        const q = l._o; q.x = o.x + (d.k === 'light' ? 0 : 0); q.y = (d.k === 'light' ? (d.ty + 0.5) * T : o.y) + (l.y || 0); if (d.k === 'light') q.x = (d.tx + 0.5) * T; q.r = l.r; q.shadow = l.shadow; L.push(q);
      });
      /* dynamic: player lantern */
      const lr = 120 * (1 + p.mod('lantern')) * (p.lanternK || 1);
      L.push({ x: p.x, y: p.y - 10, r: lr, color: '#ffc874', i: 1.0, flicker: 0.12, seed: 3, shadow: true });
      L.push({ x: p.x, y: p.y - 10, r: 34, color: '#e8e0d0', i: 0.35, seed: 4, noGlow: true });
      this.projectiles.forEach((q) => { if (q.light) L.push({ x: q.x, y: q.y - (q.z || 6), r: q.light, color: q.color, i: 0.9, flicker: 0.2, seed: q.seed || 1 }); });
      this.zones.forEach((z) => { if (z.light) L.push({ x: z.x, y: z.y, r: z.light, color: z.color, i: z.lightI || 0.6, flicker: 0.2, seed: 7 }); });
      this.fx.forEach((f) => { if (f.light) L.push({ x: f.x, y: f.y - (f.z || 0), r: f.light * (1 - f.t / f.max), color: f.lcol || f.col, i: 1, noGlow: false, seed: 5 }); });
      this.enemies.forEach((e) => { if (e.lightR && !e.dead && !e.dormant) L.push({ x: e.x, y: e.y - 8, r: e.lightR, color: e.lightCol, i: 0.7, flicker: 0.25, seed: e.seed }); });
      this.allies.forEach((a) => { if (a.lightR) L.push({ x: a.x, y: a.y - 8, r: a.lightR, color: a.lightCol, i: 0.7, flicker: 0.2, seed: 9 }); });
      this.npcs.forEach((n) => { if (n.lightR && n.alpha > 0.2) L.push({ x: n.x, y: n.y - 10, r: n.lightR, color: n.lightCol, i: 0.7, flicker: 0.15, seed: 11 }); });
      this.pickups.forEach((k) => L.push({ x: k.x, y: k.y - 8, r: 22, color: '#ffe0a0', i: 0.5, seed: 13, noGlow: true }));
      return L;
    }
    ambientColor() {
      const G = this.G, def = this.def; let a;
      if (def.time) a = AH.Lighting.ambientAt(G.hour); else a = def.ambient || '#241f36';
      const wk = AH.Weather;
      if (wk.rainK > 0) a = U.mix(a, '#0a0e18', 0.18 * wk.rainK);
      if (def.canopy) a = U.mix(a, '#05080a', 0.15 * def.canopy);
      if (G.flags.bloodmoon_now && def.time) a = U.mix(a, '#5a1020', 0.35);
      if (this.ambientOverride === 'dark') a = U.mix(a, '#000000', 0.55);
      if (G.player.corruption >= 50) a = U.mix(a, '#200a28', Math.min(0.25, (G.player.corruption - 40) / 200));
      return a;
    }

    /* ---------- render ---------- */
    draw(g) {
      const G = this.G, cam = this.cam, p = G.player, time = this.time;
      const cx = Math.round(cam.x + cam.sx), cy = Math.round(cam.y + cam.sy), C = { x: cx, y: cy };
      g.fillStyle = '#050407'; g.fillRect(0, 0, W, H);
      if (AH.Hi && AH.Hi.on) { if (this._gh0 !== this.ground) { this._gh0 = this.ground; this._gh = AH.Hi.detail(AH.Hi.up(this.ground, 'aa'), this.w, this.h, this.tiles); } g.drawImage(this._gh, cx * 2, cy * 2, W * 2, H * 2, 0, 0, W, H); }
      else g.drawImage(this.ground, cx, cy, W, H, 0, 0, W, H);
      AH.Tiles.drawWater(g, this.area, C, time);
      AH.Weather.drawClouds(g, C, time, AH.Lighting.daylight(G.hour));
      /* decals: corpses */
      this.corpses.forEach((c) => c.draw && c.draw(g, C, time));
      this.zones.forEach((z) => z.drawGround && z.drawGround(g, C, time)); this.tele.forEach((t) => t.draw(g, C, time));
      /* flat objects & shadows */
      this.objs.forEach((o) => { if (o.d.flat) o.draw(g, C, time, this.sun); });
      this.objs.forEach((o) => { if (!o.d.flat) o.shadow(g, C, this.sun); });
      /* y-sorted sprites */
      const list = [];
      this.objs.forEach((o) => { if (!o.d.flat && !o.d.fg && o.k !== 'light' && !o.hidden) list.push(o); });
      this.npcs.forEach((n) => list.push(n)); this.enemies.forEach((e) => { if (!e.dormant) list.push(e); }); this.allies.forEach((a) => list.push(a)); this.ambient.forEach((a) => { if (!a.fly) list.push(a); });
      list.push(p);
      this.pickups.forEach((k) => list.push({ sortY: k.y, draw: (gg, c, t) => this.drawPickup(gg, c, t, k), shadow: null }));
      list.forEach((o) => { if (o.shadow && !(o instanceof Obj)) o.shadow(g, C, time); });
      list.sort((a, b) => (a.sortY !== undefined ? a.sortY : a.y) - (b.sortY !== undefined ? b.sortY : b.y));
      list.forEach((o) => o.draw(g, C, time, this.sun));
      this.projectiles.forEach((q) => q.draw(g, C, time)); AH.Events.drawProcession(this, g, C, time);
      this.fx.forEach((f) => this.drawFx(g, C, f, time));
      this.zones.forEach((z) => z.draw && z.draw(g, C, time));
      AH.Particles.draw(g, C, false);
      this.ambient.forEach((a) => { if (a.fly) a.draw(g, C, time); });
      /* parallax canopy, fog */
      this.objs.forEach((o) => { if (o.d.fg && !o.hidden) o.draw(g, C, time, this.sun); });
      AH.Weather.drawCanopy(g, C, time); AH.Weather.drawFog(g, C, time);
      /* lighting */
      const lights = this.collectLights();
      AH.Lighting.render(g, C, this, this.ambientColor(), lights, time, { lightBoost: G.flags.bloodmoon_now ? 0.9 : 1 });
      /* emissive passes that ignore darkness */
      AH.Particles.draw(g, C, true);
      this.drawEmissive(g, C, time);
      AH.Weather.drawRain(g, C, 1 / 60); AH.Weather.drawFlash(g);
      AH.Lighting.vignette(g, 0.9);
      this.drawOverlays(g, C, time);
    }
    drawPickup(g, cam, t, k) {
      const def = AH.Items[k.item]; const x = Math.round(k.x - cam.x), y = Math.round(k.y - cam.y);
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x - 3, y, 7, 2);
      const bob = Math.sin(t * 4 + k.x) * 1.5 + k.z; g.drawImage(AH.Icons.of(def, AH.Rarity[def.rarity].col), x - 8, y - 18 - bob);
    }
    drawEmissive(g, cam, time) {
      g.globalCompositeOperation = 'lighter';
      this.objs.forEach((o) => {
        if (o.hidden) return; const d = o.d;
        if (d.spr === 'standing' && (AH.Lighting.daylight(this.G.hour) < 0.5 || this.G.flags['stone_' + (d.act && d.act.stone)])) { const s = AH.Props.spr.standingGlow; g.globalAlpha = 0.6 + Math.sin(time * 2 + o.x) * 0.25; S.draw(g, s, o.x - cam.x, o.y - cam.y); }
        if (d.spr === 'sealDoor' || d.spr === 'window' || d.spr === 'waystone' || d.spr === 'chandelier' || d.spr === 'brazier' || d.spr === 'torch' || d.spr === 'candles' || d.spr === 'candelabra' || d.spr === 'campfire' || d.spr === 'cauldron' || d.spr === 'candle' || d.spr === 'shroom' || d.spr === 'table') { const f = o.frame(time); if (f && o.d.spr !== 'chandelier' && !(o.d.arenaLight && this.ambientOverride === 'dark' && !this.arenaRelit)) { g.globalAlpha = d.spr === 'window' || d.spr === 'waystone' ? 0.35 : 0.22; S.draw(g, f, o.x - cam.x, o.y - cam.y); } }
      });
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
    drawFx(g, cam, f, time) {
      const k = f.t / f.max, x = Math.round(f.x - cam.x), y = Math.round(f.y - cam.y - (f.z || 0));
      if (f.k === 'impact') {
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - k; g.fillStyle = f.col;
        const n = 7, L = (4 + f.size * 5) * (0.5 + k);
        for (let i = 0; i < n; i++) { const a = f.ang + (i - 3) * 0.5 + 0.2; for (let r = 2; r < L; r += 2) g.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r * 0.8), 1, 1); }
        g.fillRect(x - 1, y - 1, 3, 3); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      } else if (f.k === 'slash') {
        g.globalCompositeOperation = 'lighter'; const steps = 14, a0 = f.ang - f.arc / 2, prog = U.ease.outCubic(Math.min(1, k * 1.6));
        for (let i = 0; i < steps * prog; i++) {
          const a = a0 + (i / steps) * f.arc, fade = 1 - k, w = 1 + (i / steps) * 2;
          for (let r = f.reach - 5; r < f.reach + 2; r += 1) { g.globalAlpha = fade * (r > f.reach - 2 ? 1 : 0.5) * (0.3 + i / steps); g.fillStyle = r > f.reach - 1 ? '#ffffff' : f.col; g.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y - 8 + Math.sin(a) * r * 0.85), 1, 1); }
        }
        g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      } else if (f.k === 'text') {
        const yy = y - k * 14; g.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3; AH.Font.draw(g, f.text, x, yy, f.col, { align: 'center', outline: '#0b0910', shadow: false }); g.globalAlpha = 1;
      } else if (f.k === 'bolt') {
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - k; g.strokeStyle = f.col; g.lineWidth = 1; g.beginPath(); let px = x, py = y - 140; g.moveTo(px, py); const rg = U.mulberry32(f.seed); for (let i = 0; i < 9; i++) { px += (rg() - 0.5) * 14 + (x - px) * 0.18; py += 16; g.lineTo(Math.round(px), py); } g.lineTo(x, y); g.stroke(); g.strokeStyle = '#fff'; g.stroke();
        g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      } else if (f.draw) f.draw(g, cam, f, time);
    }
    /* Witchsight (hold V): shows what the watchers see, where the village is at, and what answers to a hand. */
    drawSight(g, cam, time) {
      const G = this.G, p = G.player, held = AH.Input.held('sight') && !G.screen && !p.dead;
      this.sightK = U.lerp(this.sightK || 0, held ? 1 : 0, held ? 0.14 : 0.2);
      const k = this.sightK; if (k < 0.02) return;
      g.save();
      g.globalAlpha = 0.2 * k; g.fillStyle = '#241446'; g.fillRect(0, 0, W, H);
      const pulse = 0.5 + 0.5 * Math.sin(time * 3);
      /* watchers: sight cones, hotter when they are hunting */
      this.enemies.forEach((e) => {
        if (e.dead || e.ally || !e.def || !e.def.sight) return;
        const x = e.x - cam.x, y = e.y - cam.y - 6; if (x < -140 || x > W + 140 || y < -140 || y > H + 140) return;
        const hunting = e.state && e.state !== 'idle', r = e.def.sight * AH.Weather.sightMult(), half = hunting ? Math.PI : 1.3;
        g.globalAlpha = (hunting ? 0.2 : 0.14) * k; g.fillStyle = hunting ? '#ff5a3a' : '#e8c060';
        g.beginPath(); g.moveTo(x, y); if (hunting) g.arc(x, y, r, 0, Math.PI * 2); else g.arc(x, y, r, e.ang - half, e.ang + half); g.closePath(); g.fill();
        g.globalAlpha = (0.55 + 0.25 * pulse) * k; g.strokeStyle = hunting ? '#ff7a5a' : '#f0d080'; g.lineWidth = 1; g.stroke();
        g.fillStyle = hunting ? '#ff7a5a' : '#f0d080'; g.fillRect(Math.round(x) - 1, Math.round(y) - 14, 3, 3);
      });
      /* people: who they are and what they are doing now */
      const ACT = { garden: 'tends her garden', hearth: 'by the hearth', vigil: 'keeps vigil', absent: 'not here', play: 'at play', sleep: 'asleep', forage: 'foraging', chant: 'chanting', pray: 'in prayer', brew: 'brewing' };
      this.npcs.forEach((n) => {
        if (n.alpha < 0.3) return; const x = Math.round(n.x - cam.x), y = Math.round(n.y - cam.y - 32); if (x < -60 || x > W + 60 || y < -10 || y > H + 10) return;
        const t1 = n.def.name.split(' ')[0], t2 = (n.plan && ACT[n.plan.act]) || ''; const wd = Math.max(AH.Font.width(t1), AH.Font.width(t2)) + 8;
        g.globalAlpha = 0.85 * k; g.fillStyle = 'rgba(12,8,22,0.85)'; g.fillRect(x - (wd >> 1), y - 2, wd, t2 ? 19 : 11); g.strokeStyle = n.def.col || '#c8a8e8'; g.strokeRect(x - (wd >> 1) + 0.5, y - 1.5, wd - 1, (t2 ? 19 : 11) - 1);
        AH.Font.draw(g, t1, x, y, n.def.col || '#e6dcc4', { align: 'center', shadow: false }); if (t2) AH.Font.draw(g, t2, x, y + 8, '#a89cb8', { align: 'center', shadow: false });
      });
      /* things that answer to a hand */
      const ring = (wx, wy, col) => {
        const x = Math.round(wx - cam.x), y = Math.round(wy - cam.y); if (x < -20 || x > W + 20 || y < -20 || y > H + 20) return;
        const r = 5 + pulse * 2; g.globalAlpha = (0.5 + 0.4 * pulse) * k; g.strokeStyle = col; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y - 4, r, r * 0.55, 0, 0, Math.PI * 2); g.stroke();
        g.fillStyle = col; g.fillRect(x, y - 5 - Math.round(pulse * 3), 1, 1);
      };
      this.objs.forEach((o) => { if (o.k === 'light' || o.hidden || o.taken || !o.d || !o.d.act || U.dist(o.x, o.y, p.x, p.y) > 150) return; ring(o.x, o.y, '#9ad8ff'); });
      this.pickups.forEach((q) => { if (U.dist(q.x, q.y, p.x, p.y) < 170) ring(q.x, q.y, '#ffd070'); });
      g.restore();
    }
    drawOverlays(g, cam, time) {
      const G = this.G, p = G.player;
      this.drawSight(g, cam, time);
      /* corruption: veins creeping from the screen edges */
      if (p.corruption >= 25) {
        const k = U.clamp((p.corruption - 20) / 80, 0, 1), n = Math.floor(8 + k * 30); g.fillStyle = p.corruption > 75 ? '#8a1f6a' : '#5a2a7a';
        for (let i = 0; i < n; i++) { const side = i % 4, t = U.hash(i, 3, 9) * (side % 2 ? H : W), l = (6 + k * 26) * (0.6 + 0.4 * Math.sin(time * 0.8 + i)); for (let q = 0; q < l; q++) { const wob = Math.sin(q * 0.5 + i) * 2; let x, y; if (side === 0) { x = t + wob; y = q; } else if (side === 1) { x = W - q; y = t + wob; } else if (side === 2) { x = t + wob; y = H - q; } else { x = q; y = t + wob; } g.globalAlpha = 0.5 * (1 - q / l) * k; g.fillRect(Math.round(x), Math.round(y), 1, 1); } }
        g.globalAlpha = 1;
      }
      if (p.hurtFlash > 0) { const hk = Math.min(1, p.hurtFlash * 2); g.globalAlpha = 0.16 * hk; g.fillStyle = '#7a0a14'; g.fillRect(0, 0, W, H); g.globalAlpha = 0.5 * hk; g.fillRect(0, 0, W, 5); g.fillRect(0, H - 5, W, 5); g.fillRect(0, 0, 5, H); g.fillRect(W - 5, 0, 5, H); g.globalAlpha = 1; }
      if (p.hp < p.maxHp * 0.3 && !p.dead) { const b = (Math.sin(time * 5) * 0.5 + 0.5) * 0.18 * (1 - p.hp / (p.maxHp * 0.3)); g.globalAlpha = b + 0.04; g.fillStyle = '#6a0a14'; g.fillRect(0, 0, W, 6); g.fillRect(0, H - 6, W, 6); g.fillRect(0, 0, 6, H); g.fillRect(W - 6, 0, 6, H); g.globalAlpha = 1; }
      if (G.slowmo > 0) { g.globalAlpha = 0.16 * Math.min(1, G.slowmo * 3); g.fillStyle = '#9ab8ff'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    }
  }
  AH.World = World; AH.Obj = Obj;
})();

/* Ashen Hollow - the world answers back.
   Lanterns shatter (the light dies, and so does the enemies' view of you inside the dark they leave behind),
   hanging bells can be cut so they crash down and toll - a lure for anything that can hear - and thorn
   thickets burn when a spark, star or lightning spell touches them. State persists per area in G.flags.living. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, S = AH.Sprites, ID = AH.Tiles.ID, P = AH.Particles, spr = AH.Props.spr;
  const L = (AH.Living = { shadowT: 0 });
  const rnd = (s) => U.mulberry32(s), fin = (c, ax, ay) => S.outline(S.fromCanvas(c.c, ax, ay), '#0a0806');
  const G_ = () => AH.G, W_ = () => AH.G && AH.G.world;
  const safe = (fn) => { try { return fn(); } catch (e) { if (AH.errors) AH.errors.push('living: ' + e); } };

  /* ------------------------------------------------------------------ sprites */
  function post(Pt, withArm) { Pt.rect(7, 8, 2, 22, '#3a2a1e'); Pt.rect(7, 8, 1, 22, '#5a4430'); Pt.rect(5, 28, 6, 2, '#2a2024'); if (withArm) { Pt.rect(7, 7, 7, 2, '#3a2a1e'); Pt.rect(7, 7, 7, 1, '#5a4430'); } }
  spr.lantern = S.frames(6, (i) => { const Pt = S.painter(16, 30), fl = 0.5 + 0.5 * Math.sin(i / 6 * 6.283), j = i % 2;
    post(Pt, true); Pt.line(13, 9, 13, 11, '#6a6874');
    Pt.rect(10, 11, 7 - 1, 1, '#4a4650'); Pt.rect(10, 17, 6, 1, '#3a3640'); Pt.rect(10, 12, 1, 5, '#4a4650'); Pt.rect(15, 12, 1, 5, '#2a2830');
    Pt.rect(11, 12, 4, 5, fl > 0.5 ? '#ffd57a' : '#f0b858'); Pt.rect(12, 13, 2, 3, '#fff2c0'); Pt.px(12 + j, 12, '#ffffff');
    return fin(Pt, 8, 29); });
  spr.lanternBroken = (function () { const Pt = S.painter(16, 30), r = rnd(5); post(Pt, true); Pt.line(13, 9, 12, 12, '#6a6874'); Pt.rect(10, 12, 1, 4, '#4a4650'); Pt.rect(10, 12, 3, 1, '#4a4650'); Pt.px(11, 15, '#2a2830');
    for (let i = 0; i < 9; i++) Pt.px(3 + r() * 11, 26 + r() * 3, r() < 0.5 ? '#9ab8c8' : '#d8e8f0'); return fin(Pt, 8, 29); })();
  spr.bellhang = (function () { const Pt = S.painter(18, 30); Pt.rect(2, 4, 14, 2, '#3a2a1e'); Pt.rect(2, 4, 14, 1, '#5a4430'); Pt.rect(2, 4, 2, 26, '#3a2a1e'); Pt.rect(2, 4, 1, 26, '#5a4430'); Pt.rect(1, 28, 5, 2, '#2a2024');
    Pt.line(11, 6, 11, 11, '#8a7a5a'); Pt.ell(11, 15, 4, 4, ['#d8a84a', '#a8782a', '#5a3a14'], 3, 0.1); Pt.rect(7, 17, 9, 2, '#a8782a'); Pt.rect(7, 18, 9, 1, '#5a3a14'); Pt.px(11, 20, '#2a2024'); Pt.px(9, 13, '#f8e0a0'); return fin(Pt, 9, 29); })();
  spr.bellFallen = (function () { const Pt = S.painter(18, 12); Pt.ell(9, 7, 6, 3, ['#d8a84a', '#a8782a', '#5a3a14'], 3, 0.1); Pt.rect(4, 8, 11, 2, '#5a3a14'); Pt.px(7, 6, '#f8e0a0'); Pt.line(14, 6, 17, 3, '#8a7a5a'); Pt.px(2, 9, '#2a2024'); return fin(Pt, 9, 11); })();
  spr.thorns = [1, 2, 3].map((s) => { const Pt = S.painter(26, 26), r = rnd(s * 41);
    for (let i = 0; i < 22; i++) { const x0 = 4 + r() * 18, a = -Math.PI / 2 + (r() - 0.5) * 2.6, l = 8 + r() * 12, x1 = x0 + Math.cos(a) * l, y1 = 24 + Math.sin(a) * l; Pt.line(x0, 24, x1, y1, i % 3 ? '#3a2630' : '#4e323c');
      if (r() < 0.8) { const bx = (x0 + x1) / 2, by = (24 + y1) / 2; Pt.px(bx - 1, by - 1, '#a8a0a8'); Pt.px(bx + 1, by + 1, '#a8a0a8'); } }
    for (let i = 0; i < 3; i++) Pt.px(6 + r() * 14, 9 + r() * 10, '#b83a4a'); return fin(Pt, 13, 25); });

  /* ------------------------------------------------------------------ helpers */
  const lv = () => { const G = G_(); if (!G) return null; return (G.flags.living = G.flags.living || {}); };
  const keyOf = (o) => (W_() ? W_().areaId : '?') + ':' + o.d.tx + ',' + o.d.ty;
  const once = (flag, msg, col) => { const G = G_(), f = lv(); if (!f || f['_t_' + flag]) return; f['_t_' + flag] = 1; G.toast(msg, col || '#e8c670'); };
  const fireSpell = (sp) => !!(sp && sp.tags && (sp.tags.indexOf('spark') >= 0 || sp.tags.indexOf('star') >= 0 || sp.tags.indexOf('lightning') >= 0 || sp.tags.indexOf('fire') >= 0));
  const unsolid = (o) => { const w = o.w, tiles = o.d.solidTiles || [[o.d.tx, o.d.ty]]; tiles.forEach((t) => { const i = t[1] * w.w + t[0]; if (i >= 0 && i < w.solid.length) w.solid[i] = 0; }); };

  /* ------------------------------------------------------------------ lanterns */
  function breakLantern(o, silent) {
    if (o.broken) return; o.broken = true; o.spr = spr.lanternBroken; o.savedLight = o.light; o.light = null; const w = o.w; w.lightCache = null;
    if (silent) return;
    const x = o.x + 5, y = o.y - 16;
    AH.Audio.sfx('chime', { x, y, pitch: 2, v: 0.7 }); AH.Audio.sfx('hit_stone', { x, y, v: 0.5 });
    P.burst(x, y, 16, { min: 30, max: 120, vz: [20, 100], g: 280, life: [0.4, 1], size: 1, c: ['#ffe9a0', '#bfe8ff', '#ffffff', '#ffd070'], add: true, streak: 0.03, drag: 1.3 });
    P.burst(x, y + 6, 8, { min: 8, max: 30, vz: [10, 40], g: 120, life: [0.8, 1.6], size: 1, c: ['#6a6a74', '#3a3a44'], drag: 3 });
    if (AH.VFX && AH.VFX.pop) AH.VFX.pop(x, y, '#ffcf70', 12, 0.3);
    w.noise(o.x, o.y, 60, 'glass'); const f = lv(); if (f) f[keyOf(o)] = 'b';
    once('lantern', 'The lantern bursts. Where its light fell, nothing sees you now.', '#c8b890');
  }

  /* darkness hides you: inside a shattered lantern's pool, with no live light near, enemies lose you beyond arm's reach */
  L.shadowed = function (w, p) {
    let near = null;
    for (const o of w.objs) { if (o.broken && o.d.living === 'lantern' && U.dist(p.x, p.y, o.x, o.y) < 64) { near = o; break; } }
    if (!near) return false;
    for (const o of w.objs) { if (o.hidden || !o.light || o.broken) continue; const rr = (o.light.r || 0) * 0.7; if (U.dist(p.x, p.y, o.x, o.y + (o.light.y || 0)) < rr) return false; if (o.d.k === 'light' && U.dist(p.x, p.y, (o.d.tx + 0.5) * 16, (o.d.ty + 0.5) * 16) < rr) return false; }
    return true;
  };
  if (AH.Enemy) { const cs = AH.Enemy.prototype.canSee; AH.Enemy.prototype.canSee = function (p) { const w = this.w; if (w && p && L.shadowed(w, p) && U.dist(this.x, this.y, p.x, p.y) > 34) return false; return cs.call(this, p); }; }

  /* ------------------------------------------------------------------ bells */
  function cutBell(o, silent) {
    if (o.cut) return; o.cut = true; o.spr = spr.bellFallen; o.tolls = silent ? 0 : 6; o.tollT = 0.5; if (silent) return;
    const w = o.w, x = o.x, y = o.y - 8;
    AH.Audio.sfx('bell', { x, y, pitch: 0.7, v: 1 }); AH.Audio.sfx('hit_wood', { x, y, v: 0.6 }); w.addShake && w.addShake(2.2); w.noise(o.x, o.y, 210, 'bell');
    if (AH.VFX) { AH.VFX.ring(x, y + 6, 64, '#e8c670', 0.7); AH.VFX.pop(x, y, '#ffe9a0', 9, 0.25); }
    P.burst(x, y, 10, { min: 20, max: 80, vz: [10, 60], g: 200, life: [0.4, 0.9], size: 1, c: ['#e8c670', '#ffe9a0', '#a8782a'], add: true, streak: 0.03 });
    const f = lv(); if (f) f[keyOf(o)] = 'c'; once('bell', 'The rope parts. The bell crashes down and tolls - anything with ears will come to see.', '#e8c670');
  }
  function tollBell(o, dt) {
    if (!o.cut || !(o.tolls > 0)) return; o.tollT -= dt; if (o.tollT > 0) return; o.tollT = 1.15; o.tolls--; const w = o.w, x = o.x, y = o.y - 8;
    AH.Audio.sfx('bell', { x, y, pitch: 0.6 + Math.random() * 0.1, v: 0.65 }); w.noise(o.x, o.y, 180, 'bell'); if (AH.VFX) AH.VFX.ring(x, y + 6, 44, '#c8a860', 0.55);
  }

  /* ------------------------------------------------------------------ thorns */
  function ignite(o, silent) {
    if (o.burn || o.burnt) return; o.burn = silent ? 0.01 : 3.2; o.light = { r: 84, color: '#ff7a30', flicker: 0.45, y: -10, seed: Math.random() * 100 }; o.w.lightCache = null;
    if (silent) return; AH.Audio.sfx('crackle', { x: o.x, y: o.y, v: 0.8 }); once('thorn', 'The briars catch. Fire eats them down to ash.', '#ff9a4a'); o.spread = true; o.dmgT = 0;
  }
  function tickThorns(o, dt) {
    if (o.burnt) return; if (!o.burn) return; const w = o.w, x = o.x, y = o.y;
    o.burn -= dt;
    if (Math.random() < dt * 40) P.burst(x + U.rr(-9, 9), y - U.rr(2, 18), 1, { min: 4, max: 18, vz: [30, 70], g: -20, life: [0.3, 0.8], size: 2, size2: 0, c: ['#ff9a3a', '#ffd070', '#ff5a20'], add: true, drag: 1.5 });
    if (Math.random() < dt * 10) P.burst(x + U.rr(-8, 8), y - 18, 1, { min: 2, max: 8, vz: [20, 40], g: -10, life: [0.8, 1.6], size: 2, size2: 4, c: ['#4a4650', '#2a2830'], drag: 2 });
    if (o.spread && o.burn < 2.6) { o.spread = false; w.objs.forEach((q) => { if (q !== o && q.d.living === 'thorns' && !q.burn && !q.burnt && U.dist(q.x, q.y, x, y) < 26) ignite(q); }); }
    o.dmgT -= dt; if (o.dmgT <= 0) { o.dmgT = 0.5; w.enemies.forEach((e) => { if (e.dead || e.ally || U.dist(e.x, e.y, x, y) > 20) return; AH.Combat.hit(e, 5, { src: G_().player, ang: 0, school: 'astral', tags: ['spark'] }); }); }
    if (o.burn <= 0) finishBurn(o);
  }
  function finishBurn(o, silent) {
    o.burnt = true; o.burn = 0; o.light = null; o.taken = true; o.hidden = true; const w = o.w; w.lightCache = null; unsolid(o);
    if (!silent) {
      w.objs.push(new AH.Obj(w, { k: 'prop', spr: 'ash', tx: o.d.tx, ty: o.d.ty, flat: true, variant: Math.floor(Math.random() * 3), ox: o.d.ox || 0 }));
      P.burst(o.x, o.y - 8, 14, { min: 10, max: 50, vz: [20, 70], g: -10, life: [0.6, 1.4], size: 1, c: ['#58504a', '#8a8278', '#ffb060'], add: false, drag: 2 });
      if (o.d.cache) { w.spawnPickup(o.x, o.y - 4, o.d.cache, o.d.cacheN || 1); once('cache', 'Something lay hidden in the briars.', '#e8c670'); }
      const f = lv(); if (f) f[keyOf(o)] = 'x';
    }
  }

  /* ------------------------------------------------------------------ hit routing */
  L.hit = function (o, how, sp) {
    const k = o.d.living; if (o.hidden || o.taken) return;
    if (k === 'lantern') breakLantern(o);
    else if (k === 'bellhang') cutBell(o);
    else if (k === 'thorns' && how === 'spell' && fireSpell(sp)) ignite(o);
    else if (k === 'thorns' && how === 'melee') { once('thornmelee', 'The briars are too thick to cut. Fire would take them.', '#8a8478'); AH.Audio.sfx('hit_wood', { x: o.x, y: o.y, v: 0.4 }); }
  };
  const iOnHit = AH.Interact.onHit; AH.Interact.onHit = function (o, p) { if (o.d.living) return safe(() => L.hit(o, 'melee')); return iOnHit.apply(this, arguments); };
  const iOnSpell = AH.Interact.onSpell; AH.Interact.onSpell = function (o, sp, g, extra) { if (o.d.living) return safe(() => L.hit(o, 'spell', sp)); return iOnSpell.apply(this, arguments); };

  /* per-frame work, and restoring saved state when an area loads */
  const ou = AH.Obj.prototype.update; AH.Obj.prototype.update = function (dt) { ou.call(this, dt); if (this.d.living) safe(() => { if (this.d.living === 'bellhang') tollBell(this, dt); else if (this.d.living === 'thorns') tickThorns(this, dt); }); };
  const rs = AH.World.prototype.refreshOpenState;
  AH.World.prototype.refreshOpenState = function () {
    rs.apply(this, arguments);
    const G = this.G, f = G && G.flags && G.flags.living; if (!f) return;
    this.objs.forEach((o) => { const d = o.d; if (!d.living) return; const st = f[this.areaId + ':' + d.tx + ',' + d.ty]; if (!st) return;
      safe(() => { if (st === 'b' && d.living === 'lantern') breakLantern(o, true); else if (st === 'c' && d.living === 'bellhang') cutBell(o, true); else if (st === 'x' && d.living === 'thorns') finishBurn(o, true); }); });
  };

  /* ------------------------------------------------------------------ placement */
  const PLAN = {
    hamlet: { lantern: 8, bellhang: 3, thorns: 0 },
    thornwood: { lantern: 5, bellhang: 4, thorns: 9 },
    catacombs: { lantern: 6, bellhang: 2, thorns: 0 }
  };
  function pointsOf(b) {
    const out = []; const add = (q) => { if (!q) return; if (Array.isArray(q) && typeof q[0] === 'number') out.push([q[0], q[1]]); else if (typeof q.tx === 'number') out.push([q.tx, q.ty]); else if (typeof q.x === 'number' && typeof q.y === 'number') out.push([q.x, q.y]); };
    (b.exits || []).forEach(add); (b.npcs || []).forEach(add); (b.enemies || []).forEach(add); Object.keys(b.spawns || {}).forEach((k) => add(b.spawns[k]));
    return out;
  }
  function place(b, id) {
    const plan = PLAN[id]; if (!plan) return; const pts = pointsOf(b), taken = [];
    const farFrom = (tx, ty, d, list) => list.every((p) => Math.hypot(p[0] - tx, p[1] - ty) >= d);
    const occupied = (tx, ty) => b.objs.some((q) => q.tx === tx && q.ty === ty && (q.solid || q.act || q.light || (!q.flat && q.k === 'prop' && q.spr !== 'tuft' && q.spr !== 'flower' && q.spr !== 'grassLong' && q.spr !== 'pebbles')));
    const natural = id === 'catacombs' ? [ID.CRYPT, ID.FLAG, ID.COBBLE] : [ID.DIRT, ID.COBBLE];
    const edge = (tx, ty) => { const t = b.get(tx, ty); return [[1, 0], [-1, 0], [0, 1], [0, -1]].some((d) => b.get(tx + d[0], ty + d[1]) !== t); };
    const tryPlace = (kind, n, sp, minD, pick) => {
      let done = 0;
      for (let i = 0; i < 700 && done < n; i++) {
        const tx = 3 + Math.floor(b.rng() * (b.w - 6)), ty = 3 + Math.floor(b.rng() * (b.h - 6));
        if (!pick(tx, ty) || !b.isFree(tx, ty, 0) || occupied(tx, ty) || !farFrom(tx, ty, 2.5, pts) || !farFrom(tx, ty, minD, taken)) continue;
        taken.push([tx, ty]); done++;
        if (kind === 'lantern') b.prop('lantern', tx, ty, { living: 'lantern', anim: 6, ox: 3, shadow: true, light: { r: 70, color: '#ffbe6a', flicker: 0.25, y: -16, shadow: 'static' }, ember: true });
        else if (kind === 'bellhang') b.prop('bellhang', tx, ty, { living: 'bellhang', ox: 3, shadow: true });
      }
    };
    tryPlace('lantern', plan.lantern, null, 7, (tx, ty) => natural.indexOf(b.get(tx, ty)) >= 0 && edge(tx, ty));
    tryPlace('bellhang', plan.bellhang, null, 9, (tx, ty) => (id === 'catacombs' ? natural : [ID.GRASS, ID.MOSS, ID.DIRT, ID.LEAVES]).indexOf(b.get(tx, ty)) >= 0 && edge(tx, ty));
    /* thorn thickets in 2-3 tile patches off the beaten path; some guard a cache */
    let patches = 0;
    for (let i = 0; i < 800 && patches < plan.thorns; i++) {
      const tx = 4 + Math.floor(b.rng() * (b.w - 8)), ty = 4 + Math.floor(b.rng() * (b.h - 8)), ok = (x, y) => [ID.GRASS, ID.MOSS].indexOf(b.get(x, y)) >= 0 && b.isFree(x, y, 0) && !occupied(x, y);
      if (!ok(tx, ty) || !farFrom(tx, ty, 3, pts) || !farFrom(tx, ty, 7, taken)) continue;
      let clear = true; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const t = b.get(tx + dx, ty + dy); if (t === ID.DIRT || t === ID.COBBLE || t === ID.WATER || t === ID.VOID || t === ID.WOOD) clear = false; }
      if (!clear) continue; taken.push([tx, ty]); patches++;
      const cells = [[0, 0]]; [[1, 0], [0, 1], [1, 1], [-1, 0]].forEach((d) => { if (cells.length < 2 + Math.floor(b.rng() * 2) && ok(tx + d[0], ty + d[1])) cells.push(d); });
      const cache = patches % 3 === 0 ? (b.rng() < 0.5 ? 'soul_ash' : 'bone_dust') : null;
      cells.forEach((d, j) => b.prop('thorns', tx + d[0], ty + d[1], { living: 'thorns', solid: true, shadow: true, variant: Math.floor(b.rng() * 3), ox: 0, cache: j === 0 ? cache : null, cacheN: 2 }));
    }
  }
  ['hamlet', 'thornwood', 'catacombs'].forEach((id) => {
    const orig = AH.Maps[id]; if (!orig) return;
    AH.Maps[id] = function () { const b = orig.apply(this, arguments); safe(() => place(b, id)); return b; };
  });
  AH.Living = Object.assign(L, { PLAN, breakLantern, cutBell, ignite });
})();

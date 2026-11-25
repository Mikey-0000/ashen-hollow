/* Ashen Hollow - the elements. Three live on top of the five schools:
     FROST  chills (slow, stacking); the third chill freezes a foe solid, and any other blow shatters it.
     FIRE   burns (damage over time); melts chill and frost, steams the wet, lights gas and thorns.
     STORM  shocks and leaps to nearby foes; conducts a third harder through the wet.
   An element comes from a spell's tags ('frost' | 'fire' | 'storm'/'lightning') or from an imbued weapon.
   Also here: the four extra spell carriers (cone, chain, barrage, aura), enemy-side visuals and gear drops. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, P = AH.Particles, Co = AH.Combat, M = AH.Magic;
  const safe = (fn, d) => { try { return fn(); } catch (e) { if (AH.errors) AH.errors.push('elements: ' + e); return d; } };
  const EC = { fire: ['#ff8a3a', '#ffd070', '#ff5a20'], frost: ['#9fe0ff', '#e8faff', '#5ab0e0'], storm: ['#c8d8ff', '#ffffff', '#8aa8ff'], poison: ['#8fd06a', '#d0ffa8', '#3a7a2a'], hexfire: ['#c27be0', '#ecc8ff', '#7a3aa8'] };
  /* how each material takes each element */
  const RES = { flesh: {}, bone: { fire: 1.15, frost: 0.6, storm: 0.9 }, spirit: { fire: 0.8, frost: 1.25, storm: 1.2 }, stone: { fire: 0.7, frost: 0.8, storm: 1.4 }, wood: { fire: 1.5, frost: 1.0, storm: 0.8 }, ward: { fire: 0.9, frost: 1, storm: 1.1 } };
  const has = (tags, t) => !!tags && tags.indexOf(t) >= 0;
  const elemOfTags = (tags) => (has(tags, 'frost') ? 'frost' : has(tags, 'fire') ? 'fire' : (has(tags, 'storm') || has(tags, 'lightning')) ? 'storm' : null);
  const P_ = () => AH.G.player, W_ = () => AH.G.world;
  const dmgMul = (p, sp) => (1 + p.mod('dmgSpell')) * (p.buff && p.buff.pact ? p.buff.pact.dmgMul : 1);
  AH.Elements = { EC, RES, elemOfTags };

  /* ---------------------------------------------------------------- arcs (storm visual) */
  function arc(w, x1, y1, x2, y2, col, life) {
    w.fx.push({ k: 'arc', x: x2, y: y2, t: 0, max: life || 0.26, light: 70, lcol: col || '#c8d8ff', seed: Math.random() * 99,
      draw(g, cam, f) {
        const k = 1 - f.t / f.max, n = Math.max(3, Math.floor(Math.hypot(x2 - x1, y2 - y1) / 7)), pts = []; const rr = U.mulberry32((f.seed * 100 + Math.floor(f.t * 40)) | 0);
        for (let i = 0; i <= n; i++) { const q = i / n, j = i === 0 || i === n ? 0 : (rr() - 0.5) * 9; pts.push([x1 + (x2 - x1) * q + (-(y2 - y1) / (Math.hypot(x2 - x1, y2 - y1) || 1)) * j, y1 + (y2 - y1) * q + ((x2 - x1) / (Math.hypot(x2 - x1, y2 - y1) || 1)) * j]); }
        g.save(); g.globalCompositeOperation = 'lighter';
        [[3, 0.25, col || '#8aa8ff'], [1.4, 1, '#ffffff']].forEach((s) => { g.globalAlpha = k * s[1]; g.strokeStyle = s[2]; g.lineWidth = s[0]; g.beginPath(); pts.forEach((p, i) => { const px = Math.round(p[0] - cam.x), py = Math.round(p[1] - cam.y); if (i) g.lineTo(px, py); else g.moveTo(px, py); }); g.stroke(); });
        g.restore();
      } });
  }
  AH.Elements.arc = arc;

  /* ---------------------------------------------------------------- hit wrapper: elements, imbues, reactions */
  const baseHit = Co.hit;
  Co.hit = function (t, dmg, o) {
    o = o || {}; if (!t || t.dead || t.invuln) return baseHit.call(this, t, dmg, o);
    return safe(() => {
      const G = AH.G, p = G.player, w = G.world, st = t.status || (t.status = {}); let el = o.elem || elemOfTags(o.tags), m = 1, imbue = null;
      /* imbued weapons: every melee blow carries the weapon's element */
      if (o.melee && o.src === p) { const wp = AH.Items[G.equip.weapon]; if (wp && wp.elem) { imbue = wp.elem; if (wp.elem !== 'poison') { el = el || wp.elem; o = Object.assign({}, o, { tags: (o.tags || []).concat(wp.elem) }); m *= 1 + (wp.elemDmg || 0); } } }
      /* a frozen foe shatters under anything that isn't more frost */
      let shatter = false; if (st.frozen && el !== 'frost') { m *= 1.5; delete st.frozen; shatter = true; }
      let notes = [];
      if (el) {
        m *= (RES[t.def.mat] || {})[el] || 1;
        if (o.src === p) m *= 1 + p.mod(el) + p.mod('elem');
        if (el === 'fire') { if (st.chill) { delete st.chill; delete st.slow; m *= 1.3; notes.push('MELT'); } if (st.wet) { delete st.wet; m *= 1.15; notes.push('STEAM'); } }
        else if (el === 'frost') { if (st.burn) { delete st.burn; m *= 1.1; notes.push('DOUSE'); } }
        else if (el === 'storm') { if (st.chill || st.frozen) m *= 1.1; }
      }
      const r = baseHit.call(this, t, dmg * m, o);
      if (shatter && r > 0) { const x = t.x, y = t.y - (t.def.h || 14) * 0.5; P.burst(x, y, 16, { min: 40, max: 130, vz: [10, 70], g: 220, life: [0.3, 0.8], size: 1, c: ['#e8faff', '#9fe0ff', '#ffffff'], add: true, streak: 0.03 }); AH.Audio.sfx('hit_ward', { x, y, pitch: 1.6, v: 0.7 }); w.spawnFx({ k: 'text', x: t.x + U.rr(-8, 8), y: t.y - (t.def.h || 14) - 10 - U.rr(0, 8), text: 'SHATTER', col: '#9fe0ff', t: 0, max: 0.8 }); }
      if (r > 0) { if (el) applyElement(t, el, o, r, p); if (imbue === 'poison') Co.applyFx(t, { poison: { t: 4, dps: 3 } }, o); if (notes.length && !o.silent) w.spawnFx({ k: 'text', x: t.x + 6, y: t.y - (t.def.h || 14) - 8, text: notes[0], col: el === 'fire' ? '#ffb060' : '#9fe0ff', t: 0, max: 0.7 }); }
      return r;
    }, 0) || baseHit.call(this, t, dmg, o);
  };
  function applyElement(t, el, o, dealt, p) {
    const st = t.status, w = AH.G.world, boss = !!t.def.boss, x = t.x, y = t.y - (t.def.h || 14) * 0.5;
    if (el === 'fire') {
      if (t.def.mat === 'stone') return; const dur = 3 + p.mod('burnDur'), dps = (3 + dealt * 0.08) * (1 + p.mod('fire'));
      if (!st.burn) { P.burst(x, y, 8, { min: 15, max: 55, vz: [20, 60], g: -30, life: [0.3, 0.7], size: 2, size2: 0, c: EC.fire, add: true }); AH.Audio.sfx('crackle', { x: t.x, y: t.y, v: 0.5 }); }
      st.burn = { t: dur, dps, acc: st.burn ? st.burn.acc : 0 };
      if ((t._igT || 0) < w.time) { t._igT = w.time + 0.6; Co.ignite(t.x, t.y, 16); w.spellHit(t.x, t.y, 10, { tags: ['fire', 'spark'], school: 'phys' }); }
    } else if (el === 'frost') {
      const need = Math.max(1, 3 - Math.round(p.mod('freezeAt'))), n = (st.chill ? st.chill.n : 0) + 1;
      P.burst(x, y, 6, { min: 10, max: 40, vz: [10, 40], g: 60, life: [0.3, 0.6], size: 1, c: EC.frost, add: true });
      if (n >= need && !boss && !st.frozen) { delete st.chill; delete st.slow; st.frozen = { t: 1.5 + p.mod('frost') * 1.2 }; AH.Audio.sfx('hit_ward', { x: t.x, y: t.y, pitch: 1.3, v: 0.8 }); P.ringBurst && P.ringBurst(t.x, t.y, 22, '#9fe0ff', 0.4); w.spawnFx({ k: 'text', x: t.x, y: t.y - (t.def.h || 14) - 10, text: 'FROZEN', col: '#9fe0ff', t: 0, max: 0.8 }); }
      else { st.chill = { n: Math.min(n, need), t: 4 }; st.slow = { t: 3, k: Math.max(0.35, 1 - (boss ? 0.1 : 0.2) * n) }; }
    } else if (el === 'storm') {
      st.shock = { t: 2.2 }; if (t.stagger && !boss) t.stagger(0.14);
      P.burst(x, y, 5, { min: 20, max: 80, vz: [0, 40], g: 100, life: [0.1, 0.25], size: 1, c: EC.storm, add: true, streak: 0.03 });
      if (!o.chained) chainFrom(t, dealt * 0.5, o, p, 2 + Math.round(p.mod('chainN')), 60);
    }
  }
  /* leap from `from` to the nearest other foes within `reach`, each hit weaker than the last */
  function chainFrom(from, dmg, o, p, jumps, reach) {
    const w = AH.G.world, hit = new Set([from]); let cur = from, d = dmg;
    for (let i = 0; i < jumps; i++) {
      let best = null, bd = reach; w.enemies.forEach((e) => { if (e.dead || e.dormant || e.ally || hit.has(e)) return; const dd = U.dist(cur.x, cur.y, e.x, e.y); if (dd < bd) { bd = dd; best = e; } });
      if (!best) break; hit.add(best); arc(w, cur.x, cur.y - (cur.def.h || 14) * 0.5, best.x, best.y - (best.def.h || 14) * 0.5);
      Co.hit(best, Math.max(1, d), { src: o.src || p, ang: Math.atan2(best.y - cur.y, best.x - cur.x), school: o.school || 'phys', tags: ['storm', 'lightning'], elem: 'storm', chained: true, silent: false, spell: o.spell });
      AH.Audio.sfx('zap', { x: best.x, y: best.y, v: 0.5 }); cur = best; d *= 0.8;
    }
  }

  /* poison strength scales with skills */
  const baseFx = Co.applyFx;
  Co.applyFx = function (t, fx, o) { baseFx.apply(this, arguments); safe(() => { const p = P_(); if (fx.poison && t.status.poison && p) t.status.poison.dps *= 1 + p.mod('poisonMul'); }); };

  /* status ticking for burn / chill / frozen / shock */
  const baseTick = Co.statusTick;
  Co.statusTick = function (e, dt) {
    baseTick.call(this, e, dt); const st = e.status; if (!st) return;
    safe(() => {
      if (st.burn) { st.burn.t -= dt; if (st.burn.t <= 0) delete st.burn; else { st.burn.acc = (st.burn.acc || 0) + st.burn.dps * dt; if (st.burn.acc >= 1) { const d = Math.floor(st.burn.acc); st.burn.acc -= d; e.dotDamage(d, 'burn'); } if (Math.random() < dt * 14) P.burst(e.x + U.rr(-4, 4), e.y - U.rr(2, (e.def.h || 14)), 1, { min: 3, max: 14, vz: [25, 60], g: -25, life: [0.3, 0.7], size: 2, size2: 0, c: EC.fire, add: true }); } }
      if (st.chill) { st.chill.t -= dt; if (st.chill.t <= 0) delete st.chill; else if (Math.random() < dt * 5) P.burst(e.x + U.rr(-4, 4), e.y - U.rr(2, (e.def.h || 14)), 1, { min: 2, max: 10, vz: [-5, 15], g: 25, life: [0.4, 0.8], size: 1, c: EC.frost, add: true }); }
      if (st.frozen) { st.frozen.t -= dt; e.stagT = Math.max(e.stagT || 0, 0.12); if (st.frozen.t <= 0) { delete st.frozen; P.burst(e.x, e.y - 8, 10, { min: 20, max: 70, vz: [10, 50], g: 160, life: [0.3, 0.7], size: 1, c: EC.frost, add: true }); } }
      if (st.shock) { st.shock.t -= dt; if (st.shock.t <= 0) delete st.shock; else if (Math.random() < dt * 6) P.burst(e.x + U.rr(-5, 5), e.y - U.rr(2, (e.def.h || 14)), 1, { min: 10, max: 40, life: [0.06, 0.14], size: 1, c: EC.storm, add: true, streak: 0.03 }); }
    });
  };

  /* a frozen foe is drawn in ice */
  if (AH.Enemy) {
    const ed = AH.Enemy.prototype.draw;
    AH.Enemy.prototype.draw = function (g, cam, time) {
      ed.apply(this, arguments);
      const st = this.status; if (!st || this.dead || !(st.frozen || st.chill || st.burn)) return;
      safe(() => {
        const h = this.def.h || 14, r = (this.r || 5) + 2, sx = Math.round(this.x - cam.x), sy = Math.round(this.y - cam.y);
        g.save();
        if (st.frozen) { g.globalAlpha = 0.5; g.fillStyle = '#9fe0ff'; g.fillRect(sx - r, sy - h, r * 2, h + 1); g.globalAlpha = 0.9; g.fillStyle = '#e8faff'; g.fillRect(sx - r, sy - h, r * 2, 1); g.fillRect(sx - r, sy - h, 1, h + 1); g.globalAlpha = 0.7; g.fillRect(sx - 2, sy - h + 2, 2, 4); g.fillStyle = '#5ab0e0'; g.fillRect(sx + r - 1, sy - h, 1, h + 1); g.fillRect(sx - r, sy, r * 2, 1); }
        else if (st.chill) { g.globalAlpha = 0.18 * st.chill.n; g.fillStyle = '#9fe0ff'; g.fillRect(sx - r + 1, sy - h + 1, r * 2 - 2, h - 1); }
        if (st.burn) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.16 + 0.08 * Math.sin(time * 18); g.fillStyle = '#ff7a30'; g.fillRect(sx - r + 1, sy - h + 1, r * 2 - 2, h - 1); }
        g.restore();
      });
    };
  }

  /* ---------------------------------------------------------------- carriers */
  /* cone: a short, fast breath (flame, frost, plague) that ticks three times */
  M.cone = function (p, sp, aim, ang, w) {
    const Q = sp.p, el = elemOfTags(sp.tags) || (has(sp.tags, 'poison') ? 'poison' : null), cols = (has(sp.tags, 'hex') && el === 'fire') ? EC.hexfire : EC[el] || EC.poison, N = Q.ticks || 3, dur = Q.dur || 0.45, dmg = Q.dmg * dmgMul(p, sp) / N; let fired = 0;
    AH.Audio.sfx(el === 'frost' ? 'hit_ward' : 'crackle', { x: p.x, y: p.y, v: 0.7 }); w.addShake && w.addShake(1.5);
    w.fx.push({ k: 'cone', x: p.x, y: p.y, t: 0, max: dur + 0.08, light: 60, lcol: cols[0], draw() {},
      upd(f, dt) {
        const ox = p.x + Math.cos(ang) * 8, oy = p.y - 10 + Math.sin(ang) * 4; f.x = ox; f.y = oy;
        if (f.t < dur) P.burst(ox, oy, 8, { dir: ang, spread: Q.arc, min: Q.range * 1.3, max: Q.range * 2.6, vz: [-5, 20], z: 8, life: [0.22, 0.45], size: 3, size2: 0, c: cols, add: true, drag: 2.6, wob: 6 });
        while (fired < N && f.t >= ((fired + 1) / N) * dur) {
          fired++; const last = fired === N;
          w.enemies.forEach((e) => { if (e.dead || e.dormant || e.ally) return; const d = U.dist(p.x, p.y, e.x, e.y); if (d > Q.range + e.r) return; const a = Math.atan2(e.y - p.y, e.x - p.x); if (Math.abs(U.angDiff(a, ang)) > Q.arc / 2 + 0.12) return; Co.hit(e, dmg, { src: p, ang: a, school: sp.school, tags: sp.tags, fx: sp.fx, spell: sp, silent: !last, kb: 20 }); e.shove(a, 26); });
          const cx = p.x + Math.cos(ang) * Q.range * 0.6, cy = p.y + Math.sin(ang) * Q.range * 0.6; w.spellHit(cx, cy, Q.range * 0.5, sp); if (el === 'fire') Co.ignite(cx, cy, Q.range * 0.5);
        }
      } });
  };

  /* chain: an arc that leaps between foes */
  M.chain = function (p, sp, aim, ang, w) {
    const Q = sp.p, jumps = Q.jumps + Math.round(p.mod('chainN')), dmg = Q.dmg * dmgMul(p, sp); const hit = new Set(); let cx = p.x, cy = p.y - 10, d = dmg, first = null, bd = 1e9;
    w.enemies.forEach((e) => { if (e.dead || e.dormant || e.ally) return; const dd = U.dist(p.x, p.y, e.x, e.y); if (dd > Q.range + e.r) return; const a = Math.atan2(e.y - p.y, e.x - p.x), off = Math.abs(U.angDiff(a, ang)); if (off > 0.9 && dd > 30) return; const sc = dd + off * 60; if (sc < bd) { bd = sc; first = e; } });
    AH.Audio.sfx('zap', { x: p.x, y: p.y, v: 0.7 });
    if (!first) { const q = { x: p.x + Math.cos(ang) * Math.min(Q.range * 0.6, U.dist(p.x, p.y, aim.x, aim.y)), y: p.y - 10 + Math.sin(ang) * Math.min(Q.range * 0.6, U.dist(p.x, p.y, aim.x, aim.y)) }; arc(w, cx, cy, q.x, q.y); w.spellHit(q.x, q.y, 14, sp); Co.ignite(q.x, q.y, 14); return; }
    let cur = first;
    for (let i = 0; i <= jumps && cur; i++) {
      hit.add(cur); const ty = cur.y - (cur.def.h || 14) * 0.5; arc(w, cx, cy, cur.x, ty);
      Co.hit(cur, d, { src: p, ang: Math.atan2(cur.y - cy, cur.x - cx), school: sp.school, tags: sp.tags, fx: sp.fx, spell: sp, chained: true, elem: 'storm', silent: false }); w.spellHit(cur.x, cur.y, 10, sp); Co.ignite(cur.x, cur.y, 12);
      cx = cur.x; cy = ty; d *= 0.85; let nx = null, nd = Q.jump; w.enemies.forEach((e) => { if (e.dead || e.dormant || e.ally || hit.has(e)) return; const dd = U.dist(cur.x, cur.y, e.x, e.y); if (dd < nd) { nd = dd; nx = e; } }); cur = nx;
    }
  };

  /* barrage: several bolts in a fan */
  M.barrage = function (p, sp, aim, ang, w) {
    const Q = sp.p, n = Q.n, d = Math.hypot(aim.x - p.x, aim.y - p.y), spread = Q.spread * (d < 60 ? 1 : 0.55);
    for (let i = 0; i < n; i++) { const off = n === 1 ? 0 : (i / (n - 1) - 0.5) * spread; w.fx.push({ k: 'later', x: p.x, y: p.y, t: 0, max: i * 0.035 + 0.04, upd(f) { if (!f.done && f.t >= i * 0.035) { f.done = true; M.bolt(p, sp, aim, ang + off, w); } } }); }
    AH.Audio.sfx('swing', { x: p.x, y: p.y, pitch: 1.5, v: 0.6 });
  };

  /* aura: a mantle that follows you and works on everything close */
  M.aura = function (p, sp, aim, ang, w) {
    const Q = sp.p, el = elemOfTags(sp.tags) || 'fire', cols = EC[el]; w.zones = w.zones.filter((z) => z.id !== sp.id);
    const dmg = Q.dmg * dmgMul(p, sp);
    const z = { id: sp.id, kind: 'aura', t: 0, dur: Q.dur + p.mod('auraDur'), dead: false, x: p.x, y: p.y, r: Q.r, light: Q.r * 1.3, color: cols[0], lightI: 0.5, tk: 0,
      update(dt) {
        this.t += dt; this.x = p.x; this.y = p.y; this.tk -= dt; if (this.t > this.dur || p.dead) { this.dead = true; return; }
        if (Q.drain) p.hp = Math.max(Math.min(p.hp, 6), p.hp - Q.drain * dt);
        if (Math.random() < dt * 30) { const a = Math.random() * 6.283, rr = this.r * (0.4 + Math.random() * 0.6); P.emit({ x: p.x + Math.cos(a) * rr, y: p.y + Math.sin(a) * rr * 0.6, z: 2, vx: 0, vy: -10, vz: 18, life: 0.6, col: cols[Math.floor(Math.random() * 3)], size: el === 'frost' ? 1 : 2, add: true }); }
        if (this.tk <= 0) { this.tk = Q.tick; w.enemies.forEach((e) => { if (e.dead || e.dormant || e.ally) return; if (U.dist(p.x, p.y, e.x, e.y) > this.r + e.r) return; Co.hit(e, dmg, { src: p, ang: Math.atan2(e.y - p.y, e.x - p.x), school: sp.school, tags: sp.tags, fx: sp.fx, spell: sp, silent: true, elem: el }); }); w.spellHit(p.x, p.y, this.r * 0.6, sp); }
      },
      drawGround(g, cam, time) { const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y), k = Math.min(1, this.t / 0.3) * Math.min(1, (this.dur - this.t) / 0.6 + 0.1); g.save(); g.translate(x, y); g.scale(1, 0.6); g.globalAlpha = 0.16 * k; g.fillStyle = cols[2]; g.beginPath(); g.arc(0, 0, this.r, 0, 6.3); g.fill(); g.globalAlpha = 0.7 * k; g.strokeStyle = cols[0]; g.lineWidth = 1.5; g.setLineDash([3, 3]); g.lineDashOffset = -time * 14; g.beginPath(); g.arc(0, 0, this.r, 0, 6.3); g.stroke(); g.restore(); g.globalAlpha = 1; },
      draw() {} };
    w.zones.push(z); AH.Audio.sfx(el === 'frost' ? 'hit_ward' : 'crackle', { x: p.x, y: p.y, v: 0.8 }); P.ringBurst(p.x, p.y, Q.r, cols[0], 0.5);
  };

  /* ---------------------------------------------------------------- drops and starter gear */
  safe(() => {
    const die = AH.Enemy.prototype.die;
    AH.Enemy.prototype.die = function (o) {
      const wasDead = this.dead; die.apply(this, arguments);
      if (wasDead || this.ally) return;
      safe(() => {
        const G = AH.G, w = this.w, D = AH.GearDrops, id = this.def.id, pick = (a) => a[Math.floor(Math.random() * a.length)];
        let item = null; if (D[id]) item = D[id][0]; else if (this.def.boss) item = null; else if ((id === 'sentinel' || id === 'hexcaller') && Math.random() < 0.18) item = pick(D.elite); else if (Math.random() < 0.025) item = pick(D.elite);
        if (item && !G.inv[item] && !(G.flags['geardrop_' + item])) { G.flags['geardrop_' + item] = 1; w.spawnPickup(this.x, this.y - 4, item, 1); }
      });
    };
  });
  safe(() => {
    const ng = AH.G.newGame;
    AH.G.newGame = function (id) {
      ng.apply(this, arguments);
      safe(() => { const G = AH.G, st = AH.Starts[id], rel = st && AH.StarterRelic[st.school]; if (rel) { G.inv[rel] = 1; G.equip.relic1 = rel; G.player.recalc(); } });
    };
  });
})();

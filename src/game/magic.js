/* Ashen Hollow - spell carriers: bolts, zones, novas, lashes, strikes, wells, wards, thralls, familiars, blinks.
   Every spell is data (see data/spells.js); this file gives each carrier its behaviour, reactions and visuals. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, S = AH.Sprites, Co = AH.Combat;
  const M = (AH.Magic = {});
  const col = (sp) => AH.Schools[sp.school].col;
  const dmgMul = (p, sp) => (1 + p.mod('dmgSpell')) * (p.buff.pact ? p.buff.pact.dmgMul : 1);
  const hasTag = (sp, t) => sp.tags.indexOf(t) >= 0;

  /* cast start: silence zones stop magic cold */
  M.begin = function (p, sp) {
    const w = p.world; if (w.zones.some((z) => z.silence && U.dist(z.x, z.y, p.x, p.y) < z.r)) { p.state = 'move'; AH.G.toast('Your magic is smothered by the silence.', '#a090d8'); AH.Audio.sfx('ui_deny'); }
  };
  M.channel = function (p, sp, k, dt) { if (Math.random() < 0.5) AH.Particles.emit({ x: p.x + U.rr(-8, 8), y: p.y - U.rr(4, 18), vx: 0, vy: -14, life: 0.4, col: col(sp), size: 1, add: true }); };
  M.corruptEcho = function (p) { const w = p.world, e = w.addEnemy('wraith', 0, 0, { fadeIn: true }); e.x = p.x + U.rr(-40, 40); e.y = p.y + U.rr(-30, 30); e.alert(p); AH.G.toast('Something answers your casting.', '#d0407a'); AH.Audio.sfx('whisper', { v: 1 }); };
  function clampRange(p, aim, range) { const dx = aim.x - p.x, dy = aim.y - p.y, d = Math.hypot(dx, dy) || 1, k = Math.min(1, range / d); return { x: p.x + dx * k, y: p.y + dy * k }; }

  M.fire = function (p, sp, aim) {
    const w = p.world, f = M[sp.carrier]; if (!f) return; const ang = Math.atan2(aim.y - (p.y - 10), aim.x - p.x);
    if (hasTag(sp, 'spark') && sp.carrier !== 'strike') { /* sparks ignite nearby gas */ }
    f(p, sp, aim, ang, w); AH.Audio.sfx('cast_' + sp.school, { x: p.x, y: p.y }); p.recoilCast && p.recoilCast();
    if (sp.school === 'astral' && sp.carrier !== 'blink') M.veilCheck(w, aim.x, aim.y, 40);
  };
  M.veilCheck = function (w, x, y, r) { const s = w.def.secrets.find((q) => q.veil); if (s && !w.secretOpen('veil')) { const t = s.tiles[1]; if (U.dist(x, y, (t[0] + 0.5) * AH.T, (t[1] + 0.5) * AH.T) < r + 40) { w.openSecret('veil'); AH.G.setFlag('secret_veil'); AH.G.toast('The veil parts. A bridge of old stars appears.', '#7fa6ff'); } } };

  /* ---------- bolt ---------- */
  class Bolt {
    constructor(w, p, sp, ang) {
      this.w = w; this.sp = sp; this.p = sp.p; this.x = p.x + Math.cos(ang) * 10; this.y = p.y - 10 + Math.sin(ang) * 6; this.ang = ang; this.vx = Math.cos(ang) * this.p.speed; this.vy = Math.sin(ang) * this.p.speed; this.life = this.p.life; this.pierce = this.p.pierce + (sp.id === 'soul_lance' ? p.mod('lancePierce') : 0); this.hit = new Set(); this.color = this.p.color; this.light = 46; this.dead = false; this.z = 10;
      this.dmg = this.p.dmg * dmgMul(p, sp) * (sp.id === 'soul_lance' ? 1 + p.mod('lanceDmg') : 1); this.trail = []; this.seed = Math.random() * 10; this.src = p; this.fx = sp.fx;
    }
    update(dt) {
      this.life -= dt; const step = Math.hypot(this.vx, this.vy) * dt, n = Math.ceil(step / 5);
      for (let i = 0; i < n; i++) {
        this.x += this.vx * dt / n; this.y += this.vy * dt / n;
        if (this.w.solidAt(this.x, this.y + 4) && !this.w.solidAt(this.x, this.y - 8)) { /* skims over low obstacles */ } else if (this.w.opaqueAt(this.x, this.y)) { this.dead = true; this.burst(); return; }
        for (const e of this.w.enemies) {
          if (e.dead || e.dormant || e.ally || this.hit.has(e)) continue; if (U.dist(this.x, this.y, e.x, e.y - e.def.h * 0.4) > this.p.r + e.r) continue;
          this.hit.add(e); const r = Co.hit(e, this.dmg, { src: this.src, ang: this.ang, school: this.sp.school, tags: this.sp.tags, fx: this.fx, spell: this.sp, guard: this.p.guard, big: false }); if (r > 0) { e.shove(this.ang, 40); e.stagger(0.12); }
          if (hasTag(this.sp, 'spark')) Co.ignite(e.x, e.y, 20); if (r !== -1 && --this.pierce < 0) { this.dead = true; this.burst(); return; } if (r === -1) { this.dead = true; this.burst(); return; }
        }
        if (this.sp.id === 'soul_lance' || hasTag(this.sp, 'spark')) this.w.spellHit(this.x, this.y, 8, this.sp);
      }
      if (this.life <= 0) { this.dead = true; this.burst(); }
      this.trail.push([this.x, this.y]); if (this.trail.length > 9) this.trail.shift();
    }
    burst() { AH.Particles.magic(this.x, this.y - this.z, 6, this.color); }
    draw(g, cam, time) {
      g.globalCompositeOperation = 'lighter'; this.trail.forEach((t, i) => { const k = i / this.trail.length; g.globalAlpha = k * 0.7; g.fillStyle = this.p.trail || this.color; const s = Math.max(1, Math.round(k * 3)); g.fillRect(Math.round(t[0] - cam.x) - (s >> 1), Math.round(t[1] - cam.y - this.z) - (s >> 1), s, s); });
      const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y - this.z); g.globalAlpha = 1; g.fillStyle = this.color; g.fillRect(x - 2, y - 2, 5, 5); g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 1, 3, 3); g.globalAlpha = 0.4; g.fillStyle = this.color; g.fillRect(x - 4, y - 1, 9, 3); g.fillRect(x - 1, y - 4, 3, 9); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
  }
  M.bolt = function (p, sp, aim, ang, w) { w.projectiles.push(new Bolt(w, p, sp, ang)); };

  /* ---------- zones: thorns, spores, salt wards, wells ---------- */
  class Zone {
    constructor(w, sp, x, y, o) {
      this.w = w; this.sp = sp; this.x = x; this.y = y; const P = sp.p, pl = w.G.player; this.kind = P.kind || sp.carrier; this.r = P.r + (this.kind === 'salt' ? pl.mod('wardR') : 0); this.dur = P.dur + (this.kind === 'thorns' ? pl.mod('thornDur') : 0) + (this.kind === 'salt' ? pl.mod('wardDur') : 0); this.t = 0; this.tickT = 0; this.dead = false; this.gas = !!P.gas; this.light = this.kind === 'well' ? 60 : this.kind === 'salt' ? 40 : 0; this.color = col(sp); this.seed = Math.random() * 100; this.dmgK = dmgMul(pl, sp) * (this.kind === 'thorns' ? 1 + pl.mod('thornDmg') : 1); this.spores = !!P.spores; this.lightI = 0.5; Object.assign(this, o || {});
      this.motes = []; for (let i = 0; i < 14; i++) this.motes.push({ a: Math.random() * 6.28, d: Math.random(), s: U.rr(0.3, 1) });
    }
    update(dt) {
      this.t += dt; this.tickT -= dt; const w = this.w, P = this.sp.p, p = w.G.player;
      if (this.gas && w.fireNear(this.x, this.y, this.r + 10)) { this.dead = true; Co.explosion(this.x, this.y, this.r * 1.3, 32); return; }
      if (this.kind === 'well') { w.enemies.forEach((e) => { if (e.dead || e.dormant || e.ally) return; const d = U.dist(e.x, e.y, this.x, this.y); if (d < this.r + 20 && !e.def.boss) { const a = Math.atan2(this.y - e.y, this.x - e.x), k = P.pull * (1 - d / (this.r + 20)); w.moveEnt(e, Math.cos(a) * k * dt, Math.sin(a) * k * dt); } }); w.projectiles.forEach((q) => { if (q instanceof AH.EProj && U.dist(q.x, q.y, this.x, this.y) < this.r) { const a = Math.atan2(this.y - q.y, this.x - q.x); q.vx += Math.cos(a) * 120 * dt; q.vy += Math.sin(a) * 120 * dt; q.life -= dt * 2; } }); }
      if (this.kind === 'salt') { w.enemies.forEach((e) => { if (e.dead || e.ally) return; const d = U.dist(e.x, e.y, this.x, this.y); if (e.def.undead && d < this.r && d > this.r - 14 && !e.def.boss) { const a = Math.atan2(e.y - this.y, e.x - this.x); e.x += Math.cos(a) * 60 * dt; e.y += Math.sin(a) * 60 * dt; } }); if (U.dist(p.x, p.y, this.x, this.y) < this.r && this.tickT <= 0) { p.heal(P.heal, true); } }
      if (this.tickT <= 0) {
        this.tickT = P.tick || 0.5; let any = false;
        w.enemies.forEach((e) => {
          if (e.dead || e.dormant || e.ally) return; const d = U.dist(e.x, e.y, this.x, this.y); if (d > this.r + e.r) return; any = true;
          const fx = this.kind === 'well' ? (this.spores ? { poison: { t: 3, dps: 3 } } : null) : this.sp.fx;
          if (P.dmg > 0) Co.hit(e, P.dmg * this.dmgK * (e.status.root && this.kind === 'thorns' ? 1.5 : 1), { src: p, ang: Math.atan2(e.y - this.y, e.x - this.x), school: this.sp.school, tags: this.sp.tags, fx, spell: this.sp, silent: true });
          else if (fx) Co.applyFx(e, fx, {});
        });
        if (this.kind === 'thorns' && any) AH.Audio.sfx('hit_wood', { x: this.x, y: this.y, v: 0.4 }); if (this.kind === 'thorns') w.spellHit(this.x, this.y, this.r, this.sp);
      }
      if (this.t >= this.dur) { this.dead = true; if (this.kind === 'well') { Co.blast(this.x, this.y, this.r * 0.9, this.spores ? 40 : 28, { src: p, school: 'astral', tags: ['astral'], kb: -160, big: true, spell: this.sp }); AH.Particles.ringBurst(this.x, this.y, this.r, '#9ab0ff', 0.5); AH.Audio.sfx('explode', { x: this.x, y: this.y, v: 0.8 }); w.addShake(3); } }
    }
    drawGround(g, cam, time) {
      const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y), k = Math.min(1, this.t / 0.3) * Math.min(1, (this.dur - this.t) / 0.5 + 0.2);
      g.save(); g.translate(x, y); g.scale(1, 0.62);
      if (this.kind === 'thorns') { g.globalAlpha = 0.25 * k; g.fillStyle = '#2a4a20'; g.beginPath(); g.arc(0, 0, this.r, 0, 6.3); g.fill(); g.globalAlpha = 1; }
      else if (this.kind === 'salt') { g.globalAlpha = 0.9 * k; g.strokeStyle = '#e8e4d8'; g.lineWidth = 1.5; g.setLineDash([2, 2]); g.beginPath(); g.arc(0, 0, this.r, 0, 6.3); g.stroke(); g.beginPath(); g.arc(0, 0, this.r * 0.62, 0, 6.3); g.stroke(); g.setLineDash([]); g.globalAlpha = 0.1 * k; g.fillStyle = '#e8e4d8'; g.beginPath(); g.arc(0, 0, this.r, 0, 6.3); g.fill(); g.globalAlpha = 1; for (let i = 0; i < 6; i++) { const a = i * 1.047 + 0.3; g.fillStyle = '#e8e4d8'; g.fillRect(Math.round(Math.cos(a) * this.r * 0.8) - 1, Math.round(Math.sin(a) * this.r * 0.8) - 1, 2, 2); } }
      g.restore(); g.globalAlpha = 1;
    }
    draw(g, cam, time) {
      const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y), k = Math.min(1, this.t / 0.3) * Math.min(1, (this.dur - this.t) / 0.5 + 0.2);
      if (this.kind === 'thorns') { g.strokeStyle = '#3d6a2a'; for (let i = 0; i < 16; i++) { const a = i * 0.39 + this.seed, d = this.r * (0.3 + (i % 5) * 0.14), bx = Math.round(x + Math.cos(a) * d), by = Math.round(y + Math.sin(a) * d * 0.62), h = Math.round((7 + (i % 4) * 3) * k * (1 + Math.sin(time * 6 + i) * 0.1)); g.fillStyle = '#2e5020'; g.fillRect(bx, by - h, 1, h); g.fillStyle = '#6a9a3a'; g.fillRect(bx, by - h, 1, 2); if (i % 3 === 0) { g.fillStyle = '#8a1f30'; g.fillRect(bx - 1, by - h + 2, 1, 1); } } }
      else if (this.kind === 'spores') { g.globalAlpha = 0.28 * k; g.fillStyle = '#7ab050'; this.motes.forEach((m, i) => { const a = m.a + time * 0.4 * m.s, d = m.d * this.r; const sx = x + Math.cos(a) * d, sy = y + Math.sin(a) * d * 0.62 - 8 - Math.sin(time * m.s * 2 + i) * 3; g.fillRect(Math.round(sx) - 3, Math.round(sy) - 2, 7, 5); g.fillRect(Math.round(sx) - 2, Math.round(sy) - 3, 5, 7); }); g.globalAlpha = 0.8 * k; g.fillStyle = '#b8e070'; this.motes.forEach((m, i) => { if (i % 2) return; const a = m.a - time * 0.7 * m.s, d = m.d * this.r; g.fillRect(Math.round(x + Math.cos(a) * d), Math.round(y + Math.sin(a) * d * 0.62 - 8), 1, 1); }); g.globalAlpha = 1; }
      else if (this.kind === 'well') { g.globalCompositeOperation = 'lighter'; g.save(); g.translate(x, y - 6); g.scale(1, 0.7); for (let i = 0; i < 4; i++) { const rr = this.r * (1 - ((time * 0.8 + i * 0.25) % 1)); g.globalAlpha = 0.6 * (1 - rr / this.r) * k; g.strokeStyle = '#8fa8ff'; g.beginPath(); g.arc(0, 0, rr, 0, 6.3); g.stroke(); } g.restore(); g.globalAlpha = 1; g.fillStyle = '#0a0612'; g.fillRect(x - 4, y - 9, 9, 7); g.fillRect(x - 3, y - 10, 7, 9); g.fillStyle = '#c8d4ff'; g.fillRect(x, y - 7, 1, 2); g.globalCompositeOperation = 'source-over'; }
    }
  }
  M.zone = function (p, sp, aim, ang, w) {
    const pt = clampRange(p, aim, sp.p.range); const q = w.nearestFree(pt.x, pt.y, 3);
    /* hag ward is a circle around the caster; others fall where you point */
    const z = new Zone(w, sp, sp.id === 'hag_ward' ? p.x : q[0], sp.id === 'hag_ward' ? p.y : q[1]); w.zones.push(z); AH.Particles.magic(z.x, z.y - 4, 10, z.color);
    if (hasTag(sp, 'gas')) AH.Audio.sfx('whisper', { x: z.x, y: z.y, v: 0.5 }); if (sp.id === 'thorn_snare') AH.Audio.sfx('rustle', { x: z.x, y: z.y }); if (hasTag(sp, 'spark')) Co.ignite(z.x, z.y, z.r);
    w.spellHit(z.x, z.y, z.r, sp); return z;
  };
  M.well = function (p, sp, aim, ang, w) { const pt = clampRange(p, aim, sp.p.range); const z = new Zone(w, sp, pt.x, pt.y); w.zones.push(z); AH.Audio.sfx('whisper', { x: z.x, y: z.y }); AH.Particles.ringBurst(z.x, z.y, 40, '#9ab0ff', 0.4); if (sp.p.spores) z.gas = false; };

  /* ---------- nova (Sanguine Burst, Crimson Eclipse) ---------- */
  M.nova = function (p, sp, aim, ang, w) {
    const P = sp.p; let d = P.dmg * dmgMul(p, sp); const missing = 1 - p.hp / p.maxHp; d *= 1 + missing * (P.scaleMissing || 0);
    AH.Particles.ringBurst(p.x, p.y, P.r, col(sp), 0.5); AH.Particles.blood(p.x, p.y - 10, 20, 0); w.addShake(sp.forbidden ? 7 : 4); AH.Audio.sfx('explode', { x: p.x, y: p.y, v: 0.8 }); if (sp.forbidden) { w.fx.push({ k: 'glow', x: p.x, y: p.y, t: 0, max: 0.8, light: 200, lcol: '#d02030', col: '#d02030', draw() {} }); AH.G.slowmo = 0.6; }
    Co.blast(p.x, p.y, P.r, d, { src: p, school: sp.school, tags: sp.tags, fx: sp.fx, spell: sp, kb: P.kb, big: true }); if (hasTag(sp, 'spark')) Co.ignite(p.x, p.y, P.r);
    if (sp.id === 'crimson_eclipse') { p.hp = 1; }
  };
  /* ---------- lash ---------- */
  M.lash = function (p, sp, aim, ang, w) {
    const P = sp.p, d = P.dmg * dmgMul(p, sp) * (1 + (1 - p.hp / p.maxHp) * 0.6); let n = 0;
    w.fx.push({ k: 'lash', x: p.x, y: p.y - 8, ang, reach: P.range, t: 0, max: 0.22, draw(g, cam, f) { const k = f.t / f.max, steps = 16, a0 = f.ang - 0.6 + k * 1.2; g.globalCompositeOperation = 'lighter'; for (let i = 0; i < steps; i++) { const kk = i / steps, r = f.reach * kk, a = a0 + Math.sin(kk * 3 + f.t * 30) * 0.25 * (1 - kk); g.globalAlpha = (1 - k) * (0.4 + kk * 0.6); g.fillStyle = kk > 0.85 ? '#ffffff' : '#e03848'; g.fillRect(Math.round(f.x - cam.x + Math.cos(a) * r), Math.round(f.y - cam.y + Math.sin(a) * r * 0.8), 2, 2); } g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; } });
    w.enemies.forEach((e) => { if (e.dead || e.dormant || e.ally) return; const dd = U.dist(p.x, p.y, e.x, e.y); if (dd > P.range + e.r) return; if (Math.abs(U.angDiff(Math.atan2(e.y - p.y, e.x - p.x), ang)) > P.arc / 2 + 0.1) return; const r = Co.hit(e, d, { src: p, ang, school: 'blood', tags: ['blood'], fx: sp.fx, spell: sp, melee: true, leech: P.leech + p.mod('leash') }); if (r > 0) { e.shove(ang, 90); n++; } });
    w.spellHit(p.x + Math.cos(ang) * 30, p.y + Math.sin(ang) * 30, 24, sp); AH.Audio.sfx('swing', { x: p.x, y: p.y, pitch: 0.8 });
  };
  /* ---------- buff: Crimson Pact ---------- */
  M.buff = function (p, sp) { const P = sp.p; p.buff.pact = { t: P.dur, dmgMul: P.dmgMul + p.mod('pactDmg'), lifesteal: P.lifesteal, takenMul: P.takenMul + p.mod('pactTaken') }; AH.Particles.blood(p.x, p.y - 10, 14, -Math.PI / 2); AH.Particles.ringBurst(p.x, p.y, 36, '#d04050', 0.5); AH.G.toast('The pact is sealed.', '#d04050'); };
  /* ---------- dash: Stag Rush ---------- */
  M.dash = function (p, sp, aim, ang, w) { const P = sp.p, dur = 0.22; p.state = 'dash'; p.dash = { t: dur, vx: Math.cos(ang) * P.dist / dur, vy: Math.sin(ang) * P.dist / dur * 0.85, dmg: P.dmg * dmgMul(p, sp), kb: P.kb, hit: new Set() }; p.iframes = P.iframes; AH.Audio.sfx('growl', { x: p.x, y: p.y, pitch: 0.7 }); AH.Particles.dust(p.x, p.y, 8); };
  /* ---------- blink: Astral Step ---------- */
  M.blink = function (p, sp, aim, ang, w) {
    const P = sp.p; const ox = p.x, oy = p.y; let best = null; for (let d = P.dist; d >= 8; d -= 6) { const x = p.x + Math.cos(ang) * d, y = p.y + Math.sin(ang) * d; if (w.freePoint(x, y, 4) && w.los(p.x, p.y - 6, x, y - 6)) { best = [x, y]; break; } }
    if (!best) { AH.G.toast('Nowhere to step.', '#8a8478'); p.cd[sp.id] = 0; p.aether += p.costOf(sp).aether; return; }
    if (p.flag('blinkDmg')) { Co.blast((ox + best[0]) / 2, (oy + best[1]) / 2, U.dist(ox, oy, best[0], best[1]) / 2 + 8, 12, { src: p, school: 'astral', tags: ['astral', 'spark'], big: false }); }
    AH.Particles.magic(ox, oy - 10, 14, '#9ab8ff'); p.x = best[0]; p.y = best[1]; p.iframes = 0.2; p.afterimages.push({ x: ox, y: oy, face: p.face, f: 0, t: 0.35 }); AH.Particles.magic(p.x, p.y - 10, 14, '#9ab8ff'); AH.Particles.ringBurst(p.x, p.y, 24, '#9ab8ff', 0.35);
    /* reveal hidden things nearby */
    w.objs.forEach((o) => { if (!o.hidden && o.d.act && U.dist(o.x, o.y, p.x, p.y) < P.reveal) o.pulse = 0.8; }); M.veilCheck(w, p.x, p.y, 20);
  };
  /* ---------- strike: Starfall ---------- */
  M.strike = function (p, sp, aim, ang, w) {
    const P = sp.p, pt = clampRange(p, aim, P.range); const night = AH.G.isNight() && !w.def.indoor; const dmg = P.dmg * dmgMul(p, sp) * (night ? 1.3 : 1);
    const tele = new AH.Tele({ shape: 'circle', x: pt.x, y: pt.y, range: P.r, dur: P.delay, col: '#7fa6ff' }); w.tele.push(tele);
    w.fx.push({ k: 'star', x: pt.x, y: pt.y, t: 0, max: P.delay + 0.05, light: 40, lcol: '#9ab8ff', col: '#9ab8ff', draw(g, cam, f) { const k = Math.min(1, f.t / P.delay), x = Math.round(f.x - cam.x), y = Math.round(f.y - cam.y - 150 * (1 - k * k)); g.globalCompositeOperation = 'lighter'; g.fillStyle = '#9ab8ff'; g.fillRect(x - 2, y - 2, 5, 5); g.fillStyle = '#fff'; g.fillRect(x - 1, y - 1, 3, 3); for (let i = 1; i < 10; i++) { g.globalAlpha = 0.4 * (1 - i / 10); g.fillStyle = '#9ab8ff'; g.fillRect(x - 1 + (i >> 2), y - i * 4, 2, 4); } g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; } });
    AH.Audio.sfx('whisper', { x: pt.x, y: pt.y, v: 0.5 });
    w.fx.push({ k: 'later', x: pt.x, y: pt.y, t: 0, max: P.delay + 0.02, upd(f) { if (!f.done && f.t >= P.delay) { f.done = true; AH.Audio.sfx('explode', { x: pt.x, y: pt.y, v: 0.9 }); w.addShake(4); AH.Particles.sparks(pt.x, pt.y - 6, 18, '#bcd0ff'); AH.Particles.ringBurst(pt.x, pt.y, P.r, '#9ab8ff', 0.5); Co.blast(pt.x, pt.y, P.r, dmg, { src: p, school: 'astral', tags: sp.tags, fx: sp.fx, spell: sp, kb: 140, big: true }); Co.ignite(pt.x, pt.y, P.r); M.veilCheck(w, pt.x, pt.y, P.r); if (P.bloom) { const bz = new Zone(w, AH.Spells.spore_cloud, pt.x, pt.y); w.zones.push(bz); bz.dead = false; bz.gas = false; setTimeout(() => (bz.gas = true), 50); Co.explosion(pt.x, pt.y, 40, 30); } } }, draw() {} });
  };
  /* ---------- storm: Call the Storm ---------- */
  M.storm = function (p, sp, aim, ang, w) {
    const P = sp.p; if (w.def.indoor) { AH.G.toast('There is no sky here to call upon.', '#8a8478'); p.verd += p.costOf(sp).verd; return; }
    const pt = clampRange(p, aim, P.range); const wet = AH.Weather.isWet(); AH.Audio.sfx('thunder', { v: 0.7 });
    for (let i = 0; i < P.n; i++) {
      const delay = 0.25 + i * 0.28, tx = pt.x + U.rr(-22, 22), ty = pt.y + U.rr(-14, 14); w.tele.push(new AH.Tele({ shape: 'circle', x: tx, y: ty, range: P.r, dur: delay, col: '#c8d8ff' }));
      w.fx.push({ k: 'later', x: tx, y: ty, t: 0, max: delay + 0.1, upd(f) { if (!f.done && f.t >= delay) { f.done = true; w.fx.push({ k: 'bolt', x: tx, y: ty, t: 0, max: 0.25, seed: (Math.random() * 1000) | 0, col: '#d8e4ff', light: 160, lcol: '#c8d8ff' }); AH.Audio.sfx('zap', { x: tx, y: ty }); w.addShake(3); AH.Particles.sparks(tx, ty - 4, 12, '#d8e4ff'); const hit = Co.blast(tx, ty, P.r, P.dmg * dmgMul(p, sp), { src: p, school: 'druid', tags: ['lightning', 'spark', 'druid'], spell: sp, kb: 90, big: true }); Co.ignite(tx, ty, P.r); if (wet) w.enemies.forEach((e) => { if (!e.dead && U.dist(e.x, e.y, tx, ty) < 70 && U.dist(e.x, e.y, tx, ty) > P.r) { Co.hit(e, P.dmg * 0.5, { src: p, school: 'druid', tags: ['lightning'], spell: sp, ang: 0 }); AH.Particles.sparks(e.x, e.y - 8, 6, '#d8e4ff'); } }); } }, draw() {} });
    }
  };
  /* ---------- raise: Raise Thrall ---------- */
  M.raise = function (p, sp, aim, ang, w) {
    const P = sp.p, max = P.max + p.mod('thrallMax'); let n = w.allies.filter((a) => a.type === 'thrall' && !a.dead).length; const near = w.corpses.filter((c) => !c.used && U.dist(c.x, c.y, p.x, p.y) < P.range).sort((a, b) => U.dist(a.x, a.y, p.x, p.y) - U.dist(b.x, b.y, p.x, p.y));
    for (const c of near) { if (n >= max) break; c.used = true; n++; const t = AH.makeThrall(w, c.x, c.y, P.dur + p.mod('thrallDur'), 9 * dmgMul(p, sp)); w.allies.push(t); AH.Particles.magic(c.x, c.y - 8, 16, '#7fe0c0'); AH.Particles.ringBurst(c.x, c.y, 20, '#7fe0c0', 0.4); AH.Audio.sfx('wail', { x: c.x, y: c.y, v: 0.5, pitch: 1.4 }); t.lightR = 36; t.lightCol = '#7fe0c0'; t.fade = 0.4; }
  };
  /* ---------- orbit: Bone Ward ---------- */
  M.orbit = function (p, sp, aim, ang, w) {
    const P = sp.p; w.zones = w.zones.filter((z) => z.kind !== 'ward');
    const z = { kind: 'ward', t: 0, dur: P.dur, dead: false, x: p.x, y: p.y, r: P.r, dmg: P.dmg * dmgMul(p, sp), light: 0, update(dt) { this.t += dt; this.x = p.x; this.y = p.y; if (this.t > this.dur) this.dead = true; this.tk = (this.tk || 0) - dt; const n = P.n; for (let i = 0; i < n; i++) { const a = this.t * 4.2 + i * 6.283 / n, sx = this.x + Math.cos(a) * this.r, sy = this.y - 8 + Math.sin(a) * this.r * 0.6; w.projectiles.forEach((q) => { if (q instanceof AH.EProj && U.dist(q.x, q.y - q.z, sx, sy) < 8) { q.dead = true; AH.Particles.bones(sx, sy, 4, 0); AH.Audio.sfx('hit_bone', { x: sx, y: sy }); } }); if (this.tk <= 0) w.enemies.forEach((e) => { if (!e.dead && !e.dormant && !e.ally && U.dist(e.x, e.y - 8, sx, sy) < e.r + 6) { Co.hit(e, this.dmg, { src: p, ang: a + 1.57, school: 'necro', tags: ['necro', 'bone'], spell: sp }); e.shove(Math.atan2(e.y - this.y, e.x - this.x), 90); this.tk = 0.12; } }); } },
      draw(g, cam, time) { const n = P.n; for (let i = 0; i < n; i++) { const a = this.t * 4.2 + i * 6.283 / n, x = Math.round(this.x - cam.x + Math.cos(a) * this.r), y = Math.round(this.y - cam.y - 8 + Math.sin(a) * this.r * 0.6); g.fillStyle = '#e8e4d0'; g.fillRect(x - 1, y - 2, 2, 5); g.fillStyle = '#7fe0c0'; g.fillRect(x, y - 3, 1, 1); } }, drawGround() {} };
    w.zones.push(z); AH.Audio.sfx('hit_bone', { x: p.x, y: p.y });
  };
  /* ---------- choir: forbidden rite ---------- */
  M.choir = function (p, sp, aim, ang, w) {
    const P = sp.p; AH.G.slowmo = 0.5; w.addShake(5); AH.Audio.sfx('ritual', { v: 1 }); AH.Audio.sfx('wail', { v: 1 });
    const z = { kind: 'choir', t: 0, dur: P.dur, dead: false, x: p.x, y: p.y, r: P.r, light: P.r, color: '#7fe0c0', lightI: 0.7, tk: 0, update(dt) { this.t += dt; this.tk -= dt; this.x = p.x; this.y = p.y; if (this.t > this.dur) this.dead = true; if (this.tk <= 0) { this.tk = 0.4; AH.Audio.sfx('wail', { x: this.x, y: this.y, v: 0.5, pitch: 1 + Math.random() * 0.3 }); w.enemies.forEach((e) => { if (!e.dead && !e.dormant && !e.ally && U.dist(e.x, e.y, this.x, this.y) < this.r) { Co.hit(e, P.dmg * dmgMul(p, sp), { src: p, ang: Math.atan2(e.y - this.y, e.x - this.x), school: 'necro', tags: ['necro', 'soul'], spell: sp, silent: true }); AH.Particles.magic(e.x, e.y - 10, 4, '#7fe0c0'); } }); } },
      draw(g, cam, time) { g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 8; i++) { const a = time * 0.8 + i * 0.785, rr = this.r * (0.5 + 0.5 * Math.sin(time * 2 + i)), x = Math.round(this.x - cam.x + Math.cos(a) * rr), y = Math.round(this.y - cam.y - 20 - Math.abs(Math.sin(time * 3 + i)) * 12 + Math.sin(a) * rr * 0.4); g.globalAlpha = 0.7; g.fillStyle = '#9ff0d8'; g.fillRect(x - 1, y - 3, 3, 4); g.fillRect(x, y + 1, 1, 3); g.fillStyle = '#0a1a18'; g.fillRect(x, y - 2, 1, 1); } g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }, drawGround() {} };
    w.zones.push(z);
  };
  /* ---------- familiar: Call Familiar ---------- */
  M.familiar = function (p, sp, aim, ang, w) {
    const P = sp.p; w.allies = w.allies.filter((a) => a.kind !== 'crow');
    const c = { kind: 'crow', type: 'crow', x: p.x, y: p.y, r: 3, t: 0, life: P.dur, dead: false, remove: false, lightR: 22, lightCol: '#a888c8', sortY: 0, tgt: null, tk: 0, ang: 0, ally: true, def: { h: 10 },
      update(dt) { this.t += dt; this.life -= dt; if (this.life <= 0) { this.remove = true; AH.Particles.magic(this.x, this.y - 14, 8, '#c27be0'); return; } let tgt = null, bd = 130; w.enemies.forEach((e) => { if (!e.dead && !e.dormant && !e.ally) { const d = U.dist(e.x, e.y, p.x, p.y); if (d < bd) { bd = d; tgt = e; } } });
        this.tgt = tgt; const gx = tgt ? tgt.x : p.x + Math.cos(this.t * 1.3) * 22, gy = tgt ? tgt.y : p.y + Math.sin(this.t * 1.3) * 12; const a = Math.atan2(gy - this.y, gx - this.x), d = U.dist(this.x, this.y, gx, gy), sp2 = tgt ? 90 : 70; if (d > 3) { this.x += Math.cos(a) * sp2 * dt; this.y += Math.sin(a) * sp2 * dt; } this.sortY = this.y;
        this.tk -= dt; if (tgt && d < 14 && this.tk <= 0) { this.tk = 0.8; Co.hit(tgt, P.dmg * dmgMul(p, sp), { src: p, ang: a, school: 'witch', tags: ['witch', 'hex'], fx: { hex: { t: 6 } }, spell: sp, silent: true }); AH.Particles.magic(tgt.x, tgt.y - 10, 4, '#c27be0'); AH.Audio.sfx('caw', { x: this.x, y: this.y, v: 0.5 }); }
        /* draws enemy attention: nearby foes target the crow first */ if (tgt && tgt.state === 'idle') tgt.alert(this); },
      receive() {}, draw(g, cam, time) { const spr = AH.Art.crow.fly[Math.floor(time * 10) % 2]; g.globalAlpha = 0.9; S.draw(g, spr, this.x - cam.x, this.y - cam.y - 12 - Math.sin(time * 6) * 2, { flip: Math.cos(this.ang) < 0, flash: 0.35, flashColor: '#c27be0' }); g.globalAlpha = 1; }, shadow() {} };
    w.allies.push(c); AH.Audio.sfx('caw', { x: p.x, y: p.y });
  };
})();

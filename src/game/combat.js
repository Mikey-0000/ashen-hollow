/* Ashen Hollow - combat resolution: damage maths, resistances, status effects, reactions and all of the
   "juice" (hit-stop, shake, knockback feedback, material-specific sound). Attackers describe a hit; targets decide what it means. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U;
  const Co = (AH.Combat = {});

  const HITSND = { flesh: 'hit_flesh', bone: 'hit_bone', spirit: 'hit_spirit', ward: 'hit_ward', stone: 'hit_stone', wood: 'hit_wood' };
  const BLEEDER = { flesh: 1 };

  /* o: { src, ang, kb, school, tags, fx, melee, crit, spell, big, silent, guardPierce } -> returns damage dealt or -1 if blocked */
  Co.hit = function (t, dmg, o) {
    o = o || {}; const G = AH.G, w = G.world; if (!t || t.dead || t.invuln) return 0;
    const def = t.def, school = o.school || 'phys'; let m = 1, notes = [];
    m *= def.res[school] !== undefined ? def.res[school] : 1;
    if (def.undead && o.undeadMul) m *= o.undeadMul;
    /* guarding sentinels: front arc blocks everything except piercing */
    if (t.guarding && t.guarding(o.ang) && o.guard !== 'pierce') {
      AH.Audio.sfx('hit_ward', { x: t.x, y: t.y }); AH.Particles.sparks(t.x, t.y - 10, 7, '#c8d8ff'); w.impact(t.x, t.y - 10, o.ang + Math.PI, 1, '#c8d8ff'); t.shove(o.ang, 40); G.hitstop = Math.max(G.hitstop, 0.04 * G.settings.hitstop);
      if (o.src === G.player) G.player.recoil(o.ang + Math.PI, 70);
      return -1;
    }
    /* reactions */
    const st = t.status;
    if (st.root && (o.tags || []).indexOf('blood') >= 0) { m *= 1.6; notes.push('IMPALE'); AH.Particles.blood(t.x, t.y - 8, 10, o.ang); }
    if (st.bleed && o.tags && o.tags.indexOf('blood') >= 0 && o.spell && o.spell.carrier === 'nova') m *= 1.3;
    if (st.hex) m *= 1.25 + (G.player ? G.player.mod('hexPower') : 0);
    if (st.mark && o.spell && o.spell.id === 'soul_lance') t.status.mark = st.mark;
    if (o.tags && o.tags.indexOf('lightning') >= 0 && (AH.Weather.isWet() || st.wet)) { m *= 1.35; notes.push('CONDUCT'); }
    if (o.crit) { m *= 1.6; }
    let final = Math.max(1, Math.round(dmg * m));
    /* blood magic: stronger the closer to death */
    if (o.src === G.player && o.spell && o.spell.school === 'blood') { const p = G.player; final = Math.round(final * (1 + (1 - p.hp / p.maxHp) * (o.spell.p.scaleMissing || 0.5))); }
    t.receive(final, o, m);
    /* feedback */
    const ang = o.ang || 0, mat = def.mat, big = o.big || final >= 24;
    AH.Audio.sfx(o.crit ? 'crit' : HITSND[mat] || 'hit_flesh', { x: t.x, y: t.y, pitch: big ? 0.85 : 1 });
    if (mat === 'flesh') AH.Particles.blood(t.x, t.y - def.h * 0.5, big ? 12 : 7, ang);
    else if (mat === 'bone') { AH.Particles.bones(t.x, t.y - def.h * 0.5, big ? 8 : 4, ang); AH.Particles.dust(t.x, t.y - 6, 3); }
    else AH.Particles.magic(t.x, t.y - def.h * 0.5, 7, '#9ab0ff');
    w.impact(t.x, t.y - def.h * 0.5, ang, big ? 1.6 : 1, mat === 'spirit' ? '#9ab8ff' : '#fff0d8');
    if (o.src === G.player) {
      const hs = (o.melee ? 0.055 : 0.03) * (big ? 1.7 : 1) * G.settings.hitstop; G.hitstop = Math.max(G.hitstop, hs);
      w.addShake(o.melee ? (big ? 3.2 : 1.8) : 1.2);
      const leech = G.player.mod('leech') + (o.leech || 0); if (leech > 0) G.player.heal(final * leech, true);
      if (G.player.buff.pact) G.player.heal(final * G.player.buff.pact.lifesteal, true);
    }
    if (!o.silent) w.spawnFx({ k: 'text', x: t.x + U.rr(-4, 4), y: t.y - def.h - 2, text: String(final) + (notes.length ? ' ' + notes[0] : ''), col: notes.length ? '#f0c060' : (o.src === G.player ? '#f4ece0' : '#ff8888'), t: 0, max: 0.7 });
    if (o.fx) Co.applyFx(t, o.fx, o);
    /* hex echo: part of the damage jumps to every other hexed foe */
    if (st.hex && !o.echo) { w.enemies.forEach((e) => { if (e !== t && !e.dead && e.status.hex) { Co.hit(e, final * (0.25 + G.player.mod('hexPower')), { echo: true, school: 'witch', silent: true, ang, src: o.src, tags: ['hex'] }); AH.Particles.magic(e.x, e.y - 10, 3, '#c27be0'); } }); }
    return final;
  };
  Co.applyFx = function (t, fx, o) {
    const G = AH.G, st = t.status, p = G.player;
    if (fx.bleed && t.def.mat === 'flesh') st.bleed = { t: fx.bleed.t, dps: fx.bleed.dps * (1 + p.mod('bleedMul')) };
    if (fx.poison) st.poison = { t: fx.poison.t, dps: fx.poison.dps };
    if (fx.slow) st.slow = { t: fx.slow.t, k: fx.slow.k };
    if (fx.root && !t.def.boss) { st.root = { t: fx.root.t }; }
    if (fx.hex) { const first = !st.hex; st.hex = { t: fx.hex.t + p.mod('hexDur') }; if (first) { AH.Audio.sfx('whisper', { x: t.x, y: t.y, v: 0.6 }); } }
    if (fx.mark) st.mark = 1;
  };
  Co.statusTick = function (e, dt) {
    const st = e.status;
    ['bleed', 'poison', 'slow', 'root', 'hex', 'wet'].forEach((k) => { const s = st[k]; if (!s) return; s.t -= dt; if (s.t <= 0) { delete st[k]; return; } if (s.dps) { s.acc = (s.acc || 0) + s.dps * dt; if (s.acc >= 1) { const d = Math.floor(s.acc); s.acc -= d; e.dotDamage(d, k); } } });
  };
  /* radial damage helper (novas, explosions). Returns number of foes hit. */
  Co.blast = function (x, y, r, dmg, o) {
    const w = AH.G.world; let n = 0; o = o || {};
    w.enemies.forEach((e) => { if (e.dead || e.dormant || (e.ally && !o.hitAllies)) return; const d = U.dist(x, y, e.x, e.y); if (d <= r + e.r) { const k = 1 - 0.4 * (d / (r + e.r)); const a = Math.atan2(e.y - y, e.x - x); Co.hit(e, dmg * k, Object.assign({}, o, { ang: a, silent: false })); e.shove(a, (o.kb || 120) * k); n++; } });
    if (o.hurtPlayer) { const p = AH.G.player; if (U.dist(x, y, p.x, p.y) <= r) p.hurt(dmg, Math.atan2(p.y - y, p.x - x), o.src, { kb: o.kb }); }
    w.spellHit(x, y, r, o.spell || { tags: o.tags || [] }, o);
    return n;
  };
  /* gas ignition: any spark-tag spell or fire source detonates spore clouds and bloom */
  Co.ignite = function (x, y, r) {
    const w = AH.G.world; let any = false;
    w.zones.forEach((z) => { if (z.gas && !z.dead && U.dist(x, y, z.x, z.y) < r + z.r) { z.dead = true; any = true; Co.explosion(z.x, z.y, z.r * 1.3, 32); } });
    return any;
  };
  Co.explosion = function (x, y, r, dmg) {
    const w = AH.G.world; AH.Audio.sfx('explode', { x, y }); w.addShake(4); AH.Particles.sparks(x, y - 6, 24, '#ffb050'); AH.Particles.smoke(x, y - 6, 8); AH.Particles.ringBurst(x, y, r, '#ffa040', 0.5);
    w.fx.push({ k: 'glow', x, y, t: 0, max: 0.4, light: r * 1.8, lcol: '#ffa040', col: '#ffa040', draw() {} });
    Co.blast(x, y, r, dmg, { school: 'phys', tags: ['fire', 'spark'], kb: 180, big: true, src: AH.G.player, spell: { tags: ['fire'] } });
  };
})();

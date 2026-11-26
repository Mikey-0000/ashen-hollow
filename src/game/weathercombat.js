/* Ashen Hollow - weather that matters in a fight.
   Rain damps fire (-25%) and conducts lightning (already +35%); storms push projectiles east and
   call down warned lightning strikes; fog muffles the range of your own spells' reach, not just theirs. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, Co = AH.Combat, We = AH.Weather, T = AH.T;
  const g = () => AH.G, safe = (fn) => { try { return fn(); } catch (e) { if (AH.errors) AH.errors.push('weathercombat: ' + e); } };
  const hit0 = Co.hit;
  Co.hit = function (t, dmg, o) {
    if (o && o.tags && o.tags.indexOf('fire') >= 0 && We.rainK > 0.35 && !(g().world && g().world.def.indoor)) { dmg *= We.stormK > 0.5 ? 0.65 : 0.75; if (!Co._damp || performance.now() - Co._damp > 4000) { Co._damp = performance.now(); g().toast('The rain drowns your flame.', '#7a9ae8'); } }
    return hit0.call(this, t, dmg, o);
  };
  const W = AH.World.prototype, upd0 = W.update; let strikeT = 12;
  W.update = function (dt) {
    const r = upd0.apply(this, arguments);
    safe(() => {
      const Gm = g(), p = Gm.player; if (!p || p.dead || this.def.indoor || We.stormK < 0.35) { strikeT = Math.max(strikeT, 8); return; }
      this.projectiles.forEach((q) => { if (q && q.vx !== undefined && q.src === p) q.vx += We.wind * We.stormK * 26 * dt; });
      strikeT -= dt; if (strikeT > 0) return; strikeT = U.rr(14, 26) / We.stormK;
      const a = Math.random() * 6.283, d = U.rr(50, 130), x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d * 0.7;
      if (this.opaqueAt && this.opaqueAt(x, y)) return;
      this.fx.push({ k: 'vfx', t: 0, max: 1.1, x, y, draw(g2, cam, f) { const k = f.t / f.max, sx = Math.round(f.x - cam.x), sy = Math.round(f.y - cam.y); g2.save(); g2.strokeStyle = k < 0.8 ? 'rgba(160,190,255,' + (0.3 + k * 0.5) + ')' : 'rgba(255,255,255,0.9)'; g2.lineWidth = 1; g2.beginPath(); g2.ellipse(sx, sy, 16, 8, 0, 0, 6.283); g2.stroke(); if (k > 0.8) { g2.fillStyle = '#ffffff'; g2.fillRect(sx - 1, 0, 3, sy); g2.globalAlpha = 0.5; g2.fillStyle = '#a8c0ff'; g2.fillRect(sx - 3, 0, 7, sy); } g2.restore(); } });
      setTimeout(() => safe(() => {
        const w = g().world; if (w !== this) return; AH.Audio.sfx('thunder', { v: 0.5 }); w.addShake && w.addShake(3); AH.Particles.burst(x, y, 14, { min: 40, max: 140, vz: [20, 80], g: 200, life: [0.2, 0.5], size: 1, c: ['#ffffff', '#a8c0ff'], add: true });
        w.enemies.forEach((e) => { if (!e.dead && U.dist(e.x, e.y, x, y) < 22) Co.hit(e, 16, { src: null, silent: false, tags: ['lightning'] }); });
        if (U.dist(p.x, p.y, x, y) < 20 && p.hurt) p.hurt(14, Math.atan2(p.y - y, p.x - x));
      }), 1000);
    });
    return r;
  };
})();

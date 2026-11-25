/* Ashen Hollow - dynamic 2D lighting with ray-cast shadow polygons.
   A half-resolution light map (ambient + additive lights) is multiplied over the scene, then a warm
   glow pass is added. Static torches cache their visibility polygon; moving lights re-cast each frame. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, W = AH.W, H = AH.H, T = AH.T;
  const L = (AH.Lighting = {});
  const LW = 240, LH = 135;
  const lc = U.makeCanvas(LW, LH), lg = lc.getContext('2d'), gc = U.makeCanvas(LW, LH), gg = gc.getContext('2d');
  lg.imageSmoothingEnabled = true; gg.imageSmoothingEnabled = true;
  const vig = U.makeCanvas(W, H), vg = vig.getContext('2d');
  (function () {
    const gr = vg.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.98);
    gr.addColorStop(0, 'rgba(4,3,8,0)'); gr.addColorStop(0.65, 'rgba(4,3,8,0.28)'); gr.addColorStop(1, 'rgba(4,3,8,0.78)');
    vg.fillStyle = gr; vg.fillRect(0, 0, W, H);
  })();

  /* time-of-day ambient ramp */
  const RAMP = [[0, '#27325a'], [5, '#2b3760'], [6.5, '#7a6478'], [8, '#b2aebc'], [12, '#cdcad6'], [16.5, '#bfb2b8'], [18.5, '#8a6068'], [20, '#38395e'], [22, '#27325a'], [24, '#27325a']];
  L.ambientAt = function (hour) {
    for (let i = 0; i < RAMP.length - 1; i++) if (hour >= RAMP[i][0] && hour <= RAMP[i + 1][0]) return U.mix(RAMP[i][1], RAMP[i + 1][1], (hour - RAMP[i][0]) / (RAMP[i + 1][0] - RAMP[i][0]));
    return RAMP[0][1];
  };
  /* 0 = deep night, 1 = full day */
  L.daylight = function (hour) { const a = L.ambientAt(hour), c = U.hex(a); return U.clamp((c[0] + c[1] + c[2]) / 3 / 190, 0, 1); };

  /* visibility polygon (world coords) from (x,y) out to radius r using DDA-ish stepping */
  L.vis = function (world, x, y, r, rays) {
    const pts = [], step = 3;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a);
      let d = 0;
      while (d < r) { d += step; if (world.opaqueAt(x + dx * d, y + dy * d)) { d += 5; break; } }
      d = Math.min(d, r);
      pts.push([x + dx * d, y + dy * d]);
    }
    return pts;
  };
  const gradCache = {};
  function gradient(ctx, r, col, inten) {
    const key = col + '|' + Math.round(r) + '|' + inten.toFixed(2) + ctx.canvas.width;
    return key;
  }
  function paintLight(ctx, sx, sy, r, col, inten, poly, cam, scale) {
    const c = U.hex(col), gr = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    gr.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + Math.min(1, inten) + ')');
    gr.addColorStop(0.35, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (inten * 0.62).toFixed(3) + ')');
    gr.addColorStop(0.7, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (inten * 0.22).toFixed(3) + ')');
    gr.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
    ctx.fillStyle = gr;
    if (poly) {
      ctx.save(); ctx.beginPath();
      for (let i = 0; i < poly.length; i++) { const px = (poly[i][0] - cam.x) * scale, py = (poly[i][1] - cam.y) * scale; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
      ctx.closePath(); ctx.clip(); ctx.fillRect(sx - r, sy - r, r * 2, r * 2); ctx.restore();
    } else ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
  }
  /* lights: {x,y,r,color,i,flicker,seed,shadow(true|'static'),poly} */
  L.render = function (g, cam, world, ambient, lights, time, opts) {
    opts = opts || {};
    lg.globalCompositeOperation = 'source-over'; lg.fillStyle = ambient; lg.fillRect(0, 0, LW, LH);
    gg.globalCompositeOperation = 'source-over'; gg.clearRect(0, 0, LW, LH);
    lg.globalCompositeOperation = 'lighter'; gg.globalCompositeOperation = 'lighter';
    const sc = 0.5;
    for (let i = 0; i < lights.length; i++) {
      const l = lights[i];
      let f = 1; if (l.flicker) f = 1 + (U.noise(time * 9 + (l.seed || 0) * 13, (l.seed || 0)) - 0.5) * l.flicker + Math.sin(time * 23 + (l.seed || 0)) * l.flicker * 0.08;
      const r = l.r * f, sx = (l.x - cam.x) * sc, sy = (l.y - cam.y) * sc;
      if (sx < -r * sc || sy < -r * sc || sx > LW + r * sc || sy > LH + r * sc) continue;
      let poly = null;
      if (l.shadow) {
        if (l.shadow === 'static') { if (!l.poly) l.poly = L.vis(world, l.x, l.y, l.r * 1.12, 40); poly = l.poly; } else poly = L.vis(world, l.x, l.y, r * 1.05, 64);
      }
      paintLight(lg, sx, sy, r * sc, l.color, (l.i || 1) * (opts.lightBoost || 1), poly, cam, sc);
      if (!l.noGlow) paintLight(gg, sx, sy, r * sc * 0.55, l.glow || l.color, (l.i || 1) * 0.45, null, cam, sc);
    }
    lg.globalCompositeOperation = 'source-over'; gg.globalCompositeOperation = 'source-over';
    g.save();
    g.imageSmoothingEnabled = true;
    g.globalCompositeOperation = 'multiply'; g.drawImage(lc, 0, 0, W, H);
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5; g.drawImage(gc, 0, 0, W, H);
    g.restore(); g.imageSmoothingEnabled = false;
  };
  L.vignette = function (g, strength) { g.globalAlpha = strength === undefined ? 1 : strength; g.drawImage(vig, 0, 0); g.globalAlpha = 1; };
})();

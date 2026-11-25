/* Ashen Hollow - presentation. The game draws a 480x270 pixel picture; this puts it on screen.
   crisp : plain nearest-neighbour (the original look).
   smooth: "sharp bilinear" - whole-number nearest upscale, then a gentle smooth to the exact window size. Pixel art stays
           crisp but the edges stop shimmering and stair-stepping at odd window sizes. Adds fine film grain that is NOT locked to
           the pixel grid and a soft bloom on bright lights, so the picture reads as finer-grained and less blocky.
   soft  : smooth + stronger bloom, vignette and faint scanlines. */
(function () {
  'use strict';
  const AH = window.AH, W = AH.W, H = AH.H;
  const P = (AH.Present = { mode: 'smooth', dpr: 1, cw: W, ch: H });
  let disp = null, dg = null, mid = null, mg = null, tiny = null, tg = null, grain = null, vig = null, vigKey = '', lines = null, lineKey = '', frame = 0;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  P.init = function (canvas) { disp = canvas; dg = disp.getContext('2d'); tiny = mk(120, 68); tg = tiny.getContext('2d'); tg.imageSmoothingEnabled = true; makeGrain(); };
  /* called from AH.resize with the css size of the picture */
  P.size = function (cssW, cssH) {
    P.dpr = Math.min(2, window.devicePixelRatio || 1); P.cw = Math.max(W, Math.round(cssW * P.dpr)); P.ch = Math.max(H, Math.round(cssH * P.dpr));
    if (disp) { disp.width = P.cw; disp.height = P.ch; }
  };
  function makeGrain() {
    grain = mk(160, 160); const g = grain.getContext('2d'), id = g.createImageData(160, 160); let s = 1234567;
    for (let i = 0; i < id.data.length; i += 4) { s = (s * 1664525 + 1013904223) >>> 0; const v = 96 + ((s >>> 24) % 64); id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    g.putImageData(id, 0, 0);
  }
  function vignette(w, h, k) {
    const key = w + 'x' + h + ':' + k; if (vigKey === key) return vig; vigKey = key; vig = mk(w, h); const g = vig.getContext('2d');
    const gr = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.72); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(4,2,10,' + k + ')');
    g.fillStyle = gr; g.fillRect(0, 0, w, h); return vig;
  }
  function scan(w, h, px) {
    const key = w + 'x' + h + ':' + px; if (lineKey === key) return lines; lineKey = key; lines = mk(w, h); const g = lines.getContext('2d'); g.fillStyle = 'rgba(0,0,0,0.5)';
    const step = Math.max(2, Math.round(px * 3)); for (let y = step - 1; y < h; y += step) g.fillRect(0, y, w, Math.max(1, Math.round(px * 0.6))); return lines;
  }

  /* buf: the 480x270 canvas the game just drew into */
  P.render = function (buf) {
    if (!disp) return; const mode = (AH.G && AH.G.settings && AH.G.settings.display) || 'smooth', cw = disp.width, ch = disp.height;
    P.mode = mode; frame++;
    if (mode === 'crisp') { dg.imageSmoothingEnabled = false; dg.globalCompositeOperation = 'source-over'; dg.globalAlpha = 1; dg.drawImage(buf, 0, 0, cw, ch); return; }
    /* sharp bilinear: integer nearest step, then smooth */
    const k = Math.max(1, Math.min(8, Math.floor(Math.min(cw / W, ch / H))));
    dg.globalCompositeOperation = 'source-over'; dg.globalAlpha = 1;
    if (cw === W * k && ch === H * k) { dg.imageSmoothingEnabled = false; dg.drawImage(buf, 0, 0, cw, ch); }
    else {
      if (!mid || mid.width !== W * k || mid.height !== H * k) { mid = mk(W * k, H * k); mg = mid.getContext('2d'); }
      mg.imageSmoothingEnabled = false; mg.drawImage(buf, 0, 0, W * k, H * k);
      dg.imageSmoothingEnabled = true; try { dg.imageSmoothingQuality = 'high'; } catch (e) { /* older browsers */ }
      dg.drawImage(mid, 0, 0, cw, ch);
    }
    const soft = mode === 'soft';
    /* bloom: a squared (highlights only) low-res copy, laid back over the picture */
    tg.globalCompositeOperation = 'copy'; tg.imageSmoothingEnabled = true; tg.drawImage(buf, 0, 0, tiny.width, tiny.height);
    tg.globalCompositeOperation = 'multiply'; tg.drawImage(tiny, 0, 0);
    dg.imageSmoothingEnabled = true; dg.globalCompositeOperation = 'lighter'; dg.globalAlpha = soft ? 0.5 : 0.32; dg.drawImage(tiny, 0, 0, cw, ch);
    /* grain finer than a game pixel: drifts a little each frame so it never reads as a pattern */
    const gs = Math.max(1, P.dpr), ox = (frame * 37) % 160, oy = (frame * 61) % 160;
    dg.globalCompositeOperation = 'overlay'; dg.globalAlpha = soft ? 0.13 : 0.09; dg.imageSmoothingEnabled = false;
    for (let y = -oy * gs; y < ch; y += 160 * gs) for (let x = -ox * gs; x < cw; x += 160 * gs) dg.drawImage(grain, x, y, 160 * gs, 160 * gs);
    dg.globalCompositeOperation = 'source-over'; dg.globalAlpha = 1;
    if (soft) { dg.drawImage(vignette(cw, ch, 0.4), 0, 0); dg.globalAlpha = 0.16; dg.drawImage(scan(cw, ch, cw / W / 3), 0, 0); dg.globalAlpha = 1; }
    else { dg.drawImage(vignette(cw, ch, 0.22), 0, 0); }
  };
})();

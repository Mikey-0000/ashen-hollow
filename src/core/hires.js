/* Ashen Hollow - hi-res pipeline. The simulation and every drawing routine still think in a 480x270 world, but the frame
   buffer is 960x540. Art made on the 1x grid is re-expressed on the 2x grid through an edge-aware scaler so diagonals and curves
   stop stair-stepping (the main source of the "blocky" look), and art authored natively at 2x (see art2.js) is drawn as it is.
   Hi.of(canvas)      -> 2x copy of a 1x canvas (cached on the canvas)
   Hi.up(canvas, how) -> uncached 2x copy; how = 'epx' | 'aa' (epx at 4x, boxed down: anti-aliased contours) | 'smooth' (bicubic-ish) */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U;
  const Hi = (AH.Hi = { SC: 2, on: true });
  AH.SC = 2;

  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return c; };

  /* Scale2x / EPX on a Uint32 RGBA array */
  function epx(src, w, h) {
    const W = w * 2, out = new Uint32Array(W * h * 2);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, p = src[i], a = y > 0 ? src[i - w] : p, d = y < h - 1 ? src[i + w] : p, c = x > 0 ? src[i - 1] : p, b = x < w - 1 ? src[i + 1] : p;
      let p1 = p, p2 = p, p3 = p, p4 = p;
      if (c === a && c !== d && a !== b) p1 = a;
      if (a === b && a !== c && b !== d) p2 = b;
      if (d === c && d !== b && c !== a) p3 = c;
      if (b === d && b !== a && d !== c) p4 = d;
      const o = y * 2 * W + x * 2; out[o] = p1; out[o + 1] = p2; out[o + W] = p3; out[o + W + 1] = p4;
    }
    return out;
  }
  function boxDown(src, w, h, f) { /* average f x f blocks, alpha-weighted so edges do not darken */
    const ow = (w / f) | 0, oh = (h / f) | 0, out = new Uint32Array(ow * oh), n = f * f;
    for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let j = 0; j < f; j++) for (let i = 0; i < f; i++) { const p = src[(y * f + j) * w + x * f + i], pa = p >>> 24; r += (p & 255) * pa; g += ((p >> 8) & 255) * pa; b += ((p >> 16) & 255) * pa; a += pa; }
      if (a === 0) { out[y * ow + x] = 0; continue; }
      out[y * ow + x] = (Math.round(a / n) << 24) | (Math.round(b / a) << 16) | (Math.round(g / a) << 8) | Math.round(r / a);
    }
    return out;
  }
  function toU32(c) { const g = c.getContext('2d'), id = g.getImageData(0, 0, c.width, c.height); return new Uint32Array(id.data.buffer.slice(0)); }
  function fromU32(a, w, h) { const c = mk(w, h), g = c.getContext('2d'), id = g.createImageData(w, h); new Uint32Array(id.data.buffer).set(a); g.putImageData(id, 0, 0); return c; }

  Hi.up = function (c, how) {
    const w = c.width, h = c.height; if (!w || !h) return c;
    let src; try { src = toU32(c); } catch (e) { const o = mk(w * 2, h * 2); o.getContext('2d').drawImage(c, 0, 0, w * 2, h * 2); return o; }
    if (how === 'smooth') { const o = mk(w * 2, h * 2), g = o.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, w * 2, h * 2); return o; }
    const e2 = epx(src, w, h);
    if (how === 'epx') return fromU32(e2, w * 2, h * 2);
    const e4 = epx(e2, w * 2, h * 2);                 /* 4x contours ... */
    return fromU32(boxDown(e4, w * 4, h * 4, 2), w * 2, h * 2); /* ... averaged to 2x: anti-aliased curves */
  };
  Hi.mode = 'aa';
  Hi.of = function (c) { return c._hi || (c._hi = Hi.up(c, Hi.mode)); };
  Hi.sil = function (hc, color) { const k = '_s' + color; if (hc[k]) return hc[k]; const o = mk(hc.width, hc.height), g = o.getContext('2d'); g.drawImage(hc, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, o.width, o.height); return (hc[k] = o); };
})();

/* Ashen Hollow - sprite engine: palette-indexed pixel grids -> canvases, selective outlines,
   silhouettes for hit-flash/shadows, row-shear animation, and a tiny pixel painter for procedural art. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U;
  const S = (AH.Sprites = {});
  const INK = '#0b0910';

  /* rows: array of strings; pal: char -> hex; o: {sym, outline, ax, ay} */
  S.make = function (rows, pal, o) {
    o = o || {};
    if (o.sym) rows = rows.map((r) => r + r.split('').reverse().join(''));
    const h = rows.length;
    let w = 0; rows.forEach((r) => (w = Math.max(w, r.length)));
    const pad = o.outline === false ? 0 : 1;
    const W = w + pad * 2, H = h + pad * 2;
    const c = U.makeCanvas(W, H), g = c.getContext('2d'), id = g.createImageData(W, H), d = id.data;
    const cols = new Array(W * H).fill(null);
    for (let y = 0; y < h; y++) for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x]; if (ch === '.' || ch === ' ') continue;
      const hex = pal[ch]; if (!hex) continue;
      cols[(y + pad) * W + x + pad] = U.hex(hex);
    }
    const oc = o.outline && o.outline !== true ? U.hex(o.outline) : null;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; let col = cols[i];
      if (!col && pad) {
        const n = [cols[i - 1] && x > 0 ? cols[i - 1] : null, x < W - 1 ? cols[i + 1] : null, y > 0 ? cols[i - W] : null, y < H - 1 ? cols[i + W] : null].filter(Boolean);
        if (n.length) { const b = n[0]; col = oc || [b[0] * 0.28 + 8, b[1] * 0.28 + 6, b[2] * 0.28 + 14]; }
      }
      if (col) { d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = 255; }
    }
    g.putImageData(id, 0, 0);
    const spr = { c, w: W, h: H, ax: o.ax !== undefined ? o.ax + pad : Math.floor(w / 2) + pad, ay: o.ay !== undefined ? o.ay + pad : h + pad, _sil: {}, _flip: null };
    return spr;
  };
  /* wrap an existing canvas as a sprite */
  S.fromCanvas = function (c, ax, ay) { return { c, w: c.width, h: c.height, ax: ax === undefined ? c.width >> 1 : ax, ay: ay === undefined ? c.height : ay, _sil: {}, _flip: null }; };
  S.flipped = function (spr) {
    if (spr._flip) return spr._flip;
    const cw = spr.c.width, c = U.makeCanvas(cw, spr.c.height), g = c.getContext('2d');
    g.translate(cw, 0); g.scale(-1, 1); g.drawImage(spr.c, 0, 0);
    spr._flip = { c, w: spr.w, h: spr.h, ax: spr.w - spr.ax, ay: spr.ay, hi: spr.hi, _sil: {}, _flip: spr };
    return spr._flip;
  };
  S.sil = function (spr, color) {
    let s = spr._sil[color]; if (s) return s;
    const c = U.makeCanvas(spr.c.width, spr.c.height), g = c.getContext('2d');
    g.drawImage(spr.c, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    return (spr._sil[color] = c);
  };
  /* o: {flip, alpha, flash(0..1), flashColor, dx per row fn, scaleY} */
  S.draw = function (g, spr, x, y, o) {
    if (!spr) return;
    o = o || {};
    const s = o.flip ? S.flipped(spr) : spr;
    const k = s.hi ? 2 : 1, px = Math.round((x - s.ax) * k) / k, py = Math.round((y - s.ay) * k) / k;
    const pa = g.globalAlpha;
    if (o.alpha !== undefined) g.globalAlpha = pa * o.alpha;
    const blit = (src) => {
      if (o.shear) { for (let r = 0; r < s.c.height; r++) g.drawImage(src, 0, r, s.c.width, 1, px + Math.round(o.shear(r / k, s.h) * k) / k, py + r / k, s.w, 1 / k); }
      else g.drawImage(src, px, py, s.w, s.h);
    };
    if (!s.hi && !o.shear && AH.Hi && AH.Hi.on && (s._n = (s._n | 0) + 1) > 3 && s.c.width * s.c.height <= 36000) g.drawImage(AH.Hi.of(s.c), px, py, s.w, s.h);
    else blit(s.c);
    if (o.flash) { g.globalAlpha = pa * o.flash * (o.alpha === undefined ? 1 : o.alpha); blit(S.sil(s, o.flashColor || '#ffffff')); }
    g.globalAlpha = pa;
  };
  /* stack parts (each {spr, x, y} relative to a shared origin) into one new sprite */
  S.compose = function (w, h, parts, ax, ay) {
    const c = U.makeCanvas(w, h), g = c.getContext('2d');
    parts.forEach((p) => g.drawImage(p.spr.c || p.spr, p.x, p.y));
    return { c, w, h, ax: ax === undefined ? w >> 1 : ax, ay: ay === undefined ? h : ay, _sil: {}, _flip: null };
  };
  /* re-outline a canvas that was composed from outline-free parts */
  S.outline = function (spr, color) {
    const W = spr.w, H = spr.h, g = spr.c.getContext('2d'), id = g.getImageData(0, 0, W, H), d = id.data, out = new Uint8ClampedArray(d);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4; if (d[i + 3]) continue;
      const nb = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
      for (const [nx, ny] of nb) {
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = (ny * W + nx) * 4;
        if (d[j + 3] > 200) { const c = color ? U.hex(color) : [d[j] * 0.28 + 8, d[j + 1] * 0.28 + 6, d[j + 2] * 0.28 + 14]; out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2]; out[i + 3] = 255; break; }
      }
    }
    id.data.set(out); g.putImageData(id, 0, 0); return spr;
  };

  /* ---------- pixel painter for procedural art ---------- */
  S.painter = function (w, h) {
    const c = U.makeCanvas(w, h), g = c.getContext('2d');
    const P = {
      c, g, w, h,
      px(x, y, col) { if (x < 0 || y < 0 || x >= w || y >= h) return; g.fillStyle = col; g.fillRect(x | 0, y | 0, 1, 1); },
      rect(x, y, ww, hh, col) { g.fillStyle = col; g.fillRect(x | 0, y | 0, ww | 0, hh | 0); },
      disc(cx, cy, r, col) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.4) P.px(Math.round(cx + x), Math.round(cy + y), col); },
      ell(cx, cy, rx, ry, col) { for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx + 0.3) + (y * y) / (ry * ry + 0.3) <= 1) P.px(Math.round(cx + x), Math.round(cy + y), col); },
      line(x0, y0, x1, y1, col, th) {
        const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
        for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n; if (th > 1) P.rect(Math.round(x - th / 2), Math.round(y - th / 2), th, th, col); else P.px(Math.round(x), Math.round(y), col); }
      },
      /* tapered limb: thickness t0 at start to t1 at end */
      limb(x0, y0, x1, y1, t0, t1, col) {
        const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
        for (let i = 0; i <= n; i++) { const k = i / n, x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k, t = U.lerp(t0, t1, k); P.rect(Math.round(x - t / 2), Math.round(y - t / 2), Math.max(1, Math.round(t)), Math.max(1, Math.round(t)), col); }
      },
      /* rough noisy disc, lit from top-left with 3 tones */
      blob(cx, cy, r, cols, seed, rough) {
        const rg = U.mulberry32(seed || 1);
        for (let y = -r - 2; y <= r + 2; y++) for (let x = -r - 2; x <= r + 2; x++) {
          const d = Math.sqrt(x * x + y * y), n = (U.noise((cx + x) * 0.9, (cy + y) * 0.9, seed || 1) - 0.5) * (rough === undefined ? 3 : rough);
          if (d + n <= r) {
            const lit = (-x - y) / (r * 1.4) + (rg() - 0.5) * 0.45;
            P.px(Math.round(cx + x), Math.round(cy + y), lit > 0.35 ? cols[0] : lit > -0.25 ? cols[1] : cols[2]);
          }
        }
      },
      speckle(x, y, ww, hh, cols, n, seed) { const rg = U.mulberry32(seed || 7); for (let i = 0; i < n; i++) P.px(x + Math.floor(rg() * ww), y + Math.floor(rg() * hh), cols[Math.floor(rg() * cols.length)]); },
      sprite(ax, ay) { return S.fromCanvas(c, ax, ay); },
    };
    return P;
  };

  /* small helper to build an animated frame list from one generator */
  S.frames = (n, fn) => { const out = []; for (let i = 0; i < n; i++) out.push(fn(i, n)); return out; };
})();

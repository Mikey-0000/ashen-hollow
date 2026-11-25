/* Ashen Hollow - native 2x creature art: the dire hound. Same frame set as art.js (run / stand / crouch / air). */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, Art = AH.Art, rgb = U.hex;
  const CW = 76, CH = 48;
  function raster() {
    const d = new Uint8ClampedArray(CW * CH * 4);
    const R = {
      d,
      set(x, y, c) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= CW || y >= CH) return; const a = typeof c === 'string' ? rgb(c) : c, i = (y * CW + x) * 4; d[i] = a[0]; d[i + 1] = a[1]; d[i + 2] = a[2]; d[i + 3] = 255; },
      ell(cx, cy, rx, ry, t, rot) {
        const co = Math.cos(rot || 0), si = Math.sin(rot || 0);
        for (let y = Math.floor(cy - rx - ry); y <= Math.ceil(cy + rx + ry); y++) for (let x = Math.floor(cx - rx - ry); x <= Math.ceil(cx + rx + ry); x++) {
          const dx = x - cx, dy = y - cy, u = (dx * co + dy * si) / rx, v = (-dx * si + dy * co) / ry; if (u * u + v * v > 1) continue;
          const l = -(dx * 0.55 + dy * 0.85) / Math.max(rx, ry); R.set(x, y, l > 0.45 ? t[0] : l < -0.25 ? t[2] : t[1]);
        }
      },
      limb(x0, y0, x1, y1, w, t) {
        const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)) * 2 || 1;
        for (let i = 0; i <= n; i++) { const k = i / n, x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k; for (let a = 0; a < w; a++) for (let b = 0; b < w; b++) R.set(x - w / 2 + a, y - w / 2 + b, a === 0 ? t[0] : a === w - 1 ? t[2] : t[1]); }
      },
    };
    return R;
  }
  function outline(R) {
    const d = R.d, out = new Uint8ClampedArray(d);
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const i = (y * CW + x) * 4; if (d[i + 3]) continue;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) { if (nx < 0 || ny < 0 || nx >= CW || ny >= CH) continue; const j = (ny * CW + nx) * 4; if (d[j + 3]) { out[i] = d[j] * 0.28 + 6; out[i + 1] = d[j + 1] * 0.24 + 6; out[i + 2] = d[j + 2] * 0.34 + 16; out[i + 3] = 255; break; } } }
    d.set(out);
  }
  const FUR = ['#5a5a6c', '#3a3a48', '#20202c'], BONE = ['#ece4d2', '#bdb29a', '#7c7260'], DARK = ['#34343f', '#22222b', '#14141a'];
  function hound(pose) {
    const R = raster(), dy = pose === 'crouch' ? 7 : pose === 'air' ? -4 : 0, run1 = pose === 'run1', run2 = pose === 'run2', air = pose === 'air', cr = pose === 'crouch';
    const by = 22 + dy;
    /* far legs first (darker) */
    const leg = (x, ph, far) => { const t = far ? DARK : FUR, sw = air ? (far ? -9 : -7) : cr ? 3 : run1 ? ph * 7 : run2 ? -ph * 7 : 0, lift = (run1 && ph > 0) || (run2 && ph < 0) ? 5 : 0;
      R.limb(x, by + 4, x + sw * 0.6, by + 13 - lift * 0.3 + (cr ? 4 : 0), 5, t); R.limb(x + sw * 0.6, by + 13 - lift * 0.3 + (cr ? 4 : 0), x + sw, 41 + dy * (air ? 0.2 : 0.5) - lift + (air ? -4 : 0), 4, t); R.ell(x + sw + 1, 42 + dy * (air ? 0.2 : 0.5) - lift + (air ? -4 : 0), 3.5, 2, BONE); };
    leg(46, -1, true); leg(18, 1, true);
    /* tail */
    R.limb(8, by - 1, 2, by - 9 + (cr ? 3 : 0), 3, FUR); R.limb(2, by - 9, 4, by - 16 + (cr ? 3 : 0), 2, FUR);
    /* body */
    R.ell(32, by, 18, 8.5, FUR); R.ell(20, by + 1, 9, 9, FUR); R.ell(46, by - 1, 9, 9.5, FUR);
    for (let i = 0; i < 5; i++) { const rx = 26 + i * 4; for (let k = 0; k < 6; k++) R.set(rx + (k > 3 ? 1 : 0), by - 2 + k, BONE[k > 3 ? 1 : 0]); }
    for (let i = 0; i < 7; i++) { R.set(14 + i * 5, by - 9 - (i % 2), FUR[2]); R.set(14 + i * 5, by - 8, FUR[0]); }   // spiny back
    leg(50, 1, false); leg(14, -1, false);
    /* head: skull, jaw, ears */
    const hx = cr ? 62 : air ? 64 : 60, hy = by - (cr ? -1 : 6) + (air ? 1 : 0);
    R.limb(50, by - 3, hx - 3, hy + 1, 8, FUR);
    R.ell(hx, hy, 8, 6.5, BONE); R.ell(hx + 8, hy + 2.5, 6, 3.4, BONE);
    R.ell(hx + 4, hy + 7, 8, 2.2, cr || air ? DARK : BONE, 0.12);   // jaw
    for (let i = 0; i < 4; i++) { R.set(hx + 7 + i * 2, hy + 5, '#ffffff'); R.set(hx + 7 + i * 2, hy + 6, '#ffffff'); }   // teeth
    R.ell(hx + 1, hy - 1, 2.4, 2.4, ['#ffb060', '#ff7a30', '#c04a18']); R.set(hx + 1, hy - 2, '#fff0c0'); R.set(hx, hy - 1, '#ff9040');
    R.set(hx + 12, hy + 1, '#14141a'); R.set(hx + 13, hy + 1, '#14141a');
    R.limb(hx - 4, hy - 5, hx - 14, hy - 10, 3, BONE); R.limb(hx, hy - 6, hx - 7, hy - 13, 2, BONE);   // horns / ears
    outline(R);
    const c = U.makeCanvas(CW, CH), g = c.getContext('2d'); g.putImageData(new ImageData(R.d, CW, CH), 0, 0);
    return { c, w: CW / 2, h: CH / 2, ax: 31 / 2 + 3, ay: 45 / 2, hi: true, _sil: {}, _flip: null };
  }
  Art.hound = { run: [hound('run1'), hound('stand'), hound('run2'), hound('stand')], crouch: hound('crouch'), air: hound('air'), stand: hound('stand') };
})();

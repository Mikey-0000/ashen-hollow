/* Ashen Hollow - native 2x creature art: the dire hound. Same frame set as art.js (run / stand / crouch / air). */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, Art = AH.Art, rgb = U.hex;
  const CW = 76, CH = 48;
  function raster(CW, CH, oy) {
    const d = new Uint8ClampedArray(CW * CH * 4);
    const R = {
      d, CW, CH,
      set(x, y, c) { x = Math.round(x); y = Math.round(y) + (oy || 0); if (x < 0 || y < 0 || x >= CW || y >= CH) return; const a = typeof c === 'string' ? rgb(c) : c, i = (y * CW + x) * 4; d[i] = a[0]; d[i + 1] = a[1]; d[i + 2] = a[2]; d[i + 3] = 255; },
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
      rect(x0, y0, w, h, c) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) R.set(x0 + x, y0 + y, c); },
    };
    return R;
  }
  function outline(R, oc) {
    const CW = R.CW, CH = R.CH, d = R.d, out = new Uint8ClampedArray(d), fix = oc ? rgb(oc) : null;
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const i = (y * CW + x) * 4; if (d[i + 3]) continue;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) { if (nx < 0 || ny < 0 || nx >= CW || ny >= CH) continue; const j = (ny * CW + nx) * 4; if (d[j + 3]) { const c = fix || [d[j] * 0.28 + 6, d[j + 1] * 0.24 + 6, d[j + 2] * 0.34 + 16]; out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2]; out[i + 3] = 255; break; } } }
    d.set(out);
  }
  const FUR = ['#5a5a6c', '#3a3a48', '#20202c'], BONE = ['#ece4d2', '#bdb29a', '#7c7260'], DARK = ['#34343f', '#22222b', '#14141a'];
  function hound(pose) {
    const R = raster(CW, CH), dy = pose === 'crouch' ? 7 : pose === 'air' ? -4 : 0, run1 = pose === 'run1', run2 = pose === 'run2', air = pose === 'air', cr = pose === 'crouch';
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
  /* ---- Weeping Choirmaster: an abbot grown into a great bronze bell ---- */
  const BW = 112, BH = 144, BR = ['#d8aa5c', '#a07a3a', '#5e4220'];
  function choir(pose) {
    const R = raster(BW, BH), sway = pose === 'idle2' ? 2 : 0, raise = pose === 'raise', slam = pose === 'slam', kneel = pose === 'kneel';
    const top = kneel ? 44 : 28, bottom = 130, cx = 56, h = U.hash;
    for (let y = top + 28; y < bottom; y++) {
      const t = (y - (top + 28)) / (bottom - top - 28), w = 18 + 34 * Math.pow(t, 0.8) + (t > 0.9 ? 4 : 0);
      for (let x = -w; x <= w; x++) {
        const nx = x / w, lit = -nx * 0.7 + (h(x, y, 61) - 0.5) * 0.18 + (Math.floor((x + 99) / 3) % 2 ? 0.04 : 0);
        let col = lit > 0.38 ? BR[0] : lit > -0.3 ? BR[1] : BR[2];
        if (Math.abs(y - (bottom - 10)) <= 2 || Math.abs(y - (top + 52)) <= 1) col = lit > 0 ? '#f0c878' : BR[0];
        R.set(cx + x + sway * (t * 2), y, col);
      }
    }
    for (let i = 0; i < 90; i++) { const x = 28 + Math.floor(h(i, 1, 62) * 56), y = top + 48 + Math.floor(h(i, 2, 62) * 70); if (R.d[((y * BW) + x) * 4 + 3]) { R.set(x, y, '#58765c'); R.set(x + 1, y, '#58765c'); R.set(x, y + 1, '#40584a'); } }
    R.limb(60, top + 60, 66, top + 80, 2, ['#2a180c', '#1a0f08', '#1a0f08']); R.limb(66, top + 80, 62, top + 96, 2, ['#2a180c', '#1a0f08', '#1a0f08']); R.limb(62, top + 96, 70, top + 112, 2, ['#2a180c', '#1a0f08', '#1a0f08']);
    R.ell(cx, bottom - 2, 30, 6, ['#2e1c0a', '#180e05', '#0c0702']); R.ell(cx + sway * 4, bottom - 2, 6, 6, BR);
    R.ell(cx, top + 32, 24, 16, ['#a63a4a', '#74222f', '#481520'], 0.2);
    for (let x = 36; x <= 76; x += 3) { R.set(x, top + 21 + (x % 6 ? 0 : 2), '#e8c068'); R.set(x + 1, top + 21 + (x % 6 ? 0 : 2), '#c89a40'); }
    R.rect(52, top + 28, 8, 28, '#e8c068'); R.rect(44, top + 38, 24, 6, '#e8c068'); R.rect(53, top + 29, 2, 26, '#f6d890');
    const ay = raise ? top - 12 : slam ? top + 56 : top + 44, ax = raise ? 16 : slam ? 16 : 20, AR = ['#cfc8ba', '#9a9488', '#605a4e'];
    R.limb(36, top + 28, ax, ay, 9, AR); R.limb(76, top + 28, 112 - ax, ay, 9, AR);
    R.ell(ax, ay, 6, 6, ['#e6dcc4', '#bdb29a', '#7c7260']); R.ell(112 - ax, ay, 6, 6, ['#e6dcc4', '#bdb29a', '#7c7260']);
    for (let k = -1; k <= 1; k++) { R.limb(ax + k * 3, ay + 4, ax + k * 4, ay + 11, 2, ['#e6dcc4', '#bdb29a', '#7c7260']); R.limb(112 - ax + k * 3, ay + 4, 112 - ax + k * 4, ay + 11, 2, ['#e6dcc4', '#bdb29a', '#7c7260']); }
    const hy = top + 4;
    R.ell(cx, hy + 10, 13, 15, ['#f0eadc', '#c8c0aa', '#8a8472'], 0.1);
    R.rect(46, hy + 6, 8, 7, '#14101a'); R.rect(60, hy + 6, 8, 7, '#14101a'); R.rect(48, hy + 8, 3, 3, '#cfeaff'); R.rect(62, hy + 8, 3, 3, '#cfeaff');
    for (let t = 0; t < 16; t++) { R.set(49, hy + 13 + t, '#2a3246'); R.set(50, hy + 13 + t, '#3a4660'); R.set(63, hy + 13 + t, '#2a3246'); R.set(64, hy + 13 + t, '#3a4660'); }
    R.rect(52, hy + 21, 10, 6, '#24141c'); R.rect(55, hy + 27, 3, 3, '#24141c');
    for (let y = 0; y < 28; y++) { const w = 2 + y * 0.55; for (let x = -w; x <= w; x++) R.set(cx + x, hy - 24 + y, y < 3 ? '#f0cf78' : Math.abs(x) < 2.4 ? '#f0cf78' : x < 0 ? '#a888b8' : '#5e3e7e'); }
    R.rect(42, hy - 2, 30, 4, '#e0b862'); R.rect(54, hy - 21, 4, 10, '#fff4c0'); R.rect(52, hy - 17, 8, 2, '#fff4c0');
    outline(R, '#120a0c');
    const c = U.makeCanvas(BW, BH), g = c.getContext('2d'); g.putImageData(new ImageData(R.d, BW, BH), 0, 0);
    return { c, w: BW / 2, h: BH / 2, ax: 28, ay: 66, hi: true, _sil: {}, _flip: null };
  }
  Art.boss = { idle: [choir('idle'), choir('idle2')], raise: choir('raise'), slam: choir('slam'), kneel: choir('kneel') };
  /* ---- Thorn stag (optional guardian) ---- */
  const SW = 112, SH = 108, SC_ = ['#9a8860', '#6a5a40', '#3a2e20'], AN = ['#ece0c0', '#b0a280', '#6a604a'];
  function stag(pose) {
    const R = raster(SW, SH, 20), w = pose === 'walk1' ? 5 : pose === 'walk2' ? -5 : 0, paw = pose === 'paw', h = U.hash;
    const leg = (x, sw, far) => { const t = far ? [SC_[1], SC_[2], SC_[2]] : SC_; R.limb(x, 48, x + sw * 0.5, 66, 6, t); R.limb(x + sw * 0.5, 66, x + sw + (far ? 0 : 0), 82, 4, t); R.ell(x + sw + 1, 83, 3.4, 2.2, ['#5a4a38', '#2e2418', '#1a140c']); };
    leg(34, -w, true); leg(78, w, true);
    R.limb(46, 42, 40, 36, 4, SC_);
    for (let i = 0; i < 9; i++) { const x = 34 + i * 5; R.limb(x, 38, x - 1, 28 - (i % 2) * 3, 3, ['#4a6a3a', '#2e4a26', '#1a2e16']); }   // thorn ridge
    R.ell(52, 44, 26, 13, SC_); R.ell(36, 46, 12, 12, SC_); R.ell(74, 42, 13, 13, SC_);
    for (let i = 0; i < 40; i++) { const x = 30 + Math.floor(h(i, 3, 71) * 50), y = 34 + Math.floor(h(i, 4, 71) * 22); if (R.d[((y + 20) * SW + x) * 4 + 3]) { R.set(x, y, '#5a7a44'); R.set(x + 1, y, '#46623a'); } }   // moss
    leg(40, w, false); leg(84, -w, false);
    const hx = 92, hy = paw ? 32 : 24;
    R.limb(78, 36, hx - 4, hy + 4, 12, SC_);
    R.ell(hx, hy, 9, 7.5, SC_); R.ell(hx + 9, hy + 3, 8, 4.4, SC_); R.set(hx + 16, hy + 3, '#14100a'); R.set(hx + 15, hy + 3, '#14100a');
    R.ell(hx - 1, hy - 2, 2.6, 2.6, ['#c8ffb0', '#6ad060', '#2e7a2a']); R.set(hx - 2, hy - 3, '#ffffff');
    R.limb(hx - 6, hy - 6, hx - 11, hy - 13, 4, SC_);   // ear
    /* antlers: a bare winter tree */
    const ant = (x0, y0, ang, len, wd, d) => { const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len; R.limb(x0, y0, x1, y1, wd, AN); if (d > 0) { ant(x1, y1, ang - 0.55, len * 0.72, Math.max(2, wd - 1), d - 1); ant(x1, y1, ang + 0.4, len * 0.7, Math.max(2, wd - 1), d - 1); if (d > 1) R.set(x1, y1, '#9affb0'); } };
    ant(hx - 4, hy - 6, -1.9, 15, 4, 3); ant(hx + 1, hy - 7, -1.2, 14, 3, 3);
    outline(R, '#120e08');
    const c = U.makeCanvas(SW, SH), g = c.getContext('2d'); g.putImageData(new ImageData(R.d, SW, SH), 0, 0);
    return { c, w: SW / 2, h: SH / 2, ax: 24, ay: 52, hi: true, _sil: {}, _flip: null };
  }
  Art.stag = { walk: [stag('walk1'), stag('stand'), stag('walk2'), stag('stand')], stand: stag('stand'), paw: stag('paw') };
})();

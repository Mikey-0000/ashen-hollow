/* Ashen Hollow - native 2x chibi characters. Same sets as art.js ({down,up,side} x 3 frames) but painted at double resolution:
   ~40% head, big glossy eyes, 3-tone hard cel shading, hue-shifted coloured outline (see DESIGN_SPEC.md). Sprites carry hi:true;
   w/h/ax/ay stay in logical (480x270) units so the rest of the game is unchanged. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, S = AH.Sprites, Art = AH.Art;
  const CW = 40, CH = 72, CX = 20, OY = 8, FEET = 70;
  const rgb = (h) => U.hex(h);
  const dk = (h, k) => { const a = rgb(h); return [a[0] * k, a[1] * k, a[2] * k]; };

  function paint() {
    const d = new Uint8ClampedArray(CW * CH * 4);
    const R = {
      d,
      set(x, y, c) { x = Math.round(x); y = Math.round(y + OY); if (x < 0 || y < 0 || x >= CW || y >= CH) return; const a = typeof c === 'string' ? rgb(c) : c, i = (y * CW + x) * 4; d[i] = a[0]; d[i + 1] = a[1]; d[i + 2] = a[2]; d[i + 3] = 255; },
      has(x, y) { x = Math.round(x); y = Math.round(y + OY); return x >= 0 && y >= 0 && x < CW && y < CH && d[(y * CW + x) * 4 + 3] > 0; },
      clear(x, y) { x = Math.round(x); y = Math.round(y + OY); if (x < 0 || y < 0 || x >= CW || y >= CH) return; d[(y * CW + x) * 4 + 3] = 0; },
      /* shaded ellipse; light from top-left. keep(x,y) optional filter */
      ell(cx, cy, rx, ry, t, keep, soft) {
        for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const nx = (x - cx) / rx, ny = (y - cy) / ry; if (nx * nx + ny * ny > 1) continue; if (keep && !keep(x, y)) continue;
          const l = -nx * 0.6 - ny * 0.8; R.set(x, y, soft ? (l > 0.85 ? t[0] : l < -0.9 ? t[2] : t[1]) : (l > 0.42 ? t[0] : l < -0.22 ? t[2] : t[1]));
        }
      },
      /* shaded block: light top/left, shadow right/bottom */
      rect(x0, y0, x1, y1, t, sh) {
        const w = x1 - x0 + 1, h = y1 - y0 + 1, e = sh === undefined ? 2 : sh;
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) R.set(x, y, x - x0 < 1 || y - y0 < 1 ? t[0] : x1 - x < e || (h > 5 && y1 - y < 1) ? t[2] : t[1]);
      },
      /* trapezoid skirt/robe: top half-width a at y0, bottom half-width b at y1 */
      trap(cx, y0, y1, a, b, t, sway) {
        for (let y = y0; y <= y1; y++) {
          const k = (y - y0) / Math.max(1, y1 - y0), hw = a + (b - a) * k, sx = (sway || 0) * k;
          for (let x = Math.round(cx - hw + sx); x <= Math.round(cx + hw + sx); x++) {
            const u = (x - (cx - hw + sx)) / (2 * hw);
            R.set(x, y, u < 0.18 ? t[0] : u > 0.7 || (y1 - y < 1 && y1 - y0 > 6) ? t[2] : t[1]);
          }
        }
      },
    };
    return R;
  }

  function figure(s, dir, f, pose) {
    const R = paint(), set = R.set, ell = R.ell, rect = R.rect;
    const body = s.cloth, skin = s.skin, hair = s.hair || s.hood || ['#6a6a72', '#44444c', '#2a2a30'], pants = s.pants || body, boots = s.boots || pants;
    const ink = dk(hair[2], 0.45), eyeC = s.eyeGlow || s.eyes || '#2a1a1a', lum = (c) => { const a = rgb(c); return a[0] * 0.3 + a[1] * 0.59 + a[2] * 0.11; }, iris = lum(eyeC) < 70 ? (lum(hair[1]) > 150 ? '#4a8ad8' : lum(hair[1]) > 90 ? '#3a9a6a' : '#5a7ad0') : eyeC;
    const hemY = s.len === 'long' ? 62 : s.len === 'coat' ? 54 : s.len === 'short' ? 49 : 0;
    const wide = (s.wide | 0) + (s.broad | 0) * 2, step = f === 1 ? 1 : f === 2 ? -1 : 0, bob = f ? -1 : 0;
    const front = dir === 0, back = dir === 1, side = dir === 2;
    const cx = side ? 19 : CX - 0, torsoHW = (side ? 5 : 6) + Math.ceil(wide / 2);
    const top = 28 + bob, waist = 46 + bob, floatF = !!s.float;
    const taller = (s.stretch | 0);   // taller people get a longer torso
    const legTop = waist + 1;

    /* ---- cape behind ---- */
    if (s.cape && !back) {
      const end = Math.min(66, Math.round((s.capeLen || 22) * 2.1) + 4);
      R.trap(cx - (side ? 3 : 0), top + 1, end, torsoHW + 1, torsoHW + 4, s.cape, -step);
    }
    /* ---- legs & boots ---- */
    if (!floatF && !hemY || (!floatF && hemY < 62)) {
      const lw = 5, gap = side ? 0 : 2;
      const legs = side
        ? [[cx - 3 + step * 3, step > 0 ? 0 : 0], [cx + 1 - step * 3, 0]]
        : [[cx - gap - lw, step === 1 ? -3 : 0], [cx + gap, step === 2 ? -3 : 0]];
      legs.forEach((L, i) => {
        const x0 = Math.round(L[0]), lift = L[1], y1 = FEET - OY - 8 + (lift < 0 ? lift : 0) + 8 - 2;
        rect(x0, legTop, x0 + lw - 1, y1 - 5, pants, 2);
        rect(x0 - (side ? 0 : 0), y1 - 5, x0 + lw, y1 + 1, boots, 2);           // boot
        if (lift === 0 || true) { set(x0 + lw, y1 + 1, boots[2]); }
        R.set(x0, y1 - 5, boots[0]); R.set(x0 + 1, y1 - 5, boots[0]);
      });
    }
    /* ---- skirt / robe / tunic / coat ---- */
    if (hemY) {
      const a = torsoHW - 1, b = torsoHW + (s.len === 'long' ? 5 : 3) + wide * 0.5;
      if (floatF) R.trap(cx, waist - 6, 64, a, 3.2, body, Math.sin(f * 2.2) * 2);
      else R.trap(cx, waist - 6, hemY + bob, a, b, body, step * (s.len === 'long' ? 1.5 : 0.6));
      if (s.trim && !floatF) { for (let x = cx - Math.ceil(b) - 1; x <= cx + Math.ceil(b) + 1; x++) if (R.has(x, hemY + bob)) { set(x, hemY + bob, s.trim[1]); if (R.has(x, hemY + bob - 1)) set(x, hemY + bob - 1, s.trim[0]); } }
      if (s.len === 'long' && !floatF && !front) { /* hem hides feet from behind */ }
    }
    /* ---- torso ---- */
    if (!hemY) { /* short tunic already covers; keep waist block */ }
    R.rect(cx - 2, top - 3, cx + 1, top + 2, [skin[1], skin[1], skin[2]], 1);
    R.rect(cx - torsoHW, top + 1, cx + torsoHW - 1, waist, body, 3);
    for (let y = waist - 8; y <= waist; y++) { set(cx - torsoHW + 4, y, body[2]); set(cx + torsoHW - 5, y, body[2]); }
    if (!side) { /* chest cel line + collar V */ for (let y = top + 2; y <= top + 6; y++) set(cx - 1, y, body[2]); }
    if (s.under && front) { rect(cx - 2, top, cx + 1, top + 5, [s.under, s.under, dk(s.under, 0.8)], 1); }
    if (s.apron && !back) rect(cx - 5, waist - 6, cx + 4, Math.min(58, hemY ? hemY - 2 : waist + 4) + bob, s.apron, 2);
    if (s.shawl) { R.trap(cx, top, top + 9, torsoHW + 1, torsoHW - 3, s.shawl, 0); }
    if (s.belt && !back) {
      for (let x = cx - torsoHW; x < cx + torsoHW; x++) { set(x, waist - 3, s.belt[0]); set(x, waist - 2, s.belt[1]); set(x, waist - 1, s.belt[2]); }
      if (s.buckle && front) { rect(cx - 2, waist - 4, cx + 1, waist, [s.buckle, s.buckle, dk(s.buckle, 0.7)], 1); set(cx - 1, waist - 2, s.belt[2]); set(cx, waist - 2, s.belt[2]); }
      if (s.pouch && !back) rect(cx + torsoHW - 5, waist - 2, cx + torsoHW - 1, waist + 4, s.pouch, 1);
    }
    if (s.clasp && front) { rect(cx - 5, top + 10, cx + 4, top + 12, s.cuff || body, 1); }
    /* ---- arms ---- */
    function arm(ax, swing, which) {
      const y0 = top + 3, len = 17, ay = y0 + swing;
      const sleeve = s.bell ? 4 : 3;
      rect(ax, y0 + (swing < 0 ? swing : 0), ax + sleeve, y0 + len - 4 + Math.max(0, swing), body, 1);
      for (let y = y0; y < y0 + len - 4; y++) set(which === 'L' ? ax + sleeve : ax, y + (swing < 0 ? swing : 0) * 0, dk(body[2], 0.8));
      if (s.cuff) { rect(ax - (s.bell ? 1 : 0), y0 + len - 5 + swing, ax + sleeve + (s.bell ? 1 : 0), y0 + len - 3 + swing, s.cuff, 1); }
      ell(ax + 1.5, y0 + len - 1 + swing, 2.4, 2.4, skin, null, true);
      if (s.pauldron && which === 'L') ell(ax + 1, y0 - 1, 4.5, 3.3, s.pauldron);
    }
    if (front) { arm(cx - torsoHW - 3, -step * 2, 'L'); arm(cx + torsoHW - 1, step * 2, 'R'); }
    else if (back) { arm(cx - torsoHW - 3, step * 2, 'L'); arm(cx + torsoHW - 1, -step * 2, 'R'); }
    else if (pose === 'wind') { rect(cx + 8, top - 9, cx + 11, top + 5, body, 1); ell(cx + 9.5, top - 10, 2.6, 2.6, skin, null, true); }
    else if (pose === 'lunge') { rect(cx + 2, top + 3, cx + 13, top + 6, body, 1); ell(cx + 14.5, top + 4.5, 2.6, 2.6, skin, null, true); }
    else { /* side: one near arm swings front/back */ arm(cx - 2 + step * 4, 0, 'L'); }
    if (s.shield && !back) { const sx = side ? cx + 2 : cx - torsoHW - 7; rect(sx, top + 4, sx + 8, top + 19, s.shield, 2); for (let y = top + 6; y < top + 17; y++) set(sx + 4, y, s.shield[0]); for (let x = sx + 1; x < sx + 8; x++) set(x, top + 11, s.shield[0]); }
    if (s.scarf && !back) {
      for (let x = cx - 7; x <= cx + 6; x++) for (let y = top - 1; y <= top + 2; y++) { const dy = y - (top - 1); if (dy === 0 && (x < cx - 5 || x > cx + 4)) continue; set(x, y, dy === 0 ? s.scarf[0] : dy === 3 ? s.scarf[2] : s.scarf[1]); }
      if (s.scarfTail) rect(cx + 3, top + 2, cx + 6, top + 11 + (f ? 1 : 0), s.scarf, 1);
    }
    if (s.staff) { const sx = front ? cx + torsoHW + 4 : back ? cx - torsoHW - 4 : cx + 7; for (let y = 8; y <= FEET - OY; y++) { set(sx, y, s.staff[y % 7 === 0 ? 0 : 1]); set(sx + 1, y, s.staff[2]); }
      if (s.spear) { for (let k = 0; k < 7; k++) { set(sx, 8 - k, '#e8ecf4'); set(sx + 1, 8 - k, '#8e96a8'); } set(sx - 1, 4, '#e8ecf4'); set(sx + 2, 4, '#8e96a8'); }
      else { ell(sx + 0.5, 6, 2, 2, s.staff); } }

    /* ---- head ---- */
    const hcy = 15 + bob, hrx = 11.5, hry = 11.3, hx = side ? cx + 1 : cx;
    /* long / braid hair behind the head */
    const longBack = s.style === 'long' || s.style === 'braid' || s.style === 'bun';
    if (longBack && (back || side || front)) {
      const hl = Math.round((s.hairLen || 20) * 1.35) + 4;
      if (s.style === 'long') R.trap(hx + (side ? -3 : 0), hcy + 4, hcy + hl, 10, 11, hair, 0);
      if (s.style === 'braid') { for (let y = hcy + 6; y < hcy + 26; y++) { const wv = Math.round(Math.sin(y * 0.8) * 1.2), bx = side ? hx - 11 + wv : hx - 12 + wv; ell(bx + 1, y, 2.5, 1.6, hair); } }
    }
    ell(hx, hcy, hrx, hry, skin, null, true);
    if (side) { set(hx + 11, hcy + 2, skin[1]); set(hx + 12, hcy + 3, skin[1]); set(hx + 11, hcy + 3, skin[1]); }   // nose
    if (s.style === 'helm') {
      ell(hx, hcy - 1, 12, 11.8, s.helm, (x, y) => y < hcy + 11);
      if (front) { rect(hx - 9, hcy + 2, hx + 8, hcy + 6, ['#0c0a10', '#0c0a10', '#0c0a10'], 0); set(hx - 5, hcy + 4, s.eyes || '#ffb050'); set(hx - 4, hcy + 4, s.eyes || '#ffb050'); set(hx + 4, hcy + 4, s.eyes || '#ffb050'); set(hx + 3, hcy + 4, s.eyes || '#ffb050'); for (let y = hcy + 7; y < hcy + 11; y++) set(hx, y, s.helm[2]); }
      if (side) rect(hx + 1, hcy + 2, hx + 11, hcy + 6, ['#0c0a10', '#0c0a10', '#0c0a10'], 0), set(hx + 8, hcy + 4, s.eyes || '#ffb050'), set(hx + 7, hcy + 4, s.eyes || '#ffb050');
      if (s.plume) { ell(hx, hcy - 13, 3, 5, s.plume); for (let k = 0; k < 9; k++) { const px = hx + (side ? -4 - k * 0.6 : 4 + k * 0.7); ell(px, hcy - 11 + k, 2, 1.6, s.plume); } }
    } else {
      /* hair / hood */
      if (s.style === 'hood') {
        ell(hx, hcy - 0.5, 13.5, 13, s.hood, (x, y) => !(front && ((x - hx) ** 2 / 81 + (y - (hcy + 2.5)) ** 2 / 72 < 1)) && !(side && x > hx + 2 && y > hcy - 4 && y < hcy + 10 && ((x - hx - 4) ** 2 / 64 + (y - (hcy + 2.5)) ** 2 / 72 < 1)));
        if (!back) { ell(hx + (side ? 4 : 0), hcy + 2.5, front ? 8 : 6, 8.5, [mixc(skin[1], s.hood[2], 0.2), skin[1], skin[2]], (x, y) => y > hcy - 5 && y < hcy + 11); }
        R.rect(hx - 12, hcy + 11, hx + 11, hcy + 14, s.hood, 2);
        if (s.mask && !back) { for (let y = hcy + 4; y <= hcy + 11; y++) for (let x = hx - 8; x <= hx + 8; x++) if (R.has(x, y) && !(side && x < hx - 2)) set(x, y, y > hcy + 8 ? s.mask[2] : y > hcy + 6 ? s.mask[1] : s.mask[0]); }
        if (s.horns) { for (let k = 0; k < 10; k++) { const t = s.horns[k < 4 ? 0 : k < 7 ? 1 : 2]; set(hx - 9 - Math.round(k * 0.5), hcy - 8 - k, t); set(hx - 8 - Math.round(k * 0.5), hcy - 8 - k, t); if (!side) { set(hx + 9 + Math.round(k * 0.5), hcy - 8 - k, t); set(hx + 8 + Math.round(k * 0.5), hcy - 8 - k, t); } } }
      } else if (s.style !== 'bald') {
        const fy = (x) => hcy - 4 + ((((x - hx) * 7) & 7) < 3 ? 4 : (((x - hx) * 5) & 3) === 0 ? 2 : 0) + (Math.abs(x - hx) < 3 ? 1 : 0);
        for (let y = hcy - 13; y <= hcy + 12; y++) for (let x = hx - 13; x <= hx + 13; x++) {
          const nx = (x - hx) / 12.6, ny = (y - (hcy - 1.4)) / 11.9, ang = Math.atan2(ny, nx), jag = 1 + 0.07 * Math.sin(ang * 6 + 1) + 0.04 * Math.sin(ang * 13); if (nx * nx + ny * ny > jag * jag) continue;
          let keep;
          if (back) keep = y < hcy + 9 || (nx * nx + ny * ny) < 0.9 && y < hcy + 11;
          else if (side) keep = x < hx - 1 ? y < hcy + 8 : y < fy(x) - 1 && x < hx + 10;
          else keep = y < fy(x) || (Math.abs(x - hx) > 9.2 && y < hcy + (s.style === 'long' || s.style === 'braid' ? 10 : 5));
          if (!keep) continue;
          const l = -nx * 0.6 - ny * 0.8, strand = ((x * 2 + y * 3) % 9) === 0 && l > 0.0;
          if (front && y >= fy(x) - 2 && y < fy(x) && !(Math.abs(x - hx) > 9.2)) { set(x, y, hair[2]); continue; }
          set(x, y, strand || l > 0.5 ? hair[0] : l < -0.2 || (y > hcy + 3 && !front) ? hair[2] : hair[1]);
        }
        if (s.style === 'bun') { ell(hx + (side ? -6 : 0), hcy - 14, 5.5, 4.5, hair); }
        if (s.style === 'short' && !back) { set(hx, hcy - 5, hair[0]); set(hx + 1, hcy - 5, hair[0]); }
      }
      /* face */
      if (front) {
        const ew = 4, eh = s.bigEyes ? 7 : 6;
        [hx - 8, hx + 4].forEach((ex, i) => {
          if (s.style === 'hood' && s.mask) { /* mask: eyes only glow */ for (let y = 0; y < 3; y++) for (let x = 0; x < ew; x++) set(ex + x, hcy + 2 + y, y === 1 ? iris : '#12080c'); return; }
          for (let y = 0; y < eh; y++) for (let x = 0; x < ew; x++) {
            let c = iris; if (y === 0) c = ink; else if (y === eh - 1) c = dk(typeof iris === 'string' ? iris : '#222', 0.6);
            else if (y === 1) c = dk(typeof iris === 'string' ? iris : '#222', 0.55);
            set(ex + x, hcy + 1 + y, c);
          }
          set(ex + (i ? ew - 1 : 0), hcy + 2, ink); set(ex + (i ? 0 : ew - 1), hcy + 2, '#fff8f0'); set(ex + (i ? 1 : ew - 2), hcy + 3, '#ffffff'); set(ex + (i ? 2 : 1), hcy + eh, '#ffffff');
          if (s.eyeGlow) set(ex + 1, hcy + 1 + eh - 1, s.eyeGlow);
        });
        if (!s.mask) { set(hx, hcy + 8, skin[2]); set(hx - 1, hcy + 9, skin[2]); set(hx, hcy + 9, skin[2]); set(hx - 1, hcy + 10, mixc(skin[2], '#7a2a30', 0.5)); set(hx, hcy + 10, mixc(skin[2], '#7a2a30', 0.5)); }
        if (s.beard) { for (let y = hcy + 6; y <= hcy + 14; y++) for (let x = hx - 9; x <= hx + 9; x++) { if (!R.has(x, y)) continue; const jaw = y > hcy + 9, stache = y >= hcy + 8 && y <= hcy + 9 && Math.abs(x - hx) < 5 && Math.abs(x - hx) > 0, sideb = Math.abs(x - hx) > 7 && y > hcy + 5; if (jaw || stache || sideb) set(x, y, y > hcy + 12 ? hair[2] : hair[1]); } }
      } else if (side) {
        const ex = hx + 6; for (let y = 0; y < (s.bigEyes ? 6 : 5); y++) for (let x = 0; x < 3; x++) set(ex + x, hcy + 1 + y, y === 0 ? ink : iris);
        set(ex + 2, hcy + 2, '#fff8f0'); set(hx + 7, hcy + 9, mixc(skin[2], '#7a2a30', 0.5)); set(hx + 8, hcy + 9, mixc(skin[2], '#7a2a30', 0.5));
        if (s.beard) { for (let y = hcy + 7; y <= hcy + 13; y++) for (let x = hx - 2; x <= hx + 10; x++) if (R.has(x, y) && y > hcy + 8) set(x, y, hair[1]); }
      }
      /* hat */
      if (s.hat) {
        const by = hcy - 8;
        R.ell(hx, by + 1, 17, 4.2, s.hat);
        for (let x = hx - 15; x <= hx + 15; x++) if (R.has(x, by + 3)) set(x, by + 3, s.hatBand || s.hat[2]);
        for (let k = 0; k < 17; k++) { const hw = Math.max(1, 9 - k * 0.6), lean = Math.pow(k / 17, 2) * (side ? -6 : 7); for (let x = Math.round(hx - hw + lean); x <= Math.round(hx + hw + lean); x++) { const u = (x - (hx - hw + lean)) / (2 * hw); set(x, by - k, u < 0.2 ? s.hat[0] : u > 0.7 ? s.hat[2] : s.hat[1]); } }
        for (let x = hx - 9; x <= hx + 9; x++) { set(x, by - 1, s.hatBand || s.hat[2]); set(x, by - 2, s.hatBand || s.hat[2]); }
      }
    }
    /* ---- post: ghost fade, tatters ---- */
    if (floatF) { for (let y = 46; y < CH - OY; y++) for (let x = 0; x < CW; x++) { if (!R.has(x, y)) continue; const t = (y - 46) / 20; const i = (Math.round(y + OY) * CW + x) * 4; R.d[i + 3] = Math.round(255 * Math.max(0, 1 - t * 0.95)); if (R.d[i + 3] < 30) R.d[i + 3] = 0; } }
    if (s.tatter) { for (let x = 0; x < CW; x++) { const cut = (x * 5 + dir) % 4; for (let y = hemY - 1 + (0); y > hemY - 1 - cut; y--) R.clear(x, y + bob); } }
    if (s.rowEdit) editRows(R, s.rowEdit[0], s.rowEdit[1]);
    return R;
  }
  /* remove (n < 0) or repeat (n > 0) pixel rows from `at` down, keeping the feet where they were */
  function editRows(R, at, n) {
    const d = R.d, src = []; for (let y = 0; y < CH; y++) { src.push(y); if (n > 0 && y === at + OY) for (let k = 0; k < n; k++) src.push(y); }
    const keep = n < 0 ? src.filter((y) => y < at + OY || y >= at + OY - n) : src, off = n < 0 ? -n : -n, out = new Uint8ClampedArray(d.length);
    keep.forEach((sy, i) => { const dy = i + off; if (dy < 0 || dy >= CH) return; out.set(d.subarray(sy * CW * 4, (sy + 1) * CW * 4), dy * CW * 4); });
    d.set(out);
  }
  function mixHex(a, b, k) { const m = mixc(a, b, k); return '#' + m.map((v) => Math.round(v).toString(16).padStart(2, '0')).join(''); }
  function mixc(a, b, k) { const A = typeof a === 'string' ? rgb(a) : a, B = typeof b === 'string' ? rgb(b) : b; return [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k]; }

  /* coloured outline: a dark shade of the neighbouring fill colour */
  function outline(R, color) {
    const d = R.d, out = new Uint8ClampedArray(d), oc = color ? rgb(color) : null;
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
      const i = (y * CW + x) * 4; if (d[i + 3]) continue;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || ny < 0 || nx >= CW || ny >= CH) continue; const j = (ny * CW + nx) * 4;
        if (d[j + 3] > 160) { const c = oc || [d[j] * 0.3 + 10, d[j + 1] * 0.26 + 6, d[j + 2] * 0.34 + 18]; out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2]; out[i + 3] = d[j + 3] < 255 ? d[j + 3] : 255; break; }
      }
    }
    d.set(out);
  }
  function toSprite(R, spec) {
    outline(R, spec.outline);
    const c = U.makeCanvas(CW, CH), g = c.getContext('2d'); g.putImageData(new ImageData(R.d, CW, CH), 0, 0);
    return { c, w: CW / 2, h: CH / 2, ax: CX / 2, ay: (FEET + 1) / 2, hi: true, _sil: {}, _flip: null };
  }
  function build2(spec) {
    const out = { down: [], up: [], side: [], spec, hi: true };
    ['down', 'up', 'side'].forEach((n, di) => { for (let f = 0; f < 3; f++) out[n].push(toSprite(figure(spec, di, f), spec)); });
    return out;
  }
  Art.build2 = build2;
  /* ---- enemies: the humanoids are redrawn in the same style (side view; the game flips them) ---- */
  function pose(spec, f, ps) { return toSprite(figure(spec, 2, f, ps), spec); }
  const WRETCH = { skin: ['#9aaa84', '#76865f', '#4e5a40'], style: 'short', hair: ['#6a6a60', '#46463e', '#2a2a24'], wide: 2, eyes: '#ff4a3a', eyeGlow: '#ff4a3a', bigEyes: true, cloth: ['#7a6e60', '#58504a', '#3a342e'], len: 'short', tatter: true,
    pants: ['#4a4036', '#352d26', '#231e19'], boots: ['#3a3028', '#2a221c', '#1a1612'], belt: ['#5a4a38', '#3e3224', '#2a2118'], outline: '#1a1a14', rowEdit: [36, -3] };
  Art.wretch = { walk: [pose(WRETCH, 1), pose(WRETCH, 0), pose(WRETCH, 2), pose(WRETCH, 0)], wind: pose(WRETCH, 0, 'wind'), lunge: pose(WRETCH, 0, 'lunge'), stand: pose(WRETCH, 0) };
  const SENT = { skin: ['#e0d8c0', '#b0a68a', '#706650'], style: 'helm', helm: ['#d8d0b8', '#a89c80', '#6a604c'], eyes: '#ff7a3a', plume: null, broad: 1, cloth: ['#6a5a50', '#4a3e38', '#2e2622'], len: 'short', tatter: true,
    pants: ['#4a3e34', '#33291f', '#221b14'], boots: ['#3a3028', '#2a221c', '#1a1612'], pauldron: ['#a8b0c4', '#727c94', '#4a5268'], belt: ['#4a3a30', '#33271f', '#221914'], shield: ['#7a8aa8', '#56658a', '#3a4562'], outline: '#14141c', rowEdit: [34, 3] };
  Art.sentinel = { walk: [pose(SENT, 1), pose(SENT, 0), pose(SENT, 2), pose(SENT, 0)], stand: pose(SENT, 0), slam: pose(SENT, 0, 'wind') };
  const old = { hero: Art.hero, npc: Object.assign({}, Art.npc) };
  if (Art.hero && Art.hero.spec) Art.hero = build2(Art.hero.spec);
  Object.keys(old.npc).forEach((k) => { const o = old.npc[k]; if (o && o.spec) Art.npc[k] = build2(o.spec); });
  Art.classic = old;
})();

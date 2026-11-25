/* Ashen Hollow - character and creature art. Robed figures are composed from hand-drawn pixel
   grids (head / body / feet); creatures are painted from shaded volumes then hand-detailed. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, S = AH.Sprites;
  const Art = (AH.Art = { npc: {} });

  /* ------------------------------------------------------------ people
     Figures are painted from anatomy (head, neck, shoulders, a nipped waist, swinging limbs) rather than
     stamped from a block, so the silhouettes are slim and each person reads at a glance. Lit from the top-left. */
  const rgb = (h) => U.hex(h);
  const toHex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (h, t, k) => { const a = rgb(h), b = rgb(t); return toHex([U.lerp(a[0], b[0], k), U.lerp(a[1], b[1], k), U.lerp(a[2], b[2], k)]); };
  const tones = (h) => [mix(h, '#ffffff', 0.22), h, mix(h, '#0a0812', 0.42)];

  function figure(s, dir, f) {
    const P = S.painter(18, 30);
    const px = (x, y, c) => P.px(x, y, c);
    const span = (y, x0, x1, c) => { for (let x = x0; x <= x1; x++) px(x, y, x1 - x0 >= 2 ? (x === x0 ? c[0] : x === x1 ? c[2] : c[1]) : x1 === x0 ? c[1] : x === x0 ? c[0] : c[2]); };
    const b0 = s.broad | 0, hem = s.len === 'long' ? 26 : s.len === 'coat' ? 24 : s.len === 'short' ? 22 : 0;
    const lift1 = f === 1 ? 1 : 0, lift2 = f === 2 ? 1 : 0;
    const sw = f === 1 ? 1 : f === 2 ? -1 : 0;
    const body = s.cloth, skin = s.skin, hair = s.hair, bob = f ? 0 : 0;

    /* ---------------------------------------------------- shared head parts */
    const hatDraw = (side) => {
      const h = s.hat; if (!h) return;
      const x0 = side ? 3 : 3, x1 = side ? 14 : 14;
      span(5, x0, x1, h); span(6, x0 + 1, x1 - 1, [h[1], h[2], h[2]]);
      const cone = [[7, 10], [7, 10], [8, 9]];
      span(4, 6, 11, h); span(3, 7, 10, h); span(2, 7, 10, h); span(1, 8, 10, h); px(10, 0, h[1]); px(11, 0, h[0]); px(11, 1, h[1]);
      if (s.hatBand) { span(4, 6, 11, s.hatBand); }
    };

    if (dir === 0) {
      /* back layers */
      if (s.cape) for (let y = 12; y <= (s.capeLen || hem) + 1; y++) { const x0 = y < 14 ? 4 : y < 18 ? 3 : 3 - (y > 22 ? 1 : 0); span(y, x0, 17 - x0, s.cape); }
      if (s.style === 'long') for (let y = 8; y <= (s.hairLen || 17); y++) { const w = y > 14 ? 1 : 2; span(y, 4, 4 + w - 1 + 1, hair); span(y, 13 - w, 13, hair); }
      /* legs */
      const legTop = hem ? Math.max(hem - 1, 20) : 19;
      [[6, 7, 5, lift1], [10, 11, 12, lift2]].forEach((L) => {
        const base = 27 - L[3];
        for (let y = legTop; y <= base - 2; y++) span(y, L[0], L[1], s.pants);
        span(base - 1, Math.min(L[0], L[2]), Math.max(L[1], L[2]) + (L[2] > 8 ? 0 : 0), s.boots); span(base, Math.min(L[0], L[2]) - (L[2] < 8 ? 0 : 0), Math.max(L[1], L[2]), [s.boots[1], s.boots[2], s.boots[2]]);
      });
      /* coat / robe */
      if (hem) for (let y = 18; y <= hem; y++) {
        const x0 = (y < 19 ? 6 : y < 21 ? 5 : s.len === 'long' && y >= 23 ? 3 : 4) - (y >= 19 ? (s.wide | 0) : 0);
        span(y, x0, 17 - x0, body);
        if (y >= 19 && s.len !== 'short') px(9, y, body[2]);
        if (y === hem && s.trim) span(y, x0, 17 - x0, s.trim);
        if (y === hem - 1 && s.trim2) span(y, x0, 17 - x0, s.trim2);
      }
      if (s.apron) for (let y = 17; y <= hem - 1; y++) span(y, 7, 10, s.apron);
      /* torso */
      for (let y = 12; y <= 17; y++) span(y, 6 - b0, 11 + b0, body);
      if (s.under) { px(8, 12, s.under); px(9, 12, s.under); px(8, 13, s.under); }
      if (s.belt) { span(17, 6 - b0, 11 + b0, s.belt); px(8, 17, s.buckle); px(9, 17, s.buckle); if (s.pouch) { span(17, 11, 12, s.pouch); span(18, 11, 12, s.pouch); } }
      if (s.sash) { for (let i = 0; i < 6; i++) px(6 + i, 12 + i, s.sash[1]); }
      /* arms */
      [[4 - b0, 5 - b0, sw], [12 + b0, 13 + b0, -sw]].forEach((A) => {
        for (let y = 12 + A[2]; y <= 18 + A[2]; y++) span(y, A[0], A[1], body);
        if (s.cuff) span(18 + A[2], A[0], A[1], s.cuff);
        px(A[0], 19 + A[2], skin[1]); px(A[1], 19 + A[2], skin[2]); px(A[0], 20 + A[2], skin[2]);
      });
      /* collar / scarf */
      if (s.scarf) { span(11, 6, 11, s.scarf); span(12, 6, 11, s.scarf); if (s.scarfTail) { for (let y = 13; y <= 19; y++) { px(11, y, s.scarf[1]); px(12, y, s.scarf[2]); } px(11, 20, s.scarf[2]); } }
      else { span(11, 7, 10, skin); }
      /* head */
      extras(0);
      head(0);
    } else if (dir === 1) {
      /* back */
      [[6, 7, 5, lift1], [10, 11, 12, lift2]].forEach((L) => {
        const base = 27 - L[3], legTop = hem ? Math.max(hem - 1, 20) : 19;
        for (let y = legTop; y <= base - 2; y++) span(y, L[0], L[1], s.pants);
        span(base - 1, Math.min(L[0], L[2]), Math.max(L[1], L[2]), s.boots); span(base, Math.min(L[0], L[2]), Math.max(L[1], L[2]), [s.boots[1], s.boots[2], s.boots[2]]);
      });
      if (hem) for (let y = 18; y <= hem; y++) {
        const x0 = (y < 19 ? 6 : y < 21 ? 5 : s.len === 'long' && y >= 23 ? 3 : 4) - (y >= 19 ? (s.wide | 0) : 0);
        span(y, x0, 17 - x0, body); if (y === hem && s.trim) span(y, x0, 17 - x0, s.trim);
      }
      for (let y = 12; y <= 17; y++) span(y, 6 - b0, 11 + b0, body);
      if (s.belt) span(17, 6 - b0, 11 + b0, s.belt);
      [[4 - b0, 5 - b0, sw], [12 + b0, 13 + b0, -sw]].forEach((A) => { for (let y = 12 + A[2]; y <= 18 + A[2]; y++) span(y, A[0], A[1], body); px(A[0], 19 + A[2], skin[1]); px(A[1], 19 + A[2], skin[2]); });
      if (s.cape) { for (let y = 12; y <= (s.capeLen || hem) + 1; y++) { const x0 = y < 14 ? 4 : y < 18 ? 3 : 3 - (y > 22 ? 1 : 0); span(y, x0, 17 - x0, s.cape); }
        for (let y = 14; y <= (s.capeLen || hem); y += 3) { px(8, y, s.cape[2]); px(9, y + 1, s.cape[2]); } if (s.trim) span((s.capeLen || hem) + 1, 3, 14, s.trim); }
      if (s.style === 'long') { for (let y = 9; y <= (s.hairLen || 17); y++) span(y, y > 14 ? 6 : 5, y > 14 ? 11 : 12, hair); }
      if (s.scarf) { span(11, 6, 11, s.scarf); span(12, 6, 11, s.scarf); if (s.scarfTail) { for (let y = 13; y <= 20; y++) { px(6, y, s.scarf[1]); px(5, y, s.scarf[0]); } } }
      extras(1);
      head(1);
    } else {
      /* side, facing right */
      const sp = f === 0 ? 0 : 3, d1 = f === 1 ? sp : f === 2 ? -sp : 0;
      const legTop = hem ? Math.max(hem - 1, 20) : 19;
      const backArm = () => { const hx = 8 - sw * 2; P.limb(9, 13, hx + 1, 19, 2, 2, s.cloth ? s.cloth[2] : '#222'); px(hx + 1, 20, skin[2]); };
      if (s.cape) { for (let y = 12; y <= (s.capeLen || hem) + 1; y++) { const x0 = 4 - (y > 16 ? 2 : 1) - (y > 22 ? 1 : 0) + (f ? (y > 18 ? 0 : 0) : 0); span(y, x0, 9 + (y < 14 ? 0 : -1), s.cape); } }
      if (s.style === 'long') for (let y = 8; y <= (s.hairLen || 16); y++) span(y, 4 - (y > 11 ? 1 : 0), 6, hair);
      /* back leg then front leg */
      const leg = (hx, fx, lift, dim) => {
        const base = 27 - lift, c = dim ? [s.pants[2], s.pants[2], s.pants[2]] : s.pants;
        P.limb(hx, legTop, fx, base - 2, 2, 2, c[1]); px(hx, legTop, c[0]);
        const bc = dim ? [s.boots[2], s.boots[2], s.boots[2]] : s.boots;
        span(base - 1, fx - 1, fx + 1, bc); span(base, fx - 1, fx + 2, [bc[1], bc[2], bc[2]]);
      };
      backArm();
      leg(8, 8 - d1, f === 1 ? 0 : f === 2 ? 1 : 0, true);
      leg(9, 9 + d1, f === 2 ? 0 : f === 1 ? 1 : 0, false);
      if (hem) for (let y = 18; y <= hem; y++) {
        const fl = Math.max(0, y - 18) * (s.len === 'long' ? 0.5 : 0.4) | 0;
        const sh = f ? (f === 1 ? -1 : 1) * (y > 20 ? 1 : 0) : 0;
        span(y, 6 - fl + sh, 11 + (fl >> 1) + sh, body);
        if (y === hem && s.trim) span(y, 6 - fl + sh, 11 + (fl >> 1) + sh, s.trim);
      }
      if (s.apron) for (let y = 17; y <= hem - 1; y++) span(y, 11, 12, s.apron);
      for (let y = 12; y <= 17; y++) span(y, 7, 11, body);
      if (s.belt) { span(17, 7, 11, s.belt); px(11, 17, s.buckle); if (s.pouch) { span(17, 6, 7, s.pouch); span(18, 6, 7, s.pouch); } }
      /* front arm */
      const fx = 9 + sw * 2; P.limb(9, 13, fx, 19, 2, 2, body[1]); px(9, 13, body[0]); px(10, 13, body[0]); px(fx, 20, skin[1]); px(fx + 1, 20, skin[0]);
      if (s.scarf) { span(11, 7, 11, s.scarf); span(12, 7, 11, s.scarf); if (s.scarfTail) { const fl = Math.round(Math.sin(f * 2.1) * 1); for (let i = 0; i < 6; i++) { px(6 - i + fl * (i > 2 ? 1 : 0), 12 + (i >> 1), s.scarf[i % 2 ? 2 : 1]); px(6 - i + fl * (i > 2 ? 1 : 0), 13 + (i >> 1), s.scarf[2]); } } }
      else span(11, 8, 10, skin);
      extras(2);
      head(2);
    }


    /* ------------------------------------------------ per-type features: what makes each kind of person read differently */
    function extras(d) {
      if (s.shawl) {
        const rows = d === 2 ? [[12, 7, 11], [13, 7, 10], [14, 7, 9], [15, 7, 8]] : [[12, 4, 13], [13, 5, 12], [14, 6, 11], [15, 7, 10], [16, 8, 9]];
        rows.forEach((r) => span(r[0], r[1], r[2], s.shawl));
        if (d === 0) { px(8, 17, s.shawl[2]); px(9, 17, s.shawl[2]); }
      }
      if (s.pauldron) {
        if (d === 0) { span(11, 4, 7, s.pauldron); span(12, 4, 6, s.pauldron); px(4, 13, s.pauldron[2]); px(5, 11, s.pauldron[0]); }
        else if (d === 1) { span(11, 10, 13, s.pauldron); span(12, 11, 13, s.pauldron); px(13, 13, s.pauldron[2]); }
        else { span(11, 8, 11, s.pauldron); span(12, 8, 10, s.pauldron); px(8, 11, s.pauldron[0]); }
      }
      if (s.clasp && d === 0) {
        span(16, 5, 12, s.cuff || body); span(17, 6, 11, body); px(8, 17, skin[1]); px(9, 17, skin[2]); px(8, 18, skin[2]); px(9, 18, skin[2]);
      }
      if (s.bell && d !== 2) {
        [[3, sw, 1], [14, -sw, -1]].forEach((A) => { for (let y = 17; y <= 20; y++) px(A[0], y + A[1], y > 19 ? (s.trim || body)[1] : body[A[2] > 0 ? 0 : 2]); });
        if (s.trim) { span(20 + sw, 3, 5, s.trim); span(20 - sw, 12, 14, s.trim); }
      }
      if (s.staff) {
        const x = d === 1 ? 3 : d === 2 ? 13 : 14;
        for (let y = 9; y <= 26; y++) px(x, y, s.staff[y % 6 === 0 ? 0 : y % 6 === 3 ? 2 : 1]);
        if (s.spear) { px(x, 6, s.staff[0]); px(x, 5, s.staff[0]); px(x, 4, s.staff[0]); px(x - 1, 7, s.staff[1]); px(x + 1, 7, s.staff[1]); } else { px(x, 8, s.staff[0]); px(x, 7, s.staff[1]); px(x + (d === 2 ? 1 : 1), 6, s.staff[0]); }
      }
      if (s.tatter) {
        for (let x = 2; x <= 15; x++) { const cut = (x * 5 + (d ? 1 : 0)) % 3; P.g.clearRect(x, hem - cut + 1, 1, cut); }
      }
    }

    /* ---------------------------------------------------- head, drawn last per direction */
    function head(d) {
      const hair1 = hair, ff = s.floatY || 0;
      if (s.style === 'helm') {
        const m = s.helm, rows = d === 2 ? [[2, 7, 10], [3, 6, 11], [4, 5, 12], [5, 5, 12], [6, 5, 12], [7, 5, 12], [8, 5, 12], [9, 5, 12], [10, 6, 11]] : [[2, 7, 10], [3, 6, 11], [4, 5, 12], [5, 5, 12], [6, 5, 12], [7, 5, 12], [8, 5, 12], [9, 5, 12], [10, 6, 11]];
        rows.forEach((r) => span(r[0], r[1], r[2], m));
        if (d === 0) { span(7, 6, 11, ['#0c0a10', '#0c0a10', '#0c0a10']); px(7, 7, s.eyes || '#ffb050'); px(10, 7, s.eyes || '#ffb050'); for (let y = 8; y <= 10; y++) px(8, y, m[2]); px(9, 8, m[2]); span(5, 7, 10, [m[0], m[0], m[1]]); }
        else if (d === 2) { span(7, 9, 12, ['#0c0a10', '#0c0a10', '#0c0a10']); px(11, 7, s.eyes || '#ffb050'); px(13, 8, m[1]); px(13, 9, m[2]); }
        if (s.plume) { span(1, 8, 10, s.plume); span(0, 9, 10, s.plume); px(d === 2 ? 5 : 11, 1, s.plume[1]); px(d === 2 ? 4 : 12, 2, s.plume[2]); if (d === 2) { px(4, 3, s.plume[1]); px(4, 4, s.plume[2]); } }
        return;
      }
      if (d === 0) {
        const rows = [[3, 7, 10], [4, 6, 11], [5, 5, 12], [6, 5, 12], [7, 5, 12], [8, 5, 12], [9, 6, 11], [10, 7, 10]];
        rows.forEach((r) => span(r[0], r[1], r[2], skin));
        if (s.style === 'hood') {
          [[2, 7, 10], [3, 6, 11], [4, 5, 12], [5, 4, 13], [6, 4, 13], [7, 4, 13], [8, 4, 13], [9, 5, 12], [10, 5, 12]].forEach((r) => span(r[0], r[1], r[2], s.hood));
          for (let y = 6; y <= 10; y++) span(y, 6, 11, skin);
          span(5, 6, 11, [s.hood[2], s.hood[2], s.hood[2]]); span(6, 6, 11, [skin[1], skin[1], skin[2]].map((c, i) => (i === 0 ? mix(skin[1], s.hood[2], 0.45) : c)));
          if (s.mask) { for (let y = 6; y <= 10; y++) span(y, 6, 11, s.mask); }
          if (s.horns) { px(3, 5, s.horns[0]); px(3, 4, s.horns[0]); px(2, 3, s.horns[1]); px(14, 5, s.horns[2]); px(14, 4, s.horns[1]); px(15, 3, s.horns[2]); }
        } else if (s.style !== 'bald') {
          span(3, 7, 10, hair1); span(4, 6, 11, hair1); span(5, 5, 12, hair1);
          px(5, 6, hair1[1]); px(6, 6, hair1[0]); px(7, 6, hair1[1]); px(10, 6, hair1[1]); px(11, 6, hair1[1]); px(12, 6, hair1[2]);
          px(5, 7, hair1[1]); px(12, 7, hair1[2]);
          if (s.style === 'long') { px(5, 8, hair1[1]); px(12, 8, hair1[2]); }
          if (s.style === 'bun') { span(2, 7, 10, hair1); px(8, 1, hair1[0]); px(9, 1, hair1[1]); }
          if (s.style === 'short') { px(8, 6, hair1[0]); px(9, 6, hair1[1]); px(10, 5, hair1[0]); }
          if (s.style === 'braid') { px(5, 8, hair1[1]); px(4, 9, hair1[1]); px(4, 10, hair1[2]); px(4, 11, hair1[1]); px(12, 8, hair1[2]); }
        }
        const ec = s.eyes || '#17121a';
        if (s.bigEyes) { px(7, 7, ec); px(7, 8, ec); px(10, 7, ec); px(10, 8, ec); } else { px(7, 7, ec); px(10, 7, ec); }
        if (s.eyeGlow) { px(6, 7, s.eyeGlow); px(11, 7, s.eyeGlow); }
        if (!s.mask) { px(8, 9, skin[2]); px(9, 9, mix(skin[2], '#6a2a30', 0.35)); px(9, 8, skin[2]); }
        if (s.beard) { span(9, 6, 11, hair); span(10, 7, 10, [hair[1], hair[1], hair[2]]); px(8, 9, hair[2]); px(9, 9, hair[2]); px(7, 8, hair[1]); px(10, 8, hair[1]); }
        if (s.hat) hatDraw(false);
      } else if (d === 1) {
        [[3, 7, 10], [4, 6, 11], [5, 5, 12], [6, 5, 12], [7, 5, 12], [8, 5, 12], [9, 6, 11], [10, 7, 10]].forEach((r) => span(r[0], r[1], r[2], s.style === 'hood' ? s.hood : hair));
        if (s.style === 'hood') { span(2, 7, 10, s.hood); span(9, 5, 12, s.hood); span(10, 5, 12, s.hood); px(8, 5, s.hood[2]); px(9, 6, s.hood[2]); px(8, 8, s.hood[2]); if (s.horns) { px(3, 5, s.horns[0]); px(3, 4, s.horns[0]); px(2, 3, s.horns[1]); px(14, 5, s.horns[2]); px(14, 4, s.horns[1]); px(15, 3, s.horns[2]); } }
        else {
          px(8, 5, hair[2]); px(9, 6, hair[2]); px(7, 8, hair[2]); px(10, 9, hair[2]); px(6, 4, hair[0]); px(7, 5, hair[0]);
          if (s.style === 'bun') { span(2, 7, 10, hair); px(8, 1, hair[0]); px(9, 1, hair[1]); }
        }
        if (s.hat) hatDraw(false);
      } else {
        const rows = [[3, 6, 11], [4, 5, 12], [5, 5, 12], [6, 5, 12], [7, 5, 12], [8, 5, 12], [9, 6, 12], [10, 7, 11]];
        rows.forEach((r) => span(r[0], r[1], r[2], skin));
        px(13, 8, skin[1]); px(13, 7, skin[0]);
        if (s.style === 'hood') {
          [[2, 6, 10], [3, 5, 11], [4, 4, 11], [5, 4, 11], [6, 4, 10], [7, 4, 9], [8, 4, 9], [9, 4, 10], [10, 5, 10]].forEach((r) => span(r[0], r[1], r[2], s.hood));
          px(11, 5, s.hood[2]); px(12, 5, s.hood[2]); px(10, 6, s.hood[2]);
          if (s.mask) { for (let y = 6; y <= 10; y++) span(y, 10, 12, s.mask); px(13, 8, s.mask[1]); }
          if (s.horns) { px(5, 3, s.horns[0]); px(4, 2, s.horns[1]); px(3, 1, s.horns[2]); }
        } else if (s.style !== 'bald') {
          span(3, 6, 11, hair); span(4, 5, 12, hair); span(5, 5, 11, hair);
          span(6, 5, 9, hair); span(7, 5, 8, hair); span(8, 5, 7, hair); px(10, 6, hair[1]); px(11, 6, hair[0]); px(12, 5, hair[2]);
          if (s.style === 'bun') { px(5, 3, hair[0]); px(4, 3, hair[1]); px(4, 4, hair[1]); px(5, 2, hair[0]); }
          if (s.style === 'braid') { px(5, 9, hair[1]); px(4, 10, hair[1]); px(4, 11, hair[2]); px(4, 12, hair[1]); }
        }
        const ec = s.eyes || '#17121a'; px(11, 7, ec); if (s.eyeGlow) px(12, 7, s.eyeGlow);
        if (s.beard) { span(9, 9, 12, hair); span(10, 9, 11, [hair[1], hair[1], hair[2]]); px(13, 9, hair[1]); }
        if (s.hat) hatDraw(true);
      }
    }

    /* ---------------------------------------------------- floating figures: trade legs for a ragged, fading hem */
    return P;
  }

  function ghostify(P, f) {
    /* cut the legs away and taper the robe into wisps */
    const g = P.g, W = 18, H = 30, id = g.getImageData(0, 0, W, H), d = id.data;
    for (let y = 19; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4, t = (y - 19) / 9, cx = 8.5, wob = Math.sin(f * 2.1 + y * 0.9) * (1 + t * 1.3);
      const half = 5.8 - t * 3.8 + Math.sin(f * 1.7 + x * 1.3) * 0.7;
      if (Math.abs(x - cx - wob * 0.4) > half || y > 27 - (x % 3) * 1.2) d[i + 3] = 0;
      else if (t > 0.4) d[i + 3] = Math.round(255 * (1 - (t - 0.4) * 0.9));
    }
    g.putImageData(id, 0, 0); return P;
  }

  /* chibi proportions: head +2 rows tall, +1 col wide; torso -2 rows so stature is unchanged */
  function chibi(P) {
    const src = P.c, W = 18, H = 30, c = U.makeCanvas(W, H), g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const dupRows = [5, 8], cutRows = [14, 17]; let y2 = 0;
    for (let y = 0; y < H; y++) {
      if (cutRows.includes(y)) continue;
      const put = (dy) => {
        if (dy >= H) return;
        if (y <= 11) { g.drawImage(src, 0, y, 9, 1, 0, dy, 9, 1); g.drawImage(src, 8, y, 10, 1, 9, dy, 9, 1); }
        else g.drawImage(src, 0, y, W, 1, 0, dy, W, 1);
      };
      put(y2++);
      if (dupRows.includes(y)) put(y2++);
    }
    P.g.clearRect(0, 0, W, H); P.g.drawImage(c, 0, 0);
  }

  function build(spec) {
    const out = { down: [], up: [], side: [] };
    ['down', 'up', 'side'].forEach((d, di) => {
      for (let f = 0; f < 3; f++) {
        const P = figure(spec, di, f);
        if (!spec.noChibi) chibi(P);
        if (spec.float) ghostify(P, f);
        const spr = S.fromCanvas(restack(P.c, spec.stretch | 0), 9, 32);
        S.outline(spr, spec.outline);
        out[d].push(spr);
      }
    });
    return out;
  }
  /* body height: add (n > 0) or remove (n < 0) torso rows so each type has its own stature; feet stay on the ground */
  function restack(src, n) {
    const c = U.makeCanvas(18, 34), g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const top = 4 - n;
    g.drawImage(src, 0, 0, 18, 16, 0, top, 18, 16);
    for (let i = 0; i < n; i++) g.drawImage(src, 0, 15, 18, 1, 0, top + 16 + i, 18, 1);
    if (n < 0) g.clearRect(0, 20, 18, -n);
    g.drawImage(src, 0, 16, 18, 14, 0, 20, 18, 14);
    return c;
  }

  const SKIN = { fair: tones('#e8c8b0'), warm: tones('#d8a888'), tan: tones('#c68e6a'), pale: tones('#ecdcd4'), bone: tones('#e6dfcf'), ghost: tones('#d4e6f4') };
  const HERO = {
    skin: SKIN.fair, hair: ['#a8553a', '#7a3a28', '#4a2218'], style: 'braid', eyes: '#17121a', eyeGlow: '#6ad0ff', stretch: -1,
    cloth: ['#4a7088', '#2f4c60', '#1c2f3d'], len: 'long', trim: ['#6a5a3a', '#4a4028', '#33291a'], under: '#d8cdb8', pants: ['#3a3440', '#2a2630', '#1c1a22'], boots: ['#5a4636', '#3a2c22', '#241a14'],
    cape: ['#34406a', '#262f52', '#181d38'], capeLen: 23, scarf: ['#ffc060', '#e8962e', '#9a5a18'], scarfTail: true, belt: ['#6a4a30', '#4a3222', '#2e1e14'], buckle: '#f0c860', pouch: ['#7a5a38', '#5a4028', '#3a281a'], cuff: ['#8a6a40', '#6a5030', '#4a3620'],
  };
  Art.hero = build(HERO);
  Art.heroSpec = HERO;
  Art.npc.marta = build({
    stretch: -2, wide: 1, shawl: ['#5e8070', '#46634f', '#2f4638'], staff: ['#b08a5e', '#7e5c3a', '#4c3622'],
    skin: SKIN.warm, hair: ['#f0ece4', '#c4c0b4', '#868278'], style: 'bun', cloth: ['#9a6e84', '#75546a', '#4c3547'], len: 'long', trim: ['#6a5a3a', '#4a3e28', '#33291a'], pants: ['#3a2a30', '#2a1e24', '#1c1418'], boots: ['#4a3a30', '#32261e', '#20170f'],
    apron: ['#e0d4b4', '#c4b894', '#8c8268'], belt: ['#6a4a30', '#4a3222', '#2e1e14'], buckle: '#c8a850', under: '#d8cdb8', scarf: ['#7a8a5a', '#5a6a40', '#3a4a2a'], cuff: ['#d8cdb8', '#b8ad94', '#847a66'], eyes: '#2a1a1a',
  });
  Art.npc.vesna = build({
    stretch: 3, wide: 1, bell: true,
    skin: SKIN.pale, hair: ['#6a5488', '#3c2c54', '#22183a'], style: 'long', hairLen: 19, hat: ['#5a4482', '#3a2a5c', '#1f1634'], hatBand: ['#e8c460', '#b89038', '#7a5c20'],
    cloth: ['#7a58a4', '#58407e', '#3a2858'], len: 'long', trim: ['#e8c460', '#b89038', '#7a5c20'], pants: ['#2a2038', '#1c1428', '#120c1c'], boots: ['#3a2a48', '#281c34', '#1a1222'],
    scarf: ['#58c8a0', '#34987a', '#1e6450'], scarfTail: true, belt: ['#5a4030', '#3e2c20', '#281c14'], buckle: '#e8c460', eyes: '#e8b8ff', eyeGlow: '#b070ff', cuff: ['#e8c460', '#b89038', '#7a5c20'],
  });
  Art.npc.aldric = build({
    stretch: 2, clasp: true,
    skin: tones('#eef6fc'), hair: ['#f4f8fc', '#d0deea', '#98aec2'], style: 'hood', hood: ['#9db2c8', '#7890aa', '#52687f'], cloth: ['#c8d8e8', '#9fb4c8', '#6f869c'], len: 'long', trim: ['#e8f2fa', '#b8cadb', '#8aa2b8'],
    pants: ['#9fb4c8', '#8aa0b4', '#6f869c'], boots: ['#9fb4c8', '#8aa0b4', '#6f869c'], belt: ['#8aa2b8', '#6f869c', '#566c82'], buckle: '#f4f8fc', eyes: '#2a4058', cuff: ['#e8f2fa', '#b8cadb', '#8aa2b8'], float: true, outline: '#3a4a60',
  });
  Art.npc.wren = build({
    skin: SKIN.fair, hair: ['#f8e4a8', '#dcb870', '#a88444'], style: 'braid', cloth: ['#c25a56', '#9a3e3e', '#662828'], len: 'short', trim: ['#e0c890', '#b89c60', '#806c3c'], pants: ['#5a4030', '#3e2c20', '#281c14'], boots: ['#4a3a30', '#32261e', '#20170f'],
    belt: ['#e0c890', '#b89c60', '#806c3c'], buckle: '#f0e0a0', bigEyes: true, eyes: '#2a1a1a', cape: ['#9a3e3e', '#7a2c2c', '#521c1c'], capeLen: 20, stretch: -3, wide: 1,
  });
  Art.npc.hexcaller = build({
    stretch: 2, bell: true, tatter: true,
    skin: SKIN.bone, mask: ['#f0e8d8', '#cfc6b2', '#8e846e'], style: 'hood', hood: ['#8a2c40', '#5e1c2c', '#38101a'], horns: ['#e8e0cc', '#b8ae96', '#7c735e'], eyes: '#ff4a3a', eyeGlow: '#7a1010',
    cloth: ['#8a2c40', '#5e1c2c', '#38101a'], len: 'long', trim: ['#d8b050', '#a88030', '#6c5018'], pants: ['#20101a', '#180c14', '#10080c'], boots: ['#20181c', '#181014', '#100a0c'], belt: ['#d8b050', '#a88030', '#6c5018'], buckle: '#ffe090', cape: ['#5e1c2c', '#451420', '#2c0c14'], capeLen: 24, cuff: ['#d8b050', '#a88030', '#6c5018'],
  });
  Art.npc.ghost = build({
    skin: SKIN.ghost, hair: ['#f4f8fc', '#d0deea', '#98aec2'], style: 'long', hairLen: 14, cloth: ['#c8d8e8', '#9fb4c8', '#6f869c'], len: 'long', pants: ['#9fb4c8', '#8aa0b4', '#6f869c'], boots: ['#9fb4c8', '#8aa0b4', '#6f869c'],
    eyes: '#2a4058', float: true, outline: '#3a4a60',
  });

  /* ------------------------------------------------------------ accessories */
  Art.lantern = S.frames(2, (i) => S.make([
    '..mm..', '.m..m.', '.mllm.', 'mlLLlm', 'mlLLlm', '.mllm.', '.mmmm.',
  ].map((r, y) => (i && y === 3 ? 'mlWLlm' : r)), { m: '#6a6a76', l: '#e8a040', L: '#fff0b0', W: '#ffffff' }, { ax: 3, ay: 0 }));
  Art.staff = S.make(['.mm.', 'mggm', 'mggm', '.mm.', '.kk.', '.kk.', '.kk.', '.kk.', '.kk.', '.kk.', '.kk.', '.kk.', '.kk.', '.kk.', '.kk.', '.kk.'], { m: '#7a7a84', g: '#c27be0', k: '#4a3828' }, { ax: 2, ay: 16 });
  Art.sickle = S.make(['..mmm.', '.mMMm.', 'mM.mm.', 'M.k...', '..k...', '..k...', '..k...'], { m: '#9aa0aa', M: '#d8dce4', k: '#5a4030' }, { ax: 2, ay: 7 });

  /* ------------------------------------------------------------ creature painter helpers */
  function ell(P, cx, cy, rx, ry, cols, seed, rough) {
    for (let y = Math.floor(-ry - 2); y <= ry + 2; y++) for (let x = Math.floor(-rx - 2); x <= rx + 2; x++) {
      const nx = x / (rx + 0.4), ny = y / (ry + 0.4), n = (U.noise((cx + x) * 0.8, (cy + y) * 0.8, seed || 3) - 0.5) * (rough === undefined ? 0.35 : rough);
      if (nx * nx + ny * ny + n <= 1) {
        const lit = -nx * 0.5 - ny * 0.85 + (U.hash(cx + x, cy + y, seed || 3) - 0.5) * 0.22;
        P.px(Math.round(cx + x), Math.round(cy + y), lit > 0.38 ? cols[0] : lit > -0.3 ? cols[1] : cols[2]);
      }
    }
  }
  function limb(P, x0, y0, x1, y1, t0, t1, cols) {
    P.limb(x0, y0, x1, y1, t0, t1, cols[2]);
    P.limb(x0 - 0.4, y0 - 0.5, x1 - 0.4, y1 - 0.5, Math.max(1, t0 - 1), Math.max(1, t1 - 1), cols[1]);
    if (t0 > 2) P.limb(x0 - 0.8, y0 - 1, x1 - 0.8, y1 - 1, 1, 1, cols[0]);
  }
  const finish = (P, ax, ay, ol) => S.outline(S.fromCanvas(P.c, ax, ay), ol);

  /* ---- Wretch: starved, hunched, long-armed ---- */
  const WC = ['#8d9c84', '#66745f', '#3c4639'], WB = '#b4bfa6', WR = '#5b4838';
  function wretch(pose) {
    const P = S.painter(26, 26);
    const lunge = pose === 'lunge', wind = pose === 'wind';
    const dx = lunge ? 3 : wind ? -2 : 0;
    const l1 = pose === 'walk1' ? [6, 4] : pose === 'walk2' ? [4, 7] : [5, 5];
    /* legs */
    limb(P, 10 + dx, 17, 10 - l1[0] + 5 + dx, 24, 3, 2, WC); limb(P, 12 + dx, 17, 12 + l1[1] - 3 + dx, 24, 3, 2, WC);
    P.rect(7 + (pose === 'walk1' ? 1 : 0) + dx, 24, 4, 1, '#2a2a26'); P.rect(11 + (pose === 'walk2' ? 1 : 0) + dx, 24, 4, 1, '#2a2a26');
    /* hump back + chest */
    ell(P, 8 + dx, 10, 6, 6, WC, 5); ell(P, 12 + dx, 14, 4, 5, WC, 6);
    /* ribs */
    for (let i = 0; i < 4; i++) P.line(11 + dx, 11 + i * 2, 14 + dx, 11 + i * 2, WB);
    /* rags */
    P.rect(8 + dx, 17, 6, 3, WR); P.px(9 + dx, 20, WR); P.px(12 + dx, 20, WR); P.rect(8 + dx, 17, 6, 1, '#7a6048');
    /* head */
    const hx = 16 + dx + (lunge ? 2 : 0), hy = 7 + (wind ? -1 : lunge ? 2 : 0);
    ell(P, hx, hy, 3.4, 3.4, WC, 9, 0.2);
    P.px(hx + 1, hy - 1, '#ff4a38'); P.px(hx + 2, hy - 1, '#ff4a38'); P.px(hx + 1, hy - 2, '#3a0a0a');
    P.rect(hx, hy + 1, 4, 2, '#2a1a1a'); for (let i = 0; i < 4; i += 1) P.px(hx + i, hy + 1, '#e6dec6');
    /* arms */
    const ax1 = wind ? 8 : lunge ? 24 : 19, ay1 = wind ? 8 : lunge ? 14 : 22;
    limb(P, 14 + dx, 11, ax1, ay1, 3, 2, WC);
    limb(P, 12 + dx, 12, ax1 - 4, ay1 - (lunge ? 0 : 1), 3, 2, WC);
    [[0, 0], [1, 1], [2, 0]].forEach((c) => P.px(ax1 + c[0] - 1, ay1 + 1 + c[1] - 1, '#d8d0b8'));
    return finish(P, 12, 25);
  }
  Art.wretch = { walk: [wretch('walk1'), wretch('stand'), wretch('walk2'), wretch('stand')], wind: wretch('wind'), lunge: wretch('lunge'), stand: wretch('stand') };

  /* ---- Hollow Hound: skeletal black dog with ember eyes ---- */
  const HC = ['#4c4c58', '#2b2b34', '#17171d'], HB = '#d8d0b8', HBD = '#9a927c';
  function hound(pose) {
    const P = S.painter(34, 22);
    const crouch = pose === 'crouch', air = pose === 'air', r1 = pose === 'run1', r2 = pose === 'run2';
    const by = crouch ? 14 : air ? 10 : 12, ox = air ? 1 : 0;
    /* far legs (dimmer) */
    const L = (x0, ph) => {
      let fx = x0 + ph, fy = 20;
      if (air) { fx = x0 + (x0 > 14 ? 4 : -4); fy = 15; }
      if (crouch) { fx = x0 + (x0 > 14 ? 1 : -1); fy = 20; }
      return [fx, fy];
    };
    const p1 = r1 ? 3 : r2 ? -3 : 0, p2 = r1 ? -3 : r2 ? 3 : 0;
    [[20, p1], [10, p2]].forEach((a) => { const f = L(a[0], a[1]); limb(P, a[0] + 1, by + 3, f[0], f[1], 3, 2, [HC[1], HC[2], HC[2]]); });
    ell(P, 14 + ox, by, 9, 4, HC, 11); ell(P, 21 + ox, by - 0, 5, 4.4, HC, 12); ell(P, 8 + ox, by + 0.5, 4.5, 4.2, HC, 13);
    for (let i = 0; i < 4; i++) { P.px(13 + i * 2 + ox, by - 1, HB); P.px(13 + i * 2 + ox, by, HBD); P.px(13 + i * 2 + ox, by + 1, HB); }
    [[19, p2], [9, p1]].forEach((a) => { const f = L(a[0], a[1]); limb(P, a[0], by + 3, f[0], f[1], 3, 2, HC); P.rect(f[0] - 1, f[1], 3, 1, HB); });
    /* tail */
    limb(P, 4 + ox, by - 1, crouch ? 0 : 1, by - (air ? 3 : 5), 3, 1, HC);
    /* neck + skull head */
    const hx = 27 + ox + (air ? 2 : 0), hy = by - (crouch ? 1 : 3);
    limb(P, 23 + ox, by - 2, hx - 1, hy, 5, 4, HC);
    ell(P, hx, hy, 3, 2.7, [HB, '#b6ad94', HBD], 17, 0.1);
    limb(P, hx + 2, hy + 1, hx + 6, hy + 2, 3, 2, [HB, '#b6ad94', HBD]);
    P.rect(hx + 3, hy + 3, 4, 1, '#1a1010'); for (let i = 0; i < 4; i += 2) P.px(hx + 3 + i, hy + 3, HB);
    P.px(hx + 1, hy - 1, '#ff8a3a'); P.px(hx + 2, hy - 1, '#ffd070');
    P.px(hx - 2, hy - 3, HC[1]); P.px(hx - 1, hy - 4, HC[1]); P.px(hx - 2, hy - 4, HC[2]); P.px(hx, hy - 4, HC[1]);
    return finish(P, 15, 20);
  }
  Art.hound = { run: [hound('run1'), hound('stand'), hound('run2'), hound('stand')], crouch: hound('crouch'), air: hound('air'), stand: hound('stand') };

  /* ---- Marsh wisp: cold drifting flame ---- */
  Art.wisp = S.frames(6, (i) => {
    const P = S.painter(16, 22), ph = (i / 6) * Math.PI * 2;
    for (let t = 0; t < 12; t++) {
      const y = 9 + t * 1, w = Math.max(0, 4.2 - t * 0.36), sway = Math.sin(ph + t * 0.6) * (1 + t * 0.12);
      for (let x = -5; x <= 5; x++) { const d = Math.abs(x - sway); if (d < w) P.px(Math.round(8 + x), y, d < w * 0.45 ? '#bff5df' : d < w * 0.8 ? '#6fd0b0' : '#2f7a72'); }
    }
    ell(P, 8, 8, 4.5, 4.7, ['#f2fff8', '#a4eed2', '#4eb8a0'], 21, 0.15);
    P.px(6, 7, '#0e3a38'); P.px(7, 7, '#0e3a38'); P.px(10, 7, '#0e3a38'); P.px(9, 7, '#0e3a38'); P.px(7, 10, '#0e3a38'); P.px(8, 10, '#0e3a38'); P.px(9, 10, '#0e3a38');
    return S.outline(S.fromCanvas(P.c, 8, 14), '#1a5a58');
  });

  /* ---- Bone sentinel: rusted armour over a skeleton, tower shield ---- */
  const BC = ['#e0d8c0', '#b0a68c', '#7a7260'], IC = ['#8a6a50', '#5e4636', '#3a2a22'], SH = ['#77808c', '#515a68', '#313845'];
  function sentinel(pose) {
    const P = S.painter(34, 36), a = pose === 'slam', w1 = pose === 'walk1' ? 2 : pose === 'walk2' ? -2 : 0;
    limb(P, 13, 25, 12 - w1, 34, 3, 2, BC); limb(P, 17, 25, 18 + w1, 34, 3, 2, BC);
    P.rect(9 - w1, 34, 5, 1, IC[2]); P.rect(16 + w1, 34, 5, 1, IC[2]);
    ell(P, 15, 22, 5, 3, IC, 31); ell(P, 15, 15, 5, 6.5, BC, 32);
    for (let i = 0; i < 4; i++) P.line(12, 11 + i * 2, 18, 11 + i * 2, '#6a634f');
    ell(P, 10, 10, 4, 3, IC, 33); ell(P, 20, 10, 4, 3, IC, 34);
    ell(P, 15, 5, 3.4, 3.6, BC, 35, 0.1); P.rect(13, 5, 5, 1, '#1a1210'); P.px(16, 5, '#ff7a3a'); P.px(14, 5, '#ff7a3a');
    P.rect(12, 1, 7, 2, IC[1]); P.px(15, 0, IC[0]);
    /* blade arm */
    if (a) { limb(P, 20, 11, 26, 2, 3, 2, BC); P.line(26, 1, 30, -2, '#a0a6b0'); P.line(27, 1, 28, 8 - 3, '#8a909a', 2); } else { limb(P, 20, 12, 26, 22, 3, 2, BC); limb(P, 26, 22, 28, 12, 2, 2, '#8a909a'.length ? [ '#c0c6ce', '#8a909a', '#5a606a'] : BC); }
    /* tower shield on the near (front/left) side */
    const sx = a ? 1 : 3;
    for (let y = 8; y < 29; y++) { const edge = y < 12 ? 2 + (12 - y) * 0 : y > 24 ? (y - 24) : 0; for (let x = sx + edge; x < sx + 9 - edge; x++) { const c = x < sx + 3 ? SH[0] : x < sx + 6 ? SH[1] : SH[2]; P.px(x, y, c); } }
    P.rect(sx + 3, 13, 3, 9, '#a8884a'); P.rect(sx + 2, 17, 5, 3, '#a8884a'); P.px(sx + 4, 18, '#4a3410');
    return finish(P, 15, 35);
  }
  Art.sentinel = { walk: [sentinel('walk1'), sentinel('stand'), sentinel('walk2'), sentinel('stand')], stand: sentinel('stand'), slam: sentinel('slam') };

  /* ---- Crow ---- */
  function crow(pose) {
    const P = S.painter(14, 12), C = ['#3a3a48', '#23232e', '#12121a'];
    ell(P, 6, 7, 3.4, 2.4, C, 41, 0.1); ell(P, 10, 5, 1.8, 1.8, C, 42, 0);
    P.px(12, 5, '#c8a860'); P.px(13, 5, '#c8a860'); P.px(10, 4, '#e8e0c8');
    if (pose === 'fly1') { P.line(5, 6, 2, 1, C[0], 2); P.line(7, 6, 10, 1, C[1], 2); } else if (pose === 'fly2') { P.line(5, 8, 2, 11, C[0], 2); P.line(7, 8, 10, 11, C[1], 2); } else { P.line(2, 7, 0, 8, C[1]); }
    if (pose === 'idle') { P.px(5, 10, '#6a5a4a'); P.px(8, 10, '#6a5a4a'); }
    return S.outline(S.fromCanvas(P.c, 6, 11), '#0a0a10');
  }
  Art.crow = { idle: crow('idle'), fly: [crow('fly1'), crow('fly2')] };

  /* ---- Choir wraith: drowned singer, hollow mouth ---- */
  Art.wraith = S.frames(4, (i) => {
    const P = S.painter(16, 24), ph = (i / 4) * Math.PI * 2;
    for (let y = 8; y < 22; y++) { const w = 4.5 - (y - 8) * 0.18, sw = Math.sin(ph + y * 0.5) * 1.6; for (let x = -6; x <= 6; x++) { const d = Math.abs(x - sw); if (d < w) P.px(Math.round(8 + x), y, d < w * 0.5 ? '#9fb4cc' : '#6a84a2'); } }
    ell(P, 8, 7, 4.2, 4.6, ['#e2edf8', '#aec2d8', '#7890ac'], 51, 0.2);
    P.rect(6, 6, 2, 2, '#14202e'); P.rect(9, 6, 2, 2, '#14202e'); P.rect(7, 9, 3, 3, '#14202e'); P.px(8, 12, '#14202e');
    return S.outline(S.fromCanvas(P.c, 8, 20), '#2a3a54');
  });

  /* ---- Weeping Choirmaster: an abbot grown into a great bronze bell ---- */
  function choirmaster(pose) {
    const P = S.painter(56, 72), BR = ['#c89a52', '#8e6a32', '#53391b'];
    const sway = pose === 'idle2' ? 1 : 0, raise = pose === 'raise', slam = pose === 'slam', kneel = pose === 'kneel';
    const top = kneel ? 22 : 14, bottom = 64;
    /* the bell */
    for (let y = top + 14; y < bottom; y++) {
      const t = (y - (top + 14)) / (bottom - top - 14), w = 9 + 17 * Math.pow(t, 0.8) + (t > 0.9 ? 2 : 0);
      for (let x = -w; x <= w; x++) {
        const nx = x / w, lit = -nx * 0.7 + (U.hash(x, y, 61) - 0.5) * 0.25;
        let col = lit > 0.35 ? BR[0] : lit > -0.3 ? BR[1] : BR[2];
        if (Math.abs(y - (bottom - 5)) <= 1 || Math.abs(y - (top + 26)) === 0) col = lit > 0 ? '#e0b868' : BR[0];
        P.px(Math.round(28 + x + sway * (t * 1.5)), y, col);
      }
    }
    /* verdigris + cracks */
    for (let i = 0; i < 40; i++) P.px(14 + Math.floor(U.hash(i, 1, 62) * 28), top + 24 + Math.floor(U.hash(i, 2, 62) * 34), '#4f6a54');
    P.line(30, top + 30, 33, top + 40, '#1a0f08'); P.line(33, top + 40, 31, top + 48, '#1a0f08'); P.line(31, top + 48, 35, top + 56, '#1a0f08');
    /* clapper mouth: a dark rim and the tolling tongue */
    ell(P, 28, bottom - 1, 15, 3, ['#241608', '#140c04', '#0a0602'], 63, 0); ell(P, 28 + sway * 2, bottom - 1, 3, 3, BR, 64);
    /* vestments over the bell shoulders */
    ell(P, 28, top + 16, 12, 8, ['#8a2e3c', '#5e1c28', '#3a0f18'], 65, 0.2);
    for (let x = 18; x <= 38; x += 2) P.px(x, top + 10 + (x % 4 ? 0 : 1), '#d8b05a');
    P.rect(26, top + 14, 4, 14, '#d8b05a'); P.rect(22, top + 19, 12, 3, '#d8b05a'); P.px(28, top + 20, '#3a0f18');
    /* arms */
    const ay = raise ? top - 6 : slam ? top + 28 : top + 22, ax = raise ? 8 : slam ? 8 : 10;
    limb(P, 18, top + 14, ax, ay, 5, 3, ['#bfb8aa', '#8a8478', '#575246']); limb(P, 38, top + 14, 56 - ax, ay, 5, 3, ['#bfb8aa', '#8a8478', '#575246']);
    P.rect(ax - 2, ay - 1, 4, 4, '#cfc6b0'); P.rect(56 - ax - 2, ay - 1, 4, 4, '#cfc6b0');
    /* head with weeping tracks */
    const hy = kneel ? top + 2 : top + 2;
    ell(P, 28, hy + 4, 6, 7, ['#e6e0d0', '#bdb6a2', '#827c6c'], 66, 0.15);
    P.rect(24, hy + 3, 3, 3, '#14101a'); P.rect(30, hy + 3, 3, 3, '#14101a'); P.px(25, hy + 4, '#c8e8ff'); P.px(31, hy + 4, '#c8e8ff');
    for (let t = 0; t < 7; t++) { P.px(25, hy + 6 + t, '#1a1620'); P.px(31, hy + 6 + t, '#1a1620'); }
    P.rect(26, hy + 9, 5, 3, '#1a1018'); P.px(28, hy + 12, '#1a1018');
    /* mitre */
    for (let y = 0; y < 14; y++) { const w = 1 + y * 0.55; for (let x = -w; x <= w; x++) P.px(Math.round(28 + x), hy - 12 + y, y < 2 ? '#e8c670' : Math.abs(x) < 1.2 ? '#e8c670' : x < 0 ? '#9a7ba8' : '#5a3a78'); }
    P.rect(21, hy - 1, 15, 2, '#d8b05a'); P.rect(27, hy - 10, 2, 5, '#fff0b0'); P.rect(26, hy - 8, 4, 1, '#fff0b0');
    return finish(P, 28, 66, '#120a0c');
  }
  Art.boss = { idle: [choirmaster('idle'), choirmaster('idle2')], raise: choirmaster('raise'), slam: choirmaster('slam'), kneel: choirmaster('kneel') };

  /* ---- Thorn stag (optional guardian) ---- */
  function stag(pose) {
    const P = S.painter(52, 42), C = ['#8a7a5c', '#5a4c38', '#32281c'], AN = ['#d8cdb0', '#9a8e72', '#5c5240'];
    const w = pose === 'walk1' ? 3 : pose === 'walk2' ? -3 : 0, paw = pose === 'paw';
    [[14, w], [30, -w]].forEach((a) => limb(P, a[0] + 2, 28, a[0] + a[1], 40, 3, 2, [C[1], C[2], C[2]]));
    ell(P, 20, 24, 13, 7, C, 71); ell(P, 30, 22, 6, 7, C, 72);
    [[12, -w], [28, w]].forEach((a) => { limb(P, a[0] + 2, 28, a[0] + a[1] - (a[0] > 20 && paw ? 4 : 0), a[0] > 20 && paw ? 34 : 40, 3, 2, C); });
    limb(P, 34, 18, 40, 10, 6, 4, C); ell(P, 43, 9, 4, 3.4, C, 73, 0.1); limb(P, 45, 10, 49, 13, 3, 2, C);
    P.px(43, 8, '#9affc8'); P.px(44, 8, '#e8fff0');
    /* antlers: rune-lit */
    const ant = (x, y, dir) => { limb(P, x, y, x + dir * 2, y - 8, 2, 2, AN); limb(P, x + dir * 2, y - 8, x + dir * 8, y - 14, 2, 1, AN); limb(P, x + dir * 1, y - 5, x + dir * 8, y - 6, 2, 1, AN); limb(P, x + dir * 3, y - 10, x + dir * 2, y - 17, 2, 1, AN); P.px(x + dir * 2, y - 8, '#9affc8'); P.px(x + dir * 8, y - 14, '#9affc8'); };
    ant(42, 7, 1); ant(41, 7, -1);
    /* moss + thorns on the back */
    for (let i = 0; i < 8; i++) { P.px(10 + i * 3, 17 + (i % 3), '#5a7a44'); P.line(10 + i * 3, 17, 10 + i * 3, 14 - (i % 2), '#4a3a28'); }
    P.line(6, 22, 2, 20, C[1], 2);
    return finish(P, 24, 40);
  }
  Art.stag = { walk: [stag('walk1'), stag('stand'), stag('walk2'), stag('stand')], stand: stag('stand'), paw: stag('paw') };

  /* ---- Thrall (raised dead) reuses the wretch body in a pale spectral grading ---- */
  Art.facing = function (set, dirIdx, frame) { return dirIdx === 1 ? set.up[frame] : dirIdx === 0 ? set.down[frame] : set.side[frame]; };

  Art.npc.corwin = build({
    skin: SKIN.tan, hair: ['#7a5a3c', '#523a26', '#33231a'], style: 'short', beard: true, broad: 1, stretch: 1, eyes: '#17121a',
    cloth: ['#78884e', '#566638', '#37422a'], len: 'coat', trim: ['#7a5a3a', '#5a4026', '#3a2818'], pants: ['#4a3a2c', '#382c20', '#261e16'], boots: ['#4a3a2c', '#32261c', '#201810'],
    cape: ['#425030', '#323e24', '#222a18'], capeLen: 22, pauldron: ['#9a7a50', '#74583a', '#4e3a26'], belt: ['#6a4a30', '#4a3222', '#2e1e14'], buckle: '#c8a850', pouch: ['#7a5a38', '#5a4028', '#3a281a'],
    staff: ['#c8a070', '#8a6a44', '#5a4228'], cuff: ['#6a4a30', '#4a3222', '#2e1e14'],
  });
  Art.npc.ilse = build({
    skin: SKIN.fair, hair: ['#c8c8d0', '#8a8a98', '#5a5a68'], style: 'helm', helm: ['#d4dae6', '#8e96a8', '#5a6074'], plume: ['#d85068', '#a02c44', '#681828'], eyes: '#ffb050', broad: 1, stretch: 1,
    cloth: ['#6a7a9c', '#4c5a7c', '#323c58'], len: 'coat', trim: ['#d4dae6', '#8e96a8', '#5a6074'], trim2: ['#c04058', '#8a2438', '#5a1424'], pants: ['#3c3e4c', '#2c2e3a', '#1e2028'], boots: ['#5a6074', '#3e4356', '#292d3a'],
    pauldron: ['#d4dae6', '#8e96a8', '#5a6074'], belt: ['#4a3a30', '#33271f', '#221914'], buckle: '#e8c860', staff: ['#e8ecf4', '#8a7050', '#5a4430'], spear: true, cuff: ['#8e96a8', '#6a7288', '#464c5e'],
  });
})();

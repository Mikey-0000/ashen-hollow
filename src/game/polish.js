/* Ashen Hollow - polish pass two.
   - Witchsight: hidden sigils glow on the ground (stand on one while seeing to claim it) and pale ghost echoes
     replay their old walks. Only visible while the sight is held.
   - Fusion casts: a two-colour spiral, rings and a flash when a fused spell leaves your hand.
   - Elemental variants: Ember / Rime / Storm-touched enemies glow, resist their own element and take extra from the opposite;
     they leave soul ash.
   - Imbue shrines: pray at one to lend your weapon an element for 40 strikes (once per shrine per day).
   - Boss phase shifts get cracks of light, a flash and falling ash.
   - Title screen: the caged lady swings in the foreground with drifting mist. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, S = AH.Sprites, W = AH.W, H = AH.H, spr = AH.Props.spr, P = AH.Particles;
  const Pl = (AH.Polish = { sig: [], echo: [], area: null });
  const safe = (fn, d) => { try { return fn(); } catch (e) { if (AH.errors) AH.errors.push('polish: ' + e); return d; } };
  const G_ = () => AH.G, R = Math.random;
  const EC = { fire: ['#ff9a3a', '#ffe0a0', '#c03a14'], frost: ['#9adfff', '#e8fbff', '#3a7ab8'], storm: ['#c8b0ff', '#fff', '#6a4ac8'] };
  const SCHC = { necro: '#7fe0c0', druid: '#8fd06a', blood: '#d04050', astral: '#7fa6ff', witch: '#c27be0' };

  /* ------------------------------------------------------------------ witchsight: sigils and echoes */
  const hs = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  function setupArea(w) {
    Pl.sig = []; Pl.echo = []; Pl.area = w; const rng = U.mulberry32(hs('sig' + w.areaId)), f = (w.G.flags.sigils = w.G.flags.sigils || {});
    const tries = (n, fn) => { for (let i = 0; i < 400 && n > 0; i++) { const tx = 3 + Math.floor(rng() * (w.w - 6)), ty = 3 + Math.floor(rng() * (w.h - 6)), x = tx * 16 + 8, y = ty * 16 + 8; if (w.freePoint(x, y, 5) && !w.isWater(x, y) && fn(x, y)) n--; } };
    const spawn = w.G.player; let idx = 0;
    tries(5, (x, y) => { if (U.dist(x, y, spawn.x, spawn.y) < 60 || Pl.sig.some((s) => U.dist(s.x, s.y, x, y) < 90)) return false; const id = w.areaId + ':' + idx++; Pl.sig.push({ x, y, id, got: !!f[id], ph: rng() * 6, glyph: Math.floor(rng() * 4) }); return true; });
    tries(3, (x, y) => { const a = rng() * 6.283, d = 30 + rng() * 40, x2 = x + Math.cos(a) * d, y2 = y + Math.sin(a) * d; if (!w.freePoint(x2, y2, 5)) return false; Pl.echo.push({ x1: x, y1: y, x2, y2, ph: rng() * 6, sp: 0.25 + rng() * 0.2, kind: Pl.echo.length % 3 }); return true; });
  }
  function drawGlyph(g, x, y, gl, a, col) {
    g.globalAlpha = a; g.fillStyle = col; const cx = Math.round(x), cy = Math.round(y);
    for (let i = 0; i < 16; i++) { const an = i / 16 * 6.283; g.fillRect(Math.round(cx + Math.cos(an) * 9), Math.round(cy + Math.sin(an) * 5), 1, 1); }
    if (gl === 0) { g.fillRect(cx - 4, cy, 9, 1); g.fillRect(cx, cy - 3, 1, 7); g.fillRect(cx - 2, cy - 1, 1, 3); g.fillRect(cx + 2, cy - 1, 1, 3); }
    else if (gl === 1) { for (let i = -3; i <= 3; i++) { g.fillRect(cx + i, cy + Math.abs(i) - 3, 1, 1); g.fillRect(cx + i, cy - Math.abs(i) + 3, 1, 1); } g.fillRect(cx, cy - 1, 1, 3); }
    else if (gl === 2) { g.fillRect(cx - 3, cy - 2, 7, 1); g.fillRect(cx - 3, cy + 2, 7, 1); g.fillRect(cx - 3, cy - 2, 1, 5); g.fillRect(cx + 3, cy - 2, 1, 5); g.fillRect(cx, cy - 1, 1, 3); }
    else { for (let i = 0; i < 5; i++) { g.fillRect(cx - 4 + i * 2, cy - (i % 2) * 2 + 1, 1, 2); } g.fillRect(cx - 4, cy, 9, 1); }
  }
  function drawEcho(g, cam, e, time, k) {
    const t = (Math.sin(time * e.sp + e.ph) * 0.5 + 0.5), x = U.lerp(e.x1, e.x2, t) - cam.x, y = U.lerp(e.y1, e.y2, t) - cam.y, dir = Math.cos(time * e.sp + e.ph) >= 0 ? 1 : -1, bob = Math.sin(time * 6 + e.ph) * 0.8;
    if (x < -20 || x > W + 20 || y < -20 || y > H + 20) return; const col = ['#a8c8ff', '#d8b0ff', '#b0ffe0'][e.kind];
    g.globalAlpha = (0.35 + 0.15 * Math.sin(time * 4 + e.ph)) * k; g.fillStyle = col;
    const px = Math.round(x), py = Math.round(y + bob);
    g.fillRect(px - 2, py - 14, 4, 4);                      /* head */
    g.fillRect(px - 3, py - 10, 6, 8);                      /* body */
    g.globalAlpha *= 0.7; g.fillRect(px - 4 + (dir > 0 ? 0 : 1), py - 2, 7, 3); g.fillRect(px - 2, py + 1, 3, 2); /* trailing hem */
    g.globalAlpha = 0.9 * k; g.fillStyle = '#fff'; g.fillRect(px + dir, py - 13, 1, 1);
    g.globalAlpha = 0.18 * k; g.fillStyle = col; for (let i = 1; i <= 4; i++) g.fillRect(px - dir * i * 3 - 1, py - 8 + i, 2, 6 - i);
  }
  const ds = AH.World.prototype.drawSight;
  AH.World.prototype.drawSight = function (g, cam, time) {
    ds.apply(this, arguments);
    safe(() => {
      const k = this.sightK || 0; if (k < 0.02) return; if (Pl.area !== this) setupArea(this);
      const p = this.G.player, f = this.G.flags.sigils;
      g.save(); g.globalCompositeOperation = 'lighter';
      Pl.echo.forEach((e) => drawEcho(g, cam, e, time, k));
      Pl.sig.forEach((s) => {
        const x = s.x - cam.x, y = s.y - cam.y; if (x < -20 || x > W + 20 || y < -20 || y > H + 20) return;
        const near = U.dist(s.x, s.y, p.x, p.y) < 14, pul = 0.5 + 0.5 * Math.sin(time * 3 + s.ph);
        if (s.got) { drawGlyph(g, x, y, s.glyph, 0.14 * k, '#7a6aa8'); return; }
        g.globalAlpha = (0.12 + 0.1 * pul) * k; g.fillStyle = '#b890ff'; g.beginPath(); g.ellipse(x, y, 13, 7, 0, 0, 6.283); g.fill();
        drawGlyph(g, x, y, s.glyph, (0.55 + 0.4 * pul) * k, near ? '#ffffff' : '#d8b8ff');
        g.globalAlpha = 0.7 * k; g.fillStyle = '#fff'; g.fillRect(Math.round(x), Math.round(y - 6 - pul * 6), 1, 1);
      });
      g.restore(); g.globalAlpha = 1;
      if (k > 0.7) Pl.sig.forEach((s) => { if (!s.got && U.dist(s.x, s.y, p.x, p.y) < 12) claimSigil(this, s); });
    });
  };
  function claimSigil(w, s) {
    const G = w.G, p = G.player; s.got = true; (G.flags.sigils = G.flags.sigils || {})[s.id] = 1;
    const n = Object.keys(G.flags.sigils).length, roll = R();
    P.magic(s.x, s.y - 4, 26, ['#d8b8ff', '#fff', '#a878e8'], { max: 90 }); w.ring(s.x, s.y, 46, '#b890ff', 0.7);
    if (roll < 0.45) { G.addItem ? G.addItem('soul_ash', 1) : (G.inv.soul_ash = (G.inv.soul_ash || 0) + 1); G.toast('A sigil gives up a pinch of soul ash.  (' + n + ' sigils found)', '#d8b8ff'); }
    else { G.addXP(35 + G.level * 3, true); G.toast('A sigil flares and fades. Memory floods in. (+XP)  (' + n + ' found)', '#d8b8ff'); }
    AH.Audio.sfx('page', { v: 0.9 });
  }

  /* ------------------------------------------------------------------ fusion cast spectacle */
  function fusionFx(p, sp) {
    const w = p.world, A = AH.getSpell(sp.fused[0]), B = AH.getSpell(sp.fused[1]); if (!A || !B) return;
    const ca = SCHC[A.school] || '#fff', cb = SCHC[B.school] || '#fff', V = AH.VFX;
    let t = 0; const x = p.x, y = p.y - 10;
    w.fx.push({ k: 'vfx', t: 0, x, y, max: 0.7, z: 0, draw(g, cam, f) {
      const k = f.t / f.max, sx = p.x - cam.x, sy = p.y - 10 - cam.y; g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 18; i++) { const an = i * 0.7 + k * 9, r = (1 - k) * 22 + 3, which = i % 2; g.globalAlpha = (1 - k) * 0.9; g.fillStyle = which ? ca : cb; g.fillRect(Math.round(sx + Math.cos(an + which * 3.14) * r), Math.round(sy + Math.sin(an + which * 3.14) * r * 0.6), 2, 2); }
      g.restore(); } });
    if (V && V.ring) { V.ring(p.x, p.y, 36, ca, 0.45, { thick: 2 }); setTimeout(() => safe(() => V.ring(p.x, p.y, 54, cb, 0.5, { thick: 2 })), 90); }
    P.magic(p.x, p.y - 12, 18, [ca, cb, '#fff'], { max: 100, life: [0.3, 0.8] }); w.addShake && w.addShake(2);
    if (V) { V.flash = Math.max(V.flash || 0, 0.12); V.flashCol = cb; }
  }
  const mf = AH.Magic.fire;
  AH.Magic.fire = function (p, sp, aim) { const r = mf.apply(this, arguments); if (sp && sp.fused) safe(() => fusionFx(p, sp)); return r; };

  /* ------------------------------------------------------------------ elemental variants */
  const VAR = {
    ember: { name: 'Ember', el: 'fire', weak: 'frost', col: '#ff8a30', light: '#ff7a30' },
    rime: { name: 'Rime', el: 'frost', weak: 'fire', col: '#8fd8ff', light: '#8fd0ff' },
    storm: { name: 'Storm-touched', el: 'storm', weak: 'frost', col: '#c0a8ff', light: '#b898ff' }
  };
  const CHANCE = { hamlet: ['ember', 0.13], thornwood: ['storm', 0.16], catacombs: ['rime', 0.22] };
  const me = AH.makeEnemy;
  AH.makeEnemy = function (world, type, tx, ty, o) {
    const e = me.apply(this, arguments);
    safe(() => {
      if (!e || e.boss || e.ally || e.thrall || e.risen || (o && (o.fadeIn || o.noVariant)) || !e.def || e.def.boss) return;
      const c = CHANCE[world.areaId]; if (!c) return; const bm = world.G && world.G.flags.bloodmoon_now ? 1.8 : 1;
      if (R() > c[1] * bm) return;
      const v = VAR[c[0]]; e.variant = c[0]; e.def = Object.assign({}, e.def, { name: v.name + ' ' + (e.def.name || type) });
      e.hp = e.maxHp = Math.round(e.maxHp * 1.25); e.lightR = Math.max(e.lightR || 0, 30); e.lightCol = v.light;
    });
    return e;
  };
  const ch = AH.Combat.hit;
  AH.Combat.hit = function (t, dmg, o) {
    o = o || {};
    if (t && t.variant && !t.dead) safe(() => {
      const v = VAR[t.variant], G = AH.G, p = G.player; let el = o.elem || AH.Elements.elemOfTags(o.tags);
      if (!el && o.melee && o.src === p) { const wp = AH.Items[G.equip.weapon], im = G.flags.imbue; el = (im && im.hits > 0 && im.elem) || (wp && wp.elem); }
      if (el === v.el) dmg *= 0.45; else if (el === v.weak) dmg *= 1.35;
    });
    return ch.call(this, t, dmg, o);
  };
  const ed = AH.Enemy.prototype.draw;
  AH.Enemy.prototype.draw = function (g, cam, time) {
    if (this.variant && !this.dead) safe(() => {
      const v = VAR[this.variant], x = this.x - cam.x, y = this.y - cam.y - 8, pul = 0.5 + 0.5 * Math.sin(time * 4 + (this.seed || 0));
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.18 + 0.1 * pul; g.fillStyle = v.col; g.beginPath(); g.ellipse(x, y + 2, 13, 15, 0, 0, 6.283); g.fill(); g.restore();
    });
    const r = ed.apply(this, arguments);
    if (this.variant && !this.dead) safe(() => {
      const v = VAR[this.variant]; if (R() < 0.12) { const cols = EC[v.el] || [v.col]; P.magic(this.x + U.rr(-5, 5), this.y - U.rr(4, 18), 1, cols); }
    });
    return r;
  };
  const dieO = AH.Enemy.prototype.die;
  AH.Enemy.prototype.die = function () {
    const was = this.dead, r = dieO.apply(this, arguments);
    if (!was && this.dead && this.variant) safe(() => { const w = this.w || AH.G.world; if (R() < 0.6) w.spawnPickup(this.x, this.y, 'soul_ash', 1); const v = VAR[this.variant]; P.magic(this.x, this.y - 8, 16, EC[v.el]); w.ring(this.x, this.y, 40, v.col, 0.5); });
    return r;
  };

  /* ------------------------------------------------------------------ imbue shrines */
  const SH = { fire: ['#ff9a3a', '#ffe8b0', '#8a3010'], frost: ['#9adfff', '#f0fcff', '#3a6a9a'], storm: ['#c8b0ff', '#ffffff', '#5a3ab8'] };
  Object.keys(SH).forEach((el) => {
    spr['shrine_' + el] = S.frames(4, (i) => {
      const Pt = S.painter(22, 34), c = SH[el], fl = [0, 1, 2, 1][i];
      Pt.rect(4, 28, 14, 4, '#2a2630'); Pt.rect(5, 28, 12, 1, '#4a4654'); Pt.rect(7, 18, 8, 10, '#3a3642'); Pt.rect(7, 18, 2, 10, '#58546a'); Pt.rect(6, 16, 10, 3, '#4a4654'); Pt.rect(6, 16, 10, 1, '#6a6680');
      Pt.rect(10, 20, 2, 6, c[2]); Pt.px(11, 22, c[0]); Pt.px(10, 24, c[0]);
      Pt.rect(8, 12 - fl, 6, 4 + fl, c[2]); Pt.rect(9, 10 - fl, 4, 5 + fl, c[0]); Pt.rect(10, 8 - fl, 2, 5 + fl, c[1]); Pt.px(11, 6 - fl, c[1]);
      if (el === 'frost') { Pt.px(7, 12, c[1]); Pt.px(14, 13, c[1]); Pt.px(11, 4, c[1]); } if (el === 'storm') { Pt.line(5, 8, 8, 12 - fl, c[1]); Pt.line(17, 6, 14, 11 - fl, c[1]); }
      return S.outline(S.fromCanvas(Pt.c, 11, 31), '#0a0806');
    });
  });
  const SHRINE = { hamlet: 'fire', thornwood: 'storm', catacombs: 'frost' };
  const COL = { fire: '#ff9a3a', frost: '#9adfff', storm: '#c8b0ff' }, LBL = { fire: 'Ember Shrine', frost: 'Rime Shrine', storm: 'Storm Shrine' };
  ['hamlet', 'thornwood', 'catacombs'].forEach((id) => {
    const orig = AH.Maps[id]; if (!orig) return;
    AH.Maps[id] = function () {
      const b = orig.apply(this, arguments);
      safe(() => {
        const el = SHRINE[id], sp = b.spawns.start || b.spawns[Object.keys(b.spawns)[0]]; if (!sp) return;
        for (let i = 0; i < 500; i++) {
          const a = b.rng() * 6.283, d = 5 + b.rng() * 6, tx = Math.round(sp.tx + Math.cos(a) * d), ty = Math.round(sp.ty + Math.sin(a) * d);
          if (!b.inb(tx, ty) || !b.isFree(tx, ty, 1) || b.objs.some((q) => Math.abs(q.tx - tx) < 2 && Math.abs(q.ty - ty) < 2 && (q.solid || q.act))) continue;
          b.prop('shrine_' + el, tx, ty, { solid: true, shadow: true, anim: 4, animSpeed: 6, ox: 3, act: { type: 'shrine', elem: el, prompt: 'Pray at the ' + LBL[el] }, light: { r: 60, color: COL[el], flicker: 0.3, y: -22 } }); break;
        }
      });
      return b;
    };
  });
  const N = AH.Dialogue.nodes;
  Object.keys(SH).forEach((el) => {
    N['shrine_' + el] = { id: 'shrine_' + el, sp: LBL[el], text: 'The flame leans toward your blade as though hungry for it. "Lend me the edge," it seems to say, "and I will lend you the weather."', opts: [
      { t: 'Offer your weapon. (40 imbued strikes)', end: true, fx: () => safe(() => imbue(el)), cond: () => !AH.G.world || AH.G.flags.shrineDay !== AH.G.day + el },
      { t: '(Step away)', end: true }] };
  });
  AH.Interact.types.shrine = (o, a, w, p, g) => { Pl.shrine = o; if (g.flags.shrineDay === g.day + a.elem) { g.toast('The flame is spent for today.', '#8a8478'); return; } g.dialogueStart('shrine_' + a.elem); };
  function imbue(el) {
    const G = AH.G, p = G.player; G.flags.imbue = { elem: el, hits: 40 }; G.flags.shrineDay = G.day + el;
    P.magic(p.x, p.y - 12, 26, EC[el]); G.world.ring(p.x, p.y, 50, EC[el][0], 0.6); G.toast('Your weapon burns with ' + el + '. (40 strikes)', EC[el][0]); AH.Audio.sfx('levelup', { v: 0.6 });
  }
  const ch2 = AH.Combat.hit;
  AH.Combat.hit = function (t, dmg, o) {
    o = o || {}; const G = AH.G, im = G && G.flags && G.flags.imbue;
    if (im && im.hits > 0 && o.melee && o.src === G.player && !o.elem) {
      im.hits--; o = Object.assign({}, o, { elem: im.elem, tags: (o.tags || []).concat(im.elem) }); dmg *= 1.2;
      if (im.hits === 0) { G.toast('The imbuement fades.', '#8a8478'); delete G.flags.imbue; }
    }
    return ch2.call(this, t, dmg, o);
  };
  /* imbued weapon glow so it reads in play */
  const pd = AH.Player && AH.Player.prototype.draw;
  if (pd) AH.Player.prototype.draw = function (g, cam, time) {
    const im = AH.G && AH.G.flags && AH.G.flags.imbue; const r = pd.apply(this, arguments);
    if (im && im.hits > 0 && R() < 0.25) safe(() => P.magic(this.x + (this.face || 1) * 6 + U.rr(-3, 3), this.y - U.rr(6, 14), 1, EC[im.elem]));
    return r;
  };

  /* ------------------------------------------------------------------ boss phase spectacle */
  const ps = AH.Boss.prototype.phaseShift;
  AH.Boss.prototype.phaseShift = function () {
    const r = ps.apply(this, arguments);
    safe(() => {
      const w = this.w, V = AH.VFX, n = this.phase;
      for (let i = 0; i < 8; i++) { const a = i * 0.785 + n; P.magic(this.x + Math.cos(a) * 14, this.y - 10 + Math.sin(a) * 8, 6, ['#e8c670', '#fff4c0', '#c8a040'], { max: 120, life: [0.5, 1.2] }); }
      for (let i = 0; i < 30; i++) P.emit && P.emit({ x: this.x + U.rr(-120, 120), y: this.y - 120, vx: U.rr(-8, 8), vy: U.rr(30, 70), life: 2.2, col: n === 3 ? '#ff6a5a' : '#8a7a68', size: 1, grav: 0 });
      w.ring(this.x, this.y, 180, '#ffe090', 1.0); setTimeout(() => safe(() => w.ring(this.x, this.y, 120, '#ff8a50', 0.8)), 160);
      if (V) { V.flash = Math.max(V.flash || 0, 0.35); V.flashCol = '#ffe8b0'; } w.addShake(6);
    });
    return r;
  };

  /* ------------------------------------------------------------------ title screen: the caged lady and mist */
  const SC = AH.UI && AH.UI.screens;
  if (SC && SC.title) {
    const td = SC.title.draw;
    SC.title.draw = function (g, Gm, time) {
      td.apply(this, arguments);
      safe(() => {
        const t = time || performance.now() / 1000;
        g.save(); g.globalAlpha = 0.07; g.fillStyle = '#9ab0d8';
        for (let i = 0; i < 6; i++) { const x = ((t * (4 + i) + i * 90) % (W + 120)) - 60, y = H - 30 - i * 14; g.beginPath(); g.ellipse(x, y, 70, 7, 0, 0, 6.283); g.fill(); }
        g.restore();
        const fr = spr.hanging, f = Array.isArray(fr) ? fr[Math.floor(t * 2.2) % fr.length] : fr; if (!f) return;
        const sway = Math.sin(t * 1.1) * 3; g.save(); g.globalAlpha = 0.5; g.fillStyle = '#6a8ad8'; g.beginPath(); g.arc(46, H - 70, 34 + Math.sin(t * 2) * 2, 0, 6.283); g.fill(); g.restore();
        g.save(); g.translate(46 + sway, H - 24); g.scale(2, 2); S.draw(g, f, 0, 0); g.restore();
      });
    };
  }
  AH.Polish = Object.assign(Pl, { claimSigil, fusionFx, imbue, VAR });
})();

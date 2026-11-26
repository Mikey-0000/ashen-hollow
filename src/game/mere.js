/* Ashen Hollow - The Mere: a drowned peat bog that gives way to a frozen lake, north of the Thornwood.
   Bog peat slows you; lake ice is slick and you keep sliding; snow falls over the water.
   Reached from a new path at the Thornwood's northern edge. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, ID = AH.Tiles.ID, T = AH.T;
  const g = () => AH.G, safe = (fn) => { try { return fn(); } catch (e) { if (AH.errors) AH.errors.push('mere: ' + e); } };
  const lore = (id, type, title, text) => (AH.Lore[id] = { id, type, title, text });
  const item = (o) => (AH.Items[o.id] = Object.assign({ rarity: 0, stack: false, scheme: 'neutral' }, o));

  lore('mere_sign', 'inscription', 'Post at the Mere', 'WADE NOT BEYOND THE REEDS.\nThe ice sings after dark. If it sings your name, do not go and see why.\n(Below, in a child\'s hand: "it never sings mine.")');
  lore('hermit_note', 'journal', 'The Net-Mender\'s Notebook', 'Winter came early the year the Abbot walked into the lake. He was carrying the bell\'s little brother, wrapped in a cloak, and he did not come out.\nI mend nets. The lake does not give anything back to nets any more, only a faint ringing, like a spoon on a glass.\nIf you go across, step lightly and do not stop. The ice remembers who is heavy.');
  lore('frozen_bell', 'inscription', 'The Frozen Bell', 'A small bell, no taller than a child, rimed solid to its tongue. The Abbot\'s cloak is frozen around it, and the ice is clear enough to read the inscription beneath: "I WAS ONLY EVER MEANT TO CALL THEM HOME."\nWhen you lay your hand on it, it rings once, very softly, and the lake goes still.');
  item({ id: 'frost_charm', name: 'Rimebound Charm', type: 'relic', rarity: 2, icon: 'rune', scheme: 'astral', desc: 'A knot of net-cord with a sliver of lake ice that never melts. You keep your footing a little better, and winter bites less.', mods: { armor: 0.06, speed: 0.04 } });
  item({ id: 'bell_clapper', name: 'Clapper of the Little Bell', type: 'relic', rarity: 3, icon: 'rune', scheme: 'necro', desc: 'The tongue of the small bell. It is warm, as if it had just stopped ringing.', mods: { corruptGain: -0.2, soulGain: 0.1 } });

  const orig = AH.Maps.hamlet; /* only used to borrow the builder class */
  AH.Maps.mere = function () {
    const MapB = orig().constructor, P = ID.PEAT, I = ID.ICE, WA = ID.WATER, DP = ID.DEEP, D = ID.DIRT, M = ID.MOSS, MU = ID.MUD, G = ID.GRASS, BR = ID.BRIDGE, TL = ID.TREELINE, WO = ID.WOOD, TI = ID.TIMBER;
    const b = new MapB('mere', 60, 44, P, 47);
    Object.assign(b, { name: 'The Mere', music: 'forest', time: true, fog: 0.3, canopy: 0, theme: 'forest', weather: { clear: 0.25, fog: 0.4, rain: 0.2, storm: 0.15 }, ambMul: 0.7, floorUnder: P, snow: true });
    b.border(TL, 3);
    /* the bog */
    for (let i = 0; i < 16; i++) b.blob(5 + Math.floor(b.rng() * 29), 5 + Math.floor(b.rng() * 34), 2 + Math.floor(b.rng() * 3), 2 + Math.floor(b.rng() * 2), i % 3 ? WA : MU, i + 5);
    for (let i = 0; i < 8; i++) b.blob(4 + Math.floor(b.rng() * 30), 4 + Math.floor(b.rng() * 36), 3, 2, M, i + 40, 0.5);
    /* the frozen lake with a bank of grass-and-mud shore and a few cracked holes */
    b.blob(46, 22, 13, 16, G, 91, 0.4); b.blob(46, 22, 11, 14, I, 92, 0.3);
    b.blob(42, 15, 2, 2, DP, 93); b.blob(52, 28, 2, 2, DP, 94); b.blob(40, 30, 1, 1, DP, 95);
    b.blob(47, 22, 3, 3, I, 96); /* the island is just thicker ice */
    /* road: from the Thornwood in the south, up past the hut, over the channel, to the shore */
    b.fill(20, 36, 3, 8, D); b.fill(20, 24, 3, 13, D); b.fill(22, 24, 14, 2, D); b.fill(34, 22, 4, 4, D);
    b.fill(26, 20, 2, 6, WA); b.fill(26, 24, 2, 2, BR); /* a channel crossed by a plank bridge */
    b.fill(26, 20, 2, 4, WA);
    /* the net-mender's hut */
    b.house(10, 26, 8, 6, { wall: TI, floor: WO, gaps: [[17, 29], [17, 30]] }); b.fill(18, 29, 2, 2, D);
    b.keep.push([8, 24, 14, 10], [18, 34, 6, 10]);
    b.exit(20, 43, 3, 1, 'thornwood', 'from_mere');
    b.spawn('from_thornwood', 21, 41, 1);
    /* furnishings */
    b.prop('sign', 19, 40, { solid: true, shadow: true, act: { type: 'lore', id: 'mere_sign', prompt: 'Read the post' } });
    b.prop('waystone', 24, 38, { solid: true, anim: 6, shadow: true, act: { type: 'waystone', id: 'mere', name: 'Mere Waystone', prompt: 'Touch the waystone' }, light: { r: 90, color: '#7a9ae8', flicker: 0.12, y: -26 } });
    b.torch(19, 38); b.brazier(23, 36);
    b.prop('bed', 11, 28, { solid: true }); b.prop('crate', 15, 28, { solid: true }); b.prop('barrel', 15, 30, { solid: true });
    b.prop('cauldron', 12, 30, { solid: true, anim: 6, light: { r: 40, color: '#7acfff', flicker: 0.2, y: -12 } });
    b.prop('tablet', 16, 27, { solid: true, act: { type: 'lore', id: 'hermit_note', prompt: 'Read the notebook' } });
    b.prop('chest', 13, 27, { solid: true, act: { type: 'chest', id: 'hermit_chest', items: [{ id: 'tincture', n: 2 }, { id: 'frost_charm', n: 1 }, { id: 'grave_salt', n: 2 }], prompt: 'Open chest' } });
    b.prop('window', 13, 26, { wall: true, anim: 4, light: { r: 50, color: '#a8d8ff', flicker: 0.08, y: 10 } });
    b.candles(14, 28, {});
    /* the island: the little bell */
    b.prop('altar', 47, 22, { solid: true, shadow: true, ox: 8, act: { type: 'lore', id: 'frozen_bell', prompt: 'Lay a hand on the bell' }, light: { r: 64, color: '#9ad8ff', flicker: 0.12, y: -16 } });
    b.prop('chest', 49, 23, { solid: true, act: { type: 'chest', id: 'lake_chest', items: [{ id: 'bell_clapper', n: 1 }, { id: 'raven_feather', n: 3 }], prompt: 'Open the ice-bound chest' } });
    [[44, 18], [50, 19], [44, 26], [50, 26]].forEach((p) => b.prop('bones', p[0], p[1], { variant: (p[0] + p[1]) % 3 }));
    b.light(47, 22, '#7ad0ff', 110);
    /* reeds & dead trees in the bog */
    b.forest(4, 4, 30, 38, ['dead', 'dead', 'thorn'], 0.32, 4);
    b.deco(4, 4, 30, 38, 26, 'rock', [P, M], {});
    /* inhabitants */
    [[8, 10], [14, 8], [22, 12], [28, 16], [10, 20], [28, 32]].forEach((p, i) => b.enemy(i % 3 ? 'wretch' : 'hound', p[0], p[1], { when: 'any', sleeps: i % 3 === 0 }));
    [[6, 14], [16, 16], [30, 10], [24, 30]].forEach((p) => b.enemy('wisp', p[0], p[1], { when: 'dim' }));
    [[40, 20], [52, 20], [44, 28], [50, 15]].forEach((p) => b.enemy('wraith', p[0], p[1], { when: 'any' }));
    b.enemy('sentinel', 45, 21, { when: 'any' }); b.enemy('sentinel', 49, 21, { when: 'any' }); b.enemy('hexcaller', 12, 14, { when: 'any' }); b.enemy('hexcaller', 30, 28, { when: 'any' });
    b.zone('Hut', 8, 24, 14, 10, { discover: 'The Net-Mender\'s Hut', xp: 15 }); b.zone('Lake', 34, 6, 25, 32, { discover: 'The Frozen Lake', xp: 30 }); b.zone('Bog', 3, 3, 28, 22, { discover: 'The Drowned Bog', xp: 15 });
    return b;
  };

  /* a path from the Thornwood's north edge down to the Mere */
  const tw0 = AH.Maps.thornwood;
  AH.Maps.thornwood = function () {
    const b = tw0.apply(this, arguments);
    safe(() => { b.fill(20, 0, 3, 4, ID.DIRT); b.exit(20, 0, 3, 1, 'mere', 'from_thornwood'); b.spawn('from_mere', 21, 4, 0); b.prop('sign', 19, 4, { solid: true, shadow: true, act: { type: 'lore', id: 'mere_sign', prompt: 'Read the post' } }); });
    return b;
  };

  /* ---- movement: bog peat drags, lake ice carries you on ---- */
  const W = AH.World.prototype, mv0 = W.moveEnt;
  W.moveEnt = function (e, dx, dy) {
    if (e && (!e.def || (!e.def.flies && !e.def.ghost)) && this.areaId === 'mere') {
      const t = this.tiles[Math.floor((e.y - 2) / T) * this.w + Math.floor(e.x / T)];
      if (t === ID.PEAT) { dx *= 0.78; dy *= 0.78; }
    }
    return mv0.call(this, e, dx, dy);
  };
  const Pl = AH.Player.prototype, pu0 = Pl.update;
  Pl.update = function (dt) {
    const w = g().world, x0 = this.x, y0 = this.y, r = pu0.apply(this, arguments);
    safe(() => {
      if (!w || w.areaId !== 'mere' || this.dead || dt <= 0) return;
      const t = w.tiles[Math.floor((this.y - 2) / T) * w.w + Math.floor(this.x / T)], iv = this._iv || (this._iv = { x: 0, y: 0 });
      if (t === ID.ICE && this.state !== 'dodge' && this.state !== 'cast') {
        const mx = (this.x - x0) / dt - iv.x * 0, my = (this.y - y0) / dt;
        if (Math.hypot(mx, my) > 4) { iv.x = U.lerp(iv.x, mx, 0.25); iv.y = U.lerp(iv.y, my, 0.25); }
        else { iv.x *= Math.pow(0.12, dt); iv.y *= Math.pow(0.12, dt); }
        if (Math.hypot(iv.x, iv.y) > 6 && Math.hypot(this.x - x0, this.y - y0) < 0.6) w.moveEnt(this, iv.x * dt, iv.y * dt);
        else if (Math.hypot(iv.x, iv.y) > 6) w.moveEnt(this, iv.x * dt * 0.35, iv.y * dt * 0.35);
        if (Math.random() < dt * 8 && Math.hypot(iv.x, iv.y) > 20) AH.Particles.emit({ x: this.x, y: this.y, z: 1, vx: U.rr(-12, 12), vy: U.rr(-6, 6), vz: U.rr(8, 24), life: 0.4, size: 1, c: '#e8f6ff', add: true });
      } else { iv.x *= Math.pow(0.001, dt); iv.y *= Math.pow(0.001, dt); }
    });
    return r;
  };

  /* ---- snow over the Mere (screen-space flakes, drawn in the post pass) ---- */
  const flakes = []; for (let i = 0; i < 90; i++) flakes.push({ x: Math.random() * AH.W, y: Math.random() * AH.H, s: 0.4 + Math.random() * 0.8, p: Math.random() * 6 });
  const V = AH.VFX;
  if (V) {
    const post0 = V.post;
    V.post = function (gx) {
      const r = post0.apply(this, arguments), w = g().world;
      safe(() => {
        if (!w || w.areaId !== 'mere' || g().mode !== 'play') return; const t = performance.now() / 1000, cam = w.cam, onLake = cam.x + AH.W / 2 > 34 * T;
        gx.save(); gx.globalAlpha = onLake ? 0.85 : 0.35; gx.fillStyle = '#e8f2fa';
        flakes.forEach((f) => { f.y += f.s * 0.5; f.x += Math.sin(t * 0.8 + f.p) * 0.25 + 0.1; if (f.y > AH.H) { f.y = -2; f.x = Math.random() * AH.W; } if (f.x > AH.W) f.x = 0; gx.fillRect(Math.round(f.x), Math.round(f.y), f.s > 0.9 ? 2 : 1, f.s > 0.9 ? 2 : 1); });
        gx.restore();
      });
      return r;
    };
  }
  AH.Mere = { done: () => !!(g().lore && g().lore.frozen_bell) };
})();

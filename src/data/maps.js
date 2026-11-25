/* Ashen Hollow - world data. Three interconnected areas authored with a small builder:
   Withering Hamlet (hub) <-> Thornwood (forbidden forest) <-> Catacombs of the Pale Choir.
   Coordinates are tile units; objects stand with their feet at the bottom of their tile. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, ID = AH.Tiles.ID;
  const { GRASS: G, DIRT: D, COBBLE: C, MOSS: M, WATER: WA, FLAG: F, WOOD: WO, CRYPT: CR, CARPET: CA, MUD: MU, BONES: BO, BRIDGE: BR, LEAVES: LE, WALL: W, CWALL: CW, TIMBER: TI, FENCE: FE, TREELINE: TL, DEEP: DP, ROCK: RO, HEDGE: HE } = ID;
  const natural = [G, M, LE, MU];

  class MapB {
    constructor(id, w, h, base, seed) {
      this.id = id; this.w = w; this.h = h; this.tiles = new Uint8Array(w * h).fill(base); this.objs = []; this.enemies = []; this.npcs = []; this.exits = []; this.spawns = {}; this.zones = []; this.secrets = []; this.ecology = [];
      this.rng = U.mulberry32(seed || 1); this.keep = [];
    }
    inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
    set(x, y, t) { if (this.inb(x, y)) this.tiles[y * this.w + x] = t; }
    get(x, y) { return this.inb(x, y) ? this.tiles[y * this.w + x] : 0; }
    fill(x, y, w, h, t) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, t); }
    rect(x, y, w, h, t) { for (let i = x; i < x + w; i++) { this.set(i, y, t); this.set(i, y + h - 1, t); } for (let j = y; j < y + h; j++) { this.set(x, j, t); this.set(x + w - 1, j, t); } }
    border(t, n) { for (let k = 0; k < n; k++) this.rect(k, k, this.w - k * 2, this.h - k * 2, t); }
    blob(cx, cy, rx, ry, t, seed, rough) { for (let y = cy - ry - 2; y <= cy + ry + 2; y++) for (let x = cx - rx - 2; x <= cx + rx + 2; x++) { const d = ((x - cx) / (rx + 0.5)) ** 2 + ((y - cy) / (ry + 0.5)) ** 2 + (U.noise(x * 0.7, y * 0.7, seed || 1) - 0.5) * (rough === undefined ? 0.8 : rough); if (d <= 1) this.set(x, y, t); } }
    scatter(t, n, x, y, w, h, only) { for (let i = 0; i < n; i++) { const tx = x + Math.floor(this.rng() * w), ty = y + Math.floor(this.rng() * h); if (!only || only.indexOf(this.get(tx, ty)) >= 0) this.set(tx, ty, t); } }
    /* hollow building: walls outline, floor inside, optional door gaps */
    house(x, y, w, h, o) {
      o = o || {}; this.rect(x, y, w, h, o.wall || TI); this.fill(x + 1, y + 1, w - 2, h - 2, o.floor || WO);
      (o.gaps || []).forEach((g) => this.set(g[0], g[1], o.gapTile || o.floor || WO)); this.keep.push([x - 1, y - 1, w + 2, h + 2]);
    }
    prop(spr, tx, ty, o) { const p = Object.assign({ k: 'prop', spr, tx, ty }, o || {}); this.objs.push(p); return p; }
    tree(tx, ty, kind) { return this.prop('tree_' + kind, tx, ty, { solid: true, shadow: true, sway: 1.2, variant: Math.floor(this.rng() * 3), tall: true }); }
    torch(tx, ty, o) { return this.prop('torch', tx, ty, Object.assign({ anim: 6, light: { r: 78, color: '#ff9a4a', flicker: 0.3, y: -14, shadow: 'static' }, wall: true, ember: true }, o)); }
    brazier(tx, ty, o) { return this.prop('brazier', tx, ty, Object.assign({ anim: 6, solid: true, light: { r: 92, color: '#ff9a4a', flicker: 0.28, y: -14, shadow: 'static' }, ember: true, shadow: true, ignite: true }, o)); }
    candles(tx, ty, o) { return this.prop('candles', tx, ty, Object.assign({ anim: 5, light: { r: 46, color: '#ffc070', flicker: 0.25, y: -6 }, ignite: true }, o)); }
    light(tx, ty, color, r, o) { this.objs.push(Object.assign({ k: 'light', tx, ty, light: { r, color, flicker: 0.1, y: 0 } }, o || {})); }
    enemy(type, tx, ty, o) { this.enemies.push(Object.assign({ type, tx, ty, when: 'any' }, o || {})); }
    npc(id, tx, ty) { this.npcs.push({ id, tx, ty }); }
    exit(x, y, w, h, to, spawn, o) { this.exits.push(Object.assign({ x, y, w, h, to, spawn }, o || {})); }
    spawn(name, tx, ty, face) { this.spawns[name] = { tx, ty, face: face || 0 }; }
    zone(name, x, y, w, h, o) { this.zones.push(Object.assign({ name, x, y, w, h }, o || {})); }
    secret(id, tx, ty, o) { this.secrets.push(Object.assign({ id, tx, ty }, o || {})); }
    isFree(tx, ty, pad) { for (const k of this.keep) if (tx >= k[0] - (pad || 0) && ty >= k[1] - (pad || 0) && tx < k[0] + k[2] + (pad || 0) && ty < k[1] + k[3] + (pad || 0)) return false; return true; }
    /* scatter trees on natural ground, keeping clear of paths, water and reserved rects */
    forest(x, y, w, h, kinds, dens, step) {
      step = step || 3;
      for (let j = y; j < y + h; j += step) for (let i = x; i < x + w; i += step) {
        const tx = i + Math.floor(this.rng() * step), ty = j + Math.floor(this.rng() * step);
        if (this.rng() > dens || !this.inb(tx, ty)) continue;
        if (natural.indexOf(this.get(tx, ty)) < 0 || !this.isFree(tx, ty, 1)) continue;
        let ok = true; for (let a = -1; a <= 1 && ok; a++) for (let c = -1; c <= 1; c++) { if (natural.indexOf(this.get(tx + a, ty + c)) < 0) { ok = false; break; } }
        if (!ok) continue;
        if (this.objs.some((o) => o.solid && Math.abs(o.tx - tx) < 2 && Math.abs(o.ty - ty) < 2)) continue;
        this.tree(tx, ty, kinds[Math.floor(this.rng() * kinds.length)]);
      }
    }
    deco(x, y, w, h, n, spr, only, o) { for (let i = 0; i < n; i++) { const tx = x + Math.floor(this.rng() * w), ty = y + Math.floor(this.rng() * h); if (only.indexOf(this.get(tx, ty)) < 0 || !this.isFree(tx, ty, 0)) continue; if (this.objs.some((q) => q.solid && q.tx === tx && q.ty === ty)) continue; this.prop(spr, tx, ty, Object.assign({ variant: Math.floor(this.rng() * 3), ox: Math.floor(this.rng() * 8) - 4, sway: spr === 'tuft' || spr === 'fern' ? 2.2 : 0, bush: spr === 'bush' }, o || {})); } }
  }

  const Maps = (AH.Maps = {});

  /* ========================================================= WITHERING HAMLET */
  Maps.hamlet = function () {
    const b = new MapB('hamlet', 56, 40, G, 11);
    Object.assign(b, { name: 'Withering Hamlet', music: 'hamlet', time: true, fog: 0.08, canopy: 0, theme: 'hamlet', weather: { clear: 0.5, fog: 0.28, rain: 0.22 }, floorUnder: G });
    b.border(TL, 2);
    b.blob(14, 34, 9, 4, M, 3); b.blob(40, 30, 6, 5, M, 5); b.blob(20, 12, 4, 3, M, 8); b.blob(46, 38, 5, 2, M, 9);
    /* roads & plaza */
    b.fill(2, 19, 23, 3, D); b.fill(24, 17, 11, 8, C); b.fill(28, 2, 2, 16, D); b.fill(28, 25, 2, 13, D); b.fill(35, 19, 12, 2, D); b.fill(45, 17, 2, 6, D);
    b.fill(26, 18, 7, 1, F); b.blob(29, 21, 6, 4, C, 2, 0.5);
    b.fill(2, 18, 3, 1, D);
    /* Marta's hut and garden */
    b.house(6, 6, 9, 8, { wall: TI, floor: WO, gaps: [[10, 13]] });
    b.rect(4, 14, 13, 5, FE); b.fill(5, 15, 11, 3, D); b.set(10, 14, D); b.set(10, 18, D); b.keep.push([4, 14, 13, 5]);
    /* the inn of the laid table */
    b.house(18, 4, 13, 9, { wall: TI, floor: WO, gaps: [[24, 12], [25, 12]] }); b.set(30, 4, G); b.set(30, 5, G); b.set(18, 11, G); b.fill(22, 13, 6, 6, D); b.set(24, 12, WO); b.set(25, 12, WO);
    /* burnt house + root cellar */
    b.house(6, 25, 9, 8, { wall: TI, floor: WO, gaps: [[9, 32], [10, 32]] }); [[6, 27], [6, 28], [10, 25], [11, 25], [8, 32]].forEach((p) => b.set(p[0], p[1], p[1] === 25 || p[1] === 32 ? G : G)); b.fill(8, 33, 4, 3, D);
    b.house(14, 26, 6, 7, { wall: TI, floor: WO }); b.set(14, 29, TI); b.fill(14, 27, 1, 2, TI); b.fill(14, 30, 1, 2, TI); b.set(14, 29, TI);
    b.secret('cellar', 14, 29, { to: WO });
    /* the church of Saint Veyra */
    b.house(38, 4, 16, 14, { wall: W, floor: F, gaps: [[45, 17], [46, 17]] }); b.fill(45, 6, 2, 11, CA); b.fill(49, 5, 1, 12, W); b.set(49, 10, F); b.fill(50, 5, 3, 12, F); b.fill(50, 6, 3, 10, F);
    b.set(45, 4, W); b.secret('altar_crypt', 45, 4, { to: CR });
    b.set(38, 9, G); b.set(38, 10, G); b.set(53, 12, G); b.set(46, 4, W); b.fill(39, 4, 2, 1, W);
    /* graveyard & mausoleum */
    b.rect(38, 22, 16, 16, FE); b.fill(39, 23, 14, 14, M); b.fill(45, 21, 2, 13, D); b.set(45, 22, D); b.set(46, 22, D); b.fill(39, 23, 5, 1, G);
    b.house(42, 32, 8, 5, { wall: CW, floor: CR, gaps: [[45, 32]] }); b.fill(45, 31, 2, 1, D); b.set(46, 32, CW);
    b.fill(43, 33, 6, 3, CR); b.set(45, 32, CR);
    b.keep.push([37, 21, 18, 18]);
    /* the sealed south gate: Drowned Road */
    b.fill(28, 38, 2, 2, D);
    b.exit(28, 0, 2, 1, 'thornwood', 'from_hamlet'); b.fill(28, 0, 2, 2, D);
    b.exit(45, 35, 2, 1, 'catacombs', 'from_hamlet'); b.exit(45, 3, 2, 1, 'catacombs', 'from_church', { cond: 'altar_crypt' });
    b.exit(28, 39, 2, 1, 'epilogue', 'gate', { cond: 'drowned_gate' });
    b.spawn('start', 3, 20, 3); b.spawn('from_thornwood', 29, 3, 0); b.spawn('from_crypt', 45, 33, 1); b.spawn('from_church', 45, 5, 0); b.spawn('from_epilogue', 29, 37, 1);

    /* ---- furnishings ---- */
    b.prop('sign', 3, 18, { solid: true, act: { type: 'lore', id: 'sign_gate', prompt: 'Read signpost' }, shadow: true });
    b.prop('well', 31, 21, { solid: true, shadow: true, act: { type: 'well', prompt: 'Peer into the well' } });
    b.prop('waystone', 26, 22, { solid: true, anim: 6, shadow: true, act: { type: 'waystone', id: 'hamlet', name: 'Hamlet Waystone', prompt: 'Touch the waystone' }, light: { r: 90, color: '#7a9ae8', flicker: 0.12, y: -26 }, waystone: true });
    [[25, 18], [33, 18], [25, 24], [33, 24]].forEach((p) => b.brazier(p[0], p[1]));
    b.brazier(44, 18); b.brazier(47, 18);
    b.prop('cart', 19, 23, { solid: true, shadow: true }); b.prop('barrel', 17, 14, { solid: true }); b.prop('barrel', 17, 15, { solid: true }); b.prop('crate', 31, 14, { solid: true }); b.prop('hayBale', 21, 22, { solid: true });
    b.prop('barrel', 32, 6, { solid: true });
    /* Marta's hut */
    b.prop('cauldron', 8, 9, { solid: true, anim: 6, act: { type: 'cauldron', prompt: 'Brew at the cauldron' }, light: { r: 40, color: '#5affb0', flicker: 0.2, y: -12 } });
    b.prop('bed', 13, 9, { solid: true }); b.prop('crate', 12, 7, { solid: true }); b.torch(8, 6, { light: { r: 70, color: '#ffa860', flicker: 0.3, y: -14, shadow: 'static' } });
    b.prop('window', 11, 6, { wall: true, anim: 4, light: { r: 50, color: '#ffa860', flicker: 0.1, y: 10 } });
    for (let i = 0; i < 5; i++) b.prop('herb', 6 + i * 2, 16, { variant: 0, deco: true });
    b.prop('poppet', 12, 17, {});
    b.prop('rug', 10, 10, { flat: true });
    /* the inn: a table still set, candles still lit */
    b.prop('table', 24, 9, { solid: true, anim: 5, act: { type: 'lore', id: 'dinner_table', prompt: 'Examine the table' }, light: { r: 78, color: '#ffc070', flicker: 0.25, y: -12 }, solidTiles: [[23, 8], [24, 8], [25, 8], [23, 9], [24, 9], [25, 9]] });
    b.prop('chest', 28, 6, { solid: true, act: { type: 'chest', id: 'inn_locket', items: [{ id: 'locket_heart', n: 1 }, { id: 'tincture', n: 1 }], prompt: 'Open chest' } });
    b.prop('window', 21, 4, { wall: true, anim: 4, light: { r: 56, color: '#e8863a', flicker: 0.12, y: 10 } }); b.prop('window', 27, 4, { wall: true, anim: 4, light: { r: 56, color: '#c23a45', flicker: 0.12, y: 10 } });
    b.prop('barrel', 20, 10, { solid: true }); b.prop('cobweb', 19, 5, { flat: true, corner: true, ox: -6, oy: -14 });
    b.prop('book', 20, 6, { act: { type: 'lore', id: 'church_door', prompt: 'Read notice' }, hidden: false, glow: '#e8c670' });
    /* burnt house + secret cellar */
    b.prop('hayBale', 8, 29, { solid: true }); b.prop('crate', 12, 28, { solid: true });
    b.prop('rock', 13, 29, { act: { type: 'secret', id: 'cellar', prompt: 'Press the loose stones', msg: 'The stones grind aside, revealing a root cellar.' }, hintSecret: true, variant: 0 });
    b.prop('chest', 17, 29, { solid: true, act: { type: 'chest', id: 'cellar_chest', items: [{ id: 'charm_lantern', n: 1 }, { id: 'raven_feather', n: 2 }, { id: 'grave_salt', n: 2 }], prompt: 'Open chest' } });
    b.prop('tablet', 16, 27, { solid: true, act: { type: 'lore', id: 'wren_drawing', prompt: 'Look at drawing' } }); b.prop('candle', 18, 28, { anim: 5, light: { r: 38, color: '#ffc070', flicker: 0.3, y: -6 }, ignite: true });
    /* church interior */
    b.prop('altar', 45, 6, { ox: 8, solid: true, shadow: true, solidTiles: [[44, 6], [45, 6], [46, 6], [47, 6]], act: { type: 'altar', prompt: 'Pray at the altar' } });
    [[41, 9], [41, 12], [48, 9], [48, 12], [41, 15], [48, 15]].forEach((p, i) => b.prop('pew', p[0], p[1], { solid: true, ox: i % 2 ? 0 : 8 }));
    b.candles(43, 6, {}); b.candles(48, 6, {});
    [41, 44, 47, 51].forEach((x, i) => b.prop('window', x, 4, { wall: true, anim: 4, light: { r: 64, color: i % 2 ? '#c23a45' : '#e8863a', flicker: 0.06, y: 12 } }));
    b.prop('banner', 40, 5, { wall: true }); b.prop('banner', 51, 5, { wall: true }); b.torch(39, 8); b.torch(39, 14);
    b.prop('book', 43, 5, { act: { type: 'lore', id: 'church_door', prompt: 'Read notice' }, glow: '#e8c670' });
    b.prop('sealDoor', 49, 10, { solid: true, anim: 4, id: 'blood_seal', act: { type: 'seal', prompt: 'Examine the seal' }, light: { r: 40, color: '#e03a48', flicker: 0.2, y: -16 }, shadow: true });
    b.prop('chest', 51, 7, { solid: true, act: { type: 'chest', id: 'reliquary', items: [{ id: 'grim_blood', n: 1 }, { id: 'rosary_weeping', n: 1 }], prompt: 'Open reliquary', locked: 'blood_seal' } });
    b.prop('tablet', 51, 13, { solid: true, act: { type: 'lore', id: 'reliquary_note', prompt: 'Read note' } }); b.candles(51, 15, {});
    b.prop('stairs', 45, 4, { hiddenUntil: 'altar_crypt', anim: 0, flat: false, light: { r: 50, color: '#7fa6ff', flicker: 0.15, y: -10 }, oy: 0 });
    /* graveyard */
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const x = [40, 42, 48, 50][c], y = 24 + r * 3; if (r === 3 && c > 1) continue; b.prop('grave', x + (r % 2), y, { variant: (r + c) % 4, solid: true, ox: ((r * 7 + c * 3) % 5) - 2, shadow: true }); }
    b.prop('angel', 48, 26, { solid: true, shadow: true, ox: 0 }); b.prop('angel', 43, 31, { solid: true, shadow: true });
    b.prop('grave', 51, 34, { variant: 2, solid: true }); b.prop('bones', 52, 36, {});
    b.prop('candle', 42, 25, { anim: 5, light: { r: 40, color: '#ffc070', flicker: 0.3, y: -6 }, ignite: true }); b.prop('candle', 49, 28, { anim: 5, light: { r: 40, color: '#ffc070', flicker: 0.3, y: -6 }, ignite: true });
    b.prop('gateIron', 45, 32, { solid: true, id: 'crypt_gate', act: { type: 'gate', key: 'crypt_key', flag: 'crypt_open', prompt: 'Unlock the crypt gate', msg: 'The key turns with a sound like a swallowed word.' }, shadow: true });
    b.prop('stairs', 45, 35, { solid: false, light: { r: 48, color: '#7fa6ff', flicker: 0.12, y: -12 } });
    b.torch(43, 33); b.torch(48, 33);
    b.prop('gateBig', 28, 38, { ox: 8, solid: true, id: 'drowned_gate', act: { type: 'biggate', prompt: 'Examine the gate' }, solidTiles: [[28, 38], [29, 38]], shadow: true });
    b.prop('bell', 53, 17, { solid: true, id: 'church_bell', act: { type: 'bell', prompt: 'Ring the bell' } });
    /* vegetation */
    b.forest(2, 2, 52, 36, ['oak', 'dead', 'autumn', 'dead'], 0.34, 4);
    b.deco(2, 2, 52, 36, 70, 'tuft', [G, M]); b.deco(2, 2, 52, 36, 26, 'bush', [G, M]); b.deco(2, 2, 52, 36, 10, 'deadbush', [G, M]); b.deco(2, 2, 52, 36, 10, 'rock', [G, M, D]); b.deco(2, 30, 30, 8, 6, 'fern', [M, G]);
    b.prop('stump', 21, 17, { solid: true }); b.prop('stump', 52, 21, { solid: true });
    b.prop('hanging', 14, 22, { solid: true, ox: 6 });
    /* enemies, ecology & life */
    b.enemy('wretch', 16, 23, { when: 'any' }); b.enemy('wretch', 44, 28, { when: 'night' }); b.enemy('wretch', 41, 30, { when: 'night' });
    b.enemy('hound', 18, 35, { when: 'night' }); b.enemy('hound', 22, 34, { when: 'night' });
    b.enemy('wisp', 32, 30, { when: 'dim' }); b.enemy('wisp', 36, 33, { when: 'dim' });
    [[40, 4], [42, 15], [10, 5], [26, 3], [48, 22], [14, 30]].forEach((p) => b.prop('crowspot', p[0], p[1], { crow: true }));
    b.npc('marta', 10, 16); b.npc('aldric', 45, 28); b.npc('wren', 9, 29);
    /* ambient light */
    b.light(29.5, 3.5, '#a8b8ff', 40, { shadowless: true }); b.light(45.5, 33.5, '#7fa6ff', 40);
    b.zone('The Laid Table', 18, 4, 13, 9, { discover: 'The Inn of the Laid Table', xp: 15 }); b.zone('Marta\'s Garden', 4, 6, 13, 13, { discover: 'Marta\'s Garden', xp: 10 });
    b.zone('Church', 38, 4, 16, 14, { discover: 'The Church of Saint Veyra', xp: 20 }); b.zone('Graveyard', 38, 22, 16, 16, { discover: 'The Graveyard', xp: 15 });
    b.zone('Cellar', 14, 26, 6, 7, { discover: 'A Hidden Root Cellar', xp: 40 });
    return b;
  };

  /* ========================================================= THORNWOOD */
  Maps.thornwood = function () {
    const b = new MapB('thornwood', 64, 48, G, 23);
    Object.assign(b, { name: 'Thornwood', music: 'forest', time: true, fog: 0.4, canopy: 0.85, theme: 'forest', weather: { clear: 0.25, fog: 0.45, rain: 0.22, storm: 0.08 }, ambMul: 0.8, floorUnder: G });
    b.border(TL, 3);
    for (let i = 0; i < 14; i++) b.blob(6 + Math.floor(b.rng() * 52), 5 + Math.floor(b.rng() * 38), 3 + Math.floor(b.rng() * 3), 2 + Math.floor(b.rng() * 3), U.pick([M, LE, LE, M]), i + 3);
    /* river and ford */
    b.fill(3, 21, 58, 1, MU); b.fill(3, 22, 58, 4, WA); b.fill(3, 23, 58, 2, DP); b.fill(3, 26, 58, 1, MU); b.fill(31, 21, 3, 6, BR); b.keep.push([3, 21, 58, 6]);
    /* paths */
    b.fill(31, 27, 3, 20, D); b.fill(31, 14, 3, 7, D); b.fill(12, 15, 20, 2, D); b.fill(34, 14, 10, 2, D);
    b.fill(8, 13, 2, 3, D);
    /* standing-stone pond, with a veiled bridge */
    b.blob(11, 9, 6, 4, WA, 4, 0.4); b.blob(11, 9, 2, 1, G, 6, 0.1); b.fill(11, 11, 1, 3, WA); b.keep.push([4, 3, 15, 13]);
    b.secret('veil', 11, 11, { to: BR, tiles: [[11, 11], [11, 12], [11, 13]], veil: true });
    b.fill(10, 14, 3, 1, D);
    /* coven clearing */
    b.fill(42, 6, 17, 13, LE); b.blob(50, 12, 6, 4, D, 7, 0.3); b.keep.push([41, 5, 19, 15]);
    /* hunter's cabin */
    b.house(19, 34, 9, 8, { wall: TI, floor: WO, gaps: [[27, 37], [27, 38]] }); b.fill(28, 37, 3, 2, D);
    /* warden's grove (behind a thicket) */
    b.fill(4, 33, 9, 12, M); b.fill(13, 38, 1, 2, M); b.fill(14, 38, 2, 6, D); b.fill(14, 43, 17, 2, D); b.keep.push([3, 32, 12, 14]); b.set(13, 38, M); b.set(13, 39, M);
    /* sunken chapel */
    b.fill(34, 30, 19, 2, D); b.fill(52, 32, 2, 4, D);
    b.house(47, 36, 11, 9, { wall: W, floor: F, gaps: [[52, 36], [53, 36]] }); b.set(47, 40, G); b.set(58, 38, G); b.fill(48, 37, 9, 2, F); b.fill(52, 35, 2, 1, D);
    /* entrance & exits */
    b.fill(31, 44, 3, 4, D);
    b.exit(31, 47, 3, 1, 'hamlet', 'from_thornwood'); b.exit(53, 44, 2, 1, 'catacombs', 'from_chapel');
    b.spawn('from_hamlet', 32, 45, 1); b.spawn('from_catacombs', 53, 42, 1);
    /* ---- features ---- */
    b.prop('waystone', 35, 29, { solid: true, anim: 6, shadow: true, act: { type: 'waystone', id: 'thornwood', name: 'Thornwood Waystone', prompt: 'Touch the waystone' }, light: { r: 96, color: '#7a9ae8', flicker: 0.12, y: -26 }, waystone: true });
    b.prop('sign', 32, 44, { solid: true, ox: 22, act: { type: 'lore', id: 'sign_gate', prompt: 'Read signpost' } });
    /* stones */
    [['hunter', 5, 10], ['crow', 17, 10], ['crown', 11, 3]].forEach((s) => b.prop('standing', s[1], s[2], { solid: true, shadow: true, id: 'stone_' + s[0], act: { type: 'stone', stone: s[0], prompt: 'Touch the standing stone' }, light: { r: 44, color: '#7a9ae8', flicker: 0.1, y: -24 }, glowNight: true }));
    b.prop('tablet', 8, 15, { solid: true, act: { type: 'lore', id: 'stones_inscription', prompt: 'Read inscription' } });
    b.prop('altar', 11, 9, { solid: true, ox: 0, shadow: false, solidTiles: [[10, 9], [11, 9], [12, 9]], act: { type: 'altar_star', prompt: 'Look upon the altar' }, hiddenUntil: 'veil' });
    b.prop('chest', 11, 8, { solid: true, act: { type: 'chest', id: 'astral_chest', items: [{ id: 'grim_astral', n: 1 }, { id: 'lens_astral', n: 1 }], prompt: 'Open chest' } });
    /* coven */
    b.prop('ritual', 50, 12, { flat: true, anim: 8, oy: 6 }); b.prop('campfire', 50, 12, { solid: true, anim: 6, light: { r: 100, color: '#ff9a4a', flicker: 0.3, y: -10, shadow: 'static' }, ember: true, ignite: true });
    b.prop('cauldron', 54, 11, { solid: true, anim: 6, act: { type: 'cauldron', prompt: 'Brew at the cauldron' }, light: { r: 46, color: '#5affb0', flicker: 0.2, y: -12 } });
    b.prop('tablet', 46, 9, { solid: true, act: { type: 'lore', id: 'coven_altar', prompt: 'Read altar' } });
    [[44, 8], [57, 9], [45, 16], [56, 16]].forEach((p) => b.prop('poppet', p[0], p[1], { ox: 4 }));
    b.prop('candles', 48, 12, { anim: 5, light: { r: 40, color: '#e8a0ff', flicker: 0.3, y: -6 } }); b.prop('candles', 52, 14, { anim: 5, light: { r: 40, color: '#e8a0ff', flicker: 0.3, y: -6 } });
    b.prop('hanging', 49, 7, { solid: true, ox: 6 });
    /* hunter's cabin */
    b.prop('chest', 21, 36, { solid: true, act: { type: 'chest', id: 'hunter_chest', items: [{ id: 'cloak_wolf', n: 1 }, { id: 'tincture', n: 1 }], prompt: 'Open chest' } });
    b.prop('bed', 25, 39, { solid: true }); b.prop('bones', 24, 39, { ox: 8 }); b.prop('tablet', 23, 35, { solid: true, act: { type: 'lore', id: 'hunter_note', prompt: 'Read the last page' } }); b.prop('candle', 22, 39, { anim: 5, light: { r: 36, color: '#ffc070', flicker: 0.3, y: -6 }, ignite: true });
    b.torch(21, 34);
    /* the grove */
    b.prop('thicket', 13, 38, { ox: 8, solid: true, shadow: true, id: 'thicket', act: { type: 'thicket', prompt: 'Examine the thicket' }, solidTiles: [[13, 38], [13, 39]] });
    b.prop('tablet', 12, 36, { solid: true, act: { type: 'lore', id: 'stag_grove', prompt: 'Read rune' } });
    b.prop('chest', 6, 35, { solid: true, act: { type: 'chest', id: 'druid_chest', items: [{ id: 'grim_druid', n: 1 }, { id: 'verdant_draught', n: 2 }], prompt: 'Open chest' } });
    b.prop('chest', 5, 42, { solid: true, act: { type: 'chest', id: 'staff_chest', items: [{ id: 'staff_yew', n: 1 }], prompt: 'Open chest' } });
    b.prop('shroud', 8, 36, {}); [[7, 40], [9, 41], [6, 38]].forEach((p) => b.prop('shroud', p[0], p[1], { light: { r: 34, color: '#5ad0c0', flicker: 0.2, y: -4 }, anim: 3 }));
    /* chapel */
    b.prop('rubble', 53, 43, { ox: 8, solid: true, id: 'chapel_rubble', solidTiles: [[52, 43], [53, 43]], act: { type: 'rubble', prompt: 'Examine the rubble' } });
    b.prop('stairs', 53, 43, { oy: 0, light: { r: 44, color: '#7fa6ff', flicker: 0.12, y: -12 } });
    b.prop('grave', 50, 38, { solid: true, variant: 0 }); b.prop('grave', 55, 39, { solid: true, variant: 1 }); b.prop('bones', 54, 38, {}); b.torch(49, 37); b.torch(56, 37);
    b.prop('chest', 49, 42, { solid: true, act: { type: 'chest', id: 'chapel_chest', items: [{ id: 'chapel_sigil', n: 1 }, { id: 'bone_dust', n: 3 }], prompt: 'Open chest' } });
    /* wolfsbane for Marta */
    [[20, 30], [44, 28], [9, 19], [36, 41], [52, 27], [24, 11], [38, 9]].forEach((p, i) => b.prop('herb', p[0], p[1], { pick: 'wolfsbane', id: 'herb' + i, act: { type: 'pickup', item: 'wolfsbane', n: 1, prompt: 'Pick wolfsbane' } }));
    /* mushrooms and light */
    [[22, 28], [24, 29], [38, 38], [15, 19], [49, 29]].forEach((p) => b.prop('shroud', p[0], p[1], { anim: 3, light: { r: 34, color: '#5ad0c0', flicker: 0.2, y: -4 } }));
    b.forest(3, 3, 58, 42, ['thorn', 'oak', 'dead', 'pine', 'thorn'], 0.62, 3);
    b.deco(3, 3, 58, 42, 110, 'tuft', [G, M, LE]); b.deco(3, 3, 58, 42, 34, 'fern', [M, G]); b.deco(3, 3, 58, 42, 26, 'bush', [G, M]); b.deco(3, 3, 58, 42, 12, 'rock', [G, M, LE]); b.deco(3, 3, 58, 42, 8, 'stump', [G, M]);
    /* creatures */
    b.enemy('wretch', 30, 36, { when: 'any' }); b.enemy('wretch', 40, 17, { when: 'any' });
    b.enemy('hound', 38, 40, { when: 'any', sleeps: true }); b.enemy('hound', 40, 41, { when: 'any', sleeps: true }); b.enemy('hound', 36, 42, { when: 'any', sleeps: true });
    b.enemy('wisp', 26, 20, { when: 'dim' }); b.enemy('wisp', 40, 28, { when: 'dim' }); b.enemy('wisp', 14, 19, { when: 'dim' });
    b.enemy('stag', 8, 39, { when: 'any', boss: true, id: 'stag', dormant: true });
    [[22, 14], [48, 22], [16, 30], [44, 34], [30, 8], [8, 28]].forEach((p) => b.prop('crowspot', p[0], p[1], { crow: true }));
    b.npc('vesna', 50, 14); b.npc('sister', 46, 12); b.npc('sister', 54, 14); b.npc('sister', 50, 9);
    b.zone('Stone Circle', 4, 3, 15, 13, { discover: 'The Stone Circle', xp: 20 }); b.zone('Coven', 41, 5, 19, 15, { discover: 'The Coven Clearing', xp: 25 }); b.zone('Grove', 3, 32, 12, 14, { discover: 'The Warden\'s Grove', xp: 50 });
    b.zone('Cabin', 19, 34, 9, 8, { discover: 'The Hunter\'s Cabin', xp: 15 }); b.zone('Chapel', 47, 36, 11, 9, { discover: 'The Sunken Chapel', xp: 25 }); b.zone('Ford', 28, 20, 8, 8, { discover: 'The Thornwood Ford', xp: 10 });
    return b;
  };

  /* ========================================================= CATACOMBS OF THE PALE CHOIR */
  Maps.catacombs = function () {
    const b = new MapB('catacombs', 60, 46, CW, 37);
    Object.assign(b, { name: 'Catacombs of the Pale Choir', music: 'crypt', time: false, indoor: true, fog: 0.12, canopy: 0, theme: 'crypt', ambient: '#241f36', weather: {}, floorUnder: CR });
    /* rooms */
    b.fill(3, 17, 10, 11, CR); b.fill(13, 21, 6, 3, CR); b.fill(19, 14, 15, 17, BO); b.fill(22, 6, 7, 7, CR); b.fill(25, 13, 1, 1, CR); b.fill(22, 32, 7, 6, CR);
    b.fill(35, 18, 8, 9, CR); b.fill(43, 21, 1, 3, CR); b.fill(44, 9, 15, 26, CR); b.fill(50, 11, 3, 23, CA); b.fill(50, 35, 3, 8, CR);
    b.fill(34, 21, 1, 3, CR); b.fill(3, 17, 1, 0, CR);
    b.secret('niche', 25, 31, { to: CR }); b.set(25, 31, CW);
    b.secret('vaultside', 25, 13, { to: CR }); b.set(25, 13, CR); // vault is open: optional encounter
    b.exit(3, 21, 1, 3, 'hamlet', 'from_crypt'); b.exit(2, 22, 1, 2, 'hamlet', 'from_crypt');
    b.fill(50, 43, 3, 1, CR); b.exit(50, 43, 3, 1, 'thornwood', 'from_catacombs');
    b.spawn('from_hamlet', 5, 22, 3); b.spawn('from_church', 5, 25, 3); b.spawn('from_chapel', 51, 41, 1);
    b.fill(3, 21, 1, 3, CR);
    /* entrance hall */
    b.prop('stairs', 3, 23, { oy: 0, light: { r: 50, color: '#a8c0ff', flicker: 0.1, y: -12 }, face: 'west' });
    b.prop('waystone', 10, 22, { solid: true, anim: 6, shadow: true, act: { type: 'waystone', id: 'catacombs', name: 'Catacomb Waystone', prompt: 'Touch the waystone' }, light: { r: 96, color: '#7a9ae8', flicker: 0.12, y: -26 }, waystone: true });
    [[5, 17], [11, 17], [5, 27], [11, 27], [16, 21], [16, 23], [22, 14], [30, 14], [22, 30], [30, 30], [38, 18], [38, 26], [47, 9], [55, 9], [47, 34], [55, 34]].forEach((p) => b.torch(p[0], p[1]));
    b.prop('coffin', 7, 19, { solid: true, shadow: true, solidTiles: [[6, 19], [7, 19], [8, 19]] }); b.prop('coffin', 7, 26, { solid: true, shadow: true, solidTiles: [[6, 26], [7, 26], [8, 26]] });
    b.prop('sarcophagusOpen', 11, 20, { solid: true, shadow: true, solidTiles: [[10, 20], [11, 20], [12, 20]] });
    b.prop('cobweb', 4, 18, { flat: true, ox: -6, oy: -14 }); b.prop('cobweb', 12, 18, { flat: true, ox: 6, oy: -14, flip: true });
    b.prop('skull', 6, 22, {}); b.prop('bones', 9, 24, {});
    /* corridor + ossuary */
    b.prop('tablet', 18, 21, { solid: true, act: { type: 'lore', id: 'crypt_tablet', prompt: 'Read tablet' } });
    [[22, 17], [26, 17], [30, 17], [22, 24], [30, 24], [26, 28], [22, 28], [30, 28]].forEach((p) => b.prop('pillar', p[0], p[1], { solid: true, shadow: true, tall: true }));
    [[21, 29, 'low'], [31, 15, 'high'], [26, 22, 'mid']].forEach((s) => b.prop('bell', s[0], s[1], { solid: true, id: 'bell_' + s[2], act: { type: 'bellnote', note: s[2], prompt: 'Strike the bell' }, shadow: true }));
    for (let i = 0; i < 9; i++) b.prop('skullNiche', 20 + i * 1.6 | 0, 13, { wall: true });
    for (let i = 0; i < 6; i++) b.prop('skullNiche', 20 + i * 2.4 | 0, 31, { wall: true, secretNiche: i === 3 });
    b.prop('skullNiche', 25, 31, { wall: true, id: 'cracked_niche', act: { type: 'secret', id: 'niche', prompt: 'Press the cracked skull', msg: 'The skull sinks into the wall. Somewhere, stone grinds.' }, crack: true });
    b.prop('coffin', 33, 19, { solid: true, shadow: true, solidTiles: [[32, 19], [33, 19], [34, 19]] }); b.prop('sarcophagusOpen', 20, 16, { solid: true, shadow: true, solidTiles: [[19, 16], [20, 16], [21, 16]] });
    b.deco(19, 14, 15, 17, 22, 'bones', [BO]); b.deco(19, 14, 15, 17, 8, 'skull', [BO]); b.deco(19, 14, 15, 17, 6, 'cobweb', [BO], { flat: true });
    b.prop('gateIron', 34, 21, { solid: true, id: 'choir_gate_a', gateGroup: 'choir_gate' }); b.prop('gateIron', 34, 22, { solid: true, id: 'choir_gate_b', gateGroup: 'choir_gate' }); b.prop('gateIron', 34, 23, { solid: true, id: 'choir_gate_c', gateGroup: 'choir_gate', shadow: true });
    /* cantor's vault (optional encounter) */
    b.prop('altar', 25, 8, { solid: true, shadow: true, solidTiles: [[24, 8], [25, 8], [26, 8]] }); b.prop('chest', 25, 7, { solid: true, act: { type: 'chest', id: 'necro_chest', items: [{ id: 'grim_necro', n: 1 }, { id: 'soul_ash', n: 2 }], prompt: 'Open chest' } });
    b.candles(23, 8, {}); b.candles(27, 8, {}); b.prop('banner', 22, 6, { wall: true }); b.prop('banner', 28, 6, { wall: true }); b.prop('cobweb', 22, 7, { flat: true, ox: -6, oy: -14 });
    /* secret ossuary room */
    b.prop('chest', 25, 35, { solid: true, act: { type: 'chest', id: 'secret_chest', items: [{ id: 'misericord', n: 1 }, { id: 'page_choir', n: 1 }, { id: 'shroud_ash', n: 1 }], prompt: 'Open chest' } }); b.candles(23, 34, {}); b.candles(27, 34, {});
    b.prop('coffin', 24, 37, { solid: true, solidTiles: [[23, 37], [24, 37], [25, 37]] }); b.prop('skull', 27, 36, {});
    /* antechamber */
    b.prop('waystone', 39, 22, { solid: true, anim: 6, shadow: true, act: { type: 'waystone', id: 'choirgate', name: 'Antechamber Waystone', prompt: 'Touch the waystone' }, light: { r: 96, color: '#7a9ae8', flicker: 0.12, y: -26 }, waystone: true });
    b.prop('tablet', 36, 19, { solid: true, act: { type: 'lore', id: 'abbot_journal', prompt: 'Read the journal' } });
    b.prop('tablet', 41, 19, { solid: true, act: { type: 'lore', id: 'tomas_journal', prompt: 'Read the journal' } });
    b.prop('banner', 36, 18, { wall: true }); b.prop('banner', 41, 18, { wall: true }); b.prop('candelabra', 37, 25, { solid: true, anim: 6, light: { r: 70, color: '#ffc070', flicker: 0.25, y: -26, shadow: 'static' }, ignite: true }); b.prop('candelabra', 41, 25, { solid: true, anim: 6, light: { r: 70, color: '#ffc070', flicker: 0.25, y: -26, shadow: 'static' }, ignite: true });
    b.prop('gateIron', 43, 21, { solid: false, id: 'boss_gate_a', gateGroup: 'boss_gate' }); b.prop('gateIron', 43, 22, { solid: false, id: 'boss_gate_b', gateGroup: 'boss_gate' }); b.prop('gateIron', 43, 23, { solid: false, id: 'boss_gate_c', gateGroup: 'boss_gate' });
    /* the choir hall */
    b.prop('organ', 51, 11, { ox: 8, solid: true, shadow: true, solidTiles: [[48, 10], [49, 10], [50, 10], [51, 10], [52, 10], [53, 10], [54, 10]], tall: true });
    [[47, 14], [47, 20], [47, 26], [47, 31], [55, 14], [55, 20], [55, 26], [55, 31]].forEach((p) => b.prop('pillar', p[0], p[1], { solid: true, shadow: true, tall: true }));
    [[46, 12], [56, 12], [46, 33], [56, 33]].forEach((p) => b.prop('candelabra', p[0], p[1], { solid: true, anim: 6, light: { r: 86, color: '#ffc070', flicker: 0.25, y: -26, shadow: 'static' }, ignite: true, arenaLight: true }));
    b.prop('chandelier', 51, 17, { fg: true, anim: 6, light: { r: 140, color: '#ffc070', flicker: 0.2, y: 20, shadow: 'static' }, arenaLight: true }); b.prop('chandelier', 51, 27, { fg: true, anim: 6, light: { r: 140, color: '#ffc070', flicker: 0.2, y: 20, shadow: 'static' }, arenaLight: true });
    b.prop('banner', 45, 9, { wall: true }); b.prop('banner', 57, 9, { wall: true }); b.prop('banner', 49, 9, { wall: true }); b.prop('banner', 53, 9, { wall: true });
    b.prop('gateIron', 50, 35, { solid: true, id: 'exit_gate_a', gateGroup: 'exit_gate' }); b.prop('gateIron', 51, 35, { solid: true, id: 'exit_gate_b', gateGroup: 'exit_gate' }); b.prop('gateIron', 52, 35, { solid: true, id: 'exit_gate_c', gateGroup: 'exit_gate' });
    b.prop('stairs', 51, 43, { oy: 0, light: { r: 44, color: '#7fa6ff', flicker: 0.12, y: -12 } });
    b.prop('waystone', 52, 38, { solid: true, anim: 6, shadow: true, act: { type: 'waystone', id: 'choirhall', name: 'Choir Hall Waystone', prompt: 'Touch the waystone' }, light: { r: 96, color: '#7a9ae8', flicker: 0.12, y: -26 }, waystone: true, hiddenUntil: 'boss_done' });
    b.prop('rubble', 50, 41, { solid: false, id: 'chapel_push', hiddenUntil: 'never' });
    b.zone('Arena', 44, 9, 15, 26, { arena: true }); b.zone('Ossuary', 19, 14, 15, 17, { discover: 'The Ossuary', xp: 20 }); b.zone('Vault', 22, 6, 7, 7, { discover: 'The Cantor\'s Vault', xp: 30 }); b.zone('Hidden', 22, 32, 7, 6, { discover: 'The Silent Reliquary', xp: 45 });
    b.zone('Antechamber', 35, 18, 8, 9, { discover: 'The Antechamber', xp: 15 });
    /* enemies */
    b.enemy('wretch', 8, 20, { when: 'any' }); b.enemy('wretch', 9, 25, { when: 'any' });
    b.enemy('sentinel', 24, 20, { when: 'any' }); b.enemy('sentinel', 28, 25, { when: 'any' }); b.enemy('sentinel', 24, 9, { when: 'any' }); b.enemy('hexcaller', 27, 9, { when: 'any' }); b.enemy('hexcaller', 31, 21, { when: 'any' });
    b.enemy('choirmaster', 51, 19, { when: 'any', boss: true, id: 'choirmaster', dormant: true });
    return b;
  };
})();

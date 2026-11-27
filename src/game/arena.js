/* Ashen Hollow - The Gauntlet of Ash: an arena of waves, opened once the Warden of Thorns has fallen.
   Seven waves with a champion at the end. Clearing it sets arena_clear (read by the ending) and pays out. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, ID = AH.Tiles.ID, T = AH.T;
  const g = () => AH.G, safe = (fn) => { try { return fn(); } catch (e) { if (AH.errors) AH.errors.push('arena: ' + e); } };
  const item = (o) => (AH.Items[o.id] = Object.assign({ rarity: 0, stack: false, scheme: 'neutral' }, o));
  AH.Lore.arena_sign = { id: 'arena_sign', type: 'inscription', title: 'The Gauntlet Gate', text: 'THE GAUNTLET OF ASH.\nOpened when the Warden of Thorns lay down.\nSeven waves, then the Champion. Nothing here is a memory; it is only what the Hollow remembers of being afraid.\nDying here costs you nothing but the walk home.' };
  AH.Lore.arena_end = { id: 'arena_end', type: 'note', title: 'Champion of Ash', text: 'The champion was never a person. It was every blade that was ever raised in the Hollow, gathered into one shape and told to stand in a ring until someone made it stop.' };
  item({ id: 'ash_crown', name: 'Crown of Ash', type: 'relic', rarity: 3, icon: 'rune', scheme: 'blood', desc: 'A circlet of hardened cinders, still warm. Champions of the Gauntlet wear it. It lends the wearer the arena\'s grim appetite.', mods: { dmg: 0.1, leech: 0.04 } });

  const WAVES = [
    [['wretch', 3]], [['wretch', 3], ['hound', 2]], [['wisp', 3], ['hexcaller', 1]], [['hound', 4], ['wretch', 2]],
    [['sentinel', 1], ['hexcaller', 2]], [['wraith', 4], ['wisp', 2]], [['sentinel', 2], ['hound', 3], ['hexcaller', 1]],
  ];
  const orig = AH.Maps.hamlet;
  AH.Maps.arena = function () {
    const MapB = orig().constructor, C = ID.COBBLE, F = ID.FLAG, R = ID.RUNE, CR = ID.CRYPT, W = ID.WALL, D = ID.DIRT;
    const b = new MapB('arena', 36, 30, CR, 5);
    Object.assign(b, { name: 'Gauntlet of Ash', music: 'crypt', time: false, indoor: true, fog: 0.1, theme: 'crypt', weather: { clear: 1 }, floorUnder: CR });
    b.border(ID.CWALL, 3); b.fill(8, 7, 20, 16, C); b.fill(10, 9, 16, 12, F); b.fill(14, 11, 8, 8, CR); b.fill(16, 13, 4, 4, R);
    b.fill(17, 24, 2, 3, F);
    b.exit(17, 28, 2, 1, 'hamlet', 'from_arena'); b.spawn('start', 17, 25, 1); b.spawn('from_hamlet', 17, 25, 1);
    [[9, 8], [26, 8], [9, 21], [26, 21], [17, 8], [20, 21]].forEach((p) => b.brazier(p[0], p[1]));
    [[12, 4], [16, 4], [20, 4], [24, 4]].forEach((p) => b.torch(p[0], p[1]));
    b.prop('banner', 14, 3, { wall: true }); b.prop('banner', 21, 3, { wall: true });
    b.zone('Arena', 8, 7, 20, 16, { discover: 'The Gauntlet of Ash', xp: 20 });
    return b;
  };
  /* gate in the hamlet, east end of the road */
  const h0 = AH.Maps.hamlet;
  AH.Maps.hamlet = function () {
    const b = h0.apply(this, arguments);
    safe(() => {
      b.exit(52, 19, 1, 2, 'arena', 'from_hamlet', { cond: 'stag_done' }); b.spawn('from_arena', 50, 20, 2);
      b.brazier(51, 18); b.brazier(51, 21);
      b.prop('sign', 49, 19, { solid: true, shadow: true, act: { type: 'lore', id: 'arena_sign', prompt: 'Read the gate' } });
    });
    return b;
  };

  const st = () => (g().arenaRun || (g().arenaRun = { wave: 0, alive: 0, state: 'idle', t: 0, deaths: 0 }));
  const spawnWave = (w, n) => {
    const spec = n >= WAVES.length ? [['sentinel', 1]] : WAVES[n], pts = [];
    spec.forEach((s) => { for (let i = 0; i < s[1]; i++) pts.push(s[0]); });
    pts.forEach((type, i) => {
      const a = (i / pts.length) * 6.283 + n, tx = 18 + Math.round(Math.cos(a) * 7), ty = 15 + Math.round(Math.sin(a) * 4), def = AH.EnemyDefs[type];
      const e = new AH.Enemy(w, def, tx, ty, {}); e.arena = true; e.sleeping = false; e.dormant = false; e.state = 'chase';
      if (n >= WAVES.length) { e.def = Object.assign({}, def, { name: 'Champion of Ash', xp: 600 }); e.hp = e.maxHp = 420; e.champion = true; e.r = def.r + 2; }
      else { e.hp = e.maxHp = Math.round(e.hp * (1 + n * 0.08)); }
      w.enemies.push(e); AH.VFX && AH.VFX.pop && AH.VFX.pop(e.x, e.y, '#e8863a');
    });
    return pts.length;
  };
  const Wp = AH.World.prototype, upd0 = Wp.update;
  Wp.update = function (dt) {
    const r = upd0.apply(this, arguments);
    safe(() => {
      if (this.areaId !== 'arena') return; const G = g(), s = st(), p = G.player; if (!p || p.dead) return;
      const inRing = p.x > 8 * T && p.x < 28 * T && p.y > 7 * T && p.y < 23 * T;
      if (s.state === 'idle' && inRing && p.y < 21 * T) { s.state = 'intro'; s.t = 2.2; G.toast('The Gauntlet of Ash begins.', '#e8863a'); AH.Audio.sfx('bell', { v: 0.6 }); }
      else if (s.state === 'intro') { s.t -= dt; if (s.t <= 0) { s.alive = spawnWave(this, s.wave); s.state = 'fight'; G.toast(s.wave >= WAVES.length ? 'The Champion of Ash rises.' : 'Wave ' + (s.wave + 1) + ' of ' + WAVES.length, '#e8c670'); } }
      else if (s.state === 'fight') {
        const left = this.enemies.filter((e) => e.arena && !e.dead && !e.remove).length; s.left = left;
        if (left === 0) {
          s.wave++; if (s.wave > WAVES.length) { s.state = 'won'; G.flags.arena_clear = true; G.learnLore('arena_end'); G.addXP(450); if (!G.flags.arena_paid) { G.flags.arena_paid = true; G.giveItem('ash_crown', 1); } G.toast('Gauntlet cleared. The Crown of Ash is yours.', '#f6e2a8'); AH.Audio.sfx('save'); }
          else { s.state = 'intro'; s.t = 3; G.addXP(30 + s.wave * 10, true); const h = Math.round(p.maxHp * 0.2); p.hp = Math.min(p.maxHp, p.hp + h); G.toast('Wave cleared. +' + h + ' health', '#9ae890'); }
        }
      }
    });
    return r;
  };
  /* leaving or dying resets the run (progress is not kept between visits, the clear flag is) */
  const ev0 = AH.Events.onEnter; AH.Events.onEnter = function (w, id) { if (id === 'arena') safe(() => { g().arenaRun = { wave: 0, alive: 0, state: 'idle', t: 0 }; }); return ev0.apply(this, arguments); };
  /* wave readout on the HUD */
  const hud0 = AH.UI.hud; AH.UI.hud = function (gx, Gm, time) {
    const r = hud0.apply(this, arguments);
    safe(() => { const w = Gm.world; if (!w || w.areaId !== 'arena' || Gm.screen) return; const s = st(), txt = s.state === 'fight' ? (s.wave >= WAVES.length ? 'CHAMPION' : 'WAVE ' + (s.wave + 1) + '/' + WAVES.length) + '   foes ' + (s.left || 0) : s.state === 'won' ? 'GAUNTLET CLEARED' : s.state === 'intro' ? 'GET READY' : 'STEP INTO THE RING'; AH.Font.draw(gx, txt, AH.W / 2, 22, '#e8c670', { align: 'center', outline: '#05040a' }); });
    return r;
  };
  AH.Arena = { waves: WAVES.length };
})();

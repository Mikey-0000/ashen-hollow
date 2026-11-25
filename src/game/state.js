/* Ashen Hollow - global game state (AH.G): flags, inventory, progression, clock, toasts, persistence.
   All gameplay systems talk to the player and the world through this object. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U;
  const SAVE_KEY = 'ashen_hollow_v1_slot', SET_KEY = 'ashen_hollow_v1_settings';
  const DEFAULT_SETTINGS = { master: 0.7, music: 0.55, sfx: 0.8, shake: 1, hitstop: 1, particles: 1, reduceFlash: false, scale: 'fit', display: 'smooth', fullHud: true, showHints: true };

  const G = (AH.G = {
    settings: Object.assign({}, DEFAULT_SETTINGS), flags: {}, inv: {}, equip: { weapon: 'sickle_rust', cloak: 'mantle_pilgrim', relic1: null, relic2: null }, spells: [], slots: [null, null, null, null], sel: 0,
    skills: {}, skillPoints: 0, xp: 0, level: 1, fusions: [], waystones: {}, lore: {}, choices: [], seen: {}, kills: 0, toasts: [], hour: 17.5, day: 1, clock: 0, slowmo: 0, hitstop: 0, areaState: {}, visited: {}, chestOpened: {},
    mode: 'title', world: null, player: null, fade: { a: 0, dir: 0, cb: null }, origin: null, playtime: 0, deaths: 0, lastWaystone: null, area: 'hamlet', screen: null, dialogue: null, prompt: null, dayMarks: {},
  });

  /* ---------- settings ---------- */
  G.loadSettings = function () { try { const s = JSON.parse(localStorage.getItem(SET_KEY) || 'null'); if (s) Object.assign(G.settings, s); } catch (e) {} G.applySettings(); };
  G.saveSettings = function () { try { localStorage.setItem(SET_KEY, JSON.stringify(G.settings)); } catch (e) {} };
  G.applySettings = function () { const s = G.settings; AH.Audio.vol.master = s.master; AH.Audio.vol.music = s.music; AH.Audio.vol.sfx = s.sfx; AH.Audio.applyVolumes && AH.Audio.applyVolumes(); AH.Particles.density = s.particles; };

  /* ---------- flags & log ---------- */
  G.setFlag = (k, v) => { G.flags[k] = v === undefined ? true : v; if (G.world) G.world.refreshOpenState(); };
  G.logChoice = (t) => { G.choices.push({ day: G.day, text: t }); };
  G.toast = (text, col) => { G.toasts.push({ text, col: col || '#e6dcc4', t: 0 }); if (G.toasts.length > 5) G.toasts.shift(); };
  G.learnLore = (id) => { if (!AH.Lore[id] || G.lore[id]) return false; G.lore[id] = G.day; G.toast('Codex: ' + AH.Lore[id].title, '#c8b890'); AH.Audio.sfx('page'); return true; };
  G.visit = (a) => { G.visited[a] = true; G.area = a; };
  G.secretOpen = (id) => !!(G.world && G.world.secretOpen(id));

  /* ---------- items ---------- */
  G.countItem = (id) => G.inv[id] || 0;
  G.giveItem = (id, n, quiet) => {
    const def = AH.Items[id]; if (!def) return; n = n || 1;
    if (def.type === 'grimoire') { G.learnSchool(def.school, true); G.toast('Learned: ' + AH.Schools[def.school].name, AH.Schools[def.school].col); AH.Audio.sfx('learn'); G.inv[id] = 1; return; }
    if (def.type === 'forbidden') { G.unlockSpell(def.teach); G.inv[id] = 1; G.toast('Forbidden rite learned: ' + AH.Spells[def.teach].name, '#d04050'); AH.Audio.sfx('learn'); return; }
    G.inv[id] = (G.inv[id] || 0) + n;
    if (!quiet || true) G.toast(def.name + (n > 1 ? ' x' + n : ''), AH.Rarity[def.rarity].col);
    AH.Audio.sfx('pickup');
    if (def.type === 'weapon' || def.type === 'cloak') { if (!G.equip[def.type] || def.rarity > AH.Items[G.equip[def.type]].rarity) { /* offer, don't auto-equip */ } }
    G.player && G.player.recalc();
  };
  G.takeItem = (id, n) => { G.inv[id] = Math.max(0, (G.inv[id] || 0) - (n || 1)); if (!G.inv[id]) delete G.inv[id]; };
  G.equipItem = (id) => {
    const d = AH.Items[id]; if (!d || !G.inv[id]) return;
    if (d.type === 'weapon' || d.type === 'cloak') G.equip[d.type] = id;
    else if (d.type === 'relic') { if (G.equip.relic1 === id) G.equip.relic1 = null; else if (G.equip.relic2 === id) G.equip.relic2 = null; else if (!G.equip.relic1) G.equip.relic1 = id; else if (!G.equip.relic2) G.equip.relic2 = id; else G.equip.relic1 = id; G.player.recalc(); return; }
    G.player.recalc(); AH.Audio.sfx('equip');
  };
  G.useItem = (id) => {
    const d = AH.Items[id], p = G.player; if (!d || !d.use || !G.countItem(id)) return false;
    const u = d.use; let did = false;
    if (u.heal && p.hp < p.maxHp) { p.heal(u.heal); did = true; }
    if (u.aether && p.aether < p.aetherMax()) { p.aether = Math.min(p.aetherMax(), p.aether + u.aether); did = true; }
    if (u.verd && p.verd < p.verdMax()) { p.verd = Math.min(p.verdMax(), p.verd + u.verd); did = true; }
    if (u.corruption && p.corruption > 0) { G.addCorruption(u.corruption, true); did = true; }
    if (did) { G.takeItem(id, 1); AH.Audio.sfx('drink'); p.fxBurst && p.fxBurst('#e8e0c0'); } else G.toast('No need.', '#8a8478');
    return did;
  };

  /* ---------- progression ---------- */
  G.addXP = (n, quiet) => {
    G.xp += n;
    while (G.level < AH.MAX_LEVEL && G.xp >= AH.xpFor(G.level)) { G.xp -= AH.xpFor(G.level); G.level++; G.skillPoints++; G.player.recalc(); G.player.heal(999); G.toast('Level ' + G.level + ' - a skill point awaits (T)', '#f0d890'); AH.Audio.sfx('levelup'); }
  };
  G.learnSchool = (school, quiet) => {
    const p = G.player; p.schools[school] = true;
    Object.values(AH.Spells).forEach((s) => { if (s.school === school && s.tier === 1 && !s.forbidden) G.unlockSpell(s.id, true); });
    if (school === 'necro' && !p.soulsInit) { p.soulsInit = true; p.souls = 3; } if (school === 'druid') p.verd = Math.max(p.verd, 4); if (school === 'astral') p.aether = Math.max(p.aether, 40);
    p.recalc();
  };
  G.unlockSpell = (id, quiet) => {
    if (!AH.Spells[id] || G.spells.indexOf(id) >= 0) return; G.spells.push(id);
    const slot = G.slots.indexOf(null); if (slot >= 0) G.slots[slot] = id;
    if (!quiet) { G.toast('Spell: ' + AH.Spells[id].name, AH.Schools[AH.Spells[id].school].col); AH.Audio.sfx('learn'); }
  };
  G.canBuy = (id) => { const k = AH.Skills[id]; return k && !G.skills[id] && G.skillPoints >= k.cost && k.req.every((r) => G.skills[r]); };
  G.buySkill = (id) => { if (!G.canBuy(id)) return false; const k = AH.Skills[id]; G.skillPoints -= k.cost; G.skills[id] = 1; if (k.unlock) G.unlockSpell(k.unlock); G.player.recalc(); AH.Audio.sfx('learn'); return true; };
  G.addCorruption = (n, cleanse) => {
    const p = G.player; if (n > 0) n *= Math.max(0.2, 1 + p.mod('corruptGain')); const was = p.corruption; p.corruption = U.clamp(p.corruption + n, 0, 100);
    if (n > 0 && p.corruption >= 25 && was < 25) G.toast('The taint takes hold.', '#9a5aba'); if (p.corruption >= 50 && was < 50) G.toast('Your shadow lags behind you.', '#b04aba'); if (p.corruption >= 75 && was < 75) G.toast('Something answers when you cast.', '#d0407a');
    p.recalc();
  };
  G.fuse = (a, b) => { const s = AH.makeFusion(a, b); if (!s) return null; if (G.fusions.indexOf(s.id) < 0) { if (G.countItem('soul_ash') < 1) return 'ash'; G.takeItem('soul_ash', 1); G.fusions.push(s.id); AH.getSpell(s.id); G.toast('Fused: ' + s.name, '#e0c0f0'); AH.Audio.sfx('learn'); } return s.id; };
  G.knownSpellList = () => G.spells.concat(G.fusions);

  /* ---------- world events called from dialogue/objects ---------- */
  G.ringBell = () => {
    const w = G.world, o = w.objs.find((q) => q.d.spr === 'bell'); AH.Audio.sfx('bell', { v: 1 }); w.addShake(4); G.learnLore('bell_heard'); G.flags.bell_rung = (G.flags.bell_rung || 0) + 1;
    w.noise(w.G.player.x, w.G.player.y, 400, 'bell'); AH.Particles.ringBurst(o ? o.x : G.player.x, (o ? o.y : G.player.y) - 20, 90, '#c8b070', 1.0);
    if (G.flags.bell_rung <= 3) { for (let i = 0; i < 2; i++) { const e = w.addEnemy('wretch', 42 + i * 3, 27); e.alert(G.player); } G.toast('Something below stirs.', '#b04aba'); G.addCorruption(2); }
  };
  G.openBloodSeal = (pay) => { const p = G.player; if (pay) { if (p.hp <= 14) { G.toast('You are too weak to pay.', '#d04050'); return; } p.damageSelf(12); G.addCorruption(3); AH.Audio.sfx('blood'); } G.flags.blood_seal_open = true; G.world.refreshOpenState(); G.world.openSecret && 0; G.toast('The seal accepts your offering.', '#d04050'); AH.Audio.sfx('stone_slide'); G.world.addShake(3); };
  G.openThicket = (how) => { if (how === 'salve') G.takeItem('salve_briar', 0); G.flags.thicket_open = true; G.world.refreshOpenState(); G.toast('The thorns draw back.', '#8fd06a'); AH.Audio.sfx('rustle'); };
  G.chooseEnding = (e) => {
    G.flags.choir_end = e; G.flags.boss_done = true; G.flags.drowned_gate = true; G.flags.choir_gate_open = true; G.learnLore('choir_' + e); G.logChoice('The choir: ' + ({ free: 'released', bind: 'bound', silence: 'silenced' })[e] + '.');
    const p = G.player, w = G.world; G.skillPoints += 2; G.addXP(200);
    if (e === 'free') { G.giveItem('lustral_water', 2); G.giveItem('rosary_weeping', 1); G.addCorruption(-30, true); AH.Audio.music('calm'); }
    else if (e === 'bind') { G.addCorruption(15); G.flags.wraith_allies = true; AH.Audio.music('calm'); }
    else { G.giveItem('page_choir', 1); G.addCorruption(8); AH.Audio.music('crypt'); }
    w.setBossGate(false); w.refreshOpenState(); AH.Audio.sfx('bell', { v: 1 }); w.addShake(5);
    G.toast('Way opened: the Drowned Road lies south of the hamlet.', '#e8c670'); G.save(0, true);
  };
  G.stagEnding = (how) => {
    G.flags.stag_done = how; G.addXP(150);
    if (how === 'spare') { G.giveItem('antler_charm', 1); G.logChoice('Spared the Warden of Thorns.'); G.addCorruption(-8, true); } else { G.giveItem('bone_dust', 5); G.giveItem('verdant_draught', 2); G.logChoice('Killed the Warden of Thorns.'); G.addCorruption(4); }
    G.world.enemies.forEach((e) => { if (e.def.id === 'stag') { if (how === 'spare') { e.dormant = true; e.remove = true; } else e.die(); } });
    AH.Audio.music('forest');
  };
  G.coven = { convert() { G.world.npcs.forEach((n) => { if (n.def.name.indexOf('Sister') >= 0 || n.def.ambient) { n.convertHostile(); } }); G.world.addEnemy('hexcaller', 49, 13); G.world.addEnemy('hexcaller', 52, 15); G.world.enemies.slice(-2).forEach((e) => e.alert(G.player)); } };
  G.goEpilogue = () => { G.mode = 'epilogue'; G.screen = null; AH.Audio.music('calm'); G.save(0, true); };

  /* ---------- area change with fade ---------- */
  G.startFade = (cb) => { G.fade = { a: 0, dir: 1, cb }; };
  G.changeArea = (to, spawn) => { if (G.fade.dir !== 0) return; G.startFade(() => { G.world.load(to, spawn); G.save(0, true); G.toast(G.world.def.name, '#e6dcc4'); }); };

  /* ---------- clock ---------- */
  G.tickClock = (dt) => {
    G.clock += dt; G.playtime += dt; G.hour += dt / 45; if (G.hour >= 24) { G.hour -= 24; G.day++; AH.Events.onNewDay(G.world); }
  };
  G.isNight = () => G.hour >= 21 || G.hour < 5; G.isDim = () => G.hour >= 18 || G.hour < 6;

  /* ---------- new game / save / load ---------- */
  G.newGame = (originId) => {
    const st = AH.Starts[originId]; Object.assign(G, { flags: {}, inv: {}, equip: { weapon: 'sickle_rust', cloak: 'mantle_pilgrim', relic1: null, relic2: null }, spells: [], slots: [null, null, null, null], sel: 0, skills: {}, skillPoints: 0, xp: 0, level: 1, fusions: [], waystones: {}, lore: {}, choices: [], seen: {}, kills: 0, toasts: [], hour: 17.5, day: 1, clock: 0, areaState: {}, visited: {}, playtime: 0, deaths: 0, origin: originId, lastWaystone: { area: 'hamlet', spawn: 'start' }, slowmo: 0, hitstop: 0, dayMarks: {} });
    G.inv.sickle_rust = 1; G.inv.mantle_pilgrim = 1; Object.keys(st.items).forEach((k) => (G.inv[k] = st.items[k]));
    G.player = new AH.Player(G); G.player.hp = st.hp; G.player.corruption = 0;
    G.learnSchool(st.school, true); if (!G.spells.length || G.spells[0] !== st.spell) { G.spells = G.spells.filter((s) => s !== st.spell); G.spells.unshift(st.spell); G.slots = [null, null, null, null]; G.spells.slice(0, 4).forEach((s, i) => (G.slots[i] = s)); }
    G.player.recalc(); G.player.hp = G.player.maxHp; G.player.stam = G.player.maxStam;
    G.world = new AH.World(G); G.world.load('hamlet', 'start'); G.mode = 'play'; G.screen = null; G.toast('Ashen Hollow', '#e6dcc4'); AH.Audio.music('hamlet');
    G.dialogueStart('intro');
  };
  G.packExplored = (a) => { let s = ''; for (let i = 0; i < a.length; i++) s += a[i] ? '1' : '0'; return s; };
  G.save = (slot, auto) => {
    try {
      const w = G.world, p = G.player; w.saveAreaState();
      const as = {}; Object.keys(G.areaState).forEach((k) => { const s = G.areaState[k]; as[k] = { objs: s.objs, secrets: s.secrets, killed: s.killed, zones: s.zones, explored: G.packExplored(s.explored || []) }; });
      const d = { v: 1, t: Date.now(), area: w.areaId, x: p.x, y: p.y, flags: G.flags, inv: G.inv, equip: G.equip, spells: G.spells, slots: G.slots, sel: G.sel, skills: G.skills, sp: G.skillPoints, xp: G.xp, level: G.level, fusions: G.fusions, waystones: G.waystones, lore: G.lore, choices: G.choices, seen: G.seen, kills: G.kills, hour: G.hour, day: G.day, areaState: as, visited: G.visited, origin: G.origin, playtime: G.playtime, deaths: G.deaths, last: G.lastWaystone,
        pl: { hp: p.hp, stam: p.stam, souls: p.souls, verd: p.verd, aether: p.aether, corruption: p.corruption, schools: p.schools, maxHpPerm: p.maxHpPerm } };
      localStorage.setItem(SAVE_KEY + slot, JSON.stringify(d)); if (!auto) { G.toast('Game saved', '#a8d890'); AH.Audio.sfx('save'); } return true;
    } catch (e) { G.toast('Save failed', '#d04050'); return false; }
  };
  G.peek = (slot) => { try { const s = localStorage.getItem(SAVE_KEY + slot); if (!s) return null; const d = JSON.parse(s); return { area: d.area, level: d.level, day: d.day, hour: d.hour, t: d.t, origin: d.origin, playtime: d.playtime }; } catch (e) { return null; } };
  G.load = (slot) => {
    let d; try { d = JSON.parse(localStorage.getItem(SAVE_KEY + slot)); } catch (e) { return false; } if (!d) return false;
    Object.assign(G, { flags: d.flags, inv: d.inv, equip: d.equip, spells: d.spells, slots: d.slots, sel: d.sel || 0, skills: d.skills, skillPoints: d.sp, xp: d.xp, level: d.level, fusions: d.fusions || [], waystones: d.waystones, lore: d.lore, choices: d.choices, seen: d.seen || {}, kills: d.kills, hour: d.hour, day: d.day, visited: d.visited, origin: d.origin, playtime: d.playtime, deaths: d.deaths, lastWaystone: d.last, toasts: [], slowmo: 0, hitstop: 0 });
    G.areaState = {}; Object.keys(d.areaState).forEach((k) => { const s = d.areaState[k]; G.areaState[k] = { objs: s.objs, secrets: s.secrets, killed: s.killed, zones: s.zones, explored: Uint8Array.from(String(s.explored).split('').map(Number)) }; });
    G.fusions.forEach((f) => AH.getSpell(f));
    G.player = new AH.Player(G); Object.assign(G.player, { souls: d.pl.souls, verd: d.pl.verd, aether: d.pl.aether, corruption: d.pl.corruption, schools: d.pl.schools, maxHpPerm: d.pl.maxHpPerm || 0 }); G.player.recalc(); G.player.hp = d.pl.hp; G.player.stam = d.pl.stam;
    G.world = new AH.World(G); G.world.load(d.area, null); G.player.x = d.x; G.player.y = d.y; G.world.cam.x = d.x - 240; G.world.cam.y = d.y - 135; G.mode = 'play'; G.screen = null; G.dialogue = null; AH.Audio.music(G.world.def.music); G.toast('Game loaded', '#a8d890');
    return true;
  };
  G.travelTo = (id) => { const ws = G.waystones[id]; if (!ws) return; G.screen = null; G.startFade(() => { G.world.load(ws.area, null); const q = G.world.nearestFree(ws.x, ws.y, 4); G.player.x = q[0]; G.player.y = q[1]; G.world.cam.x = q[0] - 240; G.world.cam.y = q[1] - 135; G.save(0, true); G.toast('Travelled to ' + ws.name, '#9ab8ff'); }); };
  G.respawn = () => {
    const w = G.world, p = G.player, last = G.lastWaystone || { area: 'hamlet', spawn: 'start' }; G.deaths++; G.hour = Math.min(G.hour + 1, 23.5);
    G.startFade(() => { w.load(last.area, last.spawn || null); if (last.x !== undefined) { const q = w.nearestFree(last.x, last.y, 4); p.x = q[0]; p.y = q[1]; w.cam.x = p.x - 240; w.cam.y = p.y - 135; } p.revive(); G.toast('You wake beside the waystone.', '#e6dcc4'); });
  };

  /* ---------- dialogue runner ---------- */
  AH.Dialogue = AH.Dialogue || {};
  G.dialogueStart = (id, npc) => {
    const node = AH.Dialogue.nodes[id] || AH.Dialogue.nodes['intro_missing']; if (!node) return;
    G.dialogue = { npc: npc || null, node, id, shown: 0, sel: 0, t: 0, opts: [] }; G.screen = 'dialogue'; G.enterNode(node);
  };
  G.enterNode = (node) => {
    const d = G.dialogue; d.node = node; d.shown = 0; d.sel = 0; d.t = 0; if (node.fx) { const f = node.fx; node.fx = null; f(); node.fx = f; }
    d.text = typeof node.text === 'function' ? node.text() : node.text; d.opts = (node.opts || []).filter((o) => !o.cond || o.cond());
    if (!d.opts.length) d.opts = [{ t: '(Leave)', end: true }];
  };
  G.dialogueChoose = (i) => {
    const d = G.dialogue; if (!d) return; const o = d.opts[i]; if (!o) return;
    AH.Audio.sfx('ui_ok'); if (o.fx) o.fx();
    if (o.end || !o.next) { G.dialogue = null; G.screen = null; return; }
    const nx = AH.Dialogue.nodes[o.next]; if (!nx) { G.dialogue = null; G.screen = null; return; } G.enterNode(nx);
  };
  AH.Dialogue.nodes = AH.Dialogue.nodes || {};

  G.loadSettings && 0;
})();

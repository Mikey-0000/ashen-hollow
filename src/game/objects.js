/* Ashen Hollow - interactions with the world: chests, waystones, puzzles, gates, secrets, lore, brewing.
   Objects also react to weapons and spells (bells ring, thickets part, seals drink). */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U;
  const I = (AH.Interact = {});
  const G = () => AH.G;

  I.nearest = function (w, p) {
    let best = null, bd = 1e9;
    w.objs.forEach((o) => { if (o.hidden || !o.d.act || o.taken) return; const t = o.d.act.type; if (t === 'chest' && o.state === 1) return; const d = U.dist(p.x, p.y, o.x, o.y - 5); const rng = o.d.spr === 'gateBig' || o.d.spr === 'thicket' || o.d.spr === 'rubble' ? 34 : 24; if (d < rng && d < bd) { bd = d; best = { kind: 'obj', ref: o, prompt: o.d.act.prompt || 'Use' }; } });
    w.npcs.forEach((n) => { if (n.alpha < 0.4 || n.ambient) return; const d = U.dist(p.x, p.y, n.x, n.y); if (d < 28 && d < bd) { bd = d; best = { kind: 'npc', ref: n, prompt: 'Speak with ' + n.def.name.split(' ')[0] }; } });
    w.corpses.forEach((c) => { /* nothing: corpses are used by spells */ });
    return best;
  };
  I.use = function (t, w, p) {
    if (t.kind === 'npc') { const n = t.ref; n.faceTo(p); AH.Audio.sfx('ui_ok'); AH.G.dialogueStart(n.def.entry(), n); return; }
    const o = t.ref, a = o.d.act, g = AH.G; AH.Audio.sfx('ui_ok'); o.pulse = 0.3;
    const T = I.types[a.type]; if (T) T(o, a, w, p, g); else g.toast('Nothing happens.', '#8a8478');
  };
  I.onHit = function (o, p) { const a = o.d.act; if (a.type === 'bellnote') I.types.bellnote(o, a, p.world, p, AH.G, true); };
  I.onSpell = function (o, sp, g, extra) {
    const a = o.d.act; if (!a) return; const school = sp && sp.school, w = g.world;
    if (a.type === 'bellnote' && (school || (sp && sp.tags && sp.tags.length))) I.types.bellnote(o, a, w, g.player, g, true);
    if (a.type === 'thicket' && school === 'druid' && !g.flags.thicket_open) { g.openThicket('druid'); }
    if (a.type === 'seal' && school === 'blood' && !g.flags.blood_seal_open) g.openBloodSeal(false);
    if (a.type === 'rubble' && school === 'astral' && !g.flags.chapel_open) { /* the star knocks the rubble free */ g.flags.chapel_open = true; g.world.refreshOpenState(); g.toast('The star shatters the rubble.', '#7fa6ff'); }
  };

  const T = (I.types = {});
  T.lore = (o, a, w, p, g) => { const L = AH.Lore[a.id]; if (!L) return; g.learnLore(a.id); g.reading = L; g.screen = 'read'; };
  T.well = () => AH.G.dialogueStart('well_look');
  T.altar = () => AH.G.dialogueStart('altar_pray');
  T.altar_star = (o, a, w, p, g) => { g.learnLore('stones_inscription'); g.toast('The altar is carved with a sky that does not match ours.', '#7fa6ff'); };
  T.bell = () => AH.G.dialogueStart('bell_ring');
  T.seal = () => AH.G.dialogueStart('seal_look');
  T.thicket = () => AH.G.dialogueStart('thicket_look');
  T.rubble = (o, a, w, p, g) => { g.dialogueStart('rubble_look'); };
  T.biggate = (o, a, w, p, g) => { if (g.flags.drowned_gate) g.toast('The gate stands open.', '#e8c670'); else g.dialogueStart('gate_look'); };
  T.gate = (o, a, w, p, g) => { if (g.flags[a.flag]) return; if (g.countItem(a.key)) { g.flags[a.flag] = true; w.refreshOpenState(); AH.Audio.sfx('door'); g.toast(a.msg, '#e8c670'); w.addShake(2); } else { g.toast('Locked. Something here remembers a key.', '#b06a6a'); AH.Audio.sfx('ui_deny'); } };
  T.pickup = (o, a, w, p, g) => { if (o.taken) return; o.taken = true; g.giveItem(a.item, a.n || 1); AH.Particles.magic(o.x, o.y - 6, 6, '#c27be0'); };
  T.chest = (o, a, w, p, g) => {
    if (a.locked && !g.flags[a.locked + '_open']) { g.toast('Sealed shut by something older than a lock.', '#b06a6a'); AH.Audio.sfx('ui_deny'); return; }
    if (o.state === 1) return; o.state = 1; AH.Audio.sfx('chest'); AH.Particles.dust(o.x, o.y - 6, 6); a.items.forEach((it) => g.giveItem(it.id, it.n)); g.addXP(a.xp || 12, true);
  };
  T.waystone = (o, a, w, p, g) => {
    g.waystones[a.id] = { name: a.name, area: w.areaId, x: o.x, y: o.y + 12 }; g.lastWaystone = { area: w.areaId, x: o.x, y: o.y + 10, name: a.name };
    p.hp = p.maxHp; p.stam = p.maxStam; if (p.schools.astral) p.aether = Math.max(p.aether, 60); if (p.schools.druid && !w.def.indoor) p.verd = Math.max(p.verd, 6); if (p.schools.necro) p.souls = Math.max(p.souls, 3);
    AH.Audio.sfx('save'); w.ring(o.x, o.y, 50, '#7a9ae8', 0.8); AH.Particles.magic(o.x, o.y - 14, 18, '#9ab8ff'); w.addShake(1); g.toast('Rested at ' + a.name + '.', '#9ab8ff');
    AH.Ecology.respawnAll(w); g.hour = (g.hour + 0.0) % 24; g.save(0);
  };
  T.cauldron = (o, a, w, p, g) => { g.screen = 'brew'; g.menuSel = 0; };
  T.secret = (o, a, w, p, g) => { if (w.secretOpen(a.id)) return; w.openSecret(a.id); g.toast(a.msg || 'Something shifts.', '#e8c670'); g.addXP(25, true); };
  T.stone = (o, a, w, p, g) => {
    if (g.flags.stones_done || w.secretOpen('veil')) { g.toast('The stone hums quietly.', '#7a9ae8'); return; }
    const seq = (g.flags.stoneSeq = g.flags.stoneSeq || []); if (seq[seq.length - 1] === a.stone) return; seq.push(a.stone); const want = ['hunter', 'crow', 'crown'];
    AH.Audio.sfx('chime', { x: o.x, y: o.y, pitch: 0.8 + seq.length * 0.25 }); w.ring(o.x, o.y, 30, '#7a9ae8', 0.6);
    for (let i = 0; i < seq.length; i++) if (seq[i] !== want[i]) { g.flags.stoneSeq = []; AH.Audio.sfx('ui_deny'); g.toast('The stones fall silent. Begin again.', '#8a8478'); return; }
    if (seq.length === 3) { g.flags.stones_done = true; w.openSecret('veil'); g.setFlag('secret_veil'); g.toast('The veil parts. A bridge of old stars appears.', '#7fa6ff'); }
  };
  T.bellnote = (o, a, w, p, g, fromHit) => {
    if (g.flags.choir_gate_open) { AH.Audio.sfx('bell', { x: o.x, y: o.y, pitch: a.note === 'low' ? 0.7 : a.note === 'high' ? 1.5 : 1 }); return; }
    if (o.bellCd > w.time) return; o.bellCd = w.time + 0.7; const pit = { low: 0.6, mid: 0.9, high: 1.4 }[a.note]; AH.Audio.sfx('bell', { x: o.x, y: o.y, pitch: pit, v: 0.9 }); w.ring(o.x, o.y, 28, '#c8b070', 0.5); o.pulse = 0.4; w.addShake(1);
    const seq = (g.flags.bellSeq = g.flags.bellSeq || []); seq.push(a.note); if (seq.length > 3) seq.shift(); const want = ['low', 'high', 'mid'];
    if (seq.length === 3 && seq.every((v, i) => v === want[i])) { g.flags.choir_gate_open = true; g.flags.bellSeq = []; w.refreshOpenState(); AH.Audio.sfx('door'); AH.Audio.sfx('stone_slide'); w.addShake(4); g.toast('Three notes. The Choir Gate grinds open.', '#e8c670'); g.addXP(60, true); }
    w.noise(o.x, o.y, 120, 'bell');
  };
})();

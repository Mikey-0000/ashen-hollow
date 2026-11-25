/* Ashen Hollow - story expansion. Four threads that grow out of what the village already says, each tracked in the Journal (G):
   - Ilse's Twelve: twelve wardens' tags lie in the Catacombs; bringing them back lets Ilse carve the names.
   - Ash, Tansy and Brute: Corwin's dogs came back wrong; put three Hollow Hounds down for him.
   - The Abbot's Brother: read Orrin's last entry to Aldric. It changes the confrontation and the way Aldric says goodbye.
   - Wren's home: where the child ends up depends on what you say to her.
   The epilogue now tells what became of each of them. Everything here reads and writes the same flags the dialogue uses. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, N = AH.Dialogue && AH.Dialogue.nodes, ID = AH.Tiles.ID;
  if (!N) return;
  const g = () => AH.G, F = (k) => !!g().flags[k], set = (k, v) => g().setFlag(k, v === undefined ? true : v), log = (t) => g().logChoice(t);
  const TAGS = 12;

  /* ---------- items & lore ---------- */
  const item = (o) => (AH.Items[o.id] = Object.assign({ rarity: 0, stack: false, scheme: 'neutral' }, o));
  item({ id: 'warden_tag', name: "Warden's Tag", type: 'key', rarity: 1, icon: 'ring', scheme: 'steel', desc: 'A stamped iron tag, a name scratched on the back. Warden Ilse Varr would want to see it.' });
  item({ id: 'ilse_seal', name: "Ilse's Chapel Seal", type: 'relic', rarity: 3, icon: 'rune', scheme: 'steel', desc: 'The warden\'s own seal, pressed into pewter. Those who wear it are harder to move.', mods: { armor: 0.12, corruptGain: -0.15 } });
  item({ id: 'hound_tooth', name: "Corwin's Hound-Tooth", type: 'relic', rarity: 2, icon: 'tooth', scheme: 'witch', desc: 'Brute\'s tooth, strung on gut. Corwin says it keeps the dogs, wherever they are, on your side of the dark.', mods: { leech: 0.05, soulChance: 0.15 } });
  const lore = (id, type, title, text) => (AH.Lore[id] = { id, type, title, text });
  lore('warden_roll', 'inscription', "The Twelve Names", 'Haldis Pike. Tamsin Orr. Edric Vane. Joss Marl. Brannoch. Sefa Dunn. Old Harl. Wick. Maud Carrow. Teague. Ines Roll. Pell.\n(Carved by Ilse Varr above the chapel stair, one a night, until none were left to carve.)');
  lore('corwin_hounds', 'note', 'Ash, Tansy and Brute', 'Three dogs, hand-reared. They followed a light into the Thornwood the night the bell rang.\nThey came back with skulls for faces and tails still wagging.\nCorwin has not been able to look at the wood since.');

  /* ---------- tags in the Catacombs ---------- */
  const orig = AH.Maps.catacombs;
  if (orig) AH.Maps.catacombs = function () {
    const b = orig.apply(this, arguments);
    try {
      const INF = AH.Tiles.INFO || {}, sp = b.spawns.from_hamlet || b.spawns[Object.keys(b.spawns)[0]], reach = new Uint8Array(b.w * b.h), st = [[sp.tx, sp.ty]]; reach[sp.ty * b.w + sp.tx] = 1;
      while (st.length) { const c = st.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach((d) => { const x = c[0] + d[0], y = c[1] + d[1]; if (!b.inb(x, y) || reach[y * b.w + x]) return; const t = b.get(x, y), i = INF[t]; if (!t || (i && i.solid)) return; reach[y * b.w + x] = 1; st.push([x, y]); }); }
      let s = 90210; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296), taken = [[sp.tx, sp.ty]];
      const busy = (x, y) => b.objs.some((q) => Math.abs(q.tx - x) <= 0 && Math.abs(q.ty - y) <= 0 && (q.solid || q.act || q.light || q.k === 'prop'));
      const far = (x, y, d) => taken.every((p) => Math.hypot(p[0] - x, p[1] - y) >= d);
      let n = 0;
      for (let pass = 0; pass < 3 && n < TAGS; pass++) for (let i = 0; i < 4000 && n < TAGS; i++) {
        const x = 3 + Math.floor(rnd() * (b.w - 6)), y = 3 + Math.floor(rnd() * (b.h - 6)), t = b.get(x, y);
        if ((t !== ID.CRYPT && t !== ID.FLAG) || !reach[y * b.w + x] || !b.isFree(x, y, 0) || busy(x, y) || !far(x, y, pass === 0 ? 9 : pass === 1 ? 6 : 3.5)) continue;
        taken.push([x, y]); b.prop('bones', x, y, { id: 'wtag_' + n, variant: n % 3, shadow: false, light: { r: 30, color: '#9ab8ff', flicker: 0.3, y: -4 }, act: { type: 'pickup', item: 'warden_tag', n: 1, prompt: "Take the warden's tag" } }); n++;
      }
      AH.Story = { tagsPlaced: n };
    } catch (e) { if (AH.errors) AH.errors.push('story: ' + e); }
    return b;
  };

  /* ---------- Ilse ---------- */
  const tagsHeld = () => g().countItem('warden_tag'), tagsBack = () => g().flags.ilse_tags || 0;
  const add = (hub, opts) => { const o = N[hub].opts; o.splice(Math.max(0, o.length - 1), 0, ...opts); };
  add('ilse_hub', [
    { t: 'Where did your twelve go?', next: 'ilse_ask', cond: () => F('ilse_bell_known') && !F('ilse_quest') },
    { t: "I found some of your wardens' tags.", next: 'ilse_tags', cond: () => F('ilse_quest') && tagsHeld() > 0 && !F('ilse_done') },
    { t: 'Tell me their names again.', next: 'ilse_roll', cond: () => F('ilse_done') },
  ]);
  AH.Dialogue.nodes.ilse_ask = { id: 'ilse_ask', sp: 'Ilse', text: 'Down. All twelve. Each wore an iron tag with a name on the back, because a warden should be identifiable even when there is not much left. If you go below and find any, bring them to me. I would like to carve the names over the stair before I forget how some of them were spelled.', opts: [
    { t: 'I will bring what I find.', end: true, fx: () => { set('ilse_quest'); log("Promised Ilse to recover her wardens' tags from the Catacombs."); } }, { t: 'Not my business.', end: true }] };
  AH.Dialogue.nodes.ilse_tags = { id: 'ilse_tags', sp: 'Ilse', opts: [{ t: '(Leave.)', end: true }],
    text: () => { const f = g().flags, t = f.ilse_tags || 0; return f.ilse_done ? 'That is all twelve. I did not think I would see them again, even as iron. Thank you. Take this: it was mine, and I have no use for the weight of it.' : t === 1 ? 'One. ' + 'Joss Marl, by the scratching. He could not hold a sword straight, and he went first anyway. Eleven more, if you will.' : 'That makes ' + t + '. I will say each name when I carve it. ' + (TAGS - t) + ' to go.'; },
    fx: () => { const k = tagsHeld(); if (!k) return; g().takeItem('warden_tag', k); g().flags.ilse_tags = tagsBack() + k; g().addXP(10 * k, true); g().toast('Returned ' + k + " warden's tag" + (k > 1 ? 's' : '') + ' (' + tagsBack() + '/' + TAGS + ')', '#c8d0e4');
      if (tagsBack() >= Math.min(TAGS, (AH.Story && AH.Story.tagsPlaced) || TAGS) && !F('ilse_done')) { set('ilse_done'); g().giveItem('ilse_seal', 1); g().addXP(120); g().learnLore('warden_roll'); log('Returned all twelve wardens\' tags to Ilse.'); } } };
  AH.Dialogue.nodes.ilse_roll = { id: 'ilse_roll', sp: 'Ilse', text: 'Haldis Pike. Tamsin Orr. Edric Vane. Joss Marl. Brannoch. Sefa Dunn. Old Harl. Wick. Maud Carrow. Teague. Ines Roll. Pell. I say them every night. It is the only part of the watch that is not for the living.', opts: [{ t: '(Leave.)', end: true }] };

  /* ---------- Corwin ---------- */
  const hounds = () => (g().seen.hound || 0) - (g().flags.corwin_hound_base || 0);
  add('corwin_hub', [
    { t: 'Something troubles you.', next: 'corwin_dogs', cond: () => !F('corwin_dogs') },
    { t: 'The hounds. How many do I still owe you?', next: 'corwin_count', cond: () => F('corwin_dogs') && !F('corwin_dogs_done') && hounds() < 3 },
    { t: 'It is done. Three of them.', next: 'corwin_dogs_done', cond: () => F('corwin_dogs') && !F('corwin_dogs_done') && hounds() >= 3 },
  ]);
  N.corwin_dogs = { id: 'corwin_dogs', sp: 'Corwin', text: 'Three dogs. Ash, Tansy, Brute. I raised them from pups. They went after a light into the wood the night the bell rang, and the thing that came back had their collars on. Skull faces. Still wagging. I can\'t. Put them down for me, three of them. I don\'t want to know which.', opts: [
    { t: 'I will.', end: true, fx: () => { set('corwin_dogs'); g().flags.corwin_hound_base = g().seen.hound || 0; g().learnLore('corwin_hounds'); log('Promised Corwin to put three Hollow Hounds out of their misery.'); } }, { t: 'I can\'t promise that.', end: true }] };
  N.corwin_count = { id: 'corwin_count', sp: 'Corwin', text: () => 'Still ' + Math.max(0, 3 - hounds()) + '. Don\'t tell me how it went. Just do it quickly.', opts: [{ t: '(Leave.)', end: true }] };
  N.corwin_dogs_done = { id: 'corwin_dogs_done', sp: 'Corwin', text: 'Quiet, then. The wood is quiet. ...Here. Brute\'s tooth, from before. He\'d have wanted somebody to carry him who isn\'t afraid.', opts: [{ t: 'Rest easy, Corwin.', end: true }],
    fx: () => { if (F('corwin_dogs_done')) return; set('corwin_dogs_done'); set('corwin_trust'); g().giveItem('hound_tooth', 1); g().addXP(90); log('Put three Hollow Hounds down for Corwin.'); } };

  /* ---------- Aldric & Orrin ---------- */
  add('aldric_hub', [
    { t: 'Is anything of Orrin\'s left below?', next: 'aldric_hint', cond: () => !(g().lore || {}).abbot_journal && !F('aldric_forgave') },
    { t: 'I read your brother\'s last words.', next: 'aldric_letter', cond: () => !!(g().lore || {}).abbot_journal && !F('aldric_forgave') },
  ]);
  N.aldric_hint = { id: 'aldric_hint', sp: 'Aldric', text: 'He wrote while he sang. He always wrote, even in the hedge-schools. If there is a lamp burning in the lowest hall, look beside it. Do not read it if you cannot bear to be forgiven by a man who is not sure he has the right.', opts: [{ t: 'I will look.', end: true, fx: () => set('abbot_hint') }] };
  N.aldric_letter = { id: 'aldric_letter', sp: 'Aldric', text: 'Read it to me. Please. ...Aldric, forgive me. He wrote my name. After a hundred years of the rope, he wrote my name. I thought he had forgotten that he had a brother.', opts: [
    { t: 'He asked your forgiveness.', next: 'aldric_forgive', fx: () => { set('aldric_forgave'); log('Read the Abbot\'s last words to Aldric.'); } }, { t: '(Say nothing. Let him have the silence.)', end: true }] };
  N.aldric_forgive = { id: 'aldric_forgive', sp: 'Aldric', text: 'Then I forgive him. And you will say so, when you stand in front of him. Not "I heard"; he wouldn\'t believe that. Say that his brother is waiting at the top of the stairs. I have been waiting there for such a long time.', opts: [{ t: 'I will tell him.', end: true }],
    fx: () => { if (!F('aldric_gift')) { set('aldric_gift'); g().giveItem('lustral_water', 1); g().addXP(60); } } };
  const e1 = N.ending_1.text; N.ending_1.text = () => (F('aldric_forgave') ? 'The bell stills. The weeping face lifts. "Brother," it says, once, in a voice that was never his own. You give him Aldric\'s message and he flinches as if from a kindness. "Is it quiet?" he asks. "I can no longer tell the difference between quiet and listening."' : e1);
  const a0 = N.aldric_after.text; N.aldric_after.text = () => (F('aldric_forgave') ? ({ free: 'He said "brother." With words, this time. I can hear all of them now, and mine is among them. I think I will go to the top of the stairs.', bind: 'He is not at rest, and neither is the choir, and I forgive him anyway. It is the only thing I have left to give.', silence: 'It is quiet. But I told him that I forgave him, and he heard it before the end. That is more than most people get.' }[g().flags.choir_end] || a0()) : a0());

  /* ---------- Wren ---------- */
  const wo = N.wren_after.opts; wo.length = 0;
  wo.push({ t: 'You should go with Marta.', end: true, fx: () => { set('wren_home', 'marta'); log('Told Wren to go to Marta.'); } }, { t: 'Walk with me a while.', end: true, fx: () => { set('wren_home', 'road'); log('Let Wren walk with you.'); } }, { t: 'Stay safe, Wren.', end: true });

  /* ---------- epilogue: what became of them ---------- */
  const SC = AH.UI && AH.UI.screens, Font = AH.Font, C = AH.UI.C;
  if (SC && SC.epilogue) SC.epilogue.draw = function (g2, Gm, time) {
    AH.UI.drawTitleScene(g2, time); g2.fillStyle = 'rgba(5,4,10,' + U.clamp(this.t * 0.4, 0, 0.8) + ')'; g2.fillRect(0, 0, AH.W, AH.H);
    const f = Gm.flags, e = f.choir_end || 'free', W = AH.W;
    const L = { free: 'The choir sings home and the bell goes quiet. The road south is damp with dew and old music.', bind: 'The dead follow in your wake, humming a hymn you can no longer stop hearing. The road south seems to bend toward you.', silence: 'The bell is shattered and the silence is enormous. Somewhere under the hill, something takes a long, slow breath.' }[e];
    const fates = [
      f.wren_home === 'road' ? 'Wren walks the road with you, counting footsteps instead of tolls.' : f.wren_home === 'marta' ? 'Wren sleeps through the night now, in Marta\'s spare room.' : 'Wren still hums at dusk, and the hamlet has learned to listen.',
      f.aldric_forgave ? 'Aldric was heard at the top of the stairs, singing one verse of his own.' : 'Aldric keeps his vigil, for a brother who never answered.',
      f.ilse_done ? 'Ilse carved twelve names over the chapel stair and left the door unlocked.' : 'Ilse still guards a stair nobody is asking to descend.',
      f.corwin_dogs_done ? 'Corwin named the dogs again, out loud, by the fire.' : 'Corwin hunts quieter things than he used to.',
      f.marta_trust ? 'Marta burned the last page of the ledger, and slept.' : 'Marta keeps her door barred, and her wolfsbane drying.']
      .concat((AH.CovenFates ? AH.CovenFates() : []).filter(Boolean));
    if (this.t > 1) {
      const big = Font.big('THE DROWNED ROAD', 4, '#f6e2a8', '#a87a30', '#1a0e04'); g2.globalAlpha = U.clamp(this.t - 1, 0, 1); g2.drawImage(big, Math.round(W / 2 - big.width / 2), 22);
      Font.wrap(L, 340).forEach((l, i) => Font.draw(g2, l, W / 2, 70 + i * 11, C.ink, { align: 'center', outline: '#05040a' }));
      fates.forEach((l, i) => { g2.globalAlpha = U.clamp(this.t - 2.2 - i * 0.45, 0, 1) * U.clamp(this.t - 1, 0, 1); Font.draw(g2, l, W / 2, 110 + i * 12.5, i % 2 ? '#b8aa90' : '#d4c8a8', { align: 'center', outline: '#05040a' }); });
      g2.globalAlpha = U.clamp(this.t - 1, 0, 1);
      Font.draw(g2, 'End of the vertical slice. Thank you for playing.', W / 2, 200, C.gold, { align: 'center', outline: '#05040a' });
      Font.draw(g2, 'Level ' + Gm.level + '   Day ' + Gm.day + '   Slain ' + Gm.kills + '   Deaths ' + Gm.deaths, W / 2, 214, C.dim, { align: 'center' });
      if (this.t > 5) Font.draw(g2, '[Enter] return to title', W / 2, 240, '#5a5448', { align: 'center' }); g2.globalAlpha = 1;
    }
  };
  if (SC && SC.epilogue) SC.epilogue.update = function (dt, Gm) { this.t += dt; AH.Particles.update(dt); if (this.t > 5 && AH.Input.pressed('confirm')) { Gm.mode = 'title'; Gm.screen = null; this.t = 0; AH.Audio.music('title'); } };
})();

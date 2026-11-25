/* Ashen Hollow - "The Cold Hearth": the coven's side of Marta's past.
   Vesna says Marta put out the ninth fire out of spite. Marta says ask what the Abbot offered. Three torn ledger pages lie in the Thornwood;
   they tell the truth (Marta's daughter Ysolde, Wren's mother). You then choose where they go: back to Marta to burn, to Vesna with Marta's apology, or to Vesna as exposure.
   Flags: cold_hearth, red_page_n (lore), cold_carry, cold_resolved = reconcile | burn | expose, wren_kin. Journal and epilogue read the same flags. */
(function () {
  'use strict';
  const AH = window.AH, N = AH.Dialogue && AH.Dialogue.nodes, ID = AH.Tiles.ID; if (!N) return;
  const g = () => AH.G, F = (k) => !!g().flags[k], set = (k, v) => g().setFlag(k, v === undefined ? true : v), log = (t) => g().logChoice(t);
  const pages = () => [1, 2, 3].filter((i) => (g().lore || {})['red_page_' + i]).length, allPages = () => pages() >= 3;
  const open = () => F('cold_hearth') && !F('cold_resolved');

  /* ---------- items & lore ---------- */
  const item = (o) => (AH.Items[o.id] = Object.assign({ rarity: 0, stack: false, scheme: 'neutral' }, o));
  item({ id: 'hearth_ember', name: 'Ember of the Ninth Hearth', type: 'relic', rarity: 3, icon: 'candle', scheme: 'witch', desc: 'A coal that never cools, carried from a fire that was lit again. Hexes bite deeper, reagents last, and the taint comes slower.', mods: { hexPower: 0.15, reagentSave: 0.15, corruptGain: -0.15 } });
  item({ id: 'coven_cord', name: "Vesna's Red Cord", type: 'relic', rarity: 3, icon: 'ring', scheme: 'witch', desc: 'Nine knots, one pulled tight. It makes your hexes hungry, and what they eat leaves a mark.', mods: { hexPower: 0.25, corruptGain: 0.15 } });
  const lore = (id, title, text) => (AH.Lore[id] = { id, type: 'journal', title, text });
  lore('red_page_1', 'Torn Ledger Page I (red ink)', 'The Abbot came to the Ninth Hearth in the third week of the hush. He did not threaten. He wept.\nHe said singing would be cleaner than salt, and that no one\'s daughter need go down. I believed him.\nGod help me, I believed a priest.\n- M.');
  lore('red_page_2', 'Torn Ledger Page II (red ink)', 'He took my Ysolde in the second week of the singing. He called it a clerical error.\nI put out the ninth fire that night with salt, so the Listener could not follow the smoke to my door.\nThe others will call it betrayal. It was. It was also the only door I could close.\n- M.');
  lore('red_page_3', 'Torn Ledger Page III (red ink)', 'Ysolde left a child. Wren. She is three, and she hums.\nI will tell her nothing. A child who knows what her mother was learns to listen, and the hill listens back.\nIf you find this, do not tell the coven where she sleeps.\n- M.');

  /* ---------- three pages in the Thornwood ---------- */
  const orig = AH.Maps.thornwood;
  if (orig) AH.Maps.thornwood = function () {
    const b = orig.apply(this, arguments);
    try {
      const INF = AH.Tiles.INFO || {}, sp = b.spawns.from_hamlet || b.spawns[Object.keys(b.spawns)[0]], reach = new Uint8Array(b.w * b.h), st = [[sp.tx, sp.ty]]; reach[sp.ty * b.w + sp.tx] = 1;
      while (st.length) { const c = st.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach((d) => { const x = c[0] + d[0], y = c[1] + d[1]; if (!b.inb(x, y) || reach[y * b.w + x]) return; const t = b.get(x, y), i = INF[t]; if (!t || t === ID.WATER || (i && i.solid)) return; reach[y * b.w + x] = 1; st.push([x, y]); }); }
      let s = 31337; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296), taken = [[sp.tx, sp.ty]];
      const busy = (x, y) => b.objs.some((q) => Math.abs(q.tx - x) <= 1 && Math.abs(q.ty - y) <= 1 && (q.solid || q.act || q.light));
      let n = 0;
      for (let pass = 0; pass < 3 && n < 3; pass++) for (let i = 0; i < 4000 && n < 3; i++) {
        const x = 4 + Math.floor(rnd() * (b.w - 8)), y = 4 + Math.floor(rnd() * (b.h - 8)), t = b.get(x, y), d = pass === 0 ? 22 : pass === 1 ? 12 : 6;
        if ([ID.GRASS, ID.MOSS, ID.LEAVES, ID.DIRT].indexOf(t) < 0 || !reach[y * b.w + x] || !b.isFree(x, y, 0) || busy(x, y) || !taken.every((p) => Math.hypot(p[0] - x, p[1] - y) >= d)) continue;
        taken.push([x, y]); n++; b.prop('scroll', x, y, { id: 'redpage_' + n, shadow: false, light: { r: 30, color: '#ff6a6a', flicker: 0.35, y: -4 }, act: { type: 'lore', id: 'red_page_' + n, prompt: 'Read the torn page' } });
      }
      AH.Coven = { pagesPlaced: n };
    } catch (e) { if (AH.errors) AH.errors.push('coven: ' + e); }
    return b;
  };

  /* ---------- dialogue ---------- */
  const add = (hub, opts) => { const o = N[hub].opts; o.splice(Math.max(0, o.length - 1), 0, ...opts); };
  const nd = (id, sp, text, opts, fx) => (N[id] = { id, sp, text, opts, fx });
  const bye = (t) => ({ t: t || '(Leave.)', end: true });

  add('vesna_hub', [
    { t: 'Tell me about Marta and the ninth fire.', next: 'vesna_marta', cond: () => F('marta_done') && !F('cold_hearth') && !F('coven_hostile') },
    { t: 'I found Marta\'s torn pages.', next: 'vesna_pages', cond: () => open() && allPages() && !F('coven_hostile') },
    { t: 'Marta asked me to carry her apology.', next: 'vesna_apology', cond: () => open() && g().flags.cold_carry === 'apology' && !F('coven_hostile') },
  ]);
  nd('vesna_marta', 'Vesna', 'She put it out with salt, on the worst night, and walked away with the ledger. Eight lit, one cold, and the cold one is a wound in the circle that never closes. She tore pages from the book and threw them into the wood so none of us could read what she had done. I have never found them. If you do, read them, and think hard about whose hands they belong in.', [
    { t: 'I will look for them.', end: true, fx: () => { set('cold_hearth'); log('Agreed to find the pages Marta tore from the ledger and scattered in the Thornwood.'); } }, { t: 'That is between the two of you.', end: true }]);
  nd('vesna_pages', 'Vesna', () => 'You have read them? Then you know what I do not. Give them here. I would hear it from the paper, not from her.', [
    { t: 'Here. The coven deserves the truth.', next: 'vesna_expose', fx: () => { set('cold_resolved', 'expose'); set('marta_cold'); log('Gave Marta\'s torn pages to Vesna, against Marta\'s wishes.'); } },
    { t: 'Not yet. I will speak to Marta first.', end: true }]);
  nd('vesna_expose', 'Vesna', 'A daughter. Of course. ...And a child, still in the village. Hm. Do not look at me that way; we do not harm children, we have just never been forgiven for what we are. She put the fire out to save a girl who then went to the choir anyway. That is not betrayal. That is grief with a hand on the salt. I am still angry. I will be angry for a hundred more nights. Take this, with my thanks, and my warning: the cord bites those who wear it.', [bye('(Leave.)')],
    () => { if (F('cold_paid')) return; set('cold_paid'); g().giveItem('coven_cord', 1); g().giveItem('raven_feather', 3); g().addXP(80); g().addCorruption(5); });
  nd('vesna_apology', 'Vesna', 'She sent you? ...Salt in a pocket, and a sorry in a stranger\'s mouth. That is Marta all over. Tell her... no. I will tell her myself, when the ninth fire is lit. Come. Hold this to the ashes.', [bye('(Hold the coal to the cold hearth.)')],
    () => { if (F('cold_paid')) return; set('cold_paid'); set('cold_resolved', 'reconcile'); g().giveItem('hearth_ember', 1); g().addXP(140); g().addCorruption(-5, true); AH.Audio.sfx('save'); g().toast('The ninth hearth is lit.', '#e8c670'); log('Carried Marta\'s apology to Vesna. The ninth fire was lit.'); });

  add('marta_hub', [
    { t: 'Vesna says you put the ninth fire out.', next: 'marta_fire', cond: () => F('met_vesna') && F('marta_done') && !F('cold_hearth') },
    { t: 'I found your torn pages.', next: 'marta_pages', cond: () => open() && allPages() && !F('cold_carry') },
  ]);
  nd('marta_fire', 'Marta', 'Did she say why? No. She wouldn\'t. ...I put it out with salt, aye. Ask her what the Abbot offered the Ninth Hearth before you take her side. And if you go looking for my pages, I will not stop you. I tore them out because I could not stand to read them. You may have a stronger stomach.', [
    { t: 'I will find them.', end: true, fx: () => { set('cold_hearth'); log('Agreed to find the pages Marta tore from the ledger and scattered in the Thornwood.'); } }, bye('That is your business.')]);
  nd('marta_pages', 'Marta', 'All three. ...Then you know about Ysolde. And about Wren, who must not. She is mine, and she was Ysolde\'s, and I cannot tell her what her mother did, or what I did to keep her. What will you do with them?', [
    { t: 'Burn them. They are yours to bury.', next: 'marta_burn', fx: () => { set('cold_resolved', 'burn'); log('Burned Marta\'s torn pages with her.'); } },
    { t: 'The coven should hear it. Let me carry your apology.', next: 'marta_carry', fx: () => { set('cold_carry', 'apology'); log('Agreed to carry Marta\'s apology to the coven.'); } },
    { t: 'Let me think.', end: true }]);
  nd('marta_burn', 'Marta', 'Thank you. Oh, thank you. ...There. Smoke, and nothing the hill can follow. I will tell Wren in my own time, if there is a time. Take these. I made them for myself, and I won\'t be needing them.', [bye('(Leave.)')],
    () => { if (F('cold_paid')) return; set('cold_paid'); g().giveItem('tincture', 3); g().addXP(90); g().addCorruption(-3, true); });
  nd('marta_carry', 'Marta', 'Then say it exactly: the ninth fire was not put out out of spite. Say that I will come when Wren is safe. Say I am sorry for the salt. She will not believe the last part, but say it anyway.', [bye('I will tell her.')]);
  const mh = N.marta_hub.text; N.marta_hub.text = () => (g().flags.cold_resolved === 'expose' ? 'So you gave them to her. ...Anything else?' : g().flags.cold_resolved === 'reconcile' ? 'You told her. I smelled smoke from the Thornwood this morning. Don\'t look at me. Anything else?' : typeof mh === 'function' ? mh() : mh);

  add('wren_hub', [{ t: 'Did you know your mother\'s name? Ysolde.', next: 'wren_kin', cond: () => allPages() && !F('wren_kin') }]);
  nd('wren_kin', 'Wren', 'Ysolde. ...That is a nice name. Marta says she sang. She never said it had a name. Can I keep it? I will not tell anyone. I will only hum it.', [{ t: 'Keep it safe.', end: true }, bye()],
    () => { if (F('wren_kin')) return; set('wren_kin'); log('Told Wren her mother\'s name.'); });

  /* ---------- epilogue fates (story.js draws these) ---------- */
  AH.CovenFates = () => {
    const f = g().flags;
    return [f.cold_resolved === 'reconcile' ? 'Marta walked to the Thornwood with salt in her pocket, and the ninth fire was lit.' : f.cold_resolved === 'burn' ? 'Marta burned the pages and slept. The ninth fire stays cold.' : f.cold_resolved === 'expose' ? 'The coven knows, now. Marta bars her door, and Vesna has stopped watching it.' : null,
      f.wren_kin ? 'Wren knows her mother\'s name, and hums it when nobody is near.' : null];
  };
})();

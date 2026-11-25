/* Ashen Hollow - NPC definitions, daily routines and branching dialogue.
   Nodes may be strings or functions; option `cond` hides choices, `fx` applies consequences. Choices are
   logged to the Journal so the player can see what they have set in motion. */
(function () {
  'use strict';
  const AH = window.AH;
  const g = () => AH.G;
  const F = (k) => !!g().flags[k];
  const set = (k, v) => g().setFlag(k, v === undefined ? true : v);
  const log = (t) => g().logChoice(t);
  const has = (id, n) => g().countItem(id) >= (n || 1);

  AH.NPCDefs = {
    marta: { name: 'Marta Hollin', art: 'marta', speed: 26, col: '#d8b898', area: 'hamlet', home: [10, 16],
      routine: [{ h0: 6, h1: 19, at: [10, 16], act: 'garden' }, { h0: 19, h1: 6, at: [10, 9], act: 'hearth' }], rain: { at: [11, 9], act: 'hearth' },
      barks: ['Wolfsbane for the dead...', 'The nights are getting longer.', 'Don\'t track mud in.', 'Something is wrong with the crows.'],
      entry: () => (!F('met_marta') ? 'marta_1' : F('marta_quest') && !F('marta_done') ? (has('wolfsbane', 3) ? 'marta_turnin' : 'marta_waiting') : F('choir_end') ? 'marta_after' : 'marta_hub') },
    aldric: { name: 'Brother Aldric', art: 'aldric', speed: 18, col: '#b4cadf', area: 'hamlet', home: [45, 28], ghost: true,
      routine: [{ h0: 18, h1: 6, at: [45, 28], act: 'vigil' }, { h0: 6, h1: 18, at: null, act: 'absent' }], rain: { at: [45, 28], act: 'vigil' },
      barks: ['I only rang it once...', 'Is it morning?', 'The choir... where is the choir?'],
      entry: () => (!F('met_aldric') ? 'aldric_1' : F('choir_end') ? 'aldric_after' : 'aldric_hub') },
    wren: { name: 'Wren', art: 'wren', speed: 34, col: '#e0c890', area: 'hamlet', home: [9, 29], shy: true,
      routine: [{ h0: 7, h1: 18, at: [27, 22], act: 'play' }, { h0: 18, h1: 7, at: [9, 29], act: 'sleep' }], rain: { at: [9, 29], act: 'sleep' },
      barks: ['...', 'Do you hear it?', 'Shh.', 'One, two, three, four...'],
      entry: () => (!F('met_wren') ? 'wren_1' : F('choir_end') ? 'wren_after' : 'wren_hub') },
    vesna: { name: 'Vesna of the Ninth Hearth', art: 'vesna', speed: 24, col: '#c8a8e8', area: 'thornwood', home: [50, 14],
      routine: [{ h0: 6, h1: 21, at: [50, 14], act: 'forage' }, { h0: 21, h1: 6, at: [50, 14], act: 'chant' }], rain: { at: [50, 14], act: 'chant' },
      barks: ['Eight lit, one cold.', 'Hush now, fire.', 'It hears everything.'],
      entry: () => (!F('met_vesna') ? 'vesna_1' : 'vesna_hub') },
    sister: { name: 'Coven Sister', art: 'hexcaller', speed: 0, col: '#a888c8', area: 'thornwood', ambient: true, routine: [{ h0: 0, h1: 24, at: null, act: 'chant' }], barks: ['...eight lit...', '...one cold...'], entry: () => 'sister_1' },
  };

  const N = (AH.Dialogue = { nodes: {} }).nodes;
  const n = (id, sp, text, opts, fx) => (N[id] = { id, sp, text, opts: opts || [{ t: '(Leave)', end: true }], fx });
  const bye = (t) => ({ t: t || '(Leave)', end: true });

  /* ------------------ MARTA ------------------ */
  n('marta_1', 'Marta', 'You walk the road at dusk like it owes you something. Nobody comes to Ashen Hollow on purpose, stranger.', [
    { t: 'I follow the sound of a bell.', next: 'marta_bell' }, { t: 'Who are you?', next: 'marta_who' }, bye('Just passing through.')], () => set('met_marta'));
  n('marta_who', 'Marta', 'Marta. I grow what grows and I bury what doesn\'t. Wolfsbane for the dead, feverfew for the rest.', [
    { t: 'What happened to this place?', next: 'marta_bell' }, { t: 'Do you need anything?', next: 'marta_offer', cond: () => !F('marta_quest') }, bye('Goodbye.')]);
  n('marta_bell', 'Marta', 'The bell. Ask the church. Ask Aldric if you can bear his answers; he only walks when the light fails. And mind the graveyard after dark.', [
    { t: 'How do I get beneath the church?', next: 'marta_crypt' }, { t: 'Do you need anything?', next: 'marta_offer', cond: () => !F('marta_quest') }, bye('Thank you.')]);
  n('marta_crypt', 'Marta', 'There\'s a gate in the graveyard, locked a hundred years. Aldric knows where the key lay. Or wait for the deepest hour and watch what walks to the church. That way is free.', [
    { t: 'Do you need anything?', next: 'marta_offer', cond: () => !F('marta_quest') }, bye('I\'ll remember.')], () => set('procession_hint'));
  n('marta_offer', 'Marta', 'Three sprigs of wolfsbane from Thornwood, across the river. The purple, not the pretty. Bring them and I\'ll brew you something to steady your hands. And I might tell you what I\'ve told nobody.', [
    { t: 'I\'ll bring them.', end: true, fx: () => { set('marta_quest'); log('Promised Marta three sprigs of wolfsbane.'); } }, bye('Not now.')]);
  n('marta_waiting', 'Marta', 'Three sprigs, purple, from Thornwood past the river. Don\'t linger there after dark.');
  n('marta_turnin', 'Marta', 'That\'s the right plant. Good. Here: briar salve (the thorns will let you by) and two tinctures. Now. You were promised a story.', [
    { t: 'Tell me.', next: 'marta_secret' }], () => { g().takeItem('wolfsbane', 3); g().giveItem('salve_briar', 1); g().giveItem('tincture', 2); g().addXP(40); set('marta_done'); });
  n('marta_secret', 'Marta', 'I was of the Ninth Hearth. The coven. The Abbot paid us to hush the thing beneath the hill, and we failed, and then he found a cleaner way. Singing. I should have stopped him.', [
    { t: 'You were a witch.', next: 'marta_witch' }, { t: 'Why tell me?', next: 'marta_why' }, { t: 'That is your guilt, not mine.', next: 'marta_cold', fx: () => { set('marta_cold'); log('Was cold to Marta after her confession.'); } }]);
  n('marta_why', 'Marta', 'Because you have the look of someone who has been called. I was called once. It ends in a bell.', [{ t: 'Teach me what you know.', next: 'marta_witch' }, bye('I\'ll think on it.')]);
  n('marta_witch', 'Marta', 'Hedge-witch, yes. I\'ll not teach you what Vesna\'s lot teach; they want it woken. But take the ledger. Read it by candlelight and don\'t trust the recipes written in red.', [bye('Thank you, Marta.')],
    () => { if (!g().player.schools.witch) g().giveItem('grim_witch', 1); else g().giveItem('ring_ninth', 1); set('marta_trust'); log('Marta entrusted you with the Ninth Hearth Ledger.'); });
  n('marta_cold', 'Marta', 'Hm. You won\'t last in this place with a heart like that. Take what I gave you and go.');
  n('marta_hub', 'Marta', () => (F('marta_cold') ? 'Still here, are you.' : 'Mind the dark. Anything else?'), [
    { t: 'What do you know of Vesna?', next: 'marta_vesna' }, { t: 'About the Abbot...', next: 'marta_abbot' }, bye()]);
  n('marta_vesna', 'Marta', 'Vesna leads what is left of the coven. She thinks a god should be heard. I think gods are why we are all hollow.', [bye('I see.')]);
  n('marta_abbot', 'Marta', 'Orrin Vael. Kind man. Kind men do the worst things, because they are sure.', [bye('I see.')]);
  n('marta_after', 'Marta', () => ({ free: 'Bells at dusk again, and nothing underneath them but bells. I keep expecting it to feel like victory.', bind: 'The crows follow you now. I don\'t say that as a compliment. Be careful what you\'ve wound round your wrist.', silence: 'It\'s too quiet. The sort of quiet a held breath makes. I\'ve begun sleeping with the door barred.' }[g().flags.choir_end] || '...'), [bye()]);

  /* ------------------ ALDRIC ------------------ */
  n('aldric_1', 'Aldric', 'You can see me. That is... unusual. Few do. I am Brother Aldric of the Chapter. I think. Some days I am less sure of the "think".', [
    { t: 'What happened here?', next: 'aldric_story' }, { t: 'Can you help me?', next: 'aldric_help' }, bye('Rest, brother.')], () => set('met_aldric'));
  n('aldric_story', 'Aldric', 'My brother, the Abbot, climbed the hill to ring the great bell and drown something that spoke from underneath. I rang the first toll with him. Only once! But he did not stop. We sang to keep him company. And then we did not stop either.', [
    { t: 'Why does it still ring?', next: 'aldric_ring' }, { t: 'Where is the Abbot now?', next: 'aldric_abbot' }, bye()]);
  n('aldric_ring', 'Aldric', 'Because no one told it to stop. Because someone must hold the rope. Because it is listening, and a thing that listens must be given something.', [{ t: 'Where is the Abbot now?', next: 'aldric_abbot' }, bye()]);
  n('aldric_abbot', 'Aldric', 'In the choir hall, below, at the rope. I think he cannot leave it. I am afraid to see what he has become.', [
    { t: 'I will free him.', next: 'aldric_promise', fx: () => { set('aldric_stance', 'free'); log('Promised Aldric to free the Abbot.'); } },
    { t: 'I will end it. End him, if I must.', next: 'aldric_promise', fx: () => { set('aldric_stance', 'end'); log('Promised Aldric to end the bell, whatever it costs.'); } },
    { t: 'He earned whatever he has become.', next: 'aldric_cruel', fx: () => { set('aldric_cruel'); log('Told Aldric his brother earned his fate.'); } }]);
  n('aldric_promise', 'Aldric', 'Then take this: the crypt key. I held it a hundred years and could not remember the lock. When you hear the bell clearly, do not answer it.', [bye('I will not.')], () => { if (!g().flags.got_key) { g().giveItem('crypt_key', 1); set('got_key'); g().addXP(30); } });
  n('aldric_cruel', 'Aldric', 'Then you are no better than the bell. I will not help you. Find your own way down.', [bye()]);
  n('aldric_help', 'Aldric', 'I remember where a key lay, and little else. Ask me of my brother first.', [{ t: 'Tell me what happened.', next: 'aldric_story' }, bye()]);
  n('aldric_hub', 'Aldric', 'The dark is thin tonight. What would you ask?', [
    { t: 'Grant me the Last Rites. (Cleanse 40 taint)', next: 'aldric_rites', cond: () => g().player.corruption > 0 },
    { t: 'Tell me of the stars the choir sang beneath.', next: 'aldric_stars' }, { t: 'Tell me of Abbot Orrin.', next: 'aldric_abbot2' }, bye()]);
  n('aldric_rites', 'Aldric', () => (F('used_forbidden') ? 'You carry the Choir\'s silence inside you. I cannot lift what I have no hands to hold. I am sorry.' : 'It is not forgiveness. It is only rest. Kneel, if you will.'), [bye('Thank you.')],
    () => { if (!F('used_forbidden')) { g().addCorruption(-40, true); AH.Audio.sfx('save'); g().toast('Taint cleansed'); } });
  n('aldric_stars', 'Aldric', 'The abbey\'s ceiling was painted with a sky that never matched ours. Orrin said it was the sky as God sees it. I often wonder whether it was the sky as the Listener sees it.', [bye()]);
  n('aldric_abbot2', 'Aldric', 'He sang as a boy in the hedge-schools of the south. His voice could still a crying infant. That is the thing that frightens me. It was never cruelty.', [bye()]);
  n('aldric_after', 'Aldric', () => ({ free: 'I can hear them. All of them, singing something with words. I think I may go soon. Thank you.', bind: 'They follow you, brother. I don\'t know what I\'ve done by asking you.', silence: 'Silence. I had forgotten what it was like. I wish I had not been reminded.' }[g().flags.choir_end] || '...'), [bye()]);

  /* ------------------ WREN ------------------ */
  n('wren_1', 'Wren', '...Don\'t come closer. Are you one of the quiet ones? You don\'t look quiet. You look tired.', [
    { t: 'I\'m not going to hurt you.', next: 'wren_2' }, { t: 'Where are your parents?', next: 'wren_parents' }, bye('(Leave her be.)')], () => set('met_wren'));
  n('wren_parents', 'Wren', 'Gone to sing. Everyone went to sing. I was supposed to be asleep.', [{ t: 'I\'m not going to hurt you.', next: 'wren_2' }, bye()]);
  n('wren_2', 'Wren', 'Marta says never talk to strangers. But Marta says a lot of things. There\'s a stone in the burnt house that moves. Behind it is where I hide my treasures. You can have one - if you promise to come back.', [
    { t: 'I promise.', next: 'wren_promise', fx: () => { set('wren_promise'); set('cellar_hint'); log('Promised Wren you would come back for her.'); } },
    { t: 'I can\'t promise that.', next: 'wren_honest', fx: () => { set('cellar_hint'); log('Told Wren you could not promise to return.'); } }]);
  n('wren_promise', 'Wren', 'Pinky promise? ...Okay. Don\'t tell Marta.', [bye('Our secret.')]);
  n('wren_honest', 'Wren', 'Honest is better than nice. Take it anyway. But you\'re not allowed to look sad about it.', [bye()]);
  n('wren_hub', 'Wren', 'Do you hear the bell? I do. It sounds like it\'s saying my name.', [{ t: 'What does it say?', next: 'wren_bell' }, { t: 'Stay close to Marta.', end: true }, bye()]);
  n('wren_bell', 'Wren', 'Wren. Wren. Wren. Always the same. ...It sounds sad. Like it\'s asking me to come and stop it.', [bye()], () => set('wren_bell_known'));
  n('wren_after', 'Wren', () => ({ free: 'It stopped! And then everybody sang, and it had WORDS this time. Can I come with you now?', bind: 'The crows talk to me now. They say you\'re holding something that isn\'t yours.', silence: 'It\'s too quiet. There\'s something underneath, listening. It knows my name too.' }[g().flags.choir_end] || '...'), [
    { t: 'Stay safe, Wren.', end: true }, { t: 'You should go with Marta.', end: true }]);

  /* ------------------ VESNA ------------------ */
  n('vesna_1', 'Vesna', 'Well. A traveller with a lantern and no sense. Sit, if you have the nerve. The fire doesn\'t bite. Much.', [
    { t: 'You are the coven.', next: 'vesna_coven' }, { t: 'I need to pass.', next: 'vesna_pass' }, bye('I should go.')], () => set('met_vesna'));
  n('vesna_coven', 'Vesna', 'The Ninth Hearth, or what is left. Eight lit, one cold. Marta was the ninth. She left and took the ledger. We have been waiting for her to come home.', [
    { t: 'What do you want?', next: 'vesna_want' }, { t: 'Marta says you want to wake the Listener.', next: 'vesna_accuse' }, bye()]);
  n('vesna_accuse', 'Vesna', 'Wake it? We want it heard. There is a difference, though not a safe one. A god that has been talked over for centuries is bound to be a little cross.', [{ t: 'What do you want?', next: 'vesna_want' }, bye()]);
  n('vesna_want', 'Vesna', 'Answers, same as you. The Abbey made a god deaf so it would stop asking questions. That is rude. Join us. I\'ll teach you the familiar and the weight of a word well placed.', [
    { t: 'Join the coven. (Pact: +10 taint)', next: 'vesna_join', cond: () => !F('coven_ally') && !F('coven_hostile') }, { t: 'Politely refuse.', next: 'vesna_refuse', cond: () => !F('vesna_refused') && !F('coven_ally') },
    { t: 'Attack her.', next: 'vesna_attack', cond: () => !F('coven_hostile') }, bye()]);
  n('vesna_join', 'Vesna', 'Then say your name into the fire... There. It will remember. Wear this.', [bye('(Leave.)')],
    () => { set('coven_ally'); g().giveItem('talisman_raven', 1); g().unlockSpell('familiar'); g().addCorruption(10); g().addXP(40); log('Swore a pact with the Ninth Hearth.'); });
  n('vesna_refuse', 'Vesna', 'Pity. Take a feather for the road. Ravens like you better than I do.', [bye()], () => { set('vesna_refused'); g().giveItem('raven_feather', 3); log('Refused the Ninth Hearth\'s pact.'); });
  n('vesna_attack', 'Vesna', 'Oh, you foolish thing. Sisters!', [{ t: '(Draw your weapon.)', end: true, fx: () => { set('coven_hostile'); g().coven.convert(); log('Attacked the Ninth Hearth\'s leader.'); } }]);
  n('vesna_pass', 'Vesna', 'The road is yours. The stag in the south-west is not. It guards the oldest green thing in the wood. Greet it with a green hand, or not at all.', [bye()]);
  n('vesna_hub', 'Vesna', () => (F('coven_ally') ? 'Sister. The fire remembers you.' : 'Back again. Take a seat.'), [
    { t: 'Tell me of the Ninth Hearth.', next: 'vesna_coven' }, { t: 'Join the coven. (Pact: +10 taint)', next: 'vesna_join', cond: () => !F('coven_ally') && !F('coven_hostile') }, bye()]);
  n('sister_1', 'Coven Sister', '...eight lit... one cold... (She does not look at you.)', [bye()]);

  /* ------------------ EVENTS & OBJECTS ------------------ */
  n('altar_pray', 'Altar', 'The altar is cold, scored with old candle-burn. Something in you leans toward it anyway.', [
    { t: 'Kneel and pray. (Cleanse 10 taint, once per night)', next: 'altar_done', cond: () => g().player.corruption > 0 && g().flags.prayDay !== g().day, fx: () => { g().flags.prayDay = g().day; g().addCorruption(-10, true); AH.Audio.sfx('save'); } }, bye('(Step away.)')]);
  n('altar_done', 'Altar', 'The candles gutter, then steady. Nothing answers. It is oddly peaceful.');
  n('well_look', 'The Well', 'You lean over the edge. The water is black and perfectly still. Your lantern lights it for a moment and, below your reflection, something else looks up. You step back.', [bye()], () => g().learnLore('bell_heard'));
  n('bell_ring', 'The Bell', 'Your hand closes on the rope. Every instinct says: do not answer. Do you ring it?', [
    { t: 'Ring it.', end: true, fx: () => g().ringBell() }, bye('Let go.')]);
  n('seal_look', 'Blood Seal', 'A hollow the size of a palm. The stone is stained, and not recently. It wants something from you.', [
    { t: 'Press your palm to the seal. (-12 vitality, +3 taint)', end: true, fx: () => g().openBloodSeal(true), cond: () => !g().secretOpen('blood_seal') }, bye('(Step away.)')], () => g().learnLore('seal_inscription'));
  n('thicket_look', 'Thicket', 'A wall of barbed bramble, alive in a way brambles should not be. It stirs when you come close.', [
    { t: 'Rub the Briar Salve on your hands.', end: true, cond: () => g().countItem('salve_briar') > 0 && !g().secretOpen('thicket'), fx: () => g().openThicket('salve') }, bye('(Step away.)')]);
  n('gate_look', 'The Gate', () => (F('choir_end') ? 'The iron is warm now, and it hums a note you cannot name.' : 'A gate of black iron, taller than any gate should be. It is cold. It will not open for the unsung.'), [bye()]);
  n('rubble_look', 'Rubble', 'The stairs down are choked with fallen masonry. Perhaps it can be moved from the other side.', [bye()]);

  /* ------------------ THE CHOIRMASTER: AFTERMATH ------------------ */
  n('ending_1', 'Abbot Orrin', 'The bell stills. The weeping face lifts. For a moment it is only a tired man with a rope in his hands. "Is it quiet?" he asks. "I can no longer tell the difference between quiet and listening."', [
    { t: 'Let go, Orrin. It is over.', next: 'ending_free' }, { t: 'Give me the choir. Their song is mine now.', next: 'ending_bind' }, { t: 'No more. Break the bell.', next: 'ending_silence' }]);
  n('ending_free', 'Abbot Orrin', 'Thank you. Oh, thank you. Sing them home, would you? They know the way, if only someone would open the door.', [{ t: '(Release the choir.)', end: true, fx: () => g().chooseEnding('free') }]);
  n('ending_bind', 'Abbot Orrin', 'No - you do not know what you are asking. It is not a gift. It is a rope and you will hold it forever - but you will not listen, will you. No one ever does.', [{ t: '(Take the song.)', end: true, fx: () => g().chooseEnding('bind') }]);
  n('ending_silence', 'Abbot Orrin', 'Silence. Yes. I wondered if someone would think of that. Be careful. It has been listening a very long time. If you break the bell, it will hear the break.', [{ t: '(Shatter the bell.)', end: true, fx: () => g().chooseEnding('silence') }]);
  n('stag_end', 'The Warden', 'The great stag kneels at last, breathing hard, its rune-lit antlers dimming. It does not look afraid. It looks relieved. It looks at you, and at the green growing between your boots.', [
    { t: 'Spare it, and offer a green hand.', end: true, fx: () => g().stagEnding('spare') }, { t: 'Finish it.', end: true, fx: () => g().stagEnding('kill') }]);

  n('intro', 'Ashen Hollow', 'The road ended an hour ago. The bell has not. It tolls from somewhere above the hamlet, slow and patient, as though it has been calling for you in particular. Smoke rises from one chimney. The rest of the windows are dark.', [
    { t: 'Walk toward the light.', end: true }, { t: 'Check your lantern first.', end: true, fx: () => g().toast('Move with WASD. Your lantern lights the dark.', '#e6dcc4') }]);
  n('intro_missing', 'Ashen Hollow', '...', [bye()]);
})();

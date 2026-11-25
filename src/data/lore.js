/* Ashen Hollow - found writing, inscriptions and the bestiary. Nothing here is a complete answer:
   the history of the Hollow is meant to be pieced together, and some of it contradicts itself. */
(function () {
  'use strict';
  const AH = window.AH;
  const L = (AH.Lore = {});
  const add = (id, type, title, text) => (L[id] = { id, type, title, text });
  add('sign_gate', 'inscription', 'Signpost at the Road', 'ASHEN HOLLOW. Pop. 212.\nBell-days: first light, last light.\nDo not answer the bell.\n(Someone has scratched out "answer" and written "stop".)');
  add('dinner_table', 'note', 'The Table at the Inn', 'The table is laid for twelve. Candles burn on it, not melted by an inch. The bread is warm.\nA chair has been pulled back from the head of the table, as if someone stood up mid-sentence.');
  add('church_door', 'note', 'Notice on the Church Door', 'Vigil suspended until the Abbot returns from the hill.\nThe choir is not to be disturbed.\n- Br. Aldric, for the Chapter\n(Below, in another hand: "He did not return. The choir did.")');
  add('marta_ledger', 'journal', 'The Ninth Hearth Ledger (Page)', 'Nine hearths, nine voices. We were paid in silver to hush the thing under the hill, and we did, for a while.\nThe Abbot said singing would do it cleaner. I believed him. God help me, I believed a priest.\n- M.');
  add('wren_drawing', 'note', 'A Child\'s Drawing', 'Crayon on slate. A very tall figure with a bell where its skirt should be. Beneath it, many small figures with their mouths drawn open.\nOne stick-figure is coloured in blue. It is labelled WREN.');
  add('abbey_tablet', 'inscription', 'Tablet of the Choir', 'LET THE CHOIR STAND BETWEEN THE SLEEPERS AND THE LISTENER.\nSING THE QUIET. SING THE QUIET.\nSHOULD THE SINGING STOP, THE HILL WILL ANSWER.\n[The rest is worn away. The final line might be a name.]');
  add('tomas_journal', 'journal', 'Journal of Brother Tomas', 'Day 11. The bell was rung and the Abbot did not stop. We took turns to relieve him; he would not be relieved.\nDay 12. We sang. I do not remember stopping.\nDay 13. I cannot find my mouth.\nDay 14. We are very quiet now.');
  add('stones_inscription', 'inscription', 'Stones of the Old Hill', 'BEFORE THE ABBEY WAS A HILL THAT HUMMED.\nTHE HUNTER RISES FIRST. THE CROW FOLLOWS. THE CROWN COMES LAST.\n(Three of the stones are carved with a hunter, a crow, a crown.)');
  add('coven_altar', 'inscription', 'Coven Altar', 'NINE HEARTHS. EIGHT LIT.\nThe ninth is not cold. The ninth is waiting.\nA seat has been left empty at the circle.');
  add('hunter_note', 'note', 'A Hunter\'s Last Page', 'The dogs came back wrong. Skulls where their faces were, still wagging.\nI answered. God forgive me, I answered the bell.\nIf you find this, don\'t bury me. They like it when you bury us.');
  add('crypt_tablet', 'inscription', 'Crypt Tablet', 'THE WEEPER HUNGERS FOR THE VOICES OF THE FAITHFUL.\nTHREE NOTES OPEN THE CHOIR GATE: THE LOW, THEN THE HIGH, THEN THE MIDDLE.\nIT WILL ALSO OPEN FOR THE DEAD.');
  add('abbot_journal', 'journal', 'The Abbot\'s Last Entry', 'It does not hate us. I understand that now. It only wants to hear one more voice.\nI have given it all of the choir and it is still listening.\nIf I stop, it speaks. If I keep going - I do not know what I am becoming.\nAldric, forgive me. I will not let go of the rope.');
  add('stag_grove', 'inscription', 'Rune at the Grove', 'THE WARDEN OF THORNS WAS A PRIOR\'S HOUND ONCE.\nIT GUARDS WHAT THE ABBEY BURIED IN THE WOOD.\nGREET IT WITH A GREEN HAND, OR NOT AT ALL.');
  add('seal_inscription', 'inscription', 'Blood Seal', 'A DOOR THAT OPENS FOR THE WILLING.\n(There is a hand-sized hollow at its centre. It is stained, and not recently.)');
  add('reliquary_note', 'note', 'Reliquary Note', 'They kept the saint\'s wounds here. Not her bones; her wounds. Penitents would bleed into the cup, and the cup remembered.\nAnd the cup got hungry.');
  add('procession', 'note', 'The Lantern Procession', 'At the deepest hour, lights walk from the lych-gate to the church. They are not carrying lanterns; they ARE the lanterns.\nThey stop where the wall is thinnest. If you follow, something opens.');
  add('bell_heard', 'note', 'On the Bell', 'You heard it. Not with your ears. It tolled once in the marrow of your teeth, and something far below the hill noted the sound and turned its head.');
  add('choir_free', 'note', 'The Choir, Released', 'They sang one last verse. It had words this time. You did not catch them, but your eyes were wet, and the bell was silent for the first time in a century.');
  add('choir_bind', 'note', 'The Choir, Bound', 'You took the thread of their song and wound it round your wrist. They follow you now, hollow and obedient. It is not a kindness. It might be a mercy.');
  add('choir_silence', 'note', 'The Bell, Broken', 'The bronze split like a bone. In the quiet that followed you heard, very distinctly, something beneath the hill take a long breath.');

  /* bestiary (descriptions only; weaknesses are revealed as you learn them) */
  const B = (AH.Bestiary = {});
  B.wretch = { name: 'The Hollowed', desc: 'Villagers whose voices were taken. They hunt by the quiet. Slow in daylight, hungry at night.', hint: 'Thorns and roots hold them; they stagger when struck from behind a dodge.' };
  B.hound = { name: 'Hollow Hound', desc: 'Dogs with the memory of a pack. They hunt in turns: one bites while the rest circle.', hint: 'Bleed well. Break the circle and the pack falters.' };
  B.wisp = { name: 'Marsh Wisp', desc: 'Not quite fire, not quite grief. Seen at dusk and in fog; shy of daylight.', hint: 'Blades barely harm them. Magic does. Starlight and soul-fire most of all.' };
  B.sentinel = { name: 'Bone Sentinel', desc: 'An abbey guard, still on watch. Its shield turns almost anything aside.', hint: 'Strike the unprotected side. It does not bleed. Starlight cracks it.' };
  B.hexcaller = { name: 'Hexcaller', desc: 'A hooded caster from a coven that did not dissolve when it should have.', hint: 'Fragile. Closes distance in a blink, but only when cornered.' };
  B.wraith = { name: 'Choir Wraith', desc: 'One of the singers. It still has its mouth.', hint: 'Fast, fragile, and brave in numbers.' };
  B.stag = { name: 'Warden of Thorns', desc: 'A great stag grown through with bramble and old runes. It guards something and does not remember what.', hint: 'It charges at what moves. Respond to its stillness.' };
  B.choirmaster = { name: 'The Weeping Choirmaster', desc: 'Abbot Orrin Vael, who would not let go of the rope. The bell is no longer separate from him.', hint: 'The bell shakes the ground in rings. Listen between the tolls.' };
  B.crow = { name: 'Crow', desc: 'They are more than they seem and less than they pretend. They notice you.', hint: 'Startled crows warn nearby foes. Their feathers are valuable to the right people.' };
})();

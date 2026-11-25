/* Ashen Hollow - the arsenal: elemental spells, deeper skill-tree rows and elemental gear for every discipline.
   Elements: FROST (necromancy, astral), FIRE (blood, druid, witch), STORM (druid, astral). The reactions live in game/elements.js. */
(function () {
  'use strict';
  const AH = window.AH, Sp = AH.Spells, K = AH.Skills, I = AH.Items;
  const spell = (o) => (Sp[o.id] = Object.assign({ cast: 0.25, rec: 0.2, cd: 2, fx: {}, tags: [], p: {}, tier: 2 }, o));
  const skill = (o) => (K[o.id] = Object.assign({ cost: 1, req: [], mods: {} }, o));
  const item = (o) => (I[o.id] = Object.assign({ rarity: 2, stack: false, scheme: 'neutral' }, o));

  /* ================= SPELLS ================= */
  spell({ id: 'grave_chill', name: 'Grave Chill', school: 'necro', icon: 'snow', carrier: 'nova', cost: { souls: 2 }, cast: 0.3, rec: 0.3, cd: 4, unlock: 'n_rime',
    desc: 'The cold between graves, released in a ring. Chills everything near you; the thrice-chilled freeze solid.', hint: 'Frozen foes shatter under any blow. Bone resists frost; spirits do not.',
    p: { r: 62, dmg: 13, scaleMissing: 0, kb: 110 }, tags: ['necro', 'frost'] });
  spell({ id: 'hoarfrost', name: 'Hoarfrost Shroud', school: 'necro', icon: 'snow', carrier: 'aura', cost: { souls: 3 }, cast: 0.35, rec: 0.2, cd: 14, unlock: 'n_shroud',
    desc: 'A mantle of killing rime follows you. Whatever draws near is chilled, stacked and finally frozen.', hint: 'Fight in melee - the shroud does the rest.',
    p: { dur: 11, r: 46, tick: 0.5, dmg: 3 }, tags: ['necro', 'frost'] });
  spell({ id: 'wildfire', name: 'Wildfire', school: 'druid', icon: 'flame', carrier: 'cone', cost: { verd: 3 }, cast: 0.3, rec: 0.3, cd: 3, unlock: 'd_wild',
    desc: 'A roaring breath of green-gold flame. Sets foes alight and eats thorn thickets whole.', hint: 'Burning foes ignite spore clouds. Water and frost douse the fire.',
    p: { range: 76, arc: 1.05, dmg: 22, ticks: 3, dur: 0.45 }, tags: ['druid', 'fire'] });
  spell({ id: 'stormbind', name: 'Stormbind', school: 'druid', icon: 'chain', carrier: 'chain', cost: { verd: 4 }, cast: 0.3, rec: 0.3, cd: 3.5, unlock: 'd_bind',
    desc: 'Bind the storm to a foe and let it leap - to the next, and the next. Shocks all it touches.', hint: 'Wet foes conduct for a third more.',
    p: { range: 120, dmg: 22, jumps: 3, jump: 64 }, tags: ['druid', 'storm', 'lightning', 'spark'] });
  spell({ id: 'cinder_needles', name: 'Cinder Needles', school: 'blood', icon: 'needles', carrier: 'barrage', cost: { hp: 6 }, cast: 0.2, rec: 0.25, cd: 2, unlock: 'b_needles',
    desc: 'Five needles of boiling blood. Each one bleeds, and each one burns.', hint: 'Spread wide up close; they converge at range.',
    p: { n: 5, spread: 0.5, dmg: 7, speed: 270, pierce: 0, r: 3, life: 0.55, color: '#ff7a3a', trail: '#a02a1a', guard: 'pierce' }, fx: { bleed: { t: 3, dps: 2 } }, tags: ['blood', 'fire'] });
  spell({ id: 'blood_furnace', name: 'Blood Furnace', school: 'blood', icon: 'flame', carrier: 'aura', cost: { hp: 10 }, cast: 0.35, rec: 0.2, cd: 16, unlock: 'b_furnace',
    desc: 'Stoke the fire in your veins. Everything close to you burns - and so do you, a little.', hint: 'It will not kill you. It will try.',
    p: { dur: 9, r: 40, tick: 0.6, dmg: 4, drain: 1.2 }, tags: ['blood', 'fire'] });
  spell({ id: 'rime_comet', name: 'Rime Comet', school: 'astral', icon: 'comet', carrier: 'strike', cost: { aether: 35 }, cast: 0.6, rec: 0.3, cd: 4, unlock: 'a_comet',
    desc: 'A star that fell from the coldest dark. It lands late, and what it touches does not move again.', hint: 'A frozen foe shatters under a follow-up blow.',
    p: { r: 40, delay: 0.9, dmg: 34, range: 140 }, tags: ['astral', 'star', 'spark', 'frost'] });
  spell({ id: 'arc_surge', name: 'Arc Surge', school: 'astral', icon: 'chain', carrier: 'chain', cost: { aether: 24 }, cast: 0.4, rec: 0.25, cd: 3, unlock: 'a_arc',
    desc: 'Aether given edges: a bright arc that leaps between foes, four times if it can.', hint: 'Casting is slow, and being struck breaks it.',
    p: { range: 130, dmg: 24, jumps: 4, jump: 70 }, tags: ['astral', 'storm', 'lightning', 'spark'] });
  spell({ id: 'witchfire', name: 'Witchfire', school: 'witch', icon: 'flame', carrier: 'cone', cost: { reagent: 'bone_dust' }, cast: 0.35, rec: 0.3, cd: 4, unlock: 'w_fire',
    desc: 'Cold violet flame that clings. Burns, and leaves the target hexed.', hint: 'A hexed foe takes the flame\'s echo too.',
    p: { range: 66, arc: 0.9, dmg: 18, ticks: 3, dur: 0.5 }, fx: { hex: { t: 8 } }, tags: ['witch', 'fire', 'hex'] });
  spell({ id: 'plague_breath', name: 'Plague Breath', school: 'witch', icon: 'cloud', carrier: 'cone', cost: { reagent: 'wolfsbane' }, cast: 0.35, rec: 0.3, cd: 5, unlock: 'w_plague',
    desc: 'Exhale something old and green. It sickens, slows and does not stop.', hint: 'Poison ignores armour. Fire makes it worse for everyone.',
    p: { range: 70, arc: 1.1, dmg: 8, ticks: 3, dur: 0.55 }, fx: { poison: { t: 7, dps: 5 }, slow: { t: 2, k: 0.7 } }, tags: ['witch', 'poison'] });

  /* ================= SKILLS (rows 3 and 4 of every discipline) ================= */
  skill({ id: 'n_rime', br: 'necro', x: 0, y: 2, name: 'Grave Rime', icon: 'snow', desc: 'Unlocks Grave Chill. The cold learns your name.', cost: 2, req: ['n_mastery'], unlock: 'grave_chill' });
  skill({ id: 'n_winter', br: 'necro', x: 1, y: 2, name: 'Winter\'s Tithe', icon: 'snow', desc: '+25% frost damage.', req: ['n_rime'], mods: { frost: 0.25 } });
  skill({ id: 'n_shroud', br: 'necro', x: 0, y: 3, name: 'Hoarfrost Litany', icon: 'ward', desc: 'Unlocks Hoarfrost Shroud.', cost: 2, req: ['n_winter'], unlock: 'hoarfrost' });
  skill({ id: 'n_deep', br: 'necro', x: 1, y: 3, name: 'Deep Freeze', icon: 'snow', desc: '+25% frost damage. Foes freeze after only two chills.', cost: 3, req: ['n_shroud'], mods: { frost: 0.25, freezeAt: 1 } });
  skill({ id: 'd_wild', br: 'druid', x: 0, y: 2, name: 'Wildfire Bloom', icon: 'flame', desc: 'Unlocks Wildfire.', cost: 2, req: ['d_storm'], unlock: 'wildfire' });
  skill({ id: 'd_kindle', br: 'druid', x: 1, y: 2, name: 'Kindled Seed', icon: 'flame', desc: '+25% fire damage. Burns last 2s longer.', req: ['d_wild'], mods: { fire: 0.25, burnDur: 2 } });
  skill({ id: 'd_bind', br: 'druid', x: 0, y: 3, name: 'Stormbinder', icon: 'chain', desc: 'Unlocks Stormbind.', cost: 2, req: ['d_kindle'], unlock: 'stormbind' });
  skill({ id: 'd_tempest', br: 'druid', x: 1, y: 3, name: 'Eye of the Tempest', icon: 'bolt', desc: '+30% storm damage. Lightning leaps one extra time.', cost: 3, req: ['d_bind'], mods: { storm: 0.3, chainN: 1 } });
  skill({ id: 'b_needles', br: 'blood', x: 0, y: 2, name: 'Cinder Veins', icon: 'needles', desc: 'Unlocks Cinder Needles.', cost: 2, req: ['b_rapture'], unlock: 'cinder_needles' });
  skill({ id: 'b_ember', br: 'blood', x: 1, y: 2, name: 'Ember Blood', icon: 'flame', desc: '+25% fire damage. Burns last 1.5s longer.', req: ['b_needles'], mods: { fire: 0.25, burnDur: 1.5 } });
  skill({ id: 'b_furnace', br: 'blood', x: 0, y: 3, name: 'The Furnace Within', icon: 'flame', desc: 'Unlocks Blood Furnace.', cost: 2, req: ['b_ember'], unlock: 'blood_furnace' });
  skill({ id: 'b_pyre', br: 'blood', x: 1, y: 3, name: 'Pyre of the Self', icon: 'flame', desc: '+30% fire damage. Blood spells cost 10% less vitality.', cost: 3, req: ['b_furnace'], mods: { fire: 0.3, hpCostMul: -0.1 } });
  skill({ id: 'a_comet', br: 'astral', x: 0, y: 2, name: 'Cold Between Stars', icon: 'comet', desc: 'Unlocks Rime Comet.', cost: 2, req: ['a_slip'], unlock: 'rime_comet' });
  skill({ id: 'a_cold', br: 'astral', x: 1, y: 2, name: 'Absolute Zero', icon: 'snow', desc: '+25% frost damage. Foes freeze after two chills.', req: ['a_comet'], mods: { frost: 0.25, freezeAt: 1 } });
  skill({ id: 'a_arc', br: 'astral', x: 0, y: 3, name: 'Arc of Heaven', icon: 'chain', desc: 'Unlocks Arc Surge.', cost: 2, req: ['a_cold'], unlock: 'arc_surge' });
  skill({ id: 'a_aurora', br: 'astral', x: 1, y: 3, name: 'Aurora', icon: 'star', desc: '+30% storm damage, one extra leap, +15% aether recovery.', cost: 3, req: ['a_arc'], mods: { storm: 0.3, chainN: 1, aetherRegen: 0.15 } });
  skill({ id: 'w_fire', br: 'witch', x: 0, y: 2, name: 'Cold Flame', icon: 'flame', desc: 'Unlocks Witchfire.', cost: 2, req: ['w_circle'], unlock: 'witchfire' });
  skill({ id: 'w_ember', br: 'witch', x: 1, y: 2, name: 'Cinder Hex', icon: 'flame', desc: '+25% fire damage. Hexes last 4s longer.', req: ['w_fire'], mods: { fire: 0.25, hexDur: 4 } });
  skill({ id: 'w_plague', br: 'witch', x: 0, y: 3, name: 'Green Sickness', icon: 'cloud', desc: 'Unlocks Plague Breath.', cost: 2, req: ['w_ember'], unlock: 'plague_breath' });
  skill({ id: 'w_blight', br: 'witch', x: 1, y: 3, name: 'Blight Mother', icon: 'cloud', desc: 'Poison is 60% deadlier and Witchfire hits 20% harder.', cost: 3, req: ['w_plague'], mods: { poisonMul: 0.6, fire: 0.2 } });

  /* ================= EQUIPMENT ================= */
  /* weapons: `elem` imbues every melee blow with that element (+elemDmg bonus damage) */
  item({ id: 'ember_cleaver', name: 'Ember Cleaver', type: 'weapon', icon: 'cleaver', scheme: 'blood', rarity: 2, elem: 'fire', elemDmg: 0.25, desc: 'Forged in a burning house and never quite cooled. Every cut leaves a coal behind.', w: { dmg: 14, spd: 0.85, reach: 30, arc: 2.0, kb: 1.3, vsUndead: 1 }, mods: { fire: 0.1 } });
  item({ id: 'rime_glaive', name: 'Rime Glaive', type: 'weapon', icon: 'blade', scheme: 'astral', rarity: 2, elem: 'frost', elemDmg: 0.2, desc: 'A long blade that frosts the air it passes through. Foes struck slow, and then stop.', w: { dmg: 11, spd: 0.95, reach: 38, arc: 1.4, kb: 0.9, vsUndead: 1 }, mods: { frost: 0.1 } });
  item({ id: 'tempest_spear', name: 'Tempest Spear', type: 'weapon', icon: 'lance', scheme: 'druid', rarity: 3, elem: 'storm', elemDmg: 0.2, desc: 'Lightning remembers the tree this was cut from. Blows arc to the next foe.', w: { dmg: 10, spd: 1.15, reach: 42, arc: 1.0, kb: 0.8, vsUndead: 1 }, mods: { storm: 0.12 } });
  item({ id: 'viper_stiletto', name: 'Viper\'s Tooth', type: 'weapon', icon: 'blade', scheme: 'witch', rarity: 2, elem: 'poison', elemDmg: 0, desc: 'Thin, fast, and wet with something that should not be wet. Every cut poisons.', w: { dmg: 7, spd: 1.5, reach: 20, arc: 1.3, kb: 0.6, vsUndead: 0.7 }, mods: { poisonMul: 0.3 } });
  item({ id: 'sceptre_ash', name: 'Sceptre of Ash', type: 'weapon', icon: 'staff', scheme: 'neutral', rarity: 3, desc: 'Not a weapon - a focus. Every element answers a little louder through it.', w: { dmg: 6, spd: 1.0, reach: 34, arc: 1.2, kb: 0.8, vsUndead: 1 }, mods: { dmgSpell: 0.18, fire: 0.1, frost: 0.1, storm: 0.1 } });
  /* cloaks */
  item({ id: 'mantle_frostfur', name: 'Frostfur Mantle', type: 'cloak', icon: 'cloak', scheme: 'astral', rarity: 2, desc: 'Cut from something that wintered in a grave. Cold flows to the wearer.', mods: { armor: 0.1, frost: 0.15 } });
  item({ id: 'shroud_cinder', name: 'Cinder Shroud', type: 'cloak', icon: 'cloak', scheme: 'blood', rarity: 2, desc: 'Warm to the touch, always. Fire obeys its wearer a little more.', mods: { fire: 0.2, corruptGain: -0.1 } });
  item({ id: 'cloak_stormweave', name: 'Stormweave Cloak', type: 'cloak', icon: 'cloak', scheme: 'druid', rarity: 3, desc: 'Woven in a thunderstorm. It crackles in the dry, and its wearer is quicker for it.', mods: { storm: 0.2, speed: 0.04 } });
  item({ id: 'cape_greenwarden', name: 'Greenwarden Cape', type: 'cloak', icon: 'cloak', scheme: 'druid', rarity: 2, desc: 'Moss-lined. Verdance returns faster and thorns find you less often.', mods: { verdRegen: 0.25, armor: 0.06 } });
  /* relics */
  item({ id: 'ember_heart', name: 'Ember Heart', type: 'relic', icon: 'flame', scheme: 'blood', rarity: 2, desc: 'A coal that has not gone out. +25% fire damage.', mods: { fire: 0.25 } });
  item({ id: 'winter_eye', name: 'Winter\'s Eye', type: 'relic', icon: 'snow', scheme: 'astral', rarity: 2, desc: 'A lens of black ice. +25% frost damage.', mods: { frost: 0.25 } });
  item({ id: 'thunder_bead', name: 'Thunder Bead', type: 'relic', icon: 'chain', scheme: 'druid', rarity: 3, desc: 'Hums when rain is near. +25% storm damage and lightning leaps one further.', mods: { storm: 0.25, chainN: 1 } });
  item({ id: 'wildfire_seed', name: 'Wildfire Seed', type: 'relic', icon: 'leaf', scheme: 'druid', rarity: 2, desc: 'A seed that only sprouts in ash. Burns last 2s longer; +15% fire damage.', mods: { burnDur: 2, fire: 0.15 } });
  item({ id: 'rime_ring', name: 'Ring of Rime', type: 'relic', icon: 'ring', scheme: 'necro', rarity: 3, desc: 'Cold to the bone. Foes freeze after two chills.', mods: { freezeAt: 1, frost: 0.1 } });
  item({ id: 'phoenix_ash', name: 'Phoenix Ash', type: 'relic', icon: 'dust', scheme: 'witch', rarity: 3, desc: 'What is left when something refuses to stay dead. +12% to every element; blows mend you a little.', mods: { elem: 0.12, leech: 0.03 } });

  /* each discipline begins with a small elemental heirloom, already worn */
  AH.StarterRelic = { necro: 'winter_eye', druid: 'wildfire_seed', blood: 'ember_heart', astral: 'thunder_bead', witch: 'phoenix_ash' };
  AH.GearDrops = { stag: ['tempest_spear'], choirmaster: ['sceptre_ash'], elite: ['ember_cleaver', 'rime_glaive', 'viper_stiletto', 'mantle_frostfur', 'shroud_cinder', 'cloak_stormweave', 'cape_greenwarden', 'ember_heart', 'winter_eye', 'thunder_bead', 'wildfire_seed', 'rime_ring', 'phoenix_ash'] };
})();

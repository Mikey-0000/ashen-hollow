/* Ashen Hollow - skill tree. Each node grants stat modifiers ("mods") and/or unlocks a spell.
   Positions are on a small grid per branch for the tree screen. */
(function () {
  'use strict';
  const AH = window.AH;
  const K = (AH.Skills = {});
  const add = (o) => (K[o.id] = Object.assign({ cost: 1, req: [], mods: {} }, o));
  AH.SkillBranches = [
    { id: 'general', name: 'Wayfarer', col: '#c8bfa8', school: 'neutral' },
    { id: 'necro', name: 'Necromancy', col: '#7fe0c0', school: 'necro' }, { id: 'druid', name: 'Druidism', col: '#8fd06a', school: 'druid' },
    { id: 'blood', name: 'Blood Magic', col: '#d04050', school: 'blood' }, { id: 'astral', name: 'Astral Magic', col: '#7fa6ff', school: 'astral' }, { id: 'witch', name: 'Witchcraft', col: '#c27be0', school: 'witch' },
  ];
  /* general */
  add({ id: 'g_vit1', br: 'general', x: 0, y: 0, name: 'Vitality I', icon: 'heart', desc: '+15 maximum vitality.', mods: { maxHp: 15 } });
  add({ id: 'g_vit2', br: 'general', x: 0, y: 1, name: 'Vitality II', icon: 'heart', desc: '+20 maximum vitality.', req: ['g_vit1'], mods: { maxHp: 20 } });
  add({ id: 'g_res', br: 'general', x: 1, y: 0, name: 'Resolve', icon: 'shield', desc: '+20 stamina and faster recovery.', mods: { maxStam: 20, stamRegen: 0.15 } });
  add({ id: 'g_swift', br: 'general', x: 1, y: 1, name: 'Fleet-Footed', icon: 'boot', desc: '+6% movement speed.', req: ['g_res'], mods: { speed: 0.06 } });
  add({ id: 'g_dodge', br: 'general', x: 2, y: 0, name: 'Veil Step', icon: 'wing', desc: 'Longer invulnerability while dodging.', mods: { iframes: 0.06 } });
  add({ id: 'g_blade', br: 'general', x: 2, y: 1, name: 'Keen Edge', icon: 'blade', desc: '+12% melee damage.', req: ['g_dodge'], mods: { dmgMelee: 0.12 } });
  add({ id: 'g_lantern', br: 'general', x: 3, y: 0, name: 'Wick-Trimmer', icon: 'candle', desc: 'Your lantern burns 15% wider.', mods: { lantern: 0.15 } });
  add({ id: 'g_lore', br: 'general', x: 3, y: 1, name: 'Scholar of Dread', icon: 'book', desc: 'Forbidden craft taints you 15% more slowly.', req: ['g_lantern'], mods: { corruptGain: -0.15 } });
  /* necromancy */
  add({ id: 'n_cache', br: 'necro', x: 0, y: 0, name: 'Soul Cache', icon: 'skull', desc: '+2 maximum souls.', mods: { soulCap: 2 } });
  add({ id: 'n_hunger', br: 'necro', x: 1, y: 0, name: 'Grave Hunger', icon: 'tooth', desc: '30% chance a kill yields an extra soul.', req: ['n_cache'], mods: { soulChance: 0.3 } });
  add({ id: 'n_ward', br: 'necro', x: 0, y: 1, name: 'Bone Litany', icon: 'ward', desc: 'Unlocks Bone Ward.', cost: 2, req: ['n_cache'], unlock: 'bone_ward' });
  add({ id: 'n_mastery', br: 'necro', x: 1, y: 1, name: 'Choirmaster\'s Hand', icon: 'thrall', desc: 'Thralls last 10s longer and a third may stand. Soul Lance pierces further.', cost: 2, req: ['n_ward'], mods: { thrallDur: 10, thrallMax: 1, lancePierce: 2, lanceDmg: 0.25 } });
  /* druidism */
  add({ id: 'd_roots', br: 'druid', x: 0, y: 0, name: 'Deep Roots', icon: 'leaf', desc: '+3 verdance cap and +30% regeneration.', mods: { verdCap: 3, verdRegen: 0.3 } });
  add({ id: 'd_warden', br: 'druid', x: 1, y: 0, name: 'Thornwarden', icon: 'thorn', desc: 'Thorns last 1.5s longer and cut deeper.', req: ['d_roots'], mods: { thornDur: 1.5, thornDmg: 0.5 } });
  add({ id: 'd_rush', br: 'druid', x: 0, y: 1, name: 'Heart of the Stag', icon: 'antler', desc: 'Unlocks Stag Rush.', cost: 2, req: ['d_roots'], unlock: 'stag_rush' });
  add({ id: 'd_storm', br: 'druid', x: 1, y: 1, name: 'Stormcaller', icon: 'bolt', desc: 'Unlocks Call the Storm.', cost: 2, req: ['d_rush'], unlock: 'storm_call' });
  /* blood */
  add({ id: 'b_thick', br: 'blood', x: 0, y: 0, name: 'Thick Blood', icon: 'drop', desc: 'Blood spells cost 20% less vitality.', mods: { hpCostMul: -0.2 } });
  add({ id: 'b_hemo', br: 'blood', x: 1, y: 0, name: 'Hemomancy', icon: 'drop', desc: 'Bleeding wounds are 50% deadlier.', req: ['b_thick'], mods: { bleedMul: 0.5 } });
  add({ id: 'b_burst', br: 'blood', x: 0, y: 1, name: 'Rupture', icon: 'burst', desc: 'Unlocks Sanguine Burst.', cost: 2, req: ['b_thick'], unlock: 'sanguine_burst' });
  add({ id: 'b_rapture', br: 'blood', x: 1, y: 1, name: 'Sanguine Rapture', icon: 'chalice', desc: 'Crimson Pact hits harder and bites back less. +15% lifesteal on lashes.', cost: 2, req: ['b_burst'], mods: { pactDmg: 0.2, pactTaken: -0.15, leash: 0.15 } });
  /* astral */
  add({ id: 'a_sky', br: 'astral', x: 0, y: 0, name: 'Wide Sky', icon: 'star', desc: '+30 maximum aether.', mods: { aetherCap: 30 } });
  add({ id: 'a_gaze', br: 'astral', x: 1, y: 0, name: 'Stargazer', icon: 'eye', desc: '+35% aether recovery.', req: ['a_sky'], mods: { aetherRegen: 0.35 } });
  add({ id: 'a_well', br: 'astral', x: 0, y: 1, name: 'Event Horizon', icon: 'spiral', desc: 'Unlocks Gravity Well.', cost: 2, req: ['a_sky'], unlock: 'gravity_well' });
  add({ id: 'a_slip', br: 'astral', x: 1, y: 1, name: 'Slipstream', icon: 'step', desc: 'Astral Step costs 30% less and burns foes you pass.', cost: 2, req: ['a_well'], mods: { blinkCost: -0.3 }, flags: { blinkDmg: 1 } });
  /* witchcraft */
  add({ id: 'w_wisdom', br: 'witch', x: 0, y: 0, name: 'Hedge Wisdom', icon: 'leaf', desc: '30% chance a spell consumes no reagent.', mods: { reagentSave: 0.3 } });
  add({ id: 'w_malice', br: 'witch', x: 1, y: 0, name: 'Malediction', icon: 'hex', desc: 'Hexes last 6s longer and echo more.', req: ['w_wisdom'], mods: { hexPower: 0.15, hexDur: 6 } });
  add({ id: 'w_fam', br: 'witch', x: 0, y: 1, name: 'Bonded Crow', icon: 'crow', desc: 'Unlocks Call Familiar.', cost: 2, req: ['w_wisdom'], unlock: 'familiar' });
  add({ id: 'w_circle', br: 'witch', x: 1, y: 1, name: 'Salt Circle Mastery', icon: 'salt', desc: 'Wards last 5s longer and span wider.', cost: 2, req: ['w_fam'], mods: { wardDur: 5, wardR: 10 } });

  AH.xpFor = (lvl) => Math.floor(30 + 22 * lvl + 4 * lvl * lvl);
  AH.MAX_LEVEL = 20;
})();

/* Ashen Hollow - the five disciplines. Spells are data: a carrier (how it is delivered), a cost
   in the discipline's own resource, parameters and on-hit effects. Fused spells merge two of these. */
(function () {
  'use strict';
  const AH = window.AH;
  AH.Schools = {
    necro: { id: 'necro', name: 'Necromancy', col: '#7fe0c0', res: 'souls', resName: 'Souls', cap: 8, tagline: 'Fuel from endings. Command what falls.',
      rule: 'Souls are gathered from the fallen and spent to command the dead. Undead foes yield nothing.', progress: 'Souls cap, thralls, piercing.' },
    druid: { id: 'druid', name: 'Druidism', col: '#8fd06a', res: 'verd', resName: 'Verdance', cap: 10, tagline: 'Strength drawn from living ground.',
      rule: 'Verdance returns while you stand on grass, moss or in rain - and dies on stone and underground.', progress: 'Regeneration, thorns, storms.' },
    blood: { id: 'blood', name: 'Blood Magic', col: '#d04050', res: 'hp', resName: 'Vitality', cap: 0, tagline: 'Power paid for in flesh.',
      rule: 'Spells cost your own vitality, and hit harder the closer to death you stand. Bone and spirit do not bleed.', progress: 'Bleeding, lifesteal, pacts.' },
    astral: { id: 'astral', name: 'Astral Magic', col: '#7fa6ff', res: 'aether', resName: 'Aether', cap: 100, tagline: 'Distance, delay and inevitability.',
      rule: 'Aether recovers slowly (faster beneath open night sky). Casts are slow and being struck breaks them.', progress: 'Capacity, recovery, blinks, singularities.' },
    witch: { id: 'witch', name: 'Witchcraft', col: '#c27be0', res: 'reagent', resName: 'Reagents', cap: 0, tagline: 'Patience, preparation, and a long memory.',
      rule: 'Spells consume reagents gathered or brewed. Curses spread and linger; nothing is instant.', progress: 'Reagent thrift, hex power, wards, familiars.' },
  };
  AH.SchoolOrder = ['necro', 'druid', 'blood', 'astral', 'witch'];

  const Sp = (AH.Spells = {});
  const add = (o) => (Sp[o.id] = Object.assign({ cast: 0.2, rec: 0.2, cd: 0.5, fx: {}, tags: [], p: {} }, o));

  /* ================= NECROMANCY ================= */
  add({ id: 'soul_lance', name: 'Soul Lance', school: 'necro', icon: 'lance', carrier: 'bolt', cost: { souls: 1 }, cast: 0.2, rec: 0.22, cd: 0.5, tier: 1,
    desc: 'A piercing lance of pale light. Ignores guards and passes through several foes.', hint: 'Marked foes that die grant an extra soul.',
    p: { dmg: 17, speed: 240, pierce: 4, r: 3, life: 0.8, color: '#7fe0c0', trail: '#2a8a70', guard: 'pierce' }, fx: { mark: 1 }, tags: ['necro', 'soul'] });
  add({ id: 'raise_thrall', name: 'Raise Thrall', school: 'necro', icon: 'thrall', carrier: 'raise', cost: { souls: 3 }, cast: 0.5, rec: 0.3, cd: 2.5, tier: 1,
    desc: 'Drag a fallen foe back to its feet to fight for you. Needs a corpse nearby.', hint: 'Thralls crumble after a time. Bound by Blood Pact, they frenzy.',
    p: { dur: 24, range: 100, max: 2 }, tags: ['necro'] });
  add({ id: 'bone_ward', name: 'Bone Ward', school: 'necro', icon: 'ward', carrier: 'orbit', cost: { souls: 2 }, cast: 0.25, rec: 0.2, cd: 4, tier: 2, unlock: 'n_ward',
    desc: 'Shards of bone circle you, shredding what touches you and shattering projectiles.', hint: 'Costs the ward, not your skin.',
    p: { dur: 9, n: 4, dmg: 9, r: 24 }, tags: ['necro', 'bone'] });
  add({ id: 'rite_choir', name: 'Rite of the Hollow Choir', school: 'necro', icon: 'choir', carrier: 'choir', cost: { souls: 8 }, cast: 1.0, rec: 0.6, cd: 20, forbidden: true,
    desc: 'FORBIDDEN. A spectral choir rains ruin on everything near you.', hint: 'Price: +25 taint and -5 maximum vitality, permanently.',
    p: { dur: 5, dmg: 11, r: 90 }, price: { corruption: 25, maxHp: -5 }, tags: ['necro', 'soul'] });
  /* ================= DRUIDISM ================= */
  add({ id: 'thorn_snare', name: 'Thorn Snare', school: 'druid', icon: 'thorn', carrier: 'zone', cost: { verd: 3 }, cast: 0.3, rec: 0.2, cd: 1.5, tier: 1,
    desc: 'Barbed roots burst from the ground, rooting foes and cutting those who struggle.', hint: 'Rooted foes take heavy damage from Blood Magic.',
    p: { r: 30, dur: 3.2, tick: 0.5, dmg: 4, range: 110, kind: 'thorns' }, fx: { root: { t: 0.9 } }, tags: ['druid', 'thorn'] });
  add({ id: 'spore_cloud', name: 'Spore Cloud', school: 'druid', icon: 'cloud', carrier: 'zone', cost: { verd: 2 }, cast: 0.25, rec: 0.2, cd: 2, tier: 1,
    desc: 'A drifting poison cloud. It chokes, slows - and is violently flammable.', hint: 'Any spark, star or torch-flame detonates it.',
    p: { r: 34, dur: 5.5, tick: 0.5, dmg: 2, range: 100, kind: 'spores', gas: true }, fx: { poison: { t: 3, dps: 3 }, slow: { t: 1, k: 0.65 } }, tags: ['druid', 'gas'] });
  add({ id: 'stag_rush', name: 'Stag Rush', school: 'druid', icon: 'antler', carrier: 'dash', cost: { verd: 3 }, cast: 0.12, rec: 0.15, cd: 2.5, tier: 2, unlock: 'd_rush',
    desc: 'Charge as the stag charges: shoulder through foes, immune to blows for a breath.', hint: 'A repositioning tool as much as a weapon.',
    p: { dist: 96, dmg: 15, kb: 170, iframes: 0.32 }, tags: ['druid'] });
  add({ id: 'storm_call', name: 'Call the Storm', school: 'druid', icon: 'bolt', carrier: 'storm', cost: { verd: 5 }, cast: 0.55, rec: 0.3, cd: 5, tier: 3, unlock: 'd_storm',
    desc: 'Call lightning from open sky onto the ground you name. Useless indoors. Terrible in the rain.', hint: 'In rain, bolts chain between wet foes.',
    p: { n: 3, dmg: 26, r: 22, range: 130, sky: true }, tags: ['druid', 'lightning', 'spark'] });
  /* ================= BLOOD ================= */
  add({ id: 'blood_lash', name: 'Blood Lash', school: 'blood', icon: 'drop', carrier: 'lash', cost: { hp: 4 }, cast: 0.14, rec: 0.2, cd: 0.45, tier: 1,
    desc: 'A whip of living blood. Heals you for part of the harm it does, and leaves the target bleeding.', hint: 'Does nothing to bone or spirit.',
    p: { dmg: 13, range: 62, arc: 1.0, leech: 0.35 }, fx: { bleed: { t: 4, dps: 3 } }, tags: ['blood'] });
  add({ id: 'crimson_pact', name: 'Crimson Pact', school: 'blood', icon: 'chalice', carrier: 'buff', cost: { hp: 10 }, cast: 0.3, rec: 0.2, cd: 12, tier: 1,
    desc: 'Seal a pact: greater damage and lifesteal for a time - but you take more harm in return.', hint: 'Thralls drink it too and go berserk.',
    p: { dur: 8, dmgMul: 1.4, lifesteal: 0.18, takenMul: 1.25 }, tags: ['blood'] });
  add({ id: 'sanguine_burst', name: 'Sanguine Burst', school: 'blood', icon: 'burst', carrier: 'nova', cost: { hp: 8 }, cast: 0.3, rec: 0.3, cd: 3, tier: 2, unlock: 'b_burst',
    desc: 'Rupture outwards in a ring of force. The weaker you are, the harder it lands.', hint: 'Bleeding foes take extra.',
    p: { r: 56, dmg: 20, scaleMissing: 1.2, kb: 190 }, fx: { bleed: { t: 3, dps: 2 } }, tags: ['blood'] });
  add({ id: 'crimson_eclipse', name: 'Crimson Eclipse', school: 'blood', icon: 'burst', carrier: 'nova', cost: { hpTo: 1 }, cast: 1.0, rec: 0.7, cd: 30, forbidden: true,
    desc: 'FORBIDDEN. Give everything. The room answers in kind.', hint: 'Price: +20 taint. Leaves you at one vitality.',
    p: { r: 130, dmg: 95, scaleMissing: 0, kb: 260 }, fx: { bleed: { t: 6, dps: 4 } }, price: { corruption: 20 }, tags: ['blood', 'spark'] });
  /* ================= ASTRAL ================= */
  add({ id: 'astral_step', name: 'Astral Step', school: 'astral', icon: 'step', carrier: 'blink', cost: { aether: 15 }, cast: 0.1, rec: 0.1, cd: 1.0, tier: 1,
    desc: 'Step through the gap between instants. Reveals hidden things near where you land.', hint: 'Cannot pass solid walls.',
    p: { dist: 78, reveal: 120 }, tags: ['astral'] });
  add({ id: 'starfall', name: 'Starfall', school: 'astral', icon: 'star', carrier: 'strike', cost: { aether: 30 }, cast: 0.55, rec: 0.3, cd: 2.5, tier: 1,
    desc: 'Name a place; a star arrives there a moment later. Stronger beneath a night sky.', hint: 'Detonates gas.',
    p: { r: 34, delay: 1.0, dmg: 44, range: 136 }, tags: ['astral', 'star', 'spark'] });
  add({ id: 'gravity_well', name: 'Gravity Well', school: 'astral', icon: 'spiral', carrier: 'well', cost: { aether: 25 }, cast: 0.45, rec: 0.25, cd: 4, tier: 2, unlock: 'a_well',
    desc: 'A point of unbearable weight. Drags foes and projectiles inward and crushes them.', hint: 'Gather foes, then ignite what you gathered.',
    p: { r: 64, dur: 3.2, pull: 95, dmg: 3, range: 110 }, tags: ['astral'] });
  /* ================= WITCHCRAFT ================= */
  add({ id: 'hex', name: 'Hex', school: 'witch', icon: 'hex', carrier: 'bolt', cost: { reagent: 'raven_feather' }, cast: 0.25, rec: 0.25, cd: 0.8, tier: 1,
    desc: 'A curse in bolt form. Hexed foes take extra damage, and a portion of each blow echoes to every other hexed foe.', hint: 'When a hexed foe dies, the curse leaps to the nearest.',
    p: { dmg: 4, speed: 190, pierce: 1, r: 3, life: 1.0, color: '#c27be0', trail: '#6a3a8a', guard: 'pierce' }, fx: { hex: { t: 12 } }, tags: ['witch', 'hex'] });
  add({ id: 'hag_ward', name: 'Hag Ward', school: 'witch', icon: 'salt', carrier: 'zone', cost: { reagent: 'grave_salt' }, cast: 0.4, rec: 0.25, cd: 4, tier: 1,
    desc: 'A circle of grave salt. The dead cannot cross it; the living inside slow and wither.', hint: 'Stand within it and your wounds close.',
    p: { r: 38, dur: 10, tick: 0.6, dmg: 1, range: 70, kind: 'salt', block: true, heal: 2 }, fx: { slow: { t: 1, k: 0.6 } }, tags: ['witch', 'salt'] });
  add({ id: 'familiar', name: 'Call Familiar', school: 'witch', icon: 'crow', carrier: 'familiar', cost: { reagent: 'bone_dust' }, cast: 0.4, rec: 0.2, cd: 6, tier: 2, unlock: 'w_fam',
    desc: 'A spectral crow harries your foes - and draws their attention away from you.', hint: 'Enemies chase the crow before they chase you.',
    p: { dur: 22, dmg: 5 }, tags: ['witch'] });

  /* ================= FUSIONS ================= */
  /* curated recipes: pair (unordered) -> name + what changes. Any other pair gets a procedurally named fusion. */
  AH.Fusions = [
    { a: 'soul_lance', b: 'blood_lash', name: 'Vampiric Lance', note: 'A piercing lance that bleeds and heals you.' },
    { a: 'spore_cloud', b: 'starfall', name: 'Cometfall Bloom', note: 'The star lands in a poison bloom and always detonates it.' },
    { a: 'thorn_snare', b: 'blood_lash', name: 'Bleeding Briar', note: 'Thorns that draw blood on every tick.' },
    { a: 'soul_lance', b: 'hex', name: 'Hexed Lance', note: 'A piercing lance that curses everything it passes through.' },
    { a: 'gravity_well', b: 'spore_cloud', name: 'Miasma Singularity', note: 'A well that gathers and poisons - then ruptures.' },
    { a: 'storm_call', b: 'hex', name: 'Cursed Tempest', note: 'Lightning that jumps between hexed foes.' },
    { a: 'bone_ward', b: 'crimson_pact', name: 'Reliquary Ward', note: 'Bone shards that drink for you.' },
  ];
  AH.makeFusion = function (idA, idB) {
    const A = Sp[idA], B = Sp[idB]; if (!A || !B || idA === idB || A.forbidden || B.forbidden) return null;
    const cur = AH.Fusions.find((f) => (f.a === idA && f.b === idB) || (f.a === idB && f.b === idA));
    const pre = { necro: 'Gravebound', druid: 'Verdant', blood: 'Bloodied', astral: 'Starlit', witch: 'Hexed' };
    const name = cur ? cur.name : pre[B.school] + ' ' + A.name;
    const cost = {}; [A.cost, B.cost].forEach((c) => Object.keys(c).forEach((k) => { if (k === 'hpTo') return; cost[k] = (cost[k] || 0) + c[k]; }));
    Object.keys(cost).forEach((k) => { cost[k] = Math.max(1, Math.round(cost[k] * 0.8)); });
    const fx = Object.assign({}, B.fx, A.fx);
    const o = Object.assign({}, A, { id: 'fuse:' + idA + '+' + idB, name, fused: [idA, idB], fx, cost, tags: Array.from(new Set(A.tags.concat(B.tags))), cd: Math.max(A.cd, B.cd) * 1.1, cast: Math.max(A.cast, B.cast), tier: 3,
      desc: cur ? cur.note : A.name + ' carrying the effects of ' + B.name + '.', hint: 'Fused spells cost both resources (slightly reduced).', p: Object.assign({}, A.p) });
    if (idA === 'spore_cloud' && idB === 'starfall' || idA === 'starfall' && idB === 'spore_cloud') { o.carrier = 'strike'; o.p = Object.assign({}, Sp.starfall.p, { bloom: true }); o.fx = Object.assign({}, Sp.spore_cloud.fx); }
    if (idA === 'gravity_well' && idB === 'spore_cloud' || idA === 'spore_cloud' && idB === 'gravity_well') { o.carrier = 'well'; o.p = Object.assign({}, Sp.gravity_well.p, { spores: true }); }
    o.school = A.school; o.scheme = A.school; return o;
  };
  /* resolve any spell id, including fused ones ('fuse:a+b') */
  AH.getSpell = function (id) { if (Sp[id]) return Sp[id]; if (id && id.indexOf('fuse:') === 0) { const p = id.slice(5).split('+'); const o = AH.makeFusion(p[0], p[1]); if (o) { Sp[id] = o; return o; } } return null; };
})();

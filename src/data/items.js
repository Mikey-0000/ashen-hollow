/* Ashen Hollow - items, rarities and equipment modifiers. Pure data: no game logic lives here. */
(function () {
  'use strict';
  const AH = window.AH;
  AH.Rarity = [
    { name: 'Common', col: '#a8a090' }, { name: 'Fine', col: '#7fae7a' }, { name: 'Arcane', col: '#6a90d8' }, { name: 'Relic', col: '#b070e0' }, { name: 'Forbidden', col: '#d04050' },
  ];
  const I = (AH.Items = {});
  const add = (o) => (I[o.id] = Object.assign({ rarity: 0, stack: false, scheme: 'neutral' }, o));

  /* ---- weapons: dmg, spd (swing rate), reach px, arc radians, kb force, vsUndead multiplier ---- */
  add({ id: 'sickle_rust', name: 'Rusted Reaping-Sickle', type: 'weapon', icon: 'sickle', scheme: 'steel', desc: 'A pilgrim\'s tool, older than the road it was carried on. Balanced and honest.', w: { dmg: 10, spd: 1.0, reach: 28, arc: 2.1, kb: 1.0, vsUndead: 1 } });
  add({ id: 'falchion_bone', name: 'Bone-Hilt Falchion', type: 'weapon', rarity: 1, icon: 'blade', scheme: 'steel', desc: 'Heavy, curved, and hilted in something that was once a rib. Slow but staggering.', w: { dmg: 15, spd: 0.82, reach: 32, arc: 1.9, kb: 1.5, vsUndead: 1 } });
  add({ id: 'staff_yew', name: 'Yew Warden\'s Staff', type: 'weapon', rarity: 2, icon: 'staff', scheme: 'druid', desc: 'Grown, not carved. Long reach, light blows - and the wood hums to the spells you speak.', w: { dmg: 8, spd: 1.0, reach: 40, arc: 1.3, kb: 0.9, vsUndead: 1 }, mods: { dmgSpell: 0.12, verdRegen: 0.2 } });
  add({ id: 'misericord', name: 'Silver Misericord', type: 'weapon', rarity: 2, icon: 'blade', scheme: 'astral', desc: 'A mercy-blade of the Pale Choir, for ending what would not stay ended. Quick, and cruel to the risen.', w: { dmg: 9, spd: 1.4, reach: 22, arc: 1.5, kb: 0.7, vsUndead: 1.4 } });
  /* ---- cloaks ---- */
  add({ id: 'mantle_pilgrim', name: 'Pilgrim\'s Mantle', type: 'cloak', icon: 'cloak', scheme: 'astral', desc: 'Salt-stained wool. It keeps the rain off and asks nothing.', mods: {} });
  add({ id: 'cloak_wolf', name: 'Wolf-Hide Cloak', type: 'cloak', rarity: 1, icon: 'cloak', scheme: 'wood', desc: 'Stiff with old blood. Teeth find it harder to bite through.', mods: { armor: 0.1, speed: 0.03 } });
  add({ id: 'shroud_ash', name: 'Shroud of Ash', type: 'cloak', rarity: 2, icon: 'cloak', scheme: 'neutral', desc: 'Grey as a burnt hymnal. Magic pools in its folds and the dark clings a little less.', mods: { aetherCap: 20, corruptGain: -0.12 } });
  /* ---- relics (two slots) ---- */
  add({ id: 'charm_lantern', name: 'Lantern-Glass Charm', type: 'relic', rarity: 1, icon: 'candle', scheme: 'gold', desc: 'A shard of lens that remembers every flame it ever caught.', mods: { lantern: 0.25 } });
  add({ id: 'talisman_raven', name: 'Raven-Feather Talisman', type: 'relic', rarity: 2, icon: 'feather', scheme: 'witch', desc: 'Strung with a coven\'s thread. Reagents last longer in the hand of its bearer.', mods: { reagentSave: 0.25 } });
  add({ id: 'rosary_weeping', name: 'Weeping Rosary', type: 'relic', rarity: 3, icon: 'ring', scheme: 'blood', desc: 'Each bead is a tear that was never dried. The taint of forbidden craft clings to you more slowly.', mods: { corruptGain: -0.3 } });
  add({ id: 'tooth_hollow', name: 'Hollow Hound\'s Tooth', type: 'relic', rarity: 2, icon: 'tooth', scheme: 'necro', desc: 'It still wants to bite. Souls come easier to whoever carries it.', mods: { soulChance: 0.3 } });
  add({ id: 'locket_heart', name: 'Heart-Locket', type: 'relic', rarity: 2, icon: 'heart', scheme: 'blood', desc: 'Something inside keeps time. Blows you land mend you a little.', mods: { leech: 0.07 } });
  add({ id: 'lens_astral', name: 'Astral Lens', type: 'relic', rarity: 3, icon: 'eye', scheme: 'astral', desc: 'Look through it and the veil thins. Aether returns faster, and hidden things glimmer nearby.', mods: { aetherRegen: 0.3, sight: 40 } });
  add({ id: 'antler_charm', name: 'Stag-Antler Charm', type: 'relic', rarity: 3, icon: 'antler', scheme: 'druid', desc: 'A gift, or a trophy. The forest answers to it either way.', mods: { verdRegen: 0.4 } });
  add({ id: 'ring_ninth', name: 'Ninth Hearth Ring', type: 'relic', rarity: 3, icon: 'ring', scheme: 'witch', desc: 'Nine rings were forged. Eight were buried. Hexes bite deeper and last longer.', mods: { hexPower: 0.2 } });
  /* ---- consumables ---- */
  add({ id: 'tincture', name: 'Tincture of Vitality', type: 'consumable', stack: true, rarity: 1, icon: 'bottle', scheme: 'red', desc: 'Bitter and warm. Restores 45 vitality.', use: { heal: 45 } });
  add({ id: 'moonmilk', name: 'Moonmilk', type: 'consumable', stack: true, rarity: 1, icon: 'bottle', scheme: 'astral', desc: 'Pale and cold. Restores 50 aether.', use: { aether: 50 } });
  add({ id: 'verdant_draught', name: 'Verdant Draught', type: 'consumable', stack: true, rarity: 1, icon: 'bottle', scheme: 'druid', desc: 'Tastes of wet soil. Restores 6 verdance.', use: { verd: 6 } });
  add({ id: 'lustral_water', name: 'Lustral Water', type: 'consumable', stack: true, rarity: 2, icon: 'bottle', scheme: 'neutral', desc: 'Church-blessed, long past its date, still effective. Cleanses 20 taint.', use: { corruption: -20 } });
  /* ---- reagents (witchcraft costs, brewing) ---- */
  add({ id: 'raven_feather', name: 'Raven Feather', type: 'reagent', stack: true, icon: 'feather', scheme: 'witch', desc: 'Fuels Hex. Ravens drop them when startled.' });
  add({ id: 'grave_salt', name: 'Grave Salt', type: 'reagent', stack: true, icon: 'pile', scheme: 'neutral', desc: 'Fuels Hag-Ward. Crystallised on old stone.' });
  add({ id: 'bone_dust', name: 'Bone Dust', type: 'reagent', stack: true, icon: 'dust', scheme: 'neutral', desc: 'Fuels the Familiar. Fine, pale, and not quite silent.' });
  add({ id: 'wolfsbane', name: 'Wolfsbane', type: 'reagent', stack: true, icon: 'leaf', scheme: 'witch', desc: 'Purple-flowered and poisonous. Marta wants three.' });
  add({ id: 'soul_ash', name: 'Soul Ash', type: 'reagent', stack: true, rarity: 1, icon: 'dust', scheme: 'necro', desc: 'The residue of a dismissed thrall. Used to bind fused spells.' });
  /* ---- keys & documents ---- */
  add({ id: 'salve_briar', name: 'Briar Salve', type: 'key', rarity: 1, icon: 'bottle', scheme: 'druid', desc: 'Marta\'s mixture. Thorn and bramble part for whoever smells of it.' });
  add({ id: 'crypt_key', name: 'Crypt Key of Saint Veyra', type: 'key', rarity: 2, icon: 'key', scheme: 'gold', desc: 'Cold as the grave it opens. Aldric remembered where it lay.' });
  add({ id: 'chapel_sigil', name: 'Chapel Sigil', type: 'key', rarity: 2, icon: 'rune', scheme: 'astral', desc: 'A disc of black iron, ringing faintly when the bell is near.' });
  add({ id: 'grim_necro', name: 'Grimoire of the Pale Choir', type: 'grimoire', school: 'necro', rarity: 3, icon: 'book', scheme: 'necro', desc: 'A choir-master\'s notes on singing the dead to heel. Teaches Necromancy.' });
  add({ id: 'grim_druid', name: 'The Heartwood Codex', type: 'grimoire', school: 'druid', rarity: 3, icon: 'book', scheme: 'druid', desc: 'Pages of bark and pressed leaf. Teaches Druidism.' });
  add({ id: 'grim_blood', name: 'Reliquary of Saint Veyra\'s Wounds', type: 'grimoire', school: 'blood', rarity: 3, icon: 'book', scheme: 'blood', desc: 'Penitents wrote it in their own blood. Teaches Blood Magic.' });
  add({ id: 'grim_astral', name: 'Orrery of the Hollow Sky', type: 'grimoire', school: 'astral', rarity: 3, icon: 'book', scheme: 'astral', desc: 'Star charts that do not match any sky you know. Teaches Astral Magic.' });
  add({ id: 'grim_witch', name: 'The Ninth Hearth Ledger', type: 'grimoire', school: 'witch', rarity: 3, icon: 'book', scheme: 'witch', desc: 'Recipes, curses, and the names of those who paid for them. Teaches Witchcraft.' });
  add({ id: 'page_choir', name: 'Forbidden Page: The Hollow Choir', type: 'forbidden', rarity: 4, icon: 'scroll', scheme: 'necro', desc: 'It hums when held. Teaches the Rite of the Hollow Choir.', teach: 'rite_choir' });
  add({ id: 'page_eclipse', name: 'Forbidden Page: Crimson Eclipse', type: 'forbidden', rarity: 4, icon: 'scroll', scheme: 'blood', desc: 'The ink is still wet. Teaches the Crimson Eclipse.', teach: 'crimson_eclipse' });

  /* ---- the world's one-off treasures (ids used by chests/pickups in map data) ---- */
  AH.Starts = {
    necro: { name: 'Gravewarden', school: 'necro', spell: 'soul_lance', blurb: 'Keeper of the unquiet dead. Your craft feeds on endings: every kill is fuel.', strength: 'Souls from kills; thralls; pierces guards', weakness: 'No souls, no spells. Undead yield nothing.', hp: 100, items: { tincture: 2 } },
    druid: { name: 'Thornwalker', school: 'druid', spell: 'thorn_snare', blurb: 'The wood remembers. Your craft is strongest where the earth is alive.', strength: 'Control; strong in forests and rain', weakness: 'Starved underground and on cold stone.', hp: 105, items: { tincture: 2, verdant_draught: 1 } },
    blood: { name: 'Sanguine Penitent', school: 'blood', spell: 'blood_lash', blurb: 'You pay in the only coin that is always accepted.', strength: 'Raw power that grows as you bleed', weakness: 'Every cast costs life; useless on boneless foes.', hp: 120, items: { tincture: 3 } },
    astral: { name: 'Star-Reader', school: 'astral', spell: 'astral_step', blurb: 'You read what is written above the world. It reads you back.', strength: 'Mobility and devastating delayed strikes', weakness: 'Slow, interruptible casts; thin vitality.', hp: 90, items: { tincture: 2, moonmilk: 2 } },
    witch: { name: 'Hedge-Witch', school: 'witch', spell: 'hex', blurb: 'Small cruelties, patiently arranged. Everything you do is a promise to the dark.', strength: 'Curses that spread; utility and prep', weakness: 'Reagent-hungry; slow payoff.', hp: 95, items: { tincture: 2, raven_feather: 6, grave_salt: 3, bone_dust: 3 } },
  };
  /* brewing recipes at any cauldron */
  AH.Brews = [
    { id: 'b_tincture', out: 'tincture', n: 2, needs: { wolfsbane: 1, grave_salt: 1 }, name: 'Tincture of Vitality x2' },
    { id: 'b_moonmilk', out: 'moonmilk', n: 1, needs: { bone_dust: 2 }, name: 'Moonmilk' },
    { id: 'b_verdant', out: 'verdant_draught', n: 1, needs: { wolfsbane: 2 }, name: 'Verdant Draught' },
    { id: 'b_lustral', out: 'lustral_water', n: 1, needs: { grave_salt: 3, raven_feather: 1 }, name: 'Lustral Water' },
  ];
})();

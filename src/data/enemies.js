/* Ashen Hollow - enemy definitions. `res` multiplies incoming damage by discipline ('phys' = melee).
   `mat` picks hit sounds and gore: flesh bleeds, bone rattles, spirit rings. */
(function () {
  'use strict';
  const AH = window.AH;
  const E = (AH.EnemyDefs = {});
  const add = (id, o) => (E[id] = Object.assign({ id, r: 5, speed: 40, hp: 20, dmg: 8, xp: 10, souls: 1, mat: 'flesh', sight: 110, hear: 90, res: {}, undead: false, drops: [], h: 18, shadow: 1 }, o));
  add('wretch', { name: 'The Hollowed', hp: 36, speed: 38, r: 5, dmg: 10, xp: 16, mat: 'flesh', sight: 105, hear: 80, h: 22, res: { phys: 1, druid: 1.35, blood: 1.1 }, drops: [{ id: 'bone_dust', p: 0.14 }, { id: 'tincture', p: 0.05 }], corpse: true });
  add('hound', { name: 'Hollow Hound', hp: 24, speed: 88, r: 5, dmg: 8, xp: 14, mat: 'flesh', sight: 150, hear: 140, h: 14, res: { phys: 1, blood: 1.3, druid: 0.85 }, drops: [{ id: 'tooth_hollow', p: 0.04 }, { id: 'bone_dust', p: 0.1 }], corpse: true, undead: false });
  add('wisp', { name: 'Marsh Wisp', hp: 15, speed: 50, r: 4, dmg: 7, xp: 15, mat: 'spirit', sight: 140, hear: 60, h: 20, res: { phys: 0.5, necro: 1.35, druid: 0.6, blood: 0, astral: 1.45, witch: 1.2 }, drops: [{ id: 'moonmilk', p: 0.1 }], undead: true, souls: 1, flies: true });
  add('sentinel', { name: 'Bone Sentinel', hp: 78, speed: 30, r: 7, dmg: 16, xp: 38, mat: 'bone', sight: 120, hear: 70, h: 34, res: { phys: 0.85, necro: 0.5, druid: 1.0, blood: 0.25, astral: 1.5, witch: 0.5 }, drops: [{ id: 'bone_dust', p: 0.5 }, { id: 'grave_salt', p: 0.3 }], undead: true, souls: 0, guard: true, corpse: true });
  add('hexcaller', { name: 'Hexcaller', hp: 30, speed: 44, r: 5, dmg: 12, xp: 30, mat: 'flesh', sight: 150, hear: 100, h: 22, res: { phys: 1.15, witch: 0.7, necro: 1 }, drops: [{ id: 'raven_feather', p: 0.5 }, { id: 'grave_salt', p: 0.25 }], corpse: true, caster: true });
  add('wraith', { name: 'Choir Wraith', hp: 12, speed: 62, r: 4, dmg: 9, xp: 9, mat: 'spirit', sight: 200, hear: 200, h: 20, res: { phys: 0.6, necro: 1.2, blood: 0, astral: 1.3 }, drops: [], undead: true, souls: 0, flies: true });
  add('stag', { name: 'Warden of Thorns', hp: 380, speed: 58, r: 11, dmg: 18, xp: 180, mat: 'flesh', sight: 200, hear: 160, h: 38, res: { phys: 1, druid: 0.4, blood: 0.9, astral: 1.1, witch: 0.8, necro: 1 }, drops: [], boss: true, souls: 4 });
  add('choirmaster', { name: 'The Weeping Choirmaster', hp: 720, speed: 40, r: 14, dmg: 20, xp: 400, mat: 'bone', sight: 400, hear: 400, h: 60, res: { phys: 1, necro: 0.55, druid: 1, blood: 0.5, astral: 1.1, witch: 0.7 }, drops: [], boss: true, souls: 8, undead: true });
  add('thrall', { name: 'Thrall', hp: 40, speed: 52, r: 5, dmg: 9, xp: 0, mat: 'bone', ally: true, h: 22 });
})();

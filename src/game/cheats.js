/* Ashen Hollow - "Unlimited magic" (Settings, on by default): every school and spell is known, souls / verdance / aether stay full,
   and spells cost nothing (corpses are still needed for Raise Thrall). Turn it off in Settings for the normal rules. */
(function () {
  'use strict';
  const AH = window.AH, P = AH.Player && AH.Player.prototype;
  if (!P) return;
  const on = (pl) => pl.G.settings && pl.G.settings.unlimitedMagic;
  const canPay0 = P.canPay, pay0 = P.pay, upd0 = P.update;
  P.canPay = function (sp) {
    if (!on(this)) return canPay0.apply(this, arguments);
    if (sp.carrier === 'raise' && !this.world.corpses.some((q) => AH.U.dist(q.x, q.y, this.x, this.y) < sp.p.range)) return 'corpse';
    return null;
  };
  P.pay = function (sp) { if (!on(this)) return pay0.apply(this, arguments); };
  P.update = function (dt, w) {
    const r = upd0.apply(this, arguments), G = this.G;
    if (on(this) && !this.dead) {
      if (!this._allMagic) {
        this._allMagic = true; AH.SchoolOrder.forEach((s) => G.learnSchool(s, true));
        Object.values(AH.Spells).forEach((s) => { if (!G.spells.includes(s.id)) G.unlockSpell(s.id, true); });
        G.slots = (G.slots || []).concat([null, null, null, null, null, null, null, null]).slice(0, 8); G.spells.forEach((id) => { if (!G.slots.includes(id)) { const f = G.slots.indexOf(null); if (f >= 0) G.slots[f] = id; } });
        G.toast('Unlimited magic: every school and spell is yours.', '#c8a0f0');
      }
      this.souls = this.soulMax(); this.verd = this.verdMax(); this.aether = this.aetherMax();
    }
    return r;
  };
})();

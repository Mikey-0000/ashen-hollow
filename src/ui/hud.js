/* Ashen Hollow - in-game HUD: vitality, stamina, discipline resource, corruption, spell slots, clock, minimap,
   boss bar, interaction prompt and toasts. */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, UI = AH.UI, C = UI.C, W = AH.W, H = AH.H, Font = AH.Font;

  UI.hud = function (g, G, time) {
    const w = G.world, p = G.player; if (!w || !p) return;
    /* --- vitals, top-left --- */
    const x = 8, y = 8; UI.bar(g, x, y, 92, 7, p.hp / p.maxHp, '#b02a38', '#e85868', '#2a0f14');
    if (p.hp < p.maxHp * 0.3) { g.globalAlpha = (Math.sin(time * 8) * 0.5 + 0.5) * 0.4; g.fillStyle = '#ff6070'; g.fillRect(x, y, Math.round(92 * p.hp / p.maxHp), 7); g.globalAlpha = 1; }
    Font.draw(g, Math.ceil(p.hp) + '/' + p.maxHp, x + 94, y, C.dim, { shadow: true });
    UI.bar(g, x, y + 10, 72, 4, p.stam / p.maxStam, '#b8a040', '#e8d070', '#2a2410');
    /* discipline resources */
    let ry = y + 18; const sch = AH.SchoolOrder.filter((s) => p.schools[s]);
    sch.forEach((s) => {
      const S = AH.Schools[s]; let k, txt;
      if (s === 'necro') { k = p.souls / p.soulMax(); txt = p.souls + '/' + p.soulMax(); } else if (s === 'druid') { k = p.verd / p.verdMax(); txt = p.verd + '/' + p.verdMax(); } else if (s === 'astral') { k = p.aether / p.aetherMax(); txt = Math.floor(p.aether) + ''; }
      else if (s === 'witch') { const ids = ['raven_feather', 'grave_salt', 'bone_dust']; let tot = 0; ids.forEach((id, i) => { const n = G.countItem(id); tot += n; g.drawImage(AH.Icons.of(AH.Items[id]), x + i * 22, ry - 2, 8, 8); Font.draw(g, String(n), x + i * 22 + 10, ry - 1, n ? S.col : '#5a5448', { shadow: true }); }); ry += 9; return; } else { return; }
      UI.bar(g, x, ry, 56, 4, k, S.col, '#ffffff22', '#10101a'); Font.draw(g, txt, x + 60, ry - 2, S.col, { shadow: true }); ry += 8;
    });
    if (p.corruption > 0) { UI.bar(g, x, ry, 56, 3, p.corruption / 100, '#8a2aa8', '#c860e8', '#180a20'); Font.draw(g, 'TAINT', x + 60, ry - 3, '#a050c0', { shadow: true }); ry += 7; }
    if (p.buff.pact) { Font.draw(g, 'PACT ' + Math.ceil(p.buff.pact.t), x, ry, '#e05868', { shadow: true }); ry += 9; }
    if (p.status.slow) { Font.draw(g, 'SLOWED', x, ry, '#c27be0'); ry += 9; }
    if (p.status.bleed) { Font.draw(g, 'BLEEDING', x, ry, '#e05868'); ry += 9; }
    /* --- spell slots, bottom-left --- */
    const sy = H - 30;
    const rows2 = G.slots.slice(4, 8).some(Boolean);
    for (let i = 0; i < (rows2 ? 8 : 4); i++) {
      const sx = 8 + (i % 4) * 24, sy = H - 30 - Math.floor(i / 4) * 24, id = G.slots[i], sp = id && AH.getSpell(id), on = i === G.sel;
      UI.hotr('slot', i, sx - 1, sy - 1, 22, 22); g.fillStyle = '#05040a'; g.fillRect(sx - 1, sy - 1, 22, 22); g.fillStyle = on ? C.gold : C.iron; g.fillRect(sx - 1, sy - 1, 22, 1); g.fillRect(sx - 1, sy + 20, 22, 1); g.fillRect(sx - 1, sy - 1, 1, 22); g.fillRect(sx + 20, sy - 1, 1, 22);
      if (sp) {
        const why = p.canPay(sp), cd = Math.max(0, p.cd[sp.id] || 0), cdk = sp.cd ? cd / sp.cd : 0; g.globalAlpha = why ? 0.4 : 1; g.drawImage(AH.Icons.of({ icon: sp.icon, scheme: sp.school }, sp.forbidden ? '#d04050' : null), sx + 2, sy + 2); g.globalAlpha = 1;
        if (cdk > 0) { g.fillStyle = 'rgba(5,4,10,0.7)'; g.fillRect(sx + 2, sy + 2 + Math.round(16 * (1 - cdk)), 16, Math.round(16 * cdk)); }
        if (on) { const pul = Math.sin(time * 6) * 0.5 + 0.5; g.globalAlpha = 0.25 + pul * 0.2; g.fillStyle = AH.Schools[sp.school].col; g.fillRect(sx + 2, sy + 2, 16, 16); g.globalAlpha = 1; }
      }
      Font.draw(g, String(i + 1), sx + 2, sy + 12, on ? C.gold : C.dim, { outline: '#05040a', shadow: false });
    }
    const cur = G.slots[G.sel] && AH.getSpell(G.slots[G.sel]); if (cur) { const c = p.costOf(cur); const cs = G.settings.unlimitedMagic ? 'free' : Object.keys(c).map((k) => (k === 'reagent' ? AH.Items[c[k]].name.split(' ')[0] : c[k] + ' ' + k)).join(' ') ; Font.draw(g, cur.name, 8, sy - 10 - (rows2 ? 24 : 0), AH.Schools[cur.school].col, { outline: '#05040a' }); Font.draw(g, cs, 8 + Font.width(cur.name) + 6, sy - 10 - (rows2 ? 24 : 0), C.dim, { outline: '#05040a' }); }
    /* --- clock & weather, top-right --- */
    const hr = G.hour, hh = Math.floor(hr), mm = Math.floor((hr - hh) * 60), day = AH.Lighting.daylight(hr), cx = W - 22, cy = 20;
    g.fillStyle = '#05040a'; g.fillRect(cx - 14, cy - 14, 28, 28); g.fillStyle = C.iron; g.fillRect(cx - 13, cy - 13, 26, 26); g.fillStyle = '#0e0c16'; g.fillRect(cx - 12, cy - 12, 24, 24);
    const ang = (hr / 24) * 6.283 - 1.5708, sx = cx + Math.cos(ang + Math.PI) * 9, sy2 = cy - Math.sin(ang + Math.PI) * 0 + Math.sin(ang + Math.PI) * 9;
    g.fillStyle = day > 0.5 ? '#2a3a58' : '#0a0e1c'; g.fillRect(cx - 11, cy - 11, 22, 22);
    g.fillStyle = day > 0.3 ? '#f0d078' : '#c8d0e8'; const sunX = Math.round(cx + Math.cos(((hr - 6) / 12) * Math.PI - Math.PI) * 8), sunY = Math.round(cy + 4 - Math.sin(((hr - 6) / 12) * Math.PI) * 9); if (hr >= 5 && hr <= 19) { g.fillRect(sunX - 1, sunY - 1, 3, 3); } else { const mx = Math.round(cx + Math.cos((((hr + 6) % 24) / 12) * Math.PI - Math.PI) * 8), my = Math.round(cy + 4 - Math.sin((((hr + 6) % 24) / 12) * Math.PI) * 9); g.fillRect(mx - 1, my - 1, 3, 3); g.fillStyle = '#0e0c16'; g.fillRect(mx, my - 1, 2, 2); }
    g.fillStyle = '#05040a'; g.fillRect(cx - 12, cy + 5, 24, 7); Font.draw(g, U.pad2(hh) + ':' + U.pad2(mm), cx, cy + 5, C.gold, { align: 'center', shadow: false });
    Font.draw(g, 'Day ' + G.day + (G.flags.bloodmoon_now ? ' - Blood Moon' : '') + ' - ' + AH.Weather.label(), W - 40, cy + 18, G.flags.bloodmoon_now ? '#d04050' : C.dim, { align: 'right', shadow: true });
    /* --- minimap --- */
    UI.minimap(g, G, W - 78, H - 56, 70, 48);
    /* --- boss bar --- */
    if (w.boss && !w.boss.dead && !w.boss.dormant) { const b = w.boss, bw = 240, bx = (W - bw) >> 1, by = H - 24; Font.draw(g, b.name, W / 2, by - 12, '#e8c670', { align: 'center', outline: '#05040a' }); UI.bar(g, bx, by, bw, 6, b.hp / b.maxHp, b.invuln ? '#8a8a9a' : '#a02030', b.invuln ? '#c8c8d8' : '#e04858', '#1a0a10'); g.fillStyle = C.gold; [0.66, 0.33].forEach((k) => { if (b.type === 'choirmaster') g.fillRect(bx + Math.round(bw * k), by - 2, 1, 10); }); }
    /* --- interaction prompt --- */
    if (p.interactTarget && !G.screen) { const t = p.interactTarget, tx = t.kind === 'obj' ? t.ref.x : t.ref.x, ty = (t.kind === 'obj' ? t.ref.y : t.ref.y) - 34 - w.cam.y; const sx2 = tx - w.cam.x, s = '[E] ' + t.prompt, wd = Font.width(s) + 8, bob = Math.sin(time * 4) * 1.5; g.fillStyle = 'rgba(8,6,12,0.85)'; g.fillRect(Math.round(sx2 - wd / 2), Math.round(ty + bob), wd, 12); g.fillStyle = C.dgold; g.fillRect(Math.round(sx2 - wd / 2), Math.round(ty + bob), wd, 1); g.fillRect(Math.round(sx2 - wd / 2), Math.round(ty + bob) + 11, wd, 1); Font.draw(g, s, sx2, ty + bob + 2, C.ink, { align: 'center', shadow: false }); }
    /* --- toasts --- */
    let ty2 = 44; for (let i = G.toasts.length - 1; i >= 0; i--) { const t = G.toasts[i], a = U.clamp(Math.min(t.t / 0.2, (4.2 - t.t) / 0.6), 0, 1); g.globalAlpha = a; const wd = Font.width(t.text); g.fillStyle = 'rgba(8,6,12,0.7)'; g.fillRect(W / 2 - wd / 2 - 5, ty2 - 2, wd + 10, 11); Font.draw(g, t.text, W / 2, ty2, t.col, { align: 'center', outline: '#05040a', shadow: false }); ty2 += 13; g.globalAlpha = 1; }
    /* --- first-run hint --- */
    if (G.settings.showHints && G.playtime < 40 && !G.screen) { const a = U.clamp((40 - G.playtime) / 3, 0, 1); g.globalAlpha = a; Font.draw(g, 'J attack   Space dodge   L cast   E use   V sight   I book', 110, H - 10, C.dim, { outline: '#05040a' }); g.globalAlpha = 1; }
  };
  UI.minimap = function (g, G, x, y, w, h) {
    const wd = G.world, p = G.player, T = AH.T; if (!wd.state || !wd.state.explored) return;
    g.fillStyle = '#05040a'; g.fillRect(x - 2, y - 2, w + 4, h + 4); g.fillStyle = C.iron; g.fillRect(x - 1, y - 1, w + 2, h + 2); g.fillStyle = '#0a0810'; g.fillRect(x, y, w, h);
    const px = Math.floor(p.x / T), py = Math.floor(p.y / T), sc = 2, cols = w / sc, rows = h / sc, ex = wd.state.explored;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const tx = px - (cols >> 1) + i, ty = py - (rows >> 1) + j; if (tx < 0 || ty < 0 || tx >= wd.w || ty >= wd.h) continue; if (!ex[ty * wd.w + tx]) continue; const t = wd.tiles[ty * wd.w + tx], inf = AH.Tiles.INFO[t]; g.fillStyle = inf ? (inf.solid ? '#3a3640' : inf.water ? '#2a4060' : '#6a5a40') : '#222'; g.fillRect(x + i * sc, y + j * sc, sc, sc); }
    wd.objs.forEach((o) => { if (o.d.waystone && !o.hidden) { const i = Math.floor(o.x / T) - px + (cols >> 1), j = Math.floor(o.y / T) - py + (rows >> 1); if (i >= 0 && j >= 0 && i < cols && j < rows && ex[Math.floor(o.y / T) * wd.w + Math.floor(o.x / T)]) { g.fillStyle = '#9ab8ff'; g.fillRect(x + i * sc, y + j * sc, 2, 2); } } });
    g.fillStyle = (Math.floor(wd.time * 3) % 2) ? '#ffffff' : '#e8c670'; g.fillRect(x + (cols >> 1) * sc, y + (rows >> 1) * sc, 2, 2);
  };
})();

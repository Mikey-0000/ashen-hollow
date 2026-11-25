/* Ashen Hollow - the page around the game: embers, the welcome gate, the How-to-Play primer, fullscreen.
   Kept apart from the engine; the only coupling is AH.htmlPause (halts the sim while a panel is open) and AH.resize. */
(function () {
  'use strict';
  const AH = window.AH, $ = (id) => document.getElementById(id);
  const gate = $('gate'), guide = $('guide');
  let seen = false; try { seen = localStorage.getItem('ah_seen') === '1'; } catch (e) { /* storage may be blocked */ }

  /* ---- ornate frame corners ---- */
  const CORNER = '<svg viewBox="0 0 34 34"><path d="M2 32V8Q2 2 8 2h24" fill="none" stroke="#c9a45c" stroke-width="2"/><path d="M7 32V12Q7 7 12 7h20" fill="none" stroke="#8a6a34" stroke-width="1"/><circle cx="2" cy="2" r="2.6" fill="#ff9a3c"/><path d="M12 12l5 0-5 5z" fill="#8a6a34"/></svg>';
  document.querySelectorAll('.corner').forEach((c) => (c.innerHTML = CORNER));

  /* ---- drifting embers behind the frame ---- */
  const ec = $('embers'), eg = ec.getContext('2d'); let ew = 0, eh = 0; const em = [];
  function sizeEmbers() { ew = ec.width = window.innerWidth; eh = ec.height = window.innerHeight; }
  sizeEmbers();
  for (let i = 0; i < 70; i++) em.push({ x: Math.random() * 2000, y: Math.random() * 1200, r: 0.6 + Math.random() * 1.8, v: 8 + Math.random() * 22, ph: Math.random() * 6.28, a: 0.2 + Math.random() * 0.6 });
  let lastE = performance.now();
  function embers(now) {
    const dt = Math.min(0.05, (now - lastE) / 1000); lastE = now; eg.clearRect(0, 0, ew, eh);
    em.forEach((p) => {
      p.y -= p.v * dt; p.x += Math.sin(now / 1400 + p.ph) * 10 * dt; if (p.y < -10) { p.y = eh + 10; p.x = Math.random() * ew; }
      const fl = 0.6 + 0.4 * Math.sin(now / 300 + p.ph * 3); eg.globalAlpha = p.a * fl; eg.fillStyle = p.r > 1.6 ? '#ffd080' : '#ff8a2c';
      eg.fillRect(Math.round(p.x % ew), Math.round(p.y), Math.ceil(p.r), Math.ceil(p.r));
    });
    eg.globalAlpha = 1; requestAnimationFrame(embers);
  }
  requestAnimationFrame(embers);

  /* ---- panels ---- */
  function syncPause() { AH.htmlPause = gate.classList.contains('open') || guide.classList.contains('open'); }
  function clearGameKeys() { if (AH.Input && AH.Input.endFrame) AH.Input.endFrame(); }
  function openGuide() { guide.classList.add('open'); syncPause(); }
  function closeGuide() { guide.classList.remove('open'); syncPause(); clearGameKeys(); }
  function enter() { gate.classList.remove('open'); try { localStorage.setItem('ah_seen', '1'); } catch (e) { /* ignore */ } syncPause(); clearGameKeys(); }
  $('btnGuide').onclick = () => (guide.classList.contains('open') ? closeGuide() : openGuide());
  $('guideX').onclick = closeGuide;
  guide.addEventListener('mousedown', (e) => { if (e.target === guide) closeGuide(); });
  $('btnEnter').onclick = enter;
  $('gateGuide').onclick = () => openGuide();
  $('btnFull').onclick = toggleFull;
  function toggleFull() { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) { /* unsupported */ } }
  document.querySelectorAll('.tabs button').forEach((b) => (b.onclick = () => selectTab(b.dataset.t)));
  const tabIds = ['t1', 't2', 't3', 't4', 't5'];
  function selectTab(id) {
    document.querySelectorAll('.tabs button').forEach((x) => x.setAttribute('aria-selected', x.dataset.t === id ? 'true' : 'false'));
    document.querySelectorAll('.page').forEach((p) => p.classList.toggle('on', p.id === id));
  }
  window.addEventListener('keydown', (e) => {
    if (e.code === 'F1') { e.preventDefault(); guide.classList.contains('open') ? closeGuide() : openGuide(); return; }
    if (guide.classList.contains('open')) {
      if (e.code === 'Escape') { e.preventDefault(); closeGuide(); }
      const cur = tabIds.findIndex((id) => $(id).classList.contains('on'));
      if (e.code === 'ArrowRight') selectTab(tabIds[(cur + 1) % 5]);
      if (e.code === 'ArrowLeft') selectTab(tabIds[(cur + 4) % 5]);
      return;
    }
    if (gate.classList.contains('open') && (e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); enter(); }
  });
  window.addEventListener('resize', () => { sizeEmbers(); if (AH.resize) AH.resize(); });
  if (window.ResizeObserver) new ResizeObserver(() => AH.resize && AH.resize()).observe($('stage'));
  if (seen) gate.classList.remove('open');
  syncPause(); if (AH.resize) AH.resize();
})();

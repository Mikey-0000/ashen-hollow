/* Ashen Hollow - on-screen touch controls: a WASD pad you can touch, click or drag across, plus action buttons.
   It only synthesises ordinary key events, so the game (and every menu) behaves exactly as if the keyboard were used. */
(function () {
  'use strict';
  const AH = window.AH, $ = (id) => document.getElementById(id);
  const stage = $('stage'); if (!stage) return;
  let on = true; try { const v = localStorage.getItem('ah_touch'); if (v !== null) on = v === '1'; } catch (e) { /* storage may be blocked */ }

  const css = document.createElement('style');
  css.textContent = `
  #touch { position: absolute; inset: 0; pointer-events: none; container-type: size; z-index: 4; user-select: none; -webkit-user-select: none; touch-action: none; }
  #touch.off { display: none; }
  #touch .pad { position: absolute; left: 2cqw; bottom: 22cqh; width: 34cqh; height: 34cqh; pointer-events: auto; touch-action: none; border-radius: 50%;
    background: radial-gradient(circle, rgba(20,14,10,.55) 0 55%, rgba(30,22,14,.35) 56% 100%); border: 1.5px solid rgba(201,164,92,.55); box-shadow: 0 0 14px rgba(0,0,0,.6), inset 0 0 12px rgba(201,164,92,.15); }
  #touch .pad .knob { position: absolute; left: 50%; top: 50%; width: 30%; height: 30%; margin: -15% 0 0 -15%; border-radius: 50%; background: rgba(201,164,92,.28); border: 1px solid rgba(232,198,112,.7); transition: transform .05s; }
  #touch .key { position: absolute; width: 28%; height: 28%; display: flex; align-items: center; justify-content: center; font: 700 clamp(10px, 4.2cqh, 22px) Georgia, serif; color: #e8c670; border-radius: 7px;
    background: rgba(12,8,6,.7); border: 1px solid rgba(201,164,92,.6); text-shadow: 0 0 6px #000; transition: background .06s, box-shadow .06s; }
  #touch .key.act { background: rgba(232,198,112,.55); color: #1a1008; box-shadow: 0 0 12px rgba(232,198,112,.8); }
  #touch .kW { left: 36%; top: 3%; } #touch .kS { left: 36%; bottom: 3%; } #touch .kA { left: 3%; top: 36%; } #touch .kD { right: 3%; top: 36%; }
  #touch .btn { position: absolute; pointer-events: auto; touch-action: none; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
    color: #e8c670; font: 700 clamp(9px, 3.4cqh, 17px)/1.05 Georgia, serif; background: radial-gradient(circle at 35% 30%, rgba(60,44,26,.8), rgba(14,10,8,.8)); border: 1.5px solid rgba(201,164,92,.65);
    box-shadow: 0 0 12px rgba(0,0,0,.6); text-shadow: 0 0 6px #000; cursor: pointer; }
  #touch .btn small { display: block; font-size: .62em; opacity: .75; font-weight: 400; letter-spacing: .04em; }
  #touch .btn.act { background: radial-gradient(circle at 35% 30%, rgba(255,226,140,.85), rgba(190,130,40,.85)); color: #1a1008; box-shadow: 0 0 16px rgba(232,198,112,.9); }
  #touch .atk { right: 3cqw; bottom: 36cqh; width: 20cqh; height: 20cqh; }
  #touch .ddg { right: calc(3cqw + 22cqh); bottom: 30cqh; width: 15cqh; height: 15cqh; }
  #touch .cst { right: calc(3cqw + 4cqh); bottom: 59cqh; width: 15cqh; height: 15cqh; }
  #touch .use { right: calc(3cqw + 22cqh); bottom: 48cqh; width: 14cqh; height: 14cqh; }
  #touch .top { top: 27cqh; width: 10cqh; height: 10cqh; font-size: clamp(8px, 2.8cqh, 14px); }
  #touch .sgt { left: 2cqw; } #touch .bok { left: calc(2cqw + 11.5cqh); } #touch .pse { left: calc(2cqw + 23cqh); }
  #touch .slot { position: absolute; bottom: 1.5cqh; width: 9cqh; height: 9cqh; left: calc(50% + (var(--i) - 2.5) * 10.4cqh); pointer-events: auto; touch-action: none; border-radius: 6px; display: none; }
  #btnTouch[aria-pressed="true"] { box-shadow: 0 0 12px rgba(232,198,112,.5); }`;
  document.head.appendChild(css);

  const root = document.createElement('div'); root.id = 'touch'; if (!on) root.classList.add('off');
  root.innerHTML = '<div class="pad" id="tpad"><div class="knob" id="tknob"></div><div class="key kW" data-k="KeyW">W</div><div class="key kA" data-k="KeyA">A</div><div class="key kS" data-k="KeyS">S</div><div class="key kD" data-k="KeyD">D</div></div>' +
    '<div class="btn atk" data-k="KeyJ">Strike<small>J</small></div><div class="btn ddg" data-k="Space">Dodge<small>Space</small></div><div class="btn cst" data-k="KeyL">Cast<small>L</small></div><div class="btn use" data-k="KeyE">Use<small>E</small></div>' +
    '<div class="btn top sgt" data-k="KeyV">Sight<small>V</small></div><div class="btn top bok" data-k="KeyI">Book<small>I</small></div><div class="btn top pse" data-k="Escape">Menu<small>Esc</small></div>';
  stage.appendChild(root);

  /* synthetic keys, de-duplicated so held-counts in the input module stay correct */
  const down = {};
  function press(code) { if (down[code]) return; down[code] = true; window.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true })); mark(code, true); }
  function release(code) { if (!down[code]) return; down[code] = false; window.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true })); mark(code, false); }
  function mark(code, v) { root.querySelectorAll('[data-k="' + code + '"]').forEach((el) => el.classList.toggle('act', v)); }
  const releaseAll = () => Object.keys(down).forEach(release);
  window.addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });

  /* buttons: pointer down = key down, up/cancel = key up. Each pointer tracks its own key, so several can be held at once. */
  root.querySelectorAll('.btn').forEach((b) => {
    const code = b.dataset.k;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); try { b.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } press(code); });
    const up = (e) => { e.stopPropagation(); release(code); };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
    b.addEventListener('mousedown', (e) => e.stopPropagation()); b.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  /* the pad works like a stick: wherever the finger sits relative to the centre decides which of W/A/S/D are held (diagonals allowed) */
  const pad = $('tpad'), knob = $('tknob'); let padId = null;
  function steer(e) {
    const r = pad.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = r.width / 2;
    let dx = (e.clientX - cx) / R, dy = (e.clientY - cy) / R; const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; }
    const t = 0.3;
    (dy < -t ? press : release)('KeyW'); (dy > t ? press : release)('KeyS'); (dx < -t ? press : release)('KeyA'); (dx > t ? press : release)('KeyD');
    knob.style.transform = 'translate(' + dx * r.width * 0.28 + 'px,' + dy * r.height * 0.28 + 'px)';
  }
  function stop() { padId = null; ['KeyW', 'KeyA', 'KeyS', 'KeyD'].forEach(release); knob.style.transform = ''; }
  pad.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); padId = e.pointerId; try { pad.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } steer(e); });
  pad.addEventListener('pointermove', (e) => { if (e.pointerId === padId) steer(e); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((n) => pad.addEventListener(n, (e) => { if (e.pointerId === padId) stop(); }));
  pad.addEventListener('mousedown', (e) => e.stopPropagation()); pad.addEventListener('contextmenu', (e) => e.preventDefault());

  /* header toggle */
  const hdrBtn = $('btnGuide');
  if (hdrBtn && hdrBtn.parentNode) {
    const t = document.createElement('button'); t.className = 'rune'; t.id = 'btnTouch'; t.title = 'Show or hide the on-screen controls'; t.setAttribute('aria-pressed', on ? 'true' : 'false'); t.innerHTML = 'Touch Pad <kbd>T</kbd>'.replace(' <kbd>T</kbd>', '');
    hdrBtn.parentNode.insertBefore(t, hdrBtn);
    const flip = () => { on = !on; root.classList.toggle('off', !on); t.setAttribute('aria-pressed', on ? 'true' : 'false'); if (!on) { releaseAll(); stop(); } try { localStorage.setItem('ah_touch', on ? '1' : '0'); } catch (e) { /* ok */ } };
    t.addEventListener('click', () => { flip(); t.blur(); const s = $('screen'); s && s.focus && s.focus(); });
  }
  AH.Touch = { press, release, releaseAll, root };
})();

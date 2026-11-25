/* Ashen Hollow - keyboard / mouse / gamepad input with per-frame edge detection. */
(function () {
  'use strict';
  const AH = window.AH;
  const map = {
    up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'], left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'],
    attack: ['KeyJ', 'KeyZ'], dodge: ['Space', 'KeyK', 'KeyX'], cast: ['KeyL', 'KeyC'], interact: ['KeyE', 'KeyF'],
    prev: ['KeyQ'], next: ['KeyR'], sight: ['KeyV'],
    slot1: ['Digit1'], slot2: ['Digit2'], slot3: ['Digit3'], slot4: ['Digit4'], slot5: ['Digit5'], slot6: ['Digit6'], slot7: ['Digit7'], slot8: ['Digit8'],
    inventory: ['KeyI'], spells: ['KeyB'], skills: ['KeyT'], map: ['KeyM'], codex: ['KeyN'], journal: ['KeyG'], photo: ['F8'], unstick: ['KeyU'], pause: ['Escape', 'KeyP'],
    confirm: ['Enter', 'Space', 'KeyE', 'KeyJ', 'KeyZ'], back: ['Escape', 'Backspace', 'KeyX', 'KeyK'],
    tabL: ['KeyQ', 'PageUp'], tabR: ['KeyR', 'PageDown', 'Tab'],
  };
  const code2act = {};
  Object.keys(map).forEach((a) => map[a].forEach((c) => (code2act[c] = (code2act[c] || []).concat(a))));
  const held = {}, pressed = {}, released = {}, padHeld = {};
  const Input = (AH.Input = { mouse: { x: 240, y: 135, down: false, rdown: false, lastMove: -1e9, pressed: false, rpressed: false }, anyKey: false, pad: { x: 0, y: 0 } });
  let scaleFn = null;
  Input.setScaler = (fn) => (scaleFn = fn);

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].indexOf(e.code) >= 0) e.preventDefault();
    Input.anyKey = true;
    if (e.repeat) { Input.repeatCode = e.code; (code2act[e.code] || []).forEach((a) => (Input.rep[a] = true)); return; }
    (code2act[e.code] || []).forEach((a) => { if (!held[a]) pressed[a] = true; held[a] = (held[a] || 0) + 1; });
    held['code:' + e.code] = true;
  });
  window.addEventListener('keyup', (e) => {
    (code2act[e.code] || []).forEach((a) => { held[a] = Math.max(0, (held[a] || 1) - 1); if (!held[a]) released[a] = true; });
    held['code:' + e.code] = false;
  });
  window.addEventListener('blur', () => { Object.keys(held).forEach((k) => (held[k] = 0)); });
  Input.rep = {};
  window.addEventListener('mousemove', (e) => {
    if (scaleFn) { const p = scaleFn(e.clientX, e.clientY); Input.mouse.x = p.x; Input.mouse.y = p.y; }
    Input.mouse.lastMove = performance.now();
  });
  window.addEventListener('mousedown', (e) => {
    Input.anyKey = true;
    if (e.button === 0) { Input.mouse.down = true; Input.mouse.pressed = true; }
    if (e.button === 2) { Input.mouse.rdown = true; Input.mouse.rpressed = true; }
  });
  window.addEventListener('mouseup', (e) => { if (e.button === 0) Input.mouse.down = false; if (e.button === 2) Input.mouse.rdown = false; });
  window.addEventListener('contextmenu', (e) => e.preventDefault());

  /* gamepad: left stick + face buttons (standard mapping) */
  const padMap = { 0: 'dodge', 1: 'cast', 2: 'attack', 3: 'interact', 4: 'prev', 5: 'next', 8: 'inventory', 9: 'pause', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };
  Input.pollPad = function () {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const p = pads && pads[0];
    Input.pad.x = 0; Input.pad.y = 0;
    if (!p) return;
    const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
    if (Math.hypot(ax, ay) > 0.25) { Input.pad.x = ax; Input.pad.y = ay; }
    Object.keys(padMap).forEach((b) => {
      const a = padMap[b], on = p.buttons[b] && p.buttons[b].pressed;
      if (on && !padHeld[a]) { pressed[a] = true; if (a === 'dodge' || a === 'interact' || a === 'attack') pressed.confirm = true; if (a === 'cast' || a === 'pause') pressed.back = true; Input.anyKey = true; }
      if (!on && padHeld[a]) released[a] = true;
      padHeld[a] = on;
    });
  };
  const dz = (v) => (Math.abs(v) < 0.25 ? 0 : v);
  Input.held = (a) => !!held[a] || !!padHeld[a];
  Input.pressed = (a) => !!pressed[a] || !!Input.rep[a] && false;
  Input.repeat = (a) => !!pressed[a] || !!Input.rep[a];
  Input.released = (a) => !!released[a];
  Input.axis = function () {
    let x = (Input.held('right') ? 1 : 0) - (Input.held('left') ? 1 : 0);
    let y = (Input.held('down') ? 1 : 0) - (Input.held('up') ? 1 : 0);
    if (!x && !y) { x = dz(Input.pad.x); y = dz(Input.pad.y); }
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
    return { x, y };
  };
  Input.mouseActive = () => performance.now() - Input.mouse.lastMove < 2500;
  Input.endFrame = function () {
    Object.keys(pressed).forEach((k) => (pressed[k] = false));
    Object.keys(released).forEach((k) => (released[k] = false));
    Object.keys(Input.rep).forEach((k) => (Input.rep[k] = false));
    Input.mouse.pressed = false; Input.mouse.rpressed = false; Input.anyKey = false;
  };
  Input.clear = function () { Input.endFrame(); };
  Input.simulate = function (action, down) { if (down) { if (!held[action]) pressed[action] = true; held[action] = 1; } else { held[action] = 0; released[action] = true; } };
})();

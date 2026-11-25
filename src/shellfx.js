/* Shell flourishes: ambilight from the game picture, and key caps that light up as you press them. Cosmetic only. */
(function () {
  'use strict';
  var screen = document.getElementById('screen'), frame = document.querySelector('.frame');
  if (screen && frame) {
    var c = document.createElement('canvas'); c.width = 8; c.height = 5; var g = c.getContext('2d', { willReadFrequently: true });
    var cur = [255, 154, 60], goal = cur.slice();
    setInterval(function () {
      try {
        g.drawImage(screen, 0, 0, 8, 5); var d = g.getImageData(0, 0, 8, 5).data, r = 0, gr = 0, b = 0, n = 0, wsum = 0;
        for (var i = 0; i < d.length; i += 4) { var lum = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11, w = 0.4 + Math.abs(d[i] - d[i + 2]) / 255 * 2 + lum / 255; r += d[i] * w; gr += d[i + 1] * w; b += d[i + 2] * w; wsum += w; n++; }
        if (!wsum) return; r /= wsum; gr /= wsum; b /= wsum;
        var m = Math.max(r, gr, b, 1), k = 255 / m * 0.9;            /* lift to a glow colour, keep the hue */
        goal = [Math.min(255, r * k), Math.min(255, gr * k), Math.min(255, b * k)];
      } catch (e) { }
    }, 250);
    (function ease() {
      for (var i = 0; i < 3; i++) cur[i] += (goal[i] - cur[i]) * 0.06;
      var col = 'rgb(' + (cur[0] | 0) + ',' + (cur[1] | 0) + ',' + (cur[2] | 0) + ')';
      frame.style.setProperty('--amb', col); document.body.style.setProperty('--amb', col);
      setTimeout(function () { requestAnimationFrame(ease); }, 80);
    })();
  }
  var map = { ' ': 'space', Escape: 'esc', F1: 'f1', F11: 'f11' };
  function caps(e) { var k = map[e.key] || e.key.toLowerCase(); return Array.prototype.filter.call(document.querySelectorAll('kbd'), function (x) { return x.textContent.trim().toLowerCase() === k; }); }
  addEventListener('keydown', function (e) { caps(e).forEach(function (x) { x.classList.add('down'); }); });
  addEventListener('keyup', function (e) { caps(e).forEach(function (x) { x.classList.remove('down'); }); });
  addEventListener('blur', function () { document.querySelectorAll('kbd.down').forEach(function (x) { x.classList.remove('down'); }); });
})();

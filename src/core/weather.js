/* Ashen Hollow - weather, wind and the parallax atmosphere layers (fog banks, cloud shadow, canopy). */
(function () {
  'use strict';
  const AH = window.AH, U = AH.U, W = AH.W, H = AH.H;
  const We = (AH.Weather = { type: 'clear', fogK: 0, rainK: 0, stormK: 0, wind: 0.4, timer: 30, flash: 0, thunderIn: -1, base: { fog: 0, canopy: 0, clouds: 1 } });

  /* seamless noise textures drawn with dithered alpha for a pixel-art look */
  function torusNoise(x, y, s, f, n) { const X = x / f, Y = y / f, x0 = Math.floor(X), y0 = Math.floor(Y), fx = U.smooth(X - x0), fy = U.smooth(Y - y0), nn = n / f; const h = (a, b) => U.hash(((a % nn) + nn) % nn, ((b % nn) + nn) % nn, s); return U.lerp(U.lerp(h(x0, y0), h(x0 + 1, y0), fx), U.lerp(h(x0, y0 + 1), h(x0 + 1, y0 + 1), fx), fy); }
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function fogTex(seed, col) {
    const n = 128, c = U.makeCanvas(n, n), g = c.getContext('2d'), id = g.createImageData(n, n), cc = U.hex(col);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const v = torusNoise(x, y, seed, 32, n) * 0.6 + torusNoise(x, y, seed + 1, 16, n) * 0.4, a = U.clamp((v - 0.42) * 2.4, 0, 1), th = BAYER[(y % 4) * 4 + (x % 4)] / 16, i = (y * n + x) * 4;
      const q = a > th ? Math.min(255, Math.round(a * 150) + 40) : 0;
      id.data[i] = cc[0]; id.data[i + 1] = cc[1]; id.data[i + 2] = cc[2]; id.data[i + 3] = q;
    }
    g.putImageData(id, 0, 0); return c;
  }
  function cloudTex(seed) {
    const n = 64, c = U.makeCanvas(n, n), g = c.getContext('2d'), id = g.createImageData(n, n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const v = torusNoise(x, y, seed, 32, n) * 0.7 + torusNoise(x, y, seed + 3, 16, n) * 0.3, a = U.clamp((v - 0.5) * 3, 0, 1), i = (y * n + x) * 4; id.data[i] = 4; id.data[i + 1] = 6; id.data[i + 2] = 14; id.data[i + 3] = Math.round(a * 255); }
    g.putImageData(id, 0, 0); return c;
  }
  function canopyTex(seed) {
    const n = 128, c = U.makeCanvas(n, n), g = c.getContext('2d'), r = U.mulberry32(seed);
    g.fillStyle = '#04080a';
    for (let i = 0; i < 46; i++) {
      const cx = r() * n, cy = r() * n, rad = 5 + r() * 11;
      for (let k = 0; k < 18; k++) { const a = r() * 6.28, d = r() * rad; for (const ox of [-n, 0, n]) for (const oy of [-n, 0, n]) { g.globalAlpha = 0.78; g.fillRect(Math.round(cx + Math.cos(a) * d + ox), Math.round(cy + Math.sin(a) * d + oy), 3 + (k % 3), 2 + (k % 2)); } }
    }
    g.globalAlpha = 1;
    const id = g.getImageData(0, 0, n, n); for (let i = 3; i < id.data.length; i += 4) id.data[i] = id.data[i] > 60 ? 175 : 0; g.putImageData(id, 0, 0);
    return c;
  }
  const fog1 = fogTex(11, '#a8b4c0'), fog2 = fogTex(23, '#8e9ab0'), clouds = cloudTex(5), canopy = canopyTex(9);

  const drops = [];
  for (let i = 0; i < 220; i++) drops.push({ x: Math.random() * W, y: Math.random() * H, s: 0.7 + Math.random() * 0.8 });

  We.setArea = function (area) {
    We.area = area; We.base.fog = area.fog || 0; We.base.canopy = area.canopy || 0; We.base.clouds = area.indoor ? 0 : 1; We.indoor = !!area.indoor;
  };
  We.update = function (dt, G) {
    const area = We.area || {};
    We.wind = 0.35 + (U.noise(G.clock * 0.05, 7, 3) - 0.5) * 0.5 + (We.stormK > 0.3 ? 0.4 : 0);
    if (We.indoor) { We.target = 'clear'; } else {
      We.timer -= dt;
      if (We.timer <= 0 || !We.target) {
        const w = area.weather || { clear: 0.6, fog: 0.2, rain: 0.2 }; let sum = 0, t = Math.random(); We.target = 'clear';
        Object.keys(w).some((k) => { sum += w[k]; if (t <= sum) { We.target = k; return true; } return false; });
        if (G.flags && G.flags.forcedWeather) We.target = G.flags.forcedWeather;
        We.timer = U.rr(50, 140);
      }
    }
    const wantFog = We.indoor ? 0 : We.target === 'fog' ? 1 : We.target === 'rain' ? 0.35 : We.target === 'storm' ? 0.3 : 0;
    const wantRain = We.target === 'rain' ? 0.75 : We.target === 'storm' ? 1 : 0, wantStorm = We.target === 'storm' ? 1 : 0;
    We.fogK = U.approach(We.fogK, wantFog, dt * 0.06); We.rainK = U.approach(We.rainK, We.indoor ? 0 : wantRain, dt * 0.08); We.stormK = U.approach(We.stormK, wantStorm, dt * 0.08);
    We.type = We.stormK > 0.5 ? 'storm' : We.rainK > 0.35 ? 'rain' : We.fogK > 0.5 ? 'fog' : 'clear';
    if (We.stormK > 0.6 && !AH.G.settings.reduceFlash) {
      if (We.thunderIn < 0 && Math.random() < dt * 0.06) { We.flash = 1; We.thunderIn = U.rr(0.4, 2); }
    }
    if (We.thunderIn >= 0) { We.thunderIn -= dt; if (We.thunderIn < 0) { AH.Audio.sfx('thunder'); We.thunderIn = -1; } }
    We.flash = Math.max(0, We.flash - dt * 3);
    AH.Audio.ambience({ rain: We.rainK, wind: U.clamp(We.wind * 0.6 + We.stormK * 0.4, 0, 1) * (We.indoor ? 0.1 : 1), crypt: We.indoor ? 1 : 0 });
  };
  We.sightMult = () => 1 - We.fogK * 0.42 - We.rainK * 0.18;
  We.isWet = () => We.rainK > 0.3;
  We.label = () => ({ clear: 'Still air', fog: 'Fog', rain: 'Rain', storm: 'Storm' }[We.type]);
  We.forceLightning = function () { We.flash = 1; We.thunderIn = 0.5; };

  /* ---- layers ---- */
  function tile(g, tex, ox, oy, scale, alpha) {
    const s = tex.width * scale; ox = ((ox % s) + s) % s; oy = ((oy % s) + s) % s;
    g.globalAlpha = alpha;
    for (let x = -ox; x < W; x += s) for (let y = -oy; y < H; y += s) g.drawImage(tex, 0, 0, tex.width, tex.height, Math.round(x), Math.round(y), s, s);
    g.globalAlpha = 1;
  }
  We.drawClouds = function (g, cam, t, daylight) {
    if (We.indoor || !We.base.clouds) return;
    const a = 0.2 * (0.35 + daylight * 0.65) * (1 - We.fogK * 0.5);
    tile(g, clouds, cam.x * 0.9 + t * 5 * (0.5 + We.wind), cam.y * 0.9 + t * 1.5, 6, a);
  };
  We.drawFog = function (g, cam, t) {
    const k = Math.max(We.fogK, We.base.fog);
    if (k <= 0.02) return;
    tile(g, fog1, cam.x * 0.55 + t * 7 * (0.5 + We.wind), cam.y * 0.55 + t * 2, 3, 0.34 * k);
    tile(g, fog2, cam.x * 1.45 - t * 11 * (0.5 + We.wind), cam.y * 1.45 + t * 3, 4, 0.26 * k);
  };
  We.drawCanopy = function (g, cam, t) {
    const k = We.base.canopy; if (k <= 0) return;
    tile(g, canopy, cam.x * 1.32 + Math.sin(t * 0.4) * 4 * We.wind, cam.y * 1.32 + Math.cos(t * 0.3) * 2, 3, 0.55 * k);
  };
  We.drawRain = function (g, cam, dt) {
    if (We.rainK < 0.04) return;
    const n = Math.floor(drops.length * We.rainK), sl = 0.28 + We.wind * 0.3;
    g.fillStyle = 'rgba(150,175,205,0.55)';
    for (let i = 0; i < n; i++) {
      const d = drops[i]; d.y += (240 + d.s * 160) * dt; d.x += (240 + d.s * 160) * dt * sl;
      if (d.y > H + 6) { d.y = -8; d.x = Math.random() * W; } if (d.x > W + 8) d.x = -8;
      const len = 3 + Math.round(d.s * 2); for (let k = 0; k < len; k++) { g.globalAlpha = 0.25 + 0.35 * d.s * (k / len); g.fillRect(Math.round(d.x - k * sl), Math.round(d.y - k), 1, 1); }
    }
    g.globalAlpha = 1;
  };
  We.drawFlash = function (g) { if (We.flash > 0.02) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = We.flash * 0.5; g.fillStyle = '#b8c8ff'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; } };
})();

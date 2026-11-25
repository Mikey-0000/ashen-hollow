/* Ashen Hollow - hand-drawn proportional pixel font (5x7 capitals, 5x9 with descenders).
   Each glyph is rows separated by '/', '#' = ink. '~n/' skips n empty rows. */
(function () {
  'use strict';
  const AH = window.AH;
  const D = {
    'A': '.###./#...#/#...#/#####/#...#/#...#/#...#', 'B': '####./#...#/#...#/####./#...#/#...#/####.',
    'C': '.###./#...#/#..../#..../#..../#...#/.###.', 'D': '####./#...#/#...#/#...#/#...#/#...#/####.',
    'E': '#####/#..../#..../####./#..../#..../#####', 'F': '#####/#..../#..../####./#..../#..../#....',
    'G': '.###./#...#/#..../#.###/#...#/#...#/.####', 'H': '#...#/#...#/#...#/#####/#...#/#...#/#...#',
    'I': '.###./..#../..#../..#../..#../..#../.###.', 'J': '..###/...#./...#./...#./...#./#..#./.##..',
    'K': '#...#/#..#./#.#../##.../#.#../#..#./#...#', 'L': '#..../#..../#..../#..../#..../#..../#####',
    'M': '#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#', 'N': '#...#/##..#/#.#.#/#..##/#...#/#...#/#...#',
    'O': '.###./#...#/#...#/#...#/#...#/#...#/.###.', 'P': '####./#...#/#...#/####./#..../#..../#....',
    'Q': '.###./#...#/#...#/#...#/#.#.#/#..#./.##.#', 'R': '####./#...#/#...#/####./#.#../#..#./#...#',
    'S': '.####/#..../#..../.###./....#/....#/####.', 'T': '#####/..#../..#../..#../..#../..#../..#..',
    'U': '#...#/#...#/#...#/#...#/#...#/#...#/.###.', 'V': '#...#/#...#/#...#/#...#/#...#/.#.#./..#..',
    'W': '#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#', 'X': '#...#/#...#/.#.#./..#../.#.#./#...#/#...#',
    'Y': '#...#/#...#/.#.#./..#../..#../..#../..#..', 'Z': '#####/....#/...#./..#../.#.../#..../#####',
    '0': '.###./#...#/#..##/#.#.#/##..#/#...#/.###.', '1': '..#../.##../..#../..#../..#../..#../.###.',
    '2': '.###./#...#/....#/...#./..#../.#.../#####', '3': '.###./#...#/....#/..##./....#/#...#/.###.',
    '4': '...#./..##./.#.#./#..#./#####/...#./...#.', '5': '#####/#..../####./....#/....#/#...#/.###.',
    '6': '..##./.#.../#..../####./#...#/#...#/.###.', '7': '#####/....#/...#./..#../.#.../.#.../.#...',
    '8': '.###./#...#/#...#/.###./#...#/#...#/.###.', '9': '.###./#...#/#...#/.####/....#/...#./.##..',
    'a': '~2/.###./....#/.####/#...#/.####', 'b': '#..../#..../#.##./##..#/#...#/#...#/####.',
    'c': '~2/.###./#...#/#..../#...#/.###.', 'd': '....#/....#/.##.#/#..##/#...#/#...#/.####',
    'e': '~2/.###./#...#/#####/#..../.###.', 'f': '..##./.#..#/.#.../###../.#.../.#.../.#...',
    'g': '~2/.####/#...#/#...#/.####/....#/.###.', 'h': '#..../#..../#.##./##..#/#...#/#...#/#...#',
    'i': '..#../...../.##../..#../..#../..#../.###.', 'j': '...#./...../..##./...#./...#./...#./#..#./.##..',
    'k': '#..../#..../#..#./#.#../##.../#.#../#..#.', 'l': '.##../..#../..#../..#../..#../..#../.###.',
    'm': '~2/##.#./#.#.#/#.#.#/#.#.#/#.#.#', 'n': '~2/#.##./##..#/#...#/#...#/#...#',
    'o': '~2/.###./#...#/#...#/#...#/.###.', 'p': '~2/####./#...#/#...#/####./#..../#....',
    'q': '~2/.####/#...#/#...#/.####/....#/....#', 'r': '~2/#.##./##..#/#..../#..../#....',
    's': '~2/.####/#..../.###./....#/####.', 't': '.#.../.#.../###../.#.../.#.../.#..#/..##.',
    'u': '~2/#...#/#...#/#...#/#..##/.##.#', 'v': '~2/#...#/#...#/#...#/.#.#./..#..',
    'w': '~2/#...#/#...#/#.#.#/#.#.#/.#.#.', 'x': '~2/#...#/.#.#./..#../.#.#./#...#',
    'y': '~2/#...#/#...#/#...#/.####/....#/.###.', 'z': '~2/#####/...#./..#../.#.../#####',
    '!': '..#../..#../..#../..#../..#../...../..#..', '"': '.#.#./.#.#./.#.#.', "'": '..#../..#../.#...',
    '(': '...#./..#../.#.../.#.../.#.../..#../...#.', ')': '.#.../..#../...#./...#./...#./..#../.#...',
    '*': '~1/#.#.#/.###./#####/.###./#.#.#', '+': '~1/..#../..#../#####/..#../..#..',
    ',': '~5/..##./..##./..#../.#...', '-': '~3/.###.', '.': '~5/.##../.##..',
    '/': '....#/....#/...#./..#../.#.../#..../#....', ':': '~2/.##../.##../...../.##../.##..',
    ';': '~2/.##../.##../...../.##../..#../.#...', '<': '...#./..#../.#.../#..../.#.../..#../...#.',
    '=': '~2/#####/...../#####', '>': '.#.../..#../...#./....#/...#./..#../.#...',
    '?': '.###./#...#/....#/...#./..#../...../..#..', '[': '.###./.#.../.#.../.#.../.#.../.#.../.###.',
    ']': '.###./...#./...#./...#./...#./...#./.###.', '_': '~7/#####', '%': '##..#/##..#/...#./..#../.#.../#..##/#..##',
    '&': '.##../#..#./#.#../.#.../#.#.#/#..#./.##.#', '#': '.#.#./#####/.#.#./.#.#./#####/.#.#.', '|': '..#../..#../..#../..#../..#../..#../..#..',
    '^': '..#../.#.#./#...#', '@': '.###./#...#/#.###/#.#.#/#.###/#..../.###.', '~': '~3/.#..#/#.##.',
    '$': '..#../.####/#.#../.###./..#.#/####./..#..', '`': '.#.../..#..', '{': '..##./..#../.#.../..#../..#../..#../..##.', '}': '##.../..#../...#./..#../..#../..#../##...',
    '\\': '#..../#..../.#.../..#../...#./....#/....#',
  };
  const CELL_W = 7, CELL_H = 10;
  const chars = Object.keys(D);
  const glyphs = {};
  const base = document.createElement('canvas');
  base.width = CELL_W * chars.length; base.height = CELL_H;
  const bg = base.getContext('2d');
  chars.forEach((ch, i) => {
    let src = D[ch], off = 0;
    if (src[0] === '~') { off = +src[1]; src = src.slice(3); }
    const rows = src.split('/');
    let min = 9, max = -1;
    rows.forEach((r, y) => {
      for (let x = 0; x < r.length; x++) if (r[x] === '#') {
        bg.fillStyle = '#fff'; bg.fillRect(i * CELL_W + x, y + off, 1, 1);
        if (x < min) min = x; if (x > max) max = x;
      }
    });
    glyphs[ch] = { sx: i * CELL_W + min, w: max - min + 1 };
  });
  glyphs[' '] = { sx: 0, w: 0, space: true };

  const atlases = {};
  function atlas(color) {
    let a = atlases[color];
    if (a) return a;
    a = document.createElement('canvas'); a.width = base.width; a.height = base.height;
    const g = a.getContext('2d');
    g.drawImage(base, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, a.width, a.height);
    atlases[color] = a; return a;
  }

  const Font = (AH.Font = {});
  Font.lineH = 10;
  Font.width = function (text) {
    let w = 0;
    for (let i = 0; i < text.length; i++) {
      const gl = glyphs[text[i]] || glyphs['?'];
      w += gl.space ? 3 : gl.w + 1;
    }
    return Math.max(0, w - 1);
  };
  function raw(g, text, x, y, color) {
    const a = atlas(color);
    for (let i = 0; i < text.length; i++) {
      const gl = glyphs[text[i]] || glyphs['?'];
      if (gl.space) { x += 3; continue; }
      if (AH.Hi && AH.Hi.on) g.drawImage(AH.Hi.of(a), gl.sx * 2, 0, gl.w * 2, CELL_H * 2, x, y, gl.w, CELL_H); else g.drawImage(a, gl.sx, 0, gl.w, CELL_H, x, y, gl.w, CELL_H);
      x += gl.w + 1;
    }
  }
  /* o: {shadow, outline, align, alpha} */
  Font.draw = function (g, text, x, y, color, o) {
    o = o || {}; text = String(text); color = color || AH.C.bone;
    x = Math.round(x); y = Math.round(y);
    if (o.align === 'center') x -= Math.floor(Font.width(text) / 2);
    else if (o.align === 'right') x -= Font.width(text);
    const pa = g.globalAlpha; if (o.alpha !== undefined) g.globalAlpha = pa * o.alpha;
    if (o.outline) { const oc = o.outline; raw(g, text, x - 1, y, oc); raw(g, text, x + 1, y, oc); raw(g, text, x, y - 1, oc); raw(g, text, x, y + 1, oc); }
    if (o.shadow !== false) raw(g, text, x, y + 1, o.shadow || '#05040a');
    raw(g, text, x, y, color);
    g.globalAlpha = pa;
  };
  /* word-wrap to a pixel width; honours \n */
  Font.wrap = function (text, maxW) {
    const out = [];
    String(text).split('\n').forEach((para) => {
      const words = para.split(' '); let line = '';
      words.forEach((w) => {
        const t = line ? line + ' ' + w : w;
        if (Font.width(t) > maxW && line) { out.push(line); line = w; } else line = t;
      });
      out.push(line);
    });
    return out;
  };
  /* big display lettering: scaled glyphs with a gradient fill and hard outline (cached) */
  const bigCache = {};
  Font.big = function (text, scale, top, bottom, outline) {
    const key = text + scale + top + bottom + outline;
    if (bigCache[key]) return bigCache[key];
    const w = Font.width(text), h = 10;
    const t = document.createElement('canvas'); t.width = w + 2; t.height = h + 2;
    const tg = t.getContext('2d'); tg.imageSmoothingEnabled = false;
    raw(tg, text, 1, 1, '#ffffff');
    const c = document.createElement('canvas'); c.width = (w + 2) * scale; c.height = (h + 2) * scale;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    g.drawImage(t, 0, 0, c.width, c.height);
    g.globalCompositeOperation = 'source-in';
    const gr = g.createLinearGradient(0, scale, 0, 9 * scale); gr.addColorStop(0, top); gr.addColorStop(1, bottom);
    g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
    /* outline pass */
    const o = document.createElement('canvas'); o.width = c.width + 8; o.height = c.height + 8;
    const og = o.getContext('2d'); og.imageSmoothingEnabled = false;
    const sil = document.createElement('canvas'); sil.width = c.width; sil.height = c.height;
    const sg = sil.getContext('2d'); sg.drawImage(c, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = outline; sg.fillRect(0, 0, sil.width, sil.height);
    const s = Math.max(1, Math.round(scale / 2));
    for (let dx = -s; dx <= s; dx += s) for (let dy = -s; dy <= s + s; dy += s) og.drawImage(sil, 4 + dx, 4 + dy);
    og.drawImage(c, 4, 4);
    return (bigCache[key] = o);
  };
})();

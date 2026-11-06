/*
 * Antigravity: latar partikel yang membentuk cincin mengikuti kursor (WebGL2).
 * Diadaptasi dari komponen Antigravity (React Bits, reactbits.dev), varian JavaScript + CSS.
 * Ditulis ulang tanpa React karena website ini tidak memakai proses build.
 *
 * Pemakaian: Antigravity.mount(elemen, { colors: [...], count: 1800, ... })
 * Tanpa WebGL2, fungsi ini diam saja dan latar tetap polos.
 */
(function () {
  "use strict";

  var PIXEL_BUDGET = 2.4e6;
  var WORLD_HEIGHT = 31.5;
  var PALETTE_SIZE = 256;
  var DEFAULT_COLORS = ["#5227FF", "#FF9FFC", "#B497CF"];
  var SHAPES = { capsule: 0, sphere: 1, box: 2, tetrahedron: 3 };
  var COLOR_MODES = { conic: 0, radial: 1, random: 2 };

  var VERTEX = [
    "#version 300 es",
    "precision highp float;",
    "layout(location = 0) in vec2 aCorner;",
    "layout(location = 1) in vec4 aParticle;",
    "layout(location = 2) in vec4 aSeed;",
    "uniform vec2 uSize;",
    "uniform float uPixel;",
    "uniform vec2 uCursor;",
    "uniform float uRing;",
    "uniform float uBand;",
    "uniform float uParticle;",
    "uniform float uAmbient;",
    "uniform float uTime;",
    "uniform float uPulse;",
    "uniform float uVariance;",
    "uniform float uDepth;",
    "uniform float uShape;",
    "uniform float uColorMode;",
    "uniform float uStops;",
    "uniform float uHue;",
    "uniform float uReveal;",
    "uniform float uStreak;",
    "uniform float uCharge;",
    "out vec2 vLocal;",
    "out vec2 vBounds;",
    "out float vU;",
    "out float vAlpha;",
    "out float vSoft;",
    "void main() {",
    "  vec2 rel = aParticle.xy - uCursor;",
    "  float dist = length(rel);",
    "  vec2 radial = dist > 1e-3 ? rel / dist : vec2(1.0, 0.0);",
    "  vec2 dir = radial;",
    "  float speed = length(aParticle.zw);",
    "  float streak = clamp(speed / uStreak, 0.0, 2.5);",
    "  if (speed > 1e-3) {",
    "    vec2 heading = aParticle.zw / speed * sign(dot(aParticle.zw, radial) + 1e-4);",
    "    dir = normalize(mix(radial, heading, smoothstep(0.0, 1.0, streak)));",
    "  }",
    "  float ring = exp(-pow((dist - uRing) / uBand, 2.0));",
    "  float z = aSeed.x;",
    "  float depth = 1.0 + z * 0.32 * uDepth;",
    "  float pulse = 1.0 + sin(uTime * uPulse + aSeed.y) * 0.22 * uVariance;",
    "  float grow = uAmbient + (1.0 - uAmbient) * ring;",
    "  float size = uParticle * depth * pulse * (0.85 + 0.3 * aSeed.w) * (1.0 + uCharge * 0.25 * ring);",
    "  vec2 bounds;",
    "  if (uShape < 0.5) {",
    "    float width = size * 0.17 * mix(0.55, 1.0, ring);",
    "    bounds = vec2(max(width, size * 0.5 * grow) * (1.0 + streak * 1.2), width);",
    "  } else if (uShape < 1.5) {",
    "    bounds = vec2(size * 0.22 * mix(0.45, 1.0, grow));",
    "  } else {",
    "    bounds = vec2(size * 0.26 * mix(0.45, 1.0, grow));",
    "  }",
    "  float soft = 1.0 + max(-z, 0.0) * 1.6 * uDepth;",
    "  vec2 local = aCorner * (bounds + soft * 1.5 / uPixel);",
    "  vec2 world = aParticle.xy + dir * local.x + vec2(-dir.y, dir.x) * local.y;",
    "  gl_Position = vec4(world.x / uSize.x * 2.0 - 1.0, 1.0 - world.y / uSize.y * 2.0, 0.0, 1.0);",
    "  vLocal = local * uPixel;",
    "  vBounds = bounds * uPixel;",
    "  vSoft = soft;",
    "  if (uColorMode < 0.5) {",
    "    vU = atan(radial.y, radial.x) / 6.28318530718 + uHue + (aSeed.z - 0.5) * 0.06;",
    "  } else if (uColorMode < 1.5) {",
    "    vU = clamp(dist / (uRing * 2.4), 0.0, 1.0) + (aSeed.z - 0.5) * 0.06;",
    "  } else {",
    "    vU = floor(aSeed.z * uStops) / max(uStops - 1.0, 1.0);",
    "  }",
    "  float fog = 1.0 - max(-z, 0.0) * 0.35 * uDepth;",
    "  vAlpha = mix(uAmbient, 1.0, ring) * fog * uReveal;",
    "}"
  ].join("\n");

  var FRAGMENT = [
    "#version 300 es",
    "precision highp float;",
    "uniform sampler2D uPalette;",
    "uniform float uShape;",
    "uniform float uColorMode;",
    "uniform float uOpacity;",
    "in vec2 vLocal;",
    "in vec2 vBounds;",
    "in float vU;",
    "in float vAlpha;",
    "in float vSoft;",
    "out vec4 fragColor;",
    "void main() {",
    "  vec2 p = vLocal;",
    "  float d;",
    "  if (uShape < 0.5) {",
    "    float r = vBounds.y;",
    "    d = length(vec2(max(abs(p.x) - max(vBounds.x - r, 0.0), 0.0), p.y)) - r;",
    "  } else if (uShape < 1.5) {",
    "    d = length(p) - vBounds.x;",
    "  } else if (uShape < 2.5) {",
    "    float r = vBounds.x * 0.28;",
    "    vec2 q = abs(p) - (vBounds - r);",
    "    d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;",
    "  } else {",
    "    float r = vBounds.x * 1.15;",
    "    vec2 q = vec2(r * 0.5774 - p.x, abs(p.y));",
    "    d = max(dot(q, vec2(0.5, 0.8660254)) - r * 0.5, -q.x - r * 0.5) * 1.2;",
    "  }",
    "  float alpha = clamp(0.5 - d / vSoft, 0.0, 1.0) * vAlpha * uOpacity;",
    "  if (alpha < 0.002) discard;",
    "  vec3 color = texture(uPalette, vec2(uColorMode < 0.5 ? fract(vU) : vU, uColorMode < 0.5 ? 0.25 : 0.75)).rgb;",
    "  fragColor = vec4(color * alpha, alpha);",
    "}"
  ].join("\n");

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function parseColor(value) {
    var text = String(value || "").trim();
    var hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
    if (hex) {
      var full = hex[1].length === 3 ? hex[1].replace(/./g, function (d) { return d + d; }) : hex[1];
      return [0, 2, 4].map(function (i) { return parseInt(full.slice(i, i + 2), 16) / 255; });
    }
    var rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
    if (rgb) return [rgb[1], rgb[2], rgb[3]].map(function (c) { return clamp(parseFloat(c) / 255, 0, 1); });
    return null;
  }
  function toLinear(c) { return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function toSrgb(c) { return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(Math.max(c, 0), 1 / 2.4) - 0.055; }
  function toOklab(color) {
    var r = toLinear(color[0]), g = toLinear(color[1]), b = toLinear(color[2]);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [
      0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
    ];
  }
  function fromOklab(lab) {
    var L = lab[0], a = lab[1], b = lab[2];
    var l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
    var m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
    var s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
    ].map(function (c) { return clamp(toSrgb(c), 0, 1); });
  }

  function buildPalette(colors, light) {
    var stops = [];
    colors.forEach(function (color) {
      var parsed = parseColor(color);
      if (!parsed) return;
      var lab = toOklab(parsed);
      var hue = (Math.atan2(lab[2], lab[1]) * 180) / Math.PI;
      var warmth = clamp(1 - Math.abs(hue - 85) / 40, 0, 1);
      var ceiling = 0.62 + 0.14 * warmth * warmth * (3 - 2 * warmth);
      if (light && lab[0] > ceiling) {
        var boost = 1 + (lab[0] - ceiling) * 1.6;
        stops.push([ceiling, lab[1] * boost, lab[2] * boost]);
      } else stops.push(lab);
    });
    if (!stops.length) stops.push(toOklab(light ? [0.1, 0.1, 0.12] : [1, 1, 1]));
    var data = new Uint8Array(PALETTE_SIZE * 2 * 4);
    var rows = [stops.concat([stops[0]]), stops.length > 1 ? stops : [stops[0], stops[0]]];
    rows.forEach(function (row, index) {
      for (var x = 0; x < PALETTE_SIZE; x++) {
        var t = (x / (PALETTE_SIZE - (index === 0 ? 0 : 1))) * (row.length - 1);
        var from = Math.min(Math.floor(t), row.length - 2);
        var k = t - from;
        var eased = k * k * (3 - 2 * k);
        var start = row[from], end = row[from + 1];
        var chroma = Math.hypot(start[1], start[2]) * (1 - eased) + Math.hypot(end[1], end[2]) * eased;
        var a = start[1] + (end[1] - start[1]) * eased;
        var b = start[2] + (end[2] - start[2]) * eased;
        var len = Math.hypot(a, b);
        var scale = len > 1e-4 ? chroma / len : 0;
        var color = fromOklab([start[0] + (end[0] - start[0]) * eased, a * scale, b * scale]);
        for (var ch = 0; ch < 3; ch++) data[(index * PALETTE_SIZE + x) * 4 + ch] = Math.round(color[ch] * 255);
        data[(index * PALETTE_SIZE + x) * 4 + 3] = 255;
      }
    });
    return data;
  }

  function random(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function compile(gl, type, source) {
    var shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(shader)); gl.deleteShader(shader); return null; }
    return shader;
  }
  function link(gl) {
    var vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    var fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    var program = vertex && fragment ? gl.createProgram() : null;
    if (!vertex || !fragment || !program) {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
      return null;
    }
    gl.attachShader(program, vertex); gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex); gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(program)); gl.deleteProgram(program); return null; }
    var uniforms = {};
    var n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) {
      var info = gl.getActiveUniform(program, i);
      if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
    return { program: program, uniforms: uniforms };
  }

  function settingsFrom(o) {
    var palette = o.color ? [o.color] : Array.isArray(o.colors) && o.colors.length ? o.colors : DEFAULT_COLORS;
    function d(v, def) { return v === undefined ? def : v; }
    return {
      count: clamp(Math.round(d(o.count, 1500)), 1, 20000),
      magnet: Math.max(0, d(o.magnetRadius, 9)),
      ring: Math.max(0, d(o.ringRadius, 7)),
      waveSpeed: d(o.waveSpeed, 0.4),
      waveAmplitude: Math.max(0, d(o.waveAmplitude, 1)),
      waveCount: Math.max(0, Math.round(d(o.waveCount, 3))),
      size: Math.max(0, d(o.particleSize, 0.9)),
      follow: clamp(d(o.lerpSpeed, 0.05), 0.001, 1),
      palette: palette,
      paletteKey: palette.join(",") + "|" + !!o.lightMode,
      colorMode: COLOR_MODES[o.colorMode] !== undefined ? COLOR_MODES[o.colorMode] : COLOR_MODES.conic,
      colorSpeed: d(o.colorSpeed, 0.05),
      autoAnimate: d(o.autoAnimate, true),
      variance: Math.max(0, d(o.particleVariance, 1)),
      rotation: d(o.rotationSpeed, 0),
      depth: Math.max(0, d(o.depthFactor, 1)),
      pulse: d(o.pulseSpeed, 3),
      shape: SHAPES[o.particleShape] !== undefined ? SHAPES[o.particleShape] : SHAPES.capsule,
      tightness: Math.max(0, d(o.fieldStrength, 10)),
      ambient: clamp(d(o.ambient, 0.25), 0, 1),
      interactive: d(o.interactive, true),
      clickBurst: d(o.clickBurst, true),
      intro: d(o.intro, true),
      light: !!o.lightMode,
      opacity: clamp(d(o.opacity, 1), 0, 1),
      maxRatio: clamp(d(o.maxDevicePixelRatio, 2), 0.5, 3)
    };
  }

  function mount(container, options) {
    if (!container) return null;
    var s = settingsFrom(options || {});
    container.classList.add("antigravity");
    var canvas = document.createElement("canvas");
    canvas.className = "antigravity__canvas";
    canvas.setAttribute("aria-hidden", "true");
    container.appendChild(canvas);

    var generation = 0;
    var destroy = start();
    function restart() { if (destroy) destroy(); generation++; destroy = start(); }

    function start() {
      var gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: "high-performance" });
      var shader = gl ? link(gl) : null;
      if (!gl || !shader) return null;

      var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      var vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      var cornerBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      var particleBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(1, 1);
      var seedBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, seedBuffer);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(2, 1);

      var paletteTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      var size = { width: 1, height: 1, ratio: 1 };
      var cursor = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, ready: false };
      var pointer = { x: 0, y: 0, inside: false, down: false, moved: -Infinity };
      var field = null, paletteKey = "", time = 0, hue = 0, charge = 0;
      var introClock = s.intro && !reduced && generation === 0 ? 0 : Infinity;
      var raf = 0, last = 0, visible = true, pageVisible = document.visibilityState !== "hidden", lost = false;

      function updatePalette() {
        if (s.paletteKey === paletteKey) return;
        paletteKey = s.paletteKey;
        gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, PALETTE_SIZE, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, buildPalette(s.palette, s.light));
      }

      function buildField(total, width, height, previous) {
        var rand = random(1337);
        var margin = 0.06;
        var spanX = width * (1 + margin * 2), spanY = height * (1 + margin * 2);
        var cols = Math.max(1, Math.ceil(Math.sqrt((total * spanX) / spanY)));
        var rows = Math.max(1, Math.ceil(total / cols));
        var cells = [], i;
        for (i = 0; i < cols * rows; i++) cells.push(i);
        for (i = cells.length - 1; i > 0; i--) {
          var swap = Math.floor(rand() * (i + 1));
          var tmp = cells[i]; cells[i] = cells[swap]; cells[swap] = tmp;
        }
        var depths = [];
        for (i = 0; i < total; i++) depths.push(rand() * 2 - 1);
        depths.sort(function (a, b) { return a - b; });
        var next = {
          total: total, width: width, height: height,
          homeX: new Float32Array(total), homeY: new Float32Array(total), band: new Float32Array(total),
          phase: new Float32Array(total), agility: new Float32Array(total), delay: new Float32Array(total),
          orbit: new Float32Array(total), x: new Float32Array(total), y: new Float32Array(total),
          vx: new Float32Array(total), vy: new Float32Array(total),
          particles: new Float32Array(total * 4), seeds: new Float32Array(total * 4)
        };
        for (i = 0; i < total; i++) {
          var cell = cells[i];
          var hx = -width * margin + (((cell % cols) + 0.5 + (rand() - 0.5) * 0.85) / cols) * spanX;
          var hy = -height * margin + ((Math.floor(cell / cols) + 0.5 + (rand() - 0.5) * 0.85) / rows) * spanY;
          next.homeX[i] = hx; next.homeY[i] = hy;
          next.band[i] = rand() * 2 - 1;
          next.phase[i] = rand() * Math.PI * 2;
          next.agility[i] = 0.75 + rand() * 0.5;
          next.delay[i] = rand();
          if (previous && i < previous.total) {
            next.x[i] = (previous.x[i] / previous.width) * width;
            next.y[i] = (previous.y[i] / previous.height) * height;
            next.vx[i] = previous.vx[i]; next.vy[i] = previous.vy[i];
            next.orbit[i] = previous.orbit[i];
          } else {
            next.x[i] = hx;
            next.y[i] = introClock === 0 ? hy + height * (0.45 + next.delay[i] * 0.4) : hy;
          }
          next.seeds[i * 4] = depths[i];
          next.seeds[i * 4 + 1] = next.phase[i];
          next.seeds[i * 4 + 2] = rand();
          next.seeds[i * 4 + 3] = rand();
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, seedBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, next.seeds, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, next.particles.byteLength, gl.DYNAMIC_DRAW);
        return next;
      }

      function resize() {
        var rect = container.getBoundingClientRect();
        var cssWidth = Math.max(1, rect.width), cssHeight = Math.max(1, rect.height);
        // Halaman yang tersembunyi berukuran 0: tunggu sampai tampil.
        if (rect.width < 2 || rect.height < 2) return false;
        var ratio = Math.min(window.devicePixelRatio || 1, s.maxRatio, Math.sqrt(PIXEL_BUDGET / (cssWidth * cssHeight)));
        var width = Math.max(1, Math.round(cssWidth * ratio)), height = Math.max(1, Math.round(cssHeight * ratio));
        if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
        size.width = cssWidth; size.height = cssHeight; size.ratio = width / cssWidth;
        if (!cursor.ready) { cursor.x = cursor.tx = cssWidth / 2; cursor.y = cursor.ty = cssHeight / 2; cursor.ready = true; }
        if (!field || field.total !== s.count || Math.abs(field.width - cssWidth) > 0.5 || Math.abs(field.height - cssHeight) > 0.5) {
          field = buildField(s.count, cssWidth, cssHeight, field);
        }
        return true;
      }

      function simulate(dt) {
        if (!field) return;
        var unit = size.height / WORLD_HEIGHT;
        var ringPx = s.ring * unit * (1 - 0.38 * charge);
        var magnetPx = Math.max(s.magnet * unit, 1);
        var spread = (5 / (s.tightness + 0.1)) * unit;
        var wavePx = s.waveAmplitude * unit * 0.5;
        var omegaBase = 2.2 + s.follow * 80;
        var spinRate = (s.rotation + charge * 3) * (reduced ? 0.3 : 1);
        var centerX = size.width / 2, centerY = size.height / 2;
        var edge = magnetPx * 0.18;
        var f = field;
        for (var i = 0; i < f.total; i++) {
          var parallax = 1 - f.seeds[i * 4] * 0.12 * s.depth;
          var cx = centerX + (cursor.x - centerX) * parallax;
          var cy = centerY + (cursor.y - centerY) * parallax;
          var hx = f.homeX[i];
          var hy = f.homeY[i] + Math.sin(time * 0.7 + f.phase[i]) * unit * 0.12 * s.waveAmplitude;
          var dx = hx - cx, dy = hy - cy;
          var dist = Math.sqrt(dx * dx + dy * dy);
          var capture = 1 - clamp((dist - (magnetPx - edge)) / (edge * 2), 0, 1);
          var ease = capture * capture * (3 - 2 * capture);
          var turn = f.orbit[i] + spinRate * ease * dt;
          turn -= Math.atan2(Math.sin(turn), Math.cos(turn)) * (1 - ease) * Math.min(1, dt * 2.5);
          f.orbit[i] = turn;
          var tx = hx, ty = hy;
          if (ease > 0 || Math.abs(turn) > 1e-4) {
            var angle = Math.atan2(dy, dx) + turn;
            var wave = wavePx * (0.6 * Math.sin(angle * s.waveCount - time * s.waveSpeed * 2) + 0.4 * Math.sin(f.phase[i] + time * s.waveSpeed * 1.3));
            var radius = dist + (ringPx + wave + f.band[i] * spread - dist) * ease;
            tx = cx + Math.cos(angle) * radius;
            ty = cy + Math.sin(angle) * radius;
          }
          var omega = introClock < f.delay[i] * 0.9 ? 0 : omegaBase * f.agility[i];
          var damping = 1.64 * omega, stiffness = omega * omega;
          var steps = Math.min(4, Math.max(1, Math.ceil(omega * dt * 2)));
          var h = dt / steps;
          for (var k = 0; k < steps; k++) {
            f.vx[i] += ((tx - f.x[i]) * stiffness - f.vx[i] * damping) * h;
            f.vy[i] += ((ty - f.y[i]) * stiffness - f.vy[i] * damping) * h;
            f.x[i] += f.vx[i] * h;
            f.y[i] += f.vy[i] * h;
          }
          f.particles[i * 4] = f.x[i]; f.particles[i * 4 + 1] = f.y[i];
          f.particles[i * 4 + 2] = f.vx[i]; f.particles[i * 4 + 3] = f.vy[i];
        }
      }

      function burst(strength) {
        if (!field) return;
        var unit = size.height / WORLD_HEIGHT;
        var reach = Math.max(s.magnet, s.ring) * unit * 1.8;
        var f = field;
        for (var i = 0; i < f.total; i++) {
          var dx = f.x[i] - cursor.x, dy = f.y[i] - cursor.y;
          var dist = Math.sqrt(dx * dx + dy * dy) + 1e-3;
          var kick = unit * 110 * strength * Math.exp(-Math.pow(dist / reach, 2)) * f.agility[i];
          f.vx[i] += (dx / dist) * kick;
          f.vy[i] += (dy / dist) * kick;
        }
      }

      function frame(now) {
        raf = 0;
        if (lost || !field) return;
        updatePalette();
        var dt = clamp((now - last) / 1000 || 0, 0, 1 / 30);
        last = Math.max(last, now);
        var pace = reduced ? 0.3 : 1;
        time += dt * pace;
        hue += dt * s.colorSpeed * pace;
        if (introClock < 3) introClock += dt;
        charge = pointer.down ? Math.min(1, charge + dt / 0.9) : Math.max(0, charge - dt * 4);

        var idle = performance.now() - pointer.moved > 2000 || !pointer.inside;
        if (s.autoAnimate && !reduced && (idle || !s.interactive)) {
          cursor.tx = size.width / 2 + Math.sin(time * 0.5) * (size.width / 4);
          cursor.ty = size.height / 2 + Math.cos(time) * (size.height / 4);
        } else if (s.interactive && pointer.inside) {
          cursor.tx = pointer.x; cursor.ty = pointer.y;
        }
        cursor.vx += ((cursor.tx - cursor.x) * 49 - cursor.vx * 14) * dt;
        cursor.vy += ((cursor.ty - cursor.y) * 49 - cursor.vy * 14) * dt;
        cursor.x += cursor.vx * dt;
        cursor.y += cursor.vy * dt;

        simulate(dt);

        var unit = size.height / WORLD_HEIGHT;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(shader.program);
        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, field.particles);
        var u = shader.uniforms;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
        gl.uniform1i(u.uPalette, 0);
        gl.uniform2f(u.uSize, size.width, size.height);
        gl.uniform1f(u.uPixel, size.ratio);
        gl.uniform2f(u.uCursor, cursor.x, cursor.y);
        gl.uniform1f(u.uRing, s.ring * unit * (1 - 0.38 * charge));
        gl.uniform1f(u.uBand, Math.max(unit * 6, 1));
        gl.uniform1f(u.uParticle, s.size * unit * 0.6);
        gl.uniform1f(u.uAmbient, s.ambient);
        gl.uniform1f(u.uTime, time);
        gl.uniform1f(u.uPulse, s.pulse);
        gl.uniform1f(u.uVariance, s.variance);
        gl.uniform1f(u.uDepth, s.depth);
        gl.uniform1f(u.uShape, s.shape);
        gl.uniform1f(u.uColorMode, s.colorMode);
        gl.uniform1f(u.uStops, s.palette.length);
        gl.uniform1f(u.uHue, hue);
        gl.uniform1f(u.uReveal, introClock < 3 ? clamp(introClock / 0.6, 0, 1) : 1);
        gl.uniform1f(u.uStreak, unit * 30);
        gl.uniform1f(u.uCharge, charge);
        gl.uniform1f(u.uOpacity, s.opacity);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, field.total);

        if (visible && pageVisible) raf = requestAnimationFrame(frame);
      }

      function wake() {
        if (raf || lost || !visible || !pageVisible) return;
        if (!field && !resize()) return;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }

      function locate(e) {
        var rect = container.getBoundingClientRect();
        return {
          x: e.clientX - rect.left, y: e.clientY - rect.top,
          inside: rect.width > 0 && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom
        };
      }
      function onPointerMove(e) {
        var spot = locate(e);
        pointer.inside = spot.inside;
        if (!spot.inside) return;
        pointer.x = spot.x; pointer.y = spot.y; pointer.moved = performance.now();
      }
      function onPointerDown(e) {
        var spot = locate(e);
        if (!spot.inside || !s.interactive) return;
        pointer.x = spot.x; pointer.y = spot.y; pointer.inside = true; pointer.moved = performance.now();
        if (s.clickBurst && !reduced) pointer.down = true;
      }
      function onPointerUp(e) {
        if (pointer.down) burst(0.45 + charge);
        pointer.down = false;
        if (e.pointerType !== "mouse") pointer.inside = false;
      }
      function onLeave() { pointer.inside = false; pointer.down = false; }
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerdown", onPointerDown, { passive: true });
      window.addEventListener("pointerup", onPointerUp, { passive: true });
      window.addEventListener("pointercancel", onPointerUp, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);

      function onLost(e) { e.preventDefault(); lost = true; cancelAnimationFrame(raf); raf = 0; }
      canvas.addEventListener("webglcontextlost", onLost);
      canvas.addEventListener("webglcontextrestored", restart);

      var ro = new ResizeObserver(function () { resize(); wake(); });
      ro.observe(container);
      var io = new IntersectionObserver(function (entries) {
        visible = entries.some(function (en) { return en.isIntersecting; });
        wake();
      });
      io.observe(container);
      function onVisibility() { pageVisible = document.visibilityState !== "hidden"; wake(); }
      document.addEventListener("visibilitychange", onVisibility);

      resize();
      wake();

      return function () {
        cancelAnimationFrame(raf);
        ro.disconnect(); io.disconnect();
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        document.removeEventListener("visibilitychange", onVisibility);
        canvas.removeEventListener("webglcontextlost", onLost);
        canvas.removeEventListener("webglcontextrestored", restart);
        if (!gl.isContextLost()) {
          gl.deleteBuffer(cornerBuffer); gl.deleteBuffer(particleBuffer); gl.deleteBuffer(seedBuffer);
          gl.deleteTexture(paletteTexture); gl.deleteVertexArray(vao); gl.deleteProgram(shader.program);
        }
      };
    }

    return { destroy: function () { if (destroy) destroy(); destroy = null; } };
  }

  window.Antigravity = { mount: mount };
})();

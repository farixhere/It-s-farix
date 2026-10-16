/* ============================================================
   FARIX — scenes.js
   The living background of the hero.
   · Desktop / tablet : a procedural WebGL moon (craters, maria, rim light)
   · Mobile           : a lightweight WebGL planet + 2D orbital rings
   · Parallax + pointer-driven moon lighting (desktop)
   · Only ONE scene renders at a time, and only while visible.
   · If WebGL is unavailable, CSS fallbacks stay on screen.
   No libraries. No build step.
   ============================================================ */
(function () {
  'use strict';

  var doc = document;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var hero = $('#hero'), scene = $('#scene');
  if (!hero || !scene) return;

  var mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  var mqMobile = matchMedia('(max-width: 767px)');
  var mqTablet = matchMedia('(min-width: 768px) and (max-width: 1023px) and (max-aspect-ratio: 5/4)');
  var mqFine = matchMedia('(hover: hover) and (pointer: fine)');

  /* ---------------------------------------------------------
     GLSL
     --------------------------------------------------------- */
  var COMMON = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform vec2 uRes; uniform float uTime; uniform float uR; uniform float uTint; uniform vec3 uLight; uniform float uPulse;',
    'float hash31(vec3 p){ p = fract(p*.1031); p += dot(p, p.zyx+31.32); return fract((p.x+p.y)*p.z); }',
    'vec3 hash33(vec3 p){ p = fract(p*vec3(.1031,.1030,.0973)); p += dot(p, p.yxz+33.33); return fract((p.xxy+p.yxx)*p.zyx); }',
    'float vnoise(vec3 x){',
    '  vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);',
    '  return mix(mix(mix(hash31(i),hash31(i+vec3(1,0,0)),f.x), mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),',
    '             mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x), mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y), f.z);',
    '}',
    'float fbm(vec3 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*vnoise(p); p*=2.03; a*=.5; } return s; }'
  ].join('\n');

  var MOON_FRAG = COMMON + '\n' + [
    /* Voronoi-style craters. Returns a height-ish term and accumulates an analytic gradient. */
    'float craters(vec3 p, float scale, float strength, float dens, inout vec3 grad){',
    '  vec3 q = p*scale; vec3 c = floor(q); vec3 f = fract(q);',
    '  vec3 o0 = -(1.0 - step(0.5, f));',
    '  float h = 0.0;',
    '  for(int i=0;i<2;i++) for(int j=0;j<2;j++) for(int k=0;k<2;k++){',
    '    vec3 g = o0 + vec3(float(i),float(j),float(k));',
    '    vec3 cell = c + g;',
    '    vec3 rnd = hash33(cell);',
    '    if(rnd.x < dens){',
    '      vec3 center = g + 0.2 + 0.6*hash33(cell+19.7) - f;',
    '      float rc = 0.16 + 0.30*rnd.y;',
    '      float r = length(center);',
    '      float t = r/rc;',
    '      if(t < 1.8){',
    '        float u = (t-1.0)*4.0;',
    '        float rim = 0.14*exp(-u*u);',
    '        float bowl = t < 1.0 ? -0.55*(1.0-t*t) : 0.0;',
    '        h += strength*(bowl+rim);',
    '        float dh = (t < 1.0 ? 1.1*t : 0.0) + 0.14*exp(-u*u)*(-8.0*u);',
    '        vec3 dt = -center/(max(r,1e-3)*rc);',
    '        grad += strength*dh*dt;',
    '      }',
    '    }',
    '  }',
    '  return h;',
    '}',
    'void main(){',
    '  vec2 uv = gl_FragCoord.xy/uRes - 0.5;',
    '  vec2 pp = uv/uR;',
    '  float d = length(pp);',
    '  vec3 haloCol = mix(vec3(0.28,0.80,1.0), vec3(0.58,0.46,1.0), uTint);',
    '  float od = max(d-1.0, 0.0);',
    '  float halo = (exp(-od*2.6)*0.12 + exp(-od*8.0)*0.30 + exp(-od*30.0)*0.42) * smoothstep(0.5, 0.34, length(uv));',
    '  vec3 rgb = vec3(0.0);',
    '  if(d < 1.0){',
    '    float z = sqrt(1.0 - d*d);',
    '    vec3 n = vec3(pp, z);',
    '    float ang = uTime*0.03; float ca=cos(ang), sa=sin(ang); float ct=cos(0.32), st=sin(0.32);',
    '    vec3 q = vec3(n.x*ca + n.z*sa, n.y, -n.x*sa + n.z*ca);',
    '    q = vec3(q.x, q.y*ct - q.z*st, q.y*st + q.z*ct);',
    '    vec3 g = vec3(0.0);',
    '    float h = craters(q, 2.4, 0.75, 0.2, g) + craters(q, 6.0, 0.65, 0.42, g) + craters(q, 12.0, 0.5, 0.46, g);',
    '    float maria = smoothstep(0.47, 0.64, fbm(q*1.6 + 4.0));',
    '    float grain = fbm(q*10.0);',
    '    vec3 gv = vec3(g.x, g.y*ct + g.z*st, -g.y*st + g.z*ct);',
    '    gv = vec3(gv.x*ca - gv.z*sa, gv.y, gv.x*sa + gv.z*ca);',
    '    vec3 gt = gv - n*dot(gv, n);',
    '    vec3 nn = normalize(n - 0.15*gt);',
    '    vec3 L = normalize(uLight);',
    '    float diff = max(dot(nn, L), 0.0);',
    '    float base = dot(n, L);',
    '    float albedo = clamp(0.92 - 0.16*maria + 0.26*(grain-0.5) + 0.10*h, 0.25, 1.15);',
    '    float lit = 0.20 + 0.95*diff;',
    '    vec3 cShadow = mix(vec3(0.02,0.07,0.17), vec3(0.07,0.05,0.18), uTint);',
    '    vec3 cMid    = mix(vec3(0.10,0.52,0.86), vec3(0.34,0.30,0.88), uTint);',
    '    vec3 cHi     = mix(vec3(0.68,0.98,1.00), vec3(0.82,0.80,1.00), uTint);',
    '    vec3 c = mix(cShadow, cMid, smoothstep(0.0, 0.5, lit));',
    '    c = mix(c, cHi, smoothstep(0.45, 1.0, lit));',
    '    c *= albedo;',
    '    c = mix(c, c*vec3(0.60,0.84,1.22), maria*0.75);',
    '    float fres = pow(1.0 - z, 2.4);',
    '    c += haloCol * fres * (0.40 + 0.40*smoothstep(-0.2, 0.6, base));',
    '    c += c*c*0.30;',
    '    rgb = c;',
    '  }',
    '  float edge = smoothstep(1.0, 0.994, d);',
    '  float a = clamp(edge + halo*(1.0-edge), 0.0, 1.0);',
    '  vec3 outRgb = rgb*edge + haloCol*halo*(1.0-edge);',
    '  outRgb += (hash31(vec3(gl_FragCoord.xy, uTime)) - 0.5)/255.0 * a;',
    '  gl_FragColor = vec4(outRgb, a);',
    '}'
  ].join('\n');

  var PLANET_FRAG = COMMON + '\n' + [
    'void main(){',
    '  vec2 uv = gl_FragCoord.xy/uRes - 0.5;',
    '  vec2 pp = uv/uR;',
    '  float d = length(pp);',
    '  vec3 haloCol = vec3(0.62, 0.38, 1.0);',
    '  float od = max(d-1.0, 0.0);',
    '  float halo = (exp(-od*3.0)*0.16 + exp(-od*10.0)*0.26 + exp(-od*34.0)*0.30) * (0.85 + 0.6*uPulse) * smoothstep(0.5, 0.36, length(uv));',
    '  vec3 rgb = vec3(0.0);',
    '  if(d < 1.0){',
    '    float z = sqrt(1.0 - d*d);',
    '    vec3 n = vec3(pp, z);',
    '    float ang = uTime*0.05; float ca=cos(ang), sa=sin(ang);',
    '    vec3 q = vec3(n.x*ca + n.z*sa, n.y, -n.x*sa + n.z*ca);',
    '    float sw = fbm(q*2.4 + vec3(0.0, uTime*0.02, 0.0));',
    '    float band = sin(q.y*8.0 + sw*4.0);',
    '    vec3 white = vec3(0.86,0.86,0.94), lav = vec3(0.80,0.72,1.00), vio = vec3(0.47,0.28,0.98), mag = vec3(0.90,0.30,1.00);',
    '    float t = smoothstep(0.62, -0.45, n.y);',
    '    vec3 c = mix(white, lav, smoothstep(0.0, 0.35, t));',
    '    c = mix(c, vio, smoothstep(0.30, 0.70, t));',
    '    c = mix(c, mag, smoothstep(0.65, 1.0, t));',
    '    c += (band*0.05 + (sw-0.5)*0.22) * smoothstep(0.1, 0.7, t);',
    '    c -= (sw-0.5)*0.30*(1.0-t);',
    '    vec3 L = normalize(vec3(-0.35, 0.65, 0.70));',
    '    float diff = dot(n, L);',
    '    c *= 0.56 + 0.44*smoothstep(-0.7, 1.0, diff);',
    '    vec3 R = reflect(-L, n);',
    '    c += vec3(1.0)*pow(max(R.z, 0.0), 24.0)*0.28;',
    '    float fres = pow(1.0 - z, 2.8);',
    '    c += vec3(0.45, 0.38, 1.0)*fres*0.55;',
    '    c += mag*0.30*smoothstep(0.1, 1.0, -n.y)*z;',
    '    c *= 1.0 + 0.25*uPulse;',
    '    rgb = c;',
    '  }',
    '  float edge = smoothstep(1.0, 0.99, d);',
    '  float a = clamp(edge + halo*(1.0-edge), 0.0, 1.0);',
    '  vec3 outRgb = rgb*edge + haloCol*halo*(1.0-edge);',
    '  outRgb += (hash31(vec3(gl_FragCoord.xy, uTime)) - 0.5)/255.0 * a;',
    '  gl_FragColor = vec4(outRgb, a);',
    '}'
  ].join('\n');

  /* ---------------------------------------------------------
     Tiny WebGL layer
     --------------------------------------------------------- */
  function createLayer(canvas, frag, cfg) {
    var gl = null, prog = null, ok = false, loc = {};
    var raf = 0, running = false, last = 0;
    var time = cfg.startTime || 0;
    var fps = cfg.fps || 30;
    var vals = { uTint: 0, uLight: [-0.62, 0.28, 0.74], uPulse: 0, uR: cfg.radius };

    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn('[farix] shader compile failed:', gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }

    function build() {
      var vs = compile(gl.VERTEX_SHADER, 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }');
      var fs = compile(gl.FRAGMENT_SHADER, frag);
      if (!vs || !fs) return false;
      prog = gl.createProgram();
      gl.attachShader(prog, vs); gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn('[farix] shader link failed'); return false; }
      gl.useProgram(prog);
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var a = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(a);
      gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
      ['uRes', 'uTime', 'uR', 'uTint', 'uLight', 'uPulse'].forEach(function (n) { loc[n] = gl.getUniformLocation(prog, n); });
      return true;
    }

    function init() {
      if (ok) return true;
      try {
        var opts = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'default' };
        gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
      } catch (e) { gl = null; }
      if (!gl || !build()) return false;
      canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); ok = false; stop(); canvas.dispatchEvent(new CustomEvent('farix-gl', { detail: false })); }, false);
      canvas.addEventListener('webglcontextrestored', function () { if (build()) { ok = true; resize(); canvas.dispatchEvent(new CustomEvent('farix-gl', { detail: true })); if (wanted) start(); } }, false);
      ok = true;
      resize();
      return true;
    }

    function resize() {
      if (!ok) return;
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      var dpr = Math.min(window.devicePixelRatio || 1, cfg.dprCap || 1.5);
      var bw = Math.round(w * dpr), bh = Math.round(h * dpr);
      var k = Math.min(1, cfg.maxPx / Math.max(bw, bh));
      bw = Math.max(2, Math.round(bw * k)); bh = Math.max(2, Math.round(bh * k));
      if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
      draw();
    }

    function draw() {
      if (!ok || !canvas.width) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(loc.uRes, canvas.width, canvas.height);
      gl.uniform1f(loc.uTime, time);
      gl.uniform1f(loc.uR, vals.uR);
      gl.uniform1f(loc.uTint, vals.uTint);
      gl.uniform3f(loc.uLight, vals.uLight[0], vals.uLight[1], vals.uLight[2]);
      gl.uniform1f(loc.uPulse, vals.uPulse);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    var wanted = false;
    function tick(now) {
      raf = requestAnimationFrame(tick);
      var dt = now - last;
      if (dt < 1000 / fps - 2) return;
      last = now;
      time += Math.min(dt, 100) / 1000;
      if (vals.uPulse > 0) vals.uPulse = Math.max(0, vals.uPulse - dt / 900);
      draw();
    }
    function start() {
      wanted = true;
      if (!ok && !init()) return false;
      if (running) return true;
      running = true; last = performance.now();
      raf = requestAnimationFrame(tick);
      return true;
    }
    function stop() { wanted = false; running = false; cancelAnimationFrame(raf); }
    function stopKeepWanted() { var w = wanted; stop(); wanted = w; }

    return {
      init: init, start: start, stop: stop, resize: resize, draw: draw, vals: vals,
      pause: stopKeepWanted,
      get ok() { return ok; }
    };
  }

  /* ---------------------------------------------------------
     Orbital rings (2D) for the mobile planet.
     Back half is drawn behind the planet, front half over it.
     --------------------------------------------------------- */
  function createRings(back, front) {
    var cb = back.getContext('2d'), cf = front.getContext('2d');
    var W = 0, H = 0, dpr = 1, t = 0, raf = 0, running = false, last = 0;
    var rings = [
      { rx: 1.72, ry: 0.44, rot: -0.36, w: 1.5, beads: [{ a: 0.6, r: 6.5, s: 0.20 }, { a: 3.9, r: 3.6, s: 0.20 }] },
      { rx: 1.40, ry: 0.32, rot: 0.30, w: 1.1, beads: [{ a: 2.2, r: 5, s: -0.28 }] }
    ];

    function resize() {
      var r = back.getBoundingClientRect();
      if (!r.width) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      [back, front].forEach(function (c) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
      draw();
    }

    function bead(c, x, y, r) {
      var g = c.createRadialGradient(x - r * .35, y - r * .4, r * .08, x, y, r);
      g.addColorStop(0, '#ffffff'); g.addColorStop(.2, '#dbe6ff'); g.addColorStop(.55, '#6a79b8'); g.addColorStop(1, '#0d0f2a');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(190,210,255,.5)'; c.lineWidth = 1; c.stroke();
    }

    function draw() {
      if (!W) return;
      [cb, cf].forEach(function (c) { c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H); });
      var cx = W / 2, cy = H / 2, R = W / 4.6, k = R / 100;
      rings.forEach(function (rg) {
        var rx = rg.rx * R, ry = rg.ry * R, rot = rg.rot + Math.sin(t * 0.25 + rg.rx) * 0.02;
        [[cb, Math.PI, Math.PI * 2], [cf, 0, Math.PI]].forEach(function (p) {
          var c = p[0];
          var g = c.createLinearGradient(cx - rx, cy, cx + rx, cy);
          g.addColorStop(0, 'rgba(112,238,255,.15)'); g.addColorStop(.28, 'rgba(112,238,255,.9)');
          g.addColorStop(.55, 'rgba(150,110,255,.95)'); g.addColorStop(.82, 'rgba(217,77,255,.9)'); g.addColorStop(1, 'rgba(217,77,255,.15)');
          c.strokeStyle = g;
          c.globalAlpha = .12; c.lineWidth = rg.w * 5 * Math.max(k, .6);
          c.beginPath(); c.ellipse(cx, cy, rx, ry, rot, p[1], p[2]); c.stroke();
          c.globalAlpha = 1; c.lineWidth = rg.w * Math.max(k, .8);
          c.beginPath(); c.ellipse(cx, cy, rx, ry, rot, p[1], p[2]); c.stroke();
        });
        rg.beads.forEach(function (b) {
          var th = b.a + t * b.s * 2;
          var lx = rx * Math.cos(th), ly = ry * Math.sin(th);
          var x = cx + lx * Math.cos(rot) - ly * Math.sin(rot);
          var y = cy + lx * Math.sin(rot) + ly * Math.cos(rot);
          bead(Math.sin(th) > 0 ? cf : cb, x, y, b.r * k);
        });
      });
    }

    function tick(now) {
      raf = requestAnimationFrame(tick);
      var dt = now - last;
      if (dt < 32) return;
      last = now; t += Math.min(dt, 100) / 1000;
      draw();
    }
    function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(tick); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    return { start: start, stop: stop, resize: resize, draw: draw };
  }

  /* ---------------------------------------------------------
     Wire it up
     --------------------------------------------------------- */
  var moonEl = $('#moon'), planetEl = $('#planet');
  var moon = createLayer($('#moonCanvas'), MOON_FRAG, { radius: 1 / 3, fps: 30, maxPx: 1280, dprCap: 1.25, startTime: 9 });
  var planet = createLayer($('#planetCanvas'), PLANET_FRAG, { radius: 1 / 4.6, fps: 30, maxPx: 900, dprCap: 1.5, startTime: 3 });
  var rings = createRings($('#ringsBack'), $('#ringsFront'));

  var heroVisible = true, tabVisible = !doc.hidden;

  function activate(layer, el, rg) {
    var ok = layer.init();
    el.classList.toggle('gl-ok', ok);
    scene.classList.toggle('no-webgl', !ok);
    if (rg) rg.resize();
    if (ok) layer.resize();
    var live = heroVisible && tabVisible && !mqReduce.matches;
    if (ok && live) layer.start(); else layer.pause();
    if (rg) { if (live) rg.start(); else { rg.stop(); rg.draw(); } }
  }

  function sync() {
    moon.vals.uTint = mqTablet.matches ? 0.55 : 0;
    if (mqMobile.matches) {
      moon.pause();
      activate(planet, planetEl, rings);
    } else {
      planet.pause(); rings.stop();
      activate(moon, moonEl, null);
    }
  }

  [mqMobile, mqTablet, mqReduce].forEach(function (mq) {
    if (mq.addEventListener) mq.addEventListener('change', sync); else mq.addListener(sync);
  });
  doc.addEventListener('visibilitychange', function () { tabVisible = !doc.hidden; sync(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; sync(); }, { threshold: 0.02 }).observe(hero);
  }
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function () { moon.resize(); planet.resize(); rings.resize(); });
    ro.observe($('#moonCanvas')); ro.observe($('#planetCanvas'));
  } else {
    addEventListener('resize', function () { moon.resize(); planet.resize(); rings.resize(); });
  }
  [$('#moonCanvas'), $('#planetCanvas')].forEach(function (c) {
    c.addEventListener('farix-gl', function (e) { (c.id === 'moonCanvas' ? moonEl : planetEl).classList.toggle('gl-ok', e.detail); });
  });

  sync();
  // draw a first frame immediately, even before the first rAF tick
  if (mqMobile.matches) { planet.draw(); rings.draw(); } else { moon.draw(); }

  /* ---------------------------------------------------------
     Pointer: parallax, moon light, coordinates (desktop)
     Touch: ripples + planet pulse (mobile)
     --------------------------------------------------------- */
  var coordEl = $('#coord');
  var tx = 0, ty = 0, cx = 0, cy = 0, pTick = 0, coordT = 0;

  function frame(now) {
    pTick = 0;
    cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07;
    scene.style.setProperty('--px', cx.toFixed(4));
    scene.style.setProperty('--py', cy.toFixed(4));
    moon.vals.uLight[0] = -0.62 + cx * 0.6;
    moon.vals.uLight[1] = 0.28 - cy * 0.5;
    if (coordEl && now - coordT > 70) {
      coordT = now;
      var lat = -cy * 180, lon = cx * 360;
      coordEl.textContent = 'COORD // ' + (lat < 0 ? '-' : '+') + Math.abs(lat).toFixed(4).padStart(7, '0') + '° ' + (lat < 0 ? 'S' : 'N') +
        ' · ' + (lon < 0 ? '-' : '+') + Math.abs(lon).toFixed(4).padStart(8, '0') + '° ' + (lon < 0 ? 'W' : 'E');
    }
    if (Math.abs(tx - cx) > 0.0004 || Math.abs(ty - cy) > 0.0004) pTick = requestAnimationFrame(frame);
  }
  function wake() { if (!pTick) pTick = requestAnimationFrame(frame); }

  hero.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch' || mqReduce.matches || mqMobile.matches) return;
    var r = hero.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width - 0.5;
    ty = (e.clientY - r.top) / r.height - 0.5;
    wake();
  }, { passive: true });
  hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; wake(); });

  // tap feedback
  hero.addEventListener('pointerdown', function (e) {
    if (e.target.closest('button, a')) return;
    var r = hero.getBoundingClientRect();
    if (!mqReduce.matches) {
      var d = doc.createElement('span');
      d.className = 'ripple';
      d.style.left = (e.clientX - r.left) + 'px';
      d.style.top = (e.clientY - r.top) + 'px';
      scene.appendChild(d);
      setTimeout(function () { d.remove(); }, 950);
    }
    planet.vals.uPulse = 1;
    moon.vals.uPulse = 1;
    if (mqReduce.matches) { planet.draw(); }
    if (navigator.vibrate && e.pointerType === 'touch') { try { navigator.vibrate(8); } catch (_) {} }
  });
})();

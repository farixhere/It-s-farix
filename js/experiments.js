/* ============================================================
   FARIX — experiments.js
   Five small, purposeful toys for the Experiment Lab.
   · Each one only runs while it is on screen and the tab is visible.
   · Each one works with touch (no hover needed).
   · With "reduce motion" on, they draw still frames and only
     update when you interact.
   Add your own: write a function that takes a stage element and
   returns { frame(dt), poke() }, then register it in REGISTRY.
   ============================================================ */
(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var TAU = Math.PI * 2;
  function rand(a, b) { return a + Math.random() * (b - a); }

  /* canvas that follows its stage's size */
  function makeCanvas(stage) {
    var c = document.createElement('canvas');
    stage.appendChild(c);
    var S = { c: c, ctx: c.getContext('2d'), w: 0, h: 0, dpr: 1, onresize: null };
    function size() {
      var r = stage.getBoundingClientRect();
      if (!r.width) return;
      S.dpr = Math.min(window.devicePixelRatio || 1, 2);
      S.w = r.width; S.h = r.height;
      c.width = Math.round(S.w * S.dpr); c.height = Math.round(S.h * S.dpr);
      S.ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
      if (S.onresize) S.onresize();
    }
    if ('ResizeObserver' in window) new ResizeObserver(size).observe(stage); else addEventListener('resize', size);
    size();
    return S;
  }

  function pointerIn(stage, S, cb) {
    function pos(e) { var r = stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    stage.addEventListener('pointermove', function (e) { var p = pos(e); cb('move', p.x, p.y, e); });
    stage.addEventListener('pointerdown', function (e) { var p = pos(e); cb('down', p.x, p.y, e); });
    stage.addEventListener('pointerup', function (e) { var p = pos(e); cb('up', p.x, p.y, e); });
    stage.addEventListener('pointerleave', function (e) { cb('leave', 0, 0, e); });
    stage.addEventListener('pointercancel', function (e) { cb('leave', 0, 0, e); });
  }

  /* ---------- 1. Planetary system ---------- */
  function orbits(stage) {
    var S = makeCanvas(stage), ctx = S.ctx;
    var hues = [190, 215, 265, 295, 330];
    var bodies = [
      { r: .17, v: 1.10, s: 3.2, h: 190 }, { r: .29, v: .72, s: 4.6, h: 265 },
      { r: .42, v: .46, s: 5.6, h: 300 }, { r: .56, v: .30, s: 3.6, h: 215 }
    ].map(function (b) { b.a = rand(0, TAU); return b; });
    function draw(dt) {
      ctx.fillStyle = 'rgba(7,6,12,' + (reduce.matches ? 1 : .22) + ')';
      ctx.fillRect(0, 0, S.w, S.h);
      var cx = S.w / 2, cy = S.h / 2, m = Math.min(S.w, S.h) * .5;
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, m * .22);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(160,240,255,.9)'); g.addColorStop(1, 'rgba(112,238,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, m * .22, 0, TAU); ctx.fill();
      bodies.forEach(function (b) {
        b.a += b.v * dt;
        ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(cx, cy, b.r * m * 1.7, b.r * m * 1.7 * .62, 0, 0, TAU); ctx.stroke();
        var x = cx + Math.cos(b.a) * b.r * m * 1.7, y = cy + Math.sin(b.a) * b.r * m * 1.7 * .62;
        ctx.fillStyle = 'hsl(' + b.h + ' 90% 70%)';
        ctx.shadowColor = 'hsl(' + b.h + ' 100% 65%)'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(x, y, b.s, 0, TAU); ctx.fill();
        ctx.shadowBlur = 0;
      });
    }
    pointerIn(stage, S, function (t) {
      if (t !== 'down') return;
      bodies.push({ r: rand(.2, .62), v: rand(.25, 1), s: rand(2.5, 5.5), h: hues[Math.floor(Math.random() * hues.length)], a: rand(0, TAU) });
      if (bodies.length > 9) bodies.splice(0, 1);
      api.poke();
    });
    var api = { frame: draw, poke: function () { draw(0); }, reset: function () { ctx.fillStyle = '#07060c'; ctx.fillRect(0, 0, S.w, S.h); } };
    S.onresize = api.reset;
    return api;
  }

  /* ---------- 2. Particle field ---------- */
  function field(stage) {
    var S = makeCanvas(stage), ctx = S.ctx, P = [], ptr = { x: -999, y: -999, on: false };
    function seed() {
      var n = Math.round(Math.min(160, Math.max(60, S.w * S.h / 1500)));
      P = []; for (var i = 0; i < n; i++) { var x = rand(0, S.w), y = rand(0, S.h); P.push({ hx: x, hy: y, x: x, y: y, vx: 0, vy: 0, r: rand(.8, 2.1), h: rand(185, 300) }); }
    }
    S.onresize = seed;
    function draw(dt) {
      ctx.clearRect(0, 0, S.w, S.h);
      var rad = Math.min(110, S.w * .28);
      for (var i = 0; i < P.length; i++) {
        var p = P[i];
        if (!reduce.matches) {
          var dx = p.x - ptr.x, dy = p.y - ptr.y, d = Math.sqrt(dx * dx + dy * dy);
          if (ptr.on && d < rad && d > 0.1) { var f = (1 - d / rad) * 900 * dt; p.vx += dx / d * f; p.vy += dy / d * f; }
          p.vx += (p.hx - p.x) * 6 * dt; p.vy += (p.hy - p.y) * 6 * dt;
          p.vx *= .9; p.vy *= .9; p.x += p.vx * dt * 8; p.y += p.vy * dt * 8;
        } else if (ptr.on) {
          var ddx = p.hx - ptr.x, ddy = p.hy - ptr.y, dd = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dd < rad && dd > .1) { p.x = p.hx + ddx / dd * (rad - dd) * .6; p.y = p.hy + ddy / dd * (rad - dd) * .6; } else { p.x = p.hx; p.y = p.hy; }
        }
        ctx.fillStyle = 'hsla(' + p.h + ',90%,72%,.85)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
      }
      if (ptr.on) {
        var g = ctx.createRadialGradient(ptr.x, ptr.y, 0, ptr.x, ptr.y, rad);
        g.addColorStop(0, 'rgba(112,238,255,.14)'); g.addColorStop(1, 'rgba(112,238,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ptr.x, ptr.y, rad, 0, TAU); ctx.fill();
      }
    }
    pointerIn(stage, S, function (t, x, y) {
      if (t === 'leave' || t === 'up') { if (t === 'leave' || ptr.touch) { ptr.on = false; } api.poke(); return; }
      ptr.x = x; ptr.y = y; ptr.on = true; api.poke();
    });
    seed();
    var api = { frame: draw, poke: function () { draw(1 / 60); } };
    return api;
  }

  /* ---------- 3. Lit object ---------- */
  function lit(stage) {
    stage.innerHTML = '<div class="lit-wrap" data-mat="glossy"><div class="sphere"></div><button type="button" class="lit-btn">Material: glossy</button></div>';
    var wrap = stage.querySelector('.lit-wrap'), btn = stage.querySelector('.lit-btn');
    var mats = ['glossy', 'matte', 'glow'], mi = 0;
    function set(x, y) { wrap.style.setProperty('--lx', x + '%'); wrap.style.setProperty('--ly', y + '%'); }
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      set(Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)), Math.max(0, Math.min(100, (e.clientY - r.top) / r.height * 100)));
    });
    stage.addEventListener('pointerdown', function (e) {
      if (e.target === btn) return;
      var r = stage.getBoundingClientRect();
      set((e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100);
    });
    btn.addEventListener('click', function () {
      mi = (mi + 1) % mats.length; wrap.dataset.mat = mats[mi]; btn.textContent = 'Material: ' + mats[mi];
    });
    var t = 0;
    return {
      frame: function (dt) { if (reduce.matches) return; t += dt; if (!stage.matches(':hover')) set(32 + Math.cos(t * .6) * 14, 28 + Math.sin(t * .5) * 10); },
      poke: function () {}
    };
  }

  /* ---------- 4. Typographic gravity ---------- */
  function type(stage) {
    var word = 'FARIX';
    stage.innerHTML = '<div class="type-wrap" aria-label="' + word + '"></div>';
    var wrap = stage.querySelector('.type-wrap'), L = [];
    word.split('').forEach(function (ch) { var s = document.createElement('span'); s.textContent = ch; s.setAttribute('aria-hidden', 'true'); wrap.appendChild(s); L.push(s); });
    var ptr = { x: null }, t = 0;
    function apply() {
      L.forEach(function (s, i) {
        var r = s.getBoundingClientRect(), sr = stage.getBoundingClientRect();
        var cx = r.left + r.width / 2 - sr.left;
        var px = ptr.x;
        if (px === null) { // idle wave
          var w = reduce.matches ? 0 : Math.sin(t * 1.6 + i * .9);
          s.style.transform = 'translateY(' + (w * 5).toFixed(2) + 'px)';
          s.style.color = '';
          return;
        }
        var d = Math.abs(px - cx), k = Math.max(0, 1 - d / 120);
        s.style.transform = 'translateY(' + (-k * 16).toFixed(1) + 'px) scale(' + (1 + k * .5).toFixed(3) + ')';
        s.style.color = k > .15 ? 'var(--accent)' : '';
      });
    }
    function setX(e) { var r = stage.getBoundingClientRect(); ptr.x = e.clientX - r.left; apply(); }
    stage.addEventListener('pointermove', setX);
    stage.addEventListener('pointerdown', setX);
    stage.addEventListener('pointerleave', function () { ptr.x = null; apply(); });
    stage.addEventListener('pointercancel', function () { ptr.x = null; apply(); });
    return { frame: function (dt) { t += dt; if (ptr.x === null) apply(); }, poke: apply };
  }

  /* ---------- 5. Miniature cosmos ---------- */
  function cosmos(stage) {
    var S = makeCanvas(stage), ctx = S.ctx;
    var layers = [{ n: 70, z: .25, r: 1 }, { n: 42, z: .55, r: 1.5 }, { n: 22, z: 1, r: 2.3 }];
    var stars = [];
    layers.forEach(function (L, li) { for (var i = 0; i < L.n; i++) stars.push({ x: Math.random(), y: Math.random(), z: L.z, r: L.r * rand(.7, 1.2), h: li === 2 ? rand(180, 320) : 210, tw: rand(0, TAU) }); });
    var off = { x: 0, y: 0 }, vel = { x: 8, y: 0 }, drag = null, t = 0;
    function draw(dt) {
      t += dt;
      if (!drag) { off.x += vel.x * dt; off.y += vel.y * dt; vel.x += (8 - vel.x) * Math.min(1, dt * .6); vel.y *= (1 - Math.min(1, dt * 1.2)); }
      var g = ctx.createRadialGradient(S.w * .5 - off.x * .05, S.h * .6, 0, S.w * .5, S.h * .6, S.w * .7);
      g.addColorStop(0, 'rgba(60,40,140,.35)'); g.addColorStop(1, 'rgba(7,6,12,1)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, S.w, S.h);
      stars.forEach(function (s) {
        var x = ((s.x * S.w - off.x * s.z) % S.w + S.w) % S.w, y = ((s.y * S.h - off.y * s.z) % S.h + S.h) % S.h;
        var a = .5 + .5 * Math.sin(t * 1.5 + s.tw) * (reduce.matches ? 0 : 1);
        ctx.fillStyle = 'hsla(' + s.h + ',85%,' + (70 + s.z * 20) + '%,' + (.35 + .6 * a * s.z).toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(x, y, s.r, 0, TAU); ctx.fill();
      });
    }
    pointerIn(stage, S, function (type, x, y) {
      if (type === 'down') { drag = { x: x, y: y }; vel.x = 0; vel.y = 0; }
      else if (type === 'move' && drag) { var dx = x - drag.x, dy = y - drag.y; off.x -= dx; off.y -= dy; vel.x = -dx * 30; vel.y = -dy * 30; drag.x = x; drag.y = y; api.poke(); }
      else if (type === 'up' || type === 'leave') drag = null;
    });
    var api = { frame: draw, poke: function () { draw(0); } };
    return api;
  }

  var REGISTRY = { orbits: orbits, field: field, lit: lit, type: type, cosmos: cosmos };

  /* ---------- lifecycle: lazy init, run only while visible ---------- */
  function mountAll() {
    var stages = document.querySelectorAll('[data-exp]');
    stages.forEach(function (stage) {
      var make = REGISTRY[stage.dataset.exp];
      if (!make) return;
      var api = null, visible = false, raf = 0, last = 0;
      function loop(now) {
        raf = requestAnimationFrame(loop);
        var dt = Math.min((now - last) / 1000, .05); last = now;
        api.frame(dt);
      }
      function update() {
        var go = visible && !document.hidden && !reduce.matches;
        if (go && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
        if (!go && raf) { cancelAnimationFrame(raf); raf = 0; }
      }
      function boot() {
        if (api) return;
        api = make(stage);
        if (reduce.matches) api.poke();
      }
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (e) {
          visible = e[0].isIntersecting;
          if (visible) { boot(); if (reduce.matches) api.poke(); }
          update();
        }, { threshold: .05, rootMargin: '80px' }).observe(stage);
      } else { visible = true; boot(); update(); }
      document.addEventListener('visibilitychange', update);
      if (reduce.addEventListener) reduce.addEventListener('change', function () { if (api) { update(); api.poke(); } });
    });
  }

  window.FARIX_EXPERIMENTS = { mountAll: mountAll, register: function (id, fn) { REGISTRY[id] = fn; } };
})();

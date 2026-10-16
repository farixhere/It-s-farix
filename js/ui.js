/* ============================================================
   FARIX — ui.js
   Content rendering, the navigation portal ("Explore"),
   project cards + detail view, reveals, contact actions.
   ============================================================ */
(function () {
  'use strict';

  var C = window.FARIX_CONTENT || {};
  var doc = document, root = doc.documentElement;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = matchMedia('(hover: hover) and (pointer: fine)');

  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function get(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }

  /* ---------- 1. bind simple text ---------- */
  $$('[data-bind]').forEach(function (n) {
    var v = get(C, n.getAttribute('data-bind'));
    if (typeof v === 'string' && v) n.textContent = v;
  });

  /* ---------- 2. about signals ---------- */
  var sig = $('#signals');
  ((C.about && C.about.signals) || []).forEach(function (s) {
    var li = el('li', 'reveal');
    li.appendChild(el('b', '', s.label));
    li.appendChild(el('span', '', s.text));
    sig.appendChild(li);
  });

  /* ---------- 3. projects ---------- */
  var list = $('#projectList'), dots = $('#projectDots');
  var projects = C.projects || [];
  function paintCover(node, p) {
    node.style.setProperty('--c1', p.colors[0]);
    node.style.setProperty('--c2', p.colors[1]);
    node.style.setProperty('--c3', p.colors[2]);
  }
  projects.forEach(function (p, i) {
    var cell = el('div', 'pc reveal'); cell.setAttribute('role', 'listitem');
    var card = el('article', 'project-card'); card.dataset.index = i;
    var cover = el('div', 'cover'); paintCover(cover, p);
    cover.appendChild(el('div', 'pl')); cover.appendChild(el('div', 'pl-ring'));
    card.appendChild(cover);
    card.appendChild(el('p', 'cat', p.category));
    card.appendChild(el('h3', '', p.title));
    card.appendChild(el('p', 'blurb', p.blurb));
    var b = el('button', 'open-btn', 'View details');
    b.type = 'button';
    var sr = el('span', 'sr-only', ' of ' + p.title); b.appendChild(sr);
    card.appendChild(b);
    cell.appendChild(card); list.appendChild(cell);
    dots.appendChild(el('i', i === 0 ? 'on' : ''));
    card.addEventListener('click', function () { openProject(i, b); });
  });

  // pointer-driven glow + tilt (mouse only)
  if (finePointer.matches && !reduce.matches) {
    $$('.project-card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (x * 100) + '%'); card.style.setProperty('--my', (y * 100) + '%');
        card.style.transform = 'perspective(900px) rotateX(' + ((.5 - y) * 7).toFixed(2) + 'deg) rotateY(' + ((x - .5) * 9).toFixed(2) + 'deg)';
      });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; });
    });
  }

  // carousel dots (mobile)
  var dotEls = $$('i', dots);
  if (list && dotEls.length) {
    var dotTick = 0;
    list.addEventListener('scroll', function () {
      if (dotTick) return;
      dotTick = requestAnimationFrame(function () {
        dotTick = 0;
        var cells = $$('.pc', list), mid = list.scrollLeft + list.clientWidth / 2, best = 0, bd = 1e9;
        cells.forEach(function (c, i) { var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } });
        dotEls.forEach(function (d, i) { d.classList.toggle('on', i === best); });
      });
    }, { passive: true });
  }

  /* ---------- 4. project dialog ---------- */
  var dlg = $('#projectDialog'), current = 0;
  function fillDialog(i) {
    var p = projects[i]; if (!p) return;
    current = i;
    paintCover($('#pdCover'), p);
    $('#pdCat').textContent = p.category;
    $('#pdTitle').textContent = p.title;
    $('#pdText').textContent = p.details || p.blurb;
    var tags = $('#pdTags'); tags.innerHTML = '';
    (p.tags || []).forEach(function (t) { tags.appendChild(el('li', '', t)); });
    $('#pdNote').hidden = !p.placeholder;
    var link = $('#pdLink');
    if (p.link) { link.href = p.link; link.hidden = false; } else { link.hidden = true; }
  }
  function openProject(i, from) {
    fillDialog(i);
    if (dlg.showModal) { if (!dlg.open) dlg.showModal(); } else { dlg.setAttribute('open', ''); }
    dlg._from = from || null;
  }
  $('#pdClose').addEventListener('click', function () { dlg.close ? dlg.close() : dlg.removeAttribute('open'); });
  $('#pdNext').addEventListener('click', function () { fillDialog((current + 1) % projects.length); dlg.scrollTop = 0; });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', function () { if (dlg._from && dlg._from.focus) dlg._from.focus(); });

  /* ---------- 5. experiments ---------- */
  var lab = $('#labGrid');
  (C.experiments || []).forEach(function (x) {
    var card = el('article', 'lab-card reveal');
    var stage = el('div', 'lab-stage'); stage.dataset.exp = x.id;
    stage.setAttribute('role', 'group'); stage.setAttribute('aria-label', x.title + ' (interactive)');
    card.appendChild(stage);
    card.appendChild(el('h3', '', x.title));
    card.appendChild(el('p', '', x.purpose));
    card.appendChild(el('p', 'hint', x.hint));
    lab.appendChild(card);
  });
  if (window.FARIX_EXPERIMENTS) window.FARIX_EXPERIMENTS.mountAll();

  /* ---------- 6. skills ---------- */
  var sg = $('#skillGrid');
  (C.skills || []).forEach(function (s, i) {
    var li = el('li', 'reveal');
    li.appendChild(el('span', 'no', String(i + 1).padStart(2, '0')));
    li.appendChild(el('h3', '', s.name));
    li.appendChild(el('p', '', s.text));
    sg.appendChild(li);
  });

  /* ---------- 7. contact ---------- */
  var ca = $('#contactActions'), ct = C.contact || {};
  function action(label, href, ghost, missing) {
    var a = el('a', 'btn' + (ghost ? ' ghost' : ''));
    a.appendChild(doc.createTextNode(label));
    if (href) {
      a.href = href;
      if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    } else {
      a.setAttribute('aria-disabled', 'true'); a.setAttribute('role', 'link'); a.tabIndex = 0;
      a.appendChild(el('small', '', missing));
      a.addEventListener('click', function (e) { e.preventDefault(); });
    }
    ca.appendChild(a); return a;
  }
  action('Email Farix', ct.email ? 'mailto:' + ct.email : '', false, '(not added yet)');
  action('GitHub', ct.github, true, '(not added yet)');
  action('LinkedIn', ct.linkedin, true, '(not added yet)');
  var back = el('button', 'btn ghost', 'Return to the beginning ↑'); back.type = 'button';
  back.addEventListener('click', function () { goTo('#hero'); });
  ca.appendChild(back);

  /* ---------- 8. reveal on scroll ---------- */
  var rv = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce.matches) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (n) { io.observe(n); });
  } else { rv.forEach(function (n) { n.classList.add('in'); }); }

  /* ---------- 9. top bar state ---------- */
  var bar = $('#topbar');
  function onScroll() { bar.classList.toggle('scrolled', window.scrollY > window.innerHeight * .6); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- 10. entrance ---------- */
  var hero = $('#hero');
  requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add('is-ready'); root.classList.add('ready'); }); });

  /* ---------- 11. navigation portal ---------- */
  var portal = $('#portal'), warp = $('#warp'), wctx = warp.getContext('2d');
  var openBtn1 = $('#explore'), openBtn2 = $('#menuBtn'), closeBtn = $('#portalClose');
  var isOpen = false, lastTrigger = null, warpRaf = 0;
  var bgEls = [$('main'), $('#topbar'), $('.site-footer')];

  function runWarp(ox, oy, dur) {
    cancelAnimationFrame(warpRaf);
    if (reduce.matches) { wctx.clearRect(0, 0, warp.width, warp.height); return; }
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    warp.width = Math.round(innerWidth * dpr); warp.height = Math.round(innerHeight * dpr);
    wctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var N = innerWidth < 768 ? 90 : 170, S = [];
    for (var i = 0; i < N; i++) S.push({ a: Math.random() * Math.PI * 2, r: Math.random() * 30, v: 120 + Math.random() * 380 });
    var t0 = performance.now(), maxR = Math.hypot(innerWidth, innerHeight);
    (function f(now) {
      var k = (now - t0) / dur;
      wctx.clearRect(0, 0, innerWidth, innerHeight);
      if (k >= 1) return;
      var ease = k * k, fade = k < .7 ? 1 : (1 - k) / .3;
      S.forEach(function (s) {
        var r0 = s.r + s.v * ease * 2.6, r1 = r0 + 8 + s.v * ease * .5;
        if (r0 > maxR) return;
        wctx.strokeStyle = 'rgba(190,240,255,' + (0.55 * fade).toFixed(2) + ')'; wctx.lineWidth = 1.2;
        wctx.beginPath();
        wctx.moveTo(ox + Math.cos(s.a) * r0, oy + Math.sin(s.a) * r0);
        wctx.lineTo(ox + Math.cos(s.a) * r1, oy + Math.sin(s.a) * r1);
        wctx.stroke();
      });
      warpRaf = requestAnimationFrame(f);
    })(performance.now());
  }

  function openPortal(trigger) {
    if (isOpen) return;
    isOpen = true; lastTrigger = trigger;
    var r = trigger.getBoundingClientRect();
    var ox = r.left + r.width / 2, oy = r.top + r.height / 2;
    portal.style.setProperty('--ox', ox + 'px'); portal.style.setProperty('--oy', oy + 'px');
    portal.removeAttribute('inert');
    bgEls.forEach(function (n) { if (n) n.setAttribute('inert', ''); });
    // the portal itself stays interactive: the top bar is hidden under it, but keep the menu button focus target correct
    portal.classList.add('open');
    openBtn2.setAttribute('aria-expanded', 'true');
    runWarp(ox, oy, 1000);
    setTimeout(function () { var first = $('.portal-nav a', portal); if (first) first.focus({ preventScroll: true }); }, reduce.matches ? 0 : 450);
    doc.body.style.overflow = 'hidden';
  }
  function closePortal(after) {
    if (!isOpen) return;
    isOpen = false;
    portal.classList.remove('open');
    portal.setAttribute('inert', '');
    bgEls.forEach(function (n) { if (n) n.removeAttribute('inert'); });
    openBtn2.setAttribute('aria-expanded', 'false');
    doc.body.style.overflow = '';
    if (after) after();
    else if (lastTrigger && lastTrigger.focus) setTimeout(function () { lastTrigger.focus({ preventScroll: true }); }, 60);
  }
  function goTo(hash) {
    var t = $(hash); if (!t) return;
    var prev = root.style.scrollBehavior; root.style.scrollBehavior = 'auto';
    t.scrollIntoView({ block: 'start' });
    root.style.scrollBehavior = prev;
    if (history.replaceState) history.replaceState(null, '', hash === '#hero' ? location.pathname + location.search : hash);
    t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true });
  }

  openBtn1.addEventListener('click', function () { openPortal(openBtn1); });
  openBtn2.addEventListener('click', function () { openPortal(openBtn2); });
  closeBtn.addEventListener('click', function () { closePortal(); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen) { e.preventDefault(); closePortal(); } });
  $$('[data-nav]', portal).forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var h = a.getAttribute('href');
      // jump while the overlay still covers the page, then reveal the destination
      closePortal(function () { goTo(h); });
    });
  });

  // regular in-page anchors (brand, "Get in touch")
  $$('a[href^="#"]').forEach(function (a) {
    if (a.hasAttribute('data-nav') || a.classList.contains('skip-link')) return;
    a.addEventListener('click', function (e) {
      var h = a.getAttribute('href'); if (h.length < 2) return;
      e.preventDefault(); var t = $(h); if (!t) return;
      t.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
      if (history.replaceState) history.replaceState(null, '', h === '#hero' ? location.pathname + location.search : h);
    });
  });

  // deep links (#projects etc.)
  if (location.hash && $(location.hash)) setTimeout(function () { $(location.hash).scrollIntoView({ block: 'start' }); }, 50);
})();

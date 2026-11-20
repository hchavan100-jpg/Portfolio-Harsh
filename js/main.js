/* =========================================================
   Harsh — Portfolio interactions
   ========================================================= */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const html = document.documentElement;

  // If the animation libs failed to load, show the page as-is.
  if (!window.gsap || !window.ScrollTrigger) {
    $('.loader')?.remove();
    $$('.draw').forEach(p => (p.style.strokeDashoffset = 0));
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  let navScrolling = false, navTimer; // anchor jumps glide past the project stack's paging
  const scrollTo = target => {
    if (!lenis) return $(target)?.scrollIntoView({ behavior: 'smooth' });
    letGo(); // release the project stack so the jump isn't blocked
    navScrolling = true;
    clearTimeout(navTimer);
    // onComplete is skipped when the user interrupts, so also clear on a timer
    navTimer = setTimeout(() => { navScrolling = false; }, 1500);
    lenis.scrollTo(target, { duration: 1.4, onComplete: () => { navScrolling = false; } });
  };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2 || !$(id)) return;
    e.preventDefault();
    scrollTo(id === '#top' ? 0 : id);
  }));
  /* ---------- Case study viewer ---------- */
  const caseEl = $('.case'), caseScroll = $('.case__scroll');
  const cards = $$('.project');
  let caseIdx = -1, caseOpener = null;
  const nextIdx = i => { for (let k = 1; k <= cards.length; k++) { const j = (i + k) % cards.length; if (!cards[j].hidden) return j; } return i; };
  function openCase(i) {
    const p = cards[i], [slug, count] = p.dataset.gallery.split(':');
    const title = $('.project__title', p).textContent;
    caseIdx = i;
    caseEl.style.setProperty('--p-bg', p.style.getPropertyValue('--p-bg'));
    caseEl.style.setProperty('--p-fg', p.style.getPropertyValue('--p-fg'));
    $('.case__num', caseEl).textContent = `${$('.project__num', p).textContent} — ${$('.project__tags', p).textContent}`;
    $('.case__title', caseEl).textContent = title;
    $('.case__desc', caseEl).textContent = $('.project__desc', p).textContent;
    $('.case__imgs', caseEl).innerHTML = Array.from({ length: +count }, (_, n) =>
      `<img src="assets/work/${slug}/${String(n + 1).padStart(2, '0')}.webp" alt="${title} — image ${n + 1}" loading="${n ? 'lazy' : 'eager'}" decoding="async" />`).join('');
    $('.case__next b', caseEl).textContent = $('.project__title', cards[nextIdx(i)]).textContent;
    caseScroll.scrollTop = 0;
    if (caseEl.hidden) {
      caseEl.hidden = false;
      lenis?.stop();
      document.documentElement.classList.add('is-locked');
      requestAnimationFrame(() => caseEl.classList.add('is-open'));
      $('.case__close', caseEl).focus({ preventScroll: true });
    }
  }
  function closeCase() {
    if (caseEl.hidden) return;
    caseEl.classList.remove('is-open');
    document.documentElement.classList.remove('is-locked');
    if (!holding) lenis?.start();
    setTimeout(() => { caseEl.hidden = true; $('.case__imgs', caseEl).innerHTML = ''; }, reduceMotion ? 0 : 600);
    caseOpener?.focus({ preventScroll: true });
  }
  $$('.project__link').forEach((a, i) => a.addEventListener('click', e => {
    e.preventDefault();
    caseOpener = a;
    openCase(i);
  }));
  $('.case__close').addEventListener('click', closeCase);
  $('.case__next').addEventListener('click', () => openCase(nextIdx(caseIdx)));
  addEventListener('keydown', e => { if (e.key === 'Escape') closeCase(); });

  /* ---------- Stroke draw-on prep ---------- */
  $$('.draw').forEach(p => p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 1));

  /* ---------- Split section titles into masked lines ---------- */
  $$('[data-split]').forEach(el => {
    el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i)
      .map(l => `<span class="line"><span class="line__inner">${l.trim()}</span></span>`).join('');
  });

  /* ---------- Toast ---------- */
  const toastEl = $('.toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2600);
  }

  /* ---------- Preloader → intro ---------- */
  html.classList.add('is-loading');
  lenis?.stop();
  const quips = ['suiting up', 'ironing the cape', 'sharpening pencils', 'untangling béziers', 'kerning, obsessively', 'charging superpowers'];
  const quipEl = $('.loader__quip span');
  let q = 0;
  const quipTimer = setInterval(() => {
    q = (q + 1) % quips.length;
    gsap.to(quipEl, { yPercent: -100, opacity: 0, duration: .25, onComplete: () => {
      quipEl.textContent = quips[q];
      gsap.fromTo(quipEl, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .3 });
    } });
  }, 520);

  const counter = { v: 0 };
  const numEl = $('.loader__num');
  const ready = Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise(r => setTimeout(r, reduceMotion ? 0 : 1900)),
  ]);
  const countTween = gsap.to(counter, {
    v: 92, duration: reduceMotion ? 0 : 1.9, ease: 'power2.out',
    onUpdate: () => (numEl.textContent = String(Math.round(counter.v)).padStart(3, '0')),
  });

  ready.then(() => {
    countTween.kill();
    clearInterval(quipTimer);
    gsap.timeline()
      .to(counter, { v: 100, duration: .35, ease: 'power1.out', onUpdate: () => (numEl.textContent = String(Math.round(counter.v)).padStart(3, '0')) })
      .to('.loader__inner', { scale: .9, opacity: 0, duration: .4, ease: 'power2.in' })
      .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '-=.1')
      .add(() => {
        $('.loader').remove();
        html.classList.remove('is-loading');
        lenis?.start();
        ScrollTrigger.refresh();
      })
      .add(intro(), '-=.65');
  });

  function intro() {
    const tl = gsap.timeline();
    tl.from('.hero__title .line__inner', { yPercent: 110, rotate: 4, duration: 1.3, ease: 'expo.out', stagger: .1 })
      .from('.hero__burst', { scale: .2, opacity: 0, duration: 1.6, ease: 'expo.out' }, .25)
      .from('.hero__face', { scale: 0, rotate: -40, duration: 1.2, ease: 'elastic.out(1, .55)' }, .35)
      .from('.hero__meta > *', { y: 20, opacity: 0, duration: .8, ease: 'power3.out', stagger: .08 }, .2)
      .from('.hero__bottom > *', { y: 30, opacity: 0, duration: .9, ease: 'power3.out', stagger: .1 }, .5)
      .from('.nav > *', { y: -30, opacity: 0, duration: .8, ease: 'power3.out', stagger: .08 }, .3)
      .to('.hero .draw', { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: .15 }, .9)
      .from('.hero__note span', { opacity: 0, x: -10, duration: .5 }, 1.5)
      // lines only need their mask while sliding in; after that the face + speech bubble may overflow
      .add(() => $$('.hero__title .line').forEach(l => (l.style.overflow = 'visible')), 1.5);
    return tl;
  }

  /* ---------- Clock ---------- */
  const clock = $('[data-clock]');
  const tick = () => (clock.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date()));
  tick(); setInterval(tick, 15000);

  /* ---------- Nav: hide on scroll down ---------- */
  const nav = $('.nav');
  let lastY = 0;
  const onScroll = y => {
    nav.classList.toggle('is-scrolled', y > 40);
    nav.classList.toggle('is-hidden', y > 300 && y > lastY);
    lastY = y;
  };
  lenis ? lenis.on('scroll', e => onScroll(e.scroll)) : addEventListener('scroll', () => onScroll(scrollY), { passive: true });

  /* ---------- Cursor ---------- */
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });

  if (finePointer) {
    const cursor = $('.cursor');
    const dot = $('.cursor__dot'), ring = $('.cursor__ring');
    const setDot = { x: gsap.quickSetter(dot, 'x', 'px'), y: gsap.quickSetter(dot, 'y', 'px') };
    const ringPos = { x: mouse.x, y: mouse.y };
    const setRing = { x: gsap.quickSetter(ring, 'x', 'px'), y: gsap.quickSetter(ring, 'y', 'px') };
    gsap.ticker.add(() => {
      setDot.x(mouse.x); setDot.y(mouse.y);
      ringPos.x += (mouse.x - ringPos.x) * .18;
      ringPos.y += (mouse.y - ringPos.y) * .18;
      setRing.x(ringPos.x); setRing.y(ringPos.y);
    });
    document.addEventListener('pointerover', e => {
      const t = e.target;
      cursor.classList.toggle('is-view', !!t.closest('[data-cursor="view"]'));
      cursor.classList.toggle('is-draw', !!t.closest('[data-cursor="draw"]'));
      cursor.classList.toggle('is-link', !t.closest('[data-cursor]') && !!t.closest('a, button'));
    });
    document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
    document.addEventListener('pointerenter', () => cursor.classList.remove('is-hidden'));

    /* Magnetic elements */
    $$('[data-magnetic]').forEach(el => {
      const xTo = gsap.quickTo(el, 'x', { duration: .6, ease: 'elastic.out(1, .4)' });
      const yTo = gsap.quickTo(el, 'y', { duration: .6, ease: 'elastic.out(1, .4)' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .35);
        yTo((e.clientY - r.top - r.height / 2) * .35);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- Hero face: animate, tilt, boop ---------- */
  const face = $('.hero__face');
  const faceImg = $('img', face);
  const bubble = $('.bubble', face);
  const anim = new Image();
  anim.onload = () => (faceImg.src = anim.src);
  anim.src = faceImg.dataset.src;

  if (finePointer && !reduceMotion) {
    const rx = gsap.quickTo(faceImg, 'rotationX', { duration: .8, ease: 'power3.out' });
    const ry = gsap.quickTo(faceImg, 'rotationY', { duration: .8, ease: 'power3.out' });
    const fx = gsap.quickTo(faceImg, 'x', { duration: 1, ease: 'power3.out' });
    const fy = gsap.quickTo(faceImg, 'y', { duration: 1, ease: 'power3.out' });
    addEventListener('pointermove', () => {
      const r = face.getBoundingClientRect();
      if (r.bottom < 0) return;
      const dx = (mouse.x - (r.left + r.width / 2)) / innerWidth;
      const dy = (mouse.y - (r.top + r.height / 2)) / innerHeight;
      ry(dx * 26); rx(-dy * 26); fx(dx * 30); fy(dy * 30);
    });
  }

  /* ---------- Headline: cycle through the superpowers ---------- */
  const powers = $$('.rotator em');
  if (powers.length > 1 && !reduceMotion) {
    gsap.set(powers.slice(1), { yPercent: 150 });
    let pi = 0;
    setInterval(() => {
      if (document.hidden) return;
      const cur = powers[pi];
      pi = (pi + 1) % powers.length;
      gsap.to(cur, { yPercent: -150, rotate: -4, duration: .7, ease: 'expo.inOut' });
      gsap.fromTo(powers[pi], { yPercent: 150, rotate: 4 }, { yPercent: 0, rotate: 0, duration: .7, ease: 'expo.inOut' });
    }, 2200);
  } else {
    powers.slice(1).forEach(p => (p.style.display = 'none'));
  }

  const boops = [
    'Hey! That tickles.', 'Yes, the hair is real.', 'Boop received ✓', 'Hire me, I draw nice.', 'With great pencils comes great responsibility.',
    'Careful — still drying.', 'Do it again. I dare you.', 'Okay, that’s enough booping.',
    '10/10 boop technique.', 'I also do logos, you know.',
  ];
  let boopN = 0, bubbleTimer;
  face.addEventListener('click', () => {
    gsap.timeline()
      .to(faceImg, { scaleX: 1.25, scaleY: .75, duration: .12, ease: 'power2.out' })
      .to(faceImg, { scaleX: 1, scaleY: 1, rotation: gsap.utils.random(-14, 14), duration: .9, ease: 'elastic.out(1.2, .3)' });
    bubble.textContent = boops[boopN++ % boops.length];
    bubble.classList.add('is-on');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove('is-on'), 1800);
    burst(face);
  });

  // little ink confetti when booped
  function burst(el) {
    if (reduceMotion) return;
    const r = el.getBoundingClientRect();
    const colors = ['#2E3BFF', '#FF8A1E', '#FFD449', '#151210', '#FF5B35'];
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('i');
      const size = gsap.utils.random(6, 14);
      Object.assign(s.style, {
        position: 'fixed', left: r.left + r.width / 2 + 'px', top: r.top + r.height / 2 + 'px',
        width: size + 'px', height: size + 'px', zIndex: 120, pointerEvents: 'none',
        background: colors[i % colors.length], borderRadius: i % 3 ? '50%' : '2px',
      });
      document.body.appendChild(s);
      const a = Math.random() * Math.PI * 2, d = gsap.utils.random(70, 180);
      gsap.to(s, {
        x: Math.cos(a) * d, y: Math.sin(a) * d + 40, rotation: gsap.utils.random(-200, 200),
        opacity: 0, duration: gsap.utils.random(.7, 1.1), ease: 'power3.out', onComplete: () => s.remove(),
      });
    }
  }

  /* ---------- Marquee (scroll-velocity aware) ---------- */
  const track = $('.marquee__track');
  const group = $('.marquee__group');
  let mx = 0, dir = -1, boost = 0;
  if (!reduceMotion) {
    gsap.ticker.add((_, dt) => {
      const w = group.offsetWidth;
      mx += dir * (0.06 + boost) * dt;
      boost *= 0.92;
      if (mx <= -w) mx += w;
      if (mx > 0) mx -= w;
      track.style.transform = `translate3d(${mx}px,0,0)`;
    });
    lenis?.on('scroll', e => {
      if (e.velocity) dir = e.velocity > 0 ? -1 : 1;
      boost = Math.min(Math.abs(e.velocity) * .03, 1.2);
    });
  }

  /* ---------- Scroll-driven reveals ---------- */
  const mm = gsap.matchMedia();

  $$('.sec-head, .contact').forEach(head => {
    const lines = $$('.line__inner', head);
    gsap.from(lines, {
      yPercent: 110, rotate: 3, duration: 1.2, ease: 'expo.out', stagger: .08,
      scrollTrigger: { trigger: head, start: 'top 82%' },
    });
    gsap.from($$('.sec-head__note, .sec-head__index', head), {
      y: 24, opacity: 0, duration: 1, ease: 'power3.out', stagger: .1,
      scrollTrigger: { trigger: head, start: 'top 82%' },
    });
  });

  // Hero parallax out
  gsap.to('.hero__title', {
    yPercent: -12, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero__visual', {
    yPercent: 22, rotate: 8, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  /* ---------- Projects: stack + filter ---------- */
  // each visible card scales back as the next one slides over it
  let stackTweens = [];
  function buildStack() {
    stackTweens.forEach(t => { t.scrollTrigger?.kill(); t.kill(); });
    const shown = cards.filter(p => !p.hidden);
    gsap.set(cards, { clearProps: 'scale,filter' });
    stackTweens = [];
    shown.forEach((p, i) => {
      p.style.setProperty('--i', i);
      const next = shown[i + 1];
      if (!next || reduceMotion) return;
      // only recede once the next card actually starts sliding over this one
      // explicit start value: tweening from filter 'none' starts at brightness(0)
      stackTweens.push(gsap.fromTo(p, { scale: 1, filter: 'brightness(1)' }, {
        scale: .9, filter: 'brightness(.55)', ease: 'none', immediateRender: false,
        scrollTrigger: {
          trigger: next, scrub: true, invalidateOnRefresh: true,
          start: () => `top ${stickyTop(p) + p.offsetHeight}px`,
          end: () => `top ${stickyTop(next)}px`,
        },
      }));
    });
  }
  const stickyTop = p => parseFloat(getComputedStyle(p).top) || 0;
  buildStack();

  /* ---------- Projects: one card per scroll ---------- */
  // inside the stack each new wheel flick / trackpad swipe / touch swipe moves
  // exactly one card; past the first or last card the page scrolls normally
  let pts = [], idx = -1, releasedDir = 0, animUntil = 0;
  // Lenis reads wheel events before we can stop them, so it is paused while
  // the stack is in control and resumed when the page is let go
  let holding = false;
  const hold = () => { if (!holding) { holding = true; lenis?.stop(); } };
  const letGo = () => { idx = -1; if (holding) { holding = false; lenis?.start(); } };
  function measurePts() {
    pts = cards.filter(p => !p.hidden).map(p => {
      // measure the in-flow position: sticky's top offset would otherwise shift it
      const t = stickyTop(p);
      p.style.position = 'static';
      const y = p.getBoundingClientRect().top + scrollY - t;
      p.style.position = '';
      return Math.round(y);
    });
    letGo();
  }
  ScrollTrigger.addEventListener('refresh', measurePts);
  measurePts();
  addEventListener('load', measurePts);
  const curY = () => (lenis ? lenis.scroll : scrollY);
  const inStack = y => pts.length > 1 && y >= pts[0] - 2 && y <= pts[pts.length - 1] + 2;
  const nearest = y => pts.reduce((best, v, i) => (Math.abs(v - y) < Math.abs(pts[best] - y) ? i : best), 0);
  function goTo(i) {
    hold();
    idx = i;
    animUntil = performance.now() + 850;
    if (lenis) lenis.scrollTo(pts[i], { duration: .85, easing: t => 1 - Math.pow(1 - t, 4), force: true });
    else window.scrollTo({ top: pts[i], behavior: 'smooth' });
  }
  // one step in a direction; returns true if the stack handled it
  function step(dir) {
    if (!caseEl.hidden || navScrolling) return false;
    const y = curY();
    if (!inStack(y) && performance.now() > animUntil) { letGo(); releasedDir = 0; return false; }
    if (releasedDir === dir) return false; // already let go at this end
    releasedDir = 0;
    if (idx < 0) {
      // arriving: settle on the closest card first
      const n = nearest(y);
      if (Math.abs(pts[n] - y) > 2) { goTo(n); return true; }
      idx = n;
    }
    const next = idx + dir;
    if (next < 0 || next >= pts.length) { releasedDir = dir; letGo(); return false; }
    goTo(next);
    return true;
  }
  // events of the current gesture are swallowed, never re-triggered
  const swallowing = dir => inStack(curY()) && releasedDir !== dir && caseEl.hidden && !navScrolling;

  if (!reduceMotion) {
    // free scrolling that glides into the stack gets caught on the first (or last) card
    const catchEntry = () => {
      if (holding || navScrolling || !caseEl.hidden || performance.now() < animUntil) return;
      const y = curY();
      if (!inStack(y)) { releasedDir = 0; return; }
      if (releasedDir) return;
      const dir = lenis ? lenis.direction : 1;
      goTo(dir < 0 ? pts.length - 1 : 0);
    };
    lenis ? lenis.on('scroll', catchEntry) : addEventListener('scroll', catchEntry, { passive: true });

    // a new gesture = wheel after a pause, or a clear re-acceleration mid-momentum
    let lastT = 0, lastAbs = 0, gestureT = 0;
    addEventListener('wheel', e => {
      const d = e.deltaY, abs = Math.abs(d), now = performance.now();
      if (abs < 1) return;
      const dir = Math.sign(d);
      const fresh = now - lastT > 180 || (abs > lastAbs * 1.8 && abs > 24 && now - gestureT > 280);
      lastT = now; lastAbs = abs;
      if (fresh) {
        gestureT = now;
        navScrolling = false; // the user took over from any anchor jump
        if (step(dir)) { e.preventDefault(); e.stopImmediatePropagation(); }
      } else if (holding && swallowing(dir)) {
        e.preventDefault(); e.stopImmediatePropagation();
      }
    }, { passive: false, capture: true });

    let touchY = null, touchDone = false;
    addEventListener('touchstart', e => { touchY = e.touches[0].clientY; touchDone = false; }, { passive: true });
    addEventListener('touchmove', e => {
      if (touchY === null) return;
      const dy = touchY - e.touches[0].clientY;
      if (touchDone) { if (holding) e.preventDefault(); return; }
      if (Math.abs(dy) < 12) { if (holding) e.preventDefault(); return; }
      if (step(Math.sign(dy))) { touchDone = true; e.preventDefault(); }
    }, { passive: false });
    addEventListener('touchend', () => { touchY = null; });
  }

  const filterBtns = $$('.work__filter button');
  const inCat = (p, f) => f === 'all' || p.dataset.cat.split(' ').includes(f);
  filterBtns.forEach(b => { $('sup', b).textContent = cards.filter(p => inCat(p, b.dataset.filter)).length; });
  filterBtns.forEach(b => b.addEventListener('click', () => {
    if (b.classList.contains('is-on')) return;
    filterBtns.forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b); });
    const f = b.dataset.filter;
    gsap.to('.projects', {
      opacity: 0, y: 30, duration: reduceMotion ? 0 : .25, ease: 'power2.in',
      onComplete: () => {
        cards.forEach(p => { p.hidden = !inCat(p, f); });
        buildStack();
        ScrollTrigger.refresh();
        // land on the first card of the new set (it's faded out, so the jump is invisible)
        if (pts.length && curY() > pts[0]) {
          if (lenis) lenis.scrollTo(pts[0], { immediate: true, force: true });
          else window.scrollTo(0, pts[0]);
        }
        gsap.to('.projects', { opacity: 1, y: 0, duration: reduceMotion ? 0 : .6, ease: 'power3.out' });
      },
    });
  }));

  /* ---------- Logo tiles ---------- */
  // reveal is a CSS keyframe so it doesn't fight the hover transition on the same transform
  ScrollTrigger.create({ trigger: '.logo-grid', start: 'top 80%', once: true, onEnter: () => $('.logo-grid').classList.add('is-in') });
  $$('.logo-tile').forEach((tile, i) => {
    tile.style.setProperty('--d', [3, 0, 5, 2, 6, 1, 7, 4][i % 8]);
    const pupils = $$('.pupil', tile);
    tile.addEventListener('pointermove', e => {
      const r = tile.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      tile.style.setProperty('--mx', px * 100 + '%');
      tile.style.setProperty('--my', py * 100 + '%');
      pupils.forEach(pu => (pu.style.transform = `translate(${(px - .5) * 12}px, ${(py - .5) * 12}px)`));
    });
    tile.addEventListener('pointerleave', () => pupils.forEach(pu => (pu.style.transform = '')));
  });

  /* ---------- About: spinning face + word reveal ---------- */
  const textEl = $('[data-words]');
  textEl.innerHTML = textEl.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  const words = $$('.w', textEl);

  const canvas = $('.about__canvas');
  const ctx = canvas.getContext('2d');
  const sprite = new Image();
  const FRAMES = 135, COLS = 12, CELL = 300;
  let currentFrame = -1;
  const drawFrame = f => {
    f = Math.max(0, Math.min(FRAMES - 1, Math.round(f)));
    if (f === currentFrame || !sprite.complete || !sprite.naturalWidth) return;
    currentFrame = f;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(sprite, (f % COLS) * CELL, Math.floor(f / COLS) * CELL, CELL, CELL, 0, 0, canvas.width, canvas.height);
  };
  sprite.onload = () => drawFrame(0);
  sprite.src = 'assets/face-sprite.webp';

  const aboutProgress = self => {
    drawFrame(self.progress * (FRAMES - 1));
    const lit = Math.round(self.progress * 1.25 * words.length);
    words.forEach((w, i) => (w.style.opacity = i < lit ? 1 : ''));
  };
  mm.add('(min-width: 1025px)', () => {
    ScrollTrigger.create({
      trigger: '.about__pin', start: 'top top', end: '+=160%', pin: true, scrub: true,
      onUpdate: aboutProgress,
    });
  });
  mm.add('(max-width: 1024px)', () => {
    ScrollTrigger.create({
      trigger: '.about__pin', start: 'top 80%', end: 'bottom 30%', scrub: true,
      onUpdate: aboutProgress,
    });
  });

  // stats count-up
  $$('[data-count]').forEach(dd => {
    const end = parseFloat(dd.dataset.count), dec = +(dd.dataset.decimals || 0);
    const o = { v: 0 };
    gsap.to(o, {
      v: end, duration: 2, ease: 'power3.out',
      onUpdate: () => (dd.textContent = o.v.toFixed(dec)),
      scrollTrigger: { trigger: dd, start: 'top 90%' },
    });
  });
  gsap.from('.services li', {
    x: -40, opacity: 0, duration: .9, ease: 'power3.out', stagger: .06,
    scrollTrigger: { trigger: '.services', start: 'top 85%' },
  });

  /* ---------- Footer face peeks ---------- */
  gsap.fromTo('.footer__face', { yPercent: 70, rotate: -25 }, {
    yPercent: 0, rotate: 0, ease: 'none',
    scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
  });
  gsap.from('.footer__mark span', {
    yPercent: 60, ease: 'none', stagger: .1,
    scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
  });

  /* ---------- Copy email ---------- */
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); toast('Copied! Now go write something nice ✦'); }
    catch { toast(b.dataset.copy); }
  }));

  /* ---------- Doodle pad ---------- */
  const pad = $('.pad');
  const surface = $('.pad__surface');
  const pc = $('.pad__canvas');
  const p2d = pc.getContext('2d');
  const stampImg = $('.pad__stamp img');
  let color = '#151210', tool = 'brush', drawing = false, last = null, lastMid = null, lastW = 6;

  function sizePad() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const { width, height } = surface.getBoundingClientRect();
    const copy = document.createElement('canvas');
    copy.width = pc.width; copy.height = pc.height;
    if (pc.width) copy.getContext('2d').drawImage(pc, 0, 0);
    pc.width = Math.round(width * dpr); pc.height = Math.round(height * dpr);
    p2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    p2d.lineCap = p2d.lineJoin = 'round';
    if (copy.width) p2d.drawImage(copy, 0, 0, copy.width / dpr, copy.height / dpr);
  }
  sizePad();
  new ResizeObserver(() => sizePad()).observe(surface);

  const pt = e => { const r = pc.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }; };

  surface.addEventListener('pointerdown', e => {
    pad.classList.add('is-dirty');
    const p = pt(e);
    if (tool === 'stamp') {
      const s = gsap.utils.random(90, 140);
      p2d.save();
      p2d.translate(p.x, p.y);
      p2d.rotate(gsap.utils.random(-.4, .4));
      p2d.drawImage(stampImg, -s / 2, -s / 2, s, s);
      p2d.restore();
      return;
    }
    drawing = true; last = p; lastMid = p; lastW = 6;
    surface.setPointerCapture(e.pointerId);
    p2d.fillStyle = color;
    p2d.beginPath(); p2d.arc(p.x, p.y, 3, 0, Math.PI * 2); p2d.fill();
  });
  const segment = e => {
    const p = pt(e);
    const dist = Math.hypot(p.x - last.x, p.y - last.y);
    if (dist < 1.5) return;
    const speed = dist / Math.max(1, p.t - last.t);
    const target = e.pressure && e.pointerType === 'pen' ? 2 + e.pressure * 12 : Math.max(2.5, Math.min(10, 10 - speed * 3));
    const w = lastW + (target - lastW) * .35;
    const mid = { x: (last.x + p.x) / 2, y: (last.y + p.y) / 2 };
    p2d.strokeStyle = color; p2d.lineWidth = w;
    p2d.beginPath(); p2d.moveTo(lastMid.x, lastMid.y); p2d.quadraticCurveTo(last.x, last.y, mid.x, mid.y); p2d.stroke();
    last = p; lastMid = mid; lastW = w;
  };
  surface.addEventListener('pointermove', e => {
    if (!drawing) return;
    (e.getCoalescedEvents?.() || [e]).forEach(segment);
  });
  const stop = () => {
    if (!drawing) return;
    drawing = false;
    // close the gap between the last midpoint and where the pointer lifted
    p2d.beginPath(); p2d.moveTo(lastMid.x, lastMid.y); p2d.lineTo(last.x, last.y); p2d.stroke();
  };
  surface.addEventListener('pointerup', stop);
  surface.addEventListener('pointercancel', stop);

  $$('.swatch').forEach(s => s.addEventListener('click', () => {
    $$('.swatch').forEach(o => { o.classList.remove('is-active'); o.setAttribute('aria-checked', 'false'); });
    s.classList.add('is-active'); s.setAttribute('aria-checked', 'true');
    color = s.dataset.color; tool = 'brush';
    $('.pad__stamp').setAttribute('aria-pressed', 'false');
  }));
  $('.pad__stamp').addEventListener('click', e => {
    tool = tool === 'stamp' ? 'brush' : 'stamp';
    e.currentTarget.setAttribute('aria-pressed', String(tool === 'stamp'));
  });
  $('[data-action="clear"]').addEventListener('click', () => {
    p2d.clearRect(0, 0, pc.width, pc.height);
    pad.classList.remove('is-dirty');
  });
  $('[data-action="save"]').addEventListener('click', () => {
    const out = document.createElement('canvas');
    out.width = pc.width; out.height = pc.height;
    const o = out.getContext('2d');
    o.fillStyle = '#FBF8F2'; o.fillRect(0, 0, out.width, out.height);
    o.drawImage(pc, 0, 0);
    const a = document.createElement('a');
    a.download = 'doodle-for-harsh.png';
    a.href = out.toDataURL('image/png');
    a.click();
    toast('Saved! Tag me if you post it ✎');
  });
})();

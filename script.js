/* FAT WEB · V6 — motor de scroll cinematográfico (vanilla, sin dependencias) */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (n, a = 0, b = 1) => Math.min(Math.max(n, a), b);
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const root = document.documentElement;
  let vw = innerWidth, vh = innerHeight;

  /* ---------- Intro ---------- */
  const start = () => {
    document.body.classList.remove('is-loading');
    $$('.hero [data-reveal]').forEach((el, i) => { el.style.setProperty('--i', i); el.classList.add('in'); });
    setTimeout(() => document.body.classList.add('is-ready'), 1500);
  };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(start));
  setTimeout(start, 1800);

  /* ---------- Reveal con escalonado ---------- */
  const reveals = $$('[data-reveal]').filter(el => !el.closest('.hero'));
  reveals.forEach(el => {
    const sib = [...el.parentElement.children].filter(c => c.hasAttribute('data-reveal'));
    el.style.setProperty('--i', sib.indexOf(el));
  });
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(el => io.observe(el));
  } else reveals.forEach(el => el.classList.add('in'));

  /* ---------- Topbar: sección actual ---------- */
  const sections = $$('[data-label]');
  const nowIndex = $('#nowIndex'), nowLabel = $('#nowLabel'), bar = $('#progress');
  let lastLabel = '';
  function updateNow() {
    const mid = vh * .45;
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) {
        if (s.dataset.label !== lastLabel) {
          lastLabel = s.dataset.label;
          nowIndex.textContent = s.dataset.index;
          nowLabel.textContent = s.dataset.label;
        }
        break;
      }
    }
    const full = root.scrollHeight - vh;
    bar.style.transform = `scaleX(${full > 0 ? scrollY / full : 0})`;
  }

  const prog = el => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(el.offsetHeight - vh, 1)); };
  const inView = el => { const r = el.getBoundingClientRect(); return r.bottom > -100 && r.top < vh + 100; };

  /* ---------- HERO: cámara sobre el video + escudo 3D ---------- */
  const hero = $('#inicio'), heroCopy = $('#heroCopy'), videoCard = $('#videoCard'),
        shield = $('#shield'), shieldBody = $('#shieldBody'), heroChips = $$('.hero .chip');
  let px = 0, py = 0, tpx = 0, tpy = 0;
  addEventListener('pointermove', e => { tpx = e.clientX / vw - .5; tpy = e.clientY / vh - .5; }, { passive: true });

  function heroFrame(time) {
    if (!inView(hero)) return;
    const p = reduce ? 0 : prog(hero);
    const e = ease(p);
    heroCopy.style.transform = `translate3d(${-e * 60}px,${-e * 90}px,0)`;
    heroCopy.style.opacity = 1 - clamp(p * 1.8);
    heroCopy.style.filter = `blur(${(e * 12).toFixed(2)}px)`;

    // "dron": la tarjeta de video viaja al centro y la cámara se acerca
    if (document.body.classList.contains('is-ready') || p > 0) {
      const r = videoCard.offsetParent.getBoundingClientRect();
      const cardCx = r.left + videoCard.offsetLeft + videoCard.offsetWidth / 2;
      const dx = (vw / 2 - cardCx) * e;
      const s = 1 + e * (vw > 900 ? .38 : .5);
      videoCard.style.transform = `translate3d(${dx}px,${e * 20}px,0) rotateY(${(-6 * (1 - e) + 0).toFixed(2)}deg) scale(${s})`;
    }

    // escudo: flota, sigue al puntero y "vuela" hacia la cámara al bajar
    px = lerp(px, tpx, .06); py = lerp(py, tpy, .06);
    const idle = reduce ? 0 : Math.sin(time / 1400) * 6;
    shieldBody.style.setProperty('--ry', `${(px * 34 + idle + e * 50).toFixed(2)}deg`);
    shieldBody.style.setProperty('--rx', `${(-py * 22 + Math.cos(time / 1700) * 3).toFixed(2)}deg`);
    shieldBody.style.setProperty('--sheen', `${(120 - ((time / 40) % 260)).toFixed(1)}%`);
    if (document.body.classList.contains('is-ready')) {
      shield.style.transform = `translate3d(${-e * 140}px,${-e * 160 + Math.sin(time / 1100) * 6}px,${e * 260}px) scale(${1 + e * .3})`;
      shield.style.opacity = 1 - clamp(p * 1.7);
    }
    heroChips.forEach(c => {
      const f = parseFloat(c.dataset.float || 0);
      c.style.transform = `translate3d(0,${-e * 220 * f}px,0)`;
      c.style.opacity = 1 - clamp(p * 2);
    });
  }

  /* ---------- QUÉ ES FAT: cámara tipo Screen Studio sobre tablero de capas ---------- */
  const story = $('#que-es'), steps = $$('.step'), ticks = $$('.ticks i'),
        board = $('#board'), viewport = $('#storyViewport'),
        storyNum = $('#storyNum'), vpLabel = $('#vpLabel'), vpZoom = $('#vpZoom');
  const BW = 1570, BH = 1040;
  const R = {
    all: [0, 0, BW, BH],
    s0: [40, 60, 870, 640],
    s1: [430, 370, 650, 340],
    s2: [1090, 60, 440, 440],
    s3: [40, 710, 660, 290],
    s4: [710, 710, 820, 290],
  };
  const labels = ['Quiénes somos', 'Oportunidades', 'Estado institucional', 'Misión', 'Visión'];
  // pares (posición, encuadre): mantener y luego "cortar" rápido al siguiente
  const KEYS = [[0, R.all], [.35, R.s0], [1, R.s0], [1.3, R.s1], [2, R.s1], [2.3, R.s2], [3, R.s2], [3.3, R.s3], [4, R.s3], [4.3, R.s4], [4.75, R.s4], [5, R.all]];
  const cam = { x: 0, y: 0, s: .4, init: false };
  let activeStep = -1;

  function rectAt(u) {
    for (let i = 0; i < KEYS.length - 1; i++) {
      const [ua, ra] = KEYS[i], [ub, rb] = KEYS[i + 1];
      if (u <= ub) {
        const t = ease(clamp((u - ua) / (ub - ua)));
        return ra.map((v, k) => lerp(v, rb[k], t));
      }
    }
    return KEYS[KEYS.length - 1][1];
  }
  function storyFrame() {
    if (!inView(story)) return;
    const p = prog(story), u = p * 5;
    const idx = Math.min(4, Math.floor(u));
    if (idx !== activeStep) {
      activeStep = idx;
      steps.forEach((s, i) => { s.classList.toggle('is-active', i === idx); s.classList.toggle('is-past', i < idx); });
      storyNum.textContent = String(idx + 1).padStart(2, '0');
      vpLabel.textContent = labels[idx];
    }
    ticks.forEach((t, i) => t.style.setProperty('--p', clamp(u - i).toFixed(3)));

    const W = viewport.clientWidth, H = viewport.clientHeight;
    const [x, y, w, h] = rectAt(u);
    const s = Math.min(W / w, H / h) * .9;
    const tx = W / 2 - (x + w / 2) * s, ty = H / 2 - (y + h / 2) * s;
    if (!cam.init || reduce) { cam.x = tx; cam.y = ty; cam.s = s; cam.init = true; }
    const k = .14;
    const ox = cam.x, oy = cam.y, os = cam.s;
    cam.x = lerp(cam.x, tx, k); cam.y = lerp(cam.y, ty, k); cam.s = lerp(cam.s, s, k);
    const speed = Math.hypot(cam.x - ox, cam.y - oy) + Math.abs(cam.s - os) * 900;
    const blur = reduce ? 0 : Math.min(speed * .07, 5);
    board.style.transform = `translate3d(${cam.x.toFixed(2)}px,${cam.y.toFixed(2)}px,0) scale(${cam.s.toFixed(4)})`;
    board.style.filter = blur > .3 ? `blur(${blur.toFixed(2)}px)` : 'none';
    vpZoom.textContent = (cam.s / (Math.min(W / BW, H / BH) * .9)).toFixed(2) + '×';
  }

  /* ---------- INDUMENTARIA: giro 360° automático + scroll ---------- */
  const kit = $('#indumentaria'), jersey = $('#jersey'), specItems = $$('#spec li'), rotDeg = $('#rotDeg'), playerCard = $('.player-card');
  let spin = 0, lastT = 0, scrollSpin = 0, face = '';
  function kitFrame(time, dt) {
    if (!inView(kit)) return;
    const p = prog(kit);
    if (!reduce) spin += dt * .045;            // ~45°/s automático
    scrollSpin = lerp(scrollSpin, p * 360, .12); // el scroll suma una vuelta completa
    const a = ((spin + scrollSpin) % 360 + 360) % 360;
    jersey.style.transform = `rotateX(-4deg) rotateY(${a.toFixed(2)}deg) translateY(${Math.sin(time / 900) * 6}px)`;
    rotDeg.textContent = String(Math.round(a)).padStart(3, '0') + '°';
    const f = (a < 55 || a > 305) ? 'front' : (a > 125 && a < 235) ? 'back' : 'side';
    if (f !== face) { face = f; specItems.forEach(li => li.classList.toggle('on', li.dataset.face === f)); }
    if (playerCard) playerCard.style.transform = `translate3d(0,${(.5 - p) * 80}px,0) rotate(${(2 - p * 4).toFixed(2)}deg)`;
  }

  /* ---------- Capas flotantes + cámara de entrada por sección ---------- */
  const floats = $$('[data-float]').filter(el => !el.closest('.hero') && !el.classList.contains('player-card'));
  const cams = $$('[data-cam]');
  function layersFrame() {
    floats.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const d = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = `translate3d(0,${(d * parseFloat(el.dataset.float) * -140).toFixed(1)}px,0)`;
    });
    cams.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const d = clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1);
      el.style.transform = `perspective(1400px) translate3d(0,${(d * 70).toFixed(1)}px,${(-Math.abs(d) * 160).toFixed(1)}px) rotateX(${(d * -9).toFixed(2)}deg)`;
    });
  }

  /* ---------- Sponsors: mosaico que se arma con el scroll ---------- */
  const mosaic = $('#mosaic'), tiles = $$('#mosaic .tile');
  const seeds = tiles.map((_, i) => {
    const a = Math.sin(i * 12.9898) * 43758.5453; const r = a - Math.floor(a);
    const b = Math.sin(i * 78.233) * 12345.678; const q = b - Math.floor(b);
    return { x: (r - .5) * 320, y: 160 + q * 160, rot: (r - .5) * 30 };
  });
  function mosaicFrame() {
    if (!inView(mosaic)) return;
    const r = mosaic.getBoundingClientRect();
    const q = clamp((vh - r.top) / (vh * .75));
    tiles.forEach((t, i) => {
      const e = reduce ? 1 : ease(clamp((q - i * .07) / .45));
      const s = seeds[i];
      t.style.transform = `translate3d(${(s.x * (1 - e)).toFixed(1)}px,${(s.y * (1 - e)).toFixed(1)}px,${(-260 * (1 - e)).toFixed(1)}px) rotate(${(s.rot * (1 - e)).toFixed(2)}deg)`;
      t.style.opacity = e.toFixed(3);
      t.style.filter = e < .99 ? `blur(${((1 - e) * 10).toFixed(2)}px)` : 'none';
    });
  }

  /* ---------- Motion blur por velocidad de scroll ---------- */
  let lastY = scrollY, vel = 0;
  function blurFrame() {
    const dy = scrollY - lastY; lastY = scrollY;
    vel = lerp(vel, Math.abs(dy), .2);
    root.style.setProperty('--mb', reduce ? '0px' : `${Math.min(vel * .05, 4).toFixed(2)}px`);
  }

  /* ---------- Loop ---------- */
  function frame(time) {
    const dt = lastT ? Math.min(time - lastT, 64) : 16; lastT = time;
    updateNow(); blurFrame(); heroFrame(time); storyFrame(); kitFrame(time, dt); layersFrame(); mosaicFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  addEventListener('resize', () => { vw = innerWidth; vh = innerHeight; });

  /* ---------- WhatsApp flotante ---------- */
  const wa = $('#wa'), waBtn = $('#waBtn');
  waBtn.addEventListener('click', () => {
    const open = wa.classList.toggle('open');
    waBtn.setAttribute('aria-expanded', open);
  });
  document.addEventListener('click', e => { if (!wa.contains(e.target)) { wa.classList.remove('open'); waBtn.setAttribute('aria-expanded', 'false'); } });

  /* Video: pausar fuera de pantalla para ahorrar batería */
  const vid = $('.video-card video');
  if (vid && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { e.isIntersecting ? vid.play().catch(() => {}) : vid.pause(); }).observe(vid);
  }
})();

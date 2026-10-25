/* FAT WEB · V7 — motor de scroll cinematográfico (vanilla, sin dependencias) */
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

  /* ---------- HERO: escudo 3D + llamado a sponsors ---------- */
  const hero = $('#inicio'), heroCopy = $('#heroCopy'),
        shield = $('#shield'), shieldBody = $('#shieldBody'), heroChips = $$('.hero .chip');
  let px = 0, py = 0, tpx = 0, tpy = 0;
  addEventListener('pointermove', e => { tpx = e.clientX / vw - .5; tpy = e.clientY / vh - .5; }, { passive: true });

  function heroFrame(time) {
    if (!inView(hero)) return;
    const p = reduce ? 0 : prog(hero);
    const e = ease(p);
    heroCopy.style.transform = `translate3d(0,${-e * 80}px,0)`;
    heroCopy.style.opacity = 1 - clamp(p * 1.6);
    heroCopy.style.filter = `blur(${(e * 10).toFixed(2)}px)`;

    px = lerp(px, tpx, .06); py = lerp(py, tpy, .06);
    const idle = reduce ? 0 : Math.sin(time / 1400) * 8;
    shieldBody.style.setProperty('--ry', `${(px * 34 + idle + e * 60).toFixed(2)}deg`);
    shieldBody.style.setProperty('--rx', `${(-py * 22 + Math.cos(time / 1700) * 3).toFixed(2)}deg`);
    shieldBody.style.setProperty('--sheen', `${(120 - ((time / 40) % 260)).toFixed(1)}%`);
    if (document.body.classList.contains('is-ready')) {
      shield.style.transform = `translate3d(${-e * 120}px,${-e * 120 + Math.sin(time / 1100) * 8}px,${e * 320}px) scale(${1 + e * .25})`;
      shield.style.opacity = 1 - clamp(p * 1.5);
    }
    heroChips.forEach(c => {
      const f = parseFloat(c.dataset.float || 0);
      c.style.transform = `translate3d(0,${-e * 240 * f}px,0)`;
      c.style.opacity = document.body.classList.contains('is-loading') ? '' : 1 - clamp(p * 2);
    });
  }

  /* ---------- LA CANCHA: video con acercamiento tipo dron ---------- */
  const pitch = $('#cancha'), videoCard = $('#videoCard'), pitchCopy = $('#pitchCopy');
  function pitchFrame() {
    if (!inView(pitch)) return;
    const p = reduce ? .0 : prog(pitch);
    const e = ease(p);
    const r = videoCard.parentElement.getBoundingClientRect();
    const dx = (vw / 2 - (r.left + r.width / 2)) * e;
    const s = .86 + e * (vw > 900 ? .5 : .35);
    videoCard.style.transform = `translate3d(${dx.toFixed(1)}px,0,0) rotateY(${(-8 * (1 - e)).toFixed(2)}deg) scale(${s.toFixed(3)})`;
    pitchCopy.style.opacity = 1 - clamp((p - .35) * 2.2);
    pitchCopy.style.transform = `translate3d(0,${-e * 60}px,0)`;
  }

  /* ---------- Identidad: índice activo ---------- */
  const idItems = $$('#idIndex li');
  if (idItems.length && 'IntersectionObserver' in window) {
    const io2 = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) idItems.forEach(li => li.classList.toggle('on', li.dataset.for === e.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    $$('.id-block').forEach(b => io2.observe(b));
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
    updateNow(); blurFrame(); heroFrame(time); pitchFrame(); kitFrame(time, dt); layersFrame(); mosaicFrame();
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

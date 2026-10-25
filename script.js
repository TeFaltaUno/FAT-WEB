/* FAT WEB · V8 — "Esto es la FAT" · motor de scroll cinematográfico (vanilla) */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (n, a = 0, b = 1) => Math.min(Math.max(n, a), b);
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const body = document.body, root = document.documentElement;
  let vw = innerWidth, vh = innerHeight;
  const mobile = () => vw <= 900;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);

  /* =========================================================
     INTRO — "Esto es la FAT" con cortes rápidos
     ========================================================= */
  const intro = $('#intro'), cuts = $$('.cut', intro), count = $('#introCount');
  const DUR = [360, 320, 320, 720, 210, 260, 210, 260, 210, 300, 1100];
  let introDone = false, timers = [];
  function endIntro() {
    if (introDone) return; introDone = true;
    timers.forEach(clearTimeout);
    intro.classList.add('out');
    scrollTo(0, 0);
    body.classList.remove('is-intro');
    body.classList.add('is-ready');
    setTimeout(() => body.classList.add('is-live'), 1700);
    setTimeout(() => intro.classList.add('gone'), 1000);
  }
  if (reduce) { intro.classList.add('gone'); endIntro(); }
  else {
    let t = 250;
    cuts.forEach((c, i) => {
      timers.push(setTimeout(() => {
        cuts.forEach(x => x.classList.remove('on'));
        c.classList.add('on');
        count.textContent = String(i + 1).padStart(2, '0');
      }, t));
      t += DUR[i];
    });
    timers.push(setTimeout(endIntro, t));
    $('#skip').addEventListener('click', endIntro);
    ['wheel', 'touchmove', 'keydown'].forEach(ev => addEventListener(ev, () => { if (!introDone) endIntro(); }, { once: true, passive: true }));
  }

  /* ---------- Reveal ---------- */
  const reveals = $$('[data-reveal]');
  reveals.forEach(el => {
    const sib = [...el.parentElement.children].filter(c => c.hasAttribute('data-reveal'));
    el.style.setProperty('--i', sib.indexOf(el));
  });
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(el => io.observe(el));
  } else reveals.forEach(el => el.classList.add('in'));

  /* ---------- Topbar ---------- */
  const sections = $$('[data-label]'), nowIndex = $('#nowIndex'), nowLabel = $('#nowLabel'), bar = $('#progress');
  let lastLabel = '';
  function updateNow() {
    const mid = vh * .45;
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) {
        if (s.dataset.label !== lastLabel) { lastLabel = s.dataset.label; nowIndex.textContent = s.dataset.index; nowLabel.textContent = s.dataset.label; }
        break;
      }
    }
    const full = root.scrollHeight - vh;
    bar.style.transform = `scaleX(${full > 0 ? scrollY / full : 0})`;
  }
  const prog = el => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(el.offsetHeight - vh, 1)); };
  const inView = el => { const r = el.getBoundingClientRect(); return r.bottom > -50 && r.top < vh + 50; };

  /* =========================================================
     01 · ESCUDO — zoom automático al bajar
     ========================================================= */
  const hero = $('#inicio'), shield = $('#shield'), shieldBody = $('#shieldBody'),
        heroKicker = $('#heroKicker'), heroTitle = $('#heroTitle'), cue = $('#scrollCue'),
        flash = $('#heroFlash'), rings = $$('.hero .ring'), beam = $('.beam');
  let px = 0, py = 0, tpx = 0, tpy = 0;
  addEventListener('pointermove', e => { tpx = e.clientX / vw - .5; tpy = e.clientY / vh - .5; }, { passive: true });
  function heroFrame(time) {
    if (!inView(hero)) return;
    const p = reduce ? 0 : prog(hero), e = ease(p);
    px = lerp(px, tpx, .06); py = lerp(py, tpy, .06);
    const idle = Math.sin(time / 1400) * 7;
    shieldBody.style.setProperty('--ry', `${(px * 30 + idle + e * 35).toFixed(2)}deg`);
    shieldBody.style.setProperty('--rx', `${(-py * 18 + Math.cos(time / 1700) * 3 - e * 10).toFixed(2)}deg`);
    shieldBody.style.setProperty('--x', (1 + e * 3.5).toFixed(3));
    shieldBody.style.setProperty('--sheen', `${(120 - ((time / 38) % 260)).toFixed(1)}%`);
    if (body.classList.contains('is-live')) {
      const s = 1 + Math.pow(e, 1.6) * (mobile() ? 4 : 5.5);
      shield.style.transform = `translate3d(0,${(Math.sin(time / 1100) * 8 * (1 - e)).toFixed(1)}px,0) scale(${s.toFixed(3)})`;
      shield.style.opacity = 1 - clamp((p - .62) / .2);
      heroKicker.style.opacity = heroTitle.style.opacity = 1 - clamp(p * 3.2);
      heroTitle.style.transform = `translate3d(0,${e * 80}px,0)`;
      heroKicker.style.transform = `translate3d(0,${-e * 80}px,0)`;
    }
    cue.style.opacity = 1 - clamp(p * 6);
    rings.forEach((r, i) => r.style.setProperty('--rs', (1 + e * (2 + i)).toFixed(3)));
    beam.style.setProperty('--beam', `${(time / 60) % 360}deg`);
    flash.style.opacity = (clamp((p - .6) / .16) * (1 - clamp((p - .84) / .14))).toFixed(3);
  }

  /* =========================================================
     02 · SPONSORS — anillo 3D: todos juntos, girando
     ========================================================= */
  const spSec = $('#sponsors'), spRing = $('#spRing'), spCards = $$('.sp-card', spRing), spNow = $('#spNow');
  const N = spCards.length, step = 360 / N;
  const scatter = spCards.map((_, i) => {
    const a = Math.sin(i * 91.7) * 43758.5; const r = a - Math.floor(a);
    const b = Math.sin(i * 17.3) * 12345.6; const q = b - Math.floor(b);
    return { x: (r - .5) * 900, y: (q - .5) * 600, z: -900 - q * 600, rot: (r - .5) * 120 };
  });
  let spAngle = 0, spName = '';
  function sponsorsFrame(dt) {
    if (!inView(spSec)) return;
    const r = spSec.getBoundingClientRect();
    const q = clamp((vh - r.top) / (vh * .9));
    const e = reduce ? 1 : ease(q);
    const sp = clamp(-r.top / Math.max(r.height - vh, 1));
    if (!reduce) spAngle -= dt * .022;
    const ang = spAngle - sp * 220;
    const size = spRing.offsetWidth, R = size * (mobile() ? 1.42 : 1.62);
    spRing.style.transform = `rotateX(${(-10 + sp * 6).toFixed(2)}deg)`;
    let best = -2, bestI = 0;
    spCards.forEach((c, i) => {
      const th = i * step + ang;
      const f = Math.cos(th * Math.PI / 180);
      if (f > best) { best = f; bestI = i; }
      const s = scatter[i];
      c.style.transform = `translate3d(${(s.x * (1 - e)).toFixed(1)}px,${(s.y * (1 - e)).toFixed(1)}px,${(s.z * (1 - e)).toFixed(1)}px) rotateY(${th.toFixed(2)}deg) translateZ(${(R * e).toFixed(1)}px) rotateZ(${(s.rot * (1 - e)).toFixed(1)}deg)`;
      c.style.opacity = (e * (.3 + .7 * ((f + 1) / 2))).toFixed(3);
    });
    const name = spCards[bestI].querySelector('img').alt;
    if (name !== spName) { spName = name; spNow.textContent = name; }
  }

  /* =========================================================
     03 · INDUMENTARIA — 360° automático + scroll
     ========================================================= */
  const kit = $('#indumentaria'), jersey = $('#jersey'), specItems = $$('#spec li'), rotDeg = $('#rotDeg'), playerCard = $('.player-card');
  let spin = 0, scrollSpin = 0, face = '';
  function kitFrame(time, dt) {
    if (!inView(kit)) return;
    const p = prog(kit);
    if (!reduce) spin += dt * .045;
    scrollSpin = lerp(scrollSpin, p * 360, .12);
    const a = ((spin + scrollSpin) % 360 + 360) % 360;
    jersey.style.transform = `rotateX(-4deg) rotateY(${a.toFixed(2)}deg) translateY(${(Math.sin(time / 900) * 6).toFixed(1)}px)`;
    rotDeg.textContent = String(Math.round(a)).padStart(3, '0') + '°';
    const f = (a < 55 || a > 305) ? 'front' : (a > 125 && a < 235) ? 'back' : 'side';
    if (f !== face) { face = f; specItems.forEach(li => li.classList.toggle('on', li.dataset.face === f)); }
    playerCard.style.transform = `translate3d(0,${((.5 - p) * 80).toFixed(1)}px,0) rotate(${(2 - p * 4).toFixed(2)}deg)`;
  }

  /* =========================================================
     04 · QUIÉNES SOMOS — cámara sobre bento flotante
     ========================================================= */
  const story = $('#quienes-somos'), board = $('#board'), viewport = $('#storyViewport'),
        ticks = $$('.story-foot .ticks i'), hudTitle = $('#hudTitle'), vpZoom = $('#vpZoom');
  let BW = 1520, BH = 1520, ALL = [0, 0, BW, BH];
  const vals = $$('.g-vals .v', board);
  const stopEls = [0, 1, 2, 3, 4, 5].map(i => [$(`.g[data-k="${i}"]`, board)]).concat([[vals[0], vals[1]], [vals[2], vals[3]]]);
  let STOPS = stopEls.map(() => ALL);
  function measure() {
    BW = board.offsetWidth; BH = board.offsetHeight; ALL = [0, 0, BW, BH];
    STOPS = stopEls.map(els => {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      els.forEach(e => {
        let x = 0, y = 0, n = e;
        while (n && n !== board) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + e.offsetWidth); y1 = Math.max(y1, y + e.offsetHeight);
      });
      return [x0, y0, x1 - x0, y1 - y0];
    });
    buildKeys();
  }
  const TITLES = ['Quiénes somos', 'Oportunidades', 'Objetivo', 'Estado institucional', 'Misión', 'Visión', 'Valores', 'Valores'];
  const NS = stopEls.length;
  let KEYS = [];
  function buildKeys() {
    KEYS = [[0, ALL], [.3, STOPS[0]]];
    for (let i = 0; i < NS; i++) {
      KEYS.push([i + 1 - (i === NS - 1 ? .3 : 0), STOPS[i]]);
      if (i < NS - 1) KEYS.push([i + 1.25, STOPS[i + 1]]);
    }
    KEYS.push([NS, ALL]);
  }
  const cardsByStop = stopEls;
  const allCards = $$('.g', board);
  const cam = { x: 0, y: 0, s: .3, init: false };
  let active = -2;
  function rectAt(u) {
    for (let i = 0; i < KEYS.length - 1; i++) {
      const [ua, ra] = KEYS[i], [ub, rb] = KEYS[i + 1];
      if (u <= ub) { const t = ease(clamp((u - ua) / (ub - ua))); return ra.map((v, k) => lerp(v, rb[k], t)); }
    }
    return ALL;
  }
  function storyFrame() {
    if (!inView(story)) return;
    const p = prog(story), u = p * NS;
    const overview = u < .15 || u > NS - .15;
    const idx = overview ? -1 : Math.min(NS - 1, Math.floor(u));
    if (idx !== active) {
      active = idx;
      allCards.forEach(c => c.classList.toggle('on', overview));
      if (!overview) cardsByStop[idx].forEach(c => c.classList.add('on'));
      const t = overview ? 'Quiénes somos' : TITLES[idx];
      if (hudTitle.textContent !== t) { hudTitle.textContent = t; hudTitle.style.animation = 'none'; void hudTitle.offsetWidth; hudTitle.style.animation = ''; }
    }
    ticks.forEach((t, i) => t.style.setProperty('--p', clamp(u - i).toFixed(3)));
    const W = viewport.clientWidth, H = viewport.clientHeight;
    const [x, y, w, h] = rectAt(u);
    const fit = Math.min(W / w, H / h) * .9;
    const s = (w < BW * .9) ? Math.min(fit, mobile() ? 1.2 : 1.3) : fit;
    const tx = W / 2 - (x + w / 2) * s, ty = H / 2 - (y + h / 2) * s;
    if (!cam.init || reduce) Object.assign(cam, { x: tx, y: ty, s, init: true });
    cam.x = lerp(cam.x, tx, .16); cam.y = lerp(cam.y, ty, .16); cam.s = lerp(cam.s, s, .16);
    board.style.transform = `translate3d(${cam.x.toFixed(2)}px,${cam.y.toFixed(2)}px,0) scale(${cam.s.toFixed(4)})`;
    vpZoom.textContent = (cam.s / (Math.min(W / BW, H / BH) * .9)).toFixed(2) + '×';
  }

  /* =========================================================
     05 · LA CANCHA — video bien encuadrado
     ========================================================= */
  const pitch = $('#cancha'), videoCard = $('#videoCard'), pitchCopy = $('#pitchCopy'), vid = $('video', videoCard);
  function pitchFrame() {
    if (!inView(pitch)) return;
    const p = reduce ? .6 : prog(pitch), e = ease(clamp(p / .6));
    if (mobile()) {
      videoCard.style.transform = `scale(${(.88 + e * .12).toFixed(3)})`;
      pitchCopy.style.opacity = 1;
      pitchCopy.style.transform = 'none';
    } else {
      const tx = vw * .2 * (1 - e);
      videoCard.style.transform = `translate3d(${tx.toFixed(1)}px,0,0) rotateY(${(-10 * (1 - e)).toFixed(2)}deg) scale(${(.82 + e * .18).toFixed(3)})`;
      pitchCopy.style.opacity = (1 - clamp((p - .25) * 3)).toFixed(3);
      pitchCopy.style.transform = `translate3d(${(-e * 60).toFixed(1)}px,-50%,0)`;
    }
  }
  if (vid && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { en.isIntersecting ? vid.play().catch(() => {}) : vid.pause(); }, { threshold: .2 }).observe(vid);
  }

  /* ---------- Cámara de entrada en secciones de flujo ---------- */
  const cams = $$('[data-cam]');
  function camsFrame() {
    cams.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const d = clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1);
      el.style.transform = `perspective(1400px) translate3d(0,${(d * 60).toFixed(1)}px,${(-Math.abs(d) * 140).toFixed(1)}px) rotateX(${(d * -8).toFixed(2)}deg)`;
    });
  }

  /* ---------- Loop ---------- */
  let lastT = 0;
  function frame(time) {
    const dt = lastT ? Math.min(time - lastT, 64) : 16; lastT = time;
    if (introDone) { updateNow(); heroFrame(time); sponsorsFrame(dt); kitFrame(time, dt); storyFrame(); pitchFrame(); camsFrame(); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  addEventListener('resize', () => { vw = innerWidth; vh = innerHeight; measure(); });
  measure();
  if (document.fonts) document.fonts.ready.then(measure);
  addEventListener('load', measure);

  /* ---------- WhatsApp flotante ---------- */
  const wa = $('#wa'), waBtn = $('#waBtn');
  waBtn.addEventListener('click', () => { const o = wa.classList.toggle('open'); waBtn.setAttribute('aria-expanded', o); });
  document.addEventListener('click', e => { if (!wa.contains(e.target)) { wa.classList.remove('open'); waBtn.setAttribute('aria-expanded', 'false'); } });
})();

/* FAT WEB · V10 — "Somos FAT" · motor de scroll cinematográfico (vanilla, sin dependencias) */
(() => {
  // Misma experiencia en todos los celulares: no se desactivan animaciones por ahorro de batería
  const reduce = false;
  document.documentElement.classList.add('js');
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
     MÚSICA — usa "musica.mp3" si existe en el repo;
     si no, genera una base original con Web Audio (sin derechos de terceros)
     ========================================================= */
  const Music = (() => {
    const btn = $('#sound');
    let on = false, ctx = null, master = null, timer = null, file = null, fileOk = null, step = 0, nextT = 0;
    let pref = 'on'; try { pref = localStorage.getItem('fat-music') || 'on'; } catch (e) {}
    const BPM = 96, S16 = 60 / BPM / 4;
    const chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; // Am F C G
    const hz = m => 440 * Math.pow(2, (m - 69) / 12);
    function probeFile() {
      return new Promise(res => {
        const a = new Audio(); a.preload = 'auto'; a.loop = true; a.volume = .55;
        a.oncanplaythrough = () => { file = a; res(true); };
        a.onerror = () => res(false);
        a.src = 'musica.mp3';
        setTimeout(() => res(!!file), 2500);
      });
    }
    function voice(type, f, t, dur, gain, cutoff) {
      const o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
      o.type = type; o.frequency.setValueAtTime(f, t);
      fl.type = 'lowpass'; fl.frequency.value = cutoff || 2000;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + Math.min(.02 + dur * .3, .4)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(fl); fl.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05);
    }
    function kick(t) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + .18);
      g.gain.setValueAtTime(.9, t); g.gain.exponentialRampToValueAtTime(.001, t + .35);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + .4);
    }
    let noiseBuf = null;
    function hat(t, v) {
      if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate * .2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      n.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = 7000;
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + .06);
      n.connect(f); f.connect(g); g.connect(master); n.start(t); n.stop(t + .08);
    }
    function schedule() {
      while (nextT < ctx.currentTime + .12) {
        const s = step % 16, bar = Math.floor(step / 16) % 4, ch = chords[bar];
        if (s === 0 || s === 8 || s === 11) kick(nextT);
        if (s % 2 === 0) hat(nextT, s % 4 === 2 ? .12 : .05);
        if (s === 0 || s === 6 || s === 10) voice('sine', hz(ch[0] - 24), nextT, S16 * 3, .32, 400);
        if (s === 0) ch.forEach(m => voice('triangle', hz(m), nextT, S16 * 15, .05, 1400));
        if (s === 4 || s === 12) voice('sine', hz(ch[(s / 4) % 3] + 12), nextT, S16 * 2, .035, 3000);
        nextT += S16; step++;
      }
    }
    async function start() {
      if (on) return; on = true; ui();
      if (fileOk === null) fileOk = await probeFile();
      if (!on) return;
      if (fileOk && file) { file.play().catch(() => {}); return; }
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        ctx = new AC(); const comp = ctx.createDynamicsCompressor(); master = ctx.createGain();
        master.gain.value = 0; master.connect(comp); comp.connect(ctx.destination);
      }
      await ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime); master.gain.linearRampToValueAtTime(.22, ctx.currentTime + 1.5);
      nextT = ctx.currentTime + .05; clearInterval(timer); timer = setInterval(schedule, 25);
    }
    function stop() {
      on = false; ui();
      if (file) file.pause();
      if (ctx) { master.gain.linearRampToValueAtTime(0, ctx.currentTime + .4); setTimeout(() => { if (!on) clearInterval(timer); }, 450); }
    }
    function ui() { btn.setAttribute('aria-pressed', on); btn.setAttribute('aria-label', on ? 'Pausar música' : 'Activar música'); }
    btn.addEventListener('click', e => { e.stopPropagation(); if (on) { stop(); pref = 'off'; } else { start(); pref = 'on'; } try { localStorage.setItem('fat-music', pref); } catch (er) {} });
    // por defecto: arranca con el primer toque/click (los navegadores no permiten audio sin interacción)
    const first = () => { if (pref !== 'off') start(); ['pointerup', 'touchend', 'click', 'keydown'].forEach(ev => removeEventListener(ev, first, true)); };
    ['pointerup', 'touchend', 'click', 'keydown'].forEach(ev => addEventListener(ev, first, true));
    return { start };
  })();

  /* =========================================================
     INTRO — "Esto es FAT" → "Somos FAT"
     ========================================================= */
  const intro = $('#intro'), cuts = $$('.cut', intro), count = $('#introCount');
  const DUR = [360, 320, 720, 220, 280, 220, 280, 220, 320, 1300];
  let introDone = false; const timers = [];
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
  let started = false;
  function runIntro() {
    if (started) return; started = true;
    intro.classList.add('started');
    let t = 350;
    cuts.forEach((c, i) => {
      timers.push(setTimeout(() => {
        cuts.forEach(x => x.classList.remove('on'));
        c.classList.add('on');
        count.textContent = String(i + 1).padStart(2, '0');
      }, t));
      t += DUR[i];
    });
    timers.push(setTimeout(endIntro, t));
  }
  // Entrar: el toque habilita el sonido (requisito de todos los navegadores) y arranca la intro
  $('#gateBtn').addEventListener('click', () => { Music.start(); runIntro(); });
  $('#skip').addEventListener('click', () => { Music.start(); endIntro(); });
  addEventListener('wheel', () => { if (!started) runIntro(); else if (!introDone) endIntro(); }, { passive: true });
  addEventListener('touchmove', () => { if (!started) runIntro(); }, { passive: true });
  addEventListener('keydown', e => { if (introDone) return; if (!started) { Music.start(); runIntro(); } else if (e.key === 'Escape') endIntro(); });

  /* ---------- Títulos palabra por palabra ---------- */
  $$('.split-words').forEach(h => {
    let w = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const o = document.createElement('span'); o.className = 'wd';
            const i = document.createElement('span'); i.textContent = part; i.style.setProperty('--w', w++);
            o.appendChild(i); frag.appendChild(o);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(h);
  });

  /* ---------- Reveal ---------- */
  const reveals = [...$$('[data-reveal]'), ...$$('.split-words')];
  reveals.forEach(el => {
    if (!el.hasAttribute('data-reveal')) return;
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
     02 · SPONSORS — showcase horizontal (coverflow + desenfoque de movimiento)
     ========================================================= */
  const spx = $('#sponsors'), track = $('#spxTrack'), spcs = $$('.spc', track), spxNum = $('#spxNum'),
        spxBar = $('#spxBar'), spxGlow = $('#spxGlow');
  let spF = 0, spLastF = 0, spIdx = -1;
  function spxFrame() {
    if (!inView(spx)) return;
    const p = prog(spx);
    const target = clamp((p - .04) / .88) * (spcs.length - 1);
    spLastF = spF; spF = reduce ? target : lerp(spF, target, .14);
    const vel = Math.abs(spF - spLastF);
    const i0 = Math.floor(spF), i1 = Math.min(i0 + 1, spcs.length - 1), fr = spF - i0;
    const c = el => el.offsetLeft + el.offsetWidth / 2;
    const cx = lerp(c(spcs[i0]), c(spcs[i1]), fr);
    track.style.transform = `translate3d(${(vw / 2 - cx).toFixed(1)}px,0,0)`;
    spcs.forEach((el, i) => {
      const d = i - spF, ad = Math.abs(d);
      const blur = Math.min(ad > .6 ? (ad - .6) * 3 : 0, 4) + Math.min(vel * 40, 6);
      el.style.transform = `perspective(1400px) translateZ(${(-ad * 140).toFixed(1)}px) rotateY(${clamp(-d * 26, -60, 60).toFixed(2)}deg) scale(${(1 - Math.min(ad, 2) * .08).toFixed(3)})`;
      el.style.opacity = (1 - Math.min(ad, 2.2) * .32).toFixed(3);
      el.style.filter = blur > .2 ? `blur(${blur.toFixed(2)}px)` : 'none';
      el.style.setProperty('--sh', `${(150 - (1 - clamp(ad)) * 200).toFixed(1)}%`);
    });
    const idx = Math.round(spF);
    if (idx !== spIdx) {
      spIdx = idx;
      spxNum.textContent = String(idx + 1).padStart(2, '0');
      const brand = getComputedStyle(spcs[idx]).getPropertyValue('--brand').trim();
      spxGlow.style.setProperty('--glow', brand + '55');
    }
    spxBar.style.transform = `scaleX(${(spF / (spcs.length - 1)).toFixed(3)})`;
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
     04 · QUIÉNES SOMOS — cámara + cursor + tarjetas animadas
     ========================================================= */
  const story = $('#quienes-somos'), board = $('#board'), viewport = $('#storyViewport'),
        ticks = $$('.story-foot .ticks i'), hudTitle = $('#hudTitle'), vpZoom = $('#vpZoom'),
        cursor = $('#cursor'), speed = $('#speed');
  let BW = 1520, BH = 1520, ALL = [0, 0, BW, BH];
  const vals = $$('.g-vals .v', board);
  const stopEls = [0, 1, 2, 3, 4, 5].map(i => [$(`.g[data-k="${i}"]`, board)]).concat([[vals[0], vals[1]], [vals[2], vals[3]]]);
  let STOPS = stopEls.map(() => ALL);
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
  const allCards = $$('.g', board);
  const cam = { x: 0, y: 0, s: .3, init: false };
  const cur = { x: 200, y: 200, tx: 200, ty: 200, armed: false };
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
      allCards.forEach(c => { c.classList.toggle('on', overview); c.classList.remove('play'); });
      if (!overview) {
        const els = stopEls[idx];
        els.forEach(c => { c.classList.add('on'); void c.offsetWidth; c.classList.add('play'); });
        const [x, y, w] = STOPS[idx];
        cur.tx = x + w * .78; cur.ty = y + 46; cur.armed = true;
      } else { cur.tx = BW * .5; cur.ty = BH * .5; cur.armed = false; }
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
    const ox = cam.x, os = cam.s;
    cam.x = lerp(cam.x, tx, .16); cam.y = lerp(cam.y, ty, .16); cam.s = lerp(cam.s, s, .16);
    const v = (cam.x - ox) / Math.max(W, 1);
    const tilt = clamp(v * 60, -2.5, 2.5);
    board.style.transform = `translate3d(${cam.x.toFixed(2)}px,${cam.y.toFixed(2)}px,0) scale(${cam.s.toFixed(4)}) rotate(${tilt.toFixed(2)}deg)`;
    speed.style.opacity = clamp(Math.abs(v) * 40 + Math.abs(cam.s - os) * 8, 0, .9).toFixed(3);
    vpZoom.textContent = (cam.s / (Math.min(W / BW, H / BH) * .9)).toFixed(2) + '×';
    // cursor: viaja a la tarjeta activa y "hace click"
    const dx = cur.tx - cur.x, dy = cur.ty - cur.y;
    cur.x += dx * .12; cur.y += dy * .12;
    cursor.style.transform = `translate3d(${cur.x.toFixed(1)}px,${cur.y.toFixed(1)}px,0)`;
    if (cur.armed && Math.hypot(dx, dy) < 6) {
      cur.armed = false; cursor.classList.remove('click'); void cursor.offsetWidth; cursor.classList.add('click');
    }
  }

  /* =========================================================
     05 · LUGAR DE ENTRENAMIENTO — el video se expande a pantalla completa
     ========================================================= */
  const pitch = $('#cancha'), pv = $('#pitchVideo'), pitchCopy = $('#pitchCopy'), pitchEnd = $('#pitchEnd'),
        pitchShade = $('#pitchShade'), vid = $('video', pv), pvid = vid;
  function pitchFrame() {
    if (!inView(pitch)) return;
    const p = reduce ? 1 : prog(pitch), e = ease(clamp(p / .7));
    let H0, W0, cx0, cy0;
    if (mobile()) { W0 = vw * .72; H0 = Math.min(W0 * 16 / 9, vh * .6); W0 = H0 * 9 / 16; cx0 = vw / 2; cy0 = vh * .62; }
    else { H0 = vh * .78; W0 = H0 * 9 / 16; cx0 = vw * .68; cy0 = vh * .54; }
    const Wd = lerp(W0, vw, e), Hd = lerp(H0, vh, e), cx = lerp(cx0, vw / 2, e), cy = lerp(cy0, vh / 2, e);
    pv.style.setProperty('--ct', `${(cy - Hd / 2).toFixed(1)}px`);
    pv.style.setProperty('--cb', `${(vh - cy - Hd / 2).toFixed(1)}px`);
    pv.style.setProperty('--cl', `${(cx - Wd / 2).toFixed(1)}px`);
    pv.style.setProperty('--cr', `${(vw - cx - Wd / 2).toFixed(1)}px`);
    pv.style.setProperty('--cr2', `${(24 * (1 - e)).toFixed(1)}px`);
    pvid.style.setProperty('--vs', (1.18 - e * .18).toFixed(3));
    pitchCopy.style.opacity = (1 - clamp((p - .12) * 3.5)).toFixed(3);
    pitchShade.style.opacity = clamp((p - .55) * 3).toFixed(3);
    const ee = clamp((p - .7) / .2);
    pitchEnd.style.opacity = ee.toFixed(3);
    pitchEnd.style.transform = `translate3d(0,${((1 - ee) * 50).toFixed(1)}px,0) scale(${(1.1 - ee * .1).toFixed(3)})`;
  }
  if (vid && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { en.isIntersecting ? vid.play().catch(() => {}) : vid.pause(); }, { threshold: .05 }).observe(pitch);
  }

  /* =========================================================
     06 · CONVOCATORIA — tipografía cinética + capas flotantes
     ========================================================= */
  const join = $('#convocatoria'), kl1 = $('#kl1'), kl2 = $('#kl2');
  const floats = $$('[data-float]');
  function joinFrame() {
    if (!inView(join)) return;
    const r = join.getBoundingClientRect();
    const d = (r.top + r.height / 2 - vh / 2) / vh;
    const q = ease(clamp((vh - r.top) / (vh * .55)));
    kl1.style.transform = `translate3d(${((1 - q) * -45).toFixed(2)}%,0,0)`;
    kl2.style.transform = `translate3d(${((1 - q) * 45).toFixed(2)}%,0,0)`;
    kl1.style.opacity = kl2.style.opacity = q.toFixed(3);
    floats.forEach(el => {
      const rr = el.getBoundingClientRect();
      const dd = (rr.top + rr.height / 2 - vh / 2) / vh;
      el.style.transform = `translate3d(0,${(dd * parseFloat(el.dataset.float) * -120).toFixed(1)}px,0)`;
    });
  }

  /* ---------- Loop ---------- */
  let lastT = 0;
  function frame(time) {
    const dt = lastT ? Math.min(time - lastT, 64) : 16; lastT = time;
    if (introDone) { updateNow(); heroFrame(time); spxFrame(); kitFrame(time, dt); storyFrame(); pitchFrame(); joinFrame(); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  addEventListener('resize', () => { vw = innerWidth; vh = innerHeight; measure(); });
  measure();
  if (document.fonts) document.fonts.ready.then(measure);
  addEventListener('load', measure);

  /* =========================================================
     WhatsApp — un solo botón → elegí: Gonzalo Ríos / Enzo Valenzuela Massa
     ========================================================= */
  const NUM = { gonzalo: '5493813323280', enzo: '5493815560086' };
  const MSG = {
    sponsor: 'Hola, quiero información para ser sponsor de FAT',
    jugar: 'Hola, quiero formar parte del seleccionado de Tucumán (FAT)',
    general: 'Hola, quiero información sobre FAT'
  };
  const sheet = $('#waSheet'), o1 = $('#waOpt1'), o2 = $('#waOpt2');
  let lastFocus = null;
  function openWA(ctxName) {
    const m = encodeURIComponent(MSG[ctxName] || MSG.general);
    o1.href = `https://wa.me/${NUM.gonzalo}?text=${m}`;
    o2.href = `https://wa.me/${NUM.enzo}?text=${m}`;
    lastFocus = document.activeElement;
    sheet.hidden = false; o1.focus();
  }
  function closeWA() { sheet.hidden = true; if (lastFocus) lastFocus.focus(); }
  $$('[data-wa]').forEach(b => b.addEventListener('click', () => openWA(b.dataset.wa)));
  $$('[data-close]', sheet).forEach(b => b.addEventListener('click', closeWA));
  [o1, o2].forEach(a => a.addEventListener('click', () => setTimeout(closeWA, 300)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) closeWA(); });
  /* ---------- Ver todos los sponsors ---------- */
  const allSp = $('#allSp'), allGrid = $('#allGrid'), allBtn = $('#spxAll');
  if (allSp) {
    allGrid.innerHTML = $$('#spxTrack .spc').map((c, n) => {
      const st = c.getAttribute('style'), plate = $('.spc-plate', c), img = $('img', plate);
      const rubro = $$('.spc-top span', c)[1].textContent;
      return `<article class="all-card" style="${st};--n:${n}"><div class="all-plate${plate.classList.contains('cover') ? ' cover' : ''}"><img src="${img.getAttribute('src')}" alt="${img.alt}" loading="lazy"></div><div><small>${rubro}</small><b>${$('h3', c).innerHTML}</b></div></article>`;
    }).join('');
    let back = null;
    const openAll = () => { back = document.activeElement; allSp.hidden = false; $('.all-close', allSp).focus(); body.style.overflow = 'hidden'; };
    const closeAll = () => { allSp.hidden = true; body.style.overflow = ''; if (back) back.focus(); };
    allBtn.addEventListener('click', openAll);
    $$('[data-close-all]', allSp).forEach(b => b.addEventListener('click', closeAll));
    addEventListener('keydown', e => { if (e.key === 'Escape' && !allSp.hidden) closeAll(); });
  }
})();

/* Torneo Regional · invitación al público · FAT
   - Animaciones de entrada al hacer scroll.
   - Botón para activar/desactivar el sonido del video (arranca mudo: los navegadores no permiten sonido automático).
   - Pausa el video cuando no está en pantalla. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  var items = document.querySelectorAll('.reveal');
  var show = function (el) { el.classList.add('in'); };
  var hasIO = 'IntersectionObserver' in window;

  if (hasIO) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i, 5) * 90 + 'ms';
      io.observe(el);
    });
  }
  setTimeout(function () { items.forEach(show); }, hasIO ? 2500 : 0);

  var video = document.getElementById('video');
  var btn = document.getElementById('sound');
  if (!video) return;

  if (btn) {
    btn.addEventListener('click', function () {
      video.muted = !video.muted;
      if (!video.muted) { video.volume = 1; video.play().catch(function () {}); }
      btn.setAttribute('aria-pressed', String(!video.muted));
      btn.textContent = video.muted ? '🔊 Activar sonido' : '🔇 Silenciar';
    });
  }

  if (hasIO) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { video.play().catch(function () {}); }
        else { video.pause(); }
      });
    }, { threshold: 0.25 }).observe(video);
  }
})();

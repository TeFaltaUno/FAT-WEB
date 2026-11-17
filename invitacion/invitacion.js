/* Invitación oficial · Torneo Regional · FAT
   - Personaliza el saludo con ?para=Nombre (solo texto, nunca HTML).
   - Animaciones de entrada al hacer scroll. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  // Saludo personalizado: ?para=Selección%20de%20Salta
  try {
    var raw = new URLSearchParams(window.location.search).get('para');
    if (raw) {
      var nombre = raw
        .replace(/[\u0000-\u001F\u007F<>{}\[\]\\`"]/g, '') // fuera caracteres de control y de código
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 60);
      if (nombre) {
        var saludo = document.getElementById('saludo');
        if (saludo) saludo.textContent = 'Estimados/as ' + nombre + ':';
        document.title = 'Invitación para ' + nombre + ' · Torneo Regional · FAT';
      }
    }
  } catch (e) { /* sin personalización */ }

  // Entradas al hacer scroll
  var items = document.querySelectorAll('.reveal');
  var show = function (el) { el.classList.add('in'); };
  if (!('IntersectionObserver' in window)) {
    items.forEach(show);
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  items.forEach(function (el, i) {
    el.style.transitionDelay = Math.min(i, 5) * 90 + 'ms';
    io.observe(el);
  });
  // Seguridad: si algo falla, mostrar todo a los 2,5 s
  setTimeout(function () { items.forEach(show); }, 2500);
})();

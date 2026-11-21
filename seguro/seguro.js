/* Seguro obligatorio · Torneo Regional 29/11 · FAT
   - Muestra el alias y los datos de pago desde config.js (no desde el link).
   - Botón para copiar alias / CBU.
   - Cuenta regresiva hasta el cierre del pago (martes 24/11 23:59).
   - Arma el mensaje de WhatsApp con nombre y categoría para mandar el comprobante.
   - Animaciones de entrada al hacer scroll.
   Seguridad: todo el texto se escribe con textContent (nunca innerHTML) y los
   valores que van a un link se validan y se codifican. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  var CFG = window.FAT_SEGURO || {};
  var $ = function (id) { return document.getElementById(id); };
  var clean = function (v, max) {
    return typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max || 80) : '';
  };

  /* ── Entradas al hacer scroll ── */
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

  /* ── Aviso flotante ── */
  var toast = $('toast');
  var toastTimer;
  function notify(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2200);
  }

  /* ── Datos de pago ── */
  var data = {
    alias: clean(CFG.alias, 40),
    titular: clean(CFG.titular, 80),
    banco: clean(CFG.banco, 60),
    cbu: clean(CFG.cbu, 30).replace(/\D/g, ''),
    monto: clean(CFG.monto, 30)
  };
  if (data.cbu.length !== 22) data.cbu = '';

  var aliasEl = $('alias-value');
  if (data.alias) {
    aliasEl.textContent = data.alias;
    $('copy-alias').hidden = false;
    $('pay-pending').hidden = true;
  } else {
    aliasEl.classList.add('pending');
  }
  ['monto', 'titular', 'banco', 'cbu'].forEach(function (k) {
    if (!data[k]) return;
    $('pd-' + k).textContent = data[k];
    document.querySelector('[data-field="' + k + '"]').hidden = false;
  });

  /* ── Copiar ── */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      if (ok) { resolve(); } else { reject(); }
    });
  }
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-copy');
      var value = data[key];
      if (!value) return;
      copyText(value).then(function () {
        notify(key === 'alias' ? 'Alias copiado ✓' : 'CBU/CVU copiado ✓');
        if (btn.classList.contains('copy')) {
          var label = btn.querySelector('span');
          btn.classList.add('ok');
          label.textContent = '¡Copiado!';
          setTimeout(function () { btn.classList.remove('ok'); label.textContent = 'Copiar alias'; }, 2000);
        }
      }, function () {
        notify('No se pudo copiar. Mantené apretado el texto para copiarlo.');
      });
    });
  });

  /* ── Cuenta regresiva ── */
  var deadline = Date.parse(CFG.cierre || '2026-11-24T23:59:59-03:00');
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  function tick() {
    var left = deadline - Date.now();
    if (isNaN(deadline)) return;
    if (left <= 0) {
      $('count-grid').hidden = true;
      $('count-closed').hidden = false;
      $('count-label').textContent = 'Plazo de pago';
      var pill = $('deadline-pill');
      pill.textContent = 'Plazo cerrado · 24/11';
      pill.classList.add('closed');
      return true;
    }
    var mins = Math.floor(left / 60000);
    $('cd-d').textContent = pad(Math.floor(mins / 1440));
    $('cd-h').textContent = pad(Math.floor((mins % 1440) / 60));
    $('cd-m').textContent = pad(mins % 60);
    return false;
  }
  if (!tick()) {
    var timer = setInterval(function () { if (tick()) clearInterval(timer); }, 15000);
  }

  /* ── Comprobante por WhatsApp ── */
  var form = $('proof-form');
  var nameInput = $('pf-name');
  var err = $('pf-error');
  var PHONE = /^\d{10,15}$/;

  var lastBtn = null;
  form.querySelectorAll('[data-to]').forEach(function (b) {
    b.addEventListener('click', function () { lastBtn = b; });
  });
  nameInput.addEventListener('input', function () { err.hidden = true; });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = e.submitter || lastBtn;
    var to = btn && btn.getAttribute ? btn.getAttribute('data-to') : '';
    if (!PHONE.test(to || '')) return;

    var name = clean(nameInput.value, 60).replace(/[<>]/g, '').replace(/\s+/g, ' ');
    if (name.length < 3) {
      err.hidden = false;
      nameInput.focus();
      return;
    }
    var checked = form.querySelector('input[name="categoria"]:checked');
    var cat = checked && (checked.value === 'Fútbol 5' || checked.value === 'Fútbol 7') ? checked.value : 'Fútbol 5';

    var rama = { femenino: ' (femenino)', masculino: ' (masculino)' }[form.getAttribute('data-rama')] || '';
    var msg = 'Hola, soy ' + name + '. Pagué el seguro para jugar el Torneo Regional del 29/11 en ' +
      cat + rama + '. Les mando el comprobante.';
    window.open('https://wa.me/' + to + '?text=' + encodeURIComponent(msg), '_blank', 'noopener,noreferrer');
  });

  /* ── Contacto de Caruso (opcional) ── */
  var car = CFG.caruso || {};
  var links = $('caruso-links');
  var tel = clean(car.telefono, 20).replace(/\D/g, '');
  var ig = clean(car.instagram, 30).replace(/^@/, '');
  function addLink(href, text) {
    var a = document.createElement('a');
    a.className = 'btn';
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = text;
    links.appendChild(a);
  }
  if (PHONE.test(tel)) addLink('https://wa.me/' + tel, 'WhatsApp de Caruso');
  if (/^[A-Za-z0-9._]{1,30}$/.test(ig)) addLink('https://www.instagram.com/' + ig + '/', 'Instagram de Caruso');
  if (!links.children.length) links.hidden = true;
})();

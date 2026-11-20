(function () {
  /* Set to false once the form is connected to a real backend. */
  var DEMO_MODE = true;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- typing line ---------- */
  var phrases = [
    'ENSTTIC, Senia-Oran',
    'A university hackathon',
    '15 hours to build',
  ];
  var typedEl = document.getElementById('typed');
  /* reserve the width of the longest phrase so the ~$ prompt stays put while typing */
  var longest = 0;
  phrases.forEach(function (p) { if (p.length > longest) longest = p.length; });
  typedEl.parentNode.style.minWidth = (longest + 1) + 'ch';
  typedEl.textContent = phrases[0];
  var pi = 0;
  function erase() {
    var s = typedEl.textContent;
    if (s.length) { typedEl.textContent = s.slice(0, -1); setTimeout(erase, 22); }
    else { pi = (pi + 1) % phrases.length; typeIn(0); }
  }
  function typeIn(n) {
    var p = phrases[pi];
    if (n <= p.length) { typedEl.textContent = p.slice(0, n); setTimeout(function () { typeIn(n + 1); }, 48); }
    else { setTimeout(erase, 2400); }
  }
  if (!reduce) setTimeout(erase, 3000);

  /* ---------- event countdown ---------- */
  var daysEl = document.getElementById('days-left');
  var eventDay = new Date(2026, 11, 3).getTime();
  function updateCountdown() {
    var left = eventDay - Date.now();
    if (left <= 0) {
      daysEl.textContent = 'Event started';
      return;
    }
    var days = Math.floor(left / 86400000);
    var hours = Math.floor((left % 86400000) / 3600000);
    var minutes = Math.floor((left % 3600000) / 60000);
    var seconds = Math.floor((left % 60000) / 1000);
    daysEl.textContent = days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's to go';
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ---------- scramble headings ---------- */
  var sg = '01#$%&@!<>/\\|[]{}';
  function scramble(el) {
    var final = el.getAttribute('data-final');
    var frames = 0, total = 20;
    var iv = setInterval(function () {
      frames++;
      var s = '';
      for (var i = 0; i < final.length; i++) {
        if (final.charAt(i) === ' ' || i < final.length * frames / total) s += final.charAt(i);
        else s += sg.charAt(Math.floor(Math.random() * sg.length));
      }
      el.textContent = s;
      if (frames >= total) { clearInterval(iv); el.textContent = final; }
    }, 40);
  }
  var heads = document.querySelectorAll('.scr');
  for (var h = 0; h < heads.length; h++) {
    heads[h].setAttribute('data-final', heads[h].textContent);
    heads[h].setAttribute('aria-label', heads[h].textContent);
  }
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { scramble(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.8 });
    for (var j = 0; j < heads.length; j++) io.observe(heads[j]);
  }

  /* ---------- scroll reveal ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js');
    var targets = document.querySelectorAll('.hero > *, .sec-head, .win, .step, footer');
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        ro.unobserve(el);
        el.classList.add('in');
        var wait = (parseFloat(el.style.getPropertyValue('--d')) || 0) * 1000 + 1000;
        setTimeout(function () {
          el.classList.remove('reveal', 'in');
          el.style.removeProperty('--d');
        }, wait);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    Array.prototype.forEach.call(targets, function (el) {
      var i = 0;
      if (el.classList.contains('step') || el.parentNode.classList.contains('hero')) {
        var n = el.previousElementSibling;
        while (n) { i++; n = n.previousElementSibling; }
      }
      el.style.setProperty('--d', (i * 0.1).toFixed(2) + 's');
      el.classList.add('reveal');
      ro.observe(el);
    });
  }

  /* ---------- registration form ---------- */
  var rf = document.getElementById('reg-form');
  var body = rf.querySelector('.form-body');
  var st = document.getElementById('f-status');
  var ok = document.getElementById('f-success');
  var sTitle = document.getElementById('s-title');
  var sText = document.getElementById('s-text');

  if (DEMO_MODE) st.textContent = 'Demo form. Nothing is sent or stored.';

  var rules = {
    name: { id: 'f-name', err: 'e-name', test: function (v) { return v.length >= 2; }, msg: 'Enter your full name.' },
    email: { id: 'f-email', err: 'e-email', test: function (v) { return /^\S+@\S+\.\S+$/.test(v); }, msg: 'Enter a valid email address.' },
    phone: { id: 'f-phone', err: 'e-phone', test: function (v) { return /^\+?[\d\s().-]{8,}$/.test(v); }, msg: 'Enter a valid phone number.' },
    school: { id: 'f-school', err: 'e-school', test: function (v) { return v.length >= 2; }, msg: 'Enter your university or institution.' }
  };

  function setError(r, message) {
    var input = document.getElementById(r.id);
    document.getElementById(r.err).textContent = message;
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  Object.keys(rules).forEach(function (k) {
    var r = rules[k];
    var input = document.getElementById(r.id);
    /* clear the error as soon as the value becomes valid */
    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid') === 'true' && r.test(input.value.trim())) setError(r, '');
    });
    /* validate when leaving a field that has content */
    input.addEventListener('blur', function () {
      var v = input.value.trim();
      if (v && !r.test(v)) setError(r, r.msg);
    });
  });

  rf.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstBad = null;
    var values = {};
    Object.keys(rules).forEach(function (k) {
      var r = rules[k];
      var v = document.getElementById(r.id).value.trim();
      values[k] = v;
      if (r.test(v)) setError(r, '');
      else { setError(r, r.msg); if (!firstBad) firstBad = document.getElementById(r.id); }
    });
    if (firstBad) {
      st.className = 'status bad';
      st.textContent = 'Please fix the highlighted fields.';
      firstBad.focus();
      return;
    }
    /* TODO: send `values` to the backend here, then show the success state. */
    var first = values.name.split(/\s+/)[0];
    sTitle.textContent = "You're in, " + first + '.';
    sText.textContent = DEMO_MODE
      ? 'Demo only: nothing was sent. In the live version, your confirmation will go to ' + values.email + '.'
      : 'Your place is reserved. We will contact you at ' + values.email + ' with the next steps.';
    body.hidden = true;
    ok.hidden = false;
    ok.focus();
  });
})();
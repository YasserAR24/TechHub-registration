(function () {
  /* Paste your Google Apps Script web app URL here. While empty, the form runs in demo mode (nothing is sent). */
  var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwH4mC_ywdNRfC_RdzYVOdo6pVyYbTN2GWVeYnfvB27Zuy_sHIFQj2Kflj-v5Ka-LpK/exec';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- typing line ---------- */
  var phrases = [
    'IGENERGY CLUB...',
    'ENSTTIC, Senia-Oran',
    'Competition',
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
  var eventDay = new Date(2026, 11, 5).getTime();
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
    var targets = document.querySelectorAll('.hero > *, .sec-head, .win, footer');
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
      if (el.parentNode.classList.contains('hero')) {
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
  var submitBtn = document.getElementById('f-submit');
  var ok = document.getElementById('f-success');
  var sTitle = document.getElementById('s-title');
  var sText = document.getElementById('s-text');

  if (!SCRIPT_URL) st.textContent = 'Demo form. Nothing is sent or stored.';

  var PHONE_MSG = 'Phone must be 10 digits and start with 05, 06 or 07.';
  var tests = {
    name: { test: function (v) { return v.length >= 2; }, msg: 'Enter a full name.' },
    phone: { test: function (v) { return /^0[567]\d{8}$/.test(v); }, msg: PHONE_MSG },
    email: { test: function (v) { return /^\S+@\S+\.\S+$/.test(v); }, msg: 'Enter a valid email address.' }
  };
  var team = { id: 't-name', err: 'e-t-name', test: function (v) { return v.length >= 2; }, msg: 'Enter a team name.' };
  var emptyMsg = { name: 'Enter a full name.', phone: PHONE_MSG, email: 'Enter an email address.' };

  /* people: leader + members 01, 02 (required) + member 03 (optional) */
  var people = [];
  Array.prototype.forEach.call(rf.querySelectorAll('fieldset[data-person]'), function (fs) {
    var p = fs.getAttribute('data-person');
    people.push({
      key: p,
      optional: fs.hasAttribute('data-optional'),
      fields: ['name', 'phone', 'email'].map(function (k) {
        return { kind: k, id: p + '-' + k, err: 'e-' + p + '-' + k, input: document.getElementById(p + '-' + k) };
      })
    });
  });

  function setError(r, message) {
    var input = document.getElementById(r.id);
    document.getElementById(r.err).textContent = message;
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }
  function validTest(f) { return f.kind ? tests[f.kind].test : f.test; }
  function badMsg(f) { return f.kind ? tests[f.kind].msg : f.msg; }

  var all = [team];
  people.forEach(function (p) { p.fields.forEach(function (f) { all.push(f); }); });
  all.forEach(function (r) {
    var input = document.getElementById(r.id);
    input.addEventListener('input', function () {
      /* phone: digits only, max 10 */
      if (r.kind === 'phone') input.value = input.value.replace(/\D/g, '').slice(0, 10);
      var v = input.value.trim();
      if (input.getAttribute('aria-invalid') === 'true' && v && validTest(r)(v)) setError(r, '');
    });
    input.addEventListener('blur', function () {
      var v = input.value.trim();
      if (v && !validTest(r)(v)) setError(r, badMsg(r));
    });
  });

  function finish(data) {
    var leaderFirst = data.members[0].name.split(/\s+/)[0];
    sTitle.textContent = 'Team ' + data.team_name + ' is in, ' + leaderFirst + '.';
    sText.textContent = SCRIPT_URL
      ? 'Your team is registered (' + data.members.length + ' members), We will contact ' + data.members[0].email + ' for confirmation.'
      : 'Demo only: nothing was sent. In the live version, the confirmation will go to ' + data.members[0].email + '.';
    body.hidden = true;
    ok.hidden = false;
    ok.focus();
  }

  function send(data) {
    var labels = ['leader', 'member1', 'member2', 'member3'];
    var params = new URLSearchParams();
    params.append('team_name', data.team_name);
    params.append('club', data.club ? 'Yes' : 'No');
    data.members.forEach(function (m, i) {
      params.append(labels[i] + '_name', m.name);
      params.append(labels[i] + '_phone', m.phone);
      params.append(labels[i] + '_email', m.email);
    });
    /* no-cors: Apps Script does not send CORS headers; the request still reaches the sheet */
    return fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: params });
  }

  rf.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstBad = null;
    function flag(r, msg) { setError(r, msg); if (!firstBad) firstBad = document.getElementById(r.id); }

    var data = { team_name: document.getElementById('t-name').value.trim(), club: document.getElementById('t-club').checked, members: [] };
    if (!team.test(data.team_name)) flag(team, team.msg); else setError(team, '');

    people.forEach(function (p) {
      var vals = {};
      var anyFilled = false;
      p.fields.forEach(function (f) { vals[f.kind] = f.input.value.trim(); if (vals[f.kind]) anyFilled = true; });
      /* optional member 03: skipped entirely if left blank, fully required once started */
      var skip = p.optional && !anyFilled;
      p.fields.forEach(function (f) {
        var v = vals[f.kind];
        if (skip) { setError(f, ''); return; }
        if (!v) flag(f, emptyMsg[f.kind]);
        else if (!tests[f.kind].test(v)) flag(f, tests[f.kind].msg);
        else setError(f, '');
      });
      if (!skip) data.members.push(vals);
    });

    if (firstBad) {
      st.className = 'status bad';
      st.textContent = 'Please fix the highlighted fields.';
      firstBad.focus();
      return;
    }

    /* duplicate emails or phones within the team */
    var seenE = {}, seenP = {};
    for (var i = 0; i < data.members.length; i++) {
      var em = data.members[i].email.toLowerCase(), ph = data.members[i].phone;
      if (seenE[em] || seenP[ph]) {
        var isEmail = !!seenE[em];
        var kind = isEmail ? 'email' : 'phone';
        var val = isEmail ? em : ph;
        var dup = people.filter(function (p) {
          var f = p.fields[isEmail ? 2 : 1].input.value.trim();
          return (isEmail ? f.toLowerCase() : f) === val;
        })[1];
        var fld = dup.fields[isEmail ? 2 : 1];
        setError(fld, 'This ' + kind + ' is already used in your team.');
        fld.input.focus();
        st.className = 'status bad';
        st.textContent = 'Each team member needs a different ' + kind + '.';
        return;
      }
      seenE[em] = true; seenP[ph] = true;
    }

    if (!SCRIPT_URL) { finish(data); return; }

    submitBtn.disabled = true;
    st.className = 'status';
    st.textContent = 'Sending...';
    send(data).then(function () { finish(data); }).catch(function () {
      submitBtn.disabled = false;
      st.className = 'status bad';
      st.textContent = 'Could not send. Check your connection and try again.';
    });
  });
})();
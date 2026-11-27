(function () {
  /* Paste your Google Apps Script web app URL here. While empty, the form runs in demo mode (nothing is sent). */
  var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxLBsqAU7BiWwtRRUlJXprt7VVEHX87kjN7Uqhe-OX-AO_rBPak2yWYJbje-mdGumAx/exec';
  /* Event registration uses the same web app: Code.gs sorts rows into the Competition and Event tabs. */
  var EVENT_SCRIPT_URL = SCRIPT_URL;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- typing line ---------- */
  var phrases = [
    'IGENERGY club...',
    'Presents...',
    'AI Competition',
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
    daysEl.textContent = days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's';
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

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

  /* POST to Apps Script and reject if the script refused the registration */
  function post(url, params) {
    /* give up after 60s so the button never stays stuck; Code.gs ignores an identical resend */
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl && setTimeout(function () { ctrl.abort(); }, 60000);
    return fetch(url, { method: 'POST', body: params, signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.json(); })
      .catch(function () { throw new Error('Could not send. Check your connection and try again.'); })
      .then(function (res) { if (!res.ok) throw new Error(res.error); })
      .finally(function () { clearTimeout(timer); });
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

  /* Team registration closes after December 1, 2026 (event registration is unaffected). */
  var teamDeadline = new Date(2026, 11, 1, 23, 59, 59, 999).getTime();
  var teamDeadlineTimer = document.getElementById('team-deadline-timer');
  function teamRegistrationClosed() { return Date.now() > teamDeadline; }
  function updateTeamDeadline() {
    var remaining = teamDeadline - Date.now();
    if (remaining <= 0) {
      teamDeadlineTimer.textContent = 'Team registration closed';
      teamDeadlineTimer.className = 'deadline-timer closed';
      rf.querySelectorAll('input, button').forEach(function (control) { control.disabled = true; });
      st.className = 'status bad';
      st.textContent = 'Team registration closed on December 1, 2026.';
      return;
    }
    var days = Math.floor(remaining / 86400000);
    var hours = Math.floor((remaining % 86400000) / 3600000);
    var minutes = Math.floor((remaining % 3600000) / 60000);
    var seconds = Math.floor((remaining % 60000) / 1000);
    teamDeadlineTimer.textContent =
      days + 'd ' +
      String(hours).padStart(2, '0') + 'h ' +
      String(minutes).padStart(2, '0') + 'm ' +
      String(seconds).padStart(2, '0') + 's'
      + ' left to register your team';
  }
  updateTeamDeadline();
  setInterval(updateTeamDeadline, 1000);

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
  all.forEach(watch);
  function watch(r) {
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
  }

  function finish(data) {
    var names = data.members.map(function (m) { return m.name; });
    var leader = names[0];
    var others = names.slice(1);
    sTitle.textContent = 'Team ' + data.team_name + ' is in.';
    sText.textContent =
      'Leader: ' + leader + '.\n' +
      'Members: ' + others.join(', ') + '.\n' +
      (SCRIPT_URL
        ? 'We will contact ' + data.members[0].email + ' for confirmation.'
        : 'Demo only: nothing was sent. The confirmation would go to ' + data.members[0].email + '.');
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
    return post(SCRIPT_URL, params);
  }

  rf.addEventListener('submit', function (e) {
    e.preventDefault();
    if (teamRegistrationClosed()) {
      updateTeamDeadline();
      return;
    }
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
    send(data).then(function () { finish(data); }).catch(function (err) {
      submitBtn.disabled = false;
      st.className = 'status bad';
      st.textContent = err.message;
    });
  });

  /* ---------- event (attendee) form ---------- */
  var ef = document.getElementById('event-form');
  var evStatus = document.getElementById('ev-status');
  var evBtn = document.getElementById('ev-submit');
  var evOk = document.getElementById('ev-success');
  var evFields = ['name', 'phone', 'email'].map(function (k) {
    return { kind: k, id: 'ev-' + k, err: 'e-ev-' + k };
  });
  evFields.forEach(watch);

  var wsBoxes = Array.prototype.slice.call(ef.querySelectorAll('input[name="workshop"]'));
  function chosenWorkshops() {
    return wsBoxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
  }
  function setWorkshopError(message) {
    document.getElementById('e-ev-ws').textContent = message;
    wsBoxes.forEach(function (b) {
      if (message) b.setAttribute('aria-invalid', 'true');
      else b.removeAttribute('aria-invalid');
    });
  }
  wsBoxes.forEach(function (b) {
    b.addEventListener('change', function () { if (chosenWorkshops().length) setWorkshopError(''); });
  });

  if (!EVENT_SCRIPT_URL) {
    evBtn.disabled = true;
    evBtn.style.cursor = 'not-allowed';
    evStatus.textContent = 'Event registration is not open yet.';
  }

  ef.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!EVENT_SCRIPT_URL) return;
    var firstBad = null;
    var params = new URLSearchParams();
    var email = '';
    evFields.forEach(function (f) {
      var input = document.getElementById(f.id);
      var v = input.value.trim();
      var msg = !v ? emptyMsg[f.kind] : (tests[f.kind].test(v) ? '' : tests[f.kind].msg);
      setError(f, msg);
      if (msg && !firstBad) firstBad = input;
      if (f.kind === 'email') email = v;
      params.append(f.kind, v);
    });
    var workshops = chosenWorkshops();
    setWorkshopError(workshops.length ? '' : 'Choose one workshop.');
    if (!workshops.length && !firstBad) firstBad = wsBoxes[0];
    params.append('workshop', workshops[0] || '');
    if (firstBad) {
      evStatus.className = 'status bad';
      evStatus.textContent = 'Please fix the highlighted fields.';
      firstBad.focus();
      return;
    }
    evBtn.disabled = true;
    evStatus.className = 'status';
    evStatus.textContent = 'Sending...';
    post(EVENT_SCRIPT_URL, params).then(function () {
      document.getElementById('ev-text').textContent = email + ', We wait for you at 5th December.';
      ef.querySelector('.form-body').hidden = true;
      evOk.hidden = false;
      evOk.focus();
    }).catch(function (err) {
      evBtn.disabled = false;
      evStatus.className = 'status bad';
      evStatus.textContent = err.message;
    });
  });

  /* ---------- competition / event switch ---------- */
  var note = document.getElementById('reg-note');
  var tabs = [
    { btn: document.getElementById('tab-comp'), form: rf, note: note.textContent },
    { btn: document.getElementById('tab-event'), form: ef, note: 'Register to attend the event. No team needed.' }
  ];
  function select(i) {
    tabs.forEach(function (t, n) {
      var on = n === i;
      t.btn.setAttribute('aria-selected', String(on));
      t.btn.tabIndex = on ? 0 : -1;
      t.btn.classList.toggle('solid', on);
      t.form.hidden = !on;
    });
    note.textContent = tabs[i].note;
    teamDeadlineTimer.hidden = i !== 0;
  }
  tabs.forEach(function (t, i) {
    t.btn.addEventListener('click', function () { select(i); });
    t.btn.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      var next = 1 - i;
      select(next);
      tabs[next].btn.focus();
    });
  });
})();
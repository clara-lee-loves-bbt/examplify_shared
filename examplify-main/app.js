/* =========================================================================
   Examplify practice clone
   ========================================================================= */
(function () {
  'use strict';

  var EXAMS = window.EXAMPLIFY_EXAMS || [];
  var STORE = 'examplify:v1:';

  /* ---------------------------------------------------------------- helpers */
  var $ = function (id) { return document.getElementById(id); };

  /* Bind a handler only when the element is actually present. Markup and script
     can drift apart; a mismatch in one panel must never abort the rest of the
     app's wiring (which is how the paper picker used to disappear). */
  function on(id, event, handler) {
    var node = $(id);
    if (node) node.addEventListener(event, handler);
    return node;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* Examplify counts in MM:SS, so a 90-minute paper reads 90:00, not 1:30:00. */
  function fmtClock(sec) {
    sec = Math.max(0, sec);
    var m = Math.floor(sec / 60), s = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function normalize(s) {
    return String(s == null ? '' : s)
      .replace(/[\u2018\u2019\u201C\u201D]/g, "'")
      .replace(/"/g, "'")
      .replace(/\s+/g, '');
  }

  /* ------------------------------------------------------------ highlighting */
  var PY_KEYWORDS = {};
  ('def return if elif else for while in not and or lambda from import True False None ' +
   'is pass break continue global nonlocal as with yield try except finally raise class ' +
   'del assert').split(' ').forEach(function (k) { PY_KEYWORDS[k] = true; });

  var PY_BUILTINS = {};
  ('print range len map filter reduce sum abs max min str int float tuple list dict set ' +
   'round ord chr all any sorted reversed enumerate zip bool pow divmod type isinstance ' +
   'repr id hash iter next input format').split(' ').forEach(function (k) { PY_BUILTINS[k] = true; });

  var TOKEN_RE = /(#[^\n]*)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|(\s+)|([^\sA-Za-z_0-9])/g;

  /* Shared "eliminate this option" icon. currentColor so CSS can tint it. */
  var EYE_SVG = '<svg width="24" height="18" viewBox="0 0 24 18" fill="none">' +
    '<path d="M12 3C6.5 3 2.2 7.1 1 9c1.2 1.9 5.5 6 11 6s9.8-4.1 11-6c-1.2-1.9-5.5-6-11-6z" stroke="currentColor" stroke-width="1.5"/>' +
    '<circle cx="12" cy="9" r="3" stroke="currentColor" stroke-width="1.5"/></svg>';

  function highlightCode(src) {
    var out = '';
    var lastKw = '';
    var m;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(src)) !== null) {
      var txt = m[0];
      if (m[1]) {
        out += '<span class="tok-com">' + esc(txt) + '</span>';
      } else if (m[2]) {
        out += '<span class="tok-str">' + esc(txt) + '</span>';
      } else if (m[3]) {
        out += '<span class="tok-num">' + esc(txt) + '</span>';
      } else if (m[4]) {
        var cls = null;
        if (PY_KEYWORDS[txt]) cls = 'tok-kw';
        else if (lastKw === 'def') cls = 'tok-def';
        else if (PY_BUILTINS[txt]) cls = 'tok-bi';
        out += cls ? '<span class="' + cls + '">' + esc(txt) + '</span>' : esc(txt);
        if (PY_KEYWORDS[txt]) lastKw = txt;
      } else {
        out += esc(txt);
      }
    }
    return out;
  }

  /* Render code that may contain {{n}} blank chips. */
  function renderCode(code, filled) {
    var parts = String(code).split(/(\{\{\d+\}\})/);
    var html = parts.map(function (p) {
      var b = /^\{\{(\d+)\}\}$/.exec(p);
      if (b) {
        var n = b[1];
        var isFilled = filled && filled[n];
        return '<span class="blank-chip' + (isFilled ? ' filled' : '') + '">' + n + '</span>';
      }
      return highlightCode(p);
    }).join('');
    var pre = el('pre', 'code');
    pre.innerHTML = html;
    return pre;
  }

  /* Paragraph text: `segments` in backticks become inline code. */
  function renderParagraph(text) {
    var p = el('p', 'stem-text');
    var parts = String(text).split(/(`[^`]+`)/);
    p.innerHTML = parts.map(function (part) {
      if (/^`[^`]+`$/.test(part)) {
        return '<code class="inline-code">' + esc(part.slice(1, -1)) + '</code>';
      }
      return esc(part);
    }).join('');
    return p;
  }

  /* ------------------------------------------------------------------ state */
  var session = null;      // active exam state
  var exam = null;         // active exam definition
  var timerId = null;
  var reviewLook = false;  // true while inspecting a question from the results screen

  function storeKey(id) { return STORE + id; }

  function loadSaved(id) {
    try {
      var raw = localStorage.getItem(storeKey(id));
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function save() {
    if (!session) return;
    try {
      localStorage.setItem(storeKey(exam.id), JSON.stringify(session));
    } catch (e) { /* storage full or blocked — practice mode still works */ }
  }

  function freshSession() {
    return {
      answers: {},          // questionNo -> { sel } | { blanks: {n: text} }
      strikes: {},          // questionNo -> { letter: true }  (elimination marks)
      flagged: {},
      current: 1,
      remaining: exam.duration * 60,
      submitted: false,
      startedAt: Date.now()
    };
  }

  function totalMarks() {
    return exam.questions.reduce(function (a, q) { return a + q.marks; }, 0);
  }

  function answered(q) {
    var a = session.answers[q.n];
    if (!a) return false;
    if (q.type === 'mcq') return !!a.sel;
    if (!a.blanks) return false;
    for (var i = 1; i <= q.blanks.length; i++) {
      if (String(a.blanks[i] || '').trim() !== '') return true;
    }
    return false;
  }

  function gradeQuestion(q) {
    var a = session.answers[q.n];
    var res = { question: q, state: 'skipped', given: '', expected: '', marks: 0 };

    if (q.type === 'mcq') {
      res.expected = q.answer + '. ' + optionText(q, q.answer);
      if (!a || !a.sel) return res;
      res.given = a.sel + '. ' + optionText(q, a.sel);
      if (a.sel === q.answer) { res.state = 'ok'; res.marks = q.marks; }
      else res.state = 'bad';
      return res;
    }

    var blanks = q.blanks;
    res.expected = blanks.map(function (b) { return b.n + '. ' + (b.answer || '(free response)'); }).join('   ');
    if (!a || !a.blanks) return res;
    res.given = blanks.map(function (b) { return b.n + '. ' + (a.blanks[b.n] || '(blank)'); }).join('   ');

    var allGood = true, anyGiven = false;
    for (var i = 0; i < blanks.length; i++) {
      var b = blanks[i];
      var got = String((a.blanks && a.blanks[b.n]) || '');
      if (got.trim() === '') { allGood = false; continue; }
      anyGiven = true;
      if (b.freeform) continue;
      if (normalize(got) !== normalize(b.answer)) allGood = false;
    }
    if (!anyGiven) return res;
    res.state = allGood ? 'ok' : 'bad';
    res.marks = allGood ? q.marks : 0;
    return res;
  }

  function optionText(q, letter) {
    for (var i = 0; i < q.options.length; i++) {
      if (q.options[i].l === letter) return q.options[i].t;
    }
    return '';
  }

  /* --------------------------------------------------------------- screens */
  function showScreen(which) {
    $('screen-picker').hidden = which !== 'picker';
    $('screen-exam').hidden = which !== 'exam';
    $('screen-review').hidden = which !== 'review';
  }

  /* --------------------------------------------------------------- picker */
  function renderPicker() {
    var list = $('exam-list');
    list.innerHTML = '';
    EXAMS.forEach(function (e, idx) {
      var saved = loadSaved(e.id);
      var card = el('button', 'exam-card');
      card.type = 'button';

      card.appendChild(el('h2', null, e.title));
      card.appendChild(el('div', 'exam-card-source', e.source));

      var meta = el('div', 'exam-card-meta');
      var mcq = 0, fib = 0;
      e.questions.forEach(function (q) { if (q.type === 'mcq') mcq++; else fib++; });
      meta.appendChild(el('span', 'chip', e.questions.length + ' questions'));
      if (mcq) meta.appendChild(el('span', 'chip alt', mcq + ' MCQ'));
      if (fib) meta.appendChild(el('span', 'chip alt', fib + ' fill-in'));
      meta.appendChild(el('span', 'chip alt', totalMarksOf(e) + ' marks'));
      meta.appendChild(el('span', 'chip alt', e.duration + ' min'));
      card.appendChild(meta);

      if (saved && !saved.submitted) {
        var done = e.questions.filter(function (q) { return savedAnswered(saved, q); }).length;
        card.appendChild(el('div', 'exam-card-resume', 'In progress — ' + done + ' of ' + e.questions.length + ' answered'));
      } else if (saved && saved.submitted) {
        var g = gradeAll(e, saved);
        card.appendChild(el('div', 'exam-card-resume', 'Completed — ' + g.earned + '/' + g.total + ' marks'));
      }

      var cta = el('span', 'exam-card-cta',
        saved && !saved.submitted ? 'Resume paper' : (saved && saved.submitted ? 'View results' : 'Start paper'));
      card.appendChild(cta);

      card.addEventListener('click', function () { startExam(EXAMS[idx]); });
      list.appendChild(card);
    });
    showScreen('picker');
  }

  function totalMarksOf(e) {
    return e.questions.reduce(function (a, q) { return a + q.marks; }, 0);
  }

  function savedAnswered(sv, q) {
    var a = sv.answers && sv.answers[q.n];
    if (!a) return false;
    if (q.type === 'mcq') return !!a.sel;
    if (!a.blanks) return false;
    for (var i = 1; i <= q.blanks.length; i++) {
      if (String(a.blanks[i] || '').trim() !== '') return true;
    }
    return false;
  }

  function gradeAll(e, sv) {
    var total = 0, earned = 0, correct = 0, wrong = 0, skipped = 0;
    e.questions.forEach(function (q) {
      total += q.marks;
      var a = sv.answers && sv.answers[q.n];
      if (!a || !savedAnswered(sv, q)) { skipped++; return; }
      if (q.type === 'mcq') {
        if (a.sel === q.answer) { correct++; earned += q.marks; } else wrong++;
        return;
      }
      var allGood = true;
      for (var i = 0; i < q.blanks.length; i++) {
        var b = q.blanks[i];
        var got = String((a.blanks && a.blanks[b.n]) || '');
        if (got.trim() === '' || b.freeform) { if (got.trim() === '') allGood = false; continue; }
        if (normalize(got) !== normalize(b.answer)) allGood = false;
      }
      if (allGood) { correct++; earned += q.marks; } else wrong++;
    });
    return { total: total, earned: earned, correct: correct, wrong: wrong, skipped: skipped };
  }

  /* ------------------------------------------------------------ exam start */
  function normalizeSession(sv) {
    if (sv.answers == null) sv.answers = {};
    if (sv.strikes == null) sv.strikes = {};
    if (sv.flagged == null) sv.flagged = {};
    if (!sv.current) sv.current = 1;
    if (typeof sv.remaining !== 'number') sv.remaining = exam.duration * 60;
    return sv;
  }

  function startExam(e) {
    exam = e;
    var saved = loadSaved(e.id);
    reviewLook = false;

    if (saved && saved.submitted) {
      session = normalizeSession(saved);
      renderReview();
      return;
    }

    session = normalizeSession(saved || freshSession());
    save();
    $('exam-title').textContent = e.headerName;
    buildRail();
    renderQuestion(true);
    updateFooter();
    startTimer();
    showScreen('exam');
    closeMenus();
  }

  function retakeExam() {
    try { localStorage.removeItem(storeKey(exam.id)); } catch (err) {}
    session = normalizeSession(freshSession());
    save();
    reviewLook = false;
    $('exam-title').textContent = exam.headerName;
    buildRail();
    renderQuestion(true);
    updateFooter();
    startTimer();
    showScreen('exam');
  }

  /* The clock is a prompt, not a gate: at zero it warns once and then counts
     the overrun upwards while the paper stays fully editable. */
  function startTimer() {
    if (timerId) clearInterval(timerId);
    paintTimer();
    timerId = setInterval(function () {
      session.remaining -= 1;
      paintTimer();
      if (session.remaining === 0) {
        toast('Time is up. The paper stays open — the clock is now counting your overrun.');
      }
      if (session.remaining % 10 === 0) save();
    }, 1000);
  }

  function paintTimer() {
    var t = $('timer');
    var over = session.remaining < 0;
    t.textContent = (over ? '+' : '') + fmtClock(Math.abs(session.remaining));
    $('timer-label').textContent = over ? 'TIME OVER' : 'TIME REMAINING';
    t.classList.toggle('low', !over && session.remaining <= 300);
    t.classList.toggle('over', over);
  }

  /* ------------------------------------------------------------------ rail */
  var railFilter = 'all';

  function buildRail() {
    var list = $('rail-list');
    list.innerHTML = '';

    var visible = exam.questions.filter(function (q) {
      if (railFilter === 'flagged') return !!session.flagged[q.n];
      if (railFilter === 'unanswered') return !answered(q);
      if (railFilter === 'mcq') return q.type === 'mcq';
      if (railFilter === 'fib') return q.type === 'fib';
      return true;
    });

    visible.forEach(function (q) {
      var b = el('button', 'rail-dot', String(q.n));
      b.type = 'button';
      b.title = 'Question ' + q.n + ' · ' + q.marks + ' mark' + (q.marks > 1 ? 's' : '') +
                (session.flagged[q.n] ? ' · flagged' : '');
      if (q.n === session.current) b.classList.add('current');
      if (answered(q)) b.classList.add('answered');
      if (session.flagged[q.n]) b.classList.add('flagged');
      b.addEventListener('click', function () { gotoQuestion(q.n); });
      list.appendChild(b);
    });

    Array.prototype.forEach.call($('rail-filter-panel').children, function (btn) {
      btn.classList.toggle('active', btn.dataset.filter === railFilter);
    });

    var current = list.querySelector('.rail-dot.current');
    if (current) {
      var top = current.offsetTop - list.clientHeight / 2 + current.offsetHeight / 2;
      list.scrollTop = Math.max(0, top);
    }
    updateRailCaretState();
    requestAnimationFrame(updateRailCaretState);
  }

  function updateRailCaretState() {
    var list = $('rail-list');
    $('rail-up').disabled = list.scrollTop <= 0;
    $('rail-down').disabled = list.scrollTop + list.clientHeight >= list.scrollHeight - 1;
  }

  function gotoQuestion(n) {
    session.current = n;
    save();
    renderQuestion(true);
    buildRail();
    updateFooter();
    closeMenus();
  }

  /* -------------------------------------------------------------- question */
  /* In-place re-renders (selecting an option, eliminating one) must not throw
     away the reader's scroll position; only a question change resets it. */
  function renderQuestion(resetScroll) {
    var q = exam.questions.filter(function (x) { return x.n === session.current; })[0];
    if (!q) return;
    var keepScroll = resetScroll ? 0 : $('q-scroll').scrollTop;
    var a = session.answers[q.n] || {};
    var reviewing = reviewLook && session.submitted;

    $('q-label').textContent = 'Question ' + q.n + '  (' + q.marks + ' mark' + (q.marks > 1 ? 's' : '') + ')';
    $('flag-btn').classList.toggle('on', !!session.flagged[q.n]);
    $('flag-btn').textContent = session.flagged[q.n] ? 'FLAGGED' : 'FLAG QUESTION';

    // stem
    var stem = $('q-stem');
    stem.innerHTML = '';
    q.stem.forEach(function (blk) {
      if (blk.p != null) stem.appendChild(renderParagraph(blk.p));
      else if (blk.code != null) stem.appendChild(renderCode(blk.code, a.blanks));
    });

    // answers
    var host = $('q-answers');
    host.innerHTML = '';

    if (q.type === 'mcq') {
      /* The header states the letter range, then tracks the selection so the
         chosen option is named even when the list is scrolled or struck out. */
      var label = 'Answers: A - ' + q.options[q.options.length - 1].l;
      if (a.sel) label += '   —   selected: ' + a.sel;
      host.appendChild(el('div', 'answers-label', label));

      var strikes = (session.strikes && session.strikes[q.n]) || {};

      q.options.forEach(function (o) {
        var row = el('div', 'opt');
        row.dataset.letter = o.l;
        if (a.sel === o.l) row.classList.add('selected');
        if (strikes[o.l]) row.classList.add('struck');
        if (reviewing) {
          if (o.l === q.answer) row.classList.add('correct');
          else if (a.sel === o.l) row.classList.add('wrong');
        }
        row.appendChild(el('span', 'opt-letter', o.l));
        row.appendChild(el('span', 'opt-text', o.t));

        /* The icon on the right rules an option out — it never reveals a key. */
        if (!reviewing) {
          var eye = el('button', 'opt-eye' + (strikes[o.l] ? ' on' : ''));
          eye.type = 'button';
          eye.title = strikes[o.l] ? 'Undo elimination' : 'Strike through to eliminate';
          eye.setAttribute('aria-pressed', strikes[o.l] ? 'true' : 'false');
          eye.innerHTML = EYE_SVG;
          eye.addEventListener('click', function (ev) {
            ev.stopPropagation();
            if (!session.strikes) session.strikes = {};
            if (!session.strikes[q.n]) session.strikes[q.n] = {};
            if (session.strikes[q.n][o.l]) delete session.strikes[q.n][o.l];
            else session.strikes[q.n][o.l] = true;
            save();
            renderQuestion(false);
          });
          row.appendChild(eye);
        }

        if (!reviewing) {
          row.addEventListener('click', function () {
            session.answers[q.n] = { sel: o.l };
            save();
            renderQuestion(false);
            buildRail();
            updateFooter();
          });
        }
        host.appendChild(row);
      });
      if (reviewing) {
        host.appendChild(el('div', 'answer-note',
          'You answered ' + (a.sel || 'nothing') + '. The key is ' + q.answer + '.'));
      }
    } else {
      host.appendChild(el('div', 'answers-label', 'Answers ' +
        (q.blanks.length === 1 ? '1' : '1 - ' + q.blanks.length)));
      var blanks = a.blanks || {};
      q.blanks.forEach(function (b, i) {
        var row = el('div', 'fib-row');
        if (String(blanks[b.n] || '') !== '') row.classList.add('solved');
        if (reviewing) {
          var got = String(blanks[b.n] || '');
          var ok = b.freeform ? got.trim() !== '' : (got.trim() !== '' && normalize(got) === normalize(b.answer));
          row.classList.add(ok ? 'correct' : 'wrong');
        }
        row.appendChild(el('span', 'fib-num', b.n + '.'));

        var input = document.createElement('input');
        input.className = 'fib-input';
        input.type = 'text';
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.placeholder = b.freeform ? 'type your answer' : 'type the missing expression';
        input.value = blanks[b.n] || '';
        if (b.freeform && b.maxLength) input.maxLength = b.maxLength;
        if (reviewing) input.readOnly = true;
        input.addEventListener('input', function () {
          if (reviewing) return;
          if (!session.answers[q.n]) session.answers[q.n] = {};
          if (!session.answers[q.n].blanks) session.answers[q.n].blanks = {};
          session.answers[q.n].blanks[b.n] = input.value;
          row.classList.toggle('solved', input.value.trim() !== '');
          save();
          buildRail();
          updateFooter();
        });
        input.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter') {
            ev.preventDefault();
            if (i < q.blanks.length - 1) {
              var next = host.querySelectorAll('.fib-input')[i + 1];
              if (next) next.focus();
            } else if (session.current < exam.questions.length) {
              nextQuestion();
            }
          }
        });
        row.appendChild(input);

        if (reviewing && !b.freeform) {
          row.appendChild(el('span', 'fib-expected', b.answer));
        }
        host.appendChild(row);
      });
      if (reviewing) {
        host.appendChild(el('div', 'answer-note', 'Correct answers are shown in green on the right of each row.'));
      } else if (q.blanks.length > 1) {
        host.appendChild(el('div', 'answer-note',
          'Every blank must be correct to earn the marks — there is no partial credit on fill-in questions.'));
      }
    }

    $('q-scroll').scrollTop = keepScroll;
  }

  /* -------------------------------------------------------------- footer */
  function updateFooter() {
    if (reviewLook) {
      $('footer-progress').textContent = 'REVIEW';
      $('prev-btn').disabled = false;
      $('next-btn').textContent = 'Back to results';
      $('next-btn').classList.remove('finish');
      return;
    }
    var idx = exam.questions.map(function (q) { return q.n; }).indexOf(session.current);
    $('footer-progress').textContent = (idx + 1) + ' OF ' + exam.questions.length + ' QUESTIONS';
    $('prev-btn').disabled = idx === 0;
    var last = idx === exam.questions.length - 1;
    $('next-btn').textContent = last ? 'Finish' : 'Next';
    $('next-btn').classList.toggle('finish', last);
  }

  function nextQuestion() {
    if (reviewLook) { reviewLook = false; renderReview(); return; }
    var idx = exam.questions.map(function (q) { return q.n; }).indexOf(session.current);
    if (idx < exam.questions.length - 1) gotoQuestion(exam.questions[idx + 1].n);
    else confirmSubmit();
  }

  function prevQuestion() {
    var idx = exam.questions.map(function (q) { return q.n; }).indexOf(session.current);
    if (idx > 0) gotoQuestion(exam.questions[idx - 1].n);
  }

  /* ---------------------------------------------------------------- modals */
  function openModal(title, bodyNodes, actions) {
    $('modal-title').textContent = title;
    var body = $('modal-body');
    body.innerHTML = '';
    bodyNodes.forEach(function (n) { body.appendChild(n); });

    var bar = $('modal-actions');
    bar.innerHTML = '';
    actions.forEach(function (act) {
      var b = el('button', act.kind || 'btn-outline', act.label);
      b.type = 'button';
      b.addEventListener('click', act.onClick);
      bar.appendChild(b);
    });
    $('modal').hidden = false;
  }

  function closeModal() { $('modal').hidden = true; }

  function confirmSubmit() {
    var notAnswered = exam.questions.filter(function (q) { return !answered(q); });
    var flagged = exam.questions.filter(function (q) { return session.flagged[q.n]; });
    var nodes = [];

    nodes.push(el('p', null,
      'You have answered ' + (exam.questions.length - notAnswered.length) +
      ' of ' + exam.questions.length + ' questions.'));

    var ul = el('ul');
    if (notAnswered.length) {
      ul.appendChild(el('li', null, 'Unanswered: ' + notAnswered.map(function (q) { return q.n; }).join(', ')));
    }
    if (flagged.length) {
      ul.appendChild(el('li', null, 'Flagged: ' + flagged.map(function (q) { return q.n; }).join(', ')));
    }
    ul.appendChild(el('li', null, 'Submitting just shows the answer key — you can pick the paper back up afterwards.'));
    nodes.push(ul);

    openModal('Submit exam?', nodes, [
      { label: 'Keep working', kind: 'btn-outline', onClick: closeModal },
      { label: 'Submit', kind: 'btn-solid', onClick: function () { closeModal(); submitExam(); } }
    ]);
  }

  function submitExam() {
    if (timerId) { clearInterval(timerId); timerId = null; }
    session.submitted = true;
    session.submittedAt = Date.now();
    save();
    renderReview();
  }

  /* Undo a submission without touching the answers — the results screen is a
     place to check your work, never a dead end. */
  function continuePaper() {
    session.submitted = false;
    session.submittedAt = null;
    save();
    reviewLook = false;
    $('exam-title').textContent = exam.headerName;
    buildRail();
    renderQuestion(true);
    updateFooter();
    startTimer();
    showScreen('exam');
  }

  /* ---------------------------------------------------------------- review */
  function renderReview() {
    $('review-title').textContent = exam.headerName + ' — results';

    var results = exam.questions.map(gradeQuestion);
    var earned = 0, total = 0, correct = 0, wrong = 0, skipped = 0;
    results.forEach(function (r) {
      total += r.question.marks;
      earned += r.marks;
      if (r.state === 'ok') correct++;
      else if (r.state === 'bad') wrong++;
      else skipped++;
    });
    var pct = total ? Math.round((earned / total) * 100) : 0;

    var ring = $('score-ring');
    ring.className = 'score-ring ' + (pct >= 75 ? 'good' : pct >= 50 ? 'mid' : 'bad');
    $('score-pct').textContent = pct + '%';

    var stats = $('review-stats');
    stats.innerHTML = '';
    [
      ['Marks', earned + ' / ' + total],
      ['Correct', String(correct), 'ok'],
      ['Incorrect', String(wrong), 'bad'],
      ['Not answered', String(skipped)],
      ['Time used', fmtClock(exam.duration * 60 - session.remaining)]
    ].forEach(function (row) {
      var s = el('div', 'review-stat');
      s.appendChild(el('span', 'k', row[0]));
      s.appendChild(el('span', 'v' + (row[2] ? ' ' + row[2] : ''), row[1]));
      stats.appendChild(s);
    });

    if (session.remaining < 0) {
      var overStat = el('div', 'review-stat');
      overStat.appendChild(el('span', 'k', 'Overrun'));
      overStat.appendChild(el('span', 'v bad', '+' + fmtClock(-session.remaining)));
      stats.appendChild(overStat);
    }

    var host = $('review-breakdown');
    host.innerHTML = '';
    results.forEach(function (r) {
      var card = el('div', 'review-card ' + r.state);
      var head = el('div', 'review-card-head');
      head.appendChild(el('span', 'num', 'Question ' + r.question.n));
      var v = el('span', 'verdict ' + (r.state === 'ok' ? 'ok' : r.state === 'bad' ? 'bad' : 'skip'),
        r.state === 'ok' ? 'Correct' : r.state === 'bad' ? 'Incorrect' : 'Not answered');
      head.appendChild(v);
      head.appendChild(el('span', 'marks', r.marks + ' / ' + r.question.marks + ' marks'));
      card.appendChild(head);

      if (r.given) {
        card.appendChild(el('div', 'given', 'Your answer:   ' + r.given));
      }
      card.appendChild(el('div', 'expected', 'Correct answer: ' + r.expected));
      if (r.question.explanation) {
        card.appendChild(el('div', 'explain', r.question.explanation));
      }

      var jump = el('button', 'review-back-btn', 'Open this question');
      jump.type = 'button';
      jump.addEventListener('click', function () {
        reviewLook = true;
        showScreen('exam');
        gotoQuestion(r.question.n);
      });
      card.appendChild(jump);
      host.appendChild(card);
    });

    showScreen('review');
  }

  /* ------------------------------------------------------------- tool kit */
  function toast(msg) {
    var t = $('q-toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._id);
    toast._id = setTimeout(function () { t.hidden = true; }, 3200);
  }

  function closeMenus() {
    $('exam-controls-menu').hidden = true;
    $('toolkit-menu').hidden = true;
    $('q-more-menu').hidden = true;
    $('q-jump-menu').hidden = true;
    $('rail-filter-panel').hidden = true;
  }

  function buildJumpMenu() {
    var menu = $('q-jump-menu');
    menu.innerHTML = '';
    menu.appendChild(el('div', 'menu-head', 'Jump to question'));
    exam.questions.forEach(function (q) {
      var b = el('button', null,
        'Question ' + q.n + (session.flagged[q.n] ? '  ⚑' : '') +
        (answered(q) ? '  ✓' : ''));
      b.type = 'button';
      b.addEventListener('click', function () { gotoQuestion(q.n); });
      menu.appendChild(b);
    });
  }

  /* ---------------------------------------------------------------- wiring */
  function init() {
    if (!EXAMS.length) {
      $('exam-list').textContent = 'No papers loaded.';
      return;
    }

    $('next-btn').addEventListener('click', nextQuestion);
    $('prev-btn').addEventListener('click', prevQuestion);

    $('flag-btn').addEventListener('click', function () {
      if (reviewLook || session.submitted) return;
      if (session.flagged[session.current]) delete session.flagged[session.current];
      else session.flagged[session.current] = true;
      save();
      renderQuestion(false);
      buildRail();
    });

    $('q-jump').addEventListener('click', function (e) {
      e.stopPropagation();
      var open = $('q-jump-menu').hidden;
      closeMenus();
      if (open) { buildJumpMenu(); $('q-jump-menu').hidden = false; }
    });

    $('q-more').addEventListener('click', function (e) {
      e.stopPropagation();
      var open = $('q-more-menu').hidden;
      closeMenus();
      if (open) $('q-more-menu').hidden = false;
    });

    $('q-more-menu').addEventListener('click', function (e) {
      var action = e.target.dataset && e.target.dataset.action;
      if (!action) return;
      closeMenus();
      if (action === 'strike') toast('Strike-through applies to tool-kit text selections.');
      else if (action === 'highlight') toast('Highlight applies to tool-kit text selections.');
      else toast('Highlights cleared.');
    });

    $('exam-controls-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      var open = $('exam-controls-menu').hidden;
      closeMenus();
      if (open) $('exam-controls-menu').hidden = false;
    });

    $('exam-controls-menu').addEventListener('click', function (e) {
      var action = e.target.dataset && e.target.dataset.action;
      if (!action) return;
      closeMenus();
      if (action === 'submit') confirmSubmit();
      else if (action === 'quit') {
        openModal('Exit and discard?', [
          el('p', null, 'Your answers for this paper will be deleted from this browser.')
        ], [
          { label: 'Cancel', kind: 'btn-outline', onClick: closeModal },
          { label: 'Discard', kind: 'btn-solid', onClick: function () {
            try { localStorage.removeItem(storeKey(exam.id)); } catch (err) {}
            closeModal();
            if (timerId) { clearInterval(timerId); timerId = null; }
            session = null; exam = null;
            renderPicker();
          } }
        ]);
      }
    });

    $('toolkit-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      closeMenus();
      // Toggle the toolkit panel directly
      if ($('toolkit-panel').hidden) {
        openToolkit();
      } else {
        closeToolkit();
      }
    });

    $('toolkit-menu').addEventListener('click', function (e) {
      var action = e.target.dataset && e.target.dataset.action;
      if (!action) return;
      closeMenus();
      if (action === 'calc') openToolkit();
      else if (action === 'notes') toast('Notes are not enabled in this practice clone.');
      else if (action === 'highlights') toast('No highlights yet.');
      else toast('Shortcuts: ← / → move between questions, F flags, Enter moves on.');
    });

    $('rail-filter').addEventListener('click', function (e) {
      e.stopPropagation();
      var open = $('rail-filter-panel').hidden;
      closeMenus();
      if (open) $('rail-filter-panel').hidden = false;
    });

    $('rail-filter-panel').addEventListener('click', function (e) {
      var f = e.target.dataset && e.target.dataset.filter;
      if (!f) return;
      railFilter = f;
      closeMenus();
      buildRail();
    });

    $('rail-up').addEventListener('click', function () {
      $('rail-list').scrollTop -= 120;
      updateRailCaretState();
    });
    $('rail-down').addEventListener('click', function () {
      $('rail-list').scrollTop += 120;
      updateRailCaretState();
    });

    $('review-back').addEventListener('click', function () {
      reviewLook = false;
      session = null; exam = null;
      renderPicker();
    });

    $('review-retake').addEventListener('click', retakeExam);
    $('review-continue').addEventListener('click', continuePaper);

    document.addEventListener('click', function () { closeMenus(); });
    $('modal').addEventListener('click', function (e) {
      if (e.target === $('modal')) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if ($('screen-exam').hidden || !session || (session.submitted && !reviewLook)) return;
      if (e.key === 'ArrowRight' && !$('next-btn').disabled) nextQuestion();
      else if (e.key === 'ArrowLeft') prevQuestion();
      else if ((e.key === 'f' || e.key === 'F') && !reviewLook) $('flag-btn').click();
      else if (e.key === 'Escape') closeMenus();
    });

    document.addEventListener('visibilitychange', function () { if (!document.hidden) save(); });
    window.addEventListener('beforeunload', save);

    $('clock').textContent = new Date().toTimeString().slice(0, 5);
    setInterval(function () {
      $('clock').textContent = new Date().toTimeString().slice(0, 5);
    }, 30000);

    /* Draw the papers first, then light up the tool kit. The calculator is a
       self-contained extra: if any part of it fails, the exam app still works. */
    renderPicker();

    try {
      initCalculator();
    } catch (err) {
      if (window.console && console.error) console.error('Calculator failed to initialise:', err);
    }
  }

  /* ================================================================
     CALCULATOR  —  Keyboard Friendly + Classic (Scientific)
     ================================================================ */

  /* Scientific keys that are relabelled (and remapped) while INV is active. */
  var CL_INV_KEYS = ['sin', 'cos', 'tan', 'log', 'ln', '√', 'x^y'];

  function openToolkit() {
    $('toolkit-panel').hidden = false;
  }

  function closeToolkit() {
    $('toolkit-panel').hidden = true;
  }

  /* Safe math evaluator — converts display expressions to JS-evaluable strings. */
  function calcEval(expr) {
    // Replace display symbols with JS operators
    var s = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/π/g, '(' + Math.PI + ')')
      .replace(/\be\^/g, 'Math.E**')   // eˣ (INV of ln) must resolve before ^ → **
      .replace(/\^/g, '**');

    // Handle √ — √(expr) or √number
    s = s.replace(/√\(([^)]+)\)/g, 'Math.sqrt($1)');
    s = s.replace(/√(\d+(\.\d+)?)/g, 'Math.sqrt($1)');

    // Handle factorial n!
    s = s.replace(/(\d+(\.\d+)?)!/g, '_fact($1)');

    // Handle scientific functions
    s = s.replace(/\bsin\(/g, '_sin(');
    s = s.replace(/\bcos\(/g, '_cos(');
    s = s.replace(/\btan\(/g, '_tan(');
    s = s.replace(/\basin\(/g, '_asin(');
    s = s.replace(/\bacos\(/g, '_acos(');
    s = s.replace(/\batan\(/g, '_atan(');
    s = s.replace(/\bsinh\(/g, 'Math.sinh(');
    s = s.replace(/\bcosh\(/g, 'Math.cosh(');
    s = s.replace(/\btanh\(/g, 'Math.tanh(');
    s = s.replace(/\basinh\(/g, 'Math.asinh(');
    s = s.replace(/\bacosh\(/g, 'Math.acosh(');
    s = s.replace(/\batanh\(/g, 'Math.atanh(');
    s = s.replace(/\blog\(/g, 'Math.log10(');
    s = s.replace(/\bln\(/g, 'Math.log(');
    s = s.replace(/\babs\(/g, 'Math.abs(');

    // Handle EE (scientific notation)
    s = s.replace(/(\d+(\.\d+)?)E(\d+)/g, '($1*Math.pow(10,$3))');
    s = s.replace(/(\d+(\.\d+)?)E(-?\d+)/g, '($1*Math.pow(10,$3))');

    try {
      // Define helper functions in a safe scope
      var _fact = function(n) {
        n = Math.round(n);
        if (n < 0) return NaN;
        if (n === 0 || n === 1) return 1;
        if (n > 170) return Infinity;
        var r = 1;
        for (var i = 2; i <= n; i++) r *= i;
        return r;
      };

      var useRadians = calcClassicState.useRadians;
      var _sin = function(x) { return Math.sin(useRadians ? x : x * Math.PI / 180); };
      var _cos = function(x) { return Math.cos(useRadians ? x : x * Math.PI / 180); };
      var _tan = function(x) { return Math.tan(useRadians ? x : x * Math.PI / 180); };
      var _asin = function(x) { var r = Math.asin(x); return useRadians ? r : r * 180 / Math.PI; };
      var _acos = function(x) { var r = Math.acos(x); return useRadians ? r : r * 180 / Math.PI; };
      var _atan = function(x) { var r = Math.atan(x); return useRadians ? r : r * 180 / Math.PI; };

      /* eslint-disable no-eval */
      var result = eval(s);
      /* eslint-enable no-eval */
      if (typeof result !== 'number') return { error: 'Invalid expression' };
      return { value: result };
    } catch (e) {
      return { error: 'Error' };
    }
  }

  function formatResult(val) {
    if (val === Infinity) return '∞';
    if (val === -Infinity) return '-∞';
    if (isNaN(val)) return 'Error';
    // Up to 10 significant digits, remove trailing zeros
    var s = parseFloat(val.toPrecision(10)).toString();
    // If too long, use scientific notation
    if (s.length > 14) s = val.toExponential(6);
    return s;
  }

  /* While INV is active the √ key means x², so √(A) must square the whole
     parenthesised group — ((A)**2) — not just the first token inside it. */
  function invSquare(expr) {
    var out = '';
    for (var i = 0; i < expr.length; i++) {
      if (expr.charAt(i) !== '√' || expr.charAt(i + 1) !== '(') {
        out += expr.charAt(i);
        continue;
      }
      var depth = 0, end = -1;
      for (var j = i + 1; j < expr.length; j++) {
        if (expr.charAt(j) === '(') depth++;
        else if (expr.charAt(j) === ')' && --depth === 0) { end = j; break; }
      }
      if (end < 0) { out += expr.charAt(i); continue; }
      out += '((' + expr.slice(i + 2, end) + ')**2)';
      i = end;
    }
    return out;
  }

  /* ---------- Keyboard Friendly state ---------- */
  var calcKBState = {
    history: [],       // array of {expr, result} display strings
    undoStack: [],     // previous input states for undo
    redoStack: [],
    lastAns: 0
  };

  /* ---------- Classic state ---------- */
  var calcClassicState = {
    useRadians: false,
    invMode: false,
    lastAns: 0,
    currentInput: '0',
    justEvaluated: false
  };

  function initCalculator() {
    /* --- Toolkit close --- */
    on('toolkit-close-link', 'click', function (e) {
      e.preventDefault();
      closeToolkit();
    });

    /* --- Tab switching --- */
    var tabs = $('toolkit-panel').querySelectorAll('.toolkit-tab');
    Array.prototype.forEach.call(tabs, function (tab) {
      tab.addEventListener('click', function () {
        Array.prototype.forEach.call(tabs, function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        // For now only the calculator tab has content
      });
    });

    /* --- Mode switching --- */
    on('calc-mode-keyboard', 'click', function () {
      $('calc-mode-keyboard').classList.add('active');
      $('calc-mode-classic').classList.remove('active');
      $('calc-keyboard').hidden = false;
      $('calc-classic').hidden = true;
    });

    on('calc-mode-classic', 'click', function () {
      $('calc-mode-classic').classList.add('active');
      $('calc-mode-keyboard').classList.remove('active');
      $('calc-classic').hidden = false;
      $('calc-keyboard').hidden = true;
    });

    initKeyboardCalc();
    initClassicCalc();
  }

  /* ================================================================
     KEYBOARD FRIENDLY Calculator
     ================================================================ */
  function initKeyboardCalc() {
    var input = $('calc-kb-input');

    /* Button clicks */
    $('calc-keyboard').querySelectorAll('.calc-kb-grid .calc-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var val = btn.dataset.val;
        if (!val) return;
        if (val === 'ans') {
          pushUndo();
          input.value += formatResult(calcKBState.lastAns);
        } else {
          pushUndo();
          input.value += val;
        }
        input.focus();
      });
    });

    /* Enter / evaluate */
    on('calc-kb-enter', 'click', function () {
      evaluateKB();
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        evaluateKB();
      }
    });

    /* Undo / Redo */
    on('calc-kb-undo', 'click', function () {
      if (calcKBState.undoStack.length) {
        calcKBState.redoStack.push(input.value);
        input.value = calcKBState.undoStack.pop();
      }
    });

    on('calc-kb-redo', 'click', function () {
      if (calcKBState.redoStack.length) {
        calcKBState.undoStack.push(input.value);
        input.value = calcKBState.redoStack.pop();
      }
    });

    /* Clear all */
    on('calc-kb-clear', 'click', function () {
      input.value = '';
      calcKBState.history = [];
      calcKBState.undoStack = [];
      calcKBState.redoStack = [];
      calcKBState.lastAns = 0;
      renderKBHistory();
    });

    /* Backspace */
    on('calc-kb-backspace', 'click', function () {
      pushUndo();
      input.value = input.value.slice(0, -1);
      input.focus();
    });
  }

  function pushUndo() {
    var input = $('calc-kb-input');
    calcKBState.undoStack.push(input.value);
    calcKBState.redoStack = [];
  }

  function evaluateKB() {
    var input = $('calc-kb-input');
    var expr = input.value.trim();
    if (!expr) return;

    // Replace 'ans' with last answer value
    var evalExpr = expr.replace(/\bans\b/g, '(' + calcKBState.lastAns + ')');

    var result = calcEval(evalExpr);
    if (result.error) {
      calcKBState.history.push({ expr: expr, result: result.error });
    } else {
      calcKBState.lastAns = result.value;
      calcKBState.history.push({ expr: expr, result: '= ' + formatResult(result.value) });
    }

    renderKBHistory();
    input.value = '';
    calcKBState.undoStack = [];
    calcKBState.redoStack = [];
  }

  function renderKBHistory() {
    var hist = $('calc-kb-history');
    hist.innerHTML = '';
    calcKBState.history.forEach(function (h) {
      var row = document.createElement('div');
      row.className = 'calc-hist-row';
      row.innerHTML = '<span class="calc-hist-expr">' + esc(h.expr) + '</span>' +
        '<span class="calc-hist-res">' + esc(h.result) + ' <span class="calc-hist-icon" title="Toggle">&#8942;</span></span>';
      hist.appendChild(row);
    });
    // Auto-scroll to bottom
    hist.scrollTop = hist.scrollHeight;
  }

  /* ================================================================
     CLASSIC (Scientific) Calculator
     ================================================================ */
  function initClassicCalc() {
    var input = $('calc-cl-input');

    /* Number & operator buttons */
    $('calc-classic').querySelectorAll('.calc-cl-grid .calc-btn[data-val]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var val = btn.dataset.val;

        // Scientific functions that open a paren
        var sciOpenFns = ['sin', 'cos', 'tan', 'log', 'ln', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh'];
        var isSciOpen = sciOpenFns.indexOf(val) >= 0;

        if (isSciOpen) {
          // If INV mode is on, swap to inverse functions
          if (calcClassicState.invMode) {
            if (val === 'sin') val = 'asin';
            else if (val === 'cos') val = 'acos';
            else if (val === 'tan') val = 'atan';
            else if (val === 'log') val = '10^';
            else if (val === 'ln') val = 'e^';
          }
          if (calcClassicState.justEvaluated) {
            input.value = val + '(';
            calcClassicState.justEvaluated = false;
          } else if (input.value === '0') {
            input.value = val + '(';
          } else {
            input.value += val + '(';
          }
          return;
        }

        // Special functions
        if (val === 'π') {
          if (calcClassicState.justEvaluated || input.value === '0') {
            input.value = 'π';
          } else {
            input.value += 'π';
          }
          calcClassicState.justEvaluated = false;
          return;
        }

        if (val === 'n!') {
          input.value += '!';
          calcClassicState.justEvaluated = false;
          return;
        }

        if (val === '√') {
          if (calcClassicState.justEvaluated || input.value === '0') {
            input.value = '√(';
          } else {
            input.value += '√(';
          }
          calcClassicState.justEvaluated = false;
          return;
        }

        if (val === '1/x') {
          var curVal = input.value;
          if (curVal && curVal !== '0') {
            input.value = '1/(' + curVal + ')';
          }
          calcClassicState.justEvaluated = false;
          return;
        }

        if (val === 'x^y') {
          if (calcClassicState.invMode) {
            // x^(1/y) for INV mode
            input.value += '^(1/';
          } else {
            input.value += '^';
          }
          calcClassicState.justEvaluated = false;
          return;
        }

        if (val === 'EE') {
          input.value += 'E';
          calcClassicState.justEvaluated = false;
          return;
        }

        // Operators
        var operators = ['+', '−', '×', '÷'];
        if (operators.indexOf(val) >= 0) {
          calcClassicState.justEvaluated = false;
          // Avoid double operators
          var last = input.value.slice(-1);
          if (operators.indexOf(last) >= 0 || last === '+' || last === '-') {
            input.value = input.value.slice(0, -1) + ' ' + val + ' ';
          } else {
            input.value += ' ' + val + ' ';
          }
          return;
        }

        // Numbers, parentheses, decimal
        if (calcClassicState.justEvaluated && /[0-9.]/.test(val)) {
          input.value = val;
          calcClassicState.justEvaluated = false;
          return;
        }

        if (input.value === '0' && val !== '.') {
          input.value = val;
        } else {
          input.value += val;
        }
        calcClassicState.justEvaluated = false;
      });
    });

    /* Equals button */
    on('calc-cl-eq', 'click', function () {
      evaluateClassic();
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        evaluateClassic();
      }
    });

    /* AC */
    on('calc-cl-ac', 'click', function () {
      input.value = '0';
      calcClassicState.lastAns = 0;
      calcClassicState.justEvaluated = false;
      $('calc-cl-ans').textContent = '0';
    });

    /* Del */
    on('calc-cl-del', 'click', function () {
      if (input.value.length > 1) {
        input.value = input.value.slice(0, -1);
      } else {
        input.value = '0';
      }
      calcClassicState.justEvaluated = false;
    });

    /* Radian toggle */
    on('calc-cl-rad', 'click', function () {
      calcClassicState.useRadians = !calcClassicState.useRadians;
      $('calc-cl-deg').textContent = calcClassicState.useRadians ? 'RAD' : 'DEG';
      $('calc-cl-rad').textContent = calcClassicState.useRadians ? 'Degree' : 'Radian';
    });

    /* INV toggle */
    on('calc-cl-inv', 'click', function () {
      calcClassicState.invMode = !calcClassicState.invMode;
      $('calc-cl-inv').classList.toggle('active-toggle', calcClassicState.invMode);

      // Update button labels for inv mode
      var sciButtons = $('calc-classic').querySelectorAll('.calc-cl-grid .calc-btn[data-val]');
      Array.prototype.forEach.call(sciButtons, function (btn) {
        var val = btn.dataset.val;
        if (CL_INV_KEYS.indexOf(val) < 0) return;
        if (calcClassicState.invMode) {
          if (val === 'sin') btn.innerHTML = 'sin<sup>-1</sup>';
          else if (val === 'cos') btn.innerHTML = 'cos<sup>-1</sup>';
          else if (val === 'tan') btn.innerHTML = 'tan<sup>-1</sup>';
          else if (val === 'log') btn.textContent = '10ˣ';
          else if (val === 'ln') btn.textContent = 'eˣ';
          else if (val === '√') btn.textContent = 'x²';
          else if (val === 'x^y') btn.innerHTML = 'x<sup>1/y</sup>';
        } else {
          if (val === 'sin') btn.textContent = 'sin';
          else if (val === 'cos') btn.textContent = 'cos';
          else if (val === 'tan') btn.textContent = 'tan';
          else if (val === 'log') btn.textContent = 'log';
          else if (val === 'ln') btn.textContent = 'ln';
          else if (val === '√') btn.textContent = '√';
          else if (val === 'x^y') btn.innerHTML = 'x<sup>y</sup>';
        }
      });
    });
  }

  function evaluateClassic() {
    var input = $('calc-cl-input');
    var expr = input.value.trim();
    if (!expr || expr === '0') return;

    // Handle INV mode special evaluations (√ acts as x²)
    if (calcClassicState.invMode) expr = invSquare(expr);

    var result = calcEval(expr);
    if (result.error) {
      input.value = 'Error';
    } else {
      calcClassicState.lastAns = result.value;
      $('calc-cl-ans').textContent = formatResult(result.value);
      input.value = formatResult(result.value);
    }
    calcClassicState.justEvaluated = true;
  }


  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

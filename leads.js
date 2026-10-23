/* Landing: lead forms (phone + optional comment) sent to the Worker, calculator, and the floating context-aware CTA. */
(function(){
  var API = 'https://shaton-ideas.romantik-baza.workers.dev/lead', TG = 'https://t.me/shaton_lid';
  var $ = function(s, r){ return (r || document).querySelector(s); }, $$ = function(s, r){ return [].slice.call((r || document).querySelectorAll(s)); };

  /* ---------- phone mask (+7) ---------- */
  function fmt(v){
    var d = v.replace(/\D/g, ''); if (!d) return '';
    if (d[0] === '8') d = '7' + d.slice(1); if (d[0] !== '7') d = '7' + d; d = d.slice(0, 11);
    var s = '+7'; if (d.length > 1) s += ' (' + d.slice(1, 4); if (d.length >= 4) s += ') ' + d.slice(4, 7); if (d.length >= 7) s += '-' + d.slice(7, 9); if (d.length >= 9) s += '-' + d.slice(9, 11);
    return s;
  }
  function mirror(v){ var el = document.getElementById('pf-contact'); if (el) { el.textContent = v || 'Telegram или телефон'; el.classList.toggle('ph', !v); } }
  $$('.qf input[name=phone]').forEach(function(inp){
    inp.addEventListener('input', function(){ var pos = inp.selectionStart === inp.value.length; inp.value = fmt(inp.value); inp.classList.remove('err'); mirror(inp.value); });
    inp.addEventListener('focus', function(){ if (!inp.value) inp.value = '+7 '; });
    inp.addEventListener('blur', function(){ if (inp.value.replace(/\D/g, '').length <= 1) inp.value = ''; });
  });

  /* ---------- submit ---------- */
  var sending = false;
  function ctxData(ctx){
    var o = {};
    if (ctx === 'quiz' && window.__quizAnswers) { var a = window.__quizAnswers; o.niche = a[0] || ''; o.status = a[1] || ''; o.goal = a[2] || ''; }
    if (ctx === 'calc') { o.check = $('#calcA') && $('#calcA').value; o.margin = $('#calcM') && $('#calcM').value; o.buy = $('#calcB') && $('#calcB').value; o.limit = $('#calcV') && $('#calcV').textContent; }
    return o;
  }
  document.addEventListener('submit', function(e){
    var f = e.target; if (!f.classList || !f.classList.contains('qf')) return; e.preventDefault();
    var st = $('.qf-status', f), ph = f.elements.phone, cm = f.elements.comment, cs = f.elements.consent;
    function fail(msg, el){ st.className = 'qf-status err'; st.textContent = msg; if (el) { el.classList.add('err'); el.focus(); } }
    if (f.elements.website && f.elements.website.value) { done(f); return; }                 // honeypot: pretend success
    if (ph.value.replace(/\D/g, '').length < 11) return fail('Проверьте номер телефона: нужно 11 цифр, например +7 912 345-67-89.', ph);
    if (!cs.checked) return fail('Нужно согласие на обработку персональных данных.');
    if (sending) return; sending = true;
    var btn = $('button[type=submit]', f); btn.disabled = true; st.className = 'qf-status'; st.textContent = 'Отправляю…';
    var qs = new URLSearchParams(location.search), utm = {}; ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function(k){ if (qs.get(k)) utm[k] = qs.get(k); });
    var payload = { phone: ph.value.trim(), comment: cm ? cm.value.trim() : '', form: f.dataset.ctx || '', page: location.pathname.replace(/^\//, '') || 'index', extra: ctxData(f.dataset.ctx), utm: utm, ref: document.referrer || '' };
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function(){ sending = false; done(f); })
      .catch(function(){
        sending = false; btn.disabled = false;
        var text = 'Здравствуйте! Хочу бесплатный разбор.' + (payload.comment ? ' ' + payload.comment : '') + ' Мой телефон: ' + payload.phone;
        st.className = 'qf-status err'; st.innerHTML = 'Не удалось отправить. Напишите мне напрямую: <a href="' + TG + '?text=' + encodeURIComponent(text) + '" target="_blank" rel="noopener">Telegram @shaton_lid</a>.';
      });
  });
  function done(f){
    f.innerHTML = '<div class="qf-ok" role="status"><b>Заявка принята ✓</b><span>Отвечу лично в течение суток. Если удобнее сразу, напишите в Telegram.</span><a class="btn btn-outline-ember" href="' + TG + '" target="_blank" rel="noopener">Написать в Telegram</a></div>';
  }

  /* ---------- calculator ---------- */
  var A = $('#calcA'), M = $('#calcM'), B = $('#calcB');
  if (A && M && B) {
    var money = function(n){ return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
    var lastV = '';
    var upd = function(){
      var a = +A.value, m = +M.value, b = +B.value, lim = a * (m / 100) * (b / 100);
      $('#cvA').textContent = money(a); $('#cvM').textContent = m; $('#cvB').textContent = b;
      var v = $('#calcV'), txt = money(lim) + ' ₽'; v.textContent = txt;
      if (lastV !== txt) { v.classList.add('pop'); setTimeout(function(){ v.classList.remove('pop'); }, 220); lastV = txt; }
      $('#calcT').textContent = 'Заявка дороже ' + money(lim) + ' ₽ уже на первой продаже приносит убыток. Прибыль с продажи: ' + money(a * m / 100) + ' ₽, покупают ' + b + ' из 100 заявок.';
    };
    [A, M, B].forEach(function(r){ r.addEventListener('input', upd); }); upd();
  }

  /* ---------- floating CTA: text follows the block being read ---------- */
  var MAP = [['.hero,.brief,.paths', 'Бесплатный аудит', '#quiz'], ['.situations', 'Узнать, что мешает заявкам', '#quiz'], ['.fit,.quote-band,.process-sec', 'Начать с аудита', '#quiz'],
    ['#seo', 'Разобрать мой SEO', '#lead'], ['.why,.founder', 'Обсудить мой проект', '#lead'], ['.trust', 'Оставить заявку', '#lead'], ['#pricing', 'Заказать услугу', '#lead'],
    ['#projects', 'Хочу так же', '#lead'], ['.dirs,.wg', 'Подобрать формат работы', '#lead'], ['#faq', 'Задать вопрос лично', '#lead']];
  var bar = document.createElement('a'); bar.className = 'fcta'; bar.href = '#quiz'; bar.innerHTML = '<span class="t">Бесплатный аудит</span><span aria-hidden="true">→</span>'; bar.setAttribute('aria-label', 'Оставить заявку');
  document.body.appendChild(bar);
  var hideEls = $$('#lead,#quiz,#calc,.qf-band,.final-cta'), vis = new Set();
  function textFor(){
    var mid = innerHeight * 0.45;
    for (var i = 0; i < MAP.length; i++) { var els = $$(MAP[i][0]); for (var j = 0; j < els.length; j++) { var r = els[j].getBoundingClientRect(); if (r.top <= mid && r.bottom >= mid) return MAP[i]; } }
    return null;
  }
  var raf = 0;
  function tick(){
    raf = 0; var y = window.scrollY, over = hideEls.some(function(el){ var r = el.getBoundingClientRect(); return r.top < innerHeight * 0.85 && r.bottom > innerHeight * 0.1; });
    var m = textFor(); if (m) { var t = $('.t', bar); if (t.textContent !== m[1]) t.textContent = m[1]; bar.setAttribute('href', m[2]); }
    bar.classList.toggle('on', y > 700 && !over && !!m);
  }
  addEventListener('scroll', function(){ if (!raf) raf = requestAnimationFrame(tick); }, { passive: true }); addEventListener('resize', tick); tick();
})();

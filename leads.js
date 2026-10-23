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
    if (ctx === 'calc' && window.__calc) { var c = window.__calc(); if (c) Object.keys(c).forEach(function(k){ o[k] = c[k]; }); }
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

  /* ---------- calculator: unit economics of ads ---------- */
  var cCheck = $('#cCheck');
  var CALC_LAST = null;
  if (cCheck) {
    var num = function(id){ var v = parseFloat(String($(id).value).replace(/[^\d.,]/g, '').replace(',', '.')); return isFinite(v) ? v : 0; };
    var rub = function(n){ var s = Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); return (n < 0 ? '\u2212' : '') + s + '\u00a0₽'; };
    var sgn = function(n){ return (n > 0 ? '+' : n < 0 ? '\u2212' : '') + rub(Math.abs(n)); };
    var pct = function(n){ return Math.round(n) + '%'; };
    var set = function(id, txt, cls){ var el = $(id); if (el.textContent !== txt) { el.textContent = txt; if (el.tagName === 'B') { el.classList.add('pop'); setTimeout(function(){ el.classList.remove('pop'); }, 220); } } if (cls !== undefined) el.className = cls; };
    var fmtInput = function(el){ var d = el.value.replace(/[^\d]/g, ''); el.value = d ? d.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ''; };
    var line = function(h, items){ return '<h4>' + h + '</h4>' + items.map(function(t){ return '<p>' + t + '</p>'; }).join(''); };

    var calc = function(){
      var check = num('#cCheck'), margin = Math.min(100, num('#cMargin')), budget = num('#cBudget'), leads = num('#cLeads'), conv = Math.min(100, num('#cConv')), rep = Math.max(1, num('#cRep') || 1);
      var ok = check > 0 && margin > 0 && budget > 0 && leads > 0 && conv > 0;
      var verdict = $('#coVerdict');
      if (!ok) {
        verdict.setAttribute('data-s', 'idle'); set('#coV1', 'Заполните все цифры'); set('#coV2', 'Нужны средний чек, маржа, бюджет, заявки и доля покупающих.');
        ['#coCpl', '#coCac', '#coSales', '#coProfit'].forEach(function(id){ set(id, '—', ''); }); ['#coCplS', '#coCacS', '#coSalesS', '#coProfitS'].forEach(function(id){ set(id, ''); });
        $('#coTodo').innerHTML = ''; $('#coIf').innerHTML = ''; CALC_LAST = null; return;
      }
      var c = conv / 100, ppc = check * (margin / 100) * rep;          // profit per client (before ads)
      var cpl = budget / leads, sales = leads * c, cac = budget / sales;
      var profit = sales * ppc - budget, roi = profit / budget;
      var allowedCpl = ppc * c, allowedCac = ppc;                       // break-even
      var needConv = Math.min(100, (cpl / ppc) * 100);                   // conversion that breaks even at the current price of a lead
      var needCplDrop = cpl > allowedCpl ? (1 - allowedCpl / cpl) * 100 : 0;
      set('#coCpl', rub(cpl)); set('#coCplS', 'допустимо до ' + rub(allowedCpl));
      set('#coCac', rub(cac)); set('#coCacS', 'клиент приносит ' + rub(ppc) + (rep > 1 ? ' (за ' + rep + ' покупки)' : ''));
      set('#coSales', (Math.round(sales * 10) / 10).toString().replace('.', ',')); set('#coSalesS', 'из ' + Math.round(leads) + ' заявок');
      set('#coProfit', sgn(profit), profit >= 0 ? 'pos' : 'neg'); set('#coProfitS', 'окупаемость рекламы (ROI): ' + (roi >= 0 ? '+' : '\u2212') + pct(Math.abs(roi) * 100));
      var s, h1, h2, todo = [];
      if (profit < 0) {
        s = 'loss'; h1 = 'Реклама работает в минус: ' + rub(profit) + ' в месяц';
        h2 = 'Каждый клиент обходится в ' + rub(cac) + ', а приносит ' + rub(ppc) + '. Продажи есть, но деньги на рекламу не возвращаются.';
        todo.push('<b>Заявка должна стоить не дороже ' + rub(allowedCpl) + '</b> (сейчас ' + rub(cpl) + '): нужно снизить цену заявки на ' + pct(needCplDrop) + '. Это настройки рекламы: минус-слова, площадки, объявления.');
        if (needConv < 100) todo.push('<b>Или довести долю покупающих до ' + pct(needConv) + '</b> (сейчас ' + pct(conv) + ') при той же цене заявки. Это работа с ответом на заявки: скорость, скрипт, оффер.');
        todo.push('<b>Или поднять прибыль с клиента</b>: допродажи, повторные покупки, чек. Если клиент берёт на ' + rub(cac - ppc) + ' больше, реклама выходит в ноль.');
      } else if (roi < 0.3) {
        s = 'thin'; h1 = 'В плюсе, но запас небольшой: ' + sgn(profit) + ' в месяц';
        h2 = 'Реклама окупается, ROI ' + pct(roi * 100) + '. Заявка может подорожать до ' + rub(allowedCpl) + ' (на ' + pct((allowedCpl / cpl - 1) * 100) + ') и вы окажетесь в нуле.';
        todo.push('<b>Не наращивайте бюджет сразу.</b> Сначала снижайте цену заявки или повышайте долю покупающих: прибыль вырастет без новых вложений.');
        todo.push('<b>Следите за ценой заявки</b>: если она превысит ' + rub(allowedCpl) + ', реклама перестанет окупаться.');
      } else {
        s = 'good'; h1 = 'Реклама окупается с запасом: ' + sgn(profit) + ' в месяц';
        h2 = 'ROI ' + pct(roi * 100) + '. Заявка может подорожать до ' + rub(allowedCpl) + ' (на ' + pct((allowedCpl / cpl - 1) * 100) + ') и реклама всё ещё не уйдёт в минус.';
        todo.push('<b>Можно масштабировать</b>: увеличивайте бюджет шагами по 20–30% и смотрите, как меняется цена заявки.');
        todo.push('<b>Проверьте мощности</b>: хватит ли людей отвечать на больший поток заявок за те же минуты, иначе доля покупающих упадёт.');
      }
      verdict.setAttribute('data-s', s); set('#coV1', h1); set('#coV2', h2);
      $('#coTodo').innerHTML = line('Что делать', todo);
      // what-if (same budget)
      var p1 = (leads / 0.8) * c * ppc - budget, p2 = leads * Math.min(1, c + 0.05) * ppc - budget;
      $('#coIf').innerHTML = line('Что изменится при том же бюджете', [
        'Цена заявки ниже на 20%: ' + Math.round(leads / 0.8) + ' заявок вместо ' + Math.round(leads) + ', прибыль <b>' + sgn(p1) + '</b> (' + sgn(p1 - profit) + ' к текущей).',
        'Доля покупающих выше на 5 пунктов (' + pct(Math.min(100, conv + 5)) + '): прибыль <b>' + sgn(p2) + '</b> (' + sgn(p2 - profit) + ' к текущей).'
      ]);
      CALC_LAST = { check: check, margin: margin, budget: budget, leads: leads, conv: conv, rep: rep, cpl: Math.round(cpl), cac: Math.round(cac), profit: Math.round(profit), verdict: s };
    };
    ['#cCheck', '#cBudget', '#cLeads'].forEach(function(id){ $(id).addEventListener('input', function(e){ fmtInput(e.target); calc(); }); });
    ['#cMargin', '#cConv', '#cRep'].forEach(function(id){ $(id).addEventListener('input', function(e){ var v = e.target.value.replace(/[^\d]/g, '').slice(0, 3); if (id !== '#cRep' && +v > 100) v = '100'; if (id === '#cRep' && +v > 50) v = '50'; e.target.value = v; calc(); }); });
    $('#cExample').addEventListener('click', function(){ $('#cCheck').value = '10 000'; $('#cMargin').value = '30'; $('#cBudget').value = '40 000'; $('#cLeads').value = '40'; $('#cConv').value = '15'; $('#cRep').value = '1'; calc(); });
    calc(); window.__calc = function(){ return CALC_LAST; };
  }

  /* ---------- landing video: big play button, hero link ---------- */
  (function(){
    var box = document.getElementById('landingVideo'); if (!box) return;
    var v = box.querySelector('video'), btn = box.querySelector('.vid-play');
    function play(){ var p = v.play(); if (p && p.catch) p.catch(function(){ v.controls = true; }); }
    btn.addEventListener('click', play);
    v.addEventListener('play', function(){ box.classList.add('playing'); });
    v.addEventListener('pause', function(){ if (!v.ended) box.classList.remove('playing'); });
    v.addEventListener('ended', function(){ box.classList.remove('playing'); });
    document.addEventListener('click', function(e){
      var h = e.target.closest && e.target.closest('.hero-video'); if (!h) return;
      var y = box.getBoundingClientRect().top + window.scrollY - Math.max(70, (innerHeight - box.offsetHeight) / 2);
      window.scrollTo({ top: y, behavior: 'smooth' }); setTimeout(play, 650);
    });
  })();

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

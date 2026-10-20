/* Shaton Prime · AI-Mentor (tab "AI-Ментор"): chat with an assistant trained on our guides and courses + paywall.
   Server: workers/mentor.js (D1 + FTS5 retrieval + LLM). Needs Telegram identity (initData). window.renderMentor() draws into #view. */
(function(g){
  var CHAT_KEY = 'shaton.mentor';
  var PLANS = [
    {key:'pro_month', plan:'pro', title:'AI-Ментор PRO', per:'месяц', price:390, hint:'Полный доступ 24/7, ответы по базе наших курсов и гайдов, разбор ситуаций'},
    {key:'pro_year', plan:'pro', title:'AI-Ментор PRO', per:'год', price:1590, hint:'Всё то же, что в месячном PRO', hit:true, month:390},
    {key:'max_month', plan:'max', title:'AI-Ментор MAX', per:'месяц', price:2150, hint:'Расширенный доступ, дорожные карты и проверка заданий', month:2150},
    {key:'max_year', plan:'max', title:'AI-Ментор MAX', per:'год', price:7990, hint:'Всё то же, что в месячном MAX', month:2150}
  ];
  var CHIPS = [['С чего начать обучение?', ''], ['Разбери мою ошибку', ''], ['Составь план по гайду', ''], ['Проверь мои знания', '']];
  var MAXCHIPS = [['Дорожная карта', 'roadmap', 'Составь мне индивидуальную дорожную карту обучения'], ['Проверка задания', 'homework', 'Проверь моё домашнее задание. Вот что я сделал: ']];
  var st = null, msgs = [], busy = false, mode = '';
  function $(s, r){ return (r || document).querySelector(s); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function ldc(){ try { return JSON.parse(localStorage.getItem(CHAT_KEY) || '[]') || []; } catch(e){ return []; } }
  function svc(){ try { localStorage.setItem(CHAT_KEY, JSON.stringify(msgs.slice(-40))); } catch(e){} }
  function api(path, body){
    var t = g.tg; if (!t || !t.initData) return Promise.reject({status:0, code:'no-identity'});
    var u = g.IDEAS_API + path + (body ? '' : (path.indexOf('?') < 0 ? '?' : '&') + 'initData=' + encodeURIComponent(t.initData));
    var opt = body ? {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(Object.assign({initData:t.initData}, body))} : {cache:'no-store'};
    return fetch(u, opt).then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ j.status = r.status; return j; }); });
  }
  function rub(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'; }

  /* ---------- light Markdown (safe: everything is escaped first) ---------- */
  function inl(s){ return s.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/g, '$1<i>$2</i>'); }
  function md(src){
    var parts = esc(src).split(/```/), out = '';
    parts.forEach(function(p, i){
      if (i % 2) { out += '<pre><code>' + p.replace(/^[a-z]*\n/, '') + '</code></pre>'; return; }
      var lines = p.split('\n'), list = null, buf = [];
      function endList(){ if (list) { out += '</' + list + '>'; list = null; } }
      function endPara(){ if (buf.length) { out += '<p>' + inl(buf.join('<br>')) + '</p>'; buf = []; } }
      lines.forEach(function(l){
        var m;
        if (!l.trim()) { endPara(); endList(); return; }
        if ((m = /^\s*[-*•]\s+(.*)$/.exec(l))) { endPara(); if (list !== 'ul') { endList(); out += '<ul>'; list = 'ul'; } out += '<li>' + inl(m[1]) + '</li>'; return; }
        if ((m = /^\s*\d+[.)]\s+(.*)$/.exec(l))) { endPara(); if (list !== 'ol') { endList(); out += '<ol>'; list = 'ol'; } out += '<li>' + inl(m[1]) + '</li>'; return; }
        if ((m = /^#{1,4}\s+(.*)$/.exec(l))) { endPara(); endList(); out += '<h4>' + inl(m[1]) + '</h4>'; return; }
        if ((m = /^&gt;\s?(.*)$/.exec(l))) { endPara(); endList(); out += '<blockquote>' + inl(m[1]) + '</blockquote>'; return; }
        endList(); buf.push(l);
      });
      endPara(); endList();
    });
    return out;
  }

  /* ---------- chat view ---------- */
  function counter(){
    if (!st) return 'Загрузка…';
    if (st.active) return (st.plan === 'max' ? 'MAX' : 'PRO') + ' до ' + new Date(st.expires).toLocaleDateString('ru-RU', {day:'numeric', month:'short'}) + (st.day_left != null ? ' · сегодня ещё ' + st.day_left : '');
    return 'Бесплатно: ' + st.free_left + ' из 3 вопросов';
  }
  function head(){
    return '<div class="mt-h"><span class="mt-ava">' + spark(26) + '</span><div class="mt-t"><b>AI-Ментор</b><small><i class="mt-dot"></i>Обучен на базе всех гайдов и курсов</small></div>'
      + '<button class="mt-pro" type="button" data-mpay>PRO-доступ</button></div>'
      + '<div class="mt-c" id="mtCount">' + esc(counter()) + '</div>';
  }
  function spark(s){ return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.9 5.4L19.5 10l-5.6 1.7L12 17l-1.9-5.3L4.5 10l5.6-1.6z"/><path d="M19 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/></svg>'; }
  function chips(){
    var h = CHIPS.map(function(c){ return '<button type="button" class="mt-chip" data-mchip="' + esc(c[0]) + '">' + esc(c[0]) + '</button>'; }).join('');
    h += MAXCHIPS.map(function(c){ return '<button type="button" class="mt-chip max' + (mode === c[1] ? ' on' : '') + '" data-mmode="' + c[1] + '" data-mtxt="' + esc(c[2]) + '">' + (st && st.plan === 'max' ? '' : '🔒 ') + esc(c[0]) + ' · MAX</button>'; }).join('');
    return '<div class="mt-chips" id="mtChips">' + h + '</div>';
  }
  function bubble(m, i){
    if (m.r === 'u') return '<div class="mt-m u" style="--d:' + (i % 3) * 40 + 'ms"><div class="mt-b">' + esc(m.t).replace(/\n/g, '<br>') + '</div></div>';
    var extra = '';
    if (m.src && m.src.length) extra += '<div class="mt-src">Источники: ' + m.src.map(function(s){ return '<span>' + esc(s) + '</span>'; }).join('') + '</div>';
    if (m.gap) extra += '<div class="mt-gap">Идея для нового гайда записана. Спасибо!</div>';
    return '<div class="mt-m a"><span class="mt-av">' + spark(15) + '</span><div class="mt-b">' + md(m.t) + extra + '</div></div>';
  }
  function welcome(){
    return '<div class="mt-m a"><span class="mt-av">' + spark(15) + '</span><div class="mt-b"><p><b>Привет! Я AI-Ментор.</b> Помогаю учиться по нашим гайдам и курсам: объясняю по шагам, разбираю ошибки, составляю план и проверяю знания.</p><p>Выберите вопрос ниже или напишите свой. В конце каждого ответа я предлагаю практический шаг.</p></div></div>';
  }
  function composer(){
    var ok = !!(g.tg && g.tg.initData);
    return '<form class="mt-f" id="mtForm" autocomplete="off"><textarea id="mtIn" rows="1" maxlength="1500" placeholder="' + (ok ? (mode ? 'Опишите, что проверить или цель' : 'Задайте вопрос по гайдам…') : 'Откройте в Telegram, чтобы спросить') + '"' + (ok ? '' : ' disabled') + '></textarea>'
      + '<button type="submit" class="mt-s" id="mtSend" aria-label="Отправить"' + (ok ? '' : ' disabled') + '><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button></form>';
  }
  function draw(){
    var v = g.view || document.getElementById('view'); if (!v) return;
    v.innerHTML = '<div class="mt">' + head() + chips() + '<div class="mt-w" id="mtWin">' + welcome() + msgs.map(bubble).join('') + '</div>' + composer() + '</div>';
    scrollEnd(true);
  }
  function scrollEnd(now){ var w = $('#mtWin'); if (!w) return; var last = w.lastElementChild; if (last) last.scrollIntoView({block:'end', behavior: now ? 'auto' : 'smooth'}); }
  function typing(on){
    var w = $('#mtWin'); if (!w) return; var t = $('#mtTyping'); if (t) t.remove();
    if (on) { w.insertAdjacentHTML('beforeend', '<div class="mt-m a" id="mtTyping"><span class="mt-av">' + spark(15) + '</span><div class="mt-b mt-ty"><i></i><i></i><i></i></div></div>'); scrollEnd(); }
  }
  function setCount(){ var c = $('#mtCount'); if (c) c.textContent = counter(); }

  function send(text){
    text = (text || '').trim(); if (!text || busy) return;
    if (!(g.tg && g.tg.initData)) { if (g.toast) g.toast('Откройте приложение в Telegram'); return; }
    busy = true; var btn = $('#mtSend'); if (btn) btn.disabled = true;
    msgs.push({r:'u', t:text}); svc();
    var w = $('#mtWin'); if (w) { w.insertAdjacentHTML('beforeend', bubble(msgs[msgs.length - 1], msgs.length)); }
    var inp = $('#mtIn'); if (inp) { inp.value = ''; inp.style.height = ''; }
    typing(true);
    var md_ = mode;
    api('/mentor/chat', {message:text, mode:md_}).then(function(j){
      typing(false); busy = false; if (btn) btn.disabled = false;
      if (j.status === 402) { msgs.pop(); svc(); if (w) { var lst = w.querySelectorAll('.mt-m.u'); if (lst.length) lst[lst.length - 1].remove(); } if (j.plan) { st = j; setCount(); } paywall(j.need || 'pro'); return; }
      if (j.ok && j.reply) {
        st = j; msgs.push({r:'a', t:j.reply, src:j.sources || [], gap:!!j.gap}); svc(); setCount();
        if (w) { w.insertAdjacentHTML('beforeend', bubble(msgs[msgs.length - 1], msgs.length)); scrollEnd(); }
        if (md_ && j.plan === 'max') { /* keep the mode for the dialog */ }
        return;
      }
      var note = j.message || (j.error === 'ai-not-configured' ? 'AI-Ментор настраивается. Бесплатные вопросы не списаны.' : 'Не удалось получить ответ. Попробуйте ещё раз.');
      msgs.pop(); svc(); if (w) { var l2 = w.querySelectorAll('.mt-m.u'); if (l2.length) l2[l2.length - 1].remove(); w.insertAdjacentHTML('beforeend', '<div class="mt-m a"><span class="mt-av">' + spark(15) + '</span><div class="mt-b mt-err">' + esc(note) + '</div></div>'); scrollEnd(); }
      if (inp) inp.value = text;
    }, function(){
      typing(false); busy = false; if (btn) btn.disabled = false;
      msgs.pop(); svc(); var w2 = $('#mtWin'); if (w2) { var l3 = w2.querySelectorAll('.mt-m.u'); if (l3.length) l3[l3.length - 1].remove(); w2.insertAdjacentHTML('beforeend', '<div class="mt-m a"><span class="mt-av">' + spark(15) + '</span><div class="mt-b mt-err">Нет связи. Проверьте интернет и попробуйте ещё раз.</div></div>'); scrollEnd(); }
      if (inp) inp.value = text;
    });
  }

  /* ---------- paywall ---------- */
  function card(p, cur){
    var perMonth = p.per === 'год' ? '≈ ' + rub(Math.floor(p.price / 12)) + ' / мес' : '';
    var save = p.per === 'год' ? 'Экономия ' + rub(p.month * 12 - p.price) + ' по сравнению с оплатой 12 месяцев' : '';
    return '<div class="pw-c' + (p.hit ? ' hit' : '') + (p.plan === 'max' ? ' max' : '') + '">' + (p.hit ? '<span class="pw-b">Выгодно</span>' : '')
      + '<div class="pw-r"><b>' + esc(p.title) + ' · ' + p.per + '</b><span class="pw-p">' + rub(p.price) + '<small>/' + (p.per === 'год' ? 'год' : 'мес') + '</small></span></div>'
      + '<p>' + esc(p.hint) + '</p>' + (perMonth ? '<div class="pw-m">' + perMonth + '</div>' : '') + (save ? '<div class="pw-s">' + save + '</div>' : '')
      + '<button type="button" class="pw-go" data-mbuy="' + p.key + '">Оформить</button></div>';
  }
  function paywall(need){
    var o = document.getElementById('mtPay'); if (o) o.remove();
    o = document.createElement('div'); o.id = 'mtPay'; o.className = 'secs mt-pay';
    var left = st ? st.free_left : 0;
    o.innerHTML = '<div class="secs-b" data-mclose></div><div class="secs-s" id="mtPayS"><span class="secs-g"></span>'
      + '<h3>AI-Ментор: доступ</h3><p class="secs-l">' + (need === 'max' ? 'Дорожные карты и проверка заданий входят в тариф MAX.' : (left <= 0 && st && !st.active ? 'Бесплатные вопросы закончились. Выберите тариф, чтобы продолжить.' : 'Выберите тариф. Первые 3 вопроса бесплатны.')) + '</p>'
      + '<div class="pw-c free"><div class="pw-r"><b>Бесплатный тест</b><span class="pw-p">0 ₽</span></div><p>3 приветственных вопроса, чтобы оценить возможности ментора. Сейчас осталось: <b>' + (st ? st.free_left : 3) + '</b></p></div>'
      + PLANS.map(function(p){ return card(p); }).join('')
      + '<ul class="pw-l"><li>MAX: безлимитный ИИ в пределах справедливого использования (150 вопросов в сутки), индивидуальные дорожные карты по нашим курсам, глубокая проверка домашних заданий и проектов.</li><li>PRO: до 40 вопросов в сутки, ответы по полной базе наших курсов и гайдов, разбор ситуаций.</li></ul>'
      + '<p class="pw-n">Оплата пока подключается: после выбора тарифа откроется чат с автором, он пришлёт реквизиты и включит доступ вручную. Ответы ИИ носят справочный характер, не гарантируют результата и не заменяют консультацию специалиста. <a href="learn-tariffs.html">Тарифы и условия</a></p>'
      + '<button class="secs-x" type="button" data-mclose>Закрыть</button></div>';
    document.body.appendChild(o);
    var sh = o.querySelector('#mtPayS'), y0 = null, dy = 0;
    sh.addEventListener('touchstart', function(e){ if (sh.scrollTop <= 0) { y0 = e.touches[0].clientY; dy = 0; sh.style.transition = 'none'; } }, {passive:true});
    sh.addEventListener('touchmove', function(e){ if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); sh.style.transform = 'translateY(' + dy + 'px)'; }, {passive:true});
    sh.addEventListener('touchend', function(){ if (y0 == null) return; sh.style.transition = ''; if (dy > 90) o.remove(); else sh.style.transform = ''; y0 = null; });
  }
  function buy(key, btn){
    if (!(g.tg && g.tg.initData)) { if (g.toast) g.toast('Откройте приложение в Telegram'); return; }
    btn.disabled = true;
    api('/mentor/checkout', {plan:key}).then(function(j){
      btn.disabled = false;
      if (j && j.ok && j.url) {
        if (g.toast) g.toast('Заказ создан. Откроется чат с автором');
        try { if (g.tg.openTelegramLink) g.tg.openTelegramLink(j.url); else window.open(j.url, '_blank', 'noopener'); } catch(e){ window.open(j.url, '_blank', 'noopener'); }
      } else if (g.toast) g.toast('Не удалось создать заказ, попробуйте позже');
    }, function(){ btn.disabled = false; if (g.toast) g.toast('Нет связи, попробуйте позже'); });
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function(e){
    var t = e.target && e.target.closest ? e.target : null; if (!t) return; var x;
    if (t.closest('[data-mpay]')) { paywall('pro'); return; }
    if (t.closest('[data-mclose]')) { var o = document.getElementById('mtPay'); if (o) o.remove(); return; }
    if ((x = t.closest('[data-mbuy]'))) { buy(x.getAttribute('data-mbuy'), x); return; }
    if ((x = t.closest('[data-mchip]'))) { send(x.getAttribute('data-mchip')); return; }
    if ((x = t.closest('[data-mmode]'))) {
      if (!st || st.plan !== 'max') { paywall('max'); return; }
      var m = x.getAttribute('data-mmode'); mode = mode === m ? '' : m;
      var ch = $('#mtChips'); if (ch) ch.outerHTML = chips();
      var inp = $('#mtIn'); if (inp) { inp.placeholder = mode ? 'Опишите, что проверить или цель' : 'Задайте вопрос по гайдам…'; if (mode && !inp.value) inp.value = x.getAttribute('data-mtxt') || ''; inp.focus(); }
      return;
    }
  });
  document.addEventListener('submit', function(e){ if (e.target && e.target.id === 'mtForm') { e.preventDefault(); send($('#mtIn').value); } });
  document.addEventListener('input', function(e){ if (e.target && e.target.id === 'mtIn') { var a = e.target; a.style.height = 'auto'; a.style.height = Math.min(120, a.scrollHeight) + 'px'; } });
  document.addEventListener('keydown', function(e){ if (e.target && e.target.id === 'mtIn' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(e.target.value); } });

  g.renderMentor = function(){
    msgs = ldc(); mode = ''; draw();
    if (g.tg && g.tg.initData) api('/mentor/me').then(function(j){ if (j && j.ok) { st = j; setCount(); var ch = $('#mtChips'); if (ch) ch.outerHTML = chips(); } }, function(){});
    else { st = {free_left:3, plan:'free', active:false}; setCount(); }
  };
  g.mentorPaywall = paywall;

  /* ---------- styles ---------- */
  var css = document.createElement('style');
  css.textContent = '.mt{display:flex;flex-direction:column;min-height:calc(100dvh - 170px);padding-bottom:84px}'
    + '.mt-h{display:flex;align-items:center;gap:12px;padding:14px;border-radius:22px;border:1px solid var(--search-border);background:linear-gradient(145deg,color-mix(in oklab,#6a8bff 16%,var(--panel)),var(--panel))}'
    + '.mt-ava{flex:none;width:46px;height:46px;border-radius:15px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#2a52ff,#8a5cff);box-shadow:0 10px 22px -10px rgba(60,80,255,.8);animation:mtPulse 3.2s ease-in-out infinite}'
    + '@keyframes mtPulse{50%{box-shadow:0 10px 30px -6px rgba(140,90,255,.9);transform:translateY(-1px)}}'
    + '.mt-t{flex:1;min-width:0}.mt-t b{display:block;font-size:18px;letter-spacing:-.02em}.mt-t small{display:flex;align-items:center;gap:6px;margin-top:2px;color:var(--mute);font-weight:600;font-size:12.5px;line-height:1.25}'
    + '.mt-dot{flex:none;width:8px;height:8px;border-radius:50%;background:#1fb871;box-shadow:0 0 0 3px rgba(31,184,113,.2)}'
    + '.mt-pro{flex:none;height:38px;padding:0 14px;border-radius:99px;border:0;font-weight:800;font-size:13.5px;color:#fff;background:linear-gradient(135deg,#2a52ff,#8a5cff)}'
    + '.mt-c{margin:10px 4px 6px;font-size:13px;font-weight:700;color:var(--dim)}'
    + '.mt-chips{display:flex;gap:8px;overflow-x:auto;padding:4px 2px 10px;scrollbar-width:none}.mt-chips::-webkit-scrollbar{display:none}'
    + '.mt-chip{flex:none;height:38px;padding:0 14px;border-radius:99px;border:1px solid var(--search-border);background:var(--panel);color:var(--text);font-weight:700;font-size:13.5px;white-space:nowrap}.mt-chip.max{border-color:rgba(138,92,255,.5);color:#8a5cff}.mt-chip.on{background:#8a5cff;color:#fff}'
    + '.mt-w{display:flex;flex-direction:column;gap:12px;flex:1;padding:6px 0 12px}'
    + '.mt-m{display:flex;gap:8px;align-items:flex-end;animation:mtIn .35s cubic-bezier(.2,.9,.3,1.1) both;animation-delay:var(--d,0ms)}@keyframes mtIn{from{opacity:0;transform:translateY(12px) scale(.98)}}'
    + '.mt-m.u{justify-content:flex-end}.mt-av{flex:none;width:28px;height:28px;border-radius:10px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#2a52ff,#8a5cff)}'
    + '.mt-b{max-width:86%;padding:11px 14px;border-radius:20px;font-size:15px;line-height:1.45;overflow-wrap:anywhere}'
    + '.mt-m.a .mt-b{background:var(--panel);border:1px solid var(--search-border);border-bottom-left-radius:6px}.mt-m.u .mt-b{color:#fff;background:linear-gradient(135deg,#2a52ff,#6a5cff);border-bottom-right-radius:6px}'
    + '.mt-b p{margin:0 0 8px}.mt-b p:last-child{margin:0}.mt-b ul,.mt-b ol{margin:4px 0 8px;padding-left:20px}.mt-b li{margin:3px 0}.mt-b h4{margin:6px 0 4px;font-size:15.5px}'
    + '.mt-b code{padding:1px 6px;border-radius:6px;background:rgba(120,130,170,.18);font-size:13.5px}.mt-b pre{margin:6px 0;padding:10px 12px;border-radius:12px;background:rgba(120,130,170,.16);overflow-x:auto;font-size:13px;line-height:1.4}.mt-b pre code{padding:0;background:none}'
    + '.mt-b blockquote{margin:6px 0;padding:6px 12px;border-left:3px solid #8a5cff;background:rgba(138,92,255,.08);border-radius:0 10px 10px 0}'
    + '.mt-src{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;font-size:12px;color:var(--mute);font-weight:600}.mt-src span{padding:3px 9px;border-radius:99px;background:rgba(120,130,170,.14)}'
    + '.mt-gap{margin-top:8px;font-size:12.5px;font-weight:700;color:#1fb871}.mt-err{color:#e5485f;background:rgba(255,80,100,.1)!important}'
    + '.mt-ty{display:flex;gap:5px;padding:14px 16px}.mt-ty i{width:8px;height:8px;border-radius:50%;background:#8a5cff;animation:mtDot 1.1s infinite ease-in-out}.mt-ty i:nth-child(2){animation-delay:.15s}.mt-ty i:nth-child(3){animation-delay:.3s}@keyframes mtDot{0%,80%,100%{opacity:.3;transform:translateY(0)}40%{opacity:1;transform:translateY(-5px)}}'
    + '.mt-f{position:sticky;bottom:calc(86px + env(safe-area-inset-bottom,0px));display:flex;gap:8px;align-items:flex-end;padding:8px;border-radius:26px;border:1px solid var(--search-border);background:var(--panel);box-shadow:0 12px 30px -16px rgba(20,40,160,.5);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}'
    + '.mt-f textarea{flex:1;min-width:0;max-height:120px;resize:none;border:0;outline:0;background:transparent;color:var(--text);font:inherit;font-size:15px;line-height:1.4;padding:9px 8px}'
    + '.mt-s{flex:none;width:42px;height:42px;border-radius:50%;border:0;color:#fff;background:linear-gradient(135deg,#2a52ff,#8a5cff);display:grid;place-items:center}.mt-s:disabled,.mt-f textarea:disabled{opacity:.5}'
    + '.mt-pay .secs-s{gap:12px}.pw-c{position:relative;padding:14px 16px;border-radius:20px;border:1px solid var(--search-border);background:var(--panel)}.pw-c.hit{border-color:#2a52ff;box-shadow:0 0 0 1px #2a52ff inset}.pw-c.max{border-color:rgba(138,92,255,.6)}'
    + '.pw-b{position:absolute;top:-10px;right:14px;padding:3px 10px;border-radius:99px;font-size:11.5px;font-weight:800;color:#fff;background:linear-gradient(135deg,#2a52ff,#8a5cff)}'
    + '.pw-r{display:flex;justify-content:space-between;align-items:baseline;gap:10px}.pw-r b{font-size:16px}.pw-p{font-size:22px;font-weight:800;letter-spacing:-.02em;white-space:nowrap}.pw-p small{font-size:13px;color:var(--mute);font-weight:700}'
    + '.pw-c p{margin:6px 0 0;font-size:13.5px;line-height:1.4;color:var(--dim)}.pw-m{margin-top:6px;font-weight:800;font-size:13.5px}.pw-s{margin-top:4px;font-size:12.5px;font-weight:700;color:#1fb871}'
    + '.pw-go{width:100%;height:44px;margin-top:12px;border:0;border-radius:14px;font-weight:800;font-size:15px;color:#fff;background:linear-gradient(135deg,#2a52ff,#6a5cff)}.pw-c.max .pw-go{background:linear-gradient(135deg,#6a45ff,#b06cff)}'
    + '.pw-c.free{opacity:.95}.pw-l{margin:2px 0;padding-left:18px;font-size:13px;line-height:1.4;color:var(--dim)}.pw-n{margin:0;font-size:12px;line-height:1.4;color:var(--mute);font-weight:600}.pw-n a{color:#2a52ff}'
    + '.mbanner{display:flex;align-items:center;gap:12px;width:100%;margin:0 0 12px;padding:12px 14px;border-radius:20px;border:1px solid rgba(138,92,255,.4);background:linear-gradient(135deg,rgba(42,82,255,.14),rgba(138,92,255,.16));text-align:left;color:var(--text)}'
    + '.mbanner .mt-ava{width:42px;height:42px;border-radius:14px}.mbanner b{display:block;font-size:15.5px}.mbanner small{display:block;color:var(--mute);font-weight:600;font-size:12.5px;margin-top:1px}.mbanner>i{margin-left:auto;font-style:normal;font-size:20px;color:var(--mute)}'
    + '[data-theme="dark"] .secs-s .pw-c{background:rgba(255,255,255,.04)}@media (prefers-reduced-motion:reduce){.mt-m,.mt-ava,.mt-ty i{animation:none!important}}';
  document.head.appendChild(css);
})(window);

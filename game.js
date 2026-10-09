/* Shaton Prime: practicum mechanics inside materials (quiz, audit, case, poll, guess, hw, result) + XP, ranks and a share card.
   Blocks are emitted by md.js as <div class="gm" data-g data-id data-xp data-cfg>. State lives in localStorage "shaton.g". */
(function(g){
  var KEY = 'shaton.g', ASK = 'https://t.me/shaton_lid';
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function inl(s){ return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>'); }
  var G; try { G = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch(e){ G = {}; }
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(G)); } catch(e){} }
  function rec(pid, id){ return (G[pid] || {})[id]; }
  function put(pid, id, x, s){ (G[pid] = G[pid] || {})[id] = {x:x, s:s}; save(); changed(); }
  function earned(pid){ var t = 0, o = G[pid] || {}; for (var k in o) t += o[k].x || 0; return t; }
  var cur = {pid:null, title:'', root:null, max:0}, hudEl = null;
  function maxOf(root){ var m = 0; [].forEach.call(root.querySelectorAll('.gm'), function(e){ if (e.getAttribute('data-g') !== 'result') m += parseInt(e.getAttribute('data-xp'), 10) || 0; }); return m; }
  var PCT = [0, 25, 55, 85];
  function rankIdx(p){ var r = 0; PCT.forEach(function(t, i){ if (p >= t) r = i; }); return r; }
  function names(){ var r = cur.root && cur.root.querySelector('[data-g="result"]'); try { return JSON.parse(r.getAttribute('data-cfg')).names; } catch(e){ return ['Новичок', 'Практик', 'Стратег', 'Мастер']; } }
  function changed(){ updHud(); if (cur.root) [].forEach.call(cur.root.querySelectorAll('[data-g="result"]'), function(e){ res(e); }); }
  function updHud(){
    if (!hudEl) return; var e = earned(cur.pid), p = cur.max ? Math.round(e / cur.max * 100) : 0, n = names()[rankIdx(p)];
    hudEl.innerHTML = '<b>' + e + '</b><span>/' + cur.max + ' XP</span><i></i><em>' + esc(n) + '</em>';
    hudEl.style.setProperty('--p', Math.min(100, p) + '%');
  }
  function mk(h, cls){ var d = document.createElement('div'); d.className = cls || ''; d.innerHTML = h; return d; }
  function head(label, xp){ return '<div class="gm-h"><span class="gm-k">' + label + '</span><span class="gm-xp">+' + xp + ' XP</span></div>'; }

  /* ---------- quiz ---------- */
  function quiz(el, c, pid, id){
    var saved = rec(pid, id), done = !!saved;
    el.innerHTML = head('Проверка', 10) + '<h4>' + inl(c.q) + '</h4><div class="gm-opts">' + c.o.map(function(o, i){ return '<button class="gm-o" data-i="' + i + '"><span>' + inl(o.t) + '</span></button>'; }).join('') + '</div><div class="gm-fb" hidden></div>';
    var btns = [].slice.call(el.querySelectorAll('.gm-o')), fb = el.querySelector('.gm-fb');
    function show(i, quiet){
      var ok = !!c.o[i].c; btns.forEach(function(b, k){ b.disabled = true; if (c.o[k].c) b.classList.add('ok'); else if (k === i) b.classList.add('bad'); });
      fb.hidden = false; fb.className = 'gm-fb ' + (ok ? 'ok' : 'bad'); fb.innerHTML = '<b>' + (ok ? 'Верно, +10 XP' : 'Не совсем') + '</b> ' + inl(c.e || '');
      if (!quiet) put(pid, id, ok ? 10 : 0, {i:i});
    }
    btns.forEach(function(b){ b.onclick = function(){ if (!done) { done = true; show(+b.getAttribute('data-i')); } }; });
    if (saved && saved.s) show(saved.s.i, true);
  }

  /* ---------- audit: tap the weak spots ---------- */
  function audit(el, c, pid, id){
    var bad = c.l.filter(function(x){ return x.b; }).length, max = 10 * bad, saved = rec(pid, id), sel = {};
    el.innerHTML = head('Аудит', max) + '<h4>' + inl(c.t) + '</h4><p class="gm-hint">Нажмите на строки, где видите проблему. Всего их ' + bad + '. За ложную тревогу минус 5 XP.</p><div class="gm-rows">'
      + c.l.map(function(x, i){ return '<button class="gm-r" data-i="' + i + '"><i>' + (i + 1) + '</i><span>' + inl(x.t) + '</span></button>'; }).join('') + '</div><button class="gm-b" data-act="chk">Проверить</button><div class="gm-fb" hidden></div>';
    var rows = [].slice.call(el.querySelectorAll('.gm-r')), fb = el.querySelector('.gm-fb'), btn = el.querySelector('.gm-b'), locked = false;
    rows.forEach(function(r){ r.onclick = function(){ if (locked) return; var i = r.getAttribute('data-i'); sel[i] = !sel[i]; r.classList.toggle('sel', !!sel[i]); }; });
    function check(quiet){
      locked = true; var hit = 0, fa = 0; btn.hidden = true;
      rows.forEach(function(r, i){ var x = c.l[i], s = !!sel[i], note = '';
        if (x.b && s) { hit++; r.classList.add('ok'); note = '<em>Нашли. ' + inl(x.x) + '</em>'; }
        else if (x.b && !s) { r.classList.add('miss'); note = '<em>Пропущено. ' + inl(x.x) + '</em>'; }
        else if (!x.b && s) { fa++; r.classList.add('bad'); note = '<em>Здесь всё в порядке.' + (x.x ? ' ' + inl(x.x) : '') + '</em>'; }
        else if (x.x) note = '<em>' + inl(x.x) + '</em>';
        if (note) r.querySelector('span').insertAdjacentHTML('beforeend', note); });
      var xp = Math.max(0, Math.min(max, hit * 10 - fa * 5));
      fb.hidden = false; fb.className = 'gm-fb ' + (hit === bad && !fa ? 'ok' : 'bad'); fb.innerHTML = '<b>Найдено ' + hit + ' из ' + bad + (fa ? ', ложных тревог: ' + fa : '') + '. +' + xp + ' XP</b>';
      if (!quiet) put(pid, id, xp, {sel:sel});
    }
    btn.onclick = function(){ check(); };
    if (saved && saved.s) { sel = saved.s.sel || {}; rows.forEach(function(r, i){ if (sel[i]) r.classList.add('sel'); }); check(true); }
  }

  /* ---------- branching case ---------- */
  function cas(el, c, pid, id){
    var saved = rec(pid, id), meters = {}, picks = [], step = 0;
    c.m.forEach(function(m){ meters[m.n] = m.v; });
    function meterHtml(){ return '<div class="gm-m">' + c.m.map(function(m){ var v = Math.max(0, Math.min(100, meters[m.n])); return '<div><span>' + esc(m.n) + '</span><i><b style="width:' + v + '%"></b></i><em>' + Math.round(v) + '</em></div>'; }).join('') + '</div>'; }
    function draw(consq){
      var s = c.s[step];
      el.innerHTML = head('Кейс', 20) + '<h4>' + inl(c.t) + '</h4>' + meterHtml();
      if (step >= c.s.length) {
        var avg = c.m.reduce(function(a, m){ return a + Math.max(0, Math.min(100, meters[m.n])); }, 0) / c.m.length, xp = Math.round(20 * avg / 100), v = avg >= 70 ? 'Сильное решение: вы удержали и деньги, и доверие.' : avg >= 40 ? 'Рабочий результат, но были места, где можно было потерять меньше.' : 'Дорого обошлось. Вернитесь к разделу и пройдите кейс ещё раз.';
        el.insertAdjacentHTML('beforeend', '<div class="gm-fb ' + (avg >= 40 ? 'ok' : 'bad') + '"><b>Итог: ' + Math.round(avg) + ' из 100. +' + xp + ' XP</b> ' + esc(v) + '</div><button class="gm-b" data-act="again">Пройти заново</button>');
        el.querySelector('[data-act="again"]').onclick = function(){ meters = {}; c.m.forEach(function(m){ meters[m.n] = m.v; }); picks = []; step = 0; delete (G[pid] || {})[id]; save(); changed(); draw(); };
        if (!(rec(pid, id) && rec(pid, id).x === xp)) put(pid, id, xp, {p:picks});
        return;
      }
      el.insertAdjacentHTML('beforeend', '<div class="gm-sc"><b>Сцена ' + (step + 1) + ' из ' + c.s.length + '</b><p>' + inl(s.t) + '</p></div><div class="gm-opts">' + s.o.map(function(o, i){ return '<button class="gm-o" data-i="' + i + '"><span>' + inl(o.t) + '</span></button>'; }).join('') + '</div>');
      [].forEach.call(el.querySelectorAll('.gm-o'), function(b){ b.onclick = function(){ var o = s.o[+b.getAttribute('data-i')]; picks.push(+b.getAttribute('data-i')); for (var k in o.d) meters[k] = (meters[k] == null ? 100 : meters[k]) + o.d[k];
        step++; el.innerHTML = head('Кейс', 20) + '<h4>' + inl(c.t) + '</h4>' + meterHtml() + '<div class="gm-fb ' + (o.r ? 'ok' : '') + '"><b>Вы выбрали:</b> ' + inl(o.t) + '<br>' + inl(o.r) + '</div><button class="gm-b" data-act="next">' + (step >= c.s.length ? 'Посмотреть итог' : 'Дальше') + '</button>';
        el.querySelector('[data-act="next"]').onclick = function(){ draw(); }; }; });
    }
    if (saved && saved.s && saved.s.p) { saved.s.p.forEach(function(i){ var o = c.s[step].o[i]; for (var k in o.d) meters[k] = (meters[k] == null ? 100 : meters[k]) + o.d[k]; step++; }); picks = saved.s.p.slice(); }
    draw();
  }

  /* ---------- self-diagnosis poll ---------- */
  function poll(el, c, pid, id){
    var saved = rec(pid, id);
    el.innerHTML = head('Диагностика', 5) + '<h4>' + inl(c.q) + '</h4><div class="gm-opts">' + c.o.map(function(o, i){ return '<button class="gm-o" data-i="' + i + '"><span>' + inl(o.t) + '</span></button>'; }).join('') + '</div><div class="gm-fb" hidden></div>';
    var btns = [].slice.call(el.querySelectorAll('.gm-o')), fb = el.querySelector('.gm-fb');
    function show(i, quiet){ btns.forEach(function(b, k){ b.disabled = true; if (k === i) b.classList.add('pick'); }); fb.hidden = false; fb.className = 'gm-fb ok'; fb.innerHTML = c.o[i].n ? '<b>Ваш маршрут:</b> ' + inl(c.o[i].n) : '<b>Принято.</b>'; if (!quiet) put(pid, id, 5, {i:i}); }
    btns.forEach(function(b){ b.onclick = function(){ if (!el._d) { el._d = 1; show(+b.getAttribute('data-i')); } }; });
    if (saved && saved.s) { el._d = 1; show(saved.s.i, true); }
  }

  /* ---------- guess the number ---------- */
  function guess(el, c, pid, id){
    var saved = rec(pid, id), mid = Math.round((c.min + c.max) / 2);
    el.innerHTML = head('Угадай цифру', 15) + '<h4>' + inl(c.q) + '</h4><div class="gm-sl"><output>' + mid + ' ' + esc(c.u) + '</output><input type="range" min="' + c.min + '" max="' + c.max + '" step="' + (c.max - c.min > 20 ? 1 : 0.1) + '" value="' + mid + '"></div><button class="gm-b" data-act="go">Зафиксировать</button><div class="gm-fb" hidden></div>';
    var inp = el.querySelector('input'), out = el.querySelector('output'), fb = el.querySelector('.gm-fb'), btn = el.querySelector('.gm-b');
    inp.oninput = function(){ out.textContent = inp.value + ' ' + c.u; };
    function show(v, quiet){
      var d = Math.abs(v - c.a) / (c.max - c.min), xp = d <= .1 ? 15 : d <= .25 ? 10 : 4;
      inp.disabled = true; btn.hidden = true; fb.hidden = false; fb.className = 'gm-fb ' + (d <= .25 ? 'ok' : 'bad');
      fb.innerHTML = '<b>Вы назвали ' + v + ' ' + esc(c.u) + ', правильно: ' + c.a + ' ' + esc(c.u) + '. +' + xp + ' XP</b> ' + inl(c.n);
      if (!quiet) put(pid, id, xp, {v:v});
    }
    btn.onclick = function(){ show(parseFloat(inp.value)); };
    if (saved && saved.s) { inp.value = saved.s.v; out.textContent = saved.s.v + ' ' + c.u; show(saved.s.v, true); }
  }

  /* ---------- homework with a self-check rubric ---------- */
  function hw(el, c, pid, id, xpMax){
    var saved = rec(pid, id), total = c.c.reduce(function(a, x){ return a + x.p; }, 0), on = {};
    el.innerHTML = head('Домашнее задание', xpMax) + '<h4>' + inl(c.t) + '</h4>' + c.d.map(function(p){ return '<p class="gm-d">' + inl(p) + '</p>'; }).join('')
      + '<div class="gm-rub"><b>Проверка по критериям</b><span class="gm-hint">Отметьте только то, что действительно сделано. Это честная самопроверка: баллы нужны вам, не мне.</span>'
      + c.c.map(function(x, i){ return '<label class="gm-c"><input type="checkbox" data-i="' + i + '"><span class="bx"></span><span>' + inl(x.t) + '</span><em>' + x.p + '</em></label>'; }).join('')
      + '</div><div class="gm-sum"><span>Баллы: <b data-s>0</b> из ' + total + '</span><i><b style="width:0"></b></i></div><div class="gm-verd" hidden></div>'
      + '<div class="gm-btns"><button class="gm-b" data-act="fix">Зафиксировать результат</button><a class="gm-b alt" data-act="send" target="_blank" rel="noopener" hidden>Показать автору</a></div>';
    var boxes = [].slice.call(el.querySelectorAll('input')), sEl = el.querySelector('[data-s]'), bar = el.querySelector('.gm-sum i b'), vd = el.querySelector('.gm-verd'), send = el.querySelector('[data-act="send"]'), fix = el.querySelector('[data-act="fix"]');
    function score(){ var s = 0; boxes.forEach(function(b, i){ if (b.checked) s += c.c[i].p; }); return s; }
    function upd(){ var s = score(); sEl.textContent = s; bar.style.width = (total ? s / total * 100 : 0) + '%'; }
    boxes.forEach(function(b){ b.onchange = upd; });
    function verdict(p){ var t = ''; c.v.forEach(function(v){ if (p >= v.f) t = v.t; }); return t; }
    function done(quiet){
      var s = score(), p = total ? Math.round(s / total * 100) : 0, xp = Math.round(xpMax * p / 100), items = c.c.filter(function(x, i){ return boxes[i].checked; }).map(function(x){ return '• ' + x.t; });
      vd.hidden = false; vd.innerHTML = '<b>' + p + '%</b> ' + esc(verdict(p)) + ' <em>+' + xp + ' XP</em>';
      var txt = 'Домашнее задание «' + c.t + '» из практикума «' + cur.title + '». Самопроверка: ' + s + ' из ' + total + ' (' + p + '%).\n' + items.join('\n') + '\n\nПокажите, что у меня получилось, и подскажите, что улучшить.';
      send.hidden = false; send.href = ASK + '?text=' + encodeURIComponent(txt);
      boxes.forEach(function(b){ b.disabled = true; }); fix.hidden = true;
      if (!quiet) put(pid, id, xp, {on:boxes.map(function(b){ return b.checked ? 1 : 0; })});
    }
    fix.onclick = function(){ done(); };
    if (saved && saved.s) { (saved.s.on || []).forEach(function(v, i){ if (boxes[i]) boxes[i].checked = !!v; }); upd(); done(true); }
  }

  /* ---------- result card + share image ---------- */
  function name(){ try { var p = JSON.parse(localStorage.getItem('shaton.profile') || 'null'); return (p && p.name) || ''; } catch(e){ return ''; } }
  function res(el){
    var c = JSON.parse(el.getAttribute('data-cfg')), e = earned(cur.pid), mx = cur.max, p = mx ? Math.round(e / mx * 100) : 0, ri = rankIdx(p), nx = ri < 3 ? PCT[ri + 1] : null;
    el.innerHTML = head('Итог практикума', 0).replace('+0 XP', '') + '<div class="gm-rank"><div class="gm-ring" style="--p:' + Math.min(100, p) + '"><b>' + p + '%</b></div><div><span class="gm-k">Ваш ранг</span><strong>' + esc(c.names[ri]) + '</strong><span class="gm-hint">' + e + ' из ' + mx + ' XP' + (nx != null ? '. До следующего ранга ещё ' + Math.max(0, Math.ceil(mx * nx / 100 - e)) + ' XP' : '. Максимальный ранг') + '</span></div></div>'
      + (c.note ? '<p class="gm-d">' + inl(c.note) + '</p>' : '') + '<div class="gm-btns"><button class="gm-b" data-act="card">Скачать карточку</button><button class="gm-b alt" data-act="reset">Начать практикум заново</button></div>';
    el.querySelector('[data-act="card"]').onclick = function(){ card(c.names[ri], e, mx, p); };
    el.querySelector('[data-act="reset"]').onclick = function(){ if (confirm('Стереть ваши ответы и XP в этом материале?')) { delete G[cur.pid]; save(); mount(cur.root, cur.pid, cur.title, true); } };
  }
  function card(rank, e, mx, p){
    var cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1350; var x = cv.getContext('2d'), F = 'Manrope, Inter, system-ui, sans-serif';
    var bg = x.createLinearGradient(0, 0, 1080, 1350); bg.addColorStop(0, '#ffffff'); bg.addColorStop(.5, '#eef5ff'); bg.addColorStop(1, '#d9e8ff'); x.fillStyle = bg; x.fillRect(0, 0, 1080, 1350);
    var gl = x.createRadialGradient(880, 300, 0, 880, 300, 520); gl.addColorStop(0, 'rgba(69,115,255,.35)'); gl.addColorStop(1, 'rgba(69,115,255,0)'); x.fillStyle = gl; x.fillRect(0, 0, 1080, 1350);
    var g2 = x.createRadialGradient(200, 1180, 0, 200, 1180, 480); g2.addColorStop(0, 'rgba(22,217,227,.25)'); g2.addColorStop(1, 'rgba(22,217,227,0)'); x.fillStyle = g2; x.fillRect(0, 0, 1080, 1350);
    function rr(a, b, w, h, r){ x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
    x.fillStyle = 'rgba(255,255,255,.62)'; rr(80, 360, 920, 700, 56); x.fill(); x.strokeStyle = 'rgba(255,255,255,.95)'; x.lineWidth = 3; x.stroke();
    x.fillStyle = '#234bff'; x.font = '700 34px ' + F; x.fillText('SHATON PRIME · ПРАКТИКУМ', 80, 130);
    x.fillStyle = '#050914'; x.font = '800 72px ' + F; wrap(cur.title, 80, 240, 920, 82);
    x.fillStyle = '#596984'; x.font = '600 34px ' + F; x.fillText(name() ? name() : 'Участник практикума', 130, 440);
    x.fillStyle = '#234bff'; x.font = '800 150px ' + F; x.fillText(rank, 130, 640);
    x.fillStyle = '#050914'; x.font = '700 44px ' + F; x.fillText(e + ' из ' + mx + ' XP · ' + p + '%', 130, 740);
    x.fillStyle = 'rgba(35,75,255,.12)'; rr(130, 800, 820, 28, 14); x.fill(); var gr = x.createLinearGradient(130, 0, 950, 0); gr.addColorStop(0, '#234bff'); gr.addColorStop(.6, '#3976ff'); gr.addColorStop(1, '#16d9e3'); x.fillStyle = gr; rr(130, 800, Math.max(28, 820 * Math.min(100, p) / 100), 28, 14); x.fill();
    x.fillStyle = '#596984'; x.font = '500 32px ' + F; x.fillText('Карточка прохождения: ответы, кейсы и домашнее задание', 130, 920); x.fillText('выполнены самостоятельно в приложении.', 130, 966);
    x.fillStyle = '#050914'; x.font = '800 40px ' + F; x.fillText('t.me/shatonlab', 80, 1250); x.fillStyle = '#596984'; x.font = '500 28px ' + F; x.fillText(new Date().toLocaleDateString('ru-RU'), 80, 1296);
    function wrap(t, a, b, w, lh){ var words = t.split(' '), line = '', y = b; words.forEach(function(wd){ var tt = line ? line + ' ' + wd : wd; if (x.measureText(tt).width > w && line) { x.fillText(line, a, y); line = wd; y += lh; } else line = tt; }); x.fillText(line, a, y); }
    cv.toBlob(function(b){ var f = new File([b], 'shaton-card.png', {type:'image/png'}); if (navigator.canShare && navigator.canShare({files:[f]})) navigator.share({files:[f]}).catch(function(){}); else { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'shaton-card.png'; a.click(); } });
  }

  /* ---------- mount ---------- */
  function mount(root, pid, title, again){
    unmount(); cur = {pid:pid, title:title || '', root:root, max:maxOf(root)};
    var blocks = [].slice.call(root.querySelectorAll('.gm')); if (!blocks.length) return;
    blocks.forEach(function(el){
      var k = el.getAttribute('data-g'), id = el.getAttribute('data-id'), xp = parseInt(el.getAttribute('data-xp'), 10) || 0, c; try { c = JSON.parse(el.getAttribute('data-cfg')); } catch(e){ return; }
      el.className = 'gm gm-' + k + (el.classList.contains('in') ? ' in' : '');
      try { ({quiz:quiz, audit:audit, case:cas, poll:poll, guess:guess})[k] && ({quiz:quiz, audit:audit, case:cas, poll:poll, guess:guess})[k](el, c, pid, id); if (k === 'hw') hw(el, c, pid, id, xp); if (k === 'result') res(el); } catch(err){ console.warn('gm', k, err); }
    });
    hudEl = document.createElement('button'); hudEl.className = 'gm-hud'; hudEl.setAttribute('aria-label', 'Ваш прогресс в практикуме');
    hudEl.onclick = function(){ var r = root.querySelector('[data-g="result"]'); if (r) r.scrollIntoView({behavior:'smooth', block:'center'}); };
    document.body.appendChild(hudEl); updHud();
  }
  function unmount(){ if (hudEl) { hudEl.remove(); hudEl = null; } cur = {pid:null, title:'', root:null, max:0}; }
  g.Game = {mount:mount, unmount:unmount, earned:earned};
})(window);

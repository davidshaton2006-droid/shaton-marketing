/* Shaton Prime: interactive game-style guide. A small glass character walks the user through the app with a spotlight on real elements.
   Window.Guide.start(force). Shown once automatically (localStorage shaton.guide), can be replayed from Profile. */
(function(g){
  var KEY = 'shaton.guide', timer = 0, step = 0, steps = [], root = null;
  function $(s){ return document.querySelector(s); }
  function seen(){ try { return !!localStorage.getItem(KEY); } catch(e){ return false; } }
  function mark(){ try { localStorage.setItem(KEY, '1'); } catch(e){} }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  function script(){
    return [
      {t:'Привет! Я Прайм', p:'Покажу, как здесь всё устроено. Это займёт минуту, а в конце вас ждёт бесплатный материал.', pose:'wave'},
      {sel:'.stories', t:'Истории', p:'Короткие советы по Авито, Директу, сайтам и SEO. Нажимайте и листайте: за просмотр копятся баллы.', pose:'point'},
      {sel:'#promo', t:'Подписка и материалы', p:'Листайте карточки. Подписка 1 000 ₽ в месяц открывает все платные материалы, а у каждого материала своя цена.', pose:'point'},
      {sel:'.tab[data-mode]', t:'Режим: бизнес или обучение', p:'Нажмите «Режим» и выберите: «Для бизнеса» (сделать здесь и сейчас) или «Обучение» (читать и учиться). Ошиблись? Не страшно: материалы доступны в обоих режимах и в ленте.', pose:'point'},
      {sel:'#ptsPill', t:'Ваши баллы', p:'За просмотр историй, чтение, ответы в заданиях и друзей копятся баллы, а за оплату материала их сразу много. Позже их можно будет потратить на материал или на то, чтобы собрать что-то бесплатно.', pose:'point'},
      {sel:'.tab[data-go="fav"]', t:'Избранное', p:'Сердечко на карточке сохраняет материал сюда, чтобы вернуться позже.', pose:'point'},
      {sel:'.tab[data-go="me"]', t:'Профиль, баллы и друзья', p:'В профиле: ваш ранг, инструкция, идеи для разборов и приглашения. Позвали 3 друзей, которые подписались на канал, и я открою для чтения один платный материал.', pose:'point'},
      {t:'Готово! Начнём?', p:'За прохождение инструкции вам +20 баллов. Откройте бесплатное руководство: в нём задания, кейсы и новые баллы.', pose:'cheer', last:true}
    ];
  }
  function bot(pose){
    var face = pose === 'cheer' ? '<path d="M24 41c3 4 9 4 12 0" />' : '<path d="M25 41c2.4 2 7.6 2 10 0" />';
    return '<svg viewBox="0 0 60 64" class="gd-bot gd-'+pose+'" aria-hidden="true"><defs><linearGradient id="gdg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fb0ff"/><stop offset="1" stop-color="#7a5cff"/></linearGradient></defs>'
      +'<ellipse cx="30" cy="60" rx="16" ry="3" fill="rgba(40,70,200,.25)"/>'
      +'<path d="M30 3v7" stroke="url(#gdg)" stroke-width="3" stroke-linecap="round"/><circle cx="30" cy="3.5" r="3" fill="#19d3e6"/>'
      +'<rect x="8" y="10" width="44" height="46" rx="18" fill="url(#gdg)" opacity=".92"/><rect x="8" y="10" width="44" height="46" rx="18" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="1.5"/>'
      +'<path d="M14 18c5-4 14-5 22-3" stroke="rgba(255,255,255,.7)" stroke-width="3" stroke-linecap="round" fill="none"/>'
      +'<circle cx="22" cy="30" r="4.2" fill="#0b1636"/><circle cx="38" cy="30" r="4.2" fill="#0b1636"/><circle cx="23.2" cy="28.8" r="1.4" fill="#fff"/><circle cx="39.2" cy="28.8" r="1.4" fill="#fff"/>'
      +'<g stroke="#0b1636" stroke-width="2.4" fill="none" stroke-linecap="round">'+face+'</g></svg>';
  }
  function build(){
    root = document.createElement('div'); root.id = 'gd'; root.className = 'gd';
    root.innerHTML = '<div class="gd-shade"></div><div class="gd-ring" id="gdRing"></div>'
      +'<div class="gd-card" id="gdCard" role="dialog" aria-modal="true" aria-label="Инструкция"><div class="gd-who" id="gdWho"></div><div class="gd-b"><b id="gdT"></b><p id="gdP"></p><div class="gd-dots" id="gdD"></div>'
      +'<div class="gd-act"><button type="button" class="gd-skip" id="gdSkip">Пропустить</button><button type="button" class="gd-next" id="gdNext">Дальше</button></div></div></div>';
    document.body.appendChild(root);
    $('#gdSkip').onclick = function(){ close(); };
    $('#gdNext').onclick = function(){ next(); };
    root.querySelector('.gd-shade').onclick = function(){ next(); };
  }
  function place(){
    var s = steps[step], ring = $('#gdRing'), card = $('#gdCard'); if (!s) return;
    var el = s.sel ? $(s.sel) : null;
    if (el) {
      el.scrollIntoView({block:'center', behavior:'auto'});
      var r = el.getBoundingClientRect(), pad = 8;
      ring.style.cssText = 'opacity:1;left:'+(r.left - pad)+'px;top:'+(r.top - pad)+'px;width:'+(r.width + pad * 2)+'px;height:'+(r.height + pad * 2)+'px';
      var below = r.top < innerHeight / 2;
      card.style.top = below ? Math.min(r.bottom + 18, innerHeight - card.offsetHeight - 12) + 'px' : Math.max(12, r.top - card.offsetHeight - 18) + 'px';
    } else {
      ring.style.cssText = 'opacity:0;left:50%;top:40%;width:0;height:0';
      card.style.top = Math.max(12, (innerHeight - card.offsetHeight) / 2) + 'px';
    }
  }
  function show(){
    var s = steps[step];
    $('#gdWho').innerHTML = bot(s.pose || 'point');
    $('#gdT').textContent = s.t; $('#gdP').textContent = s.p;
    $('#gdD').innerHTML = steps.map(function(_, i){ return '<i class="'+(i === step ? 'on' : i < step ? 'done' : '')+'"></i>'; }).join('');
    $('#gdNext').textContent = s.last ? 'Открыть бесплатный материал' : 'Дальше';
    $('#gdSkip').style.visibility = s.last ? 'hidden' : 'visible';
    var c = $('#gdCard'); c.classList.remove('in'); void c.offsetWidth; c.classList.add('in');
    requestAnimationFrame(place); setTimeout(place, 60);
  }
  function next(){
    var s = steps[step];
    if (s && s.last) { close(); try { var f = document.querySelector('.post [data-p], .post'); var id = f && (f.getAttribute('data-p')); var free = (window.MATS || []).filter(function(m){ return m.free; })[0]; if (g.go && (free || id)) g.go('post', (free && free.id) || id); } catch(e){} return; }
    step++; if (step >= steps.length) return close(); show();
  }
  function close(){ var wasLast = steps[step] && steps[step].last; mark(); if (wasLast && window.Pts) Pts.award('guide', Pts.RULES.guide); if (root) { root.remove(); root = null; } document.body.classList.remove('gd-on'); window.removeEventListener('resize', place); }
  function start(force){
    if (root) return;
    if (!force && seen()) return;
    if (g.cur && g.cur.name !== 'home') { if (g.go) g.go('home'); }
    steps = script(); step = 0; build(); document.body.classList.add('gd-on');
    window.addEventListener('resize', place); setTimeout(show, 150);
  }
  var css = document.createElement('style');
  css.textContent = '.gd{position:fixed;inset:0;z-index:120}.gd-shade{position:absolute;inset:0;background:rgba(6,12,30,.35)}'
    +'.gd-ring{position:fixed;border-radius:20px;border:2px solid #8fb0ff;box-shadow:0 0 0 9999px rgba(6,12,30,.55),0 0 28px rgba(110,140,255,.9);pointer-events:none;transition:left .35s cubic-bezier(.2,.8,.2,1),top .35s cubic-bezier(.2,.8,.2,1),width .35s,height .35s,opacity .2s;animation:gdPulse 1.8s ease-in-out infinite}'
    +'@keyframes gdPulse{50%{box-shadow:0 0 0 9999px rgba(6,12,30,.55),0 0 40px rgba(160,130,255,1)}}'
    +'.gd-card{position:fixed;left:14px;right:14px;max-width:440px;margin:0 auto;display:flex;gap:12px;align-items:flex-end;padding:14px 16px;border-radius:24px;background:#fff;color:#0b1636;border:1px solid var(--search-border,#dde);box-shadow:0 20px 50px -16px rgba(20,40,160,.55);transition:top .35s cubic-bezier(.2,.8,.2,1)}'
    +'.gd-card.in{animation:gdIn .3s cubic-bezier(.2,.9,.3,1.2)}@keyframes gdIn{from{opacity:.4;transform:translateY(10px) scale(.97)}}'
    +'.gd-who{flex:none;width:62px}.gd-bot{width:62px;height:66px;overflow:visible;animation:gdBob 2.6s ease-in-out infinite}.gd-cheer{animation:gdJump .9s ease-in-out infinite}.gd-wave{animation:gdWave 1.6s ease-in-out infinite;transform-origin:50% 90%}'
    +'@keyframes gdBob{50%{transform:translateY(-5px)}}@keyframes gdJump{40%{transform:translateY(-14px) rotate(-4deg)}}@keyframes gdWave{25%{transform:rotate(-7deg)}75%{transform:rotate(7deg)}}'
    +'.gd-b{flex:1;min-width:0}.gd-b b{display:block;font-size:17px;letter-spacing:-.01em}.gd-b p{margin:5px 0 0;font-size:14px;line-height:1.38;color:var(--dim,#445)}'
    +'.gd-dots{display:flex;gap:5px;margin:10px 0}.gd-dots i{width:16px;height:5px;border-radius:99px;background:var(--search-border,#cde)}.gd-dots i.on{background:#6a8bff;width:26px}.gd-dots i.done{background:#8fb0ff}'
    +'.gd-act{display:flex;align-items:center;justify-content:space-between;gap:10px}.gd-skip{background:none;border:0;color:var(--mute,#778);font-weight:700;font-size:13.5px;padding:8px 4px}'
    +'.gd-next{height:42px;padding:0 18px;border-radius:99px;border:0;font-weight:800;font-size:14.5px;color:#fff;background:linear-gradient(135deg,#2a52ff,#7a5cff)}'
    +'body.gd-on{overflow:hidden}@media (prefers-reduced-motion:reduce){.gd-ring,.gd-bot,.gd-card.in{animation:none}}';
  css.textContent += '[data-theme="dark"] .gd-card{background:#121c38;color:#eef2ff;border-color:rgba(130,160,255,.35)}[data-theme="dark"] .gd-b p{color:#b6c3e6}';
  document.head.appendChild(css);
  g.Guide = {start:start, close:close, seen:seen};
  /* first launch: give the home screen a moment to render, then offer the tour */
  window.addEventListener('load', function(){ setTimeout(function(){ if (!seen() && g.cur && g.cur.name === 'home' && !(document.getElementById('story') && !document.getElementById('story').hidden)) start(false); }, 1600); });
})(window);

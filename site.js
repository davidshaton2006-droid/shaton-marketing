(function(){
  if (!window.gsap) return;
  var mm = gsap.matchMedia();

  mm.add({ motion: "(prefers-reduced-motion: no-preference)" }, function(){
    var h1 = document.querySelector('.hero h1');
    // wrap each word in a masked span so lines rise up from below
    (function splitWords(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(n){
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function(part){
            if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
            var mask = document.createElement('span');
            mask.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.08em;';
            var w = document.createElement('span');
            w.className = 'hw';
            w.style.display = 'inline-block';
            w.textContent = part;
            mask.appendChild(w);
            frag.appendChild(mask);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          splitWords(n);
        }
      });
    })(h1);

    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from('.hero-arcs', { autoAlpha: 0, scale: .8, rotation: -25, duration: 1.6, ease: "power2.out" }, 0)
      .from('.hero .eyebrow', { autoAlpha: 0, x: -20, duration: .6 }, .1)
      .from('.hero h1 .hw', { yPercent: 110, rotation: 3, duration: .9, stagger: .07 }, .2)
      .from('.hero .lede', { autoAlpha: 0, y: 20, duration: .7 }, "-=.5")
      .from('.hero-cta-row .btn', { autoAlpha: 0, scale: .85, y: 16, duration: .6, ease: "back.out(1.7)" }, "-=.4")
      .from('.hero-tip', { autoAlpha: 0, x: -16, duration: .5 }, "<.15")
      .from('.hero-video', { autoAlpha: 0, y: 12, duration: .5 }, "-=.2")
      .from('.hero-photo-wrap', { autoAlpha: 0, duration: 1, ease: "power2.out" }, .4)
      .from('.stat-row', { borderTopColor: 'rgba(255,255,255,0)', borderBottomColor: 'rgba(255,255,255,0)', duration: .6 }, "-=.6")
      .from('.stat-row .stat', { autoAlpha: 0, y: 24, duration: .6, stagger: .1 }, "<");

    // count-up on stat numbers, e.g. "9+" -> 0..9 then "+"
    document.querySelectorAll('.stat-row b').forEach(function(el, i){
      var m = el.textContent.match(/^(\d+)(.*)$/);
      if (!m) return;
      var target = parseInt(m[1], 10), suffix = m[2], obj = { v: 0 };
      tl.to(obj, { v: target, duration: 1, ease: "power1.out",
        onUpdate: function(){ el.textContent = Math.round(obj.v) + suffix; },
        onComplete: function(){ el.textContent = m[1] + suffix; }
      }, .95 + i * .1);
    });

    // ambient loops after intro
    gsap.to('.hero-arcs', { rotation: "+=360", duration: 90, ease: "none", repeat: -1, delay: 1.7 });
    gsap.to('.hero-cta-row .btn-primary', { boxShadow: '0 14px 34px -8px rgba(255,46,147,.9)', duration: 1.4, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 2 });

    // subtle pointer parallax
    var hero = document.querySelector('.hero');
    var qa = gsap.quickTo('.hero-arcs', 'x', { duration: 1.2, ease: "power3" });
    hero.addEventListener('mousemove', function(e){
      var r = hero.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
      qa(nx * -30);
    });

    return function(){ tl.kill(); };
  });
})();
;
(function(){
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var D = reduce ? 0 : 1;
  var $ = function(s, r){ return (r || document).querySelector(s); };
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- page scroll progress bar ---------- */
  var bar = document.createElement('div'); bar.className = 'scroll-progress'; document.body.appendChild(bar);
  gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  /* ---------- dots ---------- */
  $$('.dots').forEach(function(d){ for (var i = 0; i < +d.dataset.dots; i++) d.appendChild(document.createElement('i')); });
  function setDots(root, idx){ $$('.dots i', root).forEach(function(d, i){ d.classList.toggle('on', i === idx); }); }

  /* ================= CHAPTER 1: ORBIT ================= */
  var orbitPanel = $('.stick-orbit .panel');
  if (orbitPanel) {
    var NODES = [
      { t: 'Авито',  d: 'Оформляю профиль и объявления и слежу за алгоритмом, чтобы вас находили выше конкурентов и клиенты писали сами' },
      { t: 'Директ', d: 'Настраиваю рекламу в Яндексе на тех, кто уже ищет вашу услугу, и слежу, чтобы бюджет не сливался' },
      { t: 'Сайт',   d: 'Делаю сайты и приложения, которые превращают посетителей в заявки, а не просто выглядят красиво' },
      { t: 'SEO',    d: 'Чтобы клиенты находили вас в поиске сами, даже когда реклама выключена' },
      { t: 'SMM',    d: 'Веду контент и Reels, которые приводят клиентов, а не просто собирают лайки' }
    ];
    var ALL = { t: 'Один человек', d: 'Все пять направлений — в одной голове, без потери контекста' };
    var NS = 'http://www.w3.org/2000/svg';
    var mk = function(n, a, p){ var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
    var spin = $('.spin', orbitPanel), R = 130, nodes = [];
    NODES.forEach(function(n, i){
      var a = (-90 + i * 72) * Math.PI / 180, x = R * Math.cos(a), y = R * Math.sin(a), len = R;
      mk('line', { x1: 0, y1: 0, x2: x, y2: y, stroke: 'rgba(255,120,160,.4)', 'stroke-width': 1.2, 'stroke-dasharray': '2 5' }, spin);
      var line = mk('line', { x1: 0, y1: 0, x2: x, y2: y, stroke: '#ff2e93', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-dasharray': len, 'stroke-dashoffset': len }, spin);
      var ni = mk('g', {}, spin);
      var c = mk('circle', { cx: x, cy: y, r: 35, fill: '#2a2724', stroke: 'rgba(255,255,255,.18)' }, ni);
      var tx = mk('text', { x: x, y: y, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#fff', 'font-family': 'Montserrat', 'font-weight': 700, 'font-size': 12.5 }, ni);
      tx.textContent = n.t;
      nodes.push({ line: line, ni: ni, c: c, x: x, y: y, len: len });
    });

    var rotSt = { v: 0 };
    var applyRot = function(){
      spin.setAttribute('transform', 'rotate(' + rotSt.v + ')');
      nodes.forEach(function(n){ n.ni.setAttribute('transform', 'rotate(' + (-rotSt.v) + ' ' + n.x + ' ' + n.y + ')'); });
    };
    var setRot = gsap.quickTo(rotSt, 'v', { duration: 0.9, ease: 'power3', onUpdate: applyRot });

    var oT = $('.oc-t', orbitPanel), oP = $('.oc-p', orbitPanel), cur = null;
    function setNode(v){
      if (v === cur) return; cur = v;
      var all = v === 'all', info = all ? ALL : NODES[v];
      nodes.forEach(function(n, i){
        var on = all || i === v;
        gsap.to(n.c, { attr: { r: (on && !all) ? 42 : 35 }, fill: on ? '#ff2e93' : '#2a2724', duration: 0.5 * D, ease: 'back.out(2)', overwrite: 'auto' });
        gsap.to(n.ni, { opacity: on ? 1 : 0.4, duration: 0.4 * D, overwrite: 'auto' });
        gsap.to(n.line, { strokeDashoffset: on ? 0 : n.len, duration: 0.7 * D, ease: 'power2.out', overwrite: 'auto' });
      });
      oT.textContent = info.t; oP.textContent = info.d;
      gsap.fromTo([oT, oP], { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5 * D, stagger: 0.08 * D, ease: 'power3.out', overwrite: 'auto' });
      setDots(orbitPanel, all ? 2 : [0, 1, 3, 4, 5][v]);
    }
    setNode('all'); setDots(orbitPanel, 0);

    $$('.chapter-orbit [data-node]').forEach(function(sec){
      var v = sec.dataset.node === 'all' ? 'all' : +sec.dataset.node;
      ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%', onToggle: function(s){ if (s.isActive) setNode(v); } });
    });

    var prog = $('.prog', orbitPanel), C = 2 * Math.PI * 176;
    prog.setAttribute('stroke-dasharray', C); prog.setAttribute('stroke-dashoffset', C);
    ScrollTrigger.create({ trigger: '.chapter-orbit', start: 'top bottom', end: 'bottom top', onUpdate: function(s){
      setRot(s.progress * 160);
      gsap.to(prog, { strokeDashoffset: C * (1 - s.progress), duration: 0.3, overwrite: true });
    } });

    if (!reduce) {
      gsap.to($('.halo', orbitPanel), { opacity: 0.55, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      var pg = $('.particles', orbitPanel);
      for (var k = 0; k < 6; k++) {
        var g = mk('g', {}, pg), r = 92 + Math.random() * 78, a2 = Math.random() * 6.28;
        mk('circle', { cx: r * Math.cos(a2), cy: r * Math.sin(a2), r: 1.5 + Math.random() * 1.8, fill: k % 3 ? '#ff6b9d' : '#fff', opacity: 0.55 }, g);
        gsap.to(g, { rotation: (Math.random() > 0.5 ? 360 : -360), svgOrigin: '0 0', duration: 24 + Math.random() * 40, repeat: -1, ease: 'none' });
      }
    }
  }

  /* ================= CHAPTER 2: PHONE ================= */
  var phonePanel = $('.stick-phone .panel');
  if (phonePanel) {
    var SCR = [
      { t: 'Профиль', d: 'Один человек ведёт проект лично', a: 'Работаю лично', b: 'Без менеджеров' },
      { t: 'Отзывы', d: 'Только реальные отзывы клиентов', a: 'Без выдуманных имён', b: 'Реальные истории' },
      { t: 'Заявка', d: 'Вы заполняете форму, заявка собирается здесь', a: 'Ответ в течение суток', b: 'Без менеджеров' },
      { t: 'Отчёт', d: 'Прозрачная отчётность без воды', a: 'Заявки, а не просмотры', b: 'Понятные цифры' },
      { t: 'Формат', d: 'Формат под задачу, не по шаблону', a: 'Базовый · ПРО · Премиум', b: 'Разово или на постоянку' },
      { t: 'Аудит', d: 'Оставляете заявку, разбор за сутки', a: 'Ответ в течение суток', b: 'Созвон или видео-разбор' }
    ];
    var scrs = $$('.scr', phonePanel), pcT = $('.pc-t', phonePanel), pcP = $('.pc-p', phonePanel);
    var chipA = $('.chip-a', phonePanel), chipB = $('.chip-b', phonePanel), line = $('.line', phonePanel);
    var pcur = 0;
    if (line) { var ll = line.getTotalLength(); line.style.strokeDasharray = ll; }

    function setScr(i){
      if (i === pcur) return;
      var prev = scrs[pcur], next = scrs[i]; pcur = i;
      gsap.to(prev, { autoAlpha: 0, y: -18, duration: 0.35 * D, overwrite: true });
      gsap.fromTo(next, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.5 * D, ease: 'power3.out', overwrite: true });
      gsap.fromTo($$('.stg', next), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5 * D, stagger: 0.08 * D, delay: 0.12 * D, ease: 'power2.out', overwrite: true });
      if (i === 3 && line) gsap.fromTo(line, { strokeDashoffset: ll }, { strokeDashoffset: 0, duration: 1.1 * D, delay: 0.3 * D, ease: 'power2.inOut' });
      pcT.textContent = SCR[i].t; pcP.textContent = SCR[i].d;
      gsap.fromTo([pcT, pcP], { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5 * D, stagger: 0.08 * D, overwrite: 'auto' });
      chipA.textContent = SCR[i].a; chipB.textContent = SCR[i].b;
      gsap.fromTo(chipA, { autoAlpha: 0, x: -20, scale: 0.8 }, { autoAlpha: 1, x: 0, scale: 1, duration: 0.6 * D, delay: 0.2 * D, ease: 'back.out(2)', overwrite: 'auto' });
      gsap.fromTo(chipB, { autoAlpha: 0, x: 20, scale: 0.8 }, { autoAlpha: 1, x: 0, scale: 1, duration: 0.6 * D, delay: 0.35 * D, ease: 'back.out(2)', overwrite: 'auto' });
      setDots(phonePanel, i);
    }
    setDots(phonePanel, 0);

    $$('.chapter-phone [data-scr]').forEach(function(sec){
      ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%', onToggle: function(s){ if (s.isActive) setScr(+sec.dataset.scr); } });
    });

    var fit = function(){
      var k = Math.min(1.2, (phonePanel.clientHeight - 190) / 470);
      var w = $('.phone-wrap', phonePanel); w.style.setProperty('--k', k); w.style.height = (470 * k) + 'px';
      $('.phone-scale', phonePanel).style.setProperty('--k', k);
    };
    fit(); window.addEventListener('resize', fit);

    gsap.set('.phone-float', { transformPerspective: 900 });
    var tiltY = gsap.quickTo('.phone-float', 'rotationY', { duration: 0.8, ease: 'power3' });
    var tiltX = gsap.quickTo('.phone-float', 'rotationX', { duration: 0.8, ease: 'power3' });
    ScrollTrigger.create({ trigger: '.chapter-phone', start: 'top bottom', end: 'bottom top', onUpdate: function(s){
      if (reduce) return;
      tiltY(-14 + s.progress * 28); tiltX(Math.sin(s.progress * Math.PI * 2) * 4);
    } });
    if (!reduce) gsap.to('.phone-float', { y: -8, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }

  if (reduce) { document.fonts && document.fonts.ready.then(function(){ ScrollTrigger.refresh(); }); return; }

  /* ================= GLOBAL: headings / text / cards / buttons ================= */
  function splitWords(node){
    Array.prototype.slice.call(node.childNodes).forEach(function(n){
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function(part){
          if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
          var mask = document.createElement('span');
          mask.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.1em;margin-bottom:-.1em;';
          var w = document.createElement('span'); w.className = 'hw'; w.style.display = 'inline-block'; w.textContent = part;
          mask.appendChild(w); frag.appendChild(mask);
        });
        node.replaceChild(frag, n);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') splitWords(n);
    });
  }

  $$('section:not(.hero) h2, .quote-card p, .philosophy blockquote, .gift h3').forEach(function(h){
    splitWords(h);
    gsap.from($$('.hw', h), { yPercent: 115, rotation: 3, duration: 0.9, stagger: 0.05, ease: 'power3.out',
      scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
  });

  var CARDS = '.sit,.wg-card,.fit-card,.exp-card,.why-card,.proc-card,.case-card,.plan,.testi-card,.rev-none,.stat:not(.stat-row .stat),.founder-stats > div,.trust-list span';
  var cards = $$(CARDS).filter(function(el){ return !el.closest('.hero,.phone'); });
  var flagScale = function(t){ return t.classList.contains('flag') ? 1.02 : 1; };
  cards.forEach(function(el){ gsap.set(el, { autoAlpha: 0, y: 44, scale: 0.95 * flagScale(el) }); });
  ScrollTrigger.batch(cards, { start: 'top 90%', once: true, onEnter: function(b){
    gsap.to(b, { autoAlpha: 1, y: 0, scale: function(i, t){ return flagScale(t); }, duration: 0.85, stagger: 0.09, ease: 'power3.out' });
  } });

  cards.forEach(function(el){
    el.addEventListener('mouseenter', function(){ gsap.to(el, { y: -7, duration: 0.35, ease: 'power2.out', overwrite: 'auto' }); });
    el.addEventListener('mouseleave', function(){ gsap.to(el, { y: 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' }); });
  });

  var TEXTS = $$('.eyebrow, p, li, details, .task, .quiz, .founder-photo, .quote-photo, .trust-video, .gift')
    .filter(function(el){ return !el.closest('.hero,.phone,.stick,.cta-form,.q-result,.oc,.chip,.pp') && !el.closest(CARDS) && !el.querySelector('.hw') && !el.closest('.quote-card,.philosophy') || el.matches('.gift,.quiz,.founder-photo,.quote-photo,.trust-video'); });
  TEXTS = TEXTS.filter(function(el, i, arr){ return arr.indexOf(el) === i; });
  TEXTS.forEach(function(el){ gsap.set(el, { autoAlpha: 0, y: 28 }); });
  ScrollTrigger.batch(TEXTS, { start: 'top 92%', once: true, onEnter: function(b){
    gsap.to(b, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.07, ease: 'power3.out' });
  } });

  var btns = $$('.btn').filter(function(el){ return !el.closest('.hero,.q-step,.q-result,.pp'); });
  btns.forEach(function(el){ gsap.set(el, { autoAlpha: 0, scale: 0.85 }); });
  ScrollTrigger.batch(btns, { start: 'top 94%', once: true, onEnter: function(b){
    gsap.to(b, { autoAlpha: 1, scale: 1, duration: 0.7, stagger: 0.08, ease: 'back.out(1.8)' });
  } });

  /* magnetic buttons + press */
  $$('.btn').forEach(function(b){
    var qx = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3' }), qy = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3' });
    var arrow = b.querySelector('[aria-hidden]');
    b.addEventListener('mousemove', function(e){
      var r = b.getBoundingClientRect();
      qx((e.clientX - r.left - r.width / 2) * 0.28); qy((e.clientY - r.top - r.height / 2) * 0.4);
    });
    b.addEventListener('mouseenter', function(){ if (arrow) gsap.to(arrow, { x: 5, duration: 0.3, overwrite: 'auto' }); });
    b.addEventListener('mouseleave', function(){ qx(0); qy(0); if (arrow) gsap.to(arrow, { x: 0, duration: 0.4, overwrite: 'auto' }); });
    b.addEventListener('mousedown', function(){ gsap.to(b, { scale: 0.94, duration: 0.12, overwrite: 'auto' }); });
    window.addEventListener('mouseup', function(){ gsap.to(b, { scale: 1, duration: 0.5, ease: 'elastic.out(1,.5)', overwrite: 'auto' }); });
  });

  /* section-specific flourishes */
  if ($('.quote-card')) gsap.from('.quote-card', { clipPath: 'inset(0 100% 0 0 round 20px)', duration: 1.1, ease: 'power3.inOut', scrollTrigger: { trigger: '.quote-card', start: 'top 85%', once: true } });
  if ($('.quote-photo')) gsap.fromTo('.quote-photo', { yPercent: 6 }, { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.quote-band', scrub: true } });
  $$('.gift .confetti').forEach(function(c, i){ gsap.to(c, { y: -14 - i * 4, x: (i % 2 ? 8 : -8), duration: 2 + i * 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1 }); });
  gsap.to('.plan.flag', { boxShadow: '0 22px 48px -14px rgba(255,46,147,.55)', duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  $$('.play-btn').forEach(function(p){ gsap.to(p, { boxShadow: '0 0 0 22px rgba(255,46,147,0)', duration: 1.6, repeat: -1, ease: 'power1.out' }); });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ ScrollTrigger.refresh(); });
  window.addEventListener('load', function(){ ScrollTrigger.refresh(); });
})();
;
(function(){
  if (!window.gsap || !window.ScrollTrigger) return;
  // Portfolio data. Edit titles/tags here; images live in /pf (thumbnail `img`, large version `full`). Add `link:'https://...'` to show a "Открыть сайт" button in the viewer.
  var ROWS = [{"label":"Сайты","items":[{"t":"Фабрика кофе","tag":"Сайт · интернет-магазин","img":"pf/64.webp","full":"pf/64-full.webp"},{"t":"Доставка суши и роллов","tag":"Сайт · доставка","img":"pf/61.webp","full":"pf/61-full.webp"},{"t":"Механическая обработка металла","tag":"Сайт · производство","img":"pf/66.webp","full":"pf/66-full.webp"},{"t":"Ресторан грузинской кухни","tag":"Лендинг + каталог","img":"pf/77.webp","full":"pf/77-full.webp"},{"t":"Недвижимость на Кипре","tag":"Сайт · недвижимость","img":"pf/67.webp","full":"pf/67-full.webp"},{"t":"Клининг в Санкт-Петербурге","tag":"Лендинг · услуги","img":"pf/63.webp","full":"pf/63-full.webp"},{"t":"Спецтехника для любых задач","tag":"Сайт · аренда техники","img":"pf/79.webp","full":"pf/79-full.webp"},{"t":"Детский бассейн","tag":"Лендинг · услуги","img":"pf/60.webp","full":"pf/60-full.webp"}]},{"label":"Обложки, которые не пролистывают","items":[{"t":"Кейс: дома","tag":"Обложка · строительство","img":"pf/c1.webp","full":"pf/c1-full.webp"},{"t":"Загрузили клининг заявками","tag":"Обложка · клининг","img":"pf/c2.webp","full":"pf/c2-full.webp"},{"t":"Потолки = поток заявок","tag":"Обложка · натяжные потолки","img":"pf/c3.webp","full":"pf/c3-full.webp"},{"t":"Ремонт квартир = клиенты","tag":"Обложка · ремонт","img":"pf/c4.webp","full":"pf/c4-full.webp"},{"t":"Грузоперевозки = заказы","tag":"Обложка · грузоперевозки","img":"pf/c5.webp","full":"pf/c5-full.webp"},{"t":"Кондиционеры = поток заявок","tag":"Обложка · климат","img":"pf/c6.webp","full":"pf/c6-full.webp"},{"t":"Автоэлектрик = клиенты","tag":"Обложка · автосервис","img":"pf/c7.webp","full":"pf/c7-full.webp"},{"t":"Клининг заявками: Avito","tag":"Обложка · клининг","img":"pf/c8.webp","full":"pf/c8-full.webp"}]},{"label":"Кейсы и статистика","items":[{"t":"Кейс: грузоперевозки","tag":"Кейс · Авито","img":"pf/30.webp","full":"pf/30-full.webp"},{"t":"Кейс: сантехник","tag":"Кейс · Авито","img":"pf/49.webp","full":"pf/49-full.webp"},{"t":"Кейс: одежда и обувь","tag":"Кейс · Авито","img":"pf/31.webp","full":"pf/31-full.webp"},{"t":"Кейс: репетитор","tag":"Кейс · Авито","img":"pf/48.webp","full":"pf/48-full.webp"},{"t":"Статистика: стройка","tag":"Кабинет Авито","img":"pf/36.webp","full":"pf/36-full.webp"},{"t":"Статистика: автокраны","tag":"Кабинет Авито","img":"pf/47.webp","full":"pf/47-full.webp"},{"t":"Статистика: база отдыха","tag":"Кабинет Авито","img":"pf/29.webp","full":"pf/29-full.webp"},{"t":"Наружная реклама","tag":"Графика","img":"pf/54.webp","full":"pf/54-full.webp"}]}];
  var rows = Array.prototype.slice.call(document.querySelectorAll('.pp-row'));
  var all = [];

  ROWS.forEach(function(r, ri){
    var label = document.createElement('div'); label.className = 'pp-rl'; label.textContent = r.label;
    rows[ri].parentNode.insertBefore(label, rows[ri]);
    r.items.forEach(function(p){
      var el = document.createElement('button'); el.type = 'button'; el.className = 'pp-card has-img';
      el.setAttribute('aria-label', p.t + ' — открыть крупно');
      el.innerHTML = '<span class="pp-thumb"><img width="640" height="480" loading="lazy" decoding="async"></span><span class="pp-tag"></span><span class="pp-ov"></span><span class="pp-name"></span>';
      var im = el.querySelector('img'); im.src = p.img; im.alt = p.t; im.draggable = false;
      el.querySelector('.pp-tag').textContent = p.tag; el.querySelector('.pp-name').textContent = p.t;
      var n = all.push(p) - 1;
      el.addEventListener('click', function(){ openLb(n, el); });
      rows[ri].appendChild(el);
    });
  });

  /* ----- lightbox ----- */
  var lb = document.createElement('div'); lb.className = 'lb'; lb.hidden = true;
  lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Просмотр проекта');
  lb.innerHTML = '<button class="lb-x" type="button" aria-label="Закрыть">×</button>' +
    '<button class="lb-nav lb-prev" type="button" aria-label="Предыдущий">‹</button><button class="lb-nav lb-next" type="button" aria-label="Следующий">›</button>' +
    '<div class="lb-scroll"><img class="lb-img" alt=""></div><div class="lb-cap"><b></b><span></span></div>';
  document.body.appendChild(lb);
  var lbImg = lb.querySelector('.lb-img'), lbScroll = lb.querySelector('.lb-scroll'), cur = 0, opener = null;
  function show(i){
    cur = (i + all.length) % all.length; var p = all[cur];
    lb.classList.add('loading'); lbImg.onload = function(){ lb.classList.remove('loading'); };
    lbImg.src = p.full; lbImg.alt = p.t; lbScroll.scrollTop = 0;
    lb.querySelector('.lb-cap b').textContent = p.t; lb.querySelector('.lb-cap span').textContent = p.tag;
  }
  function openLb(i, from){ opener = from; lb.hidden = false; document.documentElement.style.overflow = 'hidden'; show(i); lb.querySelector('.lb-x').focus(); }
  function closeLb(){ lb.hidden = true; document.documentElement.style.overflow = ''; lbImg.removeAttribute('src'); if (opener) opener.focus(); }
  lb.querySelector('.lb-x').addEventListener('click', closeLb);
  lb.querySelector('.lb-prev').addEventListener('click', function(){ show(cur - 1); });
  lb.querySelector('.lb-next').addEventListener('click', function(){ show(cur + 1); });
  lb.addEventListener('click', function(e){ if (e.target === lb || e.target === lbScroll) closeLb(); });
  (function(){
    var sx = 0, sy = 0, sid = null;
    lbScroll.addEventListener('pointerdown', function(e){ sid = e.pointerId; sx = e.clientX; sy = e.clientY; });
    lbScroll.addEventListener('pointerup', function(e){
      if (e.pointerId !== sid) return; sid = null;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) show(cur + (dx < 0 ? 1 : -1));
    });
    lbScroll.addEventListener('pointercancel', function(){ sid = null; });
  })();
  document.addEventListener('keydown', function(e){
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb(); else if (e.key === 'ArrowLeft') show(cur - 1); else if (e.key === 'ArrowRight') show(cur + 1);
  });

  /* ----- parallax ----- */
  var section = document.querySelector('.pp');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { section.classList.add('pp-static'); return; }

  var stage = section.querySelector('.pp-stage');
  var cur2 = { p: 0, i: 0 }, tgt = { p: 0, i: 0 }, live = false, dirty = true, k = 1, travel = [0, 0, 0];
  var drag = [0, 0, 0], vel = [0, 0, 0], press = [false, false, false];
  function bounds(i){ return i === 1 ? [-travel[i], 0] : [0, travel[i]]; }
  function baseX(i){ return (i === 1 ? -1 : 1) * cur2.p * travel[i]; }
  function clampDrag(i){
    var b = bounds(i), base = baseX(i), tot = Math.max(b[0], Math.min(b[1], base + drag[i]));
    if (tot !== base + drag[i]) vel[i] = 0;
    drag[i] = tot - base;
  }
  function measure(){
    var vw = window.innerWidth; k = Math.min(1, vw / 1200);
    rows.forEach(function(r, i){
      var w = 0; for (var c = r.firstElementChild; c; c = c.nextElementSibling) w += c.offsetWidth;
      w += (parseFloat(getComputedStyle(r).columnGap) || 0) * Math.max(0, r.children.length - 1);
      travel[i] = Math.max(0, w - vw + 40);
    });
    dirty = true;
  }
  function apply(){
    var i = cur2.i;
    stage.style.transform = i > 0.998 ? 'translate3d(0,0,0)' :
      'translate3d(0,' + (-160 * k * (1 - i)).toFixed(1) + 'px,0) rotateX(' + (15 * (1 - i)).toFixed(2) + 'deg) rotateZ(' + (20 * k * (1 - i)).toFixed(2) + 'deg)';
    stage.style.opacity = (0.2 + 0.8 * i).toFixed(3);
    for (var r = 0; r < 3; r++) rows[r].style.transform = 'translate3d(' + (baseX(r) + drag[r]).toFixed(1) + 'px,0,0)';
  }
  function tick(){
    for (var r = 0; r < 3; r++) {
      if (!press[r] && Math.abs(vel[r]) > 0.02) { drag[r] += vel[r] * 16; vel[r] *= 0.94; dirty = true; }
      if (dirty) clampDrag(r);
    }
    var dp = tgt.p - cur2.p, di = tgt.i - cur2.i;
    if (!live && !dirty) return;
    if (Math.abs(dp) < 0.0004 && Math.abs(di) < 0.0004) { if (dirty || dp || di) { cur2.p = tgt.p; cur2.i = tgt.i; dirty = false; apply(); } return; }
    cur2.p += dp * 0.14; cur2.i += di * 0.14; dirty = false; apply();
  }
  gsap.ticker.add(tick);
  ScrollTrigger.create({ trigger: section, start: 'top bottom', end: 'bottom top',
    onToggle: function(s){ live = s.isActive; },
    onUpdate: function(s){ tgt.p = s.progress; tgt.i = Math.min(1, s.progress / 0.3); } });
  measure(); apply();
  rows.forEach(function(row, i){
    var id = null, sx = 0, sd = 0, moved = false, samples = [];
    row.addEventListener('pointerdown', function(e){
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      id = e.pointerId; sx = e.clientX; sd = drag[i]; moved = false; row._moved = false; vel[i] = 0; press[i] = true;
      samples = [[e.clientX, performance.now()]];
    });
    row.addEventListener('pointermove', function(e){
      if (e.pointerId !== id || !press[i]) return;
      var dx = e.clientX - sx;
      if (!moved && Math.abs(dx) > 6) { moved = true; row.classList.add('dragging'); try { row.setPointerCapture(id); } catch (err) {} }
      if (moved) {
        drag[i] = sd + dx; clampDrag(i); dirty = true;
        samples.push([e.clientX, performance.now()]); if (samples.length > 6) samples.shift();
      }
    });
    function end(e){
      if (e.pointerId !== id) return;
      press[i] = false; id = null; row.classList.remove('dragging');
      if (moved) {
        row._moved = true;
        var a = samples[0], b = samples[samples.length - 1], dt = b[1] - a[1];
        vel[i] = dt > 0 ? Math.max(-3, Math.min(3, (b[0] - a[0]) / dt)) : 0;
        if (performance.now() - b[1] > 90) vel[i] = 0;
        dirty = true;
      }
    }
    row.addEventListener('pointerup', end); row.addEventListener('pointercancel', end);
    row.addEventListener('click', function(e){ if (row._moved) { e.stopPropagation(); e.preventDefault(); row._moved = false; } }, true);
  });
  window.addEventListener('resize', measure); window.addEventListener('load', measure);
})();
;
(function(){
  var form = document.getElementById('leadForm'); if (!form) return;
  // To send requests for real, put a form endpoint here (Formspree / Web3Forms / your own API). Empty = compose-and-copy mode.
  var ENDPOINT = '';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function(s){ return document.querySelector(s); };
  var data = { niche: '', goal: '' };

  function mirror(id, val, placeholder){
    var el = document.getElementById(id); if (!el) return;
    var v = (val || '').trim();
    el.textContent = v || placeholder; el.classList.toggle('ph', !v);
    if (window.gsap && !reduce) gsap.fromTo(el.parentNode, { backgroundColor: '#ffe0ee' }, { backgroundColor: '#ffffff', duration: 0.7, overwrite: true });
  }
  $('#lf-name').addEventListener('input', function(e){ mirror('pf-name', e.target.value, 'Как вас зовут'); e.target.classList.remove('err'); });
  $('#lf-contact').addEventListener('input', function(e){ mirror('pf-contact', e.target.value, 'Telegram или телефон'); e.target.classList.remove('err'); });

  Array.prototype.forEach.call(form.querySelectorAll('.chips-row'), function(row){
    var key = row.dataset.key;
    Array.prototype.forEach.call(row.querySelectorAll('.opt-chip'), function(chip){
      chip.addEventListener('click', function(){
        Array.prototype.forEach.call(row.children, function(c){ c.classList.remove('on'); });
        chip.classList.add('on'); data[key] = chip.textContent;
        mirror(key === 'niche' ? 'pf-niche' : 'pf-goal', chip.textContent, '');
      });
    });
  });

  var status = $('#leadStatus');
  function fail(msg, input){ status.className = 'lead-status err'; status.textContent = msg; if (input) { input.classList.add('err'); input.focus(); } }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var name = $('#lf-name'), contact = $('#lf-contact');
    if (!name.value.trim()) return fail('Укажите, как к вам обращаться.', name);
    if (!contact.value.trim()) return fail('Оставьте Telegram или телефон, чтобы я мог ответить.', contact);
    if (!$('#lf-consent').checked) return fail('Нужно согласие на обработку персональных данных.');
    var text = 'Заявка на бесплатный аудит\nИмя: ' + name.value.trim() + '\nКонтакт: ' + contact.value.trim() +
      '\nСфера: ' + (data.niche || '—') + '\nЦель: ' + (data.goal || '—') +
      ($('#lf-msg').value.trim() ? '\nЗадача: ' + $('#lf-msg').value.trim() : '');
    var btn = $('#pf-btn');

    function done(html, title){
      status.className = 'lead-status'; status.innerHTML = '<div class="mp"><b>' + title + '</b><span>+ разбор в течение суток</span></div>' + html;
      btn.textContent = 'Готово ✓';
      if (window.gsap && !reduce) gsap.fromTo(btn, { scale: 0.92 }, { scale: 1, duration: 0.6, ease: 'back.out(2.4)' });
    }
    if (ENDPOINT) {
      status.className = 'lead-status'; status.textContent = 'Отправляю…';
      fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ name: name.value.trim(), contact: contact.value.trim(), niche: data.niche, goal: data.goal, message: $('#lf-msg').value.trim() }) })
        .then(function(r){ if (!r.ok) throw new Error(r.status); btn.textContent = 'Отправлено ✓'; done('Отвечу лично в течение суток.', 'Заявка принята'); btn.textContent = 'Отправлено ✓'; })
        .catch(function(){ fail('Не удалось отправить. Попробуйте ещё раз чуть позже.'); });
      return;
    }
    var box = document.createElement('div'); box.className = 'msg-box'; box.textContent = text;
    done('Пока отправка не подключена: скопируйте текст и отправьте мне любым удобным способом.', 'Заявка собрана');
    status.appendChild(box);
    var copy = document.createElement('button'); copy.type = 'button'; copy.className = 'btn btn-ghost'; copy.textContent = 'Скопировать текст';
    copy.addEventListener('click', function(){
      var ok = function(){ copy.textContent = 'Скопировано ✓'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, function(){ selectBox(); });
      else selectBox();
      function selectBox(){ var r = document.createRange(); r.selectNodeContents(box); var sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); copy.textContent = 'Выделено — нажмите Ctrl+C'; }
    });
    status.appendChild(copy);
  });
})();
;
(function(){
  var box = document.getElementById('cmp'); if (!box || !window.gsap) return;
  var handle = box.querySelector('.cmp-handle'), labL = box.querySelector('.cmp-l'), labR = box.querySelector('.cmp-r');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var st = { p: 50 }, auto = null, idleT = null, side = 1;

  function apply(){
    var p = Math.max(0, Math.min(100, st.p));
    box.style.setProperty('--p', p + '%');
    handle.setAttribute('aria-valuenow', Math.round(p));
    labL.style.opacity = p > 24 ? 1 : 0; labR.style.opacity = p < 76 ? 1 : 0;
  }
  function stopAuto(){ if (auto) { auto.kill(); auto = null; } gsap.killTweensOf(st); clearTimeout(idleT); }
  function hold(){ auto = gsap.delayedCall(5 + Math.random() * 2, sweep); }
  function sweep(){
    var target = side > 0 ? 90 : 10; side = -side;
    auto = gsap.to(st, { p: target, duration: 1.7, ease: 'power3.inOut', onUpdate: apply, onComplete: hold });
  }
  function startAuto(){ if (reduce) return; stopAuto(); hold(); }
  function touch(){ box.classList.add('touched'); }

  function pos(e){ var r = box.getBoundingClientRect(); return Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)); }
  box.addEventListener('pointerdown', function(e){
    if (e.button > 0) return;
    stopAuto(); touch(); box.classList.add('drag');
    try { box.setPointerCapture(e.pointerId); } catch (err) {}
    var onHandle = handle.contains(e.target);
    if (onHandle) { st.p = pos(e); apply(); }
    else gsap.to(st, { p: pos(e), duration: 0.3, ease: 'power2.out', onUpdate: apply });
  });
  box.addEventListener('pointermove', function(e){
    if (!box.classList.contains('drag')) return;
    gsap.killTweensOf(st); st.p = pos(e); apply();
  });
  function end(){
    if (!box.classList.contains('drag')) return;
    box.classList.remove('drag'); idleT = setTimeout(startAuto, 9000);
  }
  box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
  box.addEventListener('lostpointercapture', end);

  handle.addEventListener('keydown', function(e){
    var d = { ArrowLeft: -5, ArrowRight: 5 }[e.key];
    if (e.key === 'Home') st.p = 0; else if (e.key === 'End') st.p = 100; else if (d) st.p += d; else return;
    e.preventDefault(); stopAuto(); touch(); apply(); idleT = setTimeout(startAuto, 9000);
  });

  apply(); startAuto();
})();
;
(function(){
  var steps = Array.prototype.slice.call(document.querySelectorAll('.q-step'));
  var bars = Array.prototype.slice.call(document.querySelectorAll('.quiz-progress i'));
  var result = document.querySelector('.q-result');
  var current = 0, answers = {};

  function showStep(i){
    steps.forEach(function(s,idx){ s.classList.toggle('active', idx===i); });
    bars.forEach(function(b,idx){ b.classList.toggle('done', idx<=i); });
    result.classList.remove('active');
  }

  steps.forEach(function(step, idx){
    var opts = step.querySelectorAll('.opt');
    var nextBtn = step.querySelector('.next, .finish');
    var backBtn = step.querySelector('.back');

    opts.forEach(function(opt){
      opt.addEventListener('click', function(){
        opts.forEach(function(o){ o.classList.remove('selected'); });
        opt.classList.add('selected'); answers[idx] = opt.textContent;
        if(nextBtn) nextBtn.disabled = false;
      });
    });

    if(backBtn){ backBtn.addEventListener('click', function(){ current = idx - 1; showStep(current); }); }
    if(nextBtn && nextBtn.classList.contains('next')){
      nextBtn.addEventListener('click', function(){ current = idx + 1; showStep(current); });
    }
    if(nextBtn && nextBtn.classList.contains('finish')){
      nextBtn.addEventListener('click', function(){
        steps.forEach(function(s){ s.classList.remove('active'); });
        result.classList.add('active');
        [['niche', 0], ['goal', 2]].forEach(function(p){
          var row = document.querySelector('.chips-row[data-key="' + p[0] + '"]'); if (!row || !answers[p[1]]) return;
          Array.prototype.forEach.call(row.querySelectorAll('.opt-chip'), function(c){ if (c.textContent === answers[p[1]]) c.click(); });
        });
      });
    }
  });
})();
;
(function(){
  // Put the Telegram channel URL here (e.g. 'https://t.me/yourchannel'); every "PDF в Telegram" button will start working and the "ссылка появится" notes disappear.
  var TG_URL = 'https://t.me/avitolog_123';
  Array.prototype.forEach.call(document.querySelectorAll('[data-tg]'), function(a){
    if (TG_URL) { a.href = TG_URL; a.target = '_blank'; a.rel = 'noopener'; }
    else a.addEventListener('click', function(e){ e.preventDefault(); });
  });
  if (TG_URL) Array.prototype.forEach.call(document.querySelectorAll('[data-tgnote]'), function(n){ n.remove(); });
})();
;
if ('serviceWorker' in navigator) { window.addEventListener('load', function(){ navigator.serviceWorker.register('sw.js').catch(function(){}); }); }
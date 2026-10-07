/* Shaton Site Builder: an interactive questionnaire inside the app that produces a ready static website (ZIP) from templates.
   Everything runs in the browser. AI text help is optional: set ShatonBuilder.ai.endpoint to a protected proxy (see workers/ai-proxy.js);
   without it the builder uses rule-based suggestions. window.SiteBuilder.mount(el) */
(function(g){
  var KEY = 'shaton.site', ASK = 'https://t.me/avitolog_23';
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function ld(){ try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch(e){ return null; } }
  function sv(o){ try { var c = JSON.parse(JSON.stringify(o)); delete c.photo; delete c.works; localStorage.setItem(KEY, JSON.stringify(c)); } catch(e){} }
  var AI = {endpoint:''};

  /* ---------------- data model ---------------- */
  var TYPES = {
    card: {n:'Визитка специалиста', d:'Кто вы, услуги, цены и контакты на одной странице', faq:['Сколько стоит работа?', 'Как быстро вы начнёте?', 'Что если результат не подойдёт?'], steps:['Вы пишете мне', 'Обсуждаем задачу и цену', 'Выполняю работу', 'Вы принимаете результат']},
    landing: {n:'Лендинг одной услуги', d:'Оффер, выгоды, этапы, вопросы и заявка', faq:['Сколько это стоит?', 'Через сколько будет результат?', 'Что входит в услугу?', 'Как проходит оплата?'], steps:['Оставляете обращение', 'Уточняем детали и согласуем стоимость', 'Приступаем к работе', 'Сдаём результат и отвечаем на вопросы']},
    portfolio: {n:'Портфолио', d:'Работы крупно, описание подхода и контакт для заказа', faq:['Как заказать работу?', 'Сколько занимает проект?', 'Можно ли внести правки?'], steps:['Вы описываете задачу', 'Согласуем объём и сроки', 'Показываю промежуточный результат', 'Сдаю работу и вношу правки']}
  };
  var CTAS = {tg:'Написать в Telegram', tel:'Позвонить', wa:'Написать в WhatsApp', mail:'Написать на почту'};
  var ACCENTS = ['#234bff', '#6a45ff', '#0a8696', '#a23fd0', '#0f8f7d', '#1470d6'];
  var TPL = {pearl:'Pearl Glass', graphite:'Graphite', aurora:'Aurora', studio:'Studio', sunrise:'Sunrise'};
  function blank(){ return {step:0, type:'card', cta:'tg', name:'', role:'', city:'', tagline:'', audience:'', diff:'', years:'', services:[{n:'', p:'', t:'', b:''}, {n:'', p:'', t:'', b:''}, {n:'', p:'', t:'', b:''}], adv:['', '', ''], steps:[], reviews:[{n:'', t:''}], faq:[], tel:'', tg:'', wa:'', mail:'', addr:'', hours:'', legalName:'', inn:'', status:'selfemployed', yform:'', ym:'', tpl:'pearl', accent:'#234bff', seoTitle:'', seoDesc:''}; }

  /* ---------------- rule-based copy helpers ---------------- */
  function sug(d, k){
    var role = (d.role || 'специалист').trim(), city = d.city ? ' в городе ' + d.city.trim() : '', aud = (d.audience || '').trim(), diff = (d.diff || '').trim();
    if (k === 'tagline') return role.charAt(0).toUpperCase() + role.slice(1) + (d.city ? ' · ' + d.city.trim() : '');
    if (k === 'seoTitle') return ((d.name || role) + ' — ' + role + (d.city ? ', ' + d.city : '')).slice(0, 70);
    if (k === 'seoDesc') return (role + (d.city ? ' в ' + d.city : '') + (aud ? ' для ' + aud : '') + '. ' + (diff || 'Цены, этапы работы и контакты на сайте.') + ' Свяжитесь, чтобы обсудить задачу.').slice(0, 160);
    return '';
  }
  function faqAnswer(d, q){
    if (/стоит|цен/i.test(q)) return d.services[0] && d.services[0].p ? 'Стоимость зависит от задачи. Ориентир: ' + d.services[0].n + ' — от ' + d.services[0].p + '. Точную цену назову после короткого обсуждения.' : 'Стоимость зависит от задачи. Напишите, и я назову точную цену после короткого обсуждения.';
    if (/быстро|срок|через сколько/i.test(q)) return 'Обычно приступаю в течение нескольких дней после согласования. Конкретный срок называю заранее и фиксирую в договорённости.';
    if (/правк|не подой/i.test(q)) return 'Мы заранее обсуждаем результат. Если что-то не подходит, вношу правки в рамках согласованного объёма.';
    if (/оплат/i.test(q)) return 'Способы оплаты согласуем при обсуждении. Все условия фиксируем письменно.';
    if (/входит/i.test(q)) return 'Состав работ согласуем заранее, чтобы не было сюрпризов по объёму и цене.';
    return 'Подробности согласуем в личной переписке. Напишите, и я отвечу.';
  }
  function ensure(d){
    var T = TYPES[d.type] || TYPES.card;
    if (!d.steps.length) d.steps = T.steps.slice();
    if (!d.faq.length) d.faq = T.faq.map(function(q){ return {q:q, a:''}; });
    return d;
  }

  /* ---------------- ZIP (store) ---------------- */
  var CRC = (function(){ var t = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b){ var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function u8(s){ return new TextEncoder().encode(s); }
  function zip(files){
    var chunks = [], cd = [], off = 0, dt = new Date(), time = (dt.getHours() << 11) | (dt.getMinutes() << 5) | (dt.getSeconds() >> 1), date = ((dt.getFullYear() - 1980) << 9) | ((dt.getMonth() + 1) << 5) | dt.getDate();
    function w16(a, v){ a.push(v & 255, (v >> 8) & 255); } function w32(a, v){ a.push(v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255); }
    files.forEach(function(f){
      var name = u8(f.name), data = f.data, crc = crc32(data), h = [];
      w32(h, 0x04034b50); w16(h, 20); w16(h, 0x0800); w16(h, 0); w16(h, time); w16(h, date); w32(h, crc); w32(h, data.length); w32(h, data.length); w16(h, name.length); w16(h, 0);
      chunks.push(new Uint8Array(h), name, data);
      var c = []; w32(c, 0x02014b50); w16(c, 20); w16(c, 20); w16(c, 0x0800); w16(c, 0); w16(c, time); w16(c, date); w32(c, crc); w32(c, data.length); w32(c, data.length); w16(c, name.length); w16(c, 0); w16(c, 0); w16(c, 0); w16(c, 0); w32(c, 0); w32(c, off);
      cd.push(new Uint8Array(c), name); off += h.length + name.length + data.length;
    });
    var cdSize = 0; cd.forEach(function(x){ cdSize += x.length; });
    var e = []; w32(e, 0x06054b50); w16(e, 0); w16(e, 0); w16(e, files.length); w16(e, files.length); w32(e, cdSize); w32(e, off); w16(e, 0);
    return new Blob(chunks.concat(cd, [new Uint8Array(e)]), {type:'application/zip'});
  }

  /* ---------------- site generation ---------------- */
  function digits(s){ return String(s || '').replace(/[^\d+]/g, ''); }
  function ctaLink(d, kind){
    var k = kind || d.cta, msg = encodeURIComponent('Здравствуйте! Пишу с сайта' + (d.name ? ' ' + d.name : '') + '. Хочу обсудить задачу.');
    if (k === 'tel' && d.tel) return {h:'tel:' + digits(d.tel), t:'Позвонить'};
    if (k === 'wa' && d.wa) return {h:'https://wa.me/' + digits(d.wa).replace('+', '') + '?text=' + msg, t:'Написать в WhatsApp'};
    if (k === 'mail' && d.mail) return {h:'mailto:' + d.mail + '?subject=' + encodeURIComponent('Обращение с сайта') + '&body=' + msg, t:'Написать на почту'};
    if (k === 'tg' && d.tg) return {h:'https://t.me/' + d.tg.replace(/^@/, '') + '?text=' + msg, t:'Написать в Telegram'};
    return null;
  }
  function firstCta(d){ var o = [d.cta, 'tg', 'tel', 'wa', 'mail'], i, l; for (i = 0; i < o.length; i++) { l = ctaLink(d, o[i]); if (l) return l; } return {h:'#contacts', t:'Связаться'}; }
  var BASECSS = '*{box-sizing:border-box;margin:0}html{scroll-behavior:smooth}body{font:17px/1.6 var(--font);background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}a{color:inherit}img{max-width:100%;height:auto;display:block}'
    + '.w{max-width:1040px;margin:0 auto;padding:0 20px}header.top{position:sticky;top:0;z-index:20;background:var(--bar);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}header .in{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:60px}.brand{font-weight:800;letter-spacing:-.02em;text-decoration:none;max-width:46%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}header .btn{min-height:40px;padding:0 16px;font-size:14px;white-space:nowrap}nav{display:flex;gap:18px;font-size:15px}nav a{text-decoration:none;color:var(--muted)}nav a:hover{color:var(--text)}'
    + '.btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 24px;border-radius:var(--r);background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;font-weight:700;text-decoration:none;box-shadow:0 12px 28px -10px var(--accent);border:0;cursor:pointer}.btn.ghost{background:transparent;color:var(--text);box-shadow:none;border:1px solid var(--line)}'
    + 'section{padding:64px 0}h1{font-size:clamp(34px,6.4vw,60px);line-height:1.04;letter-spacing:-.035em;font-weight:800;font-family:var(--fd)}h2{font-size:clamp(26px,4.2vw,38px);line-height:1.1;letter-spacing:-.03em;margin-bottom:24px;font-family:var(--fd)}h3{font-size:19px;margin-bottom:6px}p{color:var(--muted)}'
    + '.hero{padding:72px 0 56px}.hero p.lead{font-size:clamp(17px,2.2vw,21px);max-width:60ch;margin:18px 0 26px}.row{display:flex;flex-wrap:wrap;gap:12px}.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:26px}.chips span{padding:6px 14px;border-radius:99px;background:var(--card);border:1px solid var(--line);font-size:14px;color:var(--muted)}'
    + '.grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(250px,1fr))}.card{background:var(--card);border:1px solid var(--line);border-radius:var(--r2);padding:24px;box-shadow:var(--sh)}.price{display:block;margin:10px 0 4px;font-size:22px;font-weight:800;color:var(--accent);font-family:var(--fd)}.meta{font-size:14px}'
    + '.adv{list-style:none;padding:0;display:grid;gap:12px}.adv li{display:flex;gap:12px;align-items:flex-start}.adv li::before{content:"";flex:none;width:22px;height:22px;margin-top:3px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2)) ;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'none\' stroke=\'%23000\' stroke-width=\'3\' d=\'m5 12 5 5 9-10\'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'none\' stroke=\'%23000\' stroke-width=\'3\' d=\'m5 12 5 5 9-10\'/%3E%3C/svg%3E") center/contain no-repeat}'
    + '.steps{list-style:none;padding:0;display:grid;gap:14px;counter-reset:s}.steps li{counter-increment:s;display:flex;gap:16px;align-items:flex-start;padding:18px 20px;background:var(--card);border:1px solid var(--line);border-radius:var(--r2)}.steps li::before{content:counter(s);flex:none;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;font-weight:800}'
    + '.works{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}.works img{border-radius:var(--r2);aspect-ratio:4/3;object-fit:cover;width:100%}'
    + 'details{background:var(--card);border:1px solid var(--line);border-radius:var(--r2);padding:16px 20px;margin-bottom:10px}summary{font-weight:700;cursor:pointer;color:var(--text)}details p{margin-top:10px}'
    + '.quote{font-size:18px;color:var(--text)}.quote b{display:block;margin-top:10px;font-size:15px;color:var(--muted);font-weight:600}'
    + '.me{display:grid;gap:28px;align-items:center}@media(min-width:760px){.me{grid-template-columns:1fr 340px}}.me img{border-radius:var(--r2);aspect-ratio:4/5;object-fit:cover;width:100%;box-shadow:var(--sh)}'
    + 'footer{padding:36px 0;border-top:1px solid var(--line);font-size:14px;color:var(--muted)}footer a{color:var(--accent)}iframe.yf{width:100%;min-height:520px;border:1px solid var(--line);border-radius:var(--r2);background:#fff}.note{font-size:13px;margin-top:10px}@media(max-width:640px){nav{display:none}section{padding:44px 0}}';
  var THEMES = {
    pearl: ':root{--bg:#f8fbff;--card:rgba(255,255,255,.78);--text:#050914;--muted:#596984;--line:rgba(120,150,210,.28);--bar:rgba(248,251,255,.8);--r:18px;--r2:26px;--sh:0 16px 40px -20px rgba(28,55,110,.35);--font:Manrope,Inter,system-ui,sans-serif;--fd:Manrope,Inter,system-ui,sans-serif}body{background:radial-gradient(circle at 18% 4%,#fff,transparent 36%),radial-gradient(circle at 86% 20%,rgba(69,115,255,.16),transparent 38%),linear-gradient(145deg,#fff,#eef5ff 60%,#e3eeff);background-attachment:fixed}',
    graphite: ':root{--bg:#06101c;--card:rgba(255,255,255,.06);--text:#f4f8ff;--muted:#a9b9d0;--line:rgba(220,235,255,.16);--bar:rgba(6,16,28,.78);--r:16px;--r2:24px;--sh:0 20px 50px -24px rgba(0,0,0,.8);--font:Manrope,Inter,system-ui,sans-serif;--fd:Manrope,Inter,system-ui,sans-serif}body{background:radial-gradient(circle at 12% 0,rgba(90,155,255,.2),transparent 36%),radial-gradient(circle at 90% 70%,rgba(120,80,255,.16),transparent 40%),#06101c;background-attachment:fixed}',
    aurora: ':root{--bg:#f6f8ff;--card:#fff;--text:#0b1030;--muted:#5a6384;--line:rgba(90,100,170,.18);--bar:rgba(246,248,255,.85);--r:999px;--r2:28px;--sh:0 18px 40px -22px rgba(60,50,170,.4);--font:Manrope,Inter,system-ui,sans-serif;--fd:Manrope,Inter,system-ui,sans-serif}.hero{background:linear-gradient(135deg,var(--accent),var(--accent2) 55%,#16d9e3);color:#fff;border-radius:0 0 40px 40px;margin-bottom:8px}.hero h1,.hero p.lead{color:#fff}.hero .btn{background:#fff;color:#111;box-shadow:none}.hero .btn.ghost{background:transparent;color:#fff;border-color:rgba(255,255,255,.6)}.hero .chips span{background:rgba(255,255,255,.18);color:#fff;border-color:rgba(255,255,255,.35)}',
    studio: ':root{--bg:#fff;--card:#fff;--text:#0a0a0a;--muted:#555;--line:#0a0a0a;--bar:rgba(255,255,255,.92);--r:0;--r2:0;--sh:none;--font:Inter,system-ui,sans-serif;--fd:"Arial Black",Impact,Inter,sans-serif}h1,h2{text-transform:uppercase;letter-spacing:-.02em}.card,details,.steps li{border:2px solid var(--text)}.btn{box-shadow:none;background:var(--text)}.price{color:var(--text);border-bottom:4px solid var(--accent);display:inline-block}.steps li::before{background:var(--accent);border-radius:0}',
    sunrise: ':root{--bg:#fffaf3;--card:#fff;--text:#2a1b12;--muted:#7a6252;--line:rgba(160,110,70,.22);--bar:rgba(255,250,243,.88);--r:14px;--r2:22px;--sh:0 14px 34px -20px rgba(160,90,40,.45);--font:Georgia,"Times New Roman",serif;--fd:Georgia,"Times New Roman",serif}h1,h2{font-weight:700}.hero{background:radial-gradient(circle at 80% 0,rgba(255,170,90,.25),transparent 50%)}'
  };
  function dark(hex){ return hex; }
  function shade(hex, k){ var n = parseInt(hex.slice(1), 16), r = n >> 16, gg = (n >> 8) & 255, b = n & 255; function m(x){ return Math.max(0, Math.min(255, Math.round(x + (k > 0 ? (255 - x) * k : x * k)))); } return '#' + ((1 << 24) + (m(r) << 16) + (m(gg) << 8) + m(b)).toString(16).slice(1); }
  function pageHtml(d, forPreview){
    ensure(d);
    var T = TYPES[d.type] || TYPES.card, title = (d.seoTitle || sug(d, 'seoTitle')), desc = (d.seoDesc || sug(d, 'seoDesc')), h1 = d.tagline || sug(d, 'tagline') || d.name || 'Ваш сайт', main = firstCta(d), tel = d.tel ? ctaLink(d, 'tel') : null;
    var photoSrc = d.photo ? (forPreview ? d.photo : 'images/photo.webp') : '', work = (d.works || []).map(function(w, i){ return forPreview ? w : 'images/work-' + (i + 1) + '.webp'; });
    var services = d.services.filter(function(s){ return s.n; }), adv = d.adv.filter(Boolean), steps = d.steps.filter(Boolean), reviews = d.reviews.filter(function(r){ return r.t; }), faq = d.faq.filter(function(f){ return f.q; });
    var chips = [d.years ? 'Опыт ' + d.years + ' лет' : '', d.city || '', d.hours ? d.hours : ''].filter(Boolean);
    var contacts = ['tg', 'tel', 'wa', 'mail'].map(function(k){ var l = ctaLink(d, k); return l ? '<a class="btn' + (k === d.cta ? '' : ' ghost') + '" href="' + esc(l.h) + '">' + esc(l.t) + '</a>' : ''; }).join('');
    var ym = d.ym ? '<script>(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(' + parseInt(d.ym, 10) + ',"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true});<\/script>' : '';
    var jsonld = {'@context':'https://schema.org', '@type':'ProfessionalService', name:d.name || d.role, description:desc}; if (d.city) jsonld.areaServed = d.city; if (d.tel) jsonld.telephone = d.tel;
    var css = ':root{--accent:' + d.accent + ';--accent2:' + shade(d.accent, .28) + '}' + (THEMES[d.tpl] || THEMES.pearl) + BASECSS;
    var navs = [services.length ? '<a href="#services">Услуги</a>' : '', steps.length ? '<a href="#process">Как работаю</a>' : '', faq.length ? '<a href="#faq">Вопросы</a>' : '', '<a href="#contacts">Контакты</a>'].filter(Boolean).join('');
    return '<!doctype html>\n<html lang="ru">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>' + esc(title) + '</title>\n<meta name="description" content="' + esc(desc) + '">\n<meta property="og:title" content="' + esc(title) + '">\n<meta property="og:description" content="' + esc(desc) + '">\n<meta property="og:type" content="website">\n<meta name="theme-color" content="' + d.accent + '">\n<style>' + css + '</style>\n<script type="application/ld+json">' + JSON.stringify(jsonld).replace(/</g, '\\u003c') + '<\/script>\n</head>\n<body>\n'
      + '<header class="top"><div class="w in"><a class="brand" href="#">' + esc(d.name || d.role || 'Сайт') + '</a><nav>' + navs + '</nav><a class="btn" href="' + esc(main.h) + '">' + esc(main.t) + '</a></div></header>\n'
      + '<main>\n<section class="hero"><div class="w' + (photoSrc && d.type !== 'portfolio' ? ' me' : '') + '"><div><h1>' + esc(h1) + '</h1><p class="lead">' + esc([d.audience ? 'Помогаю: ' + d.audience + '.' : '', d.diff].filter(Boolean).join(' ') || 'Опишите, чем вы полезны клиенту.') + '</p><div class="row"><a class="btn" href="' + esc(main.h) + '">' + esc(main.t) + '</a>' + (tel && d.cta !== 'tel' ? '<a class="btn ghost" href="' + esc(tel.h) + '">Позвонить</a>' : '') + '</div>' + (chips.length ? '<div class="chips">' + chips.map(function(c){ return '<span>' + esc(c) + '</span>'; }).join('') + '</div>' : '') + '</div>' + (photoSrc && d.type !== 'portfolio' ? '<img src="' + photoSrc + '" alt="' + esc(d.name || d.role) + '" width="680" height="850">' : '') + '</div></section>\n'
      + (services.length ? '<section id="services"><div class="w"><h2>' + (d.type === 'portfolio' ? 'Что я делаю' : 'Услуги и цены') + '</h2><div class="grid">' + services.map(function(s){ return '<div class="card"><h3>' + esc(s.n) + '</h3>' + (s.p ? '<span class="price">от ' + esc(s.p) + '</span>' : '') + (s.t ? '<p class="meta">Срок: ' + esc(s.t) + '</p>' : '') + (s.b ? '<p>' + esc(s.b) + '</p>' : '') + '</div>'; }).join('') + '</div></div></section>\n' : '')
      + (work.length ? '<section id="works"><div class="w"><h2>Работы</h2><div class="works">' + work.map(function(w, i){ return '<img src="' + w + '" alt="Пример работы ' + (i + 1) + '" loading="lazy" width="800" height="600">'; }).join('') + '</div></div></section>\n' : '')
      + (adv.length ? '<section id="why"><div class="w"><h2>Почему со мной удобно</h2><ul class="adv">' + adv.map(function(a){ return '<li>' + esc(a) + '</li>'; }).join('') + '</ul></div></section>\n' : '')
      + (steps.length ? '<section id="process"><div class="w"><h2>Как это проходит</h2><ol class="steps">' + steps.map(function(s){ return '<li><span>' + esc(s) + '</span></li>'; }).join('') + '</ol></div></section>\n' : '')
      + (reviews.length ? '<section id="reviews"><div class="w"><h2>Отзывы</h2><div class="grid">' + reviews.map(function(r){ return '<div class="card quote">«' + esc(r.t) + '»<b>' + esc(r.n) + '</b></div>'; }).join('') + '</div></div></section>\n' : '')
      + (faq.length ? '<section id="faq"><div class="w"><h2>Частые вопросы</h2>' + faq.map(function(f){ return '<details><summary>' + esc(f.q) + '</summary><p>' + esc(f.a || faqAnswer(d, f.q)) + '</p></details>'; }).join('') + '</div></section>\n' : '')
      + '<section id="contacts"><div class="w"><h2>Контакты</h2><p style="margin-bottom:18px">' + esc([d.addr, d.hours].filter(Boolean).join(' · ') || 'Напишите или позвоните, обсудим вашу задачу.') + '</p><div class="row">' + (contacts || '<a class="btn" href="#">Добавьте контакты</a>') + '</div>'
      + (d.yform ? '<p style="margin:26px 0 12px"><b>Или оставьте заявку</b></p><iframe class="yf" src="' + esc(d.yform) + '" title="Форма заявки" loading="lazy"></iframe><p class="note">Отправляя форму, вы соглашаетесь с <a href="privacy.html">политикой обработки персональных данных</a>.</p>' : '') + '</div></section>\n</main>\n'
      + '<footer><div class="w">' + esc(d.legalName || d.name || '') + (d.inn ? ', ' + (d.status === 'ip' ? 'ОГРНИП/ИНН ' : 'ИНН ') + esc(d.inn) : '') + (d.status === 'selfemployed' ? ', самозанятый' : '') + ' · <a href="privacy.html">Политика обработки данных</a> · © ' + new Date().getFullYear() + '</div></footer>\n' + ym + '</body>\n</html>\n';
  }
  function privacyHtml(d){
    var op = esc(d.legalName || d.name || '[ФИО оператора]'), inn = esc(d.inn || '[ИНН]'), contact = esc(d.mail || d.tg || d.tel || '[контакт для обращений]');
    var forms = d.yform ? 'Через форму заявки на сайте собираются имя и контактные данные, которые вы указываете сами.' : 'Сайт не содержит форм, собирающих персональные данные. Связь осуществляется по инициативе посетителя через мессенджеры, телефон или почту.';
    return '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Политика обработки персональных данных</title><meta name="robots" content="noindex"><style>body{font:17px/1.6 system-ui,sans-serif;max-width:760px;margin:0 auto;padding:32px 20px;color:#111}h1{font-size:28px}h2{font-size:20px;margin-top:28px}a{color:#234bff}</style></head><body><a href="index.html">← На сайт</a><h1>Политика обработки персональных данных</h1>'
      + '<p><i>Шаблон составлен автоматически конструктором. Проверьте и доработайте текст под вашу ситуацию. Это не юридическая консультация.</i></p>'
      + '<h2>1. Оператор</h2><p>Оператор персональных данных: ' + op + ', ИНН ' + inn + '. Контакт для обращений: ' + contact + '.</p>'
      + '<h2>2. Какие данные обрабатываются</h2><p>' + forms + (d.ym ? ' Для статистики посещений используется сервис Яндекс Метрика, который обрабатывает технические данные посетителя (cookie, IP-адрес, сведения о браузере).' : '') + '</p>'
      + '<h2>3. Цели обработки</h2><p>Связь с посетителем по его обращению, оказание услуг, улучшение работы сайта.</p>'
      + '<h2>4. Правовое основание</h2><p>Согласие субъекта персональных данных и исполнение договора, стороной которого он является.</p>'
      + '<h2>5. Срок и хранение</h2><p>Данные хранятся не дольше, чем нужно для целей обработки, затем удаляются. Первичная база данных граждан РФ хранится на серверах, расположенных на территории РФ.</p>'
      + '<h2>6. Права посетителя</h2><p>Вы можете запросить сведения об обработке, исправление, удаление данных и отозвать согласие, написав оператору по контакту выше.</p>'
      + '<h2>7. Изменения</h2><p>Оператор может обновлять политику. Актуальная версия размещена на этой странице.</p></body></html>';
  }
  function readme(d){
    return '# Ваш сайт\n\nФайлы:\n- index.html: главная страница\n- privacy.html: политика обработки персональных данных (шаблон, проверьте текст)\n- robots.txt, sitemap.xml: подсказки для поисковиков (замените АДРЕС-САЙТА на реальный домен)\n- images/: ваши фотографии\n\n## Как опубликовать\n1. GitHub Pages (для личных сайтов и портфолио): создайте репозиторий, загрузите все файлы, в Settings → Pages выберите ветку main. Условия площадки не разрешают размещать там коммерческие сайты с основной целью совершения платежей.\n2. Cloudflare Pages: Workers & Pages → Create → Pages → Upload assets, загрузите папку.\n3. Российский хостинг: загрузите файлы в корневую папку сайта (public_html) через панель или FTP.\n\n## Свой домен\nКупите домен у регистратора и привяжите его в настройках площадки (записи A/CNAME). HTTPS включится автоматически на GitHub Pages и Cloudflare Pages.\n\n## Заявки\nКнопки ведут в ваш Telegram, на телефон, WhatsApp или почту. Если добавили форму Яндекс Формы, заявки приходят на почту и в личный кабинет сервиса.\n\n## Проверьте перед публикацией\n- Контакты и цены верные\n- Отзывы настоящие и опубликованы с согласия людей\n- Фотографии ваши\n- Политика обработки данных соответствует вашей ситуации\n';
  }
  function dataUrlBytes(u){ var b = atob(u.split(',')[1]), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  function build(d){
    var files = [{name:'index.html', data:u8(pageHtml(d, false))}, {name:'privacy.html', data:u8(privacyHtml(d))}, {name:'robots.txt', data:u8('User-agent: *\nAllow: /\nSitemap: https://АДРЕС-САЙТА/sitemap.xml\n')}, {name:'sitemap.xml', data:u8('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<url><loc>https://АДРЕС-САЙТА/</loc></url>\n</urlset>\n')}, {name:'README.md', data:u8(readme(d))}];
    if (d.photo) files.push({name:'images/photo.webp', data:dataUrlBytes(d.photo)});
    (d.works || []).forEach(function(w, i){ files.push({name:'images/work-' + (i + 1) + '.webp', data:dataUrlBytes(w)}); });
    return files;
  }
  function checks(d){
    var c = [];
    c.push([!!d.name || !!d.role, 'Указано, кто вы и чем занимаетесь']);
    c.push([d.services.filter(function(s){ return s.n; }).length >= 2, 'Есть минимум две услуги']);
    c.push([d.services.some(function(s){ return s.p; }), 'Указана хотя бы одна цена']);
    c.push([!!(d.tg || d.tel || d.wa || d.mail), 'Есть хотя бы один контакт для связи']);
    c.push([!!d.inn || d.status === 'none', 'Указаны реквизиты (ИНН) в подвале']);
    c.push([!d.reviews.some(function(r){ return r.t && !r.n; }), 'У каждого отзыва есть имя автора (и согласие на публикацию)']);
    c.push([!!(d.seoTitle || d.role), 'Есть заголовок страницы для поиска']);
    return c;
  }

  /* ---------------- images ---------------- */
  function imgToWebp(file, max, cb){
    var im = new Image(), u = URL.createObjectURL(file);
    im.onload = function(){ var k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); cb(c.toDataURL('image/webp', .84)); };
    im.onerror = function(){ cb(null); }; im.src = u;
  }

  /* ---------------- UI ---------------- */
  var STEPS = ['Тип сайта', 'О вас', 'Услуги', 'Доверие', 'Контакты', 'Реквизиты', 'Шаблон', 'Результат'];
  function mount(root){
    var d = ld() || blank(); ensure(d); d.photo = null; d.works = [];
    var el = root.querySelector('[data-sb]') || root; if (el.getAttribute('data-sb-ready')) return; el.setAttribute('data-sb-ready', '1');
    function save(){ sv(d); }
    function inp(label, key, opt){ opt = opt || {}; return '<label class="sb-f"><span>' + label + (opt.req ? ' *' : '') + '</span>' + (opt.area ? '<textarea data-k="' + key + '" rows="' + (opt.rows || 3) + '" placeholder="' + esc(opt.ph || '') + '">' + esc(d[key]) + '</textarea>' : '<input type="' + (opt.type || 'text') + '" data-k="' + key + '" value="' + esc(d[key]) + '" placeholder="' + esc(opt.ph || '') + '">') + (opt.hint ? '<small>' + opt.hint + '</small>' : '') + '</label>'; }
    function step0(){
      return '<h4>Какой сайт вам нужен?</h4><div class="sb-opts">' + Object.keys(TYPES).map(function(k){ return '<button class="sb-o' + (d.type === k ? ' on' : '') + '" data-type="' + k + '"><b>' + TYPES[k].n + '</b><span>' + TYPES[k].d + '</span></button>'; }).join('') + '</div>'
        + '<h4>Главное действие посетителя</h4><div class="sb-chips">' + Object.keys(CTAS).map(function(k){ return '<button class="sb-c' + (d.cta === k ? ' on' : '') + '" data-cta="' + k + '">' + CTAS[k] + '</button>'; }).join('') + '</div><p class="sb-h">На сайте все кнопки будут вести к этому действию. Остальные контакты появятся в разделе «Контакты».</p>';
    }
    function step1(){
      return '<h4>Расскажите о себе</h4>' + inp('Имя или название', 'name', {req:1, ph:'Иван Петров или «Студия Лотос»'}) + inp('Чем занимаетесь', 'role', {req:1, ph:'Ремонт ванных комнат под ключ'}) + inp('Город', 'city', {ph:'Казань'}) + inp('Для кого работаете', 'audience', {ph:'владельцев квартир в новостройках'}) + inp('Чем отличаетесь', 'diff', {area:1, ph:'Смета за день, договор, гарантия 5 лет'}) + inp('Опыт, лет', 'years', {type:'number', ph:'8'})
        + '<label class="sb-f"><span>Главный заголовок сайта</span><textarea data-k="tagline" rows="2" placeholder="Если оставить пустым, составим по вашим ответам">' + esc(d.tagline) + '</textarea></label><button class="sb-b alt" data-sug="tagline">✨ Предложить заголовок</button><p class="sb-h" data-aihint></p>';
    }
    function step2(){
      return '<h4>Услуги и цены</h4><p class="sb-h">Две–пять услуг. Цена «от» снимает вопрос «сколько» и повышает число обращений.</p>' + d.services.map(function(s, i){
        return '<div class="sb-g" data-si="' + i + '"><b>Услуга ' + (i + 1) + '</b><input data-s="n" value="' + esc(s.n) + '" placeholder="Название"><div class="sb-2"><input data-s="p" value="' + esc(s.p) + '" placeholder="Цена от, например 5 000 ₽"><input data-s="t" value="' + esc(s.t) + '" placeholder="Срок, например 3 дня"></div><input data-s="b" value="' + esc(s.b) + '" placeholder="Что получит клиент (одна строка)">' + (d.services.length > 1 ? '<button class="sb-x" data-rm-s="' + i + '">Убрать</button>' : '') + '</div>'; }).join('') + (d.services.length < 5 ? '<button class="sb-b alt" data-add-s>+ Услуга</button>' : '');
    }
    function step3(){
      return '<h4>Что вызывает доверие</h4><p class="sb-h">Три преимущества, этапы работы, отзывы и ответы на вопросы. Пишите только правду: отзывы публикуйте с согласия людей.</p><b>Преимущества</b>' + d.adv.map(function(a, i){ return '<input class="sb-i" data-adv="' + i + '" value="' + esc(a) + '" placeholder="Например: Фиксирую цену в договоре">'; }).join('')
        + '<b>Этапы работы</b>' + d.steps.map(function(a, i){ return '<input class="sb-i" data-step="' + i + '" value="' + esc(a) + '">'; }).join('')
        + '<b>Отзывы (необязательно, только настоящие)</b>' + d.reviews.map(function(r, i){ return '<div class="sb-g" data-ri="' + i + '"><input data-r="n" value="' + esc(r.n) + '" placeholder="Имя, город"><textarea data-r="t" rows="2" placeholder="Текст отзыва">' + esc(r.t) + '</textarea></div>'; }).join('')
        + '<b>Вопросы и ответы</b>' + d.faq.map(function(f, i){ return '<div class="sb-g" data-fi="' + i + '"><input data-f="q" value="' + esc(f.q) + '" placeholder="Вопрос"><textarea data-f="a" rows="2" placeholder="Ответ (если пусто, подставим шаблонный)">' + esc(f.a) + '</textarea></div>'; }).join('');
    }
    function step4(){
      return '<h4>Как с вами связаться</h4>' + inp('Telegram (без @)', 'tg', {ph:'username'}) + inp('Телефон', 'tel', {ph:'+7 900 000-00-00'}) + inp('WhatsApp (номер)', 'wa', {ph:'+7 900 000-00-00'}) + inp('Почта', 'mail', {type:'email', ph:'name@mail.ru'}) + inp('Адрес или район', 'addr', {ph:'Казань, Вахитовский район'}) + inp('График', 'hours', {ph:'Ежедневно 9:00–20:00'})
        + inp('Ссылка на форму Яндекс Формы (необязательно)', 'yform', {type:'url', ph:'https://forms.yandex.ru/...', hint:'Заявки придут на вашу почту. Сервис хранит данные в России, поэтому это безопаснее зарубежных форм.'});
    }
    function step5(){
      return '<h4>Реквизиты и аналитика</h4><p class="sb-h">Они попадут в подвал и политику обработки данных.</p><div class="sb-chips">' + [['selfemployed', 'Самозанятый'], ['ip', 'ИП'], ['org', 'Компания'], ['none', 'Пока без статуса']].map(function(a){ return '<button class="sb-c' + (d.status === a[0] ? ' on' : '') + '" data-status="' + a[0] + '">' + a[1] + '</button>'; }).join('') + '</div>'
        + inp('ФИО или название', 'legalName', {ph:'Петров Иван Сергеевич'}) + inp('ИНН / ОГРНИП', 'inn', {ph:'123456789012'}) + inp('Номер счётчика Яндекс Метрики (необязательно)', 'ym', {type:'number', ph:'12345678', hint:'Если заполнить, на сайт добавится счётчик. Упомяните это в политике: мы добавили абзац автоматически.'})
        + inp('Заголовок для поиска (title)', 'seoTitle', {ph:'Оставьте пустым: составим автоматически'}) + inp('Описание для поиска (description)', 'seoDesc', {area:1, rows:2, ph:'До 160 символов'});
    }
    function step6(){
      return '<h4>Выберите шаблон</h4><div class="sb-tp">' + Object.keys(TPL).map(function(k){ return '<button class="sb-t' + (d.tpl === k ? ' on' : '') + '" data-tpl="' + k + '">' + TPL[k] + '</button>'; }).join('') + '</div><b>Акцентный цвет</b><div class="sb-sw">' + ACCENTS.map(function(c){ return '<i class="' + (d.accent === c ? 'on' : '') + '" data-ac="' + c + '" style="background:' + c + '"></i>'; }).join('') + '</div>'
        + '<b>Фото (необязательно)</b><p class="sb-h">Своё портретное фото для первого экрана и до шести фото работ. Фото сжимаются в браузере и попадут в ZIP.</p><label class="sb-up"><input type="file" accept="image/*" data-photo hidden>Загрузить портрет</label><label class="sb-up"><input type="file" accept="image/*" multiple data-works hidden>Загрузить фото работ</label><p class="sb-h" data-photostat>' + (d.photo ? 'Портрет загружен. ' : '') + ((d.works || []).length ? 'Фото работ: ' + d.works.length : '') + '</p>'
        + '<div class="sb-pv"><iframe data-pv title="Предпросмотр сайта" sandbox="allow-same-origin"></iframe></div>';
    }
    function step7(){
      var cs = checks(d);
      return '<h4>Ваш сайт готов</h4><div class="sb-pv big"><iframe data-pv title="Предпросмотр сайта" sandbox="allow-same-origin"></iframe></div><div class="sb-ck">' + cs.map(function(c){ return '<div class="' + (c[0] ? 'ok' : 'no') + '"><i>' + (c[0] ? '✓' : '!') + '</i>' + esc(c[1]) + '</div>'; }).join('') + '</div>'
        + '<div class="sb-btns"><button class="sb-b" data-dl="zip">Скачать сайт (ZIP)</button><button class="sb-b alt" data-dl="html">Скачать только index.html</button><button class="sb-b alt" data-dl="copy">Скопировать код</button></div>'
        + '<h4>Как опубликовать</h4><ol class="sb-ol"><li>Распакуйте ZIP. Внутри index.html, политика и папка images.</li><li>Загрузите файлы на хостинг: GitHub Pages для личных сайтов, Cloudflare Pages или российский хостинг для коммерческих.</li><li>Привяжите домен в настройках площадки. Подробности в главах «Публикация» и «Юридический минимум».</li><li>Проверьте контакты и кнопки на телефоне. Заявки идут туда, куда вы указали: Telegram, телефон, WhatsApp, почта или Яндекс Форма.</li></ol>'
        + '<p class="sb-h">Нужна помощь с запуском или правками? <a href="' + ASK + '?text=' + encodeURIComponent('Здравствуйте! Я собрал сайт в конструкторе, нужна помощь с запуском.') + '" target="_blank" rel="noopener">Напишите автору</a>.</p>';
    }
    var STEPFN = [step0, step1, step2, step3, step4, step5, step6, step7];
    function aiBanner(){ return AI.endpoint ? '' : 'Нейросеть подключается через защищённый сервер автора. Пока заголовки и ответы предлагаются по шаблонам.'; }
    function render(){
      var s = d.step;
      el.innerHTML = '<div class="gm-h"><span class="gm-k">Конструктор сайта</span><span class="gm-xp">Шаг ' + (s + 1) + ' из ' + STEPS.length + '</span></div><div class="sb-pr"><i style="width:' + ((s + 1) / STEPS.length * 100) + '%"></i></div><h3 class="sb-t3">' + STEPS[s] + '</h3><div class="sb-body">' + STEPFN[s]() + '</div>'
        + '<div class="sb-nav">' + (s > 0 ? '<button class="sb-b alt" data-nav="-1">Назад</button>' : '<span></span>') + (s < STEPS.length - 1 ? '<button class="sb-b" data-nav="1">Дальше</button>' : '<button class="sb-b alt" data-reset>Начать заново</button>') + '</div>';
      var hint = el.querySelector('[data-aihint]'); if (hint) hint.textContent = aiBanner();
      bind(); if (el.querySelector('[data-pv]')) preview();
    }
    function preview(){ var f = el.querySelector('[data-pv]'); if (f) f.srcdoc = pageHtml(JSON.parse(JSON.stringify(Object.assign({}, d, {photo:d.photo, works:d.works}))), true); }
    var pvT; function pvSoon(){ clearTimeout(pvT); pvT = setTimeout(preview, 250); }
    function bind(){
      [].forEach.call(el.querySelectorAll('[data-k]'), function(i){ i.oninput = function(){ d[i.getAttribute('data-k')] = i.value; save(); }; });
      [].forEach.call(el.querySelectorAll('[data-type]'), function(b){ b.onclick = function(){ d.type = b.getAttribute('data-type'); d.steps = []; d.faq = []; ensure(d); save(); render(); }; });
      [].forEach.call(el.querySelectorAll('[data-cta]'), function(b){ b.onclick = function(){ d.cta = b.getAttribute('data-cta'); save(); render(); }; });
      [].forEach.call(el.querySelectorAll('[data-status]'), function(b){ b.onclick = function(){ d.status = b.getAttribute('data-status'); save(); render(); }; });
      [].forEach.call(el.querySelectorAll('[data-tpl]'), function(b){ b.onclick = function(){ d.tpl = b.getAttribute('data-tpl'); save(); render(); }; });
      [].forEach.call(el.querySelectorAll('[data-ac]'), function(b){ b.onclick = function(){ d.accent = b.getAttribute('data-ac'); save(); render(); }; });
      [].forEach.call(el.querySelectorAll('[data-si]'), function(g2){ var i = +g2.getAttribute('data-si'); [].forEach.call(g2.querySelectorAll('[data-s]'), function(x){ x.oninput = function(){ d.services[i][x.getAttribute('data-s')] = x.value; save(); }; }); });
      [].forEach.call(el.querySelectorAll('[data-rm-s]'), function(b){ b.onclick = function(){ d.services.splice(+b.getAttribute('data-rm-s'), 1); save(); render(); }; });
      var add = el.querySelector('[data-add-s]'); if (add) add.onclick = function(){ d.services.push({n:'', p:'', t:'', b:''}); save(); render(); };
      [].forEach.call(el.querySelectorAll('[data-adv]'), function(x){ x.oninput = function(){ d.adv[+x.getAttribute('data-adv')] = x.value; save(); }; });
      [].forEach.call(el.querySelectorAll('[data-step]'), function(x){ x.oninput = function(){ d.steps[+x.getAttribute('data-step')] = x.value; save(); }; });
      [].forEach.call(el.querySelectorAll('[data-ri]'), function(g2){ var i = +g2.getAttribute('data-ri'); [].forEach.call(g2.querySelectorAll('[data-r]'), function(x){ x.oninput = function(){ d.reviews[i][x.getAttribute('data-r')] = x.value; save(); }; }); });
      [].forEach.call(el.querySelectorAll('[data-fi]'), function(g2){ var i = +g2.getAttribute('data-fi'); [].forEach.call(g2.querySelectorAll('[data-f]'), function(x){ x.oninput = function(){ d.faq[i][x.getAttribute('data-f')] = x.value; save(); }; }); });
      [].forEach.call(el.querySelectorAll('[data-nav]'), function(b){ b.onclick = function(){ d.step = Math.max(0, Math.min(STEPS.length - 1, d.step + (+b.getAttribute('data-nav')))); save(); render(); el.scrollIntoView({block:'start', behavior:'smooth'}); }; });
      var rs = el.querySelector('[data-reset]'); if (rs) rs.onclick = function(){ if (confirm('Стереть ответы и начать заново?')) { d = blank(); ensure(d); save(); render(); } };
      var sg = el.querySelector('[data-sug="tagline"]'); if (sg) sg.onclick = function(){ var t = el.querySelector('[data-k="tagline"]'); aiOrRule('tagline', function(v){ t.value = v; d.tagline = v; save(); }); };
      var ph = el.querySelector('[data-photo]'); if (ph) ph.onchange = function(){ if (ph.files[0]) imgToWebp(ph.files[0], 900, function(u){ d.photo = u; var st = el.querySelector('[data-photostat]'); if (st) st.textContent = 'Портрет загружен.'; pvSoon(); }); };
      var wk = el.querySelector('[data-works]'); if (wk) wk.onchange = function(){ var list = [].slice.call(wk.files).slice(0, 6), out = []; if (!list.length) return; var n = 0; list.forEach(function(f, i){ imgToWebp(f, 1100, function(u){ out[i] = u; if (++n === list.length) { d.works = out.filter(Boolean); var st = el.querySelector('[data-photostat]'); if (st) st.textContent = 'Фото работ: ' + d.works.length; pvSoon(); } }); }); };
      var dl = el.querySelectorAll('[data-dl]'); [].forEach.call(dl, function(b){ b.onclick = function(){ download(b.getAttribute('data-dl')); }; });
    }
    function aiOrRule(kind, cb){
      if (AI.endpoint) {
        fetch(AI.endpoint, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({task:kind, data:{role:d.role, city:d.city, audience:d.audience, diff:d.diff, name:d.name}})}).then(function(r){ return r.json(); }).then(function(j){ if (j && j.text) cb(j.text); else cb(sug(d, kind)); }).catch(function(){ cb(sug(d, kind)); });
      } else cb(sug(d, kind));
    }
    function download(kind){
      ensure(d);
      if (kind === 'copy') { var html = pageHtml(Object.assign({}, d, {photo:null, works:[]}), true); (navigator.clipboard ? navigator.clipboard.writeText(html) : Promise.reject()).then(function(){ toast('Код скопирован'); }, function(){ toast('Не удалось скопировать, скачайте файл'); }); return; }
      var name = kind === 'zip' ? 'site.zip' : 'index.html', blob = kind === 'zip' ? zip(build(d)) : new Blob([pageHtml(Object.assign({}, d, {photo:null, works:[]}), false)], {type:'text/html;charset=utf-8'});
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function(){ a.remove(); URL.revokeObjectURL(a.href); }, 500);
    }
    function toast(t){ var e = document.createElement('div'); e.className = 'toast'; e.textContent = t; document.body.appendChild(e); setTimeout(function(){ e.remove(); }, 2200); }
    render();
  }
  g.SiteBuilder = {mount:mount, ai:AI, build:function(d){ return zip(build(ensure(d))); }, html:function(d){ return pageHtml(ensure(d), true); }, blank:blank};
})(window);

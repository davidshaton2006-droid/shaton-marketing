/* Shaton Prime: points ("баллы"). One idempotent event map per device (localStorage shaton.pts), mirrored to the server for Telegram users
   (POST /pts/sync), so points are kept per user and visible in the admin panel. Practicum answers (game.js) are mirrored as game:<material>:<block>.
   Public: Pts.award(key, n) Pts.total() Pts.rank() Pts.RULES Pts.fmt(n) */
(function(g){
  var KEY = 'shaton.pts', ev = {}, timer = 0, last = 0;
  try { ev = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch(e){ ev = {}; }
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(ev)); } catch(e){} }

  var RULES = {
    story: 2, read_free: 10, read_paid: 20, guide: 20, idea: 5, friend: 50, buy: 300, sub: 500, gameMax: 50
  };
  var RANKS = [{n:'Новичок', t:0}, {n:'Практик', t:150}, {n:'Стратег', t:500}, {n:'Мастер', t:1200}];

  /* backfill: answers given before points existed */
  (function(){
    var G = {}; try { G = JSON.parse(localStorage.getItem('shaton.g') || '{}') || {}; } catch(e){}
    var ch = false;
    Object.keys(G).forEach(function(pid){ var o = G[pid]; if (!o || typeof o !== 'object') return; Object.keys(o).forEach(function(id){ var x = o[id] && o[id].x; var k = 'game:' + pid + ':' + id; if (x > 0 && ev[k] == null) { ev[k] = Math.min(RULES.gameMax, x); ch = true; } }); });
    if (ch) save();
  })();

  function total(){ var t = 0; for (var k in ev) t += Number(ev[k]) || 0; return t; }
  function rank(){
    var t = total(), i = 0; RANKS.forEach(function(r, j){ if (t >= r.t) i = j; });
    var nx = RANKS[i + 1];
    return {name: RANKS[i].n, idx: i, total: t, next: nx ? nx.t : null, nextName: nx ? nx.n : null, pct: nx ? Math.round((t - RANKS[i].t) / (nx.t - RANKS[i].t) * 100) : 100};
  }
  function plural(n){ n = Math.abs(n) % 100; var m = n % 10; if (n > 10 && n < 20) return 'баллов'; if (m === 1) return 'балл'; if (m >= 2 && m <= 4) return 'балла'; return 'баллов'; }
  function fmt(n){ return n + ' ' + plural(n); }

  function ui(){
    var pill = document.getElementById('ptsPill'); if (pill) pill.innerHTML = '<i>★</i>' + total();
    try { document.dispatchEvent(new CustomEvent('pts', {detail:{total:total()}})); } catch(e){}
  }
  function toast(t){ if (typeof g.toast === 'function') g.toast(t); }

  function award(key, n, quiet){
    n = Math.max(0, Math.floor(n)); if (!n) return false;
    if (/^game:/.test(key)) { n = Math.min(RULES.gameMax, n); if ((ev[key] || 0) >= n) return false; ev[key] = n; }
    else { if (ev[key] != null) return false; ev[key] = n; }
    save(); ui(); sync();
    if (!quiet) toast('+' + fmt(n));
    return true;
  }
  function game(pid, id, x){ return award('game:' + pid + ':' + id, x, true); }

  function sync(now){
    if (!g.tg || !g.tg.initData || !g.IDEAS_API) return;
    clearTimeout(timer);
    timer = setTimeout(function(){
      fetch(g.IDEAS_API + '/pts/sync', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({initData:g.tg.initData, events:ev})})
        .then(function(r){ return r.json(); }).then(function(j){
          if (!j || !j.ok || !j.events) return;
          var ch = false; Object.keys(j.events).forEach(function(k){ if (ev[k] == null || ev[k] < j.events[k]) { ev[k] = j.events[k]; ch = true; } });
          if (ch) { save(); ui(); }
        }).catch(function(){});
    }, now ? 0 : 1200);
  }

  /* "N XP" in practicum blocks -> "N баллов" (game.js strings use XP) */
  var re = /(\d+)\s*XP/g;
  function fixNode(n){
    if (n.nodeType === 3) { if (re.test(n.nodeValue)) { re.lastIndex = 0; n.nodeValue = n.nodeValue.replace(re, function(_, d){ return d + ' ' + plural(Number(d)); }); } re.lastIndex = 0; return; }
    if (n.nodeType !== 1 || /^(SCRIPT|STYLE|TEXTAREA|INPUT)$/.test(n.tagName)) return;
    var w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT, null), t, list = [];
    while ((t = w.nextNode())) { if (/XP/.test(t.nodeValue)) list.push(t); }
    list.forEach(fixNode);
  }
  function watch(){
    if (!document.body || !window.MutationObserver) return;
    var busy = false;
    new MutationObserver(function(ms){
      if (busy) return; busy = true;
      ms.forEach(function(m){ m.addedNodes.forEach(function(n){ if (n.nodeType === 1 && /XP/.test(n.textContent || '')) fixNode(n); else if (n.nodeType === 3) fixNode(n); }); if (m.type === 'characterData') fixNode(m.target); });
      busy = false;
    }).observe(document.body, {childList:true, subtree:true, characterData:true});
  }
  if (document.body) watch(); else document.addEventListener('DOMContentLoaded', watch);

  g.Pts = {award:award, game:game, total:total, rank:rank, plural:plural, fmt:fmt, sync:sync, ui:ui, RULES:RULES, RANKS:RANKS};
})(window);

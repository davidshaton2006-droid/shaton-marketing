/* Shaton markup -> liquid-glass post HTML. Same language as _build/mkposts.py, used by the app (posts added from the admin panel) and by admin preview.
   ShatonMD.render(src, pid) -> {html, chapters:[{id,n,t}], words, min} */
(function(g){
  function E(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function inline(t){
    t = E(t).replace(/&quot;/g, '"');
    t = t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>');
    return t;
  }
  function hash(s){ var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h % 100000; }
  var ICON = {
    imp:'<path d="M12 4 3 20h18z"/><path d="M12 10v4M12 17h.01"/>', pr:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    err:'<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>', ex:'<path d="M7 3.5h7l4 4V20.5H7z"/><path d="M14 3.5v4h4M9.5 12h6M9.5 15.5h6"/>',
    num:'<path d="M4 20V4M4 20h16M8 16l3-4 3 2 4-6"/>'};
  var LAB = {imp:'Важно', pr:'Практика', err:'Типичная ошибка', ex:'Пример', num:'Цифры и ориентиры'};
  var IMGBASE = 'posts/img/';

  function embedUrl(u){
    var r;
    if ((r = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/))) return 'https://www.youtube-nocookie.com/embed/' + r[1];
    if ((r = u.match(/rutube\.ru\/(?:video|play\/embed)\/([\w]+)/))) return 'https://rutube.ru/play/embed/' + r[1];
    if ((r = u.match(/vk\.com\/(?:video|clip)(-?\d+)_(\d+)/))) return 'https://vk.com/video_ext.php?oid=' + r[1] + '&id=' + r[2] + '&hd=2';
    if ((r = u.match(/vimeo\.com\/(?:video\/)?(\d+)/))) return 'https://player.vimeo.com/video/' + r[1];
    return '';
  }
  function ulist(items, pid){
    if (items[0].indexOf('[ ] ') === 0)
      return '<ul class="cl" data-r>' + items.map(function(x){ return '<li><label><input type="checkbox" data-ck="' + pid + ':' + hash(x) + '"><span class="bx"></span><span>' + inline(x.slice(4)) + '</span></label></li>'; }).join('') + '</ul>';
    var h = '<ul class="bl" data-r>', depth = 0;
    items.forEach(function(x){
      var d = Math.floor((x.length - x.replace(/^\s+/, '').length) / 2), txt = inline(x.replace(/^\s+/, '').slice(2));
      while (depth < d){ if (/<\/li>$/.test(h)) h = h.slice(0, -5); h += '<ul>'; depth++; }
      while (depth > d){ h += '</ul></li>'; depth--; }
      h += '<li>' + txt + '</li>';
    });
    while (depth > 0){ h += '</ul></li>'; depth--; }
    return h + '</ul>';
  }

  function hhash(str){ var h = 0; for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; }
  function hue(pid, n){ return (hhash(String(pid)) % 6 + n - 1) % 6; }
  var GAME = {quiz:1, audit:1, case:1, poll:1, guess:1, hw:1, result:1}, SEQ = {};
  function block(kind, title, body, pid){
    var w = 0, h, t, note, i;

    if (kind === 'builder') return {h:'<div class="sb" data-r data-sb></div>', w:40};
    /* VIS-BLOCKS */
    if (kind === 'venn' || kind === 'funnel' || kind === 'matrix' || kind === 'vs' || kind === 'cols' || kind === 'mock'){
      var vl = body.map(function(b){ return b.replace(/\s+$/, ''); }).filter(function(b){ return b.trim(); }), vh;
      if (kind === 'venn'){
        var cir = vl.filter(function(b){ return b.charAt(0) !== '='; }).slice(0, 3).map(function(b){ var q = b.split('|'); return {t:q[0].trim(), d:q.slice(1).join('|').trim()}; });
        var cen = vl.filter(function(b){ return b.charAt(0) === '='; })[0], cq = cen ? cen.slice(1).split('|') : [];
        var pos = [[96, 96], [184, 96], [140, 168]];
        vh = '<figure class="vz venn" data-r><figcaption>' + E(title) + '</figcaption><svg viewBox="0 0 280 270" role="img" aria-label="' + E(title) + '">'
          + cir.map(function(c, i){ return '<circle class="vc c' + i + '" cx="' + pos[i][0] + '" cy="' + pos[i][1] + '" r="80" style="--i:' + i + '"/>'; }).join('')
          + cir.map(function(c, i){ var tx = [[62, 66], [218, 66], [140, 232]][i]; return '<text class="vt" x="' + tx[0] + '" y="' + tx[1] + '" text-anchor="middle">' + E(c.t.split(' ').slice(0, 2).join(' ')) + '</text>'; }).join('')
          + '<circle class="vm" cx="140" cy="125" r="30"/><text class="vt vtc" x="140" y="129" text-anchor="middle">' + E((cq[0] || 'Ваша тема').trim().slice(0, 14)) + '</text></svg><ol class="vlg">'
          + cir.map(function(c, i){ return '<li style="--i:' + i + '"><b>' + inline(c.t) + '</b><span>' + inline(c.d) + '</span></li>'; }).join('') + '</ol>'
          + (cq[1] ? '<p class="fn">' + inline(cq.slice(1).join('|').trim()) + '</p>' : '') + '</figure>';
      } else if (kind === 'funnel'){
        var st = vl.map(function(b){ var q = b.split('|'); return {t:q[0].trim(), v:q[1] ? q[1].trim() : '', n:q.slice(2).join('|').trim()}; });
        var nums = st.map(function(x){ return parseFloat(String(x.v).replace(/[^\d.,]/g, '').replace(',', '.')); }), mxn = Math.max.apply(null, nums.filter(function(x){ return !isNaN(x); })) || 0;
        vh = '<figure class="vz funnel" data-r><figcaption>' + E(title) + '</figcaption>' + st.map(function(x, i){
          var w = mxn && !isNaN(nums[i]) ? Math.max(56, Math.round(56 + nums[i] / mxn * 44)) : Math.max(56, 100 - i * Math.round(44 / Math.max(1, st.length - 1)));
          return '<div class="fn-r" style="--i:' + i + ';--w:' + w + '%"><div class="fn-b"><b>' + inline(x.t) + '</b><em>' + E(x.v) + '</em></div>' + (x.n ? '<p>' + inline(x.n) + '</p>' : '') + '</div>'; }).join('') + '</figure>';
      } else if (kind === 'matrix'){
        var mp = title.split('|'), cells = vl.map(function(b){ var q = b.split('|'); return {t:q[0].trim(), d:q.slice(1).join('|').trim()}; });
        vh = '<figure class="vz matrix" data-r><figcaption>' + E(mp[0].trim()) + '</figcaption><div class="mx"><span class="mxy">' + E((mp[2] || '').trim()) + '</span><div class="mxg">' + cells.slice(0, 4).map(function(c, i){ return '<div class="mxc m' + i + '" style="--i:' + i + '"><b>' + inline(c.t) + '</b><span>' + inline(c.d) + '</span></div>'; }).join('') + '</div><span class="mxx">' + E((mp[1] || '').trim()) + '</span></div></figure>';
      } else if (kind === 'vs'){
        var vp = title.split('|');
        vh = '<figure class="vz vs" data-r><figcaption>' + E(vp[0].trim()) + '</figcaption><div class="vsh"><span></span><b class="a">' + E((vp[1] || 'А').trim()) + '</b><b class="b">' + E((vp[2] || 'Б').trim()) + '</b></div>' + vl.map(function(b, i){ var q = b.split('|'); return '<div class="vsr" style="--i:' + i + '"><span>' + inline(q[0].trim()) + '</span><p class="a">' + inline((q[1] || '').trim()) + '</p><p class="b">' + inline((q[2] || '').trim()) + '</p></div>'; }).join('') + '</figure>';
      } else if (kind === 'cols'){
        var cp = title.split('|'), cs = vl.map(function(b){ var a = b.indexOf('='), lab = b.slice(0, a), rest = b.slice(a + 1).split('|'); return {l:lab.trim(), v:parseFloat(rest[0]), t:(rest[1] || rest[0]).trim()}; });
        var cmx = Math.max.apply(null, cs.map(function(c){ return c.v; })) || 1;
        vh = '<figure class="vz cols" data-r><figcaption>' + E(cp[0].trim()) + '</figcaption><div class="cl-g">' + cs.map(function(c, i){ return '<div class="cl-c" style="--i:' + i + ';--h:' + Math.max(4, Math.round(c.v / cmx * 100)) + '%"><b>' + E(c.t) + '</b><i></i><span>' + inline(c.l) + '</span></div>'; }).join('') + '</div>' + (cp[1] ? '<p class="fn">' + inline(cp.slice(1).join('|').trim()) + '</p>' : '') + '</figure>';
      } else {   // mock: annotated website / form
        var mt = title.split('|'), els = vl.map(function(b){ var q = b.split('|'); return {k:q[0].trim(), t:(q[1] || '').trim(), n:q.slice(2).join('|').trim()}; }), n = 0;
        function skel(k){ return '<i class="sk"></i><i class="sk s2"></i>'; }
        var parts = els.map(function(e){
          var inner = '', num = ++n;
          if (e.k === 'nav') inner = '<div class="mk-nav"><b>' + E(e.t.split(';')[0]) + '</b><span>' + e.t.split(';').slice(1).map(function(x){ return '<u>' + E(x.trim()) + '</u>'; }).join('') + '</span></div>';
          else if (e.k === 'hero') inner = '<div class="mk-hero"><h5>' + E(e.t.split(';')[0]) + '</h5><p>' + E(e.t.split(';')[1] || '') + '</p><span class="mk-btn">' + E(e.t.split(';')[2] || 'Написать') + '</span></div>';
          else if (e.k === 'button') inner = '<div class="mk-row"><span class="mk-btn">' + E(e.t) + '</span></div>';
          else if (e.k === 'text') inner = '<div class="mk-text"><h6>' + E(e.t) + '</h6>' + skel() + '</div>';
          else if (e.k === 'cards') inner = '<div class="mk-cards">' + e.t.split(';').map(function(x){ return '<div><b>' + E(x.trim()) + '</b><i class="sk"></i></div>'; }).join('') + '</div>';
          else if (e.k === 'steps') inner = '<div class="mk-steps">' + e.t.split(';').map(function(x, i){ return '<div><em>' + (i + 1) + '</em><span>' + E(x.trim()) + '</span></div>'; }).join('') + '</div>';
          else if (e.k === 'input') inner = '<div class="mk-in"><small>' + E(e.t) + '</small><span></span></div>';
          else if (e.k === 'checkbox') inner = '<div class="mk-ck"><u></u><span>' + E(e.t) + '</span></div>';
          else if (e.k === 'image') inner = '<div class="mk-img"><span>' + E(e.t) + '</span></div>';
          else if (e.k === 'faq') inner = '<div class="mk-faq">' + e.t.split(';').map(function(x){ return '<div>' + E(x.trim()) + '<i>+</i></div>'; }).join('') + '</div>';
          else if (e.k === 'footer') inner = '<div class="mk-foot">' + E(e.t) + '</div>';
          else inner = '<div class="mk-text"><h6>' + E(e.t) + '</h6></div>';
          return {h:'<div class="mk-el" style="--i:' + (num - 1) + '"><em class="mk-n">' + num + '</em>' + inner + '</div>', l:'<li><em>' + num + '</em><span>' + inline(e.n) + '</span></li>'};
        });
        vh = '<figure class="vz mock' + ((mt[1] || '').trim() === 'form' ? ' isform' : '') + '" data-r><figcaption>' + E(mt[0].trim()) + '</figcaption><div class="mk-dev"><div class="mk-bar"><i></i><i></i><i></i><span>' + E((mt[2] || 'ваш-сайт.рф').trim()) + '</span></div><div class="mk-pg">' + parts.map(function(x){ return x.h; }).join('') + '</div></div><ol class="mk-lg">' + parts.map(function(x){ return x.l; }).join('') + '</ol></figure>';
      }
      return {h:vh, w:30};
    }
    /* GAME-BLOCKS */
    if (GAME[kind]){
      SEQ[kind] = (SEQ[kind] || 0) + 1;
      var gid = pid + ':' + kind + SEQ[kind], cfg, xp = 0, ln = body.map(function(b){ return b.replace(/\s+$/, ''); }).filter(function(b){ return b.trim(); });
      if (kind === 'quiz'){
        var o = [], ex = [];
        ln.forEach(function(b){ if (b.charAt(0) === '+') o.push({t:b.slice(1).trim(), c:1}); else if (b.charAt(0) === '-') o.push({t:b.slice(1).trim()}); else if (b.charAt(0) === '=') ex.push(b.slice(1).trim()); });
        cfg = {q:title, o:o, e:ex.join(' ')}; xp = 10;
      } else if (kind === 'audit'){
        var items = ln.map(function(b){ var bad = b.charAt(0) === '!', t = b.slice(1).trim(), a = t.indexOf('=>'); return {t:(a < 0 ? t : t.slice(0, a)).trim(), x:(a < 0 ? '' : t.slice(a + 2)).trim(), b:bad ? 1 : 0}; });
        cfg = {t:title, l:items}; xp = 10 * items.filter(function(x){ return x.b; }).length;
      } else if (kind === 'case'){
        var tp = title.split('|'), ms = (tp[1] || 'Результат:100').split(',').map(function(x){ var q = x.split(':'); return {n:q[0].trim(), v:parseFloat(q[1]) || 100}; }), sc = [];
        ln.forEach(function(b){
          if (b.charAt(0) === '#') sc.push({t:b.slice(1).trim(), o:[]});
          else if (b.charAt(0) === '>' && sc.length){ var q = b.slice(1).split('|'), d = {}; (q[1] || '').split(',').forEach(function(z){ var w = z.split(':'); if (w[1] != null) d[w[0].trim()] = parseFloat(w[1]) || 0; }); sc[sc.length - 1].o.push({t:q[0].trim(), d:d, r:(q.slice(2).join('|')).trim()}); }
        });
        cfg = {t:tp[0].trim(), m:ms, s:sc}; xp = 20;
      } else if (kind === 'poll'){
        cfg = {q:title, o:ln.map(function(b){ var t = b.replace(/^-\s*/, ''), a = t.indexOf('=>'); return {t:(a < 0 ? t : t.slice(0, a)).trim(), n:(a < 0 ? '' : t.slice(a + 2)).trim()}; })}; xp = 5;
      } else if (kind === 'guess'){
        var gp = title.split('|').map(function(x){ return x.trim(); }), rg = (gp[1] || '0-100').split('-');
        cfg = {q:gp[0], min:parseFloat(rg[0]), max:parseFloat(rg[1]), u:gp[2] || '', a:parseFloat(gp[3]), n:gp.slice(4).join(' | ') + (ln.length ? ' ' + ln.join(' ') : '')}; xp = 15;
      } else if (kind === 'hw'){
        var hp = title.split('|'), cr = [], ds = [], vd = [];
        ln.forEach(function(b){ var m = b.match(/^\[(\d+)\]\s*(.+)$/); if (m) cr.push({p:parseInt(m[1], 10), t:m[2]}); else if (b.charAt(0) === '=') b.slice(1).split('|').forEach(function(z){ var w = z.split(':'); vd.push({f:parseFloat(w[0]), t:w.slice(1).join(':').trim()}); }); else ds.push(b); });
        xp = parseInt(hp[1], 10) || 40;
        cfg = {t:hp[0].trim(), d:ds, c:cr, v:vd};
      } else if (kind === 'result'){
        var rp = title.split('|').map(function(x){ return x.trim(); }).filter(Boolean);
        cfg = {names:rp.length >= 4 ? rp.slice(0, 4) : ['Новичок', 'Практик', 'Стратег', 'Мастер'], note:ln.join(' ')};
      }
      return {h:'<div class="gm" data-r data-g="' + kind + '" data-id="' + E(gid) + '" data-xp="' + xp + '" data-cfg="' + E(JSON.stringify(cfg)).replace(/'/g, '&#39;') + '"></div>', w:20};
    }

    if (LAB[kind]){
      var inner = parse(body.join('\n'), pid, 1); w = inner.words;
      inner = inner.html.replace(/<section[\s\S]*?<\/section>/g, '');
      return {h:'<aside class="co ' + kind + '" data-r><span class="cot"><svg viewBox="0 0 24 24">' + ICON[kind] + '</svg>' + E(title || LAB[kind]) + '</span><div class="cob">' + inner + '</div></aside>', w:w};
    }
    var lines = body.filter(function(b){ return b.trim(); });
    if (kind === 'bars'){
      t = title.split('|'); note = t.slice(1).join('|'); t = t[0];
      var rows = lines.map(function(b){ var a = b.indexOf('='), lab = b.slice(0, a), rest = b.slice(a + 1).split('|'); return [lab.trim(), parseFloat(rest[0]), (rest[1] || rest[0]).trim()]; });
      var mx = Math.max.apply(null, rows.map(function(r){ return r[1]; }));
      h = '<figure class="fig hbars" data-r><figcaption>' + E(t.trim()) + '</figcaption>';
      rows.forEach(function(r, k){ h += '<div class="br" style="--i:' + k + '"><span class="bl2">' + inline(r[0]) + '</span><span class="tr"><i style="--w:' + Math.max(3, Math.round(r[1] / mx * 100)) + '%"></i></span><b>' + E(r[2]) + '</b></div>'; });
      if (note.trim()) h += '<p class="fn">' + inline(note.trim()) + '</p>';
      return {h:h + '</figure>', w:20};
    }
    if (kind === 'flow'){
      t = title.split('|'); note = t.slice(1).join('|'); t = t[0];
      h = '<figure class="fig flow" data-r><figcaption>' + E(t.trim()) + '</figcaption><ol>';
      lines.forEach(function(b, k){ var p = b.split('|'); h += '<li style="--i:' + k + '"><span class="no">' + (k < 9 ? '0' : '') + (k + 1) + '</span><span class="tx"><strong>' + inline(p[0].trim()) + '</strong><em>' + inline(p.slice(1).join('|').trim()) + '</em></span></li>'; });
      h += '</ol>'; if (note.trim()) h += '<p class="fn">' + inline(note.trim()) + '</p>';
      return {h:h + '</figure>', w:20};
    }
    if (kind === 'cells'){
      h = '<div class="cells" data-r>';
      lines.forEach(function(b, k){ var p = b.split('|'); h += '<div class="cell" style="--i:' + k + '"><b>' + inline(p[0].trim()) + '</b><p>' + inline(p.slice(1).join('|').trim()) + '</p></div>'; });
      return {h:h + '</div>', w:20};
    }
    if (kind === 'pyr'){
      h = '<figure class="fig pyr" data-r><figcaption>' + E(title) + '</figcaption>';
      lines.forEach(function(b, k){ h += '<div style="--i:' + k + ';--w:' + Math.round(46 + 54 * k / Math.max(1, lines.length - 1)) + '%">' + inline(b.trim()) + '</div>'; });
      return {h:h + '</figure>', w:20};
    }
    if (kind === 'shot' || kind === 'img'){
      var p2 = title.split('|'), f = p2[0].trim(), cap = p2.slice(1).join('|').trim(), src = /^(https?:|data:|posts\/)/.test(f) ? f : IMGBASE + f;
      return {h:'<figure class="' + (kind === 'shot' ? 'shot' : 'shot plain') + '" data-r><img loading="lazy" decoding="async" src="' + E(src) + '" alt="' + E(cap) + '">' + (cap ? '<figcaption>' + E(cap) + '</figcaption>' : '') + '</figure>', w:5};
    }
    if (kind === 'video'){   // :::video  file.mp4 | caption   or a YouTube / RuTube / VK / Vimeo link
      var vp = title.split('|'), v = vp[0].trim(), vc = vp.slice(1).join('|').trim(), emb = embedUrl(v), box;
      if (emb) box = '<iframe src="' + E(emb) + '" loading="lazy" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture;fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>';
      else box = '<video src="' + E(/^(https?:|posts\/)/.test(v) ? v : 'posts/vid/' + v) + '" controls playsinline preload="metadata"></video>';
      return {h:'<div class="vid" data-r>' + box + '</div>' + (vc ? '<p class="vidcap">' + inline(vc) + '</p>' : ''), w:10};
    }
    if (kind === 'stats'){   // :::stats  then lines  "92% | подпись"
      h = '<div class="stats" data-r>';
      lines.forEach(function(b, k){ var p = b.split('|'), v = p[0].trim(), m = v.match(/^([^\d-]*)(-?[\d\s.,]+)(.*)$/); var num = m ? parseFloat(m[2].replace(/\s/g, '').replace(',', '.')) : NaN;
        h += '<div class="stt" style="--i:' + k + '"><b' + (isNaN(num) ? '' : ' data-n="' + num + '" data-pre="' + E(m[1]) + '" data-suf="' + E(m[3]) + '"') + '>' + E(v) + '</b><span>' + inline(p.slice(1).join('|').trim()) + '</span></div>'; });
      return {h:h + '</div>', w:15};
    }
    if (kind === 'quote'){
      return {h:'<blockquote class="qt" data-r><p>' + inline(lines.join(' ')) + '</p>' + (title ? '<cite>' + E(title) + '</cite>' : '') + '</blockquote>', w:lines.join(' ').split(' ').length};
    }
    return {h:'<p class="fn">Неизвестный блок: ' + E(kind) + '</p>', w:0};
  }

  function parse(src, pid, start){
    var lines = src.replace(/\r/g, '').split('\n'), out = [], chapters = [], i = 0, open = false, words = 0;
    start = start || 1;
    function close(){ if (open){ out.push('</div></section>'); open = false; } }
    while (i < lines.length){
      var ln = lines[i].replace(/\s+$/, '');
      if (!ln.trim()){ i++; continue; }
      if (ln.indexOf('# ') === 0){
        close();
        var title = ln.slice(2).trim(), n = start + chapters.length, lead = '';
        if (i + 1 < lines.length && lines[i + 1].indexOf('lead:') === 0){ lead = lines[i + 1].slice(5).trim(); i++; }
        chapters.push({id:'c' + n, n:n, t:title});
        out.push('<section class="ch" id="' + pid + '_c' + n + '" data-h="' + hue(pid, n) + '" data-r><header class="chh"><span class="chn">' + (n < 10 ? '0' : '') + n + '</span><h2>' + E(title) + '</h2>' + (lead ? '<p class="lead">' + inline(lead) + '</p>' : '') + '</header><div class="chb">');
        words += lead.split(/\s+/).length; open = true; i++; continue;
      }
      if (ln.indexOf('## ') === 0){ out.push('<h3 class="h3" data-r>' + inline(ln.slice(3)) + '</h3>'); i++; continue; }
      if (ln.indexOf('### ') === 0){ out.push('<h4 class="h4">' + inline(ln.slice(4)) + '</h4>'); i++; continue; }
      if (ln.indexOf('```') === 0){
        var code = []; i++;
        while (i < lines.length && lines[i].indexOf('```') !== 0){ code.push(lines[i]); i++; }
        i++; out.push('<pre class="code" data-r><code>' + E(code.join('\n')) + '</code></pre>'); words += 30; continue;
      }
      if (ln.indexOf(':::') === 0){
        var head = ln.slice(3).trim(), sp = head.indexOf(' '), kind = sp < 0 ? head : head.slice(0, sp), ttl = sp < 0 ? '' : head.slice(sp + 1).trim(), body = []; i++;
        while (i < lines.length && lines[i].trim() !== ':::'){ body.push(lines[i].replace(/\s+$/, '')); i++; }
        i++; var r = block(kind, ttl, body, pid); out.push(r.h); words += r.w; continue;
      }
      if (ln.charAt(0) === '|'){
        var rows = [];
        while (i < lines.length && lines[i].charAt(0) === '|'){ rows.push(lines[i].trim().replace(/^\||\|$/g, '').split('|').map(function(c){ return c.trim(); })); i++; }
        rows = rows.filter(function(r){ return !r.every(function(c){ return /^:?-+:?$/.test(c); }); });
        var th = '<div class="tbl" data-r><table><thead><tr>' + rows[0].map(function(c){ return '<th>' + inline(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
        rows.slice(1).forEach(function(r, k){ th += '<tr style="--i:' + k + '">' + r.map(function(c, j){ return '<td data-l="' + E(rows[0][j] || '') + '">' + inline(c) + '</td>'; }).join('') + '</tr>'; });
        out.push(th + '</tbody></table></div>'); words += rows.reduce(function(a, r){ return a + r.join(' ').split(/\s+/).length; }, 0); continue;
      }
      if (/^\s*- /.test(ln) || ln.indexOf('[ ] ') === 0){
        var items = [];
        while (i < lines.length && (/^\s*- /.test(lines[i]) || lines[i].indexOf('[ ] ') === 0)){ items.push(lines[i].replace(/\s+$/, '')); i++; }
        out.push(ulist(items, pid)); words += items.join(' ').split(/\s+/).length; continue;
      }
      if (/^\d+\. /.test(ln)){
        var its = [];
        while (i < lines.length && /^\d+\. /.test(lines[i])){ its.push(lines[i].replace(/\s+$/, '').replace(/^\d+\. /, '')); i++; }
        out.push('<ol class="nl" data-r>' + its.map(function(x, k){ return '<li style="--i:' + k + '">' + inline(x) + '</li>'; }).join('') + '</ol>'); words += its.join(' ').split(/\s+/).length; continue;
      }
      var para = [ln]; i++;
      while (i < lines.length && lines[i].trim() && !/^(#|:::|\||\s*- |\d+\. |\[ \] |```)/.test(lines[i])){ para.push(lines[i].replace(/\s+$/, '')); i++; }
      var pt = para.join(' '); out.push('<p>' + inline(pt) + '</p>'); words += pt.split(/\s+/).length;
    }
    close();
    return {html:out.join('\n'), chapters:chapters, words:words};
  }

  g.ShatonMD = {hue:hue, render:function(src, pid){ SEQ = {}; var r = parse(src, pid || 'p', 1); r.min = Math.max(1, Math.round(r.words / 190)); return r; }};
})(window);

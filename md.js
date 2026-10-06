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

  function block(kind, title, body, pid){
    var w = 0, h, t, note, i;
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
        h += '<div class="st" style="--i:' + k + '"><b' + (isNaN(num) ? '' : ' data-n="' + num + '" data-pre="' + E(m[1]) + '" data-suf="' + E(m[3]) + '"') + '>' + E(v) + '</b><span>' + inline(p.slice(1).join('|').trim()) + '</span></div>'; });
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
        out.push('<section class="ch" id="' + pid + '_c' + n + '" data-r><header class="chh"><span class="chn">' + (n < 10 ? '0' : '') + n + '</span><h2>' + E(title) + '</h2>' + (lead ? '<p class="lead">' + inline(lead) + '</p>' : '') + '</header><div class="chb">');
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

  g.ShatonMD = {render:function(src, pid){ var r = parse(src, pid || 'p', 1); r.min = Math.max(1, Math.round(r.words / 190)); return r; }};
})(window);

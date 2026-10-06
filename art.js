/* Shaton Liquid Glass: glass objects as SVG (section icons, story avatars, cover objects).
   Layers per shape: tinted translucent fill, inner shine, silver-blue edge, cold lower edge, contact shadow and a soft colour glow behind.
   window.ShatonArt.svg(name) -> inline <svg> markup; ShatonArt.has(name) */
(function(g){
  var defs = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>'
    + '<linearGradient id="lgFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".86"/><stop offset=".5" stop-color="#d7e7ff" stop-opacity=".38"/><stop offset="1" stop-color="#bcd5ff" stop-opacity=".30"/></linearGradient>'
    + '<linearGradient id="lgFillB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9dbdff" stop-opacity=".86"/><stop offset=".55" stop-color="#3976ff" stop-opacity=".55"/><stop offset="1" stop-color="#234bff" stop-opacity=".70"/></linearGradient>'
    + '<linearGradient id="lgFillC" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b5f7fa" stop-opacity=".88"/><stop offset=".55" stop-color="#16d9e3" stop-opacity=".50"/><stop offset="1" stop-color="#2a7bff" stop-opacity=".55"/></linearGradient>'
    + '<linearGradient id="lgFillV" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c3b2ff" stop-opacity=".88"/><stop offset=".55" stop-color="#6a45ff" stop-opacity=".52"/><stop offset="1" stop-color="#3a52ff" stop-opacity=".62"/></linearGradient>'
    + '<linearGradient id="lgEdge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#cfe0ff"/><stop offset="1" stop-color="#6f9bff"/></linearGradient>'
    + '<linearGradient id="lgShine" x1="0" y1="0" x2=".7" y2=".9"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".38" stop-color="#fff" stop-opacity=".18"/><stop offset=".62" stop-color="#fff" stop-opacity="0"/></linearGradient>'
    + '<filter id="lgBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>'
    + '<filter id="lgBlurS" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>'
    + '</defs></svg>';
  function mount(){ if (!document.getElementById('lgdefs')) { var d = document.createElement('div'); d.id = 'lgdefs'; d.innerHTML = defs; document.body.insertBefore(d, document.body.firstChild); } }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

  /* a glass body: tag = rect|circle|ellipse|path, a = attribute string */
  function sh(tag, a, tint, tr){
    var t = tr ? ' transform="' + tr + '"' : '';
    return '<g' + t + '><' + tag + ' ' + a + ' fill="url(#lgFill' + (tint || '') + ')"/>'
      + '<' + tag + ' ' + a + ' fill="url(#lgShine)"/>'
      + '<' + tag + ' ' + a + ' fill="none" stroke="url(#lgEdge)" stroke-width="3.4"/>'
      + '<' + tag + ' ' + a + ' fill="none" stroke="#2f62d9" stroke-opacity=".22" stroke-width="1.2" transform="translate(1.6 2.4)"/></g>';
  }
  function R(x, y, w, h, r, tint, tr){ return sh('rect', 'x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r + '"', tint, tr); }
  function C(x, y, r, tint){ return sh('circle', 'cx="' + x + '" cy="' + y + '" r="' + r + '"', tint); }
  function Pth(d, tint, tr){ return sh('path', 'd="' + d + '" stroke-linejoin="round"', tint, tr); }
  function glow(c, x, y, rx, ry){ return '<ellipse cx="' + (x || 100) + '" cy="' + (y || 104) + '" rx="' + (rx || 70) + '" ry="' + (ry || 56) + '" fill="' + c + '" opacity=".42" filter="url(#lgBlur)"/>'; }
  var shadow = '<ellipse cx="102" cy="184" rx="66" ry="8" fill="#1c376e" opacity=".24" filter="url(#lgBlurS)"/>';
  function wrap(body){ return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' + body + '</svg>'; }
  var W = 'fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"';

  var A = {
    bars: function(){ return glow('#3976ff', 100, 100, 74, 66) + shadow + R(26, 28, 66, 66, 22, 'B') + R(106, 22, 66, 66, 22, '') + R(32, 108, 66, 66, 22, 'C') + R(112, 102, 66, 66, 22, 'V'); },
    cursor: function(){ return glow('#234bff', 96, 104, 70, 60) + shadow + '<circle cx="100" cy="102" r="72" fill="none" stroke="url(#lgFillB)" stroke-width="12" opacity=".75"/><circle cx="100" cy="102" r="78" fill="none" stroke="url(#lgEdge)" stroke-width="2.6"/><circle cx="100" cy="102" r="66" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2"/>'
      + Pth('M62 40 L156 104 L108 116 L88 166 Z', 'B') + C(154, 52, 15, 'C'); },
    globe: function(){ return glow('#16d9e3', 130, 120, 60, 54) + shadow + R(18, 34, 138, 106, 22, '') + '<path d="M18 62h138" ' + W + ' stroke-opacity=".8" stroke-width="3"/><circle cx="36" cy="48" r="4" fill="#3976ff"/><circle cx="50" cy="48" r="4" fill="#16d9e3"/><circle cx="64" cy="48" r="4" fill="#6a45ff"/>'
      + C(138, 126, 50, 'C') + '<g ' + W + ' stroke-opacity=".75" stroke-width="2.6"><ellipse cx="138" cy="126" rx="20" ry="50"/><path d="M88 126h100M96 100h84M96 152h84"/></g>'; },
    search: function(){ return glow('#3976ff', 90, 92, 66, 62) + shadow + '<g transform="rotate(45 140 144)"><rect x="112" y="134" width="70" height="26" rx="13" fill="url(#lgFillB)" stroke="url(#lgEdge)" stroke-width="3"/></g>'
      + C(86, 86, 56, '') + '<circle cx="86" cy="86" r="44" fill="none" stroke="url(#lgFillC)" stroke-width="7" opacity=".7"/><path d="M58 104l20-20 14 12 26-30" ' + W + ' stroke-width="7"/><path d="M104 66h14v14" ' + W + ' stroke-width="7"/>'; },
    send: function(){ return glow('#6a45ff', 100, 104, 74, 58) + shadow + Pth('M30 50a26 26 0 0 1 26-26h46a26 26 0 0 1 26 26v28a26 26 0 0 1-26 26H72l-26 22v-24a26 26 0 0 1-16-24z', 'B') + Pth('M78 96a26 26 0 0 1 26-26h44a26 26 0 0 1 26 26v26a26 26 0 0 1-16 24v22l-24-20h-30a26 26 0 0 1-26-26z', '') + Pth('M132 22l46 36-46 8-6 30-16-40z', 'C'); },
    spark: function(){ return glow('#3976ff', 100, 100, 72, 70) + shadow + C(100, 100, 78, '') + '<circle cx="100" cy="100" r="64" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.4"/>' + Pth('M100 38C104 78 122 96 162 100C122 104 104 122 100 162C96 122 78 104 38 100C78 96 96 78 100 38Z', 'B'); },
    trend: function(){ return glow('#16d9e3', 100, 104, 74, 56) + shadow + R(24, 112, 42, 58, 14, 'C') + R(79, 78, 42, 92, 14, 'B') + R(134, 40, 42, 130, 14, 'V') + '<path d="M30 92l50-34 30 20 56-52" ' + W + ' stroke-width="7"/><path d="M146 28h20v20" ' + W + ' stroke-width="7"/>'; },
    chart: function(){ return glow('#6a45ff', 100, 100, 70, 66) + shadow + C(100, 102, 72, '') + Pth('M100 102V30a72 72 0 0 1 68 50z', 'V') + Pth('M100 102l68-22a72 72 0 0 1-20 80z', 'C') + '<circle cx="100" cy="102" r="26" fill="url(#lgFill)" stroke="url(#lgEdge)" stroke-width="3"/>'; },
    play: function(){ return glow('#3976ff', 100, 104, 76, 56) + shadow + R(22, 40, 156, 120, 38, '') + Pth('M84 72L136 100L84 128Z', 'B'); },
    user: function(){ return glow('#3976ff', 100, 108, 66, 60) + shadow + Pth('M34 170C38 124 68 112 100 112C132 112 162 124 166 170Z', '') + C(100, 74, 36, 'B'); },
    mega: function(){ return glow('#6a45ff', 100, 100, 72, 58) + shadow + Pth('M46 82L138 40V152L46 116Z', 'B') + R(26, 80, 34, 40, 14, 'C') + R(60, 118, 26, 44, 12, '') + '<path d="M156 78q16 22 0 44M170 64q26 36 0 72" ' + W + ' stroke-width="6" stroke-opacity=".9"/>'; },
    tool: function(){ var t = ''; [0, 45, 90, 135].forEach(function(a){ t += '<g transform="rotate(' + a + ' 100 100)"><rect x="84" y="24" width="32" height="152" rx="14" fill="url(#lgFillC)" stroke="url(#lgEdge)" stroke-width="3"/></g>'; });
      return glow('#16d9e3', 100, 100, 70, 70) + shadow + t + C(100, 100, 46, 'B') + '<circle cx="100" cy="100" r="18" fill="#fff" fill-opacity=".85" stroke="url(#lgEdge)" stroke-width="3"/>'; },
    eye: function(){ return glow('#3976ff') + shadow + sh('path', 'd="M16 100C44 54 76 40 100 40S156 54 184 100C156 146 124 160 100 160S44 146 16 100Z"', '') + C(100, 100, 34, 'B') + '<circle cx="100" cy="100" r="13" fill="#050914" fill-opacity=".85"/>'; },
    tag: function(){ return glow('#6a45ff') + shadow + Pth('M24 104V40a16 16 0 0 1 16-16h64a16 16 0 0 1 11 5l60 60a16 16 0 0 1 0 22l-58 58a16 16 0 0 1-22 0l-60-60a16 16 0 0 1-11-9z', 'B') + '<circle cx="64" cy="64" r="12" fill="#fff" fill-opacity=".9"/>'; },
    loop: function(){ return glow('#3976ff') + shadow + '<circle cx="100" cy="100" r="62" fill="none" stroke="url(#lgFillB)" stroke-width="26" opacity=".85"/><circle cx="100" cy="100" r="75" fill="none" stroke="url(#lgEdge)" stroke-width="3"/><circle cx="100" cy="100" r="49" fill="none" stroke="url(#lgEdge)" stroke-width="2.4"/>' + Pth('M138 26l36 24-40 14z', 'C'); }
  };
  /* ICONSET: Shaton SVG Icon System v1 (viewBox 24, stroke 2, round caps, currentColor) */
  var ICONSET = {"avito": "<rect x=\"3.4\" y=\"3.4\" width=\"7.1\" height=\"7.1\" rx=\"3.1\"/><rect x=\"13.5\" y=\"3.4\" width=\"7.1\" height=\"7.1\" rx=\"3.1\"/><rect x=\"3.4\" y=\"13.5\" width=\"7.1\" height=\"7.1\" rx=\"3.1\"/><rect x=\"13.5\" y=\"13.5\" width=\"7.1\" height=\"7.1\" rx=\"3.1\"/>", "direct": "<path d=\"m5 3.8 13.7 8.05-6.1 1.35-2.95 5.55L5 3.8Z\"/><path d=\"m12.6 13.2 4.15 4.15\"/><circle cx=\"18.6\" cy=\"5.4\" r=\"1.5\"/>", "seo": "<circle cx=\"9.7\" cy=\"9.7\" r=\"5.8\"/><path d=\"m13.9 13.9 4.75 4.75\"/><path d=\"M14.9 9.7h2.2l1.25-2.1 2 1.15\"/>", "sites": "<rect x=\"2.8\" y=\"3.5\" width=\"18.4\" height=\"17\" rx=\"3\"/><path d=\"M2.8 8h18.4\"/><circle cx=\"12\" cy=\"14\" r=\"4\"/><path d=\"M8 14h8M12 10c1.25 1.1 1.9 2.43 1.9 4S13.25 16.9 12 18c-1.25-1.1-1.9-2.43-1.9-4S10.75 11.1 12 10Z\"/>", "smm": "<path d=\"M3.2 5.2A2.2 2.2 0 0 1 5.4 3h9.2a2.2 2.2 0 0 1 2.2 2.2v5.6a2.2 2.2 0 0 1-2.2 2.2H9l-4.2 3v-3.1a2.2 2.2 0 0 1-1.6-2.1V5.2Z\"/><path d=\"M11.2 16.2h3.5l4.5 3.1v-3.2a2.2 2.2 0 0 0 1.6-2.1V9.5\"/><path d=\"m7 8 6.1-2.3-2.35 5.95-1.15-2.5L7 8Z\"/>", "soon": "<path d=\"M12 2.9c.6 5.95 3.15 8.5 9.1 9.1-5.95.6-8.5 3.15-9.1 9.1-.6-5.95-3.15-8.5-9.1-9.1 5.95-.6 8.5-3.15 9.1-9.1Z\"/>", "favorites": "<path d=\"M12 20.2 4.85 13.5A5.45 5.45 0 0 1 3.3 9.65 4.75 4.75 0 0 1 8.1 4.8c1.62 0 3.02.76 3.9 1.95.88-1.19 2.28-1.95 3.9-1.95a4.75 4.75 0 0 1 4.8 4.85 5.45 5.45 0 0 1-1.55 3.85L12 20.2Z\"/>", "home": "<path d=\"m3.2 10.7 8.8-7.2 8.8 7.2\"/><path d=\"M5.3 9.5v10.7h13.4V9.5\"/><path d=\"M9.4 20.2v-6.1h5.2v6.1\"/>", "menu": "<rect x=\"3.5\" y=\"3.5\" width=\"6.5\" height=\"6.5\" rx=\"2\"/><rect x=\"14\" y=\"3.5\" width=\"6.5\" height=\"6.5\" rx=\"2\"/><rect x=\"3.5\" y=\"14\" width=\"6.5\" height=\"6.5\" rx=\"2\"/><rect x=\"14\" y=\"14\" width=\"6.5\" height=\"6.5\" rx=\"2\"/>", "profile": "<circle cx=\"12\" cy=\"8\" r=\"3.5\"/><path d=\"M4.7 20c.62-4.1 3.25-6.35 7.3-6.35S18.68 15.9 19.3 20\"/>", "search": "<circle cx=\"10.7\" cy=\"10.7\" r=\"6.2\"/><path d=\"m15.2 15.2 4.35 4.35\"/>", "share": "<path d=\"M12 15.7V3.8\"/><path d=\"m7.8 8 4.2-4.2L16.2 8\"/><path d=\"M6.2 11.8H5.1A2.1 2.1 0 0 0 3 13.9v4.2a2.1 2.1 0 0 0 2.1 2.1h13.8a2.1 2.1 0 0 0 2.1-2.1v-4.2a2.1 2.1 0 0 0-2.1-2.1h-1.1\"/>"};
  var SEC = {bars:'avito', cursor:'direct', globe:'sites', search:'seo', send:'smm', spark:'soon'};
  g.ShatonArt = {
    icons: ICONSET, sec: SEC,
    has: function(n){ return !!A[n]; },
    svg: function(n){ return wrap((A[n] || A.spark)()); }
  };
})(window);

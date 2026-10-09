/* SHATON PRIME: motion layer. Background, pointer-driven glass specular, header hide on scroll, hero markup. */
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var bg = document.createElement('div');
  bg.className = 'prbg'; bg.setAttribute('aria-hidden', 'true');
  bg.innerHTML = '<i class="o o1"></i><i class="o o2"></i><i class="o o3"></i><i class="s"></i><i class="s s2"></i><i class="s s3"></i>';
  document.body.insertBefore(bg, document.body.firstChild);

  var ic = {
    ads:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h3l8 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M18.5 9a4 4 0 0 1 0 6"/></svg>',
    web:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="3"/><path d="M3 9h18M7 6.8h.01M10 6.8h.01"/></svg>',
    content:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="m4 16 5-5 4 4 2-2 5 5"/><circle cx="15.5" cy="8.5" r="1.3"/></svg>',
    seo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></svg>',
    stat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/></svg>',
    spark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>'
  };
  window.primeHero = function(){
    var rows = [['РЕКЛАМА','ads'],['САЙТЫ','web'],['КОНТЕНТ','content'],['SEO','seo'],['АНАЛИТИКА','stat']];
    return '<section class="hero-p"><span class="pill"><i>'+ic.spark+'</i>Shaton Prime</span>'
      +'<h1>Маркетинг<em>в сборе</em></h1>'
      +'<p>Реклама, сайты и контент: разборы, шаблоны и практика.</p>'
      +'<div class="slabs" aria-hidden="true"><div class="st3">'
      +rows.map(function(r,i){ return '<div class="slab" style="--i:'+i+'"><b>'+ic[r[1]]+'</b><span>'+r[0]+'</span></div>'; }).join('')
      +'</div></div></section>';
  };

  /* light that follows the pointer across glass surfaces */
  if (!reduce && window.matchMedia('(hover:hover)').matches) {
    var sel = '.post,.co,.tbl,.fig,.cell,.stt,.qt,.cat,.grp,.cl,.endcard,.shot,.gm,.sb,.vz,.search,.pr-m,.nav';
    var raf = 0, ev;
    document.addEventListener('pointermove', function(e){
      ev = e; if (raf) return;
      raf = requestAnimationFrame(function(){
        raf = 0; var t = ev.target && ev.target.closest && ev.target.closest(sel); if (!t) return;
        var r = t.getBoundingClientRect();
        t.style.setProperty('--mx', ((ev.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        t.style.setProperty('--my', ((ev.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    }, {passive:true});
  }

  /* header hides when scrolling down, returns on scroll up */
  var top = document.querySelector('.top'), last = window.scrollY || 0, tick = false;
  if (top) window.addEventListener('scroll', function(){
    if (tick) return; tick = true;
    requestAnimationFrame(function(){
      tick = false; var y = window.scrollY || 0, d = y - last;
      if (Math.abs(d) > 6) { top.classList.toggle('pr-hide', d > 0 && y > 120); last = y; }
    });
  }, {passive:true});
})();

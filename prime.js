/* SHATON PRIME: motion layer. Background, pointer-driven glass specular, header hide on scroll, hero markup. */
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var bg = document.createElement('div');
  bg.className = 'prbg'; bg.setAttribute('aria-hidden', 'true');
  bg.innerHTML = '<i class="o o1"></i><i class="o o2"></i><i class="o o3"></i><i class="o o4"></i><i class="d d1"></i><i class="d d2"></i><i class="d d3"></i><i class="s"></i><i class="s s2"></i><i class="s s3"></i>';
  document.body.insertBefore(bg, document.body.firstChild);

  window.primeHero = function(){ return ''; };

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

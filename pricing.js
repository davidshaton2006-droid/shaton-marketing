/* Landing: reveal-on-scroll for service cards, pointer glow, and the "Узнать подробнее" dialog. */
(function(){
  var cards = [].slice.call(document.querySelectorAll('.svc, .svx'));
  if (!('IntersectionObserver' in window)) { cards.forEach(function(c){ c.classList.add('in'); }); }
  else {
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, {threshold:.12, rootMargin:'0px 0px -6% 0px'});
    cards.forEach(function(c){ io.observe(c); });
  }
  document.querySelectorAll('.svc').forEach(function(c){
    c.addEventListener('pointermove', function(e){ var r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); }, {passive:true});
  });
  var dlg = document.createElement('dialog'); dlg.className = 'svc-dlg'; dlg.setAttribute('aria-label', 'Подробное описание услуги');
  dlg.innerHTML = '<button type="button" class="dlg-x" aria-label="Закрыть">×</button><div class="dlg-in"></div>';
  document.body.appendChild(dlg);
  var body = dlg.querySelector('.dlg-in');
  function open(id){
    var t = document.getElementById('svt-' + id); if (!t) return;
    body.innerHTML = ''; body.appendChild(t.content.cloneNode(true));
    var cta = document.createElement('div'); cta.className = 'dlg-cta'; cta.innerHTML = '<a href="#lead" class="btn btn-primary">Заказать</a>'; body.appendChild(cta);
    cta.querySelector('a').addEventListener('click', function(){ dlg.close(); });
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    body.scrollTop = 0;
  }
  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('[data-svc]'); if (b) { open(b.getAttribute('data-svc')); return; }
    if (e.target === dlg || (e.target.closest && e.target.closest('.dlg-x'))) dlg.close();
  });
})();

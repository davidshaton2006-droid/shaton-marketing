/* Studio motion v2: no scroll hijacking, no hidden content, native fallbacks. */
(()=>{'use strict';
const d=document,root=d.body;if(!root.classList.contains('cinematic-home')||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
const scene=d.querySelector('.cinema-hero'),heading=d.querySelector('.cinema-copy h1');
const animate=(el,frames,options)=>{if(el&&typeof el.animate==='function')el.animate(frames,options)};
const ease='cubic-bezier(.16,1,.3,1)';
if(heading){animate(heading,[{clipPath:'inset(0 0 14% 0)',opacity:.4,translate:'0 20px'},{clipPath:'inset(0 0 0% 0)',opacity:1,translate:'0 0'}],{duration:1000,easing:ease});}
d.querySelectorAll('.cinema-copy .actions,.hero-meta,.scene-bottom').forEach((el,i)=>animate(el,[{opacity:.35,translate:'0 16px'},{opacity:1,translate:'0 0'}],{duration:850,delay:120+i*65,easing:ease}));
if(scene&&fine){let raf=0;const tick=()=>{raf=0;const y=Math.max(0,Math.min(scene.offsetHeight,window.scrollY));if(y<scene.offsetHeight){scene.style.setProperty('--scroll-back',Math.round(y*.075)+'px');scene.style.setProperty('--scroll-front',Math.round(y*.15)+'px')}};addEventListener('scroll',()=>{if(!raf&&scrollY<scene.offsetHeight)raf=requestAnimationFrame(tick)},{passive:true});tick()}
if('IntersectionObserver' in window){
const reveal=new IntersectionObserver(entries=>{let n=0;for(const e of entries){if(!e.isIntersecting)continue;reveal.unobserve(e.target);if(e.boundingClientRect.top<0)continue;const delay=Math.min(n++,5)*55;animate(e.target,[{opacity:.35,translate:'0 24px'},{opacity:1,translate:'0 0'}],{duration:720,delay,easing:ease})}},{threshold:.12});
d.querySelectorAll('.section-head h2,.section-head>p,.experience-preview,.service-card>.service-art,.portfolio-text,.lab-intro h2,.industry-intro,.arch-render,.founder-copy,.banner-number,.contact-glass h2').forEach(el=>reveal.observe(el));
const steps=[...d.querySelectorAll('.process-item')];const stepObs=new IntersectionObserver(entries=>{for(const e of entries)e.target.classList.toggle('is-current',e.isIntersecting)},{rootMargin:'-18% 0px -20% 0px',threshold:.4});steps.forEach(el=>stepObs.observe(el));
}
d.querySelectorAll('[data-experience]').forEach(b=>b.addEventListener('click',()=>{const art=d.querySelector('.experience-art'),copy=d.querySelector('.experience-copy');animate(art,[{opacity:.3,scale:.94,translate:'12px 0'},{opacity:1,scale:1,translate:'0 0'}],{duration:530,easing:ease});animate(copy,[{opacity:.5,translate:'0 9px'},{opacity:1,translate:'0 0'}],{duration:420,easing:ease})}));
d.querySelectorAll('[data-demo]').forEach(b=>b.addEventListener('click',()=>{const panel=[...d.querySelectorAll('[data-demo-panel]')].find(el=>el.dataset.demoPanel===b.dataset.demo);animate(panel,[{opacity:.35,translate:'0 7px'},{opacity:1,translate:'0 0'}],{duration:360,easing:ease})}));
d.querySelectorAll('.faq-list details').forEach(el=>el.addEventListener('toggle',()=>{if(el.open)animate(el.querySelector('p'),[{opacity:.3,translate:'0 -5px'},{opacity:1,translate:'0 0'}],{duration:300,easing:ease})}));
if(fine){d.querySelectorAll('.service-card,.feature,.featured-work').forEach(el=>{el.addEventListener('pointerenter',()=>{const arrow=el.querySelector('.card-link svg');animate(arrow,[{translate:'-4px 4px'},{translate:'0 0'}],{duration:420,easing:ease})})});}
})();
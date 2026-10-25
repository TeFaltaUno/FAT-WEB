(() => {
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const progress=document.getElementById('progress');
 const story=document.querySelector('.sticky-stage');
 const stage=document.getElementById('cinemaStage');
 const cards=[...document.querySelectorAll('.step-card')];
 const panels=[...document.querySelectorAll('.float-panel')];
 const kit=document.getElementById('kitStage');
 const jersey=document.getElementById('jerseyPan');
 const jerseyLabel=document.getElementById('jerseyLabel');
 const hero=document.querySelector('.hero');
 const clamp=(n,a=0,b=1)=>Math.min(Math.max(n,a),b);
 const revealElems=[...document.querySelectorAll('.reveal,.reveal-fast,.mosaic-card,.mode-tile')];
 if('IntersectionObserver' in window){
  const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px 30px 0px'});
  revealElems.forEach(e=>obs.observe(e));
 } else revealElems.forEach(e=>e.classList.add('visible'));
 let scheduled=false;
 function update(){
  const full=document.documentElement.scrollHeight-innerHeight;
  if(progress) progress.style.width=`${full>0?100*scrollY/full:0}%`;
  if(hero&&!reduce){const r=hero.getBoundingClientRect();hero.style.setProperty('--hero-depth',clamp(-r.top/Math.max(hero.offsetHeight,1)).toFixed(4))}
  if(story&&stage){const r=story.getBoundingClientRect(),total=Math.max(story.offsetHeight-innerHeight,1);const t=clamp(-r.top/total);const i=t<.333?0:t<.666?1:2;
   cards.forEach((el,k)=>el.classList.toggle('active',i===k));panels.forEach((el,k)=>el.classList.toggle('active',i===k));
   if(!reduce){stage.style.setProperty('--camera-scale',(1.03+.34*t).toFixed(3));stage.style.setProperty('--camera-y',`${(-32*t).toFixed(1)}px`);stage.style.setProperty('--camera-angle',`${(-1.2+2.4*t).toFixed(2)}deg`);stage.style.setProperty('--float-progress',((t*3)%1).toFixed(3))}
  }
  if(kit&&jersey){const r=kit.getBoundingClientRect(),total=Math.max(kit.offsetHeight-innerHeight,1);const t=clamp(-r.top/total);if(!reduce) jersey.style.transform=`translateX(-${(t*40).toFixed(2)}%)`;if(jerseyLabel)jerseyLabel.textContent=t<.30?'FRENTE':t<.68?'TRANSICIÓN':'DORSO'}
  scheduled=false;
 }
 addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update)}},{passive:true});
 addEventListener('resize',()=>requestAnimationFrame(update));update();
})();
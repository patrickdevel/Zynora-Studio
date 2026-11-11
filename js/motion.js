const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
const select=selector=>[...document.querySelectorAll(selector)];
const header=document.querySelector('.header');
const progress=document.createElement('div');
progress.className='reading-progress';progress.setAttribute('aria-hidden','true');header.append(progress);
let scrollFrame=0;
function updateScroll(){scrollFrame=0;const distance=Math.max(0,document.documentElement.scrollHeight-innerHeight);progress.style.scale=`${distance?Math.min(1,Math.max(0,scrollY/distance)):0} 1`;header.classList.toggle('is-scrolled',scrollY>20);}
function scheduleScroll(){if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll);}
window.addEventListener('scroll',scheduleScroll,{passive:true});window.addEventListener('resize',scheduleScroll,{passive:true});window.addEventListener('hashchange',scheduleScroll);
new ResizeObserver(scheduleScroll).observe(document.body);updateScroll();
const waveform=document.querySelector('.mini-wave');
if(waveform){waveform.replaceChildren(...Array.from({length:9},(_,index)=>{const bar=document.createElement('i');bar.style.setProperty('--bar-index',String(index));bar.style.setProperty('--bar-height',`${[8,17,12,23,16,26,11,20,8][index]}px`);return bar;}));waveform.setAttribute('aria-hidden','true');}
const running=new Set();
const surfaces=select('.hero,.feature,.product-showcase,.future');
const visibility=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('motion-visible',entry.isIntersecting)),{rootMargin:'70px'});surfaces.forEach(surface=>visibility.observe(surface));
const entrances=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;entrances.unobserve(entry.target);if(reduced.matches)return;const animation=entry.target.animate([{opacity:0,translate:'0 22px'},{opacity:1,translate:'0 0'}],{duration:650,delay:Number(entry.target.dataset.motionDelay||0),easing:'cubic-bezier(.16,1,.3,1)'});running.add(animation);animation.finished.catch(()=>{}).finally(()=>running.delete(animation));}),{threshold:.12});
select('.section-heading,.journey li,.sampler-preview,.store,.avatar-editor,.footer').forEach((element,index)=>{element.dataset.motionDelay=String((index%3)*75);entrances.observe(element);});
select('.feature,.studio-entry,.download-main,.profile-guest').forEach(card=>{let pointerFrame=0;card.addEventListener('pointermove',event=>{if(reduced.matches||!finePointer.matches||pointerFrame)return;const {clientX,clientY}=event;pointerFrame=requestAnimationFrame(()=>{pointerFrame=0;const bounds=card.getBoundingClientRect();card.style.setProperty('--spot-x',`${clientX-bounds.left}px`);card.style.setProperty('--spot-y',`${clientY-bounds.top}px`);});},{passive:true});card.addEventListener('pointerleave',()=>{cancelAnimationFrame(pointerFrame);pointerFrame=0;});});
document.addEventListener('pointerdown',event=>{if(reduced.matches)return;const button=event.target.closest('.button');if(!button||button.disabled)return;const bounds=button.getBoundingClientRect();const ripple=document.createElement('span');ripple.className='button-ripple';ripple.setAttribute('aria-hidden','true');const diameter=Math.max(bounds.width,bounds.height)*2;ripple.style.width=ripple.style.height=diameter+'px';ripple.style.left=event.clientX-bounds.left-diameter/2+'px';ripple.style.top=event.clientY-bounds.top-diameter/2+'px';button.append(ripple);ripple.addEventListener('animationend',()=>ripple.remove(),{once:true});setTimeout(()=>ripple.remove(),850);},{passive:true});
function motionPreference(){document.body.classList.toggle('motion-reduced',reduced.matches);if(reduced.matches){running.forEach(animation=>animation.cancel());document.querySelectorAll('.button-ripple').forEach(ripple=>ripple.remove());}}
reduced.addEventListener('change',motionPreference);motionPreference();
document.addEventListener('visibilitychange',()=>document.body.classList.toggle('motion-paused',document.hidden));
const ticker=document.querySelector('.ticker');
const tickerToggle=ticker?.querySelector('.ticker-toggle');
if(tickerToggle)tickerToggle.addEventListener('click',()=>{const paused=ticker.classList.toggle('is-paused');tickerToggle.setAttribute('aria-pressed',String(paused));tickerToggle.setAttribute('aria-label',paused?'Laufband fortsetzen':'Laufband pausieren');tickerToggle.title=paused?'Laufband fortsetzen':'Laufband pausieren';tickerToggle.textContent=paused?'▷':'Ⅱ';});

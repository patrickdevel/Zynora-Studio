import {initMusic} from './music-player.js?v=20261108-publication-paused1';
import {createBetaAccess} from './beta-access.js?v=20261109-public-sampler1';
import {discordAuthorization} from './discord-auth.js?v=20261107-music1';
import {translate} from './i18n.js?v=20261108-no-language-prompt1';
import {requestNecessaryStorage} from './storage-notice.js?v=20261107-music1';
import {config} from './config.js?v=20261107-music1';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const musicNavIcon=$('[data-page="music"] .nav-icon');if(musicNavIcon)musicNavIcon.innerHTML='<path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>';
const dialog=$('#auth-dialog'), studio=$('#studio-dialog'), studioLogin=$('#studio-login-dialog');
let client=null,user=null,profile=null,mode='signup',authStage='request',pendingEmail='',pendingUsername='',otpTimer=null,pendingAction=null,deletion=null;
const message=(element,text,error=false)=>{element.textContent=translate(text);element.classList.toggle('error',error);};
let toastTimer;
function toast(text){clearTimeout(toastTimer);$('#toast').textContent=text;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,4500);}
const humanError=e=>{const t=e?.message||String(e),code=e?.code||'';if(/Signups not allowed for otp/i.test(t))return 'Für diese E-Mail-Adresse gibt es noch kein Konto. Bitte wähle „Konto erstellen“.';if(/Token has expired|otp_expired/i.test(t))return 'Dieser Code ist abgelaufen. Fordere bitte einen neuen Code an.';if(/invalid.*token|Token.*invalid|otp_disabled/i.test(t))return 'Der eingegebene Code ist nicht gültig. Bitte prüfe ihn oder fordere einen neuen an.';if(/Account deletion pending/i.test(t))return 'Dein Konto ist zur Löschung vorgemerkt. Nimm die Löschung zuerst in deinem Profil zurück.';if(/Deletion already processing/i.test(t))return 'Die Kontolöschung wurde bereits gestartet und kann nicht mehr zurückgenommen werden.';if(/unique|duplicate|23505/i.test(t))return 'Dieser Benutzername ist bereits vergeben. Bitte wähle einen anderen.';if(code==='over_email_send_rate_limit'||/email rate limit exceeded/i.test(t))return 'Der E-Mail-Versand der Website hat gerade sein Stundenlimit erreicht. Es wurde kein Code gesendet. Bitte versuche es später erneut.';if(/rate_limit/.test(code)||/rate limit|too many|security purposes.*request this after/i.test(t)){const seconds=t.match(/after (\d+) seconds/i)?.[1];return seconds?'Für diese E-Mail-Adresse wurde gerade ein Code angefordert. Bitte warte '+seconds+' Sekunden und prüfe auch deinen Spam-Ordner.':'Bitte warte kurz, bevor du für diese E-Mail-Adresse einen weiteren Code anforderst.';}if(code==='email_address_not_authorized')return 'Der E-Mail-Versand ist aktuell auf Testadressen beschränkt. Der Betreiber muss einen eigenen Mailversand einrichten.';if(/email address.*invalid/i.test(t))return 'Bitte prüfe deine E-Mail-Adresse.';if(/fetch|network/i.test(t))return 'Die Verbindung konnte nicht hergestellt werden. Bitte versuche es erneut.';if(/smtp|sending confirmation/i.test(t))return 'Die Code-E-Mail konnte nicht versendet werden. Es wurde kein Code gesendet. Bitte versuche es später erneut.';return t;};
function setMode(next){clearInterval(otpTimer);mode=next==='login'?'login':'signup';authStage='request';pendingEmail='';pendingUsername='';const signup=mode==='signup';$('#auth-title').textContent=signup?'Mach es zu deinem.':'Schön, dass du da bist.';$('#username-label').hidden=!signup;$('#auth-username').required=signup;$('#terms-label').hidden=!signup;$('#auth-terms').required=signup;$('#auth-email').readOnly=false;$('#auth-email').required=true;$('#auth-code-label').hidden=true;$('#auth-code').required=false;$('#auth-code').value='';$('#auth-submit').textContent='Code per E-Mail senden ↗';$('#auth-resend-code').hidden=true;$('#auth-change-email').hidden=true;$('#discord-auth-section').hidden=false;$('.auth-tabs').hidden=false;$('#signup-tab').classList.toggle('active',signup);$('#login-tab').classList.toggle('active',!signup);message($('#auth-status'),'');}
function startOtpCooldown(seconds=60){clearInterval(otpTimer);const button=$('#auth-resend-code'),render=()=>{button.disabled=seconds>0;button.textContent=seconds>0?'Neuen Code senden ('+seconds+' s)':'Neuen Code senden';};render();otpTimer=setInterval(()=>{seconds--;render();if(seconds<=0)clearInterval(otpTimer);},1000);}
function showCodeEntry(email,username=''){authStage='verify';pendingEmail=email;pendingUsername=username;$('#auth-email').readOnly=true;$('#username-label').hidden=true;$('#terms-label').hidden=true;$('#auth-code-label').hidden=false;$('#auth-code').required=true;$('#auth-submit').textContent='Code bestätigen ↗';$('#auth-resend-code').hidden=false;$('#auth-change-email').hidden=false;$('#discord-auth-section').hidden=true;$('.auth-tabs').hidden=true;message($('#auth-status'),'Wir haben dir einen Zahlencode per E-Mail gesendet. Gib ihn hier vollständig ein und prüfe auch deinen Spam-Ordner.');startOtpCooldown();$('#auth-code').focus();}
async function sendEmailCode(){const email=$('#auth-email').value.trim().toLowerCase(),signup=mode==='signup',username=signup?$('#auth-username').value.trim().toLowerCase():pendingUsername;if(signup&&authStage==='request'){const {data:available,error:checkError}=await client.rpc('nx_username_available',{p_username:username});if(checkError)throw checkError;if(!available)throw Error('Dieser Benutzername ist nicht verfügbar.');}const {error}=await client.auth.signInWithOtp({email,options:{shouldCreateUser:signup,data:signup?{username,display_name:username}:undefined}});if(error)throw error;showCodeEntry(email,username);}
async function openAuth(next='signup'){if(!await requestNecessaryStorage())return;setMode(next);if(!dialog.open)dialog.showModal();document.body.classList.add('modal-open');}
function closeDialog(d){d.close();if(!$$('dialog[open]').length)document.body.classList.remove('modal-open');}
$$('[data-auth]').forEach(b=>b.addEventListener('click',()=>openAuth(b.dataset.auth)));$('#signup-tab').onclick=()=>setMode('signup');$('#login-tab').onclick=()=>setMode('login');
$$('.dialog-close').forEach(b=>b.onclick=()=>closeDialog(b.closest('dialog')));
$$('dialog').forEach(d=>d.addEventListener('close',()=>{if(!$$('dialog[open]').length)document.body.classList.remove('modal-open');}));
$('#privacy-link').onclick=()=>closeDialog(dialog);
$('#choose-music').onclick=()=>{if(studio.open)closeDialog(studio);location.hash='music';};
$('#menu-toggle').onclick=()=>{const expanded=$('.navigation').classList.toggle('expanded');$('#menu-toggle').setAttribute('aria-expanded',String(expanded));};
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
let pageAnimations=[];
const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('pending');revealObserver.unobserve(entry.target);}}),{threshold:.08});
function observeContent(view){if(reduceMotion.matches)return;view.querySelectorAll('.feature,.journey,.future,.legal>h2,.data-processing>h2').forEach((element,index)=>{element.classList.add('reveal','pending');element.style.transitionDelay=Math.min(index%3*65,130)+'ms';revealObserver.observe(element);});}
function route(){const hash=location.hash.slice(1)||'home';const dataLink=['privacy','verarbeitung-von-daten','provider-details'].includes(hash);const page=dataLink?'impressum':hash.startsWith('artist/')?'artist':hash==='download'?'music':hash;const view=$$('main > [data-view]').find(v=>v.dataset.view===page);if(!view)return;pageAnimations.forEach(animation=>animation.cancel());pageAnimations=[];$$('main > [data-view]').forEach(v=>v.hidden=v!==view);$$('[data-page]').forEach(a=>{a.classList.toggle('active',a.dataset.page===page);if(a.dataset.page===page){a.setAttribute('aria-current','page');$('#active-page').textContent=a.querySelector('span').textContent;}else a.removeAttribute('aria-current');});$('.navigation').classList.remove('expanded');$('#menu-toggle').setAttribute('aria-expanded','false');document.title=`${translate({home:'Aus Ideen wird Sound.',open:'Zynora Studio öffnen',music:'Music Player',artist:'Musikprofil',profile:'Mein Profil',support:'Support',applications:'Bewerbungen',impressum:'Impressum & Verarbeitung von Daten'}[page])} — ZYNORA Studio`;if(!reduceMotion.matches&&!dataLink){const targets=page==='home'?$$('.hero-copy,.hero-visual'):Array.from(view.children).slice(0,5);targets.forEach((target,index)=>{pageAnimations.push(target.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:440,delay:index*55,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'}));});}observeContent(view);if(dataLink){requestAnimationFrame(()=>$(hash==='provider-details'?'#provider-details':'#verarbeitung-von-daten').scrollIntoView({behavior:'instant',block:'start'}));}else window.scrollTo({top:0,behavior:'instant'});}
window.addEventListener('hashchange',route);route();
async function loadProfile(){if(!client||!user)return;const {data,error}=await client.from('nx_profiles').select('id,username,display_name,avatar_path').eq('id',user.id).maybeSingle();if(error)throw error;profile=data;if(!profile){const name=(user.user_metadata?.username||user.user_metadata?.preferred_username||'').toLowerCase().replace(/[^a-z0-9_]/g,'').slice(0,24);$('#profile-username').value=name;$('#profile-display').value=(user.user_metadata?.display_name||user.user_metadata?.full_name||name).slice(0,60);}else{$('#profile-username').value=profile.username;$('#profile-display').value=profile.display_name;$('#profile-greeting').dataset.userContent='true';$('#profile-greeting').textContent=profile.display_name||profile.username;}}
async function updateSession(next){if(user?.id!==next?.user?.id)betaAccess.reset();deletion=null;$('#account-deletion').hidden=true;user=next?.user||null;window.dispatchEvent(new CustomEvent('zynora-auth-change'));if(user)$('#profile-greeting').dataset.userContent='true';else delete $('#profile-greeting').dataset.userContent;profile=null;$('#profile-guest').hidden=!!user;$('#profile-form').hidden=!user;$('#profile-greeting').textContent=user?(user.user_metadata?.username||'kreativer Kopf.'):'kreativer Kopf.';$('#profile-email').textContent=user?.email||'';$$('[data-access-note]').forEach(e=>e.hidden=!!user);if(!user){$('#profile-username').value='';$('#profile-display').value='';return;}try{await betaAccess.refresh();await refreshDeletion();if(!deletion)await loadProfile();}catch(e){message($('#profile-status'),humanError(e),true);}}
async function ensureAccess(action){try{if(!client){toast('Kontoverbindung noch nicht verfügbar. Bitte lade die Seite erneut.');return false;}const {data,error}=await client.auth.getUser();if(error||!data.user){pendingAction=action;openAuth();return false;}if(!data.user.email_confirmed_at){toast('Bitte bestätige zuerst deine E-Mail-Adresse.');return false;}user=data.user;if(!profile){await loadProfile();if(!profile){pendingAction=action;location.hash='profile';message($('#profile-status'),'Wähle zuerst deinen einmaligen Benutzernamen und speichere dein Profil.');return false;}}return true;}catch(error){toast(humanError(error));return false;}}
$('#auth-form').onsubmit=async e=>{e.preventDefault();if(!client)return message($('#auth-status'),'Kontoverbindung ist noch nicht bereit.',true);const button=$('#auth-submit');button.disabled=true;message($('#auth-status'),'Einen Moment …');try{if(authStage==='request'){await sendEmailCode();}else{const token=$('#auth-code').value.replace(/\s/g,'');if(!/^\d+$/.test(token))throw Error('Bitte gib den vollständigen Zahlencode aus deiner E-Mail ein.');const {data,error}=await client.auth.verifyOtp({email:pendingEmail,token,type:'email'});if(error)throw error;if(!data.session)throw Error('Die Anmeldung konnte nicht abgeschlossen werden.');await updateSession(data.session);closeDialog(dialog);toast('Willkommen bei ZYNORA.');if(profile&&pendingAction){const action=pendingAction;pendingAction=null;await action();}else location.hash='profile';}}catch(error){message($('#auth-status'),humanError(error),true);}finally{button.disabled=false;}};
$('#auth-resend-code').onclick=async()=>{if(!client)return;const button=$('#auth-resend-code');button.disabled=true;try{await sendEmailCode();message($('#auth-status'),'Ein neuer Code wurde angefordert. Verwende immer den zuletzt erhaltenen Code und prüfe auch deinen Spam-Ordner.');}catch(error){message($('#auth-status'),humanError(error),true);}finally{if(!button.hidden&&button.textContent==='Neuen Code senden')button.disabled=false;}};
$('#auth-change-email').onclick=()=>setMode(mode);
$('#profile-form').onsubmit=async e=>{e.preventDefault();if(!user||!client)return;const button=e.submitter;button.disabled=true;message($('#profile-status'),'Profil wird gespeichert …');try{const username=$('#profile-username').value.trim().toLowerCase(),display=$('#profile-display').value.trim();if(!display)throw Error('Bitte gib einen Anzeigenamen ein.');const {data,error}=await client.rpc('nx_profile',{p_username:username,p_display:display,p_avatar:profile?.avatar_path||''});if(error)throw error;profile=data;await loadProfile();message($('#profile-status'),'Dein Profil wurde gespeichert.');toast('Dein Profil ist bereit.');if(pendingAction){const action=pendingAction;pendingAction=null;await action();}}catch(error){message($('#profile-status'),humanError(error),true);}finally{button.disabled=false;}};
$('#logout').onclick=async()=>{const {error}=await client.auth.signOut();if(error)return toast(humanError(error));pendingAction=null;closeDialog(studio);await updateSession(null);toast('Du bist abgemeldet.');};
async function download(){message($('#download-status'),translate('APK downloads are not available yet. We are preparing the launch.'));}
if($('#download-apk'))$('#download-apk').onclick=download;
let studioModule;
const betaAccess=createBetaAccess({getClient:()=>client,getUser:()=>user,onDenied:()=>{studioModule?.stop();if(studio.open)closeDialog(studio);}});
let studioStarting=false;
async function startStudio(){
 if(studioStarting)return;
 if(!user&&client){const {data,error}=await client.auth.getSession();if(!error&&data.session)await updateSession(data.session);}
 studioStarting=true;
 const identity=user?.id||getGuestStudioIdentity();
 // Request fullscreen in the click gesture, before the authorization network call.
 $('#studio-menu').hidden=false;$('#sampler-workspace').hidden=true;$('#songstudio-development').hidden=true;
 studio.showModal();window.dispatchEvent(new CustomEvent('zynora-studio-open'));document.body.classList.add('modal-open');studio.classList.add('fullscreen-fallback');
 $('#choose-sampler').disabled=true;
 $('#studio-menu-status').textContent=translate('Loading sounds and saved projects …');
 if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().then(()=>{if(!studio.open&&document.fullscreenElement)document.exitFullscreen().catch(()=>{});}).catch(()=>{});
 try{
  const source=await betaAccess.bundle();
  if(!studioModule){const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));try{studioModule=await import(url);}finally{URL.revokeObjectURL(url);}}
  if((user?.id||identity)!==identity||!studio.open)return;
  await studioModule.open(identity);
 }catch(error){if(studio.open)closeDialog(studio);toast(translate('The studio could not be opened. Please try again.'));}
 finally{studioStarting=false;}
}
function getGuestStudioIdentity(){
 try{
  const key='zynora-guest-studio-id';
  let identity=localStorage.getItem(key);
  if(!identity){identity='guest-'+crypto.randomUUID();localStorage.setItem(key,identity);}
  return identity;
 }catch{return 'guest-studio';}
}
$('#open-studio').onclick=startStudio;$('#studio-login-open-auth').onclick=async()=>{closeDialog(studioLogin);await openAuth('login');};studio.addEventListener('close',()=>{studioModule?.stop();studioModule?.flush().catch(()=>{});if(document.fullscreenElement===document.documentElement)document.exitFullscreen().catch(()=>{});});

async function refreshDeletion(){
 const {data,error}=await client.rpc('nx_deletion_status');if(error)throw error;deletion=data;if(deletion)betaAccess.reset();
 $('#account-deletion').hidden=!user;$('#profile-form').hidden=!user||!!deletion;
 $('#request-deletion').hidden=!!deletion;$('#cancel-deletion').hidden=!deletion||deletion.purging;
 $('#deletion-logout').hidden=!deletion;$('#deletion-pending').hidden=!deletion;
 $('#deletion-explanation').hidden=!!deletion;
 $('#deletion-date').textContent=deletion?new Date(deletion.delete_after).toLocaleString(document.documentElement.lang==='de'?'de-DE':'en-GB',{dateStyle:'long',timeStyle:'short'}):'';
}
$('#request-deletion').onclick=()=>{message($('#delete-confirm-status'),'');$('#delete-confirm-email').value='';$('#delete-account-dialog').showModal();document.body.classList.add('modal-open');};
$('#delete-account-form').onsubmit=async event=>{
 event.preventDefault();if(!client||!user)return;
 const button=$('#confirm-deletion');button.disabled=true;
 try{
  const {data:identity,error:identityError}=await client.auth.getUser();if(identityError||!identity.user)throw Error('Bitte melde dich erneut an.');
  if($('#delete-confirm-email').value.trim().toLowerCase()!==identity.user.email?.toLowerCase())throw Error('Bitte gib die E-Mail-Adresse deines Kontos ein.');
  const {error}=await client.rpc('nx_request_account_deletion');if(error)throw error;
  await refreshDeletion();closeDialog($('#delete-account-dialog'));message($('#deletion-status'),'Die Löschung ist für den angezeigten Termin vorgemerkt. Du kannst sie bis dahin zurücknehmen.');
 }catch(error){message($('#delete-confirm-status'),humanError(error),true);}finally{button.disabled=false;}
};
$('#cancel-deletion').onclick=async()=>{
 const button=$('#cancel-deletion');button.disabled=true;
 try{const {error}=await client.rpc('nx_cancel_account_deletion');if(error)throw error;await refreshDeletion();await loadProfile();message($('#deletion-status'),'Die Kontolöschung wurde zurückgenommen.');}
 catch(error){message($('#deletion-status'),humanError(error),true);}finally{button.disabled=false;}
};
$('#deletion-logout').onclick=()=>$('#logout').click();


const oauthFailed=new URLSearchParams(location.hash.slice(1)).has('error')||new URLSearchParams(location.search).has('error');
$('#discord-login').onclick=async()=>{
 if(!client)return message($('#auth-status'),translate('Discord sign-in is currently unavailable. Please use email sign-in.'),true);
 if(mode==='signup'&&!$('#auth-terms').checked){message($('#auth-status'),'Bitte lies zuerst die Informationen zur Verarbeitung von Daten.',true);$('#auth-terms').reportValidity();return;}
 const button=$('#discord-login');button.disabled=true;message($('#auth-status'),'Discord wird geöffnet …');
 try{const url=await discordAuthorization(client,{redirectTo:new URL('./',location.href).href,authOrigin:config.url});sessionStorage.setItem('zynora-oauth-pending','discord');location.assign(url);}
 catch{message($('#auth-status'),'Discord-Anmeldung ist derzeit nicht verfügbar. Bitte nutze die Anmeldung per E-Mail.',true);button.disabled=false;}
};
function finishDiscordSignIn(){try{if(sessionStorage.getItem('zynora-oauth-pending')==='discord'&&user){sessionStorage.removeItem('zynora-oauth-pending');history.replaceState(null,'',location.pathname+'#profile');route();}}catch{}}

async function init(){try{if(!globalThis.supabase?.createClient)throw Error('Die Kontobibliothek konnte nicht geladen werden.');client=globalThis.supabase.createClient(config.url,config.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});client.auth.onAuthStateChange((event,session)=>{setTimeout(async()=>{await updateSession(session);if(event==='SIGNED_IN')finishDiscordSignIn();if(event==='SIGNED_OUT'){studioModule?.stop();if(studio.open)closeDialog(studio);}},0);});const {data,error}=await client.auth.getSession();if(error)throw error;await updateSession(data.session);finishDiscordSignIn();if(oauthFailed){try{sessionStorage.removeItem('zynora-oauth-pending');}catch{}history.replaceState(null,'',location.pathname+'#profile');route();await openAuth('login');message($('#auth-status'),'Die Discord-Anmeldung wurde abgebrochen oder ist fehlgeschlagen. Bitte versuche es erneut oder melde dich per E-Mail an.',true);}}catch(error){message($('#profile-status'),humanError(error),true);toast('Kontoverbindung derzeit nicht verfügbar.');}}
$('#studio-fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});else if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>toast('Dein Browser unterstützt hier keinen Vollbildmodus.'));else toast('Dein Browser unterstützt hier keinen Vollbildmodus.');};
init();

initMusic({hasBetaAccess:()=>betaAccess.refresh(),prepareProjectImport:async()=>{studioModule?.stop();await studioModule?.flush();},projectImported:async id=>{await studioModule?.reloadProject?.(id);},getClient:()=>client,getUser:()=>user,requestLogin:()=>openAuth('login'),closeStudio:()=>{if(studio.open)closeDialog(studio);}});


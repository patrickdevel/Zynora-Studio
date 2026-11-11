const banner=document.querySelector('#cookie-banner');
let acknowledged=false;
try{acknowledged=localStorage.getItem('zynora-cookie-notice-v1')==='acknowledged';}catch{}
banner.hidden=acknowledged;
document.querySelector('#cookie-dismiss').addEventListener('click',()=>{banner.hidden=true;try{localStorage.setItem('zynora-cookie-notice-v1','acknowledged');}catch{}});
document.querySelector('#cookie-settings').addEventListener('click',()=>{banner.hidden=false;document.querySelector('#cookie-dismiss').focus({preventScroll:true});});

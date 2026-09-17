const MAX=100000, DAY=100000, POLL=1000;
const $=id=>document.getElementById(id);
let apiBase=localStorage.getItem('ngoc_api')||'', deviceId=localStorage.getItem('ngoc_device')||'';
if(!deviceId){deviceId=(crypto.randomUUID?crypto.randomUUID():('d-'+Date.now()+'-'+Math.random().toString(16).slice(2))).toLowerCase();localStorage.setItem('ngoc_device',deviceId)}
$('api').value=apiBase;
const norm=t=>String(t||'').replace(/\r\n?/g,'\n').trim();
const words=t=>(norm(t).match(/\S+/gu)||[]).length;
const url=p=>apiBase.replace(/\/$/,'')+p;
function status(t,c=''){ $('status').textContent=t; $('status').className='status '+c }
function refreshButton(){
 const n=words($('text').value), q=Number(window.quota?.balance_words||0);
 $('words').textContent=n.toLocaleString('vi-VN'); $('chars').textContent=norm($('text').value).length.toLocaleString('vi-VN');
 $('quota').textContent=q.toLocaleString('vi-VN')+' từ';
 $('quotaHint').textContent='Tối đa mỗi lần: 100.000 từ';
 $('next').textContent=window.quota?.next_accrual_date?window.quota.next_accrual_date+' · +100.000':'';
 $('generate').disabled=!apiBase||!n||n>MAX||n>q;
 if(n>MAX) status('Vượt 100.000 từ cho một lần tạo.','err'); else if(apiBase&&n>q) status('Không đủ quota cho lần tạo này.','err'); else if(!apiBase) status('Nhập URL backend HTTPS để bắt đầu.','err'); else status('Sẵn sàng.','ok');
 localStorage.setItem('ngoc_draft',$('text').value);
}
async function api(path,opt={}){ if(!apiBase) throw Error('Chưa cấu hình máy chủ TTS.'); const r=await fetch(url(path),opt), txt=await r.text(); let d; try{d=JSON.parse(txt)}catch{d={detail:txt||r.statusText}} if(!r.ok) throw Error(d.detail||('HTTP '+r.status)); return d }
async function quota(){ try{window.quota=await api('/api/quota?device_id='+encodeURIComponent(deviceId));refreshButton()}catch(e){window.quota=null;$('quota').textContent='—';status('Không kết nối được server: '+e.message,'err');$('generate').disabled=true} }
function progress(p,msg){$('progress').style.display='block';$('fill').style.width=Math.max(0,Math.min(100,Number(p)||0))+'%';$('percent').textContent=Math.round(Number(p)||0)+'%';$('progressText').textContent=msg||''}
function result(job){ $('result').style.display='block'; $('audio').src=url(job.download_url); const box=$('links'); box.innerHTML=''; const add=(label,u)=>{const a=document.createElement('a');a.className='link';a.href=url(u);a.target='_blank';a.rel='noopener';a.textContent=label;box.appendChild(a)}; if(job.files?.mp3)add('Mở / lưu MP3',job.files.mp3); if(job.files?.wav)add('Mở / lưu WAV',job.files.wav) }
async function poll(id){ for(;;){const j=await api('/api/jobs/'+encodeURIComponent(id));progress(j.progress||0,j.message||'Đang xử lý…');if(j.status==='done'){result(j);status('Tạo audio thành công · đã trừ '+Number(j.word_count).toLocaleString('vi-VN')+' từ.','ok');localStorage.removeItem('ngoc_job');await quota();return}if(j.status==='error')throw Error(j.message||'TTS thất bại');await new Promise(r=>setTimeout(r,POLL))} }
$('api').addEventListener('change',async e=>{apiBase=e.target.value.trim().replace(/\/$/,'');localStorage.setItem('ngoc_api',apiBase);await quota()});
$('text').addEventListener('input',refreshButton);$('clear').addEventListener('click',()=>{$('text').value='';$('result').style.display='none';$('audio').removeAttribute('src');refreshButton()});
$('file').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{$('text').value=await f.text();status('Đã mở '+f.name,'ok');refreshButton()}catch(x){status('Không đọc được file: '+x.message,'err')}e.target.value=''});
$('speed').addEventListener('input',()=>{$('speedText').textContent=Number($('speed').value).toFixed(2)+'×'});$('refresh').addEventListener('click',quota);
$('generate').addEventListener('click',async()=>{const text=norm($('text').value),n=words(text);if(!apiBase||!text||n>MAX||n>Number(window.quota?.balance_words||0))return;$('generate').disabled=true;progress(1,'Đang tạo job…');status('Đang giữ '+n.toLocaleString('vi-VN')+' từ quota…');try{const d=await api('/api/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,device_id:deviceId,voice:$('voice').value,speed:Number($('speed').value)})});window.quota=d.quota||window.quota;refreshButton();localStorage.setItem('ngoc_job',d.job_id);await poll(d.job_id)}catch(e){progress(0,'Lỗi');status(e.message,'err');await quota()}finally{refreshButton()}});
const saved=localStorage.getItem('ngoc_draft');if(saved)$('text').value=saved;$('speedText').textContent='1.00×';window.quota=null;refreshButton();quota();

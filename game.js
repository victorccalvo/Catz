/* Catz — original procedural pixel art, no external game assets. */
'use strict';
// Original, softly synthesized cat voices: no downloads or microphone access.
let effectsEnabled=true;
try{effectsEnabled=localStorage.getItem('catz-effects')!=='off'}catch{}
const activeVoices=new Set();
function getAudio(){
 const Audio=window.AudioContext||window.webkitAudioContext;
 if(!Audio)return null;
 try{audioCtx??=new Audio();if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});return audioCtx}catch{return null}
}
function catSound(kind,name){
 if(!effectsEnabled)return;
 const ac=getAudio();if(!ac)return;
 // Limit overlap when a player taps quickly, and clean up each completed voice.
 if(activeVoices.size>=3)activeVoices.values().next().value.stop();
 const sources=[],nodes=[];let timer;
 const voice={stop(){for(const source of sources){try{source.stop()}catch{}}for(const node of nodes){try{node.disconnect()}catch{}}clearTimeout(timer);activeVoices.delete(voice)}};
 activeVoices.add(voice);
 try{
 const now=ac.currentTime,base=({Mochi:470,Canela:590,Nuvem:390}[name]||470)*(.94+Math.random()*.12);
 const duration=kind==='purr'?1.5:kind==='chirp'?.38:.72;
 const envelope=ac.createGain();nodes.push(envelope);envelope.gain.setValueAtTime(0,now);envelope.gain.linearRampToValueAtTime(kind==='purr'?.1:.045,now+.06);envelope.gain.exponentialRampToValueAtTime(.001,now+duration);envelope.connect(ac.destination);
 if(kind==='purr'){
 const noise=ac.createBuffer(1,Math.ceil(ac.sampleRate*duration),ac.sampleRate),data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(.35+.65*Math.pow(Math.sin(i/ac.sampleRate*Math.PI*27),4));
 const source=ac.createBufferSource(),filter=ac.createBiquadFilter();source.buffer=noise;filter.type='lowpass';filter.frequency.value=380;source.connect(filter);filter.connect(envelope);sources.push(source);nodes.push(filter);source.start(now);source.stop(now+duration);
 }else{
 const osc=ac.createOscillator(),filter=ac.createBiquadFilter();osc.type='sawtooth';osc.frequency.setValueAtTime(base*.7,now);osc.frequency.exponentialRampToValueAtTime(base*1.3,now+duration*.23);osc.frequency.exponentialRampToValueAtTime(base*.72,now+duration);
 filter.type='bandpass';filter.Q.value=2;filter.frequency.setValueAtTime(1500,now);filter.frequency.exponentialRampToValueAtTime(650,now+duration);osc.connect(filter);filter.connect(envelope);sources.push(osc);nodes.push(filter);osc.start(now);osc.stop(now+duration);
 }
 timer=setTimeout(()=>voice.stop(),(duration+.15)*1000);
 }catch{voice.stop()}
}
function soundSettings(){show('🔊 Sons do café','Miados estilizados ao conversar e dar petiscos, um trinado ao brincar e ronrom ao alimentar ou acariciar. Música e efeitos podem ser ligados separadamente.',[
 [`Gatinhos: ${effectsEnabled?'ligados':'desligados'}`,()=>{effectsEnabled=!effectsEnabled;try{localStorage.setItem('catz-effects',effectsEnabled?'on':'off')}catch{}if(!effectsEnabled)for(const v of [...activeVoices])v.stop();else catSound('meow','Mochi');soundSettings()}],
 [`Música: ${musicTimer?'ligada':'desligada'}`,()=>{toggleMusic();soundSettings()}],
 ['Ouvir um ronrom',()=>catSound('purr','Nuvem')],['Ouvir um miado',()=>catSound('meow','Canela')]
 ])}
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
const $=s=>document.querySelector(s),modal=$('#modal');
const fresh=()=>({version:1,coins:35,day:1,minutes:480,area:'cafe',x:460,y:450,care:{Mochi:{food:65,play:50,treat:0},Canela:{food:70,play:60,treat:0},Nuvem:{food:60,play:45,treat:0}},clean:false,served:0,friends:{Lia:0,Bento:0,Flora:0},talked:{},quests:{},upgrades:[],flowers:0});
let state=fresh();try{const s=JSON.parse(localStorage.getItem('catz-save'));if(s?.version===1)state=s}catch{};
let keys={},walk=0,last=0,elapsed=0,saveTimer=0,near=null,toastTimer,audioCtx,musicTimer;
let facing='down', moving=false, particles=[], camera={x:0,y:0}, target=null;
const solids={cafe:[{x:183,y:217,w:64,h:38},{x:708,y:237,w:64,h:38},{x:708,y:442,w:64,h:38},{x:110,y:451,w:72,h:40},{x:180,y:365,w:72,h:16},{x:843,y:535,w:34,h:32},{x:820,y:313,w:65,h:79},{x:70,y:273,w:42,h:78}],town:[{x:80,y:177,w:202,h:134},{x:360,y:92,w:244,h:158},{x:700,y:100,w:170,h:150},...[[80,415],[885,420],[340,540],[850,600],[45,600]].map(([x,y])=>({x:x-12,y:y-9,w:24,h:25}))]};
function canStand(x,y){const minX=state.area==='cafe'?85:25,maxX=state.area==='cafe'?875:935,minY=state.area==='cafe'?210:265;
return x>=minX&&x<=maxX&&y>=minY&&y<=570&&!solids[state.area].some(r=>x+10>r.x&&x-10<r.x+r.w&&y+12>r.y&&y-1<r.y+r.h)}
function movePlayer(dx,dy,dt){const l=Math.hypot(dx,dy);moving=false;if(!l)return;facing=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');const nx=state.x+dx/l*145*dt,ny=state.y+dy/l*145*dt;if(canStand(nx,state.y)){state.x=nx;moving=true}if(canStand(state.x,ny)){state.y=ny;moving=true}if(moving)walk+=dt;else target=null}
function burst(x,y){for(let i=0;i<8;i++)particles.push({x,y:y-25,vx:(i-3.5)*9,vy:-20-Math.random()*20,life:1.3})}
function player(){const x=Math.round(state.x),y=Math.round(state.y),step=moving?Math.round(Math.sin(walk*14)*3):0,bob=moving?Math.abs(step)/2:Math.sin(elapsed*2)*.5;
rect(x-12,y+11,25,6,'#493c3e25');rect(x-8,y-1,6,14+step,'#687b79');rect(x+2,y-1,6,14-step,'#536864');rect(x-9,y+11+step,8,4,'#755544');rect(x+1,y+11-step,8,4,'#755544');
rect(x-11,y-23-bob,22,25,'#557e73');rect(x-9,y-21-bob,18,20,'#82a894');if(facing!=='up'){rect(x-6,y-16-bob,12,15,'#f1dbb3');rect(x-3,y-10-bob,6,5,'#d4b590')}
rect(x-14,y-19+step-bob,5,15,'#e4b18a');rect(x+10,y-19-step-bob,5,15,'#e4b18a');rect(x-9,y-42-bob,18,21,'#efc39b');rect(x-11,y-44-bob,22,9,'#77503d');
if(facing==='up'){rect(x-10,y-36-bob,20,17,'#77503d');rect(x-7,y-23-bob,5,8,'#634633')}else {rect(x-11,y-37-bob,5,17,'#77503d');rect(x+7,y-37-bob,4,13,'#77503d');if(facing!=='right')rect(x-5,y-31-bob,2,3,'#4b423d');if(facing!=='left')rect(x+4,y-31-bob,2,3,'#4b423d');rect(x-2,y-25-bob,4,2,'#c88a79')}
rect(x-14,y-45-bob,28,5,'#b98b55');rect(x-10,y-53-bob,20,9,'#e9c887');rect(x-10,y-46-bob,20,3,'#b68a64');rect(x+5,y-49-bob,5,5,'#d49c99');rect(x+7,y-48-bob,2,2,'#f2dd9d')}
function ambient(t){if(state.area==='cafe'){
// Woodgrain, coffee equipment and little signs of a lived-in room.
for(let i=0;i<70;i++){let x=90+(i*113)%780,y=220+(i*47)%330;rect(x,y,8+i%11,1,'#a2805a18')}
rect(273,101,39,25,'#5f746a');rect(277,104,31,6,'#9db3a0');rect(280,114,5,5,'#dec6a1');rect(300,114,5,5,'#dec6a1');rect(275,125,38,4,'#4f5d54');
for(let i=0;i<3;i++){rect(325+i*18,115,12,11,'#f8ebd2');rect(337+i*18,117,3,5,'#eee1c6');rect(327+i*18,115,8,2,'#805b41');rect(330+i*18+Math.sin(t*2+i)*2,103-(t*6+i*3)%12,2,7,'#fff4d6aa')}
for(const [x,y] of [[215,235],[740,255],[740,460]]){rect(x-48,y-1,15,26,'#8e6c50');rect(x-48,y-7,15,16,'#bc9668');rect(x-44,y-4,3,10,'#dbb382');rect(x+35,y-1,15,26,'#8e6c50');rect(x+35,y-7,15,16,'#bc9668');rect(x+39,y-4,3,10,'#dbb382')}
rect(70,273,42,78,'#9c7857');rect(74,278,34,66,'#7b674e');for(let row=0;row<2;row++){for(let j=0;j<5;j++)rect(77+j*6,283+row*30,4,20-j%3*3,['#9aa88a','#c69b82','#b5bdac','#dab88f','#9ea7b5'][j]);rect(73,307+row*30,36,4,'#ba9469')}
rect(825,311,55,81,'#9eaa87');rect(829,315,47,73,'#bcc49d');rect(827,346,51,6,'#8b9b78');rect(820,313,9,72,'#a6b48b');rect(876,313,9,72,'#a6b48b');rect(839,319,23,20,'#e7ceaa');
ctx.fillStyle='#fff2c318';ctx.beginPath();ctx.moveTo(130,160);ctx.lineTo(210,160);ctx.lineTo(360,430);ctx.lineTo(200,430);ctx.fill();for(const x of [200,725]){rect(x,85,2,36,'#92724c');rect(x-13,119,28,7,'#c4a064');rect(x-8,126,18,4,'#f4d895')}for(let i=0;i<8;i++)rect(120+(i*97)%730,180+(t*7+i*47)%330,2,2,'#fff0ce66')}
else{for(let i=0;i<12;i++){let x=(i*139+t*12)%960,y=285+(i*67)%300+Math.sin(t+i)*10;rect(x,y,3,2,'#f3d4c4');rect(x+3,y+2,2,2,'#e6c7b6')}for(let i=0;i<5;i++){const x=115+i*20,y=477+Math.sin(t*3+i)*2;rect(x,y,2,2,'#f6edc4')}}}
function resize(){
 const landscape=window.innerWidth>window.innerHeight&&window.innerHeight<=600;
 canvas.width=landscape?960:(canvas.clientWidth<600?600:960);
 canvas.height=landscape?Math.max(300,Math.min(640,Math.round(960*canvas.clientHeight/canvas.clientWidth))):640;
 ctx.imageSmoothingEnabled=false;
 keys={};touchKeys.clear();touchPointers.clear();document.querySelectorAll('[data-key]').forEach(b=>b.classList.remove('held'));
}
window.addEventListener('resize',resize);window.addEventListener('orientationchange',()=>{resetControls();requestAnimationFrame(resize)});
const cats=[{name:'Mochi',x:270,y:310,color:'#eee5d4',patch:'#b17e50'},{name:'Canela',x:640,y:360,color:'#d39754',patch:'#a5683b'},{name:'Nuvem',x:490,y:245,color:'#b2b4be',patch:'#777e91'}];
const cafeObjects=[{id:'door',name:'Sair para a vila',x:480,y:590},{id:'bed',name:'Encerrar o dia',x:830,y:155},{id:'box',name:'Limpar caixinhas',x:145,y:480},{id:'counter',name:'Preparar café e atender',x:360,y:175},{id:'shop',name:'Melhorias do café',x:715,y:165},...cats.map(c=>({id:'cat',name:'Cuidar de '+c.name,...c}))];
const townObjects=[{id:'door',name:'Entrar no café',x:480,y:250},{id:'Lia',name:'Conversar com Lia',x:245,y:370},{id:'Bento',name:'Conversar com Bento',x:720,y:320},{id:'Flora',name:'Conversar com Flora',x:640,y:510},{id:'flower',name:'Colher flor do jardim',x:150,y:510}];
function save(){try{localStorage.setItem('catz-save',JSON.stringify(state))}catch{toast('O navegador não conseguiu salvar. Mantenha esta aba aberta.')}}
function toast(t){particles.push({x:state.x,y:state.y-55,life:1.5});$('#toast').textContent=t;$('#toast').style.opacity=1;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').style.opacity=0,3500)}
function show(title,body,actions=[]){$('#dialogContent').replaceChildren();const h=document.createElement('h2');h.textContent=title;$('#dialogContent').append(h);const p=document.createElement('p');p.textContent=body;$('#dialogContent').append(p);actions.forEach(([label,fn])=>{let b=document.createElement('button');b.textContent=label;b.onclick=()=>{fn();save();ui()};$('#dialogContent').append(b)});resetControls();if(!modal.open)modal.showModal()}
$('.close').onclick=()=>modal.close();modal.addEventListener('click',e=>{if(e.target===modal)modal.close()});
function ui(){const h=Math.floor(state.minutes/60),m=Math.floor(state.minutes%60/10)*10;$('#clock').textContent=`☀ Dia ${state.day} · ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;$('#money').textContent=`🪙 ${state.coins}`;$('#location').textContent=state.area==='cafe'?'☕ Café dos Afetos · Primavera':'🌳 Vila das Patinhas · Primavera';$('#cats').innerHTML=cats.map(c=>{const s=state.care[c.name];return `<div class="cat"><label><strong>${c.name}</strong><span>${Math.round((s.food+s.play)/2)}% bem-estar</span></label><div class="bar"><i style="width:${(s.food+s.play)/2}%"></i></div></div>`}).join('');$('#objectives').innerHTML=dailyGoals().map(t=>`<div class="goal">${t}</div>`).join('')}
function dailyGoals(){return [`${state.clean?'✓':'○'} Limpar as caixinhas`,`${state.served>=3?'✓':'○'} Servir 3 cafés (${Math.min(3,state.served)}/3)`,`${Object.values(state.care).every(c=>c.food>=90&&c.play>=90)?'✓':'○'} Alimentar e brincar com todos`,`${Object.keys(state.talked).length>=3?'✓':'○'} Visitar os moradores (${Object.keys(state.talked).length}/3)`]}
function journal(){show('🌼 Tarefas e diário',`PARA HOJE · DIA ${state.day}\n${dailyGoals().join('\n')}\n\nSEUS GATINHOS\n${cats.map(c=>c.name+': comida '+Math.round(state.care[c.name].food)+'% · diversão '+Math.round(state.care[c.name].play)+'%').join('\n')}\n\nPEDIDOS DA VILA\nDia ${state.day}. Sem pressa: pedidos não expiram e os gatos nunca ficam doentes neste protótipo.\n\nLia: ${state.quests.Lia==='done'?'✓ Buquê entregue!':state.quests.Lia?'Leve uma flor do jardim para Lia.':'Converse com Lia na vila.'}\nBento: ${state.quests.Bento==='done'?'✓ Balcão aprovado!':state.quests.Bento?'Sirva 3 cafés e conte a Bento.':'Conheça Bento, o marceneiro.'}\nFlora: ${state.quests.Flora==='done'?'✓ Gatinhos felizes!':state.quests.Flora?'Alimente e brinque com os três gatos.':'Visite Flora, amiga dos animais.'}\n\nMelhorias: ${state.upgrades.join(', ')||'seu cantinho ainda vai crescer!'}\n\nAmizades: ${Object.entries(state.friends).map(([n,v])=>`${n} ${'♥'.repeat(v)}${'♡'.repeat(5-v)}`).join(' · ')}`)}
$('#journal').onclick=journal;
function catMenu(c){catSound('meow',c.name);const s=state.care[c.name];show(`🐾 ${c.name}`,`${c.name==='Mochi'?'Mochi se espreguiça e encosta a cabeça em você.':c.name==='Canela'?'Canela está de olho em um brinquedo de penas.':'Nuvem ronrona baixinho ao ver você.'}\nComidinha: ${Math.round(s.food)}% · Diversão: ${Math.round(s.play)}%`,[['Dar comida · grátis',()=>{s.food=100;catSound('purr',c.name);modal.close();toast(`${c.name} comeu e fez um ronrom agradecido ♥`)}],['Brincar com penas',()=>{s.play=100;catSound('chirp',c.name);modal.close();toast(`${c.name} adorou a brincadeira! ♥`)}],['Dar petisco · 2 moedas',()=>{if(state.coins<2)return toast('Você pode dar comida e brincar de graça ♥');state.coins-=2;s.food=Math.min(100,s.food+15);s.play=Math.min(100,s.play+15);s.treat++;catSound('meow',c.name);modal.close();toast('Um petisco e muito carinho!')}],['Fazer carinho',()=>{s.play=Math.min(100,s.play+10);catSound('purr',c.name);modal.close();toast(`${c.name}: prrrr… ♥`)}]])}
const lines={Lia:'Sou Lia, cuido da livraria. Uma flor deixaria meu balcão mais alegre. Você poderia trazer uma do jardim?',Bento:'Bento, marceneiro, ao seu dispor! Sirva três cafés para eu conhecer seu trabalho. Depois preparo uma melhoria para você.',Flora:'Sou Flora. Adoro ver gatos felizes! Alimente e brinque com Mochi, Canela e Nuvem; tenho uma surpresa para vocês.'};
function talk(n){if(!state.talked[n]){state.talked[n]=true;state.friends[n]=Math.min(5,state.friends[n]+1)}if(!state.quests[n])state.quests[n]='active';const ready=n==='Lia'?state.flowers>0:n==='Bento'?state.served>=3:Object.values(state.care).every(c=>c.food>=90&&c.play>=90);if(state.quests[n]==='active'&&ready){show(`${n} · Um favor com carinho`,'Você conseguiu! Pequenos gestos fazem nossa vila mais bonita.',[['Concluir pedido · +30 moedas e amizade',()=>{if(n==='Lia')state.flowers--;state.quests[n]='done';state.coins+=30;state.friends[n]=Math.min(5,state.friends[n]+2);modal.close();toast(n==='Bento'?'Bento liberou a melhoria do balcão!':n==='Flora'?'Flora liberou o cantinho dos gatos!':'Lia agora deixa flores no seu café!')}]])}else show(`${n} ${'♥'.repeat(state.friends[n])}`,state.quests[n]==='done'?`${n==='Lia'?'As flores ficaram lindas na livraria.':n==='Bento'?'Seu café já é um ponto de encontro da vila.':'Os gatinhos têm muita sorte de morar com você.'} Que bom ter você por aqui!`:lines[n]);save();ui()}
function upgrades(){show('🪴 Um café com a sua cara','As melhorias são permanentes. Faça amizade com os moradores para desbloquear novos projetos.',[['Balcão artesanal · 80 moedas',()=>buy('Balcão artesanal',80,'Bento')],['Cantinho dos gatos · 65 moedas',()=>buy('Cantinho dos gatos',65,'Flora')],['Jardim de entrada · 45 moedas',()=>buy('Jardim de entrada',45,'Lia')]])}
function buy(n,c,q){if(state.upgrades.includes(n))return toast('Essa melhoria já é sua ♥');if(state.quests[q]!=='done')return toast(`Conclua primeiro o pedido de ${q}.`);if(state.coins<c)return toast(`Faltam ${c-state.coins} moedas. Alguns cafés ajudam!`);state.coins-=c;state.upgrades.push(n);modal.close();toast('Um novo detalhe para o seu lar: '+n)}
function interact(){if(modal.open||!near)return;let o=near;if(o.id==='cat')return catMenu(o);if(o.id==='door'){state.area=state.area==='cafe'?'town':'cafe';state.x=480;state.y=state.area==='town'?300:535;save();ui();return}if(o.id==='counter'){show('☕ Um café quentinho','O visitante pede um café com leite. Os ingredientes básicos estão sempre disponíveis. Não há cronômetro.',[['Preparar e servir',()=>{state.served++;const tip=state.upgrades.includes('Balcão artesanal')?16:12;state.coins+=tip;modal.close();toast(`Café servido com carinho! +${tip} moedas`)}]]);return}if(o.id==='box'){state.clean=true;toast('Caixinhas limpas, patinhas felizes!');save();ui();return}if(o.id==='shop')return upgrades();if(o.id==='bed')return show('🌙 Hora de descansar?','O dia só termina quando você quiser. Seus pedidos continuam amanhã.',[['Dormir e começar um novo dia',()=>{state.day++;state.minutes=480;state.clean=false;state.served=0;state.talked={};Object.values(state.care).forEach(c=>{c.food=Math.max(40,c.food-25);c.play=Math.max(40,c.play-20)});modal.close();toast('Bom dia! Uma nova página, sem pressa.');save();ui()}]]);if(o.id==='flower'){if(state.flowers>=1)return toast('Você já tem uma flor. Deixe as outras para as abelhas ♥');state.flowers++;toast('Você colheu uma margarida para presentear.');save();return}talk(o.id)}
// Keep touch state separate so two fingers and keyboard input cannot cancel one another.
const touchKeys=new Set(),touchPointers=new Map();
const directionButtons=[...document.querySelectorAll('[data-key]')];
function resetControls(){keys={};target=null;touchKeys.clear();touchPointers.clear();directionButtons.forEach(b=>b.classList.remove('held'))}
function updateTouch(){touchKeys.clear();for(const key of touchPointers.values())touchKeys.add(key);directionButtons.forEach(b=>b.classList.toggle('held',touchKeys.has(b.dataset.key.toLowerCase())))}
function down(key){return keys[key]||touchKeys.has(key)}
$('#interact').onclick=interact;
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(!e.repeat&&e.key.toLowerCase()==='e')interact();if(!e.repeat&&e.key.toLowerCase()==='j')journal();keys[e.key.toLowerCase()]=true});
window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
window.addEventListener('blur',()=>{resetControls();save()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){resetControls();save()}});
for(const button of directionButtons){
 button.onpointerdown=e=>{e.preventDefault();if(modal.open)return;button.setPointerCapture(e.pointerId);touchPointers.set(e.pointerId,button.dataset.key.toLowerCase());updateTouch()};
 button.onpointermove=e=>{if(!touchPointers.has(e.pointerId))return;e.preventDefault();const hit=document.elementFromPoint(e.clientX,e.clientY);const key=hit?.closest('[data-key]')?.dataset.key;if(key)touchPointers.set(e.pointerId,key.toLowerCase());updateTouch()};
 button.onpointerup=button.onpointercancel=button.onlostpointercapture=e=>{touchPointers.delete(e.pointerId);updateTouch()};
 button.addEventListener('click',e=>e.preventDefault());
}
for(const surface of [$('.game'),$('.touch')]){
 surface.addEventListener('contextmenu',e=>e.preventDefault());surface.addEventListener('selectstart',e=>e.preventDefault());
 surface.addEventListener('touchstart',e=>{if(e.target.closest('[data-key]'))e.preventDefault()},{passive:false});
}
resize();
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function text(t,x,y,c='#514634',size=12){ctx.fillStyle=c;ctx.font=`${size}px monospace`;ctx.textAlign='center';ctx.fillText(t,x,y)}
function plant(x,y){rect(x-9,y,18,17,'#b77c55');rect(x-12,y,24,5,'#d09b70');rect(x-3,y-28,6,30,'#6e8950');rect(x-17,y-21,17,10,'#88a45d');rect(x+1,y-29,15,11,'#98ae6b');rect(x-12,y-34,12,12,'#6f945b')}
function tree(x,y){
 rect(x-28,y+3,57,10,'#4b653c25');rect(x-8,y-44,17,54,'#74583d');rect(x-4,y-43,7,51,'#aa8051');rect(x+1,y-21,4,28,'#bc935a');rect(x-11,y+6,24,5,'#816341');
 const foliage=[[-36,-65,72,24],[-44,-78,87,18],[-37,-94,75,18],[-26,-108,52,19],[-12,-116,25,12]];
 for(const [ox,oy,w,h] of foliage)rect(x+ox,y+oy,w,h,'#54794c');
 for(const [ox,oy,w,h] of foliage)rect(x+ox+3,y+oy+2,w-6,h-5,'#769852');
 rect(x-25,y-101,47,11,'#93ac60');rect(x-33,y-83,28,9,'#8ea85c');rect(x+5,y-91,25,12,'#85a25b');rect(x-25,y-65,50,9,'#648849');
 for(let i=0;i<13;i++){const lx=x-28+(i*17)%58,ly=y-98+(i*13)%37;rect(lx,ly,6,3,i%3?'#a2b56a':'#65894a')}
}
function person(x,y,color,moving=false,hat=false){const step=moving?Math.sin(walk*13)*4:0;rect(x-12,y+10,27,7,'#00000018');rect(x-8,y+1,6,14+step,'#665754');rect(x+3,y+1,6,14-step,'#665754');rect(x-10,y-20,22,25,color);rect(x-5,y-17,11,21,'#e8dcb8');rect(x-14,y-16+step,5,16,'#e7b98b');rect(x+11,y-16-step,5,16,'#e7b98b');rect(x-8,y-40,18,21,'#efc49c');rect(x-11,y-42,23,8,'#72513d');rect(x-11,y-37,5,15,'#72513d');rect(x+3,y-30,2,3,'#574438');if(hat){rect(x-15,y-44,31,5,'#c99562');rect(x-9,y-53,20,10,'#e4b77d')}rect(x-10,y+12+step,9,4,'#624735');rect(x+2,y+12-step,10,4,'#624735')}
function cat(c,t){let x=c.x+Math.sin(t*.6+c.x)*8,y=c.y+Math.cos(t*.4+c.x)*4;rect(x-16,y+9,34,7,'#00000016');rect(x-13,y-7,28,19,c.color);rect(x-18,y-19,22,22,c.color);rect(x-18,y-25,6,10,c.color);rect(x-2,y-25,6,10,c.color);rect(x-16,y-23,3,5,'#d8a3a0');rect(x-17,y-15,8,7,c.patch);rect(x-14,y-5,14,5,'#f5e8d3');const blink=Math.sin(t*.7+c.x)>.985;rect(x-13,y-10,2,blink?1:3,'#4d483f');rect(x-3,y-10,2,blink?1:3,'#4d483f');rect(x-21,y-4,6,1,'#8e806c');rect(x+1,y-4,6,1,'#8e806c');rect(x+4,y-5,3,8,c.patch);rect(x+10,y-4,2,5,c.patch);rect(x-8,y-5,3,2,'#c28b87');rect(x+13,y-10+Math.sin(t*2)*2,10,5,c.patch);rect(x-10,y+9,6,5,c.patch);rect(x+6,y+9,6,5,c.patch);text(c.name,x,y-33,'#66523e',10)}
function table(x,y){
 rect(x-27,y+20,60,9,'#755b4020');rect(x-25,y-9,50,35,'#76543d');rect(x-23,y+13,6,15,'#795a41');rect(x+17,y+13,6,15,'#795a41');
 rect(x-32,y-21,64,29,'#8e6446');rect(x-29,y-24,58,30,'#c39b6a');rect(x-26,y-22,52,3,'#e2be89');rect(x-29,y+3,58,3,'#a57850');
 for(let i=0;i<4;i++)rect(x-24,y-16+i*5,48,1,'#ad83582a');rect(x-20,y-18,21,22,'#ead7ad');rect(x-18,y-16,17,1,'#cbb88d');rect(x-19,y-1,19,2,'#cbb88d');
 rect(x-14,y-9,15,5,'#af8d6580');rect(x-12,y-14,12,10,'#fff0d1');rect(x,y-12,3,5,'#eadbbd');rect(x-10,y-13,8,3,'#76533d');rect(x-10,y-11,3,1,'#cba77b');
 rect(x+12,y-9,9,9,'#b57e5e');rect(x+10,y-11,13,4,'#d3a17a');rect(x+16,y-20,2,10,'#7c9154');rect(x+11,y-18,6,4,'#91a465');rect(x+17,y-22,6,5,'#a4b473');
}
function details(t){
 if(state.area==='cafe'){
 // Woven rug, wall trim and a few handmade touches.
 for(let y=314;y<437;y+=8)rect(378,y,214,1,'#f0c1a017');
 for(const x of [382,581])for(let y=325;y<426;y+=20){rect(x,y,6,6,'#edc1a1');rect(x+2,y-2,2,10,'#edc1a1')}
 for(let x=373;x<595;x+=9){rect(x,291,2,6,'#b4806e');rect(x,462,2,6,'#b4806e')}
 rect(65,158,830,3,'#75593f38');rect(65,163,830,2,'#e9cd9b');
 rect(474,77,40,48,'#947452');rect(477,80,34,42,'#e5d3ab');rect(480,83,28,36,'#e9dfbd');rect(489,92,12,13,'#a0ae83');rect(486,100,18,11,'#a0ae83');rect(490,90,3,5,'#a0ae83');rect(499,90,3,5,'#a0ae83');rect(490,103,2,2,'#687958');rect(499,103,2,2,'#687958');
 for(const x of [128,544]){rect(x,134,82,5,'#94734e');rect(x-3,139,88,4,'#c6a775')}
 rect(75,402,58,21,'#9f8060');rect(79,405,50,14,'#edd9b6');text('BEM-VINDOS',104,415,'#927551',7);
 }else{
 // Layered roof tiles and masonry anchor the buildings in the garden.
 for(const [x,y,w,h,c] of [[365,58,235,42,'#a86f5c'],[90,137,185,42,'#7e937b'],[710,69,155,40,'#8c7159']]){
 for(let yy=y;yy<y+h;yy+=9){rect(x,yy,w,1,c);for(let xx=x+(yy%2)*9;xx<x+w;xx+=21)rect(xx,yy,1,8,c)}}
 for(const [x,y,w] of [[362,246,240],[82,305,198],[702,245,165]]){rect(x,y,w,6,'#8b785a50');for(let xx=x;xx<x+w;xx+=17)rect(xx,y+1,13,2,'#e5cc9e')}
 for(const [x,y] of [[345,300],[605,300],[95,450],[215,550],[805,360]]){for(let i=0;i<3;i++){rect(x+i*9,y-9,5,18,'#c4b48b');rect(x+i*9,y-12,3,4,'#e6d6ab')}rect(x-2,y-3,29,4,'#dfcda2')}
 for(let i=0;i<24;i++){const x=45+(i*79)%880,y=320+(i*53)%280;if(x>410&&x<550||y>345&&y<430)continue;rect(x,y,2,7,'#7d9b57');rect(x-3,y-2,7,3,i%2?'#efd9bd':'#d6a8a6');rect(x-1,y-4,3,7,i%2?'#efd9bd':'#d6a8a6');rect(x,y-1,1,1,'#cfa65d')}
 }
}
function cafe(t){rect(0,0,960,640,'#b7c694');rect(55,55,850,555,'#805f48');rect(65,65,830,525,'#d6b88b');for(let y=65;y<590;y+=25){rect(65,y,830,1,'#bc9b76');for(let x=65+(y%2)*40;x<895;x+=80)rect(x,y,1,25,'#c7a57c')}rect(65,65,830,95,'#e9d7af');rect(65,142,830,18,'#aa8156');for(const x of [125,540]){rect(x,77,92,60,'#93734f');rect(x+5,82,82,50,'#a9d1c0');rect(x+44,82,4,50,'#fff0cf');rect(x+5,105,82,4,'#fff0cf');rect(x-5,73,12,67,'#d5a38c');rect(x+85,73,12,67,'#d5a38c')}rect(250,128,210,61,'#926748');rect(250,127,210,10,'#d3aa78');rect(260,145,190,35,'#b78b5e');rect(275,100,34,28,'#6f7666');rect(280,104,24,8,'#cfdbc3');rect(325,115,12,12,'#f8e8bd');rect(345,115,12,12,'#f8e8bd');text('CAFÉ DOS AFETOS',364,93,'#786247',13);rect(690,100,60,44,'#7e7050');rect(696,105,48,33,'#647e60');text('UPGRADES',720,126,'#fff0ca',8);rect(799,103,63,68,'#967351');rect(804,107,53,57,'#ebdac0');rect(808,114,45,15,'#faf0dc');rect(804,133,53,31,'#a2b6a1');
rect(365,292,235,172,'#ae7867');rect(371,298,223,160,'#d4a18a');for(let x=380;x<590;x+=20){rect(x,305,7,7,'#e8bca2');rect(x,440,7,7,'#e8bca2')}table(215,235);table(740,255);table(740,460);person(744,290,'#aa8390',false,true);person(213,269,'#8f9f80');rect(111,450,70,42,'#a79682');rect(117,456,58,28,state.clean?'#e4d4af':'#b8a888');if(!state.clean){rect(129,464,8,5,'#8e785f');rect(151,470,7,5,'#8e785f')}rect(180,368,32,12,'#b38065');rect(184,369,24,7,'#e6bf76');rect(220,368,32,12,'#91aeb0');rect(224,369,24,7,'#c6e1d9');plant(96,185);plant(870,196);plant(860,550);rect(437,581,86,28,'#e0c694');rect(441,581,78,3,'#f3dbac');text('↓ VILA',480,625,'#5e6547',12);if(state.upgrades.includes('Cantinho dos gatos')){rect(580,185,60,32,'#b5bd91');rect(590,177,40,36,'#d6d6b1');rect(607,151,7,32,'#a68460');rect(592,149,37,8,'#be9f70')}if(state.upgrades.includes('Balcão artesanal')){rect(250,137,210,4,'#edcb83');plant(450,126)}cats.forEach(c=>cat(c,t))}
function town(t){rect(0,0,960,640,'#a7bd7b');for(let y=0;y<640;y+=16)for(let x=0;x<960;x+=16){let n=(x*71+y*39)%97;if(n<20)rect(x+4,y+5,3,3,'#97b26d');if(n>90){rect(x+6,y+6,3,4,'#e8d7a0');rect(x+5,y+7,5,2,'#eddfb4')}}rect(420,240,120,400,'#ddc49a');rect(110,350,690,76,'#ddc49a');for(let x=130;x<800;x+=48)rect(x,370+(x%3)*8,12,4,'#cbb18a');rect(360,92,244,158,'#e6c99b');rect(346,78,272,30,'#ac7060');rect(360,55,244,25,'#ba806a');rect(378,33,206,25,'#cb9375');rect(453,172,58,78,'#846948');rect(460,178,44,65,'#a1b9a8');rect(493,215,4,4,'#f5de9e');for(let x of [380,538]){rect(x,142,45,50,'#94764e');rect(x+5,146,35,39,'#b5d7c2');rect(x+22,146,3,39,'#e9d9ae')}rect(418,114,136,24,'#faf0d2');text('CAFÉ DOS AFETOS',486,131,'#8a6c4a',11);rect(80,177,202,134,'#ccba91');rect(65,154,231,30,'#8c9a86');rect(85,133,193,25,'#9eac92');rect(154,245,45,66,'#9b7957');text('LIVRARIA',181,215,'#7c684c',12);rect(700,100,170,150,'#bca580');rect(686,85,198,27,'#927760');rect(704,65,162,24,'#ab8c68');rect(763,180,44,70,'#836649');text('OFICINA',786,153,'#66553e',12);for(const [x,y] of [[48,115],[305,80],[920,130],[80,415],[885,420],[340,540],[850,600],[45,600]])tree(x,y);rect(100,470,110,83,'#8ca568');for(let x=110;x<205;x+=19)for(let y=480;y<550;y+=21){rect(x,y,3,12,'#6f8b52');rect(x-3,y-2,9,5,'#fff0c0');rect(x,y-4,3,9,'#f8e9bb');rect(x,y,3,3,'#d8b45e')}person(245,370,'#ba8d99');person(720,320,'#8a9ba0',false,true);person(640,510,'#a2aa70');text('Lia',245,317);text('Bento',720,259);text('Flora',640,457);if(state.upgrades.includes('Jardim de entrada')){plant(387,250);plant(575,250)}rect(560,530,38,21,'#9b805b');rect(568,514,22,22,'#c9b492');rect(568,510,5,9,'#c9b492');rect(584,510,5,9,'#c9b492')}
function frame(time){
 const dt=Math.min((time-last)/1000||0,.05);last=time;elapsed+=dt;saveTimer+=dt;
 moving=false;
 if(!modal.open){let dx=(down('d')||down('arrowright')?1:0)-(down('a')||down('arrowleft')?1:0),dy=(down('s')||down('arrowdown')?1:0)-(down('w')||down('arrowup')?1:0);
 if(dx||dy)target=null;
 if(target&&!dx&&!dy){dx=target.x-state.x;dy=target.y-state.y;if(Math.hypot(dx,dy)<6){target=null;dx=dy=0}}
 movePlayer(dx,dy,dt);if(state.minutes<1190)state.minutes+=dt*.7;
 }
 camera.x=Math.max(0,Math.min(960-canvas.width,state.x-canvas.width/2));
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();camera.y=Math.max(0,Math.min(640-canvas.height,state.y-canvas.height*.57));
 ctx.translate(-Math.round(camera.x),-Math.round(camera.y));
 if(state.area==='cafe')cafe(elapsed);else town(elapsed);
 ambient(elapsed);details(elapsed);playerLayer();
 const objects=state.area==='cafe'?cafeObjects:townObjects;
 near=objects.reduce((best,o)=>Math.hypot(o.x-state.x,o.y-state.y)<80&&(!best||Math.hypot(o.x-state.x,o.y-state.y)<Math.hypot(best.x-state.x,best.y-state.y))?o:best,null);
 $('#hint').textContent=near?near.name:'Explore e aproxime-se para interagir';
 $('#interact').disabled=!near;$('#interact').setAttribute('aria-label',near?near.name:'Aproxime-se de um personagem ou objeto');
 if(near){const bob=Math.sin(elapsed*4)*3;rect(near.x-5,near.y-52+bob,10,4,'#fff2c5');rect(near.x-3,near.y-48+bob,6,3,'#fff2c5');rect(near.x-1,near.y-45+bob,2,2,'#fff2c5')}
 particles=particles.filter(p=>p.life>0);for(const p of particles){p.life-=dt;p.y-=dt*23;text('♥',p.x,p.y,'#c97b85',18)}
 ctx.restore();if(saveTimer>5){saveTimer=0;save();ui()}requestAnimationFrame(frame)
}
function playerLayer(){player();if(state.area==='cafe'){for(const c of cats)if(c.y>state.y+10)cat(c,elapsed);for(const [x,y] of [[215,235],[740,255],[740,460]])if(state.y<y+10)table(x,y)}else{for(const [x,y] of [[80,415],[885,420],[340,540],[850,600],[45,600]])if(state.y<y)tree(x,y)}}
function toggleMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=null;return}if(!getAudio())return;let i=0,notes=[261.63,329.63,392,329.63,293.66,349.23,440,349.23,261.63,329.63,392,523.25,440,392,329.63,293.66];musicTimer=setInterval(()=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=notes[i++%notes.length];g.gain.setValueAtTime(0,audioCtx.currentTime);g.gain.linearRampToValueAtTime(.035,audioCtx.currentTime+.03);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.75);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.8)},480);};
$('#sound').onclick=soundSettings;
ui();requestAnimationFrame(frame);if(!localStorage.getItem('catz-welcome')){show('Bem-vinda ao Café dos Afetos ♥','Este cantinho é seu. Caminhe com WASD ou as setas e use E perto de gatos, móveis e moradores. No celular, use os botões na tela.\n\nCuide dos três gatinhos, prepare cafés no balcão e visite a vila pela saída ao sul. Ninguém está com pressa: você escolhe quando dormir e os pedidos não expiram.',[['Vamos abrir o café!',()=>{localStorage.setItem('catz-welcome','1');modal.close()}]])}

// Headless smoke test of game logic and both Canvas scene renderers.
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const elements = new Map();
function element() { return {style:{},dataset:{},classList:{remove(){},toggle(){}},setPointerCapture(){},clientWidth:960,clientHeight:640,open:false,children:[],textContent:'',innerHTML:'',setAttribute(){},append(x){this.children.push(x)},replaceChildren(){this.children=[]},addEventListener(){},showModal(){this.open=true},close(){this.open=false}}; }
const drawing = new Proxy({}, {get:()=>()=>{},set:()=>true});
const storage = new Map();
const buttons=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].map(key=>{const b=element();b.dataset.key=key;return b});
const events={};
const context = vm.createContext({console,Math,JSON,buttons,events,document:{querySelector(s){if(!elements.has(s))elements.set(s,element());return elements.get(s)},querySelectorAll(){return buttons},addEventListener(){},elementFromPoint(){return null},createElement:element},window:{innerWidth:1200,innerHeight:800,addEventListener(name,fn){events[name]=fn}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){}});
context.document.querySelector('canvas').getContext=()=>drawing;
vm.runInContext(fs.readFileSync('game.js','utf8'),context);
vm.runInContext(`
modal.close();
const ev=id=>({pointerId:id,preventDefault(){}});
if(!dailyGoals().some(t=>t.includes('Limpar as caixinhas')))throw Error('Daily cleaning goal missing');
journal();if(!$('#dialogContent').children[1].textContent.includes('Limpar as caixinhas'))throw Error('Landscape task journal');modal.close();
const param={setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}};
let played=0;
window.AudioContext=class{constructor(){this.state='running';this.currentTime=0;this.sampleRate=8000;this.destination={}}resume(){return Promise.resolve()}createGain(){return {gain:param,connect(){},disconnect(){}}}createBiquadFilter(){return {frequency:param,Q:{value:0},connect(){},disconnect(){}}}createOscillator(){return {frequency:param,connect(){},start(){played++},stop(){},disconnect(){}}}createBuffer(ch,n){return {getChannelData(){return new Float32Array(n)}}}createBufferSource(){return {connect(){},start(){played++},stop(){},disconnect(){}}}};
catSound('meow','Mochi');catSound('purr','Nuvem');catSound('chirp','Canela');
if(played!==3)throw Error('Cat audio voices');
catSound('meow','Mochi');if(activeVoices.size>3)throw Error('Audio overlap limit');
effectsEnabled=false;const before=played;catSound('meow','Mochi');if(played!==before)throw Error('Audio mute');effectsEnabled=true;
for(const voice of [...activeVoices])voice.stop();
buttons[0].onpointerdown(ev(1));buttons[3].onpointerdown(ev(2));
if(!down('arrowup')||!down('arrowright'))throw Error('Two finger diagonal');
buttons[0].onpointerup(ev(1));if(down('arrowup')||!down('arrowright'))throw Error('Independent finger release');
buttons[3].onpointercancel(ev(2));if(down('arrowright'))throw Error('Cancelled touch stuck');
buttons[0].onpointerdown(ev(3));events.blur();if(down('arrowup'))throw Error('Blur reset');
window.innerWidth=844;window.innerHeight=390;canvas.clientWidth=844;canvas.clientHeight=348;resize();
if(canvas.width!==960||canvas.height!==396)throw Error('Landscape aspect ratio');frame(40);if(camera.y<=0)throw Error('Landscape camera');
window.innerWidth=390;window.innerHeight=844;

state.x=215;state.y=260;movePlayer(0,-1,.05);if(state.y!==260)throw Error('Furniture collision');
state.x=460;state.y=450;movePlayer(1,0,.05);if(facing!=='right'||state.x<=460)throw Error('Directional movement');
canvas.clientWidth=390;resize();if(canvas.width!==600)throw Error('Mobile viewport');frame(80);if(camera.x<=0)throw Error('Mobile camera');
canvas.clientWidth=960;resize();
for(const area of ['cafe','town']){
 state.area=area;const seen=new Set(),queue=[{x:480,y:area==='cafe'?530:300}];
 for(let i=0;i<queue.length;i++){const p=queue[i],key=p.x+','+p.y;if(seen.has(key))continue;seen.add(key);
 for(const [dx,dy]of [[10,0],[-10,0],[0,10],[0,-10]]){const x=p.x+dx,y=p.y+dy;if(canStand(x,y)&&!seen.has(x+','+y))queue.push({x,y})}}
 for(const o of area==='cafe'?cafeObjects:townObjects)if(!queue.some(p=>Math.hypot(p.x-o.x,p.y-o.y)<80))throw Error('Unreachable interaction: '+area+' '+o.id);
}
state.area='cafe';state.x=460;state.y=450;
frame(100); state.area='town'; frame(116); state.area='cafe';
near=cafeObjects.find(o=>o.id==='counter'); interact(); $('#dialogContent').children.at(-1).onclick();
if(state.coins!==47 || state.served!==1) throw Error('Cafe reward');
state.served=3; talk('Bento'); $('#dialogContent').children.at(-1).onclick();
if(state.quests.Bento!=='done'||state.coins!==77) throw Error('Quest reward');
state.coins=100; buy('Balcão artesanal',80,'Bento');
if(state.coins!==20||state.upgrades.length!==1) throw Error('Upgrade');
buy('Balcão artesanal',80,'Bento'); if(state.coins!==20) throw Error('Duplicate upgrade');
near=cafeObjects.find(o=>o.id==='box'); interact(); if(!state.clean) throw Error('Cleaning');
near=cafeObjects.find(o=>o.id==='door'); interact(); if(state.area!=='town') throw Error('Door');
near=townObjects.find(o=>o.id==='flower'); interact(); if(state.flowers!==1) throw Error('Flower');
talk('Lia'); $('#dialogContent').children.at(-1).onclick(); if(state.quests.Lia!=='done'||state.flowers!==0) throw Error('Flower quest');
save();
`,context);
assert.equal(JSON.parse(storage.get('catz-save')).quests.Bento,'done');
console.log('PASS: both scenes, collisions, all interaction routes, mobile camera, coffee, quests, upgrades, cleaning, travel and save.');



// Headless smoke test of game logic and both Canvas scene renderers.
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const elements = new Map();
function element() { return {style:{},dataset:{},clientWidth:960,open:false,children:[],textContent:'',innerHTML:'',setAttribute(){},append(x){this.children.push(x)},replaceChildren(){this.children=[]},addEventListener(){},showModal(){this.open=true},close(){this.open=false}}; }
const drawing = new Proxy({}, {get:()=>()=>{},set:()=>true});
const storage = new Map();
const context = vm.createContext({console,Math,JSON,document:{querySelector(s){if(!elements.has(s))elements.set(s,element());return elements.get(s)},querySelectorAll(){return []},createElement:element},window:{addEventListener(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){}});
context.document.querySelector('canvas').getContext=()=>drawing;
vm.runInContext(fs.readFileSync('game.js','utf8'),context);
vm.runInContext(`
modal.close();
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


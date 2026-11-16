// Headless smoke test of game logic and both Canvas scene renderers.
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const elements = new Map();
function element() { return {style:{},dataset:{},open:false,children:[],textContent:'',innerHTML:'',append(x){this.children.push(x)},replaceChildren(){this.children=[]},addEventListener(){},showModal(){this.open=true},close(){this.open=false}}; }
const drawing = new Proxy({}, {get:()=>()=>{},set:()=>true});
const storage = new Map();
const context = vm.createContext({console,Math,JSON,document:{querySelector(s){if(!elements.has(s))elements.set(s,element());return elements.get(s)},querySelectorAll(){return []},createElement:element},window:{addEventListener(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){}});
context.document.querySelector('canvas').getContext=()=>drawing;
vm.runInContext(fs.readFileSync('game.js','utf8'),context);
vm.runInContext(`
modal.close();
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
console.log('PASS: both scenes render; coffee, quest rewards, upgrades, duplicate protection, cleaning, travel, flowers and save.');

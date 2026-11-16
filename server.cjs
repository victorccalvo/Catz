// No dependencies. `node server.cjs --lan` allows phones on the same Wi-Fi.
const http = require('http');
const fs = require('fs');
const path = require('path');
const files = {'/':['index.html','text/html; charset=utf-8'],'/index.html':['index.html','text/html; charset=utf-8'],'/game.js':['game.js','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8']};
const host = process.argv.includes('--lan') ? '0.0.0.0' : '127.0.0.1';
http.createServer((req,res)=>{
  const file=files[req.url.split('?')[0]];
  if(!file){res.writeHead(404);res.end('Not found');return;}
  fs.readFile(path.join(process.cwd(),file[0]),(err,data)=>{if(err){res.writeHead(500);res.end('Unable to load game');return;}res.writeHead(200,{'Content-Type':file[1],'Cache-Control':'no-cache'});res.end(data);});
}).listen(8080,host,()=>console.log(`Catz: http://${host==='0.0.0.0'?'SEU-IP-LOCAL':'127.0.0.1'}:8080`));

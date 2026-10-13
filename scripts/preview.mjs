import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, dirname, extname} from 'node:path';
import {fileURLToPath} from 'node:url';

// Browser preview with a simulated host: ?theme=dark, ?scale=1.3, ?legacy=1 (host without layouts), ?fail=1.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../plugin-packages/app-layout');
const light = {background:'#f4f8f4', surface:'#ffffff', surfaceVariant:'#e6eee7', surfaceContainerLow:'#f9fbf9', primaryContainer:'#cbebd9', onPrimaryContainer:'#0e3a26', onSurface:'#1a2620', onSurfaceVariant:'#566b5f', primary:'#3fa277', onPrimary:'#ffffff', outlineVariant:'#d4ddd7', error:'#b3261e'};
const dark = {dark:true, background:'#0f1512', surface:'#171d1a', surfaceVariant:'#2a332e', surfaceContainerLow:'#171d1a', primaryContainer:'#1f5039', onPrimaryContainer:'#cbebd9', onSurface:'#dfe4e0', onSurfaceVariant:'#bfc9c2', primary:'#8dd5b0', onPrimary:'#00382a', outlineVariant:'#404943', error:'#ffb4ab'};
const sdkScript = `(()=>{const q=new URLSearchParams(location.search);const listeners=new Set();
const state={version:12,page:'feed',context:{fontScale:Number(q.get('scale')||1),theme:q.get('theme')==='dark'?${JSON.stringify(dark)}:${JSON.stringify(light)}},data:{}};
let layout=q.get('mode')==='bottomBar'?{shell:'bottomBar',items:['schedule','memos','components','courses']}:{shell:'drawer',items:[]};
const capabilities=q.get('legacy')?{}:{layouts:{shells:['drawer','bottomBar'],destinations:['schedule','courses','memos','components','plugins','reminders','settings','about'],maxBarItems:5}};
window.CurSimpleComponent={capabilities,version:12,get state(){return state},subscribe(f){listeners.add(f);f(state)},async request(command,payload={}){
 await new Promise(r=>setTimeout(r,150));
 if(command==='layout.current')return {shell:layout.shell,items:layout.items,ownedByCaller:layout.shell!=='drawer'};
 if(command==='layout.apply'){if(q.get('fail'))throw new Error('演示：课简拒绝了这个布局');layout=payload.shell==='drawer'?{shell:'drawer',items:[]}:{shell:payload.shell,items:payload.items};return {shell:layout.shell,items:layout.items,ownedByCaller:true};}
 throw new Error('预览不支持的操作');}};})();`;
const types = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8'};
const server = http.createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (pathname === '/') { res.writeHead(302, {Location:'/ui/index.html'}).end(); return; }
  // Fixed-width frame for narrow-screen checks; desktop browsers keep a minimum window width.
  if (pathname === '/frame') {
    const params = new URL(req.url, 'http://localhost').searchParams;
    const width = Math.max(240, Math.min(600, Number(params.get('w')) || 320));
    params.delete('w');
    res.writeHead(200, {'Content-Type': types['.html']});
    res.end(`<!doctype html><body style="margin:0;background:#888"><iframe src="/ui/index.html?${params}" style="border:0;width:${width}px;height:100vh;display:block;background:#fff"></iframe></body>`);
    return;
  }
  try {
    const path = resolve(root, '.' + pathname);
    if (!path.startsWith(root + '/')) { res.writeHead(403).end(); return; }
    let body = await readFile(path);
    if (extname(path) === '.html') body = Buffer.from(body.toString().replace('</head>', '<script>' + sdkScript + '</script></head>'));
    res.writeHead(200, {'Content-Type': types[extname(path)] || 'application/octet-stream'});
    res.end(body);
  } catch { res.writeHead(404).end(); }
});
server.listen(8767, '127.0.0.1', () => process.stdout.write('布局组件演示预览：http://127.0.0.1:8767/（模拟课简，不会改动真实应用）\n'));

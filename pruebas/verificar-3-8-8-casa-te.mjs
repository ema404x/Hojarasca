// 3.8.8: el interior de la casa de té. Estaba vacío aunque la galesa cocina y duerme adentro. Se arma el valle de verdad (el mismo
// método que verificar-3-8-8-cueva.mjs: los módulos del juego en un contexto de Node) y se mira, con el mundo de colisiones real,
// que el interior tenga lo suyo (hogar, sillón, mesas con sillas, cocina, cama, aparador), que se entre y se llegue a todo, que las
// sillas sean asientos de verdad y que nada tape la puerta ni los puntos de trabajo de aldea.js.
import { fileURLToPath } from 'url';
import fs from 'fs';
import assert from 'node:assert/strict';
import path from 'path';
import vm from 'vm';
const raiz=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src=path.join(raiz,'src');
const roots=[path.join(src,'terreno.js'),path.join(src,'colisiones.js'),path.join(src,'estructuras.js'),path.join(src,'gente.js'),path.join(src,'trochita.js'),path.join(src,'objetos.js')];
const idModulo=(archivo)=>'__mod_'+path.basename(archivo,'.js').replace(/[^A-Za-z0-9_$]/g,'_');
const normalizar=(desde,spec)=>path.resolve(path.dirname(desde),spec);
const info=new Map(), orden=[], visiting=new Set(), visited=new Set();
function analizar(archivo){const texto=fs.readFileSync(archivo,'utf8'); const deps=[]; const re=/^import\s+(.+?)\s+from\s+['\"](.+?)['\"]\s*;\s*$/gm; let m; while((m=re.exec(texto))){if(m[2]==='three')continue; if(!m[2].startsWith('.'))throw Error('external '+m[2]); deps.push(normalizar(archivo,m[2]));} return {texto,deps};}
function visitar(archivo){archivo=path.resolve(archivo); if(visited.has(archivo))return; if(visiting.has(archivo))throw Error('cycle'); visiting.add(archivo); const a=analizar(archivo);info.set(archivo,a);for(const d of a.deps)visitar(d); visiting.delete(archivo);visited.add(archivo);orden.push(archivo);}
for(const r of roots)visitar(r);
function transformar(archivo,texto){const ex=[]; for(const m of texto.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm))ex.push(m[1]); for(const m of texto.matchAll(/^export\s*\{([^}]+)\}\s*;?\s*$/gm)){for(const parte of m[1].split(',')){const [local,remoto]=parte.trim().split(/\s+as\s+/);if(local)ex.push((remoto||local).trim());}}
 texto=texto.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['\"]three['\"]\s*;\s*$/gm,'');
 texto=texto.replace(/^import\s+\{([^}]+)\}\s+from\s+['\"](.+?)['\"]\s*;\s*$/gm,(_t,nombres,spec)=>{const dep=normalizar(archivo,spec);const partes=nombres.split(',').map(x=>x.trim()).filter(Boolean).map(x=>{const [a,b]=x.split(/\s+as\s+/);return b?`${a.trim()}: ${b.trim()}`:a.trim();});return `const { ${partes.join(', ')} } = ${idModulo(dep)};`;});
 texto=texto.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm,''); texto=texto.replace(/^export\s*\{[^}]+\}\s*;?\s*$/gm,'');
 return `const ${idModulo(archivo)}=(()=>{\n${texto}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;}
let code=fs.readFileSync(path.join(raiz,'three-r186-inline.js'),'utf8')+'\n'; for(const f of orden)code+=transformar(f,info.get(f).texto)+'\n';

code+=`
;globalThis.__OUT=(()=>{
 const T=__mod_terreno.generarTerreno();
 const scene=new THREE.Scene();
 const col=__mod_colisiones.crearColisiones();
 const veg={arboles:[], colisiones:[], despejar(){}}; const puertas={agregar(){},agregarPostigos(){},agregarCorrediza(){}};
 const est=__mod_estructuras.crearEstructuras(T,scene,col,veg,puertas);
 const c=T.lugares['casa-te'];
 const cs=Math.cos(c.rot), sn=Math.sin(c.rot);
 const aM=(lx,lz)=>({x:c.x+lx*cs+lz*sn, z:c.z-lx*sn+lz*cs});
 const aL=(x,z)=>({lx:(x-c.x)*cs-(z-c.z)*sn, lz:(x-c.x)*sn+(z-c.z)*cs});
 // los sentaderos, en el marco de la casa
 const seats=est.sentaderos.map(s=>({...aL(s.x,s.z), y:s.y-c.y, nombre:s.nombre, mira:s.mira-c.rot})).filter(s=>Math.hypot(s.lx,s.lz)<8);
 // caminar: el cuerpo de 35 cm, con el piso que haya
 function caminar(desde, puntos){
  const p0=aM(desde[0],desde[1]); const pos={x:p0.x,y:c.y,z:p0.z}; const res=[];
  for(const [lx,lz] of puntos){ const t=aM(lx,lz);
   for(let i=0;i<900;i++){ const dx=t.x-pos.x, dz=t.z-pos.z, d=Math.hypot(dx,dz); if(d<0.1)break; const paso=Math.min(0.07,d); pos.x+=dx/d*paso; pos.z+=dz/d*paso;
    const p=col.plataformaEn(pos.x,pos.z,pos.y,0.62); if(p) pos.y=p.alto; col.resolver(pos,0.35,1.7); }
   const l=aL(pos.x,pos.z); res.push({lx:l.lx,lz:l.lz,y:pos.y-c.y,objetivo:[lx,lz]}); }
  return res;
 }
 // desde el pie del escalón: por la puerta, hasta el centro, las mesas, el fuego, la cocina y el aparador
 const rutas={
  puerta: caminar([0,5.0],[[0,3.3],[0,2.1],[0,0.2]]),
  camino: caminar([0,10.5],[[0,8.5],[0,6.5],[0,5.2]]),
  porLosLados: caminar([6.5,9.5],[[4.0,8.2],[1.8,6.6],[0,5.3]]),
  mesas: caminar([0,0.2],[[-0.4,1.0],[-1.3,1.9],[1.3,1.9]]),
  fuego: caminar([0,0.2],[[-0.8,-0.2],[-1.1,-1.2]]),
  cocina: caminar([0,0.2],[[1.6,-0.8],[0.3,-1.4]]),
  aparador: caminar([0,0.2],[[2.0,0.0],[2.2,0.95]]),
 };
 // ¿hay un obstáculo en los puntos de trabajo de la galesa? (cocina, mostrador, adentro)
 const choques=(lx,lz)=>{ const q=aM(lx,lz); const pos={x:q.x,y:c.y+0.38,z:q.z}; const a={...pos}; col.resolver(pos,0.35,1.7); return Math.hypot(pos.x-a.x,pos.z-a.z); };
 const banderas={}; scene.traverse((o)=>{ if(o.userData&&o.userData.bandera) banderas[o.userData.bandera]={x:o.position.x,y:o.position.y,z:o.position.z}; });
 return { banderas, seats, rutas, cocina:choques(1.6,-0.8), adentro:choques(0,0.4), meshes:0, platOk:!!col.plataformaEn(c.x,c.z,c.y+0.4,0.62) };
})();
`;
const fakeCtx=new Proxy({measureText(t){return {width:String(t).length*20}},createLinearGradient(){return {addColorStop:()=>{}}},createRadialGradient(){return {addColorStop:()=>{}}}},{get(t,p){if(p in t)return t[p]; return ()=>{};},set(t,p,v){t[p]=v;return true;}});
const context={console,Math,Float32Array,Uint8Array,Uint8ClampedArray,Uint16Array,Uint32Array,Int8Array,Int16Array,Int32Array,ArrayBuffer,DataView,Map,Set,WeakMap,WeakSet,Date,performance:{now:()=>0},document:{createElement(tag){if(tag==='canvas')return {width:1,height:1,getContext:()=>fakeCtx};return {};}}};
context.globalThis=context; vm.createContext(context); vm.runInContext(code,context,{timeout:120000});
const O = context.__OUT;
let n = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); n++; };
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const dentro = (s) => Math.abs(s.lx) < 3.0 && Math.abs(s.lz) < 2.5;

// ---------------------------------------------------------------- 1. asientos de verdad adentro
const adentro = O.seats.filter(dentro);
ok(adentro.length >= 5, `asientos adentro: el sillón y las sillas de las dos mesas (${adentro.length})`);
ok(adentro.some((s) => s.nombre === 'el sillón junto al fuego') && adentro.filter((s) => s.nombre === 'una silla del salón de té').length === 4, 'el sillón y las cuatro sillas del salón');
ok(O.seats.filter((s) => s.lz > 3 && s.lz < 5).length === 3 && O.seats.some((s) => s.nombre === 'la mecedora de la galería'), 'en la galería: las dos sillas de siempre y la mecedora');
ok(adentro.every((s) => Math.abs(s.y - 0.82) < 0.1 || Math.abs(s.y - 0.84) < 0.1), 'a la altura de un asiento sobre el piso (0,38 + 0,44)');
// el sillón mira al fuego (−x); las sillas, a la mesa
const sillon = adentro.find((s) => s.nombre === 'el sillón junto al fuego');
ok(sillon.lx < -1.5 && Math.abs(Math.cos(sillon.mira)) < 0.2 && Math.sin(sillon.mira) < 0, 'el sillón junto al hogar, mirando hacia él');

// ---------------------------------------------------------------- 2. se entra y se llega a todo
for (const [nombre, tramo] of Object.entries(O.rutas)) {
  for (const p of tramo) ok(Math.hypot(p.lx - p.objetivo[0], p.lz - p.objetivo[1]) < 0.3 && Math.abs(p.y - 0.38) < 0.12 || ((nombre === 'puerta' || nombre === 'camino' || nombre === 'porLosLados') && p.objetivo[1] > 3 && Math.hypot(p.lx - p.objetivo[0], p.lz - p.objetivo[1]) < 0.4), `${nombre}: se llega a (${p.objetivo}) → (${p.lx.toFixed(2)}, ${p.lz.toFixed(2)}, y ${p.y.toFixed(2)})`);
}
ok(O.cocina < 0.02, `el punto de la cocina de la galesa está libre (${O.cocina.toFixed(2)})`);
ok(O.adentro < 0.02, 'y el de entrar, también');

// ---------------------------------------------------------------- 2b. la parte de afuera
{
  const a = O.banderas.argentina, g = O.banderas.galesa;
  ok(a && g, 'hay dos banderas en el mástil: la argentina y la galesa');
  ok(a.y - g.y >= 0.9, `la galesa va más abajo que la argentina (${(a.y - g.y).toFixed(2)} m)`);
  ok(Math.abs(a.x - g.x) < 0.2 && Math.abs(a.z - g.z) < 0.01, 'en el mismo mástil');
  ok(a.y > 4.5 && g.y > 2.5, 'las dos, bien arriba (la nacional, sobre el techo)');
}

// ---------------------------------------------------------------- 3. el código
const est = leer('src/estructuras.js');
ok(est.includes('function amueblarCasaTe') && est.includes('amueblarCasaTe({ c, PT, col, sentaderos, w, sitio, rot, W, D, H })'), 'estructuras.js amuebla la casa de té antes de armar la malla');
for (const que of ['hogar de piedra', 'cocina económica', 'aparador', 'cama de la galesa', 'faroles colgados']) ok(est.includes(que), `lleva: ${que}`);
// lo galés y lo de casa de té
for (const que of ['function banderaGalesa', 'Y Ddraig Goch', 'llwy garu', 'telyn', 'Te Cymreig', 'Croeso', 'bara brith', 'torta negra', 'torre de tortas', 'cubretetera', 'platito de sauce', 'campanas de vidrio', 'patchwork galés']) ok(est.toLowerCase().includes(que.toLowerCase()), `lleva lo galés: ${que}`);
ok(est.includes('const adornos = []') && est.includes('return adornos') && est.includes('new THREE.PlaneGeometry(q.w, q.h)'), 'los carteles de adentro (bandera, carta del té, Croeso) se arman como planos con su dibujo');
ok(/for \(const q of amueblarCasaTe/.test(est), 'y se suman al grupo de la casa');
for (const que of ['function exteriorCasaTe', 'function banderaArgentina', 'lupino', 'macetones', 'camino de lajas', 'pizarra', 'luzGaleria', 'canastos colgantes', 'mecedora']) ok(est.includes(que), `afuera lleva: ${que}`);
ok(leer('src/main.js').includes('cab.luzGaleria.intensity'), 'main.js prende los faroles de la galería de noche');
for (const m of est.matchAll(/^import .*$/gm)) ok(/^import (\* as THREE|\{ [^}]+ \}) from '[^']+';$/.test(m[0]), `import en una línea: ${m[0]}`);
console.log(`verificar-3-8-8-casa-te: ${n} verificaciones ok`);

// 3.8.8: dónde queda la Cueva de las Manos y cómo se entra. Pedido del usuario: en la estepa (la zona más árida, junto a los pastizales y
// las llanuras) y sin escalerilla: se entra caminando, con un acceso natural. Se arma el valle de verdad (el mismo método de
// verificar-geometria-headless-rc3: los módulos del juego en un contexto de Node) y se mira dónde quedó y qué pisos tiene.
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
 const armar=()=>{
  const T=__mod_terreno.generarTerreno();
  const scene=new THREE.Scene();
  const obs=[], plats=[]; const col={ agregar:o=>obs.push({...o}), agregarPlataforma:p=>plats.push({...p}) };
  const veg={arboles:[], colisiones:[], despejar(){}}; const puertas={agregar(){},agregarPostigos(){},agregarCorrediza(){}};
  __mod_estructuras.crearEstructuras(T,scene,col,veg,puertas);
  const c=T.lugares.cueva; if(!c) return null;
  const k=T.indice(c.x,c.z);
  const cerca=plats.filter(p=>Math.hypot(p.x-c.x,p.z-c.z)<12).map(p=>({alto:p.alto-c.y,largo:p.largo,ancho:p.ancho,x:p.x-c.x,z:p.z-c.z}));
  // el terreno de adelante (de la boca hacia afuera), en el mundo
  const cs=Math.cos(c.rot), sn=Math.sin(c.rot); let frenteMin=Infinity, frenteMax=-Infinity;
  for(let lx=-3;lx<=3;lx+=1) for(const lz of [1.6,2.2,3.0]){ const y=T.altura(c.x+lx*cs+lz*sn, c.z-lx*sn+lz*cs)-c.y; frenteMin=Math.min(frenteMin,y); frenteMax=Math.max(frenteMax,y); }
  let agua=false; for(let a=0;a<12;a++){ if(T.agua(c.x+Math.cos(a/12*6.283)*8, c.z+Math.sin(a/12*6.283)*8)) agua=true; }
  return { x:c.x, y:c.y, z:c.z, rot:c.rot, nombre:c.nombre, estepa:T.estepa[k], pendiente:T.pendiente[k], distRio:T.distRio[k], distRiel:T.distRiel[k], agua, cerca, frenteMin, frenteMax, radio:c.radio, otros:Object.entries(T.lugares).filter(([n,v])=>n!=='cueva'&&v&&Number.isFinite(v.x)).map(([n,v])=>({n,d:Math.hypot(v.x-c.x,v.z-c.z),r:v.radio||0})) };
 };
 return { uno:armar(), dos:armar() };
})();
`;
const fakeCtx=new Proxy({measureText(t){return {width:String(t).length*20}},createLinearGradient(){return {addColorStop:()=>{}}},createRadialGradient(){return {addColorStop:()=>{}}}},{get(t,p){if(p in t)return t[p]; return ()=>{};},set(t,p,v){t[p]=v;return true;}});
const context={console,Math,Float32Array,Uint8Array,Uint8ClampedArray,Uint16Array,Uint32Array,Int8Array,Int16Array,Int32Array,ArrayBuffer,DataView,Map,Set,WeakMap,WeakSet,Date,performance:{now:()=>0},document:{createElement(tag){if(tag==='canvas')return {width:1,height:1,getContext:()=>fakeCtx};return {};}}};
context.globalThis=context; vm.createContext(context); vm.runInContext(code,context,{timeout:120000});
const { uno: c, dos } = context.__OUT;
let n = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); n++; };

ok(c, 'el valle tiene su Cueva de las Manos');
ok(c.nombre === 'Cueva de las Manos', 'con su nombre');
// la zona más árida: la estepa, junto a los pastizales y las llanuras
ok(c.estepa >= 0.85, `en la estepa (aridez ${c.estepa.toFixed(2)})`);
ok(c.x > 150, `hacia el este, donde el bosque se abre (x=${c.x.toFixed(0)})`);
ok(c.pendiente <= 0.12, `en un llano (pendiente ${c.pendiente.toFixed(3)})`);
ok(!c.agua, 'sin agua alrededor');
ok(c.distRio >= 25 && c.distRiel >= 25, `lejos del arroyo y de la vía (${Math.round(c.distRio)} y ${Math.round(c.distRiel)} m)`);
// sin escalerilla: sólo el piso de adentro y el umbral, y el umbral a ras del suelo
ok(c.cerca.length === 2, `sólo dos pisos (el de adentro y el umbral), sin escalones: ${c.cerca.length}`);
ok(!c.cerca.some((p) => p.largo < 1), 'ningún peldaño chico');
const [uno, otro] = c.cerca.slice().sort((a, b) => a.alto - b.alto);
ok(otro.alto > 0.3 && otro.alto < 0.4, `el piso de adentro, a 0,34 m (${otro.alto.toFixed(2)})`);
ok(uno.alto >= 0.09 && uno.alto <= 0.34, `el umbral entre el suelo y el piso (${uno.alto.toFixed(2)} m)`);
ok(otro.alto - uno.alto <= 0.25, `del umbral al piso, un paso corto (${(otro.alto - uno.alto).toFixed(2)} m)`);
ok(uno.alto - c.frenteMin <= 0.5, `del suelo de adelante al umbral se sube caminando (${(uno.alto - c.frenteMin).toFixed(2)} m)`);
ok(c.frenteMax - c.frenteMin <= 0.7, 'el terreno de adelante es parejo');
// no pisa otros lugares del valle
for (const o of c.otros) ok(o.d > 9 + (o.r || 0) * 0.5, `no pisa «${o.n}» (${Math.round(o.d)} m)`);
// y es siempre el mismo sitio (el sorteo es determinista)
ok(Math.abs(c.x - dos.x) < 1e-9 && Math.abs(c.z - dos.z) < 1e-9 && Math.abs(c.rot - dos.rot) < 1e-12, 'siempre en el mismo lugar');
console.log(`OK 3.8.8 Cueva de las Manos · ${n} verificaciones · en la estepa (x ${c.x.toFixed(0)}, z ${c.z.toFixed(0)}), en un llano y sin escalones`);

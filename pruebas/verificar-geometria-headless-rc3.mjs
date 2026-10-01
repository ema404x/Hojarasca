import { fileURLToPath } from 'url';
import fs from 'fs';
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
code+=`\n;globalThis.__AUDIT_RESULT=(()=>{\n const T=__mod_terreno.generarTerreno(); globalThis.__AUDIT_T=T;\n const scene=new THREE.Scene();\n const obs=[], plats=[]; const col={ agregar:o=>obs.push({...o}), agregarPlataforma:p=>plats.push({...p}) };\n const veg={arboles:[], colisiones:[], despejar(){}}; const puertas={agregar(){},agregarPostigos(){},agregarCorrediza(){}};\n const est=__mod_estructuras.crearEstructuras(T,scene,col,veg,puertas);\n scene.updateMatrixWorld(true);\n const meshes=[]; scene.traverse(o=>{if(o.isMesh){const pos=o.geometry?.attributes?.position; let finite=true, maxAbs=0; if(pos){for(let i=0;i<pos.array.length;i++){const v=pos.array[i];if(!Number.isFinite(v)){finite=false;break;}maxAbs=Math.max(maxAbs,Math.abs(v));}} o.geometry.computeBoundingBox?.(); const bb=o.geometry.boundingBox; const wm=o.matrixWorld?.elements||[]; const matrixFinite=Array.from(wm).every(Number.isFinite); meshes.push({name:o.name||'', vertices:pos?pos.count:0, finite,matrixFinite,maxAbs, local:bb?{min:bb.min.toArray(),max:bb.max.toArray()}:null, worldPos:o.getWorldPosition?o.getWorldPosition(new THREE.Vector3()).toArray():null});}});\n const flotantes=[];
 const PASO_VOX=.42;
 function voxelizar(malla){const g=malla.geometry,pos=g?.attributes?.position;if(!pos)return new Set();const idx=g.index,celdas=new Set(),v=new THREE.Vector3(),cuenta=idx?idx.count:pos.count;const leer=(ii)=>{const k=idx?idx.getX(ii):ii;v.fromBufferAttribute(pos,k);malla.localToWorld(v);return v.clone();};for(let ii=0;ii<cuenta;ii+=3){const a=leer(ii),b=leer(ii+1),cc=leer(ii+2),lado=Math.max(a.distanceTo(b),b.distanceTo(cc),cc.distanceTo(a)),n=Math.min(10,Math.max(2,Math.ceil(lado/PASO_VOX)));for(let ss=0;ss<=n;ss++)for(let tt=0;tt+ss<=n;tt++){const u=ss/n,w=tt/n,zv=1-u-w,x=a.x*zv+b.x*u+cc.x*w,y=a.y*zv+b.y*u+cc.y*w,zz=a.z*zv+b.z*u+cc.z*w;celdas.add(Math.round(x/PASO_VOX)+','+Math.round(y/PASO_VOX)+','+Math.round(zz/PASO_VOX));}}return celdas;}
 function componentes(cs){const seen=new Set(),out=[];for(const c0 of cs){if(seen.has(c0))continue;const st=[c0],co=[];seen.add(c0);while(st.length){const c=st.pop();co.push(c);const [x,y,z]=c.split(',').map(Number);for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(let dz=-1;dz<=1;dz++){const k=(x+dx)+','+(y+dy)+','+(z+dz);if(cs.has(k)&&!seen.has(k)){seen.add(k);st.push(k);}}}out.push(co);}return out;}
 const meshObjs=[]; scene.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh)meshObjs.push(o);});
 for(const m of meshObjs.slice(0,50)){const cs=voxelizar(m);if(cs.size<80)continue;const cc=componentes(cs).sort((a,b)=>b.length-a.length);for(const comp of cc.slice(1)){if(comp.length<70)continue;let min=1e9,max=-1e9,sx=0,sz=0;for(const c of comp){const [x,y,z]=c.split(',').map(Number);min=Math.min(min,y*PASO_VOX);max=Math.max(max,y*PASO_VOX);sx+=x*PASO_VOX;sz+=z*PASO_VOX;}const x=sx/comp.length,z=sz/comp.length,sobre=min-T.altura(x,z);if(sobre>1.25)flotantes.push({celdas:comp.length,base:min,tope:max,sobre,x,z});}}
 const T2=__mod_terreno.generarTerreno(); const col2=__mod_colisiones.crearColisiones(); const scene2=new THREE.Scene();
 const est2=__mod_estructuras.crearEstructuras(T2,scene2,col2,veg,puertas);
 const gente2=__mod_gente.crearGente(T2,scene2,col2,{});
 scene2.updateMatrixWorld(true);
 const meshesFis=[]; scene2.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&o.geometry?.attributes?.position)meshesFis.push(o);});
 const rayFis=new THREE.Raycaster(), abajoFis=new THREE.Vector3(0,-1,0), plataformasSinVisual=[];
 function muestrasPlat(p){const out=[];if(p.radio!==undefined){const ri=p.radioInterior??0,rr=ri+(p.radio-ri)*0.58;for(let k=0;k<8;k++){const a=k/8*Math.PI*2;if(p.huecoMedio!==undefined&&rr>(p.huecoDesde??0)){const d=a-(p.huecoCentro??0),dif=Math.abs(Math.atan2(Math.sin(d),Math.cos(d)));if(dif<p.huecoMedio+0.08)continue;}out.push({x:p.x+Math.sin(a)*rr,z:p.z-Math.cos(a)*rr});}}else{const ca=Math.cos(p.ang||0),sa=Math.sin(p.ang||0),hx=(p.largo||.2)*.24,hz=(p.ancho||.2)*.24;for(const [lx,lz] of [[0,0],[hx,0],[-hx,0],[0,hz],[0,-hz]])out.push({x:p.x+lx*ca-lz*sa,z:p.z+lx*sa+lz*ca});}return out;}
 for(let i=0;i<col2.plataformas.length;i++){const p=col2.plataformas[i];let ok=false,best=Infinity;for(const q of muestrasPlat(p)){rayFis.set(new THREE.Vector3(q.x,p.alto+0.8,q.z),abajoFis);rayFis.far=1.8;const hits=rayFis.intersectObjects(meshesFis,false);for(const h of hits){const dif=Math.abs(h.point.y-p.alto);best=Math.min(best,dif);if(dif<0.28){ok=true;break;}}if(ok)break;}if(!ok)plataformasSinVisual.push({i,alto:p.alto,dif:Number.isFinite(best)?best:null});}
 const npcs=gente2.gente.map(n=>{ const p={x:n.pos.x,y:n.pos.y,z:n.pos.z}; let mov=0; if(!n.aBordo){const q=n.pos.clone(); col2.resolver(q,0.30,1.65); mov=Math.hypot(q.x-n.pos.x,q.z-n.pos.z);} const rutas=(n.ruta||[]).map((rp,idx)=>{const base=T2.altura(rp.x,rp.z);const pl=col2.plataformaBaja(rp.x,rp.z);const q=new THREE.Vector3(rp.x,Math.max(base,pl?.alto??-Infinity),rp.z);const antes=q.clone();col2.resolver(q,0.30,1.65);return {idx,mov:Math.hypot(q.x-antes.x,q.z-antes.z),x:rp.x,z:rp.z};}); return {clave:n.clave,x:p.x,y:p.y,z:p.z,mov,historias:n.historias?.length||0,ruta:n.ruta?.length||0,rutas}; });
 const lugares2=T2.lugares;
 const soundStub=new Proxy({}, {get:()=>()=>{}});
 const tren2=__mod_trochita.crearTrochita(T2,scene2,col2,soundStub,{cartel:()=>{},sentaderos:[]});
 const zonasObj=[
  {x:T2.lugares.refugio.x,z:T2.lugares.refugio.z,radio:9.5},
  ...['casa-te','molino','torre','faro','almacen','galpon','cueva'].map(k=>T2.lugares[k]).filter(Boolean).map(o=>({x:o.x,z:o.z,radio:o.radio||6})),
  ...est2.cabañas.map(o=>({x:o.x,z:o.z,radio:(o.radio||4)+1.5})),
  ...tren2.paradas.map(p=>({x:p.x,z:p.z,radio:p.chica?10:14})),
 ];
 const vegObj={arboles:[],plantas:[],calafates:[]}; const progObj={tomados:[],entradas:{}};
 const obj2=__mod_objetos.crearObjetos(T2,vegObj,{sentaderos:[]},scene2,progObj,zonasObj);
 const intrusos=obj2.items.filter(it=>zonasObj.some(z=>Math.hypot(it.x-z.x,it.z-z.z)<z.radio+1));
 const lugares=Object.fromEntries(Object.entries(T.lugares).filter(([,v])=>v&&typeof v==='object'&&Number.isFinite(v.x)&&Number.isFinite(v.z)).map(([k,v])=>[k,{x:v.x,z:v.z,y:v.y??T.altura(v.x,v.z),rot:v.rot??null,radio:v.radio??null}]));\n const shore=[]; const shoreOffsets={}; for(const off of [2,4,6,8,10,12,15]){const arr=[]; for(let i=0;i<2000;i++){const a=(i/2000)*Math.PI*2, rad=T.radioLago(a)+off, x=__mod_config.LAGO.x+Math.cos(a)*rad, z=__mod_config.LAGO.z+Math.sin(a)*rad, y=T.altura(x,z); if(T.agua(x,z))continue; const aro=[]; for(let k=0;k<8;k++){const aa=k/8*Math.PI*2;aro.push(T.altura(x+Math.cos(aa)*3.4,z+Math.sin(aa)*3.4));} arr.push({a,x,z,y,varia:Math.max(...aro)-Math.min(...aro),d:Math.hypot(x-T.lugares.muelle.x,z-T.lugares.muelle.z)});} arr.sort((a,b)=>a.varia-b.varia); shoreOffsets[off]=arr.slice(0,3); if(off===2)shore.push(...arr.slice(0,10));} return {meshes, obs, plats, lugares, est:{cabanas:est.cabañas.length, has:[!!est.faro,!!est.molino,!!est.casaTe,!!est.torre,!!est.galpon,!!est.almacen,!!est.cueva]}, shore:shore.slice(0,10), shoreOffsets, npcs, lugares2, objetos:{total:obj2.items.length,intrusos:intrusos.length,paradas:tren2.paradas.length,paradasInfo:tren2.paradas.map(p=>({x:p.x,z:p.z,chica:p.chica,nombre:p.nombre||'Estación'}))}, flotantes, plataformasSinVisual};\n})();`;
const noop=()=>{}; const fakeCtx=new Proxy({measureText(t){return {width:String(t).length*20}},createLinearGradient(){return {addColorStop:noop}},createRadialGradient(){return {addColorStop:noop}}},{get(t,p){if(p in t)return t[p]; return noop;},set(t,p,v){t[p]=v;return true;}}); const context={console,Math,Float32Array,Uint8Array,Uint8ClampedArray,Uint16Array,Uint32Array,Int8Array,Int16Array,Int32Array,ArrayBuffer,DataView,Map,Set,WeakMap,WeakSet,Date,performance:{now:()=>0},document:{createElement(tag){if(tag==='canvas')return {width:1,height:1,getContext:()=>fakeCtx};return {};}}}; context.globalThis=context; vm.createContext(context); vm.runInContext(code,context,{timeout:90000});  // freno anti-cuelgue: la auditoría tarda ~17 s, 20 s no daba margen
const r=context.__AUDIT_RESULT;
const fallar=(msg)=>{ console.error('ERROR geometría headless RC3 · '+msg); process.exit(1); };
// El piso de mallas bajó de 90 a 55 en la 1.9.1: las mallas que no se mueven y
// comparten material ahora se fusionan (`src/fusion.js`), así que hay menos objetos
// para la misma construcción. Lo que importa no es cuántos objetos son sino cuánta
// geometría hay, y eso se mide abajo: la fusión no puede perder ni un vértice.
if (r.meshes.length < 55) fallar(`demasiado pocas mallas estructurales (${r.meshes.length})`);
const verticesTotales = r.meshes.reduce((s, m) => s + (m.vertices || 0), 0);
if (process.env.HOJARASCA_VERBOSO) console.log('vértices estructurales:', verticesTotales);
// Son 229.444 con todo armado: un piso de 200.000 deja margen para tocar una
// estructura y salta enseguida si la fusión empieza a comerse geometría.
if (verticesTotales < 200000) fallar(`las estructuras perdieron geometría: ${verticesTotales} vértices`);
if (r.obs.length < 700) fallar(`demasiadas pocas colisiones (${r.obs.length})`);
if (r.plats.length < 150) fallar(`demasiadas pocas plataformas (${r.plats.length})`);
for (const [i,m] of r.meshes.entries()) {
  if (!m.finite || !m.matrixFinite) fallar(`malla ${i} contiene NaN/Infinity`);
  if (m.maxAbs > 120) fallar(`malla ${i} tiene coordenadas locales absurdas (${m.maxAbs})`);
}
for (const [i,o] of r.obs.entries()) {
  if (Object.values(o).some(v=>typeof v==='number'&&!Number.isFinite(v))) fallar(`obstáculo ${i} contiene NaN/Infinity`);
  if (o.alturaMin===undefined || o.alturaMax===undefined) fallar(`obstáculo ${i} sin volumen vertical acotado`);
}
for (const [i,p] of r.plats.entries()) {
  if (Object.values(p).some(v=>typeof v==='number'&&!Number.isFinite(v))) fallar(`plataforma ${i} contiene NaN/Infinity`);
  if (!(p.alto > -50 && p.alto < 150)) fallar(`plataforma ${i} con altura absurda ${p.alto}`);
}
const requeridos=['cabana','puesto','molino','casa-te','torre','faro','almacen','galpon','cueva'];
for (const k of requeridos) if (!r.lugares[k]) fallar(`no se generó la estructura obligatoria ${k}`);
if (r.est.cabanas !== 3) fallar(`se esperaban 3 construcciones en cabañas/casa de té y hay ${r.est.cabanas}`);
if (!r.est.has.every(Boolean)) fallar(`faltó una estructura dinámica: ${JSON.stringify(r.est.has)}`);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
if (dist(r.lugares.almacen,r.lugares.galpon) < 55) fallar('almacén y galpón vuelven a superponer sus complejos');
// El faro debe apoyar su base por encima del terreno de su huella; el zócalo
// se extiende hacia abajo para absorber la ladera.
{
  const f=r.lugares.faro; let max=-Infinity;
  for(let k=0;k<16;k++){const a=k/16*Math.PI*2; max=Math.max(max,context.__AUDIT_T.altura(f.x+Math.cos(a)*3.55,f.z+Math.sin(a)*3.55));}
  if (f.y < max-0.02) fallar(`la base del faro corta el terreno (${f.y.toFixed(2)} < ${max.toFixed(2)})`);
}
// Fachadas principales del almacén y galpón están en -Z local. Deben mirar
// hacia el punto más cercano del sendero, no darle la espalda.
const dotFrenteSendero=(o,signo)=>{
  let q=null,dm=Infinity; for(const p of context.__AUDIT_T.sendero){const d=Math.hypot(p.x-o.x,p.z-o.z);if(d<dm){dm=d;q=p;}}
  const vx=(q.x-o.x)/(dm||1), vz=(q.z-o.z)/(dm||1);
  const fx=Math.sin(o.rot)*signo, fz=Math.cos(o.rot)*signo;
  return fx*vx+fz*vz;
};
if (dotFrenteSendero(r.lugares.almacen,-1)<0.75) fallar('la fachada del almacén no mira al sendero');
if (dotFrenteSendero(r.lugares.galpon,-1)<0.75) fallar('el portón del galpón no mira al sendero');
if (r.npcs.length !== 5) fallar(`se esperaban 5 personajes (incluida Ercilia) y hay ${r.npcs.length}`);
for (const n of r.npcs) {
  if (![n.x,n.y,n.z,n.mov].every(Number.isFinite)) fallar(`NPC ${n.clave} tiene posición inválida`);
  if (!n.clave || n.clave === 'guarda') continue;
  if (n.mov > 0.08) fallar(`NPC ${n.clave} aparece dentro de una colisión (corrección ${n.mov.toFixed(2)} m)`);
}
for (const n of r.npcs) for (const rp of n.rutas||[]) {
  if (rp.mov > 0.10) fallar(`ruta ${rp.idx} de ${n.clave} cae dentro de una colisión (${rp.mov.toFixed(2)} m)`);
}
const ercilia=r.npcs.find(n=>n.clave==='ercilia');
if (!ercilia || ercilia.historias < 2 || ercilia.ruta < 3) fallar('Ercilia no quedó integrada como NPC completo');
{ const a=r.lugares2.almacen; const d=Math.hypot(ercilia.x-a.x,ercilia.z-a.z); if(d>4.5) fallar(`Ercilia quedó fuera de su almacén (${d.toFixed(1)} m)`); }
if (r.objetos.paradas < 2) fallar(`La Trochita generó muy pocas paradas (${r.objetos.paradas})`);
if (r.objetos.total < 20) fallar(`el poblador de objetos generó muy poco contenido (${r.objetos.total})`);
if (r.objetos.intrusos !== 0) fallar(`${r.objetos.intrusos} coleccionables quedaron dentro de arquitectura/estaciones`);
if (r.flotantes.length) fallar(`${r.flotantes.length} componentes estructurales grandes quedaron flotando/desconectados`);
if (r.plataformasSinVisual.length) fallar(`${r.plataformasSinVisual.length} plataformas físicas no tienen superficie visual correspondiente`);

// Ningún complejo habitable puede invadir la huella de otro. Los radios son el
// volumen de uso exterior, no sólo la caja del edificio: incluyen galerías,
// escaleras, cobertizos y corrales. Un pequeño margen mantiene circulación visual.
const radios = {
  refugio:14, muelle:11, mirador:10, cabana:r.lugares.cabana?.radio||6,
  puesto:r.lugares.puesto?.radio||6, molino:7.5, 'casa-te':r.lugares['casa-te']?.radio||7,
  torre:r.lugares.torre?.radio||10, faro:r.lugares.faro?.radio||6.2,
  almacen:r.lugares.almacen?.radio||9, galpon:r.lugares.galpon?.radio||24, cueva:9,
};
const clavesHuella=Object.keys(radios).filter(k=>r.lugares[k]);
for(let i=0;i<clavesHuella.length;i++) for(let j=i+1;j<clavesHuella.length;j++){
  const a=clavesHuella[i], b=clavesHuella[j];
  // muelle y refugio son un conjunto diseñado deliberadamente; no se les exige
  // el mismo margen que a dos edificios independientes.
  if ((a==='refugio'&&b==='muelle')||(a==='muelle'&&b==='refugio')) continue;
  const d=dist(r.lugares[a],r.lugares[b]);
  const minimo=radios[a]+radios[b]+2.5;
  if(d<minimo) fallar(`${a} y ${b} invaden sus huellas (${d.toFixed(1)} m < ${minimo.toFixed(1)} m)`);
}
for(const k of clavesHuella){
  const l=r.lugares[k]; if(!l)continue;
  for(const p of r.objetos.paradasInfo||[]){
    const rp=p.chica?10:14, d=dist(l,p), minimo=radios[k]+rp+3;
    if(d<minimo) fallar(`${k} invade ${p.nombre} (${d.toFixed(1)} m < ${minimo.toFixed(1)} m)`);
  }
}
console.log(`OK geometría headless RC3 · ${r.meshes.length} mallas · ${r.obs.length} obstáculos · ${r.plats.length} plataformas · huellas/flotantes/física visual verificadas`);

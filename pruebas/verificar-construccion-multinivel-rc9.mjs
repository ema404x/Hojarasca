import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import assert from 'node:assert/strict';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
const root = path.join(src, 'construccion.js');
const idModulo = (archivo) => '__mod_' + path.basename(archivo, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);
const info = new Map(), orden = [], visiting = new Set(), visited = new Set();
function analizar(archivo) {
  const texto = fs.readFileSync(archivo, 'utf8'); const deps = [];
  const re = /^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm; let m;
  while ((m = re.exec(texto))) {
    if (m[2] === 'three') continue;
    if (!m[2].startsWith('.')) throw Error('external ' + m[2]);
    deps.push(normalizar(archivo, m[2]));
  }
  return { texto, deps };
}
function visitar(archivo) {
  archivo = path.resolve(archivo); if (visited.has(archivo)) return;
  if (visiting.has(archivo)) throw Error('cycle'); visiting.add(archivo);
  const a = analizar(archivo); info.set(archivo, a); for (const d of a.deps) visitar(d);
  visiting.delete(archivo); visited.add(archivo); orden.push(archivo);
}
visitar(root);
function transformar(archivo, texto) {
  const ex = [];
  for (const m of texto.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)) ex.push(m[1]);
  texto = texto.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
  texto = texto.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_t,nombres,spec) => {
    const dep = normalizar(archivo, spec);
    const partes = nombres.split(',').map(x=>x.trim()).filter(Boolean).map(x=>{const [a,b]=x.split(/\s+as\s+/);return b?`${a.trim()}: ${b.trim()}`:a.trim();});
    return `const { ${partes.join(', ')} } = ${idModulo(dep)};`;
  });
  texto = texto.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
  texto = texto.replace(/^export\s*\{[^}]+\}\s*;?\s*$/gm, '');
  return `const ${idModulo(archivo)}=(()=>{\n${texto}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
}
let code = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8') + '\n';
for (const f of orden) code += transformar(f, info.get(f).texto) + '\n';
code += `\n;globalThis.__RC9=(()=>{\n
  const C=__mod_construccion;
  const obs=[], plats=[];
  const col={
    agregar:o=>obs.push(o),
    agregarPlataforma:p=>{p.cos=Math.cos(p.ang||0);p.sin=Math.sin(p.ang||0);plats.push(p);},
    eliminarPorDuenio(owner){for(let i=obs.length-1;i>=0;i--)if(obs[i].duenio===owner)obs.splice(i,1);for(let i=plats.length-1;i>=0;i--)if(plats[i].duenio===owner)plats.splice(i,1);},
    plataformaEn(x,z,yPies,subida=0.62){
      let mejor=null;
      for(const p of plats){
        const dx=x-p.x,dz=z-p.z,lx=dx*p.cos+dz*p.sin,lz=-dx*p.sin+dz*p.cos;
        if(Math.abs(lx)>p.largo/2||Math.abs(lz)>p.ancho/2) continue;
        const paso=Math.min(p.escalonMax??0.62,subida??0.62);
        if(p.alto<=yPies+paso+0.01 && (!mejor||p.alto>mejor.alto)) mejor=p;
      }
      return mejor;
    }
  };
  const T={altura:()=>0,agua:()=>false,normal:()=>new THREE.Vector3(0,1,0),indice:()=>0,distRiel:[999],distSendero:[999],lugares:{}};
  const veg={arboles:[],despejar(){}}; const scene=new THREE.Scene();
  const s=C.crearConstruccion(T,scene,col,veg,null), mats={tronco:999,tabla:999,piedra:999,lana:999};
  const terminar=(id,x,z,yaw=0)=>{
    s.elegir(C.PLANO[id]); const estado=s.moverFantasma(x,z,yaw); const f=s.fundar(x,z,yaw);
    if(!f.ok) return {estado,f,o:null};
    const o=f.obra||s.obraCerca({x:f.datos.x,z:f.datos.z},4,id); if(!o) throw Error('obra '+id+' no encontrada');
    while(o.datos.etapas<o.plano.etapas.length){const r=s.avanzar(o,mats);if(!r.ok)throw Error('avanzar '+id+': '+r.motivo);}
    return {o,estado,f};
  };

  // Torre A: el entrepiso debe fallar sin estructura vertical y habilitarse con dos paredes opuestas.
  const baseA=terminar('piso-modular',40,0,0);
  s.elegir(C.PLANO['entrepiso-modular']); const altoSinSoporte=s.fundar(40.15,0.1,0);
  const paredN=terminar('pared-modular',40,-1.12,0);
  const paredS=terminar('pared-modular',40,1.12,0);
  const altoA=terminar('entrepiso-modular',40.18,0.12,Math.PI/4);
  const altoAPlats=altoA.o?plats.filter(p=>p.duenio===altoA.o).length:0;
  // La misma arquitectura debe seguir funcionando en el siguiente nivel; el snap
  // vertical elige la plataforma modular más alta cuando X/Z son idénticos.
  const paredN2=terminar('pared-modular',40,-1.12,0);
  const paredS2=terminar('pared-modular',40,1.12,0);
  const altoA2=terminar('entrepiso-modular',40.12,0.08,0);

  // Un soporte que vuelve inválida la estructura no puede desmontarse.
  s.elegir(C.PLANO['pared-modular']);
  const desmontarSoporte=s.desmontarCerca({x:paredN.o.datos.x,y:paredN.o.datos.y,z:paredN.o.datos.z},0.8);

  // Torre B: entrepiso con hueco + escalera de nivel. El hueco usa tres plataformas, no una losa invisible completa.
  const baseB=terminar('piso-modular',50,0,0);
  const bN=terminar('pared-modular',48.88,0,Math.PI/2);
  const bS=terminar('pared-modular',51.12,0,Math.PI/2);
  const hueco=terminar('entrepiso-escalera',50.10,0.08,0);
  const huecoFis=hueco.o?plats.filter(p=>p.duenio===hueco.o):[];
  const huecoPlats=huecoFis.length;
  const contiene=(p,x,z)=>{const dx=x-p.x,dz=z-p.z,lx=dx*p.cos+dz*p.sin,lz=-dx*p.sin+dz*p.cos;return Math.abs(lx)<=p.largo/2&&Math.abs(lz)<=p.ancho/2;};
  const huecoCentroTapado=huecoFis.some(p=>contiene(p,50,0.80));
  const huecoBordeSoportado=huecoFis.some(p=>contiene(p,49.0,0.80));
  const escalera=terminar('escalera-nivel',50.05,0.05,Math.PI/4);
  const escaleraFis=escalera.o?plats.filter(p=>p.duenio===escalera.o):[];
  const escaleraPlats=escaleraFis.length;
  const escaleraAlturas=escaleraFis.map(p=>p.alto).sort((a,b)=>a-b);

  // Torre C: cuatro pilares de esquina también son una solución estructural válida.
  const baseC=terminar('piso-modular',60,0,0);
  const pilares=[];
  for(const [x,z] of [[58.65,-1.35],[61.35,-1.35],[58.65,1.35],[61.35,1.35]]) pilares.push(terminar('pilar-esquina',x,z,0));
  const altoPilares=terminar('entrepiso-modular',60.08,0.06,0);
  const pilarObs=pilares.reduce((n,p)=>n+(p.o?obs.filter(o=>o.duenio===p.o).length:0),0);

  // La escalera de nivel no se puede fundar libremente sin un hueco compatible.
  s.elegir(C.PLANO['escalera-nivel']); const escaleraLibre=s.fundar(70,0,0);

  return {ids:C.PLANOS.map(p=>p.id),total:C.PLANOS.length,baseA,altoSinSoporte,paredN,paredS,altoA,altoAPlats,paredN2,paredS2,altoA2,desmontarSoporte,
    baseB,bN,bS,hueco,huecoPlats,huecoCentroTapado,huecoBordeSoportado,escalera,escaleraPlats,escaleraAlturas,baseC,pilares,altoPilares,pilarObs,escaleraLibre};
})();`;

const context={console,Math,Float32Array,Uint8Array,Uint8ClampedArray,Uint16Array,Uint32Array,Int8Array,Int16Array,Int32Array,ArrayBuffer,DataView,Map,Set,WeakMap,WeakSet,Date,performance:{now:()=>0}};
context.globalThis=context; vm.createContext(context); vm.runInContext(code,context,{timeout:20000});
const r=context.__RC9;
for(const id of ['pilar-esquina','entrepiso-modular','entrepiso-escalera','escalera-nivel']) assert.ok(r.ids.includes(id),`falta ${id}`);
assert.ok(r.total>=25,`catálogo RC9 insuficiente (${r.total})`);
assert.equal(r.baseA.f.ok,true,'no se construyó base A');
assert.equal(r.altoSinSoporte.ok,false,'el entrepiso flotante fue aceptado sin soporte vertical');
assert.match(r.altoSinSoporte.motivo,/paredes opuestas|pilares/,'el rechazo estructural no explica el soporte requerido');
assert.equal(r.paredN.f.ok,true,'no se construyó pared norte');
assert.equal(r.paredS.f.ok,true,'no se construyó pared sur');
assert.equal(r.altoA.f.ok,true,'paredes opuestas no habilitaron entrepiso');
assert.ok(r.altoA.estado.snap?.activo && /entrepiso/.test(r.altoA.estado.snap.descripcion),'entrepiso no centró por snap');
assert.ok(r.altoA.f.datos.y>2.4,'entrepiso no quedó en el nivel superior');
assert.equal(r.altoAPlats,1,'entrepiso completo no registró una plataforma única');
assert.equal(r.paredN2.f.ok,true,'no se pudo construir pared sobre el primer entrepiso');
assert.equal(r.paredS2.f.ok,true,'no se pudo construir pared opuesta sobre el primer entrepiso');
assert.ok(r.paredN2.f.datos.y>2.7 && r.paredS2.f.datos.y>2.7,'las paredes del nivel 2 se pegaron al piso inferior');
assert.equal(r.altoA2.f.ok,true,'el snap multinivel no permitió un tercer piso estructural');
assert.ok(r.altoA2.f.datos.y>5.0,'el tercer piso no quedó en la cota apilada correcta');
assert.equal(r.desmontarSoporte.ok,false,'se pudo desmontar un soporte crítico del entrepiso');
assert.match(r.desmontarSoporte.motivo,/encima|apoyada|pieza/,'bloqueo de soporte sin explicación útil');
assert.equal(r.hueco.f.ok,true,'no se construyó entrepiso con hueco');
assert.equal(r.huecoPlats,3,'el hueco de escalera no coincide con tres plataformas físicas');
assert.equal(r.huecoCentroTapado,false,'el hueco visible sigue tapado por una plataforma física invisible');
assert.equal(r.huecoBordeSoportado,true,'el borde del entrepiso perdió soporte físico alrededor del hueco');
assert.equal(r.escalera.f.ok,true,'no se construyó escalera de nivel');
assert.ok(r.escalera.estado.snap?.activo && /hueco/.test(r.escalera.estado.snap.descripcion),'escalera de nivel no encastró con el hueco');
assert.ok(r.escalera.f.datos.y<r.hueco.f.datos.y-2.0,'escalera de nivel nació en la cota superior en vez del piso inferior');
assert.equal(r.escaleraPlats,11,'escalera de nivel no registró once peldaños físicos');
for(let i=1;i<r.escaleraAlturas.length;i++) assert.ok(r.escaleraAlturas[i]>r.escaleraAlturas[i-1] && r.escaleraAlturas[i]-r.escaleraAlturas[i-1]<0.26,'peldaños con salto vertical inválido');
assert.ok(r.pilares.every(p=>p.f.ok),'algún pilar de esquina no pudo construirse');
assert.ok(r.pilarObs>=4,'los pilares no registraron física individual');
assert.equal(r.altoPilares.f.ok,true,'cuatro pilares no habilitaron el entrepiso');
assert.equal(r.escaleraLibre.ok,false,'la escalera de nivel puede fundarse sin hueco compatible');
assert.match(r.escaleraLibre.motivo,/piso construido|hueco/,'escalera libre no explica el soporte requerido');

const main=fs.readFileSync(path.join(src,'main.js'),'utf8');
const html=fs.readFileSync(path.join(src,'plantilla.html'),'utf8');
assert.match(main,/const PLANOS_POR_PAGINA = 8/,'catálogo creciente no tiene paginación');
assert.match(main,/const nueva = r\.obra \|\| obras\.obraCerca/,'fundar pieza no conserva referencia exacta para niveles apilados');
assert.match(main,/case 'BracketLeft':[\s\S]*cambiarPaginaObra\(-1\)/,'falta atajo de página anterior');
assert.match(main,/case 'BracketRight':[\s\S]*cambiarPaginaObra\(1\)/,'falta atajo de página siguiente');
assert.match(html,/\[ \] cambia página/,'la ayuda de construcción no documenta la paginación');
console.log(`OK Multi-Level RC9 · ${r.total} planos · soporte estructural · apilado de 3 niveles · hueco real · 11 peldaños · dependencias seguras · paginación 8 por vista`);

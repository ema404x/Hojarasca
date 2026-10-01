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
code += `\n;globalThis.__RC10=(()=>{\n
  const C=__mod_construccion;
  const obs=[], plats=[], postigos=[];
  const col={
    agregar:o=>obs.push(o),
    agregarPlataforma:p=>{p.cos=Math.cos(p.ang||0);p.sin=Math.sin(p.ang||0);plats.push(p);},
    eliminarPorDuenio(owner){for(let i=obs.length-1;i>=0;i--)if(obs[i].duenio===owner)obs.splice(i,1);for(let i=plats.length-1;i>=0;i--)if(plats[i].duenio===owner)plats.splice(i,1);},
  };
  const interacciones={
    agregar(){}, agregarPostigos:x=>postigos.push(x),
    eliminarPorDuenio(owner){for(let i=postigos.length-1;i>=0;i--)if(postigos[i].duenio===owner)postigos.splice(i,1);}
  };
  const T={altura:()=>0,agua:()=>false,normal:()=>new THREE.Vector3(0,1,0),indice:()=>0,distRiel:[999],distSendero:[999],lugares:{}};
  const veg={arboles:[],despejar(){}}; const scene=new THREE.Scene();
  const s=C.crearConstruccion(T,scene,col,veg,interacciones), mats={tronco:999,tabla:999,piedra:999,lana:999};
  const terminar=(id,x,z,yaw=0)=>{
    s.elegir(C.PLANO[id]); const estado=s.moverFantasma(x,z,yaw); const f=s.fundar(x,z,yaw);
    if(!f.ok) return {estado,f,o:null};
    const o=f.obra||s.obraCerca({x:f.datos.x,z:f.datos.z},4,id); if(!o) throw Error('obra '+id+' no encontrada');
    while(o.datos.etapas<o.plano.etapas.length){const r=s.avanzar(o,mats);if(!r.ok)throw Error('avanzar '+id+': '+r.motivo);}
    return {o,estado,f};
  };

  // Módulo habitable real: cuatro cierres + acceso + ventana + cubierta.
  const base=terminar('piso-modular',100,0,0);
  const puerta=terminar('pared-puerta',100,-1.12,0);
  const ventanal=terminar('pared-ventana-ancha',100,1.12,0);
  const este=terminar('pared-modular',101.12,0,Math.PI/2);
  const oeste=terminar('pared-modular',98.88,0,Math.PI/2);
  const sinTecho=s.estadoModulo(base.o);
  const mono=terminar('techo-una-agua',100.12,0.08,Math.PI/4);
  const habitacion=s.estadoModulo(base.o);
  const dentro=s.dentro({x:100,y:1.2,z:0});
  s.elegir(C.PLANO['pared-modular']);
  const editar=s.iniciarEdicionCerca({x:oeste.o.datos.x,y:oeste.o.datos.y,z:oeste.o.datos.z},0.8);
  const duranteEdicion=s.estadoModulo(base.o);
  const cancelarEdicion=s.cancelarEdicion();
  const restaurada=s.estadoModulo(base.o);

  // Un marco abierto da acceso y estructura, pero no finge ser cerramiento climático.
  const baseMarco=terminar('piso-modular',110,0,0);
  terminar('pared-marco',110,-1.12,0);
  terminar('pared-modular',110,1.12,0);
  terminar('pared-modular',111.12,0,Math.PI/2);
  terminar('pared-modular',108.88,0,Math.PI/2);
  terminar('techo-modular',110.08,0.05,0);
  const estadoMarco=s.estadoModulo(baseMarco.o);

  // Cuatro medias paredes nunca deben pasar por soportes estructurales de un entrepiso.
  const baseMedia=terminar('piso-modular',120,0,0);
  terminar('pared-media',120,-1.12,0);
  terminar('pared-media',120,1.12,0);
  terminar('pared-media',121.12,0,Math.PI/2);
  terminar('pared-media',118.88,0,Math.PI/2);
  s.elegir(C.PLANO['entrepiso-modular']); const entreSobreMedia=s.fundar(120.1,0.08,0);

  // La cubierta plana registra una plataforma real y el diagnóstico sabe que es transitable.
  const basePlana=terminar('piso-modular',130,0,0);
  const plana=terminar('techo-plano',130.10,0.06,0);
  const estadoPlana=s.estadoModulo(basePlana.o);
  const plataformasPlana=plana.o?plats.filter(p=>p.duenio===plana.o):[];

  return {ids:C.PLANOS.map(p=>p.id), total:C.PLANOS.length, base,puerta,ventanal,este,oeste,sinTecho,mono,habitacion,dentro,editar,duranteEdicion,cancelarEdicion,restaurada,
    baseMarco,estadoMarco,baseMedia,entreSobreMedia,basePlana,plana,estadoPlana,plataformasPlana,postigos};
})();`;

const context={console,Math,Float32Array,Uint8Array,Uint8ClampedArray,Uint16Array,Uint32Array,Int8Array,Int16Array,Int32Array,ArrayBuffer,DataView,Map,Set,WeakMap,WeakSet,Date,performance:{now:()=>0}};
context.globalThis=context; vm.createContext(context); vm.runInContext(code,context,{timeout:20000});
const r=context.__RC10;
for(const id of ['pared-marco','pared-media','pared-ventana-ancha','techo-una-agua','techo-plano']) assert.ok(r.ids.includes(id),`falta ${id}`);
assert.ok(r.total>=30,`catálogo RC10 insuficiente (${r.total})`);
assert.equal(r.sinTecho.paredes,4,'cuatro cierres terminados no fueron reconocidos');
assert.equal(r.sinTecho.accesos,1,'la puerta no fue reconocida como acceso');
assert.equal(r.sinTecho.ventanas,1,'el ventanal no fue reconocido como ventana');
assert.equal(r.sinTecho.habitable,false,'un módulo sin techo fue marcado como habitable');
assert.match(r.sinTecho.etiqueta,/sin techo/,'el diagnóstico sin cubierta no es explícito');
assert.equal(r.mono.f.ok,true,'no se pudo construir techo a una agua');
assert.equal(r.habitacion.paredes,4,'la habitación perdió paredes tras colocar cubierta');
assert.equal(r.habitacion.cubierta.id,'techo-una-agua','la cubierta semántica no corresponde al techo construido');
assert.equal(r.habitacion.habitable,true,'cuatro cierres + puerta + techo no forman habitación habitable');
assert.ok(r.dentro && r.dentro.datos===r.base.o.datos,'dentro() no reconoce la habitación modular cerrada');
assert.equal(r.editar.ok,true,'no se pudo iniciar edición de una pared del módulo');
assert.equal(r.duranteEdicion.paredes,3,'la pared en edición siguió contando como cerramiento activo');
assert.equal(r.duranteEdicion.habitable,false,'el módulo siguió habitable mientras faltaba una pared en edición');
assert.equal(r.cancelarEdicion.ok,true,'no se pudo cancelar la edición');
assert.equal(r.restaurada.paredes,4,'cancelar edición no restauró el diagnóstico de cerramiento');
assert.equal(r.restaurada.habitable,true,'cancelar edición no restauró la habitación habitable');
assert.equal(r.estadoMarco.paredes,3,'el marco abierto fue contado incorrectamente como pared cerrada');
assert.equal(r.estadoMarco.accesos,1,'el marco abierto no se registró como acceso');
assert.equal(r.estadoMarco.habitable,false,'una galería abierta fue marcada como habitación cerrada');
assert.equal(r.estadoMarco.protegido,true,'tres cierres + cubierta deberían ser espacio protegido');
assert.equal(r.entreSobreMedia.ok,false,'medias paredes sostuvieron ilegalmente un entrepiso');
assert.match(r.entreSobreMedia.motivo,/paredes opuestas|pilares/,'rechazo estructural de medias paredes sin explicación útil');
assert.equal(r.plana.f.ok,true,'no se construyó cubierta plana');
assert.equal(r.estadoPlana.cubierta.id,'techo-plano','la cubierta plana no fue detectada');
assert.equal(r.estadoPlana.cubierta.transitable,true,'cubierta plana no marcada como transitable');
assert.equal(r.plataformasPlana.length,1,'cubierta plana no registró exactamente una plataforma física');
assert.ok(r.postigos.some(p=>/ventanal/.test(p.nombre)),'el ventanal no registró postigos funcionales');

const main=fs.readFileSync(path.join(src,'main.js'),'utf8');
const html=fs.readFileSync(path.join(src,'plantilla.html'),'utf8');
assert.match(main,/estadoModuloCerca/,'la UI no consulta el estado semántico del módulo');
assert.match(main,/Módulo cercano/,'la UI no comunica el diagnóstico del módulo');
assert.match(html,/id="obra-modulo"/,'falta panel de diagnóstico modular');
console.log(`OK Ultra Premium RC10 · ${r.total} planos · habitación semántica · refugio modular · 5 piezas nuevas · cubierta transitable · soporte estructural estricto`);

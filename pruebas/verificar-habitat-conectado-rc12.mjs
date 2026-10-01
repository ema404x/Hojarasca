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
code += `\n;globalThis.__RC12=(()=>{\n
  const C=__mod_construccion;
  const obs=[], plats=[], lista=[];
  const col={
    agregar:o=>obs.push(o),
    agregarPlataforma:p=>{p.cos=Math.cos(p.ang||0);p.sin=Math.sin(p.ang||0);plats.push(p);},
    eliminarPorDuenio(owner){for(let i=obs.length-1;i>=0;i--)if(obs[i].duenio===owner)obs.splice(i,1);for(let i=plats.length-1;i>=0;i--)if(plats[i].duenio===owner)plats.splice(i,1);},
    plataformaEn(x,z,yPies,subida=0.62){let mejor=null;for(const p of plats){const dx=x-p.x,dz=z-p.z,lx=dx*p.cos+dz*p.sin,lz=-dx*p.sin+dz*p.cos;if(Math.abs(lx)>p.largo/2||Math.abs(lz)>p.ancho/2)continue;const paso=Math.min(p.escalonMax??0.62,subida??0.62);if(p.alto<=yPies+paso+0.01&&(!mejor||p.alto>mejor.alto))mejor=p;}return mejor;},
  };
  const interacciones={
    lista,
    agregar(x){const p={...x,abierta:0,objetivo:0,postigo:false};lista.push(p);return p;},
    agregarPostigos(x){const p={...x,abierta:0,objetivo:0,postigo:true};lista.push(p);return p;},
    eliminarPorDuenio(owner){for(let i=lista.length-1;i>=0;i--)if(lista[i].duenio===owner)lista.splice(i,1);},
    aperturaPorDuenio(owner){const p=lista.find(x=>x.duenio===owner&&!x.postigo);return p?{abierta:p.abierta||0,objetivo:p.objetivo||0,puerta:p}:null;},
  };
  const T={altura:()=>0,agua:()=>false,normal:()=>new THREE.Vector3(0,1,0),indice:()=>0,distRiel:[999],distSendero:[999],lugares:{}};
  const veg={arboles:[],despejar(){}}; const scene=new THREE.Scene();
  const s=C.crearConstruccion(T,scene,col,veg,interacciones), mats={tronco:999,tabla:999,piedra:999,lana:999};
  const terminar=(id,x,z,yaw=0,yRef=0.3)=>{
    s.elegir(C.PLANO[id]); const estado=s.moverFantasma(x,z,yaw,yRef); const f=s.fundar(x,z,yaw,yRef);
    if(!f.ok) return {estado,f,o:null};
    const o=f.obra||s.obraCerca({x:f.datos.x,z:f.datos.z},4,id); if(!o) throw Error('obra '+id+' no encontrada');
    while(o.datos.etapas<o.plano.etapas.length){const r=s.avanzar(o,mats);if(!r.ok)throw Error('avanzar '+id+': '+r.motivo);}
    return {o,estado,f};
  };
  const cerrarExterior=(cx,cz,ladoCompartido,puertaNorte=true)=>{
    if(ladoCompartido!=='n') terminar(puertaNorte?'pared-puerta':'pared-modular',cx,cz-1.12,0);
    if(ladoCompartido!=='s') terminar('pared-modular',cx,cz+1.12,0);
    if(ladoCompartido!=='o') terminar('pared-modular',cx-1.12,cz,Math.PI/2);
    if(ladoCompartido!=='e') terminar('pared-modular',cx+1.12,cz,Math.PI/2);
  };

  // Casa abierta 6x3: dos módulos cubiertos sin muro en el borde compartido.
  const a=terminar('piso-modular',300,0,0);
  const b=terminar('piso-modular',303.1,0,0);
  cerrarExterior(a.o.datos.x,a.o.datos.z,'e',true);
  cerrarExterior(b.o.datos.x,b.o.datos.z,'o',false);
  terminar('techo-modular',a.o.datos.x,a.o.datos.z,0);
  terminar('techo-modular',b.o.datos.x,b.o.datos.z,0);
  const farol=terminar('farol-interior',a.o.datos.x+0.55,a.o.datos.z+0.45,0);
  const estufa=terminar('estufa-hierro',a.o.datos.x-0.55,a.o.datos.z+0.45,0);
  const alfombra=terminar('alfombra-lana',b.o.datos.x,b.o.datos.z+0.15,0);
  const estadoA=s.estadoModulo(a.o), estadoB=s.estadoModulo(b.o);
  const habitatB=s.estadoHabitat({x:b.o.datos.x,y:1,z:b.o.datos.z},{fuego:{x:estufa.o.datos.x,y:1,z:estufa.o.datos.z}});
  const redAbierta=s.redInterior(a.o);

  // Dos módulos unidos por puerta interior. Cerrada transmite poco calor y no luz;
  // abierta convierte ambos espacios en una zona interior comunicada.
  const c=terminar('piso-modular',320,0,0);
  const d=terminar('piso-modular',323.1,0,0);
  cerrarExterior(c.o.datos.x,c.o.datos.z,'e',true);
  cerrarExterior(d.o.datos.x,d.o.datos.z,'o',false);
  const tabique=terminar('tabique-puerta',(c.o.datos.x+d.o.datos.x)/2,0,Math.PI/2);
  terminar('techo-plano',c.o.datos.x,c.o.datos.z,0);
  terminar('techo-plano',d.o.datos.x,d.o.datos.z,0);
  const farol2=terminar('farol-interior',c.o.datos.x+0.35,c.o.datos.z+0.35,0,0.3);
  const estufa2=terminar('estufa-hierro',c.o.datos.x-0.45,c.o.datos.z+0.35,0,0.3);
  const sillaTecho=terminar('silla-campo',d.o.datos.x+0.45,d.o.datos.z+0.35,0,2.55);
  const fuego2={x:estufa2.o.datos.x,y:1,z:estufa2.o.datos.z};
  const cerrado=s.estadoHabitat({x:d.o.datos.x,y:1,z:d.o.datos.z},{fuego:fuego2});
  const pInterior=lista.find(x=>x.duenio===tabique.o&&!x.postigo);
  if(pInterior){pInterior.abierta=1;pInterior.objetivo=1;}
  const abierto=s.estadoHabitat({x:d.o.datos.x,y:1,z:d.o.datos.z},{fuego:fuego2});

  return {ids:C.PLANOS.map(p=>p.id),total:C.PLANOS.length,a,b,farol,estufa,alfombra,estadoA,estadoB,habitatB,redAbierta,
    c,d,tabique,farol2,estufa2,sillaTecho,cerrado,abierto,pInterior,interacciones:lista};
})();`;

const context={console,Math,Float32Array,Uint8Array,Uint8ClampedArray,Uint16Array,Uint32Array,Int8Array,Int16Array,Int32Array,ArrayBuffer,DataView,Map,Set,WeakMap,WeakSet,Date,performance:{now:()=>0}};
context.globalThis=context; vm.createContext(context); vm.runInContext(code,context,{timeout:30000});
const r=context.__RC12;
for(const id of ['tabique-interior','tabique-puerta','alfombra-lana']) assert.ok(r.ids.includes(id),`falta ${id}`);
assert.ok(r.total>=37,`catálogo RC12 insuficiente (${r.total})`);
assert.equal(r.estadoA.habitable,true,'el primer módulo abierto hacia otro módulo cubierto no es interior válido');
assert.equal(r.estadoB.habitable,true,'el segundo módulo abierto hacia otro módulo cubierto no es interior válido');
assert.equal(r.estadoA.etiqueta,'ambiente conectado','el módulo abierto no se etiqueta como ambiente conectado');
assert.equal(r.estadoA.cierresEfectivos,4,'la unión interior no completa la envolvente efectiva');
assert.equal(r.redAbierta.length,2,'la red interior abierta no contiene ambos módulos');
assert.equal(r.habitatB.ambientesConectados,2,'el hábitat no reporta dos ambientes conectados');
assert.equal(r.habitatB.calorActivo,true,'el calor del módulo vecino no llega por unión abierta');
assert.equal(r.habitatB.calorPropagado,true,'el calor vecino no se identifica como propagado');
assert.ok(r.habitatB.luzPropagada>=0.9,'la luz del módulo vecino no se propaga por unión abierta');
assert.equal(r.habitatB.luz,true,'la habitación vecina no recibe luz compartida');
assert.ok(r.habitatB.confort>=4,'la alfombra no mejora el confort local');
assert.equal(r.tabique.f.ok,true,'no se pudo construir tabique con puerta interior');
assert.ok(r.pInterior,'el tabique interior no registró una puerta funcional');
assert.ok(r.farol2.o.datos.y<1,'el farol interior saltó erróneamente a la terraza superior');
assert.ok(r.sillaTecho.f.ok && r.sillaTecho.o.datos.y>2.4,'la colocación por altura no permite amueblar una cubierta transitable');
assert.equal(r.cerrado.ambientesConectados,2,'la puerta cerrada rompe incorrectamente la red interior');
assert.ok(r.cerrado.calorFactor>0.15 && r.cerrado.calorFactor<0.35,'la puerta cerrada no amortigua el calor');
assert.equal(r.cerrado.calorPropagado,true,'el calor débil de la habitación vecina no se marca propagado');
assert.equal(r.cerrado.luz,false,'una puerta interior cerrada deja pasar demasiada luz semántica');
assert.ok(r.abierto.calorFactor>0.95,'abrir la puerta no restablece la transferencia de calor');
assert.equal(r.abierto.luz,true,'abrir la puerta no restablece la luz compartida');
assert.ok(r.abierto.luzPropagada>0.95,'la apertura de la puerta no actualiza la propagación lumínica');

const main=fs.readFileSync(path.join(src,'main.js'),'utf8');
const puertas=fs.readFileSync(path.join(src,'puertas.js'),'utf8');
assert.match(main,/ambientes conectados|ambientes`/,'la UI no comunica viviendas de varios ambientes');
assert.match(main,/calor compartido|calor desde otro ambiente/,'la UI no diferencia calor propagado');
assert.match(main,/luz compartida/,'la UI no comunica iluminación compartida');
assert.match(puertas,/aperturaPorDuenio/,'puertas no expone estado de apertura por construcción');
console.log(`OK Hábitat Conectado RC12 · ${r.total} planos · red interior 2 módulos · calor/luz por apertura · tabique funcional · confort local`);

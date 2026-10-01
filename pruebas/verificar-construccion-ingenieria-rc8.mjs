import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import assert from 'node:assert/strict';
import { crearColisiones } from '../src/colisiones.js';

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
visitar(path.join(src, 'puertas.js'));
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
code += `\n;globalThis.__RC8=(()=>{\n
  const C=__mod_construccion, P=__mod_puertas;
  const obs=[], plats=[];
  const col={
    agregar:o=>obs.push(o),
    agregarPlataforma:p=>{p.cos=Math.cos(p.ang||0);p.sin=Math.sin(p.ang||0);plats.push(p);},
    eliminar:o=>{let ok=false;for(let i=obs.length-1;i>=0;i--)if(obs[i]===o){obs.splice(i,1);ok=true;}for(let i=plats.length-1;i>=0;i--)if(plats[i]===o){plats.splice(i,1);ok=true;}return ok;},
    eliminarPorDuenio(owner){
      for(let i=obs.length-1;i>=0;i--) if(obs[i].duenio===owner) obs.splice(i,1);
      for(let i=plats.length-1;i>=0;i--) if(plats[i].duenio===owner) plats.splice(i,1);
    },
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
  const inter={lista:[],
    agregar(o){this.lista.push({clase:'puerta',...o});return this.lista.at(-1);},
    agregarPostigos(o){this.lista.push({clase:'postigos',...o});return this.lista.at(-1);},
    eliminarPorDuenio(owner){let n=0;for(let i=this.lista.length-1;i>=0;i--)if(this.lista[i].duenio===owner){this.lista.splice(i,1);n++;}return n;}
  };
  const T={altura:()=>0,agua:()=>false,normal:()=>new THREE.Vector3(0,1,0),indice:()=>0,distRiel:[999],distSendero:[999],lugares:{}};
  const veg={arboles:[],despejar(){}}; const scene=new THREE.Scene();
  const s=C.crearConstruccion(T,scene,col,veg,inter), mats={tronco:999,tabla:999,piedra:999,lana:999};
  const puertaScene=new THREE.Scene(), puertaFisica=[];
  const colPuerta={agregar:o=>puertaFisica.push(o),eliminar:o=>{const i=puertaFisica.indexOf(o);if(i<0)return false;puertaFisica.splice(i,1);return true;}};
  const registroPuertas=P.crearPuertas(T,puertaScene,colPuerta,null), ownerPuerta={};
  const puertaReal=registroPuertas.agregar({sitio:{x:8,y:0,z:8,piso:0},rot:0,lx:0,lz:0,duenio:ownerPuerta});
  const puertaFisicaOwner=puertaFisica.filter(o=>o.duenio===ownerPuerta).length;
  const puertaEnEscena=puertaScene.children.includes(puertaReal.g);
  const puertaRemovida=registroPuertas.eliminarPorDuenio(ownerPuerta);
  const puertaFisicaFinal=puertaFisica.length, puertaEscenaFinal=puertaScene.children.includes(puertaReal.g);
  const terminar=(id,x,z,yaw=0)=>{
    s.elegir(C.PLANO[id]); const estado=s.moverFantasma(x,z,yaw); const f=s.fundar(x,z,yaw);
    if(!f.ok) return {estado,f,o:null};
    const o=s.obraCerca({x:f.datos.x,z:f.datos.z},4,id); if(!o) throw Error('obra '+id+' no encontrada');
    while(o.datos.etapas<o.plano.etapas.length){const r=s.avanzar(o,mats);if(!r.ok)throw Error('avanzar '+id+': '+r.motivo);}
    return {o,estado,f};
  };

  // Support contract: roof/rail cannot exist floating on bare terrain.
  s.elegir(C.PLANO['techo-modular']); const roofBare=s.fundar(20,0,0);
  s.elegir(C.PLANO['baranda-modular']); const railBare=s.fundar(22,0,0);

  const floor=terminar('piso-modular',0,0,0);
  const door=terminar('pared-puerta',0,-1.05,Math.PI/4); // snap must straighten from 45°
  const doorInterInicial=inter.lista.filter(x=>x.duenio===door.o&&x.clase==='puerta').length;

  const roof=terminar('techo-modular',0.35,0.30,Math.PI/4);
  const rail=terminar('baranda-modular',0,1.05,Math.PI/4);
  const stair=terminar('escalera-modular',0,-2.1,0);
  const stairPlats=plats.filter(p=>p.duenio===stair.o).length;
  const railObs=obs.filter(o=>o.duenio===rail.o).length;

  const window=terminar('pared-ventana',1.05,0,Math.PI/2);
  const shutters=inter.lista.filter(x=>x.duenio===window.o&&x.clase==='postigos').length;

  // Edit lifecycle: interactive children must vanish during move and return once.
  s.elegir(C.PLANO['pared-puerta']);
  const edit=s.iniciarEdicionCerca({x:door.o.datos.x,y:door.o.datos.y,z:door.o.datos.z},1.2);
  const doorInterDurante=inter.lista.filter(x=>x.duenio===door.o).length;
  const cancel=s.cancelarEdicion();
  const doorInterDespues=inter.lista.filter(x=>x.duenio===door.o&&x.clase==='puerta').length;

  // Selected-plan targeting must beat stacked center ambiguity.
  s.elegir(C.PLANO['techo-modular']);
  const editRoof=s.iniciarEdicionCerca({x:0,y:0,z:0},2.0);
  const selectedRoof=editRoof.obra?.plano?.id||null;
  if(editRoof.ok) s.cancelarEdicion();

  return {
    ids:C.PLANOS.map(p=>p.id), total:C.PLANOS.length,
    roofBare,railBare,floor,door,roof,rail,stair,window,
    doorInterInicial,doorInterDurante,doorInterDespues,shutters,
    stairPlats,railObs,editOk:edit.ok,cancelOk:cancel.ok,selectedRoof,
    interTotal:inter.lista.length, puertaFisicaOwner, puertaEnEscena, puertaRemovida, puertaFisicaFinal, puertaEscenaFinal
  };
})();`;

const context={console,Math,Float32Array,Uint8Array,Uint8ClampedArray,Uint16Array,Uint32Array,Int8Array,Int16Array,Int32Array,ArrayBuffer,DataView,Map,Set,WeakMap,WeakSet,Date,performance:{now:()=>0}};
context.globalThis=context; vm.createContext(context); vm.runInContext(code,context,{timeout:20000});
const r=context.__RC8;
for(const id of ['techo-modular','escalera-modular','baranda-modular']) assert.ok(r.ids.includes(id),`falta ${id}`);
assert.ok(r.total>=21,`catálogo RC8 insuficiente (${r.total})`);
assert.equal(r.roofBare.ok,false,'el techo puede flotar sin piso');
assert.match(r.roofBare.motivo,/piso construido/,'el techo no explica su requisito de soporte');
assert.equal(r.railBare.ok,false,'la baranda puede flotar sin piso');
assert.equal(r.floor.f.ok,true,'no se construyó piso base');
assert.equal(r.door.f.ok,true,'no se construyó pared-puerta');
assert.ok(r.door.estado.snap?.activo,'la pared-puerta no hizo snap al piso');
assert.ok(Math.abs(r.door.f.datos.rot)<0.02 || Math.abs(Math.abs(r.door.f.datos.rot)-Math.PI)<0.02,'el snap no enderezó pared desde 45°');
assert.equal(r.doorInterInicial,1,'pared-puerta no registró exactamente una puerta funcional');
assert.equal(r.roof.f.ok,true,'no se construyó techo modular');
assert.ok(r.roof.estado.snap?.activo && /techo/.test(r.roof.estado.snap.descripcion),'el techo no se centró por snap');
assert.ok(Math.hypot(r.roof.f.datos.x,r.roof.f.datos.z)<0.02,'techo no quedó centrado sobre el piso');
assert.ok(r.roof.f.datos.y>2.2,'techo no quedó elevado sobre las paredes');
assert.equal(r.rail.f.ok,true,'no se construyó baranda');
assert.ok(r.rail.estado.snap?.activo && /baranda/.test(r.rail.estado.snap.descripcion),'baranda no encastró al borde');
assert.ok(r.railObs>0,'baranda sin física protectora');
assert.equal(r.stair.f.ok,true,'no se construyó escalera');
assert.ok(r.stair.estado.snap?.activo && /escalera/.test(r.stair.estado.snap.descripcion),'escalera no encastró al piso');
assert.ok(r.stairPlats>=4,'escalera no creó cuatro apoyos escalonados');
assert.equal(r.window.f.ok,true,'no se construyó pared-ventana');
assert.equal(r.shutters,1,'pared-ventana no registró postigos funcionales');
assert.equal(r.editOk,true,'no inició edición de pared interactiva');
assert.equal(r.doorInterDurante,0,'la puerta siguió viva durante la edición');
assert.equal(r.cancelOk,true,'no canceló edición');
assert.equal(r.doorInterDespues,1,'cancelar edición duplicó o perdió la puerta');
assert.equal(r.selectedRoof,'techo-modular','la selección por plano no prioriza la pieza apilada elegida');
assert.equal(r.puertaFisicaOwner,1,'puerta real no registró colisión dinámica con dueño');
assert.equal(r.puertaEnEscena,true,'puerta real no se añadió a escena');
assert.equal(r.puertaRemovida,1,'el ciclo de vida no retiró exactamente una puerta');
assert.equal(r.puertaFisicaFinal,0,'retirar puerta dejó colisión dinámica');
assert.equal(r.puertaEscenaFinal,false,'retirar puerta dejó geometría en escena');

// Core collision contract added in RC8: remove one dynamic without deleting peers.
const colReal=crearColisiones(); const owner={};
const dynA={seg:true,dinamico:true,duenio:owner,ax:0,az:0,bx:1,bz:0,r:.1};
const dynB={seg:true,dinamico:true,duenio:owner,ax:0,az:1,bx:1,bz:1,r:.1};
colReal.agregar(dynA); colReal.agregar(dynB);
assert.equal(colReal.eliminar(dynA),true,'eliminar(objeto) no retiró dinámico');
assert.ok(!colReal.dinamicos.includes(dynA),'dinámico retirado sigue indexado');
assert.ok(colReal.dinamicos.includes(dynB),'eliminar(objeto) borró un dinámico hermano');

const puertas=fs.readFileSync(path.join(src,'puertas.js'),'utf8');
const main=fs.readFileSync(path.join(src,'main.js'),'utf8');
assert.match(puertas,/function eliminarPorDuenio\(duenio\)/,'puertas no implementa ciclo de vida por dueño');
assert.match(puertas,/dinamico: true, duenio/,'la colisión de puerta no conserva dueño');
assert.match(main,/crearConstruccion\(T, escena, col, veg, puertas\)/,'construcción no recibe el registro real de puertas');
console.log(`OK Ingeniería RC8 · ${r.total} planos · techo/escalera/baranda · puerta y postigos funcionales · lifecycle sin duplicados`);

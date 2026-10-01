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
code += `\n;globalThis.__RC7=(()=>{\n
  const C=__mod_construccion;
  const obs=[], plats=[];
  const col={
    agregar:o=>obs.push(o),
    agregarPlataforma:p=>{p.cos=Math.cos(p.ang||0);p.sin=Math.sin(p.ang||0);plats.push(p);},
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
  const T={altura:()=>0,agua:()=>false,normal:()=>new THREE.Vector3(0,1,0),indice:()=>0,distRiel:[999],distSendero:[999],lugares:{}};
  const veg={arboles:[],despejar(){}}; const scene=new THREE.Scene();
  const s=C.crearConstruccion(T,scene,col,veg), mats={tronco:999,tabla:999,piedra:999,lana:999};
  const terminar=(id,x,z,yaw=0)=>{
    s.elegir(C.PLANO[id]); const estado=s.moverFantasma(x,z,yaw); const f=s.fundar(x,z,yaw);
    if(!f.ok) throw Error('fundar '+id+': '+f.motivo);
    const o=s.obraCerca({x:f.datos.x,z:f.datos.z},3,id); if(!o) throw Error('obra '+id+' no encontrada');
    while(o.datos.etapas<o.plano.etapas.length){const r=s.avanzar(o,mats);if(!r.ok)throw Error('avanzar '+id+': '+r.motivo);}
    return {o,estado,f};
  };

  const p1=terminar('piso-modular',0,0,0);
  s.elegir(C.PLANO['piso-modular']); const ghost2=s.moverFantasma(2.35,0,0); const f2=s.fundar(2.35,0,0);
  if(!f2.ok) throw Error('segundo piso '+f2.motivo); const o2=s.obraCerca({x:f2.datos.x,z:f2.datos.z},2,'piso-modular'); s.avanzar(o2,mats);

  s.elegir(C.PLANO['pared-puerta']); const gw=s.moverFantasma(0,1.05,0); const fw=s.fundar(0,1.05,0);
  if(!fw.ok) throw Error('pared '+fw.motivo); const wall=s.obraCerca({x:fw.datos.x,z:fw.datos.z},2,'pared-puerta'); s.avanzar(wall,mats);
  const ownerAntes=obs.filter(o=>o.duenio===wall).length;
  const bloqueoPiso=s.desmontarCerca({x:0,z:0},0.8);

  const edit=s.iniciarEdicionCerca({x:wall.datos.x,z:wall.datos.z},1.0);
  const ownerDurante=obs.filter(o=>o.duenio===wall).length;
  const ge=s.moverFantasma(3.0,1.05,0); const ce=s.confirmarEdicion(3.0,1.05,0);
  const ownerDespues=obs.filter(o=>o.duenio===wall).length;
  const moved={x:wall.datos.x,z:wall.datos.z};
  const dw=s.desmontarCerca({x:moved.x,z:moved.z},1.0);
  const ownerFinal=obs.filter(o=>o.duenio===wall).length;

  s.elegir(C.PLANO['piso-modular']); s.alternarSnap(false); const libre=s.moverFantasma(5.42,0,0);
  return {
    ids:C.PLANOS.map(p=>p.id), total:C.PLANOS.length,
    ghost2,f2x:f2.datos.x, gw, wallInicial:{x:fw.datos.x,z:fw.datos.z},
    bloqueoPiso, editOk:edit.ok, ownerAntes, ownerDurante, ge, ceOk:ce.ok, moved, ownerDespues,
    desmontaOk:dw.ok, recupera:dw.recupera, ownerFinal, libre, snapActivo:s.snapActivo
  };
})();`;
const context={console,Math,Float32Array,Uint8Array,Uint8ClampedArray,Uint16Array,Uint32Array,Int8Array,Int16Array,Int32Array,ArrayBuffer,DataView,Map,Set,WeakMap,WeakSet,Date,performance:{now:()=>0}};
context.globalThis=context; vm.createContext(context); vm.runInContext(code,context,{timeout:20000});
const r=context.__RC7;
for(const id of ['piso-modular','pared-modular','pared-puerta','pared-ventana']) assert.ok(r.ids.includes(id),`falta ${id}`);
assert.ok(r.total>=18,`catálogo RC7 insuficiente (${r.total})`);
assert.ok(r.ghost2.snap?.activo,'el segundo piso no detectó snap');
assert.ok(Math.abs(r.f2x-3)<0.02,`el piso no encastró a 3 m (${r.f2x})`);
assert.ok(r.gw.snap?.activo && /piso/.test(r.gw.snap.descripcion),'la pared no encastró al borde del piso');
assert.equal(r.bloqueoPiso.ok,false,'se pudo desmontar un piso con una pared apoyada');
assert.equal(r.editOk,true,'no inició edición de pieza');
assert.ok(r.ownerAntes>0,'la pared no registró física propia');
assert.equal(r.ownerDurante,0,'la edición dejó colisiones viejas activas');
assert.equal(r.ceOk,true,'no confirmó recolocación');
assert.ok(Math.abs(r.moved.x-3)<0.02 && Math.abs(Math.abs(r.moved.z)-1.42)<0.08,`recolocación no encastró (${r.moved.x}, ${r.moved.z})`);
assert.ok(r.ownerDespues>0,'la recolocación no restauró física');
assert.equal(r.desmontaOk,true,'no desmontó la pared');
assert.ok(Object.values(r.recupera).some(n=>n>0),'desmontar no recuperó materiales');
assert.equal(r.ownerFinal,0,'desmontar dejó física fantasma');
assert.equal(r.snapActivo,false,'alternarSnap(false) no se respetó');
assert.equal(r.libre.snap,null,'colocación libre siguió haciendo snap');
assert.ok(Math.abs(r.libre.x-5.42)<1e-6,'colocación libre alteró la coordenada');

// Prueba directa de la grilla real de colisiones: remover por dueño debe limpiar
// tanto índices espaciales como la lista pública de plataformas sin tocar otros objetos.
const colReal=crearColisiones(); const owner={}; const otro={};
colReal.agregar({x:1,z:1,r:1,duenio:owner}); colReal.agregar({x:1,z:1,r:0.3,duenio:otro});
colReal.agregarPlataforma({x:1,z:1,ang:0,largo:2,ancho:2,alto:1,duenio:owner});
colReal.eliminarPorDuenio(owner);
assert.ok(!colReal.cercanos(1,1).some(o=>o.duenio===owner),'índice de obstáculos retuvo dueño eliminado');
assert.ok(colReal.cercanos(1,1).some(o=>o.duenio===otro),'remoción por dueño borró un obstáculo ajeno');
assert.ok(!colReal.plataformas.some(p=>p.duenio===owner),'lista de plataformas retuvo dueño eliminado');

const main=fs.readFileSync(path.join(src,'main.js'),'utf8'); const html=fs.readFileSync(path.join(src,'plantilla.html'),'utf8');
assert.match(main,/case 'KeyN':[\s\S]*alternarSnap/,'N no alterna snap');
assert.match(main,/e\.shiftKey && !obras\.editando[\s\S]*iniciarEdicionCerca/,'Shift+Y no inicia edición');
assert.match(main,/e\.shiftKey[\s\S]*desmontarCerca/,'Shift+Supr no desmonta');
assert.match(main,/confirmarEdicion/,'Y no confirma edición');
assert.match(html,/Shift\+Y mueve pieza/,'la ayuda no documenta edición');
assert.match(html,/Shift\+Supr desmonta/,'la ayuda no documenta desmontaje');
console.log(`OK construcción Senior RC7 · ${r.total} planos · snap modular · edición sin física fantasma · desmontaje seguro`);

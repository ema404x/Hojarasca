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
code += `\n;globalThis.__RC11=(()=>{\n
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
    },
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

  const base=terminar('piso-modular',200,0,0);
  terminar('pared-puerta',200,-1.12,0);
  terminar('pared-ventana',200,1.12,0);
  terminar('pared-modular',201.12,0,Math.PI/2);
  terminar('pared-modular',198.88,0,Math.PI/2);
  terminar('techo-modular',200.08,0.04,0);
  const vacio=s.estadoHabitat({x:200,y:1,z:0});

  const catre=terminar('catre-campo',200,0.66,0);
  const silla=terminar('silla-campo',200,-0.70,0);
  const farol=terminar('farol-interior',200.95,-0.72,0);
  const estufa=terminar('estufa-hierro',199.10,-0.72,0);
  const equipado=s.estadoHabitat({x:200,y:1,z:0});
  const conFuego=estufa.o?s.estadoHabitat({x:200,y:1,z:0},{fuego:{x:estufa.o.datos.x,z:estufa.o.datos.z}}):null;
  const cubierto=s.bajoCubierta({x:200,y:1,z:0});
  s.actualizarAmbiente(1);
  const luzNoche=farol.o?.luzInterior?.intensity||0;
  s.actualizarAmbiente(0);
  const luzDia=farol.o?.luzInterior?.intensity||0;

  const baseGaleria=terminar('piso-modular',210,0,0);
  terminar('pared-marco',210,-1.12,0);
  terminar('pared-modular',210,1.12,0);
  terminar('pared-modular',211.12,0,Math.PI/2);
  terminar('pared-modular',208.88,0,Math.PI/2);
  terminar('techo-una-agua',210.08,0.04,0);
  const galeria=s.estadoHabitat({x:210,y:1,z:0});
  const galeriaCubierta=s.bajoCubierta({x:210,y:1,z:0});
  const galeriaDentro=s.dentro({x:210,y:1,z:0});

  return {ids:C.PLANOS.map(p=>p.id),total:C.PLANOS.length,vacio,catre,silla,farol,estufa,equipado,conFuego,cubierto,luzNoche,luzDia,galeria,galeriaCubierta,galeriaDentro};
})();`;

const context={console,Math,Float32Array,Uint8Array,Uint8ClampedArray,Uint16Array,Uint32Array,Int8Array,Int16Array,Int32Array,ArrayBuffer,DataView,Map,Set,WeakMap,WeakSet,Date,performance:{now:()=>0}};
context.globalThis=context; vm.createContext(context); vm.runInContext(code,context,{timeout:20000});
const r=context.__RC11;
for(const id of ['catre-campo','silla-campo','farol-interior','estufa-hierro']) assert.ok(r.ids.includes(id),`falta ${id}`);
assert.ok(r.total>=34,`catálogo RC11 insuficiente (${r.total})`);
assert.equal(r.vacio.habitable,true,'la habitación base no fue reconocida como habitable');
assert.equal(r.vacio.confort,2,'una habitación vacía debería partir del confort estructural base');
for(const [nombre,pieza] of [['catre',r.catre],['silla',r.silla],['farol',r.farol],['estufa',r.estufa]]) assert.equal(pieza.f.ok,true,`no se pudo construir ${nombre}: ${pieza.f.motivo||''}`);
assert.equal(r.equipado.cama,true,'el catre no fue reconocido por el hábitat');
assert.equal(r.equipado.luz,true,'el farol no fue reconocido por el hábitat');
assert.ok(r.equipado.fuenteCalor,'la estufa no fue reconocida como fuente de calor');
assert.equal(r.equipado.confort,10,'el confort equipado no respeta la suma/cota premium');
assert.equal(r.equipado.calorActivo,false,'una fuente de calor apagada figura activa');
assert.equal(r.conFuego.calorActivo,true,'el fuego interior activo no fue detectado');
assert.ok(r.conFuego.calidad>r.equipado.calidad,'el calor activo no mejora el índice de hábitat');
assert.equal(r.equipado.proteccionLluvia,1,'habitación cerrada no protege totalmente de lluvia');
assert.equal(r.equipado.proteccionViento,1,'habitación cerrada no protege totalmente del viento');
assert.ok(r.cubierto?.cubierta,'bajoCubierta no reconoce un techo modular');
assert.ok(r.farol.o?.luzInterior,'el farol no creó una luz dinámica ligada a la obra');
assert.ok(r.luzNoche>r.luzDia && r.luzNoche>1,'el farol no responde al ciclo día/noche');
assert.equal(r.galeria.habitable,false,'una galería abierta fue marcada como habitación cerrada');
assert.equal(r.galeria.protegido,true,'la galería no fue marcada como espacio protegido');
assert.ok(r.galeriaCubierta?.cubierta,'la galería no corta precipitación bajo su cubierta');
assert.equal(r.galeriaDentro,null,'una galería abierta fue tratada como interior acústico cerrado');

const main=fs.readFileSync(path.join(src,'main.js'),'utf8');
const clima=fs.readFileSync(path.join(src,'clima.js'),'utf8');
assert.match(main,/obras\?\.bajoCubierta\?\.\(js\.pos\)/,'el clima local no consulta cubierta modular');
assert.match(main,/obras\?\.dentro\(js\.pos\)/,'el audio no reconoce habitaciones modulares');
assert.match(main,/Dormir en tu catre/,'el catre no tiene UX funcional');
assert.match(main,/fuegoContenido/,'la estufa no diferencia fuego contenido');
assert.match(main,/actualizarAmbiente\?\.\(noche\)/,'las luces de obra no siguen el ciclo nocturno');
assert.match(clima,/opciones = \{\}/,'clima no acepta configuración de fuego contenido');
assert.match(clima,/fogata\.contenida/,'clima no conserva estado de combustión contenida');
assert.match(clima,/factorLluvia = fogata\.contenida \? 1/,'la lluvia sigue apagando visualmente una estufa interior');
console.log(`OK Hábitat Premium RC11 · ${r.total} planos · refugio climático · confort 10/10 · catre funcional · farol dinámico · estufa contenida · galería bajo cubierta`);

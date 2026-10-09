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
  while ((m = re.exec(texto))) { if (m[2] === 'three') continue; if (!m[2].startsWith('.')) throw Error('external ' + m[2]); deps.push(normalizar(archivo, m[2])); }
  return { texto, deps };
}
function visitar(archivo) { archivo = path.resolve(archivo); if (visited.has(archivo)) return; if (visiting.has(archivo)) throw Error('cycle'); visiting.add(archivo); const a = analizar(archivo); info.set(archivo, a); for (const d of a.deps) visitar(d); visiting.delete(archivo); visited.add(archivo); orden.push(archivo); }
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
code += `\n;globalThis.__BUILD_AUDIT=(()=>{\n
 const C=__mod_construccion, G=__mod_geometria;
 const planos=C.PLANOS;
 const geos=[];
 for(const p of planos){
   const c=new G.Constructor(); for(const e of p.etapas)e.arma(c,p); const g=c.geometria();
   const pos=g.attributes.position; let finite=true,maxAbs=0; for(let i=0;i<pos.array.length;i++){const v=pos.array[i];if(!Number.isFinite(v)){finite=false;break;}maxAbs=Math.max(maxAbs,Math.abs(v));}
   g.computeBoundingBox(); geos.push({id:p.id,verts:pos.count,finite,maxAbs,bb:[...g.boundingBox.min.toArray(),...g.boundingBox.max.toArray()]});
 }
 const obs=[], plats=[];
 const col={agregar:o=>obs.push({...o}),agregarPlataforma:p=>plats.push({...p}),plataformaEn:()=>null};
 const T={altura:()=>0,agua:()=>false,normal:()=>new THREE.Vector3(0,1,0),indice:()=>0,distRiel:[999],distSendero:[999],lugares:{}};
 const veg={arboles:[],despejar(){}}; const scene=new THREE.Scene();
 const sistema=C.crearConstruccion(T,scene,col,veg); const materiales={tronco:999,tabla:999,piedra:999,cristal:999,lana:999}; const hechas=[];
 let x=0;
 for(const p of planos.filter(p=>!p.requierePlataforma && !p.sobreAgua)){
   sistema.elegir(p); sistema.moverFantasma(x,0,0.13); const rot0=sistema.rotacion; sistema.girar(1); const rot1=sistema.rotacion;
   const f=sistema.fundar(x,0,0.13); if(!f.ok) throw Error('no se pudo fundar '+p.id+': '+f.motivo);
   const o=sistema.obraCerca({x,z:0},4,p.id); if(!o) throw Error('obra no encontrada '+p.id);
   while(o.datos.etapas<p.etapas.length){const r=sistema.avanzar(o,materiales);if(!r.ok)throw Error('no avanzó '+p.id+': '+r.motivo);}
   hechas.push({id:p.id,etapas:o.datos.etapas,rotDelta:Math.abs(rot1-rot0),malla:!!o.malla}); x+=34;
 }
 const taller=sistema.tieneFuncionCerca('aserrar',{x:34*3,z:0},10); // posición aproximada se valida abajo por id general
 const funciones=sistema.obras.filter(o=>(o.plano.funciones||[]).includes('aserrar')).map(o=>o.plano.id);
 // Cancelación premium: una marca etapa 0 debe poder retirarse sin dejar obra.
 sistema.elegir(C.PLANO.casilla); sistema.moverFantasma(900,0,0); const nAntes=sistema.obras.length;
 const marcada=sistema.fundar(900,0,0); const nMarcada=sistema.obras.length;
 const cancelada=sistema.cancelarMarcada({x:900,z:0},10,'casilla'); const nDespues=sistema.obras.length;
 return {planos:planos.map(p=>({id:p.id,categoria:p.categoria,pieza:!!p.pieza,habitable:!!p.habitable})),cats:C.CATEGORIAS_CONSTRUCCION,geos,obs,plats,hechas,funciones,taller:taller?.plano?.id||null,cancel:{marcada:marcada.ok,cancelada:cancelada.ok,nAntes,nMarcada,nDespues}};
})();`;
const context={console,Math,Float32Array,Uint8Array,Uint8ClampedArray,Uint16Array,Uint32Array,Int8Array,Int16Array,Int32Array,ArrayBuffer,DataView,Map,Set,WeakMap,WeakSet,Date,performance:{now:()=>0}}; context.globalThis=context; vm.createContext(context); vm.runInContext(code,context,{timeout:20000});
const r=context.__BUILD_AUDIT;
const ids=r.planos.map(p=>p.id);
for(const id of ['puesto','galponcito','mirador','casilla','cobertizo','banco','fogon','tendal','lena','banco-trabajo','pasarela','cerco','mesa-campo','estante']) assert.ok(ids.includes(id),`falta plano ${id}`);
assert.ok(r.planos.length>=14,`catálogo demasiado chico (${r.planos.length})`);
// El modo Relax conserva las cuatro categorías; "Defensa" existe sólo en el Desafío.
assert.equal(r.cats.filter(c=>!c.soloDesafio).length,4,'deben existir cuatro categorías de construcción en Relax');
assert.ok(r.cats.some(c=>c.clave==='defensa'&&c.soloDesafio),'falta la categoría Defensa exclusiva del Desafío');
for(const p of r.planos) assert.ok(r.cats.some(c=>c.clave===p.categoria),`plano ${p.id} sin categoría válida`);
for(const g of r.geos){assert.ok(g.finite,`${g.id} contiene NaN/Infinity`);assert.ok(g.verts>20,`${g.id} tiene muy poca geometría`);assert.ok(g.maxAbs<20,`${g.id} tiene coordenadas absurdas`);}
for(const h of r.hechas){assert.ok(h.malla,`${h.id} quedó sin malla`);assert.ok(h.rotDelta>0.7&&h.rotDelta<0.9,`${h.id} no gira en pasos de 45°`);}
assert.ok(r.funciones.includes('cobertizo')&&r.funciones.includes('banco-trabajo'),'los talleres propios no habilitan aserrado');
assert.ok(r.cancel.marcada && r.cancel.cancelada && r.cancel.nMarcada===r.cancel.nAntes+1 && r.cancel.nDespues===r.cancel.nAntes,'cancelar una marca etapa 0 no limpia la obra correctamente');
assert.ok(r.obs.length>=20,`muy pocas colisiones de construcción (${r.obs.length})`);
assert.ok(r.plats.length>=8,`muy pocas plataformas de construcción (${r.plats.length})`);
for(const o of r.obs) assert.ok(o.alturaMin!==undefined&&o.alturaMax!==undefined,'obstáculo construido sin volumen vertical acotado');
const main=fs.readFileSync(path.join(src,'main.js'),'utf8'); const html=fs.readFileSync(path.join(src,'plantilla.html'),'utf8');
assert.match(main,/modoObra && obras\) \{\n\s*obras\.girar\(e\.deltaY/,'la rueda no gira el fantasma en modo obra');
assert.match(main,/case 'Tab':[\s\S]*cambiarCategoriaObra/,'Tab no cambia de categoría');
assert.match(main,/case 'KeyR':[\s\S]*obras\.girar/,'R no gira la construcción');
assert.match(main,/case 'Delete':[\s\S]*cancelarMarcada/,'Supr no permite cancelar una marca sin empezar');
assert.match(fs.readFileSync(path.join(src,'construccion.js'),'utf8'),/function cancelarMarcada/,'falta cancelación segura de obra marcada');
// 3.8.3: Y sigue la obra a medio hacer de ESE plano (obraAMedias, que también filtra por plano), no una terminada
assert.match(main,/obraAMedias\(obras\.plano, js\.pos, 10\)/,'se puede avanzar accidentalmente una obra de otro plano');
assert.match(main,/function obraAMedias\(plano, pos, radio\) \{[\s\S]{0,160}if \(o\.plano\.id !== plano\.id/,'se puede avanzar accidentalmente una obra de otro plano');
assert.match(main,/tieneFuncionCerca\('aserrar'/,'el banco/cobertizo propio no habilita aserrado');
assert.match(html,/Supr cancela marca/,'la ayuda no explica cómo cancelar una marca');
for(const id of ['obra-categorias','obra-costo','obra-progreso','obra-sitio']) assert.ok(html.includes(`id="${id}"`),`falta UI ${id}`);
console.log(`OK construcción Premium RC6 · ${r.planos.length} planos · ${r.cats.length} categorías · ${r.obs.length} obstáculos · ${r.plats.length} plataformas`);

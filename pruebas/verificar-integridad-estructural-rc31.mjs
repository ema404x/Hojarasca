import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
const fallo = [];
const exigir = (ok, msg) => { if (!ok) fallo.push(msg); };
const leer = (r) => fs.readFileSync(path.join(raiz, r), 'utf8');

// Contratos de fuente: protegen las causas raíz encontradas en RC30.
const estructuras = leer('src/estructuras.js');
const main = leer('src/main.js');
const refugioVivo = leer('src/refugiovivo.js');
exigir(estructuras.includes('const conjuntos = []'), 'falta agrupado atómico de complejos estructurales');
exigir(estructuras.includes('estructura:${clave}'), 'las raíces estructurales no están identificadas');
exigir(estructuras.includes('puerta.duenio || !puerta.g'), 'puertas de obras del jugador no están excluidas del reparentado estático');
exigir(estructuras.includes('puerta.estructuraClave = mejor.clave'), 'puertas/postigos estáticos no quedan ligados al edificio');
exigir(estructuras.includes('mejor.obj.attach(puerta.g)'), 'puertas estáticas no preservan transformación mundial al reagruparse');
exigir(estructuras.includes('m.userData.detalleLejano = true'), 'carteles lejanos no tienen LOD de microdetalle');
exigir(estructuras.includes('side: THREE.DoubleSide'), 'vidrios estructurales siguen siendo de una sola cara');
exigir(estructuras.includes('const chSueloTe = sueloLocal'), 'chimenea de Casa de Té no sigue el terreno real');
exigir(estructuras.includes('const chTopeTe = H + 1.6 + 0.72'), 'chimenea de Casa de Té no supera correctamente la cubierta');
exigir(estructuras.includes('alto: chTopeTe - chBaseTe'), 'chimenea de Casa de Té no comparte altura visual/física');
exigir(estructuras.includes('const ALTO_MARCO_CAB = 2.25'), 'marco de acceso de cabañas perdió su dintel alto');
exigir(estructuras.includes('for (const px of [-0.61, 0.61])'), 'marco de cabaña no preserva jambas laterales limpias');
exigir(estructuras.includes('ref.paredFondoInteriorZ = -D / 2 + radio + 0.035'), 'refugio no expone anclaje interior real para props');
exigir(refugioVivo.includes('const zPared = Number.isFinite(ref.paredFondoInteriorZ)'), 'fotos del refugio vuelven a usar un offset flotante');
exigir(main.includes('...(est.conjuntos || []).map'), 'visibilidad no consume complejos estructurales RC31');
exigir(main.includes('hijo.traverse((n) => {') && main.includes('sombras.push(n);'), 'shadow LOD no recopila mallas descendientes reales');
exigir(main.includes('c.obj.visible = visible'), 'falta culling atómico del complejo completo');
exigir(main.includes('for (const m of c.sombras) m.castShadow = sombraActiva'), 'shadow LOD no se aplica a las mallas hijas');
exigir(refugioVivo.includes('return { grupo, reconstruir'), 'props vivos del refugio no exponen su raíz visual');
exigir(main.includes('raizRefugio.attach(refugioVivo.grupo)'), 'props vivos del refugio no siguen visibilidad de su edificio');
exigir(main.includes('const detallesLejanos = []'), 'visibilidad no contempla microdetalle lejano');

// Auditoría runtime headless: crea el mundo real y revisa la jerarquía resultante.
const roots = [
  path.join(src, 'terreno.js'), path.join(src, 'colisiones.js'),
  path.join(src, 'puertas.js'), path.join(src, 'estructuras.js'),
];
const idModulo = (archivo) => '__mod_' + path.basename(archivo, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);
const info = new Map(), orden = [], visiting = new Set(), visited = new Set();
function analizar(archivo) {
  const texto = fs.readFileSync(archivo, 'utf8'); const deps = [];
  const re = /^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm; let m;
  while ((m = re.exec(texto))) {
    if (m[2] === 'three') continue;
    if (!m[2].startsWith('.')) throw new Error('import externo ' + m[2]);
    deps.push(normalizar(archivo, m[2]));
  }
  return { texto, deps };
}
function visitar(archivo) {
  archivo = path.resolve(archivo); if (visited.has(archivo)) return;
  if (visiting.has(archivo)) throw new Error('ciclo');
  visiting.add(archivo); const a = analizar(archivo); info.set(archivo, a);
  for (const d of a.deps) visitar(d);
  visiting.delete(archivo); visited.add(archivo); orden.push(archivo);
}
for (const r of roots) visitar(r);
function transformar(archivo, texto) {
  const ex = [];
  for (const m of texto.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)) ex.push(m[1]);
  for (const m of texto.matchAll(/^export\s*\{([^}]+)\}\s*;?\s*$/gm)) for (const parte of m[1].split(',')) {
    const [local, remoto] = parte.trim().split(/\s+as\s+/); if (local) ex.push((remoto || local).trim());
  }
  texto = texto.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
  texto = texto.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_t, nombres, spec) => {
    const dep = normalizar(archivo, spec);
    const partes = nombres.split(',').map(x => x.trim()).filter(Boolean).map(x => {
      const [a, b] = x.split(/\s+as\s+/); return b ? `${a.trim()}: ${b.trim()}` : a.trim();
    });
    return `const { ${partes.join(', ')} } = ${idModulo(dep)};`;
  });
  texto = texto.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
  texto = texto.replace(/^export\s*\{[^}]+\}\s*;?\s*$/gm, '');
  return `const ${idModulo(archivo)}=(()=>{\n${texto}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
}
let code = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8') + '\n';
for (const f of orden) code += transformar(f, info.get(f).texto) + '\n';
code += `
;globalThis.__RC31=(()=>{
  const T=__mod_terreno.generarTerreno();
  const scene=new THREE.Scene();
  const col=__mod_colisiones.crearColisiones();
  const veg={arboles:[],colisiones:[],despejar(){}};
  const puertas=__mod_puertas.crearPuertas(T,scene,col,null);
  const est=__mod_estructuras.crearEstructuras(T,scene,col,veg,puertas);
  scene.updateMatrixWorld(true);
  const raizDe=(o)=>{let p=o;while(p){if(p.userData?.estructuraRaiz)return p.userData.claveEstructura;p=p.parent;}return null;};
  const conjuntos=est.conjuntos.map(c=>({clave:c.clave,hijos:c.obj.children.length,root:c.obj.userData?.estructuraRaiz===true}));
  const puertasInfo=puertas.lista.filter(p=>!p.duenio).map(p=>({nombre:p.nombre,clave:p.estructuraClave||null,raiz:raizDe(p.g)}));
  const refs={
    faroLente:raizDe(est.faro?.lente), faroHaz:raizDe(est.faro?.haz), faroBlanco:raizDe(est.faro?.blanco), faroBrillo:raizDe(est.faro?.brillo),
    molinoRueda:raizDe(est.molino?.rueda), molinoAspas:raizDe(est.molino?.aspas), molinoLuz:raizDe(est.molino?.luzInterior),
    galponMolino:raizDe(est.galpon?.molino),
  };
  const top=est.grupo.children.map(o=>({name:o.name||'',root:o.userData?.estructuraRaiz===true,x:o.position.x,z:o.position.z,type:o.type}));
  let vidrioDoble=0, vidrioSimple=0;
  scene.traverse(o=>{if(!o.isMesh)return; const m=o.material;if(m?.isMeshBasicMaterial){ if(m.side===THREE.DoubleSide)vidrioDoble++; else vidrioSimple++; }});
  return {conjuntos,puertasInfo,refs,top,vidrioDoble,vidrioSimple};
})();`;
const noop = () => {};
const fakeCtx = new Proxy({measureText(t){return {width:String(t).length*20}},createLinearGradient(){return {addColorStop:noop}},createRadialGradient(){return {addColorStop:noop}}},{get(t,p){if(p in t)return t[p];return noop;},set(t,p,v){t[p]=v;return true;}});
const context = {console,Math,Float32Array,Uint8Array,Uint8ClampedArray,Uint16Array,Uint32Array,Int8Array,Int16Array,Int32Array,ArrayBuffer,DataView,Map,Set,WeakMap,WeakSet,Date,performance:{now:()=>0},document:{createElement(tag){if(tag==='canvas')return {width:1,height:1,getContext:()=>fakeCtx};return {};}}};
context.globalThis=context; vm.createContext(context); vm.runInContext(code, context, {timeout:20000});
const r=context.__RC31;
const esperadas=['refugio','muelle','puente','mirador','cabana','puesto','faro','molino','casa-te','torre','cueva','almacen','galpon'];
const claves=new Set(r.conjuntos.map(c=>c.clave));
for(const k of esperadas) exigir(claves.has(k), `falta raíz estructural ${k}`);
for(const c of r.conjuntos){ exigir(c.root, `${c.clave} no está marcado como raíz estructural`); exigir(c.hijos>0, `${c.clave} quedó como complejo vacío`); }
for(const p of r.puertasInfo){
  exigir(!!p.clave, `${p.nombre} no fue vinculada a una estructura`);
  exigir(p.raiz===p.clave, `${p.nombre} quedó bajo ${p.raiz} pero declara ${p.clave}`);
}
for(const [k,v] of Object.entries(r.refs)){
  const esperado=k.startsWith('faro')?'faro':k.startsWith('molino')?'molino':'galpon';
  exigir(v===esperado, `${k} quedó fuera de ${esperado} (raíz=${v})`);
}
// Las únicas entradas de alto nivel deben ser raíces estructurales o restos decorativos deliberados.
// Ninguna puerta estática puede quedar en la escena raíz: ya se validó por `raizDe` arriba.
exigir(r.vidrioDoble>=5, `muy pocos cristales/materiales de doble cara (${r.vidrioDoble})`);

if(fallo.length){console.error('INTEGRIDAD ESTRUCTURAL RC31 FALLÓ');for(const x of fallo)console.error(' -',x);process.exit(1);}
console.log(`OK Integridad Estructural RC31 · ${r.conjuntos.length} complejos atómicos · ${r.puertasInfo.length} puertas/postigos ligados · mecanismos agrupados · shadow LOD descendiente · vidrio doble cara · chimeneas continuas`);

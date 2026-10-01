// 3.3: el bosque en bloques e impostores lejanos. Se arma el bosque de verdad en Node (con el
// three del juego, como verificar-geometria-headless-rc3) y se prueba: a qué chunk va cada
// árbol, que los chunks entran y salen de la escena según la distancia, que talar o
// despejar un árbol actualiza su chunk y su impostor, y la elección del ángulo del cartel.
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import assert from 'node:assert/strict';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
const leer = (r) => fs.readFileSync(path.join(raiz, r), 'utf8');

// ---------------------------------------------------------------- 1. el ángulo del cartel
function probarAngulos({ anguloImpostor, ANGULOS_IMPOSTOR }) {
  const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 10, 0, 20, 1];
  assert.equal(ANGULOS_IMPOSTOR, 8);
  assert.equal(anguloImpostor(I, 10, 120), 0, 'cámara en +z: la foto 0');
  assert.equal(anguloImpostor(I, 110, 20), 2, 'cámara en +x: la foto de 90°');
  assert.equal(anguloImpostor(I, 10, -80), 4, 'cámara en -z: la de 180°');
  assert.equal(anguloImpostor(I, -90, 20), 6, 'cámara en -x: la de 270°');
  assert.equal(anguloImpostor(I, 10 + 100 * Math.sin(0.3), 20 + 100 * Math.cos(0.3)), 0, '17° redondea a la 0');
  assert.equal(anguloImpostor(I, 10 + 100 * Math.sin(0.5), 20 + 100 * Math.cos(0.5)), 1, '29° redondea a la de 45°');
  // un árbol girado 90° (y estirado): desde +x se ve su frente local, la foto 0
  const c = Math.cos(Math.PI / 2), s = Math.sin(Math.PI / 2), sx = 1.3, sz = 0.8;
  const R = [c * sx, 0, -s * sx, 0, 0, 1.1, 0, 0, s * sz, 0, c * sz, 0, 0, 0, 0, 1];
  assert.equal(anguloImpostor(R, 100, 0), 0, 'se descuenta el giro propio del árbol');
  assert.equal(anguloImpostor(R, 0, -100), 2, 'y el resto de los ángulos rota con él');
}

// ---------------------------------------------------------------- 2. el bosque armado en Node
const idModulo = (archivo) => '__mod_' + path.basename(archivo, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);
const info = new Map(), orden = [], visitados = new Set();
function visitar(archivo) {
  archivo = path.resolve(archivo);
  if (visitados.has(archivo)) return;
  visitados.add(archivo);
  const texto = fs.readFileSync(archivo, 'utf8');
  const deps = [];
  for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') deps.push(normalizar(archivo, m[2]));
  info.set(archivo, texto);
  for (const d of deps) visitar(d);
  orden.push(archivo);
}
function transformar(archivo, texto) {
  const ex = [];
  for (const m of texto.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)) ex.push(m[1]);
  texto = texto.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
  texto = texto.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_t, nombres, spec) => {
    const partes = nombres.split(',').map((x) => x.trim()).filter(Boolean).map((x) => { const [a, b] = x.split(/\s+as\s+/); return b ? `${a.trim()}: ${b.trim()}` : a.trim(); });
    return `const { ${partes.join(', ')} } = ${idModulo(normalizar(archivo, spec))};`;
  });
  texto = texto.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
  return `const ${idModulo(archivo)}=(()=>{\n${texto}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
}
visitar(path.join(src, 'terreno.js'));
visitar(path.join(src, 'vegetacion.js'));
visitar(path.join(src, 'config.js'));
let codigo = leer('three-r186-inline.js') + '\n';
for (const f of orden) codigo += transformar(f, info.get(f)) + '\n';
codigo += `
globalThis.__R = (() => {
  const T = __mod_terreno.generarTerreno();
  const calidad = __mod_config.CALIDADES.media;
  const escena = new THREE.Scene();
  const veg = __mod_vegetacion.generarVegetacion(T, calidad, escena);
  return { T, veg, escena, calidad, THREE, MITAD: __mod_config.MITAD, imp: __mod_impostores };
})();`;
const noop = () => {};
const ctx2d = new Proxy({ measureText: (t) => ({ width: String(t).length * 20 }), createLinearGradient: () => ({ addColorStop: noop }), createRadialGradient: () => ({ addColorStop: noop }), getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) }, { get: (t, p) => (p in t ? t[p] : noop), set: (t, p, v) => { t[p] = v; return true; } });
const contexto = { console, Math, Float32Array, Float64Array, Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, ArrayBuffer, DataView, Map, Set, WeakMap, WeakSet, Date, Symbol, Proxy, Reflect, JSON, Number, String, Array, Object, Error, TypeError, RangeError, Promise, Infinity, NaN, isFinite, isNaN, parseInt, parseFloat,
  performance: { now: () => 0 }, document: { createElement: (tag) => (tag === 'canvas' ? { width: 1, height: 1, getContext: () => ctx2d } : {}) }, self: {}, window: {} };
contexto.globalThis = contexto;
vm.createContext(contexto);
vm.runInContext(codigo, contexto, { filename: 'bosque-3-3.js' });
const { veg, escena, calidad, THREE } = contexto.__R;
probarAngulos(contexto.__R.imp);

// a qué chunk va cada árbol: el que contiene su base
for (const a of veg.arboles) {
  const ch = a.ref.ch;
  assert.ok(Math.abs(a.x - ch.x) <= 60.001 && Math.abs(a.z - ch.z) <= 60.001, `el árbol de ${a.x.toFixed(1)},${a.z.toFixed(1)} cayó en el chunk de ${ch.x},${ch.z}`);
}
// la "alta" de un árbol sólo guarda datos: no va a la escena; el resto vive en el grupo del chunk
for (const ch of veg.chunks.values()) {
  assert.ok(ch.grupo && ch.grupo.isGroup, 'cada chunk tiene su grupo');
  for (const m of ch.mallas) {
    if (m.grupo === 'arbol') { assert.equal(m.alta.parent, null, 'la alta de un árbol no se recorre'); assert.equal(m.baja.parent, ch.grupo); }
    else assert.equal(m.alta.parent, ch.grupo);
  }
}
const hijosAntes = escena.children.length;
assert.ok(hijosAntes <= 32 && escena.children.every((c) => c.visible), `al nacer, el bosque no cuelga objetos ocultos de la escena (${hijosAntes})`);

// los chunks entran y salen de la escena con la distancia
const a0 = veg.arboles[Math.floor(veg.arboles.length / 2)];
const cam = new THREE.Vector3(a0.x, a0.y + 1.7, a0.z);
veg.actualizar(cam);
const enEscena = [...veg.chunks.values()].filter((ch) => ch.grupo.parent === escena);
assert.ok(enEscena.length > 0 && enEscena.length < veg.chunks.size, `entran sólo los chunks cercanos (${enEscena.length} de ${veg.chunks.size})`);
assert.ok(enEscena.includes(a0.ref.ch), 'el chunk del jugador está en la escena');
for (const ch of veg.chunks.values()) assert.equal(ch.grupo.parent === escena, ch.enEscena);
const lejos = new THREE.Vector3(-a0.x * 3 + 2000, 0, -a0.z * 3 + 2000);
veg.actualizar(lejos);
assert.equal([...veg.chunks.values()].filter((ch) => ch.grupo.parent === escena).length, 0, 'lejos de todo, ningún chunk queda colgado');
veg.actualizar(cam);

// 3.4 (sotobosque): el sotobosque en bloques. Una malla por tipo en un grupo de la escena;
// antes de dibujar junta lo que está a tiro y en el cono de la vista (lo de los chunks no se
// dibuja más), y despejar una mata la saca de su bloque
const grupoSoto = escena.children.find((o) => o.name === 'sotobosque');
assert.ok(grupoSoto && grupoSoto.children.length >= 8, 'el sotobosque va en bloques: una malla por tipo');
for (const ch of veg.chunks.values()) for (const m of ch.mallas) if (m.grupo !== 'arbol') assert.equal(m.alta.visible, false, 'las mallas de sotobosque de los chunks sólo guardan datos');
const camSoto = new THREE.PerspectiveCamera(70, 16 / 9, 0.1, 1000);
camSoto.position.copy(cam); camSoto.lookAt(cam.x + 10, cam.y, cam.z); camSoto.updateMatrixWorld();
veg.revisarSoto(camSoto);
const enBloques = () => grupoSoto.children.reduce((s, m) => s + m.count, 0);
const antesSoto = enBloques();
assert.ok(antesSoto > 0 && grupoSoto.children.some((m) => m.visible), `los bloques juntan el sotobosque a la vista (${antesSoto})`);
const mataCerca = veg.matas.find((m) => !m.sacado && Math.hypot(m.x - cam.x, m.z - cam.z) < 10);
if (mataCerca) {
  veg.despejar(mataCerca.x, mataCerca.z, 0.2, true);
  veg.revisarSoto(camSoto);
  assert.ok(enBloques() < antesSoto, 'despejar una mata la saca de su bloque');
}

// impostores con un renderer de mentira (el horneado no se ve en Node, pero la malla y sus
// matrices sí): talar, despejar y rebrotar mueven el cartel junto con el chunk
const rendererFalso = { getRenderTarget: () => null, setRenderTarget: noop, getClearColor: noop, getClearAlpha: () => 1, setClearColor: noop, render: noop, autoClear: true, shadowMap: { autoUpdate: true } };
const imp = veg.prepararImpostores(rendererFalso);
assert.ok(imp && imp.malla.parent === escena, 'los impostores son una malla en la escena');
assert.equal(imp.malla.count, veg.arboles.filter((a) => a.ref.imp !== undefined).length);
assert.ok(imp.malla.count >= veg.arboles.length * 0.99, 'cada árbol tiene su cartel');
assert.ok(imp.estado.uInicio.value >= 100 && imp.estado.uFin.value > imp.estado.uInicio.value && imp.estado.uLejos.value === calidad.lejos, 'el relevo empieza pasados los 100 m y termina en el alcance de siempre');
assert.equal(veg.mats.arbol.baja.userData.relevo.uImpFin.value, imp.estado.uFin.value, 'el 3D sale donde entra el cartel');
const matImp = (a) => Array.from(imp.malla.instanceMatrix.array.subarray(a.ref.imp * 16, a.ref.imp * 16 + 16));
const matChunk = (a) => { const m = a.ref.ch.porTipo[a.ref.tipo][1]; return Array.from(m.instanceMatrix.array.subarray(a.ref.i * 16, a.ref.i * 16 + 16)); };
const victima = veg.arboles.find((a) => !a.sacado && a.ref.imp !== undefined);
const original = matChunk(victima);
assert.deepEqual(matImp(victima), original, 'el cartel nace con la matriz de su árbol');
assert.ok(veg.talar(victima, { x: 1, z: 0 }), 'se tala');
assert.ok(matChunk(victima).slice(0, 11).every((v) => v === 0), 'talar apaga la instancia del chunk');
assert.ok(matImp(victima).slice(0, 11).every((v) => v === 0), 'y su impostor');
veg.actualizarCaidas(10);
assert.ok(veg.crecer(victima, 0.5));
assert.ok(Math.abs(matImp(victima)[5] - original[5] * 0.5) < 1e-5, 'el renoval crece también de lejos');
assert.ok(veg.crecer(victima, 1));
assert.deepEqual(matImp(victima), original, 'el adulto vuelve a su cartel de siempre');
assert.deepEqual(matChunk(victima), original, 'y a su instancia del chunk');
const otro = veg.arboles.find((a) => !a.sacado && a !== victima && a.ref.imp !== undefined);
veg.despejar(otro.x, otro.z, 0.2, false);
assert.ok(matImp(otro).slice(0, 11).every((v) => v === 0), 'despejar un sitio de obra también saca el cartel');

// ---------------------------------------------------------------- 3. enganches en el código
const vegFuente = leer('src/vegetacion.js'), main = leer('src/main.js'), pkg = JSON.parse(leer('package.json'));
assert.match(vegFuente, /if \(impostores && ref\.imp !== undefined\) impostores\.ponerMatriz\(ref\.imp, M\.elements\);/);
assert.match(main, /veg\.prepararImpostores\(renderer\);/, 'main hornea los impostores con el renderer');
// el relevo 3D → cartel se cuelga del material de la vegetación: necesita su raíz por instancia
assert.ok(leer('src/materiales.js').includes('vRaizVeg = raizVeg.xz;'), 'el material vegetal sigue exponiendo vRaizVeg');
assert.ok(pkg.scripts.verify.includes('node pruebas/verificar-3-3-bosque.mjs'), 'la prueba corre en verify');
console.log(`verificar-3-3-bosque: ok · ${veg.arboles.length} árboles en ${veg.chunks.size} chunks, ${enEscena.length} en escena desde el centro`);

// 3.6.1 (juego): lo que la 3.6 rompió sin querer fuera de la aldea. Sólo Node. Cada caso es un
// error encontrado en la revisión, el caos o las partidas reales, y no tiene que volver:
//  1. En una partida vieja, un árbol talado donde ahora está la Aldea de los Duendes volvía a
//     crecer en medio de una calle o adentro de un edificio (y su tocón aparecía ahí): lo que
//     despeja una construcción no rebrota.
//  2. En el Relax se podía construir (y plantar renovales) en la plaza de la aldea, en sus calles
//     y adentro de sus edificios: la aldea despejada era el claro más grande del valle.
//  3. Perder el foco (o soltar el mouse) en el modo foto abría la pausa con el modo foto prendido
//     debajo (lo encontró el caos, semilla 3611): la pausa, el cuaderno y el mapa lo cierran.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let pasos = 0;
const ok = (c, m) => { assert.ok(c, m); pasos++; };

// ---------------------------------------------------------------- el bosque armado en Node
// (como verificar-3-3-bosque: el three del juego y los módulos en un vm)
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
  const escena = new THREE.Scene();
  const veg = __mod_vegetacion.generarVegetacion(T, __mod_config.CALIDADES.muybaja, escena);
  return { T, veg };
})();`;
const noop = () => {};
const ctx2d = new Proxy({ measureText: (t) => ({ width: String(t).length * 20 }), createLinearGradient: () => ({ addColorStop: noop }), createRadialGradient: () => ({ addColorStop: noop }), getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) }, { get: (t, p) => (p in t ? t[p] : noop), set: (t, p, v) => { t[p] = v; return true; } });
const contexto = { console, Math, Float32Array, Float64Array, Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, ArrayBuffer, DataView, Map, Set, WeakMap, WeakSet, Date, Symbol, Proxy, Reflect, JSON, Number, String, Array, Object, Error, TypeError, RangeError, Promise, Infinity, NaN, isFinite, isNaN, parseInt, parseFloat,
  performance: { now: () => 0 }, document: { createElement: (tag) => (tag === 'canvas' ? { width: 1, height: 1, getContext: () => ctx2d } : {}) }, self: {}, window: {} };
contexto.globalThis = contexto;
vm.createContext(contexto);
vm.runInContext(codigo, contexto, { filename: 'bosque-3-6-1.js' });
const { veg } = contexto.__R;

// ---------------------------------------------------------------- 1. lo despejado no rebrota
{
  const libres = veg.arboles.filter((a) => !a.sacado && a.choque);
  // un árbol en pie que despeja una construcción (la aldea en la carga): el rebrote de una partida
  // vieja que lo tenía talado no lo vuelve a levantar ni le pone tocón
  const a = libres[10];
  veg.despejar(a.x, a.z, 0.2, false);
  ok(a.sacado && a.despejado, 'despejar lo saca y lo marca');
  const tocones0 = veg.cantidadTocones();
  ok(veg.crecer(a, 0) === false && veg.cantidadTocones() === tocones0, 'el tocón de un árbol despejado no aparece');
  ok(veg.crecer(a, 0.5) === false && a.sacado, 'ni el renoval');
  ok(veg.crecer(a, 1) === false && a.sacado && a.choque.apagado, 'ni el árbol adulto (ni su choque)');
  // talado y después despejado (una obra encima del tocón): tampoco crece adentro
  const b = libres[40];
  ok(veg.talar(b, { x: 1, z: 0 }), 'se tala otro');
  veg.actualizarCaidas(10);
  veg.despejar(b.x, b.z, 0.2, false);
  ok(b.despejado && veg.crecer(b, 1) === false && b.sacado, 'un tocón con una obra encima no rebrota');
  // lo talado sin construcción encima rebrota como siempre
  const c = libres[80];
  ok(veg.talar(c, { x: 0, z: 1 }), 'se tala un tercero');
  veg.actualizarCaidas(10);
  ok(!c.despejado && veg.crecer(c, 0.5) && veg.crecer(c, 1) && !c.sacado && !c.choque.apagado, 'el talado de siempre rebrota entero');
}

// ---------------------------------------------------------------- 2. sin obras en la aldea
{
  const { distanciaAldea } = await import('../src/aldea-gente.js');
  const A = await import('../src/aldea.js');
  const main = leer('src/main.js'), cons = leer('src/construccion.js'), ren = leer('src/renovales.js');
  const margen = Number(/const MARGEN_SIN_OBRAS = (\d+(?:\.\d+)?)/.exec(main)?.[1]);
  ok(margen >= 4 && margen <= 12, `hay un margen alrededor de la aldea (${margen} m)`);
  const sinObras = (x, z, radio = 0) => distanciaAldea(x, z) < radio + margen;
  // cada edificio de la aldea (y su puerta), la plaza y cada tramo de calle quedan adentro
  for (const id of A.IDS_EDIFICIOS) {
    const e = A.edificioEnMundo(id);
    ok(sinObras(e.x, e.z, 1), `en ${id} no se construye`);
  }
  for (const c of A.CALLES_ALDEA) {
    const m = A.marcoAldea(A.PARADA_ALDEA);
    for (const [lx, lz] of c.puntos) { const w = m.aMundo(lx, lz); ok(sinObras(w.x, w.z, 1), `ni en ${c.id}`); }
  }
  // el refugio y el resto del valle, como siempre
  const lejos = [[0, 0], [150, 110], [-200, 50], [300, -100]];
  ok(lejos.every(([x, z]) => !sinObras(x, z, 8)), 'lejos de la aldea se construye como antes');
  // los enganches: sólo en el Relax (en el Desafío no hay aldea) y antes de todo lo demás
  const rama = main.slice(main.indexOf('if (!esDesafio) {\n    aldeaMundo = crearAldeaMundo'), main.indexOf('col = crearColisiones();'));
  ok(/T\.sinObras = \(x, z, radio = 0\) => \(distanciaAldea\(x, z\) < radio \+ MARGEN_SIN_OBRAS \? AVISO_SIN_OBRAS : null\);/.test(rama), 'main.js marca la aldea sólo en el Relax');
  const revisar = cons.slice(cons.indexOf('function revisarSitio('), cons.indexOf('const pieza = !!plano.pieza;', cons.indexOf('function revisarSitio(')));
  ok(/T\.sinObras\(x, z, plano\.radio \|\| 1\)/.test(revisar) && /if \(reservado\) return \{ ok: false, motivo: reservado \};/.test(revisar), 'construccion.js lo pregunta al revisar el sitio');
  const bueno = ren.slice(ren.indexOf('function sitioBueno('), ren.indexOf('function colocar('));
  ok(/T\.sinObras\(x, z, 1\)/.test(bueno), 'renovales.js también');
}

// ---------------------------------------------------------------- 3. la pausa cierra el modo foto
{
  const main = leer('src/main.js');
  const abrir = main.slice(main.indexOf('function abrir(cual) {'), main.indexOf("for (const id of ['pausa', 'cuaderno', 'mapa'])", main.indexOf('function abrir(cual) {')));
  ok(abrir.includes("if (cual !== 'jugando') {") && abrir.indexOf('if (foto.activo) abrirModoFoto(false);') > abrir.indexOf("if (cual !== 'jugando') {"), 'abrir la pausa, el cuaderno o el mapa cierra el modo foto');
  // los caminos que abren la pausa sin pasar por la tecla Escape siguen yendo por abrir()
  ok(main.includes("if (modo === 'jugando' && jugador && !document.pointerLockElement && !banco.activa) abrir('pausa');"), 'perder el foco pausa por abrir()');
  ok(main.includes("alSoltar: () => { if (modo === 'jugando') abrir('pausa'); },"), 'soltar el mouse también');
}

const pkg = JSON.parse(leer('package.json'));
ok(pkg.scripts.verify.includes('node pruebas/verificar-3-6-1-juego.mjs'), 'la prueba corre en verify');
console.log(`verificar-3-6-1-juego: ok (${pasos} pasos)`);

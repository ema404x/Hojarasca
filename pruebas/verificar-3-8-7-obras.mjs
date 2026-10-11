// 3.8.7 (obras): el pase de bugs de la construcción, las estructuras y las máquinas. Una comprobación por arreglo.
// construccion.js se carga de verdad (con el three local, en una vm, como verificar-construccion-ultra-rc10) sobre un
// terreno plano de mentira y las colisiones reales; lo que depende del mundo 3D lo prueba humo-3-8-7-obras.cjs.
// 1. Lo que pisa una plataforma de otra obra (la mesa en el piso de la casilla, la silla en el techo plano) cuenta como
//    apoyado: deshacer el piso de la casilla, desmontar o mover el techo lo dejaba flotando.
// 2. Mover una pieza con Shift+Y despeja el lugar nuevo, como al armarla (el árbol le quedaba atravesado).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const eq = (a, b, t) => { pasos++; assert.deepEqual(a, b, t); };

// ---------------------------------------------------------------- cargar src/ con el three local en una vm
function cargar(raices) {
  const idModulo = (archivo) => '__mod_' + path.basename(archivo, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
  const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);
  const info = new Map(), orden = [], visitando = new Set(), vistos = new Set();
  const visitar = (archivo) => {
    archivo = path.resolve(archivo);
    if (vistos.has(archivo) || visitando.has(archivo)) return;
    visitando.add(archivo);
    const texto = fs.readFileSync(archivo, 'utf8'), deps = [];
    for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') deps.push(normalizar(archivo, m[2]));
    info.set(archivo, texto);
    for (const d of deps) visitar(d);
    visitando.delete(archivo); vistos.add(archivo); orden.push(archivo);
  };
  for (const r of raices) visitar(path.join(raiz, 'src', r));
  const transformar = (archivo, texto) => {
    const ex = [...texto.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
    texto = texto.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
    texto = texto.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_t, nombres, spec) => {
      const partes = nombres.split(',').map((x) => x.trim()).filter(Boolean).map((x) => { const [a, b] = x.split(/\s+as\s+/); return b ? `${a.trim()}: ${b.trim()}` : a.trim(); });
      return `const { ${partes.join(', ')} } = ${idModulo(normalizar(archivo, spec))};`;
    });
    texto = texto.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '').replace(/^export\s*\{[^}]+\}\s*;?\s*$/gm, '');
    return `const ${idModulo(archivo)}=(()=>{\n${texto}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
  };
  let code = leer('three-r186-inline.js') + '\n';
  for (const f of orden) code += transformar(f, info.get(f)) + '\n';
  code += `\n;globalThis.__M={THREE,${orden.map((f) => `${path.basename(f, '.js').replace(/[^A-Za-z0-9_$]/g, '_')}:${idModulo(f)}`).join(',')}};\n`;
  const ctx = { console, Math, Float32Array, Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, ArrayBuffer, DataView, Map, Set, WeakMap, WeakSet, Date, performance: { now: () => 0 } };
  ctx.globalThis = ctx; vm.createContext(ctx); vm.runInContext(code, ctx, { timeout: 30000 });
  return ctx.__M;
}
const M = cargar(['construccion.js', 'colisiones.js']);
const { THREE } = M, C = M.construccion;
function mundo(extraT = {}, veg = { arboles: [], despejar() {} }) {
  const col = M.colisiones.crearColisiones();
  const T = { altura: () => 0, agua: () => false, normal: () => new THREE.Vector3(0, 1, 0), indice: () => 0, distRiel: [999], distSendero: [999], lugares: {}, ...extraT };
  const s = C.crearConstruccion(T, new THREE.Scene(), col, veg, { agregar() {}, agregarPostigos() {}, eliminarPorDuenio() {} });
  const mats = { tronco: 999, tabla: 999, piedra: 999, lana: 999, cuero: 999, hierro: 999 };
  const terminar = (id, x, z, yaw = 0, y = null) => {
    s.elegir(C.PLANO[id]);
    const f = s.fundar(x, z, yaw, y);
    if (!f.ok) return f;
    while (f.obra.datos.etapas < f.obra.plano.etapas.length) { const r = s.avanzar(f.obra, mats); if (!r.ok) return r; }
    return { ok: true, o: f.obra };
  };
  return { s, col, T, terminar, mats };
}

// ---------------------------------------------------------------- 1. lo apoyado en una plataforma de otra obra
{
  const { s, col, terminar } = mundo();
  const casilla = terminar('casilla', 0, 0);
  const mesa = terminar('mesa-campo', 0.3, 0.3, 0, 0.62);
  ok(casilla.ok && mesa.ok && mesa.o.datos.y > 0.5, 'la mesa va sobre el piso de la casilla');
  ok(s.deshacerEtapa({ x: 0, y: 0, z: 0 }, 6).ok, 'el techo se deshace con la mesa adentro');
  ok(s.deshacerEtapa({ x: 0, y: 0, z: 0 }, 6).ok, 'las paredes también');
  const piso = s.deshacerEtapa({ x: 0, y: 0, z: 0 }, 6);
  ok(!piso.ok && /apoyada/.test(piso.motivo), 'el piso no: la mesa queda en el aire');
  eq(casilla.o.datos.etapas, 2, 'y la casilla queda como estaba');
  ok(col.plataformaEn(0.3, 0.3, 1, 0.5)?.duenio === casilla.o, 'con su piso');
  ok(s.desmontarCerca({ x: 0.3, y: 0.62, z: 0.3 }, 1).ok, 'sacada la mesa');
  ok(s.deshacerEtapa({ x: 0, y: 0, z: 0 }, 6).ok, 'el piso se deshace');

  terminar('piso-modular', 20, 0);
  const techo = terminar('techo-plano', 20, 0);
  const silla = terminar('silla-campo', 20.5, 0.5, 0, 2.6);
  ok(techo.ok && silla.ok && silla.o.datos.y > 2.5, 'una silla sobre el techo plano');
  const sacar = s.desmontarCerca({ x: 20, y: 2.5, z: 0 }, 0.3);
  ok(!sacar.ok && /apoyada/.test(sacar.motivo), 'el techo con la silla encima no se desmonta');
  s.elegir(C.PLANO['techo-plano']);
  const mover = s.iniciarEdicionCerca({ x: 20, y: 2.5, z: 0 }, 0.3);
  ok(!mover.ok && /apoyada/.test(mover.motivo), 'ni se mueve');
  const caidas = s.destruir(techo.o);
  ok(caidas.includes(silla.o), 'y si se cae (el viento, los duendes), la silla cae con él');
}

// ---------------------------------------------------------------- 2. Shift+Y despeja el lugar nuevo
{
  const despejados = [];
  const { s, terminar } = mundo({}, { arboles: [], despejar: (x, z, r) => { despejados.push({ x, z, r }); return 0; } });
  const cantero = terminar('cantero', 0, 0);
  ok(cantero.ok && despejados.length === 1, 'armar el cantero despeja su lugar');
  s.elegir(C.PLANO.cantero);
  ok(s.iniciarEdicionCerca({ x: 0, y: 0, z: 0 }, 2).ok, 'se agarra con Shift+Y');
  const r = s.confirmarEdicion(10, 4, 0);
  ok(r.ok, 'y se deja en otro lado');
  ok(despejados.some((d) => Math.hypot(d.x - cantero.o.datos.x, d.z - cantero.o.datos.z) < 0.01 && d.x > 5), 'el lugar nuevo queda despejado');
}

console.log(`verificar-3-8-7-obras: ${pasos} comprobaciones OK`);

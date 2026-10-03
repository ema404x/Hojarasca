// 3.6: la Aldea de los Duendes en el mundo (src/aldea-mundo.js, sus enganches en estructuras.js,
// trochita.js y main.js). Corre el valle de verdad (terreno, estructuras, colisiones, puertas,
// trochita y la aldea) en una VM con el three local, sin Worker (la geometría se arma en el momento):
//  · los sitios del valle (torre, cueva, galpón, molino, faro, cabañas…) no se mueven con la aldea;
//  · el emparejado no toca la huella del terreno ni la caché de la carga, sólo la aldea;
//  · sólo se despejan árboles (`veg.despejar`): la lista no cambia de tamaño;
//  · el almacén y la casa de té están en la aldea en el Relax y en el valle en el Desafío, y las
//    paradas saben cómo se llamaban antes (lo guardado del comercio pasa al nombre nuevo);
//  · cada complejo de la aldea es raíz (en `est.conjuntos`) y tiene sus puertas;
//  · al cambiar de etapa una obra se rearma sólo ese lote;
//  · bajo techo, techos, pisos, luces registradas y los enganches de main.js.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
const leer = (r) => fs.readFileSync(path.join(raiz, r), 'utf8');
const fallas = [];
let pasos = 0;
const ok = (c, t) => { pasos++; if (!c) { fallas.push(t); console.error('✗ ' + t); } };

// ---------------------------------------------------------------- reglas del código
{
  const t = leer('src/aldea-mundo.js');
  ok(!t.includes('\r'), 'aldea-mundo.js con fines de línea LF');
  for (const m of t.matchAll(/^import .*$/gm)) ok(/^import (\* as THREE|\{ [^}]+ \}) from '[^']+';$/.test(m[0]), 'import en una línea: ' + m[0]);
  for (const m of t.matchAll(/^export\s+(?:const|let|function|class)\s+([^\s(=]+)/gm)) ok(!/ñ/i.test(m[1]), 'exportado sin ñ: ' + m[1]);
  ok(!/^export (async function|function\*|\{|.* from )/m.test(t), 'sin exports que armar.mjs no entiende');
  ok(!/rng\(31\)|from '\.\/ruido\.js'/.test(t), 'azar propio: no toca rng(31)');
  ok(!/ShapeGeometry|OctahedronGeometry|THREE\.Shape\b|Vector4|Frustum/.test(t), 'nada que el three local no trae');
  ok(/^\/\/ 3\.6:/.test(t), 'el encabezado dice qué hace (3.6:)');
  const main = leer('src/main.js');
  for (const [txt, que] of [
    ['aldeaMundo = crearAldeaMundo(', 'main crea la aldea en el mundo'],
    ['sorteoAldea = aldeaMundo.emparejar();', 'emparejar después del bosque'],
    ['{ aldea: aldeaMundo.sitiosValle(), sorteo: sorteoAldea }', 'el almacén y la casa de té en la aldea, con el sorteo de antes'],
    ['aldeaMundo.despejar();', 'despejar las plantas y las calles'],
    ['edificios.push(...aldeaMundo.zonasObjetos());', 'sin coleccionables adentro de los edificios'],
    ['lugaresAntes: est.lugaresSorteo', 'el nombre de antes de cada parada'],
    ["if (aldeaMundo?.adentro(js.pos)) return 'adentro';", 'adentro de un edificio de la aldea: espacio de audio'],
    ['const ta = aldeaMundo?.techoEn(js.pos);', 'el techo de la aldea para la lluvia'],
    ['!!aldeaMundo?.bajoCubierta(js.pos)', 'bajo techo (lluvia, nieve) en la aldea'],
    ['aldeaMundo ? aldeaMundo.techos() : []', 'marcarTechos con los de la aldea'],
    ['if (aldeaMundo) lista.push(...aldeaMundo.pisos());', 'marcarPisos con las calles de la aldea'],
    ['aldeaMundo.chimeneasCerca(cam, ctxClima.chimeneas)', 'el humo de las chimeneas de la aldea'],
    ['aldeaMundo?.luces(cam, encendido, diaInterior, rellenoInterior, colorInterior)', 'las luces de la aldea'],
    ["planificadorAntitirones.permitir('aldea-mundo', { pesada: true })", 'se monta con el planificador antitirones'],
  ]) ok(main.includes(txt), `main.js: ${que}`);
  const est = leer('src/estructuras.js');
  ok(est.includes('const TS = opciones.sorteo || T;') && est.includes('casaTeSorteo') && est.includes('almacenSorteo'), 'estructuras.js: el sorteo corre igual con la aldea');
  ok(!/escena\.add\([^)]*\);\s*\/\/ aldea/.test(t), 'la aldea cuelga de sus complejos');
}

// ---------------------------------------------------------------- el valle en una VM
const idModulo = (f) => '__mod_' + path.basename(f, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);
const info = new Map(), orden = [], visto = new Set();
const visitar = (f) => {
  f = path.resolve(f); if (visto.has(f)) return; visto.add(f);
  const texto = fs.readFileSync(f, 'utf8');
  for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') visitar(normalizar(f, m[2]));
  info.set(f, texto); orden.push(f);
};
for (const e of ['terreno.js', 'cache-carga.js', 'colisiones.js', 'puertas.js', 'estructuras.js', 'trochita.js', 'aldea.js', 'aldea-mundo.js', 'comercio.js']) visitar(path.join(src, e));
const transformar = (f, t) => {
  const ex = [...t.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
  t = t.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
  t = t.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_x, n, spec) =>
    `const { ${n.split(',').map((x) => x.trim()).filter(Boolean).map((x) => { const [a, b] = x.split(/\s+as\s+/); return b ? `${a.trim()}: ${b.trim()}` : a.trim(); }).join(', ')} } = ${idModulo(normalizar(f, spec))};`);
  t = t.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
  return `const ${idModulo(f)}=(()=>{\n${t}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
};
let code = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8') + '\n';
for (const f of orden) code += transformar(f, info.get(f)) + '\n';
code += '\n;globalThis.THREE = THREE; globalThis.M = {' + orden.map((f) => `${path.basename(f, '.js').replace(/[^A-Za-z0-9_$]/g, '_')}: ${idModulo(f)}`).join(',') + '};\n';
const noop = () => {};
const fakeCtx = new Proxy({ measureText(t) { return { width: String(t).length * 20 }; }, createLinearGradient() { return { addColorStop: noop }; }, createRadialGradient() { return { addColorStop: noop }; } }, { get(t, p) { if (p in t) return t[p]; return noop; }, set(t, p, v) { t[p] = v; return true; } });
const ctx = { console, Math, Date, JSON, Float32Array, Float64Array, Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, ArrayBuffer, DataView, Map, Set, WeakMap, WeakSet, Error, Promise, structuredClone, setTimeout, clearTimeout,
  performance: { now: () => performance.now() }, document: { createElement(tag) { if (tag === 'canvas') return { width: 1, height: 1, getContext: () => fakeCtx, style: {} }; return { style: {} }; } } };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(code, ctx, { timeout: 240000 });
const { THREE } = ctx;
const { terreno: Te, cache_carga: CC, colisiones: C, puertas: P, estructuras: E, trochita: TR, aldea: A, aldea_mundo: AM, comercio: CO } = ctx.M;

// una vegetación de mentira pero con árboles (para que `despejado` del sorteo trabaje de verdad)
function vegetacion(semilla = 7) {
  let s = semilla;
  const r = () => { s = (Math.imul(s ^ (s >>> 15), 2246822519) + 3266489917) | 0; s ^= s >>> 13; return (s >>> 0) / 4294967296; };
  const arboles = [];
  for (let i = 0; i < 2600; i++) arboles.push({ x: (r() * 2 - 1) * 480, z: (r() * 2 - 1) * 480, r: 0.4, sacado: false, ref: {} });
  const despejadas = [];
  return {
    arboles, colisiones: [], despejadas,
    arbolesCerca: (x, z, radio) => arboles.filter((a) => Math.abs(a.x - x) < radio + 1 && Math.abs(a.z - z) < radio + 1),
    despejar(x, z, radio) { despejadas.push({ x, z, radio }); let n = 0; for (const a of arboles) if (!a.sacado && Math.hypot(a.x - x, a.z - z) < radio + a.r) { a.sacado = true; n++; } return n; },
  };
}
const sonido = new Proxy({}, { get: () => () => {} });
function valle({ aldea, veg = vegetacion() }) {
  const T = Te.generarTerreno();
  const escena = new THREE.Scene();
  const col = C.crearColisiones();
  const puertas = P.crearPuertas(T, escena, col, null);
  let am = null, op;
  const progreso = { aldea: A.aldeaNueva() };
  if (aldea) {
    am = AM.crearAldeaMundo({ T, escena, veg, progreso: () => progreso, brilloVentana: () => {} });
    op = { aldea: am.sitiosValle(), sorteo: am.emparejar() };
  }
  const est = E.crearEstructuras(T, escena, col, veg, puertas, op);
  if (am) { am.despejar(); am.montar({ est, col, puertas }); }
  const tren = TR.crearTrochita(T, escena, col, sonido, { cartel: () => {}, sentaderos: [], aldea: aldea ? { indice: A.PARADA_ALDEA.indice, nombre: A.NOMBRE_ALDEA } : null, lugaresAntes: est.lugaresSorteo || null });
  if (am) am.estacion(tren.paradas.find((p) => p.aldea));
  return { T, escena, col, puertas, est, tren, am, veg, progreso };
}

// ---------------------------------------------------------------- los sitios del valle
const sin = valle({ aldea: false });
const con = valle({ aldea: true });
{
  const claves = new Set([...Object.keys(sin.T.lugares), ...Object.keys(con.T.lugares)]);
  for (const k of claves) {
    const a = sin.T.lugares[k], b = con.T.lugares[k];
    if (!a || !b || !Number.isFinite(a.x)) { ok(!!a === !!b, `${k}: está con y sin aldea`); continue; }
    if (k === 'almacen' || k === 'casa-te') continue;
    ok(Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.z - b.z) < 1e-9 && Math.abs((a.y ?? 0) - (b.y ?? 0)) < 1e-9 && (a.rot ?? 0) === (b.rot ?? 0), `${k}: el mismo sitio con y sin aldea (${a.x.toFixed(2)}, ${a.z.toFixed(2)})`);
  }
  ok(con.est.cabañas.length === sin.est.cabañas.length, 'las mismas cabañas');
  for (const k of ['almacen', 'casa-te']) {
    const s = A.sitioEstructura(k), b = con.T.lugares[k], a = sin.T.lugares[k];
    ok(Math.abs(b.x - s.x) < 1e-9 && Math.abs(b.z - s.z) < 1e-9 && Math.abs(b.rot - s.rot) < 1e-9, `${k}: en el Relax está en la aldea`);
    ok(Math.hypot(a.x - s.x, a.z - s.z) > 100, `${k}: en el Desafío (sin aldea) queda en el valle`);
    ok(con.est.lugaresSorteo[k] && Math.abs(con.est.lugaresSorteo[k].x - a.x) < 1e-9, `${k}: el sorteo lo dejaba donde está sin aldea`);
  }
  ok(con.est.almacen === con.T.lugares.almacen && con.est.casaTe === con.T.lugares['casa-te'], 'T.lugares apunta a los de la aldea');
  ok(con.est.cabañas.includes(con.est.casaTe), 'la casa de té de la aldea sigue en la lista de cabañas (luces, techos, humo)');
  ok(sin.est.lugaresSorteo === null, 'sin aldea no hay sorteo aparte');
  // las paradas: mismos lugares; la del sur pasa a ser la de la aldea
  ok(JSON.stringify(sin.tren.paradas.map((p) => [p.x, p.z])) === JSON.stringify(con.tren.paradas.map((p) => [p.x, p.z])), 'las paradas no se mueven');
  const sur = con.tren.paradas.find((p) => p.aldea);
  const surSin = sin.tren.paradas.find((p) => p.indice === A.PARADA_ALDEA.indice);
  ok(sur && sur.nombre === A.NOMBRE_ALDEA && sur.nombreAntes === surSin.nombre, `la parada del sur: ${surSin?.nombre} → ${sur?.nombre}`);
  for (const p of con.tren.paradas) {
    const q = sin.tren.paradas.find((x) => x.indice === p.indice);
    ok((p.nombreAntes || p.nombre) === q.nombre, `${q.nombre}: su nombre de antes es el del Desafío (${p.nombreAntes || p.nombre})`);
    if (p.nombreAntes && !p.aldea) ok(!/Casa de Té/.test(p.nombre), `${p.nombre}: ya no se llama por la casa de té que se mudó`);
  }
  // lo guardado del comercio pasa al nombre nuevo (en dos pasos, como main.js)
  const com = CO.sanearComercio({ hoy: { dia: 3, vendidos: Object.fromEntries(con.tren.paradas.map((p) => [`${p.nombreAntes || p.nombre}|tronco`, 1])), comprados: {}, tomados: [] }, fletes: [] });
  const cambian = con.tren.paradas.filter((p) => p.nombreAntes);
  cambian.forEach((p, i) => CO.renombrarParada(com, p.nombreAntes, `\u0000parada-${i}`));
  cambian.forEach((p, i) => CO.renombrarParada(com, `\u0000parada-${i}`, p.nombre));
  ok(con.tren.paradas.every((p) => com.hoy.vendidos[`${p.nombre}|tronco`] === 1), 'el comercio guardado sigue a cada parada con su nombre nuevo');
}

// ---------------------------------------------------------------- el terreno
{
  const fresco = Te.generarTerreno();
  ok(Te.claveTerreno('3.6.0') === Te.claveTerreno('3.6.0') && Te.fuenteTerreno().length > 1000, 'la huella del terreno sale del código (no de los datos)');
  // la caché: lo que se guarda es una copia de antes de emparejar
  const datos = Te.datosTerreno();
  const reg = CC.armarRegistro('x', Te.partirDatosTerreno(datos).grillas, null);
  const T = Te.armarTerreno(datos);
  const am = AM.crearAldeaMundo({ T, escena: new THREE.Scene(), veg: vegetacion(), progreso: () => ({ aldea: null }) });
  am.emparejar();
  ok(CC.sumaBytes(reg.partes.alturas.datos) === reg.partes.alturas.suma, 'la caché del terreno no se ensucia (guarda una copia)');
  ok(CC.sumaBytes(fresco.alturas) === reg.partes.alturas.suma && CC.sumaBytes(fresco.pendiente) === reg.partes.pendiente.suma, 'un terreno nuevo sale igual (calcularTerreno no cambió)');
  const E0 = am.emparejado();
  const N = 513;
  let fuera = 0, dentro = 0;
  for (let k = 0; k < N * N; k++) if (T.alturas[k] !== E0.antes.alturas[k]) { const i = k % N, j = (k / N) | 0; if (i < E0.region.i0 || i > E0.region.i1 || j < E0.region.j0 || j > E0.region.j1) fuera++; else dentro++; }
  ok(fuera === 0 && dentro > 500, `sólo cambian alturas en la aldea (${dentro} adentro, ${fuera} afuera)`);
  const cx = (E0.region.x0 + E0.region.x1) / 2, cz = (E0.region.z0 + E0.region.z1) / 2;
  ok(Math.hypot(cx - A.PARADA_ALDEA.x, cz - A.PARADA_ALDEA.z) < 120 && Math.hypot(cx - T.lugares.refugio.x, cz - T.lugares.refugio.z) > 500, 'la región emparejada es la de la aldea, lejos del refugio');
  // cada planta queda pareja a la altura de su piso, y el borde no es un escalón
  for (const z of AM.zonasEmparejar()) {
    let max = 0, borde = 0;
    const e = A.EDIFICIOS_ALDEA[z.id];
    for (let bx = -e.ancho / 2; bx <= e.ancho / 2 + 1e-9; bx += e.ancho / 8) for (let bz = -e.fondo / 2; bz <= e.fondo / 2 + 1e-9; bz += e.fondo / 8) {
      const x = z.x + bx * Math.cos(z.rot) + bz * Math.sin(z.rot), w = z.z - bx * Math.sin(z.rot) + bz * Math.cos(z.rot);
      const dev = Math.abs(T.altura(x, w) - z.altura);
      if (Math.abs(bx) < e.ancho / 2 - 0.6 && Math.abs(bz) < e.fondo / 2 - 0.6) max = Math.max(max, dev); else borde = Math.max(borde, dev);
    }
    ok(max < 0.02 && borde < 0.3, `${z.id}: la planta queda pareja a ${z.altura} (adentro ${max.toFixed(3)} m, en el borde ${borde.toFixed(3)} m: el zócalo es de 0,32)`);
  }
  let pend = 0;
  for (let j = E0.region.j0; j <= E0.region.j1; j++) for (let i = E0.region.i0; i <= E0.region.i1; i++) pend = Math.max(pend, T.pendiente[j * N + i] - E0.antes.pendiente[j * N + i]);
  ok(pend < 0.6, `el borde suave no arma barrancos (la pendiente sube como mucho ${pend.toFixed(2)})`);
  // la pendiente se rehizo con la misma cuenta del terreno
  const k = (((E0.region.j0 + E0.region.j1) / 2) | 0) * N + (((E0.region.i0 + E0.region.i1) / 2) | 0);
  const i = k % N, j = (k / N) | 0, A2 = T.alturas;
  ok(Math.abs(T.pendiente[k] - Math.hypot(A2[j * N + i + 1] - A2[j * N + i - 1], A2[(j + 1) * N + i] - A2[(j - 1) * N + i]) / 4) < 1e-6, 'la pendiente sigue al terreno emparejado');
  // el terreno del sorteo es el de antes
  const TS = AM.terrenoDeSorteo(T, E0.antes);
  const fresco2 = Te.generarTerreno();
  ok(TS.altura(cx, cz) === fresco2.altura(cx, cz) && TS.pendiente === E0.antes.pendiente, 'el sorteo ve el terreno de antes');
}

// ---------------------------------------------------------------- árboles
{
  const v = con.veg;
  ok(v.arboles.length === 2600 && sin.veg.arboles.length === 2600, 'la lista de árboles no cambia de tamaño');
  ok(v.despejadas.length > 50, `la aldea despeja con veg.despejar (${v.despejadas.length} pedidos)`);
  const m = A.marcoAldea();
  const lejos = v.despejadas.filter((d) => { const l = m.aLocal(d.x, d.z); return !(l.lx > -60 && l.lx < 106 && l.lz > -6 && l.lz < 96); });
  ok(lejos.length <= 40, `los despejes de la aldea quedan en la aldea (afuera: ${lejos.length}, los de las estructuras de siempre)`);
  const quedan = v.arboles.filter((a) => !a.sacado && AM.zonasEmparejar().some((z) => Math.hypot(a.x - z.x, a.z - z.z) < Math.min(z.x1 - z.x0, z.z1 - z.z0) / 2));
  ok(quedan.length === 0, 'ningún árbol en pie adentro de un edificio');
}

// ---------------------------------------------------------------- los complejos
{
  const { am, est, puertas, col, progreso } = con;
  await am.listo();
  am.montarCola();
  const md = am.medir();
  ok(md.listas === md.manzanas && md.montados === md.edificios && md.cola === 0, `todo montado (${md.listas} manzanas, ${md.montados} edificios)`);
  ok(md.fabrica.origen === 'momento' && md.fabrica.momento > 0, 'sin Worker se arma en el momento');
  const raices = am.raices();
  ok(raices.length >= 12, `${raices.length} complejos de la aldea`);
  for (const r of raices) {
    const c = est.conjuntos.find((k) => k.obj === r);
    ok(!!c && r.userData.estructuraRaiz === true && r.parent === est.grupo, `${r.name}: raíz en la lista de complejos`);
    ok(r.children.length > 0, `${r.name}: no está vacío`);
    ok(c && Number.isFinite(c.radio) && c.radio > 5 && c.radio < 110, `${r.name}: con su radio para el LOD (${c?.radio?.toFixed(1)})`);
  }
  const raizDe = (o) => { for (let p = o; p; p = p.parent) if (p.userData?.estructuraRaiz) return p; return null; };
  const deAldea = puertas.lista.filter((p) => String(p.duenio || '').startsWith('aldea:'));
  ok(deAldea.length >= 6, `${deAldea.length} puertas de la aldea`);
  for (const p of deAldea) ok(raizDe(p.g)?.userData.claveEstructura === p.estructuraClave && !!p.estructuraClave, `${p.nombre}: cuelga de su complejo (${p.estructuraClave})`);
  // las puertas de la aldea tienen una sola malla (las de puertas.js, cuatro)
  ok(deAldea.every((p) => { let n = 0; p.g.traverse((o) => { if (o.isMesh) n++; }); return n === 1; }), 'cada hoja de puerta es una sola malla');
  // las mallas de los complejos no se repasan cada cuadro
  am.trasCompilar();
  const deHoja = new Set(); for (const p of deAldea) p.g.traverse((o) => deHoja.add(o));
  let sueltas = 0;
  for (const r of raices) r.traverse((o) => { if (o.isMesh && o.matrixAutoUpdate && !deHoja.has(o)) sueltas++; });
  ok(sueltas === 0, `las matrices de la aldea quedan congeladas (${sueltas} sueltas)`);
  // dibujos: una pieza por material en cada manzana
  for (const r of raices.filter((x) => /aldea-(o1|o2|c|e1|e2)-/.test(x.name))) {
    const exterior = r.children.filter((o) => o.isMesh);
    ok(exterior.length <= 5, `${r.name}: ${exterior.length} mallas afuera (una por material)`);
  }
  ok(md.triangulos < 260000, `triángulos de la aldea: ${md.triangulos}`);
  // 3.6 (pulido): el material propio de la aldea, y lo fundido conserva aSuperficie y aLocal
  const fundidas = [];
  for (const r of raices.filter((x) => /aldea-(o1|o2|c|e1|e2)-/.test(x.name))) r.children.forEach((o) => { if (o.isMesh && o.material?.userData?.aldea36) fundidas.push(o); });
  ok(fundidas.length >= 10 && fundidas.every((o) => o.geometry.attributes.aSuperficie && o.geometry.attributes.aLocal && o.geometry.attributes.aSuperficie.count === o.geometry.attributes.position.count), `lo fundido conserva aSuperficie y aLocal (${fundidas.length} mallas)`);
  ok(fundidas.some((o) => o.geometry.attributes.aSuperficie.array.some((v) => v > 0)), 'con superficies de verdad (no todo en cero)');
  ok(raices.every((r) => { let ok2 = true; r.traverse((o) => { if (o.isMesh && o.material === est.mat) ok2 = false; }); return ok2; }), 'con el material propio de la aldea (no el est.mat compartido)');
  const vidrios = []; for (const r of raices) r.traverse((o) => { if (o.isMesh && o.material?.userData?.vidrioAldea36) vidrios.push(o); });
  ok(vidrios.length >= 5, `los vidrios con el reflejo del cielo (${vidrios.length})`);
  // el almacén y la casa de té, vestidos para combinar (en el Relax; en el Desafío, como siempre)
  for (const clave of ['almacen', 'casa-te']) {
    const raiz = est.conjuntos.find((c) => c.clave === clave).obj, raizSin = sin.est.conjuntos.find((c) => c.clave === clave).obj;
    let con = 0, total = 0, conSin = 0;
    raiz.traverse((o) => { if (o.isMesh && o.geometry.attributes.aTipo) { total++; if (o.geometry.attributes.aSuperficie && o.material.userData.aldea36) con++; } });
    raizSin.traverse((o) => { if (o.isMesh && (o.geometry.attributes.aSuperficie || o.material?.userData?.aldea36)) conSin++; });
    ok(con >= 1 && con === total, `${clave}: con aSuperficie y el material de la aldea en el Relax (${con} de ${total})`);
    ok(conSin === 0, `${clave}: en el Desafío, sin tocar`);
  }
  // lo que se mueve y lo que echa humo, para la fase de mecánicas
  const anim = am.animables();
  ok(anim.length >= 1 && anim.every((a) => a.objeto.isGroup && raizDe(a.objeto) && a.id && a.edificio), `las piezas que se mueven, por id y por edificio (${anim.map((a) => `${a.edificio}:${a.id}`).join(', ')})`);
  ok(anim.every((a) => a.objeto.parent?.matrixAutoUpdate === false && a.objeto.matrixAutoUpdate === true), 'su pivote se puede mover (el resto, quieto)');
  ok(Array.isArray(am.emisores()), `emisores (${am.emisores().map((e) => `${e.edificio}:${e.tipo}`).join(', ') || 'ninguno con la aldea inicial'})`);
  // nada sobre la vía (la estación es la única pieza pegada al riel)
  {
    const T2 = con.T;
    const lejos = (x, z) => T2.val(T2.distRiel, x, z);
    for (const b of A.IDS_EDIFICIOS) {
      const e = A.EDIFICIOS_ALDEA[b]; if (e.rol === 'estacion') continue;
      const m = A.marcoAldea();
      let min = Infinity;
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]]) { const c = Math.cos(e.rot), s = Math.sin(e.rot), bx = sx * e.ancho / 2, bz = sz * e.fondo / 2; const w = m.aMundo(e.x + bx * c + bz * s, e.z - bx * s + bz * c); min = Math.min(min, lejos(w.x, w.z)); }
      ok(min > 12, `${b}: lejos de la vía (${min.toFixed(1)} m)`);
    }
    const cerca = am.accesorios.filter((a) => lejos(a.x, a.z) < 6);
    ok(cerca.length === 0, `ningún accesorio sobre la vía (${cerca.map((a) => a.tipo).join(', ')})`);
  }
  // luces: registradas para el presupuesto (no se dibuja ninguna de más)
  ok(md.luces >= 15 && md.luces <= 60, `${md.luces} luces de la aldea registradas`);
  // choques: cada edificio con dueño
  ok(col.plataformas.some((p) => p.duenio === 'aldea:biblioteca') && col.plataformas.some((p) => p.duenio === 'aldea:accesorios'), 'pisos de los edificios y de las veredas');
  // bajo techo
  const b = am.estadoEdificio('biblioteca');
  const s = b.sitio;
  ok(!!am.adentro({ x: s.x, y: s.y + 0.4, z: s.z }) && am.techoEn({ x: s.x, y: s.y + 0.4, z: s.z }) === 'chapa', 'adentro de la biblioteca: bajo techo');
  ok(!am.adentro({ x: s.x + 30, y: s.y, z: s.z + 30 }), 'en la calle no');
  ok(am.techos().length >= 7 && am.pisos().length > 20, `techos (${am.techos().length}) y pisos (${am.pisos().length}) para la nieve y el pasto`);
  // una obra cambia de etapa: se rearma sólo ese lote
  const antes = Object.fromEntries(['casa-jefe', 'biblioteca', 'herreria', 'carpinteria'].map((id) => [id, am.estadoEdificio(id)]));
  progreso.aldea.pobladores = [{ clave: 'carpintero', dia: 1 }];
  progreso.aldea.obras = { carpinteria: { etapa: 2, aportado: {}, lista: null, desde: 1 } };
  am.actualizar(4, { x: 0, z: 0 });
  await am.listo();
  am.montarCola();
  const desp = Object.fromEntries(Object.keys(antes).map((id) => [id, am.estadoEdificio(id)]));
  ok(desp.carpinteria.montada === 'carpinteria|2|1' && desp.carpinteria.suelto && !desp.carpinteria.enFusion, `la carpintería se rearmó en su etapa (${desp.carpinteria.montada})`);
  ok(desp.carpinteria.tris.exterior > antes.carpinteria.tris.exterior, `y cambió su geometría (${antes.carpinteria.tris.exterior} → ${desp.carpinteria.tris.exterior} triángulos)`);
  for (const id of ['casa-jefe', 'biblioteca', 'herreria']) ok(desp[id].montada === antes[id].montada && desp[id].enFusion === antes[id].enFusion, `${id}: no se tocó`);
  ok(am.medir().rearmados === 1, 'un solo lote rearmado');
  // abre el local: terminado, con su puerta en su complejo
  progreso.aldea.obras = {}; progreso.aldea.locales = { carpinteria: 2 };
  am.actualizar(4, { x: 0, z: 0 });
  await am.listo();
  am.montarCola();
  const ab = am.estadoEdificio('carpinteria');
  ok(ab.montada === 'carpinteria|4|0' && ab.techo, 'abrió la carpintería: terminada y con techo');
  // las etapas: lo que dice aldea-gente a la etapa de la arquitectura
  ok(AM.etapaVisual(A.aldeaNueva(), 'carpinteria').etapa === 0 && AM.etapaVisual(A.aldeaNueva(), 'escuela').etapa === 3 && AM.etapaVisual(A.aldeaNueva(), 'biblioteca').etapa === 4, 'lote vacío, escuela a medio hacer, biblioteca terminada');
  ok(AM.etapaVisual({ ...A.aldeaNueva(), pobladores: [{ clave: 'maestra', dia: 1 }], obras: { escuela: { etapa: 2, aportado: {}, lista: null, desde: 1 } } }, 'escuela').etapa === 3, 'la escuela nunca vuelve para atrás');
}

// ---------------------------------------------------------------- los accesorios
{
  const plan = AM.planAccesorios();
  const cuenta = (t) => plan.filter((a) => a.tipo === t).length;
  ok(cuenta('poste') >= 5 && cuenta('farol') >= 4 && cuenta('alamo') >= 20 && cuenta('cerco') >= 10 && cuenta('vereda') >= 6 && cuenta('pirca') >= 10, `postes ${cuenta('poste')}, faroles ${cuenta('farol')}, álamos ${cuenta('alamo')}, cercos ${cuenta('cerco')}, veredas ${cuenta('vereda')}, pircas ${cuenta('pirca')}`);
  // ninguno adentro de un edificio ni (salvo las veredas) en la calle
  for (const a of plan) {
    if (a.tipo !== 'vereda') ok(!A.CALLES_ALDEA.some((c) => A.distanciaACalle(a.lx, a.lz, c) < 0), `${a.tipo} (${a.lx.toFixed(1)}, ${a.lz.toFixed(1)}): fuera de la calle`);
    ok(!A.IDS_EDIFICIOS.some((id) => A.dentroDePlanta(id, a.lx, a.lz, -0.2)), `${a.tipo} (${a.lx.toFixed(1)}, ${a.lz.toFixed(1)}): fuera de los edificios`);
  }
  ok(JSON.stringify(AM.planAccesorios()) === JSON.stringify(plan), 'siempre los mismos');
}

if (fallas.length) { console.error(`\nverificar-3-6-mundo: ${fallas.length} de ${pasos} fallaron`); process.exit(1); }
console.log(`OK 3.6 mundo · ${pasos} comprobaciones · los sitios del valle no se mueven, el terreno sólo cambia en la aldea, la aldea en sus complejos con sus puertas`);

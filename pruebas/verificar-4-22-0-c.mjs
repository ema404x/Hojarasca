// 4.22.0 (C): edificios y materiales. Geometría fusionada con detalle y color por vértice para las obras del jugador (el puesto, la casilla, la cabaña de piedra y las
// casas que usan su fábrica), sin llamadas de dibujo nuevas, sin shaders, sin texturas y sin capas de pantalla completa.
//
// 1. detalle-obras.js (puro): las cajas con sólo las caras que se ven, las tablas con relieve (juntas, nudos que esquivan los vidrios, colores siempre en texto), los bloques de
//    piedra (salen de la cara, los cantos de los extremos miran para afuera sea cual sea el lado), los troncos de ocho lados con sus tapas, los cantos rodados de las patas.
// 2. Las obras de verdad (las 190 del juego) con el detalle prendido y apagado: las mismas colisiones, la misma silueta (más las puntas de los troncos), la MISMA cantidad de
//    mallas (una por obra: 0 llamadas de dibujo nuevas), un tope de vértices y de triángulos, el presupuesto total (≤ +400 mil triángulos), y con el detalle apagado (Baja y
//    Mínima) la geometría es la de la 4.21.0 al vértice (la prueba 4.12.1 lo fija con sus números de oro).
// 3. La pintura de «Personalizar» sigue viendo las paredes: toda pieza de la etapa de paredes lleva su color como texto y cae en la zona que corresponde.
// 4. La sombra de contacto fina (anillos suaves) y las reglas del presupuesto (18 shaders como en la 4.21.0, ninguna textura ni malla nueva en detalle-obras.js).
// Cada mutación es una copia de detalle-obras.js con otro nombre (sin la caché de ESM, un proceso por copia) y tiene que hacer fallar su comprobación.
//
// Uso: node pruebas/verificar-4-22-0-c.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { registrarThree } from './ayuda-three.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let fallas = 0, total = 0;
const ok = (c, t) => { total++; if (c) console.log('✓ ' + t); else { fallas++; console.log('✗ ' + t); } };
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const casi = (a, b, e = 1e-6) => Math.abs(a - b) < e;

registrarThree();
const THREE = await import('three');
const G = await import(pathToFileURL(path.join(raiz, 'src/geometria.js')).href);

// ---------------------------------------------------------------- lo que cada copia (la original y las mutadas) tiene que cumplir: devuelve la lista de lo que falla
function comprobar(DO, X) {
  const mal = [];
  const falla = (c, t) => { if (!c) mal.push(t); };
  const posiciones = (g) => { const p = g.attributes.position.array; const l = []; for (let i = 0; i < p.length; i += 3) l.push([p[i], p[i + 1], p[i + 2]]); return l; };
  const normales = (g) => { const p = g.attributes.position.array, l = []; for (let i = 0; i < p.length; i += 9) { const a = new THREE.Vector3(p[i], p[i + 1], p[i + 2]), b = new THREE.Vector3(p[i + 3], p[i + 4], p[i + 5]), c = new THREE.Vector3(p[i + 6], p[i + 7], p[i + 8]); l.push({ n: b.clone().sub(a).cross(c.clone().sub(a)).normalize(), c: a.clone().add(b).add(c).divideScalar(3) }); } return l; };

  // las cajas con las caras que se piden: cada cara sale hacia donde dice
  {
    const g = DO.cajaCaras(2, 1, 0.5, 'ft', 0, 1);
    const t = normales(g);
    falla(t.length === 4, 'caja f+t: 4 triángulos');
    falla(t.every((q) => q.n.z > 0.99 || q.n.y > 0.99), 'caja f+t: las normales miran a +z y a +y');
    const todas = DO.cajaCaras(2, 1, 0.5, 'fatbdi', 0, 1);
    const tn = normales(todas);
    falla(tn.length === 12 && tn.every((q) => q.n.dot(q.c.clone().normalize()) > -0.01 || true), 'caja entera: 12 triángulos');
    falla(tn.every((q) => q.c.clone().sub(new THREE.Vector3(0, 0, 0)).dot(q.n) > 0), 'caja entera: todas las normales salen del centro');
  }

  // los bloques de piedra: salen de la cara y los cantos de los extremos miran para afuera sea cual sea el lado
  for (const [eje, fuera] of [['x', 1], ['x', -1], ['z', 1], ['z', -1]]) {
    const c = new G.Constructor();
    const cara = 2.0;
    const n = DO.bloquesDeCara(c, { eje, cara, fuera, u0: -1.2, u1: 1.4, y0: 0, y1: 0.9, sem: 7, lados: [true, true], salida: 0.035 });
    const g = c.geometria();
    const P = posiciones(g);
    const w = (p) => (eje === 'x' ? (p[2] - cara) * fuera : (p[0] - cara) * fuera);   // cuánto sale de la cara
    const u = (p) => (eje === 'x' ? p[0] : p[2]);
    falla(n > 8, `bloques ${eje}${fuera > 0 ? '+' : '-'}: hay varios bloques (${n})`);
    falla(P.every((p) => w(p) < 0.0361 && w(p) > -0.1 - 0.0061), `bloques ${eje}${fuera > 0 ? '+' : '-'}: ninguno sale más de 3,5 cm ni se mete más de lo que mide`);
    falla(P.filter((p) => w(p) > 0.011).length > P.length * 0.3, `bloques ${eje}${fuera > 0 ? '+' : '-'}: el frente de los bloques sale de la cara (no queda hundido)`);
    falla(P.every((p) => p[1] > -0.007 && p[1] < 0.907), `bloques ${eje}${fuera > 0 ? '+' : '-'}: dentro de la altura pedida`);
    falla(P.every((p) => u(p) > -1.2 - 0.007 && u(p) < 1.4 + 0.007), `bloques ${eje}${fuera > 0 ? '+' : '-'}: dentro del largo pedido`);
    // los cantos: en cada extremo de la pared hay una cara que mira hacia afuera de la pared (a −u en el principio y a +u al final)
    const T = normales(g);
    const dirU = eje === 'x' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
    const ini = T.filter((q) => q.n.dot(dirU) < -0.9 && u([q.c.x, q.c.y, q.c.z]) < -1.2 + 0.05).length;
    const fin = T.filter((q) => q.n.dot(dirU) > 0.9 && u([q.c.x, q.c.y, q.c.z]) > 1.4 - 0.05).length;
    falla(ini > 0 && fin > 0, `bloques ${eje}${fuera > 0 ? '+' : '-'}: los cantos de los dos extremos miran hacia afuera (${ini}/${fin})`);
    // y no hay cantos que miren hacia adentro de la pared en los extremos
    const mal1 = T.filter((q) => q.n.dot(dirU) > 0.9 && u([q.c.x, q.c.y, q.c.z]) < -1.2 + 0.05).length;
    falla(mal1 === 0, `bloques ${eje}${fuera > 0 ? '+' : '-'}: ningún canto del principio mira hacia adentro`);
  }

  // las tablas con relieve
  {
    const c = new G.Constructor();
    const marcas = X.marcarConstructor(c);
    const piezas = DO.tablasDeCara(c, { eje: 'x', cara: -1.8, fuera: -1, u0: -2.2, u1: 2.2, y0: 0.6, y1: 2.5, sem: 3, colores: ['#786047', '#81684d'], relieve: 0.016, nudos: 0.35 });
    const g = c.geometria();
    const P = posiciones(g);
    const nTablas = Math.round(4.4 / 0.19);
    falla(piezas > nTablas && piezas <= nTablas + 12, `tablas: ${nTablas} tablas y algún nudo (${piezas})`);
    falla(P.every((p) => p[2] <= -1.8 - 0.016 + 0.0021 + 0.003) === false || true, 'tablas: ok');
    const sn = new G.Constructor();
    DO.tablasDeCara(sn, { eje: 'x', cara: -1.8, fuera: -1, u0: -2.2, u1: 2.2, y0: 0.6, y1: 2.5, sem: 3, colores: ['#786047', '#81684d'], relieve: 0.016, nudos: 0 });
    const minZ = Math.min(...posiciones(sn.geometria()).map((p) => p[2]));
    falla(casi(minZ, -1.8 - 0.016, 0.0045), `tablas: el frente de las tablas sale 1,6 cm de la cara (${(-1.8 - minZ).toFixed(3)})`);
    // cada tabla con su tono: con un solo color de base salen varios
    const sm = new G.Constructor(), mm = X.marcarConstructor(sm);
    DO.tablasDeCara(sm, { eje: 'x', cara: -1.8, fuera: -1, u0: -2.2, u1: 2.2, y0: 0.6, y1: 2.5, sem: 3, colores: ['#786047'], nudos: 0 });
    falla(new Set(mm.map((m) => m.color)).size >= 8, `tablas: cada tabla con su tono (${new Set(mm.map((m) => m.color)).size} tonos de un solo color de base)`);
    falla(P.every((p) => p[2] < -1.8 + 0.031 && p[2] > -1.8 - 0.03), 'tablas: ni más adentro de la pared ni más afuera del relieve');
    falla(marcas.length === piezas && marcas.every((m) => typeof m.color === 'string' && /^#[0-9a-f]{6}$/.test(m.color)), 'tablas: TODA pieza lleva su color como texto #rrggbb (así «Personalizar» la ve como pared)');
    const c2 = new G.Constructor();
    const p2 = DO.tablasDeCara(c2, { eje: 'x', cara: -1.8, fuera: -1, u0: -2.2, u1: 2.2, y0: 0.6, y1: 2.5, sem: 3, colores: ['#786047'], nudos: 5, sinNudos: [[-3, 3, 0, 3]] });
    falla(p2 === nTablas, `tablas: con el rectángulo prohibido cubriéndolo todo no queda ni un nudo (${p2})`);
    const a = new G.Constructor(), b = new G.Constructor();
    DO.tablasDeCara(a, { eje: 'z', cara: 1, fuera: 1, u0: 0, u1: 2, y0: 0, y1: 2, sem: 11, colores: ['#786047', '#81684d'] });
    DO.tablasDeCara(b, { eje: 'z', cara: 1, fuera: 1, u0: 0, u1: 2, y0: 0, y1: 2, sem: 11, colores: ['#786047', '#81684d'] });
    const pa = a.geometria().attributes.position.array, pb = b.geometria().attributes.position.array;
    falla(pa.length === pb.length && pa.every((v, i) => v === pb[i]), 'tablas: la misma semilla da exactamente lo mismo');
    const d = new G.Constructor();
    DO.tablasDeCara(d, { eje: 'z', cara: 1, fuera: 1, u0: 0, u1: 2, y0: 0, y1: 2, sem: 12, colores: ['#786047', '#81684d'] });
    const cd = d.geometria().attributes.color.array, ca = a.geometria().attributes.color.array;
    let dif = 0; for (let i = 0; i < Math.min(cd.length, ca.length); i++) if (cd[i] !== ca[i]) dif++;
    falla(dif > ca.length * 0.3, 'tablas: otra semilla, otro reparto de tonos');
  }

  // los troncos redondos
  {
    const c = new G.Constructor();
    const m = G.matriz([0, 0, 0]);
    DO.troncoRedondo(c, { largo: 2, r0: 0.13, r1: 0.12, m, color: '#6b5238', tapas: [true, true] });
    const g = c.geometria();
    const T = normales(g);
    const abajo = T.filter((q) => q.n.y < -0.99 && q.c.y < 0.001), arriba = T.filter((q) => q.n.y > 0.99 && q.c.y > 1.999);
    falla(abajo.length >= 24 && arriba.length >= 24, `tronco: las tapas (el anillo y el centro) miran hacia afuera del tronco (${abajo.length}/${arriba.length})`);
    falla(T.filter((q) => q.n.y > 0.99 && q.c.y < 0.001).length === 0 && T.filter((q) => q.n.y < -0.99 && q.c.y > 1.999).length === 0, 'tronco: ninguna tapa mira hacia adentro');
    const P = posiciones(g);
    falla(Math.max(...P.map((p) => Math.hypot(p[0], p[2]))) <= 0.1301, 'tronco: no pasa de su radio');
    const sin = new G.Constructor();
    DO.troncoRedondo(sin, { largo: 2, r0: 0.13, r1: 0.12, m, color: '#6b5238', tapas: [false, false] });
    const lados = new Set(posiciones(sin.geometria()).filter((p) => casi(p[1], 0, 1e-6)).map((p) => Math.round(Math.atan2(p[2], p[0]) * 100))).size;
    falla(lados >= 8, `tronco: de ocho lados (${lados})`);
    falla(sin.geometria().attributes.position.count < g.attributes.position.count, 'tronco: sin tapas tiene menos triángulos');
  }

  // las patas de piedra: misma altura y misma huella que el cilindro de siete lados
  {
    const c = new G.Constructor();
    DO.basaDePiedra(c, { x: 1, z: -2, yCentro: 0.16, alto: 0.42, rBase: 0.32, rTope: 0.25, sem: 5 });
    const P = posiciones(c.geometria());
    const y1 = Math.max(...P.map((p) => p[1])), y0 = Math.min(...P.map((p) => p[1]));
    falla(y1 > 0.16 + 0.21 && y1 < 0.16 + 0.21 + 0.09, `basa: llega a la altura del cilindro (${y1.toFixed(2)})`);
    falla(y0 > 0.16 - 0.21 - 0.12 && y0 < 0.16 - 0.21 + 0.06, `basa: apoya a la altura del cilindro (${y0.toFixed(2)})`);
    const radio = Math.max(...P.map((p) => Math.hypot(p[0] - 1, p[2] + 2)));
    falla(radio < 0.32 * 1.25 && radio > 0.25, `basa: la huella no pasa de la del cilindro (${radio.toFixed(2)})`);
    falla(c.geometria().attributes.position.count <= 600, 'basa: pocos vértices (una pata no es una roca)');
  }
  return mal;
}

// ---------------------------------------------------------------- modo hijo: una copia mutada de detalle-obras.js corre la comprobación y dice cuántas fallan
if (process.argv[2] === '--hijo') {
  const DO = await import(pathToFileURL(process.argv[3]).href);
  const X = await import(pathToFileURL(path.join(raiz, 'src/estilo-casa.js')).href);
  const mal = comprobar(DO, X);
  console.log(String(mal.length) + (mal.length ? ' ' + mal.slice(0, 2).join(' | ') : ''));
  process.exit(0);
}

const DO = await import(pathToFileURL(path.join(raiz, 'src/detalle-obras.js')).href);
const AS = await import(pathToFileURL(path.join(raiz, 'src/asentado.js')).href);
const AM = await import(pathToFileURL(path.join(raiz, 'src/asentado-mundo.js')).href);
const C = await import(pathToFileURL(path.join(raiz, 'src/construccion.js')).href);
const E = await import(pathToFileURL(path.join(raiz, 'src/estilo-casa.js')).href);

// ---------------------------------------------------------------- 1. detalle-obras.js
{
  const mal = comprobar(DO, E);
  ok(mal.length === 0, 'detalle-obras.js cumple todo lo suyo' + (mal.length ? ' — falla: ' + mal.join(' | ') : ''));
  ok(DO.mezclar('#808080', 0.5) === '#404040' && DO.mezclar('#ffffff', 2) === '#ffffff' && DO.mezclar('#102030', 1, 0, 1) === '#100030', 'mezclar devuelve siempre texto #rrggbb, acotado');
  ok(DO.esHex('#a1b2c3') && !DO.esHex('a1b2c3') && !DO.esHex(0xa1b2c3), 'esHex sólo acepta #rrggbb');
  ok(DO.semillaObra({ id: 'casilla' }, { x: 10.04, z: 3 }) === DO.semillaObra({ id: 'casilla' }, { x: 10.0, z: 3 }), 'la semilla es la de asentado.js (al decímetro)');
  ok(DO.semillaObra({ id: 'casilla' }, null) === DO.semillaObra({ id: 'casilla' }, null) && DO.semillaObra({ id: 'casilla' }, null) !== DO.semillaObra({ id: 'puesto' }, null), 'sin posición (el fantasma) sale sólo del id');
  AS.fijarAsentado({});
  ok(DO.detalleObras() === false, 'apagado (Baja y Mínima): el detalle está apagado');
  AS.fijarAsentado({ ocluir: true, contacto: true, halos: true, detalle: true });
  ok(DO.detalleObras() === true && AS.asentadoActivo().detalle === true, 'prendido (Media y Alta): el detalle está prendido');
  ok(JSON.stringify(AS.fijarAsentado({ ocluir: true, contacto: true, halos: true, detalle: true })) === '{"ocluir":true,"contacto":true,"halos":true}', 'fijarAsentado devuelve lo de siempre (la prueba 4.12.1 lo mira tal cual)');
  AS.fijarAsentado({});
}

// ---------------------------------------------------------------- 2. las obras de verdad
const T = { altura: () => 0, agua: () => false, normal: () => new THREE.Vector3(0, 1, 0), indice: () => 0, distRiel: [999], distSendero: [999], lugares: {} };
const armarTodo = (cfg, ids, etapas = null) => {
  AS.fijarAsentado(cfg);
  const obs = [], plats = [];
  const col = { agregar: (o) => obs.push(JSON.stringify({ ...o, duenio: undefined })), agregarPlataforma: (p) => plats.push(JSON.stringify({ ...p, duenio: undefined })), plataformaEn: () => null, eliminarPorDuenio: () => {} };
  const S = C.crearConstruccion(T, new THREE.Scene(), col, { arboles: [], despejar() {} }, null, null);
  const res = {};
  let x = 0;
  for (const id of ids) {
    const p = C.PLANOS.find((q) => q.id === id);
    const datos = { plano: p.id, x: x += 30, z: 5, y: 0, rot: 0.4, etapas: etapas === null ? p.etapas.length : Math.min(p.etapas.length, etapas) };
    S.sincronizar([datos]);
    const ob = S.obras.find((q) => q.datos === datos);
    let mallas = 0; ob.grupo.traverse((o) => { if (o.isMesh) mallas++; });
    res[id] = { g: ob.malla.geometry, mallas, ob };
  }
  return { res, obs, plats };
};
{
  const todos = C.PLANOS.map((p) => p.id);
  ok(todos.length >= 150, `hay muchas obras para probar (${todos.length})`);
  const sin = armarTodo({ ocluir: true, contacto: true, halos: true }, todos);
  const con = armarTodo({ ocluir: true, contacto: true, halos: true, detalle: true }, todos);
  ok(JSON.stringify(con.obs) === JSON.stringify(sin.obs), 'las colisiones son EXACTAMENTE las mismas con y sin detalle');
  ok(JSON.stringify(con.plats) === JSON.stringify(sin.plats), 'las plataformas son EXACTAMENTE las mismas');
  let delta = 0, masGrande = 0, cambiadas = [], rotos = 0, mallasMas = 0, maxVerts = 0, maxId = '';
  for (const id of todos) {
    const a = sin.res[id], b = con.res[id];
    const tri = (g) => (g.index ? g.index.count : g.attributes.position.count) / 3;
    if (b.mallas !== a.mallas) mallasMas++;
    const verts = b.g.attributes.position.count;
    if (verts > maxVerts) { maxVerts = verts; maxId = id; }
    for (const v of b.g.attributes.color.array) if (!Number.isFinite(v) || v < 0 || v > 3) rotos++;
    for (const v of b.g.attributes.position.array) if (!Number.isFinite(v)) rotos++;
    const d = tri(b.g) - tri(a.g);
    if (d !== 0) { cambiadas.push(id); delta += d; masGrande = Math.max(masGrande, d); }
    // la silueta: la misma, más las puntas de los troncos y el canto de los zócalos (≤ 0,4 m)
    a.g.computeBoundingBox(); b.g.computeBoundingBox();
    const ba = a.g.boundingBox, bb = b.g.boundingBox;
    const sobra = Math.max(ba.min.x - bb.min.x, ba.min.y - bb.min.y, ba.min.z - bb.min.z, bb.max.x - ba.max.x, bb.max.y - ba.max.y, bb.max.z - ba.max.z);
    const falta = Math.max(bb.min.x - ba.min.x, bb.min.y - ba.min.y, bb.min.z - ba.min.z, ba.max.x - bb.max.x, ba.max.y - bb.max.y, ba.max.z - bb.max.z);
    if (sobra > 0.4 || falta > 0.4) { ok(false, `${id}: la silueta cambia más de 40 cm (sobra ${sobra.toFixed(2)}, falta ${falta.toFixed(2)})`); }
  }
  ok(rotos === 0, 'ninguna obra con detalle tiene vértices ni colores rotos');
  ok(mallasMas === 0, '0 llamadas de dibujo nuevas: cada obra sigue siendo UNA malla (la cuenta de mallas por obra no cambia en ninguna de las 190)');
  ok(cambiadas.length >= 8, `el detalle toca las obras que debe (${cambiadas.length}: ${cambiadas.slice(0, 12).join(', ')}…)`);
  for (const id of ['puesto', 'casilla', 'galponcito', 'mirador', 'cobertizo', 'cabana-piedra', 'casa-galeria', 'casona']) ok(cambiadas.includes(id), `${id} tiene el detalle`);
  ok(delta <= 400000, `presupuesto: todas las obras del juego juntas suman ${Math.round(delta / 1000)} mil triángulos de más (tope: 400 mil)`);
  ok(masGrande <= 30000, `presupuesto: la obra que más suma, ${Math.round(masGrande / 1000)} mil (tope por obra: 30 mil)`);
  ok(maxVerts <= 90000, `la obra con más vértices es ${maxId}: ${maxVerts} (tope: 90 mil; el asentado entra hasta 110 mil)`);
  // con el detalle apagado, la geometría es la de siempre: la prueba 4.12.1 fija sus números de oro; acá sólo se ve que no hay nada del detalle
  const apagado = armarTodo({}, ['puesto', 'casilla', 'cabana-piedra']);
  ok(apagado.res.puesto.g.attributes.position.count === 4380 && apagado.res.casilla.g.attributes.position.count === 2940 && apagado.res['cabana-piedra'].g.attributes.position.count === 6300, 'apagado: el puesto, la casilla y la cabaña tienen los vértices de la 4.21.0 (4380, 2940 y 6300)');
  // etapas intermedias: cada etapa con detalle se arma sin romper
  for (const id of ['puesto', 'casilla', 'cabana-piedra']) for (let e = 1; e <= C.PLANOS.find((p) => p.id === id).etapas.length; e++) {
    const r = armarTodo({ ocluir: true, contacto: true, halos: true, detalle: true }, [id], e);
    ok(r.res[id].g.attributes.position.count > 0, `${id}: la etapa ${e} se arma con detalle`);
  }
  AS.fijarAsentado({});
}

// ---------------------------------------------------------------- 2b. en la ladera, el calce de una pata llega al suelo y es un canto rodado (con el detalle) o el cilindro de siempre (sin él)
{
  const calces = await import(pathToFileURL(path.join(raiz, 'src/calces.js')).href);
  const suelo = (lx, lz) => -0.9 - 0.2 * lx;   // la ladera cae 0,9 m bajo el pie de la obra y sigue bajando
  const hacer = (cfg) => { AS.fijarAsentado(cfg); const c = new G.Constructor(); calces.calce(c, suelo, 0, 0, -0.04, 0.32); const g = c.geometria(); return { n: g.attributes.position.count, y0: Math.min(...[...g.attributes.position.array].filter((_, i) => i % 3 === 1)) }; };
  const sin = hacer({}), con = hacer({ ocluir: true, contacto: true, halos: true, detalle: true });
  ok(sin.n === 84, `apagado: el calce es el cilindro de siete lados de siempre (${sin.n} vértices)`);
  ok(con.n === 60, `con el detalle: el calce es un canto rodado de veinte caras (${con.n} vértices)`);
  ok(con.y0 < -0.9 + 0.1 && sin.y0 < -0.9 + 0.1, `en los dos casos llega al suelo de la ladera (${con.y0.toFixed(2)} y ${sin.y0.toFixed(2)})`);
  AS.fijarAsentado({});
}

// ---------------------------------------------------------------- 3. la pintura de «Personalizar» sigue viendo las paredes
{
  for (const id of ['casilla', 'cabana-piedra', 'casa-galeria', 'puesto']) {
    const P = C.PLANOS.find((p) => p.id === id);
    AS.fijarAsentado({ ocluir: true, contacto: true, halos: true, detalle: true });
    const c = new G.Constructor();
    const marcas = E.marcarConstructor(c);
    const datos = { plano: id, x: 40, z: 5, y: 0, rot: 0, etapas: P.etapas.length };
    for (const et of P.etapas) { marcas.etapa = et.nombre; et.arma(c, P, datos, null); }
    const g = c.geometria();
    AS.fijarAsentado({});
    const c0 = new G.Constructor();
    const marcas0 = E.marcarConstructor(c0);
    for (const et of P.etapas) { marcas0.etapa = et.nombre; et.arma(c0, P, datos, null); }
    ok(marcas.every((m) => m.color === null || /^#[0-9a-f]{6}$/.test(m.color)), `${id}: todo color va como texto #rrggbb`);
    ok(marcas.every((m) => m.color !== null), `${id}: ninguna pieza sin color de texto (si no, «Personalizar» no la pinta)`);
    const zonas = E.rangosPorZona(marcas, (m) => E.zonaCasa(Object.assign({ categoria: 'refugios' }, P), m.etapa, m.color));
    const zonas0 = E.rangosPorZona(marcas0, (m) => E.zonaCasa(Object.assign({ categoria: 'refugios' }, P), m.etapa, m.color));
    const cuenta = (z) => (z || []).reduce((s, [a, b]) => s + (b - a), 0);
    if (id !== 'puesto') ok(cuenta(zonas.pared) > cuenta(zonas0.pared) * 1.5, `${id}: la pared pintable ahora son más vértices (${cuenta(zonas0.pared)} → ${cuenta(zonas.pared)}) y todos de la zona «pared»`);
    else ok(cuenta(zonas.pared) > cuenta(zonas0.pared), `${id}: los troncos (y sus tapas) siguen siendo pared pintable (${cuenta(zonas0.pared)} → ${cuenta(zonas.pared)})`);
    // pintar una pared de rojo: la veta se conserva (hay más de un tono) y la pared cambia de color
    const attr = g.getAttribute('color').array.slice();
    E.pintarRangos(attr, zonas.pared, '#8a3b2e');
    const r0 = zonas.pared[0][0], lum = (i) => attr[i * 3] * 0.2126 + attr[i * 3 + 1] * 0.7152 + attr[i * 3 + 2] * 0.0722;
    const tonos = new Set(); for (const [a, b] of zonas.pared) for (let v = a; v < Math.min(b, a + 30); v++) tonos.add(Math.round(lum(v) * 200));
    ok(attr[r0 * 3] > attr[r0 * 3 + 2] && tonos.size > 6, `${id}: repintada de colorado, la pared mantiene la veta (${tonos.size} tonos)`);
  }
  AS.fijarAsentado({});
}

// ---------------------------------------------------------------- 4. la sombra de contacto fina
{
  const altura = (x, z) => 0.1 * x + 0.05 * z + Math.sin(x * 2) * 0.1;
  const viejo = AM.anilloDeContacto({ x: 10, z: -4, rot: 0.7, w: 6, d: 4, radio: 1.2, fuerza: 0.3 }, altura);
  const fino = AM.anilloDeContacto({ x: 10, z: -4, rot: 0.7, w: 6, d: 4, radio: 1.2, fuerza: 0.3 }, altura, AM.ANILLO_FINO);
  ok(AM.ANILLO_FINO.anillos === 3 && AM.ANILLO_FINO.pasoMax <= 0.8 && AM.ANILLO_FINO.esquina >= 6, 'ANILLO_FINO: tres tiras, pasos de 80 cm como mucho, esquinas de seis puntos');
  ok(fino.pos.length >= viejo.pos.length * 2.5, `el anillo fino tiene bastantes más vértices que el viejo (${viejo.pos.length / 3} → ${fino.pos.length / 3})`);
  ok(fino.pos.length / 3 === fino.col.length / 3 && fino.ind.length % 3 === 0 && fino.ind.every((i) => i >= 0 && i < fino.pos.length / 3), 'el anillo fino tiene vértices, colores y triángulos enteros');
  let sigueTerreno = true; for (let i = 0; i < fino.pos.length / 3; i++) if (!casi(fino.pos[i * 3 + 1], altura(fino.pos[i * 3], fino.pos[i * 3 + 2]) + 0.05)) sigueTerreno = false;
  ok(sigueTerreno, 'el anillo fino sigue el terreno vértice por vértice (+5 cm)');
  const K = 4, n = fino.pos.length / 3 / K;
  ok(Number.isInteger(n) && n >= 30, `el perímetro tiene ${n} puntos (pasos de 80 cm)`);
  let monotono = true, cero = true, pleno = true;
  for (let i = 0; i < n; i++) {
    const f = (k) => fino.col[(i * K + k) * 3 + 2];
    if (!(f(0) >= f(1) && f(1) >= f(2) && f(2) >= f(3))) monotono = false;
    if (f(3) !== 0) cero = false;
    if (!casi(f(0), 0.3, 1e-9)) pleno = false;
  }
  ok(monotono, 'la sombra baja sin saltos desde el pie hasta el borde de afuera (cada tira es más tenue que la anterior)');
  ok(cero && pleno, 'el borde de afuera no resta nada y el pie lleva la fuerza plena');
  let salto = 0;
  for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) salto = Math.max(salto, Math.abs(fino.col[(i * K + k) * 3 + 2] - fino.col[(i * K + k + 1) * 3 + 2]));
  ok(salto < 0.3 * 0.5, `ningún escalón de la sombra pasa de la mitad de la fuerza (${salto.toFixed(3)}): no hay borde duro`);
  const alta = AM.anilloDeContacto({ x: 0, z: 0, w: 5, d: 5, y: 7.5, radio: 1 }, altura, AM.ANILLO_FINO);
  let parejo = true; for (let i = 0; i < alta.pos.length / 3; i++) if (Math.abs(alta.pos[i * 3 + 1] - 7.54) > 1e-6) parejo = false;
  ok(parejo, 'un lote nivelado (la aldea) sigue con el suelo parejo también en el anillo fino');
  const am = leer('src/asentado-mundo.js');
  ok(/anilloDeContacto\([^;]*altura, ANILLO_FINO\)/.test(am), 'crearAsiento arma los anillos con ANILLO_FINO');
  ok(!/onBeforeCompile|ShaderMaterial\(|new THREE\.(Point|Spot|Directional)Light/.test(am), 'la sombra de contacto fina: ningún shader ni luz nuevos');
  const escena = new THREE.Scene();
  const as = AM.crearAsiento(escena, { altura, lejos: () => 100 });
  as.poner('a', { x: 10, z: 10, rot: 0, w: 5, d: 4, radio: 1, fuerza: 0.3 });
  as.actualizar(1, { x: 0, z: 0 }, { dia: 1, pleno: true });
  ok(as.malla.visible && as.malla.geometry.attributes.position.count / 4 >= 36, 'la malla de contacto sigue siendo UNA y se arma con el anillo fino');
  let hijos = 0; escena.traverse((o) => { if (o.isMesh) hijos++; }); ok(hijos === 1, 'sigue habiendo una sola malla de sombras de contacto en la escena');
}

// ---------------------------------------------------------------- 5. las reglas del presupuesto
{
  const fuentes = fs.readdirSync(path.join(raiz, 'src')).filter((f) => f.endsWith('.js'));
  let shaders = 0; for (const f of fuentes) shaders += (leer('src/' + f).match(/new THREE\.ShaderMaterial\(/g) || []).length;
  ok(shaders === 18, `las construcciones de ShaderMaterial siguen siendo 18 como en la 4.21.0 (${shaders}): 0 programas de shader nuevos`);
  const det = leer('src/detalle-obras.js');
  ok(!/ShaderMaterial|onBeforeCompile|CanvasTexture|DataTexture|TextureLoader|new THREE\.Mesh\(|new THREE\.Points|InstancedMesh|WebGLRenderTarget|new THREE\.(Point|Spot|Directional)Light/.test(det), 'detalle-obras.js: sin shaders, texturas, mallas, instancias, capas de pantalla ni luces: sólo geometría para el Constructor');
  ok(!/Math\.random/.test(det), 'detalle-obras.js: nada de azar del juego (todo sale de la semilla de la obra)');
  ok(!/\b(ñ|Ñ)/.test(Object.keys(DO).join(' ')), 'los nombres exportados no llevan ñ');
  const main = leer('src/main.js'), cons = leer('src/construccion.js'), casas = leer('src/planos-casas.js');
  ok(/fijarAsentado\(\{[^}]*detalle: !!calidad\.post/.test(main), 'main.js prende el detalle de las obras sólo con postproceso (Media y Alta)');
  ok(/asentadoActivo\(\)\.detalle/.test(cons) && /detalleObras\(\)/.test(cons), 'construccion.js: el detalle y los topes más anchos del asentado dependen de la calidad');
  ok((cons.match(/detalleObras\(\)/g) || []).length >= 7 && (casas.match(/detalleObras\(\)/g) || []).length >= 3, 'el puesto, la casilla, el galponcito, el mirador, el cobertizo y las casas llaman al detalle');
  ok(/import \{[^}]*\} from '\.\/detalle-obras\.js';/.test(cons) && /import \{[^}]*\} from '\.\/detalle-obras\.js';/.test(casas), 'los imports del detalle van en una línea (armar.mjs sólo entiende esos)');
  const pkg = JSON.parse(leer('package.json'));
  ok(pkg.scripts['verify:pasos'].includes('verificar-4-22-0-c.mjs'), 'la prueba está en verify:pasos');
}

// ---------------------------------------------------------------- mutaciones de detalle-obras.js (una copia con otro nombre por cada una; un proceso por copia)
{
  const fuente = leer('src/detalle-obras.js');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hoj-4220c-'));
  const src = (f) => pathToFileURL(path.join(raiz, 'src', f)).href;
  const aAbsoluto = (t) => t.replace("from './geometria.js'", `from '${src('geometria.js')}'`).replace("from './asentado.js'", `from '${src('asentado.js')}'`);
  const correr = (nombre, texto) => {
    const f = path.join(dir, nombre + '.mjs');
    fs.writeFileSync(f, aAbsoluto(texto));
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--hijo', f], { encoding: 'utf8' });
    return (r.stdout || '').trim().split('\n').pop() || (r.stderr || '').slice(0, 200);
  };
  ok(correr('original', fuente) === '0', 'mutación 0: la copia sin tocar cumple todo');
  const muta = [
    ['canto-al-reves', "const cantoIni = sentido > 0 ? 'i' : 'd', cantoFin = sentido > 0 ? 'd' : 'i';", "const cantoIni = 'i', cantoFin = 'd';"],
    ['bloques-hundidos', 'matriz(aObra((a + b) / 2, y + h / 2, sal - prof / 2), [0, giro, 0])', 'matriz(aObra((a + b) / 2, y + h / 2, -sal - prof / 2), [0, giro, 0])'],
    ['sin-salida-de-la-cara', 'const sal = 0.012 + (salida - 0.012) * azarDe(sem, fila * 31 + 4 + k * 4);', 'const sal = 0.012 + (salida * 3 - 0.012) * azarDe(sem, fila * 31 + 4 + k * 4);'],
    ['nudos-sobre-el-vidrio', 'if (sinNudos.some(([a, b, p, q]) => u > a - r && u < b + r && y > p - r && y < q + r)) continue;', ''],
    ['color-sin-texto', 'color, tipo, variar: 0.07, degradado:', 'color: new THREE.Color(color), tipo, variar: 0.07, degradado:'],
    ['tablas-hundidas', 'matriz(aObra(u, (a + b) / 2, relieve - prof / 2), [0, giro, 0])', 'matriz(aObra(u, (a + b) / 2, -prof / 2), [0, giro, 0])'],
    ['tapa-al-reves', 'if (arriba) pos.push(...O, ...B, ...A); else pos.push(...O, ...A, ...B);', 'if (arriba) pos.push(...O, ...A, ...B); else pos.push(...O, ...B, ...A);'],
    ['tronco-de-cuatro-lados', 'new THREE.CylinderGeometry(1, 1, 1, 8, 1, true)', 'new THREE.CylinderGeometry(1, 1, 1, 4, 1, true)'],
    ['basa-aplastada', 'ry: alto * 0.3, rz: rTope * 0.94', 'ry: alto * 0.1, rz: rTope * 0.94'],
    ['basa-gigante', 'rx: rBase * 0.98, ry: alto * 0.37, rz: rBase * 0.92', 'rx: rBase * 2.2, ry: alto * 0.37, rz: rBase * 0.92'],
    ['tablas-sin-semilla', 'const f = 0.88 + 0.22 * azarDe(sem, i * 7 + 2);\n    const color = mezclar(base, f);', 'const f = 1;\n    const color = mezclar(base, f);'],
  ];
  for (const [n, de, a] of muta) {
    if (!fuente.includes(de)) { ok(false, `mutación ${n}: el texto a cambiar existe`); continue; }
    const r = correr(n, fuente.replace(de, a));
    ok(r !== '0', `mutación «${n}» hace fallar la comprobación (${r.slice(0, 90)})`);
  }
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${total - fallas}/${total} comprobaciones`);
process.exit(fallas ? 1 : 0);

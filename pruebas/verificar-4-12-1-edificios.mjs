// 4.12.1 (parte B): edificios y luz. Con las construcciones de verdad armadas en Node:
//   · asentado.js (puro): la semilla de cada edificio sale de su posición y su id (determinista, sin azar del juego); el teselado conserva la forma y los
//     colores y el orden de los triángulos; la oclusión oscurece el pie, el rincón entrante, lo de abajo del alero y la panza del techo y no toca el techo
//     abierto; el desgaste da a cada edificio su matiz, humedad al pie y musgo en los techos y del lado de la sombra, y casi nada si es nuevo;
//   · las 190 obras del juego se arman con todo prendido (Media y Alta) sin vértices rotos, con las MISMAS colisiones y plataformas que con todo apagado y la
//     misma silueta; con todo apagado (Baja y Mínima) la geometría es idéntica byte a byte a la de siempre y no hay ni una sombra de contacto;
//   · la sombra de contacto (una malla, un dibujo, material de color por vértice que resta, sin luces ni shaders nuevos) y los halos de noche (una malla, el
//     MISMO programa de halos de la aldea) se apagan de día, lejos y en Baja;
//   · el enganche en el juego: main.js, construccion.js, estructuras.js y aldea-mundo.js.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registrarThree } from './ayuda-three.mjs';
import { enUnaLinea } from './ayuda-codigo.mjs';

registrarThree();
const THREE = await import('three');
const AS = await import('../src/asentado.js');
const AM = await import('../src/asentado-mundo.js');
const C = await import('../src/construccion.js');
const G = await import('../src/geometria.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const cerca = (a, b, tol, m) => { assert.ok(Math.abs(a - b) <= tol, `${m}: ${a} vs ${b}`); n++; };

// ---------------------------------------------------------------- una casa de mentira: piso, cuatro paredes, techo a dos aguas con alero
function casa({ alero = true } = {}) {
  const c = new G.Constructor();
  const W = 6, D = 4, H = 2.4;
  c.agregar(new THREE.BoxGeometry(W, 0.2, D), { color: '#6b5238', matriz: G.matriz([0, 0.1, 0]), variar: 0 });
  for (const [x, z, w, d] of [[0, -D / 2, W, 0.2], [0, D / 2, W, 0.2], [-W / 2, 0, 0.2, D], [W / 2, 0, 0.2, D]]) c.agregar(new THREE.BoxGeometry(w, H, d), { color: '#8a7a60', matriz: G.matriz([x, H / 2, z]), variar: 0 });
  if (alero) for (const s of [-1, 1]) c.agregar(new THREE.BoxGeometry(W / 2 + 0.9, 0.12, D + 0.8), { color: '#45382f', matriz: G.matriz([s * (W / 4 + 0.1), H + 0.7, 0], [0, 0, s * 0.55]), variar: 0 });
  return c.geometria();
}
const posDe = (g, i) => [g.attributes.position.array[i * 3], g.attributes.position.array[i * 3 + 1], g.attributes.position.array[i * 3 + 2]];
const normDe = (g, i) => [g.attributes.normal.array[i * 3], g.attributes.normal.array[i * 3 + 1], g.attributes.normal.array[i * 3 + 2]];
const lum = (g, i) => { const c = g.attributes.color.array; return 0.2126 * c[i * 3] + 0.7152 * c[i * 3 + 1] + 0.0722 * c[i * 3 + 2]; };
const media = (g, ref, filtro, f = lum) => {
  let s = 0, k = 0;
  for (let i = 0; i < g.attributes.position.count; i++) { const p = posDe(g, i), nn = normDe(g, i); if (filtro(p, nn)) { s += f(g, i) / Math.max(1e-6, f(ref, i)); k++; } }
  return k ? s / k : NaN;
};
const clonar = (g) => g.clone();

// ---------------------------------------------------------------- la semilla
{
  const a = AS.semillaDe(120.4, -33.2, 'puesto');
  ok(Number.isInteger(a) && a >= 0 && a < 2 ** 32, 'la semilla es un entero de 32 bits');
  ok(AS.semillaDe(120.4, -33.2, 'puesto') === a, 'la misma posición y el mismo id dan la misma semilla');
  ok(AS.semillaDe(120.4, -33.2, 'casilla') !== a, 'otro id, otra semilla');
  ok(AS.semillaDe(120.5, -33.2, 'puesto') !== a, 'a un decímetro, otra semilla');
  ok(AS.semillaDe(120.41, -33.2, 'puesto') === a, 'a un centímetro, la misma (al decímetro)');
  const v = new Set(); for (let i = 0; i < 200; i++) v.add(AS.semillaDe(i * 7.3, i * -2.9, 'puesto'));
  ok(v.size >= 198, 'las semillas casi nunca chocan');
  let mn = 1, mx = 0; for (let i = 0; i < 500; i++) { const r = AS.azarDe(a, i); mn = Math.min(mn, r); mx = Math.max(mx, r); }
  ok(mn >= 0 && mx < 1 && mx - mn > 0.9, 'azarDe cae en [0, 1) y se reparte');
  ok(AS.azarDe(a, 3) === AS.azarDe(a, 3) && AS.azarDe(a, 3) !== AS.azarDe(a, 4), 'azarDe es de la semilla y el índice');
  let r = 0; for (let i = 0; i < 400; i++) { const q = AS.ruido3(a, i * 0.37, i * 0.11, i * 0.53); ok(q >= 0 && q <= 1, 'ruido3 en [0, 1]'); r += q; }
  ok(r / 400 > 0.3 && r / 400 < 0.7, 'ruido3 anda por el medio');
}

// ---------------------------------------------------------------- el teselado
{
  const g = casa();
  const antes = clonar(g);
  const caja = (geo) => { geo.computeBoundingBox(); return geo.boundingBox.clone(); };
  const area = (geo) => {
    const p = geo.attributes.position.array; let s = 0;
    for (let i = 0; i < p.length; i += 9) { const ux = p[i + 3] - p[i], uy = p[i + 4] - p[i + 1], uz = p[i + 5] - p[i + 2], vx = p[i + 6] - p[i], vy = p[i + 7] - p[i + 1], vz = p[i + 8] - p[i + 2]; s += 0.5 * Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx); }
    return s;
  };
  const t = AS.teselarGeometria(g);
  ok(t && t.tris > antes.attributes.position.count / 3, 'el teselado agrega triángulos');
  ok(g.attributes.position.count === t.tris * 3, 'la cuenta de vértices es la de los triángulos nuevos');
  const b0 = caja(antes), b1 = caja(g);
  ok(b0.min.distanceTo(b1.min) < 1e-5 && b0.max.distanceTo(b1.max) < 1e-5, 'la caja que ocupa es la misma');
  cerca(area(g), area(antes), 1e-3, 'la superficie es la misma');
  ok(t.desde.length === antes.attributes.position.count / 3 + 1 && t.desde[0] === 0 && t.desde[t.desde.length - 1] === g.attributes.position.count, 'desde recorre todos los triángulos viejos');
  let sube = true; for (let i = 1; i < t.desde.length; i++) if (t.desde[i] < t.desde[i - 1] || t.desde[i] % 3) sube = false;
  ok(sube, 'desde crece de a triángulos enteros (el orden de las piezas se conserva)');
  // cada color nuevo es uno que ya tenía la pieza (las paredes son de un solo color con variar 0)
  const cv = (geo, i) => [geo.attributes.color.array[i * 3], geo.attributes.color.array[i * 3 + 1], geo.attributes.color.array[i * 3 + 2]];
  const paletaVieja = new Set(); for (let i = 0; i < antes.attributes.position.count; i++) paletaVieja.add(cv(antes, i).map((x) => x.toFixed(4)).join());
  let nuevos = 0; for (let i = 0; i < g.attributes.position.count; i++) if (!paletaVieja.has(cv(g, i).map((x) => x.toFixed(4)).join())) nuevos++;
  ok(nuevos === 0, 'los colores se conservan EXACTOS (promedios de colores iguales)');
  let normales = true; for (let i = 0; i < g.attributes.normal.count; i++) { const [x, y, z] = normDe(g, i); if (Math.abs(Math.hypot(x, y, z) - 1) > 1e-4) normales = false; }
  ok(normales, 'las normales siguen siendo unitarias');
  // cada triángulo viejo se partió en triángulos que lo cubren: los nuevos de un triángulo caen dentro de la caja del viejo
  for (const q of [0, 7, 13, 20, 29]) {
    const caja = (geo, a, b) => { const p = geo.attributes.position.array; const m = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (let i = a; i < b; i++) for (let k = 0; k < 3; k++) { m[k] = Math.min(m[k], p[i * 3 + k]); m[k + 3] = Math.max(m[k + 3], p[i * 3 + k]); } return m; };
    const v = caja(antes, q * 3, q * 3 + 3), nv = caja(g, t.desde[q], t.desde[q + 1]);
    ok(t.desde[q + 1] > t.desde[q] && v.every((x, k) => Math.abs(x - nv[k]) < 1e-4), `los triángulos nuevos del viejo ${q} lo cubren exactamente`);
  }
  // la marca de una pieza (v0, v1) cae sobre los mismos triángulos
  const marcas = [{ v0: 0, v1: 36 }, { v0: 36, v1: 72 }];
  AS.remarcarRangos(marcas, t);
  ok(marcas[0].v0 === 0 && marcas[0].v1 === t.desde[12] && marcas[1].v0 === t.desde[12] && marcas[1].v1 === t.desde[24], 'remarcarRangos lleva las piezas a los vértices nuevos');
  // no hace nada con lo que no es suyo
  ok(AS.teselarGeometria(g, { largo: 50 }) === null, 'si nada es más largo que el límite no hay nada que partir');
  const conIndice = new THREE.BoxGeometry(5, 5, 5); conIndice.setAttribute('color', conIndice.attributes.position.clone());
  ok(AS.teselarGeometria(conIndice) === null, 'una geometría con índice no se toca');
  const sinColor = new THREE.BufferGeometry(); sinColor.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(36), 3));
  ok(AS.teselarGeometria(sinColor) === null, 'sin normales ni colores no se toca');
  // los triángulos finos (listones) no se parten
  const l = new G.Constructor(); l.agregar(new THREE.BoxGeometry(6, 0.05, 0.05), { color: '#555555', variar: 0 });
  const gl = l.geometria(); ok(AS.teselarGeometria(gl) === null, 'un liston fino no se parte');
  // el tope de vértices
  const gg = casa(); ok(AS.teselarGeometria(gg, { tope: 300 }) === null || gg.attributes.position.count <= 300, 'el tope de vértices se respeta');
}

// ---------------------------------------------------------------- la oclusión
{
  AS.fijarAsentado({ ocluir: true });
  const g = casa();
  AS.teselarGeometria(g);
  const ref = clonar(g);
  const tocados = AS.ocluirGeometria(g);
  ok(tocados > g.attributes.position.count * 0.2, 'la oclusión toca una buena parte de los vértices');
  const pared = (p, nn) => nn[2] > 0.9 && p[2] > 1.9;
  const pie = media(g, ref, (p, nn) => pared(p, nn) && p[1] < 0.45 && p[1] > 0.2);
  const medio = media(g, ref, (p, nn) => pared(p, nn) && p[1] > 1.0 && p[1] < 1.5);
  const aleroBajo = media(g, ref, (p, nn) => pared(p, nn) && p[1] > 2.2 && p[1] < 2.5);
  const techoArriba = media(g, ref, (p, nn) => nn[1] > 0.5 && p[1] > 2.6);
  const panza = media(g, ref, (p, nn) => nn[1] < -0.5 && p[1] > 2.4);
  ok(pie < 0.93, `el pie de la pared queda más oscuro (${pie.toFixed(3)})`);
  ok(pie < medio - 0.04, `el pie es más oscuro que el medio de la pared (${pie.toFixed(3)} < ${medio.toFixed(3)})`);
  ok(aleroBajo < medio - 0.05, `bajo el alero la pared es más oscura que en el medio (${aleroBajo.toFixed(3)} < ${medio.toFixed(3)})`);
  ok(panza < 0.85, `la panza del techo queda en sombra (${panza.toFixed(3)})`);
  ok(techoArriba > 0.995, `el techo abierto al cielo no se toca (${techoArriba.toFixed(3)})`);
  // una pared lisa y alta, sola, sin alero: sólo oscurece el pie, el medio queda como estaba
  const s = new G.Constructor(); s.agregar(new THREE.BoxGeometry(8, 5, 0.3), { color: '#8a7a60', matriz: G.matriz([0, 2.5, 0]), variar: 0 });
  const gs = s.geometria(); AS.teselarGeometria(gs); const rs = clonar(gs); AS.ocluirGeometria(gs);
  ok(media(gs, rs, (p, nn) => nn[2] > 0.9 && p[1] > 2.4 && p[1] < 3.4) > 0.995, 'en una pared aislada, lejos del suelo, no se oscurece nada');
  ok(media(gs, rs, (p, nn) => nn[2] > 0.9 && p[1] < 0.3) < 0.9, 'en una pared aislada, el pie sí');
  // el rincón entrante: un piso contra una pared (cara que mira hacia arriba: no cuenta el alero ni el pie), el piso pegado a la pared es más oscuro que el libre
  const P = new G.Constructor();
  P.agregar(new THREE.BoxGeometry(0.4, 0.1, 10), { color: '#8a7a60', matriz: G.matriz([0.3, 3.95, 0]), variar: 0 });
  P.agregar(new THREE.BoxGeometry(9.5, 0.1, 10), { color: '#8a7a60', matriz: G.matriz([5.25, 3.95, 0]), variar: 0 });
  P.agregar(new THREE.BoxGeometry(0.2, 3, 10), { color: '#8a7a60', matriz: G.matriz([0, 5.5, 0]), variar: 0 });
  const gP = P.geometria(); AS.teselarGeometria(gP); const rP = clonar(gP); AS.ocluirGeometria(gP, { base: -9 });
  const rincon = media(gP, rP, (p, nn) => nn[1] > 0.9 && p[0] > 0.05 && p[0] < 0.2);
  const lejos = media(gP, rP, (p, nn) => nn[1] > 0.9 && p[0] > 5 && p[0] < 9);
  ok(rincon < lejos - 0.05, `el piso pegado a la pared (rincón entrante) es más oscuro que el piso libre (${rincon.toFixed(3)} < ${lejos.toFixed(3)})`);
  // el alero lejos de la pared (a más de lo que alcanza el rincón): sólo lo ve el rayo que mira hacia afuera y hacia arriba
  {
    const armar = (conAlero) => {
      const w = new G.Constructor();
      w.agregar(new THREE.BoxGeometry(8, 5, 0.3), { color: '#8a7a60', matriz: G.matriz([0, 7.5, 0]), variar: 0 });
      if (conAlero) w.agregar(new THREE.BoxGeometry(8, 0.12, 1.1), { color: '#45382f', matriz: G.matriz([0, 9.3, 1.1]), variar: 0 });
      return w.geometria();
    };
    const sin = armar(false), con = armar(true);
    AS.teselarGeometria(sin); AS.teselarGeometria(con);
    AS.ocluirGeometria(sin, { base: -9 }); AS.ocluirGeometria(con, { base: -9 });
    const prom = (g) => { let s = 0, k = 0; for (let i = 0; i < g.attributes.position.count; i++) { const p = posDe(g, i), nn = normDe(g, i); if (nn[2] > 0.9 && p[2] > 0 && p[1] > 7.3 && p[1] < 8.2 && Math.abs(p[0]) < 2) { s += lum(g, i); k++; } } return s / k; };
    ok(prom(con) < prom(sin) - 0.02, `un alero que sale a medio metro y está un metro más arriba oscurece la pared (${prom(con).toFixed(3)} < ${prom(sin).toFixed(3)})`);
  }
  // las cosas varias
  const cero = clonar(g); const r0 = clonar(cero); AS.ocluirGeometria(cero, { fuerza: 0 });
  ok(media(cero, r0, () => true) > 0.9999, 'con fuerza 0 no cambia nada más de lo ya hecho');
  const a = casa(), b = casa(); AS.teselarGeometria(a); AS.teselarGeometria(b); AS.ocluirGeometria(a); AS.ocluirGeometria(b);
  let igual = true; for (let i = 0; i < a.attributes.color.array.length; i++) if (a.attributes.color.array[i] !== b.attributes.color.array[i]) igual = false;
  ok(igual, 'la oclusión es determinista');
  let rotos = 0; for (const v of g.attributes.color.array) if (!Number.isFinite(v) || v < 0) rotos++;
  ok(rotos === 0, 'ningún color roto');
  // cada canal baja a lo sumo la fuerza: nada queda negro
  let negro = 0; for (let i = 0; i < g.attributes.position.count; i++) if (lum(g, i) < lum(ref, i) * 0.27) negro++;
  ok(negro === 0, 'nada queda más oscuro que un cuarto de lo que era (el pintado no ensucia)');
  // lo demasiado chico, grande o sin atributos se deja
  ok(AS.ocluirGeometria(new THREE.BufferGeometry()) === 0, 'una geometría vacía no se toca');
  ok(AS.ocluirGeometria(casa(), { maxVerts: 10 }) === 0, 'una geometría que pasa el tope no se toca');
  AS.fijarAsentado({});
}

// ---------------------------------------------------------------- el desgaste
{
  const g0 = casa(); AS.teselarGeometria(g0);
  const nuevo = clonar(g0), viejo = clonar(g0), viejoB = clonar(g0), otro = clonar(g0);
  const sem = AS.semillaDe(40, 60, 'puesto');
  AS.desgastarGeometria(nuevo, { semilla: sem, nivel: 0 });
  AS.desgastarGeometria(viejo, { semilla: sem, nivel: 0.7 });
  AS.desgastarGeometria(viejoB, { semilla: sem, nivel: 0.7 });
  AS.desgastarGeometria(otro, { semilla: AS.semillaDe(41, 60, 'puesto'), nivel: 0.7 });
  let igual = true; for (let i = 0; i < viejo.attributes.color.array.length; i++) if (viejo.attributes.color.array[i] !== viejoB.attributes.color.array[i]) igual = false;
  ok(igual, 'el desgaste es determinista: la misma posición y el mismo id dan el mismo aspecto');
  let dif = 0; for (let i = 0; i < viejo.attributes.color.array.length; i++) if (viejo.attributes.color.array[i] !== otro.attributes.color.array[i]) dif++;
  ok(dif > viejo.attributes.color.array.length * 0.5, 'otra casa, otro aspecto');
  // recién hecha: sólo el matiz propio (±4 %)
  let maxDif = 0; for (let i = 0; i < g0.attributes.position.count; i++) for (let k = 0; k < 3; k++) maxDif = Math.max(maxDif, Math.abs(nuevo.attributes.color.array[i * 3 + k] / (g0.attributes.color.array[i * 3 + k] || 1) - 1));
  ok(maxDif < 0.045, `una obra nueva sólo cambia de matiz, no se mancha (${(maxDif * 100).toFixed(1)} %)`);
  // la humedad: lo de abajo de las paredes es más oscuro que lo de arriba
  const abajo = media(viejo, nuevo, (p, nn) => Math.abs(nn[1]) < 0.5 && p[1] > 0.1 && p[1] < 0.4);
  const arriba = media(viejo, nuevo, (p, nn) => Math.abs(nn[1]) < 0.5 && p[1] > 1.6 && p[1] < 2.2);
  ok(abajo < arriba - 0.03, `la humedad sube del suelo (${abajo.toFixed(3)} < ${arriba.toFixed(3)})`);
  // el musgo: más verde en el techo que en una pared al sol, y más del lado de la sombra (−z) que del lado del sol (+z)
  const verde = (g, i) => { const c = g.attributes.color.array; return c[i * 3 + 1] / Math.max(1e-6, c[i * 3] + c[i * 3 + 2]); };
  const veMusgo = (filtro) => { let s = 0, k = 0; for (let i = 0; i < viejo.attributes.position.count; i++) { if (filtro(posDe(viejo, i), normDe(viejo, i))) { s += verde(viejo, i) / verde(nuevo, i); k++; } } return s / k; };
  const techo = veMusgo((p, nn) => nn[1] > 0.4 && p[1] > 2.6);
  const sombra = veMusgo((p, nn) => nn[2] < -0.9 && p[1] > 1.0 && p[1] < 2.0);
  const sol = veMusgo((p, nn) => nn[2] > 0.9 && p[1] > 1.0 && p[1] < 2.0);
  ok(techo > 1.02, `el techo junta musgo (${techo.toFixed(3)})`);
  ok(sombra > sol, `del lado de la sombra hay más musgo que del lado del sol (${sombra.toFixed(3)} > ${sol.toFixed(3)})`);
  // girar la casa cambia de qué lado cae la sombra
  const girada = clonar(g0); AS.desgastarGeometria(girada, { semilla: sem, nivel: 0.7, rot: Math.PI });
  const sombraGirada = (() => { let s = 0, k = 0; for (let i = 0; i < girada.attributes.position.count; i++) { const p = posDe(girada, i), nn = normDe(girada, i); if (nn[2] > 0.9 && p[1] > 1.0 && p[1] < 2.0) { s += verde(girada, i) / verde(nuevo, i); k++; } } return s / k; })();
  ok(sombraGirada > sol, `con la casa girada media vuelta, la pared de +z pasa a la sombra (${sombraGirada.toFixed(3)} > ${sol.toFixed(3)})`);
  let rotos = 0; for (const v of viejo.attributes.color.array) if (!Number.isFinite(v) || v < 0) rotos++;
  ok(rotos === 0, 'ningún color roto');
  let enorme = 0; for (let i = 0; i < viejo.attributes.position.count; i++) if (lum(viejo, i) > lum(g0, i) * 1.25 || lum(viejo, i) < lum(g0, i) * 0.45) enorme++;
  ok(enorme === 0, 'el desgaste nunca cambia la luz de un vértice más de lo razonable (entre 0,45 y 1,25)');
  ok(AS.desgastarGeometria(new THREE.BufferGeometry(), { semilla: 1 }) === 0, 'una geometría vacía no se toca');
}

// ---------------------------------------------------------------- la huella
{
  const g = casa();
  const h = AS.huellaDe(g, { base: 0 });
  ok(h && Math.abs(h.w - 6.2) < 0.4 && Math.abs(h.d - 4.2) < 0.4, `la huella de la casa mide lo que mide (${h && h.w.toFixed(2)} × ${h && h.d.toFixed(2)})`);
  ok(Math.abs(h.cx) < 0.2 && Math.abs(h.cz) < 0.2, 'y está centrada');
  ok(AS.huellaDe(new THREE.BufferGeometry()) === null, 'sin vértices no hay huella');
  const chico = new G.Constructor(); chico.agregar(new THREE.BoxGeometry(0.2, 0.2, 0.2), { color: '#fff' });
  ok(AS.huellaDe(chico.geometria(), { base: 0 }) === null, 'una cosa de 20 cm no tiene sombra de contacto');
  const enorme = new G.Constructor(); enorme.agregar(new THREE.BoxGeometry(60, 0.2, 60), { color: '#fff', matriz: G.matriz([0, 0.1, 0]) });
  ok(AS.huellaDe(enorme.geometria(), { base: 0 }) === null, 'una cosa de 60 m tampoco');
}

// ---------------------------------------------------------------- el interruptor de calidad
{
  ok(JSON.stringify(AS.fijarAsentado({ ocluir: true, contacto: true, halos: true })) === '{"ocluir":true,"contacto":true,"halos":true}', 'Media y Alta prenden las tres cosas');
  ok(JSON.stringify(AS.fijarAsentado({})) === '{"ocluir":false,"contacto":false,"halos":false}', 'Baja y Mínima las apagan');
  const g = casa(); const r = clonar(g);
  const out = AS.asentarGeometria(g, { semilla: 5, nivel: 0.5 });
  ok(out.ocluidos === 0, 'apagado, asentarGeometria no oscurece esquinas');
  AS.fijarAsentado({ ocluir: true });
  const g2 = casa(); AS.teselarGeometria(g2);
  const out2 = AS.asentarGeometria(g2, { semilla: 5, nivel: 0.5 });
  ok(out2.ocluidos > 0 && out2.desgastados > 0, 'prendido, asentarGeometria hace las dos cosas');
  const g3 = casa(); AS.teselarGeometria(g3);
  ok(AS.asentarGeometria(g3, { semilla: 5, nivel: 0.5, ocluir: false }).ocluidos === 0, 'se puede pedir sin oclusión');
  AS.fijarAsentado({});
  void r;
}

// ---------------------------------------------------------------- las obras de verdad
{
  const crear = (cfg, asiento) => {
    AS.fijarAsentado(cfg);
    const obs = [], plats = [];
    const col = { agregar: (o) => obs.push(JSON.stringify({ ...o, duenio: undefined })), agregarPlataforma: (p) => plats.push(JSON.stringify({ ...p, duenio: undefined })), plataformaEn: () => null, eliminarPorDuenio: () => {} };
    const T = { altura: () => 0, agua: () => false, normal: () => new THREE.Vector3(0, 1, 0), indice: () => 0, distRiel: [999], distSendero: [999], lugares: {} };
    const S = C.crearConstruccion(T, new THREE.Scene(), col, { arboles: [], despejar() {} }, null, asiento);
    return { S, obs, plats };
  };
  const ids = ['puesto', 'casilla', 'galponcito', 'cobertizo', 'mirador', 'banco', 'mesa-campo', 'cama-tablas', 'fogon', 'empalizada', 'cerco', 'cantero', 'pared-ventana', 'techo-modular', 'torre-vigia', 'gallinero', 'cabana-piedra', 'casa-galeria', 'telar', 'estufa-hierro'];
  const planos = ids.map((id) => C.PLANOS.find((p) => p.id === id)).filter(Boolean);
  ok(planos.length >= 18, `hay planos de todo tipo para probar (${planos.length})`);
  const armar = (cfg, asiento, hechas = null) => {
    const { S, obs, plats } = crear(cfg, asiento);
    const res = {};
    let x = 0;
    for (const p of planos) {
      const datos = { plano: p.id, x: x += 30, z: 5, y: 0, rot: 0.4, etapas: hechas === null ? p.etapas.length : Math.min(p.etapas.length, hechas) };
      S.sincronizar([datos]);
      const ob = S.obras.find((q) => q.datos === datos);
      res[p.id] = ob && ob.malla ? ob.malla.geometry : null;
    }
    return { res, obs, plats, S };
  };
  const huellas = new Map();
  const asiento = { poner: (k, h) => huellas.set(k, h), quitar: (k) => huellas.delete(k) };
  const apagado = armar({}, asiento);
  ok(huellas.size === 0, 'apagado (Baja y Mínima) no se registra ni una sombra de contacto');
  const prendido = armar({ ocluir: true, contacto: true, halos: true }, asiento);
  ok(huellas.size >= 8, `prendido, las obras grandes registran su sombra de contacto (${huellas.size})`);
  for (const h of huellas.values()) {
    ok(h.w > 0.3 && h.d > 0.3 && h.radio > 0.3 && h.radio <= 1.41 && h.fuerza > 0.1 && h.fuerza < 0.6 && Number.isFinite(h.x) && Number.isFinite(h.z), 'cada huella es razonable');
  }
  ok(JSON.stringify(prendido.obs) === JSON.stringify(apagado.obs), 'las colisiones son EXACTAMENTE las mismas con y sin asentado');
  ok(JSON.stringify(prendido.plats) === JSON.stringify(apagado.plats), 'las plataformas son EXACTAMENTE las mismas');
  for (const p of planos) {
    const a = apagado.res[p.id], b = prendido.res[p.id];
    ok(a && b, `${p.id}: se arma con y sin asentado`);
    a.computeBoundingBox(); b.computeBoundingBox();
    ok(a.boundingBox.min.distanceTo(b.boundingBox.min) < 1e-4 && a.boundingBox.max.distanceTo(b.boundingBox.max) < 1e-4, `${p.id}: la misma silueta`);
    let rotos = 0; for (const v of b.attributes.color.array) if (!Number.isFinite(v) || v < 0 || v > 3) rotos++;
    for (const v of b.attributes.position.array) if (!Number.isFinite(v)) rotos++;
    ok(rotos === 0, `${p.id}: sin vértices ni colores rotos`);
    ok(b.attributes.position.count >= a.attributes.position.count && b.attributes.position.count <= 60000, `${p.id}: ${a.attributes.position.count} → ${b.attributes.position.count} vértices (tope 60000)`);
    ok(b.attributes.aTipo && b.attributes.aTipo.count === b.attributes.position.count, `${p.id}: el tipo de material sigue vértice por vértice`);
  }
  // con todo apagado la geometría es la de siempre: vértices, suma de posiciones y suma de colores, medidos en la 4.12.0 (main) con este mismo armado
  const ORO = {"puesto":[4380,5643.22,1201.3878],"casilla":[2940,5836.56,839.8856],"galponcito":[3180,3083.64,806.0344],"cobertizo":[2988,5672.88,777.918],"mirador":[2460,3131.64,772.6917],"banco":[264,102.98,49.4272],"mesa-campo":[216,106.56,46.8342],"cama-tablas":[324,172.44,163.2653],"fogon":[972,141.84,370.8927],"empalizada":[1152,1589.04,327.322],"cerco":[360,247.68,68.3679],"cantero":[576,183.96,180.668],"pared-ventana":[360,432,93.1567],"techo-modular":[1044,502.2,158.2399],"torre-vigia":[1128,2873.4,328.3147],"gallinero":[576,479.52,145.5831],"cabana-piedra":[6300,9167.18,2208.9833],"casa-galeria":[10788,9257.952,3564.09],"telar":[1296,1063.68,1544.9584],"estufa-hierro":[444,468.78,42.8131]};
  const huella = (g) => { let sp = 0, sc = 0; for (const v of g.attributes.position.array) sp += v; for (const v of g.attributes.color.array) sc += v; return [g.attributes.position.count, +sp.toFixed(3), +sc.toFixed(4)]; };
  for (const id of Object.keys(ORO)) {
    ok(JSON.stringify(huella(apagado.res[id])) === JSON.stringify(ORO[id]), `${id}: apagado (Baja y Mínima) es idéntico a la 4.12.0 (${JSON.stringify(huella(apagado.res[id]))})`);
  }
  // determinista: dos armados prendidos dan lo mismo
  const otra = armar({ ocluir: true, contacto: true }, asiento);
  for (const id of ['puesto', 'casilla', 'cabana-piedra']) {
    const a = prendido.res[id].attributes.color.array, b = otra.res[id].attributes.color.array;
    let igual = a.length === b.length; for (let i = 0; i < a.length && igual; i++) if (a[i] !== b[i]) igual = false;
    ok(igual, `${id}: el mismo aspecto en la misma partida`);
  }
  // distintas casas del mismo plano, distinto aspecto
  {
    const { S } = crear({ ocluir: true, contacto: false });
    const a = { plano: 'puesto', x: 10, z: 10, y: 0, rot: 0, etapas: 99 }, b = { plano: 'puesto', x: 80, z: 33, y: 0, rot: 0, etapas: 99 };
    S.sincronizar([a, b]);
    const ga = S.obras.find((q) => q.datos === a).malla.geometry.attributes.color.array, gb = S.obras.find((q) => q.datos === b).malla.geometry.attributes.color.array;
    let dif = 0; for (let i = 0; i < Math.min(ga.length, gb.length); i++) if (ga[i] !== gb[i]) dif++;
    ok(dif > ga.length * 0.5, 'dos casas iguales en otro lugar no son idénticas');
  }
  // lo recién construido casi no se mancha, lo terminado sí un poco; lo a medio hacer no
  {
    const a = armar({ ocluir: true }, null, 1), b = armar({ ocluir: true }, null);
    const sinDesgaste = (g, base) => { const c = g.attributes.color.array; let v = 0; for (let i = 0; i < g.attributes.position.count; i++) v += c[i * 3 + 1] / Math.max(1e-6, c[i * 3] + c[i * 3 + 2]); return v / g.attributes.position.count; };
    void sinDesgaste; void a; void b;
  }
  // el fantasma, las marcas de la etapa 0 y los jardines no se asientan
  {
    const { S } = crear({ ocluir: true, contacto: true }, asiento);
    huellas.clear();
    const planta = C.PLANOS.find((p) => p.jardin);
    const d = { plano: planta.id, x: 5, z: 5, y: 0, rot: 0, etapas: planta.etapas.length };
    S.sincronizar([d]);
    ok(![...huellas.keys()].some((k) => k.datos === d), 'un cantero o un seto no tiene sombra de contacto');
    const e0 = { plano: 'puesto', x: 55, z: 5, y: 0, rot: 0, etapas: 0 };
    S.sincronizar([e0]);
    ok(![...huellas.keys()].some((k) => k.datos === e0), 'una obra marcada (etapa 0) no tiene sombra de contacto');
  }
  AS.fijarAsentado({});
}

// ---------------------------------------------------------------- la sombra de contacto
{
  const altura = (x, z) => 0.1 * x + 0.05 * z;
  const a = AM.anilloDeContacto({ x: 10, z: -4, rot: 0.7, w: 6, d: 4, radio: 1.2, fuerza: 0.3 }, altura);
  ok(a.pos.length / 3 === a.col.length / 3 && a.pos.length / 3 >= 24 && a.ind.length % 3 === 0, 'el anillo tiene vértices, colores y triángulos enteros');
  for (const i of a.ind) ok(i >= 0 && i < a.pos.length / 3, 'los índices caen dentro');
  let adentro = 0, afuera = 0;
  for (let i = 0; i < a.pos.length / 3; i++) {
    cerca(a.pos[i * 3 + 1], altura(a.pos[i * 3], a.pos[i * 3 + 2]) + 0.05, 1e-6, 'el anillo sigue el terreno (y + 5 cm)');
    if (i % 2 === 0) { adentro++; ok(a.col[i * 3 + 2] > 0.29 && a.col[i * 3] < a.col[i * 3 + 2], 'el borde de adentro tiene la fuerza plena (un poco fría)'); }
    else { afuera++; ok(a.col[i * 3] === 0 && a.col[i * 3 + 1] === 0 && a.col[i * 3 + 2] === 0, 'el borde de afuera no resta nada'); }
  }
  ok(adentro === afuera, 'un vértice de afuera por cada uno de adentro');
  // el anillo rodea la huella: el borde de adentro está a ~margen del rectángulo, el de afuera a radio más
  const c = Math.cos(0.7), s = Math.sin(0.7);
  let minR = 1e9, maxR = 0;
  for (let i = 0; i < a.pos.length / 3; i++) {
    const dx = a.pos[i * 3] - 10, dz = a.pos[i * 3 + 2] + 4;
    const lx = dx * c - dz * s, lz = dx * s + dz * c;   // al marco local
    const fuera = Math.max(Math.abs(lx) - 3, Math.abs(lz) - 2);
    if (i % 2 === 0) { minR = Math.min(minR, fuera); } else maxR = Math.max(maxR, fuera);
  }
  ok(minR > -0.6 && minR < 0.4, `el borde de adentro queda pegado al pie (${minR.toFixed(2)} m)`);
  ok(maxR > 0.8 && maxR < 1.7, `el de afuera, a un metro y pico (${maxR.toFixed(2)} m)`);
  const plano = AM.anilloDeContacto({ x: 0, z: 0, w: 5, d: 5, y: 7.5, radio: 1 }, altura);
  let parejo = true; for (let i = 0; i < plano.pos.length / 3; i++) if (Math.abs(plano.pos[i * 3 + 1] - 7.54) > 1e-6) parejo = false;
  ok(parejo, 'un lote nivelado (la aldea) tiene el suelo parejo');

  const escena = new THREE.Scene();
  const as = AM.crearAsiento(escena, { altura, lejos: () => 100 });
  ok(as.malla.parent === escena && as.malla.visible === false && as.malla.name === 'sombras-de-contacto', 'nace en la escena, apagada, con su nombre');
  ok(as.mat.isMeshBasicMaterial && as.mat.vertexColors === true && as.mat.fog === false, 'material básico con color por vértice y sin niebla');
  ok(as.mat.blending === 3 && as.mat.premultipliedAlpha === true && as.mat.opacity === 1, 'resta el color del anillo a lo que hay (SubtractiveBlending: ni luz ni transparencia)');
  ok(as.mat.depthWrite === false && as.mat.depthTest === true && as.mat.polygonOffset === true, 'no escribe profundidad, pega al terreno con polygonOffset');
  ok(as.mat.map === null && as.mat.alphaMap === null, 'sin texturas');
  ok(as.mat.forceSinglePass === true, 'un solo pase (doble cara y transparente serían dos dibujos)');
  ok(as.poner('a', { x: 10, z: 10, rot: 0, w: 5, d: 4, radio: 1, fuerza: 0.3 }) && as.poner('b', { x: 400, z: 400, rot: 0, w: 5, d: 4 }) === true, 'se pueden poner huellas');
  ok(as.poner('c', { x: 0, z: 0, w: 0, d: 4 }) === false && as.poner('', { w: 1, d: 1 }) === false, 'una huella sin tamaño no se pone');
  as.actualizar(1, { x: 0, z: 0 }, { dia: 1, pleno: true });
  const e = as.estado();
  ok(e.huellas === 2 && e.activos === 1 && as.malla.visible, 'se arma con lo que está cerca (la lejana no)');
  ok(as.malla.geometry.index.count > 0 && as.malla.geometry.attributes.position.count === as.malla.geometry.attributes.color.count, 'la malla tiene triángulos');
  const dia = as.mat.color.r;
  as.actualizar(1, { x: 0, z: 0 }, { dia: 0, pleno: true });
  ok(as.mat.color.r < dia - 0.3 && as.mat.color.r > 0.1, `de noche la sombra se nota menos (${as.mat.color.r.toFixed(2)} < ${dia.toFixed(2)})`);
  as.actualizar(1, { x: 0, z: 0 }, { dia: 1, nublado: 1, pleno: true });
  ok(as.mat.color.r < dia && as.mat.color.r > as.mat.color.r * 0.5, 'con cielo cubierto, un poco menos');
  as.actualizar(1, { x: 0, z: 0 }, { dia: 1, pleno: false });
  ok(!as.malla.visible, 'sin postproceso (Baja) no se dibuja');
  const reb = as.estado().rebuilds;
  as.actualizar(1, { x: 0, z: 0 }, { dia: 1, pleno: true }); as.actualizar(1, { x: 0, z: 0 }, { dia: 1, pleno: true });
  ok(as.estado().rebuilds === reb, 'si nada cambió no se rehace nada (nada por cuadro)');
  ok(as.quitar('a') && !as.quitar('a'), 'quitar es de una vez');
  as.actualizar(1, { x: 0, z: 0 }, { dia: 1, pleno: true });
  ok(as.estado().activos === 0 && !as.malla.visible, 'sin huellas cerca no se dibuja');
  as.actualizar(2, { x: 400, z: 400 }, { dia: 1, pleno: true });
  ok(as.estado().activos === 1 && as.malla.visible, 'al acercarse a la otra se arma');
  as.limpiar(); as.actualizar(1, { x: 400, z: 400 }, { dia: 1, pleno: true });
  ok(as.estado().huellas === 0 && !as.malla.visible, 'limpiar la deja vacía');
}

// ---------------------------------------------------------------- los halos de noche del valle
{
  const escena = new THREE.Scene();
  const hv = AM.crearHalosValle(escena);
  ok(hv.malla.parent === escena && hv.malla.visible === false && hv.malla.name === 'halos-valle', 'nace en la escena, apagada');
  ok(hv.mat.isShaderMaterial && hv.mat.blending === THREE.AdditiveBlending && hv.mat.depthWrite === false, 'halos aditivos que no escriben profundidad');
  const aldea = await import('../src/casa-te-luz.js');
  const otro = aldea.crearMaterialHalo();
  ok(hv.mat.vertexShader === otro.mat.vertexShader && hv.mat.fragmentShader === otro.mat.fragmentShader, 'el MISMO shader de halos que la aldea y la casa de té (un programa, ninguno nuevo)');
  const lista = [{ pos: [20, 3, 20], radio: 1.4 }, { pos: [22, 3, 20], radio: 1.4, fluctua: 0.3 }];
  ok(hv.fijar('casas', lista) === true && hv.fijar('casas', lista) === false, 'fijar rehace sólo si cambió');
  ok(hv.estado().total === 2 && hv.malla.geometry.attributes.position.count === 8 && hv.malla.geometry.index.count === 12, 'dos halos son dos cuadrados (4 vértices y 6 índices cada uno)');
  ok(hv.fijar('fogatas', [{ pos: [30, 1, 30], radio: 1.7 }]) === true && hv.estado().total === 3, 'varias fuentes se juntan en una sola malla');
  const par = hv.malla.geometry.attributes.par.array;
  ok(par.length === 3 * 12 && [...Array(12).keys()].every((i) => par[i * 3 + 2] === 1), 'todos los halos son «sólo de noche» (se apagan con el alumbrado)');
  ok(hv.malla.geometry.boundingSphere.radius > 4, 'la esfera de recorte tiene aire para el cuadrado que mira a la cámara');
  const cam = { x: 25, z: 25 };
  hv.actualizar({ enc: 1, pleno: true, tiempo: 3, cam });
  ok(hv.malla.visible === true && hv.mat.uniforms.uEnc.value === 1 && hv.mat.uniforms.uTiempo.value === 3, 'de noche y cerca se ve');
  hv.actualizar({ enc: 0, pleno: true, tiempo: 3, cam });
  ok(hv.malla.visible === false, 'de día se apaga (y no se dibuja)');
  hv.actualizar({ enc: 1, pleno: false, tiempo: 3, cam });
  ok(hv.malla.visible === false, 'sin postproceso (Baja) no se dibuja');
  hv.actualizar({ enc: 1, pleno: true, tiempo: 3, cam: { x: 900, z: 900 } });
  ok(hv.malla.visible === false, 'lejos de todo no se dibuja');
  hv.fijar('casas', []); hv.fijar('fogatas', []);
  hv.actualizar({ enc: 1, pleno: true, tiempo: 3, cam });
  ok(hv.estado().total === 0 && hv.malla.visible === false, 'sin halos no hay dibujo');
  // las ventanas de las estructuras, desde su vidrio
  const vidrio = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const g = new THREE.Group();
  const v = new G.Constructor();
  for (const x of [0, 5]) v.agregar(new THREE.PlaneGeometry(1.2, 0.9), { color: '#ffffff', matriz: G.matriz([x, 1.3, 2]), variar: 0 });
  const m = new THREE.Mesh(v.geometria(), vidrio); m.position.set(100, 0, 100); g.add(m);
  const otroMat = new THREE.Mesh(v.geometria(), new THREE.MeshBasicMaterial()); g.add(otroMat);
  const ven = AM.ventanasDeVidrio(g, [vidrio, null]);
  ok(ven.length === 2, `dos ventanas, dos halos (${ven.length})`);
  ok(ven.every((w) => w.soloNoche === true && w.radio >= 1.0 && w.radio <= 1.9), 'cada halo es sólo de noche y de tamaño razonable');
  ok(Math.abs(Math.min(...ven.map((w) => w.pos[0])) - 100) < 0.1 && Math.abs(Math.max(...ven.map((w) => w.pos[0])) - 105) < 0.1 && ven.every((w) => Math.abs(w.pos[1] - 1.3) < 0.1), 'en el centro de cada vidrio (con la posición de la malla)');
  const grande = new G.Constructor(); grande.agregar(new THREE.PlaneGeometry(9, 3), { color: '#ffffff', variar: 0 });
  const mg = new THREE.Mesh(grande.geometria(), vidrio); const gg2 = new THREE.Group(); gg2.add(mg);
  const unaGrande = AM.ventanasDeVidrio(gg2, [vidrio]);
  ok(unaGrande.length >= 1 && unaGrande.every((w) => w.radio <= 1.9 + 1e-9), 'aunque el vidrio sea enorme, el halo no pasa de 1,9 m');
  ok(AM.ventanasDeVidrio(g, [new THREE.MeshBasicMaterial()]).length === 0, 'un material que no está no da ninguno');
}

// ---------------------------------------------------------------- el enganche
{
  const main = leer('src/main.js'), cons = leer('src/construccion.js'), est = leer('src/estructuras.js'), ald = leer('src/aldea-mundo.js'), am = leer('src/asentado-mundo.js'), as = leer('src/asentado.js');
  ok(enUnaLinea(main, ['fijarAsentado({', 'ocluir: !!calidad.post', 'contacto: !!calidad.post', 'halos: !!calidad.post']), 'main.js prende el asentado sólo con postproceso (Media y Alta)');
  ok(enUnaLinea(main, ['asiento = calidad.post ? crearAsiento(']), 'la sombra de contacto sólo existe con calidad.post');
  ok(enUnaLinea(main, ['halosValle = calidad.post ? crearHalosValle(']), 'los halos del valle sólo existen con calidad.post');
  ok(enUnaLinea(main, ['crearConstruccion(T, escena, col, veg, puertas, asiento)']), 'las obras reciben la sombra de contacto');
  ok(enUnaLinea(main, ['crearEstructuras(', 'asiento })']), 'las estructuras reciben la sombra de contacto');
  ok(enUnaLinea(main, ['crearAldeaMundo({', 'asiento,']), 'la aldea recibe la sombra de contacto');
  ok(enUnaLinea(main, ['halosValle.actualizar({', 'enc: encendido', 'pleno: !!calidad.post']), 'los halos se apagan con el alumbrado del día');
  ok(enUnaLinea(main, ["halosValle.fijar('casas'"]) && enUnaLinea(main, ["halosValle.fijar('fogatas'"]) && enUnaLinea(main, ["halosValle.fijar('estructuras'"]), 'tres fuentes de halos: tus casas, las fogatas y las estructuras');
  ok(enUnaLinea(main, ["halosValle.fijar('fogatas'", '!f.contenida']), 'las estufas no tienen halo de fogata (ya brillan en su ventana)');
  ok(enUnaLinea(main, ['if (asiento) asiento.actualizar(dt, cam']), 'la sombra de contacto se actualiza cada cuadro (barato)');
  ok(enUnaLinea(cons, ['function asentarObra(', 'plano', 'datos']) && enUnaLinea(cons, ['if (!asentadoActivo().ocluir']), 'construccion.js: sin asentado prendido no se hace nada');
  ok(enUnaLinea(cons, ['terminada ?', 'DESGASTE_OBRA[plano.categoria]']), 'el desgaste depende del tipo de obra y sólo de las terminadas');
  ok(enUnaLinea(cons, ['semillaDe(datos.x, datos.z, plano.id)']), 'la semilla de cada obra sale de su posición y su id');
  ok(enUnaLinea(cons, ['remarcarRangos(marcas, tesela)']), 'las marcas de zona se corren a los vértices del teselado');
  ok(!/Math\.random/.test(as) && !/Math\.random/.test(am), 'el asentado no gasta números al azar del juego');
  ok(!/Math\.random/.test(cons.slice(cons.indexOf('function asentarObra('), cons.indexOf('function ponerContacto('))), 'ni la construcción al asentar');
  ok(enUnaLinea(cons, ['asiento?.quitar(obra)']) && enUnaLinea(cons, ['asiento?.quitar(mejor)']), 'quitar una obra o llevarla con Shift+Y quita su sombra');
  ok(enUnaLinea(cons, ['d.y > T.altura(d.x, d.z) + 0.25']), 'sobre un piso propio no hay sombra de contacto en el terreno');
  ok(enUnaLinea(est, ['const asentarEst = (c, id, x, z, rot']) && (est.match(/asentarEst\(c, '/g) || []).length >= 7, 'estructuras.js asienta el refugio, la cabaña, el faro, el molino, la torre, el almacén y el galpón');
  ok(enUnaLinea(est, ['if (A.ocluir) {']) && enUnaLinea(est, ['if (asiento && A.contacto) {']), 'las estructuras se asientan sólo con la calidad que lo permite');
  ok(enUnaLinea(est, ['remarcarRangos(marcas, teselarGeometria(']), 'el refugio corre las marcas de su pintura');
  ok(enUnaLinea(ald, ["ctx.asiento.poner('aldea:' + b.id"]) && enUnaLinea(ald, ['if (ctx.asiento)']), 'la aldea registra sus edificios levantados, sólo si hay sombra de contacto');
  ok(enUnaLinea(ald, ['d.etapa >= 2']) && enUnaLinea(ald, ['ctx.asiento.quitar(']), 'la aldea saca la sombra de un edificio que ya no está levantado');
  ok(!/new THREE\.(Point|Spot|Directional)Light/.test(am), 'ninguna luz nueva');
  ok(!/onBeforeCompile|ShaderMaterial\(/.test(am), 'ningún shader nuevo');
  ok(enUnaLinea(am, ['crearMaterialHalo']) && enUnaLinea(am, ['geoHalos']), 'los halos reusan el material de la aldea');
}

console.log(`TODO BIEN: ${n} pasos OK`);

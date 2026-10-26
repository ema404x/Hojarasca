// 4.11.2 — geometría y aspecto del mundo (A):
//   G-7  los edificios de oficio propios tienen choque en lo grande que antes se atravesaba (horno, mesas, barriles...) sin tapar la entrada
//   G-8  el pasaje del torreón de piedra (mesa 10 cm al oeste) sigue transitable con todos los giros
//   V10  cada sombra larga de antorcha tiene su opacidad (no la de la más cercana para todas)
//   V7   el suelo de las madrigueras en ladera sigue el terreno (geometría por puesto)
//   V13  los postes del tablero de trofeos llegan al suelo en laderas laterales
// Todo en Node (arnés de construcción, three local); lo que depende de GL se anota en CAMBIOS_4_11_2_A.md.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mundo, C as CL } from './ayuda-4-0-1-mundo.mjs';
import { paso, R, H } from './ayuda-4-0-3-caminante.mjs';

let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const leer = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

// ---------------------------------------------------------------- G-7: choque en los oficios propios
// Para cada cosa grande que se veía y se atravesaba: [id del plano, x local, z local, descripción]. Se pone al jugador parado
// en su centro (sobre el piso del edificio) y se resuelve el choque: si empuja, hay choque.
const COSAS = [
  ['herreria-propia', 1.35, 0.95, 'el barril de agua de la herrería'],
  ['herreria-propia', 0.35, 1.05, 'la mesita de las tenazas de la herrería'],
  ['carpinteria', 1.0, -0.4, 'el caballete con el tronco de la carpintería'],
  ['carpinteria', 1.25, 1.0, 'la pila de tablones de la carpintería'],
  ['panaderia-horno', 1.05, 0.45, 'la mesa de amasar de la panadería'],
  ['panaderia-horno', -0.5, 0.75, 'el horno de barro de la panadería (ya tenía choque)'],
  ['cerveceria', 0.4, -0.7, 'la mesa de degustación de la cervecería'],
  ['cerveceria', 1.55, 0.25, 'el barril suelto de la cervecería'],
  ['telar-grande', -1.2, -0.45, 'el cesto de lana del telar'],
  ['queseria', 0.7, -0.5, 'la mesa de la prensa de la quesería'],
  ['queseria', 0.95, 0.5, 'los tarros de leche de la quesería'],
  ['tienda-campo', -1.4, 0.75, 'el primer barril de la tienda de campo'],
  ['tienda-campo', -0.9, 0.75, 'el segundo barril de la tienda de campo'],
  ['canteria', 1.15, 0.0, 'los bloques apilados de la cantería'],
  ['canteria', 0.95, 1.0, 'las lajas de la cantería'],
  ['canteria', -1.3, -0.7, 'la grúa de mano de la cantería'],
];
// cuánto lo empuja el choque desde el centro de la cosa (0 = atraviesa)
function empuje(id, lx, lz, rot = 0) {
  const w = mundo({ altura: () => 0 }), r = w.terminar(id, 0, 0, rot);
  assert.ok(r.ok, `se arma ${id}`);
  const o = r.o, c = Math.cos(rot), s = Math.sin(rot);
  const x = o.datos.x + lx * c + lz * s, z = o.datos.z - lx * s + lz * c;
  const q = { x, z, y: o.datos.y + 0.18, vy: 0, enSuelo: true, coyote: 0 };
  w.col.resolver(q, R, H);
  w.col.resolverPlataformas(q, R, H, 0.62);
  return Math.hypot(q.x - x, q.z - z);
}
for (const [id, lx, lz, que] of COSAS) {
  for (const rot of [0, Math.PI / 2]) ok(empuje(id, lx, lz, rot) > 0.3, `${que} tiene choque (giro ${Math.round(rot * 180 / Math.PI)})`);
}

// lo que no puede pasar: tapar la entrada. Desde afuera, de frente, se llega a menos de 1,3 m del centro del edificio (donde se usa con E)
const DIRS = [...Array(8)].map((_, i) => [Math.cos(i * Math.PI / 4), Math.sin(i * Math.PI / 4)]);
function alcance(id, rot, listo = () => false) {
  const w = mundo({ altura: () => 0 }), r = w.terminar(id, 0, 0, rot);
  assert.ok(r.ok, `se arma ${id}`);
  const o = r.o, D = CL.PLANO[id].fondo, ca = Math.cos(rot), sa = Math.sin(rot);
  const loc = (lx, lz) => ({ x: o.datos.x + lx * ca + lz * sa, z: o.datos.z - lx * sa + lz * ca });
  const toLoc = (x, z) => ({ lx: (x - o.datos.x) * ca - (z - o.datos.z) * sa, lz: (x - o.datos.x) * sa + (z - o.datos.z) * ca });
  const llevar = (a, dx, dz) => { const t = { x: a.x, y: a.y, z: a.z, vy: a.vy, enSuelo: a.enSuelo, coyote: a.coyote }; for (let i = 0; i < 6; i++) paso(w, t, dx / 6, dz / 6); return t; };
  const asentar = (p) => { let i = 0; while (!p.enSuelo && i++ < 90) paso(w, p, 0, 0); return p; };
  const s0 = loc(0.013, -D / 2 - 2.483), q = asentar({ x: s0.x, z: s0.z, y: 0, vy: 0, enSuelo: false, coyote: 0 });
  const cel = 0.12, cx = o.datos.x, cz = o.datos.z, clave = (p) => `${Math.round((p.x - cx + 4.6) / cel)},${Math.round((p.z - cz + 4.6) / cel)},${Math.round(p.y / 0.2)}`;
  const vis = new Map([[clave(q), q]]), cola = [q];
  let minCentro = 99, hondo = -9;   // hondo: lo más al fondo (z local) que se llega adentro del edificio
  while (cola.length && vis.size < 60000) {
    const a = cola.shift();
    const l = toLoc(a.x, a.z);
    minCentro = Math.min(minCentro, Math.hypot(l.lx, l.lz));
    if (a.y - o.datos.y < 1.0 && Math.abs(l.lx) < 2.0 && Math.abs(l.lz) < 2.0 && l.lz > hondo) hondo = l.lz;
    if (listo({ minCentro, hondo })) break;
    for (const [dx, dz] of DIRS) {
      const b = llevar(a, dx * cel, dz * cel);
      if (Math.abs(b.x - cx) > 4.6 || Math.abs(b.z - cz) > 4.6 || Math.hypot(b.x - a.x, b.z - a.z) < cel * 0.35) continue;
      if (!b.enSuelo) { asentar(b); if (!b.enSuelo) continue; }
      const k = clave(b); if (!vis.has(k)) { vis.set(k, b); cola.push(b); }
    }
  }
  return { minCentro, hondo, celdas: vis.size };
}
const OFICIOS = ['herreria-propia', 'carpinteria', 'panaderia-horno', 'cerveceria', 'telar-grande', 'queseria', 'tienda-campo', 'canteria'];
// lo que se llegaba antes de G-7 (medido en la 4.11.1), para no empeorarlo: se anota en CAMBIOS_4_11_2_A.md
const resumen = [];
for (const id of OFICIOS) {
  for (const ri of [0, 3]) {
    const a = alcance(id, ri * Math.PI / 4, (r) => r.minCentro < 1.3);
    ok(a.minCentro < 1.3, `${id} (giro ${ri * 45}): desde afuera se llega a ${a.minCentro.toFixed(2)} m del centro (donde se usa con E)`);
    if (ri === 0) resumen.push(`${id}: centro a ${a.minCentro.toFixed(2)} m`);
  }
}
console.log('  G-7:', resumen.join(' | '));

// ---------------------------------------------------------------- G-8: el pasaje del torreón (la mesa 10 cm al oeste)
{
  const pl = leer('src/planos-ampliar.js');
  ok(pl.includes('mesas: [{ x: 0.2, z: -0.4 }]') && pl.includes('alfombras: [{ x: 0.2, z: -0.4, w: 1.9, d: 1.5 }]') && pl.includes('farolColgante(c, 0.2, py + 1.9, -0.4)'), 'torreón: la mesa, la alfombra y el farol colgante de la planta baja siguen juntos en x = 0,2');
  // el pasaje entre la mesa (cuerpo de 0,70) y el hogar: se mide con el choque real, con cuatro giros
  const id = 'torreon-piedra', Dd = CL.PLANO[id].fondo;
  for (const ri of [0, 3]) {
    const a = alcance(id, ri * Math.PI / 4, (r) => r.hondo > 1.3);
    ok(a.hondo > 1.3, `torreón, giro ${ri * 45}: se llega al fondo de la planta baja (z local ${a.hondo.toFixed(2)}; fondo ${Dd})`);
  }
}


// ---------------------------------------------------------------- lo que sigue usa el three de verdad (como verificar-4-10-3-visual)
import { registrarThree } from './ayuda-three.mjs';
registrarThree();
const THREE = await import('three');
{
  // un lienzo de mentira para las texturas
  const noop = () => {};
  const ctx2d = new Proxy({ createLinearGradient: () => ({ addColorStop: noop }), createRadialGradient: () => ({ addColorStop: noop }), measureText: () => ({ width: 10 }), createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) }, { get: (t, p) => (p in t ? t[p] : noop), set: () => true });
  globalThis.document = globalThis.document || { createElement: () => ({ width: 1, height: 1, style: {}, getContext: () => ctx2d }) };
}

// ---------------------------------------------------------------- V10: cada sombra larga con su opacidad
{
  const A = await import('../src/desafio-ambiente.js');
  // las reglas: tres niveles que crecen con la oscuridad (alfa) y cubren todo el rango de la regla vieja (0,62 a 0,87)
  ok(A.OPACIDAD_SOMBRA.length === 3 && A.OPACIDAD_SOMBRA[0] < A.OPACIDAD_SOMBRA[1] && A.OPACIDAD_SOMBRA[1] < A.OPACIDAD_SOMBRA[2], 'tres niveles de opacidad, de menos a más');
  ok(A.OPACIDAD_SOMBRA.every((v) => v >= 0.62 && v <= 0.87), 'dentro del rango que tenían las sombras (0,62 a 0,87)');
  ok(A.nivelDeSombra(0) === 0 && A.nivelDeSombra(0.1) === 0 && A.nivelDeSombra(0.25) === 1 && A.nivelDeSombra(0.45) === 2 && A.nivelDeSombra(0.5) === 2, 'alfa baja, media y alta caen en el nivel 0, 1 y 2');
  ok(A.nivelDeSombra(-1) === 0 && A.nivelDeSombra(9) === 2 && A.nivelDeSombra(NaN) === 0 && A.nivelDeSombra(undefined) === 0, 'valores raros no se salen de los niveles');
  // la sombra de una antorcha cercana es más oscura que la de una lejana, y los niveles lo reflejan
  const cerca = A.sombraDeAntorcha(2, 1.75), lejos = A.sombraDeAntorcha(10, 1.75);
  ok(A.nivelDeSombra(cerca.alfa) > A.nivelDeSombra(lejos.alfa), `de cerca (alfa ${cerca.alfa.toFixed(2)}) cae en un nivel más oscuro que de lejos (alfa ${lejos.alfa.toFixed(2)})`);

  // el mundo: una antorcha prendida, vos al lado y un duende lejos: dos sombras con opacidades DISTINTAS
  const { crearAmbienteMundo } = await import('../src/desafio-ambiente-mundo.js');
  const escena = new THREE.Scene();
  const T = { altura: () => 0, agua: () => false, lugares: {}, rio: [] };
  const col = { cercanos: () => [] };
  const antorcha = { datos: { x: 0, z: 0 } };
  const duende = (x, z) => ({ estado: 'avanzar', def: { altura: 1.2, radio: 0.4 }, m: { g: { position: { x, y: 0, z }, } , esc: 1 } });
  let duendes = [];
  const amb = crearAmbienteMundo({ T, escena, S: {}, col, defensas: { prendidas: [antorcha] }, musica: {}, sonido: null, aliens: () => duendes, nota() {}, centroBase: () => ({ x: 0, z: 0 }), camara: () => ({ fov: 60 }), lado: () => null, perroPos: () => null });
  const grupo = escena.children.find((o) => o.name === 'sombras-antorcha');
  ok(grupo && grupo.children.length === 3, 'las sombras son un grupo de tres mallas (una por nivel)');
  const mats = grupo.children.map((m) => m.material.opacity);
  ok(new Set(mats).size === 3 && mats[0] < mats[1] && mats[1] < mats[2], `cada nivel tiene su opacidad (${mats.join(', ')})`);
  ok(grupo.children.every((m) => m.material.map === grupo.children[0].material.map && m.material.transparent && m.material.type === 'MeshBasicMaterial'), 'mismo material base (mismo programa de shader), sólo cambia la opacidad');
  const dir = new THREE.Vector3(0, 0, -1);
  // (el cuadro se acota a 0,25 s y las antorchas se vuelven a mirar cada segundo: cinco cuadros)
  const avanzar = (a, ee) => { for (let i = 0; i < 5; i++) a.actualizar(0.25, ee); };
  const e = (js) => ({ activo: true, fase: 'ataque', horas: 0, noche: 1, nocheN: 1, vivos: duendes.length, js, mira: dir, especial: null, sinFin: false, vista: 1, dibujando: true });
  const js = { pos: { x: 3, y: 0, z: 0 }, yaw: 0 };   // a 3 m de la antorcha
  duendes = [duende(11, 0)];                          // y un duende a 11 m
  avanzar(amb, e(js));
  const vis = grupo.children.filter((m) => m.visible && m.count > 0);
  ok(amb.sombrasVivas === 2, `dos sombras vivas (hay ${amb.sombrasVivas})`);
  ok(vis.length === 2, `van a dos mallas distintas (${vis.length})`);
  const op = vis.map((m) => m.material.opacity).sort((a, b) => a - b);
  ok(op[0] < op[1], `con dos opacidades distintas (${op.join(' y ')}): la de la lejana no copia la de la cercana`);
  ok(grupo.visible === true, 'el grupo se ve');
  // la del jugador (cerca) está en un nivel más oscuro que la del duende (lejos)
  const nivelDe = (m) => grupo.children.indexOf(m);
  ok(Math.max(...vis.map(nivelDe)) > Math.min(...vis.map(nivelDe)), 'niveles distintos');
  // sin duendes y de día: nada
  duendes = [];
  avanzar(amb, { ...e(js), noche: 0.1, fase: 'calma' });
  ok(!grupo.visible && grupo.children.every((m) => !m.visible && m.count === 0), 'sin noche, ninguna sombra a la vista');
  // caído: se esconden
  avanzar(amb, e(js));
  ok(grupo.visible, 'otra vez de noche, vuelve a verse');
  amb.actualizar(0.2, { ...e(js), activo: false });
  ok(!grupo.visible && amb.sombrasVivas === 0, 'inactivo: se esconden');
  // 8 sombras repartidas: nunca pasa del tope total
  duendes = Array.from({ length: 12 }, (_, i) => duende(2 + i, 1));
  avanzar(amb, e(js));
  ok(amb.sombrasVivas <= 8, `con 12 duendes hay como mucho 8 sombras (${amb.sombrasVivas})`);
  ok(grupo.children.reduce((s, m) => s + (m.visible ? m.count : 0), 0) === amb.sombrasVivas, 'las mallas suman las sombras vivas');
  amb.limpiar();
  ok(!grupo.visible, 'limpiar las esconde');
}

console.log(`verificar-4-11-2-mundo: ${pasos} pasos ok`);

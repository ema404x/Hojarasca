// 4.30.1 (A): el caballo de la captura del usuario (la Plaza de los Duendes, de mañana).
//  1. Donde lo dejes (o donde aparezca) no queda adentro de troncos, paredes ni muebles, ni al borde de un escalón: `lugarLibreCaballo` (caballo.js) busca el lugar libre más cercano para
//     los cuatro discos del cuerpo (anca, cinchera, pecho y cabeza), sin pasar al otro lado de una pared; tu caballo lo usa al esperarte (main.js) y los dos
//     atados de la plaza (aldea-animales-mundo.js: el Moro de la captura estaba en el lugar del retablo y de un álamo) al pararse, sin pisarse entre ellos.
//  2. Las riendas cuelgan en curva (cuero flojo) por fuera del pescuezo y de la cabeza; el estribo es un arco, no un disco que de costado parecía una bola.
//  3. Los cuatro cascos apoyan: altura e inclinación salen del suelo bajo cada casco (`apoyoCaballo`) y el grupo gira en orden YXZ (antes XYZ: el cabeceo iba
//     sobre el eje x del mundo, y de costado a la loma quedaba torcido con cascos en el aire hasta 19 cm).
//  4. El pescuezo llega a la nuca (la cabeza ya no asoma encima como pieza encastrada) y una garganta une la quijada con el cuello.
// Mutaciones: cada una es una copia del archivo con otro nombre, probada en su propio proceso; tiene que hacer fallar su comprobación.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const THREE = await import('three');
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const CAB = process.env.HX_CAB || path.join(raiz, 'src/caballo.js');
const CABM = process.env.HX_CABM || path.join(raiz, 'src/caballo-mundo.js');
const JUG = process.env.HX_JUG || path.join(raiz, 'src/jugador.js');
const SOLO = process.env.HX_SOLO || '';   // (en una mutación: qué parte correr)
const C = await import(pathToFileURL(CAB).href);
const { crearColisiones } = await import('../src/colisiones.js');

// ---------------------------------------------------------------- 1. dónde cabe
function pruebaLugar() {
  const col = crearColisiones();
  col.agregar({ x: 0, z: 0, r: 0.4 });                                       // un tronco
  col.agregar({ seg: true, ax: 6, az: -3, bx: 6, bz: 3, r: 0.15 });          // una pared
  const op = { empujar: (p, r, h) => col.resolver(p, r, h), alturaEn: () => 0, paredEntre: (ax, az, bx, bz, y0, y1) => col.paredEntre(ax, az, bx, bz, y0, y1, false) };
  // te bajaste de cola al tronco (como en la captura): la grupa adentro
  const d = { x: 0.9, z: 0, yaw: Math.PI / 2 };
  ok(!C.caballoLibre(d.x, d.z, d.yaw, op), 'de cola al tronco, el caballo no cabe (la grupa queda adentro)');
  const l = C.lugarLibreCaballo(d, op);
  ok(l.movido && C.caballoLibre(l.x, l.z, l.yaw, op), `se corre a un lugar libre (${l.x.toFixed(2)}, ${l.z.toFixed(2)})`);
  ok(Math.hypot(l.x - d.x, l.z - d.z) <= 0.76 && l.yaw === d.yaw, `el más cercano y mirando para el mismo lado (${Math.hypot(l.x - d.x, l.z - d.z).toFixed(2)} m)`);
  for (const [dd, r] of C.CUERPO_CABALLO) { const cx = l.x + Math.sin(l.yaw) * dd, cz = l.z + Math.cos(l.yaw) * dd; ok(Math.hypot(cx, cz) >= 0.4 + r - 0.01, `ningún disco del cuerpo toca el tronco (${dd})`); }
  // libre, no se toca
  const f = C.lugarLibreCaballo({ x: 3, z: 3, yaw: 0.4 }, op);
  ok(!f.movido && f.x === 3 && f.z === 3 && f.yaw === 0.4, 'donde cabe, queda exactamente donde estaba');
  // la cabeza del otro lado de una pared fina: no cabe (aunque la pared no empuje a ningún disco)
  const fina = crearColisiones();
  fina.agregar({ seg: true, ax: 1, az: -3, bx: 1, bz: 3, r: 0.14 });
  const opF = { empujar: () => {}, alturaEn: () => 0, paredEntre: (ax, az, bx, bz, y0, y1) => fina.paredEntre(ax, az, bx, bz, y0, y1, false) };
  ok(!C.caballoLibre(0, 0, Math.PI / 2, opF), 'con la cabeza del otro lado de una pared fina no cabe');
  ok(C.caballoLibre(-2, 0, Math.PI / 2, opF), 'del todo de este lado, sí');
  // nunca al otro lado de una pared: si de este lado no hay lugar, se queda (antes que aparecer del otro lado)
  const opP = { empujar: (p, r) => { if (p.x < 1 + r) p.x = 1 + r; }, alturaEn: () => 0, paredEntre: (ax, az, bx) => (ax - 0.5) * (bx - 0.5) < 0 };
  const sinLugar = C.lugarLibreCaballo({ x: 0, z: 0, yaw: 0 }, opP);
  ok(!sinLugar.movido && sinLugar.x === 0, 'no lo pasa al otro lado de una pared aunque ahí haya lugar');
  // de costado o dado vuelta sólo si mirando para el mismo lado no entra en 1,5 m (un pasillo de 1,6 m de ancho entre dos paredes)
  const pas = crearColisiones();
  pas.agregar({ seg: true, ax: -0.8, az: -20, bx: -0.8, bz: 20, r: 0.1 }); pas.agregar({ seg: true, ax: 0.8, az: -20, bx: 0.8, bz: 20, r: 0.1 });
  const opPas = { empujar: (p, r, h) => pas.resolver(p, r, h), alturaEn: () => 0, paredEntre: (ax, az, bx, bz, y0, y1) => pas.paredEntre(ax, az, bx, bz, y0, y1, false) };
  const cruzado = C.lugarLibreCaballo({ x: 0, z: 0, yaw: Math.PI / 2 }, opPas);
  ok(cruzado.movido && Math.abs(Math.sin(cruzado.yaw)) < 1e-9 && Math.abs(cruzado.x) <= 0.26, `cruzado en un pasillo angosto, se acomoda a lo largo (girando) sin pasar las paredes (${cruzado.x.toFixed(2)}, ${cruzado.z.toFixed(2)})`);
  const derecho = C.lugarLibreCaballo({ x: 0.3, z: 0, yaw: 0 }, opPas);
  ok(derecho.movido && Math.abs(derecho.yaw) < 1e-9 && Math.abs(derecho.x) < 0.3, 'a lo largo del pasillo, se corre al medio sin girar');
  // al borde de un escalón de 70 cm (el Moro quedaba con las manos en la plaza y las patas abajo): no; se corre hasta apoyar parejo
  const escalon = { empujar: () => {}, alturaEn: (x) => (x < 0 ? 0 : 0.7) };
  ok(!C.caballoLibre(0, 0, Math.PI / 2, escalon), 'al borde de un escalón alto no se para');
  const fuera = C.lugarLibreCaballo({ x: 0, z: 0, yaw: Math.PI / 2 }, escalon);
  ok(fuera.movido && C.caballoLibre(fuera.x, fuera.z, fuera.yaw, escalon), `se corre a donde apoya parejo (${fuera.x.toFixed(2)})`);
  ok(C.caballoLibre(0, 0, 0, { empujar: () => {}, alturaEn: (x, z) => 0.38 * z }), 'en una loma de 21° sí se para');
  // sin colisión (pruebas viejas, el Desafío): no se mueve
  ok(!C.lugarLibreCaballo({ x: 1, z: 2, yaw: 0 }, {}).movido, 'sin colisión no hace nada');
}

// ---------------------------------------------------------------- 3. los cuatro cascos
const HOOF = [[-0.2, 0.62], [0.2, 0.62], [-0.2, -0.62], [0.2, -0.62]];
function cascosSobre(suelo, x, z, yaw, ap, orden = 'YXZ') {
  const g = new THREE.Object3D(); g.rotation.order = orden; g.position.set(x, ap.y, z); g.rotation.set(ap.pitch, yaw, ap.roll); g.updateMatrixWorld(true);
  return HOOF.map(([px, pz]) => { const v = new THREE.Vector3(px, 0, pz).applyMatrix4(g.matrixWorld); return v.y - suelo(v.x, v.z); });
}
function pruebaApoyo() {
  const planos = [[0.27, 0], [0, 0.27], [0.2, -0.15], [-0.31, 0.12]];
  for (const [a, b] of planos) for (const yaw of [0, 0.7, Math.PI / 2, 2.4, -1.1]) {
    const suelo = (x, z) => 3 + a * x + b * z;
    const ap = C.apoyoCaballo((x, z) => suelo(x, z), 10, -4, yaw);
    const err = Math.max(...cascosSobre(suelo, 10, -4, yaw, ap).map(Math.abs));
    ok(err < 0.012, `en una loma (${a}, ${b}) mirando a ${yaw}: los cuatro cascos en el suelo (${(err * 100).toFixed(1)} cm)`);
    // (lo de antes: la normal en el centro, con tope de 0,22 rad, y el orden XYZ)
    if (a === 0.27 && yaw === Math.PI / 2) {
      const ny = 1 / Math.hypot(a, b, 1), nx = -a * ny, nz = -b * ny;
      const adel = nx * Math.sin(yaw) + nz * Math.cos(yaw), lat = nx * Math.cos(yaw) - nz * Math.sin(yaw);
      const viejo = { y: suelo(10, -4), pitch: Math.max(-0.22, Math.min(0.22, Math.atan2(adel, ny))), roll: Math.max(-0.176, Math.min(0.176, -Math.atan2(lat, ny))) };
      const errV = Math.max(...cascosSobre(suelo, 10, -4, yaw, viejo, 'XYZ').map(Math.abs));
      ok(errV > 0.05, `(antes, en la misma loma, un casco quedaba a ${(errV * 100).toFixed(0)} cm del suelo)`);
    }
  }
  // un suelo que no es plano: el mejor plano (el promedio) deja cada casco a lo sumo a un cuarto del alabeo
  const ondulado = (x, z) => 0.3 * Math.sin(x * 0.9) + 0.2 * Math.cos(z * 1.3);
  const ap = C.apoyoCaballo(ondulado, 1, 2, 0.5);
  ok(Math.max(...cascosSobre(ondulado, 1, 2, 0.5, ap).map(Math.abs)) < 0.05, 'en un suelo ondulado ningún casco queda a más de 5 cm');
  const llano = C.apoyoCaballo(() => 7, 0, 0, 1);
  ok(llano.y === 7 && llano.pitch === 0 && Math.abs(llano.roll) < 1e-12, 'en el llano, derecho y a la altura del suelo');
}

// ---------------------------------------------------------------- 2 y 4. la forma: riendas, estribo, nuca (los números de caballo-mundo.js)
async function pruebaForma() {
  const M = await import(pathToFileURL(CABM).href);
  const curvaCuello = new THREE.CatmullRomCurve3(M.CUELLO_CABALLO.puntos.map((p) => new THREE.Vector3(...p)));
  const R = M.CUELLO_CABALLO.radios;
  const radioEn = (t) => { const k = Math.min(R.length - 2, Math.floor(t * (R.length - 1))), f = t * (R.length - 1) - k; return R[k] + (R[k + 1] - R[k]) * f; };
  const muestrasCuello = Array.from({ length: 241 }, (_, i) => { const t = i / 240; return { t, p: curvaCuello.getPointAt(t), tg: curvaCuello.getTangentAt(t) }; });
  // ¿p está adentro del pescuezo (un tubo de sección elíptica: 0,74 de ancho)?
  const adentroCuello = (p) => muestrasCuello.some(({ t, p: c, tg }) => {
    const d = p.clone().sub(c), a = d.dot(tg); if (Math.abs(a) > 0.02) return false;
    const r = radioEn(t), dyz = Math.hypot(d.y - tg.y * a, d.z - tg.z * a);
    return (d.x / (0.74 * r)) ** 2 + (dyz / r) ** 2 < 1;
  });
  // la cabeza (en el grupo del cuello: la cabeza va en (0, 0.64, 0.4)): la testa, la quijada, el hocico y la garganta, como elipsoides
  const elip = [[[0, 0.71, 0.35], [0.104, 0.13, 0.13]], [[0, 0.66, 0.54], [0.1, 0.125, 0.125]], [[0, 0.6, 0.7], [0.084, 0.105, 0.105]], [[0, 0.565, 0.85], [0.072, 0.09, 0.09]],
    [[0, 0.61, 0.44], [0.1, 0.13, 0.13]], [[0, 0.555, 0.86], [0.08, 0.08, 0.095]], [[0, 0.54, 0.34], [0.085, 0.1, 0.12]]];
  const adentroCabeza = (p) => elip.some(([c, r]) => ((p.x - c[0]) / r[0]) ** 2 + ((p.y - c[1]) / r[1]) ** 2 + ((p.z - c[2]) / r[2]) ** 2 < 1);
  for (const l of [-1, 1]) {
    const cr = M.curvaRiendas(l), pts = cr.getSpacedPoints(80);
    const malas = pts.slice(3).filter((p) => adentroCuello(p) || adentroCabeza(p));   // (la punta del freno está en la argolla, junto a la boca)
    ok(malas.length === 0, `riendas (${l > 0 ? 'derecha' : 'izquierda'}): no atraviesan el pescuezo ni la cabeza (${malas.length} puntos adentro)`);
    const a = pts[0], b = pts[pts.length - 1], ab = b.clone().sub(a);
    const lejos = Math.max(...pts.map((p) => p.clone().sub(a).cross(ab).length() / ab.length()));
    const baja = Math.min(...pts.map((p) => p.y));
    ok(lejos > 0.15 && baja < Math.min(a.y, b.y) - 0.05, `riendas: cuelgan en curva (se apartan ${(lejos * 100).toFixed(0)} cm de la recta y bajan ${((Math.min(a.y, b.y) - baja) * 100).toFixed(0)} cm de la punta más baja)`);
    ok(Math.abs(Math.abs(a.x) - 0.11) < 1e-6 && a.y > 0.5 && b.z < -0.4 && b.y > 0.1, 'riendas: de la argolla del freno a la cabeza del basto');
  }
  // la nuca: el pescuezo llega hasta arriba de la cabeza (antes terminaba 10 cm abajo y la testa asomaba encima)
  const pf = M.CUELLO_CABALLO.puntos.at(-1), rf = R.at(-1);
  const arribaCuello = Math.max(...muestrasCuello.map(({ t, p }) => p.y + radioEn(t)));
  ok(arribaCuello >= 0.64 + 0.07 + 0.13 - 0.05 && pf[2] > 0.38 && rf < 0.135, `el pescuezo llega a la nuca (${arribaCuello.toFixed(2)} contra ${(0.84).toFixed(2)} de la testa)`);
  const t = leer(path.relative(raiz, CABM));
  ok(/TubeGeometry\(curvaRiendas\(l\), 20,/.test(t) && !/paloEntre\(riendas/.test(t), 'las riendas son un tubo de 20 tramos (se doblan con la piel), no un palo recto');
  ok(/TorusGeometry\(0\.055, 0\.009, 4, 10, Math\.PI\)/.test(t) && !/\[l \* 0\.38, 1\.13, 0\.05\], \[0, 0, Math\.PI \/ 2\], \[1, 1, 0\.5\]/.test(t), 'el estribo es un arco con su piso, no el disco chato');
  ok(/la garganta, de la quijada al cuello/.test(t), 'la garganta une la quijada con el cuello');
  // la malla se arma y los triángulos de la piel son los de las rígidas (verificar-4-12-2-animales lo mira entero)
  const m = M.mallaCaballo(undefined, { piel: false });
  let tris = 0; m.g.traverse((o) => { if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
  ok(tris > 1000 && tris < 30000, `el caballo se arma (${tris} triángulos)`);
}

// ---------------------------------------------------------------- 1 y 3 en el caballo de verdad (crearCaballo, sin placa de video)
async function pruebaMundo() {
  const M = await import(pathToFileURL(CABM).href);
  // una loma con hondonada (no es un plano: el centro queda 4 cm más abajo que el promedio de los cascos)
  const suelo = (x, z) => 2 + 0.24 * x - 0.1 * z + 0.09 * ((x - 5) ** 2 + (z - 5) ** 2);
  const T = { altura: suelo, normal: () => new THREE.Vector3(0, 1, 0), lugares: {} };
  const escena = new THREE.Scene(), col = crearColisiones();
  col.agregar({ x: 5, z: 5, r: 0.45 });
  const cab = M.crearCaballo(T, escena, (x, z) => suelo(x, z), (p, r, h) => col.resolver(p, r, h), (ax, az, bx, bz, y0, y1) => col.paredEntre(ax, az, bx, bz, y0, y1, false));
  ok(cab.malla.rotation.order === 'YXZ', 'tu caballo gira en orden YXZ (el cabeceo sobre su propio eje)');
  ok(typeof cab.acomodar === 'function', 'tu caballo sabe dónde cabe (acomodar)');
  // lo dejás de cola al tronco: el lugar de espera se corre y el caballo se dibuja ahí, con los cascos en la loma
  const d = cab.acomodar({ x: 5.85, z: 5, yaw: Math.PI / 2 });
  ok(Math.hypot(d.x - 5.85, d.z - 5) > 0.05, `de cola al tronco, se corre (${d.x.toFixed(2)}, ${d.z.toFixed(2)})`);
  ok(cab.acomodar({ x: 5.85, z: 5, yaw: Math.PI / 2 }) === d, 'lo calculado se recuerda (no se busca cada cuadro)');
  for (const yaw of [d.yaw, 0.3, 2.2]) {
    const donde = yaw === d.yaw ? d : { x: 3.5, z: 7, yaw };
    for (let i = 0; i < 90; i++) cab.actualizar(1 / 60, donde, 0, false, true);   // (al cambiar de lugar, la inclinación llega en menos de medio segundo)
    cab.malla.updateMatrixWorld(true);
    const errs = [];
    cab.malla.traverse((o) => { if (o.isGroup && Math.abs(Math.abs(o.position.x) - 0.2) < 1e-3 && Math.abs(o.position.y - 1.05) < 1e-3) { const v = new THREE.Vector3(0, -1.055, 0.04); o.localToWorld(v); errs.push(v.y - suelo(v.x, v.z)); } });
    ok(errs.length === 4 && Math.max(...errs.map(Math.abs)) < 0.03, `parado en la loma mirando a ${yaw.toFixed(2)}: los cuatro cascos en el suelo (${errs.map((e) => (e * 100).toFixed(1)).join(', ')} cm)`);
  }
  const cuerpo = [];
  for (const [dd, r] of C.CUERPO_CABALLO) { const x = d.x + Math.sin(d.yaw) * dd, z = d.z + Math.cos(d.yaw) * dd; cuerpo.push(Math.hypot(x - 5, z - 5) - 0.45 - r); }
  ok(Math.min(...cuerpo) > -0.01, 'y ningún disco del cuerpo queda adentro del tronco');
}

// ---------------------------------------------------------------- los textos de main.js y de la aldea
function pruebaTextos() {
  const main = leer('src/main.js'), ald = leer('src/aldea-animales-mundo.js');
  ok(/const d = dondeEspera\(caballo\(\), T\.lugares\.refugio\);\n  return caballoMundo\?\.acomodar \? caballoMundo\.acomodar\(d\) : d;/.test(main), 'main: tu caballo espera en el lugar libre más cercano a donde lo dejaste');
  ok(/crearCaballo\(T, escena, \(x, z, y\) => alturaDePie\(T, col, x, z, y\), \(p, r, h\) => col\.resolver\(p, r, h\), \(ax, az, bx, bz, y0, y1\) => !!col\.paredEntre\?\.\(ax, az, bx, bz, y0, y1, false\)\)/.test(main), 'main: el caballo recibe las paredes finas');
  ok(/if \(c\.revisar <= 0\) \{ c\.revisar = 3; pararCaballo\(c\); \}/.test(ald) && /lugarLibreCaballo\(\{ x: c\.x0, z: c\.z0, yaw: c\.yaw0 \}/.test(ald) && /apoyoCaballo\(alturaEn, l\.x, l\.z, l\.yaw\)/.test(ald), 'aldea: los caballos atados se paran donde caben y apoyados');
  ok(/const otros = caballos\.filter\(\(o\) => o !== c && o\.puesto\);/.test(ald), 'aldea: los dos atados no se pisan');
  ok(/m\.g\.rotation\.order = 'YXZ';   \/\/ 4\.30\.1/.test(ald), 'aldea: giran en orden YXZ');
}

// ---------------------------------------------------------------- los caballos atados de la plaza, de verdad (crearAnimalesAldea)
async function pruebaAldea() {
  const { crearAnimalesAldea } = await import('../src/aldea-animales-mundo.js');
  const { ANIMALES_ALDEA } = await import('../src/aldea-vida.js');
  const { marcoAldea, PARADA_ALDEA } = await import('../src/aldea.js');
  const { lugarEnMundo } = await import('../src/rincones.js');
  const M = marcoAldea(PARADA_ALDEA), L = lugarEnMundo('retablo');
  const suelo = (x, z) => 1 + 0.05 * x;
  const T = { altura: suelo, normal: () => new THREE.Vector3(0, 1, 0), lugares: {} };
  const col = crearColisiones();
  // el retablo (como en rincones-mundo.js: 1,2 m de frente, 25 cm de fondo, 2,5 m de alto) y un álamo pegado, como en la captura
  const c0 = Math.cos(L.rotMundo), s0 = Math.sin(L.rotMundo);
  col.agregar({ seg: true, ax: L.x - 0.6 * c0, az: L.z + 0.6 * s0, bx: L.x + 0.6 * c0, bz: L.z - 0.6 * s0, r: 0.25, alturaMin: suelo(L.x, L.z) - 0.2, alturaMax: suelo(L.x, L.z) + 2.5 });
  const moro = ANIMALES_ALDEA.caballos.find((c) => c.id === 'moro'), wm = M.aMundo(moro.x, moro.z);
  col.agregar({ x: wm.x - 0.9, z: wm.z, r: 0.32 });
  const escena = new THREE.Scene();
  const A = crearAnimalesAldea({ T, escena, progreso: () => ({ aldea: {}, dia: 3 }), jugador: () => ({ pos: { x: L.x + 5, z: L.z + 5 } }), refugio: () => null, distanciaAldea: () => 0, col: () => col, alturaDePie: (x, z) => suelo(x, z) });
  A.actualizar(0.1, 12);
  const est = A.estado().caballos;
  ok(est.length === 2 && est.every((c) => c.visible), 'los dos caballos atados de la plaza se ven de día');
  const op = { empujar: (p, r, h) => col.resolver(p, r, h), alturaEn: (x, z) => suelo(x, z) };
  for (const c of est) {
    const g = c.malla;
    ok(g.rotation.order === 'YXZ' && C.caballoLibre(c.x, c.z, g.rotation.y, op), `${c.id}: no queda adentro del retablo ni del álamo (${c.x.toFixed(2)}, ${c.z.toFixed(2)})`);
  }
  ok(!C.caballoLibre(wm.x, wm.z, M.rotMundo(moro.rot), op), '(en el lugar del plano el Moro no cabía: es el de la captura)');
  const [a, b] = est;
  let minimo = Infinity;
  for (const [da] of C.CUERPO_CABALLO) for (const [db] of C.CUERPO_CABALLO) minimo = Math.min(minimo, Math.hypot(a.x + Math.sin(a.malla.rotation.y) * da - b.x - Math.sin(b.malla.rotation.y) * db, a.z + Math.cos(a.malla.rotation.y) * da - b.z - Math.cos(b.malla.rotation.y) * db));
  ok(minimo > 0.75, `los dos atados no se pisan (${minimo.toFixed(2)} m entre los discos más cercanos)`);
  a.malla.updateMatrixWorld(true);
  const errs = [];
  a.malla.traverse((o) => { if (o.isGroup && Math.abs(Math.abs(o.position.x) - 0.2) < 1e-3 && Math.abs(o.position.y - 1.05) < 1e-3) { const v = new THREE.Vector3(0, -1.055, 0.04); o.localToWorld(v); errs.push(v.y - suelo(v.x, v.z)); } });
  ok(errs.length === 4 && Math.max(...errs.map(Math.abs)) < 0.02, `el Moro apoya los cuatro cascos (${errs.map((e) => (e * 100).toFixed(1)).join(', ')} cm)`);
}

// ---------------------------------------------------------------- 5. montado, el caballo entero choca (jugador.js de verdad, con un DOM mínimo)
async function pruebaMontado() {
  globalThis.document ??= { addEventListener() {}, pointerLockElement: null };
  globalThis.window ??= { addEventListener() {}, self: 1, top: 1 };
  globalThis.HTMLElement ??= function HTMLElement() {};
  HTMLElement.prototype.requestPointerLock ??= () => {};
  const { crearJugador, MONTADO_CHOCA } = await import(pathToFileURL(JUG).href);
  const T = { altura: () => 0, normal: () => ({ x: 0, y: 1, z: 0 }), agua: () => null, indice: () => 0, distSendero: [9], bosque: [0], pasto: [0] };
  const cabeza = MONTADO_CHOCA.find(([d]) => d > 0), grupa = MONTADO_CHOCA.find(([d]) => d < 0);
  const nuevo = (arboles) => {
    const col = crearColisiones();
    for (const [x, z] of arboles) col.agregar({ x, z, r: 0.4 });
    const J = crearJugador(new THREE.PerspectiveCamera(), T, col, { activo: () => true, lienzo: { addEventListener() {} }, sensibilidad: () => 1, invierno: () => 0, otono: () => 0, fov: () => 70 });
    J.ubicar(0, 0, 0); J.estado.montado = { trote: 6.2, galope: 11, alto: 0.95, aguaMax: 0.9 };
    return J;
  };
  // (dónde queda un disco del caballo: mira para donde mirás, -z con yaw 0)
  const disco = (e, d) => ({ x: e.pos.x - Math.sin(e.yaw) * d, z: e.pos.z - Math.cos(e.yaw) * d });
  // de frente: al trote contra un tronco, la cabeza no entra
  let J = nuevo([[0, -4]]);
  J.teclas.add('KeyW');
  let peor = Infinity;
  for (let i = 0; i < 80; i++) { J.actualizar(0.05); const c = disco(J.estado, cabeza[0]); peor = Math.min(peor, Math.hypot(c.x, c.z + 4) - 0.4 - cabeza[1]); }
  ok(peor > -0.03 && J.estado.pos.z > -4 + 0.4 + cabeza[0] + cabeza[1] - 0.05, `montado de frente contra un tronco, la cabeza no entra (${(peor * 100).toFixed(1)} cm, centro en ${J.estado.pos.z.toFixed(2)})`);
  // de costado: girás en el lugar con el tronco al lado: la cabeza lo barre y el caballo se corre
  J = nuevo([[1.25, 0]]);
  peor = Infinity;
  for (let i = 0; i <= 40; i++) { J.estado.yaw = -(Math.PI / 2) * (i / 40); J.actualizar(0.05); const c = disco(J.estado, cabeza[0]); peor = Math.min(peor, Math.hypot(c.x - 1.25, c.z) - 0.4 - cabeza[1]); }
  ok(peor > -0.03, `girando con el tronco al costado, la cabeza no lo atraviesa (${(peor * 100).toFixed(1)} cm)`);
  // de cola: la grupa adentro de un tronco (arrancás pegado): un paso y sale
  J = nuevo([[0, 0.9]]);
  J.actualizar(0.05);
  const g = disco(J.estado, grupa[0]);
  ok(Math.hypot(g.x, g.z - 0.9) >= 0.4 + grupa[1] - 0.02, `la grupa sale del tronco (${(Math.hypot(g.x, g.z - 0.9) - 0.4 - grupa[1]).toFixed(3)} m)`);
  // a pie, nada de esto: tu disco de siempre
  J = nuevo([[0, -1.6]]); J.estado.montado = null; J.teclas.add('KeyW');
  for (let i = 0; i < 60; i++) J.actualizar(0.05);
  ok(J.estado.pos.z < -1.6 + 0.4 + 0.35 + 0.05, `a pie llegás hasta el tronco como siempre (${J.estado.pos.z.toFixed(2)})`);
}

if (!SOLO || SOLO === 'montado') await pruebaMontado();
if (!SOLO || SOLO === 'lugar') pruebaLugar();
if (!SOLO || SOLO === 'apoyo') pruebaApoyo();
if (!SOLO || SOLO === 'forma') await pruebaForma();
if (!SOLO || SOLO === 'mundo') await pruebaMundo();
if (!SOLO || SOLO === 'textos') pruebaTextos();
if (!SOLO || SOLO === 'aldea') await pruebaAldea();
if (process.env.HX_CAB || process.env.HX_CABM || process.env.HX_JUG) { console.log('mutación sin atrapar'); process.exit(0); }

// ---------------------------------------------------------------- mutaciones (una copia con otro nombre y un proceso por mutación)
const MUT = [
  ['src/caballo.js', 'lugar', 'el disco que choca no cuenta', 'if (!(Math.hypot(q.x - cx, q.z - cz) < 0.01)) return false;', ''],
  ['src/caballo.js', 'lugar', 'sin mirar paredes finas entre discos', 'if (paredEntre && ax !== null && paredEntre(ax, az, cx, cz, y0 + 0.3, y0 + ALTO_CUERPO_CABALLO)) return false;', ''],
  ['src/caballo.js', 'lugar', 'lo pasa al otro lado de una pared', 'if (op.paredEntre && op.paredEntre(d.x, d.z, x, z, y0 + 0.3, y0 + ALTO_CUERPO_CABALLO)) continue;', ''],
  ['src/caballo.js', 'lugar', 'gira antes de probar derecho', 'const tandas = [[[0], GIRAR_DESDE], [', 'const tandas = [[[Math.PI / 2, 0], GIRAR_DESDE], ['],
  ['src/caballo.js', 'lugar', 'se para al borde de un escalón', 'if (max - min > DESNIVEL_CASCOS) return false;', ''],
  ['src/caballo.js', 'lugar', 'el cuerpo sin la grupa', '[[-0.72, 0.42], [0, 0.45]', '[[0, 0.45]'],
  ['src/caballo.js', 'apoyo', 'el cabeceo al revés', 'pitch: lim(Math.atan2((ti + td) / 2 - (ai + ad) / 2, 2 * A), 0.55)', 'pitch: lim(Math.atan2((ai + ad) / 2 - (ti + td) / 2, 2 * A), 0.55)'],
  ['src/caballo.js', 'apoyo', 'el ladeo con tope viejo', 'roll: lim(Math.atan2((ad + td) / 2 - (ai + ti) / 2, 2 * L), 0.45)', 'roll: lim(Math.atan2((ad + td) / 2 - (ai + ti) / 2, 2 * L), 0.1)'],
  ['src/caballo.js', 'apoyo', 'la altura del centro, no el promedio', 'y: (ai + ad + ti + td) / 4,', 'y: alturaEn(x, z, yRef),'],
  ['src/jugador.js', 'montado', 'montado choca sólo el centro', 'for (let pasada = 0; pasada < 2; pasada++) {', 'for (let pasada = 0; pasada < 0; pasada++) {'],
  ['src/jugador.js', 'montado', 'la cabeza mira para atrás', 'const fx = -Math.sin(estado.yaw), fz = -Math.cos(estado.yaw);', 'const fx = Math.sin(estado.yaw), fz = Math.cos(estado.yaw);'],
  ['src/caballo-mundo.js', 'mundo', 'sin el orden YXZ', "m.g.rotation.order = 'YXZ';   // 4.30.1", "m.g.rotation.order = 'XYZ';   // 4.30.1"],
  ['src/caballo-mundo.js', 'mundo', 'sin la altura de los cuatro cascos', 'if (Number.isFinite(suelo.y)) y = suelo.y;', ''],
  ['src/caballo-mundo.js', 'mundo', 'sin buscar lugar', 'else { const l = lugarLibreCaballo(d, opLibre);', 'else { const l = { x: d.x, z: d.z, yaw: d.yaw };'],
  ['src/caballo-mundo.js', 'forma', 'las riendas por adentro del cuello', '[0.19, 0.24, 0.36], [0.225, 0.04, 0.08]', '[0.05, 0.24, 0.36], [0.05, 0.04, 0.08]'],
  ['src/caballo-mundo.js', 'forma', 'las riendas rectas', '[0.14, 0.46, 0.6], [0.19, 0.24, 0.36], [0.225, 0.04, 0.08], [0.215, 0.03, -0.2], ', ''],
  ['src/caballo-mundo.js', 'forma', 'el pescuezo corto de antes', '[0, 0.6, 0.36], [0, 0.7, 0.42]],', '[0, 0.6, 0.36]],'],
];
let atrapadas = 0;
for (const [archivo, solo, nombre, de, a] of MUT) {
  const texto = leer(archivo);
  assert.equal(texto.split(de).length, 2, `la mutación «${nombre}» encuentra su fragmento una sola vez en ${archivo}`);
  const copia = path.join(raiz, path.dirname(archivo), `__mut-4301a-${atrapadas}-${path.basename(archivo)}`);
  fs.writeFileSync(copia, texto.replace(de, a));
  try {
    const envm = { ...process.env, HX_SOLO: solo, [archivo.endsWith('jugador.js') ? 'HX_JUG' : archivo.endsWith('caballo.js') ? 'HX_CAB' : 'HX_CABM']: copia };
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: envm, encoding: 'utf8' });
    assert.ok(r.status !== 0 && /AssertionError/.test(r.stderr || ''), `la mutación «${nombre}» no se atrapó (o se rompió por otra cosa): ${(r.stdout || '').slice(-200)} ${(r.stderr || '').slice(0, 300)}`);
    atrapadas++;
  } finally { fs.rmSync(copia, { force: true }); }
}
console.log(`verificar-4-30-1-a: ${n} comprobaciones OK · ${atrapadas} de ${MUT.length} mutaciones atrapadas`);

// 4.25.3: los bugs que la 4.25.2 dejó sin arreglar.
//   F2-7  las gallinas chocan con la casilla y las obras de alrededor y pisan el entablado, sin costo por cuadro apreciable
//   B3    lo pagado por cada etapa queda en la obra y los reintegros salen de ahí; lo de antes de la 4.23.0, con la tabla vieja
//   G1-5  en `trigo-abuelo` y `fermin-mulas` la respuesta cariñosa vale +2 y la otra +1 (antes las dos +1)
//   E2-7  el coihue grande sólo se tala cuando la historia lo puso en juego, y talado con D2 = b queda tocón
//   E2-9  las paces con Fermín: sólo se ofrece lo que llevás (y el pan casero también dispara la escena)
//   E3-10 cerrar el juego en la escena de después de ganar la noche: al volver, amanece
// Cada grupo tiene sus mutaciones: la misma sección sobre una copia con el arreglo deshecho tiene que fallar. Las copias de módulos van en
// src/ con nombre «-mutN.js» y se borran apenas se cargan.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { registrarThree } from './ayuda-three.mjs';
import { funcion, enUnaLinea } from './ayuda-codigo.mjs';

registrarThree();
const THREE = await import('three');
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(raiz, 'src');
const leer = (f) => readFileSync(join(SRC, f), 'utf8');
const real = (f) => import(pathToFileURL(join(SRC, f)).href);

// ---------------------------------------------------------------- la cuenta y las mutaciones
let n = 0, enMutacion = false, fallasMut = 0;
const ok = (c, m) => { if (enMutacion) { if (!c) fallasMut++; return; } assert.ok(c, m); n++; };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} (dio ${JSON.stringify(a)}, se esperaba ${JSON.stringify(b)})`);

let k = 0;
// Los módulos de `grupo`; si `mut` toca uno, se copian todos como «X-mutK.js» (con sus imports entre sí cambiados) y se cargan de ahí
async function cargarGrupo(grupo, mut) {
  const mods = {};
  if (!mut || !grupo.includes(mut.archivo)) {
    for (const f of grupo) mods[f] = await real(f);
    return mods;
  }
  const id = ++k;
  const nombre = (f) => f.replace(/\.js$/, `-mut${id}.js`);
  for (const f of grupo) {
    let t = leer(f);
    if (f === mut.archivo) {
      if (!t.includes(mut.de)) throw new Error(`mutación sin texto en ${f}: ${mut.de.slice(0, 80)}`);
      t = t.split(mut.de).join(mut.a);
    }
    for (const g of grupo) t = t.split(`'./${g}'`).join(`'./${nombre(g)}'`);
    writeFileSync(join(SRC, nombre(f)), t);
  }
  try { for (const f of grupo) mods[f] = await import(pathToFileURL(join(SRC, nombre(f))).href); }
  finally { for (const f of grupo) { try { rmSync(join(SRC, nombre(f)), { force: true }); } catch { /* ya no está */ } } }
  return mods;
}
const uno = async (f, mut) => (await cargarGrupo([f], mut))[f];
const texto = (f, mut) => {
  const t = leer(f);
  if (!mut || mut.archivo !== f) return t;
  if (!t.includes(mut.de)) throw new Error(`mutación sin texto en ${f}: ${mut.de.slice(0, 80)}`);
  return t.split(mut.de).join(mut.a);
};
// Un azar con semilla mientras corre `fn` (las gallinas usan Math.random)
function conAzar(semilla, fn) {
  const orig = Math.random;
  let s = semilla >>> 0;
  Math.random = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  try { return fn(); } finally { Math.random = orig; }
}

// ================================================================ F2-7: las gallinas
const { crearColisiones } = await real('colisiones.js');
const { alturaDePie } = await real('gente.js');
async function gallinas(mut) {
  const { crearGallinas } = await uno('gallinero-mundo.js', mut);
  const T = { altura: () => 0 };
  const M = new THREE.Matrix4();
  const yDe = (g, i) => { g.malla.getMatrixAt(i, M); return M.elements[13]; };
  const distSeg = (px, pz, ax, az, bx, bz) => {
    const abx = bx - ax, abz = bz - az;
    const t = Math.max(0, Math.min(1, ((px - ax) * abx + (pz - az) * abz) / (abx * abx + abz * abz || 1)));
    return Math.hypot(px - (ax + abx * t), pz - (az + abz * t));
  };
  const mundo = (armar) => {
    const col = crearColisiones();
    armar?.(col);
    let llamadas = 0;
    return { col, llamadas: () => llamadas, fisica: { resolver: (p, r, h) => { llamadas++; col.resolver(p, r, h); }, alturaDePie: (x, z, y) => alturaDePie(T, col, x, z, y) } };
  };
  // la casilla (la física del plano: construccion.js), una pared pegada y un entablado a medio metro
  const patio = (col) => {
    col.agregar({ seg: true, ax: -0.18, az: 0, bx: 0.18, bz: 0, r: 0.52, alturaMin: -0.05, alturaMax: 1.42 });
    col.agregar({ seg: true, ax: 1.5, az: -3, bx: 1.5, bz: 3, r: 0.15, alturaMin: 0, alturaMax: 2 });
    col.agregarPlataforma({ x: -2.2, z: 0, ang: 0, largo: 2.4, ancho: 2.4, alto: 0.5, espesor: 0.18 });
  };
  const enTabla = (col, x, z) => !!col.plataformaEn(x, z, 0.6);
  const R = 0.16;   // el radio de la gallina

  // ---- 90 s picoteando, con vos lejos
  conAzar(7, () => {
    const w = mundo(patio);
    const g = crearGallinas(T, new THREE.Scene(), w.fisica);
    g.sincronizar([{ x: 0, z: 0, y: 0 }]);
    let casilla = 9, pared = 9, max = 0, arriba = 0, malArriba = 0, malAbajo = 0;
    for (let f = 0; f < 60 * 90; f++) {
      g.actualizar(1 / 60, 12, { x: 30, z: 30 });
      g.aves.forEach((a, i) => {
        casilla = Math.min(casilla, distSeg(a.x, a.z, -0.18, 0, 0.18, 0));
        pared = Math.min(pared, distSeg(a.x, a.z, 1.5, -3, 1.5, 3));
        max = Math.max(max, Math.hypot(a.x, a.z));
        const esquinas = [[0.1, 0.1], [0.1, -0.1], [-0.1, 0.1], [-0.1, -0.1]].map(([dx, dz]) => enTabla(w.col, a.x + dx, a.z + dz));
        const y = yDe(g, i);
        if (esquinas.every(Boolean)) { arriba++; if (Math.abs(y - 0.5) > 1e-6) malArriba++; }
        else if (!esquinas.some(Boolean) && Math.abs(y) > 1e-6) malAbajo++;
      });
    }
    // (caminando hace 0,35 m/s y se revisa una de cada cuatro vueltas: como mucho entra 2,3 cm antes de que la saquen)
    ok(casilla >= 0.52 + R - 0.03, `F2-7: ninguna gallina se mete en la casilla (lo más cerca del eje: ${casilla.toFixed(3)} m)`);
    ok(pared >= 0.15 + R - 0.03, `F2-7: ni atraviesa la pared de al lado (lo más cerca: ${pared.toFixed(3)} m)`);
    ok(max <= 4.2 + 1e-6, `F2-7: y siguen en el corral (${max.toFixed(2)} m)`);
    ok(arriba > 100 && malArriba === 0, `F2-7: sobre el entablado van a la altura del entablado (${arriba} veces arriba, ${malArriba} mal)`);
    ok(malAbajo === 0, 'F2-7: y fuera del entablado, en la tierra');
  });
  // ---- 60 s corriendo a una gallina: se la revisa en todos los cuadros
  conAzar(11, () => {
    const w = mundo(patio);
    const g = crearGallinas(T, new THREE.Scene(), w.fisica);
    g.sincronizar([{ x: 0, z: 0, y: 0 }]);
    const a = g.aves[0];
    let casilla = 9, pared = 9, max = 0;
    for (let f = 0; f < 1200; f++) {
      const l = Math.hypot(a.x, a.z) || 1;
      g.actualizar(0.05, 12, { x: a.x - (a.x / l) * 1.0, z: a.z - (a.z / l) * 1.0 });
      casilla = Math.min(casilla, distSeg(a.x, a.z, -0.18, 0, 0.18, 0));
      pared = Math.min(pared, distSeg(a.x, a.z, 1.5, -3, 1.5, 3));
      max = Math.max(max, Math.hypot(a.x, a.z));
    }
    ok(casilla >= 0.52 + R - 1e-3 && pared >= 0.15 + R - 1e-3, `F2-7: la gallina que corrés tampoco atraviesa nada (${casilla.toFixed(3)} y ${pared.toFixed(3)} m)`);
    ok(max <= 4.2 + 1e-6, 'F2-7: ni se va del corral (lo de la 4.0.3 sigue)');
  });
  // ---- el costo: ocho gallineros, 32 gallinas, nadie cerca
  conAzar(3, () => {
    const w = mundo();
    const g = crearGallinas(T, new THREE.Scene(), w.fisica);
    g.sincronizar(Array.from({ length: 8 }, (_, i) => ({ x: i * 12, z: 100, y: 0 })));
    const dibujadas = g.actualizar(1 / 60, 12, { x: 42, z: 130 });
    const antes = w.llamadas();
    for (let f = 0; f < 600; f++) g.actualizar(1 / 60, 12, { x: 42, z: 130 });
    const porCuadro = (w.llamadas() - antes) / 600;
    ok(dibujadas === 32 && antes === 32, 'F2-7: la primera vuelta las acomoda a todas');
    ok(porCuadro > 0.5 && porCuadro <= 32 / 4, `F2-7: después, como mucho una de cada cuatro por cuadro (${porCuadro.toFixed(2)} choques por cuadro con 32 gallinas)`);
  });
  // ---- el empujón que la saca del corral: vuelve a su último lugar libre, y si le construyeron encima, a donde nació
  conAzar(5, () => {
    const w = mundo((col) => col.agregar({ x: 4.0, z: 0, r: 0.5 }));
    const g = crearGallinas(T, new THREE.Scene(), w.fisica);
    g.sincronizar([{ x: 0, z: 0, y: 0 }]);
    g.actualizar(1 / 60, 12, { x: 30, z: 30 });
    const a = g.aves[0];
    const poner = (bx, bz) => { a.x = 4.15; a.z = 0.55; a.bx = bx; a.bz = bz; a.picotea = 5; a.t = 5; a.revisada = false; };
    poner(3.0, 0.2);
    g.actualizar(1 / 60, 12, { x: 30, z: 30 });
    ok(Math.hypot(a.x, a.z) <= 4.2 + 1e-6 && Math.hypot(a.x - 4.0, a.z) >= 0.5 + R - 1e-3, `F2-7: el choque no la deja fuera del corral ni adentro del obstáculo (quedó en ${a.x.toFixed(2)}, ${a.z.toFixed(2)})`);
    let vueltas = 0;
    const enCasa = () => Math.hypot(a.x - a.ox, a.z - a.oz) < 1e-6;
    while (vueltas < 12 && !enCasa()) { vueltas++; poner(4.15, 0.55); g.actualizar(1 / 60, 12, { x: 30, z: 30 }); }
    ok(enCasa() && vueltas >= 3 && vueltas <= 8, `F2-7: la que quedó encerrada vuelve a donde nació (a las ${vueltas} revisiones)`);
  });
  // ---- sin física (las pruebas viejas, otros usos): como siempre, a la altura del terreno
  conAzar(9, () => {
    const g = crearGallinas({ altura: (x) => x * 0.1 }, new THREE.Scene());
    g.sincronizar([{ x: 0, z: 0 }]);
    for (let f = 0; f < 200; f++) g.actualizar(1 / 60, 12, { x: 30, z: 30 });
    ok(g.aves.every((a, i) => Math.abs(yDe(g, i) - a.x * 0.1) < 1e-5), 'F2-7: sin física, la gallina va sobre el terreno como antes');
  });
  const main = texto('main.js', mut);
  ok(enUnaLinea(main, ['gallinasMundo = crearGallinas(T, escena, {', 'col.resolver(p, r, h)', 'alturaDePie(T, col, x, z, y)']), 'F2-7: el juego les pasa el choque y el piso de la gente');
  ok(enUnaLinea(main, ['gallinasMundo.sincronizar(', 'y: o.datos.y']), 'F2-7: y la altura de la base del gallinero');
}

// ================================================================ B3: lo pagado en cada obra
const ECO = await real('economia.js');
const { PIEZAS_OFICIOS } = await real('planos-oficios.js');
const { PIEZAS_LUJO } = await real('planos-lujo.js');
async function pesos(mut) {
  const OP = await uno('obra-pesos.js', mut);
  const planos = [...PIEZAS_OFICIOS, ...PIEZAS_LUJO];
  const partida = (plata) => { const p = { modo: 'relax', dia: 5, economia: ECO.economiaNueva() }; ECO.cobrar(p, plata, 'prueba', ''); return p; };
  const V = OP.PRECIOS_ANTES_4_23;

  // ---- la tabla vieja contra los planos de hoy (y contra lo que dice el propio plano: «4.23.0: era 32.000»)
  eq(Object.keys(V).sort(), ['arana-velas', 'canteria', 'cerveceria', 'herreria-propia', 'queseria', 'reloj-pie', 'telar-grande', 'tienda-campo'], 'B3: los ocho planos que bajó la 4.23.0');
  const fuentes = leer('planos-oficios.js') + leer('planos-lujo.js');
  for (const [id, v] of Object.entries(V)) {
    const pl = planos.find((x) => x.id === id);
    ok(!!pl && v.precios.length === 1 && v.precios[0] > pl.pesos, `B3: ${id} existe, es de una etapa y antes costaba más (${v.precios[0]} > ${pl?.pesos})`);
    ok(v.nombre === String(pl?.nombre).toLowerCase(), `B3: ${id} lleva el nombre del libro («${v.nombre}»)`);
    const desde = fuentes.indexOf(`id: '${id}'`);
    const m = /pesos: (\d+),\s*\/\/ 4\.23\.0: era ([\d.]+)/.exec(fuentes.slice(desde, desde + 1500));
    ok(!!m && Number(m[1]) === pl.pesos && Number(m[2].replace(/\./g, '')) === v.precios[0], `B3: ${id}: el precio viejo es el que anota el plano`);
    OP.registrarPrecios(id, [pl.pesos], { nombre: String(pl.nombre).toLowerCase() });
  }

  // ---- desde ahora: se anota lo pagado y se devuelve eso, aunque el precio cambie después
  OP.registrarPrecios('prueba-b3', [1000, 2000], { nombre: 'prueba' });
  const p = partida(10000), datos = { pagadas: 0 };
  const cobrarEtapa = funcion(texto('main.js', mut), 'cobrarEtapa', { pagarEtapa: OP.pagarEtapa, anotarPago: OP.anotarPago, progreso: p });
  cobrarEtapa({ id: 'prueba-b3' }, datos, 0, OP.puedePagarEtapa(p, 'prueba-b3', 0));
  eq([datos.pagadas, datos.pagado, ECO.pesosDe(p)], [1, [1000], 9000], 'B3: al pagar una etapa queda anotado cuánto');
  OP.registrarPrecios('prueba-b3', [600, 1200], { nombre: 'prueba' });   // el precio baja
  cobrarEtapa({ id: 'prueba-b3' }, datos, 1, OP.puedePagarEtapa(p, 'prueba-b3', 1));
  eq([datos.pagadas, datos.pagado, ECO.pesosDe(p)], [2, [1000, 1200], 7800], 'B3: la segunda etapa, al precio nuevo');
  eq(OP.montoReintegroAlDesmontar('prueba-b3', 2, 2, datos.pagado), 1100, 'B3: desmontar devuelve la mitad de lo pagado (no de lo que cuesta hoy)');
  OP.registrarPrecios('prueba-b3', [5000, 5000], { nombre: 'prueba' });   // el precio sube: no es un negocio
  eq(OP.montoReintegroAlDesmontar('prueba-b3', 2, 2, datos.pagado), 1100, 'B3: si el precio sube, igual: nunca más de lo pagado');
  eq(OP.devolverEtapasPagadas(p, 'prueba-b3', 2, undefined, datos.pagado), 2200, 'B3: retirar la marca devuelve justo lo pagado');
  eq(ECO.pesosDe(p), 10000, 'B3: y la billetera queda como antes de empezar');
  eq(OP.devolverEtapasPagadas(partida(0), 'prueba-b3', 1, undefined, [null, 700]), 5000, 'B3: una etapa sin anotar (de antes) vale el precio de hoy, como siempre');
  { const d = {}; OP.anotarPago(d, 1, 700); eq(d.pagado, [null, 700], 'B3: anotar la segunda sin la primera deja el hueco');
    OP.anotarPago(d, 0, 0); eq([d.pagado, OP.montoReintegroAlDesmontar('prueba-b3', 2, 2, d.pagado)], [[0, 700], 350], 'B3: un pago que no salió se anota en cero y no devuelve nada');
    ok(OP.anotarPago(d, 9, 5) === false && OP.anotarPago(null, 0, 5) === false, 'B3: fuera de rango no anota');
    OP.anotarPago(d, 0, 300, 'pagadoAmp'); eq(d.pagadoAmp, [300], 'B3: las ampliaciones del depósito, en su propio campo'); }
  eq([OP.sanearPagado('x'), OP.sanearPagado([]), OP.sanearPagado([null]), OP.sanearPagado([1000, 'x', -5, 1e12, 7.9])], [null, null, null, [1000, null, null, OP.PESOS_MAX_POR_ETAPA, 7]], 'B3: lo guardado se sanea');
  ok(OP.sanearPagado(Array.from({ length: 30 }, () => 5)).length === 8, 'B3: con tope de etapas');

  // ---- lo de antes: la tabla vieja sólo cuando se sabe
  const obras = () => [{ plano: 'herreria-propia', etapas: 1, pagadas: 1 }, { plano: 'herreria-propia', etapas: 1, pagadas: 0 }, { plano: 'galponcito', etapas: 1, pagadas: 1 },
    { plano: 'cerveceria', etapas: 1, pagadas: 1, pagado: [29500] }, { plano: 'herreria-propia', etapas: 1, pagadas: 1 }];
  { const o = obras();
    eq([OP.migrarPagadoDeObras(o, '4.22.0'), o.map((d) => d.pagado ?? null)], [2, [[32000], null, null, [29500], [32000]]], 'B3: partida de la 4.22.0: las herrerías pagadas llevan lo de entonces; lo no pagado, lo de otros planos y lo ya anotado no se tocan');
    eq(OP.migrarPagadoDeObras(o, '4.22.0'), 0, 'B3: y no se anota dos veces');
    eq([OP.montoReintegroAlDesmontar('herreria-propia', 1, 1, o[0].pagado), OP.montoReintegroAlDesmontar('herreria-propia', 1, 1)], [16000, 9000], 'B3: desmontar la herrería de la 4.22 devuelve $16.000 (antes $9.000)');
    eq(OP.devolverEtapasPagadas(partida(0), 'herreria-propia', 1, undefined, o[0].pagado), 32000, 'B3: y retirar su marca, los $32.000'); }
  for (const v of ['4.9.9', '3.8.8', '4.22.9', '', undefined, 'basura']) { const o = obras(); ok(OP.migrarPagadoDeObras(o, v) === 2, `B3: versión «${v}»: de antes de la baja`); }
  for (const v of ['4.23.0', '4.25.2', '4.25.3', '5.0.0', '10.1.0']) { const o = obras(); ok(OP.migrarPagadoDeObras(o, v) === 0 && o[0].pagado === undefined, `B3: versión ${v}: no se sabe, no se anota (devuelve el precio de hoy)`); }
  const pago = { dia: 3, monto: -32000, motivo: 'Mano de obra: herrería propia', con: '' };
  { const o = obras(); eq([OP.migrarPagadoDeObras(o, '4.25.2', [pago]), o[0].pagado, o[4].pagado ?? null], [1, [32000], null], 'B3: en una partida ya guardada con la 4.25.2, un pago viejo en el libro alcanza para UNA obra'); }
  { const o = obras(); eq(OP.migrarPagadoDeObras(o, '4.25.2', [pago, { dia: 9, monto: 9000, motivo: 'Reintegro por desmontar: herrería propia', con: '' }]), 0, 'B3: si esa obra ya se desmontó (el reintegro está en el libro), ninguna'); }
  { const o = obras(); eq(OP.migrarPagadoDeObras(o, '4.25.2', [pago, { dia: 9, monto: 18000, motivo: 'Devolución de la mano de obra: herrería propia', con: '' }]), 0, 'B3: lo mismo con una marca retirada'); }
  { const o = obras(); eq(OP.migrarPagadoDeObras(o, '4.25.2', [{ ...pago, monto: -18000 }, { ...pago, motivo: 'Mano de obra: cantería' }, null, { motivo: 5 }]), 0, 'B3: un pago al precio nuevo, o de otro plano, no cuenta'); }
  for (const [id, v] of Object.entries(V)) {
    const o = [{ plano: id, etapas: 1, pagadas: 1 }];
    OP.migrarPagadoDeObras(o, '4.20.0');
    const dev = OP.montoReintegroAlDesmontar(id, 1, 1, o[0].pagado);
    ok(dev === Math.floor((v.precios[0] * 0.5) / 10) * 10 && dev <= v.precios[0] && dev > OP.montoReintegroAlDesmontar(id, 1, 1), `B3: ${id}: la mitad de lo que costó entonces, nunca más de lo pagado`);
  }

  // ---- el guardado: se conserva, se sanea, y la migración corre sólo al cargar
  const datosLS = new Map();
  globalThis.localStorage = { getItem: (c) => (datosLS.has(c) ? datosLS.get(c) : null), setItem: (c, v) => datosLS.set(c, String(v)), removeItem: (c) => datosLS.delete(c) };
  const G = await uno('guardado.js', mut);
  G.usarModoGuardado('relax', 1); G.fijarVersionDelJuego('4.25.3');
  const nueva = (version, extra = {}) => { const q = G.progresoNuevo(); q.dia = 40; q.versionJuego = version; q.obras = [{ plano: 'herreria-propia', x: 10, z: 10, y: 0, rot: 0, etapas: 1, pagadas: 1, ...extra }]; return q; };
  const crudo = () => JSON.parse(datosLS.get('hojarasca-v1'));
  datosLS.clear();
  ok(G.guardarProgreso(nueva('4.22.0')) === true && crudo().obras.length === 1 && crudo().obras[0].pagado === undefined && crudo().versionJuego === '4.22.0', 'B3: guardar no anota nada');
  let c = G.cargarProgreso();
  eq(c.obras[0].pagado, [32000], 'B3: al cargar una partida de la 4.22.0, la herrería lleva lo que costó');
  c.versionJuego = '4.25.3'; G.guardarProgreso(c);
  eq([crudo().obras[0].pagado, G.cargarProgreso().obras[0].pagado], [[32000], [32000]], 'B3: y queda guardado');
  datosLS.clear(); G.guardarProgreso(nueva('4.25.2'));
  ok(G.cargarProgreso().obras[0].pagado === undefined, 'B3: una partida de la 4.25.2 sin el pago en el libro carga sin anotar');
  datosLS.clear(); G.guardarProgreso(nueva('4.25.3', { pagado: [18000, 'x'], pagadoAmp: 'roto' }));
  c = G.cargarProgreso();
  eq([c.obras[0].pagado, c.obras[0].pagadoAmp ?? null], [[18000, null], null], 'B3: lo anotado se sanea al cargar');
  G.usarModoGuardado('desafio', 1);
  datosLS.clear(); { const q = G.progresoNuevo(); q.dia = 3; q.versionJuego = '4.22.0'; q.obras = [{ plano: 'herreria-propia', x: 10, z: 10, y: 0, rot: 0, etapas: 1, pagadas: 1 }]; G.guardarProgreso(q); }
  ok((G.cargarProgreso()?.obras || []).every((d) => d.pagado === undefined), 'B3: en el Desafío no hay pesos: nada que anotar');
  G.usarModoGuardado('relax', 1);

  // ---- los enganches que no se pueden correr en Node
  const main = texto('main.js', mut), alm = texto('almacen-juego.js', mut);
  ok(enUnaLinea(main, ['devolverEtapasPagadas(progreso, r.plano.id', 'r.datos?.pagado)']), 'B3: Supr sobre la marca devuelve lo anotado');
  ok(enUnaLinea(main, ['const reint = reintegroAlDesmontar(progreso, r.plano.id', 'r.datos?.pagado)']) && enUnaLinea(main, ['montoReintegroAlDesmontar(o.plano.id', 'o.datos?.pagado)']), 'B3: desmontar (y su aviso previo) también');
  ok(enUnaLinea(main, ['devolverEtapasPagadas(progreso, d.plano', 'd.pagado)']), 'B3: y el desalojo al cargar');
  ok(enUnaLinea(main, ["pagarEtapa(progreso, obra.plano.id, etapaCasa, 'Los albañiles de la aldea')", 'anotarPago(obra.datos, etapaCasa']), 'B3: las etapas de las casas se anotan');
  ok(enUnaLinea(alm, ['anotarPago(o.datos, sig.indice', "'pagadoAmp'"]) && alm.split('datos.pagadoAmp)').length === 4, 'B3: las ampliaciones del depósito se anotan y sus tres reintegros las miran');
}

// ================================================================ la Historia: un director de verdad con las escenas que se le pasen
const AY = await import('./ayuda-4-18-4-historia.mjs');
const { H } = AY;
function armar({ ES = AY.ES, E = AY.E, escenas = AY.ESC } = {}) {
  const { P, X } = AY.nuevaPartida();
  const errores = [], gastos = [];
  const mundo = { posicion: () => ({ x: 0, z: 0, y: 0 }), suelo: () => 0, camaraJugador: () => ({ x: 0, y: 1.6, z: 0, yaw: 0, pitch: 0, fov: 60 }), horaActual: () => P.horas, puedeEmpezar: () => true, hora() {} };
  const dir = ES.crearDirector({ mundo, estado: () => ES.escenasDe(P.historia), dia: () => P.dia, alError: (t) => errores.push(t) });
  for (const e of Object.values(escenas)) { const r = dir.registrar(e); if (!r.ok) errores.push(`registro ${e.id} ${r.errores.join()}`); }
  const ctxEf = { historia: () => P.historia, dia: () => P.dia, estado: () => H.estadoHistoria(P, X), opcionDeEvento: () => undefined };
  E.registrarEfectosHistoria(dir, ctxEf);
  E.registrarEfectosActo1(dir, { ...ctxEf, dar() {}, mundo() {}, duende() {}, quitar: (c, q) => gastos.push([c, q]), nocheReintentar() {} }, AY.TODOS_EF);
  return { P, X, dir, errores, gastos, h: P.historia };
}
// Corre la escena; `elige(ids)` devuelve el id de la opción (por defecto la primera). Devuelve las opciones que se ofrecieron en cada elección
function correr(S, id, { elige = (ids) => ids[0], saltar = false } = {}) {
  if (!S.dir.disparar(id, { forzar: true })) return null;
  const ofrecidas = [];
  for (let i = 0; i < 20000 && S.dir.activa(); i++) {
    S.dir.actualizar(0.1);
    if (saltar && i === 3) { S.dir.pedirSaltar(); S.dir.pedirSaltar(); continue; }
    const d = S.dir.datos();
    if (d?.eleccion) { const ids = d.eleccion.opciones.map((o) => o.id); ofrecidas.push(ids); S.dir.elegir(ids.indexOf(elige(ids))); continue; }
    if (d?.dialogo) { S.dir.acelerar(true); S.dir.avanzar(); }
  }
  return S.dir.activa() ? null : ofrecidas;
}

// ================================================================ G1-5: la respuesta cariñosa vale más
async function lazos(mut) {
  const c5 = await uno('historia-escenas-acto2-c5.js', mut), c7 = await uno('historia-escenas-acto2-c7.js', mut);
  const escenas = { ...AY.ESC, 'trigo-abuelo': c5.ESCENAS_C5['trigo-abuelo'], 'fermin-mulas': c7.ESCENAS_C7['fermin-mulas'] };
  const sube = (id, quien, opcion, desde = 0, saltar = false) => {
    const S = armar({ escenas });
    S.h.lazos[quien] = desde;
    const r = correr(S, id, { elige: () => opcion, saltar });
    ok(r !== null && S.errores.length === 0, `G1-5: ${id} corre entera (${S.errores.join(' · ')})`);
    return H.lazoDe(S.h, quien) - desde;
  };
  eq([sube('trigo-abuelo', 'ema', 'copia'), sube('trigo-abuelo', 'ema', 'rueda')], [2, 1], 'G1-5: trigo-abuelo: pedir la copia vale +2 con Josefina; la otra respuesta, +1');
  eq([sube('fermin-mulas', 'fermin', 'callar'), sube('fermin-mulas', 'fermin', 'querer'), sube('fermin-mulas', 'fermin', 'hablar')], [2, 2, 1], 'G1-5: fermin-mulas: callar y preguntarle qué quiere valen +2; mandarlo a hablar, +1');
  eq([sube('trigo-abuelo', 'ema', 'copia', 2), sube('trigo-abuelo', 'ema', 'copia', 3), sube('fermin-mulas', 'fermin', 'callar', 2)], [1, 0, 1], `G1-5: sin pasar el tope del lazo (${H.LAZO_MAX})`);
  eq([sube('trigo-abuelo', 'ema', 'copia', 0, true), sube('fermin-mulas', 'fermin', 'hablar', 0, true)], [1, 2], 'G1-5: salteada, vale la respuesta por defecto (la primera) y siempre suma');
  eq([sube('trigo-abuelo', 'ema', 'rueda', -2), sube('fermin-mulas', 'fermin', 'hablar', -2)], [1, 1], 'G1-5: la respuesta de siempre sigue dando su +1');
}

// ================================================================ E2-7: el coihue grande
async function coihue(mut) {
  const A2 = await uno('historia-disparadores-acto2.js', mut);
  const B = await uno('bosque.js', mut);
  const idx = (id) => H.CAPITULOS.findIndex((c) => c.id === id);
  const hist = (cap, d, activa = true) => { const h = H.historiaNueva(); H.empezarHistoria(h, 1); h.capitulo = idx(cap); h.fase = 'jugando'; h.decisiones = { ...h.decisiones, coihue: d }; h.activa = activa; return h; };
  ok(idx('rueda') === 4 && idx('arco') > idx('rueda') && H.capituloActual(hist('rueda', null)).id === 'rueda', 'E2-7: el capítulo de la rueda es el quinto');
  const primero = H.CAPITULOS[0].id;
  eq([A2.puedeTalarCoihue(hist('rueda', 'b')), A2.puedeTalarCoihue(hist('rueda', 'a')), A2.puedeTalarCoihue(hist('rueda', 'c'))], [true, true, true], 'E2-7: en el capítulo de la rueda, con la decisión tomada, se puede (talarlo igual es cambiar de idea)');
  eq([A2.puedeTalarCoihue(hist('rueda', null)), A2.puedeTalarCoihue(hist(primero, null)), A2.puedeTalarCoihue(hist('ramal', null))], [false, false, false], 'E2-7: antes de que Tito pregunte, no (D2 ya no queda decidida antes de tiempo)');
  eq([A2.puedeTalarCoihue(hist('arco', 'a')), A2.puedeTalarCoihue(hist('arco', 'c')), A2.puedeTalarCoihue(hist('nevada', 'a')), A2.puedeTalarCoihue(hist('cosecha', 'c'))], [false, false, false, false], 'E2-7: después, con el árbol en pie o la pirca, no (no cambia la deuda ni el final)');
  eq([A2.puedeTalarCoihue(hist('arco', 'b')), A2.puedeTalarCoihue(hist('cosecha', 'b'))], [true, true], 'E2-7: si decidiste talarlo, se puede en cualquier capítulo (el objetivo nunca queda trabado)');
  eq([A2.puedeTalarCoihue(hist('arco', 'a', false)), A2.puedeTalarCoihue(null), A2.puedeTalarCoihue({})], [true, true, true], 'E2-7: sin historia (o en pausa) es un árbol más');
  { const a = A2.motivoNoTalarCoihue(hist('ramal', null)), b = A2.motivoNoTalarCoihue(hist('arco', 'a'));
    ok([a, b].every((m) => Array.isArray(m) && m.length === 2 && m.every((t) => typeof t === 'string' && t.length > 8)) && a[0] !== b[0], 'E2-7: la nota dice por qué (todavía no / queda en pie)'); }
  // lo de siempre: talarlo cumple D2 = b; con otra decisión, en el capítulo 5, la cambia y Josefina lo toma mal
  { const h = hist('rueda', 'b'); ok(A2.coihueQuedaTocon(h) === false, 'E2-7: en pie no es tocón');
    A2.alTalarCoihue(h, 20);
    ok(Object.hasOwn(h.temas, 'mundo:coihue-talado') && A2.coihueQuedaTocon(h) === true && H.lazoDe(h, 'ema') === 0, 'E2-7: talado con D2 = b: queda la marca, es tocón y no hay castigo');
    h.decisiones.coihue = 'a'; ok(A2.coihueQuedaTocon(h) === false, 'E2-7: sólo con D2 = b'); }
  { const h = hist('rueda', 'a'); A2.alTalarCoihue(h, 20); eq([h.decisiones.coihue, H.lazoDe(h, 'ema'), A2.coihueQuedaTocon(h)], ['b', -2, true], 'E2-7: en el capítulo 5, talarlo con «dejarlo en pie» sigue pasando a «talarlo» con −2 de Josefina'); }
  ok(A2.coihueQuedaTocon(null) === false && A2.coihueQuedaTocon({ decisiones: { coihue: 'b' } }) === false, 'E2-7: sin datos no es tocón');

  // el rebrote
  { const lista = [{ i: 3, dia: 10, esc: 0 }, { i: 7, dia: 10, esc: 0 }];
    const r = B.avanzarRebrote(lista, 10 + B.DIAS_REBROTE + 5, (i) => i === 7);
    eq([r.adultos, r.quedan.map((t) => [t.i, t.esc])], [[3], [[7, 0]]], 'E2-7: el tocón del coihue no rebrota; el de al lado sí');
    const s = B.avanzarRebrote([{ i: 3, dia: 10, esc: 0 }, { i: 7, dia: 10, esc: 0 }], 10 + B.DIAS_REBROTE + 5);
    eq(s.adultos, [3, 7], 'E2-7: sin la excepción, como siempre'); }
  // main.js de verdad: revisarRebrote y la E / la H sobre el árbol
  const main = texto('main.js', mut);
  const juego = (h, dia, talados) => {
    const crecidos = [];
    const P = { dia, talados, historia: h };
    const env = { progreso: P, diaRebrote: -1, talados: () => P.talados, avanzarRebrote: B.avanzarRebrote, coihueQuedaTocon: A2.coihueQuedaTocon, indiceCoihueDeHistoria: () => 7,
      veg: { arboles: Array.from({ length: 10 }, (_, i) => ({ i })), crecer: (a, e) => crecidos.push([a.i, e]) }, nota() {}, guardar() {} };
    return { P, crecidos, revisar: funcion(main, 'revisarRebrote', env) };
  };
  const hTalado = hist('arco', 'b'); A2.alTalarCoihue(hTalado, 20);
  { const j = juego(hTalado, 50, [{ i: 3, dia: 49, esc: 0, apurado: false }]);
    j.revisar(true);
    ok(j.P.talados.some((t) => t.i === 7) && j.crecidos.some(([i, e]) => i === 7 && e === 0), 'E2-7: al cargar una partida donde el coihue ya había rebrotado, vuelve a ser tocón');
    j.P.dia = 50 + B.DIAS_REBROTE + 3; j.crecidos.length = 0;
    j.revisar();
    ok(j.P.talados.some((t) => t.i === 7) && !j.P.talados.some((t) => t.i === 3) && j.crecidos.some(([i, e]) => i === 3 && e >= 1) && !j.crecidos.some(([i, e]) => i === 7 && e > 0), 'E2-7: pasan los días: el otro árbol vuelve, el coihue sigue tocón'); }
  { const j = juego(hist('arco', 'a'), 50, []); j.revisar(true); ok(j.P.talados.length === 0 && j.crecidos.length === 0, 'E2-7: con el coihue en pie no se toca nada'); }
  { const j = juego(hist('rueda', 'a'), 50, [{ i: 7, dia: 30, esc: 0, apurado: false }]); j.revisar(true); ok(j.P.talados.length === 0 && j.crecidos.some(([i, e]) => i === 7 && e >= 1), 'E2-7: un coihue talado antes de tiempo en una partida vieja, con «dejarlo en pie», rebrota como cualquiera'); }
  const hacha = (h) => {
    const notas = []; let llego = false;
    const env = { objetivoHacha: () => ({ talar: true, grande: true, golpes: 0, arbol: {} }), lugarTomado: () => false, nota: (...a) => notas.push(a), progreso: { historia: h },
      puedeTalarCoihue: A2.puedeTalarCoihue, motivoNoTalarCoihue: A2.motivoNoTalarCoihue, nivelDe: () => { llego = true; throw new Error('hasta acá'); }, GOLPES_COIHUE: 6 };
    try { funcion(main, 'usarHacha', env)(); } catch (e) { if (e.message !== 'hasta acá') throw e; }
    return { notas, llego, aviso: funcion(main, 'textoHacha', env)({ talar: true, grande: true, golpes: 0 }) };
  };
  { const r = hacha(hist('arco', 'a')); ok(!r.llego && r.notas.length === 1 && r.notas[0][0] === 'El coihue grande queda en pie' && r.aviso === 'El coihue grande queda en pie', 'E2-7: la H sobre el coihue fuera de su capítulo no da ni un hachazo y dice por qué (también el aviso)'); }
  { const r = hacha(hist('ramal', null)); ok(!r.llego && r.notas[0]?.[0] === 'El coihue grande, todavía no', 'E2-7: antes de la decisión, lo mismo'); }
  { const r = hacha(hist('rueda', 'b')); ok(r.llego && r.notas.length === 0 && r.aviso === 'Talar el coihue grande', 'E2-7: cuando la historia lo pide, se tala como siempre'); }
  { const r = hacha(null); ok(r.llego && r.aviso === 'Talar el coihue grande', 'E2-7: y sin historia también'); }
}

// ================================================================ E2-9: las paces con Fermín
async function paces(mut) {
  const ES = await uno('escenas.js', mut), E = await uno('historia-escenas-efectos.js', mut);
  const c11 = await uno('historia-escenas-acto3-c11.js', mut), A3 = await uno('historia-disparadores-acto3.js', mut);
  const escenas = { ...AY.ESC, 'fermin-paces': c11.ESCENAS_C11['fermin-paces'] };
  const con = (tengo, opc = {}) => {
    const S = armar({ ES, E, escenas });
    if (tengo.harina) S.P.cosas.harina = tengo.harina;
    if (tengo.yerba) S.P.cosas.yerba = tengo.yerba;
    if (tengo.pan) S.P.entradas['pan-casero'] = { cantidad: tengo.pan };
    const r = correr(S, 'fermin-paces', opc);
    ok(r !== null && S.errores.length === 0, `E2-9: fermin-paces corre entera (${S.errores.join(' · ')})`);
    return { ofrecidas: r?.[0] || null, gastos: S.gastos, S };
  };
  { const r = con({ yerba: 1 }); eq([r.ofrecidas, r.gastos], [['yerba'], [['yerba', 1]]], 'E2-9: sólo con yerba, se ofrece la yerba y se cobra la yerba'); }
  { const r = con({ pan: 1 }); eq([r.ofrecidas, r.gastos], [['pan'], [['pan-casero', 1]]], 'E2-9: sólo con pan casero, el pan'); }
  { const r = con({ harina: 2 }); eq([r.ofrecidas, r.gastos], [['harina'], [['harina', 1]]], 'E2-9: sólo con harina, la harina'); }
  { const r = con({ harina: 1, yerba: 1, pan: 1 }, { elige: () => 'pan' }); eq([r.ofrecidas, r.gastos], [['harina', 'yerba', 'pan'], [['pan-casero', 1]]], 'E2-9: con las tres cosas, las tres opciones de siempre'); }
  { const r = con({ harina: 1, pan: 1 }, { elige: (ids) => ids[1] }); eq([r.ofrecidas, r.gastos], [['harina', 'pan'], [['pan-casero', 1]]], 'E2-9: la segunda de las ofrecidas es la segunda que tenés'); }
  { const r = con({ pan: 3 }, { saltar: true }); eq(r.gastos, [['pan-casero', 1]], 'E2-9: salteada, toma la primera que tenés (no la harina que no hay)'); }
  { const r = con({ harina: 1, yerba: 1, pan: 1 }, { saltar: true }); eq(r.gastos, [['harina', 1]], 'E2-9: salteada con todo, la de por defecto de siempre'); }
  { const r = con({}); eq(r.ofrecidas, ['harina', 'yerba', 'pan'], 'E2-9: una elección nunca queda vacía (sin nada, que no pasa: el disparador pide algo, se ofrecen todas)'); }
  // el disparador y el objetivo
  const cond = A3.DISPARADORES_ACTO3['fermin-paces'].cond;
  const estado = (tengo) => { const S = armar(); S.h.decisiones.majada = 'c'; if (tengo.harina) S.P.cosas.harina = 1; if (tengo.yerba) S.P.cosas.yerba = 1; if (tengo.pan) S.P.entradas['pan-casero'] = { cantidad: 1 }; return H.estadoHistoria(S.P, S.X); };
  eq([cond(estado({})), cond(estado({ harina: 1 })), cond(estado({ yerba: 1 })), cond(estado({ pan: 1 }))], [false, true, true, true], 'E2-9: la escena sale con harina, yerba o pan casero; sin nada, no');
  ok(texto('historia.js', mut).includes('llevale un regalo que le guste (harina, yerba o pan casero)'), 'E2-9: el objetivo dice las tres cosas');
  // ninguna otra elección cambia: sólo estas tres opciones llevan condición
  const conSi = Object.values(escenas).flatMap((e) => e.pasos.filter((p) => p.tipo === 'eleccion').flatMap((p) => p.opciones.filter((o) => o.si).map((o) => `${e.id}:${o.id}`)));
  eq(conSi, ['fermin-paces:harina', 'fermin-paces:yerba', 'fermin-paces:pan'], 'E2-9: las únicas opciones con condición son las de las paces');
  // la deuda del trato (lo otro de E2-9) ya la cobra bien la 4.18.4: sigue así
  { const s = estado({ harina: 1 }); s.decisiones.bolsa = 'b'; s.decisiones.coihue = 'b';
    ok(A3.puedePagarLoQueSeDebe(s) === false && A3.puedePagarLoQueSeDebe({ ...s, tablas: 6 }) === true, 'E2-9: la deuda del trato sólo se ofrece pagar cuando alcanza para todo lo que se debe'); }
}

// ================================================================ E3-10: el amanecer pendiente
async function amanecer(mut) {
  const mods = await cargarGrupo(['historia-noche.js', 'historia-noche-ui.js'], mut);
  const N = mods['historia-noche.js'], { crearNocheUi } = mods['historia-noche-ui.js'];
  const el = () => ({ classList: { toggle() {}, contains() { return true; }, add() {}, remove() {} }, style: {}, setAttribute() {}, appendChild() {}, innerHTML: '' });
  const doc = { getElementById: () => null, createElement: el, body: el() };
  const sesion = (h, P, { modo = 'jugando' } = {}) => {
    const s = { guardados: [], alGalpon: 0, escena: false, lanzadas: [], alTerminar: null, activa: false };
    const mundo = { activa: () => s.activa, iniciar(o) { s.alTerminar = o.alTerminar; s.activa = true; return true; }, actualizar() {}, hud: () => null, pausar() {}, abandonar() {} };
    const dir = { activa: () => s.escena, hay: () => true, disparar(id) { s.lanzadas.push(id); s.escena = true; return true; } };
    s.ui = crearNocheUi({ documento: doc, noche: mundo, progreso: () => P, guardar: () => s.guardados.push(JSON.stringify({ P, h })), nota() {}, modo: () => modo, escenas: () => dir, jugadorAlGalpon: () => { s.alGalpon++; } },
      { mostrar() {}, cerrar() {} }, { historia: () => h });
    return s;
  };
  const historia = () => {
    const h = H.historiaNueva(); H.empezarHistoria(h, 1);
    h.capitulo = H.CAPITULOS.findIndex((c) => c.id === 'nevada'); h.fase = 'jugando';
    h.escenas.vistas['noche-espera'] = 30; h.duendes.trato = 'trato'; h.duendes.noche = 'pendiente';
    return h;
  };
  // ---- ganar la noche: la escena corre; mientras, la partida guardada dice «falta amanecer»
  const h = historia(), P = { dia: 30, horas: 22 };
  const s = sesion(h, P);
  ok(s.ui.empezar() === true && typeof s.alTerminar === 'function', 'E3-10: la noche empieza');
  P.horas = 23.4; s.activa = false;
  s.alTerminar({ gano: true, modo: 'trato' });
  eq([s.lanzadas, h.noche.estado, h.noche.amanecer, P.dia, P.horas], [['noche-tras-ganar'], 'ganada', true, 30, 23.4], 'E3-10: al ganar corre la escena y el amanecer queda pendiente');
  const cortada = JSON.parse(s.guardados[s.guardados.length - 1]);
  ok(cortada.h.noche.amanecer === true && cortada.h.noche.estado === 'ganada', 'E3-10: lo guardado antes de la escena lo trae');
  s.ui.actualizar(0.016);
  eq([P.dia, P.horas, s.alGalpon], [30, 23.4, 0], 'E3-10: con la escena corriendo no amanece');
  // ---- (a) la sesión sigue: termina la escena y amanece una sola vez
  s.escena = false;
  s.ui.actualizar(0.016);
  eq([P.dia, P.horas, s.alGalpon, h.noche.amanecer ?? null], [31, 6.4, 1, null], 'E3-10: al terminar la escena amanece: otro día, 6:24, en tu galpón, y ya no queda pendiente');
  s.ui.actualizar(0.016); s.ui.actualizar(0.016);
  eq([P.dia, P.horas, s.alGalpon], [31, 6.4, 1], 'E3-10: una sola vez');
  // ---- (b) se cerró el juego en la escena: se carga lo guardado y amanece al volver
  const h2 = H.sanearHistoria(cortada.h), P2 = { ...cortada.P };
  h2.noche = N.sanearNoche(cortada.h.noche);
  ok(h2.noche.amanecer === true && H.sanearHistoria(cortada.h).noche.amanecer === true, 'E3-10: la marca pasa el saneado de la carga');
  const s2 = sesion(h2, P2);
  s2.ui.actualizar(0.016);
  eq([P2.dia, P2.horas, s2.alGalpon, h2.noche.amanecer ?? null, h2.noche.estado, s2.lanzadas], [31, 6.4, 1, null, 'ganada', []], 'E3-10: al volver amanece (antes: las 23 y pico, donde fue la noche)');
  ok(h2.raro.some((x) => x.id === 'noche-ganada'), 'E3-10: y queda la nota del cuaderno que dejaba la escena');
  ok(s2.guardados.length === 1 && JSON.parse(s2.guardados[0]).h.noche.amanecer === undefined, 'E3-10: se guarda ya amanecido');
  s2.ui.actualizar(0.016);
  eq([P2.dia, s2.alGalpon], [31, 1], 'E3-10: y no vuelve a amanecer');
  // ---- no amanece fuera del juego (la portada, la pausa) ni con la historia en pausa
  { const h3 = H.sanearHistoria(cortada.h); h3.noche = N.sanearNoche(cortada.h.noche); const P3 = { ...cortada.P };
    const s3 = sesion(h3, P3, { modo: 'pausa' }); s3.ui.actualizar(0.016);
    ok(P3.dia === 30 && h3.noche.amanecer === true, 'E3-10: en la pausa espera'); }
  { const h3 = H.sanearHistoria(cortada.h); h3.noche = N.sanearNoche(cortada.h.noche); h3.activa = false; const P3 = { ...cortada.P };
    const s3 = sesion(h3, P3); s3.ui.actualizar(0.016);
    ok(P3.dia === 30 && h3.noche.amanecer === true, 'E3-10: con la historia en pausa también'); }
  // ---- el saneado: sólo con la noche ganada
  eq([N.sanearNoche({ estado: 'ganada', amanecer: true }).amanecer ?? null, N.sanearNoche({ estado: 'pendiente', amanecer: true }).amanecer ?? null, N.sanearNoche({ estado: 'ganada', amanecer: 1 }).amanecer ?? null, Object.hasOwn(N.nocheNueva(), 'amanecer')],
    [true, null, null, false], 'E3-10: la marca sólo vale con la noche ganada, y una partida sin ella queda igual que antes');
  // ---- perder y «que amanezca» sigue como estaba (sin marca)
  { const h4 = historia(), P4 = { dia: 30, horas: 22 }; const s4 = sesion(h4, P4);
    s4.ui.empezar(); s4.activa = false; s4.alTerminar({ gano: false, modo: 'trato', motivo: 'travesuras' });
    ok(h4.noche.amanecer === undefined && s4.lanzadas[0] === 'noche-tras-perder' && P4.horas === 22, 'E3-10: al perder no queda nada pendiente y el reloj vuelve'); }
}

// ================================================================ correr todo y las mutaciones
const SECCIONES = { gallinas, pesos, lazos, coihue, paces, amanecer };
for (const f of Object.values(SECCIONES)) await f(null);

const MUTACIONES = [
  ['gallinas', 'gallinero-mundo.js', "if (fisica && (!a.revisada || huye || (vel > 0 && (cuadro + i) % CADA === 0))) acomodar(a, huye);", ''],
  ['gallinas', 'gallinero-mundo.js', 'const CADA = 4,', 'const CADA = 1,'],
  ['gallinas', 'gallinero-mundo.js', '_p.set(a.x, a.sobre ?? T.altura(a.x, a.z), a.z)', '_p.set(a.x, T.altura(a.x, a.z), a.z)'],
  ['gallinas', 'gallinero-mundo.js', 'if (Math.hypot(_c.x - a.cx, _c.z - a.cz) > RADIO + 1) {', 'if (false) {'],
  ['gallinas', 'gallinero-mundo.js', 'if (++a.trabada >= 8) {', 'if (false) {'],
  ['gallinas', 'main.js', 'gallinasMundo = crearGallinas(T, escena, { resolver: (p, r, h) => col.resolver(p, r, h), alturaDePie: (x, z, y) => alturaDePie(T, col, x, z, y) });', 'gallinasMundo = crearGallinas(T, escena);'],
  ['pesos', 'obra-pesos.js', "return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? entero(n) : precioDeEtapa(id, i);", 'return precioDeEtapa(id, i);'],
  ['pesos', 'obra-pesos.js', 'const vieja = anteriorALaBaja(versionJuego);', 'const vieja = true;'],
  ['pesos', 'obra-pesos.js', 'return a < 4 || (a === 4 && b < 23);', 'return a < 4 || (a === 4 && b < 22);'],
  ['pesos', 'obra-pesos.js', 'cupo.set(d.plano, n - 1); }', '}'],
  ['pesos', 'obra-pesos.js', 'n--;', ';'],
  ['pesos', 'obra-pesos.js', '&& mov.monto === -v.precios[0]) n++;', ') n++;'],
  ['pesos', 'obra-pesos.js', 'if (pagadas < 1 || Array.isArray(d.pagado)) continue;', 'if (pagadas < 1) continue;'],
  ['pesos', 'obra-pesos.js', "'herreria-propia': { precios: [32000]", "'herreria-propia': { precios: [36000]"],
  ['pesos', 'main.js', 'anotarPago(datos, i, hecho?.ok ? hecho.precio : 0);', ''],
  ['pesos', 'main.js', "const reint = reintegroAlDesmontar(progreso, r.plano.id, r.datos?.etapas || 0, r.datos?.pagadas || 0, undefined, r.datos?.pagado);", "const reint = reintegroAlDesmontar(progreso, r.plano.id, r.datos?.etapas || 0, r.datos?.pagadas || 0);"],
  ['pesos', 'guardado.js', 'migrarPagadoDeObras(p.obras, p.versionJuego, p.economia.libro);', ''],
  ['pesos', 'guardado.js', 'const l = sanearPagado(d[k]); if (l) d[k] = l; else delete d[k];', ''],
  ['pesos', 'almacen-juego.js', "anotarPago(o.datos, sig.indice, hecho?.ok ? hecho.precio : 0, 'pagadoAmp');", ''],
  ['lazos', 'historia-escenas-acto2-c5.js', "opcion('copia', '¿Me dejás sacarle una copia?', { efecto: 'lazo:ema:2' })", "opcion('copia', '¿Me dejás sacarle una copia?', { efecto: 'lazo:ema:1' })"],
  ['lazos', 'historia-escenas-acto2-c5.js', "con(efecto('lazo:ema:1'), siEleg('trigo-resp', 'rueda')),", "efecto('lazo:ema:1'),"],
  ['lazos', 'historia-escenas-acto2-c7.js', "opcion('querer', '¿Vos qué querés hacer?', { efecto: 'lazo:fermin:2' })", "opcion('querer', '¿Vos qué querés hacer?', { efecto: 'lazo:fermin:1' })"],
  ['lazos', 'historia-escenas-acto2-c7.js', "con(efecto('lazo:fermin:1'), siEleg('mulas-fermin', 'hablar')),", "efecto('lazo:fermin:1'),"],
  ['coihue', 'historia-disparadores-acto2.js', "return d != null && enCap(h, 'rueda');", 'return true;'],
  ['coihue', 'historia-disparadores-acto2.js', "return d != null && enCap(h, 'rueda');", "return enCap(h, 'rueda');"],
  ['coihue', 'historia-disparadores-acto2.js', "if (d === 'b') return true;\n  return d != null", "return d != null"],
  ['coihue', 'historia-disparadores-acto2.js', "return d === 'b' && !!h.temas", 'return !!h.temas'],
  ['coihue', 'bosque.js', "typeof quieto === 'function' && quieto(t.i) === true ? 0 : escalaRebrote(dia - t.dia)", 'escalaRebrote(dia - t.dia)'],
  ['coihue', 'main.js', 'avanzarRebrote(lista, progreso.dia, iCoihue >= 0 ? (i) => i === iCoihue : null)', 'avanzarRebrote(lista, progreso.dia)'],
  ['coihue', 'main.js', 'if (forzar && iCoihue >= 0 && !lista.some((t) => t.i === iCoihue))', 'if (false)'],
  ['coihue', 'main.js', "if (o.grande && !puedeTalarCoihue(progreso.historia)) { const m = motivoNoTalarCoihue(progreso.historia); nota(m[0], m[1]); return; }", ''],
  ['coihue', 'main.js', "if (o.grande && !puedeTalarCoihue(progreso.historia)) return motivoNoTalarCoihue(progreso.historia)[0];", ''],
  ['paces', 'escenas.js', 'const lista = p.opciones.filter((o) => cumple(o.si));', 'const lista = p.opciones;'],
  ['paces', 'escenas.js', 'return { p: ops === p.opciones ? p : { ...p, opciones: ops }, i: Math.max(0, ops.indexOf(def)) };', 'return { p: ops === p.opciones ? p : { ...p, opciones: ops }, i: ops.length - 1 };'],
  ['paces', 'escenas.js', 'return lista.length ? lista : p.opciones;', 'return lista;'],
  ['paces', 'historia-escenas-efectos.js', 'Number(s[a.que]) >= Math.max(1, Math.floor(Number(a.n) || 1))', 'true'],
  ['paces', 'historia-escenas-acto3-c11.js', "opcion('pan', 'Pan casero, todavía tibio.', { sabor: true, si: { cond: 'tiene', args: { que: 'pan', n: 1 } } })", "opcion('pan', 'Pan casero, todavía tibio.', { sabor: true })"],
  ['paces', 'historia-disparadores-acto3.js', '(s.harina >= 1 || s.yerba >= 1 || s.pan >= 1)', '(s.harina >= 1 || s.yerba >= 1)'],
  ['amanecer', 'historia-noche-ui.js', 'if (res.gano) { h.noche.amanecer = true; ctx.guardar();', 'if (res.gano) { ctx.guardar();'],
  ['amanecer', 'historia-noche-ui.js', 'delete h.noche.amanecer;   // (4.25.3)', ''],
  ['amanecer', 'historia-noche-ui.js', "!escenaDeNoche && h.activa && ctx.modo() === 'jugando' && !ctx.escenas?.()?.activa?.()", "!escenaDeNoche && !ctx.escenas?.()?.activa?.()"],
  ['amanecer', 'historia-noche-ui.js', "if (h.noche.estado === 'ganada') { try { anotarRaro(h, 'noche-ganada', ctx.progreso().dia); } catch { /* la nota es lo de menos */ } amanecer(h); }", "if (h.noche.estado === 'ganada') { amanecer(h); }"],
  ['amanecer', 'historia-noche.js', "if (v.amanecer === true && n.estado === 'ganada') n.amanecer = true;", ''],
  ['amanecer', 'historia-noche.js', "if (v.amanecer === true && n.estado === 'ganada') n.amanecer = true;", 'if (v.amanecer) n.amanecer = true;'],
];
let atrapadas = 0;
const vivas = [];
for (const [seccion, archivo, de, a] of MUTACIONES) {
  enMutacion = true; fallasMut = 0;
  let tiro = false;
  try { await SECCIONES[seccion]({ archivo, de, a }); }
  catch (e) { if (/^mutación sin texto/.test(e?.message || '')) { enMutacion = false; throw e; } tiro = true; }
  enMutacion = false;
  if (fallasMut > 0 || tiro) atrapadas++; else vivas.push(`${seccion} · ${archivo}: ${de.slice(0, 70)}`);
}
assert.deepEqual(vivas, [], 'todas las mutaciones se atrapan');

console.log(`verificar-4-25-3-restantes: ${n} comprobaciones OK y ${atrapadas} mutaciones atrapadas`);

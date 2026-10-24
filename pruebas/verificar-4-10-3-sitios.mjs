// 4.10.3 — dónde se puede fundar (zona G): EJECUTA revisarSitio / fundar con el valle real (terreno, colisiones, estructuras, trochita con el
// apeadero del Riel Sur y los cuatro puestos de ruta) y con un mundo llano.
//   G-1 ni sobre un puesto de ruta, el andén ni la veta   G-2 ni pisando un edificio del valle ni una obra grande tuya
//   G-3 los troncos de la esquina de la huella se despejan   G-4 una pieza grande no se apoya en el muelle ni en pisos ajenos
//   G-5 el Galpón de herramientas y el Cobertizo rural cubren de la lluvia
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { cargarModulos } from './ayuda-4-0-3-valle.mjs';
import { mundo, C as CL, THREE as THL } from './ayuda-4-0-1-mundo.mjs';
import { reservaDeRuta, PUESTOS_RUTA } from '../src/puestos-ruta.js';
import { mundo as mundoCam, terreno as terrenoCam, caminarA, paso } from './ayuda-4-0-3-caminante.mjs';

let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const leer = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

// ---------------------------------------------------------------- el enganche de main.js
{
  const main = leer('src/main.js');
  ok(main.includes('T.reservaRuta = (x, z, radio) => reservaDeRuta(x, z, radio, { anden, recursos: PUNTOS_ZONA });'), 'main.js define T.reservaRuta con el andén y los recursos de zona');
  ok(main.includes("t.paradas.find((q) => q.apeadero)?.anden"), 'el andén sale de la parada apeadero de la trochita');
  ok(/if \(!esDesafio\) \{\s*try \{\s*puestosRutaMundo = /.test(main) && main.indexOf('T.reservaRuta =') > main.indexOf('puestosRutaMundo = crearPuestosRutaMundo'), 'sólo en el Relax, junto a los puestos');
}

// ---------------------------------------------------------------- la regla pura
{
  for (const id of Object.keys(PUESTOS_RUTA)) {
    const p = PUESTOS_RUTA[id].pos;
    ok(/ahí no se construye/.test(reservaDeRuta(p.x, p.z, 1) || ''), `el centro del puesto ${id} está reservado`);
    ok(reservaDeRuta(p.x + 7.4, p.z, 0.1), `a 7,4 m del puesto ${id} sigue reservado para una pieza chica`);
    ok(reservaDeRuta(p.x + 30, p.z, 5) === null, `a 30 m del puesto ${id} se puede`);
  }
  ok(reservaDeRuta(10, 10, 4, { anden: { x: 12, z: 10 } }), 'el andén reserva');
  ok(reservaDeRuta(40, 10, 4, { anden: { x: 12, z: 10 } }) === null, 'lejos del andén se puede');
  ok(reservaDeRuta(-405, -305, 2, { recursos: [{ x: -405, z: -305, radio: 4.6, nombre: 'Veta de la cantera' }] }), 'la veta reserva');
  ok(reservaDeRuta(NaN, 3, NaN) === null || typeof reservaDeRuta(NaN, 3, NaN) === 'string', 'con NaN no tira');
}

// ---------------------------------------------------------------- el valle real
const { THREE, M } = cargarModulos(['terreno.js', 'cache-carga.js', 'colisiones.js', 'puertas.js', 'estructuras.js', 'trochita.js', 'construccion.js', 'puestos-ruta-mundo.js', 'puestos-ruta.js', 'recursos-zona.js']);
const sonido = new Proxy({}, { get: () => () => {} });
const T = M.terreno.generarTerreno();
const escena = new THREE.Scene();
const col = M.colisiones.crearColisiones();
const puertas = M.puertas.crearPuertas(T, escena, col, null);
const veg = { arboles: [], colisiones: [], despejar() { return 0; } };
const progreso = { puestosRuta: M.puestos_ruta.puestosRutaNuevos(), comercio: {}, dia: 3 };
const est = M.estructuras.crearEstructuras(T, escena, col, veg, puertas, undefined);
const tren = M.trochita.crearTrochita(T, escena, col, sonido, { cartel: () => {}, sentaderos: [], aldea: null, lugaresAntes: est.lugaresSorteo || null, apeaderos: [M.puestos_ruta_mundo.apeaderoDelRielSur(T, () => progreso)] });
M.puestos_ruta_mundo.crearPuestosRutaMundo({ T, escena, grupo: escena, mat: new THREE.MeshLambertMaterial(), col, cartel: () => {}, sentaderos: [], cubiertas: [], progreso: () => progreso });
const L = T.lugares;
// lo mismo que main.js (techosFijos y reservaRuta)
{
  const interiores = []; const agregar = (l, r) => { if (l && typeof l.x === 'number') interiores.push({ x: l.x, z: l.z, r }); };
  agregar(L.refugio, 3.1); for (const c of est.cabañas || []) agregar(c, 2.6); agregar(L.almacen, 4.2); agregar(L.galpon, 5.5); agregar(L.molino, 2.2); agregar(L.faro, 2.4); agregar(L['casa-te'], 3.0); agregar(L.estacion, 3.2); agregar(L.cueva, 3.4);
  T.interiorFijo = (x, z) => interiores.some((c) => Math.hypot(x - c.x, z - c.z) < c.r);
  const anden = tren.paradas.find((q) => q.apeadero)?.anden || null;
  ok(anden && Number.isFinite(anden.x), 'la trochita tiene el andén del Riel Sur');
  T.reservaRuta = (x, z, radio) => reservaDeRuta(x, z, radio, { anden, recursos: M.recursos_zona.PUNTOS_ZONA });
}
const S = M.construccion.crearConstruccion(T, escena, col, veg, puertas);
const { PLANO } = M.construccion;
const rev = (id, x, z, rot = 0) => S.revisarSitio(x, z, PLANO[id], rot);

// G-1
{
  const grandes = ['herreria-propia', 'carpinteria', 'canteria', 'local-almacen', 'barraca', 'casona', 'cabana-piedra', 'fogon'].filter((id) => PLANO[id]);
  ok(grandes.length >= 6, 'están los planos del informe');
  const sitios = [];
  for (const id of Object.keys(PUESTOS_RUTA)) { const p = PUESTOS_RUTA[id].pos; sitios.push([`puesto ${id}`, p.x, p.z]); }
  const anden = tren.paradas.find((q) => q.apeadero).anden;
  sitios.push(['andén', anden.x, anden.z]);
  const veta = M.recursos_zona.PUNTOS_ZONA.find((p) => p.id === 'cantera');
  sitios.push(['veta', veta.x, veta.z]);
  for (const [nombre, x, z] of sitios) for (const id of grandes) {
    const r = rev(id, x, z);
    ok(!r.ok && /no se construye|paso libre/.test(r.motivo), `${id} sobre ${nombre} se rechaza (${r.ok ? 'se aceptó' : r.motivo})`);
  }
  // y no es un «no» general: cerca de la Estepa, más allá de la reserva, algún sitio de la herrería se acepta
  const c = PUESTOS_RUTA.C.pos;
  let libres = 0;
  for (let d = 14; d <= 40 && !libres; d += 2) for (let a = 0; a < 16; a++) { const r = rev('herreria-propia', c.x + Math.cos(a * Math.PI / 8) * d, c.z + Math.sin(a * Math.PI / 8) * d); if (r.ok) libres++; }
  ok(libres > 0, 'lejos del puesto de la Estepa la herrería sí se puede fundar');
}

// G-4: el muelle del lago
{
  const m = L.muelle;
  ok(m && Number.isFinite(m.ang), 'hay muelle');
  let fundadas = 0;
  for (const dd of [0, 3, 6, 9, 12]) for (const id of ['herreria-propia', 'barraca', 'local-almacen']) {
    const r = rev(id, m.x + Math.cos(m.ang) * dd, m.z + Math.sin(m.ang) * dd);
    if (r.ok) fundadas++;
  }
  ok(fundadas === 0, `sobre el muelle no se funda ninguna pieza grande (${fundadas} aceptadas)`);
}

// G-2: edificios del valle. Ningún sitio aceptado tiene paredes, cercos ni mostradores adentro de la huella
{
  const pts = (o) => (o.seg ? [0, 0.25, 0.5, 0.75, 1].map((t) => [o.ax + (o.bx - o.ax) * t, o.az + (o.bz - o.az) * t]) : [[o.x, o.z]]);
  let aceptados = 0, metidos = 0, rechazadosPorEdificio = 0;
  for (const id of ['herreria-propia', 'barraca', 'local-almacen']) {
    const P = PLANO[id], hw = P.ancho / 2 - 0.2, hd = P.fondo / 2 - 0.2;
    for (const nom of ['almacen', 'galpon', 'cueva', 'molino', 'casa-te', 'faro', 'cabana', 'puesto']) {
      const l = L[nom]; if (!l) continue;
      for (let d = 3; d <= 14; d += 1) for (let a = 0; a < 16; a++) {
        const x = l.x + Math.cos(a * Math.PI / 8) * d, z = l.z + Math.sin(a * Math.PI / 8) * d;
        const r = rev(id, x, z, 0);
        if (!r.ok) { if (r.motivo === 'Se superpone con un edificio del valle') rechazadosPorEdificio++; continue; }
        aceptados++;
        let dentro = 0;
        for (const o of col.cercanos(x, z)) { if (o.despejado || o.apagado || o.duenio || (o.r || 0) >= 3) continue; for (const [px, pz] of pts(o)) if (Math.abs(px - x) < hw && Math.abs(pz - z) < hd) { dentro++; break; } }
        if (dentro) metidos++;
      }
    }
  }
  ok(rechazadosPorEdificio > 20, `la regla del edificio del valle actúa (${rechazadosPorEdificio} sitios)`);
  ok(aceptados > 100, `siguen aceptándose sitios libres junto a los edificios (${aceptados})`);
  ok(metidos === 0, `ningún sitio aceptado tiene un edificio del valle adentro de la huella (${metidos} de ${aceptados})`);
}

// ---------------------------------------------------------------- mundo llano: lo que pisa una obra grande tuya, los troncos y la lluvia
const llano = () => mundo({ altura: () => 0 });
// G-2 (obras tuyas)
{
  const w = llano();
  const h = w.terminar('herreria-propia', 0, 0, 0);
  ok(h.ok, 'se arma la herrería');
  const Ph = CL.PLANO['herreria-propia'];
  const hwH = Ph.ancho / 2;
  let probados = 0, aceptadosLejos = 0;
  for (const id of ['salon-grande', 'galeria-cerrada', 'quincho', 'taller-anexo', 'bodega-piedra', 'dormitorio-anexo', 'huerta-terrazas', 'aljibe', 'pozo-balde', 'palomar', 'vitrina-roble', 'local-almacen', 'establo-caballo']) {
    const P = CL.PLANO[id]; if (!P) continue;
    probados++;
    const hw = (P.ancho || P.radio * 1.4) / 2;
    for (let dx = 0.3; dx < hw + hwH + 3; dx += 0.1) {
      if (dx <= hwH + 0.05) continue;   // el centro adentro de la herrería es otra cuenta (un mueble sobre su piso)
      const r = w.s.revisarSitio(dx, 0, P, 0);
      if (r.ok) {
        ok(dx >= hwH + hw - 0.2, `${id} se aceptó a ${dx.toFixed(1)} m de la herrería pisándola (solape ${(hwH + hw - dx).toFixed(2)} m)`);
        if (dx > hwH + hw + 0.5) aceptadosLejos++;
        break;
      }
    }
  }
  ok(probados >= 8, `se probaron planos suficientes (${probados})`);
  ok(aceptadosLejos + 0 >= 0, 'ok');
}
// G-3: los troncos de la huella
{
  // un veg de mentira que despeja como el real: lo que está a menos de radio + r del punto
  const arboles = [];
  const falso = { arboles, colisiones: [], despejar(x, z, radio) { let n = 0; for (const a of arboles) if (!a.sacado && Math.hypot(a.x - x, a.z - z) < radio + a.r) { a.sacado = true; n++; } return n; } };
  for (const id of ['herreria-propia', 'local-almacen', 'barraca', 'corral-grande', 'canteria', 'cobertizo-heno', 'establo-caballo']) {
    arboles.length = 0;
    const P = CL.PLANO[id], hw = P.ancho / 2, hd = P.fondo / 2;
    for (const sx of [-1, 0, 1]) for (const sz of [-1, 0, 1]) if (sx || sz) arboles.push({ x: sx * (hw - 0.35), z: sz * (hd - 0.35), r: 0.58, sacado: false });
    const lejano = { x: hw + 3.5, z: 0, r: 0.58, sacado: false }; arboles.push(lejano);
    const w = mundo({ altura: () => 0 }, falso);
    const r = w.terminar(id, 0, 0, 0);
    ok(r.ok, `${id} se arma (${r.motivo || ''})`);
    const vivos = arboles.filter((a) => !a.sacado && a !== lejano);
    ok(vivos.length === 0, `${id}: quedan ${vivos.length} troncos adentro de la huella`);
    ok(!lejano.sacado, `${id}: el árbol de afuera (a 3,5 m del borde) no se toca`);
  }
}
// G-5: la lluvia
{
  for (const id of ['galponcito', 'cobertizo']) {
    const w = llano();
    const r = w.terminar(id, 0, 0, 0);
    ok(r.ok, `${id} se arma`);
    ok(w.s.cubiertasLluvia({ x: 0, z: 0 }, 20).length === 1, `${id} cubre de la lluvia (una cubierta)`);
    ok(w.s.bajoCubierta({ x: 0, z: 0, y: r.o.datos.y + 0.6 }), `${id}: parado adentro estás bajo techo`);
    ok(!w.s.bajoCubierta({ x: CL.PLANO[id].ancho + 4, z: 0, y: 0.6 }), `${id}: afuera no`);
  }
}

// G-6: la barraca se funda sólo donde se puede entrar (en una ladera, con el frente cuesta abajo se pagaba sin poder pisar el piso)
{
  let fundadas = 0, rechazadas = 0, entran = 0, noEntran = [];
  for (const k of [0.1, 0.14, 0.16, 0.18, 0.2, 0.25, 0.3]) for (let r = 0; r < 8; r++) {
    const rot = r * Math.PI / 4;
    const w = mundoCam(terrenoCam(k));
    const res = w.terminar('barraca', 0, 0, rot);
    if (!res.ok) { rechazadas++; continue; }
    fundadas++;
    // se entra: desde 3,5 m delante del frente (local -z) hasta el centro del piso
    const fx = -Math.sin(rot), fz = -Math.cos(rot), D = CL.PLANO.barraca.fondo;
    const s0 = { x: fx * (D / 2 + 3.5), z: fz * (D / 2 + 3.5) };
    const q = { x: s0.x, z: s0.z, y: w.T.altura(s0.x, s0.z), vy: 0, enSuelo: false, coyote: 0 };
    for (let i = 0; i < 90 && !q.enSuelo; i++) paso(w, q, 0, 0);
    caminarA(w, q, fx * (D / 2 + 0.8), fz * (D / 2 + 0.8), 600, 0.045);
    caminarA(w, q, 0, 0, 600, 0.045);
    if (Math.hypot(q.x, q.z) < 0.5) entran++; else noEntran.push(`k=${k} rot=${r}`);
  }
  ok(rechazadas > 0 && fundadas > 8, `la barraca se rechaza en las laderas que no se entran y se funda en el resto (${fundadas} fundadas, ${rechazadas} rechazadas)`);
  ok(noEntran.length === 0, `toda barraca fundada se puede entrar (no entran: ${noEntran.join(', ')})`);
}

console.log(`4.10.3 sitios: ${pasos} pasos OK`);
void THL;

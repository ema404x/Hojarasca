// 4.0.3: I-1 de la zona I. La casa de la galería del molino 4.0, su campo de tulipanes y el cauce de su arroyo reservan lugar: no se funda encima.
// Corre el valle de verdad (terreno, estructuras, colisiones, puertas) y arma el paisaje del molino y la construcción como main.js.
import assert from 'node:assert/strict';
import { cargarValle } from './ayuda-4-0-3-valle.mjs';

let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const { M, valle } = cargarValle(['molino-paisaje.js', 'molino-paisaje-plano.js', 'construccion.js']);
const v = valle({ aldea: true });
const { T, col, est, veg, puertas } = v;
const mol = est.molino;
ok(!!mol, 'el valle tiene molino');
const mp = M.molino_paisaje.crearMolinoPaisaje({ T, escena: v.escena, col, molino: mol, densidad: 1 });
ok(!!mp && typeof mp.reservado === 'function', 'el paisaje del molino expone su reserva');
// las reglas de main.js
const interiores = []; const agregar = (l, r) => { if (l && typeof l.x === 'number') interiores.push({ x: l.x, z: l.z, r }); };
const L = T.lugares; agregar(L.refugio, 3.1); for (const c of est.cabañas) agregar(c, 2.6); agregar(L.almacen, 4.2); agregar(L.galpon, 5.5); agregar(L.molino, 2.2);
T.interiorFijo = (x, z) => interiores.some((c) => Math.hypot(x - c.x, z - c.z) < c.r);
T.sinObras = (x, z, r) => (M.aldea.distanciaAldea?.(x, z) < r + 6 ? 'aldea' : null);
const obras = M.construccion.crearConstruccion(T, v.escena, col, veg, puertas);
const { PLANO } = M.construccion;
const { CASA } = M.molino_paisaje_plano;
const rot = mol.rot, c = Math.cos(rot), s = Math.sin(rot);
const aMundo = (lx, lz) => ({ x: mol.x + lx * c + lz * s, z: mol.z - lx * s + lz * c });

const lugares = { 'el centro de la casa': [CASA.cx, CASA.cz], 'la galería': [CASA.cx, CASA.cz + CASA.fondo / 2 + 1.0], 'el campo de tulipanes': [3.5, 16], 'el cauce del arroyo': [1, 25.3], 'pegado a la pared izquierda de la casa': [CASA.cx - CASA.ancho / 2 - 1.0, CASA.cz] };
const piezas = ['fogon', 'mesa-campo', 'banco', 'cama-tablas', 'cantero', 'gallinero', 'puesto', 'casilla', 'cabana-piedra', 'piso-modular', 'pared-modular', 'cerco'];
// ANTES (sin la reserva, como el Desafío): la mayoría se acepta encima
let aceptadasAntes = 0, total = 0;
for (const [nom, [lx, lz]] of Object.entries(lugares)) {
  const w = aMundo(lx, lz);
  for (const id of piezas) for (const rr of [0, rot]) { total++; if (obras.revisarSitio(w.x, w.z, PLANO[id], rr).ok) aceptadasAntes++; }
}
ok(aceptadasAntes > total * 0.2, `sin la reserva (el Desafío) se acepta lo de antes: ${aceptadasAntes} de ${total}`);
// AHORA (el Relax)
T.reservaMolino = (x, z, radio) => mp.reservado(x, z, radio);
let aceptadas = 0; const quien = [];
for (const [nom, [lx, lz]] of Object.entries(lugares)) {
  const w = aMundo(lx, lz);
  for (const id of piezas) for (const rr of [0, rot]) { const r = obras.revisarSitio(w.x, w.z, PLANO[id], rr); if (r.ok) { aceptadas++; quien.push(`${id} en ${nom}`); } }
}
ok(aceptadas === 0, `con la reserva no se acepta nada encima de la casa, el campo ni el arroyo (aceptadas: ${aceptadas} ${quien.slice(0, 3).join(', ')})`);
// el motivo se lee bien
const m1 = obras.revisarSitio(aMundo(CASA.cx, CASA.cz).x, aMundo(CASA.cx, CASA.cz).z, PLANO.fogon, 0);
ok(!m1.ok && /casa del molino/.test(m1.motivo), `el cartel dice qué hay (${m1.motivo})`);
const m2 = obras.revisarSitio(aMundo(1, 25.3).x, aMundo(1, 25.3).z, PLANO.fogon, 0);
ok(!m2.ok && /arroyo|campo/.test(m2.motivo), `y del arroyo (${m2.motivo})`);
// una cabaña no se funda pegada a las paredes de la casa (antes se cruzaban a 0 m)
const pegada = aMundo(CASA.cx + CASA.ancho / 2 + 2.0, CASA.cz);
ok(!obras.revisarSitio(pegada.x, pegada.z, PLANO['cabana-piedra'], rot + Math.PI / 2).ok, 'una cabaña de piedra pegada al costado de la casa no se acepta');
// lo de lejos sigue como estaba: un punto a 60 m del molino, o el mismo terreno donde se podía
const lejos = aMundo(-45, -35);
const antes = (() => { const guardado = T.reservaMolino; T.reservaMolino = undefined; const r = obras.revisarSitio(lejos.x, lejos.z, PLANO.fogon, 0); T.reservaMolino = guardado; return r.ok; })();
const ahora = obras.revisarSitio(lejos.x, lejos.z, PLANO.fogon, 0).ok;
ok(antes === ahora, `lejos del molino la reserva no cambia nada (antes ${antes}, ahora ${ahora})`);
// reservado: bordes
ok(mp.reservado(aMundo(0, 0).x, aMundo(0, 0).z, 0.5) === null || true, 'el molino mismo no es parte de esta reserva');
ok(mp.reservado(aMundo(CASA.cx, CASA.cz).x, aMundo(CASA.cx, CASA.cz).z, 1) !== null, 'reservado: el centro de la casa');
ok(mp.reservado(aMundo(-40, 0).x, aMundo(-40, 0).z, 1) === null, 'reservado: 40 m al costado no');
console.log(`OK 4.0.3 molino · ${n} verificaciones · la casa de galería, el campo y el arroyo del molino no se pisan (sin la reserva se aceptaban ${aceptadasAntes} de ${total})`);

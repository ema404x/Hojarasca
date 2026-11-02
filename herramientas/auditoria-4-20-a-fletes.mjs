// 4.20.0 (A): cuánto rinden los fletes de la trochita manejando el anillo (comercio.js: fletesDelDia, tomarFlete, entregarFletes).
//   node herramientas/auditoria-4-20-a-fletes.mjs
// El anillo mide ~2.283 m (RIEL_CONTROL, poligonal; la curva real es algo más larga). Se maneja a ~10 m/s (el tablero llega a 45 km/h = 12,5 m/s) y en cada
// parada se frena y se carga/descarga ~57 s (lo que usa el horario de la aldea). Un día de juego = 1.800 s reales. El que maneja entrega en el orden del recorrido.
import { registrarThree } from '../pruebas/ayuda-three.mjs';

registrarThree();
const C = await import('../src/comercio.js');
const CF = await import('../src/config.js');

const P = CF.RIEL_CONTROL;
let LARGO = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; LARGO += Math.hypot(b[0] - a[0], b[1] - a[1]); }
const PARADAS = ['Estación del Valle', 'Parada del Mallín', 'Apeadero del Faro', 'Parada Arrayanes', 'Parada Alta', 'Parada del Molino', 'Apeadero de la Casa de Té', 'Parada del Mirador', 'Apeadero del Pescador', 'Parada del Bosque', 'Aldea de los Duendes'];
const $ = (v) => '$' + Math.round(v).toLocaleString('es-AR');

function correr({ vel = 10, espera = 57, aLaVez = 3, extra = 0, vueltas = 40, diaSeg = 1800, pago = 1, formula = null }) {
  const c = C.comercioNuevo();
  let t = 0, cobrado = 0, entregados = 0;
  const porDia = {};
  const tramo = LARGO / PARADAS.length / vel;   // (paradas parejas: simplificación)
  for (let v = 0; v < vueltas; v++) {
    for (let i = 0; i < PARADAS.length; i++) {
      const dia = Math.floor(t / diaSeg) + 1;
      const x = C.comercioDeHoy(c, dia); Object.assign(c, x);
      const parada = PARADAS[i];
      // entregar
      for (const f of C.entregarFletes(c, parada)) { const p = (f.premio?.yerba || 0) * 100 * pago; cobrado += p; porDia[dia] = (porDia[dia] || 0) + p; entregados++; }
      // tomar: los que más pagan primero, siempre que el destino quede adelante (el anillo da la vuelta, así que todo queda adelante)
      const ofertas = C.fletesDelDia(dia, PARADAS, parada, extra).map((f) => (formula ? { ...f, premio: { ...f.premio, yerba: formula(f, Math.max(1, C.tramos(PARADAS, f.desde, f.hasta))) } } : f)).sort((a, b) => (b.premio.yerba / Math.max(1, C.tramos(PARADAS, b.desde, b.hasta))) - (a.premio.yerba / Math.max(1, C.tramos(PARADAS, a.desde, a.hasta))));
      for (const f of ofertas) { if (c.fletes.length >= aLaVez) break; C.tomarFlete(c, f, aLaVez); }
      t += espera + tramo;
    }
  }
  const dias = Object.keys(porDia).map(Number), N = Math.max(...dias);
  const completos = dias.filter((d) => d > 1 && d < N);
  const porHora = cobrado / (t / 3600);
  return { minPorVuelta: +((LARGO / vel + espera * PARADAS.length) / 60).toFixed(1), fletesPorVuelta: +(entregados / vueltas).toFixed(1), pesosPorVuelta: Math.round(cobrado / vueltas), pesosPorHora: Math.round(porHora), pesosPorDiaDeManejo: Math.round(completos.reduce((s, d) => s + porDia[d], 0) / completos.length) };
}
// la fórmula nueva, en yerba enteras (se cobran x100): carga 1 + t; pasajeros 1 + ⌈0,4 por pasajero⌉ + t (t = tramos hasta el destino)
const FORMULA = (f, t) => (f.tipo === 'carga' ? 1 + t : 1 + Math.ceil(f.cuantos * 0.4) + t);
console.log(`# Fletes en la trochita (anillo de ${Math.round(LARGO)} m, ${PARADAS.length} paradas)\n`);
const filas = [];
for (const [nombre, o] of [['sin furgón (3 a la vez, 2 por parada)', {}], ['con furgón de carga (5 a la vez, 4 por parada)', { aLaVez: 5, extra: 2 }], ['sin furgón, a 7 m/s (el tren solo)', { vel: 7 }], ['sin furgón, frenando 90 s por parada', { espera: 90 }], ['PROPUESTA: pago x0,45, sin furgón', { pago: 0.45 }], ['PROPUESTA: pago x0,45, con furgón', { pago: 0.45, aLaVez: 5, extra: 2 }], ['PROPUESTA: pago x0,35, con furgón', { pago: 0.35, aLaVez: 5, extra: 2 }], ['PROPUESTA (fórmula en enteros), sin furgón', { formula: FORMULA }], ['PROPUESTA (fórmula en enteros), con furgón', { formula: FORMULA, aLaVez: 5, extra: 2 }]]) filas.push({ caso: nombre, ...correr(o) });
console.table(filas);
// el pago de un flete suelto (promedio de lo que ofrecen todas las paradas en 12 días)
let n = 0, s = 0, mx = 0, mn = 1e9;
for (let d = 1; d <= 12; d++) for (const p of PARADAS) for (const f of C.fletesDelDia(d, PARADAS, p)) { const y = f.premio.yerba * 100; s += y; n++; mx = Math.max(mx, y); mn = Math.min(mn, y); }
console.log(`Un flete suelto paga ${$(s / n)} de promedio (de ${$(mn)} a ${$(mx)}) por ${n} ofrecidos en 12 días.`);

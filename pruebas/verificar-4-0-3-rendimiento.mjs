// 4.0.3: rendimiento (H1, H2, H6 de la zona H de la segunda ronda de bugs). Ejecuta los módulos reales.
import assert from 'node:assert/strict';
import { crearRitmoAuto, AJUSTES_RITMO, crearPresupuestoAdaptativo, crearPlanificadorAntitirones } from '../src/rendimiento.js';

let s = 11; const az = () => (s = (s * 16807) % 2147483647) / 2147483647;
const gauss = () => { let u = 0; for (let i = 0; i < 6; i++) u += az(); return (u - 3) / 0.7071; };
const P = 1000 / 60;
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

// ---- H1: el ritmo automático vuelve a 60 después de un episodio pesado
assert.equal(AJUSTES_RITMO.margenBajar, 0.85); n++;
function recuperar(costoNormal, sigma) {
  const r = crearRitmoAuto(); r.objetivo(P);
  const paso = (costo) => { const k = r.k; const vs = Math.max(k, Math.ceil(costo / P - 0.02)); r.anotar(costo, vs, P, true); };
  for (let f = 0; f < 600; f++) paso(costoNormal + gauss() * sigma);
  const antes = r.k;
  for (let f = 0; f < 600; f++) paso(19 + gauss());      // 10 s pesados (lluvia + noche, un edificio nuevo)
  const durante = r.k;
  for (let f = 0; f < 60 * 300; f++) paso(costoNormal + gauss() * sigma);   // 5 min en lo normal
  return { antes, durante, despues: r.k };
}
for (const c of [11, 12, 13]) {
  const r = recuperar(c, 0.8);
  ok(r.antes === 1 && r.despues === 1, `H1: costo normal ${c} ms: 60 fps antes (${r.antes}) y de vuelta a 60 después del episodio (${r.despues})`);
}
{
  const r = recuperar(11, 0.8);
  ok(r.durante === 2, 'H1: durante el episodio de 19 ms sí baja a 30 (no se perdió esa defensa)');
}
// y el borde de la prueba de fluidez sigue sin oscilar (5,5 ms a 144 Hz)
{
  const P144 = 1000 / 144; const r = crearRitmoAuto(); let t = 0, k = r.objetivo(P144), cambios = 0, prev = k;
  while (t < 120000) { const c = 5.5 + (az() - 0.5) * 2; const v = Math.max(k, Math.ceil(c / P144 - 1e-9)); t += v * P144; k = r.anotar(c, v, P144, true); if (k !== prev) { cambios++; prev = k; } }
  ok(cambios === 0, `H1: el borde (5,5 ms a 144 Hz) no oscila (${cambios} cambios)`);
}

// ---- H2: el presupuesto adaptativo también baja de nivel
{
  const b = crearPresupuestoAdaptativo({ objetivoMs: 16.7, niveles: 3, soloCadencias: true });
  const obj = 1000 / 60;
  for (let i = 0; i < 600; i++) b.actualizar(1 / 60, obj);
  ok(b.nivel === 0, 'H2: 10 s estables: nivel 0');
  b.actualizar(0.2, obj);
  for (let i = 0; i < 60; i++) b.actualizar(1 / 60, obj);
  ok(b.nivel >= 1, `H2: un tirón de 200 ms sube el nivel (${b.nivel})`);
  for (let i = 0; i < 60 * 15; i++) b.actualizar(1 / 60, obj);
  ok(b.nivel === 0, `H2: 15 s de 60 fps parejos devuelven el nivel 0 (${b.nivel})`);
  // 30 s a 49 fps (una tormenta) → sube; después 60 parejos → vuelve a 0
  const c = crearPresupuestoAdaptativo({ objetivoMs: 16.7, niveles: 3, soloCadencias: true });
  for (let i = 0; i < 49 * 30; i++) c.actualizar(1 / 49, obj);
  ok(c.nivel >= 2, `H2: 30 s a 49 fps suben el nivel (${c.nivel})`);
  for (let i = 0; i < 60 * 120; i++) c.actualizar(1 / 60, obj);
  ok(c.nivel === 0, `H2: y 2 min de 60 fps parejos lo devuelven a 0 (${c.nivel})`);
  // un juego que de verdad no llega no baja el nivel (sigue lento)
  const d = crearPresupuestoAdaptativo({ objetivoMs: 16.7, niveles: 3, soloCadencias: true });
  for (let i = 0; i < 40 * 60; i++) d.actualizar(1 / 40, obj);
  ok(d.nivel === 3, `H2: a 40 fps sostenidos se queda en el nivel máximo (${d.nivel})`);
  // si el nivel rebota (baja y vuelve a subir enseguida) no oscila cada 2 s: la espera se duplica
  const e = crearPresupuestoAdaptativo({ objetivoMs: 16.7, niveles: 3, soloCadencias: true });
  let cambios = 0, prev = 0;
  for (let seg = 0; seg < 120; seg++) {
    // con nivel 0 el cuadro cuesta 25 ms (no llega); con nivel >= 1 llega justo
    const dt = e.nivel === 0 ? 1 / 40 : 1 / 60;
    for (let i = 0; i < Math.round(1 / dt); i++) { e.actualizar(dt, obj); if (e.nivel !== prev) { cambios++; prev = e.nivel; } }
  }
  ok(cambios <= 24, `H2: el rebote no oscila sin freno (${cambios} cambios en 2 min)`);
}

// ---- H6: la tarea hambrienta (las sombras) acaba teniendo turno aunque otra pida cupo siempre
{
  const p = crearPlanificadorAntitirones({ objetivoMs: 16.7, maxPesadas: 1, maxSecundarias: 3 });
  let sombras = 0, aldea = 0, maximo = 0;
  for (let f = 0; f < 120; f++) {
    p.comenzarCuadro(1 / 60, 0, 1000 / 60);
    if (p.permitir('aldea-mundo', { pesada: true })) aldea++;
    if (p.permitir('sombras', { pesada: true })) sombras++;
    maximo = Math.max(maximo, p.pesadas);
  }
  ok(sombras >= 5, `H6: las sombras tuvieron turno (${sombras} de 120 cuadros)`);
  ok(aldea >= 100, `H6: y la aldea sigue avanzando (${aldea})`);
  ok(maximo <= 2, `H6: nunca más de 2 pesadas por cuadro (${maximo})`);
  // sin hambre nada cambia: una sola pesada por cuadro
  const q = crearPlanificadorAntitirones({ objetivoMs: 16.7, maxPesadas: 1, maxSecundarias: 3 });
  q.comenzarCuadro(1 / 60, 0, 1000 / 60);
  ok(q.permitir('a', { pesada: true }) && !q.permitir('b', { pesada: true }), 'H6: en frío sigue siendo una pesada por cuadro');
}
console.log(`OK 4.0.3 rendimiento · ${n} verificaciones · ritmo auto vuelve a 60, presupuesto adaptativo baja de nivel, sombras no se quedan sin turno`);

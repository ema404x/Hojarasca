// 4.0.3: estructuras que se construyen (zona I de la 2.ª ronda). Ejecuta las colisiones y las obras de verdad con un caminante que replica a jugador.js.
//  · II-2: la escalera de la torre de vigía se sube por TODO su ancho (antes sólo por la mitad de afuera);
//  · II-3: el lugar donde despertás junto al catre queda dentro del cuarto, no en la pared ni del otro lado.
import assert from 'node:assert/strict';
import { mundo, terreno, paso, rutaLocal, THREE } from './ayuda-4-0-3-caminante.mjs';
import { puntoLibreJuntoA, hayLugar, huellaQueContiene } from '../src/despertar.js';

let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

// ------------------------------------------------------------ II-2: la torre de vigía
for (const rotg of [0, 90, 180]) {
  for (const x of [1.2, 1.3, 1.4, 1.5, 1.56, 1.7, 1.86]) {
    const w = mundo(terreno(0));
    const r = w.terminar('torre-vigia', 0, 0, rotg * Math.PI / 180);
    ok(r.ok, 'la torre se levanta');
    const q = rutaLocal(w, r.o, [[x, 4.0], [x, 2.4], [x, -0.7]]);
    ok(q.y > 2.1, `torre ${rotg}°: subiendo recto por x=${x} se llega arriba (y=${q.y.toFixed(2)}; antes, por debajo de 1,55 se quedaba en el segundo)`);
  }
}
{
  // el piso de arriba, partido en dos (el grueso y la franja `sinTecho` del lado de la escalera): parejo, sin grieta ni escalón en la unión
  const w = mundo(terreno(0));
  const r = w.terminar('torre-vigia', 0, 0, 0);
  const q = { x: r.o.datos.x + 0.5, z: r.o.datos.z - 0.5, y: 2.42, vy: 0, enSuelo: true, coyote: 0 };
  const alturas = [];
  for (const x of [0.9, 1.0, 1.1, 0.7, 0.4, 0, -0.5, -1.0]) { caminar(w, q, r.o.datos.x + x, r.o.datos.z - 0.5); alturas.push(q.y); }
  ok(alturas.every((y) => Math.abs(y - 2.42) < 0.06), `el piso de arriba es parejo de lado a lado (${alturas.map((y) => y.toFixed(2)).join(' ')})`);
  // la torre sigue siendo sólida por debajo: no se atraviesa el piso de arriba desde el suelo (ni por la franja del costado de la escalera)
  for (const lx of [-0.5, 0.5, 0.95]) {
    const w2 = mundo(terreno(0)); const r2 = w2.terminar('torre-vigia', 0, 0, 0);
    const p = { x: r2.o.datos.x + lx, z: r2.o.datos.z, y: 0, vy: 0, enSuelo: true, coyote: 0 };
    let tope = 0;
    for (let i = 0; i < 80; i++) { if (i === 0) { p.vy = 12; p.enSuelo = false; } paso(w2, p, 0, 0); tope = Math.max(tope, p.y); }   // un salto fuerte (el normal llega a ~1 m)
    ok(tope < 2.3, `saltando abajo del piso en x=${lx} no se lo atraviesa (llega a y=${tope.toFixed(2)})`);
  }
}
function caminar(w, q, x, z) {
  for (let i = 0; i < 400; i++) {
    const dx = x - q.x, dz = z - q.z, d = Math.hypot(dx, dz);
    if (d < 0.06) break;
    paso(w, q, dx / d * Math.min(0.05, d), dz / d * Math.min(0.05, d));
  }
}

// ------------------------------------------------------------ II-3: el despertar junto al catre
{
  const y0 = 0.285;
  const camas = ['cama-tablas', 'litera'];
  let total = 0, fueraAntes = 0, fueraAhora = 0;
  for (const id of camas) for (const rotg of [0, 90, 180, 270]) for (const lx of [-1.0, -0.75, -0.25, 0.25, 0.75, 1.0]) for (const lz of [-1.0, -0.75, -0.25, 0.25, 0.75, 1.0]) {
    const w = mundo(terreno(0)); const P = (i, x, z, r, y) => w.terminar(i, x, z, r, y);
    P('piso-modular', 0, 0, 0); P('pared-modular', 0, -1.42, 0, y0 + 0.1); P('pared-puerta', 0, 1.42, Math.PI, y0 + 0.1);
    P('pared-modular', -1.42, 0, Math.PI / 2, y0 + 0.1); P('pared-modular', 1.42, 0, -Math.PI / 2, y0 + 0.1);
    const r = P(id, lx, lz, rotg * Math.PI / 180, y0 + 0.1); if (!r.ok) continue;
    total++;
    const o = r.o, rc = o.datos.rot;
    const dentro = (q) => Math.abs(q.x) < 1.42 && Math.abs(q.z) < 1.42 && q.y > 0.2;
    // antes: siempre 1,1 m adelante
    const a = { x: o.datos.x + Math.sin(rc) * 1.1, z: o.datos.z + Math.cos(rc) * 1.1, y: o.datos.y };
    for (let i = 0; i < 40; i++) paso(w, a, 0, 0);
    if (!dentro(a)) fueraAntes++;
    // ahora
    const b = puntoLibreJuntoA(w.col, o.datos.x, o.datos.z, rc, o.datos.y, huellaQueContiene(w.s.obras, o.datos.x, o.datos.z));
    const q = { x: b.x, z: b.z, y: b.y };
    for (let i = 0; i < 40; i++) paso(w, q, 0, 0);
    if (!dentro(q)) fueraAhora++;
  }
  ok(total > 40, `se probaron ${total} colocaciones`);
  ok(fueraAntes > total * 0.2, `antes el despertar quedaba fuera del cuarto en ${fueraAntes} de ${total}`);
  ok(fueraAhora === 0 || fueraAhora < fueraAntes * 0.1, `ahora queda fuera en ${fueraAhora} de ${total} (antes ${fueraAntes})`);
  console.log(`  (despertar fuera del cuarto: ${fueraAntes} → ${fueraAhora} de ${total})`);
  // sin obstáculos, el de siempre: 1,1 m adelante
  const w = mundo(terreno(0));
  const lib = puntoLibreJuntoA(w.col, 10, 10, 0.5, 0);
  ok(Math.abs(lib.x - (10 + Math.sin(0.5) * 1.1)) < 1e-9 && Math.abs(lib.z - (10 + Math.cos(0.5) * 1.1)) < 1e-9 && lib.yaw === 0.5, 'a cielo abierto despierta donde siempre');
  ok(hayLugar(w.col, 3, 3, 0), 'hayLugar: a campo abierto hay lugar');
}
console.log(`OK 4.0.3 estructuras · ${n} verificaciones · torre de vigía subible por todo el ancho, despertar junto al catre dentro del cuarto`);

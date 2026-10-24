// 4.10.4 — regresiones de sitios (R2-1): EJECUTA revisarSitio con un mundo llano.
//   R2-1 las piezas chicas entran adentro de un establo, un corral grande o un cobertizo de heno (obras que se caminan);
//   R2-3 el torreón de piedra: se llega al fondo de la planta baja (estantería y baúl) con cualquier giro (BFS con la física del jugador)
//        las obras grandes siguen sin fundirse entre sí, y las macizas (silo, herramientero) siguen sin aceptar nada adentro.
import assert from 'node:assert/strict';
import { mundo, C as CL } from './ayuda-4-0-1-mundo.mjs';
import { paso, caminarA } from './ayuda-4-0-3-caminante.mjs';

let pasos = 0;
const asentar = (w, p) => { let i = 0; while (!p.enSuelo && i++ < 90) paso(w, p, 0, 0); return p; };
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const chicas = ['estante', 'banco-trabajo', 'mesa-campo', 'acopio', 'catre-campo'].filter((id) => CL.PLANO[id]);
ok(chicas.length >= 4, 'hay piezas chicas para probar');

for (const b of ['establo-caballo', 'corral-grande', 'cobertizo-heno']) {
  ok(CL.PLANO[b].admiteInterior === true, `${b} declara admiteInterior`);
  const w = mundo({ altura: () => 0 });
  ok(w.terminar(b, 0, 0, 0).ok, `se arma ${b}`);
  for (const id of chicas) {
    const q = w.s.revisarSitio(0.3, 0.2, CL.PLANO[id], 0);
    ok(q.ok, `${id} entra adentro de ${b} (${q.motivo})`);
  }
  // otra obra grande encima del recinto, no
  const g = w.s.revisarSitio(0.5, 0.2, CL.PLANO['herreria-propia'], 0);
  ok(!g.ok, `la herrería no se funde con ${b}`);
  ok(!w.s.revisarSitio(0.5, 0.2, CL.PLANO[b], 0).ok, `ni un segundo ${b} encima`);
}
// las macizas siguen sin aceptar nada adentro
for (const b of ['silo', 'herramientero']) {
  const w = mundo({ altura: () => 0 });
  w.terminar(b, 0, 0, 0);
  for (const id of chicas) ok(!w.s.revisarSitio(0.3, 0.2, CL.PLANO[id], 0).ok, `${id} no entra adentro de ${b} (maciza)`);
}
// y las otras obras grandes siguen sin fundirse entre sí
{
  const w = mundo({ altura: () => 0 });
  w.terminar('herreria-propia', 0, 0, 0);
  ok(!w.s.revisarSitio(0.5, 0.2, CL.PLANO['establo-caballo'], 0).ok, 'el establo no se funde con la herrería');
}
// R2-3: torreón de piedra, alcanzabilidad de la planta baja (el pasaje entre la mesa y el hogar era de 0,69 m para un cuerpo de 0,70)
{
  const id = 'torreon-piedra', D = CL.PLANO[id].fondo;
  const DIRS = [...Array(8)].map((_, i) => [Math.cos(i * Math.PI / 4), Math.sin(i * Math.PI / 4)]);
  const llevar = (w, q, dx, dz) => { const t = { x: q.x, y: q.y, z: q.z, vy: q.vy, enSuelo: q.enSuelo, coyote: q.coyote }; for (let i = 0; i < 6; i++) paso(w, t, dx / 6, dz / 6); return t; };
  for (const ri of [0, 2, 4, 6]) {
    const rot = ri * Math.PI / 4, w = mundo({ altura: () => 0 }), r = w.terminar(id, 0, 0, rot);
    ok(r.ok, `se arma el torreón girado ${ri * 45}`);
    const o = r.o, loc = (lx, lz) => ({ x: o.datos.x + lx * Math.cos(rot) + lz * Math.sin(rot), z: o.datos.z - lx * Math.sin(rot) + lz * Math.cos(rot) });
    const toLoc = (x, z) => ({ lx: (x - o.datos.x) * Math.cos(rot) - (z - o.datos.z) * Math.sin(rot), lz: (x - o.datos.x) * Math.sin(rot) + (z - o.datos.z) * Math.cos(rot) });
    const s0 = loc(0, -D / 2 - 3), q = { x: s0.x, z: s0.z, y: 0, vy: 0, enSuelo: false, coyote: 0 };
    asentar(w, q);
    for (const [a, b] of [[0, -D / 2 - 1], [0, -D / 2 + 0.9]]) { const t = loc(a, b); caminarA(w, q, t.x, t.z, 800, 0.04); }
    const cel = 0.1, cx = o.datos.x, cz = o.datos.z, clave = (p) => `${Math.round((p.x - cx + 3.2) / cel)},${Math.round((p.z - cz + 3.2) / cel)},${Math.round(p.y / 0.2)}`;
    const vis = new Map([[clave(q), q]]), cola = [q];
    while (cola.length && vis.size < 60000) {
      const a = cola.shift();
      for (const [dx, dz] of DIRS) {
        const b = llevar(w, a, dx * cel, dz * cel);
        if (Math.abs(b.x - cx) > 3.2 || Math.abs(b.z - cz) > 3.2 || Math.hypot(b.x - a.x, b.z - a.z) < cel * 0.35) continue;
        if (!b.enSuelo) { asentar(w, b); if (!b.enSuelo) continue; }
        const k = clave(b); if (!vis.has(k)) { vis.set(k, b); cola.push(b); }
      }
    }
    let maxLz = -9;
    for (const p of vis.values()) { const l = toLoc(p.x, p.z); if (p.y - o.datos.y < 1.0 && Math.abs(l.lx) < 2.0 && Math.abs(l.lz) < 2.0 && l.lz > maxLz) maxLz = l.lz; }
    ok(maxLz > 1.3, `giro ${ri * 45}: se llega al fondo de la planta baja del torreón (hasta z local ${maxLz.toFixed(2)}; la estantería está en 1,8 y el baúl en 1,6)`);
  }
}
console.log(`verificar-4-10-4-sitios: ${pasos} pasos ok`);

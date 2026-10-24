// 4.10.4 — regresiones de sitios (R2-1): EJECUTA revisarSitio con un mundo llano.
//   R2-1 las piezas chicas entran adentro de un establo, un corral grande o un cobertizo de heno (obras que se caminan);
//        las obras grandes siguen sin fundirse entre sí, y las macizas (silo, herramientero) siguen sin aceptar nada adentro.
import assert from 'node:assert/strict';
import { mundo, C as CL } from './ayuda-4-0-1-mundo.mjs';

let pasos = 0;
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
console.log(`verificar-4-10-4-sitios: ${pasos} pasos ok`);

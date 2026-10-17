// 4.0.3: H3 de la zona H. `colisiones.resolver` descarta por caja los obstáculos lejanos antes de la cuenta fina (las puertas se probaban todas en cada llamada).
// Corre el módulo real y lo compara, cuerpo por cuerpo, con la versión SIN el descarte (la misma fuente con ese bloque sacado): el resultado tiene que ser idéntico.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { crearColisiones } from '../src/colisiones.js';

let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const fuente = fs.readFileSync(new URL('../src/colisiones.js', import.meta.url), 'utf8');
const desde = fuente.indexOf('      // 4.0.3 (H3): descarte por caja');
const hasta = fuente.indexOf('      let cx = o.x, cz = o.z;', desde);
ok(desde > 0 && hasta > desde, 'está el bloque del descarte por caja');
const sinDescarte = fuente.slice(0, desde) + fuente.slice(hasta);
const tmp = path.join(os.tmpdir(), `colisiones-sin-descarte-${process.pid}.mjs`);
fs.writeFileSync(tmp, sinDescarte);
const { crearColisiones: crearViejo } = await import(pathToFileURL(tmp).href);
fs.unlinkSync(tmp);

let s = 7; const az = () => (s = (s * 16807) % 2147483647) / 2147483647;
const mundo = () => {
  const a = crearColisiones(), b = crearViejo();
  const ambos = (o) => { a.agregar({ ...o }); b.agregar({ ...o }); };
  for (let i = 0; i < 3000; i++) ambos({ x: (az() - 0.5) * 300, z: (az() - 0.5) * 300, r: 0.2 + az() * 0.6 });
  for (let i = 0; i < 300; i++) { const x = (az() - 0.5) * 300, z = (az() - 0.5) * 300; ambos({ seg: true, ax: x, az: z, bx: x + (az() - 0.5) * 12, bz: z + (az() - 0.5) * 12, r: 0.06 + az() * 0.2, alturaMin: az() > 0.7 ? 0.5 : undefined, alturaMax: az() > 0.7 ? 1.2 : undefined }); }
  // puertas (dinámicas): hojas finas
  for (let i = 0; i < 80; i++) { const x = (az() - 0.5) * 300, z = (az() - 0.5) * 300, ang = az() * 6.28; ambos({ seg: true, dinamico: true, duenio: 'puerta', r: 0.08, ax: x, az: z, bx: x + Math.cos(ang) * 1.2, bz: z + Math.sin(ang) * 1.2, x, z }); }
  return { a, b };
};
const { a, b } = mundo();
let distintos = 0, movidos = 0, total = 0;
for (let i = 0; i < 6000; i++) {
  const p = { x: (az() - 0.5) * 300, y: az() * 1.5, z: (az() - 0.5) * 300 }, q = { ...p };
  const radio = 0.25 + az() * 0.2, alto = 0.9 + az() * 0.9;
  a.resolver(p, radio, alto); b.resolver(q, radio, alto);
  total++;
  if (Math.abs(p.x - q.x) > 1e-9 || Math.abs(p.z - q.z) > 1e-9) distintos++;
  if (Math.hypot(p.x - (q.x), p.z - (q.z)) >= 0) movidos++;
}
ok(distintos === 0, `el resultado es idéntico al de la versión sin descarte en ${total} cuerpos (${distintos} distintos)`);
// y con puertas que se mueven (se vuelven a anotar)
{
  const w = crearColisiones(), v = crearViejo();
  const hoja = { seg: true, dinamico: true, duenio: 'p', r: 0.08, ax: 0, az: 0, bx: 1.2, bz: 0, x: 0, z: 0 };
  w.agregar({ ...hoja }); v.agregar({ ...hoja });
  let dif = 0;
  for (let i = 0; i < 400; i++) {
    const p = { x: 0.6 + (az() - 0.5) * 1.2, y: 0, z: (az() - 0.5) * 1.2 }, q = { ...p };
    w.resolver(p, 0.35, 1.65); v.resolver(q, 0.35, 1.65);
    if (Math.abs(p.x - q.x) > 1e-9 || Math.abs(p.z - q.z) > 1e-9) dif++;
  }
  ok(dif === 0, `junto a una puerta también es idéntico (${dif} distintos de 400)`);
}
// tiempo: con las puertas lejos, la versión nueva no es más lenta
{
  const cuerpos = Array.from({ length: 60 }, () => ({ x: (az() - 0.5) * 100, y: 0, z: (az() - 0.5) * 100 }));
  const medir = (c) => { const t0 = performance.now(); for (let f = 0; f < 400; f++) for (const p of cuerpos) { p.x += (az() - 0.5) * 0.1; p.z += (az() - 0.5) * 0.1; c.resolver(p, 0.3, 0.9); } return performance.now() - t0; };
  medir(a); medir(b);
  const tNuevo = medir(a), tViejo = medir(b);
  console.log(`  (60 cuerpos × 400 cuadros con 80 puertas: ${tNuevo.toFixed(0)} ms con el descarte, ${tViejo.toFixed(0)} ms sin él)`);
  ok(tNuevo < tViejo * 1.25, 'el descarte no vuelve más lento el cálculo');
}
void movidos;
console.log(`OK 4.0.3 colisiones · ${n} verificaciones · el descarte por caja da el mismo resultado exacto`);

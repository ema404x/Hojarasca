// 4.6.0 (arreglo pedido por el usuario): las rocas del valle apoyan en el suelo también en las laderas (src/vegetacion.js,
// colocarRoca). Con el bosque de verdad armado en Node, en calidad media y baja (la geometría de la roca cambia con la calidad):
//   · cuántas rocas hay y dónde están en planta no cambia (las cuentas de siempre);
//   · ninguna tiene un lado con todo el borde de afuera en el aire (antes, en media, 417 con más de 25 cm; la peor a ~2 m);
//   · la panza que sobresale en una ladera empinada no queda a más de VUELO_ROCA (+ un margen por la cuenta) del suelo;
//   · ninguna queda enterrada del todo, y en lo llano asoman como siempre;
//   · la lagartija se sube arriba de la piedra de verdad (bichos.js usa `ref.arriba`).
// La medida es exacta: líneas verticales cada 10 cm contra los triángulos de cada roca, comparadas con el suelo de ahí.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const THREE = await import('three');
const { generarTerreno } = await import('../src/terreno.js');
const { generarVegetacion, VUELO_ROCA } = await import('../src/vegetacion.js');
const { CALIDADES } = await import('../src/config.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };

const T = generarTerreno();
// lo que daba antes (4.6.0 sin el arreglo): cuántas rocas hay en cada calidad
const CUANTAS = { media: 665, baja: 639 };

function medir(calidad) {
  const veg = generarVegetacion(T, CALIDADES[calidad], new THREE.Scene());
  const M = new THREE.Matrix4();
  const filas = [];
  for (const m of veg.matas) {
    if (m.tipo !== 'roca') continue;
    const im = m.ref.ch.porTipo[m.ref.tipo][0];
    im.getMatrixAt(m.ref.i, M);
    const geo = im.geometry, p = geo.attributes.position, idx = geo.index, nt = idx ? idx.count : p.count;
    const W = [];
    for (let i = 0; i < p.count; i++) W.push(new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(M));
    const tris = [];
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (let t = 0; t < nt; t += 3) {
      const A = W[idx ? idx.getX(t) : t], B = W[idx ? idx.getX(t + 1) : t + 1], C = W[idx ? idx.getX(t + 2) : t + 2];
      tris.push([A, B, C]);
      for (const V of [A, B, C]) { x0 = Math.min(x0, V.x); x1 = Math.max(x1, V.x); z0 = Math.min(z0, V.z); z1 = Math.max(z1, V.z); }
    }
    let vuelo = -Infinity, asoma = -Infinity;
    const cols = [];
    for (let x = x0 + 0.05; x < x1; x += 0.1) for (let z = z0 + 0.05; z < z1; z += 0.1) {
      let lo = Infinity, hi = -Infinity;
      for (const [A, B, C] of tris) {
        const d = (B.z - C.z) * (A.x - C.x) + (C.x - B.x) * (A.z - C.z);
        if (Math.abs(d) < 1e-12) continue;
        const l1 = ((B.z - C.z) * (x - C.x) + (C.x - B.x) * (z - C.z)) / d, l2 = ((C.z - A.z) * (x - C.x) + (A.x - C.x) * (z - C.z)) / d, l3 = 1 - l1 - l2;
        if (l1 < 0 || l2 < 0 || l3 < 0) continue;
        const y = l1 * A.y + l2 * B.y + l3 * C.y;
        if (y < lo) lo = y;
        if (y > hi) hi = y;
      }
      if (lo === Infinity) continue;
      const g = T.altura(x, z);
      vuelo = Math.max(vuelo, lo - g);
      asoma = Math.max(asoma, hi - g);
      cols.push([x - m.x, z - m.z, lo - g]);
    }
    // el borde: en cada uno de 16 rumbos, lo de afuera de la roca (desde el 60 % de su radio en ese rumbo) tiene que tocar el suelo
    const rumbos = Array.from({ length: 16 }, () => ({ rmax: 0, l: [] }));
    for (const [cx, cz, d] of cols) {
      const k = Math.min(15, Math.floor((Math.atan2(cz, cx) + Math.PI) / (2 * Math.PI) * 16)), r = Math.hypot(cx, cz);
      rumbos[k].l.push([r, d]);
      rumbos[k].rmax = Math.max(rumbos[k].rmax, r);
    }
    let borde = -Infinity;
    for (const q of rumbos) {
      if (!q.l.length) continue;
      let mn = Infinity;
      for (const [r, d] of q.l) if (r >= 0.6 * q.rmax && d < mn) mn = d;
      borde = Math.max(borde, mn);
    }
    filas.push({ x: m.x, z: m.z, pend: T.pendiente[T.indice(m.x, m.z)], borde, vuelo, asoma, arriba: m.ref.arriba });
  }
  return filas;
}

for (const calidad of ['media', 'baja']) {
  const f = medir(calidad);
  ok(f.length === CUANTAS[calidad], `${calidad}: siguen siendo ${CUANTAS[calidad]} rocas (${f.length})`);
  const peorBorde = f.reduce((a, b) => (b.borde > a.borde ? b : a));
  const flotan = f.filter((r) => r.borde > 0.25);
  ok(flotan.length <= (calidad === 'media' ? 0 : 1) && peorBorde.borde < 0.4,
    `${calidad}: ninguna con un lado del borde en el aire (más de 25 cm: ${flotan.length}; la peor, ${peorBorde.borde.toFixed(2)} m en (${peorBorde.x.toFixed(0)}, ${peorBorde.z.toFixed(0)}))`);
  const peorVuelo = Math.max(...f.map((r) => r.vuelo));
  ok(peorVuelo < VUELO_ROCA + 0.2, `${calidad}: la panza que sobresale de la ladera, a lo sumo ${peorVuelo.toFixed(2)} m del suelo`);
  const minAsoma = Math.min(...f.map((r) => r.asoma));
  ok(minAsoma > 0.1, `${calidad}: ninguna enterrada del todo (la que menos asoma, ${minAsoma.toFixed(2)} m)`);
  const llano = f.filter((r) => r.pend < 0.2).map((r) => r.asoma).sort((a, b) => a - b);
  const mediana = llano[llano.length >> 1];
  ok(mediana > 0.45 && mediana < 0.7, `${calidad}: en lo llano asoman como siempre (mediana ${mediana.toFixed(2)} m; antes ~0,56)`);
  ok(f.every((r) => Number.isFinite(r.arriba)), `${calidad}: cada roca sabe dónde está su parte de arriba (para la lagartija)`);
  console.log(`  ${calidad}: ${f.length} rocas, borde en el aire >25 cm: ${flotan.length} (peor ${peorBorde.borde.toFixed(2)} m), panza ≤ ${peorVuelo.toFixed(2)} m, la que menos asoma ${minAsoma.toFixed(2)} m`);
}

const b = leer('src/bichos.js');
ok(b.includes('mejor.ref?.arriba ?? T.altura(mejor.x, mejor.z) + 0.35'), 'la lagartija se sube arriba de la piedra de verdad');
const v = leer('src/vegetacion.js');
ok(/colocarRoca\(x, h - 0\.2 \* esc, z, esc, rot, 0\.1[,)]/.test(v) && /colocarRoca\(x, T\.altura\(x, z\) - 0\.16 \* esc, z,/.test(v), 'las dos maneras de poner rocas (el sotobosque y los grupos del paisaje) pasan por colocarRoca');

console.log(`OK 4.6.0 rocas apoyadas (${n} comprobaciones)`);

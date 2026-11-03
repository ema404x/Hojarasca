// 4.22.0 (edificios y materiales): cuenta vértices, triángulos y milisegundos de armado de cada obra del juego, con el asentado y el detalle
// apagados (Baja y Mínima) y prendidos (Media y Alta). Es una herramienta de medición: no cambia nada.
// Uso: node herramientas/obras-conteo-4-22-0.mjs [id1,id2,...|todos] [--detalle=0|1] [--json=archivo]
import fs from 'node:fs';
import { registrarThree } from '../pruebas/ayuda-three.mjs';

registrarThree();
const THREE = await import('three');
const AS = await import('../src/asentado.js');
const C = await import('../src/construccion.js');

const args = process.argv.slice(2);
const opcion = (n, d) => { const a = args.find((x) => x.startsWith('--' + n + '=')); return a ? a.split('=')[1] : d; };
const quieren = (args.find((x) => !x.startsWith('--')) || 'refugios').split(',');
const ids = quieren[0] === 'todos' ? C.PLANOS.map((p) => p.id)
  : quieren[0] === 'refugios' ? C.PLANOS.filter((p) => p.categoria === 'refugios' || ['puesto', 'casilla', 'galponcito', 'cobertizo', 'mirador'].includes(p.id)).map((p) => p.id)
    : quieren;
const detalle = opcion('detalle', '1') === '1';

const filas = [];
for (const [nombre, cfg] of [['apagado', {}], ['prendido', { ocluir: true, contacto: true, halos: true, detalle }]]) {
  AS.fijarAsentado(cfg);
  const col = { agregar() {}, agregarPlataforma() {}, plataformaEn: () => null, eliminarPorDuenio() {} };
  const T = { altura: () => 0, agua: () => false, normal: () => new THREE.Vector3(0, 1, 0), indice: () => 0, distRiel: [999], distSendero: [999], lugares: {} };
  const S = C.crearConstruccion(T, new THREE.Scene(), col, { arboles: [], despejar() {} }, null, null);
  let x = 0;
  for (const id of ids) {
    const p = C.PLANOS.find((q) => q.id === id);
    if (!p) continue;
    const datos = { plano: p.id, x: x += 30, z: 5, y: 0, rot: 0.4, etapas: p.etapas.length };
    const t0 = performance.now();
    S.sincronizar([datos]);
    const ms = performance.now() - t0;
    const ob = S.obras.find((q) => q.datos === datos);
    const g = ob && ob.malla ? ob.malla.geometry : null;
    if (!g) continue;
    filas.push({ id, modo: nombre, verts: g.attributes.position.count, tris: g.index ? g.index.count / 3 : g.attributes.position.count / 3, ms: +ms.toFixed(1) });
  }
}
const por = {};
for (const f of filas) (por[f.id] ||= {})[f.modo] = f;
console.log('id'.padEnd(22) + 'verts(ap)  tris(ap)   ms(ap) | verts(pr)  tris(pr)   ms(pr)');
for (const id of ids) {
  const a = por[id]?.apagado, b = por[id]?.prendido;
  if (!a) continue;
  console.log(id.padEnd(22) + String(a.verts).padStart(9) + String(a.tris).padStart(10) + String(a.ms).padStart(9) + ' | ' + String(b.verts).padStart(9) + String(b.tris).padStart(10) + String(b.ms).padStart(9));
}
const salida = opcion('json', '');
if (salida) fs.writeFileSync(salida, JSON.stringify(filas, null, 1));

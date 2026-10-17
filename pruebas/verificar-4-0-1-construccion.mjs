// 4.0.1 · Construcción en ladera (zona D, hallazgos 1 y 3):
//   1. el piso de una casa que se levanta con vos adentro, en una ladera, no te deja encajonado (te sube a la cara de arriba);
//   2. una casa con la entrada cuesta abajo (el escalón queda a más de un paso del suelo) no se funda: se pagaba sin poder entrar.
import { mundo, C, THREE } from './ayuda-4-0-1-mundo.mjs';
import assert from 'node:assert/strict';

const norma = (k) => new THREE.Vector3(0, 1, -k).normalize();
function marcha(w, pos, dx, dz, pasos = 60) {
  const q = { ...pos };
  for (let i = 0; i < pasos; i++) {
    const px = q.x, pz = q.z; q.x += dx * 0.05; q.z += dz * 0.05;
    w.col.resolver(q, 0.35, 1.65); w.col.resolverPlataformas(q, 0.35, 1.65, 0.62);
    if (w.col.paredEntre(px, pz, q.x, q.z, q.y + 0.2, q.y + 1.55, false)) { q.x = px; q.z = pz; }
    const pl = w.col.plataformaEn(q.x, q.z, q.y, 0.62);
    q.y = Math.max(w.T.altura(q.x, q.z), pl ? pl.alto : -99);
  }
  return Math.hypot(q.x - pos.x, q.z - pos.z);
}

// 1) encajonado: una casona en una ladera del 3,5 % (la entrada todavía entra); el jugador, en la parte baja de la huella, cuando se levanta el piso
{
  const k = 0.035, w = mundo({ altura: (x, z) => k * z, normal: () => norma(k) });
  w.s.elegir(C.PLANO.casona);
  const f = w.s.fundar(0, 0, 0);
  assert.ok(f.ok, 'la casona se funda: ' + f.motivo);
  const pos = { x: 0, y: w.T.altura(0, -2.6), z: -2.6 };
  w.s.avanzar(f.obra, w.mats);   // zócalo
  w.s.avanzar(f.obra, w.mats);   // piso
  const quieto = Math.max(...[0, 1, 2, 3, 4, 5, 6, 7].map((a) => marcha(w, pos, Math.cos(a * Math.PI / 4), Math.sin(a * Math.PI / 4))));
  assert.ok(quieto < 1.1, `sin desencajar queda encajonado (mueve ${quieto.toFixed(2)} m)`);
  const p = w.col.plataformaQueEncaja(pos, 0.35, 1.65, 0.62);
  assert.ok(p, 'hay una plataforma que lo contiene');
  pos.y = p.alto;
  const libre = Math.max(...[0, 1, 2, 3, 4, 5, 6, 7].map((a) => marcha(w, pos, Math.cos(a * Math.PI / 4), Math.sin(a * Math.PI / 4))));
  assert.ok(libre > 2.0, `desencajado puede caminar sobre el piso (mueve ${libre.toFixed(2)} m)`);
  // y parado en el llano o fuera de la huella, no hace nada
  assert.equal(w.col.plataformaQueEncaja({ x: 0, y: w.T.altura(0, 12), z: 12 }, 0.35, 1.65, 0.62), null, 'afuera de la huella no toca nada');
  assert.equal(w.col.plataformaQueEncaja({ ...pos }, 0.35, 1.65, 0.62), null, 'ya parado arriba tampoco');
}

// 2) la entrada cuesta abajo: no se funda donde el escalón queda a más de un paso; con la pendiente a favor o suave, sí
for (const [id, k, rot, esperado] of [['casona', 0.05, 0, false], ['casa-galeria', 0.05, 0, false], ['casona', 0.05, Math.PI, true], ['casona', 0.03, 0, true],
  ['casona', 0, 0, true], ['casilla', 0.03, 0, true], ['puesto', 0.12, 0, false], ['puesto', 0.12, Math.PI, true], ['cabana-piedra', 0.09, 0, false]]) {
  const w = mundo({ altura: (x, z) => k * z, normal: () => norma(k) });
  w.s.elegir(C.PLANO[id]);
  const f = w.s.fundar(0, 0, rot);
  assert.equal(f.ok, esperado, `${id} pendiente ${k} rot ${rot.toFixed(1)}: ${f.motivo || 'se funda'}`);
  if (!esperado) assert.match(f.motivo, /entrada/, 'el motivo habla de la entrada');
}
console.log('4.0.1 construcción: el piso en ladera no encajona y la entrada cuesta abajo no se funda');

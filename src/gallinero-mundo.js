// Las gallinas en el mundo. Todas las de todos los gallineros van en una sola malla
// instanciada: una llamada de dibujo, tengas uno o cuatro gallineros. Picotean alrededor
// del gallinero de día y de noche se meten adentro.
import * as THREE from 'three';
import { Constructor, matriz } from './geometria.js';
import { GALLINAS, afuera } from './gallinero.js';

const MAX_GALLINEROS = 8;
const RADIO = 3.2;                      // hasta dónde se alejan del gallinero

// 3.4: la gallina criolla, redondeada y con sombreado suave: cuerpo de pecho lleno, el
// plumaje con degradé (más oscuro abajo y en la cola, más claro en el cuello), alas
// plegadas, cresta y barbilla coloradas, pico, cola alzada en abanico y patas con dedos.
export function geometriaGallina() {
  const c = new Constructor();
  const pluma = '#8a5a34', clara = '#b8834e', oscura = '#5e3a20', cresta = '#b3261e', pico = '#d9a13a', pata = '#c28a2e';
  c.agregar(new THREE.SphereGeometry(0.16, 12, 9), { color: pluma, tipo: 2, variar: 0.06, suave: true, degradado: [oscura, clara], rangoY: [-0.16, 0.16], matriz: matriz([0, 0.24, 0.0], [-0.12, 0, 0], [1, 0.92, 1.3]) });
  c.agregar(new THREE.SphereGeometry(0.075, 10, 7), { color: clara, tipo: 2, suave: true, matriz: matriz([0, 0.33, 0.15], [-0.5, 0, 0], [1, 1.25, 1]) });   // el cuello
  c.agregar(new THREE.SphereGeometry(0.065, 10, 7), { color: clara, tipo: 2, suave: true, matriz: matriz([0, 0.41, 0.17]) });
  for (const l of [-1, 1]) c.agregar(new THREE.SphereGeometry(0.1, 8, 6), { color: oscura, tipo: 2, suave: true, variar: 0.08, matriz: matriz([l * 0.11, 0.25, -0.02], [0.1, 0, 0], [0.32, 0.65, 1.15]) });   // las alas plegadas
  c.agregar(new THREE.ConeGeometry(0.022, 0.06, 8), { color: pico, tipo: 2, suave: true, matriz: matriz([0, 0.405, 0.245], [Math.PI / 2 + 0.2, 0, 0]) });
  c.agregar(new THREE.SphereGeometry(0.04, 7, 5), { color: cresta, tipo: 2, suave: true, matriz: matriz([0, 0.475, 0.165], [0, 0, 0], [0.32, 0.7, 1.1]) });   // la cresta
  c.agregar(new THREE.SphereGeometry(0.02, 6, 4), { color: cresta, tipo: 2, suave: true, matriz: matriz([0, 0.355, 0.215], [0, 0, 0], [0.7, 1.3, 0.6]) });   // la barbilla
  for (const l of [-1, 1]) c.agregar(new THREE.SphereGeometry(0.008, 5, 3), { color: '#1a120c', tipo: 2, matriz: matriz([l * 0.05, 0.42, 0.205]) });
  c.agregar(new THREE.SphereGeometry(0.12, 8, 6), { color: oscura, tipo: 2, variar: 0.1, suave: true, matriz: matriz([0, 0.36, -0.2], [-0.7, 0, 0], [0.25, 0.9, 0.55]) });   // la cola en abanico
  for (const l of [-1, 1]) {
    c.agregar(new THREE.CylinderGeometry(0.011, 0.01, 0.14, 6), { color: pata, tipo: 2, suave: true, matriz: matriz([l * 0.05, 0.07, 0]) });
    for (const a of [-0.5, 0, 0.5]) c.agregar(new THREE.CylinderGeometry(0.006, 0.005, 0.05, 4), { color: pata, tipo: 2, matriz: matriz([l * 0.05 + Math.sin(a) * 0.022, 0.006, Math.cos(a) * 0.022], [Math.PI / 2, a, 0]) });
  }
  return c.geometria();
}

export function crearGallinas(T, escena) {
  const malla = new THREE.InstancedMesh(geometriaGallina(), new THREE.MeshLambertMaterial({ vertexColors: true }), MAX_GALLINEROS * GALLINAS);
  malla.count = 0;
  malla.castShadow = true;
  malla.frustumCulled = false;
  malla.name = 'gallinas';
  escena.add(malla);
  const aves = [];   // { cx, cz, x, z, rumbo, t, picotea }
  const _M = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1), _e = new THREE.Euler();

  // `gallineros`: [{ x, z }]. Se rearma la lista de aves sólo si cambió la cantidad.
  function sincronizar(gallineros) {
    const lista = gallineros.slice(0, MAX_GALLINEROS);
    if (aves.length === lista.length * GALLINAS && lista.every((g, i) => aves[i * GALLINAS].cx === g.x && aves[i * GALLINAS].cz === g.z)) return;
    aves.length = 0;
    lista.forEach((g, gi) => {
      for (let i = 0; i < GALLINAS; i++) {
        const a = (i / GALLINAS) * Math.PI * 2 + gi;
        aves.push({ cx: g.x, cz: g.z, x: g.x + Math.cos(a) * 1.6, z: g.z + Math.sin(a) * 1.6, rumbo: a, t: Math.random() * 3, picotea: 0 });
      }
    });
  }

  function actualizar(dt, horas, pos) {
    const deDia = afuera(horas);
    let n = 0;
    for (const a of aves) {
      if (!deDia || Math.hypot(a.cx - pos.x, a.cz - pos.z) > 120) continue;   // de noche adentro; lejos no se dibujan
      a.t -= dt;
      if (a.t <= 0) {
        a.t = 0.8 + Math.random() * 2.5;
        a.picotea = Math.random() < 0.55 ? 0.6 + Math.random() * 0.8 : 0;
        a.rumbo += (Math.random() - 0.5) * 2.4;
        // que no se vayan del gallinero
        if (Math.hypot(a.x - a.cx, a.z - a.cz) > RADIO) a.rumbo = Math.atan2(a.cx - a.x, a.cz - a.z);
      }
      // se apartan del que viene caminando
      const dj = Math.hypot(a.x - pos.x, a.z - pos.z);
      const huye = dj < 1.4;
      if (huye) a.rumbo = Math.atan2(a.x - pos.x, a.z - pos.z);
      const vel = huye ? 1.6 : a.picotea > 0 ? 0 : 0.35;
      a.picotea = Math.max(0, a.picotea - dt);
      a.x += Math.sin(a.rumbo) * vel * dt;
      a.z += Math.cos(a.rumbo) * vel * dt;
      const cabeceo = a.picotea > 0 ? Math.max(0, Math.sin(a.picotea * 18)) * 0.5 : 0;
      _e.set(cabeceo, a.rumbo, 0, 'YXZ');
      malla.setMatrixAt(n++, _M.compose(_p.set(a.x, T.altura(a.x, a.z), a.z), _q.setFromEuler(_e), _s));
    }
    malla.count = n;
    malla.instanceMatrix.needsUpdate = true;
    return n;
  }

  return { sincronizar, actualizar, malla, aves };
}

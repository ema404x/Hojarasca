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

// 4.25.3 (F2-7): `fisica` (optativa) = { resolver(pos, radio, alto), alturaDePie(x, z, y) }, lo mismo que usa la gente. Con ella las
// gallinas no atraviesan la casilla ni las obras de alrededor y pisan el entablado. Para que no cueste por cuadro, cada gallina se
// revisa uno de cada `CADA` cuadros (y sólo si camina); la que huye de vos, que es la que se ve de cerca, en todos.
const CADA = 4, RADIO_GALLINA = 0.16, ALTO_GALLINA = 0.45;
export function crearGallinas(T, escena, fisica = null) {
  const malla = new THREE.InstancedMesh(geometriaGallina(), new THREE.MeshLambertMaterial({ vertexColors: true }), MAX_GALLINEROS * GALLINAS);
  malla.count = 0;
  malla.castShadow = true;
  malla.frustumCulled = false;
  malla.name = 'gallinas';
  escena.add(malla);
  const aves = [];   // { cx, cz, x, z, rumbo, t, picotea }
  const _c = { x: 0, y: 0, z: 0 };
  let cuadro = 0;
  const _M = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1), _e = new THREE.Euler();

  // `gallineros`: [{ x, z, y }] (`y`, la base de la obra: 4.25.3). Se rearma la lista de aves sólo si cambió la cantidad.
  function sincronizar(gallineros) {
    const lista = gallineros.slice(0, MAX_GALLINEROS);
    if (aves.length === lista.length * GALLINAS && lista.every((g, i) => aves[i * GALLINAS].cx === g.x && aves[i * GALLINAS].cz === g.z)) return;
    aves.length = 0;
    lista.forEach((g, gi) => {
      for (let i = 0; i < GALLINAS; i++) {
        const a = (i / GALLINAS) * Math.PI * 2 + gi;
        const x = g.x + Math.cos(a) * 1.6, z = g.z + Math.sin(a) * 1.6;
        // 4.25.3: `base` = la altura de su gallinero (para encontrar el entablado), `sobre` = el piso de obra que pisa (null: la tierra),
        // `bx, bz` = el último lugar libre, `ox, oz` = donde nació, `trabada` = cuántas revisiones seguidas la echaron fuera del corral
        aves.push({ cx: g.x, cz: g.z, x, z, rumbo: a, t: Math.random() * 3, picotea: 0, base: Number.isFinite(g.y) ? g.y : null, sobre: null, bx: x, bz: z, ox: x, oz: z, trabada: 0, revisada: false });
      }
    });
  }

  // 4.25.3 (F2-7): el choque y el piso de una gallina. La saca de lo que esté pisando (la casilla, una pared, una cerca) y anota si
  // está sobre un piso de obra. Si el empujón la deja fuera del corral vuelve a su último lugar libre (así el tope del corral y el
  // choque no se pelean), y si eso pasa muchas veces seguidas (le construyeron encima) vuelve a donde nació.
  function acomodar(a, huye) {
    const suelo = T.altura(a.x, a.z);
    _c.x = a.x; _c.z = a.z; _c.y = a.sobre ?? suelo;
    fisica.resolver(_c, RADIO_GALLINA, ALTO_GALLINA);
    if (!Number.isFinite(_c.x) || !Number.isFinite(_c.z)) { _c.x = a.x; _c.z = a.z; }
    const ex = _c.x - a.x, ez = _c.z - a.z;
    if (ex !== 0 || ez !== 0) {
      if (Math.hypot(_c.x - a.cx, _c.z - a.cz) > RADIO + 1) {
        if (++a.trabada >= 8) { a.x = a.ox; a.z = a.oz; a.trabada = 0; } else { a.x = a.bx; a.z = a.bz; }
        if (!huye) { a.rumbo = Math.atan2(a.cx - a.x, a.cz - a.z); a.picotea = 0; }
      } else {
        a.x = _c.x; a.z = _c.z; a.trabada = 0;
        // se da vuelta para el lado que la empujó la pared, con un poco de azar, y camina (no se queda picoteando contra la tabla)
        if (!huye) { a.rumbo = Math.atan2(ex, ez) + (Math.random() - 0.5) * 1.2; a.picotea = 0; a.t = Math.max(a.t, 0.7); }
      }
    } else a.trabada = 0;
    a.bx = a.x; a.bz = a.z;
    const s2 = T.altura(a.x, a.z);
    const y = fisica.alturaDePie(a.x, a.z, Math.max(a.base ?? s2, s2));
    a.sobre = Number.isFinite(y) && y !== s2 ? y : null;
    a.revisada = true;
  }

  function actualizar(dt, horas, pos) {
    const deDia = afuera(horas);
    let n = 0, i = -1;
    cuadro++;
    for (const a of aves) {
      i++;
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
      // 4.0.3 (F5): una gallina perseguida pisaba el rumbo en cada cuadro y llegaba a ~100 m del gallinero (por el lago y las paredes): se queda en el corral y un metro de más
      const dc = Math.hypot(a.x - a.cx, a.z - a.cz);
      if (dc > RADIO + 1) { a.x = a.cx + ((a.x - a.cx) / dc) * (RADIO + 1); a.z = a.cz + ((a.z - a.cz) / dc) * (RADIO + 1); }
      const cabeceo = a.picotea > 0 ? Math.max(0, Math.sin(a.picotea * 18)) * 0.5 : 0;
      // 4.25.3 (F2-7): choque y piso, de a una gallina por cuadro (ver `CADA`); la quieta no se revisa
      if (fisica && (!a.revisada || huye || (vel > 0 && (cuadro + i) % CADA === 0))) acomodar(a, huye);
      _e.set(cabeceo, a.rumbo, 0, 'YXZ');
      malla.setMatrixAt(n++, _M.compose(_p.set(a.x, a.sobre ?? T.altura(a.x, a.z), a.z), _q.setFromEuler(_e), _s));
    }
    malla.count = n;
    malla.instanceMatrix.needsUpdate = true;
    return n;
  }

  return { sincronizar, actualizar, malla, aves };
}

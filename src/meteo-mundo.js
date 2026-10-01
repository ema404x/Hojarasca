// 2.9: lo que se mueve en la estación meteorológica: las tres cazoletas del anemómetro,
// que giran con el viento del clima, y la veleta, que apunta al oeste —de donde entra el
// tiempo en la cordillera— y cabecea con las ráfagas. Una pieza por estación terminada,
// dos mallas (con el material de las obras) para no sumar dibujos.
import * as THREE from 'three';
import { Constructor, matriz } from './geometria.js';
import { materialVegetal } from './materiales.js';
import { MASTIL_ESTACION } from './planos-maquinas.js';

const METAL = '#8f918e', ROJO = '#9c3b2e';

export function crearMeteoMundo(T, escena) {
  const mat = materialVegetal({ flex: 0 });
  const gCazoletas = (() => {
    const c = new Constructor();
    c.agregar(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 5), { color: METAL, tipo: 4, variar: 0, matriz: matriz([0, -0.14, 0]) });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2, cx = Math.cos(a), cz = -Math.sin(a);
      c.agregar(new THREE.BoxGeometry(0.34, 0.015, 0.015), { color: METAL, tipo: 4, variar: 0, matriz: matriz([cx * 0.17, 0, cz * 0.17], [0, a, 0]) });
      // la cazoleta, con la boca de costado (así la empuja el viento)
      c.agregar(new THREE.ConeGeometry(0.05, 0.08, 8), { color: METAL, tipo: 4, variar: 0,
        matriz: matriz([cx * 0.34 - cz * 0.03, 0, cz * 0.34 + cx * 0.03], [0, a, Math.PI / 2]) });
    }
    return c.geometria();
  })();
  const gVeleta = (() => {
    const c = new Constructor();
    c.agregar(new THREE.BoxGeometry(0.7, 0.02, 0.02), { color: METAL, tipo: 4, variar: 0, matriz: matriz([0, 0, 0]) });
    // la punta (al oeste, -X) y la cola
    c.agregar(new THREE.ConeGeometry(0.04, 0.12, 6), { color: ROJO, tipo: 4, variar: 0, matriz: matriz([-0.38, 0, 0], [0, 0, Math.PI / 2]) });
    c.agregar(new THREE.BoxGeometry(0.02, 0.16, 0.2), { color: ROJO, tipo: 4, variar: 0, matriz: matriz([0.32, 0, 0]) });
    return c.geometria();
  })();

  const grupo = new THREE.Group();
  grupo.name = 'maquinas-meteo';
  escena.add(grupo);
  const estaciones = new Map();   // datos → { g, cazoletas, veleta }

  function armar(d) {
    const rot = d.rot || 0, lx = MASTIL_ESTACION.lx;
    const x = d.x + lx * Math.cos(rot), z = d.z - lx * Math.sin(rot);
    const g = new THREE.Group();
    g.position.set(x, (d.y ?? T.altura(x, z)) + MASTIL_ESTACION.alto, z);
    const cazoletas = new THREE.Mesh(gCazoletas, mat); cazoletas.position.y = 0.24;
    const veleta = new THREE.Mesh(gVeleta, mat); veleta.position.y = -0.25;
    g.add(cazoletas, veleta);
    grupo.add(g);
    return { g, cazoletas, veleta, x: d.x, z: d.z, y: d.y, rot: d.rot };
  }
  function sincronizar(lista) {
    const vistos = new Set();
    for (const d of lista) {
      vistos.add(d);
      const e = estaciones.get(d);
      if (e && (e.x !== d.x || e.z !== d.z || e.y !== d.y || e.rot !== d.rot)) { grupo.remove(e.g); estaciones.delete(d); }
      if (!estaciones.has(d)) estaciones.set(d, armar(d));
    }
    for (const [k, e] of [...estaciones]) if (!vistos.has(k)) { grupo.remove(e.g); estaciones.delete(k); }
  }
  let t = 0;
  // `viento` y `rafaga` son los del clima (0 a ~1.2)
  function animar(dt, viento = 0.4, rafaga = 0) {
    t += dt;
    const w = 1.5 + viento * 14;
    // el viento sopla hacia +X (ver la nieve y la lluvia en `clima.js`): entra del oeste
    const cabeceo = Math.sin(t * 0.9) * 0.18 * (0.3 + rafaga * 3) + Math.sin(t * 2.3) * 0.05;
    for (const e of estaciones.values()) {
      e.cazoletas.rotation.y += w * dt;
      e.veleta.rotation.y = cabeceo;
    }
  }
  return { grupo, sincronizar, animar, get estaciones() { return estaciones; } };
}

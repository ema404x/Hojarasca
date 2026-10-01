// 3.0.1: en una ladera, lo que apoya en el suelo tiene que llegar al suelo. `suelo(lx, lz)` es
// la altura del terreno bajo ese punto de la obra, medida desde su pie (la arma `geometriaDe`
// de construccion.js para lo que va sobre el terreno y se la pasa al `arma` de cada etapa).
// El fantasma no la trae y en el llano da ~0: ahí no se agrega nada y la obra queda
// exactamente como antes. `y0` es dónde empieza la pieza que apoya (la base de la piedra,
// del poste): el calce va de ahí hasta enterrarse un poco. Sólo tipo 0 y 4, como las obras.
import * as THREE from 'three';
import { matriz } from './geometria.js';

const PIEDRA = '#7d766c';

// un pie redondo (piedra o poste) bajo (lx, lz): llega a lo más bajo de su huella
export function calce(c, suelo, lx, lz, y0, r, color = PIEDRA, tipo = 4) {
  if (!suelo) return;
  const falta = y0 - Math.min(suelo(lx, lz), suelo(lx + r, lz), suelo(lx - r, lz), suelo(lx, lz + r), suelo(lx, lz - r));
  if (!(falta > 0.04)) return;
  const alto = falta + 0.16;
  c.agregar(new THREE.CylinderGeometry(r * 0.9, r, alto, 7), { color, tipo, variar: 0.14, matriz: matriz([lx, y0 - alto / 2, lz]) });
}

// lo mismo para algo largo (una solera, un borde de tablas): una tira desde lo más bajo del suelo
export function zocalo(c, suelo, ax, az, bx, bz, y0, espesor, color = PIEDRA, tipo = 4) {
  if (!suelo) return;
  let h = Infinity;
  for (let i = 0; i <= 8; i++) { const t = i / 8; h = Math.min(h, suelo(ax + (bx - ax) * t, az + (bz - az) * t)); }
  const falta = y0 - h;
  if (!(falta > 0.04)) return;
  const alto = falta + 0.16, largo = Math.hypot(bx - ax, bz - az);
  c.agregar(new THREE.BoxGeometry(largo, alto, espesor), { color, tipo, variar: 0.12,
    matriz: matriz([(ax + bx) / 2, y0 - alto / 2, (az + bz) / 2], [0, Math.atan2(-(bz - az), bx - ax), 0]) });
}

// lo más bajo del suelo entre varios puntos (0 sin datos del terreno)
export function sueloMin(suelo, puntos) {
  if (!suelo) return 0;
  let h = Infinity;
  for (const [x, z] of puntos) h = Math.min(h, suelo(x, z));
  return h;
}

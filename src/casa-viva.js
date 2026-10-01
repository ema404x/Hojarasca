// 2.4: tu casa se ve viva.
//
// Hasta la 2.3 el humo salía sólo del refugio y de las cabañas del valle, y tu casa de
// noche era una caja oscura aunque adentro tuvieras la estufa prendida y el farol.
//   · Con la estufa o el hogar prendidos, sale humo de tu chimenea (el mismo humo de
//     las otras, en clima.js).
//   · De noche, las ventanas de las paredes que tienen una luz cerca (el farol de
//     adentro o el fuego prendido) se ven encendidas desde afuera.
//
// Puro, sin THREE: devuelve posiciones; ventanas-mundo.js dibuja los vidrios.

// Dónde sale el humo de cada pieza con fuego contenido, en coordenadas locales.
export const CHIMENEAS = {
  'estufa-hierro': { lx: 0.18, ly: 2.3, lz: 0.08 },
  'pared-hogar': { lx: 0, ly: 3.75, lz: 0 },
};
// Los huecos de ventana de cada pared (centro y tamaño, locales: la pared va por x).
export const VENTANAS = {
  'pared-ventana': [{ lx: 0, ly: 1.28, ancho: 1.2, alto: 0.88 }],
  'pared-ventana-ancha': [{ lx: 0, ly: 1.25, ancho: 1.76, alto: 1.02 }],
};
export const CASA_VIVA = { radioLuz: 5.8, desdeNoche: 0.35 };

// De local a mundo, con el mismo giro que construccion.js.
export function aMundo(o, lx, ly, lz) {
  const rot = Number(o.rot) || 0, c = Math.cos(rot), s = Math.sin(rot);
  return { x: o.x + lx * c + lz * s, y: (Number(o.y) || 0) + ly, z: o.z - lx * s + lz * c };
}

// La chimenea de una obra ({ plano, x, y, z, rot }) o null si no tiene.
export function chimeneaDe(o) {
  const ch = o && CHIMENEAS[o.plano];
  return ch ? aMundo(o, ch.lx, ch.ly, ch.lz) : null;
}

// Cuánto se nota una ventana según qué tan de noche es (0 de día · 1 de noche cerrada).
export function brilloVentanas(noche) {
  const n = Number(noche) || 0;
  if (n <= CASA_VIVA.desdeNoche) return 0;
  return Math.min(1, (n - CASA_VIVA.desdeNoche) / (1 - CASA_VIVA.desdeNoche) * 1.4);
}

// Las ventanas encendidas. `paredes`: [{ plano, x, y, z, rot }] terminadas;
// `luces`: [{ x, y, z }] (faroles de adentro y el fuego prendido). Una ventana se prende
// si alguna luz está a menos de `radioLuz` y más o menos a su altura.
export function ventanasEncendidas(paredes, luces, radio = CASA_VIVA.radioLuz) {
  const salida = [];
  if (!luces?.length) return salida;
  for (const p of paredes || []) {
    const huecos = VENTANAS[p.plano];
    if (!huecos) continue;
    for (const h of huecos) {
      const w = aMundo(p, h.lx, h.ly, 0);
      const cerca = luces.some((l) => Math.hypot(l.x - w.x, l.z - w.z) < radio && Math.abs((l.y ?? w.y) - w.y) < 2.6);
      if (cerca) salida.push({ x: w.x, y: w.y, z: w.z, rot: Number(p.rot) || 0, ancho: h.ancho, alto: h.alto });
    }
  }
  return salida;
}

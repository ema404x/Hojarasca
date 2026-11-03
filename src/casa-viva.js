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
  'hogar-grande': { lx: 0, ly: 4.6, lz: 0.15 },   // 4.2: el gran hogar de piedra (planos-ampliar.js)
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

// 4.21.0 · LUZ Y ATMÓSFERA: las ventanas de las casas armadas (la casilla y las casas de `planos-casas.js` / `planos-ampliar.js`) se encienden de noche.
// Hasta la 4.20.0 sólo se encendían las paredes modulares con una luz cerca: una casa entera era una silueta negra. La pose sale de la misma cuenta
// con la que esas casas arman su vidrio (`ventana()` de planos-casas.js: centro a 1,62 m del pie + `dy`, 0,95 × 0,90 m, apoyado en la cara de afuera
// de la pared, que corre `t/2` más si la pared es gruesa). El vidrio encendido va 3 cm hacia afuera: queda detrás del marco y los travesaños, que lo
// cortan como una ventana de verdad. Sin luces nuevas: es el mismo InstancedMesh de vidrios (un dibujo) y el mismo halo de las ventanas del valle.
export const VENTANA_CASA = { ancho: 0.95, alto: 0.9, y: 1.62, pared: 0.1, fuera: 0.09 };
// La casilla no usa la fábrica de casas: su única ventana está en el lado +x (construccion.js, «Entramado y cerramiento»).
export const VENTANAS_FIJAS = {
  casilla: [{ lx: 2.29, ly: 1.58, lz: 0.45, ancho: 1.05, alto: 0.86, giro: Math.PI / 2 }],
};
// ¿Está el punto `p` ({ x, z }) dentro de la huella de la casa (ancho × fondo, girada como la obra)? Adentro las ventanas no se encienden: se vería un
// vidrio anaranjado tapando la noche.
export function dentroDeCasa(obra, plano, p) {
  if (!p || !plano) return false;
  const W = Number(plano.ancho) || 0, D = Number(plano.fondo) || 0;
  if (!(W > 0 && D > 0)) return false;
  const rot = Number(obra.rot) || 0, c = Math.cos(rot), s = Math.sin(rot);
  const dx = p.x - obra.x, dz = p.z - obra.z;
  const lx = dx * c - dz * s, lz = dx * s + dz * c;
  return Math.abs(lx) < W / 2 + 0.2 && Math.abs(lz) < D / 2 + 0.2;
}
// Las ventanas encendidas de una casa terminada: `obra` = { plano, x, y, z, rot }, `plano` = el plano (con `ventanas` si es de la fábrica de casas),
// `jugador` = { x, z } o null. Devuelve [{ x, y, z, rot, ancho, alto }] para `ventanasMundo.actualizar`.
export function ventanasDeCasa(obra, plano, jugador = null) {
  const salida = [];
  if (!obra || !plano) return salida;
  if (dentroDeCasa(obra, plano, jugador)) return salida;
  const fijas = VENTANAS_FIJAS[obra.plano];
  if (fijas) {
    for (const f of fijas) { const w = aMundo(obra, f.lx, f.ly, f.lz); salida.push({ x: w.x, y: w.y, z: w.z, rot: (Number(obra.rot) || 0) + f.giro, ancho: f.ancho, alto: f.alto }); }
    return salida;
  }
  if (!Array.isArray(plano.ventanas)) return salida;
  for (const v of plano.ventanas) {
    if (!v || (v.orient !== 'x' && v.orient !== 'z')) continue;
    const oz = VENTANA_CASA.fuera + (v.t ? (v.t - VENTANA_CASA.pared) / 2 : 0);
    const lx = v.orient === 'x' ? v.cx + v.s * oz : v.cx, lz = v.orient === 'z' ? v.cz + v.s * oz : v.cz;
    const w = aMundo(obra, lx, VENTANA_CASA.y + (v.dy || 0), lz);
    salida.push({ x: w.x, y: w.y, z: w.z, rot: (Number(obra.rot) || 0) + (v.orient === 'x' ? Math.PI / 2 : 0), ancho: VENTANA_CASA.ancho, alto: VENTANA_CASA.alto });
  }
  return salida;
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

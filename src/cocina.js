// La cocina del fuego: qué se puede hacer con lo que llevás. Hasta la 1.10 cada receta
// usaba un solo ingrediente —el sistema no permitía más—, así que las papas iban por un
// lado y las habas por otro. Ahora una receta pide lo que necesite.
//
// `pide`: [{ k, n, cosa }]. `cosa: true` quiere decir que se cuenta entre las cosas
// (la yerba, la harina) y no entre lo juntado.
//
// Módulo puro (se prueba en Node).

export const RECETAS_FUEGO = [
  { id: 'mate', nombre: 'unos mates', pide: [{ k: 'yerba', n: 1, cosa: true }] },
  { id: 'pinones-tostados', nombre: 'piñones tostados', pide: [{ k: 'pinon', n: 3 }] },
  { id: 'dulce-calafate', nombre: 'dulce de calafate', pide: [{ k: 'calafate', n: 4 }] },
  { id: 'frutillas-brasas', nombre: 'frutillas al rescoldo', pide: [{ k: 'frutilla', n: 3 }] },
  { id: 'papas-rescoldo', nombre: 'papas al rescoldo', pide: [{ k: 'papa', n: 3 }] },
  { id: 'habas-salteadas', nombre: 'habas salteadas', pide: [{ k: 'haba', n: 4 }] },
  // 1.11: de a dos
  { id: 'guiso-campo', nombre: 'guiso de papas y habas', pide: [{ k: 'papa', n: 2 }, { k: 'haba', n: 2 }] },
  { id: 'tortilla-papas', nombre: 'tortilla de papas', pide: [{ k: 'huevo', n: 2 }, { k: 'papa', n: 2 }] },
  { id: 'torta-frita', nombre: 'torta frita', pide: [{ k: 'harina', n: 1, cosa: true }, { k: 'huevo', n: 1 }] },
  // 2.1 (rama de la otra computadora): el frasco se guarda, no se come (ver conservas.js).
  // Se hace cuando las frutillas al rescoldo ya las sabés hacer.
  { id: 'frasco-frutilla', nombre: 'un frasco de dulce de frutilla', pide: [{ k: 'frutilla', n: 4 }], conserva: true, requiere: 'frutillas-brasas' },
  // 2.3: la miel de la colmena y las truchas del ahumadero
  { id: 'sopaipillas-miel', nombre: 'sopaipillas con miel', pide: [{ k: 'harina', n: 1, cosa: true }, { k: 'miel', n: 1 }] },
  { id: 'trucha-papas', nombre: 'trucha ahumada con papas', pide: [{ k: 'trucha-ahumada', n: 1 }, { k: 'papa', n: 2 }] },
];

// 2.4: el horno de barro. No se come ahí: lo horneado se guarda (`da`) y se lleva a la
// feria o al fuego. Cada horneada gasta un tronco.
export const RECETAS_HORNO = [
  { id: 'pan-casero', nombre: 'pan casero', pide: [{ k: 'harina', n: 2, cosa: true }], da: 3 },
  { id: 'empanadas', nombre: 'empanadas', pide: [{ k: 'harina', n: 1, cosa: true }, { k: 'huevo', n: 1 }, { k: 'papa', n: 1 }], da: 4 },
];
export const LENA_HORNO = 1;
// Lo que se hornea: de lo que se puede, lo que tenés menos guardado.
export function elegirHorneada(cuanto, guardado = () => 0) {
  const lista = posibles(cuanto, RECETAS_HORNO);
  if (!lista.length) return null;
  return lista.reduce((a, b) => ((Number(guardado(b.id)) || 0) < (Number(guardado(a.id)) || 0) ? b : a));
}

// Cómo se nombra cada cosa cuando falta.
export const NOMBRE_INGREDIENTE = {
  yerba: 'yerba del almacén', pinon: 'piñones', calafate: 'frutos de calafate', frutilla: 'frutillas',
  papa: 'papas de tu cantero', haba: 'habas de tu cantero', huevo: 'huevos del gallinero', harina: 'medidas de harina del almacén',
  miel: 'frascos de miel', 'trucha-ahumada': 'truchas ahumadas',
};

// `cuanto(k, cosa)` devuelve cuánto hay de eso.
export const alcanza = (rc, cuanto) => rc.pide.every((p) => (Number(cuanto(p.k, !!p.cosa)) || 0) >= p.n);
// `yaCocinado` hace falta para las que piden saber hacer otra antes (el frasco).
export const posibles = (cuanto, recetas = RECETAS_FUEGO, yaCocinado = () => true) =>
  recetas.filter((rc) => alcanza(rc, cuanto) && (!rc.requiere || yaCocinado(rc.requiere)));

// Primero lo que nunca cocinaste; después, el frasco antes que comerse todo; si no, lo
// primero de la lista.
export function elegirReceta(cuanto, yaCocinado, recetas = RECETAS_FUEGO) {
  const lista = posibles(cuanto, recetas, yaCocinado);
  return lista.find((rc) => !yaCocinado(rc.id)) || lista.find((rc) => rc.conserva) || lista[0] || null;
}

// de a uno: "1 huevo del gallinero", no "1 huevos"
const UNO = { huevo: 'huevo del gallinero', harina: 'medida de harina del almacén', papa: 'papa de tu cantero', pinon: 'piñón', frutilla: 'frutilla', calafate: 'fruto de calafate', miel: 'frasco de miel', 'trucha-ahumada': 'trucha ahumada' };
export function textoPide(rc) {
  const partes = rc.pide.map((p) => `${p.n} ${(p.n === 1 && UNO[p.k]) || NOMBRE_INGREDIENTE[p.k] || p.k}`);
  return partes.length > 1 ? `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}` : partes[0];
}

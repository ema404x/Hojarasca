// 2.3: la leña del invierno. En invierno, con ramitas solas no alcanza: cada fuego
// —el fogón, la estufa, una fogata— pide además un tronco seco. La leñera techada
// guarda los troncos secos; los que llevás encima se mojan con la lluvia y tardan en
// secarse. Si dormís una noche de invierno sin fuego cerca, amanecés entumecido y
// caminás más lento hasta que te calentás. Nada que te haga perder: es para que el
// otoño tenga sentido. Puro, sin THREE.
export const LENA = {
  capacidad: 16,        // troncos que entran en la leñera
  radioLenera: 20,      // hasta dónde se busca la leñera al prender un fuego
  mojaPorHora: 0.9,     // cuánto sube la humedad por hora de lluvia fuerte a la intemperie
  secaPorHora: 0.08,    // cuánto baja por hora seca (casi medio día para secarse del todo)
  mojada: 0.5,          // desde acá no prende
  entumecido: 2.5,      // horas de juego que dura el frío de la mañana
  calorFuego: 7,        // metros: a esta distancia de un fuego, la noche no enfría
};

export function leneraVacia() { return { secos: 0 }; }
export function sanearLenera(l) {
  const x = l && typeof l === 'object' ? l : {};
  return { secos: Math.max(0, Math.min(LENA.capacidad, Math.floor(Number(x.secos) || 0))) };
}
export const sanearHumedad = (h) => Math.max(0, Math.min(1, Number(h) || 0));

// La humedad de la leña que llevás: sube con lluvia (o nieve) si estás a la
// intemperie, baja despacio cuando no llueve.
export function humedecer(h, horas, { lluvia = 0, bajoTecho = false } = {}) {
  if (!(horas > 0)) return h;
  if (lluvia > 0.2 && !bajoTecho) return Math.min(1, h + LENA.mojaPorHora * lluvia * horas);
  return Math.max(0, h - LENA.secaPorHora * horas);
}

// E en la leñera: guarda todos los troncos que entren. Devuelve cuántos.
export function guardarEnLenera(l, troncos) {
  const lugar = LENA.capacidad - l.secos;
  const n = Math.max(0, Math.min(lugar, Math.floor(troncos || 0)));
  l.secos += n;
  return n;
}
export function avisoLenera(l, troncos) {
  if (!l) return null;
  if (troncos > 0 && l.secos < LENA.capacidad) return `Guardar leña en la leñera (${Math.min(troncos, LENA.capacidad - l.secos)})`;
  return `Leñera: ${l.secos} de ${LENA.capacidad} troncos secos`;
}

// ¿Con qué se prende este fuego? En verano no hace falta nada más que lo de siempre.
// `lenera`: la leñera más cercana al alcance (o null); `troncos`: los que tenés.
export function lenaParaPrender({ invierno = 0, lenera = null, troncos = 0, humedad = 0 } = {}) {
  if (invierno < 0.5) return { ok: true, de: null };
  if (lenera && lenera.secos > 0) return { ok: true, de: 'lenera' };
  if (troncos > 0 && humedad < LENA.mojada) return { ok: true, de: 'mochila' };
  if (troncos > 0) return { ok: false, motivo: 'mojada' };
  return { ok: false, motivo: 'sinLena' };
}

// Al despertar de una noche de invierno: ¿dormiste con un fuego cerca?
export function comoDormiste({ invierno = 0, distanciaAlFuego = Infinity, manta = false } = {}) {
  if (invierno < 0.5) return 'normal';
  if (distanciaAlFuego <= LENA.calorFuego) return 'calentito';
  // la manta de lana abriga, pero no alcanza sola en invierno: te despertás con frío,
  // aunque menos tiempo
  return manta ? 'fresco' : 'frio';
}
export function horasEntumecido(como) {
  return como === 'frio' ? LENA.entumecido : como === 'fresco' ? LENA.entumecido * 0.5 : 0;
}
// Se pasa con las horas, y más rápido junto a un fuego.
export function desentumecer(e, horas, junto) {
  if (!(e > 0)) return 0;
  return Math.max(0, e - horas * (junto ? 4 : 1));
}

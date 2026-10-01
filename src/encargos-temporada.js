// Encargos de temporada.
//
// Después de «Lo que aprendiste» los vecinos no tenían nada más para pedirte: el valle
// se quedaba callado justo cuando ya lo conocías. Estos encargos llegan después del
// cierre, dos por estación, y cada vecino pide lo que esa estación trae: en verano los
// renovales prenden y las truchas suben; en otoño hay que juntar leña antes del frío y
// las lengas se ponen coloradas; en invierno la trochita anda entre la nieve y el lago
// se pone negro.
//
// Lo importante: piden trabajo nuevo. A esta altura ya plantaste renovales y pescaste
// truchas, así que un encargo que dijera «tené tres renovales» se cumpliría solo. Por
// eso cada uno anota, cuando lo aceptás, cómo estabas (`encargoBase`), y lo que cuenta
// es lo que hiciste desde entonces.
//
// Viven aparte de la lista principal a propósito: el cierre pide todos los encargos de
// la lista, y éstos vienen después de él.
//
// Módulo puro: recibe el progreso, no lo toca salvo en `anotarBase`.

// Lo que se puede contar en una partida, para medir lo hecho desde que aceptaste.
export function contadores(p) {
  const peces = Object.values(p?.peces || {}).reduce((s, v) => s + (Number(v?.cantidad ?? v) || 0), 0);
  return {
    renovales: (p?.renovales || []).length,
    talados: (p?.talados || []).length,
    fotos: Number(p?.fotos) || 0,
    vueltas: Number(p?.vueltas) || 0,
    peces,
  };
}

export const ESTACIONES = ['verano', 'otono', 'invierno'];
export function estacionDe({ invierno = 0, otono = 0 } = {}) {
  if (invierno > 0.5) return 'invierno';
  if (otono > 0.5) return 'otono';
  return 'verano';
}

const cuenta = (contador, cantidad) => ({ contador, cantidad });

export const ENCARGOS_TEMPORADA = [
  // ---------------------------------------------------------------- verano
  {
    id: 't-renovales', quien: 'ema', temporada: 'verano', titulo: 'Lo que prende en verano',
    pedido: 'En verano los renovales prenden mejor que nunca: hay luz y el suelo todavía tiene agua de la nieve. Plantá tres más donde el bosque se abrió. Los que planté yo el año pasado ya me llegan a la rodilla.',
    resumen: 'Plantar tres renovales más (B).',
    listo: 'Tres más. Dentro de veinte años alguien va a caminar a la sombra de eso y no va a saber que fuiste vos. Así tiene que ser.',
    premio: { ramitas: 6, texto: '6 ramitas secas' },
    meta: cuenta('renovales', 3),
  },
  {
    id: 't-truchas-verano', quien: 'nicanor', temporada: 'verano', titulo: 'El verano de las marrones',
    pedido: 'Con el calor las truchas grandes suben a comer a la orilla, a la tardecita. Sacá tres más y devolvelas. Ya sé que sabés: esto es para que no te olvides.',
    resumen: 'Pescar y devolver tres peces más.',
    listo: 'Tres más al agua. El lago te va a devolver el favor, vas a ver.',
    premio: { materiales: { tabla: 4 }, texto: '4 tablas' },
    meta: cuenta('peces', 3),
  },
  // ---------------------------------------------------------------- otoño
  {
    id: 't-lena', quien: 'ramon', temporada: 'otono', titulo: 'La leña del otoño',
    pedido: 'Se viene el frío. El que no junta leña en otoño la junta en invierno, con la nieve hasta la rodilla. Tumbá dos árboles de los que sobran, y acordate de plantar después.',
    resumen: 'Talar dos árboles más (H).',
    listo: 'Con eso pasás el invierno. Y si plantaste, el monte ni se entera.',
    premio: { materiales: { piedra: 6 }, texto: '6 piedras' },
    meta: cuenta('talados', 2),
  },
  {
    id: 't-coloradas', quien: 'ema', temporada: 'otono', titulo: 'Las lengas coloradas',
    pedido: 'Dos semanas dura esto, ni una más. Necesito fotos de las lengas coloradas para el registro del año: sacá dos, de donde te parezca que se ve mejor.',
    resumen: 'Sacar dos fotos más en otoño (P).',
    listo: 'Esa va al registro. Dentro de diez años alguien va a comparar y va a saber cómo estaba el bosque hoy.',
    premio: { ramitas: 4, texto: '4 ramitas secas' },
    meta: cuenta('fotos', 2),
  },
  // ---------------------------------------------------------------- invierno
  {
    id: 't-trochita-nieve', quien: 'guarda', temporada: 'invierno', titulo: 'La vuelta en la nieve',
    pedido: 'En invierno la vuelta es otra: la vía abierta entre la nieve, el lago negro de un lado y la salamandra prendida en el coche. Dala entera una vez, que es cuando más vale la pena.',
    resumen: 'Dar la vuelta completa en la trochita.',
    listo: '¿Viste? Con nieve el recorrido cambia todo. Y las huellas se ven desde la ventanilla.',
    premio: { materiales: { tronco: 4 }, texto: '4 troncos' },
    meta: cuenta('vueltas', 1),
  },
  {
    id: 't-lago-negro', quien: 'nicanor', temporada: 'invierno', titulo: 'El lago negro',
    pedido: 'En invierno las truchas bajan hondo y esperan. Casi nadie sale, así que casi nadie las saca. Sacá dos, con paciencia, y me contás cómo fue.',
    resumen: 'Pescar y devolver dos peces en invierno.',
    listo: 'Dos en invierno. Eso no lo hace cualquiera: el agua te congela las manos antes que el pique.',
    premio: { materiales: { tabla: 6 }, texto: '6 tablas' },
    meta: cuenta('peces', 2),
  },
];

export const ENCARGO_TEMPORADA = Object.fromEntries(ENCARGOS_TEMPORADA.map((e) => [e.id, e]));

// Cuánto hiciste desde que aceptaste. Sin base anotada (un guardado raro) no cuenta
// nada: mejor que el encargo tarde un poco a que se cumpla solo.
export function avance(p, e) {
  const base = p?.encargoBase?.[e.id];
  if (!base || !e.meta) return 0;
  const ahora = contadores(p)[e.meta.contador] || 0;
  return Math.max(0, ahora - (Number(base[e.meta.contador]) || 0));
}
export function cumplidoTemporada(p, e) {
  return avance(p, e) >= (e.meta?.cantidad || 1);
}
// Para que el resto del juego los pueda tratar igual que a los otros (`e.cumplido(p)`).
for (const e of ENCARGOS_TEMPORADA) e.cumplido = (p) => cumplidoTemporada(p, e);

// Al aceptar: se anota cómo estabas.
export function anotarBase(p, e) {
  if (!p.encargoBase) p.encargoBase = {};
  p.encargoBase[e.id] = contadores(p);
}

// Lo que tiene este vecino para esta estación. Primero cobrar lo cumplido (aunque haya
// cambiado la estación: lo aceptaste y lo hiciste), después ofrecer uno nuevo, sólo
// después del cierre y sólo de la estación en que estás.
export function encargoDeTemporada(p, quien, estacion) {
  const mios = ENCARGOS_TEMPORADA.filter((e) => e.quien === quien);
  const listo = mios.find((e) => p?.encargos?.[e.id] === 'pedido' && cumplidoTemporada(p, e));
  if (listo) return { e: listo, modo: 'listo' };
  if (p?.encargos?.['e-valle'] !== 'hecho') return null;
  const nuevo = mios.find((e) => e.temporada === estacion && !p?.encargos?.[e.id]);
  return nuevo ? { e: nuevo, modo: 'pedido' } : null;
}

export function resumenTemporada(p, estacion) {
  const deEsta = ENCARGOS_TEMPORADA.filter((e) => e.temporada === estacion);
  return {
    hechos: ENCARGOS_TEMPORADA.filter((e) => p?.encargos?.[e.id] === 'hecho').length,
    total: ENCARGOS_TEMPORADA.length,
    pendientesDeEsta: deEsta.filter((e) => !p?.encargos?.[e.id]).length,
  };
}

// Qué dejar en el guardado: sólo números finitos, sólo de encargos que existen.
export function sanearBase(x) {
  const out = {};
  if (!x || typeof x !== 'object') return out;
  for (const [id, base] of Object.entries(x)) {
    // 2.6.1: Object.hasOwn: "__proto__" o "constructor" no son encargos
    if (!Object.hasOwn(ENCARGO_TEMPORADA, id) || !base || typeof base !== 'object') continue;
    const b = {};
    for (const k of ['renovales', 'talados', 'fotos', 'vueltas', 'peces']) {
      const v = Number(base[k]);
      if (Number.isFinite(v) && v >= 0) b[k] = Math.floor(v);
    }
    out[id] = b;
  }
  return out;
}

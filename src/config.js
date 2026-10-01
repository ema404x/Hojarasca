// Constantes del mundo y ajustes de calidad

export const MUNDO = 1024;          // metros de lado
export const MITAD = MUNDO / 2;
export const RES = 512;             // celdas de la grilla de alturas
export const CELDA = MUNDO / RES;   // 2 m
export const N = RES + 1;           // vértices por lado
export const LIMITE = 468;          // hasta dónde se puede caminar
export const SEMILLA = 20260910;

export const LAGO = { x: 150, z: 110 };

export const LUGARES = {
  refugio: { x: -120, z: 232, nombre: 'Refugio del Arroyo' },
  mirador: { x: -292, z: 36, nombre: 'Mirador del Pehuén' },
  arrayanes: { x: 266, z: 150, nombre: 'Bosque de Arrayanes' },
  mallin: { x: -222, z: -226, nombre: 'Mallín' },
  // muelle y puente se ubican al generar el terreno
};

export const RIO_CONTROL = [
  [-330, -540], [-306, -430], [-252, -356], [-282, -268], [-236, -196],
  [-160, -128], [-88, -72], [-8, -14], [74, 48],
];

export const SENDERO_CONTROL = [
  [-120, 244], [-30, 262], [60, 262], [160, 290], [262, 262], [326, 150],
  [330, 30], [262, -88], [120, -150], [-10, -150], [-120, -196], [-222, -250],
  [-322, -170], [-330, -60], [-292, 36], [-250, 150], [-180, 222],
];

// La trochita: un anillo que da la vuelta al valle, cruzando el arroyo por un puente
export const RIEL_CONTROL = [
  [-300, -300], [-140, -348], [60, -336], [226, -286], [322, -166], [346, -10],
  [318, 146], [232, 268], [70, 326], [-120, 332], [-268, 282], [-336, 132],
  [-352, -40], [-338, -196],
];

// 2.7: texturas = detalle material procedural (corteza, roca, suelo) y hojas en tarjetas;
// anisotropia = filtrado de esas texturas; sombraSuave = radio del filtro de sombra (téxeles).
// 3.2: estilo pintado. `texturas` ya no pone texturas de detalle ni cartas de hojas: sólo
// decide si el prado usa las manchas grandes del valle (pasto seco, bajos húmedos) y el
// pasto fino. `rayos` sube: los haces salen ahora del cielo entre las copas.
export const CALIDADES = {
  muybaja: { pasto: 9000, radioPasto: 15, sombras: 0, lejos: 160, niebla: 1.6, pixelRatio: 1, densidad: 0.45, lod: 26, sotobosque: 38, antialias: false, terrenoDetalle: 90, post: false, flotantes: 0, aves: 0, detalleSuelo: 0, texturas: 0 },
  baja: { pasto: 18000, radioPasto: 20, sombras: 0, lejos: 185, niebla: 1.35, pixelRatio: 1, densidad: 0.58, lod: 34, sotobosque: 48, antialias: false, terrenoDetalle: 120, post: false, flotantes: 90, aves: 8, detalleSuelo: 0, texturas: 1, anisotropia: 2 },
  media: { pasto: 40000, radioPasto: 29, sombras: 1024, lejos: 230, niebla: 1.08, pixelRatio: 1, densidad: 0.82, lod: 44, sotobosque: 64, antialias: true, terrenoDetalle: 170, post: true, bloom: 0.3, postEscala: 0.4, brilloPasadas: 1, rayos: 0.6, flotantes: 200, aves: 14, detalleSuelo: 1, texturas: 1, anisotropia: 4, sombraSuave: 2.2 },
  alta: { pasto: 82000, radioPasto: 42, sombras: 2048, lejos: 310, niebla: 0.9, pixelRatio: 1.5, densidad: 1, lod: 66, sotobosque: 96, antialias: true, terrenoDetalle: 240, post: true, bloom: 0.3, postEscala: 0.5, brilloPasadas: 2, rayos: 0.75, flotantes: 320, aves: 20, detalleSuelo: 1, texturas: 1, anisotropia: 8, sombraSuave: 2.6 },
};

// 3.5: distancia de dibujo, como los chunks de Minecraft. El jugador la elige en bloques de
// TAM_BLOQUE metros (de BLOQUES_MIN a BLOQUES_MAX) o la deja «según la calidad» ('calidad'), que
// es el `lejos` de siempre de cada calidad (160/185/230/310 m: nada cambia para quien no la toca).
// Escala el alcance de los árboles y sus carteles, el corte de las construcciones lejanas
// (lejos + 60) y la niebla (más corta, más espesa: el borde queda igual de tapado que hoy).
export const TAM_BLOQUE = 40;
export const BLOQUES_MIN = 2;
export const BLOQUES_MAX = 10;
// 3.5: distancia de plantas (pasto, flores, helechos, matas, piedras y hojarasca del piso):
// cuánto se estira lo de cada calidad. Lo bajo es lo que más se ve «aparecer cerca».
export const PLANTAS = { cerca: 0.7, normal: 1, lejos: 1.4, muylejos: 1.8 };
export const PLANTAS_MAX = 1.8;
// 3.5: el sotobosque se funde por mata hasta `sotobosque × ALCANCE_SOTO` (antes se cortaba por
// chunk de 120 m: entraba de golpe un chunk entero a 30–64 m). Lo que se dibuja entero llega a
// donde llegaba lo seguro de antes (el 70%: 58 m en media).
export const ALCANCE_SOTO = 1.3;

// 'calidad', o un número de bloques (entero, acotado). Lo raro (un guardado viejo sin el campo,
// texto, null) es 'calidad'.
export function sanearDistancia(v) {
  if (v === 'calidad') return 'calidad';
  const n = typeof v === 'number' || (typeof v === 'string' && v.trim() !== '') ? Number(v) : NaN;
  if (!Number.isFinite(n)) return 'calidad';
  return Math.min(BLOQUES_MAX, Math.max(BLOQUES_MIN, Math.round(n)));
}
export function sanearPlantas(v) { return Object.prototype.hasOwnProperty.call(PLANTAS, v) ? v : 'normal'; }

// Las distancias que rigen con la calidad `clave` (la que está andando: la automática la puede
// cambiar) y los dos ajustes del jugador. `niebla` multiplica la densidad de la niebla de esa
// calidad (1 con la distancia de la calidad); `plantas` estira el pasto y el sotobosque.
export function distanciasDe(clave, distancia = 'calidad', plantas = 'normal') {
  const base = CALIDADES[clave] || CALIDADES.media;
  const d = sanearDistancia(distancia);
  const porCalidad = d === 'calidad';
  const lejos = porCalidad ? base.lejos : d * TAM_BLOQUE;
  const f = PLANTAS[sanearPlantas(plantas)];
  return {
    lejos,
    porCalidad,
    bloques: Math.round((lejos / TAM_BLOQUE) * 10) / 10,
    niebla: porCalidad ? 1 : Math.min(2.5, Math.max(0.5, base.lejos / lejos)),
    plantas: f,
    sotobosque: base.sotobosque * f,
    radioPasto: base.radioPasto * f,
  };
}
// El texto del ajuste: «6 bloques · 240 m», o «Según la calidad · 230 m (≈5,8 bloques)».
export function textoDistanciaDibujo(dist) {
  if (dist.porCalidad) return `Según la calidad · ${dist.lejos} m (≈${String(dist.bloques).replace('.', ',')} bloques)`;
  return `${dist.bloques} bloques · ${dist.lejos} m`;
}

export const VELOCIDAD ={ caminar: 3.2, correr: 6.6, agachado: 1.5, nadar: 1.6 };
export const ALTURA_OJOS = 1.65;
export const ALTURA_AGACHADO = 1.0;

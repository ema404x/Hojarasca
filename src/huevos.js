// 4.2 (huevos de pascua): reglas puras de los easter eggs del Relax (no entran al Desafío). Ni three ni DOM ni reloj: todo
// depende del día, de la hora y de una semilla, así que se prueba sin abrir el juego (pruebas/verificar-huevos.mjs).
//   · estrella fugaz con deseo (esta parte);  · los duendes del Coihue;  · el huemul blanco;  · el hueso del perro.
// Lo visual es de huevos-mundo.js y el enganche con el juego, de huevos-juego.js.
// Se guarda en `progreso.huevos` (saneado acá; una partida vieja sin el campo carga con todo en cero).

const entero = (v, def = 0, min = 0, max = 1e7) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : def; };
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

// Un azar determinista (no cambia al recargar): mezcla de enteros → [0, 1)
export function azarDe(...ns) {
  let h = 2166136261 >>> 0;
  for (const n of ns) {
    h ^= (Math.floor(Number(n)) || 0) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
    h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13;
  }
  return ((h >>> 0) % 1000003) / 1000003;
}

// ---------------------------------------------------------------- 1) la estrella fugaz con deseo
export const ESTRELLA = {
  probabilidad: 0.2,   // por cada fugaz que de verdad viste (de noche, a cielo abierto, mirando para ese lado)
  separacion: 6,       // noches enteras entre una estrella y la siguiente
  demoraMin: 2,        // el deseo se cumple a los 2 a 4 días
  demoraMax: 4,
  segundos: 14,        // lo que dura el cartelito de los tres deseos
};
export const DESEOS = [
  { id: 'lena', texto: 'Que no falte leña' },
  { id: 'vecino', texto: 'Buena compañía' },
  { id: 'tierra', texto: 'Que la tierra dé' },
];
export const IDS_DESEOS = DESEOS.map((d) => d.id);
// Los vecinos del valle que siempre están (vecindad.js: VALLE_VECINDAD)
export const VECINOS_DESEO = ['ramon', 'nicanor', 'ema', 'guarda'];

export const estrellaNueva = () => ({ ultimaNoche: 0, deseo: null, cumplidos: 0 });
function sanearEstrella(e, dia) {
  const x = objeto(e) ? e : {};
  const base = estrellaNueva();
  base.ultimaNoche = Math.min(entero(x.ultimaNoche), Math.max(1, dia));
  base.cumplidos = entero(x.cumplidos, 0, 0, 999);
  if (objeto(x.deseo) && IDS_DESEOS.includes(x.deseo.id)) {
    const pedido = entero(x.deseo.pedido, 0, 1, 1e6), cumple = entero(x.deseo.cumple, 0, 1, 1e6);
    if (pedido >= 1 && pedido <= Math.max(1, dia) && cumple > pedido && cumple - pedido <= ESTRELLA.demoraMax) base.deseo = { id: x.deseo.id, pedido, cumple };
  }
  return base;
}

// La noche «es» del día en que empezó: pasada la medianoche sigue siendo la misma (como cieloDeLaNoche en main.js)
export const diaDeNoche = (dia, horas) => (Number(horas) < 12 ? Number(dia) - 1 : Number(dia));

// ¿Esta fugaz que viste trae un deseo? `n`: cuántas fugaces vistas lleva la noche (la semilla del sorteo)
export function trajoDeseo(h, diaNoche, n) {
  const e = h?.estrella;
  if (!e || e.deseo) return false;                                       // ya hay un deseo esperando
  if (diaNoche < 1 || e.ultimaNoche === diaNoche) return false;          // una vez por noche
  if (e.ultimaNoche && diaNoche - e.ultimaNoche < ESTRELLA.separacion) return false;   // y no seguido
  return azarDe(7001, diaNoche, n) < ESTRELLA.probabilidad;
}
export function ofrecerEstrella(h, diaNoche) { if (h?.estrella) h.estrella.ultimaNoche = entero(diaNoche, 1, 1); }

// Pedir el deseo número `i` (0..2) en el día `dia`: queda anotado para dentro de 2 a 4 días
export function pedirDeseo(h, i, dia) {
  const d = DESEOS[entero(i, -1, -1, 99)];
  if (!d || !h?.estrella || h.estrella.deseo) return null;
  const demora = ESTRELLA.demoraMin + Math.floor(azarDe(7002, dia, i) * (ESTRELLA.demoraMax - ESTRELLA.demoraMin + 1));
  h.estrella.deseo = { id: d.id, pedido: entero(dia, 1, 1), cumple: entero(dia, 1, 1) + demora };
  return h.estrella.deseo;
}

// ¿Le toca cumplirse? A la mañana (de 7 a 19 h) del día señalado o después
export const deseoListo = (h, dia, horas) => !!h?.estrella?.deseo && dia >= h.estrella.deseo.cumple && horas >= 7 && horas < 19;

// Lo que pasa: una nota para el diario y un regalo chico. Los números son los de un regalo de verdad chico.
export function cumplirDeseo(h, dia) {
  const e = h?.estrella, d = e?.deseo;
  if (!d) return null;
  e.deseo = null; e.cumplidos = Math.min(999, e.cumplidos + 1);
  if (d.id === 'lena') return { id: d.id, material: { k: 'tronco', n: 3 }, titulo: 'Leña en la puerta', texto: 'Amaneció un atado de leña seca contra la pared. Nadie vio quién lo dejó.' };
  if (d.id === 'tierra') return { id: d.id, material: { k: 'calafate', n: 4 }, titulo: 'Una canasta en el umbral', texto: 'Alguien dejó una canastita de calafates, todavía con el rocío.' };
  const vecino = VECINOS_DESEO[Math.floor(azarDe(7003, dia, d.pedido) * VECINOS_DESEO.length)];
  return { id: d.id, vecino, amistad: 1, titulo: 'Una visita corta', texto: '__NOMBRE__ pasó un rato a tomar unos mates y se fue antes de que se hiciera de noche.' };
}

// ---------------------------------------------------------------- lo que se guarda
export function huevosNuevos() { return { v: 1, estrella: estrellaNueva() }; }
export function sanearHuevos(h, dia = 1) {
  const d = entero(dia, 1, 1);
  const x = objeto(h) ? h : {};
  return { v: 1, estrella: sanearEstrella(x.estrella, d) };
}

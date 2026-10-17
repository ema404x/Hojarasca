// 4.2 (huevos de pascua): reglas puras de los easter eggs del Relax (no entran al Desafío). Ni three ni DOM ni reloj: todo
// depende del día, de la hora y de una semilla, así que se prueba sin abrir el juego (pruebas/verificar-huevos.mjs).
//   · estrella fugaz con deseo;  · los duendes del Coihue;  · el huemul blanco;  · el hueso del perro.
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

// ---------------------------------------------------------------- 2) los duendes del Coihue
// Un coihue grande del valle (en el Relax no está el Coihue Viejo del Desafío): al pie, con yerba, se les deja un convite. A la mañana
// siguiente hay un bulto atado con hilo: una nota del duende y, a veces, un regalito. Pasan varios días hasta el próximo convite.
export const DUENDES = {
  separacion: 7,          // días entre un convite y el siguiente
  minimo: 35, maximo: 150,   // el coihue elegido está a esa distancia (m) del refugio: ni encima ni perdido
  alcance: 3.6,           // a cuánto del pie se puede dejar o levantar
  probRegalo: 0.45,       // además de la nota
  matMax: 3,
};
export const NOTAS_DUENDE = [
  'Gracias por la yerba. Estaba un poco lavada, pero con cariño. — D.',
  'No me busques. Dejá la yerba y seguí tu camino.',
  'Dice la abuela que el que convida nunca queda pobre. Yo digo lo mismo.',
  'Hoy no me hables de duendes: hoy soy un hongo.',
  'Cuando llueva fuerte, no pises las rondas de hongos. Gracias.',
  'Tu mate me hizo acordar de cuando el valle era más callado.',
];
const REGALOS_DUENDE = [{ k: 'calafate', n: 3 }, { k: 'frutilla', n: 3 }, { k: 'piedra', n: 2 }, { k: 'tronco', n: 2 }];
export const duendesNuevos = () => ({ ofrenda: 0, ultima: 0, recibidos: 0 });
function sanearDuendes(d, dia) {
  const x = objeto(d) ? d : {}, b = duendesNuevos();
  b.ultima = Math.min(entero(x.ultima), Math.max(1, dia));
  b.ofrenda = Math.min(entero(x.ofrenda), Math.max(1, dia));
  if (b.ofrenda && b.ultima < b.ofrenda) b.ultima = b.ofrenda;
  b.recibidos = entero(x.recibidos, 0, 0, 999);
  return b;
}
// El coihue de los duendes: el más grande (por escala) entre los que quedan a una caminata del refugio. `arboles`: veg.arboles
// ({ x, z, especie, esc }). Siempre el mismo en un mismo valle; si no hay ninguno, null.
export function elegirCoihue(arboles, centro) {
  let mejor = null;
  for (const a of Array.isArray(arboles) ? arboles : []) {
    if (!a || a.especie !== 'coihue' || !Number.isFinite(a.x) || !Number.isFinite(a.z)) continue;
    const d = Math.hypot(a.x - centro.x, a.z - centro.z);
    if (d < DUENDES.minimo || d > DUENDES.maximo) continue;
    if (!mejor || a.esc > mejor.esc + 1e-9 || (Math.abs(a.esc - mejor.esc) <= 1e-9 && (a.x < mejor.x || (a.x === mejor.x && a.z < mejor.z)))) mejor = a;
  }
  return mejor ? { x: mejor.x, z: mejor.z, esc: mejor.esc } : null;
}
// ¿Se puede dejar un convite? Sin otro esperando y pasados los días de separación
export const puedeConvidar = (h, dia) => !!h?.duendes && !h.duendes.ofrenda && (!h.duendes.ultima || dia - h.duendes.ultima >= DUENDES.separacion);
export function convidar(h, dia) { if (!puedeConvidar(h, dia)) return false; h.duendes.ofrenda = entero(dia, 1, 1); h.duendes.ultima = h.duendes.ofrenda; return true; }
// ¿Hay algo para levantar? A partir de las 6 de la mañana siguiente (hasta la noche)
export const bultoListo = (h, dia, horas) => !!h?.duendes?.ofrenda && dia > h.duendes.ofrenda && horas >= 6 && horas < 21;
// Lo que dejó el duende: siempre una nota; a veces, un regalito chico
export function levantarBulto(h, dia) {
  const d = h?.duendes;
  if (!d || !d.ofrenda) return null;
  const semilla = d.ofrenda;
  d.ofrenda = 0; d.recibidos = Math.min(999, d.recibidos + 1);
  const nota = NOTAS_DUENDE[Math.floor(azarDe(7101, semilla, dia) * NOTAS_DUENDE.length)];
  const regalo = azarDe(7102, semilla) < DUENDES.probRegalo ? REGALOS_DUENDE[Math.floor(azarDe(7103, semilla) * REGALOS_DUENDE.length)] : null;
  return { nota, material: regalo ? { ...regalo } : null };
}

// ---------------------------------------------------------------- 3) el huemul blanco
// Una mañana de niebla de valle, muy de vez en cuando, un huemul de pelaje claro está parado en el mallín. No se caza ni se lastima (no es
// de la fauna del juego: ni flechas ni rastro ni cámara de caza); se va caminando si te acercás demasiado. Mirarlo lo anota en el cuaderno.
export const HUEMUL = {
  prob: 0.07,        // por mañana con niebla (y el tiempo que haya pasado)
  separacion: 5,     // días entre una aparición y la siguiente
  desde: 5.5, hasta: 8.8,   // la ventana del amanecer (horas del juego)
  nieblaMin: 0.2,    // cuánta niebla de valle hace falta (la opacidad de niebla.js, 0 a 0,68)
  cerca: 24,         // m: más cerca que esto, se va
  ver: 80,           // m: de más lejos que esto no se lo anota
  fuga: 46,          // m que camina al irse
};
export const ENTRADAS_HUEVOS = [
  { id: 'avistaje-huemul', seccion: 'fauna', nombre: 'Un huemul blanco', cientifico: 'avistaje raro', modo: 'observar',
    pista: 'Hay que tener suerte: una mañana de niebla en el valle, bien temprano.',
    texto: 'Entero claro, como si la niebla se hubiera puesto a caminar. Se quedó mirando un momento, con la «Y» de la frente apenas más oscura, y se fue despacio hacia el bosque. Los guardaparques cuentan que existe y nadie lo firma. Mejor no contárselo a muchos.' },
];
export const huemulNuevo = () => ({ ultimo: 0, ido: false, avistajes: 0 });
function sanearHuemul(x, dia) {
  const v = objeto(x) ? x : {}, b = huemulNuevo();
  b.ultimo = Math.min(entero(v.ultimo), Math.max(1, dia));
  b.ido = b.ultimo > 0 && v.ido === true;
  b.avistajes = entero(v.avistajes, 0, 0, 999);
  return b;
}
export const ventanaHuemul = (horas) => Number(horas) >= HUEMUL.desde && Number(horas) < HUEMUL.hasta;
// ¿Está el huemul en el mallín ahora? Se sortea una vez por mañana (con la misma semilla: recargar no cambia nada) y se queda hasta que se va
export function huemulAfuera(h, dia, horas, niebla) {
  const x = h?.huemul;
  if (!x || !ventanaHuemul(horas)) return false;
  if (x.ultimo === dia) return !x.ido;
  if (x.ultimo && dia - x.ultimo < HUEMUL.separacion) return false;
  if (!(niebla >= HUEMUL.nieblaMin)) return false;
  return azarDe(7201, dia) < HUEMUL.prob;
}
export function salioHuemul(h, dia) { if (h?.huemul && h.huemul.ultimo !== dia) { h.huemul.ultimo = entero(dia, 1, 1); h.huemul.ido = false; } }
export function seFueHuemul(h) { if (h?.huemul) h.huemul.ido = true; }
export function avistoHuemul(h) { if (h?.huemul) h.huemul.avistajes = Math.min(999, h.huemul.avistajes + 1); }
// ¿Se asusta? El jugador (o lo que lo busque) a menos de `cerca` metros
export const seAsusta = (dist) => dist < HUEMUL.cerca;

// ---------------------------------------------------------------- lo que se guarda
export function huevosNuevos() { return { v: 1, estrella: estrellaNueva(), duendes: duendesNuevos(), huemul: huemulNuevo() }; }
export function sanearHuevos(h, dia = 1) {
  const d = entero(dia, 1, 1);
  const x = objeto(h) ? h : {};
  return { v: 1, estrella: sanearEstrella(x.estrella, d), duendes: sanearDuendes(x.duendes, d), huemul: sanearHuemul(x.huemul, d) };
}

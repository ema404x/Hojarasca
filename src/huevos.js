// 4.2 (huevos de pascua): reglas puras de los easter eggs del Relax (no entran al Desafío). Ni three ni DOM ni reloj: todo
// depende del día, de la hora y de una semilla, así que se prueba sin abrir el juego (pruebas/verificar-huevos.mjs).
//   · estrella fugaz con deseo;  · los duendes del Coihue;  · el huemul blanco;  · el hueso del perro;  · la radio de la madrugada;
//   · el código de la portada (hojas que caen).
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

// ---------------------------------------------------------------- 4) el hueso del perro
// De vez en cuando el perro entierra un hueso en algún lugar del valle y queda un montículo chico de tierra. Con E se lo excava: sale
// algo viejo (una moneda, una cuenta de vidrio) y el perro se pone contento. Un hueso por vez; el montículo se va al desenterrarlo.
export const HUESO = {
  prob: 0.16,        // por día (con el sorteo fijo de cada día)
  separacion: 6,     // días entre un hueso y el siguiente (contando desde que se enterró)
  desde: 6.5, hasta: 19,   // el perro lo entierra de día
  minR: 24, maxR: 80,      // m desde el refugio donde queda el montículo
  alcance: 2.3,      // m: a cuánto se puede excavar
  ver: 90,           // m: de más lejos no se dibuja
};
export const HALLAZGOS = [
  { id: 'moneda', peso: 0.4, pesos: 120, texto: 'una moneda vieja, con un águila casi borrada' },
  { id: 'cobre', peso: 0.4, pesos: 90, texto: 'una moneda de cobre, verde de tierra' },
  { id: 'cuenta', peso: 0.2, pesos: 0, texto: 'una cuenta de vidrio azul, chiquita como un garbanzo' },
];
export const huesoNuevo = () => ({ dia: 0, ultimo: 0, cavados: 0 });
function sanearHueso(x, dia) {
  const v = objeto(x) ? x : {}, b = huesoNuevo();
  b.ultimo = Math.min(entero(v.ultimo), Math.max(1, dia));
  b.dia = Math.min(entero(v.dia), Math.max(1, dia));
  if (b.dia && b.ultimo < b.dia) b.ultimo = b.dia;
  b.cavados = entero(v.cavados, 0, 0, 999);
  return b;
}
// ¿Entierra uno hoy? Sólo sin otro enterrado, pasados los días de separación, de día y si el sorteo de hoy da que sí
export function enterroHueso(h, dia, horas) {
  const x = h?.hueso;
  if (!x || x.dia || !(horas >= HUESO.desde && horas < HUESO.hasta)) return false;
  if (x.ultimo && dia - x.ultimo < HUESO.separacion) return false;
  if (!(azarDe(7301, dia) < HUESO.prob)) return false;
  x.dia = entero(dia, 1, 1); x.ultimo = x.dia;
  return true;
}
// Dónde (ángulo y distancia al refugio): el mismo para el mismo día, así recargar no lo mueve
export function lugarDelHueso(dia) {
  return { ang: azarDe(7303, dia) * Math.PI * 2, r: HUESO.minR + azarDe(7304, dia) * (HUESO.maxR - HUESO.minR) };
}
export const hayHueso = (h) => !!h?.hueso?.dia;
// Excavarlo: lo que sale (siempre algo viejo y chico) y el montículo se va
export function desenterrarHueso(h) {
  const x = h?.hueso;
  if (!x || !x.dia) return null;
  let u = azarDe(7302, x.dia), hall = HALLAZGOS[HALLAZGOS.length - 1];
  for (const c of HALLAZGOS) { if (u < c.peso) { hall = c; break; } u -= c.peso; }
  x.dia = 0; x.cavados = Math.min(999, x.cavados + 1);
  return { ...hall };
}

// ---------------------------------------------------------------- 5) la radio de la madrugada
// Entre las 2 y las 4 de la mañana (hora del juego), algunas noches, al prender la radio hay una emisora que de día no está: un tango viejo
// (tocado por una orquesta que no existe, una frase propia de cuatro compases) o alguien que transmite en código Morse. Una vez por noche.
// Cómo suena: radio-madrugada.js (síntesis propia, nada grabado).
export const RADIO_MAD = {
  desde: 2, hasta: 4,   // horas del juego
  prob: 0.4,            // las noches que hay señal
  tango: 0.55,          // y de esas, la fracción que es tango (el resto, Morse)
};
export const MENSAJES_MORSE = ['HOLA VALLE', 'BUENAS NOCHES', 'NO ESTAS SOLO', 'HOJARASCA', 'ABRIGATE', 'LLEGA EL INVIERNO'];
export const radioNueva = () => ({ ultima: 0, oidos: 0 });
function sanearRadioMad(x, dia) {
  const v = objeto(x) ? x : {}, b = radioNueva();
  b.ultima = Math.min(entero(v.ultima), Math.max(1, dia));
  b.oidos = entero(v.oidos, 0, 0, 999);
  return b;
}
// ¿Esta noche (la que empezó el día `noche`) hay señal? Fija para cada noche
export const hayEmisoraMadrugada = (noche) => azarDe(7401, noche) < RADIO_MAD.prob;
export const ventanaMadrugada = (horas) => Number(horas) >= RADIO_MAD.desde && Number(horas) < RADIO_MAD.hasta;
// Lo que se oye: { tipo: 'tango' | 'morse', mensaje? } o null (sólo estática). Una vez por noche; `noche` = dia − 1 pasada la medianoche
export function escucharMadrugada(h, noche, horas) {
  const r = h?.radio;
  if (!r || !ventanaMadrugada(horas) || r.ultima === noche || !hayEmisoraMadrugada(noche)) return null;
  r.ultima = entero(noche, 1, 1); r.oidos = Math.min(999, r.oidos + 1);
  if (azarDe(7402, noche) < RADIO_MAD.tango) return { tipo: 'tango' };
  return { tipo: 'morse', mensaje: MENSAJES_MORSE[Math.floor(azarDe(7403, noche) * MENSAJES_MORSE.length)] };
}

// ---------------------------------------------------------------- 6) el código secreto de la portada
// ↑ ↑ ↓ ↓ ← → ← → B A en la portada: caen hojas de colores unos segundos.
export const CODIGO_PORTADA = Object.freeze(['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']);
// Se llama con cada tecla: `memoria` es el arreglo (de los últimos códigos) que va y viene; devuelve true cuando cierra la secuencia
export function teclaDelCodigo(memoria, codigo) {
  if (!Array.isArray(memoria)) return false;
  memoria.push(String(codigo));
  while (memoria.length > CODIGO_PORTADA.length) memoria.shift();
  return memoria.length === CODIGO_PORTADA.length && memoria.every((c, i) => c === CODIGO_PORTADA[i]);
}
export const COLORES_HOJAS = ['#c8452b', '#e08a2c', '#f0c24a', '#8aa03a', '#a8553a', '#d9a066', '#6f8f3a', '#b9492f'];
// Las hojas: posición (% del ancho), tamaño, color, cuánto tardan en caer, cuándo salen y para qué lado se mecen. Con la semilla, siempre iguales.
export function planHojas(n = 44, semilla = 1, calmo = false) {
  const cuantas = Math.max(1, Math.min(80, Math.floor(calmo ? Math.min(n, 14) : n)));
  const hojas = [];
  for (let i = 0; i < cuantas; i++) {
    hojas.push({
      x: Math.round(azarDe(7501, semilla, i) * 1000) / 10, tam: 14 + Math.round(azarDe(7502, semilla, i) * 14),
      color: COLORES_HOJAS[Math.floor(azarDe(7503, semilla, i) * COLORES_HOJAS.length)],
      dur: 4.5 + Math.round(azarDe(7504, semilla, i) * 30) / 10, espera: Math.round(azarDe(7505, semilla, i) * 25) / 10,
      mece: (azarDe(7506, semilla, i) < 0.5 ? -1 : 1) * (30 + Math.round(azarDe(7507, semilla, i) * 70)), giro: 180 + Math.round(azarDe(7508, semilla, i) * 540),
    });
  }
  return hojas;
}
export const SEGUNDOS_HOJAS = 10;   // lo que dura todo (la última sale a los 2,5 s y cae en 8 como mucho)

// ---------------------------------------------------------------- lo que se guarda
export function huevosNuevos() { return { v: 1, estrella: estrellaNueva(), duendes: duendesNuevos(), huemul: huemulNuevo(), hueso: huesoNuevo(), radio: radioNueva() }; }
export function sanearHuevos(h, dia = 1) {
  const d = entero(dia, 1, 1);
  const x = objeto(h) ? h : {};
  return { v: 1, estrella: sanearEstrella(x.estrella, d), duendes: sanearDuendes(x.duendes, d), huemul: sanearHuemul(x.huemul, d), hueso: sanearHueso(x.hueso, d), radio: sanearRadioMad(x.radio, d) };
}

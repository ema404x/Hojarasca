// Cómo suena un golpe de verdad.
//
// Hasta la 1.8 cada golpe del juego era una sola cosa: un ruido pasado por un filtro,
// o un oscilador que bajaba de tono. Suena a sintetizador porque le falta lo que tiene
// cualquier golpe real, que son tres capas que pasan a la vez:
//
//   1. El transitorio. Los dos o tres milisegundos del contacto. No tiene tono: es un
//      chasquido ancho. Es lo que el oído usa para saber con qué le pegaron.
//   2. El cuerpo. El objeto golpeado vibra en sus modos propios, que NO son armónicos:
//      un tronco no suena como una cuerda. Cada modo tiene su frecuencia, su nivel y su
//      tiempo de caída, y los agudos se apagan mucho antes que los graves.
//   3. La cola. El aire, la madera que trabaja, la tierra que se asienta.
//
// Acá viven las recetas —puras, sin audio— y el motor las arma en `sonido.js`.
// Las razones entre modos salen de golpear cosas y mirar el espectro, no de la serie
// armónica: son las que hacen que una piedra suene a piedra y no a campana.

// [razón contra el modo fundamental, caída en segundos, nivel]
export const MATERIALES = {
  // Madera maciza: pocos modos, caída corta, mucho cuerpo grave. El hachazo.
  tronco: {
    base: 186, modos: [[1, 0.33, 1], [1.87, 0.22, 0.52], [2.94, 0.13, 0.3], [4.62, 0.07, 0.16]],
    golpe: { frec: 2400, q: 0.7, dur: 0.014, vol: 0.85 },
    cola: { frec: 620, q: 0.5, dur: 0.17, vol: 0.3 },
    jitter: 0.06,
  },
  // Tabla: más chica y más tensa, suena más arriba y se apaga antes.
  tabla: {
    base: 430, modos: [[1, 0.19, 1], [2.42, 0.12, 0.6], [3.9, 0.07, 0.34], [6.1, 0.04, 0.18]],
    golpe: { frec: 3200, q: 0.6, dur: 0.01, vol: 0.8 },
    cola: { frec: 1100, q: 0.5, dur: 0.1, vol: 0.24 },
    jitter: 0.08,
  },
  // Lo hueco: un refugio, una puerta, un cajón. El modo del aire de adentro es el que
  // manda, y por eso suena a tambor y no a palo.
  hueco: {
    base: 108, modos: [[1, 0.42, 1], [1.62, 0.24, 0.45], [2.71, 0.15, 0.28], [3.84, 0.09, 0.14]],
    golpe: { frec: 1500, q: 0.6, dur: 0.02, vol: 0.7 },
    cola: { frec: 330, q: 0.7, dur: 0.3, vol: 0.34 },
    jitter: 0.05,
  },
  // Piedra: casi todo transitorio. Los modos existen pero duran nada.
  piedra: {
    base: 640, modos: [[1, 0.075, 1], [1.59, 0.05, 0.7], [2.43, 0.035, 0.45], [3.92, 0.022, 0.3]],
    golpe: { frec: 4200, q: 0.5, dur: 0.008, vol: 1 },
    cola: { frec: 2200, q: 0.4, dur: 0.05, vol: 0.2 },
    jitter: 0.12,
  },
  // Tierra y hojarasca: no resuena nada, es un golpe sordo y un roce.
  tierra: {
    base: 92, modos: [[1, 0.1, 1], [1.74, 0.06, 0.35]],
    golpe: { frec: 700, q: 0.4, dur: 0.02, vol: 0.5 },
    cola: { frec: 1800, q: 0.3, dur: 0.13, vol: 0.34 },
    jitter: 0.1,
  },
  // Carne: el golpe que uno no quiere escuchar. Grave, corto, sin brillo.
  carne: {
    base: 74, modos: [[1, 0.13, 1], [2.1, 0.07, 0.4], [3.3, 0.04, 0.16]],
    golpe: { frec: 480, q: 0.5, dur: 0.018, vol: 0.62 },
    cola: { frec: 260, q: 0.6, dur: 0.16, vol: 0.4 },
    jitter: 0.14,
  },
  // Quitina: el caparazón del invasor. Entre el hueso y la madera seca, con un modo
  // agudo que suena a cáscara rajada.
  quitina: {
    base: 268, modos: [[1, 0.16, 1], [2.31, 0.1, 0.72], [4.07, 0.055, 0.5], [6.8, 0.03, 0.26]],
    golpe: { frec: 3400, q: 0.8, dur: 0.01, vol: 0.9 },
    cola: { frec: 1500, q: 0.5, dur: 0.09, vol: 0.28 },
    jitter: 0.11,
  },
  // Hueso: más corto y más agudo todavía.
  hueso: {
    base: 520, modos: [[1, 0.1, 1], [2.56, 0.06, 0.6], [4.9, 0.03, 0.3]],
    golpe: { frec: 5200, q: 0.7, dur: 0.007, vol: 0.9 },
    cola: { frec: 2600, q: 0.5, dur: 0.05, vol: 0.18 },
    jitter: 0.1,
  },
  // Metal: los modos duran, y por eso zumba después del golpe.
  metal: {
    base: 396, modos: [[1, 1.5, 1], [2.76, 1.1, 0.66], [5.4, 0.7, 0.4], [8.93, 0.4, 0.22]],
    golpe: { frec: 6000, q: 0.5, dur: 0.006, vol: 0.8 },
    cola: { frec: 3000, q: 0.4, dur: 0.12, vol: 0.12 },
    jitter: 0.04,
  },
  // 2.0: la chapa acanalada. Es metal, pero una lámina finita clavada a los tirantes:
  // los clavos la frenan y no zumba como una campana. Suena alto, brillante y corto,
  // con un modo muy agudo que es el "tic" de la gota.
  chapa: {
    base: 1240, modos: [[1, 0.2, 1], [1.53, 0.16, 0.8], [2.61, 0.1, 0.55], [4.3, 0.06, 0.35]],
    golpe: { frec: 7400, q: 0.7, dur: 0.004, vol: 0.9 },
    cola: { frec: 4800, q: 0.5, dur: 0.06, vol: 0.1 },
    jitter: 0.16,
  },
  // 2.0: la lona tensa de la carpa. Un parche: un modo grave con poca caída, casi todo
  // golpe seco. Es el "tac" que se escucha con la cara a diez centímetros de la tela.
  lona: {
    base: 210, modos: [[1, 0.06, 1], [1.59, 0.04, 0.5], [2.14, 0.03, 0.3]],
    golpe: { frec: 1900, q: 0.8, dur: 0.012, vol: 0.9 },
    cola: { frec: 900, q: 0.5, dur: 0.05, vol: 0.18 },
    jitter: 0.18,
  },
  // Vidrio y cristal alienígena: agudo, con batido entre modos muy cercanos.
  cristal: {
    base: 1180, modos: [[1, 0.5, 1], [1.02, 0.46, 0.7], [2.41, 0.28, 0.5], [3.77, 0.16, 0.3]],
    golpe: { frec: 7200, q: 0.6, dur: 0.005, vol: 0.7 },
    cola: { frec: 4200, q: 0.5, dur: 0.08, vol: 0.14 },
    jitter: 0.03,
  },
};

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// Un objeto más grande suena más grave y le dura más: la frecuencia va con 1/tamaño y
// el tiempo de caída, con la raíz. Es la física de un cuerpo que vibra, redondeada.
// `cuantos` recorta la cantidad de modos. Un golpe suelto los quiere todos; los veinte
// crujidos de un árbol que se viene abajo, no: con el fundamental y el segundo modo ya
// se reconoce la madera, y cada modo de más son dos nodos de audio por golpe.
export function modos(material, { tamaño = 1, dureza = 1, azar = 0, cuantos = 99 } = {}) {
  const M = MATERIALES[material];
  if (!M) return [];
  const t = clamp(tamaño, 0.15, 8);
  const base = (M.base / t) * (0.75 + 0.25 * dureza);
  const j = M.jitter;
  return M.modos.slice(0, Math.max(1, cuantos)).map(([razon, caida, nivel], i) => ({
    // cada modo se corre un poquito distinto: dos golpes nunca son el mismo golpe
    frec: clamp(base * razon * (1 + (azarEn(azar, i) - 0.5) * j), 24, 17000),
    dur: clamp(caida * Math.sqrt(t) * (1.15 - 0.3 * dureza), 0.01, 6),
    vol: nivel * (i === 0 ? 1 : 1 - 0.12 * i),
  }));
}

// El transitorio y la cola, con el mismo tamaño y la misma variación.
export function capas(material, { tamaño = 1, dureza = 1, azar = 0 } = {}) {
  const M = MATERIALES[material];
  if (!M) return null;
  const t = clamp(tamaño, 0.15, 8);
  const corre = (f) => clamp(f / Math.pow(t, 0.45) * (0.85 + 0.3 * azarEn(azar, 7)), 40, 18000);
  return {
    golpe: { ...M.golpe, frec: corre(M.golpe.frec), dur: M.golpe.dur * Math.sqrt(t), vol: M.golpe.vol * (0.6 + 0.4 * dureza) },
    cola: { ...M.cola, frec: corre(M.cola.frec), dur: M.cola.dur * Math.sqrt(t), vol: M.cola.vol },
  };
}

// Azar repetible: con la misma semilla sale lo mismo, así se puede probar.
export function azarEn(semilla, i) {
  const s = Math.sin((semilla + 1) * 127.1 + i * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// Una tanda de golpes seguidos (pasos, un martillo, la lluvia sobre la chapa) no puede
// repetir el mismo valor: el oído lo detecta enseguida y suena a máquina. Esto entrega
// variaciones que no se repiten hasta agotar la vuelta.
export function ronda(cuantas = 6) {
  let i = Math.floor(Math.random() * cuantas);
  const orden = Array.from({ length: cuantas }, (_, k) => k);
  for (let k = cuantas - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [orden[k], orden[j]] = [orden[j], orden[k]]; }
  return () => { i = (i + 1) % cuantas; return orden[i] / cuantas; };
}

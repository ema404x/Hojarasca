// La voz de los invasores.
//
// Un gruñido no es un oscilador bajando de tono. Lo que da miedo de verdad son cuatro
// cosas que hace cualquier garganta grande y ninguna hacía el juego hasta ahora:
//
//   · El subarmónico. Los animales grandes y asustados meten un segundo tono una
//     octava abajo que late contra el primero. El oído escucha dos voces en un cuerpo
//     y no sabe cuántos son. Es el truco más viejo y el que más funciona.
//   · La aspereza. Una modulación en anillo de 25 a 90 Hz rompe el tono en granos:
//     eso es el gruñido. Arriba de 90 Hz deja de ser gruñido y pasa a ser zumbido.
//   · Los formantes. Tres filtros resonantes en las frecuencias de una garganta y una
//     boca. Sin esto el ruido es ruido; con esto el ruido tiene cuerpo, y el cuerpo
//     tiene tamaño. Los formantes graves suenan enormes.
//   · El desorden. Ningún animal sostiene el tono. Un temblor irregular y un poco de
//     distorsión convierten una nota en algo vivo.
//
// Acá están las recetas, puras y sin audio. El motor las arma en `sonido.js`.

// formantes: [Hz, Q, nivel] · los dos primeros deciden el tamaño que uno imagina
export const VOCES = {
  // El rastreador: flaco, rápido, agudo. Chasquea más de lo que gruñe.
  rastreador: {
    base: 152, sub: 0.4, aspereza: 38, temblor: 7.5, aliento: 0.4, distorsion: 0.3, cuerpo: 1,
    formantes: [[440, 7, 1], [1240, 10, 0.5], [2700, 12, 0.22]],
  },
  // El tirador: más alto y más seco, con un filo metálico del orbe que carga.
  tirador: {
    base: 138, sub: 0.3, aspereza: 46, temblor: 5.5, aliento: 0.3, distorsion: 0.42, cuerpo: 1,
    formantes: [[380, 9, 1], [1480, 12, 0.6], [3300, 14, 0.3]],
  },
  // El saltador: chico, histérico, casi un chillido de insecto.
  saltador: {
    base: 268, sub: 0.18, aspereza: 72, temblor: 11, aliento: 0.22, distorsion: 0.25, cuerpo: 0.62,
    formantes: [[720, 8, 1], [2100, 11, 0.7], [4400, 13, 0.34]],
  },
  // El escupidor: la glándula le hace burbujear la garganta.
  escupidor: {
    base: 104, sub: 0.55, aspereza: 27, temblor: 4.2, aliento: 0.75, distorsion: 0.35, cuerpo: 1.25,
    formantes: [[300, 6, 1], [860, 8, 0.66], [1900, 10, 0.3]],
  },
  // El bruto: pura caja torácica. Formantes bien abajo.
  bruto: {
    base: 72, sub: 0.7, aspereza: 22, temblor: 3.4, aliento: 0.5, distorsion: 0.5, cuerpo: 1.8,
    formantes: [[190, 6, 1], [560, 7, 0.6], [1250, 9, 0.24]],
  },
  // El jefe del nido: el bruto llevado al extremo. Tanto subarmónico que el tono real
  // casi no se escucha, y una cola larguísima: el valle entero se entera.
  jefe: {
    base: 54, sub: 1, aspereza: 17, temblor: 2.6, aliento: 0.6, distorsion: 0.62, cuerpo: 2.6,
    formantes: [[124, 5, 1], [380, 6, 0.72], [880, 8, 0.3]],
  },
  // El nido no tiene garganta: es un latido enterrado. Casi todo por debajo de los
  // 60 Hz, que es lo que se siente en el pecho antes de escucharse.
  nido: {
    base: 33, sub: 0.85, aspereza: 9, temblor: 1.1, aliento: 0.9, distorsion: 0.2, cuerpo: 3.4,
    formantes: [[78, 4, 1], [214, 5, 0.5], [520, 7, 0.16]],
  },
};

// Qué le pasa a la voz según lo que el bicho está haciendo.
// tono: [multiplicador al empezar, al terminar] · la caída al final es lo que suena a
// animal; la subida, a alarma.
export const ESTADOS = {
  // Acecho: lo peor que puede escucharse. Bajo, largo, casi sin abrir la boca, y lejos.
  acecho: { dur: 2.2, tono: [0.88, 0.8], vol: 0.36, ataque: 0.5, aspereza: 0.55, aliento: 1.7, distorsion: 0.5, cola: 1.5, boca: 0.15 },
  // Alerta: te vio. Sube.
  alerta: { dur: 0.85, tono: [1, 1.42], vol: 0.8, ataque: 0.04, aspereza: 1.2, aliento: 0.8, distorsion: 1, cola: 1.1, boca: 0.75 },
  // Ataque: el grito de la embestida. Arranca arriba y se quiebra.
  ataque: { dur: 1.15, tono: [1.55, 0.92], vol: 1, ataque: 0.012, aspereza: 1.6, aliento: 0.7, distorsion: 1.5, cola: 0.9, boca: 1 },
  // Dolor: corto, agudo, cortado de golpe.
  dolor: { dur: 0.42, tono: [1.7, 1.1], vol: 0.9, ataque: 0.008, aspereza: 1.9, aliento: 0.5, distorsion: 1.7, cola: 0.5, boca: 0.9 },
  // Muerte: la caída larga. El subarmónico se desarma y queda el aliento.
  muerte: { dur: 1.9, tono: [1.15, 0.28], vol: 0.95, ataque: 0.02, aspereza: 1.3, aliento: 2.2, distorsion: 1.2, cola: 1.6, boca: 0.8, desarma: true },
  // Llamado: le avisa al resto. Dos tonos, el segundo más alto.
  llamado: { dur: 1.5, tono: [0.95, 1.25], vol: 0.85, ataque: 0.18, aspereza: 0.8, aliento: 1, distorsion: 0.8, cola: 1.8, boca: 0.6 },
  // Respiración: el bucle de cuando lo tenés al lado y no lo ves.
  respiro: { dur: 1.3, tono: [0.92, 0.86], vol: 0.3, ataque: 0.35, aspereza: 0.35, aliento: 2.6, distorsion: 0.2, cola: 0.6, boca: 0.1 },
  // Latido del nido.
  latido: { dur: 1.1, tono: [1, 0.9], vol: 0.55, ataque: 0.12, aspereza: 0.5, aliento: 1.2, distorsion: 0.4, cola: 2.2, boca: 0 },
};

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const azarEn = (semilla, i) => { const s = Math.sin((semilla + 1) * 91.7 + i * 217.3) * 43758.5453; return s - Math.floor(s); };

// Junta la garganta con lo que está haciendo y devuelve números concretos.
// `intensidad` va de 0 a 1 y es cuánto le está poniendo: mueve el tono, la aspereza y
// la distorsión a la vez, que es lo que pasa cuando un animal se esfuerza.
export function voz(tipo, estado, { intensidad = 0.7, azar = 0, escala = 1 } = {}) {
  const V = VOCES[tipo] || VOCES.rastreador;
  const E = ESTADOS[estado] || ESTADOS.alerta;
  const i = clamp(intensidad, 0, 1);
  const desafina = 1 + (azarEn(azar, 0) - 0.5) * 0.16;     // ningún bicho suena igual a otro
  const base = clamp((V.base / escala) * E.tono[0] * desafina * (0.92 + i * 0.22), 18, 2000);
  return {
    base,
    // el final del barrido de tono, que es lo que le da la forma a la frase
    fin: clamp(base * (E.tono[1] / E.tono[0]), 16, 2400),
    dur: E.dur * (0.85 + azarEn(azar, 1) * 0.3) * (1 + (V.cuerpo - 1) * 0.22),
    ataque: E.ataque,
    vol: E.vol * (0.7 + i * 0.4),
    // el subarmónico: la segunda voz, una octava abajo
    sub: clamp(V.sub * (E.desarma ? 1.35 : 1), 0, 1.4),
    // la modulación en anillo que hace el grano del gruñido
    aspereza: clamp(V.aspereza * E.aspereza * (0.8 + i * 0.5) * (0.9 + azarEn(azar, 2) * 0.2), 5, 130),
    temblor: V.temblor * (0.7 + i * 0.8),
    aliento: V.aliento * E.aliento,
    distorsion: clamp(V.distorsion * E.distorsion * (0.6 + i * 0.7), 0, 1),
    // los formantes bajan cuando el bicho es más grande y cuando grita con la boca
    // abierta suben un poco: es el mismo caño con otra apertura
    formantes: V.formantes.map(([f, q, n], k) => [
      clamp((f / escala) * (1 + E.boca * 0.18) * (1 + (azarEn(azar, 3 + k) - 0.5) * 0.09), 40, 9000), q, n,
    ]),
    cola: E.cola,
    boca: E.boca,
    desarma: !!E.desarma,
  };
}

// De lejos no se escucha una garganta: se escucha lo que queda de ella después de
// cruzar el valle. El aire se come los agudos, la cola crece y el subarmónico es lo
// único que llega entero. A 90 metros un grito es un temblor en el pecho.
export function lejania(distancia) {
  const d = clamp(distancia, 0, 160);
  return {
    corte: clamp(15000 - d * 165, 320, 15000),   // pasabajos del aire
    volumen: clamp(1 - d / 190, 0.05, 1),
    reverb: clamp(0.35 + d / 110, 0.35, 1.7),
    sub: clamp(1 + d / 90, 1, 2.6),              // lo grave es lo que sobrevive
    retardo: d / 340,                            // la velocidad del sonido, en segundos
  };
}

// Cada cuánto abre la boca un invasor que no está peleando. Nunca en un ritmo parejo:
// la espera es la mitad del miedo.
export function esperaVoz(estado, cerca) {
  const base = estado === 'acecho' ? 7.5 : estado === 'respiro' ? 3.2 : 11;
  return base * (0.55 + Math.random() * 0.9) * (cerca ? 0.65 : 1);
}

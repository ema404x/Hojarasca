// 2.5: el arsenal del Desafío. Dieciocho cosas nuevas para pelear: armas de mano y de
// tiro, arrojadizas que se levantan del suelo, flechas de tres clases con el carcaj,
// el arco que se tensa, el escudo de tablas, la armadura, las bengalas, el humo, las
// granadas y el cuerno que llama a los compañeros.
//
// Módulo puro (se prueba en Node): acá están los números y las reglas. Lo que se ve y
// lo que se mueve vive en desafio-arsenal-mundo.js, y desafio.js lo engancha.

// ---------------------------------------------------------------- las armas
// `tipo` decide cómo se usa (ver `atacar` en desafio.js): 'cuerpo' pega al que tenés
// adelante, los demás tiran algo. `municion` es el contador del Desafío que gastan.
export const ARSENAL = {
  ballesta: { nombre: 'Ballesta de mano', tipo: 'perno', dano: 70, vel: 62, cadencia: 1.6, municion: 'virotes', atraviesa: 1 },
  facon: { nombre: 'Facón', tipo: 'cuerpo', dano: 22, alcance: 1.9, cadencia: 0.32, espalda: 2 },
  maza: { nombre: 'Maza con clavos', tipo: 'cuerpo', dano: 55, alcance: 2.4, cadencia: 1.25, contraPesados: 1.5, aturde: 1.1 },
  arpon: { nombre: 'Arpón dorado', tipo: 'arpon', dano: 25, vel: 44, cadencia: 0.6, arrastra: 0.8 },
  hachuela: { nombre: 'Hachas arrojadizas', tipo: 'hachuela', dano: 45, vel: 26, cadencia: 0.7, municion: 'hachuelas', derriba: 0.9 },
  jabalina: { nombre: 'Jabalinas de coihue', tipo: 'jabalina', dano: 62, vel: 34, cadencia: 1.0, municion: 'jabalinas' },
  granada: { nombre: 'Granadas doradas', tipo: 'granada', dano: 75, vel: 17, cadencia: 1.0, municion: 'granadas', radio: 4 },
  humo: { nombre: 'Bombas de humo', tipo: 'humo', vel: 15, cadencia: 1.0, municion: 'humos', radio: 7, dura: 9 },
  bengala: { nombre: 'Bengalas', tipo: 'bengala', vel: 26, cadencia: 1.2, municion: 'bengalas', radio: 34, dura: 30 },
  cuerno: { nombre: 'Cuerno de guardia', tipo: 'cuerno', cadencia: 40, radio: 16, duda: 1.4 },
};
// Mejoras (se suman al arma, como las de cristal de siempre).
export const MEJORAS_ARSENAL = {
  ballestaRepeticion: { arma: 'ballesta', nombre: 'Ballesta de repetición', rafaga: 3, entreTiros: 0.2, cadencia: 2.4 },
  boleadorasCristal: { arma: 'boleadoras', nombre: 'Boleadoras doradas', descarga: { dano: 15, radio: 3, aturde: 0.6 } },
};
// Las que se levantan del suelo después de tirarlas (de día o de noche).
export const RECUPERABLES = { hachuela: 'hachuelas', jabalina: 'jabalinas' };
// Todos los contadores del Desafío que son munición (el taller los suma, el guardado
// los sanea).
export const MUNICIONES = ['virotes', 'flechasFuego', 'flechasCristal', 'hachuelas', 'jabalinas', 'granadas', 'humos', 'bengalas'];
export const TOPE_MUNICION = 99;

// ---------------------------------------------------------------- flechas y carcaj
// Con el carcaj, clic derecho con el arco en la mano pasa a la siguiente clase de flecha
// que tengas. Sin carcaj, sólo las comunes.
export const FLECHAS = {
  comun: { nombre: 'comunes', contador: 'flechas' },
  fuego: { nombre: 'incendiarias', contador: 'flechasFuego', quema: true },
  cristal: { nombre: 'doradas', contador: 'flechasCristal', perfora: true },
};
export const ORDEN_FLECHAS = ['comun', 'fuego', 'cristal'];
export const tipoFlecha = (d) => (d?.flechaTipo && Object.hasOwn(FLECHAS, d.flechaTipo) ? d.flechaTipo : 'comun');
export const flechasDe = (d, tipo = tipoFlecha(d)) => Math.max(0, Math.floor(Number(d?.[FLECHAS[tipo].contador]) || 0));
// La siguiente clase que tenga flechas; si no hay ninguna otra, se queda donde está.
export function siguienteFlecha(d) {
  const i = ORDEN_FLECHAS.indexOf(tipoFlecha(d));
  for (let k = 1; k <= ORDEN_FLECHAS.length; k++) {
    const t = ORDEN_FLECHAS[(i + k) % ORDEN_FLECHAS.length];
    if (flechasDe(d, t) > 0) return t;
  }
  return tipoFlecha(d);
}
// Lo que hacen al entrar.
export const QUEMA = { dps: 9, dura: 4, prende: 1.8 };      // prende: radio para la zanja y los barriles
export const PERFORA = { contraPesados: 1.6, atraviesa: 1 };

// ---------------------------------------------------------------- el arco tensado
// Manteniendo el clic se tensa: hasta un 60% más de daño y un 35% más de alcance.
export const TENSION = { min: 0.15, lleno: 1.1, dano: 0.6, vel: 0.35 };
export function factorTension(segundos) {
  const t = Number(segundos) || 0;
  if (t < TENSION.min) return { dano: 1, vel: 1, k: 0 };
  const k = Math.min(1, (t - TENSION.min) / (TENSION.lleno - TENSION.min));
  return { dano: 1 + TENSION.dano * k, vel: 1 + TENSION.vel * k, k };
}

// ---------------------------------------------------------------- defensa personal
// Escudo de tablas: con clic derecho bloquea con cualquier arma de una mano.
export const RODELA = { pasa: 0.35 };
export const UNA_MANO = ['facon', 'honda', 'pistola', 'martillo', 'cuerno', 'hachuela', 'granada', 'humo', 'bengala'];
// ¿Con qué se bloquea lo que tenés en la mano? 'lanza' (la de siempre), 'rodela' o null.
export function conQueBloquea(id, cosas = {}) {
  if (id === 'lanza' && cosas.lanza) return 'lanza';
  if (cosas.rodela && UNA_MANO.includes(id)) return 'rodela';
  return null;
}
// Chaleco: le saca un quinto a cada golpe. Las placas de cristal aguantan entero el
// primer golpe de cada noche.
export const ARMADURA = { chaleco: 0.8 };
export function danoConArmadura(n, cosas = {}, d = {}, noche = null) {
  let x = Math.max(0, Number(n) || 0);
  if (cosas.placasCristal && noche !== null && d.placasNoche !== noche && x > 0) return { dano: 0, placas: true };
  if (cosas.chaleco) x *= ARMADURA.chaleco;
  return { dano: x, placas: false };
}

// ---------------------------------------------------------------- lo que le pasa al invasor
// Contra los grandes (bruto, jefe, escupidor pesado) algunas armas rinden más.
export function danoContra(arma, def, dano) {
  const pesado = !!def?.pesado;
  if (pesado && arma?.contraPesados) return dano * arma.contraPesados;
  return dano;
}
// El facón por la espalda: el doble.
export function danoPorEspalda(arma, dano, impacto) {
  if (!arma?.espalda || !impacto?.porDetras) return dano;
  return dano * arma.espalda;
}
// La granada: todo el daño en el centro, un tercio en el borde.
export function danoDeExplosion(dano, radio, distancia) {
  if (distancia >= radio) return 0;
  return dano * (1 - (distancia / radio) * 0.67);
}

// ---------------------------------------------------------------- el taller
// Categorías nuevas para que ninguna pase de nueve (los números del teclado). Van al final:
// las de siempre quedan en su lugar (Tab + número, como antes).
export const CATEGORIAS_ARSENAL = [
  { clave: 'arrojadizas', nombre: 'Arrojadizas', despuesDe: 'base' },
  { clave: 'equipo', nombre: 'Equipo', despuesDe: 'arrojadizas' },
];
export const RECETAS_ARSENAL = [
  { id: 'ballesta', cat: 'armas', nombre: 'Ballesta de mano', pide: { tabla: 3, tronco: 1, piedra: 2 }, da: { cosa: 'ballesta', virotes: 6 }, unica: true, banco: true,
    texto: 'Un virote pesado que atraviesa al primero y sigue. Recarga lenta. Se fabrica junto a un banco.' },
  { id: 'facon', cat: 'armas', nombre: 'Facón', pide: { piedra: 2, tabla: 1 }, da: { cosa: 'facon' }, unica: true,
    texto: 'Cuerpo a cuerpo, rapidísimo. Por la espalda pega el doble.' },
  { id: 'maza', cat: 'armas', nombre: 'Maza con clavos', pide: { tronco: 2, piedra: 3 }, da: { cosa: 'maza' }, unica: true,
    texto: 'Pesada y lenta: aturde, y contra los grandes pega la mitad más.' },
  { id: 'arpon', cat: 'armas', nombre: 'Arpón dorado', pide: { cristal: 3, tronco: 1, tabla: 1 }, da: { cosa: 'arpon' }, unica: true,
    texto: 'Engancha al duende y lo arrastra hacia vos (o hacia tus trampas). Vuelve solo.' },
  { id: 'virotes', cat: 'municion', nombre: 'Seis virotes', pide: { tabla: 1, piedra: 2 }, da: { virotes: 6 }, banco: true, requiere: 'ballesta',
    texto: 'Para la ballesta de mano.' },
  { id: 'flechas-fuego', cat: 'municion', nombre: 'Cuatro flechas incendiarias', pide: { tronco: 1, ramita: 2 }, da: { flechasFuego: 4 }, banco: true, requiere: 'arco',
    texto: 'Punta con resina: el duende arde unos segundos. Clavadas cerca prenden la zanja y hacen estallar los barriles. Se eligen con el carcaj.' },
  { id: 'flechas-cristal', cat: 'municion', nombre: 'Cuatro flechas doradas', pide: { cristal: 1, tabla: 1 }, da: { flechasCristal: 4 }, banco: true, requiere: 'arco',
    texto: 'Atraviesan al primero y contra los grandes pegan más. Se eligen con el carcaj.' },
  { id: 'hachuelas', cat: 'arrojadizas', nombre: 'Dos hachas arrojadizas', pide: { tronco: 1, piedra: 2 }, da: { hachuelas: 2, cosa: 'hachuela' },
    texto: 'Se tiran girando y derriban al que corre. Después se levantan del suelo.' },
  { id: 'jabalinas', cat: 'arrojadizas', nombre: 'Dos jabalinas', pide: { tronco: 2, piedra: 1 }, da: { jabalinas: 2, cosa: 'jabalina' },
    texto: 'De coihue con punta de piedra: llegan lejos y pegan fuerte. Se levantan del suelo.' },
  { id: 'granadas', cat: 'arrojadizas', nombre: 'Dos granadas doradas', pide: { cristal: 1, piedra: 1 }, da: { granadas: 2, cosa: 'granada' },
    texto: 'Estallan al tocar algo: mucho daño alrededor. No la tires cerca tuyo.' },
  { id: 'humos', cat: 'arrojadizas', nombre: 'Dos bombas de humo', pide: { ramita: 2, tabla: 1 }, da: { humos: 2, cosa: 'humo' },
    texto: 'Resina y hojas húmedas: el humo les hace perder tu rastro unos segundos.' },
  { id: 'bengalas', cat: 'arrojadizas', nombre: 'Tres bengalas', pide: { ramita: 2, cristal: 1 }, da: { bengalas: 3, cosa: 'bengala' },
    texto: 'Se tiran para arriba: iluminan medio minuto y dejan a la vista a todos los que haya cerca, aun a los oscuros.' },
  { id: 'rodela', cat: 'equipo', nombre: 'Escudo de tablas', pide: { tabla: 3, tronco: 1 }, da: { cosa: 'rodela' }, unica: true,
    texto: 'Con un arma de una mano (facón, hacha, honda, pistola...), clic derecho sostenido bloquea.' },
  { id: 'chaleco', cat: 'equipo', nombre: 'Chaleco acolchado', pide: { tabla: 3, ramita: 2 }, da: { cosa: 'chaleco' }, unica: true,
    texto: 'Lana apretada entre tablillas: cada golpe te saca un quinto menos.' },
  { id: 'carcaj', cat: 'equipo', nombre: 'Carcaj', pide: { tabla: 2, ramita: 1 }, da: { cosa: 'carcaj' }, unica: true, requiere: 'arco',
    texto: 'Con el arco en la mano, clic derecho cambia de flecha: comunes, incendiarias o doradas.' },
  { id: 'cuerno', cat: 'equipo', nombre: 'Cuerno de guardia', pide: { tronco: 1, piedra: 1 }, da: { cosa: 'cuerno' }, unica: true,
    texto: 'Soplalo: los compañeros vienen a tu lado y los duendes cerca dudan un instante.' },
  { id: 'ballesta-repeticion', cat: 'mejoras', nombre: 'Ballesta de repetición', pide: { cristal: 4, tabla: 2 }, da: { cosa: 'ballestaRepeticion' }, unica: true, requiere: 'ballesta', banco: true,
    texto: 'Tres virotes seguidos en cada tiro, y después una recarga más larga.' },
  { id: 'boleadoras-cristal', cat: 'mejoras', nombre: 'Boleadoras doradas', pide: { cristal: 3, piedra: 1 }, da: { cosa: 'boleadorasCristal' }, unica: true, requiere: 'boleadoras',
    texto: 'Además de enredar, les dan un chispazo dorado a los que están alrededor.' },
  { id: 'placas-cristal', cat: 'mejoras', nombre: 'Placas doradas', pide: { cristal: 4, tabla: 1 }, da: { cosa: 'placasCristal' }, unica: true, requiere: 'chaleco',
    texto: 'Cosidas al chaleco: el primer golpe de cada noche no te hace nada.' },
];

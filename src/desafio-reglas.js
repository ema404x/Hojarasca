// Modo Desafío: reglas puras (sin Three.js), para que se puedan probar sin GPU.
// Horario de las invasiones, oleadas, armas, recetas y resistencia de las obras.
import { sanearNido } from './desafio-nido.js';
import { sanearAsedio } from './desafio-asedio.js';
import { APAGON, sanearBestiario, sanearDespues } from './desafio-noche2.js';
import { EXCAVADOR, sanearRescates } from './desafio-valle.js';
import { multiplicadorVuelta } from './desafio-vuelta.js';
import { sanearOrdenes } from './desafio-ordenes.js';
import { VOLADOR, voladoresEnLaNoche } from './desafio-cielo.js';
import { sanearCapullos } from './desafio-infestacion.js';
import { sanearVarada } from './desafio-varada.js';
import { normalizarCodigo } from './semilla.js';
import { sanearMapaGuardado } from './desafio-mapa.js';
import { ARSENAL, MEJORAS_ARSENAL, RECETAS_ARSENAL, CATEGORIAS_ARSENAL, MUNICIONES, TOPE_MUNICION, FLECHAS } from './desafio-arsenal.js';
import { evolucionNueva, sanearEvolucion } from './desafio-evolucion.js';
import { puestosNuevos, sanearPuestos } from './desafio-puestos.js';

export const HORA_ATAQUE = 20.5;     // la nave aparece al caer la noche
export const HORA_AMANECER = 6.0;    // con la primera luz los invasores se retiran
export const SALUD_MAX = 100;

// La noche "pertenece" al día en que empezó: después de medianoche el contador
// de días ya avanzó, pero la oleada sigue siendo la misma.
export function claveNoche(dia, horas) { return horas >= 12 ? dia : dia - 1; }
export function esHoraDeAtaque(horas) { return horas >= HORA_ATAQUE || horas < HORA_AMANECER; }

// Horas de juego hasta `objetivo`, convertidas a segundos reales según cuántos
// minutos dura un día completo (ajuste `duracion`).
export function segundosHasta(horas, objetivo, duracionMin) {
  let h = objetivo - horas;
  if (h < 0) h += 24;
  const minutos = Number.isFinite(Number(duracionMin)) ? Number(duracionMin) : 1440;
  return (h * minutos * 60) / 24;
}
export function relojCorto(seg) {
  const s = Math.max(0, Math.round(seg));
  const m = Math.floor(s / 60), r = s % 60;
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m}:${String(r).padStart(2, '0')}`;
}

// ---------------------------------------------------------------- invasores
export const TIPOS_ALIEN = {
  rastreador: { nombre: 'rastreador', vida: 40, vel: 4.3, dano: 8, cadencia: 1.0, alcance: 1.55, danoObra: 12, radio: 0.42, altura: 1.72, cristales: [0, 1], retroceso: 1 },
  bruto: { nombre: 'bruto', vida: 180, vel: 2.3, dano: 22, cadencia: 1.7, alcance: 2.1, danoObra: 42, radio: 0.9, altura: 2.55, cristales: [2, 3], retroceso: 0.2, pesado: true },
  tirador: { nombre: 'tirador', vida: 60, vel: 3.1, dano: 9, cadencia: 2.3, alcance: 24, distancia: 13, danoObra: 8, radio: 0.46, altura: 2.02, cristales: [1, 2], retroceso: 0.8, aDistancia: true },
  // Chico, liviano y rapidísimo: no se gasta en romper la empalizada, la salta de una.
  // Aguanta muy poco y pega poco, pero te aparece adentro de la base.
  saltador: { nombre: 'saltador', vida: 26, vel: 5.4, dano: 5, cadencia: 0.8, alcance: 1.4, danoObra: 5, radio: 0.32, altura: 1.38, cristales: [0, 1], retroceso: 1.5, salta: true },
  // Pesado y lento: se planta a media distancia y escupe ácido en arco. El ácido
  // lastima al jugador y come la madera y la piedra de las defensas.
  // `cuerpo` es el alcance del zarpazo, aparte del alcance del escupitajo: sin eso
  // se quedaría clavado pegándole a una pared desde veinte metros.
  escupidor: { nombre: 'escupidor', vida: 95, vel: 1.9, dano: 12, cadencia: 2.6, alcance: 18, distancia: 9, cuerpo: 2, danoObra: 26, radio: 0.55, altura: 2.1, cristales: [1, 2], retroceso: 0.5,
    aDistancia: true, acido: true, velProyectil: 16, salpicadura: 2.3 },
  // El jefe del nido: uno solo, cada cinco noches. Enorme, durísimo y con los sacos
  // bioluminiscentes de la espalda al descubierto: ahí recibe el doble de daño.
  // `giro` es lo rápido que se da vuelta: el jefe es tan pesado que se lo puede
  // rodear corriendo, y por eso el punto débil de la espalda se puede aprovechar.
  jefe: { nombre: 'jefe de nido', vida: 900, vel: 2.0, dano: 34, cadencia: 1.9, alcance: 3.4, danoObra: 130, radio: 1.45, altura: 4.2, cristales: [14, 20], retroceso: 0,
    giro: 1.1, pesado: true, jefe: true, puntoDebil: true },
  // 2.1: no salta ni rompe: cava por abajo y sale adentro (ver `desafio-valle.js`)
  excavador: { ...EXCAVADOR },
  // 2.3: el que viene por el aire y apaga las antorchas (ver `desafio-cielo.js`)
  volador: { ...VOLADOR },
};

// El jefe baja la noche 5 y cada cinco noches (5, 10, 15 y 20).
export const NOCHE_JEFE = 5;
export function esNocheDeJefe(n) {
  const noche = Math.floor(n);
  return noche >= NOCHE_JEFE && noche % NOCHE_JEFE === 0;
}

// Punto débil: los sacos de la espalda del jefe, del 60% de su altura para arriba
// (ahí es donde están modelados). Hay que rodearlo para pegarles; de frente el
// caparazón aguanta lo normal.
export const PUNTO_DEBIL = { desde: 0.6, hasta: 1, multiplicador: 2 };
// `impacto` = { alturaRel: 0..1 sobre la altura del invasor, porDetras: bool }.
export function danoEnPuntoDebil(def, dano, impacto = null) {
  if (!def?.puntoDebil || !impacto) return dano;
  const alturaRel = Number(impacto.alturaRel);
  if (!impacto.porDetras || !Number.isFinite(alturaRel)) return dano;
  if (alturaRel < PUNTO_DEBIL.desde || alturaRel > PUNTO_DEBIL.hasta) return dano;
  return dano * PUNTO_DEBIL.multiplicador;
}

// El saltador pasa por arriba de lo bajo. Las obras reforzadas rematan en puntas,
// zunchos y almenas: por esas no pasa ninguno, aunque midan parecido.
export const ALTURA_SALTO = 2.7;
export const NO_SALTABLES = ['empalizada-reforzada', 'muro-almenado', 'porton-empalizada'];
export function puedeSaltar(plano) {
  if (!plano || NO_SALTABLES.includes(plano.id)) return false;
  return (plano.alto || 1) <= ALTURA_SALTO;
}

// Dificultad elegida en la portada: cuántos vienen, cuánto pegan y cuánto aguantan.
export const DIFICULTADES = {
  tranquila: { nombre: 'Tranquila', cantidad: 0.6, dano: 0.55, vida: 0.8, texto: 'Pocos invasores y golpes suaves. Para aprender a defenderse.' },
  normal: { nombre: 'Normal', cantidad: 1, dano: 1, vida: 1, texto: 'La noche es peligrosa, pero con defensas se resiste.' },
  implacable: { nombre: 'Implacable', cantidad: 1.4, dano: 1.35, vida: 1.25, texto: 'Más invasores, más duros. Cada error se paga.' },
};
export function dificultad(clave) { return DIFICULTADES[clave] || DIFICULTADES.normal; }

// Composición de la oleada número `n` (1 = primera noche). El jefe ocupa el lugar
// de un invasor común, así que la noche que baja no vienen más bichos que antes.
// El jefe va siempre último: los refuerzos que cortan la lista no se lo llevan.
export function composicionOleada(n, claveDificultad = 'normal', vuelta = 0) {
  const noche = Math.max(1, Math.floor(n));
  const total = Math.max(2, Math.min(24, Math.round(Math.min(18, 3 + (noche - 1) * 2) * dificultad(claveDificultad).cantidad * multiplicadorVuelta(vuelta).cantidad)));
  const jefes = esNocheDeJefe(noche) ? 1 : 0;
  const comunes = Math.max(1, total - jefes);
  const brutos = noche >= 2 ? Math.min(4, Math.floor(comunes / 5) + (noche >= 5 ? 1 : 0)) : 0;
  let tiradores = noche >= 3 ? Math.min(5, Math.floor(comunes / 4)) : 0;
  let saltadores = noche >= 3 ? Math.min(5, Math.round(comunes / 5)) : 0;
  const escupidores = noche >= 6 ? Math.min(4, Math.floor(comunes / 6)) : 0;
  // 2.1: los excavadores, desde la noche 7
  const excavadores = noche >= 7 ? Math.min(3, Math.floor(comunes / 7)) : 0;
  // 2.3: los voladores, desde la noche 8. Salen de los cupos del saltador y del tirador
  // (los otros que no se frenan en la empalizada), así el total de la noche no cambia.
  let voladores = 0;
  for (let i = 0; i < voladoresEnLaNoche(noche, comunes); i++) {
    if (i % 2 === 0 && saltadores > 1) { saltadores--; voladores++; }
    else if (tiradores > 1) { tiradores--; voladores++; }
    else if (saltadores > 1) { saltadores--; voladores++; }
  }
  const rastreadores = Math.max(1, comunes - brutos - tiradores - saltadores - escupidores - excavadores - voladores);
  const lista = [];
  for (let i = 0; i < rastreadores; i++) lista.push('rastreador');
  for (let i = 0; i < brutos; i++) lista.push('bruto');
  for (let i = 0; i < tiradores; i++) lista.push('tirador');
  for (let i = 0; i < saltadores; i++) lista.push('saltador');
  for (let i = 0; i < escupidores; i++) lista.push('escupidor');
  for (let i = 0; i < excavadores; i++) lista.push('excavador');
  for (let i = 0; i < voladores; i++) lista.push('volador');
  for (let i = 0; i < jefes; i++) lista.push('jefe');
  return lista;
}
// La lista sin el jefe: para los refuerzos de madrugada y lo que larga la nodriza.
export function sinJefe(lista) { return lista.filter((t) => t !== 'jefe'); }
// Con cada noche los invasores pegan y aguantan un poco más.
export function multiplicadorNoche(n) { return 1 + Math.max(0, Math.floor(n) - 1) * 0.08; }

// ---------------------------------------------------------------- armas del jugador
export const ARMAS = {
  hacha: { nombre: 'Hacha de mano', tipo: 'cuerpo', dano: 20, alcance: 2.3, cadencia: 0.6 },
  lanza: { nombre: 'Lanza de coihue', tipo: 'cuerpo', dano: 34, alcance: 2.9, cadencia: 0.55, bloquea: true },
  arco: { nombre: 'Arco de lenga', tipo: 'flecha', dano: 42, vel: 48, cadencia: 0.75, municion: 'flechas' },
  honda: { nombre: 'Honda de cuero', tipo: 'piedra', dano: 18, vel: 36, cadencia: 0.42, municion: 'piedra', deMaterial: true },
  boleadoras: { nombre: 'Boleadoras', tipo: 'boleadora', dano: 8, vel: 24, cadencia: 1.1, municion: 'boleadoras', enreda: 3.4 },
  pistola: { nombre: 'Pistola de plasma', tipo: 'rayo', dano: 58, alcance: 75, cadencia: 0.32, municion: 'cargas' },
  martillo: { nombre: 'Martillo de carpintero', tipo: 'martillo', alcance: 3.2, cadencia: 0.5, reparacion: 0.1 },
};
// Mejoras con cristales: cambian el arma sin reemplazarla.
export const MEJORAS = {
  lanzaCristal: { arma: 'lanza', nombre: 'Lanza con punta de cristal', dano: 52, alcance: 3.1 },
  arcoReforzado: { arma: 'arco', nombre: 'Arco reforzado', dano: 56, vel: 64 },
  pistolaCargada: { arma: 'pistola', nombre: 'Pistola con disparo cargado', cargado: { dano: 150, cargas: 3, atraviesa: true } },
};
// 2.5: el arsenal (ver desafio-arsenal.js) se suma a lo de siempre.
Object.assign(ARMAS, ARSENAL);
Object.assign(MEJORAS, MEJORAS_ARSENAL);
// El arma tal como la tiene el jugador, con sus mejoras aplicadas.
export function armaEfectiva(id, cosas = {}) {
  const base = ARMAS[id];
  if (!base) return null;
  const arma = { ...base, id };
  for (const [clave, m] of Object.entries(MEJORAS)) if (m.arma === id && cosas[clave]) Object.assign(arma, m, { nombre: m.nombre, mejorada: true });
  delete arma.arma;
  return arma;
}

// ---------------------------------------------------------------- fabricar (tecla K)
// `pide` usa materiales de construcción (tronco, tabla, piedra, cristal), ramitas
// o "fruta" (piñones, calafates y frutillas, en ese orden de uso).
export const CATEGORIAS_TALLER = [
  { clave: 'armas', nombre: 'Armas' },
  { clave: 'municion', nombre: 'Munición y curas' },
  { clave: 'mejoras', nombre: 'Mejoras con cristales' },
  { clave: 'forja', nombre: 'Forja de cristal' },
  { clave: 'base', nombre: 'Base' },
];
export const RECETAS = [
  { id: 'lanza', cat: 'armas', nombre: 'Lanza de coihue', pide: { tronco: 1, piedra: 2 }, da: { cosa: 'lanza' }, unica: true,
    texto: 'Punta de piedra atada a un asta. Clic izquierdo golpea; clic derecho sostenido bloquea.' },
  { id: 'honda', cat: 'armas', nombre: 'Honda de cuero', pide: { tabla: 1, ramita: 2 }, da: { cosa: 'honda' }, unica: true,
    texto: 'Tira piedras de tu reserva: poco daño, muy rápida y munición barata.' },
  { id: 'arco', cat: 'armas', nombre: 'Arco de lenga', pide: { tabla: 3, tronco: 1 }, da: { cosa: 'arco', flechas: 6 }, unica: true, banco: true,
    texto: 'Tira flechas lejos. Se fabrica junto a un banco de trabajo.' },
  { id: 'martillo', cat: 'armas', nombre: 'Martillo de carpintero', pide: { tronco: 1, piedra: 1 }, da: { cosa: 'martillo' }, unica: true,
    texto: 'Con el martillo en la mano reparás tocando la pieza dañada, aun en plena noche.' },
  { id: 'flechas', cat: 'municion', nombre: 'Ocho flechas', pide: { tabla: 1, piedra: 1 }, da: { flechas: 8 }, banco: true, requiere: 'arco',
    texto: 'Astiles de tabla con punta de piedra.' },
  { id: 'boleadoras', cat: 'municion', nombre: 'Tres boleadoras', pide: { piedra: 3, tabla: 1 }, da: { boleadoras: 3, cosa: 'boleadoras' },
    texto: 'Tres piedras atadas: enredan las piernas del invasor y lo dejan quieto un rato.' },
  { id: 'emplasto', cat: 'municion', nombre: 'Emplasto de hierbas', pide: { fruta: 2, ramita: 1 }, da: { emplastos: 1 },
    texto: 'Cura 45 puntos de salud. Se usa desde la barra.' },
  { id: 'cargas', cat: 'municion', nombre: 'Seis cargas de plasma', pide: { cristal: 1 }, da: { cargas: 6 }, requiere: 'pistola',
    texto: 'Un cristal de los invasores alimenta la pistola.' },
  { id: 'lanza-cristal', cat: 'mejoras', nombre: 'Punta de cristal para la lanza', pide: { cristal: 3, piedra: 2 }, da: { cosa: 'lanzaCristal' }, unica: true, requiere: 'lanza',
    texto: 'La lanza pega 52 en lugar de 34 y llega un poco más lejos.' },
  { id: 'arco-reforzado', cat: 'mejoras', nombre: 'Arco reforzado con cristal', pide: { cristal: 3, tabla: 2 }, da: { cosa: 'arcoReforzado' }, unica: true, requiere: 'arco', banco: true,
    texto: 'Flechas más rápidas y con más daño (56).' },
  { id: 'pistola-cargada', cat: 'mejoras', nombre: 'Condensador para la pistola', pide: { cristal: 5 }, da: { cosa: 'pistolaCargada' }, unica: true, requiere: 'pistola',
    texto: 'Clic derecho: disparo cargado que atraviesa a todos los de la línea (150, gasta 3 cargas).' },
  // 2.1: la forja de cristal (ver `desafio-valle.js`): cada arma con su efecto
  { id: 'lanza-hielo', cat: 'forja', nombre: 'Lanza de hielo', pide: { cristal: 4, piedra: 2 }, da: { cosa: 'lanzaHielo' }, unica: true, requiere: 'lanza',
    texto: 'El golpe congela: frena en seco a rastreadores y saltadores. Contra los grandes casi no sirve.' },
  { id: 'arco-rayo', cat: 'forja', nombre: 'Flechas de rayo', pide: { cristal: 5, tabla: 1 }, da: { cosa: 'arcoRayo' }, unica: true, requiere: 'arco', banco: true,
    texto: 'Cada flecha que entra suelta un rayo que salta a los dos invasores más cercanos. Para los grupos.' },
  { id: 'honda-empuje', cat: 'forja', nombre: 'Honda de empuje', pide: { cristal: 3, tronco: 1 }, da: { cosa: 'hondaEmpuje' }, unica: true, requiere: 'honda',
    texto: 'La piedra empuja y derriba: el tirador y el escupidor quedan en el suelo sin poder apuntar.' },
  { id: 'reparar', cat: 'base', nombre: 'Reparar la defensa más dañada cerca', pide: {}, reparar: true,
    texto: 'Cuesta un tronco o una piedra por cada 30% de resistencia recuperada.' },
  { id: 'reforzar', cat: 'base', nombre: 'Reforzar la defensa más cercana', pide: {}, reforzar: true,
    texto: 'Empalizada → empalizada reforzada · pirca → muro almenado. Resisten mucho más.' },
  // 1.11: contra el excavador
  { id: 'cimentar', cat: 'base', nombre: 'Echar cimiento de piedra', pide: {}, cimentar: true,
    texto: 'Zanja y piedras al pie de la empalizada o el portón más cercano: el excavador ya no pasa por debajo.' },
];
// 2.5: las recetas del arsenal y sus dos categorías nuevas
RECETAS.push(...RECETAS_ARSENAL);
for (const c of CATEGORIAS_ARSENAL) {
  const i = CATEGORIAS_TALLER.findIndex((x) => x.clave === c.despuesDe);
  CATEGORIAS_TALLER.splice(i < 0 ? CATEGORIAS_TALLER.length : i + 1, 0, { clave: c.clave, nombre: c.nombre });
}
// Qué defensa se convierte en cuál al reforzarla, y cuánto cuesta.
export const REFUERZOS = {
  empalizada: { a: 'empalizada-reforzada', pide: { tronco: 2, piedra: 4 } },
  'muro-piedra': { a: 'muro-almenado', pide: { piedra: 8, tabla: 2 } },
  'porton-empalizada': { a: 'porton-reforzado', pide: { tronco: 3, piedra: 4 } },
};

// ---------------------------------------------------------------- noches y mundo
export const NOCHE_FINAL = 20;
export const ESPECIALES = {
  roja: { nombre: 'Noche roja', aviso: 'El cielo del oeste se tiñe de rojo', cantidad: 1.8 },
  eclipse: { nombre: 'Eclipse', aviso: 'La luna se está apagando', cantidad: 1, velocidad: 1.12 },
  silenciosa: { nombre: 'Noche silenciosa', aviso: 'No se oye ni un pájaro. Algo acecha de lejos', cantidad: 0.8, soloTiradores: true },
  // 2.0: las antorchas se apagan de a una (ver `desafio-noche2.js`)
  apagon: { ...APAGON },
};
// Desde la noche 4, a veces la noche es especial (nunca dos seguidas, nunca la
// final y nunca la del jefe: con el jefe ya hay bastante).
// 2.0: la noche sin luces ocupa una franja propia, arriba de las tres de siempre, así
// que las otras siguen saliendo con la misma frecuencia que antes.
export function nocheEspecial(n, azar = Math.random(), anterior = null) {
  if (n < 4 || n >= NOCHE_FINAL || anterior || esNocheDeJefe(n)) return null;
  if (azar > 0.38) return null;
  if (azar > 0.3) return 'apagon';
  const claves = ['roja', 'eclipse', 'silenciosa'];
  return claves[Math.min(claves.length - 1, Math.floor((azar / 0.3) * claves.length))];
}
export function aplicarEspecial(lista, especial) {
  const e = ESPECIALES[especial];
  if (!e) return lista;
  // el jefe no se multiplica ni se reemplaza: sigue siendo uno solo y va último
  const conJefe = lista.includes('jefe');
  const base = conJefe ? sinJefe(lista) : lista;
  const total = Math.max(2, Math.round(lista.length * e.cantidad)) - (conJefe ? 1 : 0);
  const salida = [];
  if (e.soloTiradores) for (let i = 0; i < Math.max(1, total); i++) salida.push('tirador');
  else for (let i = 0; i < total; i++) salida.push(base[i % base.length]);
  if (conJefe) salida.push('jefe');
  return salida;
}
// Tecnología de los restos de naves: se recupera un plano por nave explorada.
export const PLANOS_ALIEN = [
  { id: 'escudo', nombre: 'Generador de escudo', texto: 'Una cúpula que absorbe la mitad del daño de las obras cercanas.' },
  { id: 'faro', nombre: 'Faro de plasma', texto: 'Una torre que dispara plasma a los invasores a 30 metros.' },
  { id: 'baliza', nombre: 'Baliza de sanación', texto: 'Te cura mientras estés cerca de ella.' },
];
export function nocheConRestos(n) { return n >= 3 && n % 3 === 0; }
// El clima cambia el combate: lluvia y niebla acortan la vista; la nieve frena.
export function efectoClima({ lluvia = 0, nublado = 0, invierno = 0 } = {}) {
  const vista = Math.max(0.45, 1 - lluvia * 0.35 - Math.max(0, nublado - 0.55) * 0.5);
  return { vista, velocidad: invierno > 0.5 ? 0.82 : 1, antorchas: lluvia < 0.55 };
}

// ---------------------------------------------------------------- resistencia de las obras
// Lo que costó construir es lo que aguanta: la piedra rinde mucho más que la tabla.
export function vidaMaxObra(plano, etapas = null) {
  if (!plano) return 0;
  if (Number.isFinite(plano.vida)) return plano.vida;
  const n = Math.min(etapas ?? plano.etapas?.length ?? 1, plano.etapas?.length ?? 1);
  let v = 40;
  for (let i = 0; i < n; i++) {
    const pide = plano.etapas?.[i]?.pide || {};
    v += (pide.tronco || 0) * 16 + (pide.tabla || 0) * 7 + (pide.piedra || 0) * 22;
  }
  return Math.round(v);
}
// Reparar: 1 material por cada 30% recuperado; tronco para madera, piedra para piedra.
export function costoReparacion(plano, vida, vidaMax) {
  if (!plano || vidaMax <= 0 || vida >= vidaMax) return null;
  const falta = 1 - Math.max(0, vida) / vidaMax;
  const cantidad = Math.max(1, Math.ceil(falta / 0.3));
  let piedra = 0, madera = 0;
  for (const e of plano.etapas || []) { piedra += e.pide?.piedra || 0; madera += (e.pide?.tronco || 0) + (e.pide?.tabla || 0); }
  return { material: piedra > madera ? 'piedra' : 'tronco', cantidad };
}

// Al amanecer cae una caja de suministros: crece con las noches resistidas.
export function suministrosDelAlba(noche, tieneArco) {
  const n = Math.max(1, Math.floor(noche));
  const caja = { tronco: 3 + Math.min(6, n), tabla: 2 + Math.min(6, n), piedra: 2 + Math.min(5, n) };
  if (tieneArco) caja.flechas = 4 + Math.min(8, n);
  if (n % 2 === 0) caja.emplastos = 1;
  if (n >= 3) caja.cristal = 1 + Math.floor(n / 3);
  return caja;
}

// Los vecinos que se instalan en tu base cuando el fuerte es seguro.
export const COMPANEROS = {
  ramon: {
    nombre: 'Don Ramón', llega: { noches: 2, defensas: 6 },
    aviso: 'Vi las luces desde el puesto. Si me dejás, te doy una mano con los arreglos',
    saludo: 'Tranquilo, que las empalizadas las voy emparchando yo. Vos ocupate de los bichos esos.',
  },
  ema: {
    nombre: 'Ema', llega: { noches: 4, defensas: 10 },
    aviso: 'Traje el arco del guardaparque. Desde acá te cubro',
    saludo: 'Tengo flechas para rato. Si ves que se me acercan, avisá.',
  },
};

// Kit con el que se empieza una partida de Desafío.
export function desafioNuevo() {
  return { salud: SALUD_MAX, oleadas: 0, noches: 0, derrotas: 0, oleadaNoche: null, oleadaTerminada: true, vivos: 0, abatidos: 0,
    flechas: 0, cargas: 0, emplastos: 1, boleadoras: 0, pistolaEncontrada: false, mejorRacha: 0, racha: 0, caja: null,
    recetasHechas: [], planos: [], restos: null, companeros: [], ordenes: {}, abatidosPerro: 0, especial: null, especialAnterior: null,
    victoria: false, nodriza: null, tutorial: 0,
    // Segundo acto: aparece recién cuando cae la nodriza (ver desafio-nido.js).
    nido: null,
    // 3.0: el asedio final: aparece si al alba de la noche final la nodriza sigue arriba (desafio-asedio.js)
    asedio: null,
    bestiario: {}, despues: null,
    // 2.1: los rescates (quién está enojado y cuántos salieron bien) y el de esta noche
    rescates: { enojados: {}, hechos: 0 }, rescate: null,
    // 1.10: Nueva partida+ (desafio-vuelta.js). 0 es la primera.
    vuelta: 0,
    // 2.3: los capullos del bosque, el tren varado de esta noche y el código de partida
    capullos: [], varada: null, semilla: null,
    // 3.0: la corrida sin fin (null en la campaña) y el mapa de la semilla (null: el de siempre)
    sinFin: null, mapa: null,
    // 2.5: el arsenal (munición nueva, la flecha elegida y la noche en que se usaron las placas)
    ...Object.fromEntries(MUNICIONES.map((k) => [k, 0])), flechaTipo: 'comun', placasNoche: -1,
    // 3.0: lo que aprendieron de cómo te defendés y sus puestos en el bosque
    evolucion: evolucionNueva(), puestos: puestosNuevos() };
}
export const NUCLEO_VIDA = 600;
const lista = (v, validos) => (Array.isArray(v) ? [...new Set(v.filter((k) => validos.includes(k)))] : []);
export function sanearDesafio(d) {
  const x = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  const base = desafioNuevo();
  const ent = (v, def, max = 1e6) => Math.max(0, Math.min(max, Math.floor(Number.isFinite(Number(v)) ? Number(v) : def)));
  return {
    ...base,
    salud: Math.max(1, Math.min(SALUD_MAX, Number.isFinite(Number(x.salud)) ? Number(x.salud) : SALUD_MAX)),
    oleadas: ent(x.oleadas, 0), noches: ent(x.noches, 0), derrotas: ent(x.derrotas, 0),
    oleadaNoche: Number.isFinite(Number(x.oleadaNoche)) && x.oleadaNoche !== null ? Math.floor(Number(x.oleadaNoche)) : null,
    oleadaTerminada: x.oleadaTerminada === undefined ? true : !!x.oleadaTerminada,
    vivos: ent(x.vivos, 0, 40), abatidos: ent(x.abatidos, 0),
    flechas: ent(x.flechas, 0, 999), cargas: ent(x.cargas, 0, 999), emplastos: ent(x.emplastos, base.emplastos, 99),
    pistolaEncontrada: !!x.pistolaEncontrada, mejorRacha: ent(x.mejorRacha, 0), racha: ent(x.racha, 0),
    caja: x.caja && Number.isFinite(Number(x.caja.x)) && Number.isFinite(Number(x.caja.z)) && x.caja.contenido && typeof x.caja.contenido === 'object'
      ? { x: Number(x.caja.x), z: Number(x.caja.z), contenido: x.caja.contenido, cayendo: false } : null,
    boleadoras: ent(x.boleadoras, 0, 99),
    recetasHechas: lista(x.recetasHechas, RECETAS.map((r) => r.id)),
    planos: lista(x.planos, PLANOS_ALIEN.map((p) => p.id)),
    restos: x.restos && Number.isFinite(Number(x.restos.x)) && Number.isFinite(Number(x.restos.z))
      ? { x: Number(x.restos.x), z: Number(x.restos.z), ...(Number.isFinite(Number(x.restos.rot)) ? { rot: Number(x.restos.rot) } : {}) } : null,
    companeros: lista(x.companeros, ['ramon', 'ema']),
    ordenes: sanearOrdenes(x.ordenes),
    abatidosPerro: ent(x.abatidosPerro, 0),
    especial: ESPECIALES[x.especial] ? x.especial : null,
    especialAnterior: ESPECIALES[x.especialAnterior] ? x.especialAnterior : null,
    victoria: !!x.victoria,
    nodriza: x.nodriza && typeof x.nodriza === 'object' && Array.isArray(x.nodriza.nucleos)
      ? { nucleos: x.nodriza.nucleos.slice(0, 3).map((v) => Math.max(0, Math.min(NUCLEO_VIDA, Number(v) || 0))) } : null,
    tutorial: ent(x.tutorial, 0, 99),
    nido: sanearNido(x.nido),
    asedio: sanearAsedio(x.asedio),   // 3.0
    // 2.0: el bestiario y las noches después del nido
    bestiario: sanearBestiario(x.bestiario),
    despues: sanearDespues(x.despues),
    rescates: sanearRescates(x.rescates),
    rescateAnterior: typeof x.rescateAnterior === 'string' ? x.rescateAnterior : null,
    rescate: x.rescate && typeof x.rescate === 'object' && typeof x.rescate.lugar === 'string'
      ? { lugar: x.rescate.lugar, vida: Math.max(0, Number(x.rescate.vida) || 0), caido: !!x.rescate.caido } : null,
    vuelta: ent(x.vuelta, 0, 9),
    capullos: sanearCapullos(x.capullos),
    varada: sanearVarada(x.varada),
    semilla: normalizarCodigo(x.semilla),
    // 3.0: la corrida sin fin (ver desafio-supervivencia.js) y el mapa de la semilla (desafio-mapa.js)
    sinFin: x.sinFin && typeof x.sinFin === 'object' && !Array.isArray(x.sinFin) ? { terminada: !!x.sinFin.terminada } : null,
    mapa: sanearMapaGuardado(x.mapa),
    // 2.5: el arsenal
    ...Object.fromEntries(MUNICIONES.map((k) => [k, ent(x[k], 0, TOPE_MUNICION)])),
    flechaTipo: FLECHAS[x.flechaTipo] && Object.hasOwn(FLECHAS, x.flechaTipo) ? x.flechaTipo : 'comun',
    placasNoche: Number.isFinite(Number(x.placasNoche)) ? Math.floor(Number(x.placasNoche)) : -1,
    // 3.0: los invasores que evolucionan y los puestos (una partida vieja carga sin nada aprendido)
    evolucion: sanearEvolucion(x.evolucion),
    puestos: sanearPuestos(x.puestos),
  };
}

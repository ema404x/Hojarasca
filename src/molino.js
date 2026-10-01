// 2.9: el molino de agua y el aserradero.
//
// Una rueda de paletas en la orilla del arroyo mueve lo que se le arrime: el aserradero
// de al lado (a menos de `MOLINO.enlace` metros) convierte los troncos que le cargás en
// tablas, solo, mientras hacés otra cosa; y la muela del molino, si tenés habas de la
// huerta, las muele en harina (la misma medida que cambia Ercilia en el almacén).
//
// Todo corre en horas de juego, como la colmena y el ahumadero: cada máquina guarda la
// hora en que se la miró por última vez y, al volver a mirarla (o al cargar la partida,
// o al despertar), se pone al día con las horas que pasaron, con un tope.
//
// El agua manda: con el arroyo crecido la rueda gira más rápido; en invierno el agua
// baja lenta y fría, con hielo en los bordes, y todo va a media máquina.
//
// Puro, sin THREE.
export const MOLINO = {
  enlace: 14,            // metros: hasta dónde llega la transmisión del molino
  topeHoras: 48,         // lo más que se pone al día de una vez
  // el aserradero
  capacidad: 12,         // troncos que se le pueden cargar
  horasPorTronco: 0.75,  // horas de juego por tronco (a mano es un tronco por vez, y hay que estar)
  tablasPorTronco: 5,    // una más que en el banco de carpintero
  topeTablas: 60,        // si nadie las saca, la sierra para
  // la muela
  capacidadHabas: 12,
  habasPorMedida: 2,     // dos puñados de habas secas, una medida de harina
  horasPorMedida: 1.5,
  topeHarina: 12,
};

const ent = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
const hora = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);

export function aserraderoVacio() { return { troncos: 0, avance: 0, tablas: 0, hora: null }; }
export function sanearAserradero(a) {
  const x = a && typeof a === 'object' && !Array.isArray(a) ? a : {};
  const troncos = ent(x.troncos, MOLINO.capacidad);
  return {
    troncos,
    avance: troncos ? Math.max(0, Math.min(MOLINO.horasPorTronco, Number(x.avance) || 0)) : 0,
    tablas: ent(x.tablas, MOLINO.topeTablas),
    hora: hora(x.hora),
  };
}
export function muelaVacia() { return { habas: 0, avance: 0, harina: 0, hora: null }; }
export function sanearMuela(m) {
  const x = m && typeof m === 'object' && !Array.isArray(m) ? m : {};
  const habas = ent(x.habas, MOLINO.capacidadHabas);
  return {
    habas,
    avance: habas >= MOLINO.habasPorMedida ? Math.max(0, Math.min(MOLINO.horasPorMedida, Number(x.avance) || 0)) : 0,
    harina: ent(x.harina, MOLINO.topeHarina),
    hora: hora(x.hora),
  };
}

// Cuánto empuja el agua (1 = lo normal). `crecida` 0 a 1 (ver `tormenta.js`).
export function fuerzaDelAgua({ invierno = 0, crecida = 0 } = {}) {
  const base = invierno > 0.5 ? 0.5 : 1;
  return base * (1 + Math.max(0, Math.min(1, crecida)) * 0.5);
}

// Las horas que pasaron desde la última vez, con tope; y deja anotada la hora de ahora.
// La primera vez (sin hora) no cuenta nada: la máquina recién empieza.
export function horasDesde(estado, ahora) {
  if (!estado || !Number.isFinite(ahora)) return 0;
  const antes = estado.hora;
  estado.hora = ahora;
  if (!Number.isFinite(antes) || ahora <= antes) return 0;
  return Math.min(MOLINO.topeHoras, ahora - antes);
}

// El aserradero trabaja `horas` con la fuerza `fuerza`. Devuelve cuántos troncos aserró.
export function avanzarAserradero(a, horas, fuerza = 1) {
  if (!a || !a.troncos || !(horas > 0) || !(fuerza > 0)) return 0;
  a.avance += horas * fuerza;
  let hechos = 0;
  while (a.troncos > 0 && a.avance >= MOLINO.horasPorTronco && a.tablas + MOLINO.tablasPorTronco <= MOLINO.topeTablas) {
    a.avance -= MOLINO.horasPorTronco;
    a.troncos--; a.tablas += MOLINO.tablasPorTronco; hechos++;
  }
  if (!a.troncos) a.avance = 0;
  else a.avance = Math.min(a.avance, MOLINO.horasPorTronco);
  return hechos;
}
export const aserrando = (a) => !!a && a.troncos > 0 && a.tablas + MOLINO.tablasPorTronco <= MOLINO.topeTablas;

export function avanzarMuela(m, horas, fuerza = 1) {
  if (!m || m.habas < MOLINO.habasPorMedida || !(horas > 0) || !(fuerza > 0)) return 0;
  m.avance += horas * fuerza;
  let hechas = 0;
  while (m.habas >= MOLINO.habasPorMedida && m.avance >= MOLINO.horasPorMedida && m.harina < MOLINO.topeHarina) {
    m.avance -= MOLINO.horasPorMedida;
    m.habas -= MOLINO.habasPorMedida; m.harina++; hechas++;
  }
  if (m.habas < MOLINO.habasPorMedida) m.avance = 0;
  else m.avance = Math.min(m.avance, MOLINO.horasPorMedida);
  return hechas;
}
export const moliendo = (m) => !!m && m.habas >= MOLINO.habasPorMedida && m.harina < MOLINO.topeHarina;

// El molino que mueve a un aserradero: el terminado más cercano, a menos de `enlace`.
// `molinos` son { x, z } (los datos de las obras).
export function molinoQueMueve(a, molinos) {
  let mejor = null, d0 = MOLINO.enlace;
  for (const m of molinos || []) {
    const d = Math.hypot(m.x - a.x, m.z - a.z);
    if (d <= d0) { d0 = d; mejor = m; }
  }
  return mejor;
}

const falta = (horas, fuerza) => Math.max(1, Math.ceil(horas / Math.max(0.1, fuerza)));

// E junto al aserradero. `troncos`: los que tenés a mano; `conMolino`: si hay un molino
// que lo mueva. Primero se sacan las tablas; después se carga.
export function usarAserradero(a, troncos, conMolino, fuerza = 1) {
  if (!a) return { accion: 'nada' };
  if (a.tablas > 0) { const n = a.tablas; a.tablas = 0; return { accion: 'sacar', tablas: n }; }
  const lugar = MOLINO.capacidad - a.troncos;
  const n = Math.max(0, Math.min(lugar, Math.floor(troncos || 0)));
  if (n > 0) {
    a.troncos += n;
    return { accion: 'cargar', troncos: n, sinMolino: !conMolino };
  }
  if (!conMolino) return { accion: 'sinMolino' };
  if (a.troncos > 0) return { accion: 'aserrando', troncos: a.troncos, faltan: falta(a.troncos * MOLINO.horasPorTronco - a.avance, fuerza) };
  return { accion: 'vacio' };
}
export function avisoAserradero(a, troncos, conMolino) {
  if (!a) return null;
  if (a.tablas > 0) return `Sacar las tablas del aserradero (${a.tablas})`;
  if (troncos > 0 && a.troncos < MOLINO.capacidad) return `Cargar troncos en el aserradero (${Math.min(troncos, MOLINO.capacidad - a.troncos)})`;
  if (!conMolino) return 'Aserradero parado: no hay un molino de agua cerca';
  if (a.troncos > 0) return `Aserrando: quedan ${a.troncos} ${a.troncos === 1 ? 'tronco' : 'troncos'}`;
  return 'Aserradero vacío: traé troncos';
}

// E junto al molino: sacar la harina, o echar habas a la muela.
export function usarMolino(m, habas, fuerza = 1) {
  if (!m) return { accion: 'nada' };
  if (m.harina > 0) { const n = m.harina; m.harina = 0; return { accion: 'sacar', harina: n }; }
  const lugar = MOLINO.capacidadHabas - m.habas;
  const n = Math.max(0, Math.min(lugar, Math.floor(habas || 0)));
  if (n >= MOLINO.habasPorMedida || (n > 0 && m.habas + n >= MOLINO.habasPorMedida)) {
    m.habas += n;
    return { accion: 'cargar', habas: n };
  }
  if (m.habas >= MOLINO.habasPorMedida) return { accion: 'moliendo', faltan: falta(Math.floor(m.habas / MOLINO.habasPorMedida) * MOLINO.horasPorMedida - m.avance, fuerza) };
  return { accion: 'girando' };
}
export function avisoMolino(m, habas) {
  if (!m) return null;
  if (m.harina > 0) return `Sacar la harina del molino (${m.harina})`;
  if (habas > 0 && m.habas + habas >= MOLINO.habasPorMedida && m.habas < MOLINO.capacidadHabas) return `Echar habas a la muela (${Math.min(habas, MOLINO.capacidadHabas - m.habas)})`;
  if (m.habas >= MOLINO.habasPorMedida) return 'Moliendo habas';
  return 'Molino de agua: la rueda gira';
}

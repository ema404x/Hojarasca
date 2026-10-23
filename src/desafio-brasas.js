// 4.9 defensas: la pala de brasas del Desafío (reglas puras, se prueban en Node).
//
// Una pala de tabla con filo de piedra con la que se sacan brasas de un fogón o de una antorcha prendida y se tiran en abanico: los duendes del grupo
// dudan y retroceden, se queman un poco, y si una brasa cae sobre la miel de una trampa, la prende (y la miel encendida quema a los
// pegados). Cada carga tira un abanico entero. Se vuelve a cargar junto a un fuego (E, con la pala en la mano).
//
// Lo que se ve (las brasas en el aire) y lo que se mueve vive en desafio-brasas-mundo.js; los sonidos, en desafio-brasas-sonido.js.

export const PALA = {
  cargas: 6,            // las que lleva cuando se carga
  brasas: 9,            // cuántas brasas salen en cada abanico
  abanico: 1.0,         // el ancho del abanico (radianes, 57 grados)
  alcance: 11,          // hasta dónde llega el abanico (m)
  minimo: 0.5,          // las brasas que caen más cerca de esto de vos no cuentan (no te quemás)
  vuelo: 0.42,          // segundos que tarda la brasa más lejana en caer
  dano: 6,              // el daño chico de fuego
  fuego: 1.6,           // segundos que queda ardiendo el que se llevó una brasa (después de eso, el fuego de siempre)
  duda: 2.4,            // segundos que dudan y retroceden
  dudaPesado: 1.1,      // los grandes dudan la mitad
  dudaJefe: 0.5,        // y el mandamás casi nada
  radioPrende: 1.0,     // una brasa que cae a menos de esto del borde del charco prende la miel
  cerca: 3.2,           // a cuántos metros de un fuego se carga la pala
  cadencia: 1.15,
};

// Los desvíos de cada brasa respecto de adelante, de punta a punta del abanico (radianes).
export function desviosDelAbanico(n = PALA.brasas, ancho = PALA.abanico) {
  const r = [];
  for (let i = 0; i < n; i++) r.push(n === 1 ? 0 : (i / (n - 1) - 0.5) * ancho);
  return r;
}
// ¿El punto está dentro del abanico que sale de `origen` mirando al `rumbo` (radianes, atan2(x, z))? Un poco más ancho que lo
// que se ve: las brasas rebotan.
export function enElAbanico(origen, rumbo, punto, { alcance = PALA.alcance, ancho = PALA.abanico, margen = 1.15 } = {}) {
  const dx = punto.x - origen.x, dz = punto.z - origen.z, d = Math.hypot(dx, dz);
  if (d > alcance || d < 0.01) return false;
  const dif = Math.abs(Math.atan2(Math.sin(Math.atan2(dx, dz) - rumbo), Math.cos(Math.atan2(dx, dz) - rumbo)));
  // al lado de la pala el cono se ensancha: a un metro cabe cualquiera que esté adelante
  return dif <= (ancho / 2) * margen + (d < 1.5 ? 0.6 : 0);
}
// A qué distancia cae cada brasa: de mitad del alcance al alcance, repartidas (`azar` de 0 a 1 por brasa).
export function distanciaDeCaida(azar = 0.5, alcance = PALA.alcance) {
  return alcance * (0.5 + 0.5 * Math.max(0, Math.min(1, azar)));
}

// Lo que le hace el abanico a un duende: { dano, duda, fuegoT } (el jefe aguanta: recibe el daño y casi no duda).
export function efectoSobre(def) {
  const jefe = !!def?.jefe, pesado = !!def?.pesado;
  return {
    dano: PALA.dano,
    duda: jefe ? PALA.dudaJefe : pesado ? PALA.dudaPesado : PALA.duda,
    fuegoT: PALA.fuego,
  };
}

// ---------------------------------------------------------------- cargar la pala
// `hayFuego`: hay un fogón o una antorcha prendida a menos de `cerca`. Devuelve { accion, cargas }.
export function cargarPala(d, hayFuego) {
  const cargas = Math.max(0, Math.min(PALA.cargas, Math.floor(Number(d?.brasas) || 0)));
  if (!hayFuego) return { accion: 'sinFuego', cargas };
  if (cargas >= PALA.cargas) return { accion: 'llena', cargas };
  d.brasas = PALA.cargas;
  return { accion: 'cargar', cargas: PALA.cargas, antes: cargas };
}
export function avisoPala(d, hayFuego) {
  if (!hayFuego) return null;
  const cargas = Math.max(0, Math.floor(Number(d?.brasas) || 0));
  return cargas >= PALA.cargas ? null : cargas > 0 ? `Cargar la pala con brasas (lleva ${cargas} de ${PALA.cargas})` : 'Cargar la pala con brasas del fuego';
}

// ---------------------------------------------------------------- lo que se guarda
export function sanearBrasas(d) {
  if (!d || typeof d !== 'object') return d;
  d.brasas = Math.max(0, Math.min(PALA.cargas, Math.floor(Number(d.brasas) || 0)));
  return d;
}

// ---------------------------------------------------------------- el taller
// La pala es un arma más (clic izquierdo tira el abanico): ver ARSENAL en desafio-arsenal.js.
export const RECETAS_BRASAS = [
  { id: 'pala', cat: 'armas', nombre: 'Pala de brasas', pide: { tronco: 1, tabla: 1, piedra: 2 }, da: { cosa: 'pala' }, unica: true,
    texto: `Una pala de tabla con filo de piedra y mango largo. Se carga con brasas junto a un fogón o una antorcha prendida (E con la pala en la mano) y cada clic tira un abanico: los duendes dudan y retroceden, se queman un poco y la miel de las trampas prende. Lleva ${PALA.cargas} cargas.` },
];

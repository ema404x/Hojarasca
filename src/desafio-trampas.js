// 4.9 defensas: la trampa de miel del Desafío (reglas puras, se prueban en Node).
//
// Un cuenco de tablas con miel espesa. El duende que lo pisa queda pegado tres o cuatro segundos
// lamiendo: frenado y sin atacar. Cada duende que se pega gasta un uso; cuando se acaban, la
// miel se seca y hay que reponerla (E junto a la trampa, o en el taller). Con una brasa de la pala
// la miel prende y quema a los que están pegados.
//
// Lo que se ve y lo que se mueve vive en desafio-trampas-mundo.js.

export const MIEL = {
  usos: 5,                 // duendes que se pegan antes de que se seque
  pegado: [3, 4],          // segundos pegado (según el azar)
  radio: 1.3,              // lo que mide el charco (se pisa a menos de esto del centro)
  inmune: 6,               // el que se soltó no se vuelve a pegar a la misma trampa por un rato
  porFrasco: 5,            // un frasco de miel la deja llena
  tope: 99,                // frascos que se llevan encima
  pesadoFactor: 0.5,       // los brutos se despegan en la mitad de tiempo
  quema: { dura: 7, dps: 12, prende: 6 },   // miel prendida: segundos que arde y daño por segundo a los pegados
};
// De dónde sale la miel en el Desafío (no hay colmenas): la caja del alba trae un frasco las noches impares
// y dos desde la séptima; los pedidos de la aldea de día la suman (ver `colocarTrampaMiel` y el informe).
export function mielDelAlba(noche) {
  const n = Math.max(1, Math.floor(Number(noche) || 1));
  if (n % 2 === 0) return 0;
  return n >= 7 ? 2 : 1;
}

// ¿Este duende se pega? Los jefes no (se la llevan puesta), los que vuelan tampoco.
export function sePega(def, a = {}) {
  if (!def || def.jefe || def.vuela) return false;
  if (a.estado === 'morir' || a.estado === 'irse' || a.estado === 'bajar' || a.estado === 'bajoTierra' || a.estado === 'dormido' || a.enNave) return false;
  return true;
}
// Cuántos segundos queda pegado. `azar` va de 0 a 1.
export function duracionPegado(def, azar = 0.5) {
  const [min, max] = MIEL.pegado;
  const t = min + (max - min) * Math.max(0, Math.min(1, Number(azar) || 0));
  return def?.pesado ? t * MIEL.pesadoFactor : t;
}

// ---------------------------------------------------------------- lo que guarda cada trampa
// `datos.usos`: cuántos duendes más puede pegar (0: seca). `datos.prendida`: segundos que le quedan ardiendo.
export function usosDe(datos) {
  const n = Math.floor(Number(datos?.usos));
  return Number.isFinite(n) ? Math.max(0, Math.min(MIEL.usos, n)) : 0;
}
export const estaSeca = (datos) => usosDe(datos) <= 0;
export const estaPrendida = (datos) => Number(datos?.prendida) > 0;
export function sanearDatosMiel(datos) {
  if (!datos || typeof datos !== 'object') return datos;
  datos.usos = usosDe(datos);
  const p = Number(datos.prendida);
  datos.prendida = Number.isFinite(p) ? Math.max(0, Math.min(MIEL.quema.dura, p)) : 0;
  return datos;
}
// Un duende se pega a la trampa: gasta un uso. Devuelve los segundos, o 0 si no se pegó.
export function pegarse(datos, def, azar) {
  if (estaSeca(datos) || !sePega(def)) return 0;
  datos.usos = usosDe(datos) - 1;
  return duracionPegado(def, azar);
}
// La miel se prende con una brasa. Seca no arde. Devuelve verdadero si prendió ahora.
export function prender(datos) {
  if (estaSeca(datos) || estaPrendida(datos)) return false;
  datos.prendida = MIEL.quema.dura;
  return true;
}
// Pasa el tiempo de una miel prendida: cuando se apaga, se consumió entera. Devuelve 'arde', 'termino' o null.
export function arder(datos, dt) {
  if (!estaPrendida(datos)) return null;
  datos.prendida = Math.max(0, datos.prendida - dt);
  if (datos.prendida > 0) return 'arde';
  datos.usos = 0;
  return 'termino';
}

// ---------------------------------------------------------------- reponer la miel (E y taller)
// `miel`: frascos que tenés. Devuelve { accion, gasta?, usos? }.
export function reponerMiel(datos, miel = 0) {
  const usos = usosDe(datos);
  if (estaPrendida(datos)) return { accion: 'ardiendo' };
  if (usos >= MIEL.usos) return { accion: 'llena' };
  if (miel < 1) return { accion: 'sinMiel' };
  datos.usos = MIEL.usos;
  return { accion: 'reponer', gasta: 1, usos: MIEL.usos };
}
// El aviso de E junto a la trampa (nulo si no hay nada que decir).
export function avisoMiel(datos, miel = 0) {
  if (estaPrendida(datos)) return 'La miel está ardiendo';
  const u = usosDe(datos);
  if (u >= MIEL.usos) return null;
  if (u <= 0) return miel >= 1 ? 'Echar miel en la trampa (1 frasco)' : 'La miel se secó: hace falta un frasco de miel';
  return miel >= 1 ? `Reponer la miel (quedan ${u} de ${MIEL.usos}, 1 frasco)` : null;
}
// Cuánto desgaste muestra el charco: 1 lleno, 0 seco (para achicarlo en el mundo).
export const llenuraMiel = (datos) => usosDe(datos) / MIEL.usos;

// ---------------------------------------------------------------- el taller
// Categoría Base: echar miel en la trampa de miel más cercana (lo mismo que la E junto a ella, pero sin acercarse tanto).
export const RECETAS_TRAMPAS = [
  { id: 'miel-trampa', cat: 'base', nombre: 'Echar miel en la trampa de miel más cercana', pide: { miel: 1 }, mielTrampa: true,
    texto: `Un frasco de miel deja la trampa llena otra vez: pega a ${MIEL.usos} duendes más.` },
];

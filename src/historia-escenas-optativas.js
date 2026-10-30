// 4.18.0 (A): HUECO de las escenas de las subtramas optativas de la Historia. Lo reemplaza el archivo de B (rama v4180-b) al juntar
// (`git checkout --theirs`). Mismos exports y formato que historia-escenas-acto3.js:
//   · ESCENAS_OPTATIVAS      id → escena (datos del motor escenas.js);
//   · IDS_OPTATIVAS          los ids, en orden;
//   · EFECTOS_OPTATIVAS      todos los nombres de efecto que usan (para registrarlos uno por uno);
//   · DISPARO_OPTATIVAS      por escena: capítulo, dónde está el jugador, cuándo y qué optativa la cuenta;
//   · POR_DEFECTO_OPTATIVAS  la opción que vale si se saltea una escena con elección que importe (ninguna, por ahora).
// Mientras está vacío, la mecánica de A da por vistas las escenas que faltan (la historia nunca se traba por una escena sin escribir).
export const ESCENAS_OPTATIVAS = {};
export const IDS_OPTATIVAS = Object.keys(ESCENAS_OPTATIVAS);
export const EFECTOS_OPTATIVAS = [];
export const DISPARO_OPTATIVAS = {};
export const POR_DEFECTO_OPTATIVAS = {};

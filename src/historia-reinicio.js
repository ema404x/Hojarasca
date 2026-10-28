// 4.15.0: las partidas viejas en modo Historia se reinician por completo (decisión del usuario, 28-10-2026: «toda la partida»).
// La Historia nueva («El trato del molino», 13 capítulos) reemplaza a la de ocho capítulos; una partida que estaba a medias de la
// vieja no tiene cómo seguir. ANTES de reiniciar se guarda una copia del guardado viejo en un archivo aparte (recuperable) y al abrir
// la partida nueva sale una tarjeta de aviso.
//
// Todo esto vive en este módulo y se saca fácil: poné `REINICIAR_HISTORIAS_VIEJAS = false` y las partidas viejas se abren como
// siempre (la historia queda saneada a la versión nueva, sin reinicio). El Relax libre y el Desafío NO cambian jamás: sólo se mira
// una partida del Relax cuya historia está EN CURSO (`activa`) y es de una versión anterior a la 2.
//
// Módulo puro (se prueba en Node): el guardado, el archivo y la tarjeta los hace main.js con lo que devuelve.

import { historiaNueva, VERSION_HISTORIA } from './historia.js';

export const REINICIAR_HISTORIAS_VIEJAS = true;

const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

// ¿Esta partida trae una historia de una versión anterior?
export function historiaVieja(p) {
  const h = p && typeof p === 'object' ? p.historia : null;
  if (!h || typeof h !== 'object' || Array.isArray(h)) return false;
  return (Math.floor(Number(h.version)) || 1) < VERSION_HISTORIA && !!(h.activa || h.empezada || h.terminada || Object.keys(obj(h.hechos)).length);
}

// ¿Se reinicia por completo? Sólo el Relax, con la historia vieja EN CURSO.
export function debeReiniciar(p, modo = 'relax') {
  return REINICIAR_HISTORIAS_VIEJAS && modo === 'relax' && historiaVieja(p) && p.historia.activa === true;
}

// El nombre del archivo de la copia (letras, números, punto y guion)
export function nombreCopia(ranura = 1, ahora = Date.now()) {
  const f = new Date(Number.isFinite(ahora) ? ahora : 0);
  const dos = (n) => String(n).padStart(2, '0');
  const r = Number.isFinite(Number(ranura)) ? Math.max(1, Math.floor(Number(ranura))) : 1;
  return `copia-previa-historia-4.15.0-p${r}-${f.getUTCFullYear()}${dos(f.getUTCMonth() + 1)}${dos(f.getUTCDate())}-${dos(f.getUTCHours())}${dos(f.getUTCMinutes())}.json`;
}
// El texto de la copia: la partida vieja tal cual estaba
export function textoCopia(p) {
  try { return JSON.stringify(p); } catch { return null; }
}

// La partida nueva que reemplaza a la vieja. `nuevo`: lo que da progresoNuevo(). Se conserva lo que no es de la historia ni de la
// partida: cómo sos (ropa, bandera, recetas: `personal`), el álbum de fotos y lo que lo cuenta. La historia arranca de cero, ya en curso.
export function reiniciarPartida(vieja, nuevo, nombre = '') {
  const p = { ...nuevo };
  const v = obj(vieja);
  if (v.personal !== undefined) p.personal = v.personal;
  if (v.desafios !== undefined) p.desafios = v.desafios;
  if (typeof v.fotos === 'number') p.fotos = v.fotos;
  if (typeof v.ranura === 'number') p.ranura = v.ranura;
  const h = historiaNueva();
  h.activa = true; h.empezada = 1; h.avisoReinicio = true; h.copiaPrevia = textoNombre(nombre);
  p.historia = h;
  return p;
}
// Si no se pudo guardar la copia, NO se reinicia: la partida se queda como estaba y sólo se limpia la parte de la historia (una historia
// nueva, en pausa, sin tocar nada del mundo). Así no se pierde nada sin copia.
export function limpiarHistoria(vieja) {
  const p = { ...obj(vieja) };
  const h = historiaNueva();
  for (const k of Object.keys(obj(p.historia?.hablados))) h.hablados[k] = true;
  p.historia = h;
  return p;
}
export const textoNombre = (n) => (typeof n === 'string' && /^[a-z0-9][a-z0-9._-]{0,90}$/i.test(n) ? n : '');

// La tarjeta de aviso al abrir la partida reiniciada
export function tarjetaAviso(h) {
  const copia = textoNombre(h?.copiaPrevia);
  return {
    titulo: 'La historia cambió',
    texto: [
      'La historia del valle se escribió de nuevo: ahora son trece capítulos, «El trato del molino». Una partida a medias de la historia anterior no tiene cómo seguir en ella, así que esta empieza de cero: el refugio, la mochila y el día vuelven al principio.',
      copia ? `Tu partida de antes no se perdió: quedó guardada aparte, en la carpeta de datos del juego, dentro de «partidas», en el archivo ${copia}.` : 'Tu partida de antes quedó guardada aparte, en la carpeta de datos del juego.',
      'Tu ropa, tu bandera y tus fotos siguen con vos. El Relax libre y La noche de los duendes no se tocaron.',
    ],
  };
}

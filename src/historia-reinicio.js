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
import { empaquetar } from './transferir.js';

export const REINICIAR_HISTORIAS_VIEJAS = true;

const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

// ¿Esta partida trae una historia de una versión anterior?
export function historiaVieja(p) {
  const h = p && typeof p === 'object' ? p.historia : null;
  if (!h || typeof h !== 'object' || Array.isArray(h)) return false;
  return (Math.floor(Number(h.version)) || 1) < VERSION_HISTORIA && !!(h.activa || h.empezada || h.terminada || Object.keys(obj(h.hechos)).length);
}

// 4.17.1: ¿la historia vieja ya estaba TERMINADA? En la 4.14 y antes, al cerrar el último capítulo `activa` seguía en true (sólo cambiaban
// `fase = 'fin'` y `terminada = <día>`), así que `activa` no alcanza: una terminada no es «en curso» y sólo se limpia (como dice main.js).
// También cuenta la que tenía los ocho capítulos hechos y sólo le faltaba la tarjeta de cierre (`outro` en el último): ahí no había nada
// a medias que perder, y reiniciarla se llevaba el mundo entero. (Lo más conservador: ante la duda, no se reinicia.)
export const CAPITULOS_VIEJOS = 8;
export function historiaViejaTerminada(h) {
  if (!h || typeof h !== 'object' || Array.isArray(h)) return false;
  if ((Math.floor(Number(h.terminada)) || 0) > 0 || h.fase === 'fin') return true;
  return h.fase === 'outro' && (Math.floor(Number(h.capitulo)) || 0) >= CAPITULOS_VIEJOS - 1;
}
// 4.17.1: una copia previa (la que deja el reinicio) trae su propio nombre en `historia.copiaPrevia`: una historia vieja nunca lo tiene, así
// que al importarla de vuelta («Importar acá») NO se reinicia otra vez: sólo se limpia la historia y el mundo vuelve como estaba.
export const esCopiaPrevia = (p) => !!textoNombre(p?.historia?.copiaPrevia);

// ¿Se reinicia por completo? Sólo el Relax, con la historia vieja EN CURSO.
export function debeReiniciar(p, modo = 'relax') {
  if (historiaViejaTerminada(p?.historia) || esCopiaPrevia(p)) return false;   // 4.17.1
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
// 4.17.1: la copia de verdad. (1) Sale del texto CRUDO que se leyó del guardado, antes de que cargarProgreso lo sanee con la historia
// nueva (el saneado ya vaciaba los objetivos, momentos y capítulos de la de ocho capítulos); si no lo hay, de la partida cargada.
// (2) Lleva su nombre en `historia.copiaPrevia` (ver esCopiaPrevia: importada no se reinicia de nuevo; una versión vieja lo ignora).
// (3) Va en el MISMO formato que «Exportar» (transferir.js), así «Importar acá» la acepta.
export function progresoDeCopia(crudo, vieja, nombre) {
  let p = null;
  if (typeof crudo === 'string' && crudo) { try { p = JSON.parse(crudo); } catch { p = null; } }
  if (!p || typeof p !== 'object' || Array.isArray(p)) { try { p = JSON.parse(JSON.stringify(vieja)); } catch { p = null; } }
  if (!p || typeof p !== 'object' || Array.isArray(p)) return null;
  const h = obj(p.historia);
  p.historia = { ...h, copiaPrevia: textoNombre(nombre) || 'copia-previa-historia' };
  return p;
}
export function textoPaqueteCopia({ crudo = null, vieja = null, nombre = '', fotos = {}, ranura = 1, version = '', cuando } = {}) {
  const progreso = progresoDeCopia(crudo, vieja, nombre);
  if (!progreso) return null;
  try { return empaquetar({ progreso, fotos: obj(fotos), modo: 'relax', ranura: Number(ranura) || 1, version: String(version || ''), cuando }); } catch { return null; }
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
      // 4.17.1: el nombre es el REAL con que quedó el archivo, y se dice cómo traerla de vuelta
      copia ? `Tu partida de antes no se perdió: quedó guardada aparte, en la carpeta de datos del juego, dentro de «partidas» y «copias», en el archivo ${copia}. Para volver a ella: en Partidas, «Importar acá» con ese archivo; vuelve tu mundo como estaba y la historia nueva queda para empezarla cuando quieras.` : 'Tu partida de antes quedó guardada aparte, en la carpeta de datos del juego.',
      'Tu ropa, tu bandera y tus fotos siguen con vos. El Relax libre y La noche de los duendes no se tocaron.',
    ],
  };
}

// 4.17.1: la carpeta sincronizada. Al ofrecer la partida de la carpeta (sincronia.js), si es una que la historia nueva empezó de cero (o
// una con la historia vieja a medias, que al abrirse acá se reiniciaría), se dice antes de reemplazar la de esta computadora: el reinicio
// ya no viaja a la otra PC sin aviso. `progreso`: el de la carpeta, tal cual llegó; `local`: infoPartida() de acá. Lo del reinicio se
// dice mientras importa: con la tarjeta todavía sin ver, o si la de acá va más adelantada (después, la partida nueva ya es la tuya).
export function avisoSyncHistoria(progreso, local = null) {
  const h = progreso && typeof progreso === 'object' ? progreso.historia : null;
  if (!h || typeof h !== 'object' || Array.isArray(h)) return '';
  const copia = textoNombre(h.copiaPrevia);
  const fresca = h.avisoReinicio === true || (!!local?.hay && (Number(local.dia) || 0) > (Number(progreso.dia) || 0));
  if (!historiaVieja(progreso) && copia && fresca) return `\n\nOJO: esa partida es la que empezó de cero cuando cambió la historia del valle. Tu mundo de antes quedó copiado aparte en la computadora donde pasó (archivo ${copia}). Si la de esta computadora tiene tu mundo de antes y seguís con la de la carpeta, se reemplaza.`;
  if (debeReiniciar(progreso, 'relax')) return '\n\nOJO: esa partida trae la historia anterior a medias. Al abrirla con esta versión empieza de cero (queda una copia aparte para recuperarla).';
  return '';
}

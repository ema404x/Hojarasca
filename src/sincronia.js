// La partida en una carpeta sincronizada. Para el que juega en dos computadoras: elegís
// una carpeta que ya se sincroniza sola (OneDrive, Dropbox, Google Drive, un pendrive) y
// el juego deja ahí una copia de cada partida —el mismo archivo que "Exportar"— cada
// un par de minutos, al dormir y al salir. Al abrir el juego en la otra máquina, si la
// copia de la carpeta es más nueva que la guardada en esa computadora, te la ofrece.
//
// Sólo en la versión de escritorio: el navegador no puede escribir en una carpeta. Este
// módulo es puro (se prueba en Node); el acceso a disco lo hace main.cjs.

export const SINCRONIA = {
  cada: 120,          // segundos entre copias mientras jugás
  margen: 90,         // segundos: una copia apenas más nueva no se ofrece (relojes distintos)
  subcarpeta: 'Hojarasca',
};

// Un archivo por modo y ranura. Nombre fijo: cada copia pisa la anterior.
export function nombreSync(modo, ranura) {
  const m = modo === 'desafio' ? 'desafio' : 'relax';
  const r = [1, 2, 3].includes(Number(ranura)) ? Number(ranura) : 1;
  return `hojarasca-${m}-p${r}.hojarasca.json`;
}
export const NOMBRE_SYNC_VALIDO = /^hojarasca-(relax|desafio)-p[1-3]\.hojarasca\.json$/;

// ¿Toca copiar? Cuando cambió lo guardado y pasó el tiempo, o si es forzado (dormir, salir).
export function tocaCopiar({ ultimaCopia = 0, guardadoEn = 0, copiadoEn = 0, ahora = Date.now(), forzar = false }) {
  if (!guardadoEn || guardadoEn <= copiadoEn) return false;
  return forzar || ahora - ultimaCopia >= SINCRONIA.cada * 1000;
}

// Qué hacer con la copia de la carpeta. `local`: infoPartida() de esta máquina.
// `remota`: el paquete leído (leerPaquete) de la carpeta, o null.
// Devuelve 'nada' | 'ofrecer' (la de la carpeta es más nueva).
export function compararCopia(local, remota) {
  if (!remota?.progreso) return 'nada';
  const enCarpeta = Number(remota.progreso.guardadoEn) || 0;
  if (!local?.hay) return enCarpeta ? 'ofrecer' : 'nada';
  const aca = Number(local.guardadoEn) || 0;
  if (enCarpeta > aca + SINCRONIA.margen * 1000) return 'ofrecer';
  // 4.0.1: la de la carpeta se guardó más veces que la de acá y el sello no es más viejo: es la misma partida seguida en la otra computadora, aunque los relojes
  // de las dos no coincidan (el sello nunca baja: tras importar una partida de un reloj adelantado, una hora de juego sumaba milisegundos)
  const sr = Number(remota.progreso.secuencia) || 0, sl = Number(local.secuencia) || 0;
  return sr > sl && enCarpeta >= aca ? 'ofrecer' : 'nada';
}

const dosDigitos = (n) => String(n).padStart(2, '0');
export function cuandoTexto(ms) {
  const f = new Date(Number(ms) || 0);
  if (!Number(ms)) return 'hace un tiempo';
  return `${dosDigitos(f.getDate())}/${dosDigitos(f.getMonth() + 1)} a las ${dosDigitos(f.getHours())}:${dosDigitos(f.getMinutes())}`;
}
// 4.12.2: si la partida de la carpeta es de una versión más nueva que este juego, lo dice (y que se abrirá en sólo lectura)
export const avisoVersionNueva = (v) => (v ? `\n\nOJO: esa partida es de la versión ${v}, más nueva que este juego: se abre en sólo lectura (podés jugar, pero no se guarda). Para seguirla y guardar, abrila con esa versión o una más nueva.` : '');
export function textoOferta(local, remota, versionNueva = '') {
  const dia = Math.max(1, Math.floor(Number(remota?.progreso?.dia) || 1));
  const cabeza = `En tu carpeta sincronizada hay una partida más nueva: día ${dia}, guardada el ${cuandoTexto(remota?.progreso?.guardadoEn)}.`;
  const aca = local?.hay ? `\n\nLa de esta computadora es del día ${local.dia}, guardada el ${cuandoTexto(local.guardadoEn)}, y se reemplaza.` : '';
  return `${cabeza}${aca}${avisoVersionNueva(versionNueva)}\n\n¿Seguimos con la de la carpeta?`;
}
// 3.5.1: las dos siguieron. La otra computadora escribió en la carpeta después de la última copia
// que vio esta, pero la de acá es igual de nueva o más (se siguió jugando acá, o los relojes de
// las dos no coinciden). Antes no se preguntaba y la próxima copia de acá pisaba lo de la otra.
export function textoDosCambiaron(local, remota, versionNueva = '') {
  const dia = Math.max(1, Math.floor(Number(remota?.progreso?.dia) || 1));
  const cabeza = `Tu otra computadora dejó en la carpeta sincronizada una partida que esta no vio: día ${dia}, guardada el ${cuandoTexto(remota?.progreso?.guardadoEn)}.`;
  const aca = local?.hay ? `\n\nAcá también se siguió jugando: día ${local.dia}, guardada el ${cuandoTexto(local.guardadoEn)}.` : '';
  return `${cabeza}${aca}${avisoVersionNueva(versionNueva)}\n\n¿Seguimos con la de la carpeta? (Si no, la de acá la reemplaza en la carpeta.)`;
}

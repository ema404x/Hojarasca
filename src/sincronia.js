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
  return enCarpeta > aca + SINCRONIA.margen * 1000 ? 'ofrecer' : 'nada';
}

const dosDigitos = (n) => String(n).padStart(2, '0');
export function cuandoTexto(ms) {
  const f = new Date(Number(ms) || 0);
  if (!Number(ms)) return 'hace un tiempo';
  return `${dosDigitos(f.getDate())}/${dosDigitos(f.getMonth() + 1)} a las ${dosDigitos(f.getHours())}:${dosDigitos(f.getMinutes())}`;
}
export function textoOferta(local, remota) {
  const dia = Math.max(1, Math.floor(Number(remota?.progreso?.dia) || 1));
  const cabeza = `En tu carpeta sincronizada hay una partida más nueva: día ${dia}, guardada el ${cuandoTexto(remota?.progreso?.guardadoEn)}.`;
  const aca = local?.hay ? `\n\nLa de esta computadora es del día ${local.dia}, guardada el ${cuandoTexto(local.guardadoEn)}, y se reemplaza.` : '';
  return `${cabeza}${aca}\n\n¿Seguimos con la de la carpeta?`;
}

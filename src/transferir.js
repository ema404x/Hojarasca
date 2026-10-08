// Llevarse la partida: se empaqueta en un archivo de texto y se vuelve a leer en otra
// máquina. Módulo puro (se prueba en Node): acá no se toca el almacenamiento, sólo se
// arma y se revisa el paquete.

export const FORMATO = 'hojarasca-partida';
export const VERSION_PAQUETE = 1;
export const MAX_BYTES = 12 * 1024 * 1024;   // con álbum de fotos y todo, de sobra

// Una firma barata para darse cuenta de que el archivo llegó cortado o retocado.
export function firmar(texto) {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export function empaquetar({ progreso, fotos = {}, modo = 'relax', ranura = 1, version = '', cuando = new Date().toISOString() }) {
  const cuerpo = { progreso, fotos };
  const texto = JSON.stringify(cuerpo);
  return JSON.stringify({
    formato: FORMATO,
    versionPaquete: VERSION_PAQUETE,
    version,
    modo,
    ranura,
    cuando,
    dia: Math.max(1, Math.floor(Number(progreso?.dia) || 1)),
    firma: firmar(texto),
    cuerpo,
  }, null, 1);
}

// Devuelve { ok, motivo, paquete }. Nunca tira: un archivo cualquiera tiene que dar
// un motivo legible, no una pantalla rota.
export function leerPaquete(texto) {
  if (typeof texto !== 'string' || !texto.trim()) return { ok: false, motivo: 'El archivo está vacío.' };
  if (texto.length > MAX_BYTES) return { ok: false, motivo: 'El archivo es demasiado grande para ser una partida.' };
  let p;
  try { p = JSON.parse(texto); } catch { return { ok: false, motivo: 'Ese archivo no es una partida de Hojarasca.' }; }
  if (!p || typeof p !== 'object' || p.formato !== FORMATO) return { ok: false, motivo: 'Ese archivo no es una partida de Hojarasca.' };
  if (Number(p.versionPaquete) > VERSION_PAQUETE) return { ok: false, motivo: 'La partida viene de una versión más nueva del juego. Actualizá Hojarasca y probá de nuevo.' };
  const cuerpo = p.cuerpo;
  if (!cuerpo || typeof cuerpo !== 'object' || !cuerpo.progreso || typeof cuerpo.progreso !== 'object') {
    return { ok: false, motivo: 'El archivo no tiene ninguna partida adentro.' };
  }
  if (p.firma && firmar(JSON.stringify(cuerpo)) !== p.firma) {
    return { ok: false, motivo: 'El archivo llegó cortado o modificado: la firma no da.' };
  }
  const modo = p.modo === 'desafio' ? 'desafio' : 'relax';
  return {
    ok: true,
    paquete: {
      modo,
      version: String(p.version || ''),
      cuando: String(p.cuando || ''),
      // El día se lee de la partida misma, no de la cabecera: la firma cubre el
      // cuerpo, así que es lo único en lo que se puede confiar.
      dia: Math.max(1, Math.floor(Number(cuerpo.progreso.dia) || 1)),
      progreso: cuerpo.progreso,
      fotos: cuerpo.fotos && typeof cuerpo.fotos === 'object' ? cuerpo.fotos : {},
    },
  };
}

// Qué le vamos a decir al jugador antes de pisar una partida.
export function avisoImportar(paquete, destino) {
  const nombreModo = paquete.modo === 'desafio' ? 'La noche de los duendes' : 'Relax';
  const partes = [`Partida de ${nombreModo}, día ${paquete.dia}`];
  if (paquete.version) partes.push(`hecha con la versión ${paquete.version}`);
  const cabeza = partes.join(', ') + '.';
  if (destino?.hay) return `${cabeza}\n\nEsto pisa la partida ${destino.ranura} (día ${destino.dia}), que no se puede recuperar. ¿Seguimos?`;
  return `${cabeza}\n\nSe va a guardar en la partida ${destino?.ranura ?? 1}, que está vacía. ¿Seguimos?`;
}

export function nombreArchivoPartida(modo, progreso, fecha = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  const sello = `${fecha.getFullYear()}${p(fecha.getMonth() + 1)}${p(fecha.getDate())}`;
  const dia = Math.max(1, Math.floor(Number(progreso?.dia) || 1));
  return `hojarasca-${modo === 'desafio' ? 'desafio' : 'relax'}-dia${dia}-${sello}.hojarasca.json`;
}

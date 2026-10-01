// 3.1: el torneo de la semana y la carpeta sincronizada. Cada compu escribe SÓLO su
// archivo (hojarasca-torneo-<pc>.json) y lee los de todas: dos compus nunca escriben el
// mismo archivo, así el sincronizador (OneDrive, Dropbox…) no tiene conflictos que
// resolver. Al escribir, lo que ya había en el archivo propio se funde con lo nuevo: el
// archivo sólo crece (si se borró el localStorage, lo de la carpeta no se pierde).
//
// Sin three ni DOM: el acceso a disco llega de afuera (`api`: el `sync` del
// preload; en Node, uno de mentira) y el guardado local también (`leer`/`escribir`).
import { sanearTorneoLocal, sanearPc, sanearNombre, nombreVisible, nombreArchivoTorneo, armarArchivo, leerArchivoTorneo, leerCarpetaTorneo, fundirEntradas } from './torneo.js';

export const CLAVE_TORNEO = 'hojarasca-torneo-v1';

// Un identificador para esta compu: 8 letras y números al azar, una sola vez
export function pcNuevo(azar = Math.random) {
  let s = '';
  for (let i = 0; i < 8; i++) s += '0123456789abcdefghijklmnopqrstuvwxyz'[Math.floor(azar() * 36)];
  return s;
}

export function crearTorneoSync({ api = null, leer = () => null, escribir = () => false, azar = Math.random } = {}) {
  let local = sanearTorneoLocal(leer(CLAVE_TORNEO));
  if (!sanearPc(local.pc)) { local.pc = pcNuevo(azar); escribir(CLAVE_TORNEO, local); }
  let ultimaLectura = 0, ocupado = false, error = '';

  const guardarLocal = () => escribir(CLAVE_TORNEO, local);
  const hayCarpeta = () => !!(api && typeof api.torneoLeer === 'function' && typeof api.torneoEscribir === 'function');

  // Lee todos los archivos de la carpeta y deja lo de las otras compus en `local.carpeta`.
  // Devuelve el texto del archivo propio (para fundir al escribir), o null.
  async function leerCarpeta() {
    if (!hayCarpeta()) return { propio: null, ok: false };
    const archivos = await api.torneoLeer();
    if (!Array.isArray(archivos)) return { propio: null, ok: false };
    const mio = nombreArchivoTorneo(local.pc);
    const propio = archivos.find((a) => a && a.nombre === mio)?.texto ?? null;
    // lo propio que había en la carpeta vuelve a lo local (por si se borró el navegador)
    const delPropio = propio ? leerArchivoTorneo(propio, mio) : null;
    if (delPropio) {
      const nombre = nombreVisible(local);
      local.propias = fundirEntradas(local.propias.map((e) => ({ ...e, nombre })), delPropio.entradas.map((e) => ({ ...e, nombre })));
      local.amigos = fundirEntradas(local.amigos, delPropio.amigos);
    }
    local.carpeta = leerCarpetaTorneo(archivos.filter((a) => a && a.nombre !== mio));
    ultimaLectura = Date.now();
    return { propio, ok: true };
  }
  // Lee y escribe el archivo propio. Devuelve true si quedó escrito.
  async function sincronizar() {
    if (ocupado) return false;
    ocupado = true; error = '';
    try {
      const { propio, ok } = await leerCarpeta();
      if (!ok) return false;
      const texto = armarArchivo(local, propio);
      guardarLocal();
      // si no cambió nada, no se escribe: el sincronizador no tiene nada que subir
      if (texto === propio) return true;
      const r = await api.torneoEscribir(nombreArchivoTorneo(local.pc), texto);
      return r === true;
    } catch (e) {
      error = String(e?.message || e);
      return false;
    } finally { ocupado = false; }
  }

  return {
    get local() { return local; },
    // el nombre de esta compu en la tabla: lo propio pasa a llamarse así
    renombrar(n) {
      local.nombre = sanearNombre(n);
      const nombre = nombreVisible(local);
      local.propias = fundirEntradas(local.propias.map((e) => ({ ...e, nombre })));
      guardarLocal();
      return nombre;
    },
    guardarLocal, sincronizar, leerCarpeta, hayCarpeta,
    estado: () => ({ ultimaLectura, ocupado, error, pc: local.pc }),
    // para las pruebas: rehacer desde lo guardado
    recargar: () => { local = sanearTorneoLocal(leer(CLAVE_TORNEO)); return local; },
  };
}

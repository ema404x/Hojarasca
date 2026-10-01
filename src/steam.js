// El puente con Steam. El juego no depende de Steam: si no hay cliente de Steam, si no
// está instalado steamworks.js o si no hay App ID, todo esto no hace nada y los logros
// quedan igual en el juego.
//
// Para activarlo (ver STEAM_RELEASE_CHECKLIST.md):
//   1. npm install steamworks.js
//   2. poner el App ID en steam_appid.txt al lado del ejecutable (o STEAM_APP_ID)
//   3. crear en Steamworks los logros con los nombres de API de abajo
//
// Módulo puro: recibe el puente que expone preload.cjs (o nada).

import { LOGROS } from './desafio-logros.js';
import { LOGROS_RELAX } from './logros-relax.js';

// Nombre de API de Steam de cada logro: el modo adelante, en mayúsculas y con guion bajo.
export const apiSteam = (modo, id) => `${modo === 'desafio' ? 'DESAFIO' : 'RELAX'}_${String(id).toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;

// La lista completa, para dar de alta los logros en Steamworks sin tipear nada a mano.
export function logrosParaSteam() {
  return [
    ...LOGROS_RELAX.map((l) => ({ api: apiSteam('relax', l.id), nombre: l.nombre, texto: l.texto, oculto: !!l.oculto })),
    ...LOGROS.map((l) => ({ api: apiSteam('desafio', l.id), nombre: l.nombre, texto: l.texto, oculto: !!l.oculto })),
  ];
}

export function crearSteam(puente = (typeof window !== 'undefined' ? window.hojarasca?.steam : null)) {
  const hay = !!puente && typeof puente.activar === 'function';
  const enviados = new Set();
  return {
    get conectado() { return hay; },
    // Idempotente: Steam ignora un logro que ya tenés, pero no hace falta ni pedirlo.
    async desbloquear(modo, id) {
      if (!hay) return false;
      const api = apiSteam(modo, id);
      if (enviados.has(api)) return true;
      try {
        const ok = await puente.activar(api);
        if (ok) enviados.add(api);
        return !!ok;
      } catch { return false; }
    },
  };
}

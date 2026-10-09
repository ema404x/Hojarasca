// 2.8: "Tu caballo": el pelaje, el recado (montura, pelero, riendas y alforjas) y el
// nombre. Módulo puro (se prueba en Node); lo dibuja `caballo-mundo.js`.
//
// "Con más confianza responde mejor" no va: el zaino no tiene todavía ningún valor de
// confianza ni de cariño, y esta versión no lo inventa.
import { registrarSeccion, elegir, color, texto } from './personalizacion.js';
import { campoColores, campoElegir, campoTexto, campoSi, refDelMundo, CUEROS, TINTAS } from './personal-campos.js';

// pelo: el cuerpo; oscuro: crin, cola, hocico y medias; manchas: las del overo
export const PELAJES_CABALLO = [
  { id: 'zaino', nombre: 'Zaino', pelo: '#4e3122', oscuro: '#1c1410' },
  { id: 'colorado', nombre: 'Colorado', pelo: '#8a4a24', oscuro: '#5e2e16' },
  { id: 'tostado', nombre: 'Tostado', pelo: '#5e2e18', oscuro: '#2a150c' },
  { id: 'bayo', nombre: 'Bayo', pelo: '#b08a55', oscuro: '#2a1e14' },
  { id: 'tordillo', nombre: 'Tordillo', pelo: '#a3a29c', oscuro: '#4a4a46' },
  { id: 'moro', nombre: 'Moro', pelo: '#5a5e66', oscuro: '#1a1a1c' },
  { id: 'overo', nombre: 'Overo', pelo: '#6a3a22', oscuro: '#1c1410', manchas: '#e8e2d6' },
];
export const PELAJE_CABALLO = Object.fromEntries(PELAJES_CABALLO.map((p) => [p.id, p]));

export function caballoPorDefecto() {
  return {
    nombre: '', pelaje: 'zaino',
    montura: '#5a3b24', manta: '#b9ad93', riendas: '#3a2616',
    conAlforjas: false, alforjas: '#8a5a32',
  };
}

export function sanearCaballoPersonal(d) {
  const b = caballoPorDefecto();
  const v = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  return {
    nombre: texto(v.nombre, '', 16),
    pelaje: elegir(v.pelaje, PELAJES_CABALLO.map((p) => p.id), b.pelaje),
    montura: color(v.montura, b.montura),
    manta: color(v.manta, b.manta),
    riendas: color(v.riendas, b.riendas),
    conAlforjas: v.conAlforjas === true,
    alforjas: color(v.alforjas, b.alforjas),
  };
}

export function firmaCaballo(d) {
  return [d.pelaje, d.montura, d.manta, d.riendas, d.conAlforjas ? d.alforjas : '-'].join('|');
}

const MANTAS = [{ id: '#b9ad93', nombre: 'lana cruda' }, ...TINTAS.filter((t) => t.id !== '#e8e2d6')];

export const SECCION_CABALLO = registrarSeccion({
  id: 'caballo',
  titulo: 'Tu caballo',
  orden: 52,
  porDefecto: caballoPorDefecto,
  sanear: sanearCaballoPersonal,
  construir(cont, api) {
    const d = sanearCaballoPersonal(api.datos);
    campoTexto(cont, 'Nombre', d.nombre, 16, (v) => api.cambiar({ nombre: v }), 'el zaino');
    campoElegir(cont, 'Pelaje', PELAJES_CABALLO, d.pelaje, (v) => api.cambiar({ pelaje: v }));
    campoColores(cont, 'Montura', CUEROS, d.montura, (v) => api.cambiar({ montura: v }));
    campoColores(cont, 'Pelero', MANTAS, d.manta, (v) => api.cambiar({ manta: v }));
    campoColores(cont, 'Riendas', CUEROS, d.riendas, (v) => api.cambiar({ riendas: v }));
    campoSi(cont, 'Con alforjas', d.conAlforjas, (v) => api.cambiar({ conAlforjas: v }));
    campoColores(cont, 'Alforjas', CUEROS, d.alforjas, (v) => api.cambiar({ alforjas: v, conAlforjas: true }));
  },
  aplicar(datos, api) {
    const caballo = refDelMundo(api, 'caballo', 'caballoMundo');
    if (caballo && typeof caballo.personalizar === 'function') caballo.personalizar(sanearCaballoPersonal(datos));
  },
});

// 3.8.4: cómo se lo nombra en los textos. Con nombre, el nombre («Tormenta»); sin nombre, «el zaino» si
// es zaino y «tu caballo» si es de otro pelaje. `prep` es la preposición de adelante ('a' o 'de': «al
// zaino», «del zaino», «a Tormenta», «de tu caballo»); `mayus`, al principio de oración. Una sola función
// para todos los textos del caballo: no se escribe a mano en cada uno.
export function elCaballo(datos, prep = '', mayus = false) {
  const d = sanearCaballoPersonal(datos);
  const nombre = d.nombre.trim();
  let s;
  if (nombre) s = prep ? `${prep} ${nombre}` : nombre;
  else {
    const base = d.pelaje === 'zaino' ? 'zaino' : null;
    if (base) s = prep === 'a' ? 'al zaino' : prep === 'de' ? 'del zaino' : prep ? `${prep} el zaino` : 'el zaino';
    else s = prep ? `${prep} tu caballo` : 'tu caballo';
  }
  return mayus ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

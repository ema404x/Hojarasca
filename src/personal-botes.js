// 2.8: "Tu kayak": el color del casco, el nombre pintado a los costados, el banderín de
// popa y el color de las palas. Módulo puro (se prueba en Node); lo dibuja `kayak.js`.
// (Por ahora el kayak es el único bote del valle: la sección se llama así para cuando
// haya otros.)
import { registrarSeccion, elegir, color, texto } from './personalizacion.js';
import { campoColores, campoElegir, campoTexto, refDelMundo, TINTAS } from './personal-campos.js';

export const BANDERINES = [
  { id: 'ninguno', nombre: 'Sin banderín' },
  { id: 'triangulo', nombre: 'Triangular' },
  { id: 'golondrina', nombre: 'Cola de golondrina' },
];

export function botesPorDefecto() {
  return { casco: '#d4552a', nombre: '', banderin: 'ninguno', colorBanderin: '#d9a23a', pala: '#2f5a74' };
}

export function sanearBotes(d) {
  const b = botesPorDefecto();
  const v = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  return {
    casco: color(v.casco, b.casco),
    nombre: texto(v.nombre, '', 14),
    banderin: elegir(v.banderin, BANDERINES.map((x) => x.id), b.banderin),
    colorBanderin: color(v.colorBanderin, b.colorBanderin),
    pala: color(v.pala, b.pala),
  };
}

export const SECCION_BOTES = registrarSeccion({
  id: 'botes',
  titulo: 'Tu kayak y tus botes',
  orden: 54,
  porDefecto: botesPorDefecto,
  sanear: sanearBotes,
  construir(cont, api) {
    const d = sanearBotes(api.datos);
    campoColores(cont, 'Casco', TINTAS, d.casco, (v) => api.cambiar({ casco: v }));
    campoTexto(cont, 'Nombre en la proa', d.nombre, 14, (v) => api.cambiar({ nombre: v }), 'sin nombre');
    campoElegir(cont, 'Banderín', BANDERINES, d.banderin, (v) => api.cambiar({ banderin: v }));
    campoColores(cont, 'Color del banderín', TINTAS, d.colorBanderin, (v) => api.cambiar({ colorBanderin: v }));
    campoColores(cont, 'Palas del remo', TINTAS, d.pala, (v) => api.cambiar({ pala: v }));
  },
  aplicar(datos, api) {
    const kayak = refDelMundo(api, 'kayak');
    if (kayak && typeof kayak.personalizar === 'function') kayak.personalizar(sanearBotes(datos));
  },
});

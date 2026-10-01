// 2.8: "Tu perro": el pelaje, el dibujo, el collar, el pañuelo, el nombre y las pruebas
// que le enseñaste. Módulo puro (se prueba en Node). Lo dibuja `perro.js`, que también
// lo lee de `progreso.personal.perro` al armarse, así la partida carga con tu perro.
import { registrarSeccion, elegir, color, texto } from './personalizacion.js';
import { campoColores, campoElegir, campoTexto, campoSi, subtitulo, nota, refDelMundo, TINTAS } from './personal-campos.js';

export const PELAJES_PERRO = [
  { id: '#4a4038', nombre: 'pardo oscuro' }, { id: '#2a2521', nombre: 'negro' },
  { id: '#7a5634', nombre: 'marrón' }, { id: '#a8804f', nombre: 'barcino claro' },
  { id: '#c9b89a', nombre: 'bayo' }, { id: '#6b6660', nombre: 'gris' },
];
export const DIBUJOS_PERRO = [
  { id: 'pecho', nombre: 'Pecho, hocico y patas blancas' },
  { id: 'liso', nombre: 'Liso, de un color' },
  { id: 'manchado', nombre: 'Manchado' },
  { id: 'antifaz', nombre: 'Antifaz oscuro' },
];
export const TRUCOS_PERRO = [
  { id: 'sentarse', nombre: 'Sentarse cuando te quedás quieto' },
  { id: 'traer', nombre: 'Traerte palitos' },
  { id: 'avisar', nombre: 'Avisar de noche si anda algo' },
];

export function perroPorDefecto() {
  return {
    nombre: '', pelo: '#4a4038', dibujo: 'pecho',
    collar: '#7c2f22', conCollar: true, bandana: '#2f5a74', conBandana: false,
    trucos: { sentarse: false, traer: false, avisar: false },
  };
}

export function sanearPerro(d) {
  const b = perroPorDefecto();
  const v = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  const t = v.trucos && typeof v.trucos === 'object' ? v.trucos : {};
  return {
    nombre: texto(v.nombre, '', 16),
    pelo: color(v.pelo, b.pelo),
    dibujo: elegir(v.dibujo, DIBUJOS_PERRO.map((x) => x.id), b.dibujo),
    collar: color(v.collar, b.collar),
    conCollar: typeof v.conCollar === 'boolean' ? v.conCollar : b.conCollar,
    bandana: color(v.bandana, b.bandana),
    conBandana: v.conBandana === true,
    trucos: { sentarse: t.sentarse === true, traer: t.traer === true, avisar: t.avisar === true },
  };
}

// 2.8: la firma de lo que cambia la malla (el nombre y las pruebas no la cambian)
export function firmaPerro(d) {
  return [d.pelo, d.dibujo, d.conCollar ? d.collar : '-', d.conBandana ? d.bandana : '-'].join('|');
}

export const SECCION_PERRO = registrarSeccion({
  id: 'perro',
  titulo: 'Tu perro',
  orden: 50,
  porDefecto: perroPorDefecto,
  sanear: sanearPerro,
  construir(cont, api) {
    const d = sanearPerro(api.datos);
    campoTexto(cont, 'Nombre', d.nombre, 16, (v) => api.cambiar({ nombre: v }), 'sin nombre');
    campoColores(cont, 'Pelaje', PELAJES_PERRO, d.pelo, (v) => api.cambiar({ pelo: v }));
    campoElegir(cont, 'Dibujo', DIBUJOS_PERRO, d.dibujo, (v) => api.cambiar({ dibujo: v }));
    campoSi(cont, 'Con collar', d.conCollar, (v) => api.cambiar({ conCollar: v }));
    campoColores(cont, 'Collar', TINTAS, d.collar, (v) => api.cambiar({ collar: v, conCollar: true }));
    campoSi(cont, 'Con pañuelo al cuello', d.conBandana, (v) => api.cambiar({ conBandana: v }));
    campoColores(cont, 'Pañuelo', TINTAS, d.bandana, (v) => api.cambiar({ bandana: v, conBandana: true }));
    subtitulo(cont, 'Lo que le enseñaste');
    nota(cont, 'Se aprende de a poco: lo que marques, lo hace cuando se da la ocasión.');
    // (se lleva la cuenta acá: `api.datos` puede ser la foto de cuando se abrió el panel)
    const trucos = { ...d.trucos };
    for (const t of TRUCOS_PERRO) {
      campoSi(cont, t.nombre, trucos[t.id], (v) => { trucos[t.id] = v; api.cambiar({ trucos: { ...trucos } }); });
    }
  },
  aplicar(datos, api) {
    const perro = refDelMundo(api, 'perro');
    if (perro && typeof perro.personalizar === 'function') perro.personalizar(sanearPerro(datos));
  },
});

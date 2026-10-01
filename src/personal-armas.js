// 2.8: "Armas y herramientas": el mango del hacha (madera y grabado), las plumas de las
// flechas, el nombre de la ballesta y las cintas de la lanza. Sólo se ven: no cambian
// ni el daño ni el alcance. Módulo puro (se prueba en Node); lo dibuja `enmano.js`.
// Lo forjado en la forja de cristal (ver `desafio-valle.js`) también se nota en la mano:
// la lanza de hielo escarchada, las flechas de rayo con la punta encendida y la honda
// de empuje con su cristal.
import { registrarSeccion, elegir, color, texto } from './personalizacion.js';
import { campoColores, campoElegir, campoTexto, campoSi, refDelMundo, MADERAS, TINTAS } from './personal-campos.js';

export const GRABADOS = [
  { id: 'ninguno', nombre: 'Sin grabado' },
  { id: 'aros', nombre: 'Aros quemados' },
  { id: 'guarda', nombre: 'Guarda de rombos' },
  { id: 'espiral', nombre: 'Espiral' },
];
export const PLUMAS = [
  { id: '#d8cfbe', nombre: 'blanca' }, { id: '#6b6660', nombre: 'gris de cauquén' },
  { id: '#2a2723', nombre: 'negra de cóndor' }, { id: '#b8342f', nombre: 'roja' },
  { id: '#3f8a3a', nombre: 'verde de cachaña' }, { id: '#2f5a74', nombre: 'azul' },
  { id: '#d9a23a', nombre: 'amarilla' },
];
// qué modelos de la mano cambian con esta sección
export const MODELOS_PERSONALES = ['hacha', 'hachuela', 'martillo', 'arco', 'ballesta', 'lanza', 'honda'];

export function armasPorDefecto() {
  return { mango: '#6b5238', grabado: 'ninguno', plumas: '#d8cfbe', nombreBallesta: '', conCintas: false, cinta: '#b8342f', lucirForja: true };
}

export function sanearArmas(d) {
  const b = armasPorDefecto();
  const v = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  return {
    mango: color(v.mango, b.mango),
    grabado: elegir(v.grabado, GRABADOS.map((g) => g.id), b.grabado),
    plumas: color(v.plumas, b.plumas),
    nombreBallesta: texto(v.nombreBallesta, '', 18),
    conCintas: v.conCintas === true,
    cinta: color(v.cinta, b.cinta),
    lucirForja: v.lucirForja !== false,
  };
}

// Lo forjado que cambia cómo se ve cada arma (claves de `progreso.cosas`).
export function forjaVisible(datos, cosas) {
  const c = cosas && typeof cosas === 'object' ? cosas : {};
  const si = datos?.lucirForja !== false;
  return { lanza: si && !!c.lanzaHielo, arco: si && !!c.arcoRayo, honda: si && !!c.hondaEmpuje, ballesta: si && !!c.ballestaRepeticion };
}

// La firma de un modelo: si no cambió, no se vuelve a armar.
export function firmaArma(id, datos, forja) {
  const d = datos || armasPorDefecto();
  const f = forja || {};
  switch (id) {
    case 'hacha': case 'hachuela': case 'martillo': return `${d.mango}|${d.grabado}`;
    case 'arco': return `${d.plumas}|${f.arco ? 1 : 0}`;
    case 'ballesta': return `${d.plumas}|${d.nombreBallesta}|${f.ballesta ? 1 : 0}`;
    case 'lanza': return `${d.conCintas ? d.cinta : '-'}|${f.lanza ? 1 : 0}`;
    case 'honda': return `${f.honda ? 1 : 0}`;
    default: return '';
  }
}

// 2.8: el nombre de la ballesta en la barra (lo usa `mochila.js`)
export function nombreDeBallesta(progreso, base) {
  const n = texto(progreso?.personal?.armas?.nombreBallesta, '', 18);
  return n ? `${base} «${n}»` : base;
}

export const SECCION_ARMAS = registrarSeccion({
  id: 'armas',
  titulo: 'Armas y herramientas',
  orden: 60,
  porDefecto: armasPorDefecto,
  sanear: sanearArmas,
  construir(cont, api) {
    const d = sanearArmas(api.datos);
    campoColores(cont, 'Mango del hacha', MADERAS, d.mango, (v) => api.cambiar({ mango: v }));
    campoElegir(cont, 'Grabado del mango', GRABADOS, d.grabado, (v) => api.cambiar({ grabado: v }));
    campoColores(cont, 'Plumas de las flechas', PLUMAS, d.plumas, (v) => api.cambiar({ plumas: v }));
    campoTexto(cont, 'Nombre de la ballesta', d.nombreBallesta, 18, (v) => api.cambiar({ nombreBallesta: v }), 'sin nombre');
    campoSi(cont, 'Cintas en la lanza', d.conCintas, (v) => api.cambiar({ conCintas: v }));
    campoColores(cont, 'Color de las cintas', TINTAS, d.cinta, (v) => api.cambiar({ cinta: v, conCintas: true }));
    campoSi(cont, 'Que se note lo forjado', d.lucirForja, (v) => api.cambiar({ lucirForja: v }));
  },
  aplicar(datos, api) {
    const enMano = refDelMundo(api, 'enmano', 'enMano');
    if (!enMano || typeof enMano.personalizar !== 'function') return;
    // lo forjado se lee al sacar cada arma: así se nota apenas salís de la forja
    enMano.personalizar(sanearArmas(datos), () => api?.progreso?.cosas || {});
  },
});

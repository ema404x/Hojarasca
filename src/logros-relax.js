// Logros del Relax. Hasta la 1.10 los logros existían sólo en el Desafío; el Relax,
// que es la mitad del juego, no tenía ninguno. Estos se miran sobre la partida (no hay
// que avisarle a nada cuando pasa algo): cada tanto se revisa y lo nuevo se anuncia.
//
// Son globales, como en Steam: no dependen de la partida en la que los ganaste. Cada
// uno tiene su nombre de API de Steam (steam.js) para cuando el juego esté ahí.
//
// Módulo puro (se prueba en Node); el almacenamiento se inyecta.

const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const hecho = (p, id) => p?.encargos?.[id] === 'hecho';
const anotado = (p, id) => !!p?.entradas?.[id];
const cuantasAnotaciones = (p) => Object.keys(p?.entradas || {}).length;

export const RECETAS_RELAX = ['pinones-tostados', 'dulce-calafate', 'frutillas-brasas', 'papas-rescoldo', 'habas-salteadas', 'guiso-campo', 'tortilla-papas', 'torta-frita'];

export const LOGROS_RELAX = [
  { id: 'libreta', nombre: 'Libreta gastada', texto: 'Anotá 25 cosas en el cuaderno de campo.', cumple: (p) => cuantasAnotaciones(p) >= 25 },
  { id: 'cuaderno-lleno', nombre: 'Cuaderno lleno', texto: 'Anotá 100 cosas en el cuaderno de campo.', cumple: (p) => cuantasAnotaciones(p) >= 100 },
  { id: 'cuatro-puntas', nombre: 'Las cuatro puntas', texto: 'Pisá el mirador, el puesto, el faro y la estación.', cumple: (p) => ['mirador', 'puesto', 'faro', 'estacion'].every((k) => anotado(p, k)) },
  { id: 'vuelta-entera', nombre: 'Sin bajarse', texto: 'Dá la vuelta entera al valle en la trochita.', cumple: (p) => n(p?.vueltas) >= 1 },
  { id: 'tres-hachazos', nombre: 'Tres hachazos', texto: 'Talá tu primer árbol.', cumple: (p) => anotado(p, 'tronco-mat') },
  { id: 'devolver', nombre: 'Devolver lo que sacaste', texto: 'Plantá cinco renovales.', cumple: (p) => (p?.renovales || []).length >= 5 },
  { id: 'manos-tierra', nombre: 'Manos en la tierra', texto: 'Cosechá algo de tu propio cantero.', cumple: (p) => ['haba', 'papa', 'frutilla-huerta'].some((k) => anotado(p, k)) },
  { id: 'vellon', nombre: 'Tijera y vellón', texto: 'Esquilá tu primera oveja.', cumple: (p) => anotado(p, 'vellon') },
  { id: 'al-tranco', nombre: 'Al tranco', texto: 'Subite al zaino de Don Ramón.', cumple: (p) => anotado(p, 'caballo') },
  { id: 'mesa-completa', nombre: 'La mesa del campo', texto: 'Cociná todo lo que da el valle y tu huerta.', cumple: (p) => RECETAS_RELAX.every((k) => anotado(p, k)) },
  { id: 'tres-de-tres', nombre: 'Tres de tres', texto: 'Pescá y devolvé una arcoíris, una marrón y una de arroyo.', cumple: (p) => ['arcoiris', 'marron', 'fontinalis'].every((k) => p?.peces?.[k]) },
  { id: 'rollo', nombre: 'Rollo entero', texto: 'Sacá diez fotos.', cumple: (p) => n(p?.fotos) >= 10 },
  { id: 'correo', nombre: 'Correo al día', texto: 'Leé cuatro cartas en el almacén.', cumple: (p) => hecho(p, 'e-correo') },
  { id: 'rayo', nombre: 'Olor a quemado', texto: 'Mirá caer un rayo cerca.', oculto: true, cumple: (p) => anotado(p, 'rayo') },
  { id: 'de-aca', nombre: 'Alguien de acá', texto: 'Cerrá todos los encargos del valle.', oculto: true, cumple: (p) => hecho(p, 'e-valle') },
  { id: 'constructor', nombre: 'Lo tuyo', texto: 'Terminá un puesto propio.', cumple: (p) => (p?.obras || []).some((o) => o.plano === 'puesto' && n(o.etapas) >= 4) },
];
const IDS = new Set(LOGROS_RELAX.map((l) => l.id));

export function sanearLogrosRelax(dato) {
  const x = dato && typeof dato === 'object' && !Array.isArray(dato) ? dato : {};
  const logros = {};
  for (const [id, fecha] of Object.entries(x.logros || {})) {
    if (IDS.has(id) && typeof fecha === 'string' && Number.isFinite(Date.parse(fecha))) logros[id] = fecha;
  }
  return { version: 1, logros };
}

// Los que se cumplen con esta partida y todavía no estaban. Puro: no guarda nada.
export function nuevosLogros(p, yaTiene) {
  return LOGROS_RELAX.filter((l) => !yaTiene(l.id) && l.cumple(p)).map((l) => l.id);
}

export function crearLogrosRelax(almacen = (typeof localStorage !== 'undefined' ? localStorage : null), clave = 'hojarasca-logros-relax-v1', ahora = () => new Date().toISOString()) {
  let datos;
  try {
    const crudo = almacen ? almacen.getItem(clave) : null;
    datos = sanearLogrosRelax(crudo ? JSON.parse(crudo) : null);
  } catch { datos = sanearLogrosRelax(null); }
  const guardar = () => { try { if (almacen) almacen.setItem(clave, JSON.stringify(datos)); } catch { /* queda en memoria */ } };
  const api = {
    tiene: (id) => Object.prototype.hasOwnProperty.call(datos.logros, id),
    // Revisa la partida y desbloquea lo que corresponda. Devuelve los logros nuevos.
    revisar(p) {
      const ids = nuevosLogros(p, api.tiene);
      if (!ids.length) return [];
      for (const id of ids) datos.logros[id] = ahora();
      guardar();
      return ids.map((id) => LOGROS_RELAX.find((l) => l.id === id));
    },
    todos: () => LOGROS_RELAX.map((l) => ({ id: l.id, nombre: l.nombre, texto: l.texto, oculto: !!l.oculto, desbloqueado: api.tiene(l.id), fecha: datos.logros[l.id] || null })),
    progreso: () => ({ hechos: Object.keys(datos.logros).length, total: LOGROS_RELAX.length }),
    estado: () => ({ version: 1, logros: { ...datos.logros } }),
  };
  return api;
}

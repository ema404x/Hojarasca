// 4.23.0 (B): el cuaderno «Lo vivido» de la Historia. Las 124 escenas ya traen su `resumen` (hasta hoy sólo se mostraba al saltar una escena): acá queda lo que viviste,
// capítulo por capítulo y con el día, para volver a una partida después de una semana o jugar por tandas. No hay texto nuevo ni clave nueva de guardado: se arma con
// `progreso.historia.escenas.vistas` ({ id: día }) y los datos de las escenas.
// Sin spoilers: sólo entran las escenas que ya viste (aunque las hayas saltado: igual quedaron vistas y con sus efectos) y sólo los capítulos con alguna; el título
// de un capítulo que todavía no tocaste no aparece, ni cuántas escenas tiene. Módulo puro (se prueba en Node); `dibujarVivido` arma las dos páginas del cuaderno.
import { CAPITULOS } from './historia.js';
import { ESCENAS_ACTO1 } from './historia-escenas-acto1.js';
import { ESCENAS_ACTO2 } from './historia-escenas-acto2.js';
import { ESCENAS_ACTO3 } from './historia-escenas-acto3.js';
import { ESCENAS_OPTATIVAS } from './historia-escenas-optativas.js';
import { ESCENAS_LAZOS } from './historia-escenas-lazos.js';

const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
export const ESCENAS_HISTORIA = { ...ESCENAS_ACTO1, ...ESCENAS_ACTO2, ...ESCENAS_ACTO3, ...ESCENAS_OPTATIVAS, ...ESCENAS_LAZOS };
export const TOTAL_ESCENAS = Object.keys(ESCENAS_HISTORIA).length;
const POSICION = Object.fromEntries(Object.keys(ESCENAS_HISTORIA).map((id, i) => [id, i]));

// Las escenas vividas, en orden: por capítulo, después por día y, a igual día, en el orden en que se vieron.
// [{ id, titulo, capitulo, dia, resumen }]
export function escenasVividas(h) {
  const vistas = Object.entries(obj(obj(h?.escenas).vistas));
  const r = [];
  vistas.forEach(([id, dia], i) => {
    if (!Object.hasOwn(ESCENAS_HISTORIA, id)) return;
    const e = ESCENAS_HISTORIA[id];
    r.push({ id, titulo: String(e.titulo || ''), capitulo: Number(e.capitulo) || 1, dia: Math.max(1, Math.floor(Number(dia) || 1)), resumen: String(e.resumen || ''), orden: i });
  });
  r.sort((a, b) => a.capitulo - b.capitulo || a.dia - b.dia || a.orden - b.orden);
  return r.map(({ orden, ...x }) => x);
}

// Lo vivido agrupado por capítulo: [{ numero, id, titulo, escenas: [...] }] (sólo los capítulos con alguna escena vista)
export function capitulosVividos(h) {
  const grupos = new Map();
  for (const e of escenasVividas(h)) {
    const c = CAPITULOS[Math.min(CAPITULOS.length, Math.max(1, e.capitulo)) - 1];
    if (!grupos.has(e.capitulo)) grupos.set(e.capitulo, { numero: e.capitulo, id: c.id, titulo: c.titulo, escenas: [] });
    grupos.get(e.capitulo).escenas.push(e);
  }
  return [...grupos.values()].sort((a, b) => a.numero - b.numero);
}

// ¿Tiene sentido mostrar la pestaña? (con la historia empezada o alguna escena vista)
export const hayVivido = (h) => Number(obj(h).empezada) > 0 || Object.keys(obj(obj(obj(h).escenas).vistas)).length > 0;

export const TEXTO_VIVIDO_VACIO = 'Todavía no viviste ninguna escena. A medida que avance la historia del valle queda acá lo que pasó, capítulo por capítulo y con el día.';
export const TEXTO_VIVIDO_INTRO = 'Lo que ya viviste de la historia del valle, capítulo por capítulo. Sólo está lo que viste: lo que falta, falta.';

// Las dos páginas del cuaderno. `lista` (izquierda): el avance y los capítulos; `ficha` (derecha): las escenas del capítulo elegido.
// `el(tag, clase, texto)` crea los nodos (el mismo de las otras pestañas); `redibujar` vuelve a dibujar el cuaderno al elegir otro capítulo.
let capituloElegido = null;
export function dibujarVivido(lista, ficha, el, h, redibujar) {
  const grupos = capitulosVividos(h);
  const n = grupos.reduce((s, g) => s + g.escenas.length, 0);
  lista.appendChild(el('p', 'progreso', `${n} de ${TOTAL_ESCENAS} escenas vividas`));
  if (!grupos.length) {
    lista.appendChild(el('p', 'pista', TEXTO_VIVIDO_VACIO));
    ficha.appendChild(el('h2', '', 'Lo vivido'));
    ficha.appendChild(el('p', 'texto', TEXTO_VIVIDO_INTRO));
    return;
  }
  const elegido = grupos.find((g) => g.numero === capituloElegido) || grupos[grupos.length - 1];
  const ul = el('ul', 'lista');
  for (const g of grupos) {
    const b = el('button');
    b.appendChild(el('span', '', `${g.numero}. ${g.titulo}`));
    b.appendChild(el('span', 'marca', `${g.escenas.length}`));
    if (g === elegido) b.setAttribute('aria-current', 'true');
    b.addEventListener('click', () => { capituloElegido = g.numero; if (typeof redibujar === 'function') redibujar(); });
    const li = el('li'); li.appendChild(b); ul.appendChild(li);
  }
  lista.appendChild(ul);
  ficha.appendChild(el('h2', '', elegido.titulo));
  ficha.appendChild(el('p', 'anotado', `Capítulo ${elegido.numero} de ${CAPITULOS.length} · ${elegido.escenas.length} ${elegido.escenas.length === 1 ? 'escena vivida' : 'escenas vividas'}`));
  for (const e of elegido.escenas) {
    ficha.appendChild(el('p', 'anotado', `Día ${e.dia} · ${e.titulo}`));
    ficha.appendChild(el('p', 'texto', e.resumen));
  }
}
// Para las pruebas: soltar el capítulo elegido
export function olvidarCapituloVivido() { capituloElegido = null; }

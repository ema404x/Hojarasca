// 4.11.1 (U7): que el foco del teclado sobreviva al redibujo de una lista o de unas pestañas.
//
// La mochila y el cuaderno se rehacen enteros (`innerHTML = ''`) con cada cambio: el elemento que tenía el foco desaparecía y el
// teclado volvía al principio (o a la página). Antes de rehacer se anota dónde estaba el foco (en qué contenedor, qué lugar ocupaba entre
// los elementos enfocables y, si tiene `data-foco`, qué cosa era); después de rehacer se vuelve a poner en la misma cosa, o en el mismo
// lugar si esa cosa ya no está (el vecino es mejor que el principio). Sin DOM propio: recibe el `document`, así se prueba en Node con uno de mentira.

const ENFOCABLES = 'button, input, select, textarea, a[href], [tabindex]';

const lugares = (cont) => Array.from(cont.querySelectorAll(ENFOCABLES)).filter((x) => !x.disabled && x.getAttribute?.('tabindex') !== '-1');

// Anota dónde está el foco, si está dentro de alguno de los contenedores (`ids`); si no, null.
export function guardarFoco(doc, ids) {
  const a = doc?.activeElement;
  if (!a || a === doc.body) return null;
  for (const id of ids) {
    const cont = doc.getElementById(id);
    if (!cont || cont === a || !cont.contains(a)) continue;
    const lista = lugares(cont);
    const i = lista.indexOf(a);
    if (i < 0) return null;
    const clave = a.dataset?.foco ?? null;
    const n = clave == null ? 0 : lista.filter((x) => x.dataset?.foco === clave).indexOf(a);
    return { id, i, clave, n };
  }
  return null;
}

// Devuelve el foco a lo anotado. Verdadero si lo puso en algún lado.
export function devolverFoco(doc, marca) {
  if (!marca) return false;
  const cont = doc.getElementById(marca.id);
  if (!cont) return false;
  const lista = lugares(cont);
  if (!lista.length) return false;
  let el = null;
  if (marca.clave != null) {
    const mismas = lista.filter((x) => x.dataset?.foco === marca.clave);
    el = mismas[marca.n] || mismas[mismas.length - 1] || null;
  }
  if (!el) el = lista[Math.max(0, Math.min(marca.i, lista.length - 1))];
  try { el.focus({ preventScroll: true }); } catch { el.focus(); }
  return true;
}

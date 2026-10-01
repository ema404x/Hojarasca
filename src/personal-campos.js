// 2.8: los controles de las secciones de "Personalizar" (perro, caballo, kayak, trochita,
// armas, música y cuaderno). Módulo puro al importarse: no toca el DOM hasta que una
// sección lo llama desde su `construir`, que sólo corre en el juego.
//
// Todo se arma con elementos comunes (select, input, button) y las clases del panel.

// 2.8: colores con nombre, para elegir con muestras en lugar de un selector suelto
export const TINTAS = [
  { id: '#7c2f22', nombre: 'rojo tierra' }, { id: '#b8342f', nombre: 'rojo notro' },
  { id: '#d4552a', nombre: 'naranja' }, { id: '#d9a23a', nombre: 'amarillo amancay' },
  { id: '#4f6b2a', nombre: 'verde lenga' }, { id: '#2f5a74', nombre: 'azul lago' },
  { id: '#3b4f8a', nombre: 'azul noche' }, { id: '#6a3f7a', nombre: 'calafate' },
  { id: '#e8e2d6', nombre: 'blanco lana' }, { id: '#2a2723', nombre: 'negro' },
];
export const MADERAS = [
  { id: '#6b5238', nombre: 'lenga' }, { id: '#8a6b4a', nombre: 'ciprés claro' },
  { id: '#4a3b2c', nombre: 'ñire oscuro' }, { id: '#9a7a55', nombre: 'coihue' },
  { id: '#5a3b24', nombre: 'nogal' }, { id: '#b89a6a', nombre: 'arrayán pelado' },
];
export const CUEROS = [
  { id: '#5a3b24', nombre: 'suela' }, { id: '#3a2616', nombre: 'cuero oscuro' },
  { id: '#8a5a32', nombre: 'crudo' }, { id: '#2a2723', nombre: 'negro' },
  { id: '#7c2f22', nombre: 'colorado' }, { id: '#b9ad93', nombre: 'lana cruda' },
];

// 2.8: una referencia del mundo que `api.mundo` puede traer con uno u otro nombre.
// Devuelve null si no hay. (Nunca llama a lo que encuentra: `nota` y otras son funciones.)
export function refDelMundo(api, ...claves) {
  const m = api && api.mundo && typeof api.mundo === 'object' ? api.mundo : null;
  if (!m) return null;
  for (const k of claves) if (Object.hasOwn(m, k) && m[k]) return m[k];
  return null;
}

const docDe = (cont) => cont?.ownerDocument || (typeof document !== 'undefined' ? document : null);

// 2.8: las clases son las mismas que usan el panel y los ajustes de la pausa
// (`personal-controles.js`): fila-ajuste, segmentos con aria-pressed, personal-muestra con
// --muestra, personal-texto, personal-boton y personal-nota. Así se ve igual que el resto.

// una fila: el título y lo que va abajo
export function fila(cont, etiqueta) {
  const d = docDe(cont);
  const f = d.createElement('div');
  f.className = 'fila-ajuste personal-fila';
  if (etiqueta) {
    const s = d.createElement('span');
    s.textContent = etiqueta;
    f.appendChild(s);
  }
  cont.appendChild(f);
  return f;
}

export function nota(cont, texto) {
  const p = docDe(cont).createElement('p');
  p.className = 'personal-nota';
  p.textContent = texto;
  cont.appendChild(p);
  return p;
}

export function subtitulo(cont, texto) {
  const h = docDe(cont).createElement('h4');
  h.className = 'personal-subtitulo';
  h.textContent = texto;
  cont.appendChild(h);
  return h;
}

// una lista desplegable con los colores del panel (oscuro y letra clara)
export function lista(d) {
  const s = (d || document).createElement('select');
  s.className = 'personal-elegir';
  s.style.cssText = 'background:rgba(0,0,0,.25);color:inherit;border:1px solid rgba(239,230,210,.35);border-radius:10px;padding:6px 10px;font:inherit;max-width:100%';
  return s;
}

// botones de a uno elegido (como `segmentos` del panel)
function grupoSegmentos(d, opciones, valor, alElegir) {
  const g = d.createElement('div');
  g.className = 'segmentos personal-segmentos';
  g.setAttribute('role', 'group');
  g.style.flexWrap = 'wrap';
  const botones = [];
  for (const o of opciones) {
    const b = d.createElement('button');
    b.type = 'button';
    b.textContent = o.nombre;
    b.dataset.valor = String(o.id);
    b.setAttribute('aria-pressed', String(o.id === valor));
    b.addEventListener('click', () => {
      for (const x of botones) x.setAttribute('aria-pressed', String(x === b));
      alElegir(o.id);
    });
    botones.push(b);
    g.appendChild(b);
  }
  return g;
}

// opciones: [{ id, nombre }]. Pocas y cortas van en botones; si no, en una lista.
export function campoElegir(cont, etiqueta, opciones, valor, alCambiar) {
  const f = fila(cont, etiqueta);
  const d = docDe(cont);
  if (opciones.length <= 7 && opciones.every((o) => o.nombre.length <= 30)) {
    const g = grupoSegmentos(d, opciones, valor, alCambiar);
    f.appendChild(g);
    return g;
  }
  const s = lista(d);
  for (const o of opciones) {
    const op = d.createElement('option');
    op.value = o.id; op.textContent = o.nombre;
    if (o.id === valor) op.selected = true;
    s.appendChild(op);
  }
  s.addEventListener('change', () => alCambiar(s.value));
  s.addEventListener('keydown', (e) => { if (e.code !== 'Escape') e.stopPropagation(); });
  f.appendChild(s);
  return s;
}

// muestras de color: un botón por color (y el que viene de antes, si no está)
export function campoColores(cont, etiqueta, colores, valor, alCambiar) {
  const f = fila(cont, etiqueta);
  const d = docDe(cont);
  const caja = d.createElement('div');
  caja.className = 'personal-muestras';
  caja.setAttribute('role', 'group');
  caja.setAttribute('aria-label', etiqueta);
  const lista = colores.some((c) => c.id === valor) || !valor ? colores : [...colores, { id: valor, nombre: 'el tuyo' }];
  const botones = [];
  for (const c of lista) {
    const b = d.createElement('button');
    b.type = 'button';
    b.className = 'personal-muestra';
    b.dataset.valor = c.id;
    b.title = c.nombre;
    b.setAttribute('aria-label', c.nombre);
    b.setAttribute('aria-pressed', String(c.id === valor));
    b.style.setProperty('--muestra', c.id);
    b.addEventListener('click', () => {
      for (const x of botones) x.setAttribute('aria-pressed', String(x === b));
      alCambiar(c.id);
    });
    botones.push(b);
    caja.appendChild(b);
  }
  f.appendChild(caja);
  return caja;
}

// Un campo de texto: se guarda al terminar (Enter o al salir) y las teclas no llegan al
// juego mientras se escribe (salvo Escape, que cierra el panel).
export function campoTexto(cont, etiqueta, valor, max, alCambiar, sugerencia = '') {
  const f = fila(cont, etiqueta);
  const i = docDe(cont).createElement('input');
  i.type = 'text';
  i.className = 'personal-texto';
  i.maxLength = max;
  i.value = valor || '';
  i.placeholder = sugerencia;
  i.autocomplete = 'off';
  i.spellcheck = false;
  let ultimo = i.value;
  const listo = () => { if (i.value !== ultimo) { ultimo = i.value; alCambiar(i.value); } };
  i.addEventListener('change', listo);
  i.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') return;
    e.stopPropagation();
    if (e.code === 'Enter') { e.preventDefault(); listo(); }
  });
  i.addEventListener('keyup', (e) => { if (e.code !== 'Escape') e.stopPropagation(); });
  f.appendChild(i);
  return i;
}

// sí o no, con los mismos botones que los ajustes
export function campoSi(cont, etiqueta, valor, alCambiar) {
  const f = fila(cont, etiqueta);
  const g = grupoSegmentos(docDe(cont), [{ id: true, nombre: 'Sí' }, { id: false, nombre: 'No' }], !!valor, alCambiar);
  f.appendChild(g);
  return g;
}

export function boton(cont, texto, alTocar) {
  const b = docDe(cont).createElement('button');
  b.type = 'button';
  b.className = 'personal-boton';
  b.textContent = texto;
  b.addEventListener('click', alTocar);
  cont.appendChild(b);
  return b;
}

// varias cosas en un mismo renglón (una lista y su botón)
export function enLinea(cont) {
  const d = docDe(cont).createElement('div');
  d.className = 'personal-en-linea';
  d.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap';
  cont.appendChild(d);
  return d;
}

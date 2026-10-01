// 2.8: controles comunes del panel "Personalizar". Módulo puro al importarse: sólo usa
// `document` adentro de las funciones, que se llaman desde `construir` (en el juego).
// Los botones usan las mismas clases que los ajustes de la pausa (.segmentos con
// aria-pressed), así el panel se ve igual que el resto de los menús.

// Una fila con título, el control y (opcional) una ayuda chica abajo.
export function fila(contenedor, titulo, control, ayuda = '') {
  const d = document.createElement('div');
  d.className = 'fila-ajuste personal-fila';
  const t = document.createElement('span');
  t.textContent = titulo;
  d.appendChild(t);
  if (control) d.appendChild(control);
  if (ayuda) {
    const s = document.createElement('small');
    s.textContent = ayuda;
    d.appendChild(s);
  }
  contenedor.appendChild(d);
  return d;
}

// Botones de a uno elegido. `opciones`: [{ valor, texto, bloqueado?, titulo? }].
export function segmentos(opciones, actual, alElegir, etiqueta = '') {
  const g = document.createElement('div');
  g.className = 'segmentos personal-segmentos';
  g.setAttribute('role', 'group');
  if (etiqueta) g.setAttribute('aria-label', etiqueta);
  for (const o of opciones) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = o.texto;
    b.dataset.valor = String(o.valor);
    b.setAttribute('aria-pressed', String(o.valor === actual));
    if (o.titulo) b.title = o.titulo;
    if (o.bloqueado) {
      b.disabled = true;
      b.classList.add('bloqueado');
      b.title = o.titulo || 'Todavía no lo conseguiste';
    } else b.addEventListener('click', () => alElegir(o.valor));
    g.appendChild(b);
  }
  return g;
}

// Muestras de color. `opciones`: [{ valor, color, texto, bloqueado?, titulo? }].
export function muestras(opciones, actual, alElegir, etiqueta = '') {
  const g = document.createElement('div');
  g.className = 'personal-muestras';
  g.setAttribute('role', 'group');
  if (etiqueta) g.setAttribute('aria-label', etiqueta);
  for (const o of opciones) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'personal-muestra';
    b.style.setProperty('--muestra', o.color);
    b.dataset.valor = String(o.valor);
    b.setAttribute('aria-pressed', String(o.valor === actual));
    b.setAttribute('aria-label', o.texto);
    b.title = o.bloqueado ? `${o.texto} · ${o.titulo || 'todavía no'}` : o.texto;
    if (o.bloqueado) { b.disabled = true; b.classList.add('bloqueado'); }
    else b.addEventListener('click', () => alElegir(o.valor));
    g.appendChild(b);
  }
  return g;
}

export const siNo = (actual, alElegir, textos = ['Sí', 'No']) =>
  segmentos([{ valor: true, texto: textos[0] }, { valor: false, texto: textos[1] }], !!actual, alElegir);

// Un campo de texto que no deja que las teclas lleguen al juego (salvo Escape y Enter).
export function campoTexto(valor, max, alEnter, placeholder = '') {
  const i = document.createElement('input');
  i.type = 'text';
  i.className = 'personal-texto';
  i.maxLength = max;
  i.value = valor || '';
  i.placeholder = placeholder;
  i.autocomplete = 'off';
  i.spellcheck = false;
  i.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') return;
    e.stopPropagation();
    if (e.code === 'Enter' && alEnter) { e.preventDefault(); alEnter(i.value); }
  });
  return i;
}

export function boton(texto, alTocar, clase = '') {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `personal-boton ${clase}`.trim();
  b.textContent = texto;
  b.addEventListener('click', alTocar);
  return b;
}

export function parrafo(texto, clase = 'personal-nota') {
  const p = document.createElement('p');
  p.className = clase;
  p.textContent = texto;
  return p;
}

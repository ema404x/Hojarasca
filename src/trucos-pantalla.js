// 4.5: la ventana de la consola de códigos (DOM; sin reglas: las reglas están en trucos.js y el enganche con el juego en
// trucos-juego.js). Una hoja de papel pegada al borde de arriba, con el registro de lo escrito y lo respondido, las sugerencias y la
// línea donde se escribe. Los textos fijos están en trucos-textos.js. Cerrada, no hace nada por cuadro: es un nodo oculto.
import { TITULO, PIE, PISTA_ENTRADA, BIENVENIDA } from './trucos-textos.js';

const REGISTRO_MAX = 90;

export function crearTrucosPantalla(doc = document) {
  const $ = (id) => doc.getElementById(id);
  const raiz = $('trucos'), registro = $('trucos-registro'), sugerencias = $('trucos-sugerencias'), entrada = $('trucos-entrada');
  if (!raiz || !registro || !sugerencias || !entrada) return null;
  $('trucos-titulo').textContent = TITULO;
  $('trucos-pie').textContent = PIE;
  entrada.placeholder = PISTA_ENTRADA;
  let alElegir = null;

  function linea(texto, clase) {
    const p = doc.createElement('p');
    p.className = clase || '';
    p.textContent = texto;
    registro.appendChild(p);
    while (registro.childNodes.length > REGISTRO_MAX) registro.removeChild(registro.firstChild);
    return p;
  }
  const abajo = () => { registro.scrollTop = registro.scrollHeight; };

  return {
    entrada,
    abierto: () => !raiz.classList.contains('oculto'),
    abrir() {
      raiz.classList.remove('oculto');
      if (!registro.childNodes.length) linea(BIENVENIDA, 'tenue');
      abajo();
      entrada.focus({ preventScroll: true });
    },
    cerrar() {
      raiz.classList.add('oculto');
      sugerencias.classList.add('oculto');
      sugerencias.replaceChildren();
      entrada.blur();
    },
    valor: () => entrada.value,
    poner(texto) { entrada.value = String(texto ?? ''); const n = entrada.value.length; try { entrada.setSelectionRange(n, n); } catch { /* sin selección */ } },
    // lo que escribió y lo que contestó el motor (`resultado`: { ok, texto, lineas? })
    responder(escrito, resultado) {
      if (escrito) linea(`› ${escrito}`, 'escrito');
      if (resultado.lineas) resultado.lineas.forEach((t, i) => linea(t, t.startsWith('—') ? 'grupo' : i === 0 ? 'tenue' : 'bien'));
      else linea(resultado.texto, resultado.ok ? 'bien' : 'mal');
      abajo();
    },
    aviso(texto) { linea(texto, 'tenue'); abajo(); },
    limpiar() { registro.replaceChildren(); },
    // las sugerencias de lo que se está escribiendo; `elegida`: la que marcó Tab (o -1)
    sugerencias(lista, elegida = -1) {
      sugerencias.replaceChildren();
      if (!lista.length) { sugerencias.classList.add('oculto'); return; }
      lista.slice(0, 12).forEach((s, i) => {
        const b = doc.createElement('button');
        b.type = 'button';
        b.tabIndex = -1;
        if (i === elegida) b.className = 'elegida';
        b.textContent = s.etiqueta;
        if (s.ayuda) { const c = doc.createElement('small'); c.textContent = s.ayuda; b.appendChild(c); }
        b.addEventListener('mousedown', (ev) => { ev.preventDefault(); alElegir?.(s); });   // sin sacar el foco de la línea
        sugerencias.appendChild(b);
      });
      sugerencias.classList.remove('oculto');
    },
    cuandoElige(fn) { alElegir = typeof fn === 'function' ? fn : null; },
    enfocar() { entrada.focus({ preventScroll: true }); },
  };
}

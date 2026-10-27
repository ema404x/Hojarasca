// 4.11.4: la pantalla del banco de sonidos (se abre desde la pausa, junto al «Banco de pruebas»). Las reglas y el catálogo están en
// `banco-sonidos.js`; acá sólo se dibuja la lista, se leen las teclas y se muestra qué suena y por qué bus sale. Sólo teclado y ratón.
//   ↑ ↓ elegir · Re Pág / Av Pág cambian de grupo · Inicio / Fin · Enter o clic: oírlo · ← → la variante del sonido elegido
//   Espacio: detener todo · D, L y F cambian la distancia, el lado y la fuerza · Tab pasa a los volúmenes · Escape vuelve a la pausa (lo lee main.js).
// NO toca la partida: no guarda nada ni lee la partida. Los volúmenes del costado son los reales de Ajustes (los mueve main.js).
import { GRUPOS, DISTANCIAS, LADOS, FUERZAS, NOMBRE_BUS } from './banco-sonidos.js';

export function crearPanelBancoSonidos({ raiz, banco }) {
  const $ = (sel) => raiz.querySelector(sel);
  const lista = $('#bs-lista'), sonando = $('#bs-sonando'), detalle = $('#bs-detalle');
  const selVariante = $('#bs-variante'), filaVariante = $('#bs-fila-variante');
  // el orden en pantalla: por grupo, y dentro de cada grupo el del catálogo
  const orden = GRUPOS.flatMap((g) => banco.catalogo.filter((e) => e.grupo === g.id));
  const opciones = { distancia: 'cerca', lado: 'frente', fuerza: 'normal' };
  const variantes = new Map();   // id de sonido -> la variante elegida
  let indice = 0, construida = false, abierta = false, reloj = null, escuchaTeclas = null;

  function construir() {
    if (construida) return;
    construida = true;
    lista.textContent = '';
    for (const g of GRUPOS) {
      const suyos = orden.filter((e) => e.grupo === g.id);
      if (!suyos.length) continue;
      const t = document.createElement('div');
      t.className = 'bs-grupo'; t.setAttribute('role', 'presentation'); t.textContent = `${g.nombre} (${suyos.length})`;
      lista.appendChild(t);
      for (const e of suyos) {
        const it = document.createElement('div');
        it.className = 'bs-item'; it.id = 'bs-e-' + e.id; it.dataset.id = e.id;
        it.setAttribute('role', 'option'); it.setAttribute('aria-selected', 'false');
        const n = document.createElement('span'); n.className = 'bs-n'; n.textContent = e.nombre;
        const m = document.createElement('span'); m.className = 'bs-marcas';
        if (e.prioridad === 1) { const b = document.createElement('b'); b.className = 'bs-nuevo'; b.textContent = `nuevo ${e.nuevo}`; m.appendChild(b); }
        else if (e.prioridad === 2) { const b = document.createElement('b'); b.className = 'bs-cambio'; b.textContent = `cambió ${e.nuevo}`; m.appendChild(b); }
        const bus = document.createElement('i'); bus.className = 'bs-bus'; bus.textContent = NOMBRE_BUS[e.bus]; m.appendChild(bus);
        it.append(n, m);
        it.addEventListener('click', () => { elegir(orden.indexOf(e)); oir(); });
        lista.appendChild(it);
      }
    }
    for (const [idSeg, lista2, clave] of [['#bs-distancia', DISTANCIAS, 'distancia'], ['#bs-lado', LADOS, 'lado'], ['#bs-fuerza', FUERZAS, 'fuerza']]) {
      const cont = $(idSeg); cont.textContent = '';
      for (const o of lista2) {
        const b = document.createElement('button');
        b.type = 'button'; b.dataset.valor = o.id; b.textContent = o.nombre;
        b.addEventListener('click', () => poner(clave, o.id));
        cont.appendChild(b);
      }
    }
    selVariante.addEventListener('change', () => { variantes.set(orden[indice].id, selVariante.value); });
    $('#bs-oir').addEventListener('click', () => oir());
    $('#bs-parar').addEventListener('click', () => parar());
    $('#bs-volver').addEventListener('click', () => { if (alVolver) alVolver(); });
    pintarOpciones();
  }
  let alVolver = null;

  const actual = () => orden[indice];
  const varianteDe = (e) => (e.variantes ? variantes.get(e.id) ?? e.variantes.defecto : null);

  function elegir(i) {
    if (!orden.length) return;
    indice = Math.max(0, Math.min(orden.length - 1, i));
    for (const it of lista.querySelectorAll('.bs-item[aria-selected="true"]')) { it.setAttribute('aria-selected', 'false'); it.classList.remove('elegido'); }
    const e = actual(), it = document.getElementById('bs-e-' + e.id);
    if (it) { it.setAttribute('aria-selected', 'true'); it.classList.add('elegido'); it.scrollIntoView?.({ block: 'nearest' }); lista.setAttribute('aria-activedescendant', it.id); }
    pintarDetalle();
  }

  function pintarDetalle() {
    const e = actual();
    if (!e) return;
    detalle.textContent = '';
    const fila = (rotulo, texto, clase) => {
      const p = document.createElement('p'); if (clase) p.className = clase;
      const b = document.createElement('b'); b.textContent = rotulo + ' ';
      p.append(b, document.createTextNode(texto)); detalle.appendChild(p);
    };
    const t = document.createElement('h3'); t.textContent = e.nombre; detalle.appendChild(t);
    fila('Sale por:', NOMBRE_BUS[e.bus] + (e.bus === 'ambiente' ? ' (la perilla «El bosque»)' : e.bus === 'musica' ? ' (la perilla «Música»)' : ' (la perilla «Efectos»)'));
    if (e.nota) fila('Escuchá:', e.nota);
    fila('Cómo se dispara:', e.como, 'bs-como');
    if (e.bucle) fila('Ojo:', 'es un sonido continuo: Enter lo prende y otro Enter lo apaga.', 'bs-ojo');
    if (e.continuo) fila('Ojo:', 'dura un buen rato: Espacio lo corta.', 'bs-ojo');
    if (e.variantes) {
      filaVariante.hidden = false;
      $('#bs-rotulo-variante').textContent = e.variantes.etiqueta;
      selVariante.textContent = '';
      for (const o of e.variantes.opciones) { const op = document.createElement('option'); op.value = o.id; op.textContent = o.nombre; selVariante.appendChild(op); }
      selVariante.value = varianteDe(e);
    } else filaVariante.hidden = true;
    // la distancia, el lado y la fuerza sólo valen para lo que las usa
    $('#bs-fila-distancia').classList.toggle('bs-sin-efecto', !e.pos);
    $('#bs-fila-lado').classList.toggle('bs-sin-efecto', !e.pos);
    $('#bs-fila-fuerza').classList.toggle('bs-sin-efecto', !e.fuerza);
  }

  function pintarOpciones() {
    for (const clave of ['distancia', 'lado', 'fuerza']) {
      for (const b of $('#bs-' + clave).querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.valor === opciones[clave]));
    }
  }
  function poner(clave, valor) { opciones[clave] = valor; pintarOpciones(); }
  function girar(clave, lista2) {
    const i = lista2.findIndex((o) => o.id === opciones[clave]);
    poner(clave, lista2[(i + 1) % lista2.length].id);
  }

  async function oir() {
    const e = actual();
    if (!e) return null;
    const r = await banco.tocar(e.id, { ...opciones, variante: varianteDe(e) });
    if (!r.ok) sonando.textContent = `No se pudo: ${r.motivo}`;
    return r;
  }
  function parar() {
    banco.detenerTodo();
    sonando.textContent = 'Todo detenido.';
    sonando.dataset.estado = 'quieto';
  }
  function moverVariante(paso) {
    const e = actual();
    if (!e?.variantes) return;
    const ids = e.variantes.opciones.map((o) => o.id);
    const i = ids.indexOf(varianteDe(e));
    variantes.set(e.id, ids[(i + paso + ids.length) % ids.length]);
    selVariante.value = variantes.get(e.id);
  }
  function saltarGrupo(paso) {
    const g = actual().grupo;
    const ids = GRUPOS.map((x) => x.id).filter((id) => orden.some((e) => e.grupo === id));
    const i = ids.indexOf(g);
    if (paso > 0) { const sig = ids[Math.min(ids.length - 1, i + 1)]; elegir(orden.findIndex((e) => e.grupo === sig)); }
    else {
      const primero = orden.findIndex((e) => e.grupo === g);
      if (indice > primero) elegir(primero); else { const ant = ids[Math.max(0, i - 1)]; elegir(orden.findIndex((e) => e.grupo === ant)); }
    }
  }

  // lo que muestra el cartel de «qué suena»: se mira cada tanto, no en cada cuadro
  function pintarEstado() {
    const s = banco.estado();
    if (s.preparando && !s.ultimo) { sonando.textContent = 'Preparando los sonidos del motor…'; sonando.dataset.estado = 'prepara'; return; }
    if (!s.ultimo) return;
    const u = s.ultimo, e = banco.porId.get(u.id);
    const bus = `sale por «${u.busNombre}»`;
    if (s.preparando && performance.now() - u.desde < 4000 && !u.creadas) { sonando.textContent = `Preparando ${u.nombre}…`; sonando.dataset.estado = 'prepara'; return; }
    const vivo = s.fuentesVivas > 0 || s.gramola || s.emisoras > 0 || s.bucles.includes(u.id);
    if (vivo && !u.cortado) {
      sonando.textContent = `Suena: ${u.nombre} · ${bus}` + (s.bucles.includes(u.id) ? ' · seguirá hasta que lo apagues' : '');
      sonando.dataset.estado = 'suena';
    } else if (!u.creadas && !u.bucle && !e?.sinFuentes && !u.cortado && performance.now() - u.desde > 500) {
      sonando.textContent = `${u.nombre}: el motor no creó ningún sonido (tope de sonidos a la vez o volumen general en 0). Esperá un momento y probá de nuevo`;
      sonando.dataset.estado = 'nada';
    } else if (u.cortado) {
      sonando.textContent = `Detenido: ${u.nombre}`;
      sonando.dataset.estado = 'quieto';
    } else {
      sonando.textContent = `Terminó: ${u.nombre} · ${bus}`;
      sonando.dataset.estado = 'termino';
    }
  }

  function tecla(ev) {
    if (!abierta) return;
    const t = ev.target;
    const enControl = t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName);
    const enBoton = t && t.tagName === 'BUTTON';
    const k = ev.code;
    if (ev.ctrlKey || ev.altKey || ev.metaKey) return;
    if (k === 'ArrowDown' && !enControl) { ev.preventDefault(); elegir(indice + 1); }
    else if (k === 'ArrowUp' && !enControl) { ev.preventDefault(); elegir(indice - 1); }
    else if (k === 'PageDown' && !enControl) { ev.preventDefault(); saltarGrupo(1); }
    else if (k === 'PageUp' && !enControl) { ev.preventDefault(); saltarGrupo(-1); }
    else if (k === 'Home' && !enControl) { ev.preventDefault(); elegir(0); }
    else if (k === 'End' && !enControl) { ev.preventDefault(); elegir(orden.length - 1); }
    else if (k === 'ArrowRight' && !enControl) { ev.preventDefault(); moverVariante(1); }
    else if (k === 'ArrowLeft' && !enControl) { ev.preventDefault(); moverVariante(-1); }
    else if ((k === 'Enter' || k === 'NumpadEnter') && !enControl && !enBoton) { ev.preventDefault(); oir(); }
    else if (k === 'Space' && !enControl && !enBoton) { ev.preventDefault(); parar(); }
    else if (k === 'KeyD' && !enControl) { girar('distancia', DISTANCIAS); }
    else if (k === 'KeyL' && !enControl) { girar('lado', LADOS); }
    else if (k === 'KeyF' && !enControl) { girar('fuerza', FUERZAS); }
  }

  function abrir({ alVolverA } = {}) {
    construir();
    alVolver = alVolverA || null;
    raiz.classList.remove('oculto');
    abierta = true;
    banco.abrir();
    elegir(indice);
    escuchaTeclas = tecla;
    document.addEventListener('keydown', escuchaTeclas);
    reloj = setInterval(pintarEstado, 120);
    pintarEstado();
    lista.focus({ preventScroll: true });
  }
  function cerrar() {
    if (!abierta) return;
    abierta = false;
    document.removeEventListener('keydown', escuchaTeclas);
    escuchaTeclas = null;
    if (reloj) { clearInterval(reloj); reloj = null; }
    banco.cerrar();
    raiz.classList.add('oculto');
    sonando.textContent = 'Todavía no sonó nada.';
    sonando.dataset.estado = 'quieto';
  }

  return { banco, abrir, cerrar, abierto: () => abierta, elegir, oir, parar, poner, actual, opciones, orden, tecla, pintarEstado };
}

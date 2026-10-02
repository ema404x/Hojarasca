// 3.5.1: los cuadros de pregunta del juego. Electron no tiene window.prompt (tira "prompt() is
// not supported" y el nombre de la obra nunca se ponía) y window.confirm traba toda la ventana
// mientras espera. Acá las preguntas son un panel más del juego: con el estilo de los otros,
// Enter acepta y Esc cancela, el botón A del mando acepta y el B cancela, y mientras está
// abierto el juego queda quieto (main.js pasa `modo` a 'dialogo', como la tarjeta del valle).
//
// Dos capas: `crearColaDialogos` es la lógica sola (una pregunta por vez, en orden; la prueba
// de Node la usa con una vista de mentira) y `crearDialogos` la arma contra el DOM de la
// plantilla (#dialogo).

// vista: { mostrar(d), ocultar(), valor() } · d = { tipo: 'confirmar' | 'texto', texto, inicial, si, no, max }
export function crearColaDialogos(vista, opciones = {}) {
  const cola = [];
  let actual = null;
  // `auto(tipo, texto, inicial)`: si devuelve algo distinto de undefined, ésa es la respuesta y
  // no se muestra nada (las pruebas con ?debug=1)
  const estado = { auto: opciones.auto || null };

  function siguiente() {
    if (actual || !cola.length) return;
    actual = cola.shift();
    try { vista.mostrar(actual); } catch (err) { const d = actual; actual = null; d.resolver(d.tipo === 'texto' ? null : false); opciones.alError?.(err); siguiente(); }
  }
  function cerrar(respuesta) {
    if (!actual) return false;
    const d = actual;
    actual = null;
    try { vista.ocultar(); } catch { /* el panel ya no está */ }
    d.resolver(respuesta);
    siguiente();
    return true;
  }
  function pedir(tipo, texto, extra = {}) {
    if (estado.auto) {
      let r;
      try { r = estado.auto(tipo, texto, extra.inicial); } catch { r = undefined; }
      if (r !== undefined) return Promise.resolve(tipo === 'texto' ? (r === null ? null : String(r)) : !!r);
    }
    return new Promise((resolver) => {
      cola.push({
        tipo, texto: String(texto ?? ''), inicial: String(extra.inicial ?? ''),
        si: extra.si || (tipo === 'texto' ? 'Listo' : 'Sí'), no: extra.no || (tipo === 'texto' ? 'Cancelar' : 'No'),
        max: Math.max(1, extra.max || 60), resolver,
      });
      siguiente();
    });
  }
  // Sí / Listo: en los de texto, lo escrito (sin espacios de más y cortado al largo máximo)
  function aceptar() {
    if (!actual) return false;
    if (actual.tipo !== 'texto') return cerrar(true);
    let v = '';
    try { v = String(vista.valor() ?? ''); } catch { v = actual.inicial; }
    return cerrar(v.trim().slice(0, actual.max).trim());
  }
  const cancelar = () => cerrar(actual?.tipo === 'texto' ? null : false);
  // una tecla del teclado: devuelve si la usó el cuadro
  function tecla(code) {
    if (!actual) return false;
    if (code === 'Enter' || code === 'NumpadEnter') { aceptar(); return true; }
    if (code === 'Escape') { cancelar(); return true; }
    return false;
  }
  return {
    confirmar: (texto, extra) => pedir('confirmar', texto, extra),
    pedirTexto: (texto, inicial = '', extra = {}) => pedir('texto', texto, { ...extra, inicial }),
    aceptar, cancelar, tecla,
    abierto: () => !!actual,
    actual: () => (actual ? { tipo: actual.tipo, texto: actual.texto, inicial: actual.inicial, si: actual.si, no: actual.no } : null),
    pendientes: () => cola.length + (actual ? 1 : 0),
    get auto() { return estado.auto; },
    set auto(f) { estado.auto = typeof f === 'function' ? f : null; },
  };
}

// El mando: A (0) acepta y B (1) cancela. Sólo cuenta apretar (no lo que ya venía apretado
// cuando se abrió el cuadro).
export function bordesMando(pads, previo) {
  const ahora = { a: false, b: false };
  for (const p of pads || []) {
    if (!p || p.connected === false || !p.buttons) continue;
    if (p.buttons[0]?.pressed) ahora.a = true;
    if (p.buttons[1]?.pressed) ahora.b = true;
  }
  return { ahora, aceptar: ahora.a && !previo?.a, cancelar: ahora.b && !previo?.b };
}

// Contra el DOM de la plantilla. `alAbrir`/`alCerrar`: main.js pausa y reanuda el juego.
export function crearDialogos({ documento = document, ventana = window, alAbrir, alCerrar, traducir = (t) => t, auto = null } = {}) {
  const $ = (id) => documento.getElementById(id);
  let relojMando = 0, previoMando = null;
  const leerPads = () => { try { return ventana.navigator?.getGamepads?.() || []; } catch { return []; } };
  const vista = {
    mostrar(d) {
      const caja = $('dialogo');
      if (!caja) throw new Error('falta el panel #dialogo');
      $('dialogo-texto').textContent = traducir(d.texto);
      const entrada = $('dialogo-entrada');
      entrada.classList.toggle('oculto', d.tipo !== 'texto');
      entrada.maxLength = d.max;
      entrada.value = d.tipo === 'texto' ? d.inicial.slice(0, d.max) : '';
      $('dialogo-si').textContent = traducir(d.si);
      $('dialogo-no').textContent = traducir(d.no);
      caja.classList.remove('oculto');
      try { alAbrir?.(d); } catch { /* el juego sigue igual */ }
      try { if (documento.pointerLockElement) documento.exitPointerLock(); } catch { /* sin bloqueo */ }
      if (d.tipo === 'texto') { entrada.focus(); entrada.select(); } else $('dialogo-si').focus();
      previoMando = bordesMando(leerPads(), null).ahora;
      clearInterval(relojMando);
      relojMando = setInterval(() => {
        const b = bordesMando(leerPads(), previoMando);
        previoMando = b.ahora;
        if (b.aceptar) cola.aceptar(); else if (b.cancelar) cola.cancelar();
      }, 50);
    },
    ocultar() {
      clearInterval(relojMando); relojMando = 0;
      $('dialogo')?.classList.add('oculto');
      const entrada = $('dialogo-entrada');
      if (entrada) { entrada.blur(); entrada.value = ''; }
      try { alCerrar?.(); } catch { /* el juego sigue igual */ }
    },
    valor: () => $('dialogo-entrada')?.value || '',
  };
  const cola = crearColaDialogos(vista, { auto });
  $('dialogo-si')?.addEventListener('click', () => cola.aceptar());
  $('dialogo-no')?.addEventListener('click', () => cola.cancelar());
  // en la captura de la ventana: antes que todos los atajos del juego. Con el cuadro abierto,
  // ninguna tecla llega al juego (escribir en el campo de texto sigue andando).
  ventana.addEventListener('keydown', (e) => {
    if (!cola.abierto()) return;
    if (cola.tecla(e.code)) e.preventDefault();
    e.stopImmediatePropagation();
  }, true);
  return cola;
}

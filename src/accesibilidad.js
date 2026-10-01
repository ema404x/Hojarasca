// Que el juego se pueda jugar como a cada uno le sirva: teclas cambiadas, letra más
// grande, colores que se distingan y los avisos también escritos. Módulo puro (sin
// three ni DOM) para poder probarlo en Node; quien pinta la pantalla es main.js.

// ---------------------------------------------------------------- teclas
// Las teclas de fábrica, tal como las usa el juego hoy.
export const TECLAS_POR_DEFECTO = {
  adelante: 'KeyW', atras: 'KeyS', izquierda: 'KeyA', derecha: 'KeyD',
  saltar: 'Space', correr: 'ShiftLeft', agacharse: 'KeyC',
  interactuar: 'KeyE', hacha: 'KeyH', aserrar: 'KeyY',
  planos: 'KeyO', taller: 'KeyK', fuego: 'KeyF',
  mochila: 'KeyI', cuaderno: 'KeyJ', mapa: 'KeyM',
  linterna: 'KeyL', prismaticos: 'KeyZ', foto: 'KeyP',
  guia: 'F1', pausa: 'Escape',
};

// Cómo se llama cada acción en el panel de opciones.
export const NOMBRES_ACCIONES = {
  adelante: 'Caminar adelante', atras: 'Caminar atrás', izquierda: 'Ir a la izquierda', derecha: 'Ir a la derecha',
  saltar: 'Saltar', correr: 'Correr', agacharse: 'Agacharse',
  interactuar: 'Juntar, anotar y hablar', hacha: 'Hacha: talar y picar', aserrar: 'Aserrar / levantar obra',
  planos: 'Planos de construcción', taller: 'Taller', fuego: 'Fuego y antorchas',
  mochila: 'Mochila', cuaderno: 'Cuaderno', mapa: 'Mapa',
  linterna: 'Linterna', prismaticos: 'Prismáticos', foto: 'Sacar una foto',
  guia: 'Guía', pausa: 'Pausa',
};

export const ACCIONES_TECLA = Object.keys(TECLAS_POR_DEFECTO);

// Estas no se mueven ni se las roba nadie: sin ellas no se sale de un menú.
export const TECLAS_RESERVADAS = ['Escape', 'F1'];
export const esFija = (accion) => TECLAS_RESERVADAS.includes(TECLAS_POR_DEFECTO[accion]);

export function mapaPorDefecto() {
  return { ...TECLAS_POR_DEFECTO };
}

// Cómo se escribe un código de tecla para que se entienda de un vistazo.
export function textoTecla(codigo) {
  const c = String(codigo || '');
  if (/^Key[A-Z]$/.test(c)) return c.slice(3);
  if (/^Digit[0-9]$/.test(c)) return c.slice(5);
  if (/^Numpad[0-9]$/.test(c)) return 'Num ' + c.slice(6);
  if (/^Arrow/.test(c)) return ({ ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' })[c];
  return ({
    Space: 'Espacio', ShiftLeft: 'Shift', ShiftRight: 'Shift der.', ControlLeft: 'Ctrl', ControlRight: 'Ctrl der.',
    AltLeft: 'Alt', AltRight: 'Alt gr.', Escape: 'Esc', Enter: 'Enter', Tab: 'Tab', Backspace: 'Borrar',
  })[c] || c;
}

// Un código de tecla de los que manda el navegador (así no entra cualquier cosa).
export const CODIGO_VALIDO = /^(Key[A-Z]|Digit\d|Numpad\d|Arrow(Up|Down|Left|Right)|F([1-9]|1[0-2])|Space|Shift(Left|Right)|Control(Left|Right)|Alt(Left|Right)|Escape|Enter|Tab|Backquote|Minus|Equal|Bracket(Left|Right)|Backslash|Semicolon|Quote|Comma|Period|Slash)$/;

// Qué acción tiene asignada una tecla (null si ninguna). Sirve para repartir el keydown.
export function accionDeTecla(mapa, codigo) {
  if (!codigo) return null;
  for (const a of Object.keys(mapa || {})) if (mapa[a] === codigo) return a;
  return null;
}

// Cambiar una tecla. Devuelve un mapa nuevo (no toca el que le pasaron) y, si no se
// pudo, el motivo en criollo para mostrarlo debajo del botón.
export function cambiarTecla(mapa, accion, codigo) {
  const base = mapa && typeof mapa === 'object' ? mapa : mapaPorDefecto();
  const c = String(codigo || '');
  if (!ACCIONES_TECLA.includes(accion)) return { ok: false, mapa: { ...base }, motivo: `No existe la acción "${accion}".` };
  if (!CODIGO_VALIDO.test(c)) return { ok: false, mapa: { ...base }, motivo: 'Esa tecla no sirve para el juego.' };
  if (base[accion] === c) return { ok: true, mapa: { ...base }, motivo: '' };
  if (esFija(accion)) {
    return { ok: false, mapa: { ...base }, motivo: `"${NOMBRES_ACCIONES[accion]}" va siempre en ${textoTecla(TECLAS_POR_DEFECTO[accion])}.` };
  }
  if (TECLAS_RESERVADAS.includes(c)) return { ok: false, mapa: { ...base }, motivo: `${textoTecla(c)} está reservada por el juego.` };
  const duena = accionDeTecla(base, c);
  if (duena && duena !== accion) {
    return { ok: false, mapa: { ...base }, motivo: `${textoTecla(c)} ya la usa "${NOMBRES_ACCIONES[duena] || duena}".` };
  }
  return { ok: true, mapa: { ...base, [accion]: c }, motivo: '' };
}

// Un mapa guardado puede venir viejo, incompleto o hecho puré: se rescata lo que sirve
// y el resto vuelve a lo de fábrica, sin dejar dos acciones con la misma tecla.
export function sanearMapaTeclas(guardado) {
  const salida = {};
  const usadas = new Set();
  const g = guardado && typeof guardado === 'object' && !Array.isArray(guardado) ? guardado : {};
  for (const a of ACCIONES_TECLA) {   // las fijas van primero y no se discuten
    if (esFija(a)) { salida[a] = TECLAS_POR_DEFECTO[a]; usadas.add(salida[a]); }
  }
  for (const a of ACCIONES_TECLA) {
    if (salida[a]) continue;
    const c = typeof g[a] === 'string' ? g[a].trim() : '';
    if (CODIGO_VALIDO.test(c) && !usadas.has(c) && !TECLAS_RESERVADAS.includes(c)) { salida[a] = c; usadas.add(c); }
  }
  for (const a of ACCIONES_TECLA) {   // lo que faltó, de fábrica, si la tecla está libre
    if (salida[a]) continue;
    const c = TECLAS_POR_DEFECTO[a];
    salida[a] = usadas.has(c) ? '' : c;
    if (salida[a]) usadas.add(c);
  }
  return salida;
}

export function teclasCambiadas(mapa) {
  return ACCIONES_TECLA.filter((a) => (mapa || {})[a] !== TECLAS_POR_DEFECTO[a]);
}

// ---------------------------------------------------------------- tamaño de letra
export const TAMANOS_LETRA = [
  { id: 'normal', nombre: 'Normal', escala: 1 },
  { id: 'grande', nombre: 'Grande', escala: 1.2 },
  { id: 'enorme', nombre: 'Enorme', escala: 1.45 },
];

export function escalaLetra(id) {
  const t = TAMANOS_LETRA.find((x) => x.id === id);
  return t ? t.escala : 1;
}

export function nombreTamano(id) {
  const t = TAMANOS_LETRA.find((x) => x.id === id);
  return t ? t.nombre : TAMANOS_LETRA[0].nombre;
}

// Para el botón que va pasando de un escalón al otro.
export function siguienteTamano(id) {
  const i = TAMANOS_LETRA.findIndex((x) => x.id === id);
  return TAMANOS_LETRA[(i + 1) % TAMANOS_LETRA.length].id;
}

// ---------------------------------------------------------------- modo daltónico
// Los tres colores con los que el juego dice algo: peligro (rojo), salud (verde) y
// aviso (amarillo). En las paletas se los cambia por pares que sí se distingan.
export const PALETAS = {
  normal: { nombre: 'Normal', peligro: '#e0301e', salud: '#a6ff6e', aviso: '#e0b12a' },
  protanopia: { nombre: 'Protanopía (rojo)', peligro: '#ff9d2e', salud: '#4aa8ff', aviso: '#ffe45e' },
  deuteranopia: { nombre: 'Deuteranopía (verde)', peligro: '#ff6f3d', salud: '#63b8ff', aviso: '#ffd94a' },
  tritanopia: { nombre: 'Tritanopía (azul)', peligro: '#ff2e2e', salud: '#00c9b1', aviso: '#ff8fd0' },
};

export const ROLES_COLOR = ['peligro', 'salud', 'aviso'];

export function paleta(nombre) {
  return PALETAS[nombre] || PALETAS.normal;
}

export function colorDe(rol, nombrePaleta = 'normal') {
  const p = paleta(nombrePaleta);
  return p[rol] || PALETAS.normal[rol] || '';
}

// Dado un color de los que usa el juego (el rojo del peligro, por ejemplo) devuelve el
// que le toca en la paleta elegida. Si es un color cualquiera, lo deja como está.
export function adaptarColor(color, nombrePaleta = 'normal') {
  const c = String(color || '').trim().toLowerCase();
  for (const rol of ROLES_COLOR) if (PALETAS.normal[rol].toLowerCase() === c) return colorDe(rol, nombrePaleta);
  return color;
}

// ---------------------------------------------------------------- subtítulos
// La hora del juego (20.5) escrita como se lee (20:30).
export function textoHora(horas) {
  const h = Number.isFinite(Number(horas)) ? ((Number(horas) % 24) + 24) % 24 : 0;
  const m = Math.floor(h * 60 + 1e-6);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

// Guarda un aviso más en la lista, sin dejarla crecer para siempre. Devuelve otra lista.
export function apilarAviso(avisos, aviso, tope = 40) {
  const lista = Array.isArray(avisos) ? avisos.slice() : [];
  if (aviso && (aviso.titulo || aviso.texto)) lista.push(aviso);
  return lista.slice(Math.max(0, lista.length - tope));
}

// Los últimos N avisos con su hora, listos para escribirlos en pantalla.
export function subtitulos(avisos, cuantos = 4) {
  const lista = Array.isArray(avisos) ? avisos : [];
  const n = Number.isFinite(Number(cuantos)) ? Math.max(0, Math.floor(Number(cuantos))) : 0;
  return lista
    .filter((a) => a && (a.titulo || a.texto))
    .slice(-n)
    .map((a) => {
      const hora = textoHora(a.hora);
      const titulo = String(a.titulo || '').trim();
      const texto = String(a.texto || '').trim();
      const cuerpo = titulo && texto ? `${titulo} — ${texto}` : titulo || texto;
      return { hora, titulo, texto, importante: !!a.importante, linea: `[${hora}] ${cuerpo}` };
    });
}

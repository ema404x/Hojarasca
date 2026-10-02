// 3.5.4: preload de las herramientas de caos (no del juego). Corre en el mismo mundo que la
// página (contextIsolation: false) antes que el juego y deja puesta la sonda:
//  · Math.random con semilla: el juego reparte igual cada vez (dónde bajan los invasores, qué
//    animal aparece). El tiempo real sigue variando: es "casi" igual, no idéntico.
//  · console.error / console.warn, window 'error' y 'unhandledrejection', con la pila,
//    en window.__caos.registro (la herramienta lo lee y lo vacía).
//  · window.close no cierra la ventana de la prueba (el botón Salir del juego).
const arg = (process.argv.find((a) => a.startsWith('--caos-semilla=')) || '').split('=')[1];
const semilla = Number(arg);
if (Number.isFinite(semilla)) {
  let s = (semilla >>> 0) || 1;
  Math.random = () => { s = (s ^ (s << 13)) >>> 0; s = (s ^ (s >>> 17)) >>> 0; s = (s ^ (s << 5)) >>> 0; return s / 4294967296; };
}
const caos = { registro: [], cerrar: 0 };
window.__caos = caos;
const texto = (a) => {
  if (a instanceof Error) return String(a.stack || a.message);
  if (typeof a === 'string') return a;
  try { return JSON.stringify(a).slice(0, 300); } catch { return String(a); }
};
const anotar = (tipo, args) => {
  if (caos.registro.length > 400) return;
  caos.registro.push({ tipo, t: Date.now(), texto: Array.from(args).map(texto).join(' ').slice(0, 1500) });
};
for (const tipo of ['error', 'warn']) {
  const orig = console[tipo].bind(console);
  console[tipo] = (...args) => { anotar(tipo, args); orig(...args); };
}
window.addEventListener('error', (e) => { if (e.error || e.message) anotar('onerror', [e.error || e.message]); });
window.addEventListener('unhandledrejection', (e) => anotar('rechazo', [e.reason]));
window.close = () => { caos.cerrar++; };
// Quién muestra u oculta cada panel (section.velo, la portada, el modo foto, las tarjetas del
// valle): los últimos cambios de la clase "oculto", con el modo del juego y la pila. Cuando la
// herramienta ve un estado imposible, los muestra.
caos.cambios = [];
const duenos = new WeakMap();
const getClassList = Object.getOwnPropertyDescriptor(Element.prototype, 'classList').get;
Object.defineProperty(Element.prototype, 'classList', { configurable: true, enumerable: true, get() { const l = getClassList.call(this); if (this.id) duenos.set(l, this); return l; } });
const vigilado = (el) => el && el.id && (el.classList.contains('velo') || el.classList.contains('valle-velo') || el.id === 'inicio' || el.id === 'foto-panel' || el.id === 'hud');
for (const m of ['add', 'remove', 'toggle']) {
  const orig = DOMTokenList.prototype[m];
  DOMTokenList.prototype[m] = function (...a) {
    const el = a[0] === 'oculto' ? duenos.get(this) : null;
    const antes = el ? this.contains('oculto') : null;
    const r = orig.apply(this, a);
    if (el && vigilado(el) && antes !== this.contains('oculto')) {
      let modo = '?'; try { modo = window.__hojarasca?.__caidas?.modo?.() ?? '?'; } catch { /* todavía no */ }
      const pila = String(new Error().stack || '').split('\n').slice(2, 7).map((l) => l.trim().replace(/^at /, '').replace(/\(?file:.*?index\.html:(\d+):\d+\)?/, '@$1')).join(' ← ');
      caos.cambios.push(`${el.id} ${this.contains('oculto') ? 'se oculta' : 'se muestra'} (modo ${modo}) ${pila}`);
      if (caos.cambios.length > 30) caos.cambios.shift();
    }
    return r;
  };
}

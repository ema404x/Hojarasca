// 4.11.1 (interfaz y ranuras): lo que pidió el usuario en DECISIONES_DISENO_4_10.md (20, 21, 22, 24 y 32).
//   U10. los pies de la carta, el banco y el local se arman desde el código con la tecla de interactuar del jugador;
//   U12. el tablero de trofeos es un panel que se queda hasta cerrarlo (E o Escape), no un aviso de 5,6 s;
//   S5.  la semilla del cantero se elige con Tab o la rueda, se ve cuál es y se guarda en la partida;
//   U7.  el foco del teclado vuelve a la misma cosa al redibujar la mochila y las pestañas del cuaderno;
//   P4.  lo personal (ropa, bandera, recetas) viaja también a una ranura vacía.
// Cada regla se EJECUTA con un mundo de mentira (un DOM mínimo hecho acá); lo que sólo se ve en una ventana (el aspecto, el foco real) lo
// mira pruebas/humo-4-11-1-interfaz.cjs en Electron. herramientas/mutar-4-11-1-interfaz.cjs rompe cada regla y confirma que esta prueba falla.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { que } from './ayuda-interacciones.mjs';
import { enUnaLinea, funcion } from './ayuda-codigo.mjs';

let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const leer = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const main = leer('src/main.js');
const html = leer('src/plantilla.html');

// ---------------------------------------------------------------- un DOM mínimo
const ENFOCABLES = ['button', 'input', 'select', 'textarea'];
class El {
  constructor(tag, doc) { this.tag = tag; this.doc = doc; this.className = ''; this.id = ''; this.hijos = []; this.padre = null; this.dataset = {}; this._attrs = {}; this._texto = ''; this.disabled = false; this.oyentes = {}; }
  get classList() { const el = this; const l = () => el.className.split(/\s+/).filter(Boolean); return { add: (c) => { if (!l().includes(c)) el.className = [...l(), c].join(' '); }, remove: (c) => { el.className = l().filter((x) => x !== c).join(' '); }, contains: (c) => l().includes(c) }; }
  get textContent() { return this.hijos.length ? this.hijos.map((h) => h.textContent).join('') : this._texto; }
  set textContent(t) { if (this.doc.activeElement && this !== this.doc.activeElement && this.contains(this.doc.activeElement)) this.doc.activeElement = this.doc.body; /* (como el navegador: lo que se saca pierde el foco) */ this.hijos.forEach((h) => { h.padre = null; }); this.hijos = []; this._texto = String(t); }
  set innerHTML(t) {
    this.textContent = '';
    for (const m of String(t).matchAll(/<(p|ul)(?: class="([^"]*)")?>/g)) { const h = new El(m[1], this.doc); h.className = m[2] || ''; this.appendChild(h); }
  }
  get innerHTML() { return ''; }
  set tabIndex(v) { this._attrs.tabindex = String(v); }
  appendChild(h) { h.padre = this; this.hijos.push(h); return h; }
  append(...hs) { for (const h of hs) this.appendChild(h); }
  setAttribute(k, v) { this._attrs[k] = String(v); }
  getAttribute(k) { return Object.hasOwn(this._attrs, k) ? this._attrs[k] : null; }
  addEventListener(t, f) { (this.oyentes[t] ||= []).push(f); }
  descendientes() { return this.hijos.flatMap((h) => [h, ...h.descendientes()]); }
  contains(x) { for (let p = x; p; p = p.padre) if (p === this) return true; return false; }
  querySelector(sel) { return this.descendientes().find((h) => (sel[0] === '.' ? h.classList.contains(sel.slice(1)) : h.tag === sel)) || null; }
  querySelectorAll() { return this.descendientes().filter((h) => ENFOCABLES.includes(h.tag) || h._attrs.tabindex !== undefined); }
  focus() { this.doc.activeElement = this; }
  remove() { if (this.padre) this.padre.hijos = this.padre.hijos.filter((h) => h !== this); this.padre = null; }
}
function mundoDom() {
  const doc = { activeElement: null };
  doc.body = new El('body', doc);
  doc.createElement = (t) => new El(t, doc);
  doc.getElementById = (id) => [doc.body, ...doc.body.descendientes()].find((h) => h.id === id) || null;
  return doc;
}
const con = (doc, tag, id, padre) => { const e = doc.createElement(tag); e.id = id; (padre || doc.body).appendChild(e); return e; };

// ================================================================ U10. los pies siguen la tecla de interactuar
{
  const A = await import('../src/atajos-paneles.js');
  const fabrica = { 'pie-banco': 'E o Escape para salir del mostrador', 'pie-carta': 'E o Escape para cerrar la carta', 'pie-local': 'E o Escape para cerrar el panel · los clientes se atienden con E' };
  eq(A.piesDePaneles((k) => k), fabrica, 'con las teclas de fábrica los textos son EXACTAMENTE los de siempre (la traducción hecha sigue valiendo)');
  const con_q = A.piesDePaneles((k) => (k === 'E' ? 'Q' : k));
  eq(con_q, { 'pie-banco': 'Q o Escape para salir del mostrador', 'pie-carta': 'Q o Escape para cerrar la carta', 'pie-local': 'Q o Escape para cerrar el panel · los clientes se atienden con Q' }, 'con la tecla cambiada, los tres pies (y el «con E» del local) dicen la propia');
  ok(Object.keys(A.PIES_PANELES).join() === 'pie-banco,pie-carta,pie-local', 'son los tres pies: banco, carta y local');
  // la plantilla ya no los trae escritos fijos: sólo el lugar con su id
  for (const id of ['pie-banco', 'pie-carta', 'pie-local']) ok(html.includes(`<p class="seguir" id="${id}"></p>`), `la plantilla deja el pie «${id}» vacío para armarlo desde el código`);
  for (const t of ['E o Escape para salir del mostrador', 'E o Escape para cerrar la carta', 'E o Escape para cerrar el panel · los clientes']) ok(!html.includes(`>${t}`), `la plantilla ya no escribe fijo «${t}»`);
  // main.js los pone con la tecla del jugador, al abrir el juego y cada vez que se cambia una tecla
  const doc = mundoDom();
  const pies = ['pie-banco', 'pie-carta', 'pie-local'].map((id) => con(doc, 'p', id));
  const poner = funcion(main, 'ponerPiesPropios', { piesDePaneles: A.piesDePaneles, teclaVisible: (k, mapa) => (mapa.interactuar === 'KeyQ' && k === 'E' ? 'Q' : k), teclasPropias: { interactuar: 'KeyQ' }, $: (id) => doc.getElementById(id), T_: (x) => x });
  poner();
  eq(pies.map((p) => p.textContent), Object.values(con_q), 'ponerPiesPropios escribe los pies con la tecla del jugador');
  const ponerF = funcion(main, 'ponerPiesPropios', { piesDePaneles: A.piesDePaneles, teclaVisible: (k) => k, teclasPropias: {}, $: (id) => doc.getElementById(id), T_: (x) => x });
  ponerF();
  eq(pies.map((p) => p.textContent), Object.values(fabrica), 'y al volver a la tecla de fábrica, vuelven los de siempre');
  ok(enUnaLinea(main, ['ponerPiesPropios();', '4.11.1 (U10)']), 'se arman al abrir el juego');
  ok(/function dibujarTeclas\(\) \{\n  pintarTeclasPropias\(\);[^\n]*\n  ponerPiesPropios\(\);/.test(main), 'y cada vez que se cambia o se restablece una tecla (dibujarTeclas)');
}

// ================================================================ U12. el tablero de trofeos es un panel que se queda
{
  const doc = mundoDom();
  globalThis.document = doc;
  const hud = con(doc, 'div', 'hud');
  const { crearTrofeosMundo } = await import('../src/desafio-trofeos-mundo.js');
  const { desafioNuevo } = await import('../src/desafio-reglas.js');
  const TR = await import('../src/desafio-trofeos.js');
  const d = desafioNuevo();
  const notas = [];
  const tablero = { plano: { id: 'tablero-trofeos', etapas: [1] }, datos: { etapas: 1, x: 10, z: 10, colgados: [] } };
  const obras = { obras: [tablero], editando: null };
  const api = { D: () => d, nota: (t, s) => notas.push([t, s]), textoPanel: (x) => x.replace(/E o Escape/, 'Q o Escape'), guardar() {} };
  const T = crearTrofeosMundo(obras, null, api, { quitarBonosDeOrigen() {}, sumarBono() {} });
  T.revisarGanados?.();
  d.crece.trofeos = { casco: 5, ojo: 15 };
  ok(!T.panelAbierto(), 'al principio no hay panel');
  ok(T.usarCerca({ x: 10, z: 11 }) === true, 'la E junto al tablero lo usa');
  ok(T.panelAbierto() && notas.length === 0, 'abre un panel y no tira el aviso de 5,6 s');
  const panel = doc.getElementById('trofeos-panel');
  ok(panel && hud.contains(panel) && !panel.classList.contains('oculto'), 'el panel está en el HUD y a la vista');
  const filas = panel.querySelector('ul').hijos;
  ok(filas.length === TR.TROFEOS.length && filas.length === 7, 'muestra los siete trofeos');
  ok(filas.filter((f) => f.classList.contains('hecho')).length === 2 && filas.filter((f) => f.classList.contains('falta')).length === 5, 'dos ganados y cinco que faltan, distinguidos');
  ok(/Casco de corteza/.test(filas[0].textContent) && /\+5 de salud máxima/.test(filas[0].textContent), 'el ganado dice qué da');
  ok(/Todavía no/.test(filas[1].textContent) && /Hongo grande/.test(filas[1].textContent) && /noche 10/.test(filas[1].textContent), 'el que falta dice de dónde sale');
  ok(/2 de 7/.test(panel.querySelector('.dicho').textContent), 'el panel cuenta cuántos tenés');
  eq(panel.querySelector('.seguir').textContent, 'Q o Escape para cerrar el tablero', 'el pie nombra la tecla de interactuar (por el texto propio del juego)');
  // se queda: pasa el tiempo (cuadros) y sigue abierto con el jugador al lado
  for (let i = 0; i < 400; i++) T.vigilarPanel({ x: 10, z: 11 });
  ok(T.panelAbierto(), 'se queda abierto hasta cerrarlo');
  T.cerrarPanel();
  ok(!T.panelAbierto() && panel.classList.contains('oculto'), 'cerrarPanel lo cierra y lo oculta');
  // se cierra solo si te alejás
  T.usarCerca({ x: 10, z: 11 });
  T.vigilarPanel({ x: 10, z: 12 });
  ok(T.panelAbierto(), 'a unos pasos sigue abierto');
  T.vigilarPanel({ x: 10, z: 40 });
  ok(!T.panelAbierto(), 'si te alejás del tablero se cierra solo');
  // se cierra si el tablero desaparece (lo tiran los duendes o lo desarmás)
  T.usarCerca({ x: 10, z: 11 });
  obras.obras = [];
  T.vigilarPanel({ x: 10, z: 11 });
  ok(!T.panelAbierto(), 'si el tablero ya no está, se cierra');
  obras.obras = [tablero];
  // una partida nueva lo cierra
  T.usarCerca({ x: 10, z: 11 });
  T.limpiar();
  ok(!T.panelAbierto(), 'limpiar (otra partida) lo cierra');
  ok(T.usarCerca({ x: 10, z: 40 }) === false && !T.panelAbierto(), 'lejos del tablero la E no abre nada');
  // dibujar de nuevo refleja un trofeo recién ganado
  T.usarCerca({ x: 10, z: 11 });
  d.crece.trofeos.piedra = 20;
  T.dibujarPanel();
  ok(/3 de 7/.test(panel.querySelector('.dicho').textContent), 'redibujar muestra el trofeo nuevo');
  T.cerrarPanel();
  delete globalThis.document;

  // las filas puras
  const f = TR.filasPanelTrofeos({ casco: 5 });
  ok(f.length === 7 && f[0].ganado && !f[1].ganado && f.every((x) => x.titulo && x.detalle), 'filasPanelTrofeos: siete, el primero ganado');
  eq(TR.filasPanelTrofeos(null).filter((x) => x.ganado).length, 0, 'sin trofeos guardados no hay ganados (ni rompe)');

  // la E y Escape cierran el panel abierto (el patrón de los otros paneles)
  const r = que({ desafio: true, panelAbierto: (x) => x === 'trofeos' });
  ok(r.e === 'trofeos-abierto' && r.hechos.includes('cerrarPanel') && r.aviso === null, 'con el panel abierto la E lo cierra y el aviso calla');
  ok(que({ desafio: true, trofeosCerca: true, avisoDesafioCerca: null, avisoTrofeos: 'x', usarTrofeos: true }).e === 'trofeos', 'sin panel, la E sigue abriéndolo junto al tablero');
  ok(enUnaLinea(main, ['const trofeosAbierto = ', 'desafio?.baseCrece?.trofeos?.panelAbierto']), 'main.js sabe si el panel está abierto');
  ok(enUnaLinea(main, ['const panelDelHudAbierto = ', 'desafio?.baseCrece?.trofeos?.panelAbierto']), 'es un panel del HUD: el mouse queda suelto, no se ataca y la I y la O no abren otro encima');
  ok(enUnaLinea(main, ["trofeos: () => trofeosAbierto()"]) && enUnaLinea(main, ["nombre === 'trofeos'", 'desafio.baseCrece.trofeos.cerrarPanel()']), 'la tabla de paneles sabe abrirlo y cerrarlo');
  ok(enUnaLinea(main, ['else if (trofeosAbierto())', 'desafio.baseCrece.trofeos.cerrarPanel()']), 'Escape lo cierra (antes de abrir la pausa)');
  ok(enUnaLinea(main, ['desafio.baseCrece?.trofeos?.vigilarPanel?.(js.pos)']), 'cada cuadro mira si te alejaste');
  const esc = main.indexOf("else if (trofeosAbierto())");
  ok(esc > 0 && esc < main.indexOf("else abrir('pausa');", esc), 'y va antes de la pausa');
  const mundo = leer('src/desafio-trofeos-mundo.js');
  ok(!/api\.nota\(t\.titulo, t\.texto, true\)/.test(mundo), 'la E ya no usa el aviso de 5,6 s');
}

// ================================================================ S5. la semilla del cantero
{
  const H = await import('../src/huerta.js');
  const tiene = (o) => (k) => o[k] || 0;
  const todas = tiene({ 'semillas-habas': 2, 'semillas-papa': 1, frutilla: 3, calafate: 4 });
  eq(H.semillasDisponibles(todas).map((s) => s.cultivo), ['habas', 'papas', 'frutillas', 'calafates'], 'las que tenés, en el orden de siempre');
  eq(H.semillasDisponibles(tiene({ calafate: 1 })).map((s) => s.cultivo), ['calafates'], 'sólo las que tenés');
  eq(H.semillasDisponibles(tiene({})), [], 'sin nada, nada');
  // lo no elegido sigue como hoy
  eq(H.semillaParaSembrar(todas).cultivo, 'habas', 'sin elegir: la primera del orden (como hoy)');
  eq(H.semillaParaSembrar(todas, null).cultivo, 'habas', 'elegida null: como hoy');
  eq(H.semillaParaSembrar(tiene({ 'semillas-papa': 1 })), { cultivo: 'papas', gasta: 'semillas-papa', conIngrediente: false }, 'una sola: esa');
  eq(H.semillaParaSembrar(tiene({}), 'calafates'), null, 'sin semillas no hay nada aunque haya elegida');
  // lo elegido
  eq(H.semillaParaSembrar(todas, 'calafates'), { cultivo: 'calafates', gasta: 'calafate', conIngrediente: true }, 'elegidos los calafates: se siembran esos (y se gasta un calafate)');
  eq(H.semillaParaSembrar(tiene({ 'semillas-habas': 1 }), 'calafates').cultivo, 'habas', 'si lo elegido se acabó, vuelve a la de siempre');
  eq(H.semillaParaSembrar(todas, 'oro').cultivo, 'habas', 'una elegida que no existe se ignora');
  eq(H.semillaParaSembrar(todas, 'constructor').cultivo, 'habas', 'ni «constructor» ni nombres del prototipo');
  // Tab / rueda: dar la vuelta
  eq(H.cambiarSemilla(todas, null, 1), 'papas', 'sin elegir, Tab pasa de habas a papas');
  eq(H.cambiarSemilla(todas, 'papas', 1), 'frutillas', 'siguiente');
  eq(H.cambiarSemilla(todas, 'calafates', 1), 'habas', 'después de la última, la primera');
  eq(H.cambiarSemilla(todas, 'habas', -1), 'calafates', 'hacia atrás desde la primera, la última');
  eq(H.cambiarSemilla(todas, 'frutillas', -1), 'papas', 'hacia atrás');
  eq(H.cambiarSemilla(tiene({ 'semillas-habas': 1, calafate: 1 }), 'frutillas', 1), 'calafates', 'una elegida que ya no tenés parte de la de siempre (habas) y pasa a la siguiente');
  eq(H.cambiarSemilla(tiene({}), 'habas', 1), null, 'sin semillas no hay a qué cambiar');
  eq(H.cambiarSemilla(tiene({ calafate: 2 }), null, 1), 'calafates', 'con una sola vuelve a ella');
  // tres vueltas completas: pasa por las cuatro (los calafates llegan a sembrarse)
  { let s = null; const vistos = new Set(); for (let i = 0; i < 4; i++) { s = H.cambiarSemilla(todas, s, 1); vistos.add(s); } eq([...vistos].sort(), ['calafates', 'frutillas', 'habas', 'papas'], 'Tab pasa por las cuatro'); }
  // se guarda en la partida
  eq([H.sanearSemillaElegida('calafates'), H.sanearSemillaElegida('oro'), H.sanearSemillaElegida(null), H.sanearSemillaElegida(3), H.sanearSemillaElegida('toString')], ['calafates', null, null, null, null], 'sanearSemillaElegida: sólo un cultivo de verdad');
  const datos = new Map();
  globalThis.localStorage = { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)), removeItem: (k) => datos.delete(k) };
  const G = await import('../src/guardado.js?s5=' + Date.now());
  const p = G.progresoNuevo();
  p.semillaElegida = 'calafates';
  G.guardarProgreso(p);
  eq(G.cargarProgreso().semillaElegida, 'calafates', 'la semilla elegida se guarda y vuelve al cargar la partida');
  p.semillaElegida = 'basura';
  G.guardarProgreso(p);
  eq(G.cargarProgreso().semillaElegida, null, 'un valor roto en el guardado se descarta');
  eq(G.progresoNuevo().semillaElegida ?? null, null, 'una partida nueva no trae elegida: como hoy');
  delete globalThis.localStorage;

  // el juego: el cartel dice cuál está elegida y cómo cambiarla; la E siembra la elegida; Tab y la rueda la cambian
  const CULT = H.CULTIVOS;
  const avisoEntorno = (tengo, elegida, parcela) => ({ huerta: () => (parcela ? { c1: parcela } : {}), progreso: { dia: 3, semillaElegida: elegida }, semillaParaSembrar: H.semillaParaSembrar, semillasDisponibles: H.semillasDisponibles, cuantoParaSembrar: tengo, CULTIVOS: CULT, textoCantero: () => 'crece' });
  const aviso = (tengo, elegida) => funcion(main, 'textoAvisoCantero', avisoEntorno(tengo, elegida))({ clave: 'c1' });
  eq(aviso(todas, null), 'Sembrar habas (Tab o rueda: otra semilla)', 'con varias semillas: dice cuál es y cómo cambiarla');
  eq(aviso(todas, 'calafates'), 'Sembrar calafates (Tab o rueda: otra semilla)', 'y dice la elegida');
  eq(aviso(tiene({ 'semillas-papa': 1 }), null), 'Sembrar papas', 'con una sola, como hoy (sin la ayuda)');
  eq(aviso(tiene({}), null), 'Cantero vacío: faltan semillas', 'sin semillas, como hoy');
  ok(enUnaLinea(main, ['semillaParaSembrar(cuantoParaSembrar, progreso.semillaElegida)']) && main.split('semillaParaSembrar(cuantoParaSembrar, progreso.semillaElegida)').length === 3, 'el cartel y la siembra usan la elegida');
  ok(!/semillaParaSembrar\(cuantoParaSembrar\)/.test(main), 'ninguna siembra se olvidó de la elegida');

  const hechos = [];
  const montar = (e) => funcion(main, 'cambiarSemillaCantero', {
    modo: 'jugando', jugador: { estado: {} }, charla: { npc: null }, panelDelHudAbierto: () => false, modoObra: false, foto: { activo: false },
    canteroCerca: () => ({ clave: 'c1' }), huerta: () => ({}), semillasDisponibles: H.semillasDisponibles, cambiarSemilla: H.cambiarSemilla, cuantoParaSembrar: todas,
    progreso: { semillaElegida: null }, sonido: { juntar: () => hechos.push('sonido') }, nota: (t) => hechos.push(`nota:${t}`), guardar: () => hechos.push('guardar'), CULTIVOS: CULT, ...e,
  });
  { const progreso = { semillaElegida: null }; const f = montar({ progreso });
    ok(f(1) === true && progreso.semillaElegida === 'papas', 'Tab/rueda junto a un cantero vacío cambia la semilla');
    ok(hechos.includes('guardar') && hechos.includes('nota:Sembrar papas'), 'la guarda y dice cuál quedó');
    f(1); f(1); f(1); eq(progreso.semillaElegida, 'habas', 'da la vuelta'); f(-1); eq(progreso.semillaElegida, 'calafates', 'y hacia atrás'); }
  const no = (e, m) => { const progreso = { semillaElegida: 'habas' }; ok(montar({ progreso, ...e })(1) === false && progreso.semillaElegida === 'habas', m); };
  no({ canteroCerca: () => null }, 'lejos de un cantero no hace nada (la rueda sigue siendo de la barra)');
  no({ huerta: () => ({ c1: { cultivo: 'habas' } }) }, 'en un cantero sembrado no hace nada');
  no({ cuantoParaSembrar: tiene({ 'semillas-habas': 1 }) }, 'con una sola semilla no hace nada (la rueda sigue siendo de la barra)');
  no({ modo: 'pausa' }, 'fuera del juego no');
  no({ charla: { npc: {} } }, 'charlando no');
  no({ panelDelHudAbierto: () => true }, 'con un panel abierto no');
  no({ modoObra: true }, 'con los planos abiertos no');
  no({ jugador: { estado: { enTren: true } } }, 'en el tren no');
  no({ jugador: { estado: { montado: true } } }, 'a caballo no');
  ok(enUnaLinea(main, ["case 'Tab':"]) && /case 'Tab':\n      if \(cambiarSemillaCantero\(e\.shiftKey \? -1 : 1\)\) \{ e\.preventDefault\(\); break; \}/.test(main), 'Tab (y Mayús+Tab hacia atrás) cambia la semilla y no hace nada más');
  ok(enUnaLinea(main, ['if (cambiarSemillaCantero(e.deltaY > 0 ? 1 : -1)) return;']), 'la rueda también');
  const rueda = main.indexOf('cambiarSemillaCantero(e.deltaY');
  ok(rueda > 0 && rueda < main.indexOf('elegirRanura(elegida + (e.deltaY', rueda) && rueda > main.indexOf('listaHudAbierta()) { marcarHud(e.deltaY', rueda - 400), 'la rueda lo prueba después de los paneles y antes de cambiar la casilla de la barra');
}

// ================================================================ U7. el foco sobrevive al redibujo
{
  const F = await import('../src/foco.js');
  const doc = mundoDom();
  const rej = con(doc, 'div', 'mochila-rejilla');
  const armar = (ids) => { rej.textContent = ''; for (const id of ids) { const d = doc.createElement('div'); d.tabIndex = 0; d.dataset.foco = id; d.id = `c-${id}`; rej.appendChild(d); } };
  const enfocado = () => doc.activeElement?.dataset?.foco ?? null;
  armar(['a', 'b', 'c', 'd']);
  doc.getElementById('c-c').focus();
  let m = F.guardarFoco(doc, ['mochila-casillas', 'mochila-rejilla']);
  ok(m && m.id === 'mochila-rejilla' && m.clave === 'c', 'se anota dónde está el foco');
  armar(['a', 'b', 'c', 'd']);
  ok(doc.activeElement?.dataset?.foco !== 'c', 'al redibujar el foco se pierde (el elemento ya no está)');
  ok(F.devolverFoco(doc, m) && enfocado() === 'c', 'y se devuelve a la misma cosa');
  // la lista cambia de orden o pierde una cosa anterior: sigue en la misma cosa
  armar(['d', 'c', 'a']);
  F.devolverFoco(doc, m);
  eq(enfocado(), 'c', 'aunque la lista cambie de orden o pierda otras cosas, sigue en la misma');
  // la cosa ya no está: el vecino en el mismo lugar (no el principio)
  doc.getElementById('c-c').focus();
  m = F.guardarFoco(doc, ['mochila-rejilla']);
  armar(['a', 'b', 'd', 'e']);
  F.devolverFoco(doc, m);
  eq(enfocado(), 'b', 'si la cosa desapareció, queda en el lugar que ocupaba (el vecino, no el principio)');
  // se acorta la lista: el último
  doc.getElementById('c-e').focus();
  m = F.guardarFoco(doc, ['mochila-rejilla']);
  armar(['a']);
  F.devolverFoco(doc, m);
  eq(enfocado(), 'a', 'si la lista se acortó, el último');
  armar([]);
  ok(F.devolverFoco(doc, m) === false, 'con la lista vacía no hay dónde poner el foco (y no rompe)');
  // dos pilas de la misma cosa: la misma pila
  rej.textContent = '';
  for (const id of ['x', 'x', 'x']) { const d = doc.createElement('div'); d.tabIndex = 0; d.dataset.foco = id; rej.appendChild(d); }
  rej.hijos[1].focus();
  m = F.guardarFoco(doc, ['mochila-rejilla']);
  const viejas = [...rej.hijos];
  rej.textContent = '';
  for (let i = 0; i < 3; i++) { const d = doc.createElement('div'); d.tabIndex = 0; d.dataset.foco = 'x'; rej.appendChild(d); }
  F.devolverFoco(doc, m);
  ok(doc.activeElement === rej.hijos[1] && viejas.every((v) => v !== doc.activeElement), 'con la misma cosa repetida (pilas), vuelve a la misma pila');
  // sin foco en el panel o fuera de él: no se anota nada ni se roba el foco
  const afuera = con(doc, 'button', 'afuera'); afuera.focus();
  ok(F.guardarFoco(doc, ['mochila-rejilla']) === null, 'si el foco está en otro lado, no se anota');
  ok(F.devolverFoco(doc, null) === false && doc.activeElement === afuera, 'sin marca no se toca el foco');
  doc.activeElement = doc.body;
  ok(F.guardarFoco(doc, ['mochila-rejilla']) === null, 'sin foco, tampoco');

  // la mochila: la casilla elegible y la cosa de la lista llevan su clave
  const P = await import('../src/carga-pantalla.js');
  const cont = con(doc, 'div', 'mochila-casillas');
  const vista = { celdas: [{ k: 'tronco', n: 3, max: 10, nombre: 'Troncos', icono: 'tronco', id: 'tronco', texto: '', vacia: false, zona: 'mochila' }, { k: 'piedra', n: 2, max: 10, nombre: 'Piedras', icono: 'piedra', id: 'piedra', texto: '', vacia: false, zona: 'mochila' }], sobrecarga: [] };
  P.dibujarCasillas(cont, vista, { iconoDe: (i) => i, alElegir: () => {}, doc });
  const cas = cont.hijos.filter((h) => h.classList.contains('elegible'));
  eq(cas.map((c) => c.dataset.foco), ['tronco', 'piedra'], 'cada casilla elegible lleva su clave para recuperar el foco');
  cas[1].focus();
  m = F.guardarFoco(doc, ['mochila-casillas', 'mochila-rejilla']);
  P.dibujarCasillas(cont, vista, { iconoDe: (i) => i, alElegir: () => {}, doc });
  F.devolverFoco(doc, m);
  ok(doc.activeElement?.dataset?.foco === 'piedra' && cont.contains(doc.activeElement), 'redibujar las casillas deja el foco en la misma casilla');
  // main.js: abrirMochila anota el foco sólo si ya estaba abierta y lo devuelve al final; la lista de la derecha lleva su clave
  ok(enUnaLinea(main, ['const marcaFoco = abrir && mochilaAbierta ? guardarFoco(document,', "'mochila-casillas'", "'mochila-rejilla'"]), 'abrirMochila anota el foco (sólo si ya estaba abierta: es un redibujo)');
  ok(enUnaLinea(main, ['devolverFoco(document, marcaFoco)']), 'y lo devuelve al terminar de redibujar');
  ok(enUnaLinea(main, ['if (c.id != null) d.dataset.foco = String(c.id)']), 'cada cosa de la lista lleva su clave');
  const iniMochila = main.indexOf('function abrirMochila(abrir) {');
  ok(main.indexOf('const marcaFoco', iniMochila) < main.indexOf('mochilaAbierta = abrir;', iniMochila), 'el foco se anota ANTES de marcar la mochila como abierta');
  ok(main.indexOf('devolverFoco(document, marcaFoco)', iniMochila) > main.indexOf('rej.appendChild(d);', iniMochila), 'y se devuelve DESPUÉS de armar la lista');

  // el cuaderno: dibujarCuaderno guarda y devuelve el foco alrededor del redibujo (aunque falle)
  const doc2 = mundoDom();
  globalThis.document = doc2;
  const lista = con(doc2, 'div', 'cuaderno-lista');
  const armarPestanas = () => { lista.textContent = ''; const l = doc2.createElement('button'); lista.appendChild(l); const pest = doc2.createElement('div'); lista.appendChild(pest); for (const t of ['Bruno', 'Especies', 'Fotos', 'Diario']) { const b = doc2.createElement('button'); b._texto = t; pest.appendChild(b); } return pest; };
  let pest = armarPestanas();
  const dibujar = (falla) => funcion(main, 'dibujarCuaderno', { guardarFoco: F.guardarFoco, devolverFoco: F.devolverFoco, document: doc2, dibujarCuadernoSinFoco: () => { pest = armarPestanas(); if (falla) throw new Error('falló'); } });
  pest.hijos[2].focus();
  dibujar(false)();
  ok(doc2.activeElement === pest.hijos[2] && lista.contains(doc2.activeElement), 'cambiar de pestaña con el teclado deja el foco en la MISMA pestaña');
  pest.hijos[3].focus();
  assert.throws(() => dibujar(true)(), /falló/); n++;
  ok(doc2.activeElement === pest.hijos[3], 'aunque el redibujo falle, el foco vuelve');
  ok(/function dibujarCuadernoSinFoco\(\) \{\n  const total = ENTRADAS\.length;/.test(main), 'el redibujo de siempre quedó como dibujarCuadernoSinFoco');
  ok(enUnaLinea(main, ["guardarFoco(document, ['cuaderno-lista', 'cuaderno-ficha'])"]), 'el cuaderno mira sus dos páginas');
  delete globalThis.document;
}

// ================================================================ P4. lo personal viaja a una ranura vacía
{
  const PP = await import('../src/personal-partida.js');
  const almacen = () => { const m = new Map(); return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
  const personal = { ropa: { camisa: 'roja' }, bandera: { color: 'verde' }, bruno: { nombre: 'Bruno de la partida vieja' }, partida: { proxima: { estacion: 'invierno', clima: 'igual', dificultad: 'igual', animales: 'muchos', vecinos: false }, actual: { animales: 'normal', vecinos: true }, recetas: [{ nombre: 'mi receta' }] } };
  const a = almacen();
  const r = PP.dejarPersonalPendiente(a, 'relax', 2, personal, { estacion: 'verano', clima: 'variable' });
  ok(r && a.m.has(PP.clavePersonalPendiente('relax', 2)), 'se anota para esa ranura');
  eq(a.m.size, 2, 'sólo para esa ranura (y ese modo): lo personal y, aparte, la estación y el clima de la receta');   // 4.12.2: dos claves
  const t = PP.tomarPersonalPendiente(a, 'relax', 2);
  eq(t.ropa, personal.ropa, 'la ropa viaja'); eq(t.bandera, personal.bandera, 'la bandera viaja'); ok(t.partida.recetas.length === 1 && t.partida.recetas[0].nombre === 'mi receta', 'y las recetas');
  ok(!('bruno' in t), 'cada partida tiene su Bruno: el de la vieja no viaja (igual que con «Empezar de nuevo»)');
  eq(t.partida.actual, { animales: 'muchos', vecinos: false }, 'y la partida nueva arranca con la receta «Tu partida» (como «Empezar de nuevo»)');
  eq(r.ajustes.estacion, 'invierno', 'la receta también deja puesta la estación');
  eq(PP.tomarAjustesPendientes(a, 'relax', 2), { estacion: 'invierno' }, 'los ajustes de la receta se toman aparte (sólo lo que cambia)');   // 4.12.2
  ok(PP.tomarPersonalPendiente(a, 'relax', 2) === null && a.m.size === 0, 'se toma una sola vez (y se borra)');
  PP.dejarPersonalPendiente(a, 'relax', 2, personal);
  ok(PP.tomarPersonalPendiente(a, 'relax', 3) === null && PP.tomarPersonalPendiente(a, 'desafio', 2) === null && a.m.size === 2, 'otra ranura u otro modo no lo ven (y no lo borran)');
  PP.tomarPersonalPendiente(a, 'relax', 2); PP.tomarAjustesPendientes(a, 'relax', 2);   // 4.12.2
  a.setItem(PP.clavePersonalPendiente('relax', 1), '{roto');
  ok(PP.tomarPersonalPendiente(a, 'relax', 1) === null, 'un anotado roto se descarta sin romper');
  ok(PP.dejarPersonalPendiente(a, 'relax', 1, null) === null && a.m.size === 0, 'sin personal no se anota nada');
  ok(PP.dejarPersonalPendiente({ setItem() { throw new Error('lleno'); } }, 'relax', 1, personal) === null, 'si el almacén falla, no rompe (arranca de fábrica como antes)');

  // irAPartida: sólo a una ranura VACÍA; a una con partida no se le toca nada
  const correr = (infoHay, ranura = 2, extra = {}) => {
    const almac = almacen(); const ajustes = { ranura: 1, estacion: 'verano' }; const hechos = [];
    const f = funcion(main, 'irAPartida', {
      ranuraActual: () => 1, cerrarPartidas: () => hechos.push('cerrar'), modo: 'jugando', guardar: () => hechos.push('guardar'), ajustes, esSinFin: false,
      guardarAjustes: () => hechos.push('ajustes'), reiniciandoPartida: false, cancelarGuardadoSuave: () => {}, location: { reload: () => hechos.push('recarga') },
      infoPartida: () => ({ hay: infoHay }), modoJuego: 'relax', sessionStorage: almac, progreso: { personal }, dejarPersonalPendiente: PP.dejarPersonalPendiente, ...extra,
    });
    f(ranura);
    return { almac, ajustes, hechos };
  };
  { const v = correr(false);
    ok(v.almac.m.has(PP.clavePersonalPendiente('relax', 2)) && v.ajustes.ranura === 2 && v.hechos.includes('recarga'), 'a una ranura vacía: se anota lo personal, se cambia de ranura y se recarga');
    // 4.12.2: los ajustes globales NO se tocan al entrar a la ranura vacía (la receta se aplica al arrancarla de verdad)
    eq(v.ajustes.estacion, 'verano', 'y los ajustes de todas las partidas no se tocan todavía'); ok(v.almac.m.has(PP.claveAjustesPendientes('relax', 2)), 'la receta queda anotada para esa ranura'); }
  { const v = correr(true);
    ok(v.almac.m.size === 0 && v.ajustes.ranura === 2 && v.ajustes.estacion === 'verano', 'a una ranura con partida: no se anota nada y no se tocan los ajustes (no pisa)'); }
  { const v = correr(false, 1);
    ok(v.almac.m.size === 0 && v.hechos.includes('cerrar') && !v.hechos.includes('recarga'), 'a la ranura en la que ya estás: sólo se cierra la lista'); }
  // al cargar: una ranura vacía toma lo anotado; una con partida no lo mira
  ok(/if \(!progreso\) \{\n  progreso = progresoNuevo\(\);\n[^\n]*\n  try \{ const pendiente = tomarPersonalPendiente\(sessionStorage, modoJuego, ranuraActual\(\)\); if \(pendiente\) progreso\.personal = sanearPersonal\(pendiente\);/.test(main), 'al arrancar una ranura sin partida se toma lo anotado y se sanea');
  ok(!/habiaGuardado[^\n]*tomarPersonalPendiente/.test(main), 'una partida que ya existe nunca lo toma');
}

console.log(`verificar-4-11-1-interfaz: ${n} comprobaciones, todo en verde`);

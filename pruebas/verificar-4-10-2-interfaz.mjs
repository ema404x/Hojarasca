// 4.10.2 (interfaz): arreglos de la ronda de bugs «zona U» (interfaz y experiencia). Cada uno EJECUTA el comportamiento con las reglas
// puras (src/atajos-paneles.js), la tabla de interacciones y un mundo de mentira; lo que no se puede correr sin ventana (z-index, foco)
// se comprueba en el texto de la plantilla y queda anotado «para mirar en Electron» en CAMBIOS_4_10_2_INTERFAZ.md.
//   U1. la pausa, el cuaderno, el mapa y la guía quedan por ENCIMA de los paneles del banco, la cantina y el local; el modo foto no se prende con ellos;
//   U2. con un panel abierto, la I y la O no abren otro encima; la E cierra la mochila abierta (no sigue hablando);
//   U3. las notas y el cartel «Mochila llena» salen por encima de esos paneles;
//   U4. la mano no pasa de la casilla 8: más allá queda el hueco como cuando se termina;
//   U5. las recetas anotadas no se ofrecen para la barra; U6. Espacio en la mochila no llega al juego;
//   U8. «Nueva partida» no deja escapar el foco con Tab; U10. los textos con E y F siguen la tecla propia; U11. la victoria y la corrida
//   esperan a la consola; U13. el tablón sin papeles no habla de números; U14. el aviso de irse del turno; U15. el espejo en el Desafío.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { que, IDS } from './ayuda-interacciones.mjs';
import { enUnaLinea } from './ayuda-codigo.mjs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const A = await import('../src/atajos-paneles.js');
const M = await import('../src/mochila.js');
const P = await import('../src/carga-pantalla.js');

let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const main = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../src/plantilla.html', import.meta.url), 'utf8');

// ---------------------------------------------------------------- U2. la regla única de los atajos con un panel abierto
{
  const B = A.atajoBloqueadoPorPanel;
  // sin nada abierto: valen
  ok(!B('KeyI', {}) && !B('KeyO', {}), 'sin paneles: la I y la O valen');
  // con otro panel (el del local, la cantina, el banco, el almacén, el tablón…): no abren la mochila ni los planos
  ok(B('KeyI', { otroPanel: true }), 'con el panel del local abierto, la I no abre una mochila escondida');
  ok(B('KeyO', { otroPanel: true }), 'con el tablón (u otro panel) abierto, la O no abre los planos');
  // la mochila abierta: la I la cierra; la O no abre planos encima
  ok(!B('KeyI', { mochila: true }), 'con la mochila abierta, la I la cierra');
  ok(B('KeyO', { mochila: true }), 'con la mochila abierta, la O no abre los planos');
  // la O que cierra los planos pasa siempre
  ok(!B('KeyO', { modoObra: true, mochila: true }) && !B('KeyO', { modoObra: true, otroPanel: true }), 'la O que cierra los planos pasa');
  // las otras teclas no las toca la regla
  for (const k of ['KeyE', 'Escape', 'KeyJ', 'KeyM', 'KeyK', 'Digit1', 'Space']) ok(!B(k, { otroPanel: true, mochila: true }), `${k}: no es de esta regla`);

  // un recorrido: el panel del local abierto, I (nada), Esc cierra EL PANEL (antes cerraba primero una mochila invisible)
  const mundo = { mochila: false, local: true, planos: false };
  const hay = () => ({ mochila: mundo.mochila, otroPanel: mundo.local, modoObra: mundo.planos });
  const tecla = (k) => { if (A.atajoBloqueadoPorPanel(k, hay())) return; if (k === 'KeyI') mundo.mochila = !mundo.mochila; if (k === 'KeyO') mundo.planos = !mundo.planos; };
  tecla('KeyI');
  ok(!mundo.mochila && mundo.local, 'I con el local abierto: sigue sin mochila');
  tecla('KeyO');
  ok(!mundo.planos, 'O con el local abierto: sin planos');
}

// ---------------------------------------------------------------- U2. la mochila abierta es un panel: la E la cierra (tabla de interacciones)
{
  ok(IDS.includes('mochila-abierta'), 'la tabla tiene «mochila-abierta»');
  ok(IDS.indexOf('mochila-abierta') < IDS.indexOf('almacen-abierto') && IDS.indexOf('mochila-abierta') < IDS.indexOf('vecino'), 'va antes que el almacén y que hablar con un vecino');
  const r = que({ mochilaAbierta: true, vecino: { nombre: 'Ercilia' } });
  eq(r.e, 'mochila-abierta', 'con la mochila abierta y un vecino adelante, la E es la de la mochila (no habla)');
  ok(r.hechos.includes('cerrarMochila') && !r.hechos.includes('hablar'), 'la E cierra la mochila y no habla');
  eq(r.aviso, null, 'y el aviso no dice nada (como en los otros paneles)');
  const r2 = que({ mochilaAbierta: false, vecino: { nombre: 'Ercilia' } });
  ok(r2.e !== 'mochila-abierta', 'con la mochila cerrada, nada cambia');
  // el almacén abierto + mochila (no debería pasar ya) : la mochila gana, como en Esc
  const r3 = que({ mochilaAbierta: true, enElAlmacen: true });
  eq(r3.e, 'mochila-abierta', 'Esc y E cierran primero la mochila');
  ok(enUnaLinea(main, ['mochilaAbierta: () => mochilaAbierta', 'cerrarMochila: () => abrirMochila(false)']), 'main.js le da a la tabla la mochila');
}

// ---------------------------------------------------------------- U2 (enganche en main.js)
{
  ok(enUnaLinea(main, ["atajoBloqueadoPorPanel(codigo, { mochila: mochilaAbierta, otroPanel: panelDelHudAbierto() && !mochilaAbierta, modoObra })", 'return;']), 'la tecla corta I y O con un panel abierto');
  const iGuarda = main.indexOf('atajoBloqueadoPorPanel(codigo,'), iSwitch = main.indexOf("case 'KeyI': abrirMochila(!mochilaAbierta)"), iK = main.indexOf("if (codigo === 'KeyK' && desafio) {");
  ok(iGuarda > 0 && iGuarda < iK && iK < iSwitch, 'la guarda va antes de K y del switch');
  // el tablón abierto atiende sus teclas ANTES: ni I ni O las pisan (y los números 1 a 4 son del tablón)
  ok(main.indexOf('tablonJuego.tecla(codigo)') < iGuarda, 'el tablón atiende primero sus teclas');
}

// ---------------------------------------------------------------- U1. al cerrar el cuaderno, el mapa o la pausa con un panel abierto debajo, el mouse sigue suelto
{
  const lineas = main.split(String.fromCharCode(10)).filter((l) => l.startsWith("  if (modo === 'cuaderno' &&") || l.startsWith("  if (modo === 'mapa' &&") || l.startsWith("  if (modo === 'pausa' && codigo === 'Escape'"));
  ok(lineas.length === 3 && lineas.every((l) => l.includes('volverAlJuego(!!panelDelHudAbierto())')), 'cerrar la pantalla de arriba no atrapa el mouse si quedó un panel abierto');
}

// ---------------------------------------------------------------- U1. el modo foto no se prende con un panel de afuera del HUD
{
  const F = A.fotoPosible;
  ok(F({ modo: 'jugando' }) && F({ modo: 'pausa' }) && F({ modo: 'cuaderno' }) && F({ modo: 'mapa' }), 'se prende desde el juego, la pausa, el cuaderno y el mapa');
  ok(!F({ modo: 'jugando', panelFueraDelHud: true }), 'no con el local, la cantina, la casa de té o el banco abiertos');
  ok(!F({ modo: 'jugando', logrosOculto: false }) && !F({ modo: 'jugando', modosAbierto: true }) && !F({ modo: 'valle' }), 'ni con los logros, los modos ni en la tarjeta del valle');
  ok(F({ fotoActiva: true, modo: 'jugando', panelFueraDelHud: true }), 'apagarlo siempre se puede');
  ok(enUnaLinea(main, ['panelFueraDelHud: panelFueraDelHudAbierto()', 'fotoPosible(']), 'main.js le pasa el panel de afuera del HUD');
  ok(enUnaLinea(main, ['const panelFueraDelHudAbierto =', 'enElBanco()', 'negocioJuego?.panelAbierto()', 'cantinaJuego?.panelAbierto()', 'teJuego?.panelAbierto()']), 'esos son el banco, el local, la cantina y la casa de té');
}

// ---------------------------------------------------------------- U1 y U3. el apilado (texto de la plantilla: se mira en Electron)
{
  const z = (sel) => { const m = new RegExp(`${sel.replace(/[.#]/g, '\\$&')} \\{[^}]*z-index: (\\d+)`).exec(html); return m ? Number(m[1]) : null; };
  const zBanco = z('.banco-velo'), zVelo = z('.velo'), zAvisos = z('#avisos-altos'), zInfo = z('.build-info');
  ok(zBanco != null && zVelo != null && zAvisos != null, 'las capas tienen z-index');
  ok(zVelo > zBanco, `la pausa, el cuaderno, el mapa y la guía (.velo ${zVelo}) por encima de los paneles de negocio (${zBanco})`);
  ok(zAvisos > zBanco && zAvisos < zVelo, `los avisos (${zAvisos}) entre los dos: encima de los paneles de negocio y debajo de la pausa`);
  ok(zInfo > zVelo, 'la versión de la esquina sigue por encima de los velos, como antes');
  // las notas y el cartel salen del #hud (que es un contexto de apilado) y siguen su visibilidad
  const iHud = html.indexOf('<div id="hud" class="oculto">'), iAvisos = html.indexOf('<div id="avisos-altos">');
  const cuerpoHud = html.slice(iHud, iAvisos);
  ok(iAvisos > iHud && !cuerpoHud.includes('id="notas"') && !cuerpoHud.includes('id="aviso-llena"'), 'las notas y «Mochila llena» ya no están dentro del #hud');
  const cuerpoAvisos = html.slice(iAvisos, html.indexOf('<div class="fundido"'));
  ok(cuerpoAvisos.includes('id="notas"') && cuerpoAvisos.includes('id="guardado-hud"') && cuerpoAvisos.includes('id="aviso-llena"'), 'están en #avisos-altos');
  ok(html.includes('#hud.oculto ~ #avisos-altos { display: none; }'), 'se esconden con el HUD (modo foto, portada)');
  ok(/#hud, #avisos-altos, #pausa > div/.test(html), 'con el mismo zoom de la letra que el HUD');
  ok(html.indexOf('id="avisos-altos"') > html.indexOf('id="hud"'), '#avisos-altos va después de #hud (el selector ~ lo necesita)');
}

// ---------------------------------------------------------------- U4. la mano no sigue a lo elegido más allá de la casilla 8
{
  const lista = (...ids) => ids.map((id) => ({ id }));
  // sigue en su casilla: nada
  eq(A.seguirElegida(lista('a', 'b', 'c'), 1, 'b'), { elegida: 1, hueco: false }, 'sigue donde estaba');
  // se movió dentro de las 8: la marca la sigue
  eq(A.seguirElegida(lista('x', 'a', 'b', 'c'), 2, 'c'), { elegida: 3, hueco: false, seguir: true }, 'se corrió una casilla: la marca va con ella');
  // se fue más allá de la 8: queda el hueco y la marca no pasa de 7
  const larga = lista('r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'x', 'frutilla');
  const s = A.seguirElegida(larga, 7, 'frutilla');
  eq(s, { elegida: 7, hueco: true }, 'la frutilla pasó a la casilla 9: queda el hueco en la 8 (y la marca sigue en 0..7)');
  ok(s.elegida < 8, 'nunca queda elegida una casilla que la barra no dibuja');
  // ya no está
  eq(A.seguirElegida(lista('a', 'b'), 1, 'z'), { elegida: 1, hueco: true }, 'si se terminó, hueco (como antes)');
  // sin nada elegido
  eq(A.seguirElegida(lista('a'), 0, null), { elegida: 0, hueco: false }, 'sin lo elegido anotado, nada');
  // recorrido: muchas inserciones antes de lo elegido
  let ranuras = lista('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'), elegida = 7;
  const id = 'h';
  for (const nuevo of ['n1', 'n2', 'n3']) {
    ranuras = [{ id: nuevo }, ...ranuras];
    const r = A.seguirElegida(ranuras, elegida, id);
    if (r.seguir) elegida = r.elegida; else if (r.hueco) ranuras.splice(Math.min(elegida, ranuras.length), 0, null);
    ok(elegida >= 0 && elegida < 8, `después de insertar ${nuevo}: la elegida (${elegida}) sigue dentro de la barra`);
  }
  ok(enUnaLinea(main, ['seguirElegida(ranuras, elegida, idElegido, 8)']), 'refrescarBarra usa seguirElegida con 8 casillas');
}

// ---------------------------------------------------------------- U5. las recetas anotadas no se ofrecen para la barra
{
  const COCINADAS = ['pinones-tostados', 'dulce-calafate', 'frutillas-brasas', 'papas-rescoldo', 'habas-salteadas', 'guiso-campo', 'tortilla-papas', 'torta-frita', 'sopaipillas-miel', 'trucha-papas', 'mate', 'te-galesa', 'chocolate'];
  const entradas = Object.fromEntries(COCINADAS.map((k) => [k, { dia: 1, cantidad: 1 }]));
  const guardado = M.armarGuardado({ entradas }, {});
  eq(guardado.map((g) => g.id), COCINADAS, 'las trece recetas anotadas aparecen en la lista');
  ok(guardado.every((g) => g.anotada === true), 'todas marcadas como anotadas');
  ok(guardado.every((g) => !A.seOfreceParaLaBarra(g)), 'ninguna se ofrece para la barra');
  ok(A.seOfreceParaLaBarra({ id: 'hacha', nombre: 'Hacha' }), 'una cosa de verdad sí');
  ok(!A.seOfreceParaLaBarra(null), 'nada, no');
  // y ninguna es una cosa que arme la mochila (por eso no tienen casilla)
  const hechas = M.armarMochila({ modo: 'relax', materiales: {}, entradas, cosas: {}, ramitas: 0, barra: [] }, {});
  ok(!hechas.some((r) => COCINADAS.includes(r.id)), 'ninguna de las trece es una casilla de la barra');
  ok(enUnaLinea(main, ['seOfreceParaLaBarra(c)']) && enUnaLinea(main, ["if (!ranuras.some((r) => r?.id === id))", 'Eso no se lleva en la barra']), 'la mochila no les da clic y asignarRanura rechaza lo que no es de la barra');
  // la tarjeta anotada no se marca «en la barra» aunque progreso.barra no exista
  ok(enUnaLinea(main, ['const enLaBarra = seElige ? posBarra(c.id, lugares.get(c.id)) : -1']), 'nunca se marca «en la barra»');
}

// ---------------------------------------------------------------- U6. Espacio en la casilla elige y no llega al juego
{
  class El {
    constructor(tag) { this.tag = tag; this.hijos = []; this.className = ''; this.oyentes = {}; this._texto = ''; this.tabIndex = -1; this.title = ''; }
    get classList() { const el = this; const l = () => el.className.split(/\s+/).filter(Boolean); return { add: (c) => { if (!l().includes(c)) el.className = [...l(), c].join(' '); }, remove: (c) => { el.className = l().filter((x) => x !== c).join(' '); }, contains: (c) => l().includes(c), toggle: () => {} }; }
    get textContent() { return this.hijos.length ? this.hijos.map((h) => h.textContent).join('') : this._texto; }
    set textContent(t) { this.hijos = []; this._texto = String(t); }
    appendChild(h) { this.hijos.push(h); return h; }
    append(...hs) { for (const h of hs) this.hijos.push(h); }
    setAttribute() {}
    addEventListener(t, f) { (this.oyentes[t] ||= []).push(f); }
  }
  const doc = { createElement: (t) => new El(t) };
  const cont = new El('div');
  const vista = { celdas: [{ k: 'tronco', n: 3, max: 10, nombre: 'Troncos', icono: 'tronco', id: 'tronco', texto: '', vacia: false, zona: 'mochila' }], sobrecarga: [] };
  const elegidos = [];
  P.dibujarCasillas(cont, vista, { iconoDe: (i) => i, alElegir: (id) => elegidos.push(id), doc });
  const casilla = cont.hijos.find((h) => h.classList.contains('casilla'));
  ok(casilla && casilla.oyentes.keydown, 'la casilla elegible escucha el teclado');
  let sube = 0;
  for (const code of ['Space', 'Enter']) for (const f of casilla.oyentes.keydown) f({ code, preventDefault() {}, stopPropagation() { sube++; } });
  eq(elegidos, ['tronco', 'tronco'], 'Espacio y Enter eligen');
  eq(sube, 2, 'y el evento no sube al juego (Espacio no hace saltar)');
  ok(enUnaLinea(main, ["ev.code === 'Enter' || ev.code === 'Space'", 'ev.stopPropagation()', 'asignar()']), 'la lista de la derecha de la mochila también');
}

// ---------------------------------------------------------------- U8. «Nueva partida» no deja escapar el foco con Tab
{
  const f = fs.readFileSync(new URL('../src/desafio-meta-pantalla.js', import.meta.url), 'utf8');
  ok(f.includes("if (e.code === 'Tab') {") && f.includes('velo.querySelectorAll(') && /k === fs\.length - 1\) \|\| \(e\.shiftKey && k === 0\)/.test(f), 'Tab (y Mayús+Tab) da la vuelta adentro, como el creador y el prólogo');
}

// ---------------------------------------------------------------- U10. los textos con E y F siguen la tecla propia
{
  const propias = (e, f) => (k) => (k === 'E' ? e : k === 'F' ? f : k);
  const T = A.conTeclasPropias;
  eq(T('Sin ganchos libres (3/4) · mantené E para ampliar', propias('E', 'F')), 'Sin ganchos libres (3/4) · mantené E para ampliar', 'sin teclas cambiadas: el texto queda IGUAL');
  eq(T('Sin ganchos libres (3/4) · mantené E para ampliar', propias('X', 'F')), 'Sin ganchos libres (3/4) · mantené X para ampliar', 'mantené la tecla propia');
  eq(T('1 a 3 o un clic para tomar o entregar · E o Escape para salir', propias('X', 'F')), '1 a 3 o un clic para tomar o entregar · X o Escape para salir', 'el pie del tablón');
  eq(T('E o Escape para salir', propias('Q', 'F')), 'Q o Escape para salir', 'al principio');
  eq(T('3 ramitas (F para hacer fuego)', propias('E', 'G')), '3 ramitas (G para hacer fuego)', 'la F propia');
  eq(T('Se atiende con E', propias('R', 'F')), 'Se atiende con R', 'con E');
  eq(T('Con Escape se sale, las Estaciones siguen', propias('R', 'G')), 'Con Escape se sale, las Estaciones siguen', 'no toca palabras que empiezan con E');
  eq(T('', propias('R', 'G')), '', 'vacío'); eq(T(null, propias('R', 'G')), null, 'nulo');
  ok(enUnaLinea(main, ['a.lastChild.nodeValue = textoPropio(a.lastChild.nodeValue)']) && enUnaLinea(main, ["' (F para hacer fuego)'", 'textoPropio(']) && enUnaLinea(main, ['textoPropio: (x) => textoPropio(x)']), 'main.js lo aplica al aviso, a los recursos y al tablón');
}

// ---------------------------------------------------------------- U11. la victoria y la corrida esperan a la consola, al cuaderno y al mapa
{
  const i = main.indexOf('function mostrarVictoria('), v = main.slice(i, i + 900);
  ok(v.includes("modo === 'mapa' || modo === 'trucos') mostrarVictoria(s, final)"), 'la victoria reintenta con la consola abierta');
  const j = main.indexOf('const cerrarCorrida = () => {'), c = main.slice(j, j + 400);
  ok(c.includes("modo === 'cuaderno' || modo === 'mapa' || modo === 'trucos') { setTimeout(cerrarCorrida, 700); return; }"), 'la corrida espera con el cuaderno, el mapa o la consola');
}

// ---------------------------------------------------------------- U13. el tablón sin papeles no habla de números
{
  const f = fs.readFileSync(new URL('../src/tablon-mundo.js', import.meta.url), 'utf8');
  ok(f.includes('filas.length ? propio(') && f.includes("propio('E o Escape para salir')"), 'sin papeles: sólo «E o Escape para salir»');
}

// ---------------------------------------------------------------- U14. irte del turno
{
  const E = await import('../src/empleo.js');
  const p = E.pagoDelTurno({ hechas: 2, total: 4, sueldo: 1000 }, true);
  ok(p.multa > 0 && p.monto + p.multa === 500, 'medio turno de $1.000 = $500 bruto: lo que se paga ($' + p.monto + ') ya tiene descontada la multa ($' + p.multa + ')');
  const j = fs.readFileSync(new URL('../src/empleo-juego.js', import.meta.url), 'utf8');
  ok(j.includes('cobrás ${formatoPesos(pago.monto)} (ya descontados ${formatoPesos(pago.multa)} por irte antes)'), 'el aviso dice que el monto YA tiene la multa descontada');
  ok(!/\(menos \$\{formatoPesos\((pago|r)\.multa\)\} por irte antes\)/.test(j + fs.readFileSync(new URL('../src/empleo.js', import.meta.url), 'utf8')), 'ninguno dice «menos» sobre un monto que ya es el neto');
}

// ---------------------------------------------------------------- U15. el espejo no existe en el Desafío
{
  const f = fs.readFileSync(new URL('../src/creador-ficha.js', import.meta.url), 'utf8');
  ok(/desafio \? 'Quién sos en el valle\. Lo que elegiste del carácter queda fijo\.' : /.test(f), 'la ficha de Bruno en el Desafío no manda al espejo');
  const b = fs.readFileSync(new URL('../src/personal-bruno.js', import.meta.url), 'utf8');
  ok(b.includes("api.progreso?.modo === 'desafio' ? 'En la noche de los duendes no hay espejo: rehacelo desde acá.'"), 'el panel de Bruno en el Desafío no manda a los planos');
}

// ---------------------------------------------------------------- U7. el foco del panel del local
{
  const f = fs.readFileSync(new URL('../src/negocio-propio-juego.js', import.meta.url), 'utf8');
  ok(f.includes('const foco = typeof document') && f.includes('botones()[foco]?.focus('), 'tras redibujar el panel del local, el foco vuelve al mismo botón');
}

console.log(`verificar-4-10-2-interfaz: ${n} comprobaciones OK`);

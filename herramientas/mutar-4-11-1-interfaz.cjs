// 4.11.1 (interfaz): rompe a propósito cada regla y confirma que verificar-4-11-1-interfaz.mjs falla.
// Cada mutación cambia una línea de un archivo, corre la prueba y deja el archivo como estaba.
// Uso: node herramientas/mutar-4-11-1-interfaz.cjs   (SOLO=<parte del nombre> para correr unas pocas)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const raiz = path.resolve(__dirname, '..');
const prueba = path.join(raiz, 'pruebas', 'verificar-4-11-1-interfaz.mjs');

const AP = 'src/atajos-paneles.js', MA = 'src/main.js', PL = 'src/plantilla.html', TM = 'src/desafio-trofeos-mundo.js', TF = 'src/desafio-trofeos.js';
const HU = 'src/huerta.js', GU = 'src/guardado.js', FO = 'src/foco.js', CP = 'src/carga-pantalla.js', PP = 'src/personal-partida.js', IN = 'src/interacciones.js';
const MUTACIONES = [
  // ---- U10. los pies
  ['el pie del banco nombra la tecla', AP, "'pie-banco': 'E o Escape para salir del mostrador',", "'pie-banco': 'E o Escape para salir del mostrador.',"],
  ['la plantilla no escribe fijo el pie de la carta', PL, '<p class="seguir" id="pie-carta"></p>', '<p class="seguir" id="pie-carta">E o Escape para cerrar la carta</p>'],
  ['el pie del local lleva el «con E»', AP, "· los clientes se atienden con E',", "· los clientes se atienden con F',"],
  ['los pies siguen la tecla propia', AP, 'r[id] = conTeclasPropias(PIES_PANELES[id], visible);', 'r[id] = PIES_PANELES[id];'],
  ['main.js escribe los pies con la tecla del jugador', MA, 'el.textContent = T_(pies[id]);', "el.textContent = T_(PIES_DE_FABRICA[id] || '');"],
  ['los pies se arman al cambiar una tecla', MA, "  pintarTeclasPropias();   // 3.8.6\n  ponerPiesPropios();   // 4.11.1", "  pintarTeclasPropias();   // 3.8.6"],
  ['los pies se arman al abrir el juego', MA, 'ponerPiesPropios();   // 4.11.1 (U10)', ''],
  // ---- U12. el tablero de trofeos
  ['la E abre el panel (no el aviso)', TM, '    return abrirPanel(o);', "    const t = textoTablero(crece().trofeos, true); api.nota(t.titulo, t.texto, true); return true;"],
  ['el panel muestra los siete trofeos', TF, 'return TROFEOS.map((t) => {', 'return TROFEOS.slice(0, 6).map((t) => {'],
  ['el que falta dice de dónde sale', TF, '`Todavía no · se gana con ${t.de} (${t.hito})`', "'Todavía no'"],
  ['el panel se queda abierto (no se cierra solo cerca)', TM, 'RADIO_E + 1.5) cerrarPanel();', 'RADIO_E - 99) cerrarPanel();'],
  ['el panel se cierra si te alejás', TM, '|| !pos || Math.hypot(', '|| false && Math.hypot('],
  ['el panel se cierra si el tablero desaparece', TM, 'const aun = tableroAbierto && tableros().includes(tableroAbierto);', 'const aun = true;'],
  ['otra partida cierra el panel', TM, 'function limpiar() { firma = null; cerrarPanel(); }', 'function limpiar() { firma = null; }'],
  ['el pie nombra la tecla propia', TM, "p.querySelector('.seguir').textContent = txt('E o Escape para cerrar el tablero');", "p.querySelector('.seguir').textContent = 'E o Escape para cerrar el tablero';"],
  ['con el panel abierto la E lo cierra', IN, "  panel('trofeos-abierto', (c) => c.panelAbierto('trofeos'), (c) => c.cerrarPanel('trofeos')),   // 4.11.1 (U12)\n", ''],
  ['el panel es del HUD (mouse suelto)', MA, '|| !!tablonJuego?.abierto() || !!desafio?.baseCrece?.trofeos?.panelAbierto?.();', '|| !!tablonJuego?.abierto();'],
  ['Escape cierra el panel', MA, '      else if (trofeosAbierto()) desafio.baseCrece.trofeos.cerrarPanel();   // 4.11.1 (U12): el tablero de trofeos\n', ''],
  ['la tabla sabe cerrar el panel', MA, "  else if (nombre === 'trofeos') desafio.baseCrece.trofeos.cerrarPanel();", "  else if (nombre === 'trofeos') { /* nada */ }"],
  ['cada cuadro vigila el panel', MA, "desafio.baseCrece?.trofeos?.vigilarPanel?.(js.pos);", 'void 0;'],
  // ---- S5. la semilla
  ['lo elegido se siembra', HU, 'const elegida = esCultivo(preferida) ? lista.find((x) => x.cultivo === preferida) : null;', 'const elegida = null;'],
  ['lo no elegido sigue como hoy', HU, 'return elegida || lista[0] || null;', 'return elegida || lista[lista.length - 1] || null;'],
  ['Tab da la vuelta', HU, '% n) + n) % n].cultivo;', '% n) + n) % n - 0].cultivo.slice(0, 0) || "habas";'],
  ['hacia atrás con Mayús+Tab', HU, 'paso < 0 ? -1 : 1', '1'],
  ['sólo un cultivo de verdad se guarda', HU, 'export const sanearSemillaElegida = (v) => (esCultivo(v) ? v : null);', 'export const sanearSemillaElegida = (v) => (typeof v === "string" ? v : null);'],
  ['la semilla elegida se guarda en la partida', GU, '    semillaElegida: sanearSemillaElegida(p.semillaElegida),', '    semillaElegida: null,'],
  ['el cartel dice cómo cambiar', MA, "' (Tab o rueda: otra semilla)' : ''", "'' : ''"],
  ['el cartel usa la elegida', MA, "  const s = semillaParaSembrar(cuantoParaSembrar, progreso.semillaElegida);\n  // 4.11.1 (S5): con más", "  const s = semillaParaSembrar(cuantoParaSembrar);\n  // 4.11.1 (S5): con más"],
  ['la siembra usa la elegida', MA, "    const s = semillaParaSembrar(cuantoParaSembrar, progreso.semillaElegida);\n    if (!s) { nota('No tenés qué sembrar'", "    const s = semillaParaSembrar(cuantoParaSembrar);\n    if (!s) { nota('No tenés qué sembrar'"],
  ['Tab cambia la semilla', MA, 'if (cambiarSemillaCantero(e.shiftKey ? -1 : 1)) { e.preventDefault(); break; }', 'if (false) { break; }'],
  ['la rueda cambia la semilla', MA, 'if (cambiarSemillaCantero(e.deltaY > 0 ? 1 : -1)) return;', ''],
  ['sólo junto a un cantero vacío', MA, 'if (!c || huerta()[c.clave]) return false;', 'if (!c) return false;'],
  ['con una sola semilla la rueda sigue siendo de la barra', MA, 'if (semillasDisponibles(cuantoParaSembrar).length < 2) return false;', ''],
  ['no cambia con un panel abierto', MA, "if (modo !== 'jugando' || !jugador || charla.npc || panelDelHudAbierto() || modoObra || foto.activo) return false;", "if (modo !== 'jugando' || !jugador) return false;"],
  ['guarda lo elegido', MA, '  progreso.semillaElegida = nueva;\n', '  progreso.semillaElegida = null;\n'],
  // ---- U7. el foco
  ['la mochila anota el foco', MA, "const marcaFoco = abrir && mochilaAbierta ? guardarFoco(document, ['mochila-casillas', 'mochila-rejilla']) : null;", 'const marcaFoco = null;'],
  ['la mochila devuelve el foco', MA, '  devolverFoco(document, marcaFoco);   // 4.11.1 (U7)\n', ''],
  ['las cosas de la lista llevan su clave', MA, '    if (c.id != null) d.dataset.foco = String(c.id);   // 4.11.1 (U7)\n', ''],
  ['las casillas llevan su clave', CP, "if (d.dataset) d.dataset.foco = String(c.id);", ''],
  ['el cuaderno devuelve el foco', MA, 'finally { devolverFoco(document, marca); }', 'finally { /* nada */ }'],
  ['el cuaderno anota el foco', MA, "const marca = guardarFoco(document, ['cuaderno-lista', 'cuaderno-ficha']);", 'const marca = null;'],
  ['el foco vuelve a la misma cosa', FO, 'el = mismas[marca.n] || mismas[mismas.length - 1] || null;', 'el = null;'],
  ['si la cosa no está, el mismo lugar', FO, 'if (!el) el = lista[Math.max(0, Math.min(marca.i, lista.length - 1))];', 'if (!el) el = lista[0];'],
  ['la misma pila', FO, ".indexOf(a);\n    return { id, i, clave, n };", ".indexOf(a) * 0;\n    return { id, i, clave, n };"],
  // ---- P4. recetas y ropa a una ranura vacía
  ['irAPartida lleva lo personal a la ranura vacía', MA, "if (!infoPartida(modoJuego, ranura)?.hay) {", "if (false) {"],
  ['a una ranura con partida no se le toca nada', MA, "if (!infoPartida(modoJuego, ranura)?.hay) {", "if (true) {"],
  ['la ranura vacía toma lo anotado', MA, 'if (pendiente) progreso.personal = sanearPersonal(pendiente);', ''],
  ['el Bruno de la partida vieja no viaja', PP, 'const nuevo = empezarConReceta(personal, ajustes);', 'const nuevo = { personal, ajustes };'],
  ['lo anotado se toma una sola vez', PP, '    almacen.removeItem(k);\n', ''],
  ['lo anotado es de esa ranura', PP, "`hojarasca-personal-pendiente-${modo}-${ranura}`", "`hojarasca-personal-pendiente-${modo}`"],
];

const solo = process.env.SOLO;
let fallo = 0, corridas = 0;
for (const [nombre, archivo, de, a] of MUTACIONES) {
  if (solo && !nombre.includes(solo)) continue;
  const ruta = path.join(raiz, archivo);
  const original = fs.readFileSync(ruta, 'utf8');
  if (!original.includes(de)) { console.log(`NO ENCONTRADA   ${nombre}`); fallo++; continue; }
  corridas++;
  fs.writeFileSync(ruta, original.replace(de, () => a), 'utf8');
  let r;
  try { r = spawnSync(process.execPath, [prueba], { cwd: raiz, encoding: 'utf8', timeout: 120000 }); }
  finally { fs.writeFileSync(ruta, original, 'utf8'); }
  const cae = r.status !== 0;
  console.log(`${cae ? 'detectada      ' : 'SE ESCAPO      '} ${nombre}`);
  if (!cae) fallo++;
}
console.log(fallo ? `\n${fallo} mutaciones sin detectar` : `\ntodas las mutaciones (${corridas}) se detectan`);
process.exit(fallo ? 1 : 0);

// 3.5.4: la ventana y las teclas. Todo camino por el que, jugando, la ventana se iba del juego,
// se abría dos veces, perdía el mouse para siempre o seguía sin vos:
//  1. Sólo se navega al juego mismo (antes pasaba cualquier file://: un archivo de la compu
//     reemplazaba al juego), sin historial para "atrás", y soltar archivos no hace nada.
//  2. La segunda copia del juego no abre su ventana (sólo trae al frente la que hay).
//  3. Alt+Espacio no abre el menú de la ventana de Windows (con él abierto, C = "Cerrar").
//  4. El mouse: tres pedidos de bloqueo que no podían andar (ventana sin foco, Esc para volver)
//     ya no pasan el juego para siempre a "arrastrar para mirar".
//  5. Sin el mouse bloqueado, perder el foco igual pausa; suspender o bloquear la pantalla
//     pausa y guarda; Windows que cierra la sesión guarda y baja a disco.
//  6. Al volver de una suspensión el tiempo del juego no salta (dt acotado).
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import assert from 'node:assert/strict';
import { crearRelojCadencia, crearMedidorRefresco, crearRitmoAuto } from '../src/rendimiento.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (r) => fs.readFileSync(path.join(raiz, r), 'utf8');
const requerir = createRequire(import.meta.url);
const principal = leer('main.cjs');
const precarga = leer('preload.cjs');
const ventanaMain = leer('ventana-main.cjs');
const jugador = leer('src/jugador.js');
const juego = leer('src/main.js');

// ---------------------------------------------------------------- 1. navegación
const { esElJuego, cuidarVentana } = requerir(path.join(raiz, 'ventana-main.cjs'));
const index = path.join(raiz, 'index.html');
const url = (p, q = '') => 'file:///' + p.replace(/\\/g, '/').replace(/^\//, '') + q;
assert.ok(esElJuego(url(index), index), 'el juego');
assert.ok(esElJuego(url(index, '?recuperado=graficos&debug=1'), index), 'el juego con ?recuperado= (la recarga por la placa)');
assert.ok(esElJuego(url(index, '#algo'), index), 'el juego con #');
if (process.platform === 'win32') assert.ok(esElJuego(url(index.toUpperCase()), index), 'en Windows sin importar mayúsculas');
for (const otra of [url(path.join(raiz, 'README.md')), url(path.join(path.dirname(raiz), 'nota.txt')), 'file:///C:/Windows/win.ini', 'https://example.com/', 'data:text/html,hola', 'blob:file:///x', 'javascript:alert(1)', 'about:blank', '', 'cualquier cosa']) {
  assert.equal(esElJuego(otra, index), false, `no se navega a ${otra || '(vacío)'}`);
}
// cuidarVentana con una ventana de mentira: bloquea, registra, borra el historial, guarda
const oyentes = {};
const enganchar = (dueno) => (ev, fn) => { (oyentes[`${dueno}:${ev}`] ||= []).push(fn); };
const enviados = []; let borrado = 0, bajado = 0;
const wc = { on: enganchar('wc'), isDestroyed: () => false, send: (c) => enviados.push(c), navigationHistory: { clear: () => { borrado++; } }, session: { flushStorageData: () => { bajado++; } } };
const ventana = { webContents: wc, on: enganchar('v'), isDestroyed: () => false };
const pm = { on: enganchar('pm'), removeListener: () => {} };
const registro = [];
cuidarVentana({ ventana, index, escribirCrash: (t, m) => registro.push(`${t}: ${m}`), powerMonitor: pm });
const navegar = (u) => { let prevenido = false; for (const f of oyentes['wc:will-navigate']) f({ preventDefault: () => { prevenido = true; } }, u); return prevenido; };
assert.equal(navegar(url(index, '?recuperado=caida')), false, 'la recarga del juego pasa');
assert.equal(navegar('file:///C:/Users/x/foto.png'), true, 'un archivo de la compu no');
assert.ok(registro.some((l) => /^ventana: navegación bloqueada: file:\/\/\/C:\/Users\/x\/foto\.png/.test(l)), 'y queda en el registro');
oyentes['wc:did-finish-load'][0]();
assert.equal(borrado, 1, 'cada carga borra el historial (sin "atrás" a un juego viejo)');
oyentes['v:query-session-end'][0]();
assert.deepEqual(enviados, ['guardar-ya'], 'Windows cierra la sesión: guarda');
oyentes['pm:suspend'][0]();
assert.deepEqual(enviados.slice(1), ['pausar-ya', 'guardar-ya'], 'la compu se suspende: pausa y guarda');
assert.ok(oyentes['pm:lock-screen'], 'y lo mismo al bloquear la pantalla');
oyentes['v:session-end'][0]();
assert.ok(bajado >= 1, 'y baja a disco lo guardado');
// main.cjs: el filtro viejo no está y la ventana usa el nuevo
assert.ok(!/url\.startsWith\('file:\/\/'\)/.test(principal), 'sin el filtro viejo (cualquier file:// pasaba)');
assert.ok(/cuidarVentana\(\{ ventana, index: path\.join\(__dirname, 'index\.html'\)/.test(principal), 'main.cjs cuida la ventana');
assert.ok(/navigateOnDragDrop: false/.test(principal), 'soltar un archivo no navega');
assert.ok(principal.includes('setWindowOpenHandler(() => ({ action: \'deny\' }))'), 'y no se abren ventanas nuevas');
assert.ok(JSON.parse(leer('package.json')).build.files.includes('ventana-main.cjs'), 'ventana-main.cjs viaja en el instalador');
assert.ok(/window\.addEventListener\('dragover', \(e\) => \{ e\.preventDefault\(\); if \(e\.dataTransfer\) e\.dataTransfer\.dropEffect = 'none'; \}, true\)/.test(precarga), 'la página no acepta archivos soltados');
assert.ok(/window\.addEventListener\('drop', \(e\) => e\.preventDefault\(\), true\)/.test(precarga), 'ni los suelta');

// ---------------------------------------------------------------- 2. una sola copia
assert.ok(/const primeraInstancia = app\.requestSingleInstanceLock\(\);\nif \(!primeraInstancia\) app\.quit\(\);/.test(principal), 'pide ser la única copia');
const listo = principal.slice(principal.indexOf('app.whenReady().then(() => {'));
assert.ok(/^app\.whenReady\(\)\.then\(\(\) => \{\n  if \(!primeraInstancia\) return;/.test(listo), 'la segunda copia no arma su ventana (app.quit() antes de estar listo no frena whenReady)');
assert.ok(/app\.on\('second-instance', \(\) => \{[\s\S]{0,200}restore\(\)[\s\S]{0,80}focus\(\)/.test(principal), 'y la primera se trae al frente');

// ---------------------------------------------------------------- 3. Alt+Espacio
assert.ok(/window\.addEventListener\('keydown', \(e\) => \{ if \(e\.altKey && e\.code === 'Space'\) e\.preventDefault\(\); \}, true\)/.test(precarga), 'Alt+Espacio no abre el menú de Windows');
// (y no se frena en el proceso principal: ahí el juego no recibiría el Espacio para saltar)
assert.ok(!/before-input-event[\s\S]{0,200}Space/.test(principal), 'el Espacio le sigue llegando al juego');

// ---------------------------------------------------------------- 4. el mouse
assert.ok(/let pedidoValido = true;/.test(jugador), 'el pedido se marca');
assert.ok(/const fallo = \(\) => \{ if \(!pedidoValido\) return; fallos\+\+;/.test(jugador), 'sólo cuentan los pedidos que podían andar');
assert.ok(/pedidoValido = document\.hasFocus\(\) && \(!navigator\.userActivation \|\| navigator\.userActivation\.isActive\);\n    try \{/.test(jugador), 'con foco y por un gesto del jugador');
// simulación de la cuenta: tres Esc para volver (sin gesto) ya no pasan a arrastrar
function cuenta(pedidos) {
  let fallos = 0, arrastre = false;
  for (const p of pedidos) { const valido = p.foco && p.gesto; if (!p.anda && valido) { fallos++; if (fallos >= 3) arrastre = true; } if (p.anda) fallos = 0; }
  return arrastre;
}
assert.equal(cuenta([{ foco: true, gesto: false, anda: false }, { foco: true, gesto: false, anda: false }, { foco: true, gesto: false, anda: false }]), false, 'Esc, Esc, Esc: sigue el mouse bloqueado con un clic');
assert.equal(cuenta([{ foco: false, gesto: true, anda: false }, { foco: false, gesto: true, anda: false }, { foco: false, gesto: true, anda: false }]), false, 'sin foco tampoco');
assert.equal(cuenta([{ foco: true, gesto: true, anda: false }, { foco: true, gesto: true, anda: false }, { foco: true, gesto: true, anda: false }]), true, 'donde de verdad no hay bloqueo (escritorio remoto), igual se pasa a arrastrar');

// ---------------------------------------------------------------- 5. foco, suspensión, sesión
assert.ok(/if \(modo === 'jugando' && jugador && !document\.pointerLockElement && !banco\.activa\) abrir\('pausa'\);/.test(juego), 'perder el foco sin el mouse bloqueado pausa');
assert.ok(/window\.hojarasca\?\.alPedirPausa\?\.\(\(\) => \{ if \(modo === 'jugando' && jugador && !banco\.activa\) abrir\('pausa'\); \}\);/.test(juego), 'el juego se pausa cuando main.cjs lo pide');
assert.ok(/alPedirPausa: \(fn\) => \{ if \(typeof fn === 'function'\) ipcRenderer\.on\('pausar-ya'/.test(precarga), 'preload: pausar-ya');
assert.ok(/window\.addEventListener\('blur', \(\) => \{\n    teclas\.clear\(\);/.test(jugador), 'las teclas se sueltan al perder el foco (no quedan pegadas)');
assert.ok(/window\.addEventListener\('beforeunload', guardar\);/.test(juego), 'cerrar la ventana (la X, Alt+F4) guarda');
assert.ok(/ventana\.on\('query-session-end'/.test(ventanaMain) && /powerMonitor\.on\('suspend'/.test(ventanaMain), 'sesión y suspensión vigiladas');

// ---------------------------------------------------------------- 6. el tiempo después de suspender
assert.ok(/const dtReal = Math\.min\(0\.2, cadencia\.dtReal\);/.test(juego), 'el dt real del cuadro tiene tope (0,2 s)');
assert.ok(/const dt = Math\.min\(0\.05, dtReal\)/.test(juego), 'y el del mundo, 0,05 s');
{
  // 10 minutos dormida: el reloj de cadencia no intenta recuperar los cuadros perdidos
  const r = crearRelojCadencia(0);
  let t = 0;
  for (let i = 0; i < 60; i++) { t += 1000 / 60; r.decidir(t, 60); }
  t += 10 * 60 * 1000;
  const c = r.decidir(t, 60);
  assert.ok(c.dibujar && Math.min(0.2, c.dtReal) === 0.2, 'el cuadro de la vuelta queda acotado a 0,2 s');
  let dibujados = 0;
  for (let i = 0; i < 6; i++) { t += 1000 / 60; if (r.decidir(t, 60).dibujar) dibujados++; }
  assert.ok(dibujados >= 5, `y sigue a 60 al toque (${dibujados} de 6), sin ráfagas de cuadros atrasados`);
  const v = crearRelojCadencia(0);
  t = 0;
  for (let i = 0; i < 60; i++) { t += 1000 / 60; v.decidirVsync(t, 1000 / 60, 1); }
  t += 10 * 60 * 1000;
  const cv = v.decidirVsync(t, 1000 / 60, 1);
  assert.ok(cv.dibujar && Math.min(0.2, cv.dtReal) === 0.2, 'con el ritmo parejo, también');
  t += 1000 / 60;
  const sig = v.decidirVsync(t, 1000 / 60, 1);
  assert.ok(sig.dibujar && Math.abs(sig.dtReal - 1 / 60) < 0.003, `y el siguiente cuadro ya es normal (${sig.dtReal.toFixed(4)} s)`);
  // el monitor medido y el ritmo automático no se confunden con el hueco
  const m = crearMedidorRefresco();
  t = 0;
  for (let i = 0; i < 200; i++) { t += 1000 / 120; m.anotar(t); }
  const antes = m.periodoMs;
  m.anotar(t + 10 * 60 * 1000);
  assert.equal(m.periodoMs, antes, 'el refresco medido no cambia por la suspensión');
  const ra = crearRitmoAuto();
  for (let i = 0; i < 400; i++) ra.anotar(4, 2, 1000 / 120, true);
  const k = ra.k;
  ra.anotar(4, 72000, 1000 / 120, true);
  assert.equal(ra.k, k, 'ni el ritmo automático');
}
console.log('OK 3.5.4 · ventana: sólo navega al juego, una sola copia, sin menú de Windows con Alt+Espacio, el mouse no se pierde, pausa sin foco y al suspender, el tiempo no salta');

// 3.5.1: caídas. Sólo Node (la partida de verdad está en pruebas/humo-3-5-1-caidas.cjs).
//  1. Las preguntas del juego (dialogo.js): una por vez y en orden, Enter/Esc, el mando, el
//     texto cortado, y el enganche de las pruebas.
//  2. Ningún prompt/confirm/alert del navegador en el juego (Electron no tiene prompt: el
//     nombre de la obra tiraba "prompt() is not supported" en cada obra terminada).
//  3. El contexto 3D perdido: pausa, aviso, rehacer (impostores, sombras, consultas) y si no,
//     guardar y recargar.
//  4. El bucle: un sistema que falla se anota una vez y no se lleva puesto el cuadro.
//  5. main.cjs: recarga después de una caída, tope de reintentos, la placa que se cae seguido
//     pasa a la próxima forma de iniciar los gráficos (y se guarda antes).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const requerir = createRequire(import.meta.url);
let pasos = 0;
const ok = (c, m) => { assert.ok(c, m); pasos++; };

// ---------------------------------------------------------------- 1. dialogo.js
const { crearColaDialogos, bordesMando } = await import('../src/dialogo.js');
{
  const vistos = [];
  let valor = '';
  const vista = { mostrar: (d) => vistos.push(['mostrar', d.tipo, d.texto, d.inicial]), ocultar: () => vistos.push(['ocultar']), valor: () => valor };
  const c = crearColaDialogos(vista);
  const p1 = c.confirmar('¿Primera?');
  const p2 = c.pedirTexto('¿Nombre?', 'Galpón', { max: 10 });
  ok(c.abierto() && c.pendientes() === 2 && vistos.length === 1, 'una pregunta por vez: la segunda espera');
  ok(c.actual().texto === '¿Primera?' && c.actual().si === 'Sí' && c.actual().no === 'No', 'la primera, con Sí y No');
  ok(c.tecla('KeyW') === false, 'las teclas que no son Enter ni Esc no las usa');
  ok(c.tecla('Enter') === true, 'Enter acepta');
  assert.equal(await p1, true);
  ok(c.actual().tipo === 'texto' && c.actual().inicial === 'Galpón' && c.actual().si === 'Listo', 'después la de texto, con lo que ya tenía');
  valor = '   El Rincón de la Laguna   ';
  c.aceptar();
  assert.equal(await p2, 'El Rincón', 'sin espacios de más y cortado al largo máximo');
  ok(!c.abierto() && c.pendientes() === 0, 'y se cierra');
  const p3 = c.confirmar('¿Borrar?');
  ok(c.tecla('Escape'), 'Esc cancela');
  assert.equal(await p3, false);
  const p4 = c.pedirTexto('¿Nombre?', 'x');
  c.cancelar();
  assert.equal(await p4, null, 'cancelar el de texto no cambia nada (null, como prompt)');
  ok(c.tecla('Enter') === false && c.aceptar() === false, 'sin cuadro abierto no hace nada');
  ok(vistos.filter((v) => v[0] === 'ocultar').length === 4, 'cada cuadro se oculta al contestar');
  // el enganche de las pruebas (?debug=1): contesta sin mostrar nada
  c.auto = (tipo, texto) => (tipo === 'texto' ? 'Mi Puesto' : texto.includes('sí'));
  const antes = vistos.length;
  assert.equal(await c.confirmar('decí que sí'), true);
  assert.equal(await c.pedirTexto('¿Nombre?'), 'Mi Puesto');
  ok(vistos.length === antes, 'contestado por el enganche no se muestra');
  c.auto = () => undefined;
  const p5 = c.confirmar('¿Y ésta?');
  ok(c.abierto(), 'si el enganche no contesta (undefined), se pregunta de verdad');
  c.aceptar(); await p5;
  // si mostrar falla, la pregunta se contesta "no" y no se traba la cola
  const rota = crearColaDialogos({ mostrar: () => { throw new Error('sin panel'); }, ocultar() {}, valor: () => '' });
  assert.equal(await rota.confirmar('x'), false);
  assert.equal(await rota.pedirTexto('x'), null);
  ok(!rota.abierto(), 'sin panel no queda nada abierto');
  // el mando: A acepta, B cancela, sólo al apretar
  const pad = (a, b) => [{ connected: true, buttons: [{ pressed: a }, { pressed: b }] }];
  ok(bordesMando(pad(true, false), null).aceptar, 'A acepta');
  ok(!bordesMando(pad(true, false), { a: true, b: false }).aceptar, 'A que ya venía apretado no cuenta');
  ok(bordesMando(pad(false, true), { a: false, b: false }).cancelar, 'B cancela');
  ok(!bordesMando([null, { connected: false, buttons: [{ pressed: true }] }], null).aceptar, 'sin mando conectado, nada');
}

// ---------------------------------------------------------------- 2. sin diálogos del navegador
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
for (const f of fs.readdirSync(path.join(raiz, 'src')).filter((x) => /\.(js|html)$/.test(x))) {
  const texto = sinComentarios(leer('src/' + f));
  const m = /(^|[^.\w])(prompt|confirm|alert)\s*\(|window\.(prompt|confirm|alert)\s*\(/m.exec(texto);
  assert.equal(m, null, `${f} usa ${m && m[0]} del navegador`);
}
pasos++;
const main = leer('src/main.js');
ok(/import \{ crearDialogos \} from '\.\/dialogo\.js';/.test(main), 'main.js arma las preguntas con dialogo.js');
ok(/async function pedirNombre\(obra\) \{\n\s+const puesto = await dialogos\.pedirTexto\('¿Cómo le vas a poner\?'/.test(main), 'el nombre de la obra, con el cuadro del juego');
ok(/!obras\.obras\.includes\(obra\)\) return;/.test(main), 'si la obra ya no está, no se nombra');
ok(main.includes("dialogos.confirmar('Esto borra el recorrido guardado"), 'nuevo recorrido pregunta con el cuadro');
ok(/await dialogos\.confirmar\(`Esto borra la partida/.test(main) && /await dialogos\.confirmar\(textoOfertaSync/.test(main) && /await dialogos\.confirmar\(`Otra vuelta/.test(main), 'borrar partida, la carpeta sincronizada y otra vuelta, también');
ok(/if \(preguntar\) return dialogos\.confirmar\(avisoImportar/.test(main), 'importar pregunta con el cuadro (y sin preguntar sigue igual)');
ok(/alAbrir: \(\) => \{ if \(modo === 'jugando'\) \{ modoAntesDialogo = 'jugando'; modo = 'dialogo'; jugador\?\.soltar\(\); \} \}/.test(main), 'con un cuadro abierto el juego queda quieto');
ok(/if \(modo === 'jugando'\) volverAlJuego\(\);/.test(main), 'y al cerrarlo vuelve al juego');
ok(/auto: HOJARASCA_DEBUG \?/.test(main), 'el enganche de las pruebas sólo con ?debug=1');
const html = leer('src/plantilla.html');
for (const id of ['dialogo', 'dialogo-texto', 'dialogo-entrada', 'dialogo-si', 'dialogo-no', 'graficos-recuperando', 'aviso-recuperado']) ok(html.includes(`id="${id}"`), `la plantilla tiene #${id}`);
ok(/#dialogo \{ z-index: 60; \}/.test(html), 'el cuadro va arriba de los paneles');
ok(html.includes('Recuperando los gráficos…'), 'el aviso de los gráficos');
const dialogo = leer('src/dialogo.js');
ok(/ventana\.addEventListener\('keydown', \(e\) => \{\n\s+if \(!cola\.abierto\(\)\) return;\n\s+if \(cola\.tecla\(e\.code\)\) e\.preventDefault\(\);\n\s+e\.stopImmediatePropagation\(\);\n\s+\}, true\);/.test(dialogo), 'abierto, ninguna tecla llega al juego (en la captura de la ventana)');
ok(/getGamepads/.test(dialogo), 'y lee el mando');

// ---------------------------------------------------------------- 3. el contexto 3D
ok(/lienzo\.addEventListener\('webglcontextlost', \(e\) => \{\n\s+e\.preventDefault\(\);/.test(main), 'contexto perdido: preventDefault (si no, no vuelve)');
ok(/\$\('graficos-recuperando'\)\?\.classList\.remove\('oculto'\);/.test(main), 'muestra "Recuperando los gráficos…"');
ok(/if \(jugador && !reiniciandoPartida\) \{ cancelarGuardadoSuave\(\); guardar\(\); \}/.test(main), 'y guarda enseguida');
ok(/function bucle\(tRaf, manual = false\) \{\n\s+if \(!manual\) requestAnimationFrame\(bucle\);\n\s+if \(estadoGraficos\.perdidos\) return;/.test(main), 'el bucle espera sin contexto');
ok(/lienzo\.addEventListener\('webglcontextrestored'/.test(main), 'y cuando vuelve, rehace');
ok(/veg\?\.rehornearImpostores\?\.\(\);/.test(main) && /renderer\.shadowMap\.needsUpdate = true;\s+\/\/ el mapa de sombras/.test(main) && /cronometroGpu = undefined;/.test(main), 'rehace impostores, sombras y consultas de tiempo');
ok(/variantesLuces\.compilarCarga\(jugador\.estado\.pos\)/.test(main), 'y compila los programas con el cartel puesto');
ok(/setTimeout\(\(\) => recargarPorGraficos\('la placa no devolvió el contexto'\), estadoGraficos\.esperaMs\)/.test(main), 'si no vuelve a tiempo, recarga');
ok(/url\.searchParams\.set\('recuperado', 'graficos'\);\n\s+location\.replace/.test(main), 'recargando con el aviso');
ok(/function recargarPorGraficos[\s\S]{0,400}guardar\(\);/.test(main), 'guardando antes');
ok(!/webglcontextrestored', \(\) => location\.reload\(\)/.test(html), 'la plantilla ya no recarga a ciegas (sin guardar) al volver el contexto');
const imp = leer('src/impostores.js');
ok(/function rehornear\(\) \{[\s\S]*?verano = hornearImpostores\(renderer, especies, false, cartas, verano\);[\s\S]*?estado\.uColor\.value = verano\.color\.texture;/.test(imp), 'los impostores se pueden volver a hornear (en los mismos atlas)');
ok(/rehornearImpostores: \(\) => \(impostores \? impostores\.rehornear\(\) : 0\)/.test(leer('src/vegetacion.js')), 'desde la vegetación');
const three = leer('three-r186-inline.js');
ok(/Context Restored\."\),H=!1;let j=se\.autoReset[^;]*;ct\(\)/.test(three), 'three r186 rehace su estado solo al volver el contexto (initGLContext)');

// ---------------------------------------------------------------- 4. el bucle
ok(/try \{ cuadroDelJuego\(tRaf, manual\); \} catch \(err\) \{\n\s+fallaSistema\('cuadro', err\);/.test(main), 'una excepción del cuadro no deja la pantalla congelada');
for (const s of ['fauna', 'gente', 'perro', 'desafio', 'clima', 'sonido', 'pueblo', 'valle', 'modos']) ok(main.includes(`catch (e) { fallaSistema('${s}', e); }`), `"${s}" falla solo`);
ok(main.includes("try { if (modo === 'jugando') actualizarPueblo(dt); } catch (e) { fallaSistema('pueblo', e); }"), 'la línea de siempre, adentro');
ok(/if \(f\) \{ f\.veces\+\+; return; \}/.test(main) && /reportarError\?\.\(`bucle\/\$\{nombre\}/.test(main), 'se anota una vez (y por reportarError)');
ok(/const yaReportados = new Set\(\);/.test(html), 'el registro de errores no repite el mismo');
ok(/acumuladoGuardado \+= dtReal;\n\s+if \(acumuladoGuardado > 20\) \{ acumuladoGuardado = 0; programarGuardadoSuave\(\); \}/.test(main), 'el autoguardado va cada 20 s de reloj');

// ---------------------------------------------------------------- 5. main.cjs
const R = requerir(path.join(raiz, 'recuperacion-main.cjs'));
{
  let t = 0;
  const v = R.crearVigia({ ventanaMs: 1000, ahora: () => t });
  ok(v.anotar() === 1 && v.anotar() === 2, 'cuenta las caídas');
  t = 1500;
  ok(v.anotar() === 1, 'y se olvida de las viejas');
  ok(R.decidirCaida('crashed', 1) === 'recargar' && R.decidirCaida('oom', 3) === 'recargar', 'una caída: se vuelve a abrir');
  ok(R.decidirCaida('crashed', 4) === 'preguntar', 'más de tres en cinco minutos: se pregunta (sin bucle de caídas)');
  ok(R.decidirCaida('clean-exit', 9) === 'nada', 'cerrar bien no es una caída');
  ok(R.decidirGpu('crashed', 1) === 'esperar' && R.decidirGpu('crashed', 2) === 'cambiar-graficos' && R.decidirGpu('crashed', 5, 2, false) === 'esperar', 'la placa: a la segunda caída, otra forma');
  const fuente = leer('main.cjs');
  const intentos = eval(/const INTENTOS_GRAFICOS = (\[[\s\S]*?\]);/.exec(fuente)[1]);
  ok(R.siguienteGraficosPorCaidas(intentos, 0) === 3 && R.siguienteGraficosPorCaidas(intentos, 1) === 3 && R.siguienteGraficosPorCaidas(intentos, 2) === 3 && R.siguienteGraficosPorCaidas(intentos, 3) === -1, 'la próxima con otro use-angle de 2.7.3 (sin d3d9, que no da WebGL 2)');
  ok(/require\('\.\/recuperacion-main\.cjs'\)/.test(fuente) && /recuperacion\.vigilar\(ventana\);/.test(fuente), 'main.cjs vigila la ventana');
  ok(/siguienteGraficosPorCaidas\(INTENTOS_GRAFICOS, intentoGraficos\(\)\)/.test(fuente), 'y cambia de gráficos con la cadena de 2.7.3');
  ok(JSON.parse(leer('package.json')).build.files.includes('recuperacion-main.cjs'), 'viaja en el instalador');
  ok(/alPedirGuardar: \(fn\) =>[^\n]*ipcRenderer\.on\('guardar-ya'/.test(leer('preload.cjs')), 'preload: el pedido de guardar');
  ok(/window\.hojarasca\?\.alPedirGuardar\?\.\(/.test(main), 'y el juego lo atiende');
}
// la vigilancia con un Electron de mentira
{
  const { EventEmitter } = await import('node:events');
  const app = new EventEmitter();
  let relanzado = null, salio = 0, pregunto = 0, cambio = 0;
  app.relaunch = (o) => { relanzado = o; }; app.quit = () => { salio++; };
  const cargas = [], enviados = [], registro = [];
  const ventana = { webContents: new EventEmitter(), isDestroyed: () => false, loadFile: async (f, o) => { cargas.push(o?.query?.recuperado); } };
  ventana.webContents.send = (c) => enviados.push(c);
  let matada = 0; ventana.webContents.forcefullyCrashRenderer = () => { matada++; };
  const dialog = { showMessageBox: async () => { pregunto++; return { response: 0 }; } };
  const rec = R.registrarRecuperacion({ app, dialog, escribirCrash: (t, d) => registro.push(`${t}: ${d}`), index: 'index.html', ventanaActual: () => ventana,
    cambiarGraficos: () => (++cambio, true), retrasoReinicioMs: 0, esperaColgadaMs: 30 });
  rec.vigilar(ventana);
  const caer = (reason) => ventana.webContents.emit('render-process-gone', {}, { reason, exitCode: -1 });
  caer('crashed'); caer('oom'); caer('crashed');
  await new Promise((r) => setTimeout(r, 10));
  ok(cargas.join() === 'caida,caida,caida', 'cada caída vuelve a abrir la partida, avisando');
  caer('clean-exit');
  ok(cargas.length === 3, 'cerrar bien no recarga');
  caer('crashed');
  await new Promise((r) => setTimeout(r, 10));
  ok(pregunto === 1 && cargas.length === 4, 'la cuarta seguida pregunta (y con "Volver a abrir" sigue)');
  ok(registro.some((l) => /^recuperacion: caída 4/.test(l)), 'y queda en el registro');
  ventana.webContents.emit('unresponsive');
  await new Promise((r) => setTimeout(r, 60));
  ok(matada === 1, 'colgada y sin volver: se reinicia la página');
  ventana.webContents.emit('unresponsive'); ventana.webContents.emit('responsive');
  await new Promise((r) => setTimeout(r, 60));
  ok(matada === 1, 'si vuelve a responder, no');
  app.emit('child-process-gone', {}, { type: 'Utility', reason: 'crashed' });
  app.emit('child-process-gone', {}, { type: 'GPU', reason: 'crashed', exitCode: 1 });
  ok(cambio === 0 && !relanzado, 'una caída de la placa: Chromium la relanza y la página recupera el contexto');
  app.emit('child-process-gone', {}, { type: 'GPU', reason: 'crashed', exitCode: 1 });
  await new Promise((r) => setTimeout(r, 10));
  ok(cambio === 1 && enviados.includes('guardar-ya'), 'la segunda: guarda y pasa a la próxima forma de gráficos');
  ok(relanzado && relanzado.args.includes('--hojarasca-recuperado=graficos') && salio === 1, 'y se reinicia avisando');
  app.emit('child-process-gone', {}, { type: 'GPU', reason: 'crashed', exitCode: 1 });
  ok(cambio === 1, 'reiniciando, no se encadena otra');
}

console.log(`OK 3.5.1 caídas · ${pasos} verificaciones`);

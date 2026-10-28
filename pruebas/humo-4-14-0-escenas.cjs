// Partida real 4.14.0 (Electron + WebGL): el motor de escenas de la Historia, con la escena de demostración «Llegada de Josefina».
//   1. Historia en marcha; «escena demo» desde la consola de códigos dispara la escena (no está en el juego normal);
//   2. la cámara dirigida se aparta de la del jugador (planos distintos), barras de cine y caja de diálogo en HTML;
//   3. el diálogo avanza con Enter (la primera vez completa la línea), la elección se contesta con un número y ramifica;
//   4. pausar (F1/abrir pausa) congela la escena; el mouse queda suelto; guardar a mitad de la escena no escribe;
//   5. Esc dos veces salta: efectos, Josefina libre y en su lugar; la cámara vuelve al jugador sin saltos y los programas de shader no crecen;
//   6. guardado y recarga: una escena a medias queda pendiente (se puede volver a disparar); una terminada queda vista;
//   7. la mirada dirigida corta; sin errores de consola.
// Uso (después de `node armar.mjs`), en el monitor externo y con perfil propio:
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-14-0-escenas.cjs -Espera 900 -Perfil <carpeta propia> [-Visible]
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'escenas-4-14-0'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 14 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 14 * 60 * 1000).unref?.();
const CAPTURAS = process.env.HUMO_CAPTURAS !== '0';

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, T = H.T, J = H.jugador, P = H.progreso;
  const N = window.__N = {};
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  H.ajustes.limiteFps = 'libre';
  N.programas = () => H.renderer.info.programs.length;
  // corre el juego en tiempo real, seg segundos (cuadros a mano)
  N.tick = async (seg = 0.5) => { const t0 = performance.now(); while (performance.now() - t0 < seg * 1000) { H.__bucle(); await dormir(14); } return 1; };
  N.es = () => H.__escenas;
  N.dir = () => H.__escenas.director;
  N.dato = () => N.dir().datos();
  N.tecla = (code) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true, cancelable: true })); return 1; };
  N.enter = () => (N.dato() && N.dato().dialogo ? N.tecla('Enter') : 0);
  N.teclaSuelta = (code) => { document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true, cancelable: true })); return 1; };
  // corre hasta que se cumpla algo (o se acabe el tiempo)
  N.hasta = async (f, max = 40) => { const t0 = performance.now(); while (performance.now() - t0 < max * 1000) { if (f()) return 1; H.__bucle(); await dormir(14); } return 0; };
  N.linea = () => { const d = N.dato(); return d && d.dialogo ? d.dialogo.texto : ''; };
  N.ema = () => H.gente.gente.find((g) => g.clave === 'ema');
  N.camara = () => { const c = H.camara; return { x: c.position.x, y: c.position.y, z: c.position.z, yaw: c.rotation.y, pitch: c.rotation.x, fov: c.fov }; };
  N.ojos = () => { const j = J.estado; return { x: j.pos.x, y: j.pos.y + j.alturaOjos, z: j.pos.z }; };
  N.distOjos = () => { const a = N.camara(), b = N.ojos(); return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z); };
  N.pantalla = () => ({
    cuerpo: document.body.className,
    barras: [...document.querySelectorAll('.escena-barra')].map((b) => Math.round(b.getBoundingClientRect().height)),
    dialogo: document.getElementById('escena-dialogo') ? document.getElementById('escena-dialogo').className : null,
    opciones: [...document.querySelectorAll('#escena-dialogo .opciones button')].map((b) => b.textContent),
    pie: document.getElementById('escena-pie') ? getComputedStyle(document.getElementById('escena-pie')).display : null,
    velo: document.getElementById('escena-velo') ? document.getElementById('escena-velo').style.opacity : null,
  });
  N.disparar = async () => {
    const t = H.__trucos();
    t.abrir();
    t.ejecutar('escena demo');
    await N.tick(0.3);
    return N.dir().activa() ? 1 : 0;
  };
  N.historia = () => {
    const h = P.historia = P.historia || {};
    Object.assign(h, { activa: true, capitulo: 0, fase: 'jugando', empezada: 1, terminada: 0, hechos: {}, base: { dia: 1 }, momentos: {}, cerrados: {} });
    H.ajustes.relaxTipo = 'historia';
    return 1;
  };
  N.afuera = () => { const r = T.lugares.refugio; J.ubicar(r.x + 9, r.z + 12, 0.4); P.horas = 11; return 1; };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [], consola = [];
  const w = new BrowserWindow({ show: true, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { consola.push(m.slice(0, 300)); errores.push(m.slice(0, 200)); }
  });
  w.webContents.on('render-process-gone', (e, d) => console.log('  PROCESO DE LA PÁGINA CAÍDO:', JSON.stringify(d)));
  let donde = 'carga';
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 120 s (${donde})`)), 120000))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const N = (c) => js(`(async () => { const H = window.__hojarasca, N = window.__N, P = H.progreso; return (${c}); })()`);
  const url = process.env.HTML ? path.resolve(process.env.HTML) : path.join(raiz, 'index.html');
  const ajustes = (tipo) => `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'relax', relaxTipo:'${tipo}', autoCalidad:false})); 1`;
  const abrir = async (tipo, limpio = true) => {
    await w.loadFile(url, { search: '?debug=1' });
    if (limpio) { await js(ajustes(tipo)); await w.loadFile(url, { search: '?debug=1' }); }
    let listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false); }
    if (!listo) throw new Error('el juego no cargó');
  };
  const foto = async (nombre) => {
    if (!CAPTURAS) return;
    try {
      await esperar(150);
      const img = await w.webContents.capturePage();
      fs.writeFileSync(path.join(salida, nombre + '.png'), img.toPNG());
      console.log(`  (captura ${nombre}.png)`);
    } catch (e) { console.log(`  (captura ${nombre} no se pudo: ${e && e.message})`); }
  };
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(PAGINA);
    await N('N.tick(2)');
    await N(`(() => { const t = document.getElementById('valle-tarjeta'); for (let i = 0; i < 4 && t && !t.classList.contains('oculto'); i++) { const b = t.querySelector('button'); if (b) b.click(); } return 1 })()`);
  };
  try {
    // ================================================================ 1. la carga
    donde = 'carga';
    await abrir('historia');
    await entrar();
    await N('N.historia()');
    await N('N.afuera()');
    await N('N.tick(2)');
    ok(!(await N('N.dir().hay("demo-llegada-josefina")')), 'el juego normal no trae la escena de demostración registrada');
    const prog0 = await N('N.programas()');
    const cam0 = await N('N.camara()');

    // ================================================================ 2. «escena demo»
    donde = 'disparo';
    ok((await N('N.disparar()')) === 1, 'la consola de códigos («escena demo») dispara la escena');
    ok(await N('N.dir().hay("demo-llegada-josefina")'), 'y recién ahí queda registrada');
    ok((await N('H.jugador.estado.zoom === false && !document.pointerLockElement')) === true, 'el mouse queda suelto');
    await N('N.tick(0.5)');
    const pan0 = await N('N.pantalla()');
    ok(/escena-en-curso/.test(pan0.cuerpo) && pan0.barras.every((h) => h > 40), `las barras de cine bajan (${pan0.barras})`);
    ok(pan0.pie === 'block', 'se ve el recordatorio de las teclas');
    await N('N.tick(1.3)');
    ok((await N('N.distOjos()')) > 0.8, `la cámara ya no es la del jugador (a ${(await N('N.distOjos()')).toFixed(1)} m de sus ojos)`);
    await N('N.tick(1.7)');
    await foto('1-travelling');
    const ema0 = await N('(() => { const e = N.ema(); return { conVos: !!e.conVos, vis: e.g.visible, d: Math.hypot(e.pos.x - H.jugador.estado.pos.x, e.pos.z - H.jugador.estado.pos.z) } })()');
    ok(ema0.conVos && ema0.vis, 'Josefina es la del juego (la tomó la escena) y está a la vista');
    ok(ema0.d < 20, `viene caminando hacia vos (a ${ema0.d.toFixed(1)} m)`);
    ok((await N('H.__bucle() || document.getElementById("hud").style.opacity || getComputedStyle(document.getElementById("hud")).opacity')) !== '1', 'el HUD se atenúa durante la escena');

    // ================================================================ 3. el diálogo y la elección
    donde = 'dialogo';
    ok(await N('N.hasta(() => N.dato() && N.dato().dialogo, 30)'), 'después de llegar empieza el diálogo');
    await N('N.tick(0.5)');
    let l1 = await N('N.linea()');
    const pan1 = await N('N.pantalla()');
    ok(/visible/.test(pan1.dialogo), 'la caja de diálogo se ve');
    ok(l1.length > 0 && l1.length < 79, `el texto se va escribiendo de a poco (${l1.length} letras)`);
    await foto('2-dialogo-escribiendo');
    await N('N.tecla("Enter")');
    await N('N.tick(0.1)');
    const l1b = await N('N.linea()');
    ok(l1b.length > l1.length && /incendio/.test(l1b), 'Enter completa la línea sin saltarla');
    await foto('3-dialogo-completo');
    await N('N.tecla("Space")'); await N('N.tick(0.6)'); await N('N.tecla("Enter")');
    ok(/Soy Josefina/.test(await N('N.linea()')), 'Enter / Espacio pasan a la siguiente línea');
    await N('N.tick(2.2)'); await N('N.tecla("Enter")');   // el sobre el hombro
    await foto('4-sobre-el-hombro');
    // seguimos hasta la elección
    let lineas = 2;
    for (let i = 0; i < 12 && !(await N('N.dato() && N.dato().eleccion')); i++) { await N('N.tick(0.4)'); await N('N.enter()'); await N('N.tick(0.15)'); await N('N.enter()'); lineas++; if (i === 1) await foto('5-senalando'); }
    ok(await N('!!(N.dato() && N.dato().eleccion)'), 'llega la elección');
    await N('N.tick(0.4)');
    const pan2 = await N('N.pantalla()');
    ok(pan2.opciones.length === 3 && /mate/.test(pan2.opciones[2]), `con sus tres opciones (${pan2.opciones.length})`);
    await foto('6-eleccion');
    // ================================================================ 4. pausar congela; guardar a mitad no escribe
    donde = 'pausa';
    const t0 = await N('N.dir().__sesion().t');
    await N('H.abrir("pausa")');
    await N('N.tick(1.2)');
    const t1 = await N('N.dir().__sesion().t');
    ok(Math.abs(t1 - t0) < 0.05, `con la pausa abierta la escena no avanza (${t0.toFixed(2)} → ${t1.toFixed(2)})`);
    ok(await N('N.dir().activa() && N.dir().corriendo()'), 'y sigue en pie');
    ok((await N('H.guardar()')) === false, 'guardar a mitad de la escena no escribe');
    await N('H.volverAlJuego()');
    await N('N.tick(0.6)');
    ok(await N('!document.pointerLockElement'), 'al volver de la pausa el mouse sigue suelto');
    const t2 = await N('N.dir().__sesion().t');
    ok(t2 > t1, 'y la escena sigue');
    // elegir con el número 2 → la rama «dudo»
    await N('N.tecla("Digit2")');
    await N('N.tick(0.5)');
    ok((await N('N.dir().elecciones().saludo')) === 'dudo', 'el número 2 elige la opción 2');
    ok(await N('N.hasta(() => /Sincero/.test(N.linea()), 12)'), 'y la escena sigue por esa rama');
    await foto('7-rama');
    for (let i = 0; i < 6 && (await N('N.dir().activa() && N.dir().corriendo()')); i++) { await N('N.tick(0.3)'); await N('N.enter()'); await N('N.tick(0.15)'); await N('N.enter()'); }
    // el gesto del final y la salida
    ok(await N('N.hasta(() => N.dir().fase() === "saliendo" || !N.dir().activa(), 40)'), 'la escena llega a su fin');
    await foto('8-salida');
    ok(await N('N.hasta(() => !N.dir().activa(), 8)'), 'y termina');
    ok(!(await N('document.body.classList.contains("escena-en-curso")')), 'las barras se van');
    const ema1 = await N('(() => { const e = N.ema(); return { conVos: !!e.conVos, enCita: !!e.enCita, cam: Array.isArray(e.camino) ? e.camino.length : -1 } })()');
    ok(!ema1.conVos && !ema1.enCita, 'Josefina quedó libre (sigue con lo suyo)');
    await N('N.tick(1.5)');
    const cam1 = await N('N.camara()');
    ok((await N('N.distOjos()')) < 0.25, `la cámara volvió a los ojos del jugador (a ${(await N('N.distOjos()')).toFixed(2)} m)`);
    ok(Math.abs(cam1.fov - (await N('H.ajustes.fov'))) < 3, `con el campo de visión de siempre (${cam1.fov.toFixed(1)})`);
    ok(!(await N('N.dir().vista("demo-llegada-josefina")')), 'la demo no queda vista (es efímera)');
    ok(!(await N('N.dir().hay("demo-llegada-josefina") && Object.keys(P.historia.escenas.vistas).length > 0')), 'y no deja rastro en la partida');
    ok((await N('N.programas()')) === prog0, `la escena no compiló ningún programa de shader (${prog0} → ${await N('N.programas()')})`);

    // ================================================================ 5. saltar con Esc (dos veces)
    donde = 'saltar';
    await N('N.afuera()'); await N('N.tick(1)');
    ok((await N('N.disparar()')) === 1, 'se vuelve a poder disparar la demo');
    await N('N.tick(3.5)');
    await N('N.tecla("Escape")');
    await N('N.tick(0.2)');
    ok(/visible/.test((await N('document.getElementById("escena-aviso").className'))) && (await N('N.dir().corriendo()')), 'un Esc pide confirmar («Apretá Esc otra vez»)');
    await foto('9-confirmar-saltar');
    await N('N.tecla("Escape")');
    await N('N.tick(0.2)');
    ok((await N('N.dir().fase()')) === 'saliendo' || !(await N('N.dir().activa()')), 'el segundo Esc salta la escena');
    const ema2 = await N('(() => { const e = N.ema(), j = H.jugador.estado; return { d: Math.hypot(e.pos.x - j.pos.x, e.pos.z - j.pos.z), conVos: !!e.conVos } })()');
    ok(ema2.d > 8 && ema2.d < 30, `al saltar, Josefina quedó en su lugar final (a ${ema2.d.toFixed(1)} m)`);
    // la cámara vuelve sin saltos: se mira cada cuadro
    let maxSalto = 0, ult = await N('N.camara()'), cuadros = 0;
    for (let i = 0; i < 90 && (await N('N.dir().activa()')); i++) {
      await N('H.__bucle()');
      const c = await N('N.camara()');
      maxSalto = Math.max(maxSalto, Math.hypot(c.x - ult.x, c.y - ult.y, c.z - ult.z)); ult = c; cuadros++;
      await esperar(16);
    }
    ok(maxSalto < 6, `la cámara vuelve en ${cuadros} cuadros sin un salto grande (máx. ${maxSalto.toFixed(2)} m por cuadro)`);
    await N('N.tick(1.2)');
    ok(!(await N('N.dir().activa()')) && !(await N('N.ema().conVos')), 'termina y Josefina queda libre');
    ok((await N('N.distOjos()')) < 0.25, 'la cámara quedó en los ojos del jugador');
    ok((await N('N.programas()')) === prog0, 'y todavía 0 programas de shader nuevos');

    // ================================================================ 6. guardado y recarga
    donde = 'guardado';
    // dos escenas de prueba, no efímeras: una se termina, otra queda a medias
    await N(`(() => {
      const e = N.es();
      const base = (id, texto) => ({ id, pasos: [{ tipo: 'plano', plano: 'medio', a: 'jugador', dur: 1 }, { tipo: 'dialogo', quien: 'jugador', lineas: [texto, 'Segunda.'] }, { tipo: 'efecto', nombre: 'marca-' + id, args: {} }] });
      window.__marcas = [];
      e.registrarEfecto('marca-terminada', () => window.__marcas.push('terminada'));
      e.registrarEfecto('marca-pendiente', () => window.__marcas.push('pendiente'));
      return e.registrar(base('terminada', 'Esta termina.')).ok && e.registrar(base('pendiente', 'Esta queda a medias.')).ok;
    })()`);
    await N('N.afuera()'); await N('N.tick(0.5)');
    ok(await N('N.es().disparar("terminada")'), 'se dispara una escena de prueba');
    await N('N.tick(1.5)'); await N('N.dir().saltar()'); await N('N.tick(1.6)');
    ok(await N('N.dir().vista("terminada") && P.historia.escenas.vistas.terminada >= 1'), 'al saltarla queda vista en progreso.historia.escenas');
    ok((await N('window.__marcas.join()')) === 'terminada', 'con su efecto aplicado');
    ok((await N('H.guardar()')) === true, 'terminada la escena, guardar vuelve a andar');
    ok(!(await N('N.es().disparar("terminada")')), 'una escena vista no se dispara de nuevo');
    ok(await N('N.es().disparar("pendiente")'), 'la otra arranca…');
    await N('N.tick(2)');
    ok(!(await N('N.dir().vista("pendiente")')), '…y a mitad no está vista');
    ok((await N('H.guardar()')) === false, 'guardar a mitad: no escribe');
    await abrir('historia', false);
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(PAGINA);
    await N('N.tick(2)');
    ok(!(await N('N.dir().activa()')) && !(await N('document.body.classList.contains("escena-en-curso")')), 'al recargar no queda ninguna escena en marcha');
    ok((await N('Object.keys(P.historia.escenas.vistas).join()')) === 'terminada', `recargada, sólo la terminada está vista (${await N('Object.keys(P.historia.escenas.vistas).join()')})`);
    await N(`(() => { const e = N.es(); e.registrarEfecto('marca-pendiente', () => 1); e.registrar({ id: 'pendiente', pasos: [{ tipo: 'espera', dur: 0.5 }] }); return 1; })()`);
    await N('N.afuera()'); await N('N.tick(0.5)');
    ok(await N('N.es().disparar("pendiente")'), 'y la pendiente se puede volver a disparar');
    await N('N.tick(3)');

    // ================================================================ 7. la mirada dirigida corta
    donde = 'mirada';
    await N('N.afuera()'); await N('N.tick(0.5)');
    const yaw0 = await N('H.jugador.estado.yaw');
    ok(await N('N.es().mirarA({ frente: "jugador", dist: 10, lado: 15 }, 2.4)'), 'la mirada dirigida arranca');
    await N('N.tick(1.2)');
    const yawM = await N('H.jugador.estado.yaw');
    ok(Math.abs(yawM - yaw0) > 0.3, `la cámara gira sola hacia el punto (${(yawM - yaw0).toFixed(2)} rad)`);
    await N('N.tick(1.6)');
    ok(Math.abs((await N('H.jugador.estado.yaw')) - yaw0) < 0.02 && !(await N('N.es().mirando()')), 'y vuelve a donde miraba');
  } catch (err) {
    console.log('ERROR:', err && err.stack || err);
    errores.push(String(err && err.message || err));
  }
  if (consola.length) console.log('consola:', consola.slice(0, 6));
  console.log(errores.length ? `\n${errores.length} problemas` : '\nTodo en orden');
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(errores.length ? 1 : 0); }
});

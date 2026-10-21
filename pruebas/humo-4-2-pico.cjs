// 4.2 · EL PICO, en una partida de verdad (Electron + WebGL), con capturas.
//   1. con el hacha y sin pico, H frente a una roca no da piedra y avisa dónde conseguir el pico (el cartel también lo dice);
//   2. las tres vías: trueque en el almacén, compra en el almacén (con plata) y la forja del herrero de la aldea;
//   3. con pico se pica A GOLPES (oficio de picapedrero: 6, 5, 4, 3 y 2 golpes por nivel; el filo del herrero, uno menos; las chicas, el 60 %): se ve el contador,
//      sube el picapedrero (y no el hachero) y avisa al subir de nivel; el hacha sigue talando y sube al hachero;
//   4. mochila y barra: el hacha y el pico, cada uno con lo suyo, y el pico en la mano;
//   5. una partida de antes (con hacha y sin pico) recibe su pico una sola vez, con el aviso.
// Uso (después de `node armar.mjs`), siempre en el monitor externo y con perfil propio:
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-2-pico.cjs     (las capturas, en HOJ_SALIDA o salida-cantina\pico)
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = process.env.HOJ_SALIDA || 'C:/Users/Andres/Documents/Hojarasca/salida-cantina/pico';
dialog.showErrorBox = () => {};
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); salir(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa): ${e && e.stack ? e.stack : e}`); salir(1); });
fs.mkdirSync(salida, { recursive: true });
app.setPath('userData', path.join(salida, '_perfil'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 10 minutos'); salir(2); }, 10 * 60 * 1000).unref?.();

app.on('window-all-closed', () => {});   // (al cambiar de ventana para la partida de antes no se cierra el programa)
app.whenReady().then(async () => {
  const errores = [];
  let w = null;
  const nuevaVentana = () => {
    w = new BrowserWindow({ show: true, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
    w.webContents.on('console-message', (e) => {
      const m = String(e.message);
      if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 400));
    });
    w.focus();
  };
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error('la página no respondió en 90 s')), 90000))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push('FALLÓ: ' + texto); };
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const listo = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) return true; } return false; };
  const AYUDA = `window.H = window.__hojarasca;
    window.cuadros = async (n = 4) => { for (let i = 0; i < n; i++) { H.__bucle(); await new Promise((r) => setTimeout(r, 5)); } };
    window.tecla = async (code, n = 4) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true })); await cuadros(n); document.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true })); await cuadros(1); };
    window.ir = (x, z) => { const j = H.jugador.estado; j.pos.set(x, H.T.altura(x, z) + 1.6, z); j.vel.set(0, 0, 0); j.vy = 0; };
    window.notas = () => document.getElementById('notas')?.innerText || '';
    1`;
  // si la ventana perdió el foco y el juego quedó en pausa, se lo devuelve al juego (con la pausa abierta las teclas no hacen nada)
  const juego = () => js(`(() => { const p = document.getElementById('pausa'); if (p && !p.classList.contains('oculto')) H.volverAlJuego(true); return 1 })()`);
  const cuadros = (n = 4) => js(`cuadros(${n}).then(() => 1)`);
  const tecla = (code, n = 4) => js(`tecla('${code}', ${n}).then(() => 1)`);
  const entrar = async () => {
    ok(await listo(), 'carga el Relax');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
    await js(AYUDA);
  };
  const ajustes = `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false}));`;
  const foto = async (nombre) => {
    await esperar(150);
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
    console.log(`  (captura ${nombre}.png)`);
  };
  // una roca: la más cercana al refugio que no sea decorativa (o que lo sea), y el jugador parado a 1,6 m, mirándola
  const aRoca = (decorativa, tam = null) => js(`(async () => {
    const r = H.T.lugares.refugio, vivas = H.veg.matas.filter((m) => m.tipo === 'roca' && !m.sacado && !!m.decorativo === ${!!decorativa} && ${tam === 'grande' ? '(m.esc ?? 1) >= 0.8' : tam === 'chica' ? '(m.esc ?? 1) < 0.8' : 'true'} && Math.hypot(m.x - r.x, m.z - r.z) < 260);
    vivas.sort((a, b) => Math.hypot(a.x - r.x, a.z - r.z) - Math.hypot(b.x - r.x, b.z - r.z));
    const m = vivas[0]; if (!m) return null;
    const j = H.jugador.estado, ang = 0.6, px = m.x + Math.sin(ang) * 1.6, pz = m.z + Math.cos(ang) * 1.6;
    ir(px, pz); j.yaw = Math.atan2(-(m.x - px), -(m.z - pz)); j.pitch = -0.35;
    await cuadros(10);
    return { x: m.x, z: m.z, d: Math.hypot(m.x - j.pos.x, m.z - j.pos.z) } })()`);
  const rocaViva = (r) => js(`(() => { const m = H.veg.matas.find((q) => q.tipo === 'roca' && Math.abs(q.x - ${r.x}) < 1e-6 && Math.abs(q.z - ${r.z}) < 1e-6); return !!m && !m.sacado })()`);
  const estado = () => js(`({ piedra: H.progreso.materiales?.piedra || 0, pico: H.progreso.cosas.pico || 0, hacha: H.progreso.cosas.hacha || 0, pesos: H.progreso.economia?.pesos ?? null, canto: H.progreso.entradas?.canto?.cantidad || 0, ramitas: H.progreso.ramitas || 0, xp: JSON.stringify(H.progreso.oficios || {}) })`);

  try {
    nuevaVentana();
    await abrir();
    await js(`localStorage.clear(); ${ajustes} 1`);
    await abrir();
    await entrar();

    // ---- 1. con el hacha y sin pico, no se pica
    await js(`(() => { const P = H.progreso; P.cosas = { hacha: 1 }; P.economia = { ...P.economia, pesos: 0 }; P.horas = 11; 1 })()`);
    const r1 = await aRoca(false);
    ok(r1 && r1.d < 3.2, `hay una roca a mano para probar (${JSON.stringify(r1)})`);
    const antes = await estado();
    await js(`H.usarHacha(); 1`);
    await cuadros(2);
    let txt = await js('notas()');
    const despues = await estado();
    ok(despues.piedra === antes.piedra && await rocaViva(r1), 'con el hacha sola, la roca sigue ahí y no suma piedra');
    ok(/Te falta el pico/.test(txt) && /herrero/.test(txt) && /almacén/.test(txt), `el aviso dice que falta el pico y dónde conseguirlo (${txt.replace(/\n/g, ' | ').slice(0, 220)})`);
    await js(`H.usarHacha(); 1`); await cuadros(1);
    ok((await estado()).piedra === antes.piedra, 'y apretar de nuevo tampoco da piedra');
    ok(/hace falta el pico/.test(await js('H.__textoHacha()')), `el cartel de la H frente a la roca dice que hace falta el pico (${await js('H.__textoHacha()')})`);
    await cuadros(20);
    await foto('1-sin-pico-aviso');

    // ---- 2a. el trueque del almacén: 3 cantos y 12 ramitas
    await js(`(() => { const P = H.progreso; P.entradas.canto = { dia: 1, hora: 9, cantidad: 2 }; P.ramitas = 20; 1 })()`);
    // parado frente al mostrador del almacén de la aldea (si no, el juego lo cierra apenas te alejás)
    const mostr = await js(`(async () => { const E = H.__aldea.edificio('almacen'); const j = H.jugador.estado;
      if (!E) return null; const a = H.est.almacen; ir(E.x, E.z); for (let i = 0; i < 4; i++) { H.__aldeaMundo().actualizar(4, H.camara.position); await H.__aldeaMundo().listo(); H.__aldeaMundo().montarCola(); await cuadros(6); }
      const m = H.est.almacen?.mostrador; if (!m) return { sinMostrador: true };
      const px = m.x + 0.6, pz = m.z + 0.4; ir(px, pz); j.yaw = Math.atan2(-(m.x - px), -(m.z - pz)); await cuadros(6); return { m, d: Math.hypot(j.pos.x - m.x, j.pos.z - m.z) } })()`);
    console.log('  (mostrador: ' + JSON.stringify(mostr) + ')');
    await js(`H.__abrirAlmacen(); 1`); await cuadros(2);
    // las dos ofertas del pico están en la tercera página (Tab, Tab): así se ve el almacén antes de cambiar nada
    await juego();
    if (!(await js(`H.__abierto().enElAlmacen`))) { await js(`H.__abrirAlmacen(); 1`); await cuadros(2); }
    await tecla('Tab'); await tecla('Tab'); await cuadros(3);
    await foto('2a-almacen-antes');
    await js(`H.__cambiar(18); 1`); await cuadros(1);   // el pico por trueque
    let e = await estado();
    ok(e.pico === 0 && e.canto === 2 && e.ramitas === 20, 'con 2 cantos de 3, no se cambia y no se gasta nada');
    ok(/Todavía te falta/.test(await js('notas()')), 'y dice que todavía falta');
    await js(`H.progreso.entradas.canto.cantidad = 3; 1`);
    await js(`H.__cambiar(18); 1`); await cuadros(1);
    e = await estado();
    ok(e.pico === 1 && e.canto === 0 && e.ramitas === 8, `con 3 cantos y 12 ramitas: el pico por trueque (cantos ${e.canto}, ramitas ${e.ramitas})`);
    await js(`H.__cambiar(18); 1`); await cuadros(1);
    ok(/ya lo tenés/i.test(await js('notas()')) && (await estado()).pico === 1, 'una segunda vez: «ya lo tenés»');
    await cuadros(3);
    await foto('2b-almacen-con-el-pico');
    const lista = await js(`document.getElementById('trueque-lista').innerText`);
    ok(/Pico\b/.test(lista) && /ya lo tenés/.test(lista), `la lista del almacén muestra el pico (${lista.replace(/\n/g, ' | ').slice(0, 200)})`);

    // ---- 2b. la compra con plata
    await js(`(() => { const P = H.progreso; delete P.cosas.pico; P.economia.pesos = 1199; 1 })()`);
    await js(`H.__cambiar(19); 1`); await cuadros(1);
    e = await estado();
    ok(e.pico === 0 && e.pesos === 1199, 'con $1.199 no se compra el pico (y no se cobra nada)');
    await js(`H.progreso.economia.pesos = 1250; 1`);
    await js(`H.__cambiar(19); 1`); await cuadros(1);
    e = await estado();
    ok(e.pico === 1 && e.pesos === 50, `con $1.250 se compra: pico y quedan $50 (pesos ${e.pesos})`);
    const libro = await js(`H.progreso.economia.libro.at(-1)`);
    ok(libro && libro.monto === -1200 && /Pico/.test(libro.motivo), `el libro lo anota (${JSON.stringify(libro)})`);
    await js(`H.__cerrarAlmacen(); 1`); await cuadros(2);

    // ---- 2c. el herrero de la aldea lo forja
    await js(`(() => { const P = H.progreso, A = P.aldea; delete P.cosas.pico; P.cosas.tijera = 1;
      A.pobladores = [{ clave: 'herrero', dia: 1 }]; A.locales = { herreria: 1 }; P.entradas.canto = { dia: 1, hora: 9, cantidad: 3 }; P.economia.pesos = 450; 1 })()`);
    const charla = await js(`(() => { const c = H.__aldea.mundo().charla({ claveAldea: 'herrero' }); if (!c) return null; const r = { partes: c.partes, ofrece: !!c.alTerminar }; window.__charlaHerrero = c; return r })()`);
    ok(charla && charla.ofrece && /pico/i.test(charla.partes.join(' ')), `el herrero ofrece forjar el pico (${charla && charla.partes.join(' / ').slice(0, 160)})`);
    await js(`window.__charlaHerrero.alTerminar(); 1`); await cuadros(2);
    e = await estado();
    ok(e.pico === 1 && e.canto === 0 && e.pesos === 150, `forjado: pico, sin cantos y $150 de vuelto (pico ${e.pico}, cantos ${e.canto}, pesos ${e.pesos})`);
    ok(/Pico forjado/.test(await js(`H.progreso.economia.libro.at(-1).motivo`)), 'el libro anota «Pico forjado»');
    await js(`window.__charlaHerrero = null; 1`);

    // ---- 3. con pico se pica A GOLPES (oficio de picapedrero): nivel bajo, el máximo; el contador se ve; sube el oficio (y no el de hachero)
    const xps = () => js(`({ h: H.progreso.oficios.xp.hachero || 0, p: H.progreso.oficios.xp.picapedrero || 0, nivelP: H.__aldea.oficios().nivel('picapedrero') })`);
    // pica la roca `r` hasta que desaparece (máximo 12 golpes) y dice cuántos hicieron falta
    const picar = async (r) => { let n = 0; while (n < 12 && await rocaViva(r)) { await js(`H.usarHacha(); 1`); await cuadros(1); n++; } return n; };
    await js(`(() => { const P = H.progreso; P.cosas = { hacha: 1, pico: 1 }; P.materiales = {}; P.oficios.xp = { hachero: 100, picapedrero: 33 }; P.aldea.afilado = 0; 1 })()`);
    const r2 = await aRoca(false, 'grande');
    ok(r2 && r2.d < 3.2, `una roca grande para picar (${JSON.stringify(r2)})`);
    ok((await js('H.__textoHacha()')) === 'Picar piedra', 'con el pico el cartel dice «Picar piedra»');
    let x0 = await xps();
    await js(`H.usarHacha(); 1`); await cuadros(2);
    e = await estado();
    ok(e.piedra === 0 && await rocaViva(r2), 'un solo golpe no la parte: no da piedra y la roca sigue');
    ok((await js('H.__textoHacha()')) === 'Picar piedra (1/6)', `con nivel bajo una roca grande pide 6 golpes y el cartel cuenta: ${await js('H.__textoHacha()')}`);
    ok(/Golpe 1 de 6/.test(await js('notas()')), 'y el aviso dice «Golpe 1 de 6»');
    for (let i = 0; i < 2; i++) { await js(`H.usarHacha(); 1`); await cuadros(1); }
    ok((await js('H.__textoHacha()')) === 'Picar piedra (3/6)', 'a los tres golpes: «Picar piedra (3/6)»');
    await cuadros(3);
    await foto('3a-picando-3-de-6');
    for (let i = 0; i < 2; i++) { await js(`H.usarHacha(); 1`); await cuadros(1); }
    let x1 = await xps();
    ok(x1.p === x0.p + 5 && x1.h === x0.h, `cada golpe suma un poco al picapedrero (33 → ${x1.p}) y nada al hachero (${x1.h})`);
    ok((await estado()).piedra === 0 && await rocaViva(r2), 'a los cinco golpes todavía no está');
    await js(`H.usarHacha(); 1`); await cuadros(2);
    e = await estado();
    ok(e.piedra === 4 && !(await rocaViva(r2)), `al sexto golpe se parte: 4 piedras y la roca desaparece (${e.piedra})`);
    x1 = await xps();
    ok(x1.p === 42 && x1.h === 100, `terminar la roca suma 4 más al picapedrero (${x1.p}) y el hachero queda igual (${x1.h})`);
    ok(x1.nivelP === 1, 'y con eso es aprendiz de picapedrero (nivel 1)');
    const avisos = await js(`H.__avisos().slice(-5).join(' | ')`);
    ok(/Aprendiz de picapedrero/.test(avisos) && /\+\d+ piedra/i.test(avisos), `aviso de subida de nivel y de las piedras (${avisos.slice(0, 160)})`);
    await cuadros(3);
    await foto('3b-subida-de-nivel');
    // el oficio en la pantalla de oficios del cuaderno
    await juego(); await tecla('KeyJ'); await cuadros(3);
    await js(`H.__aldea.oficios().elegir('picapedrero'); H.__aldea.cuaderno('oficios'); 1`); await cuadros(3);
    const ficha = await js(`document.body.innerText`);
    ok(/Aprendiz de picapedrero/.test(ficha) && /pico/i.test(ficha) && /6 golpes/.test(ficha) && /Hachero|hachero/.test(ficha), 'la pantalla de oficios muestra al picapedrero con su título y sus habilidades (y el hachero)');
    await foto('3c-oficio-picapedrero');
    await tecla('KeyJ'); await cuadros(3);
    await juego();
    // los golpes por nivel (rocas grandes): nivel 0 → 6, nivel 2 → 5, nivel 5 → 2
    const probar = async (xp, tam, deco = false) => {
      await js(`(() => { const P = H.progreso; P.materiales = {}; P.oficios.xp = { hachero: 100, picapedrero: ${xp} }; 1 })()`);
      const r = await aRoca(deco, tam);
      if (!r) return null;
      return picar(r);
    };
    ok(await probar(0, 'grande') === 6, 'sin oficio, una roca grande: 6 golpes');
    ok(await probar(120, 'grande') === 5, 'nivel 2 (picapedrero): 5 golpes');
    ok(await probar(260, 'grande') === 4, 'nivel 3: 4 golpes');
    ok(await probar(480, 'grande') === 3, 'nivel 4: 3 golpes');
    ok(await probar(800, 'grande') === 2, 'nivel 5 (maestro): 2 golpes');
    ok(await probar(0, 'chica') === 4, 'una roca chica sin oficio: 4 golpes (el 60 %)');
    ok(await probar(800, 'chica') === 1, 'una roca chica con el maestro: 1 golpe');
    // el nivel 4 rinde una piedra más
    await js(`(() => { H.progreso.materiales = {}; H.progreso.oficios.xp = { picapedrero: 480 }; 1 })()`);
    const rExtra = await aRoca(false, 'grande'); await picar(rExtra);
    ok((await estado()).piedra === 5, `con nivel 4 la roca rinde 5 piedras (${(await estado()).piedra})`);
    // el filo del herrero: un golpe menos (nivel 2: 5 → 4) y se gasta al terminar cada roca
    await js(`(() => { H.progreso.oficios.xp = { picapedrero: 120 }; H.progreso.aldea.afilado = 2; 1 })()`);
    const rFilo = await aRoca(false, 'grande');
    ok(await picar(rFilo) === 4 && (await js('H.progreso.aldea.afilado')) === 1, 'con el filo del herrero, un golpe menos (4 en vez de 5) y el filo baja de a uno por roca');
    // una roca decorativa también se pica con el pico (con el maestro, en dos golpes), y por el avance que se recuerda se puede dejar y volver
    await js(`(() => { H.progreso.oficios.xp = { picapedrero: 120 }; H.progreso.aldea.afilado = 0; H.progreso.materiales = {}; 1 })()`);
    const r3 = await aRoca(true, 'grande');
    if (r3) {
      await js(`H.usarHacha(); 1`); await cuadros(1); await js(`H.usarHacha(); 1`); await cuadros(1);
      await aRoca(false, 'grande');   // se va a otra roca
      await js(`H.progreso.materiales = {}; 1`);
      const vuelta = await js(`(async () => { const m = H.veg.matas.find((q) => q.tipo === 'roca' && q.decorativo && Math.abs(q.x - ${r3.x}) < 1e-6 && Math.abs(q.z - ${r3.z}) < 1e-6); const j = H.jugador.estado, px = m.x + Math.sin(0.6) * 1.6, pz = m.z + Math.cos(0.6) * 1.6; ir(px, pz); j.yaw = Math.atan2(-(m.x - px), -(m.z - pz)); j.pitch = -0.35; await cuadros(8); return H.__textoHacha() })()`);
      ok(vuelta === 'Picar piedra (2/5)', `se deja una roca a medias, se vuelve y el avance sigue (${vuelta})`);
      await js(`H.usarHacha(); 1`); await cuadros(1); await js(`H.usarHacha(); 1`); await cuadros(1); await js(`H.usarHacha(); 1`); await cuadros(2);
      ok(!(await rocaViva(r3)), 'una roca decorativa también se pica con el pico (decisión: se sigue pudiendo)');
    } else console.log('  (no hay roca decorativa grande cerca para probar)');
    await js(`(() => { H.progreso.oficios.xp = { hachero: 100, picapedrero: 33 }; 1 })()`);
    // el hacha sigue talando: con el pico en la mochila, un árbol cae a los hachazos
    const xT0 = await xps();
    const arbol = await js(`(async () => { const j = H.jugador.estado, r = H.T.lugares.refugio;
      const a = H.veg.arboles.find((q) => !q.sacado && !q.caido && q.especie !== 'pehuen' && Math.hypot(q.x - r.x, q.z - r.z) < 120);
      if (!a) return null; ir(a.x + 1.9 + (a.r || 0.4), a.z); j.yaw = Math.atan2(-(a.x - j.pos.x), -(a.z - j.pos.z)); await cuadros(8);
      const t0 = H.progreso.materiales.tronco || 0; for (let i = 0; i < 6; i++) { H.usarHacha(); await cuadros(1); }
      return { t0, t1: H.progreso.materiales.tronco || 0 } })()`);
    ok(arbol && arbol.t1 > arbol.t0, `el hacha sigue talando árboles (${JSON.stringify(arbol)})`);
    const xT1 = await xps();
    ok(xT1.h > xT0.h && xT1.p === xT0.p, `talar sube al hachero (${xT0.h} → ${xT1.h}) y no toca al picapedrero (${xT1.p})`);

    // ---- 4. mochila y barra
    await js(`(() => { const P = H.progreso; P.materiales = { tronco: 3, piedra: 8 }; P.cosas = { hacha: 1, pico: 1 }; 1 })()`);
    await js(`H.jugador.estado.yaw = 0; 1`);
    await js(`H.__refrescarBarra(); 1`); await cuadros(2);
    await juego(); await tecla('KeyI'); await cuadros(4);
    const moch = await js(`document.getElementById('mochila').innerText`);
    ok(/Hacha de mano/.test(moch) && /Pico\b/.test(moch), `la mochila muestra el hacha y el pico (${moch.replace(/\n/g, ' | ').slice(0, 160)})`);
    await foto('4-mochila');
    await tecla('KeyI'); await cuadros(3);
    // el pico en la mano: se elige con los números hasta que sea el que está en la barra
    let nombre = '';
    await juego();
    for (const d of ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8']) {
      await tecla(d, 3); nombre = await js('H.__ranuraActual()'); if (/Pico/.test(nombre)) break;
    }
    ok(/^Pico$/.test(nombre), `el pico se puede elegir en la barra (${nombre})`);
    await js(`H.jugador.estado.pitch = 0; 1`);
    await cuadros(30);
    await foto('5-pico-en-mano');
    await js(`document.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true })); 1`); await cuadros(6);
    await foto('5b-pico-en-mano-golpe');
    await js(`document.dispatchEvent(new MouseEvent('mouseup', { button: 0, bubbles: true })); 1`);

    // ---- 5. una partida de antes: con hacha, sin pico y sin la marca
    await js(`(() => { const P = H.progreso; P.cosas = { hacha: 1, pico: 1 }; H.guardar(); 1 })()`);
    await esperar(300);
    // se lee lo guardado, se la vuelve «de antes» (hacha, sin pico, sin la marca) y se cierra la ventana (sin pasar por el «beforeunload», que
    // volvería a guardar la partida de ahora). Lo guardado se reescribe desde otra ventana con una página cualquiera, antes de abrir el juego
    // (todas las páginas de archivo comparten el almacenamiento)
    const crudo = await js(`localStorage.getItem('hojarasca-v1')`);
    const vieja = JSON.parse(crudo); vieja.cosas = { hacha: 1 }; delete vieja.picoEntregado; delete vieja.picoAviso;
    w.destroy();
    await esperar(800);
    nuevaVentana();
    await w.loadFile(path.join(raiz, 'package.json'));
    await js(`localStorage.setItem('hojarasca-v1', ${JSON.stringify(JSON.stringify(vieja))}); localStorage.removeItem('hojarasca-v1-backup'); 1`);
    await abrir();
    ok(await listo(), 'vuelve a cargar con la partida de antes');
    await js(AYUDA);
    const cargada = await js(`({ pico: H.progreso.cosas.pico || 0, hacha: H.progreso.cosas.hacha || 0, marca: H.progreso.picoEntregado, aviso: !!H.progreso.picoAviso })`);
    ok(cargada.hacha === 1 && cargada.pico === 1 && cargada.marca === true && cargada.aviso, `al cargar la partida de antes, recibe el pico (${JSON.stringify(cargada)})`);
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(4300);
    await js(AYUDA);
    txt = await js('notas()');
    await foto('6-partida-vieja-aviso');
    ok(/Ahora para picar piedra hace falta el pico/.test(txt), `el aviso de la partida de antes (${txt.replace(/\n/g, ' | ').slice(0, 200)})`);
    ok(!(await js('!!H.progreso.picoAviso')), 'y el aviso se apaga para no repetirse');
    // recargar de nuevo: nada más
    await js(`H.guardar(); 1`); await esperar(300);
    const guardada = await js(`JSON.parse(localStorage.getItem('hojarasca-v1'))`);
    ok(guardada.cosas.pico === 1 && guardada.picoEntregado === true && !guardada.picoAviso, 'lo guardado ya tiene el pico, la marca y no tiene aviso pendiente');
  } catch (err) {
    errores.push('EXCEPCIÓN: ' + (err && err.stack ? err.stack : err));
  }
  console.log(errores.length ? `\nFALLÓ (${errores.length}):\n- ${errores.join('\n- ')}` : '\nOK 4.2 el pico, en el juego');
  try { w && !w.isDestroyed() && w.destroy(); } catch {}
  salir(errores.length ? 1 : 0);
});

// 4.11.1 · INTERFAZ Y RANURAS, en una partida de verdad (Electron + WebGL).
//   1. los pies de la carta, el banco y el local con la tecla de interactuar cambiada en Controles (y al volver a la de fábrica);
//   2. el foco del teclado en la mochila (casilla y lista) y en las pestañas del cuaderno después de redibujar;
//   3. la semilla del cantero: el cartel, Tab, la rueda, Mayús+Tab, sembrar la elegida, guardar y volver a abrir;
//   4. recetas y ropa a una ranura vacía («Empezar acá») y sin pisar una ranura con partida;
//   5. el Desafío: el tablero de trofeos es un panel que se queda, se cierra con E o Escape y con alejarse, y bloquea la I.
// Uso (después de `node armar.mjs`), siempre en el monitor externo y con perfil propio:
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-11-1-interfaz.cjs -Espera 900 [-Visible]
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = process.env.HOJ_SALIDA || 'C:/Users/Andres/AppData/Local/Temp/hx/salida4111a';
dialog.showErrorBox = () => {};
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); salir(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa): ${e && e.stack ? e.stack : e}`); salir(1); });
fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 14 minutos'); salir(2); }, 14 * 60 * 1000).unref?.();

app.on('window-all-closed', () => {});
app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: true, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { errores.push(m.slice(0, 400)); console.log('[página]', m.slice(0, 300)); }
  });
  w.focus();
  let donde = '';
  const js = (c, limite = 90000) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en ${limite / 1000} s (${donde})`)), limite))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push('FALLÓ: ' + texto); };
  const url = path.join(raiz, 'index.html');
  const H = 'window.__hojarasca';
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const listo = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) return true; } return false; };
  const ajustes = (modo, extra = {}) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({calidad:'media', clima:'despejado', musica:false, modo:'${modo}', autoCalidad:false, guiaPrimerDia:false, estacion:'auto'}, ${JSON.stringify(extra)})));`;
  const AYUDA = `window.H = window.__hojarasca;
    window.cuadros = async (n = 4) => { for (let i = 0; i < n; i++) { H.__bucle(); await new Promise((r) => setTimeout(r, 5)); } };
    window.ir = (x, z, hx = x, hz = z - 1) => { const j = H.jugador.estado; j.pos.set(x, H.T.altura(x, z) + 1.6, z); j.vel.set(0, 0, 0); j.vy = 0; j.yaw = Math.atan2(-(hx - x), -(hz - z)); j.pitch = -0.2; };
    window.tecla = (code, extra = {}) => { document.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ code, bubbles: true, cancelable: true }, extra))); document.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true })); };
    1`;
  const entrar = async () => {
    ok(await listo(), 'carga el juego');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
    await js(AYUDA);
    await js(`${H}.ajustes.limiteFps = 'libre'; (() => { const p = document.getElementById('pausa'); if (p && !p.classList.contains('oculto')) H.volverAlJuego(true); return 1 })()`);
  };
  const foto = async (nombre) => {
    await esperar(300);
    let img = null;
    for (let k = 0; k < 3 && !img; k++) { try { img = await w.webContents.capturePage(); } catch { await esperar(800); } }
    if (img && !img.isEmpty()) { fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG()); console.log(`  (captura ${nombre}.png)`); }
  };
  const texto = (id) => js(`document.getElementById('${id}')?.textContent ?? null`);
  const aviso = () => js(`(() => { const a = ${H}.__avisoYa(); return a ? a.texto : '' })()`);

  try {
    // ================================================================ 1. los pies con la tecla cambiada (Controles, en la portada)
    donde = 'pies';
    await abrir();
    await js(`localStorage.clear(); ${ajustes('relax')} 1`);
    await abrir();
    ok(await listo(), 'el Relax carga');
    await js(AYUDA);
    ok((await texto('pie-banco')) === 'E o Escape para salir del mostrador', `de fábrica: el pie del banco es el de siempre («${await texto('pie-banco')}»)`);
    ok((await texto('pie-carta')) === 'E o Escape para cerrar la carta', 'de fábrica: el de la carta es el de siempre');
    ok((await texto('pie-local')) === 'E o Escape para cerrar el panel · los clientes se atienden con E', 'de fábrica: el del local es el de siempre');
    await js(`document.getElementById('btn-teclas-inicio').click(); 1`);
    const fila = await js(`[...document.querySelectorAll('#teclas-lista .fila-tecla')].findIndex((f) => /Juntar, anotar y hablar/.test(f.textContent))`);
    ok(fila >= 0, 'Controles lista «Juntar, anotar y hablar»');
    await js(`document.querySelectorAll('#teclas-lista .fila-tecla button')[${fila}].click(); 1`);
    await js(`tecla('KeyU'); 1`);
    ok((await js(`${H}.__teclasPropias().interactuar`)) === 'KeyU', 'la tecla de interactuar quedó en la U');
    ok((await texto('pie-banco')) === 'U o Escape para salir del mostrador', `el pie del banco dice la U («${await texto('pie-banco')}»)`);
    ok((await texto('pie-carta')) === 'U o Escape para cerrar la carta', `el de la carta, también («${await texto('pie-carta')}»)`);
    ok((await texto('pie-local')) === 'U o Escape para cerrar el panel · los clientes se atienden con U', `el del local, con sus dos teclas («${await texto('pie-local')}»)`);
    // se mira cada panel de verdad (se muestra el que está armado en la página: es el mismo elemento que abre el juego)
    for (const [panel, nombre] of [['negocio-panel', 'local'], ['cantina-carta', 'carta'], ['banco-pueblo', 'banco']]) {
      await js(`document.getElementById('teclas').classList.add('oculto'); document.getElementById('${panel}').classList.remove('oculto'); 1`);
      await foto(`01-pie-${nombre}-con-la-U`);
      await js(`document.getElementById('${panel}').classList.add('oculto'); 1`);
    }
    await js(`document.getElementById('teclas').classList.remove('oculto'); document.getElementById('teclas-defecto').click(); 1`);
    ok((await texto('pie-banco')) === 'E o Escape para salir del mostrador' && (await texto('pie-local')) === 'E o Escape para cerrar el panel · los clientes se atienden con E', 'al volver a las teclas de fábrica, vuelven los pies de siempre');
    await js(`document.getElementById('cerrar-teclas')?.click(); 1`);

    // ----- la tecla cambiada sobrevive a una recarga (los pies se arman al abrir el juego)
    await js(`${ajustes('relax', { teclas: { interactuar: 'KeyU' } })} 1`);
    await abrir();
    ok(await listo(), 'recarga con la U guardada');
    ok((await texto('pie-carta')) === 'U o Escape para cerrar la carta', `al abrir el juego, la carta ya dice la U («${await texto('pie-carta')}»)`);
    await js(`${ajustes('relax')} 1`);

    // ================================================================ 2. el foco: la mochila y el cuaderno
    donde = 'foco';
    await abrir();
    await entrar();
    await js(`(() => { const P = H.progreso; P.cosas = Object.assign({ hacha: 1, pico: 1, caña: 1, linterna: 1 }, P.cosas); P.entradas.pinon = { dia: 1, hora: 9, cantidad: 4 }; P.entradas.frutilla = { dia: 1, hora: 9, cantidad: 3 }; P.entradas.calafate = { dia: 1, hora: 9, cantidad: 3 }; P.materiales = Object.assign(P.materiales || {}, { tronco: 12, piedra: 7 }); H.__hud.abrirMochila(true); return 1 })()`);
    await esperar(400);
    const cosas = await js(`[...document.querySelectorAll('#mochila-rejilla .cosa[tabindex]')].map((e) => e.dataset.foco)`);
    const casillas = await js(`[...document.querySelectorAll('#mochila-casillas .casilla.elegible')].map((e) => e.dataset.foco)`);
    console.log('  lista:', JSON.stringify(cosas), ' casillas:', JSON.stringify(casillas));
    ok(cosas.length >= 2 && cosas.every(Boolean), `la lista de la mochila tiene cosas enfocables con su clave (${cosas.length})`);
    const iCosa = Math.min(2, cosas.length - 1);
    await js(`document.querySelectorAll('#mochila-rejilla .cosa[tabindex]')[${iCosa}].focus(); 1`);
    await foto('02-mochila-foco-antes');
    await js(`document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true, cancelable: true })); 1`);
    await esperar(300);
    const foco1 = await js(`({ clave: document.activeElement?.dataset?.foco ?? null, enLista: !!document.activeElement?.closest('#mochila-rejilla'), abierta: !document.getElementById('mochila').classList.contains('oculto') })`);
    ok(foco1.abierta && foco1.enLista && foco1.clave === cosas[iCosa], `Enter sobre «${cosas[iCosa]}» redibuja la lista y el foco sigue en esa misma cosa (${JSON.stringify(foco1)})`);
    await foto('03-mochila-foco-despues');
    await js(`document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true, cancelable: true })); 1`);
    await esperar(300);
    ok((await js(`document.activeElement?.dataset?.foco ?? null`)) === cosas[iCosa], 'con Espacio, igual');
    if (casillas.length) {
      const iC = casillas.length - 1;
      await js(`document.querySelectorAll('#mochila-casillas .casilla.elegible')[${iC}].focus(); 1`);
      await js(`document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true, cancelable: true })); 1`);
      await esperar(300);
      const f2 = await js(`({ clave: document.activeElement?.dataset?.foco ?? null, enCasillas: !!document.activeElement?.closest('#mochila-casillas') })`);
      ok(f2.enCasillas && f2.clave === casillas[iC], `en las casillas de arriba, igual (${JSON.stringify(f2)})`);
    }
    // el foco que estaba afuera de la mochila no se roba al abrirla
    await js(`H.__hud.abrirMochila(false); document.body.focus?.(); 1`);
    await js(`H.__hud.abrirMochila(true); 1`);
    ok((await js(`!document.activeElement?.closest('#mochila-rejilla, #mochila-casillas')`)), 'al abrir la mochila por primera vez no se roba el foco');
    await js(`H.__hud.abrirMochila(false); 1`);

    // ----- el cuaderno
    await js(`tecla('KeyJ'); 1`);
    await esperar(500);
    const pest = await js(`[...document.querySelectorAll('#cuaderno-lista .pestanas button')].map((b) => b.textContent)`);
    console.log('  pestañas:', JSON.stringify(pest));
    ok(pest.length >= 4, `el cuaderno tiene sus pestañas (${pest.length})`);
    for (const i of [2, 3, 1]) {
      await js(`document.querySelectorAll('#cuaderno-lista .pestanas button')[${i}].focus(); document.activeElement.click(); 1`);
      await esperar(250);
      const f = await js(`(() => { const b = [...document.querySelectorAll('#cuaderno-lista .pestanas button')]; return { i: b.indexOf(document.activeElement), sel: document.activeElement?.getAttribute('aria-selected') } })()`);
      ok(f.i === i && f.sel === 'true', `activar la pestaña ${i + 1} (${pest[i]}) con el teclado deja el foco en ella, ya elegida (${JSON.stringify(f)})`);
    }
    await foto('04-cuaderno-foco-en-la-pestana');
    await js(`tecla('KeyJ'); 1`);
    await esperar(300);

    // ================================================================ 3. la semilla del cantero
    donde = 'cantero';
    await js(`(() => { const P = H.progreso; for (const k of ['pinon', 'frutilla', 'calafate']) if (P.entradas[k]) P.entradas[k].cantidad = 0; return 1 })()`);   // (las del bloque de la mochila: acá no hay frutos ni semillas)
    const cantero = await js(`(()=>{const js=H.jugador.estado, O=H.obras, P=H.progreso;
      Object.assign(P.materiales,{tronco:40,tabla:40,piedra:40});
      const p=H.PLANOS.find(q=>q.id==='cantero'); if(!p) return {error:'no hay plano cantero'};
      O.elegir(p);
      const x=js.pos.x-Math.sin(js.yaw)*4, z=js.pos.z-Math.cos(js.yaw)*4;
      const r=O.fundar(x,z,js.yaw,js.pos.y); if(!r.ok) return {error:'fundar: '+r.motivo};
      const a=O.avanzar(r.obra,P.materiales); O.elegir(null); P.obras=O.obras.map(o=>o.datos);
      if(!a.ok) return {error:'avanzar: '+a.motivo};
      js.pos.x=x+1.2; js.pos.z=z; return {ok:true, x, z}})()`);
    ok(cantero.ok, `se construye un cantero (${cantero.error || 'ok'})`);
    await esperar(500);
    await js(`cuadros(6).then(() => 1)`);
    // sin semillas
    ok(/faltan semillas/.test(await aviso()), `sin semillas, el cartel lo dice («${await aviso()}»)`);
    // una sola semilla: el cartel de siempre y Tab no hace nada
    await js(`(() => { const P = H.progreso; P.cosas['semillas-habas'] = 3; return 1 })()`);
    ok((await aviso()) === 'Sembrar habas', `con una sola semilla el cartel es el de siempre («${await aviso()}»)`);
    await js(`tecla('Tab'); 1`);
    ok((await js(`H.progreso.semillaElegida ?? null`)) === null, 'con una sola semilla, Tab no elige nada');
    // varias: el cartel dice cuál es y cómo cambiarla
    await js(`(() => { const P = H.progreso; P.cosas['semillas-papa'] = 3; P.entradas.calafate = { dia: 1, hora: 9, cantidad: 5 }; P.entradas.frutilla = { dia: 1, hora: 9, cantidad: 0 }; return 1 })()`);
    ok((await aviso()) === 'Sembrar habas (Tab o rueda: otra semilla)', `con varias, el cartel dice la elegida y cómo cambiarla («${await aviso()}»)`);
    await foto('05-cantero-cartel-habas');
    await js(`tecla('Tab'); 1`);
    ok((await js(`H.progreso.semillaElegida`)) === 'papas' && /^Sembrar papas \(Tab/.test(await aviso()), `Tab pasa a las papas («${await aviso()}»)`);
    ok(/Sembrar papas/.test(await js(`document.getElementById('notas')?.innerText || ''`)), 'y una nota lo confirma');
    await js(`window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 })); 1`);
    ok((await js(`H.progreso.semillaElegida`)) === 'calafates' && /^Sembrar calafates/.test(await aviso()), `la rueda hacia abajo pasa a los calafates («${await aviso()}»)`);
    await foto('06-cantero-cartel-calafates');
    await js(`window.dispatchEvent(new WheelEvent('wheel', { deltaY: -100 })); 1`);
    ok((await js(`H.progreso.semillaElegida`)) === 'papas', 'la rueda hacia arriba vuelve a las papas');
    await js(`tecla('Tab', { shiftKey: true }); 1`);
    ok((await js(`H.progreso.semillaElegida`)) === 'habas', 'Mayús+Tab va hacia atrás');
    await js(`tecla('Tab', { shiftKey: true }); 1`);
    ok((await js(`H.progreso.semillaElegida`)) === 'calafates', 'y da la vuelta (de las habas a los calafates)');
    // se siembra la elegida y se gasta la suya
    const antes = await js(`({ cal: H.progreso.entradas.calafate.cantidad, habas: H.progreso.cosas['semillas-habas'] })`);
    await js(`tecla('KeyE'); 1`);
    await esperar(300);
    const sem = await js(`(() => { const c = H.canteroCerca(); const p = c ? H.huerta()[c.clave] : null; return { cultivo: p?.cultivo ?? null, cal: H.progreso.entradas.calafate.cantidad, habas: H.progreso.cosas['semillas-habas'] } })()`);
    ok(sem.cultivo === 'calafates' && sem.cal === antes.cal - 1 && sem.habas === antes.habas, `la E siembra los calafates elegidos y gasta uno (no unas habas) (${JSON.stringify(sem)})`);
    await foto('07-cantero-sembrado');
    // con el cantero ocupado, Tab ya no cambia nada
    await js(`tecla('Tab'); 1`);
    ok((await js(`H.progreso.semillaElegida`)) === 'calafates', 'con el cantero ocupado, Tab no cambia la semilla');
    // lejos del cantero la rueda sigue siendo de la barra
    await js(`ir(H.jugador.estado.pos.x + 60, H.jugador.estado.pos.z + 60); cuadros(4).then(() => 1)`);
    await js(`window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 })); 1`);
    ok((await js(`H.progreso.semillaElegida`)) === 'calafates', 'lejos de un cantero la rueda no toca la semilla');
    // se guarda en la partida
    await js(`H.guardar(); 1`);
    ok((await js(`JSON.parse(localStorage.getItem('hojarasca-v1')).semillaElegida`)) === 'calafates', 'la semilla elegida está en la partida guardada');
    await abrir();
    await entrar();
    ok((await js(`H.progreso.semillaElegida`)) === 'calafates', 'al abrir de nuevo la partida, la semilla elegida sigue siendo los calafates');

    // ================================================================ 4. recetas y ropa a una ranura vacía
    donde = 'ranuras';
    const marcar = `(() => { H.progreso.personal.partida = { proxima: { estacion: 'igual', clima: 'igual', dificultad: 'igual', animales: 'pocos', vecinos: true }, actual: { animales: 'normal', vecinos: true }, recetas: [{ nombre: 'Receta del humo', estacion: 'igual', clima: 'igual', dificultad: 'igual', animales: 'pocos', vecinos: true }] }; return 1 })()`;
    // 4a. una ranura con partida (la 3) para comprobar que no se pisa
    await js(`localStorage.clear(); ${ajustes('relax', { ranura: 3 })} 1`);
    await abrir();
    await entrar();
    await js(`H.guardar(); 1`);
    const tiene3 = await js(`Object.keys(localStorage).filter((k) => /p3|-3$|ranura/.test(k)).length`);
    console.log(`  (claves de la ranura 3: ${tiene3})`);
    // 4b. desde la ranura 1 (vacía) con lo personal marcado, a la 3 (con partida): nada se pisa
    await js(`${ajustes('relax', { ranura: 1 })} 1`);
    await abrir();
    ok(await listo(), 'carga la ranura 1');
    await js(AYUDA);
    await js(`${marcar}`);
    await js(`document.getElementById('btn-partidas-inicio').click(); 1`);
    const botones = await js(`[...document.querySelectorAll('#partidas-lista [data-partida-jugar]')].map((b) => b.dataset.partidaJugar + ':' + b.textContent)`);
    console.log('  botones:', JSON.stringify(botones));
    ok(botones.some((b) => /^3:Cargar/.test(b)) && botones.some((b) => /^2:Empezar acá/.test(b)), 'la ranura 3 tiene partida (Cargar) y la 2 está vacía (Empezar acá)');
    await foto('08-ranuras-antes');
    await js(`document.querySelector('#partidas-lista [data-partida-jugar="3"]').click(); 1`);
    ok(await listo(), 'abre la ranura 3');
    await js(AYUDA);
    ok((await js(`H.progreso.personal.partida.recetas.length`)) === 0, 'la ranura 3 (con partida) NO recibió las recetas de la 1: no se pisa nada');
    ok((await js(`sessionStorage.length`)) === 0 || !(await js(`Object.keys(sessionStorage).some((k) => /personal-pendiente/.test(k))`)), 'y no quedó nada anotado en la sesión');
    // 4c. de la ranura 1 a la 2, vacía: viajan las recetas
    await js(`${ajustes('relax', { ranura: 1 })} 1`);
    await abrir();
    ok(await listo(), 'vuelve a la ranura 1');
    await js(AYUDA);
    await js(`${marcar}`);
    await js(`document.getElementById('btn-partidas-inicio').click(); 1`);
    await js(`document.querySelector('#partidas-lista [data-partida-jugar="2"]').click(); 1`);
    ok(await listo(), 'abre la ranura 2 (vacía)');
    await js(AYUDA);
    const r2 = await js(`({ ranura: H.ajustes.ranura, recetas: H.progreso.personal.partida.recetas.map((r) => r.nombre), actual: H.progreso.personal.partida.actual, pendiente: Object.keys(sessionStorage).filter((k) => /personal-pendiente/.test(k)), dia: H.progreso.dia })`);
    console.log('  ranura 2:', JSON.stringify(r2));
    ok(r2.ranura === 2 && r2.recetas.join() === 'Receta del humo', 'la ranura vacía arranca con las recetas de la anterior');
    ok(r2.actual.animales === 'pocos', 'y con lo que la receta de «Tu partida» pedía para la próxima (pocos animales)');
    ok(r2.pendiente.length === 0, 'lo anotado en la sesión se usó una sola vez');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2000);
    await js(`H.guardar(); 1`);
    await foto('09-ranura-2-ya-empezada');
    await abrir();
    ok(await listo(), 'recarga la ranura 2');
    await js(AYUDA);
    ok((await js(`H.progreso.personal.partida.recetas.map((r) => r.nombre).join()`)) === 'Receta del humo', 'ya guardada, la ranura 2 conserva las recetas al reabrir');

    // ================================================================ 5. el Desafío: el tablero de trofeos es un panel que se queda
    donde = 'trofeos';
    await js(`localStorage.clear(); ${ajustes('desafio')} 1`);
    await abrir();
    await entrar();
    await js(`(() => { const D = H.progreso.desafio; D.tutorial = 99; D.crece.trofeos = { casco: 5, ojo: 15, corona: 20 }; D.crece.vistos.jefe = 15; D.crece.vistos.corona = true; return 1 })()`);
    const tab = await js(`(()=>{const O=H.obras, P=H.progreso, j=H.jugador.estado;
      Object.assign(P.materiales,{tronco:99,tabla:99,piedra:99,cristal:40});
      const p=H.PLANOS.find(q=>q.id==='tablero-trofeos'); if(!p) return {error:'no hay plano'};
      O.elegir(p); O.alternarSnap(false);
      const x=j.pos.x+9, z=j.pos.z; const r=O.fundar(x,z,0); if(!r.ok) { O.elegir(null); return {error:r.motivo}; }
      for (let g=0; g<12 && r.obra.datos.etapas<r.obra.plano.etapas.length; g++) { const k=O.avanzar(r.obra,P.materiales); if(!k.ok) break; }
      O.elegir(null); P.obras=O.obras.map(o=>o.datos);
      return {ok:r.obra.datos.etapas>=r.obra.plano.etapas.length, x:r.obra.datos.x, z:r.obra.datos.z}})()`);
    ok(tab.ok, `el tablero de trofeos se arma (${tab.error || 'ok'})`);
    const panelVisible = () => js(`(() => { const p = document.getElementById('trofeos-panel'); return !!p && !p.classList.contains('oculto') })()`);
    const alLado = async () => { await js(`ir(${tab.x}, ${tab.z - 2.2}, ${tab.x}, ${tab.z}); cuadros(6).then(() => 1)`); };
    await alLado();
    await js(`H.desafio.baseCrece.trofeos.revisarGanados?.(); 1`);
    await js(`cuadros(30).then(() => 1)`);
    const a1 = await aviso();
    ok(/Ver los trofeos del tablero \(3 de 7\)/.test(a1), `junto al tablero el aviso es el de siempre («${a1}»)`);
    ok(!(await panelVisible()), 'todavía no hay panel');
    await js(`tecla('KeyE'); cuadros(3).then(() => 1)`);
    ok(await panelVisible(), 'la E abre el panel de trofeos');
    const txt = await texto('trofeos-panel');
    ok(/Tablero de trofeos/.test(txt) && /Casco de corteza/.test(txt) && /Corona del Rey Duende/.test(txt) && /Hongo grande/.test(txt) && /Todavía no/.test(txt), `muestra los siete: los ganados con su bono y los que faltan (${txt.length} caracteres)`);
    ok(/E o Escape para cerrar el tablero/.test(txt), 'con el pie de cierre con la tecla de interactuar');
    await foto('10-trofeos-panel');
    ok(await js(`${H}.__hud.panelAbierto()`), 'es un panel del HUD: el mouse queda suelto');
    // se queda: más de 5,6 s (lo que duraba el aviso) y con el juego andando
    await esperar(7000);
    await js(`cuadros(30).then(() => 1)`);
    ok(await panelVisible(), 'a los 7 segundos el panel sigue abierto (antes el aviso se iba a los 5,6 s)');
    // la I no abre la mochila escondida debajo
    await js(`tecla('KeyI'); cuadros(2).then(() => 1)`);
    ok(await js(`document.getElementById('mochila').classList.contains('oculto')`), 'con el panel abierto, la I no abre la mochila debajo');
    // Escape cierra el panel (y no abre la pausa)
    await js(`tecla('Escape'); cuadros(2).then(() => 1)`);
    ok(!(await panelVisible()), 'Escape cierra el panel');
    ok(await js(`document.getElementById('pausa').classList.contains('oculto')`), 'y no abre la pausa');
    ok(!(await js(`${H}.__hud.panelAbierto()`)), 'el juego vuelve a tener el mouse');
    // la E lo abre y la E lo cierra
    await js(`cuadros(10).then(() => 1)`);
    await js(`tecla('KeyE'); cuadros(3).then(() => 1)`);
    ok(await panelVisible(), 'la E lo abre de nuevo');
    await js(`tecla('KeyE'); cuadros(3).then(() => 1)`);
    ok(!(await panelVisible()), 'y la E lo cierra');
    // alejarse lo cierra solo
    await js(`cuadros(10).then(() => 1)`);
    await js(`tecla('KeyE'); cuadros(3).then(() => 1)`);
    ok(await panelVisible(), 'otra vez abierto');
    await js(`ir(${tab.x}, ${tab.z - 40}, ${tab.x}, ${tab.z - 41}); cuadros(6).then(() => 1)`);
    ok(!(await panelVisible()), 'si te alejás del tablero, el panel se cierra solo');
    // el tablero que se cae cierra el panel
    await alLado();
    await js(`cuadros(30).then(() => 1)`);
    await js(`tecla('KeyE'); cuadros(3).then(() => 1)`);
    ok(await panelVisible(), 'abierto antes de que caiga el tablero');
    await js(`(() => { const o = H.obras.obras.find((q) => q.plano.id === 'tablero-trofeos'); H.desafio.danarObra(o, 99999); return 1 })()`);
    await js(`for (let i = 0; i < 40; i++) H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 }); cuadros(6).then(() => 1)`);
    ok(!(await panelVisible()), 'si los duendes tiran el tablero, el panel se cierra');
  } catch (err) {
    errores.push('EXCEPCIÓN: ' + (err && err.stack ? err.stack : err));
  }
  console.log(errores.length ? `\nFALLÓ (${errores.length}):\n- ${errores.join('\n- ')}` : '\nOK 4.11.1 interfaz y ranuras, en el juego');
  try { w && !w.isDestroyed() && w.destroy(); } catch {}
  salir(errores.length ? 1 : 0);
});

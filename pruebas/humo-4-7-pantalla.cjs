// 4.7 pantalla · LA MOCHILA CON CASILLAS, en una partida de verdad (Electron + WebGL), con capturas en 1536x864.
//   1. Relax: la mochila con pocas cosas (24 casillas, las vacías a la vista, las herramientas aparte) y el HUD «Mochila n/24»;
//   2. llena (24/24) y con sobrecarga (partida vieja con 989 troncos): el aviso con ícono y palabra, lo que sobra de cada cosa;
//   3. montado en el caballo con alforjas: 36 casillas;
//   4. el cartel «Mochila llena» del HUD;
//   5. Desafío: la mochila de siempre, sin casillas ni indicador.
// Uso (después de `node armar.mjs`), siempre en el monitor externo y con perfil propio:
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-7-pantalla.cjs -Perfil <carpeta>   (las capturas, en HOJ_SALIDA o salida-cantina\carga-pantalla47)
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = process.env.HOJ_SALIDA || 'C:/Users/Andres/Documents/Hojarasca/salida-cantina/carga-pantalla47';
dialog.showErrorBox = () => {};
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); salir(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa): ${e && e.stack ? e.stack : e}`); salir(1); });
fs.mkdirSync(salida, { recursive: true });
app.setPath('userData', path.join(salida, '_perfil'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 10 minutos'); salir(2); }, 10 * 60 * 1000).unref?.();

app.on('window-all-closed', () => {});
app.whenReady().then(async () => {
  const errores = [];
  let w = null;
  const nuevaVentana = () => {
    w = new BrowserWindow({ show: true, width: 1536, height: 864, useContentSize: true, webPreferences: { backgroundThrottling: false } });
    w.webContents.on('console-message', (e) => {
      const m = String(e.message);
      if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 400));
    });
    // el monitor externo es más chico que la notebook: se achica la página (zoom) hasta que el alto útil sea el de 1536x864 (864 px de CSS)
    // y las capturas (de la ventana) muestran el mismo encuadre, a escala 0,78
    w.webContents.on('did-finish-load', () => { try { const [an, al] = w.getContentSize(); w.webContents.setZoomFactor(Math.min(an / 1536, al / 864)); } catch (e) { console.log('sin zoom: ' + e.message); } });
    w.focus();
  };
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error('la página no respondió en 90 s')), 90000))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push('FALLÓ: ' + texto); };
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const listo = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) return true; } return false; };
  const AYUDA = `window.H = window.__hojarasca;
    window.cuadros = async (n = 4) => { for (let i = 0; i < n; i++) { H.__bucle(); await new Promise((r) => setTimeout(r, 5)); } };
    window.tecla = async (code, n = 4) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true })); await cuadros(n); document.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true })); await cuadros(2); };
    window.ir = (x, z, hx = x, hz = z - 1) => { const j = H.jugador.estado; j.pos.set(x, H.T.altura(x, z) + 1.6, z); j.vel.set(0, 0, 0); j.vy = 0; j.yaw = Math.atan2(-(hx - x), -(hz - z)); j.pitch = -0.1; };
    window.vis = (id) => { const e = document.getElementById(id); return !!e && !e.classList.contains('oculto') && getComputedStyle(e).display !== 'none'; };
    window.txt = (id) => document.getElementById(id)?.innerText || '';
    1`;
  const juego = () => js(`(() => { const p = document.getElementById('pausa'); if (p && !p.classList.contains('oculto')) H.volverAlJuego(true); return 1 })()`);
  const cuadros = (n = 4) => js(`cuadros(${n}).then(() => 1)`);
  const tecla = (code, n = 4) => js(`tecla('${code}', ${n}).then(() => 1)`);
  const ajustes = (modo) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'${modo}', autoCalidad:false, guiaPrimerDia:false, estacion:'auto'}));`;
  const entrar = async () => {
    ok(await listo(), 'carga el juego');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
    await js(AYUDA);
  };
  const foto = async (nombre) => {
    await esperar(200);
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
    console.log(`  (captura ${nombre}.png)`);
  };
  // abre la mochila con I y deja que se arme
  const mochila = async () => { await juego(); await tecla('KeyI', 3); await cuadros(3); await esperar(150); };
  const cerrarMochila = async () => { if (await js(`vis('mochila')`)) await tecla('KeyI', 3); await cuadros(6); };
  const poner = (mat, entradas = {}, cosas = {}) => js(`(() => { const P = H.progreso; P.materiales = ${JSON.stringify(mat)}; P.entradas = {}; for (const [k, n] of Object.entries(${JSON.stringify(entradas)})) P.entradas[k] = { cantidad: n, vistas: 1 }; P.cosas = Object.assign({ hacha: 1, pico: 1 }, ${JSON.stringify(cosas)}); P.ramitas = 4; return 1; })()`);
  const medidas = () => js(`(() => { const m = document.getElementById('mochila').getBoundingClientRect(); const cs = getComputedStyle(document.getElementById('mochila')); return { ancho: cs.width, zoom: cs.zoom, escala: getComputedStyle(document.documentElement).getPropertyValue('--escala-letra'), dpr: devicePixelRatio, l: m.left, t: m.top, r: m.right, b: m.bottom, an: innerWidth, al: innerHeight, scroll: document.getElementById('mochila').scrollHeight, cli: document.getElementById('mochila').clientHeight }; })()`);

  try {
    nuevaVentana();
    await abrir();
    await js(`localStorage.clear(); ${ajustes('relax')} 1`);
    await abrir();
    await entrar();
    await js(`(() => { const P = H.progreso; P.horas = 11; P.dia = 2; 1 })()`);
    await juego();

    // ---- 1. pocas cosas
    await poner({ tronco: 7, tabla: 3, piedra: 12 }, { pinon: 12, calafate: 20, huevo: 6 }, { yerba: 8 });
    await cuadros(6);
    ok(await js(`vis('carga-hud')`) && /Mochila \d+\/24/.test(await js(`txt('carga-hud')`)), 'HUD: «Mochila n/24» a la vista');
    console.log('  HUD:', await js(`txt('carga-hud')`));
    await foto('hud-normal');
    await mochila();
    ok(await js(`vis('mochila') && document.getElementById('mochila').classList.contains('con-casillas')`), 'la mochila del Relax es la de casillas');
    const nCas = await js(`document.querySelectorAll('#mochila-casillas .casilla').length`);
    const nVac = await js(`document.querySelectorAll('#mochila-casillas .casilla.vacia').length`);
    ok(nCas === 24 && nVac > 0, `24 casillas, con las vacías a la vista (${nVac} vacías)`);
    console.log('  contador:', await js(`txt('mochila-contador')`), '|', await js(`txt('mochila-detalle')`));
    ok(!(await js(`vis('mochila-sobrecarga')`)), 'sin aviso de sobrecarga');
    const herr = await js(`txt('mochila-rejilla')`);
    ok(/Cámara/.test(herr) && /Hacha/.test(herr) && !/Troncos/.test(herr), 'las herramientas quedan en su sección y los troncos no');
    ok(!(await js(`vis('carga-hud')`)), 'con la mochila abierta, el indicador del HUD se tapa');
    console.log('  medidas:', JSON.stringify(await medidas()));
    await foto('mochila-pocas');
    // clic en una casilla: la pone en la barra
    const antes = await js(`JSON.stringify(H.progreso.barra || null)`);
    await js(`(() => { const c = document.querySelector('#mochila-casillas .casilla.elegible'); c.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true })); return 1; })()`);
    await cuadros(3);
    const despues = await js(`JSON.stringify(H.progreso.barra || null)`);
    ok(antes !== despues, 'un clic en una casilla la pone en la barra (como antes con la lista)');
    ok(await js(`vis('mochila')`), 'y la mochila sigue abierta');
    await cerrarMochila();

    // ---- 2. llena y sobrecarga
    await poner({ tronco: 100, tabla: 60, piedra: 50 }, { pinon: 100, calafate: 50, huevo: 30, frutilla: 50 }, { yerba: 8 });   // 10 + 3 + 5 + 2 + 1 + 1 + 1 + 1 = 24 pilas
    await cuadros(6);
    console.log('  HUD llena:', await js(`txt('carga-hud')`));
    ok(/llena/.test(await js(`txt('carga-hud')`)) && await js(`document.getElementById('carga-hud').classList.contains('llena')`), 'HUD llena: dice «llena» y se resalta');
    await foto('hud-llena');
    await mochila();
    ok(/llena/.test(await js(`txt('mochila-contador')`)), 'el contador dice «llena»');
    await foto('mochila-llena');
    await cerrarMochila();

    await poner({ tronco: 989, tabla: 3, piedra: 14 }, { pinon: 12, huevo: 9 }, { yerba: 8 });
    await cuadros(6);
    console.log('  HUD sobrecarga:', await js(`txt('carga-hud')`));
    ok(/sobrecarga/.test(await js(`txt('carga-hud')`)), 'HUD con sobrecarga: la palabra');
    await foto('hud-sobrecarga');
    await mochila();
    ok(await js(`vis('mochila-sobrecarga')`) && /989|\d+ de más/.test(await js(`txt('mochila-sobrecarga')`)), 'el aviso de sobrecarga lista lo que sobra');
    console.log('  aviso:', (await js(`txt('mochila-sobrecarga')`)).replace(/\n/g, ' | '));
    const sinPerder = await js(`H.progreso.materiales.tronco`);
    ok(sinPerder === 989, 'la partida vieja no pierde nada: siguen los 989 troncos');
    console.log('  medidas (sobrecarga):', JSON.stringify(await medidas()));
    await foto('mochila-sobrecarga');
    await cerrarMochila();

    // ---- 3. montado con alforjas
    await poner({ tronco: 60, tabla: 40, piedra: 30 }, { pinon: 100, calafate: 60, huevo: 30 }, { yerba: 8, caballo: 1 });
    await js(`(() => { const P = H.progreso; P.personal = P.personal || {}; P.personal.caballo = Object.assign({}, P.personal.caballo, { conAlforjas: true }); return 1; })()`);
    await cuadros(6);
    // se sube con E junto al caballo (si no se puede, se simula lo mismo que hace montar())
    const ref = await js(`({ x: H.T.lugares.refugio.x, z: H.T.lugares.refugio.z })`);
    let montado = false;
    for (const [dx, dz] of [[3, 3], [-3, 3], [4, 0], [0, 5], [-4, -2], [2, -4]]) {
      await js(`ir(${ref.x + dx}, ${ref.z + dz}, ${ref.x}, ${ref.z}); 1`);
      await juego(); await cuadros(10); await esperar(300);
      await js(`window.H.__avisoYa(); 1`);
      await tecla('KeyE', 4);
      montado = await js(`!!H.jugador.estado.montado`);
      if (montado) break;
    }
    if (!montado) {
      console.log('  (no se pudo subir con E: se monta como lo hace el juego)');
      await js(`(() => { H.jugador.estado.montado = { trote: 5.5, galope: 9, alto: 1.9, aguaMax: 0.9 }; return 1; })()`);
      await cuadros(6);
    }
    ok(await js(`!!H.jugador.estado.montado`), 'montado a caballo');
    await cuadros(6);
    console.log('  HUD montado:', await js(`txt('carga-hud')`));
    ok(/\/36/.test(await js(`txt('carga-hud')`)), 'montado con alforjas: el HUD dice /36');
    await foto('hud-alforjas');
    await mochila();
    const nCas36 = await js(`document.querySelectorAll('#mochila-casillas .casilla').length`);
    ok(nCas36 === 36, `36 casillas montado con alforjas (${nCas36})`);
    console.log('  contador:', await js(`txt('mochila-contador')`), '|', await js(`txt('mochila-detalle')`));
    console.log('  medidas (36):', JSON.stringify(await medidas()));
    await foto('mochila-alforjas');
    await cerrarMochila();
    await js(`(() => { H.jugador.estado.montado = null; return 1; })()`);
    await cuadros(8);
    ok(/\/24/.test(await js(`txt('carga-hud')`)), 'bajado del caballo vuelve a 24');

    // ---- 4. el cartel «Mochila llena»
    await juego();
    await js(`H.avisoMochilaLlena('Mochila llena'); 1`);
    await cuadros(4); await esperar(500);
    ok(await js(`vis('aviso-llena')`) && /Mochila llena/.test(await js(`txt('aviso-llena')`)), 'el cartel «Mochila llena» se ve');
    await foto('aviso-llena');
    await esperar(3000);
    ok(!(await js(`vis('aviso-llena')`)), 'y se va solo');

    // ---- 5. el Desafío
    await abrir();
    await js(`localStorage.clear(); ${ajustes('desafio')} 1`);
    await abrir();
    await entrar();
    await juego();
    await cuadros(6);
    ok(!(await js(`vis('carga-hud')`)), 'Desafío: sin indicador de carga');
    await mochila();
    ok(await js(`vis('mochila') && !document.getElementById('mochila').classList.contains('con-casillas')`), 'Desafío: la mochila de siempre');
    ok(!(await js(`vis('mochila-casillas')`)) && !(await js(`vis('mochila-cabeza')`)), 'Desafío: sin casillas ni contador');
    await foto('mochila-desafio');
  } catch (e) {
    errores.push('EXCEPCIÓN: ' + (e && e.stack ? e.stack : e));
  }
  if (errores.length) { console.log('--- problemas ---'); for (const m of errores) console.log(m); }
  console.log(errores.length ? `✗ ${errores.length} problemas` : '✓ todo bien');
  salir(errores.length ? 1 : 0);
});

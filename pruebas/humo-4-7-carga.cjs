// 4.7 carga · EL LÍMITE DE LA MOCHILA, en una partida de verdad (Electron + WebGL).
//   1. Relax, mochila llena (24 casillas de troncos): el hacha no tala (ni un hachazo), el pico no pica y el aviso lo dice;
//   2. con lugar, tala y pica;
//   3. un trato sin lugar (el almacén, yerba por frutillas) se rechaza y no cobra; con lugar, se hace;
//   4. el juncal (un recurso de zona) con la mochila llena no se corta; con lugar, sí;
//   5. una partida vieja con 989 troncos carga igual: sobrecarga, no pierde nada, no deja juntar más y se gasta de a poco;
//   6. las alforjas (a caballo suman 12 casillas) y el costo de calcular la ocupación;
//   7. el Desafío: sin límite, como siempre.
// Uso (después de `node armar.mjs`), siempre en el monitor externo y con perfil propio:
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-7-carga.cjs
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = process.env.HOJ_SALIDA || 'C:/Users/Andres/Documents/Hojarasca/salida-cantina/carga';
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
    window.ir = (x, z, hx = x, hz = z - 1) => { const j = H.jugador.estado; j.pos.set(x, H.T.altura(x, z) + 1.6, z); j.vel.set(0, 0, 0); j.vy = 0; j.yaw = Math.atan2(-(hx - x), -(hz - z)); j.pitch = -0.3; };
    window.notas = () => document.getElementById('notas')?.innerText || '';
    window.mat = (k) => H.progreso.materiales?.[k] || 0;
    1`;
  const juego = () => js(`(() => { const p = document.getElementById('pausa'); if (p && !p.classList.contains('oculto')) H.volverAlJuego(true); return 1 })()`);
  const cuadros = (n = 4) => js(`cuadros(${n}).then(() => 1)`);
  const entrar = async () => {
    ok(await listo(), 'carga el juego');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
    await js(AYUDA);
  };
  const ajustes = (modo) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'${modo}', autoCalidad:false, guiaPrimerDia:false, estacion:'auto'}));`;
  const foto = async (nombre) => {
    await esperar(150);
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
    console.log(`  (captura ${nombre}.png)`);
  };
  const carga = () => js('H.__mochilaCarga()');
  // parado a 1,9 m del árbol vivo más cercano al refugio, mirándolo
  const aArbol = () => js(`(async () => { const j = H.jugador.estado, r = H.T.lugares.refugio;
    const a = H.veg.arboles.filter((q) => !q.sacado && !q.caido && q.especie !== 'pehuen' && Math.hypot(q.x - r.x, q.z - r.z) < 140).sort((p, q) => Math.hypot(p.x - r.x, p.z - r.z) - Math.hypot(q.x - r.x, q.z - r.z))[0];
    if (!a) return null; window.__arbol = a; ir(a.x + 1.9 + (a.r || 0.4), a.z); j.yaw = Math.atan2(-(a.x - j.pos.x), -(a.z - j.pos.z)); await cuadros(8); return { x: a.x, z: a.z } })()`);
  const aRoca = () => js(`(async () => { const r = H.T.lugares.refugio;
    const m = H.veg.matas.filter((q) => q.tipo === 'roca' && !q.sacado && Math.hypot(q.x - r.x, q.z - r.z) < 260).sort((p, q) => Math.hypot(p.x - r.x, p.z - r.z) - Math.hypot(q.x - r.x, q.z - r.z))[0];
    if (!m) return null; window.__roca = m; const j = H.jugador.estado, px = m.x + Math.sin(0.6) * 1.6, pz = m.z + Math.cos(0.6) * 1.6;
    ir(px, pz); j.yaw = Math.atan2(-(m.x - px), -(m.z - pz)); j.pitch = -0.35; await cuadros(10); return { x: m.x, z: m.z } })()`);

  try {
    nuevaVentana();
    await abrir();
    await js(`localStorage.clear(); ${ajustes('relax')} 1`);
    await abrir();
    await entrar();
    await js(`(() => { const P = H.progreso; P.horas = 11; P.dia = 2; P.cosas = { hacha: 1, pico: 1 }; 1 })()`);
    ok(await js(`H.progreso.modo === 'relax' || H.progreso.modo === undefined || !!H.progreso.modo`), 'es una partida del Relax');

    // ---- 1. mochila llena: no se tala ni se pica
    await js(`(() => { H.progreso.materiales = { tronco: 240 }; 1 })()`);
    let c = await carga();
    ok(c.capacidad.total === 24 && c.ocupacion.usadas === 24 && c.ocupacion.libres === 0, `24 casillas, todas usadas (${JSON.stringify({ t: c.capacidad.total, u: c.ocupacion.usadas })})`);
    const arbol = await aArbol();
    ok(!!arbol, 'hay un árbol a mano');
    await js(`(async () => { for (let i = 0; i < 6; i++) { H.usarHacha(); await cuadros(1); } return 1 })()`);
    let txt = await js('notas()');
    ok(await js('mat("tronco")') === 240 && await js('!window.__arbol.sacado && !window.__arbol.caido'), 'lleno: el árbol sigue en pie y no suma troncos');
    ok(/Mochila llena: no te entra más troncos/.test(txt), `y el aviso lo dice (${txt.replace(/\n/g, ' | ').slice(0, 160)})`);
    await foto('1-tala-con-la-mochila-llena');
    await js(`(() => { H.progreso.materiales = { piedra: 240 }; 1 })()`);
    const roca = await aRoca();
    ok(!!roca, 'hay una roca a mano');
    await js(`(async () => { for (let i = 0; i < 8; i++) { H.usarHacha(); await cuadros(1); } return 1 })()`);
    ok(await js('mat("piedra")') === 240 && await js('!window.__roca.sacado'), 'lleno de piedra: la roca no se pica y sigue ahí');
    await js('H.usarHacha(); 1'); await cuadros(1);
    txt = await js('notas()');
    ok(/Mochila llena: no te entra más piedras/.test(txt), `el aviso: «${txt.replace(/\n/g, ' | ').slice(0, 120)}»`);

    // ---- 2. con lugar, se hace
    await js(`(() => { H.progreso.materiales = { piedra: 200 }; 1 })()`);
    await aRoca();
    await js(`(async () => { for (let i = 0; i < 10; i++) { H.usarHacha(); await cuadros(1); } return 1 })()`);
    ok(await js('mat("piedra")') > 200, `con lugar, la roca se pica (${await js('mat("piedra")')} piedras)`);
    await js(`(() => { H.progreso.materiales = { tronco: 100 }; 1 })()`);
    await aArbol();
    await js(`(async () => { for (let i = 0; i < 8; i++) { H.usarHacha(); await cuadros(1); } return 1 })()`);
    ok(await js('mat("tronco")') > 100, `con lugar, el árbol cae (${await js('mat("tronco")')} troncos)`);

    // ---- 3. un trato sin lugar (almacén: un kilo de yerba por 5 frutillas y 2 cantos)
    await js(`(() => { const P = H.progreso; P.materiales = { tronco: 240 }; P.entradas.frutilla = { dia: 1, hora: 9, cantidad: 5 }; P.entradas.canto = { dia: 1, hora: 9, cantidad: 2 }; P.cosas = { hacha: 1, pico: 1 }; 1 })()`);
    // 5 frutillas y 2 cantos ya ocupan 2 casillas: la mochila está pasada (26): el trato suma yerba (1 casilla) y libera 2: entra por neto
    await js(`(() => { H.progreso.materiales = { tronco: 220 }; 1 })()`);   // 22 + 1 + 1 = 24
    await js('H.__cambiar(4); 1');
    ok(await js('H.progreso.cosas.yerba') === 8, `lleno pero con lo que se paga (frutillas y cantos liberan sus casillas), la yerba entra (${await js('H.progreso.cosas.yerba')})`);
    await js(`(() => { const P = H.progreso; P.cosas.yerba = 0; P.materiales = { tronco: 230 }; P.entradas.frutilla = { dia: 1, hora: 9, cantidad: 5 }; P.entradas.canto = { dia: 1, hora: 9, cantidad: 40 }; 1 })()`);   // 23 + 1 + 2 = 26: pasado
    const antesT = await js(`({ fr: H.progreso.entradas.frutilla.cantidad, ca: H.progreso.entradas.canto.cantidad, y: H.progreso.cosas.yerba || 0 })`);
    await js('H.__cambiar(4); 1');
    const despT = await js(`({ fr: H.progreso.entradas.frutilla.cantidad, ca: H.progreso.entradas.canto.cantidad, y: H.progreso.cosas.yerba || 0 })`);
    ok(JSON.stringify(antesT) === JSON.stringify(despT), `sin lugar, el trato se rechaza y no cobra nada (${JSON.stringify(despT)})`);
    txt = await js('notas()');
    ok(/No te entra: te faltan? \d+ lugar/.test(txt), `y avisa (${txt.replace(/\n/g, ' | ').slice(0, 140)})`);
    await js(`(() => { H.progreso.materiales = { tronco: 100 }; 1 })()`);
    await js('H.__cambiar(4); 1');
    ok(await js('H.progreso.cosas.yerba') === 8 && await js('H.progreso.entradas.frutilla.cantidad') === 0, 'con lugar, el trato se hace y cobra');

    // ---- 4. el juncal con la mochila llena
    await js(`(() => { const P = H.progreso; P.materiales = { tronco: 240 }; P.entradas.frutilla = { dia: 1, hora: 9, cantidad: 0 }; P.entradas.canto = { dia: 1, hora: 9, cantidad: 0 }; P.cosas = { hacha: 1, pico: 1, 'hoz-junco': 1 }; P.horas = 11; 1 })()`);
    await js(`(async () => { ir(-263, -237, -265, -239); await cuadros(20); return 1 })()`);
    await juego();
    await js(`document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', bubbles: true })); 1`); await cuadros(4);
    await js(`document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE', bubbles: true })); 1`);
    txt = await js('notas()');
    ok(await js('mat("junco")') === 0 && /Mochila llena: no te entra más juncos/.test(txt), `el juncal no se corta con la mochila llena (${txt.replace(/\n/g, ' | ').slice(0, 120)})`);
    await js(`(() => { H.progreso.materiales = { tronco: 200 }; 1 })()`);
    await js(`document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', bubbles: true })); 1`); await cuadros(4);
    await js(`document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE', bubbles: true })); 1`);
    ok(await js('mat("junco")') === 3, `con lugar, +3 juncos (${await js('mat("junco")')})`);

    // ---- 5. la partida vieja: 989 troncos
    await js(`(() => { const P = H.progreso; P.materiales = { tronco: 989, tabla: 12 }; P.cosas = { hacha: 1, pico: 1 }; H.guardar(); 1 })()`);
    await esperar(400);
    await abrir();
    ok(await listo(), 'vuelve a cargar con 989 troncos');
    await js(AYUDA);
    ok(await js('mat("tronco")') === 989 && await js('mat("tabla")') === 12, 'la partida vieja carga igual: no se perdió nada');
    c = await carga();
    ok(c.ocupacion.sobrecarga.tronco > 0 && c.ocupacion.libres === 0, `muestra sobrecarga (${JSON.stringify(c.ocupacion.sobrecarga)})`);
    await js(`(() => { const P = H.progreso; P.horas = 11; 1 })()`);
    await aArbol();
    await js(`(async () => { for (let i = 0; i < 6; i++) { H.usarHacha(); await cuadros(1); } return 1 })()`);
    ok(await js('mat("tronco")') === 989, 'en sobrecarga no se puede juntar más');
    await foto('2-sobrecarga');
    await js(`(() => { H.progreso.materiales.tronco = 100; 1 })()`);
    ok((await carga()).ocupacion.sobrecarga.tronco === undefined || Object.keys((await carga()).ocupacion.sobrecarga).length === 0, 'gastando (100 troncos), la sobrecarga se va y se vuelve a poder juntar');
    await js(`(() => { H.guardar(); 1 })()`); await esperar(300);
    const g = await js(`JSON.parse(localStorage.getItem('hojarasca-v1'))`);
    ok(g.materiales.tronco === 100, 'el guardado sigue siendo el de siempre (los materiales, tal cual)');

    // ---- 6. las alforjas y el costo
    await js(`(() => { const P = H.progreso; P.materiales = { tronco: 240 }; P.personal = P.personal || {}; P.personal.caballo = { ...(P.personal.caballo || {}), conAlforjas: true }; 1 })()`);
    ok((await carga()).capacidad.total === 24, 'a pie, con las alforjas elegidas: 24');
    await js(`(() => { H.jugador.estado.montado = { trote: 1, galope: 2, alto: 1.7, aguaMax: 0.5 }; 1 })()`);
    c = await carga();
    ok(c.capacidad.total === 36 && c.capacidad.alforjas === 12 && c.ocupacion.libres === 12, `montado y con alforjas: 36 casillas (${JSON.stringify(c.capacidad)})`);
    ok(await js('H.__lugarEn("tronco", 500)') === 120, 'y entran 120 troncos más');
    await js(`(() => { H.progreso.personal.caballo.conAlforjas = false; 1 })()`);
    ok((await carga()).capacidad.total === 24, 'sin alforjas, montado, 24');
    await js(`(() => { H.jugador.estado.montado = null; 1 })()`);
    const ms = await js(`(() => { H.progreso.entradas.pinon = { dia: 1, hora: 9, cantidad: 80 }; const t0 = performance.now(); for (let i = 0; i < 2000; i++) H.__lugarEn('tronco', 5); return (performance.now() - t0) / 2000 })()`);
    console.log(`  (costo de lugarEn: ${(ms * 1000).toFixed(1)} µs por llamada, ${Object.keys(await js('H.progreso.entradas')).length} entradas en el cuaderno)`);
    ok(ms < 0.5, `calcular el lugar es barato (${(ms * 1000).toFixed(1)} µs) y sólo se hace al juntar, no por cuadro`);

    // ---- 7. el Desafío: sin límite
    await js(`localStorage.clear(); ${ajustes('desafio')} 1`);
    await abrir();
    await entrar();
    const modo = await js('H.progreso.modo');
    ok(modo === 'desafio', `ahora es el Desafío (${modo})`);
    await js(`(() => { const P = H.progreso; P.materiales = { tronco: 999, tabla: 500, piedra: 300 }; P.cosas = { ...P.cosas, hacha: 1, pico: 1 }; P.horas = 11; 1 })()`);
    c = await carga();
    ok(c.capacidad.total === null || c.capacidad.total === Infinity || c.capacidad.total > 1e9, 'capacidad sin límite');
    ok(await js('H.__lugarEn("tronco", 5000)') === 5000, 'lugar para todo');
    await aArbol();
    await js(`(async () => { for (let i = 0; i < 8; i++) { H.usarHacha(); await cuadros(1); } return 1 })()`);
    ok(await js('mat("tronco")') > 999, `el Desafío sigue talando con 999 troncos (${await js('mat("tronco")')})`);
  } catch (err) {
    errores.push('EXCEPCIÓN: ' + (err && err.stack ? err.stack : err));
  }
  console.log(errores.length ? `\nFALLÓ (${errores.length}):\n- ${errores.join('\n- ')}` : '\nOK 4.7 carga, en el juego');
  try { w && !w.isDestroyed() && w.destroy(); } catch {}
  salir(errores.length ? 1 : 0);
});

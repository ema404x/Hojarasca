// Partida real 3.6.2 (juego): lo que quedó pendiente de la 3.6.0 y la 3.6.1, en el juego de verdad.
//  · el clic llega a las listas del HUD (el almacén, la feria, la mochila, la barra): con el mouse suelto, el
//    punto de la opción es la opción (antes el #hud se lo comía todo), elige, y el clic no sigue de largo;
//  · los árboles despejados (junto al galpón, la cueva y las estaciones) ya no chocan; un tocón sí;
//  · sentado en el refugio con un libro prestado y una visita al lado (sin mirarla de frente): E habla con
//    la visita, y leer está en el menú de la charla; sin visita, E lee;
//  · el mapa dibuja las calles de la aldea.
// Uso: npx electron pruebas/humo-3-6-2-juego.cjs --user-data-dir=<carpeta propia>
//      (o HUMO_PERFIL=<carpeta>; si no, una propia en la carpeta temporal). Borra el localStorage del perfil.
//      HUMO_MAPA=<archivo.png>: guarda el mapa de la aldea.
const { app, BrowserWindow, dialog } = require('electron');
// que la prueba nunca muestre un cuadro de error en la pantalla del usuario: lo escribe y sale
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); app.exit(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa sin atender): ${e && e.stack ? e.stack : e}`); app.exit(1); });
const path = require('path');
const os = require('os');
const fs = require('fs');
const raiz = path.resolve(__dirname, '..');
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
else if (!process.argv.some((a) => a.startsWith('--user-data-dir'))) app.setPath('userData', path.join(os.tmpdir(), 'hojarasca-humo-3-6-2-juego'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: false, width: 1100, height: 700, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = 'carga';
  const js = (c) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 300 s (${donde})`)), 300000)),
  ]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const listo = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__aldea)').catch(() => false)) return true; } return false; };
  const H = 'window.__hojarasca';
  const ajustes = `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'muybaja', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre', estacion: 'verano' }));`;
  const cuadros = (n = 4) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  const tecla = async (code) => { await js(`(()=>{ document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', key: '${code}', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', key: '${code}', bubbles: true })); return 1 })()`); await cuadros(2); };
  // ¿el punto del medio del elemento es el elemento (o algo adentro)? Es lo que decide adónde va un clic de verdad
  // (de los que coinciden, el primero que entra en la ventana: la lista del almacén es más alta que la ventana de la prueba)
  const llegaElClic = (sel) => js(`(()=>{ const todos = [...document.querySelectorAll(${JSON.stringify(sel)})]; if (!todos.length) return 'no está';
    const el = todos.find((e) => { const r = e.getBoundingClientRect(); return r.width && r.top >= 0 && r.bottom <= innerHeight; }); if (!el) return 'no se ve';
    const r = el.getBoundingClientRect(); const x = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return x && (x === el || el.contains(x)) ? 'sí' : (x ? x.id || x.className || x.tagName : 'nada'); })()`);
  // un mousedown en el elemento: ¿sigue de largo hasta el documento (donde se tira la línea)?
  const sigueDeLargo = (sel) => js(`(()=>{ let n = 0; const f = () => n++; document.addEventListener('mousedown', f); window.addEventListener('mousedown', f); const el = document.querySelector(${JSON.stringify(sel)}); el.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true, cancelable: true })); el.dispatchEvent(new MouseEvent('mouseup', { button: 0, bubbles: true })); document.removeEventListener('mousedown', f); window.removeEventListener('mousedown', f); return n; })()`);

  try {
    await w.loadURL('about:blank');
    await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
    await abrir();
    ok(await listo(), 'el juego cargó');
    await js(`(()=>{ localStorage.clear(); ${ajustes} return 1 })()`);
    await abrir();
    ok(await listo(), 'una partida Relax limpia');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    await js(`${H}.volverAlJuego?.(); ${H}.ajustes.limiteFps = 'libre'; 1`);
    await cuadros(4);

    seccion('el clic en las listas del HUD');
    await js(`(()=>{ const P = ${H}.progreso; P.entradas.pinon = { dia: 1, hora: 9, cantidad: 30 }; P.entradas.frutilla = { dia: 1, hora: 9, cantidad: 30 }; return 1 })()`);
    // (sin correr cuadros: lejos del mostrador, el juego lo cierra solo)
    await js(`${H}.__hud.abrirAlmacen(); 1`);
    ok(await js(`${H}.__hud.panelAbierto()`), 'el almacén abierto cuenta como panel del HUD');
    ok((await llegaElClic('#trueque-lista li')) === 'sí', `almacén: el clic llega a la opción (${await llegaElClic('#trueque-lista li')})`);
    const cosasAntes = await js(`JSON.stringify(${H}.progreso.cosas)`);
    const notasAntes = await js(`document.querySelectorAll('#notas > *').length`);
    const largo = await sigueDeLargo('#trueque-lista li');
    await cuadros(2);
    const cambio = (await js(`JSON.stringify(${H}.progreso.cosas)`)) !== cosasAntes || (await js(`document.querySelectorAll('#notas > *').length`)) > notasAntes;
    ok(largo === 0 && cambio, `almacén: el clic elige (${cambio ? 'cambió o avisó' : 'nada'}) y no sigue de largo (${largo})`);
    await js(`${H}.__hud.cerrarAlmacen(); 1`);
    ok((await llegaElClic('#barra .ranura')) === 'sí', `la barra: el clic llega a la casilla (${await llegaElClic('#barra .ranura')})`);
    ok((await sigueDeLargo('#barra .ranura')) === 0, 'la barra: no sigue de largo');
    await js(`${H}.__hud.abrirMochila(true); 1`); await cuadros(1);
    ok((await llegaElClic('#mochila-rejilla .cosa')) === 'sí', `la mochila: el clic llega a la cosa (${await llegaElClic('#mochila-rejilla .cosa')})`);
    ok((await sigueDeLargo('#mochila-rejilla .cosa')) === 0, 'la mochila: no sigue de largo');
    ok((await llegaElClic('#btn-personalizar-mochila')) === 'sí' && (await sigueDeLargo('#btn-personalizar-mochila')) === 0, 'la mochila: el botón de personalizar recibe el clic y no tira la línea');
    await js(`${H}.__personal?.cerrar?.(); ${H}.__hud.abrirMochila(false); ${H}.volverAlJuego?.(); 1`); await cuadros(1);
    await js(`${H}.abrirFeria(); 1`); await cuadros(1);
    const feria = await js(`!document.getElementById('feria').classList.contains('oculto') && document.querySelectorAll('#feria-lista li').length`);
    if (feria) ok((await llegaElClic('#feria-lista li')) === 'sí' && (await sigueDeLargo('#feria-lista li')) === 0, 'la feria: el clic llega y no sigue de largo');
    await tecla('Escape'); await js(`${H}.volverAlJuego?.(); 1`); await cuadros(1);

    seccion('las listas entran en una ventana chica (700 px) y la opción marcada siempre se ve');
    // (el almacén, la feria y las cargas: el panel no pasa del borde; la ruedita recorre todas las opciones, la
    // marcada queda adentro de la lista y de la ventana; Enter elige la marcada)
    const enVentana = (abrirPanel, sel) => js(`(()=>{ const H = ${H}; ${abrirPanel}; const ul = document.querySelector('${sel}'), panel = ul?.parentElement;
      if (!ul || panel.classList.contains('oculto')) return null;
      const p = panel.getBoundingClientRect(), n = ul.children.length, mal = [];
      for (let k = 0; k < n * 2 + 1; k++) {
        window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
        const li = ul.querySelector('li.elegida');
        if (!li) { mal.push(k + ': sin marca'); continue; }
        const r = li.getBoundingClientRect(), u = ul.getBoundingClientRect();
        if (r.top < u.top - 1 || r.bottom > u.bottom + 1 || r.top < 0 || r.bottom > innerHeight) mal.push(k + ': ' + li.textContent.slice(0, 24) + ' fuera');
      }
      return { n, adentro: p.top >= 0 && p.bottom <= innerHeight, alto: Math.round(p.height), ventana: innerHeight, mal };
    })()`);
    const alm = await enVentana(`H.__hud.abrirAlmacen()`, '#trueque-lista');
    ok(!!alm && alm.adentro && alm.n > 0 && !alm.mal.length, `el almacén entra (${alm?.alto} de ${alm?.ventana} px) y la marca recorre sus ${alm?.n} opciones a la vista${alm?.mal.length ? ': ' + alm.mal.slice(0, 3).join('; ') : ''}`);
    // (la marca en un cambio que se puede hacer)
    const sePuede = await js(`(()=>{ for (let k = 0; k < 20; k++) { const li = document.querySelector('#trueque-lista li.elegida'); if (li && !li.classList.contains('falta') && !li.classList.contains('hecho')) return li.textContent; window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 })); } return null })()`);
    const cosas0 = await js(`JSON.stringify(${H}.progreso.cosas)`);
    await tecla('Enter');
    ok(!!sePuede && (await js(`JSON.stringify(${H}.progreso.cosas)`)) !== cosas0, `Enter elige la marcada («${(sePuede || '').slice(0, 40)}»)`);
    await js(`${H}.__hud.cerrarAlmacen(); 1`);
    const fer = await enVentana(`H.abrirFeria()`, '#feria-lista');
    if (fer) ok(fer.adentro && !fer.mal.length, `la feria entra y la marca se ve (${fer.n} opciones)${fer.mal.length ? ': ' + fer.mal.join('; ') : ''}`);
    await tecla('Escape');
    const car = await enVentana(`H.__cargas().abrir(H.tren.paradas[0])`, '#cargas-lista');
    ok(!!car && car.adentro && !car.mal.length, `las cargas entran y la marca se ve (${car?.n} opciones)${car?.mal.length ? ': ' + car.mal.join('; ') : ''}`);
    await tecla('Escape'); await js(`${H}.volverAlJuego?.(); 1`); await cuadros(1);

    seccion('los árboles despejados no chocan');
    const arb = await js(`(()=>{ const H = ${H}, T = H.T;
      const lugares = { galpon: T.lugares.galpon, cueva: T.lugares.cueva, ...Object.fromEntries((H.tren?.paradas || []).map((p, i) => ['parada-' + i, p])) };
      let despejados = 0, frenan = 0, cerca = {};
      for (const a of H.veg.arboles) {
        if (!a.choque?.despejado) continue;
        despejados++;
        // con su choque y sin él (radio 0) tiene que dar lo mismo: lo que empuja ahí es el edificio, no el árbol
        const p = { x: a.x + 0.05, y: T.altura(a.x, a.z), z: a.z }, q = { ...p };
        H.col.resolver(p, 0.35, 1.65);
        const r0 = a.choque.r; a.choque.r = 0; H.col.resolver(q, 0.35, 1.65); a.choque.r = r0;
        if (Math.hypot(p.x - q.x, p.z - q.z) > 0.01) frenan++;
        for (const [k, l] of Object.entries(lugares)) if (l && Math.hypot(l.x - a.x, l.z - a.z) < 30) cerca[k] = (cerca[k] || 0) + 1;
      }
      // y un tocón sí frena: se tala uno en pie, lejos de todo
      const ref = T.lugares.refugio;
      const vivo = H.veg.arboles.find((a) => !a.sacado && a.choque && !a.choque.despejado && Math.hypot(a.x - ref.x, a.z - ref.z) > 60);
      H.veg.talar(vivo, { x: 1, z: 0 });
      const q = { x: vivo.x + 0.05, y: T.altura(vivo.x, vivo.z), z: vivo.z };
      H.col.resolver(q, 0.35, 1.65);
      return { despejados, frenan, cerca, tocon: Math.hypot(q.x - vivo.x - 0.05, q.z - vivo.z) > 0.01 };
    })()`);
    ok(arb.despejados > 50 && arb.frenan === 0, `ninguno de los ${arb.despejados} despejados frena (frenan ${arb.frenan}; junto al galpón, la cueva y las estaciones: ${JSON.stringify(arb.cerca)})`);
    ok(arb.tocon, 'un tocón de un árbol talado sí frena');

    seccion('sentado en el refugio con un libro prestado y una visita');
    await js(`${H}.__aldeaMundo().listo().then(() => 1)`);
    const sentado = await js(`(()=>{ const H = ${H}, P = H.progreso, T = H.T, r = T.lugares.refugio, e = H.jugador.estado;
      P.mecanicas = P.mecanicas || {}; P.mecanicas.prestado = { id: 'libro-trochita', dia: P.dia };
      H.__mecanicas().revisar();
      H.jugador.ubicar(r.x + 2.5, r.z + 2.5, 0); e.vel.set(0, 0, 0); e.yaw = 0; e.pitch = -0.05; H.jugador.sentarse(true);
      return e.sentado })()`);
    ok(sentado, 'sentado en el refugio');
    let av = await js(`${H}.__avisoYa()?.texto || ''`);
    ok(/^Leer «La trochita», el libro prestado$/.test(av), `sin visita, leer: «${av}»`);
    // la visita: sentada al lado, a 40° de donde mirás (no de frente)
    const visita = await js(`(()=>{ const H = ${H}, e = H.jugador.estado, n = H.__aldea.mundo().figura('nelida'); if (!n) return null;
      const a = e.yaw + 0.7; n.pos.set(e.pos.x - Math.sin(a) * 1.5, n.pos.y, e.pos.z - Math.cos(a) * 1.5); n.camino = []; return n.nombre })()`);
    ok(!!visita, `la visita: ${visita}`);
    av = await js(`${H}.__avisoYa()?.texto || ''`);
    ok(av === `Hablar con ${visita}`, `con la visita en tu mesa gana la visita: «${av}»`);
    await tecla('KeyE'); await cuadros(2);
    for (let i = 0; i < 10 && !(await js(`!document.getElementById('charla-opciones').classList.contains('oculto')`)); i++) await tecla('KeyE');
    const menu = await js(`[...document.querySelectorAll('#charla-opciones li')].map((li) => li.textContent)`);
    ok(menu.some((t) => /^\d+\. Leer «La trochita», el libro prestado$/.test(t)), `y leer queda en el menú de la charla (${menu.join(' / ')})`);
    await js(`${H}.__cerrarCharla(); ${H}.jugador.sentarse(false); 1`);

    seccion('el mapa dibuja la aldea');
    const mapa = await js(`(()=>{ const H = ${H}; H.abrir('mapa'); const c = document.getElementById('lienzo-mapa'), x = c.getContext('2d');
      const M = H.__aldeaMundo(), W = c.width, Hh = c.height, aP = (p) => [Math.round(((p.x + 512) / 1024) * W), Math.round(((p.z + 512) / 1024) * Hh)];
      const ripio = (lx, lz) => { const [px, py] = aP(M.aMundo(lx, lz)); const d = x.getImageData(px, py, 1, 1).data; return Math.abs(d[0] - 196) < 30 && Math.abs(d[1] - 170) < 30 && Math.abs(d[2] - 124) < 30; };
      const puntos = [[-30, 26], [70, 26], [-20, 52], [60, 52], [-8, 60], [20, 60], [53, 40]];
      const c0 = aP(M.aMundo(23, 35));
      return { calles: puntos.filter(([a, b]) => ripio(a, b)).length, de: puntos.length, recorte: (() => { const k = document.createElement('canvas'); k.width = k.height = 240; k.getContext('2d').drawImage(c, c0[0] - 60, c0[1] - 60, 120, 120, 0, 0, 240, 240); return k.toDataURL('image/png'); })() };
    })()`);
    ok(mapa.calles >= mapa.de - 2, `las calles de ripio en el mapa (${mapa.calles} de ${mapa.de} puntos)`);
    if (process.env.HUMO_MAPA) fs.writeFileSync(process.env.HUMO_MAPA, Buffer.from(mapa.recorte.split(',')[1], 'base64'));
    await js(`${H}.volverAlJuego?.(); 1`);
  } catch (e) {
    errores.push(`excepción: ${e && e.stack ? e.stack : e}`);
  }
  console.log(errores.length ? `\nFALLÓ (${errores.length}):\n${errores.join('\n')}` : '\nOK humo 3.6.2 juego');
  app.exit(errores.length ? 1 : 0);
});

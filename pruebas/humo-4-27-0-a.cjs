// Partida real 4.27.0 (A): los panales silvestres. Un panal de cerca y a 15 m (de día con abejas, de noche sin ellas), sacar miel (aviso, frasco en la mochila),
// el panal vacío al volver, la colmena en el menú de obras de la Historia (y no antes del primer panal), y guardar y cargar con un panal sacado.
// Uso: powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-27-0-a.cjs -Perfil <carpeta propia> -Visible
// Variables: HUMO_MODO=relax|historia (historia por defecto), HUMO_CALIDAD=alta|media|baja, HUMO_SECCIONES=vista,miel,guardado, HUMO_SALIDA=<carpeta>
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const { DETERMINISTA } = require(path.join(raiz, 'pruebas', 'ayuda-determinista.cjs'));
const MODO = process.env.HUMO_MODO || 'historia';
const CALIDAD = process.env.HUMO_CALIDAD || 'media';
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', `humo-4-27-0-a-${MODO}-${CALIDAD}`));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HOJ_PERFIL) app.setPath('userData', path.resolve(process.env.HOJ_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const TOPE_MIN = Number(process.env.HUMO_TOPE_MIN || 9);
setTimeout(() => { console.log(`ERROR: la prueba tardó más de ${TOPE_MIN} minutos`); try { app.exit(2); } catch { process.exit(2); } }, TOPE_MIN * 60 * 1000).unref?.();
const SEC = process.env.HUMO_SECCIONES ? new Set(process.env.HUMO_SECCIONES.split(',')) : null;
const va = (s) => (SEC ? SEC.has(s) : true);

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, P = H.progreso;
  const N = window.__N = {};
  N.cuadros = (n, ms = 50) => window.__cuadros(n, ms);
  N.despejado = () => { const e = H.clima.estado; e.lluvia = 0; e.nublado = 0; e.objetivo = 'despejado'; e.proximo = 'despejado'; e.t = 900; return 1; };
  // parado a d metros del panal i, del lado de afuera del tronco, mirándolo
  N.ver = (i, d, horas) => {
    const s = H.__panales().sitios[i], c = Math.cos(s.ang), sn = Math.sin(s.ang);
    const x = s.pos.x + c * d, z = s.pos.z + sn * d;
    N.despejado(); P.horas = horas;
    H.jugador.ubicar(x, z, Math.atan2(-(s.pos.x - x), -(s.pos.z - z)), null);
    for (let k = 0; k < 2; k++) {
      N.cuadros(40);
      const cam = H.camara.position;
      H.jugador.estado.pitch = Math.atan2(s.pos.y - cam.y, d);
    }
    N.cuadros(30); N.despejado();
    return { id: s.id, x: +x.toFixed(1), z: +z.toFixed(1), panal: [+s.pos.x.toFixed(1), +s.pos.y.toFixed(2), +s.pos.z.toFixed(2)], suelo: +H.T.altura(s.arbol.x, s.arbol.z).toFixed(2) };
  };
  N.pulsar = (code) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true })); return 1; };
  N.notas = () => [...document.querySelectorAll('#notas .nota')].map((n) => n.textContent);
  N.aviso = () => H.__avisoYa();
  N.abejas = () => { const n = H.bichos._debug.nubePanales(); return n ? { malla: n.g.visible, nube: n.puntos.visible } : null; };
  // ¿está la colmena en el menú de obras? (abre con O, va a Trabajo y recorre las páginas)
  N.menuColmena = () => {
    N.pulsar('KeyO'); N.cuadros(4);
    const cats = [...document.querySelectorAll('#obra-categorias button')];
    const trabajo = cats.find((b) => /Trabajo/.test(b.textContent));
    if (!trabajo) return { error: 'sin categoría Trabajo', cats: cats.map((b) => b.textContent) };
    trabajo.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    let hay = false, paginas = 0, nombres = [];
    for (let i = 0; i < 12; i++) {
      const lista = [...document.querySelectorAll('#obra-planos button')].map((b) => b.textContent);
      nombres.push(...lista);
      if (lista.some((t) => /Colmena/.test(t))) hay = true;
      paginas++;
      const sig = [...document.querySelectorAll('#obra-planos button')].find((b) => b.textContent === '›');
      if (!sig || hay) break;
      sig.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    }
    N.pulsar('KeyO'); N.cuadros(4);
    return { hay, paginas, nombres: nombres.length };
  };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [], consola = [];
  const { ipcMain } = require('electron');
  require(path.join(raiz, 'copias-main.cjs')).registrarCopias({ ipcMain, app });
  require(path.join(raiz, 'fotos-main.cjs')).registrarFotos({ ipcMain, app });
  const w = new BrowserWindow({ show: true, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false, preload: path.join(raiz, 'preload.cjs') } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) consola.push(m.slice(0, 300));
  });
  w.webContents.on('render-process-gone', (e, d) => console.log('  PROCESO DE LA PÁGINA CAÍDO:', JSON.stringify(d)));
  let donde = 'carga';
  const js = (c, espera = 240000) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en ${espera / 1000} s (${donde})`)), espera))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const N = (c) => js(`(async () => { const H = window.__hojarasca, N = window.__N, P = H.progreso; return (${c}); })()`);
  const url = path.join(raiz, 'index.html');
  const ajustes = `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${CALIDAD}', clima:'despejado', musica:false, modo:'relax', relaxTipo:'${MODO}', autoCalidad:false, guiaPrimerDia:false})); 1`;
  const captura = async (nombre) => { for (let k = 0; k < 4; k++) { try { await esperar(350 + k * 300); const img = await w.webContents.capturePage(); fs.writeFileSync(path.join(salida, nombre + '.png'), img.toPNG()); console.log(`  (captura ${nombre}.png)`); return; } catch (e) { if (k === 3) console.log('  captura no: ' + e.message); } } };
  const entrar = async () => {
    let listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false); }
    if (!listo) throw new Error('el juego no cargó');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js('window.__sinPausaPorBlur = true; 1');
    await js(DETERMINISTA(42700));
    await js(PAGINA);
    await N('N.cuadros(60)');
    await N(`(() => { for (let i = 0; i < 4; i++) { const b = document.querySelector('#valle-tarjeta:not(.oculto) button[data-valle-opcion]'); if (!b) break; b.click(); N.cuadros(8); } const d = H.__escenas.director; for (let i = 0; i < 6 && d.activa(); i++) { d.saltar(); N.cuadros(10); } return 1 })()`);
  };
  try {
    donde = 'entrar';
    console.log(`— modo ${MODO}, calidad ${CALIDAD}`);
    await w.loadFile(url, { search: '?debug=1' }); await js(ajustes); await w.loadFile(url, { search: '?debug=1' });
    await entrar();
    await N('(() => { N.despejado(); if (P.historia) P.historia.activa = false; return 1 })()');
    const lista = await N('H.__panales().sitios.map((s) => ({ id: s.id, especie: s.arbol.especie, esc: +s.arbol.esc.toFixed(2), alto: +(s.pos.y - s.arbol.y).toFixed(2), x: +s.arbol.x.toFixed(0), z: +s.arbol.z.toFixed(0) }))');
    console.log('  panales:', JSON.stringify(lista));
    ok(lista.length === 8, 'hay 8 panales en el valle');

    if (va('vista')) {
      donde = 'vista';
      console.log('— de cerca y a 15 m, de día y de noche');
      let r = await N('N.ver(0, 4, 12)'); console.log('  ', JSON.stringify(r));
      console.log('  abejas de día:', JSON.stringify(await N('N.abejas()')));
      ok((await N('N.abejas()'))?.nube === true, 'de día, con sol: la nube de abejas está afuera');
      await captura('panal-4m-dia');
      r = await N('N.ver(0, 2.2, 12)'); await captura('panal-2m-dia');
      r = await N('N.ver(0, 15, 12)'); await captura('panal-15m-dia');
      r = await N('N.ver(0, 4, 23.2)');
      console.log('  abejas de noche:', JSON.stringify(await N('N.abejas()')));
      ok((await N('N.abejas()'))?.nube === false, 'de noche: sin abejas');
      await captura('panal-4m-noche');
      r = await N('N.ver(0, 15, 23.2)'); await captura('panal-15m-noche');
      // lluvia: las guarda
      await N('(() => { N.ver(0, 4, 12); const e = H.clima.estado; e.lluvia = 0.9; e.objetivo = "lluvia"; N.cuadros(20); e.lluvia = 0.9; N.cuadros(10); return 1 })()');
      console.log('  abejas con lluvia:', JSON.stringify(await N('N.abejas()')));
      ok((await N('N.abejas()'))?.nube === false, 'con lluvia: sin abejas');
      await captura('panal-4m-lluvia');
    }

    if (va('miel')) {
      donde = 'miel';
      console.log('— sacar miel');
      if (MODO === 'historia') {
        const antes = await N('N.menuColmena()'); console.log('  menú antes del panal:', JSON.stringify(antes));
        ok(antes.hay === false, 'Historia: la colmena NO está en el menú antes del primer panal');
      } else {
        const m = await N('N.menuColmena()'); console.log('  menú en Relax:', JSON.stringify(m));
        ok(m.hay === true, 'Relax: la colmena está en el menú de siempre');
      }
      await N('N.ver(1, 2.0, 12)');
      const av = await N('N.aviso()'); console.log('  aviso:', JSON.stringify(av));
      ok(av && /Sacar miel del panal/.test(av.texto), 'el aviso dice «Sacar miel del panal»');
      const mochilaAntes = await N('P.entradas.miel?.cantidad || 0');
      await N('(() => { N.pulsar("KeyE"); N.cuadros(6); return 1 })()');
      console.log('  notas:', JSON.stringify(await N('N.notas()')));
      await captura('miel-sacada');
      const mochilaDespues = await N('P.entradas.miel?.cantidad || 0');
      ok(mochilaDespues === mochilaAntes + 1, `un frasco más en la mochila (${mochilaAntes} → ${mochilaDespues})`);
      ok(!!(await N('P.entradas["panal-miel"]')), 'el cuaderno anotó «Panal silvestre»');
      console.log('  abejas tras sacar:', JSON.stringify(await N('N.abejas()')));
      if (MODO === 'historia') {
        const nt = (await N('N.notas()')).join(' | ');
        ok(/puñado de abejas/.test(nt), 'Historia: aviso «Te llevás un puñado de abejas»');
        const despues = await N('N.menuColmena()'); console.log('  menú después del panal:', JSON.stringify(despues));
        ok(despues.hay === true, 'Historia: la colmena aparece en el menú después del primer panal');
        await N('N.ver(1, 2.0, 12)');
      }
      const av2 = await N('N.aviso()'); console.log('  aviso con el panal vacío:', JSON.stringify(av2));
      await N('(() => { N.pulsar("KeyE"); N.cuadros(6); return 1 })()');
      const nv = (await N('N.notas()')).join(' | ');
      console.log('  notas:', nv);
      ok(/El panal está vacío/.test(nv), 'al volver: «El panal está vacío»');
      ok((await N('P.entradas.miel?.cantidad || 0')) === mochilaDespues, 'y no suma otro frasco');
      await captura('panal-vacio');
    }

    if (va('todos')) {
      donde = 'todos';
      console.log('— los ocho panales se alcanzan parado en el suelo, a 1,6 m, mirándolos');
      for (let i = 0; i < 8; i++) {
        const r = await N('N.ver(' + i + ', 1.6, 12)');
        const q = await N('(() => { const c = H.__panales().cerca; const e = H.jugador.estado; return { aviso: N.aviso(), d: c ? +c.d.toFixed(2) : null, ojo: +(H.camara.position.y).toFixed(2), panalY: +H.__panales().sitios[' + i + '].pos.y.toFixed(2) } })()');
        console.log('  ', i, JSON.stringify(q));
        ok(!!q.d && q.d <= 2.5, 'panal ' + i + ' a mano a ' + q.d + ' m');
      }
    }
    if (va('guardado')) {
      donde = 'guardado';
      console.log('— guardar y cargar con un panal sacado');
      const est = await N('({ ...H.__panales().estado })'); console.log('  estado de los panales sacados:', JSON.stringify(est));
      ok(Object.keys(est).length >= 1, 'hay un panal sacado');
      await N('(() => { H.guardar(); return 1 })()'); await esperar(1500);
      await w.loadFile(url, { search: '?debug=1' });
      await entrar();
      const est2 = await N('({ ...H.__panales().estado })'); console.log('  tras cargar:', JSON.stringify(est2));
      ok(JSON.stringify(est2) === JSON.stringify(est), 'cargado: el mismo panal sigue sacado');
      await N('N.ver(1, 2.0, 12)');
      const av3 = await N('N.aviso()'); console.log('  aviso tras cargar:', JSON.stringify(av3));
      ok(av3 && /Mirar el panal/.test(av3.texto), 'cargado: ese panal sigue vacío');
      await N('N.ver(2, 1.6, 12)');
      const av4 = await N('N.aviso()'); console.log('  aviso en otro panal:', JSON.stringify(av4));
      ok(av4 && /Sacar miel del panal/.test(av4.texto), 'y otro panal sigue con su miel');
      if (MODO === 'historia') { const m = await N('N.menuColmena()'); ok(m.hay === true, 'Historia, cargado: la colmena sigue en el menú'); }
    }
    if (consola.length) { console.log('— errores de consola:'); for (const c of consola.slice(0, 20)) console.log('  ' + c); }
    ok(consola.length === 0, 'sin errores en la consola');
  } catch (e) { console.log('ERROR: ' + (e && e.stack || e)); errores.push(String(e)); }
  console.log(errores.length ? `FALLAS: ${errores.length}` : 'OK');
  app.exit(errores.length ? 1 : 0);
});

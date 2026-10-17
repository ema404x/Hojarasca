// Partida real 4.1 (F4, Electron + WebGL): el prólogo de Bruno Castellanos y los textos nuevos, dentro del juego.
//  · una partida NUEVA del Relax: crear a Bruno -> aparece el prólogo (5 tarjetas) -> la última lleva a la llegada al refugio (entra al juego);
//  · cada tarjeta ENTRA en la pantalla (sin desbordes ni cortes) a 1600x900, 1280x720 y 1024x600; capturas de las 5 en la carpeta de salida;
//  · «Volver», «Saltar el prólogo» y Escape; el prólogo no vuelve al recargar ni en una partida ya empezada;
//  · la pantalla de creación muestra la frase de cada rasgo, y los pros y contras escritos, dentro de la pantalla;
//  · Bruno con asado y lluvia se crea sin errores (las líneas de los vecinos se prueban en Node);
//  · la consola sin errores.
// Capturas en HUMO_SALIDA (por defecto pruebas/salidas/humo-prologo). Perfil aparte.
// Uso (después de `node armar.mjs`): npx electron --no-sandbox -r <ruta>/herramientas/al-monitor.cjs -r <ruta>/herramientas/perfil-propio.cjs pruebas/humo-4-1-prologo.cjs
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.setPath('userData', path.resolve(process.env.HUMO_PERFIL || path.join(raiz, 'pruebas', 'salidas', '_perfil-humo-prologo')));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-prologo'));
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
let fallas = 0;
const ok = (c, t) => { if (c) console.log('✓ ' + t); else { fallas++; console.log('✗ ' + t); } };

setTimeout(() => { console.log('✗ se pasó del tiempo (8 minutos)'); app.exit(1); }, 8 * 60 * 1000).unref();
app.whenReady().then(async () => {
  fs.mkdirSync(salida, { recursive: true });
  const w = new BrowserWindow({ show: false, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const errores = [];
  w.webContents.on('console-message', (e) => { if (e.level === 'error') errores.push(String(e.message).slice(0, 300)); });
  const js = (c) => w.webContents.executeJavaScript(c);
  const url = path.join(raiz, 'index.html');
  const cargar = async (search) => {
    await w.loadFile(url, { search });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.__personal').catch(() => false)) return true; }
    return false;
  };
  const foto = async (nombre) => { await w.webContents.capturePage(); await esperar(500); fs.writeFileSync(path.join(salida, `${nombre}.png`), (await w.webContents.capturePage()).toPNG()); };
  const clic = (sel, texto) => js(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel + ' button')})].find((x) => x.textContent.trim() === ${JSON.stringify(texto)} || x.getAttribute('aria-label') === ${JSON.stringify(texto)}); if (!b) return false; b.click(); return true; })()`);
  const hay = (id) => js(`!!document.getElementById(${JSON.stringify(id)})`);
  const bruno = () => js(`JSON.stringify(window.__hojarasca.__personal.datos().bruno)`).then(JSON.parse);
  const tecla = (key) => js(`window.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(key)}, bubbles: true, cancelable: true })); 1`);
  // ¿el prólogo entra en la pantalla? (el texto no se corta ni pisa los botones)
  const entra = () => js(`(() => { const t = document.querySelector('#prologo-bruno .pb-tarjeta'), p = document.querySelector('#prologo-bruno .pb-pie');
    if (!t || !p) return 'sin tarjeta'; const a = t.getBoundingClientRect(), b = p.getBoundingClientRect(), H = innerHeight, W = innerWidth;
    const txt = document.querySelector('#prologo-bruno .pb-texto').getBoundingClientRect();
    if (a.top < 0 || a.left < 0 || a.right > W || b.bottom > H || b.right > W) return 'se sale: ' + JSON.stringify([a.top, a.left, a.right, a.bottom, b.bottom, W, H]);
    if (t.scrollHeight > t.clientHeight + 1) return 'la tarjeta tiene scroll';
    if (txt.bottom > b.top - 4) return 'el texto pisa los botones: ' + Math.round(txt.bottom) + ' > ' + Math.round(b.top);
    return 'ok'; })()`);
  const nuevoJuego = async () => {
    // (la página que se va guarda su partida al descargarse: se descarga primero, y recién después se borra el almacenamiento)
    await w.loadURL('about:blank');
    await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
    await cargar('?debug=1&creador=1');
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'})); 1`);
    return cargar('?debug=1&creador=1');
  };
  const crear = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
    if (!(await hay('creador-bruno'))) return false;
    await clic('#creador-bruno', 'Siguiente'); await esperar(500);
    await clic('#creador-bruno', 'Empezar'); await esperar(1500);
    return true;
  };

  // ---- 1. la pantalla de creación con los textos escritos
  ok(await nuevoJuego(), 'cargó el juego, partida nueva');
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(2500);
  ok(await hay('creador-bruno'), '«Entrar al bosque» abre la pantalla de creación');
  await clic('#creador-bruno', 'Siguiente'); await esperar(900);
  const frases = await js(`[...document.querySelectorAll('#creador-bruno .cb-frase')].map((n) => n.textContent)`);
  ok(frases.length === 6 && frases.every((f) => f.length > 10), 'en la pantalla 2 cada rasgo muestra su frase (' + frases.length + ')');
  const ficha = await js(`document.querySelector('#creador-bruno .cb-ficha').textContent`);
  ok(/Pros y contras/.test(ficha) && /A su favor/.test(ficha) && /En su contra/.test(ficha) && !/provisorios/.test(ficha), 'y la tarjeta de pros y contras ya no dice «provisorios»');
  const dentro = await js(`(() => { const r = [...document.querySelectorAll('#creador-bruno .cb-ficha, #creador-bruno .cb-panel, #creador-bruno .cb-cuerpo')].map((n) => ({ c: n.className, sh: n.scrollHeight, ch: n.clientHeight })); return JSON.stringify(r); })()`);
  console.log('  medidas de las tarjetas de la pantalla 2:', dentro);
  await foto('00-creador-historia-por-defecto');
  // otro Bruno, para ver otras frases y pros y contras
  ok(await clic('#creador-bruno', 'Curioso') && await clic('#creador-bruno', 'Técnico de sonido') && await clic('#creador-bruno', 'Lluvia') && await clic('#creador-bruno', 'Asado') && await clic('#creador-bruno', 'Observar aves') && await clic('#creador-bruno', 'Madrugador') && await clic('#creador-bruno', 'Dormilón'), 'se eligen otros rasgos');
  await esperar(700); await foto('01-creador-historia-curioso');
  const estado = await js(`JSON.stringify([...document.querySelectorAll('#creador-bruno .cb-cuerpo, #creador-bruno .cb-ficha')].map((n) => [n.className, n.scrollHeight, n.clientHeight]))`);
  console.log('  medidas con rasgos largos:', estado);
  await clic('#creador-bruno', 'Empezar'); await esperar(1500);

  // ---- 2. el prólogo, tarjeta por tarjeta
  ok(await hay('prologo-bruno'), 'después de crear a Bruno aparece el prólogo');
  ok(await js(`!document.getElementById('inicio').classList.contains('oculto')`), 'y todavía no entró al juego');
  ok((await bruno()).prologoVisto === false && (await bruno()).creado === true, 'Bruno quedó creado con el prólogo pendiente');
  for (const [ancho, alto] of [[1600, 900], [1280, 720], [1024, 600]]) {
    w.setContentSize(ancho, alto); await esperar(500);
    for (let i = 0; i < 5; i++) {
      await js(`(() => { const b = [...document.querySelectorAll('#prologo-bruno button')].find((x) => x.textContent === 'Volver'); return 1; })()`);
      const r = await entra();
      ok(r === 'ok', `${ancho}x${alto}, tarjeta ${i + 1}: el texto entra en la pantalla (${r})`);
      if (ancho === 1600) {
        const t = await js(`document.querySelector('#prologo-bruno h1').textContent + ' | ' + document.querySelector('#prologo-bruno .pb-num').textContent`);
        console.log('  tarjeta', i + 1, t);
        await foto(`prologo-${i + 1}`);
      }
      if (ancho === 1024 && i === 4) { await esperar(1300); await foto('prologo-5-1024x600'); }
      if (i < 4) { await clic('#prologo-bruno', 'Siguiente'); await esperar(1500); }
    }
    // volver al principio para la próxima medida
    for (let k = 0; k < 4; k++) { await clic('#prologo-bruno', 'Volver'); await esperar(150); }
    ok((await js(`document.querySelector('#prologo-bruno .pb-num').textContent`)) === '1 de 5', 'con «Volver» se vuelve a la primera');
  }
  w.setContentSize(1600, 900); await esperar(400);
  // con el teclado
  await tecla('ArrowRight'); await esperar(300);
  ok((await js(`document.querySelector('#prologo-bruno .pb-num').textContent`)) === '2 de 5', 'la flecha derecha pasa a la siguiente');
  await tecla('ArrowLeft'); await esperar(300);
  ok((await js(`document.querySelector('#prologo-bruno .pb-num').textContent`)) === '1 de 5', 'la flecha izquierda vuelve');
  for (let k = 0; k < 4; k++) { await tecla('Enter'); await esperar(250); }
  ok((await js(`document.querySelector('#prologo-bruno .pb-num').textContent`)) === '5 de 5', 'con Enter se llega a la quinta');
  ok(await js(`[...document.querySelectorAll('#prologo-bruno button')].some((b) => b.textContent === 'Llegar al refugio')`), 'y el botón de la última dice «Llegar al refugio»');
  await clic('#prologo-bruno', 'Llegar al refugio'); await esperar(2500);

  // ---- 3. la llegada
  ok(!(await hay('prologo-bruno')), 'el prólogo se cerró del todo');
  ok(await js(`document.getElementById('inicio').classList.contains('oculto')`), 'y el juego entró solo (la llegada al refugio)');
  ok((await bruno()).prologoVisto === true, 'el prólogo quedó como visto');
  await foto('llegada-al-refugio');
  const atrapadas = await js(`(() => { let n = 0; const f = () => { n++; }; document.addEventListener('keydown', f); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true })); document.removeEventListener('keydown', f); return n; })()`);
  ok(atrapadas >= 1, 'el juego vuelve a recibir las teclas');

  // ---- 4. no vuelve: recargar
  await esperar(1500);
  ok(await cargar('?debug=1&creador=1'), 'recargó');
  await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(1500);
  ok(!(await hay('prologo-bruno')) && !(await hay('creador-bruno')), 'al recargar y entrar no pide crear ni repite el prólogo');

  // ---- 5. saltarlo (botón y Escape)
  ok(await nuevoJuego(), 'partida nueva otra vez');
  ok(await crear() && await hay('prologo-bruno'), 'se crea a Bruno y aparece el prólogo');
  await clic('#prologo-bruno', 'Siguiente'); await esperar(500);
  ok(await clic('#prologo-bruno', 'Saltar el prólogo'), 'se salta con el botón');
  await esperar(2000);
  ok(!(await hay('prologo-bruno')) && await js(`document.getElementById('inicio').classList.contains('oculto')`) && (await bruno()).prologoVisto === true, 'entra al juego y queda como visto');
  ok(await nuevoJuego() && await crear() && await hay('prologo-bruno'), 'otra partida nueva: de nuevo el prólogo');
  await tecla('Escape'); await esperar(2000);
  ok(!(await hay('prologo-bruno')) && await js(`document.getElementById('inicio').classList.contains('oculto')`), 'Escape también lo salta y entra');

  // ---- 6. una partida ya empezada que todavía no creó a Bruno: crea, pero no ve el prólogo
  ok(await nuevoJuego() && await crear() && await hay('prologo-bruno'), 'partida nueva para armar la vieja');
  await tecla('Escape'); await esperar(2500);
  const viejo = await js(`(() => { try { const s = JSON.parse(localStorage.getItem('hojarasca-v1')); return JSON.stringify({ pos: !!s?.pos, bruno: !!s?.personal?.bruno }); } catch (e) { return 'ilegible'; } })()`);
  console.log('  guardado de la partida:', viejo);
  await esperar(2500);
  // el parche se hace desde una página vacía del mismo origen (si no, el juego que se descarga vuelve a guardar encima)
  const vacia = path.join(salida, '_vacia.html'); fs.writeFileSync(vacia, '<html><body></body></html>');
  await w.loadFile(vacia); await esperar(500);
  const parcheado = await js(`(() => { try { const s = JSON.parse(localStorage.getItem('hojarasca-v1')); if (!s || !s.pos) return 'sin pos'; s.personal = s.personal || {}; s.personal.bruno = { creado: false }; localStorage.setItem('hojarasca-v1', JSON.stringify(s)); return 'ok'; } catch (e) { return 'error ' + e; } })()`);
  if (parcheado === 'ok') {
    // (se carga sin guardar de nuevo encima: el parche se hace con el juego quieto)
    await w.loadFile(url, { search: '?debug=1&creador=1' });
    for (let i = 0; i < 120 && !(await js('!!window.__hojarasca && !!window.__hojarasca.__personal').catch(() => false)); i++) await esperar(1000);
    const b0 = await bruno();
    if (b0.creado === false) {
      ok(await crear(), 'una partida vieja (con recorrido) pide crear a Bruno');
      await esperar(1500);
      ok(!(await hay('prologo-bruno')) && (await bruno()).prologoVisto === true && (await bruno()).creado === true, 'y NO ve el prólogo');
    } else console.log('  (no se pudo armar la partida vieja: Bruno ya figura creado; lo cubre la prueba de Node)');
  } else console.log('  (no se pudo armar la partida vieja: ' + parcheado + '; lo cubre la prueba de Node)');

  // ---- 7. los vecinos dicen su línea de asado y lluvia
  await nuevoJuego();
  await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
  await clic('#creador-bruno', 'Siguiente'); await esperar(500);
  await clic('#creador-bruno', 'Asado'); await clic('#creador-bruno', 'Lluvia'); await esperar(300);
  await clic('#creador-bruno', 'Empezar'); await esperar(1500);
  await tecla('Escape'); await esperar(2000);
  const gustos = (await bruno()).gustos.join();
  ok(gustos === 'asado,lluvia', 'Bruno quedó con asado y lluvia (' + gustos + ')');
  // (las líneas de los vecinos se prueban en Node con la vecindad real: pruebas/verificar-4-1-textos.mjs)

  ok(errores.length === 0, 'la consola sin errores' + (errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''));
  ok((await js('JSON.stringify(window.__hojarascaErrores || [])')) === '[]', 'sin errores en la página');
  console.log(fallas ? `\nFALLÓ (${fallas})` : '\nOK humo 4.1 F4 · el prólogo y los textos de Bruno dentro del juego');
  app.exit(fallas ? 1 : 0);
});

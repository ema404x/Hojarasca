// 3.8.4 (decisión 36): capturas de los menús en estilo «Cuaderno de campo» a un tamaño de pantalla (por defecto
// 1366×768), y si cada uno entra sin desplazar. Reemplaza a proto-menu-fotos.cjs (la maqueta con ?menu=A ya no existe:
// el estilo es el de siempre). Una corrida por tamaño, con perfil propio y sin al-monitor:
//   set HOJ_PERFIL=<carpeta> & npx electron --no-sandbox -r herramientas\perfil-propio.cjs herramientas\menus-fotos.cjs \
//     --salida=pruebas\salidas\menus-384 --tam=1366x768 [--solo=portada,pausa,...]
// Pantallas: portada, portada-teclas (con el botón «Teclas» abierto), portada-duendes, pausa, ajustes (la pausa con los
// ajustes de la calidad a la vista), personalizar, controles, almacen, cocina, taller, rueda, cuaderno, mapa.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const salida = path.resolve(arg('salida', path.join(raiz, 'pruebas', 'salidas', 'menus-384')));
const [ANCHO, ALTO] = arg('tam', '1366x768').split('x').map(Number);
const solo = arg('solo', '') ? new Set(arg('solo', '').split(',')) : null;
const quiero = (p) => !solo || solo.has(p);
fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  let fallo = false;
  const w = new BrowserWindow({ show: false, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.setContentSize(ANCHO, ALTO);
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext/.test(m)) errores.push(m.slice(0, 200)); });
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error('la página no respondió en 120 s')), 120000))]);
  const H = 'window.__hojarasca';
  const cuadros = (n = 3) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`).catch(() => 0);
  const tecla = (code) => js(`(()=>{ document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', key: '${code}', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', key: '${code}', bubbles: true })); return 1 })()`);
  // ¿entra sin desplazar? (lo que se desplaza adentro de su panel no cuenta: eso es a propósito)
  const medir = (sel) => js(`(()=>{ const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return 'no está';
    const r = el.getBoundingClientRect(); const fuera = [...el.querySelectorAll('*')].filter((x) => { if (!x.getClientRects().length) return false; const b = x.getBoundingClientRect(); return b.width > 0 && (b.right > innerWidth + 1 || b.bottom > innerHeight + 1) && getComputedStyle(x).position !== 'fixed' && !x.closest('[style*=overflow], .ajustes, .rejilla, ul, #personal-contenido, .controles-completos, #teclas-lista, .pausa > div:first-child'); });
    return { caja: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)], desplaza: el.scrollHeight > el.clientHeight + 1, fuera: fuera.slice(0, 4).map((x) => x.tagName + (x.id ? '#' + x.id : '') + '.' + String(x.className).slice(0, 30)) } })()`);
  const foto = async (nombre, sel) => {
    if (!quiero(nombre)) return;
    await js(`document.getElementById('pista-clic')?.classList.add('oculto'); 1`).catch(() => 0);
    await cuadros(2); await esperar(500);
    w.webContents.invalidate();
    await js(`Promise.race([new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(()=>r('ok')))), new Promise((r)=>setTimeout(()=>r('sin cuadros'),1500))])`);
    const img = await w.webContents.capturePage({ x: 0, y: 0, width: ANCHO, height: ALTO });
    const s = img.getSize();
    const png = (s.width === ANCHO && s.height === ALTO ? img : img.resize({ width: ANCHO, height: ALTO, quality: 'best' })).toPNG();
    const archivo = path.join(salida, `${nombre}-${ANCHO}x${ALTO}.png`);
    fs.writeFileSync(archivo, png);
    console.log(`  ${path.basename(archivo)}${sel ? ' · ' + JSON.stringify(await medir(sel)) : ''}`);
  };
  w.webContents.on('did-finish-load', () => w.webContents.enableDeviceEmulation({ screenPosition: 'desktop', screenSize: { width: ANCHO, height: ALTO }, viewSize: { width: ANCHO, height: ALTO }, deviceScaleFactor: 1, viewPosition: { x: 0, y: 0 }, scale: 1 }));
  const url = path.join(raiz, 'index.html');
  // (la ventana oculta no avanza las transiciones de CSS: sin esto, un botón recién elegido sale a medio pintar)
  w.webContents.on('did-finish-load', () => w.webContents.insertCSS('*, *::before, *::after { transition: none !important; animation-duration: 0s !important; }'));
  const cargar = async (ajustes) => {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(${JSON.stringify(Object.assign({ calidad: 'media', clima: 'despejado', musica: false, modo: 'relax', relaxTipo: 'libre', autoCalidad: false, guiaPrimerDia: false, idioma: 'es', estacion: 'otono', limiteFps: 'libre' }, ajustes))})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !document.getElementById("inicio").classList.contains("oculto")').catch(() => false)) return; }
    throw new Error('el juego no llegó a la portada');
  };
  try {
    console.log(`menús a ${ANCHO}×${ALTO}`);
    if (quiero('portada-duendes')) {
      await cargar({ modo: 'desafio' });
      await esperar(2000);
      await foto('portada-duendes', '#inicio');
    }
    await cargar({});
    await esperar(2500);
    console.log(`  vista ${await js('innerWidth + "×" + innerHeight')} · Ink Free: ${await js(`document.fonts.check('20px "Ink Free"')`)}`);
    await foto('portada', '#inicio');
    if (quiero('portada-teclas')) {
      await js(`document.getElementById('btn-teclas-portada').click(); 1`);
      const vis = await js(`getComputedStyle(document.getElementById('btn-teclas-portada')).display !== 'none'`);
      await foto('portada-teclas', '#inicio');
      console.log(`    (botón «Teclas» ${vis ? 'a la vista' : 'escondido: hay lugar para las teclas'})`);
      await js(`document.getElementById('btn-teclas-portada').click(); 1`);
    }
    if (quiero('controles')) {
      await js(`document.getElementById('btn-controles-inicio').click(); 1`);
      await foto('controles', '#controles-completos .panel-modal');
      await js(`document.getElementById('cerrar-controles-completos').click(); 1`);
    }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(5000);
    await js(`(()=>{ try { ${H}.progreso.horas = 16.5 } catch {} ; return 1 })()`);
    await js(`${H}.abrir('pausa'); 1`);
    await esperar(1200);
    await foto('pausa', '.pausa');
    if (quiero('ajustes')) {
      await js(`(()=>{ const f = document.querySelector('[data-ajuste="autoCalidad"]').closest('.fila-ajuste'); f.scrollIntoView({ block: 'center' }); return 1 })()`);
      await foto('ajustes', '.pausa');
    }
    if (quiero('personalizar')) {
      await js(`document.getElementById('btn-personalizar').click(); 1`);
      await esperar(800);
      await foto('personalizar', '#personalizar .panel-modal');
      await js(`${H}.__personal.cerrar(); 1`);
    }
    await js(`${H}.volverAlJuego(); 1`);
    await esperar(800);
    await w.webContents.insertCSS('#pista-clic { display: none !important; }');
    if (quiero('almacen')) {
      await js(`(()=>{ const p = ${H}.progreso; p.ramitas = 6; p.cosas.yerba = 3; for (const [k, n] of [['pinon', 5], ['calafate', 8], ['canto', 4], ['pluma', 2]]) p.entradas[k] = { dia: 1, hora: 9, ...(p.entradas[k] || {}), cantidad: n }; 
        const m = ${H}.est.almacen?.mostrador; if (m) { const j = ${H}.jugador; j.ubicar(m.x, m.z + 1.4, 0); for (let i = 0; i < 3; i++) ${H}.__bucle(); }
        ${H}.__hud.abrirAlmacen(); return 1 })()`);
      await foto('almacen', '#trueque');
      await js(`${H}.__hud.cerrarAlmacen(); 1`);
    }
    if (quiero('cocina')) {
      const r = await js(`(()=>{ const H = ${H}, O = H.obras, P = H.progreso, ref = H.T.lugares.refugio;
        Object.assign(P.materiales, { tronco: 80, tabla: 80, piedra: 80 });
        const p = H.PLANOS.find((q) => q.id === 'parrilla'); if (!p) return 'sin plano';
        O.elegir(p);
        for (const d of [0, 3, 6, 9, 13, 18]) for (let k = 0; k < 8; k++) {
          const a = k * Math.PI / 4, x = ref.x - 14 + Math.sin(a) * d, z = ref.z + 12 + Math.cos(a) * d;
          const r = O.fundar(x, z, 0, H.T.altura(x, z)); if (!r.ok) continue;
          for (let g = 0; g < 12 && r.obra.datos.etapas < r.obra.plano.etapas.length; g++) { if (!O.avanzar(r.obra, P.materiales).ok) break; }
          O.elegir(null); P.obras = O.obras.map((o) => o.datos);
          P.entradas['carne-vaca'] = { dia: 1, hora: 9, cantidad: 2 }; P.entradas.chorizo = { dia: 1, hora: 9, cantidad: 2 }; P.cosas.sal = 2; P.materiales.tronco = 6;
          const j = H.jugador; j.ubicar(x, z + 2.2, 0); for (let i = 0; i < 3; i++) H.__bucle();
          return H.__cocina().usar(r.obra) ? 'ok' : 'no abrió';
        }
        O.elegir(null); return 'sin lugar' })()`);
      if (r !== 'ok') console.log(`  (cocina: ${r})`);
      await foto('cocina', '#cocina-panel');
      await js(`${H}.__cocina().cerrarPanel(); 1`);
    }
    if (quiero('taller')) {
      await js(`${H}.__taller().abrirPanel(); 1`);
      await foto('taller', '#taller-tren-panel');
      await js(`${H}.__taller().cerrarPanel(); 1`);
    }
    if (quiero('cuaderno')) {
      await tecla('KeyJ'); await esperar(600);
      await foto('cuaderno', '#cuaderno .cuaderno');
      await tecla('KeyJ'); await esperar(300);
      await js(`${H}.volverAlJuego(); 1`);
    }
    if (quiero('mapa')) {
      await tecla('KeyM'); await esperar(800);
      await foto('mapa', '#mapa .hoja-mapa');
      await tecla('KeyM'); await esperar(300);
      await js(`${H}.volverAlJuego(); 1`);
    }
    if (quiero('rueda')) {
      // a la plaza de la aldea, una vecina enfrente, E hasta la rueda (como humo-3-7-4-rueda)
      const hay = await js(`!!(${H}.__aldea && ${H}.__social && ${H}.__social())`);
      if (!hay) console.log('  (rueda: no hay aldea en esta partida)');
      else {
        await js(`(()=>{ ${H}.progreso.horas = 11; ${H}.progreso.cosas.yerba = 4; const p = ${H}.__aldea.edificio('plaza'); ${H}.jugador.ubicar(p.x, p.z, 0); return 1 })()`);
        await js(`(()=>{ for (let i = 0; i < 25; i++) { ${H}.__aldea.actualizar(0.6); ${H}.__aldea.mundo()?.prearmar?.(1e6); } return 1 })()`);
        await cuadros(4); await esperar(400); await cuadros(4);
        const vecina = await js(`(()=>{ const g = ${H}.gente.gente.filter((g) => g.claveAldea && !g.dormido && !g.aBordo).map((g) => g.claveAldea); return ['panadera', 'tejedora', 'maestra', 'modista', 'jefe', 'carpintero'].find((k) => g.includes(k)) || g.find((k) => !/nin|chic/.test(k)) || null })()`);
        if (!vecina) console.log('  (rueda: no hay vecinos en la plaza)');
        else {
          const npc = `(${H}.gente.gente.find((g) => g.claveAldea === '${vecina}'))`;
          await js(`(()=>{ const p = ${H}.__aldea.edificio('plaza'); const x = p.x + 3, z = p.z - 2; const n = ${npc}; n.pos.set(x, ${H}.T.altura(x, z), z); n.camino = []; n.ruta = null; n.pose = null; n.dormido = false; n.vel = 0; n.charlaVecinos = false; n.miraFinal = 0; n.rumboObjetivo = 0; n.g.rotation.y = 0;
            const j = ${H}.jugador; j.ubicar(x, z + 1.7, 0); j.estado.pitch = -0.08; j.estado.sentado = false; return 1 })()`);
          await cuadros(4); await esperar(300); await cuadros(4);
          for (let i = 0; i < 10; i++) { await tecla('KeyE'); await esperar(150); if (await js(`${H}.__rueda().abierta`)) break; }
          await foto('rueda', '#rueda');
          await js(`${H}.__cerrarCharla?.(); 1`).catch(() => 0);
        }
      }
    }
    if (errores.length) console.log(`  (errores de consola: ${errores.slice(0, 3).join(' | ')})`);
  } catch (e) { fallo = true; console.log('ERROR: ' + (e && e.stack ? e.stack : e)); }
  app.exit(fallo ? 1 : 0);
});

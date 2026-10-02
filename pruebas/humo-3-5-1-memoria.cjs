// 3.5.1 — partida real de memoria (Electron + WebGL): juega varias vueltas de lo mismo y mira
// que nada crezca sin techo. La primera vuelta calienta (el mundo sube a la placa lo que va
// viendo, los sonidos se arman, el DOM de los paneles se crea); después se mide.
//
// Relax: caminar a los mismos lugares, cambiar hora, clima, estación y distancia de dibujo,
// abrir y cerrar paneles (mochila, Personalizar, cuaderno, mapa, pausa), sacar fotos (sin el
// puente de Electron: la descarga por enlace, que antes se quedaba con ≈2 MB por foto),
// guardar, caballo, kayak, tren y dormir. Desafío: noches con oleada, el arsenal, explosiones,
// y puestos de avanzada que nacen, se rompen y salen de la lista (antes sus mallas quedaban
// colgadas en la escena). Entre vuelta y vuelta: recolección de basura y una muestra.
//
// Uso: npx electron pruebas/humo-3-5-1-memoria.cjs   (usa un perfil propio en la carpeta
// temporal; HUMO_PERFIL=<carpeta> para elegir otro). MEMORIA_VUELTAS=4 para más vueltas.
const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const os = require('os');
const raiz = path.resolve(__dirname, '..');
app.setPath('userData', path.resolve(process.env.HUMO_PERFIL || path.join(os.tmpdir(), 'hojarasca-humo-memoria')));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('enable-precise-memory-info');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('js-flags', '--expose-gc');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const VUELTAS = Math.max(2, Number(process.env.MEMORIA_VUELTAS || 3));

// Los techos (de la vuelta 1, ya caliente, a la última). Una pérdida de verdad los pasa
// holgada: las fotos por enlace sumaban ≈25 MB por vuelta al proceso de la página. Los oyentes
// del Desafío no se miran: cada sonido suelto lleva el suyo hasta que termina y van y vienen.
// Las geometrías tienen margen: el tren y el kayak andan y lo que se ve por primera vez sube a
// la placa una vez (no es pérdida); una pérdida por foto o por panel abierto (decenas por vuelta)
// lo pasa igual.
const TECHO = { heapMB: 6, geometrias: 80, texturas: 2, nodosDom: 150, oyentes: 60, procesoMB: 40, puestos: 4 };

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  const ok = (cond, texto) => { const l = `${cond ? '✓' : '✗'} ${texto}`; pasos.push(l); console.log(l); if (!cond) errores.push(texto); };
  // las descargas de las fotos se tiran (no abren el diálogo de guardar)
  session.defaultSession.on('will-download', (_e, item) => item.setSavePath(path.join(app.getPath('temp'), 'hojarasca-humo-memoria-' + item.getFilename())));
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { backgroundThrottling: false } });
  let donde = 'carga';
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(`[${donde}] ${m.slice(0, 300)}`);
  });
  w.webContents.on('render-process-gone', (_e, d) => errores.push('el proceso de la página se cayó: ' + JSON.stringify(d)));
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c, true),
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 120 s (${donde})`)), 120000))]);
  const H = 'window.__hojarasca';
  const url = path.join(raiz, 'index.html');
  const cargar = async (modo) => {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'variable', musica:true, modo:'${modo}', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
    await js(`(async()=>{ const H=${H}; H.ajustes.limiteFps='libre'; try { if (!H.sonido.ctx) H.sonido.iniciar?.(); await H.sonido.ctx?.resume?.(); } catch {} return 1 })()`);
  };
  const tecla = (c) => js(`(()=>{ document.dispatchEvent(new KeyboardEvent('keydown',{code:'${c}',bubbles:true})); document.dispatchEvent(new KeyboardEvent('keyup',{code:'${c}',bubbles:true})); return 1 })()`);
  const bajar = (c) => js(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'${c}',bubbles:true})); 1`);
  const subir = (c) => js(`document.dispatchEvent(new KeyboardEvent('keyup',{code:'${c}',bubbles:true})); 1`);
  const cuadros = (n) => js(`(async ()=>{ const H = ${H}; for (let i = 0; i < ${n}; i++) { H.__bucle(); if (i % 4 === 3) await new Promise(r => setTimeout(r, 0)); } return 1 })()`);
  const volver = () => js(`(()=>{ try { ${H}.volverAlJuego(); } catch {} return 1 })()`);
  const dbg = w.webContents.debugger;
  dbg.attach('1.3');
  const muestra = async () => {
    for (let i = 0; i < 3; i++) { await dbg.sendCommand('HeapProfiler.collectGarbage'); await esperar(200); }
    const p = await js(`(()=>{ const H = ${H}, R = H.renderer; let obj = 0; H.escena.traverse(() => obj++);
      return { heapMB: performance.memory.usedJSHeapSize / 1048576, geometrias: R.info.memory.geometries, texturas: R.info.memory.textures, obj,
        puestos: H.escena.children.filter((o) => o.name === 'puesto-invasor').length } })()`);
    const dc = await dbg.sendCommand('Memory.getDOMCounters').catch(() => ({}));
    const r = app.getAppMetrics().find((m) => m.pid === w.webContents.getOSProcessId());
    return { ...p, nodosDom: dc.nodes || 0, oyentes: dc.jsEventListeners || 0, procesoMB: r ? (r.memory.privateBytes || r.memory.workingSetSize) / 1024 : 0 };
  };
  const ver = (m) => `heap ${m.heapMB.toFixed(1)} MB · ${m.geometrias} geometrías · ${m.texturas} texturas · ${m.obj} objetos · ${m.nodosDom} nodos · ${m.oyentes} oyentes · proceso ${m.procesoMB.toFixed(0)} MB`;
  const comparar = (modo, a, b, claves) => {
    for (const k of claves) {
      const d = b[k] - a[k];
      ok(d <= TECHO[k], `${modo}: ${k} no crece sin techo (${typeof a[k] === 'number' ? +a[k].toFixed(1) : a[k]} → ${+b[k].toFixed(1)}, techo +${TECHO[k]})`);
    }
  };

  // ---------------------------------------------------------------- Relax
  const LUGARES = [[-120, 80], [200, -60], [60, 260], [-260, -180], [300, 150], [10, -300]];
  const vueltaRelax = async () => {
    for (const [x, z] of LUGARES) {
      await js(`(()=>{ const H=${H}; H.jugador.ubicar(${x}, ${z}, 0.7); return 1 })()`);
      await bajar('KeyW'); await cuadros(40); await subir('KeyW');
    }
    for (let h = 0; h < 24; h += 4) {
      const c = [['despejado', 0, 0.1], ['nublado', 0, 0.7], ['lluvia', 1, 0.95]][(h / 4) % 3], e = ['verano', 'otono', 'invierno'][(h / 4) % 3];
      await js(`(()=>{ const H=${H}; H.progreso.horas=${h}; H.ajustes.estacion='${e}'; const E=H.clima.estado; E.objetivo='${c[0]}'; E.lluvia=${c[1]}; E.nublado=${c[2]}; return 1 })()`);
      await cuadros(20);
    }
    await js(`(()=>{ const H=${H}; H.ajustes.estacion='auto'; H.progreso.horas=12; return 1 })()`);
    for (const [d, pl] of [[2, 'cerca'], [10, 'muylejos'], ['calidad', 'normal']]) {
      await js(`(()=>{ const H=${H}; H.ajustes.distancia=${JSON.stringify(d)}; H.ajustes.distanciaPlantas='${pl}'; H.aplicarDistancias(true); return 1 })()`);
      await cuadros(25);
    }
    for (const k of ['KeyI', 'F5', 'KeyJ', 'KeyM']) { await tecla(k); await cuadros(3); await tecla(k); await cuadros(2); }
    await tecla('Escape'); await cuadros(3); await esperar(450); await tecla('Escape'); await volver(); await cuadros(2);
    for (let k = 0; k < 12; k++) { await tecla('KeyP'); await cuadros(3); await esperar(150); }
    await js(`(()=>{ ${H}.guardar(); return 1 })()`);
    await js(`(()=>{ const H=${H}; try { H.montar(); } catch {} return 1 })()`); await bajar('KeyW'); await cuadros(40); await subir('KeyW');
    await js(`(()=>{ const H=${H}; try { H.desmontar(); } catch {} try { H.kayak.subir(H.jugador); } catch {} return 1 })()`); await bajar('KeyW'); await cuadros(30); await subir('KeyW');
    await js(`(()=>{ const H=${H}; try { if (H.jugador.estado.enKayak) H.kayak.bajar(H.jugador); } catch {} try { H.__subirALaCabina(); } catch {} return 1 })()`); await bajar('KeyW'); await cuadros(40); await subir('KeyW');
    await js(`(()=>{ const H=${H}; try { if (H.jugador.estado.enTren) { H.tren.est.vel = 0; H.__bajarDeLaCabina(); } } catch {} H.jugador.estado.enTren = false; const r=H.T.lugares.refugio; H.jugador.ubicar(r.x+2, r.z+2, 0); H.progreso.horas=22.5; try { H.__dormir(); } catch {} return 1 })()`);
    await esperar(1200); await cuadros(10); await volver();
  };

  // ---------------------------------------------------------------- Desafío
  const vueltaDesafio = async () => {
    await js(`(()=>{ const H=${H}, P=H.progreso; P.desafio.salud=100; P.desafio.oleadas=6; P.dia++; P.horas=19.4; for(let i=0;i<30;i++){ P.horas+=0.01; H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); } P.horas=20.49; return 1 })()`);
    for (let k = 0; k < 8; k++) {
      await js(`(()=>{ const H=${H}, P=H.progreso; for(let i=0;i<40;i++){ P.desafio.salud=100; P.horas += 0.05*24/1800*6; H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); }
        Object.assign(P.desafio, { granadas: 10, virotes: 30, jabalinas: 10, bengalas: 8, humos: 8, flechas: 40 }); try { H.desafio.atacar(['granada','ballesta','bengala','humo','jabalina','arco'][${k} % 6]); } catch {} return 1 })()`);
      await cuadros(12);
    }
    await js(`(()=>{ const H=${H}, P=H.progreso; P.dia++; P.horas=5.98; for(let i=0;i<80;i++){ P.horas += 0.002; H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); }
      for (const a of H.desafio.aliens) { a.estado='irse'; a.t=9; } H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); P.horas=10; return 1 })()`);
    // puestos que nacen, se rompen y se recortan de la lista (como al cargar la partida)
    await js(`(()=>{ const H=${H}, est=H.progreso.desafio.puestos, M=H.desafio.puestosMundo; if (!est || !M) return 0;
      for (let k = 0; k < 6; k++) {
        const id = est.proximoId++;
        est.lista.push({ id, x: 40 + k * 15, z: 60, nivel: 1, nacio: 1, crecio: 1, guardias: 0, visto: false, roto: false,
          estructuras: [{ tipo: 'aguja', dx: 0, dz: 0, vida: 10, max: 10 }, { tipo: 'vaina', dx: 2, dz: 1, vida: 5, max: 5 }] });
        M.sincronizar();
        const p = est.lista[est.lista.length - 1]; p.roto = true; for (const e of p.estructuras) e.vida = 0;
        const rotos = est.lista.filter((q) => q.roto); if (rotos.length > 4) est.lista = est.lista.filter((q) => !q.roto || rotos.slice(-4).includes(q));
        M.sincronizar();
      } return 1 })()`);
    await cuadros(20);
    for (const k of ['KeyI', 'KeyJ', 'KeyM']) { await tecla(k); await cuadros(3); await tecla(k); await cuadros(2); }
    await js(`(()=>{ const H=${H}; H.desafio.abrirTaller(true); H.desafio.abrirTaller(false); H.guardar(); return 1 })()`);
  };

  try {
    for (const [modo, vuelta] of [['relax', vueltaRelax], ['desafio', vueltaDesafio]]) {
      donde = modo + ' (carga)';
      await cargar(modo);
      if (modo === 'desafio') await js(`(()=>{ const P=${H}.progreso; for (const k of ['arco','ballesta','granada','humo','bengala','jabalina']) P.cosas[k]=1; return 1 })()`);
      donde = modo + ' vuelta 0'; await vuelta();   // calienta
      donde = modo + ' vuelta 1'; await vuelta();
      const a = await muestra();
      console.log(`  ${modo} tras la vuelta 1: ${ver(a)}`);
      for (let v = 2; v <= VUELTAS + 1; v++) { donde = `${modo} vuelta ${v}`; await vuelta(); console.log(`  ${modo} tras la vuelta ${v}: ${ver(await muestra())}`); }
      const b = await muestra();
      comparar(modo, a, b, modo === 'relax' ? ['heapMB', 'geometrias', 'texturas', 'nodosDom', 'oyentes', 'procesoMB'] : ['heapMB', 'geometrias', 'texturas', 'nodosDom', 'procesoMB']);
      if (modo === 'desafio') ok(b.puestos <= TECHO.puestos + 4, `desafio: los puestos rotos que salen de la lista se van de la escena (${b.puestos} grupos con ${VUELTAS + 2} vueltas de 6 puestos)`);
    }
  } catch (e) { errores.push('excepción: ' + (e && e.stack ? e.stack : e)); }
  if (errores.length) { console.log(`\nERRORES (${errores.length}):\n` + errores.join('\n')); app.exit(1); return; }
  console.log(`\n✓ memoria: ${pasos.length} controles en verde`);
  app.exit(0);
});

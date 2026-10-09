// 3.8.3 (base): lo transversal, en el juego de verdad (Electron + WebGL):
//   1. cerrar el juego en la portada de una partida nueva no la da por empezada (Relax y Desafío: el código y el mapa);
//   2. F2 en la portada no prende el modo foto (y en el juego sí);
//   3. después de una recuperación (?recuperado=caida), recargar el juego no vuelve a avisar que se cayó;
//   4. partidas con la forma de versiones viejas (1.x, 2.x con canteros, 3.1 con pueblo, Desafío sin mapa, un día enorme)
//      arrancan, se juegan y se guardan sin errores;
//   5. en pantallas chicas (la ventana mínima, una notebook de 1366×768 al 125%) y con la letra grande o enorme, todos
//      los botones de la portada y de la pausa se pueden alcanzar (están en la pantalla o en un panel que se desplaza).
// Uso: npx electron pruebas/humo-3-8-3-base.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: false, width: 1024, height: 640, webPreferences: { backgroundThrottling: false } });
  let donde = 'carga';
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(`[${donde}] ${m.slice(0, 300)}`);
  });
  const js = (c) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 90 s (${donde})`)), 90000)),
  ]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const url = path.join(raiz, 'index.html');
  const listo = async () => { for (let i = 0; i < 300; i++) { await esperar(500); if (await js('!!(window.__hojarasca && window.__hojarasca.__caidas && window.__hojarasca.__caidas.modo() === "inicio")').catch(() => false)) return; } throw new Error('no llegó a la portada'); };
  const abrir = async (q = '?debug=1') => { await w.loadFile(url, { search: q }); await listo(); };
  const ajustes = (modo) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'${modo}', autoCalidad:false, guiaPrimerDia:false}));`;
  try {
    for (const [modo, clave] of process.env.HOJ_SOLO_PANTALLAS ? [] : [['relax', 'hojarasca-v1'], ['desafio', 'hojarasca-desafio-v1']]) {
      donde = `${modo}: portada`;
      await w.loadFile(url, { search: '?debug=1' }); await esperar(300);
      await js(`localStorage.clear(); ${ajustes(modo)} 1`);
      await abrir();
      // cerrar en la portada: el guardado de beforeunload
      await js(`window.__hojarasca.guardar(); 1`);
      const g = await js(`JSON.parse(localStorage.getItem('${clave}') || 'null')`);
      ok(g && g.pos === null, `${modo}: cerrar en la portada guarda sin posición (${JSON.stringify(g && g.pos)})`);
      await abrir();
      const r = await js(`(()=>({ entrar: document.getElementById('btn-entrar').textContent, nuevo: !document.getElementById('btn-nuevo').classList.contains('oculto'), codigo: !document.getElementById('codigo-partida')?.disabled }))()`);
      ok(!/^Seguir/.test(r.entrar) && (modo === 'relax' || r.codigo), `${modo}: la portada no la da por empezada (${JSON.stringify(r)})`);
      // F2 en la portada no hace nada
      const f = await js(`(async()=>{ document.dispatchEvent(new KeyboardEvent('keydown',{code:'F2',bubbles:true})); await new Promise(r=>setTimeout(r,100));
        const H = window.__hojarasca; return { activo: H.__foto().activo, modo: H.__caidas.modo(), panel: !document.getElementById('foto-panel').classList.contains('oculto') }; })()`);
      ok(!f.activo && !f.panel && f.modo === 'inicio', `${modo}: F2 en la portada no prende el modo foto (${JSON.stringify(f)})`);
      // entrar: ahora sí guarda la posición; F2 sí anda
      donde = `${modo}: juego`;
      await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(1500);
      const d = await js(`(async()=>{ const H = window.__hojarasca; for (let i = 0; i < 5; i++) { H.__bucle(); await new Promise(r=>setTimeout(r,20)); }
        document.dispatchEvent(new KeyboardEvent('keydown',{code:'F2',bubbles:true})); await new Promise(r=>setTimeout(r,100)); const foto = H.__foto().activo;
        document.dispatchEvent(new KeyboardEvent('keydown',{code:'F2',bubbles:true})); await new Promise(r=>setTimeout(r,100));
        H.guardar(); const p = JSON.parse(localStorage.getItem('${clave}')); return { foto, pos: !!p.pos, semilla: p.desafio ? p.desafio.semilla || null : 'relax', mapa: p.desafio ? !!p.desafio.mapa : 'relax' }; })()`);
      ok(d.foto && d.pos && d.semilla && d.mapa, `${modo}: jugando, F2 anda y se guarda la posición (y el código y el mapa) (${JSON.stringify(d)})`);
    }
    // 3. el aviso de recuperación, sólo en la apertura recuperada
    donde = 'recuperado';
    await abrir('?debug=1&recuperado=caida');
    const a = await js(`!document.getElementById('aviso-recuperado').classList.contains('oculto')`);
    ok(a, 'abierta por la recuperación: avisa');
    await js(`location.reload(); 1`).catch(() => {}); await esperar(500); await listo();
    const b = await js(`({ busca: location.search, aviso: !document.getElementById('aviso-recuperado').classList.contains('oculto') })`);
    ok(/recuperado=caida/.test(b.busca) && !b.aviso, `recargada por el juego: no vuelve a avisar (${JSON.stringify(b)})`);
    // 4. partidas viejas (R = el refugio, para poner las obras cerca)
    const VIEJAS = [
      ['relax', 'hojarasca-v1', '1.x mínima', `({ entradas: { calafate: { dia: 1, hora: 9 } }, dia: 3, horas: 10, pos: { x: R.x + 3, z: R.z + 3 }, tomados: ['a'] })`],
      ['relax', 'hojarasca-v1', '2.x con canteros en las obras', `({ dia: 5, horas: 12, pos: { x: R.x + 3, z: R.z + 3 }, obras: [{ plano: 'huerta', x: R.x + 8, z: R.z + 4, rot: 0, etapas: 1, huerta: { planta: 'frutilla', crecido: 0.5 } }, { plano: 'huerta', x: R.x + 10, z: R.z + 4, rot: 0, etapas: 1, huerta: { planta: 'constructor' } }], materiales: { tronco: 3 } })`],
      ['relax', 'hojarasca-v1', '3.1 con pueblo', `({ dia: 20, horas: 9, pos: { x: R.x + 3, z: R.z + 3 }, pueblo: { pobladores: [{ clave: 'panadera', dia: 4 }, { clave: 'nadie' }, 'x'], llegando: { clave: 'herrero', dia: 19 } }, oficios: { puntos: { lena: 'x' } } })`],
      ['relax', 'hojarasca-v1', 'día enorme', `({ dia: 9e15, horas: 23.99, pos: { x: R.x + 3, z: R.z + 3 } })`],
      ['desafio', 'hojarasca-desafio-v1', 'Desafío de antes del mapa', `({ dia: 4, horas: 21, pos: { x: R.x + 3, z: R.z + 3 }, desafio: { noches: 2, oleadas: 2, salud: 50 } })`],
      ['desafio', 'hojarasca-desafio-v1', 'Desafío con día enorme', `({ dia: 9e15, horas: 21.5, pos: { x: R.x + 3, z: R.z + 3 }, desafio: { noches: 1e9, oleadas: 1e9 } })`],
    ];
    for (const [modo, clave, nombre, armar] of process.env.HOJ_SOLO_PANTALLAS ? [] : VIEJAS) {
      donde = `vieja: ${nombre}`;
      const antes = errores.length;
      await w.loadFile(url, { search: '?debug=1' }); await esperar(300);
      await js(`localStorage.clear(); ${ajustes(modo)} 1`);
      await abrir();
      // (y esta página, al irse, ya no escribe esa clave: su guardado de beforeunload pisaba la partida vieja)
      await js(`(()=>{ const R = window.__hojarasca.T.lugares.refugio; localStorage.setItem('${clave}', JSON.stringify(${armar}));
        const poner = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === '${clave}' || k === '${clave}-backup') return; return poner.call(this, k, v); }; return 1; })()`);
      await abrir();
      await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(1500);
      const r = await js(`(async()=>{ const H = window.__hojarasca;
        for (const t of ['KeyW', 'KeyE', 'KeyI', 'Escape', 'KeyJ', 'Escape', 'KeyM', 'Escape']) {
          document.dispatchEvent(new KeyboardEvent('keydown', { code: t, bubbles: true }));
          for (let i = 0; i < 4; i++) { H.__bucle(); await new Promise(r => setTimeout(r, 15)); }
          document.dispatchEvent(new KeyboardEvent('keyup', { code: t, bubbles: true }));
        }
        H.progreso.horas = 23.95; for (let i = 0; i < 30; i++) { H.__bucle(); await new Promise(r => setTimeout(r, 10)); }
        const g = H.guardar(); const p = H.jugador.estado.pos;
        return { g, finito: [p.x, p.y, p.z, H.progreso.horas, H.progreso.dia].every(Number.isFinite), dia: H.progreso.dia }; })()`);
      ok(r.g && r.finito && r.dia > 1 && errores.length === antes, `vieja: ${nombre} → arranca, juega y guarda (${JSON.stringify(r)})`);
    }
    // 5. pantallas chicas: cada botón visible de la portada y de la pausa, alcanzable
    donde = 'pantallas chicas';
    // alcanzable: después de llevarlo a la vista (scrollIntoView mueve todo lo que se desplaza) queda dentro de la pantalla
    const alcanzables = (id) => `(()=>{ const caja = document.getElementById('${id}'); const fuera = [];
      for (const b of caja.querySelectorAll('button')) { if (b.closest('.oculto') || !b.offsetParent) continue;
        if (b.getBoundingClientRect().width === 0) continue;
        b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); const r = b.getBoundingClientRect();
        if (r.bottom > innerHeight + 1 || r.top < -1 || r.right > innerWidth + 1 || r.left < -1) fuera.push((b.id || b.textContent.trim()).slice(0, 30) + '@' + Math.round(r.bottom)); }
      return { alto: innerHeight, ancho: innerWidth, fuera }; })()`;
    for (const [ancho, alto] of [[1024, 640], [1093, 550]]) {
      for (const letra of ['normal', 'grande', 'enorme']) {
        await w.loadFile(url, { search: '?debug=1' }); await esperar(300);
        await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, tamanoLetra:'${letra}'})); 1`);
        w.setContentSize(ancho, alto);
        await abrir();
        const ini = await js(alcanzables('inicio'));
        await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(1200);
        await js(`window.__hojarasca.abrir('pausa'); 1`); await esperar(300);
        const pau = await js(alcanzables('pausa'));
        await js(`document.getElementById('btn-personalizar').click(); 1`); await esperar(300);
        const per = await js(alcanzables('personalizar'));
        await js(`document.getElementById('cerrar-personalizar').click(); document.getElementById('btn-guia').click(); 1`); await esperar(300);
        const gui = await js(alcanzables('guia'));
        await js(`document.getElementById('cerrar-guia').click(); 1`);
        ok(!ini.fuera.length && !pau.fuera.length && !per.fuera.length && !gui.fuera.length, `${ancho}×${alto}, letra ${letra}: portada, pausa, Personalizar y guía alcanzables (${JSON.stringify({ ini: ini.fuera, pau: pau.fuera, per: per.fuera, gui: gui.fuera })})`);
      }
    }
    w.setContentSize(1024, 640);
  } catch (e) { errores.push('excepción: ' + (e && e.message ? e.message : e)); }
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});

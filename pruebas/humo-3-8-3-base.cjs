// 3.8.3 (base): lo transversal, en el juego de verdad (Electron + WebGL):
//   1. cerrar el juego en la portada de una partida nueva no la da por empezada (Relax y Desafío: el código y el mapa);
//   2. F2 en la portada no prende el modo foto (y en el juego sí);
//   3. después de una recuperación (?recuperado=caida), recargar el juego no vuelve a avisar que se cayó.
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
    for (const [modo, clave] of [['relax', 'hojarasca-v1'], ['desafio', 'hojarasca-desafio-v1']]) {
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
  } catch (e) { errores.push('excepción: ' + (e && e.message ? e.message : e)); }
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});

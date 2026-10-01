// Partida real: las tres ranuras de guardado por modo (menú, cambio y borrado).
// Uso: npx electron pruebas/humo-partidas.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
// sólo pruebas: en algunos entornos el renderer con sandbox no carga ni una página (ERR_FAILED)
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  const w = new BrowserWindow({ show: false, width: 1024, height: 640, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill/.test(m)) errores.push(m.slice(0, 300));
  });
  const js = (c) => w.webContents.executeJavaScript(c);
  const ok = (cond, texto) => { pasos.push(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const url = path.join(raiz, 'index.html');
  const cargar = async () => {
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 240; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) return true; }
    return false;
  };
  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'relax'})); 1`);
    ok(await cargar(), 'carga con la partida 1');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(1500);

    // deja algo hecho en la partida 1 y vuelve a la portada (la pausa guarda la miniatura)
    await js(`(()=>{const H=window.__hojarasca; H.progreso.dia=4; H.progreso.ramitas=9; H.guardar(); document.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',bubbles:true})); return 1})()`);
    await esperar(800);
    const menu = await js(`(()=>{document.getElementById('btn-inicio').click();
      document.getElementById('btn-partidas-inicio').click();
      const filas=[...document.querySelectorAll('#partidas-lista .partida')];
      return {abierto:!document.getElementById('partidas').classList.contains('oculto'), filas:filas.length,
        texto:filas.map(f=>f.querySelector('.datos').textContent.replace(/\\s+/g,' ').trim()),
        vista:!!document.querySelector('#partidas-lista img'),
        clave1:!!localStorage.getItem('hojarasca-v1'), clave2:!!localStorage.getItem('hojarasca-p2-v1')}})()`);
    ok(menu.abierto && menu.filas === 3, `el menú muestra 3 partidas (${menu.filas})`);
    ok(/Partida 1 · en uso/.test(menu.texto[0]) && /Día 4/.test(menu.texto[0]), `la partida 1 muestra el día (${menu.texto[0]})`);
    ok(/Vacía/.test(menu.texto[1]) && /Vacía/.test(menu.texto[2]), 'las otras dos están vacías');
    ok(menu.vista, 'la partida en uso quedó con su miniatura');
    ok(menu.clave1 && !menu.clave2, 'la partida 1 usa las claves de siempre');

    // pasar a la partida 2: recarga el mundo con una partida nueva
    await js(`document.querySelector('[data-partida-jugar="2"]').click(); 1`);
    await esperar(1500);
    ok(await cargar(), 'cambiar de partida recarga el juego');
    const p2 = await js(`(()=>{const H=window.__hojarasca; return {ranura:H.ajustes.ranura, dia:H.progreso.dia, ramitas:H.progreso.ramitas,
      entrar:document.getElementById('btn-entrar').textContent}})()`);
    ok(p2.ranura === 2 && p2.dia === 1 && p2.ramitas === 0, `la partida 2 arranca de cero (${JSON.stringify(p2)})`);
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(1200);
    await js(`(()=>{const H=window.__hojarasca; H.progreso.dia=2; H.guardar(); return 1})()`);
    const claves = await js(`(()=>({p1:!!localStorage.getItem('hojarasca-v1'), p2:!!localStorage.getItem('hojarasca-p2-v1'),
      d1:JSON.parse(localStorage.getItem('hojarasca-v1')).dia, d2:JSON.parse(localStorage.getItem('hojarasca-p2-v1')).dia}))()`);
    ok(claves.p1 && claves.p2 && claves.d1 === 4 && claves.d2 === 2, `cada partida guarda en su clave (${JSON.stringify(claves)})`);

    // el Desafío tiene sus propias tres
    await js(`(()=>{const H=window.__hojarasca; H.guardar(); document.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',bubbles:true}));
      document.getElementById('btn-inicio').click();
      document.querySelector('[data-ajuste="modo"] button[data-valor="desafio"]').click(); return 1})()`);
    await esperar(1500);
    ok(await cargar(), 'el Desafío carga en su propia partida');
    const des = await js(`(()=>{const H=window.__hojarasca; document.getElementById('btn-partidas-inicio').click();
      const filas=[...document.querySelectorAll('#partidas-lista .partida')].map(f=>f.querySelector('.datos').textContent.replace(/\\s+/g,' ').trim());
      return {modo:H.modoJuego, ranura:H.ajustes.ranura, filas, clave:!!localStorage.getItem('hojarasca-desafio-p2-v1')}})()`);
    ok(des.modo === 'desafio' && des.ranura === 2, 'mantiene la ranura elegida al cambiar de modo');
    ok(/Vacía/.test(des.filas[0]), 'las partidas del Desafío son otras');

    // borrar la partida 1 del Relax no toca la 2
    await js(`(()=>{window.confirm=()=>true; document.querySelector('[data-partida-borrar="1"]')?.click(); return 1})()`).catch(() => {});
    await esperar(400);
    const tras = await js(`(()=>({relax1:!!localStorage.getItem('hojarasca-v1'), relax2:!!localStorage.getItem('hojarasca-p2-v1')}))()`);
    ok(tras.relax1 && tras.relax2, 'borrar en el Desafío no toca las partidas del Relax');
  } catch (e) {
    errores.push('excepción: ' + (e?.message || e));
  }
  console.log(pasos.join('\n'));
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});

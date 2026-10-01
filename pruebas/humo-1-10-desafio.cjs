// Prueba de partida real de lo que la 1.10 le suma al Desafío (Electron + WebGL):
// el excavador que pasa por debajo de la empalizada, el pozo que deja y se tapa, y la
// Nueva partida+ que vuelve a empezar con lo ganado.
// Uso: npx electron pruebas/humo-1-10-desafio.cjs   → pruebas/salidas/1-10-desafio/
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(__dirname, 'salidas', '1-10-desafio');
fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Error|Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = '';
  const js = (c, limite = 60000) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, rej) => setTimeout(() => rej(new Error(`sin respuesta ${limite / 1000}s en ${donde}`)), limite)),
  ]);
  const ok = (cond, texto) => { pasos.push(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const foto = async (nombre) => fs.writeFileSync(path.join(salida, nombre + '.jpg'), (await w.webContents.capturePage()).toJPEG(72));
  const url = path.join(raiz, 'index.html');
  const cargar = async () => {
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 240; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) return true; }
    return false;
  };
  // La ventana oculta corre pocos cuadros: el Desafío se simula a pasos fijos.
  const simular = (seg) => js(`(()=>{const H=window.__hojarasca; for(let i=0;i<${Math.round(seg / 0.05)};i++) H.desafio.actualizar(0.05,{noche:1}); return 1})()`);

  try {
    donde = 'cargar';
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'desafio'})); 1`);
    ok(await cargar(), 'el Desafío carga');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2000);

    // 2.2: el excavador de la 1.10 (con pozos) dejó su lugar al de la 2.1: lo prueban
    // humo-2-1.cjs y, con el cimiento, humo-1-11-desafio.cjs. Acá queda la otra vuelta.
    // ================================================================ Nueva partida+
    donde = 'vuelta';
    await js(`(()=>{const H=window.__hojarasca, P=H.progreso, D=P.desafio;
      P.cosas.lanza=1; P.cosas.lanzaCristal=1; P.cosas.arco=1; D.planos=['escudo'];
      D.victoria=true; D.nido={x:0,z:0,pistas:3,cercoX:0,cercoZ:0,camaras:[0,0,0],caido:true};
      H.abrir('pausa'); return 1})()`);
    await esperar(800);
    const boton = await js(`!document.getElementById('btn-vuelta').classList.contains('oculto')`);
    ok(boton, 'con el Desafío terminado, la pausa ofrece otra vuelta');
    await js(`window.confirm = () => true; window.__hojarasca.otraVuelta(); 1`);
    await esperar(3000);
    ok(await cargar().catch(() => false) || await js('!!window.__hojarasca').catch(() => false), 'arranca la vuelta nueva');
    await js(`document.getElementById('btn-entrar')?.click(); 1`); await esperar(2500);
    const v = await js(`(()=>{const H=window.__hojarasca, P=H.progreso, D=P.desafio;
      return {vuelta:D.vuelta, lanza:!!P.cosas.lanza, cristal:!!P.cosas.lanzaCristal, planos:D.planos, obras:P.obras.length, victoria:D.victoria, dia:P.dia,
        hud:document.getElementById('desafio-estado')?.textContent||''}})()`);
    ok(v.vuelta === 1 && !v.victoria && v.dia === 1, `vuelve a empezar desde el día uno, en la vuelta 2 (${JSON.stringify({ vuelta: v.vuelta, dia: v.dia })})`);
    ok(v.lanza && v.cristal && v.planos?.includes('escudo'), 'con la lanza, su punta de cristal y los planos');
    ok(v.obras === 0, 'sin la base de antes');
    ok(/Vuelta 2/.test(v.hud), `el HUD lo dice ("${v.hud}")`);
    const duros = await js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado;
      const a=H.desafio.invocar('rastreador', js.pos.x+30, js.pos.z); return {vida:a.vida, base:a.def.vida}})()`);
    ok(duros.vida > duros.base, `y los invasores aguantan más (${duros.vida} contra ${duros.base})`);
    await foto('02-vuelta');
  } catch (e) { errores.push(`${donde}: ${e.message}`); }

  fs.writeFileSync(path.join(salida, 'informe.json'), JSON.stringify({ pasos, errores }, null, 2));
  console.log(pasos.join('\n'));
  if (errores.length) console.log('ERRORES:\n' + errores.join('\n'));
  app.exit(errores.length ? 1 : 0);
});

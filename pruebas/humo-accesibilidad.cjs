// Partida real: mando, teclas propias, tamaño de letra, paleta y subtítulos (1.6).
// Uso: npx electron pruebas/humo-accesibilidad.cjs
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
  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'relax', autoCalidad:false})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let i = 0; i < 240; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) { listo = true; break; } }
    ok(listo, 'carga');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(1200);

    // ---- mando: un joystick de mentira mueve al jugador y dispara acciones
    // Ojo: el mando lo lee el bucle del juego, así que entre paso y paso hay que
    // darle tiempo a que pase un cuadro (acá la ventana oculta va a ~1 por segundo).
    await js(`window.__crudo = { id:'Mando de prueba', axes:[0,0,0,0], buttons:Array.from({length:17},()=>({pressed:false,value:0})), connected:true };
      window.__hojarasca.mando.opciones.leerCrudo = () => window.__crudo; 1`);
    await esperar(2500);
    ok(await js(`window.__hojarasca.mando.hayMando() && window.__hojarasca.mando.nombre() === 'Mando de prueba'`), 'el juego ve el mando');
    await js(`window.__crudo.axes=[0.05,-0.05,0,0]; 1`); await esperar(2500);
    ok(await js(`!window.__hojarasca.jugador.teclas.has('KeyW')`), 'el stick apenas movido no camina (zona muerta)');
    await js(`window.__crudo.axes=[0,-1,0,0]; window.__yaw0 = window.__hojarasca.jugador.estado.yaw; 1`); await esperar(2500);
    ok(await js(`window.__hojarasca.jugador.teclas.has('KeyW')`), 'el stick adelante camina');
    await js(`window.__crudo.axes=[0,0,0,0]; 1`); await esperar(2500);
    ok(await js(`!window.__hojarasca.jugador.teclas.has('KeyW')`), 'soltar el stick frena');
    await js(`window.__crudo.axes=[0,0,1,0]; 1`); await esperar(2500);
    ok(await js(`Math.abs(window.__hojarasca.jugador.estado.yaw - window.__yaw0) > 0.05`), 'el stick derecho mueve la cámara');
    await js(`window.__crudo.axes=[0,0,0,0]; window.__crudo.buttons[15]={pressed:true,value:1}; 1`); await esperar(2500);
    ok(await js(`!document.getElementById('mapa').classList.contains('oculto')`), 'la cruceta abre el mapa');
    await js(`window.__crudo.buttons[15]={pressed:false,value:0};
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyM',bubbles:true}));
      window.__hojarasca.mando.opciones.leerCrudo = () => null; 1`);
    await esperar(2000);

    // ---- teclas propias: cambiar la del hacha por la G
    const t = await js(`(()=>{const H=window.__hojarasca;
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',bubbles:true}));
      document.getElementById('btn-teclas').click();
      const abierto=!document.getElementById('teclas').classList.contains('oculto');
      const filas=document.querySelectorAll('#teclas-lista .fila-tecla').length;
      const fijas=[...document.querySelectorAll('#teclas-lista button')].filter(b=>b.disabled).length;
      const boton=[...document.querySelectorAll('#teclas-lista .fila-tecla')].find(f=>/hacha|talar/i.test(f.textContent));
      boton.querySelector('button').click();
      const fila2=[...document.querySelectorAll('#teclas-lista .fila-tecla')].find(f=>/hacha|talar/i.test(f.textContent));
      const esperando=/apretá/i.test(fila2.querySelector('button').textContent);
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyG',bubbles:true}));
      const guardadas=H.__teclasPropias();
      return {abierto, filas, fijas, esperando, hacha:guardadas.hacha,
        enAjustes:JSON.parse(localStorage.getItem('hojarasca-ajustes-v1')).teclas?.hacha}})()`);
    ok(t.abierto && t.filas >= 20, `el panel lista las teclas (${t.filas})`);
    ok(t.fijas >= 2, 'Esc y F1 no se pueden mudar');
    ok(t.esperando, 'el botón espera la tecla nueva');
    ok(t.hacha === 'KeyG' && t.enAjustes === 'KeyG', `la tecla del hacha queda en G (${t.hacha})`);
    // la tecla nueva hace lo que hacía la vieja
    const usa = await js(`(()=>{const H=window.__hojarasca;
      document.getElementById('cerrar-teclas').click();
      document.getElementById('btn-seguir').click();
      const antes=document.getElementById('notas').textContent;
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyG',bubbles:true}));
      const conG=document.getElementById('notas').textContent!==antes;
      const antes2=document.getElementById('notas').textContent;
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyH',bubbles:true}));
      return {conG, conH:document.getElementById('notas').textContent!==antes2}})()`);
    ok(usa.conG, 'la G ahora usa el hacha');
    ok(!usa.conH, 'la H ya no hace nada');

    // ---- letra, paleta y subtítulos
    const a = await js(`(()=>{const H=window.__hojarasca, raiz=document.documentElement;
      H.ajustes.tamanoLetra='enorme'; H.ajustes.paleta='deuteranopia'; H.ajustes.subtitulos=true;
      document.querySelector('[data-ajuste="tamanoLetra"] [data-valor="enorme"]').click();
      document.querySelector('[data-ajuste="paleta"] [data-valor="deuteranopia"]').click();
      document.querySelector('[data-ajuste="subtitulos"] [data-valor="true"]').click();
      H.nota('Probando los subtítulos','una línea de prueba');
      const caja=document.getElementById('subtitulos');
      return {letra:getComputedStyle(raiz).getPropertyValue('--escala-letra').trim(),
        peligro:getComputedStyle(raiz).getPropertyValue('--peligro').trim(),
        zoom:getComputedStyle(document.getElementById('hud')).zoom,
        subtitulos:caja.textContent, visible:!caja.classList.contains('oculto')}})()`);
    ok(a.letra === '1.45', `la letra se agranda (escala ${a.letra})`);
    ok(a.zoom === '1.45' || Number(a.zoom) === 1.45, `el HUD entero se agranda (zoom ${a.zoom})`);
    ok(a.peligro && a.peligro !== '#ff5a3d', `la paleta cambia el color de peligro (${a.peligro})`);
    ok(a.visible && /subtítulos/i.test(a.subtitulos), `los avisos se escriben como subtítulos (${a.subtitulos.slice(0, 60)})`);
  } catch (e) {
    errores.push('excepción: ' + (e?.message || e));
  }
  console.log(pasos.join('\n'));
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});

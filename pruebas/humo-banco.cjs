// Partida real 1.8: el banco de pruebas corriendo de verdad y la partida que se
// exporta en una maquina y se importa en otra.
// Uso: npx electron pruebas/humo-banco.cjs
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
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'relax', autoCalidad:true})); 1`);
    ok(await cargar(), 'carga');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(1500);

    // ---------------- el banco, con un recorrido corto para no estar dos minutos
    const antes = await js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado;
      window.__pos0 = {x:js.pos.x, z:js.pos.z};
      H.empezarBanco([
        {id:'a', nombre:'Tramo de prueba', dur:1.2, hora:12, alto:2, desde:{lugar:'refugio', dx:20}, hasta:{lugar:'refugio', dx:-20}, texto:'ida y vuelta'},
        {id:'b', nombre:'Tramo de noche', dur:1.2, hora:22.3, alto:2, desde:{lugar:'refugio'}, hasta:{lugar:'mallin'}, texto:'de noche'}
      ]);
      return {corriendo:H.banco.activa, cartel:!document.getElementById('banco-corriendo').classList.contains('oculto'),
        hud:document.getElementById('hud').classList.contains('oculto'), auto:H.ajustes.autoCalidad,
        tramo:document.getElementById('banco-tramo').textContent}})()`);
    ok(antes.corriendo && antes.cartel, 'el banco arranca y avisa en pantalla');
    ok(antes.hud, 'el HUD se esconde mientras mide');
    ok(antes.auto === false, 'la calidad automatica se apaga: el banco mide una calidad fija');
    ok(/Tramo de prueba/.test(antes.tramo), 'el cartel dice en que tramo va: ' + antes.tramo);

    // la ventana oculta va a ~1 cuadro/s: el calentamiento de 3 s de juego son ~15 s
    // de reloj, así que hay que mirar la cámara con paciencia
    const posiciones = [];
    for (let i = 0; i < 14; i++) {
      await esperar(2000);
      posiciones.push(await js(`(()=>{const H=window.__hojarasca; return {x:H.camara.position.x, z:H.camara.position.z, activa:H.banco.activa}})()`));
      if (!posiciones[posiciones.length - 1].activa) break;
    }
    const recorrido = posiciones.reduce((s, p, i) => i ? s + Math.hypot(p.x - posiciones[i-1].x, p.z - posiciones[i-1].z) : 0, 0);
    ok(recorrido > 1, 'la camara recorre el tramo sola (' + recorrido.toFixed(1) + ' m)');

    let listo = false;
    for (let i = 0; i < 90 && !listo; i++) { await esperar(2000); listo = await js(`!window.__hojarasca.banco.activa`); }
    ok(listo, 'la corrida termina sola');
    const fin = await js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado;
      return {panel:!document.getElementById('banco').classList.contains('oculto'),
        informe:document.getElementById('banco-informe').textContent,
        cartel:document.getElementById('banco-corriendo').classList.contains('oculto'),
        auto:H.ajustes.autoCalidad, volvio:Math.hypot(js.pos.x-window.__pos0.x, js.pos.z-window.__pos0.z) < 1}})()`);
    ok(fin.panel, 'al terminar muestra el informe');
    ok(fin.cartel, 'el cartel se va');
    ok(/BANCO DE PRUEBAS/.test(fin.informe) && /TODO EL RECORRIDO/.test(fin.informe), 'el informe tiene cabecera y resumen');
    ok(/Tramo de prueba/.test(fin.informe) && /Tramo de noche/.test(fin.informe), 'estan los dos tramos medidos');
    ok(/cuadros\/s/.test(fin.informe) && /1% peor/.test(fin.informe), 'mide cuadros por segundo y el 1% peor');
    ok(/llamadas de dibujo/.test(fin.informe), 'anota el peso de la escena');
    ok(fin.auto === true, 'la calidad automatica vuelve como estaba');
    ok(fin.volvio, 'el jugador vuelve a donde estaba');
    await js(`document.getElementById('cerrar-banco').click(); document.getElementById('btn-seguir').click(); 1`);

    // ---------------- llevarse la partida de una maquina a otra
    const t = await js(`(()=>{const H=window.__hojarasca;
      H.progreso.dia = 6; H.progreso.ramitas = 11; H.guardar();
      const texto = H.textoParaExportar(1);
      window.__paquete = texto;
      const p = JSON.parse(texto);
      return {largo:texto.length, formato:p.formato, dia:p.dia, tieneProgreso:!!p.cuerpo.progreso}})()`);
    ok(t.formato === 'hojarasca-partida' && t.tieneProgreso, 'exportar arma un paquete con la partida adentro');
    ok(t.dia === 6, 'el paquete anota el dia: ' + t.dia);

    const imp = await js(`(()=>{const H=window.__hojarasca;
      const r = H.importarTexto(2, window.__paquete, false);
      const p2 = JSON.parse(localStorage.getItem('hojarasca-p2-v1') || 'null');
      return {ok:r.ok, dia:p2 && p2.dia, ramitas:p2 && p2.ramitas, actual:H.progreso.dia}})()`);
    ok(imp.ok && imp.dia === 6 && imp.ramitas === 11, 'la partida importada queda completa en la 2, dia ' + imp.dia);
    ok(imp.actual === 6, 'la partida en curso no se toca');

    const mal = await js(`window.__hojarasca.importarTexto(3, 'esto no es una partida', false)`);
    ok(!mal.ok && /no es una partida/.test(mal.motivo), 'un archivo cualquiera se rechaza con motivo: ' + mal.motivo);
    // retocar la cabecera no sirve de nada: el día sale de la partida firmada
    const cabeza = await js(`window.__hojarasca.importarTexto(3, window.__paquete.replace('"dia": 6', '"dia": 99'), false)`);
    ok(cabeza.ok, 'retocar la cabecera no cambia la partida: el dia sale del cuerpo firmado');
    await js(`window.__hojarasca.importarTexto(3, window.__paquete, false); 1`);
    const dia3 = await js(`JSON.parse(localStorage.getItem('hojarasca-p3-v1')).dia`);
    ok(dia3 === 6, 'la partida importada sigue siendo la del dia 6, no la del 99');
    const roto = await js(`window.__hojarasca.importarTexto(3, window.__paquete.replace('"ramitas": 11', '"ramitas": 9999').replace('"ramitas":11', '"ramitas":9999'), false)`);
    ok(!roto.ok && /cortado o modificado/.test(roto.motivo), 'un paquete con el contenido retocado se rechaza: ' + roto.motivo);
    const otro = await js(`(()=>{const p = JSON.parse(window.__paquete); p.modo = 'desafio';
      return window.__hojarasca.importarTexto(3, JSON.stringify(p), false)})()`);
    ok(!otro.ok, 'una partida del otro modo avisa en vez de mezclarse');
    ok(await js(`JSON.parse(localStorage.getItem('hojarasca-p3-v1')).ramitas === 11`), 'lo rechazado no piso lo que ya estaba guardado');
  } catch (e) {
    errores.push('excepcion: ' + (e && e.message ? e.message : e));
  }
  console.log(pasos.join('\n'));
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});

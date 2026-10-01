// Partida real 1.8: el modo foto (camara libre, controles que se ven en la foto,
// guias de encuadre y la foto guardada) y el valle que se asusta con el Desafio.
// Uso: npx electron pruebas/humo-foto.cjs
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
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) { listo = true; break; } }
    ok(listo, 'carga');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(1500);

    // ---- entrar al modo foto
    const dentro = await js(`(()=>{const H=window.__hojarasca;
      window.__bajadas = [];
      const clickOriginal = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () { if (this.download) window.__bajadas.push(this.download); else clickOriginal.call(this); };
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'F2',bubbles:true}));
      return {activo:H.__foto().activo, panel:!document.getElementById('foto-panel').classList.contains('oculto'),
        hud:document.getElementById('hud').classList.contains('oculto'),
        guias:document.querySelectorAll('#foto-guias-capa i').length,
        controles:document.querySelectorAll('#foto-controles [data-foto]').length}})()`);
    ok(dentro.activo && dentro.panel, 'F2 abre el modo foto');
    ok(dentro.hud, 'el HUD se va');
    ok(dentro.guias === 4, `las guias de tercios se dibujan (${dentro.guias} lineas)`);
    ok(dentro.controles >= 5, `estan los controles (${dentro.controles})`);

    // ---- los controles cambian lo que se ve
    const tocar = await js(`(()=>{const H=window.__hojarasca;
      const antes = {vineta:H.__post().uVineta.value, grano:H.__post().uGrano.value, fov:H.camara.fov, hora:H.progreso.horas};
      const mover = (id, v) => { const r = document.querySelector('[data-foto="'+id+'"]'); r.value = v; r.dispatchEvent(new Event('input', {bubbles:true})); };
      mover('vineta', 0.9); mover('grano', 1.2); mover('fov', 50); mover('hora', 6.5);
      return {antes, despues:{vineta:H.__post().uVineta.value, grano:H.__post().uGrano.value, fov:H.camara.fov, hora:H.progreso.horas},
        etiqueta:document.querySelector('[data-foto-valor="hora"]').textContent}})()`);
    ok(tocar.despues.vineta === 0.9 && tocar.despues.grano === 1.2, 'la vineta y el grano llegan al post-procesado');
    ok(tocar.despues.fov === 50 && tocar.antes.fov !== 50, `el campo de vision cambia (${tocar.antes.fov} -> ${tocar.despues.fov})`);
    ok(Math.abs(tocar.despues.hora - 6.5) < 0.01, 'la hora del dia se mueve con el control');
    ok(tocar.etiqueta === '06:30', 'la etiqueta muestra la hora como reloj: ' + tocar.etiqueta);

    // ---- el mundo congelado y las guias que se pueden apagar
    const quieto = await js(`(()=>{const H=window.__hojarasca;
      document.querySelector('[data-foto-guia="ninguna"]').click();
      const guias = document.querySelectorAll('#foto-guias-capa i').length;
      document.querySelector('[data-foto-congelar="0"]').click();
      const enMovimiento = !H.__foto().congelado;
      document.querySelector('[data-foto-congelar="1"]').click();
      return {guias, enMovimiento, congelado:H.__foto().congelado, hora:H.progreso.horas}})()`);
    ok(quieto.guias === 0, 'las guias se pueden apagar');
    ok(quieto.enMovimiento && quieto.congelado, 'el mundo se puede congelar y descongelar');
    await esperar(3000);
    ok(Math.abs(await js(`window.__hojarasca.progreso.horas`) - 6.5) < 0.2, 'con el mundo congelado la hora no se corre sola');

    // ---- guardar la foto
    const guardada = await js(`(()=>{ try { window.__hojarasca.guardarFotoArchivo(); return 'ok' } catch(e) { return 'ERROR ' + e.message } })()`);
    ok(guardada === 'ok', 'sacar la foto no revienta: ' + guardada);
    await esperar(9000);
    const bajadas = await js(`window.__bajadas`);
    ok(bajadas.length === 1 && /^hojarasca-\d{8}-\d{6}\.png$/.test(bajadas[0]), 'la foto se guarda como archivo: ' + bajadas.join(','));
    ok(await js(`!document.getElementById('foto-panel').classList.contains('oculto')`), 'el panel vuelve despues de sacar la foto');

    // ---- salir deja todo como estaba
    const fuera = await js(`(()=>{const H=window.__hojarasca;
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'F2',bubbles:true}));
      return {activo:H.__foto().activo, panel:document.getElementById('foto-panel').classList.contains('oculto'),
        hud:!document.getElementById('hud').classList.contains('oculto'), fov:H.camara.fov,
        vineta:H.__post().uVineta.value}})()`);
    ok(!fuera.activo && fuera.panel && fuera.hud, 'F2 sale del modo foto y devuelve el HUD');
    ok(fuera.fov === 70 && fuera.vineta !== 0.9, 'el campo de vision y la imagen vuelven como estaban');

    // ---- el valle se entera del Desafio
    await js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado;
      for (const d of [18, 24, 30]) H.desafio.invocar('rastreador', js.pos.x + d, js.pos.z + 6);
      return 1})()`);
    // la lista se rehace cada 0,6 s de juego, que acá son unos diez de reloj
    let p = { cuantos: 0 };
    for (let i = 0; i < 12 && !p.cuantos; i++) {
      await esperar(2000);
      p = await js(`(()=>{const H=window.__hojarasca; return {cuantos:H.__peligros().length, radios:H.__peligros().map(x=>x.radio)}})()`);
    }
    ok(p.cuantos > 0, `con invasores en el valle hay peligros para la fauna (${p.cuantos})`);
    const lejos = await js(`(()=>{const H=window.__hojarasca, P=H.__peligros();
      // un animal lejos de todo no se asusta; uno encima del invasor sí
      const lejos = H.__riesgoPeligros({x:4000, z:4000});
      const encima = P.length ? H.__riesgoPeligros({x:P[0].x, z:P[0].z}) : 0;
      return {lejos, encima}})()`);
    ok(lejos.lejos === 0 && lejos.encima > 0.9, `el susto depende de la distancia (lejos ${lejos.lejos}, encima ${lejos.encima.toFixed(2)})`);
  } catch (e) {
    errores.push('excepcion: ' + (e && e.message ? e.message : e));
  }
  console.log(pasos.join('\n'));
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});

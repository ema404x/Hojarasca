// 3.8.6 (base): lo transversal, en el juego de verdad (Electron + WebGL):
//   1. el mando, leído una vez por cuadro en cualquier pantalla: cerrar un cuadro de pregunta con A no hace saltar (ni B
//      agacharse); la B de un cuadro abierto desde la pausa no cierra también la pausa; en el kayak, Start abre y cierra la
//      pausa; la tarjeta del valle se abre con el foco en la primera opción y se maneja con el mando solo (la cruceta pasa
//      de botón, A elige);
//   2. Controles y Créditos: F1, F5 y F2 no abren nada encima, Esc (o B) vuelve a la pausa, y desde la portada el botón no
//      dice «Volver a pausa»;
//   3. con la letra enorme, en 1366×768, Personalizar, la guía y las teclas entran en la pantalla;
//   4. aceptar «Bajar» la calidad de Media a Baja (apaga las sombras) compila antes de seguir y el cuadro siguiente no traba.
// Uso: HOJ_PERFIL=<carpeta> npx electron --no-sandbox -r ./herramientas/perfil-propio.cjs pruebas/humo-3-8-6-base.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: false, width: 1366, height: 768, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.setContentSize(1366, 768);
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
  const empezar = async (extra = '') => {
    await w.loadFile(url, { search: '?debug=1' }); await esperar(300);
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false ${extra}})); 1`);
    await w.loadFile(url, { search: '?debug=1' }); await listo();
  };
  const entrar = async () => { await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(1200); };
  // el mando de mentira y sus ayudas (adentro de la página)
  const MANDO = `const H = window.__hojarasca; const pad = { id: 'Mando de prueba', connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
    H.mando.opciones.leerCrudo = () => pad;
    const nav = navigator.getGamepads; navigator.getGamepads = () => [pad];   // (el cuadro de pregunta lee el mando por su lado)
    const cuadros = async (n) => { for (let i = 0; i < n; i++) { H.__bucle(); await new Promise(r => setTimeout(r, 30)); } };
    const apretar = (b, si) => { pad.buttons[b].pressed = si; pad.buttons[b].value = si ? 1 : 0; };
    const tocar = async (b) => { apretar(b, true); await cuadros(4); apretar(b, false); await cuadros(4); };
    const modo = () => H.__caidas.modo();
    const fin = () => { delete H.mando.opciones.leerCrudo; navigator.getGamepads = nav; };`;
  try {
    // ---------------------------------------------------------------- 1. el mando
    donde = 'mando';
    await empezar();
    await entrar();
    const m = await js(`(async()=>{ ${MANDO}
      const r = {}; let saltos = 0, agachadas = 0;
      const contar = (e) => { if (e.code === 'Space') saltos++; if (e.code === 'KeyC') agachadas++; };
      document.addEventListener('keydown', contar, true);
      // (sin el mouse atrapado: en la ventana oculta de la prueba, atraparlo y soltarlo abre la pausa a destiempo)
      H.jugador.pedirBloqueo = () => {}; try { document.exitPointerLock(); } catch {}
      await new Promise(r => setTimeout(r, 300)); if (modo() !== 'jugando') H.volverAlJuego();
      await cuadros(4);
      // a) un cuadro de pregunta en pleno juego, contestado con A (lo que se aprieta queda apretado un rato, como un dedo)
      const D = H.__caidas.dialogos; D.auto = null;
      let resp = D.confirmar('¿Prueba?'); await cuadros(2); r.dialogo = modo();
      apretar(0, true); await new Promise(r => setTimeout(r, 120)); await cuadros(6); apretar(0, false); await cuadros(4);
      r.respA = await resp; r.saltosA = saltos;
      resp = D.confirmar('¿Prueba con B?'); await cuadros(2);
      apretar(1, true); await new Promise(r => setTimeout(r, 120)); await cuadros(6); apretar(1, false); await cuadros(4);
      r.respB = await resp; r.agachadasB = agachadas; r.trasB = modo();
      // b) desde la pausa: un cuadro cancelado con B no cierra la pausa
      await tocar(9); await new Promise(r => setTimeout(r, 450)); r.pausa = modo();
      resp = D.confirmar('¿Desde la pausa?'); await cuadros(2);
      apretar(1, true); await new Promise(r => setTimeout(r, 120)); await cuadros(6); apretar(1, false); await cuadros(4);
      r.respPausa = await resp; r.sigueEnPausa = modo();
      await tocar(9); r.salio = modo();
      // c) en el kayak: Start abre la pausa y Start la cierra (antes se leía dos veces por cuadro y no salía)
      H.kayak.subir(H.jugador); await cuadros(3);
      await tocar(9); r.kayakPausa = modo(); await new Promise(r => setTimeout(r, 450));
      await tocar(9); r.kayakSalio = modo();
      await new Promise(r => setTimeout(r, 450)); await tocar(1); r.kayakB = modo();
      H.jugador.estado.enKayak = false;
      // d) la tarjeta del valle, con el mando solo: la cruceta pasa de botón y A elige el marcado
      let elegido = null;
      H.__valle.tarjetas.mostrar({ titulo: 'Prueba', texto: 'Con el mando', opciones: [{ id: 'uno', texto: 'Uno' }, { id: 'dos', texto: 'Dos' }],
        alElegir: (id) => { elegido = id; H.__valle.tarjetas.cerrar(); return true; } });
      await cuadros(2); r.valle = modo(); r.focoAntes = document.activeElement?.dataset?.valleOpcion || document.activeElement?.tagName;
      await tocar(13); r.foco = document.activeElement?.dataset?.valleOpcion || null;
      await tocar(0); r.elegido = elegido; r.trasValle = modo();
      document.removeEventListener('keydown', contar, true);
      fin(); return r; })()`);
    ok(m.dialogo === 'dialogo' && m.respA === true && m.saltosA === 0, `A acepta el cuadro y no salta (${JSON.stringify({ d: m.dialogo, a: m.respA, s: m.saltosA })})`);
    ok(m.respB === false && m.agachadasB === 0 && m.trasB === 'jugando', `B cancela el cuadro y no agacha (${JSON.stringify({ b: m.respB, c: m.agachadasB, modo: m.trasB })})`);
    ok(m.pausa === 'pausa' && m.respPausa === false && m.sigueEnPausa === 'pausa' && m.salio === 'jugando', `desde la pausa, B cancela el cuadro y la pausa sigue (${JSON.stringify({ p: m.pausa, r: m.respPausa, s: m.sigueEnPausa, f: m.salio })})`);
    ok(m.kayakPausa === 'pausa' && m.kayakSalio === 'jugando', `en el kayak, Start abre y cierra la pausa (${JSON.stringify({ a: m.kayakPausa, c: m.kayakSalio, b: m.kayakB })})`);
    ok(m.valle === 'valle' && m.focoAntes === 'uno' && m.foco === 'dos' && m.elegido === 'dos' && m.trasValle === 'jugando', `la tarjeta del valle, con el mando solo (${JSON.stringify({ v: m.valle, antes: m.focoAntes, f: m.foco, e: m.elegido, t: m.trasValle })})`);

    // ---------------------------------------------------------------- 2. Controles y Créditos
    donde = 'controles';
    await empezar();
    const p = await js(`(async()=>{ const $ = (id) => document.getElementById(id); const ve = (id) => !$(id).classList.contains('oculto');
      const tecla = async (code) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true })); await new Promise(r => setTimeout(r, 120)); };
      const r = {};
      $('btn-controles-inicio').click(); await new Promise(r => setTimeout(r, 100));
      r.botonPortada = $('cerrar-controles-completos').textContent.trim();
      await tecla('Escape'); r.portada = ve('inicio') && !ve('controles-completos');
      $('btn-entrar').click(); await new Promise(r => setTimeout(r, 1200));
      window.__hojarasca.abrir('pausa'); await new Promise(r => setTimeout(r, 500));
      for (const [boton, panel] of [['btn-controles', 'controles-completos'], ['btn-creditos', 'creditos']]) {
        $(boton).click(); await new Promise(r => setTimeout(r, 100));
        for (const f of ['F1', 'F5', 'F2']) await tecla(f);
        r[panel] = { boton: $(panel === 'creditos' ? 'cerrar-creditos' : 'cerrar-controles-completos').textContent.trim(), sigue: ve(panel), guia: ve('guia'), personalizar: ve('personalizar'), foto: window.__hojarasca.__foto().activo };
        await tecla('Escape');
        r[panel].trasEsc = { panel: ve(panel), pausa: ve('pausa'), modo: window.__hojarasca.__caidas.modo() };
      }
      return r; })()`);
    ok(p.botonPortada !== 'Volver a pausa' && p.portada, `desde la portada: «${p.botonPortada}» y Esc vuelve a la portada`);
    for (const panel of ['controles-completos', 'creditos']) {
      const x = p[panel];
      ok(x.sigue && !x.guia && !x.personalizar && !x.foto && !x.trasEsc.panel && x.trasEsc.pausa && x.trasEsc.modo === 'pausa' && x.boton === 'Volver a pausa', `${panel}: F1, F5 y F2 no abren nada encima y Esc vuelve a la pausa (${JSON.stringify(x)})`);
    }

    // las teclas que se ven, las del jugador: E cambiada a R
    const tk = await js(`(async()=>{ const $ = (id) => document.getElementById(id); window.__hojarasca.abrir('pausa'); await new Promise(r => setTimeout(r, 300));
      $('btn-teclas').click(); await new Promise(r => setTimeout(r, 100));
      const fila = [...document.querySelectorAll('#teclas-lista button')].find((b) => b.textContent.trim() === 'E');
      fila.click(); document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR', bubbles: true })); await new Promise(r => setTimeout(r, 100));
      $('cerrar-teclas').click();
      const textos = (sel) => [...document.querySelectorAll(sel + ' kbd')].map((k) => k.textContent.trim());
      const r = { basicas: textos('#teclas-basicas'), controles: textos('#controles-completos') };
      $('teclas-defecto').click(); r.vuelta = textos('#teclas-basicas'); return r; })()`);
    ok(tk.basicas.includes('R') && !tk.basicas.includes('E') && !tk.controles.includes('E') && tk.vuelta.includes('E'), `las teclas escritas son las del jugador (${JSON.stringify(tk)})`);

    // ---------------------------------------------------------------- 3. la letra enorme en 1366×768
    donde = 'letra enorme';
    await empezar(", tamanoLetra:'enorme'");
    await entrar();
    const dentro = (id) => `(()=>{ const el = document.querySelector('#${id} .panel-modal'); const r = el.getBoundingClientRect(); return { arriba: Math.round(r.top), abajo: Math.round(r.bottom), izq: Math.round(r.left), der: Math.round(r.right), alto: innerHeight, ancho: innerWidth }; })()`;
    const medidas = {};
    await js(`window.__hojarasca.abrir('pausa'); 1`); await esperar(400);
    await js(`document.getElementById('btn-personalizar').click(); 1`); await esperar(400);
    medidas.personalizar = await js(dentro('personalizar'));
    await js(`document.getElementById('cerrar-personalizar').click(); document.getElementById('btn-guia').click(); 1`); await esperar(400);
    medidas.guia = await js(dentro('guia'));
    await js(`document.getElementById('cerrar-guia').click(); document.getElementById('btn-teclas').click(); 1`); await esperar(400);
    medidas.teclas = await js(dentro('teclas'));
    await w.webContents.capturePage().then((img) => require('fs').writeFileSync(path.join(raiz, 'pruebas', 'salidas', 'humo-3-8-6-teclas-enorme.png'), img.toPNG())).catch(() => {});
    for (const [k, r] of Object.entries(medidas)) ok(r.arriba >= 0 && r.abajo <= r.alto && r.izq >= 0 && r.der <= r.ancho, `letra enorme: ${k} entra en la pantalla (${JSON.stringify(r)})`);

    // ---------------------------------------------------------------- 4. bajar la calidad sin tirones
    donde = 'calidad';
    await w.loadFile(url, { search: '?debug=1' }); await esperar(300);
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'relax', autoCalidad:true, guiaPrimerDia:false})); 1`);
    await w.loadFile(url, { search: '?debug=1' }); await listo();
    await entrar();
    const c = await js(`(async()=>{ const H = window.__hojarasca; const cuadro = () => { const t = performance.now(); H.__bucle(); return performance.now() - t; };
      for (let i = 0; i < 10; i++) { cuadro(); await new Promise(r => setTimeout(r, 20)); }
      const antes = { calidad: H.ajustes.calidad, sombras: H.renderer.shadowMap.enabled };
      // la pregunta, contestada «Bajar» (en ?debug=1 las pruebas contestan reemplazando window.confirm)
      window.confirm = () => true;
      H.__preguntaLento.activa = true;
      const a = H.autoCalidad; a.calentando = 0; a.desdeCambio = 99; a.rojo = 99; a.llenas = a.muestras.length; a.muestras.fill(1 / 20);
      cuadro();
      const cartel = () => !document.getElementById('graficos-recuperando').classList.contains('oculto');
      const t0 = performance.now(); let vioCartel = false;
      for (let i = 0; i < 600 && (H.renderer.shadowMap.enabled || cartel() || !vioCartel); i++) { if (cartel()) vioCartel = true; await new Promise(r => setTimeout(r, 20)); if (!vioCartel && i > 100) break; }
      const compilando = Math.round(performance.now() - t0);
      const tiempos = []; for (let i = 0; i < 6; i++) { tiempos.push(cuadro()); await new Promise(r => setTimeout(r, 20)); }
      H.__preguntaLento.activa = false;
      return { vioCartel, compilando, antes, despues: { calidad: H.ajustes.calidad, sombras: H.renderer.shadowMap.enabled }, primero: Math.round(tiempos[0]), peor: Math.round(Math.max(...tiempos)), veces: H.__preguntaLento.veces, cartel: !document.getElementById('graficos-recuperando').classList.contains('oculto') }; })()`);
    ok(c.antes.calidad === 'media' && c.antes.sombras && c.despues.calidad === 'baja' && !c.despues.sombras && c.veces === 1 && !c.cartel, `«Bajar»: de Media a Baja, sin sombras y sin cartel colgado (${JSON.stringify(c)})`);
    ok(c.primero < 400, `el primer cuadro después de bajar no traba (ya estaba compilado): ${c.primero} ms (el peor de 6: ${c.peor} ms)`);
  } catch (e) { errores.push('excepción: ' + (e && e.message ? e.message : e)); }
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  console.log('OK humo-3-8-6-base');
  app.exit(0);
});

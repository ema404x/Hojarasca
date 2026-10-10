// Partida real: la calidad automática y el acopio de materiales (1.6). 3.8.4: la calidad ya no cambia sola: pregunta.
// La ventana oculta no tiene GPU y va a ~1 cuadro/s, así que es el banco de pruebas
// perfecto para ver si el juego se da cuenta solo de que no llega.
// Uso: npx electron pruebas/humo-autocalidad.cjs
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
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'relax'})); 1`);
    ok(await cargar(), 'carga en calidad Media');
    await js(`document.getElementById('btn-entrar').click(); 1`);

    // ---- 3.8.4 (decisión 35): la calidad nunca cambia sola. Sin GPU el equipo no llega: el juego PREGUNTA
    // «El juego va lento: ¿bajar la calidad?» (con ?debug=1 sólo si la prueba lo pide), y baja sólo si se acepta
    await js(`window.__hojarasca.__preguntaLento.activa = true; 1`);
    const antes = await js(`window.__hojarasca.ajustes.calidad`);
    const esperarPregunta = async () => {
      for (let i = 0; i < 140; i++) {
        await esperar(1000);
        const d = await js(`(()=>{const d=document.getElementById('dialogo'); return d.classList.contains('oculto') ? null : { texto: document.getElementById('dialogo-texto').textContent, si: document.getElementById('dialogo-si').textContent, no: document.getElementById('dialogo-no').textContent }})()`);
        if (d) return d;
      }
      return null;
    };
    let d = await esperarPregunta();
    ok(!!d && d.texto.startsWith('El juego va lento: ¿bajar la calidad?') && d.si === 'Bajar' && d.no === 'No, gracias', `si va lento, pregunta (${JSON.stringify(d)})`);
    ok(await js(`window.__hojarasca.ajustes.calidad`) === antes && antes === 'media', `mientras pregunta, la calidad no cambió sola (${antes})`);
    await js(`document.getElementById('dialogo-si').click(); 1`);
    await esperar(800);
    const bajo = await js(`window.__hojarasca.ajustes.calidad`);
    ok(antes === 'media' && bajo === 'baja', `con «Bajar» baja un escalón (${antes} → ${bajo})`);
    ok(await js(`/calidad/i.test(document.getElementById('notas').textContent)`), 'avisa por pantalla que la bajó');
    ok(await js(`JSON.parse(localStorage.getItem('hojarasca-ajustes-v1')).calidad === 'baja'`), 'queda guardada para la próxima');
    ok(await js(`window.__hojarasca.ajustes.autoCalidad !== false && !!document.querySelector('[data-ajuste="autoCalidad"]')`), 'se puede apagar desde los ajustes');
    // si sigue lento, vuelve a preguntar; con «No, gracias» no insiste más en la sesión
    d = await esperarPregunta();
    ok(!!d, 'sigue lento: vuelve a preguntar (después de su tiempo de gracia)');
    await js(`document.getElementById('dialogo-no').click(); 1`);
    await esperar(800);
    ok(await js(`window.__hojarasca.ajustes.calidad === 'baja' && window.__hojarasca.__preguntaLento.noMolestar === true`), 'con «No, gracias» la calidad queda como estaba');
    await esperar(20000);
    ok(await js(`document.getElementById('dialogo').classList.contains('oculto') && window.__hojarasca.ajustes.calidad === 'baja'`), 'y no vuelve a preguntar ni la cambia sola');

    // ---- acopio: guardar, sacar y construir con lo guardado
    const ac = await js(`(()=>{const H=window.__hojarasca, P=H.progreso, js=H.jugador.estado;
      Object.assign(P.materiales, {tronco:12, tabla:12, piedra:12});
      const p=H.PLANOS.find(q=>q.id==='acopio'); H.obras.elegir(p);
      let puesto=false;
      for (const d of [3,4,5,6]) { const x=js.pos.x-Math.sin(js.yaw)*d, z=js.pos.z-Math.cos(js.yaw)*d;
        const r=H.obras.fundar(x,z,js.yaw,js.pos.y); if(!r.ok) continue;
        const av=H.obras.avanzar(r.obra, P.materiales); puesto=av.ok; break; }
      H.obras.elegir(null); P.obras=H.obras.obras.map(o=>o.datos);
      const costo={tronco:P.materiales.tronco, tabla:P.materiales.tabla};
      // E guarda todo en el acopio
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',bubbles:true}));
      const guardado={acopio:{...H.acopio()}, mano:{...P.materiales}};
      // con el acopio al lado, lo que se levanta se paga de ahí
      const vista=H.materialesVisibles();
      const gasto=H.conMateriales((m)=>{ m.tronco-=2; m.piedra-=1; return 'listo'; });
      const tras={acopio:{...H.acopio()}, mano:{...P.materiales}, gasto};
      // E otra vez, con la mochila vacía, saca todo
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',bubbles:true}));
      const sacado={acopio:{...H.acopio()}, mano:{...P.materiales}};
      return {puesto, costo, guardado, vista, tras, sacado}})()`);
    ok(ac.puesto && ac.costo.tronco === 10 && ac.costo.tabla === 10, `el acopio se construye con 2 troncos y 2 tablas (${JSON.stringify(ac.costo)})`);
    ok(ac.guardado.acopio.tronco === 10 && ac.guardado.mano.tronco === 0, `E guarda todo lo que llevabas (${JSON.stringify(ac.guardado)})`);
    ok(ac.vista.tronco === 10, `para construir se ve lo del acopio (${ac.vista.tronco} troncos a mano)`);
    ok(ac.tras.acopio.tronco === 8 && ac.tras.mano.tronco === 0, `lo que levantás se paga del acopio (${JSON.stringify(ac.tras.acopio)})`);
    ok(ac.sacado.mano.tronco === 8 && ac.sacado.acopio.tronco === 0, 'E con las manos vacías saca todo del acopio');
  } catch (e) {
    errores.push('excepción: ' + (e?.message || e));
  }
  console.log(pasos.join('\n'));
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});

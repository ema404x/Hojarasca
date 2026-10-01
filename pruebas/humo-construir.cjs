// Partida real 1.8: deshacer la ultima etapa, repetir la pieza de enfrente y el
// parte de la partida al terminar el Desafio.
// Uso: npx electron pruebas/humo-construir.cjs
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
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let i = 0; i < 240; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) { listo = true; break; } }
    ok(listo, 'carga el Desafio');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(1500);

    // ---- deshacer la ultima etapa de una obra de varias
    const des = await js(`(()=>{const H=window.__hojarasca, P=H.progreso, js=H.jugador.estado;
      Object.assign(P.materiales, {tronco:60, tabla:60, piedra:60});
      const plano = H.PLANOS.find(p=>p.id==='mirador') || H.PLANOS.find(p=>!p.pieza && p.etapas.length>1);
      H.obras.elegir(plano);
      let obra = null;
      for (const d of [6,8,10,12,14]) { const x=js.pos.x-Math.sin(js.yaw)*d, z=js.pos.z-Math.cos(js.yaw)*d;
        const r=H.obras.fundar(x,z,js.yaw,js.pos.y); if(!r.ok) continue; obra=r.obra; break; }
      if (!obra) return {error:'no se pudo fundar'};
      H.obras.avanzar(obra, P.materiales);
      H.obras.avanzar(obra, P.materiales);
      H.jugador.ubicar(obra.datos.x+1.5, obra.datos.z+1.5, js.yaw);
      const antes = {etapas:obra.datos.etapas, tronco:P.materiales.tronco, tabla:P.materiales.tabla, piedra:P.materiales.piedra};
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyO',bubbles:true}));   // abrir planos
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'Backspace',bubbles:true}));
      const despues = {etapas:obra.datos.etapas, tronco:P.materiales.tronco, tabla:P.materiales.tabla, piedra:P.materiales.piedra};
      const gano = ['tronco','tabla','piedra'].some(k=>despues[k] > antes[k]);
      window.__obra = obra;
      return {plano:plano.nombre, antes, despues, gano, nota:document.getElementById('notas').textContent}})()`);
    ok(!des.error, 'se pudo fundar una obra de varias etapas: ' + (des.error || des.plano));
    ok(des.despues.etapas === des.antes.etapas - 1, `Retroceso deshace una etapa (${des.antes.etapas} -> ${des.despues.etapas})`);
    ok(des.gano, 'y devuelve parte de los materiales');
    ok(/Deshecha/.test(des.nota), 'avisa lo que deshizo: ' + (des.nota || '').slice(0, 60));

    // ---- deshacer no se come lo que tiene algo apoyado encima ni obras ajenas
    const nada = await js(`(()=>{const H=window.__hojarasca;
      H.jugador.ubicar(H.jugador.estado.pos.x + 60, H.jugador.estado.pos.z + 60, 0);
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'Backspace',bubbles:true}));
      return document.getElementById('notas').textContent})()`);
    ok(/Nada que deshacer/.test(nada), 'lejos de todo, avisa que no hay nada que deshacer');

    // ---- repetir lo que tenes enfrente
    const copia = await js(`(()=>{const H=window.__hojarasca, P=H.progreso, js=H.jugador.estado;
      const p = H.PLANOS.find(q=>q.id==='empalizada');
      H.obras.elegir(p);
      let obra=null;
      for (const d of [5,7,9]) { const x=js.pos.x-Math.sin(js.yaw)*d, z=js.pos.z-Math.cos(js.yaw)*d;
        const r=H.obras.fundar(x,z,js.yaw,js.pos.y); if(!r.ok) continue; const a=H.obras.avanzar(r.obra,P.materiales); if(a.ok) {obra=r.obra; break;} }
      if (!obra) return {error:'no se pudo poner la empalizada'};
      H.obras.elegir(H.PLANOS.find(q=>q.id==='antorcha'));
      const antes = H.obras.plano.id;
      H.jugador.ubicar(obra.datos.x+1.2, obra.datos.z+1.2, js.yaw);
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyX',bubbles:true}));
      return {error:null, antes, ahora:H.obras.plano.id, rot:Math.abs(H.obras.rotacion - obra.datos.rot) < 0.01,
        nota:document.getElementById('notas').textContent}})()`);
    ok(!copia.error, 'hay una empalizada para copiar: ' + (copia.error || 'sí'));
    ok(copia.antes === 'antorcha' && copia.ahora === 'empalizada', `X copia el plano de enfrente (${copia.antes} -> ${copia.ahora})`);
    ok(copia.rot, 'y se queda con la misma orientacion');

    // ---- el parte de la partida
    const parte = await js(`(()=>{const H=window.__hojarasca;
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyO',bubbles:true}));   // cerrar planos
      const d = H.progreso.desafio;
      d.noches = 20; d.abatidos = 220; d.derrotas = 1; d.mejorRacha = 9;
      H.desafio.__parteDePrueba ? null : null;
      return {noches:d.noches}})()`);
    ok(parte.noches === 20, 'preparada una partida avanzada');
    const fin = await js(`(()=>{const H=window.__hojarasca;
      H.__mostrarVictoria({noches:20, abatidos:220, derrotas:1, dificultad:'implacable', cristales:36}, true);
      return 1})()`).catch(() => null);
    await esperar(6500);
    const pantalla = await js(`(()=>({visible:!document.getElementById('victoria').classList.contains('oculto'),
      titulo:document.getElementById('victoria-titulo').textContent,
      datos:document.getElementById('victoria-datos').textContent,
      bloques:document.querySelectorAll('#victoria-datos .parte-bloque').length,
      copiar:!document.getElementById('victoria-copiar').classList.contains('oculto')}))()`);
    ok(pantalla.visible && /nido/i.test(pantalla.titulo), 'aparece la pantalla de fin: ' + pantalla.titulo);
    ok(pantalla.bloques >= 4, `el parte trae varios bloques (${pantalla.bloques})`);
    ok(/Noches resistidas/.test(pantalla.datos) && /220/.test(pantalla.datos), 'y los numeros de la partida');
    ok(/Piezas en pie/.test(pantalla.datos), 'incluye lo que construiste');
    ok(pantalla.copiar, 'se puede copiar el parte');
  } catch (e) {
    errores.push('excepcion: ' + (e && e.message ? e.message : e));
  }
  console.log(pasos.join('\n'));
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});

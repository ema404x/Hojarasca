// Prueba de humo de partida real: calidades × estaciones × climas, recorre todos los
// lugares, camina, abre el cuaderno, guarda y recarga. Falla ante cualquier error JS.
// Uso: npx electron pruebas/humo-partida.cjs   → pruebas/salidas/humo/
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(__dirname, 'salidas', 'humo');
fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
// sólo pruebas: en algunos entornos el renderer con sandbox no carga ni una página (ERR_FAILED)
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const COMBOS = [
  { calidad: 'alta', estacion: 'verano', clima: 'despejado' },
  { calidad: 'media', estacion: 'otono', clima: 'variable' },
  { calidad: 'baja', estacion: 'invierno', clima: 'lluvioso' },
  { calidad: 'muybaja', estacion: 'auto', clima: 'despejado' },
];
const LUGARES = ['refugio', 'muelle', 'puente', 'mallin', 'mirador', 'arrayanes', 'faro', 'cabana', 'puesto', 'molino', 'casa-te', 'torre', 'estacion', 'galpon', 'almacen', 'cueva'];

app.whenReady().then(async () => {
  const errores = [];
  const resumen = [];
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Error|Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill/.test(m)) errores.push(m.slice(0, 300));
  });
  w.webContents.on('render-process-gone', (_e, d) => errores.push('RENDER GONE ' + d.reason));
  // Cada llamada tiene límite: un renderer colgado se reporta en lugar de trabar la prueba.
  let donde = '';
  const js = (c, limite = 45000) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, rej) => setTimeout(() => rej(new Error(`sin respuesta del juego ${limite / 1000}s en ${donde}`)), limite)),
  ]);
  const soloCombos = process.env.HUMO_CALIDAD ? COMBOS.filter((c) => c.calidad === process.env.HUMO_CALIDAD) : COMBOS;
  const url = path.join(raiz, 'index.html');
  for (const combo of soloCombos) {
    const tag = `${combo.calidad}-${combo.estacion}-${combo.clima}`;
    const antes = errores.length;
    try {
    donde = `${tag} carga`;
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(${JSON.stringify({ ...combo, musica: false })})); localStorage.removeItem('hojarasca-v1'); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let i = 0; i < 240 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca').catch(() => false); }
    if (!listo) { errores.push(`[${tag}] el mundo no terminó de construirse`); continue; }
    await js(`document.getElementById('btn-entrar')?.click(); 1`); await esperar(2500);
    const fps = [];
    for (const id of LUGARES) {
      donde = `${tag} `+id; console.log('·', donde);
      const ok = await js(`(()=>{const H=window.__hojarasca,l=H.T.lugares['${id}'];if(!l)return false;H.jugador.ubicar(l.x+6,l.z+6,Math.atan2(6,6));return true;})()`);
      if (!ok) { errores.push(`[${tag}] lugar inexistente ${id}`); continue; }
      await js(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW',bubbles:true}));1`);
      await esperar(1200);
      await js(`document.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW',bubbles:true}));1`);
      const t0 = await js('performance.now()'); const f0 = await js('window.__hojarasca.renderer.info.render.frame');
      await esperar(1500);
      const t1 = await js('performance.now()'); const f1 = await js('window.__hojarasca.renderer.info.render.frame');
      fps.push(+((f1 - f0) / ((t1 - t0) / 1000)).toFixed(0));
      for (const giro of [0, 1.6, 3.2, 4.8]) {
        const pisadas = await js(`(()=>{const H=window.__hojarasca;H.jugador.estado.yaw=(H.jugador.estado.yaw||0)+${giro};return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
          const bs=[...document.querySelectorAll('#brujula b')].filter(b=>b.style.display!=='none').map(b=>b.getBoundingClientRect());let n=0;
          for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++)if(bs[i].left<bs[j].right&&bs[j].left<bs[i].right)n++;r(n);})));})()`);
        if (pisadas) errores.push(`[${tag}] brújula con ${pisadas} etiquetas superpuestas en ${id}`);
      }
      if (['refugio', 'faro', 'mirador', 'estacion'].includes(id)) {
        const img = await w.webContents.capturePage();
        fs.writeFileSync(path.join(salida, `${tag}-${id}.jpg`), img.toJPEG(70));
      }
    }
    // cuaderno, guardado y cartel de error
    await js(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'Tab',key:'Tab',bubbles:true}));1`); await esperar(800);
    await js(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape',bubbles:true}));1`); await esperar(500);
    const guardado = await js(`(()=>{try{window.__hojarasca.guardar();return !!localStorage.getItem('hojarasca-v1');}catch(e){return 'ERR '+e.message}})()`);
    const cartel = await js(`(()=>{const e=[...document.querySelectorAll('#error,#fallo,.error,[id*=error]')].find(n=>n.offsetParent&&n.textContent.trim());return e?e.textContent.trim().slice(0,200):''})()`);
    if (cartel) errores.push(`[${tag}] cartel de error: ${cartel}`);
    if (guardado !== true) errores.push(`[${tag}] guardado: ${guardado}`);
    resumen.push({ tag, fpsMin: Math.min(...fps), fpsMed: Math.round(fps.reduce((a, b) => a + b, 0) / fps.length), erroresNuevos: errores.length - antes, guardado });
    } catch (e) { errores.push(`[${tag}] ${e.message}`); resumen.push({ tag, abortado: e.message }); }
  }
  const informe = { resumen, errores };
  fs.writeFileSync(path.join(salida, 'informe.json'), JSON.stringify(informe, null, 2));
  console.log(JSON.stringify(informe, null, 2));
  app.exit(errores.length ? 1 : 0);
});

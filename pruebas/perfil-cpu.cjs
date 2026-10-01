// Perfil de CPU del bucle del juego, cuadro por cuadro (2.2).
//
// medir-rendimiento.cjs dice cuánto tarda cada subsistema según el perfilador propio;
// esto dice en qué funciones se va el tiempo, con el muestreador de V8. Juega cuadros
// reales del bucle (llamándolo a mano, sin esperar a requestAnimationFrame, que en una
// ventana oculta va a un cuadro por segundo) desde un punto de vista fijo.
//
// Uso: npx electron pruebas/perfil-cpu.cjs --modo=relax|desafio [--etiqueta=antes] [--cuadros=400]
//   → pruebas/salidas/perfil-<modo>-<etiqueta>.json
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] || d;
const modo = arg('modo', 'relax'), etiqueta = arg('etiqueta', 'actual'), cuadros = Number(arg('cuadros', 400));
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
app.commandLine.appendSwitch('disable-gpu-sandbox');

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { backgroundThrottling: false } });
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), esperar(300000).then(() => { throw new Error('timeout'); })]);
  const url = path.join(raiz, 'index.html');
  const r = { modo, etiqueta, cuadros };
  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'${modo}', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
    // el mismo lugar, el mismo rumbo y la misma hora en cada corrida
    r.vista = await js(`(()=>{
      const H = window.__hojarasca, js = H.jugador.estado, p = H.T.lugares.refugio;
      js.pos.set(p.x + 26, H.T.altura(p.x + 26, p.z + 26) + 1.65, p.z + 26);
      js.yaw = Math.PI * 0.25; js.pitch = -0.05; H.progreso.horas = ${modo === 'desafio' ? 21 : 10};
      return { x: +js.pos.x.toFixed(1), z: +js.pos.z.toFixed(1) };
    })()`);
    if (modo === 'relax') {
      // lo que suma la 2.2 al Relax, andando: cantero sembrado, gallinero, telar, feria
      r.escena = await js(`(()=>{
        const H = window.__hojarasca, js = H.jugador.estado, O = H.obras, P = H.progreso;
        Object.assign(P.materiales, { tronco: 99, tabla: 99, piedra: 99 });
        const hechas = [];
        for (const [id, d, a] of [['cantero', 5, 0.5], ['gallinero', 7, -0.4], ['telar', 6, 1.2], ['cantero', 5, -1.1]]) {
          const p = H.PLANOS.find((q) => q.id === id); O.elegir(p);
          const ang = js.yaw + a, x = js.pos.x - Math.sin(ang) * d, z = js.pos.z - Math.cos(ang) * d;
          const f = O.fundar(x, z, js.yaw, js.pos.y);
          if (f.ok) { for (let g = 0; g < 12 && f.obra.datos.etapas < f.obra.plano.etapas.length; g++) if (!O.avanzar(f.obra, P.materiales).ok) break; hechas.push(id); }
        }
        O.elegir(null); P.obras = O.obras.map((o) => o.datos);
        H.refrescarGallineros(); P.dia = 5;
        P.cosas['semillas-habas'] = 3;
        const c = H.canteroCerca(); if (c) H.usarCantero(c);
        H.refrescarHuerta();
        return hechas;
      })()`);
    } else {
      r.escena = await js(`(()=>{const H=window.__hojarasca, D=H.desafio, js=H.jugador.estado;
        const tipos=['rastreador','rastreador','rastreador','rastreador','rastreador','rastreador','rastreador','rastreador','bruto','bruto','bruto','tirador','tirador','tirador','saltador','saltador','escupidor','excavador'];
        tipos.forEach((t,i)=>{ const d=8+(i%6)*2.6, l=((i/6|0)-1)*3.2; D.invocar(t, js.pos.x-Math.sin(js.yaw)*d+Math.cos(js.yaw)*l, js.pos.z-Math.cos(js.yaw)*d-Math.sin(js.yaw)*l); });
        for (const a of D.aliens) a.vida = a.vidaMax = 1e6;
        return D.aliens.length})()`);
    }
    // que se acomoden el LOD y los chunks
    await js(`(()=>{const H=window.__hojarasca; for(let i=0;i<60;i++) H.__bucle(); return 1})()`);
    // tiempo por cuadro, sin el perfilador encima
    r.msPorCuadro = await js(`(()=>{const H=window.__hojarasca; const N=${Math.max(60, Math.round(cuadros / 2))}; const t0=performance.now(); for(let i=0;i<N;i++) H.__bucle(); return +((performance.now()-t0)/N).toFixed(3)})()`);
    r.dibujo = await js(`(()=>{const R=window.__hojarasca.renderer; return {llamadas:R.info.render.calls, triangulos:R.info.render.triangles}})()`);
    // el perfil
    const dbg = w.webContents.debugger;
    dbg.attach('1.3');
    await dbg.sendCommand('Profiler.enable');
    await dbg.sendCommand('Profiler.setSamplingInterval', { interval: 100 });
    await dbg.sendCommand('Profiler.start');
    await js(`(()=>{const H=window.__hojarasca; for(let i=0;i<${cuadros};i++) H.__bucle(); return 1})()`);
    const { profile } = await dbg.sendCommand('Profiler.stop');
    dbg.detach();
    // tiempo propio por función (de los intervalos entre muestras)
    const porId = new Map(profile.nodes.map((n) => [n.id, n]));
    const propio = new Map();
    let total = 0;
    profile.samples.forEach((id, i) => {
      const dt = profile.timeDeltas[i] || 0;
      const n = porId.get(id);
      const cf = n.callFrame;
      const clave = `${cf.functionName || '(anónima)'} @${path.basename(cf.url || '') || '-'}:${cf.lineNumber + 1}`;
      propio.set(clave, (propio.get(clave) || 0) + dt);
      total += dt;
    });
    // de qué módulo viene cada línea del index armado
    const lineas = fs.readFileSync(url, 'utf8').split('\n');
    const modulos = [];
    // armar.mjs abre cada módulo con «// ===== nombre =====»
    lineas.forEach((l, i) => { const m = /^\/\/ ===== (.+) =====$/.exec(l); if (m) modulos.push({ linea: i + 1, nombre: m[1] }); });
    const moduloDe = (n) => { let r0 = ''; for (const m of modulos) { if (m.linea <= n) r0 = m.nombre; else break; } return r0; };
    r.totalMs = +(total / 1000).toFixed(1);
    // three.js va antes que el primer módulo del juego; lo nativo (WebGL, el recolector) no tiene archivo
    const primero = modulos.length ? modulos[0].linea : Infinity;
    const moduloDeClave = (k) => {
      if (!k.includes('@index.html')) return k.startsWith('(') ? k.split(' @')[0] : 'nativo (WebGL)';
      const n = Number(k.split(':').pop());
      return n < primero ? 'three.js' : moduloDe(n);
    };
    r.funciones = [...propio.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([k, us]) => (
      { funcion: k, modulo: moduloDeClave(k), ms: +(us / 1000).toFixed(1), pct: +(us / total * 100).toFixed(1) }));
    const porModulo = new Map();
    for (const [k, us] of propio) { const m = moduloDeClave(k); porModulo.set(m, (porModulo.get(m) || 0) + us); }
    r.porModulo = [...porModulo.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25)
      .map(([m, us]) => ({ modulo: m, msPorCuadro: +(us / 1000 / cuadros).toFixed(3), pct: +(us / total * 100).toFixed(1) }));
  } catch (e) { r.error = e.message; }
  const archivo = path.join(__dirname, 'salidas', `perfil-${modo}-${etiqueta}.json`);
  fs.mkdirSync(path.dirname(archivo), { recursive: true });
  fs.writeFileSync(archivo, JSON.stringify(r, null, 2));
  console.log(JSON.stringify({ modo, msPorCuadro: r.msPorCuadro, dibujo: r.dibujo, error: r.error }, null, 0));
  for (const m of (r.porModulo || [])) console.log(`${String(m.pct).padStart(5)}%  ${String(m.msPorCuadro).padStart(6)} ms/cuadro  ${m.modulo}`);
  app.exit(0);
});

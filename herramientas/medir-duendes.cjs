// 3.8.7: cuánto cuesta la noche con muchos duendes. Carga el Desafío de noche, pone al jugador en su base mirando
// al bosque y suelta 0, 8, 16 y 24 duendes (el tope, MAX_ALIENS) de todos los tipos a 12-40 m, a la vista, que
// avanzan y pelean de verdad (el jugador no cae). Por cada cantidad corre CUADROS cuadros del bucle de verdad y mide:
//   - el cuadro entero con la placa esperada (gl.finish: CPU + GPU, lo que sentiría el jugador sin vsync);
//   - el CPU de cada subsistema (el perfilador del juego: desafio, render, fauna, clima, ambiente...);
//   - dibujos y triángulos (renderer.info), y cuántos duendes se dibujan por modelo (estadoDuendes).
// Escribe <SALIDA>/medidas.json y una tabla en la consola. Perfil propio en <SALIDA>/perfil.
// Uso: SALIDA=<carpeta> CALIDAD=media node_modules/electron/dist/electron.exe --no-sandbox herramientas/medir-duendes.cjs
// Opciones: PROY=. CALIDADES=baja,media (varias) CUADROS=240 CANTIDADES=0,8,16,24 VENTANA=1 (ventana visible, 1280x720)
//   OBRAS=0 (sin el fortín de empalizadas, torres y antorchas alrededor)
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const PROY = path.resolve(process.env.PROY || '.');
const SALIDA = path.resolve(process.env.SALIDA || './medir-duendes-salida');
const CALIDADES = (process.env.CALIDADES || process.env.CALIDAD || 'media').split(',');
const CUADROS = Number(process.env.CUADROS || 240);
const CANTIDADES = (process.env.CANTIDADES || '0,8,16,24').split(',').map(Number);
const OBRAS = process.env.OBRAS !== '0';
fs.mkdirSync(SALIDA, { recursive: true });
app.setPath('userData', path.join(SALIDA, 'perfil'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const VENTANA = !!process.env.VENTANA;
  const w = new BrowserWindow({ show: VENTANA, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => { const m = String(e.message); if (e.level === 'error' && !/Security|GL_INVALID|PCF|Autofill|favicon/.test(m)) console.log('  consola: ' + m.slice(0, 200)); });
  const js = (c, lim = 600000) => Promise.race([w.webContents.executeJavaScript(c, true), new Promise((_, no) => setTimeout(() => no(new Error('sin respuesta')), lim))]);
  const H = 'window.__hojarasca';
  const url = path.join(PROY, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const resultados = [];
  for (const calidad of CALIDADES) {
    await abrir();
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${calidad}', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'})); 1`);
    await abrir();
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!document.getElementById("btn-entrar")', 5000).catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    // de noche, en la base, mirando al bosque; la noche ya empezada (sin oleada propia: los duendes los pone esto)
    await js(`(()=>{ const H=${H}, D=H.progreso.desafio; H.ajustes.limiteFps='libre'; D.tutorial=99; D.oleadas=6; H.progreso.dia++; H.progreso.horas=19.4;
      for (let i=0;i<30;i++){ H.progreso.horas+=0.01; H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); } H.progreso.horas=20.6;
      for (let i=0;i<20;i++) H.desafio.actualizar(0.05,{noche:1,dtReal:0.05});
      for (const a of H.desafio.aliens) { a.estado='irse'; a.t=9; } H.desafio.actualizar(0.05,{noche:1,dtReal:0.05});
      H.ajustes.duracion = 45; return 1 })()`);
    // un fortín de verdad alrededor (lo que más cuesta: cada tiro y cada paso miran las obras de cerca): un anillo de
    // empalizadas a 9 m, con huecos, y unas torres de vigía y antorchas
    if (OBRAS) console.log('  fortín: ' + JSON.stringify(await js(`(()=>{ const H=${H}, O=H.obras, P=H.progreso, j=H.jugador.estado; let n = 0;
      Object.assign(P.materiales, { tronco: 999, tabla: 999, piedra: 999, cristal: 99 });
      const poner = (id, x, z, rot) => { const p = H.PLANOS.find(q => q.id === id); if (!p) return; O.elegir(p); const f = O.fundar(x, z, rot, j.pos.y); O.elegir(null); if (!f.ok) return;
        for (let g = 0; g < 12 && f.obra.datos.etapas < f.obra.plano.etapas.length; g++) { if (!O.avanzar(f.obra, P.materiales).ok) break; } n++; };
      for (let k = 0; k < 20; k++) { if (k % 5 === 2) continue; const a = k / 20 * Math.PI * 2; poner('empalizada', j.pos.x + Math.sin(a) * 9, j.pos.z + Math.cos(a) * 9, a); }
      for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + 0.4; poner('torre-vigia', j.pos.x + Math.sin(a) * 6, j.pos.z + Math.cos(a) * 6, 0); poner('antorcha', j.pos.x + Math.sin(a + 0.5) * 7, j.pos.z + Math.cos(a + 0.5) * 7, 0); }
      P.obras = O.obras.map(o => o.datos); H.desafio.defensas.refrescar(); H.desafio.fortin.refrescar(); return { obras: O.obras.length, puestas: n } })()`)));
    for (let i = 0; i < 120; i++) await js(`${H}.__bucle(); 1`);
    for (const n of CANTIDADES) {
      const r = await js(`(async ()=>{ const H=${H}, D=H.desafio, J=H.jugador, js=J.estado, gl=H.renderer.getContext();
        for (const a of D.aliens) { a.estado='irse'; a.t=9; } for (let i=0;i<3;i++) H.__bucle();
        const tipos=['rastreador','tirador','saltador','escupidor','excavador','volador','bruto','rastreador'];
        const base = { x: js.pos.x, z: js.pos.z }, yaw = js.yaw;
        for (let k=0;k<${n};k++) { const t = tipos[k % tipos.length], ang = yaw + Math.PI + (k / Math.max(1, ${n}) - 0.5) * 1.4, r = 12 + (k % 5) * 7;
          const a = D.invocar(t, base.x + Math.sin(ang) * r, base.z + Math.cos(ang) * r); if (a) { a.vida = a.vidaMax = 1e6; } }
        for (let i=0;i<30;i++) { H.progreso.desafio.salud = 1e5; H.__bucle(); }
        H.perfilador.limpiar(); const R = H.renderer, auto = R.info.autoReset; R.info.autoReset = false;
        const progs0 = R.info.programs ? R.info.programs.length : -1, nombresAntes = R.info.programs ? R.info.programs.map((p) => p.name + p.cacheKey.length) : [];
        const ms = []; let llamadas = 0, tri = 0;
        for (let i=0;i<${CUADROS};i++) {
          H.progreso.desafio.salud = 1e5; js.pos.x = base.x; js.pos.z = base.z; js.yaw = yaw;
          R.info.reset(); const t0 = performance.now(); H.__bucle(); gl.finish(); ms.push(performance.now() - t0);
          llamadas += H.renderer.info.render.calls; tri += H.renderer.info.render.triangles;
          if (i % 8 === 7) await new Promise((r) => setTimeout(r, 0));
        }
        R.info.autoReset = auto;
        const iMax = ms.indexOf(Math.max(...ms)), tirones = ms.filter((x) => x > 50).length;
        ms.sort((a, b) => a - b);
        const progs1 = R.info.programs ? R.info.programs.length : -1;
        const sub = {}, pico = {}; for (const [k, s] of H.perfilador.stats) { sub[k] = +s.ema.toFixed(2); pico[k] = +s.pico.toFixed(1); }
        const est = D.estadoDuendes();
        const vivos = D.aliens.filter((a) => a.estado !== 'morir' && a.estado !== 'irse').length;
        H.progreso.desafio.salud = 100;
        return { n: ${n}, vivos, mediana: +ms[Math.floor(ms.length / 2)].toFixed(2), p95: +ms[Math.floor(ms.length * 0.95)].toFixed(2), max: +ms[ms.length - 1].toFixed(2), iMax, tirones, pico, programas: [progs0, progs1],
          dibujos: Math.round(llamadas / ${CUADROS}), triangulos: Math.round(tri / ${CUADROS}), sub, modelos: est.modelos.filter((m) => m.dibujados).map((m) => m.clave + ':' + m.dibujados + '×' + m.tri).join(' ') } })()`);
      r.calidad = calidad;
      resultados.push(r);
      console.log(`${calidad.padEnd(6)} ${String(n).padStart(2)} duendes (${r.vivos} vivos): mediana ${r.mediana} ms · p95 ${r.p95} · máx ${r.max} (cuadro ${r.iMax}; ${r.tirones} de más de 50 ms; programas ${r.programas.join("→")}; picos ${JSON.stringify(r.pico)}) · ${r.dibujos} dibujos · ${(r.triangulos / 1000).toFixed(0)}k tri · ${JSON.stringify(r.sub)}`);
      if (r.modelos) console.log('       ' + r.modelos);
    }
  }
  fs.writeFileSync(path.join(SALIDA, 'medidas.json'), JSON.stringify(resultados, null, 1));
  app.exit(0);
});

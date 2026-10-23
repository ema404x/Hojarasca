// 4.8.1: cuánto cuesta lo que se ve de la nave (antes) o del aro de hongos (ahora) en la noche. Carga el Desafío, empieza la noche 1,
// espera a cada fase, pone la cámara a 30 m del punto de bajada mirándolo (y otra mirando para el otro lado, donde no se ve) y corre
// CUADROS cuadros del bucle de verdad midiendo el cuadro entero con la placa esperada (gl.finish), los dibujos y los triángulos.
// Uso (desde PowerShell, con el lanzador: perfil propio, en el monitor externo):
//   $env:PROY='<carpeta del juego armado>'; $env:SALIDA='<carpeta>'; powershell -File herramientas\lanzar-electron.ps1 -Script herramientas\medir-aro.cjs -Espera 600
// Opciones: CUADROS=200 CALIDAD=media. Escribe <SALIDA>/medidas-aro.json y una tabla.
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const PROY = path.resolve(process.env.PROY || '.');
const SALIDA = path.resolve(process.env.SALIDA || './medir-aro-salida');
const CUADROS = Number(process.env.CUADROS || 200);
const CALIDAD = process.env.CALIDAD || 'media';
fs.mkdirSync(SALIDA, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const js = (c, lim = 300000) => Promise.race([w.webContents.executeJavaScript(c, true), new Promise((_, no) => setTimeout(() => no(new Error('sin respuesta')), lim))]);
  const H = 'window.__hojarasca';
  const url = path.join(PROY, 'index.html');
  const resultados = [];
  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${CALIDAD}', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(`(()=>{ const H=${H}; H.ajustes.limiteFps = 'libre'; H.progreso.desafio.tutorial = 99; return 1 })()`);
    const sim = (seg) => js(`(()=>{ const H=${H}; for (let i=0;i<${Math.round(seg / 0.05)};i++){ H.progreso.desafio.salud = 100; H.desafio.actualizar(0.05,{noche:1, dtReal:0.05}); } return 1 })()`);
    // la noche 1
    await js(`(()=>{ const H=${H}, D=H.progreso.desafio; D.semilla = 'COIHUE-4821'; D.oleadas = 0; D.especial = null; D.especialAnterior = 'roja'; D.oleadaNoche = null; D.oleadaTerminada = false; D.ladoNoche = null; D.rescate = null; H.progreso.dia++; H.progreso.horas = 19.6; return 1 })()`);
    await sim(1.2);
    await js(`${H}.progreso.horas = 20.6; 1`);
    let t = 0;
    const medir = async (nombre, hasta, hacia) => {
      await sim(hasta - t); t = hasta;
      // la cámara: a 30 m del punto de bajada (hacia el jugador), mirando al punto (o para el otro lado)
      const c = JSON.parse(await js(`(()=>{ const H=${H}, js=H.jugador.estado, g=H.desafio.nave; const dx = js.pos.x - g.position.x, dz = js.pos.z - g.position.z, l = Math.hypot(dx, dz) || 1;
        const x = g.position.x + dx / l * 30, z = g.position.z + dz / l * 30, y = H.T.altura(x, z) + 2.5;
        const vx = g.position.x - x, vz = g.position.z - z, d = Math.hypot(vx, vz), pitch = Math.atan2(g.position.y - y + 1, d);
        const yaw = Math.atan2(-vx, -vz);
        return JSON.stringify({ x, y, z, yaw, pitch, visible: g.visible }) })()`));
      const yaw = c.yaw + (hacia ? 0 : Math.PI), pitch = hacia ? c.pitch : 0;
      const r = JSON.parse(await js(`(async () => {
        const H = ${H}, R = H.renderer, gl = R.getContext();
        H.__camaraFija = { x: ${c.x}, y: ${c.y}, z: ${c.z}, yaw: ${yaw}, pitch: ${pitch} };
        for (let i = 0; i < 40; i++) H.__bucle();
        const ms = [], dib = [], tri = [];
        const programas0 = R.info.programs ? R.info.programs.length : 0;
        for (let i = 0; i < ${CUADROS}; i++) {
          const t0 = performance.now();
          H.__bucle();
          gl.finish();
          ms.push(performance.now() - t0);
          dib.push(R.info.render.calls); tri.push(R.info.render.triangles);
        }
        const q = (a, p) => a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))];
        const media = (a) => a.reduce((s, x) => s + x, 0) / a.length;
        // lo que aporta la nave (o el aro) solo: el mismo cuadro con y sin
        const g = H.desafio.nave, vis0 = g.visible, una = (v) => { g.visible = v; for (let i = 0; i < 3; i++) { H.__bucle(); gl.finish(); } return [R.info.render.calls, R.info.render.triangles]; };
        const con = una(true), sin = una(false); g.visible = vis0;
        H.__camaraFija = null;
        return JSON.stringify({ aporte_dibujos: con[0] - sin[0], aporte_triangulos: con[1] - sin[1], ms_p50: +q(ms, 0.5).toFixed(2), ms_p95: +q(ms, 0.95).toFixed(2), ms_media: +media(ms).toFixed(2), dibujos: Math.round(media(dib)), triangulos: Math.round(media(tri)), programasNuevos: (R.info.programs ? R.info.programs.length : 0) - programas0 });
      })()`));
      resultados.push({ fase: nombre, mira: hacia ? 'al punto de bajada' : 'para otro lado', ...r, visible: c.visible });
      console.log(`${nombre.padEnd(22)} ${(hacia ? 'mirando' : 'de espaldas').padEnd(11)} aporta ${String(r.aporte_dibujos).padStart(3)} dibujos y ${String(r.aporte_triangulos).padStart(6)} triángulos · p50 ${String(r.ms_p50).padStart(6)} ms · p95 ${String(r.ms_p95).padStart(6)} ms · ${String(r.dibujos).padStart(4)} dibujos · ${String(r.triangulos).padStart(7)} triángulos · programas nuevos ${r.programasNuevos}${c.visible ? '' : ' (¡nave/aro no visible!)'}`);
    };
    await medir('desde t=2 s', 2, true);
    await medir('desde t=7 s', 7, true);
    await medir('desde t=25 s', 25, true);
    await medir('desde t=25 s', 25, false);
    fs.writeFileSync(path.join(SALIDA, 'medidas-aro.json'), JSON.stringify({ proy: PROY, calidad: CALIDAD, cuadros: CUADROS, resultados }, null, 1));
  } catch (e) {
    console.log('FALLÓ', e && e.stack || e);
  }
  app.exit(0);
});

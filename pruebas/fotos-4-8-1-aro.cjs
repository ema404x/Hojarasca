// 4.8.1: capturas del aro (antes: la nave) en varias noches, de un puesto de los invasores y de una ruina de los restos.
// Sirve para "antes" y "después": la carpeta del juego armado va en HUMO_RAIZ (por defecto, la de este proyecto) y
// las capturas en HUMO_SALIDA. Hay que lanzarla con -Visible (con la ventana oculta capturePage devuelve un cuadro viejo).
//   powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\fotos-4-8-1-aro.cjs -Visible -Espera 900 -Perfil <carpeta>
// Variables: HUMO_RAIZ, HUMO_SALIDA, HUMO_NOCHES (por ejemplo "1,5,12,20"), HUMO_ESCENAS ("noches,puesto,ruina").
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = process.env.HUMO_RAIZ ? path.resolve(process.env.HUMO_RAIZ) : path.resolve(__dirname, '..');
const salida = process.env.HUMO_SALIDA ? path.resolve(process.env.HUMO_SALIDA) : path.join(raiz, 'pruebas', 'salidas', 'aro-481');
const NOCHES = (process.env.HUMO_NOCHES || '1,5,12,20').split(',').map(Number);
const ESCENAS = (process.env.HUMO_ESCENAS || 'noches,puesto,ruina').split(',');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const H = 'window.__hojarasca';
fs.mkdirSync(salida, { recursive: true });

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: true, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { errores.push(m.slice(0, 300)); console.log('  ! consola:', m.slice(0, 200)); }
  });
  const js = (c) => w.webContents.executeJavaScript(c);
  const url = path.join(raiz, 'index.html');
  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) { listo = true; break; } }
    if (!listo) throw new Error('no cargó');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(`(() => { const H = ${H}, D = H.desafio; if (D.__envuelto) return 1; const orig = D.actualizar; D.__envuelto = true;
      D.actualizar = function (dt, c) { const r = orig.call(this, window.__congelar ? 0 : dt, c);
        const k = window.__cam; if (k) { if (k.h != null) k.o[1] = H.T.altura(k.o[0], k.o[2]) + k.h; const cam = H.camara; cam.position.set(k.o[0], k.o[1], k.o[2]); cam.lookAt(k.a[0], k.a[1], k.a[2]); cam.updateMatrixWorld(true); for (const h of cam.children) h.visible = false; }
        return r; };
      H.ajustes.limiteFps = 'libre'; H.progreso.desafio.tutorial = 99; return 1 })()`);
    await js(`(() => { const s = document.createElement('style'); s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; document.head.appendChild(s); return 1; })()`);

    const sim = (seg, extra = '') => js(`(()=>{const H=${H}; for(let i=0;i<${Math.round(seg / 0.05)};i++){ H.progreso.desafio.salud = 100; ${extra} H.desafio.actualizar(0.05,{noche:1, dtReal:0.05}); } return 1})()`);
    const foto = async (nombre, cam) => {
      await js(`(()=>{ const H=${H}; window.__cam = ${JSON.stringify(cam)}; window.__congelar = true; for (let i = 0; i < 4; i++) { H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); H.__bucle(); } return 1 })()`);
      await esperar(1200);
      try { await w.webContents.capturePage(); } catch (e) { /* se descarta el primero */ }
      await esperar(600);
      let img = null;
      for (let k = 0; k < 4 && !img; k++) { try { img = await w.webContents.capturePage(); } catch (e) { await esperar(1500); } }
      if (img) fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
      console.log('  foto', nombre, img ? 'ok' : 'SIN IMAGEN');
      await js(`window.__cam = null; window.__congelar = false; 1`);
    };
    // limpia lo de la noche anterior (amanece, se va todo) y deja la noche quieta
    const limpiar = async () => {
      await js(`(()=>{ const H=${H}, D=H.progreso.desafio; H.progreso.horas = 8; for (let i = 0; i < 8; i++) H.desafio.actualizar(0.05,{noche:0,dtReal:0.05});
        for (const a of H.desafio.aliens.slice()) { a.estado='irse'; a.t=9; } for (let i=0;i<6;i++) H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); return 1 })()`);
    };
    // desde donde está el jugador: a la nave/aro, y de cerca
    const posiciones = () => js(`(()=>{ const H=${H}, js=H.jugador.estado, g=H.desafio.nave, T=H.T;
      return { jx: js.pos.x, jy: js.pos.y, jz: js.pos.z, nx: g.position.x, ny: g.position.y, nz: g.position.z, vis: g.visible } })()`);
    const alturaEn = (x, z) => js(`(()=>{ const H=${H}; const T=H.T; return T && T.altura ? T.altura(${x}, ${z}) : null })()`);

    if (ESCENAS.includes('noches')) {
      for (const n of NOCHES) {
        console.log('noche', n);
        await limpiar();
        await js(`(()=>{ const H=${H}, D=H.progreso.desafio; D.oleadas = ${n - 1}; D.especial = null; D.especialAnterior = 'roja'; D.oleadaNoche = null; D.oleadaTerminada = false; D.ladoNoche = null; D.distraccion = null; D.rescate = null; H.progreso.dia++; H.progreso.horas = 19.6; return 1 })()`);
        await sim(1.2, 'H.progreso.horas += 0.0005;');
        await js(`${H}.progreso.horas = 20.6; 1`);
        const t0 = [1.5, 4.5, 9, 20, 40];
        let t = 0;
        for (let k = 0; k < t0.length; k++) {
          await sim(t0[k] - t); t = t0[k];
          const p = await posiciones();
          const gy = await alturaEn(p.nx, p.nz);
          const dx = p.jx - p.nx, dz = p.jz - p.nz, l = Math.hypot(dx, dz) || 1;
          const y0 = gy == null ? p.ny : gy;
          // lo que ve el jugador: desde donde está, hacia la nave o el aro
          await foto(`n${n}-t${String(t0[k]).replace('.', '_')}-jugador`, { o: [p.jx, p.jy + 1.7, p.jz], a: [p.nx, Math.min(p.ny, y0 + 60), p.nz] });
          // a media distancia (lo que se ve desde lejos: 75 m, a la altura de los ojos, mirando al punto de bajada)
          await foto(`n${n}-t${String(t0[k]).replace('.', '_')}-l75`, { o: [p.nx + dx / l * 75, 0, p.nz + dz / l * 75], h: 1.8, a: [p.nx, Math.max(p.ny, y0 + 3), p.nz] });
          // de cerca: a 24 m del punto de bajada, hacia el jugador
          if (k === 1 || k === 3) await foto(`n${n}-t${String(t0[k]).replace('.', '_')}-cerca`, { o: [p.nx + dx / l * 24, y0 + 4, p.nz + dz / l * 24], a: [p.nx, y0 + 4, p.nz] });
          // un plano más cerca (12 m, a la altura de los ojos) y uno desde arriba: sólo con HUMO_CERCA=1
          if (process.env.HUMO_CERCA && k <= 3) {
            const tt = String(t0[k]).replace('.', '_');
            await foto(`n${n}-t${tt}-c12`, { o: [p.nx + dx / l * 13, 0, p.nz + dz / l * 13], h: 2.2, a: [p.nx, y0 + 1.6, p.nz] });
            await foto(`n${n}-t${tt}-arriba`, { o: [p.nx + dx / l * 9, 0, p.nz + dz / l * 9], h: 14, a: [p.nx, y0, p.nz] });
          }
          console.log(`  t=${t} nave visible=${p.vis} y=${p.ny.toFixed(1)} suelo=${gy == null ? '?' : gy.toFixed(1)}`);
        }
        // al amanecer: se va
        await js(`${H}.progreso.horas = 5.9; 1`);
        await sim(2);
        const p2 = await posiciones();
        const gy2 = await alturaEn(p2.nx, p2.nz);
        await foto(`n${n}-amanecer-jugador`, { o: [p2.jx, p2.jy + 1.7, p2.jz], a: [p2.nx, (gy2 == null ? p2.ny : gy2) + 6, p2.nz] });
        console.log(`  amanecer: visible=${p2.vis}`);
        await sim(6);
      }
    }
    if (ESCENAS.includes('puesto')) {
      console.log('puesto');
      await limpiar();
      const r = JSON.parse(await js(`(()=>{ const H=${H}, D=H.desafio, js=H.jugador.estado; H.progreso.horas = 11.5;
        const x = js.pos.x + 60, z = js.pos.z + 20; const d = H.progreso.desafio;
        d.puestos = d.puestos && Array.isArray(d.puestos.lista) ? d.puestos : { lista: [], proximoId: 1, golpes: [], rotos: 0 };
        d.puestos.lista = d.puestos.lista.filter((p) => p.id !== 999);
        d.puestos.lista.push({ id: 999, x, z, nivel: 3, nacio: 1, crecio: 1, guardias: 0, visto: true, roto: false, estructuras: [
          { tipo: 'aguja', dx: 0, dz: 0, vida: 150, max: 150 }, { tipo: 'vaina', dx: -4.2, dz: -2.4, vida: 80, max: 80 }, { tipo: 'generador', dx: 4.0, dz: -2.0, vida: 110, max: 110 }, { tipo: 'vaina', dx: 2.6, dz: 3.4, vida: 80, max: 80 }] });
        D.puestosMundo.sincronizar(); for (let i = 0; i < 6; i++) D.actualizar(0.05, { noche: 0, dtReal: 0.05 });
        return JSON.stringify({ x, z, y: H.T.altura(x, z) }) })()`));
      for (const [tag, hora] of [['dia', 11.5], ['noche', 22.5]]) {
        await js(`${H}.progreso.horas = ${hora}; 1`);
        await foto(`puesto-${tag}-cerca`, { o: [r.x - 13, 0, r.z - 9], h: 2.0, a: [r.x, r.y + 2.5, r.z] });
        await foto(`puesto-${tag}-lejos`, { o: [r.x - 38, 0, r.z - 26], h: 6, a: [r.x, r.y + 5, r.z] });
        await foto(`puesto-${tag}-cielo`, { o: [r.x - 22, 0, r.z - 15], h: 1.8, a: [r.x, r.y + 30, r.z] });
      }
      await js(`(()=>{ const d=${H}.progreso.desafio; d.puestos.lista = d.puestos.lista.filter(p => p.id !== 999); ${H}.desafio.puestosMundo.sincronizar(); return 1 })()`);
    }
    if (ESCENAS.includes('ruina')) {
      console.log('ruina');
      await limpiar();
      const r = JSON.parse(await js(`(()=>{ const H=${H}, D=H.desafio, d=H.progreso.desafio; d.restos = null; d.planos = []; const hubo = D.eventos.soltarRestos(); const q = d.restos; if (!q) return JSON.stringify({ hubo });
        H.jugador.ubicar(q.x + 30, q.z, 0); for (let i = 0; i < 5; i++) D.actualizar(0.05, { noche: 0, dtReal: 0.05 });
        return JSON.stringify({ hubo, x: q.x, z: q.z, rot: q.rot, y: H.T.altura(q.x, q.z) }) })()`));
      console.log('  ruina', JSON.stringify(r));
      if (r.hubo) {
        const loc = (lx, lz, y) => [r.x + lx * Math.cos(r.rot) + lz * Math.sin(r.rot), y, r.z - lx * Math.sin(r.rot) + lz * Math.cos(r.rot)];
        for (const [tag, hora] of [['dia', 11.5], ['noche', 22.5]]) {
          await js(`${H}.progreso.horas = ${hora}; 1`);
          await foto(`ruina-${tag}-entrada`, { o: loc(0.4, -9, 0), h: 1.9, a: loc(0, 6, r.y + 1.0) });
          await foto(`ruina-${tag}-lateral`, { o: loc(-10, 8, 0), h: 2.4, a: loc(0, 8.5, r.y + 1.0) });
          await foto(`ruina-${tag}-arriba`, { o: loc(-6, -9, 0), h: 16, a: loc(0, 8.5, r.y) });
          await foto(`ruina-${tag}-adentro`, { o: loc(0, 1.0, 0), h: 1.7, a: loc(0, 14, r.y + 0.8) });
          await foto(`ruina-${tag}-fondo`, { o: loc(0, 11.0, 0), h: 1.7, a: loc(0, 16, r.y + 0.9) });
          await foto(`ruina-${tag}-lejos`, { o: loc(-40, -30, 0), h: 8, a: loc(0, 8.5, r.y + 30) });
        }
      }
    }
    console.log(errores.length ? `ERRORES: ${errores.length}` : 'sin errores de consola');
  } catch (e) {
    console.log('FALLÓ', e && e.stack || e);
  }
  app.exit(0);
});

// 4.10 coihue — fotos «antes / después» del final del Desafío con la misma cámara en las dos versiones (Electron + WebGL).
// El mismo script corre en la versión anterior (4.9.0) y en la nueva: lo que una no tiene se saltea.
//   1. el Coihue plantado desde la base (y, en la nueva, tras dos noches caminando: las huellas y la sombra);
//   2. la escalera de raíces del tronco hueco, en el escalón donde en la nueva se para la primera raíz.
// Uso (PowerShell, con -Visible): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\fotos-4-10-coihue.cjs -Espera 600 -Perfil <carpeta> -Visible
//   HUMO_INDEX=<index.html> · HUMO_SALIDA=<carpeta> · HUMO_ETIQUETA=antes|despues
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(__dirname, 'salidas', 'coihue-4-10-antes-despues'));
const etiqueta = process.env.HUMO_ETIQUETA ? process.env.HUMO_ETIQUETA + '-' : '';
fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: true, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || e.level === 3 || /Uncaught|THREE\.|Shader|ERROR|WebGL/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|favicon|toNonIndexed/.test(m)) { errores.push(m.slice(0, 300)); console.log('[página]', m.slice(0, 300)); }
  });
  const js = (c, limite = 90000) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, rej) => setTimeout(() => rej(new Error(`sin respuesta ${limite / 1000}s`)), limite))]);
  const H = 'window.__hojarasca';
  const url = process.env.HUMO_INDEX ? path.resolve(process.env.HUMO_INDEX) : path.join(raiz, 'index.html');
  const foto = async (nombre) => {
    await js(`(() => { let s = document.getElementById('humo-sin-hud'); if (!s) { s = document.createElement('style'); s.id = 'humo-sin-hud'; document.head.appendChild(s); } s.textContent = 'body > *:not(canvas):not(script):not(style) { visibility: hidden !important; } canvas { visibility: visible !important; }'; })(); 1`);
    await esperar(350);
    let img = null;
    for (let k = 0; k < 2; k++) { try { await w.webContents.capturePage(); } catch {} await esperar(250); }
    for (let k = 0; k < 3 && !img; k++) { try { img = await w.webContents.capturePage(); } catch { await esperar(800); } }
    const ruta = path.join(salida, `${etiqueta}${nombre}.png`);
    if (img && !img.isEmpty()) fs.writeFileSync(ruta, img.toPNG());
    console.log('foto', ruta);
  };
  const fotoQuieta = async (nombre) => { await js(`try { ${H}.abrir('pausa'); } catch {} 1`); await esperar(200); await foto(nombre); await js(`try { ${H}.volverAlJuego(); } catch {} 1`); };
  const poner = (o, a, fov = 60, abs = false) => js(`(()=>{const H=${H}, js=H.jugador.estado, o=${JSON.stringify(o)}, a=${JSON.stringify(a)}; if (!${abs}) { o.y += H.T.altura(o.x, o.z); a.y += H.T.altura(a.x, a.z); }
    const yaw = Math.atan2(-(a.x-o.x), -(a.z-o.z)), pitch = Math.atan2(a.y-o.y, Math.hypot(a.x-o.x, a.z-o.z));
    if (!${abs}) { js.pos.set(o.x, H.T.altura(o.x, o.z), o.z); js.vel.set(0,0,0); js.vy = 0; js.yaw = yaw; js.pitch = pitch; }
    window.__poseD = { p: [o.x, o.y, o.z], r: [pitch, yaw], fov: ${fov}, pie: [js.pos.x, js.pos.y, js.pos.z] };
    if (!H.renderer.__fijo) { const R = H.renderer, orig = R.render.bind(R); R.__fijo = true;
      R.render = (esc, cam) => { const q = window.__poseD; if (q && cam === H.camara) { cam.position.set(...q.p); cam.rotation.order = 'YXZ'; cam.rotation.set(q.r[0], q.r[1], 0); if (cam.fov !== q.fov) { cam.fov = q.fov; cam.updateProjectionMatrix(); } cam.updateMatrixWorld(); if (!${abs}) { H.jugador.estado.pos.set(...q.pie); H.jugador.estado.vel.set(0,0,0); H.jugador.estado.vy = 0; } } return orig(esc, cam); }; }
    return 1})()`);
  const avanzar = (seg) => js(`(()=>{const H=${H}; for (let i = 0; i < ${Math.round(seg / 0.05)}; i++) { H.progreso.desafio.salud = 100; H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 }); } return 1})()`, 120000);
  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'alta', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', estacion:'verano'})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    await js(`(()=>{const H=${H}; H.ajustes.limiteFps = 'libre'; window.addEventListener('blur', (e) => e.stopImmediatePropagation(), true); try { H.volverAlJuego(); } catch {} H.progreso.desafio.tutorial = 99; return 1})()`);
    const base = await js(`(()=>{const H=${H}, c = H.desafio.centroBase ? H.desafio.centroBase() : H.T.lugares.refugio; return { x: c.x, z: c.z } })()`);
    const sit = await js(`(()=>{const H=${H}, T=H.T, r=${JSON.stringify(base)}; let mejor=null;
      for (let a=0;a<48;a++) { const x=r.x+Math.cos(a/48*6.283)*62, z=r.z+Math.sin(a/48*6.283)*62; if (T.agua(x,z)) continue;
        let mojado=false, des=0; for (let k=0;k<10 && !mojado;k++) for (const e of [8,16,26]) { const qx=x+Math.cos(k/10*6.283)*e, qz=z+Math.sin(k/10*6.283)*e; if (T.agua(qx,qz)) { mojado=true; break; } des=Math.max(des,Math.abs(T.altura(qx,qz)-T.altura(x,z))); }
        if (mojado) continue; if (!mejor || des<mejor.des) mejor={x,z,des}; }
      return mejor})()`);
    await js(`(()=>{const H=${H}, D=H.progreso.desafio; D.oleadas = 20; D.capullos = []; D.nodriza = null; H.progreso.dia = 30; H.progreso.horas = 11.5; return H.desafio.asedio.empezar({ x: ${sit.x}, z: ${sit.z} })})()`);
    await avanzar(2);
    const dx = sit.x - base.x, dz = sit.z - base.z, dl = Math.hypot(dx, dz) || 1;
    await poner({ x: base.x + dx / dl * 6, y: 3, z: base.z + dz / dl * 6 }, { x: sit.x, y: 13, z: sit.z }, 66);
    await esperar(600);
    await foto('1-coihue-plantado');
    // en la nueva: dos noches caminando
    if (await js(`!!${H}.progreso.desafio.asedio.camino`)) {
      await js(`(()=>{ const H = ${H}, D = H.progreso.desafio, M = H.desafio.asedio, js = H.jugador.estado;
        for (let n = 0; n < 2; n++) { D.oleadas++; H.progreso.dia++; H.progreso.horas = 20.6; M.alEmpezarNoche(); for (let k = 0; k < 190; k++) { H.progreso.horas += 0.05; if (H.progreso.horas >= 24) H.progreso.horas -= 24; D.salud = 100; M.actualizar(0.25, js); }
          H.progreso.horas = 6.1; M.alTerminarNoche(true); H.progreso.horas = 11.5; for (let k = 0; k < 80; k++) M.actualizar(0.25, js); } return 1 })()`);
      const nave = await js(`(()=>{ const a = ${H}.progreso.desafio.asedio.nave; return { x: a.x, z: a.z } })()`);
      const ex = nave.x - base.x, ez = nave.z - base.z, el = Math.hypot(ex, ez) || 1;
      await poner({ x: base.x + ex / el * 6, y: 3, z: base.z + ez / el * 6 }, { x: nave.x, y: 12, z: nave.z }, 66);
      await esperar(600);
      await foto('2-coihue-tras-dos-noches');
      // desde arriba: la ruta caminada y la sombra hacia la base
      await poner({ x: (nave.x + base.x) / 2, y: 70, z: (nave.z + base.z) / 2 + 0.01 }, { x: (nave.x + base.x) / 2, y: 0, z: (nave.z + base.z) / 2 }, 64);
      await esperar(500);
      await foto('3-desde-arriba');
    }
    await js(`window.__poseD = null; 1`);
    // la escalera de raíces (en las dos versiones): se abre el paso y se entra
    await js(`(()=>{ const H = ${H}, M = H.desafio.asedio, a = H.progreso.desafio.asedio; if (a.camino) { a.camino.llego = true; a.camino.d = a.camino.largo; a.camino.cerco = true; } else { for (const z of a.zonas) z.estado = 'asegurada'; }
      H.progreso.horas = 11; for (let i = 0; i < 120; i++) H.__bucle(); for (const al of H.desafio.aliens) { al.estado = 'irse'; al.t = 9; } for (let i = 0; i < 30; i++) H.desafio.actualizar(0.1, { noche: 0, dtReal: 0.1 });
      for (const z of a.zonas) z.guardia = H.progreso.dia; const s = M.sitioHaz(); H.jugador.ubicar(s.x + 1, s.z + 1, 0, s.y); for (const al of H.desafio.aliens) { al.estado = 'irse'; al.t = 9; } H.desafio.actualizar(0.1, { noche: 0, dtReal: 0.1 }); H.desafio.usarCercaDe(H.jugador.estado.pos); for (let i = 0; i < 60; i++) H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 }); return 1 })()`);
    const R = await js(`(()=>{ const N = ${H}.desafio.naveAdentro; if (!N.enSubida) return null; const S = N.subida, o = S.origen, it = S.raices ? S.raices[0].tramo : 38, q = S.tramos[it], a = Math.atan2(q.x, q.z);
      const rMed = (S.columna + 0.1 + S.radio - 0.25) / 2; return { a, alto: q.alto, ox: o.x, oy: o.y, oz: o.z, rMed, it } })()`);
    if (R) {
      const k = 0.684, ac = R.a - 1.15;
      for (const [nombre, pf, fase] of [['4-escalera-sin-hacer', 0, null]]) {
        const at = R.a + pf / R.rMed;
        await poner({ x: R.ox + Math.sin(ac) * 2.6, y: R.oy + R.alto - 1.15 * k + 1.75, z: R.oz + Math.cos(ac) * 2.6 }, { x: R.ox + Math.sin(at) * 3.0, y: R.oy + R.alto + 1.0, z: R.oz + Math.cos(at) * 3.0 }, 66, true);
        await esperar(400);
        await fotoQuieta(nombre);
      }
      // en la nueva: la raíz atravesada en ese mismo escalón (se la lleva a su fase y se la congela)
      if (await js(`!!${H}.desafio.naveAdentro.subida.raices`)) {
        await js(`(()=>{ const N = ${H}.desafio.naveAdentro, r = N.subida.raices[0]; r.t = 8.6; return 1 })()`);
        await js(`(()=>{ const H = ${H}, js = H.jugador.estado; for (let i = 0; i < 4; i++) H.desafio.actualizar(0.01, { noche: 0, dtReal: 0.01 }); return 1 })()`);
        const pf = -1.4, at = R.a + pf / R.rMed;
        await poner({ x: R.ox + Math.sin(ac) * 2.6, y: R.oy + R.alto - 1.15 * k + 1.75, z: R.oz + Math.cos(ac) * 2.6 }, { x: R.ox + Math.sin(at) * 3.0, y: R.oy + R.alto + pf / R.rMed * k + 1.0, z: R.oz + Math.cos(at) * 3.0 }, 66, true);
        await esperar(400);
        await fotoQuieta('5-escalera-raiz-atravesada');
      }
    }
  } catch (e) { errores.push('excepción: ' + e.message); console.log('EXCEPCIÓN', e.stack); }
  console.log(errores.length ? `${errores.length} errores` : 'sin errores');
  w.destroy();
  app.exit(errores.length ? 1 : 0);
});

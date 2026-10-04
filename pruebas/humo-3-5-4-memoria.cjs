// Partida real 3.5.4: memoria de sesiones largas. Con perfil propio (no pisa el de las otras pruebas).
//  1. El contexto 3D perdido y devuelto ocho veces seguidas: la memoria de JS no crece (antes, cada
//     vuelta dejaba ~10 MB y miles de objetos de WebGL del contexto viejo colgados de los oyentes
//     'dispose' de three), el juego sigue dibujando igual (captura antes/después, impostores
//     horneados, sin errores de WebGL).
//  2. Torres de vigía levantadas y desarmadas diez veces (Desafío): la banderita de cada torre no
//     deja sus geometrías en la placa.
// Uso: npx electron pruebas/humo-3-5-4-memoria.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const raiz = path.resolve(__dirname, '..');
const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'hojarasca-humo-354-'));
app.setPath('userData', perfil);
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('enable-precise-memory-info');
app.commandLine.appendSwitch('js-flags', '--expose-gc');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  const w = new BrowserWindow({ show: false, width: 1024, height: 640, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if (!(e.level === 'error' || /Uncaught/.test(m)) || /Security|GL_INVALID|PCF|Autofill|AudioContext|favicon|CONTEXT_LOST_WEBGL/.test(m)) return;
    errores.push(m.slice(0, 400));
  });
  w.webContents.on('render-process-gone', (_e, d) => errores.push('se cayó la página: ' + JSON.stringify(d)));
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error('la página no respondió en 60 s')), 60000))]);
  const ok = (cond, texto) => { pasos.push(`${cond ? '✓' : '✗'} ${texto}`); console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (t) => console.log(`\n— ${t}`);
  const url = path.join(raiz, 'index.html');
  const H = 'window.__hojarasca';
  const cargar = async (modo) => {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'baja', clima:'despejado', musica:false, modo:'${modo}', autoCalidad:false, guiaPrimerDia:false})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!(window.__hojarasca && window.__hojarasca.__caidas)').catch(() => false); }
    ok(listo, `carga el ${modo}`);
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    await js(`${H}.volverAlJuego?.(); ${H}.ajustes.limiteFps = 'libre'; 1`);
  };
  const cuadros = (n = 4) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return ${H}.renderer.info.render.frame })()`);
  const heapMB = async () => { for (let i = 0; i < 3; i++) { await js('window.gc && window.gc(); 1'); await esperar(150); } return js('+(performance.memory.usedJSHeapSize / 1048576).toFixed(1)'); };
  const atlasLleno = () => js(`(()=>{ const H = ${H}, imp = H.veg.prepararImpostores(H.renderer); if (!imp?.atlas) return -1;
    const rt = imp.atlas().verano.color, ancho = Math.min(256, rt.width), alto = Math.min(256, rt.height), buf = new Uint8Array(ancho * alto * 4);
    H.renderer.readRenderTargetPixels(rt, 0, 0, ancho, alto, buf);
    let n = 0; for (let i = 3; i < buf.length; i += 4) if (buf[i] > 0) n++; return n })()`);
  const salidas = path.join(raiz, 'pruebas', 'salidas'); fs.mkdirSync(salidas, { recursive: true });
  const captura = async (nombre) => {
    await js(`(()=>{ const H = ${H}; H.volverAlJuego(); H.progreso.horas = 13; for (let i = 0; i < 8; i++) H.__bucle(); return 1 })()`);
    await esperar(2500);
    await js(`(()=>{ const H = ${H}; H.progreso.horas = 13; for (let i = 0; i < 4; i++) H.__bucle(); return 1 })()`);
    await esperar(300);
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salidas, `memoria-${nombre}.png`), img.toPNG());
    return img.resize({ width: 64, height: 40 }).toBitmap();
  };
  const diferencia = (a, b) => { let s = 0, n = 0; for (let i = 0; i < Math.min(a.length, b.length); i += 4) { s += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); n += 3; } return n ? s / n : 255; };
  const brillo = (a) => { let s = 0; for (let i = 0; i < a.length; i += 4) s += a[i] + a[i + 1] + a[i + 2]; return s / (a.length / 4) / 3; };
  const ext = `(${H}.__ctxPrueba || (${H}.__ctxPrueba = ${H}.renderer.getContext().getExtension('WEBGL_lose_context')))`;

  try {
    // ------------------------------------------------------------ 1. el contexto 3D, ocho veces
    await cargar('relax');
    seccion('el contexto 3D perdido y devuelto ocho veces');
    await cuadros(20);
    // 3.6: la Aldea de los Duendes se termina de armar DESPUÉS de la carga (lo del Worker se monta de a
    // uno por cuadro: ~17 MB). Se espera a que esté entera antes de medir: si no, lo que crece es la
    // aldea armándose durante las recuperaciones, no las recuperaciones.
    const aldea = await js(`(async()=>{ const A = ${H}.__aldeaMundo?.(); if (!A) return 'sin aldea';
      for (let i = 0; i < 150 && A.medir().fabrica.pendientes > 0; i++) await new Promise((ok) => setTimeout(ok, 100));
      for (let i = 0; i < 2000 && (A.medir().cola > 0 || A.medir().listas < A.medir().manzanas); i++) ${H}.__bucle();
      const m = A.medir(); return m.listas + ' de ' + m.manzanas + ' manzanas, cola ' + m.cola })()`);
    ok(aldea === 'sin aldea' || /cola 0$/.test(aldea), `la aldea, armada antes de medir (${aldea})`);
    const fotoAntes = await captura('contexto-antes');
    const atlasAntes = await atlasLleno();
    const h0 = await heapMB();
    const soltados = [];
    let vueltos = 0;
    for (let k = 0; k < 8; k++) {
      await js(`(()=>{ ${ext}.loseContext(); return 1 })()`);
      await esperar(400);
      soltados.push(await js(`${H}.__caidas.graficos.soltados ?? -1`));
      await js(`${ext}.restoreContext(); 1`);
      let vuelto = false;
      for (let i = 0; i < 60 && !vuelto; i++) { await esperar(250); vuelto = await js(`!${H}.__caidas.graficos.perdidos`); }
      if (vuelto) vueltos++;
      await cuadros(12);
    }
    ok(vueltos === 8, `el juego vuelve las ocho veces (${vueltos})`);
    ok(soltados.every((n) => n > 100), `al perderse, los administradores viejos de three sueltan lo suyo (${soltados.join(', ')} objetos)`);
    await cuadros(20);
    const h1 = await heapMB();
    ok(h1 - h0 < 8, `la memoria de JS no crece con las recuperaciones (${h0} → ${h1} MB; antes de la 3.5.4 crecía con cada vez)`);
    const f0 = await js(`${H}.renderer.info.render.frame`), f1 = await cuadros(10);
    ok(f1 > f0, `sigue dibujando (${f0} → ${f1})`);
    const atlasDespues = await atlasLleno();
    ok(atlasDespues > atlasAntes * 0.9, `los impostores siguen horneados (${atlasAntes} → ${atlasDespues} píxeles)`);
    const err = await js(`(()=>{ const gl = ${H}.renderer.getContext(); const n = []; let e; while ((e = gl.getError()) && n.length < 10) n.push(e); return n.join(',') })()`);
    ok(err === '', `sin errores de WebGL (${err})`);
    const fotoDespues = await captura('contexto-despues');
    const dif = diferencia(fotoAntes, fotoDespues);
    ok(brillo(fotoDespues) > 20 && dif < 25, `la captura de después se ve como la de antes (diferencia media ${dif.toFixed(1)} de 255; pruebas/salidas/memoria-contexto-*.png)`);

    // ------------------------------------------------------------ 2. torres de vigía con banderita
    await cargar('desafio');
    seccion('torres de vigía levantadas y desarmadas diez veces');
    const torre = (paso) => js(`(()=>{ const H = ${H}, P = H.progreso, O = H.obras, js = H.jugador.estado, B = H.__personal.bandera();
      if (${paso === 'poner'}) {
        Object.assign(P.materiales, { tronco: 400, tabla: 400, piedra: 400, cuerda: 200 });
        if (window.__desde) H.jugador.ubicar(window.__desde.x, window.__desde.z, window.__desde.yaw);   // (siempre en el mismo lugar)
        O.elegir(H.PLANOS.find((p) => p.id === 'torre-vigia'));
        let f = null;
        for (let t = 0; t < 60 && !f?.ok; t++) { const d = 7 + (t % 6) * 5, l = (Math.floor(t / 6) - 5) * 6;
          const x = js.pos.x - Math.sin(js.yaw) * d + Math.cos(js.yaw) * l, z = js.pos.z - Math.cos(js.yaw) * d - Math.sin(js.yaw) * l; f = O.fundar(x, z, js.yaw, H.T.altura(x, z)); }
        O.elegir(null);
        if (!f?.ok) return { error: f?.motivo || 'sin lugar' };
        let a; do { a = O.avanzar(f.obra, P.materiales); } while (a.ok && !a.terminada);
        window.__torre = f.obra;
        window.__desde = window.__desde || { x: js.pos.x, z: js.pos.z, yaw: js.yaw };
      }
      // mirando la torre desde 12 m (la banderita se sube a la placa cuando se dibuja)
      const t = window.__torre?.datos, d0 = window.__desde;
      if (t) { const dx = t.x - d0.x, dz = t.z - d0.z, L = Math.hypot(dx, dz) || 1, px = t.x - dx / L * 12, pz = t.z - dz / L * 12;
        H.jugador.ubicar(px, pz, Math.atan2(-(t.x - px), -(t.z - pz))); }
      if (${paso === 'quitar'}) { O.destruir(window.__torre); window.__torre = null; }
      P.obras = O.obras.map((o) => o.datos);
      B.revisarTorres(O);
      for (let i = 0; i < 6; i++) H.__bucle();
      return { torres: B.cantidadTorres(), geo: H.renderer.info.memory.geometries } })()`);
    const primera = await torre('poner'); await torre('quitar');
    ok(!primera.error && primera.torres === 1, `se levanta una torre con su banderita (${JSON.stringify(primera)})`);
    const g0 = (await torre('poner')).geo; const q0 = (await torre('quitar')).geo;
    let ultima = null;
    for (let k = 0; k < 10; k++) { await torre('poner'); ultima = await torre('quitar'); }
    ok(g0 > q0, `mirándola, la torre y su banderita se dibujan (geometrías con torre ${g0}, sin ${q0})`);
    ok(ultima.torres === 0, `al desarmarla, la banderita se va (${ultima.torres})`);
    ok(ultima.geo <= q0 + 2, `las geometrías en la placa no crecen con cada torre (sin torre ${q0} → después de diez más ${ultima.geo}; antes de la 3.5.4, +2 por torre)`);
  } catch (e) { errores.push(e.message); console.log('EXCEPCIÓN ' + e.stack); }

  fs.writeFileSync(path.join(salidas, 'humo-3-5-4-memoria.json'), JSON.stringify({ pasos, errores }, null, 2));
  console.log(`\n${pasos.filter((p) => p.startsWith('✓')).length} de ${pasos.length} pasos bien`);
  if (errores.length) console.log('ERRORES:\n' + errores.join('\n'));
  try { fs.rmSync(perfil, { recursive: true, force: true }); } catch {}
  app.exit(errores.length ? 1 : 0);
});

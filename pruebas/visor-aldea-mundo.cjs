// 3.6: capturas de la Aldea de los Duendes en el juego real (la aldea puesta en el valle por
// aldea-mundo.js): la aldea entera desde la entrada del tren, la plaza al atardecer, una calle a la
// mañana, de noche con las ventanas y los faroles, un interior y una obra a medio levantar. Mide
// también los dibujos y triángulos de cada toma. Las fotos quedan en pruebas/salidas/aldea-mundo/
// (no van al repositorio). Perfil propio (no toca el de las pruebas).
//
// Uso (después de `node armar.mjs`):
//   npx electron pruebas/visor-aldea-mundo.cjs [toma,toma,...] [calidad=alta]
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(raiz, 'pruebas', 'salidas', 'aldea-mundo');
// nunca un cartel en la pantalla del usuario: el error va a la consola y a un archivo, y se cierra
const anotarError = (tipo, e) => {
  const texto = `[visor-aldea-mundo] ${tipo}: ${e && e.stack ? e.stack : e}\n`;
  try { console.error(texto); fs.mkdirSync(salida, { recursive: true }); fs.appendFileSync(path.join(salida, 'errores.log'), texto); } catch { /* nada */ }
  try { app.exit(1); } catch { process.exit(1); }
};
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => anotarError('excepción', e));
process.on('unhandledRejection', (e) => anotarError('promesa', e));
const perfil = path.join(salida, '_perfil');
try { fs.rmSync(perfil, { recursive: true, force: true }); } catch { /* que quede */ }
app.setPath('userData', perfil);
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// Tomas en el plano de la aldea (x a lo largo de la vía, z alejándose): ojo [x, altura de los
// ojos sobre el suelo, z], mira [x, altura, z]. `obra`: un lote a medio levantar.
const TOMAS = {
  entrada: { ojo: [6, 3.2, 12], a: [16, 4, 60], hora: 10.5 },
  aerea: { ojo: [22, 75, -30], a: [22, 0, 48], hora: 12 },
  almacen: { ojo: [-10, 1.7, 49], a: [-17, 2.5, 60], hora: 15 },
  'casa-te': { ojo: [33, 1.7, 26], a: [27.5, 2.5, 36], hora: 11 },
  'plaza-atardecer': { ojo: [-4, 1.7, 30], a: [12, 2.5, 46], hora: 18.9 },
  'calle-manana': { ojo: [-40, 1.7, 52], a: [30, 2, 52], hora: 8.6 },
  noche: { ojo: [-30, 1.7, 23], a: [20, 2, 34], hora: 22.2 },
  interior: { ojo: 'biblioteca', hora: 11 },
  obra: { ojo: [62, 2.2, 22.5], a: [73, 2, 34], hora: 13, obra: { lote: 'carpinteria', clave: 'carpintero', etapa: 2 } },
  // la aldea completa: los once locales abiertos
  completa: { ojo: [4, 4.2, 6], a: [30, 4, 60], hora: 10.5, completa: true },
  'completa-noche': { ojo: [-30, 1.7, 23], a: [20, 2, 34], hora: 22.2, completa: true },
  // 3.6 (detalles): las que no salen sin pedirlas (`extra`). `estacion` fuerza la estación y
  // `mojado` deja el suelo como después de la lluvia.
  mediodia: { ojo: [-4, 1.7, 30], a: [12, 2.5, 46], hora: 12.5, extra: true },
  ripio: { ojo: [-2, 1.7, 23.5], a: [14, 0, 27.5], hora: 10.5, extra: true },
  'ripio-mojado': { ojo: [-2, 1.7, 23.5], a: [14, 0, 27.5], hora: 10.5, mojado: 1, extra: true },
  desnivel: { ojo: [78.5, 1.7, 22.5], a: [79.5, 0.4, 34], hora: 11, completa: true, extra: true },
  'desnivel-atras': { ojo: [66, 2.4, 41.5], a: [82, 0.6, 33], hora: 11, completa: true, extra: true },
  lotes: { ojo: [58, 26, 12], a: [64, 0, 42], hora: 11, extra: true },
  'lote-cerca': { ojo: [40, 1.7, 22], a: [46, 0.6, 33], hora: 11, extra: true },
  'borde-oeste': { ojo: [-36, 1.7, 52], a: [-70, 4, 60], hora: 16, extra: true },
  'borde-fondo': { ojo: [6, 1.7, 76], a: [14, 4, 100], hora: 16, extra: true },
  'borde-este': { ojo: [84, 1.7, 52], a: [112, 3, 56], hora: 16, extra: true },
  farol: { ojo: [-14, 1.7, 21], a: [-30, 4.2, 28], hora: 22.2, extra: true },
  'farol-dia': { ojo: [-14, 1.7, 21], a: [-30, 4.2, 28], hora: 12, extra: true },
  nieve: { ojo: [4, 4.2, 6], a: [30, 4, 60], hora: 11, completa: true, estacion: 'invierno', extra: true },
  'nieve-aerea': { ojo: [22, 45, 0], a: [22, 0, 48], hora: 12, completa: true, estacion: 'invierno', extra: true },
  'nieve-noche': { ojo: [-30, 1.7, 23], a: [20, 2, 34], hora: 21, completa: true, estacion: 'invierno', extra: true },
  atardecer: { ojo: [30, 1.7, 22], a: [50, 2.5, 30], hora: 19.2, completa: true, extra: true },
  'interior-nieve': { ojo: 'biblioteca', hora: 11, estacion: 'invierno', extra: true },
  'galeria-nieve': { ojo: [-31, 1.7, 28.2], a: [-35.5, 0.6, 32.5], hora: 11, estacion: 'invierno', extra: true },
  humo: { ojo: [-24, 1.7, 34], a: [-33, 6, 40], hora: 21.5, extra: true },
  // 3.6.2 (visual): con lluvia (`lluvia`: cuánto llueve), para ver que no llueva bajo las galerías y
  // los aleros. `lugar`: el ojo y la mira en el marco de ese lugar del valle (T.lugares, con su giro);
  // `edificio`: en el marco de ese edificio de la aldea
  'lluvia-galeria': { edificio: 'casa-jefe', ojo: [3.5, 1.7, 8.5], a: [-0.5, 1.3, 3], hora: 11, lluvia: 1, extra: true },
  'lluvia-biblioteca': { edificio: 'biblioteca', ojo: [5, 1.7, 11], a: [0, 1.6, 4], hora: 11, lluvia: 1, extra: true },
  'lluvia-almacen': { ojo: [-10, 1.7, 49], a: [-17, 2.5, 60], hora: 11, lluvia: 1, extra: true },
  'lluvia-calle': { ojo: [-40, 1.7, 52], a: [30, 2, 52], hora: 11, lluvia: 1, completa: true, extra: true },
  'lluvia-refugio': { lugar: 'refugio', ojo: [-5, 1.7, 9], a: [0, 1.2, 2.6], hora: 11, lluvia: 1, extra: true },
  'lluvia-estacion': { lugar: 'estacion', ojo: [9, 1.7, -4], a: [0, 1.5, 3], hora: 11, lluvia: 1, extra: true },
  // 3.6.2 (visual): la pescadería abierta (la red que se mece) y el rótulo del almacén de cerca
  pescaderia: { edificio: 'pescaderia', ojo: [7.5, 1.6, 4.5], a: [4.1, 1.3, 0.7], hora: 11, completa: true, extra: true },
  'almacen-rotulo': { ojo: [-11, 1.7, 51], a: [-17, 3.6, 60], hora: 11, extra: true },
};

app.whenReady().then(async () => {
  fs.mkdirSync(salida, { recursive: true });
  const arg = process.argv.find((a) => /^[a-z-]+(,[a-z-]+)*$/.test(a) && a.split(',').every((t) => TOMAS[t]));
  const pedidas = (arg || Object.keys(TOMAS).filter((t) => !TOMAS[t].completa && !TOMAS[t].extra).join(',')).split(',');
  const calidad = (process.argv.find((a) => /^calidad=/.test(a)) || 'calidad=alta').split('=')[1];
  const w = new BrowserWindow({ show: true, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const js = (c) => w.webContents.executeJavaScript(c);
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|Autofill|favicon/.test(m)) errores.push(m.slice(0, 300)); });
  const url = path.join(raiz, 'index.html');
  await w.loadFile(url, { search: '?debug=1' });
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${calidad}', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'})); 1`);
  await w.loadFile(url, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3000);
  // sin carteles del juego encima de la foto
  await js(`(() => { const s = document.createElement('style'); s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; document.head.appendChild(s); return 1; })()`);
  // que la aldea esté entera
  await js(`window.__hojarasca.__aldeaMundo().listo().then(() => 1)`);
  await js(`(() => { window.__hojarasca.__aldeaMundo().montarCola(); return 1 })()`);
  const informe = [];
  let completa = false;
  for (const nombre of pedidas) {
    const t = TOMAS[nombre];
    if (t.completa && !completa) {
      // los once pobladores con su local abierto
      await js(`(() => { const H = window.__hojarasca, a = H.progreso.aldea; const L = { carpintero: 'carpinteria', panadera: 'panaderia', herrero: 'herreria', pescador: 'pescaderia', maestra: 'escuela', enfermera: 'puesto-sanitario', telegrafista: 'estafeta', tejedora: 'hilanderia', apicultor: 'sala-miel', guardaparque: 'seccional', musico: 'salon' };
        a.pobladores = Object.keys(L).map((clave) => ({ clave, dia: 1 })); a.obras = {}; a.locales = Object.fromEntries(Object.values(L).map((l) => [l, 1])); return 1 })()`);
      completa = true;
    }
    if (t.obra) {
      await js(`(() => { const H = window.__hojarasca, a = H.progreso.aldea, o = ${JSON.stringify(t.obra)};
        if (!a.pobladores.some((p) => p.clave === o.clave)) a.pobladores.push({ clave: o.clave, dia: 1 });
        a.obras[o.lote] = { etapa: o.etapa, aportado: {}, lista: null, desde: 1 }; delete a.locales[o.lote]; return 1 })()`);
    }
    // que la aldea se rearme con lo que cambió (los edificios llegan del Worker)
    await js(`(async () => { const M = window.__hojarasca.__aldeaMundo(); M.actualizar(4, window.__hojarasca.camara.position); await M.listo(); M.montarCola(); return 1 })()`);
    await esperar(400);
    await js(`(async () => { const M = window.__hojarasca.__aldeaMundo(); await M.listo(); M.montarCola(); return 1 })()`);
    const poner = `(() => { const H = window.__hojarasca, M = H.__aldeaMundo(), T = H.T, js = H.jugador.estado, t = ${JSON.stringify(t)};
      H.progreso.horas = t.hora; H.clima.estado.nublado = 0.1;
      H.ajustes.estacion = t.estacion || 'verano';
      if (t.estacion === 'invierno') H.__U().uInvierno.value = 1;
      if (t.mojado != null) H.__U().uMojado.value = t.mojado;
      if (t.lluvia) { H.ajustes.clima = 'lluvioso'; Object.assign(H.clima.estado, { lluvia: t.lluvia, nublado: 0.9, objetivo: 'lluvia', proximo: 'lluvia', t: 9999 }); }
      let o, a;
      const marco = t.lugar ? H.T.lugares[t.lugar] : t.edificio ? M.estadoEdificio(t.edificio)?.sitio : null;
      if (marco) {
        const r = marco.rot ?? marco.ang ?? 0, c = Math.cos(r), s = Math.sin(r);
        const aM = (lx, lz) => ({ x: marco.x + lx * c + lz * s, z: marco.z - lx * s + lz * c });
        const wo = aM(t.ojo[0], t.ojo[2]), wa = aM(t.a[0], t.a[2]);
        o = { x: wo.x, z: wo.z, y: T.altura(wo.x, wo.z) + t.ojo[1] };
        a = { x: wa.x, z: wa.z, y: T.altura(wa.x, wa.z) + t.a[1] };
      } else if (t.ojo === 'biblioteca') {
        const p = H.__aldea.puntos('biblioteca'); const e = H.__aldea.edificio('biblioteca');
        const pu = p.puerta, ad = p.cuentos || p.adentro;
        // adentro, junto a la puerta, mirando al fondo
        o = { x: pu.x + (e.x - pu.x) * 0.38, z: pu.z + (e.z - pu.z) * 0.38, y: e.y + 0.32 + 1.62 };
        a = { x: ad.x, z: ad.z, y: e.y + 1.2 };
      } else {
        const wo = M.aMundo(t.ojo[0], t.ojo[2]), wa = M.aMundo(t.a[0], t.a[2]);
        o = { x: wo.x, z: wo.z, y: T.altura(wo.x, wo.z) + t.ojo[1] };
        a = { x: wa.x, z: wa.z, y: T.altura(wa.x, wa.z) + t.a[1] };
      }
      const yaw = Math.atan2(-(a.x - o.x), -(a.z - o.z)), pitch = Math.atan2(a.y - o.y, Math.hypot(a.x - o.x, a.z - o.z));
      js.pos.set(o.x, o.y - 1.65, o.z); js.vel.set(0, 0, 0); js.vy = 0; js.yaw = yaw; js.pitch = pitch;
      const c = H.camara; c.position.set(o.x, o.y, o.z); c.rotation.order = 'YXZ'; c.rotation.set(pitch, yaw, 0);
      if (c.fov !== 70) { c.fov = 70; c.updateProjectionMatrix(); }
      for (const k of c.children) k.visible = false;
      return 1 })()`;
    await js(poner);
    await esperar(3500);
    await js(poner);
    await esperar(2500);
    await js(poner);
    // (pruebas a mano: VISOR_JS se corre antes de cada foto, con H = window.__hojarasca)
    if (process.env.VISOR_JS) await js(`(() => { const H = window.__hojarasca; ${process.env.VISOR_JS}; return 1 })()`);
    await esperar(400);
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
    const info = await js(`(() => { const H = window.__hojarasca, R = H.renderer; R.info.autoReset = false; R.info.reset(); R.render(H.escena, H.camara); const d = { dibujos: R.info.render.calls, tri: R.info.render.triangles }; R.info.autoReset = true;
      const P = H.escena.userData.presupuestoLuces; return JSON.stringify({ ...d, luces: P ? P.stats.vivas : null, aldea: H.__aldeaMundo().medir() }) })()`);
    informe.push(`${nombre}: ${info}`);
    console.log('foto', nombre, info.slice(0, 220));
  }
  await js(`(() => { for (const k of window.__hojarasca.camara.children) k.visible = true; return 1; })()`);
  fs.writeFileSync(path.join(salida, 'informe.txt'), informe.join('\n') + (errores.length ? `\nerrores:\n${errores.join('\n')}` : ''));
  if (errores.length) console.log('errores de la página:\n' + errores.join('\n'));
  console.log('listo:', salida);
  app.exit(0);
});

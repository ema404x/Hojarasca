// 4.12.1 (edificios y luz): capturas de los MISMOS encuadres (aldea de día y de noche, carpintería, herrería, casas del jugador, interior, techos con sombra)
// para comparar el antes y el después. La ventana va VISIBLE (el lienzo no se captura bien oculto) y siempre por el lanzador (monitor externo, perfil propio).
// Parámetros por variables de entorno: HOJ_PAGINA='<index.html>' HOJ_CALIDAD='media|alta' HOJ_SALIDA='<carpeta>' [HOJ_SOLO='id1,id2']
//   herramientas\lanzar-electron.ps1 -Script herramientas\fotos-edificios-4-12-1.cjs -Visible -Espera 600 -Perfil <carpeta propia>
// Antes de las tomas abre toda la aldea (como COMPLETA=1 de medir-vistas.cjs) y planta, en un claro cerca del refugio, unas casas y muebles del jugador ya
// terminados (`obras.sincronizar`), así el antes y el después ven lo mismo. Las tomas están en fotos-edificios-4-12-1.json (`donde` devuelve { x, z, yaw, horas }).
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`${n}=`)); return a ? a.slice(n.length + 1) : (process.env['HOJ_' + n.toUpperCase()] || d); };
const pagina = path.resolve(arg('pagina', 'index.html'));
const calidad = arg('calidad', 'alta');
const salida = path.resolve(arg('salida', path.join(process.env.TEMP || '.', 'fotos-edificios')));
const solo = arg('solo', '') ? arg('solo', '').split(',') : null;
fs.mkdirSync(salida, { recursive: true });
dialog.showErrorBox = (t, c) => { try { fs.writeFileSync(path.join(salida, 'error.txt'), t + String.fromCharCode(10) + c); } catch { /* sin carpeta */ } };
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
setTimeout(() => { console.log('ERROR: tardó más de 12 minutos'); salir(2); }, 12 * 60 * 1000).unref?.();

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: true, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.focus();
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300)); });
  const js = (c) => w.webContents.executeJavaScript(c);
  const H = 'window.__hojarasca';
  const ajustes = `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${calidad}', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', modoFluido:false, estacion:'verano'})); 1`;
  await w.loadFile(pagina, { search: '?debug=1' });
  await js(ajustes);
  await w.loadFile(pagina, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.est && ${H}.T)`).catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3500);
  await js(`${H}.ajustes.limiteFps = 'libre'; ${H}.volverAlJuego?.(true); 1`);
  await js(`(() => { let s = document.createElement('style'); s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; document.head.appendChild(s);
    for (const o of ${H}.escena.children) if (o.isPoints) Object.defineProperty(o, 'visible', { get: () => false, set: () => {} }); return 1 })()`);
  // la aldea completa: todos los pobladores con su local abierto
  const abiertos = await js(`(()=>{ const H = window.__hojarasca, A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return null; const a = H.progreso.aldea;
    const L = { carpintero: 'carpinteria', veterinaria: 'veterinaria', panadera: 'panaderia', herbolaria: 'herboristeria', herrero: 'herreria', modista: 'costureria', pescador: 'pescaderia', botera: 'varadero', maestra: 'escuela', pintora: 'taller-arte', enfermera: 'puesto-sanitario', andinista: 'refugio-andinista', telegrafista: 'estafeta', fotografa: 'estudio-fotos', tejedora: 'hilanderia', ceramista: 'ceramica', apicultor: 'sala-miel', astronoma: 'observatorio', guardaparque: 'seccional', musico: 'salon' };
    const ks = Object.keys(L).filter((k) => A.estadoEdificio(L[k]));
    a.pobladores = ks.map((clave) => ({ clave, dia: 1 })); a.obras = {}; a.locales = Object.fromEntries(ks.map((k) => [L[k], 1])); a.descubierta = 1; a.llegando = null;
    A.actualizar(4, H.camara.position); return ks.length })()`);
  console.log('locales abiertos: ' + abiertos);
  await js(`(async () => { const H = ${H}, A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return 0;
    for (let i = 0; i < 100 && A.medir().fabrica.pendientes > 0; i++) await new Promise((ok) => setTimeout(ok, 100));
    for (let n = 0; n < 3000 && (A.medir().cola > 0 || A.medir().listas < A.medir().manzanas); n++) { H.__bucle(); if (n % 50 === 49) await new Promise((ok) => setTimeout(ok, 0)); }
    return 1 })()`);
  // las obras del jugador: un claro llano y sin árboles cerca del refugio, y ahí las casas y los muebles ya terminados
  const demo = await js(`(() => { const H = ${H}, T = H.T, r0 = T.lugares.refugio, arboles = H.veg.arboles.filter((q) => !q.sacado && !q.caido);
    const pend = (x, z) => { const n = T.normal(x, z); return 1 - n.y; };
    let sitio = null;
    for (let r = 30; r < 420 && !sitio; r += 4) for (let a = 0; a < 6.28 && !sitio; a += 0.1) {
      const x = r0.x + Math.cos(a) * r, z = r0.z + Math.sin(a) * r;
      if (Math.abs(x) > 430 || Math.abs(z) > 430) continue;
      let bien = !arboles.some((q) => Math.hypot(q.x - x, q.z - z) < 24);
      for (let k = 0; k < 8 && bien; k++) for (const d of [8, 16]) { const px = x + Math.cos(k * 0.785) * d, pz = z + Math.sin(k * 0.785) * d; if (pend(px, pz) > 0.045 || T.agua(px, pz)) bien = false; }
      if (bien && pend(x, z) < 0.03 && !T.agua(x, z)) sitio = { x, z };
    }
    if (!sitio) return null;
    const O = H.obras, y = (x, z) => T.altura(x, z);
    const lista = [['puesto', 0, 0, 0], ['casilla', 11, -1, 0.3], ['galponcito', -11, 1, -0.2], ['cabana-piedra', 0, 12, 0], ['casa-galeria', 14, 12, 0.2], ['fogon', 5, 6, 0], ['banco', -4, 5, 0.3], ['lenera', -6, -3, 0],
      ['cobertizo', -14, 12, 0.1], ['gallinero', 7, -10, 0.2], ['telar', -8, 8, 0]].filter(([id]) => O.obras.every((q) => q.plano.id !== id));
    O.sincronizar(lista.map(([plano, dx, dz, rot]) => ({ plano, x: sitio.x + dx, z: sitio.z + dz, y: y(sitio.x + dx, sitio.z + dz), rot, etapas: 99 })));
    window.__demo = sitio; return { x: +sitio.x.toFixed(1), z: +sitio.z.toFixed(1), obras: O.obras.length } })()`);
  console.log('claro de las casas del jugador: ' + JSON.stringify(demo));
  for (let n = 0; n < 60; n++) await js(`${H}.__bucle(); 1`);
  const tomas = JSON.parse(fs.readFileSync(path.resolve(arg('tomas', path.join(__dirname, 'fotos-edificios-4-12-1.json'))), 'utf8'));
  const cuadro = (n = 1) => js(`(() => { if (!document.getElementById('pausa').classList.contains('oculto')) ${H}.volverAlJuego(true); for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  for (const t of tomas) {
    if (solo && !solo.includes(t.id)) continue;
    const lugar = await js(`(() => { const H = ${H}, T = H.T; const p = ${t.donde}; if (!p) return null;
      const y = p.y ?? T.altura(p.x, p.z) + 1.65;
      H.jugador.ubicar(p.x, p.z, 0);
      H.__camaraFija = { x: p.x, y, z: p.z, yaw: p.yaw, pitch: ${t.pitch ?? -0.03} };
      H.camara.fov = ${t.fov || 60}; H.camara.updateProjectionMatrix(); H.progreso.horas = p.horas; window.__hora = p.horas;
      H.camara.children.forEach((q) => { q.visible = false; }); return { x: +p.x.toFixed(1), z: +p.z.toFixed(1), horas: p.horas } })()`);
    if (!lugar) { console.log('  ' + t.id + ': este lugar no está en esta versión'); continue; }
    for (let i = 0; i < 150; i++) { await js(`${H}.progreso.horas = window.__hora; 1`); await cuadro(1); await esperar(20); }
    await esperar(300);
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salida, `${t.id}.png`), img.toPNG());
    console.log('  ' + t.id + ' · ' + calidad + ' · ' + JSON.stringify(lugar));
  }
  console.log(errores.length ? 'ERRORES: ' + errores.join(' | ') : 'sin errores en la consola');
  await esperar(800);
  salir(0);
}).catch((e) => { console.log('ERROR: ' + (e && e.stack ? e.stack : e)); salir(1); });

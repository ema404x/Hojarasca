// Partida real 4.31.0 (A): lo que se toca en el refugio y en tus casas (ver src/casa-detalles*.js). Para cada cosa: se apunta de frente, se lee el
// aviso, se aprieta la E de verdad (el evento del teclado) y se saca una captura antes y después. Además: la ventana encendida desde afuera de noche
// (lámpara prendida, todo apagado y con las cortinas corridas), el humo de la chimenea con el hogar apagado, los programas de shader antes y después,
// y tus muebles armados (la canilla de la mesada, el sillón, el baúl, el librero).
// Uso (después de `node armar.mjs`): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-4-30-0-a.ps1 -Script pruebas\humo-4-31-0-a.cjs -Perfil perfil-4310-a
//   HUMO_PARTES=dia,noche,muebles · HUMO_SALIDA=<carpeta> · HUMO_CALIDAD=media|baja|alta
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(process.env.TEMP || raiz, 'hx', 'a4310'));
const ANCHO = 1366, ALTO = 724;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 12 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 12 * 60 * 1000).unref?.();
const PARTES = (process.env.HUMO_PARTES || 'dia,noche,muebles').split(',');
const parte = (p) => PARTES.includes(p);
const CALIDAD = process.env.HUMO_CALIDAD || 'media';

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, P = H.progreso;
  const N = window.__N = {};
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  H.ajustes.limiteFps = 'libre';
  N.programas = () => H.renderer.info.programs.length;
  N.tick = async (seg = 0.5) => { const t0 = performance.now(); while (performance.now() - t0 < seg * 1000) { H.__bucle(); await dormir(14); } return 1; };
  N.tarjeta = () => { const v = document.getElementById('valle-tarjeta'); return !!v && !v.classList.contains('oculto'); };
  { const st = document.createElement('style'); st.textContent = '#pista-clic { display: none !important; }'; document.head.appendChild(st); }
  const R = () => H.T.lugares.refugio;
  N.local = (lx, ly, lz) => { const r = R(), c = Math.cos(r.rot), s = Math.sin(r.rot); return { x: r.x + lx * c + lz * s, y: r.y + ly, z: r.z - lx * s + lz * c }; };
  // pararse en (lx, lz) del refugio y mirar al punto a del mundo
  N.mirarA = (lx, lz, a) => { const de = N.local(lx, 0, lz); H.jugador.estado.sentado = false; H.jugador.ubicar(de.x, de.z, Math.atan2(-(a.x - de.x), -(a.z - de.z))); return 1; };
  N.ajustarPitch = (a) => { const c = H.camara.position, d = Math.hypot(a.x - c.x, a.z - c.z); H.jugador.estado.yaw = Math.atan2(-(a.x - c.x), -(a.z - c.z)); H.jugador.estado.pitch = Math.atan2(a.y - c.y, d); return 1; };
  N.casa = () => JSON.stringify(P.casa);
  N.aviso = () => H.__aviso();
  N.e = () => { document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e', bubbles: true, cancelable: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE', key: 'e', bubbles: true })); return 1; };
  N.esc = () => { document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true, cancelable: true })); return 1; };
  N.cerrarCharla = async () => { for (let i = 0; i < 8; i++) { const c = document.getElementById('charla'); if (!c || c.classList.contains('oculto')) return 1; N.e(); await N.tick(0.25); } return 0; };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [];
  const { ipcMain } = require('electron');
  require(path.join(raiz, 'copias-main.cjs')).registrarCopias({ ipcMain, app });
  require(path.join(raiz, 'fotos-main.cjs')).registrarFotos({ ipcMain, app });
  const w = new BrowserWindow({ show: true, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false, preload: path.join(raiz, 'preload.cjs') } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 200));
  });
  let donde = 'carga';
  const js = (c, espera = 120000) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió (${donde})`)), espera))]);
  const N = (c) => js(`(async () => { const H = window.__hojarasca, N = window.__N, P = H.progreso; return (${c}); })()`);
  const url = path.join(raiz, 'index.html');
  const foto = async (nombre) => {
    await esperar(500);
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salida, nombre + '.jpg'), img.toJPEG(82));
  };
  const ajustes = (o) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({calidad:'media', clima:'despejado', musica:false, modo:'relax', relaxTipo:'libre', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'}, ${JSON.stringify(o)}))); 1`;
  const esperarJuego = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false)) return true; } return false; };
  const seccion = async (nombre, fn) => {
    if (!parte(nombre)) return;
    donde = nombre;
    try { await fn(); } catch (err) { console.log('ERROR en', nombre + ':', err && err.stack || err); errores.push(`${nombre}: ${err && err.message || err}`); }
    const fallas = await js('(() => { const C = window.__hojarasca && window.__hojarasca.__caidas; return C && C.fallas ? JSON.stringify(C.fallas()).slice(0, 600) : "" })()').catch(() => '');
    if (fallas && fallas !== '[]') { console.log('  FALLAS DEL JUEGO: ' + fallas); errores.push(nombre + ': fallas ' + fallas.slice(0, 200)); }
  };
  // apuntar de frente a una cosa del refugio desde (lx, lz), leer el aviso, foto, E, foto
  const usar = async (id, lx, lz, nombre, { i = 0, antes = true, espera = 1.2, cerrar = true, sinE = false } = {}) => {
    await N(`(() => { const p = H.__casaDetalles().puntos(${JSON.stringify(id)})[${i}]; N.mirarA(${lx}, ${lz}, p); return 1 })()`);
    await N('N.tick(0.3)');
    await N(`(() => { const p = H.__casaDetalles().puntos(${JSON.stringify(id)})[${i}]; return N.ajustarPitch(p) })()`);
    await N('N.tick(0.5)');
    const aviso = await N('N.aviso()');
    if (antes) await foto(nombre + '-antes');
    if (sinE) { console.log(`  ${id}: aviso «${aviso}»`); return aviso; }
    await N('N.e()'); await N(`N.tick(${espera})`);
    const despues = await N('N.aviso()');
    await foto(nombre + '-despues');
    console.log(`  ${id}: aviso «${aviso}» → después «${despues}» · casa ${await N('N.casa()')}`);
    if (cerrar) await N('N.cerrarCharla()');
    return aviso;
  };
  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); ${ajustes({ calidad: CALIDAD })}`);
    await w.loadFile(url, { search: '?debug=1' });
    await js('window.__sinPausaPorBlur = true; 1');
    if (!(await esperarJuego())) throw new Error('el juego no cargó');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000);
    await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
    await N('N.tick(2)');
    for (let k = 0; k < 6 && (await N('N.tarjeta()')); k++) { await N('(() => { const b = document.querySelector("#valle-tarjeta button[data-valle-opcion]"); if (b) b.click(); return 1 })()'); await N('N.tick(0.6)'); }
    await N('(() => { H.clima.estado.lluvia = 0; H.clima.estado.nublado = 0; P.dia = 3; P.horas = 11; return 1 })()');
    const hay = await N('!!H.__casaDetalles()');
    console.log('  casaDetalles:', hay, '· casa guardada al empezar:', await N('N.casa()'));
    await N('N.mirarA(0, 1.6, N.local(0, 1, -2))'); await N('N.tick(2)');
    console.log('  programas al empezar:', await N('N.programas()'), '· llamadas adentro:', await N('H.renderer.info.render.calls'));

    await seccion('ventana', async () => {
      await N('(() => { P.casa.ventanas = [1, 0]; return 1 })()'); await N('N.tick(1.5)');
      console.log('  ventana abierta: ' + await N('(() => { const M = H.__casaDetalles().mundo, h = M.partes.hojas[0], r = H.T.lugares.refugio, v = r.vidrios; const w = new H.THREE.Vector3(); h.getWorldPosition(w); let p = h, vis = []; while (p) { vis.push(p.name + ":" + p.visible + ":" + p.matrixAutoUpdate); p = p.parent; } return JSON.stringify({ visible: h.visible, rot: h.rotation.y, mundo: [w.x, w.y, w.z], vidrios: v && v.map((m) => m.visible), cadena: vis, hijos: h.children.length, grupoVisible: M.grupo.visible }) })()'));
      await N('N.mirarA(2.6, 6.5, N.local(2.2, 1.4, 2.75))'); await N('N.ajustarPitch(N.local(2.2, 1.4, 2.75))'); await N('N.tick(1)'); await foto('90-ventana-debug');
      console.log('  en el hueco: ' + await N('(() => { const T3 = H.THREE, ray = new T3.Raycaster(); const o = N.local(2.2, 1.45, 3.6), d = N.local(2.2, 1.45, 1.0); const O = new T3.Vector3(o.x, o.y, o.z), D = new T3.Vector3(d.x - o.x, d.y - o.y, d.z - o.z).normalize(); ray.set(O, D); ray.far = 3; const hits = ray.intersectObjects(H.escena.children, true).filter((h) => h.object.visible); return JSON.stringify(hits.slice(0, 6).map((h) => { const p = []; let q = h.object; while (q) { p.push(q.name || q.type); q = q.parent; } return { d: +h.distance.toFixed(2), mat: h.object.material && (h.object.material.name || h.object.material.type), color: h.object.material && h.object.material.color && h.object.material.color.getHexString(), cadena: p.slice(0, 4).join("<") }; })) })()'));
      await N('(() => { P.casa.ventanas = [0, 0]; return 1 })()');
    });
    await seccion('dia', async () => {
      await N('N.mirarA(-0.2, 2.1, N.local(0.3, 0.9, -1.5))'); await N('N.ajustarPitch(N.local(0.3, 0.9, -1.5))'); await N('N.tick(1)'); await foto('00-adentro');
      await usar('hogar', -1.4, -0.2, '01-hogar');
      await usar('hogar', -1.4, -0.2, '01b-hogar-otra-vez', { antes: false });
      await usar('velas', -1.6, -0.6, '02-velas');
      await usar('pava', -1.3, -0.9, '03-pava');
      await N('(() => { const p = H.__casaDetalles().pava; p.t = 21.8; return 1 })()'); await N('N.tick(1.2)');
      console.log('  pava a los 22 s: aviso «' + await N('N.aviso()') + '»'); await foto('03b-pava-silba');
      await usar('pava', -1.3, -0.9, '03c-mate', { antes: false });
      await usar('lampara', 0.4, -0.2, '04-lampara');
      await usar('cajon', 1.1, 0.75, '05-cajon');
      await usar('alacena', 0.5, -1.0, '06-alacena');
      await usar('radio', 0.2, -1.2, '07-radio');
      await usar('cartas', 0.9, -1.25, '08-cartas');
      await usar('baul', 2.1, -0.4, '09-baul');
      await usar('libro', 1.6, -0.9, '10-libro');
      await usar('reloj', 1.0, 1.4, '11-reloj');
      await usar('cortina-0', 2.0, 1.2, '12-cortina', { i: 1 });
      await usar('cortina-0', 2.0, 1.2, '12b-cortina-abre', { antes: false });
      await usar('ventana-0', 2.1, 1.3, '13-ventana');
      await usar('ventana-1', -2.3, 0.2, '14-ventana-costado');
      await usar('cortina-1', -2.4, 0.1, '15-cortina-costado', { i: 1 });
      await usar('silla', 1.1, 0.9, '16-silla');
      await N('(() => { H.jugador.sentarse(false); return 1 })()'); await N('N.tick(0.4)');
      await usar('sillon', -0.6, -0.3, '17-sillon');
      await N('(() => { H.jugador.sentarse(false); return 1 })()'); await N('N.tick(0.4)');
      // afuera: la ventana abierta, la bomba y el farol
      await N('N.mirarA(2.6, 6.5, N.local(2.2, 1.4, 2.75))'); await N('N.ajustarPitch(N.local(2.2, 1.4, 2.75))'); await N('N.tick(1)'); await foto('18-ventana-abierta-afuera');
      await usar('bomba', 5.6, 2.4, '19-bomba', { espera: 0.8 });
      // se cierra lo de las ventanas para la noche
      await N('(() => { P.casa.ventanas = [0, 0]; P.casa.cortinas = [0, 0]; return 1 })()');
    });

    await seccion('noche', async () => {
      await N('(() => { P.horas = 22; return 1 })()'); await N('N.tick(2)');
      const vista = 'N.mirarA(1.5, 11, N.local(0.6, 1.6, 2.75))';
      await N(vista); await N('N.ajustarPitch(N.local(0.6, 1.6, 2.75))'); await N('N.tick(1.5)'); await foto('20-noche-todo-prendido');
      await usar('farol', -0.6, 4.2, '21-farol');
      await N('(() => { P.casa.lampara = false; P.casa.hogar = false; P.casa.velas = false; return 1 })()');
      await N(vista); await N('N.ajustarPitch(N.local(0.6, 1.6, 2.75))'); await N('N.tick(1.5)'); await foto('22-noche-todo-apagado');
      await N('(() => { P.casa.lampara = true; P.casa.cortinas = [1, 1]; return 1 })()');
      await N(vista); await N('N.ajustarPitch(N.local(0.6, 1.6, 2.75))'); await N('N.tick(1.5)'); await foto('23-noche-lampara-cortinas-corridas');
      console.log('  ventana de noche (brillo): ' + await N('JSON.stringify(H.__casaDetalles().brillos(1))'));
      // adentro de noche, sólo la lámpara y después también las velas y el hogar
      await N('(() => { P.casa.cortinas = [0, 0]; return 1 })()');
      await N('N.mirarA(2.4, 1.8, N.local(-1.2, 1.0, -1.6))'); await N('N.ajustarPitch(N.local(-1.2, 1.0, -1.6))'); await N('N.tick(1.2)'); await foto('24-noche-adentro-lampara');
      await N('(() => { P.casa.velas = true; P.casa.hogar = true; return 1 })()'); await N('N.tick(1.2)'); await foto('25-noche-adentro-lampara-velas-hogar');
      // el humo: con el hogar apagado la chimenea del refugio sale de la lista
      await N('(() => { P.casa.hogar = false; H.__actualizarCasaViva(3); return 1 })()');
      const sinHumo = await N('(() => { const r = H.T.lugares.refugio; return !H.__casaViva().chimeneas.includes(r.chimenea) })()');
      await N('(() => { P.casa.hogar = true; H.__actualizarCasaViva(3); return 1 })()');
      const conHumo = await N('(() => { const r = H.T.lugares.refugio; return H.__casaViva().chimeneas.includes(r.chimenea) })()');
      console.log(`  humo de la chimenea: apagado sin humo ${sinHumo} · prendido con humo ${conHumo}`);
      // las campanadas: de 22,99 a 23,01 suena (11 golpes)
      const n = await N('(() => { P.horas = 22.99; H.__bucle(); P.horas = 23.01; H.__bucle(); return 1 })()');
      console.log('  campanadas probadas (ver la prueba de Node para la cuenta)', n);
      await N('(() => { P.horas = 11; return 1 })()');
    });

    await seccion('muebles', async () => {
      const r = await N(`(() => { const r = H.T.lugares.refugio, PL = Array.isArray(H.PLANOS) ? H.PLANOS : Object.values(H.PLANOS);
        const et = (id) => (PL.find((p) => p.id === id)?.etapas?.length || 1);
        const base = N.local(0, 0, 9);
        const nuevas = [['mesada', 0, 0], ['sillon', 2.6, 0], ['baul', -2.4, 0], ['librero', 4.6, 0], ['barril-agua', -1.6, 0.4]].map(([plano, dx, dz]) => { const x = base.x + dx, z = base.z + dz; return { plano, x, z, y: H.T.altura(x, z), rot: 0, etapas: et(plano) }; });
        P.obras.push(...nuevas); H.obras.sincronizar(nuevas); return nuevas.map((o) => o.plano + ':' + o.etapas).join(' ') })()`);
      console.log('  muebles puestos:', r);
      await N('N.tick(1)');
      const usarObra = async (plano, nombre, dy, dz = -1.6, sentar = false) => {
        await N(`(() => { const o = H.obras.obras.find((x) => x.plano.id === ${JSON.stringify(plano)}); const p = { x: o.datos.x, y: o.datos.y + ${dy}, z: o.datos.z }; H.jugador.estado.sentado = false; H.jugador.ubicar(o.datos.x, o.datos.z + ${dz}, Math.atan2(0, ${dz} > 0 ? 1 : -1)); return 1 })()`);
        await N('N.tick(0.3)');
        await N(`(() => { const o = H.obras.obras.find((x) => x.plano.id === ${JSON.stringify(plano)}); const p = { x: o.datos.x, y: o.datos.y + ${dy}, z: o.datos.z }; H.jugador.ubicar(o.datos.x, o.datos.z + ${dz}, Math.atan2(-(p.x - o.datos.x), -(p.z - (o.datos.z + ${dz})))); N.ajustarPitch(p); return 1 })()`);
        await N('N.tick(0.5)');
        const a = await N('N.aviso()'); await foto(nombre + '-antes');
        await N('N.e()'); await N('N.tick(0.8)'); await foto(nombre + '-despues');
        console.log(`  ${plano}: aviso «${a}» · sentado ${await N('H.jugador.estado.sentado')}`);
        await N('N.cerrarCharla()'); await N('(() => { H.jugador.sentarse(false); return 1 })()');
      };
      await usarObra('mesada', '30-mesada', 1.0);
      await usarObra('sillon', '31-sillon-armado', 0.6);
      await usarObra('baul', '32-baul-armado', 0.55);
      await usarObra('librero', '33-librero', 1.2);
      await usarObra('barril-agua', '34-barril', 0.55);
    });

    await N('N.mirarA(0, 1.6, N.local(0, 1, -2))'); await N('N.tick(1.5)');
    console.log('  programas al final:', await N('N.programas()'), '· llamadas adentro:', await N('H.renderer.info.render.calls'));
    // guardar y que la casa vuelva saneada
    const guardada = await N('(() => { H.guardar(); const t = localStorage.getItem("hojarasca-relax-1") || Object.keys(localStorage).map((k) => localStorage.getItem(k)).find((v) => v && v.includes("\\"casa\\"")); return t ? (JSON.parse(t).casa ? JSON.stringify(JSON.parse(t).casa) : "sin casa") : "no encontré la partida" })()');
    console.log('  guardada:', guardada);
  } catch (err) { console.log('ERROR:', err && err.stack || err); errores.push(String(err && err.message || err)); }
  console.log(errores.length ? 'ERRORES:\n  ' + errores.join('\n  ') : 'SIN ERRORES');
  console.log('capturas en', salida);
  app.exit(errores.length ? 1 : 0);
});

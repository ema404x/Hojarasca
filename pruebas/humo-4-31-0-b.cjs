// Partida real 4.31.0 (B): el pueblo y la gente, al detalle (pueblo-detalles-juego.js), visto en el juego:
//   saludo, queja al chocar, lluvia (se tapan), frío (se frotan las manos), nieve (se sacuden al entrar), golpear la puerta, la llave de la luz
//   (y la queja), las ventanas y el humo según quién está, los carteles, el perro, la campanita y la campana de la escuela.
// Uso (después de `node armar.mjs`, con el candado de Electron):
//   powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-31-0-b.cjs -Espera 900 -Perfil <carpeta>
//   HUMO_PARTES=saludo,choque,... · HUMO_SALIDA=<carpeta> · HUMO_CALIDAD=media|baja|alta
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-31-0-b'));
const ANCHO = 1366, ALTO = 724;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 14 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 14 * 60 * 1000).unref?.();
const PARTES = (process.env.HUMO_PARTES || 'saludo,choque,lluvia,frio,nieve,golpe,llave,ventanas,cartel,perro,campanita,campana,medida').split(',');
const parte = (p) => PARTES.includes(p);
const CALIDAD = process.env.HUMO_CALIDAD || 'media';

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, P = H.progreso;
  const N = window.__N = {};
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  H.ajustes.limiteFps = 'libre';
  N.programas = () => H.renderer.info.programs.length;
  N.lluvia = null;   // forzar el tiempo en cada cuadro
  N.tick = async (seg = 0.5) => { const t0 = performance.now(); while (performance.now() - t0 < seg * 1000) { if (N.lluvia !== null) { H.clima.estado.lluvia = N.lluvia; H.clima.estado.objetivo = N.lluvia > 0.3 ? 'lluvia' : 'despejado'; } H.__bucle(); await dormir(14); } return 1; };
  N.tarjeta = () => { const v = document.getElementById('valle-tarjeta'); return !!v && !v.classList.contains('oculto'); };
  N.aldeaEntera = () => { const A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return 0; const a = P.aldea;
    const L = { carpintero: 'carpinteria', veterinaria: 'veterinaria', panadera: 'panaderia', herbolaria: 'herboristeria', herrero: 'herreria', modista: 'costureria', pescador: 'pescaderia', botera: 'varadero', maestra: 'escuela', pintora: 'taller-arte', enfermera: 'puesto-sanitario', andinista: 'refugio-andinista', ceramista: 'ceramica', tejedora: 'hilanderia' };
    const ks = Object.keys(L).filter((k) => A.estadoEdificio(L[k]));
    a.pobladores = ks.map((clave) => ({ clave, dia: 1 })); a.obras = {}; a.locales = Object.fromEntries(ks.map((k) => [L[k], 1])); a.descubierta = 1; a.llegando = null;
    A.actualizar(4, H.camara.position); return ks.length; };
  { const st = document.createElement('style'); st.textContent = '#pista-clic { display: none !important; }'; document.head.appendChild(st); }
  N.quien = (k) => H.gente.gente.find((g) => g.claveAldea === k || g.clave === k) || null;
  N.mirar = (de, a, pitch = 0) => { H.jugador.ubicar(de.x, de.z, Math.atan2(-(a.x - de.x), -(a.z - de.z))); H.jugador.estado.pitch = pitch; H.jugador.estado.sentado = false; return 1; };
  N.mirarY = (de, a, ya) => { N.mirar(de, a, 0); const js = H.jugador.estado; const ojo = js.pos.y + 1.6; js.pitch = Math.atan2(ya - ojo, Math.hypot(a.x - de.x, a.z - de.z)); return 1; };
  N.aviso = () => { const a = H.__avisoYa(); return a ? a.tecla + ' · ' + a.texto : ''; };
  N.E = async () => { document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', bubbles: true })); await dormir(40); document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE', bubbles: true })); return 1; };
  N.info = () => H.__pueblo().info();
  N.hora = async (h, seg = 6) => { P.horas = h; for (let k = 0; k < 4; k++) { H.__aldea.actualizar(2); await N.tick(seg / 4); } return 1; };
  N.despejar = (pt, r = 4) => { for (const g of H.gente.gente) if (g.claveAldea && Math.hypot(g.pos.x - pt.x, g.pos.z - pt.z) < r) N.poner(g, g.pos.x + 25, g.pos.z + 25); return 1; };
  N.renglon = () => H.__aldea.renglon();
  // la puerta de un edificio: el punto de afuera y el de adentro (a d m)
  N.puerta = (id, i = 0, dAfuera = 1.4, dAdentro = 1.6) => { const e = H.__aldeaMundo().estadoEdificio(id); if (!e || !e.puertas.length) return null; const p = e.puertas[i], s = e.sitio;
    const ux = p.x - s.x, uz = p.z - s.z, l = Math.hypot(ux, uz) || 1;
    return { p, afuera: { x: p.x + ux / l * dAfuera, z: p.z + uz / l * dAfuera }, adentro: { x: p.x - ux / l * dAdentro, z: p.z - uz / l * dAdentro }, u: { x: ux / l, z: uz / l } }; };
  N.figuraLibre = (cerca, r = 40) => H.gente.gente.filter((g) => g.claveAldea && g.g.visible && !g.dormido && !g.enEscena && !g.deVisita && (g.g.scale?.y || 1) > 0.9 && Math.hypot(g.pos.x - cerca.x, g.pos.z - cerca.z) < r);
  N.poner = (g, x, z, mira) => { g.pos.set(x, H.T.altura(x, z), z); g.camino = []; g.ruta = null; g.vel = 0; g.espera = 0; if (Number.isFinite(mira)) { g.miraFinal = mira; g.rumboObjetivo = mira; g.g.rotation.y = mira; } return 1; };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [], consola = [];
  const { ipcMain } = require('electron');
  require(path.join(raiz, 'copias-main.cjs')).registrarCopias({ ipcMain, app });
  require(path.join(raiz, 'fotos-main.cjs')).registrarFotos({ ipcMain, app });
  const w = new BrowserWindow({ show: true, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false, preload: path.join(raiz, 'preload.cjs') } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { consola.push(m.slice(0, 300)); errores.push(m.slice(0, 200)); }
  });
  w.webContents.on('render-process-gone', (e, d) => console.log('  PROCESO DE LA PÁGINA CAÍDO:', JSON.stringify(d)));
  let donde = 'carga';
  const js = (c, espera = 120000) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en ${espera / 1000} s (${donde})`)), espera))]);
  const N = (c) => js(`(async () => { const H = window.__hojarasca, N = window.__N, P = H.progreso; return (${c}); })()`);
  const url = process.env.HTML ? path.resolve(process.env.HTML) : path.join(raiz, 'index.html');
  const foto = async (nombre) => {
    for (let intento = 0; intento < 3; intento++) try {
      await esperar(300 + intento * 600);
      const img = await w.webContents.capturePage();
      fs.writeFileSync(path.join(salida, nombre + '.jpg'), img.toJPEG(82));
      console.log(`  (captura ${nombre}.jpg)`);
      return;
    } catch (e) { if (intento === 2) console.log(`  (captura ${nombre} no se pudo: ${e && e.message})`); }
  };
  const ajustes = (o) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({calidad:'media', clima:'despejado', musica:false, modo:'relax', relaxTipo:'libre', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'}, ${JSON.stringify(o)}))); 1`;
  const esperarJuego = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false)) return true; } return false; };
  const verifica = (c, t) => { console.log(`  ${c ? 'OK' : 'FALLA'} · ${t}`); if (!c) errores.push(t); };
  const seccion = async (nombre, fn) => {
    if (!parte(nombre)) return;
    donde = nombre;
    console.log(`\n== ${nombre}`);
    try { await fn(); } catch (err) { console.log('ERROR en', nombre + ':', err && err.stack || err); errores.push(`${nombre}: ${err && err.message || err}`); }
    const fallas = await js('(() => { const C = window.__hojarasca && window.__hojarasca.__caidas; return C && C.fallas ? JSON.stringify(C.fallas()).slice(0, 600) : "" })()').catch(() => '');
    if (fallas && fallas !== '[]') { console.log('  FALLAS DEL JUEGO: ' + fallas); errores.push(nombre + ': fallas del juego ' + fallas.slice(0, 200)); }
    await N('(() => { N.lluvia = 0; H.clima.estado.lluvia = 0; H.ajustes.estacion = "verano"; H.__U().uInvierno.value = 0; P.horas = 10; return 1 })()');
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
    await N('(() => { H.clima.estado.lluvia = 0; P.dia = 30; P.horas = 10; return 1 })()');
    console.log('  locales abiertos:', await N('N.aldeaEntera()'));
    const plaza = await N('(() => { const s = H.__aldeaMundo().estadoEdificio("plaza").sitio; return { x: s.x, z: s.z } })()');
    await N(`(() => { H.jugador.ubicar(${plaza.x}, ${plaza.z} + 6, 0); return 1 })()`);
    for (let i = 0; i < 10; i++) { await N('(() => { H.__aldea.actualizar(2); return 1 })()'); await N('N.tick(1.0)'); }
    const prog0 = await N('N.programas()');
    console.log('  programas al empezar:', prog0);

    // ---------------------------------------------------------------- el saludo
    await seccion('saludo', async () => {
      const r = await N(`(() => { const c = H.jugador.estado.pos; const l = N.figuraLibre(c, 60).filter((g) => !g.pose && g.vel < 0.05 && !H.__aldeaMundo().adentro(g.pos)); if (!l.length) return null; const g = l[0]; N.__g = g; N.poner(g, g.pos.x, g.pos.z, g.g.rotation.y); return g.claveAldea })()`);
      verifica(!!r, `hay alguien parado afuera para saludar (${r})`);
      if (!r) return;
      // de espaldas a 3,5 m: nada
      await N('(() => { const g = N.__g, m = g.g.rotation.y, de = { x: g.pos.x + Math.sin(m) * 3.5, z: g.pos.z + Math.cos(m) * 3.5 }; N.__de = de; N.mirar(de, { x: de.x + Math.sin(m) * 5, z: de.z + Math.cos(m) * 5 }, -0.05); return 1 })()');
      const s0 = await N('N.info().saludos'); await N('N.tick(1.2)');
      verifica((await N('N.info().saludos')) === s0, 'de espaldas, no saluda');
      await N('N.mirar(N.__de, N.__g.pos, -0.05)'); await N('N.tick(0.15)'); await foto('01-saludo-antes');
      await N('N.tick(0.45)'); await foto('01-saludo-1'); await N('N.tick(0.4)'); await foto('01-saludo-2');
      const i = await N('N.info()');
      verifica(i.saludos === s0 + 1, `mirándolo, saluda: «${i.ultimoSaludo}» (${r})`);
      verifica(await N('!!N.__g.animSocial && N.__g.animSocial.id === "saludar"'), 'con la mano (la animación de saludar)');
    });
    // ---------------------------------------------------------------- el choque
    await seccion('choque', async () => {
      const r = await N(`(() => { const c = H.jugador.estado.pos; const l = N.figuraLibre(c, 120); if (!l.length) return null; const g = l[l.length - 1]; N.__g = g; g.animSocial = null; g.pose = null;
        const s = H.__aldeaMundo().estadoEdificio("plaza").sitio; N.poner(g, s.x - 4, s.z - 12, 0); return g.claveAldea })()`);
      await N('N.tick(0.5)');
      if (!r) { verifica(false, 'hay alguien para chocar'); return; }
      const q0 = await N('N.info().quejas');
      // corriendo hacia él desde 4 m, a 4 m/s, cuadro a cuadro (sin atravesarlo: el choque frena al jugador)
      await N(`(async () => { const g = N.__g, m = g.g.rotation.y, de = { x: g.pos.x + Math.sin(m) * 4, z: g.pos.z + Math.cos(m) * 4 }; N.mirar(de, g.pos, -0.1);
        const js = H.jugador.estado; for (let k = 0; k < 60; k++) { const dx = g.pos.x - js.pos.x, dz = g.pos.z - js.pos.z, d = Math.hypot(dx, dz); if (d > 0.35) { js.pos.x += dx / d * 0.07; js.pos.z += dz / d * 0.07; } H.__bucle(); await new Promise((r) => setTimeout(r, 16)); } return 1 })()`);
      await foto('02-choque-1');
      // un paso atrás, para verle la cara y la burbuja
      await N('(() => { const g = N.__g, js = H.jugador.estado.pos, dx = js.x - g.pos.x, dz = js.z - g.pos.z, d = Math.hypot(dx, dz) || 1; N.mirar({ x: g.pos.x + dx / d * 2.4, z: g.pos.z + dz / d * 2.4 }, g.pos, 0.05); return 1 })()');
      await N('N.tick(0.2)'); await foto('02-choque-2'); await N('N.tick(0.5)'); await foto('02-choque-3');
      const i = await N('N.info()');
      verifica(i.quejas > q0, `chocándolo corriendo, se queja: «${i.ultimaQueja}» (${r})`);
      verifica(await N('!!N.__g.animSocial'), `con el gesto (${await N('N.__g.animSocial && N.__g.animSocial.id')})`);
    });
    // ---------------------------------------------------------------- lluvia: caminando, se tapan
    await seccion('lluvia', async () => {
      await N('(() => { N.lluvia = 0.9; P.horas = 11; return 1 })()'); await N('N.tick(2)');
      const r = await N(`(() => { const c = H.jugador.estado.pos; const l = N.figuraLibre(c, 120); if (!l.length) return null; const g = l[0]; N.__g = g; g.sinFrenar = true;
        const s = H.__aldeaMundo().estadoEdificio("plaza").sitio, a = { x: s.x - 9, z: s.z - 12 }, b = { x: s.x + 14, z: s.z - 12 }; N.poner(g, a.x, a.z); g.camino = [b]; N.__b = b; return g.claveAldea })()`);
      if (!r) { verifica(false, 'hay alguien para caminar'); return; }
      const sigue = `(() => { const g = N.__g; if (!g.camino || !g.camino.length) g.camino = [N.__b]; return N.mirar({ x: g.pos.x + 0.3, z: g.pos.z + 3.2 }, g.pos, -0.18) })()`;
      await N(sigue); await N('N.tick(1.5)'); await N(sigue); await N('N.tick(0.2)');
      await foto('03-lluvia-1'); await N(sigue); await N('N.tick(0.3)'); await foto('03-lluvia-2');
      const d = await N('({ d: N.__g.__detalle, b: +N.__g.brazos[1].rotation.x.toFixed(2), vel: +N.__g.vel.toFixed(2) })');
      verifica(d.d === 'taparse' && d.b < -1.8, `caminando bajo la lluvia, se tapa la cabeza (${JSON.stringify(d)}, ${r})`);
      await N('(() => { N.__g.sinFrenar = false; N.lluvia = 0; return 1 })()');
    });
    // ---------------------------------------------------------------- frío: parados, se frotan las manos
    await seccion('frio', async () => {
      await N('(() => { H.ajustes.estacion = "invierno"; H.__U().uInvierno.value = 1; P.horas = 11; return 1 })()'); await N('N.tick(1.5)');
      const r = await N(`(() => { const c = H.jugador.estado.pos; const l = N.figuraLibre(c, 120).filter((g) => !H.__aldeaMundo().adentro(g.pos)); if (!l.length) return null; const g = l[0]; N.__g = g; g.animSocial = null; g.pose = null;
        N.poner(g, g.pos.x, g.pos.z, g.g.rotation.y); return g.claveAldea })()`);
      if (!r) { verifica(false, 'hay alguien afuera'); return; }
      await N('(() => { const g = N.__g, m = g.g.rotation.y; N.mirar({ x: g.pos.x + Math.sin(m) * 2.6, z: g.pos.z + Math.cos(m) * 2.6 }, g.pos, -0.15); return 1 })()');
      await N('N.tick(1.2)'); await foto('04-frio-1'); await N('N.tick(0.15)'); await foto('04-frio-2');
      const d = await N('({ d: N.__g.__detalle, pose: N.__g.pose, b0: +N.__g.brazos[0].rotation.x.toFixed(2), b1: +N.__g.brazos[1].rotation.x.toFixed(2), anim: N.__g.animSocial && N.__g.animSocial.id })');
      verifica(d.d === 'frotarse', `parado al frío, se frota las manos (${JSON.stringify(d)}, ${r})`);
    });
    // ---------------------------------------------------------------- nieve: al entrar a su casa, se sacude
    await seccion('nieve', async () => {
      await N('(() => { H.ajustes.estacion = "invierno"; H.__U().uInvierno.value = 1; N.lluvia = 0.9; P.horas = 11; return 1 })()'); await N('N.tick(1.5)');
      const r = await N(`(() => { const c = H.jugador.estado.pos; const l = N.figuraLibre(c, 150); if (!l.length) return null; const g = l[0]; N.__g = g; g.animSocial = null; const pu = N.puerta("casa-nelida") || N.puerta("biblioteca"); N.__pu = pu;
        N.poner(g, pu.afuera.x, pu.afuera.z, Math.atan2(-pu.u.x, -pu.u.z)); return g.claveAldea })()`);
      if (!r) { verifica(false, 'hay alguien'); return; }
      await N('N.tick(0.6)');
      const s0 = await N('N.info().sacudidas');
      // la cámara adentro, mirando a la puerta; la figura entra (la ponemos un paso adentro)
      await N('(() => { const pu = N.__pu, de = { x: pu.p.x - pu.u.x * 2.6, z: pu.p.z - pu.u.z * 2.6 }; N.mirar(de, pu.p, -0.12); N.poner(N.__g, pu.p.x - pu.u.x * 0.7, pu.p.z - pu.u.z * 0.7, Math.atan2(-pu.u.x, -pu.u.z)); return 1 })()');
      await N('(() => { N.__g.animSocial = null; return 1 })()'); await N('N.tick(0.35)'); await foto('05-nieve-1'); await N('N.tick(0.3)'); await foto('05-nieve-2'); await N('N.tick(0.3)'); await foto('05-nieve-3');
      const i = await N('N.info()');
      verifica(i.sacudidas > s0, `entrando con nieve, se sacude (${r})`);
      await N('(() => { N.lluvia = 0; return 1 })()');
    });
    // ---------------------------------------------------------------- golpear la puerta
    await seccion('golpe', async () => {
      await N('N.hora(21.5)');
      for (const [id, esperado] of [['casa-nelida', 'abre'], ['casa-ercilia', null]]) {
        const pu = await N(`N.puerta("${id}")`);
        if (!pu) { verifica(false, `la puerta de ${id}`); continue; }
        await N(`N.despejar(${JSON.stringify(pu.afuera)})`);
        await N(`N.mirar(${JSON.stringify(pu.afuera)}, ${JSON.stringify({ x: pu.p.x, z: pu.p.z })}, -0.12)`); await N('N.tick(0.4)');
        const av = await N('N.aviso()');
        verifica(/Golpear la puerta/.test(av), `frente a la puerta cerrada de ${id}: «${av}»`);
        await N('N.E()'); await N('N.tick(1.8)');
        const i = await N('N.info()'), ren = await N('N.renglon()');
        verifica(i.golpes >= 1 && !!ren, `${id}: golpeás y contesta «${ren}» (${i.ultimaRespuesta})`);
        if (esperado) verifica(i.ultimaRespuesta === esperado, `${id}: ${esperado}`);
        await foto(`06-golpe-${id}`);
        const av2 = await N('N.aviso()');
        verifica(/Abrir/.test(av2), `después de golpear, la E abre: «${av2}»`);
        await N('N.tick(4)');
      }
    });
    // ---------------------------------------------------------------- la llave de la luz (y la queja)
    await seccion('llave', async () => {
      await N('N.hora(21.5)');
      const pu = await N('N.puerta("casa-nelida", 0, 1.4, 1.2)');
      const ocup = await N('N.info().ocupacion["casa-nelida"]');
      console.log('  la casa de Nélida:', JSON.stringify(ocup));
      // abrir y entrar
      await N(`N.mirarY(${JSON.stringify(pu.afuera)}, ${JSON.stringify({ x: pu.p.x, z: pu.p.z })}, H.jugador.estado.pos.y + 1.2)`); await N('N.tick(0.3)');
      for (let k = 0; k < 3 && !/Cerrar/.test(await N('N.aviso()')); k++) { await N('N.E()'); await N('N.tick(1.2)'); }
      // adentro, mirando a los dos costados de la puerta hasta que el aviso diga la llave
      let hallado = null;
      for (const s of [1, -1]) {
        const r = await N(`(() => { const pu = N.puerta("casa-nelida", 0, 1.4, 1.25), lado = 0.78 * ${s}, px = pu.u.z, pz = -pu.u.x;
          const sw = { x: pu.p.x + px * lado, z: pu.p.z + pz * lado }; N.mirarY(pu.adentro, sw, H.jugador.estado.pos.y + 1.3); return 1 })()`);
        await N('N.tick(0.3)');
        const av = await N('N.aviso()');
        console.log('  mirando la llave (' + s + '):', JSON.stringify(await N('N.info().llaveVista')), '«' + av + '»');
        if (/la luz/.test(av)) { hallado = av; break; }
      }
      verifica(!!hallado, `adentro, mirando al costado de la puerta: «${hallado}»`);
      if (!hallado) return;
      await foto('07-llave-antes');
      await N('N.E()'); await N('N.tick(0.9)');
      const i = await N('N.info()');
      verifica(i.llaves >= 1 && ('casa-nelida' in i.apagadas || i.quejasLuz > 0), `apagaste la luz (${JSON.stringify(i.apagadas)})`);
      await foto('07-llave-apagada');
      if (ocup && ocup.despiertos) {
        verifica(i.quejasLuz >= 1, `Nélida se queja: «${i.ultimaQuejaLuz}» («${await N('N.renglon()')}»)`);
        await N('N.tick(4)'); await foto('07-llave-la-prende');
        verifica(!('casa-nelida' in (await N('N.info()')).apagadas), 'y la vuelve a prender');
      }
      await N('(() => { H.guardar && H.guardar(); return 1 })()');
    });
    // ---------------------------------------------------------------- las ventanas y el humo, según quién está
    await seccion('ventanas', async () => {
      const vista = async (h, nombre) => {
        await N(`N.hora(${h}, 8)`);
        const pu = await N('N.puerta("casa-nelida", 0, 14, 1)');
        await N(`N.mirarY(${JSON.stringify(pu.afuera)}, ${JSON.stringify({ x: pu.p.x, z: pu.p.z })}, H.jugador.estado.pos.y + 2.4)`); await N('N.tick(1.5)');
        await foto(nombre);
        return N(`(() => { const A = H.__aldeaMundo(), c = H.camara.position; const ch = A.chimeneasCerca({ x: c.x, z: c.z }, []).map((q) => q.edificio || '?');
          const pd = H.__pueblo(); return { luzNelida: pd.luz('casa-nelida'), luzBiblioteca: pd.luz('biblioteca'), humo: ch, vidrioNelida: A.estadoEdificio('casa-nelida').ventana, vidrioBiblioteca: A.estadoEdificio('biblioteca').ventana } })()`);
      };
      const n21 = await vista(21.5, '08-ventanas-21h'), n3 = await vista(3, '08-ventanas-3h');
      console.log('  21:30 h:', JSON.stringify(n21), '· 3 h:', JSON.stringify(n3));
      verifica(n21.luzNelida === 1 && n3.luzNelida < 0.5, 'la ventana de Nélida, prendida a las 21:30 y con el velador a las 3');
      verifica(n21.luzBiblioteca === 0 && n21.vidrioBiblioteca < 0.5, 'la biblioteca de noche, apagada (sus vidrios oscuros)');
      verifica(n21.vidrioNelida > n3.vidrioNelida, 'los vidrios de Nélida brillan más a las 21:30 que a las 3');
      verifica(!n21.humo.includes('biblioteca'), 'sin humo en la biblioteca vacía');
    });
    // ---------------------------------------------------------------- el cartel
    await seccion('cartel', async () => {
      await N('N.hora(10.5)');
      const c = await N('(() => { const pe = H.__aldeaMundo().puntosEdificio("panaderia"); return pe && pe.carteles && pe.carteles[0] })()');
      verifica(!!c, `la panadería tiene su cartel (${c && c.texto})`);
      if (!c) return;
      const pu = await N('N.puerta("panaderia", 0, 3.4, 1)');
      await N(`N.mirarY(${JSON.stringify(pu.afuera)}, ${JSON.stringify({ x: c.x, z: c.z })}, ${c.y})`); await N('N.tick(0.4)');
      const av = await N('N.aviso()');
      verifica(/Leer el cartel/.test(av), `mirando el cartel: «${av}»`);
      await foto('09-cartel-mirando');
      await N('N.E()'); await N('N.tick(0.6)');
      const t = await N('(document.getElementById("charla-texto") || {}).textContent || ""');
      verifica(/Panader/.test(t + (await N('(document.getElementById("charla") || {}).textContent || ""'))), `se lee: «${t.slice(0, 120)}»`);
      await foto('09-cartel-leido');
      for (let k = 0; k < 4; k++) { await N('N.E()'); await N('N.tick(0.4)'); }
    });
    // ---------------------------------------------------------------- el perro
    await seccion('perro', async () => {
      await N('(() => { P.horas = 11; return 1 })()');
      const p = await N('(() => { const e = H.__aldea.animales().estado(); const q = e.perros.find((x) => x.id === "chola") || e.perros[0]; return q ? { ...q } : null })()');
      if (!p) { verifica(false, 'hay un perro'); return; }
      await N(`(() => { H.jugador.ubicar(${p.x} + 6, ${p.z}, 0); return 1 })()`); await N('N.tick(1)');
      const q = await N(`(() => { const e = H.__aldea.animales().estado(); return { ...e.perros.find((x) => x.id === "${p.id}") } })()`);
      await N(`N.mirar({ x: ${q.x} + 1.15, z: ${q.z} + 0.3 }, { x: ${q.x}, z: ${q.z} }, -0.75)`); await N('N.tick(0.15)');
      const av = await N('N.aviso()');
      verifica(/Acariciar/.test(av), `con el perro adelante: «${av}»`);
      await foto('10-perro-antes');
      await N('N.E()'); await N('N.tick(0.5)'); await foto('10-perro-1'); await N('N.tick(0.5)'); await foto('10-perro-2');
      const e = await N(`(() => { const e = H.__aldea.animales().estado(); return e.perros.find((x) => x.id === "${p.id}").estado })()`);
      verifica((await N('N.info().caricias')) >= 1 && e === 'sigue', `lo acariciaste y te sigue (${e})`);
      const giro = await N(`(() => { const e = H.__aldea.animales().estado(), q = e.perros.find((x) => x.id === "${p.id}"), js = H.jugador.estado.pos, r = Math.atan2(js.x - q.x, js.z - q.z); return +Math.abs(Math.atan2(Math.sin(r - q.rumbo), Math.cos(r - q.rumbo))).toFixed(2) })()`);
      verifica(giro < 0.6, `mientras lo acariciás, te mira (${giro} rad)`);
      await N(`N.mirar({ x: ${q.x} + 2.4, z: ${q.z} + 1.2 }, { x: ${q.x}, z: ${q.z} }, -0.35)`); await N('N.tick(0.2)'); await foto('10-perro-3-de-lejos');
    });
    // ---------------------------------------------------------------- la campanita al entrar a un local
    await seccion('campanita', async () => {
      await N('N.hora(10.5)');
      const pu = await N('N.puerta("panaderia", 0, 1.4, 1.8)');
      await N(`N.mirarY(${JSON.stringify(pu.afuera)}, ${JSON.stringify({ x: pu.p.x, z: pu.p.z })}, H.jugador.estado.pos.y + 1.2)`); await N('N.tick(0.3)');
      for (let k = 0; k < 3 && !/Cerrar/.test(await N('N.aviso()')); k++) { await N('N.E()'); await N('N.tick(1.2)'); }
      const c0 = await N('N.info().campanitas');
      await N(`(() => { const pu = N.puerta("panaderia", 0, 1.4, 1.8); N.mirar(pu.adentro, { x: pu.adentro.x - pu.u.x * 4, z: pu.adentro.z - pu.u.z * 4 }, -0.1); return 1 })()`);
      await N('N.tick(1.0)'); await foto('11-campanita');
      verifica((await N('N.info().campanitas')) > c0, 'al entrar a la panadería suena la campanita');
    });
    // ---------------------------------------------------------------- la campana de la escuela
    await seccion('campana', async () => {
      const s = await N('(() => { const e = H.__aldeaMundo().estadoEdificio("escuela"); return e && e.sitio })()');
      if (!s) { verifica(false, 'hay escuela'); return; }
      await N(`(() => { P.dia = 29; P.horas = 8.45; H.jugador.ubicar(${s.x} + 14, ${s.z} + 6, 0); return 1 })()`);
      await N(`N.mirar(H.jugador.estado.pos, { x: ${s.x}, z: ${s.z} }, -0.05)`);
      const c0 = await N('N.info().campanas');
      await N('N.tick(0.3)'); await N('(() => { P.horas = 8.52; return 1 })()'); await N('N.tick(0.5)');
      await foto('12-escuela');
      const i = await N('N.info()');
      verifica(i.campanas > c0, `a las 8:30 suena la campana de la escuela (${i.ultimaCampana}, día de la semana ${await N('P.dia % 7')})`);
    });
    // ---------------------------------------------------------------- lo que cuesta
    await seccion('medida', async () => {
      await N(`(() => { P.horas = 11; H.jugador.ubicar(${plaza.x}, ${plaza.z} + 4, 0); return 1 })()`); await N('N.tick(2)');
      const m = await N(`(async () => { const lista = []; for (let k = 0; k < 400; k++) { H.__bucle(); lista.push(H.__pueblo().info().ms); await new Promise((r) => setTimeout(r, 10)); }
        lista.sort((a, b) => a - b); const prom = lista.reduce((a, b) => a + b, 0) / lista.length; return { prom: +prom.toFixed(4), p95: +lista[Math.floor(lista.length * 0.95)].toFixed(4), max: +lista[lista.length - 1].toFixed(4) } })()`);
      console.log('  en la plaza, lo de este módulo por cuadro (ms):', JSON.stringify(m));
      verifica(m.prom < 0.5, 'menos de 0,5 ms por cuadro en la plaza');
    });
    const prog1 = await N('N.programas()');
    console.log('\n  programas:', prog0, '→', prog1);
    verifica(prog1 <= prog0 + 2, 'sin programas nuevos (de noche en la aldea, uno o dos más es lo conocido)');
  } catch (err) {
    console.log('ERROR:', err && err.stack || err);
    errores.push(String(err && err.message || err));
  }
  if (consola.length) console.log('consola:', consola.slice(0, 6));
  console.log(errores.length ? `\n${errores.length} problemas:\n${errores.map((e) => '  · ' + e).join('\n')}` : '\nTodo en orden');
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(errores.length ? 1 : 0); }
});

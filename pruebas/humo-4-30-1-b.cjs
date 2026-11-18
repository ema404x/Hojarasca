// Partida real 4.30.1 (B): el retablo de los títeres, el álamo de atrás de la plaza y las de pollera en la ladera.
//   · captura: el mismo lugar de la captura del usuario (atrás del retablo, de mañana, con Lucía parada en la ladera al lado);
//   · retablo: de frente (desde los bancos), de costado y de atrás, de cerca;
//   · pollera: todas las de pollera de la aldea paradas en la ladera de atrás del retablo, de frente y de costado.
// Uso (después de `node armar.mjs`): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-humo-4-30-1-b.ps1 [-Partes captura,retablo] [-Salida C:\carpeta]
//   HUMO_PARTES=... · HTML=<otra página> · HUMO_SALIDA=<carpeta> · HUMO_CALIDAD=media|baja|alta
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-30-1-b'));
const ANCHO = 1366, ALTO = 724;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 12 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 12 * 60 * 1000).unref?.();
const PARTES = (process.env.HUMO_PARTES || 'captura,retablo,pollera').split(',');
const parte = (p) => PARTES.includes(p);
const CALIDAD = process.env.HUMO_CALIDAD || 'media';
const POLLERAS = ['aldea-nena', 'ercilia', 'aldea-nelida', 'aldea-abuela', 'aldea-madre', 'aldea-galesa', 'aldea-moza', 'aldea-bailarina', 'aldea-anfitriona', 'poblador-panadera', 'poblador-enfermera', 'poblador-tejedora', 'poblador-herbolaria', 'poblador-ceramista', 'poblador-modista'];

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, P = H.progreso;
  const N = window.__N = {};
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  H.ajustes.limiteFps = 'libre';
  N.programas = () => H.renderer.info.programs.length;
  N.fijos = [];
  // los que se dejan quietos en un lugar (cada cuadro: en su lugar, parados, mirando a donde se pidió)
  // (la rutina de la aldea les vuelve a poner la pose de su lugar —sentada en un banco— cada vuelta: mientras están fijas, la pose, el asiento y el
  // sueño no se pueden cambiar)
  const TRABAS = ['pose', 'asiento', 'dormido', 'enEscena'];
  N.trabar = (g) => { if (g.__trabada) return; g.__trabada = true; for (const k of TRABAS) Object.defineProperty(g, k, { configurable: true, get: () => (k === 'asiento' ? undefined : k === 'enEscena' ? true : null), set: () => {} }); };
  N.soltar = () => { for (const f of N.fijos) { const g = f.g; if (!g.__trabada) continue; for (const k of TRABAS) { delete g[k]; g[k] = k === 'asiento' ? undefined : k === 'enEscena' ? false : null; } g.__trabada = false; } N.fijos = []; return 1; };
  N.fijar = () => { for (const f of N.fijos) { const g = f.g; N.trabar(g); g.camino = f.anda ? [{ x: f.x + Math.sin(f.mira) * 80, z: f.z + Math.cos(f.mira) * 80 }] : []; g.ruta = null; g.animSocial = null; g.miraFinal = f.mira; g.rumboObjetivo = f.mira; g.g.rotation.y = f.mira; g.vel = 0; g.espera = 0; g.pos.set(f.x, H.T.altura(f.x, f.z), f.z); g.g.visible = true; } };
  N.tick = async (seg = 0.5) => { const t0 = performance.now(); while (performance.now() - t0 < seg * 1000) { N.fijar(); H.__bucle(); await dormir(14); } N.fijar(); return 1; };
  N.tarjeta = () => { const v = document.getElementById('valle-tarjeta'); return !!v && !v.classList.contains('oculto'); };
  N.aldeaEntera = () => { const A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return 0; const a = P.aldea;
    const L = { carpintero: 'carpinteria', veterinaria: 'veterinaria', panadera: 'panaderia', herbolaria: 'herboristeria', herrero: 'herreria', modista: 'costureria', pescador: 'pescaderia', botera: 'varadero', maestra: 'escuela', pintora: 'taller-arte', enfermera: 'puesto-sanitario', andinista: 'refugio-andinista', ceramista: 'ceramica', tejedora: 'hilanderia' };
    const ks = Object.keys(L).filter((k) => A.estadoEdificio(L[k]));
    a.pobladores = ks.map((clave) => ({ clave, dia: 1 })); a.obras = {}; a.locales = Object.fromEntries(ks.map((k) => [L[k], 1])); a.descubierta = 1; a.llegando = null;
    A.actualizar(4, H.camara.position); return ks.length; };
  // la plaza: (lx, lz) en su marco (+Z a la estación) al mundo
  N.plaza = (lx, lz) => { const s = H.__aldeaMundo().estadoEdificio('plaza').sitio, c = Math.cos(s.rot), sn = Math.sin(s.rot); return { x: s.x + lx * c + lz * sn, z: s.z - lx * sn + lz * c }; };
  { const st = document.createElement('style'); st.textContent = '#pista-clic, #aviso { display: none !important; }'; document.head.appendChild(st); }
  // la ladera más empinada cerca del retablo (en el marco de la plaza): el punto, hacia dónde sube (u) y de frente (f), de costado a la pendiente
  N.ladera = (x0 = -2, x1 = 9, z0 = -13, z1 = -8.6) => { let mejor = null;
    for (let lx = x0; lx <= x1; lx += 0.5) for (let lz = z0; lz <= z1; lz += 0.5) { const q = N.plaza(lx, lz), d = 0.3;
      const gx = (H.T.altura(q.x + d, q.z) - H.T.altura(q.x - d, q.z)) / (2 * d), gz = (H.T.altura(q.x, q.z + d) - H.T.altura(q.x, q.z - d)) / (2 * d), m = Math.hypot(gx, gz);
      if (!mejor || m > mejor.m) mejor = { lx, lz, x: q.x, z: q.z, m, u: { x: gx / m, z: gz / m } }; }
    mejor.f = { x: -mejor.u.z, z: mejor.u.x }; return mejor; };
  N.quien = (k) => { const c = k.replace(/^(aldea|poblador)-/, ''); return H.gente.gente.find((g) => g.clave === k || g.claveAldea === c || g.clave === c) || null; };
  N.mirar = (de, a, pitch = 0) => { H.jugador.ubicar(de.x, de.z, Math.atan2(-(a.x - de.x), -(a.z - de.z))); H.jugador.estado.pitch = pitch; H.jugador.estado.sentado = false; return 1; };
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
      await esperar(600 + intento * 600);
      const img = await w.webContents.capturePage();
      fs.writeFileSync(path.join(salida, nombre + '.png'), img.toPNG());
      console.log(`  (captura ${nombre}.png)`);
      return;
    } catch (e) { if (intento === 2) console.log(`  (captura ${nombre} no se pudo: ${e && e.message})`); }
  };
  const ajustes = (o) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({calidad:'media', clima:'despejado', musica:false, modo:'relax', relaxTipo:'libre', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'}, ${JSON.stringify(o)}))); 1`;
  const esperarJuego = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false)) return true; } return false; };
  const seccion = async (nombre, fn) => {
    if (!parte(nombre)) return;
    donde = nombre;
    try { await fn(); } catch (err) { console.log('ERROR en', nombre + ':', err && err.stack || err); errores.push(`${nombre}: ${err && err.message || err}`); }
    const fallas = await js('(() => { const C = window.__hojarasca && window.__hojarasca.__caidas; return C && C.fallas ? JSON.stringify(C.fallas()).slice(0, 600) : "" })()').catch(() => '');
    if (fallas && fallas !== '[]') { console.log('  FALLAS DEL JUEGO: ' + fallas); errores.push(nombre + ': fallas del juego ' + fallas.slice(0, 200)); }
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
    await N('(() => { H.clima.estado.lluvia = 0; P.dia = 30; P.horas = 9.5; return 1 })()');
    console.log('  locales abiertos:', await N('N.aldeaEntera()'));
    // a la plaza, y que llegue la gente
    await N('(() => { const q = N.plaza(0, -14); H.jugador.ubicar(q.x, q.z, 0); return 1 })()');
    for (let i = 0; i < 10; i++) { await N('(() => { H.__aldea && H.__aldea.actualizar && H.__aldea.actualizar(2); return 1 })()'); await N('N.tick(1.2)'); }
    const prog0 = await N('N.programas()');
    console.log('  programas al empezar:', prog0);
    const gente = await N(`H.gente.gente.map((g) => g.clave + (g.conPollera ? '*' : '')).join(' ')`);
    console.log('  gente:', gente);

    // el lugar de la captura del usuario: atrás del retablo (que mira a la plaza), con Lucía parada en la ladera, adelante a la izquierda
    await seccion('captura', async () => {
      const hay = await N(`(() => { const g = N.quien('aldea-nena'); if (!g) return false; const L = N.ladera(2, 4, -10.5, -9.2), c = N.plaza(0, -14), s = Math.sign(L.f.x * (c.x - L.x) + L.f.z * (c.z - L.z)) || 1; N.fijos = [{ g, x: L.x, z: L.z, mira: Math.atan2(L.f.x * s, L.f.z * s) }]; return 'pendiente ' + L.m.toFixed(2) + ' en (' + L.lx + ', ' + L.lz + ')' })()`);
      console.log('  Lucía:', hay);
      await N('N.mirar(N.plaza(0, -14.2), N.plaza(4.6, -6.6), -0.04)'); await N('N.tick(2.5)');
      await foto('1-captura-usuario');
      await N('N.mirar(N.plaza(1.6, -12), N.plaza(3.6, -8.6), -0.12)'); await N('N.tick(2)');
      await foto('1-captura-cerca');
      await N('(() => { P.horas = 7.6; H.clima.estado.niebla = 0.6; return 1 })()'); await N('N.mirar(N.plaza(0, -14.2), N.plaza(4.6, -6.6), -0.04)'); await N('N.tick(2.5)');
      await foto('1-captura-niebla');
      await N('(() => { P.horas = 9.5; H.clima.estado.niebla = 0; N.soltar() })()');
    });
    // el retablo de frente (desde los bancos), de costado, de atrás y en función
    await seccion('retablo', async () => {
      await N('N.mirar(N.plaza(2.4, -2.6), N.plaza(3.6, -8.1), -0.06)'); await N('N.tick(2)'); await foto('2-retablo-frente');
      await N('N.mirar(N.plaza(3.3, -5.6), N.plaza(3.6, -8.1), -0.02)'); await N('N.tick(1.5)'); await foto('2-retablo-frente-cerca');
      await N('N.mirar(N.plaza(7.4, -7.2), N.plaza(3.6, -8.1), -0.05)'); await N('N.tick(1.5)'); await foto('2-retablo-costado');
      await N('N.mirar(N.plaza(3.0, -11.2), N.plaza(3.6, -8.1), -0.05)'); await N('N.tick(1.5)'); await foto('2-retablo-atras');
      await N('N.mirar(N.plaza(-1.5, -16), N.plaza(4.5, -6), 0.08)'); await N('N.tick(1.5)'); await foto('2-retablo-arboles');
    });
    // las de pollera, paradas en la ladera más empinada de atrás del retablo, de costado a la pendiente (un pie más arriba que el otro): en fila sobre
    // la misma curva de nivel, todas mirando para el mismo lado (Lucía adelante); se las ve de perfil desde abajo y desde arriba y de frente
    await seccion('pollera', async () => {
      const n = await N(`(() => { const ks = ${JSON.stringify(POLLERAS)}; const L = N.__L = N.ladera(-6, 9, -15, -9); N.fijos = []; let i = 0;
        for (const k of ks) { const g = N.quien(k); if (!g) continue;
          const t = 6 - i, x = L.x + L.f.x * t * 0.85, z = L.z + L.f.z * t * 0.85;
          N.fijos.push({ g, x, z, mira: Math.atan2(L.f.x, L.f.z) }); i++; }
        return 'pendiente ' + L.m.toFixed(2) + ' en (' + L.lx + ', ' + L.lz + '): ' + N.fijos.map((f) => f.g.clave).join(' ') })()`);
      console.log('  de pollera en la ladera:', n);
      await N('N.tick(2)');
      const alto = await N('(() => N.fijos.map((f) => +(H.T.altura(f.x + N.__L.u.x * 0.12, f.z + N.__L.u.z * 0.12) - H.T.altura(f.x - N.__L.u.x * 0.12, f.z - N.__L.u.z * 0.12)).toFixed(3)).join(" "))()');
      console.log('  desnivel de pie a pie (m):', alto);
      const vista = (df, du, mf, pitch) => `(() => { const L = N.__L; return N.mirar({ x: L.x + L.f.x * ${df} + L.u.x * ${du}, z: L.z + L.f.z * ${df} + L.u.z * ${du} }, { x: L.x + L.f.x * ${mf}, z: L.z + L.f.z * ${mf} }, ${pitch}) })()`;
      await N(vista(0.5, -7.5, 0.5, -0.12)); await N('N.tick(2)'); await foto('3-polleras-perfil-abajo');
      await N(vista(3, -3.2, 3, -0.3)); await N('N.tick(1.5)'); await foto('3-polleras-perfil-abajo-cerca');
      await N(vista(-3, -3.2, -3, -0.3)); await N('N.tick(1.5)'); await foto('3-polleras-perfil-abajo-cerca-2');
      await N(vista(0.5, 7.5, 0.5, -0.2)); await N('N.tick(1.5)'); await foto('3-polleras-perfil-arriba');
      await N(vista(7.6, -0.3, 5.1, -0.35)); await N('N.tick(1.5)'); await foto('3-polleras-frente-lucia');
      await N(vista(7.6, -1.6, 4.2, -0.3)); await N('N.tick(1.5)'); await foto('3-polleras-tres-cuartos');
      // caminando (en el lugar: cada cuadro vuelven a su punto), de perfil y de frente
      await N('(() => { for (const f of N.fijos) f.anda = true; return 1 })()');
      for (const k of [0, 1, 2]) { await N(vista(3, -3.2, 3, -0.3)); await N('N.tick(' + (0.9 + k * 0.37) + ')'); await foto('3-polleras-caminando-perfil-' + k); }
      for (const k of [0, 1]) { await N(vista(7.6, -0.3, 5.1, -0.35)); await N('N.tick(' + (0.8 + k * 0.41) + ')'); await foto('3-polleras-caminando-frente-' + k); }
      await N('N.soltar()');
    });
    // caminando de verdad por la ladera de atrás del retablo, con la cámara al costado siguiéndola: Lucía (pollera a la rodilla) y la abuela
    // (chamal hasta el tobillo); capturas seguidas, una cada 0,13 s (un paso entero son unas ocho)
    await seccion('caminar', async () => {
      for (const k of ['aldea-nena', 'aldea-abuela']) {
        await N(`(() => { const g = N.quien('${k}'), a = N.plaza(-6, -10.5), b = N.plaza(12, -10.5); N.fijos = []; N.trabar(g);
          g.pos.set(a.x, H.T.altura(a.x, a.z), a.z); g.camino = [{ x: b.x, z: b.z }]; g.ruta = null; g.velocidad = 0.9; g.sinFrenar = true; g.g.visible = true; N.__anda = { g, a, b }; return 1 })()`);
        const sigue = `(() => { const { g, a, b } = N.__anda, ux = (b.x - a.x) / Math.hypot(b.x - a.x, b.z - a.z), uz = (b.z - a.z) / Math.hypot(b.x - a.x, b.z - a.z);
          if (!g.camino || !g.camino.length) g.camino = [{ x: b.x, z: b.z }];
          return N.mirar({ x: g.pos.x + uz * 2.6 + ux * 0.8, z: g.pos.z - ux * 2.6 + uz * 0.8 }, { x: g.pos.x, z: g.pos.z }, -0.32) })()`;
        await N(sigue); await N('N.tick(2.5)');
        for (let i = 0; i < 10; i++) { await N(sigue); await N('N.tick(0.13)'); await foto(`4-caminar-${k}-${i}`); }
        await N(`(() => { const g = N.__anda.g; N.fijos = [{ g, x: g.pos.x, z: g.pos.z, mira: 0 }]; return N.soltar() })()`);
      }
    });
    console.log('  programas:', prog0, '→', await N('N.programas()'));
  } catch (err) {
    console.log('ERROR:', err && err.stack || err);
    errores.push(String(err && err.message || err));
  }
  if (consola.length) console.log('consola:', consola.slice(0, 6));
  console.log(errores.length ? `\n${errores.length} problemas:\n${errores.map((e) => '  · ' + e).join('\n')}` : '\nTodo en orden');
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(errores.length ? 1 : 0); }
});

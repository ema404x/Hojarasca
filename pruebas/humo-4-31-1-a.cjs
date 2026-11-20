// Partida real 4.31.1 (A): la cacería de bugs de personajes, la Historia y el pueblo, vista en el juego (antes y después, mismas vistas).
//   nota      — la Historia (capítulo 3), adentro del refugio: apuntando a la lámpara, ¿qué dice el aviso? (la nota de Eusebio le robaba la E)
//   montado   — capítulo 10, de noche, a caballo en la puerta del galpón: la E no hacía nada (la escena no arranca montado)
//   mate      — un vecino con mate saluda (animación social): el mate tiene que quedar guardado todo el saludo
//   charla    — leyendo un cartel (la charla abierta) y mirando a un vecino de cerca: no te saluda encima
//   cama      — a las 3, adentro de una casa: los que duermen no saludan ni se quejan
//   desafio   — (HUMO_MODO=desafio) Anselmo con el martillo y Josefina con el arco, quietos y trabajando
// Uso (después de `node armar.mjs`, con el candado: herramientas\correr-4-30-1-a.ps1 -Script pruebas\humo-4-31-1-a.cjs -Perfil perfil-4311-a):
//   HUMO_PARTES=nota,montado,... · HUMO_SALIDA=<carpeta> · HUMO_MODO=desafio
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-31-1-a'));
const ANCHO = 1366, ALTO = 724;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 14 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 14 * 60 * 1000).unref?.();
const DESAFIO = process.env.HUMO_MODO === 'desafio';
const FIESTA_Z = Number(process.env.HUMO_FIESTA_Z || 1.5);   // dónde se junta la fiesta de la plaza (0 en la 4.31.0)
const PARTES = (process.env.HUMO_PARTES || (DESAFIO ? 'desafio' : 'nota,montado,mate,charla,cama,graciela')).split(',');
const parte = (p) => PARTES.includes(p);
const IDS_CAP = ['llave', 'bolsa', 'mesa', 'ramal', 'rueda', 'perdido', 'cosecha', 'cuaderno', 'frios', 'golpea', 'arco', 'nevada', 'deshielo'];

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, P = H.progreso;
  const N = window.__N = {};
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  H.ajustes.limiteFps = 'libre';
  N.programas = () => H.renderer.info.programs.length;
  N.tick = async (seg = 0.5) => { const t0 = performance.now(); while (performance.now() - t0 < seg * 1000) { H.__bucle(); await dormir(14); } return 1; };
  N.tarjeta = () => { const v = document.getElementById('valle-tarjeta'); return !!v && !v.classList.contains('oculto'); };
  { const st = document.createElement('style'); st.textContent = '#pista-clic { display: none !important; }'; document.head.appendChild(st); }
  N.aviso = () => { const a = H.__avisoYa && H.__avisoYa(); return a ? (a.tecla || '') + ' · ' + (a.texto || '') : ''; };
  N.E = async () => { document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e', bubbles: true, cancelable: true })); await dormir(40); document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE', key: 'e', bubbles: true })); return 1; };
  N.esc = () => { document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true, cancelable: true })); return 1; };
  N.despejar = async (maxSeg = 8) => { const t0 = performance.now(); while (performance.now() - t0 < maxSeg * 1000) { const es = H.__escenas; if (es && es.activa()) { const d = es.director.datos && es.director.datos(); if (d && d.eleccion) { document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1', key: '1', bubbles: true })); } else N.esc(); await N.tick(0.4); continue; } if (N.tarjeta()) { const b = document.querySelector('#valle-tarjeta button[data-valle-opcion]'); if (b) b.click(); await N.tick(0.4); continue; } break; } return 1; };
  const R = () => H.T.lugares.refugio;
  N.local = (lx, ly, lz) => { const r = R(), c = Math.cos(r.rot), s = Math.sin(r.rot); return { x: r.x + lx * c + lz * s, y: r.y + ly, z: r.z - lx * s + lz * c }; };
  N.mirarA = (de, a) => { H.jugador.estado.sentado = false; H.jugador.ubicar(de.x, de.z, Math.atan2(-(a.x - de.x), -(a.z - de.z))); return 1; };
  N.pitchA = (a) => { const c = H.camara.position, d = Math.hypot(a.x - c.x, a.z - c.z); H.jugador.estado.yaw = Math.atan2(-(a.x - c.x), -(a.z - c.z)); H.jugador.estado.pitch = Math.atan2(a.y - c.y, d); return 1; };
  N.quien = (k) => H.gente.gente.find((g) => g.claveAldea === k || g.clave === k) || null;
  N.poner = (g, x, z, mira) => { g.pos.set(x, H.T.altura(x, z), z); g.camino = []; g.ruta = null; g.vel = 0; g.espera = 0; if (Number.isFinite(mira)) { g.miraFinal = mira; g.rumboObjetivo = mira; g.g.rotation.y = mira; } return 1; };
  N.aldeaEntera = () => { const A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return 0; const a = P.aldea;
    const L = { carpintero: 'carpinteria', veterinaria: 'veterinaria', panadera: 'panaderia', herbolaria: 'herboristeria', herrero: 'herreria', modista: 'costureria', pescador: 'pescaderia', botera: 'varadero', maestra: 'escuela', pintora: 'taller-arte', enfermera: 'puesto-sanitario', andinista: 'refugio-andinista', ceramista: 'ceramica', tejedora: 'hilanderia', telegrafista: 'estafeta' };
    const ks = Object.keys(L).filter((k) => A.estadoEdificio(L[k]));
    a.pobladores = ks.map((clave) => ({ clave, dia: 1 })); a.obras = {}; a.locales = Object.fromEntries(ks.map((k) => [L[k], 1])); a.descubierta = 1; a.llegando = null;
    A.actualizar(4, H.camara.position); return ks.length; };
  // la Historia en el capítulo cap (0..12), con lo anterior cerrado
  N.prep = (cap, o = {}) => {
    const h = P.historia, ids = ${JSON.stringify(IDS_CAP)};
    h.activa = true; h.empezada = 1; h.version = 2; h.capitulo = cap; h.fase = 'jugando'; h.base = { dia: Math.max(1, P.dia - 1), talados: 0, cocinadas: 0, cantos: 0 }; h.hechos = {}; h.momentos = {}; h.cerrados = {};
    ids.slice(0, cap).forEach((k) => { h.cerrados[k] = P.dia - 1; });
    h.escenas = h.escenas || { vistas: {} }; h.escenas.vistas = {};
    h.decisiones = Object.assign({ bolsa: 'a', coihue: 'a', molienda: 'a', cuaderno: 'a', majada: 'a' }, o.decisiones || {});
    h.duendes = Object.assign(h.duendes || {}, { trato: 'trato', noche: 'pendiente', final: null }, o.duendes || {});
    for (const e of o.vistas || []) h.escenas.vistas[e] = P.dia - 1;
    return 1;
  };
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
  const url = process.env.HTML ? path.resolve(process.env.HTML) : path.join(raiz, 'index.html');
  const foto = async (nombre) => {
    for (let i = 0; i < 3; i++) try { await esperar(400 + i * 600); const img = await w.webContents.capturePage(); fs.writeFileSync(path.join(salida, nombre + '.jpg'), img.toJPEG(84)); console.log(`  (captura ${nombre}.jpg)`); return; } catch (e) { if (i === 2) console.log('  (sin captura ' + nombre + ')'); }
  };
  const ver = (c, t) => { console.log(`  ${c ? 'OK' : 'FALLA'} · ${t}`); if (!c) errores.push(t); };
  const ajustes = (o) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({calidad:'alta', clima:'despejado', musica:false, modo:'relax', relaxTipo:'historia', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'}, ${JSON.stringify(o)}))); 1`;
  const esperarJuego = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false)) return true; } return false; };
  const seccion = async (nombre, fn) => {
    if (!parte(nombre)) return;
    donde = nombre;
    console.log(`\n== ${nombre}`);
    try { await fn(); } catch (err) { console.log('ERROR en', nombre + ':', err && err.stack || err); errores.push(`${nombre}: ${err && err.message || err}`); }
    const fallas = await js('(() => { const C = window.__hojarasca && window.__hojarasca.__caidas; return C && C.fallas ? JSON.stringify(C.fallas()).slice(0, 600) : "" })()').catch(() => '');
    if (fallas && fallas !== '[]') { console.log('  FALLAS DEL JUEGO: ' + fallas); errores.push(nombre + ': fallas ' + fallas.slice(0, 200)); }
  };
  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); ${ajustes(DESAFIO ? { modo: 'desafio' } : {})}`);
    await w.loadFile(url, { search: '?debug=1' });
    await js('window.__sinPausaPorBlur = true; 1');
    if (!(await esperarJuego())) throw new Error('el juego no cargó');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000);
    await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
    await N('N.tick(2)');
    for (let k = 0; k < 8 && (await N('N.tarjeta()')); k++) { await N('(() => { const b = document.querySelector("#valle-tarjeta button[data-valle-opcion]"); if (b) b.click(); return 1 })()'); await N('N.tick(0.6)'); }
    if (!DESAFIO) {
      await N('(() => { H.clima.estado.lluvia = 0; H.clima.estado.nublado = 0; P.dia = 30; P.horas = 11; return 1 })()');
      console.log('  locales abiertos:', await N('N.aldeaEntera()'));
    }

    // ------------------------------------------------ la nota de Eusebio contra las cosas del refugio
    await seccion('nota', async () => {
      await N('N.prep(2, { vistas: ["nota-eusebio", "ronda-umbral", "trochita-boleto", "estacion-llegada"] })');
      await N('(() => { const r = H.T.lugares.refugio; H.jugador.ubicar(r.x, r.z, 0); return 1 })()'); await N('N.tick(1)'); await N('N.despejar()'); await N('N.tick(1)'); await N('N.despejar()');
      const filas = [];
      for (const [id, lx, lz] of [['lampara', 0.4, -0.2], ['cajon', 1.1, 0.75], ['libro', 1.6, -0.9], ['radio', 0.2, -1.2], ['alacena', 0.5, -1.0], ['cartas', 0.9, -1.25]]) {
        await N(`(() => { const p = H.__casaDetalles().puntos(${JSON.stringify(id)})[0]; N.mirarA(N.local(${lx}, 0, ${lz}), p); return 1 })()`);
        await N('N.tick(0.3)');
        await N(`(() => { const p = H.__casaDetalles().puntos(${JSON.stringify(id)})[0]; return N.pitchA(p) })()`);
        await N('N.tick(0.6)');
        if (await N('!!(H.__escenas && H.__escenas.activa())')) { console.log('  (había una escena: se saltea)'); await N('N.despejar()'); await N('N.tick(0.4)'); }
        const a = await N('N.aviso()');
        filas.push(`${id}: «${a}»`);
        if (id === 'lampara') await foto('nota-lampara');
        ver(!/nota de Eusebio|frasco/i.test(a), `apuntando a ${id}, el aviso no es la nota ni el frasco («${a}»)`);
      }
      // mirando la nota sí se relee
      await N('(() => { const q = H.__historiaObjetos().posiciones["nota-mesa"]; N.mirarA(N.local(0.3, 0, 0.3), q); N.pitchA({ x: q.x, y: (q.y ?? H.T.lugares.refugio.y + 0.8), z: q.z }); return 1 })()');
      await N('N.tick(0.6)');
      const an = await N('N.aviso()');
      ver(/nota de Eusebio/.test(an), `mirando la nota, «${an}»`);
      await foto('nota-mirandola');
    });

    // ------------------------------------------------ a caballo en la puerta del galpón (capítulo 10, de noche)
    await seccion('montado', async () => {
      await N('N.prep(9, {})');
      await N('(() => { P.cosas = P.cosas || {}; P.cosas.caballo = true; P.horas = 22.5; return 1 })()');
      const q = await N('(() => { const q = H.__historiaObjetos().posiciones["puerta-galpon"]; return q ? { x: q.x, z: q.z } : null })()');
      ver(!!q, 'la puerta del galpón tiene lugar');
      if (!q) return;
      await N(`(() => { const x = ${q.x} + 2.2, z = ${q.z} + 0.4; P.caballo = { x, z, yaw: 0 }; H.jugador.ubicar(x, z, Math.atan2(-(${q.x} - x), -(${q.z} - z))); H.montar(); H.jugador.ubicar(x, z, Math.atan2(-(${q.x} - x), -(${q.z} - z))); return 1 })()`);
      await N('N.tick(1)');
      const a = await N('N.aviso()');
      const m0 = await N('!!H.jugador.estado.montado');
      await foto('montado-aviso');
      await N('N.E()'); await N('N.tick(1.2)');
      const m1 = await N('!!H.jugador.estado.montado'), esc = await N('!!(H.__escenas && H.__escenas.activa())');
      const vistas = await N('JSON.stringify(Object.keys(P.historia.escenas.vistas))');
      console.log(`  aviso «${a}» · montado ${m0} → ${m1} · escena ${esc} · vistas ${vistas}`);
      ver(m0 && (!m1 || esc), 'a caballo, la E en la puerta del galpón hace algo (te baja o arranca la escena)');
      for (let i = 0; i < 20 && (await N('!!(H.__escenas && H.__escenas.activa())')); i++) { await N('N.esc()'); await N('N.tick(0.5)'); }
      const a2 = await N('N.aviso()');
      console.log(`  después: aviso «${a2}»`);
      await foto('montado-despues');
    });

    // ------------------------------------------------ el mate durante el saludo
    await seccion('mate', async () => {
      await N('N.prep(3, {})');
      const plaza = await N('(() => { const s = H.__aldeaMundo().estadoEdificio("plaza").sitio; return { x: s.x, z: s.z } })()');
      await N(`(() => { H.jugador.ubicar(${plaza.x}, ${plaza.z} + 6, 0); return 1 })()`);
      for (let i = 0; i < 6; i++) { await N('(() => { H.__aldea.actualizar(2); return 1 })()'); await N('N.tick(0.6)'); await N('N.despejar()'); }
      console.log('  gente de la aldea:', await N('JSON.stringify({ todos: H.gente.gente.filter((g) => g.claveAldea).length, visibles: H.gente.gente.filter((g) => g.claveAldea && g.g.visible && !g.dormido).length, conMate: H.gente.gente.filter((g) => g.claveAldea && g.mate).length })'));
      const k = await N('(() => { const g = H.gente.gente.find((g) => g.mate && g.g.visible && !g.dormido && !g.enEscena && !g.conVos && g.claveAldea); if (g) g.mate.visible = true; return g ? g.claveAldea : null })()');
      ver(!!k, `hay un vecino con el mate en la mano (${k})`);
      if (!k) return;
      await N(`(() => { const g = N.quien(${JSON.stringify(k)}), j = H.jugador.estado.pos; N.poner(g, j.x, j.z - 2.2, 0); N.mirarA(j, g.pos); return 1 })()`);
      await N('N.tick(0.4)');
      // el saludo lo arranca pueblo-detalles (mirándolo de frente, cerca): la animación social «saludar»
      const vistos = [];
      for (let i = 0; i < 30; i++) { await N('N.tick(0.12)'); vistos.push(await N(`(() => { const g = N.quien(${JSON.stringify(k)}); return (g.animSocial ? 'A' : '-') + (g.mate.visible !== false ? 'M' : 'm') })()`)); if (i === 3) await foto('mate-saludo'); }
      console.log('  cuadros (A = saludando, M = mate a la vista):', vistos.join(' '));
      ver(vistos.some((v) => v[0] === 'A'), 'saludó (hubo animación social)');
      ver(!vistos.some((v) => v === 'AM'), 'mientras saluda, el mate queda guardado');
    });

    // ------------------------------------------------ leyendo un cartel, un vecino no te saluda encima
    await seccion('charla', async () => {
      await N('N.prep(3, {})');
      const r = await N(`(() => { const j = H.jugador.estado.pos; const l = H.gente.gente.filter((g) => g.claveAldea && g.g.visible && !g.dormido && !g.enEscena && !g.animSocial && Math.hypot(g.pos.x - j.x, g.pos.z - j.z) < 400); if (l.length < 2) return null; const g = l[0], g2 = l[1]; N.__g = g; N.__g2 = g2; N.poner(g, j.x, j.z - 3, 0); N.poner(g2, j.x + 1.8, j.z, -Math.PI / 2); N.mirarA(j, g2.pos); return g.claveAldea + ' y ' + g2.claveAldea })()`);
      await N('N.despejar()');
      ver(!!r, `dos para mirar (${r})`);
      if (!r) return;
      await N('N.tick(0.3)');
      // la charla abierta con el de al lado (H.hablar)
      await N('(() => { H.hablar(N.__g2); return 1 })()');
      const s0 = await N('H.__pueblo().info().saludos');
      await N(`(() => { const g = N.__g, j = H.jugador.estado.pos; N.mirarA(j, g.pos); return 1 })()`);
      await N('N.tick(1.5)');
      const s1 = await N('H.__pueblo().info().saludos');
      const abierta = await N('!document.getElementById("charla").classList.contains("oculto")');
      console.log(`  charla abierta ${abierta} · saludos ${s0} → ${s1}`);
      if (abierta) ver(s1 === s0, 'con la charla abierta, nadie te saluda encima');
      await foto('charla-cartel');
      for (let i = 0; i < 6; i++) { await N('N.E()'); await N('N.tick(0.2)'); }
    });

    // ------------------------------------------------ los que duermen (a las 3, adentro de una casa)
    await seccion('cama', async () => {
      await N('N.prep(3, {})');
      await N('(() => { P.horas = 3; for (let i = 0; i < 4; i++) H.__aldea.actualizar(2); return 1 })()');
      await N('N.tick(2)'); await N('N.despejar()');
      const occ = await N('JSON.stringify(H.__pueblo().info().ocupacion)');
      console.log('  ocupación a las 3:', occ.slice(0, 400));
      const casa = await N(`(() => { const o = H.__pueblo().info().ocupacion; const id = Object.keys(o).find((k) => o[k].dormidos > 0 && /^casa/.test(k)) || Object.keys(o).find((k) => o[k].dormidos > 0); return id || null })()`);
      ver(!!casa, `hay una casa con alguien durmiendo (${casa})`);
      if (!casa) return;
      const p = await N(`(() => { const e = H.__aldeaMundo().estadoEdificio(${JSON.stringify(casa)}); const pu = e.puertas[0], s = e.sitio; const ux = pu.x - s.x, uz = pu.z - s.z, l = Math.hypot(ux, uz) || 1; return { x: pu.x - ux / l * 1.4, z: pu.z - uz / l * 1.4, sx: s.x, sz: s.z } })()`);
      await N(`(() => { N.mirarA({ x: ${p.x}, z: ${p.z} }, { x: ${p.sx}, z: ${p.sz} }); H.jugador.estado.pitch = -0.15; return 1 })()`);
      const s0 = await N('H.__pueblo().info().saludos');
      await N('N.tick(2.5)');
      const quienes = await N(`(() => { const j = H.jugador.estado.pos; return JSON.stringify(H.gente.gente.filter((g) => g.claveAldea && g.g.visible && Math.hypot(g.pos.x - j.x, g.pos.z - j.z) < 8).map((g) => ({ k: g.claveAldea, pose: g.pose, dormido: !!g.dormido, rx: +g.g.rotation.x.toFixed(2), y: +(g.pos.y - H.T.altura(g.pos.x, g.pos.z)).toFixed(2) }))) })()`);
      console.log('  a la vista:', quienes);
      // mirarlo de frente, cerca
      await N(`(() => { const j = H.jugador.estado.pos; const g = H.gente.gente.find((g) => g.claveAldea && g.g.visible && Math.hypot(g.pos.x - j.x, g.pos.z - j.z) < 8); if (g) { const d = { x: g.pos.x + 1.6, z: g.pos.z + 0.5 }; N.mirarA(d, g.pos); H.jugador.estado.pitch = -0.2; } return 1 })()`);
      await N('N.tick(2)');
      const s1 = await N('H.__pueblo().info().saludos');
      console.log(`  saludos ${s0} → ${s1} · último «${await N('H.__pueblo().info().ultimoSaludo || ""')}»`);
      await foto('cama-adentro');
      ver(s1 === s0, 'a las 3, el que está en la cama no te saluda');
      // 4.31.1 (A): acostados en su cama (no parados al lado): mirarlos desde adentro de cada casa
      for (const id of ['casa-nelida', 'casa-familia', 'casa-abuela', 'casa-jefe', 'panaderia', 'carpinteria', 'cantina']) {
        const r = JSON.parse(await N(`(() => { const e = H.__aldeaMundo().estadoEdificio(${JSON.stringify(id)}); if (!e || !e.puertas.length) return 'null'; const pu = e.puertas[0], s = e.sitio; const ux = pu.x - s.x, uz = pu.z - s.z, l = Math.hypot(ux, uz) || 1;
          H.jugador.ubicar(pu.x - ux / l * 1.2, pu.z - uz / l * 1.2, 0); return JSON.stringify({ x: pu.x, z: pu.z }) })()`));
        if (!r) { console.log('  sin', id); continue; }
        for (let i = 0; i < 4; i++) { await N('(() => { H.__aldea.actualizar(2); return 1 })()'); await N('N.tick(0.4)'); }
        const l = JSON.parse(await N(`(() => { const D = (k) => H.__aldea.mundo().destinoDe(k); return JSON.stringify(H.gente.gente.filter((g) => g.claveAldea && D && /^cama/.test(D(g.claveAldea)?.punto || '') && D(g.claveAldea)?.edificio === ${JSON.stringify(id)}).map((g) => ({ k: g.claveAldea, visible: g.g.visible && !g.dormido, pose: g.pose, rx: +g.g.rotation.x.toFixed(2), sobrePiso: +(g.pos.y - H.__aldeaMundo().puntosEdificio(${JSON.stringify(id)}).sitio.y).toFixed(2), x: +g.pos.x.toFixed(2), z: +g.pos.z.toFixed(2) }))) })()`));
        console.log(`  ${id}: ${JSON.stringify(l)}`);
        const vis = l.filter((q) => q.visible);
        if (!vis.length) continue;
        ver(vis.every((q) => q.pose === 'dormir' && Math.abs(q.rx) > 1.4), `${id}: los que duermen, acostados (${vis.map((q) => q.k).join(', ')})`);
        const q = vis[0];
        console.log('    datos:', await N(`(() => { const g = N.quien(${JSON.stringify(q.k)}); const c = H.__aldeaMundo().puntosEdificio(${JSON.stringify(id)}); return JSON.stringify({ pos: [+g.pos.x.toFixed(2), +g.pos.z.toFixed(2)], mira: +g.g.rotation.y.toFixed(2), lado: g.__lecho, cama: c.nombrados.cama, rot: c.sitio.rot }) })()`));
        await N(`(() => { const g = N.quien(${JSON.stringify(q.k)}); const m = g.g.rotation.y, fx = Math.sin(m), fz = Math.cos(m); const cm = H.__aldeaMundo().puntosEdificio(${JSON.stringify(id)}).nombrados[H.__aldea.mundo().destinoDe(g.claveAldea).punto] || g.__lecho; const centro = { x: g.pos.x - fx * 0.8, z: g.pos.z - fz * 0.8 }; const ux = cm.x - centro.x, uz = cm.z - centro.z, ul = Math.hypot(ux, uz) || 1; const de = { x: centro.x + ux / ul * 1.5, z: centro.z + uz / ul * 1.5 }; N.mirarA(de, centro); H.jugador.estado.pitch = -0.6; try { H.linterna && H.linterna.prender && H.linterna.prender(true); } catch (e) {} return 1 })()`);
        await N('N.tick(0.8)');
        await foto('cama-' + id);
      }
    });

    // ------------------------------------------------ «En la cabina» (capítulo 4): en la cabina de la trochita, parada, Elsa te enseña a manejar
    await seccion('cabina', async () => {
      await N('N.prep(3, { vistas: ["trochita-boleto", "estacion-llegada", "anden-graciela"] })');
      await N('(() => { P.horas = 11; const e = H.T.lugares.estacion; H.jugador.ubicar(e.x + 4, e.z + 4, 0); return 1 })()'); await N('N.tick(1)'); await N('N.despejar()');
      let esp = 0; for (; esp < 3 && !(await N('!!H.tren.parado() && !H.jugador.estado.enTren')); esp++) await N('N.tick(1)');
      console.log('  el tren paró en una parada a los', esp, 's');
      await N('(() => { H.__subirALaCabina(); return 1 })()');
      let id = null;
      for (let i = 0; i < 20 && !id; i++) { await N('N.tick(0.5)'); id = await N('(() => { const es = H.__escenas; if (!es || !es.activa()) return null; const d = es.director.datos && es.director.datos(); return (d && (d.id || d.escena)) || "activa" })()'); }
      console.log('  escena al subir a la cabina:', id, '· en el tren', await N('!!H.jugador.estado.enTren'), '· conduciendo', await N('!!H.tren.conduciendo()'), '· parado', await N('!!H.tren.parado()'));
      if (id) { await N('N.tick(1.2)'); await foto('cabina-1'); await N('(() => { document.dispatchEvent(new KeyboardEvent("keydown", { code: "Enter", key: "Enter", bubbles: true })); return 1 })()'); await N('N.tick(2.5)'); await foto('cabina-2'); await N('(() => { document.dispatchEvent(new KeyboardEvent("keydown", { code: "Enter", key: "Enter", bubbles: true })); return 1 })()'); await N('N.tick(2.5)'); await foto('cabina-3'); }
      await N('N.despejar()'); await N('N.tick(0.6)');
      const vistas = await N('JSON.stringify(Object.keys(P.historia.escenas.vistas))');
      ver(/cabina-elsa/.test(vistas), `«En la cabina» se vio (${vistas})`);
      await N('(() => { H.__subirALaCabina(); return 1 })()'); await N('N.tick(0.5)');
      ver(await N('!!H.jugador.estado.enTren && !!H.tren.conduciendo()'), 'después de la escena, la E siguiente te sube a la cabina');
      ver(!(await N('!!(H.__escenas && H.__escenas.activa())')), 'y no se repite la escena');
      await N('(() => { try { H.__bajarDeLaCabina(); } catch (e) {} return 1 })()');
    });

    // ------------------------------------------------ el arreo del capítulo 9: guardar a mitad de camino y volver a cargar
    await seccion('arreo', async () => {
      await N('(() => { if (H.jugador.estado.enTren) { try { H.tren.bajarDeCabina(H.jugador) || H.tren.bajar(H.jugador); } catch (e) {} if (H.jugador.estado.enTren) { H.tren.est.conduce = false; H.tren.est.subido = false; H.jugador.estado.enTren = false; } } return 1 })()');   // (la sección de la cabina te deja arriba)
      await N('N.prep(8, { decisiones: { majada: "a" }, vistas: ["ramon-cama"] })');
      const pu = await N('(() => { const p = H.__puntosHistoria(); const a = p.puesto, b = p.galpon; return a && b ? { ax: a.x, az: a.z, bx: b.x, bz: b.z } : null })()');
      ver(!!pu, 'el puesto y el galpón');
      if (!pu) return;
      await N(`(() => { H.jugador.ubicar(${pu.ax} + 5, ${pu.az} + 3, 0); P.horas = 11; return 1 })()`); await N('N.tick(2)'); await N('N.despejar()');
      ver(await N('!!H.__arreo().activo()'), 'el arreo está en marcha');
      // caminar hacia el galpón de a poco (las ovejas te siguen)
      for (let i = 0; i < 14; i++) { await N(`(() => { const j = H.jugador.estado.pos, dx = ${pu.bx} - j.x, dz = ${pu.bz} - j.z, d = Math.hypot(dx, dz) || 1; H.jugador.ubicar(j.x + dx / d * 2.2, j.z + dz / d * 2.2, Math.atan2(-dx, -dz)); return 1 })()`); await N('N.tick(0.9)'); await N('N.despejar()'); if (i % 5 === 0) console.log('    oveja', await N('JSON.stringify({ o: H.__arreo().estado && H.__arreo().estado.ovejas[0], j: [H.jugador.estado.pos.x, H.jugador.estado.pos.z], clave: H.__arreo().clave, lleg: H.__arreo().estado && H.__arreo().estado.llegado })')); if (i % 5 === 0) console.log('    paso', i, 'modo', await N('String(typeof H.modoJuego === "function" ? H.modoJuego() : H.modoJuego)'), 'tarjeta', await N('N.tarjeta()'), 'escena', await N('!!(H.__escenas && H.__escenas.activa())')); }
      const antes = JSON.parse(await N('JSON.stringify(H.__arreo().estado.ovejas.map((o) => ({ x: +o.x.toFixed(1), z: +o.z.toFixed(1) })))'));
      const dCorral = (l) => l.reduce((s, o) => s + Math.hypot(o.x - (pu.ax + 5), o.z - (pu.az + 3)), 0) / Math.max(1, l.length);
      console.log('  ovejas a', dCorral(antes).toFixed(1), 'm del corral antes de guardar');
      await N('N.tick(2.5)'); await N('(() => { H.guardar(); return 1 })()'); await N('N.tick(0.5)');
      await w.loadFile(url, { search: '?debug=1' });
      await js('window.__sinPausaPorBlur = true; 1');
      if (!(await esperarJuego())) throw new Error('no volvió a cargar');
      await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000);
      await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
      await N('N.tick(2)'); await N('N.despejar()'); await N('N.tick(1)');
      const desp = JSON.parse(await N('JSON.stringify(H.__arreo().activo() ? H.__arreo().estado.ovejas.map((o) => ({ x: +o.x.toFixed(1), z: +o.z.toFixed(1) })) : [])'));
      console.log('  después de cargar: ovejas a', dCorral(desp).toFixed(1), 'm del corral');
      ver(desp.length > 0 && dCorral(desp) > dCorral(antes) * 0.6 && dCorral(antes) > 10, 'cargada la partida, las ovejas siguen donde iban (no vuelven al corral)');
      await N('(() => { const j = H.jugador.estado.pos, o = H.__arreo().estado.ovejas[0]; if (o) { const d = { x: o.x + 5, z: o.z + 5 }; N.mirarA(d, o); H.jugador.estado.pitch = -0.3; } return 1 })()'); await N('N.tick(0.8)'); await foto('arreo-cargado');
    });

    // ------------------------------------------------ el escalón del mástil y el lugar de las fiestas de la plaza (puntos en el mundo)
    await seccion('escalon', async () => {
      const r = await N('(() => { const pe = H.__aldeaMundo().puntosEdificio("plaza"); const N0 = pe.nombrados; const esc = Object.entries(N0).filter(([k]) => /^asiento-/.test(k)).slice(-2).map(([k, q]) => ({ k, x: +q.x.toFixed(2), z: +q.z.toFixed(2) })); return JSON.stringify({ sitio: { x: pe.sitio.x, z: pe.sitio.z, rot: pe.sitio.rot }, mastil: N0.mastil && { x: +N0.mastil.x.toFixed(2), z: +N0.mastil.z.toFixed(2) }, duende: N0.duende && { x: +N0.duende.x.toFixed(2), z: +N0.duende.z.toFixed(2) }, escalon: esc }) })()');
      console.log('  plaza:', r);
      const q = JSON.parse(r);
      // la gente de la fiesta en su lugar (en ronda de 0,55 m, como la reparte aldea-gente.js) y vos en el escalón
      await N(`(() => { const pe = H.__aldeaMundo().puntosEdificio('plaza'), s = pe.sitio, fx = Math.sin(s.rot), fz = Math.cos(s.rot); const c = { x: s.x + fx * ${FIESTA_Z}, z: s.z + fz * ${FIESTA_Z} }; const l = H.gente.gente.filter((g) => g.claveAldea && g.g.visible && !g.dormido && !g.enEscena).slice(0, 6); l.forEach((g, i) => { const a = i / l.length * 6.28; N.poner(g, c.x + Math.cos(a) * 0.55, c.z + Math.sin(a) * 0.55, Math.atan2(fx, fz)); }); const e = pe.nombrados['asiento-13']; const de = { x: c.x - fx * 4.5 + fz * 2.5, z: c.z - fz * 4.5 - fx * 2.5 }; N.mirarA(de, { x: (c.x + e.x) / 2, z: (c.z + e.z) / 2 }); H.jugador.estado.pitch = -0.15; return JSON.stringify({ fiesta: c, aEscalon: +Math.hypot(c.x - e.x, c.z - e.z).toFixed(2), aTronco: +Math.hypot(c.x - s.x, c.z - s.z).toFixed(2) }) })()`).then((x) => console.log('  fiesta:', x));
      await N('N.tick(0.8)'); await foto('escalon-fiesta');
    });
    // ------------------------------------------------ Graciela: en el capítulo 4 (el ramal) está en la estación; fuera de él, no
    await seccion('graciela', async () => {
      const est = await N('(() => { const e = H.T.lugares.estacion; return e ? { x: e.x, z: e.z } : null })()');
      for (const [cap, debe] of [[3, true], [4, false], [6, false]]) {
        await N(`N.prep(${cap}, { vistas: ["trochita-boleto", "estacion-llegada", "anden-graciela"] })`);
        await N(`(() => { H.jugador.ubicar(${est.x} + 6, ${est.z} + 6, 0); return 1 })()`);
        await N('N.tick(3)'); await N('N.despejar()');
        const g = await N(`(() => { const l = H.gente.gente.filter((g) => (g.clave === 'graciela' || g.claveHistoria === 'graciela' || /graciela/i.test(g.nombre || '')) && g.g.visible && !g.dormido); return JSON.stringify(l.map((g) => ({ n: g.nombre, x: +g.pos.x.toFixed(1), z: +g.pos.z.toFixed(1), suelo: +(g.pos.y - H.T.altura(g.pos.x, g.pos.z)).toFixed(2) }))) })()`);
        const l = JSON.parse(g);
        console.log(`  capítulo ${cap + 1}: Graciela ${g}`);
        ver(debe ? l.length >= 1 : l.length === 0, `capítulo ${cap + 1}: ${debe ? 'está' : 'no está'} (${l.length})`);
        if (debe && l[0]) { await N(`(() => { const g = H.gente.gente.find((g) => /graciela/i.test(g.nombre || '') && g.g.visible); const d = { x: g.pos.x + 2.4, z: g.pos.z + 1.2 }; N.mirarA(d, g.pos); H.jugador.estado.pitch = -0.08; return 1 })()`); await N('N.tick(0.8)'); await foto('graciela-cap4'); }
      }
    });

    // ------------------------------------------------ el Desafío: Anselmo con el martillo y Josefina con el arco
    await seccion('desafio', async () => {
      const H = 'window.__hojarasca';
      await js(`(() => { const H = ${H}; H.progreso.desafio.tutorial = 99; return 1 })()`);
      const sim = (seg) => js(`(()=>{const H=${H}; for(let i=0;i<${Math.round(seg / 0.05)};i++){ H.desafio.actualizar(0.05,{noche:1, dtReal:0.05}); H.gente.actualizar(0.05, H.jugador.estado, H.camara, null, 0); } return 1})()`);
      await js(`(()=>{ const H=${H}, D=H.progreso.desafio; D.oleadas = 11; D.especial = null; D.ordenes = {}; D.puestosAliados = {}; Object.assign(D.aldea.ayuda, { anselmo: 1, herminia: 1, martin: 1, chicos: 1 }); H.progreso.dia = 12; H.progreso.horas = 19.7; D.oleadaNoche = null; D.oleadaTerminada = true; return 1 })()`);
      let presentes = [];
      for (let k = 0; k < 60 && presentes.length < 4; k++) { await sim(0.5); presentes = JSON.parse(await js(`JSON.stringify(${H}.desafio.vecinos.presentes())`)); }
      ver(presentes.includes('anselmo'), `vino Anselmo (${presentes.join(', ')})`);
      // Josefina de compañera
      const suma = await js(`(()=>{ const H=${H}; try { return JSON.stringify(H.desafio.aliados && H.desafio.aliados.sumar ? H.desafio.aliados.sumar('ema') : 'sin') } catch (e) { return 'error ' + e.message } })()`);
      console.log('  sumar a Josefina:', suma);
      await sim(2);
      const busca = (clave) => `H.gente.gente.find(q => q.claveAliado === ${JSON.stringify(clave)} || (${JSON.stringify(clave)} === 'ema' && q.enBase && /Josefina/.test(q.nombre || '')))`;
      // la cámara fija (como en humo-4-9-aliados): se pone después de cada cuadro del Desafío
      await js(`(() => { const H = ${H}, D = H.desafio; if (D.__envuelto) return 1; const orig = D.actualizar; D.__envuelto = true;
        D.actualizar = function (dt, c) { const r = orig.call(this, dt, c); const k = window.__cam; if (k) { const cam = H.camara; cam.position.set(k.o[0], k.o[1], k.o[2]); cam.lookAt(k.a[0], k.a[1], k.a[2]); cam.updateMatrixWorld(true); for (const h of cam.children) h.visible = false; } return r; };
        const s = document.createElement('style'); s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; document.head.appendChild(s); return 1 })()`);
      const camA = async (clave, nombre, quietud) => {
        const p = JSON.parse(await js(`(()=>{ const H=${H}, g = ${busca(clave)}; if (!g) return 'null'; g.__quietud = ${quietud ? JSON.stringify(quietud) : 'undefined'}; return JSON.stringify({ x: g.pos.x, y: g.pos.y, z: g.pos.z }) })()`));
        if (!p) { console.log('  sin', clave); return null; }
        await sim(1.5);
        await js(`(()=>{ const H=${H}, g = ${busca(clave)}; const r = g.g.rotation.y; window.__cam = { o: [g.pos.x + Math.sin(r) * 2.4 + Math.cos(r) * 0.9, g.pos.y + 1.45, g.pos.z + Math.cos(r) * 2.4 - Math.sin(r) * 0.9], a: [g.pos.x, g.pos.y + 1.0, g.pos.z] }; for (let i = 0; i < 6; i++) H.__bucle(); return 1 })()`);
        await foto(nombre);
        await js('window.__cam = null; 1');
        return p;
      };
      await camA('anselmo', 'desafio-anselmo-cruzados', 'cruzados');
      await camA('anselmo', 'desafio-anselmo-cintura', 'cintura');
      // el golpe del martillo: una empalizada rota al lado de Anselmo; cuántos cuadros se ve el brazo arriba
      const obra = await js(`(()=>{ const H=${H}, O = H.obras, P = H.progreso, g = ${busca('anselmo')}; if (!g) return 'sin anselmo'; Object.assign(P.materiales, { tronco: 400, tabla: 400, piedra: 400 });
        const p = H.PLANOS.find(q => q.id === 'empalizada'); if (!p) return 'sin plano';
        for (const r of [2, 3, 4]) for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, x = g.pos.x + Math.cos(a) * r, z = g.pos.z + Math.sin(a) * r; O.elegir(p); const f = O.fundar(x, z, a, H.T.altura(x, z)); if (!f.ok) continue;
          for (let e = 0; e < 12 && f.obra.datos.etapas < f.obra.plano.etapas.length; e++) { const q = O.avanzar(f.obra, P.materiales); if (!q.ok) break; }
          O.elegir(null); P.obras = O.obras.map(o => o.datos); window.__obra = f.obra; return 'ok ' + x.toFixed(1) + ',' + z.toFixed(1); }
        O.elegir(null); return 'sin lugar' })()`);
      console.log('  obra:', obra);
      const golpe = await js(`(()=>{ const H=${H}, g = ${busca('anselmo')}, o = window.__obra; if (!g || !o) return 'null'; g.__quietud = undefined; H.desafio.defensas?.refrescar?.(); let arriba = 0, max = 0; const muestras = [];
        for (let i = 0; i < 400; i++) { o.datos.vida = Math.min(Number.isFinite(o.datos.vida) ? o.datos.vida : 5, 5); H.gente.actualizar(0.016, H.jugador.estado, H.camara, null, 0); H.desafio.actualizar(0.016, { noche: 1, dtReal: 0.016 }); const x = g.brazos[1].rotation.x; if (x < -1.0) arriba++; max = Math.min(max, x); if (i % 20 === 0) muestras.push(+x.toFixed(2)); }
        return JSON.stringify({ arriba, max: +max.toFixed(2), muestras, dist: +Math.hypot(g.pos.x - o.datos.x, g.pos.z - o.datos.z).toFixed(1) }) })()`);
      console.log('  golpe del martillo (cuadros con el brazo arriba, de 400):', golpe);
      await camA('ema', 'desafio-josefina-cruzados', 'cruzados');
      await camA('ema', 'desafio-josefina-cintura', 'cintura');
    });
  } catch (err) {
    console.log('ERROR:', err && err.stack || err);
    errores.push(String(err && err.message || err));
  }
  console.log(`\nerrores de consola: ${errores.length}`);
  for (const e of errores.slice(0, 20)) console.log('  ' + e);
  app.exit(0);
});

// Partida real 4.13.0 (agente B, Electron + WebGL): la noche de defensa de la Historia y sus dos finales.
//   1. Historia en el capítulo 8 con la elección PELEA: el cierre del capítulo ofrece la noche (tarjeta con el misterio, sin decir si
//      vienen a jugar o a pelear), se sale, se arma el portón con las antorchas, el reloj pasa a la noche y aparece el panel de la noche;
//   2. de verdad se juega: apuntando con la cámara y tirando con el arco y con la honda (el mismo camino que el mouse) se les pega a los
//      duendes; vienen por el lado de ataque, pegan (pelea) y caen;
//   3. perder: sin hacer nada la noche se pierde y no cuesta nada (el reloj, el día, los materiales, las obras y los pesos quedan como
//      estaban); la tarjeta deja reintentar y reintentar funciona (las veces que haga falta);
//   4. ganar: se juega la noche hasta el final con un tirador que apunta por la cámara; sale el final de la PELEA y «Seguir» cierra la
//      historia y cobra el premio una sola vez;
//   5. lo mismo con la elección TRATO: otra noche (la prueba: nadie lastima a nadie) y otro final;
//   6. ningún programa de shader nuevo desde que se anuncia la noche (el compilado es de la carga o de bajo la tarjeta) ni durante la
//      noche, y los dibujos por cuadro con la noche en marcha; sin errores de consola ni de shader;
//   7. el Relax libre no cambia: sin Historia, la noche no existe;
//   8. capturas (con -Visible, en HUMO_SALIDA): la tarjeta, el combate, el panel, la victoria, la derrota y los dos finales.
// Uso (desde la carpeta del proyecto, después de `node armar.mjs`), siempre en el monitor externo y con perfil propio:
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-13-0-historia-b.cjs -Espera 900 -Perfil <carpeta propia> [-Visible]
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'historia-b-4-13-0'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 14 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 14 * 60 * 1000).unref?.();
const CAPTURAS = process.env.HUMO_CAPTURAS !== '0';

// lo que corre dentro de la página
const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, T = H.T, J = H.jugador, P = H.progreso;
  const N = window.__N = {};
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  N.dormir = dormir;
  H.ajustes.limiteFps = 'libre';
  N.cuadros = async (n = 3, ms = 10) => { for (let i = 0; i < n; i++) { H.__bucle(); await dormir(ms); } return 1; };
  N.programas = () => H.renderer.info.programs.length;
  N.nombresProgramas = () => H.renderer.info.programs.map((p) => p.name + '|' + (p.cacheKey || ''));
  N.mundo = () => H.__noche();
  N.valle = () => H.__valle;
  N.tarjeta = () => { const t = document.getElementById('valle-tarjeta'); return { abierta: !t.classList.contains('oculto') && H.__valle.abierta(), texto: t.textContent, botones: [...t.querySelectorAll('button')].map((b) => ({ id: b.dataset.valleOpcion, texto: b.textContent })) }; };
  N.elegir = (id) => { const b = document.querySelector('#valle-tarjeta button[data-valle-opcion="' + id + '"]'); if (!b) return false; b.click(); return true; };
  // la historia en el capítulo 8, terminado (fase outro), con la elección y las armas del paso 2
  N.capitulo8 = (eleccion, armas = { arco: true, honda: true }) => {
    const h = P.historia = P.historia || {};
    Object.assign(h, { activa: true, capitulo: 7, fase: 'outro', empezada: 1, terminada: 0 });
    h.duendes = { trato: eleccion, vistos: 3, regalos: 0, armas, noche: 'pendiente', final: null, intentos: 0 };   // (el esquema del paso 2)
    h.noche = { estado: 'pendiente', intentos: 0, modo: '', horasAntes: null };
    h.cerrados = h.cerrados || {};
    P.horas = 11; P.dia = 20;
    return 1;
  };
  // la tarjeta del capítulo 1 sale sola al empezar una historia nueva: se cierra para dejar el valle libre
  N.cerrarTarjetas = () => { let n = 0; while (H.__valle.abierta() && n++ < 5) { const b = document.querySelector('#valle-tarjeta button'); if (!b) break; b.click(); } return n; };
  N.economia = () => JSON.stringify({ dia: P.dia, horas: P.horas, mat: P.materiales || {}, acopio: P.acopio || {}, obras: (P.obras || []).length, eco: P.economia || null });
  N.camaraA = (x, y, z) => { const j = J.estado, c = H.camara; c.position.set(j.pos.x, j.pos.y + j.alturaOjos, j.pos.z); c.lookAt(x, y, z); c.updateMatrixWorld(true); j.yaw = Math.atan2(-(x - c.position.x), -(z - c.position.z)); j.pitch = Math.atan2(y - c.position.y, Math.hypot(x - c.position.x, z - c.position.z)); };
  N.vivos = () => N.mundo().sim.duendes.filter((d) => d.estado === 'avanza' || d.estado === 'ataca');
  N.estado = () => {
    const m = N.mundo(), s = m && m.sim;
    if (!s) return null;
    return { t: +s.t.toFixed(1), fin: s.fin, vida: Math.round(s.jugador.vida), puerta: Math.round(s.puerta), travesuras: s.travesuras, flechas: s.flechas, duendes: N.vivos().length, bajas: s.bajas, nacidos: s.nacidos, total: s.total, aciertos: m.cuenta.aciertos, disparos: m.cuenta.disparos };
  };
  // un tiro por la cámara, como el del mouse: apunta al duende más cercano (con la caída de la flecha y adelantándose a su marcha)
  N.tirar = (ruidoGrados = 0, arma = null) => {
    const m = N.mundo(), s = m.sim, j = J.estado;
    if (!s || s.fin || s.recarga > 0) return false;
    let b = null, bd = 1e9;
    for (const d of N.vivos()) { const dd = Math.hypot(d.x - j.pos.x, d.z - j.pos.z); if (dd < bd && dd < 38) { bd = dd; b = d; } }
    if (!b) return false;
    const a = arma || (s.flechas > 0 ? 'arco' : 'honda');
    const v = a === 'arco' ? 48 * 1.35 : 36, tt = bd / v, sube = 1.2;
    const vx = b.velocidad > 0 ? Math.sin(b.rumbo) * b.velocidad : 0, vz = b.velocidad > 0 ? Math.cos(b.rumbo) * b.velocidad : 0;
    const r = ruidoGrados * Math.PI / 180, g = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2;
    N.camaraA(b.x + vx * tt + g() * r * bd, b.y + b.def.altura * 0.55 + 0.5 * 9.8 * tt * tt - sube * tt + g() * r * bd, b.z + vz * tt + g() * r * bd);
    return m.disparar(a, 1.1).ok === true;
  };
  // jugar n segundos de la noche, de a 0,05 s (con el tirador o sin hacer nada); corta si terminó
  N.jugar = (seg, tirador = true, ruido = 2) => {
    const m = N.mundo();
    for (let i = 0; i < seg / 0.05; i++) {
      if (!m.activa()) break;
      if (tirador) N.tirar(ruido);
      m.actualizar(0.05);
    }
    return N.estado();
  };
  // los dibujos por cuadro (con la escena como está)
  N.dibujos = async () => { for (let i = 0; i < 6; i++) { H.__bucle(); await dormir(8); } const R = H.renderer; R.info.autoReset = false; R.info.reset(); H.__bucle(); const r = { llamadas: R.info.render.calls, tris: R.info.render.triangles }; R.info.autoReset = true; return r; };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [], consola = [];
  const w = new BrowserWindow({ show: true, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { consola.push(m.slice(0, 300)); errores.push(m.slice(0, 300)); }
  });
  let donde = 'carga';
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 120 s (${donde})`)), 120000))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const N = (c) => js(`(async () => { const H = window.__hojarasca, N = window.__N, P = H.progreso; return (${c}); })()`);
  const url = process.env.HTML ? path.resolve(process.env.HTML) : path.join(raiz, 'index.html');
  const ajustes = (tipo) => `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'relax', relaxTipo:'${tipo}', autoCalidad:false, guiaPrimerDia:false, idioma:'es', limiteFps:'libre'}));`;
  const abrir = async (tipo) => {
    await w.loadFile(url, { search: process.env.HUMO_BUSQUEDA || '?debug=1' });
    await js(ajustes(tipo)); await w.loadFile(url, { search: process.env.HUMO_BUSQUEDA || '?debug=1' });
    let listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false); }
    if (!listo) throw new Error('el juego no cargó');
  };
  const foto = async (nombre) => {
    if (!CAPTURAS) return;
    await js('window.__N && window.__N.cuadros(3, 30)'); await esperar(500);
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salida, nombre + '.png'), img.toPNG());
    console.log(`  (captura ${nombre}.png)`);
  };
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(PAGINA);
    await N('N.cuadros(30)');
  };
  try {
    // ================================================================ Historia: la noche
    donde = 'carga';
    await abrir('historia');
    const progsCarga = await js('window.__hojarasca.renderer.info.programs.length');
    await entrar();
    for (let i = 0; i < 4; i++) { await N('N.valle().revisarAhora()'); await N('N.cerrarTarjetas()'); await N('N.cuadros(10)'); }
    const antes = JSON.parse(await N('N.economia()'));

    // lo que compila el propio valle al llegar de noche al refugio (sin la Historia): la vara para medir lo de la noche
    donde = 'base';
    const nombres0 = new Set(await N('N.nombresProgramas()'));
    await N(`(() => { const R = H.renderer; window.__culpables = []; const orig = R.renderBufferDirect.bind(R); R.renderBufferDirect = function (camera, scene, geometry, material, object, group) { const n = R.info.programs.length; const r = orig(camera, scene, geometry, material, object, group); if (R.info.programs.length > n) { let p = object, ruta = []; while (p && ruta.length < 6) { ruta.push((p.name || p.type) + (p.isInstancedMesh ? '[inst]' : '')); p = p.parent; } window.__culpables.push({ material: material.type + ':' + (material.name || ''), esDepth: !!material.isMeshDepthMaterial, ruta: ruta.join(' < ') }); } return r; }; return 1 })()`);
    await N(`(() => { const r = H.T.lugares.refugio, p = r.puerta || r; const j = H.jugador.estado; H.jugador.ubicar(p.x + 3, p.z + 3, 0); P.horas = 22.2; return 1 })()`);
    await N('N.cuadros(90, 8)');
    const progsBase = await N('N.programas()');
    const nuevosBase = (await N('N.nombresProgramas()')).filter((x) => !nombres0.has(x));
    console.log('  culpables:', JSON.stringify(await N('window.__culpables')));
    console.log(`  el valle solo, de noche en el refugio: ${progsCarga} → ${progsBase} programas (${nuevosBase.length} nuevos: ${JSON.stringify(nuevosBase.map((x) => x.slice(0, 40)))})`);

    // ---------------------------------------------------------------- 1. el capítulo 8 ofrece la noche (elección: pelea)
    donde = 'oferta';
    await N('N.cerrarTarjetas()');
    await N(`N.capitulo8('pelea')`);
    await N('N.valle().revisarAhora()');
    let t = await N('N.tarjeta()');
    if (!t.abierta || !/Lo que vino de noche/.test(t.texto)) console.log('  diagnóstico:', t.texto.slice(0, 300), '|', JSON.stringify(await N(`({ modo: H.__caidas && H.__caidas.modo && H.__caidas.modo(), fundido: document.getElementById('fundido') && document.getElementById('fundido').className, h: P.historia, tarj: N.valle().abierta(), ei: N.valle().noche.interviene(P.historia), esp: N.valle().noche.espera, js: { sentado: H.jugador.estado.sentado, montado: !!H.jugador.estado.montado, tren: H.jugador.estado.enTren } })`)));
    ok(t.abierta && /Lo que vino de noche/.test(t.texto), 'el cierre del capítulo 8 ofrece la noche con su tarjeta');
    ok(!/\b(trato|pelea)\b/i.test(t.texto), 'la tarjeta no dice si los duendes son amigos o enemigos (el misterio sigue hasta el portón)');
    ok(!/La historia termina acá/.test(t.texto), 'y todavía no cierra la historia');
    ok(t.botones.length === 2 && t.botones[0].id === 'salir' && t.botones[1].id === 'despues', 'dos opciones: salir a esperarlos o todavía no');
    const progsTarjeta = await N('N.programas()');
    const nombresTarjeta = new Set(await N('N.nombresProgramas()'));
    ok(progsTarjeta === progsBase, `anunciar la noche no compila programas de shader nuevos (${progsBase} → ${progsTarjeta})`);
    await foto('01-tarjeta-noche');
    // «todavía no»: el valle sigue libre un rato y la tarjeta no vuelve enseguida
    await N(`N.elegir('despues')`);
    await N('N.cuadros(5)');
    await N('N.valle().revisarAhora()');
    t = await N('N.tarjeta()');
    ok(!t.abierta, '«Todavía no» deja el valle libre (la tarjeta no vuelve enseguida)');
    await N('N.valle().noche.esperar(0)');
    await N('N.valle().revisarAhora()');
    t = await N('N.tarjeta()');
    ok(t.abierta && t.botones[0].id === 'salir', 'y cuando pasa el rato, la noche se ofrece de nuevo');
    await N(`N.elegir('salir')`);
    await N('N.cuadros(20)');
    let e = await N('N.estado()');
    ok(e && e.fin === null && e.total === 22, `la noche de la PELEA empezó (${e && e.total} duendes en el guion)`);
    const ini = await N(`(() => { const m = N.mundo(), j = H.jugador.estado, r = H.T.lugares.refugio, p = r.puerta || r; return { activa: m.activa(), horas: P.horas, dist: Math.hypot(j.pos.x - p.x, j.pos.z - p.z), hud: !document.getElementById('historia-noche-hud').classList.contains('oculto'), panel: !document.getElementById('historia-hud').classList.contains('oculto'), n: P.historia.noche } })()`);
    ok(ini.activa && ini.horas >= 22, `el reloj pasó a la noche (${ini.horas.toFixed(2)} h)`);
    ok(ini.dist < 12, `y estás en el refugio, junto al portón (${ini.dist.toFixed(1)} m de la puerta)`);
    ok(ini.hud && !ini.panel, 'el panel de la noche reemplaza al de los objetivos');
    ok(ini.n.intentos === 1 && Math.abs(ini.n.horasAntes - 11) < 0.1 && ini.n.modo === 'pelea', `se anotó el intento, el modo y la hora de antes (${JSON.stringify(ini.n)})`);
    const progsNoche0 = await N('N.programas()');
    { const barras = await N(`[...document.querySelectorAll('#historia-noche-hud .nh-barra')].map((b) => { const r = b.getBoundingClientRect(), i = b.querySelector('i').getBoundingClientRect(), c = getComputedStyle(b); return { w: Math.round(r.width), h: Math.round(r.height), iw: Math.round(i.width), fondo: c.backgroundColor, disp: c.display } })`); console.log('  barras del panel:', JSON.stringify(barras)); ok(barras.length === 2 && barras.every((b) => b.w > 40 && b.h >= 6 && b.iw > 30), 'el panel muestra las barras de vida y de puerta con su ancho'); }
    ok(progsNoche0 <= progsBase, `la noche no compila nada que el valle de noche no compile ya (${progsBase} → ${progsNoche0})`);
    if (progsNoche0 !== progsTarjeta) console.log('  programas que aparecieron al empezar la noche:', JSON.stringify((await N('N.nombresProgramas()')).filter((x) => !nombresTarjeta.has(x)).map((x) => x.slice(0, 160))));

    // ---------------------------------------------------------------- 2. se juega de verdad
    donde = 'jugar';
    await foto('02-noche-empieza');
    // los duendes vienen por UN solo lado: todos nacen del mismo costado, lejos del refugio, dentro del abanico
    await N('N.jugar(14, false)');
    const lado = await N(`(() => { const s = N.mundo().sim, d = s.dis, ang0 = Math.atan2(d.uz, d.ux); const r = s.duendes.map((q) => { const a = Math.atan2(q.z - d.centro.z, q.x - d.centro.x); return Math.abs(Math.atan2(Math.sin(a - ang0), Math.cos(a - ang0))); }); return { n: r.length, peor: Math.max(...r) } })()`);
    ok(lado.n >= 3 && lado.peor < 1.2, `los duendes vienen por un solo lado (${lado.n} vistos, el más torcido a ${lado.peor.toFixed(2)} rad del rumbo)`);
    // un tiro real con el arco y uno con la honda: se les pega
    const r1 = await N(`(() => { const m = N.mundo(); const a0 = m.cuenta.aciertos; let tiros = 0; for (let i = 0; i < 200 && m.cuenta.aciertos === a0; i++) { if (N.tirar(0, 'arco')) tiros++; m.actualizar(0.05); } return { aciertos: m.cuenta.aciertos - a0, tiros } })()`);
    ok(r1.aciertos >= 1, `un flechazo apuntando con la cámara le pega a un duende (${r1.tiros} tiros)`);
    const r2 = await N(`(() => { const m = N.mundo(); const a0 = m.cuenta.aciertos; let tiros = 0; for (let i = 0; i < 300 && m.cuenta.aciertos === a0; i++) { if (N.tirar(0, 'honda')) tiros++; m.actualizar(0.05); } return { aciertos: m.cuenta.aciertos - a0, tiros, vivos: N.vivos().length } })()`);
    ok(r2.aciertos >= 1, `y una pedrada con la honda también (${r2.tiros} tiros)`);
    // el mouse de verdad: el clic izquierdo tira con el arma en la mano y el derecho cambia de arma
    const mouse = await N(`(async () => { const m = N.mundo(), s = m.sim; const f0 = s.flechas, d0 = m.cuenta.disparos; s.recarga = 0;
      const ev = (tipo, b) => window.dispatchEvent(new MouseEvent(tipo, { button: b, bubbles: true, cancelable: true }));
      const bloq = H.jugador.bloqueado; H.jugador.bloqueado = () => true;
      m.elegirArma('honda'); ev('mousedown', 0); await N.dormir(30); ev('mouseup', 0); const honda = m.cuenta.disparos - d0; s.recarga = 0;
      m.elegirArma('arco'); ev('mousedown', 0); await N.dormir(450); ev('mouseup', 0); const arco = m.cuenta.disparos - d0 - honda;
      ev('mousedown', 2); const cambio = m.estadoMano.arma; ev('mouseup', 2);
      H.jugador.bloqueado = bloq; m.elegirArma('arco');
      return { honda, arco, cambio, flechas: f0 - s.flechas } })()`);
    ok(mouse.honda === 1 && mouse.arco === 1 && mouse.flechas === 1, `el clic de verdad tira (honda ${mouse.honda}, arco ${mouse.arco} al soltar, ${mouse.flechas} flecha gastada)`);
    ok(mouse.cambio === 'honda', 'el clic derecho cambia de arma (arco ↔ honda)');
    // vista del combate: se espera a que haya duendes cerca del portón y se los mira
    await N(`(() => { const m = N.mundo(), j = H.jugador.estado.pos; for (let i = 0; i < 1500; i++) { m.actualizar(0.05); if (!m.activa()) break; if (N.vivos().filter((d) => Math.hypot(d.x - j.x, d.z - j.z) < 9).length >= 2) break; } return 1 })()`);
    await N(`(() => { const j = H.jugador.estado.pos; const v = N.vivos().sort((a, b) => Math.hypot(a.x - j.x, a.z - j.z) - Math.hypot(b.x - j.x, b.z - j.z))[0]; if (v) N.camaraA(v.x, v.y + 0.5, v.z); return 1 })()`);
    await foto('03-combate');
    e = await N('N.estado()');
    console.log('  estado:', JSON.stringify(e));
    const dib = await N('N.dibujos()');
    // lo que cuesta la noche: el mismo cuadro, con lo suyo escondido (las estacas, las antorchas, los duendes)
    const sin = await N(`(async () => { const g = H.escena.getObjectByName('historia-noche'), d = H.escena.getObjectByName('duendes'); g.visible = false; d.visible = false; const r = await N.dibujos(); g.visible = true; d.visible = true; return r })()`);
    console.log(`  dibujos por cuadro con la noche en marcha: ${dib.llamadas} llamadas y ${dib.tris} triángulos; el mismo cuadro sin lo de la noche: ${sin.llamadas} y ${sin.tris} → la noche suma ${dib.llamadas - sin.llamadas} llamadas y ${dib.tris - sin.tris} triángulos`);
    ok(dib.llamadas - sin.llamadas <= 30, `la noche suma pocas llamadas de dibujo (${dib.llamadas - sin.llamadas})`);

    // ---------------------------------------------------------------- 3. perder: sin hacer nada
    donde = 'perder';
    await N('N.jugar(200, false)');
    t = await N('N.tarjeta()');
    ok(t.abierta && /La noche se te escapó/.test(t.texto), 'sin defender, la noche se pierde y sale la tarjeta de «La noche se te escapó»');
    ok(t.botones.length === 2 && t.botones[0].id === 'otra', 'que deja intentarlo de nuevo');
    await foto('04-derrota');
    const trasPerder = await N(`({ eco: JSON.parse(N.economia()), n: P.historia.noche, fase: P.historia.fase, cap: P.historia.capitulo, activa: N.mundo().activa() })`);
    ok(trasPerder.n.estado === 'perdida' && trasPerder.n.intentos === 1 && trasPerder.n.horasAntes === null && !trasPerder.activa, `quedó anotada como perdida, un intento (${JSON.stringify(trasPerder.n)})`);
    ok(trasPerder.fase === 'outro' && trasPerder.cap === 7, 'y el capítulo sigue donde estaba (la historia no avanzó ni se perdió)');
    ok(JSON.stringify(trasPerder.eco.mat) === JSON.stringify(antes.mat) && trasPerder.eco.obras === antes.obras && JSON.stringify(trasPerder.eco.eco) === JSON.stringify(antes.eco) && JSON.stringify(trasPerder.eco.acopio) === JSON.stringify(antes.acopio) && trasPerder.eco.dia === 20 && Math.abs(trasPerder.eco.horas - 11) < 0.1,
      'perder no cuesta nada: el reloj vuelve a las 11, el día es el mismo y los materiales, las obras y los pesos no cambiaron');
    // reintentar: sale otra noche, otro intento
    await N(`N.elegir('otra')`);
    await N('N.cuadros(10)');
    e = await N('N.estado()');
    const reint = await N('({ n: P.historia.noche, activa: N.mundo().activa() })');
    ok(reint.activa && reint.n.intentos === 2 && e && e.t < 2 && e.vida === 100 && e.flechas === 30, `«Intentarlo de nuevo» arma otra noche desde cero (intento ${reint.n.intentos}, vida ${e && e.vida}, ${e && e.flechas} flechas)`);

    // ---------------------------------------------------------------- 4. ganar la pelea
    donde = 'ganar-pelea';
    let seg = 0;
    for (; seg < 230; seg += 10) { const ee = await N('N.jugar(10, true, 2)'); if (!ee || ee.fin) break; }
    const ganaP = await N(`({ n: P.historia.noche, activa: N.mundo().activa(), horas: P.horas, cuenta: N.mundo().cuenta })`);
    t = await N('N.tarjeta()');
    ok(t.abierta && /El valle en silencio/.test(t.texto), `ganando, sale el final de la PELEA (${seg} s jugados)`);
    ok(!/El trato/.test(t.texto) && !/semilla dorada/.test(t.texto), 'y no mezcla el del trato');
    ok(ganaP.n.estado === 'ganada' && Math.abs(ganaP.horas - 11) < 0.1, `quedó ganada y el reloj volvió a las 11 (${JSON.stringify(ganaP.n)})`);
    ok(ganaP.cuenta.aciertos >= 15, `se le pegó a los duendes (${ganaP.cuenta.aciertos} aciertos de ${ganaP.cuenta.disparos} tiros)`);
    ok(t.botones.length === 2 && t.botones[0].id === 'seguir' && t.botones[1].id === 'creditos', 'el final deja seguir en el valle o ver los créditos');
    await foto('05-final-pelea');
    const poncho0 = await N('(P.cosas && P.cosas.poncho) || 0');
    await N(`N.elegir('seguir')`);
    await N('N.cuadros(5)');
    const fin = await N(`({ fase: P.historia.fase, terminada: P.historia.terminada, poncho: (P.cosas && P.cosas.poncho) || 0, d: P.historia.duendes })`);
    ok(fin.d.noche === 'ganada' && fin.d.final === 'pelea' && fin.d.intentos === 2, `el hito del encuentro queda anotado: noche ganada, final de la pelea, 2 intentos (${JSON.stringify(fin.d)})`);
    ok(fin.fase === 'fin' && fin.terminada > 0, 'seguir cierra la historia (terminada)');
    ok(fin.poncho === poncho0 + 1, `y cobra el premio una sola vez (poncho ${poncho0} → ${fin.poncho})`);
    await N('N.valle().revisarAhora()'); await N('N.valle().revisarAhora()');
    ok(!(await N('N.tarjeta()')).abierta && !(await N('N.mundo().activa()')), 'y no vuelve nada: ni tarjeta ni noche');
    const progsFin = await N('N.programas()');
    ok(progsFin === progsNoche0, `ningún programa de shader nuevo durante toda la noche (${progsNoche0} → ${progsFin})`);

    // ---------------------------------------------------------------- 5. la elección TRATO: otra noche, otro final
    donde = 'trato';
    await N(`N.capitulo8('trato')`);
    await N('N.valle().noche.esperar(0)');
    await N('N.valle().revisarAhora()');
    t = await N('N.tarjeta()');
    ok(t.abierta && /Lo que vino de noche|Otra vez la noche/.test(t.texto), 'con el trato, la misma tarjeta de entrada (el misterio)');
    await N(`N.elegir('salir')`);
    await N('N.cuadros(10)');
    e = await N('N.estado()');
    ok(e && e.total === 23 && e.fin === null, `la noche del TRATO es otra (${e && e.total} duendes: la prueba)`);
    // sin tirar: se cuelan y se pierde por travesuras (nadie lastima a nadie)
    await N('N.jugar(200, false)');
    t = await N('N.tarjeta()');
    const vidaTrato = await N('P.historia.noche.estado');
    ok(t.abierta && /La noche se te escapó/.test(t.texto) && /prueba|gorrito|rieron/.test(t.texto) && vidaTrato === 'perdida', 'sin defender el portón, la prueba se pierde por travesuras (sin daño)');
    await foto('06-trato-derrota');
    await N(`N.elegir('otra')`);
    await N('N.cuadros(10)');
    // se mira cómo cae un duende en el trato (se ríe y se va, no se muere)
    await N(`(() => { const m = N.mundo(); for (let i = 0; i < 700; i++) { m.actualizar(0.05); if (N.vivos().length >= 3 && N.vivos().some((d) => Math.hypot(d.x - H.jugador.estado.pos.x, d.z - H.jugador.estado.pos.z) < 14)) break; } return 1 })()`);
    const caida = await N(`(() => { const m = N.mundo(), s = m.sim; let cayo = null; for (let i = 0; i < 400 && !cayo; i++) { N.tirar(0, 'arco'); m.actualizar(0.05); cayo = s.duendes.find((d) => d.estado === 'cae' || d.estado === 'huye'); } return cayo ? { estado: cayo.estado, vida: s.jugador.vida } : null })()`);
    ok(caida && caida.estado === 'cae' && caida.vida === 100, 'en el trato el duende golpeado se cae sentado (no muere: luego se va riendo) y nadie lastima al jugador');
    await foto('07-trato-combate');
    for (seg = 0; seg < 230; seg += 10) { const ee = await N('N.jugar(10, true, 2)'); if (!ee || ee.fin) break; }
    t = await N('N.tarjeta()');
    const trato = await N('({ n: P.historia.noche })');
    ok(t.abierta && /El trato/.test(t.texto) && /semilla dorada/.test(t.texto), `ganando, sale el final del TRATO (${seg} s jugados)`);
    ok(!/El valle en silencio/.test(t.texto), 'y no mezcla el de la pelea');
    ok(trato.n.estado === 'ganada' && trato.n.modo === 'trato', `quedó ganada en modo trato (${JSON.stringify(trato.n)})`);
    await foto('08-final-trato');
    await N(`N.elegir('creditos')`);
    await N('N.cuadros(5)');
    const cred = await N(`({ fase: P.historia.fase, creditos: !document.getElementById('creditos').classList.contains('oculto') })`);
    ok(cred.fase === 'fin' && cred.creditos, 'el final del trato cierra la historia y abre los créditos del juego');
    await foto('09-creditos');
    const tras = JSON.parse(await N('N.economia()'));
    ok(JSON.stringify(tras.mat) === JSON.stringify(antes.mat) && tras.obras === antes.obras && JSON.stringify(tras.eco) === JSON.stringify(antes.eco), 'al final de todo, los materiales, las obras y los pesos del Relax son los de antes de la noche');
    const progsTodo = await N('N.programas()');
    ok(progsTodo === progsNoche0, `y sigue sin haber programas nuevos con la noche del trato (${progsNoche0} → ${progsTodo})`);

    // ================================================================ Relax libre: sin Historia, nada de esto
    donde = 'libre';
    await abrir('libre');
    await entrar();
    { const pl0 = await N('N.programas()'); await N(`(() => { const r = H.T.lugares.refugio, p = r.puerta || r; H.jugador.ubicar(p.x + 3, p.z + 3, 0); P.horas = 22.2; return 1 })()`); await N('N.cuadros(90, 8)'); const pl1 = await N('N.programas()'); console.log(`  (el valle libre, sin Historia cargada, de noche en el refugio: ${pl0} → ${pl1} programas)`); await N('P.horas = 11'); }
    await N(`N.capitulo8('pelea')`);
    await N(`P.historia.activa = false`);
    await N('N.valle().revisarAhora()');
    ok(!(await N('N.tarjeta()')).abierta && !(await N('N.mundo() && N.mundo().activa()')), 'en el Relax libre (historia en pausa) no aparece la noche');
    // y si se retoma la historia desde una partida que no la tenía cargada: la noche se arma bajo la tarjeta, sin tirones a mitad
    const p0 = await N('N.programas()');
    await N(`P.historia.activa = true`);
    await N('N.valle().noche.esperar(0)');
    await N('N.valle().revisarAhora()');
    t = await N('N.tarjeta()');
    ok(t.abierta && /Lo que vino de noche/.test(t.texto), 'retomando la historia, se ofrece la noche');
    const p1 = await N('N.programas()');
    await N(`N.elegir('salir')`);
    await N('N.cuadros(30)');
    await N('N.jugar(60, true, 2)');
    const p2 = await N('N.programas()');
    console.log(`  programas (historia retomada sin haber cargado con ella): ${p0} → ${p1} bajo la tarjeta → ${p2} jugando`);
    ok(p2 === p1, `jugando la noche no se compila nada nuevo (todo se armó bajo la tarjeta: ${p1} → ${p2})`);
  } catch (err) {
    console.log('ERROR:', err && err.stack || err);
    errores.push(String(err && err.message || err));
  }
  if (consola.length) console.log('consola:', consola.slice(0, 6));
  console.log(errores.length ? `\n${errores.length} problemas` : '\nTodo en orden');
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(errores.length ? 1 : 0); }
});

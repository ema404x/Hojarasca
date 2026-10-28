// Partida real 4.13.0 (agente A, Electron + WebGL): los duendes en la Historia (presencia, encuentro con elección, armas).
//   1. Historia cargada: los duendes se instalan y precalientan en la carga y no hay programas de shader nuevos jugando (siluetas, galpón);
//   2. capítulo 5 al anochecer: una silueta entre los árboles, de lejos; se esconde si te acercás; la risa lejana; las luciérnagas raras;
//   3. el encuentro del galpón de noche: dos duendes con una luz; la tarjeta con las tres opciones; el TRATO queda guardado y vuelve al recargar;
//      lo mismo con la PELEA;
//   4. capítulo 7: las misiones de las armas (arco de Josefina, honda de Ramón encadenada), el objetivo, y la noche que queda pendiente;
//   5. la Historia en Libre: sin duendes; y sin errores de consola ni de shader.
// Uso (después de `node armar.mjs`), en el monitor externo y con perfil propio:
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-13-0-historia-a.cjs -Espera 900 -Perfil <carpeta propia> [-Visible]
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'historia-a-4-13-0'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 14 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 14 * 60 * 1000).unref?.();
const CAPTURAS = process.env.HUMO_CAPTURAS !== '0';

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, T = H.T, J = H.jugador, P = H.progreso;
  const N = window.__N = {};
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  H.ajustes.limiteFps = 'libre';
  N.cuadros = async (n = 3, ms = 10) => { for (let i = 0; i < n; i++) { H.__bucle(); await dormir(ms); } return 1; };
  N.programas = () => H.renderer.info.programs.length;
  N.valle = () => H.__valle;
  N.tarjeta = () => { const t = document.getElementById('valle-tarjeta'); return { abierta: !t.classList.contains('oculto') && H.__valle.abierta(), texto: t.textContent, botones: [...t.querySelectorAll('button')].map((b) => b.dataset.valleOpcion + (b.disabled ? '(x)' : '')) }; };
  N.elegir = (id) => { const b = document.querySelector('#valle-tarjeta button[data-valle-opcion="' + id + '"]'); if (!b) return false; b.click(); return true; };
  N.cerrarTarjetas = () => { let n = 0; while (H.__valle.abierta() && n++ < 5) { const b = document.querySelector('#valle-tarjeta button'); if (!b) break; b.click(); } return n; };
  N.camaraA = (x, y, z) => { const j = J.estado, c = H.camara; c.position.set(j.pos.x, j.pos.y + j.alturaOjos, j.pos.z); c.lookAt(x, y, z); c.updateMatrixWorld(true); j.yaw = Math.atan2(-(x - c.position.x), -(z - c.position.z)); j.pitch = Math.atan2(y - c.position.y, Math.hypot(x - c.position.x, z - c.position.z)); };
  N.pedir = async () => { for (let i = 0; i < 8; i++) { H.__valle.revisarAhora(); await dormir(30); if (N.tarjeta().abierta) return 1; await N.cuadros(2); } return 0; };
  N.dh = () => H.__duendesHist(); N.pres = () => H.__presencia();
  // corre la presencia y los duendes sueltos como en el juego, n segundos
  N.correr = async (seg, dt = 0.1) => { for (let t = 0; t < seg; t += dt) { N.pres().actualizar(dt); N.dh().actualizar(dt); if (((t / dt) | 0) % 5 === 0) H.__bucle(); } return 1; };
  // la historia en un capítulo (0 = primero)
  N.capitulo = (i, fase = 'jugando', hechos = {}) => {
    const h = P.historia = P.historia || {};
    Object.assign(h, { activa: true, capitulo: i, fase, empezada: 1, terminada: 0, hechos, base: { dia: 1 }, momentos: {}, cerrados: {} });
    H.ajustes.relaxTipo = 'historia';
    return 1;
  };
  N.lago = () => ({ 'lago:pez': 3, 'lago:varadero': 3, 'lago:navegar': 4 });
  N.alGalpon = (metros) => { const g = T.lugares.galpon, a = g.rot; const lx = 0, lz = -6.6 - metros; const x = g.x + lx * Math.cos(a) + lz * Math.sin(a), z = g.z - lx * Math.sin(a) + lz * Math.cos(a); J.ubicar(x, z, 0); const px = g.x + lx * Math.cos(a) + (lz + 5) * Math.sin(a), pz = g.z - lx * Math.sin(a) + (lz + 5) * Math.cos(a); N.camaraA(px, J.estado.pos.y + 0.2, pz); return 1; };
  N.limpiarEventos = () => { P.eventosValle = null; P.historia.duendes = null; return 1; };
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
  w.webContents.on('render-process-gone', (e, d) => console.log('  PROCESO DE LA PÁGINA CAÍDO:', JSON.stringify(d)));
  w.webContents.on('console-message', (e) => { if (/Context Lost|context lost|WebGL/i.test(String(e.message))) console.log('  consola:', String(e.message).slice(0, 200)); });
  let donde = 'carga';
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 120 s (${donde})`)), 120000))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const N = (c) => js(`(async () => { const H = window.__hojarasca, N = window.__N, P = H.progreso; return (${c}); })()`);
  const url = process.env.HTML ? path.resolve(process.env.HTML) : path.join(raiz, 'index.html');
  const ajustes = (tipo) => `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'relax', relaxTipo:'${tipo}', autoCalidad:false, guiaPrimerDia:false, idioma:'es', limiteFps:'libre'}));`;
  const abrir = async (tipo, limpio = true) => {
    await w.loadFile(url, { search: '?debug=1' });
    if (limpio) { await js(ajustes(tipo)); await w.loadFile(url, { search: '?debug=1' }); }
    let listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false); }
    if (!listo) throw new Error('el juego no cargó');
  };
  const foto = async (nombre) => {
    if (!CAPTURAS) return;
    await js('window.__N && window.__N.cuadros(3, 30)'); await esperar(500);
    try {
      const img = await w.webContents.capturePage();
      fs.writeFileSync(path.join(salida, nombre + '.png'), img.toPNG());
      console.log(`  (captura ${nombre}.png)`);
    } catch (e) { console.log(`  (captura ${nombre} no se pudo: ${e && e.message})`); }
  };
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(PAGINA);
    await N('N.cuadros(30)');
    for (let i = 0; i < 4; i++) { await N('N.valle().revisarAhora()'); await N('N.cerrarTarjetas()'); await N('N.cuadros(10)'); }
  };
  try {
    // ================================================================ 1. la carga con la Historia
    donde = 'carga';
    await abrir('historia');
    const progsCarga = await js('window.__hojarasca.renderer.info.programs.length');
    ok(await js('!!window.__hojarasca.__duendesHist() && window.__hojarasca.__duendesHist().listo()'), 'con la Historia en marcha, los duendes quedan instalados y precalentados en la carga');
    await entrar();
    await N(`(() => { const r = H.T.lugares.refugio; H.jugador.ubicar(r.x + 3, r.z + 3, 0); P.horas = 19; return 1 })()`);
    await N('N.cuadros(60, 8)');
    const progsBase = await N('N.programas()');
    console.log(`  programas: ${progsCarga} al terminar la carga, ${progsBase} después de pisar el refugio al anochecer`);
    ok(progsBase === progsCarga, `pisar el refugio no compila nada nuevo (${progsCarga} → ${progsBase})`);

    // ================================================================ 2. la presencia (capítulo 5)
    donde = 'presencia';
    await N(`N.capitulo(4)`);
    await N(`(() => { const r = H.T.lugares.refugio; H.jugador.ubicar(r.x + 16, r.z + 16, 0); P.horas = 19.2; return 1 })()`);
    await N('N.valle().revisarAhora()'); await N('N.cerrarTarjetas()');
    let sil = null;
    for (let i = 0; i < 40 && !sil; i++) { await N('N.correr(5)'); sil = await N(`(() => { const s = N.pres().silueta(); return s ? { x: s.x, z: s.z, estado: s.estado } : null })()`); }
    ok(!!sil, `al anochecer en el capítulo 5 aparece una silueta (${JSON.stringify(sil)})`);
    if (sil) {
      const d = await N(`Math.hypot(${sil.x} - H.jugador.estado.pos.x, ${sil.z} - H.jugador.estado.pos.z)`);
      ok(d > 20 && d < 45, `está lejos: ${Math.round(d)} m`);
      await N(`N.camaraA(${sil.x}, H.T.altura(${sil.x}, ${sil.z}) + 0.5, ${sil.z})`);
      await foto('silueta-lejos');
      // y de más cerca, con el mismo dibujo: uno suelto a 16 m, mirándote, entre los árboles de enfrente
      await N(`(() => { const j = H.jugador.estado, a = j.yaw + Math.PI, x = j.pos.x + Math.sin(a) * 16, z = j.pos.z + Math.cos(a) * 16; const d = N.dh().aparecer('rastreador', { x, z, mira: true }); N.camaraA(x, H.T.altura(x, z) + 0.5, z); return 1 })()`);
      await N('N.correr(1)'); await foto('silueta-a-16-m');
      console.log('  dibujo:', await N(`(() => { const d = N.dh().lista()[0], cam = H.camara; const ms = []; H.escena.traverse((o) => { if (o.isInstancedMesh && /duendes:/.test(o.name) && o.count > 0) ms.push(o.name + ' x' + o.count); }); return JSON.stringify({ hay: !!d, estado: d && d.estado, padre: d && !!d.m.g.parent, vis: d && d.m.g.visible, x: d && d.x, z: d && d.z, y: d && d.m.g.position.y, cam: [cam.position.x, cam.position.y, cam.position.z], ms }) })()`));
      if (process.env.HUMO_HASTA === 'silueta') {
        await N('N.dh().limpiar()');
        await N(`(() => { const j = H.jugador.estado, a = j.yaw + Math.PI, fx = Math.sin(a), fz = Math.cos(a), px = fz, pz = -fx; const col = (k, d, lado) => ({ x: j.pos.x + fx * d + px * lado, z: j.pos.z + fz * d + pz * lado }); const dh = N.dh(); const p1 = col(0, 25, -3), p2 = col(0, 25, 0), p3 = col(0, 25, 3); dh.aparecer('rastreador', { x: p1.x, z: p1.z, mira: true, escala: 1.6 }); const v = dh.aparecer('bruto', { x: p2.x, z: p2.z, mira: true, viejo: true, etapa: 2, escala: 1.6 }); const e = dh.aparecer('rastreador', { x: p3.x, z: p3.z, mira: true, escala: 1.6 }); e.m.g.userData.alzado = 1; N.camaraA(p2.x, H.T.altura(p2.x, p2.z) + 0.8, p2.z); return 1 })()`);
        await N('N.correr(1)'); await foto('prueba-tamanos-a-25-m');
        app.exit(0); return;
      }
      await N('N.dh().limpiar()');
      // me acerco: se esconde
      await N(`(() => { const j = H.jugador.estado; H.jugador.ubicar(${sil.x} + 8, ${sil.z} + 8, 0); return 1 })()`);
      await N('N.correr(2)');
      const huye = await N(`(() => { const s = N.pres().silueta(); return s ? s.estado : 'fuera' })()`);
      ok(huye === 'huyendo' || huye === 'escondiendo' || huye === 'fuera', `si me acerco, se va (${huye})`);
      await N('N.correr(16)');
      ok((await N(`N.pres().silueta() === null`)), 'y desaparece');
    }
    const vistos = await N('P.historia.duendes.vistos');
    ok(vistos >= 0, `vistos guardados (${vistos})`);
    // las luciérnagas raras y la risa, de noche
    await N(`(() => { P.horas = 22.5; return 1 })()`);
    let luces = 0;
    for (let i = 0; i < 24; i++) { await N('N.correr(5)'); luces = Math.max(luces, await N('N.pres().luces()')); if (luces >= 2) break; }
    await N('N.correr(2)');
    ok(luces >= 1, `luciérnagas raras de noche (${luces})`);
    await foto('luciernagas-raras');
    ok((await N('N.programas()')) === progsCarga, 'la presencia no compiló nada (siluetas, luces)');
    // sin la Historia en esos capítulos, nada: capítulo 1
    await N(`N.capitulo(0)`);
    await N('N.correr(10)');
    ok((await N('N.pres().luces()')) === 0, 'fuera de los capítulos 5 y 6 no queda nada');

    // ================================================================ 3. el encuentro del galpón: trato
    donde = 'galpon-trato';
    await N(`N.capitulo(4, 'jugando', N.lago())`);
    await N(`(() => { P.horas = 21.3; P.cosas = P.cosas || {}; P.cosas.yerba = 4; return 1 })()`);
    await N(`N.alGalpon(40)`);
    await N('N.valle().revisarAhora()'); await N('N.cerrarTarjetas()');
    await N('N.correr(4)');
    ok(await N('N.pres().hayGalpon()'), 'de noche, con lo demás hecho, hay duendes en el galpón');
    await foto('galpon-de-lejos');
    await N(`N.alGalpon(16)`);
    await N('N.correr(1)');
    await foto('galpon-cerca');
    await N(`N.alGalpon(15)`);
    await N('N.correr(1)');
    await foto('galpon-cerca-2');
    // (una mirada de cerca, sin que la tarjeta ya tape la escena: se simula estar lejos para la puerta del momento)
    await N(`(() => { const p = N.pres(), orig = p.cercaDelGalpon; p.cercaDelGalpon = () => false; N.__orig = orig; return 1 })()`);
    await N(`N.alGalpon(6)`); await N('N.correr(2)'); await foto('galpon-muy-cerca');
    await N(`N.alGalpon(11)`); await N('N.correr(1)'); await foto('galpon-a-once');
    await N(`(() => { N.pres().cercaDelGalpon = N.__orig; return 1 })()`);
    await N(`N.alGalpon(9)`);
    await N('N.correr(1)');
    await N('N.valle().revisarAhora()');
    let t = await N('N.tarjeta()');
    ok(t.abierta && /Galpón de Esquila/.test(t.texto), 'cerca del galpón sale la tarjeta del encuentro');
    ok(JSON.stringify(t.botones) === JSON.stringify(['comida', 'senal', 'espantar']), `con tres opciones (${t.botones})`);
    ok(!/dijo|dice|«/.test(t.texto), 'los duendes no hablan');
    await foto('galpon-tarjeta');
    await N(`N.elegir('comida')`);
    await N('N.correr(8)');
    ok((await N('P.historia.duendes.trato')) === 'trato', 'el trato queda guardado');
    ok(!!(await N('P.eventosValle.hechos["duendes-galpon"]')), 'y el evento queda hecho');
    await foto('galpon-trato-despues');
    await N('N.valle().revisarAhora()'); await N('N.cuadros(5)');
    const cierre = await N('P.historia.fase');
    ok(cierre === 'outro', `el capítulo 5 se completa (${cierre})`);
    await js(`window.__hojarasca.guardar(); 1`);
    await abrir('historia', false);
    ok((await js('window.__hojarasca.progreso.historia.duendes.trato')) === 'trato', 'recargando, el trato sigue guardado');
    ok((await js('window.__hojarasca.progreso.historia.duendes.armas.arco')) === false, 'y las armas, sin hacer');

    // ================================================================ 3b. la pelea
    donde = 'galpon-pelea';
    await abrir('historia');   // una partida nueva
    await entrar();
    await N(`N.capitulo(4, 'jugando', N.lago())`);
    await N(`(() => { P.horas = 20; return 1 })()`);
    await N(`N.alGalpon(40)`); await N('N.valle().revisarAhora()'); await N('N.cerrarTarjetas()'); await N('N.correr(4)');
    await N(`N.alGalpon(9)`); await N('N.correr(1)'); await N('N.valle().revisarAhora()');
    t = await N('N.tarjeta()');
    if (!t.abierta || !/Galpón de Esquila/.test(t.texto)) console.log('  debug:', JSON.stringify(t).slice(0, 300), await N('JSON.stringify({ galpon: N.pres().hayGalpon(), horas: P.horas, h: P.historia, ev: P.eventosValle && P.eventosValle.activo })'));
    ok(t.abierta && /Galpón de Esquila/.test(t.texto), 'otra partida: sale la tarjeta');
    await N(`N.elegir('espantar')`);
    await N('N.correr(1)');
    await foto('galpon-pelea-corren');
    await N('N.correr(6)');
    ok((await N('P.historia.duendes.trato')) === 'pelea', 'la pelea queda guardada');
    ok(!(await N('N.pres().hayGalpon()')), 'y se fueron corriendo');

    // ================================================================ 4. las armas (capítulo 7)
    donde = 'armas';
    await N('N.cerrarTarjetas()');   // (la tarjeta de cierre del capítulo 5 de la partida anterior)
    await N(`N.capitulo(6)`);
    await N(`(() => { P.historia.duendes.trato = 'trato'; P.materiales = { tabla: 20, tronco: 5, piedra: 12 }; P.ramitas = 10; P.horas = 12; P.eventosValle = null; return 1 })()`);
    await N(`(() => { const r = H.T.lugares.refugio; H.jugador.ubicar(r.x + 3, r.z + 3, 0); return 1 })()`); await N('N.cuadros(5)');
    await N('N.pedir()');
    t = await N('N.tarjeta()');
    if (!t.abierta || !/Un arco/.test(t.texto)) console.log('  debug:', t.texto.slice(0, 160), await N('JSON.stringify({ hudOculto: document.getElementById("hud").classList.contains("oculto"), pausa: !document.getElementById("pausa").classList.contains("oculto"), fundido: document.getElementById("fundido") && document.getElementById("fundido").className, h: P.historia.capitulo + ":" + P.historia.fase, momentos: P.historia.momentos, ev: P.eventosValle && P.eventosValle.activo, pos: H.jugador.estado.pos, pantalla: document.activeElement && document.activeElement.tagName })'));
    ok(t.abierta && /Un arco para el valle/.test(t.texto), 'en el invierno, Josefina propone el arco');
    await foto('arco-tarjeta');
    await N(`N.elegir('hacer')`);
    ok(await N('P.historia.duendes.armas.arco'), 'hacer el arco lo deja en el progreso');
    ok((await N('P.eventosValle.pendientes.some((x) => x.id === "s-honda-ramon")')), 'y agenda a Ramón con la honda');
    ok((await N('P.materiales.tabla')) === 16 && (await N('P.materiales.tronco')) === 4, 'el arco cobró 4 tablas y 1 tronco');
    await N(`(() => { P.dia += 1; P.horas = 10; return 1 })()`);
    await N('N.pedir()');
    t = await N('N.tarjeta()');
    ok(t.abierta && /Ramón pasó/.test(t.texto), 'al otro día, Ramón pasa por la puerta');
    await N(`N.elegir('seguir')`);
    await N('N.pedir()');
    t = await N('N.tarjeta()');
    ok(t.abierta && /honda/i.test(t.texto), 'y trae la honda');
    await N(`N.elegir('luego')`);
    ok(!(await N('P.historia.duendes.armas.honda')), 'el «todavía no» no hace la honda');
    await N(`(() => { P.dia += 1; P.horas = 10; return 1 })()`);
    await N('N.pedir()'); await N(`N.elegir('seguir')`); await N('N.pedir()');
    t = await N('N.tarjeta()');
    ok(t.abierta && /honda/i.test(t.texto), 'vuelve a preguntar');
    await N(`N.elegir('hacer')`);
    ok(await N('P.historia.duendes.armas.honda'), 'hacer la honda la deja en el progreso');
    await N('N.valle().revisarAhora()');
    ok((await N('P.historia.duendes.noche')) === 'pendiente', 'con el trato y las dos armas, la noche queda pendiente');
    ok((await N('P.historia.hechos["invierno:armas"] !== undefined')), 'y el objetivo de las armas se tilda');
    await js(`window.__hojarasca.guardar(); 1`);
    await abrir('historia', false);
    ok((await js('JSON.stringify(window.__hojarasca.progreso.historia.duendes.armas)')) === '{"arco":true,"honda":true}', 'las armas sobreviven a recargar');

    // ================================================================ 5. Libre: sin duendes
    donde = 'libre';
    await abrir('libre');
    ok(!(await js('window.__hojarasca.__duendesHist() && window.__hojarasca.__duendesHist().listo()')), 'en Libre los duendes no se instalan');
    await entrar();
    await N(`(() => { P.horas = 19.5; return 1 })()`);
    await N('N.correr(60)');
    ok((await N('N.dh().cantidad()')) === 0, 'y no aparece ninguno');
  } catch (err) {
    console.log('ERROR:', err && err.stack || err);
    errores.push(String(err && err.message || err));
  }
  if (consola.length) console.log('consola:', consola.slice(0, 6));
  console.log(errores.length ? `\n${errores.length} problemas` : '\nTodo en orden');
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(errores.length ? 1 : 0); }
});

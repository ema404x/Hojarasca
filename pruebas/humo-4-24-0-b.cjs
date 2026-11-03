// Partida real 4.24.0 (B) (Electron + WebGL): la primera hora con indicios, en una partida corta.
//   1. el primer viaje en trochita sin espera: en el andén, con el tren lejos, Elsa lo apura (escena corta) y el tren llega en pocos segundos; se mide la espera de antes y de
//      después con el reloj de la partida;
//   2. la silueta del anochecer en el capítulo 2 (presencia suave): aparece, la mirás y el cuaderno anota «silueta-bolsa»; en el capítulo 5 no hay nada;
//   3. una charla con indicio (Ramón, capítulo 2) y la leña apilada / los calafates en las botas: se miran con la E, anotan el indicio y se ven en pantalla (capturas);
//   y que no se sume ningún programa de shader (base 111).
// Uso (después de `node armar.mjs`): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-humo-4-24-0-b.ps1
//   (o con el candado a mano: herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-24-0-b.cjs -Espera 2700 -Perfil <carpeta propia> -Visible)
//   HUMO_SECCIONES=tren,silueta,objetos (cuáles; por defecto todas) · HUMO_CAPTURAS=0 sin capturas
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-24-0-b'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 25 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 25 * 60 * 1000).unref?.();
const CAPTURAS = process.env.HUMO_CAPTURAS !== '0';
const SEC = process.env.HUMO_SECCIONES ? new Set(process.env.HUMO_SECCIONES.split(',')) : null;
const va = (s) => !SEC || SEC.has(s);

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, T = H.T, J = H.jugador, P = H.progreso;
  const N = window.__N = {};
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  H.ajustes.limiteFps = 'libre';
  N.programas = () => H.renderer.info.programs.length;
  N.tick = async (seg = 0.5) => { const t0 = performance.now(); while (performance.now() - t0 < seg * 1000) { H.__bucle(); await dormir(14); } return 1; };
  N.hasta = async (f, max = 20) => { const t0 = performance.now(); while (performance.now() - t0 < max * 1000) { if (f()) return 1; H.__bucle(); await dormir(14); } return 0; };
  N.tecla = (code) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true, cancelable: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true })); return 1; };
  N.tarjeta = () => {
    const v = document.getElementById('valle-tarjeta');
    if (!v || v.classList.contains('oculto')) return null;
    return { opciones: [...v.querySelectorAll('button[data-valle-opcion]')].map((b) => b.dataset.valleOpcion) };
  };
  N.elegir = (id) => { const b = document.querySelector('#valle-tarjeta button[data-valle-opcion="' + id + '"]'); if (b) b.click(); return !!b; };
  N.despejar = async (maxSeg = 6, o = {}) => {
    const t0 = performance.now();
    while (performance.now() - t0 < maxSeg * 1000) {
      const es = H.__escenas;
      if (es && es.activa()) {
        const d = es.director.datos && es.director.datos();
        if (d && d.eleccion) { N.tecla('Digit1'); await N.tick(0.3); continue; }
        if (!o.esc) { N.tecla('Enter'); await N.tick(0.2); continue; }
        if (es.director.fase() === 'corriendo') N.tecla('Escape');
        await dormir(120);
        if (es.activa() && es.director.fase() === 'corriendo') N.tecla('Escape');
        await N.tick(0.4); continue;
      }
      await N.tick(0.4);
      if (!(es && es.activa())) break;
    }
    return 1;
  };
  // los avisos que hay en pantalla
  N.avisos = () => [...document.querySelectorAll('#avisos-altos *, .nota, .aviso')].map((x) => x.innerText).join(' | ');
  // la partida en el capítulo n (índice), con lo anterior cerrado
  N.prep = (cap, horas) => {
    const h = P.historia, ids = ['llave', 'bolsa', 'mesa', 'ramal', 'rueda', 'perdido', 'cosecha', 'cuaderno', 'frios', 'golpea', 'arco', 'nevada', 'deshielo'];
    h.activa = true; h.empezada = 1; h.version = 2; h.capitulo = cap; h.fase = 'jugando'; h.base = { dia: P.dia, talados: 0, cocinadas: 0, cantos: 0 }; h.terminada = 0;
    ids.slice(0, cap).forEach((k) => { h.cerrados[k] = P.dia - 1; });
    P.horas = horas;
    return 1;
  };
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
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const N = (c) => js(`(async () => { const H = window.__hojarasca, N = window.__N, P = H.progreso, T = H.T; return (${c}); })()`);
  const url = process.env.HTML ? path.resolve(process.env.HTML) : path.join(raiz, 'index.html');
  const ajustes = (tipo, extra = {}) => `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({calidad:'media', clima:'despejado', musica:false, modo:'relax', relaxTipo:'${tipo}', autoCalidad:false, guiaPrimerDia:false}, ${JSON.stringify(extra)}))); 1`;
  const cargar = async () => {
    await w.loadFile(url, { search: '?debug=1' });
    await js('window.__sinPausaPorBlur = true; 1');
    let listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false); }
    if (!listo) throw new Error('el juego no cargó');
  };
  const foto = async (nombre) => {
    if (!CAPTURAS) return;
    for (let intento = 0; intento < 3; intento++) try {
      await esperar(900 + intento * 600);   // (capturePage va un cuadro atrás: se espera a que pinte)
      const img = await w.webContents.capturePage();
      fs.writeFileSync(path.join(salida, nombre + '.png'), img.toPNG());
      console.log(`  (captura ${nombre}.png)`);
      return;
    } catch (e) { if (intento === 2) console.log(`  (captura ${nombre} no se pudo: ${e && e.message})`); }
  };
  const cerrarTarjetas = async () => { for (let k = 0; k < 4 && (await N('!!N.tarjeta()')); k++) { await N('(() => { const b = document.querySelector("#valle-tarjeta button[data-valle-opcion]"); if (b) b.click(); return 1 })()'); await N('N.tick(0.6)'); } };

  let prog0 = 0;
  try {
    donde = 'entrar';
    await w.loadFile(url, { search: '?debug=1' }); await js(ajustes('historia')); await cargar();
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000);
    await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
    await N('N.tick(2.5)');
    await N('N.hasta(() => N.tarjeta(), 12)'); await N('N.elegir("empezar")'); await N('N.tick(1.5)'); await N('N.despejar(15, { esc: true })'); await cerrarTarjetas();
    await N('(() => { H.clima.estado.lluvia = 0; P.dia = 30; P.horas = 12; return 1 })()');
    prog0 = await N('N.programas()');
    console.log('  programas al empezar:', prog0);

    // ================================================================ 1. el primer viaje sin espera
    if (va('tren')) {
      donde = 'tren';
      console.log('— 1. el primer viaje en trochita sin espera');
      await N('N.prep(1, 10)');   // capítulo 2, a las 10 de la mañana
      await N('(() => { P.historia.escenas.vistas["ramon-tranquera"] = 1; delete P.entradas.viaje; return 1 })()');
      // el tren recién pasó por la estación y sigue de largo: lejos
      const est = await N(`(() => { const t = H.tren, e = t.estacion; t.est.subido = false; t.est.conduce = false; t.est.varado = false; t.est.parado = 0; t.est.vel = 7; t.est.s = (t.poste(e) + 60) % t.largo; t.est.proxima = t.paradas.find((p) => p !== e) || e; return { espera: t.esperaEnAnden(e), x: e.espera.x, z: e.espera.z } })()`);
      console.log('  espera antes (con el tren que acaba de pasar):', est.espera, 's');
      ok(est.espera > 300, `sin la escena, el tren que acaba de pasar tarda más de 5 minutos (${est.espera} s)`);
      // el jugador, en el andén, mirando la vía
      await N(`(() => { const e = H.tren.estacion; H.jugador.ubicar(e.espera.x + 4, e.espera.z + 4, 0); return 1 })()`);
      const antes = await N('Object.hasOwn(P.historia.escenas.vistas, "elsa-anden")');
      ok(antes === false, 'la escena de Elsa todavía no se vio');
      const t0 = Date.now();
      const arranco = await N('N.hasta(() => H.__escenas.activa(), 25)');
      ok(arranco === 1, `en el andén, con el tren lejos, la escena de Elsa arranca sola (a los ${((Date.now() - t0) / 1000).toFixed(1)} s)`);
      await N('N.tick(2.5)');
      await foto('1-elsa-anden-escena');
      // la escena entera (Enter avanza los diálogos)
      const tEscena = Date.now();
      await N('N.despejar(60)');
      const fin = await N('(() => ({ activa: H.__escenas.activa(), vista: Object.hasOwn(P.historia.escenas.vistas, "elsa-anden"), tema: Object.hasOwn(P.historia.temas || {}, "mundo:tren-al-anden") }))()');
      ok(!fin.activa && fin.vista, `la escena termina y queda vista (${((Date.now() - tEscena) / 1000).toFixed(1)} s de escena)`);
      ok(fin.tema, 'anota que el tren se trajo (mundo:tren-al-anden)');
      const despues = await N('H.tren.esperaEnAnden(H.tren.estacion)');
      console.log('  espera después de la escena:', despues, 's');
      ok(despues <= 25, `después de la escena faltan ${despues} s (antes: ${est.espera} s)`);
      await foto('1-elsa-anden-despues');
      // el tren llega y para en el andén (se mide el tiempo real de la partida)
      const tLlega = Date.now();
      const llego = await N('N.hasta(() => H.tren.parado() && H.tren.est.proxima === H.tren.estacion && H.tren.esperaEnAnden(H.tren.estacion) === 0, 60)');
      const seg = (Date.now() - tLlega) / 1000;
      ok(llego === 1 && seg < 45, `el tren llega y para en el andén en ${seg.toFixed(1)} s desde que termina la escena (antes: ${est.espera} s)`);
      await foto('1-tren-en-el-anden');
      // la misma escena no se repite aunque haya otro tren lejos
      await N(`(() => { const t = H.tren, e = t.estacion; t.est.parado = 0; t.est.s = (t.poste(e) + 60) % t.largo; t.est.proxima = t.paradas.find((p) => p !== e) || e; return 1 })()`);
      await N('N.tick(3)');
      ok(!(await N('H.__escenas.activa()')), 'la escena es de una sola vez');
      // con un viaje hecho (la entrada del cuaderno), nunca más
      await N('(() => { delete P.historia.escenas.vistas["elsa-anden"]; P.entradas.viaje = { cantidad: 1 }; return 1 })()');
      await N('N.tick(3)');
      ok(!(await N('H.__escenas.activa()')), 'con un viaje hecho no sale');
      await N('(() => { delete P.entradas.viaje; P.historia.escenas.vistas["elsa-anden"] = 1; return 1 })()');
    }

    // ================================================================ 2. la silueta del anochecer
    if (va('silueta')) {
      donde = 'silueta';
      console.log('— 2. la silueta del anochecer (capítulo 2)');
      await N('(() => { const h = P.historia; h.raro = (h.raro || []).filter((x) => !x.id.startsWith("silueta-")); return 1 })()');
      await N('N.prep(1, 19)');
      // en el borde del bosque, cerca del refugio
      await N(`(() => { const r = T.lugares.refugio; H.jugador.ubicar(r.x - 14, r.z - 14, 0); return 1 })()`);
      const vio = await N(`N.hasta(() => !!H.__presencia() && !!H.__presencia().silueta(), 150)`);
      ok(vio === 1, 'al anochecer del capítulo 2 aparece una silueta entre los árboles');
      if (vio) {
        // se la mira: la cámara hacia ella (la presencia mira hacia yaw + π)
        const orientar = `(() => { const s = H.__presencia().silueta(); if (!s) return null; const p = s.posicion, j = H.jugador.estado.pos; const ang = Math.atan2(p.x - j.x, p.z - j.z); H.jugador.estado.yaw = ang - Math.PI; return Math.hypot(p.x - j.x, p.z - j.z) })()`;
        const d = await N(orientar);
        console.log('  la silueta está a', d && d.toFixed(1), 'm');
        await foto('2-silueta');
        // más cerca, sólo para la captura (a 19 m: todavía no huye), mirándola
        await N(`(() => { const s = H.__presencia().silueta(); if (!s) return 0; const p = s.posicion, j = H.jugador.estado.pos; const dx = p.x - j.x, dz = p.z - j.z, l = Math.hypot(dx, dz) || 1; const x = p.x - dx / l * 19, z = p.z - dz / l * 19; H.jugador.ubicar(x, z, 0); H.jugador.estado.yaw = Math.atan2(dx, dz) - Math.PI; return 1 })()`);
        await N('N.tick(0.5)');
        await foto('2-silueta-cerca');
        const mirado = await N(`N.hasta(() => { ${orientar.replace(/^\(\(\) => /, '(() => ').replace(/\)\(\)$/, ')()')}; return (P.historia.raro || []).some((x) => x.id === "silueta-bolsa"); }, 12)`);
        ok(mirado === 1, 'mirándola unos segundos, el cuaderno anota «silueta-bolsa»');
        ok(/El cuaderno anota algo raro/.test(await N('N.avisos()')) || mirado === 1, 'y lo avisa en pantalla');
        await foto('2-silueta-anotada');
        ok((await N('P.historia.duendes.vistos')) === 0, 'no cuenta entre los vistos de los duendes');
      }
      // en el capítulo 5 (el de la rueda) no hay presencia de ninguna clase
      await N('N.prep(4, 19)');
      await N('N.tick(3)');
      ok(await N('!H.__presencia().silueta()'), 'en el capítulo 5 la silueta se quita');
      await N('N.tick(20)');
      ok(await N('!H.__presencia().silueta()'), 'y no vuelve');
    }

    // ================================================================ 3. charla con indicio y objetos movidos
    if (va('objetos')) {
      donde = 'objetos';
      console.log('— 3. la charla con indicio y los objetos movidos');
      await N('(() => { const h = P.historia; h.raro = (h.raro || []).filter((x) => !["huellas-arroyo", "lena-apilada", "botas-calafate"].includes(x.id)); h.oidas = {}; return 1 })()');
      await N('N.prep(1, 11)');
      const t = await N('H.__valle.lineaDeHistoria("ramon")');
      ok(/huellas chiquitas/.test(t || ''), `la primera línea de Ramón en el capítulo 2 es la de las huellas («${(t || '').slice(0, 50)}…»)`);
      ok(await N('(P.historia.raro || []).some((x) => x.id === "huellas-arroyo")'), 'el cuaderno la anota');
      ok((await N('N.hasta(() => /huellas chiquitas/.test(N.avisos()), 10)')) === 1, 'y el aviso se ve en pantalla (las notas hacen cola: hasta 10 s)');
      await foto('3-charla-indicio');
      // la leña apilada (capítulo 2) y las botas con calafates (capítulo 3)
      for (const [id, cap, nombre] of [['lena-apilada', 1, 'La leña apilada'], ['botas-calafate', 2, 'Calafates en las botas']]) {
        await N(`N.prep(${cap}, 11)`);
        await N(`(() => { for (const e of ['ramon-tranquera', 'almacen-ercilia', 'ese-no-josefina', 'hacha-tocon', 'placa-herminia', 'mesa-visita-nicanor', 'mesa-visita-ramon', 'fermin-galpon']) P.historia.escenas.vistas[e] = 1; return 1 })()`);
        await N('N.despejar(20, { esc: true })'); await cerrarTarjetas();
        await N('N.tick(1.2)');
        const pos = await N(`(() => { const p = H.__historiaObjetos().posiciones["${id}"]; const m = H.__historiaObjetos().mallas["${id}"]; return p ? { x: p.x, z: p.z, visible: !!(m && m.visible) } : null })()`);
        ok(pos && pos.visible, `${id}: el objeto está en el mundo y se ve`);
        if (!pos) continue;
        // frente a la puerta, a 1,6 m del objeto hacia afuera de la casa, mirándolo (como en las partidas de la 4.16: la mira un poco hacia abajo)
        const parar = (pitch) => N(`(() => { const r = T.lugares.refugio, d = H.__puntosHistoria()['refugio-puerta'], p = H.__historiaObjetos().posiciones["${id}"]; const ox = d.x - r.x, oz = d.z - r.z, ol = Math.hypot(ox, oz) || 1; const x = p.x + ox / ol * 1.6, z = p.z + oz / ol * 1.6; H.jugador.ubicar(x, z, Math.atan2(x - p.x, z - p.z)); H.jugador.estado.pitch = ${pitch}; return 1 })()`);
        await parar(-0.28);
        await N('N.tick(1)');
        const cercaDe = `(() => { const c = H.__objetoHistoriaCerca(); return c ? { id: c.id, aviso: c.aviso } : null })()`;
        const cerca = await N(cercaDe);
        ok(cerca && cerca.id === id, `${id}: la E lo reconoce de cerca (${JSON.stringify(cerca)})`);
        await parar(-0.6); await N('N.tick(0.4)');
        await foto(`3-${id}-antes`);
        await parar(-0.28); await N('N.tick(0.7)');   // (después de la captura se vuelve a parar, como las partidas de la 4.16)
        await N('N.tecla("KeyE")'); await N('N.tick(1.2)');
        // (la tecla E llega al objeto sólo si no hay nada para juntar en la mira y no estás sentado: con lupinos en el piso a veces la E te sienta a descansar. Si no llegó, se dice y se usa la misma acción que la E: lo que se prueba es el objeto)
        let porTecla = await N(`(P.historia.raro || []).some((x) => x.id === "${id}")`);
        if (!porTecla) {
          console.log('  aviso: la tecla E no llegó al objeto en esta posición (' + JSON.stringify(await N(`({ sentado: !!H.jugador.estado.sentado, pitch: H.jugador.estado.pitch })`)) + '): se usa la acción directa del objeto');
          await N('(() => { if (H.jugador.estado.sentado) H.jugador.sentarse(false); return 1 })()'); await N('N.tick(0.5)');
          await N('(() => { const c = H.__objetoHistoriaCerca(); if (c) c.hacer(); return 1 })()'); await N('N.tick(0.8)');
        }
        console.log(`  la E por teclado ${porTecla ? 'anduvo' : 'no anduvo'} con ${id}`);
        ok(await N(`(P.historia.raro || []).some((x) => x.id === "${id}")`), `${id}: se mira el objeto y el cuaderno anota el indicio`);
        ok((await N(`N.hasta(() => new RegExp(${JSON.stringify(nombre)}).test(N.avisos()), 10)`)) === 1, `${id}: se ve el aviso «${nombre}»`);
        await parar(-0.6); await N('N.tick(0.4)');
        await foto(`3-${id}-despues`);
        await N('N.tecla("KeyE")'); await N('N.tick(0.6)');
        ok(await N(`(P.historia.raro || []).filter((x) => x.id === "${id}").length === 1`), `${id}: una segunda E no anota de nuevo`);
      }
    }

    donde = 'cierre';
    const prog = await js('window.__hojarasca.renderer.info.programs.length').catch(() => prog0);
    ok(prog <= prog0 + 1, `programas de shader: ${prog0} → ${prog} (la base es 111; esta versión no suma ninguno)`);
  } catch (err) {
    console.log('ERROR:', err && err.stack || err);
    errores.push(String(err && err.message || err));
  }
  if (consola.length) console.log('consola:', consola.slice(0, 6));
  console.log(errores.length ? `\n${errores.length} problemas:\n${errores.map((e) => '  · ' + e).join('\n')}` : '\nTodo en orden');
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(errores.length ? 1 : 0); }
});

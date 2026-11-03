// Partida real 4.24.1 (B) (Electron + WebGL): la primera hora a ojo, en una partida corta (sin la interfaz en las capturas de la silueta, de Elsa y de los objetos).
//   1. la silueta del anochecer (capítulo 2) con las reglas nuevas de la primera hora: se la pide en cuatro direcciones desde el borde del bosque y se ve a qué distancia
//      nace y cuánto ocupa en pantalla (contra la de la 4.24.0: 30 m y 22 px por cada 1,2 m); capturas con recorte ampliado (1-silueta-real-N-zoom.png);
//   2. el plano de Elsa en el andén (escena elsa-anden): siete capturas seguidas de la escena, para ver que Elsa se lee entre los postes y que la cámara queda a la altura de los ojos;
//   3. la charla de Ramón con su indicio, y la leña apilada y las botas con calafates de cerca (luz de las 17), con la tecla E de verdad: el cuaderno anota y el aviso se ve.
// Uso (después de node armar.mjs): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-humo-4-24-1-b.ps1
//   (o con el candado a mano: herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-24-1-b.cjs -Espera 2700 -Perfil <carpeta propia> -Visible)
//   HUMO_SECCIONES=silueta,elsa,objetos (cuáles; por defecto todas) · HUMO_CAPTURAS=0 sin capturas · HUMO_VARIANTES=1 (la silueta: además la de la 4.24.0, para comparar)
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-24-1-b'));
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
  N.avisos = () => [...document.querySelectorAll('#avisos-altos *, .nota, .aviso')].map((x) => x.textContent).join(' | ');
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


    // ================================================================ 1. la silueta del anochecer
    if (va('silueta')) {
      donde = 'silueta';
      console.log('— 1. la silueta del anochecer, a ojo y medida');
      await js(`(() => { const s = document.createElement('style'); s.id = 'sin-ui'; s.textContent = 'body > *:not(#mundo){visibility:hidden !important}'; document.head.appendChild(s); return 1 })()`);
      await N('N.prep(1, 19)');
      await N('(() => { H.clima.estado.lluvia = 0; P.horas = 19; return 1 })()');
      const r = await N('({ x: T.lugares.refugio.x, z: T.lugares.refugio.z })');
      const leer = async (rect) => {
        await esperar(1100);
        const img = await w.webContents.capturePage();
        const { width, height } = img.getSize();
        return { bmp: img.toBitmap(), width, height, png: img.toPNG() };
      };
      const lum = (b, i) => 0.114 * b[i] + 0.587 * b[i + 1] + 0.299 * b[i + 2];
      const medir = (a, b, rc) => {
        let n = 0, suma = 0, minX = 1e9, maxX = -1, minY = 1e9, maxY = -1;
        for (let y = Math.max(0, rc.y0 | 0); y < Math.min(a.height, rc.y1 | 0); y++) for (let x = Math.max(0, rc.x0 | 0); x < Math.min(a.width, rc.x1 | 0); x++) {
          const i = (y * a.width + x) * 4, d = Math.abs(lum(a.bmp, i) - lum(b.bmp, i));
          if (d > 24) { n++; suma += d; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
        }
        return { px: n, contraste: n ? Math.round(suma / n) : 0, alto: maxY >= 0 ? maxY - minY + 1 : 0, ancho: maxX >= 0 ? maxX - minX + 1 : 0 };
      };
      const VARIANTES = process.env.HUMO_VARIANTES === '1' ? [
        { n: 'antes', D: 30, esc: 1.6, piso: 0 },
        { n: 'real' },
      ] : [{ n: 'real' }];
      let nReal = 0, minPx = 999, maxDist = 0, minDist = 999;
      const rumbos = [Math.atan2(-1, -1), Math.atan2(1, -1), Math.atan2(-1, 1), Math.atan2(0, -1)];   // (hacia afuera del refugio, por dos lados)
      for (let ri = 0; ri < rumbos.length; ri++) {
        const a = rumbos[ri];
        const px = r.x - 14, pz = r.z - 14;
        await N(`(() => { H.__presencia().limpiar(); H.jugador.ubicar(${px}, ${pz}, 0); H.jugador.estado.yaw = ${a} - Math.PI; H.jugador.estado.pitch = -0.04; return 1 })()`);
        await N('N.tick(1.2)');
        for (const v of VARIANTES) {
          await N('(() => { H.__presencia().limpiar(); return 1 })()');
          // el duende (en la variante real, el que arma la presencia con sus reglas)
          let info;
          if (v.n === 'real') {
            info = await N(`(() => { const ok = H.__presencia().forzarSilueta(); const s = H.__presencia().silueta(); return ok && s ? { x: s.posicion.x, z: s.posicion.z, escala: 0 } : null })()`);
          } else {
            info = await N(`(() => { const x = ${px} + Math.sin(${a}) * ${v.D}, z = ${pz} + Math.cos(${a}) * ${v.D}; const d = H.__duendesHist().aparecer('rastreador', { x, z, mira: true, escala: ${v.esc}, pisoNoche: ${v.piso} }); return d ? { x, z } : null })()`);
          }
          if (!info) { console.log(`  ${v.n} #${ri}: no se pudo poner (sin lugar)`); continue; }
          await N(`(() => { const j = H.jugador.estado.pos; H.jugador.estado.yaw = Math.atan2(${info.x} - j.x, ${info.z} - j.z) - Math.PI; H.jugador.estado.pitch = -0.02; return 1 })()`);
          await N('N.tick(0.8)');
          const pos = await N(`(() => { const V = H.THREE.Vector3, p = (y) => { const q = new V(${info.x}, H.T.altura(${info.x}, ${info.z}) + y, ${info.z}).project(H.camara); return { x: (q.x * 0.5 + 0.5) * ${ANCHO}, y: (-q.y * 0.5 + 0.5) * ${ALTO}, w: q.z }; }; const j = H.jugador.estado.pos; return { pies: p(0), cabeza: p(1.2), dist: Math.hypot(${info.x} - j.x, ${info.z} - j.z) } })()`);
          const con = await leer();
          const rc = { x0: pos.pies.x - 110, x1: pos.pies.x + 110, y0: pos.pies.y - 300, y1: pos.pies.y + 40 };
          console.log(`  ${v.n} #${ri}: a ${pos.dist.toFixed(1)} m · 1,2 m de alto = ${(pos.pies.y - pos.cabeza.y).toFixed(0)} px de pantalla`);
          if (v.n === 'real') { nReal++; minPx = Math.min(minPx, pos.pies.y - pos.cabeza.y); minDist = Math.min(minDist, pos.dist); maxDist = Math.max(maxDist, pos.dist); }
          if (CAPTURAS) {
            fs.writeFileSync(path.join(salida, `1-silueta-${v.n}-${ri}.png`), con.png);
            try { const { nativeImage } = require('electron'); const im = nativeImage.createFromBuffer(con.png); const x0 = Math.max(0, Math.round(pos.pies.x - 100)), y0 = Math.max(0, Math.round(pos.pies.y - 90)); const rec = im.crop({ x: x0, y: y0, width: Math.min(200, ANCHO - x0), height: Math.min(110, ALTO - y0) }).resize({ width: 800 }); fs.writeFileSync(path.join(salida, `1-silueta-${v.n}-${ri}-zoom.png`), rec.toPNG()); } catch (e) { console.log('  (recorte no: ' + e.message + ')'); }
          }
          await N('(() => { H.__presencia().limpiar(); const l = H.__duendesHist().lista(); l.forEach((d) => d.quitar()); return 1 })()');
          await N('N.tick(0.5)');
        }
      }
      ok(nReal >= 2, `la silueta de la primera hora aparece en ${nReal} de ${rumbos.length} direcciones (cada una con sus árboles y su agua)`);
      ok(nReal === 0 || (minDist >= 17 && maxDist <= 25), `a 17 a 25 m (${minDist.toFixed(1)} a ${maxDist.toFixed(1)} m), no a 30`);
      ok(nReal === 0 || minPx >= 27, `y se ve más grande que a 30 m (22 px por cada 1,2 m): ${minPx.toFixed(0)} px o más`);
      await js(`document.getElementById('sin-ui')?.remove(); 1`);
    }

    // ================================================================ 2. el plano de Elsa en el andén
    if (va('elsa')) {
      donde = 'elsa';
      console.log('— 2. el plano de Elsa en el andén');
      const sinUi = `(() => { if (!document.getElementById('sin-ui2')) { const s = document.createElement('style'); s.id = 'sin-ui2'; s.textContent = 'body > *:not(#mundo){visibility:hidden !important}'; document.head.appendChild(s); } return 1 })()`;
      await N('N.prep(1, 10)');
      await N('(() => { P.historia.escenas.vistas["ramon-tranquera"] = 1; delete P.historia.escenas.vistas["elsa-anden"]; delete P.entradas.viaje; H.clima.estado.lluvia = 0; return 1 })()');
      await N(`(() => { const t = H.tren, e = t.estacion; t.est.subido = false; t.est.conduce = false; t.est.varado = false; t.est.parado = 0; t.est.vel = 7; t.est.s = (t.poste(e) + 60) % t.largo; t.est.proxima = t.paradas.find((p) => p !== e) || e; return 1 })()`);
      await N(`(() => { const e = H.tren.estacion; H.jugador.ubicar(e.espera.x + 4, e.espera.z + 4, 0); return 1 })()`);
      const arranco = await N('N.hasta(() => H.__escenas.activa(), 25)');
      ok(arranco === 1, 'la escena de Elsa arranca sola en el andén');
      await js(sinUi);
      for (let k = 0; k < 7; k++) { await N('N.tick(1.0)'); await foto('2-elsa-' + k); const c = await N('(() => { const q = H.camara.position; return [q.x, q.y, q.z].map((v) => +v.toFixed(1)) })()'); console.log('  cámara', k, JSON.stringify(c)); }
      await N('N.despejar(60)');
      await js("document.getElementById('sin-ui2')?.remove(); 1");
    }

    // ================================================================ 3. la leña y las botas, de cerca, con luz de tarde
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
      await js(`(() => { if (!document.getElementById('sin-ui3')) { const s = document.createElement('style'); s.id = 'sin-ui3'; s.textContent = 'body > *:not(#mundo){visibility:hidden !important}'; document.head.appendChild(s); } return 1 })()`);
      for (const [id, cap, nombre] of [['lena-apilada', 1, 'La leña apilada'], ['botas-calafate', 2, 'Calafates en las botas']]) {
        await N(`N.prep(${cap}, 17)`);
        await N(`(() => { for (const e of ['ramon-tranquera', 'almacen-ercilia', 'ese-no-josefina', 'hacha-tocon', 'placa-herminia', 'mesa-visita-nicanor', 'mesa-visita-ramon', 'fermin-galpon']) P.historia.escenas.vistas[e] = 1; return 1 })()`);
        await N('N.despejar(20, { esc: true })'); await cerrarTarjetas();
        await N('N.tick(1.2)');
        const pos = await N(`(() => { const p = H.__historiaObjetos().posiciones["${id}"]; const m = H.__historiaObjetos().mallas["${id}"]; return p ? { x: p.x, z: p.z, visible: !!(m && m.visible) } : null })()`);
        ok(pos && pos.visible, `${id}: el objeto está en el mundo y se ve`);
        if (!pos) continue;
        // frente a la puerta, a 1,6 m del objeto hacia afuera de la casa, mirándolo (como en las partidas de la 4.16: la mira un poco hacia abajo)
        await N('(() => { if (H.jugador.estado.sentado) H.jugador.sentarse(false); return 1 })()');   // (la segunda E del objeto anterior te sentó a descansar: se levanta)
        const cerca2 = async () => { await N(`(() => { const r = T.lugares.refugio, d = H.__puntosHistoria()['refugio-puerta'], p = H.__historiaObjetos().posiciones["${id}"]; const ox = d.x - r.x, oz = d.z - r.z, ol = Math.hypot(ox, oz) || 1; const x = p.x + ox / ol * 0.95, z = p.z + oz / ol * 0.95; H.jugador.ubicar(x, z, Math.atan2(x - p.x, z - p.z)); H.jugador.estado.pitch = -0.75; return 1 })()`); await N('N.tick(0.5)'); };
        const parar = (pitch) => N(`(() => { const r = T.lugares.refugio, d = H.__puntosHistoria()['refugio-puerta'], p = H.__historiaObjetos().posiciones["${id}"]; const ox = d.x - r.x, oz = d.z - r.z, ol = Math.hypot(ox, oz) || 1; const x = p.x + ox / ol * 1.6, z = p.z + oz / ol * 1.6; H.jugador.ubicar(x, z, Math.atan2(x - p.x, z - p.z)); H.jugador.estado.pitch = ${pitch}; return 1 })()`);
        await parar(-0.28);
        await N('N.tick(1)');
        const cercaDe = `(() => { const c = H.__objetoHistoriaCerca(); return c ? { id: c.id, aviso: c.aviso } : null })()`;
        const cerca = await N(cercaDe);
        ok(cerca && cerca.id === id, `${id}: la E lo reconoce de cerca (${JSON.stringify(cerca)})`);
        await cerca2(); await foto(`3-${id}-cerca-antes`);
        await parar(-0.28); await N('N.tick(0.5)');
        await parar(-0.28); await N('N.tick(0.7)');   // (después de la captura se vuelve a parar, como las partidas de la 4.16)
        await N('N.tecla("KeyE")'); await N('N.tick(1.2)');
        // (4.24.0: la E tiene que llegar al objeto aunque el banco de la puerta esté en la mira; si no llega se dice y se usa la acción directa para seguir con lo demás)
        let porTecla = await N(`(P.historia.raro || []).some((x) => x.id === "${id}")`);
        if (!porTecla) {
          console.log('  aviso: la tecla E no llegó al objeto en esta posición (' + JSON.stringify(await N(`({ sentado: !!H.jugador.estado.sentado, pitch: H.jugador.estado.pitch })`)) + '): se usa la acción directa del objeto');
          await N('(() => { if (H.jugador.estado.sentado) H.jugador.sentarse(false); return 1 })()'); await N('N.tick(0.5)');
          await N('(() => { const c = H.__objetoHistoriaCerca(); if (c) c.hacer(); return 1 })()'); await N('N.tick(0.8)');
        }
        ok(porTecla, `${id}: la tecla E lo mira (parado frente a la puerta, con el banco del umbral en la mira)`);
        ok(await N(`(P.historia.raro || []).some((x) => x.id === "${id}")`), `${id}: se mira el objeto y el cuaderno anota el indicio`);
        ok((await N(`N.hasta(() => new RegExp(${JSON.stringify(nombre)}).test(N.avisos()), 10)`)) === 1, `${id}: se ve el aviso «${nombre}»`);
        await cerca2(); await foto(`3-${id}-cerca-despues`);
        await N('N.tecla("KeyE")'); await N('N.tick(0.6)');
        ok(await N(`(P.historia.raro || []).filter((x) => x.id === "${id}").length === 1`), `${id}: una segunda E no anota de nuevo`);
      }
      await js("document.getElementById('sin-ui3')?.remove(); 1");
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

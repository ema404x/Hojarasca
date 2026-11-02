// 4.19.0 (C): las dos sospechas de cámara de la 4.18.4 (BUGS_4_18_4_C.md, S-1): cámara «metida en un sólido» en las escenas del galpón del jugador (galpon-golpe, galpon-ronda,
// galpon-encuentro, galpon-sin-golpear, pluma-umbral) y junto al coihue grande (piedras-molino, coihue-talado). Es el barrido de humo-4-18-4-escenas.cjs (reloj falso de 50 ms por cuadro:
// el mismo recorrido en cualquier PC) pero, por cada tramo en que la cámara quedó dentro de algo, saca capturas en el cuadro del tramo (con un cuadro de 0 ms antes, para que la captura
// no salga con un cuadro de retraso) y anota hasta dónde se metió. Así se mira a ojo cuáles son bugs de verdad.
// Uso (después de `node armar.mjs`): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-19-0-c-camara.cjs -Espera 1500 -Perfil <carpeta propia> -Visible
//   ESC_SOLO=id1,id2 · ESC_PERFIL=trato|pelea · ESC_SALIDA=<json> · ESC_FOTOS_DIR=<carpeta> · ESC_TRAMOS=2 (cuántos tramos se fotografían por escena)
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const { DETERMINISTA } = require('./ayuda-determinista.cjs');
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 44 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 44 * 60 * 1000).unref?.();
const PERFILES = (process.env.ESC_PERFIL || 'trato,pelea').split(',').filter(Boolean);
const DESDE = Number(process.env.ESC_DESDE || 0), HASTA = Number(process.env.ESC_HASTA || 1e9);
const SOLO = (process.env.ESC_SOLO || '').split(',').filter(Boolean);
const SALIDA = process.env.ESC_SALIDA || path.join(process.env.TEMP || raiz, 'camara-4-19-0.json');
const FOTOS = (process.env.ESC_FOTO || '').split(',').filter(Boolean);
const DIR_FOTOS = process.env.ESC_FOTOS_DIR || path.join(raiz, 'pruebas', 'salidas', 'camara-4-19-0');
const TRAMOS = Number(process.env.ESC_TRAMOS || 2);
const HTML = process.env.HTML ? path.resolve(process.env.HTML) : null;
const RECARGAR_CADA =Number(process.env.ESC_RECARGA || 24);   // cada tantas corridas se recarga el juego (los efectos de las escenas se van acumulando)

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, T = H.T, P = H.progreso;
  const N = window.__N = {};
  const dir = () => H.__escenas.director;
  N.ids = () => dir().ids();
  const frames = (n) => window.__cuadros(n, 50);
  N.perfil = (p) => {
    const h = P.historia;
    h.activa = true; h.empezada = h.empezada || 1; h.version = 2; h.capitulo = 12; h.fase = 'jugando';
    const trato = p === 'trato';
    Object.assign(h.decisiones, trato ? { bolsa: 'a', coihue: 'a', molienda: 'c', cuaderno: 'a', majada: 'a', duendes: 'a' } : { bolsa: 'c', coihue: 'b', molienda: 'a', cuaderno: 'b', majada: 'c', duendes: 'c' });
    h.duendes.trato = trato ? 'trato' : 'pelea';
    for (const k of Object.keys(h.lazos)) h.lazos[k] = trato ? 2 : -1;
    h.acompanante = null;
    return 1;
  };
  // lo que no puede pasar nunca en la partida (como en humo-caos)
  N.malasDeLaPartida = () => {
    const mal = [], js = H.jugador.estado, p = js.pos;
    if (![p.x, p.y, p.z, js.yaw, js.pitch].every(Number.isFinite)) mal.push('jugador no finito');
    else if (!js.enTren && !js.nadando && !js.enKayak && !js.enVela && p.y < H.T.altura(p.x, p.z) - 1.5) mal.push('jugador bajo el suelo ' + (p.y - H.T.altura(p.x, p.z)).toFixed(2));
    if (!Number.isFinite(P.horas) || !Number.isFinite(P.dia)) mal.push('hora o día no finitos');
    for (const [k, n] of Object.entries(P.materiales || {})) if (!Number.isFinite(n) || n < 0) mal.push('material ' + k + ' = ' + n);
    for (const [k, e] of Object.entries(P.entradas || {})) if (e && e.cantidad !== undefined && (!Number.isFinite(e.cantidad) || e.cantidad < 0)) mal.push('entrada ' + k + ' = ' + e.cantidad);
    for (const [k, n] of Object.entries(P.cosas || {})) if (typeof n === 'number' && (!Number.isFinite(n) || n < 0)) mal.push('cosa ' + k + ' = ' + n);
    if (!Number.isFinite(P.ramitas) || P.ramitas < 0) mal.push('ramitas = ' + P.ramitas);
    const pe = P.economia && P.economia.pesos; if (pe !== undefined && (!Number.isFinite(pe) || pe < 0)) mal.push('pesos = ' + pe);
    for (const [k, n] of Object.entries(P.historia.lazos || {})) if (!Number.isFinite(n) || n < -2 || n > 3) mal.push('lazo ' + k + ' = ' + n);
    return mal;
  };
  N.jugar = async (id, o) => {
    const d = dir(), res = { id, perfil: o.perfil, frames: 0, elec: [], errores: [], malas: [], dur: 0 };
    for (let i = 0; i < 6 && H.__escenas.activa(); i++) { d.saltar(); frames(6); }
    for (const b of document.querySelectorAll('#valle-tarjeta button[data-valle-opcion]')) { b.click(); break; }
    N.perfil(o.perfil);
    P.horas = 10;
    try { H.__colocarEscena(id); } catch (e) { res.errores.push('colocar: ' + e.message); }
    frames(8);
    const antes = { dia: P.dia, horas: P.horas };
    // (recién cargado el juego puede no estar listo para empezar una escena: se reintenta unos segundos antes de decir que no disparó)
    let disparo = false;
    for (let k = 0; k < 12 && !disparo; k++) { disparo = H.__escenas.disparar(id, { forzar: true }); if (!disparo) { for (const b of document.querySelectorAll('#valle-tarjeta button[data-valle-opcion]')) { b.click(); break; } frames(20); } }
    if (!disparo) { res.noDisparo = true; return res; }
    let solido = 0, solidoMax = 0, maxF = 5200;   // 260 s de escena
    const bola = { x: 0, y: 0, z: 0 };
    res.tramos = []; let tramo = null;
    for (let f = 0; f < maxF; f++) {
      frames(1); res.frames++;
      if (o.hasta !== undefined && f >= o.hasta) { const c = H.camara.position, ses = d.__sesion(); res.pausado = true; res.cam = { x: +c.x.toFixed(2), y: +c.y.toFixed(2), z: +c.z.toFixed(2), suelo: +T.altura(c.x, c.z).toFixed(2), yaw: +H.camara.rotation.y.toFixed(2), pitch: +H.camara.rotation.x.toFixed(2) }; res.foco = ses && ses.camara && ses.camara.pose && ses.camara.pose.foco ? ses.camara.pose.foco : null; res.dialogo = (d.datos() || {}).dialogo ? d.datos().dialogo.texto : null; return res; }
      let dat = d.datos();
      if (!dat || !d.activa()) {
        // ¿otra escena que el juego dispara sola al terminar ésta (una cadena)? se la lee también
        frames(12);
        if (d.activa() && d.idActual() !== id) { res.encadenadas = (res.encadenadas || []).concat(d.idActual()); dat = d.datos(); if (!dat) continue; } else break;
      }
      if (f % 4 === 0) {
        const c = H.camara.position;
        if (![c.x, c.y, c.z].every(Number.isFinite)) { res.malas.push('cámara no finita'); break; }
        const suelo = T.altura(c.x, c.z);
        const fase = d.fase();
        if (fase === 'saliendo') res.minSaliendo = Math.min(res.minSaliendo === undefined ? 1e9 : res.minSaliendo, +(c.y - suelo).toFixed(2)); else res.minCorriendo = Math.min(res.minCorriendo === undefined ? 1e9 : res.minCorriendo, +(c.y - suelo).toFixed(2));
        if (c.y < suelo - 0.02 && !res.bajoSuelo) { res.bajoSuelo = true; res.malas.push('cámara bajo el suelo en el cuadro ' + f + ' (' + (c.y - suelo).toFixed(2) + ' m) en la fase «' + fase + '»'); }
        bola.x = c.x; bola.y = c.y - 0.45; bola.z = c.z;
        const x0 = bola.x, z0 = bola.z;
        try { H.col.resolver(bola, 0.22, 0.7); } catch (e) { /* sin colisión */ }
        const mov = Math.hypot(bola.x - x0, bola.z - z0);
        if (mov > 0.06) { if (!tramo) { const se = d.__sesion(); tramo = { f0: f, f1: f, x: +c.x.toFixed(2), y: +c.y.toFixed(2), z: +c.z.toFixed(2), suelo: +suelo.toFixed(2), fase, mov: 0, foco: se && se.camara && se.camara.pose && se.camara.pose.foco ? { x: +se.camara.pose.foco.x.toFixed(1), z: +se.camara.pose.foco.z.toFixed(1) } : null }; res.tramos.push(tramo); } tramo.f1 = f; tramo.mov = Math.max(tramo.mov, +mov.toFixed(2)); solido++; solidoMax = Math.max(solidoMax, solido); if (solido === 8) res.malas.push('cámara metida en un sólido (8 muestras seguidas) en el cuadro ' + f + ' a ' + c.x.toFixed(1) + ',' + c.z.toFixed(1)); } else { solido = 0; tramo = null; }
      }
      if (dat.eleccion) {
        if (d.eleccionLista()) { const n = dat.eleccion.opciones.length, k = o.perfil === 'pelea' ? n - 1 : 0; res.elec.push(dat.eleccion.id + ':' + dat.eleccion.opciones[k].id); d.elegir(k); }
      } else if (dat.dialogo) d.avanzar();
      if (f % 15 === 0) for (const e of d.errores()) if (!res.errores.includes(e)) res.errores.push(e);
      if (f % 50 === 49) await new Promise((r) => setTimeout(r, 0));
    }
    res.dur = +(res.frames * 0.05).toFixed(1);
    if (d.activa()) { res.noCierra = true; res.idx = d.datos() && d.datos().id; d.saltar(); for (let i = 0; i < 6 && d.activa(); i++) frames(10); }
    frames(40);   // la cámara vuelve al jugador
    if (H.__escenas.activa()) res.malas.push('la escena sigue activa después de saltarla');
    if (document.body.classList.contains('escena-en-curso') || document.body.classList.contains('escena-saliendo')) res.malas.push('quedaron las barras de cine');
    if (H.__escenas.capturados().length) res.malas.push('personajes sin soltar: ' + H.__escenas.capturados().join(','));
    const c = H.camara.position, j = H.jugador.estado.pos;
    if (Math.hypot(c.x - j.x, c.z - j.z) > 3 || Math.abs(c.y - (j.y + 1.62)) > 2.5) res.malas.push('la cámara no volvió al jugador (' + Math.hypot(c.x - j.x, c.z - j.z).toFixed(1) + ' m)');
    for (const m of N.malasDeLaPartida()) res.malas.push(m);
    const fallas = H.__caidas.fallas(); if (fallas.length) res.malas.push('fallas de sistema: ' + JSON.stringify(fallas).slice(0, 200));
    res.horaSalto = +(((P.dia - antes.dia) * 24) + (P.horas - antes.horas)).toFixed(2);
    res.solidoMax = solidoMax;
    return res;
  };
  N.cerrar = () => { const d = dir(); for (let i = 0; i < 8 && d.activa(); i++) { d.saltar(); frames(10); } frames(20); return !d.activa(); };
  return 1;
})()`;

app.whenReady().then(async () => {
  const consola = [];
  const { ipcMain } = require('electron');
  require(path.join(raiz, 'copias-main.cjs')).registrarCopias({ ipcMain, app });
  require(path.join(raiz, 'fotos-main.cjs')).registrarFotos({ ipcMain, app });
  const w = new BrowserWindow({ show: true, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false, preload: path.join(raiz, 'preload.cjs') } });
  let donde = 'carga', escenaActual = '';
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) consola.push({ en: escenaActual, m: m.slice(0, 300) });
  });
  w.webContents.on('render-process-gone', (e, d) => { console.log('PROCESO DE LA PÁGINA CAÍDO en ' + escenaActual + ':', JSON.stringify(d)); consola.push({ en: escenaActual, m: 'render-process-gone ' + JSON.stringify(d) }); });
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 150 s (${donde})`)), 150000))]);
  const url = HTML || path.join(raiz, 'index.html');
  const ajustes = `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'relax', relaxTipo:'historia', autoCalidad:false, guiaPrimerDia:false})); 1`;
  const abrir = async () => {
    await w.loadFile(url, { search: '?debug=1' }); await js(ajustes); await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false); }
    if (!listo) throw new Error('el juego no cargó');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js('window.__sinPausaPorBlur = true; 1');
    await js(DETERMINISTA(4184));
    await js(PAGINA);
    await js('window.__cuadros(60, 50)');
    // la tarjeta de «empezar» del capítulo 1, si salió
    await js(`(() => { for (let i = 0; i < 3; i++) { const b = document.querySelector('#valle-tarjeta button[data-valle-opcion]'); if (b) { b.click(); window.__cuadros(10, 50); } } return 1 })()`);
  };
  const resultados = [];
  try {
    await abrir();
    // ESC_FOTO=id:cuadro,id:cuadro: se corre cada escena hasta ese cuadro y se saca una captura (para mirar a ojo lo que marcó el barrido)
    if (FOTOS.length) {
      fs.mkdirSync(DIR_FOTOS, { recursive: true });
      for (const f of FOTOS) {
        const [id, cuadro, perfil] = f.split(':');
        donde = `foto ${id}:${cuadro}`;
        const r = await js(`window.__N.jugar(${JSON.stringify(id)}, { perfil: ${JSON.stringify(perfil || 'trato')}, hasta: ${Number(cuadro)} })`);
        await js('window.__cuadros(1, 0)'); await esperar(450);
        let ok = false;
        for (let k = 0; k < 3 && !ok; k++) { try { fs.writeFileSync(path.join(DIR_FOTOS, `${id}-${cuadro}.png`), (await w.webContents.capturePage()).toPNG()); ok = true; } catch (e) { await esperar(600); } }
        console.log(`captura ${id}-${cuadro}.png ${ok ? '' : '(NO SE PUDO)'} ${JSON.stringify({ cam: r.cam, foco: r.foco, dialogo: r.dialogo && r.dialogo.slice(0, 60), noDisparo: r.noDisparo })}`);
        await js('window.__N.cerrar()');
      }
      try { app.exit(0); } catch { process.exit(0); }
      return;
    }
    let ids = await js('window.__N.ids()');
    console.log(`escenas registradas: ${ids.length}`);
    if (SOLO.length) ids = ids.filter((x) => SOLO.includes(x));
    ids = ids.slice(DESDE, HASTA);
    let n = 0;
    for (const id of ids) {
      for (const perfil of PERFILES) {
        if (n && n % RECARGAR_CADA === 0) { donde = 'recarga'; await abrir(); }
        n++;
        donde = `${id} (${perfil})`; escenaActual = donde;
        let r;
        try { r = await js(`window.__N.jugar(${JSON.stringify(id)}, { perfil: ${JSON.stringify(perfil)} })`); }
        catch (e) { r = { id, perfil, excepcion: String(e.message || e) }; try { await abrir(); } catch (e2) { console.log('no se pudo reabrir: ' + e2.message); break; } }
        resultados.push(r);
        if (r.tramos && r.tramos.length) {
          console.log('      tramos con la cámara dentro de algo: ' + r.tramos.map((q) => q.fase + ' cuadros ' + q.f0 + '-' + q.f1 + ' en ' + q.x + ',' + q.z + ' (y ' + q.y + ', suelo ' + q.suelo + ', empuje ' + q.mov + ' m' + (q.foco ? ', foco ' + q.foco.x + ',' + q.foco.z : '') + ')').join(' | '));
          fs.mkdirSync(DIR_FOTOS, { recursive: true });
          for (const tr of [...r.tramos].sort((p, q) => q.mov - p.mov).slice(0, TRAMOS)) {
            for (const [letra, cuadro] of [['a', Math.max(0, tr.f0 - 12)], ['b', Math.floor((tr.f0 + tr.f1) / 2)]]) {
              donde = 'foto ' + id + ':' + cuadro;
              const rf = await js('window.__N.jugar(' + JSON.stringify(id) + ', { perfil: ' + JSON.stringify(perfil) + ', hasta: ' + cuadro + ' })');
              await js('window.__cuadros(1, 0)'); await esperar(450);
              let hecho = false;
              for (let k = 0; k < 3 && !hecho; k++) { try { fs.writeFileSync(path.join(DIR_FOTOS, id + '-' + perfil + '-' + tr.f0 + letra + '.png'), (await w.webContents.capturePage()).toPNG()); hecho = true; } catch (e) { await esperar(600); } }
              console.log('      captura ' + id + '-' + perfil + '-' + tr.f0 + letra + '.png (cuadro ' + cuadro + ')' + (hecho ? '' : ' NO SE PUDO') + ' ' + JSON.stringify({ cam: rf.cam, foco: rf.foco, dialogo: rf.dialogo && rf.dialogo.slice(0, 50) }));
              await js('window.__N.cerrar()');
            }
          }
          donde = id + ' (' + perfil + ')';
        }
        const mal = r.noDisparo || r.noCierra || r.excepcion || (r.malas && r.malas.length) || (r.errores && r.errores.length);
        console.log(`${mal ? '✗' : '✓'} ${id} [${perfil}] ${r.dur ?? '?'} s${r.elec && r.elec.length ? ' · ' + r.elec.join(' ') : ''}${r.noDisparo ? ' · NO DISPARÓ' : ''}${r.noCierra ? ' · NO CIERRA' : ''}${r.excepcion ? ' · EXCEPCIÓN ' + r.excepcion : ''}${r.malas && r.malas.length ? '\n      ' + r.malas.join('\n      ') : ''}${r.errores && r.errores.length ? '\n      director: ' + r.errores.join(' | ') : ''}`);
      }
    }
  } catch (e) { console.log('ERROR:', e && e.stack || e); }
  fs.writeFileSync(SALIDA, JSON.stringify({ resultados, consola }, null, 1));
  const malos = resultados.filter((r) => r.noDisparo || r.noCierra || r.excepcion || (r.malas && r.malas.length) || (r.errores && r.errores.length));
  console.log(`\n${resultados.length} corridas, ${malos.length} con algo raro, ${consola.length} errores de consola (detalle en ${SALIDA})`);
  for (const c of consola.slice(0, 20)) console.log('  consola [' + c.en + ']: ' + c.m);
  try { app.exit(malos.length || consola.length ? 1 : 0); } catch { process.exit(1); }
});

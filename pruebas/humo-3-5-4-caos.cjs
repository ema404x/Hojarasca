// Partida real 3.5.4: caos y errores. Con perfil propio (no pisa el de las otras pruebas) y
// semilla (la de las acciones y la del azar del juego: ver herramientas/caos-preload.cjs).
// Lo que encontró el caos largo (herramientas/caos-largo.cjs) y no tiene que volver:
//  1. F1 en el modo foto abría la pausa y la guía con el modo foto prendido debajo; y en el modo
//     foto la rueda y los clics usaban lo que tenías en la mano.
//  1b. Un clic derecho usaba la ranura dos veces (jugador.js y main.js): comía dos panes, y la
//     linterna o la caña se prendían y se apagaban en el mismo clic.
//  2. Una partida con una obra lejísimos (z = 1e308) colgaba la carga para siempre; con todas
//     lejos, "No se pudo armar el bosque: Invalid array length". Ahora llega a la portada,
//     entra y juega, sin esas obras.
//  3. El Desafío carga sin avisos de three (las boleadoras pasaban por toNonIndexed).
//  4. Un caos corto con semilla en Relax y en Desafío (las mismas acciones que el largo, sin
//     recargas): ninguna falla de sistema, ningún error, nada en NaN ni en un estado imposible.
// Uso: npx electron --no-sandbox pruebas/humo-3-5-4-caos.cjs   (CAOS_SEMILLA=354, CAOS_PASOS=120)
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { AYUDA } = require('../herramientas/caos-ayuda.cjs');
const raiz = path.resolve(__dirname, '..');
const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'hojarasca-humo-354-'));
app.setPath('userData', perfil);
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const SEMILLA = Number(process.env.CAOS_SEMILLA || 354) >>> 0;
const PASOS = Number(process.env.CAOS_PASOS || 120);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
let s = SEMILLA || 1;
const azar = () => { s = (s ^ (s << 13)) >>> 0; s = (s ^ (s >>> 17)) >>> 0; s = (s ^ (s << 5)) >>> 0; return s / 4294967296; };

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  const w = new BrowserWindow({ show: false, width: 1024, height: 640,
    webPreferences: { backgroundThrottling: false, contextIsolation: false, preload: path.join(raiz, 'herramientas', 'caos-preload.cjs'), additionalArguments: [`--caos-semilla=${SEMILLA}`] } });
  w.webContents.session.on('will-download', (_e, item) => item.setSavePath(path.join(perfil, 'bajado-' + item.getFilename())));
  let caida = null;
  w.webContents.on('render-process-gone', (_e, d) => { caida = JSON.stringify(d); });
  const js = (c, limite = 60000) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en ${limite / 1000} s`)), limite))]);
  const ok = (cond, texto) => { pasos.push(`${cond ? '✓' : '✗'} ${texto}`); console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const url = path.join(raiz, process.env.CAOS_INDEX || 'index.html');
  const H = 'window.__hojarasca';
  const AJ = (modo) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'${modo}', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'}));`;
  const listo = async (seg = 90) => {
    for (const hasta = Date.now() + seg * 1000; Date.now() < hasta;) {
      await esperar(500);
      const e = await js(`(()=>({ ok: !!(window.__hojarasca && window.__hojarasca.__caidas), carga: document.getElementById('carga-texto')?.textContent || '' }))()`, 5000).catch(() => null);
      if (e?.ok) return { ok: true };
      if (e && /No se pudo/.test(e.carga)) return { ok: false, motivo: e.carga };
    }
    return { ok: false, motivo: `no llegó a la portada en ${seg} s` };
  };
  // abre con lo que haya en localStorage después de `antes` (un texto de JS)
  // (una partida que cuelga el arranque nunca termina de cargar: no se espera más de 20 s)
  const cargar = () => Promise.race([w.loadFile(url, { search: '?debug=1' }).catch(() => 0), esperar(20000)]);
  const abrirCon = async (modo, antes = '') => {
    await cargar();
    await js(`localStorage.clear(); ${AJ(modo)} ${antes} 1`);
    await cargar();
    return listo();
  };
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(1500);
    await js(`(${AYUDA.toString()})(); ${H}.ajustes.limiteFps = 'libre'; ${H}.__valle?.azar(true); if (${H}.__caidas.modo() !== 'jugando') ${H}.volverAlJuego(); 1`);
  };
  const tecla = (code) => `document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', key: '${code}', bubbles: true, cancelable: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', key: '${code}', bubbles: true }));`;
  const registro = () => js(`window.__caos.registro.splice(0)`);
  const IGNORAR = /Electron Security Warning|GL_INVALID|Autofill|favicon|AudioContext/;

  try {
    // ------------------------------------------------------------ 1. F1 en el modo foto
    let l = await abrirCon('relax');
    ok(l.ok, 'carga el Relax');
    await entrar();
    let e = await js(`(async()=>{ const H = ${H}, A = window.__caosAyuda; await A.cuadros(4);
      ${tecla('F2')} await A.cuadros(3);
      const foto = H.__foto().activo;
      ${tecla('F1')} await A.cuadros(3);
      const r = { foto, sigue: H.__foto().activo, modo: H.__caidas.modo(), guia: !document.getElementById('guia').classList.contains('oculto'), pausa: !document.getElementById('pausa').classList.contains('oculto') };
      ${tecla('F2')} await A.cuadros(3);
      r.salio = !H.__foto().activo;
      ${tecla('F1')} await A.cuadros(2);
      r.guiaFuera = !document.getElementById('guia').classList.contains('oculto'); r.modoFuera = H.__caidas.modo();
      ${tecla('F1')} await new Promise((x) => setTimeout(x, 450)); ${tecla('Escape')} await A.cuadros(2);
      r.vuelve = H.__caidas.modo();
      return r })()`);
    ok(e.foto && e.sigue && e.modo === 'jugando' && !e.guia && !e.pausa, `F1 en el modo foto no abre la pausa ni la guía (${JSON.stringify(e)})`);
    ok(e.salio && e.guiaFuera && e.modoFuera === 'pausa', 'fuera del modo foto, F1 sigue abriendo la guía');
    ok(e.vuelve === 'jugando', 'y F1 + Esc vuelve al juego');

    // ------------------------------------------------------------ 1b. el clic derecho, una vez
    e = await js(`(async()=>{ const H = ${H}, A = window.__caosAyuda; H.volverAlJuego();
      H.progreso.entradas['pan-casero'] = { dia: 1, hora: 9, cantidad: 6 }; await A.cuadros(4);
      const ir = async (re) => { for (let i = 1; i <= 8; i++) { await A.tecla('Digit' + i, 1); if (re.test(H.__ranuraActual())) return true; } return false; };
      const c = document.getElementById('mundo'), o = { button: 2, buttons: 2, bubbles: true, cancelable: true, clientX: 500, clientY: 300 };
      const derecho = async () => { c.dispatchEvent(new MouseEvent('mousedown', o)); c.dispatchEvent(new MouseEvent('mouseup', { ...o, buttons: 0 })); await A.cuadros(2); };
      const r = { pan: await ir(/pan/i), antes: H.progreso.entradas['pan-casero'].cantidad };
      await derecho(); r.despues = H.progreso.entradas['pan-casero'].cantidad;
      r.luz = await ir(/linterna/i); const l0 = H.linterna.intensity; await derecho(); r.luzAntes = l0; r.luzDespues = H.linterna.intensity; await derecho();
      // en el modo foto el mouse es de la cámara: ni la rueda ni el clic derecho
      await ir(/pan/i); const n0 = H.progreso.entradas['pan-casero'].cantidad, ranura0 = H.__ranuraActual();
      ${tecla('F2')} await A.cuadros(2);
      await derecho(); window.dispatchEvent(new WheelEvent('wheel', { deltaY: 120 })); await A.cuadros(2);
      r.fotoPan = H.progreso.entradas['pan-casero'].cantidad - n0; r.fotoRanura = H.__ranuraActual() === ranura0;
      ${tecla('F2')} await A.cuadros(2);
      return r })()`);
    ok(e.pan && e.despues === e.antes - 1, `un clic derecho come un pan, no dos (${e.antes} → ${e.despues})`);
    ok(e.luz && e.luzAntes === 0 && e.luzDespues > 0, `y prende la linterna (antes se prendía y se apagaba en el mismo clic: ${e.luzAntes} → ${e.luzDespues})`);
    ok(e.fotoPan === 0 && e.fotoRanura, `en el modo foto el clic derecho no come y la rueda no cambia lo que tenés en la mano (${JSON.stringify({ pan: e.fotoPan, ranura: e.fotoRanura })})`);

    // ------------------------------------------------------------ 2. obras lejísimos
    const base = await js(`(async()=>{ const H = ${H}, P = H.progreso, r = H.T.lugares.refugio;
      P.dia = 6; P.ramitas = 17;
      for (const [id, dx] of [['cantero', 10], ['tendal', 16], ['buzon', 22]]) if (H.PLANOS.some((q) => q.id === id)) P.obras.push({ plano: id, x: r.x + dx, z: r.z + 12, rot: 0, etapas: H.PLANOS.find((q) => q.id === id).etapas?.length || 1 });
      H.obras.sincronizar(P.obras); P.obras = H.obras.obras.map((o) => o.datos); H.volverAlJuego(); H.guardar();
      return localStorage.getItem('hojarasca-v1') })()`);
    const p0 = JSON.parse(base);
    ok(p0.obras.length >= 3, `hay una partida con ${p0.obras.length} obras`);
    for (const [nombre, cambiar, quedan] of [
      ['una obra en z = 1e308', (p) => { p.obras[1].z = 1e308; }, p0.obras.length - 1],
      ['todas las obras en x = -1e20', (p) => { for (const o of p.obras) o.x = -1e20; }, 0],
    ]) {
      const p = JSON.parse(base); cambiar(p);
      const t0 = Date.now();
      l = await abrirCon('relax', `localStorage.setItem('hojarasca-v1', ${JSON.stringify(JSON.stringify(p))});`);
      if (!l.ok) {
        ok(false, `${nombre}: llega a la portada (${l.motivo})`);
        // colgada: se tira abajo la página de la prueba para seguir
        if (!(await js('1', 5000).then(() => true).catch(() => false))) { w.webContents.forcefullyCrashRenderer(); await esperar(1500); }
        continue;
      }
      await entrar();
      e = await js(`(async()=>{ const H = ${H}, A = window.__caosAyuda; for (const t of ['KeyW', 'KeyE', 'KeyO', 'KeyO', 'KeyI', 'KeyI']) await A.tecla(t, 3); await A.cuadros(10);
        return { dia: H.progreso.dia, ramitas: H.progreso.ramitas, obras: H.obras.obras.length, lejos: H.obras.obras.filter((o) => Math.abs(o.datos.x) > 2000 || Math.abs(o.datos.z) > 2000).length, mal: A.revisar({ soltado: true }) } })()`);
      ok(e.dia === 6 && e.ramitas >= 17 && e.obras === quedan && !e.lejos && !e.mal.length, `${nombre}: carga en ${((Date.now() - t0) / 1000).toFixed(0)} s, entra y juega, sin las obras lejos (${JSON.stringify(e)})`);
      for (const r of await registro()) if (r.tipo !== 'warn' && !IGNORAR.test(r.texto)) ok(false, `${nombre}: ${r.tipo}: ${r.texto.slice(0, 300)}`);
    }

    // ------------------------------------------------------------ 3 y 4. el caos corto, con semilla
    for (const modo of ['relax', 'desafio']) {
      l = await abrirCon(modo);
      ok(l.ok, `carga el ${modo}`);
      const avisosCarga = (await registro()).filter((r) => r.tipo === 'warn' && /toNonIndexed/.test(r.texto));
      if (modo === 'desafio') ok(!avisosCarga.length, `el Desafío carga sin avisos de toNonIndexed (${avisosCarga.length})`);
      await entrar();
      if (modo === 'desafio') await js(`(()=>{ const P = ${H}.progreso; for (const k of ['arco', 'lanza', 'honda', 'boleadoras', 'ballesta', 'facon', 'maza', 'arpon', 'hachuela', 'jabalina', 'granada', 'humo', 'bengala', 'cuerno', 'rodela', 'carcaj']) P.cosas[k] = 1;
        Object.assign(P.desafio, { flechas: 40, flechasFuego: 20, virotes: 30, hachuelas: 10, jabalinas: 10, granadas: 10, humos: 8, bengalas: 8, boleadoras: 10, tutorial: 99 }); return 1 })()`);
      const vistos = new Set(), ultimas = [];
      let fuera = 0;
      for (let i = 1; i <= PASOS && !caida; i++) {
        const sem = Math.floor(azar() * 4294967296);
        let desc;
        try { desc = await js(`window.__caosAyuda.accion(null, ${sem})`); } catch (err) { desc = 'excepción: ' + err.message; ok(false, `${modo} paso ${i}: ${err.message}`); break; }
        ultimas.push(`#${i} ${desc}`); if (ultimas.length > 8) ultimas.shift();
        const r = await js(`(()=>{ const A = window.__caosAyuda; return { mal: A.revisar({ soltado: true }), ...A.drenar(), modo: window.__hojarasca.__caidas.modo() } })()`);
        const malos = [...r.mal, ...r.fallas.map((f) => `falla de sistema ${f.nombre}: ${f.mensaje}`), ...r.reg.filter((x) => x.tipo !== 'warn' && !IGNORAR.test(x.texto)).map((x) => `${x.tipo}: ${x.texto.slice(0, 400)}`)];
        for (const m of malos) { const k = m.slice(0, 120); if (vistos.has(k)) continue; vistos.add(k); ok(false, `${modo} paso ${i}: ${m}\n      ${ultimas.join('\n      ')}`); }
        // como un jugador: si quedó en un menú unos pasos, Esc; en la portada, entrar
        fuera = r.modo === 'jugando' ? 0 : fuera + 1;
        if (r.modo === 'inicio') await entrar();
        else if (fuera >= 3) { await js(`(async()=>{ await window.__caosAyuda.tecla('Escape', 1); return 1 })()`); await esperar(450); }
        if (fuera >= 10) { await js(`(()=>{ const H = ${H}; if (!H.__caidas.dialogos.abierto()) H.volverAlJuego(); return 1 })()`); fuera = 0; }
      }
      ok(!caida, `${modo}: ${PASOS} acciones al azar (semilla ${SEMILLA}) sin que se caiga la página${caida ? ' (' + caida + ')' : ''}`);
      ok(![...vistos].length, `${modo}: sin fallas, errores, NaN ni estados imposibles`);
    }
  } catch (err) {
    errores.push('excepción: ' + (err && err.stack ? err.stack : err));
  }
  try { fs.rmSync(perfil, { recursive: true, force: true }); } catch { /* Windows lo suelta después */ }
  const malos = pasos.filter((p) => p.startsWith('✗')).length;
  if (errores.length) { console.log(`\nFALLÓ (${malos} de ${pasos.length}):\n- ` + [...new Set(errores)].join('\n- ')); app.exit(1); return; }
  console.log(`\nOK 3.5.4 caos · ${pasos.length} pasos · semilla ${SEMILLA}`);
  app.exit(0);
});

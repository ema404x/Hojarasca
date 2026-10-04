// 3.6: mide la carga y el costo de cada cuadro en vistas fijas del valle, para comparar versiones
// (la 3.5.4 contra la 3.6, o antes y después de un cambio) en la misma máquina.
//
// Cada corrida es un proceso con un perfil propio (NUNCA el del jugador): una carga para
// calentar la caché, una partida nueva (medida), se guarda y se recarga la partida guardada
// (medida, sólo en el Relax). Después, en cada vista: se planta el jugador en un punto fijo con un
// rumbo y una hora fijos, se dejan correr cuadros para que se acomoden el LOD, los bloques del
// bosque y lo que se monta de a uno, y se miden N cuadros a mano (`__bucle`) con `gl.finish()`
// después de cada uno: el tiempo es CPU + placa del cuadro entero (sin vsync ni límite). Los
// dibujos y triángulos son los de un cuadro entero (sombras, escena y postproceso).
//
// Uso (desde la carpeta de una versión, después de `node armar.mjs`):
//   HTML=<index.html> SALIDA=<archivo.json> CALIDAD=media|alta MODO=relax|desafio
//   npx electron herramientas/medir-vistas.cjs --user-data-dir=<carpeta propia>
// Opciones: CUADROS=200 (medidos por vista), ASIENTO=150 (cuadros sin medir antes), VISTAS=a,b (sólo ésas)
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const HTML = path.resolve(process.env.HTML || path.join(process.cwd(), 'index.html'));
const SALIDA = path.resolve(process.env.SALIDA || './medir-vistas.json');
const CALIDAD = process.env.CALIDAD || 'media';
const MODO = process.env.MODO || 'relax';
const CUADROS = Number(process.env.CUADROS || 200);
const ASIENTO = Number(process.env.ASIENTO || 150);
const SOLO = process.env.VISTAS ? process.env.VISTAS.split(',') : null;
const perfil = (process.argv.find((a) => a.startsWith('--user-data-dir=')) || '').slice(16);
if (!perfil) { console.error('falta --user-data-dir=<carpeta propia>'); process.exit(2); }
app.setPath('userData', path.resolve(perfil));
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('js-flags', '--expose-gc');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// Las vistas: `donde` corre en la página y devuelve { x, z, yaw, horas } o null (no está en esta versión).
const VISTAS = [
  { id: 'refugio-dia', modos: ['relax', 'desafio'], donde: `(()=>{ const L = H.T.lugares.refugio; return { x: L.x + 26, z: L.z + 26, yaw: Math.PI * 0.25, horas: 12 } })()` },
  { id: 'refugio-noche', modos: ['relax', 'desafio'], donde: `(()=>{ const L = H.T.lugares.refugio; return { x: L.x + 26, z: L.z + 26, yaw: Math.PI * 0.25, horas: 22 } })()` },
  // el bosque cerrado: donde más árboles hay (el mismo punto en las dos versiones: T.bosque no cambia)
  { id: 'bosque', modos: ['relax', 'desafio'], donde: `(()=>{ const L = H.T.lugares.refugio; return { x: L.x - 24, z: L.z - 18, yaw: Math.atan2(24, 18) + Math.PI, horas: 11.5 } })()` },
  // la Estación del Valle (la parada principal, cerca del refugio), mirando al andén
  { id: 'estacion', modos: ['relax', 'desafio'], donde: `(()=>{ const p = (H.tren.paradas || []).find((q) => q.nombre === 'Estación del Valle'); if (!p) return null;
      return { x: p.anden.x + 16, z: p.anden.z + 16, yaw: Math.atan2(16, 16), horas: 12 } })()` },
  // donde la 3.5.4 tenía el almacén y la casa de té (en el Relax de la 3.6 se mudaron a la aldea: ahí ya no hay nada)
  { id: 'almacen-antes', modos: ['relax'], donde: `(()=>{ const a = (H.est.lugaresSorteo && H.est.lugaresSorteo.almacen) || H.est.almacen; if (!a) return null;
      return { x: a.x + 16, z: a.z + 16, yaw: Math.atan2(16, 16), horas: 12 } })()` },
  { id: 'casa-te-antes', modos: ['relax'], donde: `(()=>{ const a = (H.est.lugaresSorteo && H.est.lugaresSorteo['casa-te']) || H.est.casaTe; if (!a) return null;
      return { x: a.x + 16, z: a.z + 16, yaw: Math.atan2(16, 16), horas: 12 } })()` },
  // la Aldea de los Duendes (sólo 3.6): la plaza de día y la aldea entera de noche
  { id: 'aldea-plaza-dia', modos: ['relax'], donde: `(()=>{ const A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return null; const s = A.estadoEdificio('plaza').sitio;
      const fx = Math.sin(s.rot), fz = Math.cos(s.rot); return { x: s.x + fx * 16, z: s.z + fz * 16, yaw: Math.atan2(fx, fz), horas: 12 } })()` },
  { id: 'aldea-noche', modos: ['relax'], donde: `(()=>{ const A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return null; const p = A.aMundo(-38, 22), c = A.centro;
      return { x: p.x, z: p.z, yaw: Math.atan2(-(c.x - p.x), -(c.z - p.z)), horas: 22 } })()` },
];

app.whenReady().then(async () => {
  const r = { html: HTML, calidad: CALIDAD, modo: MODO, cuadros: CUADROS, cargas: {}, vistas: {}, errores: [] };
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|favicon/.test(m)) r.errores.push(m.slice(0, 300));
  });
  // (un cuadro de error de la página no puede colgar la medición)
  w.webContents.on('render-process-gone', (_e, d) => { r.errores.push('renderer caído ' + JSON.stringify(d)); });
  const js = (c, lim = 240000) => Promise.race([w.webContents.executeJavaScript(c, true), esperar(lim).then(() => { throw new Error('sin respuesta'); })]);
  const ajustes = JSON.stringify({ calidad: CALIDAD, clima: 'despejado', musica: false, modo: MODO, autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre', modoFluido: false, estacion: 'verano' });
  // el momento en que se esconde la pantalla de carga (con la portada lista para jugar)
  w.webContents.on('dom-ready', () => {
    w.webContents.executeJavaScript(`(()=>{ const c = document.getElementById('carga'); if (!c) return 0;
      const ver = () => { if (c.classList.contains('oculto') && !window.__tListo) window.__tListo = performance.now(); };
      new MutationObserver(ver).observe(c, { attributes: true, attributeFilter: ['class'] }); ver(); return 1 })()`).catch(() => {});
  });
  const cargar = async () => {
    const t0 = Date.now();
    await w.loadFile(HTML, { search: '?debug=1' });
    for (let i = 0; i < 1200; i++) {
      await esperar(250);
      if (await js('!!window.__tListo && !!window.__hojarasca', 5000).catch(() => false)) break;
    }
    const d = await js(`(()=>{ const H = window.__hojarasca; const c = H.__carga ? H.__carga() : null;
      return { listoMs: Math.round(window.__tListo), etapas: c ? c.etapas : [] } })()`);
    d.paredMs = Date.now() - t0;
    return d;
  };
  const entrar = async () => { await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500); };
  try {
    await w.loadFile(HTML, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', ${JSON.stringify(ajustes)}); 1`);
    r.cargas.calentar = await cargar();
    // partida nueva (la caché de la carga ya caliente, como en la segunda vez que se abre el juego)
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', ${JSON.stringify(ajustes)}); 1`);
    r.cargas.nueva = await cargar();
    await entrar();
    if (MODO === 'relax') {
      await esperar(3000);
      await js(`(()=>{ const H = window.__hojarasca; H.progreso.dia = 5; H.guardar(); return 1 })()`);
      r.cargas.guardada = await cargar();
      await entrar();
    }
    // (3.6: con la aldea, lo que arma el Worker se monta de a uno por cuadro después de la carga; la
    // ventana oculta no corre requestAnimationFrame: se cuentan los cuadros a mano hasta que esté)
    r.cargas.aldea = await js(`(async()=>{ const H = window.__hojarasca, A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return null;
      const t0 = performance.now(); let cuadros = 0;
      for (let i = 0; i < 100 && A.medir().fabrica.pendientes > 0; i++) await new Promise((ok) => setTimeout(ok, 100));
      const t1 = performance.now();
      while (cuadros < 3000 && (A.medir().cola > 0 || A.medir().listas < A.medir().manzanas)) { H.__bucle(); cuadros++; }
      const m = A.medir(); return { worker: Math.round(t1 - t0), cuadros, montarMs: Math.round(performance.now() - t1), listas: m.listas, manzanas: m.manzanas, montajes: m.montajes, msMontar: Math.round(m.msMontar), fabrica: m.fabrica } })()`);
    r.lugares = await js(`(()=>{ const H = window.__hojarasca, e = H.est, pt = (o) => (o ? { x: +o.x.toFixed(1), z: +o.z.toFixed(1) } : null);
      return { refugio: pt(H.T.lugares.refugio), almacen: pt(e.almacen), casaTe: pt(e.casaTe), sorteo: e.lugaresSorteo ? { almacen: pt(e.lugaresSorteo.almacen), casaTe: pt(e.lugaresSorteo['casa-te']) } : null,
        paradas: (H.tren.paradas || []).map((p) => ({ nombre: p.nombre, ...pt(p.anden) })) } })()`);
    r.heapAlEntrarMB = await js('+(performance.memory.usedJSHeapSize / 1048576).toFixed(1)');
    for (const v of VISTAS) {
      if (!v.modos.includes(MODO) || (SOLO && !SOLO.includes(v.id))) continue;
      const puesto = await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado; const p = ${v.donde}; if (!p) return null;
        H.volverAlJuego && H.volverAlJuego();
        js.pos.set(p.x, H.T.altura(p.x, p.z) + 1.65, p.z); js.yaw = p.yaw; js.pitch = -0.05; js.vel && js.vel.set && js.vel.set(0, 0, 0);
        H.progreso.horas = p.horas; window.__vista = p; return { x: +p.x.toFixed(1), z: +p.z.toFixed(1), yaw: +p.yaw.toFixed(3), horas: p.horas } })()`);
      if (!puesto) { r.vistas[v.id] = null; continue; }
      // que se acomode: cuadros sin medir (con la hora fija) y un respiro para lo que va por tiempo
      await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado, p = window.__vista;
        for (let i = 0; i < ${ASIENTO}; i++) { H.progreso.horas = p.horas; js.pos.x = p.x; js.pos.z = p.z; js.yaw = p.yaw; js.pitch = -0.05; H.__bucle(); } return 1 })()`);
      await esperar(1500);
      const m = await js(`(()=>{ const H = window.__hojarasca, R = H.renderer, gl = R.getContext(), js = H.jugador.estado, p = window.__vista;
        const ms = []; let llamadas = 0, triangulos = 0;
        for (let i = 0; i < ${CUADROS}; i++) {
          H.progreso.horas = p.horas; js.pos.x = p.x; js.pos.z = p.z; js.yaw = p.yaw; js.pitch = -0.05;
          const medirDibujo = i === ${CUADROS} - 1;
          let reset = null;
          if (medirDibujo) { R.info.autoReset = false; R.info.reset(); reset = R.info.reset; R.info.reset = () => {}; }
          const t0 = performance.now();
          H.__bucle(); gl.finish();
          ms.push(performance.now() - t0);
          if (medirDibujo) { llamadas = R.info.render.calls; triangulos = R.info.render.triangles; R.info.reset = reset; R.info.autoReset = true; }
        }
        // y la escena sola, como humo-rendimiento (sin sombras ni postproceso)
        R.info.autoReset = false; R.info.reset(); R.render(H.escena, H.camara);
        const escena = { llamadas: R.info.render.calls, triangulos: R.info.render.triangles }; R.info.autoReset = true;
        const o = ms.slice().sort((a, b) => a - b), q = (f) => +o[Math.min(o.length - 1, Math.floor(o.length * f))].toFixed(2);
        return { p50: q(0.5), p95: q(0.95), medio: +(ms.reduce((s, x) => s + x, 0) / ms.length).toFixed(2), llamadas, triangulos, escena,
          heapMB: +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) } })()`);
      m.donde = puesto;
      r.vistas[v.id] = m;
      console.log(`${v.id.padEnd(16)} p50 ${m.p50} p95 ${m.p95} ms · ${m.llamadas} dibujos · ${m.triangulos} triángulos`);
    }
  } catch (e) { r.errores.push('excepcion: ' + (e && e.message ? e.message : e)); }
  fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
  fs.writeFileSync(SALIDA, JSON.stringify(r, null, 2));
  console.log(`cargas: nueva ${r.cargas.nueva?.listoMs} ms, guardada ${r.cargas.guardada?.listoMs ?? '-'} ms · errores ${r.errores.length}`);
  app.exit(0);
});

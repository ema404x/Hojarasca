// Partida real 4.26.5 (A): caza de bugs en la gente del pueblo. Con la Aldea completa y vos parado en la plaza corre un día entero (cuadros de 50 ms,
// duración del día corta) y mira a cada vecino: se traba caminando, queda adentro de un sólido, flota o se hunde, gira en el lugar, se amontona.
// Uso: powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-humo-4-26-5-a.ps1 [-Secciones dia,anden] [-Horas 6,18] [-Dur 8]
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const { DETERMINISTA } = require(path.join(raiz, 'pruebas', 'ayuda-determinista.cjs'));
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-26-5-a'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HOJ_PERFIL) app.setPath('userData', path.resolve(process.env.HOJ_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const TOPE_MIN = Number(process.env.HUMO_TOPE_MIN || 14);
setTimeout(() => { console.log(`ERROR: la prueba tardó más de ${TOPE_MIN} minutos`); try { app.exit(2); } catch { process.exit(2); } }, TOPE_MIN * 60 * 1000).unref?.();
const SEC = process.env.HUMO_SECCIONES ? new Set(process.env.HUMO_SECCIONES.split(',')) : null;
const va = (s) => (SEC ? SEC.has(s) : true);
const HORAS = (process.env.HUMO_HORAS || '6,18').split(',').map(Number);   // desde y hasta (horas del juego)
const DUR = Number(process.env.HUMO_DUR || 8);

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, P = H.progreso;
  const N = window.__N = {};
  N.cuadros = (n, ms = 50) => window.__cuadros(n, ms);
  N.despejado = () => { const e = H.clima.estado; e.lluvia = 0; e.nublado = 0; e.objetivo = 'despejado'; e.proximo = 'despejado'; e.t = 900; return 1; };
  N.completa = () => {
    const a = P.aldea; const L = { carpintero: 'carpinteria', panadera: 'panaderia', herrero: 'herreria', pescador: 'pescaderia', maestra: 'escuela', enfermera: 'puesto-sanitario', telegrafista: 'estafeta', tejedora: 'hilanderia', apicultor: 'sala-miel', guardaparque: 'seccional', musico: 'salon' };
    a.pobladores = Object.keys(L).map((clave) => ({ clave, dia: 1 })); a.obras = {}; a.llegando = null; a.locales = Object.fromEntries(Object.values(L).map((l) => [l, 1])); a.descubierta = 1;
    return 1;
  };
  N.poner = (lx, lz, yaw = 0) => { const M = H.__aldeaMundo(), o = M.aMundo(lx, lz); H.jugador.ubicar(o.x, o.z, yaw, null); for (let i = 0; i < 6; i++) H.jugador.actualizar(0.05); return 1; };
  const cerca = (x, z, rad) => H.col.cercanos(x, z).filter((o) => (o.seg ? Math.hypot(x - Math.max(Math.min(o.ax, o.bx), Math.min(Math.max(o.ax, o.bx), x)), z - Math.max(Math.min(o.az, o.bz), Math.min(Math.max(o.az, o.bz), z))) : Math.hypot(x - o.x, z - o.z)) < o.r + rad + 0.01).slice(0, 3).map((o) => ({ du: o.duenio || o.id || o.tipo || null, r: +o.r.toFixed(2), seg: o.seg ? [+o.ax.toFixed(1), +o.az.toFixed(1), +o.bx.toFixed(1), +o.bz.toFixed(1)] : [+o.x.toFixed(1), +o.z.toFixed(1)], aMin: o.alturaMin, aMax: o.alturaMax }));
  N.cerca = cerca;
  const ang = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  // ---- el observador
  N.obs = null;
  N.empezar = () => { N.obs = { t: 0, prev: new Map(), inc: [], vistos: new Set(), saltos: new Map(), cola: new Map() }; return 1; };
  const registrar = (o, tipo, k, d) => { const clave = tipo + '|' + k + '|' + (d.dest || ''); if (o.vistos.has(clave)) return; o.vistos.add(clave); o.inc.push({ tipo, k, h: +P.horas.toFixed(2), ...d }); };
  N.mirar = () => {
    const o = N.obs, M = H.__aldea.mundo(), pers = M.personas;
    o.t += 0.3;
    const es = M.estado();
    const E = new Map(es.npcs.map((q) => [q.clave, q]));
    const pos = [];
    for (const [k, st] of pers) {
      const n = st.npc; if (!n || n.dormido || !n.g || !n.g.visible) { o.prev.delete(k); continue; }
      const q = E.get(k) || {};
      const dest = st.destino ? (st.destino.edificio || '?') + ':' + (st.destino.punto || '') + ':' + (st.destino.lugar || '') : '';
      const p = { x: n.pos.x, y: n.pos.y, z: n.pos.z, yaw: n.g.rotation.y, t: o.t, cam: !!(n.camino && n.camino.length) };
      let r = o.prev.get(k);
      if (!r) { r = { ...p, hist: [], giro: 0, quieto: 0, saltos: st.saltos || 0, dest }; o.prev.set(k, r); }
      // saltos por trabado
      if ((st.saltos || 0) > r.saltos) { registrar(o, 'salto-trabado', k, { x: +p.x.toFixed(1), z: +p.z.toFixed(1), dest, pose: n.pose || null }); r.saltos = st.saltos || 0; }
      // trabado: con camino y sin avanzar en 6 s
      r.hist.push(p); if (r.hist.length > 20) r.hist.shift();
      if (r.hist.length >= 20 && p.cam) {
        const a = r.hist[0]; const mov = Math.hypot(p.x - a.x, p.z - a.z);
        if (mov < 0.15 && r.hist.every((h) => h.cam)) registrar(o, 'trabado', k, { x: +p.x.toFixed(1), z: +p.z.toFixed(1), dest, obs: cerca(p.x, p.z, 0.3), falta: n.camino.length, sig: n.camino[0] ? [+n.camino[0].x.toFixed(1), +n.camino[0].z.toFixed(1)] : null });
      }
      // gira en el lugar: cambia el rumbo más de 1 rad por muestra durante 6 muestras seguidas sin moverse
      const dm = Math.hypot(p.x - r.x, p.z - r.z), dy = Math.abs(ang(p.yaw - r.yaw));
      if (dm < 0.02 && dy > 0.5) r.giro++; else if (dm >= 0.02 || dy < 0.1) r.giro = 0;
      if (r.giro >= 6) registrar(o, 'gira', k, { x: +p.x.toFixed(1), z: +p.z.toFixed(1), dest, pose: n.pose || null });
      // piso: flota o se hunde (con tolerancia: escaleras y asientos)
      if (!n.pose || n.pose === 'parado') {
        const su = H.T.altura(p.x, p.z), pl = H.col.plataformaEn(p.x, p.z, Math.max(p.y, su) + 0.6), y = pl && pl.alto > su - 0.1 && pl.alto < su + 4 ? pl.alto : su;
        if (Number.isFinite(y) && Math.abs(y - p.y) > 0.3) registrar(o, 'piso', k, { x: +p.x.toFixed(1), z: +p.z.toFixed(1), dy: +(p.y - y).toFixed(2), dest });
      }
      // adentro de un sólido (sólo parado o caminando; sentados quedan sobre el mueble)
      try {
        const b = { x: p.x, y: p.y, z: p.z };
        H.col.resolver(b, 0.22, 1.2);
        const d = Math.hypot(b.x - p.x, b.z - p.z);
        if (d > 0.25 && !p.cam) registrar(o, 'solido', k, { x: +p.x.toFixed(1), z: +p.z.toFixed(1), empuje: +d.toFixed(2), y: +p.y.toFixed(2), obs: cerca(p.x, p.z, 0.22), dest, pose: n.pose || null, cam: p.cam });
      } catch (e) { /* sin choque */ }
      r.x = p.x; r.y = p.y; r.z = p.z; r.yaw = p.yaw; r.dest = dest;
      pos.push({ k, x: p.x, z: p.z, pose: n.pose || null, cam: p.cam, dest });
    }
    // amontonados: dos a menos de 0,35 m más de 6 s
    for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) {
      const a = pos[i], b = pos[j], par = a.k < b.k ? a.k + '+' + b.k : b.k + '+' + a.k;
      if (Math.hypot(a.x - b.x, a.z - b.z) < 0.35 && !a.pose && !b.pose) { const c = (o.cola.get(par) || 0) + 0.3; o.cola.set(par, c); if (c > 6) registrar(o, 'amontonados', par, { x: +a.x.toFixed(1), z: +a.z.toFixed(1), dest: a.dest + ' / ' + b.dest }); } else o.cola.delete(par);
    }
    return pos.length;
  };
  N.fin = () => o => 1;
  N.informe = () => ({ inc: N.obs.inc, t: N.obs.t });
  N.estado = () => { const M = H.__aldea.mundo(); return M.estado().npcs.map((q) => ({ k: q.clave, x: +q.x.toFixed(1), z: +q.z.toFixed(1), d: q.dormido, pose: q.pose, act: q.actividad, dest: q.destino && (q.destino.edificio + ':' + q.destino.punto) })); };
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
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { consola.push(m.slice(0, 300)); }
  });
  w.webContents.on('render-process-gone', (e, d) => console.log('  PROCESO DE LA PÁGINA CAÍDO:', JSON.stringify(d)));
  let donde = 'carga';
  const js = (c, espera = 300000) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en ${espera / 1000} s (${donde})`)), espera))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const N = (c) => js(`(async () => { const H = window.__hojarasca, N = window.__N, P = H.progreso; return (${c}); })()`);
  const url = path.join(raiz, 'index.html');
  const ajustes = `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'relax', relaxTipo:'historia', autoCalidad:false, guiaPrimerDia:false, duracion:${DUR}})); 1`;
  const captura = async (nombre) => { for (let k = 0; k < 4; k++) { try { await esperar(350 + k * 300); const img = await w.webContents.capturePage(); fs.writeFileSync(path.join(salida, nombre + '.png'), img.toPNG()); console.log(`  (captura ${nombre}.png)`); return; } catch (e) { if (k === 3) console.log('  captura no: ' + e.message); } } };
  try {
    donde = 'entrar';
    await w.loadFile(url, { search: '?debug=1' }); await js(ajustes); await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false); }
    if (!listo) throw new Error('el juego no cargó');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js('window.__sinPausaPorBlur = true; 1');
    await js(DETERMINISTA(42651));
    await js(PAGINA);
    await N('N.cuadros(60)');
    await N(`(() => { for (let i = 0; i < 4; i++) { const b = document.querySelector('#valle-tarjeta:not(.oculto) button[data-valle-opcion]'); if (!b) break; b.click(); N.cuadros(8); } const d = H.__escenas.director; for (let i = 0; i < 6 && d.activa(); i++) { d.saltar(); N.cuadros(10); } return 1 })()`);
    await N('(() => { N.despejado(); N.completa(); P.dia = 33; P.horas = 5.5; P.historia.activa = false; N.poner(20, 50); H.__aldeaMundo().actualizar(4, H.camara.position); N.cuadros(120); return 1 })()');
    ok(true, 'aldea completa, jugador en la plaza');
    if (va('dia')) {
      donde = 'dia';
      console.log(`— un día de ${HORAS[0]} a ${HORAS[1]} h (duración ${DUR} min)`);
      await N(`(() => { N.despejado(); P.horas = ${HORAS[0]}; N.cuadros(40); N.empezar(); return 1 })()`);
      let ult = -1, vuelta = 0;
      while (true) {
        const r = await N(`(() => { for (let i = 0; i < 6; i++) { N.cuadros(1); } N.mirar(); N.despejado(); return { h: P.horas, d: P.dia } })()`);
        const hh = r.h + (r.d - 33) * 24;
        if (Math.floor(hh) !== ult) { ult = Math.floor(hh); console.log('  hora', hh.toFixed(1)); if ([8, 12, 17, 21].includes(Math.floor(hh) % 24)) await captura(`dia-${Math.floor(hh)}`); }
        if (hh >= HORAS[1] || ++vuelta > 6000) break;
      }
      const inf = await N('N.informe()');
      fs.writeFileSync(path.join(salida, 'incidentes.json'), JSON.stringify(inf, null, 1));
      const por = {};
      for (const i of inf.inc) (por[i.tipo] = por[i.tipo] || []).push(i);
      for (const t of Object.keys(por)) { console.log(`  ${t}: ${por[t].length}`); for (const i of por[t].slice(0, 12)) console.log('    ' + JSON.stringify(i)); }
      if (!inf.inc.length) console.log('  sin incidentes');
    }
    if (va('anden')) {
      donde = 'anden';
      console.log('— el que baja del tren y espera en el anden');
      const r = await N(`(() => { N.despejado(); P.horas = 10; const A = H.__aldea, M = A.mundo(); const a = P.aldea; a.llegando = null; a.pobladores = a.pobladores.filter((p) => p.clave !== 'musico' && p.clave !== 'tejedora'); delete a.locales.salon; delete a.locales.hilanderia; const okl = A.llamar(); M.revisarLlegada(true); N.cuadros(30); const q = a.llegando && a.llegando.clave; const pe = A.puntos('estacion-aldea').espera || A.puntos('estacion-aldea').anden; H.jugador.ubicar(pe.x + 3, pe.z + 3, 0, null); for (let i = 0; i < 6; i++) H.jugador.actualizar(0.05); M.actualizar && 0; H.__aldeaMundo().actualizar(4, H.camara.position); N.cuadros(300); const st = q && M.personas.get(q); const n = st && st.npc; if (!n) return { okl, q, sinFigura: true, esp: [pe.x, pe.z] }; const su = H.T.altura(n.pos.x, n.pos.z); H.jugador.estado.yaw = Math.atan2(-(n.pos.x - H.jugador.estado.pos.x), -(n.pos.z - H.jugador.estado.pos.z)); N.cuadros(20); return { okl, q, x: +n.pos.x.toFixed(1), z: +n.pos.z.toFixed(1), y: +n.pos.y.toFixed(2), suelo: +su.toFixed(2), pose: n.pose, dest: st.destino && st.destino.punto, camino: n.camino ? n.camino.length : -1, mano: !!n.mano, esp: [+pe.x.toFixed(1), +pe.z.toFixed(1)], llegando: n.llegando, solido: N.cerca(n.pos.x, n.pos.z, 0.22) } })()`);
      console.log('  ', JSON.stringify(r));
      await captura('anden-llegada');
    }
    if (va('cama')) {
      donde = 'cama';
      console.log('— los que duermen: pose, altura y captura de cerca');
      for (const [edif, k] of [['estafeta', 'telegrafista'], ['salon', 'musico'], ['casa-familia', 'padre']]) {
        const r = await N('(() => { N.despejado(); P.horas = 3; const A = H.__aldea, M = A.mundo(); const pt = A.puntos("' + edif + '"); const c = pt.cama || pt.adentro; const a = pt.adentro || c; N.cuadros(30); H.jugador.ubicar(a.x, a.z, 0, null); for (let i = 0; i < 6; i++) H.jugador.actualizar(0.05); H.__aldeaMundo().actualizar(4, H.camara.position); N.cuadros(200); const n = M.personas.get("' + k + '").npc; const su = H.T.altura(n.pos.x, n.pos.z); const yaw = Math.atan2(c.x - H.jugador.estado.pos.x, c.z - H.jugador.estado.pos.z); H.jugador.estado.yaw = Math.PI + yaw; N.cuadros(10); return { pose: n.pose, y: +n.pos.y.toFixed(2), suelo: +su.toFixed(2), x: +n.pos.x.toFixed(1), z: +n.pos.z.toFixed(1), cama: [+c.x.toFixed(1), +c.z.toFixed(1)], pj: [+H.jugador.estado.pos.x.toFixed(1), +H.jugador.estado.pos.z.toFixed(1)], vis: n.g.visible, rotX: +n.g.rotation.x.toFixed(2), gy: +n.g.position.y.toFixed(2) } })()');
        console.log(' ', edif, k, JSON.stringify(r));
        await captura('cama-' + edif);
      }
    }
    if (va('sonda')) {
      donde = 'sonda';
      console.log('— sonda: la abuela y la galesa en (27,-384.6)');
      const r = await N('(() => { N.despejado(); P.horas = 6.1; N.cuadros(40); const M = H.__aldea.mundo(); const q = []; for (let i = 0; i < 160; i++) { N.cuadros(5); const a = M.personas.get("abuela").npc; if (i % 10 === 0) q.push([+P.horas.toFixed(2), +a.pos.x.toFixed(1), +a.pos.z.toFixed(1), a.camino ? a.camino.length : -1, a.camino && a.camino[0] ? [+a.camino[0].x.toFixed(1), +a.camino[0].z.toFixed(1)] : null, !!a.dormido]); } const din = H.col.dinamicos.filter((o) => Math.hypot((o.x ?? o.ax) - 27, (o.z ?? o.az) + 384.6) < 6).map((o) => ({ x: o.x, z: o.z, ax: o.ax, az: o.az, bx: o.bx, bz: o.bz, r: o.r, du: o.duenio })); return { q, din, pj: [H.jugador.estado.pos.x, H.jugador.estado.pos.z] } })()');
      console.log(JSON.stringify(r));
    }
    if (consola.length) { console.log('— errores de consola:'); for (const c of consola.slice(0, 20)) console.log('  ' + c); }
    ok(consola.length === 0, 'sin errores en la consola');
  } catch (e) { console.log('ERROR: ' + (e && e.stack || e)); errores.push(String(e)); }
  console.log(errores.length ? `FALLAS: ${errores.length}` : 'OK');
  app.exit(errores.length ? 1 : 0);
});

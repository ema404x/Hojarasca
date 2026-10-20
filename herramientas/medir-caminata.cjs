// 4.3.1: mide el TIRÓN AL CAMINAR. Mueve al jugador por el valle, el bosque y la aldea con las teclas de
// verdad (W y Mayús, el rumbo se corrige como con el ratón: colisiones, pendientes y aceleración son las
// del juego), con el bucle real del juego (requestAnimationFrame, ventana visible, sin límite de cuadros),
// y anota CADA cuadro: lo que tardó en entregarse (intervalo entre cuadros), lo que costó en la CPU
// (lo que dura el callback del juego) y en qué sistema se fue: vegetación (veg.actualizar: árboles
// cercanos, banda media, impostores), objetos, pasto, bloques del sotobosque (compactarSoto, dentro del
// dibujo), las secciones del perfilador (ambiente, clima, fauna, gente, desafío, dibujo), programas
// nuevos compilados (info.programs) y bajadas del heap (recolector de basura).
//
// Es la herramienta para correr en la Ryzen 5 4600G: UN comando y una tabla.
//   npm run medir:caminata
// o, a mano (desde la carpeta de la versión, después de `node armar.mjs`):
//   HTML=<index.html> SALIDA=<archivo.json> npx electron --no-sandbox herramientas/medir-caminata.cjs --user-data-dir=<carpeta propia>
// Opciones (variables de entorno):
//   RUTAS=sendero-camina,sendero-corre,bosque-camina,bosque-corre,aldea-camina   (cuáles; por defecto las cuatro primeras)
//   REPETIR=1          (cuántas veces cada una; en la tabla se suman)
//   CALIDAD=alta       (baja|media|alta)       MODO=relax
//   SEGUNDOS=80        (largo de cada recorrido)
//   COMPLETA=1         (la aldea completa, como medir-vistas; 0 la apaga)
//   HORA=12            (hora fija del día; el reloj del juego se congela con ella en cada cuadro)
// Con varias corridas de comparación (antes y después), cada una en su carpeta: `node herramientas/comparar-caminata.cjs a.json b.json`.
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const HTML = path.resolve(process.env.HTML || path.join(process.cwd(), 'index.html'));
const SALIDA = path.resolve(process.env.SALIDA || './medir-caminata.json');
const CALIDAD = process.env.CALIDAD || 'alta';
const MODO = process.env.MODO || 'relax';
const SEGUNDOS = Number(process.env.SEGUNDOS || 80);
const REPETIR = Math.max(1, Number(process.env.REPETIR || 1));
const COMPLETA = process.env.COMPLETA !== '0';
const HORA = Number(process.env.HORA || 12);
const RUTAS = (process.env.RUTAS || 'sendero-camina,sendero-corre,bosque-camina,aldea-camina').split(',');
const perfil = (process.argv.find((a) => a.startsWith('--user-data-dir=')) || '').slice(16) || process.env.HOJ_PERFIL || '';
if (!perfil) { console.error('falta --user-data-dir=<carpeta propia>'); process.exit(2); }
app.setPath('userData', path.resolve(perfil));
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('mute-audio');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('enable-precise-memory-info');
app.commandLine.appendSwitch('js-flags', '--expose-gc');
const { resumir, atribuir, tabla } = require('./caminata-analisis.cjs');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// Las rutas: la lista de puntos se arma EN la página (con el valle ya cargado) y es la misma cada vez.
//  - sendero: el sendero del valle desde el refugio (un punto cada ~12 m; claro, con el sotobosque a los costados);
//  - bosque: desde el bosque cerrado del refugio, hacia donde más árboles haya (la densidad de T.bosque), un punto cada 25 m;
//  - aldea: la calle de la Loma de la aldea completa, ida y vuelta, con la gente en sus puestos.
const GEN_SENDERO = `(()=>{ const S = H.T.sendero, ref = H.T.lugares.refugio; let k0 = 0, dm = 1e9; S.forEach((p, i) => { const d = Math.hypot(p.x - ref.x, p.z - ref.z); if (d < dm) { dm = d; k0 = i; } });
  const out = []; for (let j = 0; j < S.length; j += 6) { const p = S[(k0 + j) % S.length]; out.push([+p.x.toFixed(1), +p.z.toFixed(1)]); } return out })()`;
const GEN_BOSQUE = `(()=>{ const T = H.T, L = T.lugares.refugio, x0 = L.x - 24, z0 = L.z - 18; let mejor = null;
  for (let k = 0; k < 24; k++) { const ang = k * Math.PI / 12; let suma = 0, agua = 0, n = 0;
    for (let d = 10; d <= 300; d += 10) { const x = x0 + Math.cos(ang) * d, z = z0 + Math.sin(ang) * d; suma += T.val(T.bosque, x, z); if (T.agua(x, z)) agua++; n++; }
    if (!agua && (!mejor || suma / n > mejor.dens)) mejor = { ang, dens: suma / n }; }
  const out = [[x0, z0]]; for (let d = 25; d <= 300; d += 25) out.push([+(x0 + Math.cos(mejor.ang) * d).toFixed(1), +(z0 + Math.sin(mejor.ang) * d).toFixed(1)]); return out })()`;
const GEN_ALDEA = `(()=>{ const A = H.__aldeaMundo(); const P = [[-40, 53], [-100, 52], [-146, 56], [-100, 52], [-40, 53], [-38, 22], [-40, 53]];
  return P.map(([x, z]) => { const p = A.aMundo(x, z); return [+p.x.toFixed(1), +p.z.toFixed(1)]; }) })()`;
const RUTAS_DEF = {
  'sendero-camina': { v: 'camina', gen: GEN_SENDERO },
  'sendero-corre': { v: 'corre', gen: GEN_SENDERO },
  'bosque-camina': { v: 'camina', gen: GEN_BOSQUE },
  'bosque-corre': { v: 'corre', gen: GEN_BOSQUE },
  'aldea-camina': { v: 'camina', gen: GEN_ALDEA },
  // los controles: parado en el punto de partida de cada ruta (el recorrido termina por tiempo)
  'sendero-quieto': { v: 'quieto', gen: GEN_SENDERO },
  'bosque-quieto': { v: 'quieto', gen: GEN_BOSQUE },
  'aldea-quieto': { v: 'quieto', gen: GEN_ALDEA },
};

// Lo que corre en la página: engancha el bucle del juego y anota cada cuadro.
const INSTALAR = `(()=>{
  if (window.__cam) return 1;
  const H = window.__hojarasca, R = H.renderer;
  const MAXC = 40000;
  H.medidor.visible = true;   // (el cronómetro de la placa sólo anda con el medidor prendido; igual en todas las corridas)
  const C = window.__cam = { activo: false, n: 0, t: new Float64Array(MAXC), cpu: new Float32Array(MAXC), int: new Float32Array(MAXC),
    veg: new Float32Array(MAXC), obj: new Float32Array(MAXC), pasto: new Float32Array(MAXC), soto: new Float32Array(MAXC),
    amb: new Float32Array(MAXC), cli: new Float32Array(MAXC), fau: new Float32Array(MAXC), npc: new Float32Array(MAXC), des: new Float32Array(MAXC), ren: new Float32Array(MAXC),
    gpu: new Float32Array(MAXC), prog: new Int16Array(MAXC), geo: new Int16Array(MAXC), tex: new Int16Array(MAXC), gc: new Uint8Array(MAXC), x: new Float32Array(MAXC), z: new Float32Array(MAXC),
    ruta: null, pi: 0, ultimoT: 0, ultimoHeap: 0, ultimoProg: 0, ultimoGeo: 0, ultimoTex: 0, ultimoSoto: 0, atascos: 0, pausas: 0, atascados: [], avance: null,
    cur: { veg: 0, obj: 0, pasto: 0, soto: 0, amb: 0, cli: 0, fau: 0, npc: 0, des: 0, ren: 0 }, teclas: new Set() };
  // (la tecla se reenvía en cada cuadro mientras esté apretada: si la ventana pierde el foco, el juego suelta todas)
  const tec = (code, abajo) => { const ya = C.teclas.has(code); if (!abajo && !ya) return; abajo ? C.teclas.add(code) : C.teclas.delete(code);
    document.dispatchEvent(new KeyboardEvent(abajo ? 'keydown' : 'keyup', { code, key: code, bubbles: true })); };
  C.soltar = () => { for (const k of Array.from(C.teclas)) tec(k, false); };
  // las secciones del perfilador
  const P = H.perfilador, term = P.terminar.bind(P);
  const claveSec = { ambiente: 'amb', clima: 'cli', fauna: 'fau', 'npc/perro': 'npc', desafio: 'des', render: 'ren' };
  P.terminar = (nombre, ini, act) => { const ms = term(nombre, ini, act); const k = claveSec[nombre]; if (k) C.cur[k] += ms; return ms; };
  const envolver = (obj, nombre, clave) => { const f = obj[nombre]; obj[nombre] = function () { const a = performance.now(); try { return f.apply(this, arguments); } finally { C.cur[clave] += performance.now() - a; } }; };
  envolver(H.veg, 'actualizar', 'veg'); envolver(H.objetos, 'actualizar', 'obj'); envolver(H.pasto, 'actualizar', 'pasto');
  const orig = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => orig((t) => {
    if (cb.name !== 'bucle') return cb(t);
    const a = performance.now(); cb(t); const b = performance.now();
    try { C.paso(t, a, b); } catch (e) { C.error = String(e && e.message || e); }
  });
  C.paso = (t, a, b) => {
    const js = H.jugador.estado, cur = C.cur;
    // (si la ventana pierde el foco el juego se pausa solo: se lo vuelve a sacar de la pausa y se anota)
    if (C.activo && H.__caidas.modo() !== 'jugando') { C.pausas++; H.volverAlJuego(); }
    if (C.activo && C.n < MAXC) {
      const i = C.n++;
      C.t[i] = t; C.cpu[i] = b - a; C.int[i] = C.ultimoT ? t - C.ultimoT : 0;
      C.veg[i] = cur.veg; C.obj[i] = cur.obj; C.pasto[i] = cur.pasto;
      const ss = H.veg.statsSoto; C.soto[i] = ss.veces !== C.ultimoSoto ? ss.ms : 0; C.ultimoSoto = ss.veces;
      C.amb[i] = cur.amb; C.cli[i] = cur.cli; C.fau[i] = cur.fau; C.npc[i] = cur.npc; C.des[i] = cur.des; C.ren[i] = cur.ren;
      const pr = R.info.programs ? R.info.programs.length : 0; C.prog[i] = pr - C.ultimoProg; C.ultimoProg = pr;
      C.geo[i] = R.info.memory.geometries - C.ultimoGeo; C.ultimoGeo = R.info.memory.geometries;
      C.tex[i] = R.info.memory.textures - C.ultimoTex; C.ultimoTex = R.info.memory.textures;
      const hp = performance.memory.usedJSHeapSize; C.gc[i] = hp < C.ultimoHeap - 262144 ? 1 : 0; C.ultimoHeap = hp;
      C.gpu[i] = H.__gpuMs();
      C.x[i] = js.pos.x; C.z[i] = js.pos.z;
    }
    C.ultimoT = t;
    for (const k in cur) cur[k] = 0;
    // el rumbo hacia el próximo punto de la ruta
    if (C.activo && C.ruta) {
      H.progreso.horas = C.hora;
      if (C.ruta.v === 'quieto') { C.soltar(); return; }   // (el control: parado en el punto de partida)
      const p = C.ruta.puntos[C.pi]; if (!p) { C.fin = true; C.activo = false; C.soltar(); return; }
      const dx = p[0] - js.pos.x, dz = p[1] - js.pos.z, d = Math.hypot(dx, dz);
      if (d < 3) { C.pi++; C.avance = null; C.intentos = 0; C.desvio = null; return; }
      js.yaw = Math.atan2(-dx, -dz) + (C.desvio && t < C.desvio.hasta ? C.desvio.signo * 1.1 : 0); js.pitch = -0.05;
      tec('KeyW', true); tec('ShiftLeft', C.ruta.v === 'corre');
      // (si en 1,5 s no se acercó 1 m al punto, está atascado)
      if (!C.avance || d < C.avance.d - 1) C.avance = { d, t }; else if (t - C.avance.t > 1500) {
        // atascado contra algo: primero se rodea (un giro de ~60° durante 1,2 s, para un lado y para el otro); si no sale, se salta el punto
        C.intentos = (C.intentos || 0) + 1;
        if (C.intentos <= 3) { C.desvio = { hasta: t + 1200, signo: C.intentos % 2 ? 1 : -1 }; C.avance = { d, t: t + 1200 }; }
        else { C.atascados.push(C.pi); C.pi++; C.avance = null; C.atascos++; C.intentos = 0; C.desvio = null; }
      }
    } else C.soltar();
  };
  return 1;
})()`;

app.whenReady().then(async () => {
  const r = { html: HTML, calidad: CALIDAD, modo: MODO, segundos: SEGUNDOS, hora: HORA, cargas: {}, corridas: [], errores: [] };
  const w = new BrowserWindow({ show: false, focusable: false, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.showInactive();   // modo discreto: no roba el foco ni se pone encima de lo que se esté haciendo
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|favicon/.test(m)) r.errores.push(m.slice(0, 300));
  });
  w.webContents.on('render-process-gone', (_e, d) => { r.errores.push('renderer caído ' + JSON.stringify(d)); });
  const js = (c, lim = 240000) => Promise.race([w.webContents.executeJavaScript(c, true), esperar(lim).then(() => { throw new Error('sin respuesta'); })]);
  const ajustes = JSON.stringify({ calidad: CALIDAD, clima: 'despejado', musica: false, modo: MODO, autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre', modoFluido: false, estacion: 'verano' });
  const cargar = async () => {
    await w.loadFile(HTML, { search: '?debug=1' });
    for (let i = 0; i < 1200; i++) { await esperar(250); if (await js('!!window.__hojarasca && !!document.getElementById("carga") && document.getElementById("carga").classList.contains("oculto")', 5000).catch(() => false)) break; }
  };
  try {
    await w.loadFile(HTML, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', ${JSON.stringify(ajustes)}); 1`);
    await cargar();   // (la primera carga arma la caché)
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', ${JSON.stringify(ajustes)}); 1`);
    await cargar();
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    if (COMPLETA && MODO === 'relax') {
      r.completa = await js(`(()=>{ const H = window.__hojarasca, A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return null; const a = H.progreso.aldea;
        const L = { carpintero: 'carpinteria', veterinaria: 'veterinaria', panadera: 'panaderia', herbolaria: 'herboristeria', herrero: 'herreria', modista: 'costureria', pescador: 'pescaderia', botera: 'varadero', maestra: 'escuela', pintora: 'taller-arte', enfermera: 'puesto-sanitario', andinista: 'refugio-andinista', telegrafista: 'estafeta', fotografa: 'estudio-fotos', tejedora: 'hilanderia', ceramista: 'ceramica', apicultor: 'sala-miel', astronoma: 'observatorio', guardaparque: 'seccional', musico: 'salon' };
        const ks = Object.keys(L).filter((k) => A.estadoEdificio(L[k]));
        a.pobladores = ks.map((clave) => ({ clave, dia: 1 })); a.obras = {}; a.locales = Object.fromEntries(ks.map((k) => [L[k], 1])); a.descubierta = 1; a.llegando = null;
        A.actualizar(4, H.camara.position); return ks.length })()`);
      // que el Worker termine y se monte todo lo de la aldea antes de caminar
      await js(`(async()=>{ const H = window.__hojarasca, A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return 0;
        for (let i = 0; i < 300 && (A.medir().fabrica.pendientes > 0 || A.medir().cola > 0 || A.medir().listas < A.medir().manzanas); i++) await new Promise((ok) => setTimeout(ok, 100)); return 1 })()`);
    }
    await js(INSTALAR);
    r.version = await js(`document.title`);
    for (let rep = 0; rep < REPETIR; rep++) for (const id of RUTAS) {
      const def0 = RUTAS_DEF[id]; if (!def0) { r.errores.push('ruta desconocida ' + id); continue; }
      const def = { v: def0.v, puntos: JSON.parse(await js(`(()=>{ const H = window.__hojarasca; return JSON.stringify(${def0.gen}) })()`)) };
      // al punto de partida, mirando hacia el primero, y a que se acomode (parado) antes de salir
      await js(`(()=>{ const H = window.__hojarasca, C = window.__cam, js = H.jugador.estado, def = ${JSON.stringify(def)}; C.activo = false; C.soltar();
        H.volverAlJuego && H.volverAlJuego(); const p = def.puntos[0], q = def.puntos[1];
        js.pos.set(p[0], H.T.altura(p[0], p[1]) + 1.65, p[1]); js.vel.set(0, 0, 0); js.yaw = Math.atan2(-(q[0] - p[0]), -(q[1] - p[1])); js.pitch = -0.05;
        H.progreso.horas = ${HORA}; if (H.progreso.dia !== undefined) H.progreso.dia = 5; C.hora = ${HORA}; return 1 })()`);
      for (let k = 0; k < 20; k++) { await js(`(()=>{ const H = window.__hojarasca; H.progreso.horas = ${HORA}; return 1 })()`); await esperar(250); }
      await js(`if (window.gc) window.gc(); 1`);
      await esperar(500);
      await js(`(()=>{ const C = window.__cam; C.n = 0; C.pi = 1; C.fin = false; C.atascos = 0; C.pausas = 0; C.atascados = []; C.avance = null; C.ruta = ${JSON.stringify(def)}; C.ultimoT = 0; C.activo = true; return 1 })()`);
      const t0 = Date.now();
      while (Date.now() - t0 < SEGUNDOS * 1000) {
        await esperar(1000);
        if (await js('window.__cam.fin === true', 5000).catch(() => false)) break;
      }
      const datos = await js(`(()=>{ const C = window.__cam; C.activo = false; C.soltar(); const n = C.n; const a = (x) => Array.from(x.subarray(0, n), (v) => +v.toFixed(2));
        return JSON.stringify({ n, atascos: C.atascos, pausas: C.pausas, atascados: C.atascados, error: C.error || null, punto: C.pi, t: Array.from(C.t.subarray(0, n), (v) => +v.toFixed(1)), cpu: a(C.cpu), int: a(C.int), veg: a(C.veg), obj: a(C.obj), pasto: a(C.pasto), soto: a(C.soto),
          amb: a(C.amb), cli: a(C.cli), fau: a(C.fau), npc: a(C.npc), des: a(C.des), ren: a(C.ren), gpu: a(C.gpu), prog: Array.from(C.prog.subarray(0, n)), geo: Array.from(C.geo.subarray(0, n)), tex: Array.from(C.tex.subarray(0, n)),
          gc: Array.from(C.gc.subarray(0, n)), x: a(C.x), z: a(C.z) }) })()`, 120000);
      const d = JSON.parse(datos);
      r.corridas.push({ ruta: id, repeticion: rep + 1, ...d });
      const resumen = resumir(d);
      console.log(`${id.padEnd(14)} #${rep + 1}  ${d.n} cuadros · >16,7 ms ${resumen.cpu.mas167} (${resumen.cpu.pct167} %) · >25 ${resumen.cpu.mas25} · >50 ${resumen.cpu.mas50} · cpu p95 ${resumen.cpu.p95} p99 ${resumen.cpu.p99} · intervalo p95 ${resumen.int.p95} p99 ${resumen.int.p99} · pausas ${d.pausas} · atascos ${d.atascos} [${d.atascados}] · ${d.punto}/${def.puntos.length} puntos · ${((d.t[d.n - 1] - d.t[0]) / 1000).toFixed(0)} s`);
    }
  } catch (e) { r.errores.push('excepcion: ' + (e && e.message ? e.message : e)); }
  fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
  fs.writeFileSync(SALIDA, JSON.stringify(r));
  console.log(tabla(r));
  console.log(`guardado en ${SALIDA} · errores ${r.errores.length}${r.errores.length ? ': ' + r.errores.slice(0, 3).join(' | ') : ''}`);
  app.exit(0);
});


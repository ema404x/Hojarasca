// Partida real 4.29.1 (B): vistas del cartel del banco, de los bajos del alero del andén (Aldea y Estación del Valle) y medida del suelo fino de la Aldea contra el que se pisa.
// Uso (después de `node armar.mjs`): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-humo-4-29-1-b-vistas.ps1 [-Partes anden,mochila]
//   HUMO_PARTES=... · HTML=<otra página> · HUMO_SALIDA=<carpeta> · HUMO_CALIDAD=media|baja|alta
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-29-1-b-vistas'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 14 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 14 * 60 * 1000).unref?.();
const PARTES = (process.env.HUMO_PARTES || 'cartel,anden,suelo,v,tren').split(',');
const parte = (p) => PARTES.includes(p);
const CALIDAD = process.env.HUMO_CALIDAD || 'media';

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, P = H.progreso;
  const N = window.__N = {};
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  H.ajustes.limiteFps = 'libre';
  N.programas = () => H.renderer.info.programs.length;
  N.tick = async (seg = 0.5) => { const t0 = performance.now(); while (performance.now() - t0 < seg * 1000) { H.__bucle(); await dormir(14); } return 1; };
  N.tecla = (code, shift = false) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, shiftKey: shift, bubbles: true, cancelable: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, shiftKey: shift, bubbles: true })); return 1; };
  N.tarjeta = () => { const v = document.getElementById('valle-tarjeta'); return !!v && !v.classList.contains('oculto'); };
  N.aviso = () => { const a = document.getElementById('aviso'); return a && !a.classList.contains('oculto') ? a.innerText.replace(/\s+/g, ' ') : ''; };
  N.notas = () => [...document.querySelectorAll('#notas .nota')].map((n) => (n.__titulo || '') + ' / ' + (n.__sub || ''));
  N.esperarNota = async (re, seg = 6) => { const r = new RegExp(re); for (let i = 0; i < seg * 4; i++) { const n = N.notas().find((x) => r.test(x)); if (n) return n; await N.tick(0.25); } return ''; };
  N.fundido = () => document.getElementById('fundido').classList.contains('activo');
  N.tren = (o) => { const t = H.tren, e = t.est; e.subido = false; e.conduce = false; e.varado = false; e.esperaNieve = 0;
    if (o.parado) { e.s = t.poste(o.parada) % t.largo; e.parado = o.parado; e.vel = 0; e.proxima = o.parada; }
    else { e.s = (t.poste(o.parada) + o.metros) % t.largo; e.parado = 0; e.vel = 7; const i = t.paradas.indexOf(o.parada); e.proxima = t.paradas[(i + 1) % t.paradas.length]; }
    return 1; };
  N.aldea = () => H.tren.paradas.find((q) => q.aldea);
  N.panelCargas = () => { const p = document.getElementById('cargas') || document.querySelector('.panel-cargas'); return p ? { oculto: p.classList.contains('oculto'), texto: p.innerText.replace(/\s+/g, ' ').slice(0, 900) } : null; };
  N.paneles = () => [...document.querySelectorAll('.panel, [id^=panel], #charla, #almacen, #feria, #cargas')].filter((e) => e.offsetParent !== null).map((e) => e.id || e.className);
  N.aldeaEntera = () => { const A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return 0; const a = P.aldea;
    const L = { carpintero: 'carpinteria', veterinaria: 'veterinaria', panadera: 'panaderia', herbolaria: 'herboristeria', herrero: 'herreria', modista: 'costureria', pescador: 'pescaderia', botera: 'varadero', maestra: 'escuela', pintora: 'taller-arte', enfermera: 'puesto-sanitario', andinista: 'refugio-andinista', ceramista: 'ceramica' };
    const ks = Object.keys(L).filter((k) => A.estadoEdificio(L[k]));
    a.pobladores = ks.map((clave) => ({ clave, dia: 1 })); a.obras = {}; a.locales = Object.fromEntries(ks.map((k) => [L[k], 1])); a.descubierta = 1; a.llegando = null;
    A.actualizar(4, H.camara.position); return ks.length; };
  N.ranura = async (re) => { for (let i = 1; i <= 8; i++) { N.tecla('Digit' + i); await N.tick(0.08); if (re.test(H.__ranuraActual())) return H.__ranuraActual(); } return ''; };
  N.npc = (k) => H.gente.gente.find((g) => (g.claveAldea || g.clave) === k);
  N.charla = () => ({ abierta: !document.getElementById('charla').classList.contains('oculto'), texto: document.getElementById('charla-texto').textContent });
  N.mirarA = (x, z, hx, hz) => { H.jugador.ubicar(x, z, Math.atan2(-(hx - x), -(hz - z))); H.jugador.estado.sentado = false; return 1; };
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
  const N = (c) => js(`(async () => { const H = window.__hojarasca, N = window.__N, P = H.progreso, t = H.tren; return (${c}); })()`);
  const url = process.env.HTML ? path.resolve(process.env.HTML) : path.join(raiz, 'index.html');
  const foto = async (nombre) => {
    for (let intento = 0; intento < 3; intento++) try {
      await esperar(700 + intento * 600);
      const img = await w.webContents.capturePage();
      fs.writeFileSync(path.join(salida, nombre + '.png'), img.toPNG());
      console.log(`  (captura ${nombre}.png)`);
      return;
    } catch (e) { if (intento === 2) console.log(`  (captura ${nombre} no se pudo: ${e && e.message})`); }
  };
  const ajustes = (o) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({calidad:'media', clima:'despejado', musica:false, modo:'relax', relaxTipo:'libre', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'}, ${JSON.stringify(o)}))); 1`;
  const esperarJuego = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false)) return true; } return false; };
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000);
    await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
    await N('N.tick(2)');
    for (let k = 0; k < 6 && (await N('N.tarjeta()')); k++) { await N('(() => { const b = document.querySelector("#valle-tarjeta button[data-valle-opcion]"); if (b) b.click(); return 1 })()'); await N('N.tick(0.6)'); }
  };
  const abrir = async (o, limpiar) => {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`${limpiar ? 'localStorage.clear(); ' : ''}${ajustes(o)}`);
    await w.loadFile(url, { search: '?debug=1' });
    await js('window.__sinPausaPorBlur = true; 1');
    if (!(await esperarJuego())) throw new Error('el juego no cargó');
  };
  const seccion = async (nombre, fn) => {
    if (!parte(nombre)) return;
    donde = nombre;
    try { await fn(); } catch (err) { console.log('ERROR en', nombre + ':', err && err.stack || err); errores.push(`${nombre}: ${err && err.message || err}`); }
    await js(`(() => { const H = window.__hojarasca; if (H) H.__camaraFija = null; return 1 })()`).catch(() => 0);
    const fallas = await js('(() => { const C = window.__hojarasca && window.__hojarasca.__caidas; return C && C.fallas ? JSON.stringify(C.fallas()).slice(0, 600) : "" })()').catch(() => '');
    if (fallas && fallas !== '[]') { console.log('  FALLAS DEL JUEGO: ' + fallas); errores.push(nombre + ': fallas del juego ' + fallas.slice(0, 200)); }
  };
  const sonda = async (q) => { try { return await N(q); } catch (e) { return 'ERROR ' + (e && e.message); } };
  let prog0 = 0;
  try {
    await abrir({ calidad: CALIDAD }, true);
    await entrar();
    await N('(() => { H.clima.estado.lluvia = 0; P.dia = 30; P.horas = 11; return 1 })()');
    console.log('  locales abiertos:', await N('N.aldeaEntera()'));
    await N('N.tick(3)');
    prog0 = await N('N.programas()');
    console.log('  programas al empezar:', await N('N.programas()'));
    const hora = async (h) => { await N(`(() => { H.clima.estado.lluvia = 0; P.horas = ${h}; return 1 })()`); await N('N.tick(2.5)'); };
    // el sitio del banco y el punto de vista: de frente al cartel del horario (en el marco del edificio: x 1,3, y 2,6 sobre el piso, z D/2)
    await seccion('cartel', async () => {
      await hora(11);
      const s = await N(`(() => { const A = H.__aldeaMundo(), b = A.estadoEdificio('banco-pueblo').sitio; return b })()`);
      console.log('  sitio del banco:', JSON.stringify(s));
      const vista = async (dist, nombre, alto = 0) => {
        await N(`(() => { const A = H.__aldeaMundo(), b = A.estadoEdificio('banco-pueblo').sitio, th = b.rot, c = Math.cos(th), sn = Math.sin(th);
          const w = (lx, lz) => ({ x: b.x + lx * c + lz * sn, z: b.z - lx * sn + lz * c });
          const yo = w(1.3, 3.2 + ${dist}), ca = w(1.3, 3.2);
          H.jugador.ubicar(yo.x, yo.z, Math.atan2(-(ca.x - yo.x), -(ca.z - yo.z))); H.jugador.estado.pitch = ${alto}; return 1 })()`);
        await N('N.tick(2)'); await foto(nombre);
      };
      await vista(1.6, '1-cartel-banco-cerca');
      await vista(3.5, '1-cartel-banco-3m');
      await vista(6, '1-cartel-banco-6m');
    });
    // los bajos del alero: parado en el andén mirando para arriba (Aldea y Estación del Valle), de día, al ocaso y de noche
    await seccion('anden', async () => {
      for (const [nombre, parada] of [['aldea', 'N.aldea()'], ['valle', 't.paradas[0]']]) {
        for (const h of [11, 19.5, 23]) {
          await hora(h);
          await N(`(() => { const p = ${parada}; H.jugador.ubicar(p.anden.x, p.anden.z, 0); H.jugador.estado.pitch = 0; return 1 })()`);
          // mirar para arriba hacia el alero: el andén queda entre la vía y el galpón; se mira desde el medio del andén hacia el galpón y arriba
          const g = await N(`(() => { const p = ${parada}; const e = H.jugador.estado; const gx = p.galpon ? p.galpon.x : null; return { anden: p.anden, claves: Object.keys(p).slice(0, 30) } })()`);
          if (h === 11 && nombre === 'aldea') console.log('  parada:', JSON.stringify(g));
          await N(`(() => { const p = ${parada}; const e = H.jugador.estado; e.yaw = e.yaw; e.pitch = 0.9; return 1 })()`);
          await N('N.tick(1.5)'); await foto(`2-anden-${nombre}-${String(h).replace('.', '_')}`);
        }
      }
    });
    // el suelo que se ve contra el que se pisa: 1098 puntos cada 4 m en el marco de la Aldea, con un rayo hacia abajo contra el parche
    await seccion('suelo', async () => {
      await hora(11);
      const r = await N(`(() => { const A = H.__aldeaMundo(), THREE = H.THREE, ray = new THREE.Raycaster(), V = THREE.Vector3;
        const parche = H.escena.getObjectByName('terreno-aldea'); if (!parche) return { error: 'sin parche' };
        parche.updateMatrixWorld(true);
        const M = A.medir(); const errs = [];
        for (let lx = -170; lx <= 95; lx += 4) for (let lz = 5; lz <= 85; lz += 4) {
          const w = A.aMundo(lx, lz), h = H.T.altura(w.x, w.z);
          ray.set(new V(w.x, h + 50, w.z), new V(0, -1, 0));
          const hit = ray.intersectObject(parche, false)[0]; if (!hit) continue;
          errs.push({ e: Math.abs(hit.point.y - h), lx, lz });
        }
        errs.sort((a, b) => a.e - b.e);
        const q = (p) => +(errs[Math.floor(errs.length * p)].e * 100).toFixed(1);
        return { n: errs.length, medianaCm: q(0.5), p90Cm: q(0.9), p99Cm: q(0.99), maxCm: +(errs[errs.length - 1].e * 100).toFixed(1), mayores10cm: errs.filter((o) => o.e > 0.10).length, peores: errs.slice(-4).map((o) => [o.lx, o.lz, +(o.e * 100).toFixed(1)]),
          parcheTris: M.parcheTris, ripioTris: M.ripioTris, emparejarMs: +(+M.emparejarMs).toFixed(1), celda: M.parche && (M.parche.X1 - M.parche.X0) / M.parche.nx }; })()`);
      console.log('  suelo:', JSON.stringify(r));
      await foto('3-suelo-aldea');
    });
    // V con un panel o una charla abierta no tira lo de la mano (y sin nada abierto sí)
    await seccion('v', async () => {
      await hora(11);
      await N('(() => { P.materiales = P.materiales || {}; P.materiales.tronco = 9; P.economia && (P.economia.pesos = 20000); return 1 })()');
      const tronco = () => N('P.materiales.tronco');
      const bultos = () => N('(H.objetos.bultos() || []).length');
      // el puesto de cargas
      await N('N.tren({ parada: N.aldea(), parado: 80 })');
      await N('(() => { const p = N.aldea(); N.mirarA(p.cargas.x + 1.2, p.cargas.z + 0.6, p.cargas.x, p.cargas.z); return 1 })()'); await N('N.tick(0.8)');
      console.log('  mano:', JSON.stringify(await N('N.ranura(/tronco/i)')));
      await N('N.tecla("KeyE")'); await N('N.tick(0.5)');
      const abierto = await N('!N.panelCargas().oculto');
      const t0 = await tronco(), b0 = await bultos();
      await N('N.tecla("KeyV")'); await N('N.tick(0.5)');
      ok(abierto && (await tronco()) === t0 && (await bultos()) === b0, `con el puesto de cargas abierto, V no tira (troncos ${t0} → ${await tronco()}, bultos ${b0} → ${await bultos()})`);
      await N('N.tecla("Escape")'); await N('N.tick(0.4)');
      // la mochila abierta (Tab no: la tecla de la mochila)
      const nota1 = await N('N.panelCargas().oculto');
      // una charla
      await N('(() => { P.dia = 19; if (P.negocios) P.negocios.pedidos = {}; const s = H.__aldeaMundo().estadoEdificio("plaza").sitio; H.jugador.ubicar(s.x + 4, s.z + 4, 0); return 1 })()'); await N('N.tick(2)');
      for (let i = 0; i < 12 && !(await N('!!H.gente.gente.find((g) => g.claveAldea)')); i++) { await N('(() => { H.__aldea.actualizar(2); return 1 })()'); await N('N.tick(1.5)'); }
      const k = await N('(H.gente.gente.find((g) => g.claveAldea) || {}).claveAldea || ""');
      console.log('  vecino para charlar:', k);
      if (k) {
        await N(`(() => { const g = H.gente.gente.find((q) => q.claveAldea === "${k}"); const p = g.g.position, a = g.g.rotation.y, x = p.x + Math.sin(a) * 1.4, z = p.z + Math.cos(a) * 1.4; H.jugador.ubicar(x, z, Math.atan2(-(p.x - x), -(p.z - z))); return 1 })()`); await N('N.tick(0.4)');
        await N(`(() => { H.hablar(H.gente.gente.find((q) => q.claveAldea === "${k}")); return 1 })()`); await N('N.tick(0.4)');
        const charlando = await N('N.charla().abierta');
        const t1 = await tronco(), b1 = await bultos();
        await N('N.tecla("KeyV")'); await N('N.tick(0.5)');
        ok(charlando && (await tronco()) === t1 && (await bultos()) === b1, `con una charla abierta, V no tira (troncos ${t1} → ${await tronco()}, bultos ${b1} → ${await bultos()})`);
        for (let i = 0; i < 8 && (await N('N.charla().abierta')); i++) { await N('N.tecla("Escape")'); await N('N.tick(0.2)'); }
      }
      // sin nada abierto, V tira
      await N('(() => { const s = H.__aldeaMundo().estadoEdificio("plaza").sitio; N.mirarA(s.x + 6, s.z + 6, s.x, s.z); return 1 })()'); await N('N.tick(0.8)');
      await N('N.ranura(/tronco/i)');
      const t2 = await tronco();
      await N('N.tecla("KeyV")'); await N('N.tick(0.5)');
      ok((await tronco()) === t2 - 1, `sin nada abierto, V tira un tronco (${t2} → ${await tronco()})`);
    });
    // «E para subir» sólo cuando la E sube
    await seccion('tren', async () => {
      await hora(11);
      await N('N.tren({ parada: N.aldea(), parado: 200 })');
      const estado = () => N('(() => { const e = document.getElementById("estado"); return e && !e.classList.contains("oculto") ? e.innerText.split(String.fromCharCode(10)).join(" ") : "" })()');
      const lugares = [];
      for (const [dx, dz] of [[0, 0], [0, 1.2], [-3, 0.6], [3, 0.6], [6, 0.6], [-6, 0.6], [0, -1], [8, 0]]) {
        await N(`(() => { const p = N.aldea(); H.jugador.ubicar(p.anden.x + ${dx}, p.anden.z + ${dz}, 0); H.jugador.estado.pitch = 0; H.jugador.estado.enTren = false; return 1 })()`); await N('N.tick(0.7)');
        const sube = await N('t.puedeSubir(H.jugador.estado)'), txt = await estado();
        const dice = /E para subir/.test(txt);
        lugares.push({ dx, dz, sube, dice, txt: txt.slice(0, 90) });
      }
      for (const l of lugares) console.log(`  (${l.dx}, ${l.dz}) puedeSubir=${l.sube} · «${l.txt}»`);
      ok(lugares.every((l) => l.dice === l.sube || (!l.txt)), '«E para subir» sale en todos los lugares donde la E sube y en ninguno donde no');
      ok(lugares.some((l) => l.dice) && lugares.some((l) => !l.dice && l.txt), 'hay lugares de los dos tipos (se probó los dos casos)');
      // donde dice «E para subir», la E sube
      const donde = lugares.find((l) => l.dice);
      if (donde) {
        await N(`(() => { const p = N.aldea(); H.jugador.ubicar(p.anden.x + ${donde.dx}, p.anden.z + ${donde.dz}, 0); return 1 })()`); await N('N.tick(0.7)');
        await N('N.tecla("KeyE")'); await N('N.tick(1.2)');
        ok(await N('H.jugador.estado.enTren'), 'donde el aviso dice «E para subir», la E sube');
      }
    });
    console.log('  programas:', await N('N.programas()'));

    console.log('  programas:', prog0, '→', await N('N.programas()'));
  } catch (err) {
    console.log('ERROR:', err && err.stack || err);
    errores.push(String(err && err.message || err));
  }
  if (consola.length) console.log('consola:', consola.slice(0, 6));
  console.log(errores.length ? `\n${errores.length} problemas:\n${errores.map((e) => '  · ' + e).join('\n')}` : '\nTodo en orden');
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(errores.length ? 1 : 0); }
});

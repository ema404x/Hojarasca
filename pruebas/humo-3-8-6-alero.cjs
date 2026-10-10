// 3.8.6 (relax): la historia de Martín y el alero del arriero (3.8.4), de punta a punta en el juego de verdad:
//   1. Martín en el taller del tren: el aviso y la E abren la rueda; lo del abuelo está en «Charlar»;
//   2. te lo pide (tres renglones con E) y queda anotado (paso 1); se guarda y se recarga a mitad del pedido;
//   3. después de recargar, Martín te lo recuerda con el rumbo desde la aldea;
//   4. caminás de verdad (con W, sin teletransporte) desde el frente del alero, pasás la pirca y llegás al nombre:
//      la nota «Fermín Sepúlveda 1927» y el paso 2;
//   5. de vuelta en el taller: «Encontré el nombre de tu abuelo», los seis renglones, la amistad, el diario, el paso 3,
//      y ya no hay más opciones del alero.
// Uso: HOJ_PERFIL=<carpeta> npx electron --no-sandbox -r ./herramientas/perfil-propio.cjs pruebas/humo-3-8-6-alero.cjs
const { app, BrowserWindow, dialog } = require('electron');
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); app.exit(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa sin atender): ${e && e.stack ? e.stack : e}`); app.exit(1); });
const path = require('path');
const fs = require('fs');
const raiz = path.resolve(__dirname, '..');
app.setPath('userData', path.resolve(process.env.HUMO_PERFIL || path.join(raiz, 'pruebas', 'salidas', 'perfil-alero-386')));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const salidas = path.join(raiz, 'pruebas', 'salidas', 'alero-386');
fs.mkdirSync(salidas, { recursive: true });

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: true, width: 1280, height: 760, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = 'carga';
  const js = (c) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 120 s (${donde})`)), 120000)),
  ]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const listo = async () => {
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__aldea && window.__hojarasca.__social && window.__hojarasca.__social())').catch(() => false)) return true; }
    return false;
  };
  const H = 'window.__hojarasca';
  const P = `${H}.progreso`;
  const ajustes = `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'muybaja', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre', relaxTipo: 'libre' }));`;
  const tecla = (code) => js(`(()=>{ document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', bubbles: true })); return 1 })()`);
  const cuadros = (n = 4) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  const asentar = async (t = 3) => { await cuadros(4); for (let i = 0; i < t; i++) { await esperar(110); await cuadros(2); } };
  const aldea = (n = 1, dt = 0.6) => js(`(()=>{ for (let i = 0; i < ${n}; i++) { ${H}.__aldea.actualizar(${dt}); ${H}.__aldea.mundo()?.prearmar?.(1e6); } return 1 })()`);
  const rueda = () => js(`${H}.__rueda()`);
  const vista = () => js(`(()=>{ const c = document.getElementById('charla'); return { abierta: !c.classList.contains('oculto'), quien: document.getElementById('charla-quien').textContent, texto: document.getElementById('charla-texto').textContent, rueda: ${H}.__rueda() } })()`);
  const npc = `(${H}.gente.gente.find((g) => (g.claveAldea || g.clave) === 'martin' && !g.aBordo))`;
  const captura = async (nombre) => {
    await cuadros(3); await esperar(300); await cuadros(2);
    const img = await w.webContents.capturePage();
    fs.writeFileSync(path.join(salidas, nombre), img.toPNG());
    console.log(`  (captura: pruebas/salidas/alero-386/${nombre})`);
  };
  const leer = async () => { const t = []; let v = await vista(); for (let i = 0; i < 12 && v.abierta && !v.rueda.abierta; i++) { t.push(v.texto); await tecla('KeyE'); v = await vista(); } return { renglones: t, v }; };
  const hastaRueda = async () => { let v = await vista(); for (let i = 0; i < 10 && v.abierta && !v.rueda.abierta; i++) { await tecla('KeyE'); v = await vista(); } return v; };
  // Martín, delante de vos en el taller: lo traemos a la puerta del taller y nos ponemos enfrente
  const aMartin = async () => {
    await js(`${H}.__cerrarCharla(); 1`).catch(() => {});
    const r = await js(`(()=>{ const t = ${H}.__aldea.edificio('taller-tren'); const n = ${npc}; if (!t || !n) return { t: !!t, n: !!n };
      const x = n.pos.x, z = n.pos.z; ${H}.jugador.ubicar(x, z + 1.7, Math.atan2(0, -(-1.7))); ${H}.jugador.estado.pitch = -0.08; return { x, z } })()`);
    await asentar();
    return r;
  };
  // la rueda: buscar la opción del alero en cada categoría; devuelve { cat, titulo } o null
  const buscarAlero = async (re) => {
    let r = await rueda();
    if (r.nivel === 2) { await tecla('Escape'); r = await rueda(); }
    const cats = r.sectores.map((s) => s.categoria);
    for (let k = 0; k < cats.length; k++) {
      if (!cats[k] || cats[k] === 'chau') continue;
      await tecla(`Digit${k + 1}`);
      const r2 = await rueda();
      const i = r2.nivel === 2 ? r2.sectores.findIndex((s) => re.test(s.titulo)) : -1;
      if (i >= 0) return { cat: cats[k], i, titulo: r2.sectores[i].titulo };
      if (r2.nivel === 2) await tecla('Escape');
    }
    return null;
  };
  const charlar = async () => {
    const av = await js(`${H}.__aviso()`);
    await tecla('KeyE');
    const v = await hastaRueda();
    return { av, v };
  };

  try {
    await w.loadURL('about:blank');
    await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
    await abrir();
    ok(await listo(), 'el juego cargó');
    await js(`(()=>{ localStorage.clear(); ${ajustes} return 1 })()`);
    await abrir();
    ok(await listo(), 'una partida Relax nueva');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
    await cuadros(3);
    const hay = await js(`(()=>{ const l = ${H}.T.lugares.cueva; return l ? { nombre: l.nombre, s: l.sepulveda, puerta: l.puerta } : null })()`);
    ok(!!hay?.s, `el alero está en el valle (${JSON.stringify(hay)})`);

    // ============================================================ 1. Martín en el taller
    seccion('1. Martín');
    await js(`(()=>{ ${P}.horas = 10; ${H}.ajustes.limiteFps = 'libre'; const t = ${H}.__aldea.edificio('taller-tren'); ${H}.jugador.ubicar(t.x + 4, t.z + 4, 0); return 1 })()`);
    await aldea(40);
    await asentar(4);
    let m = await aMartin();
    ok(m && Number.isFinite(m.x), `Martín está (${JSON.stringify(m)})`);
    let c = await charlar();
    ok(/Martín|Hablar/.test(c.av) && c.v.abierta && c.v.rueda.abierta, `el aviso («${c.av}») y la E abren la charla con Martín (${c.v.quien})`);
    let op = await buscarAlero(/familia ferroviaria/);
    ok(!!op, `la opción del abuelo está en la rueda (${JSON.stringify(op)})`);
    ok(op?.cat === 'charla', `y está en «Charlar» (${op?.cat})`);
    await captura('1-rueda-martin.png');
    if (op) await js(`${H}.__elegirCharla(${op.i}); 1`);
    let l = await leer();
    ok(l.renglones.length === 3 && /Fermín/.test(l.renglones[0]) && /Sepúlveda/.test(l.renglones[2]), `los tres renglones del pedido (${l.renglones.map((t) => t.slice(0, 30)).join(' | ')})`);
    ok((await js(`${P}.aleroArriero?.paso`)) === 1, 'el pedido queda anotado (paso 1)');

    // ============================================================ 2. guardar y recargar
    seccion('2. guardar y recargar a mitad del pedido');
    await js(`${H}.__cerrarCharla(); ${H}.guardar(); 1`);
    await abrir();
    ok(await listo(), 'recargó');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
    await cuadros(3);
    ok((await js(`${P}.aleroArriero?.paso`)) === 1, 'el pedido sigue después de recargar');
    await js(`(()=>{ ${P}.horas = 10.5; const t = ${H}.__aldea.edificio('taller-tren'); ${H}.jugador.ubicar(t.x + 4, t.z + 4, 0); return 1 })()`);
    await aldea(40);
    await asentar(3);
    m = await aMartin();
    c = await charlar();
    op = await buscarAlero(/nombre de tu abuelo/);
    ok(op?.titulo === 'Lo del nombre de tu abuelo', `Martín te lo recuerda (${JSON.stringify(op)})`);
    if (op) await js(`${H}.__elegirCharla(${op.i}); 1`);
    l = await leer();
    ok(l.renglones.length === 2 && /desde la aldea queda a \d+ m al /.test(l.renglones[1]), `con el rumbo («${l.renglones[1]}»)`);
    await js(`${H}.__cerrarCharla(); 1`);

    // ============================================================ 3. caminar hasta el nombre
    seccion('3. caminar hasta el nombre tallado');
    const ida = await js(`(()=>{ const l = ${H}.T.lugares.cueva; const fx = l.puerta.x, fz = l.puerta.z; const d = Math.hypot(l.sepulveda.x - fx, l.sepulveda.z - fz);
      ${H}.jugador.ubicar(fx, fz, Math.atan2(-(l.sepulveda.x - fx), -(l.sepulveda.z - fz))); return { d } })()`);
    await asentar(2);
    let llego = null;
    for (let i = 0; i < 80 && !llego; i++) {
      // camina mirando al nombre (corrige el rumbo cada tramo)
      llego = await js(`(()=>{ const l = ${H}.T.lugares.cueva, j = ${H}.jugador, p = j.estado.pos;
        j.estado.yaw = Math.atan2(-(l.sepulveda.x - p.x), -(l.sepulveda.z - p.z));
        j.teclas.add('KeyW'); for (let k = 0; k < 4; k++) ${H}.__bucle(); j.teclas.delete('KeyW');
        const t = document.getElementById('notas').textContent;
        return ${P}.aleroArriero?.paso === 2 ? { d: Math.hypot(p.x - l.sepulveda.x, p.z - l.sepulveda.z), y: p.y, nota: t } : null })()`);
      await esperar(20);
    }
    const fin = await js(`(()=>{ const l = ${H}.T.lugares.cueva, p = ${H}.jugador.estado.pos; return { d: Math.hypot(p.x - l.sepulveda.x, p.z - l.sepulveda.z), y: p.y, piso: l.y, paso: ${P}.aleroArriero?.paso } })()`);
    ok(!!llego, `caminando desde el frente (a ${ida.d.toFixed(1)} m) se llega al nombre (${JSON.stringify(llego || fin)})`);
    ok(/Fermín Sepúlveda 1927/.test(llego?.nota || ''), `la nota del nombre («${llego?.nota}»)`);
    // mirando la pared (la captura del alero)
    await js(`(()=>{ const l = ${H}.T.lugares.cueva, j = ${H}.jugador, p = j.estado.pos; j.estado.yaw = Math.atan2(-(l.pared.x - p.x), -(l.pared.z - p.z)); j.estado.pitch = 0.05; return 1 })()`);
    await captura('2-el-nombre.png');
    await js(`${H}.guardar(); 1`);

    // ============================================================ 4. contarle
    seccion('4. volver a contarle');
    await js(`(()=>{ ${P}.horas = 15; const t = ${H}.__aldea.edificio('taller-tren'); ${H}.jugador.ubicar(t.x + 4, t.z + 4, 0); return 1 })()`);
    await aldea(40);
    await asentar(3);
    m = await aMartin();
    const amistadAntes = await js(`${P}.vecindad?.personas?.martin?.p || 0`);
    c = await charlar();
    op = await buscarAlero(/Encontré el nombre/);
    ok(!!op, `«Encontré el nombre de tu abuelo» (${JSON.stringify(op)})`);
    if (op) await js(`${H}.__elegirCharla(${op.i}); 1`);
    l = await leer();
    ok(l.renglones.length === 6 && /1927/.test(l.renglones[0]) && /mate/.test(l.renglones[5]), `los seis renglones de la historia (${l.renglones.map((t) => t.slice(0, 24)).join(' | ')})`);
    const despues = await js(`({ paso: ${P}.aleroArriero?.paso, amistad: ${P}.vecindad?.personas?.martin?.p || 0 })`);
    ok(despues.paso === 3, `paso 3 (${despues.paso})`);
    ok(despues.amistad >= amistadAntes + 12, `la amistad sube (${amistadAntes} → ${despues.amistad})`);
    const dia = await js(`JSON.stringify(${P}.diarioHoy || null)`);
    ok(/Fermín Sepúlveda/.test(dia || ''), `queda en el diario (${String(dia).slice(0, 160)})`);
    await js(`${H}.__cerrarCharla(); 1`);
    await asentar(1);
    c = await charlar();
    op = await buscarAlero(/abuelo|ferroviaria/);
    ok(!op, `y ya no hay más opciones del alero (${JSON.stringify(op)})`);
    await js(`${H}.__cerrarCharla(); 1`);
  } catch (e) {
    ok(false, `excepción: ${e && e.stack ? e.stack : e}`);
  }
  const errs = errores;
  console.log(errs.length ? `\nFALLAS (${errs.length}):\n${errs.join('\n')}` : '\nTODO BIEN');
  app.exit(errs.length ? 1 : 0);
});

// Partida real 4.3 (Electron + WebGL): el empleo fijo, con las teclas de verdad.
//   · los cuatro locales (almacén, casa de té, taller ferroviario y banco), cada uno un día distinto: el cartel de turnos, el aviso de la E,
//     la pregunta «¿Querés trabajar acá?», fichar, el HUD del turno, la marca de la tarea que toca, las ocho tareas (la E en cada lugar, la
//     barra, el reloj que corre), el cobro al terminar y que la E del mostrador, el vecino mirado o la puerta no se la coman;
//   · el cartel que sólo informa (el domingo, antes de hora, el turno de hoy ya hecho);
//   · irse antes: la pregunta con la multa, lo cobrado y la falta;
//   · el ascenso (con los días y el oficio puestos por el gancho de la prueba) y el sueldo nuevo en el turno siguiente;
//   · el guardado a medias del turno y la página «Trabajo en la aldea» del cuaderno.
// Uso (desde la carpeta del proyecto, después de `node armar.mjs`):
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-3-empleo.cjs -Espera 1500 -Arg1 --salida=C:\carpeta
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const salida = path.resolve(arg('salida', path.join(raiz, 'pruebas', 'salidas', 'empleo')));
const [ANCHO, ALTO] = arg('tam', '1366x768').split('x').map(Number);
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
// --solo=ascenso: sólo el ascenso y el cuaderno (para repetir un tramo)
const solo = arg('solo', '');
const hacer = (...nombres) => !solo || nombres.includes(solo);

// ---------------------------------------------------------------- lo que corre en la página
const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, P = H.progreso, J = H.jugador;
  const A = window.__A = {};
  H.ajustes.limiteFps = 'libre';
  A.dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  A.tecla = (code) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true })); return 1; };
  // cuadros con tiempo de verdad entre medio (el aviso y el vecino mirado se refrescan por tiempo, no por cuadro)
  A.cuadros = async (n = 6, ms = 90) => { for (let i = 0; i < n; i++) { J.actualizar(0.05); H.__bucle(); await A.dormir(ms); } return 1; };
  A.en = (id, bx, bz) => { const e = H.__aldea.edificio(id), c = Math.cos(e.rot), s = Math.sin(e.rot); return [e.x + bx * c + bz * s, e.z - bx * s + bz * c]; };
  A.tp = (x, z, yaw = 0) => { if (J.estado.sentado) J.sentarse(false); J.ubicar(x, z, yaw); for (let i = 0; i < 6; i++) J.actualizar(0.05); return 1; };
  A.mirarA = (x, z) => { const js = J.estado; js.yaw = Math.atan2(-(x - js.pos.x), -(z - js.pos.z)); return 1; };
  A.aviso = () => document.getElementById('aviso')?.textContent.replace(/\s+/g, ' ').trim() || '';
  A.notas = () => [...document.querySelectorAll('#notas .nota')].map((n) => n.textContent.replace(/\s+/g, ' ').trim());
  A.limpiarNotas = () => { document.querySelectorAll('#notas .nota').forEach((n) => n.remove()); return 1; };
  A.dialogo = () => { const d = document.getElementById('dialogo'); return d && !d.classList.contains('oculto') ? d.textContent.replace(/\s+/g, ' ').trim() : ''; };
  A.hud = () => { const h = document.getElementById('turno-hud'); return h && h.style.display !== 'none' ? h.textContent.replace(/\s+/g, ' ').trim() : ''; };
  A.barra = () => { const h = document.getElementById('turno-hud'); const b = h?.lastChild; return !!b && b.style.display !== 'none'; };
  A.estado = () => ({ sentado: !!J.estado.sentado, dia: P.dia, horas: +P.horas.toFixed(3), pesos: P.economia.pesos, turno: P.empleo?.turno ? { local: P.empleo.turno.local, hechas: P.empleo.turno.hechas, total: P.empleo.turno.total, seq: P.empleo.turno.seq.slice() } : null, panel: H.__hud.panelAbierto(), hablando: !!H.charla?.npc, haciendo: H.__empleo().haciendo(), marca: H.__empleo().mundo()?.marcaVisible() ?? null });
  // caminar de verdad (con las colisiones) hasta un punto: ¿se llega al lugar? (resto: lo que quedó sin andar)
  A.caminar = (x, z, max = 700) => { const js = J.estado; J.teclas.clear(); for (let i = 0; i < max; i++) { const dx = x - js.pos.x, dz = z - js.pos.z; if (Math.hypot(dx, dz) < 0.3) break; js.yaw = Math.atan2(-dx, -dz); J.teclas.add('KeyW'); J.actualizar(0.05); } J.teclas.clear(); J.actualizar(0.02); return { resto: +Math.hypot(x - js.pos.x, z - js.pos.z).toFixed(2), dy: +(js.pos.y - H.__empleo().lugar('almacen', 'ficha').y).toFixed(2) }; };
  A.alcanza = (local, id, ini) => { const l = A.lugar(local, id); A.tp(...A.en(local, ini[0], ini[1]), 0); const js = J.estado; const r = A.caminar(l.x, l.z); return { resto: r.resto, dy: +(js.pos.y - l.y).toFixed(2) }; };
  // el pueblo montado y los vecinos armados (sin esperar los cuadros)
  A.montar = () => { const AM = H.__aldeaMundo(); let n = 0; while (AM.medir().cola > 0 && n < 300) { AM.montarCola(true); n++; } H.__aldea.mundo().prearmar(120000); for (let k = 0; k < 6; k++) H.__aldea.actualizar(0.6); return n; };
  A.dia = (dia, hora) => { P.dia = dia; P.horas = hora; for (let k = 0; k < 4; k++) H.__aldea.actualizar(0.6); return 1; };
  // parado en el lugar id del local, a un paso, y las notas viejas afuera
  A.lugar = (local, id) => { const l = H.__empleo().lugar(local, id); return { x: l.x, z: l.z, y: l.y, giro: l.giro }; };
  A.irA = (local, id, dx = 0.25, dz = 0.25) => { const l = A.lugar(local, id); A.tp(l.x + dx, l.z + dz, 0); return 1; };
  // el cartel de frente: a 1,5 m, en la dirección a la que mira, mirándolo
  A.alFicha = (local) => A.tp(...A.en(local, ...A.fichas[local]), 0);
  A.verCartel = (local, dist = 1.5) => { const l = A.lugar(local, 'ficha'), g = l.giro + (A.giros?.[local] || 0); A.tp(l.x + Math.sin(g) * dist, l.z + Math.cos(g) * dist, 0); A.mirarA(l.x, l.z); return 1; };
  // la tarea de pie a 2 m, desde el lado del centro del local, mirándola
  A.verTarea = (local, id) => { const l = A.lugar(local, id), e = H.__aldea.edificio(local); const dx = e.x - l.x, dz = e.z - l.z, d = Math.hypot(dx, dz) || 1; A.tp(l.x + (dx / d) * 2.0, l.z + (dz / d) * 2.0, 0); A.mirarA(l.x, l.z); return 1; };
  A.guardadoEmpleo = () => { for (const k of Object.keys(localStorage)) { const v = localStorage.getItem(k); if (!v || !v.includes('"empleo"')) continue; try { const o = JSON.parse(v); const hallar = (x, prof = 0) => { if (!x || typeof x !== 'object' || prof > 5) return null; if (x.empleo && typeof x.empleo === 'object' && Object.hasOwn(x.empleo, 'locales')) return x.empleo; for (const y of Object.values(x)) { const r = hallar(y, prof + 1); if (r) return r; } return null; }; const e = hallar(o); if (e) return { turno: e.turno ? { local: e.turno.local, hechas: e.turno.hechas } : null, total: e.total, dias: Object.fromEntries(Object.entries(e.locales).map(([q, l]) => [q, l.dias])) }; } catch {} } return null; };
  // el reloj de la prueba: la tarea ya
  A.tarea = async () => {
    const EJ = H.__empleo(), t = EJ.turno();
    if (!t) return null;
    const id = t.seq[t.hechas];
    A.irA(t.local, id);
    await A.cuadros(5, 100);
    const antes = { aviso: A.aviso(), est: A.estado() };
    A.tecla('KeyE');
    await A.cuadros(2, 60);
    const mitad = { haciendo: EJ.haciendo(), barra: A.barra(), hud: A.hud(), est: A.estado() };
    EJ.actualizar(0.1);
    EJ.actualizar(8);
    await A.cuadros(2, 60);
    return { id, antes, mitad, despues: A.estado() };
  };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [];
  const E = await import(pathToFileURL(path.join(raiz, 'src', 'empleo.js')).href);
  const w = new BrowserWindow({ show: false, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = 'carga';
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 180 s (${donde})`)), 180000))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const A = (c) => js(`(()=>{ const A = window.__A, H = window.__hojarasca, P = H.progreso; return (${c}) })()`);
  const foto = async (nombre) => {
    await A('A.cuadros(3, 120)'); await esperar(300);
    w.webContents.invalidate();
    await js(`Promise.race([new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(()=>r('ok')))), new Promise((r)=>setTimeout(()=>r('sin cuadros'),1500))])`);
    const img = await w.webContents.capturePage({ x: 0, y: 0, width: ANCHO, height: ALTO });
    const s = img.getSize();
    const png = (s.width === ANCHO && s.height === ALTO ? img : img.resize({ width: ANCHO, height: ALTO, quality: 'best' })).toPNG();
    fs.writeFileSync(path.join(salida, `${nombre}.png`), png);
    console.log(`  captura ${nombre}.png (${s.width}×${s.height})`);
  };
  w.webContents.on('did-finish-load', () => w.webContents.enableDeviceEmulation({ screenPosition: 'desktop', screenSize: { width: ANCHO, height: ALTO }, viewSize: { width: ANCHO, height: ALTO }, deviceScaleFactor: 1, viewPosition: { x: 0, y: 0 }, scale: 1 }));
  w.webContents.on('did-finish-load', () => w.webContents.insertCSS('*, *::before, *::after { transition: none !important; } #pista-clic { display: none !important; }'));
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const H = 'window.__hojarasca';
  const pesos = (n) => `$${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  const notasTxt = async () => (await A('A.notas()')).join(' | ');

  try {
    seccion('carga');
    await abrir();
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'media', clima: 'despejado', estacion: 'otono', musica: false, modo: 'relax', relaxTipo: 'libre', autoCalidad: false, guiaPrimerDia: false, idioma: 'es', limiteFps: 'libre' })); 1`);
    await abrir();
    let listo = false;
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.jugador && ${H}.__empleo)`).catch(() => false)) { listo = true; break; } }
    ok(listo, 'carga el Relax con el empleo');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(4000);
    await js(PAGINA);
    await js(`window.__A.fichas = ${JSON.stringify(Object.fromEntries(Object.entries(E.PUESTOS).map(([k, p]) => [k, [p.ficha.x, p.ficha.z]])))}; 1`);
    await js(`window.__A.giros = ${JSON.stringify(Object.fromEntries(Object.entries(E.PUESTOS).map(([k, p]) => [k, p.ficha.giro || 0])))}; 1`);
    ok(await A('!!P.economia && P.modo !== "desafio" && !!H.__empleo()'), 'la partida es del Relax y trae el empleo armado');
    ok(await A('P.empleo && P.empleo.turno === null && Object.keys(P.empleo.locales).length === 0'), 'la partida nueva no tiene ningún puesto');
    await A('A.montar()');
    // el mundo: los cuatro carteles y la marca
    await A('(A.dia(2, 12), A.cuadros(4, 100), 1)');
    ok(await A('H.__empleo().mundo().grupo.children.length') === 5, 'el mundo tiene los cuatro carteles y la marca');
    ok(await A('H.__empleo().mundo().grupo.children.every((m) => m.material === H.__empleo().mundo().grupo.children[0].material)'), 'todo con el mismo material (no compila nada nuevo)');

    if (hacer('locales')) {
    // ---------------------------------------------------------------- 1. el cartel que sólo informa
    seccion('el cartel que informa');
    await A('(A.dia(2, 12), A.limpiarNotas(), 1)');
    await A('(A.alFicha("almacen"), A.cuadros(8, 110), 1)');
    let av = await A('A.aviso()');
    ok(/^E ?Cartel de turnos: Almacén de Ramos Generales$/.test(av) || av === 'ECartel de turnos: Almacén de Ramos Generales', `a las 12 el cartel del almacén sólo informa (aviso «${av}»)`);
    await A('(A.verCartel("almacen"), A.cuadros(6, 110), 1)');
    await foto('01-almacen-cartel-informa');
    await A('(A.alFicha("almacen"), A.cuadros(4, 100), 1)');
    await A('(A.tecla("KeyE"), A.cuadros(3, 80), 1)');
    ok(/Se ficha desde las 15:30/.test(await notasTxt()), `E dice cuándo se ficha («${(await notasTxt()).slice(0, 120)}»)`);
    ok(!(await A('A.estado().panel')) && !(await A('A.estado().hablando')), 'sin abrir el mostrador ni hablar con nadie');
    // domingo (día 7)
    await A('(A.dia(7, 16.2), A.limpiarNotas(), A.alFicha("almacen"), A.cuadros(6, 110), A.tecla("KeyE"), A.cuadros(3, 80), 1)');
    ok(/domingo/.test(await notasTxt()), 'el domingo no se trabaja');

    // ---------------------------------------------------------------- 2. los cuatro locales, cada uno un día
    const LOCALES = [
      { id: 'almacen', dia: 2, hora: 16.0, foto: '02' },
      { id: 'casa-te', dia: 3, hora: 9.0, foto: '03' },
      { id: 'taller-tren', dia: 4, hora: 8.0, foto: '04' },
      { id: 'banco-pueblo', dia: 5, hora: 8.6, foto: '05' },
    ];
    let primero = true;
    for (const L of LOCALES) {
      const Pu = E.PUESTOS[L.id];
      seccion(`el turno en ${Pu.completo}`);
      await A(`(A.dia(${L.dia}, ${L.hora}), A.limpiarNotas(), 1)`);
      const antes = await A('A.estado()');
      if (L.id === 'casa-te') {
        // la puerta, abierta con E (la cocina está adentro)
        await A('(A.tp(...A.en("casa-te", -0.6, 3.5), 0), A.mirarA(...A.en("casa-te", -0.1, 1.0)), A.cuadros(8, 110), 1)');
        const a0 = await A('A.aviso()');
        if (/Abrir/.test(a0)) { await A('(A.tecla("KeyE"), A.cuadros(30, 60), 1)'); }
        ok(true, `la puerta de la casa de té («${a0}»)`);
      }
      // ¿se llega a cada lugar del puesto, a pie? (desde adentro, o desde la galería con la puerta abierta en la casa de té)
      { const ini = { almacen: [0, 0.3], 'casa-te': [0, 0.2], 'taller-tren': [3, 2.2], 'banco-pueblo': [0, 2.4] }[L.id];
        for (const id of ['ficha', ...Pu.tareas.map((q) => q.id)]) {
          const afuera = (L.id === 'casa-te' && ['ficha', 'servir'].includes(id)) || (L.id === 'almacen' && id === 'vereda');
          const r = await A(`A.alcanza(${JSON.stringify(L.id)}, ${JSON.stringify(id)}, ${JSON.stringify(afuera ? (L.id === 'casa-te' ? [0, 3.9] : [0, 3.8]) : ini)})`);
          ok(r.resto <= 1.2 && Math.abs(r.dy) <= 0.3, `${L.id}/${id}: se llega a pie (a ${r.resto} m, piso ${r.dy >= 0 ? '+' : ''}${r.dy})`);
        } }
      // el cartel
      await A(`(A.verCartel(${JSON.stringify(L.id)}), A.cuadros(8, 110), 1)`);
      await A(`(A.tp(...A.en(${JSON.stringify(L.id)}, ${Pu.ficha.x}, ${Pu.ficha.z}), 0), A.cuadros(8, 110), 1)`);
      av = await A('A.aviso()');
      const esperadoAviso = `Tomar el puesto: ${Pu.cargos[0]} · turno de ${E.horaCorta(Pu.desde)} a ${E.horaCorta(Pu.hasta)} · ${pesos(Pu.sueldos[0])}`;
      ok(av.replace(/^E\s*/, '') === esperadoAviso, `el aviso: «${esperadoAviso}» (salió «${av}»)`);
      await A(`(A.verCartel(${JSON.stringify(L.id)}), A.cuadros(6, 110), 1)`);
      await foto(`${L.foto}a-${L.id}-cartel`);
      await A(`(A.tp(...A.en(${JSON.stringify(L.id)}, ${Pu.ficha.x}, ${Pu.ficha.z}), 0), A.cuadros(6, 110), 1)`);
      // la pregunta
      await A('(A.tecla("KeyE"), A.cuadros(4, 100), 1)');
      const dlg = await A('A.dialogo()');
      ok(dlg.includes('¿Querés trabajar acá?') && dlg.includes(Pu.cargos[0]) && dlg.includes(`turno de ${E.horaCorta(Pu.desde)} a ${E.horaCorta(Pu.hasta)}, ${pesos(Pu.sueldos[0])}`) && dlg.includes('Tomar el puesto') && dlg.includes('Ahora no'), `la pregunta del puesto (${dlg.slice(0, 110)}…)`);
      if (primero) { await foto('02b-pregunta-del-puesto'); primero = false; }
      await A('(A.tecla("Enter"), 1)'); await esperar(500);
      await A('A.cuadros(4, 100)');
      const fich = await A('A.estado()');
      ok(fich.turno && fich.turno.local === L.id && fich.turno.hechas === 0 && fich.turno.total === 8, 'fichaste: turno de ocho tareas');
      ok((await A('A.hud()')).includes(Pu.cargos[0]) && (await A('A.hud()')).includes(`tareas 0 de 8`), `el HUD del turno dice el cargo y «tareas 0 de 8» («${(await A('A.hud()')).slice(0, 90)}»)`);
      ok(fich.marca === true, 'y la marca de la primera tarea está en el lugar');
      ok(/Fichaste en/.test(await notasTxt()) && (await notasTxt()).includes(Pu.jefe), 'el aviso de fichar nombra a quien manda');
      // la primera tarea de lejos, con el HUD y la marca
      const primera = fich.turno.seq[0];
      await A(`(A.verTarea(${JSON.stringify(L.id)}, ${JSON.stringify(primera)}), A.cuadros(8, 110), 1)`);
      await foto(`${L.foto}b-${L.id}-hud-y-marca`);
      // las ocho
      let ultimo = null;
      for (let i = 1; i <= 8; i++) {
        const r = await A('A.tarea()');
        const tarea = Pu.tareas.find((t) => t.id === r.id);
        ok(r.antes.aviso.replace(/^E\s*/, '') === `${tarea.nombre} (${i} de 8)`, `tarea ${i}: el aviso dice «${tarea.nombre} (${i} de 8)» (salió «${r.antes.aviso}»)`);
        ok(r.mitad.haciendo === true && r.mitad.barra === true, `tarea ${i}: E la empieza y la barra se ve`);
        ok(!r.antes.est.panel && !r.antes.est.hablando && !r.mitad.est.panel && !r.mitad.est.hablando, `tarea ${i}: ni el mostrador, ni una charla, ni la puerta se comen la E`);
        if (i === 1) { await A(`(A.verTarea(${JSON.stringify(L.id)}, ${JSON.stringify(r.id)}), 1)`); }
        ultimo = r;
        if (i < 8) ok(r.despues.turno && r.despues.turno.hechas === i, `tarea ${i}: cuenta (${i} de 8) ${r.despues.turno ? '' : JSON.stringify({ antes: r.antes.est, mitad: r.mitad.est, despues: r.despues })}`);
        if (i === 1) {
          // la barra a la mitad, en una captura
          await A('(A.dia(P.dia, P.horas), 1)');
        }
      }
      ok(ultimo.despues.turno === null, 'a la octava tarea el turno se cierra solo');
      const fin = await A('A.estado()');
      ok(fin.pesos - antes.pesos === Pu.sueldos[0], `cobraste el sueldo: ${pesos(Pu.sueldos[0])} (billetera ${pesos(antes.pesos)} → ${pesos(fin.pesos)})`);
      ok(Math.abs((fin.horas - antes.horas) - 3.2) < 0.45, `el reloj corrió con las tareas: de ${antes.horas.toFixed(2)} a ${fin.horas.toFixed(2)} (unas 3,2 h)`);
      const nt = await notasTxt();
      ok(/Terminó el turno en/.test(nt) && nt.includes(`Cobraste ${pesos(Pu.sueldos[0])}`), `el aviso de cobro («${nt.slice(0, 140)}»)`);
      ok((await A('A.hud()')) === '' && fin.marca === false, 'el HUD y la marca se van');
      await foto(`${L.foto}c-${L.id}-cobro`);
      // y el cartel ya no deja volver a fichar hoy
      await A(`(A.verCartel(${JSON.stringify(L.id)}, 1.0), A.limpiarNotas(), A.cuadros(6, 110), A.tecla("KeyE"), A.cuadros(3, 80), 1)`);
      ok(/Ya hiciste tu turno de hoy/.test(await notasTxt()), 'hoy no se ficha dos veces');
    }
    ok(await A('P.empleo.total.turnos') === 4 && await A('Object.values(P.empleo.locales).every((l) => l.dias === 1)'), 'cuatro turnos, un día cumplido en cada local');

    // ---------------------------------------------------------------- 3. irse antes
    seccion('irse antes');
    await A('(A.dia(8, 9.0), A.limpiarNotas(), 1)');
    const pre = await A('A.estado()');
    await A('(A.alFicha("casa-te"), A.cuadros(8, 110), A.tecla("KeyE"), A.cuadros(4, 100), A.tecla("Enter"), 1)'); await esperar(500);
    for (let i = 0; i < 2; i++) await A('A.tarea()');
    ok((await A('A.estado()')).turno?.hechas === 2, 'dos tareas en la casa de té');
    await A('(A.alFicha("casa-te"), A.cuadros(8, 110), 1)');
    av = await A('A.aviso()');
    ok(/Irte del turno antes de tiempo \(cobrás \$300\)/.test(av), `en el cartel, con el turno en marcha: «${av}»`);
    await A('(A.tecla("KeyE"), A.cuadros(4, 100), 1)');
    const dlg2 = await A('A.dialogo()');
    ok(/cobrás \$300 \(menos \$100 por irte antes\)/.test(dlg2), `la pregunta cuenta la multa («${dlg2.slice(0, 150)}»)`);
    await foto('06a-irse-antes-pregunta');
    await A('(A.tecla("Enter"), 1)'); await esperar(500); await A('A.cuadros(3, 100)');
    const post = await A('A.estado()');
    ok(post.turno === null && post.pesos - pre.pesos === 300, `si te vas cobrás lo hecho menos la multa: $300 (billetera ${pesos(pre.pesos)} → ${pesos(post.pesos)})`);
    ok(/Te fuiste de la casa de té/.test(await notasTxt()), 'el aviso lo dice');
    ok(await A('P.empleo.locales["casa-te"].faltas') === 1 && await A('P.empleo.locales["casa-te"].dias') === 1, 'queda la falta y no suma día');
    await foto('06b-irse-antes-aviso');

    }
    // ---------------------------------------------------------------- 4. el ascenso
    seccion('el ascenso');
    await A('(P.empleo.locales.almacen = P.empleo.locales.almacen || { dias: 0, faltas: 0, escalon: 0, ultimo: 0, cobrado: 0 }, 1)');
    // (gancho de la prueba: cuatro días cumplidos en el almacén y el huertero en nivel 1; el quinto turno asciende)
    await A('(P.empleo.locales.almacen.dias = 4, P.oficios.xp = { ...(P.oficios.xp || {}), huertero: 40 }, A.dia(9, 16.0), A.limpiarNotas(), 1)');
    await A('(A.alFicha("almacen"), A.cuadros(8, 110), A.tecla("KeyE"), A.cuadros(4, 100), A.tecla("Enter"), 1)'); await esperar(500);
    for (let i = 0; i < 8; i++) { const r = await A('A.tarea()'); if (solo) console.log(`   tarea ${i + 1}: ${r && r.id} hora ${r && r.despues.horas} turno ${JSON.stringify(r && r.despues.turno && r.despues.turno.hechas)}`); }
    ok((await A('A.estado()')).turno === null, 'el quinto turno del almacén se cerró');
    await esperar(2600); await A('A.cuadros(4, 100)');
    const ntA = await notasTxt();
    ok(/Ascendiste: Despachante/.test(ntA) && /empleado en el almacén y cobrás \$2\.100 por turno/.test(ntA), `el aviso de ascenso («${ntA.slice(0, 160)}»)`);
    await foto('07-ascenso');
    ok(await A('P.empleo.locales.almacen.escalon') === 1, 'el escalón queda guardado');
    const p9 = await A('A.estado().pesos');
    await A('(A.dia(10, 16.0), A.limpiarNotas(), A.alFicha("almacen"), A.cuadros(8, 110), 1)');
    av = await A('A.aviso()');
    ok(av.includes('Despachante') && av.includes('$2.100'), `al día siguiente el cartel ofrece el cargo y el sueldo nuevos («${av}»)`);
    await A('(A.tecla("KeyE"), A.cuadros(4, 100), A.tecla("Enter"), 1)'); await esperar(500);
    for (let i = 0; i < 8; i++) await A('A.tarea()');
    ok((await A('A.estado().pesos')) - p9 === 2100, 'y el turno paga $2.100');

    // ---------------------------------------------------------------- 5. el guardado a medias y el cuaderno
    seccion('el guardado y el cuaderno');
    await A('(A.dia(11, 8.6), A.limpiarNotas(), A.alFicha("banco-pueblo"), A.cuadros(8, 110), A.tecla("KeyE"), A.cuadros(4, 100), A.tecla("Enter"), 1)'); await esperar(500);
    for (let i = 0; i < 3; i++) await A('A.tarea()');
    let g = null;
    for (let i = 0; i < 20 && !(g && g.turno); i++) { await esperar(500); g = await A('A.guardadoEmpleo()'); await A('A.cuadros(2, 60)'); }
    ok(g && g.turno && g.turno.local === 'banco-pueblo' && g.turno.hechas === 3, `el turno a medias está en el guardado (${JSON.stringify(g && g.turno)})`);
    ok(g && g.total.turnos >= 6, 'y los totales también');
    await A('(A.irA("banco-pueblo", "billetes"), A.cuadros(4, 100), 1)');
    await A('H.__empleo().cerrar("tiempo")');
    await A('A.tecla("KeyJ")'); await esperar(500);
    await A('(H.__aldea.oficios().elegir("empleo"), H.__aldea.cuaderno("oficios"), 1)'); await esperar(400);
    const cuad = await js(`document.getElementById('cuaderno').textContent.replace(/\\s+/g, ' ')`);
    ok(cuad.includes('Trabajo en la aldea') && cuad.includes('Despachante') && cuad.includes('Últimos turnos'), 'el cuaderno trae «Trabajo en la aldea» con el historial');
    ok(/Despachante · 6 días cumplidos|Empleado · 6 días cumplidos/.test(cuad), 'con los días cumplidos del almacén');
    await foto('08-cuaderno-trabajo');
    await A('(A.tecla("KeyJ"), 1)'); await esperar(400);

    ok(errores.length === 0, `sin errores en la consola${errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''}`);
  } catch (e) {
    console.log('✗ ' + (e && e.stack || e));
    errores.push(String(e));
  }
  console.log(errores.length ? `FALLÓ (${errores.length})` : 'TODO BIEN');
  app.exit(errores.length ? 1 : 0);
});

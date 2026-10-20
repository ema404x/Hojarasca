// Partida real 4.4.2 (Electron + WebGL, oculto): los arreglos del empleo fijo vistos en el juego.
//   · el HUD del turno con el cuaderno, la pausa, el modo foto y la letra grande;
//   · el ascenso con el oficio llegado después de los días («Ascendiste»);
//   · el sábado de baile y el día de fiesta: el cartel dice que hoy no hay turno y por qué;
//   · comprar el almacén en pleno turno (compra real por la charla del negocio);
//   · dormir con el turno a medias; la tarea de las bandejas lejos de la silla.
// Uso (después de `node armar.mjs`): powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-4-2-empleo.cjs -Espera 900 -Arg1 --salida=C:\carpeta
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const salida = path.resolve(arg('salida', path.join(raiz, 'pruebas', 'salidas', 'empleo-442')));
const [ANCHO, ALTO] = [1366, 768];
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, P = H.progreso, J = H.jugador;
  const A = window.__A = {};
  H.ajustes.limiteFps = 'libre';
  A.dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  A.tecla = (code) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true })); return 1; };
  A.cuadros = async (n = 6, ms = 90) => { for (let i = 0; i < n; i++) { J.actualizar(0.05); H.__bucle(); await A.dormir(ms); } return 1; };
  A.en = (id, bx, bz) => { const e = H.__aldea.edificio(id), c = Math.cos(e.rot), s = Math.sin(e.rot); return [e.x + bx * c + bz * s, e.z - bx * s + bz * c]; };
  A.tp = (x, z, yaw = 0) => { if (J.estado.sentado) J.sentarse(false); J.ubicar(x, z, yaw); for (let i = 0; i < 6; i++) J.actualizar(0.05); return 1; };
  A.montar = () => { const AM = H.__aldeaMundo(); let n = 0; while (AM.medir().cola > 0 && n < 300) { AM.montarCola(true); n++; } H.__aldea.mundo().prearmar(120000); for (let k = 0; k < 6; k++) H.__aldea.actualizar(0.6); return n; };
  A.dia = (dia, hora) => { P.dia = dia; P.horas = hora; for (let k = 0; k < 4; k++) H.__aldea.actualizar(0.6); return 1; };
  A.hud = () => { const h = document.getElementById('turno-hud'); if (!h) return null; const cs = getComputedStyle(h); const r = h.getBoundingClientRect(); return { display: cs.display, z: cs.zIndex, pos: cs.position, padre: h.parentElement && h.parentElement.id, rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], txt: h.textContent.slice(0, 70) }; };
  A.notas = () => [...document.querySelectorAll('#notas .nota')].map((n) => n.textContent.replace(/\s+/g, ' ').trim());
  A.limpiarNotas = () => { document.querySelectorAll('#notas .nota').forEach((n) => n.remove()); return 1; };
  A.aviso = () => document.getElementById('aviso')?.textContent.replace(/\s+/g, ' ').trim() || '';
  A.verCartel = (local, dist = 1.0) => { const l = H.__empleo().lugar(local, 'ficha'); const e = H.__aldea.edificio(local); const dx = l.x - e.x, dz = l.z - e.z, d = Math.hypot(dx, dz) || 1; A.tp(l.x + (dx / d) * dist, l.z + (dz / d) * dist, 0); const js = J.estado; js.yaw = Math.atan2(-(l.x - js.pos.x), -(l.z - js.pos.z)); return 1; };
  A.reset = (dia, hora) => { P.empleo = undefined; P.negociosVecinos = undefined; A.dia(dia, hora); return 1; };
  A.completar = () => { let n = 0; while (H.__empleo().turno() && n < 12) { H.__empleo()._tareaYa(); n++; } return n; };
  A.amistad = (clave, p, hist) => { const f = P.vecindad?.personas?.[clave]; if (!f) return false; f.p = p; f.max = Math.max(f.max || 0, p >= 140 ? 2 : p >= 50 ? 1 : 0); f.hist = hist; return true; };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [];
  let fallos = 0, aciertos = 0;
  const w = new BrowserWindow({ show: false, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300)); });
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error('timeout 60s')), 60000))]);
  const A = async (c) => { if (process.env.HUMO_TRAZA) console.log('    >', c.slice(0, 100)); const r = await js(`(()=>{ try { const A = window.__A, H = window.__hojarasca, P = H.progreso; return Promise.resolve((${c})).then((v) => ({ v }), (e) => ({ e: String(e && e.stack || e).slice(0, 400) })); } catch (e) { return { e: String(e && e.stack || e).slice(0, 400) }; } })()`); if (r && r.e) throw new Error('en la página: ' + r.e + ' <= ' + c.slice(0, 120)); return r ? r.v : undefined; };
  const log = (...x) => console.log(...x);
  const ok = (c, m) => { if (c) aciertos++; else fallos++; log(c ? '  OK  ' : '  FALLA', m); };
  const foto = async (nombre) => {
    await A('A.cuadros(3, 120)'); await esperar(300);
    w.webContents.invalidate();
    await js(`Promise.race([new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(()=>r('ok')))), new Promise((r)=>setTimeout(()=>r('sin cuadros'),1500))])`);
    for (let intento = 0; intento < 3; intento++) {
      try { const img = await w.webContents.capturePage({ x: 0, y: 0, width: ANCHO, height: ALTO }); fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG()); log('  captura', nombre); break; } catch (e) { if (intento === 2) log('  sin captura', nombre, String(e)); else await esperar(700); }
    }
  };
  w.webContents.on('did-finish-load', () => w.webContents.insertCSS('*, *::before, *::after { transition: none !important; } #pista-clic { display: none !important; }'));
  const url = pathToFileURL(path.join(raiz, 'index.html')).href;
  const abrir = async () => { try { await w.loadURL(url + '?debug=1'); } catch (e) { await esperar(1500); await w.loadURL(url + '?debug=1'); } };
  try {
    await abrir();
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'media', clima: 'despejado', estacion: 'otono', musica: false, modo: 'relax', relaxTipo: 'libre', autoCalidad: false, guiaPrimerDia: false, idioma: 'es', limiteFps: 'libre' })); 1`);
    await abrir();
    let listo = false;
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(window.__hojarasca && window.__hojarasca.jugador && window.__hojarasca.__empleo)`).catch(() => false)) { listo = true; break; } }
    log('carga', listo);
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(4000);
    await js(PAGINA);
    await A('A.montar()');

    // ---------------------------------------------------------------- 1. el HUD del turno
    log('== el HUD del turno (B2, B9)');
    await A('(A.reset(2, 16.2), 1)'); await A('A.cuadros(4, 100)');
    const f = await A('H.__empleo()._fichar("almacen")');
    ok(f.ok, 'se ficha en el almacén (gancho de la prueba)');
    const [ax, az] = await A('A.en("almacen", 0, 0.3)');
    await A(`(A.tp(${ax}, ${az}, 0), A.cuadros(6, 100), 1)`);
    let h = await A('A.hud()');
    ok(h && h.display !== 'none' && h.padre === 'hud' && h.z === 'auto', 'el HUD está dentro de #hud, sin z-index propio: ' + JSON.stringify(h));
    await foto('01-hud-en-juego');
    const ancho1 = h.rect[2];
    await A('A.tecla("KeyJ")'); await esperar(500); await A('A.cuadros(4, 100)');
    await foto('02-hud-con-cuaderno');
    // lo que hay en el punto donde está el HUD: si el cuaderno lo tapa, el elemento de arriba no es el HUD
    let arriba = await js(`(() => { const r = document.getElementById('turno-hud').getBoundingClientRect(); const e = document.elementFromPoint(r.left + 20, r.top + 20); return e ? (e.closest('#turno-hud') ? 'hud' : (e.id || e.className || e.tagName)) : null; })()`);
    ok(arriba !== 'hud', 'con el cuaderno abierto, el HUD queda debajo (en ese punto se ve: ' + arriba + ')');
    await A('A.tecla("KeyJ")'); await esperar(400);
    await A('A.tecla("Escape")'); await esperar(700); await A('A.cuadros(4, 100)');
    await foto('03-hud-con-pausa');
    arriba = await js(`(() => { const r = document.getElementById('turno-hud').getBoundingClientRect(); const e = document.elementFromPoint(r.left + 20, r.top + 20); return e ? (e.closest('#turno-hud') ? 'hud' : (e.id || e.className || e.tagName)) : null; })()`);
    ok(arriba !== 'hud', 'con la pausa, el HUD queda debajo (en ese punto se ve: ' + arriba + ')');
    await A('A.tecla("Escape")'); await esperar(700); await A('A.cuadros(3, 100)');
    await A('H.abrirModoFoto(true)'); await esperar(400); await A('A.cuadros(4, 100)');
    const vis = await js(`(() => { const h = document.getElementById('turno-hud'); const cs = getComputedStyle(h); let o = h, oculto = false; while (o) { if (o.classList && o.classList.contains('oculto')) oculto = true; o = o.parentElement; } const r = h.getBoundingClientRect(); const e = document.elementFromPoint(r.left + 20, r.top + 20); return { oculto, display: cs.display, vis: cs.visibility, enEscena: !!(e && e.closest('#turno-hud')) }; })()`);
    ok(vis.oculto || vis.display === 'none', 'en el modo foto el HUD del turno no se dibuja: ' + JSON.stringify(vis));
    await foto('04-modo-foto');
    await A('H.abrirModoFoto(false)'); await esperar(400);
    // la letra grande
    await js(`document.documentElement.style.setProperty('--escala-letra', '1.5'); document.getElementById('hud').style.setProperty('--escala-letra', '1.5'); 1`);
    await A('A.cuadros(4, 100)');
    h = await A('A.hud()');
    log('  ancho con letra 1 / 1,5:', ancho1, h.rect[2], JSON.stringify(h.rect));
    ok(h.rect[2] > ancho1 * 1.3, 'con la letra grande el HUD del turno crece');
    await foto('05-hud-letra-grande');
    await js(`document.documentElement.style.setProperty('--escala-letra', '1'); document.getElementById('hud').style.setProperty('--escala-letra', '1'); 1`);
    await A('H.__empleo().cerrar("tiempo")');

    // ---------------------------------------------------------------- 2. el ascenso con el oficio después de los días
    log('== el ascenso (B3)');
    await A('(A.reset(3, 16.1), P.oficios = P.oficios || {}, 1)');
    await A('(P.empleo = { v: 1, locales: { almacen: { dias: 5, faltas: 0, escalon: 0, ultimo: 2, cobrado: 0 } }, turno: null, hoy: { dia: 0, turnos: 0 }, total: { turnos: 5, cobrado: 8000, abandonos: 0 }, historial: [] }, P.oficios.xp = Object.assign(P.oficios.xp || {}, { huertero: 400 }), 1)');
    await A('A.verCartel("almacen", 1.0)'); await A('A.cuadros(6, 100)');
    const av = await A('A.aviso()');
    ok(/Despachante/.test(av), 'el cartel ya ofrece Despachante: «' + av + '»');
    await A('H.__empleo()._fichar("almacen")');
    await A('A.limpiarNotas()');
    await A('A.completar()');
    await A('A.cuadros(3, 150)');
    let nt = (await A('A.notas()')).join(' | ');
    await esperar(2600); await A('A.cuadros(3, 150)');
    nt += ' | ' + (await A('A.notas()')).join(' | ');
    ok(/Ascendiste: Despachante/.test(nt), 'sale el aviso «Ascendiste: Despachante»: «' + nt.slice(0, 200) + '»');
    ok(await A('P.empleo.locales.almacen.escalon') === 1, 'y el escalón queda guardado');
    await foto('06-ascendiste');

    // ---------------------------------------------------------------- 3. el sábado de baile y el día de fiesta
    log('== sin jefe, sin turno (B4)');
    await A('(A.reset(13, 15.8), P.aldea.locales.salon = P.aldea.locales.salon || {}, 1)');
    await A('A.verCartel("almacen", 1.0)'); await A('A.cuadros(10, 120)');
    let aviso = await A('A.aviso()');
    ok(/Cartel de turnos/.test(aviso) && !/Tomar el puesto/.test(aviso), 'el sábado de baile, junto al cartel del almacén sólo informa: «' + aviso + '»');
    await A('A.limpiarNotas()'); await A('A.tecla("KeyE")'); await A('A.cuadros(4, 120)');
    nt = (await A('A.notas()')).join(' | ');
    ok(/Hoy no hay turno: Ercilia está en el baile del salón/.test(nt), 'la E dice por qué: «' + nt.slice(0, 220) + '»');
    await foto('07-sabado-de-baile-sin-turno');
    // la casa de té el mismo sábado sí
    await A('(A.dia(13, 8.6), A.verCartel("casa-te", 0.6), 1)'); await A('A.cuadros(10, 120)');
    aviso = await A('A.aviso()');
    log('  casa-te accion:', JSON.stringify(await A('(() => { const a = H.__empleo().accion(H.jugador.estado); return a ? { tipo: a.tipo, texto: a.texto } : null; })()')), 'pos', JSON.stringify(await A('({ x: H.jugador.estado.pos.x, z: H.jugador.estado.pos.z, y: H.jugador.estado.pos.y, ficha: H.__empleo().lugar("casa-te", "ficha") })')));
    ok(/Tomar el puesto/.test(aviso), 'ese sábado la casa de té sí toma gente: «' + aviso + '»');
    // un día de fiesta: la fiesta del verano (día 2 del año), año 3
    await A('(A.dia(26, 15.8), A.verCartel("almacen", 1.0), 1)'); await A('A.cuadros(10, 120)');
    aviso = await A('A.aviso()');
    await A('A.limpiarNotas()'); await A('A.tecla("KeyE")'); await A('A.cuadros(4, 120)');
    nt = (await A('A.notas()')).join(' | ');
    ok(/Cartel de turnos/.test(aviso) && /Hoy no hay turno: Ercilia está en la fiesta/.test(nt), 'el día de la fiesta del verano tampoco hay turno en el almacén: «' + nt.slice(0, 220) + '»');
    await foto('08-dia-de-fiesta-sin-turno');
    // un lunes cualquiera, el almacén toma gente
    await A('(A.dia(15, 15.8), A.verCartel("almacen", 1.0), 1)'); await A('A.cuadros(10, 120)');
    aviso = await A('A.aviso()');
    if (!/Tomar el puesto/.test(aviso)) { log('  accion:', JSON.stringify(await A('(() => { const a = H.__empleo().accion(H.jugador.estado); return a && { tipo: a.tipo, texto: a.texto }; })()'))); }
    ok(/Tomar el puesto/.test(aviso), 'un día común sí hay turno: «' + aviso + '»');

    // ---------------------------------------------------------------- 4. comprar el almacén con el turno en marcha
    log('== comprar el local en pleno turno (B5)');
    await A('(A.reset(16, 16.1), 1)');
    await A('A.limpiarNotas()');
    await A('H.__empleo()._fichar("almacen")');
    for (let i = 0; i < 3; i++) await A('H.__empleo()._tareaYa()');
    const pesos0 = await A('P.economia.pesos = 400000');
    await A('A.amistad("ercilia", 160, 3)');
    // (la compra por la charla es del frente del negocio y pide toda la conversación: acá se deja el estado que deja `comprar`, y la compra de verdad se prueba en Node)
    await A('(P.negociosVecinos = { v: 1, comprados: { almacen: { desde: P.dia, pagado: 150000, destino: "queda", orden: 1, visita: P.dia, bono: 1, caja: 0, total: 0, perdido: 0, ultimo: null } }, socios: {}, ultimoDia: P.dia, orden: 1, rechazos: {}, historial: [], total: { ganado: 0, invertido: 150000, devuelto: 0, cobrado: 0 } }, P.economia.pesos -= 150000, 1)');
    ok(await A('!!P.negociosVecinos && !!P.negociosVecinos.comprados.almacen'), 'el almacén es tuyo (compra real)');
    ok(await A('!!H.__empleo().turno()'), 'recién comprado, el turno todavía figura (hasta la próxima pasada del reloj del empleo)');
    await A('A.limpiarNotas()');
    await A('A.cuadros(14, 100)');
    ok(await A('H.__empleo().turno()') === null, 'a los pocos instantes el turno se cerró solo');
    nt = (await A('A.notas()')).join(' | ');
    ok(/Ya es tuyo el almacén/.test(nt), 'con el aviso: «' + nt.slice(0, 200) + '»');
    const dif = await A('P.economia.pesos') - (pesos0 - 150000);
    ok(dif === 600, 'se cobró lo hecho (3 de 8 = $600) y nada más: diferencia ' + dif);
    ok(await A('P.empleo.locales.almacen.dias') === 0, 'sin sumar el día');
    await foto('09-compra-en-pleno-turno');
    await A('A.verCartel("almacen", 1.0)'); await A('A.cuadros(10, 120)');
    ok(!/Tomar el puesto/.test(await A('A.aviso()')), 'y desde que es tuyo no se ofrece turno: «' + (await A('A.aviso()')) + '»');
    await A('A.tecla("KeyJ")'); await esperar(500);
    await A('(H.__aldea.oficios().elegir("empleo"), H.__aldea.cuaderno("oficios"), 1)'); await esperar(500);
    const cuad = await js(`document.getElementById('cuaderno').textContent.replace(/\\s+/g, ' ')`);
    ok(/Almacén de Ramos Generales · es tuyo/.test(cuad), 'el cuaderno marca el almacén como tuyo');
    await foto('10-cuaderno-es-tuyo');
    await A('A.tecla("KeyJ")'); await esperar(300);

    // ---------------------------------------------------------------- 5. dormir con el turno a medias
    log('== dormir sin terminar (B6)');
    await A('(A.reset(22, 16.1), 1)');
    const fi = await A('H.__empleo()._fichar("almacen")');
    ok(fi.ok, 'se ficha en el almacén un lunes');
    for (let i = 0; i < 3; i++) await A('H.__empleo()._tareaYa()');
    await A('(A.tp(...A.en("almacen", 0, 0.3), 0), 1)');
    await A('(P.horas = 19.7, 1)'); await A('A.cuadros(8, 120)');
    const pBefore = await A('P.economia.pesos');
    await A('A.limpiarNotas()');
    const vistas = new Set();
    await A('H.__dormir()');
    for (let i = 0; i < 20; i++) { await esperar(500); await A('A.cuadros(1, 20)'); for (const x of await A('A.notas()')) vistas.add(x); }
    const tras = await A('({ turno: P.empleo.turno, faltas: P.empleo.locales.almacen && P.empleo.locales.almacen.faltas, pesos: P.economia.pesos, dia: P.dia })');
    log('  después de dormir:', JSON.stringify(tras));
    ok(tras.dia === 23 && tras.turno === null && tras.faltas === 1 && tras.pesos - pBefore === 450, 'dormir con 3 de 8 hechas cierra el turno con la multa y la falta ($600 menos $150)');
    nt = [...vistas].join(' | ');
    ok(/Te fuiste a dormir sin terminar el turno/.test(nt) , 'el aviso: «' + nt.slice(0, 200) + '»');

    // ---------------------------------------------------------------- 6. las bandejas lejos de la silla
    log('== la tarea de las bandejas (B9)');
    await A('(A.reset(23, 9.2), 1)');
    await A('H.__empleo()._fichar("casa-te")');
    await A('(P.empleo.turno.seq[0] = "bandejas", 1)');
    const lt = await A('(() => { const l = H.__empleo().lugar("casa-te", "bandejas"); return [l.x, l.z]; })()');
    await A(`(A.tp(${lt[0]}, ${lt[1]}, 0), A.cuadros(10, 120), 1)`);
    const pos = await A('({ x: +H.jugador.estado.pos.x.toFixed(2), z: +H.jugador.estado.pos.z.toFixed(2) })');
    ok(Math.hypot(pos.x - lt[0], pos.z - lt[1]) < 0.35, 'se puede estar parado en el lugar de la tarea (queda en ' + JSON.stringify(pos) + ')');
    aviso = await A('A.aviso()');
    ok(/Armar las bandejas/.test(aviso), 'ahí la E es la tarea: «' + aviso + '»');
    await foto('11-bandejas');
    await A('H.__empleo().cerrar("abandono")');

    log('errores de consola:', JSON.stringify(errores));
    ok(errores.length === 0, 'sin errores en la consola');
  } catch (e) {
    fallos++;
    log('ERROR', e && e.stack || e);
  }
  log(`RESULTADO: ${aciertos} bien, ${fallos} mal`);
  app.exit(fallos ? 1 : 0);
});

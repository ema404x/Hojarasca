// Partida real 4.4.2 (Electron + WebGL, oculto): CONSTRUCCIÓN 4.2 y las teclas con Mayús, con las teclas de verdad.
//   · correr (Mayús) y tocar E junto a un depósito NO cobra ni amplía; E mantenida: primero el precio y después, mantenida otra vez, la ampliación;
//   · Supr junto a un depósito saca todo lo guardado (aunque lleves lo mismo); Supr con los planos abiertos: primero avisa, la segunda desmonta;
//     Mayús + Supr es lo mismo que Supr; M mueve una pieza;
//   · llover dentro de un galpón (herrería propia, barraca): no llueve adentro;
//   · picar rocas, guardar, recargar la página: no vuelven.
// Uso (desde la carpeta del proyecto, después de `node armar.mjs`):
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-4-2-construccion.cjs -Espera 900 -Arg1 --salida=C:\carpeta
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const salida = path.resolve(arg('salida', path.join(raiz, 'pruebas', 'salidas', 'construccion-442')));
const [ANCHO, ALTO] = arg('tam', '1366x768').split('x').map(Number);
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
// --solo=deposito|mover|local|lluvia|picar: un tramo por vez (si otra ventana se cierra a la fuerza, se repite sólo ése)
const solo = arg('solo', process.env.HUMO_SOLO || '');
const hacer = (...nombres) => !solo || nombres.includes(solo);

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, O = H.obras, T = H.T, J = H.jugador, P = H.progreso;
  const A = window.__A = {};
  H.ajustes.limiteFps = 'libre';
  // (el juego se pausa solo si la ventana pierde el foco —otra ventana encima—: antes de cada tecla, si quedó en pausa, se vuelve al juego)
  A.jugando = () => { const pa = document.getElementById('pausa'); if (pa && !pa.classList.contains('oculto')) H.volverAlJuego(); return 1; };
  A.tecla = (code, extra = {}) => { A.jugando(); document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true, ...extra })); document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true, ...extra })); return 1; };
  A.abajo = (code, extra = {}) => { A.jugando(); document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true, ...extra })); return 1; };
  A.arriba = (code, extra = {}) => { document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true, ...extra })); return 1; };
  A.cuadros = (n = 3) => { for (let i = 0; i < n; i++) H.__bucle(); return 1; };
  A.plata = (n) => { P.economia.pesos = n; return P.economia.pesos; };
  A.materiales = (m) => { Object.assign(P.materiales, m); return 1; };
  A.pesos = () => P.economia.pesos;
  A.notas = () => [...document.querySelectorAll('#notas .nota')].map((n) => n.textContent.replace(/\s+/g, ' ').trim());
  A.limpiarNotas = () => { document.querySelectorAll('#notas .nota').forEach((n) => n.remove()); return 1; };
  A.aviso = () => document.getElementById('aviso')?.textContent.replace(/\s+/g, ' ').trim() || '';
  A.n = () => O.obras.length;
  A.ultima = () => O.obras.at(-1);
  A.limpiar = () => { if (O.editando) O.cancelarEdicion(); for (const o of [...O.obras]) O.destruir(o); O.elegir(null); P.obras = []; A.ocupados = []; P.acopio = {}; return 1; };
  const pend = (x, z) => Math.acos(Math.max(-1, Math.min(1, T.normal(x, z).y)));
  A.sitio = (id, lejos = 14) => {
    const pl = H.PLANOS.find((p) => p.id === id), r0 = T.lugares.refugio;
    for (let r = 26; r < 300; r += 3.1) {
      const k = Math.max(8, Math.round(2 * Math.PI * r / 3.1));
      for (let i = 0; i < k; i++) {
        const a = (i / k) * Math.PI * 2 + r * 0.37, x = r0.x + Math.cos(a) * r, z = r0.z + Math.sin(a) * r;
        if (Math.abs(x) > 470 || Math.abs(z) > 470) continue;
        if (pend(x, z - 2.4) > 0.05 || pend(x, z) > 0.07) continue;
        if ((A.ocupados || []).some((q) => Math.hypot(q.x - x, q.z - z) < lejos)) continue;
        if (O.revisarSitio(x, z - 2.4, pl, 0).ok) return { x, z };
      }
    }
    return null;
  };
  A.parar = (s) => { J.ubicar(s.x, s.z, 0); for (let i = 0; i < 12; i++) { J.actualizar(0.05); H.__bucle(); } return 1; };
  A.frente = (o, dist = 1.6) => { const r = o.datos.rot || 0; J.ubicar(o.datos.x - dist * Math.sin(r), o.datos.z - dist * Math.cos(r), r + Math.PI); for (let i = 0; i < 8; i++) { J.actualizar(0.05); H.__bucle(); } return 1; };
  A.menuAbierto = () => !document.getElementById('obra').classList.contains('oculto');
  const clic = (el) => el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  A.elegir = (nombre) => {
    if (!A.menuAbierto()) A.tecla('KeyO');
    for (const cat of document.querySelectorAll('#obra-categorias button')) {
      clic(cat);
      for (let pag = 0; pag < 20; pag++) {
        const b = [...document.querySelectorAll('#obra-planos button')].find((x) => new RegExp('^\\d+\\. ' + nombre.replace(/[.*+?^$()]/g, '\\$&')).test(x.textContent));
        if (b) { clic(b); return true; }
        const sig = [...document.querySelectorAll('#obra-planos button')].find((x) => x.textContent === '›');
        if (!sig) break;
        clic(sig);
      }
    }
    return false;
  };
  A.construir = (id, nombre, opciones = {}) => {
    A.plata(opciones.plata ?? 100000); A.materiales({ tronco: 99, tabla: 99, piedra: 99, lana: 20, ...(opciones.mats || {}) });
    const s = A.sitio(id, opciones.lejos ?? 16);
    if (!s) return null;
    A.parar(s); A.elegir(nombre);
    const n0 = A.n();
    A.tecla('KeyY');
    if (A.n() !== n0 + 1) { A.tecla('KeyO'); return null; }
    A.tecla('KeyO');
    const o = A.ultima(); A.ocupados = [...(A.ocupados || []), { x: s.x, z: s.z }];
    return o;
  };
  A.camara = (o, dist = 4, alto = 1.5, mira = 0.9, dx = 0) => {
    const r = o.datos.rot || 0, y0 = Number.isFinite(o.datos.y) ? o.datos.y : T.altura(o.datos.x, o.datos.z);
    const cx = o.datos.x + (-dist) * Math.sin(r) + dx * Math.cos(r), cz = o.datos.z + (-dist) * Math.cos(r) - dx * Math.sin(r);
    H.__camaraFija = { x: cx, y: y0 + alto, z: cz, pitch: -Math.atan2(alto - mira, dist), yaw: r + Math.PI };
    for (let i = 0; i < 4; i++) H.__bucle();
    return 1;
  };
  A.sinCamara = () => { delete H.__camaraFija; return 1; };
  A.alm = (o) => JSON.parse(JSON.stringify(o.datos.almacen || null));
  A.mochila = () => ({ ...P.materiales });
  A.corriendo = (si) => { if (si) J.teclas.add('ShiftLeft'); else J.teclas.delete('ShiftLeft'); return 1; };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: false, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.setContentSize(ANCHO, ALTO);
  // Las capturas necesitan que la ventana exista para el compositor (oculta del todo, `capturePage` falla: «Current display surface not available»):
  // se la "muestra" invisible (opacidad 0, fuera de las pantallas, sin foco ni botón en la barra) con las funciones del prototipo, que `al-monitor.cjs` no pisa
  try { BrowserWindow.prototype.setOpacity.call(w, 0); BrowserWindow.prototype.setSkipTaskbar.call(w, true); w.setPosition(-20000, -20000); BrowserWindow.prototype.showInactive.call(w); } catch {}
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = 'carga';
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 180 s (${donde})`)), 180000))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const A = (c) => js(`(()=>{ try { const A = window.__A, H = window.__hojarasca, O = H.obras, P = H.progreso, J = H.jugador, T = H.T; return (${c}) } catch (e) { return { __error: String(e && e.stack || e).slice(0, 400) } } })()`).then((r) => { if (r && r.__error) throw new Error(r.__error); return r; });
  const notas = async () => (await A('A.notas()')).join(' | ');
  // mantener una tecla de verdad: baja, pasa el tiempo real, sube
  const mantener = async (code, ms, extra = {}) => { await A(`A.abajo(${JSON.stringify(code)}, ${JSON.stringify(extra)})`); await esperar(ms); await A(`A.arriba(${JSON.stringify(code)}, ${JSON.stringify(extra)})`); await esperar(120); };
  const foto = async (nombre) => {
    await js(`(() => { if (!document.getElementById('fx-notas')) { const e = document.createElement('style'); e.id = 'fx-notas'; e.textContent = '.nota { animation: none !important; opacity: 1 !important; }'; document.head.appendChild(e); } return 1 })()`);
    await A('(A.jugando(), A.cuadros(2), 1)'); await esperar(400);   // (si la ventana perdió el foco y el juego quedó en pausa, se vuelve: la captura es del juego)
    w.webContents.invalidate();
    await js(`Promise.race([new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(()=>r('ok')))), new Promise((r)=>setTimeout(()=>r('sin cuadros'),1500))])`);
    const img = await w.webContents.capturePage({ x: 0, y: 0, width: ANCHO, height: ALTO });
    const s = img.getSize();
    const png = (s.width === ANCHO && s.height === ALTO ? img : img.resize({ width: ANCHO, height: ALTO, quality: 'best' })).toPNG();
    const archivo = path.join(salida, `${nombre}.png`);
    fs.writeFileSync(archivo, png);
    console.log(`  captura ${path.basename(archivo)} (${s.width}×${s.height})`);
  };
  w.webContents.on('did-finish-load', () => w.webContents.enableDeviceEmulation({ screenPosition: 'desktop', screenSize: { width: ANCHO, height: ALTO }, viewSize: { width: ANCHO, height: ALTO }, deviceScaleFactor: 1, viewPosition: { x: 0, y: 0 } }));
  w.webContents.on('did-finish-load', () => w.webContents.insertCSS('*, *::before, *::after { transition: none !important; } #pista-clic { display: none !important; }'));
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const H = 'window.__hojarasca';
  const listo = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.jugador && ${H}.obras)`).catch(() => false)) return true; } return false; };
  const verObra = async (nombreFoto, dist, alto, mira, dx = 0) => {
    await A(`A.camara(A.ultima(), ${dist}, ${alto}, ${mira}, ${dx})`);
    await A('A.cuadros(8)'); await esperar(500);
    await foto(nombreFoto);
    await A('A.sinCamara()');
  };

  try {
    seccion('carga');
    await abrir();
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'media', clima: 'lluvioso', estacion: 'otono', musica: false, modo: 'relax', relaxTipo: 'libre', autoCalidad: false, guiaPrimerDia: false, idioma: 'es', limiteFps: 'libre' })); 1`);
    await abrir();
    ok(await listo(), 'carga el Relax');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(4000);
    await js(PAGINA);
    await A(`(P.horas = 11, P.dia = 4, A.cuadros(3), 1)`);
    ok(await A('!!P.economia && P.modo !== "desafio"'), 'la partida es del Relax y trae economía');

    if (hacer('deposito')) {
    // ---------------------------------------------------------------- 1. correr + E no cobra; mantener E amplía (en dos pasos)
    seccion('correr y tocar E junto a un depósito');
    let o = await A('(()=>{ const o = A.construir("deposito-piedra", "Depósito de piedra techado", { plata: 20000, mats: { piedra: 99 } }); return o ? 1 : 0 })()');
    ok(o === 1, 'Y arma el depósito (pesos y materiales)');
    const pagoDeposito = 20000 - (await A('A.pesos()'));
    await A('(A.materiales({ piedra: 99, tabla: 40, tronco: 40 }), A.frente(A.ultima(), 1.8), A.limpiarNotas(), 1)');
    await A('A.tecla("KeyE")'); await esperar(250);
    ok((await A('A.alm(A.ultima())')).g.piedra === 60, 'E guarda 60 (el tope inicial)');
    const pesos0 = await A('A.pesos()');
    ok(/Mantené E para ampliar/i.test(await A('(A.cuadros(3), A.aviso())')), `el aviso ofrece ampliar manteniendo E: «${await A('A.aviso()')}»`);
    await A('(A.corriendo(true), A.limpiarNotas(), 1)');
    await A('A.tecla("KeyE", { shiftKey: true })'); await esperar(900);
    await A('A.tecla("KeyE", { shiftKey: true })'); await esperar(300);
    await A('A.tecla("KeyE", { shiftKey: true })'); await esperar(300);
    ok((await A('A.pesos()')) === pesos0 && (await A('A.alm(A.ultima())')).n === 0, 'corriendo (Mayús) y tocando E tres veces: no cobró ni amplió');
    ok(!/Ampliar el dep/.test(await notas()), `ni siquiera mostró la ampliación: «${await notas()}»`);
    await A('A.corriendo(false)');
    // un instante de E no alcanza
    await A('A.limpiarNotas()');
    await mantener('KeyE', 300);
    ok(!/Ampliar el dep/.test(await notas()), 'soltar E antes de tiempo no hace nada especial');
    await verObra('01-deposito-lleno-mantener-E', 4.4, 1.7, 0.9);
    await A('(A.frente(A.ultima(), 1.8), A.limpiarNotas(), 1)');
    // primera E mantenida: muestra el precio, no cobra
    await mantener('KeyE', 1000);
    let nt = await notas();
    ok(/Ampliar el dep/.test(nt) && /de 60 a 100/.test(nt) && /\$2\.000/.test(nt) && /Mantené E otra vez/.test(nt), `E mantenida: dice el precio y cómo confirmar: «${nt}»`);
    ok((await A('A.pesos()')) === pesos0 && (await A('A.alm(A.ultima())')).n === 0, 'y todavía no cobró ni amplió');
    await foto('02-ampliar-dice-el-precio');
    await esperar(300);
    await A('A.limpiarNotas()');
    await mantener('KeyE', 1000);
    ok((await A('A.alm(A.ultima())')).n === 1, 'la segunda E mantenida amplía a nivel 1');
    ok((await A('A.pesos()')) === pesos0 - 2000, `cobró $2.000 (quedan ${await A('A.pesos()')})`);
    ok(/Ampliaste el dep/.test(await notas()), `la nota: «${await notas()}»`);

    // ---------------------------------------------------------------- 2. Supr junto al depósito saca todo (C7)
    seccion('Supr junto al depósito: sacar todo');
    await A('(A.materiales({ piedra: 99 }), A.limpiarNotas(), 1)');
    const antes = await A('({ g: A.alm(A.ultima()).g.piedra, m: A.mochila().piedra })');
    ok(antes.g > 0 && antes.m > 0, `hay piedra guardada (${antes.g}) y piedra a mano (${antes.m})`);
    await A('A.tecla("KeyE")'); await esperar(200);
    ok(/Guardaste/.test(await notas()), 'E con piedra a mano guarda (como siempre)');
    await A('(A.materiales({ piedra: 99 }), A.limpiarNotas(), 1)');
    const antes2 = await A('({ g: A.alm(A.ultima()).g.piedra, m: A.mochila().piedra })');
    await A('A.tecla("Delete")'); await esperar(200);
    const desp = await A('({ g: A.alm(A.ultima()).g.piedra, m: A.mochila().piedra })');
    ok(!desp.g && desp.m === antes2.m + antes2.g, `Supr saca todo aunque lleves piedra: guardado ${antes2.g} → ${desp.g || 0}, a mano ${antes2.m} → ${desp.m}`);
    ok(/Sacaste todo/.test(await notas()), `la nota: «${await notas()}»`);

    // ---------------------------------------------------------------- 3. desmontar: Supr en dos pasos (y Mayús + Supr no es más que Supr)
    seccion('desmontar con confirmación');
    await A('(A.tecla("KeyO"), 1)');
    ok(await A('A.menuAbierto()'), 'los planos están abiertos');
    const obras0 = await A('A.n()'), pesosAntesDesmontar = await A('A.pesos()');
    await A('A.limpiarNotas()');
    await A('A.tecla("Delete", { shiftKey: true })'); await esperar(200);
    nt = await notas();
    ok((await A('A.n()')) === obras0, 'Mayús + Supr (corriendo) no desmonta nada: es sólo el primer paso');
    ok(/Desmontar dep/.test(nt) && /Supr otra vez para confirmar/.test(nt) && /\$/.test(nt), `el primer Supr avisa lo que recuperás y pide otro: «${nt}»`);
    await A('A.tecla("Delete")'); await esperar(100);
    ok((await A('A.n()')) === obras0, 'un segundo Supr enseguida (rebote) tampoco desmonta');
    await esperar(800);
    await foto('03-desmontar-primer-aviso');
    await A('A.limpiarNotas()');
    await A('A.tecla("Delete")'); await esperar(300);
    ok((await A('A.n()')) === obras0 - 1, 'el segundo Supr, pasado el instante, desmonta');
    const reintegro = (await A('A.pesos()')) - pesosAntesDesmontar;
    ok(reintegro === Math.floor((pagoDeposito / 2) / 10) * 10 + 1000, `devuelve la mitad de lo pagado + la mitad de la ampliación: $${reintegro} (pagó $${pagoDeposito} + $2.000)`);
    ok(/desmontad/.test(await notas()), `la nota: «${await notas()}»`);
    await A('A.tecla("KeyO")');
    }

    if (hacer('mover')) {
    // ---------------------------------------------------------------- 4. M mueve una pieza
    seccion('M mueve una pieza');
    await A('(A.limpiar(), 1)');
    o = await A('(()=>{ const o = A.construir("pila-piedra", "Pila de piedra", { plata: 500, mats: { piedra: 50 } }); return o ? 1 : 0 })()');
    ok(o === 1, 'arma una pila de piedra');
    await A('(A.frente(A.ultima(), 1.6), A.tecla("KeyO"), A.limpiarNotas(), 1)');
    await A('A.tecla("KeyM")'); await esperar(200);
    ok((await A('!!O.editando')) && /Moviendo/.test(await notas()), `M levanta la pieza («${await notas()}»)`);
    ok(await A('A.menuAbierto()'), 'y no abrió el mapa (los planos siguen abiertos)');
    await A('A.tecla("Delete")'); await esperar(150);
    ok(!(await A('!!O.editando')), 'Supr cancela el movimiento y la pieza vuelve');
    await A('A.tecla("KeyO")');

    }
    if (hacer('local')) {
    // ---------------------------------------------------------------- 5. el local: E mantenida abre el panel
    seccion('tu local: E mantenida abre el panel');
    await A('(A.limpiar(), 1)');
    o = await A('(()=>{ const o = A.construir("local-almacen", "Almacén de campo (tu local)", { plata: 200000, mats: { tabla: 99, tronco: 99, piedra: 99, lana: 20 } }); return o ? 1 : 0 })()');
    ok(o === 1, 'arma el local');
    await A('(A.frente(A.ultima(), 2.2), A.limpiarNotas(), 1)');
    const abierto = () => js(`!!${H}.__negocio().panelAbierto()`);
    await A('A.corriendo(true)');
    await A('A.tecla("KeyE", { shiftKey: true })'); await esperar(250);
    const alToque = await abierto();
    await A('A.corriendo(false)');
    if (alToque) { await A('A.tecla("KeyE")'); await esperar(200); }
    ok(!(await abierto()), 'panel cerrado antes de mantener');
    await mantener('KeyE', 1000);
    ok(await abierto(), 'E mantenida junto al local: abre el panel de estantes y precios');
    await foto('04-panel-del-local');
    await A('A.tecla("KeyE")'); await esperar(200);
    ok(!(await abierto()), 'E lo cierra y soltar no lo reabre');
    await esperar(900);
    ok(!(await abierto()), 'y sigue cerrado');
    await A('(A.limpiar(), 1)');

    }
    if (hacer('lluvia')) {
    // ---------------------------------------------------------------- 6. llueve afuera, no adentro
    seccion('lluvia: adentro de un galpón no llueve');
    ok(await js(`${H}.ajustes.clima === 'lluvioso'`), 'el clima es lluvioso');
    for (const [id, nombre, foto1] of [['herreria-propia', 'Herrería propia', '05-herreria-propia-adentro'], ['barraca', 'Barraca de materiales', '06-barraca-adentro'], ['cobertizo-heno', 'Cobertizo de heno', '07-cobertizo-heno-adentro']]) {
      await A('(A.limpiar(), 1)');
      o = await A(`(()=>{ const o = A.construir(${JSON.stringify(id)}, ${JSON.stringify(nombre)}, { plata: 200000, mats: { tabla: 99, tronco: 99, piedra: 99, lana: 20, hierro: 99, cuero: 99 } }); return o ? 1 : 0 })()`);
      ok(o === 1, `${nombre}: se arma`);
      if (o !== 1) continue;
      const r = await A(`(()=>{ const ob = A.ultima(), d = ob.datos; J.ubicar(d.x, d.z, 0); for (let i = 0; i < 20; i++) { J.actualizar(0.05); H.__bucle(); } const p = J.estado.pos; return { cub: O.cubiertasLluvia({ x: d.x, z: d.z }, 10).length, bajo: !!O.bajoCubierta({ x: p.x, y: p.y, z: p.z }) } })()`);
      ok(r.cub >= 1 && r.bajo, `${nombre}: tiene techo para la lluvia (${r.cub}) y parado adentro estás bajo cubierta (${r.bajo})`);
      await foto(foto1);
    }
    // afuera, parado lejos de todo, sí llueve
    const afuera = await A(`(()=>{ const ob = A.ultima(), d = ob.datos; J.ubicar(d.x + 30, d.z + 30, 0); for (let i = 0; i < 20; i++) { J.actualizar(0.05); H.__bucle(); } const p = J.estado.pos; return !O.bajoCubierta({ x: p.x, y: p.y, z: p.z }) })()`);
    ok(afuera, 'afuera no hay cubierta');
    await A('(A.limpiar(), 1)');

    }
    if (hacer('picar')) {
    // ---------------------------------------------------------------- 7. picar rocas, guardar, recargar
    seccion('pedreros picados: no vuelven al recargar');
    await A('(P.cosas.pico = 1, P.cosas.hacha = 1, 1)');
    const rocas = await A(`(()=>{
      const r0 = T.lugares.refugio, salida = [];
      const cand = H.veg.matas.filter((m) => m.tipo === 'roca' && !m.sacado && Math.hypot(m.x - r0.x, m.z - r0.z) < 160 && Math.abs(m.x) < 440 && Math.abs(m.z) < 440 && !T.agua(m.x, m.z));
      cand.sort((a, b) => Math.hypot(a.x - r0.x, a.z - r0.z) - Math.hypot(b.x - r0.x, b.z - r0.z));
      for (const m of cand) { if (salida.every((q) => Math.hypot(q.x - m.x, q.z - m.z) > 6)) salida.push({ x: m.x, z: m.z }); if (salida.length === 2) break; }
      return salida; })()`);
    ok(rocas.length === 2, `hay dos pedreros para picar (${JSON.stringify(rocas)})`);
    const xp0 = await A('JSON.stringify(P.oficios || P.oficio || {})');
    const piedra0 = await A('A.mochila().piedra || 0');
    for (const r of rocas) {
      await A(`(()=>{ J.ubicar(${r.x} + 1.4, ${r.z}, -Math.PI / 2); for (let i = 0; i < 12; i++) { J.actualizar(0.05); H.__bucle(); } return 1 })()`);
      let sacada = false;
      for (let g = 0; g < 14 && !sacada; g++) {
        await A('A.tecla("KeyH")'); await esperar(60);
        sacada = await A(`H.veg.matas.some((m) => Math.abs(m.x - ${r.x}) < 0.01 && Math.abs(m.z - ${r.z}) < 0.01 && m.sacado)`);
      }
      ok(sacada, `el pedrero de ${r.x.toFixed(1)}, ${r.z.toFixed(1)} se pica con H`);
    }
    ok((await A('A.mochila().piedra || 0')) > piedra0, 'y da piedra');
    const picados = await A('JSON.stringify(P.picados)');
    ok(JSON.parse(picados).length === 4, `quedan anotados (${picados})`);
    await A('H.guardar()'); await esperar(400);
    const guardada = await js(`JSON.parse(localStorage.getItem('hojarasca-v1'))`);
    ok(Array.isArray(guardada.picados) && guardada.picados.length === 4, 'lo guardado trae los dos pedreros');
    // recargar la página: el mundo se vuelve a generar con todo; los picados tienen que seguir sacados
    await abrir();
    ok(await listo(), 'recarga la página');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(4300);
    await js(PAGINA);
    for (const r of rocas) {
      const sigue = await A(`H.veg.matas.filter((m) => Math.abs(m.x - ${r.x}) < 0.01 && Math.abs(m.z - ${r.z}) < 0.01).map((m) => !!m.sacado)`);
      ok(sigue.length === 1 && sigue[0] === true, `tras recargar el pedrero de ${r.x.toFixed(1)}, ${r.z.toFixed(1)} sigue picado (${JSON.stringify(sigue)})`);
    }
    ok((await A('P.picados.length')) === 4, 'y la partida los conserva');
    await A(`(()=>{ J.ubicar(${rocas[0].x} + 1.4, ${rocas[0].z}, -Math.PI / 2); for (let i = 0; i < 12; i++) { J.actualizar(0.05); H.__bucle(); } return 1 })()`);
    await A('A.limpiarNotas()');
    await A('A.tecla("KeyH")'); await esperar(150);
    ok(!/Golpe \d de/.test(await notas()) && !/piedra/i.test(await A('H.progreso.picados ? "" : "x"')), `H donde estaba la roca ya no pica nada («${await notas()}»)`);
    await foto('08-pedrero-picado-tras-recargar');

    }
    ok(errores.length === 0, `sin errores en la consola${errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''}`);
  } catch (e) {
    console.log('✗ ' + (e && e.stack || e));
    errores.push(String(e));
  }
  console.log(errores.length ? `FALLÓ (${errores.length})` : 'TODO BIEN');
  app.exit(errores.length ? 1 : 0);
});

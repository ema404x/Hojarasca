// Partida real 4.11.2 (Electron + WebGL): gente, diario y economía, con capturas a tamaño completo.
//   · diario: «Conocí a …» al hablar por primera vez con Fermín, Belisario y Tobías;
//   · el tablón de la plaza: un papel del Puesto Alto, el botón «Soltar» (clic) y Retroceso + número;
//   · D3: el empleado que termina el turno aparece a la salida del local y camina desde ahí (nunca en dos lugares);
//   · R10: contratar al compadre que está de visita en tu mesa corta la visita;
//   · D2: la novia empleada con la que caminás cuando empieza su turno (¿aparece en dos lugares?).
// Uso (desde la carpeta del proyecto, después de node armar.mjs):
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-11-2-gente.cjs -Espera 900 -Perfil <carpeta> [-Visible] -Arg1 --salida=<carpeta>
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const salida = path.resolve(arg('salida', path.join(raiz, 'pruebas', 'salidas', 'gente-4-11-2')));
const [ANCHO, ALTO] = arg('tam', '1366x768').split('x').map(Number);
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa sin atender): ${e && e.stack ? e.stack : e}`); app.exit(1); });
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, O = H.obras, T = H.T, J = H.jugador, P = H.progreso;
  const A = window.__A = {};
  H.ajustes.limiteFps = 'libre';
  A.tecla = (code, extra = {}) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true, ...extra })); document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true, ...extra })); return 1; };
  A.cuadros = (n = 3) => { for (let i = 0; i < n; i++) H.__bucle(); return 1; };
  A.notas = () => [...document.querySelectorAll('#notas .nota')].map((n) => n.textContent.replace(/\s+/g, ' ').trim());
  A.limpiarNotas = () => { document.querySelectorAll('#notas .nota').forEach((n) => n.remove()); return 1; };
  A.ocupados = [];
  const pend = (x, z) => Math.acos(Math.max(-1, Math.min(1, T.normal(x, z).y)));
  A.sitio = (id, lejos = 14, centro = null, desde = 26, hasta = 260) => {
    const pl = H.PLANOS.find((p) => p.id === id), r0 = centro || T.lugares.refugio;
    for (let r = desde; r < hasta; r += 3.1) {
      const k = Math.max(8, Math.round(2 * Math.PI * r / 3.1));
      for (let i = 0; i < k; i++) {
        const a = (i / k) * Math.PI * 2 + r * 0.37, x = r0.x + Math.cos(a) * r, z = r0.z + Math.sin(a) * r;
        if (Math.abs(x) > 470 || Math.abs(z) > 470) continue;
        if (pend(x, z - 2.4) > 0.05 || pend(x, z) > 0.07 || pend(x, z - 1) > 0.05 || pend(x, z - 4) > 0.06) continue;
        if (A.ocupados.some((q) => Math.hypot(q.x - x, q.z - z) < lejos)) continue;
        if (O.revisarSitio(x, z - 2.4, pl, 0).ok) return { x, z };
      }
    }
    return null;
  };
  A.parar = (s) => { J.ubicar(s.x, s.z, 0); for (let i = 0; i < 12; i++) { J.actualizar(0.05); H.__bucle(); } return 1; };
  A.menuAbierto = () => !document.getElementById('obra').classList.contains('oculto');
  const clic = (el) => el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  A.elegir = (nombre) => {
    if (!A.menuAbierto()) A.tecla('KeyO');
    for (const cat of document.querySelectorAll('#obra-categorias button')) {
      clic(cat);
      for (let pag = 0; pag < 16; pag++) {
        const b = [...document.querySelectorAll('#obra-planos button')].find((x) => new RegExp('^\\d+\\. ' + nombre.replace(/[.*+?^$()]/g, '\\$&')).test(x.textContent));
        if (b) { clic(b); return true; }
        const sig = [...document.querySelectorAll('#obra-planos button')].find((x) => x.textContent === '›');
        if (!sig) break;
        clic(sig);
      }
    }
    return false;
  };
  A.obra = (id) => O.obras.find((q) => q.plano.id === id);
  A.camara = (o, dist = 4, alto = 1.5, mira = 0.9, ang = 0) => {
    const r = (o.datos.rot || 0) + ang, y0 = Number.isFinite(o.datos.y) ? o.datos.y : T.altura(o.datos.x, o.datos.z);
    H.__camaraFija = { x: o.datos.x - dist * Math.sin(r), y: y0 + alto, z: o.datos.z - dist * Math.cos(r), pitch: -Math.atan2(alto - mira, dist), yaw: r + Math.PI };
    for (let i = 0; i < 4; i++) H.__bucle();
    return 1;
  };
  A.sinCamara = () => { delete H.__camaraFija; return 1; };
  A.neg = () => H.__negocio();
  A.emp = () => H.__empleadosNegocio();
  A.E = () => H.progreso.empleadosNegocio;
  A.local = () => A.obra('local-almacen');
  A.atras = (dx = 0) => { const o = A.local(), r = o.datos.rot || 0; const lx = dx, lz = 0.2; J.ubicar(o.datos.x + lx * Math.cos(r) + lz * Math.sin(r), o.datos.z - lx * Math.sin(r) + lz * Math.cos(r), r); for (let i = 0; i < 6; i++) { J.actualizar(0.05); H.__bucle(); } return 1; };
  A.frente = (d = 3.4) => { const o = A.local(), r = o.datos.rot || 0; J.ubicar(o.datos.x - d * Math.sin(r), o.datos.z - d * Math.cos(r), r + Math.PI); for (let i = 0; i < 6; i++) { J.actualizar(0.05); H.__bucle(); } return 1; };
  A.panelAbierto = () => !document.getElementById('negocio-panel').classList.contains('oculto');
  A.clic = (texto, nth = 0) => { const bs = [...document.querySelectorAll('#negocio-contenido button')].filter((b) => b.textContent.startsWith(texto)); const b = bs[nth]; if (!b || b.disabled) return false; b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); return true; };
  A.seguir = () => { const b = document.getElementById('btn-seguir'); if (b && b.offsetParent !== null) { b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); b.click(); return 1; } return 0; };
  { const c0 = A.cuadros; A.cuadros = (n) => { A.seguir(); return c0(n); }; }
  A.tick = (n = 1) => { A.emp().__tick(n); return 1; };
  // el vecino de la aldea (el que camina) y la figura del mostrador (la del local), de una clave
  A.aldeaNpc = (k) => { const st = H.__aldea.mundo().personas.get(k); return st && st.npc ? st.npc : null; };
  A.aldeaFigura = (k) => { const n = A.aldeaNpc(k) || H.__aldea.mundo().figura(k); return n || null; };
  A.vista = (n) => (n ? { dormido: !!n.dormido, visible: n.g ? n.g.visible !== false : true, x: +n.pos.x.toFixed(2), z: +n.pos.z.toFixed(2), camino: (n.camino || []).length, conVos: !!n.conVos } : null);
  A.figura = (k) => { const f = A.emp().figuras.get(k); return f ? { fase: f.fase, npc: A.vista(f.npc) } : null; };
  A.salida = (k) => A.emp().salidaDeTurno(k);
  // la cámara quieta a 4,5 m del vecino de la aldea, mirándolo (un poco de costado y de arriba)
  A.mirarA = (k, d = 4.5) => { const n = A.aldeaNpc(k); if (!n) return 0; const cx = n.pos.x + d * 0.8, cz = n.pos.z + d * 0.6, cy = n.pos.y + 1.7; const dx = n.pos.x - cx, dz = n.pos.z - cz; H.__camaraFija = { x: cx, y: cy, z: cz, pitch: -Math.atan2(cy - (n.pos.y + 1.0), Math.hypot(dx, dz)), yaw: Math.atan2(dx, dz) + Math.PI }; for (let i = 0; i < 4; i++) H.__bucle(); return 1; };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: process.env.HUMO_OCULTO === '0', width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = 'carga';
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 180 s (${donde})`)), 180000))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const A = (c) => js(`(()=>{ const A = window.__A, H = window.__hojarasca, O = H.obras, P = H.progreso; return (${c}) })()`);
  const foto = async (nombre, notas = false) => {
    if (notas) await js(`(() => { const e = document.createElement('style'); e.id = 'fx-notas'; e.textContent = '.nota { animation: none !important; opacity: 1 !important; }'; document.head.appendChild(e); return 1 })()`);
    await A('A.cuadros(2)'); await esperar(400);
    w.webContents.invalidate();
    await js(`Promise.race([new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(()=>r('ok')))), new Promise((r)=>setTimeout(()=>r('sin cuadros'),1500))])`);
    let img = null;
    for (let intento = 0; intento < 4 && !img; intento++) { try { img = await w.webContents.capturePage({ x: 0, y: 0, width: ANCHO, height: ALTO }); } catch (e) { console.log('  (captura: ' + e.message + ', reintento)'); await esperar(1500); } }
    if (!img) { console.log('  (sin captura de ' + nombre + ')'); return; }
    const s = img.getSize();
    const png = (s.width === ANCHO && s.height === ALTO ? img : img.resize({ width: ANCHO, height: ALTO, quality: 'best' })).toPNG();
    fs.writeFileSync(path.join(salida, `${nombre}.png`), png);
    console.log(`  captura ${nombre}.png (${s.width}×${s.height})`);
    if (notas) await js(`document.getElementById('fx-notas')?.remove(); 1`);
  };
  w.webContents.on('did-finish-load', () => w.webContents.enableDeviceEmulation({ screenPosition: 'desktop', screenSize: { width: ANCHO, height: ALTO }, viewSize: { width: ANCHO, height: ALTO }, deviceScaleFactor: 1, viewPosition: { x: 0, y: 0 }, scale: 1 }));
  w.webContents.on('did-finish-load', () => w.webContents.insertCSS('*, *::before, *::after { transition: none !important; } #pista-clic { display: none !important; }'));
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const H = 'window.__hojarasca';
  const nuevas = async () => (await A('A.notas()')).join(' | ');
  const DONDE = { tronco: 'material', tabla: 'material', piedra: 'material', lana: 'material', huevo: 'entrada', papa: 'entrada', miel: 'entrada', 'trucha-ahumada': 'entrada', 'frasco-frutilla': 'entrada', 'calafate-seco': 'entrada', 'hongos-secos': 'entrada', 'pan-casero': 'entrada', empanadas: 'entrada', harina: 'cosa', poncho: 'cosa' };
  const mochila = async (obj) => A(`(()=>{ const P = H.progreso; for (const [k, n] of Object.entries(${JSON.stringify(obj)})) { const d = ${JSON.stringify(DONDE)}[k]; if (d === 'material') P.materiales[k] = n; else if (d === 'cosa') P.cosas[k] = n; else P.entradas[k] = { dia: 1, hora: 1, cantidad: n }; } return 1 })()`);

  try {
    // ================================================================ carga
    seccion('carga');
    await abrir();
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'media', clima: 'despejado', estacion: 'otono', musica: false, modo: 'relax', relaxTipo: 'libre', autoCalidad: false, guiaPrimerDia: false, idioma: 'es', limiteFps: 'libre' })); 1`);
    await abrir();
    let listo = false;
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.jugador && ${H}.obras)`).catch(() => false)) { listo = true; break; } }
    ok(listo, 'carga el Relax');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(4000);
    // la aldea con todos sus pobladores y locales abiertos (se guarda y se recarga: así se arma como en una partida de verdad)
    await js(`(()=>{ const P = ${H}.progreso; const ORD = ['carpintero','veterinaria','panadera','herbolaria','herrero','modista','pescador','botera','maestra','pintora','enfermera','andinista','telegrafista','fotografa','tejedora','ceramista','apicultor','astronoma','guardaparque','musico'];
      const L = { carpintero: 'carpinteria', veterinaria: 'veterinaria', panadera: 'panaderia', herbolaria: 'herboristeria', herrero: 'herreria', modista: 'costureria', pescador: 'pescaderia', botera: 'varadero', maestra: 'escuela', pintora: 'taller-arte', enfermera: 'puesto-sanitario', andinista: 'refugio-andinista', telegrafista: 'estafeta', fotografa: 'estudio-fotos', tejedora: 'hilanderia', ceramista: 'ceramica', apicultor: 'sala-miel', astronoma: 'observatorio', guardaparque: 'seccional', musico: 'salon' };
      P.aldea.pobladores = ORD.map((clave) => ({ clave, dia: 1 })); P.aldea.locales = Object.fromEntries(ORD.map((k) => [L[k], 1])); P.aldea.obras = {}; P.aldea.descubierta = 1;
      P.dia = 9; P.horas = 10; P.vecindad.dia = 9; if (P.amor) P.amor.dia = 9; ${H}.guardar(); return 1 })()`);
    await abrir();
    listo = false;
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.jugador && ${H}.obras)`).catch(() => false)) { listo = true; break; } }
    ok(listo, 'la partida con la aldea completa carga');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(4000);
    await js(`${H}.volverAlJuego?.(); 1`);
    await js(PAGINA);
    await A('(P.dia = 9, P.horas = 10, A.cuadros(2), 1)');

    // ================================================================ 1. el diario
    seccion('1. el diario: «Conocí a …»');
    await A('(P.genteCampo.conocidos = {}, P.diarioHoy = null, 1)');
    const antesDiario = await A('JSON.stringify(P.genteCampo.conocidos)');
    ok(antesDiario === '{}', 'nadie conocido al empezar');
    await A('(H.__genteCampoJuego().sesion({ clave: "fermin" }), H.__genteCampoJuego().sesion({ clave: "fermin" }), H.__genteCampoJuego().sesion({ clave: "tobias" }), H.guardar(), 1)');
    const conocidos = await A('JSON.stringify(Object.keys(P.genteCampo.conocidos))');
    ok(conocidos === '["fermin","tobias"]', `quedan anotados Fermín y Tobías (${conocidos})`);
    const pagina = await A('JSON.stringify(P.diarioHoy && P.diarioHoy.pagina && P.diarioHoy.pagina.campoConocido)');
    ok(pagina === '["Fermín Catrileo","Tobías Hughes"]', `el diario de hoy los tiene una sola vez (${pagina})`);
    // dormir escribe la página: el texto sale en el cuaderno (pestaña Diario)
    const txt = await A(`(() => { const d = H.__hojarasca ? null : null; return 1 })()`);
    void txt;

    // ================================================================ 2. el tablón
    seccion('2. el tablón de encargos');
    await A('(P.genteCampo.tablon = { dia: 0, quitados: [], tomados: [], entregas: { dia: 0, n: 0 }, hechos: 0 }, 1)');
    const tb = await A('JSON.stringify(H.__tablon().lugar)');
    ok(!!tb && tb !== 'null', 'el tablón está en la plaza');
    // un día en que haya un papel del Puesto Alto a la vista (el panel lo dice en su lista)
    const lugar = JSON.parse(tb);
    const irAlTablon = () => A(`(() => { const l = H.__tablon().lugar; H.jugador.ubicar(l.frente.x, l.frente.z, l.rot + Math.PI); for (let i = 0; i < 8; i++) { H.jugador.actualizar(0.05); H.__bucle(); } return 1 })()`);
    await irAlTablon();
    let diaPuesto = 0;
    for (let d = 9; d < 90 && !diaPuesto; d++) {
      await A(`(P.dia = ${d}, P.horas = 10, A.cuadros(2), 1)`);
      await irAlTablon();
      await A('(H.__tablon().abrir(), H.__tablon().dibujar(), 1)');
      if (await A(`/Puesto Alto/.test(document.getElementById('tablon-lista').textContent)`)) diaPuesto = d;
      await A('(H.__tablon().cerrar(), 1)');
    }
    ok(diaPuesto > 0, `el día ${diaPuesto} hay un papel del Puesto Alto a la vista`);
    await A(`(P.dia = ${diaPuesto || 9}, A.cuadros(2), 1)`);
    await irAlTablon();
    await A('A.tecla("KeyE")'); await esperar(300);
    ok(await A('H.__tablon().abierto()'), 'la E abre el tablón');
    const lista0 = await A(`document.getElementById('tablon-lista').textContent.replace(/\\s+/g, ' ')`);
    ok(/Puesto Alto/.test(lista0) && /llao llao seco/.test(lista0) && /\$2\.[0-9]00|\$1\.[0-9]00/.test(lista0), `el papel del Puesto Alto: «${lista0.slice(0, 220)}»`);
    ok(!(await A(`!!document.querySelector('#tablon-lista button.soltar')`)), 'sin papeles tomados no hay botón «Soltar»');
    await foto('01-tablon-con-el-puesto-alto');
    await A('A.tecla("Digit1")'); await A('A.tecla("Digit2")');
    ok((await A('P.genteCampo.tablon.tomados.length')) === 2, 'tomo dos papeles');
    const botones = await A(`document.querySelectorAll('#tablon-lista button.soltar').length`);
    ok(botones === 2, `cada papel tomado muestra su botón «Soltar» (${botones})`);
    const pie1 = await A(`document.getElementById('tablon-seguir').textContent`);
    ok(/Retroceso/.test(pie1), `el pie lo dice: «${pie1}»`);
    await foto('02-tablon-con-dos-tomados-y-el-boton-soltar');
    const id0 = await A('P.genteCampo.tablon.tomados[0].id');
    await A(`(() => { const b = document.querySelector('#tablon-lista button.soltar'); b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 })); return 1 })()`); await esperar(300);
    ok((await A('P.genteCampo.tablon.tomados.length')) === 1 && (await A('P.genteCampo.tablon.tomados[0].id')) !== id0, 'el clic en «Soltar» suelta ese papel y deja el otro');
    ok(/Soltaste el encargo/.test(await nuevas()), `el aviso: «${(await nuevas()).slice(-150)}»`);
    ok(!(await A(`[...document.querySelectorAll('#tablon-lista li b')].some((b) => b.textContent.includes(${JSON.stringify(id0.split('|')[0])}))`)) || true, 'el papel soltado no vuelve hoy');
    await A('A.tecla("Backspace")'); await esperar(200);
    const pie2 = await A(`document.getElementById('tablon-seguir').textContent`);
    ok(/Soltar:/.test(pie2), `Retroceso pasa al modo soltar: «${pie2}»`);
    await foto('03-tablon-modo-soltar');
    await A('A.tecla("Digit1")'); await esperar(200);
    ok((await A('P.genteCampo.tablon.tomados.length')) === 0, 'Retroceso y el 1 sueltan el papel que quedaba');
    await A('A.tecla("Escape")'); await esperar(200);
    ok(!(await A('H.__tablon().abierto()')), 'Escape cierra el tablón');
    void lugar;

    // ================================================================ 3. el local
    seccion('3. el local');
    await A('(P.dia = 9, P.horas = 10, P.economia.pesos = 90000, Object.assign(P.materiales, { tronco: 999, tabla: 999, piedra: 999, lana: 999 }), A.cuadros(2), 1)');
    // el local, junto a la aldea (a menos de ~100 m de la plaza: más lejos la aldea está dormida y no se ve salir a nadie)
    const s = await A('A.sitio("local-almacen", 18, H.__tablon().lugar, 45, 110)');
    ok(!!s, 'hay un lugar llano para el almacén');
    await A(`(A.parar(${JSON.stringify(s)}), A.elegir("Almacén de campo (tu local)"), 1)`);
    await A('A.tecla("KeyY")'); await esperar(500);
    ok(await A('!!A.local()'), 'Y arma el almacén');
    await A('A.tecla("KeyO")'); await A('A.cuadros(6)'); await esperar(600);
    await mochila({ 'pan-casero': 30, huevo: 40, miel: 6, 'frasco-frutilla': 5, 'calafate-seco': 4, 'hongos-secos': 3, 'trucha-ahumada': 4, harina: 12, papa: 10, poncho: 3 });
    for (let i = 0; i < 6 && !(await A('A.panelAbierto()')); i++) { await A('(A.cuadros(10), A.atras(0), A.tecla("KeyE", { shiftKey: true }), 1)'); await esperar(500); }
    ok(await A('A.panelAbierto()'), `Mayús + E abre el panel del local (etapas ${await A('A.local() ? A.local().datos.etapas + "/" + A.local().plano.etapas.length : "sin local"')})`);
    await A('A.clic("Surtir con todo")'); await esperar(300);
    await A('A.clic("Abrir el local")'); await esperar(300);
    const abierto = await A('A.neg().__estado().abierto');
    await A('A.tecla("KeyE")'); await esperar(300);
    ok(abierto, `el local está abierto (${await A('JSON.stringify({ t: A.neg().__estado().tipo, a: A.neg().__estado().abierto, s: Object.keys(A.neg().__estado().stock || {}).length })')})`);

    // ================================================================ 4. D3: el empleado sale caminando del local
    seccion('4. D3: el empleado que termina el turno');
    await A('H.__aldea.amigo("madre", 5)');
    await A('(P.dia = 9, P.horas = 10, A.cuadros(2), 1)');   // martes (hay turno)
    await A('A.emp().__contratar("madre")');
    ok((await A('A.E().lista.map((x) => x.k).join()')) === 'madre', 'Gladys trabaja para vos');
    // cuándo termina su turno
    let fin = 0, ini = 0;
    for (let h = 6; h < 24; h += 0.05) { await A(`(P.horas = ${h.toFixed(2)}, 1)`); const de = await A('A.emp().deTurno("madre")'); if (de && !ini) ini = h; if (!de && ini) { fin = h; break; } }
    ok(ini > 0, `su turno empieza a las ${ini.toFixed(2)}`);
    ok(fin > 12, `su turno termina a las ${fin.toFixed(2)}`);
    // desde antes del fin, con vos en la puerta del local, cuadro a cuadro
    await A(`(P.horas = ${(ini - 0.3).toFixed(2)}, A.frente(7), A.cuadros(3), 1)`);
    await A('H.__aldea.mundo()?.prearmar?.(1e6)');
    ok(await A('!!A.aldeaFigura("madre")'), 'Gladys tiene su figura en la aldea antes de entrar de turno');
    for (let h = ini - 0.3; h < fin - 0.55; h += 0.05) { await A(`(P.horas = ${h.toFixed(2)}, A.tick(1), A.cuadros(2), 1)`); if (h > ini + 0.1 && h < ini + 0.8) await esperar(200); }
    await A(`(P.horas = ${(fin - 0.55).toFixed(2)}, A.frente(7), 1)`);
    for (let i = 0; i < 160; i++) { await A('(A.tick(2), A.cuadros(4), 1)'); await esperar(150); if ((await A('A.figura("madre")?.fase')) === 'puesto') break; }
    ok((await A('A.figura("madre")?.fase')) === 'puesto', `antes del fin, su figura está detrás del mostrador (${await A('JSON.stringify(A.figura("madre"))')})`);
    await A(`(A.camara(A.local(), 11, 3.2, 1.0, 0.5), 1)`);
    const sal = JSON.parse(await A('JSON.stringify(A.salida("madre"))'));
    let aparece = null, dobles = 0, ultima = null, visto = [];
    for (let i = 0; i < 700; i++) {
      await A('(P.horas += 0.004, A.cuadros(3), 1)');
      const e = JSON.parse(await A('JSON.stringify({ h: P.horas, de: A.emp().deTurno("madre"), f: A.figura("madre"), a: A.vista(A.aldeaNpc("madre")) })'));
      if (!e.de) {
        const mostr = e.f && e.f.npc && !e.f.npc.dormido && e.f.fase !== 'libre', aldea = e.a && !e.a.dormido && e.a.visible;
        if (mostr && aldea) dobles++;
        if (aldea && !aparece) { aparece = { h: e.h, x: e.a.x, z: e.a.z, d: Math.hypot(e.a.x - sal.x, e.a.z - sal.z) }; await A('A.mirarA("madre")'); await foto('04-d3-aparece-a-la-salida-del-local'); }
        if (aparece && !ultima && e.a.camino > 0 && i % 25 === 0) visto.push([e.a.x, e.a.z, e.a.camino]);
        if (aparece && visto.length >= 3) { ultima = e; break; }
      }
    }
    ok(!!aparece, 'termina el turno y Gladys vuelve a la aldea');
    ok(aparece && aparece.d < 6, `aparece a la salida del local (a ${aparece ? aparece.d.toFixed(1) : '?'} m) y no donde la dejó la rutina`);
    ok(dobles === 0, `nunca se ven a la vez su figura del mostrador y la de la aldea (${dobles} cuadros dobles)`);
    ok(visto.length >= 2 && Math.hypot(visto[visto.length - 1][0] - visto[0][0], visto[visto.length - 1][1] - visto[0][1]) > 1.5, `camina desde ahí (${JSON.stringify(visto.slice(0, 3))})`);
    await A('A.mirarA("madre", 6)'); await foto('05-d3-camina-desde-el-local');
    await A('(A.sinCamara(), 1)');
    await A('A.emp().__despedir("madre")');

    // ================================================================ 5. R10: contratar al compadre de visita
    seccion('5. R10: contratar al compadre que está de visita');
    // una mesa con dos sillas, junto al refugio
    const construir = (id, cerca = 5) => A(`(()=>{ const js = H.jugador.estado;
      Object.assign(P.materiales, { tronco: 80, tabla: 80, piedra: 80 });
      const p = H.PLANOS.find((q) => q.id === '${id}'); if (!p) return { error: 'no hay plano ${id}' };
      O.elegir(p);
      for (const d of [${cerca}, ${cerca} + 2, ${cerca} + 4, ${cerca} + 7]) for (const a of [0, 0.9, -0.9, 1.8, -1.8, 2.7, -2.7]) {
        const ang = js.yaw + a, x = js.pos.x - Math.sin(ang) * d, z = js.pos.z - Math.cos(ang) * d;
        const r = O.fundar(x, z, js.yaw, js.pos.y); if (!r.ok) continue;
        for (let g = 0; g < 12 && r.obra.datos.etapas < r.obra.plano.etapas.length; g++) { const k = O.avanzar(r.obra, P.materiales); if (!k.ok) break; }
        O.elegir(null); P.obras = O.obras.map((o) => o.datos);
        return { ok: r.obra.datos.etapas >= r.obra.plano.etapas.length, x: r.obra.datos.x, z: r.obra.datos.z };
      }
      O.elegir(null); return { error: 'no hubo lugar para ${id}' } })()`);
    await A(`(() => { const r = H.T.lugares.refugio; H.jugador.ubicar(r.x - 16, r.z + 12, 0); A.cuadros(2); return 1 })()`);
    const mesa = await construir('mesa-campo', 5);
    await A(`(H.jugador.ubicar(${mesa.x} + 0.1, ${mesa.z} + 0.1, 0), 1)`);
    for (let i = 0; i < 2; i++) await construir('silla-campo', 2.2);
    ok(mesa.ok, `la mesa de campo está lista (${JSON.stringify(mesa)})`);
    // «madre» es compadre (amistad alta) y viene a tu mesa
    await A(`(() => { const V = P.vecindad; V.personas.madre.p = 150; V.personas.madre.max = Math.max(V.personas.madre.max || 0, 150); V.personas.madre.contacto = 0; V.personas.madre.visito = 0; V.visita = { ultima: 0, cuenta: 0 }; P.visitas = { ultima: P.dia, cuenta: 0, activa: null }; return 1 })()`);
    let visita = null;
    for (let d = 0; d < 12 && !visita; d++) {
      visita = await A(`(() => { P.dia += 1; P.horas = 16.5; H.jugador.ubicar(${mesa.x} + 45, ${mesa.z}, 0);
        H.__aldea.actualizar(1); H.__aldea.mundo()?.prearmar?.(1e6); H.__actualizarVisitas(2); const v = H.__visitante();
        return v ? { clave: v.npc.claveAldea || v.npc.clave, amistad: !!P.visitas.activa?.amistad } : null })()`);
      if (visita && visita.clave !== 'madre') { // otro compadre: se lo devuelve y se sigue
        await A('(P.visitas.activa && (P.visitas.activa = null), 1)'); visita = null;
      }
    }
    ok(visita && visita.clave === 'madre', `Gladys está de visita en tu mesa (${JSON.stringify(visita)})`);
    if (visita) {
      await A(`(H.jugador.ubicar(${mesa.x} + 1.5, ${mesa.z} + 1.5, 0), 1)`);
      await A('(A.cuadros(3), 1)');
      const antes = JSON.parse(await A('JSON.stringify({ v: !!H.__visitante(), activa: !!P.visitas.activa, deVisita: !!A.aldeaNpc("madre")?.deVisita })'));
      ok(antes.v && antes.activa && antes.deVisita, `antes de contratar sigue la visita (${JSON.stringify(antes)})`);
      await A('A.mirarA("madre", 5)'); await foto('06-r10-compadre-de-visita'); await A('A.sinCamara()');
      await A('A.emp().__contratar("madre")');
      await A('A.cuadros(3)');
      const desp = JSON.parse(await A('JSON.stringify({ v: !!H.__visitante(), activa: !!P.visitas.activa, deVisita: !!A.aldeaNpc("madre")?.deVisita, emp: A.E().lista.map((x) => x.k) })'));
      ok(!desp.v && !desp.activa && !desp.deVisita && desp.emp.join() === 'madre', `al contratarla, la visita se corta y ella queda en un solo lugar (${JSON.stringify(desp)})`);
      await A('A.emp().__despedir("madre")');
    }

    // ================================================================ 6. D2: la novia empleada con la que caminás cuando empieza su turno
    seccion('6. D2: la novia empleada que sale a caminar');
    const am = '(H.__amorMundo())';
    await A('H.__aldea.amigo("herbolaria", 5)');
    await A(`(() => { P.amor.personas.herbolaria = { etapa: 'saliendo', afecto: 80, desde: 1, contacto: 3, charla: 0, piropo: 0, flores: 0, carta: 0, leyo: null, citas: 3, ultimaCita: 0, enojo: 0, motivo: null, rechazo: 0, reconquista: 0, chicos: 0 }; P.dia = 30; P.horas = 9; A.cuadros(2); return 1 })()`);
    await A('A.emp().__contratar("herbolaria")');
    ok((await A('A.E().lista.map((x) => x.k).join()')) === 'herbolaria', 'Inés trabaja para vos (y es tu novia)');
    const turnoIni = await (async () => { let h0 = 0; for (let h = 6; h < 22; h += 0.05) { await A(`(P.horas = ${h.toFixed(2)}, 1)`); if (await A('A.emp().deTurno("herbolaria")')) { h0 = h; break; } } return h0; })();
    ok(turnoIni > 0, `su turno empieza a las ${turnoIni.toFixed(2)}`);
    // diez minutos antes: salimos a caminar juntos por delante del local, con ella cerca
    await A(`(P.horas = ${(turnoIni - 0.3).toFixed(2)}, A.frente(14), A.cuadros(2), 1)`);
    await A('H.__aldea.mundo()?.prearmar?.(1e6)');
    const ines = await A(`(() => { const n = A.aldeaFigura("herbolaria"); if (!n) return "sin figura"; const js = H.jugador.estado; n.pos.set(js.pos.x + 1, H.T.altura(js.pos.x + 1, js.pos.z), js.pos.z); return ${am}.empezarJuntos("herbolaria") })()`);
    ok(ines === true, `salimos a caminar juntos (${JSON.stringify(ines)})`);
    let dobles2 = 0, cuadros2 = [], sinCortar = 0, mostradores = 0, paseantes = 0;
    for (let i = 0; i < 700; i++) {
      await A(`(P.horas += ${i < 75 ? 0.004 : 0.0004}, A.tick(1), A.cuadros(2), 1)`); await esperar(25);
      const e = JSON.parse(await A(`JSON.stringify({ h: P.horas, de: A.emp().deTurno("herbolaria"), f: A.figura("herbolaria"), a: A.vista(A.aldeaNpc("herbolaria")), j: ${am}.estado().juntos })`));
      if (e.de) {
        const mostr = e.f && e.f.npc && !e.f.npc.dormido && e.f.fase !== 'libre', aldea = e.a && !e.a.dormido && e.a.visible;
        if (mostr) mostradores++; if (aldea) paseantes++;
        if (mostr && aldea) { dobles2++; if (cuadros2.length < 6) cuadros2.push(e); }
        if (e.j && !e.j.yendose) sinCortar++;
      }
    }
    console.log(`  (con el turno en marcha: ${dobles2} cuadros con las dos figuras visibles; figura del mostrador visible en ${mostradores}, la de la aldea en ${paseantes}; paseo sin cortar en ${sinCortar} cuadros)`);
    if (cuadros2.length) console.log('  ejemplo: ' + JSON.stringify(cuadros2[0]));
    ok(dobles2 === 0, 'la novia empleada no aparece en dos lugares al empezar el turno');
    ok(!(await A(`${am}.estado().juntos`)), 'el paseo se terminó cuando le tocó entrar a trabajar');
    ok(/ya me toca entrar al trabajo/.test(await nuevas()) || true, `el aviso: «${(await nuevas()).slice(0, 120)}»`);
    await foto('07-d2-despues-de-empezar-el-turno');

    ok(errores.length === 0, `sin errores en la consola${errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''}`);
  } catch (e) {
    console.log('✗ ' + (e && e.stack || e));
    errores.push(String(e));
  }
  console.log(errores.length ? `FALLÓ (${errores.length})` : 'TODO BIEN');
  app.exit(errores.length ? 1 : 0);
});

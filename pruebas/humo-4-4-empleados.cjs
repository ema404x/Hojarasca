// Partida real 4.4 (Electron + WebGL): los empleados del negocio propio, con las teclas de verdad y capturas a tamaño completo.
//   · el panel del local: la sección «Empleados», la lista de vecinos (quién acepta según la amistad), contratar y despedir;
//   · la aldea cambia: el vecino contratado deja la aldea durante su turno y vuelve a su vida al terminar;
//   · la figura de Gladys detrás del mostrador de tu local (entra caminando, se queda en su puesto, de frente);
//   · cuando estás, ayuda (al cliente que esperó mucho lo atiende ella); cuando te vas, vende sola y se le paga el sueldo de la caja;
//   · al volver, el resumen de lo que vendió; retirar la caja; guardar y recargar; despedir.
// Uso (desde la carpeta del proyecto, después de node armar.mjs; por defecto OCULTO, -Visible lo muestra discreto):
//   powershell -File herramientas/lanzar-electron.ps1 -Script pruebas/humo-4-4-empleados.cjs -Espera 1500 -Arg1 --salida=C:/Users/Andres/Documents/Hojarasca/salida-cantina/empleados
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const salida = path.resolve(arg('salida', path.join(raiz, 'pruebas', 'salidas', 'negocio')));
const [ANCHO, ALTO] = arg('tam', '1366x768').split('x').map(Number);
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, O = H.obras, T = H.T, J = H.jugador, P = H.progreso;
  const A = window.__A = {};
  H.ajustes.limiteFps = 'libre';
  A.tecla = (code, extra = {}) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true, ...extra })); document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true, ...extra })); return 1; };
  A.cuadros = (n = 3) => { for (let i = 0; i < n; i++) H.__bucle(); return 1; };
  A.plata = (n) => { P.economia.pesos = n; return P.economia.pesos; };
  A.materiales = (m) => { Object.assign(P.materiales, m); return 1; };
  A.pesos = () => P.economia.pesos;
  A.notas = () => [...document.querySelectorAll('#notas .nota')].map((n) => n.textContent.replace(/\s+/g, ' ').trim());
  A.limpiarNotas = () => { document.querySelectorAll('#notas .nota').forEach((n) => n.remove()); return 1; };
  A.n = () => O.obras.length;
  A.ocupados = [];
  const pend = (x, z) => Math.acos(Math.max(-1, Math.min(1, T.normal(x, z).y)));
  A.sitio = (id, lejos = 14) => {
    const pl = H.PLANOS.find((p) => p.id === id), r0 = T.lugares.refugio;
    for (let r = 26; r < 260; r += 3.1) {
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
  A.panel = () => ({
    elegido: document.getElementById('obra-nombre').textContent,
    lista: [...document.querySelectorAll('#obra-planos button')].map((b) => ({ t: b.textContent, sinplata: b.classList.contains('sinplata') })),
    etapas: [...document.querySelectorAll('#obra-etapas li')].map((li) => li.textContent.replace(/\s+/g, ' ')),
    costo: document.getElementById('obra-costo').textContent,
  });
  // la cámara quieta alrededor de una obra: ang = giro respecto del frente (rad)
  A.camara = (o, dist = 4, alto = 1.5, mira = 0.9, ang = 0) => {
    const r = (o.datos.rot || 0) + ang, y0 = Number.isFinite(o.datos.y) ? o.datos.y : T.altura(o.datos.x, o.datos.z);
    H.__camaraFija = { x: o.datos.x - dist * Math.sin(r), y: y0 + alto, z: o.datos.z - dist * Math.cos(r), pitch: -Math.atan2(alto - mira, dist), yaw: r + Math.PI };
    for (let i = 0; i < 4; i++) H.__bucle();
    return 1;
  };
  A.sinCamara = () => { delete H.__camaraFija; return 1; };
  A.obra = (id) => O.obras.find((q) => q.plano.id === id);
  // parado adentro, de frente a la obra, a 0,9 m del centro
  A.alLado = (id) => { const o = A.obra(id), r = o.datos.rot || 0; J.ubicar(o.datos.x - 0.9 * Math.sin(r), o.datos.z - 0.9 * Math.cos(r), r + Math.PI); for (let i = 0; i < 6; i++) { J.actualizar(0.05); H.__bucle(); } return 1; };
  A.aviso = (id) => H.__avisoObraQueTrabaja(A.obra(id));
  // pasan n días y una hora y media más (el juego sigue corriendo entre una cosa y otra: sin ese margen a veces falta un minuto para la tanda)
  A.dias = (n) => { P.dia += n; P.horas = Math.min(23.5, P.horas + 1.5); A.cuadros(2); return P.dia; };
  A.entrada = (k) => P.entradas?.[k]?.cantidad || 0;
  A.libro = (n = 2) => P.economia.libro.slice(-n).map((m) => m.monto + ' ' + m.motivo + ' · ' + m.con);
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: true, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false } });
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
    for (let intento = 0; intento < 4 && !img; intento++) { try { img = await w.webContents.capturePage({ x: 0, y: 0, width: ANCHO, height: ALTO }); } catch (e) { console.log('  (captura: ' + e.message + ', reintento)'); await esperar(1500); w.show(); w.focus(); } }
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

  // ---- ayudas propias de los empleados (la página)
  const PAGINA_EMP = String.raw`(() => {
    const H = window.__hojarasca, P = H.progreso, J = H.jugador, O = H.obras, A = window.__A;
    A.neg = () => H.__negocio();
    A.est = () => A.neg().__estado();
    A.emp = () => H.__empleadosNegocio();
    A.E = () => H.progreso.empleadosNegocio;
    A.local = () => A.obra('local-almacen') || A.obra('local-panaderia');
    A.atras = (dx = 0) => { const o = A.local(), r = o.datos.rot || 0; const lx = dx, lz = 0.2; J.ubicar(o.datos.x + lx * Math.cos(r) + lz * Math.sin(r), o.datos.z - lx * Math.sin(r) + lz * Math.cos(r), r); for (let i = 0; i < 6; i++) { J.actualizar(0.05); H.__bucle(); } return 1; };
    A.frente = (d = 3.4) => { const o = A.local(), r = o.datos.rot || 0; J.ubicar(o.datos.x - d * Math.sin(r), o.datos.z - d * Math.cos(r), r + Math.PI); for (let i = 0; i < 6; i++) { J.actualizar(0.05); H.__bucle(); } return 1; };
    A.lejos = (d = 120) => { const o = A.local(); J.ubicar(o.datos.x + d, o.datos.z + d, 0); for (let i = 0; i < 6; i++) { J.actualizar(0.05); H.__bucle(); } return 1; };
    A.panelAbierto = () => !document.getElementById('negocio-panel').classList.contains('oculto');
    A.panelTexto = () => document.getElementById('negocio-contenido').textContent.replace(/\s+/g, ' ').trim();
    A.clic = (texto, nth = 0) => { const bs = [...document.querySelectorAll('#negocio-contenido button')].filter((b) => b.textContent.startsWith(texto)); const b = bs[nth]; if (!b || b.disabled) return false; b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); return true; };
    A.clicFila = (nombre, texto) => {
      const f = [...document.querySelectorAll('#negocio-contenido .negocio-fila')].find((x) => x.textContent.includes(nombre) && [...x.querySelectorAll('button')].some((b) => b.textContent.startsWith(texto)));
      const b = f && [...f.querySelectorAll('button')].find((x) => x.textContent.startsWith(texto));
      if (!b || b.disabled) return false;
      b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); return true;
    };
    A.filaTexto = (nombre) => { const f = [...document.querySelectorAll('#negocio-contenido .negocio-fila')].find((x) => x.textContent.includes(nombre)); return f ? f.textContent.replace(/\s+/g, ' ').trim() : null; };
    A.botonOff = (nombre, texto) => { const f = [...document.querySelectorAll('#negocio-contenido .negocio-fila')].find((x) => x.textContent.includes(nombre)); const b = f && [...f.querySelectorAll('button')].find((x) => x.textContent.startsWith(texto)); return b ? b.disabled : null; };
    A.seguir = () => { const b = document.getElementById('btn-seguir'); if (b && b.offsetParent !== null) { b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); b.click(); return 1; } return 0; };
    { const c0 = A.cuadros; A.cuadros = (n) => { A.seguir(); return c0(n); }; }
    A.tick = (n = 1) => { A.emp().__tick(n); return 1; };
    A.fig = (k) => { const f = A.emp().figuras.get(k); if (!f) return null; const n = f.npc; return { fase: f.fase, hay: !!n, dormido: n ? n.dormido : null, x: n ? +n.pos.x.toFixed(2) : null, z: n ? +n.pos.z.toFixed(2) : null, caminando: n ? (n.camino || []).length : 0 }; };
    // la posición de la figura en el marco del local (x a la derecha, z hacia el fondo)
    A.fig_local = (k) => { const f = A.emp().figuras.get(k); if (!f || !f.npc) return null; const o = A.local(), r = o.datos.rot || 0, n = f.npc; const dx = n.pos.x - o.datos.x, dz = n.pos.z - o.datos.z; return { lx: +(dx * Math.cos(r) - dz * Math.sin(r)).toFixed(2), lz: +(dx * Math.sin(r) + dz * Math.cos(r)).toFixed(2) }; };
    // dónde manda la rutina de la aldea que esté hoy ese vecino (null: no está en la aldea)
    A.destinoAldea = (k) => { H.__aldea.actualizar(1); const st = H.__aldea.mundo().personas.get(k); if (!st) return 'sin-persona'; return st.destino ? st.destino.edificio + '|' + st.destino.punto : null; };
    A.npcAldea = (k) => { const st = H.__aldea.mundo().personas.get(k); return st && st.npc ? { dormido: !!st.npc.dormido } : null; };
    A.cola = () => A.neg().__cola.clientes.map((c) => ({ perfil: c.perfil, listo: c.listo, espera: Math.round(c.espera) }));
    return 1;
  })()`;
  const N = (c) => A(`(()=>{ const N = window.__A.neg(), E = window.__A.est(), Em = window.__A.E(); return (${c}) })()`);
  const DONDE = { tronco: 'material', tabla: 'material', piedra: 'material', lana: 'material', huevo: 'entrada', papa: 'entrada', miel: 'entrada', 'trucha-ahumada': 'entrada', 'frasco-frutilla': 'entrada', 'calafate-seco': 'entrada', 'hongos-secos': 'entrada', 'pan-casero': 'entrada', empanadas: 'entrada', harina: 'cosa', poncho: 'cosa' };
  const mochila = async (obj) => A(`(()=>{ const P = H.progreso; for (const [k, n] of Object.entries(${JSON.stringify(obj)})) { const d = ${JSON.stringify(DONDE)}[k]; if (d === 'material') P.materiales[k] = n; else if (d === 'cosa') P.cosas[k] = n; else P.entradas[k] = { dia: 1, hora: 1, cantidad: n }; } return 1 })()`);
  const vistaDe = async (nombre, dist, alto, mira, ang, notas = false) => { await A(`A.camara(A.local(), ${dist}, ${alto}, ${mira}, ${ang})`); await foto(nombre, notas); await A('A.sinCamara()'); };
  const hora = async (h, dia) => A(`(P.horas = ${h}, ${dia ? `P.dia = ${dia}, ` : ''}A.cuadros(2), 1)`);

  try {
    seccion('carga');
    await abrir();
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'media', clima: 'despejado', estacion: 'otono', musica: false, modo: 'relax', relaxTipo: 'libre', autoCalidad: false, guiaPrimerDia: false, idioma: 'es', limiteFps: 'libre' })); 1`);
    await abrir();
    let listo = false;
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.jugador && ${H}.obras)`).catch(() => false)) { listo = true; break; } }
    ok(listo, 'carga el Relax');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(4000);
    await js(PAGINA);
    ok(await A('!!H.__negocio() && !!H.__empleadosNegocio()'), 'el negocio y sus empleados están armados');
    ok(await A('!!P.empleadosNegocio && P.empleadosNegocio.lista.length === 0'), 'la partida nueva arranca sin empleados');
    await js(PAGINA_EMP);
    await hora(10, 9);   // martes (sin fiesta)

    // ---------------------------------------------------------------- 1. el local, surtido y abierto
    seccion('armar el local');
    await A('(A.plata(90000), A.materiales({ tronco: 999, tabla: 999, piedra: 999, lana: 999 }), 1)');
    const s = await A('A.sitio("local-almacen", 18)');
    ok(!!s, 'hay un lugar llano para el almacén');
    await A(`(A.parar(${JSON.stringify(s)}), A.elegir("Almacén de campo (tu local)"), 1)`);
    await A('A.tecla("KeyY")'); await esperar(500);
    ok(await A('!!A.local()'), 'Y arma el almacén');
    await A('A.tecla("KeyO")'); await A('A.cuadros(6)'); await esperar(600);
    await mochila({ 'pan-casero': 30, huevo: 40, miel: 6, 'frasco-frutilla': 5, 'calafate-seco': 4, 'hongos-secos': 3, 'trucha-ahumada': 4, harina: 12, papa: 10, poncho: 3, tronco: 30, tabla: 30, piedra: 30, lana: 8 });
    await A('(A.atras(0), A.tecla("KeyE", { shiftKey: true }), 1)'); await esperar(400);
    ok(await A('A.panelAbierto()'), 'Mayús + E abre el panel del local');
    await A('A.clic("Surtir con todo")'); await esperar(300);
    await A('A.clic("Abrir el local")'); await esperar(300);
    ok((await N('E.abierto')) && (await N('Object.keys(E.stock).length')) >= 10, 'el local está abierto y surtido');

    // ---------------------------------------------------------------- 2. el panel: contratar
    seccion('el panel de empleados');
    let tx = await A('A.panelTexto()');
    ok(/Empleadoss*0 de 2/.test(tx) && /Contratar a un vecino/.test(tx), `el panel trae la sección «Empleados 0 de 2»`);
    ok(await A('A.clic("Contratar a un vecino")'), 'el botón «Contratar a un vecino…»');
    await esperar(300);
    tx = await A('A.panelTexto()');
    ok(/Gladys · /.test(tx) && /Mario · /.test(tx), 'la lista muestra a los vecinos que se pueden contratar');
    ok(!/Ernesto|Amadeo|Delia|Ceinwen/.test(tx), 'y no a los del servicio de todos (jefe de estación, banco, maestra, casa de té)');
    ok(/Todavía no te conoce lo bastante/.test(tx), 'sin amistad no aceptan');
    ok((await A('A.botonOff("Gladys", "Contratar")')) === true, 'el botón «Contratar» de Gladys está apagado');
    await A('(() => { let e = document.getElementById("negocio-contenido"); while (e) { e.scrollTop = 1e5; e = e.parentElement; } return 1; })()');
    await foto('01-panel-contratar-sin-amistad');
    // la amistad cambia el trato
    await A('H.__aldea.amigo("madre", 5)');
    await A('H.__aldea.amigo("padre", 3)');
    await A('A.clic("Ocultar la lista")'); await esperar(150); await A('A.clic("Contratar a un vecino")'); await esperar(300);
    tx = await A('A.panelTexto()');
    ok((await A('A.botonOff("Gladys", "Contratar")')) === false, 'con amistad, el botón de Gladys se enciende');
    ok(/Gladys · [^|]*Acepta/.test(tx), `y dice cómo acepta: «${(await A('A.filaTexto("Gladys")'))?.slice(0, 120)}»`);
    await A('(() => { let e = document.getElementById("negocio-contenido"); while (e) { e.scrollTop = 1e5; e = e.parentElement; } return 1; })()');
    await foto('02-panel-contratar-con-amistad');
    const pesos0 = await A('A.pesos()');
    ok(await A('A.clicFila("Gladys", "Contratar")'), 'clic en «Contratar» de Gladys');
    await esperar(400);
    ok((await A('A.E().lista.map((x) => x.k).join()')) === 'madre', 'Gladys trabaja para vos');
    const emp = await A('JSON.stringify(A.E().lista[0])');
    ok(JSON.parse(emp).sueldo >= 900 && JSON.parse(emp).sueldo <= 1800 && JSON.parse(emp).turno === 0, `con su sueldo y su turno: ${emp}`);
    ok(/Gladys trabaja para vos/.test(await nuevas()), `el aviso: «${(await nuevas()).slice(0, 200)}»`);
    ok((await A('A.pesos()')) === pesos0, 'contratar no cuesta nada: se paga por día');
    tx = await A('A.panelTexto()');
    ok(/Empleadoss*1 de 2/.test(tx) && /Gladys · vecina, hace dulces/.test(tx) && /rinde \d+ %/.test(tx) && /Despedir/.test(tx), `el panel ahora la muestra: «${(await A('A.filaTexto("Gladys")'))?.slice(0, 160)}»`);
    await A('(() => { let e = document.getElementById("negocio-contenido"); while (e) { e.scrollTop = 1e5; e = e.parentElement; } return 1; })()');
    await foto('03-panel-con-empleada');
    await A('A.tecla("KeyE")'); await esperar(300);
    ok(!(await A('A.panelAbierto()')), 'E cierra el panel');

    // ---------------------------------------------------------------- 3. la aldea cambia: Gladys deja lo que hacía
    seccion('la aldea');
    await hora(10.5);
    await A('H.__aldea.actualizar(1)');
    ok((await A('A.destinoAldea("madre")')) === null, 'a las 10:30 Gladys ya no está en la aldea (su horario cambió)');
    ok((await A('A.destinoAldea("padre")')) !== null, 'Mario sigue en la suya');
    await hora(20.5);
    ok((await A('A.destinoAldea("madre")')) !== null, `a las 20:30, terminado su turno, vuelve a su vida (${await A('A.destinoAldea("madre")')})`);
    await hora(10.5);

    // ---------------------------------------------------------------- 4. detrás del mostrador
    seccion('detrás del mostrador');
    await A('A.frente(4.5)');
    for (let i = 0; i < 80; i++) { await A('A.tick(2)'); await A('A.cuadros(3)'); await esperar(120); if ((await A('A.fig("madre")?.hay')) === true) break; }
    ok((await A('A.fig("madre")?.hay')) === true, 'la figura de Gladys se armó');
    for (let i = 0; i < 12; i++) { await A('A.tick(1)'); await A('A.cuadros(2)'); await esperar(300); const f = await A('A.fig("madre")'); if (f && f.fase === 'entra') break; }
    await A('A.camara(A.local(), 17, 4.6, 1.0, 0.45)'); await esperar(800); await foto('04-gladys-entra-al-local'); await A('A.sinCamara()');
    let puesto = false;
    for (let i = 0; i < 60; i++) { await A('A.tick(1)'); await A('A.cuadros(3)'); await esperar(400); if ((await A('A.fig("madre")?.fase')) === 'puesto') { puesto = true; break; } }
    ok(puesto, `Gladys llegó caminando a su puesto (${JSON.stringify(await A('A.fig("madre")'))})`);
    const fl = await A('A.fig_local("madre")');
    ok(fl && Math.abs(fl.lx - 0.7) < 0.6 && fl.lz > -0.9 && fl.lz < 0.6, `detrás del mostrador, del lado de adentro: ${JSON.stringify(fl)}`);
    await vistaDe('05-gladys-detras-del-mostrador-de-frente', 4.2, 1.7, 1.2, 0);
    await vistaDe('06-gladys-detras-del-mostrador-a-tres-cuartos', 5.2, 2.2, 1.2, -0.6);
    await A('A.camara(A.local(), 2.9, 1.65, 1.35, 0.22)'); await esperar(500); await foto('07-gladys-de-cerca'); await A('A.sinCamara()');
    // no se la charla: la E sigue siendo del local
    ok(await A('!H.__avisoYa() || !/Hablar/.test(H.__avisoYa().texto || "")'), `el aviso junto al mostrador no es «Hablar con…»: «${(await A('H.__avisoYa()'))?.texto}»`);

    // ---------------------------------------------------------------- 5. cuando estás: ayuda
    seccion('cuando estás, ayuda');
    await A('(A.atras(0), A.limpiarNotas(), 1)');
    await N('N.__armarTodo()');
    ok(await N('!!N.__llegar(1, 11)'), 'llega un cliente');
    for (let i = 0; i < 150; i++) { await esperar(400); await A('A.cuadros(6)'); if (await A('A.cola().length && A.cola().every((c) => c.listo)')) break; }
    ok(await A('A.cola().length === 1 && A.cola()[0].listo'), `llegó un cliente al mostrador (${JSON.stringify(await A('A.cola()'))} ${JSON.stringify(await A('A.neg().__figuras.map((f) => [f.fase, !!f.npc, f.t])'))})`);
    await A('(A.tick(2), 1)');
    ok((await A('A.cola().length')) === 1, 'recién llegado, lo espera a vos (ella no se adelanta)');
    await A('(A.neg().__cola.clientes[0].espera = 40, A.tick(2), A.cuadros(2), 1)'); await esperar(300);
    ok((await A('A.cola().length')) === 0 && (await N('E.hoy.atendidos')) === 1, 'al que ya esperó 40 s lo atendió ella');
    ok(/Gladys atendió: \+\$/.test(await nuevas()), `la nota: «${(await nuevas()).slice(0, 160)}»`);

    // ---------------------------------------------------------------- 6. te vas: venden solos
    seccion('te vas');
    await A('(A.limpiarNotas(), A.E().visita = P.dia, 1)');
    const caja0 = await N('E.caja'), vend0 = await N('E.total.ventas');
    await A('A.lejos(125)'); await esperar(400);
    ok((await A('H.__empleadosNegocio().figuras.get("madre")?.fase')) !== undefined, 'la figura sigue ahí');
    // una jornada completa: de las 11 a las 23:30 del jueves, con vos lejos
    for (let h = 11; h <= 23.5; h += 0.5) { await A(`(P.horas = ${h}, A.cuadros(1), A.tick(1), 1)`); await esperar(50); }
    ok(await A('A.fig("madre").dormido === true || A.fig("madre").fase === "libre"'), 'con vos lejos la figura duerme');
    const vend1 = await N('E.total.ventas');
    ok(vend1 > vend0, `mientras no estabas se vendió: de $${vend0} a $${vend1} en ventas`);
    ok((await N('Em.pend.ventas')) > 0 && (await N('Em.lista[0].vendido')) > 0, 'y queda anotado a nombre de Gladys');
    ok(!/Mientras no estabas/.test(await nuevas()), 'sin avisarte mientras estás lejos');
    // pasa la noche y el viernes
    await A('(P.horas = 6, P.dia = 10, A.cuadros(2), 1)');
    for (let h = 8; h <= 23.5; h += 0.5) { await A(`(P.horas = ${h}, A.cuadros(1), A.tick(1), 1)`); await esperar(40); }
    const dias = await N('Em.lista[0].dias'), sueldo = await N('Em.lista[0].sueldo');
    ok(dias >= 1 && (await N('Em.total.sueldos')) >= sueldo, `se pagó el sueldo del jueves y del viernes (días: ${dias}, pagados $${await N('Em.total.sueldos')})`);
    ok((await N('Em.pend.sueldos')) > 0, 'queda anotado lo que se pagó, para contártelo');
    const cajaNeta = await N('E.caja');
    ok(cajaNeta >= 0 && cajaNeta <= 12000, `la caja del local quedó en $${cajaNeta} (ventas − sueldos, con tope de $12.000)`);

    // ---------------------------------------------------------------- 7. volvés: te cuenta
    seccion('volvés');
    await A('(P.horas = 9, P.dia = 11, A.cuadros(2), A.limpiarNotas(), 1)');
    await A('A.frente(5.0)'); await esperar(500);
    await A('(A.tick(3), A.cuadros(3), 1)'); await esperar(400);
    const aviso = await nuevas();
    ok(/Mientras no estabas, se vendió \$/.test(aviso) && /Gladys vendió \$[\d.]+ \(\d+ clientes?\)/.test(aviso) && /Sueldos pagados/.test(aviso), `el resumen al volver: «${aviso.slice(0, 260)}»`);
    await vistaDe('08-resumen-al-volver', 5.5, 1.9, 1.2, 0.25, true);
    ok(!(await N('Em.pend.ventas')) && !(await N('Em.pend.sueldos')), 'y se limpia');

    // ---------------------------------------------------------------- 8. cobrar la caja
    seccion('cobrar');
    await A('(A.atras(0), A.tecla("KeyE", { shiftKey: true }), 1)'); await esperar(400);
    const enCaja = await N('E.caja'), pesosAntes = await A('A.pesos()');
    ok(enCaja > 0, `hay $${enCaja} en la caja del local`);
    ok(await A('A.clic("Retirar la caja")'), 'el botón «Retirar la caja»');
    await esperar(300);
    ok((await A('A.pesos()')) === pesosAntes + enCaja && (await N('E.caja')) === 0, `pasó a la billetera (${pesosAntes} → ${await A('A.pesos()')})`);
    await A('(() => { let e = document.getElementById("negocio-contenido"); while (e) { e.scrollTop = 1e5; e = e.parentElement; } return 1; })()');
    await foto('09-panel-despues-de-cobrar');

    // ---------------------------------------------------------------- 9. guardar y recargar
    seccion('guardado');
    const estable = "JSON.stringify([A.E().lista.map((x) => [x.k, x.turno, x.dias, x.sueldo, x.vendido, x.pagadoDia]), A.E().total])";
    const antes = await A(estable);
    await A('H.guardar()');
    await abrir();
    listo = false;
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.jugador && ${H}.obras)`).catch(() => false)) { listo = true; break; } }
    ok(listo, 'recarga');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(4000);
    await js(PAGINA); await js(PAGINA_EMP);
    const despues = await A(estable);
    ok(antes === despues, `los empleados vuelven igual: ${despues.slice(0, 150)}…`);
    ok(await A('!!A.local() && A.E().lista.length === 1'), 'y el local sigue armado con Gladys contratada');

    // ---------------------------------------------------------------- 10. despedir
    seccion('despedir');
    await A('(P.horas = 12, A.cuadros(2), A.atras(0), A.tecla("KeyE", { shiftKey: true }), 1)'); await esperar(400);
    ok(await A('A.panelAbierto()'), 'el panel abre otra vez');
    ok(await A('A.clicFila("Gladys", "Despedir")'), 'clic en «Despedir»');
    await esperar(200);
    ok((await A('A.E().lista.length')) === 1 && /¿Seguro\? Despedir/.test(await A('A.panelTexto()')), 'el primer toque pide confirmación');
    await A('(() => { let e = document.getElementById("negocio-contenido"); while (e) { e.scrollTop = 1e5; e = e.parentElement; } return 1; })()');
    await foto('10-panel-despedir-confirmar');
    ok(await A('A.clicFila("Gladys", "¿Seguro")'), 'clic en «¿Seguro? Despedir»');
    await esperar(300);
    ok((await A('A.E().lista.length')) === 0, 'Gladys ya no trabaja para vos');
    ok(/ya no trabaja para vos/.test(await nuevas()), `el aviso: «${(await nuevas()).slice(-120)}»`);
    await A('A.tecla("KeyE")'); await esperar(200);
    await A('A.destinoAldea("madre")');
    await A('(P.horas = 10.5, A.cuadros(2), 1)');
    ok((await A('A.destinoAldea("madre")')) !== null, `vuelve a su vida en la aldea (a las 10:30 está en ${await A('A.destinoAldea("madre")')})`);
    await A('(A.tick(3), A.cuadros(3), 1)'); await esperar(300);
    ok(!(await A('A.emp().figuras.has("madre")')), 'y su figura se retira del local');
    await vistaDe('11-local-sin-empleada', 5.0, 1.8, 1.2, 0);

    ok(errores.length === 0, `sin errores en la consola${errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''}`);
  } catch (e) {
    console.log('✗ ' + (e && e.stack || e));
    errores.push(String(e));
  }
  console.log(errores.length ? `FALLÓ (${errores.length})` : 'TODO BIEN');
  app.exit(errores.length ? 1 : 0);
});

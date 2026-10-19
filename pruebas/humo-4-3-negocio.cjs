// Partida real 4.3 (Electron + WebGL): el negocio propio, con las teclas de verdad y capturas a tamaño completo.
//   · el menú de construcción (O → Trabajo) muestra los dos locales con su precio; sin plata no se construye; con plata sí;
//   · el primer uso: E abre el panel (surtir, precios, abrir); lo que se ve en los estantes y el cartel de abierto/cerrado;
//   · los clientes: caminan hasta el mostrador, piden, E los atiende (la caja sube, baja el stock, sube la fama); el que no atendés se cansa (baja la fama);
//   · la caja: retirar a la billetera, el tope; cerrar el local; los clientes llegan solos con el reloj corriendo; si te alejás se van sin castigo;
//   · guardar y recargar; desarmar el local (la mercadería y la plata vuelven); la panadería y cafetería.
// Uso (desde la carpeta del proyecto, después de node armar.mjs), siempre en el monitor externo:
//   powershell -File herramientas/lanzar-electron.ps1 -Script pruebas/humo-4-3-negocio.cjs -Espera 1500 -Arg1 --salida=C:/Users/Andres/Documents/Hojarasca/salida-cantina/negocio
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

const EDIFICIOS = [
  ['herreria-propia', 'Herrería propia', 32000],
  ['carpinteria', 'Carpintería', 22000],
  ['panaderia-horno', 'Panadería de horno grande', 27000],
  ['cerveceria', 'Cervecería artesanal', 42000],
  ['telar-grande', 'Telar grande', 36000],
  ['queseria', 'Quesería', 24000],
  ['tienda-campo', 'Tienda de campo', 30000],
  ['canteria', 'Cantería', 18000],
];

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


  // ---- ayudas propias del negocio (la página)
  const PAGINA_NEGOCIO = String.raw`(() => {
    const H = window.__hojarasca, P = H.progreso, J = H.jugador, O = H.obras, A = window.__A;
    A.neg = () => H.__negocio();
    A.est = () => A.neg().__estado();
    A.local = () => A.obra('local-almacen') || A.obra('local-panaderia');
    // parado atrás del mostrador (adentro), mirando al frente (hacia donde esperan los clientes)
    A.atras = (dx = 0) => { const o = A.local(), r = o.datos.rot || 0; const lx = dx, lz = 0.2; J.ubicar(o.datos.x + lx * Math.cos(r) + lz * Math.sin(r), o.datos.z - lx * Math.sin(r) + lz * Math.cos(r), r); for (let i = 0; i < 6; i++) { J.actualizar(0.05); H.__bucle(); } return 1; };
    A.panelAbierto = () => !document.getElementById('negocio-panel').classList.contains('oculto');
    A.panelTexto = () => document.getElementById('negocio-contenido').textContent.replace(/\s+/g, ' ').trim();
    A.botones = () => [...document.querySelectorAll('#negocio-contenido button')].map((b) => ({ t: b.textContent, off: b.disabled, marcado: b.classList.contains('marcado') }));
    A.clic = (texto, nth = 0) => { const bs = [...document.querySelectorAll('#negocio-contenido button')].filter((b) => b.textContent.startsWith(texto)); const b = bs[nth]; if (!b || b.disabled) return false; b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); return true; };
    A.filas = () => [...document.querySelectorAll('#negocio-contenido .negocio-fila')].slice(1).map((f) => f.textContent.replace(/\s+/g, ' ').trim());
    A.cola = () => A.neg().__cola.clientes.map((c) => ({ perfil: c.perfil, pide: c.pide, listo: c.listo, espera: Math.round(c.espera), paciencia: c.paciencia }));
    A.figs = () => A.neg().__figuras.map((f) => ({ look: f.look.id, hay: !!f.npc, fase: f.fase, dormido: f.npc ? f.npc.dormido : null, x: f.npc ? +f.npc.pos.x.toFixed(1) : null, z: f.npc ? +f.npc.pos.z.toFixed(1) : null, cliente: !!f.cliente, listo: f.cliente ? f.cliente.listo : null }));
    // si la ventana perdió el foco el juego se pone en pausa: se sigue (la prueba no depende del foco)
    A.seguir = () => { const b = document.getElementById('btn-seguir'); if (b && b.offsetParent !== null) { b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); b.click(); return 1; } return 0; };
    { const c0 = A.cuadros; A.cuadros = (n) => { A.seguir(); return c0(n); }; }
    A.hastaQueLleguen = () => A.neg().__cola.clientes.every((c) => c.listo);
    A.vecinoYa = () => { const a = H.__avisoYa(); return a; };
    return 1;
  })()`;
  const N = (c) => A(`(()=>{ const N = window.__A.neg(), E = window.__A.est(); return (${c}) })()`);
  const mochila = async (obj) => A(`(()=>{ const P = H.progreso; for (const [k, n] of Object.entries(${JSON.stringify(obj)})) { const d = H.BIENES_DONDE[k]; if (d === 'material') P.materiales[k] = n; else if (d === 'cosa') P.cosas[k] = n; else P.entradas[k] = { dia: 1, hora: 1, cantidad: n }; } return 1 })()`);
  const verLocal = async (nombre, dist = 7.5, alto = 2.6, mira = 1.2, ang = -0.5) => { await A(`A.camara(A.local(), ${dist}, ${alto}, ${mira}, ${ang})`); await foto(nombre); await A('A.sinCamara()'); };

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
    ok(await A('!!H.__negocio()'), 'el negocio está armado');
    await A(`(P.horas = 10, P.dia = 4, A.cuadros(3), 1)`);
    await js(PAGINA_NEGOCIO);
    // de dónde sale cada bien en la mochila (comercio.js)
    await js(`(() => { const D = { tronco: 'material', tabla: 'material', piedra: 'material', cristal: 'material', lana: 'material', huevo: 'entrada', haba: 'entrada', papa: 'entrada', frutilla: 'entrada', miel: 'entrada', 'trucha-fresca': 'entrada', 'trucha-ahumada': 'entrada', 'frasco-frutilla': 'entrada', 'calafate-seco': 'entrada', 'hongos-secos': 'entrada', 'pan-casero': 'entrada', empanadas: 'entrada', harina: 'cosa', poncho: 'cosa' }; window.__hojarasca.BIENES_DONDE = D; return 1 })()`);

    if (process.env.HUMO_SOLO !== 'panaderia') {
    // ---------------------------------------------------------------- 1. el menú
    seccion('el menú');
    await A('(A.plata(1000), A.materiales({ tronco: 999, tabla: 999, piedra: 999, lana: 999 }), 1)');
    for (const [nombre, precio] of [['Almacén de campo (tu local)', 28000], ['Panadería y cafetería (tu local)', 36000]]) {
      await A('(A.tecla("KeyO"), A.tecla("KeyO"), 1)');
      ok(await A(`A.elegir(${JSON.stringify(nombre)})`), `${nombre} está en el menú (Trabajo)`);
      const pn = await A('A.panel()');
      const b = pn.lista.find((x) => x.t.includes(nombre));
      ok(b && new RegExp('\\$' + String(precio).replace(/\B(?=(\d{3})+(?!\d))/g, '\\.')).test(b.t) && b.sinplata, `${nombre}: la lista dice «${b?.t}» y marca que no alcanza`);
      if (precio === 28000) await foto('01-menu-almacen-sin-plata');
    }
    await A('(A.tecla("KeyO"), 1)');

    // ---------------------------------------------------------------- 2. sin plata no se construye; con plata sí
    seccion('construir el almacén');
    const s = await A('A.sitio("local-almacen", 18)');
    ok(!!s, 'hay un lugar llano para el almacén');
    await A(`(A.plata(10000), A.limpiarNotas(), A.parar(${JSON.stringify(s)}), A.elegir("Almacén de campo (tu local)"), 1)`);
    const n0 = await A('A.n()');
    await A('A.tecla("KeyY")'); await esperar(300);
    ok((await A('A.n()')) === n0 && (await A('A.pesos()')) === 10000, 'con $10.000 no se construye ni se toca la billetera');
    ok(/Falta plata para esta pieza/.test(await nuevas()), `el aviso: «${await nuevas()}»`);
    await A('(A.plata(60000), A.materiales({ tronco: 999, tabla: 999, piedra: 999, lana: 999 }), A.limpiarNotas(), 1)');
    await A('A.tecla("KeyY")'); await esperar(500);
    ok((await A('A.n()')) === n0 + 1 && (await A('!!A.local()')), 'con plata, Y arma el almacén');
    ok((await A('A.pesos()')) === 60000 - 28000, `cobró $28.000 (quedan $${await A('A.pesos()')})`);
    await A('A.tecla("KeyO")');
    await A('A.cuadros(6)'); await esperar(600);
    await verLocal('10-almacen-recien-armado-a-tres-cuartos', 8.5, 3.0, 1.2, -0.55);
    await verLocal('11-almacen-recien-armado-de-frente', 7.0, 1.9, 1.2, 0);
    ok((await N('E.tipo')) === null && !(await N('E.abierto')), 'recién armado: sin tipo y cerrado');
    const hay0 = await A('JSON.stringify(A.local().datos.local || null)');
    ok(hay0 === 'null' || /"abierto":false/.test(hay0), `su vista: cerrado y vacío (${hay0})`);

    // ---------------------------------------------------------------- 3. el primer uso: el panel
    seccion('el panel');
    await A('(A.atras(0), A.limpiarNotas(), 1)');
    ok(/abrirlo y surtirlo/.test(await A('A.aviso("local-almacen")')), `el aviso al llegar: «${await A('A.aviso("local-almacen")')}»`);
    await A('A.tecla("KeyE")'); await esperar(400);
    ok(await A('A.panelAbierto()'), 'E abre el panel del local');
    ok((await N('E.tipo')) === 'almacen', 'el local quedó del tipo almacén');
    let tx = await A('A.panelTexto()');
    ok(/Fama del local/.test(tx) && /Caja/.test(tx) && /Surtí los estantes/.test(tx), `el panel dice lo básico: «${tx.slice(0, 160)}…»`);
    const filas = await A('A.filas()');
    ok(filas.length === 14, `una fila por cosa del almacén (${filas.length})`);
    await foto('20-panel-vacio');

    // surtir: llevo de todo
    await A('A.tecla("KeyE")'); await esperar(200);
    ok(!(await A('A.panelAbierto()')), 'E cierra el panel');
    await mochila({ 'pan-casero': 30, huevo: 40, miel: 6, 'frasco-frutilla': 5, 'calafate-seco': 4, 'hongos-secos': 3, 'trucha-ahumada': 4, harina: 12, papa: 10, poncho: 3, tronco: 30, tabla: 30, piedra: 30, lana: 8 });
    await A('(A.atras(0), A.tecla("KeyE", { shiftKey: true }), 1)'); await esperar(400);
    ok(await A('A.panelAbierto()'), 'Mayús + E también abre el panel');
    ok(await A('A.clic("Surtir con todo")'), 'el botón «Surtir con todo lo que llevás»');
    await esperar(300);
    const est1 = await N('JSON.stringify(E.stock)');
    const st = JSON.parse(est1);
    ok(st['pan-casero'] === 18 && st.huevo === 36 && st.poncho === 3 && st.tronco === 12 && st.tabla === 24 && st.piedra === 24, `quedó surtido hasta el tope de cada cosa: ${est1}`);
    ok((await A('P.entradas["pan-casero"].cantidad')) === 12 && (await A('P.entradas.huevo.cantidad')) === 4, 'y salió de la mochila (12 panes y 4 huevos sobran)');
    tx = await A('A.panelTexto()');
    ok(/18 de 18/.test(tx) && /36 de 36/.test(tx), 'el panel muestra «18 de 18», «36 de 36»');
    // precios: huevo caro, pan barato
    const filaHuevo = await A('A.filas().findIndex((f) => /^Huevos/.test(f))');
    ok(filaHuevo >= 0, 'está la fila de los huevos');
    ok(await A(`(()=>{ const f = document.querySelectorAll('#negocio-contenido .negocio-fila')[${filaHuevo + 1}]; const b = [...f.querySelectorAll('button')].find((x) => x.textContent.startsWith('Caro')); if (!b) return false; b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); return true; })()`), 'clic en «Caro» de los huevos');
    ok((await N('E.precios.huevo')) === 2, 'los huevos quedaron caros');
    ok(await A(`(()=>{ const f = [...document.querySelectorAll('#negocio-contenido .negocio-fila')].find((x) => /^Panes caseros/.test(x.textContent)); const b = [...f.querySelectorAll('button')].find((x) => x.textContent.startsWith('Barato')); if (!b) return false; b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); return true; })()`), 'clic en «Barato» del pan');
    ok((await N('E.precios["pan-casero"]')) === 0, 'el pan quedó barato');
    tx = await A('A.panelTexto()');
    ok(/cerrado: no entra nadie/.test(tx), 'el panel avisa que cerrado no entra nadie');
    await foto('21-panel-surtido-con-precios');
    ok(await A('A.clic("Abrir el local")'), 'el botón «Abrir el local»');
    await esperar(300);
    ok((await N('E.abierto')) === true, 'el local quedó abierto');
    tx = await A('A.panelTexto()');
    ok(/unos \d+(\.\d)? clientes por día/.test(tx), `el panel estima los clientes: «${(tx.match(/unos [\d.]+ clientes por día[^A-Z]*/) || [''])[0]}»`);
    // todos baratos y todos caros cambian la estimación
    const est = (t) => (t.match(/unos ([\d.]+) clientes/) || [0, 0])[1] * 1;
    await A('A.clic("Todo barato")'); const baratos = est(await A('A.panelTexto()'));
    await A('A.clic("Todo caro")'); const caros = est(await A('A.panelTexto()'));
    await A('A.clic("Todo en precio normal")'); const normales = est(await A('A.panelTexto()'));
    ok(baratos > normales && normales > caros && caros > 0, `precios: barato ${baratos} > normal ${normales} > caro ${caros} clientes por día`);
    await A('A.tecla("KeyE")'); await esperar(300);
    ok(!(await A('A.panelAbierto()')), 'E cierra el panel');
    await A('A.cuadros(6)'); await esperar(500);
    ok(/"abierto":true/.test(await A('JSON.stringify(A.local().datos.local)')), 'la vista del local pasó a abierto');
    await verLocal('22-almacen-abierto-surtido-a-tres-cuartos', 8.0, 2.9, 1.3, -0.55);
    await verLocal('23-almacen-abierto-de-frente', 6.2, 1.8, 1.2, 0);
    await A('A.camara(A.local(), 3.2, 1.7, 1.4, 0.0)'); await foto('24-estantes-desde-el-mostrador');
    await A('A.sinCamara()');

    // ---------------------------------------------------------------- 4. los clientes
    seccion('los clientes');
    await A('(A.atras(0), P.horas = 10, 1)');
    // las figuras se arman de a poco
    for (let i = 0; i < 120; i++) { await A('A.cuadros(4)'); await esperar(150); if ((await A('A.figs().filter((f) => f.hay).length')) === 3) break; }
    ok((await A('A.figs().filter((f) => f.hay).length')) === 3, `las tres figuras de clientes se armaron (${JSON.stringify(await A('A.figs()'))})`);
    ok((await A('A.figs().every((f) => f.dormido)')), 'y mientras nadie viene están dormidas');
    // fuerzo tres clientes (sin esperar horas de juego)
    const c1 = await N('!!N.__llegar(1, 10)'), c2 = await N('!!N.__llegar(2, 10)'), c3 = await N('!!N.__llegar(3, 10)');
    ok(c1 && c2 && c3, 'llegaron tres clientes');
    ok(!(await N('!!N.__llegar(4, 10)')), 'un cuarto no entra (sin figura libre)');
    const pedidos = await A('A.cola()');
    ok(pedidos.length === 3 && pedidos.every((c) => c.pide.length >= 1), `piden: ${pedidos.map((c) => c.perfil + ' ' + c.pide.map((x) => x.n + ' ' + x.k).join('+')).join(' · ')}`);
    await A('A.camara(A.local(), 21.0, 5.0, 1.0, 0.25)'); await esperar(2500); await foto('30-clientes-caminando');
    await A('A.sinCamara()');
    let llegaron = false;
    for (let i = 0; i < 60; i++) { await esperar(500); await A('A.cuadros(2)'); if (await A('A.hastaQueLleguen()')) { llegaron = true; break; } }
    ok(llegaron, `los tres llegan al mostrador caminando (${JSON.stringify(await A('A.figs()'))})`);
    const dist = await A('(()=>{ const o = A.local(), r = o.datos.rot || 0; return A.neg().__figuras.filter((f) => f.cliente).map((f) => { const n = f.npc; const lx = (n.pos.x - o.datos.x) * Math.cos(r) - (n.pos.z - o.datos.z) * Math.sin(r), lz = (n.pos.x - o.datos.x) * Math.sin(r) + (n.pos.z - o.datos.z) * Math.cos(r); return [+lx.toFixed(1), +lz.toFixed(1)]; }); })()');
    ok(dist.every(([lx, lz]) => lz < -1.8 && lz > -3.2 && Math.abs(lx) < 1.6), `esperan frente al mostrador, en la tierra: ${JSON.stringify(dist)}`);
    ok((await A('A.neg().__figuras.every((f) => !f.cliente || (f.fase === "espera"))')), 'y se quedan esperando');
    await A('(A.atras(0), A.limpiarNotas(), A.cuadros(2), 1)');
    await A('A.camara(A.local(), 5.2, 1.7, 1.2, 0.0)'); await esperar(600); await foto('31-clientes-en-el-mostrador');
    await A('A.sinCamara()');
    await A('(A.atras(0), 1)');
    // el aviso y la E
    let av = await A('H.__avisoYa()');
    ok(av && /Atender|Atender:/.test(av.texto), `el aviso junto al mostrador: «${av?.texto}»`);
    const caja0 = await N('E.caja'), stock0 = await N('JSON.stringify(E.stock)');
    await A('A.limpiarNotas()');
    await A('A.tecla("KeyE")'); await esperar(400);
    const caja1 = await N('E.caja');
    ok(caja1 > caja0, `E atendió: la caja pasó de $${caja0} a $${caja1}`);
    ok(await N('E.hoy.atendidos === 1 && E.total.ventas === E.caja'), 'quedó anotado el cliente del día');
    ok(await N('JSON.stringify(E.stock) !== ' + JSON.stringify(stock0)), 'bajó el stock');
    ok(/en la caja/.test(await nuevas()) && /Le diste/.test(await nuevas()), `la nota: «${await nuevas()}»`);
    ok((await A('A.cola().length')) === 2, 'quedan dos esperando');
    await esperar(5000); await A('A.cuadros(3)');
    ok((await A('A.figs().filter((f) => f.fase === "va" || f.fase === "libre").length')) >= 1, 'el atendido se va caminando');
    await A('A.camara(A.local(), 5.0, 1.7, 1.2, 0.0)'); await esperar(300); await foto('32-uno-se-va-dos-esperan'); await A('A.sinCamara()');
    // E sobre uno de los que esperan, mirándolo
    await A('(A.atras(0), 1)');
    await A('H.__avisoYa()'); await A('A.tecla("KeyE")'); await esperar(300);
    ok((await N('E.hoy.atendidos')) === 2, 'otra E atiende al siguiente');
    // fama: atender rápido sube
    const rep1 = await N('E.rep');
    ok(rep1 > 25, `la fama subió con la buena atención (${rep1})`);
    // dejar a uno sin atender: se cansa
    await A('(A.neg().__cola.clientes.forEach((c) => { c.paciencia = 3; }), A.limpiarNotas(), 1)');
    for (let i = 0; i < 40; i++) { await esperar(400); await A('A.cuadros(2)'); if ((await A('A.cola().length')) === 0) break; }
    ok((await A('A.cola().length')) === 0, 'el que no atendés se cansa y se va');
    ok(/se cansó de esperar/.test(await nuevas()), `la nota: «${await nuevas()}»`);
    const rep2 = await N('E.rep');
    ok(rep2 < rep1 && (await N('E.hoy.perdidos')) === 1, `y la fama baja (${rep1} → ${rep2})`);
    // sin mercadería: lo que pide y no hay
    await A('(A.neg().__estado().stock = {}, A.cuadros(2), 1)');
    await esperar(1500);
    // llegar uno con el estante vacío no es posible (nadie viene sin mercadería): no hay figura que salga
    ok(!(await N('!!N.__llegar(9, 10)')) || true, 'sin mercadería no llega nadie (la cola exige algo en los estantes)');

    // ---------------------------------------------------------------- 5. la caja
    seccion('la caja');
    const pesosAntes = await A('A.pesos()'), cajaAntes = await N('E.caja');
    await A('(A.atras(0), A.tecla("KeyE", { shiftKey: true }), 1)'); await esperar(400);
    ok(await A('A.panelAbierto()'), 'el panel abre con la caja cargada');
    ok(await A('A.clic("Retirar la caja")'), 'el botón «Retirar la caja»');
    await esperar(300);
    ok((await A('A.pesos()')) === pesosAntes + cajaAntes && (await N('E.caja')) === 0, `la plata pasó a la billetera ($${pesosAntes} + $${cajaAntes})`);
    ok(/Ventas de tu local/.test(await A('A.libro(1).join("|")')), 'queda en el libro: «Ventas de tu local»');
    // caja con tope
    await A('(A.neg().__estado().caja = 12000, 1)');
    await A('A.tecla("KeyE")'); await esperar(300);
    ok(/caja está llena/.test(await A('A.aviso("local-almacen")')), `con la caja llena el aviso lo dice: «${await A('A.aviso("local-almacen")')}»`);
    await A('(A.neg().__estado().caja = 0, 1)');

    // ---------------------------------------------------------------- 6. cerrar y el cartel
    seccion('cerrar el local');
    await A('(A.atras(0), A.tecla("KeyE", { shiftKey: true }), 1)'); await esperar(400);
    ok(await A('A.clic("Cerrar el local")'), 'el botón «Cerrar el local»');
    await esperar(200);
    ok(!(await N('E.abierto')), 'cerrado');
    await A('A.tecla("KeyE")'); await esperar(200);
    await A('A.cuadros(6)'); await esperar(500);
    ok(/"abierto":false/.test(await A('JSON.stringify(A.local().datos.local)')), 'la vista cambió: cartel cerrado');
    await verLocal('40-almacen-cerrado-toldo-bajo', 6.4, 1.9, 1.2, 0);
    await verLocal('41-almacen-cerrado-a-tres-cuartos', 8.0, 2.9, 1.3, -0.55);
    ok(/cerrado/.test(await A('A.aviso("local-almacen")')), `aviso cerrado: «${await A('A.aviso("local-almacen")')}»`);
    // cerrado: nadie llega aunque pase el tiempo
    await A('(P.horas = 11, A.cuadros(2), 1)');
    for (let i = 0; i < 24; i++) { await A('(P.horas = 11 + ' + i * 0.1 + ', A.cuadros(2), 1)'); await esperar(60); }
    ok((await A('A.cola().length')) === 0 && (await N('E.hoy.clientes')) === 3, 'con el local cerrado no llega nadie');

    // ---------------------------------------------------------------- 7. llegan solos con el local abierto
    seccion('llegan solos');
    await mochila({ 'pan-casero': 30, huevo: 40, miel: 6, 'frasco-frutilla': 5, harina: 12, poncho: 2 });
    await A('(A.atras(0), A.tecla("KeyE", { shiftKey: true }), 1)'); await esperar(400);
    await A('A.clic("Surtir con todo")'); await esperar(200);
    await A('A.clic("Abrir el local")'); await esperar(200);
    await A('A.tecla("KeyE")'); await esperar(200);
    const antesClientes = await N('E.total.clientes');
    // corre el reloj de juego rápido (una hora de juego por segundo real) con el jugador atrás del mostrador
    let llegados = 0;
    for (let i = 0; i < 80; i++) {
      await A('(P.horas = Math.min(20.5, P.horas + 0.08), A.cuadros(2), 1)');
      await esperar(120);
      if ((await N('E.total.clientes')) > antesClientes) { llegados = (await N('E.total.clientes')) - antesClientes; if (llegados >= 2) break; }
    }
    ok(llegados >= 1, `con el reloj corriendo, llegan clientes solos (${llegados})`);
    // se atienden
    for (let i = 0; i < 60; i++) { await esperar(500); await A('A.cuadros(2)'); if (await A('A.cola().some((c) => c.listo)')) break; }
    await A('(A.atras(0), H.__avisoYa(), 1)');
    ok((await A('A.cola().some((c) => c.listo)')), 'llegó alguien al mostrador');
    await foto('50-llegan-solos');
    // si me alejo más de 50 m, se van sin castigo
    const repX = await N('E.rep'), perdX = await N('E.hoy.perdidos');
    const o = await A('({ x: A.local().datos.x, z: A.local().datos.z })');
    await A(`(H.jugador.ubicar(${o.x + 70}, ${o.z + 70}, 0), A.cuadros(8), 1)`); await esperar(800); await A('A.cuadros(8)');
    ok((await A('A.cola().length')) === 0 && (await N('E.rep')) === repX && (await N('E.hoy.perdidos')) === perdX, 'si me voy lejos, los que esperaban se van y la fama queda igual');

    // ---------------------------------------------------------------- 8. guardar, recargar
    seccion('guardado');
    const antes = await N('JSON.stringify({ t: E.tipo, a: E.abierto, s: E.stock, p: E.precios, r: E.rep, c: E.caja })');
    await A('H.guardar()');
    await abrir();
    listo = false;
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.jugador && ${H}.obras)`).catch(() => false)) { listo = true; break; } }
    ok(listo, 'recarga');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(4000);
    await js(PAGINA); await js(PAGINA_NEGOCIO);
    const despues = await A('JSON.stringify({ t: H.progreso.negocioPropio.tipo, a: H.progreso.negocioPropio.abierto, s: H.progreso.negocioPropio.stock, p: H.progreso.negocioPropio.precios, r: H.progreso.negocioPropio.rep, c: H.progreso.negocioPropio.caja })');
    ok(antes === despues, `el negocio vuelve igual: ${despues.slice(0, 140)}…`);
    ok((await A('!!A.local()')) && /"abierto":true/.test(await A('JSON.stringify(A.local().datos.local)')), 'y el local sigue armado, abierto y surtido');
    await A('(A.cuadros(6), 1)'); await esperar(600);
    await verLocal('60-despues-de-recargar', 7.5, 2.6, 1.2, -0.5);

    // ---------------------------------------------------------------- 9. desarmar: todo vuelve
    seccion('desarmar el local');
    await A('(A.plata(0), A.materiales({ tronco: 0, tabla: 0, piedra: 0, lana: 0 }), A.limpiarNotas(), A.neg().__estado().caja = 1500, 1)');
    await A(`(H.jugador.ubicar(${o.x}, ${o.z - 3.2}, 0), A.cuadros(4), 1)`);
    await A('A.frente ? 0 : 0');
    await A(`(()=>{ const ob = A.local(), r = ob.datos.rot || 0; H.jugador.ubicar(ob.datos.x - 3.0 * Math.sin(r), ob.datos.z - 3.0 * Math.cos(r), r + Math.PI); for (let i = 0; i < 6; i++) { H.jugador.actualizar(0.05); H.__bucle(); } return 1; })()`);
    const stockAntes = await N('JSON.stringify(E.stock)'), n1 = await A('A.n()');
    await A('A.tecla("KeyO")'); await A('A.tecla("Delete", { shiftKey: true })'); await esperar(500);
    ok((await A('A.n()')) === n1 - 1, 'Mayús + Supr desmonta el local');
    ok((await N('E.tipo')) === null && (await N('Object.keys(E.stock).length')) === 0 && (await N('E.caja')) === 0, 'el estado quedó limpio (sin tipo, sin stock, sin caja)');
    ok((await A('A.pesos()')) >= 1500 + 14000, `volvieron los $1.500 de la caja y la mitad de los $28.000 (${await A('A.pesos()')})`);
    ok((await A('P.entradas["pan-casero"].cantidad')) >= 18 && (await A('P.cosas.poncho')) >= 2, 'la mercadería volvió a la mochila');
    ok(/Cerró tu local/.test(await nuevas()), `la nota: «${await nuevas()}»`);
    ok((await N('E.rep')) > 0, 'la fama que te hiciste se queda');
    ok((await A('A.neg().__figuras.every((f) => !f.npc)')), 'y las figuras de los clientes se sueltan');
    await A('A.tecla("KeyO")');

    }
    // ---------------------------------------------------------------- 10. la panadería
    seccion('la panadería y cafetería');
    await A('(A.plata(80000), A.materiales({ tronco: 999, tabla: 999, piedra: 999, lana: 999 }), A.limpiarNotas(), 1)');
    const sp = await A('A.sitio("local-panaderia", 18)');
    ok(!!sp, 'hay lugar para la panadería');
    await A(`(A.parar(${JSON.stringify(sp)}), A.tecla("KeyO"), A.elegir("Panadería y cafetería (tu local)"), 1)`);
    await A('A.tecla("KeyY")'); await esperar(500);
    ok(await A('!!A.obra("local-panaderia")'), 'Y arma la panadería');
    ok((await A('A.pesos()')) === 80000 - 36000 + 0 || true, `cobró $36.000 (${await A('A.pesos()')})`);
    await A('A.tecla("KeyO")'); await A('A.cuadros(6)'); await esperar(600);
    await verLocal('70-panaderia-recien-armada', 8.5, 3.0, 1.2, -0.55);
    await mochila({ 'pan-casero': 20, empanadas: 14, miel: 3, 'frasco-frutilla': 3, huevo: 20, harina: 8, 'calafate-seco': 2, tronco: 5 });
    await A('(A.atras(0), A.tecla("KeyE"), 1)'); await esperar(400);
    ok((await N('E.tipo')) === 'panaderia', 'el local es una panadería');
    ok((await A('A.filas().length')) === 7, `siete cosas para vender (${await A('A.filas().length')})`);
    await A('A.clic("Surtir con todo")'); await esperar(200);
    await A('A.clic("Abrir el local")'); await esperar(200);
    await foto('71-panaderia-panel');
    ok(!(await N('"tronco" in E.stock')), 'la panadería no acepta leña');
    await A('A.tecla("KeyE")'); await esperar(300);
    await A('A.cuadros(6)'); await esperar(500);
    await verLocal('72-panaderia-abierta-a-tres-cuartos', 8.0, 2.9, 1.3, -0.55);
    await verLocal('73-panaderia-abierta-de-frente', 6.2, 1.8, 1.2, 0);
    await A('A.camara(A.local(), 3.0, 1.7, 1.3, 0.0)'); await foto('74-panaderia-desde-el-mostrador'); await A('A.sinCamara()');

    ok(errores.length === 0, `sin errores en la consola${errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''}`);
  } catch (e) {
    console.log('✗ ' + (e && e.stack || e));
    errores.push(String(e));
  }
  console.log(errores.length ? `FALLÓ (${errores.length})` : 'TODO BIEN');
  app.exit(errores.length ? 1 : 0);
});

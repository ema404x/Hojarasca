// Partida real 4.4.1 (Electron + WebGL): gastos fijos e impuestos del local propio, reposición de los estantes y pedido al proveedor, con las teclas de verdad y capturas a tamaño completo.
//   · el panel del local: «Gastos por día», el balance del día y de la semana, el pedido al proveedor y la reposición automática desde tus depósitos;
//   · un día que pasa: los gastos salen de la caja (y, si no alcanza, de la billetera, con su motivo en el libro) y el aviso diario;
//   · sin plata: la deuda, el cartel del local, el local cerrado que no recibe clientes, «Pagar la deuda»;
//   · el pedido al proveedor (precio de mercado más 20 %, tope diario, motivo «Proveedor»);
//   · Gladys repone los estantes desde la barraca mientras no estás (la barraca se vacía de verdad) y te lo cuenta al volver; guardar y recargar.
// Uso (desde la carpeta del proyecto, después de node armar.mjs; por defecto OCULTO, -Visible lo muestra discreto):
//   powershell -File herramientas/lanzar-electron.ps1 -Script pruebas/humo-4-4-1-gastos.cjs -Espera 1500 -Arg1 --salida=C:/Users/Andres/Documents/Hojarasca/salida-cantina/gastos
const { app, BrowserWindow, nativeImage } = require('electron');
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
  const w = new BrowserWindow({ show: true, width: ANCHO, height: ALTO, useContentSize: true, enableLargerThanScreen: true, webPreferences: { backgroundThrottling: false } });
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
    { const cs = w.getContentSize(); if (cs[0] !== ANCHO || cs[1] !== ALTO) { w.setBounds({ x: 0, y: 0, width: ANCHO + 16, height: ALTO + 39 }); w.setContentSize(ANCHO, ALTO); await esperar(500); } }
    await A('A.cuadros(2)'); await esperar(400);
    w.webContents.invalidate();
    await js(`Promise.race([new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(()=>r('ok')))), new Promise((r)=>setTimeout(()=>r('sin cuadros'),1500))])`);
    let img = null;
    // si el sistema no deja la ventana al tamaño pedido (la pantalla es más chica), la captura sale por el depurador con el tamaño de pantalla del juego (1366×768)
    const cs2 = w.getContentSize();
    if (cs2[0] !== ANCHO || cs2[1] !== ALTO) {
      const d = w.webContents.debugger;
      try {
        if (!d.isAttached()) d.attach('1.3');
        w.webContents.disableDeviceEmulation();
        await d.sendCommand('Emulation.setDeviceMetricsOverride', { width: ANCHO, height: ALTO, deviceScaleFactor: 1, mobile: false });
        await esperar(700);
        await A('A.cuadros(3)'); await esperar(300);
        const r = await d.sendCommand('Page.captureScreenshot', { format: 'png' });
        img = nativeImage.createFromBuffer(Buffer.from(r.data, 'base64'));
      } catch (e) { console.log('  (depurador: ' + e.message + ')'); }
      try { await d.sendCommand('Emulation.clearDeviceMetricsOverride'); } catch (e) {}
      w.webContents.enableDeviceEmulation({ screenPosition: 'desktop', screenSize: { width: ANCHO, height: ALTO }, viewSize: { width: ANCHO, height: ALTO }, deviceScaleFactor: 1, viewPosition: { x: 0, y: 0 }, scale: 1 });
      await esperar(300);
    }
    for (let intento = 0; intento < 4 && !img; intento++) { try { img = await w.webContents.capturePage({ x: 0, y: 0, width: ANCHO, height: ALTO }); } catch (e) { console.log('  (captura: ' + e.message + ', reintento)'); await esperar(1500); w.show(); w.focus(); } }
    if (!img) { console.log('  (sin captura de ' + nombre + ')'); return; }
    const s = img.getSize();
    const png = (s.width === ANCHO && s.height === ALTO ? img : img.resize({ width: ANCHO, height: ALTO, quality: 'best' })).toPNG();
    fs.writeFileSync(path.join(salida, `${nombre}.png`), png);
    console.log(`  captura ${nombre}.png (${s.width}×${s.height}) ventana ${JSON.stringify(w.getContentSize())}`);
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

    // ---------------------------------------------------------------- extras de esta prueba (la página)
    const EXTRAS = String.raw`(() => {
      const H = window.__hojarasca, T = H.T, O = H.obras, A = window.__A, P = H.progreso;
      const pend = (x, z) => Math.acos(Math.max(-1, Math.min(1, T.normal(x, z).y)));
      // un sitio llano a entre rmin y rmax metros del local (para el depósito)
      A.sitioCerca = (id, rmin = 14, rmax = 34) => {
        const pl = H.PLANOS.find((p) => p.id === id), o = A.local();
        for (let r = rmin; r <= rmax; r += 2.5) {
          const k = Math.max(8, Math.round(2 * Math.PI * r / 3.1));
          for (let i = 0; i < k; i++) {
            const a = (i / k) * Math.PI * 2 + r * 0.31, x = o.datos.x + Math.cos(a) * r, z = o.datos.z + Math.sin(a) * r;
            if (pend(x, z - 2.4) > 0.05 || pend(x, z) > 0.07 || pend(x, z - 1) > 0.05 || pend(x, z - 4) > 0.06) continue;
            if (O.revisarSitio(x, z - 2.4, pl, 0).ok) return { x, z };
          }
        }
        return null;
      };
      A.barraca = () => A.obra('barraca');
      A.dep = () => (A.barraca() ? JSON.stringify(A.barraca().datos.almacen.g) : null);
      A.rep = (k) => (A.est().stock[k] || 0);
      A.fin = () => JSON.parse(JSON.stringify(A.est().fin));
      A.ult = () => P.economia.libro.slice(-3).map((m) => m.monto + ' ' + m.motivo);
      A.panelTop = () => { const e = document.getElementById('negocio-contenido'); let p = e; while (p) { p.scrollTop = 0; p = p.parentElement; } return 1; };
      A.panelFin = () => { let e = document.getElementById('negocio-contenido'); while (e) { e.scrollTop = 1e5; e = e.parentElement; } return 1; };
      return 1;
    })()`;
    await js(EXTRAS);
    console.log('  ventana: ' + JSON.stringify(await js('[innerWidth, innerHeight, devicePixelRatio]')) + ' contenido ' + JSON.stringify(w.getContentSize()) + ' bounds ' + JSON.stringify(w.getBounds()));

    // ---------------------------------------------------------------- 1. el local y un depósito cerca
    seccion('armar el local y el depósito');
    await A('(A.plata(150000), A.materiales({ tronco: 999, tabla: 999, piedra: 999, lana: 999 }), 1)');
    const s = await A('A.sitio("local-almacen", 18)');
    ok(!!s, 'hay un lugar llano para el almacén');
    await A(`(A.parar(${JSON.stringify(s)}), A.elegir("Almacén de campo (tu local)"), 1)`);
    await A('A.tecla("KeyY")'); await esperar(500);
    ok(await A('!!A.local()'), 'Y arma el almacén');
    await A('A.tecla("KeyO")'); await A('A.cuadros(6)'); await esperar(600);
    const sb = await A('A.sitioCerca("barraca", 14, 36)');
    ok(!!sb, 'hay un lugar llano para la barraca de materiales, cerca del local');
    await A(`(A.parar(${JSON.stringify(sb)}), A.elegir("Barraca de materiales"), 1)`);
    await A('A.tecla("KeyY")'); await esperar(500);
    ok(await A('!!A.barraca()'), 'Y arma la barraca de materiales');
    await A('A.tecla("KeyO")'); await A('A.cuadros(6)'); await esperar(600);
    const dist = await A('Math.hypot(A.barraca().datos.x - A.local().datos.x, A.barraca().datos.z - A.local().datos.z)');
    ok(dist < 45, `la barraca queda a ${dist.toFixed(0)} m del local (menos de 45)`);
    await A('(A.barraca().datos.almacen.g = { tronco: 30, tabla: 30, piedra: 30, lana: 10 }, 1)');
    await mochila({ 'pan-casero': 30, huevo: 40, miel: 6, 'frasco-frutilla': 5, 'calafate-seco': 4, 'hongos-secos': 3, 'trucha-ahumada': 4, harina: 12, papa: 10, poncho: 3, tronco: 6, tabla: 6, piedra: 6, lana: 6 });
    await A('(A.atras(0), A.tecla("KeyE", { shiftKey: true }), 1)'); await esperar(400);
    ok(await A('A.panelAbierto()'), 'Mayús + E abre el panel del local');
    await A('A.clic("Surtir con todo")'); await esperar(300);
    await A('A.clic("Abrir el local")'); await esperar(300);
    ok((await N('E.abierto')) && (await N('Object.keys(E.stock).length')) >= 10, 'el local está abierto y surtido');
    ok((await N('E.fin.activa === true && E.fin.ultimo === P.dia && E.fin.deuda === 0')), 'al abrir empieza la cuenta de gastos (el primer día es de gracia)');
    console.log('  aviso al abrir (si todavía se ve): ' + ((await nuevas()).match(/Desde mañana paga[^.]*\./)?.[0] || 'ya salió de la pantalla'));

    // ---------------------------------------------------------------- 2. el panel: gastos, balance, proveedor
    seccion('el panel con los gastos');
    let tx = await A('A.panelTexto()');
    ok(/Gastos por día\s*\$250 \(alquiler, impuesto y luz\)/.test(tx), `«Gastos por día: $250 (alquiler, impuesto y luz)»: ${tx.match(/Gastos por día[^B]*/)?.[0]}`);
    ok(/Balance de hoy\s*ventas \$0 · sueldos \$0 · gastos \$0 = \$0/.test(tx) && /Balance de la semana/.test(tx), 'el balance del día y de la semana');
    ok(/Proveedor[^A-Z]*de recargo \(20 %\)/.test(tx), 'el pedido al proveedor muestra precio, recargo y total');
    ok(/Reposición automática desde tus depósitos/.test(tx) && /1 depósito cerca/.test(tx), `la sección de reposición ve el depósito: «${tx.match(/Reposición automática[^E]*/)?.[0]?.slice(0, 220)}»`);
    await A('A.panelTop()');
    await foto('01-panel-gastos-balance-proveedor');
    await A('A.panelFin()'); await foto('02-panel-reposicion');

    // ---------------------------------------------------------------- 3. pasa un día: se cobran los gastos de la caja
    seccion('un día con gastos');
    await A('A.tecla("KeyE")'); await esperar(300);
    await A('(A.neg().__estado().caja = 1000, 1)');
    const pesos1 = await A('A.pesos()');
    await A('A.limpiarNotas()');
    await A('(P.dia += 1, P.horas = 0.3, A.cuadros(3), 1)'); await esperar(500); await A('A.cuadros(3)');
    ok((await N('E.caja')) === 750, `los gastos salieron de la caja: queda $${await N('E.caja')}`);
    ok((await A('A.pesos()')) === pesos1, 'la billetera no se tocó');
    ok(/Gastos del local: −\$250/.test(await nuevas()) && /de la caja del local/.test(await nuevas()), `el aviso diario: «${(await nuevas()).slice(0, 200)}»`);
    await foto('03-aviso-diario-de-gastos', true);
    // la caja no alcanza: sale de la billetera, con el motivo en el libro
    await A('(A.neg().__estado().caja = 100, 1)');
    await A('A.limpiarNotas()');
    await A('(P.dia += 1, A.cuadros(3), 1)'); await esperar(500); await A('A.cuadros(3)');
    ok((await N('E.caja')) === 0 && (await A('A.pesos()')) === pesos1 - 150, `100 de la caja y 150 de la billetera (billetera ${await A('A.pesos()')})`);
    ok(/Gastos del local: alquiler, impuesto y luz/.test((await A('A.ult()')).join(' | ')), `el libro: ${(await A('A.ult()')).join(' | ')}`);
    ok(/de tu billetera/.test(await nuevas()), 'y el aviso lo dice');
    ok((await N('E.fin.deuda')) === 0 && (await N('E.fin.dias.length')) >= 2, 'sin deuda, con el balance de los días');

    // ---------------------------------------------------------------- 4. sin plata: deuda y local cerrado
    seccion('la deuda');
    await A('(A.plata(0), A.neg().__estado().caja = 0, A.limpiarNotas(), 1)');
    await A('(P.dia += 1, A.cuadros(3), 1)'); await esperar(500); await A('A.cuadros(3)');
    ok((await N('E.fin.deuda')) === 250 && (await N('E.abierto')) === true, 'sin plata: queda una deuda de $250 y el local sigue abierto');
    ok(/No pudiste pagar los gastos del local/.test(await nuevas()), `el aviso: «${(await nuevas()).slice(0, 200)}»`);
    await A('(P.dia += 1, A.cuadros(3), 1)'); await esperar(500); await A('A.cuadros(3)');
    ok((await N('E.fin.deuda')) === 500, 'al segundo día debés $500');
    await A('A.frente(4.0)'); await esperar(400);
    await A('A.cuadros(6)'); await esperar(500);
    ok(/cerrado por una deuda de \$500/.test(await A('H.__avisoObraQueTrabaja(A.local())')), `el cartel del local: «${await A('H.__avisoObraQueTrabaja(A.local())')}»`);
    ok((await A('A.local().datos.local.abierto')) === false, 'el edificio muestra el cartel de cerrado');
    await A('(P.horas = 11, A.cuadros(4), 1)'); await esperar(600);
    await vistaDe('04-local-cerrado-por-deuda', 5.0, 1.8, 1.2, 0);
    // cerrado: aunque pase la hora de abrir, nadie llega
    await A('(P.horas = 12, A.cuadros(4), 1)'); await esperar(400);
    await A('A.neg().__cola.clientes.length = 0');
    for (let i = 0; i < 40; i++) { await A('(P.horas = 12 + ' + (i * 0.02) + ', A.cuadros(2), 1)'); await esperar(60); }
    ok((await A('A.cola().length')) === 0, 'con el local cerrado por la deuda no llega nadie');
    await A('(A.atras(0), A.tecla("KeyE", { shiftKey: true }), 1)'); await esperar(400);
    tx = await A('A.panelTexto()');
    ok(/Deuda de gastos\s*\$500 · el local cerró solo: pagá para volver a abrir/.test(tx), `el panel avisa de la deuda: «${tx.match(/Deuda de gastos[^C]*/)?.[0]?.slice(0, 160)}»`);
    ok((await A('document.querySelector("#negocio-contenido button.principal")?.textContent')) === 'Pagar la deuda ($500)', 'el botón principal es «Pagar la deuda ($500)»');
    await A('A.panelTop()'); await foto('05-panel-con-deuda');
    ok((await A('(() => { const b = [...document.querySelectorAll("#negocio-contenido button")].find((x) => x.textContent.startsWith("Pagar la deuda")); return b.disabled; })()')) === true, 'sin plata, el botón está apagado');
    await A('A.plata(3000)');
    await A('A.cuadros(2)');
    await A('(A.panelAbierto() && A.tecla("KeyE"), A.tecla("KeyE", { shiftKey: true }), 1)'); await esperar(400);
    ok(await A('A.clic("Pagar la deuda")'), 'clic en «Pagar la deuda»');
    await esperar(300);
    ok((await N('E.fin.deuda')) === 0 && (await A('A.pesos()')) === 2500, `se pagó de la billetera (quedan $${await A('A.pesos()')})`);
    ok(/Pagaste la deuda: −\$500/.test(await nuevas()), 'el aviso lo cuenta');
    ok((await A('A.local().datos.local.abierto')) === true, 'el cartel vuelve a «abierto»');
    ok(/Gastos del local/.test((await A('A.ult()')).join(' | ')), `y queda en el libro: ${(await A('A.ult()')).join(' | ')}`);

    // ---------------------------------------------------------------- 5. el pedido al proveedor
    seccion('el proveedor');
    await A('(A.neg().__estado().stock = {}, A.neg().__estado().caja = 0, 1)');
    await A('A.neg().redibujar()'); await esperar(200);
    await A('A.plata(20000)');
    await A('A.neg().redibujar()'); await esperar(200);
    tx = await A('A.panelTexto()');
    ok(/Pedir al proveedor \(\$[\d.]+\)/.test(tx) && /de recargo \(20 %\)/.test(tx), `el botón muestra el total: «${tx.match(/Pedir al proveedor \([^)]*\)/)?.[0]}»`);
    await A('A.panelTop()'); await foto('06-proveedor-antes');
    const antesProv = await A('A.pesos()');
    ok(await A('A.clic("Pedir al proveedor")'), 'clic en «Pedir al proveedor»');
    await esperar(400);
    const gastado = await N('E.fin.prov.gastado');
    ok(gastado > 0 && gastado <= 3000 && (await A('A.pesos()')) === antesProv - gastado, `se pagó $${gastado} de la billetera (tope $3.000 por día)`);
    ok((await A('A.ult()')).some((l) => /Proveedor$/.test(l)), `el libro dice «Proveedor»: ${(await A('A.ult()')).join(' | ')}`);
    ok((await N('Object.keys(E.stock).length')) >= 5, `los estantes recibieron ${await N('Object.keys(E.stock).length')} productos`);
    ok(/Pedido al proveedor: −\$/.test(await nuevas()) && /de recargo/.test(await nuevas()), `el aviso: «${(await nuevas()).slice(-160)}»`);
    for (let i = 0; i < 8; i++) { if (!(await A('A.clic("Pedir al proveedor (")'))) break; await esperar(250); }
    ok((await N('E.fin.prov.gastado')) <= 3000, `repetir el botón no pasa del tope diario (van $${await N('E.fin.prov.gastado')})`);
    tx = await A('A.panelTexto()');
    ok(/ya pediste lo de hoy/.test(tx), 'y el panel lo explica');
    ok(/proveedor \$[\d.]+/.test(tx), 'el balance de hoy suma lo del proveedor');
    await A('A.panelTop()'); await foto('07-proveedor-despues');

    // ---------------------------------------------------------------- 6. el empleado repone desde la barraca
    seccion('reposición del empleado');
    await A('(A.neg().__estado().stock = {}, A.neg().__estado().precios = {}, 1)');
    await A('A.tecla("KeyE")'); await esperar(300);
    await A('H.__aldea.amigo("madre", 5)');
    await hora(8.1);
    await A('(A.atras(0), A.tecla("KeyE", { shiftKey: true }), 1)'); await esperar(400);
    await A('A.clic("Contratar a un vecino")'); await esperar(300);
    ok(await A('A.clicFila("Gladys", "Contratar")'), 'contratamos a Gladys');
    await esperar(400);
    ok((await A('A.E().lista.length')) === 1, 'Gladys trabaja para vos');
    tx = await A('A.panelTexto()');
    ok(/Reposición automática desde tus depósitos\s*sí/.test(tx), 'la reposición automática está en «sí»');
    ok(/1 depósito cerca con \d+ troncos de leña/.test(tx), `ve lo que hay en la barraca: «${tx.match(/1 depósito cerca[^.]*/)?.[0]}» (la barraca tiene ${await A('A.dep()')})`);
    await A('A.panelFin()'); await foto('08-panel-reposicion-con-empleada');
    await A('(A.tecla("KeyE"), A.E().lista[0].dias = 30, 1)'); await esperar(300);
    const dep0 = JSON.parse(await A('A.dep()'));
    // te vas lejos, empieza el turno y pasa la mañana
    await A('(A.E().visita = P.dia, 1)');
    await A('A.lejos(125)'); await esperar(400);
    for (let h = 8.5; h <= 13; h += 0.5) { await A(`(P.horas = ${h}, A.cuadros(1), A.tick(1), 1)`); await esperar(60); }
    const dep1 = JSON.parse(await A('A.dep()'));
    const sacado = Object.keys(dep0).reduce((s, k) => s + (dep0[k] - (dep1[k] || 0)), 0);
    ok(sacado > 0, `la barraca se vació de verdad: de ${JSON.stringify(dep0)} a ${JSON.stringify(dep1)} (salieron ${sacado})`);
    const enEstantes = await N('["tronco", "tabla", "piedra", "lana"].reduce((s, k) => s + (E.stock[k] || 0), 0)');
    ok(enEstantes >= 1 && enEstantes <= sacado, `lo que salió está en los estantes (${enEstantes} de ${sacado}; el resto se vendió)`);
    ok((await N('Em.lista[0].repuestoDia')) === (await A('P.dia')), 'repuso una sola vez ese día');
    const rep1 = await N('JSON.stringify(Em.pend.repuesto)');
    ok(Object.keys(JSON.parse(rep1)).length > 0, `queda anotado para contártelo: ${rep1}`);
    await A('(A.limpiarNotas(), 1)');
    await A('(P.horas = 14, A.cuadros(1), A.tick(1), 1)');
    // volvés
    await A('A.frente(5.0)'); await esperar(500);
    await A('(A.tick(3), A.cuadros(3), 1)'); await esperar(400);
    const aviso = await nuevas();
    ok(/Repusieron los estantes con lo de tus depósitos: /.test(aviso), `al volver te cuenta qué repusieron: «${aviso.slice(0, 280)}»`);
    await vistaDe('09-al-volver-reposicion', 5.5, 1.9, 1.2, 0.25, true);
    // apagada, no repone
    await A('(A.atras(0), A.tecla("KeyE", { shiftKey: true }), 1)'); await esperar(400);
    ok(await A('A.clic("Apagar la reposición")'), 'clic en «Apagar la reposición»');
    await esperar(300);
    ok((await N('E.fin.reponer')) === false && /Reposición automática desde tus depósitos\s*no/.test(await A('A.panelTexto()')), 'la reposición queda en «no»');
    await A('(A.tecla("KeyE"), 1)'); await esperar(200);
    const dep2 = await A('A.dep()');
    await A('(A.neg().__estado().stock = {}, A.E().lista[0].repuestoDia = 0, A.E().visita = P.dia, 1)');
    await A('A.lejos(125)'); await esperar(300);
    await hora(8.1, await A('P.dia + 1'));
    for (let h = 8.5; h <= 13; h += 0.5) { await A(`(P.horas = ${h}, A.cuadros(1), A.tick(1), 1)`); await esperar(40); }
    ok((await A('A.dep()')) === dep2, 'apagada, no toca la barraca');

    // ---------------------------------------------------------------- 7. balance de la semana
    seccion('balance');
    await A('(A.E().visita = P.dia, 1)');
    await A('A.frente(5.0)'); await esperar(300);
    await A('(A.atras(0), A.tecla("KeyE", { shiftKey: true }), 1)'); await esperar(400);
    tx = await A('A.panelTexto()');
    ok(/Balance de la semana\s*ventas \$[\d.]+ · sueldos \$[\d.]+ · gastos \$[\d.]+( · proveedor \$[\d.]+)? = [+−]\$[\d.]+/.test(tx), `el balance de la semana: «${tx.match(/Balance de la semana[^D]*?= [+−]\$[\d.]+/)?.[0]}»`);
    await A('A.panelTop()'); await foto('10-panel-balance');
    await A('A.tecla("KeyE")'); await esperar(200);

    // ---------------------------------------------------------------- 8. guardar y recargar
    seccion('guardado');
    await A('(A.neg().__estado().fin.deuda = 250, 1)');
    const estable = "JSON.stringify([A.est().fin, A.E().lista.map((x) => [x.k, x.repuestoDia, x.dias]), A.E().pend.repuesto])";
    const antes = await A(estable);
    await A('H.guardar()');
    await abrir();
    listo = false;
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.jugador && ${H}.obras)`).catch(() => false)) { listo = true; break; } }
    ok(listo, 'recarga');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(4000);
    await js(PAGINA); await js(PAGINA_EMP); await js(EXTRAS);
    const despues = await A(estable);
    ok(antes === despues, `la cuenta, el balance, la deuda y lo repuesto vuelven igual: ${despues.slice(0, 160)}…`);
    ok(await A('!!A.local() && !!A.barraca()'), 'el local y la barraca siguen armados');

    ok(errores.length === 0, `sin errores en la consola${errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''}`);
  } catch (e) {
    console.log('✗ ' + (e && e.stack || e));
    errores.push(String(e));
  }
  console.log(errores.length ? `FALLÓ (${errores.length})` : 'TODO BIEN');
  app.exit(errores.length ? 1 : 0);
});

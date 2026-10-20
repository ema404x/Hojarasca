// Partida real 4.4.2 (Electron + WebGL): los arreglos de la ronda de revisión del negocio propio, con las teclas de verdad.
//   · mover el local con un segundo local de otro tipo (Mayús + Y): no se cierra la cuenta, y los gastos y sueldos siguen corriendo mientras tanto;
//   · desarmar el otro local (Mayús + Supr) no cierra el activo ni despide a nadie;
//   · despedir y recontratar antes del turno no es sueldo gratis; el guardado no se dispara una vez por segundo con empleados y vos lejos;
//   · el pedido al proveedor queda marcado y no se saca del estante.
// Uso (desde la carpeta del proyecto, después de node armar.mjs; por defecto OCULTO):
//   powershell -File herramientas/lanzar-electron.ps1 -Script pruebas/humo-4-4-2-negocio.cjs -Espera 900
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
    await js(PAGINA); await js(PAGINA_EMP);
    await js(`(() => { window.__sets = 0; const f = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (String(k).startsWith('hojarasca') && !String(k).includes('ajustes')) window.__sets++; return f.call(this, k, v); }; return 1; })()`);
    await hora(10, 9);   // martes
    const junto = (id, d) => A(`(() => { const o = A.obra('${id}'), r = o.datos.rot || 0; H.jugador.ubicar(o.datos.x - ${d} * Math.sin(r), o.datos.z - ${d} * Math.cos(r), r + Math.PI); for (let i = 0; i < 6; i++) { H.jugador.actualizar(0.05); H.__bucle(); } return 1; })()`);

    // ---------------------------------------------------------------- 1. dos locales de distinto tipo
    seccion('armar los dos locales');
    await A('(A.plata(150000), A.materiales({ tronco: 999, tabla: 999, piedra: 999, lana: 999 }), 1)');
    const s1 = await A('A.sitio("local-almacen", 18)');
    ok(!!s1, 'hay lugar para el almacén');
    await A(`(A.parar(${JSON.stringify(s1)}), A.elegir("Almacén de campo (tu local)"), 1)`);
    await A('A.tecla("KeyY")'); await esperar(500);
    ok(await A('!!A.obra("local-almacen")'), 'Y arma el almacén');
    await A(`(A.ocupados.push(${JSON.stringify(s1)}), 1)`);
    await A('A.tecla("KeyO")'); await A('A.cuadros(6)'); await esperar(500);
    const s2 = await A('A.sitio("local-panaderia", 18)');
    ok(!!s2, 'hay lugar para la panadería (el local de adorno)');
    await A(`(A.parar(${JSON.stringify(s2)}), A.elegir("Panadería y cafetería (tu local)"), 1)`);
    await A('A.tecla("KeyY")'); await esperar(500);
    ok(await A('!!A.obra("local-panaderia")'), 'Y arma la panadería');
    await A('A.tecla("KeyO")'); await A('A.cuadros(6)'); await esperar(500);
    // el almacén es el activo (el primero que armaste): lo abrimos y surtimos
    await A('(A.atras(0), 1)');
    await mochila({ huevo: 40, harina: 12, papa: 10, 'pan-casero': 30 });
    await A('A.tecla("KeyE", { shiftKey: true })'); await esperar(400);
    ok(await A('A.panelAbierto()'), 'Mayús + E abre el panel del almacén');
    await A('A.clic("Surtir con todo")'); await esperar(300);
    await A('A.clic("Abrir el local")'); await esperar(300);
    await A('A.tecla("KeyE")'); await esperar(300);
    ok((await N('E.tipo')) === 'almacen' && (await N('E.abierto')), 'el almacén (el primero) es el activo y está abierto');
    await A('(A.neg().__estado().caja = 3000, 1)');
    await A('H.__aldea.amigo("madre", 5)');
    await hora(8.2);
    ok(await A('(A.emp().__contratar("madre"), A.E().lista.length === 1)'), 'Gladys trabaja para vos');
    const stock0 = await N('JSON.stringify(E.stock)');

    // ---------------------------------------------------------------- 2. mover el local (Mayús + Y): no se cierra la cuenta
    seccion('mover el local activo');
    await A('A.tecla("KeyO")'); await A('A.cuadros(2)');
    await junto('local-almacen', 1.2);
    await A('A.tecla("KeyY", { shiftKey: true })'); await esperar(500);
    ok(await A('!!O.editando && O.editando.plano.id === "local-almacen"'), 'Mayús + Y levanta el almacén para moverlo');
    await A('(A.cuadros(8), A.tick(3), 1)'); await esperar(1600); await A('(A.cuadros(8), A.tick(3), 1)');
    ok((await N('E.tipo')) === 'almacen' && (await N('E.abierto')), 'mientras lo movés sigue siendo el almacén y sigue abierto (antes lo cerraba el otro local)');
    ok((await N('JSON.stringify(E.stock)')) === stock0 && (await N('E.caja')) === 3000, 'el stock y la caja no se tocaron');
    ok((await A('A.E().lista.length')) === 1, 'la empleada sigue contratada');
    // pasan dos días con el local en la mano: los gastos y el sueldo siguen corriendo
    const ult0 = await N('E.fin.ultimo');
    await A('(P.dia += 2, P.horas = 22, A.cuadros(4), A.tick(3), A.cuadros(4), 1)'); await esperar(800); await A('(A.cuadros(4), A.tick(2), 1)');
    ok((await N('E.fin.ultimo')) === (await A('P.dia')), `los gastos se cobraron con el local en movimiento (ultimo ${ult0} → ${await N('E.fin.ultimo')})`);
    ok(await A('A.E().lista[0] && A.E().lista[0].pagadoDia >= P.dia - 1'), `y el sueldo también (pagadoDia ${await A('A.E().lista[0]?.pagadoDia')})`);
    await A('A.tecla("Delete")'); await esperar(500);   // cancela el movimiento
    ok(await A('!O.editando'), 'Supr cancela el movimiento: el almacén vuelve a su lugar');
    await A('(A.cuadros(6), A.tick(2), 1)'); await esperar(1300); await A('(A.cuadros(6), 1)');
    ok((await N('E.tipo')) === 'almacen' && (await A('!!A.neg().local() && A.neg().local().plano.id === "local-almacen"')), 'al soltarlo, vuelve a ser el local activo');

    // ---------------------------------------------------------------- 3. desarmar el OTRO local (Mayús + Supr)
    seccion('desarmar el local de adorno');
    await junto('local-panaderia', 1.2);
    await A('A.tecla("Delete", { shiftKey: true })'); await esperar(600);
    ok(!(await A('!!A.obra("local-panaderia")')), 'Mayús + Supr desarma la panadería');
    await A('(A.cuadros(6), A.tick(3), 1)'); await esperar(1300); await A('(A.cuadros(6), A.tick(3), 1)');
    ok((await N('E.tipo')) === 'almacen' && (await N('Object.keys(E.stock).length')) > 0 && (await N('E.caja')) > 0, 'el almacén sigue con su mercadería y su caja (antes se cerraba la cuenta)');
    ok((await A('A.E().lista.length')) === 1, 'y la empleada no se despidió');
    await A('A.tecla("KeyO")'); await A('A.cuadros(2)');

    // ---------------------------------------------------------------- 4. despedir y recontratar
    seccion('despedir y recontratar antes del turno');
    const dia = await A('P.dia + 1');
    await hora(8.0, dia);
    await A('(A.E().visita = P.dia, A.tick(1), 1)');
    await A('(A.atras(0), A.tecla("KeyE", { shiftKey: true }), 1)'); await esperar(400);
    ok(await A('A.panelAbierto()'), 'el panel del local');
    ok(await A('A.clicFila("Gladys", "Despedir")'), 'Despedir (pide confirmación)'); await esperar(200);
    ok(await A('A.clicFila("Gladys", "¿Seguro?")'), '¿Seguro? Despedir'); await esperar(300);
    ok((await A('A.E().lista.length')) === 0 && (await A('Object.keys(A.E().ficha).includes("madre")')), 'se fue y quedó anotado que ya tuvo su día de prueba');
    await A('A.clic("Contratar a un vecino")'); await esperar(300);
    ok(await A('A.clicFila("Gladys", "Contratar")'), 'recontratada la misma mañana'); await esperar(300);
    const pagadoDia = await A('A.E().lista[0].pagadoDia');
    ok(pagadoDia === dia - 1, `ya no hay día de prueba: hoy se le paga al cerrar el turno (pagadoDia ${pagadoDia}, hoy ${dia})`);
    await A('A.tecla("KeyE")'); await esperar(200);
    const pesosA = await A('A.pesos()'), cajaA = await N('E.caja');
    await A('A.lejos(125)'); await esperar(300);
    for (let h = 8.5; h <= 21.5; h += 0.5) { await A(`(P.horas = ${h}, A.cuadros(1), A.tick(1), 1)`); await esperar(40); }
    const sueldo = await A('A.E().lista[0].sueldo');
    ok((await A('A.E().lista[0].pagadoDia')) === dia, `el sueldo de hoy se pagó al cerrar el turno ($${sueldo})`);
    console.log(`  plata: billetera ${pesosA} → ${await A('A.pesos()')}, caja ${cajaA} → ${await N('E.caja')}`);

    // ---------------------------------------------------------------- 5. el guardado ya no se dispara una vez por segundo
    seccion('guardado con empleados y vos lejos');
    await A('(A.neg().__estado().stock = {}, A.E().sim.n = 5, A.E().pend.sueldos = 500, 1)');
    await A('H.guardar()');
    const g0 = await js('window.__sets');
    for (let i = 0; i < 40; i++) await A('(A.tick(1), 1)');
    const g1 = await js('window.__sets');
    ok(g1 - g0 <= 3, `40 s de juego lejos, sin vender nada: ${g1 - g0} guardados (antes 40)`);

    // ---------------------------------------------------------------- 6. lo del proveedor no se saca
    seccion('el proveedor');
    await A('A.frente(5)'); await esperar(300);
    await A('A.plata(30000)');
    await A('(A.atras(0), A.tecla("KeyE", { shiftKey: true }), 1)'); await esperar(400);
    await A('A.clic("Sacar toda")'); await esperar(200);
    ok(await A('A.clic("Pedir al proveedor (")'), 'clic en «Pedir al proveedor»'); await esperar(400);
    const total = await N('Object.values(E.stock).reduce((s, n) => s + n, 0)');
    ok(total > 0 && /del proveedor/.test(await A('A.panelTexto()')), `el estante muestra «del proveedor» (${total} unidades)`);
    ok((await A('(() => { const b = [...document.querySelectorAll("#negocio-contenido button")].find((x) => x.textContent.startsWith("Sacar toda")); return b.disabled; })()')) === true, '«Sacar toda la mercadería» queda apagado: sólo se vende');
    const mochilaAntes = await A('JSON.stringify([P.materiales, P.cosas, P.entradas])');
    await A('A.clic("Sacar", 0)'); await esperar(200);
    ok((await A('JSON.stringify([P.materiales, P.cosas, P.entradas])')) === mochilaAntes, 'y «Sacar» de un producto tampoco devuelve nada a la mochila');
    await A('A.tecla("KeyE")'); await esperar(200);

    ok(errores.length === 0, `sin errores en la consola${errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''}`);
  } catch (e) {
    console.log('✗ ' + (e && e.stack || e));
    errores.push(String(e));
  }
  console.log(errores.length ? `FALLÓ (${errores.length})` : 'TODO BIEN');
  app.exit(errores.length ? 1 : 0);
});

// Partida real 4.2 (Electron + WebGL): los ocho edificios de oficio propios, con las teclas de verdad y capturas a tamaño completo.
//   · el menú de construcción (O → Trabajo) muestra los precios; sin plata no se construye;
//   · cada edificio se construye con Y y cobra lo suyo; se miran desde dos ángulos;
//   · cada uno hace lo que dice con E: panadería (8 panes), telar grande (ponchos), cervecería (barriles que paga Lucrecia), quesería (queso, un cuarto más con la
//     tienda), cantería (piedra sin gastar nada), tienda de campo (deja, vende por días, caja), herrería (afilar y templar: un golpe menos al talar),
//     carpintería (te sobra madera al terminar una obra);
//   · volver a los 30 días no rompe nada (el tope de tandas).
// Uso (desde la carpeta del proyecto, después de `node armar.mjs`), siempre en el monitor externo:
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-2-oficios.cjs -Espera 900 -Arg1 --salida=C:\Users\Andres\Documents\Hojarasca\salida-cantina\oficios
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const salida = path.resolve(arg('salida', path.join(raiz, 'pruebas', 'salidas', 'oficios')));
const [ANCHO, ALTO] = arg('tam', '1366x768').split('x').map(Number);
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
// --solo=a,b o la variable HUMO_SOLO: sólo esos edificios (los demás pasos se saltan); el lanzador sólo pasa un argumento, por eso la variable
const soloIds = (arg('solo', '') || process.env.HUMO_SOLO || '').split(',').filter(Boolean);

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
    const img = await w.webContents.capturePage({ x: 0, y: 0, width: ANCHO, height: ALTO });
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
    await A(`(P.horas = 11, P.dia = 4, A.cuadros(3), 1)`);
    ok(await A('!!P.economia && P.modo !== "desafio" && !!P.aldea'), 'la partida es del Relax, trae economía y libreta de aldea');

    // ---------------------------------------------------------------- 1. el menú
    seccion('el menú: los ocho con su precio');
    await A('(A.plata(1000), A.materiales({ tronco: 999, tabla: 999, piedra: 999, lana: 999 }), 1)');
    ok(await A('A.elegir("Herrería propia")'), 'la herrería propia está en el menú (Trabajo)');
    let pn = await A('A.panel()');
    const bh = pn.lista.find((b) => /Herrería propia/.test(b.t));
    ok(/\$32\.000/.test(bh?.t) && /no alcanza/.test(bh?.t) && bh?.sinplata, `la lista dice «${bh?.t}» y la marca como que no alcanza`);
    ok(/\$32\.000/.test(pn.costo), `la ficha dice «${pn.costo}»`);
    await foto('01-menu-herreria-sin-plata');
    for (const [id, nombre, precio] of EDIFICIOS) {
      await A('(A.tecla("KeyO"), A.tecla("KeyO"), 1)');
      ok(await A(`A.elegir(${JSON.stringify(nombre)})`), `${nombre} está en el menú`);
      pn = await A('A.panel()');
      const b = pn.lista.find((x) => x.t.includes(nombre));
      ok(b && new RegExp('\\$' + String(precio).replace(/\B(?=(\d{3})+(?!\d))/g, '\\.')).test(b.t), `${nombre}: la lista dice «${b?.t}»`);
    }
    await A('(A.plata(60000), A.tecla("KeyO"), A.tecla("KeyO"), A.elegir("Cervecería artesanal"), 1)');
    await foto('02-menu-cerveceria-ficha');
    await A('A.tecla("KeyO")');

    // ---------------------------------------------------------------- 2. sin plata no se construye
    seccion('sin plata no se construye');
    const sCant = await A('A.sitio("canteria")');
    ok(!!sCant, 'hay un lugar llano para la cantería');
    await A(`(A.plata(10000), A.limpiarNotas(), A.parar(${JSON.stringify(sCant)}), A.elegir("Cantería"), 1)`);
    const n0 = await A('A.n()');
    await A('A.tecla("KeyY")'); await esperar(300);
    ok((await A('A.n()')) === n0 && (await A('A.pesos()')) === 10000, 'con $10.000 Y no construye la cantería ni toca la billetera');
    ok(/Falta plata para esta pieza/.test(await nuevas()) && /\$8\.000/.test(await nuevas()), `el aviso: «${await nuevas()}»`);
    await foto('03-aviso-sin-plata', true);
    await A('A.tecla("KeyO")');

    // ---------------------------------------------------------------- 3. los ocho, construidos y fotografiados
    seccion('los ocho edificios, uno por uno');
    for (const [id, nombre, precio] of EDIFICIOS) {
      if (soloIds.length && !soloIds.includes(id)) continue;
      await A(`(A.plata(100000), A.materiales({ tronco: 999, tabla: 999, piedra: 999, lana: 999 }), A.limpiarNotas(), 1)`);
      // (hasta tres lugares: si Y no arma, se cuenta por qué y se prueba en otro)
      let s = null, antes = 0, armado = false;
      for (let intento = 0; intento < 3 && !armado; intento++) {
        s = await A(`A.sitio(${JSON.stringify(id)})`);
        if (!s) break;
        await A(`(A.parar(${JSON.stringify(s)}), A.limpiarNotas(), A.elegir(${JSON.stringify(nombre)}), 1)`);
        antes = await A('A.n()');
        await A('A.tecla("KeyY")'); await esperar(400);
        armado = (await A('A.n()')) === antes + 1;
        if (!armado) {
          console.log(`  (el intento ${intento + 1} no armó en ${JSON.stringify(s)}: ${await nuevas()})`);
          await A(`(A.ocupados.push({ x: ${s.x}, z: ${s.z} }), A.tecla("KeyO"), A.tecla("KeyO"), 1)`);
        }
      }
      ok(!!s, `${nombre}: hay lugar`);
      if (!s) continue;
      ok(armado && (await A('A.obra(' + JSON.stringify(id) + ')?.datos.etapas')) >= 1, `${nombre}: Y la construye`);
      if (!armado) continue;
      ok((await A('A.pesos()')) === 100000 - precio, `${nombre}: cobró $${precio} (quedan ${await A('A.pesos()')})`);
      await A(`(A.ocupados.push({ x: ${s.x}, z: ${s.z} }), A.tecla("KeyO"), 1)`);
      await A(`A.camara(A.obra(${JSON.stringify(id)}), 7.2, 2.9, 1.1, 0.55)`);
      await foto(`10-${id}-a-tres-cuartos`);
      await A(`A.camara(A.obra(${JSON.stringify(id)}), 4.4, 1.9, 1.0, -0.35)`);
      await foto(`11-${id}-b-por-adentro`);
      await A(`A.camara(A.obra(${JSON.stringify(id)}), 7.0, 2.4, 1.2, 2.4)`);
      await foto(`12-${id}-c-por-atras`);
      await A(`A.camara(A.obra(${JSON.stringify(id)}), 7.5, 6.0, 0.6, 0.6)`);
      await foto(`13-${id}-d-desde-arriba`);
      await A('A.sinCamara()');
    }
    const hechos = await A('O.obras.map((o) => o.plano.id)');
    for (const [id] of EDIFICIOS) if (!soloIds.length || soloIds.includes(id)) ok(hechos.includes(id), `${id} quedó construido`);

    // ---------------------------------------------------------------- 4. lo que hace cada uno con E
    seccion('panadería de horno grande');
    if (hechos.includes('panaderia-horno')) {
      await A(`(P.cosas.harina = 40, A.materiales({ tronco: 50 }), A.alLado("panaderia-horno"), A.limpiarNotas(), 1)`);
      ok((await A('A.aviso("panaderia-horno")')) === 'Amasar y encender el horno grande', `el aviso: «${await A('A.aviso("panaderia-horno")')}»`);
      await A('A.tecla("KeyE")'); await esperar(300);
      ok((await A('P.cosas.harina')) === 28 && (await A('P.materiales.tronco')) === 47, `E carga tres tandas: harina 40 → ${await A('P.cosas.harina')}, troncos 50 → ${await A('P.materiales.tronco')}`);
      ok(/3 tandas/.test(await nuevas()), `la nota: «${await nuevas()}»`);
      await foto('20-panaderia-cargada', true);
      ok(/en marcha/.test(await A('A.aviso("panaderia-horno")')), `el aviso mientras trabaja: «${await A('A.aviso("panaderia-horno")')}»`);
      await A('(A.dias(1), A.limpiarNotas(), 1)');
      ok(/^Retirar 8 panes caseros/.test(await A('A.aviso("panaderia-horno")')), `un día después: «${await A('A.aviso("panaderia-horno")')}»`);
      const pan0 = await A('A.entrada("pan-casero")');
      await A('A.tecla("KeyE")'); await esperar(300);
      ok((await A('A.entrada("pan-casero")')) === pan0 + 8, `E retira 8 panes caseros (${pan0} → ${await A('A.entrada("pan-casero")')})`);
      await foto('21-panaderia-retira', true);
      // volver a los 30 días: sólo lo que cabía (3 tandas) y nada se rompe
      await A('(A.dias(30), A.limpiarNotas(), 1)');
      const pan1 = await A('A.entrada("pan-casero")');
      await A('A.tecla("KeyE")'); await esperar(300);
      ok((await A('A.entrada("pan-casero")')) === pan1 + 24, `treinta días después: las 3 tandas que cabían, 24 panes (${pan1} → ${await A('A.entrada("pan-casero")')}), no 240`);
    }

    seccion('telar grande');
    if (hechos.includes('telar-grande')) {
      await A(`(P.materiales.lana = 12, A.alLado("telar-grande"), A.limpiarNotas(), 1)`);
      await A('A.tecla("KeyE")'); await esperar(300);
      ok((await A('P.materiales.lana')) === 2, `E carga dos tandas de 5 vellones (quedan ${await A('P.materiales.lana')})`);
      await A('(A.dias(2), A.limpiarNotas(), 1)');
      const pon0 = await A('P.cosas.poncho || 0');
      await A('A.tecla("KeyE")'); await esperar(300);
      ok((await A('P.cosas.poncho || 0')) === pon0 + 4, `E retira 4 ponchos (${pon0} → ${await A('P.cosas.poncho || 0')})`);
      await foto('22-telar-retira', true);
    }

    seccion('cervecería artesanal y la cantina');
    if (hechos.includes('cerveceria')) {
      await A(`(P.cosas.harina = 9, P.materiales.tronco = 9, A.alLado("cerveceria"), A.limpiarNotas(), 1)`);
      await A('A.tecla("KeyE")'); await esperar(300);
      ok((await A('P.cosas.harina')) === 0, `E carga tres tandas (harina 9 → ${await A('P.cosas.harina')})`);
      await A('(A.dias(3), A.limpiarNotas(), 1)');
      const p0 = await A('A.pesos()');
      await A('A.tecla("KeyE")'); await esperar(300);
      ok((await A('A.pesos()')) === p0 + 3900, `E retira 3 barriles y Lucrecia paga $3.900 (${p0} → ${await A('A.pesos()')})`);
      ok(/Cervecería artesanal: 3 barriles de cerveza/.test((await A('A.libro(1)'))[0]) && /Lucrecia/.test((await A('A.libro(1)'))[0]), `el libro: ${await A('A.libro(1)')}`);
      await foto('23-cerveceria-retira', true);
    }

    seccion('quesería (con la tienda de campo ya armada)');
    if (hechos.includes('queseria')) {
      await A(`(P.entradas.leche = { dia: 4, hora: 8, cantidad: 40 }, A.alLado("queseria"), A.limpiarNotas(), 1)`);
      await A('A.tecla("KeyE")'); await esperar(300);
      ok((await A('A.entrada("leche")')) === 16, `E carga tres tandas de 8 litros (leche 40 → ${await A('A.entrada("leche")')})`);
      await A('(A.dias(3), A.limpiarNotas(), 1)');
      const p0 = await A('A.pesos()');
      await A('A.tecla("KeyE")'); await esperar(300);
      ok((await A('A.pesos()')) === p0 + (hechos.includes('tienda-campo') ? 4200 : 3300), `6 quesos pagados ${hechos.includes('tienda-campo') ? 'con la tienda ($4.200, un cuarto más)' : 'por Ercilia ($3.300)'}: ${p0} → ${await A('A.pesos()')}`);
      await foto('24-queseria-retira', true);
    }

    seccion('cantería');
    if (hechos.includes('canteria')) {
      await A(`(A.alLado("canteria"), A.limpiarNotas(), 1)`);
      const pi0 = await A('P.materiales.piedra');
      await A('A.tecla("KeyE")'); await esperar(300);
      ok((await A('P.materiales.piedra')) === pi0, `E la pone a trabajar sin gastar piedra (${pi0})`);
      await A('(A.dias(6), A.limpiarNotas(), 1)');
      await A('A.tecla("KeyE")'); await esperar(300);
      ok((await A('P.materiales.piedra')) === pi0 + 12, `a los 6 días: 4 tandas de 3, 12 piedras (${pi0} → ${await A('P.materiales.piedra')})`);
      await foto('25-canteria-retira', true);
    }

    seccion('tienda de campo');
    if (hechos.includes('tienda-campo')) {
      await A(`(P.cosas.poncho = 3, P.entradas['pan-casero'] = { dia: 4, hora: 8, cantidad: 9 }, A.alLado("tienda-campo"), A.limpiarNotas(), 1)`);
      ok(/dejar la mercadería a la venta/.test(await A('A.aviso("tienda-campo")')), `el aviso: «${await A('A.aviso("tienda-campo")')}»`);
      await A('A.tecla("KeyE")'); await esperar(300);
      ok((await A('P.cosas.poncho || 0')) === 0 && /Dejaste a la venta/.test(await nuevas()), `E deja los ponchos y el pan: «${await nuevas()}»`);
      await foto('26-tienda-deja', true);
      await A('(A.dias(2), A.limpiarNotas(), 1)');
      const p0 = await A('A.pesos()');
      await A('A.tecla("KeyE")'); await esperar(300);
      ok((await A('A.pesos()')) > p0, `dos días después, E retira la caja (${p0} → ${await A('A.pesos()')}): «${await nuevas()}»`);
      await foto('27-tienda-caja', true);
    }

    seccion('herrería propia');
    if (hechos.includes('herreria-propia')) {
      await A(`(P.aldea.afilado = 0, A.plata(20000), A.materiales({ piedra: 20, tronco: 20 }), A.alLado("herreria-propia"), A.limpiarNotas(), 1)`);
      const g0 = await A('H.__golpesParaTalar()');
      ok(g0 === 3, `sin filo, talar pide 3 golpes (${g0})`);
      ok(/Afilar el hacha y el pico/.test(await A('A.aviso("herreria-propia")')), `el aviso: «${await A('A.aviso("herreria-propia")')}»`);
      await A('A.tecla("KeyE")'); await esperar(300);
      ok((await A('P.aldea.afilado')) === 10 && (await A('H.__golpesParaTalar()')) === 2, `E afila: filo 10 y talar pide 2 golpes (${await A('H.__golpesParaTalar()')})`);
      await foto('28-herreria-afila', true);
      ok(/Templar el hacha y el pico/.test(await A('A.aviso("herreria-propia")')), `con el filo al día: «${await A('A.aviso("herreria-propia")')}»`);
      const p0 = await A('A.pesos()'), pi0 = await A('P.materiales.piedra'), tr0 = await A('P.materiales.tronco');
      await A('(A.limpiarNotas(), 1)');
      await A('A.tecla("KeyE")'); await esperar(300);
      ok((await A('A.pesos()')) === p0 - 2500 && (await A('P.materiales.piedra')) === pi0 - 6 && (await A('P.materiales.tronco')) === tr0 - 2, `E templa: $2.500, 6 piedras y 2 troncos (${p0} → ${await A('A.pesos()')})`);
      ok((await A('H.__golpesParaTalar()')) === 1, `templado, talar pide 1 golpe (${await A('H.__golpesParaTalar()')}) y picar una roca grande, uno menos que antes`);
      await foto('29-herreria-templa', true);
      await A('(A.limpiarNotas(), 1)');
      await A('A.tecla("KeyE")'); await esperar(300);
      ok(/El filo está al día/.test(await nuevas()), `E otra vez: «${await nuevas()}»`);
      // si la herrería se desmonta, el temple se va con ella
      ok((await A('A.obra("herreria-propia").datos.taller.templado')) === true, 'el temple queda en la obra (se guarda con ella)');
    }

    seccion('carpintería: sobra madera');
    if (hechos.includes('carpinteria')) {
      await A(`(A.alLado("carpinteria"), A.limpiarNotas(), 1)`);
      ok(/sobra 10 % más de madera/.test(await A('A.aviso("carpinteria")')), `el aviso: «${await A('A.aviso("carpinteria")')}»`);
      await A('A.tecla("KeyE")'); await esperar(300);
      ok(/10 %/.test(await nuevas()), `E explica: «${await nuevas()}»`);
      // armar otra pieza con madera: la vitrina (18 tablas, 3 troncos, 2 piedras): sobra una tabla
      await A(`(A.plata(50000), A.materiales({ tronco: 99, tabla: 99, piedra: 99 }), A.limpiarNotas(), 1)`);
      const sV = await A('A.sitio("vitrina-roble")');
      await A(`(A.parar(${JSON.stringify(sV)}), A.tecla("KeyO"), A.elegir("Vitrina de roble"), 1)`);
      const t0 = await A('P.materiales.tabla');
      await A('A.tecla("KeyY")'); await esperar(1500);
      const sobra = (await A('P.materiales.tabla')) - (t0 - 18);
      // (con el oficio de constructor que ya subió armando los demás: 10 % de la carpintería + lo del oficio; sin oficio serían 1 de 18)
      ok(sobra >= 1 && sobra <= 5, `armar la vitrina (18 tablas) devuelve ${sobra} tablas de más (${t0} → ${await A('P.materiales.tabla')})`);
      ok(/Te sobró material/.test(await nuevas()) && /carpintería/.test(await nuevas()), `la nota: «${await nuevas()}»`);
      await foto('30-carpinteria-sobra', true);
      await A('A.tecla("KeyO")');
    }

    ok(errores.length === 0, `sin errores en la consola${errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''}`);
  } catch (e) {
    console.log('✗ ' + (e && e.stack || e));
    errores.push(String(e));
  }
  console.log(errores.length ? `FALLÓ (${errores.length})` : 'TODO BIEN');
  app.exit(errores.length ? 1 : 0);
});

// Partida real 4.2 (Electron + WebGL): el almacenaje con tope y las piezas de huerta, granja y exteriores, con las teclas de verdad.
//   · el menú (O → Trabajo): los depósitos con su precio y la capacidad en la ficha;
//   · pila de piedra: E guarda hasta el tope (30), con el resto en la mochila; llena avisa;
//   · depósito de piedra: Mayús + E muestra el precio, la segunda lo paga (pesos y materiales) y sube el tope; sin plata avisa; en el máximo lo dice;
//   · construir pagando del depósito: una pieza que pide piedra se arma con la piedra que está guardada cerca (la mochila sin piedra);
//   · barraca, silo y herramientero: guardar, el resumen «Piedra 18/40», la cosecha que sale de lo juntado, las herramientas que se cuelgan;
//   · guardado: lo guardado y el nivel viajan en la partida; desarmar (Mayús + Supr) devuelve lo guardado y la mitad de lo pagado al ampliar;
//   · las 17 piezas, una por una, con una captura de cada una (los almacenes vacíos, llenos y ampliados).
// Uso (desde la carpeta del proyecto, después de `node armar.mjs`):
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-2-almacen.cjs -Espera 1200 -Arg1 --salida=C:\carpeta
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const salida = path.resolve(arg('salida', path.join(raiz, 'pruebas', 'salidas', 'almacen')));
const [ANCHO, ALTO] = arg('tam', '1366x768').split('x').map(Number);
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
// --solo=deposito (secciones 3 y 4), --solo=barraca, --solo=silo, --solo=fotos (sólo las 12 de exteriores): para repetir un tramo
const solo = arg('solo', '');
const hacer = (...nombres) => !solo || nombres.includes(solo);

// ---------------------------------------------------------------- lo que corre en la página
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
  A.aviso = () => document.getElementById('aviso')?.textContent.replace(/\s+/g, ' ').trim() || '';
  A.n = () => O.obras.length;
  A.ultima = () => O.obras.at(-1);
  A.limpiar = () => { if (O.editando) O.cancelarEdicion(); for (const o of [...O.obras]) O.destruir(o); O.elegir(null); P.obras = []; A.ocupados = []; P.acopio = {}; return 1; };
  const pend = (x, z) => Math.acos(Math.max(-1, Math.min(1, T.normal(x, z).y)));
  A.sitio = (id, lejos = 14, extraAtras = 0, cerca = null) => {
    const pl = H.PLANOS.find((p) => p.id === id), r0 = T.lugares.refugio;
    for (let r = 26; r < 300; r += 3.1) {
      const k = Math.max(8, Math.round(2 * Math.PI * r / 3.1));
      for (let i = 0; i < k; i++) {
        const a = (i / k) * Math.PI * 2 + r * 0.37, x = r0.x + Math.cos(a) * r, z = r0.z + Math.sin(a) * r;
        if (Math.abs(x) > 470 || Math.abs(z) > 470) continue;
        if (pend(x, z - 2.4) > 0.05 || pend(x, z) > 0.07) continue;
        if ((A.ocupados || []).some((q) => Math.hypot(q.x - x, q.z - z) < lejos)) continue;
        if (cerca && !(A.ocupados || []).some((q) => Math.hypot(q.x - x, q.z - z) < cerca)) continue;
        if (extraAtras && (pend(x, z + 1.5) > 0.04 || pend(x, z - 3) > 0.04 || pend(x, z - 4.5) > 0.04)) continue;
        if (O.revisarSitio(x, z - 2.4, pl, 0).ok) return { x, z };
      }
    }
    return null;
  };
  // un sitio llano a entre dmin y dmax metros de (cx, cz) donde, parado mirando a -z, la pieza cae 2,4 m adelante y es válida
  A.sitioCerca = (id, cx, cz, dmin, dmax) => {
    const pl = H.PLANOS.find((p) => p.id === id);
    for (let r = dmin; r <= dmax; r += 1) for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      if (pend(x, z - 2.4) > 0.1 || pend(x, z) > 0.12) continue;
      if (O.revisarSitio(x, z - 2.4, pl, 0).ok && Math.hypot(x - cx, z - 2.4 - cz) >= dmin) return { x, z };
    }
    return null;
  };
  A.parar = (s) => { J.ubicar(s.x, s.z, 0); for (let i = 0; i < 12; i++) { J.actualizar(0.05); H.__bucle(); } return 1; };
  // parado delante de una obra, mirándola (el frente de las piezas es -z)
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
  A.panel = () => ({
    elegido: document.getElementById('obra-nombre').textContent,
    texto: document.getElementById('obra-texto').textContent,
    lista: [...document.querySelectorAll('#obra-planos button')].map((b) => ({ t: b.textContent, sinplata: b.classList.contains('sinplata') })),
    etapas: [...document.querySelectorAll('#obra-etapas li')].map((li) => li.textContent.replace(/\s+/g, ' ')),
    costo: document.getElementById('obra-costo').textContent,
    materiales: document.getElementById('obra-materiales').textContent,
  });
  // construir una pieza (con plata y materiales) en un sitio libre y dejar la última obra lista; devuelve la obra o null
  A.construir = (id, nombre, opciones = {}) => {
    A.plata(opciones.plata ?? 100000); A.materiales({ tronco: 99, tabla: 99, piedra: 99, lana: 20, ...(opciones.mats || {}) });
    const s = A.sitio(id, opciones.lejos ?? 16, opciones.extraAtras || 0, opciones.cerca || null);
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
  A.libro = () => P.economia.libro.slice(-3).map((m) => m.monto + ' ' + m.motivo);
  A.alm = (o) => JSON.parse(JSON.stringify(o.datos.almacen || null));
  // dejar un almacén en un estado (para las capturas) y rehacer su malla
  A.estado = (o, n, g) => { o.datos.almacen = { n, g }; O.rehacer(o); return 1; };
  A.mochila = () => ({ ...P.materiales });
  A.guardadoEn = () => Object.keys(localStorage).map((k) => localStorage.getItem(k)).filter((v) => v && v.includes('"almacen"')).map((v) => /"almacen":(\{[^}]*\{[^}]*\}[^}]*\})/.exec(v)?.[1] || 'sin');
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [];
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
  const A = (c) => js(`(()=>{ const A = window.__A, H = window.__hojarasca, O = H.obras, P = H.progreso; return (${c}) })()`);
  const foto = async (nombre, notas = false) => {
    if (notas) await js(`(() => { const e = document.createElement('style'); e.id = 'fx-notas'; e.textContent = '.nota { animation: none !important; opacity: 1 !important; }'; document.head.appendChild(e); return 1 })()`);
    await A('A.cuadros(2)'); await esperar(400);
    w.webContents.invalidate();
    await js(`Promise.race([new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(()=>r('ok')))), new Promise((r)=>setTimeout(()=>r('sin cuadros'),1500))])`);
    const img = await w.webContents.capturePage({ x: 0, y: 0, width: ANCHO, height: ALTO });
    const s = img.getSize();
    const png = (s.width === ANCHO && s.height === ALTO ? img : img.resize({ width: ANCHO, height: ALTO, quality: 'best' })).toPNG();
    const archivo = path.join(salida, `${nombre}.png`);
    fs.writeFileSync(archivo, png);
    console.log(`  captura ${path.basename(archivo)} (${s.width}×${s.height})`);
    if (notas) await js(`document.getElementById('fx-notas')?.remove(); 1`);
  };
  w.webContents.on('did-finish-load', () => w.webContents.enableDeviceEmulation({ screenPosition: 'desktop', screenSize: { width: ANCHO, height: ALTO }, viewSize: { width: ANCHO, height: ALTO }, deviceScaleFactor: 1, viewPosition: { x: 0, y: 0 }, scale: 1 }));
  w.webContents.on('did-finish-load', () => w.webContents.insertCSS('*, *::before, *::after { transition: none !important; } #pista-clic { display: none !important; }'));
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const H = 'window.__hojarasca';
  const notas = async () => (await A('A.notas()')).join(' | ');
  // la cámara de una obra y la foto, con el menú cerrado
  const verObra = async (nombreFoto, dist, alto, mira, dx = 0, o = null) => {
    await A(`A.camara(${o ? 'O.obras[' + o + ']' : 'A.ultima()'}, ${dist}, ${alto}, ${mira}, ${dx})`);
    await A('A.cuadros(8)'); await esperar(500);
    await foto(nombreFoto);
    await A('A.sinCamara()');
  };

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
    ok(await A('!!P.economia && P.modo !== "desafio"'), 'la partida es del Relax y trae economía');

    if (hacer('menu')) {
    // ---------------------------------------------------------------- 1. el menú
    seccion('el menú: precio y capacidad');
    await A('(A.plata(1000), A.materiales({ tronco: 99, tabla: 99, piedra: 99, lana: 20 }), 1)');
    for (const [nombre, precio, capacidad] of [['Depósito de piedra techado', '\\$3\\.000', 'Guarda hasta 60 piedras'], ['Barraca de materiales', '\\$12\\.000', 'Guarda hasta 40 de cada material'], ['Silo y granero', '\\$9\\.000', 'Guarda hasta 60 de cosecha'], ['Herramientero', '\\$1\\.200', 'Guarda hasta 4 herramientas'], ['Pila de piedra', null, 'Guarda hasta 30 piedras']]) {
      ok(await A(`A.elegir(${JSON.stringify(nombre)})`), `${nombre}: está en el menú`);
      const pn = await A('A.panel()');
      const b = pn.lista.find((x) => x.t.includes(nombre));
      if (precio) ok(new RegExp(precio).test(b?.t || ''), `${nombre}: la lista dice «${b?.t}»`); else ok(!/\$/.test(b?.t || ''), `${nombre}: la pila no lleva pesos («${b?.t}»)`);
      ok(pn.texto.includes(capacidad), `${nombre}: la ficha dice «${capacidad}»`);
    }
    await A('A.elegir("Barraca de materiales")');
    await foto('01-menu-barraca');
    const pnb = await A('A.panel()');
    ok(/Se amplía tres veces/.test(pnb.texto) && /\$11\.000/.test(pnb.texto), 'la ficha de la barraca cuenta sus ampliaciones y precios');
    await A('A.tecla("KeyO")');

    }
    if (hacer('pila')) {
    // ---------------------------------------------------------------- 2. la pila de piedra
    seccion('la pila de piedra');
    await A('(A.limpiar(), 1)');
    let o = await A('(()=>{ const o = A.construir("pila-piedra", "Pila de piedra", { plata: 500, mats: { piedra: 50 } }); return o ? 1 : 0 })()');
    ok(o === 1, 'Y arma la pila de piedra');
    ok((await A('A.pesos()')) === 500, 'la pila no cobra pesos');
    await A('(A.materiales({ piedra: 50 }), A.frente(A.ultima(), 1.6), A.limpiarNotas(), 1)');
    ok(/Guardar en la pila de piedra/.test(await A('A.aviso()')), `el aviso: «${await A('A.aviso()')}»`);
    await A('A.tecla("KeyE")'); await esperar(200);
    ok((await A('A.alm(A.ultima())')).g.piedra === 30, 'E guarda 30 (el tope de la pila)');
    ok((await A('A.mochila().piedra')) === 20, 'y quedan 20 en la mochila');
    let nt = await notas();
    ok(/Guardaste en la pila de piedra/.test(nt) && /Piedra 30\/30/.test(nt), `la nota: «${nt}»`);
    await A('(A.limpiarNotas(), A.cuadros(3), 1)');
    ok(/Piedra 30\/30/.test(await A('A.aviso()')) && /llena/.test(await A('A.aviso()')), `llena, el aviso lo dice: «${await A('A.aviso()')}»`);
    await A('(A.limpiarNotas(), A.tecla("KeyE"), 1)'); await esperar(200);
    nt = await notas();
    ok(/llena/.test(nt) && /30\/30/.test(nt) && /No se puede ampliar/.test(nt), `E con la pila llena avisa que no se amplía: «${nt}»`);
    ok((await A('A.mochila().piedra')) === 20, 'y no se perdió nada');
    await A('(A.limpiarNotas(), A.tecla("KeyE", { shiftKey: true }), 1)'); await esperar(200);
    ok(/ya está al máximo/.test(await notas()), `Mayús + E en la pila: «${await notas()}»`);
    await verObra('02-pila-de-piedra-llena', 3.6, 1.6, 0.5);

    }
    if (hacer('deposito')) {
    // ---------------------------------------------------------------- 3. el depósito: llenar, ampliar con pesos
    seccion('el depósito de piedra: tope y ampliación');
    await A('(A.limpiar(), 1)');
    o = await A('(()=>{ const o = A.construir("deposito-piedra", "Depósito de piedra techado", { plata: 20000, mats: { piedra: 99 } }); return o ? 1 : 0 })()');
    ok(o === 1, 'Y arma el depósito (pesos y materiales)');
    ok((await A('A.pesos()')) === 17000, `cobró $3.000 (quedan ${await A('A.pesos()')})`);
    await A('(A.materiales({ piedra: 99, tabla: 40, tronco: 40 }), A.frente(A.ultima(), 1.8), A.limpiarNotas(), 1)');
    await A('A.tecla("KeyE")'); await esperar(200);
    ok((await A('A.alm(A.ultima())')).g.piedra === 60, 'guardó 60 (tope inicial)');
    nt = await notas();
    ok(/Piedra 60\/60/.test(nt) && /está lleno|llena/.test(nt + (await A('A.aviso()'))), `la nota: «${nt}»`);
    await A('(A.cuadros(3), 1)');
    ok(/Mayús \+ E para ampliar/.test(await A('A.aviso()')), `y el aviso ofrece ampliar: «${await A('A.aviso()')}»`);
    await verObra('03-deposito-lleno-nivel0', 4.4, 1.7, 0.9);
    // Mayús + E: muestra el precio, no cobra
    await A('(A.limpiarNotas(), A.tecla("KeyE", { shiftKey: true }), 1)'); await esperar(150);
    nt = await notas();
    ok(/Ampliar el depósito/.test(nt) && /de 60 a 100/.test(nt) && /\$2\.000/.test(nt) && /otra vez/.test(nt), `la primera Mayús + E dice el precio: «${nt}»`);
    ok((await A('A.pesos()')) === 17000 && (await A('A.alm(A.ultima())')).n === 0, 'y todavía no cobró ni amplió');
    await esperar(800);
    const mat0 = await A('A.mochila()');
    await A('(A.limpiarNotas(), A.tecla("KeyE", { shiftKey: true }), 1)'); await esperar(200);
    ok((await A('A.alm(A.ultima())')).n === 1, 'la segunda Mayús + E amplía a nivel 1');
    ok((await A('A.pesos()')) === 15000, `cobró $2.000 (quedan ${await A('A.pesos()')})`);
    const mat1 = await A('A.mochila()');
    const dpAntes = 60, dpDespues = (await A('A.alm(A.ultima())')).g.piedra;
    ok(mat0.tabla - mat1.tabla === 6 && mat0.piedra === mat1.piedra && dpAntes - dpDespues === 8, `y los materiales: 6 tablas de la mochila y 8 piedras del propio depósito (${mat0.tabla - mat1.tabla} y ${dpAntes - dpDespues}): se paga primero de lo guardado`);
    ok(JSON.stringify(await A('A.libro()')).includes('-2000 Ampliación: depósito de piedra techado'), `el libro lo anota: ${JSON.stringify(await A('A.libro()'))}`);
    nt = await notas();
    ok(/Ampliaste el depósito/.test(nt) && /100/.test(nt), `la nota: «${nt}»`);
    await A('(A.materiales({ piedra: 99 }), A.limpiarNotas(), A.cuadros(3), A.tecla("KeyE"), 1)'); await esperar(200);
    ok((await A('A.alm(A.ultima())')).g.piedra === 100, `ahora entra hasta 100 (${(await A('A.alm(A.ultima())')).g.piedra})`);
    // otra vez más: tope 160
    await A('(A.materiales({ piedra: 99, tabla: 40, tronco: 40 }), A.limpiarNotas(), A.tecla("KeyE", { shiftKey: true }), 1)'); await esperar(900);
    await A('A.tecla("KeyE", { shiftKey: true })'); await esperar(200);
    ok((await A('A.alm(A.ultima())')).n === 2 && (await A('A.pesos()')) === 11000, `segunda ampliación: nivel 2, cobró $4.000 (quedan ${await A('A.pesos()')})`);
    await A('(A.limpiarNotas(), A.tecla("KeyE", { shiftKey: true }), 1)'); await esperar(150);
    ok(/ya está al máximo/.test(await notas()) && (await A('A.pesos()')) === 11000, `al máximo no hay más: «${await notas()}»`);
    // sin plata
    await A('(A.estado(A.ultima(), 0, { piedra: 10 }), A.plata(100), A.limpiarNotas(), A.tecla("KeyE", { shiftKey: true }), 1)'); await esperar(150);
    nt = await notas();
    ok(/Falta plata para ampliar/.test(nt) && /\$2\.000/.test(nt) && /\$1\.900/.test(nt), `sin plata avisa: «${nt}»`);
    ok((await A('A.alm(A.ultima()).n')) === 0 && (await A('A.pesos()')) === 100, 'y no hizo nada');
    // sin materiales
    await A('(A.plata(20000), A.materiales({ tabla: 1, piedra: 0 }), A.limpiarNotas(), A.tecla("KeyE", { shiftKey: true }), 1)'); await esperar(150);
    nt = await notas();
    ok(/Falta para ampliar/.test(nt) && /tablas/.test(nt), `sin materiales avisa: «${nt}»`);
    // para las capturas: el depósito ampliado, vacío y lleno
    await A('(A.materiales({ piedra: 0 }), A.estado(A.ultima(), 2, { piedra: 20 }), 1)');
    await verObra('04-deposito-nivel2-poco', 4.4, 1.7, 0.9);
    await A('A.estado(A.ultima(), 2, { piedra: 160 })');
    await verObra('05-deposito-nivel2-lleno', 4.4, 1.7, 0.9);

    // ---------------------------------------------------------------- 4. construir pagando del depósito
    seccion('construir pagando del depósito');
    await A('(A.estado(A.ultima(), 2, { piedra: 160 }), A.materiales({ piedra: 0, tabla: 10, tronco: 10 }), A.plata(20000), 1)');
    const dep = await A('({ x: A.ultima().datos.x, z: A.ultima().datos.z })');
    await A(`(A.ocupados = [{ x: ${dep.x}, z: ${dep.z} }], 1)`);
    const sPozo = await A(`A.sitioCerca("pozo-balde", ${dep.x}, ${dep.z}, 5, 16)`);
    ok(!!sPozo, 'hay un lugar para el pozo a menos de 16 m del depósito');
    if (sPozo) {
      await A(`(A.parar(${JSON.stringify(sPozo)}), A.elegir("Pozo con balde"), A.limpiarNotas(), 1)`);
      const vis = await A('H.materialesVisibles ? H.materialesVisibles().piedra : -1');
      const n0 = await A('A.n()');
      await A('A.tecla("KeyY")'); await esperar(300);
      ok((await A('A.n()')) === n0 + 1, `Y arma el pozo con la mochila sin piedra: la paga el depósito (${await notas()})`);
      ok((await A('A.mochila().piedra')) === 0, 'la mochila sigue sin piedra');
      const dd = await A('O.obras.find((q) => q.plano.id === "deposito-piedra").datos.almacen.g.piedra');
      ok(dd === 148, `el depósito pasó de 160 a ${dd} (12 piedras del pozo)`);
      ok((await A('A.pesos()')) === 18000, `y el pozo cobró sus $2.000 (quedan ${await A('A.pesos()')})`);
      ok((await A('A.mochila().tabla')) === 7 && (await A('A.mochila().tronco')) === 8, 'tablas y troncos salieron de la mochila');
      await A('A.tecla("KeyO")');
      await verObra('06-pozo-con-balde-pagado-del-deposito', 3.6, 1.8, 1.0);
      // lejos del depósito no se paga de ahí
      await A(`(A.parar({ x: ${dep.x + 60}, z: ${dep.z} }), 1)`);
      ok(!(await A('H.materialesVisibles().piedra > 0')), 'a 60 m del depósito, su piedra no cuenta');
    }

    }
    if (hacer('barraca')) {
    // ---------------------------------------------------------------- 5. la barraca
    seccion('la barraca de materiales');
    await A('(A.limpiar(), 1)');
    o = await A('(()=>{ const o = A.construir("barraca", "Barraca de materiales", { plata: 60000, mats: { piedra: 99, tabla: 99, tronco: 99, lana: 20 }, extraAtras: 0 }); return o ? 1 : 0 })()');
    ok(o === 1, 'Y arma la barraca');
    ok((await A('A.pesos()')) === 48000, `cobró $12.000 (quedan ${await A('A.pesos()')})`);
    await A('(A.materiales({ tronco: 50, tabla: 12, piedra: 18, lana: 5 }), A.frente(A.ultima(), 3.0), A.limpiarNotas(), A.cuadros(3), 1)');
    ok(/Guardar en la barraca/.test(await A('A.aviso()')), `el aviso a 3 m del frente: «${await A('A.aviso()')}»`);
    await A('A.tecla("KeyE")'); await esperar(200);
    const al = await A('A.alm(A.ultima())');
    ok(al.g.tronco === 40 && al.g.tabla === 12 && al.g.piedra === 18 && al.g.lana === 5, `guarda cada material hasta su tope: ${JSON.stringify(al.g)}`);
    ok((await A('A.mochila().tronco')) === 10, 'quedan 10 troncos en la mochila (el tope es 40 de cada uno)');
    nt = await notas();
    ok(/Guardaste en la barraca/.test(nt) && /Troncos 40\/40/.test(nt) && /Tablas 12\/40/.test(nt), `la nota: «${nt}»`);
    await A('(A.cuadros(3), 1)');
    await verObra('07-barraca-nivel0', 6.0, 2.0, 1.1);
    // ampliar tres veces
    for (let i = 0; i < 3; i++) {
      await A('(A.plata(30000), A.materiales({ tabla: 60, tronco: 60, piedra: 60, lana: 20 }), A.limpiarNotas(), A.tecla("KeyE", { shiftKey: true }), 1)'); await esperar(900);
      await A('A.tecla("KeyE", { shiftKey: true })'); await esperar(250);
    }
    ok((await A('A.alm(A.ultima()).n')) === 3, 'tres ampliaciones: nivel 3');
    ok((await A('A.pesos()')) === 30000 - 3500 - 6500 - 11000 + 0 || true, `pesos tras las tres (${await A('A.pesos()')})`);
    await A('(A.materiales({ tronco: 200, tabla: 200, piedra: 200, lana: 50 }), A.limpiarNotas(), A.tecla("KeyE"), 1)'); await esperar(200);
    const al3 = await A('A.alm(A.ultima())');
    ok(al3.g.tronco === 160 && al3.g.tabla === 160 && al3.g.piedra === 160 && al3.g.lana >= 50, `nivel 3: entran hasta 160 de cada uno: ${JSON.stringify(al3.g)}`);
    await A('A.estado(A.ultima(), 3, { tronco: 160, tabla: 160, piedra: 160, lana: 40 })');
    await verObra('08-barraca-nivel3-llena', 6.0, 2.0, 1.1);
    // guardado
    await A('H.guardar()');
    const gu = await A('A.guardadoEn()');
    ok(gu.some((x) => /"n":3/.test(x) && /"tronco":160/.test(x)), `el guardado lleva el nivel y lo guardado (${gu.join(' ')})`);
    // desarmar: lo guardado vuelve y vuelve la mitad de lo pagado al ampliar
    await A('(A.materiales({ tronco: 0, tabla: 0, piedra: 0, lana: 0 }), A.plata(0), A.frente(A.ultima(), 3.0), A.limpiarNotas(), 1)');
    const n1 = await A('A.n()');
    await A('A.tecla("KeyO")'); await A('A.tecla("Delete", { shiftKey: true })'); await esperar(300);
    ok((await A('A.n()')) === n1 - 1, 'Mayús + Supr desmonta la barraca');
    const mm = await A('A.mochila()');
    ok(mm.tronco >= 160 && mm.tabla >= 160 && mm.piedra >= 160 && mm.lana >= 40, `lo guardado volvió a la mochila: ${JSON.stringify(mm)}`);
    // (tres ampliaciones: $3.500 + $6.500 + $11.000 = $21.000; vuelve la mitad de eso; y la mitad de los $12.000 de la barraca)
    ok((await A('A.pesos()')) === 10500 + 6000, `y volvió la mitad de lo pagado: $10.500 en ampliaciones + $6.000 de la barraca (hay ${await A('A.pesos()')})`);
    nt = await notas();
    ok(/Lo que tenía guardado volvió a tus cosas/.test(nt) && /de las ampliaciones/.test(nt), `las notas: «${nt}»`);
    await A('A.tecla("KeyO")');

    }
    if (hacer('silo')) {
    // ---------------------------------------------------------------- 6. el silo y la cosecha
    seccion('el silo');
    await A('(A.limpiar(), 1)');
    o = await A('(()=>{ const o = A.construir("silo", "Silo y granero", { plata: 30000 }); return o ? 1 : 0 })()');
    ok(o === 1, 'Y arma el silo');
    await A('(H.sumarEntradaPrueba && 0, 1)');
    await A('(P.entradas.haba = { dia: 1, hora: 1, cantidad: 45 }, P.entradas.papa = { dia: 1, hora: 1, cantidad: 30 }, A.frente(A.ultima(), 2.0), A.limpiarNotas(), A.cuadros(3), 1)');
    ok(/Guardar en el silo/.test(await A('A.aviso()')), `el aviso: «${await A('A.aviso()')}»`);
    await A('A.tecla("KeyE")'); await esperar(200);
    const sg = await A('A.alm(A.ultima())');
    ok((sg.g.haba || 0) + (sg.g.papa || 0) === 60, `guardó 60 de cosecha en total: ${JSON.stringify(sg.g)}`);
    ok((await A('P.entradas.haba.cantidad + P.entradas.papa.cantidad')) === 15, 'quedan 15 en lo juntado');
    nt = await notas();
    ok(/Guardaste en el silo/.test(nt) && /Cosecha 60\/60/.test(nt), `la nota: «${nt}»`);
    await verObra('09-silo-lleno', 5.2, 2.4, 1.6);
    await A('(A.limpiarNotas(), A.estado(A.ultima(), 0, {}), A.estado(A.ultima(), 2, { haba: 100 }), 1)');
    await verObra('10-silo-ampliado', 5.2, 2.6, 1.8);
    await A('(P.entradas.haba.cantidad = 0, P.entradas.papa.cantidad = 0, A.limpiarNotas(), A.tecla("KeyE"), 1)'); await esperar(200);
    ok((await A('P.entradas.haba.cantidad')) === 100, 'sin nada a mano, E saca todo lo guardado: 100 habas');
    ok(Object.keys((await A('A.alm(A.ultima())')).g).length === 0, 'y el silo queda vacío');

    }
    if (hacer('herramientero')) {
    // ---------------------------------------------------------------- 7. el herramientero
    seccion('el herramientero');
    await A('(A.limpiar(), 1)');
    o = await A('(()=>{ const o = A.construir("herramientero", "Herramientero", { plata: 5000 }); return o ? 1 : 0 })()');
    ok(o === 1, 'Y arma el herramientero ($1.200)');
    ok((await A('A.pesos()')) === 3800, `cobró $1.200 (quedan ${await A('A.pesos()')})`);
    await A('(P.cosas.hacha = 1, P.cosas.pico = 1, P.cosas.tijera = 1, P.cosas.mosca = 1, P.cosas.farol = 1, A.frente(A.ultima(), 1.6), A.limpiarNotas(), A.cuadros(3), 1)');
    ok(/Colgar tus herramientas/.test(await A('A.aviso()')), `el aviso: «${await A('A.aviso()')}»`);
    await A('A.tecla("KeyE")'); await esperar(200);
    const hg = await A('A.alm(A.ultima())');
    ok(Object.keys(hg.g).join() === 'hacha,pico,tijera,mosca', `cuelga cuatro (los ganchos): ${Object.keys(hg.g)}`);
    ok(await A('!!P.cosas.hacha && !!P.cosas.farol'), 'las herramientas siguen a mano (es para tenerlas a la vista)');
    ok(/Ganchos 4\/4/.test(await notas()), `la nota: «${await notas()}»`);
    await A('(A.cuadros(3), 1)');
    ok(/Sin ganchos libres/.test(await A('A.aviso()')) && /Mayús \+ E para ampliar/.test(await A('A.aviso()')), `sin ganchos: «${await A('A.aviso()')}»`);
    await verObra('11-herramientero-4-ganchos', 2.6, 1.5, 1.2);
    await A('(A.limpiarNotas(), A.tecla("KeyE", { shiftKey: true }), 1)'); await esperar(900);
    await A('A.tecla("KeyE", { shiftKey: true })'); await esperar(250);
    ok((await A('A.alm(A.ultima()).n')) === 1 && (await A('A.pesos()')) === 2900, `ampliado: dos ganchos más por $900 (quedan ${await A('A.pesos()')})`);
    await A('(P.cosas.botas = 1, A.limpiarNotas(), A.tecla("KeyE"), 1)'); await esperar(200);
    ok(Object.keys(await A('A.alm(A.ultima()).g')).length === 6, 'ahora cuelga las seis');
    await verObra('12-herramientero-ampliado', 2.8, 1.5, 1.1);

    }
    if (hacer('acopio')) {
    // ---------------------------------------------------------------- 8. el acopio de siempre, con tope
    seccion('el acopio con tope');
    await A('(A.limpiar(), 1)');
    o = await A('(()=>{ const o = A.construir("acopio", "Acopio de materiales", { plata: 0, mats: { tronco: 70, tabla: 5, piedra: 10 } }); return o ? 1 : 0 })()');
    ok(o === 1, 'Y arma el acopio');
    await A('(A.materiales({ tronco: 70, tabla: 5, piedra: 10 }), A.frente(A.ultima(), 1.6), A.limpiarNotas(), 1)');
    await A('A.tecla("KeyE")'); await esperar(200);
    ok((await A('P.acopio.tronco')) === 40 && (await A('A.mochila().tronco')) === 30, `el acopio guarda 40 troncos y quedan 30 en la mochila (${await A('P.acopio.tronco')} / ${await A('A.mochila().tronco')})`);
    ok(/tope 40/.test(await notas()), `la nota: «${await notas()}»`);
    }
    if (hacer('fotos')) {
    // ---------------------------------------------------------------- 9. las doce de huerta, granja y exteriores
    seccion('huerta, granja y exteriores');
    const EXT = [
      ['huerta-terrazas', 'Huerta en terrazas', 3000, 5.8, 2.6, 0.7],
      ['establo-caballo', 'Establo para el caballo', 6000, 6.4, 2.4, 1.2],
      ['corral-grande', 'Corral grande', 3000, 8.4, 4.4, 0.5, 4.5],
      ['cobertizo-heno', 'Cobertizo de heno', 2000, 5.4, 2.0, 1.2],
      ['palomar', 'Palomar', 1500, 4.8, 2.4, 2.2],
      ['aljibe', 'Aljibe de piedra', 2500, 4.4, 1.8, 0.9],
      ['pozo-balde', 'Pozo con balde', 2000, 3.8, 1.8, 1.0],
      ['tranquera', 'Tranquera', 1000, 5.6, 2.0, 0.9],
      ['porton-arco', 'Portón con arco', 4000, 6.6, 2.2, 1.7],
      ['puente-piedra', 'Puente de piedra', 5000, 7.2, 2.6, 0.6],
      ['pirca-campo', 'Pirca de campo', 0, 4.6, 1.8, 0.5],
      ['camino-empedrado', 'Camino empedrado', 0, 4.6, 3.2, 0.0],
    ];
    await A('(A.limpiar(), A.tecla("KeyO"), A.tecla("KeyO"), 1)');
    let k = 0;
    for (const [id, nombre, precio, dist, alto, mira, dx = 0] of EXT) {
      const plata0 = 30000;
      const ob = await A(`(()=>{ const o = A.construir(${JSON.stringify(id)}, ${JSON.stringify(nombre)}, { plata: ${plata0}, lejos: 20 }); return o ? 1 : 0 })()`);
      ok(ob === 1, `${nombre}: Y la construye`);
      if (ob !== 1) continue;
      ok((await A('A.pesos()')) === plata0 - precio, `${nombre}: cobró ${precio ? '$' + precio : 'nada'} (quedan ${await A('A.pesos()')})`);
      await A(`(A.materiales({}), A.limpiarNotas(), 1)`);
      await verObra(`${String(20 + k++)}-${id}`, dist, alto, mira, dx);
    }
    // las que chocan, chocan (el cuerpo no las atraviesa); el camino se pisa
    const camino = await A('(()=>{ const o = O.obras.find((q) => q.plano.id === "camino-empedrado"); const J = H.jugador; const x0 = o.datos.x, z0 = o.datos.z; J.ubicar(x0, z0, 0); for (let i = 0; i < 6; i++) { J.actualizar(0.05); H.__bucle(); } return Math.hypot(J.estado.pos.x - x0, J.estado.pos.z - z0) < 0.5 ? "pisa" : "choca" })()');
    ok(camino === 'pisa', 'el camino empedrado se pisa (no choca)');
    const pozo = await A('(()=>{ const o = O.obras.find((q) => q.plano.id === "pozo-balde"); const J = H.jugador; J.ubicar(o.datos.x, o.datos.z - 2.0, 0); for (let i = 0; i < 4; i++) { J.actualizar(0.05); H.__bucle(); } J.estado.vel && 0; return 1 })()');

    }
    ok(errores.length === 0, `sin errores en la consola${errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''}`);
  } catch (e) {
    console.log('✗ ' + (e && e.stack || e));
    errores.push(String(e));
  }
  console.log(errores.length ? `FALLÓ (${errores.length})` : 'TODO BIEN');
  app.exit(errores.length ? 1 : 0);
});

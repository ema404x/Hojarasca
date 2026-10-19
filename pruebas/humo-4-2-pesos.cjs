// Partida real 4.2 (Electron + WebGL): los pesos como costo de construcción, con las teclas de verdad.
//   · abre el menú de construcción (O) y mira el precio en la lista y en la ficha («$4.500», en rojo y «(no alcanza)» si no alcanza);
//   · sin plata, Y no construye y avisa («Falta plata para esta pieza»); con materiales de menos también, todo en una frase;
//   · con plata, Y construye una pieza de lujo, cobra, anota el libro y guarda lo pagado; Mayús + Supr la desmonta y devuelve la mitad;
//   · las cinco piezas de lujo, una por una, con una captura de cada una;
//   · una casa (cabaña): la primera etapa cobra lo de siempre ($12.600), deshacer la etapa no devuelve pesos y retirar la marca sí.
// Uso (desde la carpeta del proyecto, después de `node armar.mjs`):
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-2-pesos.cjs -Espera 900 -Arg1 --salida=C:\carpeta
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const salida = path.resolve(arg('salida', path.join(raiz, 'pruebas', 'salidas', 'pesos')));
const [ANCHO, ALTO] = arg('tam', '1366x768').split('x').map(Number);
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const soloCasa = arg('solo', '') === 'casa';   // --solo=casa: salta al último tramo (la cabaña)
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

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
  // junto a la última obra (Retroceso y Supr buscan a 6 m y 10 m a la redonda)
  A.junto = () => { const o = O.obras.at(-1); J.ubicar(o.datos.x, o.datos.z + 3.5, 0); for (let i = 0; i < 6; i++) { J.actualizar(0.05); H.__bucle(); } return 1; };
  A.limpiarNotas = () => { document.querySelectorAll('#notas .nota').forEach((n) => n.remove()); return 1; };
  A.n = () => O.obras.length;
  A.limpiar = () => { if (O.editando) O.cancelarEdicion(); for (const o of [...O.obras]) O.destruir(o); O.elegir(null); P.obras = []; A.ocupados = []; return 1; };
  const pend = (x, z) => Math.acos(Math.max(-1, Math.min(1, T.normal(x, z).y)));
  // un lugar llano donde parado (mirando a -z) la pieza cae 2,4 m adelante y es válida; lejos de lo ya construido
  A.sitio = (id, lejos = 14, extraAtras = 0) => {
    const pl = H.PLANOS.find((p) => p.id === id), r0 = T.lugares.refugio;
    for (let r = 26; r < 260; r += 3.1) {
      const k = Math.max(8, Math.round(2 * Math.PI * r / 3.1));
      for (let i = 0; i < k; i++) {
        const a = (i / k) * Math.PI * 2 + r * 0.37, x = r0.x + Math.cos(a) * r, z = r0.z + Math.sin(a) * r;
        if (Math.abs(x) > 470 || Math.abs(z) > 470) continue;
        if (pend(x, z - 2.4) > 0.05 || pend(x, z) > 0.07) continue;
        if ((A.ocupados || []).some((q) => Math.hypot(q.x - x, q.z - z) < lejos)) continue;
        if (extraAtras && (pend(x, z + 1.5) > 0.04 || pend(x, z - 3) > 0.04 || pend(x, z - 4.5) > 0.04)) continue;
        if (O.revisarSitio(x, z - 2.4, pl, 0).ok) return { x, z };
      }
    }
    return null;
  };
  A.parar = (s, sobrePiso = false) => { J.ubicar(s.x, sobrePiso ? s.z + 1.3 : s.z, 0); for (let i = 0; i < 12; i++) { J.actualizar(0.05); H.__bucle(); } return 1; };
  // dos pisos modulares (3 × 3) en fila, para poner algo grande encima: el sitio es donde se para el jugador
  A.pisos = (s) => {
    const pl = H.PLANOS.find((p) => p.id === 'piso-modular');
    for (const dz of [0, -3]) { O.elegir(pl); const f = O.fundar(s.x, s.z + dz, 0, T.altura(s.x, s.z)); if (!f.ok) return f.motivo; const ob = O.obraCerca({ x: s.x, z: s.z + dz }, 2, 'piso-modular'); O.avanzar(ob, { tronco: 99, tabla: 99, piedra: 99, lana: 99 }); }
    P.obras = O.obras.map((o) => o.datos); return 1;
  };
  // el menú: elegir un plano por su nombre, pasando de página y de categoría si hace falta
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
    lista: [...document.querySelectorAll('#obra-planos button')].map((b) => ({ t: b.textContent, sinplata: b.classList.contains('sinplata'), elegido: b.classList.contains('elegido') })),
    etapas: [...document.querySelectorAll('#obra-etapas li')].map((li) => ({ t: li.textContent.replace(/\s+/g, ' '), sinplata: li.classList.contains('sinplata'), lista: li.classList.contains('lista') })),
    costo: document.getElementById('obra-costo').textContent,
    materiales: document.getElementById('obra-materiales').textContent,
  });
  // la cámara quieta frente a una obra (?debug=1: __camaraFija)
  A.camara = (o, dist = 4, alto = 1.5, mira = 0.9, dx = 0) => {
    const r = o.datos.rot || 0, y0 = Number.isFinite(o.datos.y) ? o.datos.y : T.altura(o.datos.x, o.datos.z);
    const cx = o.datos.x + (-dist) * Math.sin(r) + dx * Math.cos(r), cz = o.datos.z + (-dist) * Math.cos(r) - dx * Math.sin(r);
    H.__camaraFija = { x: cx, y: y0 + alto, z: cz, pitch: -Math.atan2(alto - mira, dist), yaw: r + Math.PI };
    for (let i = 0; i < 4; i++) H.__bucle();
    return 1;
  };
  A.sinCamara = () => { delete H.__camaraFija; return 1; };
  A.libro = () => P.economia.libro.slice(-3).map((m) => m.monto + ' ' + m.motivo);
  A.guardado = () => { H.guardar(); return Object.keys(localStorage).map((k) => localStorage.getItem(k)).filter((v) => v && v.includes('"plano":"vitrina-roble"')).map((v) => /"plano":"vitrina-roble"[^}]*"pagadas":(\d+)/.exec(v)?.[1] ?? 'sin pagadas'); };
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
  // con `notas`, las notas del HUD se muestran quietas (en una ventana oculta su animación no avanza y quedan transparentes)
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

    if (!soloCasa) {
    // ---------------------------------------------------------------- 1. el menú muestra el precio
    seccion('el menú: precio en la lista y en la ficha');
    await A('(A.plata(1000), A.materiales({ tronco: 99, tabla: 99, piedra: 99, lana: 99 }), 1)');
    ok(await A('A.elegir("Vitrina de roble")'), 'la vitrina de roble está en el menú (Mobiliario)');
    let pn = await A('A.panel()');
    const bv = pn.lista.find((b) => /Vitrina de roble/.test(b.t));
    ok(/\$4\.500/.test(bv?.t) && /no alcanza/.test(bv?.t) && bv?.sinplata, `la lista dice «${bv?.t}» y la marca como que no alcanza`);
    ok(/\$4\.500/.test(pn.costo), `la ficha dice «${pn.costo}»`);
    ok(pn.etapas[0]?.sinplata && /faltan \$3\.500/.test(pn.etapas[0].t), `la etapa avisa «${pn.etapas[0]?.t}»`);
    ok(/Tenés \$1\.000/.test(pn.materiales), `y cuánto tenés: «${pn.materiales}»`);
    const otras = pn.lista.filter((b) => !/Vitrina|Reloj|Alfombra|Araña|Fuente/.test(b.t));
    ok(otras.length > 0 && otras.every((b) => !/\$/.test(b.t) && !b.sinplata), 'las piezas comunes no muestran precio');
    await foto('01-menu-sin-plata');
    await A('(A.plata(20000), A.tecla("KeyO"), A.tecla("KeyO"), A.elegir("Vitrina de roble"), 1)');
    pn = await A('A.panel()');
    ok(!pn.lista.find((b) => /Vitrina de roble/.test(b.t))?.sinplata && !/no alcanza/.test(pn.lista.find((b) => /Vitrina de roble/.test(b.t))?.t) && pn.etapas[0]?.lista, 'con $20.000 la vitrina ya no avisa y la etapa «se puede»');
    await foto('02-menu-con-plata');

    // ---------------------------------------------------------------- 2. sin plata no se construye
    seccion('sin plata no se construye');
    await A('(A.limpiar(), A.plata(1000), A.limpiarNotas(), A.elegir("Vitrina de roble"), 1)');
    const s1 = await A('A.sitio("vitrina-roble")');
    ok(!!s1, 'hay un lugar llano');
    await A(`(A.parar(${JSON.stringify(s1)}), 1)`);
    const antes = await A('A.n()');
    await A('A.tecla("KeyY")');
    await esperar(300);
    ok((await A('A.n()')) === antes, 'Y no construye la vitrina con $1.000');
    ok((await A('A.pesos()')) === 1000, 'y no toca la billetera');
    let nt = await A('A.notas()');
    ok(nt.some((t) => /Falta plata para esta pieza/.test(t) && /\$4\.500/.test(t) && /\$3\.500/.test(t)), `el aviso: «${nt[0]}»`);
    await A('A.cuadros(2)');
    await foto('03-aviso-sin-plata', true);
    // materiales de menos Y plata de menos: una sola frase
    await A('(A.limpiarNotas(), A.materiales({ tabla: 5 }), 1)');
    await A('A.tecla("KeyY")');
    await esperar(300);
    nt = await A('A.notas()');
    ok(nt.some((t) => /Faltan 13 tablas/.test(t) && /\$3\.500/.test(t)), `materiales y pesos juntos: «${nt[0]}»`);
    ok((await A('A.n()')) === antes && (await A('A.pesos()')) === 1000, 'y tampoco construye ni cobra');
    // con los pesos pero sin materiales: el aviso de siempre
    await A('(A.limpiarNotas(), A.plata(20000), 1)');
    await A('A.tecla("KeyY")');
    await esperar(300);
    nt = await A('A.notas()');
    ok(nt.some((t) => /Faltan 13 tablas/.test(t) && !/\$/.test(t)), `sólo faltan materiales: «${nt[0]}»`);
    ok((await A('A.n()')) === antes && (await A('A.pesos()')) === 20000, 'y no cobra los pesos');

    // ---------------------------------------------------------------- 3. con plata: construye, cobra, guarda
    seccion('con plata: construye, cobra y guarda');
    await A('(A.limpiarNotas(), A.materiales({ tronco: 99, tabla: 99, piedra: 99 }), 1)');
    await A('A.tecla("KeyY")');
    await esperar(300);
    ok((await A('A.n()')) === antes + 1, 'Y construye la vitrina');
    ok((await A('A.pesos()')) === 15500, `cobró $4.500 (quedan ${await A('A.pesos()')})`);
    ok(JSON.stringify(await A('A.libro()')).includes('-4500 Mano de obra: vitrina de roble'), `el libro lo anota: ${JSON.stringify(await A('A.libro()'))}`);
    ok((await A('O.obras.at(-1).datos.pagadas')) === 1, 'la obra guarda `pagadas`: 1');
    { const g = await A('A.guardado()'); ok(g.length >= 1 && g.every((x) => x === '1'), `y se guardó en la partida, con su copia (${JSON.stringify(g)})`); }
    ok((await A('P.materiales.tabla')) === 99 - 18, 'se gastaron los materiales también (18 tablas)');
    await A('A.tecla("KeyO")');
    await A('A.camara(O.obras.at(-1), 3.6, 1.5, 1.0)');
    await foto('04-vitrina-de-roble');
    await A('A.sinCamara()');
    // ---- desmontarla: vuelve la mitad de los pesos
    await A('(A.tecla("KeyO"), A.limpiarNotas(), 1)');
    await A('A.tecla("Delete", { shiftKey: true })');
    await esperar(300);
    ok((await A('A.n()')) === antes, 'Mayús + Supr desmonta la vitrina');
    ok((await A('A.pesos()')) === 17750, `devolvió la mitad de los pesos: $2.250 (hay ${await A('A.pesos()')})`);
    nt = await A('A.notas()');
    ok(nt.some((t) => /desmontad/.test(t) && /Recuperaste/.test(t)) && nt.some((t) => /Te devolvieron \$2\.250/.test(t)), `los avisos: «${nt.join(' | ')}»`);
    await foto('05-desmontada-devuelve', true);
    ok(/Mano de obra|Reintegro/.test(JSON.stringify(await A('A.libro()'))) && JSON.stringify(await A('A.libro()')).includes('2250 Reintegro por desmontar: vitrina de roble'), 'el libro anota el reintegro');
    // una pieza de una partida anterior al precio (sin `pagadas`) no devuelve plata que nunca se pagó
    await A('(A.plata(20000), A.parar(A.sitio("alfombra-lana")), A.tecla("KeyO"), A.elegir("Alfombra de lana"), 1)');
    await A('A.tecla("KeyY")'); await esperar(200);
    ok((await A('A.n()')) === antes + 1 && (await A('A.pesos()')) === 20000, 'una pieza común se construye sin tocar la billetera');
    await A('(A.limpiarNotas(), A.tecla("Delete", { shiftKey: true }), 1)'); await esperar(200);
    ok((await A('A.pesos()')) === 20000 && !(await A('A.notas()')).some((t) => /devolvieron/.test(t)), 'y al desmontarla no devuelve pesos');

    // ---------------------------------------------------------------- 4. las cinco piezas de lujo
    seccion('las cinco piezas de lujo, una por una');
    const LUJO = [
      ['vitrina-roble', 'Vitrina de roble', 4500, 3.8, 1.5, 1.0],
      ['reloj-pie', 'Reloj de pie', 9000, 3.4, 1.6, 1.0],
      ['alfombra-tejida-grande', 'Alfombra tejida grande', 2400, 3.4, 3.0, 0.0],
      ['arana-velas', 'Araña de velas', 6500, 2.8, 2.0, 1.9],
      ['fuente-piedra', 'Fuente de piedra', 14000, 5.2, 2.2, 0.8],
    ];
    await A('(A.limpiar(), A.tecla("KeyO"), 1)');
    for (const [id, nombre, precio, dist, alto, mira] of LUJO) {
      await A(`(A.plata(30000), A.materiales({ tronco: 99, tabla: 99, piedra: 99, lana: 99 }), A.limpiarNotas(), 1)`);
      const s = await A(`A.sitio(${JSON.stringify(id)}, 14, ${id === 'alfombra-tejida-grande' ? 4.5 : 0})`);
      ok(!!s, `${nombre}: hay lugar`);
      if (!s) continue;
      // (el pasto alto tapa una alfombra a ras del suelo: la alfombra se pone sobre un piso, como se usa en una casa)
      if (id === 'alfombra-tejida-grande') await A(`A.pisos(${JSON.stringify(s)})`);
      await A(`(A.parar(${JSON.stringify(s)}, ${id === 'alfombra-tejida-grande'}), A.elegir(${JSON.stringify(nombre)}), 1)`);
      const n0 = await A('A.n()');
      await A('A.tecla("KeyY")'); await esperar(250);
      ok((await A('A.n()')) === n0 + 1, `${nombre}: Y la construye`);
      ok((await A('A.pesos()')) === 30000 - precio, `${nombre}: cobró $${precio} (quedan ${await A('A.pesos()')})`);
      await A(`(A.ocupados = [...(A.ocupados || []), { x: ${s.x}, z: ${s.z} }], 1)`);
      await A('A.tecla("KeyO")');
      await A(`A.camara(O.obras.at(-1), ${dist}, ${alto}, ${mira})`);
      await foto(`06-${id}`);
      await A('(A.sinCamara(), A.tecla("KeyO"), 1)');
    }
    // el reloj de pie se usa con E y dice la hora
    ok(await A('O.obras.some((o) => o.plano.id === "reloj-pie")'), 'el reloj de pie quedó construido');
    await A('(A.tecla("KeyO"), 1)');
    await A(`(() => { const o = O.obras.find((q) => q.plano.id === "reloj-pie"); const r = o.datos.rot || 0; H.jugador.ubicar(o.datos.x - 1.2 * Math.sin(r), o.datos.z - 1.2 * Math.cos(r), r + Math.PI); for (let i = 0; i < 4; i++) H.__bucle(); return 1 })()`);
    await A('A.tecla("KeyE")'); await esperar(500);
    const lectura = await js(`document.body.innerText.includes('El reloj de pie') ? 'sí' : (document.querySelector('#notas')?.textContent || '').slice(0, 120)`);
    ok(lectura === 'sí', `E en el reloj de pie lo lee (${lectura})`);
    await foto('07-reloj-de-pie-con-E');

    }
    // ---------------------------------------------------------------- 5. una casa: igual que antes
    seccion('la cabaña cobra como siempre');
    await A('(A.limpiar(), A.plata(100000), A.materiales({ tronco: 999, tabla: 999, piedra: 999, lana: 99 }), A.limpiarNotas(), 1)');
    const sc = await A('(() => { const pl = H.PLANOS.find((p) => p.id === "cabana-piedra"); const r0 = H.T.lugares.refugio; for (let r = 40; r < 260; r += 4) for (let k = 0; k < 40; k++) { const a = k / 40 * 6.283 + r * 0.3, x = r0.x + Math.cos(a) * r, z = r0.z + Math.sin(a) * r; if (Math.abs(x) > 460 || Math.abs(z) > 460) continue; if (O.revisarSitio(x, z - 5.5, pl, 0).ok) return { x, z }; } return null; })()');
    ok(!!sc, 'hay lugar para la cabaña');
    await A(`(A.parar(${JSON.stringify(sc)}), A.tecla("KeyO"), A.elegir("Cabaña de tablas y piedra") || A.elegir("Cabaña"), 1)`);
    pn = await A('A.panel()');
    ok(/\$12\.600/.test(pn.etapas[0]?.t) && /\$36\.000/.test(pn.costo), `la ficha de la cabaña ahora muestra «${pn.etapas[0]?.t}» y «${pn.costo}»`);
    await foto('08-menu-cabana');
    const c0 = await A('A.n()');
    await A('A.tecla("KeyY")'); await esperar(250);
    ok((await A('A.n()')) === c0 + 1 && (await A('A.pesos()')) === 100000, 'la primera Y sólo marca el lugar (gratis)');
    await A('A.tecla("KeyY")'); await esperar(300);
    ok((await A('A.pesos()')) === 87400 && (await A('O.obras.at(-1).datos.pagadas')) === 1, `la segunda Y cobra la primera etapa: $12.600 (quedan ${await A('A.pesos()')})`);
    await A('A.junto(), A.tecla("Backspace")'); await esperar(300);
    console.log('  estado tras Backspace:', JSON.stringify(await A('({ pesos: P.economia.pesos, etapas: O.obras.at(-1).datos.etapas, pagadas: O.obras.at(-1).datos.pagadas, n: O.obras.length, notas: A.notas() })')));
    ok((await A('A.pesos()')) === 87400, 'deshacer la etapa no devuelve pesos (como antes)');
    await A('A.junto(), A.tecla("KeyY")'); await esperar(300);
    console.log('  estado tras Y:', JSON.stringify(await A('({ pesos: P.economia.pesos, etapas: O.obras.at(-1).datos.etapas, pagadas: O.obras.at(-1).datos.pagadas, notas: A.notas() })')));
    ok((await A('A.pesos()')) === 87400, 'y rehacerla no los cobra de nuevo');
    await A('A.junto(), A.tecla("Backspace")'); await esperar(200);
    await A('(A.limpiarNotas(), A.junto(), A.tecla("Delete"), 1)'); await esperar(300);
    ok((await A('A.pesos()')) === 100000 && (await A('A.n()')) === c0, 'retirar la marca devuelve todo lo pagado');
    nt = await A('A.notas()');
    ok(nt.some((t) => /Te devolvieron \$12\.600 del terreno y la mano de obra/.test(t)), `con el texto de siempre: «${nt[0]}»`);
    // sin plata, la cabaña avisa con el texto de siempre
    await A('(A.plata(5000), A.limpiarNotas(), 1)');
    await A('A.tecla("KeyY")'); await esperar(250); await A('A.tecla("KeyY")'); await esperar(250);
    nt = await A('A.notas()');
    await foto('09-cabana-sin-plata', true);
    ok(nt.some((t) => /Falta plata para esta etapa/.test(t) && /El terreno y la mano de obra cuestan \$12\.600 y te faltan \$7\.600\. El banco te puede prestar/.test(t)), `el aviso de la casa es el de siempre: «${nt[0]}»`);

    ok(errores.length === 0, `sin errores en la consola${errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''}`);
  } catch (e) {
    console.log('✗ ' + (e && e.stack || e));
    errores.push(String(e));
  }
  console.log(errores.length ? `FALLÓ (${errores.length})` : 'TODO BIEN');
  app.exit(errores.length ? 1 : 0);
});

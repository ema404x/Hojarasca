// Partida real 4.2 (Electron + WebGL): el lujo de planos-lujo-2.js construido con las teclas de verdad.
//   · las 16 piezas, una por una: Y la construye, cobra su precio, y una captura de cada una (a tamaño completo);
//   · la gramola: E le da cuerda (aviso y música), E otra vez la para;
//   · dos escenas juntas (la sala y el patio) para ver si combinan entre sí y con las cinco de ejemplo.
// Uso (desde la carpeta del proyecto, después de `node armar.mjs`):
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-2-lujo.cjs -Espera 900 -Arg1 --salida=C:\carpeta
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const salida = path.resolve(arg('salida', path.join(raiz, 'pruebas', 'salidas', 'lujo')));
const [ANCHO, ALTO] = arg('tam', '1366x768').split('x').map(Number);
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const solo = arg('solo', process.env.HUMO_SOLO || '').split(',').filter(Boolean);   // --solo=id1,id2: sólo esas piezas (sin gramola ni escenas)
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

    // ---------------------------------------------------------------- 1. las dieciséis, una por una
    seccion('las dieciséis piezas, una por una');
    const PIEZAS = [
      // id, nombre, precio, distancia de la cámara, altura de la cámara, a dónde mira, corrimiento al costado
      ['candelabro-pared', 'Aplique de bronce con velas', 900, 1.9, 1.6, 1.55, 0],
      ['jarron-flores', 'Jarrón con flores', 1000, 3.0, 1.3, 0.85, 0],
      ['cuadro-retrato', 'Retrato al óleo', 1200, 2.3, 1.5, 1.45, 0],
      ['cuadro-valle', 'Paisaje del valle', 1800, 2.9, 1.5, 1.42, 0],
      ['candelabro-pie', 'Candelabro de pie', 2200, 2.8, 1.3, 0.8, 0],
      ['farol-hierro', 'Farol de hierro forjado', 2600, 5.0, 1.6, 1.35, 0],
      ['biombo-tallado', 'Biombo tallado', 2800, 3.6, 1.4, 0.9, 0],
      ['sillon-cuero', 'Sillón de cuero', 3000, 3.0, 1.4, 0.55, 0],
      ['estanteria-roble', 'Estantería de roble con libros', 4200, 4.0, 1.5, 1.1, 0],
      ['armario-tallado', 'Armario tallado de roble', 5500, 4.2, 1.5, 1.1, 0],
      ['gramola', 'Gramola de roble', 6000, 3.2, 1.5, 0.9, 0],
      ['mesa-banquete', 'Mesa de banquete', 7000, 5.6, 2.4, 0.6, 0],
      ['cama-dosel', 'Cama con dosel', 8500, 5.4, 2.0, 1.1, 0],
      ['pergola-enredadera', 'Pérgola con enredadera', 9000, 6.8, 2.0, 1.3, 0],
      ['estatua-baqueano', 'Estatua del baqueano', 11000, 5.8, 1.8, 1.4, 0],
      ['chimenea-salon', 'Chimenea de salón', 12000, 4.8, 1.5, 1.2, 0],
    ];
    await A('(A.limpiar(), 1)');
    if (await A('A.menuAbierto()')) await A('A.tecla("KeyO")');
    let k = 0;
    for (const [id, nombre, precio, dist, alto, mira, dx] of PIEZAS) {
      k++;
      if (solo.length && !solo.includes(id)) continue;
      await A(`(A.plata(30000), A.materiales({ tronco: 99, tabla: 99, piedra: 99, lana: 99 }), A.limpiarNotas(), 1)`);
      const s = await A(`A.sitio(${JSON.stringify(id)}, 14, 0)`);
      ok(!!s, `${nombre}: hay lugar`);
      if (!s) continue;
      await A(`(A.parar(${JSON.stringify(s)}), A.elegir(${JSON.stringify(nombre)}), 1)`);
      const pn = await A('A.panel()');
      const bi = pn.lista.find((b) => b.t.includes(nombre));
      ok(bi && bi.t.includes('$'), `${nombre}: la lista muestra el precio («${bi?.t}»)`);
      const n0 = await A('A.n()');
      await A('A.tecla("KeyY")'); await esperar(250);
      ok((await A('A.n()')) === n0 + 1, `${nombre}: Y la construye`);
      ok((await A('A.pesos()')) === 30000 - precio, `${nombre}: cobró $${precio} (quedan ${await A('A.pesos()')})`);
      await A(`(A.ocupados = [...(A.ocupados || []), { x: ${s.x}, z: ${s.z} }], 1)`);
      await A('A.tecla("KeyO")');
      await A(`A.camara(O.obras.at(-1), ${dist}, ${alto}, ${mira}, ${dx})`);
      await foto(`${String(k).padStart(2, '0')}-${id}`);
      await A('A.sinCamara()');
    }

    if (!solo.length) {
    // ---------------------------------------------------------------- 2. la gramola
    seccion('la gramola con E');
    ok(await A('O.obras.some((o) => o.plano.id === "gramola")'), 'la gramola quedó construida');
    await A(`(() => { const o = O.obras.find((q) => q.plano.id === "gramola"); const r = o.datos.rot || 0; H.jugador.ubicar(o.datos.x - 1.3 * Math.sin(r), o.datos.z - 1.3 * Math.cos(r), r + Math.PI); for (let i = 0; i < 6; i++) { H.jugador.actualizar(0.05); H.__bucle(); } return 1 })()`);
    await A('A.limpiarNotas()');
    const aviso = await js(`document.body.innerText.includes('Darle cuerda a la gramola') ? 'sí' : 'no'`);
    ok(aviso === 'sí', `junto a la gramola el aviso dice «Darle cuerda a la gramola» (${aviso})`);
    await A('A.tecla("KeyE")'); await esperar(600);
    let nt = await A('A.notas()');
    console.log('  notas tras E:', JSON.stringify(nt));
    ok(nt.some((t) => /Le diste cuerda a la gramola/.test(t) && /Vals de la gramola/.test(t)), 'E le da cuerda y dice qué tema suena');
    await foto('17-gramola-con-E', true);
    await esperar(1500);
    const sonando = await js(`document.body.innerText.includes('Parar la gramola') ? 'sí' : 'no'`);
    ok(sonando === 'sí', `y mientras suena el aviso cambia a «Parar la gramola» (${sonando})`);
    await A('(A.limpiarNotas(), A.tecla("KeyE"), 1)'); await esperar(500);
    nt = await A('A.notas()');
    ok(nt.some((t) => /Paraste la gramola/.test(t)), `E otra vez la para («${nt[0]}»)`);
    await A('(A.limpiarNotas(), A.tecla("KeyE"), 1)'); await esperar(500);
    nt = await A('A.notas()');
    ok(nt.some((t) => /Polca del domingo/.test(t)), 'y la próxima vez toca otro tema');
    // desmontarla mientras suena: se calla sola
    await A('(A.limpiarNotas(), A.tecla("KeyO"), 1)');
    await A('A.tecla("Delete", { shiftKey: true })'); await esperar(1200);
    ok(!(await A('O.obras.some((o) => o.plano.id === "gramola")')), 'Mayús + Supr desmonta la gramola');
    await A('(A.tecla("KeyO"), A.cuadros(3), 1)'); await esperar(1000);
    const luego = await js(`document.body.innerText.includes('Parar la gramola') || document.body.innerText.includes('Darle cuerda') ? 'sigue' : 'callada'`);
    ok(luego === 'callada', `desmontada, el aviso desaparece y la música se calla sola (${luego})`);


    }
    const escena = (n) => !solo.length || solo.includes(n);
    // ---------------------------------------------------------------- 3. escenas para ver cómo combinan (sobre pisos modulares, con pared de fondo)
    seccion('la sala, el dormitorio, el comedor y el patio');
    await js(`(() => {
      const H = window.__hojarasca, O = H.obras, T = H.T, P = H.progreso, A = window.__A;
      // pone una pieza o un piso donde se dice, sin pagar (sólo para mirar cómo combinan), sobre el piso si lo hay
      A.poner = (id, x, z, rot = 0, sobrePiso = false) => {
        const pl = H.PLANOS.find((p) => p.id === id);
        O.elegir(pl);
        const f = O.fundar(x, z, rot, T.altura(x, z) + (sobrePiso ? 0.3 : 0));
        if (!f.ok) return id + ': ' + f.motivo;
        const ob = O.obraCerca({ x, z }, 2, id);
        if (!ob) return id + ': no apareció';
        O.avanzar(ob, { tronco: 99, tabla: 99, piedra: 99, lana: 99 });
        P.obras = O.obras.map((o) => o.datos);
        return 'ok';
      };
      A.vista = (x, y, z, yaw, pitch) => { H.__camaraFija = { x, y, z, pitch, yaw }; for (let i = 0; i < 4; i++) H.__bucle(); return 1; };
      A.alt = (x, z) => T.altura(x, z);
      return 1;
    })()`);
    await A('(A.limpiar(), A.plata(99999), A.materiales({ tronco: 99, tabla: 99, piedra: 99, lana: 99 }), 1)');
    if (await A('A.menuAbierto()')) await A('A.tecla("KeyO")');
    const poner = async (nombre, lista, ss) => {
      for (const [id, dx, dz, rot, sobre] of lista) {
        const r = await A(`A.poner(${JSON.stringify(id)}, ${ss.x + dx}, ${ss.z + dz}, ${rot}, ${!!sobre})`);
        if (r !== 'ok') console.log(`  (${nombre}) ${r}`);
      }
    };
    const PISOS4 = [['piso-modular', 0, 0, 0, 0], ['piso-modular', 3, 0, 0, 0], ['piso-modular', 0, -3, 0, 0], ['piso-modular', 3, -3, 0, 0]];
    const PARED = [['pared-modular', 0, 1.4, 0, 1], ['pared-modular', 3, 1.4, 0, 1]];
    // ---- la sala
    if (escena('sala')) {
    const ss = await A('A.sitio("fuente-piedra", 30, 0)');
    ok(!!ss, 'hay lugar para la sala');
    await poner('sala', [...PISOS4,
      ['chimenea-salon', 1.5, 1.0, 0, 1], ['alfombra-tejida-grande', 1.5, -1.5, 0, 1], ['sillon-cuero', 0.2, -2.6, Math.PI, 1], ['sillon', 3.0, -2.6, Math.PI, 1],
      ['candelabro-pie', 0.1, 0.55, 0, 1], ['candelabro-pie', 2.9, 0.55, 0, 1], ['estanteria-roble', 4.3, -1.5, Math.PI / 2, 1], ['jarron-flores', 4.0, 1.0, 0, 1],
      ['gramola', -1.1, -1.5, -Math.PI / 2, 1], ['arana-velas', 1.5, -1.5, 0, 1]], ss);
    const y0 = await A(`A.alt(${ss.x}, ${ss.z})`);
    await A(`A.vista(${ss.x + 1.5}, ${y0 + 3.1}, ${ss.z - 9.0}, Math.PI, -0.3)`);
    await esperar(500);
    await foto('18-sala-completa');
    await A(`A.vista(${ss.x + 1.5}, ${y0 + 1.7}, ${ss.z - 3.3}, Math.PI, -0.12)`);
    await foto('19-chimenea-salon');
    await A('A.sinCamara()');
    }
    // ---- el dormitorio: la cama con dosel contra la pared, el armario, el biombo, el retrato y el aplique
    if (escena('dormitorio')) {
    await A('(A.limpiar(), 1)');
    const sd = await A('A.sitio("fuente-piedra", 30, 0)');
    ok(!!sd, 'hay lugar para el dormitorio');
    await poner('dormitorio', [...PISOS4, ...PARED,
      ['cama-dosel', 3.0, 0.2, 0, 1], ['armario-tallado', 0.1, 1.0, 0, 1], ['biombo-tallado', 0.9, -0.6, 0, 1], ['cuadro-retrato', 1.6, 1.3, 0, 0],
      ['candelabro-pared', -0.9, 1.3, 0, 0], ['candelabro-pie', 1.9, -0.4, 0, 1], ['jarron-flores', 4.1, 1.0, 0, 1], ['sillon-cuero', 3.2, -2.5, Math.PI, 1],
      ['alfombra-tejida-grande', 3.0, -1.6, 0, 1]], sd);
    const y1 = await A(`A.alt(${sd.x}, ${sd.z})`);
    await A(`A.vista(${sd.x + 1.5}, ${y1 + 3.1}, ${sd.z - 8.0}, Math.PI, -0.3)`);
    await esperar(500);
    await foto('20-dormitorio-completo');
    await A(`A.vista(${sd.x + 3.0}, ${y1 + 1.9}, ${sd.z - 4.6}, Math.PI, -0.18)`);
    await foto('21-cama-con-dosel');
    await A('A.sinCamara()');
    }
    // ---- el comedor: la mesa de banquete con el paisaje del valle en la pared y candelabros
    if (escena('comedor')) {
    await A('(A.limpiar(), 1)');
    const sc = await A('A.sitio("fuente-piedra", 30, 0)');
    ok(!!sc, 'hay lugar para el comedor');
    await poner('comedor', [['piso-modular', 0, 0, 0, 0], ['piso-modular', 3, 0, 0, 0], ['pared-modular', 0, 1.4, 0, 1], ['pared-modular', 3, 1.4, 0, 1],
      ['mesa-banquete', 1.5, -0.2, 0, 1], ['cuadro-valle', 1.5, 1.3, 0, 0], ['candelabro-pie', -1.0, 1.0, 0, 0], ['candelabro-pie', 4.0, 1.0, 0, 0],
      ['jarron-flores', 0.2, 1.05, 0, 1], ['candelabro-pared', 3.2, 1.3, 0, 0]], sc);
    const y2 = await A(`A.alt(${sc.x}, ${sc.z})`);
    await A(`A.vista(${sc.x + 1.5}, ${y2 + 2.6}, ${sc.z - 6.2}, Math.PI, -0.25)`);
    await esperar(500);
    await foto('22-comedor-con-mesa-de-banquete');
    await A('A.sinCamara()');
    }
    // ---- el patio: la pérgola con la mesa de campo debajo, la fuente, la estatua, los faroles y un jarrón
    if (escena('patio')) {
    await A('(A.limpiar(), 1)');
    const sp = await A('A.sitio("pergola-enredadera", 30, 0)');
    ok(!!sp, 'hay lugar para el patio');
    await poner('patio', [['pergola-enredadera', 0, 0, 0], ['mesa-campo', 0, 0, 0], ['fuente-piedra', 0, -7.0, 0], ['estatua-baqueano', 5.0, -4.0, 0],
      ['farol-hierro', -3.0, -4.0, 0], ['farol-hierro', 2.6, -4.0, 0], ['jarron-flores', -2.6, 1.0, 0]], sp);
    const y3 = await A(`A.alt(${sp.x}, ${sp.z})`);
    await A(`A.vista(${sp.x + 0.5}, ${y3 + 3.2}, ${sp.z - 14.5}, Math.PI, -0.18)`);
    await esperar(500);
    await foto('23-patio-completo');
    await A(`A.vista(${sp.x + 0.2}, ${y3 + 1.8}, ${sp.z - 6.0}, Math.PI, -0.1)`);
    await foto('24-pergola-de-cerca');
    await A('A.sinCamara()');
    }

    ok(errores.length === 0, `sin errores en la consola${errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''}`);
  } catch (e) {
    console.log('✗ ' + (e && e.stack || e));
    errores.push(String(e));
  }
  console.log(errores.length ? `FALLÓ (${errores.length})` : 'TODO BIEN');
  app.exit(errores.length ? 1 : 0);
});

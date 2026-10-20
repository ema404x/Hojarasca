// Partida real 4.4 (Electron + WebGL): comprar el negocio de un vecino y ser su socio, con las teclas de verdad (la rueda de la charla).
//   · «Hablar de su negocio» (en «Hacer juntos») con distintas amistades: Rosa de desconocida se niega; Lucrecia con poca confianza se ofende y te tiene
//     menos confianza; Ercilia, de amiga pero sin saber su historia, pide que antes la escuches; Aurelio de amigo pide más y se va a otra orilla;
//   · cerrar el trato: Ercilia, de compadre, vende el almacén y se queda de empleada; Anselmo, de amigo, vende la herrería y se va a la plaza;
//   · el cartel nuevo junto a la puerta, la billetera, el aviso de cada día, la caja que se retira, las cuentas;
//   · la sociedad con Elvira (poner plata, tu parte por día, avisar el retiro y que la devolución llegue) y el gerente que lleva las cuentas;
//   · el cuaderno («Negocios y sociedades»), el guardado y recargar, y que el almacén de Ercilia siga atendiendo como antes.
// Uso (desde la carpeta del proyecto, después de `node armar.mjs`):
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-4-compra.cjs -Espera 1500 -Arg1 --salida=C:\carpeta
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const salida = path.resolve(arg('salida', path.join(raiz, 'pruebas', 'salidas', 'compra')));
const [ANCHO, ALTO] = arg('tam', '1366x768').split('x').map(Number);
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, P = H.progreso, J = H.jugador;
  const A = window.__A = {};
  H.ajustes.limiteFps = 'libre';
  A.dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  A.tecla = (code) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true })); return 1; };
  A.cuadros = async (n = 6, ms = 90) => { for (let i = 0; i < n; i++) { J.actualizar(0.05); H.__bucle(); await A.dormir(ms); } return 1; };
  A.tp = (x, z, yaw = 0) => { if (J.estado.sentado) J.sentarse(false); J.ubicar(x, z, yaw); for (let i = 0; i < 6; i++) J.actualizar(0.05); return 1; };
  A.mirarA = (x, z) => { const js = J.estado; js.yaw = Math.atan2(-(x - js.pos.x), -(z - js.pos.z)); return 1; };
  A.notas = () => [...document.querySelectorAll('#notas .nota')].map((n) => n.textContent.replace(/\s+/g, ' ').trim());
  A.limpiarNotas = () => { document.querySelectorAll('#notas .nota').forEach((n) => n.remove()); return 1; };
  A.aviso = () => document.getElementById('aviso')?.textContent.replace(/\s+/g, ' ').trim() || '';
  A.montar = () => { const AM = H.__aldeaMundo(); let n = 0; while (AM.medir().cola > 0 && n < 300) { AM.montarCola(true); n++; } H.__aldea.mundo().prearmar(120000); for (let k = 0; k < 6; k++) H.__aldea.actualizar(0.6); return n; };
  A.npc = (clave) => H.gente.gente.find((g) => (g.claveAldea || g.clave) === clave) || H.__aldea.figura?.(clave) || null;
  A.dia = (dia, hora) => { P.dia = dia; P.horas = hora; for (let k = 0; k < 4; k++) H.__aldea.actualizar(0.6); return 1; };
  // el vecino quieto en su sitio y vos enfrente, mirándolo
  A.frente = (clave, d = 1.7) => { const n = A.npc(clave); if (!n) return false; n.camino = []; n.ruta = null; n.pose = null; n.dormido = false; n.vel = 0; n.charlaVecinos = false; const x = n.pos.x, z = n.pos.z, px = x, pz = z + d; J.ubicar(px, pz, Math.atan2(-(x - px), -(z - pz))); J.estado.pitch = -0.08; J.estado.sentado = false; return true; };
  A.hablar = (clave) => { const n = A.npc(clave); if (!n) return false; H.__hablar(n); return true; };
  A.vista = () => { const c = document.getElementById('charla'); return { abierta: !c.classList.contains('oculto'), quien: document.getElementById('charla-quien').textContent, texto: document.getElementById('charla-texto').textContent.replace(/\s+/g, ' ').trim(), rueda: H.__rueda() }; };
  A.amistad = (clave, p, hist) => { const f = P.vecindad?.personas?.[clave]; if (!f) return false; f.p = p; f.max = Math.max(f.max || 0, p >= 140 ? 2 : p >= 50 ? 1 : 0); f.hist = hist; return true; };
  A.puntos = (clave) => P.vecindad?.personas?.[clave]?.p ?? null;
  A.negocios = () => P.negociosVecinos;
  A.cartelEn = (id) => { const NV = H.__negociosVecinos(); const l = NV.lugarCartel(id); if (!l) return null; return { x: l.x, y: l.y, z: l.z, giro: l.giro, cx: l.cx, cz: l.cz }; };
  A.verCartel = (id, dist = 3.2) => { const l = A.cartelEn(id); if (!l) return 0; const sx = Math.sin(l.giro), sz = Math.cos(l.giro); A.tp(l.x + sx * dist, l.z + sz * dist, 0); A.mirarA(l.x, l.z); J.estado.pitch = -0.04; return 1; };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [];
  const N = await import(pathToFileURL(path.join(raiz, 'src', 'negocios-vecinos.js')).href);
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
  const A = (c) => js(`(()=>{ const A = window.__A, H = window.__hojarasca, P = H.progreso; return (${c}) })()`);
  const foto = async (nombre) => {
    await A('A.cuadros(3, 120)'); await esperar(300);
    w.webContents.invalidate();
    await js(`Promise.race([new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(()=>r('ok')))), new Promise((r)=>setTimeout(()=>r('sin cuadros'),1500))])`);
    let img = null;
    for (let i = 0; i < 4 && !img; i++) { try { img = await w.webContents.capturePage({ x: 0, y: 0, width: ANCHO, height: ALTO }); } catch (e) { console.log('  (capturePage falló: ' + e.message + '; reintento)'); await esperar(700); await A('A.cuadros(3, 100)'); } }
    if (!img) { console.log('  (sin captura de ' + nombre + ')'); return; }
    const s = img.getSize();
    const png = (s.width === ANCHO && s.height === ALTO ? img : img.resize({ width: ANCHO, height: ALTO, quality: 'best' })).toPNG();
    fs.writeFileSync(path.join(salida, `${nombre}.png`), png);
    console.log(`  captura ${nombre}.png (${s.width}×${s.height})`);
  };
  w.webContents.on('did-finish-load', () => w.webContents.enableDeviceEmulation({ screenPosition: 'desktop', screenSize: { width: ANCHO, height: ALTO }, viewSize: { width: ANCHO, height: ALTO }, deviceScaleFactor: 1, viewPosition: { x: 0, y: 0 }, scale: 1 }));
  w.webContents.on('did-finish-load', () => w.webContents.insertCSS('*, *::before, *::after { transition: none !important; } #pista-clic { display: none !important; }'));
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const H = 'window.__hojarasca';
  const pesos = (n) => `$${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  const notasTxt = async () => (await A('A.notas()')).join(' | ');
  const tecla = (code) => A(`A.tecla(${JSON.stringify(code)})`);
  const listo = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.jugador && ${H}.__negociosVecinos && ${H}.__negociosVecinos())`).catch(() => false)) return true; } return false; };
  // elegir con el número del sector (en la rueda que está abierta)
  const numero = async (re) => { const r = await A('H.__rueda()'); const i = r.sectores.findIndex((s) => re.test(s.titulo)); if (i < 0 || i > 8) return { error: `no está ${re} en ${r.sectores.map((s) => s.titulo).join(' / ')}` }; await tecla(`Digit${i + 1}`); await A('A.cuadros(2, 60)'); return A('A.vista()'); };
  const hastaRueda = async (max = 12) => { let v = await A('A.vista()'); for (let i = 0; i < max && v.abierta && !v.rueda.abierta; i++) { await tecla('KeyE'); await A('A.cuadros(2, 60)'); v = await A('A.vista()'); } return v; };
  const leer = async (max = 8) => { const t = []; let v = await A('A.vista()'); for (let i = 0; i < max && v.abierta && !v.rueda.abierta; i++) { t.push(v.texto); await tecla('KeyE'); await A('A.cuadros(2, 60)'); v = await A('A.vista()'); } return { renglones: t, v }; };
  const cerrar = async () => { await js(`${H}.__cerrarCharla(); 1`); await A('A.cuadros(3, 60)'); };
  // abrir la charla con el vecino y llegar a la rueda
  const hablarCon = async (clave) => {
    await A(`A.frente(${JSON.stringify(clave)})`);
    await A('A.cuadros(6, 100)');
    await A(`A.hablar(${JSON.stringify(clave)})`);
    await A('A.cuadros(2, 60)');
    return hastaRueda();
  };
  // «Hablar de su negocio» (en Hacer juntos) → deja el submenú de su negocio abierto
  const alNegocio = async (clave) => {
    let v = await hablarCon(clave);
    if (!v.rueda.abierta) return { error: 'no hay rueda' };
    v = await numero(/Hacer juntos/);
    if (v.error) return v;
    v = await numero(/Hablar de su negocio/);
    return v;
  };
  const hacia = async (re) => numero(re);

  const confCuaderno = async (re) => { await tecla('KeyJ'); await esperar(500); await A('(H.__aldea.oficios().elegir("negocios-vecinos"), H.__aldea.cuaderno("oficios"), 1)'); await esperar(400); const t = await js(`document.getElementById('cuaderno').textContent.replace(/\\s+/g, ' ')`); return t; };

  try {
    seccion('carga');
    await abrir();
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'media', clima: 'despejado', estacion: 'verano', musica: false, modo: 'relax', relaxTipo: 'libre', autoCalidad: false, guiaPrimerDia: false, idioma: 'es', limiteFps: 'libre', ritmoAldea: 'animado' })); 1`);
    await abrir();
    ok(await listo(), 'carga el Relax con los negocios de los vecinos');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(4000);
    await js(PAGINA);
    ok(await A('!!P.economia && P.modo !== "desafio" && !!H.__negociosVecinos()'), 'la partida es del Relax y trae los negocios armados');
    ok(await A('P.negociosVecinos && Object.keys(P.negociosVecinos.comprados).length === 0 && Object.keys(P.negociosVecinos.socios).length === 0'), 'la partida nueva no tiene ningún negocio ni sociedad');
    // los pobladores instalados, con sus locales abiertos
    await A(`(() => { const a = P.aldea; const L = { carpintero: 'carpinteria', panadera: 'panaderia', herrero: 'herreria', pescador: 'pescaderia', maestra: 'escuela', enfermera: 'puesto-sanitario', telegrafista: 'estafeta', tejedora: 'hilanderia', apicultor: 'sala-miel', guardaparque: 'seccional', musico: 'salon' };
      a.pobladores = Object.keys(L).map((clave) => ({ clave, dia: 1 })); a.obras = {}; a.llegando = null; a.locales = Object.fromEntries(Object.values(L).map((l) => [l, 1])); a.descubierta = 1;
      P.dia = 6; P.horas = 11; P.economia.pesos = 700000; return 1 })()`);
    const p0 = await A('(H.jugador.ubicar(H.__aldea.edificio("plaza").x, H.__aldea.edificio("plaza").z, 0), 1)');
    await A('A.montar()');
    await A('(A.dia(6, 11), A.cuadros(8, 100), 1)');
    ok(await A('H.__negociosVecinos().mundo() !== undefined'), 'el sistema de los negocios está andando');

    // ---------------------------------------------------------------- 1. con la amistad de cada uno
    seccion('Rosa: de desconocida, se niega');
    let v = await alNegocio('panadera');
    ok(!v.error && v.rueda.tipo === 'lista', `«Hablar de su negocio» está en «Hacer juntos» y abre un submenú (${v.error || v.rueda.sectores.map((s) => s.titulo).join(' / ')})`);
    ok(/precio de lista \$80\.000/.test(v.texto) && /de \$8\.000 a \$32\.000/.test(v.texto), `el submenú dice el precio de lista y el rango de socio («${v.texto.slice(0, 130)}»)`);
    await foto('01-rosa-submenu-de-su-negocio');
    await A('A.amistad("panadera", 5, 0)');
    v = await hacia(/Comprarle la panadería/);
    let t = await leer();
    ok(/no se vende/.test(t.renglones.join(' ')), `Rosa de desconocida: «${t.renglones[0]}»`);
    await foto('02-rosa-se-niega');
    ok((await A('P.negociosVecinos.rechazos.panaderia')) === 7, 'y no quiere hablar de eso hasta mañana');
    await cerrar();

    seccion('Lucrecia: con poca confianza, se ofende');
    await A('A.dia(6, 19.5)');
    v = await alNegocio('moza');
    ok(!v.error, `Lucrecia ofrece «Hablar de su negocio» (${v.error || ''})`);
    await A('A.amistad("moza", 10, 0)');
    const antesMoza = await A('A.puntos("moza")');
    await hacia(/Comprarle la cantina/);
    t = await leer();
    ok(/Me ofendiste/.test(t.renglones.join(' ')), `Lucrecia: «${t.renglones[0].slice(0, 110)}…»`);
    await foto('03-lucrecia-se-ofende');
    ok((await A('A.puntos("moza")')) === antesMoza - 3, `y te tiene 3 puntos menos de confianza (${antesMoza} → ${await A('A.puntos("moza")')})`);
    ok((await A('P.negociosVecinos.rechazos.cantina')) === 10, 'cuatro días sin querer hablar del tema');
    await cerrar();

    seccion('Ercilia: de amiga, pide que antes la escuches');
    await A('A.dia(6, 16.5)');
    v = await alNegocio('ercilia');
    ok(!v.error, `Ercilia ofrece «Hablar de su negocio» (${v.error || ''})`);
    await A('A.amistad("ercilia", 60, 0)');
    await hacia(/Comprarle el almacén/);
    t = await leer();
    ok(/Tu historia/.test(t.renglones.join(' ')), `Ercilia: «${t.renglones[0].slice(0, 120)}…»`);
    await foto('04-ercilia-pide-su-historia');
    ok((await A('P.negociosVecinos.rechazos.almacen === undefined')), 'sin esperar: podés volver cuando la hayas escuchado');
    await cerrar();

    seccion('Aurelio: de amigo pide más y se va a otra orilla');
    await A('A.dia(6, 11)');
    v = await alNegocio('pescador');
    ok(!v.error, `Aurelio ofrece «Hablar de su negocio» (${v.error || ''})`);
    await A('A.amistad("pescador", 60, 0)');
    await hacia(/Comprarle la pescadería/);
    v = await A('A.vista()');
    ok(/\$102\.000/.test(v.texto) && /otra orilla/.test(v.texto) && v.rueda.sectores.some((s) => /Cerrar el trato: \$102\.000/.test(s.titulo)), `Aurelio pide $102.000 (20 % más) y ofrece cerrar el trato («${v.texto.slice(0, 130)}»)`);
    await foto('05-aurelio-pide-mas');
    await hacia(/Pensarlo/);
    t = await leer(3);
    ok((await A('P.economia.pesos')) === 700000 && (await A('Object.keys(P.negociosVecinos.comprados).length')) === 0, 'si lo pensás, no se pagó nada');
    await cerrar();

    // ---------------------------------------------------------------- 2. comprar
    seccion('Ercilia vende el almacén y se queda de empleada');
    await A('A.dia(6, 16.5)');
    v = await alNegocio('ercilia');
    await A('A.amistad("ercilia", 160, 3)');
    await hacia(/Comprarle el almacén/);
    v = await A('A.vista()');
    ok(/sos de la casa/.test(v.texto) && v.rueda.sectores.some((s) => /Cerrar el trato: \$150\.000/.test(s.titulo)), `Ercilia, de compadre con toda su historia, lo deja en $150.000 (${v.texto.slice(0, 100)}…)`);
    await foto('06-ercilia-acepta');
    const pesosAntes = await A('P.economia.pesos');
    await hacia(/Cerrar el trato/);
    t = await leer();
    ok(/delantal/.test(t.renglones.join(' ')) && /empleada/.test(t.renglones.join(' ')), `Ercilia se emociona y se queda («${t.renglones[0].slice(0, 100)}…»)`);
    await foto('07-ercilia-cierre');
    ok((await A('P.economia.pesos')) === pesosAntes - 150000, `se pagaron $150.000 (billetera ${pesos(pesosAntes)} → ${pesos(await A('P.economia.pesos'))})`);
    ok(await A('!!P.negociosVecinos.comprados.almacen && P.negociosVecinos.comprados.almacen.destino === "queda"'), 'el almacén es tuyo y Ercilia se queda');
    const nt = await notasTxt();
    ok(/El almacén de Ercilia ahora es tuyo/.test(nt) && /\$150\.000/.test(nt), `el aviso: «${nt.slice(0, 150)}»`);
    await cerrar();
    // el cartel
    const cart = await A('A.cartelEn("almacen")');
    ok(!!cart, 'hay un lugar para el cartel junto a la puerta');
    await A('(A.dia(6, 16.5), A.verCartel("almacen", 3.4), A.cuadros(10, 110), 1)');
    ok(await A('H.__negociosVecinos().mundo().carteles().includes("almacen") && H.__negociosVecinos().mundo().cartel("almacen").visible'), 'el cartel nuevo se ve de cerca');
    await foto('08-almacen-cartel-nuevo');
    await A('(A.verCartel("almacen", 1.8), A.cuadros(6, 110), 1)');
    await foto('08b-almacen-cartel-de-cerca');
    // el almacén sigue atendiendo como siempre
    seccion('el almacén sigue andando como hoy');
    const mostrador = await A('(() => { const m = H.est.almacen.mostrador || H.est.almacen; return { x: m.x, z: m.z } })()');
    await A(`(A.tp(${mostrador.x}, ${mostrador.z} + 1.3, 0), A.mirarA(${mostrador.x}, ${mostrador.z}), A.cuadros(10, 110), 1)`);
    const av = await A('A.aviso()');
    ok(/almacén|mostrador|Ercilia/i.test(av), `junto al mostrador, el aviso de siempre (${av})`);
    await foto('09-almacen-mostrador-de-siempre');
    ok(await A('H.__empleo().accion(H.jugador.estado)?.tipo !== "ficha"'), 'y el cartel de turnos ya no te toma de empleado en tu propio almacén');

    seccion('Anselmo vende la herrería y se va a la plaza');
    await A('A.dia(7, 11)');
    v = await alNegocio('herrero');
    await A('A.amistad("herrero", 60, 1)');
    await hacia(/Comprarle la herrería/);
    v = await A('A.vista()');
    ok(/Cerrar el trato: \$180\.000/.test(JSON.stringify(v.rueda.sectores)), `Anselmo, de amigo, pide $180.000 (${v.texto.slice(0, 100)}…)`);
    await hacia(/Cerrar el trato/);
    t = await leer();
    ok(/probar suerte|por mi cuenta/.test(t.renglones.join(' ')), `Anselmo se va (${t.renglones[0].slice(0, 100)}…)`);
    await foto('10-anselmo-se-va');
    ok(await A('P.negociosVecinos.comprados.herreria.destino === "se-va" && H.__negociosVecinos()._idos().includes("herrero")'), 'queda anotado: Anselmo se fue a otra cosa');
    await cerrar();
    await A('(A.dia(8, 14), A.tp(H.__aldea.edificio("plaza").x + 6, H.__aldea.edificio("plaza").z + 9, 3.14), 1)');
    for (let i = 0; i < 120; i++) await A('(H.__aldea.actualizar(2), A.cuadros(1, 30), 1)');
    const ansel = await A('(() => { const n = A.npc("herrero"); const p = H.__aldea.edificio("plaza"); return n ? { x: n.pos.x, z: n.pos.z, dPlaza: Math.hypot(n.pos.x - p.x, n.pos.z - p.z), dHerreria: (() => { const q = H.__aldea.edificio("herreria"); return Math.hypot(n.pos.x - q.x, n.pos.z - q.z); })(), dest: JSON.stringify(n.destino || n.dest || null).slice(0, 150), pose: n.pose || null, jx: H.jugador.estado.pos.x - p.x, jz: H.jugador.estado.pos.z - p.z } : null })()');
    ok(ansel && ansel.dHerreria > 30 && ansel.dPlaza < 40, `a las 14 Anselmo ya no está en su herrería (a ${ansel ? ansel.dHerreria.toFixed(0) : '?'} m) sino en la plaza (a ${ansel ? ansel.dPlaza.toFixed(1) : '?'} m del centro; ${JSON.stringify(ansel)})`);
    await A('(A.tp(H.__aldea.edificio("plaza").x + 6, H.__aldea.edificio("plaza").z + 9, 3.14), A.cuadros(8, 110), 1)');
    await foto('11-anselmo-en-la-plaza');
    await A('A.cartelEn("herreria") && (A.verCartel("herreria", 3.4), A.cuadros(10, 110), 1)');
    await foto('12-herreria-cartel-nuevo');

    // ---------------------------------------------------------------- 3. los días y la caja
    seccion('lo que rinde cada día');
    await A('(A.dia(9, 9), A.limpiarNotas(), 1)');
    await A('A.cuadros(30, 60)');
    let nts = await notasTxt();
    ok(/rindi/.test(nts) && /esperando en las cajas/.test(nts), `al otro día, el aviso de lo que rindió («${nts.slice(0, 160)}»)`);
    const cajaAlm = await A('P.negociosVecinos.comprados.almacen.caja');
    ok(cajaAlm > 0, `en la caja del almacén hay ${pesos(cajaAlm)}`);
    await foto('13-aviso-de-ganancias');
    await A('(A.dia(12, 9), 1)'); await A('A.cuadros(30, 60)');
    const cajaDespues = await A('P.negociosVecinos.comprados.almacen.caja');
    ok(cajaDespues > cajaAlm, `tres días después, la caja sigue creciendo (${pesos(cajaAlm)} → ${pesos(cajaDespues)})`);
    // retirar la caja con la charla
    await A('A.dia(12, 16.5)');
    v = await alNegocio('ercilia');
    ok(v.rueda.sectores.some((s) => /Retirar la caja/.test(s.titulo)), `en el submenú: «${v.rueda.sectores.map((s) => s.titulo).join(' / ')}»`);
    await foto('14-ercilia-retirar-la-caja');
    const pesosCaja = await A('P.economia.pesos');
    await hacia(/Retirar la caja/);
    t = await leer();
    ok((await A('P.economia.pesos')) === pesosCaja + cajaDespues, `retirar la caja: la billetera sube ${pesos(cajaDespues)} («${t.renglones[0].slice(0, 70)}…»)`);
    ok((await A('P.negociosVecinos.comprados.almacen.caja')) === 0, 'la caja queda vacía');
    // las cuentas
    v = await A('A.vista()');
    await hacia(/Hablar de su negocio/).catch(() => 0);
    await cerrar();
    v = await alNegocio('ercilia');
    await hacia(/Cómo viene el negocio/);
    t = await leer();
    ok(t.renglones.length >= 3 && /vendimos/.test(t.renglones[0]) && /a sueldo/.test(t.renglones.join(' ')), `las cuentas de Ercilia: «${t.renglones[0].slice(0, 100)}…»`);
    await foto('15-ercilia-las-cuentas');
    await cerrar();

    // ---------------------------------------------------------------- 4. la sociedad
    seccion('Elvira: la sociedad');
    await A('A.dia(12, 11)');
    v = await alNegocio('tejedora');
    await A('A.amistad("tejedora", 70, 1)');
    await hacia(/Proponerle ser socio/);
    v = await A('A.vista()');
    ok(/de \$11\.000 a \$44\.000/.test(v.texto) && v.rueda.sectores.filter((s) => /Poner/.test(s.titulo)).length === 3, `tres montos entre $11.000 y $44.000 («${v.rueda.sectores.map((s) => s.titulo).join(' / ')}»)`);
    await foto('16-elvira-cuanto-poner');
    const pesosSocio = await A('P.economia.pesos');
    await hacia(/Poner \$28\.000/);
    t = await leer();
    ok(/22,9 %/.test(t.renglones[0]) && (await A('P.economia.pesos')) === pesosSocio - 28000, `pusiste $28.000 y te toca el 22,9 % («${t.renglones[0].slice(0, 100)}»)`);
    await foto('17-elvira-socia');
    ok(await A('!!P.negociosVecinos.socios.hilanderia && P.negociosVecinos.socios.hilanderia.aporte === 28000'), 'sos socio de la hilandería');
    await cerrar();
    await A('(A.dia(15, 9), 1)'); await A('A.cuadros(30, 60)');
    const parteHil = await A('P.negociosVecinos.socios.hilanderia.caja');
    ok(parteHil > 0, `tres días después, tu parte en la caja: ${pesos(parteHil)}`);
    // avisar el retiro
    await A('A.dia(15, 11)');
    v = await alNegocio('tejedora');
    ok(v.rueda.sectores.some((s) => /Avisar que me retiro/.test(s.titulo)), 'siendo socio, el submenú trae «Avisar que me retiro»');
    await hacia(/Avisar que me retiro/);
    t = await leer();
    ok(t.renglones.length === 2 && /efectivo el día 17/.test(t.renglones[1]), `avisás el retiro: sale el día 17 («${t.renglones[1].slice(0, 110)}…»)`);
    await foto('18-elvira-aviso-de-retiro');
    await cerrar();
    const pesosAntesRetiro = await A('P.economia.pesos');
    await A('(A.dia(17, 9), 1)'); await A('A.cuadros(30, 60)');
    nts = await notasTxt();
    ok(/Te retiraste de la sociedad de la hilandería/.test(nts), `el día 17 se hace efectivo («${nts.slice(0, 150)}»)`);
    ok(!(await A('!!P.negociosVecinos.socios.hilanderia')) && (await A('P.economia.pesos')) >= pesosAntesRetiro + 16800, `y cobraste el 60 % del aporte (devolución de ${pesos(16800)} o más: billetera ${pesos(pesosAntesRetiro)} → ${pesos(await A('P.economia.pesos'))})`);

    // ---------------------------------------------------------------- 5. el gerente y el cuaderno
    seccion('el gerente y el cuaderno');
    await A('A.dia(17, 10)');
    v = await hablarCon('gerente');
    ok(v.rueda.abierta, 'el gerente abre su rueda');
    let r = await A('H.__rueda()');
    v = await numero(/Charlar/);
    ok(v.rueda.sectores.some((s) => /Hablar de negocios/.test(s.titulo)), `Amadeo ofrece «Hablar de negocios» (${v.rueda.sectores.map((s) => s.titulo).join(' / ')})`);
    await numero(/Hablar de negocios/);
    t = await leer(8);
    ok(/Veamos sus cuentas/.test(t.renglones.join(' ')) && /sus cuentas|tuya|tuyo/.test(t.renglones.join(' ')), `el gerente lleva las cuentas (${t.renglones.length} renglones)`);
    await foto('19-gerente-las-cuentas');
    await cerrar();
    const cuad = await confCuaderno();
    ok(cuad.includes('Negocios y sociedades') && /El almacén de Ercilia/.test(cuad) && /La herrería de Anselmo/.test(cuad), 'el cuaderno trae «Negocios y sociedades» con lo tuyo');
    ok(/Para comprar o asociarse/.test(cuad) && /Últimos movimientos/.test(cuad), 'con lo que se puede comprar y los últimos movimientos');
    await foto('20-cuaderno-negocios');
    await tecla('KeyJ'); await esperar(400);

    // ---------------------------------------------------------------- 6. guardar y recargar
    seccion('guardar y recargar');
    await A('H.guardar()'); await esperar(600);
    const antesGuardar = await A('({ comprados: Object.keys(P.negociosVecinos.comprados).sort(), pagado: P.negociosVecinos.comprados.almacen.pagado, caja: P.negociosVecinos.comprados.herreria.caja })');
    await abrir();
    ok(await listo(), 'recarga');
    await js(`document.getElementById('btn-continuar')?.click(); 1`).catch(() => 0);
    await esperar(4000);
    await js(PAGINA);
    const despuesGuardar = await A('({ comprados: Object.keys(P.negociosVecinos.comprados).sort(), pagado: P.negociosVecinos.comprados.almacen?.pagado, caja: P.negociosVecinos.comprados.herreria?.caja })');
    ok(JSON.stringify(despuesGuardar.comprados) === JSON.stringify(antesGuardar.comprados) && despuesGuardar.pagado === antesGuardar.pagado, `los negocios sobreviven al guardado (${despuesGuardar.comprados.join(', ')})`);
    ok(await A('H.__negociosVecinos()._idos().includes("herrero")'), 'y Anselmo sigue en la plaza');
    await A('A.montar()');
    await A('(A.dia(P.dia, 16.5), A.verCartel("almacen", 3.4), A.cuadros(12, 110), 1)');
    ok(await A('H.__negociosVecinos().mundo().carteles().includes("almacen") && H.__negociosVecinos().mundo().carteles().includes("herreria")'), 'y los dos carteles vuelven a estar');
    await foto('21-almacen-cartel-tras-recargar');

    ok(errores.length === 0, `sin errores en la consola${errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''}`);
  } catch (e) {
    console.log('✗ ' + (e && e.stack || e));
    errores.push(String(e));
  }
  console.log(errores.length ? `FALLÓ (${errores.length})` : 'TODO BIEN');
  app.exit(errores.length ? 1 : 0);
});

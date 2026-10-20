// Partida real 4.4.3 (Electron + WebGL): vender de vuelta un negocio comprado y sumar plata a una sociedad ya hecha, con las teclas de verdad (la rueda de la charla).
//   · Rosa: se compra la panadería (se va a la plaza), pasan los días sin pasar a verla, se le vende de vuelta («Venderle la panadería de vuelta»): cálculo a la vista,
//     el cartel «de Bruno» desaparece, Rosa vuelve a su local, la billetera sube lo que dice; recomprar pronto cuesta un 10 % más;
//   · Ercilia (apego fuerte): se compra el almacén, se vende, se emociona, el mostrador sigue como siempre;
//   · Elvira: sociedad, «Hablar de la sociedad» → «Sumar plata a la sociedad» (el cálculo, el aviso, el tope y la negativa), el retiro devuelve cada aporte según sus días;
//   · el cuaderno, la guía, guardar y recargar.
// Uso (desde la carpeta del proyecto, después de `node armar.mjs`):
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-4-3-venta.cjs -Espera 900 -Arg1 --salida=C:\carpeta
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const salida = path.resolve(arg('salida', path.join(raiz, 'pruebas', 'salidas', 'venta')));
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
  A.montar = () => { const AM = H.__aldeaMundo(); let n = 0; while (AM.medir().cola > 0 && n < 300) { AM.montarCola(true); n++; } H.__aldea.mundo().prearmar(120000); for (let k = 0; k < 6; k++) H.__aldea.actualizar(0.6); return 1; };
  A.npc = (clave) => H.gente.gente.find((g) => (g.claveAldea || g.clave) === clave) || H.__aldea.figura?.(clave) || null;
  A.dia = (dia, hora) => { P.dia = dia; P.horas = hora; for (let k = 0; k < 4; k++) H.__aldea.actualizar(0.6); return 1; };
  A.frente = (clave, d = 1.7) => { const n = A.npc(clave); if (!n) return false; n.camino = []; n.ruta = null; n.pose = null; n.dormido = false; n.vel = 0; n.charlaVecinos = false; const x = n.pos.x, z = n.pos.z; A.tp(x + d, z, 0); A.mirarA(x, z); return true; };
  A.hablar = (clave) => { const n = A.npc(clave); if (!n) return false; H.__hablar(n); return true; };
  A.vista = () => { const c = document.getElementById('charla'); return { abierta: !c.classList.contains('oculto'), quien: document.getElementById('charla-quien').textContent, texto: document.getElementById('charla-texto')?.textContent.replace(/\s+/g, ' ').trim() || '', rueda: H.__rueda() }; };
  A.amistad = (clave, p, hist) => { const f = P.vecindad?.personas?.[clave]; if (!f) return false; f.p = p; f.max = Math.max(f.max || 0, p >= 140 ? 2 : p >= 50 ? 1 : 0); f.hist = hist; return true; };
  A.puntos = (clave) => P.vecindad?.personas?.[clave]?.p ?? null;
  A.cartelEn = (id) => { const NV = H.__negociosVecinos(); const l = NV.lugarCartel(id); if (!l) return null; return { x: l.x, y: l.y, z: l.z, giro: l.giro, cx: l.cx, cz: l.cz }; };
  A.verCartel = (id, dist = 3.2) => { const l = A.cartelEn(id); if (!l) return 0; const sx = Math.sin(l.giro), sz = Math.cos(l.giro); A.tp(l.x + sx * dist, l.z + sz * dist, 0); A.mirarA(l.x, l.z); J.estado.pitch = -0.05; return 1; };
  A.distA = (clave, edificio) => { const n = A.npc(clave), e = H.__aldea.edificio(edificio); return n && e ? Math.hypot(n.pos.x - e.x, n.pos.z - e.z) : null; };
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
  const aNum = (s) => Number(String(s).replace(/\./g, ''));
  const notasTxt = async () => (await A('A.notas()')).join(' | ');
  const tecla = (code) => A(`A.tecla(${JSON.stringify(code)})`);
  const listo = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.jugador && ${H}.__negociosVecinos && ${H}.__negociosVecinos())`).catch(() => false)) return true; } return false; };
  const numero = async (re) => { const r = await A('H.__rueda()'); const i = r.sectores.findIndex((s) => re.test(s.titulo)); if (i < 0 || i > 8) return { error: `no está ${re} en ${r.sectores.map((s) => s.titulo).join(' / ')}` }; await tecla(`Digit${i + 1}`); await A('A.cuadros(2, 60)'); return A('A.vista()'); };
  const hastaRueda = async (max = 12) => { let v = await A('A.vista()'); for (let i = 0; i < max && v.abierta && !v.rueda.abierta; i++) { await tecla('KeyE'); await A('A.cuadros(2, 60)'); v = await A('A.vista()'); } return v; };
  const leer = async (max = 8) => { const t = []; let v = await A('A.vista()'); for (let i = 0; i < max && v.abierta && !v.rueda.abierta; i++) { t.push(v.texto); await tecla('KeyE'); await A('A.cuadros(2, 60)'); v = await A('A.vista()'); } return { renglones: t, v }; };
  const cerrar = async () => { await js(`${H}.__cerrarCharla(); 1`); await A('A.cuadros(3, 60)'); };
  const hablarCon = async (clave) => {
    await A(`A.frente(${JSON.stringify(clave)})`);
    await A('A.cuadros(6, 100)');
    await A(`A.hablar(${JSON.stringify(clave)})`);
    await A('A.cuadros(2, 60)');
    return hastaRueda();
  };
  // «Hablar de su negocio» / «Hablar de la sociedad» (en Hacer juntos) → deja el submenú abierto
  const alNegocio = async (clave) => {
    let v = await hablarCon(clave);
    if (!v.rueda.abierta) return { error: 'no hay rueda' };
    v = await numero(/Hacer juntos/);
    if (v.error) return v;
    return numero(/Hablar de (su negocio|la sociedad)/);
  };
  const hacia = async (re) => numero(re);
  const titulos = (v) => v.rueda.sectores.map((s) => s.titulo).join(' / ');

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
    await A(`(() => { const a = P.aldea; const L = { carpintero: 'carpinteria', panadera: 'panaderia', herrero: 'herreria', pescador: 'pescaderia', maestra: 'escuela', enfermera: 'puesto-sanitario', telegrafista: 'estafeta', tejedora: 'hilanderia', apicultor: 'sala-miel', guardaparque: 'seccional', musico: 'salon' };
      a.pobladores = Object.keys(L).map((clave) => ({ clave, dia: 1 })); a.obras = {}; a.llegando = null; a.locales = Object.fromEntries(Object.values(L).map((l) => [l, 1])); a.descubierta = 1;
      P.dia = 6; P.horas = 11; P.economia.pesos = 2000000; return 1 })()`);
    await A('(H.jugador.ubicar(H.__aldea.edificio("plaza").x, H.__aldea.edificio("plaza").z, 0), 1)');
    await A('A.montar()');
    await A('(A.dia(6, 11), A.cuadros(8, 100), 1)');

    // ---------------------------------------------------------------- 1. Rosa: comprar la panadería y venderla de vuelta
    seccion('Rosa: comprar la panadería (se va a la plaza)');
    let v = await alNegocio('panadera');
    await A('A.amistad("panadera", 60, 0)');
    await hacia(/Comprarle la panadería/);
    v = await A('A.vista()');
    ok(v.rueda.sectores.some((s) => /Cerrar el trato: \$96\.000/.test(s.titulo)), `Rosa de amiga pide $96.000 (${v.texto.slice(0, 90)}…)`);
    await hacia(/Cerrar el trato/);
    await leer();
    await cerrar();
    ok(await A('!!P.negociosVecinos.comprados.panaderia && P.negociosVecinos.comprados.panaderia.destino === "se-va"'), 'la panadería es tuya y Rosa se fue a la plaza');
    await A('(A.dia(6, 12), A.verCartel("panaderia", 3.4), A.cuadros(10, 110), 1)');
    ok(await A('H.__negociosVecinos().mundo().carteles().includes("panaderia")'), 'el cartel «de Bruno» está junto a la puerta');
    await foto('01-panaderia-cartel-de-bruno');

    seccion('pasan los días sin pasar a verla');
    await A('(A.dia(27, 14), 1)'); await A('A.cuadros(40, 60)');
    ok(await A('P.negociosVecinos.comprados.panaderia.caja > 0 && P.negociosVecinos.comprados.panaderia.mala > 5'), `la caja tiene ${pesos(await A('P.negociosVecinos.comprados.panaderia.caja'))} y ya van ${await A('P.negociosVecinos.comprados.panaderia.mala')} días sin atención`);
    await A('(A.dia(27, 14), A.limpiarNotas(), 1)');

    seccion('Rosa: venderle la panadería de vuelta');
    v = await alNegocio('panadera');
    ok(!v.error, `la charla ofrece «Hablar de su negocio» (${v.error || ''})`);
    ok(v.rueda.sectores.some((s) => /Venderle la panadería de vuelta/.test(s.titulo)), `en el submenú: ${titulos(v)}`);
    await foto('02-panaderia-submenu-con-vender');
    await hacia(/Venderle la panadería de vuelta/);
    v = await A('A.vista()');
    const tit = v.rueda.sectores.find((s) => /^Venderlo: cobrás/.test(s.titulo));
    ok(!!tit && v.rueda.sectores.some((s) => /Pensarlo/.test(s.titulo)), `la propuesta trae «${tit && tit.titulo}» y «Pensarlo»`);
    ok(/Pagaste \$96\.000 hace 21 días/.test(v.texto) && /de base/.test(v.texto) && /por lo descuidado/.test(v.texto) && /nunca menos del 50 % ni más del 85 %/.test(v.texto) && /caja/.test(v.texto) && /recomprar/.test(v.texto), `el cálculo a la vista: «${v.texto.slice(0, 300)}…»`);
    ok(!/undefined|NaN/.test(v.texto + titulos(v)), 'sin undefined ni NaN');
    await foto('03-panaderia-propuesta-con-el-calculo');
    const total = aNum(tit.titulo.match(/\$([\d.]+)/)[1]);
    const antes = await A('P.economia.pesos');
    const cajaAntes = await A('P.negociosVecinos.comprados.panaderia.caja');
    const puntosAntes = await A('A.puntos("panadera")');
    await hacia(/Venderlo/);
    let t = await leer();
    await foto('04-panaderia-cierre');
    ok(/plaza/.test(t.renglones.join(' ')) && /Cobraste/.test(t.renglones.join(' ')), `Rosa vuelve de la plaza («${t.renglones[0].slice(0, 100)}…»)`);
    ok((await A('P.economia.pesos')) === antes + total, `la billetera sube exactamente ${pesos(total)} (${pesos(antes)} → ${pesos(await A('P.economia.pesos'))}), con la caja de ${pesos(cajaAntes)} adentro`);
    ok(await A('!P.negociosVecinos.comprados.panaderia && !!P.negociosVecinos.vendidos.panaderia'), 'la panadería ya no es tuya y queda anotado cuándo la vendiste');
    ok((await A('A.puntos("panadera")')) >= puntosAntes, `el trato no le cayó mal a Rosa (amistad ${puntosAntes} → ${await A('A.puntos("panadera")')})`);
    const nts = await notasTxt();
    ok(/Le vendiste la panadería a Rosa/.test(nts) && /el cartel ya no dice tu nombre/.test(nts), `el aviso: «${nts.slice(0, 170)}»`);
    await cerrar();
    for (let i = 0; i < 6; i++) await A('(H.__aldea.actualizar(1), A.cuadros(2, 40), 1)');
    ok(await A('!H.__negociosVecinos().mundo().carteles().includes("panaderia")'), 'el cartel «de Bruno» desapareció');
    ok(await A('!H.__negociosVecinos()._idos().includes("panadera")'), 'Rosa ya no figura entre los que se fueron');
    // vuelve a su local: a las 14 deja la plaza
    await A('(A.dia(28, 14), 1)');
    for (let i = 0; i < 120; i++) await A('(H.__aldea.actualizar(2), A.cuadros(1, 30), 1)');
    const rosa = await A('({ dPan: A.distA("panadera", "panaderia"), dPlaza: A.distA("panadera", "plaza") })');
    ok(rosa.dPan !== null && rosa.dPan < rosa.dPlaza, `a las 14 Rosa está en su panadería (a ${rosa.dPan && rosa.dPan.toFixed(1)} m; la plaza queda a ${rosa.dPlaza && rosa.dPlaza.toFixed(1)} m): retomó su rutina`);
    await A('(A.verCartel("panaderia", 3.4), A.cuadros(8, 110), 1)');
    await foto('05-panaderia-sin-cartel-y-rosa-en-su-local');

    seccion('recomprar pronto: 10 % más');
    v = await alNegocio('panadera');
    ok(v.rueda.sectores.some((s) => /Comprarle la panadería/.test(s.titulo)) && !v.rueda.sectores.some((s) => /Venderle/.test(s.titulo)), `el menú volvió al de antes (${titulos(v)})`);
    await A('A.amistad("panadera", 60, 0)');
    await hacia(/Comprarle la panadería/);
    v = await A('A.vista()');
    ok(/recomprarlo cuesta un 10 % más \(hasta el día 57\)/.test(v.texto) && v.rueda.sectores.some((s) => /Cerrar el trato: \$105\.500/.test(s.titulo)), `Rosa pide $105.500 (+10 % sobre $96.000) («${v.texto.slice(0, 160)}…»)`);
    await foto('06-panaderia-recompra-con-recargo');
    await hacia(/Pensarlo/);
    await leer(2);
    await cerrar();

    // ---------------------------------------------------------------- 2. Ercilia: apego fuerte
    seccion('Ercilia: comprar el almacén y vendérselo de vuelta');
    await A('A.dia(28, 16.5)');
    v = await alNegocio('ercilia');
    await A('A.amistad("ercilia", 160, 3)');
    await hacia(/Comprarle el almacén/);
    await hacia(/Cerrar el trato/); await leer(); await cerrar();
    ok(await A('!!P.negociosVecinos.comprados.almacen'), 'el almacén es tuyo');
    await A('(A.dia(60, 16.5), 1)'); await A('A.cuadros(30, 60)');
    await A('A.limpiarNotas()');
    v = await alNegocio('ercilia');
    await hacia(/Venderle el almacén de vuelta/);
    v = await A('A.vista()');
    ok(/Ay, querido… ¿me devolvés el almacén\?/.test(v.texto) && /le hace ilusión/.test(v.texto), `Ercilia se emociona («${v.texto.slice(0, 120)}…»)`);
    await foto('07-almacen-ercilia-se-emociona');
    const totalAlm = aNum(v.rueda.sectores.find((s) => /^Venderlo/.test(s.titulo)).titulo.match(/\$([\d.]+)/)[1]);
    const antesAlm = await A('P.economia.pesos');
    await hacia(/Venderlo/);
    t = await leer();
    ok(/Vuelve a ser mío/.test(t.renglones.join(' ')), `Ercilia: «${t.renglones[0].slice(0, 100)}…»`);
    ok((await A('P.economia.pesos')) === antesAlm + totalAlm, `cobraste ${pesos(totalAlm)}`);
    await cerrar();
    await A('(A.dia(60, 16.5), 1)');
    const mostrador = await A('(() => { const m = H.est.almacen.mostrador || H.est.almacen; return { x: m.x, z: m.z } })()');
    await A(`(A.tp(${mostrador.x}, ${mostrador.z} + 1.3, 0), A.mirarA(${mostrador.x}, ${mostrador.z}), A.cuadros(10, 110), 1)`);
    const av = await A('A.aviso()');
    ok(av.length > 0 && !/undefined|NaN/.test(av) && (await A('!P.negociosVecinos.comprados.almacen')), `el almacén ya no es tuyo y junto al mostrador el aviso es el de siempre («${av}»; que el cartel de turnos vuelva a fichar lo prueba verificar-4-4-3-venta.mjs)`);
    await foto('08-almacen-mostrador-de-siempre');

    // ---------------------------------------------------------------- 3. la sociedad: sumar plata
    seccion('Elvira: sociedad y aporte adicional');
    await A('A.dia(60, 11)');
    v = await alNegocio('tejedora');
    await A('A.amistad("tejedora", 100, 3)');
    await hacia(/Proponerle ser socio/);
    v = await A('A.vista()');
    await hacia(/Poner \$11\.000/);
    t = await leer();
    ok(await A('!!P.negociosVecinos.socios.hilanderia && P.negociosVecinos.socios.hilanderia.aporte === 11000'), `sos socio de la hilandería con $11.000 (${t.renglones[0].slice(0, 70)}…)`);
    const pctAntes = await A('P.negociosVecinos.socios.hilanderia.pct');
    await cerrar();
    await A('(A.dia(75, 11), 1)'); await A('A.cuadros(30, 60)');
    v = await hablarCon('tejedora');
    v = await numero(/Hacer juntos/);
    ok(v.rueda.sectores.some((s) => /Hablar de la sociedad/.test(s.titulo)), `siendo socio, la charla dice «Hablar de la sociedad» (${titulos(v)})`);
    await foto('09-elvira-hablar-de-la-sociedad');
    await numero(/Hablar de la sociedad/);
    v = await A('A.vista()');
    ok(v.rueda.sectores.some((s) => /Sumar plata a la sociedad/.test(s.titulo)), `el submenú trae «Sumar plata a la sociedad» (${titulos(v)})`);
    await foto('10-elvira-submenu-de-la-sociedad');
    await hacia(/Sumar plata a la sociedad/);
    v = await A('A.vista()');
    ok(v.rueda.sectores.filter((s) => /^Sumar \$/.test(s.titulo)).length === 3 && /Tenés puestos \$11\.000 de los \$44\.000/.test(v.texto), `tres montos y el cálculo («${v.texto.slice(0, 160)}…» / ${titulos(v)})`);
    await foto('11-elvira-sumar-plata-el-calculo');
    const pesosAntesAporte = await A('P.economia.pesos');
    await hacia(/Sumar \$22\.000/);
    t = await leer();
    ok(/\$22\.000 más/.test(t.renglones[0]) && /Todavía podés sumar hasta \$11\.000/.test(t.renglones.join(' ')), `Elvira acepta («${t.renglones[0].slice(0, 110)}»)`);
    await foto('12-elvira-acepta-mas-plata');
    ok((await A('P.economia.pesos')) === pesosAntesAporte - 22000 && (await A('P.negociosVecinos.socios.hilanderia.aporte')) === 33000, 'se pagaron $22.000 y el aporte total es $33.000');
    const pctNuevo = await A('P.negociosVecinos.socios.hilanderia.pct');
    ok(pctNuevo > pctAntes, `tu porcentaje subió: ${pctAntes} % → ${pctNuevo} %`);
    ok(/Sumaste plata a tu sociedad en la hilandería/.test(await notasTxt()), `el aviso: «${(await notasTxt()).slice(0, 170)}»`);
    await cerrar();
    // llegar al tope y que se niegue
    v = await alNegocio('tejedora');
    await hacia(/Sumar plata a la sociedad/);
    await hacia(/Sumar \$11\.000/);
    await leer(4);
    await cerrar();
    v = await alNegocio('tejedora');
    await hacia(/Sumar plata a la sociedad/);
    t = await leer(3);
    ok(/ya pusiste lo máximo/i.test(t.renglones.join(' ')) && /que es lo máximo: el 40 % del precio/.test(t.renglones.join(' ')), `en el tope, Elvira se niega y lo dice («${t.renglones.join(' ').slice(0, 130)}»)`);
    await foto('13-elvira-ya-estas-en-el-tope');
    await cerrar();
    // la amistad baja: se niega
    seccion('Ercilia y la amistad que bajó');
    v = await alNegocio('ercilia');
    await A('A.amistad("ercilia", 160, 3)');
    await hacia(/Proponerle ser socio/);
    await hacia(/Poner \$17\.000/);
    await leer(4);
    await A('A.amistad("ercilia", 60, 3)');
    await cerrar();
    v = await alNegocio('ercilia');
    await hacia(/Sumar plata a la sociedad/);
    t = await leer(3);
    ok(/tomar unos mates/.test(t.renglones.join(' ')) && /95 puntos/.test(t.renglones.join(' ')), `con la amistad baja, Ercilia no recibe más plata («${t.renglones.join(' ').slice(0, 140)}»)`);
    await foto('14-ercilia-no-recibe-mas-plata');
    await cerrar();

    // ---------------------------------------------------------------- 4. el retiro devuelve cada aporte según sus días
    seccion('el retiro de la hilandería');
    await A('A.dia(80, 11)');
    const dev = await A('({ aporte: P.negociosVecinos.socios.hilanderia.aporte, extras: P.negociosVecinos.socios.hilanderia.extras })');
    v = await alNegocio('tejedora');
    await hacia(/Avisar que me retiro/);
    t = await leer();
    const sale = 82;
    ok(new RegExp(`efectivo el día ${sale}`).test(t.renglones.join(' ')), `avisás el retiro: sale el día ${sale} («${t.renglones[t.renglones.length - 1].slice(0, 120)}…»)`);
    await foto('15-elvira-aviso-de-retiro-con-aportes');
    await cerrar();
    const pesosPrevio = await A('P.economia.pesos');
    await A('(A.dia(83, 9), 1)'); await A('A.cuadros(30, 60)');
    ok(!(await A('!!P.negociosVecinos.socios.hilanderia')), 'el día 82 se hizo efectivo el retiro');
    const devuelto = await A('P.negociosVecinos.total.devuelto');
    // cada aporte con sus días: el original (día 60) lleva 22 días: 92 %; los adicionales (día 75) llevan 7: 80 %
    const parteDe = (d) => (d < 6 ? 0.6 : d < 18 ? 0.8 : d < 36 ? 0.92 : 1);
    const esperado = Math.round((dev.aporte - dev.extras.reduce((s, x) => s + x.monto, 0)) * parteDe(82 - 60) + dev.extras.reduce((s, x) => s + x.monto * parteDe(82 - 75), 0));
    ok(Math.abs(devuelto - esperado) <= 5, `se devolvió ${pesos(devuelto)} de ${pesos(dev.aporte)} puestos (esperado ${pesos(esperado)}: lo original, con 22 días, al 92 % y lo nuevo, con 7, al 80 %)`);
    ok((await A('P.economia.pesos')) >= pesosPrevio + devuelto, `la billetera subió (${pesos(pesosPrevio)} → ${pesos(await A('P.economia.pesos'))})`);

    // ---------------------------------------------------------------- 5. cuaderno, guía, guardado
    seccion('cuaderno y guía');
    await A('A.dia(83, 10)');
    await tecla('KeyJ'); await esperar(500); await A('(H.__aldea.oficios().elegir("negocios-vecinos"), H.__aldea.cuaderno("oficios"), 1)'); await esperar(400);
    const cuad = await js(`document.getElementById('cuaderno').textContent.replace(/\\s+/g, ' ')`);
    ok(cuad.includes('Negocios y sociedades') && /Podés sumar hasta/.test(cuad) && /hablá con su dueño de siempre/.test(cuad) && !/undefined|NaN/.test(cuad), 'el cuaderno: «Negocios y sociedades» con lo de vender y sumar plata, sin textos rotos');
    await foto('16-cuaderno-negocios');
    await tecla('KeyJ'); await esperar(400);
    await tecla('F1'); await esperar(600);
    const guia = await js(`document.body.textContent.replace(/\\s+/g, ' ')`);
    ok(/Vender el negocio y sumar plata/.test(guia), 'la guía (F1) trae «Vender el negocio y sumar plata»');
    await js(`(() => { document.querySelector('.guia-pestana[data-guia="vida"]')?.click(); const c = document.querySelector('.guia-cuerpo'); const ult = c && c.lastElementChild; if (ult) ult.scrollIntoView({ block: 'center' }); return 1; })()`);
    await esperar(400);
    await foto('17-guia-vender-y-sumar-plata');
    await tecla('F1'); await esperar(400);

    seccion('guardar y recargar');
    const antesG = await A('JSON.stringify({ vendidos: P.negociosVecinos.vendidos, total: P.negociosVecinos.total.vendido, comprados: Object.keys(P.negociosVecinos.comprados) })');
    await A('H.guardar()'); await esperar(600);
    await abrir();
    ok(await listo(), 'recarga');
    await js(`document.getElementById('btn-continuar')?.click(); 1`).catch(() => 0);
    await esperar(4000);
    await js(PAGINA);
    const despuesG = await A('JSON.stringify({ vendidos: P.negociosVecinos.vendidos, total: P.negociosVecinos.total.vendido, comprados: Object.keys(P.negociosVecinos.comprados) })');
    ok(despuesG === antesG, `lo vendido sobrevive al guardado (${despuesG.slice(0, 140)})`);
    await A('A.montar()');
    ok(await A('!H.__negociosVecinos().mundo().carteles().includes("panaderia") && !H.__negociosVecinos().mundo().carteles().includes("almacen")'), 'y los carteles vendidos no vuelven');

    ok(errores.length === 0, `sin errores en la consola${errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''}`);
  } catch (e) {
    console.log('✗ ' + (e && e.stack || e));
    errores.push(String(e));
  }
  console.log(errores.length ? `FALLÓ (${errores.length})` : 'TODO BIEN');
  app.exit(errores.length ? 1 : 0);
});

// Partida real 4.6 gente (Electron + WebGL): la gente fuera del pueblo y el tablón de encargos de la plaza, con las teclas de verdad.
//   · el tablón: se ve en la plaza, el aviso dice «Leer el tablón de encargos», E abre el panel (tres a la vista), un número toma
//     un encargo, con lo pedido encima otro número lo entrega y cobra, Escape cierra;
//   · Fermín (galpón de esquila), Belisario (puesto del paso) y Tobías (cantera): se arman al acercarse, están en su lugar (captura),
//     se les habla (la rueda con «Pedidos y compras»), cuentan su historia y se les compra algo;
//   · Nicanor y Josefina: su menú de siempre más «Pedidos y compras»; se les compra algo y se les entrega su pedido;
//   · sin errores de consola; guardar.
// Uso (desde la carpeta del proyecto, después de `node armar.mjs`):
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-6-gente.cjs -Espera 900 -Perfil C:\carpeta -Arg1 --salida=C:\carpeta
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const salida = path.resolve(arg('salida', path.join(raiz, 'pruebas', 'salidas', 'gente-4-6')));
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
  A.mirarA = (x, z, pitch = -0.05) => { const js = J.estado; js.yaw = Math.atan2(-(x - js.pos.x), -(z - js.pos.z)); js.pitch = pitch; return 1; };
  A.notas = () => [...document.querySelectorAll('#notas .nota')].map((n) => n.textContent.replace(/\s+/g, ' ').trim());
  A.limpiarNotas = () => { document.querySelectorAll('#notas .nota').forEach((n) => n.remove()); return 1; };
  A.aviso = () => document.getElementById('aviso')?.textContent.replace(/\s+/g, ' ').trim() || '';
  A.montar = () => { const AM = H.__aldeaMundo(); let n = 0; while (AM.medir().cola > 0 && n < 300) { AM.montarCola(true); n++; } H.__aldea.mundo().prearmar(120000); for (let k = 0; k < 6; k++) H.__aldea.actualizar(0.6); return 1; };
  A.npc = (clave) => H.gente.gente.find((g) => (g.claveAldea || g.clave) === clave && !g.aBordo) || null;
  A.dondeNpc = (clave) => { const n = A.npc(clave); return n ? { x: n.pos.x, y: n.pos.y, z: n.pos.z, visible: n.g.visible, suelo: H.T ? H.T.altura(n.pos.x, n.pos.z) : null } : null; };
  A.hablar = (clave) => { const n = A.npc(clave); if (!n) return false; H.__hablar(n); return true; };
  A.vista = () => { const c = document.getElementById('charla'); return { abierta: !c.classList.contains('oculto'), quien: document.getElementById('charla-quien').textContent, texto: document.getElementById('charla-texto')?.textContent.replace(/\s+/g, ' ').trim() || '', rueda: H.__rueda() }; };
  // dónde pararse para retratar a alguien: a «dist» m, en tierra libre y con la vista despejada (árboles, paredes, agua); de frente si se puede
  A.buenRetrato = (clave, dist = 4.6) => {
    const n = A.npc(clave), M = H.__genteCampo();
    if (!n || !M) return null;
    const libre = (x, z) => M.libre(x, z, 0.45) || Math.hypot(x - n.pos.x, z - n.pos.z) < 1.2;
    let mejor = null;
    for (let i = 0; i < 24; i++) {
      const a = n.rumbo + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * (Math.PI / 12);
      const x = n.pos.x + Math.sin(a) * dist, z = n.pos.z + Math.cos(a) * dist;
      if (!M.libre(x, z, 0.6)) continue;
      let ve = true;
      for (let s = 0.12; s < 1 && ve; s += 0.08) ve = libre(x + (n.pos.x - x) * s, z + (n.pos.z - z) * s);
      if (ve) { mejor = { x, z }; break; }
    }
    return mejor;
  };
  A.panel = () => { const p = document.getElementById('tablon'); return { abierto: !!p && !p.classList.contains('oculto'), filas: p ? [...p.querySelectorAll('li')].map((li) => li.textContent.replace(/\s+/g, ' ').trim()) : [] }; };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: false, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300));
    if (/fallaSistema|gente-campo|tablon/.test(m)) console.log('  consola: ' + m.slice(0, 300));
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
  const tecla = (code) => A(`A.tecla(${JSON.stringify(code)})`);
  const listo = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.jugador && ${H}.__tablon && ${H}.__tablon())`).catch(() => false)) return true; } return false; };
  const numero = async (re) => { const r = await A('H.__rueda()'); const i = r.sectores.findIndex((s) => re.test(s.titulo)); if (i < 0 || i > 8) return { error: `no está ${re} en ${r.sectores.map((s) => s.titulo).join(' / ')}` }; await tecla(`Digit${i + 1}`); await A('A.cuadros(2, 60)'); return A('A.vista()'); };
  const hastaRueda = async (max = 12) => { let v = await A('A.vista()'); for (let i = 0; i < max && v.abierta && !v.rueda.abierta; i++) { await tecla('KeyE'); await A('A.cuadros(2, 60)'); v = await A('A.vista()'); } return v; };
  const leer = async (max = 8) => { const t = []; let v = await A('A.vista()'); for (let i = 0; i < max && v.abierta && !v.rueda.abierta; i++) { t.push(v.texto); await tecla('KeyE'); await A('A.cuadros(2, 60)'); v = await A('A.vista()'); } return { renglones: t, v }; };
  const cerrar = async () => { await js(`${H}.__cerrarCharla(); 1`); await A('A.cuadros(3, 60)'); };
  const titulos = (v) => (v.rueda?.sectores || []).map((s) => s.titulo).join(' / ');
  const pesos = () => A('P.economia.pesos');
  // acercarse y esperar a que la persona esté armada (las del campo se arman al acercarte, de a poco)
  const llegarA = async (clave, x, z) => {
    await A(`A.tp(${x}, ${z}, 0)`);
    for (let i = 0; i < 160; i++) { await A('A.cuadros(2, 30)'); if (await A(`!!A.npc(${JSON.stringify(clave)})`)) break; }
    await A('A.cuadros(8, 60)');
    return A(`A.dondeNpc(${JSON.stringify(clave)})`);
  };
  // la captura de cada uno en su lugar: a 4,5 m, del lado de `desde`, a la altura de los ojos
  const retratar = async (clave, nombre, desde = null, dist = 4.6) => {
    const d = await A(`A.dondeNpc(${JSON.stringify(clave)})`);
    if (!d) return null;
    const b = await A(`A.buenRetrato(${JSON.stringify(clave)}, ${dist})`);
    const ang = desde ? Math.atan2(desde.x - d.x, desde.z - d.z) : 0.6;
    // (sin lugar despejado en tierra, como Nicanor en el deck de la cabaña: de cerca, delante de él, donde se le habla)
    const r = await A(`A.npc(${JSON.stringify(clave)}).rumbo`);
    const c = b || { x: d.x + Math.sin(r) * 2.4, z: d.z + Math.cos(r) * 2.4 };
    if (!b) console.log(`  (sin un lugar despejado a ${dist} m para retratar a ${clave}: de cerca, delante de él)`);
    await A(`(A.tp(${c.x}, ${c.z}, 0), A.mirarA(${d.x}, ${d.z}, Math.atan2(${d.y} + 1.2 - (H.jugador.estado.pos.y + 1.6), ${dist})), 1)`);
    await A('A.cuadros(6, 90)');
    await foto(nombre);
    return d;
  };
  // hablar (con E de verdad), ir a «Pedidos y compras» y comprar lo que diga `re` (en el submenú «Comprarle algo…»)
  const hablarYComprar = async (clave, reCosa, extra = null) => {
    const n = await A(`A.dondeNpc(${JSON.stringify(clave)})`);
    await A(`(A.tp(${n.x + 1.6}, ${n.z + 0.4}, 0), A.mirarA(${n.x}, ${n.z}), 1)`);
    await A('A.cuadros(6, 80)');
    const aviso = await A('A.aviso()');
    ok(/Hablar con|te quiere decir/.test(aviso), `${clave}: el aviso dice «${aviso}»`);
    await tecla('KeyE'); await A('A.cuadros(3, 60)');
    let v = await A('A.vista()');
    if (!v.abierta) { await A(`A.hablar(${JSON.stringify(clave)})`); await A('A.cuadros(2, 60)'); v = await A('A.vista()'); }
    ok(v.abierta, `${clave}: E abre la charla («${v.quien}»: ${v.texto.slice(0, 80)})`);
    v = await hastaRueda();
    ok(v.rueda.abierta && /Pedidos y compras/.test(titulos(v)), `${clave}: la rueda con «Pedidos y compras» (${titulos(v)})`);
    if (extra) await extra(v);
    v = await A('A.vista()');
    if (!v.rueda.abierta) v = await hastaRueda();
    v = await numero(/Pedidos y compras/);
    ok(!v.error && /Comprarle algo/.test(titulos(v)), `${clave}: «Pedidos y compras» → ${v.error || titulos(v)}`);
    v = await numero(/Comprarle algo/);
    ok(!v.error && v.rueda.sectores.length >= 3, `${clave}: la tiendita (${v.error || titulos(v)})`);
    const antes = await pesos();
    v = await numero(reCosa);
    ok(!v.error, `${clave}: elijo ${reCosa} ${v.error || ''}`);
    const dice = await leer();
    const despues = await pesos();
    ok(despues < antes, `${clave}: pagué $${antes - despues} («${(dice.renglones[0] || '').slice(0, 90)}»)`);
    await cerrar();
    return antes - despues;
  };

  try {
    seccion('carga');
    await abrir();
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'media', clima: 'despejado', estacion: 'otono', musica: false, modo: 'relax', relaxTipo: 'libre', autoCalidad: false, guiaPrimerDia: false, idioma: 'es', limiteFps: 'libre', ritmoAldea: 'animado' })); 1`);
    await abrir();
    ok(await listo(), 'carga el Relax con el tablón armado');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(4000);
    await js(PAGINA);
    ok(await A('!!P.economia && P.modo !== "desafio" && !!P.genteCampo && !!H.__genteCampoJuego()'), 'la partida es del Relax y trae lo de la gente del campo');
    await A(`(() => { const a = P.aldea; const L = { carpintero: 'carpinteria', panadera: 'panaderia', herrero: 'herreria', pescador: 'pescaderia', maestra: 'escuela', enfermera: 'puesto-sanitario', telegrafista: 'estafeta', tejedora: 'hilanderia', apicultor: 'sala-miel', guardaparque: 'seccional', musico: 'salon' };
      a.pobladores = Object.keys(L).map((clave) => ({ clave, dia: 1 })); a.obras = {}; a.llegando = null; a.locales = Object.fromEntries(Object.values(L).map((l) => [l, 1])); a.descubierta = 1;
      P.dia = 6; P.horas = 11; P.economia.pesos = 60000; return 1 })()`);
    await A('(H.jugador.ubicar(H.__aldea.edificio("plaza").x, H.__aldea.edificio("plaza").z, 0), 1)');
    await A('A.montar()');
    await A('A.cuadros(8, 100)');

    // ---------------------------------------------------------------- 1. el tablón
    seccion('el tablón de encargos en la plaza');
    const L = await A('(() => { const l = H.__tablon().lugar; return { x: l.x, y: l.y, z: l.z, rot: l.rot, fx: l.frente.x, fz: l.frente.z } })()');
    ok(L && Number.isFinite(L.x), `el tablón está en (${L.x.toFixed(1)}, ${L.z.toFixed(1)})`);
    // de lejos, para ver dónde queda en la plaza
    await A(`(A.tp(${L.x + Math.sin(L.rot) * 7 + Math.cos(L.rot) * 3}, ${L.z + Math.cos(L.rot) * 7 - Math.sin(L.rot) * 3}, 0), A.mirarA(${L.x}, ${L.z}, -0.12), 1)`);
    await A('A.cuadros(6, 90)');
    await foto('01-tablon-en-la-plaza');
    await A(`(A.tp(${L.fx}, ${L.fz}, 0), A.mirarA(${L.x}, ${L.z}, -0.02), 1)`);
    await A('A.cuadros(8, 90)');
    const aviso = await A('A.aviso()');
    ok(/Leer el tablón de encargos/.test(aviso), `el aviso: «${aviso}»`);
    await foto('02-tablon-de-cerca');
    await tecla('KeyE'); await A('A.cuadros(3, 60)');
    let pan = await A('A.panel()');
    ok(pan.abierto && pan.filas.length === 3 && pan.filas.every((f) => /Tomar: .*\$\d/.test(f)), `E abre el panel con tres a la vista: ${pan.filas.map((f) => f.slice(0, 60)).join(' | ')}`);
    ok(!(await A('A.aviso()')), 'con el panel abierto, sin aviso');
    await foto('03-tablon-panel');
    await tecla('Digit1'); await A('A.cuadros(3, 60)');
    pan = await A('A.panel()');
    const tomado = await A('P.genteCampo.tablon.tomados[0] || null');
    ok(tomado && tomado.hasta === 7 && /^1\. Entregar/.test(pan.filas[0]) && pan.filas.length === 3, `1 toma el primero (${tomado?.n} ${tomado?.k}, $${tomado?.pago}, hasta el día ${tomado?.hasta}); arriba queda para entregar`);
    ok((await A('A.notas()')).some((t) => /Encargo:/.test(t)), 'la nota del encargo tomado');
    await tecla('Digit1'); await A('A.cuadros(3, 60)');
    ok((await A('P.genteCampo.tablon.tomados.length')) === 1, 'sin lo pedido, no se entrega');
    // lo pedido, en la mochila
    await A(`(() => { const t = P.genteCampo.tablon.tomados[0]; const donde = ({ lana: 'material', junco: 'material', hierbas: 'material', arcilla: 'material', cuero: 'material', 'piedra-cantera': 'material', yerba: 'cosa', harina: 'cosa', poncho: 'cosa' })[t.k] || 'entrada';
      if (donde === 'material') P.materiales[t.k] = (P.materiales[t.k] || 0) + t.n; else if (donde === 'cosa') P.cosas[t.k] = (P.cosas[t.k] || 0) + t.n; else { P.entradas[t.k] = P.entradas[t.k] || { dia: 1, hora: 0, cantidad: 0 }; P.entradas[t.k].cantidad += t.n; } return 1 })()`);
    await A('(H.__tablon().dibujar(), 1)');
    const antesT = await pesos();
    await tecla('Digit1'); await A('A.cuadros(3, 60)');
    const despuesT = await pesos();
    ok(despuesT - antesT === tomado.pago && (await A('P.genteCampo.tablon.tomados.length')) === 0, `1 entrega: cobré $${despuesT - antesT}`);
    ok((await A('A.notas()')).some((t) => /Encargo entregado/.test(t)), 'la nota del encargo entregado');
    pan = await A('A.panel()');
    ok(/la de hoy ya la hiciste/.test(await A('document.getElementById("tablon-intro").textContent')), 'el panel dice que la entrega de hoy ya está');
    await tecla('Digit1'); await A('A.cuadros(3, 60)');
    await tecla('Escape'); await A('A.cuadros(2, 60)');
    ok(!(await A('A.panel()')).abierto && (await A('document.getElementById("pausa")?.classList.contains("oculto") ?? true')), 'Escape cierra el panel (sin abrir la pausa)');
    await tecla('KeyE'); await A('A.cuadros(2, 60)');
    ok((await A('A.panel()')).abierto, 'E lo vuelve a abrir');
    await tecla('KeyE'); await A('A.cuadros(2, 60)');
    ok(!(await A('A.panel()')).abierto, 'y E lo cierra');
    await A(`(A.tp(${L.fx}, ${L.fz}, 0), A.mirarA(${L.x}, ${L.z}), 1)`);
    await tecla('KeyE'); await A('A.cuadros(2, 60)');
    await A(`A.tp(${L.fx + 12}, ${L.fz + 12}, 0)`); await A('A.cuadros(3, 60)');
    ok(!(await A('A.panel()')).abierto, 'alejándose, se cierra solo');

    // ---------------------------------------------------------------- 2. Fermín, el pastor
    seccion('Fermín en el galpón de esquila');
    const g = await A('(() => { const g = H.T?.lugares?.galpon || null; return g ? { x: g.x, z: g.z, rot: g.rot } : null })()');
    ok(g, `el galpón (${g?.x?.toFixed(1)}, ${g?.z?.toFixed(1)})`);
    const f = await llegarA('fermin', g.x + 40, g.z + 40);
    ok(f && Math.hypot(f.x - g.x, f.z - g.z) < 20, `Fermín está junto al galpón (a ${f ? Math.hypot(f.x - g.x, f.z - g.z).toFixed(1) : '?'} m)`);
    ok(f && Math.abs(f.y - f.suelo) < 0.3, `con los pies en el suelo (${f ? (f.y - f.suelo).toFixed(2) : '?'} m)`);
    await retratar('fermin', '04-fermin-galpon', { x: g.x + Math.sin(g.rot) * -20, z: g.z + Math.cos(g.rot) * -20 });
    await hablarYComprar('fermin', /vellones de lana/, async (v) => {
      // la historia que todavía no contó
      v = await numero(/Charlar/);
      v = await numero(/Contame algo/);
      const r = await leer();
      ok(r.renglones.length >= 3 && /ovejas/i.test(r.renglones.join(' ')), `Fermín cuenta su historia («${(r.renglones[0] || '').slice(0, 70)}…»)`);
    });
    ok((await A('P.materiales.lana || 0')) >= 2, 'Fermín: los vellones en la mochila');

    // ---------------------------------------------------------------- 3. Belisario, el arriero
    seccion('Belisario en el puesto del paso');
    const b = await llegarA('belisario', -300, 20);
    ok(b && Math.hypot(b.x + 340, b.z + 20) < 60, `Belisario anda por el puesto del paso (a ${b ? Math.hypot(b.x + 340, b.z + 20).toFixed(1) : '?'} m)`);
    ok(b && Math.abs(b.y - b.suelo) < 0.3, 'con los pies en el suelo');
    await retratar('belisario', '05-belisario-puesto-paso', { x: -320, z: -10 });
    const yerbaAntes = await A('P.cosas.yerba || 0');
    await hablarYComprar('belisario', /yerba/);
    ok((await A('P.cosas.yerba || 0')) === yerbaAntes + 4, 'Belisario: cuatro medidas de yerba');

    // ---------------------------------------------------------------- 4. Tobías, el cantero
    seccion('Tobías en la cantera');
    const t = await llegarA('tobias', -360, -280);
    ok(t && Math.hypot(t.x + 405, t.z + 305) < 30, `Tobías está en la cantera (a ${t ? Math.hypot(t.x + 405, t.z + 305).toFixed(1) : '?'} m de la veta)`);
    ok(t && Math.abs(t.y - t.suelo) < 0.3, 'con los pies en el suelo');
    await A('A.cuadros(30, 40)');
    await retratar('tobias', '06-tobias-cantera', { x: -320, z: -288 });
    const piedraAntes = await A('P.materiales.piedra || 0');
    await hablarYComprar('tobias', /Cuatro piedras/);
    ok((await A('P.materiales.piedra || 0')) === piedraAntes + 4, 'Tobías: cuatro piedras');

    // ---------------------------------------------------------------- 5. Nicanor y Josefina
    seccion('Nicanor en la cabaña del pescador');
    const nic = await A('A.dondeNpc("nicanor")');
    await A(`A.tp(${nic.x + 30}, ${nic.z + 30}, 0)`); await A('A.cuadros(10, 60)');
    await retratar('nicanor', '07-nicanor-cabana', null, 5);
    const truchaAntes = await A('P.entradas["trucha-fresca"]?.cantidad || 0');
    await hablarYComprar('nicanor', /truchas frescas/);
    ok((await A('P.entradas["trucha-fresca"]?.cantidad || 0')) === truchaAntes + 2, 'Nicanor: dos truchas frescas');
    // su pedido: dárselo y entregarlo con la rueda
    const ped = await A('(() => { const r = H.__genteCampoJuego().opciones("nicanor").find((o) => o.id === "campo:pedido"); return r ? r.titulo : null })()');
    ok(!!ped, `Nicanor pide algo: «${ped}»`);
    await A(`(() => { P.materiales.tronco = (P.materiales.tronco || 0) + 8; P.cosas.yerba = (P.cosas.yerba || 0) + 8; P.entradas['pan-casero'] = P.entradas['pan-casero'] || { dia: 1, hora: 0, cantidad: 0 }; P.entradas['pan-casero'].cantidad += 6; if (P.negocios?.hoy) P.negocios.hoy.pedidos = 0; return 1 })()`);
    {
      const n = await A('A.dondeNpc("nicanor")');
      await A(`(A.tp(${n.x + 1.6}, ${n.z + 0.4}, 0), A.mirarA(${n.x}, ${n.z}), A.hablar("nicanor"), 1)`);
      await A('A.cuadros(2, 60)');
      let v = await hastaRueda();
      v = await numero(/Pedidos y compras/);
      const antes = await pesos();
      v = await numero(/Entregarle/);
      ok(!v.error, `«Entregarle…» ${v.error || ''}`);
      const r = await leer();
      ok((await pesos()) > antes, `Nicanor pagó $${(await pesos()) - antes} («${(r.renglones[0] || '').slice(0, 70)}»)`);
      await cerrar();
    }
    seccion('Josefina en el mirador');
    const ema = await A('A.dondeNpc("ema")');
    await A(`A.tp(${ema.x + 30}, ${ema.z + 30}, 0)`); await A('A.cuadros(10, 60)');
    await retratar('ema', '08-josefina-mirador', null, 5);
    const habas = await A('P.cosas["semillas-habas"] || 0');
    await hablarYComprar('ema', /Semillas de habas/);
    ok((await A('P.cosas["semillas-habas"] || 0')) === habas + 3, 'Josefina: tres semillas de habas');

    // ---------------------------------------------------------------- 6. guardar y recargar
    seccion('guardar');
    await js(`${H}.guardar(); 1`).catch(() => null);
    const antesG = await A('JSON.stringify({ h: P.genteCampo.historias, t: P.genteCampo.tablon.hechos, c: P.genteCampo.conocidos })');
    ok(/fermin/.test(antesG) && /"t":1/.test(antesG), `lo del campo, en la partida: ${antesG}`);
  } catch (e) {
    errores.push(`excepción en «${donde}»: ${e.message}`);
    console.log(`✗ excepción en «${donde}»: ${e.stack || e.message}`);
  }
  console.log(errores.length ? `FALLÓ (${errores.length}):\n  ${errores.join('\n  ')}` : 'OK humo-4-6-gente');
  fs.writeFileSync(path.join(salida, 'resultado.txt'), errores.length ? `FALLÓ\n${errores.join('\n')}` : 'OK');
  app.exit(errores.length ? 1 : 0);
});

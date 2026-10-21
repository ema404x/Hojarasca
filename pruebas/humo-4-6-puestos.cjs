// Partida real 4.6 (Electron + WebGL): los cuatro puestos de ruta (src/puestos-ruta*.js) y la parada nueva de la trochita.
//   · una partida nueva del Relax: los cuatro puestos están, abandonados, en sus coordenadas fijas; la trochita tiene cinco paradas y una
//     es el Puesto del Riel Sur (un apeadero sin galpón ni luz);
//   · a cada puesto se llega CAMINANDO un tramo (W apretada) desde 26 m; el aviso ofrece repararlo con su costo; captura abandonado;
//   · se repara cada uno con E en sus tres etapas (pesos, tablas y piedras): cada etapa cobra $3.000 y 10/10 en total, y se ve distinta
//     (capturas del de la Cantera en cada etapa y de todos reparados);
//   · reparado: dormir en el catre (pasa la noche y amanecés descansado), guardar y sacar del depósito, prender el fogón con F,
//     comprar y vender en el panel del puesto (sin fletes; su caja arranca en $5.000) y, en el Riel Sur, el panel de la trochita con fletes;
//   · la trochita para en el Riel Sur;
//   · se guarda y se recarga: las etapas, el depósito y la caja siguen; una partida de antes (sin `puestosRuta`) carga con los cuatro
//     abandonados; ningún error de consola en todo el recorrido.
// Uso (desde la carpeta del proyecto, después de `node armar.mjs`):
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-6-puestos.cjs -Espera 1200 -Perfil C:\carpeta -Arg1 --salida=C:\carpeta-capturas
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const salida = path.resolve(arg('salida', path.join(raiz, 'pruebas', 'salidas', 'puestos-46')));
const [ANCHO, ALTO] = arg('tam', '1366x768').split('x').map(Number);
const CALIDAD = arg('calidad', 'media');
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const IDS = ['A', 'B', 'C', 'D'];

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, J = H.jugador;
  const A = window.__A = {};
  H.ajustes.limiteFps = 'libre';
  A.dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  A.cuadros = async (n = 6, ms = 60) => { for (let i = 0; i < n; i++) { if (H.__caidas.modo() === 'pausa') H.volverAlJuego(true); if (H.__caidas.modo() === 'jugando') J.actualizar(0.05); H.__bucle(); await A.dormir(ms); } return 1; };
  A.modo = () => H.__caidas.modo();
  A.PJ = () => H.__puestos().juego;
  A.etapa = (id) => (H.progreso.puestosRuta?.[id]?.etapa ?? -1);
  // pararse en el punto local (lx, lz) del puesto mirando a (mx, mz) local
  A.ubicarEn = (id, lx, lz, mx = 0, mz = 0) => {
    const p = A.PJ().aMundo(id, lx, lz), m = A.PJ().aMundo(id, mx, mz);
    J.ubicar(p.x, p.z, Math.atan2(-(m.x - p.x), -(m.z - p.z)));
    if (J.estado.pitch !== undefined) J.estado.pitch = -0.08;
    return p;
  };
  // la cámara quieta para las capturas: desde (lx, lz) local, a «alto» m sobre el terreno, mirando al centro del puesto
  A.camara = (id, lx, lz, alto = 1.7, fov = 60) => {
    const p = A.PJ().aMundo(id, lx, lz), c = A.PJ().def(id).pos, y = H.T.altura(p.x, p.z) + alto, yc = H.T.altura(c.x, c.z) + 1.2;
    const yaw = Math.atan2(-(c.x - p.x), -(c.z - p.z)), pitch = Math.atan2(yc - y, Math.hypot(c.x - p.x, c.z - p.z));
    H.__camaraFija = { x: p.x, y, z: p.z, yaw, pitch }; H.camara.fov = fov; H.camara.updateProjectionMatrix();
    return 1;
  };
  A.soltarCamara = () => { H.__camaraFija = null; H.camara.fov = 72; H.camara.updateProjectionMatrix(); return 1; };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [], consola = [];
  const w = new BrowserWindow({ show: false, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || e.level === 'warning' && /puestos-ruta/.test(m) || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { consola.push(m.slice(0, 300)); errores.push(`consola: ${m.slice(0, 300)}`); }
  });
  w.webContents.on('render-process-gone', (_e, d) => errores.push(`se cayó la página: ${JSON.stringify(d)}`));
  let donde = 'carga';
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 120 s (${donde})`)), 120000))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const A = (c) => js(`(()=>{ const A = window.__A, H = window.__hojarasca, P = H.progreso, J = H.jugador; return (${c}) })()`);
  const foto = async (nombre) => {
    await A('A.cuadros(6, 120)'); await esperar(900);
    w.webContents.invalidate(); await esperar(200);
    await js(`Promise.race([new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(()=>r('ok')))), new Promise((r)=>setTimeout(()=>r('sin cuadros'),1500))])`);
    let img = null;
    for (let i = 0; i < 4 && !img; i++) { try { img = await w.webContents.capturePage({ x: 0, y: 0, width: ANCHO, height: ALTO }); } catch (e) { await esperar(500); } }
    if (!img) { console.log('  (sin captura de ' + nombre + ')'); return; }
    const s = img.getSize();
    fs.writeFileSync(path.join(salida, `${nombre}.png`), (s.width === ANCHO && s.height === ALTO ? img : img.resize({ width: ANCHO, height: ALTO, quality: 'best' })).toPNG());
    console.log(`  captura ${nombre}.png (${s.width}×${s.height})`);
  };
  // las capturas de un puesto: de frente en diagonal y del costado del depósito
  const fotosPuesto = async (id, sufijo) => {
    await A(`(P.horas = 11.5, A.camara('${id}', 4.5, 11.5, 2.2), 1)`); await foto(`puesto-${id}-${sufijo}`);
    await A(`(A.camara('${id}', -9.5, 5.5, 1.8), 1)`); await foto(`puesto-${id}-${sufijo}-costado`);
    if (!/etapa/.test(sufijo)) { await A(`(A.camara('${id}', 7, -9, 10, 58), 1)`); await foto(`puesto-${id}-${sufijo}-arriba`); }   // (de arriba y desde atrás: que nada atraviese ni flote)
    await A('A.soltarCamara()');
  };
  w.webContents.on('did-finish-load', () => w.webContents.enableDeviceEmulation({ screenPosition: 'desktop', screenSize: { width: ANCHO, height: ALTO }, viewSize: { width: ANCHO, height: ALTO }, deviceScaleFactor: 1, scale: 1 }));
  w.webContents.on('did-finish-load', () => w.webContents.insertCSS('*, *::before, *::after { transition: none !important; } #pista-clic { display: none !important; }'));
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const H = 'window.__hojarasca';
  const key = async (keyCode) => { w.webContents.sendInputEvent({ type: 'keyDown', keyCode }); w.webContents.sendInputEvent({ type: 'keyUp', keyCode }); await esperar(80); };
  const entrar = async () => {
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.jugador && ${H}.__caidas && ${H}.__puestos)`).catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(4000);
    await js(PAGINA);
    w.webContents.focus();
    await A('A.cuadros(10, 80)');
  };
  // E de verdad (la tecla), con el aviso recién calculado
  const conE = async () => { await A('H.__avisoYa()'); await key('E'); await A('A.cuadros(4, 50)'); };

  try {
    // ---------------------------------------------------------------- 1. una partida nueva
    seccion('1. una partida nueva del Relax');
    await abrir();
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: '${CALIDAD}', clima: 'despejado', estacion: 'verano', musica: false, modo: 'relax', relaxTipo: 'libre', autoCalidad: false, guiaPrimerDia: false })); 1`);
    await abrir();
    await entrar();
    ok(await A('A.modo() === "jugando" && P.modo !== "desafio"'), 'se está jugando en el Relax');
    const mundo = await A('(() => { const m = H.__puestos().mundo; return m ? { n: Object.keys(m.puestos).length, info: m.info(), mallas: Object.values(m.puestos).map((p) => !!p.malla.parent) } : null; })()');
    ok(mundo && mundo.n === 4 && mundo.mallas.every(Boolean), `los cuatro puestos están en la escena (${JSON.stringify(mundo)})`);
    ok(await A(`['A','B','C','D'].every((id) => A.etapa(id) === 0)`), 'los cuatro arrancan abandonados (etapa 0)');
    const par = await A('H.tren.paradas.map((p) => ({ n: p.nombre, ap: !!p.apeadero, s: Math.round(p.s), luz: !!p.luz?.isLight }))');
    ok(par.length === 5 && par.some((p) => p.n === 'Puesto del Riel Sur' && p.ap && !p.luz), `la trochita tiene cinco paradas y el Riel Sur es un apeadero sin luz (${JSON.stringify(par)})`);
    const luces = await A('(() => { let n = 0; H.escena.traverse((o) => { if (o.isLight) n++; }); return n; })()');
    console.log(`  luces en la escena: ${luces}`);

    // ---------------------------------------------------------------- 2. llegar caminando y verlos abandonados
    seccion('2. llegar caminando a cada puesto (abandonado)');
    await A('(P.horas = 11.5, 1)');
    for (const id of IDS) {
      // desde 26 m adelante (el frente mira a la vía o al sendero), caminando hacia la puerta; el Riel Sur, desde su andén (como al
      // bajar del tren) y, más abajo, también desde el costado
      if (id === 'D') await A(`(() => { const D = H.tren.paradas.find((p) => p.apeadero); J.ubicar(D.anden.x, D.anden.z, 0); return 1; })()`);
      else await A(`A.ubicarEn('${id}', 1.5, 26, 0, 3)`);
      await A('A.cuadros(6, 30)');
      const d0 = await A(`(() => { const p = A.PJ().punto('${id}', 'puerta'); return Math.hypot(J.estado.pos.x - p.x, J.estado.pos.z - p.z); })()`);
      w.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'W' });
      let d1 = d0;
      for (let k = 0; k < 14 && d1 > 3.2; k++) {
        await A(`(() => { const p = A.PJ().punto('${id}', 'puerta'); J.estado.yaw = Math.atan2(-(p.x - J.estado.pos.x), -(p.z - J.estado.pos.z)); return 1; })()`);
        await A('A.cuadros(12, 20)');
        d1 = await A(`(() => { const p = A.PJ().punto('${id}', 'puerta'); return Math.hypot(J.estado.pos.x - p.x, J.estado.pos.z - p.z); })()`);
      }
      w.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'W' });
      await A('A.cuadros(4, 30)');
      ok(d1 < 3.2, `${id}: se llega caminando a la puerta (de ${d0.toFixed(1)} m a ${d1.toFixed(1)} m)`);
      const av = await A('H.__avisoYa()');
      ok(/^Reparar el puesto .*\(1 de 3: paredes y puerta\) · \$3\.000, 5 tablas y 2 piedras$/.test(av?.texto || ''), `${id}: el aviso ofrece repararlo («${av?.texto}»)`);
      await fotosPuesto(id, '0-abandonado');
    }
    { // el Riel Sur también desde el costado, por la estepa
      await A("A.ubicarEn('D', 26, 1.5, 0, 2.5)"); await A('A.cuadros(6, 30)');
      w.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'W' });
      let d1 = 99;
      for (let k = 0; k < 14 && d1 > 3.2; k++) {
        await A("(() => { const p = A.PJ().punto('D', 'puerta'); J.estado.yaw = Math.atan2(-(p.x - J.estado.pos.x), -(p.z - J.estado.pos.z)); return 1; })()");
        await A('A.cuadros(12, 20)');
        d1 = await A("(() => { const p = A.PJ().punto('D', 'puerta'); return Math.hypot(J.estado.pos.x - p.x, J.estado.pos.z - p.z); })()");
      }
      w.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'W' }); await A('A.cuadros(4, 30)');
      ok(d1 < 3.2, `D: también se llega desde el costado (a ${d1.toFixed(1)} m)`);
    }

    // ---------------------------------------------------------------- 3. repararlos en tres etapas
    seccion('3. reparar en tres etapas');
    // sin nada: E dice qué falta y no cobra
    await A(`(P.materiales.tabla = 0, P.materiales.piedra = 0, P.economia.pesos = 0, A.ubicarEn('A', 0, 4.5, 0, 0), 1)`);
    await conE();
    ok(await A(`A.etapa('A') === 0`), 'sin plata ni materiales, E no repara');
    for (const id of IDS) {
      await A(`(P.economia.pesos = 20000, P.materiales.tabla = 12, P.materiales.piedra = 12, A.ubicarEn('${id}', 0.6, 4.6, 0, 0), 1)`);
      for (let e = 1; e <= 3; e++) {
        const antes = await A('({ pesos: P.economia.pesos, tabla: P.materiales.tabla, piedra: P.materiales.piedra })');
        await conE();
        const despues = await A(`({ etapa: A.etapa('${id}'), pesos: P.economia.pesos, tabla: P.materiales.tabla, piedra: P.materiales.piedra, malla: H.__puestos().mundo.puestos['${id}'].firma })`);
        ok(despues.etapa === e && antes.pesos - despues.pesos === 3000, `${id}: etapa ${e} hecha, cobró $${antes.pesos - despues.pesos} (${JSON.stringify(despues)})`);
        if (id === 'A' && e < 3) await fotosPuesto(id, `${e}-etapa`);
        await A(`A.ubicarEn('${id}', 0.6, 4.6, 0, 0)`);
      }
      const fin = await A('({ tabla: P.materiales.tabla, piedra: P.materiales.piedra, pesos: P.economia.pesos })');
      ok(fin.tabla === 2 && fin.piedra === 2 && fin.pesos === 11000, `${id}: en total, $9.000, 10 tablas y 10 piedras (${JSON.stringify(fin)})`);
      const caja = await A(`P.comercio.mercado?.[A.PJ().def('${id}').nombre]?.caja`);
      ok(caja === 5000, `${id}: el puesto abre con $5.000 en la caja (${caja})`);
      await fotosPuesto(id, '3-reparado');
    }

    // ---------------------------------------------------------------- 4. descanso, depósito y fogón
    seccion('4. dormir, el depósito y el fogón');
    {
      await A(`(P.horas = 21, A.ubicarEn('C', 0.8, 0.2, 0, -1), 1)`);
      await A('A.cuadros(4, 40)');
      const av = await A('H.__avisoYa()');
      ok(av?.texto === 'Dormir en el catre del puesto', `adentro, de noche, el aviso ofrece el catre («${av?.texto}»)`);
      const dia0 = await A('P.dia');
      await conE();
      await esperar(3500); await A('A.cuadros(10, 60)');
      const d = await A('({ dia: P.dia, horas: P.horas, descansado: J.estado.descansado })');
      ok(d.dia === dia0 + 1 && d.horas < 9 && d.descansado > 0, `dormiste en el puesto: pasó la noche y amaneciste descansado (${JSON.stringify(d)})`);
      // el depósito: guardar lo que llevás, sacar todo
      await A(`(P.horas = 11, P.materiales.tronco = 6, P.materiales.tabla = 9, P.materiales.piedra = 3, P.materiales.lana = 0, A.ubicarEn('C', -4.8, 0.2, -3.3, 0), 1)`);
      const avd = await A('H.__avisoYa()');
      ok(/^Guardar en el depósito del puesto/.test(avd?.texto || ''), `junto al alero, el aviso ofrece guardar («${avd?.texto}»)`);
      await conE();
      const g = await A(`({ g: P.puestosRuta.C.deposito.g, m: { tronco: P.materiales.tronco, tabla: P.materiales.tabla, piedra: P.materiales.piedra } })`);
      ok(g.g.tronco === 6 && g.g.tabla === 9 && g.g.piedra === 3 && !g.m.tronco && !g.m.tabla && !g.m.piedra, `guardaste en el depósito (${JSON.stringify(g)})`);
      await A(`(A.camara('C', -8.5, 3.5, 1.8), 1)`); await foto('puesto-C-deposito-lleno'); await A('A.soltarCamara()');
      await A(`A.ubicarEn('C', -4.8, 0.2, -3.3, 0)`);
      await conE();
      const s = await A(`({ g: P.puestosRuta.C.deposito.g, m: { tronco: P.materiales.tronco, tabla: P.materiales.tabla, piedra: P.materiales.piedra } })`);
      ok(!Object.keys(s.g).length && s.m.tronco === 6 && s.m.tabla === 9 && s.m.piedra === 3, `y sin nada a mano, sacaste todo (${JSON.stringify(s)})`);
      await A(`(P.materiales.tronco = 4, P.materiales.tabla = 0, P.materiales.piedra = 0, A.ubicarEn('C', -4.8, 0.2, -3.3, 0), 1)`);
      await conE();   // (queda algo guardado para ver que sobrevive a la recarga)
      // el fogón
      await A('(P.ramitas = 10, A.ubicarEn("C", 3.6, 5.4, 3.6, 4.0), H.perro.est.pos.x += 40, 1)');   // (el perro lejos: mirarlo pide un rastro, que va antes)
      const avf = await A('H.__avisoYa()');
      // (el aviso de la F va después de todo lo de la E: si el perro marca algo o pide un rastro, eso se ve primero, como en el refugio)
      const fc = await A(`!!A.PJ().fogonCerca(J.estado.pos)`);
      ok(fc && ((avf?.tecla === 'F' && avf?.texto === 'Encender el fogón del puesto') || /perro/i.test(avf?.texto || '')), `junto al fogón, el aviso ofrece prenderlo («${avf?.tecla} ${avf?.texto}»)`);
      await key('F'); await A('A.cuadros(6, 50)');
      const fuego = await A(`(() => { const f = A.PJ().punto('C', 'fogon'); return !!H.clima.fuegoEn(f.x, f.z, 1.5); })()`);
      ok(fuego, 'F prendió el fogón del puesto');
      await A(`(P.horas = 19.2, A.camara('C', 7.5, 9, 1.9), 1)`); await foto('puesto-C-fogon-prendido'); await A('(A.soltarCamara(), P.horas = 11, 1)');
    }

    // ---------------------------------------------------------------- 5. comprar y vender
    seccion('5. comprar y vender en el puesto');
    {
      await A(`(P.economia.pesos = 6000, P.materiales.tronco = 8, A.ubicarEn('A', -1.35, 2.55, -1.35, 0), 1)`);
      const av = await A('H.__avisoYa()');
      ok(av?.texto === 'Comerciar en el puesto de la cantera', `en la ventanilla, el aviso ofrece comerciar («${av?.texto}»)`);
      await conE();
      const panel = await A('({ abierto: H.__cargas().abierto(), titulo: document.querySelector("#cargas .quien")?.textContent, seguir: document.querySelector("#cargas .seguir")?.textContent, filas: H.__cargas().filas().map((f) => f.titulo) })');
      ok(panel.abierto && /^Puesto · Puesto de la Cantera · Comprar$/.test(panel.titulo) && /^Tab: comprar o vender/.test(panel.seguir), `el panel del puesto (${JSON.stringify(panel)})`);
      await foto('puesto-A-panel-comprar');
      // vender un lote de troncos (el capataz los pide)
      await key('Tab'); await A('A.cuadros(2, 40)');
      ok(await A('H.__cargas().modo() === "vender"'), 'Tab pasa a vender');
      const filas = await A('H.__cargas().filas().map((f) => ({ bien: f.bien, titulo: f.titulo, marca: f.marca }))');
      const i = filas.findIndex((f) => f.bien === 'tronco');
      const v0 = await A(`({ pesos: P.economia.pesos, tronco: P.materiales.tronco, caja: P.comercio.mercado['Puesto de la Cantera'].caja })`);
      ok(await A(`H.__cargas().elegir(${i})`), `vender troncos (${JSON.stringify(filas[i])})`);
      const v1 = await A(`({ pesos: P.economia.pesos, tronco: P.materiales.tronco, caja: P.comercio.mercado['Puesto de la Cantera'].caja })`);
      ok(v1.tronco === v0.tronco - 2 && v1.pesos > v0.pesos && v0.caja - v1.caja === v1.pesos - v0.pesos, `vendiste 2 troncos: te pagaron de la caja del puesto (${JSON.stringify([v0, v1])})`);
      await key('Tab'); await A('A.cuadros(2, 40)');
      ok(await A('H.__cargas().modo() === "comprar"'), 'Tab vuelve a comprar (no hay fletes)');
      const fc = await A('H.__cargas().filas().map((f) => ({ bien: f.bien, marca: f.marca }))');
      const j = fc.findIndex((f) => f.bien === 'piedra');
      const c0 = await A('({ pesos: P.economia.pesos, piedra: P.materiales.piedra || 0 })');
      ok(await A(`H.__cargas().elegir(${j})`), `comprar piedra (${JSON.stringify(fc[j])})`);
      const c1 = await A('({ pesos: P.economia.pesos, piedra: P.materiales.piedra || 0 })');
      ok(c1.piedra === c0.piedra + 4 && c1.pesos < c0.pesos, `compraste 4 piedras (${JSON.stringify([c0, c1])})`);
      // alejarse cierra el panel
      await A(`A.ubicarEn('A', -1.35, 9, -1.35, 0)`); await A('A.cuadros(6, 40)');
      ok(await A('!H.__cargas().abierto()'), 'al alejarte de la ventanilla, el panel se cierra');
      // el Riel Sur: el panel de la trochita, con fletes
      await A(`A.ubicarEn('D', -1.35, 2.55, -1.35, 0)`); await A('A.cuadros(4, 40)');
      const avD = await A('H.__avisoYa()');
      ok(avD?.texto === 'Comerciar en el puesto de cargas', `en el Riel Sur, el puesto de cargas de la trochita («${avD?.texto}»)`);
      await conE();
      await key('Tab'); await key('Tab'); await A('A.cuadros(2, 40)');
      const pD = await A('({ abierto: H.__cargas().abierto(), modo: H.__cargas().modo(), titulo: document.querySelector("#cargas .quien")?.textContent, filas: H.__cargas().filas().length })');
      ok(pD.abierto && pD.modo === 'fletes' && /Cargas · Puesto del Riel Sur · Fletes/.test(pD.titulo) && pD.filas > 0, `el Riel Sur tiene fletes como toda parada (${JSON.stringify(pD)})`);
      await key('Escape'); await A('(H.__cargas().cerrar(), A.cuadros(2, 40))');
    }

    // ---------------------------------------------------------------- 6. la trochita para en el Riel Sur
    seccion('6. la trochita para en el Riel Sur');
    {
      const r = await A(`(async () => {
        const t = H.tren, e = t.est, D = t.paradas.find((p) => p.nombre === 'Puesto del Riel Sur'), total = H.T.riel.largo;
        const antes = t.paradas[(t.paradas.indexOf(D) - 1 + t.paradas.length) % t.paradas.length];
        J.ubicar(D.anden.x + 6, D.anden.z + 6, 0);
        e.s = ((D.s - 120) % total + total) % total; e.vel = 6; e.parado = 0; e.proxima = D;
        let paro = null;
        for (let k = 0; k < 900 && !paro; k++) {
          t.actualizar(0.1, J, H.camara, { pausado: false });
          if (e.parado > 0 && e.vel === 0) { const dd = ((e.s - D.s - (t.tren?.adelanto || 0)) % total + total) % total; paro = { s: Math.round(e.s), d: +Math.min(dd, total - dd).toFixed(1), cabeza: t.enVia(e.s) }; }
          if (k % 60 === 0) await A.dormir(1);
        }
        return { paro, antes: antes.nombre, D: Math.round(D.s) };
      })()`);
      ok(!!r.paro && r.paro.d < 2, `el tren paró en el andén del Riel Sur (${JSON.stringify(r)})`);
      await A(`(() => { const D = H.tren.paradas.find((p) => p.nombre === 'Puesto del Riel Sur'); J.ubicar(D.anden.x, D.anden.z, 0); return 1; })()`);
      await A(`(A.camara('D', -12, 24, 7, 62), 1)`); await foto('puesto-D-tren-parado'); await A('A.soltarCamara()');
    }

    // el mapa, con los puestos rotulados
    await A('(H.volverAlJuego?.(true), 1)'); await key('M'); await esperar(900);
    if (await A('A.modo() === "mapa"')) { await foto('mapa-con-puestos'); await key('M'); await esperar(400); }
    else console.log('  (el mapa no abrió con M)');
    await A('(A.modo() !== "jugando" ? H.volverAlJuego(true) : 0, 1)');

    // ---------------------------------------------------------------- 7. guardar y recargar; una partida de antes
    seccion('7. guardar y recargar');
    {
      await A('(H.guardar(), 1)'); await esperar(600);
      const antes = await A(`({ etapas: ['A','B','C','D'].map((id) => A.etapa(id)), dep: P.puestosRuta.C.deposito.g, caja: P.comercio.mercado['Puesto de la Cantera'].caja })`);
      await abrir(); await entrar();
      const despues = await A(`({ etapas: ['A','B','C','D'].map((id) => A.etapa(id)), dep: P.puestosRuta.C.deposito.g, caja: P.comercio.mercado['Puesto de la Cantera'].caja, firmas: Object.values(H.__puestos().mundo.puestos).map((p) => p.firma) })`);
      ok(JSON.stringify(despues.etapas) === JSON.stringify(antes.etapas) && JSON.stringify(despues.dep) === JSON.stringify(antes.dep) && despues.caja >= antes.caja, `recargada: siguen las etapas, el depósito y la caja (${JSON.stringify([antes, despues])})`);
      ok(despues.firmas.every((f) => /^3\|/.test(f)), `y se ven reparados (${despues.firmas.join(', ')})`);
      // una partida de antes de la 4.6: sin `puestosRuta`
      const armada = await js(`(() => {
        const clave = Object.keys(localStorage).find((k) => { try { const p = JSON.parse(localStorage.getItem(k)); return p && typeof p === 'object' && p.versionGuardado && p.modo !== 'desafio' && Object.hasOwn(p, 'puestosRuta'); } catch { return false; } });
        if (!clave) return null;
        const p = JSON.parse(localStorage.getItem(clave));
        delete p.puestosRuta;
        localStorage.setItem(clave, JSON.stringify(p));
        Storage.prototype.setItem = function () {};
        return clave;
      })()`);
      ok(!!armada, `la partida guardada está en «${armada}»`);
      const errAntes = consola.length;
      await abrir(); await entrar();
      const vieja = await A(`({ modo: A.modo(), etapas: ['A','B','C','D'].map((id) => A.etapa(id)), firmas: Object.values(H.__puestos().mundo.puestos).map((p) => p.firma) })`);
      ok(vieja.modo === 'jugando' && vieja.etapas.every((e) => e === 0) && vieja.firmas.every((f) => /^0\|/.test(f)), `una partida de antes carga con los cuatro abandonados (${JSON.stringify(vieja)})`);
      ok(consola.length === errAntes, `cargar la partida de antes no dejó errores (${consola.slice(errAntes).join(' | ')})`);
    }

    seccion('fin');
    ok(consola.length === 0, `sin errores de consola en todo el recorrido (${consola.length}${consola.length ? ': ' + consola.slice(0, 5).join(' | ') : ''})`);
  } catch (e) {
    errores.push(`excepción en «${donde}»: ${e && e.stack ? e.stack : e}`);
    console.log(`✗ excepción en «${donde}»: ${e && e.stack ? e.stack : e}`);
  }
  console.log(errores.length ? `HUMO 4.6 puestos: ${errores.length} FALLAS\n  ${errores.join('\n  ')}` : 'HUMO 4.6 puestos: OK');
  app.exit(errores.length ? 1 : 0);
});

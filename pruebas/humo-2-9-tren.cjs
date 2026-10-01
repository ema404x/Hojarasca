// Partida real 2.9 (Electron + WebGL): la trochita de maquinista y el comercio entre
// pueblos. Con el tren parado en una estación se sube a la cabina (E al lado de la
// locomotora), se toma un flete, se acelera con W de verdad, se frena con S en el andén de
// la parada siguiente (el tramo largo se adelanta llamando al tren), se cobra el flete, se
// compra y se vende en el puesto de cargas, se baja, el tren vuelve a andar solo, se
// comercia a pie, se sube de pasajero como siempre, y todo sigue igual al recargar.
// Guarda y devuelve el localStorage que había (las pruebas de humo comparten perfil).
// Uso: npx electron pruebas/humo-2-9-tren.cjs   (--user-data-dir=<carpeta> o
//      HUMO_PERFIL=<carpeta> para un perfil aparte)
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const perfil = process.env.HUMO_PERFIL || (process.argv.find((a) => a.startsWith('--user-data-dir=')) || '').split('=')[1];
if (perfil) app.setPath('userData', path.resolve(perfil));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [], avisos = [];
  const w = new BrowserWindow({ show: false, width: 1100, height: 700, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = 'carga';
  const js = (c) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 120 s (${donde})`)), 120000)),
  ]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const listo = async () => {
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca?.tren').catch(() => false)) return true; }
    return false;
  };
  const entrar = async () => { await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000); };
  const H = 'window.__hojarasca';
  const tecla = (code, tipo = 'keydown') => js(`document.dispatchEvent(new KeyboardEvent('${tipo}', { code: '${code}', bubbles: true })); 1`);
  const aviso = () => js(`${H}.__aviso()`);
  // con la ventana escondida los cuadros van lentos: se dibujan a mano (con limiteFps 'libre')
  const cuadros = (n) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  const toque = async (code) => { await tecla(code); await tecla(code, 'keyup'); await cuadros(3); await esperar(200); };
  // lo que interesa del tren, la cabina y el puesto
  const mirar = () => js(`(()=>{ const H = ${H}, t = H.tren, j = H.jugador.estado, c = H.__cargas(), tab = document.getElementById('cabina');
    return { conduce: t.conduciendo(), enTren: j.enTren, parado: t.parado(), vel: +t.est.vel.toFixed(2), anden: t.paradaCabina()?.nombre || null,
      auto: { parado: +t.est.parado.toFixed(1), proxima: t.est.proxima?.nombre },
      tablero: tab && !tab.classList.contains('oculto') ? { kmh: tab.querySelector('.cabina-kmh')?.textContent, reg: tab.querySelector('.cabina-regulador')?.style.width, prox: tab.querySelector('.cabina-proxima')?.textContent } : null,
      panel: c.abierto() ? { modo: c.modo(), parada: c.parada()?.nombre, filas: c.filas().map((f) => ({ t: f.titulo, clase: f.clase, bien: f.bien || null, hasta: f.flete?.hasta || null })) } : null,
      yerba: H.progreso.cosas.yerba || 0, comercio: JSON.parse(JSON.stringify(H.progreso.comercio || null)), aviso: H.__aviso() } })()`);

  let copiaStorage = null;
  try {
    await abrir();
    ok(await listo(), 'el juego cargó');
    copiaStorage = await js(`JSON.stringify(Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])))`);
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'baja', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', estacion:'invierno'})); 1`);
    await abrir();
    ok(await listo(), 'una partida Relax limpia');
    await entrar();
    ok(await js(`!!${H}.tren && ${H}.tren.paradas.length >= 2 && ${H}.tren.paradas.every((p) => p.cargas)`), 'cada parada tiene su puesto de cargas');

    seccion('subir a la cabina');
    // el tren parado en la primera parada; vos en el andén, al lado de la locomotora, mirando al cielo
    const p = await js(`(()=>{ const H = ${H}, t = H.tren, p0 = t.paradas[0];
      t.est.s = p0.s; t.est.vel = 0; t.est.parado = 90; t.est.proxima = p0;
      const cab = t.enVia(t.est.s - 1.3), nx = Math.cos(cab.ang), nz = -Math.sin(cab.ang);
      const lado = Math.sign((p0.anden.x - cab.x) * nx + (p0.anden.z - cab.z) * nz) || 1;
      H.jugador.ubicar(cab.x + nx * lado * 2.1, cab.z + nz * lado * 2.1, 0); H.jugador.estado.pitch = 1.35;
      H.progreso.cosas.yerba = 80; H.progreso.materiales.lana = 12; H.progreso.materiales.piedra = 16; H.progreso.materiales.tabla = 16; H.progreso.materiales.tronco = 10;
      window.__silbidos = 0; const s = H.sonido.silbato.bind(H.sonido); H.sonido.silbato = (...a) => { window.__silbidos++; return s(...a); };
      const i = t.paradas.indexOf(p0), sig = t.paradas[(i + 1) % t.paradas.length];
      return { desde: p0.nombre, hasta: sig.nombre, puede: t.puedeConducir(H.jugador.estado), subir: t.puedeSubir(H.jugador.estado) } })()`);
    ok(p.puede, `al lado de la locomotora se puede subir a la cabina (${p.desde})`);
    let e = null;
    for (let i = 0; i < 8; i++) { await esperar(500); if (/cabina/.test(await aviso())) break; }
    ok(/Subir a la cabina y manejar/.test(await aviso()), `el aviso lo dice: «${await aviso()}»`);
    await toque('KeyE');
    e = await mirar();
    ok(e.conduce && e.enTren && e.anden === p.desde, `E sube a la cabina, parado en el andén (${JSON.stringify({ conduce: e.conduce, anden: e.anden })})`);
    ok(!!e.tablero && e.tablero.kmh === '0', `el tablero aparece en 0 km/h (${JSON.stringify(e.tablero)})`);
    ok(/Bajar de la cabina/.test(e.aviso), `parado, E baja: «${e.aviso}»`);
    await toque('Space');
    ok(await js('window.__silbidos') >= 1, 'Espacio hace sonar el silbato');

    seccion('un flete a la parada siguiente');
    await toque('KeyC');
    e = await mirar();
    ok(e.panel && e.panel.parada === p.desde && e.panel.modo === 'comprar', `C abre el puesto de cargas del andén (${JSON.stringify(e.panel && { modo: e.panel.modo, parada: e.panel.parada })})`);
    await toque('Tab'); await toque('Tab');
    e = await mirar();
    ok(e.panel?.modo === 'fletes' && e.panel.filas.length >= 2, `Tab pasa a los fletes (${e.panel?.filas.map((f) => f.t).join(' | ')})`);
    let i = e.panel.filas.findIndex((f) => f.hasta === p.hasta);
    if (i < 0) {
      // hoy no hay flete a la siguiente: uno a mano, como los que salen del puesto
      avisos.push('hoy no había flete a la parada siguiente: se tomó uno armado a mano');
      await js(`(()=>{ const H = ${H}; H.__cargas().comercio().fletes.push({ id: 'prueba|1', tipo: 'carga', desde: ${JSON.stringify(p.desde)}, hasta: ${JSON.stringify(p.hasta)}, cuantos: 4, que: 'bolsas de harina', premio: { yerba: 9 }, dia: H.progreso.dia }); return 1 })()`);
    } else await toque(`Digit${i + 1}`);
    e = await mirar();
    const flete = e.comercio.fletes.find((f) => f.hasta === p.hasta);
    ok(!!flete, `se toma el flete hasta ${p.hasta} (${flete ? `${flete.cuantos} ${flete.que}, ${flete.premio.yerba} de yerba` : 'no'})`);
    await toque('Escape');
    ok(!(await mirar()).panel, 'Escape cierra el puesto');

    seccion('acelerar');
    await tecla('KeyW');
    let anda = null;
    // 3.3: el bucle a mano sólo simula el tiempo de reloj que pasó (cadencia de 60): con cuadros
    // más rápidos (sin compilar programas en medio) 600 llamadas son menos segundos de juego
    for (let k = 0; k < 120; k++) { await cuadros(15); anda = await mirar(); if (anda.vel > 1) break; }
    ok(anda.vel > 1, `con W el tren arranca de a poco (${anda.vel} m/s)`);
    ok(anda.tablero && Number(anda.tablero.kmh) > 0 && parseInt(anda.tablero.reg, 10) > 0, `el tablero marca velocidad y regulador (${JSON.stringify(anda.tablero)})`);
    ok(/W: regulador/.test(await js(`document.getElementById('estado').textContent`)), 'abajo dice cómo se maneja');
    await tecla('KeyW', 'keyup');

    seccion('la pausa congela el tren que manejás');
    const instante = () => js(`(()=>{ const t = ${H}.tren, c = t.est.cabina; return JSON.stringify({ s: t.est.s, vel: c.vel, reg: c.regulador, pres: c.presion, freno: c.freno, rec: t.est.recorrido, chaca: t.est.chaca, km: ${H}.progreso.comercio.km }) })()`);
    for (const [nombre, abrirlo, cerrarlo] of [
      ['la pausa', `${H}.abrir('pausa')`, `${H}.volverAlJuego()`],
      ['Personalizar', `${H}.__personal.abrir(null)`, `${H}.__personal.cerrar()`],
      ['la mochila', `document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyI', bubbles: true }))`, `document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyI', bubbles: true }))`],
    ]) {
      await tecla('KeyW');
      await js(`(()=>{ ${abrirlo}; return 1 })()`);
      await cuadros(3);
      const a = await instante();
      await cuadros(40);
      const b = await instante();
      await tecla('KeyW', 'keyup');
      ok(a === b && JSON.parse(a).vel > 0, `con ${nombre} abierta el tren que manejás queda congelado (${a === b ? `a ${JSON.parse(a).vel.toFixed(2)} m/s` : `${a} → ${b}`})`);
      await js(`(()=>{ ${cerrarlo}; return 1 })()`);
      await cuadros(3);
      const c = JSON.parse(await instante());
      ok(c.s !== JSON.parse(b).s && Math.abs(c.vel - JSON.parse(b).vel) < 0.5, `y al volver sigue desde donde estaba (${JSON.parse(b).vel.toFixed(2)} → ${c.vel.toFixed(2)} m/s)`);
    }
    // el tramo largo se adelanta llamando al tren: acelerar, frenar a tiempo y arrimarse
    const viaje = await js(`(()=>{ const H = ${H}, t = H.tren, ctx = H.__ctxTren, destino = t.paradas.find((x) => x.nombre === ${JSON.stringify(p.hasta)});
      const falta = () => ((destino.s - t.est.s) % t.largo + t.largo) % t.largo;
      let n = 0, vmax = 0;
      for (; n < 40000; n++) {
        const d = falta();
        if (d < 8 && t.est.vel > 0) break;
        if (d > 70) { ctx.acelera = true; ctx.frena = false; }
        else if (t.est.vel > 3) { ctx.acelera = false; ctx.frena = true; }
        else if (t.est.vel < 1.5) { ctx.acelera = true; ctx.frena = false; }
        else { ctx.acelera = false; ctx.frena = false; }
        t.actualizar(0.05, H.jugador, H.camara, ctx);
        vmax = Math.max(vmax, t.est.vel);
      }
      return { n, segundos: n * 0.05, vmax: +vmax.toFixed(1), d: +falta().toFixed(1), vel: +t.est.vel.toFixed(2), reg: +t.est.cabina.regulador.toFixed(2) } })()`);
    ok(viaje.d <= 8 && viaje.vel > 0, `se llega rodando despacio al andén de ${p.hasta} (${JSON.stringify(viaje)})`);
    ok(viaje.vmax > 6 && viaje.vmax <= 12, `en el camino tomó velocidad sin pasarse (${viaje.vmax} m/s)`);

    seccion('frenar en la estación');
    const yerbaAntes = (await mirar()).yerba;
    await tecla('KeyS');
    let parado = null;
    for (let k = 0; k < 40; k++) { await cuadros(10); parado = await mirar(); if (parado.vel === 0) break; }
    await tecla('KeyS', 'keyup');
    await cuadros(5);
    parado = await mirar();
    ok(parado.conduce && parado.vel === 0 && parado.parado && parado.anden === p.hasta, `S frena y el tren queda parado en el andén de ${p.hasta} (${JSON.stringify({ vel: parado.vel, anden: parado.anden })})`);
    ok(!parado.comercio.fletes.some((f) => f.hasta === p.hasta) && parado.comercio.entregas >= 1, 'el flete se entrega al llegar');
    ok(parado.yerba === yerbaAntes + flete.premio.yerba, `y se cobra en yerba (${yerbaAntes} → ${parado.yerba})`);
    ok(/Bajar de la cabina/.test(parado.aviso), `el aviso: «${parado.aviso}»`);

    seccion('comerciar en el andén');
    await toque('KeyC');
    e = await mirar();
    ok(e.panel?.parada === p.hasta && e.panel.modo === 'comprar', `C abre el puesto de ${p.hasta}`);
    i = e.panel.filas.findIndex((f) => f.clase === '' && f.bien);
    ok(i >= 0, `hay algo para comprar (${e.panel.filas.map((f) => `${f.t}${f.clase ? ' ✗' : ''}`).join(' | ')})`);
    const bienComprado = e.panel.filas[i].bien;
    const tengo = (b) => js(`${H}.__cargas().tengo(${JSON.stringify(b)})`);
    const antesC = { yerba: e.yerba, cosa: await tengo(bienComprado) };
    await toque(`Digit${i + 1}`);
    e = await mirar();
    const despuesC = { yerba: e.yerba, cosa: await tengo(bienComprado) };
    ok(despuesC.yerba < antesC.yerba && despuesC.cosa > antesC.cosa, `se compra ${bienComprado}: la yerba baja y la carga sube (${JSON.stringify({ antesC, despuesC })})`);
    await toque('Tab');
    e = await mirar();
    i = e.panel.filas.findIndex((f) => f.clase === '' && f.bien && f.bien !== bienComprado);
    if (i < 0) i = e.panel.filas.findIndex((f) => f.clase === '' && f.bien);
    ok(e.panel.modo === 'vender' && i >= 0, `Tab pasa a vender y hay algo que llevás (${e.panel.filas.map((f) => `${f.t}${f.clase ? ' ✗' : ''}`).join(' | ')})`);
    const bienVendido = e.panel.filas[i].bien;
    const antesV = { yerba: e.yerba, cosa: await tengo(bienVendido) };
    await toque(`Digit${i + 1}`);
    e = await mirar();
    const despuesV = { yerba: e.yerba, cosa: await tengo(bienVendido) };
    ok(despuesV.yerba > antesV.yerba && despuesV.cosa < antesV.cosa, `se vende ${bienVendido}: la carga baja y la yerba sube (${JSON.stringify({ antesV, despuesV })})`);
    const cuentas = e.comercio.hoy;
    ok(Object.keys(cuentas.comprados).length === 1 && Object.keys(cuentas.vendidos).length === 1, `el puesto anota lo del día (${JSON.stringify({ c: cuentas.comprados, v: cuentas.vendidos })})`);

    seccion('bajar y el tren sigue solo');
    await toque('KeyE');
    ok(!(await mirar()).panel, 'E cierra el puesto primero');
    await toque('KeyE');
    e = await mirar();
    ok(!e.conduce && !e.enTren, 'E baja de la cabina');
    ok(!e.tablero, 'el tablero se va');
    ok(e.auto.parado > 0 || e.auto.proxima === p.hasta, `el tren vuelve a ser el de siempre: espera o se arrima al poste (${JSON.stringify(e.auto)})`);
    const sAntes = await js(`${H}.tren.est.s`);
    await js(`(()=>{ const t = ${H}.tren; t.est.parado = Math.min(t.est.parado, 0.5); return 1 })()`);
    let sigue = false;
    for (let k = 0; k < 40 && !sigue; k++) { await cuadros(15); sigue = await js(`(()=>{ const t = ${H}.tren; return !t.conduciendo() && (t.est.vel > 0.5 || t.est.parado > 0) && Math.abs(t.est.s - ${sAntes}) > 0.2 })()`); }
    ok(sigue, 'la trochita arranca sola hacia la próxima');
    // el automático no se congela con la pausa: anda como siempre
    const autoPausa = await js(`(()=>{ const H = ${H}, t = H.tren; t.est.parado = 0; t.est.vel = Math.max(t.est.vel, 3); const s0 = t.est.s; H.abrir('pausa'); for (let i = 0; i < 30; i++) H.__bucle(); const s1 = t.est.s; H.volverAlJuego(); return { movio: s1 !== s0, pausado: !!H.__ctxTren.pausado } })()`);
    ok(autoPausa.movio && !autoPausa.pausado, `en la pausa el tren automático sigue andando como siempre (${JSON.stringify(autoPausa)})`);

    seccion('comerciar a pie');
    await js(`(()=>{ const H = ${H}, d = H.tren.paradas.find((x) => x.nombre === ${JSON.stringify(p.hasta)}); H.jugador.ubicar(d.cargas.x, d.cargas.z, 0); H.jugador.estado.pitch = 1.35; return 1 })()`);
    let av = '';
    for (let k = 0; k < 10; k++) { await esperar(500); av = await aviso(); if (/cargas/.test(av)) break; }
    ok(/Comerciar en el puesto de cargas/.test(av), `parado en el puesto: «${av}»`);
    await toque('KeyE');
    e = await mirar();
    ok(e.panel?.parada === p.hasta, 'E abre el puesto a pie');
    await toque('Escape');

    seccion('de pasajero, como siempre');
    const pas = await js(`(()=>{ const H = ${H}, t = H.tren, p0 = t.paradas[0];
      t.est.s = p0.s; t.est.vel = 0; t.est.parado = 60; t.est.proxima = p0;
      const pu = t.enVia(t.est.s - 5.2), nx = Math.cos(pu.ang), nz = -Math.sin(pu.ang);
      const lado = Math.sign((p0.anden.x - pu.x) * nx + (p0.anden.z - pu.z) * nz) || 1;
      H.jugador.ubicar(pu.x + nx * lado * 2.1, pu.z + nz * lado * 2.1, 0); H.jugador.estado.pitch = 1.35;
      return { subir: t.puedeSubir(H.jugador.estado), cabina: t.puedeConducir(H.jugador.estado) } })()`);
    ok(pas.subir && !pas.cabina, `junto al coche se sube de pasajero, no a la cabina (${JSON.stringify(pas)})`);
    for (let k = 0; k < 8; k++) { await esperar(500); if (/trochita/.test(await aviso())) break; }
    await toque('KeyE');
    e = await mirar();
    ok(e.enTren && !e.conduce, 'E sube de pasajero');
    await toque('KeyE');
    e = await mirar();
    ok(!e.enTren, 'y se baja en el andén');

    seccion('se guarda y se recarga');
    const guardado = await js(`(()=>{ const H = ${H}; H.guardar(); return { comercio: JSON.parse(JSON.stringify(H.progreso.comercio)), yerba: H.progreso.cosas.yerba, compra: H.__cargas().tengo(${JSON.stringify(bienComprado)}), venta: H.__cargas().tengo(${JSON.stringify(bienVendido)}) } })()`);
    await esperar(800);
    await abrir();
    ok(await listo(), 'vuelve a cargar');
    await entrar();
    const vuelta = await js(`(()=>{ const H = ${H}; return { comercio: JSON.parse(JSON.stringify(H.progreso.comercio)), yerba: H.progreso.cosas.yerba, compra: H.__cargas().tengo(${JSON.stringify(bienComprado)}), venta: H.__cargas().tengo(${JSON.stringify(bienVendido)}) } })()`);
    ok(JSON.stringify(vuelta.comercio) === JSON.stringify(guardado.comercio), `el comercio vuelve igual (entregas ${vuelta.comercio?.entregas}, ganado ${vuelta.comercio?.ganado}, km ${vuelta.comercio?.km?.toFixed?.(2)})`);
    ok(vuelta.yerba === guardado.yerba && vuelta.compra === guardado.compra && vuelta.venta === guardado.venta, `la yerba y la carga también (${JSON.stringify({ guardado: [guardado.yerba, guardado.compra, guardado.venta], vuelta: [vuelta.yerba, vuelta.compra, vuelta.venta] })})`);
    ok(!(await js(`${H}.tren.conduciendo()`)), 'al cargar, la trochita anda sola');
  } catch (err) {
    errores.push('excepción: ' + (err?.message || err));
  } finally {
    if (copiaStorage) {
      // se devuelve lo que había y se traba la escritura: el guardado del beforeunload no lo pisa
      await js(`(()=>{ const c = JSON.parse(${JSON.stringify(copiaStorage)});
        localStorage.clear(); for (const [k, v] of Object.entries(c)) localStorage.setItem(k, v);
        Storage.prototype.setItem = () => {}; Storage.prototype.removeItem = () => {}; Storage.prototype.clear = () => {}; return 1 })()`).catch(() => {});
    }
  }
  for (const a of avisos) console.log(`! ${a}`);
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  console.log('OK humo 2.9 · la trochita de maquinista y el comercio entre pueblos');
  app.exit(0);
});

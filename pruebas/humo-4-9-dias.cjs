// 4.9 (dias): partida real. Un día con pedidos: el tablón junto a la base, pedir, entregar con E, subir la ayuda del
// vecino, el pronóstico de la noche (la pestaña «La aldea» y la marca en el mapa), guardar y recargar.
//
// Uso (desde PowerShell, de a una; con -Visible para las capturas):
//   powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-9-dias.cjs -Espera 900 -Perfil <carpeta> [-Visible]
// Las capturas van a pruebas\salidas\dias-49 (o a lo que diga HUMO_SALIDA). Sin -Visible sólo comprueba.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const H = 'window.__hojarasca';
const salida = process.env.HUMO_SALIDA ? path.resolve(process.env.HUMO_SALIDA) : path.join(raiz, 'pruebas', 'salidas', 'dias-49');
const CON_FOTOS = process.env.HUMO_OCULTO === '0';

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  const w = new BrowserWindow({ show: true, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300));
  });
  const js = (c) => w.webContents.executeJavaScript(c);
  const ok = (cond, texto) => { pasos.push(`${cond ? '✓' : '✗'} ${texto}`); console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const url = path.join(raiz, 'index.html');
  const tecla = (code) => js(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'${code}',bubbles:true})); 1`);
  const foto = async (nombre) => {
    if (!CON_FOTOS) return;
    fs.mkdirSync(salida, { recursive: true });
    await esperar(900);
    try { await w.webContents.capturePage(); } catch (e) { /* el primero puede venir de antes */ }
    await esperar(500);
    let img = null;
    for (let k = 0; k < 4 && !img; k++) { try { img = await w.webContents.capturePage(); } catch (e) { await esperar(1500); } }
    if (img) fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
    console.log('  foto', nombre, img ? 'ok' : 'SIN IMAGEN');
  };
  const entrar = async () => {
    let listo = false;
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.desafio').catch(() => false)) { listo = true; break; } if (await js('!!window.__hojarasca').catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    return listo || await js('!!window.__hojarasca.desafio');
  };
  const sim = (seg) => js(`(()=>{const H=${H}; for(let i=0;i<${Math.round(seg / 0.05)};i++){ H.progreso.desafio.salud = 100; H.desafio.actualizar(0.05,{noche:0, dtReal:0.05}); } return 1})()`);

  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    ok(await entrar(), 'carga el modo Desafío');
    ok(await js(`typeof ${H}.desafio.aldeaMundo === 'object' && ${H}.desafio.aldeaMundo.sitio.listo`), 'el Desafío tiene su tablón de la aldea');
    await js(`(()=>{ const H=${H}; H.ajustes.limiteFps = 'libre'; H.progreso.desafio.tutorial = 99; return 1 })()`);

    // ------------------------------------------------------------ 1. un día después de cuatro noches
    await js(`(()=>{ const H=${H}, D=H.progreso.desafio; D.semilla = 'COIHUE-4821'; D.oleadas = 4; D.noches = 4; D.oleadaTerminada = true; D.oleadaNoche = 4; H.progreso.dia = 5; H.progreso.horas = 9;
      H.progreso.materiales = { tronco: 30, tabla: 30, piedra: 30, miel: 20 }; D.miel = 20; H.progreso.ramitas = 60; H.progreso.entradas = H.progreso.entradas || {}; H.progreso.entradas.frambuesa = { dia: 1, hora: 1, cantidad: 25 }; return 1 })()`);
    await sim(1.2);
    const aldea = JSON.parse(await js(`JSON.stringify(${H}.progreso.desafio.aldea)`));
    const claves = ['anselmo', 'herminia', 'martin', 'chicos'];
    ok(claves.every((k) => aldea.pedidos[k] && aldea.pedidos[k].hasta === 5), 'a la mañana, los cuatro vecinos pidieron algo (hasta la noche)');
    ok(claves.every((k) => aldea.ayuda[k] === 0), 'y todos ayudan 0');
    const hojas = JSON.parse(await js(`JSON.stringify(Object.values(${H}.desafio.aldeaMundo.hojas).map(h => h.visible))`));
    ok(hojas.length === 4 && hojas.every(Boolean), 'el tablón muestra las cuatro hojas');

    // ------------------------------------------------------------ 2. ir al tablón y mirarlo con E
    const sitio = JSON.parse(await js(`JSON.stringify(${H}.desafio.aldeaMundo.sitio)`));
    const base = JSON.parse(await js(`JSON.stringify(${H}.desafio.ataques.planActual().base)`));
    ok(Math.hypot(sitio.x - base.x, sitio.z - base.z) < 20, 'el tablón está junto a la base');
    await js(`(()=>{ const H=${H}; const yaw = Math.atan2(${base.x} - ${sitio.x}, ${base.z} - ${sitio.z}); const x = ${sitio.x} + Math.sin(yaw) * 2.2, z = ${sitio.z} + Math.cos(yaw) * 2.2; H.jugador.ubicar(x, z, yaw + Math.PI); return 1 })()`);
    await esperar(1200);
    // vista del tablón antes de abrirlo
    if (CON_FOTOS) {
      const y0 = await js(`${H}.desafio.aldeaMundo.grupo.position.y`);
      await js(`(()=>{ const H=${H}; const dx = ${base.x - sitio.x}, dz = ${base.z - sitio.z}, l = Math.hypot(dx, dz) || 1, ux = dx / l, uz = dz / l; window.__cam = { o: [${sitio.x} + ux * 2.5 - uz * 4.2, ${y0} + 1.9, ${sitio.z} + uz * 2.5 + ux * 4.2], a: [${sitio.x}, ${y0} + 1.5, ${sitio.z}] }; return 1 })()`);
      await js(`(()=>{ const H=${H}; const o = H.desafio.actualizar; if (!H.desafio.__cam) { H.desafio.__cam = 1; H.desafio.actualizar = function (dt, c) { const r = o.call(this, dt, c); const k = window.__cam; if (k) { H.camara.position.set(k.o[0], k.o[1], k.o[2]); H.camara.lookAt(k.a[0], k.a[1], k.a[2]); H.camara.updateMatrixWorld(true); } return r; }; } return 1 })()`);
      await js(`(() => { const s = document.createElement('style'); s.id = 'sin-hud'; s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; }'; document.head.appendChild(s); return 1 })()`);
      await foto('tablon-con-pedidos');
      await js(`window.__cam = null; document.getElementById('sin-hud')?.remove(); 1`);
    }
    await esperar(600);
    const modoAntes = await js(`${H}.__caidas.modo()`);
    ok(modoAntes === 'jugando', 'se está jugando');
    console.log('  aviso:', await js(`document.getElementById('aviso').textContent`), '| pos', await js(`JSON.stringify(${H}.jugador.estado.pos)`));
    await tecla('KeyE');
    await esperar(700);
    ok(await js(`${H}.__caidas.modo()`) === 'cuaderno', 'la E junto al tablón abre el cuaderno');
    const pestana = await js(`(document.querySelector('#cuaderno-lista [role=tab][aria-selected=true]') || {}).textContent`);
    ok(pestana === 'La aldea', `en la pestaña «La aldea» (${pestana})`);
    const texto = await js(`document.getElementById('cuaderno-ficha').innerText`);
    ok(/Pedidos de la aldea/.test(texto) && /Anselmo/.test(texto) && /Herminia/.test(texto) && /Martín/.test(texto) && /chicos/i.test(texto), 'los pedidos de los cuatro vecinos');
    ok(/Pide \d+/.test(texto) && /Hasta que salgan los duendes/.test(texto), 'con lo que cuesta y el plazo');
    ok(/La noche que viene/.test(texto) && /Todavía no se sabe|Noche|Sale un mandamás|Despierta/.test(texto), 'y la noche que viene');
    await foto('cuaderno-pedidos');
    // el cuaderno desplazado hasta el pronóstico
    await js(`(()=>{ const f = document.getElementById('cuaderno-ficha'); f.scrollTop = f.scrollHeight; return 1 })()`);
    await foto('cuaderno-noche-sin-nada');

    // ------------------------------------------------------------ 3. entregar el pedido de Anselmo
    await js(`(()=>{ const f = document.getElementById('cuaderno-ficha'); f.scrollTop = 0; return 1 })()`);
    const antes = JSON.parse(await js(`JSON.stringify({ m: ${H}.progreso.materiales, r: ${H}.progreso.ramitas, p: ${H}.progreso.desafio.aldea.pedidos.anselmo, fl: ${H}.progreso.desafio.flechas })`));
    const clicks = await js(`(()=>{ const b = [...document.querySelectorAll('#cuaderno-ficha button')].filter(x => x.textContent === 'Entregar' && !x.disabled); if (!b.length) return 0; b[0].click(); return b.length })()`);
    ok(clicks >= 1, `hay botones de entregar activos (${clicks})`);
    await esperar(500);
    const despues = JSON.parse(await js(`JSON.stringify({ m: ${H}.progreso.materiales, a: ${H}.progreso.desafio.aldea, fl: ${H}.progreso.desafio.flechas })`));
    ok(despues.a.ayuda.anselmo === 1 && !despues.a.pedidos.anselmo, 'Anselmo pasó a ayudar 1 y su pedido se sacó');
    let costo = 0;
    for (const [k, n] of Object.entries(antes.p.pide)) costo += (antes.m[k] || 0) - (despues.m[k] || 0) - ((antes.p.regalo || {})[k] || 0) === n ? 1 : 0;
    ok(costo === Object.keys(antes.p.pide).length, `se cobró lo pedido (${JSON.stringify(antes.p.pide)})`);
    ok(await js(`document.getElementById('cuaderno-ficha').innerText`).then((t) => /ayuda 1 de 2/.test(t)), 'el cuaderno se redibuja con la ayuda nueva');
    await foto('cuaderno-tras-entregar');
    // el resto, entregando (los que se puedan)
    await js(`(()=>{ for (let i = 0; i < 3; i++) { const b = [...document.querySelectorAll('#cuaderno-ficha button')].filter(x => x.textContent === 'Entregar' && !x.disabled); if (b[0]) b[0].click(); } return 1 })()`);
    await esperar(400);
    const nivel = JSON.parse(await js(`JSON.stringify(${H}.progreso.desafio.aldea.ayuda)`));
    ok(claves.every((k) => nivel[k] === 1), `con recursos de sobra, los cuatro quedan en 1 (${JSON.stringify(nivel)})`);

    // ------------------------------------------------------------ 4. el pronóstico: la estación y el perro
    await tecla('Escape');
    await esperar(500);
    ok(await js(`${H}.__caidas.modo()`) === 'jugando', 'Escape cierra el cuaderno');
    await js(`(()=>{ const H=${H}; H.progreso.horas = 16.2; return 1 })()`);
    await sim(1.2);
    await tecla('KeyE');
    await esperar(700);
    let t2 = await js(`document.getElementById('cuaderno-ficha').innerText`);
    ok(/Van a entrar del lado|Van a entrar/.test(t2), 'a las cuatro de la tarde el perro dice por dónde entran');
    const quedo = await js(`${H}.desafio.aldeaMundo.pronostico()`).then((p) => JSON.stringify(p.noches[0].lado));
    ok(/"id":"(rio|monte|camino)"/.test(quedo), `el lado anticipado: ${quedo.slice(0, 80)}`);
    await js(`(()=>{ const f = document.getElementById('cuaderno-ficha'); f.scrollTop = f.scrollHeight; return 1 })()`);
    await foto('cuaderno-noche-con-perro');
    await tecla('Escape');
    await esperar(400);
    // el mapa con la marca
    await tecla('KeyM');
    await esperar(900);
    ok(await js(`${H}.__caidas.modo()`) === 'mapa', 'el mapa se abre');
    ok(await js(`!!${H}.desafio.aldeaMundo.marcaMapa()`), 'y tiene la marca de por dónde entrarían los duendes');
    await foto('mapa-con-marca');
    await tecla('Escape');
    await esperar(500);
    // lo anticipado es lo que después pasa: se decide al atardecer y se compara
    const anticipado = JSON.parse(await js(`JSON.stringify((() => { const p = ${H}.desafio.aldeaMundo.pronostico().noches[0]; return { n: p.n, tipo: p.tipo, lado: p.lado && p.lado.id, x: p.lado && p.lado.x, z: p.lado && p.lado.z }; })())`));
    await js(`(()=>{ const H=${H}; H.progreso.horas = 19.6; return 1 })()`);
    await sim(2);
    const real = JSON.parse(await js(`JSON.stringify((() => { const D = ${H}.progreso.desafio; return { n: D.oleadas + 1, especial: D.especial, lado: D.ladoNoche && D.ladoNoche.id, x: D.ladoNoche && D.ladoNoche.x, z: D.ladoNoche && D.ladoNoche.z }; })())`));
    ok(real.lado === anticipado.lado && real.n === anticipado.n, `el lado de la noche ${real.n} fue el anticipado (${anticipado.lado} → ${real.lado})`);
    ok(real.x === anticipado.x && real.z === anticipado.z, 'y el mismo punto de entrada');
    if (anticipado.tipo) ok((real.especial || 'comun') === anticipado.tipo || ['jefe', 'final'].includes(anticipado.tipo), `y la noche (${anticipado.tipo} → ${real.especial || 'comun'})`);

    // ------------------------------------------------------------ 5. guardar y recargar
    await js(`(()=>{ const H=${H}; H.progreso.horas = 9; H.progreso.dia = 6; H.progreso.desafio.oleadas = 5; H.progreso.desafio.oleadaTerminada = true; H.progreso.desafio.oleadaNoche = 5; return 1 })()`);
    await sim(1.2);
    const pedidosDia6 = JSON.parse(await js(`JSON.stringify(${H}.progreso.desafio.aldea)`));
    ok(claves.every((k) => pedidosDia6.pedidos[k] && pedidosDia6.pedidos[k].nivel === 1 && pedidosDia6.pedidos[k].hasta === 6), 'al otro día piden el segundo pedido (más caro)');
    await js(`${H}.guardar(); 1`);
    await esperar(600);
    await w.loadFile(url, { search: '?debug=1' });
    ok(await entrar(), 'se vuelve a abrir la partida');
    await esperar(1500);
    const recargada = JSON.parse(await js(`JSON.stringify(${H}.progreso.desafio.aldea)`));
    ok(JSON.stringify(recargada.ayuda) === JSON.stringify(pedidosDia6.ayuda), 'la ayuda de los vecinos sobrevive al guardar');
    ok(claves.every((k) => recargada.pedidos[k] && recargada.pedidos[k].id === pedidosDia6.pedidos[k].id), 'y los pedidos de ese día también');
    // la noche cae: se pasan los plazos
    await js(`(()=>{ const H=${H}; H.progreso.horas = 20.7; return 1 })()`);
    await sim(1.2);
    const noche = JSON.parse(await js(`JSON.stringify(${H}.progreso.desafio.aldea)`));
    ok(claves.every((k) => noche.pedidos[k] === null) && noche.vencidos >= 4, 'al caer la noche los pedidos sin cumplir se vencen');
    ok(claves.every((k) => noche.ayuda[k] === 1), 'y la ayuda no baja');
    // una partida vieja (sin aldea) carga con todos en cero
    await js(`(()=>{ const H=${H}; const p = H.progreso; delete p.desafio.aldea; H.guardar(); return 1 })()`);
    await esperar(400);
    await w.loadFile(url, { search: '?debug=1' });
    ok(await entrar(), 'se abre una partida guardada sin aldea');
    const vieja = JSON.parse(await js(`JSON.stringify(${H}.progreso.desafio.aldea)`));
    ok(claves.every((k) => vieja.ayuda[k] === 0), 'carga con todos en 0');
    const fallas = await js(`(${H}.__caidas.fallas && ${H}.__caidas.fallas().length) || 0`);
    ok(fallas === 0, `sin sistemas caídos (${fallas})`);
  } catch (e) {
    errores.push('excepción: ' + (e && e.stack ? e.stack : e));
  }
  console.log(errores.length ? `FALLA 4.9 dias: ${errores.length} problemas\n  - ${errores.join('\n  - ')}` : `OK 4.9 dias (partida real): ${pasos.length} comprobaciones`);
  app.exit(errores.length ? 1 : 0);
});

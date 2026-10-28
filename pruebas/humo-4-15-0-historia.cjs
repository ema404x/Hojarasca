// Partida real 4.15.0 (Electron + WebGL): la Historia nueva, «El trato del molino» (fundación y acto I).
//   1. una Historia nueva arranca en la Estación del Valle al caer la tarde, con la tarjeta del capítulo 1 y su panel de objetivos;
//   2. el capítulo 1 de punta a punta con la E de verdad: la llave de Eusebio en la puerta, la ronda de ramitas y el canto blanco del umbral;
//   3. el capítulo 2: el alero (cuatro tablas con la E), la tarjeta de decisión de la bolsa, la raíz del coihue y la tarjeta de cierre con su variante;
//   4. el capítulo 4: la barra del ramal y los lazos en palabras; el cuaderno de lo raro en la guía;
//   5. el reinicio: una partida vieja en modo Historia se reinicia (con copia aparte y tarjeta de aviso); el Relax libre y la historia en pausa no;
//   6. ningún programa de shader nuevo, sin errores de consola.
// Las escenas del acto I las escribe otro agente (src/historia-escenas-acto1.js): si todavía no están, las que faltan se dan por vistas
// (la historia nunca se traba por una escena que falta); si están, la prueba las saltea con Esc dos veces.
// Uso (después de `node armar.mjs`), en el monitor externo y con perfil propio:
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-15-0-historia.cjs -Espera 900 -Perfil <carpeta propia> [-Visible]
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'historia-4-15-0'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 14 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 14 * 60 * 1000).unref?.();
const CAPTURAS = process.env.HUMO_CAPTURAS !== '0';

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, T = H.T, J = H.jugador, P = H.progreso;
  const N = window.__N = {};
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  H.ajustes.limiteFps = 'libre';
  N.programas = () => H.renderer.info.programs.length;
  N.tick = async (seg = 0.5) => { const t0 = performance.now(); while (performance.now() - t0 < seg * 1000) { H.__bucle(); await dormir(14); } return 1; };
  N.hasta = async (f, max = 20) => { const t0 = performance.now(); while (performance.now() - t0 < max * 1000) { if (f()) return 1; H.__bucle(); await dormir(14); } return 0; };
  N.h = () => P.historia;
  N.tecla = (code) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true, cancelable: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true })); return 1; };
  // la tarjeta del valle a la vista: { titulo, texto, opciones: [{ id, texto, deshabilitada }] } o null
  N.tarjeta = () => {
    const v = document.getElementById('valle-tarjeta');
    if (!v || v.classList.contains('oculto')) return null;
    return { titulo: (v.querySelector('h2') || {}).textContent, arriba: (v.querySelector('.arriba') || {}).textContent, texto: [...v.querySelectorAll('p')].map((p) => p.textContent).join(' | '), lista: [...v.querySelectorAll('li')].map((l) => l.textContent), opciones: [...v.querySelectorAll('button[data-valle-opcion]')].map((b) => ({ id: b.dataset.valleOpcion, texto: b.querySelector('b').textContent, deshabilitada: b.disabled })) };
  };
  N.elegir = (id) => { const b = document.querySelector('#valle-tarjeta button[data-valle-opcion="' + id + '"]'); if (b) b.click(); return !!b; };
  // saltea las escenas que haya (si el otro agente ya las escribió); no toca las tarjetas
  N.despejar = async (maxSeg = 6) => {
    const t0 = performance.now();
    while (performance.now() - t0 < maxSeg * 1000) {
      const es = H.__escenas;
      if (es && es.activa()) {
        const d = es.director.datos && es.director.datos();
        if (d && d.eleccion && N.elegirEscena !== false) { N.tecla('Digit1'); await N.tick(0.3); }   // la primera opción de cada pregunta (en la bolsa es «A»)
        // (Esc sólo con la escena corriendo: sin escena abriría la pausa; la primera vez pide confirmar y la segunda salta)
        if (es.director.fase() === 'corriendo') N.tecla('Escape');
        await dormir(120);
        if (es.activa() && es.director.fase() === 'corriendo') N.tecla('Escape');
        await N.tick(0.4); continue;
      }
      await N.tick(0.4);
      if (!(es && es.activa())) break;
    }
    return 1;
  };
  N.nombresProgramas = () => H.renderer.info.programs.map((p) => p.name + ':' + String(p.cacheKey || ''));
  N.aviso = () => { const a = document.getElementById('aviso'); return a && !a.classList.contains('oculto') ? a.textContent : ''; };
  N.panel = () => { const p = document.getElementById('historia-hud'); return p && !p.classList.contains('oculto') ? { texto: p.textContent, filas: p.querySelectorAll('p').length, hechos: p.querySelectorAll('p.hecho').length, ramal: !!p.querySelector('.ramal'), ramalTexto: (p.querySelector('.ramal') || {}).textContent || '' } : null; };
  N.ref = () => T.lugares.refugio;
  N.puertaDelRefugio = () => { const r = T.lugares.refugio, rot = r.rot || 0, lz = 3.4; return { x: r.x + lz * Math.sin(rot), z: r.z + lz * Math.cos(rot) }; };
  N.ir = (x, z, yaw = 0) => { J.ubicar(x, z, yaw); return 1; };
  N.dist = () => H.__distanciasHistoria();
  // mirar a un objeto de historia desde donde estás (para las capturas)
  N.mira = (id) => { const o = H.__historiaObjetos(), q = o.posiciones[id], j = J.estado, m = o.mallas[id]; if (!q) return 0; const dx = q.x - j.pos.x, dz = q.z - j.pos.z, y = (m ? m.position.y : j.pos.y) + 0.1; j.yaw = Math.atan2(-dx, -dz); j.pitch = Math.atan2(y - (j.pos.y + j.alturaOjos), Math.hypot(dx, dz)); return 1; };
  N.cerca = (id, d = 1.6) => { const o = H.__historiaObjetos(), q = o.posiciones[id], r = T.lugares.refugio, a = Math.atan2(q.x - r.x, q.z - r.z); J.ubicar(q.x + Math.sin(a) * d, q.z + Math.cos(a) * d, 0); return N.mira(id); };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [], consola = [];
  // los mismos puentes que main.cjs (la copia previa de la partida y las fotos), con el preload de verdad
  const { ipcMain } = require('electron');
  require(path.join(raiz, 'copias-main.cjs')).registrarCopias({ ipcMain, app });
  require(path.join(raiz, 'fotos-main.cjs')).registrarFotos({ ipcMain, app });
  const w = new BrowserWindow({ show: true, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false, preload: path.join(raiz, 'preload.cjs') } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { consola.push(m.slice(0, 300)); errores.push(m.slice(0, 200)); }
  });
  w.webContents.on('render-process-gone', (e, d) => console.log('  PROCESO DE LA PÁGINA CAÍDO:', JSON.stringify(d)));
  let donde = 'carga';
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 120 s (${donde})`)), 120000))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const N = (c) => js(`(async () => { const H = window.__hojarasca, N = window.__N, P = H.progreso; return (${c}); })()`);
  let progVisto = 0;
  const vigilar = async (etiqueta) => { const n = await N('N.programas()'); if (progVisto && n !== progVisto) console.log(`  [programas ${progVisto} → ${n} en: ${etiqueta}]`); progVisto = n; };
  const url = process.env.HTML ? path.resolve(process.env.HTML) : path.join(raiz, 'index.html');
  const ajustes = (tipo) => `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'relax', relaxTipo:'${tipo}', autoCalidad:false})); 1`;
  const cargar = async () => {
    await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false); }
    if (!listo) throw new Error('el juego no cargó');
  };
  const abrir = async (tipo) => { await w.loadFile(url, { search: '?debug=1' }); await js(ajustes(tipo)); await cargar(); };
  const foto = async (nombre) => {
    if (!CAPTURAS) return;
    for (let intento = 0; intento < 3; intento++) try {
      await esperar(250 + intento * 600);
      const img = await w.webContents.capturePage();
      fs.writeFileSync(path.join(salida, nombre + '.png'), img.toPNG());
      console.log(`  (captura ${nombre}.png)`);
      return;
    } catch (e) { if (intento === 2) console.log(`  (captura ${nombre} no se pudo: ${e && e.message})`); }
  };
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(PAGINA);
    await N('N.tick(2.5)');
    await N('N.hasta(() => N.tarjeta(), 12)');
  };
  try {
    // ================================================================ 1. una Historia nueva
    donde = 'comienzo';
    await abrir('historia');
    await entrar();
    ok((await N('P.historia.activa && P.historia.version === 2 && P.historia.capitulo === 0')) === true, 'la historia nueva está en curso (versión 2, capítulo 1)');
    const est = await N('(() => { const e = H.T.lugares.estacion.espera, j = H.jugador.estado.pos; return { d: Math.hypot(j.x - e.x, j.z - e.z), horas: P.horas } })()');
    ok(est.d < 8, `empieza en la Estación del Valle (a ${est.d.toFixed(1)} m de la espera)`);
    ok(est.horas > 18 && est.horas < 19.5, `al caer la tarde (hora ${est.horas.toFixed(2)})`);
    const t1 = await N('N.tarjeta()');
    ok(t1 && t1.titulo === 'La llave del molinero' && /capítulo 1 de 13/.test(t1.arriba), `la tarjeta del capítulo 1 (${t1 && t1.titulo} · ${t1 && t1.arriba})`);
    ok(t1 && t1.lista.length === 6 && /Preguntar por Ercilia/.test(t1.texto), 'con sus seis objetivos y el aviso del diario de Esquel');
    await foto('1-tarjeta-capitulo-1'); await vigilar('inicio');
    const prog0 = await N('N.programas()');
    const nombres0 = await N('N.nombresProgramas()');
    await N('N.elegir("empezar")');
    await N('N.tick(1.5)');
    // la primera escena de verdad («Boleto, pasajero»): se mira una línea y se salta
    if (await N('H.__escenas.director.hay("trochita-boleto")')) {
      await N('N.hasta(() => H.__escenas.activa() && H.__escenas.director.datos() && H.__escenas.director.datos().dialogo, 20)');
      await N('N.tick(2.5)');
      ok(await N('H.__escenas.activa() && document.body.classList.contains("escena-en-curso")'), 'la escena «Boleto, pasajero» corre con barras de cine y caja de diálogo');
      await foto('1b-escena-boleto');
      await N('N.tecla("Enter")'); await N('N.tick(1.5)');
      await foto('1c-escena-boleto-2');
    }
    await N('N.despejar(8)');
    await N('N.tick(1)');
    const pan = await N('N.panel()');
    ok(pan && pan.filas === 6, `el panel del HUD con los seis objetivos (${pan && pan.filas})`);
    ok((await N('Object.keys(P.historia.escenas.vistas).includes("trochita-boleto") && Object.keys(P.historia.escenas.vistas).includes("estacion-llegada")')) === true, 'el boleto en la trochita y la llegada a la estación quedan vistos (con la escena o, si falta, dados por vistos)');
    await foto('2-estacion');

    // ================================================================ 2. el capítulo 1
    donde = 'capitulo 1';
    const d0 = await N('N.dist()');
    ok(d0.estacion < 10 && d0.refugio > 100, `las distancias a los lugares con nombre andan (estación ${d0.estacion.toFixed(0)} m, refugio ${d0.refugio.toFixed(0)} m)`);
    // el sendero: algo cruza (sale de tarde cerca del punto de la mitad)
    await N('(() => { const p = H.__puntosHistoria().sendero; N.ir(p.x, p.z, 0); return 1 })()');
    await N('N.tick(1.2)'); await N('N.despejar(8)');
    ok((await N('Object.hasOwn(P.historia.escenas.vistas, "algo-cruza")')) === true, 'en el sendero, al atardecer: «algo cruza»');
    ok((await N('P.historia.raro.some((x) => x.id === "algo-cruzo")')) === true, 'y el cuaderno de lo raro lo anota');
    // el refugio y la puerta
    const pu = await N('N.puertaDelRefugio()');
    await N(`N.ir(${pu.x}, ${pu.z}, 0)`);
    await N('N.tick(1.5)'); await N('N.despejar(3)');
    ok((await N('P.historia.hechos["llave:refugio"] !== undefined')) === true, 'llegar al refugio tilda el objetivo');
    const av = await N('(async () => { await N.tick(0.6); return { aviso: N.aviso(), puerta: !!H.__puertaHistoria() } })()');
    ok(av.puerta && /llave de Eusebio/.test(av.aviso), `en la puerta, la E dice «${av.aviso}»`);
    await foto('3-puerta-del-refugio');
    await N('N.tecla("KeyE")');
    await N('N.tick(0.8)'); await N('N.despejar(8)');
    ok((await N('Object.hasOwn(P.historia.escenas.vistas, "nota-eusebio") && P.historia.hechos["llave:puerta"] !== undefined')) === true, 'con la E se abre la puerta con la llave (la nota de Eusebio) y el objetivo se tilda');
    ok((await N('(() => { const o = H.__historiaObjetos(); return Object.keys(o.mallas).length >= 6 })()')) === true, 'los objetos de historia están armados en el mundo');
    // el fuego y las anotaciones, a la fuerza (se prueban en otras partidas); la noche pasa durmiendo
    await N('(() => { P.entradas.fogata = P.entradas.fogata || { dia: 1 }; P.entradas.coihue = {}; P.entradas.lenga = {}; return 1 })()');
    await N('N.tick(1.2)');
    ok((await N('["fuego", "anotar"].every((k) => P.historia.hechos["llave:" + k] !== undefined)')) === true, 'el fuego y las dos anotaciones se tildan');
    ok((await N('(() => { const o = H.__historiaObjetos(); return !o.mallas["canto-blanco"].visible })()')) === true, 'el canto blanco todavía no está en el umbral');
    await N('(() => { P.dia = 2; P.horas = 7; return 1 })()');
    await N('N.tick(1.5)'); await N('N.despejar(8)');
    ok((await N('Object.hasOwn(P.historia.escenas.vistas, "ronda-umbral")')) === true, 'al despertar, la ronda de ramitas en el umbral');
    const prog1 = await N('N.programas()');
    ok(await N('(() => { const o = H.__historiaObjetos(); return o.mallas["canto-blanco"].visible && o.mallas.ronda.visible })()'), 'el canto blanco y la ronda de ramitas se ven en el mundo');
    await N('N.cerca("canto-blanco", 1.4)');
    await N('N.tick(1)');
    await N('N.cerca("canto-blanco", 1.4)'); await N('N.tick(0.6)');
    await foto('4-canto-blanco-y-ronda'); await vigilar('canto');
    const o1 = await N('(() => { const c = H.__objetoHistoriaCerca(); return c ? { id: c.id, aviso: c.aviso } : null })()');
    ok(o1 && o1.id === 'canto-blanco', `la E sobre el canto blanco (${o1 && o1.aviso})`);
    const av2 = await N('(async () => { await N.tick(0.5); return N.aviso() })()');
    ok(/canto blanco/.test(av2), `el aviso en pantalla lo dice («${av2}»)`);
    await N('N.tecla("KeyE")');
    await N('N.tick(1.5)');
    ok((await N('P.historia.objetos["canto-blanco"] > 0 && P.historia.hechos["llave:canto"] !== undefined')) === true, 'levantarlo tilda el último objetivo');
    ok((await N('P.historia.raro.some((x) => x.id === "ronda-ramitas")')) === true, 'y la ronda quedó en el cuaderno de lo raro');
    await N('N.despejar(1)');
    // la tarjeta de cierre del capítulo 1
    await N('N.hasta(() => N.tarjeta(), 10)');
    const c1 = await N('N.tarjeta()');
    ok(c1 && c1.titulo === 'La llave del molinero' && /terminado/.test(c1.arriba) && /chucao/.test(c1.texto), `la tarjeta de cierre del capítulo 1 (${c1 && c1.arriba})`);
    await foto('5-cierre-capitulo-1'); await vigilar('cierre 1');
    await N('N.elegir("seguir")');
    await N('N.tick(1)');

    // ================================================================ 3. el capítulo 2
    donde = 'capitulo 2';
    const t2 = await N('N.tarjeta()');
    ok(t2 && t2.titulo === 'La bolsa del molinero' && /Don Ramón pasó temprano/.test(t2.texto), 'la tarjeta de entrada del capítulo 2');
    ok((await N('P.historia.capitulo === 1 && P.ramitas >= 6')) === true, 'el premio del capítulo 1: ramitas');
    await N('N.elegir("empezar")');
    await N('N.tick(1)');
    const pan2 = await N('N.panel()');
    ok(pan2 && pan2.filas === 7, `el panel del capítulo 2: siete objetivos, sin el de «cumplir lo que elegiste» (${pan2 && pan2.filas})`);
    // Ramón: la E sobre el vecino arranca su escena (o, sin escena escrita, se da por vista)
    ok((await N('H.__valle.alHablarCon("ramon")')) === true, 'hablarle a Ramón dispara su escena guionada');
    await N('N.tick(0.8)'); await N('N.despejar(8)');
    ok((await N('P.historia.hechos["bolsa:ramon"] !== undefined && P.historia.temas["ramon:alero"] > 0')) === true, 'el objetivo «hablá con Ramón» y su tema de historia');
    // el resto del capítulo que se prueba en otras partidas: viaje, hacha, árbol y banco
    await N('(() => { P.entradas.viaje = { dia: 2 }; P.cosas.hacha = 1; P.talados.push(1); P.historia.hechos["bolsa:banco"] = P.dia; P.materiales.tabla = 6; return 1 })()');
    await N('N.tick(1)');
    // el alero: cuatro tablas con la E
    const al = await N('H.__historiaObjetos().posiciones.alero');
    await N('N.cerca("alero", 1.5)');
    await N('N.tick(1)');
    ok(await N('(() => { const o = H.__historiaObjetos(); return o.mallas.alero.visible })()'), 'el alero roto se ve en el mundo');
    await foto('6-alero'); await vigilar('alero');
    for (let i = 1; i <= 4; i++) {
      const a = await N('(async () => { await N.tick(0.4); const c = H.__objetoHistoriaCerca(); return c ? c.aviso : null })()');
      if (i === 1) ok(a && /alero/.test(a) && /1 de 4/.test(a), `la E del alero: «${a}»`);
      await N('N.tecla("KeyE")');
      await N('N.tick(0.7)');
    }
    ok((await N('P.historia.reparaciones.alero')) === 4 && (await N('P.materiales.tabla')) === 2, `cuatro tablas gastadas con la E (quedan ${await N('P.materiales.tabla')})`);
    // la decisión de la bolsa: la toma la escena «bolsa-alero» (con su pregunta de tres opciones); se juega la primera (A)
    const conEscena = await N('H.__escenas.director.hay("bolsa-alero")');
    if (conEscena) {
      const eleccion = await N('(async () => { await N.hasta(() => { const d = H.__escenas.director.datos(); if (d && d.dialogo) { N.tecla("Enter"); } return d && d.eleccion; }, 60); const d = H.__escenas.director.datos(); return d && d.eleccion ? { opciones: d.eleccion.opciones.map((o) => o.texto), pregunta: d.eleccion.pregunta } : null })()');
      ok(eleccion && eleccion.opciones.length === 3, 'sale la pregunta de la bolsa con tres opciones: ' + (eleccion && eleccion.opciones.join(' / ')));
      await foto('7-decision-bolsa');
      await N('N.tecla("Digit1")');
      await N('N.tick(1)');
      await N('N.despejar(15)');
    } else {
      await N('N.despejar(8)');
      const dec = await N('(async () => { await N.hasta(() => N.tarjeta() && /decisión/i.test(N.tarjeta().arriba), 10); return N.tarjeta() })()');
      ok(dec && dec.titulo === 'La bolsa del molinero' && dec.opciones.length === 3, 'sale la tarjeta de decisión de la bolsa');
      await foto('7-decision-bolsa');
      await N('N.tecla("Digit1")');
    }
    await vigilar('decisión');
    const progAntesDeLaRaiz = await N('N.programas()');   // (4.15.0: ir de día al molino viejo, cerca de (-29, -2), compila un programa de profundidad más en CUALQUIER partida, también en Libre y en la 4.14.0: no es de la historia)
    await N('N.tick(1)');
    ok((await N('P.historia.decisiones.bolsa === "a"')) === true, 'elegir la raíz del coihue: queda guardada la decisión');
    ok(!(await N('N.tarjeta()')), 'la tarjeta se cierra');
    // la raíz del coihue
    const raiz2 = await N('H.__historiaObjetos().posiciones["raiz-coihue"]');
    ok(raiz2 && Number.isFinite(raiz2.x), `la raíz del coihue grande tiene lugar (${raiz2 && raiz2.x.toFixed(0)}, ${raiz2 && raiz2.z.toFixed(0)})`);
    ok((await N('H.__historiaObjetos().mallas["raiz-coihue"].visible')) === true, 'y se ve');
    ok((await N('N.panel().texto')).includes('raíz del coihue'), 'el panel dice lo que hay que cumplir según lo elegido');
    await N('N.cerca("raiz-coihue", 2.2)');
    await N('N.tick(1.2)');
    await foto('8-raiz-del-coihue'); await vigilar('raíz');
    const o2 = await N('(() => { const c = H.__objetoHistoriaCerca(); return c ? c.id : null })()');
    ok(o2 === 'raiz-coihue', `la E sobre la raíz (${o2})`);
    await N('N.tecla("KeyE")');
    await N('N.tick(1)'); await N('N.despejar(1)');
    ok((await N('Object.hasOwn(P.historia.escenas.vistas, "bolsa-coihue") && P.historia.duendes.convidado === 1 && P.historia.lazos.ramon === 1')) === true, 'dejar la bolsa: la escena y lo convidado');
    await N('N.hasta(() => N.tarjeta() && /terminado/.test(N.tarjeta().arriba), 12)');
    const c2 = await N('N.tarjeta()');
    ok(c2 && c2.titulo === 'La bolsa del molinero' && /se rió bajito/.test(c2.texto), 'la tarjeta de cierre del capítulo 2 con la línea de la decisión (A)');
    await foto('9-cierre-capitulo-2'); await vigilar('cierre 2');
    await N('N.elegir("seguir")');
    await N('N.tick(1)');
    ok((await N('P.historia.raro.some((x) => x.id === "bolsa-raiz") && P.materiales.tabla >= 8')) === true, 'lo raro que dejó la decisión y el premio (seis tablas)');

    // ================================================================ 4. el capítulo 4: el ramal y los lazos
    donde = 'capitulo 4';
    await N('N.hasta(() => N.tarjeta(), 8)');
    await N('N.elegir("empezar")');
    await N('N.tick(1)'); await vigilar('capítulo 3');
    await N('H.__trucos().abrir()');
    await N('H.__trucos().ejecutar("historia capitulo 4")'); await vigilar('truco');
    await N('H.__trucos().cerrar()');
    await N('N.hasta(() => N.tarjeta(), 12)');
    const t4 = await N('N.tarjeta()');
    ok(t4 && t4.titulo === 'La señora del ramal', `el truco «historia capitulo 4» deja la tarjeta del capítulo 4 (${t4 && t4.titulo})`);
    await N('N.elegir("empezar")');
    await N('N.tick(1.2)');
    const pan4 = await N('N.panel()');
    ok(pan4 && pan4.ramal && /el ramal/.test(pan4.ramalTexto), `desde el capítulo 4 aparece la barra del ramal («${pan4 && pan4.ramalTexto}»)`);
    await N('(() => { P.historia.hablados.ramon = true; return 1 })()');
    await N('H.__valle.eventos.ev()');
    // Graciela Pugh: existe en el capítulo 4 (armada de a poco) pero no se ve hasta que baja del tren (la escena del andén)
    await N('N.hasta(() => H.__graciela() && H.__graciela().npc(), 25)');
    ok(await N('(() => { const n = H.__graciela() && H.__graciela().npc(); return !!n && n.clave === "graciela" && n.dormido === true })()'), 'Graciela está armada y espera sin verse (todavía no bajó del tren)');
    await N('(() => { P.horas = 10; const e = H.T.lugares.estacion.espera; N.ir(e.x, e.z, 0); return 1 })()');
    await N('N.hasta(() => P.historia.escenas.vistas["anden-graciela"], 12)');
    await N('N.despejar(8)'); await N('N.tick(1.5)');
    const gr = await N('(() => { const n = H.__graciela().npc(); const j = H.jugador.estado.pos; return { vis: n.g.visible && !n.dormido, d: Math.hypot(n.pos.x - j.x, n.pos.z - j.z), planilla: !!n.planilla } })()');
    ok(gr.vis && gr.planilla, `bajó del tren: Graciela se ve en el andén con la tablilla en la mano (a ${gr.d.toFixed(1)} m de vos)`);
    await N('(() => { const n = H.__graciela().npc(), j = H.jugador.estado, dx = n.pos.x - j.pos.x, dz = n.pos.z - j.pos.z; j.yaw = Math.atan2(-dx, -dz); j.pitch = -0.05; return 1 })()');
    await N('N.tick(0.8)');
    await foto('10b-graciela-en-el-anden');
    await foto('10-panel-con-el-ramal'); await vigilar('panel ramal');
    // la guía: lazos en palabras y el cuaderno de lo raro
    await N('(() => { document.getElementById("pausa").classList.remove("oculto"); return 1 })()');
    await N('N.tick(0.3)'); await vigilar('pausa abierta');
    const guia = await N('(() => { const g = document.getElementById("historia-guia"); return g ? g.innerText : null })()');
    ok(guia && /Cuaderno de lo raro/.test(guia) && /Un zorro con gorro|zorro con gorro/.test(guia) && /Don Ramón: (conocido|de confianza)/.test(guia) && !/Don Ramón: \d/.test(guia), 'la guía muestra el cuaderno de lo raro y los lazos en palabras (sin números)');
    await N('(() => { document.getElementById("pausa").classList.add("oculto"); return 1 })()');
    await N('H.guardar()');
    const progF = await N('N.programas()');
    ok(prog0 === prog1 && prog1 === progAntesDeLaRaiz, `ningún programa de shader nuevo por la historia (${prog0} → ${prog1} → ${progAntesDeLaRaiz} antes de ir al molino viejo; ${progF} al final)`);
    ok(progF - prog0 <= 1, `y de ahí al final, a lo sumo el programa de profundidad del molino viejo que también compila Libre y la 4.14.0 (${prog0} → ${progF})`);
    if (progF !== prog0) { const nuevos = (await N('N.nombresProgramas()')).filter((x) => !nombres0.includes(x)); console.log('  programas nuevos:', nuevos.map((x) => x.slice(0, 3000))); }

    // ================================================================ 5. el reinicio de las partidas viejas
    donde = 'reinicio';
    const vieja = await N(`(() => {
      const v = JSON.parse(JSON.stringify(P));
      v.dia = 9; v.horas = 10; v.obras = (v.obras || []).slice(0, 1); v.ramitas = 33; v.materiales = { tabla: 17 };
      v.personal = Object.assign({}, v.personal, { _marca: { v: 'conservar' } });
      v.historia = { activa: true, capitulo: 5, fase: 'jugando', empezada: 2, hechos: { 'molino:molino': 8 }, base: { dia: 6 } };
      delete v.guardadoEn;
      return JSON.stringify(v);
    })()`);
    await w.loadFile(url, { search: '?debug=1' });
    await js(ajustes('libre'));   // (la portada en Libre, como si otra partida la hubiera dejado así: la partida vieja en modo Historia igual se abre en Historia)
    await js(`localStorage.setItem('hojarasca-v1', ${JSON.stringify(vieja)}); 1`);
    await cargar();
    const copia = await js(`localStorage.getItem('hojarasca-copia-previa-historia-p1')`);
    ok(copia && JSON.parse(copia).dia === 9 && JSON.parse(copia).ramitas === 33 && JSON.parse(copia).historia.capitulo === 5, 'la copia de la partida vieja quedó en una clave aparte del navegador');
    const dirCopias = path.join(app.getPath('userData'), 'partidas', 'hojarasca', 'copias');
    const archivos = fs.existsSync(dirCopias) ? fs.readdirSync(dirCopias) : [];
    ok(archivos.length >= 1 && /^copia-previa-historia-4\.15\.0-p1-\d{8}-\d{4}\.json$/.test(archivos[archivos.length - 1]), `y en un archivo aparte en la carpeta de datos (${archivos.join(', ')})`);
    ok(archivos.length >= 1 && JSON.parse(fs.readFileSync(path.join(dirCopias, archivos[archivos.length - 1]), 'utf8')).dia === 9, 'con la partida vieja entera adentro');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(PAGINA);
    await N('N.hasta(() => N.tarjeta(), 12)');
    ok((await N('P.dia === 1 && !P.obras.length && (P.ramitas || 0) === 0 && (P.materiales.tabla || 0) === 0')) === true, 'la partida vieja volvió a empezar de cero (día 1, sin obras ni mochila)');
    ok((await N('P.historia.version === 2 && P.historia.activa && P.historia.capitulo === 0 && /^copia-previa-historia-/.test(P.historia.copiaPrevia)')) === true, 'con la historia nueva, ya en curso');
    ok((await N('P.personal._marca && P.personal._marca.v === "conservar"')) === true, 'y conserva cómo sos');
    const aviso = await N('N.tarjeta()');
    ok(aviso && aviso.titulo === 'La historia cambió' && /copia-previa-historia-4\.15\.0/.test(aviso.texto), `la tarjeta de aviso sale primero (${aviso && aviso.titulo})`);
    await foto('11-aviso-del-reinicio');
    await N('N.elegir("seguir")');
    await N('N.hasta(() => N.tarjeta(), 12)');
    const t3 = await N('N.tarjeta()');
    ok(t3 && t3.titulo === 'La llave del molinero', `y después, la tarjeta del capítulo 1 (${t3 && t3.titulo})`);
    ok((await N('P.historia.avisoReinicio')) === false, 'el aviso no vuelve');
    // recargar de nuevo: no se reinicia otra vez
    await N('H.guardar()');
    await cargar();
    ok((await N('P.historia.version === 2 && P.historia.avisoReinicio === false')) === true, 'recargar no reinicia otra vez');
    const n1 = fs.readdirSync(dirCopias).length;
    ok(n1 === archivos.length, `y no hace otra copia (${n1} archivo)`);

    // el Relax libre sin historia no cambia jamás
    await w.loadFile(url, { search: '?debug=1' });
    await js(ajustes('libre'));
    const sinHistoria = JSON.parse(vieja); delete sinHistoria.historia;
    await js(`localStorage.setItem('hojarasca-v1', ${JSON.stringify(JSON.stringify(sinHistoria))}); 1`);
    await cargar();
    const libre = await js(`JSON.parse(localStorage.getItem('hojarasca-v1')).dia`);
    ok(libre === 9, `una partida de Relax libre (sin historia) sigue en el día ${libre}`);
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(PAGINA);
    await N('N.tick(1.5)');
    ok((await N('P.dia >= 9 && (P.ramitas || 0) === 33')) === true, 'con su mochila y sus días');
    // una historia vieja en pausa: se limpia sólo la parte de la historia
    const pausada = JSON.stringify(Object.assign(JSON.parse(vieja), { historia: { activa: false, capitulo: 3, fase: 'jugando', empezada: 2, hechos: { 'trochita:viaje': 4 } } }));
    await w.loadFile(url, { search: '?debug=1' });
    await js(ajustes('libre'));
    await js(`localStorage.setItem('hojarasca-v1', ${JSON.stringify(pausada)}); 1`);
    await cargar();
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(PAGINA);
    await N('N.tick(1.5)');
    ok((await N('P.dia >= 9 && P.historia.version === 2 && !P.historia.activa && P.historia.capitulo === 0')) === true, 'una historia vieja en pausa: el mundo queda y sólo la historia empieza de nuevo (en pausa)');
  } catch (err) {
    console.log('ERROR:', err && err.stack || err);
    errores.push(String(err && err.message || err));
  }
  if (consola.length) console.log('consola:', consola.slice(0, 6));
  console.log(errores.length ? `\n${errores.length} problemas` : '\nTodo en orden');
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(errores.length ? 1 : 0); }
});

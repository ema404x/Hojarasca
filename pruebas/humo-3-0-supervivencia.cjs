// Partida real 3.0 (Electron + WebGL): la supervivencia sin fin y el mapa de la semilla.
//   1. una campaña con código arranca en la base de ese código, con sus lugares en el mapa
//   2. una campaña de antes (sin mapa) sigue en el refugio
//   3. la corrida sin fin: sin código sale uno al azar; se aguantan dos noches (con ayuda),
//      la veinte no trae nodriza, caer termina la corrida y queda el récord
//   4. la campaña no se tocó; "otra corrida" arranca una nueva
// Uso: npx electron pruebas/humo-3-0-supervivencia.cjs --user-data-dir=<carpeta propia>
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
// sólo pruebas: en algunos entornos el renderer con sandbox no carga ni una página (ERR_FAILED)
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: false, width: 1024, height: 640, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = 'carga';
  const js = (c) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 120 s (${donde})`)), 120000)),
  ]);
  const ok = (cond, texto) => { const l = `${cond ? '✓' : '✗'} ${texto}`; console.log(l); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const url = path.join(raiz, 'index.html');
  const abrir = async () => {
    try { await w.loadFile(url, { search: '?debug=1' }); }
    catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); }
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca?.desafio').catch(() => false)) break; }
  };
  const ajustes = (extra) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({calidad:'muybaja', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'}, ${JSON.stringify(extra)})));`;
  const entrar = async (codigo = '') => {
    await js(`(()=>{ const i = document.getElementById('codigo-partida'); i.value = ${JSON.stringify(codigo)}; i.dispatchEvent(new Event('input')); document.getElementById('btn-entrar').click(); return 1 })()`);
    await esperar(1500);
  };
  // unos cuadros enteros del bucle (con el límite de FPS libre, no se descartan)
  const cuadros = (n = 4) => js(`(async ()=>{ const H = window.__hojarasca; for (let i = 0; i < ${n}; i++) { H.__bucle(); await new Promise(r => setTimeout(r, 20)); } return 1 })()`);

  try {
    // ================================================================ 1. campaña con código
    await w.loadFile(url, { search: '?debug=1' }).catch(() => {});
    await js(`localStorage.clear(); ${ajustes({ desafioTipo: 'campana' })} 1`);
    await abrir();
    seccion('1. una campaña con código');
    await entrar('lenga 12');
    const camp = await js(`(()=>{ const H = window.__hojarasca, D = H.progreso.desafio, js = H.jugador.estado, r = H.T.lugares.refugio;
      const lugares = Object.values(H.T.lugares).filter((l) => l && Number.isFinite(l.x));
      const sitios = H.desafio.mapaMundo.mapa.sitios;
      const malos = sitios.filter((s) => H.T.agua(s.x, s.z) || lugares.some((l) => Math.hypot(l.x - s.x, l.z - s.z) < 35)).map((s) => s.id);
      const b = H.desafio.baseMapa || { x: r.puerta.x, z: r.puerta.z };
      return { semilla: D.semilla, mapa: !!D.mapa, base: D.mapa?.base, jug: [js.pos.x, js.pos.z], dBase: Math.hypot(js.pos.x - b.x, js.pos.z - b.z),
        sitios: sitios.length, malos, marcas: H.desafio.sitiosMapa.map((m) => m.clase), meteo: H.progreso.meteo?.semilla, mallas: H.desafio.mapaMundo.mallas.length,
        baseEnTierra: !H.T.agua(b.x, b.z), lejosCasas: H.desafio.baseMapa ? lugares.every((l) => Math.hypot(l.x - b.x, l.z - b.z) >= 60) : true } })()`);
    ok(camp.semilla === 'LENGA-12' && camp.mapa, `el código queda en la partida, con su mapa (${camp.semilla})`);
    ok(camp.dBase < 1.5 && camp.baseEnTierra && camp.lejosCasas, `arrancás en la base de LENGA-12, en tierra y lejos de las casas (${JSON.stringify(camp.base)}, a ${camp.dBase.toFixed(2)} m)`);
    ok(camp.sitios === 11 && camp.mallas === 11 && !camp.malos.length, `once lugares en el valle, ninguno en el agua ni encima de una casa (${camp.malos.join(', ')})`);
    ok(['cantera', 'cristal', 'madera', 'alijo'].every((c) => camp.marcas.includes(c)), `el mapa de papel los marca (${[...new Set(camp.marcas)].join(', ')})`);
    ok(Number.isInteger(camp.meteo) && camp.meteo > 0, `el tiempo de la corrida sale del código (${camp.meteo})`);
    const mapa = await js(`(()=>{ const H = window.__hojarasca; H.abrir('mapa'); const ok = !document.getElementById('mapa').classList.contains('oculto'); H.volverAlJuego(); return ok })()`);
    ok(mapa, 'el mapa de papel se dibuja con los lugares');
    // usar la cantera con E: el aviso y la tecla dicen y hacen lo mismo
    const cantera = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso, js = H.jugador.estado;
      const s = H.desafio.mapaMundo.mapa.sitios.find((q) => q.tipo === 'cantera');
      js.pos.set(s.x + 1.2, H.T.altura(s.x + 1.2, s.z) + 0.05, s.z);
      const antes = P.materiales.piedra || 0;
      const aviso = H.desafio.avisoCercaDe(js.pos, 99);
      const usado = H.desafio.usarCercaDe(js.pos, 99);
      const otra = H.desafio.avisoCercaDe(js.pos, 99);
      return { aviso, usado, mas: (P.materiales.piedra || 0) - antes, otra, usos: Object.keys(P.desafio.mapa.usos) } })()`);
    ok(/cantera/.test(cantera.aviso) && cantera.usado && cantera.mas === 5 && /vuelve/.test(cantera.otra), `E en la cantera da cinco piedras y queda pelada (${JSON.stringify(cantera)})`);
    await cuadros(3);
    // lo que se guarda de la campaña, para ver después que la corrida no la toca
    await js(`(()=>{ const H = window.__hojarasca; H.progreso.dia = 5; H.progreso.desafio.noches = 4; H.progreso.desafio.oleadas = 4; H.guardar(); return 1 })()`);

    // ================================================================ 2. una campaña de antes
    seccion('2. una campaña de antes de la 3.0');
    await js(`(()=>{ const p = JSON.parse(localStorage.getItem('hojarasca-desafio-v1'));
      delete p.desafio.mapa; p.desafio.semilla = 'COIHUE-4821'; p.pos = { x: -100, z: 225 };
      localStorage.setItem('hojarasca-desafio-p2-v1', JSON.stringify(p));
      ${ajustes({ desafioTipo: 'campana', ranura: 2 })} return 1 })()`);
    await abrir();
    // (al irse, la página de la campaña se guarda una vez más: lo que queda es esto)
    const campanaGuardada = await js(`localStorage.getItem('hojarasca-desafio-v1')`);
    ok(!!campanaGuardada && /LENGA-12/.test(campanaGuardada), 'la campaña quedó guardada en su ranura');
    const vieja = await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado;
      return { base: H.desafio.baseMapa, jug: [js.pos.x, js.pos.z], marcas: H.desafio.sitiosMapa.map((m) => m.clase), codigo: document.getElementById('codigo-partida').value } })()`);
    ok(vieja.base === null && Math.abs(vieja.jug[0] + 100) < 0.5 && Math.abs(vieja.jug[1] - 225) < 0.5, `sigue donde estaba y su base es el refugio (${JSON.stringify(vieja.jug)})`);
    ok(!vieja.marcas.includes('base') && vieja.marcas.length === 11, 'se le suman los lugares de recursos alrededor del refugio');

    // ================================================================ 3. la corrida sin fin
    seccion('3. la supervivencia sin fin');
    await js(`${ajustes({ desafioTipo: 'sinfin', ranura: 2 })} 1`);
    await abrir();
    const antes = await js(`(()=>{ const H = window.__hojarasca, D = H.progreso.desafio;
      return { es: H.__sinFin.es, sinFin: D.sinFin, texto: document.getElementById('desafio-tipo-texto').textContent,
        boton: document.querySelector('[data-ajuste="desafioTipo"] [data-valor="sinfin"]').getAttribute('aria-pressed') } })()`);
    ok(antes.es && antes.sinFin && antes.sinFin.terminada === false, `la portada abre la corrida en su ranura (${JSON.stringify(antes.sinFin)})`);
    ok(antes.boton === 'true' && /Una sola vida/.test(antes.texto), 'la portada dice que es sin fin');
    await entrar('');
    const corrida = await js(`(()=>{ const H = window.__hojarasca, D = H.progreso.desafio, js = H.jugador.estado;
      const b = H.desafio.baseMapa, r = H.T.lugares.refugio, bb = b || { x: r.puerta.x, z: r.puerta.z };
      return { semilla: D.semilla, mapa: !!D.mapa, d: Math.hypot(js.pos.x - bb.x, js.pos.z - bb.z), notas: document.getElementById('notas').textContent } })()`);
    ok(/^[A-Z]+-\d+$/.test(corrida.semilla || '') && corrida.mapa && corrida.d < 1.5, `sin código sale uno al azar, y el mapa es el suyo (${corrida.semilla})`);
    // dos noches, con ayuda: la nave baja, se limpian los invasores y amanece
    const noche = (dia) => js(`(()=>{ const H = window.__hojarasca, P = H.progreso, D = P.desafio;
      D.salud = 100; P.dia = ${dia}; P.horas = 20.6;
      H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      const oleada = D.oleadas, vienen = D.vivos;
      H.desafio.limpiar();
      P.dia = ${dia + 1}; P.horas = 6.2;
      H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 });
      return { oleada, vienen, noches: D.noches, salud: D.salud } })()`);
    const n1 = await noche(1);
    await cuadros(3);
    const n2 = await noche(2);
    ok(n1.oleada === 1 && n2.oleada === 2 && n2.noches === 2 && n1.vienen > 0, `se aguantan dos noches (${JSON.stringify([n1, n2])})`);
    // la veinte no trae nave nodriza, y la dureza sigue la de la corrida
    const veinte = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso, D = P.desafio;
      const o0 = D.oleadas; D.oleadas = 19; P.dia = 3; P.horas = 20.6; D.oleadaNoche = 2; D.oleadaTerminada = true;
      H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      const r = { oleada: D.oleadas, nodriza: H.desafio.nodrizaActiva, especial: D.especial, vienen: D.vivos };
      H.desafio.limpiar(); D.oleadas = o0; D.oleadaTerminada = true;
      return r })()`);
    ok(veinte.oleada === 20 && !veinte.nodriza && veinte.vienen >= 19, `la noche veinte no trae nodriza: viene el jefe y más (${JSON.stringify(veinte)})`);
    // caer termina la corrida
    seccion('3b. caer');
    await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado; H.desafio.herirJugador(999, { x: js.pos.x + 1, y: js.pos.y, z: js.pos.z }); return 1 })()`);
    await esperar(3000);
    const fin = await js(`(()=>{ const H = window.__hojarasca, D = H.progreso.desafio;
      const g = JSON.parse(localStorage.getItem('hojarasca-desafio-sinfin-v1') || 'null');
      return { visible: !document.getElementById('corrida').classList.contains('oculto'), titulo: document.getElementById('corrida-titulo').textContent,
        lugar: document.getElementById('corrida-lugar').textContent, lista: document.getElementById('corrida-records').textContent,
        records: JSON.parse(localStorage.getItem('hojarasca-sinfin-v1') || 'null'), guardada: g?.desafio?.sinFin, semilla: D.semilla,
        campana: localStorage.getItem('hojarasca-desafio-v1'), semillas: localStorage.getItem('hojarasca-semillas-v1') } })()`);
    ok(fin.visible && /Resististe 2 noches/.test(fin.titulo) && /mejor corrida/.test(fin.lugar), `la pantalla de la corrida: ${fin.titulo} · ${fin.lugar}`);
    ok(fin.records?.general?.[0]?.noches === 2 && fin.records.general[0].codigo === fin.semilla && /^\d{4}-\d{2}-\d{2}$/.test(fin.records.general[0].fecha), `queda el récord: noches, abatidos y fecha (${JSON.stringify(fin.records?.general?.[0])})`);
    ok(fin.records?.porCodigo?.[fin.semilla]?.length === 1 && /2 noches/.test(fin.lista), 'y en la lista de su código');
    ok(fin.guardada?.terminada === true, 'la corrida guardada queda terminada');
    ok(fin.campana === campanaGuardada, 'la campaña no se tocó');
    ok(!fin.semillas || !JSON.parse(fin.semillas)[fin.semilla], 'la corrida no ensucia los récords de la campaña');
    // la libreta de logros muestra las corridas
    const libreta = await js(`(()=>{ document.getElementById('corrida').classList.add('oculto'); document.getElementById('btn-logros').click();
      const t = document.getElementById('logros-contenido').textContent; document.getElementById('cerrar-logros').click(); return t })()`);
    ok(/Supervivencia sin fin/.test(libreta), 'la libreta de logros muestra las mejores corridas');

    // ================================================================ 4. otra corrida
    seccion('4. otra corrida');
    await js(`(()=>{ document.getElementById('corrida-otra').click(); return 1 })()`).catch(() => {});
    await esperar(1500);
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca?.desafio').catch(() => false)) break; }
    const otra = await js(`(()=>{ const H = window.__hojarasca, D = H.progreso.desafio;
      return { sinFin: D.sinFin, noches: D.noches, oleadas: D.oleadas, semilla: D.semilla, input: document.getElementById('codigo-partida').value,
        records: JSON.parse(localStorage.getItem('hojarasca-sinfin-v1')).general.length, campana: localStorage.getItem('hojarasca-desafio-v1') } })()`);
    ok(otra.sinFin?.terminada === false && otra.noches === 0 && otra.oleadas === 0, `otra corrida arranca de cero (${JSON.stringify(otra.sinFin)})`);
    ok(!!otra.semilla && otra.input === otra.semilla, `con su código a la vista en la portada (${otra.semilla})`);
    ok(otra.records === 1 && otra.campana === campanaGuardada, 'el récord sigue y la campaña también');
    // volver a la campaña: la ranura 1 de siempre
    await js(`${ajustes({ desafioTipo: 'campana', ranura: 1 })} 1`);
    await abrir();
    const vuelta = await js(`(()=>{ const H = window.__hojarasca, D = H.progreso.desafio; return { sinFin: D.sinFin, semilla: D.semilla, noches: D.noches, dia: H.progreso.dia } })()`);
    ok(vuelta.sinFin === null && vuelta.semilla === 'LENGA-12' && vuelta.noches === 4 && vuelta.dia === 5, `la campaña carga tal cual (${JSON.stringify(vuelta)})`);
  } catch (e) {
    errores.push(`${donde}: ${e.message}`);
  }
  console.log(errores.length ? `\n✗ ${errores.length} problema(s):\n${errores.join('\n')}` : '\n✓ supervivencia sin fin y mapa de la semilla: todo bien');
  app.exit(errores.length ? 1 : 0);
});

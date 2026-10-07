// Partida real 3.7.5 (noticias) (Electron + WebGL). Las teclas van de verdad (keydown) y el reloj del juego se adelanta a
// mano donde haría falta esperar horas o días (se dice dónde):
//   1. la radio a una hora: a la mañana, las noticias del valle; a la tarde, el chisme; de noche, los refugios lejanos;
//   2. sale el diario de la aldea (la nota, y queda en el cuaderno, en «Noticias»);
//   3. llega una carta de tu mamá y te la da Benigno en la estafeta;
//   4. el calendario avisa un cumpleaños el día antes (y la fiesta con su concurso), y lo muestra en el cuaderno;
//   5. el concurso de dulces en la fiesta de la cosecha: Nélida te anota con tu frasco y a las 17 el jurado da la cinta;
//   6. el club de lectura en la biblioteca y la noche de estrellas en la plaza (la gente va, y te cuentan);
//   7. guardar y cargar: todo sigue; sin errores.
// Con CAPTURAS=<carpeta>, la ventana se ve y se guardan capturas de cada parte.
// Uso: npx electron --no-sandbox -r herramientas/al-monitor.cjs -r herramientas/perfil-propio.cjs pruebas/humo-3-7-5-noticias.cjs
// Perfil propio (HUMO_PERFIL, o una carpeta temporal): borra su localStorage, nunca el de %APPDATA%\Hojarasca.
const { app, BrowserWindow, dialog } = require('electron');
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); app.exit(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa sin atender): ${e && e.stack ? e.stack : e}`); app.exit(1); });
const path = require('path');
const fs = require('fs');
const os = require('os');
const raiz = path.resolve(__dirname, '..');
app.setPath('userData', path.resolve(process.env.HUMO_PERFIL || path.join(os.tmpdir(), 'hojarasca-humo-3-7-5-noticias')));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 15 minutos'); app.exit(2); }, 15 * 60 * 1000).unref?.();
const CAPTURAS = process.env.CAPTURAS ? path.resolve(process.env.CAPTURAS) : null;

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: !!CAPTURAS, width: 1280, height: 760, webPreferences: { backgroundThrottling: false } });
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
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__noticias && window.__hojarasca.__aldea)').catch(() => false)) return true; }
    return false;
  };
  const H = 'window.__hojarasca';
  const P = `${H}.progreso`;
  const ajustes = `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'muybaja', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre', estacion: 'verano' }));`;
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    await js(`${H}.volverAlJuego?.(); ${H}.ajustes.limiteFps = 'libre'; 1`);
  };
  const tecla = (code) => `document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', bubbles: true }));`;
  const cuadros = (n = 4) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  const aldea = (n = 1, dt = 0.6) => js(`(()=>{ for (let i = 0; i < ${n}; i++) { ${H}.__aldea.actualizar(${dt}); ${H}.__aldea.mundo()?.prearmar?.(1e6); } return 1 })()`);
  const ubicar = (x, z, mx = null, mz = null) => js(`(()=>{ const j = ${H}.jugador; const x = ${x}, z = ${z}; const mx = ${mx === null ? 'x' : mx}, mz = ${mz === null ? 'z + 1' : mz};
    j.ubicar(x, z, Math.atan2(-(mx - x), -(mz - z))); j.estado.pitch = -0.05; return 1 })()`);
  const irLejos = () => js(`(()=>{ const r = ${H}.T.lugares.refugio; ${H}.jugador.ubicar(r.x, r.z, 0); return 1 })()`);
  const plaza = async () => { const p = await js(`${H}.__aldea.edificio('plaza')`); await ubicar(p.x, p.z); };
  const avisos = (n = 10) => js(`${H}.__avisos().slice(-${n}).join(' | ')`);
  const charla = () => js(`({ abierta: !document.getElementById('charla').classList.contains('oculto'), quien: document.getElementById('charla-quien').textContent, texto: document.getElementById('charla-texto').textContent })`);
  const cerrarCharla = () => js(`(()=>{ for (let i = 0; i < 6 && ${H}.__charla().npc; i++) document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true })); return !${H}.__charla().npc })()`);
  const npc = (clave) => `${H}.__aldea.mundo().personas.get('${clave}')?.npc`;
  const estado = () => js(`${H}.__aldea.mundo().estado()`);
  const capturar = async (nombre) => {
    if (!CAPTURAS) return;
    // (cuadros de verdad, con la ventana a la vista: lo que se compuso, no un cuadro viejo; sin el cartel del mouse)
    await js(`(()=>{ const p = document.getElementById('pista-clic'); if (p) p.style.visibility = 'hidden'; return 1 })()`);
    await cuadros(4);
    for (let i = 0; i < 4; i++) { await js('new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(1))))'); await esperar(250); }
    w.webContents.invalidate();
    await esperar(300);
    const img = await w.webContents.capturePage();
    await js(`(()=>{ const p = document.getElementById('pista-clic'); if (p) p.style.visibility = ''; return 1 })()`);
    fs.mkdirSync(CAPTURAS, { recursive: true });
    fs.writeFileSync(path.join(CAPTURAS, `v375-noticias-${nombre}.png`), img.toPNG());
    console.log(`  (captura ${nombre})`);
  };
  // habla con una figura: enfrente, E hasta que se cierra la charla o aparece el menú; `alLeer(i, texto)`: a cada renglón.
  // (en una ronda de gente, se prueba alrededor hasta que el aviso diga su nombre: E le habla a ése)
  const hablarCon = async (expr, maximo = 10, alLeer = null) => {
    const p = await js(`(()=>{ const n = ${expr}; return n ? { x: n.pos.x, z: n.pos.z, nombre: n.nombre } : null })()`);
    if (!p) return { error: 'no está', textos: [] };
    let listo = false;
    for (const d of [1.6, 1.1, 2.2]) {
      for (let k = 0; k < 16 && !listo; k++) {
        await js(`(()=>{ const j = ${H}.jugador, T = ${H}.T; const x = ${p.x}, z = ${p.z}; const a = ${k} * Math.PI / 8, px = x + Math.cos(a) * ${d}, pz = z + Math.sin(a) * ${d};
          if (T.agua(px, pz)) return 0; j.ubicar(px, pz, Math.atan2(-(x - px), -(z - pz))); j.estado.pitch = -0.05; return 1 })()`);
        await cuadros(4);
        listo = (await js(`${H}.__aviso()`)).includes(`Hablar con ${p.nombre}`);
      }
      if (listo) break;
    }
    for (let i = 0; i < 3; i++) { await esperar(70); await cuadros(2); }
    const textos = [];
    for (let i = 0; i < maximo; i++) {
      await js(`${tecla('KeyE')} 1`);
      const c = await js(`(()=>({ npc: !!${H}.__charla().npc, texto: document.getElementById('charla-texto').textContent, menu: !document.getElementById('charla-opciones')?.classList.contains('oculto') }))()`);
      if (!c.npc) break;
      textos.push(c.texto);
      if (alLeer) await alLeer(i, c.texto);
      if (c.menu) break;
    }
    return { textos };
  };
  // el cuaderno de verdad (J), en la pestaña `p`: devuelve el texto de la ficha (después, volverAlJuego)
  const cuaderno = async (p) => { await js(`${tecla('KeyJ')} 1`); await esperar(300); return js(`(()=>{ ${H}.__aldea.cuaderno('${p}'); return document.getElementById('cuaderno-ficha').textContent })()`); };

  try {
    await w.loadURL('about:blank');
    await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
    await abrir();
    ok(await listo(), 'el juego cargó');
    await js(`(()=>{ localStorage.clear(); ${ajustes} return 1 })()`);
    await abrir();
    ok(await listo(), 'una partida Relax limpia');
    await entrar();
    let e = await js(`JSON.stringify({ n: ${P}.noticias, c: ${P}.concursos })`);
    // (el aviso de mañana se mira el día 1, apenas arranca: 0 o 1 según el cuadro)
    ok(e.replace('"avisado":1', '"avisado":0') === JSON.stringify({ n: { diarios: [], numero: 0, ultimoDiario: 0, cartas: {}, ultimaCarta: 0, avisado: 0, club: [], estrellas: [], oidos: {} }, c: { inscripto: null, truchas: [], resultados: [], cintas: [] } }), `partida nueva: sin noticias ni concursos (${e.slice(0, 160)})`);
    // la aldea entera (los veinte pobladores con su local) y ya conocida: el día 2 a las 8
    await js(`(()=>{ const P = ${P}; const L = { carpintero: 'carpinteria', veterinaria: 'veterinaria', panadera: 'panaderia', herbolaria: 'herboristeria', herrero: 'herreria', modista: 'costureria', pescador: 'pescaderia', botera: 'varadero', maestra: 'escuela', pintora: 'taller-arte', enfermera: 'puesto-sanitario', andinista: 'refugio-andinista', telegrafista: 'estafeta', fotografa: 'estudio-fotos', tejedora: 'hilanderia', ceramista: 'ceramica', apicultor: 'sala-miel', astronoma: 'observatorio', guardaparque: 'seccional', musico: 'salon' };
      P.aldea.pobladores = Object.keys(L).map((clave) => ({ clave, dia: 1 })); P.aldea.locales = Object.fromEntries(Object.values(L).map((k) => [k, 1])); P.aldea.obras = {}; P.aldea.descubierta = 1;
      P.dia = 2; P.horas = 8; P.noticias.avisado = 2; P.vidaAldea.avisado = 2; ${H}.clima.estado.lluvia = 0; return 1 })()`);

    // ------------------------------------------------------------ 1. la radio
    seccion('1. la radio a una hora');
    const radio = await js(`(()=>{ const H = ${H}, O = H.obras, P = H.progreso, T = H.T, r = T.lugares.refugio;
      Object.assign(P.materiales, { tronco: 80, tabla: 80, piedra: 80 });
      const p = H.PLANOS.find((q) => q.id === 'radio-refugio'); if (!p) return { error: 'no hay plano' };
      for (const d of [6, 8, 10, 13]) for (let k = 0; k < 12; k++) {
        const a = k * Math.PI / 6, x = r.x + Math.cos(a) * d, z = r.z + Math.sin(a) * d;
        O.elegir(p); const f = O.fundar(x, z, 0, T.altura(x, z)); if (!f.ok) continue;
        for (let g = 0; g < 12 && f.obra.datos.etapas < f.obra.plano.etapas.length; g++) { const q = O.avanzar(f.obra, P.materiales); if (!q.ok) break; }
        O.elegir(null); P.obras = O.obras.map((o) => o.datos);
        return { ok: f.obra.datos.etapas >= f.obra.plano.etapas.length, x: f.obra.datos.x, z: f.obra.datos.z };
      }
      O.elegir(null); return { error: 'no hubo lugar' } })()`);
    ok(radio.ok, `se arma la radio del refugio (${JSON.stringify(radio)})`);
    const oirRadio = async (hora) => {
      // (la charla de la radio se termina leyéndola: E hasta que se cierra)
      for (let i = 0; i < 10 && (await js(`!!${H}.__charla().npc`)); i++) { await js(`${tecla('KeyE')} 1`); await esperar(150); }
      await js(`${H}.volverAlJuego?.(); 1`); await esperar(200);
      await js(`(()=>{ ${P}.horas = ${hora}; const T = ${H}.T, j = ${H}.jugador.estado; const x = ${radio.x} + 1, z = ${radio.z}; j.pos.set(x, T.altura(x, z) + 0.05, z); j.yaw = Math.atan2(1, 0); j.pitch = -0.1; j.sentado = false; return 1 })()`);
      let a = '';
      for (let i = 0; i < 20; i++) { await cuadros(3); a = await js(`${H}.__aviso()`); if (/radio/.test(a)) break; await esperar(120); }
      // (si E llega en el mismo cuadro en que se armó el aviso, a veces no abre: se prueba de nuevo)
      let c = { abierta: false, texto: '' };
      for (let i = 0; i < 3 && !(c.abierta && c.texto); i++) { await js(`${tecla('KeyE')} 1`); await esperar(300); c = await charla(); if (!c.texto) await cuadros(3); }
      return { aviso: a, ...c };
    };
    let c = await oirRadio(10.5);
    ok(/Prender la radio/.test(c.aviso) && c.abierta && /La radio/.test(c.quien) && /Chiche: «Son las 10:30 en la Radio Comunitaria del Valle, FM 89\.5\. Las noticias del valle\./.test(c.texto), `a las 10:30, las noticias del valle («${c.texto.slice(0, 160)}»)`);
    await capturar('1-radio-noticias');
    c = await oirRadio(15.5);
    ok(/La tarde del chisme/.test(c.texto) && /«/.test(c.texto), `a las 15:30, el chisme («${c.texto.slice(60, 260)}»)`);
    c = await oirRadio(18);
    ok(/Los avisos de la comunidad\./.test(c.texto) && /concurso|Club de lectura|fiesta|día de la aldea/i.test(c.texto), `a las 18, los avisos de fiestas y concursos («${c.texto.slice(60, 300)}»)`);
    c = await oirRadio(22);
    ok(!/Radio Comunitaria/.test(c.texto) && /«.+»|[Ee]stática/.test(c.texto), `de noche, los refugios lejanos de siempre («${c.texto.slice(0, 120)}»)`);
    e = await js(`(${P}.noticias.oidos)`);
    ok(e.noticias === 2 && e.chisme === 2 && e.avisos === 2, `el cuaderno anota qué programas oíste (${JSON.stringify(e)})`);
    await cerrarCharla();

    // ------------------------------------------------------------ 2. el diario
    seccion('2. el diario de la aldea');
    // (se adelanta al día 3 a las 9: con el ritmo normal, el primero sale al tercer día)
    await js(`(()=>{ ${P}.dia = 3; ${P}.horas = 9; return 1 })()`);
    await irLejos(); await aldea(3);
    e = await js(`(${P}.noticias.diarios.map((d) => ({ n: d.n, dia: d.dia, titulo: d.titulo, secciones: d.notas.map((x) => x.seccion) })))`);
    ok(e.length === 1 && e[0].n === 1 && e[0].dia === 3 && e[0].titulo.length > 5, `salió el n.º 1 («${e[0]?.titulo}»: ${e[0]?.secciones.join(', ')})`);
    let av = await avisos(8);
    ok(/Salió «La Hoja de los Duendes» n\.º 1/.test(av), 'la nota de que salió');
    let f = await cuaderno('noticias');
    ok(/Noticias del valle/.test(f) && /«La Hoja de los Duendes»/.test(f) && /N\.º 1, día 3:/.test(f) && /Clasificados de trueque:/.test(f), `en el cuaderno, «Noticias» (${f.slice(0, 200)})`);
    await capturar('2-cuaderno-diario');
    await js(`${H}.volverAlJuego?.(); 1`);

    // ------------------------------------------------------------ 3. la carta
    seccion('3. una carta de lejos');
    await js(`(()=>{ ${P}.dia = 4; ${P}.horas = 10.5; return 1 })()`);
    await aldea(2);
    av = await avisos(8);
    ok(/Llegó carta de tu mamá, Susana/.test(av), 'llegó carta de tu mamá (la tiene Benigno)');
    await plaza(); await aldea(50);
    let h = await hablarCon(npc('telegrafista'), 6, async (i) => { if (i === 0) await capturar('3-carta-benigno'); });
    ok(h.textos.some((t) => /^Llegó carta para vos en la saca del tren\. Es de tu mamá, Susana\./.test(t)) && h.textos.some((t) => /Comé\. Abrigate\./.test(t)), `Benigno te la da (${h.textos.join(' / ').slice(0, 220)})`);
    await cerrarCharla();
    e = await js(`(${P}.noticias.cartas['l-mama'])`);
    ok(e && e.leida === 4, `leída, queda en el cuaderno (${JSON.stringify(e)})`);
    f = await cuaderno('noticias');
    ok(/Cartas de lejos/.test(f) && /Día 4, de tu mamá, Susana:/.test(f), 'en «Noticias», la carta');
    await js(`${H}.volverAlJuego?.(); 1`);

    // ------------------------------------------------------------ 4. el calendario
    seccion('4. el calendario avisa el día antes');
    // (amigo de Nélida: su cumpleaños se festeja; el día antes, el aviso. Y el día 6, la fiesta de la cosecha y su concurso)
    await js(`(()=>{ ${H}.__aldea.amigo('nelida'); return 1 })()`);
    const A = await import(require('url').pathToFileURL(path.join(raiz, 'src', 'aldea.js')).href);
    const ddaNelida = A.CUMPLES_ALDEA.nelida;
    await js(`(()=>{ ${P}.dia = 5; ${P}.horas = 9; return 1 })()`);
    await js(`${tecla('KeyJ')} 1`); await esperar(300);
    await js(`(()=>{ ${H}.__aldea.oficios().elegir('calendario'); ${H}.__aldea.cuaderno('oficios'); return 1 })()`);
    f = await js(`document.getElementById('cuaderno-ficha').textContent`);
    ok(/Calendario y vida de la aldea/.test(f) && /Concurso de dulces/.test(f) && /Fiesta de la cosecha/.test(f) && /Club de lectura/.test(f), `el calendario muestra fiestas, concursos y el club (${f.slice(0, 260)})`);
    await capturar('4-calendario');
    await js(`${H}.volverAlJuego?.(); 1`);
    ok(f.includes('cumple Nélida'), `Nélida cumple el día ${ddaNelida} del año (en el calendario)`);
    // el día antes de su cumpleaños (en el año 2, para no pisar lo de esta semana): el aviso
    const vispera = 12 + ddaNelida - 1;
    await js(`(()=>{ ${P}.dia = ${vispera}; ${P}.horas = 9; ${P}.vidaAldea.avisado = ${vispera - 1}; ${P}.noticias.avisado = ${vispera - 1}; ${H}.__aldea.mundo().revisarDia(); return 1 })()`);
    await aldea(2);
    av = await avisos(10);
    ok(/Mañana cumple años Nélida/.test(av) || /Mañana cumplen años [^|]*Nélida/.test(av), `el aviso del cumpleaños, el día antes (${(av.match(/Mañana cumpl[^|]*/) || [''])[0]})`);
    // la fiesta de la cosecha (día 7 del año): el aviso del día 6 (en el año 2: el 18)
    await js(`(()=>{ ${P}.dia = 18; ${P}.horas = 9; ${P}.noticias.avisado = 17; return 1 })()`);
    await aldea(2);
    av = await avisos(10);
    ok(/Mañana: fiesta de la cosecha y el concurso de dulces/.test(av), `y el de la fiesta con su concurso (${(av.match(/Mañana: fiesta[^|]*/) || [''])[0]})`);

    // ------------------------------------------------------------ 5. el concurso de dulces
    seccion('5. el concurso de dulces');
    // (las 16:15 del día de la fiesta de la cosecha: Nélida atiende la mesa en la plaza desde las 9; en la última hora
    // antes del fallo se juntan el jurado y los que compiten)
    await js(`(()=>{ const P = ${P}; P.dia = 19; P.horas = 16.25; P.entradas['dulce-leche'] = { dia: 18, hora: 10, cantidad: 2 }; P.cocina.hechas = { ...(P.cocina.hechas || {}), 'dulce-leche': 6 }; P.cosas.azucar = 0; return 1 })()`);
    await irLejos(); await aldea(2); await plaza(); await aldea(80);
    e = await estado();
    const enLaMesa = e.npcs.filter((x) => x.destino?.lugar === 'concurso').map((x) => x.clave);
    ok(enLaMesa.includes('nelida') && enLaMesa.length >= 6, `en la plaza: Nélida, el jurado y los que compiten (${enLaMesa.join(', ')})`);
    // de lejos, mirando la mesa (a unos 9 m)
    const mesa = await js(`(()=>{ const n = ${npc('nelida')}; return n ? { x: n.pos.x, z: n.pos.z } : null })()`);
    // (desde afuera de la ronda: del lado de Nélida que da la espalda al centro de la plaza, mirando hacia el centro)
    const centro = await js(`${H}.__aldea.edificio('plaza')`);
    const verMesa = async () => { if (mesa) await js(`(()=>{ const j = ${H}.jugador; const x = ${mesa.x}, z = ${mesa.z}, cx = ${centro.x}, cz = ${centro.z};
      let dx = x - cx, dz = z - cz; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      const px = x + dx * 6, pz = z + dz * 6; j.ubicar(px, pz, Math.atan2(-(cx - px), -(cz - pz))); j.estado.pitch = -0.1; return 1 })()`); };
    await verMesa();
    await capturar('5-concurso-plaza');
    let leida = '';
    h = await hablarCon(npc('nelida'), 6, async (i, t) => { if (/Veo que traés/.test(t)) { leida = t; await js(`(()=>{ ${H}.jugador.estado.pitch = -0.32; return 1 })()`); await capturar('5-concurso-nelida'); } });
    ok(/¡Hoy es el concurso de dulces! Veo que traés un frasco de dulce de leche\./.test(leida), `Nélida te ofrece anotarte («${leida.slice(0, 120)}»)`);
    ok(h.textos.some((t) => /^Anotado, con un frasco de dulce de leche\./.test(t)), 'anotado');
    await cerrarCharla();
    e = await js(`({ ins: ${P}.concursos.inscripto, frascos: ${P}.entradas['dulce-leche'].cantidad })`);
    ok(e.ins?.id === 'dulce' && e.ins.dia === 19 && e.frascos === 1, `el frasco queda en la mesa del jurado (${JSON.stringify(e)})`);
    // (a las 17, el fallo: de nuevo mirando la mesa desde lejos)
    await verMesa();
    await js(`(()=>{ ${P}.horas = 17.02; return 1 })()`);
    await aldea(1);
    e = await js(`({ cintas: ${P}.concursos.cintas, res: ${P}.concursos.resultados, azucar: ${P}.cosas.azucar || 0 })`);
    ok(e.cintas.length === 1 && e.cintas[0].id === 'dulce' && e.res.length === 1, `la cinta (${JSON.stringify(e.cintas[0])}; podio ${e.res[0]?.podio?.join(', ')})`);
    av = await avisos(6);
    ok(/¡Cinta (azul|roja|blanca) en el concurso de dulces!|Cinta verde de mención en el concurso de dulces/.test(av), `el fallo del jurado (${(av.match(/[^|]*[Cc]inta [^|]*/) || [''])[0]})`);
    await capturar('5-fallo-plaza');
    await esperar(1500);
    e = await js(`({ azucar: ${P}.cosas.azucar || 0, puesto: ${P}.concursos.cintas[0].puesto })`);
    ok(e.puesto >= 1 && e.puesto <= 3 ? e.azucar > 0 : e.azucar === 0, `el regalo útil (puesto ${e.puesto || 'mención'}: ${e.azucar} de azúcar)`);
    f = await cuaderno('noticias');
    ok(/Concursos y cintas/.test(f) && /Día 19: cinta/.test(f), 'la cinta, en el cuaderno');
    e = await js(`(()=>{ const c = document.querySelector('#cuaderno-ficha .cintas-ganadas'); if (!c) return 0; c.previousElementSibling?.previousElementSibling?.scrollIntoView({ block: 'start' }); return c.children.length })()`);
    ok(e === 1, 'la escarapela de la cinta, dibujada en el cuaderno');
    await capturar('5-cinta');
    await js(`${H}.volverAlJuego?.(); 1`);

    // ------------------------------------------------------------ 6. el club y las estrellas
    seccion('6. el club de lectura y la noche de estrellas');
    // (un miércoles sin fiesta, a las 18:30: el día 24 es miércoles — (24-1) % 7 = 2)
    await js(`(()=>{ ${P}.dia = 24; ${P}.horas = 18.5; return 1 })()`);
    await irLejos(); await aldea(2); await plaza(); await aldea(80);
    e = await estado();
    const club = e.npcs.filter((x) => x.destino?.lugar === 'club').map((x) => x.clave);
    ok(club.includes('abuela') && club.length >= 4, `van al club de lectura (${club.join(', ')})`);
    h = await hablarCon(npc('abuela'), 5, async (i) => { if (i === 0) await capturar('6-club-charla'); });
    ok(h.textos.some((t) => /^Llegaste justo, que recién empezamos\. Esta semana leemos «/.test(t)), `la abuela lleva el club (${(h.textos[0] || '').slice(0, 140)})`);
    await cerrarCharla();
    // (la ronda vista desde atrás de los que escuchan, mirando a la abuela, sin la charla)
    await js(`(()=>{ const H = ${H}, n = ${npc('abuela')}; if (!n) return 0; const g = H.__aldea.mundo().estado().npcs.filter((x) => x.destino?.lugar === 'club' && x.clave !== 'abuela');
      const ps = g.map((x) => H.__aldea.mundo().personas.get(x.clave)?.npc).filter(Boolean); if (!ps.length) return 0;
      const cx = ps.reduce((s, p) => s + p.pos.x, 0) / ps.length, cz = ps.reduce((s, p) => s + p.pos.z, 0) / ps.length;
      let dx = n.pos.x - cx, dz = n.pos.z - cz; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      const px = cx - dx * 1.6, pz = cz - dz * 1.6; H.jugador.ubicar(px, pz, Math.atan2(-(n.pos.x - px), -(n.pos.z - pz))); H.jugador.estado.pitch = -0.18; return 1 })()`);
    await capturar('6-club-lectura');
    // (un sábado sin fiesta ni cumpleaños festejado, a las 21:30: el día 48 — (48-1) % 7 = 5, día 12 del año)
    await js(`(()=>{ ${P}.dia = 48; ${P}.horas = 21.5; return 1 })()`);
    await irLejos(); await aldea(2); await plaza(); await aldea(80);
    e = await estado();
    const cielo = e.npcs.filter((x) => x.destino?.lugar === 'estrellas').map((x) => x.clave);
    ok(cielo.includes('astronoma') && cielo.length >= 5, `a la plaza, a mirar las estrellas (${cielo.join(', ')})`);
    h = await hablarCon(npc('astronoma'), 5, async (i) => { if (i === 1) await capturar('6-estrellas-charla'); });
    ok(h.textos.some((t) => /^¡Viniste! Bajé el telescopio a la plaza/.test(t)), `Valentina con el telescopio en la plaza (${(h.textos[0] || '').slice(0, 120)})`);
    await cerrarCharla();
    // (la ronda vista de lejos, sin la charla)
    await js(`(()=>{ const H = ${H}, n = ${npc('astronoma')}; if (!n) return 0; const g = H.__aldea.mundo().estado().npcs.filter((x) => x.destino?.lugar === 'estrellas' && x.clave !== 'astronoma');
      const ps = g.map((x) => H.__aldea.mundo().personas.get(x.clave)?.npc).filter(Boolean); if (!ps.length) return 0;
      const cx = ps.reduce((s, p) => s + p.pos.x, 0) / ps.length, cz = ps.reduce((s, p) => s + p.pos.z, 0) / ps.length;
      let dx = n.pos.x - cx, dz = n.pos.z - cz; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      const px = n.pos.x + dx * 3.5, pz = n.pos.z + dz * 3.5; H.jugador.ubicar(px, pz, Math.atan2(-(cx - px), -(cz - pz))); H.jugador.estado.pitch = 0.08; return 1 })()`);
    await capturar('6-noche-estrellas');
    e = await js(`({ club: ${P}.noticias.club, estrellas: ${P}.noticias.estrellas })`);
    ok(e.club.includes(24) && e.estrellas.includes(48), `quedan anotados (${JSON.stringify(e)})`);

    // ------------------------------------------------------------ 7. guardar y cargar
    seccion('7. guardar y cargar');
    const antes = await js(`JSON.stringify({ n: ${P}.noticias, c: ${P}.concursos })`);
    await js(`(()=>{ ${H}.guardar(); return 1 })()`);
    await abrir();
    ok(await listo(), 'vuelve a cargar');
    await entrar();
    const despues = await js(`JSON.stringify({ n: ${P}.noticias, c: ${P}.concursos })`);
    ok(despues === antes, 'las noticias, las cartas y las cintas siguen igual');
    await cuadros(10);
  } catch (err) {
    errores.push(`excepción: ${err && err.stack ? err.stack : err}`);
    console.log(`ERROR ${err && err.stack ? err.stack : err}`);
  }
  if (errores.length) { console.log(`\nFALLA humo 3.7.5 (noticias): ${errores.length}`); for (const x of errores) console.log(`  · ${x}`); app.exit(1); }
  else { console.log('\nOK humo 3.7.5 · la radio, el diario, las cartas, el calendario y los concursos'); app.exit(0); }
});

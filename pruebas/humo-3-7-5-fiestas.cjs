// Partida real 3.7.5 (fiestas): las tradiciones en el juego (Electron + WebGL). Las teclas van de verdad (keydown) y el
// reloj del juego se pone a mano en el día y la hora de cada fecha (se dice dónde):
//   1. la Fiesta de la Fruta Fina (día 2): el predio armado, los adornos, el fuego y los invitados del tren de fiesta;
//      la gente en la mesa larga; vos te sentás con E en un banco y te sirven; el recuerdo;
//   2. el baile: el músico en la tarima con su instrumento, las parejas bailando chamamé en la pista, la clase de Pocha;
//   3. una mano de truco en la mesita de los juegos (E, el menú, los números), con el rival que juega solo;
//   4. la jineteada: E en la tranquera, montás y te sostenés con A y D (adelantándote a los corcovos);
//   5. la minga (día 7): E en la leñera, la obra que queda hecha al mediodía;
//   6. la noche de la leyenda (día 9, de noche): el fogón, E para escucharla entera; el recuerdo;
//   7. tu cumpleaños con amigos: la fiesta sorpresa en el predio;
//   8. colgar los recuerdos en el refugio; guardar y cargar; sin errores.
// Uso: npx electron --no-sandbox pruebas/humo-3-7-5-fiestas.cjs (HUMO_LOG=<archivo>: cada renglón también ahí)
// Perfil propio (HUMO_PERFIL, o una carpeta temporal): borra su localStorage, nunca el de %APPDATA%\Hojarasca.
const { app, BrowserWindow, dialog } = require('electron');
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); app.exit(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa sin atender): ${e && e.stack ? e.stack : e}`); app.exit(1); });
const path = require('path');
const os = require('os');
const raiz = path.resolve(__dirname, '..');
app.setPath('userData', path.resolve(process.env.HUMO_PERFIL || path.join(os.tmpdir(), 'hojarasca-humo-3-7-5-fiestas')));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const decir = (s) => { console.log(s); if (process.env.HUMO_LOG) try { require('fs').appendFileSync(process.env.HUMO_LOG, s + String.fromCharCode(10)); } catch { /* nada */ } };
setTimeout(() => { console.log('ERROR: la prueba tardó más de 15 minutos'); app.exit(2); }, 15 * 60 * 1000).unref?.();

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: false, width: 1100, height: 700, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught|falló "fiestas"/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = 'carga';
  const js = (c) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 120 s (${donde})`)), 120000)),
  ]);
  const ok = (cond, texto) => { decir(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; decir(`— ${s}`); };
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const listo = async () => {
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__fiestas && window.__hojarasca.__fiestas())').catch(() => false)) return true; }
    return false;
  };
  const H = 'window.__hojarasca';
  const P = `${H}.progreso`;
  const F = `${H}.__fiestas()`;
  const FM = `${H}.__fiestasMundo()`;
  const ajustes = `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'muybaja', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre', estacion: 'auto', ritmoAldea: 'normal' }));`;
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    await js(`${H}.volverAlJuego?.(); ${H}.ajustes.limiteFps = 'libre'; 1`);
  };
  const tecla = (code) => js(`(()=>{ document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', bubbles: true })); return 1 })()`);
  const aviso = () => js(`(()=>{ const a = ${H}.__avisoYa(); return a ? a.texto : '' })()`);
  const notas = () => js(`document.getElementById('notas').textContent`);
  const cuadros = (n = 4) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  const panel = () => js(`(()=>{ const d = document.getElementById('fiesta-panel'); const lis = [...d.querySelectorAll('li')]; return { abierto: !d.classList.contains('oculto'), titulo: d.querySelector('.quien').textContent, dicho: d.querySelector('.dicho').textContent, lis: lis.map((l) => l.textContent), estado: ${F}.estadoPanel() } })()`);
  // el jugador en un punto del predio (o un poco corrido), mirando a otro
  const enPredio = (punto, dx = 0, dz = 0, mira = null) => js(`(()=>{ const M = ${FM}; const q = M.punto('${punto}'); const j = ${H}.jugador; const x = q.x + ${dx}, z = q.z + ${dz};
    const m = ${mira ? `M.punto('${mira}')` : 'null'}; j.ubicar(x, z, m ? Math.atan2(-(m.x - x), -(m.z - z)) : 0); j.estado.pitch = -0.15; return { x, z } })()`);
  // poner la hora y que la aldea acomode a cada uno en su lugar (con vos lejos, sin caminar; después volvés)
  const hora = async (dia, h) => {
    await js(`(()=>{ ${P}.dia = ${dia}; ${P}.horas = ${h}; ${F}.reiniciarDia(); return 1 })()`);
    await js(`(()=>{ const r = ${H}.T.lugares.refugio; ${H}.jugador.ubicar(r.x, r.z, 0); for (let i = 0; i < 8; i++) ${H}.__aldea.actualizar(0.6); ${H}.__aldea.mundo()?.prearmar?.(1e6); return 1 })()`);
  };
  const acomodar = async () => {
    for (let i = 0; i < 6; i++) { await js(`(()=>{ ${H}.__aldea.actualizar(0.6); ${H}.__aldea.mundo()?.prearmar?.(1e6); ${FM}.deUna(true); ${FM}.armarTodo(); ${F}.actualizar(0.6); ${FM}.actualizar(0.6); return 1 })()`); await cuadros(2); }
  };
  const npc = (k) => `${H}.__aldea.mundo().personas.get('${k}')?.npc`;
  const aldeaLista = async () => { await js(`(async () => { const M = ${H}.__aldeaMundo(); await M.listo(); M.montarCola(); return 1 })()`); };

  try {
    await w.loadURL('about:blank');
    await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
    await abrir();
    ok(await listo(), 'el juego cargó');
    await js(`(()=>{ localStorage.clear(); ${ajustes} return 1 })()`);
    await abrir();
    ok(await listo(), 'una partida Relax limpia');
    await entrar();
    // la aldea con los locales de siempre (el salón con el músico, la costurería de Pocha)
    await js(`(()=>{ const a = ${P}.aldea; a.pobladores = ['carpintero', 'panadera', 'herrero', 'musico', 'maestra', 'modista'].map((clave) => ({ clave, dia: 1 })); a.locales = { carpinteria: 1, panaderia: 1, herreria: 1, salon: 1, escuela: 1, costureria: 1 }; a.obras = {}; return 1 })()`);
    let e = await js(`(()=>({ fiestas: !!${P}.fiestas, cal: ${F}.estado().cumple, enCal: ${H}.__aldea.mundo()?.vida ? 1 : 0 }))()`);
    ok(e.fiestas && e.cal === 3, `partida nueva: las fiestas de cero (tu cumpleaños, el día ${e.cal} del año)`);

    // ------------------------------------------------------------ 1. la Fiesta de la Fruta Fina: la mesa larga
    seccion('la fiesta de estación: la mesa larga');
    await hora(2, 12.4);
    await enPredio('mesa-n-3', 0.8, 1.2, 'mesa-s-3');
    await aldeaLista(); await acomodar();
    e = await js(`(()=>{ const a = ${F}.ahora(); const m = ${FM}.estado(); return { fecha: a?.fecha.id, fase: a?.fase.fase, predio: m.predio, asientos: m.asientos, adorno: m.adorno, fuego: m.fuego, invitados: m.invitados.filter((i) => i.lista).length } })()`);
    ok(e.fecha === 'fiesta-verano' && e.fase === 'mesa', `el día 2 al mediodía: ${e.fecha}, ${e.fase}`);
    ok(e.predio && e.asientos >= 30 && e.adorno && e.fuego, `el predio con sus asientos (${e.asientos}), los adornos y el fuego`);
    ok(e.invitados >= 2, `los invitados del tren de fiesta (${e.invitados})`);
    e = await js(`(()=>{ const l = ${H}.__aldea.mundo().estado().npcs; const m = l.filter((x) => x.destino?.edificio === 'predio'); return { en: m.length, comen: l.filter((x) => x.pose === 'comer').length } })()`);
    ok(e.en >= 8 && e.comen >= 6, `la aldea en la mesa larga (${e.en} en el predio, ${e.comen} comiendo)`);
    // sentarse con E en un banco libre
    const libre = await js(`(()=>{ const ocupados = ${H}.__aldea.mundo().estado().npcs.filter((x) => x.destino?.edificio === 'predio').map((x) => x.destino); for (let i = 10; i >= 0; i--) for (const l of ['s', 'n']) { const q = ${FM}.punto('mesa-' + l + '-' + i); if (!ocupados.some((d) => Math.hypot(d.x - q.x, d.z - q.z) < 0.5)) return 'mesa-' + l + '-' + i; } return null })()`);
    ok(!!libre, `un lugar libre en la mesa (${libre})`);
    const lado = libre.includes('-n-') ? 1 : -1;
    await js(`(()=>{ const M = ${FM}; const q = M.punto('${libre}'); const t = M.punto('${libre.includes('-n-') ? libre.replace('-n-', '-s-') : libre.replace('-s-', '-n-')}'); const j = ${H}.jugador; const dx = q.x - t.x, dz = q.z - t.z, L = Math.hypot(dx, dz); const x = q.x + dx / L * 0.55, z = q.z + dz / L * 0.55; j.ubicar(x, z, Math.atan2(-(q.x - x), -(q.z - z))); j.estado.pitch = -0.35; return 1 })()`);
    await cuadros(4);
    let av = await aviso();
    ok(/banco de la mesa larga/i.test(av), `el aviso: ${av}`);
    await tecla('KeyE');
    await cuadros(2);
    ok(await js(`${H}.jugador.estado.sentado`), 'sentado a la mesa larga');
    for (let i = 0; i < 10; i++) { await js(`${F}.actualizar(0.6); 1`); await cuadros(1); }
    let nt = await notas();
    ok(/Te sirven cordero al asador/.test(nt) && await js(`${P}.fiestas.comio.includes('fiesta-verano|1')`), 'te sirven (cordero al asador)');
    for (let i = 0; i < 20; i++) await js(`${F}.actualizar(0.6); 1`);
    ok(await js(`${P}.fiestas.recuerdos.some((r) => r.id === 'fiesta-verano')`), 'el recuerdo de la Fruta Fina');
    // (levantarse: W sostenida un ratito)
    await js(`(()=>{ ${H}.jugador.teclas.add('KeyW'); return 1 })()`); await cuadros(3); await js(`(()=>{ ${H}.jugador.teclas.delete('KeyW'); return 1 })()`); await cuadros(1);
    ok(!(await js(`${H}.jugador.estado.sentado`)), 'te levantás');
    void lado;

    // ------------------------------------------------------------ 2. el baile y la clase de Pocha
    seccion('el baile');
    await hora(2, 18.2);
    await enPredio('mira-baile-3', 0, 0.8, 'pista-0');
    await acomodar();
    for (let i = 0; i < 12; i++) { await js(`(()=>{ ${H}.__aldea.actualizar(0.6); return 1 })()`); await cuadros(1); }
    e = await js(`(()=>{ const l = ${H}.__aldea.mundo().estado().npcs; const mu = l.find((x) => x.clave === 'musico'); const m = ${FM}.estado(); return { bailan: l.filter((x) => x.pose === 'chamame').length, musico: mu?.pose, punto: mu?.destino?.punto, instr: m.instrumentos, aplauden: l.filter((x) => x.pose === 'aplaudir').length } })()`);
    ok(e.bailan >= 4, `parejas bailando chamamé (${e.bailan})`);
    ok(e.musico === 'tocar' && e.punto === 'tarima' && e.instr >= 1, `el músico en la tarima, con su acordeón (${e.musico}, ${e.instr})`);
    ok(e.aplauden >= 2, `el público aplaude (${e.aplauden})`);
    // la clase de Pocha: en la pista
    // (en el borde de la pista que da a la calle de la estación, mirando para afuera: los que bailan quedan atrás)
    await js(`(()=>{ const M = ${FM}; const a = M.punto('pista-0'), b = M.punto('pista-1'); const dx = a.x - b.x, dz = a.z - b.z, L = Math.hypot(dx, dz); const x = a.x + dx / L * 1.1, z = a.z + dz / L * 1.1; const j = ${H}.jugador; j.ubicar(x, z, Math.atan2(-dx, -dz)); return 1 })()`);
    await cuadros(4);
    av = await aviso();
    if (!/clase/.test(av)) decir(`  (diagnóstico: ${JSON.stringify(await js(`(()=>{ const j = ${H}.jugador.estado; const a = ${F}.accion(j); return { sentado: j.sentado, y: j.pos.y, fase: ${F}.ahora()?.fase.fase, accion: a?.texto || null, objetivo: ${H}.__objetivo?.() || null } })()`))})`);
    ok(/clase de chamamé con Pocha/.test(av), `en la pista: ${av}`);
    await tecla('KeyE');
    let p = await panel();
    ok(p.abierto && /Clase de chamamé con Pocha/.test(p.titulo), `la clase (${p.titulo})`);
    // mirar los pasos y repetirlos con los números
    await tecla('Digit1');
    const sec = (await panel()).estado.clase.secuencia;
    for (const s of sec) await tecla(`Digit${s + 1}`);
    p = await panel();
    ok(p.estado.clase?.aprobada && await js(`${P}.fiestas.baile.chamame`) === 1, `repetidos los ${sec.length} pasos: nivel 1 de chamamé`);
    await tecla('Escape');
    ok(!(await panel()).abierto, 'Escape cierra la clase');

    // ------------------------------------------------------------ 3. una mano de truco
    seccion('una mano de truco');
    await hora(2, 15.2);
    await enPredio('juegos-0', -0.7, 0, 'mesita');
    await acomodar();
    for (let i = 0; i < 8; i++) { await js(`(()=>{ ${H}.__aldea.actualizar(0.6); return 1 })()`); await cuadros(1); }
    av = await aviso();
    ok(av === 'Sentarte en una silla de la mesita de juegos', `al lado de la mesita: ${av}`);
    await tecla('KeyE'); await cuadros(2);
    av = await aviso();
    ok(/^Jugar con .+ \(truco, chinchón o damas\)$/.test(av), `sentado en la mesita: ${av}`);
    await tecla('KeyE');
    p = await panel();
    ok(p.abierto && /La mesita de los juegos/.test(p.titulo) && p.lis.length === 4, 'el menú: truco, chinchón, damas o nada');
    await tecla('Digit1');
    p = await panel();
    ok(/^Truco con /.test(p.titulo) && /tenés \d+ de envido/.test(p.dicho), `la mesa del truco (${p.titulo})`);
    // jugar hasta que termine la primera mano: tirar cartas cuando toca; el rival juega solo
    let manos = 0;
    for (let i = 0; i < 80 && manos === 0; i++) {
      p = await panel();
      const ops = p.estado.opciones;
      const k = ops.findIndex((o) => o.puede && /^Tirar el|^Quiero$/.test(o.texto));
      if (ops.some((o) => o.texto === 'Repartir otra mano' || o.texto === 'Listo')) { manos = 1; break; }
      if (k >= 0) await tecla(`Digit${k + 1}`);
      else { await js(`${F}.actualizar(1); 1`); }
    }
    p = await panel();
    ok(manos === 1 && p.estado.log.some((l) => /La mano es/.test(l)), `una mano entera (${p.estado.log.slice(-2).join(' / ')})`);
    ok(p.estado.juego.puntos[0] + p.estado.juego.puntos[1] >= 1, `con puntos anotados (${p.estado.juego.puntos.join(' a ')})`);
    await tecla('Escape');
    ok(!(await panel()).abierto && /Dejaste el partido/.test(await notas()), 'Escape: dejaste el partido');
    await tecla('KeyR'); await cuadros(1);   // (R te levanta)
    ok(!(await js(`${H}.jugador.estado.sentado`)), 'te levantás de la mesita');

    // ------------------------------------------------------------ 4. la jineteada
    seccion('la jineteada');
    await js(`(()=>{ ${F}.sinMonta(); return 1 })()`);   // (si el domador estaba montando, terminó)
    await enPredio('tranquera', 0, 0, 'palenque');
    await cuadros(4);
    av = await aviso();
    ok(av === 'Anotarte en la jineteada', `en la tranquera: ${av}`);
    await tecla('KeyE');
    ok(await js(`${F}.montando()`) && (await panel()).titulo === 'La jineteada', 'montás: el panel de la jineteada');
    // te sostenés: A y D de verdad (en el juego, las teclas del jugador), adelantándote a los corcovos
    e = await js(`(async () => {
      const J = ${F}, t = ${H}.jugador.teclas; const buf = [];
      for (let i = 0; i < 1200; i++) {
        const m = J.jineteada(); if (!m.monta || m.monta.fin) break;
        const j = m.jugador; buf.push([j.eq, j.vel]); const [eq, v] = buf.length > 6 ? buf[buf.length - 7] : [0, 0];
        const x = eq + 0.5 * v; t.delete('KeyA'); t.delete('KeyD');
        // (la izquierda empuja para la izquierda: si se va para la derecha, A)
        if (x > 0.1) t.add('KeyA'); else if (x < -0.1) t.add('KeyD');
        J.actualizar(1 / 60);
      }
      t.delete('KeyA'); t.delete('KeyD');
      const m = J.jineteada(); return { fin: m.monta?.fin, aguanto: m.jugador?.aguanto, t: m.jugador?.t, montas: ${P}.fiestas.jineteada.montas } })()`);
    ok(e.fin && e.montas === 1, `la monta terminó (${e.aguanto ? 'aguantaste' : `te caíste a los ${e.t?.toFixed(1)} s`})`);
    ok(e.aguanto && await js(`${P}.fiestas.recuerdos.some((r) => r.id === 'jineteada')`), 'adelantándote, aguantás el tiempo: la cinta del jinete');
    nt = await notas();
    ok(/Aguantaste el tiempo/.test(nt), 'el aviso: ¡aguantaste!');
    await esperar(3200); await cuadros(2);
    ok(!(await js(`${F}.montando()`)), 'te bajan los apadrinadores');

    // ------------------------------------------------------------ 5. la minga
    seccion('la minga');
    await hora(7, 9.6);
    await enPredio('minga-2', 0, -1.2, 'lenera');
    await acomodar();
    await cuadros(4);
    av = await aviso();
    ok(/^Dar una mano en la minga \(la leñera de la aldea\)$/.test(av), `en la leñera: ${av}`);
    for (let i = 0; i < 6; i++) { await tecla('KeyE'); await cuadros(1); }
    ok(await js(`${P}.fiestas.mingaHoy.cargas`) === 6 && await js(`${P}.fiestas.recuerdos.some((r) => r.id === 'minga')`), 'seis cargas: tu parte, y la cuña de la minga');
    await js(`(()=>{ ${P}.horas = 13.3; return 1 })()`);
    for (let i = 0; i < 4; i++) { await js(`${F}.actualizar(0.6); 1`); await cuadros(1); }
    await cuadros(4);
    e = await js(`(()=>({ hecha: ${P}.fiestas.minga.some((m) => m.obra === 'lenera'), malla: ${FM}.estado().predio }))()`);
    ok(e.hecha && /La minga terminó: la leñera de la aldea/.test(await notas()), 'al mediodía, la leñera queda hecha');

    // ------------------------------------------------------------ 6. la noche de la leyenda
    seccion('la noche de la leyenda');
    await hora(9, 20.6);
    await enPredio('narrador', 0.5, 1.4, 'narrador');
    await acomodar();
    for (let i = 0; i < 8; i++) { await js(`(()=>{ ${H}.__aldea.actualizar(0.6); return 1 })()`); await cuadros(1); }
    e = await js(`(()=>{ const l = ${H}.__aldea.mundo().estado().npcs; return { cuenta: l.find((x) => x.pose === 'contar')?.clave, sentados: l.filter((x) => x.destino?.punto?.startsWith('fogon-')).length } })()`);
    ok(e.cuenta === 'abuela' && e.sentados >= 6, `la abuela cuenta; ${e.sentados} alrededor del fogón`);
    ok(await js(`${FM}.estado().fuego`), 'el fogón prendido');
    av = await aviso();
    ok(/^Escuchar la noche en que salieron los duendes$/.test(av)   /* 3.8.0: la del primer año es la de los duendes */, `al lado del fogón: ${av}`);
    await tecla('KeyE');
    const partes = [];
    for (let i = 0; i < 12; i++) {
      const c = await js(`(()=>({ npc: !!${H}.__charla().npc, texto: document.getElementById('charla-texto').textContent }))()`);
      if (!c.npc) break;
      partes.push(c.texto);
      await tecla('KeyE');
    }
    ok(partes.length >= 6 && /duendes/i.test(partes.join(' ')), `la leyenda entera (${partes.length} partes)`);
    ok(await js(`${P}.fiestas.leyendas.includes('duendes') && ${P}.fiestas.recuerdos.some((r) => r.id === 'leyenda')`), 'la leyenda escuchada y el farolito');

    // ------------------------------------------------------------ 7. tu cumpleaños con amigos: la sorpresa
    seccion('la fiesta sorpresa');
    await js(`(()=>{ for (const k of ['jefe', 'nelida', 'herrero', 'padre']) ${H}.__aldea.amigo(k); return 1 })()`);
    await hora(15, 18.4);   // (el día 15 es el 3 del año 2: tu cumpleaños)
    await acomodar();
    e = await js(`(()=>{ const a = ${F}.ahora(); return { fecha: a?.fecha.id, fase: a?.fase.fase } })()`);
    ok(e.fecha === 'cumple-jugador' && e.fase === 'sorpresa', `tu cumpleaños, con amigos: ${e.fecha} (${e.fase})`);
    await enPredio('mesa-s-5', 0, -1.5, 'mesa-s-5');
    for (let i = 0; i < 4; i++) { await js(`${F}.actualizar(0.6); 1`); await cuadros(1); }
    nt = await notas();
    ok(/¡Sorpresa! ¡Feliz cumpleaños!/.test(nt) && await js(`${P}.fiestas.cumples.includes(2)`), 'la sorpresa en el predio');

    // ------------------------------------------------------------ 8. colgar los recuerdos, guardar y cargar
    seccion('los recuerdos en el refugio');
    await js(`(()=>{ ${P}.dia = 16; ${P}.horas = 11; ${F}.reiniciarDia(); return 1 })()`);
    const tab = await js(`(()=>{ const t = ${FM}.tablero(); const r = ${H}.T.lugares.refugio; const c = Math.cos(r.rot || 0), s = Math.sin(r.rot || 0); const x = t.x - 1.3 * s, z = t.z - 1.3 * c; const j = ${H}.jugador; j.ubicar(x, z, Math.atan2(-(t.x - x), -(t.z - z))); j.estado.pitch = 0.05; return { t, y: j.estado.pos.y } })()`);
    await cuadros(4);
    av = await aviso();
    ok(/^Colgar los \d+ recuerdos de las fiestas$/.test(av), `en el refugio: ${av}`);
    await tecla('KeyE');
    await cuadros(3); await js(`${FM}.actualizar(0.6); 1`);
    e = await js(`(()=>({ colgados: ${P}.fiestas.colgados.length, firma: ${FM}.estado().recuerdos }))()`);
    ok(e.colgados >= 5 && e.firma.split('|')[0].split(',').length === e.colgados, `colgados en el tablero (${e.colgados})`);
    void tab;
    await js(`(()=>{ ${H}.guardar?.(); return 1 })()`);
    await esperar(400);
    await abrir();
    ok(await listo(), 'cargó de nuevo');
    await entrar();
    e = await js(`(()=>{ const f = ${P}.fiestas; return { colgados: f.colgados.length, minga: f.minga.map((m) => m.obra).join(), baile: f.baile.chamame, montas: f.jineteada.montas, leyendas: f.leyendas.join() } })()`);
    ok(e.colgados >= 5 && e.minga === 'lenera' && e.baile === 1 && e.montas === 1 && e.leyendas === 'duendes', `todo guardado (${JSON.stringify(e)})`);
  } catch (err) {
    errores.push(`excepción en «${donde}»: ${err && err.stack ? err.stack : err}`);
  }
  decir(errores.length ? `FALLÓ (${errores.length}):\n  ${errores.join('\n  ')}` : 'OK humo 3.7.5 fiestas');
  app.exit(errores.length ? 1 : 0);
});

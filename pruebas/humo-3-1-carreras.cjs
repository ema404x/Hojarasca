// Partida real 3.1 (Electron + WebGL, con el preload de escritorio y la carpeta
// sincronizada en un temporal): carreras, desafío del día y torneo de la semana.
//  1. A caballo: al poste de la estepa, el aviso ofrece largar (montado, E larga en vez de
//     bajar), E con la tecla de verdad, cuenta, las cuatro puertas y la llegada: queda el
//     récord con su fantasma. La segunda vuelta corre contra el fantasma.
//  2. En kayak: a la boya del muelle, E, las boyas del lago y la llegada.
//  3. El desafío del día (con una fecha de pesca): se pesca y se cumple; la racha.
//  4. El torneo: un pez de la especie de la semana anota; se escribe el archivo propio en la
//     carpeta; aparece el archivo de otra compu (y uno hostil) y la tabla los junta; el
//     código de un amigo se pega en el panel.
//  5. Se guarda, se recarga, y todo sigue: récords, racha, torneo y la portada.
// Uso: npx electron pruebas/humo-3-1-carreras.cjs --user-data-dir=<carpeta propia>
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(__dirname, 'salidas', '3-1-carreras');
fs.mkdirSync(salida, { recursive: true });
const argPerfil = process.argv.find((a) => a.startsWith('--user-data-dir='));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hojarasca-carreras-'));
app.setPath('userData', argPerfil ? path.resolve(argPerfil.slice(16)) : path.join(tmp, 'datos'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const nube = path.join(tmp, 'OneDrive');
fs.mkdirSync(nube, { recursive: true });

const { registrarSincronia } = require(path.join(raiz, 'sincronia-main.cjs'));
const sync = registrarSincronia({ ipcMain, app, dialog: { showOpenDialog: async () => ({ canceled: false, filePaths: [nube] }) } });
void dialog;
ipcMain.handle('app-version', () => 'prueba');
ipcMain.handle('app-platform', () => process.platform);
ipcMain.handle('steam-disponible', () => false);
ipcMain.handle('steam-logro', () => false);
ipcMain.handle('guardar-foto', () => path.join(salida, 'foto.png'));
ipcMain.handle('graficos-fallaron', () => false);

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  const TO = await import(pathToFileURL(path.join(raiz, 'src', 'torneo.js')).href);
  sync.elegirCarpeta(nube);
  const w = new BrowserWindow({ show: false, width: 1100, height: 700, webPreferences: {
    preload: path.join(raiz, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = 'carga';
  const js = (c, limite = 180000) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en ${limite / 1000} s (${donde})`)), limite)),
  ]);
  const ok = (cond, texto) => { const l = `${cond ? '✓' : '✗'} ${texto}`; pasos.push(l); console.log(l); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const url = path.join(raiz, 'index.html');
  const H = 'window.__hojarasca';
  const M = `${H}.__modos()`;
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const listo = async () => {
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.jugador && ${H}.__modos && ${H}.__modos())`).catch(() => false)) return true; }
    return false;
  };
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
    await js(`(()=>{ ${H}.ajustes.limiteFps = 'libre'; for (let i = 0; i < 4; i++) ${H}.__bucle(); return 1 })()`);
  };
  const tecla = (code) => js(`document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', key: '${code}', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', key: '${code}', bubbles: true })); 1`);
  const cuadros = (n = 6) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return ${H}.__aviso() })()`);
  // Corre la carrera en curso: el jugador (y el kayak, si va en kayak) avanza derecho a la
  // puerta que sigue a `vel` m/s, en pasos fijos de 50 ms; cada tanto, un cuadro entero.
  const correr = (vel) => js(`(()=>{
    const H = ${H}, m = H.__modos(), js = H.jugador.estado, K = H.kayak.est;
    let pasos = 0, vistoHud = '', fantasmaVisto = false;
    for (; pasos < 40000; pasos++) {
      const e = m.__.estado().carrera;
      if (!e || e.fase === 'fin') break;
      if (e.fase === 'corriendo') {
        const p = e.puntos[e.sig], dx = p.x - js.pos.x, dz = p.z - js.pos.z, d = Math.hypot(dx, dz), paso = Math.min(d, (${vel}) * 0.05);
        js.pos.x += dx / (d || 1) * paso; js.pos.z += dz / (d || 1) * paso;
        if (js.enKayak) { K.x = js.pos.x; K.z = js.pos.z; } else js.pos.y = H.T.altura(js.pos.x, js.pos.z) + 1.65;
      }
      m.actualizar(0.05);
      if (pasos % 150 === 0) { if (js.enKayak) { K.x = js.pos.x; K.z = js.pos.z; } H.__bucle(); }
      if (!vistoHud && /Puerta/.test(document.getElementById('carrera-hud').textContent)) vistoHud = document.getElementById('carrera-hud').textContent;
      if (m.__.mundo && m.__.mundo.grupo.children.some((o) => o.visible && o.material && o.material.opacity === 0.35)) fantasmaVisto = true;
    }
    return { pasos, vistoHud, fantasmaVisto, fin: m.__.estado().ultimoResultado, avisos: H.__avisos().slice(-8) };
  })()`, 300000);

  // Lo mismo, pero con las teclas de verdad y la física del jugador: W (y Shift) apretadas,
  // mirando a la puerta que sigue. Los árboles, las laderas y las paredes cuentan.
  const correrDeVerdad = (limite = 12000) => js(`(()=>{
    const H = ${H}, m = H.__modos(), js = H.jugador.estado, T = H.jugador.teclas;
    let pasos = 0, atascos = 0, donde = null, ult = { x: js.pos.x, z: js.pos.z };
    for (; pasos < ${limite}; pasos++) {
      const e = m.__.estado().carrera;
      if (!e || e.fase === 'fin') break;
      if (e.fase === 'corriendo') {
        T.add('KeyW'); T.add('ShiftLeft');
        const p = e.puntos[e.sig];
        js.yaw = Math.atan2(-(p.x - js.pos.x), -(p.z - js.pos.z));
      }
      H.jugador.actualizar(0.05);
      m.actualizar(0.05);
      if (pasos % 100 === 99) {
        if (e.fase === 'corriendo' && Math.hypot(js.pos.x - ult.x, js.pos.z - ult.z) < 4) { atascos++; donde = { x: Math.round(js.pos.x), z: Math.round(js.pos.z), puerta: e.sig }; }
        ult = { x: js.pos.x, z: js.pos.z };
      }
      if (pasos % 300 === 0) H.__bucle();
    }
    T.delete('KeyW'); T.delete('ShiftLeft');
    return { pasos, atascos, donde, fin: m.__.estado().ultimoResultado, c: m.__.estado().carrera };
  })()`, 300000);

  try {
    await abrir();
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!${H}`).catch(() => false)) break; }
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'})); 1`);
    await abrir();
    ok(await listo(), 'el juego cargó, con las carreras armadas');
    ok(await js(`!!window.hojarasca?.sync?.torneoLeer && !!window.hojarasca?.sync?.torneoEscribir`), 'el preload expone el torneo');
    const portada0 = await js(`document.getElementById('diario-portada').textContent`);
    ok(/Desafío del día: .+Torneo de la semana [A-Z]+-\d+/.test(portada0), `la portada muestra el desafío del día y el torneo ("${portada0.slice(0, 90)}…")`);
    ok(await js(`!document.getElementById('btn-modos-inicio').classList.contains('oculto')`), 'la portada tiene el botón del panel');
    await entrar();
    ok(await js(`${H}.__modos().__.mundo.postes.length === 6`), 'seis postes de largada en el mundo');
    // una fecha con desafío de pesca (se busca desde mañana)
    const fecha = await js(`(()=>{ const m = ${H}.__modos(); let d = new Date(2026, 9, 1);
      for (let i = 0; i < 60; i++) { const f = d.toISOString().slice(0, 10); if (m.__.desafio(f).tipo === 'pesca') return f; d = new Date(d.getTime() + 86400000); } return null })()`);
    ok(!!fecha, `hay un día con desafío de pesca (${fecha})`);
    await js(`${M}.__.fecha('${fecha}'); 1`);

    // ---------------------------------------------------------------- 1. a caballo
    seccion('1. la vuelta de la estepa, a caballo');
    await js(`(()=>{ const H = ${H}; H.progreso.cosas.caballo = 1; H.progreso.caballo = { x: 296, z: -58, yaw: 0 };
      const js = H.jugador.estado; js.pos.set(297, H.T.altura(297, -57) + 1.65, -57); return 1 })()`);
    await cuadros(4);
    ok(await js(`${H}.caballoCerca()`), 'el zaino está al lado');
    await tecla('KeyE');
    await cuadros(2);
    ok(await js(`!!${H}.jugador.estado.montado`), 'E sube al zaino');
    await js(`(()=>{ const H = ${H}, js = H.jugador.estado; js.pos.set(300, H.T.altura(300, -60) + 2.6, -60); return 1 })()`);
    const avisoPoste = await cuadros(6);
    ok(/Largar: La vuelta de la estepa/.test(avisoPoste), `montado en el poste, el aviso ofrece largar ("${avisoPoste}")`);
    await tecla('KeyE');
    const tras = await js(`({ montado: !!${H}.jugador.estado.montado, c: ${M}.__.estado().carrera })`);
    ok(tras.montado && tras.c?.fase === 'cuenta' && tras.c.id === 'estepa', 'E larga (y no te baja del caballo): cuenta regresiva');
    const cuenta = await js(`(()=>{ const m = ${M}; m.actualizar(0.05); ${H}.__bucle(); return document.getElementById('carrera-hud').textContent })()`);
    ok(/La vuelta de la estepa\s*3/.test(cuenta), `la cuenta en pantalla ("${cuenta}")`);
    const v1 = await correr(11);
    ok(v1.fin?.id === 'estepa' && v1.fin.ms > 30000 && v1.fin.ms < 90000, `llegada a galope: ${v1.fin?.ms} ms (${v1.pasos} pasos)`);
    ok(/Puerta \d de 4/.test(v1.vistoHud), `el reloj y la puerta que sigue en pantalla ("${v1.vistoHud.replace(/\n/g, ' / ')}")`);
    ok(v1.avisos.some((a) => /Puerta 1 de 4/.test(a)) && v1.avisos.some((a) => /Llegada/.test(a)), `parciales y llegada anotados (${v1.avisos.join(' | ')})`);
    const rec1 = await js(`${H}.progreso.carreras.mejores.estepa`);
    ok(rec1 && rec1.ms === v1.fin.ms && rec1.parciales.length === 4 && rec1.fantasma?.pts?.length > 20, 'el récord queda en la partida, con parciales y fantasma');
    ok(rec1.fecha === fecha, `con la fecha (${rec1.fecha})`);
    // segunda vuelta, más lenta: corre contra el fantasma y no pisa el récord
    await js(`(()=>{ const H = ${H}, js = H.jugador.estado; js.pos.set(300, H.T.altura(300, -60) + 2.6, -60); return 1 })()`);
    await cuadros(4);
    await tecla('KeyE');
    const v2 = await correr(9);
    ok(v2.fantasmaVisto, 'la segunda vuelta corre contra el fantasma');
    ok(v2.fin?.ms > v1.fin.ms && (await js(`${H}.progreso.carreras.mejores.estepa.ms`)) === v1.fin.ms, 'una vuelta más lenta no pisa el récord');
    // la vuelta entera con las teclas de verdad: el zaino galopa sin trabarse
    await js(`(()=>{ const m = ${M}; for (let i = 0; i < 200; i++) m.actualizar(0.05); const H = ${H}, js = H.jugador.estado; js.pos.set(300, H.T.altura(300, -60) + 2.6, -60); js.vel.set(0, 0, 0); return 1 })()`);
    await cuadros(3);
    await tecla('KeyE');
    const v3 = await correrDeVerdad();
    ok(v3.fin?.id === 'estepa' && v3.fin.ms < 90000 && v3.atascos === 0, `a galope de verdad (W + Shift): llegada en ${v3.fin?.ms} ms, sin trabarse (${JSON.stringify(v3.donde)})`);
    // la pampa del sur, también de verdad
    await js(`(()=>{ const m = ${M}; for (let i = 0; i < 200; i++) m.actualizar(0.05); const H = ${H}, js = H.jugador.estado; js.pos.set(395, H.T.altura(395, 150) + 2.6, 150); js.vel.set(0, 0, 0); return 1 })()`);
    ok(/Largar: La pampa del sur/.test(await cuadros(4)), 'en el poste de la pampa');
    await tecla('KeyE');
    const v4 = await correrDeVerdad();
    ok(v4.fin?.id === 'pampa' && v4.atascos === 0, `la pampa a galope de verdad: ${v4.fin?.ms} ms, sin trabarse (${JSON.stringify(v4.donde)})`);
    await js(`(()=>{ const m = ${M}; for (let i = 0; i < 200; i++) m.actualizar(0.05); const H = ${H}, js = H.jugador.estado; js.pos.set(300, H.T.altura(300, -60) + 2.6, -60); js.vel.set(0, 0, 0); return 1 })()`);
    // bajarse en medio de una carrera la abandona
    await js(`(()=>{ const H = ${H}, js = H.jugador.estado; js.pos.set(300, H.T.altura(300, -60) + 2.6, -60); return 1 })()`);
    await cuadros(3);
    await tecla('KeyE');
    await js(`(()=>{ const m = ${M}; for (let i = 0; i < 70; i++) m.actualizar(0.05); ${H}.desmontar(); m.actualizar(0.05); return 1 })()`);
    const ab = await js(`({ c: ${M}.__.estado().carrera, avisos: ${H}.__avisos().slice(-3) })`);
    ok(ab.c?.fase === 'fin' && ab.avisos.some((a) => /abandonada/.test(a)), 'bajarse del zaino abandona la carrera');

    // ---------------------------------------------------------------- 1b. a pie, de verdad
    seccion('1b. los cross a pie, corriendo con las teclas');
    for (const [id, x, z] of [['mirador', -262, 50], ['faro', 195, -45]]) {
      await js(`(()=>{ const m = ${M}; for (let i = 0; i < 200; i++) m.actualizar(0.05); const H = ${H}, js = H.jugador.estado; js.pos.set((${x}), H.T.altura((${x}), (${z})) + 1.65, (${z})); js.vel.set(0, 0, 0); return 1 })()`);
      const av = await cuadros(4);
      ok(new RegExp('Largar').test(av), `a pie en el poste de ${id}: "${av}"`);
      await tecla('KeyE');
      const r = await correrDeVerdad();
      ok(r.fin?.id === id && r.atascos === 0, `${id}: corriendo de verdad, llegada en ${r.fin?.ms} ms sin trabarse (${JSON.stringify(r.donde)})`);
      const ref = await js(`${M}.__.estado().carreras.mejores['${id}']?.ms`);
      ok(ref > 0, `${id}: récord anotado`);
    }

    // ---------------------------------------------------------------- 2. en kayak
    seccion('2. la vuelta del lago, en kayak');
    await js(`(()=>{ const m = ${M}; for (let i = 0; i < 200; i++) m.actualizar(0.05); return 1 })()`);
    await js(`(()=>{ const H = ${H}, K = H.kayak.est, js = H.jugador.estado; K.x = 76; K.z = 151; js.pos.set(76, 0.25, 151); H.kayak.subir(H.jugador); return 1 })()`);
    const avisoKayak = await cuadros(6);
    ok(await js(`${H}.jugador.estado.enKayak`) && /Largar: La vuelta del lago/.test(avisoKayak), `en el kayak, en la boya: el aviso ofrece largar ("${avisoKayak}")`);
    await tecla('KeyE');
    ok(await js(`${M}.__.estado().carrera?.id === 'lago' && ${H}.jugador.estado.enKayak`), 'E larga (y no baja del kayak)');
    const k1 = await correr(3.4);
    ok(k1.fin?.id === 'lago' && k1.fin.ms > 100000, `llegada remando: ${k1.fin?.ms} ms`);
    ok(await js(`${H}.progreso.carreras.mejores.lago?.fantasma?.pts?.length > 50`), 'récord del lago con fantasma');
    await js(`(()=>{ const m = ${M}; for (let i = 0; i < 200; i++) m.actualizar(0.05); return 1 })()`);

    // ---------------------------------------------------------------- 3. el desafío del día
    seccion('3. el desafío del día');
    const def = await js(`${M}.__.desafio()`);
    ok(def.tipo === 'pesca' && def.fecha === fecha, `hoy (${fecha}): ${def.titulo}`);
    const hecho = await js(`(()=>{ const H = ${H}; const d = ${JSON.stringify(def)};
      for (let i = 0; i < d.n; i++) H.__atrapar({ id: d.pez || 'arcoiris', cm: 61, def: { nombre: 'trucha arcoíris' } });
      return { diarios: H.progreso.diarios, avisos: H.__avisos().slice(-6) } })()`);
    ok(hecho.diarios.hoy.hecho && hecho.diarios.racha === 1 && hecho.diarios.historial[fecha] === def.puntos, `cumplido: racha 1, ${def.puntos} puntos`);
    ok(hecho.avisos.some((a) => /Desafío del día cumplido/.test(a)), 'y lo avisa');

    // ---------------------------------------------------------------- 4. el torneo
    seccion('4. el torneo de la semana');
    const torneo = await js(`${M}.__.estado().torneo`);
    await js(`(()=>{ const H = ${H}; H.__atrapar({ id: '${torneo.pez}', cm: 57, def: { nombre: 'x' } }); return 1 })()`);
    const local = await js(`${M}.__.estado().local`);
    const mia = local.propias.find((e) => e.semana === torneo.semana);
    ok(mia && mia.pesca >= 57, `un pez de la especie de la semana (${torneo.pezNombre}) anota en el torneo`);
    if (torneo.circuito === 'lago') ok(mia.carreraMs > 0, 'y la vuelta del lago (circuito de la semana) también');
    ok(await js(`${M}.__.sincronizar()`), 'se escribe el archivo propio en la carpeta');
    const dirTorneo = path.join(nube, 'Hojarasca');
    const propio = path.join(dirTorneo, `hojarasca-torneo-${local.pc}.json`);
    ok(fs.existsSync(propio) && JSON.parse(fs.readFileSync(propio, 'utf8')).entradas.some((e) => e.pesca >= 57), 'el archivo propio tiene lo anotado');
    ok(!fs.readdirSync(dirTorneo).some((f) => f.endsWith('.tmp')), 'sin temporales');
    // otra compu, un archivo que se hace pasar por otra, y basura
    fs.writeFileSync(path.join(dirTorneo, 'hojarasca-torneo-oficina1.json'), JSON.stringify({ formato: 'hojarasca-torneo', version: 1, pc: 'oficina1', nombre: 'Oficina', entradas: [{ semana: torneo.semana, nombre: 'Oficina', pesca: 44, carreraMs: 64000, noches: 2, abatidos: 9 }], amigos: [] }));
    fs.writeFileSync(path.join(dirTorneo, 'hojarasca-torneo-trampa12.json'), JSON.stringify({ formato: 'hojarasca-torneo', pc: 'otra9999', entradas: [{ semana: torneo.semana, nombre: 'Impostor', pesca: 120 }] }));
    fs.writeFileSync(path.join(dirTorneo, 'hojarasca-torneo-basura00.json'), '{"formato":"hojarasca-torneo","pc":"basura00","entradas":[{"semana":"' + torneo.semana + '","nombre":"<img src=x onerror=alert(1)>","pesca":"1e9","__proto__":{"x":1}}]}');
    ok(await js(`${M}.__.sincronizar()`), 'se vuelve a leer la carpeta');
    await js(`${H}.abrir('pausa'); document.getElementById('btn-modos').click(); 1`);
    await esperar(800);
    const panel = await js(`(()=>{ const c = document.getElementById('modos31-contenido'); return { visible: !document.getElementById('modos31').classList.contains('oculto'), filas: [...c.querySelectorAll('table')].pop().querySelectorAll('tr').length - 1, texto: c.textContent, html: c.innerHTML } })()`);
    ok(panel.visible && /Oficina/.test(panel.texto) && /Compu /.test(panel.texto), 'el panel abre y la tabla junta las dos compus');
    ok(!/Impostor/.test(panel.texto) && !/<img/.test(panel.html) && /img srcx onerroral/.test(panel.texto), 'el archivo con nombre ajeno no entra; el hostil entra saneado y sin HTML');
    ok(/La vuelta de la estepa/.test(panel.texto) && /Desafío del día/.test(panel.texto), 'el panel muestra carreras y desafío del día');
    // el código de un amigo, pegado en el panel
    const codigoAmigo = TO.codigoPuntaje({ semana: torneo.semana, nombre: 'Juana Pérez', pesca: 49, carreraMs: 59000, noches: 5, abatidos: 31 });
    await js(`(()=>{ document.getElementById('torneo-amigo').value = ${JSON.stringify(codigoAmigo)}; [...document.querySelectorAll('#modos31-contenido button')].find(b => /Sumar/.test(b.textContent)).click(); return 1 })()`);
    const conAmigo = await js(`document.getElementById('modos31-contenido').textContent`);
    ok(/Juana Perez/.test(conAmigo), `el código del amigo suma su renglón (${codigoAmigo})`);
    const codigoMio = await js(`document.getElementById('torneo-codigo').value`);
    ok(TO.leerCodigoPuntaje(codigoMio)?.pesca >= 57, `el código propio se puede leer del otro lado (${codigoMio})`);
    await js(`document.getElementById('torneo-nombre').value = 'Casa'; [...document.querySelectorAll('#modos31-contenido button')].find(b => b.textContent === 'Guardar').click(); 1`);
    ok(await js(`/Casa/.test(document.getElementById('modos31-contenido').textContent)`), 'el nombre propio se cambia');
    await tecla('Escape');
    ok(await js(`document.getElementById('modos31').classList.contains('oculto') && !document.getElementById('pausa').classList.contains('oculto')`), 'Esc cierra el panel y vuelve a la pausa');
    ok(await js(`${M}.__.sincronizar()`), 'y se publica con el nombre nuevo');
    const archivoFinal = JSON.parse(fs.readFileSync(propio, 'utf8'));
    ok(archivoFinal.nombre === 'Casa' && archivoFinal.entradas.every((e) => e.nombre === 'Casa') && archivoFinal.amigos.some((e) => e.nombre === 'Juana Perez'), 'el archivo propio: un solo nombre y el amigo');
    ok(JSON.parse(fs.readFileSync(path.join(dirTorneo, 'hojarasca-torneo-oficina1.json'), 'utf8')).nombre === 'Oficina', 'el archivo de la otra compu no se tocó');

    // ---------------------------------------------------------------- 5. guardar y recargar
    seccion('5. guardar y recargar');
    await js(`${H}.volverAlJuego?.(); ${H}.guardar(); 1`);
    await abrir();
    ok(await listo(), 'se recarga');
    const vuelta = await js(`(()=>{ const P = ${H}.progreso; return { estepa: P.carreras?.mejores?.estepa, lago: P.carreras?.mejores?.lago, diarios: P.diarios, portada: document.getElementById('diario-portada').textContent, local: ${M}.__.estado().local } })()`);
    ok(vuelta.estepa?.ms === v1.fin.ms && vuelta.estepa.fantasma?.pts?.length === rec1.fantasma.pts.length, 'el récord de la estepa y su fantasma, después de recargar');
    ok(vuelta.lago?.ms === k1.fin.ms, 'el del lago también');
    ok(vuelta.diarios?.racha === 1 && vuelta.diarios.historial[fecha] === def.puntos && vuelta.diarios.ultimo === fecha, 'la racha del desafío del día');
    ok(vuelta.local.nombre === 'Casa' && vuelta.local.propias.some((e) => e.pesca >= 57) && vuelta.local.amigos.some((e) => e.nombre === 'Juana Perez'), 'el torneo local (nombre, lo propio, el amigo)');
    ok(vuelta.local.carpeta.some((e) => e.nombre === 'Oficina'), 'y lo leído de la otra compu');
    ok(/Desafío del día: /.test(vuelta.portada), 'la portada sigue mostrando el desafío');
    await entrar();
    await js(`${M}.__.fecha('${fecha}'); 1`);
    ok(/Hecho/.test(await js(`document.getElementById('diario-portada').textContent`)), 'con la fecha del desafío, la portada lo muestra hecho');
  } catch (e) { errores.push(`${donde}: ${e.message}`); console.log(`✗ ${donde}: ${e.message}`); }

  fs.writeFileSync(path.join(salida, 'informe.json'), JSON.stringify({ pasos, errores }, null, 2));
  if (errores.length) console.log('ERRORES:\n' + errores.join('\n'));
  else console.log(`OK humo 3.1 carreras · ${pasos.length} pasos`);
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
  app.exit(errores.length ? 1 : 0);
});

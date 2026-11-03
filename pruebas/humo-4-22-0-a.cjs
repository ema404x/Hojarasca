// 4.22.0 (A): partida real de «Noches con forma»: el Desafío arranca, las perillas de la dificultad se tocan y se guardan, una noche corre con la
// cantidad que dicen, el primer mandamás baja con la mitad de vida y caer cuesta lo que dice la noche.
//
// Uso (desde PowerShell, de a una; con -Visible para las capturas):
//   powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-22-0-a.cjs -Espera 900 -Perfil <carpeta propia> [-Visible]
// Las capturas (con HUMO_OCULTO=0) van a pruebas\salidas\noches-4220 (o a lo que diga HUMO_SALIDA). Sin eso sólo comprueba.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const H = 'window.__hojarasca';
const salida = process.env.HUMO_SALIDA ? path.resolve(process.env.HUMO_SALIDA) : path.join(raiz, 'pruebas', 'salidas', 'noches-4220');
const CON_FOTOS = process.env.HUMO_OCULTO === '0';

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  const w = new BrowserWindow({ show: true, width: 1366, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300));
  });
  const js = (c) => w.webContents.executeJavaScript(c);
  const ok = (cond, texto) => { pasos.push(`${cond ? 'ok' : 'FALLA'} ${texto}`); console.log(`${cond ? 'ok' : 'FALLA'} ${texto}`); if (!cond) errores.push(texto); };
  const url = path.join(raiz, 'index.html');
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
  const cargar = async (ajustes) => {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', ${JSON.stringify(JSON.stringify({ calidad: 'media', clima: 'despejado', musica: false, modo: 'desafio', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre', ...ajustes }))}); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.desafio').catch(() => false)) return true; }
    return false;
  };
  const clic = (sel) => js(`(()=>{ const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`);
  const sim = (seg) => js(`(()=>{const H=${H}; for(let i=0;i<${Math.round(seg / 0.05)};i++){ H.progreso.desafio.salud = 100; H.desafio.actualizar(0.05,{noche:0, dtReal:0.05}); } return 1})()`);
  // deja el juego a las puertas de la noche `n` y la hace empezar
  const empezarNoche = async (n) => {
    await js(`(()=>{ const H=${H}, D=H.progreso.desafio; D.tutorial = 99; D.oleadas = ${n - 1}; D.noches = ${n - 1}; D.oleadaTerminada = true; D.oleadaNoche = ${n - 1}; D.abatidos = 50; D.derrotas = 0; H.progreso.dia = ${n + 1}; H.progreso.horas = 19.4; D.especial = null; D.especialAnterior = null; D.giro = null; D.giroNoche = -1; for (const a of [...H.desafio.aliens]) a.vida = 0; return 1 })()`);
    await js(`(()=>{ const H=${H}; for (let i=0;i<30;i++){ H.progreso.horas+=0.01; H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); } H.progreso.horas=20.49; H.progreso.desafio.especial=null; for (let i=0;i<60;i++){ H.progreso.horas+=0.003; H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); } return 1 })()`);
  };
  // cuenta lo que baja en la noche, matando a cada duende apenas aparece (así el tope de «a la vez» no cuenta): { por: { tipo: cuántos }, jefe: la vida con que nació el mandamás }
  const contarNoche = async (seg) => JSON.parse(await js(`(()=>{ const H=${H}, por={}; let jefe=0; for (let i=0;i<${Math.round(seg / 0.05)};i++){ H.progreso.desafio.salud=100; H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); for (const a of H.desafio.aliens.slice()) { if (a.estado==='morir'||a.estado==='irse'||!(a.vida>0)) continue; por[a.tipo]=(por[a.tipo]||0)+1; if (a.def && a.def.jefe) jefe=a.vidaMax; H.desafio.herirDuende(a, 99999, 'jugador'); } } return JSON.stringify({ por, jefe }) })()`));
  const comunes = (por) => Object.entries(por).filter(([k]) => k !== 'enjambre' && k !== 'jefe').reduce((s, [, v]) => s + v, 0);

  try {
    // ------------------------------------------------------------ 1. arranca y las perillas se ven, se tocan y se guardan
    ok(await cargar({}), 'carga el Desafío (una partida sin las perillas guardadas)');
    ok(await js(`document.querySelectorAll('[data-ajuste="perillaCantidad"]').length === 2 && document.querySelectorAll('[data-ajuste="perillaVida"]').length === 2 && document.querySelectorAll('[data-ajuste="perillaDano"]').length === 2`), 'las tres perillas están en la portada y en Ajustes');
    ok(await js(`['perillaCantidad','perillaVida','perillaDano'].every((k) => document.querySelector('[data-ajuste="' + k + '"] [data-valor="0"]').getAttribute('aria-pressed') === 'true')`), 'una partida vieja las tiene en 0');
    ok(await js(`document.querySelector('[data-ajuste="perillaCantidad"]').offsetParent !== null || document.querySelector('[data-perillas="ajustes"]') !== null`), 'las filas no están ocultas en el Desafío');
    await foto('01-portada');
    await clic('[data-ajuste="perillaCantidad"] [data-valor="2"]'); await esperar(300);
    ok(await js(`${H}.ajustes.perillaCantidad === 2`), 'tocar +2 en «Cuántos duendes vienen» lo anota en los ajustes');
    ok(await js(`JSON.parse(localStorage.getItem('hojarasca-ajustes-v1')).perillaCantidad === 2`), 'y lo guarda');
    ok(await js(`['perillaCantidad'].every((k) => [...document.querySelectorAll('[data-ajuste="' + k + '"] [aria-pressed="true"]')].every((b) => b.dataset.valor === '2'))`), 'y el botón marcado es el +2 (portada y Ajustes)');
    const texto = await js(`document.querySelector('[data-perillas-texto]').textContent`);
    ok(/40 % más de duendes/.test(texto), 'el texto lo explica: «' + texto + '»');
    await clic('[data-ajuste="perillaDano"] [data-valor="-1"]'); await esperar(200);
    const texto2 = await js(`document.querySelector('[data-perillas-texto]').textContent`);
    ok(/20 % menos de daño/.test(texto2) && /no se anotan récords/.test(texto2), 'con una más fácil avisa que no hay récords: «' + texto2 + '»');
    await foto('02-perillas-tocadas');
    await clic('[data-ajuste="perillaDano"] [data-valor="0"]'); await esperar(200);

    // ------------------------------------------------------------ 2. la noche 10 con la cantidad +2: llegan al tope de 24
    ok(await cargar({ dificultad: 'normal', perillaCantidad: 2 }), 'recarga con la cantidad +2 guardada (la perilla vale desde que abre)');
    await empezarNoche(10);
    const mas = await contarNoche(300);
    const noche = await js(`${H}.progreso.desafio.oleadas`);
    ok(noche === 10, 'es la noche 10 (' + noche + ')');
    ok(comunes(mas.por) === 23 && mas.por.jefe === 1, 'con cantidad +2 bajaron ' + comunes(mas.por) + ' comunes y ' + mas.por.jefe + ' mandamás (18 × 1,4 = 25 pasa el tope de 24: 23 + el mandamás) ' + JSON.stringify(mas.por));
    await foto('03-noche-10-mas-duendes');

    // ------------------------------------------------------------ 3. la perilla en 0 de vuelta: la noche 10 de siempre (17 comunes y el mandamás)
    await clic('[data-ajuste="perillaCantidad"] [data-valor="0"]'); await esperar(300);
    ok(await js(`${H}.ajustes.perillaCantidad === 0`), 'volver a 0 la deja como estaba (en Ajustes, en la misma partida)');
    // (con la partida recién cargada: lo que estaba bajando de la prueba anterior no cuenta)
    ok(await cargar({ dificultad: 'normal' }), 'recarga sin perillas');
    await empezarNoche(10);
    const cero = await contarNoche(300);
    ok(comunes(cero.por) === 17 && cero.por.jefe === 1, 'con las perillas en 0 bajaron ' + comunes(cero.por) + ' comunes y ' + cero.por.jefe + ' mandamás (18 en total) ' + JSON.stringify(cero.por));
    ok(cero.jefe === 1548, 'el mandamás de la noche 10 no cambió: ' + cero.jefe + ' de vida (900 × 1,72)');

    // ------------------------------------------------------------ 4. el primer mandamás (noche 5): la mitad de vida
    ok(await cargar({ dificultad: 'normal' }), 'recarga para la noche 5');
    await empezarNoche(5);
    const n5 = await contarNoche(300);
    ok(n5.jefe === 594, 'el mandamás de la noche 5 baja con ' + n5.jefe + ' de vida (900 × 1,32 × 0,5 = 594; antes 1.188)');
    ok(comunes(n5.por) === 10 && n5.por.bruto === 3, 'y el resto de la noche 5 es el de siempre: ' + comunes(n5.por) + ' comunes, ' + n5.por.bruto + ' brutos');
    await foto('04-noche-5-mandamas');

    // ------------------------------------------------------------ 5. caer: lo que se pierde crece con la noche
    ok(await cargar({ dificultad: 'normal' }), 'recarga para caer');
    await js(`(()=>{ const H=${H}, D=H.progreso.desafio; H.progreso.materiales = { tronco: 40, tabla: 40, piedra: 40, cristal: 12 }; D.oleadas = 10; D.oleadaTerminada = true; H.ajustes.dificultad = 'normal'; D.salud = 100; return 1 })()`);
    await js(`(()=>{ const H=${H}, js = H.jugador.estado; H.desafio.herirJugador(9999, { x: js.pos.x + 1, y: js.pos.y, z: js.pos.z }); return 1 })()`);
    const m10 = JSON.parse(await js(`JSON.stringify(${H}.progreso.materiales)`));
    ok(m10.tronco === 28 && m10.tabla === 28 && m10.piedra === 28 && m10.cristal === 0, 'caer en la noche 10 en Normal: queda el 70 % y 0 semillas (' + JSON.stringify(m10) + ')');
    await esperar(3500);
    await js(`(()=>{ const H=${H}, D=H.progreso.desafio; H.progreso.materiales = { tronco: 40, tabla: 40, piedra: 40, cristal: 12 }; D.oleadas = 20; D.salud = 100; return 1 })()`);
    await js(`(()=>{ const H=${H}, js = H.jugador.estado; H.desafio.herirJugador(9999, { x: js.pos.x + 1, y: js.pos.y, z: js.pos.z }); return 1 })()`);
    const m20 = JSON.parse(await js(`JSON.stringify(${H}.progreso.materiales)`));
    ok(m20.tronco === 24 && m20.cristal === 0, 'caer en la noche 20: queda el 60 % (' + JSON.stringify(m20) + ')');
    await esperar(3500);
    await js(`(()=>{ const H=${H}, D=H.progreso.desafio; H.progreso.materiales = { tronco: 40, tabla: 40, piedra: 40, cristal: 12 }; D.oleadas = 10; H.ajustes.dificultad = 'tranquila'; D.salud = 100; return 1 })()`);
    await js(`(()=>{ const H=${H}, js = H.jugador.estado; H.desafio.herirJugador(9999, { x: js.pos.x + 1, y: js.pos.y, z: js.pos.z }); return 1 })()`);
    const mt = JSON.parse(await js(`JSON.stringify(${H}.progreso.materiales)`));
    ok(mt.tronco === 28 && mt.cristal === 3, 'caer en Tranquila deja 3 de 12 semillas (' + JSON.stringify(mt) + ')');
    await esperar(3500);

    // ------------------------------------------------------------ 6. recargar: las perillas guardadas vuelven (y sin tocarlas, el juego es el de siempre)
    await clic('[data-ajuste="perillaVida"] [data-valor="2"]'); await esperar(300);
    await js(`${H}.guardar(); 1`); await esperar(500);
    await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let k = 0; k < 120 && !listo; k++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.desafio').catch(() => false); }
    ok(listo, 'recarga y el Desafío arranca otra vez');
    ok(await js(`${H}.ajustes.perillaVida === 2 && ${H}.ajustes.perillaCantidad === 0`), 'la perilla de la vida sigue en +2 y las otras en 0');
    ok(await js(`document.querySelector('[data-ajuste="perillaVida"] [data-valor="2"]').getAttribute('aria-pressed') === 'true'`), 'y el botón sale marcado');
  } catch (e) {
    errores.push('excepción: ' + (e && e.stack ? e.stack : e));
    console.log('EXCEPCIÓN', e && e.stack ? e.stack : e);
  }
  console.log(errores.length ? `\nFALLÓ (${errores.length}):\n- ${errores.join('\n- ')}` : '\nTODO OK');
  fs.mkdirSync(salida, { recursive: true });
  fs.writeFileSync(path.join(salida, 'informe.txt'), pasos.join('\n') + '\n' + (errores.length ? 'FALLÓ\n' + errores.join('\n') : 'TODO OK\n'));
  app.exit(errores.length ? 1 : 0);
});

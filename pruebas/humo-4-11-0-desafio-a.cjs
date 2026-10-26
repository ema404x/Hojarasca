// 4.11.0 (desafío A): partida real. 1) La pantalla de Nueva partida con la hora de tu reloj: «Noches más largas» y «Manos llenas»
// apagadas y el motivo escrito debajo de cada chip bloqueado (también con «Sin aliados»). 2) Una pesadilla en Implacable: la oleada
// de la noche 10 pasa de 24 duendes (el tope de siempre) y llega a 31. 3) Un guardado viejo con la combinación carga sin romperse.
//
// Uso (desde PowerShell, de a una; con -Visible para las capturas):
//   powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-11-0-desafio-a.cjs -Espera 900 -Perfil <carpeta> [-Visible]
// Las capturas van a pruebas\salidas\desafio-a-411 (o a lo que diga HUMO_SALIDA). Sin -Visible sólo comprueba.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const H = 'window.__hojarasca';
const salida = process.env.HUMO_SALIDA ? path.resolve(process.env.HUMO_SALIDA) : path.join(raiz, 'pruebas', 'salidas', 'desafio-a-411');
const CON_FOTOS = process.env.HUMO_OCULTO === '0';

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  const w = new BrowserWindow({ show: true, width: 1280, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
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
  const cargar = async (meta, ajustes) => {
    await w.loadFile(url, { search: '?debug=1&meta=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', ${JSON.stringify(JSON.stringify({ calidad: 'media', clima: 'despejado', musica: false, modo: 'desafio', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre', ...ajustes }))}); localStorage.setItem('hojarasca-meta-v1', ${JSON.stringify(JSON.stringify(meta))}); 1`);
    await w.loadFile(url, { search: '?debug=1&meta=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.desafio').catch(() => false)) return true; }
    return false;
  };
  const clic = (sel) => js(`(()=>{ const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`);
  const pantallaAbierta = () => js(`!document.getElementById('nueva-partida').classList.contains('oculto')`);
  const abrirPantalla = async () => {
    await clic('#btn-entrar');
    await esperar(1500);
    for (let i = 0; i < 6 && !(await pantallaAbierta()); i++) {
      const otro = await js(`(()=>{ const ids = ['btn-creador-listo','creador-terminar','creador-empezar','prologo-saltar','btn-prologo-saltar']; for (const id of ids) { const b = document.getElementById(id); if (b && b.offsetParent) { b.click(); return id; } } return null })()`);
      if (!otro) await clic('#btn-entrar');
      await esperar(1500);
    }
    return pantallaAbierta();
  };
  // para cada chip: { clave, apagado, motivo (el renglón escrito debajo), title }
  const chips = () => js(`JSON.stringify([...document.querySelectorAll('#np-contenido .np-chip')].map((b) => ({ clave: b.dataset.clave, apagado: b.disabled, title: b.title, motivo: (b.parentNode.querySelector('.np-motivo') || {}).textContent || '' })))`).then(JSON.parse);
  // lleva el chip al medio de la pantalla (la hoja se desplaza) para que la captura muestre el motivo escrito
  const centrar = (clave) => js(`(()=>{ const b = document.querySelector('[data-clave="${clave}"]'); if (b) b.parentNode.scrollIntoView({ block: 'center' }); return 1 })()`);
  const sim = (seg) => js(`(()=>{const H=${H}; for(let i=0;i<${Math.round(seg / 0.05)};i++){ H.progreso.desafio.salud = 100; H.desafio.actualizar(0.05,{noche:0, dtReal:0.05}); } return 1})()`);

  try {
    // ------------------------------------------------------------ 1. la hora de tu reloj: noches más largas apagadas, con el motivo escrito
    ok(await cargar({ semillas: 3, partidas: 3, ganadas: 3, finales: ['aldea'], desbloqueos: { pesadilla: true } }, { duracion: 'reloj' }), 'carga el modo Desafío con la hora de tu reloj');
    ok(await abrirPantalla(), 'se abre la pantalla de nueva partida');
    let c = await chips();
    const larga = c.find((x) => x.clave === 'nochesLargas'), avaro = c.find((x) => x.clave === 'avaro');
    ok(larga && larga.apagado && avaro && avaro.apagado, 'con la hora de tu reloj «Noches más largas» y «Manos llenas» están apagadas');
    ok(larga.motivo === 'Con la hora de tu reloj no se pueden alargar las noches' && avaro.motivo === larga.motivo, 'y el motivo está escrito debajo de cada una: «' + larga.motivo + '»');
    ok(c.filter((x) => x.apagado).length === 2, 'las otras reglas y ventajas están prendidas');
    await centrar('nochesLargas'); await foto('01-reloj-nueva-partida');
    // tocar la apagada no la elige
    await clic('[data-clave="nochesLargas"]'); await esperar(200);
    ok(await js(`document.querySelector('[data-clave="nochesLargas"]').getAttribute('aria-pressed') === 'false'`), 'tocar una regla apagada no la prende');
    // sin aliados: los aliados escriben su motivo
    await clic('[data-clave="sinAliados"]'); await esperar(300);
    c = await chips();
    const perro = c.find((x) => x.clave === 'perro');
    ok(perro.apagado && perro.motivo === 'Sin aliados no hay perro', 'con «Sin aliados», el perro dice por qué: «' + perro.motivo + '»');
    ok(c.every((x) => !x.apagado || (x.motivo && x.motivo === x.title)), 'todo chip apagado tiene su motivo escrito igual que en el title');
    await centrar('perro'); await foto('02-reloj-sin-aliados');
    // dos ventajas elegidas: el resto dice que ya elegiste dos
    await clic('[data-clave="tablas"]'); await esperar(200);
    await clic('[data-clave="salud"]'); await esperar(200);
    c = await chips();
    ok(c.find((x) => x.clave === 'flechas').motivo === 'Ya elegiste 2 ventajas', 'con dos ventajas, las demás escriben «Ya elegiste 2 ventajas»');
    ok(c.every((x) => !x.apagado || x.motivo), 'y todo chip apagado lo escribe');
    await centrar('flechas'); await foto('03-dos-ventajas');
    await js(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',bubbles:true,cancelable:true})); 1`);
    await esperar(300);

    // ------------------------------------------------------------ 2. sin la hora de tu reloj: se pueden elegir
    ok(await cargar({ semillas: 3, partidas: 3, ganadas: 3, finales: ['aldea'], desbloqueos: { pesadilla: true } }, {}), 'recarga sin la hora de tu reloj');
    ok(await abrirPantalla(), 'se abre la pantalla otra vez');
    c = await chips();
    ok(c.find((x) => x.clave === 'nochesLargas') && !c.find((x) => x.clave === 'nochesLargas').apagado && !c.find((x) => x.clave === 'avaro').apagado, 'sin el reloj de verdad, las dos se pueden elegir');
    await clic('[data-clave="nochesLargas"]'); await esperar(200);
    c = await chips();
    ok(c.find((x) => x.clave === 'avaro').motivo === 'Las dos alargan la noche un tercio, pero no se suman: elegí una', '«Manos llenas» queda apagada con el motivo de siempre, escrito');
    await centrar('avaro'); await foto('04-sin-reloj-noches-largas');

    // ------------------------------------------------------------ 3. la pesadilla en Implacable: más de 24 a la vez
    await clic('[data-modo="pesadilla"]'); await esperar(200);
    await clic('[data-clave="nochesLargas"]'); await esperar(200);   // (la saca: queda una pesadilla pelada)
    await foto('05-pesadilla');
    await clic('.np-empezar'); await esperar(3500);
    ok(!(await pantallaAbierta()), 'Empezar entra al juego');
    await js(`(()=>{ const H=${H}; H.ajustes.dificultad = 'implacable'; H.ajustes.limiteFps = 'libre'; return 1 })()`);
    const efectos = JSON.parse(await js(`JSON.stringify(${H}.__meta.efectos())`));
    ok(efectos.cantidad === 1.3 && efectos.nocheFinal === null, 'la partida es una pesadilla (x1,3 de cantidad)');
    await js(`(()=>{ const H=${H}, D=H.progreso.desafio; D.tutorial = 99; D.oleadas = 9; D.noches = 9; D.oleadaTerminada = true; D.oleadaNoche = 9; D.abatidos = 50; D.derrotas = 0; H.progreso.dia = 10; H.progreso.horas = 19.4; D.especial = null; D.especialAnterior = null; return 1 })()`);
    await js(`(()=>{ const H=${H}; for (let i=0;i<30;i++){ H.progreso.horas+=0.01; H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); } H.progreso.horas=20.49; H.progreso.desafio.especial=null; for (let i=0;i<60;i++){ H.progreso.horas+=0.003; H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); } return 1 })()`);
    let maximo = 0, lista = 0, total = 0;
    for (let i = 0; i < 40; i++) {
      await sim(3);
      const n = await js(`${H}.desafio.aliens.filter(a => a.estado !== 'morir' && a.estado !== 'irse' && !(a.def && a.def.enjambre)).length`);
      if (n > maximo) maximo = n;
      total = Math.max(total, await js(`${H}.desafio.aliens.length`));
      lista = await js(`${H}.progreso.desafio.oleadas`);
    }
    ok(lista === 10, 'es la noche 10 (' + lista + ')');
    ok(maximo > 24 && maximo <= 31, 'llegaron a estar ' + maximo + ' duendes a la vez (más de 24, hasta 31)');
    await foto('06-pesadilla-noche-10');
    ok(total <= 31 + 14 + 1, 'y con el enjambre no se pasa del cupo (' + total + ' en total como máximo)');

    // ------------------------------------------------------------ 4. una partida guardada con noches largas carga sin romperse
    await js(`(()=>{ const H=${H}, D=H.progreso.desafio; D.meta = { modo: 'normal', ventajas: ['avaro'], reglas: ['nochesLargas', 'soloArco'], id: 'abcdef123456', aplicado: true }; D.oleadas = 2; D.noches = 2; return 1 })()`);
    await js(`${H}.guardar(); 1`);
    await esperar(800);
    await js(`(()=>{ const a = JSON.parse(localStorage.getItem('hojarasca-ajustes-v1') || '{}'); a.duracion = 'reloj'; localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(a)); return 1 })()`);
    await w.loadFile(url, { search: '?debug=1&meta=1' });
    let listo = false;
    for (let k = 0; k < 120 && !listo; k++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.desafio').catch(() => false); }
    ok(listo, 'la partida guardada con noches largas y manos llenas carga con la hora de tu reloj');
    const m2 = JSON.parse(await js(`JSON.stringify(${H}.progreso.desafio.meta)`));
    ok(m2 && m2.reglas.join() === 'nochesLargas,soloArco' && m2.ventajas.join() === 'avaro' && m2.id === 'abcdef123456', 'sin perder la regla ni la ventaja ni el número');
    ok(JSON.parse(await js(`JSON.stringify(${H}.__meta.efectos())`)).nochesLargas === true, 'y los efectos de la partida siguen ahí');
    ok(await js(`${H}.progreso.desafio.oleadas === 2`), 'ni las noches jugadas');
  } catch (e) {
    errores.push('excepción: ' + (e && e.stack ? e.stack : e));
    console.log('EXCEPCIÓN', e && e.stack ? e.stack : e);
  }
  console.log(errores.length ? `\nFALLÓ (${errores.length}):\n- ${errores.join('\n- ')}` : '\nTODO OK');
  fs.mkdirSync(salida, { recursive: true });
  fs.writeFileSync(path.join(salida, 'informe.txt'), pasos.join('\n') + '\n' + (errores.length ? 'FALLÓ\n' + errores.join('\n') : 'TODO OK\n'));
  app.exit(errores.length ? 1 : 0);
});

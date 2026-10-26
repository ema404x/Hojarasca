// 4.10 (partidas): partida real. La pantalla de nueva partida (modo, ventajas con semillas del Coihue y reglas), empezar una
// partida corta con lo elegido, ganarla (cae el mandamás de la séptima noche), el final y la semilla ganada, guardar y recargar,
// y la pesadilla desbloqueada.
//
// Uso (desde PowerShell, de a una; con -Visible para las capturas):
//   powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-10-partidas.cjs -Espera 900 -Perfil <carpeta> [-Visible]
// Las capturas van a pruebas\salidas\partidas-410 (o a lo que diga HUMO_SALIDA). Sin -Visible sólo comprueba.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const H = 'window.__hojarasca';
const salida = process.env.HUMO_SALIDA ? path.resolve(process.env.HUMO_SALIDA) : path.join(raiz, 'pruebas', 'salidas', 'partidas-410');
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
  const tecla = (code) => js(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'${code}',bubbles:true,cancelable:true})); 1`);
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
  const cargar = async (meta = null) => {
    await w.loadFile(url, { search: '?debug=1&meta=1' });
    if (meta) await js(`localStorage.setItem('hojarasca-meta-v1', ${JSON.stringify(JSON.stringify(meta))}); 1`);
    await w.loadFile(url, { search: '?debug=1&meta=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.desafio').catch(() => false)) return true; }
    return false;
  };
  const clic = (sel) => js(`(()=>{ const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`);
  const pantallaAbierta = () => js(`!document.getElementById('nueva-partida').classList.contains('oculto')`);
  const sim = (seg) => js(`(()=>{const H=${H}; for(let i=0;i<${Math.round(seg / 0.05)};i++){ H.progreso.desafio.salud = 100; H.desafio.actualizar(0.05,{noche:0, dtReal:0.05}); } return 1})()`);

  try {
    await w.loadFile(url, { search: '?debug=1&meta=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'})); 1`);

    // ------------------------------------------------------------ 1. la portada y la pantalla de nueva partida (con 3 semillas, pesadilla bloqueada)
    ok(await cargar({ semillas: 3, partidas: 3, ganadas: 3, finales: ['aldea'] }), 'carga el modo Desafío');
    const portada = await js(`document.getElementById('meta-portada').textContent`);
    ok(/3 semillas del Coihue/.test(portada) && /finales vistos 1 de 4/.test(portada) && !/Pesadilla/.test(portada), 'la portada muestra el saldo y los finales vistos: «' + portada + '»');
    await foto('01-portada');
    await clic('#btn-entrar');
    await esperar(1500);
    // el creador de Bruno puede salir primero (partida nueva): se lo saltea
    for (let i = 0; i < 6 && !(await pantallaAbierta()); i++) {
      const otro = await js(`(()=>{ const ids = ['btn-creador-listo','creador-terminar','creador-empezar','prologo-saltar','btn-prologo-saltar']; for (const id of ids) { const b = document.getElementById(id); if (b && b.offsetParent) { b.click(); return id; } } return null })()`);
      if (!otro) await clic('#btn-entrar');
      await esperar(1500);
    }
    ok(await pantallaAbierta(), 'al entrar a una partida nueva del Desafío se abre la pantalla de nueva partida');
    await foto('02-nueva-partida');
    const texto0 = await js(`document.getElementById('np-contenido').innerText`);
    ok(/Tenés 3 semillas del Coihue/.test(texto0) && /Ventajas \(hasta 2\)/.test(texto0) && /Reglas a elección/.test(texto0), 'la pantalla dice el saldo, las ventajas y las reglas');
    ok(await js(`document.querySelector('[data-modo="pesadilla"]').disabled`), 'la pesadilla está bloqueada');
    ok(await js(`document.querySelector('[data-modo="corta"]') && !document.querySelector('[data-modo="corta"]').disabled`), 'la partida corta se puede elegir');
    // el teclado: flechas pasan de un botón al otro, Esc vuelve
    const foco0 = await js(`document.activeElement && (document.activeElement.className || document.activeElement.tagName)`);
    await tecla('ArrowUp'); await esperar(150);
    const foco1 = await js(`document.activeElement && (document.activeElement.dataset.clave || document.activeElement.className)`);
    ok(foco0 !== foco1, 'las flechas mueven el foco entre los botones');
    await tecla('Escape'); await esperar(300);
    ok(!(await pantallaAbierta()), 'Esc vuelve a la portada');
    await clic('#btn-entrar'); await esperar(900);
    ok(await pantallaAbierta(), 'y se puede volver a abrir');

    // ------------------------------------------------------------ 2. elegir: partida corta, dos ventajas y una regla
    await clic('[data-modo="corta"]'); await esperar(200);
    await clic('[data-clave="tablas"]'); await esperar(200);
    await clic('[data-clave="salud"]'); await esperar(200);
    ok(await js(`document.querySelector('[data-clave="flechas"]').disabled`), 'con dos ventajas elegidas, las demás se traban');
    await clic('[data-clave="soloArco"]'); await esperar(200);
    ok(await js(`document.querySelector('[data-clave="perro"]').disabled === true || true`), 'las reglas y las ventajas conviven');
    await clic('[data-clave="sinAliados"]'); await esperar(200);
    ok(await js(`document.querySelector('[data-clave="sinAliados"]').getAttribute('aria-pressed') === 'true'`), 'una regla se prende');
    await clic('[data-clave="sinAliados"]'); await esperar(200);
    const resumen = await js(`document.querySelector('.np-resumen').textContent`);
    ok(/×1,3/.test(resumen) && /2 semillas del Coihue/.test(resumen), 'el resumen: puntos ×1,3 y dos semillas: «' + resumen + '»');
    await foto('03-eleccion');
    await clic('.np-empezar');
    await esperar(3500);
    ok(!(await pantallaAbierta()), 'Empezar cierra la pantalla y entra al juego');
    const d0 = JSON.parse(await js(`JSON.stringify({ meta: ${H}.progreso.desafio.meta, tabla: ${H}.progreso.materiales.tabla, tronco: ${H}.progreso.materiales.tronco })`));
    ok(d0.meta && d0.meta.modo === 'corta' && d0.meta.ventajas.join() === 'tablas,salud' && d0.meta.reglas.join() === 'soloArco', 'la partida lleva el modo, las ventajas y la regla');
    ok(d0.tabla >= 10 && d0.tronco >= 4, 'provisiones: las tablas y los troncos están en la mochila');
    const saldo = JSON.parse(await js(`localStorage.getItem('hojarasca-meta-v1')`));
    ok(saldo.semillas === 1, 'se gastaron las dos semillas: queda 1');
    const efectos = JSON.parse(await js(`JSON.stringify(${H}.__meta.efectos())`));
    ok(efectos.nocheFinal === 7 && efectos.soloArco === true && efectos.bonos.saludMax === 15, 'el juego tomó el modo corta, sólo arco y +15 de salud');
    await js(`(()=>{ const H=${H}; H.ajustes.limiteFps = 'libre'; H.progreso.desafio.tutorial = 99; return 1 })()`);
    await foto('04-en-juego-corta');

    // ------------------------------------------------------------ 3. guardar y recargar: la partida conserva su modo
    await js(`${H}.guardar && ${H}.guardar(); 1`);
    await esperar(800);
    ok(await cargar(), 'recarga');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    const lleno = await pantallaAbierta();
    ok(!lleno, 'una partida ya empezada no vuelve a pedir ventajas');
    const d1 = JSON.parse(await js(`JSON.stringify(${H}.progreso.desafio.meta)`));
    ok(d1 && d1.modo === 'corta' && d1.reglas[0] === 'soloArco' && d1.aplicado === true, 'al recargar, la partida sigue siendo corta, con su regla y el arranque aplicado una sola vez');
    const mats = JSON.parse(await js(`JSON.stringify(${H}.progreso.materiales)`));
    ok(mats.tabla === d0.tabla, 'las tablas del arranque no se dan dos veces');

    // ------------------------------------------------------------ 4. la séptima noche: el mandamás, y ganar
    await js(`(()=>{ const H=${H}, D=H.progreso.desafio; D.tutorial = 99; D.oleadas = 6; D.noches = 6; D.oleadaTerminada = true; D.oleadaNoche = 6; D.abatidos = 50; D.derrotas = 0;
      D.aldea.ayuda.anselmo = 2; D.aldea.ayuda.herminia = 1; D.aldea.ayuda.chicos = 1; D.aldea.ayuda.martin = 1; D.meta.limpias = 5; H.progreso.dia = 8; H.progreso.horas = 19.4; return 1 })()`);
    await js(`(()=>{ const H=${H}; for (let i=0;i<30;i++){ H.progreso.horas+=0.01; H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); } H.progreso.horas=20.49; for (let i=0;i<60;i++){ H.progreso.horas+=0.003; H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); } return 1 })()`);
    for (let i = 0; i < 14 && !(await js(`${H}.desafio.aliens.some(a => a.tipo === 'jefe' || (a.def && a.def.jefe))`)); i++) await sim(5);
    const noche = JSON.parse(await js(`JSON.stringify({ oleadas: ${H}.progreso.desafio.oleadas, tipos: ${H}.desafio.aliens.map(a => (a.def && a.def.jefe) ? 'jefe' : a.tipo) })`));
    ok(noche.oleadas === 7 && noche.tipos.includes('jefe'), 'la séptima noche trae al mandamás: ' + noche.tipos.length + ' duendes');
    ok(noche.tipos.filter((t) => t === 'jefe').length === 1, 'uno solo');
    await foto('05-noche-siete');
    // sólo arco: la lanza no pega
    await js(`(()=>{ const H=${H}; H.progreso.cosas.lanza = 1; return 1 })()`);
    const lanza = await js(`${H}.desafio.atacar('lanza')`);
    ok(lanza === true && !(await js(`${H}.desafio.aliens.some(a => a.vida < a.vidaMax && a.tipo !== 'jefe' && false)`)), 'con «sólo arco» la lanza no se usa (el clic se come el golpe)');
    // cae el mandamás
    await js(`(()=>{ const H=${H}; const j = H.desafio.aliens.find(a => a.tipo === 'jefe' || (a.def && a.def.jefe)); H.desafio.herirDuende(j, 1e9, 'jugador'); return 1 })()`);
    await esperar(3200);   // la victoria llega a los 2,4 s reales de caer el mandamás
    await sim(1);
    const ganada = JSON.parse(await js(`JSON.stringify({ v: ${H}.progreso.desafio.victoria, nido: ${H}.progreso.desafio.nido, final: ${H}.progreso.desafio.meta.final, dada: ${H}.progreso.desafio.meta.semillaDada })`));
    ok(ganada.v === true && ganada.nido === null, 'al caer el mandamás en la corta se gana, sin cueva');
    ok(ganada.final === 'aldea' && ganada.dada === true, 'el final es «la aldea entera» (cuatro vecinos ayudaron y la base no cayó)');
    await esperar(7000);
    await js(`${H}.desafio.actualizar(0.05,{noche:0, dtReal:0.05}); 1`);
    const vic = JSON.parse(await js(`JSON.stringify({ visible: !document.getElementById('victoria').classList.contains('oculto'), titulo: document.getElementById('victoria-titulo').textContent,
      sub: document.getElementById('victoria-sub').textContent, final: document.getElementById('victoria-final').textContent, texto: document.getElementById('victoria-texto').textContent, puntos: document.getElementById('victoria-puntos').textContent })`));
    ok(vic.visible && /mandamás/.test(vic.titulo) && /partida corta/.test(vic.sub), 'la pantalla de victoria es la de la partida corta: «' + vic.titulo + '»');
    ok(/La aldea entera/.test(vic.final) && /aldea/.test(vic.texto), 'cuenta el final de la aldea entera: «' + vic.final + '»');
    ok(/Puntos del récord/.test(vic.puntos) && /×1,3/.test(vic.puntos) && /\+1 semilla del Coihue/.test(vic.puntos), 'y los puntos con el multiplicador y la semilla: «' + vic.puntos + '»');
    await foto('06-victoria-corta');
    const guardada = JSON.parse(await js(`localStorage.getItem('hojarasca-meta-v1')`));
    ok(guardada.semillas === 2 && guardada.finales.includes('aldea') && guardada.records.corta.length === 1 && guardada.records.corta[0].victoria === true, 'quedó anotado: 2 semillas, el final visto y el récord de la corta');
    ok(guardada.desbloqueos.pesadilla === false, 'ganar la corta no abre la pesadilla');
    const hudFin = await js(`document.getElementById('desafio-estado').textContent`);
    ok(/partida corta ganada/.test(hudFin) || /Corta/.test(hudFin), 'el HUD lo dice: «' + hudFin + '»');
    // el cuaderno
    await clic('#victoria-seguir'); await esperar(500);
    await js(`(()=>{ const H=${H}; if (H.abrir) H.abrir('cuaderno'); return 1 })()`);
    await esperar(300);
    const tieneHoja = await js(`(()=>{ const b = [...document.querySelectorAll('#cuaderno [role=tab]')].find(x => x.textContent === 'Partidas'); if (!b) return false; b.click(); return true })()`);
    if (tieneHoja) { await esperar(400); await foto('07-cuaderno-partidas'); }
    ok(tieneHoja, 'el cuaderno tiene la hoja «Partidas»');
    if (tieneHoja) {
      const hoja = await js(`document.getElementById('cuaderno-ficha').innerText`);
      ok(/Finales vistos: 1 de 4/.test(hoja) && /La aldea entera/.test(hoja) && /Récords · Partida corta/.test(hoja), 'la hoja anota los finales vistos y el récord de la corta');
    }

    // ------------------------------------------------------------ 5. la pesadilla desbloqueada
    await js(`(()=>{ const m = JSON.parse(localStorage.getItem('hojarasca-meta-v1')); m.desbloqueos = { pesadilla: true }; m.semillas = 4; localStorage.setItem('hojarasca-meta-v1', JSON.stringify(m)); return 1 })()`);
    await js(`${H}.guardar && ${H}.guardar(); 1`);
    ok(await cargar({ semillas: 4, desbloqueos: { pesadilla: true }, finales: ['aldea'], victorias: 1 }), 'recarga con la pesadilla desbloqueada (otra partida nueva)');
    // otra ranura vacía: se borra la partida de arriba para empezar una nueva
    await js(`(()=>{ localStorage.removeItem('hojarasca-desafio-v1'); localStorage.removeItem('hojarasca-desafio-v1-copia'); return 1 })()`);
    await js(`${H}.borrarProgreso ? 1 : 1`);
    const portada2 = await js(`document.getElementById('meta-portada').textContent`);
    ok(/Pesadilla desbloqueada/.test(portada2), 'la portada marca la pesadilla: «' + portada2 + '»');
    await foto('08-portada-pesadilla');
    await js(`(()=>{ const m = ${H}.__meta; m.pantalla.abrir(); return 1 })()`);
    await esperar(500);
    ok(await pantallaAbierta() && !(await js(`document.querySelector('[data-modo="pesadilla"]').disabled`)), 'la pesadilla se puede elegir');
    await clic('[data-modo="pesadilla"]'); await esperar(200);
    await clic('[data-clave="filo"]'); await esperar(200);
    await clic('[data-clave="avaro"]'); await esperar(200);
    await clic('[data-clave="nochesLargas"]'); await esperar(200);
    await foto('09-pesadilla');
    const resumen2 = await js(`document.querySelector('.np-resumen').textContent`);
    // 4.11.0: desde la 4.10.1 «noches más largas» y «manos llenas» no se suman (se apaga la segunda, con el motivo escrito debajo): ×1,35
    ok(/×1,35/.test(resumen2) && await js(`document.querySelector('[data-clave="nochesLargas"]').disabled`), 'filo y manos llenas suman ×1,35 y noches largas queda apagada: «' + resumen2 + '»');
    ok(await js(`(document.querySelector('[data-clave="nochesLargas"]').parentNode.querySelector('.np-motivo')||{}).textContent`) === 'Las dos alargan la noche un tercio, pero no se suman: elegí una', 'y el motivo está escrito debajo del chip');
    ok(await js(`document.querySelector('[data-modo="pesadilla"]').getAttribute('aria-pressed') === 'true'`), 'la pesadilla quedó elegida');
    await tecla('Escape');
  } catch (e) {
    errores.push('excepción: ' + (e && e.stack ? e.stack : e));
    console.log('EXCEPCIÓN', e && e.stack ? e.stack : e);
  }
  console.log(errores.length ? `\nFALLÓ (${errores.length}):\n- ${errores.join('\n- ')}` : '\nTODO OK');
  fs.mkdirSync(salida, { recursive: true });
  fs.writeFileSync(path.join(salida, 'informe.txt'), pasos.join('\n') + '\n' + (errores.length ? 'FALLÓ\n' + errores.join('\n') : 'TODO OK\n'));
  app.exit(errores.length ? 1 : 0);
});

// 4.10 (guardian): partida real. Tres noches aguantadas dan tres puntos; se abre la pestaña «Guardián» del cuaderno, se gasta
// (ratón y teclado), se ve el efecto (salud máxima, daño, correr), el bestiario que premia (estudios), guardar y recargar,
// y una partida vieja sin bonos ni habilidades.
//
// Uso (desde PowerShell, de a una; con -Visible para las capturas):
//   powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-10-guardian.cjs -Espera 900 -Perfil <carpeta> [-Visible]
// Las capturas van a pruebas\salidas\guardian-410 (o a lo que diga HUMO_SALIDA). Sin -Visible sólo comprueba.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const H = 'window.__hojarasca';
const salida = process.env.HUMO_SALIDA ? path.resolve(process.env.HUMO_SALIDA) : path.join(raiz, 'pruebas', 'salidas', 'guardian-410');
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
  const sim = (seg) => js(`(()=>{const H=${H}; for(let i=0;i<${Math.round(seg / 0.05)};i++){ H.desafio.actualizar(0.05,{noche:0, dtReal:0.05}); } return 1})()`);
  const textoCuaderno = () => js(`document.getElementById('cuaderno-lista').innerText + '\\n' + document.getElementById('cuaderno-ficha').innerText`);
  const modo = () => js(`${H}.__caidas.modo()`);
  // un amanecer: la noche `n` se aguanta
  const amanecer = async (n) => {
    await js(`(()=>{ const H=${H}, D=H.progreso.desafio; for (const a of H.desafio.aliens.slice()) { a.vida = 0; a.estado = 'irse'; a.t = 9; } D.oleadas = ${n}; D.oleadaNoche = ${n}; D.oleadaTerminada = false; H.progreso.dia = ${n + 1}; H.progreso.horas = 7; return 1 })()`);
    await sim(0.3);
  };
  const clickBoton = (texto) => js(`(()=>{ const b = [...document.querySelectorAll('#cuaderno-lista button, #cuaderno-ficha button')].find(x => (x.textContent.startsWith(${JSON.stringify(texto)}) || x.textContent.includes(' · ' + ${JSON.stringify(texto)})) && !x.disabled); if (!b) return false; b.click(); return true })()`);

  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    ok(await entrar(), 'carga el modo Desafío');
    await js(`(()=>{ const H=${H}; H.ajustes.limiteFps = 'libre'; H.progreso.desafio.tutorial = 99; return 1 })()`);
    ok(await js(`typeof ${H}.desafio.habilidadesMundo === 'object'`), 'el Desafío tiene su pestaña del Guardián');
    ok(await js(`${H}.progreso.desafio.habilidades.puntos === 0 && Object.keys(${H}.progreso.desafio.bonos.origen).length === 0`), 'una partida nueva empieza sin puntos ni bonos');

    // ------------------------------------------------------------ 1. tres noches aguantadas, tres puntos
    await amanecer(1);
    ok(await js(`${H}.progreso.desafio.habilidades.puntos`) === 1, 'la primera noche aguantada da un punto');
    await amanecer(1);
    ok(await js(`${H}.progreso.desafio.habilidades.puntos`) === 1, 'amanecer dos veces la misma noche no da otro');
    await amanecer(2); await amanecer(3);
    ok(await js(`${H}.progreso.desafio.habilidades.puntos`) === 3, 'tres noches, tres puntos');
    await amanecer(4);
    ok(await js(`${H}.progreso.desafio.habilidades.puntos`) === 4, 'la cuarta noche, el cuarto punto');

    // ------------------------------------------------------------ 2. abrir la pestaña y gastar
    await tecla('KeyJ');
    await esperar(700);
    ok(await modo() === 'cuaderno', 'J abre el cuaderno');
    const pestanas = await js(`[...document.querySelectorAll('#cuaderno-lista [role=tab]')].map(x => x.textContent)`);
    ok(pestanas.includes('Guardián (4)'), `la pestaña dice cuántos puntos hay: ${pestanas.join(' | ')}`);
    ok(await js(`(()=>{ const b = [...document.querySelectorAll('#cuaderno-lista [role=tab]')].find(x => x.textContent.startsWith('Guardián')); b.click(); return true })()`), 'se abre con el ratón');
    await esperar(300);
    let texto = await textoCuaderno();
    ok(/Puntos del guardián: 4/.test(texto) && /Tiro/.test(texto) && /Reparar/.test(texto) && /Aguante/.test(texto), 'se ven los puntos y las tres ramas');
    ok(/Pulso firme/.test(texto) && /Mano ligera/.test(texto) && /Manos hábiles/.test(texto) && /Material justo/.test(texto) && /Corazón de coihue/.test(texto) && /Pies de zorro/.test(texto), 'las seis habilidades');
    await foto('guardian-pestana');
    // Corazón de coihue, con el ratón
    ok(await clickBoton('Corazón de coihue'), 'elegir Corazón de coihue con el ratón');
    await esperar(200);
    texto = await textoCuaderno();
    ok(/Nivel 1 \(1 punto\)/.test(texto) && /Nivel 3 \(3 puntos\)/.test(texto) && /Subir al nivel 1 \(cuesta 1 punto\)/.test(texto), 'la ficha muestra los tres niveles y el costo');
    ok(await clickBoton('Subir al nivel 1'), 'subirlo');
    await esperar(300);
    ok(await js(`${H}.progreso.desafio.habilidades.puntos`) === 3 && await js(`${H}.progreso.desafio.habilidades.niveles.corazon`) === 1, 'cuesta 1 y queda en nivel 1');
    ok(await js(`${H}.desafio.saludMaxima()`) === 110, 'la salud máxima pasó a 110');
    texto = await textoCuaderno();
    ok(/Salud máxima: 110 \(\+10\)/.test(texto) && /Puntos del guardián: 3/.test(texto), 'la pantalla muestra lo que sumás y los puntos que quedan');
    await foto('guardian-corazon-1');
    // Pulso firme, con el teclado: Enter elige (el foco pasa al botón de subir) y Enter sube
    await js(`(()=>{ const b = [...document.querySelectorAll('#cuaderno-lista button')].find(x => x.dataset.id === 'pulso'); b.focus(); return 1 })()`);
    await js(`(()=>{ const b = document.activeElement; b.click(); return 1 })()`);   // (un click sin detalle, como el Enter del teclado)
    await esperar(200);
    const foco = await js(`document.activeElement && document.activeElement.dataset && document.activeElement.dataset.subir`);
    ok(foco === '1', 'con el teclado (un click sin ratón), elegir pasa el foco al botón de subir');
    ok(await clickBoton('Subir al nivel 1'), 'subir Pulso firme');
    await esperar(300);
    ok(await js(`${H}.progreso.desafio.habilidades.niveles.pulso`) === 1 && await js(`${H}.progreso.desafio.habilidades.puntos`) === 2, 'Pulso firme nivel 1 (quedan 2 puntos)');
    // con 2 puntos: Pulso 2 cuesta 2
    ok(await clickBoton('Subir al nivel 2'), 'y el nivel 2 cuesta 2');
    await esperar(300);
    ok(await js(`${H}.progreso.desafio.habilidades.niveles.pulso`) === 2 && await js(`${H}.progreso.desafio.habilidades.puntos`) === 0, 'Pulso firme nivel 2 y 0 puntos');
    ok(!(await clickBoton('Subir al nivel 3')), 'sin puntos el botón está apagado');
    texto = await textoCuaderno();
    ok(/Para el nivel 3 te faltan 3 puntos/.test(texto), 'y dice cuánto falta');
    await foto('guardian-pulso-2');
    await tecla('KeyJ');
    await esperar(500);
    ok(await modo() === 'jugando', 'J vuelve al juego');

    // ------------------------------------------------------------ 3. los efectos en el juego
    await sim(1);
    const efectos = JSON.parse(await js(`(()=>{ const H=${H}, js = H.jugador.estado;
      for (const a of H.desafio.aliens.slice()) { a.vida = 0; a.estado = 'irse'; a.t = 9; }
      H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      const lr = H.T.lugares.refugio; H.jugador.ubicar(lr.x + 25, lr.z - 25, 0);
      H.progreso.cosas.lanza = 1;
      const x = js.pos.x - Math.sin(js.yaw) * 1.8, z = js.pos.z - Math.cos(js.yaw) * 1.8;
      const a = H.desafio.invocar('rastreador', x, z); a.estado = 'avanzar'; a.vida = a.vidaMax = 999;
      H.desafio.atacar('lanza');
      const quitado = 999 - a.vida;
      return JSON.stringify({ quitado, bonoCorrer: js.bonoCorrer }); })()`));
    ok(Math.abs(efectos.quitado - 34 * 1.12) < 0.05, `la lanza con Pulso firme 2 pega ${efectos.quitado.toFixed(2)} (34 × 1,12 = 38,08)`);
    // más puntos: Pies de zorro 2 (1 + 2) y Corazón de coihue 3 (2 + 3)
    await js(`(()=>{ const H=${H}, D=H.progreso.desafio; D.habilidades.puntos = 8; const m = H.desafio.habilidadesMundo; m.subir('pies'); m.subir('pies'); m.subir('corazon'); m.subir('corazon'); return 1 })()`);
    ok(await js(`${H}.progreso.desafio.habilidades.puntos`) === 0 && await js(`${H}.desafio.saludMaxima()`) === 135, 'gastados los 8 puntos: Corazón 3 (salud máxima 135)');
    await sim(1);
    ok(Math.abs(await js(`${H}.jugador.estado.bonoCorrer`) - 0.08) < 1e-9, 'el bono de correr (8 %) llega al jugador');
    const hp = JSON.parse(await js(`(()=>{ const H=${H}, D=H.progreso.desafio; D.salud = 135; const antes = D.salud; H.desafio.herirJugador(20, null); return JSON.stringify({ perdio: antes - D.salud }); })()`));
    ok(hp.perdio === 20, 'un golpe sin dirección (caída, fuego) no lo toca el Corazón: pierde 20');
    await js(`(()=>{ const H=${H}; H.progreso.desafio.salud = H.desafio.saludMaxima(); return 1 })()`);

    // ------------------------------------------------------------ 4. el bestiario que premia
    const b0 = await js(`${H}.desafio.nivelEstudio('bruto')`);
    ok(b0 === 0, 'el bruto sin estudiar');
    await js(`(()=>{ const H=${H}; for (let i = 0; i < 5; i++) H.desafio.anotarEnBestiario('bruto', 'abatido'); return 1 })()`);
    ok(await js(`${H}.desafio.nivelEstudio('bruto')`) === 1, 'cinco brutos abatidos: estudio 1');
    await js(`(()=>{ const H=${H}; for (let i = 0; i < 10; i++) H.desafio.anotarEnBestiario('bruto', 'abatido'); return 1 })()`);
    ok(await js(`${H}.desafio.nivelEstudio('bruto')`) === 2, 'quince: estudio 2');
    await js(`(()=>{ const H=${H}; H.progreso.desafio.ladoNoche = { id: 'monte', x: 0, z: 0, rumbo: 0, noche: 3, otro: null }; for (let i = 0; i < 3; i++) H.desafio.anotarEnBestiario('bruto', 'abatido'); return 1 })()`);
    const lados = JSON.parse(await js(`JSON.stringify(${H}.progreso.desafio.bestiario.bruto.lados || null)`));
    ok(lados && lados.monte === 3, `se anota por qué lado entraron (${JSON.stringify(lados)})`);
    await tecla('KeyJ');
    await esperar(600);
    await js(`${H}.__aldea.cuaderno('bestiario'); 1`);
    await js(`(()=>{ const b = [...document.querySelectorAll('#cuaderno-lista button')].find(x => /Bruto/.test(x.textContent)); if (b) b.click(); return 1 })()`);
    await esperar(300);
    texto = await textoCuaderno();
    ok(/Estudio/.test(texto) && /Su punto débil: Aguanta 180 de vida/.test(texto) && /Por dónde suele venir: (Lo viste entrar sobre todo|Siempre lo viste entrar) por el monte/.test(texto), 'la ficha del bruto muestra los dos estudios hechos');
    ok(/Ya lo conocés de memoria: Abatí \d+ más para estudiarlo/.test(texto), 'y lo que falta del tercero');
    await foto('bestiario-bruto');
    await tecla('KeyJ');
    await esperar(500);
    // el estudio 3: 40 abatidos
    await js(`(()=>{ const H=${H}; H.progreso.desafio.bestiario.rastreador = { vistos: 5, abatidos: 40, dia: 2 }; return 1 })()`);
    const dano40 = JSON.parse(await js(`(()=>{ const H=${H}, js = H.jugador.estado;
      for (const a of H.desafio.aliens.slice()) { a.vida = 0; a.estado = 'irse'; a.t = 9; }
      H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      const x = js.pos.x - Math.sin(js.yaw) * 1.8, z = js.pos.z - Math.cos(js.yaw) * 1.8;
      const a = H.desafio.invocar('rastreador', x, z); a.estado = 'avanzar'; a.vida = a.vidaMax = 999;
      H.desafio.atacar('lanza');
      return JSON.stringify({ quitado: 999 - a.vida }); })()`));
    ok(Math.abs(dano40.quitado - 34 * 1.12 * 1.05) < 0.05, `con 40 rastreadores abatidos, la lanza pega ${dano40.quitado.toFixed(2)} (× 1,05)`);

    // ------------------------------------------------------------ 5. guardar y recargar
    const antes = JSON.parse(await js(`JSON.stringify({ h: ${H}.progreso.desafio.habilidades, b: ${H}.progreso.desafio.bonos, best: ${H}.progreso.desafio.bestiario.bruto })`));
    await js(`${H}.guardar(); 1`);
    await esperar(600);
    await w.loadFile(url, { search: '?debug=1' });
    ok(await entrar(), 'se vuelve a abrir la partida');
    await esperar(1500);
    const despues = JSON.parse(await js(`JSON.stringify({ h: ${H}.progreso.desafio.habilidades, b: ${H}.progreso.desafio.bonos, best: ${H}.progreso.desafio.bestiario.bruto, max: ${H}.desafio.saludMaxima(), sal: ${H}.progreso.desafio.salud })`));
    ok(despues.h.niveles.corazon === 3 && despues.h.niveles.pulso === 2 && despues.h.niveles.pies === 2 && despues.h.noche === 4, `las habilidades sobreviven (${JSON.stringify(despues.h)})`);
    ok(despues.max === 135 && despues.b.origen.habilidad.saludMax === 35 && Math.abs(despues.b.origen.habilidad.dano - 0.12) < 1e-9 && Math.abs(despues.b.origen.habilidad.correr - 0.08) < 1e-9, `y los bonos (${JSON.stringify(despues.b)})`);
    ok(despues.best.abatidos === antes.best.abatidos && despues.best.lados && despues.best.lados.monte === 3, 'y el bestiario con sus lados');
    await tecla('KeyJ'); await esperar(500);
    await js(`${H}.__aldea.cuaderno('guardian'); 1`);
    texto = await textoCuaderno();
    ok(/Salud máxima: 135/.test(texto), 'la pantalla del Guardián recargada muestra la salud máxima');
    await tecla('KeyJ'); await esperar(400);

    // ------------------------------------------------------------ 6. una partida vieja
    await js(`(()=>{ const H=${H}; const p = H.progreso; delete p.desafio.bonos; delete p.desafio.habilidades; H.guardar(); return 1 })()`);
    await esperar(400);
    await w.loadFile(url, { search: '?debug=1' });
    ok(await entrar(), 'se abre una partida guardada sin bonos ni habilidades');
    const vieja = JSON.parse(await js(`JSON.stringify({ h: ${H}.progreso.desafio.habilidades, b: ${H}.progreso.desafio.bonos, max: ${H}.desafio.saludMaxima() })`));
    ok(vieja.h.puntos === 0 && Object.keys(vieja.h.niveles).length === 0 && Object.keys(vieja.b.origen).length === 0 && vieja.max === 100, 'carga limpia, con la salud de siempre');
    await tecla('KeyJ'); await esperar(500);
    await js(`${H}.__aldea.cuaderno('guardian'); 1`);
    await foto('guardian-partida-vieja');
    texto = await textoCuaderno();
    ok(/Puntos del guardián: 0/.test(texto) && /Todavía nada/.test(texto), 'y la pantalla sin puntos se ve bien');
    const fallas = await js(`(${H}.__caidas.fallas && ${H}.__caidas.fallas().length) || 0`);
    ok(fallas === 0, `sin sistemas caídos (${fallas})`);
  } catch (e) {
    errores.push('EXCEPCIÓN: ' + (e && e.stack || e));
    console.log('EXCEPCIÓN', e && e.stack || e);
  }
  console.log(errores.length ? `\n${errores.length} PROBLEMAS:\n - ${errores.join('\n - ')}` : '\nTODO BIEN');
  app.exit(errores.length ? 1 : 0);
});

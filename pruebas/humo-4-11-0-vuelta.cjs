// 4.11.0 (desafio-b): partida real de «Otra vuelta». Se empieza una campaña eligiendo ventajas y una regla en «Nueva partida»,
// se aguantan noches (puntos del guardián que se gastan de verdad), se estudia un duende (bestiario), cae un mandamás y se cuelga su
// trofeo en un tablero; se da por terminada la campaña (nido abajo) y se arranca «Otra vuelta». Se comprueba que la vuelta nueva se
// lleva las habilidades y sus puntos, el bestiario, los trofeos y las reglas elegidas (sin volver a pasar por «Nueva partida»), que
// los bonos salen de los orígenes correctos, que los puntos se vuelven a ganar noche a noche, que el tablero de la vuelta nueva
// vuelve a dar su bono, y que guardar y abrir no lo cambia.
//
// Uso (desde PowerShell, de a una; con -Visible para las capturas):
//   powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-11-0-vuelta.cjs -Espera 900 -Perfil <carpeta> [-Visible]
// Las capturas van a pruebas\salidas\vuelta-4110 (o a lo que diga HUMO_SALIDA). Sin -Visible sólo comprueba.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const H = 'window.__hojarasca';
const salida = process.env.HUMO_SALIDA ? path.resolve(process.env.HUMO_SALIDA) : path.join(raiz, 'pruebas', 'salidas', 'vuelta-4110');
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
  const tecla = (code) => js(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'${code}',bubbles:true,cancelable:true})); document.dispatchEvent(new KeyboardEvent('keyup',{code:'${code}',bubbles:true})); 1`);
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
  const cargar = async () => {
    await w.loadFile(url, { search: '?debug=1&meta=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.desafio').catch(() => false)) return true; }
    return false;
  };
  const recargar = async () => {
    await esperar(1500);
    for (let i = 0; i < 300; i++) { if (await js('!window.__marcaVieja && !!window.__hojarasca && !!window.__hojarasca.desafio').catch(() => false)) return true; await esperar(1000); }
    return false;
  };
  const clic = (sel) => js(`(()=>{ const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`);
  const pantallaAbierta = () => js(`!document.getElementById('nueva-partida').classList.contains('oculto')`);
  const sim = (seg) => js(`(()=>{const H=${H}; for(let i=0;i<${Math.round(seg / 0.05)};i++){ H.progreso.desafio.salud = Math.max(H.progreso.desafio.salud, 90); H.desafio.actualizar(0.05,{noche:0, dtReal:0.05}); } return 1})()`);
  const D = (expr) => js(`(()=>{ const D = ${H}.progreso.desafio, H = ${H}; return JSON.stringify(${expr}) })()`).then((t) => (t === undefined ? undefined : JSON.parse(t)));
  // un amanecer: la noche `n` se aguanta
  const amanecer = async (n) => {
    await js(`(()=>{ const H=${H}, D=H.progreso.desafio; for (const a of H.desafio.aliens.slice()) { a.vida = 0; a.estado = 'irse'; a.t = 9; } D.oleadas = ${n}; D.oleadaNoche = ${n}; D.oleadaTerminada = false; H.progreso.dia = ${n + 1}; H.progreso.horas = 7; return 1 })()`);
    await sim(0.3);
  };
  const llano = () => js(`(()=>{const H=${H}, T=H.T, r=T.lugares.refugio; let mejor=null;
    for (let a=0;a<36;a++) for (const d of [30,45,60,80,100]) { const x=r.x+Math.cos(a/36*6.283)*d, z=r.z+Math.sin(a/36*6.283)*d, y=T.altura(x,z); if (T.agua(x,z)) continue;
      let des=0, mojado=false; for (let k=0;k<12 && !mojado;k++) for (const e of [6,12,18,26,34]) { const qx=x+Math.cos(k/12*6.283)*e, qz=z+Math.sin(k/12*6.283)*e; if (T.agua(qx,qz)) { mojado=true; break; } des=Math.max(des,Math.abs(T.altura(qx,qz)-y)); }
      if (mojado) continue;
      const pts = -des; if (!mejor || pts>mejor.pts) mejor={x,z,pts,des}; }
    return mejor})()`);
  const ponerEn = (id, x, z, rot = 0) => js(`(()=>{const H=${H}, O=H.obras, P=H.progreso;
    Object.assign(P.materiales,{tronco:99,tabla:99,piedra:99,cristal:40});
    const p=H.PLANOS.find(q=>q.id==='${id}'); if(!p) return {error:'no hay plano ${id}'};
    O.elegir(p); O.alternarSnap(false);
    const r=O.fundar(${x},${z},${rot}); if(!r.ok) { O.elegir(null); return {error:r.motivo}; }
    for (let g=0; g<12 && r.obra.datos.etapas<r.obra.plano.etapas.length; g++) { const k=O.avanzar(r.obra,P.materiales); if(!k.ok) break; }
    O.elegir(null); P.obras=O.obras.map(o=>o.datos);
    return {ok:r.obra.datos.etapas>=r.obra.plano.etapas.length, x:r.obra.datos.x, z:r.obra.datos.z}})()`);
  // parado a `d` metros de (x, z), mirándolo, y unos cuadros de verdad para que se dibuje
  const mirar = async (x, z, d, alto = 1.6) => {
    await js(`(()=>{const H=${H}, js=H.jugador.estado; const px=${x}, pz=${z}-${d}; const piso=H.T.altura(px,pz);
      js.pos.set(px, piso, pz); js.vel.set(0,0,0); js.vy=0; js.yaw=Math.atan2(-(${x}-px), -(${z}-pz)); js.pitch=0.05; return 1})()`);
    for (let i = 0; i < 20; i++) { await js(`${H}.__bucle(); 1`); await esperar(30); }
  };
  const abrirCuaderno = async (pestana) => {
    if (await js(`${H}.__caidas.modo()`) !== 'cuaderno') { await tecla('KeyJ'); await esperar(700); }
    await js(`(()=>{ const b = [...document.querySelectorAll('#cuaderno-lista [role=tab]')].find(x => x.textContent.startsWith(${JSON.stringify(pestana)})); if (b) b.click(); return 1 })()`);
    await esperar(500);
  };
  const cerrarCuaderno = async () => { if (await js(`${H}.__caidas.modo()`) === 'cuaderno') { await tecla('KeyJ'); await esperar(500); } };

  try {
    // ============================================================ A. la campaña de la vuelta 1
    await w.loadFile(url, { search: '?debug=1&meta=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'})); localStorage.setItem('hojarasca-meta-v1', ${JSON.stringify(JSON.stringify({ semillas: 3, partidas: 3, ganadas: 3, finales: ['aldea'] }))}); 1`);
    ok(await cargar(), 'carga el modo Desafío');
    await clic('#btn-entrar'); await esperar(1500);
    for (let i = 0; i < 6 && !(await pantallaAbierta()); i++) {
      const otro = await js(`(()=>{ const ids = ['btn-creador-listo','creador-terminar','creador-empezar','prologo-saltar','btn-prologo-saltar']; for (const id of ids) { const b = document.getElementById(id); if (b && b.offsetParent) { b.click(); return id; } } return null })()`);
      if (!otro) await clic('#btn-entrar');
      await esperar(1500);
    }
    ok(await pantallaAbierta(), 'una partida nueva abre la pantalla de «Nueva partida»');
    await clic('[data-clave="flechas"]'); await esperar(200);
    await clic('[data-clave="salud"]'); await esperar(200);
    await clic('[data-clave="sinEmplastos"]'); await esperar(200);
    await foto('01-eleccion-vuelta1');
    await clic('.np-empezar'); await esperar(3500);
    ok(!(await pantallaAbierta()), 'Empezar entra al juego');
    await js(`(()=>{ const H=${H}; H.ajustes.limiteFps = 'libre'; H.progreso.desafio.tutorial = 99; return 1 })()`);
    const m1 = await D('D.meta');
    ok(m1.modo === 'normal' && m1.ventajas.join() === 'flechas,salud' && m1.reglas.join() === 'sinEmplastos' && m1.aplicado === true, 'la campaña lleva sus ventajas y su regla: ' + JSON.stringify(m1));
    const flechas1 = await D('D.flechas');
    ok(flechas1 >= 20 && await js(`${H}.desafio.saludMaxima()`) === 115, `con el arranque dado: ${flechas1} flechas y 115 de salud máxima`);

    // cinco noches aguantadas, cinco puntos; se gastan 4 (Pulso firme 2 = 3 puntos y Corazón de coihue 1 = 1) y queda 1
    for (let n = 1; n <= 5; n++) await amanecer(n);
    ok(await D('D.habilidades.puntos') === 5, 'cinco noches, cinco puntos del guardián');
    await js(`(()=>{ const m = ${H}.desafio.habilidadesMundo; m.subir('pulso'); m.subir('pulso'); m.subir('corazon'); return 1 })()`);
    const h1 = await D('D.habilidades');
    ok(h1.puntos === 1 && h1.niveles.pulso === 2 && h1.niveles.corazon === 1 && h1.noche === 5, 'se gastaron 4 puntos: Pulso firme 2, Corazón de coihue 1 y queda 1: ' + JSON.stringify(h1));
    ok(await js(`${H}.desafio.saludMaxima()`) === 125, 'la salud máxima: 100 + 15 de la ventaja + 10 del corazón');

    // el bestiario: cinco rastreadores abatidos de verdad
    await js(`(()=>{ const H=${H}, js=H.jugador.estado; for (let i=0;i<5;i++) { const a = H.desafio.invocar('rastreador', js.pos.x + 20 + i, js.pos.z + 20); if (a) H.desafio.herirDuende(a, 1e9, 'arco'); } return 1 })()`);
    await sim(2);
    const b1 = await D('D.bestiario.rastreador');
    ok(b1 && b1.abatidos >= 5 && await js(`${H}.desafio.nivelEstudio('rastreador')`) >= 1, 'el bestiario estudió al rastreador: ' + JSON.stringify(b1));

    // un tablero de trofeos y el mandamás de la noche 5
    const L = await llano();
    const tx = L.x + 4, tz = L.z + 12;
    const tab = await ponerEn('tablero-trofeos', tx, tz, 0);
    ok(tab.ok, 'el tablero de trofeos se arma');
    await js(`(()=>{const H=${H}, D=H.progreso.desafio; D.oleadas = 5; const a = H.desafio.invocar('jefe', ${tx} + 18, ${tz} + 18); if (a) H.desafio.herirDuende(a, 1e7, 'arco'); return 1})()`);
    await sim(2.5);
    ok(JSON.stringify(await D('D.crece.trofeos')) === '{"casco":5}' && await D('D.bonos.origen.trofeo.saludMax') === 5, 'cayó el mandamás: el casco está en el tablero y da +5 de salud');
    ok(await js(`${H}.desafio.saludMaxima()`) === 130, 'salud máxima 130 con el tablero');
    await abrirCuaderno('Guardián');
    await foto('02-guardian-vuelta1');
    await cerrarCuaderno();

    // la campaña termina: el nido abajo
    await js(`(()=>{const H=${H}, D=H.progreso.desafio; H.progreso.cosas.lanza=1; D.noches = 24; D.oleadas = 24; D.victoria=true; D.nido={x:0,z:0,pistas:3,cercoX:0,cercoZ:0,camaras:[0,0,0],caido:true}; H.abrir('pausa'); return 1})()`);
    await esperar(800);
    ok(await js(`!document.getElementById('btn-vuelta').classList.contains('oculto')`), 'con el nido abajo, la pausa ofrece «Otra vuelta»');
    await foto('03-pausa-otra-vuelta');
    // el cuadro del juego: dice lo que se lleva; se contesta que sí con el botón
    await js(`window.__marcaVieja = 1; ${H}.otraVuelta(); 1`);
    await esperar(700);
    const aviso = await js(`document.getElementById('dialogo-texto').innerText`);
    ok(/habilidades/.test(aviso) && /bestiario/.test(aviso) && /trofeos/.test(aviso) && /reglas que elegiste/.test(aviso), 'el aviso de «Otra vuelta» dice lo que se lleva: «' + aviso.slice(0, 160) + '…»');
    await foto('03b-aviso-otra-vuelta');
    await clic('#dialogo-si');
    ok(await recargar(), 'arranca la vuelta nueva');

    // ============================================================ B. la vuelta 2
    await esperar(800);
    await clic('#btn-entrar'); await esperar(2500);
    ok(!(await pantallaAbierta()), 'la vuelta nueva NO vuelve a pedir ventajas y reglas');
    await sim(0.5);
    const v = await D('({ vuelta: D.vuelta, dia: H.progreso.dia, obras: H.progreso.obras.length, oleadas: D.oleadas, victoria: D.victoria, nido: D.nido, hud: document.getElementById("desafio-estado")?.textContent || "" })');
    ok(v.vuelta === 1 && v.dia === 1 && v.obras === 0 && v.oleadas === 0 && !v.victoria && v.nido === null, 'arranca de cero: día 1, sin base, noche 0');
    ok(/Vuelta 2/.test(v.hud), `el HUD lo dice: «${v.hud}»`);
    const h2 = await D('D.habilidades');
    ok(h2.puntos === 1 && h2.niveles.pulso === 2 && h2.niveles.corazon === 1 && h2.noche === 0, 'las habilidades y el punto sin gastar vienen con vos (la última noche en cero): ' + JSON.stringify(h2));
    const b2 = await D('D.bestiario.rastreador');
    ok(b2 && b2.abatidos === b1.abatidos && await js(`${H}.desafio.nivelEstudio('rastreador')`) >= 1, 'el bestiario viene con vos: ' + JSON.stringify(b2));
    ok(JSON.stringify(await D('D.crece.trofeos')) === '{"casco":5}', 'el trofeo viene con vos (guardado hasta armar el tablero)');
    const m2 = await D('D.meta');
    ok(m2.ventajas.join() === 'flechas,salud' && m2.reglas.join() === 'sinEmplastos' && m2.modo === 'normal' && m2.id !== m1.id && m2.aplicado === true, 'las reglas elegidas vienen con vos, con número de partida nuevo y el arranque dado: ' + JSON.stringify(m2));
    ok(await js(`${H}.__meta.efectos().sinEmplastos === true`), 'y rigen en el juego (sin emplastos)');
    const f2 = await D('D.flechas');
    ok(f2 >= 20 && f2 <= flechas1, `el arranque de las ventajas se dio una sola vez (${f2} flechas)`);
    const bonos2 = await D('D.bonos.origen');
    ok(bonos2.habilidad && Math.abs(bonos2.habilidad.dano - 0.12) < 1e-9 && bonos2.habilidad.saludMax === 10 && bonos2.ventaja && bonos2.ventaja.saludMax === 15 && !bonos2.trofeo && !bonos2.defensa,
      'bonos con sus orígenes: habilidad (12 % daño, +10 salud) y ventaja (+15 salud); sin trofeo ni defensa todavía: ' + JSON.stringify(bonos2));
    ok(await js(`${H}.desafio.saludMaxima()`) === 125 && await D('D.salud') === 125, 'salud máxima y salud 125 (sin el tablero no hay +5)');
    await foto('04-vuelta2-hud');
    await abrirCuaderno('Guardián');
    const g2 = await js(`document.getElementById('cuaderno-lista').innerText + '\\n' + document.getElementById('cuaderno-ficha').innerText`);
    ok(/Puntos del guardián: 1/.test(g2), 'el cuaderno del guardián muestra el punto que quedó');
    await foto('05-guardian-vuelta2');
    await abrirCuaderno('Bestiario');
    await foto('06-bestiario-vuelta2');
    await cerrarCuaderno();

    // los puntos se vuelven a ganar noche a noche (la noche 1 de esta vuelta da el suyo)
    await amanecer(1);
    ok(await D('D.habilidades.puntos') === 2, 'la primera noche de la vuelta 2 da su punto (2 en total)');

    // el tablero de la vuelta nueva vuelve a dar su bono: los trofeos estaban guardados
    const L2 = await llano();
    const tx2 = L2.x + 4, tz2 = L2.z + 12;
    const tab2 = await ponerEn('tablero-trofeos', tx2, tz2, 0);
    ok(tab2.ok, 'se arma un tablero de trofeos en la vuelta nueva');
    await sim(1.5);
    const col = await js(`JSON.stringify(${H}.obras.obras.filter(o=>o.plano.id==='tablero-trofeos').map(o=>o.datos.colgados))`);
    ok(col === '[["casco"]]' && await D('D.bonos.origen.trofeo.saludMax') === 5 && await js(`${H}.desafio.saludMaxima()`) === 130, 'el tablero nuevo cuelga el casco y vuelve el +5 de salud (130): ' + col);
    await mirar(tx2, tz2, 4.5);
    await foto('07-tablero-vuelta2');

    // guardar y abrir: nada cambia y el arranque no se da dos veces
    const antes = await D('({ hab: D.habilidades, best: D.bestiario, crece: D.crece.trofeos, meta: D.meta, flechas: D.flechas, bonos: Object.fromEntries(Object.entries(D.bonos.origen).sort()) })');
    await js(`${H}.guardar(); 1`); await esperar(800);
    ok(await cargar(), 'recarga la vuelta 2');
    await clic('#btn-entrar'); await esperar(2500);
    ok(!(await pantallaAbierta()), 'una vuelta ya empezada no pide nada');
    const despues = await D('({ hab: D.habilidades, best: D.bestiario, crece: D.crece.trofeos, meta: D.meta, flechas: D.flechas, bonos: Object.fromEntries(Object.entries(D.bonos.origen).sort()) })');
    ok(JSON.stringify(antes) === JSON.stringify(despues), 'al guardar y abrir, todo sigue igual (sin repetir el arranque de las ventajas)' + (JSON.stringify(antes) === JSON.stringify(despues) ? '' : ' | antes: ' + JSON.stringify(antes) + ' | después: ' + JSON.stringify(despues)));
  } catch (e) {
    errores.push('excepción: ' + (e && e.stack ? e.stack : e));
    console.log('EXCEPCIÓN', e && e.stack ? e.stack : e);
  }
  console.log(errores.length ? `\nFALLÓ (${errores.length}):\n- ${errores.join('\n- ')}` : '\nTODO OK');
  fs.mkdirSync(salida, { recursive: true });
  fs.writeFileSync(path.join(salida, 'informe.txt'), pasos.join('\n') + '\n' + (errores.length ? 'FALLÓ\n' + errores.join('\n') : 'TODO OK\n'));
  app.exit(errores.length ? 1 : 0);
});

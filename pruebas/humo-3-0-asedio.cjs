// 3.0 — partida real del asedio final y de la pelea adentro de la nave (Electron + WebGL).
// 3.8.0: los textos que mira esta partida dicen lo de los duendes (duendes, Coihue Viejo, madrigueras).
// Lo que las pruebas de Node no ven: que al alba de la noche final la nodriza se asiente,
// que las agujas se armen y se rompan con las armas de siempre, que el contraataque vaya
// por la baliza, que el haz se abra y E suba a la nave, que adentro se esconda el valle y
// el piso aguante, que caer adentro te escupa afuera, que la Madre caiga con su final, y
// que todo sobreviva a recargar la partida (también guardada adentro de la nave).
// Uso: npx electron pruebas/humo-3-0-asedio.cjs --user-data-dir=<carpeta>  → pruebas/salidas/asedio-3-0/
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(__dirname, 'salidas', 'asedio-3-0');
fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
// sólo pruebas: en algunos entornos el renderer con sandbox no carga ni una página (ERR_FAILED)
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Error|Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = '';
  const js = (c, limite = 90000) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, rej) => setTimeout(() => rej(new Error(`sin respuesta ${limite / 1000}s en ${donde}`)), limite)),
  ]);
  const ok = (cond, texto) => { pasos.push(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const H = 'window.__hojarasca';
  // la ventana oculta casi no dibuja: la simulación avanza en pasos fijos
  const simular = (seg, noche = 1) => js(`(()=>{const H=${H}; for(let i=0;i<${Math.round(seg / 0.05)};i++){ H.progreso.horas += 0.05*24/(30*60); H.desafio.actualizar(0.05,{noche:(${noche}), dtReal:0.05}); } return 1})()`);
  // igual, pero la prueba no pelea: se la mantiene sana para mirar la noche entera
  const simularSano = (seg) => js(`(()=>{const H=${H}; for(let i=0;i<${Math.round(seg / 0.05)};i++){ H.progreso.desafio.salud = 100; H.progreso.horas += 0.05*24/(30*60); H.desafio.actualizar(0.05,{noche:1, dtReal:0.05}); } return 1})()`);
  // sin tocar la hora (adentro de la nave el reloj está quieto igual)
  const correr = (seg, noche = 0) => js(`(()=>{const H=${H}; for(let i=0;i<${Math.round(seg / 0.05)};i++) H.desafio.actualizar(0.05,{noche:(${noche}), dtReal:0.05}); return 1})()`);
  const foto = async (n) => {
    const url = await js(`(()=>{const H=${H}; H.renderer.render(H.escena,H.camara); return H.renderer.domElement.toDataURL('image/jpeg',0.8)})()`);
    fs.writeFileSync(path.join(salida, n + '.jpg'), Buffer.from(url.split(',')[1], 'base64'));
  };
  const url = path.join(raiz, 'index.html');
  const cargar = async () => {
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) return true; }
    return false;
  };
  const entrar = async () => { await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(1500); await js(`${H}.ajustes.limiteFps = 'libre'; 1`); };
  const teclaE = () => js(`(()=>{ document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',bubbles:true})); document.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyE',bubbles:true})); return 1 })()`);
  // una noche entera de golpe hasta el ataque (19:24 → 20:29 → baja la nave)
  const hastaLaNoche = () => js(`(()=>{const H=${H}; H.progreso.dia++; H.progreso.horas=19.4; for(let i=0;i<30;i++){ H.progreso.horas+=0.01; H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); } H.progreso.horas=20.49; return 1})()`);
  // (la madrugada es del día siguiente: a las 5:58 del mismo día sería otra noche)
  const alAlba = async () => { await js(`${H}.progreso.dia++; ${H}.progreso.horas = 5.98; 1`); await simular(4); };
  const limpiarInvasores = () => js(`(()=>{const H=${H}; for (const a of H.desafio.aliens) { a.estado='irse'; a.t=9; } H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); return H.desafio.aliens.length})()`);

  try {
    // ---- entrar al Desafío
    donde = 'carga';
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false})); 1`);
    ok(await cargar(), 'el Desafío carga');
    await entrar();
    ok(await js(`${H}.modoJuego === 'desafio' && ${H}.progreso.desafio.asedio === null`), 'una partida nueva no tiene asedio');

    // ---- la noche final: baja la nodriza y amanece con ella arriba
    donde = 'noche final';
    await js(`(()=>{const H=${H}, D=H.progreso.desafio; D.oleadas=19; D.especial=null; D.especialAnterior='roja'; D.tutorial=99; Object.assign(H.progreso.materiales,{tronco:40,tabla:40,piedra:40,cristal:40}); return 1})()`);
    await hastaLaNoche();
    await simular(10);
    const nod = await js(`(()=>{const H=${H}; return {activa:H.desafio.nodrizaActiva, nodriza:!!H.progreso.desafio.nodriza, oleadas:H.progreso.desafio.oleadas}})()`);
    ok(nod.activa && nod.nodriza && nod.oleadas === 20, `baja la nodriza la noche 20 (${JSON.stringify(nod)})`);
    await alAlba();
    const as0 = await js(`(()=>{const H=${H}, D=H.progreso.desafio, A=D.asedio, M=H.desafio.asedio;
      H.desafio.actualizar(0.05,{noche:0,dtReal:0.05});
      return {hay:!!A, activo:A&&A.activo, zonas:A?A.zonas.map(z=>z.id):[], nodriza:D.nodriza, activa:H.desafio.nodrizaActiva, victoria:D.victoria,
        malla:!!(M.armado && M.armado.nave), agujas:M.armado ? M.armado.zonas.length : 0, marcas:M.marcas().length, hud:document.getElementById('desafio-estado').textContent}})()`);
    ok(as0.hay && as0.activo && as0.zonas.length >= 3, `al alba la nodriza se asienta: empieza el asedio (${as0.zonas.join(', ')})`);
    ok(as0.nodriza === null && !as0.victoria, 'los núcleos se repliegan: no hay victoria ni nodriza vieja');
    ok(as0.malla && as0.agujas === as0.zonas.length, 'se arman la nave asentada y las agujas');
    ok(as0.marcas === as0.zonas.length + 1, 'el mapa marca las agujas y la nave');
    ok(/Asedio/.test(as0.hud), `el HUD lo dice: "${as0.hud}"`);
    await js(`${H}.abrir('mapa'); 1`); await esperar(700);
    ok(await js(`!document.getElementById('mapa').classList.contains('oculto')`), 'el mapa abre con el asedio marcado');
    await js(`${H}.volverAlJuego(); 1`); await esperar(400);

    // ---- de día: la guardia, y la aguja se rompe con las armas de siempre
    donde = 'aguja';
    await js(`${H}.progreso.horas = 10; 1`);
    await correr(50);   // la gracia del principio
    const guardia = await js(`(()=>{const H=${H}, D=H.progreso.desafio, z=D.asedio.zonas[1], js=H.jugador.estado;
      H.jugador.ubicar(z.x+14, z.z, 0); for(let i=0;i<10;i++) H.desafio.actualizar(0.05,{noche:0,dtReal:0.05});
      return {guardianes:H.desafio.aliens.filter(a=>a.guardiaAsedio && a.estado!=='irse').length, dia:z.guardia===H.progreso.dia}})()`);
    ok(guardia.guardianes >= 3 && guardia.dia, `al acercarte salen los que cuidan la aguja (${guardia.guardianes})`);
    await limpiarInvasores();
    const tiro = await js(`(()=>{const H=${H}, D=H.progreso.desafio, js=H.jugador.estado, E=H.desafio.eventos;
      H.progreso.cosas.pistola = 1; D.cargas = 99;
      const b = E.blancos().find(q=>q.ancla && q.i===1);
      if (!b) return {pego:false, motivo:'sin blanco', n:E.blancos().length};
      js.pos.x = b.pos.x + 9; js.pos.z = b.pos.z; js.pos.y = H.T.altura(js.pos.x, js.pos.z);
      H.camara.position.set(js.pos.x, js.pos.y + 1.6, js.pos.z); H.camara.lookAt(b.pos.x, b.pos.y, b.pos.z); H.camara.updateMatrixWorld(true);
      const antes = D.asedio.zonas[1].vida;
      for (let i=0;i<5;i++){ H.desafio.atacar('pistola'); H.desafio.actualizar(0.35,{noche:0}); }
      const trasPistola = D.asedio.zonas[1].vida;
      js.pos.x = b.pos.x + 2.6; js.pos.z = b.pos.z; js.yaw = Math.atan2(-(b.pos.x-js.pos.x), -(b.pos.z-js.pos.z));
      for (let i=0;i<3;i++){ H.desafio.atacar('hacha'); H.desafio.actualizar(0.7,{noche:0}); }
      return {pego: trasPistola < antes, hacha: D.asedio.zonas[1].vida < trasPistola, antes, trasPistola, ahora:D.asedio.zonas[1].vida}})()`);
    ok(tiro.pego, `la pistola le pega a la aguja por el camino de siempre (${tiro.antes} → ${tiro.trasPistola})`);
    ok(tiro.hacha, `y el hacha también (${tiro.trasPistola} → ${tiro.ahora})`);
    // (sólo el asedio: el Desafío entero arrancaría la noche de verdad)
    const noche = await js(`(()=>{const H=${H}, js=H.jugador.estado; H.progreso.horas = 23; H.desafio.asedio.actualizar(0.05, js);
      const n = H.desafio.eventos.blancos().filter(b=>b.ancla).length; H.progreso.horas = 10; H.desafio.asedio.actualizar(0.05, js); return n})()`);
    ok(noche === 0, 'de noche la aguja se cierra: no hay a qué apuntarle');
    await limpiarInvasores();
    const rota = await js(`(()=>{const H=${H}, D=H.progreso.desafio, E=H.desafio.eventos;
      const capas0 = D.asedio.zonas.filter(z=>z.estado==='tomada').length;
      const b = E.blancos().find(q=>q.ancla && q.i===1); E.herirNucleo(b, 99999);
      for(let i=0;i<30;i++) H.desafio.actualizar(0.05,{noche:0,dtReal:0.05});
      const z = D.asedio.zonas[1], vis = H.desafio.asedio.armado.zonas[1];
      return {estado:z.estado, baliza:z.baliza, capas0, capas:D.asedio.zonas.filter(z=>z.estado==='tomada').length, balizaVisible:vis.baliza.visible, cristales:H.progreso.materiales.cristal}})()`);
    ok(rota.estado === 'recuperada' && rota.baliza > 0 && rota.balizaVisible, 'la aguja cae: zona recuperada y baliza plantada');
    ok(rota.capas === rota.capas0 - 1, `el escudo de la nave pierde una capa (${rota.capas0} → ${rota.capas})`);
    await foto('01-asedio-dia');

    // ---- se guarda entre noches
    donde = 'recarga 1';
    await js(`${H}.guardar(); 1`);
    ok(await cargar(), 'recarga en pleno asedio');
    await entrar();
    const tras1 = await js(`(()=>{const D=${H}.progreso.desafio; return {activo:D.asedio && D.asedio.activo, z:D.asedio && D.asedio.zonas[1].estado, nodriza:D.nodriza, oleadas:D.oleadas}})()`);
    ok(tras1.activo && tras1.z === 'recuperada' && tras1.nodriza === null, 'el asedio y la zona recuperada vuelven iguales');

    // ---- la noche: contraatacan la baliza
    donde = 'contraataque';
    await hastaLaNoche();
    await simularSano(12);
    const contra = await js(`(()=>{const H=${H}, D=H.progreso.desafio;
      return {contra:D.asedio.contra, nodriza:H.desafio.nodrizaActiva, oleadas:D.oleadas, rescate:D.rescate, hud:document.getElementById('desafio-estado').textContent, baliza:D.asedio.zonas[1].baliza,
        vanPorLaBaliza: H.desafio.asedio.blancoNoche() !== null}})()`);
    ok(contra.contra === 1 && contra.vanPorLaBaliza, 'esa noche contraatacan la zona recuperada');
    ok(!contra.nodriza && contra.oleadas === 21 && !contra.rescate, 'la noche 21 no vuelve la nodriza ni hay rescates');
    ok(/defendé el fogón/.test(contra.hud), `el HUD pide defender la baliza: "${contra.hud}"`);
    // se deja que los invasores lleguen a la baliza
    await js(`(()=>{const H=${H}, z=H.progreso.desafio.asedio.zonas[1]; H.jugador.ubicar(z.x+60, z.z+60, 0); return 1})()`);
    await simularSano(25);
    const gastada = await js(`${H}.progreso.desafio.asedio.zonas[1].baliza`);
    ok(gastada < contra.baliza, `la baliza recibe (${Math.round(contra.baliza)} → ${Math.round(gastada)})`);
    await js(`(()=>{const D=${H}.progreso.desafio; D.asedio.zonas[1].baliza = Math.max(40, D.asedio.zonas[1].baliza); return 1})()`);
    await limpiarInvasores();
    await alAlba();
    const alba = await js(`(()=>{const D=${H}.progreso.desafio; return {z:D.asedio.zonas[1].estado, contra:D.asedio.contra, noches:D.asedio.noches}})()`);
    ok(alba.z === 'asegurada' && alba.contra === null && alba.noches === 1, 'la baliza aguantó: al alba la zona queda asegurada');

    // ---- dos zonas más y se abre el haz
    donde = 'haz';
    await js(`${H}.progreso.horas = 11; 1`);
    await correr(1);
    const haz = await js(`(()=>{const H=${H}, D=H.progreso.desafio, E=H.desafio.eventos, M=H.desafio.asedio;
      const antes = M.hazAbierto();
      for (const i of [0, 2]) { const b = E.blancos().find(q=>q.ancla && q.i===i); if (b) E.herirNucleo(b, 99999); }
      for (const a of H.desafio.aliens) { a.estado='irse'; a.t=9; }
      for(let i=0;i<20;i++) H.desafio.actualizar(0.05,{noche:0,dtReal:0.05});
      return {antes, ahora:M.hazAbierto(), libres:D.asedio.zonas.filter(z=>z.estado!=='tomada').length, hazVisible:M.armado.nave.haz.visible}})()`);
    ok(!haz.antes && haz.ahora && haz.libres >= 3 && haz.hazVisible, `con tres zonas libres se abre el haz (${haz.libres} libres)`);
    await foto('02-haz');

    // ---- E sube a la nave (el aviso dice lo mismo)
    // ---- al pie del haz, si no se puede subir, el aviso y E dicen por qué
    donde = 'haz bloqueado';
    const bloq = await js(`(()=>{const H=${H}, s=H.desafio.asedio.sitioHaz(), D=H.desafio; H.jugador.ubicar(s.x+1, s.z+1, 0);
      const pos = H.jugador.estado.pos, N=D.naveAdentro, r = {};
      const a = D.invocar('rastreador', s.x+20, s.z); if (a) a.dudaT = 999;
      r.invasorAviso = D.avisoCercaDe(pos); r.invasorE = D.usarCercaDe(pos); r.invasorAdentro = N.enTransicion || N.adentro;
      H.__bucle(); r.invasorPantalla = H.__aviso();
      for (const q of D.aliens) { q.estado='irse'; q.t=9; } D.actualizar(0.05,{noche:0,dtReal:0.05});
      H.progreso.horas = 19.8; r.tardeAviso = D.avisoCercaDe(pos); r.tardeE = D.usarCercaDe(pos); r.tardeAdentro = N.enTransicion || N.adentro;
      H.progreso.horas = 11; r.libre = D.avisoCercaDe(pos);
      return r})()`);
    ok(/Hay duendes cerca: despejá la zona para entrar \(1, el más cerca/.test(bloq.invasorAviso) && /Hay duendes cerca/.test(bloq.invasorPantalla), `con un invasor cerca, el aviso dice por qué no sube: "${bloq.invasorAviso}"`);
    ok(bloq.invasorE === true && !bloq.invasorAdentro, 'y E no sube (avisa lo mismo)');
    ok(/la puertita se cerró hasta mañana/.test(bloq.tardeAviso) && bloq.tardeE === true && !bloq.tardeAdentro, `en la hora antes del ataque, tampoco: "${bloq.tardeAviso}"`);
    ok(bloq.libre === 'Entrar al Coihue por la puertita', 'despejado y de día, vuelve a ofrecer subir');
    donde = 'abordar';
    const aviso = await js(`(()=>{const H=${H}, s=H.desafio.asedio.sitioHaz(); H.jugador.ubicar(s.x+1, s.z+1, 0); H.__bucle(); return {aviso:H.__aviso(), directo:H.desafio.avisoCercaDe(H.jugador.estado.pos)}})()`);
    ok(/Entrar al Coihue/.test(aviso.directo) && /Entrar al Coihue/.test(aviso.aviso), `el aviso ofrece subir (${aviso.aviso})`);
    await teclaE();
    // 3.8.0: E entra al tronco hueco (la escalera se camina): la prueba va derecho a la puerta del corazón
    await js(`${H}.desafio.naveAdentro.atajoCorazon(); 1`);
    await correr(2.5);
    const adentro = await js(`(()=>{const H=${H}, N=H.desafio.naveAdentro, js=H.jugador.estado, A=N.arena;
      const terreno = H.escena.children.filter(o=>o.isMesh && o.geometry && o.geometry.attributes.position.count > 20000);
      return {adentro:N.adentro, y:js.pos.y, piso:A && A.y, ocultos:N.ocultos, arenaVisible:A && A.grupo.visible, fase:N.pelea && N.pelea.fase,
        blancos:H.desafio.eventos.blancos().filter(b=>b.nave).length, abordajes:H.progreso.desafio.asedio.abordajes, niebla:H.escena.fog.density,
        grandesVisibles: terreno.filter(o=>o.visible).length, grandes: terreno.length, hud:document.getElementById('nave-hud').style.display}})()`);
    ok(adentro.adentro && Math.abs(adentro.y - adentro.piso) < 0.3, `E sube por el haz: adentro, parado en el piso (${adentro.y?.toFixed(1)} / ${adentro.piso?.toFixed(1)})`);
    ok(adentro.ocultos > 5 && adentro.arenaVisible && adentro.grandesVisibles === 0, `el valle se esconde (${adentro.ocultos} cosas; mallas grandes visibles ${adentro.grandesVisibles}/${adentro.grandes})`);
    ok(adentro.niebla > 0.01 && adentro.hud === 'block', 'la niebla se cierra y aparece la barra de la Madre');
    ok(adentro.fase === 'ojos' && adentro.blancos >= 2 && adentro.abordajes === 1, `primera fase: los ojos (${adentro.blancos})`);
    // caminar sobre el piso de la nave
    const camina = await js(`(()=>{const H=${H}, js=H.jugador.estado, x0=js.pos.x, z0=js.pos.z;
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW',bubbles:true}));
      for(let i=0;i<30;i++){ H.jugador.actualizar(0.05); H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); }
      document.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW',bubbles:true}));
      return {anduvo:Math.hypot(js.pos.x-x0, js.pos.z-z0), y:js.pos.y, piso:H.desafio.naveAdentro.arena.y}})()`);
    ok(camina.anduvo > 2 && Math.abs(camina.y - camina.piso) < 0.3, `se camina sobre el piso sin caerse (${camina.anduvo.toFixed(1)} m)`);
    // el reloj quieto y las crías
    const h0 = await js(`${H}.progreso.horas`);
    await js(`${H}.progreso.desafio.salud = 100; 1`);
    await correr(9);
    const pelea = await js(`(()=>{const H=${H}, N=H.desafio.naveAdentro;
      const crias = H.desafio.aliens.filter(a=>a.enNave && a.estado!=='irse');
      return {horas:H.progreso.horas, crias:crias.length, pisan:crias.every(a=>Math.abs(a.m.g.position.y - N.arena.y) < 0.05)}})()`);
    ok(Math.abs(pelea.horas - h0) < 0.01, 'adentro el reloj del valle no corre');
    ok(pelea.crias > 0 && pelea.pisan, `las vainas largan crías que pisan el piso de la nave (${pelea.crias})`);
    // la pistola le pega a un ojo
    const ojo = await js(`(()=>{const H=${H}, N=H.desafio.naveAdentro, js=H.jugador.estado, E=H.desafio.eventos;
      const b = E.blancos().find(q=>q.tipo==='ojo'); if (!b) return {pego:false};
      const antes = N.pelea.ojos[b.i];
      const dx = b.pos.x - N.arena.x, dz = b.pos.z - N.arena.z, l = Math.hypot(dx,dz);
      js.pos.set(N.arena.x + dx/l*11, N.arena.y, N.arena.z + dz/l*11);
      H.camara.position.set(js.pos.x, js.pos.y + 1.6, js.pos.z); H.camara.lookAt(b.pos.x, b.pos.y, b.pos.z); H.camara.updateMatrixWorld(true);
      for (let i=0;i<3;i++){ H.desafio.atacar('pistola'); H.desafio.actualizar(0.35,{noche:0}); }
      return {pego:N.pelea.ojos[b.i] < antes, antes, ahora:N.pelea.ojos[b.i]}})()`);
    ok(ojo.pego, `la pistola le pega a un ojo de la Madre (${ojo.antes} → ${ojo.ahora})`);
    await foto('03-adentro');

    // ---- guardar adentro y recargar: se vuelve al valle, con el asedio entero
    donde = 'recarga adentro';
    await js(`${H}.guardar(); 1`);
    ok(await cargar(), 'recarga una partida guardada adentro de la nave');
    await entrar();
    await correr(0.5);
    const tras2 = await js(`(()=>{const H=${H}, js=H.jugador.estado, D=H.progreso.desafio;
      return {suelo: js.pos.y - H.T.altura(js.pos.x, js.pos.z), adentro:H.desafio.naveAdentro.adentro, activo:D.asedio.activo, abordajes:D.asedio.abordajes}})()`);
    ok(Math.abs(tras2.suelo) < 1 && !tras2.adentro && tras2.activo && tras2.abordajes === 1, `vuelve al valle, al pie del haz (${tras2.suelo.toFixed(2)} m del suelo)`);

    // ---- caer adentro: la nave te escupe, sin soft-lock
    donde = 'derrota';
    await js(`(()=>{const H=${H}; H.progreso.horas = 11; const s=H.desafio.asedio.sitioHaz(); H.jugador.ubicar(s.x+1, s.z+1, 0); return 1})()`);
    ok(await js(`${H}.desafio.usarCercaDe(${H}.jugador.estado.pos)`), 'se vuelve a subir');
    await correr(2.5);
    const caida = await js(`(()=>{const H=${H}, D=H.progreso.desafio, N=H.desafio.naveAdentro;
      const antes = {adentro:N.adentro};
      D.salud = 5; H.desafio.herirJugador(50, {x:N.arena.x, y:N.arena.y, z:N.arena.z});
      const caido = H.desafio.caido;
      for(let i=0;i<50;i++) H.desafio.actualizar(0.05,{noche:0,dtReal:0.05});
      const js=H.jugador.estado;
      return {antes, caido, adentro:N.adentro, salud:D.salud, derrotas:D.asedio.derrotasNave, suelo:js.pos.y - H.T.altura(js.pos.x, js.pos.z), ocultos:N.ocultos, crias:H.desafio.aliens.filter(a=>a.enNave && a.estado!=='irse').length}})()`);
    ok(caida.antes.adentro && !caida.caido && !caida.adentro, 'caer adentro no es la caída de siempre: la nave te escupe al valle');
    ok(caida.salud >= 50 && caida.derrotas === 1 && Math.abs(caida.suelo) < 1 && caida.ocultos === 0, `afuera, con salud y el valle visible (${caida.salud})`);
    ok(await js(`${H}.desafio.asedio.hazAbierto()`), 'el haz sigue abierto para volver a intentar');

    // ---- la Madre cae: el final
    donde = 'final';
    await js(`(()=>{const H=${H}; const s=H.desafio.asedio.sitioHaz(); H.jugador.ubicar(s.x+1, s.z+1, 0); H.desafio.usarCercaDe(H.jugador.estado.pos); H.desafio.naveAdentro.atajoCorazon(); return 1})()`);   // 3.8.0: atajo a la puerta del corazón
    await correr(2.5);
    const fases = await js(`(()=>{const H=${H}, N=H.desafio.naveAdentro, E=H.desafio.eventos, vistas=[];
      for (let v=0; v<20 && N.pelea && !N.pelea.ganada; v++) {
        vistas.push(N.pelea.fase);
        H.progreso.desafio.salud = 100;   // la prueba no esquiva: se la cura para ver las tres fases
        const b = E.blancos()[0];
        if (b) E.herirNucleo(b, 99999);
        for(let i=0;i<40;i++) { H.progreso.desafio.salud = Math.max(H.progreso.desafio.salud, 60); H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); }
      }
      return {vistas:[...new Set(vistas)], ganada:N.pelea && N.pelea.ganada}})()`);
    ok(fases.vistas.join(',') === 'ojos,pilares,corazon' && fases.ganada, `las tres fases, en orden (${fases.vistas.join(' → ')})`);
    await correr(6);
    const afuera = await js(`(()=>{const H=${H}, D=H.progreso.desafio, js=H.jugador.estado;
      return {adentro:H.desafio.naveAdentro.adentro, suelo: js.pos.y - H.T.altura(js.pos.x, js.pos.z), cayendo:H.desafio.asedio.armado.nave.cayendo > 0 || !H.desafio.asedio.armado.nave.g.visible}})()`);
    ok(!afuera.adentro && Math.abs(afuera.suelo) < 1 && afuera.cayendo, 'se sale a tiempo y la nave se viene abajo');
    await correr(6);
    const fin = await js(`(()=>{const H=${H}, D=H.progreso.desafio; return {victoria:D.victoria, ganado:D.asedio.ganado, activo:D.asedio.activo, nido:!!D.nido, logro:H.desafio.logros.tiene('vencedor')}})()`);
    ok(fin.victoria && fin.ganado && !fin.activo, 'la nave cae: se gana el Desafío');
    ok(fin.nido, 'y se abre el segundo acto (el nido), como siempre');
    await esperar(6500);
    const pantalla = await js(`({visible:!document.getElementById('victoria').classList.contains('oculto'), titulo:document.getElementById('victoria-titulo').textContent})`);
    ok(pantalla.visible && /desde adentro/.test(pantalla.titulo), `pantalla de victoria propia: "${pantalla.titulo}"`);
    await foto('04-final');
    await js(`document.getElementById('victoria-seguir').click(); 1`);

    // ---- y sobrevive a otra recarga
    donde = 'recarga final';
    await js(`${H}.guardar(); 1`);
    ok(await cargar(), 'recarga después del final');
    await entrar();
    await correr(0.5);
    const tras3 = await js(`(()=>{const H=${H}, D=H.progreso.desafio; return {victoria:D.victoria, ganado:D.asedio && D.asedio.ganado, hud:document.getElementById('desafio-estado').textContent,
      naveVisible: !!(H.desafio.asedio.armado && H.desafio.asedio.armado.nave && H.desafio.asedio.armado.nave.g.visible)}})()`);
    ok(tras3.victoria && tras3.ganado && !tras3.naveVisible && !/Asedio/.test(tras3.hud), 'la victoria y el asedio ganado se guardan; la nave ya no está');
  } catch (e) { errores.push(`${donde}: ${e.message}`); }

  fs.writeFileSync(path.join(salida, 'informe.json'), JSON.stringify({ pasos, errores }, null, 2));
  console.log(pasos.join('\n'));
  if (errores.length) console.log('ERRORES:\n' + errores.join('\n'));
  app.exit(errores.length ? 1 : 0);
});

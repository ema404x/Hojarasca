// 3.5.1 — partida real de la auditoría del Desafío (Electron + WebGL). Lo que la 3.5.1
// arregló y sólo se ve jugando:
//   · la noche final: las tandas de la nodriza llegan al suelo y la noche puede quedar en
//     silencio; guardada sin invasores vivos, la nodriza vuelve al abrir;
//   · caer de día no cierra otra vez la noche (ni borra la noche especial anunciada);
//   · la granada le pega a una aguja del asedio;
//   · al volver a subir a la nave los ojos y los pilares están enteros;
//   · cerrado el juego mientras la nave cae, la victoria llega al abrir.
// Uso: npx electron pruebas/humo-3-5-1-desafio.cjs --user-data-dir=<carpeta>  → pruebas/salidas/desafio-3-5-1/
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(__dirname, 'salidas', 'desafio-3-5-1');
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
  const url = path.join(raiz, 'index.html');
  const cargar = async () => {
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) return true; }
    return false;
  };
  const entrar = async () => { await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(1500); await js(`${H}.ajustes.limiteFps = 'libre'; 1`); };
  // la ventana oculta casi no dibuja: la simulación avanza en pasos fijos (y la prueba no pelea: se la cura)
  const simular = (seg, noche = 1) => js(`(()=>{const H=${H}; for(let i=0;i<${Math.round(seg / 0.05)};i++){ H.progreso.desafio.salud = 100; H.progreso.horas += 0.05*24/(30*60); H.desafio.actualizar(0.05,{noche:(${noche}), dtReal:0.05}); } return 1})()`);
  const correr = (seg, noche = 0) => js(`(()=>{const H=${H}; for(let i=0;i<${Math.round(seg / 0.05)};i++){ H.progreso.desafio.salud = Math.max(H.progreso.desafio.salud, 60); H.desafio.actualizar(0.05,{noche:(${noche}), dtReal:0.05}); } return 1})()`);
  const hastaLaNoche = () => js(`(()=>{const H=${H}; H.progreso.dia++; H.progreso.horas=19.4; for(let i=0;i<30;i++){ H.progreso.horas+=0.01; H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); } H.progreso.horas=20.49; return 1})()`);
  const limpiarInvasores = () => js(`(()=>{const H=${H}; for (const a of H.desafio.aliens) { a.estado='irse'; a.t=9; } H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); return H.desafio.aliens.length})()`);
  // los que caminan, se queman (y el jefe queda a un golpe): la noche se despeja sola
  const quemar = () => js(`(()=>{const H=${H}; for (const a of H.desafio.aliens) if (a.estado==='avanzar') { a.vida = Math.min(a.vida, 1); a.fuegoT = 5; } return 1})()`);

  try {
    donde = 'carga';
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'})); 1`);
    ok(await cargar(), 'el Desafío carga');
    await entrar();

    // ================================================================ caer de día
    donde = 'caer de día';
    const deDia = await js(`(()=>{const H=${H}, D=H.progreso.desafio; D.tutorial=99; H.progreso.horas = 19.2;
      D.especial = 'apagon'; const antes = {derrotas:D.derrotas, terminada:D.oleadaTerminada, noche:D.oleadaNoche};
      D.salud = 3; H.desafio.herirJugador(40, {x:H.jugador.estado.pos.x+1, y:0, z:H.jugador.estado.pos.z});
      return {antes, caido:H.desafio.caido, especial:D.especial, derrotas:D.derrotas, terminada:D.oleadaTerminada, noche:D.oleadaNoche}})()`);
    ok(deDia.caido && deDia.derrotas === deDia.antes.derrotas + 1, 'de día también se cae (y cuenta)');
    ok(deDia.especial === 'apagon' && deDia.noche === deDia.antes.noche, `pero no se cierra otra noche: la especial anunciada sigue (${deDia.especial})`);
    await esperar(3200);
    ok(await js(`!${H}.desafio.caido && ${H}.progreso.desafio.salud === 100`), 'y se despierta en la base');

    // ================================================================ la noche final
    donde = 'noche final';
    await js(`(()=>{const H=${H}, D=H.progreso.desafio; D.oleadas=19; D.especial=null; D.especialAnterior='roja'; Object.assign(H.progreso.materiales,{tronco:40,tabla:40,piedra:40,cristal:40}); return 1})()`);
    await hastaLaNoche();
    // hasta que la oleada termina de bajar y la nodriza larga su primera tanda
    let tanda = null;
    for (let s = 0; s < 40 && !tanda; s++) {
      await simular(1);
      if (s % 4 === 3) await quemar();
      tanda = await js(`(()=>{const H=${H}; const c=H.desafio.aliens.filter(a=>a.estado==='bajar'); return H.desafio.nodrizaActiva && c.length && H.desafio.aliens.length <= 8 ? {bajando:c.length} : null})()`);
    }
    const n20 = await js(`(()=>{const H=${H}, D=H.progreso.desafio; return {oleadas:D.oleadas, nod:H.desafio.nodrizaActiva}})()`);
    ok(n20.oleadas === 20 && n20.nod, `baja la nodriza la noche 20 (${JSON.stringify(n20)})`);
    ok(!!tanda, `las tandas de la nodriza bajan al suelo (${JSON.stringify(tanda)})`);
    for (let s = 0; s < 6; s++) { await simular(2); await quemar(); }
    await simular(4);
    const calma = await js(`(()=>{const H=${H}, D=H.progreso.desafio; return {vivos:D.vivos, aliens:H.desafio.aliens.filter(a=>a.estado!=='morir'&&a.estado!=='irse').length, hay:H.desafio.hayAtaque(), nod:H.desafio.nodrizaActiva}})()`);
    ok(calma.vivos === 0 && calma.aliens === 0, `entre tandas no queda nadie colgado en la cola (${JSON.stringify(calma)})`);
    // guardar en ese momento (sin invasores vivos) y abrir: la nodriza vuelve
    donde = 'recarga noche final';
    await js(`${H}.guardar(); 1`);
    ok(await cargar(), 'recarga en la noche final');
    await entrar();
    await correr(1, 1);
    const vuelve = await js(`(()=>{const H=${H}, D=H.progreso.desafio; return {nod:H.desafio.nodrizaActiva, dn:!!D.nodriza, nucleos:H.desafio.eventos.blancos().length, h:H.progreso.horas}})()`);
    ok(vuelve.nod && vuelve.dn && vuelve.nucleos === 3, `guardada sin invasores vivos, la nodriza vuelve con sus núcleos (${JSON.stringify(vuelve)})`);

    // ================================================================ el asedio
    donde = 'asedio';
    await js(`(()=>{const H=${H}; H.progreso.dia++; H.progreso.horas=5.98; return 1})()`);
    await simular(4, 0.3);
    const as = await js(`(()=>{const H=${H}, D=H.progreso.desafio; return {asedio:!!D.asedio && D.asedio.activo, zonas:D.asedio ? D.asedio.zonas.length : 0}})()`);
    ok(as.asedio && as.zonas >= 3, `al alba empieza el asedio (${as.zonas} zonas)`);
    await js(`${H}.progreso.horas = 10; 1`);
    await correr(50);
    await limpiarInvasores();
    // la granada le pega a la aguja (antes: 0)
    const gr = await js(`(()=>{const H=${H}, D=H.progreso.desafio, E=H.desafio.eventos;
      const b = E.blancos().find(q=>q.ancla && q.i===1); if (!b) return {ok:false};
      const antes = D.asedio.zonas[1].vida;
      const js=H.jugador.estado; js.pos.x = b.pos.x + 12; js.pos.z = b.pos.z; js.pos.y = H.T.altura(js.pos.x, js.pos.z);
      // una granada que cae al lado de la aguja
      const q = H.desafio.arsenal.lanzar('granada', {dano:75, radio:4, vel:4}, {x:b.pos.x+1.2, y:b.pos.y+1.5, z:b.pos.z}, {x:0, y:-1, z:0});
      for (let i=0;i<40;i++) H.desafio.actualizar(0.05,{noche:0,dtReal:0.05});
      return {ok:true, antes, ahora:D.asedio.zonas[1].vida}})()`);
    ok(gr.ok && gr.ahora < gr.antes, `la granada le pega a la aguja (${gr.antes} → ${gr.ahora})`);
    await limpiarInvasores();
    // tres zonas libres: se abre el haz
    await js(`(()=>{const H=${H}, D=H.progreso.desafio, E=H.desafio.eventos; for (const i of [0,1,2]) { const b = E.blancos().find(q=>q.ancla && q.i===i); if (b) E.herirNucleo(b, 99999); } return 1})()`);
    await correr(1.5);
    await limpiarInvasores();
    ok(await js(`${H}.desafio.asedio.hazAbierto()`), 'con tres zonas libres se abre el haz');

    // ================================================================ volver a subir
    donde = 'reabordaje';
    const subir = `(()=>{const H=${H}; H.progreso.horas = 11; const s=H.desafio.asedio.sitioHaz(); H.jugador.ubicar(s.x+1, s.z+1, 0, s.y); return H.desafio.usarCercaDe(H.jugador.estado.pos)})()`;
    ok(await js(subir), 'E sube por el haz');
    await correr(2.5);
    await js(`(()=>{const H=${H}, E=H.desafio.eventos; const o = E.blancos().filter(b=>b.nave && b.tipo==='ojo'); E.herirNucleo(o[0], 99999); E.herirNucleo(o[1], 99999); return 1})()`);
    await correr(0.5);
    ok(await js(`${H}.desafio.naveAdentro.salir()`), 'se baja por la salida');
    await correr(2.5);
    await limpiarInvasores();
    ok(await js(subir), 'y se vuelve a subir');
    await correr(2.5);
    const ojos = await js(`(()=>{const H=${H}, N=H.desafio.naveAdentro; return {globos:N.arena.ojos.map(o=>o.globo.visible), heridas:N.arena.ojos.filter(o=>o.herida.visible).length, vida:N.pelea.ojos, blancos:H.desafio.eventos.blancos().filter(b=>b.nave).length}})()`);
    ok(ojos.globos.every(Boolean) && ojos.heridas === 0 && ojos.blancos === 3, `al volver, la Madre se recompone y los ojos se ven enteros (${JSON.stringify(ojos)})`);
    // pilares: romper uno, caer adentro, volver
    await js(`(()=>{const H=${H}, E=H.desafio.eventos; for (const b of E.blancos().filter(b=>b.nave)) E.herirNucleo(b, 99999); return 1})()`);
    await correr(0.5);
    await js(`(()=>{const H=${H}, E=H.desafio.eventos; const p = E.blancos().find(b=>b.nave && b.tipo==='pilar'); E.herirNucleo(p, 99999); const D=H.progreso.desafio; D.salud = 1; H.desafio.herirJugador(50, null); return 1})()`);
    await correr(3);
    await limpiarInvasores();
    ok(await js(`!${H}.desafio.naveAdentro.adentro`), 'caer adentro te escupe al valle');
    ok(await js(subir), 'otra vez arriba');
    await correr(2.5);
    await js(`(()=>{const H=${H}, E=H.desafio.eventos; for (const b of E.blancos().filter(b=>b.nave)) E.herirNucleo(b, 99999); return 1})()`);
    await correr(0.5);
    const pil = await js(`(()=>{const H=${H}, N=H.desafio.naveAdentro; return {fase:N.pelea.fase, nucleos:N.arena.pilares.map(p=>p.nucleo.visible), alto:N.arena.pilares.map(p=>p.columna.scale.y)}})()`);
    ok(pil.fase === 'pilares' && pil.nucleos.every(Boolean) && pil.alto.every((y) => y === 1), `y los pilares también (${JSON.stringify(pil)})`);

    // ================================================================ cerrar mientras la nave cae
    donde = 'final';
    await js(`(()=>{const H=${H}, N=H.desafio.naveAdentro, E=H.desafio.eventos;
      for (let v=0; v<12 && N.pelea && !N.pelea.ganada; v++) { for (const b of E.blancos().filter(b=>b.nave)) E.herirNucleo(b, 99999); for(let i=0;i<30;i++){ H.progreso.desafio.salud=100; H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); } }
      return 1})()`);
    await correr(3.5);
    const cae = await js(`(()=>{const H=${H}, D=H.progreso.desafio; return {cayendo:H.desafio.asedio.armado.nave.cayendo > 0, ganado:D.asedio.ganado, victoria:D.victoria}})()`);
    ok(cae.cayendo && cae.ganado && !cae.victoria, `la nave cae y todavía no hay victoria (${JSON.stringify(cae)})`);
    ok(await cargar(), 'se cierra el juego en plena caída y se vuelve a abrir');
    await entrar();
    await correr(0.5);
    const fin = await js(`(()=>{const H=${H}, D=H.progreso.desafio; return {victoria:D.victoria, nido:!!D.nido, ganado:D.asedio && D.asedio.ganado}})()`);
    ok(fin.victoria && fin.nido && fin.ganado, `la victoria llega igual, con el segundo acto (${JSON.stringify(fin)})`);
    await esperar(6500);
    const pantalla = await js(`({visible:!document.getElementById('victoria').classList.contains('oculto'), titulo:document.getElementById('victoria-titulo').textContent})`);
    ok(pantalla.visible && /desde adentro/.test(pantalla.titulo), `con su pantalla: "${pantalla.titulo}"`);
  } catch (e) { errores.push(`${donde}: ${e.message}`); }

  fs.writeFileSync(path.join(salida, 'informe.json'), JSON.stringify({ pasos, errores }, null, 2));
  console.log(pasos.join('\n'));
  if (errores.length) console.log('ERRORES:\n' + errores.join('\n'));
  app.exit(errores.length ? 1 : 0);
});

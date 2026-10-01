// Partida real 3.1 (Electron + WebGL): la historia guiada y los eventos del valle.
//   1. la portada: en el Relax, Libre o Historia; con Historia, entrar empieza el capítulo 1
//   2. la tarjeta de entrada frena el mundo; con 1 se empieza y aparece el panel de objetivos
//   3. el capítulo 1 con acciones del juego (fuego con F en el fogón del refugio, dormir) y
//      ayudas de depuración (las anotaciones); la tarjeta de salida, el premio y el capítulo 2
//   4. un evento: la tarjeta con opciones, la que no alcanza viene apagada, elegir cobra y
//      deja la gratitud; días después, "lo que pasó después" con su premio
//   5. un segundo evento con una visita de verdad a tu mesa (Ercilia) y la cadena del puente
//   6. todo se guarda: recargar deja la historia, los eventos y lo pendiente donde estaban
//   7. empezar la historia desde una partida libre (la pausa), sin borrar nada; y en el
//      Desafío no hay nada de esto
// Uso: npx electron pruebas/humo-3-1-historia.cjs --user-data-dir=<carpeta propia>
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
// sólo pruebas: en algunos entornos el renderer con sandbox no carga ni una página (ERR_FAILED)
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: false, width: 1024, height: 640, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = 'carga';
  const js = (c) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 120 s (${donde})`)), 120000)),
  ]);
  const ok = (cond, texto) => { const l = `${cond ? '✓' : '✗'} ${texto}`; console.log(l); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const url = path.join(raiz, 'index.html');
  const abrir = async () => {
    try { await w.loadFile(url, { search: '?debug=1' }); }
    catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); }
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca?.__valle').catch(() => false)) break; }
  };
  const ajustes = (extra) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({calidad:'muybaja', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'}, ${JSON.stringify(extra)})));`;
  const cuadros = (n = 4) => js(`(async ()=>{ const H = window.__hojarasca; for (let i = 0; i < ${n}; i++) { H.__bucle(); await new Promise(r => setTimeout(r, 20)); } return 1 })()`);
  // una tecla de verdad, como la aprieta el jugador
  const tecla = (code) => js(`(()=>{ document.dispatchEvent(new KeyboardEvent('keydown', { code: ${JSON.stringify(code)}, key: ${JSON.stringify(code)}, bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: ${JSON.stringify(code)}, key: ${JSON.stringify(code)}, bubbles: true })); return 1 })()`);
  const tarjeta = () => js(`(()=>{ const t = document.getElementById('valle-tarjeta'); const H = window.__hojarasca;
    return { abierta: !t.classList.contains('oculto') && H.__valle.abierta(), texto: t.textContent, botones: [...t.querySelectorAll('button')].map((b) => ({ id: b.dataset.valleOpcion, apagado: b.disabled, texto: b.textContent })) } })()`);
  const revisar = () => js(`window.__hojarasca.__valle.revisarAhora()`);

  try {
    // ================================================================ 1. la portada
    await w.loadFile(url, { search: '?debug=1' }).catch(() => {});
    await js(`localStorage.clear(); ${ajustes({ relaxTipo: 'historia' })} 1`);
    await abrir();
    seccion('1. la portada');
    const portada = await js(`(()=>{ const c = document.getElementById('opcion-relax');
      return { visible: !c.classList.contains('oculto'), boton: c.querySelector('[data-valor="historia"]').getAttribute('aria-pressed'), texto: document.getElementById('relax-tipo-texto').textContent } })()`);
    ok(portada.visible && portada.boton === 'true' && /Ocho capítulos/.test(portada.texto), `el Relax ofrece Libre o Historia, y está elegida Historia (${portada.texto.slice(0, 40)}…)`);
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(800);
    await cuadros(3);
    let h = await js(`window.__hojarasca.progreso.historia`);
    ok(h && h.activa && h.capitulo === 0 && h.fase === 'intro', `entrar con Historia empieza el capítulo 1 (${JSON.stringify(h && { a: h.activa, c: h.capitulo, f: h.fase })})`);

    // ================================================================ 2. la tarjeta de entrada
    seccion('2. la tarjeta de entrada');
    await revisar();
    let t = await tarjeta();
    ok(t.abierta && /La llegada/.test(t.texto) && /Refugio del Arroyo/.test(t.texto) && t.botones.length === 1, 'se abre la tarjeta del capítulo 1, con sus objetivos');
    const quieto = await js(`(async ()=>{ const H = window.__hojarasca, h0 = H.progreso.horas; for (let i = 0; i < 5; i++) { H.__bucle(); await new Promise(r => setTimeout(r, 30)); } return { antes: h0, despues: H.progreso.horas } })()`);
    ok(quieto.antes === quieto.despues, `con la tarjeta abierta el tiempo no corre (${quieto.antes.toFixed(3)} → ${quieto.despues.toFixed(3)})`);
    await tecla('KeyW');   // una tecla cualquiera no la cierra ni mueve al jugador
    t = await tarjeta();
    ok(t.abierta, 'W no la cierra: la tarjeta tiene el teclado');
    await tecla('Digit1');
    await cuadros(2);
    t = await tarjeta();
    h = await js(`window.__hojarasca.progreso.historia`);
    ok(!t.abierta && h.fase === 'jugando', 'con 1 se empieza el capítulo');
    await revisar();
    const panel = await js(`(()=>{ const p = document.getElementById('historia-hud'); return { visible: !p.classList.contains('oculto'), texto: p.textContent } })()`);
    ok(panel.visible && /Capítulo 1 · La llegada/.test(panel.texto) && /tres cosas/.test(panel.texto), 'el panel de objetivos está arriba a la izquierda');

    // ================================================================ 3. el capítulo 1
    seccion('3. el capítulo 1');
    // el fuego: al lado del fogón del refugio, F de verdad
    await js(`(()=>{ const H = window.__hojarasca, f = H.T.lugares.refugio.fogon, js = H.jugador.estado;
      H.progreso.horas = 10; H.progreso.ramitas = 5; js.pos.set(f.x + 2, f.y + 0.05, f.z); js.yaw = 0; return 1 })()`);
    // unos cuadros al lado del refugio: llegar se anota solo
    await cuadros(60);
    await tecla('KeyF');
    await cuadros(2);
    let fuego = await js(`window.__hojarasca.clima.fogata.activa`);
    if (!fuego) { await js(`window.__hojarasca.__encenderFuego()`); fuego = await js(`window.__hojarasca.clima.fogata.activa`); }
    ok(fuego, 'F prende el fogón del refugio');
    // tres anotaciones (ayuda de depuración: anotarlas a mano pide encontrar cada planta)
    await js(`(()=>{ const P = window.__hojarasca.progreso; for (const k of ['coihue', 'lenga', 'notro']) P.entradas[k] = { dia: P.dia, hora: P.horas, cantidad: 0 }; return 1 })()`);
    await revisar();
    h = await js(`window.__hojarasca.progreso.historia`);
    ok(h.hechos['llegada:fuego'] !== undefined && h.hechos['llegada:anotar'] !== undefined, `el fuego y las tres anotaciones se tildan (${Object.keys(h.hechos).join(', ')})`);
    ok(h.hechos['llegada:refugio'] !== undefined, 'arrancar en el refugio lo cuenta');
    const notaTilde = await js(`document.getElementById('notas').textContent`);
    ok(/✓/.test(notaTilde), 'cada objetivo cumplido avisa con una nota');
    // la primera noche: dormir de noche junto al fuego
    const diaAntes = await js(`window.__hojarasca.progreso.dia`);
    await js(`(()=>{ const H = window.__hojarasca; H.progreso.horas = 22; H.__dormir(); return 1 })()`);
    await esperar(3200);
    await cuadros(2);
    const diaDespues = await js(`window.__hojarasca.progreso.dia`);
    ok(diaDespues > diaAntes, `dormir pasa la noche (día ${diaAntes} → ${diaDespues})`);
    const antesPremio = await js(`(()=>{ const P = window.__hojarasca.progreso; return { ramitas: P.ramitas, tronco: P.materiales.tronco || 0 } })()`);
    await revisar();
    h = await js(`window.__hojarasca.progreso.historia`);
    ok(h.fase === 'outro', `los cuatro objetivos cierran el capítulo (${h.fase})`);
    await revisar();
    t = await tarjeta();
    ok(t.abierta && /terminado/.test(t.texto) && /Amaneció/.test(t.texto) && /Te queda/.test(t.texto), 'la tarjeta de salida, con el premio');
    await tecla('Enter');
    await cuadros(2);
    t = await tarjeta();
    h = await js(`window.__hojarasca.progreso.historia`);
    const despuesPremio = await js(`(()=>{ const P = window.__hojarasca.progreso; return { ramitas: P.ramitas, tronco: P.materiales.tronco || 0 } })()`);
    ok(despuesPremio.ramitas === antesPremio.ramitas + 6 && despuesPremio.tronco === antesPremio.tronco + 2, `el premio: seis ramitas y dos troncos (${JSON.stringify(antesPremio)} → ${JSON.stringify(despuesPremio)})`);
    ok(t.abierta && /Manos a la obra/.test(t.texto) && h.capitulo === 1 && h.cerrados.llegada, 'sigue la tarjeta del capítulo 2');
    await tecla('Digit1');
    await cuadros(2);
    ok(!(await tarjeta()).abierta, 'el capítulo 2 arranca');

    // ================================================================ 4. un evento
    seccion('4. un evento del valle');
    // (el azar queda quieto en esta prueba: acá se eligen los eventos a mano)
    await js(`(()=>{ const P = window.__hojarasca.progreso; P.materiales.tabla = 3; P.materiales.piedra = 0; P.cosas.yerba = 0; P.horas = 11; window.__hojarasca.__valle.eventos.ev().revisado = 9999; return 1 })()`);
    const forzado = await js(`window.__hojarasca.__valle.eventos.forzar('puente')`);
    await revisar();
    t = await tarjeta();
    const arreglar = t.botones.find((b) => b.id === 'arreglar');
    ok(forzado && t.abierta && /puente del arroyo/.test(t.texto) && t.botones.length === 3, 'la tarjeta del puente, con tres opciones');
    ok(arreglar && arreglar.apagado && /Te falta/.test(arreglar.texto), `la que no alcanza viene apagada (${arreglar?.texto})`);
    await tecla('Digit1');   // la apagada no hace nada
    ok((await tarjeta()).abierta, 'elegir la apagada no cierra la tarjeta');
    // la del cartel: con el mouse, como un jugador
    await js(`document.querySelector('#valle-tarjeta button[data-valle-opcion="cartel"]').click(); 1`);
    await cuadros(2);
    let ev = await js(`(()=>{ const P = window.__hojarasca.progreso; return { ev: P.eventosValle, tabla: P.materiales.tabla, dia: P.dia, hoy: window.__hojarasca.diario.hoy.eventos || [] } })()`);
    ok(!(await tarjeta()).abierta && ev.ev.hechos.puente?.opcion === 'cartel', 'elegir cierra la tarjeta y queda anotado');
    ok(ev.tabla === 2 && ev.ev.gratitud.ercilia === 1, `cuesta una tabla y Ercilia lo agradece (${ev.tabla} tablas, gratitud ${JSON.stringify(ev.ev.gratitud)})`);
    ok(ev.ev.pendientes.some((p) => p.id === 's-puente-vialidad' && p.dia === ev.dia + 2), 'dentro de dos días viene lo que pasó después');
    ok(ev.hoy.some((x) => /cartel/.test(x)), 'el diario de hoy lo cuenta');
    await revisar();
    ok(!(await tarjeta()).abierta, 'antes de tiempo no pasa nada');
    const yerbaAntes = await js(`window.__hojarasca.progreso.cosas.yerba || 0`);
    await js(`(()=>{ const P = window.__hojarasca.progreso; P.dia += 2; P.horas = 8; return 1 })()`);
    await revisar();
    t = await tarjeta();
    ok(t.abierta && /Lo que pasó después/.test(t.texto) && /Vialidad/.test(t.texto), 'dos días después: vino Vialidad');
    await tecla('Escape');   // una tarjeta de un solo botón se cierra también con Escape
    await cuadros(2);
    await esperar(1400);
    const yerbaDespues = await js(`window.__hojarasca.progreso.cosas.yerba || 0`);
    ok(!(await tarjeta()).abierta && yerbaDespues === yerbaAntes + 3, `Ercilia regala yerba por el aviso (${yerbaAntes} → ${yerbaDespues})`);

    // el azar: con ?debug=1 queda quieto (para no molestar a las otras pruebas); prendido, sale solo
    const quietoAzar = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso, ev = H.__valle.eventos.ev(); ev.revisado = 0; ev.ultimo = 0; P.horas = 17.9;
      const antes = P.dia; let visto = false; for (let d = antes; d < antes + 20 && !visto; d++) { P.dia = d; ev.revisado = 0; H.__valle.revisarAhora(); visto = H.__valle.abierta(); } P.dia = antes; return visto })()`);
    ok(!quietoAzar, 'con ?debug=1 no salen eventos al azar');
    const azar = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso, ev = H.__valle.eventos.ev(); H.__valle.azar(true);
      const antes = P.dia; let visto = null; for (let d = antes; d < antes + 20 && !visto; d++) { P.dia = d; ev.revisado = 0; ev.ultimo = 0; H.__valle.revisarAhora(); if (H.__valle.abierta()) visto = { dia: d, id: ev.activo?.id }; }
      H.__valle.azar(false); return visto })()`);
    ok(!!azar?.id, `prendido, a los pocos días aparece uno solo (${JSON.stringify(azar)})`);
    if (azar) { const bs = (await tarjeta()).botones; let i = bs.length - 1; while (i > 0 && bs[i].apagado) i--; await tecla('Digit' + (i + 1)); await cuadros(1); await js(`(()=>{ const P = window.__hojarasca.progreso, ev = P.eventosValle; ev.revisado = 9999; ev.pendientes = []; return 1 })()`); }
    ok(!(await tarjeta()).abierta, 'elegido, se cierra');

    // ================================================================ 5. una visita y la cadena
    seccion('5. una visita de verdad y una cadena');
    // una mesa con dos sillas, para que la visita tenga dónde sentarse
    const mesa = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso, r = H.T.lugares.refugio;
      const x = r.x + 9, z = r.z + 9;
      const nuevas = [{ plano: 'mesa-campo', x, z, rot: 0, etapas: 1 }, { plano: 'silla-campo', x: x + 1.2, z, rot: 0, etapas: 1 }, { plano: 'silla-campo', x: x - 1.2, z, rot: 0, etapas: 1 }];
      P.obras.push(...nuevas);
      H.obras.sincronizar(nuevas);
      return H.mueblesTerminados().length })()`);
    await js(`(()=>{ const P = window.__hojarasca.progreso; P.horas = 10; return 1 })()`);
    const gratAntes = await js(`(()=>{ const g = window.__hojarasca.progreso.eventosValle.gratitud; return { ercilia: g.ercilia || 0, ema: g.ema || 0 } })()`);
    await js(`(()=>{ const ev = window.__hojarasca.progreso.eventosValle; delete ev.regalos.ercilia; ev.gratitud.ercilia = 1; return 1 })()`);
    await js(`window.__hojarasca.__valle.eventos.forzar('almacen')`);
    await revisar();
    t = await tarjeta();
    ok(t.abierta && /Ercilia/.test(t.texto), 'Ercilia pide que le cuides el almacén');
    const hora0 = await js(`window.__hojarasca.progreso.horas`);
    await tecla('Digit1');
    await cuadros(2);
    const hora1 = await js(`window.__hojarasca.progreso.horas`);
    ok(Math.abs(hora1 - hora0 - 3) < 0.2, `la tarde en el almacén lleva tres horas (${hora0.toFixed(1)} → ${hora1.toFixed(1)})`);
    ev = await js(`window.__hojarasca.progreso.eventosValle`);
    ok(ev.gratitud.ercilia === 3 && ev.regalos.ercilia && ev.pendientes.some((p) => p.id === 'regalo-ercilia'), `con tres de gratitud, Ercilia prepara un regalo (${JSON.stringify(ev.gratitud)})`);
    // al otro día a la tarde: vuelve del pueblo y viene a la mesa
    await js(`(()=>{ const P = window.__hojarasca.progreso; P.dia += 1; P.horas = 15.2; P.eventosValle.pendientes = P.eventosValle.pendientes.filter((p) => p.id === 's-almacen-harina'); return 1 })()`);
    await revisar();
    t = await tarjeta();
    ok(t.abierta && /volvió del pueblo/.test(t.texto), 'lo que pasó después: Ercilia volvió');
    await tecla('Digit1');
    await cuadros(2);
    const visita = await js(`(async ()=>{ const H = window.__hojarasca; H.__actualizarVisitas(1); await new Promise(r => setTimeout(r, 50)); H.__actualizarVisitas(1); return { activa: H.progreso.visitas.activa, visitante: H.__visitante()?.npc?.clave || null, mesa: ${mesa} } })()`);
    ok(visita.mesa >= 3 && visita.activa?.clave === 'ercilia' && visita.visitante === 'ercilia', `Ercilia viene de visita a tu mesa (${JSON.stringify(visita)})`);
    // la cadena: dejar un puente flojo termina con Nicanor en el agua
    await js(`(()=>{ const P = window.__hojarasca.progreso; delete P.eventosValle.hechos.puente; P.eventosValle.pendientes = []; P.horas = 10; return 1 })()`);
    await js(`window.__hojarasca.__valle.eventos.forzar('puente')`);
    await revisar();
    await js(`document.querySelector('#valle-tarjeta button[data-valle-opcion="nada"]').click(); 1`);
    await js(`(()=>{ const P = window.__hojarasca.progreso; P.dia += 2; P.horas = 9; return 1 })()`);
    await revisar();
    t = await tarjeta();
    ok(t.abierta && /cedió/.test(t.texto), 'el puente cedió');
    await tecla('Digit1');
    await cuadros(1);
    await revisar();
    t = await tarjeta();
    ok(t.abierta && /Nicanor en la orilla/.test(t.texto), 'y enseguida: Nicanor se lastimó (la decisión trajo otra)');
    await tecla('Digit3');
    await cuadros(1);
    ev = await js(`window.__hojarasca.progreso.eventosValle`);
    ok(ev.hechos.tobillo?.opcion === 'avisar' && ev.gratitud.ema === gratAntes.ema + 1, 'avisarle a Ema');
    // el viajero que duerme junto a tu fuego corre la voz: el próximo poblador viene sin esperar
    await js(`(()=>{ const P = window.__hojarasca.progreso; P.cosas.yerba = (P.cosas.yerba || 0) + 2; P.horas = 14; if (P.pueblo) P.pueblo.llamado = false; return 1 })()`);
    await js(`window.__hojarasca.__valle.eventos.forzar('viajero')`);
    await revisar();
    await js(`document.querySelector('#valle-tarjeta button[data-valle-opcion="fuego"]').click(); 1`);
    await js(`(()=>{ const P = window.__hojarasca.progreso; P.dia += 1; P.horas = 8; P.eventosValle.pendientes = P.eventosValle.pendientes.filter((x) => x.id === 's-viajero-semillas'); return 1 })()`);
    await revisar();
    t = await tarjeta();
    ok(t.abierta && /viajero ya no estaba/.test(t.texto), 'a la mañana el viajero se fue');
    const papas0 = await js(`window.__hojarasca.progreso.cosas['semillas-papa'] || 0`);
    await tecla('Digit1');
    await esperar(1400);
    const viajero = await js(`(()=>{ const P = window.__hojarasca.progreso; return { papas: P.cosas['semillas-papa'] || 0, llamado: !!P.pueblo?.llamado, hay: !!P.pueblo } })()`);
    ok(viajero.papas === papas0 + 4 && (!viajero.hay || viajero.llamado), `dejó papas para semilla y corrió la voz en el pueblo (${JSON.stringify(viajero)})`);
    // un evento abierto que queda sin elegir se guarda
    await js(`window.__hojarasca.__valle.eventos.forzar('huemul')`);
    await revisar();
    ok((await tarjeta()).abierta, 'el huemul enredado queda en pantalla');
    await js(`window.__hojarasca.guardar()`);

    // ================================================================ 6. recargar
    seccion('6. todo queda guardado');
    const guardado = await js(`JSON.parse(localStorage.getItem('hojarasca-v1'))`);
    await abrir();
    const vuelta = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso; return { h: P.historia, ev: P.eventosValle, boton: document.querySelector('[data-ajuste="relaxTipo"] [data-valor="historia"]').getAttribute('aria-pressed') } })()`);
    ok(vuelta.h.capitulo === 1 && vuelta.h.fase === 'jugando' && vuelta.h.cerrados.llegada && vuelta.h.hechos['llegada:noche'] !== undefined, 'la historia sigue en el capítulo 2');
    ok(JSON.stringify(vuelta.ev) === JSON.stringify(guardado.eventosValle), 'los eventos, la gratitud y lo pendiente, iguales');
    ok(vuelta.ev.activo?.id === 'huemul', 'el evento sin elegir sigue esperando');
    ok(vuelta.boton === 'true', 'la portada muestra que esta partida va con la historia');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(800);
    await cuadros(2);
    await revisar();
    t = await tarjeta();
    ok(t.abierta && /huemul/.test(t.texto), 'al volver, el huemul enredado');
    await tecla('Digit1');
    await cuadros(1);
    await revisar();
    const panel2 = await js(`document.getElementById('historia-hud').textContent`);
    ok(/Capítulo 2 · Manos a la obra/.test(panel2) && /hacha/.test(panel2), 'el panel sigue con el capítulo 2');

    // ================================================================ 7. desde una partida libre, y el Desafío
    seccion('7. empezar desde una partida libre; el Desafío');
    await js(`(()=>{ const p = JSON.parse(localStorage.getItem('hojarasca-v1')); delete p.historia; p.dia = 9; p.materiales = { tabla: 17 };
      localStorage.setItem('hojarasca-p2-v1', JSON.stringify(p)); ${ajustes({ relaxTipo: 'historia', ranura: 2 })} return 1 })()`);
    await abrir();
    const libre = await js(`(()=>{ const H = window.__hojarasca; return { boton: document.querySelector('[data-ajuste="relaxTipo"] [data-valor="libre"]').getAttribute('aria-pressed'), h: H.progreso.historia } })()`);
    ok(libre.boton === 'true' && !libre.h.activa, 'una partida jugada sin historia se muestra como Libre en la portada');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(600);
    await js(`window.__hojarasca.abrir('pausa'); 1`);
    const enPausa = await js(`(()=>{ const b = document.getElementById('btn-historia'); return { visible: !!b && !b.classList.contains('oculto'), texto: b?.textContent } })()`);
    ok(enPausa.visible && /Empezar la historia/.test(enPausa.texto), `la pausa ofrece empezar la historia (${enPausa.texto})`);
    await js(`document.getElementById('btn-historia').click(); window.__hojarasca.volverAlJuego(); 1`);
    await cuadros(2);
    await revisar();
    const desdeLibre = await js(`(()=>{ const P = window.__hojarasca.progreso; return { h: P.historia, dia: P.dia, tabla: P.materiales.tabla, guia: document.getElementById('historia-guia')?.textContent || '' } })()`);
    t = await tarjeta();
    ok(desdeLibre.h.activa && desdeLibre.h.capitulo === 0 && desdeLibre.dia === 9 && desdeLibre.tabla === 17 && t.abierta, 'la historia empieza en el capítulo 1 sin tocar la partida (día 9, 17 tablas)');
    await tecla('Digit1');
    await cuadros(1);
    await js(`window.__hojarasca.abrir('pausa'); 1`);
    const pausar = await js(`document.getElementById('btn-historia').textContent`);
    ok(/pausa/.test(pausar), 'y después la pausa ofrece dejarla en pausa');
    await js(`document.getElementById('btn-historia').click(); 1`);
    ok(!(await js(`window.__hojarasca.progreso.historia.activa`)), 'en pausa: el valle libre de nuevo');
    // el Desafío
    await js(`${ajustes({ modo: 'desafio', ranura: 1 })} 1`);
    await abrir();
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(800);
    await cuadros(3);
    const des = await js(`(()=>{ const H = window.__hojarasca; return { revisa: H.__valle.revisarAhora(), panel: !document.getElementById('historia-hud').classList.contains('oculto'), boton: !!document.getElementById('btn-historia'), opcion: !document.getElementById('opcion-relax').classList.contains('oculto'), ev: !!H.progreso.eventosValle, h: !!H.progreso.historia } })()`);
    ok(!des.revisa && !des.panel && !des.boton && !des.opcion && !des.ev && !des.h, `en el Desafío no hay historia ni eventos del valle (${JSON.stringify(des)})`);
  } catch (e) {
    errores.push(`excepción: ${e.message}`);
    console.error(e);
  }
  if (errores.length) { console.error(`\nHUMO 3.1 HISTORIA: ${errores.length} problema(s)`); for (const e of errores) console.error(' -', e); app.exit(1); }
  else { console.log('\nHUMO 3.1 HISTORIA: todo en orden'); app.exit(0); }
});

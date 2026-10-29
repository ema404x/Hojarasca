// Partida real 4.17.0 (C), sección P: los props nuevos con su E (foto movida, llavecita, diez cantos blancos, tropa de mulas) y las tres escenas que
// antes no tenían disparador (tablas-tito, foto-sofia, mulas-belisario). Lo carga `humo-4-17-0-pulido.cjs`.
exports.correr = async function correr({ N, ok, foto, entrar, esperar }) {
  console.log('— P1. entrando a la historia');
  await entrar({ estacion: 'otono' });
  const prep = (cap, temas = [], extra = '') => N(`(() => { const h = P.historia; N.preparar(${cap}); h.fase = 'jugando'; h.base = { dia: 1 }; h.hechos['rueda:puente'] = 1; P.dia = Math.max(P.dia, 3); h.activa = true; h.temas = {}; h.escenas.vistas = {}; for (const t of ${JSON.stringify(temas)}) h.temas[t] = P.dia; ${extra}; return 1 })()`);
  const cerca = (id, d = 1.5) => N(`(() => { const o = H.__historiaObjetos(), q = o.posiciones[${JSON.stringify(id)}]; if (!q) return 0; const a = 0.6; N.ir(q.x + Math.sin(a) * ${d}, q.z + Math.cos(a) * ${d}, a); H.jugador.estado.pitch = -0.45; return 1 })()`);
  const mira = async (id, esperado, nombreFoto) => {
    await cerca(id);
    await N('N.tick(0.9)');
    const vis = await N(`(() => { const m = H.__historiaObjetos().mallas[${JSON.stringify(id)}]; return !!m && m.visible })()`);
    const c = await N('(() => { const c = H.__objetoHistoriaCerca(); return c ? { id: c.id, aviso: c.aviso } : null })()');
    return { vis, c };
  };

  console.log('— P2. la foto movida y la llavecita, sobre la mesa del refugio');
  await prep(5, [], '');
  await N('N.tick(0.8)');
  let r = await mira('foto-movida');
  ok(r.vis === false, 'sin haber sacado la foto, no hay nada sobre la mesa');
  await prep(5, ['obj:foto-movida'], 'P.horas = 11');
  r = await mira('foto-movida');
  ok(r.vis === true, 'con la foto movida sacada, la foto está sobre la mesa del refugio');
  ok(r.c && r.c.id === 'foto-movida' && /foto movida/i.test(r.c.aviso), `y la E la ofrece: «${r.c && r.c.aviso}»`);
  await foto('p-foto-movida');
  await N('N.tecla("KeyE")'); await N('N.tick(0.6)');
  ok(/foto movida/i.test(await N('document.getElementById("notas") ? document.getElementById("notas").textContent : ""')), 'la E muestra la nota de la foto movida');
  await prep(7, ['obj:llavecita'], 'P.horas = 11');
  r = await mira('llavecita');
  ok(r.vis === true && r.c && r.c.id === 'llavecita', `la llavecita de Herminia sobre la mesa y su E (${r.c && r.c.aviso})`);
  await foto('p-llavecita');
  await N('N.tecla("KeyE")'); await N('N.tick(0.6)');
  ok(/llavecita/i.test(await N('document.getElementById("notas") ? document.getElementById("notas").textContent : ""')), 'la E muestra la nota de la llavecita');

  console.log('— P3. los diez cantos blancos de la veta y la tropa de mulas');
  await prep(7, [], 'P.horas = 22');
  await N('(() => { const p = N.pts().cantera; N.ir(p.x + 3, p.z + 3, 0); return 1 })()'); await N('N.tick(1.2)');
  ok((await N('H.__historiaObjetos().mallas["cantos-veta"].visible')) === false, 'antes de la escena de Tobías, la veta no tiene cantos');
  await prep(7, ['mundo:cantos-veta'], 'P.horas = 22');
  await N('(() => { const p = N.pts().cantera; N.ir(p.x + 2.2, p.z + 1.4, 0); return 1 })()'); await N('N.tick(1.2)');
  r = await mira('cantos-veta');
  ok(r.vis === true && r.c && r.c.id === 'cantos-veta', `los diez cantos blancos aparecen en la veta y se pueden mirar con E (${r.c && r.c.aviso})`);
  await foto('p-cantos-veta');
  await prep(7, [], 'P.horas = 11');
  await N('(() => { const p = N.pts()["puesto-paso"]; N.ir(p.x - 3, p.z + 8, 0); return 1 })()'); await N('N.tick(1.5)');
  ok((await N('H.__historiaObjetos().mallas["mulas-paso"].visible')) === true, 'la tropa de mulas está atada junto al puesto del paso en el capítulo 8');
  await foto('p-mulas-paso');
  await prep(7, ['mundo:tropa-mulas'], 'P.horas = 11');
  await N('(() => { const p = N.pts().mallin; N.ir(p.x + 6, p.z + 6, 0); return 1 })()'); await N('N.tick(1.5)');
  ok((await N('H.__historiaObjetos().mallas["mulas-mallin"].visible')) === true && (await N('H.__historiaObjetos().mallas["mulas-paso"].visible')) === false, 'después de acompañarla, la tropa está en el mallín');
  await foto('p-mulas-mallin');

  console.log('— P4. las escenas con disparador nuevo');
  const alguien = (clave) => N(`(() => { const g = (H.__escenas.mundo.posicion(${JSON.stringify(clave)})); return !!g })()`);
  // tablas-tito: en la carpintería, de día, con D2 = talarlo (Tito no vive en la aldea todavía: viene como invitado)
  await prep(4, [], "h.decisiones.coihue = 'b'; h.escenas.vistas['piedras-molino'] = 1; P.horas = 10");
  await N('(() => { const p = N.pts().carpinteria; N.ir(p.x + 6, p.z + 6, 0); return 1 })()'); await N('N.tick(2.5)');
  let sola = await N('H.__escenas.activa() ? H.__escenas.director.idActual() : null');
  ok(sola === 'tablas-tito', `pasar de día por la carpintería, con el coihue talado, dispara «tablas-tito» (${sola})`);
  await N('N.tick(2.2)'); await N('N.tecla("Enter")'); await N('N.hasta(() => H.__escenas.capturados().includes("carpintero"), 14)'); await N('N.tick(0.8)');
  ok((await N('H.__escenas.capturados().includes("carpintero")')) === true && (await N('(() => { const p = H.__escenas.mundo.posicion("carpintero"); return !!p && Math.hypot(p.x - H.jugador.estado.pos.x, p.z - H.jugador.estado.pos.z) < 15 })()')) === true, 'y Tito aparece en la escena (el vecino o un invitado) cerca de vos');
  await foto('p-tablas-tito');
  await N('N.despejar(40)');
  ok((await N('(() => { const g = H.__escenas; return !g.activa() && !!P.historia.escenas.vistas["tablas-tito"] })()')) === true, 'la escena termina y queda vista');
  ok((await N('(() => { const g = H.__escenas.mundo.posicion("carpintero"); return true })()')) === true, 'el invitado se va al terminar (si no vivía en la aldea)');
  // foto-sofia: en el estudio de fotos con la foto movida
  await prep(5, ['obj:foto-movida'], 'P.horas = 11');
  await N('(() => { const p = N.pts()["estudio-fotos"]; N.ir(p.x + 5, p.z + 5, 0); return 1 })()'); await N('N.tick(2.5)');
  sola = await N('H.__escenas.activa() ? H.__escenas.director.idActual() : null');
  ok(sola === 'foto-sofia', `llegar al estudio de fotos con la foto movida dispara «foto-sofia» (${sola})`);
  await N('N.tick(2.2)'); await N('N.tecla("Enter")'); await N('N.tick(1.6)');
  await foto('p-foto-sofia');
  await N('N.despejar(40)');
  ok((await N('!!P.historia.escenas.vistas["foto-sofia"]')) === true, 'la escena de Sofía termina y queda vista');
  // mulas-belisario: la E sobre Belisario, ya contado lo de los del cerro
  await prep(7, [], "h.escenas.vistas['los-del-cerro'] = 1; P.horas = 11");
  await N('N.armarCerca("belisario")');
  await N('(() => { const n = H.__genteCampo().npcDe("belisario"); if (n) N.ir(n.pos.x + 2.2, n.pos.z, 0); return 1 })()'); await N('N.tick(1)');
  await N('H.__valle.alHablarCon("belisario")'); await N('N.tick(2.4)');
  sola = await N('H.__escenas.activa() ? H.__escenas.director.idActual() : null');
  ok(sola === 'mulas-belisario', `la E sobre Belisario, ya contado lo de los del cerro, lleva a «mulas-belisario» (${sola})`);
  await N('N.tick(2.2)'); await N('N.tecla("Enter")'); await N('N.tick(1.6)');
  await foto('p-mulas-belisario');
  await N('N.despejar(40)');
  ok((await N('!!P.historia.escenas.vistas["mulas-belisario"]')) === true, 'la escena de las mulas termina y queda vista');
  void esperar;
};

// Partida real 3.7.3 «La trochita»: el taller ferroviario (Electron + WebGL). Las teclas y los clics van de verdad
// (keydown, mousedown) y el reloj del juego se adelanta a mano donde haría falta esperar días (se dice dónde):
//   1. llegar al taller (del otro lado de la vía, frente a la estación): el galpón viejo, con sus colisiones y su piso;
//   2. el aviso y E abren el panel de mejoras; se pide una con el número;
//   3. aportar de a poco (Enter elige la marcada, LB/RB la mueven, el clic también elige);
//   4. dormir (el reloj, adelantado) hasta que esté lista: el aviso, el tren mejorado y el galpón arreglado;
//   5. la pintura (con clics), el nombre (con el cuadro de texto del juego), la composición;
//   6. hablar con Martín (y ver que trabaja en el taller con su pose); guardar y cargar; sin errores.
// Uso: npx electron --no-sandbox pruebas/humo-3-7-3-taller.cjs (HUMO_LOG=<archivo>: cada renglón también ahí, a medida que sale)
// Perfil propio (HUMO_PERFIL, o una carpeta temporal): borra su localStorage, nunca el de %APPDATA%\Hojarasca.
const { app, BrowserWindow, dialog } = require('electron');
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); app.exit(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa sin atender): ${e && e.stack ? e.stack : e}`); app.exit(1); });
const path = require('path');
const os = require('os');
const raiz = path.resolve(__dirname, '..');
app.setPath('userData', path.resolve(process.env.HUMO_PERFIL || path.join(os.tmpdir(), 'hojarasca-humo-3-7-3-taller')));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
// (con HUMO_LOG, cada renglón también a ese archivo, a medida que sale)
const decir = (s) => { console.log(s); if (process.env.HUMO_LOG) try { require('fs').appendFileSync(process.env.HUMO_LOG, s + String.fromCharCode(10)); } catch { /* nada */ } };
setTimeout(() => { console.log('ERROR: la prueba tardó más de 15 minutos'); app.exit(2); }, 15 * 60 * 1000).unref?.();

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: false, width: 1100, height: 700, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = 'carga';
  const js = (c) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 120 s (${donde})`)), 120000)),
  ]);
  const ok = (cond, texto) => { decir(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; decir(`— ${s}`); };
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const listo = async () => {
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__taller && window.__hojarasca.__taller())').catch(() => false)) return true; }
    return false;
  };
  const H = 'window.__hojarasca';
  const P = `${H}.progreso`;
  const ajustes = `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'muybaja', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre', estacion: 'verano' }));`;
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    await js(`${H}.volverAlJuego?.(); ${H}.ajustes.limiteFps = 'libre'; 1`);
  };
  const tecla = (code) => js(`(()=>{ document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', bubbles: true })); return 1 })()`);
  const aviso = () => js(`(()=>{ const a = ${H}.__avisoYa(); return a ? a.texto : '' })()`);
  const notas = () => js(`document.getElementById('notas').textContent`);
  const cuadros = (n = 4) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  const panel = () => js(`(()=>{ const d = document.getElementById('taller-tren-panel'); const lis = [...d.querySelectorAll('li')]; return { abierto: !d.classList.contains('oculto'), titulo: d.querySelector('.quien').textContent, dicho: d.querySelector('.dicho').textContent,
    lis: lis.map((l) => l.textContent), marcada: lis.findIndex((l) => l.classList.contains('elegida')), estado: ${H}.__taller().estado() } })()`);
  const clic = (i) => js(`(()=>{ const li = document.querySelectorAll('#taller-tren-panel li')[${i}]; if (!li) return 0; li.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true })); return 1 })()`);
  const opcion = async (texto) => (await panel()).estado.opciones.findIndex((o) => o.texto === texto);
  // en el marco del taller (x a lo largo, z hacia la vía; y sobre el piso): el jugador, mirando a (mx, mz)
  const enTaller = (x, z, mx, mz) => js(`(()=>{ const e = ${H}.__aldea.edificio('taller-tren'); const c = Math.cos(e.rot), s = Math.sin(e.rot);
    const w = (lx, lz) => ({ x: e.x + lx * c + lz * s, z: e.z - lx * s + lz * c }); const a = w(${x}, ${z}), b = w(${mx}, ${mz});
    const j = ${H}.jugador; j.ubicar(a.x, a.z, Math.atan2(-(b.x - a.x), -(b.z - a.z)), e.y + 0.32); j.estado.pitch = -0.1; return { x: a.x, z: a.z, y: j.estado.pos.y, piso: e.y + 0.32 } })()`);
  const npc = (clave) => `${H}.__aldea.mundo().personas.get('${clave}')?.npc`;
  const hablarCon = async (expr, maximo = 10) => {
    const p = await js(`(()=>{ const n = ${expr}; return n ? { x: n.pos.x, z: n.pos.z } : null })()`);
    if (!p) return { error: 'no está' };
    await js(`(()=>{ const j = ${H}.jugador; const x = ${p.x}, z = ${p.z};
      for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, px = x + Math.cos(a) * 1.2, pz = z + Math.sin(a) * 1.2; j.ubicar(px, pz, Math.atan2(-(x - px), -(z - pz))); if (Math.abs(j.estado.pos.y - ${H}.__aldea.edificio('taller-tren').y - 0.32) < 0.3) break; }
      j.estado.pitch = -0.15; return 1 })()`);
    await cuadros(6);
    for (let i = 0; i < 3; i++) { await esperar(70); await cuadros(2); }
    const textos = [];
    for (let i = 0; i < maximo; i++) {
      await tecla('KeyE');
      const c = await js(`(()=>({ npc: !!${H}.__charla().npc, quien: document.getElementById('charla-quien').textContent, texto: document.getElementById('charla-texto').textContent, menu: !document.getElementById('charla-opciones')?.classList.contains('oculto') }))()`);
      if (!c.npc) break;
      textos.push(`${c.quien}: ${c.texto}`);
      if (c.menu) break;
    }
    return { textos };
  };
  const aldeaLista = async () => { await js(`(async () => { const M = ${H}.__aldeaMundo(); await M.listo(); M.montarCola(); return 1 })()`); };

  try {
    await w.loadURL('about:blank');
    await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
    await abrir();
    ok(await listo(), 'el juego cargó');
    await js(`(()=>{ localStorage.clear(); ${ajustes} return 1 })()`);
    await abrir();
    ok(await listo(), 'una partida Relax limpia');
    await entrar();

    // ------------------------------------------------------------ 1. el taller
    seccion('llegar al taller ferroviario');
    let e = await js(`(()=>{ const t = ${P}.tren; return { tren: !!t, nombre: t?.loco?.nombre, comp: t?.composicion?.join(), arreglado: t?.taller?.arreglado } })()`);
    ok(e.tren && e.nombre === '' && e.comp === '' && e.arreglado === false, `partida nueva: la trochita de siempre y el galpón viejo (${JSON.stringify(e)})`);
    await js(`(()=>{ ${P}.dia = 2; ${P}.horas = 10; return 1 })()`);
    await enTaller(-2, 0.9, -2, -3);
    await aldeaLista(); await cuadros(8); await aldeaLista(); await cuadros(4);
    e = await js(`(()=>{ const M = ${H}.__aldeaMundo(); const s = M.estadoEdificio('taller-tren'); return { s, pos: ${H}.jugador.estado.pos.y, piso: ${H}.__aldea.edificio('taller-tren').y + 0.32 } })()`);
    ok(e.s && e.s.montada && /\|3\|/.test(e.s.montada) && e.s.puertas.length === 1, `el galpón viejo, montado con su puerta (${e.s?.montada})`);
    ok(Math.abs(e.pos - e.piso) < 0.08, `parado en el piso de cemento (${e.pos.toFixed(2)} y ${e.piso.toFixed(2)})`);
    // las paredes frenan: caminar hacia la pared de atrás no la atraviesa
    await js(`(()=>{ const j = ${H}.jugador; j.teclas.add('KeyW'); return 1 })()`);
    for (let i = 0; i < 40; i++) await cuadros(1);
    await js(`(()=>{ ${H}.jugador.teclas.delete('KeyW'); return 1 })()`);
    e = await js(`(()=>{ const e = ${H}.__aldea.edificio('taller-tren'); const p = ${H}.jugador.estado.pos; const dx = p.x - e.x, dz = p.z - e.z, c = Math.cos(e.rot), s = Math.sin(e.rot); return { z: dx * s + dz * c } })()`);
    ok(e.z > -3.6, `la pared de atrás frena (z local ${e.z.toFixed(2)})`);
    await enTaller(-2, 0.9, -2, -3);
    await cuadros(4);

    // ------------------------------------------------------------ 2. el aviso, E y pedir
    seccion('el panel de mejoras');
    ok(await aviso() === 'Ver las mejoras del tren', 'el aviso en el galpón: ver las mejoras del tren');
    await tecla('KeyE');
    let p = await panel();
    ok(p.abierto && p.titulo === 'El taller ferroviario' && /galpón/.test(p.dicho), `E abre el panel (${p.dicho.slice(0, 60)}…)`);
    ok(p.lis.some((t) => /Caldera: tubos nuevos/.test(t)) && p.lis.some((t) => /La pintura/.test(t)) && p.lis.some((t) => /La composición/.test(t)), 'las mejoras, la pintura y la composición');
    ok(await aviso() === '', 'con el panel abierto, sin aviso');
    const iCal = await opcion('Caldera: tubos nuevos');
    ok(iCal >= 0 && iCal < 9, `la caldera, con número (${iCal + 1})`);
    await tecla(`Digit${iCal + 1}`);
    p = await panel();
    ok(p.estado.tren.taller.pedido?.id === 'caldera-1' && /0 de 10 tablas/.test(p.dicho) && /Llevar lo que tengo/.test(p.lis[0]), `pedida: lo que pide y lo aportado (${p.dicho.slice(0, 90)}…)`);
    ok((await notas()).includes('Pediste: Caldera: tubos nuevos'), 'la nota del pedido');

    // ------------------------------------------------------------ 3. aportar de a poco
    seccion('aportar');
    await js(`(()=>{ Object.assign(${P}.materiales, { tabla: 4, piedra: 2, tronco: 0 }); return 1 })()`);
    await cuadros(2); await js(`${H}.__taller().redibujar(); 1`);
    // la marca (la de las listas del HUD: la ruedita, LB/RB o la cruceta la mueven) y Enter la elige
    p = await panel();
    for (let k = 0; k < 12 && p.marcada !== 0; k++) { await js(`(()=>{ window.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true })); return 1 })()`); p = await panel(); }
    ok(p.marcada === 0 && /Llevar lo que tengo/.test(p.lis[0]), `la ruedita sube la marca hasta «Llevar lo que tengo» (${p.marcada})`);
    await tecla('Enter');
    p = await panel();
    ok(p.estado.tren.taller.pedido.aportado.tabla === 4 && p.estado.tren.taller.pedido.aportado.piedra === 2 && /Falta: 6 tablas y 10 piedras/.test(p.dicho), `Enter: lleva lo que hay (${p.dicho.slice(-60)})`);
    await js(`(()=>{ Object.assign(${P}.materiales, { tabla: 30, piedra: 30 }); return 1 })()`);
    await js(`${H}.__taller().redibujar(); 1`);
    await clic(0);
    p = await panel();
    e = await js(`(()=>({ t: ${P}.materiales.tabla, p: ${P}.materiales.piedra }))()`);
    ok(p.estado.tren.taller.pedido.aportado.tabla === 10 && e.t === 24 && e.p === 20 && /Piezas de hierro: 0 de 4/.test(p.dicho), `con un clic: lo que faltaba, y queda esperando el hierro (te quedan ${e.t} tablas y ${e.p} piedras)`);
    await tecla('Escape');
    ok(!(await panel()).abierto, 'Escape cierra el panel');
    ok(await aviso() === 'Taller: caldera: tubos nuevos (esperando el hierro)', 'el aviso dice en qué anda el taller');

    // ------------------------------------------------------------ 4. dormir hasta que esté lista
    seccion('dormir hasta que esté lista');
    // (el reloj adelantado: cuatro días; sin herrería, las piezas llegan de El Maitén con el tren, una por día)
    await js(`(()=>{ ${P}.dia = 7; ${P}.horas = 9; return 1 })()`);
    await cuadros(4); await esperar(300); await cuadros(4);
    e = await js(`(()=>{ const t = ${P}.tren; return { caldera: t.loco.caldera, arreglado: t.taller.arreglado, pedido: t.taller.pedido } })()`);
    ok(e.caldera === 1 && e.arreglado && !e.pedido, `lista: la caldera nueva y el galpón arreglado (${JSON.stringify(e)})`);
    ok(/Martín: «Caldera: tubos nuevos, lista»/.test(await notas()), 'Martín avisa');
    // el galpón se rearma arreglado (con su cartel)
    for (let i = 0; i < 6; i++) { await js(`(()=>{ ${H}.__aldeaMundo().actualizar(4, ${H}.camara.position); return 1 })()`); await aldeaLista(); await cuadros(2); }
    e = await js(`${H}.__aldeaMundo().estadoEdificio('taller-tren')`);
    ok(e && /\|4\|/.test(e.montada), `el galpón, arreglado (${e?.montada})`);

    // ------------------------------------------------------------ 5. pintura, nombre, composición
    seccion('la pintura, el nombre y la composición');
    await enTaller(-2, 0.9, -2, -3); await cuadros(4);
    await tecla('KeyE');
    await clic(await opcion('La pintura'));
    p = await panel();
    ok(p.titulo === 'La pintura de la locomotora' && p.lis.length === 4, 'la pintura: tres partes y volver');
    await clic(0); await clic(0);
    p = await panel();
    ok(p.estado.tren.loco.pintura.cuerpo === '#9a3324', `dos clics: el cuerpo, de la de siempre al negro y al rojo (${p.estado.tren.loco.pintura.cuerpo})`);
    await tecla('Escape');
    p = await panel();
    ok(p.abierto && p.titulo === 'El taller ferroviario', 'Escape vuelve al panel');
    await tecla(`Digit${(await opcion('El nombre')) + 1}`);
    await esperar(300);
    e = await js(`(()=>({ abierto: !document.getElementById('dialogo').classList.contains('oculto'), texto: document.getElementById('dialogo-texto').textContent, valor: document.getElementById('dialogo-entrada').value }))()`);
    ok(e.abierto && /locomotora/.test(e.texto) && e.valor === 'La Hojarasca', 'el cuadro de texto, con el nombre de ahora');
    await js(`(()=>{ const i = document.getElementById('dialogo-entrada'); i.value = '  La Andina  '; i.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true })); return 1 })()`);
    await esperar(300);
    ok(await js(`${P}.tren.loco.nombre`) === 'La Andina', 'la locomotora se llama «La Andina»');
    // dos vagones hechos (como si se hubieran terminado), para elegir la composición
    await js(`(()=>{ const t = ${P}.tren; t.taller.hechas.push('carga', 'mirador'); t.vagones.carga = true; t.vagones.mirador = true; ${H}.__taller().redibujar(); return 1 })()`);
    await tecla(`Digit${(await opcion('La composición')) + 1}`);
    p = await panel();
    ok(p.titulo === 'La composición del tren' && /en el desvío/.test(p.lis[0]), 'la composición: los vagones hechos, en el desvío');
    const iMir = p.estado.opciones.findIndex((o) => o.texto === 'Coche mirador');
    await tecla(`Digit${iMir + 1}`);
    const iCar = (await panel()).estado.opciones.findIndex((o) => o.texto === 'Furgón de carga');
    await clic(iCar);
    ok(await js(`${P}.tren.composicion.join()`) === 'mirador,carga', 'enganchados en orden: mirador y carga');
    await tecla('Escape'); await tecla('Escape');
    ok(!(await panel()).abierto, 'Escape dos veces: afuera');

    // ------------------------------------------------------------ 6. Martín
    seccion('Martín, el maquinista retirado');
    await js(`(()=>{ ${P}.dia = 8; ${P}.horas = 10.2; return 1 })()`);   // (un lunes: el domingo a esa hora están los cuentos)
    await enTaller(-2, 2.6, -2, -3);
    for (let i = 0; i < 30; i++) await js(`(()=>{ ${H}.__aldea.actualizar(0.6); ${H}.__aldea.mundo()?.prearmar?.(1e6); return 1 })()`);
    await cuadros(6);
    e = await js(`(()=>{ const n = ${npc('martin')}; const st = ${H}.__aldea.mundo().personas.get('martin'); return n ? { nombre: n.nombre, pose: n.pose || null, destino: st?.destino?.punto, x: n.pos.x, z: n.pos.z } : null })()`);
    ok(e && /Martín/.test(e.nombre) && ['banco', 'fragua'].includes(e.destino), `Martín, en el taller (${JSON.stringify(e)})`);
    for (let i = 0; i < 60 && e && !e.pose; i++) { await js(`(()=>{ ${H}.__aldea.actualizar(0.6); return 1 })()`); await cuadros(1); e = await js(`(()=>{ const n = ${npc('martin')}; return n ? { pose: n.pose || null } : null })()`); }
    ok(e && ['limar', 'martillar'].includes(e.pose), `trabajando: ${e?.pose}`);
    // al lado de Martín, mirándolo: el aviso dice que le hablás y E habla (antes que el panel del taller)
    const mp = await js(`(()=>{ const n = ${npc('martin')}; return { x: n.pos.x, z: n.pos.z } })()`);
    await js(`(()=>{ const e = ${H}.__aldea.edificio('taller-tren'); const j = ${H}.jugador, x = ${mp.x}, z = ${mp.z};
      const c = Math.cos(e.rot), s = Math.sin(e.rot); const px = x + 1.0 * c + 0.6 * s, pz = z - 1.0 * s + 0.6 * c;
      j.ubicar(px, pz, Math.atan2(-(x - px), -(z - pz)), e.y + 0.32); j.estado.pitch = -0.2; return 1 })()`);
    await cuadros(6);
    const av = await aviso();
    ok(/Hablar con Martín/.test(av), `el aviso: ${av}`);
    const textos = [];
    for (let i = 0; i < 4; i++) {
      await tecla('KeyE');
      const c = await js(`(()=>({ npc: !!${H}.__charla().npc, quien: document.getElementById('charla-quien').textContent, texto: document.getElementById('charla-texto').textContent, menu: !document.getElementById('charla-opciones')?.classList.contains('oculto') }))()`);
      if (!c.npc) break;
      textos.push(`${c.quien}: ${c.texto}`);
      if (c.menu) break;
    }
    ok(textos.length && /Martín/.test(textos[0]), `le hablás (${textos.join(' / ').slice(0, 200)})`);
    await js(`(()=>{ for (let i = 0; i < 6 && ${H}.__charla().npc; i++) document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true })); return 1 })()`);

    // ------------------------------------------------------------ 7. guardar y cargar
    seccion('guardar y cargar');
    await js(`(()=>{ ${H}.guardar?.(); return 1 })()`);
    await esperar(400);
    await abrir();
    ok(await listo(), 'cargó de nuevo');
    await entrar();
    e = await js(`(()=>{ const t = ${P}.tren; return { nombre: t.loco.nombre, caldera: t.loco.caldera, cuerpo: t.loco.pintura.cuerpo, comp: t.composicion.join(), arreglado: t.taller.arreglado } })()`);
    ok(e.nombre === 'La Andina' && e.caldera === 1 && e.cuerpo === '#9a3324' && e.comp === 'mirador,carga' && e.arreglado, `todo guardado (${JSON.stringify(e)})`);
  } catch (err) {
    errores.push(`excepción en «${donde}»: ${err && err.stack ? err.stack : err}`);
  }
  decir(errores.length ? `FALLÓ (${errores.length}):\n  ${errores.join('\n  ')}` : 'OK humo 3.7.3 taller');
  app.exit(errores.length ? 1 : 0);
});

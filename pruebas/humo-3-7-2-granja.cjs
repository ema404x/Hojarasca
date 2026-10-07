// Partida real 3.7.2 «La cocina», la granja (Electron + WebGL). Los días se apuran a mano (se dice dónde); lo demás,
// con las teclas y el menú de la charla de verdad:
//   1. partida nueva: la granja vacía; las mallas de la granja ya en la escena (se compilaron al cargar);
//   2. el tambo (O → Trabajo) y la vaca: hablarle a Don Ramón, «Cambiar algo de campo…», la vaca con su ternero;
//   3. ordeñar con E a la mañana: el aviso lo dice, aparece el balde, +4 litros de leche; una vez por día;
//   4. el chiquero y la chancha (Ayelén), las sobras a la batea con E, unos días y la camada de lechones (se ven);
//   5. el hoyo para frutal, el plantín de Gladys plantado con E, pasan las estaciones: flor en primavera, fruta en otoño
//      (se junta con E), pelado y sin fruta en invierno (ni en el árbol ni en el piso);
//   6. carnear el novillo: E pregunta, E confirma, el fundido; al otro día a la mañana, la carne de vaca;
//   7. guardar y cargar: todo sigue; sin programas nuevos a mitad de juego; sin errores en la consola.
// Uso: npx electron --no-sandbox -r herramientas/al-monitor.cjs -r herramientas/perfil-propio.cjs pruebas/humo-3-7-2-granja.cjs
// Perfil propio (HUMO_PERFIL, o una carpeta temporal): borra su localStorage, nunca el de %APPDATA%\Hojarasca.
const { app, BrowserWindow, dialog } = require('electron');
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); app.exit(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa sin atender): ${e && e.stack ? e.stack : e}`); app.exit(1); });
const path = require('path');
const os = require('os');
const raiz = path.resolve(__dirname, '..');
app.setPath('userData', path.resolve(process.env.HUMO_PERFIL || path.join(os.tmpdir(), 'hojarasca-humo-3-7-2-granja')));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
// blindada: si algo se cuelga, sale sola (nunca hace falta matar electron por nombre)
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
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const H = 'window.__hojarasca';
  const P = `${H}.progreso`;
  const GJ = `${H}.__granja.juego()`, GM = `${H}.__granja.mundo()`;
  const listo = async () => {
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(window.__hojarasca && window.__hojarasca.__granja && window.__hojarasca.__granja.juego() && window.__hojarasca.__aldea)`).catch(() => false)) return true; }
    return false;
  };
  const ajustes = (extra) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({ calidad: 'muybaja', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre', estacion: 'auto' }, ${JSON.stringify(extra || {})})));`;
  const entrar = async () => { await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500); await js(`${H}.volverAlJuego?.(); ${H}.ajustes.limiteFps = 'libre'; 1`); };
  const tecla = (code) => js(`(()=>{ document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', bubbles: true })); return 1 })()`);
  const cuadros = (n = 4) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  const asentar = async (t = 3) => { await cuadros(4); for (let i = 0; i < t; i++) { await esperar(110); await cuadros(2); } };
  const aviso = () => js(`(()=>{ const a = ${H}.__avisoYa(); return a ? a.texto : '' })()`);
  const notas = () => js(`document.getElementById('notas').textContent`);
  const cant = (k) => js(`(${P}.entradas['${k}']?.cantidad || 0)`);
  // la granja al día (los días se apuran a mano: P.dia y P.horas) y los animales acomodados
  // (con unos cuadros de verdad: la geometría de cada animal y de cada frutal se arma de a una, cuando el planificador deja)
  const granja = async (n = 20) => { await js(`(()=>{ const G = ${GJ}; G.refrescar(); G.avanzar(); for (let i = 0; i < 10; i++) ${H}.__bucle(); return 1 })()`); await asentar(2); return js(`(()=>{ const M = ${GM}, js = ${H}.jugador.estado; for (let i = 0; i < ${n}; i++) M.actualizar(0.1, ${P}.horas, js.pos, []); return 1 })()`); };
  const dia = async (d, h) => { await js(`(()=>{ ${P}.dia = ${d}; ${P}.horas = ${h}; return 1 })()`); await granja(5); };
  // una obra terminada cerca de (x, z) (prueba lugares alrededor)
  const construir = (id, x, z, rot = 0) => js(`(()=>{ const H = ${H}, O = H.obras, P = H.progreso, T = H.T;
    const m0 = { ...P.materiales }; Object.assign(P.materiales, { tronco: 200, tabla: 200, piedra: 200 });
    const p = H.PLANOS.find((q) => q.id === '${id}'); if (!p) return { error: 'no hay plano ${id}' };
    O.elegir(p);
    for (const d of [0, 1.5, 3, 4.5, 6]) for (const a of [0, 1.57, 3.14, 4.71, 0.8, 2.4, 3.9, 5.5]) {
      const px = (${x}) + Math.cos(a) * d, pz = (${z}) + Math.sin(a) * d;
      const r = O.fundar(px, pz, ${rot}, T.altura(px, pz)); if (!r.ok) continue;
      for (let g = 0; g < 12 && r.obra.datos.etapas < r.obra.plano.etapas.length; g++) { const k = O.avanzar(r.obra, P.materiales); if (!k.ok) break; }
      O.elegir(null); P.obras = O.obras.map((o) => o.datos); P.materiales = m0;
      return { ok: r.obra.datos.etapas >= r.obra.plano.etapas.length, x: r.obra.datos.x, z: r.obra.datos.z, rot: r.obra.datos.rot };
    }
    O.elegir(null); P.materiales = m0; return { error: 'no hubo lugar para ${id}' } })()`);
  // pararse al lado de (x, z), mirándolo un poco para abajo
  const pararse = (x, z, d = 1.2, ang = 0) => js(`(()=>{ const j = ${H}.jugador; const px = (${x}) + Math.cos(${ang}) * ${d}, pz = (${z}) + Math.sin(${ang}) * ${d};
    j.ubicar(px, pz, Math.atan2(-((${x}) - px), -((${z}) - pz))); j.estado.pitch = -0.35; return 1 })()`);
  const agente = (tipo) => js(`(()=>{ const a = [...${GM}.agentes.values()].find((q) => q.tipo === '${tipo}'); return a ? { x: a.x, z: a.z, id: a.id } : null })()`);
  // al lado de un animal (lo deja quieto un momento para que no se vaya)
  const alLado = async (tipo) => {
    // (los demás, unos metros más allá: que E sea con éste)
    const a = await js(`(()=>{ const a = [...${GM}.agentes.values()].find((q) => q.tipo === '${tipo}'); if (!a) return null; a.quiere = 'pasta'; a.t = 30; a.vel = 0; a.objetivo = null;
      for (const b of ${GM}.agentes.values()) if (b !== a && Math.hypot(b.x - a.x, b.z - a.z) < 4) { b.x += 5; b.z += 5; }
      return { x: a.x, z: a.z, id: a.id } })()`);
    if (!a) return null;
    await pararse(a.x, a.z, 1.1, 0.4);
    return a;
  };
  // la charla
  const vista = () => js(`(()=>{ const c = document.getElementById('charla'), ul = document.getElementById('charla-opciones');
    const lis = [...ul.querySelectorAll('li')];
    return { abierta: !c.classList.contains('oculto'), quien: document.getElementById('charla-quien').textContent, texto: document.getElementById('charla-texto').textContent,
      menu: !ul.classList.contains('oculto'), opciones: ${H}.__ruedaPlana() } })()`);   // 3.7.4: la rueda, aplanada
  const npc = (clave) => `(${H}.gente.gente.find((g) => (g.claveAldea || g.clave) === '${clave}'))`;
  const frente = async (clave, d = 1.6) => {
    const p = await js(`(()=>{ const n = ${npc(clave)}; return n ? { x: n.pos.x, z: n.pos.z } : null })()`);
    if (!p) return false;
    await js(`(()=>{ const j = ${H}.jugador, T = ${H}.T; const x = ${p.x}, z = ${p.z};
      for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, px = x + Math.cos(a) * ${d}, pz = z + Math.sin(a) * ${d}; if (!T.agua(px, pz)) { j.ubicar(px, pz, Math.atan2(-(x - px), -(z - pz))); break; } }
      j.estado.pitch = -0.05; j.estado.sentado = false; return 1 })()`);
    await asentar();
    return true;
  };
  const hastaMenu = async (max = 10) => { let v = await vista(); for (let i = 0; i < max && v.abierta && !v.menu; i++) { await tecla('KeyE'); v = await vista(); } return v; };
  // 3.7.4: en la rueda, el número de la categoría y después el de la opción (como un jugador)
  const elegir = async (re) => {
    let r = await js(`${H}.__rueda()`);
    if (r.categorias && r.nivel === 1) {
      const k = r.categorias.findIndex((c) => c.opciones.some((x) => re.test(x)));
      if (k < 0) return { error: `no está ${re} en ${r.categorias.map((c) => c.opciones.join(' / ')).join(' / ')}` };
      await tecla(`Digit${k + 1}`);
      if (r.categorias[k].id === 'chau') return vista();
      r = await js(`${H}.__rueda()`);
    }
    const i = r.sectores.findIndex((s) => re.test(s.titulo));
    if (i < 0) return { error: `no está ${re} en ${r.sectores.map((s) => s.titulo).join(' / ')}` };
    await tecla(`Digit${i + 1}`); return vista();
  };
  const leer = async () => { const t = []; let v = await vista(); for (let i = 0; i < 8 && v.abierta && !v.menu; i++) { t.push(v.texto); await tecla('KeyE'); v = await vista(); } return { renglones: t, v }; };
  const cerrar = () => js(`${H}.__cerrarCharla(); 1`);
  const programas = () => js(`${H}.renderer.info.programs.length`);

  try {
    await w.loadURL('about:blank');
    await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
    await abrir();
    ok(await listo(), 'el juego cargó');
    await js(`(()=>{ localStorage.clear(); ${ajustes()} return 1 })()`);
    await abrir();
    ok(await listo(), 'una partida Relax limpia');
    await entrar();
    await asentar();

    // ------------------------------------------------------------ 1. la granja vacía
    seccion('1. partida nueva');
    let e = await js(`(()=>{ const g = ${P}.granja, mallas = []; ${H}.escena.traverse((o) => { if (/^granja-/.test(o.name)) mallas.push(o.name); });
      return { vaca: g.vaca, chancha: g.chancha, frutales: Object.keys(g.frutales).length, mallas: mallas.length, planos: ['tambo', 'chiquero', 'paridera', 'frutal'].every((id) => ${H}.PLANOS.some((p) => p.id === id)) } })()`);
    ok(e.vaca === null && e.chancha === null && e.frutales === 0, 'la granja, vacía');
    ok(e.mallas >= 14, `las mallas de la granja ya están en la escena, vacías (${e.mallas})`);
    ok(e.planos, 'los planos del tambo, el chiquero, la paridera y el hoyo para frutal');
    const prog0 = await programas();

    // ------------------------------------------------------------ 2. el tambo y la vaca
    seccion('2. el tambo y la vaca de Don Ramón');
    const ref = await js(`(()=>{ const r = ${H}.T.lugares.refugio; return { x: r.x, z: r.z } })()`);
    const base = { x: ref.x - 24, z: ref.z + 14 };
    const tambo = await construir('tambo', base.x + 14, base.z + 2, 0);
    ok(tambo.ok, `se levanta el tambo (${JSON.stringify(tambo)})`);
    await js(`(()=>{ ${P}.dia = 1; ${P}.horas = 10.5; ${P}.materiales = { tronco: 12, tabla: 7 }; return 1 })()`);
    await frente('ramon');
    let av = await aviso();
    ok(/Hablar con Don Ramón/.test(av), `al lado de Don Ramón (${av})`);
    await tecla('KeyE');
    let v = await hastaMenu();
    ok(v.menu && v.opciones.some((o) => /Cambiar algo de campo…/.test(o)), `en su menú: «Cambiar algo de campo…» (${v.opciones.join(' / ')})`);
    v = await elegir(/Cambiar algo de campo…/);
    ok(v.menu && v.opciones.some((o) => /Una vaca lechera con su ternero \(pide 10 troncos y 6 tablas\)/.test(o)) && v.opciones.some((o) => /fardos/.test(o)), `lo que cambia (${v.opciones.join(' / ')})`);
    v = await elegir(/Una vaca lechera/);
    const r1 = await leer();
    ok(r1.renglones.some((t) => /overa más mansa/.test(t)), `lo que dice (${r1.renglones.join(' / ').slice(0, 120)})`);
    await cerrar();
    await esperar(800);
    // de vuelta en la granja (el puesto de Don Ramón queda lejos: de allá no se ve)
    await pararse(tambo.x, tambo.z + 6, 3);
    await granja(40);
    e = await js(`(()=>({ vaca: !!${P}.granja.vaca, pelaje: ${P}.granja.vaca?.pelaje, terneros: ${P}.granja.terneros.length, m: ${P}.materiales, cuaderno: !!${P}.entradas['vaca-lechera'], mundo: ${GM}.estado() }))()`);
    ok(e.vaca && e.terneros === 1 && e.m.tronco === 2 && e.m.tabla === 1, `la vaca ${e.pelaje}, con su ternero; se pagó con troncos y tablas (${JSON.stringify(e.m)})`);
    ok(e.cuaderno, 'la vaca lechera queda en el cuaderno');
    ok(e.mundo.vacas === 2, `se ven la vaca y el ternero (${JSON.stringify(e.mundo)})`);
    ok(/Don Ramón te trajo la overa/.test(await notas()), 'la nota: Don Ramón te la trajo');

    // ------------------------------------------------------------ 3. ordeñar
    seccion('3. ordeñar');
    await dia(2, 7.5);
    await alLado('vaca');
    av = await aviso();
    ok(av === 'Ordeñar la vaca', `al lado de la vaca, a la mañana: «${av}»`);
    const leche0 = await cant('leche');
    await tecla('KeyE');
    await cuadros(2);
    e = await js(`(()=>({ leche: ${P}.entradas.leche?.cantidad || 0, balde: ${GM}.estado().balde, ordenada: ${P}.granja.vaca.ordenada }))()`);
    ok(e.leche - leche0 === 4 && e.ordenada === 2, `E ordeña: +4 litros de leche (${e.leche})`);
    ok(e.balde, 'aparece el balde abajo de la ubre');
    av = await aviso();
    ok(/ya la ordeñaste hoy/.test(av), `y el aviso ya dice otra cosa («${av}»)`);
    await tecla('KeyE');
    ok((await cant('leche')) === e.leche, 'E otra vez no da más leche hoy');
    await dia(2, 15);
    await alLado('vaca');
    await dia(3, 16);
    av = await aviso();
    ok(/se ordeña a la mañana/.test(av), `a la tarde no («${av}»)`);
    ok(!!(await js(`${P}.entradas.leche`)), 'la leche, en el cuaderno');

    // ------------------------------------------------------------ 4. el chiquero y la chancha
    seccion('4. el chiquero, la chancha y los lechones');
    const chiq = await construir('chiquero', base.x - 2, base.z + 14, Math.PI);
    ok(chiq.ok, `se levanta el chiquero (${JSON.stringify(chiq)})`);
    await granja(2);
    await js(`(()=>{ ${P}.materiales.lana = 2; ${P}.entradas.huevo = { dia: 1, hora: 9, cantidad: 4 }; ${P}.entradas.papa = { dia: 1, hora: 9, cantidad: 12 }; return 1 })()`);
    // (Ayelén vive en la aldea: acá se elige lo mismo que en su menú)
    let r = await js(`JSON.stringify(${GJ}.elegir({ clave: 'veterinaria' }, 'granja:chancha'))`);
    await granja(10);
    e = await js(`(()=>({ chancha: !!${P}.granja.chancha, huevos: ${P}.entradas.huevo.cantidad, lana: ${P}.materiales.lana, opciones: ${GJ}.opciones('veterinaria'), mundo: ${GM}.estado() }))()`);
    ok(e.chancha && e.huevos === 0 && e.lana === 0 && /puestero/.test(r), `Ayelén te cambia la chancha (${r.slice(0, 80)})`);
    ok(e.mundo.chanchos === 1, 'se ve la chancha en el chiquero');
    // E en la batea, desde afuera del cerco
    const batea = await js(`(()=>{ const c = ${GJ}.lugares().chiquero; const lx = 1.05, lz = 1.15 + 0.9; return { x: c.x + lx * Math.cos(c.rot) + lz * Math.sin(c.rot), z: c.z - lx * Math.sin(c.rot) + lz * Math.cos(c.rot) } })()`);
    await js(`(()=>{ const j = ${H}.jugador; j.ubicar(${batea.x}, ${batea.z}, 0); j.estado.pitch = -0.4; return 1 })()`);
    av = await aviso();
    ok(/Echar sobras a la batea \(una papa\)/.test(av), `al lado de la batea: «${av}»`);
    await tecla('KeyE');
    e = await js(`(()=>({ batea: ${P}.granja.batea, comio: ${P}.granja.chancha.comio, papas: ${P}.entradas.papa.cantidad }))()`);
    ok(e.papas === 11 && e.comio === 3, `E echa una papa y la chancha come hoy (${JSON.stringify(e)})`);
    // unos días con la batea llena (apurados a mano)
    let lechones = 0;
    for (let d = 4; d <= 12 && !lechones; d++) { await js(`(()=>{ ${P}.granja.batea = 6; return 1 })()`); await dia(d, 10); lechones = await js(`${P}.granja.lechones.length`); }
    await granja(30);
    e = await js(`(()=>({ lechones: ${P}.granja.lechones.length, mundo: ${GM}.estado().chanchos, nota: /La chancha tuvo \\d lechones/.test(document.getElementById('notas').textContent) }))()`);
    ok(e.lechones >= 2 && e.mundo === 1 + e.lechones, `la chancha tuvo ${e.lechones} lechones, y se ven (${e.mundo})`);
    ok(e.nota, 'la nota de la camada');

    // ------------------------------------------------------------ 5. el frutal y las estaciones
    seccion('5. el frutal');
    const hoyo = await construir('frutal', base.x + 6, base.z - 9, 0);
    ok(hoyo.ok, `se arma el hoyo para frutal (${JSON.stringify(hoyo)})`);
    await js(`(()=>{ ${P}.entradas.frutilla = { dia: 1, hora: 9, cantidad: 3 }; return 1 })()`);
    r = await js(`JSON.stringify(${GJ}.elegir({ clave: 'madre' }, 'granja:plantin-manzano'))`);
    ok((await cant('plantin-manzano')) === 1 && (await cant('frutilla')) === 0, `Gladys te cambia un plantín de manzano (${r.slice(0, 70)})`);
    // el año 2 empieza el día 13: se planta en primavera
    await dia(13, 9);
    await pararse(hoyo.x, hoyo.z, 1.0, 1.2);
    av = await aviso();
    ok(av === 'Plantar el plantín de manzano', `al lado del hoyo: «${av}»`);
    await tecla('KeyE');
    await granja(3);
    e = await js(`(()=>{ const f = Object.values(${P}.granja.frutales)[0]; return { f, plantin: ${P}.entradas['plantin-manzano'].cantidad, mundo: ${GM}.estado().frutales } })()`);
    ok(e.f?.especie === 'manzano' && e.f.plantado === 13 && e.plantin === 0, 'E planta el manzano');
    ok(e.mundo.includes('manzano|flor×1'), `recién plantado en primavera, florece (${e.mundo})`);
    // (las estaciones que se ven cambian de a poco, con el tiempo real: unos segundos de cuadros)
    const estacion = async (d, h) => { await dia(d, h); await granja(3); for (let i = 0; i < 25; i++) { await esperar(120); await cuadros(1); } return js(`(()=>({ frutales: ${GM}.estado().frutales, oto: ${H}.__U().uOtono.value, inv: ${H}.__U().uInvierno.value, aviso: ${H}.__avisoYa()?.texto || '' }))()`); };
    e = await estacion(15, 12);
    ok(e.frutales.includes('manzano|hoja×1') && /Manzano joven · da fruta el día 19/.test(e.aviso), `en verano, joven y verde («${e.aviso}» · ${e.frutales})`);
    e = await estacion(19, 12);
    ok(e.frutales.includes('manzano|fruta×1') && /Juntar las manzanas \(10\)/.test(e.aviso), `en otoño, manzanas («${e.aviso}» · ${e.frutales})`);
    await tecla('KeyE');
    ok((await cant('manzana')) === 10, 'E junta diez manzanas');
    e = await estacion(19, 14);
    ok(e.frutales.includes('manzano|hoja×1'), `juntadas, el árbol sin fruta (${e.frutales})`);
    e = await estacion(22, 12);
    ok(e.inv > 0.5 && e.frutales.includes('manzano|hoja×1'), `en invierno, pelado (el material deja las ramas: invierno ${e.inv.toFixed(2)})`);
    // y si no se juntó: en invierno tampoco hay fruta (ni en el árbol ni en el piso)
    await js(`(()=>{ for (const f of Object.values(${P}.granja.frutales)) f.cosecha = 0; return 1 })()`);
    e = await estacion(22, 13);
    ok(e.frutales.includes('manzano|hoja×1') && /descansa en invierno/.test(e.aviso), `sin juntar, en invierno tampoco hay fruta («${e.aviso}» · ${e.frutales})`);
    e = await estacion(25, 10);
    ok(e.frutales.includes('manzano|flor×1') && e.inv < 0.5, `y en la primavera que viene, flor otra vez (${e.frutales})`);

    // ------------------------------------------------------------ 6. carnear el novillo
    seccion('6. carnear');
    await dia(25, 10);
    await granja(20);
    const nov = await js(`(()=>{ const t = ${P}.granja.terneros.find((x) => ${P}.dia - x.nacio >= 8); return t ? t.id : null })()`);
    ok(nov !== null, 'el ternero del principio ya es novillo');
    await js(`(()=>{ const a = ${GM}.agentes.get('ternero:${nov}'); a.quiere = 'pasta'; a.t = 30; a.vel = 0; for (const b of ${GM}.agentes.values()) if (b !== a) { b.x += 6; b.z += 6; } return 1 })()`);
    const pa = await js(`(()=>{ const a = ${GM}.agentes.get('ternero:${nov}'); return { x: a.x, z: a.z } })()`);
    await pararse(pa.x, pa.z, 1.0, 0.4);
    av = await aviso();
    ok(av === 'Mandar el novillo a carnear', `al lado del novillo: «${av}» ${JSON.stringify(await js(`[...${GM}.agentes.values()].map((a) => [a.tipo, a.id, +a.x.toFixed(1), +a.z.toFixed(1)])`))} ${JSON.stringify(pa)}`);
    await tecla('KeyE');
    av = await aviso();
    ok(/Sí: que Don Ramón se lleve el novillo/.test(av), `E pregunta, y el aviso lo dice («${av}»)`);
    ok(/¿Mandás el novillo a carnear\?/.test(await notas()), 'la pregunta, en la nota');
    await tecla('KeyE');
    e = await js(`(()=>({ fundido: document.getElementById('fundido').classList.contains('activo'), encargos: ${P}.granja.encargos, terneros: ${P}.granja.terneros.length }))()`);
    ok(e.fundido && e.encargos.length === 1 && e.encargos[0].vuelve === 26, `E otra vez: el fundido, y Don Ramón se lo lleva (${JSON.stringify(e.encargos)})`);
    await esperar(2600);
    e = await js(`(()=>({ fundido: document.getElementById('fundido').classList.contains('activo'), vacas: ${GM}.estado().vacas }))()`);
    ok(!e.fundido && /Don Ramón se llevó el novillo/.test(await notas()), 'vuelve la imagen y ya no está');
    await dia(26, 7); await granja(2);
    ok((await cant('carne-vaca')) === 0, 'a las siete todavía no');
    await dia(26, 9); await granja(2);
    ok((await cant('carne-vaca')) === 10 && /Don Ramón te trajo la carne/.test(await notas()), 'a la mañana: 10 de carne de vaca');

    // ------------------------------------------------------------ 7. guardar y cargar
    seccion('7. guardar y cargar');
    ok((await programas()) === prog0, `sin programas nuevos a mitad de juego (${prog0} → ${await programas()})`);
    const antes = await js(`JSON.stringify(${P}.granja)`);
    await js(`${H}.guardar(); 1`);
    await abrir();
    ok(await listo(), 'vuelve a cargar');
    await entrar();
    await asentar();
    const despues = await js(`JSON.stringify(${P}.granja)`);
    const A = JSON.parse(antes), D = JSON.parse(despues);
    ok(D.vaca?.pelaje === A.vaca.pelaje && D.terneros.length === A.terneros.length && D.lechones.length === A.lechones.length && D.chancha && Object.keys(D.frutales).length === 1, 'la granja se guarda: la vaca, los terneros, la chancha, los lechones y el frutal');
    ok(D.vaca.ordenada === A.vaca.ordenada && D.batea === A.batea, 'con lo de cada día');
    await js(`(()=>{ const r = ${H}.T.lugares.refugio; ${H}.jugador.ubicar(r.x - 14, r.z + 6, 0); return 1 })()`);
    await granja(20);
    e = await js(`${GM}.estado()`);
    ok(e.vacas === A.terneros.length + 1 && e.chanchos === 1 + A.lechones.length && e.frutales.length === 1, `y se vuelve a ver (${JSON.stringify(e)})`);
  } catch (e) {
    ok(false, `ERROR en ${donde}: ${e && e.stack ? e.stack : e}`);
  }
  console.log(`ERRORES:${errores.length ? '\n' + errores.join('\n') : ''}`);
  app.exit(errores.length ? 1 : 0);
});

// Partida real 2.8 (Electron + WebGL): Personalizar → Tu refugio y tu pueblo, Tu jardín y
// Tu fortín con estilo. Se eligen cosas tocando los botones del panel (y por
// `__personal.cambiar`), se mira que el mundo cambie (el refugio pintado y amueblado, tus
// casas repintadas, el jardín con su paleta, el fortín con pirca, estandarte y fuego de
// otro color) y que todo siga igual después de recargar.
// Guarda y devuelve el localStorage que había (las pruebas de humo comparten perfil).
// Uso: npx electron pruebas/humo-2-8-casa.cjs   (HUMO_PERFIL=<carpeta> para un perfil aparte,
//      HUMO_CAPTURAS=<carpeta> para guardar capturas del refugio y de las obras)
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const raiz = path.resolve(__dirname, '..');
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: false, width: 1100, height: 700, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught|Personalizar ·/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300));
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
  const listo = async () => {
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__personal)').catch(() => false)) return true; }
    return false;
  };
  const entrar = async () => { await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500); await js(`window.__hojarasca.volverAlJuego?.(); 1`); };
  const pestana = (id) => js(`(()=>{ const b = document.getElementById('personal-pestana-${id}'); if (!b) return false; b.click(); return document.getElementById('personal-contenido').dataset.seccion === '${id}' })()`);
  // toca el botón con ese data-valor dentro de la (primera) fila que tiene ese título
  const tocar = (fila, valor) => js(`(()=>{ const f = [...document.querySelectorAll('#personal-contenido .personal-fila')].find((x) => x.firstChild?.textContent === ${JSON.stringify(fila)});
    if (!f) return 'sin fila';
    const b = [...f.querySelectorAll('button[data-valor]')].find((x) => x.dataset.valor === ${JSON.stringify(String(valor))});
    if (!b) return 'sin botón'; if (b.disabled) return 'bloqueado'; b.click(); return 'ok' })()`);
  const H = 'window.__hojarasca';
  const capturas = process.env.HUMO_CAPTURAS ? path.resolve(process.env.HUMO_CAPTURAS) : null;
  if (capturas) fs.mkdirSync(capturas, { recursive: true });
  // la ventana oculta presenta el cuadro con atraso: se dibuja varias veces, con pausas, y
  // la primera captura se descarta (si no, sale la vista anterior)
  const dibujar = async () => { await js(`${H}.volverAlJuego?.(); 1`); for (let i = 0; i < 5; i++) { await js(`${H}.__bucle(); 1`); await esperar(150); } };
  const capturar = async () => { await w.webContents.capturePage(); await esperar(300); await js(`${H}.__bucle(); 1`); await esperar(300); return w.webContents.capturePage(); };
  // mira desde (lx, lz) del refugio (a `alto` m) hacia (mx, mz), dibuja y (si se pide) guarda
  const mirar = async (nombre, lx, lz, mx, mz, alto = 1.6) => {
    await js(`(()=>{ const r = ${H}.T.lugares.refugio, j = ${H}.jugador.estado, c = Math.cos(r.rot), s = Math.sin(r.rot);
      const W = (a, b) => ({ x: r.x + a * c + b * s, z: r.z - a * s + b * c });
      const p = W(${lx}, ${lz}), q = W(${mx}, ${mz});
      j.pos.set(p.x, Math.max(${H}.T.altura(p.x, p.z), r.y + 0.37) + 0.02, p.z);
      j.yaw = Math.atan2(-(q.x - p.x), -(q.z - p.z)); j.pitch = ${alto < 1 ? -0.25 : -0.12};
      ${H}.progreso.horas = 11; return 1 })()`);
    await dibujar();
    if (!capturas) return;
    fs.writeFileSync(path.join(capturas, `${nombre}.png`), (await capturar()).toPNG());
  };
  const mirarMundo = async (nombre, x, z, tx, tz) => {
    await js(`(()=>{ const j = ${H}.jugador.estado; j.pos.set((${x}), ${H}.T.altura((${x}), (${z})) + 0.05, (${z}));
      j.yaw = Math.atan2(-((${tx}) - (${x})), -((${tz}) - (${z}))); j.pitch = -0.2; ${H}.progreso.horas = 11; return 1 })()`);
    await dibujar();
    if (!capturas) return;
    fs.writeFileSync(path.join(capturas, `${nombre}.png`), (await capturar()).toPNG());
  };
  // arma una obra terminada cerca de (x, z)
  const poner = (id, x, z) => js(`(()=>{ const O = ${H}.obras, P = ${H}.progreso;
    Object.assign(P.materiales, { tronco: 200, tabla: 200, piedra: 200, cristal: 200 });
    const p = ${H}.PLANOS.find(q => q.id === '${id}'); if (!p) return { error: 'no hay plano ${id}' };
    let motivo = '';
    for (const r of [0, 2, 4, 6, 9, 12]) for (let k = 0; k < 8; k++) {
      O.elegir(p);
      const a = k * Math.PI / 4, x = (${x}) + Math.cos(a) * r, z = (${z}) + Math.sin(a) * r;
      const f = O.fundar(x, z, 0, ${H}.T.altura(x, z));
      if (!f.ok) { motivo = f.motivo; continue; }
      for (let g = 0; g < 12 && f.obra.datos.etapas < f.obra.plano.etapas.length; g++) { const q = O.avanzar(f.obra, P.materiales); if (!q.ok) break; }
      O.elegir(null); P.obras = O.obras.map(o => o.datos);
      return { ok: true, i: O.obras.indexOf(f.obra), x: f.obra.datos.x, z: f.obra.datos.z };
    }
    O.elegir(null); return { error: 'no hubo lugar: ' + motivo } })()`);
  const obra = (i) => `${H}.obras.obras[${i}]`;
  const media = (i, canal) => js(`(()=>{ const a = ${obra(i)}.malla.geometry.getAttribute('color').array; let s = 0; for (let k = ${canal}; k < a.length; k += 3) s += a[k]; return s / (a.length / 3) })()`);
  const verts = (i) => js(`${obra(i)}.malla.geometry.getAttribute('position').count`);
  // un lugar libre lejos del refugio, sin agua
  const claro = (n) => js(`(()=>{ const r = ${H}.T.lugares.refugio; for (let k = 0; k < 60; k++) { const x = r.x + 60 + ((${n} + k) % 6) * 30, z = r.z - 60 - Math.floor((${n} + k) / 6) * 30; if (!${H}.T.agua(x, z)) return { x, z }; } return null })()`);
  let copiaStorage = null;

  try {
    await abrir();
    ok(await listo(), 'el juego cargó');
    copiaStorage = await js(`JSON.stringify(Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])))`);
    await js(`(()=>{ localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'muybaja', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false })); return 1 })()`);
    await abrir();
    ok(await listo(), 'una partida Relax limpia');
    await entrar();
    let e = await js(`(()=>{ const est = ${H}.__personal.mundo.estructuras; return { personal: !!est?.personal, mastil: !!est?.mastil?.grupo, visible: est?.mastil?.visible,
      secciones: ${H}.__personal.secciones(), estado: est?.personal?.estado() } })()`);
    ok(e.personal && e.mastil, 'el refugio trae su personalización y el mástil');
    ok(['refugio', 'jardin', 'fortin'].every((s) => e.secciones.includes(s)), 'las tres secciones están en el panel');
    ok(e.visible === true, 'el mástil viene puesto (ahí flamea tu bandera)');
    ok(!e.estado.pintado && Object.values(e.estado.puesto).every((p) => !p.visible), 'de fábrica no se agrega ni se pinta nada');
    await mirar('0-refugio-antes', 1.5, 16, 0, 0);

    seccion('tu refugio, desde el panel');
    // una foto en el álbum, para colgarla
    await js(`(()=>{ const c = document.createElement('canvas'); c.width = 64; c.height = 48; const x = c.getContext('2d');
      x.fillStyle = '#2f5a74'; x.fillRect(0, 0, 64, 48); x.fillStyle = '#e0b12a'; x.fillRect(20, 12, 24, 24);
      ${H}.progreso.desafios['f-pudu'] = { dia: 2, hora: 10, img: c.toDataURL('image/png') }; return 1 })()`);
    await js(`${H}.__personal.abrir('pausa'); 1`);
    ok(await pestana('refugio'), 'pestaña Tu refugio');
    for (const [fila, valor] of [['Paredes', '#e6e1d3'], ['Puerta y marcos', '#35557a'], ['Techo', '#8e3a2c'], ['Alfombra', 'guarda'], ['Rincón de la ventana', 'sillon'],
      ['Rincón de la puerta', 'perchero'], ['Alféizar', 'macetas'], ['Sobre la mesa', 'mate'], ['Cuadro sobre la cama', 'f-pudu'], ['Faroles', 'cuatro'], ['Cerco', 'pirca']]) {
      ok(await tocar(fila, valor) === 'ok', `${fila}: ${valor}`);
    }
    e = await js(`(()=>{ const d = ${H}.progreso.personal.refugio, est = ${H}.__personal.mundo.estructuras;
      const puerta = ${H}.puertas.lista.find((p) => p.nombre === 'la puerta del refugio');
      let colPuerta = null; puerta?.g.traverse((m) => { if (m.isMesh && !colPuerta && m.material.color.getHex() !== 0x3f3830) colPuerta = '#' + m.material.color.getHexString(); });
      return { d, estado: est.personal.estado(), colPuerta } })()`);
    ok(e.d.pared === '#e6e1d3' && e.d.interior.cuadroCama === 'f-pudu' && e.d.exterior.cerco === 'pirca', 'quedó en progreso.personal.refugio');
    ok(e.estado.pintado && e.estado.pintura === '#e6e1d3|#35557a|#8e3a2c', `el refugio se pintó (${e.estado.pintura})`);
    for (const k of ['alfombra', 'rincon', 'rinconPuerta', 'ventana', 'mesa', 'cuadroCama', 'faroles', 'cerco']) ok(e.estado.puesto[k]?.visible, `se armó ${k}`);
    ok(e.colPuerta && e.colPuerta !== '#6b5238' && e.colPuerta !== '#4a3b2c', `la puerta del refugio se pintó (${e.colPuerta})`);
    // el cerco ataja
    e = await js(`(()=>{ const r = ${H}.T.lugares.refugio, c = Math.cos(r.rot), s = Math.sin(r.rot);
      const x = r.x + (-4.7) * c + 5 * s, z = r.z - (-4.7) * s + 5 * c;
      return ${H}.col.cercanos(x, z).filter((o) => o.duenio?.deco === 'cerco').length })()`);
    ok(e > 0, `el cerco tiene física (${e})`);
    await js(`${H}.__personal.cerrar(); 1`);
    await mirar('1-refugio-afuera', 1.5, 16, 0, 0);
    await mirar('2-refugio-adentro', -2.2, 1.9, 2.4, -1.4);
    await mirar('3-refugio-cama', -0.5, 1.5, 3.2, 0.6);

    seccion('tus casas');
    const lugar = await claro(0);
    const pp = await poner('pared-puerta', lugar.x, lugar.z);
    ok(pp.ok, `se arma una pared con puerta (${JSON.stringify(pp)})`);
    const luz0 = await media(pp.i, 1);
    await js(`${H}.__personal.cambiar('refugio', { casas: { pared: '#e6e1d3', aberturas: '#8a2f2a', techo: null } }); 1`);
    e = await js(`(()=>{ const o = ${obra(pp.i)}; const p = ${H}.puertas.lista.find((q) => q.duenio === o);
      let col = null; p?.g.traverse((m) => { if (m.isMesh && !col && m.material.color.getHex() !== 0x3f3830) col = '#' + m.material.color.getHexString(); });
      return { firma: o.firmaEstilo, col } })()`);
    ok(e.firma === 'c|#e6e1d3|#8a2f2a|null', `la pared se repintó con la paleta (${e.firma})`);
    ok((await media(pp.i, 1)) > luz0 * 1.4, 'la pared quedó más clara (a la cal)');
    ok(e.col && e.col !== '#6b5238', `la hoja de la puerta se pintó (${e.col})`);
    e = await js(`(()=>{ const O = ${H}.obras, casas = O.casas(${H}.jugador.estado.pos); const c = casas.find((k) => k.piezas.includes(${obra(pp.i)}));
      O.pintarCasa(c.piezas, { pared: '#5d7a52', aberturas: null, techo: null }); return ${obra(pp.i)}.firmaEstilo })()`);
    ok(e === 'c|#5d7a52|null|null', 'una casa puede tener sus propios colores');
    await js(`${H}.jugador.estado.pos.set(${lugar.x}, ${H}.T.altura(${lugar.x}, ${lugar.z} + 5) + 0.05, ${lugar.z} + 5); 1`);

    seccion('tu jardín');
    await js(`${H}.__personal.abrir('pausa'); 1`);
    ok(await pestana('jardin'), 'pestaña Tu jardín');
    ok(await tocar('Flores', 'lupinos') === 'ok', 'flores: lupinos');
    ok(await tocar('Seto', 'mosqueta') === 'ok', 'seto: rosa mosqueta');
    await js(`${H}.__personal.cerrar(); 1`);
    const lugarJ = await claro(3);
    const ca = await poner('cantero-flores', lugarJ.x, lugarJ.z);
    const se = await poner('seto', lugarJ.x + 6, lugarJ.z);
    ok(ca.ok && se.ok, 'se arman un cantero y un seto');
    e = await js(`[${obra(ca.i)}.datos.jardin, ${obra(se.i)}.datos.jardin]`);
    ok(e[0] === 'lupinos' && e[1] === 'mosqueta', `nacen con la paleta (${e})`);
    await mirarMundo('4-jardin', lugarJ.x - 2, lugarJ.z + 7, lugarJ.x + 3, lugarJ.z);

    seccion('después de recargar (Relax)');
    await js(`${H}.guardar(); 1`);
    await abrir();
    ok(await listo(), 'recargó');
    await entrar();
    e = await js(`(()=>{ const est = ${H}.__personal.mundo.estructuras, d = ${H}.progreso.personal;
      const o = ${H}.obras.obras.find((k) => k.plano.id === 'pared-puerta'), c = ${H}.obras.obras.find((k) => k.plano.id === 'cantero-flores');
      return { estado: est.personal.estado(), d: d.refugio, jardin: d.jardin, firma: o?.firmaEstilo, flor: c?.datos.jardin, mastil: est.mastil.visible } })()`);
    ok(e.d.pared === '#e6e1d3' && e.d.exterior.faroles === 'cuatro', 'lo elegido sigue en la partida');
    ok(e.estado.pintura === '#e6e1d3|#35557a|#8e3a2c' && e.estado.pintado, 'el refugio sigue pintado');
    for (const k of ['alfombra', 'rincon', 'mesa', 'cuadroCama', 'faroles', 'cerco']) ok(e.estado.puesto[k]?.visible, `${k} sigue`);
    ok(e.firma === 'c|#5d7a52|null|null', 'tu casa conserva sus colores');
    ok(e.flor === 'lupinos' && e.jardin.flores === 'lupinos', 'el jardín conserva su paleta');
    ok(e.mastil === true, 'el mástil sigue');
    await js(`${H}.__personal.cambiar('refugio', { exterior: { faroles: 'nada', cerco: 'nada', mastil: false } }); 1`);
    e = await js(`(()=>{ const est = ${H}.__personal.mundo.estructuras; return { estado: est.personal.estado(), mastil: est.mastil.visible } })()`);
    ok(!e.estado.puesto.faroles?.visible && !e.estado.puesto.cerco?.visible && e.mastil === false, 'se sacan los faroles, el cerco y el mástil');
    await js(`${H}.__personal.cambiar('refugio', { pared: null, aberturas: null, techo: null, exterior: { faroles: 'nada', cerco: 'nada', mastil: true } }); 1`);
    e = await js(`${H}.__personal.mundo.estructuras.personal.estado()`);
    ok(e.pintura === 'null|null|null', 'el refugio vuelve a la madera');

    seccion('tu fortín (Desafío)');
    await js(`(()=>{ ${H}.guardar(); const a = JSON.parse(localStorage.getItem('hojarasca-ajustes-v1') || '{}'); a.modo = 'desafio';
      localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(a)); return 1 })()`);
    await abrir();
    ok(await listo(), 'cargó el Desafío');
    await entrar();
    ok(await js(`!!${H}.desafio?.fortin && ${H}.__personal.mundo.obras === ${H}.obras`), 'el Desafío con el fortín');
    await js(`(()=>{ ${H}.progreso.horas = 12; return 1 })()`);
    const lugarF = await claro(8);
    const em = await poner('empalizada', lugarF.x, lugarF.z);
    const to = await poner('torre-vigia', lugarF.x + 9, lugarF.z);
    const an = await poner('antorcha', lugarF.x - 6, lugarF.z + 4);
    ok(em.ok && to.ok && an.ok, 'se arman una empalizada, una torre y una antorcha');
    await js(`(()=>{ ${H}.desafio.defensas.refrescar(); ${H}.desafio.fortin.refrescar(); return 1 })()`);
    const v0 = { em: await verts(em.i), to: await verts(to.i) }, rojo0 = (await media(em.i, 0)) - (await media(em.i, 2));
    await js(`${H}.__personal.abrir('pausa'); 1`);
    ok(await pestana('fortin'), 'pestaña Tu fortín');
    ok(await tocar('La madera', 'pirca') === 'ok', 'madera: con pie de pirca');
    ok(await tocar('Estandarte', '#b8342f') === 'ok', 'estandarte rojo');
    ok(await tocar('Fuego de las antorchas', 'cobre') === 'ok', 'fuego verde de cobre');
    await js(`${H}.__personal.cerrar(); ${H}.desafio.fortin.refrescar(); 1`);
    e = await js(`(()=>{ const a = ${obra(an.i)}; return { llama: '#' + a.userLlama?.llama.material.color.getHexString() } })()`);
    ok((await verts(em.i)) > v0.em, 'la empalizada tiene su pie de pirca');
    ok((await verts(to.i)) > v0.to, 'la torre tiene pirca y estandarte');
    ok(e.llama === '#8dffb4', `el fuego de las antorchas es verde (${e.llama})`);
    await mirarMundo('5-fortin', lugarF.x + 2, lugarF.z + 12, lugarF.x + 3, lugarF.z);
    await js(`${H}.__personal.cambiar('fortin', { madera: 'pintada', pintura: '#35557a' }); 1`);
    ok((await media(em.i, 2)) - (await media(em.i, 0)) > -rojo0 + 0.02, 'la madera pintada de azul se ve azul');
    await js(`${H}.guardar(); 1`);
    await abrir();
    ok(await listo(), 'recargó el Desafío');
    await entrar();
    await js(`(()=>{ ${H}.desafio.defensas.refrescar(); ${H}.desafio.fortin.refrescar(); return 1 })()`);
    e = await js(`(()=>{ const O = ${H}.obras.obras, em = O.find((o) => o.plano.id === 'empalizada'), an = O.find((o) => o.plano.id === 'antorcha');
      return { d: ${H}.progreso.personal.fortin, firma: em?.firmaEstilo, llama: '#' + an?.userLlama?.llama.material.color.getHexString() } })()`);
    ok(e.d.madera === 'pintada' && e.d.llama === 'cobre', 'lo elegido del fortín sigue');
    ok(e.firma === 'f|0|#35557a|', `la empalizada sigue pintada (${e.firma})`);
    ok(e.llama === '#8dffb4', 'el fuego sigue verde');
    await js(`${H}.__personal.cambiar('fortin', { madera: 'rustica', estandarte: null, llama: 'fuego' }); ${H}.desafio.fortin.refrescar(); 1`);
    e = await js(`(()=>{ const an = ${H}.obras.obras.find((o) => o.plano.id === 'antorcha'); return '#' + an?.userLlama?.llama.material.color.getHexString() })()`);
    ok(e === '#ffb347', 'el fuego de siempre vuelve a ser el de siempre');
  } catch (err) {
    errores.push('excepción: ' + (err?.message || err));
  } finally {
    if (copiaStorage) {
      // se devuelve lo que había y se traba la escritura: el guardado del beforeunload no lo pisa
      await js(`(()=>{ const c = JSON.parse(${JSON.stringify(copiaStorage)});
        localStorage.clear(); for (const [k, v] of Object.entries(c)) localStorage.setItem(k, v);
        Storage.prototype.setItem = () => {}; Storage.prototype.removeItem = () => {}; Storage.prototype.clear = () => {}; return 1 })()`).catch(() => {});
    }
  }
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  console.log('OK humo 2.8 · tu refugio, tu jardín y tu fortín');
  app.exit(0);
});

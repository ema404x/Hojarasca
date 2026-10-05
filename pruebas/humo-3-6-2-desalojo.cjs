// Partida real 3.6.2 (juego): lo tuyo que quedó donde ahora está la Aldea de los Duendes. Una partida de antes
// de la 3.6 fabricada a mano, con obras, un renoval y la carpa encima de la plaza, las calles y los edificios:
//  · al cargar, todo queda afuera de la aldea (nada encimado);
//  · lo que se muda conserva sus datos: el nombre, lo sembrado en el cantero, la miel de la colmena, y una
//    casa de piezas se muda entera (piso, pared y techo en el mismo lugar uno del otro);
//  · lo que no entra en ningún lado (un embarcadero lejos del lago) se desarma y devuelve TODO lo que costó;
//  · lo que ya estaba afuera no se toca;
//  · una sola nota al entrar; al volver a cargar no pasa nada más.
// Uso: npx electron pruebas/humo-3-6-2-desalojo.cjs --user-data-dir=<carpeta propia>
//      (o HUMO_PERFIL=<carpeta>; si no, una propia en la carpeta temporal). Borra el localStorage del perfil.
const { app, BrowserWindow, dialog } = require('electron');
// que la prueba nunca muestre un cuadro de error en la pantalla del usuario: lo escribe y sale
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); app.exit(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa sin atender): ${e && e.stack ? e.stack : e}`); app.exit(1); });
const path = require('path');
const os = require('os');
const raiz = path.resolve(__dirname, '..');
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
else if (!process.argv.some((a) => a.startsWith('--user-data-dir'))) app.setPath('userData', path.join(os.tmpdir(), 'hojarasca-humo-3-6-2-desalojo'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

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
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 300 s (${donde})`)), 300000)),
  ]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const listo = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__aldea)').catch(() => false)) return true; } return false; };
  const H = 'window.__hojarasca';
  const ajustes = `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'muybaja', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre', estacion: 'verano' }));`;
  const cuadros = (n = 4) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  const notas = () => js(`[...document.querySelectorAll('#notas > *')].map((n) => n.textContent)`);

  try {
    await w.loadURL('about:blank');
    await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
    await abrir();
    ok(await listo(), 'el juego cargó');
    await js(`(()=>{ localStorage.clear(); ${ajustes} return 1 })()`);
    await abrir();
    ok(await listo(), 'una partida Relax limpia');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    await js(`${H}.volverAlJuego?.(); ${H}.ajustes.limiteFps = 'libre'; 1`);

    seccion('la partida vieja, con lo suyo donde ahora está la aldea');
    const antes = await js(`(()=>{ const H = ${H}, P = H.progreso, M = H.__aldeaMundo(), T = H.T;
      const plano = (id) => H.PLANOS.find((p) => p.id === id);
      const lleno = (id) => plano(id).etapas.length;
      const w = (lx, lz) => M.aMundo(lx, lz);
      const plaza = w(6, 39.5), calle = w(-8, 49), biblio = w(-18, 41), te = w(27.5, 36), via = w(40, 26), escuela = w(0, 71);
      const ref = T.lugares.refugio;
      const cantero = { plano: 'cantero', x: calle.x, z: calle.z, rot: 0, etapas: lleno('cantero'), nombre: null };
      const obras = [
        { plano: 'casilla', x: plaza.x, z: plaza.z, rot: 0.4, etapas: lleno('casilla'), nombre: 'La casita del duende' },
        cantero,
        { plano: 'colmena', x: escuela.x, z: escuela.z, rot: 0, etapas: lleno('colmena'), nombre: null, colmena: { miel: 3, dia: 2 } },
        // una casa de piezas adentro de la biblioteca: piso, una pared encima y el techo
        { plano: 'piso-modular', x: biblio.x, z: biblio.z, y: T.altura(biblio.x, biblio.z), rot: 0, etapas: lleno('piso-modular'), nombre: null },
        { plano: 'pared-modular', x: biblio.x + 1.4, z: biblio.z, y: T.altura(biblio.x, biblio.z) + 0.2, rot: Math.PI / 2, etapas: lleno('pared-modular'), nombre: null },
        { plano: 'techo-modular', x: biblio.x, z: biblio.z + 0.2, y: T.altura(biblio.x, biblio.z) + 2.7, rot: 0, etapas: lleno('techo-modular'), nombre: null },
        // un embarcadero en la casa de té: lejos del lago, no entra en ningún lado
        { plano: 'embarcadero', x: te.x, z: te.z, rot: 0, etapas: lleno('embarcadero'), nombre: null },
        // y uno que siempre estuvo bien (al lado del refugio): no se toca
        { plano: 'cantero', x: ref.x + 14, z: ref.z + 9, rot: 0, etapas: lleno('cantero'), nombre: 'el de siempre' },
      ];
      P.obras = obras.map((o) => ({ ...o }));
      P.huerta = { [Math.round(cantero.x) + ':' + Math.round(cantero.z)]: { cultivo: 'habas', dia: 1, lluvia: 0, ultimaLluvia: -1 } };
      P.renovales = [{ x: plaza.x + 3, z: plaza.z + 2, especie: 'coihue', dia: 1 }];
      P.cosas.manta = 1;
      P.carpa = { x: via.x, z: via.z, yaw: 0.3 };
      P.materiales = { tronco: 5, tabla: 7, piedra: 2 };
      const costo = {};
      for (const e of plano('embarcadero').etapas) for (const [k, n] of Object.entries(e.pide)) costo[k] = (costo[k] || 0) + n;
      // que ninguna esté afuera (las que tienen que quedar adentro)
      const adentro = obras.map((o) => !!T.sinObras(o.x, o.z, plano(o.plano).radio || 1));
      H.guardar();
      return { obras, adentro, costo, materiales: { ...P.materiales }, renoval: { ...P.renovales[0] }, carpa: { ...P.carpa }, plantines: P.entradas['plantin-coihue']?.cantidad || 0 };
    })()`);
    ok(antes.adentro.slice(0, 7).every(Boolean) && !antes.adentro[7], `fabricada: 7 obras encima de la aldea y 1 lejos (${antes.adentro.join(',')})`);

    seccion('al cargar');
    await abrir();
    ok(await listo(), 'la partida vieja cargó');
    const r = await js(`(()=>{ const H = ${H}, P = H.progreso, T = H.T;
      const plano = (id) => H.PLANOS.find((p) => p.id === id);
      return { obras: P.obras.map((o) => ({ plano: o.plano, x: o.x, z: o.z, y: o.y, rot: o.rot, nombre: o.nombre, colmena: o.colmena || null, adentro: !!T.sinObras(o.x, o.z, plano(o.plano)?.radio || 1) })),
        armadas: H.obras.obras.length, huerta: Object.keys(P.huerta || {}), materiales: { ...P.materiales }, renovales: (P.renovales || []).map((v) => ({ ...v, adentro: !!T.sinObras(v.x, v.z, 1) })),
        plantasRenoval: H.renovales.contar(), carpa: P.carpa ? { ...P.carpa, adentro: !!T.sinObras(P.carpa.x, P.carpa.z, 1.6) } : null, plantines: P.entradas['plantin-coihue']?.cantidad || 0 };
    })()`);
    ok(r.obras.every((o) => !o.adentro), `ninguna obra quedó encima de la aldea (${r.obras.filter((o) => o.adentro).map((o) => o.plano).join(', ') || 'ninguna'})`);
    ok(r.obras.length === 7 && r.armadas === 7, `quedan 7 obras armadas (${r.obras.length} guardadas, ${r.armadas} armadas): el embarcadero se desarmó`);
    ok(!r.obras.some((o) => o.plano === 'embarcadero'), 'el embarcadero ya no está');
    const costo = antes.costo, mat = r.materiales;
    ok(Object.entries(costo).every(([k, n]) => (mat[k] || 0) - (antes.materiales[k] || 0) === n), `devolvió TODO lo que costó el embarcadero (${JSON.stringify(costo)} → ${JSON.stringify(mat)})`);
    const casita = r.obras.find((o) => o.nombre === 'La casita del duende');
    ok(!!casita && Math.abs(casita.rot - 0.4) < 1e-9, 'la casilla se mudó con su nombre y su giro');
    const de = r.obras.find((o) => o.nombre === 'el de siempre'), orig = antes.obras[7];
    ok(!!de && de.x === orig.x && de.z === orig.z, 'lo que estaba afuera no se tocó');
    const cant = r.obras.find((o) => o.plano === 'cantero' && o.nombre !== 'el de siempre');
    ok(!!cant && r.huerta.length === 1 && r.huerta[0] === `${Math.round(cant.x)}:${Math.round(cant.z)}`, `lo sembrado se mudó con el cantero (${r.huerta.join(' ')})`);
    const col = r.obras.find((o) => o.plano === 'colmena');
    ok(!!col && col.colmena?.miel === 3, 'la colmena se mudó con su miel');
    const piezas = ['piso-modular', 'pared-modular', 'techo-modular'].map((id) => r.obras.find((o) => o.plano === id));
    const piezasAntes = ['piso-modular', 'pared-modular', 'techo-modular'].map((id) => antes.obras.find((o) => o.plano === id));
    const rel = (l) => l.slice(1).map((o) => [o.x - l[0].x, o.z - l[0].z, o.y - l[0].y]);
    const igual = piezas.every(Boolean) && rel(piezas).every((v, i) => v.every((c, j) => Math.abs(c - rel(piezasAntes)[i][j]) < 1e-6));
    ok(igual, 'la casa de piezas se mudó entera (cada pieza en el mismo lugar respecto de las otras)');
    ok(r.renovales.length === 1 && !r.renovales[0].adentro && r.plantasRenoval === 1 && r.renovales[0].especie === 'coihue' && r.renovales[0].dia === 1, 'el renoval se mudó (la misma especie y edad)');
    ok(!!r.carpa && !r.carpa.adentro && r.carpa.yaw === 0.3, 'la carpa se mudó afuera');
    const lejos = Math.max(...r.obras.filter((o) => o.nombre !== 'el de siempre').map((o) => { const a = antes.obras.find((x) => x.plano === o.plano && x.nombre === o.nombre); return a ? Math.hypot(o.x - a.x, o.z - a.z) : 0; }));
    ok(lejos < 120, `al lugar libre más cercano (lo más lejos que fue algo: ${lejos.toFixed(0)} m)`);

    seccion('al entrar, una sola nota');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    for (let i = 0; i < 8; i++) { await esperar(600); await cuadros(1); }
    const n1 = (await notas()).filter((t) => t.includes('La Aldea de los Duendes ocupó tu lugar'));
    ok(n1.length === 1, `la nota: «${n1.join(' | ')}»`);
    ok(n1.length === 1 && /se mudaron afuera del pueblo/.test(n1[0]) && /no entraba en ningún lado: tenés en la mochila/.test(n1[0]), 'dice qué se mudó y qué se devolvió');

    seccion('al volver a cargar, nada más');
    await js(`${H}.guardar(); 1`);
    await abrir();
    ok(await listo(), 'cargó otra vez');
    const r2 = await js(`(()=>{ const P = ${H}.progreso; return { obras: P.obras.map((o) => [o.plano, o.x, o.z]), materiales: { ...P.materiales } } })()`);
    ok(JSON.stringify(r2.obras) === JSON.stringify(r.obras.map((o) => [o.plano, o.x, o.z])) && JSON.stringify(r2.materiales) === JSON.stringify(r.materiales), 'todo quedó donde estaba y los materiales no se duplicaron');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    for (let i = 0; i < 8; i++) { await esperar(600); await cuadros(1); }
    ok(!(await notas()).some((t) => t.includes('La Aldea de los Duendes ocupó tu lugar')), 'y sin nota');
  } catch (e) {
    errores.push(`excepción: ${e && e.stack ? e.stack : e}`);
  }
  const malos = errores.filter((e) => !e.startsWith('✗'));
  console.log(errores.length ? `\nFALLÓ (${errores.length}):\n${errores.join('\n')}` : '\nOK humo 3.6.2 desalojo');
  app.exit(errores.length || malos.length ? 1 : 0);
});

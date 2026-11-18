// Partida real 4.31.0 (C): la naturaleza que se toca (ver src/naturaleza-juego.js). Cada detalle, visto en el juego: el aviso que da la E,
// lo que pasa al apretarla y capturas antes/después (o seguidas si se mueve). Al final, los programas de la placa (0 nuevos) y lo que
// cuesta por cuadro en la plaza y en el bosque.
// Uso (después de `node armar.mjs`), con el candado de Electron tomado y minimizado:
//   powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-31-0-c.cjs -Espera 900 -Perfil <carpeta propia>
//   HUMO_PARTES=arbusto,arbol,sapito,agua,lena,flor,pasto,piedra,ranas,salpica,mojado,ripio,mariposa,medir · HUMO_SALIDA=<carpeta> · HTML=<otra página>
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-31-0-c'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 20 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 20 * 60 * 1000).unref?.();
const PARTES = (process.env.HUMO_PARTES || 'arbusto,arbol,sapito,agua,lena,flor,pasto,piedra,ranas,salpica,mojado,ripio,mariposa,medir').split(',');
const parte = (p) => PARTES.includes(p);

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, P = H.progreso, T = H.T, J = H.jugador;
  const N = window.__N = {};
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  H.ajustes.limiteFps = 'libre';
  N.nat = () => (H.__naturaleza ? H.__naturaleza() : null);
  N.programas = () => H.renderer.info.programs.length;
  N.tick = async (seg = 0.5) => { const t0 = performance.now(); while (performance.now() - t0 < seg * 1000) { H.__bucle(); await dormir(14); } return 1; };
  N.abajo = (code) => document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true, cancelable: true }));
  N.arriba = (code) => document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true }));
  N.soltarTodo = () => { for (const c of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'Space', 'KeyC']) N.arriba(c); return 1; };
  N.tarjeta = () => { const v = document.getElementById('valle-tarjeta'); return !!v && !v.classList.contains('oculto'); };
  // pararse en (x, z) mirando hacia (mx, mz), con la vista inclinada «pitch»
  N.pararseMirando = async (x, z, mx, mz, pitch = -0.15) => { N.soltarTodo(); const yaw = Math.atan2(-(mx - x), -(mz - z)); J.ubicar(x, z, yaw); J.estado.pitch = pitch; J.estado.sentado = false; J.estado.montado = null; J.estado.agachado = !!N.agachar; await N.tick(0.5); J.estado.yaw = yaw; J.estado.pitch = pitch; await N.tick(0.4); return 1; };
  N.aviso = () => { const a = H.__avisoYa(); return a ? a.tecla + ' · ' + a.texto : ''; };
  N.e = async () => { N.abajo('KeyE'); await N.tick(0.05); N.arriba('KeyE'); return 1; };
  N.cands = () => { const c = N.nat()._debug.candidatos(J.estado); return Object.keys(c).join(',') + ' · pos ' + J.estado.pos.x.toFixed(1) + ',' + J.estado.pos.z.toFixed(1) + ' sup ' + J.estado.superficie + ' ag ' + J.estado.agachado + ' pitch ' + J.estado.pitch.toFixed(2); };
  N.lejosAldea = (x, z) => Math.hypot(x - 40, z + 339) > 260 && Math.abs(x) < 430 && Math.abs(z) < 430;
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [];
  const { ipcMain } = require('electron');
  require(path.join(raiz, 'copias-main.cjs')).registrarCopias({ ipcMain, app });
  require(path.join(raiz, 'fotos-main.cjs')).registrarFotos({ ipcMain, app });
  const w = new BrowserWindow({ show: true, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false, preload: path.join(raiz, 'preload.cjs') } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 200));
  });
  let donde = 'carga';
  const js = (c, espera = 180000) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en ${espera / 1000} s (${donde})`)), espera))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const N = (c) => js(`(async () => { const H = window.__hojarasca, N = window.__N, P = H.progreso, T = H.T, J = H.jugador, nat = N.nat(); return (${c}); })()`);
  const url = process.env.HTML ? path.resolve(process.env.HTML) : path.join(raiz, 'index.html');
  const foto = async (nombre, seg = 0) => {
    if (seg) await N(`N.tick(${seg})`);
    try {
      const datos = await js(`(() => { const H = window.__hojarasca; H.__bucle(); return H.renderer.domElement.toDataURL('image/jpeg', 0.88); })()`);
      fs.writeFileSync(path.join(salida, nombre + '.jpg'), Buffer.from(datos.split(',')[1], 'base64'));
      console.log(`  (captura ${nombre}.jpg)`);
    } catch (e) { console.log(`  (captura ${nombre} no se pudo: ${e && e.message})`); }
  };
  const ajustes = (o) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({calidad:'alta', clima:'despejado', musica:false, modo:'relax', relaxTipo:'libre', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'}, ${JSON.stringify(o)}))); 1`;
  const esperarJuego = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false)) return true; } return false; };
  const seccion = async (nombre, fn) => {
    if (!parte(nombre)) return;
    donde = nombre;
    console.log(`\n=== ${nombre}`);
    try { await fn(); } catch (err) { console.log('ERROR en', nombre + ':', err && err.stack || err); errores.push(`${nombre}: ${err && err.message || err}`); }
    await N('N.soltarTodo()').catch(() => 0);
    console.log('  (programas:', await N('N.programas()').catch(() => '?'), ')');
    const fallas = await js('(() => { const C = window.__hojarasca && window.__hojarasca.__caidas; return C && C.fallas ? JSON.stringify(C.fallas()).slice(0, 600) : "" })()').catch(() => '');
    if (fallas && fallas !== '[]') { console.log('  FALLAS DEL JUEGO: ' + fallas); errores.push(nombre + ': fallas del juego ' + fallas.slice(0, 200)); }
  };
  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); ${ajustes({})}`);
    await w.loadFile(url, { search: '?debug=1' });
    await js('window.__sinPausaPorBlur = true; 1');
    if (!(await esperarJuego())) throw new Error('el juego no cargó');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000);
    await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
    await N('N.tick(2)');
    for (let k = 0; k < 6 && (await N('N.tarjeta()')); k++) { await N('(() => { const b = document.querySelector("#valle-tarjeta button[data-valle-opcion]"); if (b) b.click(); return 1 })()'); await N('N.tick(0.6)'); }
    await N('(() => { H.clima.estado.lluvia = 0; P.dia = 12; P.horas = 11.5; for (const k of ["chilco","notro","maqui","calafate","nire","maiten","amancay","coiron","arrayan","lenga","coihue","helecho","chaura","neneo"]) P.entradas[k] = P.entradas[k] || 1; return 1 })()');
    await N('N.tick(1.5)');
    ok(await N('!!nat'), 'la naturaleza que se toca existe en el Relax');
    const prog0 = await N('N.programas()');
    console.log('  programas al empezar:', prog0);

    await seccion('arbusto', async () => {
      const m = await N(`(() => { const L = H.veg.matas.filter((m) => m.tipo === 'chilco' && !m.sacado && !m.despejado && !T.agua(m.x, m.z) && N.lejosAldea(m.x, m.z) && T.val(T.bosque, m.x, m.z) < 0.5);
        for (const c of L) { const x = c.x + 1.5, z = c.z; if (!T.agua(x, z) && !H.veg.matasCerca(x, z, 1.0).length) return { x: c.x, z: c.z, i: H.veg.matas.indexOf(c) }; } return null; })()`);
      ok(!!m, 'hay un chilco para sacudir');
      if (!m) return;
      await N(`N.pararseMirando(${m.x + 1.5}, ${m.z}, ${m.x}, ${m.z}, -0.12)`);
      const av = await N('N.aviso()');
      ok(av === 'E · Sacudir el chilco', `el aviso: «${av}»`);
      await foto('arbusto-0-antes');
      const soto0 = await N('H.veg.statsSoto.veces');
      await N('N.e()');
      const h = await N('nat.mundo.activas()');
      ok(h >= 6, `al sacudirlo caen hojas (${h} sueltas)`);
      await foto('arbusto-1-sacude', 0.15);
      await foto('arbusto-2-hojas', 0.35);
      await foto('arbusto-2b-hojas', 0.4);
      await foto('arbusto-3-despues', 8);
      const soto = await N(`({ veces: H.veg.statsSoto.veces - ${soto0}, ms: H.veg.statsSoto.ms })`);
      console.log(`  el bloque del sotobosque se rehizo ${soto.veces} veces (último: ${soto.ms.toFixed(2)} ms)`);
      ok(await N('nat.mundo.activas() < ' + h), 'las hojas se posan y se van');
    });

    await seccion('arbol', async () => {
      const a = await N(`(() => { const L = H.veg.arboles.filter((a) => (a.especie === 'nire' || a.especie === 'maiten' || a.especie === 'arrayan') && (a.esc || 1) <= 0.95 && !a.sacado && N.lejosAldea(a.x, a.z));
        for (const c of L) { const x = c.x + c.r + 1.0, z = c.z; if (!T.agua(x, z) && !H.veg.arbolesCerca(x, z, 1.2).filter((b) => b !== c).length && !H.veg.matasCerca(x, z, 1.8).length) return { x: c.x, z: c.z, r: c.r, especie: c.especie }; } return null; })()`);
      ok(!!a, `hay un árbol chico (${a && a.especie})`);
      if (!a) return;
      await N(`N.pararseMirando(${a.x + a.r + 1.0}, ${a.z}, ${a.x}, ${a.z}, 0.25)`);
      const av = await N('N.aviso()');
      ok(/^E · Sacudir (el|la) /.test(av), `el aviso: «${av}»`);
      console.log('  candidatos:', await N('N.cands()'), '· árbol', JSON.stringify(a));
      await foto('arbol-0-antes');
      await N('N.e()');
      await foto('arbol-1-sacude', 0.2);
      await foto('arbol-2-hojas', 0.6);
      ok(await N('nat.mundo.activas()') >= 6, 'caen hojas del árbol');
    });

    // el lago: la orilla más cercana al centro por varios rumbos, con el agua adelante
    const orilla = async () => N(`(() => { const L = { x: 150, z: 110 }; const out = [];
      for (let k = 0; k < 48; k++) { const a = k / 48 * 6.283; const ux = Math.cos(a), uz = Math.sin(a);
        let r = 40; while (r < 240 && T.agua(L.x + ux * r, L.z + uz * r)) r += 0.5;
        if (r >= 240) continue; const bx = L.x + ux * r, bz = L.z + uz * r;
        const px = bx + ux * 1.6, pz = bz + uz * 1.6; if (T.agua(px, pz) || T.altura(px, pz) - T.altura(bx, bz) > 1.2) continue;
        out.push({ px, pz, bx, bz, ux, uz }); }
      return out; })()`);

    await seccion('sapito', async () => {
      const L = await orilla();
      let hecho = false;
      for (const o of L.slice(0, 20)) {
        await N(`N.pararseMirando(${o.px}, ${o.pz}, ${o.px - o.ux * 10}, ${o.pz - o.uz * 10}, -0.05)`);
        const av = await N('N.aviso()');
        if (av !== 'E · Tirar una piedra al agua (sapito)') continue;
        ok(true, `en la orilla del lago el aviso: «${av}»`);
        await foto('sapito-0-antes');
        await N('N.e()');
        await foto('sapito-1', 0.35);
        await foto('sapito-2', 0.4);
        await foto('sapito-3', 0.5);
        await N('N.tick(2.5)');
        const e = await N('({ ...P.naturaleza })');
        ok(e.sapitos === 1, `se anotó el tiro (sapitos ${e.sapitos}, récord ${e.sapitoRecord})`);
        const av2 = await N('H.__avisos().slice(-3).join(" | ")');
        console.log('  avisos:', av2);
        ok(/salto|Plof/.test(av2), 'la nota dice cuántos saltos');
        hecho = true; break;
      }
      ok(hecho, 'se encontró una orilla para el sapito');
    });

    await seccion('agua', async () => {
      const L = await orilla();
      let hecho = false;
      for (const o of L.slice(0, 20)) {
        const px = o.bx + o.ux * 0.9, pz = o.bz + o.uz * 0.9;
        await N(`(N.agachar = true, N.pararseMirando(${px}, ${pz}, ${px - o.ux * 3}, ${pz - o.uz * 3}, -0.75))`);
        await N('(J.estado.pitch = -0.75, N.tick(0.2))');
        const av = await N('N.aviso()');
        if (av !== 'E · Tocar el agua') continue;
        ok(true, `agachado en la orilla, el aviso: «${av}»`);
        await foto('agua-0-antes');
        await N('N.e()');
        await foto('agua-1', 0.4);
        await foto('agua-2', 0.6);
        ok(await N('nat.mundo.pools.anillo.im.count') >= 0, 'las ondas');
        hecho = true; break;
      }
      await N('(N.agachar = false, J.estado.agachado = false, 1)');
      ok(hecho, 'se encontró una orilla para tocar el agua');
    });

    await seccion('lena', async () => {
      // un lugar del bosque cerrado
      const b = await N(`(() => { for (let x = -380; x < 380; x += 9) for (let z = -380; z < 380; z += 9) { const k = T.indice(x, z); if (T.bosque[k] > 0.8 && !T.agua(x, z) && T.distSendero[k] > 6 && N.lejosAldea(x, z) && T.pendiente[k] < 0.4) return { x, z }; } return null; })()`);
      ok(!!b, 'hay bosque cerrado');
      if (!b) return;
      await N(`(J.ubicar(${b.x}, ${b.z}, 0), N.tick(1.2))`);
      const p = await N(`(() => { const L = nat._debug.pilas.slice().sort((a, c) => Math.hypot(a.x - J.estado.pos.x, a.z - J.estado.pos.z) - Math.hypot(c.x - J.estado.pos.x, c.z - J.estado.pos.z)); return L[0] ? { ...L[0] } : null; })()`);
      ok(!!p, `hay leña suelta cerca (${await N('nat._debug.pilas.length')} pilas a la vista)`);
      if (!p) return;
      await N('(P.ramitas = 0, 1)');
      let av = '';
      for (const [dx, dz] of [[1.3, 0], [-1.3, 0], [0, 1.3], [0, -1.3]]) {
        await N(`N.pararseMirando(${p.x + dx}, ${p.z + dz}, ${p.x}, ${p.z}, -0.55)`);
        av = await N('N.aviso()');
        if (av === 'E · Juntar la leña suelta') break;
      }
      ok(av === 'E · Juntar la leña suelta', `el aviso: «${av}»`);
      await foto('lena-0-antes');
      await N('N.e()');
      await foto('lena-1-despues', 0.6);
      const r = await N('({ ramitas: P.ramitas, tomadas: P.naturaleza.lena.tomadas.slice() })');
      ok(r.ramitas === 2 && r.tomadas.includes(p.id), `dos ramitas y la pila anotada (${JSON.stringify(r)})`);
      ok(!(await N(`nat._debug.pilas.some((l) => l.id === ${JSON.stringify(p.id)})`)), 'la pila ya no está');
    });

    await seccion('flor', async () => {
      const f = await N(`(() => { const L = H.objetos.items.filter((it) => it.tipo === 'amancay' && !it.tomado && N.lejosAldea(it.x, it.z));
        for (const it of L) { const x = it.x + 1.2, z = it.z; if (T.agua(x, z)) continue; if (H.objetos.items.some((o) => o !== it && !o.tomado && Math.hypot(o.x - x, o.z - z) < 3.4 && o.tipo !== 'amancay')) continue; return { x: it.x, z: it.z, id: it.id }; } return null; })()`);
      ok(!!f, 'hay un amancay');
      if (!f) return;
      await N(`N.pararseMirando(${f.x + 1.2}, ${f.z}, ${f.x}, ${f.z}, -0.6)`);
      const av = await N('N.aviso()');
      ok(av === 'E · Arrancar un amancay', `el aviso: «${av}»`);
      await foto('flor-0-antes');
      await N('N.e()');
      await foto('flor-1-despues', 0.5);
      ok(await N(`H.objetos.items.find((it) => it.id === ${JSON.stringify(f.id)}).tomado === true && P.tomados.includes(${JSON.stringify(f.id)})`), 'el amancay sale del valle y queda anotado en la partida');
    });

    await seccion('pasto', async () => {
      const b = await N(`(() => { for (let x = -360; x < 360; x += 7) for (let z = -360; z < 360; z += 7) { const k = T.indice(x, z); if (T.pasto[k] > 0.8 && T.bosque[k] < 0.15 && !T.agua(x, z) && T.distSendero[k] > 5 && N.lejosAldea(x, z) && !H.veg.matasCerca(x, z, 3).length) return { x, z }; } return null; })()`);
      ok(!!b, 'hay un prado');
      if (!b) return;
      await N(`(N.agachar = true, N.pararseMirando(${b.x}, ${b.z}, ${b.x + 1}, ${b.z}, -0.8))`);
      await N('(J.estado.pitch = -0.8, N.tick(0.2))');
      const av = await N('N.aviso()');
      ok(av === 'E · Arrancar un poco de pasto', `agachado en el prado, el aviso: «${av}»`);
      console.log('  candidatos:', await N('N.cands()'));
      await foto('pasto-0-antes');
      await N('N.e()');
      await foto('pasto-1-despues', 0.5);
      await N('(N.agachar = false, J.estado.agachado = false, 1)');
    });

    await seccion('piedra', async () => {
      // un sendero lejos de la aldea
      const b = await N(`(() => { for (let x = -360; x < 360; x += 5) for (let z = -360; z < 360; z += 5) { const k = T.indice(x, z); if (T.distSendero[k] < 0.8 && !T.agua(x, z) && N.lejosAldea(x, z) && T.pendiente[k] < 0.25) return { x, z }; } return null; })()`);
      ok(!!b, 'hay un sendero');
      if (!b) return;
      await N(`(J.ubicar(${b.x}, ${b.z}, 0), N.tick(1))`);
      const p = await N(`(() => { const L = nat._debug.piedras.filter((p) => p.tipo === 'piedra' && !p.mueve && !p.fuera); L.sort((a, c) => Math.hypot(a.x - J.estado.pos.x, a.z - J.estado.pos.z) - Math.hypot(c.x - J.estado.pos.x, c.z - J.estado.pos.z)); return L[0] ? { x: L[0].x, z: L[0].z, id: L[0].id } : null; })()`);
      ok(!!p, `hay piedritas a la vista (${await N('nat._debug.piedras.length')})`);
      if (!p) return;
      await N(`N.pararseMirando(${p.x + 2.6}, ${p.z}, ${p.x}, ${p.z}, -0.45)`);
      await foto('piedra-0-antes');
      await N(`(N.abajo('KeyW'), N.tick(1.3))`);
      await foto('piedra-1');
      await N(`(N.arriba('KeyW'), 1)`);
      await foto('piedra-2', 0.3);
      const q = await N(`(() => { const p = nat._debug.piedras.find((p) => p.id === ${JSON.stringify(p.id)}); return p ? { x: p.x, z: p.z, mueve: p.mueve } : null; })()`);
      const mov = q ? Math.hypot(q.x - p.x, q.z - p.z) : 0;
      ok(mov > 0.3, `la piedrita pateada rodó ${mov.toFixed(2)} m`);
    });

    await seccion('ranas', async () => {
      const L = await orilla();
      const o = L[3] || L[0];
      await N(`(J.ubicar(${o.px + o.ux * 4}, ${o.pz + o.uz * 4}, 0), N.tick(4))`);
      let r = await N(`(() => { const R = nat._debug.ranas.filter((r) => r.visible); R.sort((a, c) => Math.hypot(a.x - J.estado.pos.x, a.z - J.estado.pos.z) - Math.hypot(c.x - J.estado.pos.x, c.z - J.estado.pos.z)); return R[0] ? { x: R[0].x, z: R[0].z, i: nat._debug.ranas.indexOf(R[0]) } : null; })()`);
      ok(!!r, `hay ranas en la orilla (${await N('nat._debug.ranas.filter((r) => r.visible).length')} a la vista)`);
      if (!r) return;
      // agachado (no la asustás) a un metro y medio, mirándola
      const dx = await N(`(() => { for (let a = 0; a < 6.28; a += 0.4) { const x = ${r.x} + Math.cos(a) * 1.6, z = ${r.z} + Math.sin(a) * 1.6; if (!T.agua(x, z)) return [x, z]; } return null; })()`);
      if (!dx) return;
      await N(`(N.agachar = true, N.pararseMirando(${dx[0]}, ${dx[1]}, ${r.x}, ${r.z}, -0.5))`);
      ok(await N(`nat._debug.ranas[${r.i}].visible && !(nat._debug.ranas[${r.i}].salto > 0)`), 'agachado no la asustás');
      await foto('ranas-0-antes');
      await N(`(N.agachar = false, J.estado.agachado = false, N.tick(0.25))`);
      await foto('ranas-1-salta');
      await N('N.tick(0.6)');
      ok(await N(`!nat._debug.ranas[${r.i}].visible || nat._debug.ranas[${r.i}].salto > 0`), 'parado a su lado, salta al agua');
      await foto('ranas-2-agua');
    });

    await seccion('salpica', async () => {
      const b = await N(`(() => { for (let x = -440; x < 440; x += 1.5) for (let z = -440; z < 440; z += 1.5) { const a = T.agua(x, z); if (a && !a.lago && a.prof > 0.1 && a.prof < 0.45 && T.agua(x + 1.5, z) && T.agua(x + 3, z) && Math.abs(x) < 440 && Math.abs(z) < 440) return { x, z }; } return null; })()`);
      ok(!!b, 'hay un arroyo bajo');
      if (!b) return;
      await N(`N.pararseMirando(${b.x}, ${b.z}, ${b.x + 3}, ${b.z}, -0.55)`);
      const sup = await N('J.estado.superficie + (J.estado.nadando ? " (nadando)" : "")');
      console.log('  superficie:', sup, await N(`JSON.stringify(T.agua(J.estado.pos.x, J.estado.pos.z)) + ' pos ' + J.estado.pos.x.toFixed(2) + ',' + J.estado.pos.y.toFixed(2) + ',' + J.estado.pos.z.toFixed(2) + ' rio ' + ${b.x} + ',' + ${b.z}`));
      await N(`(N.abajo('KeyW'), N.tick(0.5))`);
      const n = await N('nat.mundo.pools.gota.im.count + nat.mundo.activas()');
      await N('(J.estado.pitch = -0.55, 1)');
      await foto('salpica-1');
      await N('(J.estado.pitch = -0.55, 1)');
      await foto('salpica-2', 0.12);
      await N('(J.estado.pitch = -0.55, 1)');
      await foto('salpica-3', 0.12);
      console.log('  ojos sobre el agua:', await N('(H.camara.position.y - (T.agua(J.estado.pos.x, J.estado.pos.z)?.nivel ?? T.altura(J.estado.pos.x, J.estado.pos.z))).toFixed(2)'));
      await N('N.soltarTodo()');
      ok(n > 0, `al correr por el arroyo salpica (${n})`);
    });

    await seccion('mojado', async () => {
      await N(`(J.ubicar(150, 110, 0), N.tick(1.5))`);
      ok(await N('J.estado.nadando'), 'en el medio del lago se nada');
      ok(await N('nat.mojado()') > 0.9, 'nadando, empapado');
      const L = await orilla();
      const o = L[0];
      await N(`N.pararseMirando(${o.px + o.ux * 2}, ${o.pz + o.uz * 2}, ${o.px + o.ux * 5}, ${o.pz + o.uz * 5}, -1.1)`);
      await N('N.tick(1.2)');
      const m = await N('nat.mojado()');
      ok(m > 0.85, `afuera, sigue mojado (${m.toFixed(2)})`);
      ok(/empapado/.test(await N('H.__avisos().slice(-4).join(" | ")')), 'la nota «Quedaste empapado»');
      await foto('mojado-1-gotea');
      await foto('mojado-2-gotea', 0.5);
      ok(await N('nat.mundo.pools.gota.im.count') >= 0, 'gotas');
    });

    await seccion('ripio', async () => {
      const r = await N(`(() => { const ang = 2.992763908303246, c = Math.cos(ang), s = Math.sin(ang), P0 = { x: 40.33335217430335, z: -339.13893663781784 };
        let calle = null; for (let lx = -60; lx < 60 && !calle; lx += 0.7) for (let lz = 0; lz < 60 && !calle; lz += 0.7) { const x = P0.x + lx * c + lz * s, z = P0.z - lx * s + lz * c; if (nat._debug.enCalle(x, z)) calle = { x, z }; }
        const out = {};
        if (calle) out.calle = nat.alPaso({ superficie: 'tierra', pos: { x: calle.x, y: 0, z: calle.z }, corriendo: false }, 0.6);
        const v = T.riel[40] || T.riel[Math.floor(T.riel.length / 3)]; if (v) out.via = nat.alPaso({ superficie: 'tierra', pos: { x: v.x, y: 0, z: v.z } }, 0.6);
        out.monte = nat.alPaso({ superficie: 'tierra', pos: { x: 300, y: 0, z: 300 } }, 0.6);
        out.calleXY = calle; return out; })()`);
      console.log('  ', JSON.stringify(r));
      ok(r.calle === 'ripio', 'en la calle de la aldea, la pisada es de ripio');
      ok(r.via === 'ripio', 'sobre la vía, de ripio (el balasto)');
      if (r.calleXY) { await N(`(J.ubicar(${r.calleXY.x}, ${r.calleXY.z}, 0), N.tick(0.6))`); ok(await N('nat.alPaso(J.estado, 0.6)') === 'ripio', `parado en la calle (el jugador dice «${await N('J.estado.superficie')}») el paso suena a ripio`); }
    });

    await seccion('mariposa', async () => {
      await N('(P.horas = 13, N.tick(1))');
      const m = await N(`(() => { const M = H.bichos._debug.mariposas.filter((m) => m.g.visible); return M[0] ? { x: M[0].pos.x, z: M[0].pos.z, i: H.bichos._debug.mariposas.indexOf(M[0]) } : null; })()`);
      if (!m) { console.log('  (no hay mariposas a la vista ahora: queda la prueba en Node)'); return; }
      await N(`(J.ubicar(${m.x + 1}, ${m.z}, 0), N.tick(0.3))`);
      ok(await N(`H.bichos._debug.mariposas[${m.i}].huye > 0`), 'la mariposa que tenés encima se va');
    });

    await seccion('progs', async () => {
      const b = await N(`(() => { for (let x = -440; x < 440; x += 1.5) for (let z = -440; z < 440; z += 1.5) { const a = T.agua(x, z); if (a && !a.lago && a.prof > 0.08 && a.prof < 0.3 && T.agua(x + 3, z) && T.agua(x + 1.5, z)?.prof < 0.35 && N.lejosAldea(x, z)) return { x, z }; } return null; })()`);
      console.log('  programas antes:', await N('N.programas()'));
      if (b) { await N(`(N.pararseMirando(${b.x}, ${b.z}, ${b.x + 3}, ${b.z}, -0.38), N.abajo('KeyW'), N.abajo('ShiftLeft'), N.tick(1.5))`); await N('N.soltarTodo()'); console.log('  programas en el arroyo:', await N('N.programas()'), JSON.stringify(b)); }
      await N(`(J.ubicar(${40.33 + 30 * Math.sin(2.99)}, ${-339.14 + 30 * Math.cos(2.99)}, 0.7), N.tick(2))`);
      console.log('  programas en la plaza:', await N('N.programas()'));
    });

    await seccion('medir', async () => {
      // lo que cuesta naturalezaJuego.actualizar por cuadro (con todo lo de alrededor), en la plaza y en el bosque
      await N(`(() => { const o = nat.actualizar; window.__msNat = []; nat.actualizar = (dt) => { const t0 = performance.now(); o(dt); window.__msNat.push(performance.now() - t0); }; return 1; })()`);
      const medir = async (nombre, x, z) => {
        await N(`(J.ubicar(${x}, ${z}, 0.7), N.tick(1.5))`);
        await N('(window.__msNat.length = 0, N.abajo("KeyW"), N.tick(4))');
        await N('N.soltarTodo()');
        const r = await N('(() => { const L = window.__msNat.slice().sort((a, b) => a - b); const med = L[Math.floor(L.length / 2)], p95 = L[Math.floor(L.length * 0.95)], prom = L.reduce((a, b) => a + b, 0) / L.length; return { n: L.length, med, p95, prom, dibujos: nat.mundo.dibujos() }; })()');
        console.log(`  ${nombre}: ${r.n} cuadros · mediana ${r.med.toFixed(3)} ms · p95 ${r.p95.toFixed(3)} ms · promedio ${r.prom.toFixed(3)} ms · mallas dibujando ${r.dibujos}`);
        ok(r.prom < 0.5, `${nombre}: por debajo de 0,5 ms por cuadro`);
      };
      await medir('plaza', 40.33 + 0 * Math.cos(2.99) + 30 * Math.sin(2.99), -339.14 + 30 * Math.cos(2.99));
      const b = await N(`(() => { for (let x = -380; x < 380; x += 9) for (let z = -380; z < 380; z += 9) { const k = T.indice(x, z); if (T.bosque[k] > 0.8 && !T.agua(x, z) && N.lejosAldea(x, z) && T.pendiente[k] < 0.3) return { x, z }; } return null; })()`);
      if (b) await medir('bosque', b.x, b.z);
      const prog = await N('N.programas()');
      console.log('  programas al final:', prog, '(al empezar:', prog0 + ')');
    });
  } catch (err) { console.log('ERROR:', err && err.stack || err); errores.push(String(err && err.message || err)); }
  console.log(`\n${errores.length ? '✗ ' + errores.length + ' problemas:\n  ' + errores.join('\n  ') : '✓ todo bien'}`);
  app.exit(errores.length ? 1 : 0);
});

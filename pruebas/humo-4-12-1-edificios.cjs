// Partida real 4.12.1 (Electron + WebGL): edificios y luz.
// Para Baja y Media (y Alta si se pide con HUMO_CALIDADES=baja,media,alta) abre el juego, entra al Relax y comprueba con la placa de verdad:
//   · Baja: ni sombra de contacto ni halos del valle (no hay mallas), las obras salen con la geometría de siempre;
//   · Media/Alta: la sombra de contacto (una malla) y los halos del valle (una malla) existen, con el material y el shader previstos; las casas del jugador
//     se arman con más vértices (el teselado) y sus sombras de contacto se registran; de noche y cerca los halos se ven, de día no;
//   · ningún programa de shader nuevo después de asentarse (de día, de noche, girando): nada se compila a mitad de juego;
//   · dibujos por cuadro: la sombra de contacto suma uno, los halos otro de noche, y nada más;
//   · guardar y recargar da el mismo aspecto (mismos colores) en cada casa del jugador;
//   · sin errores de consola ni de shader.
// Uso (desde la carpeta del proyecto, después de `node armar.mjs`), siempre en el monitor externo:
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-12-1-edificios.cjs -Espera 900 -Perfil <carpeta propia> [-Visible]
// HUMO_PAGINA=<index.html> para probar otra página armada.
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const pagina = path.resolve(process.env.HUMO_PAGINA || path.join(raiz, 'index.html'));
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const visible = process.env.HUMO_OCULTO === '0';
const calidades = (process.env.HUMO_CALIDADES || 'baja,media').split(',');
setTimeout(() => { console.log('ERROR: la prueba tardó más de 14 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 14 * 60 * 1000).unref?.();
let pasos = 0, fallas = 0;
const ok = (c, t) => { pasos++; if (c) console.log('OK ' + t); else { fallas++; console.log('FALLA ' + t); } };

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: visible, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught|shader error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300)); });
  const js = (c) => w.webContents.executeJavaScript(c);
  const H = 'window.__hojarasca';
  const resultados = {};
  for (const q of calidades) {
    const conPost = q === 'media' || q === 'alta';
    const ajustes = `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${q}', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', modoFluido:false})); 1`;
    await w.loadFile(pagina, { search: '?debug=1' });
    await js(ajustes);
    await w.loadFile(pagina, { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.est && ${H}.T && ${H}.renderer)`).catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(`${H}.ajustes.limiteFps = 'libre'; ${H}.volverAlJuego?.(true); 1`);
    const correr = (n) => js(`(async () => { for (let i = 0; i < ${n}; i++) { ${H}.__bucle(); if (i % 10 === 9) await new Promise((r) => setTimeout(r, 0)); } return 1 })()`);
    // la aldea se monta de a poco: se cuentan cuadros a mano hasta que esté
    await js(`(async () => { const H = ${H}, A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return 0;
      for (let i = 0; i < 100 && A.medir().fabrica.pendientes > 0; i++) await new Promise((ok) => setTimeout(ok, 100));
      for (let n = 0; n < 3000 && (A.medir().cola > 0 || A.medir().listas < A.medir().manzanas); n++) { H.__bucle(); if (n % 50 === 49) await new Promise((ok) => setTimeout(ok, 0)); }
      return 1 })()`);
    const hay = (nombre) => js(`!!${H}.escena.getObjectByName('${nombre}')`);
    const sombra = await hay('sombras-de-contacto'), halos = await hay('halos-valle');
    console.log(`-- ${q}: sombra de contacto ${sombra}, halos ${halos}`);
    ok(sombra === conPost, `${q}: ${conPost ? 'tiene' : 'no tiene'} la malla de sombras de contacto`);
    ok(halos === conPost, `${q}: ${conPost ? 'tiene' : 'no tiene'} la malla de halos del valle`);
    if (conPost) {
      const mat = await js(`(() => { const m = ${H}.escena.getObjectByName('sombras-de-contacto'), h = ${H}.escena.getObjectByName('halos-valle');
        return { sombra: { tipo: m.material.type, blending: m.material.blending, colores: m.material.vertexColors, niebla: m.material.fog, lucesDeLaEscena: 0 },
                 halos: { tipo: h.material.type, aditivo: h.material.blending === 2 } } })()`);
      ok(mat.sombra.tipo === 'MeshBasicMaterial' && mat.sombra.blending === 3 && mat.sombra.colores === true && mat.sombra.niebla === false, `${q}: la sombra de contacto es un material básico que resta, con color por vértice`);
      ok(mat.halos.tipo === 'ShaderMaterial' && mat.halos.aditivo, `${q}: los halos son el material aditivo de siempre`);
    }
    // las casas del jugador, ya terminadas, en un claro cerca del refugio
    const demo = await js(`(() => { const H = ${H}, T = H.T, r0 = T.lugares.refugio, arboles = H.veg.arboles.filter((a) => !a.sacado && !a.caido);
      let sitio = null;
      for (let r = 30; r < 420 && !sitio; r += 4) for (let a = 0; a < 6.28 && !sitio; a += 0.1) {
        const x = r0.x + Math.cos(a) * r, z = r0.z + Math.sin(a) * r;
        if (Math.abs(x) > 430 || Math.abs(z) > 430 || T.agua(x, z)) continue;
        let bien = !arboles.some((q) => Math.hypot(q.x - x, q.z - z) < 24);
        for (let k = 0; k < 8 && bien; k++) for (const d of [8, 16]) { const px = x + Math.cos(k * 0.785) * d, pz = z + Math.sin(k * 0.785) * d; if (1 - T.normal(px, pz).y > 0.045 || T.agua(px, pz)) bien = false; }
        if (bien && 1 - T.normal(x, z).y < 0.03) sitio = { x, z };
      }
      if (!sitio) return null;
      const lista = [['puesto', 0, 0, 0], ['casilla', 11, -1, 0.3], ['galponcito', -11, 1, -0.2], ['banco', 5, 6, 0], ['mesa-campo', -4, 5, 0.3]];
      H.obras.sincronizar(lista.map(([plano, dx, dz, rot]) => ({ plano, x: sitio.x + dx, z: sitio.z + dz, y: T.altura(sitio.x + dx, sitio.z + dz), rot, etapas: 99 })));
      H.progreso.obras = H.obras.obras.map((o) => o.datos);   // (lo que se guarda)
      window.__demo = sitio;
      const firma = (o) => { const c = o.malla.geometry.attributes.color.array; let s = 0; for (let i = 0; i < c.length; i += 7) s += c[i]; return { verts: o.malla.geometry.attributes.position.count, suma: +s.toFixed(4) }; };
      const res = {}; for (const o of H.obras.obras) if (Math.hypot(o.datos.x - sitio.x, o.datos.z - sitio.z) < 20) res[o.plano.id] = firma(o);
      return { sitio: { x: Math.round(sitio.x), z: Math.round(sitio.z) }, res } })()`);
    ok(!!demo, `${q}: hay un claro para las casas del jugador`);
    if (demo) {
      console.log(`   casas: ${JSON.stringify(demo.res)}`);
      resultados[q] = { casas: demo.res };
      ok(['puesto', 'casilla', 'galponcito'].every((id) => demo.res[id] && demo.res[id].verts > 500), `${q}: las casas se armaron`);
    }
    await js(`(() => { const H = ${H}, d = window.__demo; if (d) { H.jugador.ubicar(d.x - 14, d.z + 16, 0); } H.progreso.horas = 12; return 1 })()`);
    await correr(160);
    // asentarse, y recién ahí se cuentan los programas
    const progs = () => js(`${H}.renderer.info.programs.length`);
    const nombres = () => js(`${H}.renderer.info.programs.map((p) => p.name + ':' + (p.cacheKey || '').length + ':' + (p.cacheKey || '').slice(0, 60))`);
    const antesNombres = new Set(await nombres());
    const antes = await progs();
    const dibujos = () => js(`(() => { const R = ${H}.renderer; R.info.autoReset = false; R.info.reset(); ${H}.__bucle(); const r = R.info.render.calls; R.info.autoReset = true; return r })()`);
    const estado = () => js(`(() => { const s = ${H}.escena.getObjectByName('sombras-de-contacto'), h = ${H}.escena.getObjectByName('halos-valle'); return { sombra: s ? { visible: s.visible, verts: s.geometry.attributes.position.count } : null, halos: h ? { visible: h.visible, verts: h.geometry.attributes.position.count } : null } })()`);
    await js(`(() => { ${H}.progreso.horas = 12; return 1 })()`); await correr(40);
    const dia = await estado(), llamadasDia = await dibujos();
    console.log(`   día: ${JSON.stringify(dia)} · ${llamadasDia} dibujos`);
    if (conPost) {
      ok(dia.sombra && dia.sombra.visible && dia.sombra.verts > 24, `${q}: de día se dibuja la sombra de contacto (${dia.sombra && dia.sombra.verts} vértices)`);
      ok(dia.halos && dia.halos.visible === false, `${q}: de día los halos no se dibujan`);
      const sinSombra = await js(`(() => { const s = ${H}.escena.getObjectByName('sombras-de-contacto'); s.visible = false; const R = ${H}.renderer; R.info.autoReset = false; R.info.reset(); R.render(${H}.escena, ${H}.camara); const a = R.info.render.calls; s.visible = true; R.info.reset(); R.render(${H}.escena, ${H}.camara); const b = R.info.render.calls; R.info.autoReset = true; return b - a })()`);
      ok(sinSombra === 1, `${q}: la sombra de contacto suma UN dibujo (${sinSombra})`);
    } else {
      ok(dia.sombra === null && dia.halos === null, `${q}: sin mallas de sombra ni de halos`);
    }
    await js(`(() => { ${H}.progreso.horas = 22.5; return 1 })()`); await correr(60);
    const noche = await estado(), llamadasNoche = await dibujos();
    console.log(`   noche: ${JSON.stringify(noche)} · ${llamadasNoche} dibujos`);
    if (conPost) {
      // cerca del refugio hay vidrios: los halos de sus ventanas
      await js(`(() => { const H = ${H}, r = H.T.lugares.refugio; H.jugador.ubicar(r.x + 8, r.z + 10, 0); H.progreso.horas = 22.5; return 1 })()`); await correr(60);
      const cerca = await estado();
      ok(cerca.halos && cerca.halos.verts >= 4 && cerca.halos.visible, `${q}: de noche, cerca del refugio, se ven los halos de sus ventanas (${cerca.halos && cerca.halos.verts / 4} halos)`);
      const sinHalos = await js(`(() => { const h = ${H}.escena.getObjectByName('halos-valle'); h.visible = false; const R = ${H}.renderer; R.info.autoReset = false; R.info.reset(); R.render(${H}.escena, ${H}.camara); const a = R.info.render.calls; h.visible = true; R.info.reset(); R.render(${H}.escena, ${H}.camara); const b = R.info.render.calls; R.info.autoReset = true; return b - a })()`);
      ok(sinHalos === 1, `${q}: los halos suman UN dibujo de noche (${sinHalos})`);
      await js(`(() => { ${H}.progreso.horas = 12; return 1 })()`); await correr(40);
      const manana = await estado();
      ok(manana.halos && manana.halos.visible === false, `${q}: al amanecer los halos se apagan`);
    }
    // ningún programa nuevo: de día, de noche, girando y mirando al cielo
    await js(`(() => { ${H}.progreso.horas = 12; return 1 })()`); await correr(40);
    await js(`(() => { ${H}.progreso.horas = 22; return 1 })()`); await correr(40);
    await js(`(() => { ${H}.progreso.horas = 7; const J = ${H}.jugador.estado; J.yaw += 2.4; J.pitch = 0.5; return 1 })()`); await correr(40);
    await js(`(() => { ${H}.progreso.horas = 12; const J = ${H}.jugador.estado; J.pitch = -0.05; return 1 })()`); await correr(40);
    const despues = await progs();
    if (despues !== antes) console.log('   programas nuevos: ' + JSON.stringify((await nombres()).filter((n) => !antesNombres.has(n))));
    ok(despues === antes, `${q}: ningún programa de shader nuevo en 160 cuadros de día, noche y giros (${antes} → ${despues})`);
    // guardar y recargar: el mismo aspecto en cada casa
    if (demo) {
      await js(`(() => { ${H}.guardar(); return 1 })()`);
      await esperar(800);
      await w.loadFile(pagina, { search: '?debug=1' });
      for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.est && ${H}.T && ${H}.renderer)`).catch(() => false)) break; }
      await js(`document.getElementById('btn-entrar').click(); 1`);
      await esperar(3000);
      const otra = await js(`(() => { const H = ${H}, d = window.__demo; const firma = (o) => { const c = o.malla.geometry.attributes.color.array; let s = 0; for (let i = 0; i < c.length; i += 7) s += c[i]; return { verts: o.malla.geometry.attributes.position.count, suma: +s.toFixed(4) }; };
        const res = {}; for (const o of H.obras.obras) if (o.malla && ['puesto', 'casilla', 'galponcito', 'banco', 'mesa-campo'].includes(o.plano.id)) res[o.plano.id] = firma(o); return res })()`);
      const mismos = Object.keys(demo.res).filter((id) => ['puesto', 'casilla', 'galponcito', 'banco', 'mesa-campo'].includes(id)).every((id) => otra[id] && otra[id].verts === demo.res[id].verts && otra[id].suma === demo.res[id].suma);
      ok(mismos, `${q}: después de guardar y recargar cada casa tiene el mismo aspecto (${JSON.stringify(otra)})`);
    }
  }
  if (resultados.baja && resultados.media) {
    const b = resultados.baja.casas, m = resultados.media.casas;
    ok(b.puesto && m.puesto && m.puesto.verts > b.puesto.verts * 1.3, `Media arma el puesto con más vértices que Baja (${b.puesto && b.puesto.verts} → ${m.puesto && m.puesto.verts}): hay donde pintar la sombra`);
  }
  ok(errores.length === 0, 'sin errores de consola ni de shaders' + (errores.length ? ': ' + errores.join(' | ') : ''));
  console.log(fallas ? `FALLARON ${fallas} de ${pasos}` : `TODO BIEN: ${pasos} pasos OK`);
  try { app.exit(fallas ? 1 : 0); } catch { process.exit(fallas ? 1 : 0); }
});

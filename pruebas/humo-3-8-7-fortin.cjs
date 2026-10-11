// 3.8.7 (duendes): partida real del fortín contra cada tipo de duende (Electron + WebGL). Cada defensa se arma en
// su claro y se le manda, de a uno, cada tipo (rastreador, bruto, tirador, saltador, escupidor, excavador, volador y
// el mandamás): se anota qué le hizo (daño, colgado, encandilado, frenado, rumbo) y se revisa que nada quede roto
// (posiciones NaN, el volador atrapado en el aire, el excavador bajo tierra herido, errores de consola).
// Uso: HOJ_PERFIL=<carpeta> npx electron --no-sandbox -r ./herramientas/perfil-propio.cjs pruebas/humo-3-8-7-fortin.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: false, width: 1024, height: 640, webPreferences: { backgroundThrottling: false } });
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
  const entrar = async () => {
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
  };
  const H = 'window.__hojarasca';
  // un claro para cada prueba (como humo-2-6)
  let claro = 0;
  const irAlClaro = () => js(`(()=>{ const H = ${H}, r = H.T.lugares.refugio, j = H.jugador.estado;
    for (let k = 0; k < 60; k++) {
      const x = r.x + 70 + ((${claro} + k) % 8) * 26, z = r.z + 70 + Math.floor(((${claro} + k)) / 8) * 26;
      if (H.T.agua(x, z)) continue;
      j.pos.set(x, H.T.altura(x, z) + 0.05, z); j.yaw = 0; j.pitch = 0; return k;
    } return -1 })()`).then((k) => { claro += (k >= 0 ? k : 0) + 1; return k; });
  const poner = (id, dx = 0, dz = -5, yaw = null) => js(`(()=>{ const H = ${H}, O = H.obras, P = H.progreso, j = H.jugador.estado;
    Object.assign(P.materiales, { tronco: 200, tabla: 200, piedra: 200, cristal: 200 });
    const p = H.PLANOS.find(q => q.id === '${id}'); if (!p) return { error: 'no hay plano ${id}' };
    let motivo = '';
    for (const r of [0, 1.5, 3, 4.5, 6]) for (let k = 0; k < 8; k++) {
      O.elegir(p);
      const a = k * Math.PI / 4, x = j.pos.x + (${dx}) + Math.cos(a) * r, z = j.pos.z + (${dz}) + Math.sin(a) * r;
      const f = O.fundar(x, z, ${yaw === null ? 'j.yaw' : yaw}, j.pos.y);
      if (!f.ok) { motivo ||= f.motivo; continue; }
      for (let g = 0; g < 12 && f.obra.datos.etapas < f.obra.plano.etapas.length; g++) { const q = O.avanzar(f.obra, P.materiales); if (!q.ok) break; }
      O.elegir(null); P.obras = O.obras.map(o => o.datos);
      H.desafio.fortin.refrescar(); H.desafio.defensas.refrescar();
      return { ok: true, i: O.obras.indexOf(f.obra), x: f.obra.datos.x, z: f.obra.datos.z, y: f.obra.datos.y, rot: f.obra.datos.rot || 0 };
    }
    O.elegir(null); return { error: 'no hubo lugar: ' + motivo } })()`);
  // otro claro si en este no hubo lugar (pendiente, la escalera del adarve colgando)
  const ponerEnClaro = async (id, dx, dz) => { let o = null; for (let k = 0; k < 10; k++) { await irAlClaro(); o = await poner(id, dx, dz); if (o.ok) return o; } return o; };
  const limpiar = () => js(`(()=>{ const H = ${H}; for (const a of H.desafio.aliens) { a.estado = 'irse'; a.t = 9; } H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 }); H.progreso.desafio.salud = 100; return 1 })()`);
  const desarmar = (i) => js(`(()=>{ const H = ${H}, o = H.obras.obras[${i}]; if (o) H.obras.destruir(o); H.progreso.obras = H.obras.obras.map(o => o.datos); H.desafio.fortin.refrescar(); H.desafio.defensas.refrescar(); return 1 })()`);
  const TIPOS = process.env.TIPOS ? process.env.TIPOS.split(',') : ['rastreador', 'bruto', 'tirador', 'saltador', 'escupidor', 'excavador', 'volador', 'jefe'];
  const SOLO = process.env.SOLO ? process.env.SOLO.split(",") : null;
  const toca = (n) => !SOLO || SOLO.includes(n);
  // Manda un duende de `tipo` a (x, z) y simula `seg`: devuelve lo que le pasó cuadro a cuadro (lo peor de cada cosa).
  const probar = (tipo, x, z, seg, extra = '', tx = x, tz = z) => js(`(()=>{ const H = ${H}, D = H.desafio, j = H.jugador.estado;
    const a = D.invocar('${tipo}', (${x}), (${z})); if (!a) return { error: 'no bajó' };
    a.vida = a.vidaMax = 5000; ${extra}
    const r = { dano: 0, colgado: 0, colgadoAlto: 0, colgadoVolando: 0, encandilado: 0, quemado: 0, enredado: 0, nan: 0, estados: {}, alto: 0, bajoTierraHerido: 0, minD: 1e9 };
    let vidaAntes = a.vida;
    for (let i = 0; i < ${Math.round(seg / 0.05)}; i++) {
      H.progreso.desafio.salud = 100;
      const bt = a.estado === 'bajoTierra';
      D.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      const p = a.m.g.position;
      if (!Number.isFinite(p.x + p.y + p.z)) r.nan++;
      if (bt && a.estado === 'bajoTierra' && a.vida < vidaAntes) r.bajoTierraHerido++;
      vidaAntes = a.vida;
      r.estados[a.estado] = (r.estados[a.estado] || 0) + 1;
      const sobre = p.y - H.T.altura(p.x, p.z);
      r.alto = Math.max(r.alto, sobre);
      if (a.colgadoT > 0) { r.colgado++; r.colgadoAlto = Math.max(r.colgadoAlto, sobre); if (a.def.vuela && sobre > 2.5) r.colgadoVolando++; }
      if (a.encandilado > 0) r.encandilado++;
      if (a.fuegoT > 0) r.quemado++;
      if (a.enredadoT > 0) r.enredado++;
      r.minD = Math.min(r.minD, Math.hypot(p.x - (${tx}), p.z - (${tz})));
      if (a.estado === 'morir' || a.estado === 'irse') break;
    }
    r.dano = Math.round(a.vidaMax - a.vida);
    r.estadoFinal = a.estado;
    r.minD = +r.minD.toFixed(1); r.alto = +r.alto.toFixed(1); r.colgadoAlto = +r.colgadoAlto.toFixed(1);
    return r })()`);
  const tabla = {};
  const anotar = (def, tipo, r) => { (tabla[def] ||= {})[tipo] = r; console.log(`   ${def.padEnd(18)} ${tipo.padEnd(11)} ${JSON.stringify(r)}`); };

  try {
    await abrir();
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false})); 1`);
    await abrir(); await entrar();
    ok(await js(`!!${H}?.desafio?.fortin`), 'carga el Desafío con el fortín');
    await js(`(()=>{ const P = ${H}.progreso; P.horas = 23; P.desafio.tutorial = 99; return 1 })()`);

    // ---- las trampas que se pisan: cada tipo, encima
    for (const [id, dz] of [['troncos-colgantes', -6], ['cerco-cristal', -5], ['trampa-lazo', -5], ['abrojos', -6]]) {
      seccion(id);
      for (const tipo of (toca(id) ? TIPOS : [])) {
        const o = await ponerEnClaro(id, 0, dz);
        if (!o.ok) { ok(false, `${id}: ${JSON.stringify(o)}`); continue; }
        if (id === 'cerco-cristal') await js(`${H}.desafio.fortin.alEmpezarNoche(); 1`);
        // el jugador del otro lado, a 10 m: el duende viene caminando y pasa por la trampa
        await js(`(()=>{ const H = ${H}, j = H.jugador.estado; j.pos.set(${o.x} - 10, H.T.altura(${o.x} - 10, ${o.z}) + 0.05, ${o.z}); return 1 })()`);
        const r = await probar(tipo, o.x + 0.3, o.z, 3, '', o.x, o.z); r.armada = await js(`${H}.obras.obras[${o.i}]?.datos.armada`); anotar(id, tipo, r);
        await limpiar(); await desarmar(o.i);
      }
    }
    // ---- la rampa de troncos: cargada, soltada contra cada tipo
    seccion('rampa-troncos');
    for (const tipo of (toca('rampa-troncos') ? TIPOS : [])) {
      const o = await ponerEnClaro('rampa-troncos', 0, -4);
      if (!o.ok) { ok(false, `rampa: ${JSON.stringify(o)}`); continue; }
      const del = await js(`({ x: ${o.x} + Math.sin(${o.rot}) * 8, z: ${o.z} + Math.cos(${o.rot}) * 8 })`);
      await js(`(()=>{ const H = ${H}, o = H.obras.obras[${o.i}]; o.datos.troncos = 3; const j = H.jugador.estado; j.pos.set(${o.x} + 1.2, H.T.altura(${o.x} + 1.2, ${o.z}) + 0.05, ${o.z}); return 1 })()`);
      anotar('rampa-troncos', tipo, await probar(tipo, del.x, del.z, 3, `a.dudaT = 999; H.desafio.fortin.usarCerca(j.pos, 1, Infinity);`));
      await limpiar(); await desarmar(o.i);
    }
    // ---- la catapulta: un tipo a 22 m
    seccion('catapulta');
    for (const tipo of (toca('catapulta') ? TIPOS : [])) {
      const o = await ponerEnClaro('catapulta', 0, 0);
      if (!o.ok) { ok(false, `catapulta: ${JSON.stringify(o)}`); continue; }
      await js(`(()=>{ const H = ${H}; H.obras.obras[${o.i}].datos.piedras = 10; const j = H.jugador.estado; j.pos.set(${o.x} - 30, H.T.altura(${o.x} - 30, ${o.z}) + 0.05, ${o.z}); return 1 })()`);
      anotar('catapulta', tipo, await probar(tipo, o.x + 22, o.z + 5, 9, `a.dudaT = 999;`));
      await limpiar(); await desarmar(o.i);
    }
    // ---- la resina: cargada de día, volcada con el duende abajo
    seccion('resina');
    for (const tipo of (toca('resina') ? TIPOS : [])) {
      const o = await ponerEnClaro('adarve', 0, -5);
      if (!o.ok) { ok(false, `adarve: ${JSON.stringify(o)}`); continue; }
      await js(`(()=>{ const H = ${H}; H.obras.obras[${o.i}].datos.resina = 2; return 1 })()`);
      anotar('resina', tipo, await probar(tipo, o.x - 1.5, o.z + 1.5, 1.5, `a.dudaT = 999; for (let k = 0; k < 4; k++) D.actualizar(0.05, { noche: 1, dtReal: 0.05 }); j.pos.set(${o.x} + 1.0, H.T.altura(${o.x} + 1.0, ${o.z}) + 0.05, ${o.z}); D.fortin.usarCerca(j.pos, 1, Infinity);`));
      await limpiar(); await desarmar(o.i);
    }
    // ---- el puente levadizo subido es pared: ¿quién pasa, quién lo rompe, quién se traba?
    seccion('puente subido');
    for (const tipo of (toca('puente subido') ? TIPOS : [])) {
      const o = await ponerEnClaro('puente-levadizo', 0, -5);
      if (!o.ok) { ok(false, `puente: ${JSON.stringify(o)}`); continue; }
      await js(`(()=>{ const H = ${H}, j = H.jugador.estado; for (let k = 0; k < 4; k++) H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 }); const r = ${o.rot}; j.pos.set(${o.x} - Math.sin(r) * 3, H.T.altura(${o.x} - Math.sin(r) * 3, ${o.z} - Math.cos(r) * 3) + 0.05, ${o.z} - Math.cos(r) * 3); return 1 })()`);
      const del = await js(`({ x: ${o.x} + Math.sin(${o.rot}) * 9, z: ${o.z} + Math.cos(${o.rot}) * 9 })`);
      const r = await probar(tipo, del.x, del.z, 14);
      r.obraVida = await js(`(()=>{ const o = ${H}.obras.obras[${o.i}]; return o ? Math.round(o.datos.vida ?? -1) : 'rota' })()`);
      anotar('puente subido', tipo, r);
      await limpiar(); await desarmar(o.i);
    }
    // revisión: nada NaN, ningún volador colgado en el aire, ningún excavador herido bajo tierra
    for (const [def, fila] of Object.entries(tabla)) for (const [tipo, r] of Object.entries(fila)) {
      if (r.error) { ok(false, `${def} / ${tipo}: ${r.error}`); continue; }
      if (r.nan) ok(false, `${def} / ${tipo}: posición NaN (${r.nan} cuadros)`);
      if (r.colgadoVolando) ok(false, `${def} / ${tipo}: el volador quedó colgado del lazo en el aire`);
      if (r.bajoTierraHerido) ok(false, `${def} / ${tipo}: herido bajo tierra (${r.bajoTierraHerido})`);
    }
    ok(true, 'matriz completa');
  } catch (e) {
    errores.push('excepcion: ' + (e && e.message ? e.message : e));
  }
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});

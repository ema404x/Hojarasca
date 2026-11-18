// 4.30.1 (A): el caballo en una partida real (por el lanzador, con el candado de Electron tomado): la Plaza de los Duendes al lado del retablo (donde el
// usuario lo encontró metido en el árbol), la cabeza y las riendas de cerca, una pendiente (de subida y de costado), montado en el camino y en el Puente
// de Troncos. Además de las fotos mide, por toma, cuánto queda cada casco sobre (o bajo) el suelo y cuánto empuja la colisión a cada parte del cuerpo.
//   $env:CAP_ESC='plaza,cabeza,pendiente,montado,puente'; $env:CAP_SALIDA='<carpeta>'; powershell -File herramientas\lanzar-electron.ps1 -Script herramientas\capturas-4-30-1-a.cjs -Espera 600 -Perfil <carpeta>
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const env = (n, d) => process.env['CAP_' + n] || d;
const pagina = path.resolve(env('PAGINA', 'index.html'));
const salida = path.resolve(env('SALIDA', path.join(process.env.TEMP || '.', 'capturas-4-30-1-a')));
const ESCS = env('ESC', 'plaza').split(',');
fs.mkdirSync(salida, { recursive: true });
dialog.showErrorBox = (t, c) => { try { fs.writeFileSync(path.join(salida, 'error.txt'), t + String.fromCharCode(10) + c); } catch { /* sin carpeta */ } };
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log('ERROR: ' + (e && e.stack ? e.stack : e)); salir(1); });
process.on('unhandledRejection', (e) => { console.log('ERROR: ' + (e && e.stack ? e.stack : e)); salir(1); });
setTimeout(() => { console.log('ERROR: tardó más de 10 minutos'); salir(2); }, 10 * 60 * 1000).unref?.();

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, T = H.T;
  const A = window.__CAP = {};
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  A.camara = (x, z, y, tx, tz, pitch, fov, horas) => {
    H.jugador.ubicar(x, z, Math.atan2(x - tx, z - tz));
    H.__camaraFija = { x, y, z, yaw: Math.atan2(x - tx, z - tz), pitch };
    H.camara.fov = fov; H.camara.updateProjectionMatrix();
    H.progreso.horas = horas; window.__hora = horas;
    H.camara.children.forEach((q) => { q.visible = false; });
    return 1;
  };
  A.cuadros = async (n) => { H.volverAlJuego?.(true); for (let i = 0; i < n; i++) { H.progreso.horas = window.__hora; H.__bucle(); if (i % 10 === 9) await dormir(0); } return 1; };
  // el árbol (un obstáculo redondo de tronco) más cercano a (x, z)
  A.arbol = (x, z, rad) => {
    let mejor = null;
    // los árboles del monte (los que chocan) y los álamos de la aldea
    const lista = (H.veg.arboles || []).filter((a) => a.choque && !a.talado).map((a) => ({ x: a.choque.x, z: a.choque.z, r: a.choque.r }));
    for (let dx = -rad; dx <= rad; dx += 1) for (let dz = -rad; dz <= rad; dz += 1) for (const o of H.col.cercanos(x + dx, z + dz)) if (!o.seg && o.duenio === 'aldea:accesorios' && o.alturaMax - o.alturaMin > 8) lista.push(o);
    for (const o of lista) {
      const d = Math.hypot(o.x - x, o.z - z);
      if (!(d > 2.5 && d < rad && (!mejor || d < mejor.d))) continue;
      // (que choque de verdad: los del monte que despejó la aldea siguen en la lista pero ya no chocan)
      const q = { x: o.x + 0.05, z: o.z, y: T.altura(o.x, o.z) + 0.3 }; H.col.resolver(q, 0.1, 1.5);
      if (Math.hypot(q.x - o.x - 0.05, q.z - o.z) > 0.05) mejor = { x: o.x, z: o.z, r: o.r, d };
    }
    return mejor;
  };
  // los cuatro cascos: cuánto queda la suela sobre el suelo (+ en el aire, - hundido) y cuánto empuja la colisión a cada parte del cuerpo
  A.medir = (moro) => {
    const c = H.__caballo(), out = { cascos: [], empuje: [] };
    const g = moro ? H.__aldea.animales().estado().caballos.find((k) => k.id === 'moro')?.malla : c.malla;
    if (!g) return null;
    g.updateMatrixWorld(true);
    const V = H.THREE.Vector3;
    g.traverse((o) => { if (o.isGroup && Math.abs(Math.abs(o.position.x) - 0.2) < 1e-3 && Math.abs(o.position.y - 1.05) < 1e-3) { const p = new V(0, -1.055, 0.04); o.localToWorld(p); const pl = H.col.plataformaEn?.(p.x, p.z, p.y + 0.3); const s = pl ? Math.max(pl.alto, T.altura(p.x, p.z)) : T.altura(p.x, p.z); out.cascos.push(+(p.y - s).toFixed(3)); } });
    const yaw = g.rotation.y, fx = Math.sin(yaw), fz = Math.cos(yaw);
    for (const [zz, r] of [[-0.72, 0.42], [0, 0.45], [0.66, 0.4], [1.3, 0.3]]) {
      const q = { x: g.position.x + fx * zz, z: g.position.z + fz * zz, y: g.position.y + 0.2 };
      const x0 = q.x, z0 = q.z; H.col.resolver(q, r, 1.8);
      out.empuje.push(+Math.hypot(q.x - x0, q.z - z0).toFixed(2));
    }
    out.pitch = +g.rotation.x.toFixed(3); out.roll = +g.rotation.z.toFixed(3); out.orden = g.rotation.order;
    out.estado = { d: H.dondeEstaElCaballo(), est: { x: c.est.x, z: c.est.z, visible: c.est.visible }, cosas: !!H.progreso.cosas?.caballo, modo: typeof H.modoJuego === 'function' ? H.modoJuego() : String(H.modoJuego), tren: !!H.progreso.trenViaje?.caballo, jug: { x: H.jugador.estado.pos.x, z: H.jugador.estado.pos.z } };
    out.donde = { x: +g.position.x.toFixed(2), z: +g.position.z.toFixed(2), y: +g.position.y.toFixed(2), yaw: +yaw.toFixed(2) };
    return out;
  };
  // una ladera: el punto más cerca de (x, z) con pendiente entre 0,2 y 0,35 rad, seco y sin obstáculos en 4 m
  A.ladera = (x, z) => {
    for (let r = 10; r < 160; r += 3) for (let k = 0; k < 24; k++) {
      const a = k / 24 * Math.PI * 2, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
      const n = T.normal(px, pz), inc = Math.acos(Math.min(1, n.y));
      if (inc < 0.2 || inc > 0.35) continue;
      if (T.agua && T.altura(px, pz) < (T.nivelAgua ?? -1e9) + 0.5) continue;
      let libre = true;
      for (let dx = -4; dx <= 4 && libre; dx += 2) for (let dz = -4; dz <= 4 && libre; dz += 2) if (H.col.cercanos(px + dx, pz + dz).length) libre = false;
      if (!libre) continue;
      return { x: px, z: pz, subida: Math.atan2(-n.x, -n.z), inc };
    }
    return null;
  };
  return 1;
})()`;

// cada escenario: `prep` pone el caballo (y devuelve dónde quedó: {x, z, yaw}), `cam` la cámara a partir de eso
const ESCENARIOS = {
  // la plaza: te bajás al lado del árbol que está junto al retablo, de cola al tronco (como en la captura del usuario)
  plaza: {
    prep: `(() => { const L = H.__rincones.mundo().lugar('retablo'); const a = window.__CAP.arbol(L.x, L.z, 20); if (!a) return { error: 'sin árbol' };
      let ux = a.x - L.x, uz = a.z - L.z; const d = Math.hypot(ux, uz) || 1; ux /= d; uz /= d;
      const js = H.jugador.estado, px = a.x + ux * (a.r + 0.62), pz = a.z + uz * (a.r + 0.62);
      H.jugador.ubicar(px, pz, Math.atan2(ux, uz) - Math.PI); js.yaw = Math.atan2(ux, uz) - Math.PI;
      js.montado = { trote: 6.2, galope: 11, alto: 0.95, aguaMax: 0.9 }; H.desmontar();
      const c = H.dondeEstaElCaballo(); return { x: c.x, z: c.z, yaw: c.yaw, arbol: a, retablo: { x: L.x, z: L.z } }; })()`,
    cam: (p) => { const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw), sx = fz, sz = -fx; return { x: p.x + sx * 6.5 + fx * 1.2, z: p.z + sz * 6.5 + fz * 1.2, dy: 1.6, tx: p.x, tz: p.z, pitch: -0.04, fov: 55 }; },
    otraCam: (p) => { const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw), sx = fz, sz = -fx; return { x: p.x - sx * 6.5 + fx * 1.2, z: p.z - sz * 6.5 + fz * 1.2, dy: 1.6, tx: p.x, tz: p.z, pitch: -0.04, fov: 55 }; },
  },
  // el Moro, uno de los dos caballos atados de la plaza: es el de la captura del usuario (estaba en el lugar del retablo y de un álamo)
  moro: {
    moro: true,
    prep: `(() => { const L = H.__rincones.mundo().lugar('retablo'); return { x: L.x, z: L.z, yaw: 0 }; })()`,
    cam: (p) => ({ x: p.x + 1.5, z: p.z + 7, dy: 1.5, tx: p.x - 0.5, tz: p.z, pitch: -0.06, fov: 55 }),
    otraCam: (p) => ({ x: p.x - 7, z: p.z + 1, dy: 1.5, tx: p.x, tz: p.z, pitch: -0.06, fov: 55 }),
  },
  // la cabeza, el cuello y las riendas de cerca (de costado y de tres cuartos)
  cabeza: {
    prep: `(() => { const L = H.T.lugares.refugio; const x = L.x + 14, z = L.z + 10; H.progreso.caballo = { x, z, yaw: 0.3 }; return { x, z, yaw: 0.3 }; })()`,
    cam: (p) => { const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw), sx = fz, sz = -fx; const hx = p.x + fx * 1.1, hz = p.z + fz * 1.1; return { x: hx + sx * 2.6, z: hz + sz * 2.6, dy: 1.75, tx: hx, tz: hz, pitch: -0.05, fov: 50 }; },
    otraCam: (p) => { const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw), sx = fz, sz = -fx; const hx = p.x + fx * 1.1, hz = p.z + fz * 1.1; return { x: hx + sx * 1.8 + fx * 1.9, z: hz + sz * 1.8 + fz * 1.9, dy: 1.85, tx: hx, tz: hz, pitch: -0.08, fov: 50 }; },
  },
  // una ladera: mirando para arriba (la grupa abajo) y de costado
  pendiente: {
    prep: `(() => { const L = H.T.lugares.refugio; const s = window.__CAP.ladera(L.x, L.z); if (!s) return { error: 'sin ladera' }; H.progreso.caballo = { x: s.x, z: s.z, yaw: s.subida }; return { x: s.x, z: s.z, yaw: s.subida, inc: s.inc }; })()`,
    cam: (p) => { const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw), sx = fz, sz = -fx; return { x: p.x + sx * 5, z: p.z + sz * 5, dy: 0.9, tx: p.x, tz: p.z, pitch: -0.02, fov: 50 }; },
    otraCam: (p) => { const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw), sx = fz, sz = -fx; return { x: p.x + fx * 5, z: p.z + fz * 5, dy: 0.9, tx: p.x, tz: p.z, pitch: -0.02, fov: 50 }; },
  },
  'pendiente-costado': {
    prep: `(() => { const L = H.T.lugares.refugio; const s = window.__CAP.ladera(L.x, L.z); if (!s) return { error: 'sin ladera' }; const yaw = s.subida + Math.PI / 2; H.progreso.caballo = { x: s.x, z: s.z, yaw }; return { x: s.x, z: s.z, yaw, inc: s.inc }; })()`,
    cam: (p) => { const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw), sx = fz, sz = -fx; return { x: p.x + fx * 5.5, z: p.z + fz * 5.5, dy: 0.9, tx: p.x, tz: p.z, pitch: -0.02, fov: 50 }; },
  },
  // montado en el camino, al lado de la plaza
  montado: {
    prep: `(() => { const L = H.__rincones.mundo().lugar('retablo'); const x = L.x + 9, z = L.z - 6; H.progreso.caballo = { x, z, yaw: 1.2 }; H.jugador.ubicar(x, z, 0); H.montar(); const c = H.dondeEstaElCaballo(); return { x: c.x, z: c.z, yaw: c.yaw }; })()`,
    cam: (p) => { const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw), sx = fz, sz = -fx; return { x: p.x + sx * 5.5, z: p.z + sz * 5.5, dy: 1.7, tx: p.x, tz: p.z, pitch: -0.02, fov: 55, sinUbicar: true }; },
  },
  // el Puente de Troncos: montado sobre la cubierta
  puente: {
    prep: `(() => { const P = H.T.lugares.puente; if (!P) return { error: 'sin puente' }; H.progreso.caballo = { x: P.x, z: P.z, yaw: 0 }; H.jugador.ubicar(P.x, P.z, 0, P.y); H.montar(); H.jugador.ubicar(P.x, P.z, H.jugador.estado.yaw, P.y); const c = H.dondeEstaElCaballo(); return { x: c.x, z: c.z, yaw: c.yaw, y: P.y }; })()`,
    cam: (p) => { const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw), sx = fz, sz = -fx; return { x: p.x + sx * 6, z: p.z + sz * 6, y: (p.y || 0) + 1.6, tx: p.x, tz: p.z, pitch: -0.05, fov: 55, sinUbicar: true }; },
  },
};

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: true, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300)); });
  const js = (c) => w.webContents.executeJavaScript(c, true);
  const H = 'window.__hojarasca';
  const ajustes = `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'alta', ultra:false, clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', modoFluido:false, estacion:'verano'})); 1`;
  await w.loadFile(pagina, { search: '?debug=1' });
  await js(ajustes);
  await w.loadFile(pagina, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.est && ${H}.T)`).catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3500);
  await js(`${H}.ajustes.limiteFps = 'libre'; ${H}.volverAlJuego?.(true); 1`);
  await js(PAGINA);
  await js(`(() => { const R = ${H}.renderer; R.setPixelRatio(1.5); const p = ${H}.__postproceso(); if (p) p.redimensionar(window.innerWidth, window.innerHeight); return 1 })()`);
  await js(`(() => { let s = document.createElement('style'); s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; document.head.appendChild(s); return 1 })()`);
  await js(`(() => { const H = ${H}; H.progreso.cosas = H.progreso.cosas || {}; H.progreso.cosas.caballo = true; for (let n = 0; n < 60; n++) H.__bucle(); return 1 })()`);
  const foto = async (nombre) => {
    let img = null;
    for (let i = 0; i < 5 && !img; i++) { try { img = await w.webContents.capturePage(); } catch { await esperar(1200); } }
    if (img) { fs.writeFileSync(path.join(salida, nombre + '.png'), img.toPNG()); console.log('  ' + nombre); } else console.log('  sin captura ' + nombre);
  };
  const resultado = { escenarios: {}, errores };
  for (const esc of ESCS) {
    const e = ESCENARIOS[esc];
    if (!e) { console.log('no hay escenario ' + esc); continue; }
    await js(`(() => { const js = ${H}.jugador.estado; js.montado = null; ${H}.__camaraFija = null; return 1 })()`);
    const p = await js(`(() => { const H = ${H}; return ${e.prep} })()`);
    if (!p || p.error) { console.log(esc + ': ' + JSON.stringify(p)); continue; }
    const r = { donde: p, fotos: [] };
    let k = 0;
    for (const cf of [e.cam, e.otraCam].filter(Boolean)) {
      const c = cf(p);
      await js(`(() => { const H = ${H}, T = H.T; const y = ${c.y ?? 'null'} ?? (T.altura(${c.x}, ${c.z}) + ${c.dy}); ${c.sinUbicar ? `H.__camaraFija = { x: ${c.x}, y, z: ${c.z}, yaw: Math.atan2(${c.x} - ${c.tx}, ${c.z} - ${c.tz}), pitch: ${c.pitch} }; H.camara.fov = ${c.fov}; H.camara.updateProjectionMatrix(); H.progreso.horas = 10; window.__hora = 10; H.camara.children.forEach((q) => { q.visible = false; });` : `window.__CAP.camara(${c.x}, ${c.z}, y, ${c.tx}, ${c.tz}, ${c.pitch}, ${c.fov}, 10);`} return 1 })()`);
      await js(`window.__CAP.cuadros(150)`);
      await esperar(900);
      await js(`(() => { const H = ${H}, c = H.camara.position; for (let i = 0; i < 4; i++) { H.veg.actualizar(c, 1); H.objetos.actualizar?.(c); } return 1 })()`);
      await js(`window.__CAP.cuadros(60)`);
      const nombre = esc + (k ? '-' + (k + 1) : '');
      await foto(nombre); r.fotos.push(nombre);
      r['medida' + (k ? k + 1 : '')] = await js(`window.__CAP.medir(${e.moro ? 'true' : ''})`);
      k++;
    }
    resultado.escenarios[esc] = r;
    console.log(esc + ': ' + JSON.stringify(r));
  }
  fs.writeFileSync(path.join(salida, 'capturas.json'), JSON.stringify(resultado, null, 1));
  console.log('errores de consola: ' + errores.length + (errores.length ? ' ' + JSON.stringify(errores.slice(0, 5)) : ''));
  salir(0);
});

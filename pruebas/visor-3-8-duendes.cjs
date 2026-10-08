// 3.8.0: capturas y costo de los duendes del Desafío (los de verdad, en el juego): los traviesos al
// anochecer, los viejos de noche, las lechuzas, el nido, la madriguera y un ataque con 30 duendes.
// Los duendes de cada toma se sacan de la lista del Desafío (no los mueve la IA) y se animan acá con
// la pose que pide la toma; la cámara queda fija.
// Uso: npx electron --no-sandbox -r <abs>/herramientas/perfil-propio.cjs pruebas/visor-3-8-duendes.cjs <salida> [toma,toma]
//   VISOR_INDEX=<index.html> mide otro armado (el de antes, con los invasores).
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.argv.find((a, i) => i > 1 && /[\\/]/.test(a) && !a.endsWith('.cjs')) || path.join(raiz, 'pruebas', 'salidas', 'duendes-3-8'));
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
app.commandLine.appendSwitch('disable-gpu-sandbox');
if (!process.env.HOJ_PERFIL) app.setPath('userData', path.join(salida, 'perfil'));

// cada toma: la hora, dónde va la cámara (relativo al lugar, mirando hacia +z del lugar) y qué duendes
// [tipo, x, z, giro (0 = mirando a la cámara), pose { vel, carrera, ataca, golpe, apuntando, agazapado, robando, viejo, etapa, alto, risa }]
const TOMAS = {
  traviesos: { hora: 20.25, ojo: [0, 1.5, 0], a: [0, 0.75, 6.5], fov: 50, duendes: [
    ['rastreador', -1.4, 5.2, 0.3, { vel: 3.5, carrera: 1, robando: 1, risa: 1 }],
    ['rastreador', 0.3, 4.6, -0.2, { vel: 2.2 }],
    ['saltador', 1.9, 5.8, -0.5, { vel: 3 }],
    ['tirador', -2.9, 7.6, 0.4, { apuntando: 1 }],
    ['escupidor', 2.6, 8.2, -0.3, { vel: 1.4 }],
    ['excavador', 0.9, 9.5, 0.1, { agazapado: 1 }],
  ] },
  'traviesos-cerca': { hora: 20.25, ojo: [0, 1.3, 0], a: [0, 0.8, 4], fov: 40, duendes: [
    ['rastreador', -0.55, 3.3, 0.2, { robando: 1, risa: 1 }],
    ['rastreador', 0.6, 3.6, -0.25, {}],
  ] },
  viejos: { hora: 23.2, ojo: [0, 1.2, 0], a: [0, 1.1, 7], fov: 52, luna: 1, duendes: [
    ['rastreador', -1.3, 4.8, 0.15, { viejo: 1, vel: 1.2 }],
    ['bruto', 1.6, 6.2, -0.3, { vel: 1 }],
    ['saltador', -3.2, 8.4, 0.4, { viejo: 1, agazapado: 1 }],
    ['tirador', 3.4, 9.6, -0.4, { viejo: 1 }],
    ['jefe', -0.4, 13, 0, { vel: 0.8 }],
  ] },
  lechuzas: { hora: 20.6, ojo: [0, 1.5, 0], a: [0, 3.0, 7], fov: 58, duendes: [
    ['volador', 0.4, 5.2, 0.5, { alto: 2.2, vuela: 1 }],
    ['volador', -3.5, 10, 1.6, { alto: 5.5, vuela: 1, fase: 2 }],
    ['volador', 4.5, 13, -1.2, { alto: 7, vuela: 1, fase: 4, viejo: 1 }],
  ] },
  nido: { hora: 19.4, nido: 1, ojo: [0, 1.4, 0], a: [0, 0.5, 4.4], fov: 52, duendes: [] },
  madriguera: { hora: 19.6, madriguera: 1, ojo: [0, 1.65, 0], a: [0, 2.2, 13], fov: 50, duendes: [
    ['rastreador', -2.5, 9.5, 0.4, { agazapado: 1 }],
  ] },
  // el Viejo del Nido de tres cuartos de espalda: los hongos de luz de la joroba (el punto débil)
  jefe: { hora: 21.4, ojo: [0, 1.7, 0], a: [0, 2.2, 8], fov: 55, duendes: [
    ['jefe', 0.6, 8.5, 2.5, { vel: 0.6 }],
    ['bruto', -2.6, 6.5, 0.3, { golpe: 0.6, ataca: 1 }],
  ] },
  ataque: { hora: 22.0, ojo: [0, 1.65, 0], a: [0, 1.0, 14], fov: 62, luna: 1, ataque: 30, medir: 1, duendes: [] },
};

app.whenReady().then(async () => {
  fs.mkdirSync(salida, { recursive: true });
  const arg = process.argv.find((a) => /^[a-z-]+(,[a-z-]+)*$/.test(a) && a.split(',').every((t) => TOMAS[t]));
  const pedidas = (arg || Object.keys(TOMAS).join(',')).split(',');
  const w = new BrowserWindow({ show: true, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const js = (c) => w.webContents.executeJavaScript(c);
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || e.level === 3 || /Uncaught|duendes:|THREE.|Shader|ERROR|WebGL|GL_/.test(m)) && !(process.env.VISOR_GL ? /Security|Autofill|favicon/ : /Security|GL_INVALID|Autofill|favicon|PCF/).test(m)) { errores.push(m.slice(0, 400)); console.log('[página]', m.slice(0, 600)); } });
  const url = process.env.VISOR_INDEX ? path.resolve(process.env.VISOR_INDEX) : path.join(raiz, 'index.html');
  const search = '?debug=1';
  await w.loadFile(url, { search });
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'alta', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'})); 1`);
  await w.loadFile(url, { search });
  const t0 = Date.now();
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.desafio)').catch(() => false)) break; if (errores.length > 3) break; }
  const carga = Date.now() - t0;
  if (!(await js('!!(window.__hojarasca && window.__hojarasca.desafio)').catch(() => false))) { console.log('no arrancó', errores.slice(0, 3)); app.exit(1); return; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(4000);
  await js(`(() => { const s = document.createElement('style'); s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; document.head.appendChild(s); return 1; })()`);
  // el lugar: un llano cerca del refugio, mirando al bosque
  const lugar = JSON.parse(await js(`(() => { const H = window.__hojarasca, T = H.T, r = T.lugares.refugio;
    let mejor = null;
    for (let a = 0; a < 24; a++) for (const d of [40, 60, 80, 100]) {
      const x = r.x + Math.cos(a / 24 * 6.283) * d, z = r.z + Math.sin(a / 24 * 6.283) * d, y = T.altura(x, z);
      if (T.agua(x, z)) continue;
      let des = 0; for (let k = 0; k < 8; k++) for (const e of [6, 14]) des = Math.max(des, Math.abs(T.altura(x + Math.cos(k) * e, z + Math.sin(k) * e) - y));
      const pts = -des - Math.abs(d - 60) * 0.02;
      if (!mejor || pts > mejor.pts) mejor = { x, z, pts };
    }
    let rumbo = 0, mx = -1;
    for (let a = 0; a < 16; a++) { const t = a / 16 * 6.283, n = H.veg?.arbolesCerca ? H.veg.arbolesCerca(mejor.x + Math.sin(t) * 26, mejor.z + Math.cos(t) * 26, 14, []).length : 0; if (n > mx) { mx = n; rumbo = t; } }
    mejor.rumbo = rumbo; return JSON.stringify(mejor); })()`));
  console.log('lugar', lugar, 'carga', carga, 'ms');
  const informe = [`lugar: ${JSON.stringify(lugar)} · carga hasta el Desafío: ${carga} ms · index: ${url}`];
  for (const nombre of pedidas) {
    const T0 = TOMAS[nombre];
    const r = await js(`(() => { const H = window.__hojarasca, D = H.desafio, T = H.T, L = ${JSON.stringify(lugar)}, t = ${JSON.stringify(T0)};
      const c = Math.cos(L.rumbo), s = Math.sin(L.rumbo);
      const aMundo = (lx, lz) => ({ x: L.x + lx * c + lz * s, z: L.z - lx * s + lz * c });
      // lo de la toma anterior, afuera
      for (const a of (window.__escena || [])) { a.m.g.visible = false; a.m.g.position.set(0, -500, 0); }
      for (const a of D.aliens.slice()) { a.m.g.visible = false; }
      D.aliens.length = 0;
      window.__escena = [];
      H.veg?.despejar?.(aMundo(0, 7).x, aMundo(0, 7).z, 12);
      const poner = (tipo, lx, lz, giro, op) => {
        const w = aMundo(lx, lz);
        const a = D.invocar(tipo, w.x, w.z);
        if (!a) return null;
        const i = D.aliens.indexOf(a); if (i >= 0) D.aliens.splice(i, 1);
        a.m.vestir?.(!!op.viejo, op.etapa ?? (op.viejo ? 2 : 1));
        a.m.robar?.(!!op.robando);
        a.m.g.position.set(w.x, T.altura(w.x, w.z) + (op.alto || 0), w.z);
        a.m.g.rotation.set(0, L.rumbo + Math.PI + giro, 0);
        a.m.g.visible = true;
        a.op = op; a.faseV = op.fase || 0;
        window.__escena.push(a);
        return a;
      };
      for (const d of t.duendes) poner(d[0], d[1], d[2], d[3], d[4]);
      if (t.ataque) {
        const tipos = ['rastreador', 'rastreador', 'saltador', 'rastreador', 'tirador', 'escupidor', 'rastreador', 'bruto', 'saltador', 'excavador'];
        let k = 0;
        for (let fila = 0; fila < 6 && k < t.ataque; fila++) for (let col = 0; col < 5 && k < t.ataque; col++, k++) {
          const tipo = k === 22 || k === 27 ? 'volador' : tipos[k % tipos.length];
          poner(tipo, (col - 2) * (1.6 + fila * 0.5) + Math.sin(k * 7.3) * 0.6, 4 + fila * 3.6 + Math.cos(k * 3.1) * 0.8, Math.sin(k) * 0.3,
            { vel: 2 + (k % 3), carrera: k % 2, viejo: k % 4 === 3, alto: tipo === 'volador' ? 4 + (k % 3) : 0, vuela: tipo === 'volador' });
        }
      }
      if (t.nido) {
        const w = aMundo(0.3, 4.6), w2 = aMundo(-2.6, 7.5);
        H.progreso.desafio.capullos = [{ x: w.x, z: w.z, golpes: 0 }, { x: w2.x, z: w2.z, golpes: 0 }];
        D.sincronizarCapullos();
      }
      if (t.madriguera) {
        const d = H.progreso.desafio, w = aMundo(0, 13);
        d.puestos = d.puestos && Array.isArray(d.puestos.lista) ? d.puestos : { lista: [], proximoId: 1, golpes: [], rotos: 0 };
        d.puestos.lista = d.puestos.lista.filter((p) => p.id !== 999);
        d.puestos.lista.push({ id: 999, x: w.x, z: w.z, nivel: 3, nacio: 1, crecio: 1, guardias: 0, visto: true, roto: false, estructuras: [
          { tipo: 'aguja', dx: 0, dz: 0, vida: 150, max: 150 }, { tipo: 'vaina', dx: -4.2, dz: -2.4, vida: 80, max: 80 }, { tipo: 'generador', dx: 4.0, dz: -2.0, vida: 110, max: 110 }, { tipo: 'vaina', dx: 2.6, dz: 3.4, vida: 80, max: 80 }] });
        D.puestosMundo.sincronizar();
      }
      // la animación de la toma (la IA no los toca): cada cuadro, su pose
      if (!window.__animD) {
        window.__animD = true;
        let antes = performance.now();
        const paso = () => {
          const ahora = performance.now(), dt = Math.min(0.05, (ahora - antes) / 1000); antes = ahora;
          const cam = H.camara.position, noche = H.progreso.horas > 20 || H.progreso.horas < 6 ? 1 : 0;
          for (const a of window.__escena || []) {
            const op = a.op || {};
            if (op.vuela) { a.faseV += dt * 9; a.m.aletear?.(a.faseV); }
            if (op.risa && Math.random() < dt * 0.8) a.m.chillar();
            const g = a.m.g;
            const e = { dt, jugador: { x: cam.x, y: cam.y, z: cam.z }, velocidad: op.vel || 0, carrera: !!op.carrera, golpe: op.golpe || 0, ataca: !!op.ataca, apuntando: !!op.apuntando, agazapado: !!op.agazapado, enredado: false, saltando: op.vuela && !a.m.alasPropias ? 0.5 : 0, noche, reflejo: 0 };
            a.m.animar(e);
            a.m.detalle?.(Math.hypot(g.position.x - cam.x, g.position.z - cam.z));
          }
          requestAnimationFrame(paso);
        };
        requestAnimationFrame(paso);
      }
      const ojo = aMundo(t.ojo[0], t.ojo[2]), mira = aMundo(t.a[0], t.a[2]);
      return JSON.stringify({ o: { x: ojo.x, z: ojo.z, y: T.altura(ojo.x, ojo.z) + t.ojo[1] }, a: { x: mira.x, z: mira.z, y: T.altura(mira.x, mira.z) + t.a[1] }, hora: t.hora, fov: t.fov, n: window.__escena.length });
    })()`).catch((e) => { console.log('falló', nombre, String(e).slice(0, 300)); return null; });
    if (!r) continue;
    const toma = JSON.parse(r);
    const poner = `(() => { const H = window.__hojarasca, js = H.jugador.estado, t = ${JSON.stringify(toma)};
      H.progreso.horas = t.hora; H.clima.estado.nublado = 0.05; H.ajustes.estacion = 'verano';
      if (H.pasto?.malla) H.pasto.malla.visible = false;   // (el pasto alto tapa las patitas en las fotos)
      { const pm = H.perro && H.perro.malla; const pg = pm && (pm.isObject3D ? pm : pm.g); if (pg) pg.traverse((o) => o.layers.set(7)); }
      const o = t.o, a = t.a;
      const yaw = Math.atan2(-(a.x - o.x), -(a.z - o.z)), pitch = Math.atan2(a.y - o.y, Math.hypot(a.x - o.x, a.z - o.z));
      const piso = H.T.altura(o.x, o.z), alto = o.y - piso;
      js.agachado = alto < 1.35; js.alturaOjos = alto;
      js.pos.set(o.x, piso, o.z); js.vel.set(0, 0, 0); js.vy = 0; js.yaw = yaw; js.pitch = pitch;
      const c = H.camara; for (const k of c.children) k.visible = false;
      window.__poseD = { p: [o.x, o.y, o.z], r: [pitch, yaw], fov: t.fov, pie: [o.x, piso, o.z] };
      if (!H.renderer.__fijo) {
        const R = H.renderer, orig = R.render.bind(R); R.__fijo = true;
        R.render = (esc, cam) => {
          const q = window.__poseD;
          if (q && cam === H.camara) {
            cam.position.set(...q.p); cam.rotation.order = 'YXZ'; cam.rotation.set(q.r[0], q.r[1], 0);
            if (cam.fov !== q.fov) { cam.fov = q.fov; cam.updateProjectionMatrix(); }
            cam.updateMatrixWorld(); H.jugador.estado.pos.set(...q.pie); H.jugador.estado.vel.set(0, 0, 0); H.jugador.estado.vy = 0;
          }
          return orig(esc, cam);
        };
      }
      return 1 })()`;
    await js(poner); await esperar(2500);
    await js(poner); await esperar(2000);
    if (process.env.VISOR_PRE) { await js(`(() => { const H = window.__hojarasca, E = window.__escena; ${process.env.VISOR_PRE}; return 1; })()`).catch((e) => console.log("VISOR_PRE", String(e))); await esperar(800); }
    let img = null;
    for (let k = 0; k < 4 && !img; k++) { try { img = await w.webContents.capturePage(); } catch { await esperar(1200); } }
    if (img) fs.writeFileSync(path.join(salida, `v38-duendes-${nombre}.png`), img.toPNG());
    // lo que cuesta: dibujos y triángulos con y sin los duendes de la toma
    const info = await js(`(() => { const H = window.__hojarasca, R = H.renderer, E = window.__escena || []; R.info.autoReset = false;
      R.info.reset(); R.render(H.escena, H.camara); const con = { dibujos: R.info.render.calls, tri: R.info.render.triangles };
      for (const a of E) a.m.g.visible = false; R.info.reset(); R.render(H.escena, H.camara); const sin = { dibujos: R.info.render.calls, tri: R.info.render.triangles };
      for (const a of E) a.m.g.visible = true; R.info.autoReset = true;
      return JSON.stringify({ duendes: E.length, con, sin, porDuendes: { dibujos: con.dibujos - sin.dibujos, tri: con.tri - sin.tri } }) })()`);
    let linea = `${nombre}: ${info}`;
    if (process.env.VISOR_JS) linea += '\n  VISOR_JS: ' + await js(`(() => { const H = window.__hojarasca, E = window.__escena; return JSON.stringify(${process.env.VISOR_JS}); })()`).catch((e) => String(e));
    if (T0.medir) {
      // el dibujo solo, sincronizado con la placa (render + readPixels de un píxel), con y sin
      const gpu = (vis) => js(`(() => { const H = window.__hojarasca, R = H.renderer, gl = R.getContext(), px = new Uint8Array(4), E = window.__escena || [];
        for (const a of E) a.m.g.visible = ${vis};
        const t = []; for (let i = 0; i < 40; i++) { const t0 = performance.now(); R.render(H.escena, H.camara); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); t.push(performance.now() - t0); }
        for (const a of E) a.m.g.visible = true;
        t.sort((a, b) => a - b); return JSON.stringify({ mediana: +t[20].toFixed(2), p90: +t[36].toFixed(2) }); })()`);
      const anim = await js(`(() => { const H = window.__hojarasca, E = window.__escena || [], cam = H.camara.position; const e = { dt: 0.016, jugador: { x: cam.x, y: cam.y, z: cam.z }, velocidad: 3, carrera: true, noche: 1 };
        const t0 = performance.now(); for (let i = 0; i < 100; i++) for (const a of E) a.m.animar(e); return +((performance.now() - t0) / 100).toFixed(3); })()`);
      const gCon = await gpu(true), gSin = await gpu(false), gCon2 = await gpu(true);
      linea += `\n  dibujo sincronizado (ms, render + readPixels) con: ${gCon} / ${gCon2}; sin: ${gSin}\n  animar los ${toma.n} (ms por cuadro, CPU): ${anim}`;
      const est = await js(`JSON.stringify(window.__hojarasca.desafio.estadoDuendes?.() || null)`).catch(() => 'null');
      if (est !== 'null') linea += `\n  modelos: ${est}`;
    }
    informe.push(linea);
    console.log(linea);
  }
  if (errores.length) informe.push('ERRORES:\n' + errores.slice(0, 20).join('\n'));
  fs.writeFileSync(path.join(salida, 'informe.txt'), informe.join('\n') + '\n');
  console.log(errores.length ? `con ${errores.length} errores` : 'sin errores');
  app.exit(errores.length ? 1 : 0);
});

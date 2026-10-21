// 4.6 (auditoría del mapa): recorre el valle del Relax y junta datos y capturas de cada lugar, para decidir dónde van los
// recursos de zona, los puestos de ruta y la gente nueva (AUDITORIA_MAPA_VALOR.md). No toca el juego: sólo lee y fotografía.
//
// Dos fases (una corrida cada una, con perfil propio y oculta):
//   --fase=datos  → <salida>/datos.json: los lugares con sus coordenadas reales, qué hay alrededor de cada uno (bioma,
//                   rocas, árboles, pehuenes, piñones, cantos, gente) y una grilla de sitios candidatos para los puestos.
//   --fase=fotos --vistas=<archivo.json> → <salida>/<id>.jpg: cada vista es { id, x, z, mira: {x, z} | yaw, horas, alto }.
//   Opcional: --caminar=<archivo.json> con tramos { id, desde: {x,z}, hasta: {x,z} }: camina de verdad (teclas W, dt fijo)
//   y anota cuánto tardó y si llegó.
// Uso (desde la carpeta del proyecto, después de `node armar.mjs`):
//   set HUMO_OCULTO=1 & set HOJ_PERFIL=<carpeta temporal> & node_modules\electron\dist\electron.exe --no-sandbox
//     -r <ruta>\herramientas\al-monitor.cjs -r <ruta>\herramientas\perfil-propio.cjs herramientas\recorrido-mapa.cjs --fase=datos --salida=<carpeta>
// No es parte del gate.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const FASE = arg('fase', 'datos');
const salida = path.resolve(arg('salida', path.join(raiz, 'auditoria-mapa')));
const ANCHO = 1280, ALTO = 720;
const CALIDAD = arg('calidad', 'media');
const ESTACION = arg('estacion', 'otono');
fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// Lo que corre en la página para la fase de datos (H = window.__hojarasca)
const DATOS = `(() => {
  const H = window.__hojarasca, T = H.T, e = H.est;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v)), ss = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  // (la misma cuenta que perfilHabitatPatagonico de patagonia.js, que no está expuesta)
  const bioma = (x, z) => {
    const k = T.indice(x, z), h = T.altura(x, z);
    const bosque = cl(T.bosque[k], 0, 1), estepa = cl(T.estepa[k], 0, 1), pasto = cl(T.pasto[k], 0, 1);
    const dRio = T.distRio[k] - T.anchoRio[k], ribera = ss(18, 2, dRio), muyAlto = ss(72, 96, h);
    const mallin = cl(pasto * (1 - bosque * 0.55) * (0.45 + ribera * 0.55), 0, 1);
    const ecotono = cl((1 - Math.abs(bosque - 0.42) * 2.1) * (1 - estepa * 0.25) + estepa * 0.45, 0, 1);
    const bh = cl(bosque * (0.72 + ribera * 0.28) * (1 - estepa), 0, 1);
    let b = 'bosque_abierto';
    if (estepa > 0.55) b = 'estepa'; else if (muyAlto > 0.58 && bosque < 0.38) b = 'altoandino'; else if (mallin > 0.56) b = 'mallin';
    else if (ribera > 0.58 && bosque > 0.25) b = 'ribera'; else if (bh > 0.68) b = 'bosque_humedo'; else if (ecotono > 0.55 || estepa > 0.18) b = 'ecotono';
    return { b, h: +h.toFixed(1), pend: +T.pendiente[k].toFixed(2), sendero: +T.distSendero[k].toFixed(0), riel: +T.distRiel[k].toFixed(0), rio: +dRio.toFixed(0) };
  };
  const pt = (o) => (o && Number.isFinite(o.x) ? { x: +o.x.toFixed(1), z: +o.z.toFixed(1) } : null);
  const lugares = {};
  for (const [k, v] of Object.entries(T.lugares || {})) { const p = pt(v); if (p) lugares[k] = p; }
  if (T.puentes) T.puentes.forEach((p, i) => { lugares['puente-' + i] = pt(p); });
  const cab = (e.cabañas || []); cab.forEach((c, i) => { lugares['cabaña-' + i + (c.nombre ? '-' + c.nombre : '')] = pt(c); });
  for (const k of ['faro', 'molino', 'casaTe', 'torre', 'galpon', 'almacen', 'cueva']) { const p = pt(e[k]); if (p) lugares[k] = p; }
  for (const p of (H.tren.paradas || [])) lugares['parada: ' + p.nombre] = pt(p.anden || p);
  const A = H.__aldeaMundo && H.__aldeaMundo();
  const plaza = A ? pt(A.estadoEdificio('plaza').sitio) : null;
  if (plaza) lugares['aldea: plaza'] = plaza;
  // lo que hay en el mundo
  const arboles = H.veg.arboles || [], matas = H.veg.matas || [];
  const rocas = matas.filter((m) => m.tipo === 'roca');
  const items = (H.objetos.items || []);
  const gente = (H.gente.gente || []).map((g) => ({ clave: g.clave, nombre: g.nombre || g.clave, ...pt(g.pos) }));
  const cerca = (lista, x, z, r) => { let n = 0; for (const o of lista) { const dx = o.x - x, dz = o.z - z; if (dx * dx + dz * dz < r * r) n++; } return n; };
  const resumen = (x, z) => {
    const b = bioma(x, z);
    return { ...b, agua: !!T.agua(x, z), aPlaza: plaza ? Math.round(Math.hypot(x - plaza.x, z - plaza.z)) : null,
      aRefugio: Math.round(Math.hypot(x - T.lugares.refugio.x, z - T.lugares.refugio.z)),
      rocas60: cerca(rocas, x, z, 60), arboles30: cerca(arboles, x, z, 30), pehuenes80: cerca(arboles.filter((a) => a.especie === 'pehuen'), x, z, 80),
      pinones80: cerca(items.filter((i) => i.tipo === 'pinon'), x, z, 80), cantos60: cerca(items.filter((i) => i.tipo === 'canto'), x, z, 60),
      calafates60: cerca(items.filter((i) => i.tipo === 'calafate'), x, z, 60),
      gente80: gente.filter((g) => Math.hypot(g.x - x, g.z - z) < 80).map((g) => g.clave) };
  };
  const zonas = {};
  for (const [k, p] of Object.entries(lugares)) if (p) zonas[k] = { ...p, ...resumen(p.x, p.z) };
  // totales del mundo por bioma (rocas, pehuenes, piñones)
  const porBioma = {};
  const sumar = (b, campo) => { porBioma[b] = porBioma[b] || { celdas: 0, rocas: 0, pehuenes: 0, pinones: 0, arboles: 0 }; porBioma[b][campo]++; };
  for (const r of rocas) sumar(bioma(r.x, r.z).b, 'rocas');
  for (const a of arboles) { const b = bioma(a.x, a.z).b; sumar(b, 'arboles'); if (a.especie === 'pehuen') sumar(b, 'pehuenes'); }
  for (const i of items) if (i.tipo === 'pinon') sumar(bioma(i.x, i.z).b, 'pinones');
  // la grilla: cada 8 m, bioma, para el mapa de zonas; y los sitios candidatos para un puesto
  const marcas = [...Object.values(lugares).filter(Boolean)];
  if (A) for (const id of ['plaza', 'cantina', 'observatorio', 'refugio-andinista', 'varadero', 'escuela', 'banco-pueblo']) { const s = A.estadoEdificio(id)?.sitio; if (s) marcas.push(pt(s)); }
  const grilla = [], candidatos = [];
  for (let z = -456; z <= 456; z += 8) for (let x = -456; x <= 456; x += 8) {
    const b = bioma(x, z), agua = !!T.agua(x, z);
    grilla.push([x, z, agua ? 'agua' : b.b, b.h]);
    if (agua || b.h > 60 || b.pend > 0.35 || (x % 16) || (z % 16)) continue;
    const dMarca = Math.min(...marcas.map((m) => Math.hypot(m.x - x, m.z - z)));
    const aPlaza = plaza ? Math.hypot(x - plaza.x, z - plaza.z) : 999;
    if (dMarca < 70 || aPlaza < 200) continue;
    if (cerca(arboles, x, z, 9) > 0 || cerca(rocas, x, z, 5) > 0) continue;
    // que no tenga agua a los costados (orillas con escalón) y que el piso sea parejo en 6 m
    let desnivel = 0, mojado = false;
    for (const [dx, dz] of [[6, 0], [-6, 0], [0, 6], [0, -6]]) { desnivel = Math.max(desnivel, Math.abs(T.altura(x + dx, z + dz) - b.h)); if (T.agua(x + dx, z + dz)) mojado = true; }
    if (mojado || desnivel > 1.6) continue;
    candidatos.push({ x, z, bioma: b.b, h: b.h, pend: b.pend, sendero: b.sendero, riel: b.riel, rio: b.rio, aPlaza: Math.round(aPlaza), dMarca: Math.round(dMarca),
      desnivel: +desnivel.toFixed(1), arboles30: cerca(arboles, x, z, 30), rocas60: cerca(rocas, x, z, 60) });
  }
  return { calidad: H.ajustes.calidad, plaza, lugares, zonas, porBioma, totales: { rocas: rocas.length, arboles: arboles.length, items: items.length,
    porTipo: items.reduce((o, i) => (o[i.tipo] = (o[i.tipo] || 0) + 1, o), {}) }, gente, candidatos, grilla };
})()`;

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.setContentSize(ANCHO, ALTO);
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 240)); });
  w.webContents.on('render-process-gone', (_e, d) => errores.push('renderer caído ' + JSON.stringify(d)));
  const js = (c, lim = 240000) => Promise.race([w.webContents.executeJavaScript(c, true), esperar(lim).then(() => { throw new Error('la página no respondió'); })]);
  const url = path.join(raiz, 'index.html');
  const ajustes = { calidad: CALIDAD, clima: 'despejado', musica: false, modo: 'relax', relaxTipo: 'libre', autoCalidad: false, guiaPrimerDia: false, idioma: 'es', estacion: ESTACION, limiteFps: 'libre', modoFluido: false };
  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', ${JSON.stringify(JSON.stringify(ajustes))}); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador && !document.getElementById("inicio").classList.contains("oculto")', 5000).catch(() => false); }
    if (!listo) throw new Error('el juego no llegó a la portada');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(4000);
    // la aldea completa (los veinte pobladores con su local), como en una partida avanzada
    await js(`(async () => { const H = window.__hojarasca, A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return 0; const a = H.progreso.aldea;
      const L = { carpintero: 'carpinteria', veterinaria: 'veterinaria', panadera: 'panaderia', herbolaria: 'herboristeria', herrero: 'herreria', modista: 'costureria', pescador: 'pescaderia', botera: 'varadero', maestra: 'escuela', pintora: 'taller-arte', enfermera: 'puesto-sanitario', andinista: 'refugio-andinista', telegrafista: 'estafeta', fotografa: 'estudio-fotos', tejedora: 'hilanderia', ceramista: 'ceramica', apicultor: 'sala-miel', astronoma: 'observatorio', guardaparque: 'seccional', musico: 'salon' };
      const ks = Object.keys(L).filter((k) => A.estadoEdificio(L[k]));
      a.pobladores = ks.map((clave) => ({ clave, dia: 1 })); a.obras = {}; a.locales = Object.fromEntries(ks.map((k) => [L[k], 1])); a.descubierta = 1; a.llegando = null;
      H.progreso.dia = 6; H.progreso.horas = 11; return ks.length })()`);
    for (let i = 0; i < 30; i++) await js(`(()=>{ for (let i = 0; i < 20; i++) window.__hojarasca.__bucle(); return 1 })()`);
    if (FASE === 'datos') {
      const d = await js(DATOS);
      d.errores = errores;
      fs.writeFileSync(path.join(salida, 'datos.json'), JSON.stringify(d));
      console.log(`datos: ${Object.keys(d.lugares).length} lugares · ${d.candidatos.length} candidatos · rocas ${d.totales.rocas} · árboles ${d.totales.arboles}`);
    }
    if (FASE === 'fotos') {
      const vistas = JSON.parse(fs.readFileSync(path.resolve(arg('vistas', '')), 'utf8'));
      const solo = arg('solo', '') ? new Set(arg('solo', '').split(',')) : null;
      for (const v of vistas) {
        if (solo && !solo.has(v.id)) continue;
        const p = await js(`(()=>{ const H = window.__hojarasca, T = H.T, js = H.jugador.estado, v = ${JSON.stringify(v)};
          H.volverAlJuego && H.volverAlJuego();
          const y = T.altura(v.x, v.z) + 1.65 + (v.alto || 0);
          const yaw = v.mira ? Math.atan2(-(v.mira.x - v.x), -(v.mira.z - v.z)) : (v.yaw || 0);
          const pitch = v.pitch ?? (v.alto ? -Math.atan2(v.alto * 0.8, v.mira ? Math.hypot(v.mira.x - v.x, v.mira.z - v.z) : 60) : -0.04);
          H.jugador.ubicar(v.x, v.z, yaw);
          window.__vista = { x: v.x, z: v.z, y, yaw, pitch, horas: v.horas ?? 11.5 };
          return window.__vista })()`);
        // que se acomode: el LOD, los bloques del bosque, la gente que se monta de a uno (con la hora y el lugar fijos)
        for (let k = 0; k < 8; k++) {
          await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado, p = window.__vista;
            for (let i = 0; i < 25; i++) { H.progreso.horas = p.horas; js.pos.set(p.x, p.y, p.z); js.yaw = p.yaw; js.pitch = p.pitch; js.vel && js.vel.set && js.vel.set(0, 0, 0); H.__bucle(); }
            H.__visibilidad && H.__visibilidad(); return 1 })()`);
          await esperar(150);
        }
        await js(`document.getElementById('pista-clic')?.classList.add('oculto'); 1`).catch(() => 0);
        w.webContents.invalidate();
        await js(`Promise.race([new Promise((r)=>requestAnimationFrame(()=>r(1))), new Promise((r)=>setTimeout(()=>r(0),800))])`);
        // (la ventana oculta, o con la pantalla bloqueada, no siempre se deja capturar: UnknownVizError. Entonces el cuadro
        // se dibuja a mano y se lee del lienzo en la misma tarea, sin los carteles del HUD; ver pruebas/visor-aldea.cjs)
        let img, porLienzo = false;
        try { img = await w.webContents.capturePage({ x: 0, y: 0, width: ANCHO, height: ALTO }); if (img.isEmpty()) throw new Error('vacía'); } catch {
          const dato = await js(`(() => { const H = window.__hojarasca; H.__bucle(); return H.renderer.domElement.toDataURL('image/png'); })()`);
          img = require('electron').nativeImage.createFromDataURL(dato); porLienzo = true;
        }
        const chico = img.resize({ width: 1024, quality: 'best' });
        fs.writeFileSync(path.join(salida, `${v.id}.jpg`), chico.toJPEG(72));
        const aviso = await js(`(window.__hojarasca.__aviso && window.__hojarasca.__aviso()) || ''`).catch(() => '');
        console.log(`${v.id} · (${v.x}, ${v.z})${porLienzo ? ' · por el lienzo' : ''} · ${aviso.slice(0, 80)}`);
      }
      // caminatas reales: el jugador camina (o corre) hacia el destino con W, cuadro a cuadro; se anota el largo del camino hecho
      // (el tiempo de juego se estima con ese largo y la velocidad de config.js: el dt de un cuadro a mano no es el real) y si se traba
      const tramos = arg('caminar', '') ? JSON.parse(fs.readFileSync(path.resolve(arg('caminar', '')), 'utf8')) : [];
      const caminatas = [];
      for (const t of tramos) {
        const r = await js(`(async ()=>{ const H = window.__hojarasca, T = H.T, js = H.jugador.estado, t = ${JSON.stringify(t)};
          H.volverAlJuego && H.volverAlJuego(); H.jugador.ubicar(t.desde.x, t.desde.z, 0);
          const ev = (tipo, code) => document.dispatchEvent(new KeyboardEvent(tipo, { code, key: code, bubbles: true }));
          let largo = 0, cuadros = 0, trabado = 0, prev = { x: js.pos.x, z: js.pos.z }, ult = { x: js.pos.x, z: js.pos.z }; const corre = !!t.correr;
          if (corre) ev('keydown', 'ShiftLeft');
          ev('keydown', 'KeyW');
          for (let i = 0; i < (t.maxCuadros || 20000); i++) {
            const dx = t.hasta.x - js.pos.x, dz = t.hasta.z - js.pos.z, d = Math.hypot(dx, dz);
            if (d < (t.radio || 8)) break;
            js.yaw = Math.atan2(-dx, -dz); js.pitch = 0;
            if (H.__caidas.modo() !== 'jugando') H.volverAlJuego();
            H.__bucle(); cuadros++; largo += Math.hypot(js.pos.x - prev.x, js.pos.z - prev.z); prev = { x: js.pos.x, z: js.pos.z };
            if (i % 90 === 89) { const m = Math.hypot(js.pos.x - ult.x, js.pos.z - ult.z); if (m < 1) trabado++; ult = { x: js.pos.x, z: js.pos.z }; }
            if (i % 300 === 299) await new Promise((ok) => setTimeout(ok, 0));
          }
          ev('keyup', 'KeyW'); if (corre) ev('keyup', 'ShiftLeft');
          return { id: t.id, recto: Math.round(Math.hypot(t.hasta.x - t.desde.x, t.hasta.z - t.desde.z)), largo: Math.round(largo), cuadros, segEstimados: Math.round(largo / (corre ? 6.6 : 3.2)), llego: Math.hypot(t.hasta.x - js.pos.x, t.hasta.z - js.pos.z) < (t.radio || 8) + 2,
            fin: { x: +js.pos.x.toFixed(1), z: +js.pos.z.toFixed(1) }, trabado, nadando: !!js.nadando } })()`, 600000).catch((e) => ({ id: t.id, error: String(e.message || e) }));
        caminatas.push(r); console.log('caminata', JSON.stringify(r));
      }
      fs.writeFileSync(path.join(salida, 'fotos.json'), JSON.stringify({ errores, caminatas }, null, 1));
    }
  } catch (e) { console.error('error: ' + (e && e.message ? e.message : e)); errores.push(String(e && e.message)); }
  console.log(`errores de la página: ${errores.length}${errores.length ? ' · ' + errores.slice(0, 3).join(' | ') : ''}`);
  app.exit(0);
});

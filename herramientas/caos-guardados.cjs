// 3.5.4: partidas guardadas raras (Electron + WebGL, perfil propio). Arma una partida de
// verdad bien cargada (obras de todo tipo, caballo, huerta, ovejas, desafío avanzado…) y la
// rompe de muchas formas, con semilla:
//   · viejas: sin los campos que se sumaron en cada versión (lo que migra guardado.js);
//   · a medio escribir: el JSON cortado (con y sin copia de seguridad buena);
//   · campos con el tipo equivocado, null, NaN, negativos, enormes, listas por objetos…
//     (de a varios por caso, en el primer nivel y adentro);
//   · muy grandes (diario, obras, chinches, textos largos);
//   · coordenadas enormes (1e308, -1e20) en cada sección que guarda un lugar;
//   · por dentro: el Desafío, lo que guarda cada obra, cada sección que es un objeto.
// Cada caso: abrir, entrar, jugar unos cuadros con teclas, guardar y volver a abrir lo
// guardado. Mira fallas de sistemas (fallaSistema), errores, NaN, que vuelva a cargar y que no
// se cuelgue (si se cuelga, tira abajo la página de la prueba y sigue con el próximo caso).
//   npx electron --no-sandbox herramientas/caos-guardados.cjs
//   CAOS_SEMILLA, CAOS_CASOS=60 (rotas y por dentro), CAOS_SOLO=<texto del nombre>, CAOS_SALIDA, CAOS_INDEX
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const raiz = path.resolve(__dirname, '..');
const SEMILLA = Number(process.env.CAOS_SEMILLA || 3541) >>> 0;
const CASOS = Number(process.env.CAOS_CASOS || 60);
const SOLO = process.env.CAOS_SOLO || '';   // un texto: sólo los casos cuyo nombre lo contenga
const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'hojarasca-caos-guardados-'));
app.setPath('userData', perfil);
const SALIDA = process.env.CAOS_SALIDA || path.join(os.tmpdir(), 'hojarasca-caos-informes');
fs.mkdirSync(SALIDA, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
let s = SEMILLA || 1;
const azar = () => { s = (s ^ (s << 13)) >>> 0; s = (s ^ (s >>> 17)) >>> 0; s = (s ^ (s << 5)) >>> 0; return s / 4294967296; };
const uno = (l) => l[Math.floor(azar() * l.length)];

// Lo que se sumó al guardado en cada versión (para fabricar partidas "viejas")
const AGREGADOS = [
  // (3.6: la aldea reemplaza a `pueblo`, que una partida 3.1 todavía trae; 3.6.1: y la vecindad y lo de
  // las mecánicas, que una 3.5.4 tampoco tiene: ver `PUEBLO_31` en `casos`)
  ['3.6', ['aldea', 'vecindad', 'mecanicas']],
  ['3.5.1', ['taladosTotal', 'cosechasTotal']],
  ['3.1', ['carreras', 'diarios', 'historia', 'eventosValle', 'oficios', 'pueblo']],
  ['2.9', ['comercio', 'vela', 'meteo', 'radio']],
  ['2.8', ['personal']],
  ['2.4', ['corral', 'caballo', 'tormenta', 'correo', 'truchasHoy', 'semillasJuntadas', 'humedadLena', 'lomoUltimo']],
  ['2.1', ['grabaciones', 'majada', 'visitas', 'feria', 'gallineros', 'huerta', 'rastreos']],
  ['2.0', ['encargoBase', 'chinches', 'talados', 'acopio', 'pistas']],
  ['1.6', ['versionGuardado', 'guiaDia', 'pescaTarde', 'barra', 'ranura', 'renovales', 'diario', 'carpa', 'vueltas', 'explorado']],
];
const RAROS = [null, 'x', '', -1, 0, 1e308, -1e308, 3.7, true, false, [], {}, [null, 'x', -5, { a: 1 }], { x: 'a', z: null }, 'NaN', '1e999'];

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, width: 1024, height: 640,
    webPreferences: { backgroundThrottling: false, contextIsolation: false, preload: path.join(__dirname, 'caos-preload.cjs'), additionalArguments: [`--caos-semilla=${SEMILLA}`] } });
  w.webContents.session.on('will-download', (_e, item) => item.setSavePath(path.join(perfil, 'bajado-' + item.getFilename())));
  const url = path.join(raiz, process.env.CAOS_INDEX || 'index.html');   // CAOS_INDEX: otro armado (si index.html está tomado)
  const js = (c, limite = 60000) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en ${limite / 1000} s`)), limite))]);
  let cayo = null;
  w.webContents.on('render-process-gone', (_e, d) => { cayo = JSON.stringify(d); });
  // (una partida que cuelga el arranque nunca termina de cargar: no se espera más de 20 s)
  const abrir = () => Promise.race([w.loadFile(url, { search: '?debug=1' }).catch(() => esperar(1500).then(() => w.loadFile(url, { search: '?debug=1' })).catch(() => 0)), esperar(20000)]);
  const listo = async () => {
    for (const hasta = Date.now() + 60000; Date.now() < hasta;) {
      await esperar(500);
      const e = await js(`(()=>({ ok: !!(window.__hojarasca && window.__hojarasca.__caidas), carga: document.getElementById('carga-texto')?.textContent || '', oculto: document.getElementById('carga')?.classList.contains('oculto') }))()`, 5000).catch(() => null);
      if (e?.ok) return { ok: true };
      if (e && /No se pudo/.test(e.carga)) return { ok: false, motivo: e.carga };
    }
    return { ok: false, motivo: 'no llegó a la portada en 60 s' };
  };
  const AJ = (modo) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'${modo}', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'}));`;
  const resultados = [];

  // ------------------------------------------------ la partida de base, bien cargada
  const base = async (modo) => {
    await abrir();
    await js(`localStorage.clear(); ${AJ(modo)} 1`);
    await abrir();
    const l = await listo(); if (!l.ok) throw new Error('la base no cargó: ' + l.motivo);
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(1500);
    return js(`(async()=>{ const H = window.__hojarasca, P = H.progreso, r = H.T.lugares.refugio;
      H.ajustes.limiteFps = 'libre';
      P.dia = 23; P.horas = 17.5; P.ramitas = 13;
      Object.assign(P.materiales, { tronco: 50, tabla: 50, piedra: 50, lana: 9, cristal: 7 });
      Object.assign(P.cosas, { caballo: 1, manta: 1, farol: 1, botas: 1, harina: 3, yerba: 2 });
      // obras de muchos tipos, terminadas, alrededor del refugio
      const ids = ['cantero', 'tendal', 'colmena', 'ahumadero', 'vivero', 'lenera', 'gallinero', 'horno', 'buzon', 'alero', 'telar', 'molino-agua', 'aserradero', 'estacion-meteo', 'varadero', 'tirolesa-poste', 'corral', 'puesto', 'empalizada', 'muro-tronera', 'antorcha', 'zanja-fuego'];
      let k = 0;
      for (const id of ids) { const p = H.PLANOS.find((q) => q.id === id); if (!p) continue; k++;
        const x = r.x + 20 + (k % 6) * 9, z = r.z + 25 + Math.floor(k / 6) * 9;
        P.obras.push({ plano: id, x, z, rot: k * 0.4, etapas: p.etapas?.length || 1 }); }
      H.obras.sincronizar(P.obras); P.obras = H.obras.obras.map((o) => o.datos);
      // lo demás que guarda un lugar: la carpa, renovales, chinches, el caballo y el velero
      P.carpa = { x: r.x + 8, z: r.z - 6, yaw: 0.4 };
      P.renovales = [{ x: r.x - 14, z: r.z + 9, dia: 3, especie: 'coihue' }, { x: r.x - 22, z: r.z + 4, dia: 5, especie: 'lenga' }];
      P.chinches = [{ x: r.x + 40, z: r.z + 40, nombre: 'La laguna' }, { x: r.x - 60, z: r.z + 10, nombre: 'Mallín' }];
      P.caballo = { x: r.x + 5, z: r.z + 3, yaw: 1 };
      P.vela = { x: 150 + 60, z: 110, rumbo: 0.5 };
      for (let i = 0; i < 30; i++) { H.__bucle(); await new Promise((q) => setTimeout(q, 10)); }
      if (P.desafio) Object.assign(P.desafio, { oleadas: 7, noches: 6, abatidos: 55, cristales: 12, flechas: 20, tutorial: 99 });
      // una noche de verdad en el Desafío (invasores, puestos, lo que deja en la partida)
      if (P.desafio) { P.horas = 21; for (let i = 0; i < 600; i++) { P.desafio.salud = 100; H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 }); } P.horas = 17.5; }
      for (const t of ['KeyW', 'KeyE', 'KeyI', 'Escape']) { document.dispatchEvent(new KeyboardEvent('keydown', { code: t, bubbles: true })); H.__bucle(); document.dispatchEvent(new KeyboardEvent('keyup', { code: t, bubbles: true })); }
      H.volverAlJuego(); H.guardar();
      return localStorage.getItem(${modo === 'desafio' ? "'hojarasca-desafio-v1'" : "'hojarasca-v1'"}) })()`);
  };

  // ------------------------------------------------ un caso
  const jugar = `(async()=>{ const H = window.__hojarasca; H.ajustes.limiteFps = 'libre';
    const tecla = async (c, n = 2) => { document.dispatchEvent(new KeyboardEvent('keydown', { code: c, bubbles: true })); for (let i = 0; i < n; i++) { H.__bucle(); await new Promise(r => setTimeout(r, 12)); } document.dispatchEvent(new KeyboardEvent('keyup', { code: c, bubbles: true })); H.__bucle(); };
    for (let i = 0; i < 20; i++) { H.__bucle(); await new Promise(r => setTimeout(r, 12)); }
    for (const t of ['KeyW', 'KeyE', 'KeyI', 'KeyI', 'KeyO', 'Tab', 'KeyO', 'KeyM', 'KeyM', 'KeyJ', 'KeyJ', 'KeyF', 'KeyE', 'Escape']) await tecla(t, t === 'KeyW' ? 12 : 2);
    if (H.__caidas.modo() !== 'jugando') H.volverAlJuego();
    // de noche y en el Desafío, una noche corta
    H.progreso.horas = 21; for (let i = 0; i < 30; i++) { H.__bucle(); await new Promise(r => setTimeout(r, 10)); }
    if (H.desafio) for (let i = 0; i < 60; i++) H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
    H.abrir('pausa'); H.volverAlJuego(); H.abrir('cuaderno'); H.abrir('mapa'); H.volverAlJuego();
    for (let i = 0; i < 10; i++) { H.__bucle(); await new Promise(r => setTimeout(r, 10)); }
    const ok = H.guardar() !== false;
    const js = H.jugador.estado, p = js.pos, P = H.progreso;
    const nan = []; H.escena.traverse((o) => { if (nan.length < 3 && ![o.position.x, o.position.y, o.position.z, o.scale.x].every(Number.isFinite)) nan.push(o.name || o.type); });
    return { finito: [p.x, p.y, p.z, js.yaw, P.horas, P.dia].every(Number.isFinite), nan, dia: P.dia, ramitas: P.ramitas, obras: H.obras.obras.length,
      fallas: H.__caidas.fallas(), reg: window.__caos.registro.splice(0).filter((e) => e.tipo !== 'warn').map((e) => e.texto.slice(0, 700)), sueltos: (window.__hojarascaErrores || []).slice(0, 3),
      guardo: ok, modo: H.__caidas.modo() } })()`;
  const IGNORAR = /Electron Security Warning|GL_INVALID|Autofill|favicon|AudioContext/;
  const probar = async (modo, clave, nombre, principal, backup) => {
    if (SOLO && !nombre.includes(SOLO)) return;
    const r = { modo, nombre, problemas: [] };
    cayo = null;
    try {
      await abrir();
      await js(`localStorage.clear(); ${AJ(modo)} ${principal !== undefined ? `localStorage.setItem('${clave}', ${JSON.stringify(principal)});` : ''} ${backup !== undefined ? `localStorage.setItem('${clave}-backup', ${JSON.stringify(backup)});` : ''} 1`);
      await abrir();
      const l = await listo();
      if (!l.ok) {
        r.problemas.push('no arranca: ' + l.motivo);
        // colgada (un bucle que no termina): se tira abajo la página de la prueba para seguir con el próximo caso
        const responde = await js('1', 5000).then(() => true).catch(() => false);
        if (!responde) { r.problemas.push('la página quedó colgada (no responde)'); w.webContents.forcefullyCrashRenderer(); await esperar(1500); }
      }
      else {
        const pre = await js(`(()=>({ reg: window.__caos.registro.splice(0).filter((e) => e.tipo !== 'warn').map((e) => e.texto.slice(0, 700)), dia: window.__hojarasca.progreso.dia }))()`);
        for (const e of pre.reg) if (!IGNORAR.test(e)) r.problemas.push('al cargar: ' + e);
        await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(1200);
        const j = await js(jugar, 90000);
        r.dia = j.dia; r.obras = j.obras; r.diaCargado = pre.dia;
        if (!j.finito) r.problemas.push('jugador u hora no finitos');
        if (j.nan.length) r.problemas.push('objetos en NaN: ' + j.nan.join(', '));
        for (const f of j.fallas) r.problemas.push(`falla de sistema ${f.nombre}: ${f.mensaje} (${f.veces}×)`);
        for (const e of j.reg) if (!IGNORAR.test(e) && !/falló ".*" en el bucle/.test(e)) r.problemas.push('error: ' + e);
        for (const e of j.sueltos) r.problemas.push('excepción suelta: ' + String(e).slice(0, 500));
        if (!j.guardo) r.problemas.push('no pudo guardar');
        // lo guardado vuelve a abrir
        await abrir();
        const l2 = await listo();
        if (!l2.ok) r.problemas.push('lo guardado no vuelve a abrir: ' + l2.motivo);
        else {
          const v = await js(`(()=>({ reg: window.__caos.registro.splice(0).filter((e) => e.tipo !== 'warn').map((e) => e.texto.slice(0, 500)), dia: window.__hojarasca.progreso.dia }))()`);
          for (const e of v.reg) if (!IGNORAR.test(e)) r.problemas.push('al reabrir: ' + e);
          if (v.dia !== j.dia) r.problemas.push(`al reabrir cambió el día (${j.dia} → ${v.dia})`);
        }
      }
    } catch (e) { r.problemas.push('excepción: ' + e.message); }
    if (cayo && !r.problemas.some((x) => /colgada/.test(x))) r.problemas.push('se cayó la página: ' + cayo);
    resultados.push(r);
    console.log(`${r.problemas.length ? '✗' : '✓'} ${modo}: ${nombre}${r.problemas.length ? '\n    ' + r.problemas.slice(0, 4).map((x) => x.slice(0, 400)).join('\n    ') : ` (día ${r.dia}, ${r.obras} obras)`}`);
  };

  // ------------------------------------------------ las mutaciones
  const copia = (o) => JSON.parse(JSON.stringify(o));
  // un valor raro en un lugar al azar de `obj` (hasta `prof` niveles adentro)
  const romperAdentro = (obj, prof) => {
    let o = obj, camino = [];
    for (let d = 0; d < prof; d++) {
      const ks = o && typeof o === 'object' ? Object.keys(o) : [];
      if (!ks.length) break;
      const k = uno(ks);
      if (d === prof - 1 || !o[k] || typeof o[k] !== 'object' || !Object.keys(o[k]).length || azar() < 0.3) { const v = uno(RAROS); o[k] = copia(v ?? null); camino.push(k); return `${camino.join('.')} = ${JSON.stringify(v)}`; }
      camino.push(k); o = o[k];
    }
    return null;
  };
  const casos = (modo, texto) => {
    const p0 = JSON.parse(texto), lista = [];
    // viejas: sin lo que se sumó desde cada versión
    const quitar = [];
    for (const [ver, campos] of AGREGADOS) {
      quitar.push(...campos);
      const p = copia(p0); for (const c of quitar) delete p[c];
      if (ver === '2.0' || ver === '1.6') { p.obras = (p.obras || []).map((o) => (o.plano === 'cantero' ? { ...o, plano: 'huerta', huerta: { cultivo: 'haba', dia: 2 } } : o)); }
      lista.push([`vieja (antes de la ${ver})`, JSON.stringify(p)]);
      // 3.6.1: una partida de la 3.1 a la 3.5.4 de verdad trae el pueblo que fundabas (con pobladores
      // en tus casas, uno esperando en la estación y el filo del herrero): pasa a la aldea
      if (ver === '3.6' && modo === 'relax') {
        const q = copia(p); const casa = (q.obras || []).find((o) => o.plano === 'puesto') || { x: 10, z: 10 };
        q.pueblo = { nombre: 'Villa Ñire', cartel: { x: casa.x + 6, z: casa.z, rot: 0.3 }, pobladores: [{ clave: 'carpintero', dia: 4, casa: { id: `puesto:${Math.round(casa.x)}:${Math.round(casa.z)}`, x: casa.x, z: casa.z, rot: 0 } }, { clave: 'herrero', dia: 9 }, { clave: 'nadie', dia: 2 }],
          llegando: { clave: 'panadera', dia: q.dia || 3 }, ultimaLlegada: 9, llamado: true, usos: { carpintero: q.dia || 3 }, afilado: 3, mandado: null, mandados: 1 };
        lista.push(['vieja: de la 3.1 a la 3.5.4, con su pueblo', JSON.stringify(q)]);
      }
    }
    // a medio escribir: cortada, con la copia buena y sin ella
    for (const f of [0.1, 0.5, 0.97]) {
      const corte = texto.slice(0, Math.floor(texto.length * f));
      lista.push([`a medio escribir (${Math.round(f * 100)}%) con copia buena`, corte, texto]);
      lista.push([`a medio escribir (${Math.round(f * 100)}%) sin copia`, corte, undefined]);
    }
    lista.push(['principal vacía y copia buena', '', texto]);
    lista.push(['principal "null" y copia rota', 'null', texto.slice(0, 50)]);
    // muy grandes
    { const p = copia(p0); p.diario = Array.from({ length: 6000 }, (_, i) => ({ dia: i % 40 + 1, tipo: 'nota', texto: 'x'.repeat(40) })); lista.push(['muy grande: diario de 6000 páginas', JSON.stringify(p)]); }
    { const p = copia(p0); const o = p.obras.find((x) => x.plano === 'empalizada' || x.plano === 'puesto') || p.obras[0]; for (let i = 0; i < 900; i++) p.obras.push({ ...o, x: o.x + (i % 30) * 3, z: o.z + Math.floor(i / 30) * 3 + 60 }); lista.push(['muy grande: 900 obras más', JSON.stringify(p)]); }
    { const p = copia(p0); p.chinches = Array.from({ length: 3000 }, (_, i) => ({ x: i % 400 - 200, z: Math.floor(i / 400) * 30, nombre: 'ñ'.repeat(200) })); p.tomados = Array.from({ length: 20000 }, (_, i) => i); lista.push(['muy grande: 3000 chinches y 20000 tomados', JSON.stringify(p)]); }
    { const p = copia(p0); p.nombreLargo = 'a'.repeat(1_200_000); lista.push(['muy grande: un campo de 1,2 MB', JSON.stringify(p)]); }
    // de a varios campos rotos
    for (let i = 0; i < CASOS; i++) {
      const p = copia(p0), cambios = [];
      const n = 1 + Math.floor(azar() * 4);
      for (let k = 0; k < n; k++) {
        if (azar() < 0.45) { const c = uno(Object.keys(p)); const v = uno(RAROS); p[c] = copia(v ?? null); cambios.push(`${c} = ${JSON.stringify(v)}`); }
        else { const c = romperAdentro(p, 2 + Math.floor(azar() * 3)); if (c) cambios.push(c); }
      }
      lista.push([`rota #${i}: ${cambios.join(' · ')}`.slice(0, 300), JSON.stringify(p)]);
    }
    // coordenadas enormes (1e308, 1e20): cada sección con sus x/z/y llevadas lejísimos. Los
    // recorridos por celdas no avanzan con números así (1e308 + 1 === 1e308): se cuelga.
    {
      const caminos = {};
      const juntar = (o, camino, raizK) => {
        if (!o || typeof o !== 'object') return;
        for (const [k, v] of Object.entries(o)) {
          if (typeof v === 'number' && /^(x|z|y|px|pz|cx|cz|x0|z0|x1|z1)$/.test(k)) (caminos[raizK] = caminos[raizK] || []).push([...camino, k]);
          else if (v && typeof v === 'object') juntar(v, [...camino, k], raizK);
        }
      };
      for (const k of Object.keys(p0)) if (p0[k] && typeof p0[k] === 'object') juntar(p0[k], [k], k);
      for (const [sec, lista2] of Object.entries(caminos)) {
        for (const enorme of [1e308, -1e20]) {
          const p = copia(p0);
          for (const c of lista2) { let o = p; for (const k of c.slice(0, -1)) o = o[k]; o[c[c.length - 1]] = enorme; }
          lista.push([`coordenadas enormes (${enorme}) en ${sec} (${lista2.length})`, JSON.stringify(p)]);
        }
      }
    }
    // por dentro: el Desafío, una obra con lo que guarda (colmena, tendal, leñera…) o cualquier
    // sección que sea un objeto (personal, historia, oficios, pueblo, comercio, caballo…)
    const secciones = Object.keys(p0).filter((k) => p0[k] && typeof p0[k] === 'object' && !Array.isArray(p0[k]) && Object.keys(p0[k]).length);
    for (let i = 0; i < CASOS; i++) {
      const p = copia(p0), cambios = [];
      const q = azar();
      for (let k = 0, n = 1 + Math.floor(azar() * 3); k < n; k++) {
        if (q < 0.35 && p.desafio && typeof p.desafio === 'object') { const c = romperAdentro(p.desafio, 1 + Math.floor(azar() * 3)); if (c) cambios.push('desafio.' + c); }
        else if (q < 0.65 && p.obras?.length) { const i2 = Math.floor(azar() * p.obras.length), c = romperAdentro(p.obras[i2], 1 + Math.floor(azar() * 2)); if (c) cambios.push(`obras[${i2}:${p0.obras[i2]?.plano}].${c}`); }
        else { const sec = uno(secciones), c = romperAdentro(p[sec], 1 + Math.floor(azar() * 3)); if (c) cambios.push(`${sec}.${c}`); }
      }
      lista.push([`por dentro #${i}: ${cambios.join(' · ')}`.slice(0, 300), JSON.stringify(p)]);
    }
    return lista;
  };

  const t0 = Date.now();
  try {
    for (const [modo, clave] of [['relax', 'hojarasca-v1'], ['desafio', 'hojarasca-desafio-v1']]) {
      const texto = await base(modo);
      if (!texto) throw new Error('no hubo partida base de ' + modo);
      fs.writeFileSync(path.join(SALIDA, `guardado-base-${modo}.json`), texto);
      for (const [nombre, principal, backup] of casos(modo, texto)) await probar(modo, clave, nombre, principal, backup);
    }
  } catch (e) { resultados.push({ modo: '-', nombre: 'excepción', problemas: [e.stack || e.message] }); console.log('excepción', e.stack || e.message); }
  const malos = resultados.filter((r) => r.problemas.length);
  fs.writeFileSync(path.join(SALIDA, `guardados-${SEMILLA}.json`), JSON.stringify({ semilla: SEMILLA, minutos: +((Date.now() - t0) / 60000).toFixed(1), casos: resultados.length, malos: malos.length, resultados }, null, 2));
  console.log(`\n${malos.length ? `✗ ${malos.length} de ${resultados.length} casos con problemas` : `✓ ${resultados.length} casos sin problemas`} · ${((Date.now() - t0) / 60000).toFixed(1)} min`);
  try { fs.rmSync(perfil, { recursive: true, force: true }); } catch { /* después */ }
  app.exit(malos.length ? 1 : 0);
});

// 3.8.7: soak LARGO de La noche de los duendes. Juega muchas noches seguidas con el bucle de verdad
// (__bucle cuadro a cuadro, el reloj del juego acelerado con `ajustes.duracion`), peleando: el jugador se
// mueve entre el fortín y el bosque, tira con todo el arsenal y voltea duendes; la vida se le repone para que
// la noche no termine en una caída. Después de la campaña, el asedio (la noche 20 y unas noches de asedio) y
// una corrida sin fin (otra partida, recargando la página). Al amanecer de cada noche, tras un GC, mide:
//   - three: geometrías, texturas y programas (renderer.info), objetos de la escena;
//   - geometrías y texturas «huérfanas»: subidas a la placa, sin dispose y fuera de la escena, agrupadas por
//     tipo, tamaño y DÓNDE se crearon (la pila del primer setAttribute / del constructor), y las nuevas de esa
//     noche contra la anterior: así se ve qué se fuga y de qué archivo viene;
//   - JS: heap, oyentes (CDP y addEventListener por tipo), nodos del DOM;
//   - audio: nodos vivos por tipo (FinalizationRegistry), AudioBuffers vivos, el caché `previo` del motor
//     (las risas y el piano de la 3.8.5), la cola, `risasSonando`;
//   - el Desafío: invasores en la lista y en los pozos, proyectiles, tirados, efectos.
// Una línea por noche en <SALIDA>/muestras.jsonl y al final <SALIDA>/resumen.txt con la pendiente por noche.
// Perfil propio en <SALIDA>/perfil (nunca el del jugador).
// Uso (Git Bash o PowerShell, desde la carpeta del juego, después de `node armar.mjs`):
//   SALIDA=<carpeta> NOCHES=16 SINFIN=6 node_modules/electron/dist/electron.exe --no-sandbox herramientas/soak-duendes.cjs
// Opciones: PROY=. CALIDAD=media DURACION=6 (minutos por día del juego) ASEDIO=1 (0: sin asedio)
//   EXTRA=0 (sin duendes de más)  DIFICULTAD=normal  CODIGO=<código de partida>  VENTANA=1 (ventana visible)
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const PROY = path.resolve(process.env.PROY || '.');
const SALIDA = path.resolve(process.env.SALIDA || './soak-duendes-salida');
const NOCHES = Number(process.env.NOCHES || 16);
const SINFIN = Number(process.env.SINFIN ?? 6);
const ASEDIO = process.env.ASEDIO !== '0';
const DURACION = Number(process.env.DURACION || 6);
const CALIDAD = process.env.CALIDAD || 'media';
const DIFICULTAD = process.env.DIFICULTAD || 'normal';
fs.mkdirSync(SALIDA, { recursive: true });
app.setPath('userData', path.join(SALIDA, 'perfil'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('enable-precise-memory-info');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('js-flags', '--expose-gc');
const _log = console.log; console.log = (...a) => { _log(...a); try { fs.appendFileSync(path.join(SALIDA, 'log.txt'), a.join(' ') + '\n'); } catch {} };
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// Antes que el juego: nodos de audio, AudioBuffers y lienzos vivos (FinalizationRegistry) y addEventListener
// por tipo. Y el diagnóstico de three: el EventDispatcher se parchea apenas aparece (ver DIAG).
const INSTRUMENTO = `(() => {
  const V = { audio: 0, audioTot: 0, buffers: 0, buffersTot: 0, buffersMB: 0, canvas: 0, canvasTot: 0, lis: {}, porTipo: {} };
  const fr = new FinalizationRegistry((k) => { V[k]--; });
  const frT = new FinalizationRegistry((t) => { V.porTipo[t]--; });
  const frB = new FinalizationRegistry((mb) => { V.buffers--; V.buffersMB -= mb; });
  const reg = (o, k, t) => { if (!o) return o; V[k]++; V[k + 'Tot']++; fr.register(o, k); if (t) { V.porTipo[t] = (V.porTipo[t] || 0) + 1; frT.register(o, t); } return o; };
  const regB = (b) => { if (!b) return b; const mb = b.length * b.numberOfChannels * 4 / 1048576; V.buffers++; V.buffersTot++; V.buffersMB += mb; frB.register(b, mb); return b; };
  const BAC = window.BaseAudioContext && BaseAudioContext.prototype;
  if (BAC) for (const n of Object.getOwnPropertyNames(BAC)) {
    if (!/^create/.test(n) || n === 'createPeriodicWave') continue;
    const d = Object.getOwnPropertyDescriptor(BAC, n); if (!d || typeof d.value !== 'function') continue;
    const o = d.value;
    BAC[n] = n === 'createBuffer' ? function (...a) { return regB(o.apply(this, a)); } : function (...a) { return reg(o.apply(this, a), 'audio', n.slice(6)); };
  }
  if (window.AudioBuffer) { const AB = window.AudioBuffer; window.AudioBuffer = function (o) { return regB(new AB(o)); }; window.AudioBuffer.prototype = AB.prototype; }
  if (BAC && BAC.decodeAudioData) { const dad = BAC.decodeAudioData; BAC.decodeAudioData = function (...a) { return dad.apply(this, a).then(regB); }; }
  const ce = Document.prototype.createElement;
  Document.prototype.createElement = function (t, ...r) { const e = ce.call(this, t, ...r); if (String(t).toLowerCase() === 'canvas') reg(e, 'canvas', 'lienzo'); return e; };
  const ael = EventTarget.prototype.addEventListener, rel = EventTarget.prototype.removeEventListener;
  const clave = (t, ty) => (t === window ? 'window' : t === document ? 'document' : (t && t.constructor && t.constructor.name) || '?') + ':' + ty;
  EventTarget.prototype.addEventListener = function (ty, f, o) { const k = clave(this, ty); V.lis[k] = (V.lis[k] || 0) + 1; return ael.call(this, ty, f, o); };
  EventTarget.prototype.removeEventListener = function (ty, f, o) { const k = clave(this, ty); V.lis[k] = (V.lis[k] || 0) - 1; return rel.call(this, ty, f, o); };
  window.__vivos = V;
})();`;

// three le pone a cada geometría y textura un oyente de 'dispose' la primera vez que la sube a la placa: con
// eso se sabe cuáles están subidas. La pila de dónde se creó: el primer setAttribute de la geometría (lo
// hacen todos los constructores) y, para las texturas, el primer `needsUpdate`/subida.
const DIAG = `(()=>{ const H=window.__hojarasca; if (!H || !H.THREE) return 0;
  const BG = new H.THREE.Mesh().geometry.constructor; const ED = Object.getPrototypeOf(BG.prototype); if (ED.__soak) return 0; ED.__soak = 1;
  const subidas = new Set(); window.__subidas = subidas; window.__rastro = new WeakMap();
  const pila = () => { const s = (new Error().stack || '').split('\\n').slice(2).map((l) => l.trim().replace(/^at /, ''))
    .filter((l) => !/soak|<anonymous>|three-r186/.test(l)); const util = s.filter((l) => !/(BufferGeometry|Geometry|setAttribute|Texture|(^|\\s)[a-zA-Z$]{1,3} \\()/.test(l));
    return (util.length ? util : s).slice(0, 3).map((l) => l.replace(/\\(?file:.*index\\.html/, '(').replace(/\\)$/, '')).join(' < '); };
  const ael = ED.addEventListener, dsp = ED.dispatchEvent;
  ED.addEventListener = function (t, f) { if (t === 'dispose' && (this.isBufferGeometry || this.isTexture) && !subidas.has(this)) { subidas.add(this); if (!this.__pila) this.__pila = pila(); this.__noche = window.__nocheSoak || 0; } return ael.call(this, t, f); };
  ED.dispatchEvent = function (e) { if (e && e.type === 'dispose') subidas.delete(this); return dsp.call(this, e); };
  const sa = BG.prototype.setAttribute; BG.prototype.setAttribute = function (n, a) { if (!this.__pila) this.__pila = pila(); return sa.call(this, n, a); };
  return 1 })()`;
// El censo de la escena: por cada hijo directo de la escena (su nombre o tipo, y el de su primer hijo), cuántos
// objetos cuelgan y cuántas geometrías distintas usan. Entre una noche y la otra se listan los grupos que crecieron.
const CENSO = `(()=>{ const H=window.__hojarasca, c = {};
  for (const h of H.escena.children) { const k = (h.name || h.type) + (h.children[0] ? '/' + (h.children[0].name || h.children[0].type) : '') + (h.geometry ? ' ' + h.geometry.type + ' ' + (h.geometry.attributes.position ? h.geometry.attributes.position.count : 0) + 'v' : '');
    const e = c[k] || (c[k] = { n: 0, obj: 0, geo: new Set(), det: {} }); e.n++;
    h.traverse((o) => { e.obj++; if (o.geometry) e.geo.add(o.geometry); if (o !== h) { const l = (o.name || o.type) + (o.geometry ? ':' + o.geometry.type : '') + (o.parent && o.parent !== h ? ' en ' + (o.parent.name || o.parent.type) : ''); e.det[l] = (e.det[l] || 0) + 1; } }); }
  const r = {}; for (const [k, e] of Object.entries(c)) r[k] = [e.n, e.obj, e.geo.size, e.det]; return r })()`;
const HUERFANAS = `(()=>{ const H=window.__hojarasca, S=window.__subidas; if (!S) return null; const en = new Set(), donde = window.__rastro;
  const nombre = (o) => o.name || o.type;
  H.escena.traverse((o) => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    if (o.geometry) { en.add(o.geometry); if (!donde.has(o.geometry)) { let p = o, r = []; while (p && r.length < 4) { r.push(nombre(p)); p = p.parent; } donde.set(o.geometry, r.join('<')); } }
    for (const m of ms) for (const k in m) { const v = m[k]; if (v && v.isTexture) en.add(v); if (k === 'uniforms') for (const u in v) { const x = v[u] && v[u].value; if (x && x.isTexture) en.add(x); } } });
  if (H.escena.background && H.escena.background.isTexture) en.add(H.escena.background);
  const g = {}, t = {}; let ng = 0, nt = 0, nuevasG = 0;
  for (const o of S) { if (en.has(o)) continue;
    if (o.isBufferGeometry) { ng++; if (o.__noche === window.__nocheSoak) nuevasG++; const k = o.type + ' ' + (o.attributes.position ? o.attributes.position.count : 0) + 'v · ' + (o.__pila || '?') + (donde.has(o) ? ' · estuvo en ' + donde.get(o) : ''); g[k] = (g[k] || 0) + 1; }
    else { nt++; const k = (o.constructor && o.constructor.name) + ' ' + (o.image ? (o.image.width || 0) + 'x' + (o.image.height || 0) : '') + ' · ' + (o.__pila || '?'); t[k] = (t[k] || 0) + 1; } }
  const top = (x) => Object.entries(x).sort((a, b) => b[1] - a[1]).slice(0, 14);
  return { subidas: S.size, geo: ng, tex: nt, nuevasG, topG: top(g), topT: top(t) } })()`;

app.whenReady().then(async () => {
  const pre = path.join(SALIDA, 'instrumento-preload.js');
  fs.writeFileSync(pre, `const { webFrame } = require('electron'); webFrame.executeJavaScript(${JSON.stringify(INSTRUMENTO)});`);
  const VENTANA = !!process.env.VENTANA;
  const w = new BrowserWindow({ show: VENTANA, width: 1280, height: 720, webPreferences: { backgroundThrottling: false, preload: pre, sandbox: false, contextIsolation: true } });
  const errores = [];
  let donde = 'carga';
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|favicon/.test(m)) { errores.push(`[${donde}] ${m.slice(0, 400)}`); console.log('  consola: ' + m.slice(0, 300)); }
  });
  let caido = false;
  w.webContents.on('render-process-gone', (_e, d) => { caido = true; console.log('!!! renderer caído', JSON.stringify(d)); errores.push('renderer caído ' + JSON.stringify(d)); });
  const dbg = w.webContents.debugger;
  dbg.attach('1.3');
  const js = (c, lim = 240000) => Promise.race([w.webContents.executeJavaScript(c, true),
    new Promise((_, no) => setTimeout(() => no(new Error('sin respuesta en ' + donde)), lim))]);
  const H = 'window.__hojarasca';
  const url = path.join(PROY, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const ajustes = (sinfin) => JSON.stringify({ calidad: CALIDAD, clima: 'variable', musica: true, modo: 'desafio', desafioTipo: sinfin ? 'sinfin' : 'campana', dificultad: DIFICULTAD, autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre' });
  const entrar = async () => {
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!document.getElementById("btn-entrar")', 5000).catch(() => false)) break; }
    await js(DIAG);
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
    await js(`(async()=>{ const H=${H}; H.ajustes.limiteFps='libre'; H.ajustes.duracion=${DURACION}; const s = H.sonido; try { if (!s.ctx) s.iniciar?.(); await s.ctx?.resume?.(); } catch {} return 1 })()`);
  };
  const partidaNueva = async (sinfin) => {
    await abrir();
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', ${JSON.stringify(ajustes(sinfin))}); 1`);
    if (process.env.CODIGO) await js(`(()=>{ const P = JSON.parse(localStorage.getItem('hojarasca-ajustes-v1')); return 1 })()`);
    await abrir(); await entrar();
    if (process.env.CODIGO) await js(`(()=>{ const H=${H}; H.progreso.desafio.semilla=${JSON.stringify(process.env.CODIGO)}; H.__sinFin.empezarMapa(); return 1 })()`);
  };
  const gc = async () => { for (let i = 0; i < 3; i++) { await dbg.sendCommand('HeapProfiler.collectGarbage'); await esperar(150); } };

  // ------------------------------------------------------------ jugar: N cuadros del bucle de verdad, peleando
  // (cada `paso` cuadros: la vida al tope, y a veces el jugador se mueve, mira al duende más cercano y tira con
  // un arma del arsenal; algunos duendes caen de un golpe para que haya muertes, semillas y efectos)
  const ARMAS = ['arco', 'ballesta', 'facon', 'maza', 'arpon', 'hachuela', 'jabalina', 'granada', 'humo', 'bengala', 'cuerno', 'boleadoras', 'lanza', 'honda', 'hacha', 'pistola'];
  const armar = () => js(`(()=>{ const P=${H}.progreso; P.cosas = P.cosas || {}; for (const k of ${JSON.stringify(ARMAS)}.concat(['ballestaRepeticion','rodela','chaleco','placasCristal','carcaj'])) P.cosas[k]=1;
    Object.assign(P.desafio, { flechas: 60, flechasFuego: 30, flechasCristal: 30, virotes: 40, hachuelas: 12, jabalinas: 12, granadas: 12, humos: 8, bengalas: 8, boleadoras: 12, cargas: 99 }); P.desafio.salud = 100; return 1 })()`);
  let semilla = 7;
  const jugar = (cuadros) => js(`(async ()=>{ const H=${H}, D=H.desafio, J=H.jugador, P=H.progreso; let s=${semilla};
    const az = () => { s = (s * 1103515245 + 12345) >>> 0; return s / 4294967296; };
    const armas = ${JSON.stringify(ARMAS)}, TIPOS = ['rastreador','tirador','saltador','escupidor','excavador','volador','bruto'], EXTRA = ${process.env.EXTRA !== '0'};
    for (let i = 0; i < ${cuadros}; i++) {
      if (P.desafio) P.desafio.salud = Math.max(P.desafio.salud || 0, 60);
      if (i % 30 === 0 && !D.caido) {
        const vivos = D.aliens.filter((a) => a.estado !== 'morir' && a.estado !== 'irse' && a.estado !== 'bajoTierra');
        const js = J.estado; let cerca = null, dc = 1e9;
        for (const a of vivos) { const d = Math.hypot(a.m.g.position.x - js.pos.x, a.m.g.position.z - js.pos.z); if (d < dc) { dc = d; cerca = a; } }
        if (cerca && dc < 40) { js.yaw = Math.atan2(-(cerca.m.g.position.x - js.pos.x), -(cerca.m.g.position.z - js.pos.z)); try { D.atacar(armas[Math.floor(az() * armas.length)]); } catch (e) {} }
        if (cerca && az() < 0.5) try { D.herirDuende(cerca, 999, 'jugador'); } catch (e) {}
        // más duendes de todos los tipos, de noche, cerca del fortín (que haya muertes, semillas y efectos de sobra)
        if (EXTRA && (P.horas > 20.5 || P.horas < 5) && i % 120 === 0 && vivos.length < 14) { const c = H.T.lugares.refugio, t = TIPOS[Math.floor(az() * TIPOS.length)], a = az() * 6.283; try { D.invocar(t, c.x + Math.cos(a) * 45, c.z + Math.sin(a) * 45); } catch (e) {} }
        if (az() < 0.08) { const c = H.T.lugares.refugio; const a = az() * 6.283, r = 6 + az() * 70; try { if (!js.enTren && !js.montado) J.ubicar(c.x + Math.cos(a) * r, c.z + Math.sin(a) * r, a); } catch (e) {} }
      }
      H.__bucle();
      if (i % 6 === 5) await new Promise((r) => setTimeout(r, 0));
    }
    return { horas: +P.horas.toFixed(2), dia: P.dia } })()`, 600000).then((r) => { semilla = (semilla * 31 + 17) >>> 0; return r; });
  // hasta la hora `h` (del día siguiente si ya pasó), jugando
  const hastaHora = async (h, tope = 40000) => {
    let r = null;
    for (let k = 0; k < tope / 400 && !caido; k++) {
      r = await jugar(400);
      const st = await js(`(()=>{ const H=${H}; return { h: H.progreso.horas, d: H.progreso.dia, victoria: !document.getElementById('victoria')?.classList.contains('oculto') } })()`);
      if (st.victoria) { console.log('  pantalla de victoria: Seguir'); await js(`(()=>{ document.getElementById('victoria-seguir')?.click(); return 1 })()`); }
      if (st.h >= h && st.h < h + 3) return r;
    }
    return r;
  };
  // el día, rápido: de las 7 a las 18 de un salto (la tarde y la noche corren de verdad)
  const saltarDia = () => js(`(()=>{ const H=${H}; if (H.progreso.horas > 6.5 && H.progreso.horas < 17.5) H.progreso.horas = 17.5; return 1 })()`);

  // ------------------------------------------------------------ la muestra (al amanecer)
  const t0 = Date.now();
  const muestras = [];
  let fase = '', censoAntes = null;
  const muestra = async (etiqueta) => {
    await gc();
    const p = await js(`(()=>{ const H=${H}, R=H.renderer, D=H.desafio, so=H.sonido; let obj = 0; H.escena.traverse(() => obj++);
      const V = window.__vivos || {}; const lis = Object.entries(V.lis || {}).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 10);
      const libres = D ? D.estadoDuendes?.() : null;
      return { heap: performance.memory.usedJSHeapSize, geo: R.info.memory.geometries, tex: R.info.memory.textures, prog: R.info.programs ? R.info.programs.length : -1, obj,
        dom: document.getElementsByTagName('*').length, audio: V.audio, audioTot: V.audioTot, porTipo: V.porTipo, buffers: V.buffers, buffersMB: +(V.buffersMB || 0).toFixed(1), lis,
        previo: so?.previo?.size ?? null, previoNombres: so?.previo ? [...so.previo.keys()].filter((k) => /risa|piano/.test(k)).length : null, cola: so?.cola?.length ?? null, pendientes: so?.pendientes?.size ?? null, risasSonando: so?.risasSonando?.length ?? null,
        aliens: D?.aliens?.length ?? null, duendesModelo: libres ? libres.duendes : null, noches: H.progreso.desafio?.noches ?? null, oleadas: H.progreso.desafio?.oleadas ?? null, vuelta: H.progreso.desafio?.vuelta ?? 0,
        abatidos: H.progreso.desafio?.abatidos ?? null, asedio: !!H.progreso.desafio?.asedio?.activo, victoria: !!H.progreso.desafio?.victoria, dia: H.progreso.dia, horas: +H.progreso.horas.toFixed(2), cal: H.ajustes.calidad } })()`);
    const h = await js(HUERFANAS).catch(() => null);
    const censo = await js(CENSO).catch(() => null);
    const dc = await dbg.sendCommand('Memory.getDOMCounters').catch(() => ({}));
    const m = { t: Math.round((Date.now() - t0) / 1000), fase, etiqueta, heapMB: +(p.heap / 1048576).toFixed(1), geo: p.geo, tex: p.tex, prog: p.prog, obj: p.obj, dom: p.dom, listeners: dc.jsEventListeners, domNodos: dc.nodes,
      audio: p.audio, audioTot: p.audioTot, buffers: p.buffers, buffersMB: p.buffersMB, previo: p.previo, risasPiano: p.previoNombres, cola: p.cola, pendientes: p.pendientes, risasSonando: p.risasSonando,
      aliens: p.aliens, duendesModelo: p.duendesModelo, noches: p.noches, oleadas: p.oleadas, vuelta: p.vuelta, abatidos: p.abatidos, asedio: p.asedio, victoria: p.victoria, dia: p.dia, horas: p.horas,
      subidas: h?.subidas, huerfanasGeo: h?.geo, huerfanasTex: h?.tex, nuevasGeo: h?.nuevasG, topG: h?.topG, topT: h?.topT, porTipo: p.porTipo, lis: p.lis };
    muestras.push(m);
    fs.appendFileSync(path.join(SALIDA, 'muestras.jsonl'), JSON.stringify(m) + '\n');
    console.log(`${String(m.t).padStart(5)}s ${fase.padEnd(7)} ${etiqueta.padEnd(10)} noche ${m.oleadas} heap ${m.heapMB} geo ${m.geo} tex ${m.tex} prog ${m.prog} obj ${m.obj} lis ${m.listeners} dom ${m.domNodos} audio ${m.audio} buf ${m.buffers}/${m.buffersMB}MB previo ${m.previo} (risas+piano ${m.risasPiano}) cola ${m.cola} aliens ${m.aliens} abatidos ${m.abatidos} subidas ${m.subidas} huérfanas geo ${m.huerfanasGeo} (+${m.nuevasGeo}) tex ${m.huerfanasTex}`);
    if (h) for (const [k, n] of h.topG.slice(0, 8)) console.log(`      geo ${String(n).padStart(4)}× ${k.slice(0, 230)}`);
    if (h) for (const [k, n] of h.topT.slice(0, 4)) console.log(`      tex ${String(n).padStart(4)}× ${k.slice(0, 230)}`);
    // lo que cambió en la escena desde la muestra anterior (hijos directos, objetos y geometrías distintas)
    if (censo && censoAntes) {
      const dif = [];
      for (const [k, v] of Object.entries(censo)) {
        const a = censoAntes[k] || [0, 0, 0, {}];
        if (v[0] === a[0] && v[1] === a[1] && v[2] === a[2]) continue;
        // y, adentro, qué clase de objeto cambió (nombre o tipo, geometría, padre)
        const det = [];
        for (const l of new Set([...Object.keys(v[3]), ...Object.keys(a[3])])) { const x = a[3][l] || 0, y = v[3][l] || 0; if (x !== y) det.push(`${l} ${x}→${y}`); }
        dif.push(`${k}: hijos ${a[0]}→${v[0]} obj ${a[1]}→${v[1]} geo ${a[2]}→${v[2]}${det.length ? ' [' + det.slice(0, 6).join(', ') + ']' : ''}`);
      }
      for (const k of Object.keys(censoAntes)) if (!censo[k]) dif.push(`${k}: se fue (${censoAntes[k].slice(0, 3).join('/')})`);
      m.censo = dif; fs.appendFileSync(path.join(SALIDA, 'censo.jsonl'), JSON.stringify({ fase, etiqueta, dif }) + '\n');
      for (const t of dif.slice(0, 16)) console.log('      escena ' + t.slice(0, 400));
    }
    if (censo) censoAntes = censo;
    return m;
  };
  const noche = async (etq) => {
    await js(`window.__nocheSoak = (window.__nocheSoak || 0) + 1; 1`);
    await saltarDia();
    await hastaHora(5.9);      // la noche entera, peleando
    await hastaHora(7.0);      // el alba (el cofre, los refuerzos de madrugada)
    await armar();
    return muestra(etq);
  };

  try {
    // ---- la campaña: noches seguidas
    fase = 'campaña'; donde = fase;
    await partidaNueva(false);
    await armar();
    for (let i = 0; i < 300; i++) await js(`${H}.__bucle(); 1`);
    await muestra('inicio');
    for (let n = 1; n <= NOCHES && !caido; n++) { donde = `campaña noche ${n}`; await noche('noche ' + n); }
    // ---- el asedio: la noche 20 baja la nodriza, al alba se asienta; unas noches de asedio
    if (ASEDIO && !caido) {
      fase = 'asedio'; donde = fase;
      await js(`(()=>{ const D=${H}.progreso.desafio; D.oleadas = Math.max(D.oleadas, 19); D.especial = null; D.tutorial = 99; return 1 })()`);
      for (let n = 1; n <= 4 && !caido; n++) { donde = `asedio ${n}`; await noche('asedio ' + n); }
      // guardar y recargar en pleno asedio
      await js(`${H}.guardar(); 1`); await abrir(); await entrar(); await armar();
      for (let n = 5; n <= 6 && !caido; n++) { donde = `asedio ${n}`; await noche('asedio ' + n); }
    }
    // ---- sin fin
    if (SINFIN > 0 && !caido) {
      fase = 'sinfin'; donde = fase;
      await partidaNueva(true); await armar();
      for (let n = 1; n <= SINFIN && !caido; n++) { donde = `sin fin ${n}`; await noche('sinfin ' + n); }
    }
  } catch (e) { console.log('EXCEPCIÓN ' + e.stack); errores.push('excepción ' + e.message); }

  // ------------------------------------------------------------ resumen: pendiente por noche de cada métrica
  const resumen = [];
  for (const f of ['campaña', 'asedio', 'sinfin']) {
    const ms = muestras.filter((m) => m.fase === f && m.etiqueta !== 'inicio');
    if (ms.length < 3) continue;
    const mitad = ms.slice(Math.floor(ms.length / 2));
    resumen.push(`== ${f}: ${ms.length} noches`);
    for (const k of ['heapMB', 'geo', 'tex', 'prog', 'obj', 'listeners', 'domNodos', 'audio', 'buffers', 'buffersMB', 'previo', 'aliens', 'huerfanasGeo', 'huerfanasTex']) {
      const a = mitad[0][k], b = mitad[mitad.length - 1][k];
      if (typeof a !== 'number' || typeof b !== 'number') continue;
      const pend = (b - a) / Math.max(1, mitad.length - 1);
      resumen.push(`  ${k.padEnd(13)} ${String(ms[0][k]).padStart(8)} → ${String(ms[ms.length - 1][k]).padStart(8)}   segunda mitad: ${pend >= 0 ? '+' : ''}${pend.toFixed(2)} por noche`);
    }
  }
  resumen.push(`errores: ${errores.length}`);
  fs.writeFileSync(path.join(SALIDA, 'resumen.txt'), resumen.join('\n') + '\n');
  fs.writeFileSync(path.join(SALIDA, 'errores.txt'), errores.join('\n'));
  console.log(resumen.join('\n'));
  app.exit(0);
});

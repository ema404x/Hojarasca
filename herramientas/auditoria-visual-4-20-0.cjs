// 4.20.0 (auditoría visual): captura y mide los MISMOS encuadres fijos del valle (herramientas/auditoria-visual-4-20-0.json) en una partida real.
// Por encuadre: una captura PNG, los ms por cuadro (p50/p95, con gl.finish: CPU + placa, sin vsync), las llamadas de dibujo y los triángulos de un cuadro entero y
// de la escena sola, y el desglose de dónde salen (por grupo de la escena, aparte la pasada de sombras). En los encuadres marcados con `presupuesto` mide cuánto
// cuesta cada capa (sacando de a una: árboles, pasto, todo lo instanciado, sombras) y en los marcados con `calibrar` cuánto cuesta sumar triángulos, llamadas y
// una capa de pantalla completa (con y sin textura): el presupuesto para el salto gráfico. Es una herramienta de MEDICIÓN: no cambia nada del juego.
//
// Uso (después de `node armar.mjs`), siempre por el lanzador (monitor externo, perfil propio, candado de Electron tomado):
//   $env:AUD_SALIDA='<carpeta>'; $env:AUD_GRUPO='verano'; powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script herramientas\auditoria-visual-4-20-0.cjs -Espera 900 -Perfil <carpeta propia> -Visible
// Variables: AUD_LASTRE (2: dibujos de escena de más antes de cada cuadro para fijar el reloj de la placa), AUD_ESCALA (1,5: el lienzo interno de 1920x1080 sobre la ventana de 1280x720, como una ventana de 1080p), AUD_PAGINA (index.html), AUD_CALIDAD (alta), AUD_SALIDA, AUD_GRUPO (verano|invierno|otono), AUD_SOLO=id1,id2, AUD_CLIMA (despejado), AUD_MEDIR=0 (sólo capturas),
//   AUD_MUESTRA_MS (4000: cuánto se mide cada encuadre con el bucle real), AUD_ASIENTO (150 cuadros sin medir), AUD_CICLOS (5 ciclos de las capas), AUD_ESTACION (por defecto = el grupo).
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const env = (n, d) => process.env['AUD_' + n] || d;
const pagina = path.resolve(env('PAGINA', 'index.html'));
const calidad = env('CALIDAD', 'alta');
const grupo = env('GRUPO', 'verano');
const estacion = env('ESTACION', grupo);
const clima = env('CLIMA', 'despejado');
const salida = path.resolve(env('SALIDA', path.join(process.env.TEMP || '.', 'auditoria-visual')));
const solo = env('SOLO', '') ? env('SOLO', '').split(',') : null;
const medir = env('MEDIR', '1') !== '0';
const ASIENTO = Number(env('ASIENTO', 150));
const CICLOS = Number(env('CICLOS', 5));
const ESCALA = Number(env('ESCALA', 1.5));
const LASTRE = Number(env('LASTRE', 2));
const MUESTRA_MS = Number(env('MUESTRA_MS', 4000));
fs.mkdirSync(salida, { recursive: true });
dialog.showErrorBox = (t, c) => { try { fs.writeFileSync(path.join(salida, 'error.txt'), t + String.fromCharCode(10) + c); } catch { /* sin carpeta */ } };
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const salir = (c) => { try { app.exit(c); } catch { process.exit(c); } };
process.on('uncaughtException', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR: ${e && e.stack ? e.stack : e}`); salir(1); });
setTimeout(() => { console.log('ERROR: tardó más de 20 minutos'); salir(2); }, 20 * 60 * 1000).unref?.();

// Lo que corre en la página (se arma una vez, después de entrar al juego).
const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, T = H.T, R = H.renderer, THREE = H.THREE;
  const A = window.__AUD = {};
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  const gl = R.getContext();
  A.programas = () => R.info.programs.length;
  // pone la cámara fija y el reloj quieto
  A.poner = (p, pitch, fov) => {
    const y = p.y ?? T.altura(p.x, p.z) + 1.65;
    H.jugador.ubicar(p.x, p.z, 0);
    H.__camaraFija = { x: p.x, y, z: p.z, yaw: p.yaw, pitch };
    H.camara.fov = fov; H.camara.updateProjectionMatrix();
    H.progreso.horas = p.horas; window.__hora = p.horas;
    H.camara.children.forEach((q) => { q.visible = false; });
    return { x: +p.x.toFixed(1), y: +y.toFixed(1), z: +p.z.toFixed(1), yaw: +p.yaw.toFixed(3), horas: p.horas };
  };
  // una cámara a «dist» metros de la persona «g», en el primer rumbo (desde el que mira ella, y de ahí girando) con el camino libre de obstáculos
  A.camaraGente = (g, dist, horas) => {
    const base = (g.g && g.g.rotation ? g.g.rotation.y : 0), gy = T.altura(g.pos.x, g.pos.z);
    const libre = (a) => {
      for (let d = 0.8; d <= dist; d += 0.6) {
        const p = { x: g.pos.x + Math.sin(a) * d, y: T.altura(g.pos.x + Math.sin(a) * d, g.pos.z + Math.cos(a) * d) + 0.2, z: g.pos.z + Math.cos(a) * d };
        const x0 = p.x, z0 = p.z; H.col.resolver(p, 0.3, 1.4);
        if (Math.hypot(p.x - x0, p.z - z0) > 0.03) return false;
      }
      return true;
    };
    let mejor = base;
    for (const o of [0, 0.5, -0.5, 1, -1, 1.5, -1.5, 2, -2, 2.6, -2.6, 3.14]) if (libre(base + o)) { mejor = base + o; break; }
    return { x: g.pos.x + Math.sin(mejor) * dist, z: g.pos.z + Math.cos(mejor) * dist, yaw: Math.atan2(Math.sin(mejor), Math.cos(mejor)), horas, altoPersona: gy };
  };
  A.haciaSol = () => {
    const c = H.__cielo(), s = c.sol; const t = s.target ? s.target.position : { x: 0, y: 0, z: 0 };
    const dx = s.position.x - t.x, dz = s.position.z - t.z;
    const f = H.__camaraFija; f.yaw = Math.atan2(-dx, -dz);   // la cámara mira hacia donde mira (-sen yaw, -cos yaw): hacia el sol
    return +f.yaw.toFixed(3);
  };
  A.cuadros = async (n) => { for (let i = 0; i < n; i++) { H.progreso.horas = window.__hora; H.__bucle(); if (i % 10 === 9) await dormir(0); } return 1; };
  const q = (a, f) => { if (!a.length) return -1; const o = a.slice().sort((x, y) => x - y); return +o[Math.min(o.length - 1, Math.floor(o.length * f))].toFixed(2); };
  // El tiempo se toma del bucle REAL del juego (requestAnimationFrame, ventana visible, sin límite de cuadros): lo que dura el callback (CPU), lo que tardó la placa
  // en dibujar el cuadro (el cronómetro de la placa del juego: dibujar() entero, con sombras, escena y postproceso) y el intervalo entre cuadros. El «costo» de un
  // cuadro es el mayor de los dos (CPU y placa van en paralelo), como en el juego. gl.finish() no sirve acá: no espera siempre a la placa.
  const C = window.__AUD_C = { activo: false, cpu: [], gpu: [], int: [], ultimoT: 0, antes: null, pausas: 0, lastre: 0 };
  // El lastre: la placa de esta PC (y la de la 4600G) baja el reloj cuando le sobra tiempo dentro del cuadro de 16,7 ms y los ms de la placa se estiran hasta ese
  // período (medido: el mismo cuadro da 9 ms o 15,7 según la racha). Para medir lo que cuesta de verdad se dibuja la escena dos veces más ANTES de cada cuadro (fuera del
  // cronómetro del juego): la placa queda al 100 % y con el reloj arriba. Esos dibujos no se ven (el cuadro real los pisa).
  A.lastre = (n) => { C.lastre = n; return n; };
  A.instalar = () => {
    if (C.instalado) return 1; C.instalado = true;
    H.medidor.visible = true;   // (el cronómetro de la placa sólo anda con el medidor prendido)
    const orig = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => orig((t) => {
      if (cb.name !== 'bucle') return cb(t);
      if (H.__caidas.modo() !== 'jugando') { C.pausas++; H.volverAlJuego(); }
      H.progreso.horas = window.__hora;
      if (C.antes) C.antes();
      for (let i = 0; i < C.lastre; i++) R.render(H.escena, H.camara);
      const a = performance.now(); cb(t); const b = performance.now();
      if (C.activo) { C.cpu.push(b - a); C.gpu.push(H.__gpuMs()); C.int.push(C.ultimoT ? t - C.ultimoT : 0); }
      C.ultimoT = t;
    });
    return 1;
  };
  A.muestrear = async (ms, calentar = 0) => {
    if (calentar) await dormir(calentar);   // (el reloj de la placa tarda un par de segundos en subir)
    C.cpu = []; C.gpu = []; C.int = []; C.ultimoT = 0; C.activo = true; await dormir(ms); C.activo = false;
    const gpu = C.gpu.filter((x) => x >= 0), costo = C.cpu.map((c, i) => Math.max(c, C.gpu[i] >= 0 ? C.gpu[i] : 0));
    return { cuadros: C.cpu.length, cpu: { p50: q(C.cpu, 0.5), p95: q(C.cpu, 0.95) }, gpu: { p50: q(gpu, 0.5), p95: q(gpu, 0.95), n: gpu.length }, costo: { p50: q(costo, 0.5), p95: q(costo, 0.95) }, intervalo: { p50: q(C.int.slice(1), 0.5), p95: q(C.int.slice(1), 0.95) }, pausas: C.pausas };
  };
  // los subsistemas del bucle real (perfilador del juego): dónde se va la CPU
  A.perfilarInicio = () => { H.perfilador.limpiar(); return 1; };
  A.perfilarFin = () => [...H.perfilador.stats.values()].sort((a, b) => b.ema - a.ema).slice(0, 14).map((x) => ({ nombre: x.nombre, ms: +x.ema.toFixed(3), muestras: x.muestras }));
  // llamadas de dibujo y triángulos de un cuadro entero (sombras, escena y postproceso) y de la escena sola; los ms de la escena sola no sirven (ver arriba)
  A.contar = () => {
    let reset = null; R.info.autoReset = false; R.info.reset(); reset = R.info.reset; R.info.reset = () => {};
    H.progreso.horas = window.__hora; R.shadowMap.needsUpdate = false; H.__bucle();
    const entero = { llamadas: R.info.render.calls, triangulos: R.info.render.triangles, puntos: R.info.render.points };
    R.info.reset = reset; R.info.reset(); reset = R.info.reset; R.info.reset = () => {};
    R.shadowMap.needsUpdate = true; H.__bucle();
    const conSombras = { llamadas: R.info.render.calls, triangulos: R.info.render.triangles };
    R.info.reset = reset; R.info.reset(); R.render(H.escena, H.camara);
    const escena = { llamadas: R.info.render.calls, triangulos: R.info.render.triangles, puntos: R.info.render.points };
    R.info.autoReset = true;
    return { entero, conSombras, escena, lienzo: [R.domElement.width, R.domElement.height], pixelRatio: R.getPixelRatio() };
  };
  // de dónde sale cada llamada de dibujo de un cuadro (con las sombras rehechas para ver también esa pasada)
  A.desglose = () => {
    const chunks = new Set([...H.veg.chunks.values()].map((c) => c.grupo)), gente = new Set((H.gente.gente || []).map((g) => g.g)), pasto = H.pasto && H.pasto.malla;
    const raiz = (o) => { let x = o; while (x.parent && x.parent !== H.escena) x = x.parent; return x; };
    const lugares = Object.entries(T.lugares || {}).filter(([, v]) => v && Number.isFinite(v.x));
    const cerca = (x, z) => { let m = null, d0 = 25; for (const [k, v] of lugares) { const d = Math.hypot(v.x - x, v.z - z); if (d < d0) { d0 = d; m = k; } } return m; };
    const cat = (o) => {
      const rz = raiz(o);
      if (chunks.has(rz)) return 'vegetacion (chunks de árboles, plantas, piedras)';
      if (gente.has(rz)) return 'gente';
      if (rz === pasto || (pasto && pasto.children && pasto.children.includes && pasto.children.includes(rz))) return 'pasto';
      if (rz.name) return rz.name;
      if (rz.isPoints) return 'puntos (flotantes, polvo, luciérnagas)';
      if (rz.isInstancedMesh) return 'instanciado sin nombre';
      const c = cerca(rz.position.x, rz.position.z);
      return (rz.isGroup ? 'grupo' : rz.type) + (c ? ' cerca de ' + c : ' (sin lugar)') + ' · ' + (rz.children.length) + ' hijos';
    };
    const orig = R.renderBufferDirect.bind(R), cuenta = new Map();
    R.renderBufferDirect = function (cam, esc, geo, mat, obj, grp) {
      const t0 = R.info.render.triangles, c0 = R.info.render.calls;
      const r = orig(cam, esc, geo, mat, obj, grp);
      const pasada = (mat && (mat.isMeshDepthMaterial || mat.isMeshDistanceMaterial)) ? 'sombra' : (mat && mat.isShaderMaterial && !obj.isMesh ? 'post' : 'escena');
      let k = pasada + ' · ' + (pasada === 'sombra' ? 'sombra' : cat(obj));
      if (pasada === 'escena' && geo && geo.attributes && geo.attributes.position && geo.attributes.position.count === 4 && obj.parent !== H.escena && !raiz(obj).name) k = 'post-o-quad · ' + k;
      const e = cuenta.get(k) || { llamadas: 0, triangulos: 0 }; e.llamadas += R.info.render.calls - c0; e.triangulos += R.info.render.triangles - t0; cuenta.set(k, e);
      return r;
    };
    R.shadowMap.needsUpdate = true; R.info.autoReset = true;
    try { H.progreso.horas = window.__hora; H.__bucle(); } finally { R.renderBufferDirect = orig; }
    const l = [...cuenta.entries()].map(([k, v]) => ({ k, ...v })).sort((a, b) => b.triangulos - a.triangulos);
    return l.slice(0, 45);
  };
  // las capas: cada variante se activa, se miden unos cuadros y se desactiva; en ciclos, así el ruido de la PC les toca a todas igual
  const guardar = [];
  const ocultar = (lista) => { for (const o of lista) { guardar.push([o, o.visible]); o.visible = false; } };
  const devolver = () => { while (guardar.length) { const [o, v] = guardar.pop(); o.visible = v; } };
  const instanciados = () => { const l = []; H.escena.traverse((o) => { if (o.isInstancedMesh && o.visible) l.push(o); }); return l; };
  const arboles = () => { const l = []; for (const c of H.veg.chunks.values()) if (c.grupo.visible) l.push(c.grupo); for (const o of H.escena.children) if (o.name === 'sotobosque' || o.name === 'impostores') l.push(o); return l; };
  const terreno = () => H.escena.children.filter((o) => o.name === 'terreno' || o.name === 'terreno-aldea');
  const domo = () => { const l = []; H.escena.traverse((o) => { if (o.isMesh && o.geometry && o.geometry.parameters && o.geometry.parameters.radius === 4000) l.push(o); }); return l; };
  const pantallaRel = (e) => { R.setPixelRatio(e); const p = H.__postproceso(); if (p) p.redimensionar(window.innerWidth, window.innerHeight); };
  // la escala base de la auditoría (1,5 sobre 1280x720 = 1920x1080 de lienzo: lo que dibuja una ventana de 1080p) y los ms medidos con ella
  A.escalaBase = 1; A.escala = (e) => { A.escalaBase = e; pantallaRel(e); return [R.domElement.width, R.domElement.height]; };
  const pastos = () => { const p = H.pasto && H.pasto.malla; return p ? (Array.isArray(p) ? p : [p]) : []; };
  const calib = [];
  // (los objetos de calibración van a la escena, en un punto fijo delante de la cámara, para no depender de que la cámara cuelgue de ella)
  const colocar = (o) => { const p = H.camara.localToWorld(o.position.clone()); o.position.copy(p); H.escena.add(o); calib.push(o); return o; };
  const limpiarCalib = () => { while (calib.length) { const o = calib.pop(); o.parent && o.parent.remove(o); } };
  const mat = () => new THREE.MeshLambertMaterial({ color: 0x88aa66 });
  const cajaFina = (seg) => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1, seg, seg, seg), mat()); m.position.set(1.2, -0.5, -7); m.scale.setScalar(0.5); m.frustumCulled = false; return m; };
  const muchas = (n) => { const g = new THREE.BoxGeometry(0.06, 0.06, 0.06), m = mat(); const l = []; for (let i = 0; i < n; i++) { const o = new THREE.Mesh(g, m); o.position.set(-1.8 + (i % 20) * 0.19, -0.9 + Math.floor(i / 20) * 0.19, -5 - (i % 7) * 0.4); o.frustumCulled = false; l.push(o); } return l; };
  const pantalla = (conTextura) => {
    // (el three que expone el juego sólo trae unas pocas clases: una textura de datos, como las del valle: 512x512, con mipmaps, repetida 8 veces)
    let t = null;
    if (conTextura) {
      const d = new Uint8Array(512 * 512 * 4); for (let i = 0; i < d.length; i += 4) { const v = 90 + ((i * 2654435761) >>> 24) % 80; d[i] = v; d[i + 1] = v + 20; d[i + 2] = v; d[i + 3] = 255; }
      const Uo = typeof H.__U === 'function' ? H.__U() : H.__U, DT = Uo.uEstepa.value.constructor;   // (el constructor sale de una textura de datos del valle)
      t = new DT(d, 512, 512, 1023, 1009); t.wrapS = t.wrapT = 1000; t.minFilter = 1008; t.magFilter = 1006; t.generateMipmaps = true; t.anisotropy = 8; t.needsUpdate = true; t.repeat.set(8, 8);
    }
    const m = new THREE.MeshLambertMaterial({ color: conTextura ? 0xffffff : 0x778877, map: t, transparent: true, opacity: 0.5, depthTest: false, depthWrite: false });   // (el three del juego no trae MeshBasicMaterial: se usa el material de las obras)
    const o = new THREE.Mesh(new THREE.BoxGeometry(40, 40, 0.01), m); o.position.set(0, 0, -1.5); o.renderOrder = 9999; o.frustumCulled = false; return o;
  };
  const VARIANTES = {
    'completo': { on: () => {}, off: () => {} },
    'sin-instanciados': { on: () => ocultar(instanciados()), off: devolver, cada: () => { ocultar(instanciados().filter((o) => o.visible)); } },
    'sin-arboles-y-soto': { on: () => ocultar(arboles()), off: devolver, cada: () => ocultar(arboles().filter((o) => o.visible)) },
    'sin-pasto': { on: () => ocultar(pastos()), off: devolver, cada: () => ocultar(pastos().filter((o) => o.visible)) },
    'sin-post': { on: () => { A.postOriginal = H.ajustes.post; H.ajustes.post = 'apagado'; }, off: () => { H.ajustes.post = A.postOriginal; } },
    'sin-terreno': { on: () => ocultar(terreno()), off: devolver, cada: () => ocultar(terreno().filter((o) => o.visible)) },
    'sin-cielo': { on: () => ocultar(domo()), off: devolver, cada: () => ocultar(domo().filter((o) => o.visible)) },
    'resolucion-0.7': { on: () => pantallaRel(0.7), off: () => pantallaRel(A.escalaBase) },
    'resolucion-1': { on: () => pantallaRel(1), off: () => pantallaRel(A.escalaBase) },
    'sin-sombras': { on: () => { R.shadowMap.enabled = false; H.__cielo().sol.castShadow = false; }, off: () => { R.shadowMap.enabled = true; H.__cielo().sol.castShadow = true; R.shadowMap.needsUpdate = true; } },
    'rehacer-sombras': { on: () => {}, off: () => {}, cada: () => { R.shadowMap.needsUpdate = true; } },
    '+100k-triangulos': { on: () => colocar(cajaFina(91)), off: limpiarCalib },
    '+400k-triangulos': { on: () => colocar(cajaFina(182)), off: limpiarCalib },
    '+300-llamadas': { on: () => muchas(300).forEach(colocar), off: limpiarCalib },
    '+1-pantalla-lisa': { on: () => colocar(pantalla(false)), off: limpiarCalib },
    '+1-pantalla-textura': { on: () => colocar(pantalla(true)), off: limpiarCalib },
    '+3-pantallas-textura': { on: () => { colocar(pantalla(true)); const b = pantalla(true); b.position.z = -1.6; colocar(b); const c = pantalla(true); c.position.z = -1.7; colocar(c); }, off: limpiarCalib },
  };
  A.nombresVariantes = Object.keys(VARIANTES);
  A.variantes = async (nombres, ciclos, ms) => {
    const por = Object.fromEntries(nombres.map((n) => [n, []]));
    for (let c = 0; c < ciclos; c++) {
      for (const n of nombres) {
        const v = VARIANTES[n]; v.on(); C.antes = v.cada || null;
        await dormir(500);   // (los programas nuevos se compilan acá)
        const m = await A.muestrear(ms);
        v.off(); devolver(); C.antes = null;
        por[n].push(m);
        await dormir(100);
      }
    }
    const med = (a) => { const o = a.filter((x) => x >= 0).sort((x, y) => x - y); return o.length ? +o[Math.floor(o.length / 2)].toFixed(2) : -1; };
    const r = {};
    for (const n of nombres) r[n] = { costo: med(por[n].map((m) => m.costo.p50)), cpu: med(por[n].map((m) => m.cpu.p50)), gpu: med(por[n].map((m) => m.gpu.p50)), costoP95: med(por[n].map((m) => m.costo.p95)), intervalo: med(por[n].map((m) => m.intervalo.p50)), ciclos: por[n].map((m) => m.costo.p50) };
    return r;
  };
  // inventario de materiales y texturas (una vez)
  A.inventario = () => {
    const tex = new Map(), mats = new Map(); let mallas = 0, instanciadas = 0, instancias = 0, triTotal = 0;
    H.escena.traverse((o) => {
      if (!o.isMesh && !o.isPoints) return;
      mallas++;
      if (o.isInstancedMesh) { instanciadas++; instancias += o.count; }
      const g = o.geometry; if (g && g.attributes && g.attributes.position) triTotal += (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1);
      for (const m of [].concat(o.material || [])) {
        mats.set(m.uuid, m);
        for (const k of Object.keys(m)) { const v = m[k]; if (v && v.isTexture) tex.set(v.uuid, { donde: 'material.' + k, ...info(v) }); }
        if (m.uniforms) for (const [k, u] of Object.entries(m.uniforms)) { const v = u && u.value; if (v && v.isTexture) tex.set(v.uuid, { donde: 'uniforme ' + k, ...info(v) }); }
      }
    });
    function info(t) { const im = t.image || {}; return { w: im.width || (t.source && t.source.data && t.source.data.width) || 0, h: im.height || (t.source && t.source.data && t.source.data.height) || 0, mipmaps: !!t.generateMipmaps, aniso: t.anisotropy, formato: t.format, tipo: t.type, nombre: t.name || '' }; }
    const tipos = {}; for (const m of mats.values()) tipos[m.type] = (tipos[m.type] || 0) + 1;
    const nombres = {}; for (const m of mats.values()) { const n = m.name || '(sin nombre)'; nombres[n] = (nombres[n] || 0) + 1; }
    return { mallas, instanciadas, instancias, trianglesEnEscena: Math.round(triTotal), materiales: mats.size, tiposDeMaterial: tipos, texturas: [...tex.values()], memoria: { ...R.info.memory }, programas: R.info.programs.length,
      luces: (() => { const l = []; H.escena.traverse((o) => { if (o.isLight) l.push(o.type + (o.castShadow ? ' (sombra)' : '')); }); return l; })(), niebla: H.escena.fog ? { tipo: H.escena.fog.isFogExp2 ? 'exp2' : 'lineal', densidad: H.escena.fog.density } : null };
  };
  return 1;
})()`;

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: true, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.focus();
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300)); });
  const js = (c) => w.webContents.executeJavaScript(c, true);
  const H = 'window.__hojarasca';
  const ajustes = `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${calidad}', clima:'${clima}', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', modoFluido:false, estacion:'${estacion}'})); 1`;
  await w.loadFile(pagina, { search: '?debug=1' });
  await js(ajustes);
  await w.loadFile(pagina, { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.est && ${H}.T)`).catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3500);
  await js(`${H}.ajustes.limiteFps = 'libre'; ${H}.volverAlJuego?.(true); 1`);
  await js(PAGINA);
  if (medir) await js(`window.__AUD.instalar()`);   // (instalada, las capturas salen negras: sólo se instala al medir)
  const lienzo = await js(`window.__AUD.escala(${ESCALA})`);
  if (medir) await js(`window.__AUD.lastre(${LASTRE})`);
  console.log('lienzo ' + lienzo.join('x') + ' (escala ' + ESCALA + ')');
  // sin carteles del HUD en la captura
  await js(`(() => { let s = document.createElement('style'); s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; document.head.appendChild(s); return 1 })()`);
  const tomas = JSON.parse(fs.readFileSync(path.resolve(env('TOMAS', path.join(__dirname, 'auditoria-visual-4-20-0.json'))), 'utf8')).filter((t) => t.grupo === grupo && (!solo || solo.includes(t.id)));
  const resultado = { pagina, calidad, grupo, estacion, clima, muestraMs: MUESTRA_MS, lastre: LASTRE, escala: ESCALA, ciclos: CICLOS, tomas: {}, errores: [] };
  resultado.inventario = await js(`window.__AUD.inventario()`);
  const hayAldea = tomas.some((t) => t.aldea), hayObras = tomas.some((t) => t.obras);
  if (hayAldea) {
    const abiertos = await js(`(()=>{ const H = window.__hojarasca, A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return null; const a = H.progreso.aldea;
      const L = { carpintero: 'carpinteria', veterinaria: 'veterinaria', panadera: 'panaderia', herbolaria: 'herboristeria', herrero: 'herreria', modista: 'costureria', pescador: 'pescaderia', botera: 'varadero', maestra: 'escuela', pintora: 'taller-arte', enfermera: 'puesto-sanitario', andinista: 'refugio-andinista', telegrafista: 'estafeta', fotografa: 'estudio-fotos', tejedora: 'hilanderia', ceramista: 'ceramica', apicultor: 'sala-miel', astronoma: 'observatorio', guardaparque: 'seccional', musico: 'salon' };
      const ks = Object.keys(L).filter((k) => A.estadoEdificio(L[k]));
      a.pobladores = ks.map((clave) => ({ clave, dia: 1 })); a.obras = {}; a.locales = Object.fromEntries(ks.map((k) => [L[k], 1])); a.descubierta = 1; a.llegando = null;
      A.actualizar(4, H.camara.position); return ks.length })()`);
    console.log('locales abiertos: ' + abiertos);
    await js(`(async () => { const H = ${H}, A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return 0;
      for (let i = 0; i < 100 && A.medir().fabrica.pendientes > 0; i++) await new Promise((ok) => setTimeout(ok, 100));
      for (let n = 0; n < 3000 && (A.medir().cola > 0 || A.medir().listas < A.medir().manzanas); n++) { H.__bucle(); if (n % 50 === 49) await new Promise((ok) => setTimeout(ok, 0)); }
      return 1 })()`);
  }
  if (hayObras) {
    const demo = await js(`(() => { const H = ${H}, T = H.T, r0 = T.lugares.refugio, arboles = H.veg.arboles.filter((q) => !q.sacado && !q.caido);
      const pend = (x, z) => 1 - T.normal(x, z).y;
      let sitio = null;
      for (let r = 30; r < 420 && !sitio; r += 4) for (let a = 0; a < 6.28 && !sitio; a += 0.1) {
        const x = r0.x + Math.cos(a) * r, z = r0.z + Math.sin(a) * r;
        if (Math.abs(x) > 430 || Math.abs(z) > 430) continue;
        let bien = !arboles.some((q) => Math.hypot(q.x - x, q.z - z) < 24);
        for (let k = 0; k < 8 && bien; k++) for (const d of [8, 16]) { const px = x + Math.cos(k * 0.785) * d, pz = z + Math.sin(k * 0.785) * d; if (pend(px, pz) > 0.045 || T.agua(px, pz)) bien = false; }
        if (bien && pend(x, z) < 0.03 && !T.agua(x, z)) sitio = { x, z };
      }
      if (!sitio) return null;
      const O = H.obras, y = (x, z) => T.altura(x, z);
      const lista = [['puesto', 0, 0, 0], ['casilla', 11, -1, 0.3], ['galponcito', -11, 1, -0.2], ['cabana-piedra', 0, 12, 0], ['casa-galeria', 14, 12, 0.2], ['fogon', 5, 6, 0], ['banco', -4, 5, 0.3], ['lenera', -6, -3, 0],
        ['cobertizo', -14, 12, 0.1], ['gallinero', 7, -10, 0.2], ['telar', -8, 8, 0]].filter(([id]) => O.obras.every((q) => q.plano.id !== id));
      O.sincronizar(lista.map(([plano, dx, dz, rot]) => ({ plano, x: sitio.x + dx, z: sitio.z + dz, y: y(sitio.x + dx, sitio.z + dz), rot, etapas: 99 })));
      window.__demo = sitio; return { x: +sitio.x.toFixed(1), z: +sitio.z.toFixed(1), obras: O.obras.length } })()`);
    console.log('claro de las casas del jugador: ' + JSON.stringify(demo));
    resultado.demo = demo;
  }
  await js(`(async () => { for (let n = 0; n < 60; n++) ${H}.__bucle(); return 1 })()`);
  resultado.programasAlEmpezar = await js(`window.__AUD.programas()`);
  for (const t of tomas) {
    const lugar = await js(`(() => { const H = ${H}, T = H.T; const p = ${t.donde}; if (!p) return null; return window.__AUD.poner(p, ${t.pitch ?? -0.03}, ${t.fov || 60}) })()`);
    if (!lugar) { console.log('  ' + t.id + ': este lugar no está'); resultado.tomas[t.id] = null; continue; }
    await js(`window.__AUD.cuadros(${ASIENTO})`);
    await esperar(1200);
    await js(`window.__AUD.cuadros(30)`);
    if (t.haciaSol) { lugar.yaw = await js(`window.__AUD.haciaSol()`); await js(`window.__AUD.cuadros(40)`); }
    const r = { id: t.id, donde: lugar, programasAntes: await js(`window.__AUD.programas()`) };
    // captura (a veces la placa devuelve UnknownVizError: se reintenta con la ventana al frente)
    await js(`window.__AUD.cuadros(3)`);
    let img = null;
    for (let intento = 0; intento < 5 && !img; intento++) {
      try { img = await w.webContents.capturePage(); } catch (e) { console.log('  (captura fallida: ' + (e && e.message) + ', se reintenta)'); try { w.show(); w.focus(); } catch { /* sin ventana */ } await js(`window.__AUD.cuadros(3)`); await esperar(1500); }
    }
    if (img) { fs.writeFileSync(path.join(salida, `${t.id}.png`), img.toPNG()); r.captura = `${t.id}.png`; } else console.log('  ' + t.id + ': sin captura');
    if (medir && t.medir) {
      const intentar = async (nombre, cod) => { try { r[nombre] = await js(cod); } catch (e) { r[nombre] = { error: String(e && e.message || e) }; console.log('  (falló ' + nombre + ': ' + (e && e.message) + ')'); } };
      await intentar('conteo', `window.__AUD.contar()`);
      // primero SIN lastre: los ms de la CPU (con el lastre la CPU espera a la placa y se infla) y la placa como la tiene el juego (reloj elástico)
      await js(`window.__AUD.lastre(0)`);
      await js(`window.__AUD.perfilarInicio()`);
      await intentar('medidaLibre', `window.__AUD.muestrear(3000, 1500)`);
      await intentar('subsistemas', `window.__AUD.perfilarFin()`);
      await js(`window.__AUD.lastre(${LASTRE})`);
      await intentar('medida', `window.__AUD.muestrear(${MUESTRA_MS}, 2500)`);
      await intentar('desglose', `window.__AUD.desglose()`);
      if (t.presupuesto && env('CAPAS', '1') !== '0') await intentar('capas', `window.__AUD.variantes(['completo','sin-post','sin-sombras','sin-instanciados','sin-arboles-y-soto','sin-pasto','sin-terreno','sin-cielo','rehacer-sombras','resolucion-1','resolucion-0.7'], ${CICLOS}, 1200)`);
      if (t.calibrar && env('CAPAS', '1') !== '0') await intentar('calibracion', `window.__AUD.variantes(['completo','+100k-triangulos','+400k-triangulos','+300-llamadas','+1-pantalla-lisa','+1-pantalla-textura','+3-pantallas-textura'], ${CICLOS}, 1200)`);
      await intentar('programasDespues', `window.__AUD.programas()`);
    }
    resultado.tomas[t.id] = r;
    const m = r.medida;
    console.log('  ' + t.id + (m ? ` · costo p50 ${m.costo.p50} p95 ${m.costo.p95} ms (cpu ${m.cpu.p50}/${m.cpu.p95}, placa ${m.gpu.p50}/${m.gpu.p95}, intervalo ${m.intervalo.p50}) · ${r.conteo.entero.llamadas} llamadas · ${r.conteo.entero.triangulos} triángulos · ${m.cuadros} cuadros` : '') + ' · ' + JSON.stringify(lugar));
    fs.writeFileSync(path.join(salida, `auditoria-${grupo}.json`), JSON.stringify(resultado, null, 1));
  }
  resultado.errores = errores;
  fs.writeFileSync(path.join(salida, `auditoria-${grupo}.json`), JSON.stringify(resultado, null, 1));
  console.log(errores.length ? 'ERRORES: ' + errores.join(' | ') : 'sin errores en la consola');
  await esperar(800);
  salir(0);
}).catch((e) => { console.log('ERROR: ' + (e && e.stack ? e.stack : e)); salir(1); });

// 4.3: cuánto cuesta el cuadro cuando el jugador CONSTRUYE todo lo que sumó la 4.2/4.3 (no sólo el mundo base).
//
// Una partida Relax nueva en calidad alta, hora fija 14:30, y una zona llana cerca del refugio donde se levantan, ya TERMINADAS (con
// `obras.fundar` + `obras.avanzar`, sin cobrar: el mismo camino de los humos de la 4.2) y separadas para que `revisarSitio` las acepte:
//   grupo A: los 8 edificios de oficio · grupo B: los 5 depósitos en su nivel máximo y llenos · grupo C: 6 ampliaciones grandes de la casa
//   grupo D: las 21 piezas de lujo · grupo E: el negocio propio (almacén de campo), abierto, surtido y con tres clientes en el mostrador.
// Primero se planifican TODOS los lugares (así la vista es la misma antes y después de cada grupo) y se mide la vista de referencia sin obras.
// Después de cada grupo se mide la misma vista. Cada medición: ASIENTO cuadros sin medir y CUADROS medidos a mano (`__bucle` + `gl.finish()`,
// límite de cuadros libre): p50, p95, dibujos y triángulos del cuadro entero (sombras, escena y postproceso).
// Vistas: «conjunto» (el jugador parado afuera, mirando al conjunto), «centro» (parado entre las obras, mirando al lado más cargado) y
// «caminando» (paso a paso por el medio con `jugador.actualizar(0.05)` + `__bucle`). Cada obra se cuenta aparte (triángulos y mallas).
//
// Uso (desde la carpeta de la versión, después de `node armar.mjs`; siempre en el monitor externo y con perfil propio):
//   HOJ_PERFIL=<carpeta> CORRIDA=1 SALIDA=<carpeta de salida> npx electron --no-sandbox -r <abs>/herramientas/al-monitor.cjs -r <abs>/herramientas/perfil-propio.cjs herramientas/medir-obras-43.cjs
// Opciones: CUADROS=200 ASIENTO=150 FOTOS=0 (sin capturas) CALIDAD=alta. Con cada corrida se rehacen obras.json y obras.md juntando todas las
// corridas de la carpeta (la variación entre corridas sale de ahí).
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const HTML = path.resolve(process.env.HTML || path.join(__dirname, '..', 'index.html'));
const SALIDA = path.resolve(process.env.SALIDA || 'C:/Users/ema40/OneDrive/Documents/Hojarasca/trabajo/fps43');
const CALIDAD = process.env.CALIDAD || 'alta';
const CUADROS = Number(process.env.CUADROS || 200);
const ASIENTO = Number(process.env.ASIENTO || 150);
const CAMINAR = Number(process.env.CAMINAR || 400);
const FOTOS = process.env.FOTOS !== '0';
const ANCHO = 1280, ALTO = 720;
fs.mkdirSync(SALIDA, { recursive: true });
const CORRIDA = Number(process.env.CORRIDA || (fs.readdirSync(SALIDA).filter((f) => /^obras-corrida\d+\.json$/.test(f)).length + 1));
const perfil = process.env.HOJ_PERFIL || (process.argv.find((a) => a.startsWith('--user-data-dir=')) || '').slice(16);
if (!perfil) { console.error('falta HOJ_PERFIL=<carpeta propia> (o --user-data-dir=)'); process.exit(2); }
app.setPath('userData', path.resolve(perfil));
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
app.commandLine.appendSwitch('js-flags', '--expose-gc');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const GRUPOS = [
  { id: 'A', nombre: 'oficios (8)', planos: ['herreria-propia', 'carpinteria', 'panaderia-horno', 'cerveceria', 'telar-grande', 'queseria', 'tienda-campo', 'canteria'] },
  { id: 'B', nombre: 'depósitos en su nivel máximo (5)', planos: ['pila-piedra', 'deposito-piedra', 'barraca', 'silo', 'herramientero'] },
  { id: 'C', nombre: 'ampliaciones grandes de la casa (6)', planos: ['buhardilla', 'salon-grande', 'planta-alta', 'torreon-piedra', 'bodega-piedra', 'quincho'] },
  { id: 'D', nombre: 'piezas de lujo (21)', planos: ['vitrina-roble', 'reloj-pie', 'alfombra-tejida-grande', 'arana-velas', 'fuente-piedra', 'candelabro-pared', 'jarron-flores', 'cuadro-retrato', 'cuadro-valle', 'candelabro-pie', 'biombo-tallado', 'sillon-cuero', 'estanteria-roble', 'armario-tallado', 'gramola', 'mesa-banquete', 'cama-dosel', 'farol-hierro', 'pergola-enredadera', 'estatua-baqueano', 'chimenea-salon'] },
  { id: 'E', nombre: 'negocio propio (almacén de campo, con clientes)', planos: ['local-almacen'] },
];

// ---------------------------------------------------------------- lo que corre en la página
const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, O = H.obras, T = H.T, J = H.jugador, P = H.progreso, R = H.renderer, gl = R.getContext(), jug = J.estado;
  const M = window.__M = {};
  const HORA = 14.5;
  H.ajustes.limiteFps = 'libre';
  const PLANOS = H.PLANOS;
  const TOPES = { 'pila-piedra': [30], 'deposito-piedra': [60, 100, 160], barraca: [40, 70, 110, 160], silo: [60, 120, 200], herramientero: [4, 6] };
  const GUARDA = { 'pila-piedra': ['piedra'], 'deposito-piedra': ['piedra'], barraca: ['tronco', 'tabla', 'piedra', 'lana'], silo: ['haba', 'papa', 'frutilla-huerta', 'calafate'], herramientero: ['hacha', 'pico', 'tijera', 'mosca', 'farol', 'botas'] };
  const rad = (pl) => Math.max(pl.radio || 1, 0.5 * Math.max(pl.ancho || 0, pl.fondo || 0) * 0.9);
  M.rad = rad;
  M.info = (id) => { const pl = PLANOS.find((p) => p.id === id); return pl ? { id, nombre: pl.nombre, radio: pl.radio, ancho: pl.ancho, fondo: pl.fondo, alto: pl.alto, rad: +rad(pl).toFixed(2), etapas: pl.etapas.length } : null; };
  // lejos de la vía (la trocha da toda la vuelta al valle) y de las paradas: ahí el tren pasa y las estaciones ya ocupan el llano
  const riel = Array.isArray(T.riel) ? T.riel : [], paradas = (H.tren && H.tren.paradas) || [];
  const dSeg = (px, pz, a, b) => { const dx = b.x - a.x, dz = b.z - a.z, l2 = dx * dx + dz * dz || 1; const u = Math.max(0, Math.min(1, ((px - a.x) * dx + (pz - a.z) * dz) / l2)); return Math.hypot(px - (a.x + dx * u), pz - (a.z + dz * u)); };
  M.distVia = (x, z) => { let m = 1e9; for (let i = 0; i < riel.length; i++) { const d = dSeg(x, z, riel[i], riel[(i + 1) % riel.length]); if (d < m) m = d; } return m; };
  M.distParada = (x, z) => paradas.reduce((m, p) => Math.min(m, Math.hypot(p.x - x, p.z - z)), 1e9);
  const libre = (x, z, rr = 4) => !T.agua(x, z) && !(typeof T.sinObras === 'function' && T.sinObras(x, z, rr)) && !(typeof T.reservaMolino === 'function' && T.reservaMolino(x, z, rr)) && M.distVia(x, z) > rr + 4 && M.distParada(x, z) > rr + 24;
  const llano = (x, z, R0, tol) => {
    const y0 = T.altura(x, z);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, qx = x + Math.cos(a) * R0, qz = z + Math.sin(a) * R0; if (T.agua(qx, qz) || Math.abs(T.altura(qx, qz) - y0) > tol) return false; }
    return true;
  };
  // el mejor lugar llano (y sin agua ni reservas) cerca del refugio
  M.centro = () => {
    const r0 = T.lugares.refugio; let mejor = null;
    const puntaje = (cx, cz) => {
      let n = 0;
      for (let dx = -42; dx <= 42; dx += 7) for (let dz = -42; dz <= 42; dz += 7) {
        if (dx * dx + dz * dz > 42 * 42) continue;
        const x = cx + dx, z = cz + dz;
        if (!libre(x, z, 6)) continue;
        if (Math.abs(T.altura(x + 2, z) - T.altura(x - 2, z)) > 0.2 || Math.abs(T.altura(x, z + 2) - T.altura(x, z - 2)) > 0.2) continue;
        n++;
      }
      return n;
    };
    for (let r = 32; r <= 170; r += 14) {
      const k = Math.max(1, Math.round(2 * Math.PI * r / 14));
      for (let i = 0; i < k; i++) {
        const a = (i / k) * Math.PI * 2 + r * 0.3, x = r0.x + Math.cos(a) * r, z = r0.z + Math.sin(a) * r;
        if (Math.abs(x) > 400 || Math.abs(z) > 400) continue;
        const pt = puntaje(x, z) - r * 0.02;
        if (!mejor || pt > mejor.pt) mejor = { x, z, pt, r };
      }
    }
    return mejor;
  };
  // los lugares de todos, a la vez: del mayor al menor, en espiral desde el centro, sin pisarse (con un metro y pico de aire)
  M.planificar = (items) => {
    const c = M.centro(); const puestas = [], res = new Array(items.length);
    const orden = items.map((it, i) => ({ ...it, i })).sort((a, b) => (M.info(b.id)?.rad || 0) - (M.info(a.id)?.rad || 0));
    for (const it of orden) {
      const pl = PLANOS.find((p) => p.id === it.id);
      if (!pl) { res[it.i] = { ...it, ok: false, motivo: 'el plano no existe' }; continue; }
      const rr = rad(pl); let hallado = null, ultimo = 'sin lugar llano en 90 m';
      for (let r = 0; r <= 90 && !hallado; r += 3) {
        const k = r === 0 ? 1 : Math.max(6, Math.round(2 * Math.PI * r / 3));
        for (let j = 0; j < k; j++) {
          const a = (j / k) * Math.PI * 2 + r * 0.41, x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
          if (puestas.some((q) => Math.hypot(q.x - x, q.z - z) < q.rad + rr + 1.2)) continue;
          if (!libre(x, z, rr) || !llano(x, z, Math.min(rr, 6), 0.3)) continue;
          const rv = O.revisarSitio(x, z, pl, 0);
          if (!rv.ok) { ultimo = rv.motivo || 'revisarSitio no la acepta'; continue; }
          hallado = { x, z }; break;
        }
      }
      if (hallado) { puestas.push({ x: hallado.x, z: hallado.z, rad: rr }); res[it.i] = { ...it, ok: true, x: hallado.x, z: hallado.z, rad: rr }; }
      else res[it.i] = { ...it, ok: false, motivo: ultimo };
    }
    return { centro: c, items: res };
  };
  // geometría de la escena: el conjunto, la vista de afuera, el lugar libre del medio y la ruta del paseo
  M.geometria = (colocadas) => {
    const n = colocadas.length;
    const cx = colocadas.reduce((s, q) => s + q.x, 0) / n, cz = colocadas.reduce((s, q) => s + q.z, 0) / n;
    const ext = Math.max(...colocadas.map((q) => Math.hypot(q.x - cx, q.z - cz) + q.rad));
    const yaw = (px, pz, tx, tz) => Math.atan2(-(tx - px), -(tz - pz));
    const parado = (px, pz) => ({ x: px, z: pz });
    // afuera: el primer rumbo (de a 45 grados) con tierra firme a esa distancia
    let afuera = null;
    for (const d of [ext * 1.15 + 14, ext * 1.0 + 10, ext * 0.8 + 8]) {
      for (let k = 0; k < 8 && !afuera; k++) {
        const a = k / 8 * Math.PI * 2 + 0.7, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
        if (!libre(x, z, 2) || Math.abs(T.altura(x, z) - T.altura(cx, cz)) > 6) continue;
        afuera = { x, z, a, d };
      }
      if (afuera) break;
    }
    if (!afuera) afuera = { x: cx + ext + 14, z: cz, a: 0, d: ext + 14 };
    // el lugar libre más despejado del medio (la plaza del conjunto)
    let medio = null;
    for (let dx = -ext * 0.7; dx <= ext * 0.7; dx += 2) for (let dz = -ext * 0.7; dz <= ext * 0.7; dz += 2) {
      const x = cx + dx, z = cz + dz;
      if (!libre(x, z, 2)) continue;
      const m = Math.min(...colocadas.map((q) => Math.hypot(q.x - x, q.z - z) - q.rad));
      if (m < 2 || Math.hypot(dx, dz) > ext * 0.7) continue;
      const sc = m - Math.hypot(dx, dz) * 0.15;
      if (!medio || sc > medio.sc) medio = { x, z, m, sc };
    }
    if (!medio) medio = { x: cx, z: cz, m: 0, sc: 0 };
    // hacia dónde mirar desde el medio: el rumbo con más obras en un cono de 70 grados
    let mira = null;
    for (let g = 0; g < 360; g += 15) {
      const a = g * Math.PI / 180, fx = -Math.sin(a), fz = -Math.cos(a);
      let sc = 0;
      for (const q of colocadas) { const dx = q.x - medio.x, dz = q.z - medio.z, d = Math.hypot(dx, dz); if (d < 1 || d > 55) continue; const c = (dx * fx + dz * fz) / d; if (c > Math.cos(35 * Math.PI / 180)) sc += 1 + q.rad * 0.3; }
      if (!mira || sc > mira.sc) mira = { a, sc };
    }
    const v = (p, t) => ({ x: p.x, z: p.z, yaw: yaw(p.x, p.z, t.x, t.z), pitch: -0.07 });
    const vConj = v(afuera, { x: cx, z: cz });
    const vMedio = { x: medio.x, z: medio.z, yaw: mira.a, pitch: -0.05 };
    // paseo: desde afuera, por el medio, hasta el otro lado (el otro lado se acorta si cae en el agua)
    let f = 0.9, fin = { x: cx - (afuera.x - cx) * f, z: cz - (afuera.z - cz) * f };
    while (!libre(fin.x, fin.z, 2) && f > 0.2) { f -= 0.1; fin = { x: cx - (afuera.x - cx) * f, z: cz - (afuera.z - cz) * f }; }
    const ruta = [{ x: cx + (afuera.x - cx) * 0.9, z: cz + (afuera.z - cz) * 0.9 }, { x: medio.x, z: medio.z }, fin];
    return { centro: { x: cx, z: cz }, extension: ext, conjunto: vConj, medio: vMedio, ruta, afuera, medioLibre: +medio.m.toFixed(1) };
  };
  // dejar una obra terminada y sin cobrar
  M.levantar = (id, x, z) => {
    const pl = PLANOS.find((p) => p.id === id);
    if (!pl) return { ok: false, motivo: 'el plano no existe' };
    if (P.economia) P.economia.pesos = 1e9;
    O.elegir(pl);
    const f = O.fundar(x, z, 0, T.altura(x, z));
    if (!f.ok) return { ok: false, motivo: 'no funda: ' + (f.motivo || '?') };
    const ob = f.obra, m = { tronco: 99999, tabla: 99999, piedra: 99999, lana: 99999, cristal: 9999 };
    let g = 0;
    while (ob.datos.etapas < pl.etapas.length && g++ < 200) { const r = O.avanzar(ob, m); if (!r.ok) return { ok: false, motivo: 'no avanza: ' + (r.motivo || '?') + ' (etapa ' + ob.datos.etapas + ' de ' + pl.etapas.length + ')' }; }
    // los depósitos, en su nivel máximo y llenos
    if (TOPES[id]) {
      const t = TOPES[id], n = t.length - 1, tope = t[n], ks = GUARDA[id], gg = {};
      if (id === 'silo') ks.forEach((k, i) => { gg[k] = Math.floor(tope / ks.length) + (i === 0 ? tope % ks.length : 0); });
      else if (id === 'herramientero') ks.slice(0, tope).forEach((k) => { gg[k] = 1; });
      else ks.forEach((k) => { gg[k] = tope; });
      ob.datos.almacen = { n, g: gg };
      O.rehacer(ob);
    }
    P.obras = O.obras.map((o) => o.datos);
    return { ok: true, datos: { x: ob.datos.x, y: ob.datos.y, z: ob.datos.z } };
  };
  M.obra = (id) => O.obras.find((q) => q.plano.id === id);
  // el negocio: abierto, surtido, y tres clientes en camino al mostrador
  M.negocio = () => {
    const N = H.__negocio && H.__negocio(); if (!N) return 'no hay negocio';
    const E = N.__estado(); if (!E) return 'sin estado (¿Relax con economía?)';
    E.tipo = 'almacen'; E.abierto = true;
    E.stock = { huevo: 36, harina: 18, papa: 18, 'pan-casero': 18, miel: 12, 'frasco-frutilla': 12, 'calafate-seco': 12, 'hongos-secos': 12, 'trucha-ahumada': 12, poncho: 6, lana: 18, tronco: 12, tabla: 24, piedra: 24 };
    for (let i = 0; i < 6; i++) H.__bucle();
    N.__armarTodo();
    return 'ok';
  };
  M.clientes = () => {
    const N = H.__negocio && H.__negocio(); if (!N || !N.__cola) return -1;
    let hay = N.__cola.clientes.length;
    for (let s = 1; hay < 3 && s < 9; s++) { if (N.__llegar(s + Math.floor(performance.now()) % 50, 14)) hay = N.__cola.clientes.length; }
    return hay;
  };
  M.clientesEnMostrador = () => { const N = H.__negocio && H.__negocio(); return N && N.__cola ? N.__cola.clientes.map((c) => !!c.listo) : []; };
  // lo que pesa cada obra: triángulos y mallas (dibujos sin sombra) de lo que cuelga de su grupo
  M.pesoDe = (ob) => {
    let tri = 0, mallas = 0, dib = 0, luces = 0;
    ob.grupo.traverse((o) => {
      if (o.isLight) luces++;
      if (!o.isMesh && !o.isLine && !o.isPoints) return;
      if (o.visible === false) return;
      const g = o.geometry; if (!g) return;
      const n = g.index ? g.index.count / 3 : (g.attributes.position ? g.attributes.position.count / 3 : 0);
      tri += n * (o.isInstancedMesh ? (o.count ?? 1) : 1); mallas++;
      dib += Array.isArray(o.material) ? Math.max(1, g.groups.length) : 1;
    });
    return { tri: Math.round(tri), mallas, dibujos: dib, luces };
  };
  // sanidad: dos obras que se pisan en planta y altura; una que flota o se hunde respecto del suelo
  M.sanidad = () => {
    const out = { pisadas: [], flotan: [], hundidas: [], sobreVia: [] };
    for (let i = 0; i < O.obras.length; i++) for (let j = i + 1; j < O.obras.length; j++) {
      const a = O.obras[i].datos, b = O.obras[j].datos, pa = O.obras[i].plano, pb = O.obras[j].plano;
      const d = Math.hypot(a.x - b.x, a.z - b.z), s = rad(pa) + rad(pb);
      if (d < s * 0.55) out.pisadas.push({ a: pa.id, b: pb.id, d: +d.toFixed(1), rads: +s.toFixed(1) });
    }
    for (const ob of O.obras) {
      const dv = M.distVia(ob.datos.x, ob.datos.z), dp = M.distParada(ob.datos.x, ob.datos.z);
      if (dv < rad(ob.plano) + 1 || dp < rad(ob.plano) + 14) out.sobreVia.push({ id: ob.plano.id, viaA: +dv.toFixed(1), paradaA: +dp.toFixed(1), rad: +rad(ob.plano).toFixed(1) });
      const d = ob.datos, h = T.altura(d.x, d.z), r = Math.min(rad(ob.plano), 6);
      let mx = h, mn = h;
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, y = T.altura(d.x + Math.cos(a) * r, d.z + Math.sin(a) * r); mx = Math.max(mx, y); mn = Math.min(mn, y); }
      if (d.y - mx > 0.45 + (ob.plano.elevacion || 0)) out.flotan.push({ id: ob.plano.id, y: +d.y.toFixed(2), suelo: +h.toFixed(2), maxSuelo: +mx.toFixed(2), sobre: +(d.y - mx).toFixed(2) });
      if (d.y < mn - 0.25) out.hundidas.push({ id: ob.plano.id, y: +d.y.toFixed(2), suelo: +h.toFixed(2), minSuelo: +mn.toFixed(2) });
    }
    return out;
  };
  // ---- medir
  M.poner = (v) => { H.volverAlJuego && H.volverAlJuego(); jug.pos.set(v.x, T.altura(v.x, v.z) + 1.65, v.z); jug.yaw = v.yaw; jug.pitch = v.pitch; jug.vel && jug.vel.set && jug.vel.set(0, 0, 0); P.horas = HORA; return 1; };
  M.frames = (v, n, aTope) => {
    for (let i = 0; i < n; i++) { P.horas = HORA; jug.pos.x = v.x; jug.pos.z = v.z; jug.yaw = v.yaw; jug.pitch = v.pitch; if (aTope && i % 40 === 0) M.clientes(); H.__bucle(); }
    return 1;
  };
  const estadistica = (ms, extra) => {
    const o = ms.slice().sort((a, b) => a - b), q = (f) => +o[Math.min(o.length - 1, Math.floor(o.length * f))].toFixed(2);
    return { p50: q(0.5), p95: q(0.95), p99: q(0.99), max: +o[o.length - 1].toFixed(2), medio: +(ms.reduce((s, x) => s + x, 0) / ms.length).toFixed(2), sobre16_7: +(100 * ms.filter((x) => x > 16.7).length / ms.length).toFixed(1), ...extra };
  };
  M.medir = (v, n, conClientes) => {
    const ms = []; let llamadas = 0, triangulos = 0, mostrador = [];
    for (let i = 0; i < n; i++) {
      P.horas = HORA; jug.pos.x = v.x; jug.pos.z = v.z; jug.yaw = v.yaw; jug.pitch = v.pitch;
      if (conClientes && i % 40 === 0) M.clientes();
      const ultimo = i === n - 1; let reset = null;
      if (ultimo) { R.info.autoReset = false; R.info.reset(); reset = R.info.reset; R.info.reset = () => {}; }
      const t0 = performance.now();
      H.__bucle(); gl.finish();
      ms.push(performance.now() - t0);
      if (ultimo) { llamadas = R.info.render.calls; triangulos = R.info.render.triangles; R.info.reset = reset; R.info.autoReset = true; }
    }
    if (conClientes) mostrador = M.clientesEnMostrador();
    return estadistica(ms, { llamadas, triangulos, heapMB: +(performance.memory.usedJSHeapSize / 1048576).toFixed(1), geometrias: R.info.memory.geometries, texturas: R.info.memory.textures, clientes: mostrador });
  };
  // caminando: el jugador avanza 0,225 m por cuadro (4,5 m/s a 0,05 s) por la ruta, de ida y vuelta, con jugador.actualizar(0.05) + __bucle
  M.caminar = (ruta, n, conClientes) => {
    const tramos = []; let L = 0;
    for (let i = 0; i + 1 < ruta.length; i++) { const d = Math.hypot(ruta[i + 1].x - ruta[i].x, ruta[i + 1].z - ruta[i].z); tramos.push({ a: ruta[i], b: ruta[i + 1], d, ini: L }); L += d; }
    const en = (s) => { s = ((s % (2 * L)) + 2 * L) % (2 * L); const ida = s <= L; const t = ida ? s : 2 * L - s; const tr = tramos.find((q) => t <= q.ini + q.d) || tramos.at(-1); const u = Math.min(1, Math.max(0, (t - tr.ini) / tr.d)); const dx = tr.b.x - tr.a.x, dz = tr.b.z - tr.a.z; const sg = ida ? 1 : -1; return { x: tr.a.x + dx * u, z: tr.a.z + dz * u, yaw: Math.atan2(-dx * sg, -dz * sg) }; };
    const p0 = en(0); M.poner({ x: p0.x, z: p0.z, yaw: p0.yaw, pitch: -0.05 });
    const paso = (i) => { const p = en(i * 0.225); P.horas = HORA; jug.pos.x = p.x; jug.pos.z = p.z; jug.yaw = p.yaw; jug.pitch = -0.05; };
    for (let i = 0; i < 120; i++) { paso(i * 0); J.actualizar(0.05); H.__bucle(); }   // (asentar en el punto de partida)
    const ms = []; let llamadas = 0, triangulos = 0;
    for (let i = 0; i < n; i++) {
      paso(i);
      if (conClientes && i % 40 === 0) M.clientes();
      const ultimo = i === n - 1; let reset = null;
      if (ultimo) { R.info.autoReset = false; R.info.reset(); reset = R.info.reset; R.info.reset = () => {}; }
      const t0 = performance.now();
      J.actualizar(0.05); H.__bucle(); gl.finish();
      ms.push(performance.now() - t0);
      if (ultimo) { llamadas = R.info.render.calls; triangulos = R.info.render.triangles; R.info.reset = reset; R.info.autoReset = true; }
    }
    return estadistica(ms, { llamadas, triangulos, largoRuta: +L.toFixed(1), recorrido: +(n * 0.225).toFixed(1) });
  };
  M.camaraFija = (x, y, z, tx, ty, tz) => {
    const dx = tx - x, dz = tz - z, dy = ty - y, h = Math.hypot(dx, dz);
    H.__camaraFija = { x, y, z, pitch: Math.atan2(dy, h), yaw: Math.atan2(-dx, -dz) };
    for (let i = 0; i < 4; i++) H.__bucle();
    return 1;
  };
  M.sinCamara = () => { delete H.__camaraFija; return 1; };
  M.altura = (x, z) => T.altura(x, z);
  return 1;
})()`;

// ---------------------------------------------------------------- la corrida
app.whenReady().then(async () => {
  const r = { corrida: CORRIDA, fecha: new Date().toISOString(), html: HTML, calidad: CALIDAD, cuadros: CUADROS, asiento: ASIENTO, caminar: CAMINAR, tamano: `${ANCHO}x${ALTO}`, errores: [], grupos: [], piezas: [] };
  const w = new BrowserWindow({ show: true, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) r.errores.push(m.slice(0, 300));
  });
  w.webContents.on('render-process-gone', (_e, d) => { r.errores.push('renderer caído ' + JSON.stringify(d)); });
  let donde = 'carga';
  const js = (c, lim = 300000) => Promise.race([w.webContents.executeJavaScript(c, true), esperar(lim).then(() => { throw new Error('sin respuesta en: ' + donde); })]);
  const M = (c) => js(`(()=>{ const M = window.__M, H = window.__hojarasca; return (${c}) })()`);
  const ajustes = JSON.stringify({ calidad: CALIDAD, clima: 'despejado', musica: false, modo: 'relax', relaxTipo: 'libre', autoCalidad: false, guiaPrimerDia: false, idioma: 'es', limiteFps: 'libre', modoFluido: false, estacion: 'verano' });
  w.webContents.on('dom-ready', () => {
    w.webContents.executeJavaScript(`(()=>{ const c = document.getElementById('carga'); if (!c) return 0;
      const ver = () => { if (c.classList.contains('oculto') && !window.__tListo) window.__tListo = performance.now(); };
      new MutationObserver(ver).observe(c, { attributes: true, attributeFilter: ['class'] }); ver(); return 1 })()`).catch(() => {});
  });
  w.webContents.on('did-finish-load', () => w.webContents.insertCSS('*, *::before, *::after { transition: none !important; } #pista-clic { display: none !important; }').catch(() => {}));
  const cargar = async () => {
    await w.loadFile(HTML, { search: '?debug=1' });
    for (let i = 0; i < 1200; i++) { await esperar(250); if (await js('!!window.__tListo && !!window.__hojarasca', 5000).catch(() => false)) break; }
  };
  const foto = async (nombre) => {
    if (!FOTOS) return;
    await js(`(()=>{ for (let i = 0; i < 3; i++) window.__hojarasca.__bucle(); return 1 })()`); await esperar(500);
    w.webContents.invalidate();
    await js(`Promise.race([new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(()=>r('ok')))), new Promise((r)=>setTimeout(()=>r('sin cuadros'),1500))])`);
    const img = await w.webContents.capturePage({ x: 0, y: 0, width: ANCHO, height: ALTO });
    const s = img.getSize();
    fs.writeFileSync(path.join(SALIDA, `${nombre}.png`), (s.width === ANCHO && s.height === ALTO ? img : img.resize({ width: ANCHO, height: ALTO, quality: 'best' })).toPNG());
    console.log(`  captura ${nombre}.png (${s.width}x${s.height})`);
  };
  const dato = (m) => `p50 ${m.p50} p95 ${m.p95} ms · ${m.llamadas} dibujos · ${m.triangulos} triángulos`;
  const medirVistas = async (etiqueta, geo, conClientes) => {
    const out = {};
    for (const [nombre, v] of [['conjunto', geo.conjunto], ['centro', geo.medio]]) {
      donde = `${etiqueta} / ${nombre}`;
      await M(`(M.poner(${JSON.stringify(v)}), M.frames(${JSON.stringify(v)}, ${ASIENTO}, ${!!conClientes}), 1)`);
      await esperar(1500);
      out[nombre] = await M(`M.medir(${JSON.stringify(v)}, ${CUADROS}, ${!!conClientes})`);
      console.log(`${etiqueta.padEnd(14)} ${nombre.padEnd(9)} ${dato(out[nombre])}`);
    }
    donde = `${etiqueta} / caminando`;
    await esperar(500);
    out.caminando = await M(`M.caminar(${JSON.stringify(geo.ruta)}, ${CAMINAR}, ${!!conClientes})`);
    console.log(`${etiqueta.padEnd(14)} caminando ${dato(out.caminando)}`);
    return out;
  };

  try {
    // ---- 1. partida Relax nueva en calidad alta
    await w.loadFile(HTML, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', ${JSON.stringify(ajustes)}); 1`);
    await cargar();     // (la primera carga arma la caché; esta es la segunda, como cuando el jugador vuelve a abrir el juego)
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    r.cargaOk = await js(`!!(window.__hojarasca && window.__hojarasca.jugador && window.__hojarasca.obras && window.__hojarasca.progreso.economia)`);
    if (!r.cargaOk) throw new Error('no cargó el Relax con economía');
    // (la aldea arma de a un bloque por cuadro después de la carga: se cuentan los cuadros a mano hasta que esté)
    r.aldea = await js(`(async()=>{ const H = window.__hojarasca, A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return null; let c = 0;
      for (let i = 0; i < 100 && A.medir().fabrica.pendientes > 0; i++) await new Promise((ok) => setTimeout(ok, 100));
      while (c < 3000 && (A.medir().cola > 0 || A.medir().listas < A.medir().manzanas)) { H.__bucle(); c++; }
      return { cuadros: c } })()`);
    await js(PAGINA);
    r.ajustesVivos = await js(`({ calidad: window.__hojarasca.ajustes.calidad, limiteFps: window.__hojarasca.ajustes.limiteFps, modo: window.__hojarasca.progreso.modo })`);
    donde = 'planificar';

    // ---- 2. los lugares de todo
    const items = []; for (const g of GRUPOS) for (const id of g.planos) items.push({ id, grupo: g.id });
    const plan = await M(`M.planificar(${JSON.stringify(items)})`);
    r.centroZona = { x: +plan.centro.x.toFixed(1), z: +plan.centro.z.toFixed(1), refugio_a: +plan.centro.r.toFixed(0) };
    const colocadas = plan.items.filter((q) => q.ok);
    for (const q of plan.items.filter((q) => !q.ok)) console.log(`  (no se encontró lugar para ${q.id}: ${q.motivo})`);
    const geo = await M(`M.geometria(${JSON.stringify(colocadas.map((q) => ({ x: q.x, z: q.z, rad: q.rad })))})`);
    r.geometria = { centro: geo.centro, extension: +geo.extension.toFixed(1), conjunto: geo.conjunto, medio: geo.medio, ruta: geo.ruta, medioLibre: geo.medioLibre };
    console.log(`zona llana en (${r.centroZona.x}, ${r.centroZona.z}) a ${r.centroZona.refugio_a} m del refugio; conjunto de ${r.geometria.extension} m de radio; ${colocadas.length} de ${items.length} con lugar`);

    // ---- 3. la vista de referencia, sin obras
    await M(`(H.progreso.horas = 14.5, 1)`);
    const base = await medirVistas('referencia', geo, false);
    r.grupos.push({ id: '0', nombre: 'referencia, sin obras', obras: 0, ...base });
    r.referenciaObras = await M('H.obras.obras.length');

    // ---- 4. los grupos, uno detrás de otro, acumulando
    let acumuladas = 0;
    for (const g of GRUPOS) {
      donde = 'construir ' + g.id;
      const mios = plan.items.filter((q) => q.grupo === g.id);
      const hechas = [];
      for (const q of mios) {
        if (!q.ok) { r.piezas.push({ id: q.id, grupo: g.id, colocada: false, motivo: 'no colocada: ' + q.motivo }); continue; }
        const l = await M(`M.levantar(${JSON.stringify(q.id)}, ${q.x}, ${q.z})`);
        if (!l.ok) { r.piezas.push({ id: q.id, grupo: g.id, colocada: false, motivo: 'no colocada: ' + l.motivo, x: +q.x.toFixed(1), z: +q.z.toFixed(1) }); console.log(`  (no se pudo levantar ${q.id}: ${l.motivo})`); continue; }
        const peso = await M(`M.pesoDe(M.obra(${JSON.stringify(q.id)}))`);
        const info = await M(`M.info(${JSON.stringify(q.id)})`);
        r.piezas.push({ id: q.id, nombre: info.nombre, grupo: g.id, colocada: true, x: +q.x.toFixed(1), z: +q.z.toFixed(1), y: +l.datos.y.toFixed(2), rad: info.rad, ...peso });
        hechas.push(q.id); acumuladas++;
      }
      let conClientes = false;
      if (g.id === 'E' && hechas.length) {
        const neg = await M('M.negocio()');
        conClientes = neg === 'ok';
        r.negocio = neg;
        if (conClientes) { r.negocioClientes = await M('M.clientes()'); const p = r.piezas.find((x) => x.id === 'local-almacen'); p.peso_con_stock = await M(`M.pesoDe(M.obra('local-almacen'))`); }
      }
      await M('(M.sinCamara(), 1)');
      await esperar(800);
      const m = await medirVistas(`+ grupo ${g.id}`, geo, conClientes);
      const ent = await M('H.obras.obras.length');
      r.grupos.push({ id: g.id, nombre: g.nombre, acumuladoObras: ent, construidas: hechas.length, previstas: g.planos.length, conClientes, ...m });
      if (conClientes) r.grupos.at(-1).clientesEnMostrador = await M('M.clientesEnMostrador()');
    }

    // ---- 5. sanidad y capturas del conjunto construido
    donde = 'sanidad';
    r.sanidad = await M('M.sanidad()');
    r.sanidad.obras = await M('H.obras.obras.length');
    console.log(`sanidad: ${r.sanidad.pisadas.length} pares que se pisan, ${r.sanidad.flotan.length} flotando, ${r.sanidad.hundidas.length} hundidas, ${r.sanidad.sobreVia.length} sobre la vía o una parada`);
    if (FOTOS) {
      donde = 'capturas';
      const c = geo.centro, e = geo.extension, A = geo.afuera;
      const cy = await M(`M.altura(${c.x}, ${c.z})`);
      const aereas = [['01-conjunto-aerea-A', 0], ['02-conjunto-aerea-B', Math.PI * 0.75]];
      for (const [nombre, giro] of aereas) {
        const a = A.a + giro, d = e * 1.25 + 10, x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d;
        await M(`(M.sinCamara(), M.poner({ x: ${c.x}, z: ${c.z}, yaw: 0, pitch: 0 }), M.camaraFija(${x}, ${cy + e * 0.75 + 8}, ${z}, ${c.x}, ${cy}, ${c.z}), 1)`);
        await esperar(1200); await foto(nombre);
      }
      // desde arriba (cenital): para ver si algo se pisa
      await M(`(M.sinCamara(), M.poner({ x: ${c.x}, z: ${c.z}, yaw: 0, pitch: 0 }), M.camaraFija(${c.x + 0.01}, ${cy + e * 1.9 + 10}, ${c.z + 0.01}, ${c.x}, ${cy}, ${c.z}), 1)`);
      await esperar(1200); await foto('07-conjunto-cenital');
      const md = geo.medio;
      await M(`(M.poner({ x: ${md.x}, z: ${md.z}, yaw: ${md.yaw}, pitch: 0 }), M.camaraFija(${md.x}, ${await M(`M.altura(${md.x}, ${md.z})`) + 1.7}, ${md.z}, ${md.x - Math.sin(md.yaw) * 20}, ${cy + 1.2}, ${md.z - Math.cos(md.yaw) * 20}), 1)`);
      await esperar(1200); await foto('03-desde-el-medio-a-pie');
      // las casas de cerca (grupo C) y los oficios de cerca (grupo A)
      for (const [nombre, gid] of [['04-casas-de-cerca', 'C'], ['05-oficios-de-cerca', 'A'], ['06-lujo-de-cerca', 'D']]) {
        const ps = r.piezas.filter((p) => p.grupo === gid && p.colocada); if (!ps.length) continue;
        const px = ps.reduce((s, p) => s + p.x, 0) / ps.length, pz = ps.reduce((s, p) => s + p.z, 0) / ps.length;
        const py = await M(`M.altura(${px}, ${pz})`);
        let dx = px - c.x, dz = pz - c.z; if (Math.hypot(dx, dz) < 8) { dx = Math.cos(A.a); dz = Math.sin(A.a); }   // (desde afuera del conjunto, a 34 m)
        const dl = Math.hypot(dx, dz), sx = px + (dx / dl) * 34, sz = pz + (dz / dl) * 34;
        await M(`(M.poner({ x: ${c.x}, z: ${c.z}, yaw: 0, pitch: 0 }), M.camaraFija(${sx}, ${py + 14}, ${sz}, ${px}, ${py + 1}, ${pz}), 1)`);
        await esperar(1200); await foto(nombre);
      }
      await M('(M.sinCamara(), 1)');
    }
  } catch (e) { r.errores.push('excepcion: ' + (e && e.message ? e.message : e) + ' (en ' + donde + ')'); console.log('ERROR ' + (e && e.message ? e.message : e)); }

  fs.writeFileSync(path.join(SALIDA, `obras-corrida${CORRIDA}.json`), JSON.stringify(r, null, 2));
  try { resumir(); } catch (e) { console.log('no se pudo armar el resumen: ' + e.message); }
  console.log(`corrida ${CORRIDA} guardada en ${SALIDA} · errores ${r.errores.length}`);
  app.exit(0);
});

// ---------------------------------------------------------------- obras.json y obras.md (juntando todas las corridas de la carpeta)
function resumir() {
  const corridas = fs.readdirSync(SALIDA).filter((f) => /^obras-corrida\d+\.json$/.test(f)).sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]))
    .map((f) => JSON.parse(fs.readFileSync(path.join(SALIDA, f), 'utf8'))).filter((c) => c.grupos && c.grupos.length);
  fs.writeFileSync(path.join(SALIDA, 'obras.json'), JSON.stringify({ corridas }, null, 2));
  const f1 = (x) => (x === undefined || x === null || Number.isNaN(x) ? '-' : (Math.round(x * 100) / 100).toString().replace('.', ','));
  const mas = (x, ref, dec = 2) => { if (x === undefined || ref === undefined) return '-'; const d = x - ref; const s = d.toFixed(dec).replace('.', ','); return (d >= 0 ? '+' : '') + s; };
  const L = [];
  L.push('# Costo de construir todo lo de la 4.2/4.3 (herramientas/medir-obras-43.cjs)', '');
  const c0 = corridas[0];
  if (!c0) { fs.writeFileSync(path.join(SALIDA, 'obras.md'), 'sin corridas\n'); return; }
  L.push(`Calidad ${c0.calidad}, hora fija 14:30, ${c0.tamano}, límite de cuadros libre, ${c0.cuadros} cuadros medidos tras ${c0.asiento} de asiento (a mano, con gl.finish). Corridas: ${corridas.length}.`, '');
  for (const vista of ['conjunto', 'centro', 'caminando']) {
    L.push(`## Vista «${vista}»${vista === 'caminando' ? ' (paso a paso entre las obras)' : ''}`, '');
    L.push('| Grupo (acumulado) | obras | p50 ms | p95 ms | dibujos | triángulos | Δp50 | Δp95 | Δdibujos | Δtriángulos | >16,7 ms |');
    L.push('|---|---|---|---|---|---|---|---|---|---|---|');
    const prom = (id, campo) => { const v = corridas.map((c) => c.grupos.find((g) => g.id === id)?.[vista]?.[campo]).filter((x) => Number.isFinite(x)); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : undefined; };
    const ids = c0.grupos.map((g) => g.id);
    for (const id of ids) {
      const g = c0.grupos.find((q) => q.id === id);
      const p50 = prom(id, 'p50'), p95 = prom(id, 'p95'), dib = prom(id, 'llamadas'), tri = prom(id, 'triangulos'), sob = prom(id, 'sobre16_7');
      const r50 = prom('0', 'p50'), r95 = prom('0', 'p95'), rd = prom('0', 'llamadas'), rt = prom('0', 'triangulos');
      L.push(`| ${id === '0' ? 'referencia (sin obras)' : id + ' · ' + g.nombre} | ${g.acumuladoObras ?? 0} | ${f1(p50)} | ${f1(p95)} | ${Math.round(dib)} | ${Math.round(tri)} | ${id === '0' ? '' : mas(p50, r50)} | ${id === '0' ? '' : mas(p95, r95)} | ${id === '0' ? '' : mas(dib, rd, 0)} | ${id === '0' ? '' : mas(tri, rt, 0)} | ${f1(sob)} % |`);
    }
    L.push('');
  }
  if (corridas.length > 1) {
    L.push('## Ruido entre corridas (p50 / p95 de cada corrida, vista «conjunto»)', '');
    L.push('| Grupo | ' + corridas.map((c) => `corrida ${c.corrida} p50 / p95`).join(' | ') + ' | variación p50 | variación p95 |');
    L.push('|---|' + corridas.map(() => '---|').join('') + '---|---|');
    for (const g of c0.grupos) {
      const v50 = corridas.map((c) => c.grupos.find((q) => q.id === g.id)?.conjunto?.p50), v95 = corridas.map((c) => c.grupos.find((q) => q.id === g.id)?.conjunto?.p95);
      const rango = (v) => { const a = v.filter(Number.isFinite); return a.length ? Math.max(...a) - Math.min(...a) : undefined; };
      L.push(`| ${g.id} | ` + corridas.map((c, i) => `${f1(v50[i])} / ${f1(v95[i])}`).join(' | ') + ` | ${f1(rango(v50))} ms | ${f1(rango(v95))} ms |`);
    }
    L.push('');
  }
  L.push('## Lo más caro, obra por obra (triángulos propios y mallas; los dibujos reales llevan además las sombras)', '');
  L.push('| Obra | grupo | triángulos | mallas | dibujos de la obra |', '|---|---|---|---|---|');
  const ps = (c0.piezas || []).filter((p) => p.colocada).sort((a, b) => b.tri - a.tri);
  for (const p of ps) L.push(`| ${p.id} | ${p.grupo} | ${p.tri} | ${p.mallas} | ${p.dibujos} |`);
  const no = (c0.piezas || []).filter((p) => !p.colocada);
  L.push('', `Total de triángulos de las obras: ${ps.reduce((s, p) => s + p.tri, 0)} en ${ps.length} obras y ${ps.reduce((s, p) => s + p.dibujos, 0)} dibujos.`, '');
  L.push('## No colocadas', '', no.length ? no.map((p) => `- ${p.id}: ${p.motivo}`).join('\n') : 'Ninguna: se colocaron todas.', '');
  if (c0.sanidad) L.push('## Sanidad (corrida 1)', '', `- obras que se pisan en planta: ${c0.sanidad.pisadas.length} ${c0.sanidad.pisadas.length ? JSON.stringify(c0.sanidad.pisadas) : ''}`, `- obras que flotan: ${c0.sanidad.flotan.length} ${c0.sanidad.flotan.length ? JSON.stringify(c0.sanidad.flotan) : ''}`, `- obras hundidas: ${c0.sanidad.hundidas.length} ${c0.sanidad.hundidas.length ? JSON.stringify(c0.sanidad.hundidas) : ''}`, `- obras sobre la vía o pegadas a una parada: ${(c0.sanidad.sobreVia || []).length} ${(c0.sanidad.sobreVia || []).length ? JSON.stringify(c0.sanidad.sobreVia) : ''}`, '');
  if (c0.errores && c0.errores.length) L.push('## Errores de la página', '', ...c0.errores.map((e) => '- ' + e), '');
  fs.writeFileSync(path.join(SALIDA, 'obras.md'), L.join('\n'));
  console.log('\n' + L.slice(0, 40).join('\n'));
}

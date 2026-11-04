// 4.25.1 (B): auditoría de TRASPASOS en las cinemáticas de la Historia (Electron + WebGL, el mundo real). Corre cada escena con el director real (como el barrido de la
// 4.18.4) y, por dentro, mira todo lo que el director le hace a la gente:
//   · cada lugar donde una escena PONE a alguien (aparecer, teletransportar —también el que hace el director al saltar la escena o al trabarse—) y cada meta de una caminata:
//     si cae adentro de un sólido (árbol, roca, pared, mueble, valla, tren…), en el agua, bajo el suelo o flotando;
//   · cada cuadro: los que están en escena adentro de un sólido, cruzando una pared de un cuadro al otro, bajo el suelo, sobre otro (a menos de 0,35 m), y el jugador adentro de un sólido;
//   · la cámara adentro de un sólido (como el barrido viejo).
// Dos formas de correr cada escena: «leer» (se la lee entera con Enter) y «saltar» (Esc dos veces apenas empieza: el director deja a cada uno en su lugar final de un golpe).
// Uso (después de `node armar.mjs`, con el candado de Electron): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script herramientas\auditoria-4-25-1-b-traspasos.cjs -Espera 2700 -Perfil <carpeta propia> -Visible
//   TRASP_MODO=leer,saltar · TRASP_PERFIL=trato,pelea · TRASP_DESDE/TRASP_HASTA (tramo de la lista) · TRASP_SOLO=id1,id2 · TRASP_SALIDA=<archivo json> · HTML=<otro index.html>
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const { DETERMINISTA } = require(path.join(raiz, 'pruebas', 'ayuda-determinista.cjs'));
if (process.env.HOJ_PERFIL) app.setPath('userData', path.resolve(process.env.HOJ_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la auditoría tardó más de 44 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 44 * 60 * 1000).unref?.();
const MODOS = (process.env.TRASP_MODO || 'leer,saltar').split(',').filter(Boolean);
const PERFILES = (process.env.TRASP_PERFIL || 'trato,pelea').split(',').filter(Boolean);
const DESDE = Number(process.env.TRASP_DESDE || 0), HASTA = Number(process.env.TRASP_HASTA || 1e9);
const SOLO = (process.env.TRASP_SOLO || '').split(',').filter(Boolean);
const SALIDA = process.env.TRASP_SALIDA || path.join(process.env.TEMP || raiz, 'traspasos-4-25-1-b.json');
const RECARGAR_CADA = Number(process.env.TRASP_RECARGA || 20);

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, T = H.T, P = H.progreso;
  const N = window.__N = {};
  const dir = () => H.__escenas.director;
  const mundo = H.__escenas.mundo;
  const frames = (n) => window.__cuadros(n, 50);
  N.ids = () => dir().ids();
  const r2 = (v) => Math.round(v * 100) / 100;
  // ¿hay algo sólido en (x, z)? devuelve cuánto lo empuja (m) y qué es; 0 = libre
  const sonda = { x: 0, y: 0, z: 0 };
  const solido = (x, z, y, radio = 0.2) => {
    sonda.x = x; sonda.z = z; sonda.y = y;
    try { H.col.resolver(sonda, radio, 1.65); } catch (e) { return 0; }
    return Math.hypot(sonda.x - x, sonda.z - z);
  };
  const quienEs = (x, z, y) => {
    const out = [];
    const cel = H.col.cercanos(x, z);
    for (const o of cel) {
      if (o.despejado || o.sinTocon) continue;
      if (o.alturaMax !== undefined && y > o.alturaMax + 0.01) continue;
      let cx = o.x, cz = o.z;
      if (o.seg) { const abx = o.bx - o.ax, abz = o.bz - o.az; const t = Math.max(0, Math.min(1, ((x - o.ax) * abx + (z - o.az) * abz) / (abx * abx + abz * abz || 1))); cx = o.ax + abx * t; cz = o.az + abz * t; }
      const d = Math.hypot(x - cx, z - cz);
      if (d < o.r + 0.2) out.push((o.duenio ? String(o.duenio).slice(0, 24) : (o.seg ? 'seg' : 'círculo')) + ' r' + r2(o.r) + ' a ' + r2(d) + ' m' + (o.alturaMin !== undefined ? ' desde' + r2(o.alturaMin) : '') + (o.alturaMax !== undefined ? ' hasta' + r2(o.alturaMax) : ''));
      if (out.length >= 3) break;
    }
    for (const o of H.col.dinamicos) { if (o.seg) { const abx = o.bx - o.ax, abz = o.bz - o.az; const t = Math.max(0, Math.min(1, ((x - o.ax) * abx + (z - o.az) * abz) / (abx * abx + abz * abz || 1))); if (Math.hypot(x - (o.ax + abx * t), z - (o.az + abz * t)) < o.r + 0.2) out.push('puerta ' + String(o.duenio || '').slice(0, 20)); } }
    return out.join('; ');
  };
  const pisoDe = (x, z, y) => {
    const suelo = T.altura(x, z);
    const p = H.col.plataformaEn ? H.col.plataformaEn(x, z, Math.max(y, suelo) + 0.6) : null;
    return p && p.alto > suelo - 0.1 && p.alto < suelo + 4 ? p.alto : suelo;
  };
  const actorDe = (clave) => { const l = H.gente && H.gente.gente; if (!l) return null; for (const n of l) if (n.clave === clave) return n; return null; };

  let aviso = null;   // dónde se anota (el resultado de la corrida en marcha)
  const nota = (tipo, quien, x, z, y, extra) => {
    if (!aviso) return;
    const clave = tipo + '|' + quien;
    const e = aviso.mapa.get(clave);
    if (e) { e.n++; e.hasta = aviso.f; if (e.n <= 1) e.ultimo = { x: r2(x), z: r2(z) }; return; }
    const reg = { tipo, quien, desde: aviso.f, hasta: aviso.f, n: 1, x: r2(x), z: r2(z), y: r2(y), ...extra };
    aviso.mapa.set(clave, reg); aviso.lista.push(reg);
  };
  // ¿cómo quedó alguien puesto en p? (después de aparecer o teletransportar)
  const revisarPuesto = (cual, clave, p) => {
    if (clave === 'jugador') return;
    const n = actorDe(clave); if (!n) return;
    const x = n.pos.x, z = n.pos.z, y = n.pos.y;
    const piso = pisoDe(x, z, y);
    const em = solido(x, z, y);
    if (em > 0.08) nota('puesto-en-sólido', clave, x, z, y, { como: cual, empuje: r2(em), con: quienEs(x, z, y), sentado: n.pose === 'sentado' });
    if (T.agua(x, z)) nota('puesto-en-agua', clave, x, z, y, { como: cual });
    if (y < piso - 0.3) nota('puesto-bajo-el-suelo', clave, x, z, y, { como: cual, dif: r2(y - piso) });
    else if (y > piso + 1.3) nota('puesto-flotando', clave, x, z, y, { como: cual, dif: r2(y - piso), pidioY: p && Number.isFinite(p.y) ? r2(p.y) : null });
  };
  if (!mundo.__envuelto) {
    mundo.__envuelto = true;
    for (const nombre of ['aparecer', 'teletransportar']) {
      const orig = mundo[nombre];
      mundo[nombre] = function (clave, p, mira) {
        const r = orig.call(this, clave, p, mira);
        try { if (aviso && p) { aviso.puestos++; const em0 = solido(p.x, p.z, Number.isFinite(p.y) ? p.y : T.altura(p.x, p.z)); if (em0 > 0.08) nota('meta-en-sólido', clave, p.x, p.z, Number.isFinite(p.y) ? p.y : 0, { como: nombre, empuje: r2(em0), con: quienEs(p.x, p.z, Number.isFinite(p.y) ? p.y : T.altura(p.x, p.z)) }); revisarPuesto(nombre, clave, p); } } catch (e) { /* la auditoría nunca frena */ }
        return r;
      };
    }
    const origC = mundo.caminar;
    mundo.caminar = function (clave, d, o) {
      const r = origC.call(this, clave, d, o);
      try {
        if (aviso && d) {
          const n = actorDe(clave);
          const y = n ? n.pos.y : 0;
          aviso.caminatas.push({ clave, d: { x: d.x, z: d.z }, f: aviso.f, de: n ? { x: n.pos.x, z: n.pos.z } : null });
          if (n) aviso.vivas.set(clave, { f0: aviso.f, L: Math.hypot(d.x - n.pos.x, d.z - n.pos.z), vel: (o && o.vel) || 1.4, d: { x: d.x, z: d.z } });
          const em = solido(d.x, d.z, y);
          if (em > 0.08) nota('meta-en-sólido', clave, d.x, d.z, y, { como: 'caminar', empuje: r2(em), con: quienEs(d.x, d.z, y) });
          if (T.agua(d.x, d.z)) nota('meta-en-agua', clave, d.x, d.z, y, { como: 'caminar' });
          // la recta de la caminata: ¿cuántos puntos de la ruta caen adentro de un sólido o cruzan una pared? (el NPC se desliza por el costado: no se traspasa, pero no llega recto)
          if (n) {
            let cruza = 0, bloq = 0; const L = Math.hypot(d.x - n.pos.x, d.z - n.pos.z);
            let px = n.pos.x, pz = n.pos.z;
            for (let s = 0.25; s <= L; s += 0.25) { const u = s / L, qx = n.pos.x + (d.x - n.pos.x) * u, qz = n.pos.z + (d.z - n.pos.z) * u; if (solido(qx, qz, y) > 0.08) bloq++; if (H.col.paredEntre(px, pz, qx, qz, y, y + 1.2, true)) cruza++; px = qx; pz = qz; }
            if (cruza || bloq > 1) nota('ruta-recta-bloqueada', clave, n.pos.x, n.pos.z, y, { haciaX: r2(d.x), haciaZ: r2(d.z), largo: r2(L), cruzaParedes: cruza, puntosEnSolido: bloq });
          }
        }
      } catch (e) { /* idem */ }
      return r;
    };
  }

  const bola = { x: 0, y: 0, z: 0 };
  // lo que se mira en cada cuadro
  const mirarCuadro = (f) => {
    const cl = H.__escenas.capturados();
    const js = H.jugador.estado;
    const prev = aviso.prev;
    const ahora = {};
    for (const c of cl) {
      const n = actorDe(c); if (!n || !n.g || n.g.visible === false) continue;
      const x = n.pos.x, z = n.pos.z, y = n.pos.y;
      ahora[c] = { x, z, y };
      if (![x, y, z].every(Number.isFinite)) { nota('no-finito', c, 0, 0, 0, {}); continue; }
      const em = solido(x, z, y);
      if (em > 0.08) nota('adentro-de-sólido', c, x, z, y, { empuje: r2(em), con: quienEs(x, z, y), pose: n.pose || null, sentado: n.pose === 'sentado' });
      if (T.agua(x, z)) nota('en-el-agua', c, x, z, y, {});
      const piso = pisoDe(x, z, y);
      if (y < piso - 0.15) nota('bajo-el-suelo', c, x, z, y, { dif: r2(y - piso) });
      else if (y > piso + 0.5 && !(n.pose === 'sentado')) nota('flotando', c, x, z, y, { dif: r2(y - piso) });
      if (n.pose === 'sentado' && solido(x, z, y, 0.38) > 0.12) nota('sentado-apretado', c, x, z, y, { con: quienEs(x, z, y) });
      if (prev && prev[c]) {
        const q = prev[c];
        const paso = Math.hypot(x - q.x, z - q.z);
        if (paso > 0.002 && paso < 1.2 && H.col.paredEntre(q.x, q.z, x, z, y, y + 1.2, true)) nota('cruzó-pared', c, x, z, y, { desdeX: r2(q.x), desdeZ: r2(q.z) });
      }
      // sobre otro
      for (const c2 of cl) { if (c2 <= c) continue; const m = actorDe(c2); if (!m || !m.g || m.g.visible === false) continue; if (Math.hypot(m.pos.x - x, m.pos.z - z) < 0.35 && Math.abs(m.pos.y - y) < 1) nota('uno-sobre-otro', c + '+' + c2, x, z, y, {}); }
      if (Math.hypot(js.pos.x - x, js.pos.z - z) < 0.4 && Math.abs(js.pos.y - y) < 1) nota('sobre-el-jugador', c, x, z, y, {});
    }
    // las caminatas que terminaron: ¿tardaron mucho más que en línea recta? (se frenan contra un borde y las planta el director al pasarse del límite)
    for (const [c, w] of [...aviso.vivas]) { if (!mundo.ocupado(c)) { aviso.vivas.delete(c); const t = (f - w.f0) * 0.05, esp = w.L / w.vel; if (t > esp * 1.6 + 3) nota('caminata-lenta', c, w.d.x, w.d.z, 0, { seg: r2(t), esperado: r2(esp), largo: r2(w.L) }); } }
    aviso.prev = ahora;
    // el jugador
    const em = solido(js.pos.x, js.pos.z, js.pos.y, 0.25);
    if (em > 0.08 && !js.enTren) nota('jugador-adentro-de-sólido', 'jugador', js.pos.x, js.pos.z, js.pos.y, { empuje: r2(em), con: quienEs(js.pos.x, js.pos.z, js.pos.y) });
    if (f % 4 === 0) {
      const c = H.camara.position;
      bola.x = c.x; bola.y = c.y - 0.45; bola.z = c.z; const x0 = bola.x, z0 = bola.z;
      try { H.col.resolver(bola, 0.22, 0.7); } catch (e) { /* sin colisión */ }
      if (Math.hypot(bola.x - x0, bola.z - z0) > 0.06) { aviso.solidoCam++; if (aviso.solidoCam === 8) nota('cámara-en-sólido', 'cámara', c.x, c.z, c.y, { con: quienEs(c.x, c.z, c.y) }); } else aviso.solidoCam = 0;
      const suelo = T.altura(c.x, c.z);
      if (c.y < suelo - 0.02) nota('cámara-bajo-el-suelo', 'cámara', c.x, c.z, c.y, { dif: r2(c.y - suelo) });
    }
  };

  N.perfil = (p) => {
    const h = P.historia;
    h.activa = true; h.empezada = h.empezada || 1; h.version = 2; h.capitulo = 12; h.fase = 'jugando';
    const trato = p === 'trato';
    Object.assign(h.decisiones, trato ? { bolsa: 'a', coihue: 'a', molienda: 'c', cuaderno: 'a', majada: 'a', duendes: 'a' } : { bolsa: 'c', coihue: 'b', molienda: 'a', cuaderno: 'b', majada: 'c', duendes: 'c' });
    h.duendes.trato = trato ? 'trato' : 'pelea';
    for (const k of Object.keys(h.lazos)) h.lazos[k] = trato ? 2 : -1;
    h.acompanante = null;
    return 1;
  };
  N.jugar = async (id, o) => {
    const d = dir(), res = { id, perfil: o.perfil, modo: o.modo, frames: 0, hallazgos: [], errores: [], dur: 0, puestos: 0, caminatas: 0 };
    for (let i = 0; i < 6 && H.__escenas.activa(); i++) { d.saltar(); frames(6); }
    for (const b of document.querySelectorAll('#valle-tarjeta button[data-valle-opcion]')) { b.click(); break; }
    N.perfil(o.perfil);
    P.horas = 10;
    try { H.__colocarEscena(id); } catch (e) { res.errores.push('colocar: ' + e.message); }
    frames(8);
    aviso = { f: 0, mapa: new Map(), lista: [], prev: null, puestos: 0, caminatas: [], solidoCam: 0, vivas: new Map() };
    let disparo = false;
    for (let k = 0; k < 12 && !disparo; k++) { if (H.__escenas.activa()) { d.saltar(); frames(12); } disparo = H.__escenas.disparar(id, { forzar: true }); if (!disparo) { for (const b of document.querySelectorAll('#valle-tarjeta button[data-valle-opcion]')) { b.click(); break; } frames(20); } }
    // (algunas escenas no arrancan porque el jugador queda «en el tren» o con algo abierto: se las fuerza igual para mirarlas, y se anota el motivo)
    if (!disparo) { const js = H.jugador.estado; res.motivo = { enTren: !!js.enTren, enKayak: !!js.enKayak, enVela: !!js.enVela, cuerpo: document.body.className.slice(0, 120), tarjeta: !!document.querySelector('#valle-tarjeta:not(.oculto)'), activa: H.__escenas.activa(), paneles: [...document.querySelectorAll('[id]')].filter((e) => !e.classList.contains('oculto') && getComputedStyle(e).display !== 'none' && /panel|menu|charla|dialogo|dormir|foto|pausa/i.test(e.id)).map((e) => e.id).slice(0, 6) }; const orig = mundo.puedeEmpezar; mundo.puedeEmpezar = () => true; disparo = H.__escenas.disparar(id, { forzar: true }); mundo.puedeEmpezar = orig; res.forzada = disparo; }
    if (!disparo) { res.noDisparo = true; aviso = null; return res; }
    const maxF = o.modo === 'saltar' ? 400 : 5200;
    for (let f = 0; f < maxF; f++) {
      aviso.f = f;
      frames(1); res.frames++;
      if (o.modo === 'saltar' && f === 12) { d.saltar(); }
      mirarCuadro(f);
      let dat = d.datos();
      if (!dat || !d.activa()) { frames(12); if (d.activa() && d.idActual() !== id) { dat = d.datos(); if (!dat) continue; } else break; }
      if (o.modo === 'leer') {
        if (dat.eleccion) { if (d.eleccionLista()) { const n = dat.eleccion.opciones.length, k = o.perfil === 'pelea' ? n - 1 : 0; d.elegir(k); } }
        else if (dat.dialogo) d.avanzar();
      }
      if (f % 15 === 0) for (const e of d.errores()) if (!res.errores.includes(e)) res.errores.push(e);
      if (f % 50 === 49) await new Promise((r) => setTimeout(r, 0));
    }
    res.dur = +(res.frames * 0.05).toFixed(1);
    if (d.activa()) { res.noCierra = true; d.saltar(); for (let i = 0; i < 6 && d.activa(); i++) frames(10); }
    frames(30);
    res.hallazgos = aviso.lista;
    res.caminatas = aviso.caminatas.length; res.puestos = aviso.puestos;
    // las caminatas que no llegaron (la escena terminó antes de llegar no cuenta: el director las completa)
    aviso = null;
    return res;
  };
  N.cerrar = () => { const d = dir(); for (let i = 0; i < 8 && d.activa(); i++) { d.saltar(); frames(10); } frames(20); return !d.activa(); };
  return 1;
})()`;

app.whenReady().then(async () => {
  const consola = [];
  const { ipcMain } = require('electron');
  require(path.join(raiz, 'copias-main.cjs')).registrarCopias({ ipcMain, app });
  require(path.join(raiz, 'fotos-main.cjs')).registrarFotos({ ipcMain, app });
  const w = new BrowserWindow({ show: true, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false, preload: path.join(raiz, 'preload.cjs') } });
  let donde = 'carga', escenaActual = '';
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) consola.push({ en: escenaActual, m: m.slice(0, 300) });
  });
  w.webContents.on('render-process-gone', (e, d) => { console.log('PROCESO DE LA PÁGINA CAÍDO en ' + escenaActual + ':', JSON.stringify(d)); consola.push({ en: escenaActual, m: 'render-process-gone ' + JSON.stringify(d) }); });
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 150 s (${donde})`)), 150000))]);
  const url = process.env.HTML ? path.resolve(process.env.HTML) : path.join(raiz, 'index.html');
  const ajustes = `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'relax', relaxTipo:'historia', autoCalidad:false, guiaPrimerDia:false})); 1`;
  const abrir = async () => {
    await w.loadFile(url, { search: '?debug=1' }); await js(ajustes); await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false); }
    if (!listo) throw new Error('el juego no cargó');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js('window.__sinPausaPorBlur = true; 1');
    await js(DETERMINISTA(4251));
    await js(PAGINA);
    await js('window.__cuadros(60, 50)');
    await js(`(() => { for (let i = 0; i < 3; i++) { const b = document.querySelector('#valle-tarjeta button[data-valle-opcion]'); if (b) { b.click(); window.__cuadros(10, 50); } } return 1 })()`);
  };
  const resultados = [];
  try {
    await abrir();
    let ids = await js('window.__N.ids()');
    console.log(`escenas registradas: ${ids.length}`);
    if (SOLO.length) ids = ids.filter((x) => SOLO.includes(x));
    ids = ids.slice(DESDE, HASTA);
    let n = 0;
    for (const id of ids) {
      for (const modo of MODOS) for (const perfil of (modo === 'saltar' ? PERFILES.slice(0, 1) : PERFILES)) {
        if (n && n % RECARGAR_CADA === 0) { donde = 'recarga'; await abrir(); }
        n++;
        donde = `${id} (${modo}/${perfil})`; escenaActual = donde;
        let r;
        try { r = await js(`window.__N.jugar(${JSON.stringify(id)}, { perfil: ${JSON.stringify(perfil)}, modo: ${JSON.stringify(modo)} })`); }
        catch (e) { r = { id, perfil, modo, excepcion: String(e.message || e), hallazgos: [] }; try { await abrir(); } catch (e2) { console.log('no se pudo reabrir: ' + e2.message); break; } }
        resultados.push(r);
        const mal = (r.hallazgos || []).length || r.noDisparo || r.excepcion;
        console.log(`${mal ? '✗' : '✓'} ${id} [${modo}/${perfil}] ${r.dur ?? '?'} s${r.noDisparo ? ' · NO DISPARÓ' : ''}${r.forzada ? ' · FORZADA ' + JSON.stringify(r.motivo) : ''}${r.excepcion ? ' · EXCEPCIÓN ' + r.excepcion : ''}${(r.hallazgos || []).map((h) => `\n      ${h.tipo} · ${h.quien} · (${h.x}, ${h.z}) y=${h.y} · cuadros ${h.desde}-${h.hasta} (${h.n})${h.con ? ' · ' + h.con : ''}${h.como ? ' · ' + h.como : ''}${h.dif !== undefined ? ' · dif ' + h.dif : ''}${h.seg !== undefined ? ' · tardó ' + h.seg + ' s de ' + h.esperado + ' esperados' : ''}`).join('')}`);
      }
    }
  } catch (e) { console.log('ERROR:', e && e.stack || e); }
  fs.writeFileSync(SALIDA, JSON.stringify({ resultados, consola }, null, 1));
  const malos = resultados.filter((r) => (r.hallazgos || []).length || r.noDisparo || r.excepcion);
  console.log(`\n${resultados.length} corridas, ${malos.length} con hallazgos, ${consola.length} errores de consola (detalle en ${SALIDA})`);
  for (const c of consola.slice(0, 20)) console.log('  consola [' + c.en + ']: ' + c.m);
  try { app.exit(0); } catch { process.exit(0); }
});

// 3.8.3: partidas rotas por dentro (Electron + WebGL). Se arma una partida de verdad y se le cambian
// hojas al azar en lo hondo (la aldea, la vecindad, el amor, la granja, el tren, el desafío...):
// tipos equivocados, null, números enormes o negativos, listas en vez de objetos. Con cada una se
// vuelve a abrir el juego: tiene que arrancar y jugar unos cuadros sin errores. Semilla fija:
// una falla se repite igual. Uso: npx electron pruebas/humo-3-8-3-guardado-hondo.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const VUELTAS = Number(process.env.HOJ_VUELTAS) || 12;
const CAMBIOS = Number(process.env.HOJ_CAMBIOS) || 6;

function azar(semilla) { let s = semilla >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const RAROS = [null, -1, 0, 1e308, -1e308, 2.5, 'x', '', true, [], {}, [null], ['x', 3], { x: 'a' }];
// todos los caminos a hojas y nodos (hasta cierta hondura, sin las listas enormes del mapa)
function caminos(o, pre = [], salida = [], hondo = 0) {
  if (hondo > 7 || !o || typeof o !== 'object') return salida;
  const claves = Array.isArray(o) ? o.slice(0, 6).map((_, i) => i) : Object.keys(o);
  for (const k of claves) {
    if (k === 'explorado') continue;
    const c = [...pre, k];
    salida.push(c);
    caminos(o[k], c, salida, hondo + 1);
  }
  return salida;
}
function poner(o, c, v) { let x = o; for (let i = 0; i < c.length - 1; i++) x = x[c[i]]; x[c[c.length - 1]] = v; }

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: false, width: 1024, height: 640, webPreferences: { backgroundThrottling: false } });
  let donde = 'carga';
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(`[${donde}] ${m.slice(0, 400)}`);
  });
  const js = (c) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 90 s (${donde})`)), 90000)),
  ]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const entrar = async () => {
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2000);
  };
  const ajustes = (modo) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'${modo}', autoCalidad:false, guiaPrimerDia:false}));`;
  const jugar = () => js(`(async ()=>{ try { const H = window.__hojarasca;
    for (const t of ['KeyW', 'KeyE', 'KeyC', 'Escape', 'KeyI', 'Escape', 'KeyM', 'Escape']) {
      document.dispatchEvent(new KeyboardEvent('keydown', { code: t, bubbles: true }));
      for (let i = 0; i < 4; i++) { H.__bucle(); await new Promise(r => setTimeout(r, 15)); }
      document.dispatchEvent(new KeyboardEvent('keyup', { code: t, bubbles: true }));
    }
    H.progreso.horas = 23.9; for (let i = 0; i < 20; i++) { H.__bucle(); await new Promise(r => setTimeout(r, 10)); }
    H.guardar();
    const p = H.jugador.estado.pos, P = H.progreso;
    return { finito: [p.x, p.y, p.z, P.horas, P.dia].every(Number.isFinite), dia: P.dia }; } catch (e) { throw new Error(String(e && e.stack || e).slice(0, 900)); } })()`);

  const probar = async (modo, clave, semilla) => {
    donde = `${modo}: base`;
    await abrir();
    await js(`localStorage.clear(); ${ajustes(modo)} 1`);
    await abrir(); await entrar();
    const texto = await js(`(()=>{ const H = window.__hojarasca; H.progreso.dia = 9; H.guardar(); return localStorage.getItem('${clave}'); })()`);
    ok(!!texto, `${modo}: hay partida base guardada`);
    const r = azar(semilla);
    const todos = caminos(JSON.parse(texto));
    for (let v = 0; v < VUELTAS; v++) {
      const p = JSON.parse(texto);
      const solo = process.env.HOJ_SOLO ? process.env.HOJ_SOLO.split(',').map(Number) : null;
      const hechos = [];
      for (let i = 0; i < CAMBIOS; i++) {
        const c = todos[Math.floor(r() * todos.length)];
        const val = RAROS[Math.floor(r() * RAROS.length)];
        try { poner(p, c, JSON.parse(JSON.stringify(val)));   // (una copia: el mismo objeto en dos lugares hacía un círculo)
 hechos.push(`${c.join('.')}=${JSON.stringify(val)}`); } catch { /* el camino ya no existe */ }
      }
      if (solo && (!solo.includes(v) || modo !== (process.env.HOJ_MODO || modo))) continue;
      donde = `${modo} #${v}: ${hechos.join(' ; ')}`;
      const antes = errores.length;
      try {
        await abrir();
        await js(`localStorage.clear(); ${ajustes(modo)} localStorage.setItem('${clave}', ${JSON.stringify(JSON.stringify(p))}); 1`);
        await abrir(); await entrar();
        const res = await jugar();
        ok(res.finito && errores.length === antes, `${donde} → arranca y juega`);
      } catch (e) { ok(false, `${donde} → ${e.message}`); }
    }
  };
  try {
    await probar('relax', 'hojarasca-v1', Number(process.env.HOJ_SEMILLA) || 383);
    await probar('desafio', 'hojarasca-desafio-v1', (Number(process.env.HOJ_SEMILLA) || 383) + 1);
  } catch (e) { errores.push('excepción: ' + (e && e.message ? e.message : e)); }
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});

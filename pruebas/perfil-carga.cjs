// Perfil de CPU de la carga del valle (2.2): en qué funciones se van los segundos desde
// que se abre la página hasta que el mundo está armado.
// Uso: npx electron pruebas/perfil-carga.cjs [--modo=relax|desafio]
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const modo = process.argv.find((a) => a.startsWith('--modo='))?.split('=')[1] || 'relax';
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { backgroundThrottling: false } });
  const js = (c) => w.webContents.executeJavaScript(c);
  const url = path.join(raiz, 'index.html');
  await w.loadFile(url, { search: '?debug=1' });
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'${modo}', guiaPrimerDia:false, autoCalidad:false})); 1`);
  const dbg = w.webContents.debugger;
  dbg.attach('1.3');
  await dbg.sendCommand('Profiler.enable');
  await dbg.sendCommand('Profiler.setSamplingInterval', { interval: 200 });
  await dbg.sendCommand('Profiler.start');
  await w.loadFile(url, { search: '?debug=1' });
  for (let i = 0; i < 600; i++) { await esperar(200); if (await js('!!window.__hojarasca && !!window.__hojarasca.__carga').catch(() => false)) break; }
  const { profile } = await dbg.sendCommand('Profiler.stop');
  const carga = await js('window.__hojarasca.__carga()');
  dbg.detach();
  const lineas = fs.readFileSync(url, 'utf8').split('\n');
  const modulos = [];
  lineas.forEach((l, i) => { const m = /^\/\/ ===== (.+) =====$/.exec(l); if (m) modulos.push({ linea: i + 1, nombre: m[1] }); });
  const primero = modulos.length ? modulos[0].linea : Infinity;
  const moduloDe = (n) => { if (n < primero) return 'three.js'; let r0 = ''; for (const m of modulos) { if (m.linea <= n) r0 = m.nombre; else break; } return r0; };
  const porId = new Map(profile.nodes.map((n) => [n.id, n]));
  const propio = new Map(), porModulo = new Map();
  let total = 0;
  profile.samples.forEach((id, i) => {
    const dt = profile.timeDeltas[i] || 0; total += dt;
    const cf = porId.get(id).callFrame;
    const esIndex = (cf.url || '').includes('index.html');
    const mod = esIndex ? moduloDe(cf.lineNumber + 1) : (cf.functionName.startsWith('(') ? cf.functionName : 'nativo');
    const k = `${cf.functionName || '(anónima)'} · ${mod}:${cf.lineNumber + 1}`;
    propio.set(k, (propio.get(k) || 0) + dt);
    porModulo.set(mod, (porModulo.get(mod) || 0) + dt);
  });
  console.log('etapas:', carga.etapas.map((e) => `${e.texto} ${e.ms}`).join(' · '));
  console.log('--- por módulo');
  for (const [m, us] of [...porModulo.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14)) console.log(`${(us / 1000).toFixed(0).padStart(6)} ms  ${m}`);
  console.log('--- por función');
  for (const [k, us] of [...propio.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(`${(us / 1000).toFixed(0).padStart(6)} ms  ${k}`);
  app.exit(0);
});

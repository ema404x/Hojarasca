// PROTOTIPO: el estudio de personajes. Empaqueta pruebas/estudio/entrada.js (como armar.mjs, pero
// con otra entrada y sin el juego) y saca las tomas de cada variante en una escena chica, para
// mirar de cerca sin cargar el valle. Las capturas de verdad son las de visor-personajes.cjs.
// Uso: npx electron pruebas/estudio-personajes.cjs [variantes=base,A,B,C,D] [tomas=cuerpo,cara,grupo]
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(raiz, 'pruebas', 'salidas', 'proto-personajes', 'estudio');
const anotarError = (tipo, e) => {
  const texto = `[estudio-personajes] ${tipo}: ${e && e.stack ? e.stack : e}\n`;
  try { console.error(texto); fs.mkdirSync(salida, { recursive: true }); fs.appendFileSync(path.join(salida, 'errores.log'), texto); } catch { /* nada */ }
  try { app.exit(1); } catch { process.exit(1); }
};
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => anotarError('excepción', e));
process.on('unhandledRejection', (e) => anotarError('promesa', e));
app.setPath('userData', path.join(salida, '_perfil'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`${n}=`)); return a ? a.slice(n.length + 1) : d; };

// ---- el empaquetado (lo mismo que armar.mjs)
function empaquetar(entrada) {
  const idModulo = (f) => '__mod_' + path.basename(f, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
  const info = new Map(), orden = [], visto = new Set();
  const visitar = (f) => {
    f = path.resolve(f); if (visto.has(f)) return; visto.add(f);
    const texto = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n'), deps = [];
    for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') deps.push(path.resolve(path.dirname(f), m[2]));
    info.set(f, texto); for (const d of deps) visitar(d); orden.push(f);
  };
  visitar(entrada);
  let juego = '';
  for (const f of orden) {
    let t = info.get(f); const exp = [];
    for (const m of t.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)) exp.push(m[1]);
    t = t.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
    t = t.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_x, nombres, spec) => {
      const dep = path.resolve(path.dirname(f), spec);
      const partes = nombres.split(',').map((x) => x.trim()).filter(Boolean).map((x) => { const [o, l] = x.split(/\s+as\s+/); return l ? `${o.trim()}: ${l.trim()}` : o.trim(); });
      return `const { ${partes.join(', ')} } = ${idModulo(dep)};`;
    });
    t = t.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
    juego += `const ${idModulo(f)} = (() => {\n${t}\nreturn { ${[...new Set(exp)].join(', ')} };\n})();\n`;
  }
  const three = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8');
  return `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#111}</style><body><script>${three}\n${juego}</script>`;
}

app.whenReady().then(async () => {
  fs.mkdirSync(salida, { recursive: true });
  const html = path.join(salida, 'estudio.html');
  fs.writeFileSync(html, empaquetar(path.join(raiz, 'pruebas', 'estudio', 'entrada.js')));
  const w = new BrowserWindow({ show: false, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false, offscreen: false } });
  const errores = [];
  w.webContents.on('console-message', (e) => { if (e.level === 'error' || e.level === 'warning') errores.push(String(e.message).slice(0, 400)); });
  await w.loadFile(html);
  const js = (c) => w.webContents.executeJavaScript(c);
  for (let i = 0; i < 50 && !(await js('!!window.estudioListo').catch(() => false)); i++) await new Promise((r) => setTimeout(r, 200));
  if (!(await js('!!window.estudioListo'))) { console.log('no cargó:\n' + errores.join('\n')); app.exit(1); return; }
  for (const v of arg('variantes', 'base,A,B,C,D').split(',')) {
    for (const t of arg('tomas', 'cuerpo,cara,grupo').split(',')) {
      const d = await js(`window.estudio.toma('${v}', '${t}')`);
      fs.writeFileSync(path.join(salida, `${v}-${t}.png`), Buffer.from(d.split(',')[1], 'base64'));
    }
    if (arg('medir', '0') === '1') console.log(v, JSON.stringify(await js(`window.estudio.medir('${v}')`)), 'armado ms', (await js(`window.estudio.tiempoArmado('${v}', 4)`)).toFixed(1));
  }
  if (errores.length) console.log('consola:\n' + [...new Set(errores)].slice(0, 15).join('\n'));
  console.log('listo', salida);
  app.exit(0);
});

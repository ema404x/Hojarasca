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
  for (const v of arg('variantes', 'base,A,B,C,D').split(',').filter(Boolean)) {
    for (const t of arg('tomas', 'cuerpo,cara,grupo').split(',')) {
      const d = await js(`window.estudio.toma('${v}', '${t}')`);
      fs.writeFileSync(path.join(salida, `${v}-${t}.png`), Buffer.from(d.split(',')[1], 'base64'));
    }
    if (arg('medir', '0') === '2') console.log(JSON.stringify(await js(`window.estudio.partes('${v}')`), null, 1));
    if (arg('medir', '0') !== '0' && v === 'P') console.log('atlas', JSON.stringify(await js('window.estudio.atlas()')));
    if (arg('medir', '0') !== '0') console.log(v, JSON.stringify(await js(`window.estudio.medir('${v}')`)), 'armado ms', (await js(`window.estudio.tiempoArmado('${v}', 4)`)).toFixed(1));
  }
  // comparar=base,B,D,S: una lámina con las caras lado a lado (una fila por persona, una columna
  // por variante), de los <v>-cara.png que ya están → comparacion-<última>.png
  const comparar = arg('comparar', '');
  if (comparar) {
    const vs = comparar.split(',').filter((v) => fs.existsSync(path.join(salida, `${v}-cara.png`)));
    const TIT = { base: 'Hoy', A: 'A', B: 'B · ropa y pelo', C: 'C', D: 'D · lo más realista', S: 'S · tipo Sims, más simple' };
    const datos = vs.map((v) => 'data:image/png;base64,' + fs.readFileSync(path.join(salida, `${v}-cara.png`)).toString('base64'));
    const png = await js(`(async () => {
      const vs = ${JSON.stringify(vs)}, tit = ${JSON.stringify(vs.map((v) => TIT[v] || v))}, src = ${JSON.stringify(datos)};
      const imgs = await Promise.all(src.map((s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = s; })));
      const k = 0.62, cw = Math.round(560 * k), ch = Math.round(640 * k), sep = 8, arriba = 54, izq = 150;
      const cv = document.createElement('canvas'); cv.width = izq + vs.length * (cw + sep); cv.height = arriba + 3 * (ch + sep);
      const x = cv.getContext('2d'); x.fillStyle = '#1d1a17'; x.fillRect(0, 0, cv.width, cv.height);
      x.fillStyle = '#efe6d6'; x.font = 'bold 26px Georgia, serif'; x.textAlign = 'center';
      tit.forEach((t, j) => x.fillText(t, izq + j * (cw + sep) + cw / 2, 36));
      x.textAlign = 'left'; x.font = 'bold 26px Georgia, serif';
      ['Rosa', 'Anselmo', 'Lucía'].forEach((n, f) => {
        x.fillText(n, 18, arriba + f * (ch + sep) + ch / 2 + 8);
        imgs.forEach((im, j) => x.drawImage(im, f * 566, 0, 560, 640, izq + j * (cw + sep), arriba + f * (ch + sep), cw, ch));
      });
      return cv.toDataURL('image/png'); })()`);
    const nombre = `comparacion-${vs[vs.length - 1]}.png`;
    fs.writeFileSync(path.join(salida, nombre), Buffer.from(png.split(',')[1], 'base64'));
    console.log('lámina', nombre);
  }
  if (errores.length) console.log('consola:\n' + [...new Set(errores)].slice(0, 15).join('\n'));
  // dos=S,M: dos variantes lado a lado, las caras arriba y los cuerpos abajo → comparacion-<segunda>.png
  const dos = arg('dos', '').split(',').filter(Boolean);
  if (dos.length === 2) {
    const leer = (n) => 'data:image/png;base64,' + fs.readFileSync(path.join(salida, n)).toString('base64');
    const src = dos.flatMap((v) => [leer(`${v}-cara.png`), leer(`${v}-cuerpo.png`)]);
    const TIT = { S: 'S · tipo Sims', M: 'M · a lo Sims Medieval', P: 'P · atlas pintado' };
    const png = await js(`(async () => {
      const src = ${JSON.stringify(src)}, tit = ${JSON.stringify(dos.map((v) => TIT[v] || v))};
      const im = await Promise.all(src.map((s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = s; })));
      const W = 850, sep = 10, arriba = 54, hc = Math.round(640 * W / Math.min(im[0].width, im[2].width)), hb = Math.round(780 * W / 1300);
      const cv = document.createElement('canvas'); cv.width = 2 * W + sep; cv.height = arriba + hc + sep + hb;
      const x = cv.getContext('2d'); x.fillStyle = '#1d1a17'; x.fillRect(0, 0, cv.width, cv.height);
      x.fillStyle = '#efe6d6'; x.font = 'bold 28px Georgia, serif'; x.textAlign = 'center';
      tit.forEach((t, j) => {
        x.fillText(t, j * (W + sep) + W / 2, 38);
        const hj = Math.round(640 * W / im[j * 2].width);   // (cada tira a su escala, centrada en su alto)
        x.drawImage(im[j * 2], 0, 0, im[j * 2].width, 640, j * (W + sep), arriba + (hc - hj) / 2, W, hj);
        x.drawImage(im[j * 2 + 1], 150, 70, 1300, 780, j * (W + sep), arriba + hc + sep, W, hb);
      });
      return cv.toDataURL('image/png'); })()`);
    fs.writeFileSync(path.join(salida, `comparacion-${dos[1]}.png`), Buffer.from(png.split(',')[1], 'base64'));
    console.log('lámina', `comparacion-${dos[1]}.png`);
  }
  console.log('listo', salida);
  app.exit(0);
});

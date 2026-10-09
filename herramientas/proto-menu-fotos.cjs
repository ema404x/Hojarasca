// proto-menu: capturas de los menús con el estilo de hoy y con los tres estilos de prueba (src/proto-menu/), a 1366×768,
// y las hojas de comparación (hoy, A, B y C rotulados). No toca el juego: los estilos se activan con ?debug=1&menu=A|B|C.
// Uso (con index.html armado):
//   npx electron --no-sandbox -r <ruta>\herramientas\al-monitor.cjs -r <ruta>\herramientas\perfil-propio.cjs \
//     <ruta>\herramientas\proto-menu-fotos.cjs --salida=<carpeta> [--estilos=actual,A,B,C] [--solo-hojas]
const { app, BrowserWindow, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const salida = path.resolve(arg('salida', path.join(raiz, 'pruebas', 'salidas', 'proto-menu')));
const estilos = arg('estilos', 'actual,A,B,C').split(',').filter(Boolean);
const soloHojas = process.argv.includes('--solo-hojas');
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const PANTALLAS = ['portada', 'pausa', 'personalizar', 'mochila'];

async function capturar(estilo) {
  const w = new BrowserWindow({ show: false, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.setContentSize(ANCHO, ALTO);
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill/.test(m)) errores.push(m.slice(0, 200)); });
  const js = (c) => w.webContents.executeJavaScript(c);
  const foto = async (nombre) => {
    await esperar(700);
    w.webContents.invalidate();
    const cuadro = await js(`Promise.race([new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(()=>r('ok')))), new Promise((r)=>setTimeout(()=>r('sin cuadros'),1500))])`);
    if (cuadro !== 'ok') console.log(`  (${nombre}: ${cuadro})`);
    const img = await w.webContents.capturePage({ x: 0, y: 0, width: ANCHO, height: ALTO });
    const s = img.getSize();
    const png = (s.width === ANCHO && s.height === ALTO ? img : img.resize({ width: ANCHO, height: ALTO, quality: 'best' })).toPNG();
    fs.writeFileSync(path.join(salida, `${estilo === 'actual' ? 'actual' : estilo}-${nombre}.png`), png);
    console.log(`  ${estilo}-${nombre}.png (${s.width}×${s.height})`);
  };
  const tecla = (code) => js(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'${code}',key:'${code}',bubbles:true}));document.dispatchEvent(new KeyboardEvent('keyup',{code:'${code}',key:'${code}',bubbles:true}));1`);
  // la ventana oculta no queda justo de 1366×768 (Windows le suma bordes): se fija la vista con la emulación
  w.webContents.on('did-finish-load', () => w.webContents.enableDeviceEmulation({ screenPosition: 'desktop', screenSize: { width: ANCHO, height: ALTO }, viewSize: { width: ANCHO, height: ALTO }, deviceScaleFactor: 1, viewPosition: { x: 0, y: 0 }, scale: 1 }));
  const search = estilo === 'actual' ? '?debug=1' : `?debug=1&menu=${estilo}`;
  const url = path.join(raiz, 'index.html');
  await w.loadFile(url, { search });
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, idioma:'es', estacion:'otono'})); 1`);
  await w.loadFile(url, { search });
  let listo = false;
  for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca && !document.getElementById("inicio").classList.contains("oculto")').catch(() => false); }
  if (!listo) throw new Error(`${estilo}: el juego no llegó a la portada`);
  if (estilo !== 'actual') {
    const ok = await js(`[...document.styleSheets].some((s) => (s.href || '').includes('proto-menu/menu-${estilo}.css') && s.cssRules.length > 0)`).catch(() => false);
    if (!ok) throw new Error(`${estilo}: no se cargó src/proto-menu/menu-${estilo}.css`);
  }
  await esperar(2500);
  console.log(`  vista ${await js('innerWidth + "×" + innerHeight')}`);
  console.log(`  build-info ${await js(`(()=>{const b=document.getElementById('build-info'), r=b.getBoundingClientRect(), s=getComputedStyle(b); return [Math.round(r.x),Math.round(r.y),s.position,s.right,s.bottom,s.top,s.left, b.parentElement.id].join(' ')})()`)}`);
  await foto('portada');
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(6000);
  await js(`(()=>{const H=window.__hojarasca; try{ H.progreso.horas = 17.2 }catch{}; H.abrir('pausa'); return 1})()`);
  await esperar(1500);
  console.log('  seguir:', await js(`(()=>{const s=getComputedStyle(document.getElementById('btn-seguir')); return s.backgroundColor + ' | ' + s.color + ' | ' + s.backgroundImage.slice(0,60)})()`));
  await foto('pausa');
  await js(`document.getElementById('btn-personalizar').click(); 1`);
  await esperar(1200);
  await foto('personalizar');
  await js(`(()=>{const H=window.__hojarasca; H.__personal.cerrar(); H.volverAlJuego();
    const p=H.progreso; p.cosas=p.cosas||{}; p.cosas.farol=true; p.cosas.manta=true; p.cosas.yerba=4; p.ramitas=6;
    for (const [k,n] of [['pinon',5],['calafate',8],['frutilla',3],['pluma',2],['llaollao',3],['canto',4]]) p.entradas[k]={...(p.entradas[k]||{}), cantidad:n};
    return 1})()`);
  await esperar(1000);
  // (la ventana oculta no tiene el mouse capturado: el cartel «Hacé clic para volver a mirar» se saca para la foto)
  await w.webContents.insertCSS('#pista-clic { display: none !important; }');
  await js(`window.__hojarasca.__hud.abrirMochila(true); 1`);
  await esperar(800);
  console.log('  mochila:', await js(`(()=>{const m=document.getElementById('mochila'); return m.className + ' · hud ' + document.getElementById('hud').className + ' · cosas ' + m.querySelectorAll('.cosa').length + ' · build ' + getComputedStyle(document.getElementById('build-info')).position})()`));
  await foto('mochila');
  if (errores.length) console.log(`  (errores de consola en ${estilo}: ${errores.slice(0, 3).join(' | ')})`);
  w.destroy();
}

// la hoja: hoy, A, B y C en una grilla de 2×2, cada uno con su rótulo arriba
let ventanaHoja = null;
async function hoja(pantalla) {
  const rotulos = { actual: 'Hoy', A: 'A · Cuaderno de campo', B: 'B · Madera y leña', C: 'C · Limpio sobre el paisaje' };
  const imgs = ['actual', 'A', 'B', 'C'].map((e) => {
    const f = path.join(salida, `${e}-${pantalla}.png`);
    return { rotulo: rotulos[e], src: fs.existsSync(f) ? nativeImage.createFromPath(f).toDataURL() : null };
  });
  // (una sola ventana para todas las hojas: una segunda ventana nueva no carga la página en blanco)
  if (!ventanaHoja) {
    ventanaHoja = new BrowserWindow({ show: false, width: 400, height: 300, webPreferences: { backgroundThrottling: false } });
    fs.mkdirSync(path.join(raiz, 'pruebas', 'salidas'), { recursive: true });
    const vacia = path.join(raiz, 'pruebas', 'salidas', 'proto-menu-hoja.html');
    fs.writeFileSync(vacia, '<!doctype html><html><body></body></html>');
    await ventanaHoja.loadFile(vacia);
  }
  const w = ventanaHoja;
  const dataUrl = await w.webContents.executeJavaScript(`(async () => {
    const imgs = ${JSON.stringify(imgs)};
    const E = 0.75, cw = Math.round(${ANCHO} * E), ch = Math.round(${ALTO} * E), m = 24, rot = 46;
    const c = document.createElement('canvas'); c.width = m + 2 * (cw + m); c.height = 70 + 2 * (rot + ch + m);
    const x = c.getContext('2d');
    x.fillStyle = '#16120d'; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#efe6d2'; x.font = '600 30px Georgia, serif'; x.fillText('Hojarasca · menús · ${pantalla}', m, 46);
    for (let i = 0; i < 4; i++) {
      const cx = m + (i % 2) * (cw + m), cy = 70 + Math.floor(i / 2) * (rot + ch + m);
      x.fillStyle = i === 0 ? '#a99b7c' : '#efc77a'; x.font = '600 24px Georgia, serif'; x.fillText(imgs[i].rotulo, cx, cy + 32);
      if (!imgs[i].src) { x.strokeStyle = '#555'; x.strokeRect(cx, cy + rot, cw, ch); continue; }
      const im = new Image(); im.src = imgs[i].src; await im.decode();
      x.drawImage(im, cx, cy + rot, cw, ch);
      x.strokeStyle = 'rgba(239,230,210,.25)'; x.lineWidth = 1; x.strokeRect(cx - .5, cy + rot - .5, cw + 1, ch + 1);
    }
    return c.toDataURL('image/png');
  })()`);
  fs.writeFileSync(path.join(salida, `comparar-${pantalla}.png`), Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log(`  comparar-${pantalla}.png`);
}

app.whenReady().then(async () => {
  let fallo = false;
  try {
    // (las hojas van en otra corrida, con --solo-hojas: después de cerrar la ventana del juego, una ventana nueva ya no
    // carga páginas en este proceso)
    if (!soloHojas) for (const e of estilos) { console.log(`estilo ${e}`); await capturar(e); }
    else for (const p of PANTALLAS) await hoja(p);
  } catch (e) { fallo = true; console.log('ERROR: ' + (e && e.stack ? e.stack : e)); }
  app.exit(fallo ? 1 : 0);
});

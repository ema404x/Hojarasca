// Banco visual de los invasores: saca fotos de cada tipo, de día y de noche, de frente
// y de lejos, para poder mirar si dan miedo en vez de suponerlo.
//
// Corre en una ventana oculta sin placa de video, así que va a un cuadro por segundo:
// no sirve para medir rendimiento, sirve para ver.
//
// Uso: npx electron pruebas/render-invasores.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const TIPOS = ['rastreador', 'tirador', 'saltador', 'escupidor', 'bruto', 'jefe'];

app.whenReady().then(async () => {
  const salida = path.join(__dirname, 'salidas', 'invasores');
  fs.mkdirSync(salida, { recursive: true });
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { backgroundThrottling: false } });
  const js = (c) => w.webContents.executeJavaScript(c);
  const errores = [];
  w.webContents.on('console-message', (e) => { if (e.level === 'error') errores.push(String(e.message).slice(0, 200)); });
  const foto = async (nombre) => {
    const img = await w.capturePage();
    fs.writeFileSync(path.join(salida, nombre + '.png'), img.toPNG());
    console.log('  📷', nombre);
  };

  await w.loadFile(path.join(raiz, 'index.html'), { search: '?debug=1' });
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'alta', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false})); 1`);
  await w.loadFile(path.join(raiz, 'index.html'), { search: '?debug=1' });
  for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) break; }
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(4000);

  // unos cuadros de juego para que todo se acomode
  const simular = (seg) => js(`(()=>{const H=window.__hojarasca; for(let i=0;i<${Math.round(seg / 0.05)};i++){ H.progreso.horas += 0.05*24/(30*60); } return 1})()`);

  for (const noche of [false, true]) {
    // 13:00 o 23:00
    await js(`window.__hojarasca.progreso.horas = ${noche ? 23 : 13}; 1`);
    await simular(1);
    await esperar(2500);
    for (const tipo of TIPOS) {
      for (const [etiqueta, metros, mirando] of [['cerca', 4.5, true], ['lejos', 32, true], ['de-espaldas', 5, false]]) {
        if (!noche && etiqueta !== 'cerca') continue;    // de día alcanza con una
        const puesto = await js(`(()=>{
          const H = window.__hojarasca, js = H.jugador.estado;
          for (const a of H.desafio.aliens.slice()) { a.vida = 0; a.estado = 'irse'; a.m.g.visible = false; }
          const x = js.pos.x - Math.sin(js.yaw) * ${metros}, z = js.pos.z - Math.cos(js.yaw) * ${metros};
          const a = H.desafio.invocar('${tipo}', x, z);
          // mirando al jugador, o dado vuelta
          a.m.g.rotation.y = Math.atan2(js.pos.x - x, js.pos.z - z) + ${mirando ? 0 : 'Math.PI'};
          a.estado = 'quieto'; a.congelado = true;
          window.__bicho = a;
          return { tipo: a.tipo, x: +x.toFixed(1), z: +z.toFixed(1) };
        })()`).catch((e) => ({ error: String(e.message || e) }));
        if (puesto.error) { console.log('✗', tipo, etiqueta, puesto.error); continue; }
        // unos cuadros para que la pose y los ojos se acomoden
        await esperar(3500);
        const u = await js(`(()=>{const u=window.__bicho.m.uniformes(); return {
          mirada:+u.uMirada.value.toFixed(2), silueta:+u.uSilueta.value.toFixed(2), ojos:+u.uOjos.value.toFixed(2),
          flash:+u.uFlash.value.toFixed(2), disolver:+u.uDisolver.value.toFixed(2), visible:window.__bicho.m.malla.visible,
          estado:window.__bicho.estado }})()`).catch(() => null);
        await foto(`${noche ? 'noche' : 'dia'}-${tipo}-${etiqueta}`);
        if (u) console.log('     ', JSON.stringify(u));
      }
    }
  }
  // cuánto se prendieron los ojos en la última foto, que es lo que se quiere ver
  const estado = await js(`(()=>{const a = window.__bicho; if (!a) return null;
    const u = a.m.uniformes ? a.m.uniformes() : null;
    return u ? { mirada: +u.uMirada.value.toFixed(3), silueta: +u.uSilueta.value.toFixed(3), ojos: +u.uOjos.value.toFixed(3) } : 'sin uniformes';
  })()`).catch(() => null);
  console.log('\núltimo invasor:', JSON.stringify(estado));
  if (errores.length) console.log('errores de consola:\n' + errores.slice(0, 5).join('\n'));
  console.log('carpeta:', salida);
  app.exit(0);
});

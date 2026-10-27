// Partida real 4.12.1 (Electron + WebGL): agua y reflejos.
// Para cada calidad (muybaja, baja, media, alta) abre el juego, entra al Relax, se para sobre el lago y comprueba con la placa de verdad:
//   · el agua se armó con la versión que toca (media y alta: las nubes con el fbm de tres octavas del cielo; baja y mínima: la barata) y compiló sin errores;
//   · el cielo le pasa al agua lo que espeja: de día, al ocaso (hora dorada) y de noche (el sol de verdad bajo el horizonte y la luna arriba);
//   · ningún programa de shader nuevo en cientos de cuadros de día, ocaso y noche, mirando al sol, a la luna y al arroyo (nada se compila a mitad de juego);
//   · el lago se dibuja con color (no negro ni vacío) en los tres momentos y el número de dibujos es normal;
//   · no hay errores de consola ni de shaders.
// Uso (desde la carpeta del proyecto, después de `node armar.mjs`), siempre en el monitor externo:
//   powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-12-1-agua.cjs -Espera 900 -Perfil <carpeta propia> [-Visible]
// HUMO_PAGINA=<index.html> para probar otra página armada.
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const pagina = path.resolve(process.env.HUMO_PAGINA || path.join(raiz, 'index.html'));
const { preludio, vistas } = require('../herramientas/vistas-agua-4-12-1.cjs');
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const visible = process.env.HUMO_OCULTO === '0';
setTimeout(() => { console.log('ERROR: la prueba tardó más de 14 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 14 * 60 * 1000).unref?.();
let pasos = 0, fallas = 0;
const ok = (c, t) => { pasos++; if (c) console.log('OK ' + t); else { fallas++; console.log('FALLA ' + t); } };
const vista = (id) => vistas.find((v) => v.id.startsWith(id));

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: visible, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const errores = [];
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught|shader error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300)); });
  const js = (c) => w.webContents.executeJavaScript(c);
  const H = 'window.__hojarasca';
  for (const q of ['muybaja', 'baja', 'media', 'alta']) {
    const conPost = q === 'media' || q === 'alta';
    const ajustes = `localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${q}', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', modoFluido:false, estacion:'verano'})); 1`;
    await w.loadFile(pagina, { search: '?debug=1' });
    await js(ajustes);
    await w.loadFile(pagina, { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.est && ${H}.T && ${H}.renderer && ${H}.__agua)`).catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(`${H}.ajustes.limiteFps = 'libre'; ${H}.volverAlJuego?.(true); 1`);
    await js(preludio);
    const info = await js(`(() => { const m = ${H}.__agua().mat, f = m.fragmentShader;
      return { completo: /float nN = fbmNubes\\(uvN/.test(f), barato: /0\\.54 \\* vnoise\\(pN\\)/.test(f), tieneCielo: ['uSolA', 'uLunaA', 'uDiaA', 'uTardeA', 'uDoradaA', 'uNubA', 'uLunaLuzA'].every((k) => !!m.uniforms[k]) } })()`);
    console.log(`-- ${q}: ${JSON.stringify(info)}`);
    ok(info.completo === conPost && info.barato === !conPost, `${q}: el agua lleva la versión ${conPost ? 'completa (tres octavas de nubes)' : 'barata (dos octavas)'}`);
    ok(info.tieneCielo, `${q}: el material del agua recibe los uniformes del cielo`);
    const correr = (n) => js(`(async () => { for (let i = 0; i < ${n}; i++) { ${H}.progreso.horas = window.__hora; ${H}.__bucle(); if (i % 10 === 9) await new Promise((r) => setTimeout(r, 0)); } return 1 })()`);
    // se para en el lago, mirando al sol de cada hora (el camino de luz o el de la luna)
    const parar = async (id, horas) => {
      const v = vista(id);
      const lugar = await js(`(() => { const H = ${H}, T = H.T; const p = ${v.donde}; if (!p) return null;
        H.jugador.ubicar(p.x, p.z, 0);
        H.__camaraFija = { x: p.x, y: p.y ?? T.altura(p.x, p.z) + 1.65, z: p.z, yaw: p.yaw, pitch: ${v.pitch ?? -0.03} };
        H.camara.fov = ${v.fov || 60}; H.camara.updateProjectionMatrix(); window.__hora = p.horas; H.progreso.horas = p.horas; return { x: p.x, z: p.z } })()`);
      ok(!!lugar, `${q}: encuadre ${id} (${horas})`);
      return lugar;
    };
    const cielo = () => js(`(() => { const u = ${H}.__agua().mat.uniforms; return { dia: u.uDiaA.value, tarde: u.uTardeA.value, solY: u.uSolA.value.y, lunaY: u.uLunaA.value.y } })()`);
    const luzDelLago = () => js(`(() => { ${H}.progreso.horas = window.__hora; ${H}.__bucle();
      const c = document.getElementById('mundo'), o = document.createElement('canvas'); o.width = c.width; o.height = c.height; const x = o.getContext('2d'); x.drawImage(c, 0, 0);
      const d = x.getImageData(0, Math.floor(o.height * 0.7), o.width, Math.floor(o.height * 0.25)).data; let suma = 0; const distintos = new Set();
      for (let i = 0; i < d.length; i += 4 * 53) { suma += d[i] + d[i + 1] + d[i + 2]; distintos.add((d[i] >> 3) * 1024 + (d[i + 1] >> 3) * 32 + (d[i + 2] >> 3)); }
      return { luz: +(suma / (d.length / (4 * 53)) / 3).toFixed(1), colores: distintos.size } })()`);
    // (primero una vuelta por todos los lugares: lo que se ve por primera vez en cada zona —un material básico de otra cosa— no es del agua)
    for (const [id, h] of [['10', 12.5], ['12', 19.2], ['08', 12.5], ['03', 20.2], ['04', 21.2], ['05', 23]]) { await parar(id, h); await correr(40); }
    await parar('01', 12.5); await correr(120);
    const progs = () => js(`${H}.renderer.info.programs.length`);
    const nombres = () => js(`${H}.renderer.info.programs.map((p) => p.name + ':' + (p.cacheKey || '').length + ':' + (p.cacheKey || '').slice(0, 60))`);
    const nombresAntes = new Set(await nombres());
    const antes = await progs();
    const dia = await cielo();
    ok(dia.dia > 0.99 && dia.tarde < 0.05 && dia.solY > 0.5, `${q}: de día el agua ve el sol alto (${JSON.stringify(dia)})`);
    const lagoDia = await luzDelLago();
    ok(lagoDia.luz > 30 && lagoDia.colores > 25, `${q}: el lago de día tiene color (luz ${lagoDia.luz}, ${lagoDia.colores} colores)`);
    await parar('03', 20.2); await correr(80);
    const ocaso = await cielo();
    ok(ocaso.tarde > 0.5 && ocaso.dia < 0.9 && ocaso.solY > 0 && ocaso.solY < 0.2, `${q}: al ocaso el agua ve el sol bajo y la tarde (${JSON.stringify(ocaso)})`);
    const lagoOcaso = await luzDelLago();
    ok(lagoOcaso.luz > 25 && lagoOcaso.colores > 25, `${q}: el lago al ocaso tiene color (luz ${lagoOcaso.luz}, ${lagoOcaso.colores} colores)`);
    await parar('04', 21.2); await correr(80);
    const noche = await cielo();
    ok(noche.dia < 0.2 && noche.lunaY > 0.15, `${q}: de noche el agua ve la luna (${JSON.stringify(noche)})`);
    const lagoNoche = await luzDelLago();
    ok(lagoNoche.luz > 5 && lagoNoche.colores > 15, `${q}: el lago de noche no es negro (luz ${lagoNoche.luz}, ${lagoNoche.colores} colores)`);
    await parar('05', 23); await correr(60);
    const nocheHonda = await cielo();
    ok(nocheHonda.solY < 0 && nocheHonda.lunaY > 0.3, `${q}: a las 23 el sol de verdad está bajo el horizonte y la luna arriba (${JSON.stringify(nocheHonda)})`);
    await parar('10', 12.5); await correr(60);   // el arroyo
    await parar('12', 19.2); await correr(60);   // la cascada
    await parar('08', 12.5); await correr(60);   // la orilla de cerca
    const despues = await progs();
    if (despues !== antes) console.log('   programas nuevos: ' + JSON.stringify((await nombres()).filter((n) => !nombresAntes.has(n))));
    ok(despues === antes, `${q}: ningún programa de shader nuevo en el lago de día, ocaso y noche, el arroyo, la cascada y la orilla (${antes} → ${despues})`);
    const llamadas = await js(`(() => { const R = ${H}.renderer; R.info.autoReset = false; R.info.reset(); ${H}.__bucle(); const n = R.info.render.calls; R.info.autoReset = true; return n })()`);
    ok(llamadas > 30 && llamadas < 400, `${q}: ${llamadas} dibujos por cuadro (nada raro)`);
    await js(`${H}.__camaraFija = null; 1`);
  }
  ok(errores.length === 0, 'sin errores de consola ni de shaders' + (errores.length ? ': ' + errores.join(' | ') : ''));
  console.log(fallas ? `FALLARON ${fallas} de ${pasos}` : `TODO BIEN: ${pasos} pasos OK`);
  try { app.exit(fallas ? 1 : 0); } catch { process.exit(fallas ? 1 : 0); }
});

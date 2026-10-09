// 3.8.3 — partida real del pase de bugs de «La noche de los duendes» (Electron + WebGL). Lo que sólo se ve jugando:
//   · las semillas doradas que suelta un duende al caer se juntan pasando por encima;
//   · guardar y abrir a mitad de una noche de mandamás: el jefe vivo vuelve, el abatido no.
// Uso: npx electron pruebas/humo-3-8-3-combate.cjs --user-data-dir=<carpeta>  → pruebas/salidas/combate-3-8-3/
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(__dirname, 'salidas', 'combate-3-8-3');
fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
// sólo pruebas: en algunos entornos el renderer con sandbox no carga ni una página (ERR_FAILED)
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Error|Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = '';
  const js = (c, limite = 90000) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, rej) => setTimeout(() => rej(new Error(`sin respuesta ${limite / 1000}s en ${donde}`)), limite)),
  ]);
  const ok = (cond, texto) => { pasos.push(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const H = 'window.__hojarasca';
  const url = path.join(raiz, 'index.html');
  const cargar = async () => {
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) return true; }
    return false;
  };
  const entrar = async () => { await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(1500); await js(`${H}.ajustes.limiteFps = 'libre'; 1`); };
  // la simulación avanza en pasos fijos y la prueba no pelea: se la cura
  const correr = (seg, noche = 0) => js(`(()=>{const H=${H}; for(let i=0;i<${Math.round(seg / 0.05)};i++){ H.progreso.desafio.salud = 100; H.desafio.actualizar(0.05,{noche:(${noche}), dtReal:0.05}); } return 1})()`);

  try {
    donde = 'carga';
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'})); 1`);
    ok(await cargar(), 'el modo carga');
    await entrar();
    await js(`(()=>{const H=${H}; H.progreso.desafio.tutorial = 99; H.progreso.horas = 10; return 1})()`);

    // ================================================================ las semillas que suelta un duende
    donde = 'semillas';
    const sem = await js(`(()=>{const H=${H}, js=H.jugador.estado; H.progreso.materiales.cristal = 0;
      const a = H.desafio.invocar('jefe', js.pos.x + 0.4, js.pos.z); if (!a) return {ok:false};
      H.desafio.herirDuende(a, 1e7, 'jugador');
      for (let i=0;i<10;i++) H.desafio.actualizar(0.05,{noche:0,dtReal:0.05});
      return {ok:true, cristal:H.progreso.materiales.cristal}})()`);
    ok(sem.ok && sem.cristal >= 14, `lo que suelta el mandamás se junta pasando por encima (${JSON.stringify(sem)})`);

    // ================================================================ guardar y abrir con el mandamás vivo
    const preparar = (jefeCaido) => js(`(()=>{const H=${H}, D=H.progreso.desafio; H.desafio.limpiar();
      H.progreso.horas = 22; D.oleadas = 5; D.oleadaTerminada = false; D.oleadaNoche = H.progreso.dia; D.vivos = 3; D.jefeCaido = ${jefeCaido};
      H.guardar(); return 1})()`);
    const despuesDeAbrir = async () => {
      ok(await cargar(), 'se vuelve a abrir');
      await entrar();
      await correr(14, 1);
      return js(`(()=>{const H=${H}; const v = H.desafio.aliens.filter(a=>a.estado!=='morir'&&a.estado!=='irse'); return {n:v.length, jefes:v.filter(a=>a.def.jefe).length}})()`);
    };
    donde = 'jefe vivo';
    await preparar(-1);
    const vivo = await despuesDeAbrir();
    ok(vivo.n === 3 && vivo.jefes === 1, `abierta a mitad de la noche 5, el mandamás que seguía vivo vuelve (${JSON.stringify(vivo)})`);
    donde = 'jefe abatido';
    await preparar(5);
    const caido = await despuesDeAbrir();
    ok(caido.n === 3 && caido.jefes === 0, `y el que ya habías abatido no (${JSON.stringify(caido)})`);
  } catch (e) { errores.push(`${donde}: ${e.message}`); }

  fs.writeFileSync(path.join(salida, 'informe.json'), JSON.stringify({ pasos, errores }, null, 2));
  console.log(pasos.join('\n'));
  if (errores.length) console.log('ERRORES:\n' + errores.join('\n'));
  app.exit(errores.length ? 1 : 0);
});

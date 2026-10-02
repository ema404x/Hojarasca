// 3.5.1: la revisión de bugs del Relax, en una partida de verdad (Electron + WebGL).
// Cada caso es un bug que se encontró jugando: se lo reproduce con teclas de verdad
// (KeyboardEvent) y se mira que ya no pase.
// Uso: npx electron pruebas/humo-3-5-1-relax.cjs   (HUMO_PERFIL=<carpeta> o --user-data-dir=<carpeta>
// para no pisar el perfil de las otras pruebas)
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const perfil = process.env.HUMO_PERFIL || (process.argv.find((a) => a.startsWith('--user-data-dir=')) || '').split('=')[1];
if (perfil) app.setPath('userData', path.resolve(perfil));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  const w = new BrowserWindow({ show: false, width: 1024, height: 640, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300));
  });
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error('la página no respondió en 90 s')), 90000))]);
  const ok = (cond, texto) => { pasos.push(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const listo = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) return true; } return false; };
  // las ayudas: teclas de verdad y cuadros del juego
  const AYUDA = `window.H = window.__hojarasca;
    window.cuadros = async (n = 4) => { for (let i = 0; i < n; i++) { H.__bucle(); await new Promise((r) => setTimeout(r, 5)); } };
    window.tecla = async (code, n = 4) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true })); await cuadros(n); document.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true })); await cuadros(1); };
    window.ir = (x, z) => { const j = H.jugador.estado; j.pos.set(x, H.T.altura(x, z) + 1.6, z); };
    window.notas = () => document.getElementById('notas')?.innerText || '';
    1`;
  const entrar = async () => {
    ok(await listo(), 'carga el Relax');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
    await js(AYUDA);
  };
  const ajustes = (extra = '') => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false${extra}}));`;

  try {
    await abrir();
    await js(`localStorage.clear(); ${ajustes()} 1`);
    await abrir();
    await entrar();

    // ---- 1. dormir: un segundo E durante el fundido no saltea otro día
    const sueno = await js(`(async()=>{ const P = H.progreso, j = H.jugador.estado;
      P.horas = 22; P.ramitas = 5; ir(j.pos.x + 30, j.pos.z + 10); await cuadros(8);
      await tecla('KeyF'); await cuadros(3);
      const dia = P.dia, paginas = (P.diario || []).length;
      await tecla('KeyE', 2); await new Promise((r) => setTimeout(r, 300)); await tecla('KeyE', 2);
      await new Promise((r) => setTimeout(r, 3600)); await cuadros(2);
      return { fuego: H.clima.fogata.activa, antes: dia, despues: P.dia, paginas: (P.diario || []).length - paginas } })()`);
    ok(sueno.fuego, 'hay fuego para dormir al lado');
    ok(sueno.despues === sueno.antes + 1 && sueno.paginas === 1, `dos E seguidos al dormir: un solo día y una página del diario (${JSON.stringify(sueno)})`);

    // ---- 2. el zaino que nunca se movió espera en el palenque también después de cargar
    await js(`(async()=>{ H.progreso.cosas.caballo = true; H.progreso.caballo = { x: null, z: null, yaw: 0 }; H.guardar(); return 1 })()`);
    await abrir();
    await entrar();
    const zaino = await js(`(()=>{ const d = H.dondeEstaElCaballo(), r = H.T.lugares.refugio; return { d: Math.round(Math.hypot(d.x - r.x, d.z - r.z)), cab: H.progreso.caballo } })()`);
    ok(zaino.d < 25 && zaino.cab.x === null, `al recargar, el zaino sigue en el palenque del refugio, no en el centro del mapa (${JSON.stringify(zaino)})`);

    // ---- 3. con la hora de tu reloj: una noche, un día; y la medianoche cambia el día
    const reloj = await js(`(async()=>{ const P = H.progreso, RD = Date;
      let ahora = new RD(2026, 9, 1, 23, 0, 0).getTime();
      window.Date = class extends RD { constructor(...a) { if (a.length) super(...a); else super(ahora); } static now() { return ahora; } };
      const aj = JSON.parse(localStorage.getItem('hojarasca-ajustes-v1')); aj.duracion = 'reloj'; localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(aj));
      H.ajustes.duracion = 'reloj'; await cuadros(2);
      P.cosas.manta = true; const j = H.jugador.estado;
      const d0 = P.dia;
      H.__dormir(); await new Promise((r) => setTimeout(r, 2600)); await cuadros(2);
      const d1 = P.dia;
      H.__dormir(); await new Promise((r) => setTimeout(r, 2600)); await cuadros(2);
      const d2 = P.dia, otraVez = notas();
      ahora = new RD(2026, 9, 2, 0, 0, 30).getTime(); await cuadros(2);
      const d3 = P.dia;   // ya dormida, la medianoche no suma otro
      ahora = new RD(2026, 9, 2, 23, 59, 0).getTime(); await cuadros(2);
      ahora = new RD(2026, 9, 3, 0, 1, 0).getTime(); await cuadros(2);
      const d4 = P.dia;   // sin dormir, la medianoche cambia el día
      window.Date = RD; H.ajustes.duracion = 20;
      return { d0, d1, d2, d3, d4, otraVez } })()`);
    ok(reloj.d1 === reloj.d0 + 1, `con la hora del reloj, dormir de noche pasa al día siguiente (${reloj.d0} → ${reloj.d1})`);
    ok(reloj.d2 === reloj.d1 && /Ya dormiste esta noche/.test(reloj.otraVez), `y volver a dormir la misma noche no suma otro día (${reloj.d2})`);
    ok(reloj.d3 === reloj.d2, `la medianoche de una noche ya dormida no suma (${reloj.d3})`);
    ok(reloj.d4 === reloj.d3 + 1, `sin dormir, la medianoche del reloj cambia el día (${reloj.d3} → ${reloj.d4})`);

    // ---- 4. el modo foto: la hora del deslizador no suma días ni deja dormir
    const fotoM = await js(`(async()=>{ const P = H.progreso; P.horas = 12; P.cosas.manta = true; await cuadros(2);
      const dia = P.dia, horas = P.horas;
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'F2', bubbles: true })); await cuadros(2);
      const f = H.__foto(); const activo = f.activo;
      // "En movimiento" y el deslizador casi a medianoche: antes, a los pocos segundos, pasaba el día
      document.querySelector('[data-foto-congelar="0"]')?.click();
      const r = document.querySelector('#foto-controles [data-foto="hora"]'); if (r) { r.value = '23.9'; r.dispatchEvent(new Event('input', { bubbles: true })); }
      for (let i = 0; i < 80; i++) { H.__bucle(); await new Promise((x) => setTimeout(x, 5)); }
      await tecla('KeyE', 2); await new Promise((x) => setTimeout(x, 2600));
      const enFoto = { dia: P.dia, fundido: document.getElementById('fundido').classList.contains('activo'), hora: +H.__foto().hora.toFixed(1) };
      H.guardar(); const guardada = JSON.parse(localStorage.getItem('hojarasca-v1')).horas;
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'F2', bubbles: true })); await cuadros(2);
      return { activo, dia, enFoto, guardada: +guardada.toFixed(2), horas: +horas.toFixed(2), vuelve: +P.horas.toFixed(2), despues: P.dia } })()`);
    ok(fotoM.activo && fotoM.enFoto.hora > 23.5, `F2 abre el modo foto y el deslizador va a las ${fotoM.enFoto.hora}`);
    ok(fotoM.enFoto.dia === fotoM.dia && fotoM.despues === fotoM.dia, `con el deslizador a las 23.9 y "En movimiento" no pasa el día, ni con E (${JSON.stringify(fotoM)})`);
    ok(Math.abs(fotoM.guardada - fotoM.horas) < 0.3 && Math.abs(fotoM.vuelve - fotoM.horas) < 0.3, `guardar en el modo foto guarda la hora del juego, y al salir vuelve (${fotoM.guardada}, ${fotoM.vuelve})`);

    // ---- 5. las piezas de varias etapas se levantan con Y, como las obras grandes
    const pieza = await js(`(async()=>{ const P = H.progreso; for (const k of ['tronco', 'tabla', 'piedra', 'lana', 'cristal', 'hierro']) P.materiales[k] = 999;
      const r = H.T.lugares.refugio; ir(r.x - 30, r.z + 40); H.jugador.estado.yaw = 1; await cuadros(4);
      await tecla('KeyO'); H.obras.elegir(H.PLANOS.find((p) => p.id === 'estacion-meteo')); await cuadros(2);
      const etapas = [];
      for (let i = 0; i < 2; i++) { await tecla('KeyY'); await cuadros(2); etapas.push(H.obras.obras.filter((o) => o.plano.id === 'estacion-meteo').map((o) => o.datos.etapas)); }
      await tecla('KeyO');
      return { etapas, total: H.PLANOS.find((p) => p.id === 'estacion-meteo').etapas.length } })()`);
    ok(pieza.etapas[1].length === 1 && pieza.etapas[1][0] === pieza.total, `dos Y levantan la estación meteorológica entera, no dos a medias (${JSON.stringify(pieza)})`);
  } catch (e) {
    errores.push('excepcion: ' + (e && e.message ? e.message : e));
  }
  console.log(pasos.join('\n'));
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});

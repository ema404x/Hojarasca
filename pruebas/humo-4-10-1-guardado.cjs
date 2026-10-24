// 4.10.1 — guardar y abrir a mitad de noche (partida real, Electron + WebGL): las obras perdidas y el daño de la noche siguen contando, y los
// que quedaban vivos vuelven como lo que eran (el enjambre vuelve como enjambre). Uso: npx electron pruebas/humo-4-10-1-guardado.cjs
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(__dirname, 'salidas', 'guardado-4-10-1');
fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
// sólo pruebas: en algunos entornos el renderer con sandbox no carga ni una página (ERR_FAILED)
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  const R = await import(pathToFileURL(path.join(raiz, 'src', 'desafio-reglas.js')).href);
  const N = await import(pathToFileURL(path.join(raiz, 'src', 'desafio-noches.js')).href);
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
  // la ventana oculta casi no dibuja: la simulación avanza en pasos fijos (y la prueba no pelea: se la cura)
  const simular = (seg, noche = 1) => js(`(()=>{const H=${H}; for(let i=0;i<${Math.round(seg / 0.05)};i++){ H.progreso.desafio.salud = 100; H.progreso.horas += 0.05*24/(30*60); H.desafio.actualizar(0.05,{noche:(${noche}), dtReal:0.05}); } return 1})()`);
  // quieto en la hora (para las 2 de la mañana)
  const quieto = (seg) => js(`(()=>{const H=${H}; for(let i=0;i<${Math.round(seg / 0.05)};i++){ H.progreso.desafio.salud = 100; H.desafio.actualizar(0.05,{noche:1, dtReal:0.05}); } return 1})()`);
  const hastaLaNoche = () => js(`(()=>{const H=${H}; H.progreso.dia++; H.progreso.horas=19.4; for(let i=0;i<30;i++){ H.progreso.horas+=0.01; H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); } H.progreso.horas=20.49; return 1})()`);
  const levantar = (id, d = 5, giro = 0) => js(`(()=>{const H=${H}, js=H.jugador.estado, O=H.obras, P=H.progreso;
    Object.assign(P.materiales,{tronco:90,tabla:90,piedra:90});
    const p=H.PLANOS.find(q=>q.id==='${id}'); O.elegir(p);
    for (const dd of [${d}, ${d}+2, ${d}+4]) for (const a of [${giro}, ${giro}+0.6, ${giro}-0.6]) {
      const ang=js.yaw+a, x=js.pos.x-Math.sin(ang)*dd, z=js.pos.z-Math.cos(ang)*dd;
      const r=O.fundar(x,z,js.yaw,js.pos.y); if(!r.ok) continue;
      while(r.obra.datos.etapas<r.obra.plano.etapas.length){const k=O.avanzar(r.obra,P.materiales); if(!k.ok) break;}
      O.elegir(null); P.obras=O.obras.map(o=>o.datos);
      return {ok:true, x:r.obra.datos.x, z:r.obra.datos.z};
    }
    O.elegir(null); return {error:'no hubo lugar para ${id}'}})()`);
  const notas = () => js(`[...document.querySelectorAll('#notas .nota')].map(n => (n.__titulo || '') + ' | ' + (n.__sub || ''))`);
  const estado = () => js(`(()=>{const H=${H}, D=H.progreso.desafio; return {oleadas:D.oleadas, especial:D.especial, vivos:D.vivos, aliens:H.desafio.aliens.length, terminada:D.oleadaTerminada, giro:D.giro, giroNoche:D.giroNoche, cadena:D.cadena, rescate:!!D.rescate, varada:!!D.varada}})()`);

  try {
    donde = 'carga';
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'})); 1`);
    ok(await cargar(), 'el Desafío carga');
    await entrar();

    // ================================================================ la noche 9 (enjambre y curandero)
    donde = 'noche 9';
    await js(`(()=>{const D=${H}.progreso.desafio; D.tutorial=99; D.oleadas=8; D.especial=null; D.especialAnterior=null; return 1})()`);
    const e1 = await levantar('empalizada', 6, 0), e2 = await levantar('muro-piedra', 8, 0.8);
    ok(e1.ok && e2.ok, 'dos defensas en pie');
    await hastaLaNoche();
    await js(`(()=>{const D=${H}.progreso.desafio; D.especial=null; D.especialAnterior=null; D.cadena.brecha=null; D.cadena.escapo=null; D.cadena.perfecta=false; D.cadena.vueltos=0; return 1})()`);
    await simular(30);
    const n9 = await js(`(()=>{const H=${H}, D=H.progreso.desafio, v=H.desafio.aliens.filter(a=>a.estado!=='morir'&&a.estado!=='irse'); const c={}; for(const a of v) c[a.tipo]=(c[a.tipo]||0)+1; return {oleadas:D.oleadas, terminada:D.oleadaTerminada, n:v.length, c}})()`);
    ok(n9.oleadas === 9 && !n9.terminada && (n9.c.enjambre || 0) > 0, `la noche 9 salió con enjambre (${JSON.stringify(n9.c)})`);

    // ================================================================ golpes: una defensa cae, te hieren, y quedan sólo el enjambre y el curandero
    donde = 'golpes';
    await js(`(()=>{const H=${H}; H.desafio.danarObra(H.obras.obras[0], 99999); H.desafio.herirJugador(60);
      for (const a of H.desafio.aliens) if (a.tipo !== 'enjambre' && a.tipo !== 'curandero' && a.estado !== 'morir') H.desafio.herirDuende(a, 99999, 'lanza'); return 1})()`);
    await simular(4);
    const antes = await js(`(()=>{const H=${H}, D=H.progreso.desafio; return {na:{...D.nocheActual}, quedan:[...D.quedan], vivos:D.vivos, obras:H.obras.obras.length}})()`);
    ok(antes.na.perdidas >= 1 && antes.na.dano >= 60, `la partida anota lo que pasó en la noche (${JSON.stringify(antes.na)})`);
    ok(antes.quedan.length > 0 && antes.quedan.every((t) => t === 'enjambre' || t === 'curandero' || t === 'excavador'), `y quiénes quedan vivos (${antes.quedan.join(',')})`);

    // ================================================================ guardar, cerrar y abrir
    donde = 'recargar';
    await js(`${H}.guardar(); 1`);
    ok(await cargar(), 'recarga la partida guardada');
    await entrar();
    await quieto(10);
    const desp = await js(`(()=>{const H=${H}, D=H.progreso.desafio, v=H.desafio.aliens.filter(a=>a.estado!=='morir'&&a.estado!=='irse'); const c={}; for(const a of v) c[a.tipo]=(c[a.tipo]||0)+1;
      return {na:{...D.nocheActual}, c, n:v.length, terminada:D.oleadaTerminada, oleadas:D.oleadas}})()`);
    ok(desp.na.perdidas === antes.na.perdidas && Math.round(desp.na.dano) === Math.round(antes.na.dano), `al abrir siguen las obras perdidas y el daño (${JSON.stringify(desp.na)})`);
    ok(desp.n >= 1 && Object.keys(desp.c).every((t) => t === 'enjambre' || t === 'curandero' || t === 'excavador'), `vuelven los que quedaban, como lo que eran (${JSON.stringify(desp.c)})`);
    ok(desp.n === antes.quedan.length, `y la misma cantidad (${desp.n} de ${antes.quedan.length})`);

    // ================================================================ el alba: la noche no sale «perfecta»
    donde = 'alba';
    await js(`(()=>{const H=${H}; for (const a of H.desafio.aliens) { a.estado = 'irse'; a.t = 9; } H.progreso.dia++; H.progreso.horas = 5.96; return 1})()`);
    await simular(8);
    const alba = await js(`(()=>{const D=${H}.progreso.desafio; return {terminada:D.oleadaTerminada, perfecta:D.cadena.perfecta, cadena:D.cadena, noches:D.noches, oleadas:D.oleadas, na:{...D.nocheActual}}})()`);
    ok(alba.terminada && alba.perfecta === false, `al amanecer, la noche no es «perfecta» (${JSON.stringify(alba)})`);
  } catch (e) { errores.push(`${donde}: ${e.message}`); }

  fs.writeFileSync(path.join(salida, 'informe.json'), JSON.stringify({ pasos, errores }, null, 2));
  console.log(pasos.join('\n'));
  if (errores.length) console.log('ERRORES:\n' + errores.join('\n'));
  app.exit(errores.length ? 1 : 0);
});

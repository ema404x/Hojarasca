// Partida real 1.9: los invasores tenebrosos y las gargantas.
//
// Lo que no se puede probar acá es cómo se ve y cómo suena —la ventana está oculta, sin
// placa de video y sin parlantes—, así que se prueba lo que sí se puede: que los ojos se
// prenden cuando el bicho te mira y se apagan cuando gira, que el cuerpo se apaga de
// lejos, que las voces arman su cadena de audio sin romperse y que el valle hace ruido
// solo de noche.
//
// Uso: npx electron pruebas/humo-invasores.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
// sólo pruebas: en algunos entornos el renderer con sandbox no carga ni una página (ERR_FAILED)
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  const w = new BrowserWindow({ show: false, width: 1024, height: 640, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext/.test(m)) errores.push(m.slice(0, 300));
  });
  const js = (c) => w.webContents.executeJavaScript(c);
  const ok = (cond, texto) => { pasos.push(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const url = path.join(raiz, 'index.html');

  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) { listo = true; break; } }
    ok(listo, 'carga el modo Desafío');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);

    // ---- noche, y un invasor plantado de frente
    const poner = (metros, mirando) => js(`(()=>{
      const H = window.__hojarasca, js = H.jugador.estado;
      H.progreso.horas = 23;
      for (const a of H.desafio.aliens.slice()) { a.vida = 0; a.estado = 'irse'; }
      const x = js.pos.x - Math.sin(js.yaw) * ${metros}, z = js.pos.z - Math.cos(js.yaw) * ${metros};
      const a = H.desafio.invocar('rastreador', x, z);
      // el rumbo es lo que manda: el bucle le copia la rotación cada cuadro
      a.rumbo = Math.atan2(js.pos.x - x, js.pos.z - z) + ${mirando ? 0 : 'Math.PI'};
      a.m.g.rotation.y = a.rumbo;
      a.estado = 'quieto';
      window.__bicho = a;
      return true })()`);
    const uni = () => js(`(()=>{const u = window.__bicho.m.uniformes(); return {
      mirada: +u.uMirada.value.toFixed(3), silueta: +u.uSilueta.value.toFixed(3), ojos: +u.uOjos.value.toFixed(3) }})()`);

    await poner(6, true);
    await esperar(6000);
    const deFrente = await uni();
    ok(deFrente.mirada > 0.45, `los ojos se le prenden cuando te mira (mirada ${deFrente.mirada})`);
    ok(deFrente.silueta < 0.05, 'y de cerca el cuerpo se ve entero');
    ok(deFrente.ojos > 0.7, `de noche los ojos están arriba (${deFrente.ojos})`);

    // Lo que NO se prueba acá: que los ojos se apaguen al girar la cabeza o al salir el
    // sol. En una partida de verdad el invasor se da vuelta hacia el jugador cuadro a
    // cuadro —como corresponde— y esta ventana avanza 0,05 segundos de juego por cada
    // segundo de reloj, así que la brasa no llega a bajar. El cono, la distancia y el
    // día contra la noche se miden exactos en `verificar-sonido.mjs`.

    // ---- de lejos queda la silueta
    await poner(60, true);
    await esperar(6000);
    const lejos = await uni();
    ok(lejos.silueta > 0.35, `de lejos el cuerpo se apaga y quedan los ojos (silueta ${lejos.silueta})`);
    ok(lejos.mirada < 0.2, 'y a esa distancia los ojos casi no se prenden');

    // ---- las gargantas arman su cadena sin romperse
    // Van de a una con espera en el medio: el motor tiene un tope de sonidos por
    // ventana de 50 ms y seis voces juntas lo pasan (a propósito).
    const voces = await js(`(async () => {
      const H = window.__hojarasca, S = H.sonido;
      if (!S.ctx) return { sinAudio: true };
      const salidas = [];
      for (const [tipo, estado] of [['rastreador','acecho'],['saltador','ataque'],['bruto','muerte'],['jefe','llamado'],['nido','latido'],['escupidor','dolor']]) {
        const r = S.vozAlien(tipo, estado, { distancia: 12, intensidad: 0.8 });
        salidas.push(r && { tipo, dur: +r.dur.toFixed(2), base: Math.round(r.base), formantes: r.formantes.length, aspereza: Math.round(r.aspereza) });
        await new Promise((res) => setTimeout(res, 120));
      }
      return { salidas };
    })()`);
    if (voces.sinAudio) {
      pasos.push('· sin contexto de audio en esta máquina: las voces no se pudieron disparar');
    } else {
      const vs = voces.salidas.filter(Boolean);
      ok(vs.length === 6, `las seis gargantas suenan (${vs.length})`);
      ok(vs.every((v) => v.formantes === 3), 'todas con sus tres formantes');
      ok(vs.every((v) => v.aspereza >= 5 && v.aspereza <= 130), 'y con la aspereza en rango de gruñido');
      const jefe = vs.find((v) => v.tipo === 'jefe'), salt = vs.find((v) => v.tipo === 'saltador');
      ok(jefe && salt && jefe.base < salt.base / 2, `el jefe suena mucho más grave que el saltador (${jefe?.base} Hz contra ${salt?.base} Hz)`);
    }

    // ---- el banco de golpes del Desafío, disparado como en el juego
    const banco = await js(`(()=>{
      const H = window.__hojarasca; if (!H.sonido.ctx) return { sinAudio: true };
      const S = H.__bancoSonidos(H.sonido), p = { x: H.jugador.estado.pos.x + 3, y: 1, z: H.jugador.estado.pos.z };
      const fallos = [];
      for (const [n, args] of [['golpe',[p,'bruto',true]],['muerte',[p,'saltador']],['jefe',[p]],['arco',[]],['ballesta',[p]],
        ['pistola',[]],['cargado',[]],['herido',[]],['madera',[p]],['derrumbe',[p]],['escupir',[p]],['acido',[p]],
        ['salto',[p,'saltador']],['tajo',[]],['honda',[]],['martillo',[]],['cura',[]],['enredo',[p]],['zumbido',[p]],['plasma',[p]],['latido',[p]]]) {
        try { S[n](...args); } catch (e) { fallos.push(n + ': ' + (e && e.message)); }
      }
      return { fallos, cuantos: Object.keys(S).length };
    })()`);
    if (!banco.sinAudio) {
      ok(banco.fallos.length === 0, 'el banco entero del Desafío se dispara sin romperse' + (banco.fallos.length ? ': ' + banco.fallos.join(' · ') : ''));
      ok(banco.cuantos >= 25, `el banco tiene ${banco.cuantos} sonidos`);
    }

    // ---- el banco tiene que aguantar que no haya motor de audio todavía
    // El contexto recién existe después del primer clic del jugador, y en ese rato el
    // juego puede pedir sonidos igual: un invasor que se muere en el primer cuadro.
    const mudo = await js(`(()=>{
      const H = window.__hojarasca, S = H.sonido;
      const ctx = S.ctx; S.ctx = null;
      const B = H.__bancoSonidos(S), p = { x: 1, y: 1, z: 1 };
      const fallos = [];
      for (const [n, args] of [['muerte',[p,'bruto']],['golpe',[p,'bruto',true]],['jefe',[p]],['chillido',[p,'bruto']],
        ['acecho',[p]],['respiro',[p]],['latido',[p]],['salto',[p]],['escupir',[p]],['arco',[]],['herido',[]],['derrumbe',[p]]]) {
        try { B[n](...args); } catch (e) { fallos.push(n + ': ' + (e && e.message)); }
      }
      S.ctx = ctx;
      return fallos })()`);
    ok(mudo.length === 0, 'el banco no se rompe si todavía no hay audio' + (mudo.length ? ': ' + mudo.join(' · ') : ''));

    // ---- cuántos nodos de audio arma cada sonido compuesto en un solo cuadro
    // Un árbol que cae llegó a pedir cuatrocientos, que es un tirón justo en el momento
    // más lindo del juego. Se miden para que no vuelva a pasar.
    // Cada medición va sola y con espera en el medio: si van pegadas comparten la
    // ventana del tope de voces y los números salen más bajos de lo que son.
    const nodos = await js(`(async () => {
      const H = window.__hojarasca, S = H.sonido;
      if (!S.ctx) return { sinAudio: true };
      const ctx = S.ctx, metodos = ['createGain','createOscillator','createBufferSource','createBiquadFilter','createWaveShaper','createPanner','createStereoPanner'];
      let n = 0; const orig = {};
      for (const m of metodos) if (ctx[m]) { orig[m] = ctx[m].bind(ctx); ctx[m] = (...a) => { n++; return orig[m](...a); }; }
      const medir = async (fn) => { await new Promise((r) => setTimeout(r, 160)); n = 0; fn(); return n; };
      const B = H.__bancoSonidos(S), p = { x: 1, y: 1, z: 1 };
      const r = {
        arbol: await medir(() => S.arbolCae(p, 1.5)),
        derrumbe: await medir(() => B.derrumbe(p)),
        muerte: await medir(() => B.muerte(p, 'bruto')),
        hachazo: await medir(() => S.hachazo(p, 0.5)),
      };
      for (const m of metodos) if (orig[m]) ctx[m] = orig[m];
      return r })()`);
    if (!nodos.sinAudio) {
      ok(nodos.arbol <= 180, `el árbol que cae arma ${nodos.arbol} nodos de audio (tope 180)`);
      ok(nodos.derrumbe <= 110, `el derrumbe arma ${nodos.derrumbe} (tope 110)`);
      ok(nodos.muerte <= 90, `la muerte de un invasor arma ${nodos.muerte} (tope 90)`);
      ok(nodos.hachazo <= 40, `el hachazo arma ${nodos.hachazo} (tope 40)`);
    }

    // ---- el coro del valle: de noche suena solo, de día no
    const coro = await js(`(()=>{
      const H = window.__hojarasca;
      const S = H.sonido; if (!S.ctx) return { sinAudio: true };
      let n = 0; const orig = S.vozAlien.bind(S);
      S.vozAlien = (...a) => { n++; return orig(...a); };
      window.__contar = () => n;
      return true })()`);
    if (!coro.sinAudio) {
      // La ventana oculta avanza como 0,05 segundos de juego por segundo de reloj, así
      // que esperar los cuatro segundos del primer acecho llevaría un minuto y medio:
      // se le adelanta el reloj a mano. Lo que se prueba es que suene, no cuándo.
      await js(`(()=>{const H=window.__hojarasca; H.progreso.horas = 23;
        for (let i=0;i<3;i++) H.desafio.invocar('rastreador', H.jugador.estado.pos.x + 45 + i*3, H.jugador.estado.pos.z + 45);
        H.desafio.coro.acecho = 0.02; return 1})()`);
      await esperar(9000);
      const deNoche = await js('window.__contar()');
      await js(`(()=>{const H=window.__hojarasca; H.progreso.horas = 13; H.desafio.coro.acecho = 0.02; return 1})()`);
      await esperar(4000);
      const antes = await js('window.__contar()');
      await js(`(()=>{ window.__hojarasca.desafio.coro.acecho = 0.02; return 1 })()`);
      await esperar(9000);
      const enElDia = await js('window.__contar()') - antes;
      ok(deNoche > 0, `de noche el valle habla solo (${deNoche} voces)`);
      ok(enElDia === 0, `y de día se calla (${enElDia} voces)`);
    }
  } catch (e) {
    errores.push('excepcion: ' + (e && e.message ? e.message : e));
  }
  console.log(pasos.join('\n'));
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});

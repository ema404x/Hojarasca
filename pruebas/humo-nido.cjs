// Prueba de partida real del segundo acto del Desafío: el nido (Electron + WebGL).
// Lo que las pruebas de Node no pueden ver: que la malla se arme, que el caparazón
// se abra de día y se cierre de noche, que las armas de siempre le peguen por el
// mismo camino que a los núcleos de la nodriza, que el mapa dibuje el cerco y que
// al reventarlo se terminen las noches.
// Uso: npx electron pruebas/humo-nido.cjs   → pruebas/salidas/nido/
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(__dirname, 'salidas', 'nido');
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
  const js = (c, limite = 60000) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, rej) => setTimeout(() => rej(new Error(`sin respuesta ${limite / 1000}s en ${donde}`)), limite)),
  ]);
  const ok = (cond, texto) => { pasos.push(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const foto = async (nombre) => fs.writeFileSync(path.join(salida, nombre + '.jpg'), (await w.webContents.capturePage()).toJPEG(72));
  // Ventana oculta sin GPU: la simulación avanza en pasos fijos, no por reloj real.
  const correr = (cuadros) => js(`(()=>{const H=window.__hojarasca; for(let i=0;i<${cuadros};i++) H.desafio.actualizar(0.05,{noche:1}); return 1})()`);
  const url = path.join(raiz, 'index.html');
  const cargar = async () => {
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 240; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) return true; }
    return false;
  };

  try {
    // ---- entrar al Desafío
    donde = 'cargar';
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'desafio'})); 1`);
    ok(await cargar(), 'el Desafío carga');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2000);
    ok(await js(`window.__hojarasca.modoJuego === 'desafio'`), 'entra en modo Desafío');
    ok(await js(`window.__hojarasca.progreso.desafio.nido === null`), 'una partida en curso todavía no tiene nido');

    // ---- se planta el nido como lo haría la caída de la nodriza, al lado del jugador
    donde = 'plantar';
    await js(`(()=>{const H=window.__hojarasca, D=H.progreso.desafio, p=H.jugador.estado.pos;
      D.victoria = true;
      D.nido = { x: p.x + 40, z: p.z, pistas: 0, cercoX: p.x + 40, cercoZ: p.z, camaras: [800, 800, 800], caido: false };
      H.progreso.horas = 12; return 1})()`);
    await correr(20);
    const buscando = await js(`(()=>{const H=window.__hojarasca; const n = H.desafio.nido;
      return {radio: n && n.radio, revelado: n && n.revelado, blancos: H.desafio.eventos.blancos().length}})()`);
    ok(buscando.radio > 0 && buscando.revelado === false, `sin ubicar, el mapa recibe el cerco (${Math.round(buscando.radio)} m)`);
    ok(buscando.blancos === 0, 'sin ubicar no hay a qué dispararle');

    // ---- el mapa dibuja el cerco sin romperse
    donde = 'mapa';
    await js(`window.__hojarasca.abrir('mapa'); 1`); await esperar(900);
    ok(await js(`!document.getElementById('mapa').classList.contains('oculto')`), 'el mapa abre con el cerco dibujado');
    await foto('01-cerco');
    await js(`window.__hojarasca.volverAlJuego(); 1`); await esperar(600);

    // ---- las tres señales lo ubican
    donde = 'ubicar';
    const pistas = await js(`(()=>{const H=window.__hojarasca, D=H.progreso.desafio, radios=[];
      for (let i=0;i<3;i++){ H.desafio.eventos.pistaDeNido(); const n=H.desafio.nido; radios.push(n && n.radio ? Math.round(n.radio) : 0); }
      return {radios, pistas: D.nido.pistas, revelado: H.desafio.nido.revelado}})()`);
    ok(pistas.radios[0] > pistas.radios[1] && pistas.radios[1] > pistas.radios[2], `cada señal achica el cerco (${pistas.radios.join(' → ')})`);
    ok(pistas.pistas === 3 && pistas.revelado === true, 'con las tres queda marcado en el mapa');

    // ---- de día se abre: la malla existe y las cámaras son blanco
    donde = 'abrir';
    await correr(60);
    const dia = await js(`(()=>{const H=window.__hojarasca, E=H.desafio.eventos, b=E.blancos();
      return {blancos: b.length, radio: b[0] && b[0].radio, esNido: !!(b[0] && b[0].nido),
      alto: b[0] ? +b[0].pos.y.toFixed(2) : null}})()`);
    ok(dia.blancos === 3 && dia.esNido, 'de día quedan a tiro las tres cámaras de cría');
    ok(dia.radio > 0 && Number.isFinite(dia.alto), 'las cámaras tienen posición en el mundo (la malla se armó)');

    // ---- de noche el caparazón se cierra
    donde = 'cerrar';
    await js(`window.__hojarasca.progreso.horas = 2; 1`);
    await correr(40);
    ok(await js(`window.__hojarasca.desafio.eventos.blancos().length === 0`), 'de noche está cerrado: no hay a qué apuntarle');
    const golpeNoche = await js(`(()=>{const H=window.__hojarasca, D=H.progreso.desafio;
      const antes = D.nido.camaras.reduce((s,v)=>s+v,0);
      H.desafio.eventos.herirNucleo({nido:true, i:0, mesh:{}, aro:{}, pos:{x:0,y:0,z:0}}, 500);
      return antes === D.nido.camaras.reduce((s,v)=>s+v,0)})()`);
    ok(golpeNoche, 'de noche no le entra nada ni forzando el golpe');

    // ---- de día, el arma de siempre le pega por el mismo camino que a la nodriza
    donde = 'disparar';
    await js(`window.__hojarasca.progreso.horas = 12; 1`);
    await correr(40);
    // `disparoRayo` parte de la cámara, que en el juego mueve el bucle principal.
    // Acá el bucle no corre (ventana oculta, simulación a pasos), así que la cámara
    // se ubica a mano: es lo único que se falsea, el rayo y el blanco son los de verdad.
    const tiro = await js(`(()=>{const H=window.__hojarasca, D=H.progreso.desafio, js=H.jugador.estado, E=H.desafio.eventos;
      H.progreso.cosas.pistola = 1; D.cargas = 99;
      const n = D.nido, blanco = E.blancos()[0];
      if (!blanco) return {pego:false, motivo:'sin blanco'};
      const dx = n.x - js.pos.x, dz = n.z - js.pos.z, d = Math.hypot(dx, dz) || 1;
      js.pos.x = n.x - dx/d * 8; js.pos.z = n.z - dz/d * 8; js.pos.y = H.T.altura(js.pos.x, js.pos.z);
      H.camara.position.set(js.pos.x, js.pos.y + 1.6, js.pos.z);
      H.camara.lookAt(blanco.pos.x, blanco.pos.y, blanco.pos.z);
      H.camara.updateMatrixWorld(true);
      const antes = n.camaras.reduce((s,v)=>s+v,0);
      for (let i=0;i<6;i++){ H.desafio.atacar('pistola'); H.desafio.actualizar(0.3, {noche:0}); }
      const ahora = n.camaras.reduce((s,v)=>s+v,0);
      return {pego: ahora < antes, antes, ahora,
        altura: +(blanco.pos.y - H.T.altura(n.x, n.z)).toFixed(2),
        dist: +H.camara.position.distanceTo(blanco.pos).toFixed(1)};})()`);
    ok(tiro.pego, `la pistola de plasma le pega sin tocar el código de combate (${tiro.antes} → ${tiro.ahora})`);
    ok(tiro.altura > 1, `las cámaras quedan sobre el suelo y no enterradas (${tiro.altura} m)`);
    await foto('02-nido-abierto');

    // ---- y también se le entra a hachazos: si no, el que nunca fabricó un arco
    // se quedaría sin forma de terminar el Desafío
    donde = 'hachazo';
    const hacha = await js(`(()=>{const H=window.__hojarasca, D=H.progreso.desafio, js=H.jugador.estado, E=H.desafio.eventos;
      const b = E.blancos()[0];
      if (!b) return {pego:false, motivo:'sin blanco'};
      js.pos.x = b.pos.x + 5; js.pos.z = b.pos.z; js.pos.y = H.T.altura(js.pos.x, js.pos.z);
      js.yaw = Math.atan2(-(b.pos.x - js.pos.x), -(b.pos.z - js.pos.z));
      const antes = D.nido.camaras.reduce((s,v)=>s+v,0);
      for (let i=0;i<5;i++){ H.desafio.atacar('hacha'); H.desafio.actualizar(0.7, {noche:0}); }
      const ahora = D.nido.camaras.reduce((s,v)=>s+v,0);
      return {pego: ahora < antes, antes, ahora};})()`);
    ok(hacha.pego, `el hacha también le entra (${hacha.antes} → ${hacha.ahora})`);
    const lejos = await js(`(()=>{const H=window.__hojarasca, D=H.progreso.desafio, js=H.jugador.estado, E=H.desafio.eventos;
      const b = E.blancos()[0];
      js.pos.x = b.pos.x + 40; js.pos.z = b.pos.z;
      js.yaw = Math.atan2(-(b.pos.x - js.pos.x), -(b.pos.z - js.pos.z));
      const antes = D.nido.camaras.reduce((s,v)=>s+v,0);
      for (let i=0;i<4;i++){ H.desafio.atacar('hacha'); H.desafio.actualizar(0.7, {noche:0}); }
      return antes === D.nido.camaras.reduce((s,v)=>s+v,0)})()`);
    ok(lejos, 'pero de cuarenta metros el hacha no llega');

    // ---- se revienta de a una cámara
    donde = 'romper';
    const rotas = await js(`(()=>{const H=window.__hojarasca, D=H.progreso.desafio, E=H.desafio.eventos;
      const marcas = [];
      for (let vuelta=0; vuelta<12 && !D.nido.caido; vuelta++) {
        const b = E.blancos();
        if (!b.length) break;
        E.herirNucleo(b[0], 400);
        marcas.push(D.nido.camaras.filter(v=>v>0).length);
      }
      return {marcas, caido: D.nido.caido, camaras: D.nido.camaras}})()`);
    // Dos golpes de 400 por cámara de 800: 3,2,2,1,1,0. Nunca sube y nunca salta de a dos.
    const bajaDeAUna = rotas.marcas.every((v, i) => i === 0 || (v <= rotas.marcas[i - 1] && rotas.marcas[i - 1] - v <= 1));
    ok(bajaDeAUna && rotas.marcas[rotas.marcas.length - 1] === 0, `las cámaras caen de a una (${rotas.marcas.join(' ')})`);
    ok(rotas.caido && rotas.camaras.every((v) => v === 0), 'con la última, el nido cae');

    // ---- se terminan las noches y hay final propio
    donde = 'final';
    await correr(20);
    const fin = await js(`(()=>{const H=window.__hojarasca;
      return {mapa: H.desafio.nido, hud: document.getElementById('desafio-estado').textContent,
      titulo: document.getElementById('victoria-titulo').textContent}})()`);
    ok(fin.mapa === null, 'el nido caído sale del mapa');
    await js(`window.__hojarasca.progreso.horas = 21; 1`);
    await correr(40);
    const noche = await js(`(()=>{const H=window.__hojarasca, D=H.progreso.desafio;
      return {aliens: H.desafio.aliens.length, terminada: D.oleadaTerminada, hud: document.getElementById('desafio-estado').textContent}})()`);
    ok(noche.aliens === 0 && noche.terminada, 'pasadas las nueve de la noche ya no baja nadie');
    ok(/la cueva se derrumbó/i.test(noche.hud), `el HUD lo dice: "${noche.hud}"`);
    await foto('03-noche-sin-nadie');

    // ---- y sobrevive a una recarga
    donde = 'recarga';
    await js(`window.__hojarasca.guardar(); 1`);
    ok(await cargar(), 'recarga la partida');
    const tras = await js(`(()=>{const D=window.__hojarasca.progreso.desafio; return {caido: D.nido && D.nido.caido, victoria: D.victoria}})()`);
    ok(tras.caido === true && tras.victoria === true, 'el nido caído se guarda y vuelve caído');
  } catch (e) { errores.push(`${donde}: ${e.message}`); }

  fs.writeFileSync(path.join(salida, 'informe.json'), JSON.stringify({ pasos, errores }, null, 2));
  console.log(pasos.join('\n'));
  if (errores.length) console.log('ERRORES:\n' + errores.join('\n'));
  app.exit(errores.length ? 1 : 0);
});

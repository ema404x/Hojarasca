// 4.8 noches — partida real (Electron + WebGL) de las noches distintas del Desafío:
//   · una noche de niebla (aviso, estado) con un giro a las dos de la mañana (niebla, refuerzos, defensa que se quiebra);
//   · el encadenamiento: un duende que se escapa con lo robado, los que siguen en pie al alba y la defensa sin arreglar
//     cambian la noche siguiente (más duendes, la nave baja por donde quedó rota la defensa, el aviso de la tarde);
//   · una noche de luna llena: casi todos viejos;
//   · guardar y recargar (y una partida de antes de la 4.8 que carga limpia).
// Uso: npx electron pruebas/humo-4-8-noches.cjs --user-data-dir=<carpeta>  → pruebas/salidas/noches-4-8/
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(__dirname, 'salidas', 'noches-4-8');
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
    const nuevo = await js(`(()=>{const D=${H}.progreso.desafio; return {giro:D.giro, giroNoche:D.giroNoche, cadena:D.cadena}})()`);
    ok(nuevo.giro === null && nuevo.giroNoche === -1 && nuevo.cadena && nuevo.cadena.paraNoche === 0, 'una partida nueva arranca sin giro ni cadena');

    // ================================================================ las defensas y la noche de niebla (la 6)
    donde = 'defensas';
    await js(`(()=>{const D=${H}.progreso.desafio; D.tutorial=99; D.oleadas=5; D.especial=null; D.especialAnterior=null; return 1})()`);
    const e1 = await levantar('empalizada', 6, 0), e2 = await levantar('muro-piedra', 8, 0.8);
    ok(e1.ok && e2.ok, `dos defensas en pie (${JSON.stringify([e1, e2])})`);

    donde = 'niebla';
    await hastaLaNoche();
    // el aviso de una hora antes ya decidió la noche al azar: se fuerza la niebla
    await js(`(()=>{const D=${H}.progreso.desafio; D.especial='niebla'; D.especialAnterior=null; D.cadena.brecha=null; return 1})()`);
    await simular(25);
    const n1 = await estado();
    ok(n1.especial === 'niebla' && n1.oleadas === 6 && !n1.terminada && n1.vivos > 0, `la noche 6 es de niebla y salieron duendes (${JSON.stringify({ e: n1.especial, o: n1.oleadas, v: n1.vivos })})`);
    ok((await notas()).some((t) => /Noche de niebla/.test(t)), 'el aviso de salida nombra la niebla');
    ok(n1.vivos === Math.round(R.composicionOleada(6).length * R.ESPECIALES.niebla.cantidad), `y vienen un 15% más (${n1.vivos})`);

    // ================================================================ el giro de las dos
    donde = 'giros';
    await js(`(()=>{const H=${H}, D=H.progreso.desafio; D.especial=null; D.semilla=null; H.progreso.dia++; H.progreso.horas=2.05; return 1})()`);   // (con código de partida el azar de la noche es siempre el mismo: sin código, cada tirada es distinta)   // (pasó la medianoche; se saca la niebla de la noche para ver el giro)
    const vistos = {};
    let giroFinal = null;
    for (let intento = 0; intento < 160 && Object.keys(vistos).length < 3; intento++) {
      await js(`(()=>{const H=${H}, D=H.progreso.desafio; D.giro=null; D.giroNoche=-1; D.giroAnterior=null; D.refuerzoNoche=-1; H.progreso.horas=2.05; return 1})()`);
      const antes = await estado();
      await quieto(0.1);
      let despues = await estado();
      if (despues.giro && despues.giro.id === 'refuerzos') { await esperar(3800); await quieto(0.1); despues = await estado(); }   // los refuerzos bajan a los 3,5 s
      if (despues.giro && !vistos[despues.giro.id]) {
        const g = despues.giro.id;
        const info = { noche: despues.giro.noche, antes: antes.vivos, despues: despues.vivos, notas: await notas() };
        if (g === 'defensa') info.vidas = await js(`${H}.obras ? ${H}.obras.obras.filter(o=>o.plano.categoria==='defensa').map(o=>o.datos.vida) : null`);
        vistos[g] = info; giroFinal = g;
      }
    }
    ok(Object.keys(vistos).length === 3, `los tres giros salieron (${Object.keys(vistos).join(', ')})`);
    if (vistos.niebla) ok(vistos.niebla.noche === 6 && vistos.niebla.notas.some((t) => /Baja la niebla/.test(t)), 'baja la niebla: queda anotada y se avisa en pantalla');
    if (vistos.refuerzos) ok(vistos.refuerzos.despues > vistos.refuerzos.antes && vistos.refuerzos.notas.some((t) => /refuerzos/i.test(t)), `llegan refuerzos (${vistos.refuerzos.antes} → ${vistos.refuerzos.despues})`);
    if (vistos.defensa) ok(vistos.defensa.notas.some((t) => /cruje en la base|Se quebró/.test(t)), 'se quiebra una defensa: aviso en pantalla');
    // una vez por noche: ya decidido, no vuelve a tirar
    await js(`(()=>{const D=${H}.progreso.desafio; D.giro=null; D.giroNoche=6; return 1})()`);
    await quieto(1);
    ok((await estado()).giro === null, 'una sola tirada por noche');

    // ================================================================ el amanecer: lo de anoche encadena
    donde = 'encadenar';
    await js(`(()=>{const H=${H}, D=H.progreso.desafio;
      // la defensa más fuerte queda rota (sin arreglar) y un duende se escapa con la leña
      const o = H.obras.obras.filter(q => q.plano.categoria==='defensa').sort((a,b)=>b.datos.vida - a.datos.vida)[0]; o.datos.vida = 20;
      const a = H.desafio.aliens.find(q => q.estado !== 'morir' && q.estado !== 'irse');
      a.robo = { cosa:'tabla', n:1, t:0 }; H.desafio.soltarRobo(a, false);
      D.giro = null; D.salud = 100; return 1})()`);
    const prev = await estado();
    await js(`(()=>{const H=${H}; H.progreso.horas=6.05; H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); return 1})()`);
    const alba = await estado();
    ok(alba.terminada && alba.giro === null, 'al amanecer el giro se limpia');
    ok(alba.cadena.paraNoche === 7, `la cadena es para la noche 7 (${JSON.stringify(alba.cadena)})`);
    ok(alba.cadena.escapo && alba.cadena.escapo.cosa === 'tabla', 'quedó anotado el que se escapó con la leña');
    ok(alba.cadena.vueltos >= 1, `y los que seguían en pie con la primera luz (${alba.cadena.vueltos})`);
    ok(typeof alba.cadena.perfecta === 'boolean', `(si te hirieron o perdiste obras, la que viene no es más grande: ${alba.cadena.perfecta})`);

    // la tarde del otro día: aviso, la defensa rota y el tamaño de la noche 7
    donde = 'noche 7';
    await js(`(()=>{const H=${H}; H.progreso.dia++; H.progreso.horas=19.4; for(let i=0;i<30;i++){ H.progreso.horas+=0.01; H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); } return 1})()`);
    const tarde = await estado();
    ok(tarde.cadena.brecha && tarde.cadena.brecha.noche === 7, `una hora antes se ve la defensa sin arreglar (${JSON.stringify(tarde.cadena.brecha)})`);
    await esperar(6600);
    const avisos = await notas();
    ok(avisos.some((t) => /Lo de anoche no se olvida/.test(t) && /escap(ó con tu leña|aron con tus cosas)/.test(t) && /entran por ahí/.test(t)), `el aviso cuenta lo de anoche (${avisos.join(' // ')})`);
    // sin noche especial, para contar (y sin rescate ni tren varado)
    await js(`(()=>{const D=${H}.progreso.desafio; D.especial=null; D.especialAnterior=null; return 1})()`);
    await js(`(()=>{const H=${H}; H.progreso.horas=20.49; return 1})()`);
    await js(`(()=>{const H=${H}, D=H.progreso.desafio; D.especial=null; return 1})()`);
    await simular(45);
    const n7 = await estado();
    n7.vivos = await js(`${H}.desafio.aliens.filter(a => a.estado !== 'morir' && a.estado !== 'irse').length`);   // (sin los que se iban del alba)
    const base = R.composicionOleada(7);
    const esperada = N.aplicarCadena(base, N.efectoCadena(tarde.cadena, 7)).length;
    ok(!n7.especial && n7.oleadas === 7, 'noche 7 común');
    ok(n7.vivos >= Math.min(24, esperada) && esperada > base.length,   // (puede haber más: se abren los nidos de hongos de anoche)
       `la noche 7 viene más grande por lo de anoche (${base.length} → ${n7.vivos}, esperado ${esperada})`);
    if (!n7.rescate && !n7.varada) {
      const cerca = await js(`(()=>{const H=${H}, b=H.progreso.desafio.cadena.brecha, n=H.desafio.nave.position; return b ? Math.round(Math.hypot(n.x-b.x, n.z-b.z)) : -1})()`);
      ok(cerca >= 38 && cerca <= 60, `la nave baja a ${cerca} m de la defensa rota`);
    }

    // ================================================================ guardar y recargar a mitad de noche
    donde = 'recargar';
    const antesGuardar = await estado();
    await js(`${H}.guardar(); 1`);
    ok(await cargar(), 'recarga la partida guardada');
    await entrar();
    await quieto(1);
    const trasCarga = await estado();
    ok(JSON.stringify(trasCarga.cadena) === JSON.stringify(antesGuardar.cadena) && trasCarga.oleadas === 7, `la cadena vuelve igual (${JSON.stringify(trasCarga.cadena).slice(0, 120)})`);
    ok(trasCarga.vivos >= 1, `y los duendes que quedaban vuelven (${trasCarga.vivos})`);

    // ================================================================ luna llena (la 8)
    donde = 'luna llena';
    await js(`(()=>{const H=${H}, D=H.progreso.desafio; for (const a of H.desafio.aliens) { a.estado='irse'; a.t=9; } D.oleadaTerminada=true; D.vivos=0; D.cadena.paraNoche=0; D.cadena.brecha=null; D.cadena.escapo=null; D.cadena.perfecta=false; D.cadena.vueltos=0; return 1})()`);
    await js(`(()=>{const H=${H}; H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); H.progreso.horas=8; return 1})()`);
    await hastaLaNoche();
    await js(`(()=>{const D=${H}.progreso.desafio; D.especial='lunallena'; D.especialAnterior=null; return 1})()`);
    await simular(30);
    const luna = await js(`(()=>{const H=${H}, D=H.progreso.desafio; const v = H.desafio.aliens.filter(a => a.estado !== 'morir' && a.estado !== 'irse' && !a.def.jefe);
      return {especial:D.especial, oleadas:D.oleadas, total:v.length, viejos:v.filter(a => a.m.viejo).length, brutos:v.filter(a => a.tipo==='bruto').length}})()`);
    ok(luna.especial === 'lunallena' && luna.oleadas === 8 && luna.total >= 8, `la noche 8 es de luna llena (${JSON.stringify(luna)})`);
    ok(luna.viejos / luna.total >= 0.7, `casi todos vienen de viejos (${luna.viejos} de ${luna.total})`);
    ok(luna.brutos / luna.total >= 0.25, `con más grandotes (${luna.brutos})`);

    // ================================================================ una partida de la 4.7: carga limpia
    donde = 'partida vieja';
    await js(`(()=>{const H=${H}, D=H.progreso.desafio; delete D.giro; delete D.giroNoche; delete D.giroAnterior; delete D.cadena; H.guardar(); return 1})()`);
    ok(await cargar(), 'carga una partida sin los campos de la 4.8');
    await entrar();
    await quieto(1);
    const vieja = await js(`(()=>{const D=${H}.progreso.desafio; return {giro:D.giro, giroNoche:D.giroNoche, giroAnterior:D.giroAnterior, cadena:D.cadena}})()`);
    ok(vieja.giro === null && vieja.giroNoche === -1 && vieja.giroAnterior === null && vieja.cadena && vieja.cadena.paraNoche === 0 && vieja.cadena.brecha === null, 'y queda con el giro y la cadena limpios');
  } catch (e) { errores.push(`${donde}: ${e.message}`); }

  fs.writeFileSync(path.join(salida, 'informe.json'), JSON.stringify({ pasos, errores }, null, 2));
  console.log(pasos.join('\n'));
  if (errores.length) console.log('ERRORES:\n' + errores.join('\n'));
  app.exit(errores.length ? 1 : 0);
});

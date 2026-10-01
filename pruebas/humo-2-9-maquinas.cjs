// Partida real 2.9 (Electron + WebGL): el molino de agua en la orilla del arroyo y el
// aserradero al lado (se cargan troncos con E, pasa el tiempo, se sacan tablas), la muela
// con habas de la huerta, la estación meteorológica (el pronóstico que dice es el tiempo
// que después viene de verdad), la radio (mensajes, un pedido que se manda) y que todo
// siga igual después de recargar. Al final, en el Desafío, la estación anuncia la noche.
// Las teclas van de verdad (keydown). Guarda y devuelve el localStorage que había.
// Uso: npx electron pruebas/humo-2-9-maquinas.cjs   (HUMO_PERFIL=<carpeta> para un perfil aparte)
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: false, width: 1024, height: 640, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = 'carga';
  const js = (c) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 120 s (${donde})`)), 120000)),
  ]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const H = 'window.__hojarasca';
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const listo = async () => {
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__maquinas)').catch(() => false)) return true; }
    return false;
  };
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    await js(`(()=>{ ${H}.volverAlJuego?.(); ${H}.ajustes.limiteFps = 'libre'; return 1 })()`);
  };
  const ajustesPrueba = (modo) => `(()=>{ localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'muybaja', clima: 'variable', estacion: 'verano', musica: false, modo: '${modo}', autoCalidad: false, guiaPrimerDia: false })); return 1 })()`;
  const tecla = (code) => js(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'${code}',bubbles:true})); 1`);
  const cuadros = (n = 4) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  const aviso = async (re) => { let a = ''; for (let i = 0; i < 20; i++) { await cuadros(3); a = await js(`${H}.__aviso()`); if (re.test(a)) break; await esperar(120); } return a; };
  const charla = () => js(`({ abierta: !document.getElementById('charla').classList.contains('oculto'), quien: document.getElementById('charla-quien').textContent, texto: document.getElementById('charla-texto').textContent })`);
  const notas = () => js(`document.getElementById('notas').textContent`);
  // parado a `d` metros de (x, z), del lado de (desdeX, desdeZ), mirando la obra
  const pararse = (x, z, d, desdeX, desdeZ) => js(`(()=>{ const T = ${H}.T, j = ${H}.jugador.estado;
    let dx = (${desdeX}) - (${x}), dz = (${desdeZ}) - (${z}); const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    const px = (${x}) + dx * (${d}), pz = (${z}) + dz * (${d});
    j.pos.set(px, T.altura(px, pz) + 0.05, pz); j.yaw = Math.atan2(dx, dz); j.pitch = -0.1; j.sentado = false; return 1 })()`);
  // una pieza terminada en el primer lugar que sirva de la lista [[x, z, yaw], ...]
  const levantar = (id, lugares) => js(`(()=>{ const O = ${H}.obras, P = ${H}.progreso, T = ${H}.T;
    Object.assign(P.materiales, { tronco: 80, tabla: 80, piedra: 80 });
    const p = ${H}.PLANOS.find((q) => q.id === '${id}'); if (!p) return { error: 'no hay plano ${id}' };
    for (const [x, z, yaw] of ${JSON.stringify(lugares)}) {
      O.elegir(p); const r = O.fundar(x, z, yaw, T.altura(x, z)); if (!r.ok) continue;
      for (let g = 0; g < 12 && r.obra.datos.etapas < r.obra.plano.etapas.length; g++) { const k = O.avanzar(r.obra, P.materiales); if (!k.ok) break; }
      O.elegir(null); P.obras = O.obras.map((o) => o.datos);
      return { ok: r.obra.datos.etapas >= r.obra.plano.etapas.length, x: r.obra.datos.x, z: r.obra.datos.z, y: r.obra.datos.y, rot: r.obra.datos.rot };
    }
    O.elegir(null); return { error: 'no hubo lugar para ${id}' } })()`);
  const alrededor = (x, z, radios, pasos = 12) => { const l = []; for (const r of radios) for (let i = 0; i < pasos; i++) { const a = (i / pasos) * Math.PI * 2; l.push([x + Math.cos(a) * r, z + Math.sin(a) * r, a]); } return l; };
  const obraEn = (id, x, z) => `${H}.obras.obras.find((o) => o.plano.id === '${id}' && Math.abs(o.datos.x - (${x})) < 0.01 && Math.abs(o.datos.z - (${z})) < 0.01)`;
  const pasarHoras = (h) => js(`(()=>{ const P = ${H}.progreso; P.horas += (${h}); while (P.horas >= 24) { P.horas -= 24; P.dia++; } return 1 })()`);
  let copiaStorage = null;

  try {
    await abrir();
    copiaStorage = await js(`JSON.stringify(Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])))`);
    await js(ajustesPrueba('relax'));
    await abrir();
    ok(await listo(), 'carga el Relax');
    await entrar();
    await js(`(()=>{ const P = ${H}.progreso; P.horas = 10; P.tormenta.crecida = 0; ${H}.__U().uInvierno.value = 0; return 1 })()`);

    // ================================================================ el molino y el aserradero
    seccion('1. el molino en la orilla del arroyo');
    const lejos = await levantar('molino-agua', alrededor(await js(`${H}.T.lugares.refugio.x`), await js(`${H}.T.lugares.refugio.z`), [14, 18], 8));
    ok(!!lejos.error, 'lejos del arroyo no se puede');
    // se busca una orilla donde entren los dos: el molino con la rueda en el agua y el
    // aserradero en tierra, a menos de 14 m (se prueba con el fantasma, sin fundar)
    const par = await js(`(()=>{ const H = ${H}, O = H.obras, T = H.T, rio = T.rio;
      const pm = H.PLANOS.find((q) => q.id === 'molino-agua'), pa = H.PLANOS.find((q) => q.id === 'aserradero');
      for (let i = 30; i < rio.length - 30; i += 3) {
        const a = rio[i - 2], b = rio[i + 2]; let tx = b.x - a.x, tz = b.z - a.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
        for (const lado of [1, -1]) for (let d = 2; d < 10; d += 0.5) {
          const nx = -tz * lado, nz = tx * lado, x = rio[i].x + nx * d, z = rio[i].z + nz * d;
          // la rueda (+X de la obra) mira al agua: (cos rot, -sin rot) = -n
          const rot = Math.atan2(nz, -nx);
          O.elegir(pm); const m = O.moverFantasma(x, z, rot, T.altura(x, z));
          if (!m?.ok) continue;
          O.elegir(pa);
          for (const r of [6, 8, 10, 12]) for (let j = 0; j < 16; j++) {
            const ang = (j / 16) * Math.PI * 2, ax = m.x + Math.cos(ang) * r, az = m.z + Math.sin(ang) * r;
            if (Math.hypot(ax - rio[i].x, az - rio[i].z) < d + 3) continue;
            const q = O.moverFantasma(ax, az, 0, T.altura(ax, az));
            if (q?.ok) { O.elegir(null); return { molino: [m.x, m.z, m.rot], aserradero: [q.x, q.z, 0], rx: rio[i].x, rz: rio[i].z }; }
          }
        }
      }
      O.elegir(null); return { error: 'no hubo orilla' } })()`);
    ok(!par.error, `hay una orilla con lugar para los dos (${JSON.stringify(par)})`);
    const molino = { ...(await levantar('molino-agua', [par.molino])), rx: par.rx, rz: par.rz };
    ok(molino.ok, `el molino se levanta en la orilla, con la rueda en el agua (${JSON.stringify(molino)})`);
    const aserr = await levantar('aserradero', [par.aserradero]);
    ok(aserr.ok && Math.hypot(aserr.x - molino.x, aserr.z - molino.z) < 14, `el aserradero al lado del molino (${JSON.stringify(aserr)})`);

    seccion('2. troncos al aserradero, tablas afuera');
    await js(`(()=>{ const P = ${H}.progreso; P.materiales.tronco = 10; P.materiales.tabla = 0; P.horas = 10; return 1 })()`);
    await pararse(aserr.x, aserr.z, 2.2, aserr.x * 2 - molino.x, aserr.z * 2 - molino.z);
    let a = await aviso(/aserradero/);
    ok(/Cargar troncos en el aserradero \(10\)/.test(a), `el aviso lo dice («${a}»)`);
    await tecla('KeyE'); await esperar(300);
    let e = await js(`(()=>{ const o = ${obraEn('aserradero', aserr.x, aserr.z)}; return { troncos: ${H}.progreso.materiales.tronco, cargados: o.datos.aserradero?.troncos, hora: o.datos.aserradero?.hora } })()`);
    ok(e.troncos === 0 && e.cargados === 10 && Number.isFinite(e.hora), `E carga los diez troncos (${JSON.stringify(e)})`);
    await cuadros(8);
    e = await js(`(()=>{ const m = ${H}.__maquinas.mundo().molino; const r = [...m.ruedas.values()][0], s = [...m.sierras.values()][0]; return { ruedas: m.ruedas.size, sierras: m.sierras.size, rx: r?.giro.rotation.x, objetivo: s?.objetivo, vel: s?.vel } })()`);
    await esperar(400); await cuadros(8);
    const giro = await js(`[...${H}.__maquinas.mundo().molino.ruedas.values()][0]?.giro.rotation.x`);
    ok(e.ruedas === 1 && e.sierras === 1 && giro !== e.rx, `la rueda gira (${e.rx?.toFixed(2)} → ${giro?.toFixed(2)})`);
    ok(e.objetivo > 0, 'y la sierra arranca');
    await pasarHoras(3.1);
    await js(`${H}.__maquinas.revisar(); 1`);
    e = await js(`(()=>{ const o = ${obraEn('aserradero', aserr.x, aserr.z)}; return { ...o.datos.aserradero } })()`);
    ok(e.troncos === 6 && e.tablas === 20, `en tres horas aserró cuatro troncos: veinte tablas (${JSON.stringify(e)})`);
    a = await aviso(/Sacar las tablas/);
    ok(/Sacar las tablas del aserradero \(20\)/.test(a), `el aviso dice que hay tablas («${a}»)`);
    await tecla('KeyE'); await esperar(300);
    e = await js(`(()=>{ const o = ${obraEn('aserradero', aserr.x, aserr.z)}; return { tablas: ${H}.progreso.materiales.tabla, quedan: o.datos.aserradero.tablas, troncos: o.datos.aserradero.troncos } })()`);
    ok(e.tablas === 20 && e.quedan === 0 && e.troncos === 6, `E saca las veinte tablas (${JSON.stringify(e)})`);
    ok(/tablas del aserradero/.test(await notas()), 'y lo anota');

    seccion('3. la muela, con habas de la huerta');
    await js(`(()=>{ const P = ${H}.progreso; P.entradas.haba = { dia: 1, hora: 9, cantidad: 6 }; P.cosas.harina = 0; return 1 })()`);
    const lejosDelAgua = { x: molino.x * 2 - molino.rx, z: molino.z * 2 - molino.rz };
    await pararse(molino.x, molino.z, 2.0, lejosDelAgua.x, lejosDelAgua.z);
    a = await aviso(/muela|Molino/);
    ok(/Echar habas a la muela \(6\)/.test(a), `el aviso ofrece moler («${a}»)`);
    await tecla('KeyE'); await esperar(300);
    await pasarHoras(3.1);
    await js(`${H}.__maquinas.revisar(); 1`);
    e = await js(`(()=>{ const o = ${obraEn('molino-agua', molino.x, molino.z)}; return { ...o.datos.muela, habas0: ${H}.progreso.entradas.haba.cantidad } })()`);
    ok(e.habas0 === 0 && e.harina === 2 && e.habas === 2, `molió dos medidas de harina (${JSON.stringify(e)})`);
    await aviso(/harina/);
    await tecla('KeyE'); await esperar(300);
    ok(await js(`${H}.progreso.cosas.harina`) === 2, 'E saca la harina (la del almacén: sirve para el pan)');

    // ================================================================ la estación y la radio
    seccion('4. la estación meteorológica');
    const est = await levantar('estacion-meteo', alrededor(aserr.x, aserr.z, [7, 10, 14], 12));
    ok(est.ok, `se levanta la estación (${JSON.stringify(est)})`);
    await js(`(()=>{ ${H}.progreso.horas = 9; return 1 })()`);
    await pararse(est.x, est.z, 1.6, est.x + 5, est.z + 5);
    a = await aviso(/pronóstico|radio/);
    ok(/Leer el pronóstico y prender la radio/.test(a), `el aviso («${a}»)`);
    await tecla('KeyE'); await esperar(300);
    let c = await charla();
    ok(c.abierta && /Estación meteorológica/.test(c.quien) && /Hoy: .*Mañana: .*Pasado mañana: /.test(c.texto), `E muestra el pronóstico («${c.texto.slice(0, 160)}»)`);
    await tecla('KeyE'); await esperar(200);
    c = await charla();
    ok(c.abierta && /^En la radio\./.test(c.texto), `después, la radio («${c.texto.slice(0, 120)}»)`);
    await tecla('KeyE'); await esperar(200);
    ok(!(await charla()).abierta, 'y E cierra');
    // lo que dijo es lo que viene: se anda un día y cuarto de a media hora y se mira el clima
    const acierto = await js(`(()=>{ const H = ${H}, P = H.progreso, pr = H.__maquinas.pronostico(), esperado = new Map();
      for (const d of pr) for (const t of d.tramos) esperado.set(t.k, t.tipo);
      let bien = 0, total = 0, mal = [];
      const lluvias = [...esperado.values()].filter((x) => x === 'lluvia').length;
      for (let i = 0; i < 60; i++) {
        P.horas += 0.5; if (P.horas >= 24) { P.horas -= 24; P.dia++; }
        H.__bucle(); H.__bucle();
        const k = Math.floor((P.dia * 24 + P.horas) / 3);
        if (!esperado.has(k)) continue;
        total++;
        if (H.clima.estado.objetivo === esperado.get(k)) bien++; else mal.push(k + ':' + esperado.get(k) + '/' + H.clima.estado.objetivo);
      }
      return { bien, total, mal: mal.slice(0, 5), lluvias, texto: pr.map((d) => d.texto) } })()`);
    ok(acierto.total >= 50 && acierto.bien === acierto.total, `el tiempo que vino es el que anunció (${acierto.bien} de ${acierto.total}, ${JSON.stringify(acierto.mal)}; ${acierto.texto.join(' · ')})`);

    seccion('5. la radio del refugio');
    const radio = await levantar('radio-refugio', alrededor(est.x, est.z, [5, 7, 9], 12));
    ok(radio.ok, `se arma la radio (${JSON.stringify(radio)})`);
    // sin lo que pidieron por radio a mano (la obra se pagó con materiales de prueba)
    await js(`(()=>{ const P = ${H}.progreso; P.dia += 1; P.horas = 12; P.materiales.tabla = 0; return 1 })()`);
    await pararse(radio.x, radio.z, 1.0, radio.x + 3, radio.z);
    a = await aviso(/radio/);
    ok(/Prender la radio/.test(a), `el aviso («${a}»)`);
    await tecla('KeyE'); await esperar(300);
    c = await charla();
    const dia = await js(`${H}.progreso.dia`);
    ok(c.abierta && /La radio/.test(c.quien) && /«.+»/.test(c.texto), `se oye a otro refugio («${c.texto.slice(0, 140)}»)`);
    e = await js(`({ ...${H}.progreso.radio })`);
    ok(e.dia === dia && e.ultimo, 'la radio anota el día');
    await tecla('KeyE'); await esperar(150); await tecla('KeyE'); await esperar(150);
    await tecla('KeyE'); await esperar(300);
    const c2 = await charla();
    ok(c2.texto === c.texto, 'el mismo día, lo mismo: no es un noticiero');
    await tecla('KeyE'); await esperar(150); await tecla('KeyE'); await esperar(150);
    // un pedido: ocho tablas para el techo del Cerro Negro
    await js(`(()=>{ const P = ${H}.progreso; P.radio.pedido = 'p-techo'; P.materiales.tabla = 8; P.cosas.yerba = 0; return 1 })()`);
    a = await aviso(/Avisar por radio/);
    ok(/Avisar por radio que mandás 8 tablas/.test(a), `el aviso ofrece mandar lo pedido («${a}»)`);
    await tecla('KeyE'); await esperar(1600);
    e = await js(`({ tablas: ${H}.progreso.materiales.tabla, yerba: ${H}.progreso.cosas.yerba, hechos: ${H}.progreso.radio.hechos, pedido: ${H}.progreso.radio.pedido })`);
    ok(e.tablas === 0 && e.yerba === 3 && e.hechos.includes('p-techo') && e.pedido === null, `se mandan con la trochita y llega la yerba (${JSON.stringify(e)})`);

    // ================================================================ recargar
    seccion('6. después de recargar');
    // al aserradero: se sacan las tablas que hizo mientras tanto y se cargan cuatro troncos
    await js(`(()=>{ const P = ${H}.progreso; P.materiales.tronco = 4; P.materiales.tabla = 0; return 1 })()`);
    await pararse(aserr.x, aserr.z, 2.2, aserr.x * 2 - molino.x, aserr.z * 2 - molino.z);
    a = await aviso(/Sacar las tablas/);
    await tecla('KeyE'); await esperar(300);
    const hechas = await js(`${H}.progreso.materiales.tabla`);
    ok(hechas === 30, `mientras mirabas el cielo, el aserradero terminó los seis troncos: treinta tablas («${a}», ${hechas})`);
    await aviso(/Cargar troncos/);
    await tecla('KeyE'); await esperar(300);
    const antes = await js(`(()=>{ const H = ${H}, P = H.progreso;
      const a = H.obras.obras.find((o) => o.plano.id === 'aserradero').datos.aserradero;
      return { semilla: P.meteo.semilla, aserr: { ...a }, pron: H.__maquinas.pronostico().map((d) => d.texto).join('|'), dia: P.dia, horas: P.horas, radio: JSON.stringify(P.radio),
        ids: H.obras.obras.map((o) => o.plano.id).filter((i) => ['molino-agua', 'aserradero', 'estacion-meteo', 'radio-refugio'].includes(i)).sort() } })()`);
    await js(`${H}.guardar(); 1`);
    await abrir();
    ok(await listo(), 'recargó');
    await entrar();
    await js(`(()=>{ const P = ${H}.progreso; P.dia = ${antes.dia}; P.horas = ${antes.horas}; return 1 })()`);
    e = await js(`(()=>{ const H = ${H}, P = H.progreso;
      const a = H.obras.obras.find((o) => o.plano.id === 'aserradero')?.datos.aserradero;
      return { semilla: P.meteo?.semilla, aserr: a && { ...a }, pron: H.__maquinas.pronostico().map((d) => d.texto).join('|'), radio: JSON.stringify(H.__maquinas.radio()),
        ids: H.obras.obras.map((o) => o.plano.id).filter((i) => ['molino-agua', 'aserradero', 'estacion-meteo', 'radio-refugio'].includes(i)).sort() } })()`);
    ok(JSON.stringify(e.ids) === JSON.stringify(antes.ids), `las cuatro máquinas siguen (${e.ids})`);
    ok(e.semilla === antes.semilla && e.pron === antes.pron, 'la semilla del tiempo y el pronóstico, iguales');
    ok(e.radio === antes.radio, 'la radio recuerda lo oído y lo mandado');
    ok(antes.aserr.troncos === 4 && e.aserr?.troncos === 4 && Math.abs(e.aserr.hora - antes.aserr.hora) < 0.5, `el aserradero guardó su carga y su hora (${JSON.stringify([antes.aserr, e.aserr])})`);
    // pasan unas horas (dormir, o el tiempo que corre) y se pone al día solo
    await pasarHoras(1.6);
    await cuadros(4); await esperar(700); await cuadros(4);
    await js(`${H}.__maquinas.revisar(); 1`);
    e = await js(`({ ...${H}.obras.obras.find((o) => o.plano.id === 'aserradero').datos.aserradero })`);
    ok(e.troncos === 2 && e.tablas === 10, `al pasar el tiempo, el aserradero siguió (${JSON.stringify(e)})`);
    const clima = await js(`(()=>{ const H = ${H}, P = H.progreso, k = Math.floor((P.dia * 24 + P.horas) / 3), d = H.__maquinas.pronostico()[0];
      const t = d.tramos.find((x) => x.k === k); return { objetivo: H.clima.estado.objetivo, esperado: t?.tipo } })()`);
    ok(clima.objetivo === clima.esperado, `y el clima sigue el mismo programa (${JSON.stringify(clima)})`);

    // ================================================================ Desafío
    seccion('7. Desafío: la estación anuncia la noche');
    await js(`${H}.guardar(); 1`);
    await js(ajustesPrueba('desafio'));
    await abrir();
    ok(await listo(), 'carga el Desafío');
    await entrar();
    await js(`(()=>{ const P = ${H}.progreso; P.horas = 10; P.desafio.oleadas = 5; P.desafio.especial = null; P.desafio.especialAnterior = null; P.desafio.oleadaNoche = P.dia - 1; return 1 })()`);
    const estD = await levantar('estacion-meteo', alrededor(await js(`${H}.jugador.estado.pos.x`), await js(`${H}.jugador.estado.pos.z`), [6, 9, 12], 12));
    ok(estD.ok, `se levanta la estación en el Desafío (${JSON.stringify(estD)})`);
    await pararse(estD.x, estD.z, 1.6, estD.x + 5, estD.z + 5);
    await aviso(/pronóstico/);
    await tecla('KeyE'); await esperar(300);
    c = await charla();
    const noches = await js(`${H}.__maquinas.noches()`);
    ok(/Esta noche: /.test(c.texto) && /Mañana a la noche: /.test(c.texto), `anuncia las dos noches que vienen («${c.texto.slice(-160)}»)`);
    await tecla('KeyE'); await esperar(150); await tecla('KeyE'); await esperar(150);
    // una hora antes de la nave, el Desafío decide: tiene que ser lo anunciado
    await js(`(()=>{ const P = ${H}.progreso; P.horas = 19.55; return 1 })()`);
    for (let i = 0; i < 6; i++) { await cuadros(4); await esperar(150); }
    const decidida = await js(`${H}.progreso.desafio.especial`);
    ok((decidida ?? null) === (noches[0].especial ?? null), `la noche es la anunciada (${noches[0].texto} → ${decidida})`);
  } catch (err) {
    errores.push('excepción: ' + (err?.stack || err?.message || err));
  } finally {
    if (copiaStorage) {
      await js(`(()=>{ const c = JSON.parse(${JSON.stringify(copiaStorage)});
        localStorage.clear(); for (const [k, v] of Object.entries(c)) localStorage.setItem(k, v);
        Storage.prototype.setItem = () => {}; Storage.prototype.removeItem = () => {}; Storage.prototype.clear = () => {}; return 1 })()`).catch(() => {});
    }
  }
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  console.log('OK humo 2.9 · el molino, el aserradero, la estación y la radio');
  app.exit(0);
});

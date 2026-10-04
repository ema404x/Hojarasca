// Partida real 2.0: las diez mejoras del modo Relax.
//
// La ventana oculta corre a un cuadro cada varios segundos, así que lo que tarda
// —un pudú que camina cuarenta metros— no se puede esperar entero: se prueba que el
// juego tome la decisión correcta y la ponga en marcha. Lo que tarda se mide exacto en
// las pruebas de los módulos puros.
//
// Uso: npx electron pruebas/humo-relax-2.cjs
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
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) { listo = true; break; } }
    ok(listo, 'carga el Relax');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);

    // ---- 1. sentarse y esperar
    const antes = await js(`(()=>{
      const H = window.__hojarasca, js = H.jugador.estado, p = H.fauna.pudues[0];
      // un pudú a cuarenta metros, pastando, a punto de elegir para dónde ir
      p.pos.set(js.pos.x + 40, H.T.altura(js.pos.x + 40, js.pos.z), js.pos.z);
      p.estado = 'pastar'; p.t = 0.01; p.acercandose = false;
      // y el jugador, recién parado: nada de calma todavía
      js.quietud = 0; js.sentado = false;
      window.__pudu = p;
      return { calma: +H.__calma().toFixed(2) } })()`);
    ok(antes.calma === 0, 'recién parado no hay calma');
    await esperar(4000);
    const apurado = await js(`(()=>{ const p = window.__pudu, js = window.__hojarasca.jugador.estado;
      return { acercandose: !!p.acercandose, d: Math.hypot(p.objetivo.x - js.pos.x, p.objetivo.z - js.pos.z) } })()`);
    ok(!apurado.acercandose, `sin esperar, el pudú sigue con lo suyo (va a ${apurado.d.toFixed(0)} m de vos)`);

    // ahora sí: sentado y quieto un buen rato
    await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado, p = window.__pudu;
      js.sentado = true; js.quietud = 60;
      p.pos.set(js.pos.x + 40, H.T.altura(js.pos.x + 40, js.pos.z), js.pos.z);
      p.estado = 'pastar'; p.t = 0.01; return 1 })()`);
    let paciente = null;
    for (let i = 0; i < 8 && !(paciente && paciente.acercandose); i++) {
      await esperar(2500);
      paciente = await js(`(()=>{ const H = window.__hojarasca, p = window.__pudu, js = H.jugador.estado;
        // que vuelva a elegir (3.6: también si eligió dar su vuelta antes de que llegara la calma: la ventana
        // oculta de la prueba anda a un cuadro por segundo y esa vuelta tardaría más que la espera)
        if (!p.acercandose && (p.estado === 'pastar' || p.estado === 'caminar')) { p.estado = 'pastar'; p.t = 0.01; }
        return { acercandose: !!p.acercandose, calma: +H.__calma().toFixed(2),
          d: p.objetivo ? +Math.hypot(p.objetivo.x - js.pos.x, p.objetivo.z - js.pos.z).toFixed(1) : -1,
          nota: document.getElementById('notas').textContent } })()`);
    }
    ok(paciente.calma >= 0.99, `sentado y quieto, la calma llega arriba (${paciente.calma})`);
    ok(paciente.acercandose, 'el pudú decide acercarse');
    ok(paciente.d >= 6.5 && paciente.d <= 11.5, `y va a quedarse a una distancia prudente (${paciente.d} m)`);
    ok(/pudú se acerca/.test(paciente.nota), 'el juego lo avisa una vez: «Un pudú se acerca»');
    const vista = await js(`(()=>{ const p = window.__pudu; return +(p.percepcion ? p.percepcion.radioVisual : -1).toFixed(1) })()`);
    ok(vista >= 0 && vista < 8, `con el jugador calmo, el pudú casi no lo ve (radio visual ${vista} m)`);

    // moverse corta la paciencia de golpe: se camina de verdad, con la tecla apretada
    await js(`(()=>{ const js = window.__hojarasca.jugador.estado; js.sentado = false;
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true })); return 1 })()`);
    let tras = null;
    for (let i = 0; i < 6; i++) {
      await esperar(2000);
      tras = await js(`(()=>{ const js = window.__hojarasca.jugador.estado; return { quietud: js.quietud, vel: +(js.velocidadActual || 0).toFixed(2) } })()`);
      if (tras.vel > 0.3) break;
    }
    await js(`document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', bubbles: true })); 1`);
    ok(tras.quietud < 1, `caminar corta la paciencia (quietud ${tras.quietud.toFixed(1)} s, velocidad ${tras.vel})`);
    await esperar(2500);

    // ---- 2. escuchar con atención: agachado (C) y quieto
    // un chucao a setenta metros al este: más lejos de lo que se anota de pasada (38)
    // Se busca un lugar a setenta metros de un chucao donde ése sea lo único que se oye:
    // ningún otro chucao ni carpintero a menos de sesenta metros. Así la dirección que
    // diga el juego se puede comparar con una cuenta hecha acá, por separado.
    const puesto = await js(`(()=>{
      const H = window.__hojarasca, js = H.jugador.estado, F = H.fauna;
      H.progreso.horas = 11; delete H.progreso.entradas.chucao;
      const fuentes = F.fuentesDeCanto({ dia: 1 });
      // Sólo los ocho rumbos del centro de cada sector: en un borde entre dos, una
      // diferencia de redondeo alcanza para que la cuenta de acá y la del juego no
      // coincidan. Y ninguna otra fuente al alcance del oído (95 m), porque el juego
      // señala —y apura— la más cercana, que tiene que ser ésta.
      for (const dist of [60, 50]) for (const ch of F.chucaos) for (let k = 0; k < 8; k++) {
        const a = k / 8 * Math.PI * 2, x = ch.x + Math.cos(a) * dist, z = ch.z + Math.sin(a) * dist;
        if (H.T.agua(x, z) || Math.abs(x) > 480 || Math.abs(z) > 480) continue;
        const otro = fuentes.some((f) => !(f.x === ch.x && f.z === ch.z) && Math.hypot(f.x - x, f.z - z) < 97);
        if (otro) continue;
        js.pos.set(x, H.T.altura(x, z) + 1.65, z);
        for (const c of F.chucaos) c.t = 60;       // que nadie cante solo
        window.__ch = ch;
        // se espía el canto: el reloj del chucao se reinicia apenas canta y no sirve
        const S = H.sonido; window.__cantos = 0; const orig = S.chucao.bind(S);
        S.chucao = (q) => { if (q.x === ch.x && q.z === ch.z) window.__cantos++; return orig(q); };
        return { ok: true, jugador: { x, z }, chucao: { x: ch.x, z: ch.z } };
      }
      return { ok: false };
    })()`);
    ok(puesto.ok, 'hay un lugar del valle donde se oye un solo chucao, más lejos de lo que se anota de pasada');
    // el rumbo, calculado acá: el norte del juego es -z y el este +x
    const RUMBOS = ['norte', 'noreste', 'este', 'sureste', 'sur', 'suroeste', 'oeste', 'noroeste'];
    const angulo = Math.atan2(puesto.chucao.x - puesto.jugador.x, -(puesto.chucao.z - puesto.jugador.z));
    const esperado = RUMBOS[Math.round(((angulo + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) % 8];
    // C se agacha (es un interruptor, no se sostiene)
    await js(`document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyC', bubbles: true })); 1`);
    let esc = null;
    for (let i = 0; i < 10; i++) {
      await esperar(2500);
      esc = await js(`(()=>{ const H = window.__hojarasca, p = document.getElementById('escucha');
        return { afinado: +H.__oido().toFixed(2), texto: p.textContent, visible: !p.classList.contains('oculto'), t: +window.__ch.t.toFixed(1) } })()`);
      if (esc.afinado >= 0.95) break;
    }
    ok(esc.afinado >= 0.95, `agachado y quieto, el oído se afina (${esc.afinado})`);
    ok(esc.visible && /chucao/.test(esc.texto), `se oye lo que no anotaste: «${esc.texto}»`);
    ok(new RegExp(`hacia el ${esperado}\\.`).test(esc.texto), `y del lado correcto: el chucao está al ${esperado}`);
    ok(/(cerca|lejos)/.test(esc.texto), 'y dice si está cerca o lejos');
    // Le quedaban sesenta segundos de juego para cantar. Escuchando, el juego lo apura a
    // menos de cinco. Esta ventana avanza como 0,05 segundos de juego por segundo de
    // reloj, así que después de comprobar el apuro se le adelanta el canto a mano.
    ok(esc.t < 5, `el chucao canta antes porque estás escuchando (le quedaban 60 s, ahora ${esc.t})`);
    await js(`(()=>{ window.__ch.t = 0.05; return 1 })()`);
    let canto = { cantos: 0, anotado: false };
    for (let i = 0; i < 14 && !canto.anotado; i++) {
      await esperar(2500);
      canto = await js(`(()=>({ cantos: window.__cantos, anotado: !!window.__hojarasca.progreso.entradas.chucao, oido: window.__hojarasca.__oido() }))()`);
    }
    ok(canto.cantos >= 1, `el chucao canta (${canto.cantos})`);
    ok(canto.anotado, 'y se anota a más de 38 metros, porque el oído llega más lejos');
    ok(canto.oido >= 0.95, `el oído se sostiene afinado mientras estás quieto (${(canto.oido || 0).toFixed(2)})`);
    // C otra vez: se para
    await js(`document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyC', bubbles: true })); 1`);
    let suelto = null;
    for (let i = 0; i < 6; i++) {
      await esperar(2000);
      suelto = await js(`(()=>({ afinado: window.__hojarasca.__oido(), visible: !document.getElementById('escucha').classList.contains('oculto') }))()`);
      if (suelto.afinado < 0.5) break;
    }
    ok(suelto.afinado < 0.5 && !suelto.visible, 'al pararse se deja de escuchar');

    // ---- 3. el perro como guía
    // Un pudú sin anotar a cuarenta metros y el perro al lado tuyo. Todo lo demás de la
    // fauna se da por anotado: si no, el perro podría —con razón— llevarte a otro bicho.
    const eje = await js(`(()=>{
      const H = window.__hojarasca, js = H.jugador.estado, P = H.perro.est, p = H.fauna.pudues[0];
      for (const id of ['carpintero','chucao','cachana','condor','concon','huemul','zorro','cisne','patotorrente','martin','picaflor','bandurria','perro','guanaco','zorzal','lagartija','ciervo','jabali','liebre','coipo','cauquen','murcielago','manganga','panal','mariposa'])
        H.progreso.entradas[id] = { dia: 1, hora: 9 };
      delete H.progreso.entradas.pudu;
      const x = js.pos.x + 40, z = js.pos.z;
      p.pos.set(x, H.T.altura(x, z), z); p.estado = 'pastar'; p.t = 99; p.vel = 0;
      P.pos.set(js.pos.x + 1.5, H.T.altura(js.pos.x + 1.5, js.pos.z), js.pos.z); P.estado = 'seguir'; P.t = 0;
      window.__pudu = p;
      return 1 })()`);
    const perro = () => js(`(()=>{ const H = window.__hojarasca, P = H.perro.est, p = window.__pudu, js = H.jugador.estado;
      p.estado = 'pastar'; p.t = 99; p.vel = 0;             // que el pudú no se vaya mientras se mide
      return { estado: P.estado, guiando: P.guiando, marcando: P.marcando ? P.marcando.tipo : null,
        dPresa: +Math.hypot(p.pos.x - P.pos.x, p.pos.z - P.pos.z).toFixed(1),
        dJugador: +Math.hypot(js.pos.x - P.pos.x, js.pos.z - P.pos.z).toFixed(1),
        nota: document.getElementById('notas').textContent } })()`);
    let g = null;
    // se espera a que el perro vuelva a olfatear: el primer valor puede ser de antes
    // de dar todo lo demás por anotado
    for (let i = 0; i < 12; i++) { await esperar(2000); g = await perro(); if (g.guiando === 'pudu') break; }
    ok(g.guiando === 'pudu', `el perro huele el pudú que falta anotar (a ${g.dPresa} m · guía hacia «${g.guiando}»)`);
    ok(g.estado === 'guiar', `y sale a guiarte (${g.estado})`);
    // El aviso sale las primeras veces que el perro sale a guiar en la sesión, y puede
    // haber salido antes, hacia otro bicho: lo que se mira es que haya salido.
    const avisos = await js(`window.__hojarasca.__avisosDeGuia()`);
    ok(avisos >= 1 && avisos <= 3, `el juego avisa «El perro encontró un rastro» las primeras veces (${avisos})`);
    // el perro se adelanta veinte metros y vos te quedás: te espera
    await js(`(()=>{ const H = window.__hojarasca, P = H.perro.est, js = H.jugador.estado;
      P.pos.set(js.pos.x + 20, H.T.altura(js.pos.x + 20, js.pos.z), js.pos.z); return 1 })()`);
    for (let i = 0; i < 8; i++) { await esperar(2000); g = await perro(); if (g.estado === 'esperarGuia') break; }
    ok(g.estado === 'esperarGuia', `si te quedás atrás, se frena y te espera (${g.estado}, ${g.dJugador} m de vos)`);
    // llega cerca del pudú: marca
    await js(`(()=>{ const H = window.__hojarasca, P = H.perro.est, p = window.__pudu;
      P.pos.set(p.pos.x - 10, H.T.altura(p.pos.x - 10, p.pos.z), p.pos.z); return 1 })()`);
    for (let i = 0; i < 8; i++) { await esperar(2000); g = await perro(); if (g.estado === 'marcar') break; }
    ok(g.estado === 'marcar' && g.marcando === 'pudu', `cerca del pudú se queda duro señalando (${g.estado} · ${g.marcando})`);
    // anotado el pudú, el perro vuelve a lo suyo
    await js(`(()=>{ window.__hojarasca.progreso.entradas.pudu = { dia: 1, hora: 10 }; return 1 })()`);
    for (let i = 0; i < 8; i++) { await esperar(2000); g = await perro(); if (!g.guiando) break; }
    ok(!g.guiando, 'con el pudú anotado deja de guiar');

    // ---- 4. encargos de temporada
    // Con la lista principal cerrada y en verano, Ema tiene uno nuevo: plantar tres
    // renovales MÁS de los que ya tenés.
    const tecla = (code) => js(`document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', bubbles: true })); 1`);
    await js(`(()=>{ const H = window.__hojarasca;
      for (const id of H.__idsEncargos()) H.progreso.encargos[id] = 'hecho';
      H.progreso.renovales = [{ x: 1, z: 1 }, { x: 2, z: 2 }, { x: 3, z: 3 }, { x: 4, z: 4 }];   // ya plantaste cuatro
      const ema = H.gente.gente.find((n) => n.clave === 'ema');
      // los vecinos primero cuentan sus historias: se dan por escuchadas
      for (const h of ema.historias) H.progreso.entradas[h.id] = { dia: 1, hora: 10 };
      H.hablar(ema); return 1 })()`);
    const primera = await js(`window.__hojarasca.__charla()`);
    ok(primera.encargo && primera.encargo.id === 't-renovales' && primera.encargo.modo === 'pedido',
      `después del cierre, en verano, Ema pide algo nuevo (${primera.encargo ? primera.encargo.id : 'nada'})`);
    // se escucha el pedido y se acepta
    await js('window.__hojarasca.__seguirCharla(), 1'); await js('window.__hojarasca.__seguirCharla(), 1');
    const aceptado = await js(`(()=>{ const H = window.__hojarasca; return { estado: H.progreso.encargos['t-renovales'], base: H.progreso.encargoBase && H.progreso.encargoBase['t-renovales'] } })()`);
    ok(aceptado.estado === 'pedido', 'aceptado: queda pedido');
    ok(aceptado.base && aceptado.base.renovales === 4, `y anota cómo estabas (${aceptado.base ? aceptado.base.renovales : '?'} renovales)`);
    await js('window.__hojarasca.__cerrarCharla(), 1');
    // con los cuatro de antes no alcanza: hacen falta tres nuevos
    const sinHacer = await js(`(()=>{ const H = window.__hojarasca; const ema = H.gente.gente.find((n) => n.clave === 'ema'); H.hablar(ema); const c = H.__charla(); return c })()`);
    ok(!sinHacer.encargo || sinHacer.encargo.modo !== 'listo', 'lo que ya habías plantado no cuenta');
    await js('window.__hojarasca.__cerrarCharla(), 1');
    const ramitasAntes = await js(`window.__hojarasca.progreso.ramitas || 0`);
    await js(`(()=>{ const H = window.__hojarasca; for (let i = 0; i < 3; i++) H.progreso.renovales.push({ x: 10 + i, z: 10 }); return 1 })()`);
    // El aviso dura unos segundos en pantalla; lo que queda es la marca de «ya avisado».
    let aviso = { marca: 0, texto: '' };
    for (let i = 0; i < 10 && !aviso.marca; i++) {
      await esperar(2000);
      aviso = await js(`(()=>({ marca: window.__hojarasca.progreso.encargos['t-renovales-aviso'] || 0, texto: document.getElementById('notas').textContent }))()`);
    }
    ok(aviso.marca === 1, 'con tres nuevos, el juego avisa que está cumplido');
    ok(!aviso.texto.includes('contale') || /contale a Ema/.test(aviso.texto), `y a quién contarle: a Ema (${aviso.texto.slice(0, 60)})`);
    await js(`(()=>{ const H = window.__hojarasca; const ema = H.gente.gente.find((n) => n.clave === 'ema'); H.hablar(ema); return 1 })()`);
    const cobro = await js(`window.__hojarasca.__charla()`);
    ok(cobro.encargo && cobro.encargo.modo === 'listo', 'Ema lo da por cumplido');
    await js('window.__hojarasca.__seguirCharla(), 1'); await js('window.__hojarasca.__seguirCharla(), 1'); await esperar(1600);
    const final = await js(`(()=>({ estado: window.__hojarasca.progreso.encargos['t-renovales'], ramitas: window.__hojarasca.progreso.ramitas || 0 }))()`);
    ok(final.estado === 'hecho', 'y queda hecho');
    ok(final.ramitas === ramitasAntes + 6, `con su premio: 6 ramitas (${ramitasAntes} → ${final.ramitas})`);
    await js('window.__hojarasca.__cerrarCharla(), 1');
    // en verano Ema ya no tiene otro; el de otoño espera al otoño
    const despues = await js(`(()=>{ const H = window.__hojarasca; const ema = H.gente.gente.find((n) => n.clave === 'ema'); H.hablar(ema); return H.__charla() })()`);
    ok(!despues.encargo, 'el de otoño no se ofrece en verano');
    await js('window.__hojarasca.__cerrarCharla(), 1');

    // ---- 5. la huerta
    // 2.2: una sola huerta (el cantero de la 1.10, con los calafates de la 2.0). Lo que la
    // 2.0 prometía sigue: sembrás una frutilla que juntaste y cosechás cuatro más, y si te
    // olvidás, espera.
    const cantero = await js(`(()=>{
      const H = window.__hojarasca, P = H.progreso, js = H.jugador.estado;
      const plano = H.PLANOS.find((q) => q.id === 'cantero');
      if (!plano) return { error: 'no hay plano de cantero en el Relax' };
      Object.assign(P.materiales, { tabla: 20, tronco: 10, piedra: 10 });
      H.obras.elegir(plano);
      let obra = null;
      for (const d of [3, 4, 5, 6]) for (const a of [0, 1.5, -1.5, 3.1]) {
        const x = js.pos.x - Math.sin(js.yaw + a) * d, z = js.pos.z - Math.cos(js.yaw + a) * d;
        const r = H.obras.fundar(x, z, js.yaw, js.pos.y); if (!r.ok) continue;
        const av = H.obras.avanzar(r.obra, P.materiales); if (av.ok) { obra = r.obra; break; }
      }
      H.obras.elegir(null);
      if (!obra) return { error: 'no se pudo levantar el cantero' };
      P.obras = H.obras.obras.map((o) => o.datos);
      js.pos.set(obra.datos.x + 1.2, H.T.altura(obra.datos.x + 1.2, obra.datos.z) + 1.65, obra.datos.z);
      window.__cantero = obra;
      P.entradas.frutilla = { dia: 1, hora: 9, cantidad: 2 };
      return { ok: true, completo: obra.datos.etapas >= obra.plano.etapas.length };
    })()`);
    ok(cantero.ok && cantero.completo, 'se levanta un cantero de huerta' + (cantero.error ? ': ' + cantero.error : ''));
    const huerta = () => js(`(()=>{ const H = window.__hojarasca, c = H.canteroCerca(), p = c ? H.huerta()[c.clave] : null;
      return { cultivo: p ? p.cultivo : null, frutillas: H.progreso.entradas.frutilla.cantidad, matas: H.__matasHuerta()?.hojas?.count ?? -1,
        frutos: H.__matasHuerta()?.frutos?.count ?? -1, aviso: (document.getElementById('aviso') || {}).textContent || '' } })()`);
    let hu = null;
    for (let i = 0; i < 6; i++) { await esperar(1500); hu = await huerta(); if (/Sembrar/.test(hu.aviso)) break; }
    ok(/Sembrar/.test(hu.aviso), `parado al lado, el cartel dice qué hacer: «${hu.aviso}»`);
    await js(`document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', bubbles: true })); 1`);
    await esperar(1500);
    hu = await huerta();
    ok(hu.cultivo === 'frutillas' && hu.frutillas === 1, `E siembra: usa una frutilla (quedan ${hu.frutillas})`);
    ok(hu.matas > 0 && hu.frutos === 0, `aparecen las matas, todavía sin fruta (${hu.matas}/${hu.frutos})`);
    // pasan diez días sin que vuelvas: no se secó, está para cosechar
    await js(`(()=>{ const H = window.__hojarasca; H.progreso.dia += 10; H.revisarHuerta(); return 1 })()`);
    for (let i = 0; i < 6; i++) { await esperar(1500); hu = await huerta(); if (/Cosechar/.test(hu.aviso)) break; }
    ok(/Cosechar frutillas/.test(hu.aviso) && hu.frutos > 0, `si te olvidás, espera: «${hu.aviso}»`);
    await js(`document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', bubbles: true })); 1`);
    await esperar(1500);
    hu = await huerta();
    ok(!hu.cultivo && hu.frutillas === 5, `se cosecha: sembraste una y tenés cuatro más (${hu.frutillas})`);
    ok(hu.matas === 0, 'y el cantero queda vacío para volver a sembrar');

    // ---- 6. la escarcha
    // una mañana de otoño, despejada y sin viento, parado en un pastizal abierto
    const pastizal = await js(`(()=>{
      const H = window.__hojarasca, T = H.T, js = H.jugador.estado;
      for (let i = 0; i < 4000; i++) {
        const x = (Math.random() * 2 - 1) * 380, z = (Math.random() * 2 - 1) * 380;
        const k = T.indice(x, z);
        if (T.agua(x, z) || T.pasto[k] < 0.6 || T.bosque[k] > 0.2 || T.distSendero[k] < 4 || (T.estepa?.[k] || 0) > 0.3) continue;
        js.pos.set(x, T.altura(x, z) + 1.65, z);
        window.__estacionAntes = H.ajustes.estacion; H.ajustes.estacion = 'otono';
        H.__U().uOtono.value = 1; H.__U().uInvierno.value = 0;
        H.clima.estado.objetivo = 'despejado'; H.clima.estado.t = 9999;
        H.clima.estado.nublado = 0; H.clima.estado.lluvia = 0; H.clima.estado.vientoBase = 0.05;
        H.progreso.horas = 6.4;
        return { x: Math.round(x), z: Math.round(z) };
      }
      return null })()`);
    ok(!!pastizal, 'hay un pastizal abierto donde pararse');
    const helada = () => js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado;
      if (H.clima.estado.objetivo === 'despejado') { H.clima.estado.nublado = 0; H.clima.estado.vientoBase = 0.05; }
      return { escarcha: +H.__U().uEscarcha.value.toFixed(2), superficie: js.superficie, horas: +H.progreso.horas.toFixed(1) } })()`);
    let he = null;
    for (let i = 0; i < 10; i++) { await esperar(2000); he = await helada(); if (he.escarcha > 0.6) break; }
    ok(he.escarcha > 0.6, `al amanecer de otoño, con cielo limpio, hay escarcha (${he.escarcha})`);
    ok(he.superficie === 'escarcha', `y el pasto cruje al pisarlo (superficie: ${he.superficie})`);
    // a media mañana se derrite
    await js(`(()=>{ window.__hojarasca.progreso.horas = 11; return 1 })()`);
    for (let i = 0; i < 10; i++) { await esperar(2000); he = await helada(); if (he.escarcha < 0.05) break; }
    ok(he.escarcha < 0.05, `a las once ya se derritió (${he.escarcha})`);
    ok(he.superficie !== 'escarcha', `y el pasto deja de crujir (${he.superficie})`);
    // una mañana nublada no hay
    await js(`(()=>{ const H = window.__hojarasca; H.progreso.horas = 6.4; H.clima.estado.objetivo = 'nublado'; H.clima.estado.nublado = 1; return 1 })()`);
    for (let i = 0; i < 8; i++) { await esperar(2000); he = await helada(); }
    ok(he.escarcha < 0.2, `con el cielo cubierto casi no hay: las nubes hacen de manta (${he.escarcha})`);
    await js(`(()=>{ const H = window.__hojarasca; H.ajustes.estacion = window.__estacionAntes; H.clima.estado.objetivo = 'despejado'; H.clima.estado.nublado = 0; return 1 })()`);

    // ---- 7 y 8. la lluvia sobre el techo, y adentro suena a adentro
    // el audio necesita un gesto del jugador para arrancar: se lo da un clic de verdad
    await w.webContents.executeJavaScript(`(async()=>{ const s = window.__hojarasca.sonido; if (!s.ctx) s.iniciar?.(); await s.ctx?.resume?.(); return s.ctx?.state })()`, true);
    const bajoLluvia = async (donde, extra = '') => {
      await js(`(()=>{ const H = window.__hojarasca, T = H.T, js = H.jugador.estado;
        ${extra}
        const [x, z] = ${donde};
        js.pos.set(x, T.altura(x, z) + 1.65, z); js.velocidadActual = 0;
        H.clima.estado.objetivo = 'lluvia'; H.clima.estado.t = 9999; H.clima.estado.lluvia = 1;
        H.__U().uInvierno.value = 0; H.sonido.gotasTocadas = 0; H.sonido.ultimaGota = null;
        return 1 })()`);
      let r = null;
      for (let i = 0; i < 8; i++) {
        await esperar(2500);
        r = await js(`(()=>{ const s = window.__hojarasca.sonido; window.__hojarasca.clima.estado.lluvia = 1;
          return { gotas: s.gotasTocadas || 0, material: s.ultimaGota, espacio: s.espacioActual, estado: s.ctx?.state } })()`);
        if (r.gotas > 3) break;
      }
      return r;
    };
    const audio = await js(`window.__hojarasca.sonido.ctx?.state || 'sin audio'`);
    ok(audio === 'running', `el audio corre en la prueba (${audio})`);
    const enRefugio = await bajoLluvia(`[window.__hojarasca.T.lugares.refugio.x, window.__hojarasca.T.lugares.refugio.z]`);
    ok(enRefugio.espacio === 'adentro', `en el refugio se oye como adentro (${enRefugio.espacio})`);
    ok(enRefugio.gotas > 3 && enRefugio.material === 'chapa', `y la lluvia repiquetea en la chapa (${enRefugio.gotas} gotas, ${enRefugio.material})`);
    const filtro = await js(`Math.round(window.__hojarasca.sonido.filtroAmbiente.frequency.value)`);
    ok(filtro < 4000, `las paredes se comen los agudos de afuera (filtro en ${filtro} Hz)`);
    // la carpa: se arma lejos de todo techo
    const enCarpa = await bajoLluvia(`(()=>{ const T = window.__hojarasca.T, r = T.lugares.refugio; return [r.x + 60, r.z + 40] })()`,
      `const r = T.lugares.refugio; H.progreso.carpa = { x: r.x + 60, z: r.z + 40 };`);
    ok(enCarpa.espacio === 'carpa', `en la carpa se oye como en la carpa (${enCarpa.espacio})`);
    ok(enCarpa.gotas > 3 && enCarpa.material === 'lona', `y la lluvia golpea la lona (${enCarpa.gotas} gotas, ${enCarpa.material})`);
    // a cielo abierto no hay techo que suene
    const afuera = await bajoLluvia(`(()=>{ const T = window.__hojarasca.T, r = T.lugares.refugio; return [r.x + 90, r.z + 70] })()`,
      `H.progreso.carpa = null;`);
    ok(afuera.espacio === 'bosque' && afuera.gotas === 0, `a cielo abierto no hay golpes de techo (${afuera.espacio}, ${afuera.gotas})`);
    // en invierno lo que cae es nieve, y la nieve no suena sobre la chapa
    const nevando = await bajoLluvia(`[window.__hojarasca.T.lugares.refugio.x, window.__hojarasca.T.lugares.refugio.z]`,
      `H.ajustes.estacion = 'invierno';`);
    await js(`(()=>{ const H = window.__hojarasca; H.__U().uInvierno.value = 1; H.sonido.gotasTocadas = 0; return 1 })()`);
    await esperar(5000);
    const nieve = await js(`window.__hojarasca.sonido.gotasTocadas || 0`);
    ok(nieve === 0, `con nieve, el techo calla (${nieve} gotas)`);
    await js(`(()=>{ const H = window.__hojarasca; H.ajustes.estacion = window.__estacionAntes; H.clima.estado.objetivo = 'despejado'; H.clima.estado.lluvia = 0; return 1 })()`);

    // ---- 9. el cielo cambia
    // a cielo abierto, de noche, en verano y sin nubes
    const noche = async (dia, horas) => {
      await js(`(()=>{ const H = window.__hojarasca, T = H.T, js = H.jugador.estado, r = T.lugares.refugio;
        H.progreso.carpa = null; H.ajustes.estacion = 'verano'; H.__U().uOtono.value = 0; H.__U().uInvierno.value = 0;
        js.pos.set(r.x + 90, T.altura(r.x + 90, r.z + 70) + 1.65, r.z + 70);
        H.clima.estado.objetivo = 'despejado'; H.clima.estado.nublado = 0; H.clima.estado.lluvia = 0;
        H.progreso.dia = ${dia}; H.progreso.horas = ${horas}; return 1 })()`);
      await esperar(5000);
      return js(`(()=>{ const H = window.__hojarasca, u = H.__cielo().uniforms, n = H.__nocheCielo();
        H.clima.estado.nublado = 0;
        return { fase: +u.uFaseLuna.value.toFixed(3), ilum: +u.uIluminada.value.toFixed(2), estrellas: +u.uEstrellas.value.toFixed(2),
          luz: +H.__cielo().sol.intensity.toFixed(3), lluvia: n.lluvia, nota: document.getElementById('notas').textContent } })()`);
    };
    const llena = await noche(3, 0.5), nueva = await noche(7, 0.5);
    ok(llena.ilum > 0.95 && nueva.ilum < 0.05, `la luna cambia: llena el día 3 (${llena.ilum}), nueva el día 7 (${nueva.ilum})`);
    ok(nueva.estrellas > llena.estrellas, `sin luna se ven más estrellas (${nueva.estrellas} contra ${llena.estrellas})`);
    ok(nueva.luz < llena.luz * 0.5, `y la noche es más oscura (${nueva.luz} contra ${llena.luz})`);
    const pausa = await js(`(()=>{ const H = window.__hojarasca; H.abrir('pausa'); const t = document.getElementById('cuando').textContent; H.volverAlJuego(); return t })()`);
    ok(/luna nueva/.test(pausa), `la pausa dice cómo está la luna («${pausa}»)`);
    // la luna llena se anota mirándola
    await noche(3, 0.5);
    const mirarLuna = await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado, d = H.__cielo().uniforms.uLuna.value;
      js.yaw = Math.atan2(-d.x, -d.z); js.pitch = Math.asin(d.y); H.__nocheCielo().mirandoLuna = 2.1; return !!H.progreso.entradas['luna-llena'] })()`);
    ok(!mirarLuna, 'la luna llena todavía no está anotada');
    let anotada = false;
    for (let i = 0; i < 8 && !anotada; i++) { await esperar(2000); anotada = await js(`!!window.__hojarasca.progreso.entradas['luna-llena']`); }
    ok(anotada, 'mirarla un rato la anota en el cuaderno');
    // la noche de la lluvia de estrellas: el día 9 de verano, a las once
    const lluviaEst = await noche(9, 23);
    ok(lluviaEst.lluvia, 'el día 9 de verano es noche de lluvia de estrellas');
    ok(/llueven estrellas/.test(lluviaEst.nota), `y el juego lo avisa («${lluviaEst.nota.slice(0, 60)}»)`);
    const comun = await noche(8, 23);
    ok(!comun.lluvia, 'la noche anterior no');
    // mirando al norte, con el azar fijo para que salga una fugaz donde se mira
    await noche(9, 23);
    await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado;
      const a = -3.6 * Math.PI / 180, h = 20.5 * Math.PI / 180;
      const d = { x: -Math.sin(a) * Math.cos(h), y: Math.sin(h), z: -Math.cos(a) * Math.cos(h) };
      js.yaw = Math.atan2(-d.x, -d.z); js.pitch = Math.asin(d.y);
      H.__nocheCielo().vistas = 0; H.__azarCielo(() => 0); return 1 })()`);
    let cielo = null;
    for (let i = 0; i < 10; i++) {
      await esperar(1500);
      cielo = await js(`(()=>{ const H = window.__hojarasca, n = H.__nocheCielo(), f = H.__fugaces();
        return { vistas: n.vistas, activas: f.lista.filter((x) => x.f).length, brillo: Math.max(...f.lista.map((x) => x.linea.material.opacity)),
          anotada: !!H.progreso.entradas.geminidas } })()`);
      if (cielo.anotada) break;
    }
    await js(`window.__hojarasca.__azarCielo(null); 1`);
    ok(cielo.vistas >= 3, `se ven estrellas fugaces cruzar el cielo (${cielo.vistas})`);
    ok(cielo.anotada, 'tres en la noche de la lluvia la anotan en el cuaderno');
    const pagina = await js(`(()=>{ const d = window.__hojarasca.diario.hoy; return d.fugaces || 0 })()`);
    ok(pagina >= 3, `y el diario las cuenta (${pagina})`);
    await js(`(()=>{ const H = window.__hojarasca; H.ajustes.estacion = window.__estacionAntes; H.progreso.horas = 12; return 1 })()`);

    // ---- 10. el cuaderno como lámina
    // de día, una foto de verdad para el álbum y un cuaderno con de todo
    await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado, T = H.T, r = T.lugares.refugio;
      js.pos.set(r.x + 20, T.altura(r.x + 20, r.z + 12) + 1.65, r.z + 12); js.pitch = 0.05; js.zoom = false; return 1 })()`);
    await esperar(4000);
    const conFotos = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso;
      for (const id of ['coihue','lenga','cipres','calafate','amancay','llaollao','pudu','chucao','condor','zorro','manganga','arcoiris','perca','cruz-del-sur','luna-llena','geminidas','mariposa','pehuen'])
        if (!P.entradas[id]) P.entradas[id] = { dia: 2 + (id.length % 5), hora: 10, cantidad: 0 };
      const mini = H.__fotosJuego().hacerMiniatura(H.renderer.domElement);
      let n = 0; for (const d of H.__DESAFIOS.slice(0, 4)) { P.desafios[d.id] = { dia: 3 + n, hora: 12, img: mini }; n++; }
      P.diario = [...(P.diario || []), { dia: 6, estacion: 'otoño', texto: 'Amaneció con escarcha. El pasto crujía al pisarlo. Anduve por el mallín y el arroyo. Anoté un pudú y un chucao. Saqué 3 fotos. Buen día. A dormir.' }];
      return n })()`).catch((e) => 'error: ' + e.message);
    ok(conFotos === 4, `hay fotos en el álbum para pegar (${conFotos})`);
    await js(`window.__hojarasca.abrir('cuaderno'); 1`);
    await esperar(1500);
    const boton = await js(`!!document.querySelector('#cuaderno-lista .boton-lamina')`);
    ok(boton, 'el cuaderno tiene el botón «Guardar como lámina»');
    await js(`window.__hojarasca.volverAlJuego(); 1`);
    const lam = await js(`(async()=>{ const c = await window.__hojarasca.__armarLamina();
      const x = c.getContext('2d'), px = (a, b) => Array.from(x.getImageData(a, b, 1, 1).data);
      return { w: c.width, h: c.height, url: c.toDataURL('image/png'), papel: px(30, 800), foto: px(330, 490) } })()`).catch((e) => ({ error: e.message }));
    ok(!lam.error, `la lámina se arma sin errores ${lam.error || ''}`);
    if (!lam.error) {
      ok(lam.w === 2400 && lam.h === 1600, `a buena resolución (${lam.w}×${lam.h})`);
      ok(lam.papel[0] > 150 && lam.papel[0] > lam.papel[2], `sobre papel color crema (${lam.papel.slice(0, 3)})`);
      const fs = require('fs'); fs.mkdirSync(path.join(raiz, 'pruebas', 'salidas'), { recursive: true });
      fs.writeFileSync(path.join(raiz, 'pruebas', 'salidas', 'lamina-prueba.png'), Buffer.from(lam.url.split(',')[1], 'base64'));
      ok(lam.url.length > 200000, `con contenido de verdad (${Math.round(lam.url.length / 1024)} KB)`);
    }
  } catch (e) {
    errores.push('excepcion: ' + (e && e.message ? e.message : e));
  }
  console.log(pasos.join('\n'));
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});

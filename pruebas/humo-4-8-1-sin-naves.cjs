// 4.8.1 (aro) — partida real (Electron + WebGL): una noche completa sin nave. Brota el aro de hongos, salen los duendes de a
// uno desde abajo de la tierra, queda acechando, se cierra al amanecer; un puesto de los invasores sin su haz; una ruina del
// bosque (se recorre y da el plano); el cofre de la pistola (antes, la cápsula estrellada). Con -Visible deja capturas.
//
// Uso (PowerShell, de a una; las capturas piden -Visible):
//   powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-8-1-sin-naves.cjs -Espera 900 -Perfil <carpeta> [-Visible]
// Las capturas van a pruebas\salidas\sin-naves-481 (o a lo que diga HUMO_SALIDA).
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const H = 'window.__hojarasca';
const salida = process.env.HUMO_SALIDA ? path.resolve(process.env.HUMO_SALIDA) : path.join(raiz, 'pruebas', 'salidas', 'sin-naves-481');
const CON_FOTOS = process.env.HUMO_OCULTO === '0';

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  const w = new BrowserWindow({ show: true, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300));
  });
  const js = (c) => w.webContents.executeJavaScript(c);
  const ok = (cond, texto) => { pasos.push(`${cond ? '✓' : '✗'} ${texto}`); console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const url = path.join(raiz, 'index.html');
  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) { listo = true; break; } }
    ok(listo, 'carga el modo Desafío');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(`(() => { const H = ${H}, D = H.desafio; if (D.__envuelto) return 1; const orig = D.actualizar; D.__envuelto = true;
      D.actualizar = function (dt, c) { const r = orig.call(this, window.__congelar ? 0 : dt, c);
        const k = window.__cam; if (k) { if (k.h != null) k.o[1] = H.T.altura(k.o[0], k.o[2]) + k.h; const cam = H.camara; cam.position.set(k.o[0], k.o[1], k.o[2]); cam.lookAt(k.a[0], k.a[1], k.a[2]); cam.updateMatrixWorld(true); for (const h of cam.children) h.visible = false; }
        return r; };
      H.ajustes.limiteFps = 'libre'; H.progreso.desafio.tutorial = 99; return 1 })()`);
    if (CON_FOTOS) await js(`(() => { const s = document.createElement('style'); s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; document.head.appendChild(s); return 1; })()`);
    const sim = (seg, extra = '') => js(`(()=>{const H=${H}; for(let i=0;i<${Math.round(seg / 0.05)};i++){ H.progreso.desafio.salud = 100; ${extra} H.desafio.actualizar(0.05,{noche:1, dtReal:0.05}); } return 1})()`);
    const foto = async (nombre, cam) => {
      if (!CON_FOTOS) return;
      fs.mkdirSync(salida, { recursive: true });
      await js(`(()=>{ const H=${H}; window.__cam = ${JSON.stringify(cam)}; window.__congelar = true; for (let i = 0; i < 4; i++) { H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); H.__bucle(); } return 1 })()`);
      await esperar(1200);
      try { await w.webContents.capturePage(); } catch (e) { /* se descarta el primero */ }
      await esperar(600);
      let img = null;
      for (let k = 0; k < 4 && !img; k++) { try { img = await w.webContents.capturePage(); } catch (e) { await esperar(1500); } }
      if (img) fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
      console.log('  foto', nombre, img ? 'ok' : 'SIN IMAGEN');
      await js(`window.__cam = null; window.__congelar = false; 1`);
    };

    // ---------------------------------------------------------------- 1. una noche completa
    // (con un código de partida el punto de bajada es siempre el mismo)
    await js(`(()=>{ const H=${H}, D=H.progreso.desafio; D.semilla = 'COIHUE-4821'; D.oleadas = 0; D.especial = null; D.especialAnterior = 'roja'; D.oleadaNoche = null; D.oleadaTerminada = false; D.ladoNoche = null; D.rescate = null; H.progreso.dia++; H.progreso.horas = 19.6; return 1 })()`);
    await sim(1.2, 'H.progreso.horas += 0.0005;');
    // el cuadro de una noche: lo que mira el estado del aro y de los duendes cada 0,05 s
    const estado = () => js(`(()=>{ const H=${H}, D=H.desafio, g=D.nave, ud=g.userData; const suelo = (x, z) => H.T.altura(x, z);
      const bajando = D.aliens.filter(a => a.estado === 'bajar').map(a => ({ y: a.m.g.position.y - suelo(a.m.g.position.x, a.m.g.position.z), brota: !!a.brota }));
      let aditivos = 0; g.traverse(o => { if (o.isMesh && o.material && o.material.blending === 2) aditivos++; });
      return { visible: g.visible, partesY: ud.partes.position.y, partesVisible: ud.partes.visible, tapaVisible: ud.tapa.visible, bajando, vivos: D.aliens.filter(a => a.estado !== 'morir' && a.estado !== 'irse').length, total: D.aliens.length, aditivos, hijos: g.children.length, x: g.position.x, y: g.position.y, z: g.position.z, suelo: suelo(g.position.x, g.position.z),
        luces: ud.halos.filter(h => h.luci != null && h.tam > 0.5).length, porBajar: -1 } })()`);
    await js(`${H}.progreso.horas = 20.6; 1`);
    const cronologia = [];
    let primero = null, primeraSalida = null, ultimaSalida = null;
    const salidas = [];
    let yaFoto = { llegando: false, bajando: false, vigilando: false };
    for (let k = 1; k <= 700; k++) {   // 35 s de noche
      await sim(0.05);
      const e = JSON.parse(JSON.stringify(await estado()));
      if (k === 1) primero = e;
      if (e.bajando.length && !primeraSalida) primeraSalida = { k, e };
      if (e.total > (cronologia.length ? cronologia[cronologia.length - 1].total : 0)) salidas.push({ t: k * 0.05, total: e.total });
      cronologia.push(e);
      if (k === 40 && !yaFoto.llegando) {   // 2 s: brotando
        yaFoto.llegando = true;
        await foto('aro-brotando', { o: [e.x + 14, 0, e.z + 6], h: 2.2, a: [e.x, e.suelo + 1.2, e.z] });
      }
      if (k === 140 && !yaFoto.bajando) {   // 7 s: saliendo
        yaFoto.bajando = true;
        await foto('aro-saliendo', { o: [e.x + 13, 0, e.z + 5], h: 2.2, a: [e.x, e.suelo + 1.4, e.z] });
        await foto('aro-saliendo-arriba', { o: [e.x + 8, 0, e.z + 3], h: 14, a: [e.x, e.suelo, e.z] });
      }
    }
    ok(primero.visible && primero.hijos >= 3, `el aro se ve al caer la noche (${primero.hijos} hijos)`);
    ok(primero.partesY < -1, `empieza hundido (${primero.partesY.toFixed(2)} m) y brota`);
    ok(Math.abs(primero.y - primero.suelo) < 0.01, `está en el suelo, no en el cielo (y ${primero.y.toFixed(1)} · suelo ${primero.suelo.toFixed(1)})`);
    const finLlegando = cronologia[75];   // 3,8 s
    ok(finLlegando.total === 0, 'mientras brota (4 s) no sale ningún duende');
    ok(cronologia.every((e) => e.aditivos === 0), 'el aro no tiene ningún dibujo aditivo (haz, reflectores, cono): nunca');
    ok(primeraSalida && primeraSalida.k * 0.05 >= 3.9 && primeraSalida.k * 0.05 <= 4.5, `el primero sale cuando termina de brotar (${primeraSalida ? (primeraSalida.k * 0.05).toFixed(2) : '?'} s: antes 4 s)`);
    ok(primeraSalida && primeraSalida.e.bajando.every((b) => b.brota && b.y < 0.05), 'sale de abajo de la tierra (sube): nadie cae del cielo');
    // el estado de un duende de punta a punta: cuánto tarda en salir
    const tSalida = await js(`(()=>{ const H=${H}, D=H.desafio; const a = D.aliens.find(x => x.estado !== 'morir'); if (!a) return null; return { estado: a.estado, y: a.m.g.position.y - H.T.altura(a.m.g.position.x, a.m.g.position.z) } })()`);
    ok(tSalida && tSalida.estado !== 'bajar' && Math.abs(tSalida.y) < 0.2, `ya salió y pisa el suelo (${tSalida && tSalida.estado})`);
    // cuántos salieron y cada cuánto (de a uno)
    const hechos = new Set(), instantes = [];
    salidas.forEach((s) => instantes.push(s.t));
    ok(salidas.length >= 3, `salieron de a uno, escalonados (${salidas.length} instantes: ${instantes.slice(0, 8).map((t) => t.toFixed(1)).join(' ')})`);
    ok(salidas.every((s, i) => i === 0 || s.t - salidas[i - 1].t >= 0.2), 'nunca dos al mismo instante');
    // cuánto tarda cada uno en asomar: el que sube tiene `brota` hasta llegar (≈2 s)
    const sube = []; let enCurso = new Map();
    cronologia.forEach((e, i) => e.bajando.forEach((b, j) => { /* sólo cuenta cuántos suben a la vez */ }));
    const maxJuntos = Math.max(...cronologia.map((e) => e.bajando.length));
    ok(maxJuntos >= 1 && maxJuntos <= 4, `suben a la vez entre 1 y 4 (máximo ${maxJuntos})`);
    // vigilando: queda acechando
    const vig = cronologia[cronologia.length - 1];
    ok(vig.visible && vig.partesVisible && Math.abs(vig.partesY) < 1e-6, 'el aro queda entero, acechando');
    ok(vig.luces <= 4, `y la columna de luciérnagas casi se apaga (${vig.luces} encendidas)`);
    const luzI = await js(`(()=>{ let m = 0; ${H}.desafio.nave.traverse(o => { if (o.isPointLight) m = o.intensity; }); return m })()`);
    ok(luzI > 0.5 && luzI < 6, `la luz fija del aro es ámbar y tenue (intensidad ${luzI.toFixed(2)})`);
    const luzColor = await js(`(()=>{ let c = null; ${H}.desafio.nave.traverse(o => { if (o.isPointLight) c = o.color.getHex(); }); return c })()`);
    ok(luzColor === 0xffb060, 'de color ámbar (0xffb060)');
    await foto('aro-acechando', { o: [primero.x + 13, 0, primero.z + 5], h: 2.2, a: [primero.x, primero.suelo + 1.4, primero.z] });
    await foto('aro-acechando-lejos', { o: [primero.x + 60, 0, primero.z + 22], h: 1.8, a: [primero.x, primero.suelo + 3, primero.z] });
    // ninguna cosa de la escena parece un platillo: nada plano, ancho y metálico flotando
    const raros = await js(`(()=>{ const H=${H}; const l = []; H.escena.traverse(o => { if (!o.isMesh || !o.visible) return; const p = new H.THREE.Vector3(); o.getWorldPosition(p); const g = o.geometry; if (g && g.type === 'SphereGeometry' && g.parameters && g.parameters.radius >= 8 && g.parameters.radius <= 60) l.push(o.name || 'esfera grande'); if (g && g.type === 'TorusGeometry' && g.parameters && g.parameters.radius >= 8 && g.parameters.radius <= 60) l.push('toro grande'); }); return l })()`);
    ok(raros.length === 0, `en la escena no hay esferas ni toros enormes (platillos): ${JSON.stringify(raros)}`);

    // ---------------------------------------------------------------- 2. se acaba la noche: se cierra
    // (cuando el último cae, la nave —ahora el aro— se va: fase `yendo`, 5 s)
    await js(`(()=>{ const H=${H}; for (const a of H.desafio.aliens.slice()) { a.estado = 'irse'; a.t = 9; } return 1 })()`);
    let vioTapa = false, tInicio = null, tCierre = null;
    let amaneciendo = false;
    for (let k = 1; k <= 800; k++) {
      await sim(0.05);
      const e = await estado();
      // (si la noche no termina sola con los duendes que se van, termina al amanecer)
      if (k === 100 && tInicio === null) { amaneciendo = true; await js(`${H}.progreso.horas = 6.05; 1`); }
      if (e.tapaVisible) vioTapa = true;
      if (tInicio === null && e.partesY < -0.02) { tInicio = k * 0.05; await foto('aro-cerrandose', { o: [primero.x + 13, 0, primero.z + 5], h: 2.2, a: [primero.x, primero.suelo + 0.8, primero.z] }); }
      if (!e.visible && tCierre === null) { tCierre = k * 0.05; ok(e.partesVisible === false && e.tapaVisible === false, 'a los pocos segundos se cerró del todo y no queda nada colgado'); break; }
    }
    ok(vioTapa, 'al irse se tapa con tierra y hojas');
    ok(tInicio !== null && tCierre !== null && Math.abs((tCierre - tInicio) - 5) <= 0.6, `se hunde y se cierra en lo de siempre: 5 s (acá ${tInicio === null || tCierre === null ? '?' : (tCierre - tInicio).toFixed(2)} s${amaneciendo ? ', al amanecer' : ''})`);

    // ---------------------------------------------------------------- 3. un puesto de los invasores
    await js(`${H}.progreso.horas = 11.5; 1`);
    const pu = JSON.parse(await js(`(()=>{ const H=${H}, D=H.desafio, js=H.jugador.estado, d=H.progreso.desafio;
      const libre = (x, z, r) => { if (H.T.agua(x, z)) return false; for (const dx of [-4, 0, 4]) for (const dz of [-4, 0, 4]) for (const c of H.col.cercanos(x + dx, z + dz)) { if (c.despejado) continue; if (Math.hypot((c.x ?? x) - x, (c.z ?? z) - z) < (c.r || 0) + r) return false; } return true; };
      let x = js.pos.x + 60, z = js.pos.z + 20;
      for (let k = 0; k < 120; k++) { const a = k * 2.399963, rr = 45 + k * 1.2, cx = js.pos.x + Math.cos(a) * rr, cz = js.pos.z + Math.sin(a) * rr; if (libre(cx, cz, 9)) { x = cx; z = cz; break; } }
      d.puestos = d.puestos && Array.isArray(d.puestos.lista) ? d.puestos : { lista: [], proximoId: 1, golpes: [], rotos: 0 };
      d.puestos.lista = d.puestos.lista.filter((p) => p.id !== 999);
      d.puestos.lista.push({ id: 999, x, z, nivel: 3, nacio: 1, crecio: 1, guardias: 0, visto: true, roto: false, estructuras: [
        { tipo: 'aguja', dx: 0, dz: 0, vida: 150, max: 150 }, { tipo: 'vaina', dx: -4.2, dz: -2.4, vida: 80, max: 80 }, { tipo: 'generador', dx: 4.0, dz: -2.0, vida: 110, max: 110 }, { tipo: 'vaina', dx: 2.6, dz: 3.4, vida: 80, max: 80 }] });
      D.puestosMundo.sincronizar(); for (let i = 0; i < 6; i++) D.actualizar(0.05, { noche: 0, dtReal: 0.05 });
      let alto = 0, aditivos = 0; const m = []; H.escena.traverse(o => { if (o.name === 'puesto-invasor') { o.traverse(q => { if (q.isMesh) { m.push(q.geometry.type); if (q.material.blending === 2) aditivos++; const bb = new H.THREE.Group(); } }); } });
      return JSON.stringify({ x, z, y: H.T.altura(x, z), mallas: m.length, aditivos }) })()`));
    ok(pu.mallas > 3 && pu.aditivos === 0, `el puesto tiene sus mallas (${pu.mallas}) y ningún haz aditivo (${pu.aditivos})`);
    await sim(3);
    const esp = await js(`(()=>{ const H=${H}; let n = 0; H.escena.traverse(o => { if (o.name === 'puesto-invasor') o.traverse(q => { if (q.userData && q.userData.halos) n += q.userData.halos.filter(h => h.esp != null).length; }); }); return n })()`);
    ok(esp >= 8, `el hongo alto suelta esporas (${esp} halos que suben apenas)`);
    await foto('puesto-dia', { o: [pu.x - 13, 0, pu.z - 9], h: 2.0, a: [pu.x, pu.y + 2.5, pu.z] });
    await js(`${H}.progreso.horas = 22.5; 1`);
    await foto('puesto-noche', { o: [pu.x - 13, 0, pu.z - 9], h: 2.0, a: [pu.x, pu.y + 3.5, pu.z] });
    await js(`(()=>{ const d=${H}.progreso.desafio; d.puestos.lista = d.puestos.lista.filter(p => p.id !== 999); ${H}.desafio.puestosMundo.sincronizar(); return 1 })()`);

    // ---------------------------------------------------------------- 4. una ruina del bosque (se recorre y da el plano)
    await js(`${H}.progreso.horas = 11.5; 1`);
    const ru = JSON.parse(await js(`(()=>{ const H=${H}, D=H.desafio, d=H.progreso.desafio; d.restos = null; d.planos = []; const hubo = D.eventos.soltarRestos(); const q = d.restos; if (!q) return JSON.stringify({ hubo });
      H.jugador.ubicar(q.x + 30, q.z, 0); for (let i = 0; i < 5; i++) D.actualizar(0.05, { noche: 0, dtReal: 0.05 });
      let mallas = 0, aditivos = 0, nombres = []; H.escena.traverse(o => { if (o.name === 'ruina-del-bosque') o.traverse(m => { if (m.isMesh) { mallas++; if (m.material.blending === 2) aditivos++; } }); });
      return JSON.stringify({ hubo, x: q.x, z: q.z, rot: q.rot, y: H.T.altura(q.x, q.z), mallas, aditivos }) })()`));
    ok(ru.hubo, 'cae una ruina del bosque (cada tres noches)');
    ok(ru.mallas >= 2 && ru.mallas <= 4 && ru.aditivos === 0, `la ruina: ${ru.mallas} dibujos fusionados, sin nada aditivo`);
    const loc = (lx, lz) => [ru.x + lx * Math.cos(ru.rot) + lz * Math.sin(ru.rot), ru.z - lx * Math.sin(ru.rot) + lz * Math.cos(ru.rot)];
    const c0 = loc(0.4, -9), c1 = loc(0, 6), c2 = loc(-10, 8), c3 = loc(0, 8.5), c4 = loc(0, 1), c5 = loc(0, 14);
    await foto('ruina-entrada', { o: [c0[0], 0, c0[1]], h: 1.9, a: [c1[0], ru.y + 1.0, c1[1]] });
    await foto('ruina-lateral', { o: [c2[0], 0, c2[1]], h: 2.4, a: [c3[0], ru.y + 1.0, c3[1]] });
    await foto('ruina-adentro', { o: [c4[0], 0, c4[1]], h: 1.7, a: [c5[0], ru.y + 0.8, c5[1]] });
    // las paredes chocan igual: el jugador no atraviesa el muro de al lado
    const choca = await js(`(()=>{ const H=${H}, q = H.progreso.desafio.restos; const c = Math.cos(q.rot), s = Math.sin(q.rot);
      const w = (lx, lz) => [q.x + lx * c + lz * s, q.z - lx * s + lz * c];
      const dentro = w(0, 8), pared = w(-1.7, 8), fuera = w(-4.5, 8);
      return JSON.stringify({ choca: H.col.hayColision ? true : null, n: H.col.cercanos(pared[0], pared[1]).length }) })()`);
    ok(JSON.parse(choca).n >= 1, 'hay colisiones cerca de las paredes de la ruina');
    // se recorre hasta el fondo: el premio es el mismo (un plano)
    const prem = JSON.parse(await js(`(()=>{ const H=${H}, D=H.desafio, r=H.progreso.desafio.restos; const fx=r.x+15.8*Math.sin(r.rot), fz=r.z+15.8*Math.cos(r.rot);
      H.jugador.ubicar(fx, fz, 0); for (let i = 0; i < 6; i++) D.actualizar(0.05, { noche: 0, dtReal: 0.05 });
      for (const a of D.aliens.slice()) if (a.estado === 'dormido' || a.estado === 'avanzar') { a.vida = 0; a.estado = 'irse'; a.t = 9; }
      return JSON.stringify({ planos: H.progreso.desafio.planos, restos: !!H.progreso.desafio.restos }) })()`));
    ok(prem.planos.includes('escudo') && !prem.restos, `al fondo de la ruina da el plano de siempre (${prem.planos.join(', ')})`);

    // ---------------------------------------------------------------- 5. el cofre de la pistola (la cápsula)
    const cap = JSON.parse(await js(`(()=>{ const H=${H}, c = H.desafio.capsula; return JSON.stringify({ x: c.x, z: c.z, y: c.y }) })()`));
    await js(`(()=>{ const H=${H}; H.jugador.ubicar(${cap.x} + 14, ${cap.z} + 14, 0.7); for (let i = 0; i < 6; i++) H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 }); return 1 })()`);
    await foto('cofre-pistola', { o: [cap.x + 6, 0, cap.z + 4], h: 1.8, a: [cap.x, cap.y + 0.8, cap.z] });
    const antesCofre = await js(`(()=>{ const D=${H}.progreso.desafio; return { enc: !!D.pistolaEncontrada, cargas: D.cargas } })()`);
    await js(`(()=>{ const H=${H}; H.jugador.ubicar(${cap.x} + 1.5, ${cap.z}, 0); for (let i = 0; i < 6; i++) H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 }); return 1 })()`);
    const despuesCofre = await js(`(()=>{ const D=${H}.progreso.desafio; return { enc: !!D.pistolaEncontrada, cargas: D.cargas } })()`);
    ok(!antesCofre.enc && despuesCofre.enc && despuesCofre.cargas === antesCofre.cargas + 12, `el cofre de los duendes da la pistola de luz y 12 cargas (${antesCofre.cargas} → ${despuesCofre.cargas})`);
    const cofreHaz = await js(`(()=>{ let n = 0; ${H}.escena.traverse(o => { if (o.name === 'cofre-duendes') o.traverse(q => { if (q.isMesh && q.material.blending === 2 && q.visible) n++; }); }); return n })()`);
    ok(cofreHaz === 0, 'el cofre de los duendes no tiene haz de luz visible');

    // ---------------------------------------------------------------- 6. el sonido (si el motor de audio ya existe)
    const snd = await js(`(()=>{ const s = ${H}.__sonido && ${H}.__sonido(); if (!s || !s.ctx) return null; return { previos: [...s.previo.keys()].filter(k => k.startsWith('aro-')) } })()`);
    if (snd) ok(snd.previos.length >= 1, `los sonidos del aro se sintetizaron (${snd.previos.join(', ')})`);
    else console.log('  (sin motor de audio en esta ventana: el sonido se prueba en verificar-4-8-1-sin-naves.mjs)');
  } catch (e) {
    errores.push('excepción: ' + (e && e.stack || e));
    console.log('✗ excepción', e && e.stack || e);
  }
  ok(errores.filter((x) => !/^excepción/.test(x) && !pasos.some((p) => p.endsWith(x))).length === 0, 'sin errores de consola');
  console.log(errores.length ? `\n${errores.length} PROBLEMAS` : '\nTODO BIEN');
  app.exit(errores.length ? 1 : 0);
});

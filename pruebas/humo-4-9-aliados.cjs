// 4.9 (aliados): partida real. Una noche grande con los vecinos que ayudan (Anselmo, la abuela Herminia, Martín en la trochita y los
// chicos con la honda), los puestos que marca el jugador, la campana tocada a mano y el perro al portón. Con capturas si va -Visible.
//
// Uso (desde PowerShell, de a una):
//   powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-9-aliados.cjs -Espera 900 -Perfil <carpeta> [-Visible]
// Las capturas van a pruebas\salidas\aliados-49 (o a lo que diga HUMO_SALIDA). Oculto sólo comprueba.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const H = 'window.__hojarasca';
const salida = process.env.HUMO_SALIDA ? path.resolve(process.env.HUMO_SALIDA) : path.join(raiz, 'pruebas', 'salidas', 'aliados-49');
const CON_FOTOS = process.env.HUMO_OCULTO === '0';

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  const w = new BrowserWindow({ show: true, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push('consola: ' + m.slice(0, 300));
  });
  const js = (c) => w.webContents.executeJavaScript(c);
  const ok = (cond, texto) => { pasos.push(`${cond ? '✓' : '✗'} ${texto}`); console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const url = path.join(raiz, 'index.html');
  const med = {};   // lo medido, para el informe

  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) { listo = true; break; } }
    ok(listo, 'carga el modo Desafío');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    ok(await js(`!!${H}.desafio.vecinos && !!${H}.desafio.campana`), 'el Desafío tiene los vecinos y la campana');

    // el cuadro y la cámara para las capturas (como en el humo de los ataques)
    await js(`(() => { const H = ${H}, D = H.desafio; if (D.__envuelto) return 1; const orig = D.actualizar; D.__envuelto = true;
      D.actualizar = function (dt, c) { const r = orig.call(this, window.__congelar ? 0 : dt, c);
        const k = window.__cam; if (k) { const cam = H.camara; cam.position.set(k.o[0], k.o[1], k.o[2]); cam.lookAt(k.a[0], k.a[1], k.a[2]); cam.updateMatrixWorld(true); for (const h of cam.children) h.visible = false; }
        return r; };
      H.ajustes.limiteFps = 'libre'; H.progreso.desafio.tutorial = 99; return 1 })()`);
    // un paso de simulación: el Desafío y la gente (gente.js es quien camina a los vecinos)
    const sim = (seg, extra = '') => js(`(()=>{const H=${H}; for(let i=0;i<${Math.round(seg / 0.05)};i++){ ${extra} H.desafio.actualizar(0.05,{noche:1, dtReal:0.05}); H.gente.actualizar(0.05, H.jugador.estado, H.camara, null, 0); } return 1})()`);
    const foto = async (nombre, cam) => {
      if (!CON_FOTOS) return;
      fs.mkdirSync(salida, { recursive: true });
      await js(`(()=>{ const H=${H}; window.__cam = ${JSON.stringify(cam)}; window.__congelar = true; for (let i = 0; i < 4; i++) { H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); H.__bucle(); } return 1 })()`);
      await esperar(1500);
      try { await w.webContents.capturePage(); } catch (e) { /* el primero puede venir de antes de mover la cámara */ }
      await esperar(700);
      let img = null;
      for (let k = 0; k < 4 && !img; k++) { try { img = await w.webContents.capturePage(); } catch (e) { await esperar(1500); } }
      if (img) fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
      console.log('  foto', nombre, img ? 'ok' : 'SIN IMAGEN');
      await js(`window.__cam = null; window.__congelar = false; 1`);
    };
    if (CON_FOTOS) await js(`(() => { const s = document.createElement('style'); s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; document.head.appendChild(s); return 1; })()`);

    // ---------------------------------------------------------------- la base: un claro, una empalizada alrededor, un portón y la campana
    const claro = JSON.parse(await js(`(()=>{ const H = ${H}, r = H.T.lugares.refugio, j = H.jugador.estado;
      for (let k = 0; k < 80; k++) {
        const x = r.x + 70 + (k % 8) * 26, z = r.z + 70 + Math.floor(k / 8) * 26;
        let bien = true;
        // la vía a entre 45 y 110 m: la base no queda sobre los rieles y el silbato de Martín alcanza
        let dv = 1e9; for (const q of H.T.riel) dv = Math.min(dv, Math.hypot(q.x - x, q.z - z));
        if (dv < 45 || dv > 110) continue;
        for (let a = 0; a < 16 && bien; a++) for (const rad of [4, 10, 16]) { const px = x + Math.cos(a * 0.39) * rad, pz = z + Math.sin(a * 0.39) * rad; if (H.T.agua(px, pz) || Math.abs(H.T.altura(px, pz) - H.T.altura(x, z)) > 1.4) { bien = false; break; } }
        if (!bien) continue;
        j.pos.set(x, H.T.altura(x, z) + 0.05, z); j.yaw = 0; j.pitch = 0; return JSON.stringify({ x, z, y: H.T.altura(x, z) });
      } return 'null' })()`));
    ok(!!claro, 'hay un claro llano para la base, a 45-110 m de la vía');
    const poner = (id, dx, dz, yaw) => js(`(()=>{ const H = ${H}, O = H.obras, P = H.progreso, j = H.jugador.estado;
      Object.assign(P.materiales, { tronco: 400, tabla: 400, piedra: 400, cristal: 400 });
      const p = H.PLANOS.find(q => q.id === '${id}'); if (!p) return { error: 'no hay plano ${id}' };
      for (const r of [0, 1.2, 2.4]) for (let k = 0; k < 8; k++) {
        O.elegir(p);
        const a = k * Math.PI / 4, x = j.pos.x + (${dx}) + Math.cos(a) * r, z = j.pos.z + (${dz}) + Math.sin(a) * r;
        const f = O.fundar(x, z, ${yaw}, j.pos.y);
        if (!f.ok) continue;
        for (let g = 0; g < 12 && f.obra.datos.etapas < f.obra.plano.etapas.length; g++) { const q = O.avanzar(f.obra, P.materiales); if (!q.ok) break; }
        O.elegir(null); P.obras = O.obras.map(o => o.datos);
        return { ok: true, i: O.obras.indexOf(f.obra), x: f.obra.datos.x, z: f.obra.datos.z };
      }
      O.elegir(null); return { error: 'no hubo lugar para ${id}' } })()`);
    let puestas = 0, errP = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2, R = 11;
      const r = await poner(i === 3 ? 'porton-empalizada' : 'empalizada', Math.cos(a) * R, Math.sin(a) * R, -(a + Math.PI / 2));
      if (r.ok) puestas++; else errP.push(r.error);
    }
    const bell = await poner('campana', 2.5, 2.5, 0);
    ok(puestas >= 9, `se levantaron ${puestas} de 12 tramos de la empalizada y el portón`);
    ok(bell.ok, 'se levantó la campana de alarma');
    if (!bell.ok) console.log('  campana:', bell.error);
    await js(`(()=>{ const H=${H}; H.desafio.refrescarDefensas ? H.desafio.refrescarDefensas() : 0; H.desafio.fortin.refrescar(); H.desafio.defensas?.refrescar?.(); return 1 })()`);

    // ---------------------------------------------------------------- una noche grande (la 12), antes de la hora del ataque
    await js(`(()=>{ const H=${H}, D=H.progreso.desafio; D.oleadas = 11; D.especial = null; D.companeros = []; D.ordenes = {}; D.puestosAliados = {}; H.progreso.dia = 12; H.progreso.horas = 19.7; D.oleadaNoche = null; D.oleadaTerminada = true; return 1 })()`);
    await sim(0.5);
    const gente0 = await js(`${H}.gente.gente.length`);
    // se arman de a poco: unos ms por cuadro
    let presentes = [];
    for (let k = 0; k < 60 && presentes.length < 4; k++) { await sim(0.5); presentes = JSON.parse(await js(`JSON.stringify(${H}.desafio.vecinos.presentes())`)); }
    ok(presentes.length === 4, `a la tarde de la noche 12 vienen los cuatro cuerpos (${presentes.join(', ')})`);
    const cuerpos = JSON.parse(await js(`JSON.stringify(${H}.gente.gente.filter(g => g.claveAliado).map(g => ({ k: g.claveAliado, visible: g.g.visible, enBase: g.enBase, dormido: g.dormido, x: g.pos.x, z: g.pos.z, nombre: g.nombre })))`));
    ok(cuerpos.length === 4 && cuerpos.every((c) => c.enBase && !c.dormido), 'son vecinos de la base: ' + cuerpos.map((c) => c.nombre).join(', '));
    const distBase = cuerpos.map((c) => Math.hypot(c.x - claro.x, c.z - claro.z));
    ok(distBase.every((d) => d < 14), `están adentro de la empalizada (a ${distBase.map((d) => d.toFixed(1)).join(', ')} m del centro)`);
    ok((await js(`${H}.gente.gente.length`)) === gente0 + 4, 'la gente del Desafío sumó exactamente cuatro figuras');
    // a esa hora todavía no hay duendes
    ok((await js(`${H}.desafio.aliens.filter(a => a.estado !== 'morir').length`)) === 0, 'todavía no salieron los duendes');

    // ---------------------------------------------------------------- Herminia prende los fuegos
    await sim(30);
    const fuegos = JSON.parse(await js(`JSON.stringify(${H}.desafio.vecinos.fuegosPrendidos())`));
    ok(fuegos.length === 2, `con el nivel de respaldo (1), Herminia prendió dos fuegos (${fuegos.map((f) => f.tipo + ' ' + f.radio.toFixed(1) + ' m').join(', ')})`);
    med.fuegos = fuegos;
    // los viejos no se acercan a un fuego prendido; los traviesos sí
    // (adentro de la empalizada, sin paredes de por medio: un duende a 13 m del fogón, del otro lado del centro, va hacia vos, que estás junto al fuego;
    // el control es el mismo viaje con los fuegos apagados)
    const prueba = async (viejo, conFuego) => JSON.parse(await js(`(()=>{ const H=${H}, D=H.desafio, e = D.vecinos.estado, f = D.vecinos.fuegosPrendidos()[0], c = ${JSON.stringify(claro)};
      const lit = e.lit.slice(); if (!${conFuego}) e.lit.length = 0;
      const ang = Math.atan2(f.x - c.x, f.z - c.z);
      for (const a of D.aliens) { a.estado = 'irse'; a.t = 9; } D.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      const sx = f.x - Math.sin(ang) * 13, sz = f.z - Math.cos(ang) * 13;
      const a = D.invocar('rastreador', sx, sz); a.vida = a.vidaMax = 9999; a.estado = 'avanzar'; a.m.vestir(${viejo}, 1);
      const jx = f.x - Math.sin(ang) * 0.8, jz = f.z - Math.cos(ang) * 0.8, jy = H.T.altura(jx, jz);
      H.jugador.estado.pos.set(jx, jy + 0.05, jz);
      // mirando para el otro lado (si lo mirás, el rastreador rodea o se esconde en vez de venir: eso se juega al azar)
      H.camara.position.set(jx, jy + 1.6, jz); H.camara.lookAt(jx + Math.sin(ang) * 10, jy + 1.6, jz + Math.cos(ang) * 10); H.camara.updateMatrixWorld(true);
      let min = 1e9;
      for (let i = 0; i < 500; i++) { H.progreso.desafio.salud = 100; D.actualizar(0.05, { noche: 1, dtReal: 0.05 }); H.gente.actualizar(0.05, H.jugador.estado, H.camara, null, 0); const p = a.m.g.position; min = Math.min(min, Math.hypot(p.x - f.x, p.z - f.z)); }
      const r = { min, radio: f.radio, viejo: !!a.m.viejo };
      a.estado = 'irse'; a.t = 9; D.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      e.lit.length = 0; for (const g of lit) e.lit.push(g);
      return JSON.stringify(r) })()`));
    const luces = JSON.parse(await js(`JSON.stringify(${H}.desafio.vecinos.fuegosPrendidos())`));
    const pv = await prueba(true, true);
    const pvc = await prueba(true, false);
    const pt = await prueba(false, true);
    ok(pvc.min < pvc.radio - 4, `el control (sin fuegos): el viejo llega hasta ${pvc.min.toFixed(1)} m del fogón`);
    ok(pv.viejo && pv.min > pv.radio - 1.6, `con el fogón prendido, un viejo no baja de ${(pv.radio - 1.6).toFixed(1)} m (llegó a ${pv.min.toFixed(1)} m; radio ${pv.radio.toFixed(1)})`);
    ok(!pt.viejo && pt.min < pt.radio - 4, `un travieso sí pasa por la luz (llegó a ${pt.min.toFixed(1)} m)`);
    ok((await js(`${H}.desafio.vecinos.fuegosPrendidos().length`)) === luces.length, 'y los fuegos siguen prendidos');
    med.viejoMin = pv.min; med.viejoSinFuego = pvc.min; med.traviesoMin = pt.min;

    // ---------------------------------------------------------------- Anselmo arregla
    const rotas = JSON.parse(await js(`(()=>{ const H=${H}, c = ${JSON.stringify(claro)}; H.jugador.estado.pos.set(c.x, H.T.altura(c.x, c.z) + 0.05, c.z);
      const o = H.obras.obras.filter(q => q.plano.id === 'empalizada').slice(0, 3); for (const q of o) q.datos.vida = 25; return JSON.stringify(o.map(q => ({ vida: q.datos.vida, max: q.plano.vida }))) })()`));
    await sim(140);
    const despues = JSON.parse(await js(`JSON.stringify(${H}.obras.obras.filter(q => q.plano.id === 'empalizada').slice(0, 3).map(q => Math.round(q.datos.vida)))`));
    ok(despues.every((v) => v >= 300), `Anselmo (y nadie más) arregló las tres rotas, una tras otra: ${rotas.map((r) => r.vida).join(',')} → ${despues.join(',')} de ${rotas[0].max}`);

    // ---------------------------------------------------------------- los chicos con la honda
    await js(`(()=>{ const H=${H}, D=H.desafio; for (const a of D.aliens) { a.estado = 'irse'; a.t = 9; } D.actualizar(0.05, { noche: 1, dtReal: 0.05 }); return 1 })()`);
    const kid = JSON.parse(await js(`(()=>{ const H=${H}, g = H.gente.gente.find(q => q.claveAliado === 'nene'); return JSON.stringify({ x: g.pos.x, z: g.pos.z }) })()`));
    const blanco = JSON.parse(await js(`(()=>{ const H=${H}, D=H.desafio, k = ${JSON.stringify(kid)}, c = ${JSON.stringify(claro)};
      const dx = k.x - c.x, dz = k.z - c.z, l = Math.hypot(dx, dz) || 1;
      const x = k.x + dx / l * 12, z = k.z + dz / l * 12;
      const a = D.invocar('rastreador', x, z); a.vida = a.vidaMax = 800; a.estado = 'avanzar'; a.dudaT = 999; window.__blanco = a; a.m.vestir(false, 1);
      return JSON.stringify({ x, z, vida: a.vida, salud0: H.progreso.desafio.salud }) })()`));
    await sim(30);
    const resultado = JSON.parse(await js(`(()=>{ const H=${H}, a = window.__blanco; return JSON.stringify({ vida: a.vida, salud: H.progreso.desafio.salud, estado: a.estado }) })()`));
    ok(resultado.vida < blanco.vida - 3, `los chicos le pegaron con las piedras (${blanco.vida} → ${resultado.vida.toFixed(1)})`);
    ok(resultado.vida > blanco.vida - 800 * 0.5, 'con poco daño (no lo derriban de una)');
    ok(resultado.salud === blanco.salud0, 'y a vos no te tocó nada');
    med.hondas = { antes: blanco.vida, despues: resultado.vida };

    // ---------------------------------------------------------------- los puestos: vení conmigo, quedate acá
    const pu = JSON.parse(await js(`(()=>{ const H=${H}, D=H.desafio, c = ${JSON.stringify(claro)};
      const r1 = D.ordenar('anselmo');   // de «puesto» a «vení conmigo»
      H.jugador.estado.pos.set(c.x + 6, H.T.altura(c.x + 6, c.z + 4) + 0.05, c.z + 4);
      return JSON.stringify({ r1 }) })()`));
    ok(pu.r1 && pu.r1.orden === 'seguime', 'E mirando a Anselmo: «vení conmigo»');
    await sim(8);
    const aca = JSON.parse(await js(`(()=>{ const H=${H}, g = H.gente.gente.find(q => q.claveAliado === 'anselmo'), r = H.desafio.ordenar('anselmo'); const d = H.progreso.desafio;
      return JSON.stringify({ orden: r.orden, puesto: d.puestosAliados.anselmo, x: g.pos.x, z: g.pos.z, jx: H.jugador.estado.pos.x, jz: H.jugador.estado.pos.z }) })()`));
    ok(aca.orden === 'puesto' && aca.puesto && Math.hypot(aca.puesto.x - aca.x, aca.puesto.z - aca.z) < 0.2, 'E de nuevo: «quedate acá», el puesto es donde está parado');
    ok(Math.hypot(aca.x - aca.jx, aca.z - aca.jz) < 8, `vino hasta donde lo llevaste (a ${Math.hypot(aca.x - aca.jx, aca.z - aca.jz).toFixed(1)} m tuyo)`);
    await js(`(()=>{ const H=${H}, c = ${JSON.stringify(claro)}; H.jugador.estado.pos.set(c.x, H.T.altura(c.x, c.z) + 0.05, c.z); return 1 })()`);
    await sim(10);
    const quedo = JSON.parse(await js(`(()=>{ const H=${H}, g = H.gente.gente.find(q => q.claveAliado === 'anselmo'), p = H.progreso.desafio.puestosAliados.anselmo; return JSON.stringify({ d: Math.hypot(g.pos.x - p.x, g.pos.z - p.z) }) })()`));
    ok(quedo.d < 3, `se queda en su puesto aunque te vayas (a ${quedo.d.toFixed(1)} m; arregla alrededor)`);
    // se guarda con la partida
    const guardada = JSON.parse(await js(`(()=>{ const d = JSON.parse(JSON.stringify(${H}.progreso.desafio)); return JSON.stringify({ p: d.puestosAliados, o: d.ordenes }) })()`));
    ok(guardada.p && guardada.p.anselmo && guardada.o.anselmo === 'puesto', 'el puesto y la orden viajan en la partida');

    // ---------------------------------------------------------------- la campana
    // dos de ellos andan detrás tuyo, lejos de la campana
    await js(`(()=>{ const H=${H}, D=H.desafio, c = ${JSON.stringify(claro)}; D.ordenar('herminia'); D.ordenar('nene'); H.jugador.estado.pos.set(c.x - 14, H.T.altura(c.x - 14, c.z) + 0.05, c.z); return 1 })()`);
    await sim(6);
    const camp = JSON.parse(await js(`(()=>{ const H=${H}, D=H.desafio, o = H.obras.obras.find(q => q.plano.id === 'campana');
      if (!o) return JSON.stringify(null);
      const j = H.jugador.estado; j.pos.set(o.datos.x + 1.2, H.T.altura(o.datos.x, o.datos.z) + 0.05, o.datos.z);
      const aviso = D.avisoCercaDe(j.pos, 99);
      return JSON.stringify({ aviso, ordenes: Object.assign({}, H.progreso.desafio.ordenes) }) })()`));
    ok(!!camp && /Tocar la campana/.test(camp.aviso || ''), `mirando la campana, la E dice: «${camp && camp.aviso}»`);
    const toque = JSON.parse(await js(`(()=>{ const H=${H}, D=H.desafio, j = H.jugador.estado; const hizo = D.usarCercaDe(j.pos, 99);
      return JSON.stringify({ hizo, ordenes: Object.assign({}, H.progreso.desafio.ordenes), perro: D.perroAlPorton(), vibra: D.campana.enfriando }) })()`));
    ok(toque.hizo === true && toque.vibra, 'E toca la campana');
    ok(['anselmo', 'herminia', 'nene', 'nena'].every((k) => toque.ordenes[k] === 'puesto'), 'los aliados pasan a «puesto»');
    ok(toque.perro && toque.perro.corre, 'el perro tiene por destino el portón');
    console.log('  portones en la base:', await js(`${H}.obras.obras.filter(q => q.plano.porton).length`), '· destino del perro:', JSON.stringify(toque.perro));
    // la campana vibra un rato (14 s)
    const aviso2 = await js(`${H}.desafio.avisoCercaDe(${H}.jugador.estado.pos, 99)`);
    ok(/vibra/.test(aviso2 || ''), 'la campana todavía vibra');
    // los que estaban siguiéndote corren a su puesto (se mira la velocidad cuadro a cuadro)
    const corren = JSON.parse(await js(`(()=>{ const H=${H}; const max = {}; for (let i = 0; i < 80; i++) { H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 }); H.gente.actualizar(0.05, H.jugador.estado, H.camara, null, 0);
      for (const g of H.gente.gente) if (g.claveAliado) max[g.claveAliado] = Math.max(max[g.claveAliado] || 0, g.vel > 0 ? g.velocidad : 0); } return JSON.stringify(max) })()`));
    ok(Object.values(corren).filter((v) => Math.abs(v - 4.2) < 0.01).length >= 2, 'los que andaban detrás tuyo corren a su puesto (velocidad de carrera 4,2): ' + JSON.stringify(corren));
    await sim(12);
    const llegaron = JSON.parse(await js(`JSON.stringify(${H}.gente.gente.filter(g => g.claveAliado).map(g => g.velocidad))`));
    ok(llegaron.every((v) => v < 2), 'y al llegar vuelven al paso');
    // main.js le pasa el destino al perro
    await js(`${H}.__bucle(); 1`);
    const antojo = await js(`(()=>{ const m = ${H}.__mundoPerro(); return m.antojo ? { x: m.antojo.x, z: m.antojo.z } : null })()`);
    ok(!!antojo, 'main.js manda al perro a ese punto (mundoPerro.antojo)');
    if (antojo) {
      await js(`(()=>{ const p = ${H}.perro.est.pos; p.x = (${antojo.x}) + 22; p.z = (${antojo.z}) + 6; p.y = ${H}.T.altura(p.x, p.z); return 1 })()`);
      const d0 = await js(`(()=>{ const p = ${H}.perro.est.pos; return Math.hypot(p.x - (${antojo.x}), p.z - (${antojo.z})) })()`);
      for (let k = 0; k < 120; k++) { await js(`${H}.__bucle(); 1`); await esperar(40); }
      console.log('  perro:', await js(`(()=>{ const H=${H}, m = H.__mundoPerro(); return JSON.stringify({ estado: H.perro.est.estado, vel: H.perro.est.vel, ataque: !!m.ataque, alerta: !!m.alerta, antojo: !!m.antojo, rastro: !!m.rastro, jug: H.jugador.estado.pos.x + ',' + H.jugador.estado.pos.z }) })()`));
      const d1 = await js(`(()=>{ const p = ${H}.perro.est.pos; return Math.hypot(p.x - (${antojo.x}), p.z - (${antojo.z})) })()`);
      ok(d1 < 6, `el perro corre al portón (de ${d0.toFixed(1)} a ${d1.toFixed(1)} m)`);
    }

    // ---------------------------------------------------------------- Martín y la trochita
    const via = JSON.parse(await js(`(()=>{ const H=${H}, D=H.desafio; D.vecinos.__nuevaNoche ? 0 : 0; const e = D.vecinos.estado; return JSON.stringify({ via: e.via, largo: H.tren.largo, vel: H.tren.est.vel, objetivo: H.tren.est.objetivo, niveles: e.niveles, s: H.tren.est.s }) })()`));
    // la locomotora pasa por el punto de la vía más cercano a la base (la vuelta de verdad es lenta: acá se la lleva de a 6 m)
    const m1 = JSON.parse(await js(`(()=>{ const H=${H}, D=H.desafio, tr = H.tren, e = D.vecinos.estado;
      for (const a of D.aliens) { a.estado = 'irse'; a.t = 9; } D.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      D.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      const v = e.via; if (!v) return JSON.stringify({ error: 'sin vía' });
      const t1 = D.invocar('rastreador', v.x + 12, v.z + 12); t1.vida = t1.vidaMax = 900; t1.estado = 'avanzar'; t1.dudaT = 999; t1.m.vestir(false, 1);
      const v1 = D.invocar('rastreador', v.x - 12, v.z + 12); v1.vida = v1.vidaMax = 900; v1.estado = 'avanzar'; v1.dudaT = 999; v1.m.vestir(true, 1);
      const antes = e.silbatos; window.__t1 = t1; window.__v1 = v1;
      const s0 = tr.est.s; const vel0 = tr.est.vel; tr.est.vel = 7;
      for (let k = -8; k <= 8; k++) { tr.est.s = ((v.s + k * 6) % tr.largo + tr.largo) % tr.largo; D.actualizar(0.05, { noche: 1, dtReal: 0.05 }); }
      const r = { d: v.d, silbatos: e.silbatos - antes, huye1: t1.huyeT, huyeV: v1.huyeT, efectoDeberia: v.d <= 120 };
      tr.est.s = s0; tr.est.vel = vel0; return JSON.stringify(r) })()`));
    console.log('  la vía queda a', m1.d && m1.d.toFixed(1), 'm de la base; vuelta de', via.largo && via.largo.toFixed(0), 'm; velocidad objetivo', via.objetivo);
    ok(m1.silbatos === 1, 'al pasar la locomotora por el punto de la vía más cercano a la base, Martín toca el silbato una vez');
    if (m1.efectoDeberia) {
      ok(m1.huye1 > 0 && !(m1.huyeV > 0), 'a menos de 120 m de la vía: el travieso cercano sale corriendo y el viejo no');
    } else {
      ok(!(m1.huye1 > 0), 'la vía queda a más de 120 m de la base: el silbato se oye por el valle y no pasa nada');
    }
    med.via = { d: m1.d, largo: via.largo, objetivo: via.objetivo };

    // ---------------------------------------------------------------- el nivel 2 y el amanecer
    await js(`(()=>{ const H=${H}, D=H.progreso.desafio; D.aldea = { ayuda: { anselmo: 2, herminia: 2, martin: 2, chicos: 2 } }; H.progreso.horas = 7; return 1 })()`);
    await sim(1);
    ok((await js(`${H}.desafio.vecinos.presentes().length`)) === 0, 'al amanecer se van los cuatro');
    ok((await js(`${H}.desafio.vecinos.fuegosPrendidos().length`)) === 0, 'y se apagan los fuegos');
    ok((await js(`${H}.gente.gente.filter(g => g.claveAliado && !g.dormido).length`)) === 0, 'quedan escondidos');
    await js(`(()=>{ const H=${H}, D=H.progreso.desafio; H.progreso.dia = 13; H.progreso.horas = 19.7; D.oleadas = 12; D.oleadaNoche = null; D.oleadaTerminada = true; return 1 })()`);
    await sim(45);
    const f2 = JSON.parse(await js(`JSON.stringify(${H}.desafio.vecinos.fuegosPrendidos())`));
    ok(f2.length === 4 && f2[0].radio > fuegos[0].radio, `nivel 2: Herminia prende cuatro fuegos y llegan más lejos (${f2.map((f) => f.radio.toFixed(1)).join(', ')} m)`);
    ok((await js(`${H}.desafio.vecinos.presentes().length`)) === 4, 'la segunda noche grande vuelven los mismos cuerpos (no se arman de nuevo)');
    ok((await js(`${H}.gente.gente.length`)) === gente0 + 4, 'sin figuras de más');

    // ---------------------------------------------------------------- capturas
    if (CON_FOTOS) {
      fs.mkdirSync(salida, { recursive: true });
      const c = claro, yC = c.y;
      const pos = JSON.parse(await js(`JSON.stringify(Object.fromEntries(${H}.gente.gente.filter(g => g.claveAliado).map(g => [g.claveAliado, { x: g.pos.x, y: g.pos.y, z: g.pos.z }])))`));
      const fu = JSON.parse(await js(`JSON.stringify(${H}.desafio.vecinos.fuegosPrendidos())`));
      await js(`(()=>{ const H=${H}; H.clima.estado.nublado = 0.1; H.clima.estado.lluvia = 0; H.progreso.horas = 19.9; return 1 })()`);
      await foto('base-de-afuera-atardecer-a', { o: [c.x + 19, yC + 4.5, c.z + 5], a: [c.x, yC + 0.8, c.z] });
      await foto('base-de-afuera-atardecer-b', { o: [c.x - 6, yC + 4.5, c.z - 19], a: [c.x, yC + 0.8, c.z] });
      await foto('herminia-y-el-fogon', { o: [fu[0].x + 4.2, yC + 1.9, fu[0].z + 4.2], a: [fu[0].x, yC + 0.8, fu[0].z] });
      await foto('anselmo', { o: [pos.anselmo.x + 3.2, pos.anselmo.y + 1.7, pos.anselmo.z + 3.2], a: [pos.anselmo.x, pos.anselmo.y + 1.1, pos.anselmo.z] });
      await foto('los-chicos-en-la-empalizada', { o: [pos.nene.x + 3.4, pos.nene.y + 1.5, pos.nene.z + 3.4], a: [pos.nene.x, pos.nene.y + 0.9, pos.nene.z] });
      await js(`(()=>{ const H=${H}; H.progreso.horas = 22; return 1 })()`);
      await sim(1);
      await foto('base-de-noche-con-los-fuegos', { o: [c.x + 1, yC + 5.5, c.z + 14], a: [c.x, yC + 0.6, c.z - 2] });
      await foto('fogon-de-noche', { o: [fu[0].x + 5, yC + 2.2, fu[0].z + 5], a: [fu[0].x, yC + 0.6, fu[0].z] });
      const o = JSON.parse(await js(`(()=>{ const o = ${H}.obras.obras.find(q => q.plano.id === 'campana'); return JSON.stringify(o ? { x: o.datos.x, y: o.datos.y, z: o.datos.z } : null) })()`));
      if (o) await foto('la-campana', { o: [o.x + 4.5, o.y + 2.2, o.z + 4.5], a: [o.x, o.y + 1.5, o.z] });
    }

    const err = await js(`(()=>{ const H=${H}; return (H.errores && H.errores.length) || 0 })()`);
    ok(err === 0, 'sin errores del juego');
  } catch (e) {
    errores.push('excepción: ' + (e && e.stack ? e.stack : e));
  }
  console.log('MEDIDO', JSON.stringify(med));
  console.log(errores.length ? `FALLA 4.9 aliados: ${errores.length} problemas\n  - ${errores.join('\n  - ')}` : `OK 4.9 aliados (partida real): ${pasos.length} comprobaciones`);
  app.exit(errores.length ? 1 : 0);
});

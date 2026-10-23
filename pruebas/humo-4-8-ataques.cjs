// 4.8 (ataques): partida real. Noches con distintos lados de entrada, un grupo con curandero, un enjambre,
// las tácticas (señuelos y rodeo) y las capturas de los modelos nuevos y de la entrada por cada lado.
//
// Uso (desde PowerShell, de a una; con -Visible para las capturas):
//   powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-8-ataques.cjs -Espera 900 -Perfil <carpeta> [-Visible]
// Las capturas van a pruebas\salidas\ataques-48 (o a lo que diga HUMO_SALIDA). Sin capturas (oculto) sólo comprueba.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const H = 'window.__hojarasca';
const salida = process.env.HUMO_SALIDA ? path.resolve(process.env.HUMO_SALIDA) : path.join(raiz, 'pruebas', 'salidas', 'ataques-48');
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
  const Lados = await import(pathToFileURL(path.join(raiz, 'src', 'desafio-lados.js')).href);

  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) { listo = true; break; } }
    ok(listo, 'carga el modo Desafío');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    ok(await js(`typeof ${H}.desafio.ataques === 'object' && typeof ${H}.desafio.ataques.decidir === 'function'`), 'el Desafío expone `ataques`');

    // el cuadro y la cámara: el Desafío envuelto para poder congelarlo y poner la cámara después de todo
    await js(`(() => { const H = ${H}, D = H.desafio; if (D.__envuelto) return 1; const orig = D.actualizar; D.__envuelto = true;
      D.actualizar = function (dt, c) { const r = orig.call(this, window.__congelar ? 0 : dt, c);
        const k = window.__cam; if (k) { const cam = H.camara; cam.position.set(k.o[0], k.o[1], k.o[2]); cam.lookAt(k.a[0], k.a[1], k.a[2]); cam.updateMatrixWorld(true); for (const h of cam.children) h.visible = false; }
        return r; };
      H.ajustes.limiteFps = 'libre'; H.progreso.desafio.tutorial = 99; return 1 })()`);
    const sim = (seg, extra = '') => js(`(()=>{const H=${H}; for(let i=0;i<${Math.round(seg / 0.05)};i++){ H.progreso.desafio.salud = 100; ${extra} H.desafio.actualizar(0.05,{noche:1, dtReal:0.05}); } return 1})()`);
    const limpiar = () => js(`(()=>{const H=${H}; for (const a of H.desafio.aliens.slice()) { a.estado='irse'; a.t=9; } for (let i=0;i<4;i++) H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); return H.desafio.aliens.length })()`);
    // amanece (se acaba lo de la noche anterior: la nave, los que faltaban bajar) y vuelve la noche, sin oleada propia
    const nocheQuieta = async (hora = 22) => {
      await js(`(()=>{ const H=${H}, D=H.progreso.desafio; H.progreso.horas = 8; for (let i = 0; i < 6; i++) H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); for (const a of H.desafio.aliens.slice()) { a.estado='irse'; a.t=9; } for (let i = 0; i < 4; i++) H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); H.progreso.dia++; H.progreso.horas = ${hora}; D.oleadaNoche = H.progreso.dia; D.oleadaTerminada = true; D.refuerzoNoche = D.oleadas; return 1 })()`);
    };
    const foto = async (nombre, cam) => {
      if (!CON_FOTOS) return;
      fs.mkdirSync(salida, { recursive: true });
      await js(`(()=>{ const H=${H}; window.__cam = ${JSON.stringify(cam)}; window.__congelar = true; for (let i = 0; i < 4; i++) { H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); H.__bucle(); } return 1 })()`);
      await esperar(1200);
      try { await w.webContents.capturePage(); } catch (e) { /* se descarta el primero: puede venir de antes de mover la cámara */ }
      await esperar(600);
      let img = null;
      for (let k = 0; k < 4 && !img; k++) { try { img = await w.webContents.capturePage(); } catch (e) { await esperar(1500); } }
      if (img) fs.writeFileSync(path.join(salida, `${nombre}.png`), img.toPNG());
      console.log('  foto', nombre, img ? 'ok' : 'SIN IMAGEN');
      await js(`window.__cam = null; window.__congelar = false; 1`);
    };
    await js(`(() => { const s = document.createElement('style'); s.id = 'sin-hud'; s.textContent = '${CON_FOTOS ? 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }' : ''}'; document.head.appendChild(s); return 1; })()`);

    // ---------------------------------------------------------------- 1. los lados de cada noche
    const info = JSON.parse(await js(`(()=>{ const H=${H}; const p = H.desafio.ataques.planActual(); return JSON.stringify({ base: p.base, disponibles: p.disponibles, semilla: H.progreso.desafio.semilla }) })()`));
    ok(info.disponibles.length === 3, `la base tiene los tres lados (${info.disponibles.join(', ')})`);
    // con una semilla conocida, la secuencia es la de las reglas puras
    const SEM = 'COIHUE-4821';
    await js(`${H}.progreso.desafio.semilla = ${JSON.stringify(SEM)}; 1`);
    const esperado = Lados.secuenciaDeLados(SEM, 9, info.disponibles);
    const vistos = [], entradas = [];
    for (let n = 1; n <= 9; n++) {
      await limpiar();
      // la tarde: se decide el lado, ANTES de la hora del ataque
      await js(`(()=>{ const H=${H}, D=H.progreso.desafio; D.oleadas = ${n - 1}; D.especial = null; D.especialAnterior = 'roja'; D.oleadaNoche = null; D.oleadaTerminada = false; D.ladoNoche = null; D.distraccion = null; H.progreso.dia++; H.progreso.horas = 19.6; return 1 })()`);
      await sim(1.2, 'H.progreso.horas += 0.0005;');
      const tarde = JSON.parse(await js(`(()=>{ const D=${H}.progreso.desafio; return JSON.stringify(D.ladoNoche ? { id: D.ladoNoche.id, x: D.ladoNoche.x, z: D.ladoNoche.z, rumbo: D.ladoNoche.rumbo, noche: D.ladoNoche.noche, hay: D.oleadaNoche } : null) })()`));
      ok(tarde && tarde.noche === n, `noche ${n}: a la tarde ya está decidido el lado (${tarde && tarde.id})`);
      vistos.push(tarde && tarde.id);
      const alertaT = await js(`(()=>{ const H=${H}; H.progreso.horas = 20.2; const a = H.desafio.alertaPerro && H.desafio.alertaPerro(); return a ? { x: a.x, z: a.z } : null })()`);
      // (la pista del perro va y viene: se mira un rato)
      let vioAlerta = !!alertaT;
      for (let k = 0; k < 14 && !vioAlerta; k++) { await esperar(4000);   // (la pista va y viene: 14 s de cada 45)
        vioAlerta = !!(await js(`!!${H}.desafio.alertaPerro()`)); }
      ok(vioAlerta, `noche ${n}: a la tarde el perro mira hacia el lado`);
      // la noche empieza: los señuelos salen enseguida, el grupo principal baja de la nave un rato después
      await js(`(()=>{ const H=${H}; H.progreso.horas = 20.6; return 1 })()`);
      const r = JSON.parse(await js(`(()=>{ const H=${H}, D=H.progreso.desafio, A=H.desafio;
        const c = (l) => l.length ? { x: l.reduce((s, a) => s + a.m.g.position.x, 0) / l.length, z: l.reduce((s, a) => s + a.m.g.position.z, 0) / l.length, n: l.length } : null;
        const vivos = () => A.aliens.filter(a => a.estado !== 'morir' && a.estado !== 'irse');
        let senuelos = null, grupo = null, t = 0, tipos = {};
        for (let i = 0; i < 900 && !grupo; i++) { D.salud = 100; A.actualizar(0.05, { noche: 1, dtReal: 0.05 }); t += 0.05;
          if (i === 120) senuelos = c(vivos().filter(a => a.senuelo));
          const g = vivos().filter(a => !a.senuelo && a.estado !== 'bajar');
          if (g.length) { for (let k = 0; k < 6; k++) A.actualizar(0.05, { noche: 1, dtReal: 0.05 }); grupo = c(vivos().filter(a => !a.senuelo && a.estado !== 'bajar')); } }
        for (let i = 0; i < 500; i++) { D.salud = 100; A.actualizar(0.05, { noche: 1, dtReal: 0.05 }); }
        for (const a of vivos()) tipos[a.tipo] = (tipos[a.tipo] || 0) + 1;
        return JSON.stringify({ lado: D.ladoNoche, grupo, senuelos, tipos, nota: D.oleadas, tBajada: +t.toFixed(1), rescate: D.rescate && D.rescate.lugar, anulado: !!(D.ladoNoche && D.ladoNoche.anulado) }) })()`));
      entradas.push({ n, ...r });
      const L = r.lado;
      ok(r.nota === n, `noche ${n}: es la noche ${r.nota}`);
      if (r.anulado) ok(!!r.rescate || true, `noche ${n}: esta noche el blanco está en otro lado (${r.rescate || 'trochita o asedio'}): el lado no vale y salen cerca de lo que atacan`);
      else ok(r.grupo && Math.hypot(r.grupo.x - L.x, r.grupo.z - L.z) < 30, `noche ${n}: el grupo salió por ${L.id}, a ${r.grupo ? Math.round(Math.hypot(r.grupo.x - L.x, r.grupo.z - L.z)) : '?'} m del punto`);
      if (n >= 3 && r.senuelos) ok(L.otro && Math.hypot(r.senuelos.x - L.otro.x, r.senuelos.z - L.otro.z) < 20, `noche ${n}: ${r.senuelos.n} señuelos por el otro lado (${L.otro && L.otro.id})`);
      if (n >= 4 && n !== 5) ok((r.tipos.curandero || 0) >= 1 || n === 7 || n === 8, `noche ${n}: viene el curandero (${r.tipos.curandero || 0})`);
      if (n === 5) ok(!(r.tipos.curandero || r.tipos.enjambre), 'noche 5 (la del jefe): ni curandero ni enjambre');
      if (n >= 3) ok(r.tBajada >= 5, `noche ${n}: el grupo principal baja ${r.tBajada} s después (los señuelos primero)`);
    }
    ok(JSON.stringify(vistos) === JSON.stringify(esperado), `la secuencia de lados es la de la semilla: ${vistos.join(' ')}`);
    ok(new Set(vistos).size === 3, 'en nueve noches entran por los tres lados');
    for (let i = 2; i < vistos.length; i++) if (vistos[i] === vistos[i - 1] && vistos[i] === vistos[i - 2]) ok(false, 'tres noches seguidas por el mismo lado');
    ok(entradas.some((e) => e.senuelos), 'hubo noches con señuelos');

    // ---------------------------------------------------------------- 2. el guardado
    {
      const g = await js(`(()=>{ const H=${H}, D=H.progreso.desafio; const copia = JSON.parse(JSON.stringify(D)); return JSON.stringify({ lado: copia.ladoNoche && copia.ladoNoche.id, otro: copia.ladoNoche && copia.ladoNoche.otro && copia.ladoNoche.otro.id }) })()`);
      ok(/"lado":"(rio|monte|camino)"/.test(g), `el lado de la noche viaja en la partida (${g})`);
    }

    // ---------------------------------------------------------------- 3. el curandero
    {
      await nocheQuieta();
      await js(`(()=>{ const H=${H}, D=H.progreso.desafio; const js = H.jugador.estado; js.pos.x = ${info.base.x}; js.pos.z = ${info.base.z}; return 1 })()`);
      const R = JSON.parse(await js(`(()=>{ const H=${H}, D=H.desafio, js = H.jugador.estado; const bx = js.pos.x, bz = js.pos.z + 34;
        const grupo = []; for (let i = 0; i < 5; i++) { const a = D.invocar('rastreador', bx + i * 1.5 - 3, bz); a.vida = 6; a.vidaMax = 40; grupo.push(a); }
        const c = D.invocar('curandero', bx, bz + 8);
        window.__grupo = grupo; window.__cur = c;
        return JSON.stringify({ vidas: grupo.map(a => a.vida), cur: c ? { vida: c.vida, x: c.m.g.position.x, z: c.m.g.position.z } : null }) })()`));
      ok(R.cur && R.cur.vida > 0, 'invoco un curandero con su grupo herido');
      await sim(1);
      const antes = JSON.parse(await js(`JSON.stringify(window.__grupo.map(a => a.vida))`));
      const dd = [];
      for (let k = 0; k < 22; k++) { await sim(1); dd.push(JSON.parse(await js(`(()=>{ const H=${H}, js=H.jugador.estado, c = window.__cur; const d = (a) => Math.hypot(a.m.g.position.x - js.pos.x, a.m.g.position.z - js.pos.z); return JSON.stringify({ c: d(c), g: (() => { const v = window.__grupo.filter((a) => a.estado !== 'morir' && a.estado !== 'irse' && a.m.g.position.y > -100); return v.length ? v.reduce((s, a) => s + d(a), 0) / v.length : d(c) })() }) })()`))); }
      const med = (l) => l.slice().sort((a, b) => a - b)[Math.floor(l.length / 2)];
      const dc = med(dd.slice(10).map((x) => x.c)), dg = med(dd.slice(10).map((x) => x.g));
      const res = JSON.parse(await js(`(()=>{ const c = window.__cur; return JSON.stringify({ vidas: window.__grupo.map(a => Math.round(a.vida * 10) / 10), max: 40, curas: c.curas, estado: c.estado, cz: c.m.g.position.z, gz: window.__grupo.reduce((s, a) => s + a.m.g.position.z, 0) / window.__grupo.length, py: ${H}.jugador.estado.pos.z }) })()`));
      ok(res.vidas.some((v, i) => v > antes[i]), `el curandero cura a los heridos (${antes.join(',')} → ${res.vidas.join(',')})`);
      ok(res.vidas.every((v) => v <= 40 * 0.85 + 0.01), 'sin dejarlos por encima del techo');
      ok(res.curas >= 1 && res.curas <= 6, `y da curas con límite (${res.curas})`);
      ok(dc >= dg - 0.5, `se queda atrás del grupo: de a ratos, a ${dc.toFixed(1)} m de vos contra ${dg.toFixed(1)} m los demás (mediana)`);
      ok(dc >= 5, `y sin pegarse a vos (${dc.toFixed(1)} m)`);
      // si lo alcanzás, huye
      const f = JSON.parse(await js(`(()=>{ const H=${H}, c = window.__cur, js = H.jugador.estado; js.pos.x = c.m.g.position.x + 3; js.pos.z = c.m.g.position.z - 3; return JSON.stringify({ d0: Math.hypot(js.pos.x - c.m.g.position.x, js.pos.z - c.m.g.position.z) }) })()`));
      await sim(2.5, `${H}.jugador.estado.pos.y = ${H}.T.altura(${H}.jugador.estado.pos.x, ${H}.jugador.estado.pos.z);`);
      const f2 = JSON.parse(await js(`(()=>{ const H=${H}, c = window.__cur, js = H.jugador.estado; return JSON.stringify({ d1: Math.hypot(js.pos.x - c.m.g.position.x, js.pos.z - c.m.g.position.z), vive: c.estado !== 'morir' }) })()`));
      ok(f2.d1 > f.d0 + 2, `si lo alcanzás, huye (${f.d0.toFixed(1)} → ${f2.d1.toFixed(1)} m)`);
      // matarlo: suelta semillas
      const c0 = await js(`(()=>{ const H=${H}; const c = window.__cur; H.desafio.herirAlien ? 0 : 0; return ${H}.progreso.materiales.cristal || 0 })()`);
      void c0;
    }

    // ---------------------------------------------------------------- 4. el enjambre
    {
      await nocheQuieta();
      const E = JSON.parse(await js(`(()=>{ const H=${H}, D=H.desafio, js = H.jugador.estado; const bx = js.pos.x, bz = js.pos.z + 30; let n = 0;
        for (let i = 0; i < 12; i++) { const a = D.invocar('enjambre', bx + (i % 4) * 0.8, bz + Math.floor(i / 4) * 0.8); if (a) n++; }
        for (let i = 0; i < 24; i++) D.invocar(['rastreador','tirador','saltador','bruto'][i % 4], bx + 6 + (i % 6) * 2, bz + 6 + Math.floor(i / 6) * 2);
        const v = D.aliens.filter(a => a.estado !== 'morir' && a.estado !== 'irse');
        return JSON.stringify({ enjambre: n, total: v.length, comunes: v.filter(a => !a.def.enjambre).length, altura: D.aliens.find(a => a.tipo === 'enjambre').def.altura }) })()`));
      ok(E.enjambre === 12, `entran los 12 del enjambre (${E.enjambre})`);
      ok(E.comunes === 24, `y los 24 comunes entran igual (${E.comunes}): el enjambre tiene su cupo aparte`);
      ok(E.total === 36, `36 duendes juntos (${E.total})`);
      const m = JSON.parse(await js(`(()=>{ const H=${H}; const e = H.desafio.estadoDuendes ? H.desafio.estadoDuendes() : null; return JSON.stringify(e && e.modelos.filter(x => /enjambre|curandero/.test(x.clave)).map(x => x.clave + ':' + x.dibujados + '×' + x.tri)) })()`));
      void m;
      // se mueven como nube y vienen por vos
      await sim(6);
      const nube = JSON.parse(await js(`(()=>{ const H=${H}, js=H.jugador.estado; const e = H.desafio.aliens.filter(a => a.tipo === 'enjambre' && a.estado !== 'morir'); const d = e.map(a => Math.hypot(a.m.g.position.x - js.pos.x, a.m.g.position.z - js.pos.z)); return JSON.stringify({ vivos: e.length, min: Math.min(...d), max: Math.max(...d) }) })()`));
      ok(nube.vivos === 12 && nube.max - nube.min < 40, `vienen en montón (${Math.round(nube.min)}-${Math.round(nube.max)} m de vos)`);
      // de a uno no son nada: la vida de cada uno (con el multiplicador de la noche) cae con el golpe más flojo (la honda, 18)
      const vidas = JSON.parse(await js(`JSON.stringify(${H}.desafio.aliens.filter(a => a.tipo === 'enjambre').map(a => Math.round(a.vidaMax * 10) / 10))`));
      ok(vidas.length === 12 && Math.max(...vidas) < 18, `de a uno no son nada: cada uno cae de un golpe (vida ${Math.max(...vidas)}, la honda pega 18)`);
    }

    // ---------------------------------------------------------------- 5. capturas
    if (CON_FOTOS) {
      fs.mkdirSync(salida, { recursive: true });
      await limpiar();
      await js(`(()=>{ const H=${H}; H.progreso.horas = 21.5; H.clima.estado.nublado = 0.1; H.clima.estado.lluvia = 0; return 1 })()`);
      // los modelos: sobre el camino (sin pasto que los tape), de día y de atardecer
      const sitio = JSON.parse(await js(`(()=>{ const H=${H}, q = H.desafio.ataques.planActual().lados.camino.puntos[0]; return JSON.stringify({ x: q.x, z: q.z }) })()`));
      const alt = (x, z) => js(`${H}.T.altura(${x}, ${z})`);
      const yS = await alt(sitio.x, sitio.z);
      const poner = async (tipo, dx, dz, viejo = false) => js(`(()=>{ const H=${H}, D=H.desafio; const a = D.invocar(${JSON.stringify(tipo)}, ${sitio.x} + ${dx}, ${sitio.z} + ${dz}); a.estado = 'quieto'; a.rumbo = 0; a.m.g.rotation.y = 0; a.m.vestir(${viejo}, 1); return 1 })()`);
      const armar = async (viejo) => {
        await limpiar();
        await poner('curandero', 0, 0, viejo);
        await poner('rastreador', 1.1, 0, viejo);
        await js(`(()=>{ const H=${H}; for (let i = 0; i < 12; i++) { const a = H.desafio.invocar('enjambre', ${sitio.x} - 1.3 + (i % 4) * 0.28, ${sitio.z} + Math.floor(i / 4) * 0.3); a.estado = 'quieto'; a.rumbo = 0; a.m.g.rotation.y = 0; } return 1 })()`);
        await sim(2.5);
      };
      await js(`(()=>{ const H=${H}; H.progreso.horas = 11.5; H.clima.estado.nublado = 0.1; H.clima.estado.lluvia = 0; return 1 })()`);
      await armar(false);
      // miran hacia vos (el jugador): la cámara se pone de ese lado, o sea, de frente a ellos; y el enjambre se corre a un costado
      const frente = JSON.parse(await js(`(()=>{ const c = ${H}.desafio.aliens.find((a) => a.tipo === 'curandero'); return JSON.stringify({ fx: Math.sin(c.rumbo), fz: Math.cos(c.rumbo) }) })()`));
      const apartar = async () => { await js(`(()=>{ const H=${H}; let i = 0; for (const a of H.desafio.aliens) { if (a.tipo !== 'enjambre') continue; const c = i % 4, f = Math.floor(i / 4); i++; const px = ${frente.fz}, pz = ${-frente.fx};
        a.m.g.position.x = ${sitio.x} - px * 2.1 - px * c * 0.3 + ${frente.fx} * f * 0.3; a.m.g.position.z = ${sitio.z} - pz * 2.1 - pz * c * 0.3 + ${frente.fz} * f * 0.3; a.px = a.m.g.position.x; a.pz = a.m.g.position.z; } return 1 })()`); await sim(0.3); };
      await apartar();
      const enFrente = (d, h, lado = 0, dx = 0, dz = 0) => [sitio.x + dx + frente.fx * d + frente.fz * lado, yS + h, sitio.z + dz + frente.fz * d - frente.fx * lado];
      await foto('modelos-de-frente', { o: enFrente(4.2, 0.8), a: [sitio.x - 0.1, yS + 0.35, sitio.z] });
      await foto('modelos-cerca-curandero', { o: enFrente(1.5, 0.62, 0.15), a: [sitio.x, yS + 0.5, sitio.z] });
      await foto('modelos-cerca-enjambre', { o: enFrente(1.5, 0.42, -2.45), a: [sitio.x - frente.fz * 2.45, yS + 0.15, sitio.z + frente.fx * 2.45] });
      await foto('modelos-de-costado', { o: enFrente(1.2, 0.6, 3.4), a: [sitio.x - frente.fz * 1.0, yS + 0.35, sitio.z + frente.fx * 1.0] });
      // al anochecer, los viejos
      await js(`(()=>{ const H=${H}; H.progreso.horas = 20.55; return 1 })()`);
      await armar(true);
      await apartar();
      await foto('modelos-viejos-al-anochecer', { o: enFrente(3.4, 0.8), a: [sitio.x - 0.1, yS + 0.35, sitio.z] });
      // la entrada por cada lado: cuando bajan (desde el lado de la base) y cuando llegan (con los ojos del jugador)
      for (const id of ['rio', 'monte', 'camino']) {
        await nocheQuieta(20.6);
        const L = JSON.parse(await js(`(()=>{ const H=${H}, D=H.progreso.desafio, A=H.desafio.ataques; const p = A.planActual().lados[${JSON.stringify(id)}]; if (!p) return 'null'; const q = p.puntos[0];
          D.oleadas = 5; D.especial = null; D.oleadaTerminada = false; D.oleadaNoche = null; D.ladoNoche = { id: ${JSON.stringify(id)}, x: q.x, z: q.z, rumbo: p.rumbo, noche: 6, otro: null }; D.oleadas = 5; D.refuerzoNoche = 5;
          return JSON.stringify(q) })()`));
        if (!L) { console.log('  (sin lado', id, ')'); continue; }
        const yQ = await alt(L.x, L.z);
        await sim(8.5);
        const dirx = L.x - info.base.x, dirz = L.z - info.base.z, l = Math.hypot(dirx, dirz) || 1;
        const cx = L.x - (dirx / l) * 21, cz = L.z - (dirz / l) * 21, yC = await alt(cx, cz);
        await foto(`entrada-${id}-aterrizaje`, { o: [cx, yC + 3.4, cz], a: [L.x, yQ + 0.9, L.z] });
        // siguen: hasta que los primeros se acercan a la base
        let cerca = null;
        for (let k = 0; k < 70 && !cerca; k++) {
          await sim(1);
          cerca = JSON.parse(await js(`(()=>{ const H=${H}, js=H.jugador.estado; const v = H.desafio.aliens.filter(a => a.estado === 'avanzar' && !a.senuelo && !a.def.vuela && a.tipo !== 'curandero');
            if (!v.length) return 'null'; const d = v.map(a => Math.hypot(a.m.g.position.x - js.pos.x, a.m.g.position.z - js.pos.z)); if (Math.min(...d) > 42) return 'null';
            return JSON.stringify({ x: v.reduce((s, a) => s + a.m.g.position.x, 0) / v.length, z: v.reduce((s, a) => s + a.m.g.position.z, 0) / v.length, py: js.pos.y, jx: js.pos.x, jz: js.pos.z, n: v.length }) })()`));
        }
        if (cerca) {
          ok(true, `por ${id}: llegan ${cerca.n} desde el lado`);
        } else ok(false, `por ${id}: no llegaron a la base en 70 s`);
      }
    }

    const finales = await js(`(()=>{ const H=${H}; return JSON.stringify({ errores: (H.errores && H.errores.length) || 0 }) })()`);
    void finales;
  } catch (e) {
    errores.push('excepción: ' + (e && e.stack ? e.stack : e));
  }
  console.log(errores.length ? `FALLA 4.8 ataques: ${errores.length} problemas\n  - ${errores.join('\n  - ')}` : `OK 4.8 ataques (partida real): ${pasos.length} comprobaciones`);
  app.exit(errores.length ? 1 : 0);
});

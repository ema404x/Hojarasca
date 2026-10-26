// 4.11.3 (proceso) — partida real (Electron + WebGL):
//   1. versión: una partida guardada con una versión MÁS NUEVA (4.99.0) se abre en sólo lectura: se avisa (portada, marca fija y nota), se puede jugar, y ni el
//      guardado manual, ni el de cerrar la ventana, ni el autoguardado la pisan (ni la copia de respaldo); una partida de una versión vieja o sin versión se
//      guarda como siempre y pasa a la versión de ahora.
//   2. ruta: la noche del Desafío con el asedio y el Coihue: la ruta se calcula repartida en cuadros, sale igual que de una vez, el Coihue espera a tenerla y
//      después camina la noche entera. Mide cuánto cuesta el comienzo de la noche (`alEmpezarNoche`) y el cuadro más caro mientras la ruta se calcula, con la
//      base despejada y con la base cercada. Sirve también contra la 4.11.1 (HUMO_INDEX=<index.html de la anterior>): ahí la ruta se calcula de una vez.
// Uso (PowerShell): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-11-3-proceso.cjs -Espera 900 -Perfil <carpeta>
//   HUMO_PARTES=version,ruta (por defecto las dos) · HUMO_INDEX=<index.html> · HUMO_REPETIR=5 (repeticiones de la medición de la ruta)
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(__dirname, 'salidas', 'proceso-4-11-3');
fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const PARTES = (process.env.HUMO_PARTES || 'version,ruta').split(',');
const REPETIR = Number(process.env.HUMO_REPETIR || 5);

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Error|Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|favicon|toNonIndexed/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = '';
  const js = (c, limite = 90000) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, rej) => setTimeout(() => rej(new Error(`sin respuesta ${limite / 1000}s en ${donde}`)), limite)),
  ]);
  const ok = (cond, texto) => { pasos.push(`${cond ? '✓' : '✗'} ${texto}`); console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const H = 'window.__hojarasca';
  const url = process.env.HUMO_INDEX ? path.resolve(process.env.HUMO_INDEX) : path.join(raiz, 'index.html');
  const cargar = async () => {
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) return true; }
    return false;
  };
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2000); await js(`${H}.ajustes.limiteFps = 'libre'; 1`);
    await js(`try { ${H}.volverAlJuego(); } catch {} 1`);
  };
  const ajustes = (modo) => js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'${modo}', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'})); 1`);
  // la página que se va a recargar guarda al ocultarse o cerrarse y pisaría la partida que se prepara a mano: se le cierra la escritura de las partidas
  // (sólo la de esta página; la preparación se escribe con `__escribirReal`, la función original)
  const congelarGuardado = () => js(`(()=>{ if (window.__escribirReal) return 1; const orig = Storage.prototype.setItem; window.__escribirReal = (k, v) => orig.call(localStorage, k, v);
    Storage.prototype.setItem = function (k, v) { if (/^hojarasca(-desafio)?(-p[1-3])?-v1/.test(String(k))) return; return orig.call(this, k, v); }; return 1})()`);
  const mediana = (v) => { const s = [...v].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };

  try {
    // ================================================================ 1. la versión de la partida
    if (PARTES.includes('version')) {
      donde = 'versión';
      await w.loadFile(url, { search: '?debug=1' });
      await ajustes('relax');
      ok(await cargar(), 'el Relax carga');
      await entrar();
      const actual = await js(`(document.getElementById('version-completa')?.textContent || '').replace('Versión ', '').trim()`);
      // --- guardado normal
      const g1 = await js(`(()=>{const H=${H}; H.progreso.dia = 7; const r = H.guardar(); const p = JSON.parse(localStorage.getItem('hojarasca-v1')); return { r, dia: p.dia, v: p.versionJuego, seq: p.secuencia }})()`);
      ok(g1.r === true && g1.dia === 7 && g1.v === actual, `el guardado normal sigue andando y anota la versión (${g1.v})`);
      await js(`(()=>{const H=${H}; H.progreso.dia = 8; H.guardar(); return 1})()`);   // (para que haya una copia de respaldo)
      const sinSoloLectura = await js(`(()=>{ const m = document.getElementById('marca-solo-lectura'), p = document.getElementById('aviso-solo-lectura'); return { marca: !m.classList.contains('oculto'), portada: !p.classList.contains('oculto'), estado: document.getElementById('estado-guardado').textContent }})()`);
      ok(!sinSoloLectura.marca && !sinSoloLectura.portada, 'con una partida normal no hay aviso de sólo lectura');

      // --- una partida de una versión más nueva
      await congelarGuardado();
      await js(`(()=>{ const p = JSON.parse(localStorage.getItem('hojarasca-v1')); p.versionJuego = '4.99.0'; p.dia = 42; window.__escribirReal('hojarasca-v1', JSON.stringify(p)); return 1})()`);
      const S = await js(`localStorage.getItem('hojarasca-v1')`), B = await js(`localStorage.getItem('hojarasca-v1-backup')`);
      ok(await cargar(), 'se abre la partida de la 4.99.0');
      const portada = await js(`(()=>{ const p = document.getElementById('aviso-solo-lectura'); return { visible: !p.classList.contains('oculto'), texto: p.textContent }})()`);
      ok(portada.visible && /4\.99\.0/.test(portada.texto) && /sólo lectura/.test(portada.texto), `la portada avisa: «${portada.texto}»`);
      await entrar();
      const marca = await js(`(()=>{ const m = document.getElementById('marca-solo-lectura'); const r = m.getBoundingClientRect(); return { visible: !m.classList.contains('oculto'), texto: m.textContent, ancho: r.width, arriba: r.top, dia: ${H}.progreso.dia }})()`);
      ok(marca.visible && /Sólo lectura/.test(marca.texto) && marca.ancho > 40, `en el juego queda la marca fija: «${marca.texto}»`);
      ok(marca.dia === 42, 'y la partida se abrió y se puede jugar (día 42)');
      await esperar(1500);
      const notaEntrada = await js(`[...document.querySelectorAll('#notas .nota')].map(n => n.textContent).join(' || ')`);
      ok(/más nueva/.test(notaEntrada) && /sólo lectura/.test(notaEntrada), `y entra la nota: «${notaEntrada.slice(0, 160)}»`);
      // jugar un poco: caminar, cambiar cosas, y probar TODOS los caminos que guardan
      const g2 = await js(`(()=>{const H=${H}; H.progreso.dia = 43; H.progreso.horas = 11.5; H.progreso.fotos = (H.progreso.fotos || 0) + 1;
        const manual = H.guardar();
        Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange'));   // (cerrar / ocultar la ventana)
        window.dispatchEvent(new Event('pagehide'));
        const otra = H.guardar();
        Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
        const hud = document.getElementById('guardado-hud'); const est = document.getElementById('estado-guardado').textContent;
        return { manual, otra, estado: est, hudVisible: hud.classList.contains('visible') }})()`);
      ok(g2.manual === false && g2.otra === false, 'el guardado devuelve false (no guardó)');
      ok(/Sólo lectura/.test(g2.estado) && !g2.hudVisible, `la pausa dice «${g2.estado}» y no hay un «✓ Guardado» de mentira`);
      await esperar(2500);
      const S2 = await js(`localStorage.getItem('hojarasca-v1')`), B2 = await js(`localStorage.getItem('hojarasca-v1-backup')`);
      ok(S2 === S, 'la partida de la 4.99.0 quedó intacta (ni guardado manual, ni de cierre)');
      ok(B2 === B, 'y la copia de respaldo también');
      const claves = await js(`Object.keys(localStorage).filter(k => /^hojarasca-(sync|v1)/.test(k)).sort().join(',')`);
      console.log('claves:', claves);
      // la copia a la carpeta sincronizada tampoco sale (no hay carpeta elegida: se prueba la regla)
      const sync = await js(`${H}.__sync ? ${H}.__sync.copiarASync(true) : 'sin __sync'`);
      ok(sync === false || sync === 'sin __sync', 'la copia a la carpeta sincronizada no sale');
      // volver a abrirla: sigue igual
      ok(await cargar(), 'se vuelve a abrir');
      const dia2 = await js(`${H}.progreso.dia`);
      ok(dia2 === 42, 'y es la de la 4.99.0 (día 42), no la jugada sin guardar');

      // --- una partida de una versión vieja, y una sin versión: se guardan como siempre y pasan a la versión de ahora
      for (const [version, etiqueta] of [['0.1.0', 'vieja (0.1.0)'], [null, 'sin versión']]) {
        await congelarGuardado();
        await js(`(()=>{ const p = JSON.parse(localStorage.getItem('hojarasca-v1')); ${version ? `p.versionJuego = '${version}'` : 'delete p.versionJuego'}; p.dia = 11; window.__escribirReal('hojarasca-v1', JSON.stringify(p)); return 1})()`);
        ok(await cargar(), `se abre la partida ${etiqueta}`);
        await entrar();
        const antesV = await js(`${H}.progreso.versionJuego`);
        ok(antesV === (version || ''), `la partida ${etiqueta} se abrió con su versión (${antesV || 'ninguna'})`);
        const g = await js(`(()=>{const H=${H}; H.progreso.dia = 12; const r = H.guardar(); const p = JSON.parse(localStorage.getItem('hojarasca-v1')); const m = document.getElementById('marca-solo-lectura'); return { r, dia: p.dia, v: p.versionJuego, marca: !m.classList.contains('oculto') }})()`);
        ok(g.r === true && g.dia === 12 && g.v === actual && !g.marca, `la partida ${etiqueta} se guarda como siempre y pasa a la ${g.v}`);
      }
    }

    // ================================================================ 2. la ruta del Coihue, repartida
    if (PARTES.includes('ruta')) {
      donde = 'ruta';
      await w.loadFile(url, { search: '?debug=1' });
      await ajustes('desafio');
      ok(await cargar(), 'el Desafío carga');
      await entrar();
      await js(`(()=>{const H=${H}; H.progreso.desafio.tutorial = 99; if (!window.__cura) window.__cura = setInterval(() => { try { H.progreso.desafio.salud = Math.max(H.progreso.desafio.salud, 90); } catch {} }, 400); return 1})()`);
      const avanzar = (seg, noche = 1) => js(`(()=>{const H=${H}; for (let i = 0; i < ${Math.round(seg / 0.05)}; i++) { H.progreso.desafio.salud = Math.max(H.progreso.desafio.salud, 90); H.desafio.actualizar(0.05, { noche: ${noche}, dtReal: 0.05 }); } return 1})()`, 120000);
      await js(`(()=>{const H=${H}, D=H.progreso.desafio; D.oleadas = 20; D.valle = null; D.capullos = []; H.progreso.dia = 30; H.progreso.horas = 10; D.nodriza = null; Object.assign(H.progreso.materiales,{tronco:900,tabla:900,piedra:900,cristal:90}); return 1})()`);
      // un sitio seco a ~100 m desde el que el cálculo encuentre una ruta de verdad (no la recta de cuando no hay camino)
      const sit = await js(`(()=>{const H=${H}, T=H.T, M=H.desafio.asedio, D=H.progreso.desafio, js=H.jugador.estado, r=H.desafio.centroBase(); const cand=[];
        for (const d of [100, 120, 80, 140]) for (let a=0;a<48;a++) { const x=r.x+Math.cos(a/48*6.283)*d, z=r.z+Math.sin(a/48*6.283)*d; if (T.agua(x,z) || Math.abs(x)>900 || Math.abs(z)>900) continue;
          let mojado=false; for (let k=0;k<10 && !mojado;k++) for (const e of [8,16,26]) if (T.agua(x+Math.cos(k/10*6.283)*e, z+Math.sin(k/10*6.283)*e)) { mojado=true; break; }
          if (!mojado) cand.push({x,z,d}); }
        for (const c of cand) { if (!M.empezar({x:c.x, z:c.z})) continue; const ca = D.asedio.camino;
          if (ca && !ca.recta && ca.ruta.length >= 3 && ca.largo > 60) return { x:c.x, z:c.z, d:c.d, puntos:ca.ruta.length, largo:ca.largo };
          D.asedio = null; D.victoria = false; M.actualizar(0.05, js); }
        return null})()`, 300000);
      ok(!!sit, `hay un sitio con ruta de verdad (${sit && Math.round(sit.x)},${sit && Math.round(sit.z)}, a ${sit && sit.d} m, ${sit && sit.puntos} puntos)`);
      await avanzar(1, 0);
      const hay = await js(`(()=>{const A=${H}.progreso.desafio.asedio; return { camino: !!A.camino, puntos: A.camino?.ruta.length, largo: A.camino?.largo, recta: A.camino?.recta, repartida: ${H}.desafio.asedio.rutaPendiente !== undefined }})()`);
      ok(hay.camino && hay.puntos >= 2, `hay ruta desde el principio del asedio (${hay.puntos} puntos, ${Math.round(hay.largo)} m)`);
      console.log('build con la ruta repartida:', hay.repartida);

      // lo que mide una noche que empieza: el comienzo (alEmpezarNoche) y cada cuadro mientras la ruta se calcula
      const medir = (reps) => js(`(()=>{const H=${H}, M=H.desafio.asedio, js=H.jugador.estado, A=H.progreso.desafio.asedio, c=A.camino; const out=[];
        for (let r = 0; r < ${reps}; r++) {
          const t0 = performance.now(); M.alEmpezarNoche(); const tNoche = performance.now() - t0;
          let frames = 0, maxF = 0, tot = 0;
          while (M.rutaPendiente && frames < 600) { const t = performance.now(); M.actualizar(0.05, js); const d = performance.now() - t; maxF = Math.max(maxF, d); tot += d; frames++; }
          out.push({ tNoche, frames, maxF, tot, largo: c.largo, puntos: c.ruta.length, recta: c.recta, ruta: JSON.stringify(c.ruta), d: c.d });
        }
        const normal = []; for (let i = 0; i < 12; i++) { const t = performance.now(); M.actualizar(0.05, js); normal.push(performance.now() - t); }
        return { out, normal }})()`, 300000);
      const resumen = (nombre, m) => {
        const noche = mediana(m.out.map((o) => o.tNoche)), maxF = mediana(m.out.map((o) => o.maxF)), tot = mediana(m.out.map((o) => o.tNoche + o.tot)), frames = mediana(m.out.map((o) => o.frames));
        const base = mediana(m.normal);
        console.log(`MEDIDA ${nombre}: comienzo de la noche ${noche.toFixed(2)} ms · cuadro más caro mientras se calcula ${maxF.toFixed(2)} ms (cuadro normal ${base.toFixed(2)} ms) · total ${tot.toFixed(2)} ms en ${frames} cuadros · ruta ${m.out[0].puntos} puntos, ${m.out[0].largo.toFixed(1)} m${m.out[0].recta ? ' (recta)' : ''}`);
        return { noche, maxF, tot, frames, base };
      };
      const todas = (m) => m.out.every((o) => o.ruta === m.out[0].ruta);

      // --- la base despejada
      const m1 = await medir(REPETIR);
      const r1 = resumen('base despejada', m1);
      ok(todas(m1), 'la ruta sale igual cada vez');
      if (hay.repartida) {
        ok(m1.out.every((o) => o.frames >= 1), `se aplica ${m1.out[0].frames} cuadro(s) después del comienzo de la noche`);
        // la misma ruta, calculada de una vez
        const igual = await js(`(()=>{const H=${H}, M=H.desafio.asedio, c=H.progreso.desafio.asedio.camino; const repartida = JSON.stringify(c.ruta);
          M.alEmpezarNoche(); const pendiente = M.rutaPendiente; M.terminarRuta(); return { pendiente, entera: JSON.stringify(c.ruta) === repartida, quedo: M.rutaPendiente }})()`);
        ok(igual.pendiente === true && igual.entera === true && igual.quedo === false, 'calculada de una vez (terminarRuta) es exactamente la misma ruta que la repartida en cuadros');
        // el alba con la ruta pendiente la termina
        const alba = await js(`(()=>{const H=${H}, M=H.desafio.asedio; M.alEmpezarNoche(); const antes = M.rutaPendiente; H.progreso.horas = 6.1; M.alTerminarNoche(true); return { antes, despues: M.rutaPendiente }})()`);
        ok(alba.antes === true && alba.despues === false, 'si la noche termina con la ruta pendiente, el alba la termina');
        await js(`(()=>{const c=${H}.progreso.desafio.asedio.camino; c.d = 0; c.ultima = -1; return 1})()`);
      }

      // --- una noche entera con la ruta repartida: el Coihue camina lo que corresponde
      const noche = await js(`(()=>{const H=${H}, D=H.progreso.desafio, M=H.desafio.asedio, js=H.jugador.estado, A=D.asedio, c=A.camino;
        const sal={d0:c.d, cuadrosHastaRuta:0, zanc:0, cuadros:0};
        D.oleadas++; H.progreso.dia++; H.progreso.horas = 20.6; M.alEmpezarNoche();
        for (let k=0;k<190;k++) {
          H.progreso.horas += 0.05; if (H.progreso.horas >= 24) H.progreso.horas -= 24;
          H.progreso.desafio.salud = 100; M.actualizar(0.25, js);
          if (M.rutaPendiente) sal.cuadrosHastaRuta++;
          if (M.visual.zancada) sal.zanc++; sal.cuadros++;
        }
        H.progreso.horas = 6.1; M.alTerminarNoche(true); H.progreso.horas = 9; for (let k=0;k<80;k++) M.actualizar(0.25, js);
        sal.d1=c.d; sal.porNoche=c.porNoche; sal.pendiente=M.rutaPendiente; sal.nave=A.nave; return sal})()`, 180000);
      ok(noche.d1 > noche.d0 + 2 && noche.zanc >= 5 && !noche.pendiente, `la noche con la ruta repartida: el Coihue camina ${noche.d0.toFixed(1)} → ${noche.d1.toFixed(1)} m (${noche.zanc} cuadros de zancada, ruta lista tras ${noche.cuadrosHastaRuta} cuadros)`);

      // --- la base cercada: un anillo de empalizadas alrededor del centro de la base (lo que más cuesta del cálculo)
      const cerco = await js(`(()=>{const H=${H}, O=H.obras, P=H.progreso, c=H.desafio.centroBase(); let n = 0;
        Object.assign(P.materiales, { tronco: 9999, tabla: 9999, piedra: 9999, cristal: 99 });
        const poner = (id, x, z, rot) => { const p = H.PLANOS.find(q => q.id === id); if (!p) return; O.elegir(p); const f = O.fundar(x, z, rot, H.T.altura(x, z)); O.elegir(null); if (!f.ok) return;
          for (let g = 0; g < 12 && f.obra.datos.etapas < f.obra.plano.etapas.length; g++) { if (!O.avanzar(f.obra, P.materiales).ok) break; } n++; };
        for (const R of [14, 22, 30, 38]) for (let k = 0; k < Math.round(R * 1.6); k++) { const a = k / Math.round(R * 1.6) * Math.PI * 2; poner('empalizada', c.x + Math.sin(a) * R, c.z + Math.cos(a) * R, a); }
        P.obras = O.obras.map(o => o.datos); H.desafio.defensas.refrescar(); H.desafio.fortin.refrescar(); return { obras: O.obras.length, puestas: n }})()`, 300000);
      console.log('cerco:', JSON.stringify(cerco));
      await js(`(()=>{const c=${H}.progreso.desafio.asedio.camino; c.d = 0; c.llego = false; return 1})()`);
      const m2 = await medir(Math.max(2, Math.floor(REPETIR / 2)));
      const r2 = resumen('base cercada', m2);
      ok(todas(m2), 'con la base cercada la ruta también sale igual cada vez');
      if (hay.repartida) {
        ok(m2.out.every((o) => o.frames >= 1), `con la base cercada se reparte en ${m2.out[0].frames} cuadros`);
        // (el límite de cuadro es del presupuesto: un cuadro de la ruta no debería pasar de unos pocos ms aun con la base cercada)
        ok(r2.maxF < 8, `y el cuadro más caro mientras se calcula es de ${r2.maxF.toFixed(2)} ms`);
        // mientras la ruta se calcula (con la base cercada tarda varios cuadros) el Coihue espera quieto: no camina por la ruta vieja
        const quieto = await js(`(()=>{const H=${H}, M=H.desafio.asedio, js=H.jugador.estado, c=H.progreso.desafio.asedio.camino; c.d = 0; c.ultima = -1; H.progreso.horas = 22; M.alEmpezarNoche(); const d0 = c.d;
          M.actualizar(0.05, js); const sigue = M.rutaPendiente, d1 = c.d; M.terminarRuta(); return { sigue, d0, d1 }})()`);
        ok(quieto.sigue === true && quieto.d1 === quieto.d0, `con la ruta a medio calcular el Coihue espera quieto (${quieto.d0} → ${quieto.d1})`);
      }
      fs.writeFileSync(path.join(salida, `medida-${hay.repartida ? 'repartida' : 'de-una-vez'}.json`), JSON.stringify({ despejada: r1, cercada: r2, repartida: hay.repartida }, null, 2));
    }
  } catch (e) { errores.push(`${donde}: ${e.message}`); }

  fs.writeFileSync(path.join(salida, 'informe.json'), JSON.stringify({ pasos, errores }, null, 2));
  if (errores.length) console.log('ERRORES:\n' + errores.join('\n'));
  else console.log(`humo-4-11-3-proceso: ${pasos.length} comprobaciones, todo en verde`);
  app.exit(errores.length ? 1 : 0);
});

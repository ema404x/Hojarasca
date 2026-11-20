// Partida real 4.31.1 (B): cacería de bugs del refugio, tus casas y la mochila. Lo de la 4.31.0 (A) con lo que no se miró: sentarse y levantarse con
// las teclas de verdad (que no te empuje el mueble ni quedes adentro de la mesa), lo guardado que vuelve al cargar la partida (la ventana abierta,
// el fuego, el baúl), la ventana desde afuera (mirando al borde), la E sentado, el Desafío (sin nada de esto) y la Historia; consola a errores.
// Uso (después de `node armar.mjs`): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-4-30-1-a.ps1 -Script pruebas\humo-4-31-1-b.cjs -Perfil perfil-4311-b
//   HUMO_PARTES=sentar,afuera,recarga,noche · HUMO_MODO=relax|desafio|historia · HUMO_ULTRA=1 · HUMO_SALIDA=<carpeta>
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(process.env.TEMP || raiz, 'hx', 'b4311'));
const ANCHO = 1366, ALTO = 724;
fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 12 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 12 * 60 * 1000).unref?.();
const PARTES = (process.env.HUMO_PARTES || 'sentar,afuera,recarga,noche').split(',');
const parte = (p) => PARTES.includes(p);
const MODO = process.env.HUMO_MODO || 'relax';
const PRE = process.env.HUMO_PRE || '';

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, P = H.progreso;
  const N = window.__N = {};
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  H.ajustes.limiteFps = 'libre';
  N.tick = async (seg = 0.5) => { const t0 = performance.now(); while (performance.now() - t0 < seg * 1000) { H.__bucle(); await dormir(14); } return 1; };
  N.tarjeta = () => { const v = document.getElementById('valle-tarjeta'); return !!v && !v.classList.contains('oculto'); };
  { const st = document.createElement('style'); st.textContent = '#pista-clic { display: none !important; }'; document.head.appendChild(st); }
  const R = () => H.T.lugares.refugio;
  N.local = (lx, ly, lz) => { const r = R(), c = Math.cos(r.rot), s = Math.sin(r.rot); return { x: r.x + lx * c + lz * s, y: r.y + ly, z: r.z - lx * s + lz * c }; };
  N.aLocal = (p) => { const r = R(), c = Math.cos(r.rot), s = Math.sin(r.rot), dx = p.x - r.x, dz = p.z - r.z; return { x: +(dx * c - dz * s).toFixed(2), y: +(p.y - r.y).toFixed(2), z: +(dx * s + dz * c).toFixed(2) }; };
  N.mirarA = (lx, lz, a) => { const de = N.local(lx, 0, lz); H.jugador.estado.sentado = false; H.jugador.ubicar(de.x, de.z, Math.atan2(-(a.x - de.x), -(a.z - de.z))); return 1; };
  N.ajustarPitch = (a) => { const c = H.camara.position, d = Math.hypot(a.x - c.x, a.z - c.z); H.jugador.estado.yaw = Math.atan2(-(a.x - c.x), -(a.z - c.z)); H.jugador.estado.pitch = Math.atan2(a.y - c.y, d); return 1; };
  N.casa = () => JSON.stringify(P.casa);
  N.aviso = () => H.__aviso();
  N.tecla = (code, key, tipo) => { document.dispatchEvent(new KeyboardEvent(tipo, { code, key, bubbles: true, cancelable: true })); return 1; };
  N.e = () => { N.tecla('KeyE', 'e', 'keydown'); N.tecla('KeyE', 'e', 'keyup'); return 1; };
  N.caminar = async (code = 'KeyW', seg = 0.4) => { N.tecla(code, code.slice(3).toLowerCase(), 'keydown'); await N.tick(seg); N.tecla(code, code.slice(3).toLowerCase(), 'keyup'); await N.tick(0.2); return 1; };
  N.cerrarCharla = async () => { for (let i = 0; i < 8; i++) { const c = document.getElementById('charla'); if (!c || c.classList.contains('oculto')) return 1; N.e(); await N.tick(0.25); } return 0; };
  N.pos = () => { const p = H.jugador.estado.pos; return JSON.stringify({ local: N.aLocal(p), sentado: H.jugador.estado.sentado }); };
  N.mundo = (x, z) => JSON.stringify({ x: +x.toFixed(2), z: +z.toFixed(2) });
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [];
  const { ipcMain } = require('electron');
  require(path.join(raiz, 'copias-main.cjs')).registrarCopias({ ipcMain, app });
  require(path.join(raiz, 'fotos-main.cjs')).registrarFotos({ ipcMain, app });
  const w = new BrowserWindow({ show: true, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false, preload: path.join(raiz, 'preload.cjs') } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || e.level === 'warning' && /casa|Uncaught|TypeError/.test(m) || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon|gradient instruction/.test(m)) errores.push(m.slice(0, 240));
  });
  let donde = 'carga';
  const js = (c, espera = 120000) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió (${donde})`)), espera))]);
  const N = (c) => js(`(async () => { const H = window.__hojarasca, N = window.__N, P = H.progreso; return (${c}); })()`);
  const url = path.join(raiz, 'index.html');
  const foto = async (nombre) => { await esperar(400); const img = await w.webContents.capturePage(); fs.writeFileSync(path.join(salida, PRE + nombre + '.jpg'), img.toJPEG(80)); };
  const ajustes = (o) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({calidad:'media', clima:'despejado', musica:false, modo:'relax', relaxTipo:'libre', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'}, ${JSON.stringify(o)}))); 1`;
  const esperarJuego = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false)) return true; } return false; };
  const seccion = async (nombre, fn) => {
    if (!parte(nombre)) return;
    donde = nombre; console.log('— ' + nombre);
    try { await fn(); } catch (err) { console.log('ERROR en', nombre + ':', err && err.stack || err); errores.push(`${nombre}: ${err && err.message || err}`); }
    const fallas = await js('(() => { const C = window.__hojarasca && window.__hojarasca.__caidas; return C && C.fallas ? JSON.stringify(C.fallas()).slice(0, 600) : "" })()').catch(() => '');
    if (fallas && fallas !== '[]') { console.log('  FALLAS DEL JUEGO: ' + fallas); errores.push(nombre + ': fallas ' + fallas.slice(0, 200)); }
  };
  const entrar = async () => {
    if (!(await esperarJuego())) throw new Error('el juego no cargó');
    await js('window.__sinPausaPorBlur = true; 1');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000);
    await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
    await N('N.tick(2)');
    for (let k = 0; k < 6 && (await N('N.tarjeta()')); k++) { await N('(() => { const b = document.querySelector("#valle-tarjeta button[data-valle-opcion]"); if (b) b.click(); return 1 })()'); await N('N.tick(0.6)'); }
    // la Historia arranca con una escena (a mitad de una escena no se guarda): se saltea
    await N('(async () => { const d = H.__escenas && H.__escenas.director; for (let i = 0; d && i < 6 && d.activa(); i++) { d.saltar(); await N.tick(0.3); } return 1 })()');
    await N('(() => { H.clima.estado.lluvia = 0; H.clima.estado.nublado = 0; return 1 })()');
  };
  const apuntar = async (id, lx, lz, i = 0) => {
    await N(`(() => { const p = H.__casaDetalles().puntos(${JSON.stringify(id)})[${i}]; N.mirarA(${lx}, ${lz}, p); return 1 })()`); await N('N.tick(0.3)');
    await N(`(() => { const p = H.__casaDetalles().puntos(${JSON.stringify(id)})[${i}]; return N.ajustarPitch(p) })()`); await N('N.tick(0.4)');
    return N('N.aviso()');
  };
  try {
    await w.loadFile(url, { search: '?debug=1' });
    const extra = MODO === 'desafio' ? { modo: 'desafio' } : MODO === 'historia' ? { relaxTipo: 'historia' } : {};
    await js(`localStorage.clear(); ${ajustes({ ultra: process.env.HUMO_ULTRA === '1', ...extra })}`);
    await w.loadFile(url, { search: '?debug=1' });
    await entrar();
    await N('(() => { P.dia = Math.max(P.dia || 1, 3); P.horas = 11; return 1 })()');
    console.log('  escena corriendo:', await N('!!(H.__escenas && H.__escenas.corriendo && H.__escenas.corriendo())'), '· guardar():', await N('H.guardar()'));
    console.log('  modo', MODO, '· casaDetalles:', await N('!!(H.__casaDetalles && H.__casaDetalles())'), '· casa guardada:', await N('N.casa()'));

    if (MODO === 'desafio') {
      // en el Desafío no hay nada: apuntar a donde estaría la lámpara y la bomba; el aviso no dice nada de la casa
      for (const [n, lx, lz, a] of [['lampara', 0.4, -0.2, [0.95, 1.08, -1.3]], ['bomba', 5.6, 2.4, [4.15, 0.95, 1.2]], ['hogar', -1.4, -0.2, [-2.4, 0.72, -1.78]]]) {
        await N(`(() => { const a = N.local(${a.join(',')}); N.mirarA(${lx}, ${lz}, a); return 1 })()`); await N('N.tick(0.3)');
        await N(`N.ajustarPitch(N.local(${a.join(',')}))`); await N('N.tick(0.4)');
        console.log(`  desafío, mirando ${n}: aviso «${await N('N.aviso()')}»`); await foto('d-' + n);
      }
      await N('(() => { P.horas = 22; return 1 })()'); await N('N.tick(3)'); await foto('d-noche');
    }

    if (MODO !== 'desafio') {
      await seccion('sentar', async () => {
        for (const [id, lx, lz] of [['silla', 1.1, 0.9], ['sillon', -0.6, -0.3]]) {
          const aviso = await apuntar(id, lx, lz);
          await foto(`s-${id}-antes`);
          await N('N.e()'); await N('N.tick(0.3)');
          const recien = await N('N.pos()');
          await N('N.tick(2)');
          const luego = await N('N.pos()');
          const sentadoAviso = await N('N.aviso()');
          await foto(`s-${id}-sentado`);
          await N('N.caminar("KeyW", 0.35)');
          const parado = await N('N.pos()');
          await N('N.tick(1)');
          await foto(`s-${id}-parado`);
          console.log(`  ${id}: aviso «${aviso}» · al sentarte ${recien} · a los 2 s ${luego} · sentado, aviso «${sentadoAviso}» · con W ${parado}`);
          // levantarse hacia atrás y al costado
          await apuntar(id, lx, lz); await N('N.e()'); await N('N.tick(0.5)'); await N('N.caminar("KeyS", 0.35)');
          console.log(`  ${id}: con S ${await N('N.pos()')}`);
        }
        // tus muebles armados (sentarse): en el suelo, detrás del refugio
        const r = await N(`(() => { const PL = Array.isArray(H.PLANOS) ? H.PLANOS : Object.values(H.PLANOS);
          const et = (id) => (PL.find((p) => p.id === id)?.etapas?.length || 1);
          const base = N.local(0, 0, 9);
          const nuevas = [['sillon', 0, 0], ['mecedora', 2.6, 0], ['sillon-cuero', -2.6, 0]].map(([plano, dx, dz]) => { const x = base.x + dx, z = base.z + dz; return { plano, x, z, y: H.T.altura(x, z), rot: 0.6, etapas: et(plano) }; });
          P.obras.push(...nuevas); H.obras.sincronizar(nuevas); return nuevas.map((o) => o.plano).join(' ') })()`);
        console.log('  muebles puestos:', r); await N('N.tick(1)');
        for (const plano of ['sillon', 'mecedora', 'sillon-cuero']) {
          const res = await N(`(async () => { const o = H.obras.obras.find((x) => x.plano.id === ${JSON.stringify(plano)}); const d = o.datos, c = Math.cos(d.rot), s = Math.sin(d.rot);
            const fx = -1.4 * s, fz = -1.4 * c;   // delante del mueble (su -z)
            H.jugador.estado.sentado = false; H.jugador.ubicar(d.x + fx, d.z + fz, 0); await N.tick(0.3);
            N.ajustarPitch({ x: d.x, y: d.y + 0.6, z: d.z }); await N.tick(0.4);
            const aviso = N.aviso(); N.e(); await N.tick(0.3); const p0 = H.jugador.estado.pos.clone(); await N.tick(2); const p1 = H.jugador.estado.pos;
            const sentado = H.jugador.estado.sentado, deriva = Math.hypot(p1.x - p0.x, p1.z - p0.z), alto = p1.y - d.y, alMueble = Math.hypot(p1.x - d.x, p1.z - d.z);
            return JSON.stringify({ aviso, sentado, deriva: +deriva.toFixed(3), alto: +alto.toFixed(2), alMueble: +alMueble.toFixed(2), yaw: +H.jugador.estado.yaw.toFixed(2) }) })()`);
          await foto('s-obra-' + plano);
          await N('N.caminar("KeyW", 0.35)');
          console.log(`  ${plano}: ${res} · con W ${await N('JSON.stringify({ sentado: H.jugador.estado.sentado })')}`);
        }
        // la alacena armada es de la cocina: su E dice lo que hay (con cuántos), no la nota del mueble
        const al = await N(`(async () => { const PL = Array.isArray(H.PLANOS) ? H.PLANOS : Object.values(H.PLANOS); const et = PL.find((p) => p.id === 'alacena')?.etapas?.length || 1;
          const b = N.local(5, 0, 9), o = { plano: 'alacena', x: b.x, z: b.z, y: H.T.altura(b.x, b.z), rot: 0, etapas: et }; P.obras.push(o); H.obras.sincronizar([o]); await N.tick(0.5);
          const ob = H.obras.obras.find((x) => x.datos === o) || H.obras.obras.find((x) => x.plano.id === 'alacena'); const d = ob.datos;
          H.jugador.estado.sentado = false; H.jugador.ubicar(d.x, d.z - 1.5, Math.PI); await N.tick(0.3); N.ajustarPitch({ x: d.x, y: d.y + 1.0, z: d.z }); await N.tick(0.4);
          return N.aviso() })()`);
        console.log(`  alacena armada: aviso «${al}»`); await foto('s-alacena-armada');
      });

      await seccion('casas', async () => {
        // el refugio por dentro, desde las cuatro esquinas (muebles que flotan o se atraviesan)
        for (const [n, lx, lz, mx, mz] of [['r1', 2.8, 2.0, -2.5, -2.0], ['r2', -2.8, 2.0, 2.8, -2.0], ['r3', -2.8, -2.0, 2.8, 2.0], ['r4', 2.8, -0.4, -2.8, 1.6]]) {
          await N(`(() => { N.mirarA(${lx}, ${lz}, N.local(${mx}, 0.8, ${mz})); return 1 })()`); await N('N.tick(0.4)');
          await N(`N.ajustarPitch(N.local(${mx}, 0.7, ${mz}))`); await N('N.tick(0.6)'); await foto('c-refugio-' + n);
        }
        // el Puesto Alto por dentro
        const pa = await N('(() => { const c = (H.est.cabañas || []).find((x) => /Puesto/.test(x.nombre || "")); if (!c) return "sin puesto"; H.jugador.estado.sentado = false; H.jugador.ubicar(c.x, c.z, (c.rot || 0) + Math.PI); return JSON.stringify({ x: +c.x.toFixed(1), z: +c.z.toFixed(1) }) })()');
        await N('N.tick(1.5)'); await foto('c-puesto-1');
        await N('(() => { H.jugador.estado.yaw += Math.PI; H.jugador.estado.pitch = -0.2; return 1 })()'); await N('N.tick(0.6)'); await foto('c-puesto-2');
        console.log('  Puesto Alto:', pa, '· dónde quedaste:', await N('N.pos()'), '· aviso', await N('N.aviso()'));
        // tus casas armadas, con muebles adentro
        const PLACE = `(() => { const PL = Array.isArray(H.PLANOS) ? H.PLANOS : Object.values(H.PLANOS); const et = (id) => (PL.find((p) => p.id === id)?.etapas?.length || 1);
          const out = []; for (const [plano, lx, lz] of [['cabana-piedra', 0, 32], ['casa-galeria', 18, 32], ['casona', -20, 32]]) { const b = N.local(lx, 0, lz); const o = { plano, x: b.x, z: b.z, y: H.T.altura(b.x, b.z), rot: 0, etapas: et(plano) }; P.obras.push(o); H.obras.sincronizar([o]); out.push(plano); } return out.join(' ') })()`;
        console.log('  casas puestas:', await N(PLACE)); await N('N.tick(1.5)');
        for (const plano of ['cabana-piedra', 'casa-galeria', 'casona']) {
          const r = await N(`(async () => { const o = H.obras.obras.find((x) => x.plano.id === ${JSON.stringify(plano)}); const d = o.datos; H.jugador.estado.sentado = false; H.jugador.ubicar(d.x + 0.3, d.z + 0.3, 0); await N.tick(1.2); const p = H.jugador.estado.pos; return JSON.stringify({ alto: +(p.y - d.y).toFixed(2), corrido: +Math.hypot(p.x - d.x - 0.3, p.z - d.z - 0.3).toFixed(2) }) })()`);
          for (let k = 0; k < 4; k++) { await N(`(() => { H.jugador.estado.yaw = ${k} * Math.PI / 2; H.jugador.estado.pitch = -0.25; return 1 })()`); await N('N.tick(0.5)'); await foto(`c-${plano}-${k}`); }
          console.log(`  ${plano}: adentro ${r} · aviso «${await N('N.aviso()')}»`);
        }
      });

      await seccion('afuera', async () => {
        // la ventana del frente desde afuera: al medio y al borde (donde están los costados de la cortina)
        for (const [n, a] of [['medio', [2.2, 1.45, 2.6]], ['borde-izq', [1.6, 1.5, 2.6]], ['borde-der', [2.8, 1.5, 2.6]]]) {
          await N(`(() => { const a = N.local(${a.join(',')}); N.mirarA(2.2, 4.1, a); return 1 })()`); await N('N.tick(0.3)');
          await N(`N.ajustarPitch(N.local(${a.join(',')}))`); await N('N.tick(0.4)');
          console.log(`  ventana desde afuera (${n}): aviso «${await N('N.aviso()')}»`);
        }
        await foto('a-ventana-afuera');
        // la ventana del costado desde afuera
        for (const [n, a] of [['medio', [-3.35, 1.45, 0]], ['borde', [-3.35, 1.5, 0.6]]]) {
          await N(`(() => { const a = N.local(${a.join(',')}); N.mirarA(-4.9, 0.2, a); return 1 })()`); await N('N.tick(0.3)');
          await N(`N.ajustarPitch(N.local(${a.join(',')}))`); await N('N.tick(0.4)');
          console.log(`  ventana del costado desde afuera (${n}): aviso «${await N('N.aviso()')}»`);
        }
      });

      await seccion('recarga', async () => {
        await N('(() => { Object.assign(P.casa, { lampara: false, farol: false, velas: true, hogar: false, radio: true, ventanas: [1, 0], cortinas: [0, 1], baul: true, alacena: true, cajon: true, libro: 3, carta: 2 }); return 1 })()');
        await N('N.mirarA(-0.2, 1.6, N.local(1.5, 1.2, 2.6))'); await N('N.ajustarPitch(N.local(1.8, 1.3, 2.6))'); await N('N.tick(1.5)'); await foto('r-antes');
        await N('(() => { H.guardar(); return 1 })()');
        const antes = await N('N.casa()');
        const info = "JSON.stringify({ dia: P.dia, horas: +P.horas.toFixed(2), cap: P.historia && (P.historia.capitulo ?? P.historia.cap), claves: Object.keys(localStorage).filter((k) => /hojarasca/.test(k)), casaEnDisco: Object.keys(localStorage).filter((k) => /hojarasca/.test(k)).map((k) => { try { const v = JSON.parse(localStorage.getItem(k)); return k + ':' + (v && v.casa ? JSON.stringify(v.casa).slice(0, 40) : '-'); } catch { return k + ':?'; } }) })";
        console.log('  antes de cargar: ' + await N(info));
        await w.loadFile(url, { search: '?debug=1' });
        await entrar();
        const despues = await N('N.casa()');
        console.log('  al cargar: ' + await N(info));
        console.log('  casa antes de cargar:', antes); console.log('  casa al cargar:     ', despues, antes === despues ? '(igual)' : '(DISTINTA)');
        await N('N.mirarA(-0.2, 1.6, N.local(1.5, 1.2, 2.6))'); await N('N.ajustarPitch(N.local(1.8, 1.3, 2.6))'); await N('N.tick(1.5)'); await foto('r-despues');
        console.log('  al cargar se ve: ' + await N('(() => { const M = H.__casaDetalles().mundo, p = M.partes; return JSON.stringify({ hoja0: p.hojas[0].visible, hoja1: p.hojas[1].visible, sinVidrio: M.sinVidrio, fuego: p.fuego.visible, velas: p.llamasVelas.visible, baul: +p.tapaBaul.rotation.z.toFixed(2), cajon: +p.cajon.position.z.toFixed(2), cortina1: +p.cortinas[1][0].scale.x.toFixed(2) }) })()'));
        console.log('  humo con el hogar apagado al cargar: ' + await N('(() => { H.__actualizarCasaViva(3); return !H.__casaViva().chimeneas.includes(H.T.lugares.refugio.chimenea) ? "sin humo" : "HUMEA" })()'));
        await N('(() => { Object.assign(P.casa, { lampara: true, farol: true, velas: false, hogar: true, radio: false, ventanas: [0, 0], cortinas: [0, 0], baul: false, alacena: false, cajon: false }); return 1 })()');
      });

      await seccion('noche', async () => {
        await N('(() => { P.horas = 22.5; return 1 })()'); await N('N.tick(2)');
        await N('N.mirarA(1.5, 11, N.local(0.6, 1.6, 2.75))'); await N('N.ajustarPitch(N.local(0.6, 1.6, 2.75))'); await N('N.tick(1.5)'); await foto('n-afuera');
        await N('N.mirarA(2.4, 1.8, N.local(-1.2, 1.0, -1.6))'); await N('N.ajustarPitch(N.local(-1.2, 1.0, -1.6))'); await N('N.tick(1.2)'); await foto('n-adentro');
        // a dormir con la pava al fuego y la radio prendida: lo que queda al despertar
        await apuntar('radio', 0.2, -1.2); await N('N.e()'); await N('N.tick(0.3)'); await N('N.cerrarCharla()');
        await apuntar('pava', -1.3, -0.9); await N('N.e()'); await N('N.tick(0.3)');
        console.log('  antes de dormir: ' + await N('JSON.stringify(H.__casaDetalles().estado())') + ' · radio ' + await N('P.casa.radio'));
      });
    }
  } catch (err) { console.log('ERROR:', err && err.stack || err); errores.push(String(err && err.message || err)); }
  console.log(errores.length ? 'ERRORES:\n  ' + errores.join('\n  ') : 'SIN ERRORES');
  console.log('capturas en', salida);
  app.exit(errores.length ? 1 : 0);
});

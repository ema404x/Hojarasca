// Prueba de caos (Electron + WebGL): un jugador que aprieta cualquier cosa. Teclas al azar
// (con keydown/keyup de verdad), clics, saltos a lugares al azar del valle (agua, techos,
// el lago, el tren), cambios de hora y de clima, guardar y recargar. En cada paso corre
// cuadros enteros del juego (__bucle) y mira que no haya errores, que el jugador no quede
// en NaN ni bajo el suelo, y que la partida guardada se pueda volver a cargar.
// Se repite igual con la misma semilla: CAOS_SEMILLA=123 npx electron pruebas/humo-caos.cjs
// Uso: npx electron pruebas/humo-caos.cjs   (CAOS_PASOS=600 para más largo)
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const SEMILLA = Number(process.env.CAOS_SEMILLA || 20240925);
const PASOS = Number(process.env.CAOS_PASOS || 350);

// azar con semilla (el mismo recorrido cada vez)
let s = SEMILLA >>> 0;
const azar = () => { s = (s ^ (s << 13)) >>> 0; s = (s ^ (s >>> 17)) >>> 0; s = (s ^ (s << 5)) >>> 0; return s / 4294967296; };
const uno = (lista) => lista[Math.floor(azar() * lista.length)];

// 2.5/2.6: lo que la prueba de caos usa en el Desafío
const ARMAS_CAOS = ['ballesta', 'facon', 'maza', 'arpon', 'hachuela', 'jabalina', 'granada', 'humo', 'bengala', 'cuerno', 'arco', 'tensar', 'flecha', 'escudo', 'boleadoras', 'lanza', 'honda'];
const PIEZAS_CAOS = ['muro-tronera', 'catapulta', 'troncos-colgantes', 'cerco-cristal', 'puente-levadizo', 'espejo-faro', 'senuelo', 'trampa-lazo', 'abrojos', 'embudo', 'tejado-lajas', 'puesto-tirador', 'pasarela-colgante', 'rampa-troncos', 'armero', 'contrafuerte', 'adarve', 'antorcha', 'empalizada', 'muro-piedra'];
const TECLAS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyC', 'KeyE', 'KeyE', 'KeyE', 'KeyF', 'KeyG', 'KeyH', 'KeyY', 'KeyB', 'KeyT',
  'KeyV', 'KeyR', 'KeyO', 'Tab', 'BracketLeft', 'BracketRight', 'KeyX', 'Backspace', 'Delete', 'KeyN', 'KeyQ', 'KeyM', 'KeyP', 'KeyZ',
  'KeyI', 'KeyJ', 'KeyL', 'KeyU', 'KeyK', 'Escape', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'ShiftLeft'];

app.whenReady().then(async () => {
  const errores = [], vistos = new Set();
  const w = new BrowserWindow({ show: false, width: 1024, height: 640, webPreferences: { backgroundThrottling: false } });
  let donde = 'carga', ultimoPaso = '';
  const anotar = (m) => { const k = m.slice(0, 160); if (vistos.has(k)) return; vistos.add(k); errores.push(`[${donde}] ${m.slice(0, 400)}\n      último paso: ${ultimoPaso}`); };
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) anotar(m);
  });
  w.webContents.on('render-process-gone', (_e, d) => anotar('el proceso de la página se cayó: ' + JSON.stringify(d)));
  const js = (c) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 60 s (${donde})`)), 60000)),
  ]);
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const entrar = async () => {
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
  };
  const cargar = async (modo) => {
    await abrir();
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'${modo}', autoCalidad:false, guiaPrimerDia:false})); 1`);
    await abrir(); await entrar();
  };
  // unos cuadros enteros del juego, con 20 ms reales entre uno y otro (el reloj de cadencia los pide)
  const cuadros = (n) => js(`(async ()=>{ const H = window.__hojarasca; for (let i = 0; i < ${n}; i++) { H.__bucle(); await new Promise(r => setTimeout(r, 20)); } return 1 })()`);
  // lo que no puede pasar nunca
  const revisar = () => js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado, p = js.pos, mal = [];
    if (![p.x, p.y, p.z, js.yaw, js.pitch].every(Number.isFinite)) mal.push('posición o mirada no finita: ' + JSON.stringify({ x: p.x, y: p.y, z: p.z, yaw: js.yaw }));
    else if (!js.enTren && !js.nadando && !js.enKayak && p.y < H.T.altura(p.x, p.z) - 1.5) mal.push('el jugador quedó bajo el suelo: ' + (p.y - H.T.altura(p.x, p.z)).toFixed(2));
    const P = H.progreso;
    if (!Number.isFinite(P.horas) || !Number.isFinite(P.dia)) mal.push('hora o día no finitos');
    for (const [k, n] of Object.entries(P.materiales || {})) if (!Number.isFinite(n) || n < 0) mal.push('material ' + k + ' = ' + n);
    for (const [k, e] of Object.entries(P.entradas || {})) if (e && e.cantidad !== undefined && (!Number.isFinite(e.cantidad) || e.cantidad < 0)) mal.push('entrada ' + k + ' = ' + e.cantidad);
    for (const [k, n] of Object.entries(P.cosas || {})) if (typeof n === 'number' && (!Number.isFinite(n) || n < 0)) mal.push('cosa ' + k + ' = ' + n);
    if (!Number.isFinite(P.ramitas) || P.ramitas < 0) mal.push('ramitas = ' + P.ramitas);
    const D = P.desafio; if (D && (!Number.isFinite(D.salud) || D.salud < 0 || D.salud > 1000)) mal.push('salud = ' + D.salud);
    // 2.5: ninguna munición nueva negativa
    if (D) for (const k of ['virotes', 'flechasFuego', 'flechasCristal', 'hachuelas', 'jabalinas', 'granadas', 'humos', 'bengalas', 'flechas', 'boleadoras', 'cargas']) if (D[k] !== undefined && (!Number.isFinite(D[k]) || D[k] < 0)) mal.push(k + ' = ' + D[k]);
    for (const o of H.obras?.obras || []) if (![o.datos.x, o.datos.z, o.datos.y ?? 0].every(Number.isFinite)) { mal.push('obra en NaN: ' + o.plano.id); break; }
    return mal })()`);
  const soltarTodo = () => js(`(()=>{ for (const c of ['KeyW','KeyA','KeyS','KeyD','ShiftLeft','KeyZ']) document.dispatchEvent(new KeyboardEvent('keyup',{code:c,bubbles:true})); return 1 })()`);

  // una acción al azar
  const accion = async (modo) => {
    const r = azar();
    if (r < 0.55) {
      const t = uno(TECLAS), mantener = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft'].includes(t) ? 3 + Math.floor(azar() * 12) : 1;
      ultimoPaso = `tecla ${t} (${mantener} cuadros)`;
      await js(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'${t}',bubbles:true})); 1`);
      await cuadros(mantener);
      await js(`document.dispatchEvent(new KeyboardEvent('keyup',{code:'${t}',bubbles:true})); 1`);
    } else if (r < 0.65) {
      const b = azar() < 0.6 ? 0 : 2;
      ultimoPaso = `clic ${b}`;
      await js(`(()=>{ const c = document.querySelector('canvas'); const o = { button: ${b}, bubbles: true, clientX: 512, clientY: 320 };
        (c || window).dispatchEvent(new MouseEvent('mousedown', o)); window.dispatchEvent(new MouseEvent('mousedown', o));
        window.dispatchEvent(new MouseEvent('mouseup', o)); (c || window).dispatchEvent(new MouseEvent('mouseup', o)); return 1 })()`);
      await cuadros(2);
    } else if (r < 0.72) {
      const dy = (azar() - 0.5) * 1.2, dx = (azar() - 0.5) * 2.5;
      ultimoPaso = `mirar ${dx.toFixed(2)} ${dy.toFixed(2)}`;
      await js(`(()=>{ const js = window.__hojarasca.jugador.estado; js.yaw += (${dx}); js.pitch = Math.max(-1.4, Math.min(1.4, js.pitch + (${dy}))); return 1 })()`);
      await cuadros(1);
    } else if (r < 0.82) {
      // a un lugar al azar: cerca de algo conocido o cualquier parte
      const q = azar(), a = azar() * 6.283, d = azar();
      ultimoPaso = `salto (${q.toFixed(2)}, ${a.toFixed(2)}, ${d.toFixed(2)})`;
      await soltarTodo();
      await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado, L = H.T.lugares;
        if (js.enKayak || js.enTren || js.montado) return 0;
        const claves = Object.keys(L).filter(k => L[k] && typeof L[k].x === 'number');
        let x, z;
        if (${q} < 0.55 && claves.length) { const l = L[claves[Math.floor(${d} * claves.length)]]; x = l.x + Math.cos(${a}) * 6 * ${d}; z = l.z + Math.sin(${a}) * 6 * ${d}; }
        else if (${q} < 0.7) { x = 150 + Math.cos(${a}) * (90 + 40 * ${d}); z = 110 + Math.sin(${a}) * (90 + 40 * ${d}); }   // la orilla del lago
        else if (${q} < 0.8 && H.obras.obras.length) { const o = H.obras.obras[Math.floor(${d} * H.obras.obras.length)]; x = o.datos.x + 0.3; z = o.datos.z; }
        else { x = Math.cos(${a}) * 440 * ${d}; z = Math.sin(${a}) * 440 * ${d}; }
        H.jugador.ubicar(x, z, ${a}); return 1 })()`);
      await cuadros(4);
    } else if (r < 0.87) {
      const h = Math.floor(azar() * 24 * 4) / 4;
      ultimoPaso = `hora ${h}`;
      await js(`(()=>{ window.__hojarasca.progreso.horas = (${h}); return 1 })()`);
      await cuadros(3);
    } else if (r < 0.9) {
      const lluvia = azar(), inv = azar() < 0.3 ? 1 : 0;
      ultimoPaso = `clima lluvia ${lluvia.toFixed(2)} invierno ${inv}`;
      await js(`(()=>{ const H = window.__hojarasca; H.clima.estado.lluvia = (${lluvia}); H.clima.estado.nublado = (${lluvia}); return 1 })()`);
      await cuadros(3);
    } else if (r < 0.95) {
      // materiales para que el modo obra y el taller hagan algo
      ultimoPaso = 'materiales';
      await js(`(()=>{ const P = window.__hojarasca.progreso; P.materiales = P.materiales || {}; for (const k of ['tronco','tabla','piedra','cristal','lana']) P.materiales[k] = (P.materiales[k] || 0) + 6; P.ramitas = (P.ramitas || 0) + 3; P.cosas.harina = (P.cosas.harina || 0) + 1; return 1 })()`);
    } else if (modo === 'desafio' && r < 0.965) {
      // 2.5/2.6: un arma cualquiera del arsenal, o una pieza del fortín cerca, y E
      const q = azar();
      if (q < 0.55) {
        const arma = uno(ARMAS_CAOS);
        ultimoPaso = `arma ${arma}`;
        await js(`(async ()=>{ const H = window.__hojarasca, D = H.desafio;
          if ('${arma}' === 'tensar') { if (D.tensar()) { await new Promise(r => setTimeout(r, 400)); D.soltarTension(); } }
          else if ('${arma}' === 'flecha') D.cambiarFlecha();
          else if ('${arma}' === 'escudo') { D.bloquear(true, 'facon'); H.desafio.herirJugador(3, { x: H.jugador.estado.pos.x + 1, z: H.jugador.estado.pos.z }); D.bloquear(false); }
          else D.atacar('${arma}');
          return 1 })()`);
        await cuadros(3);
      } else {
        const pieza = uno(PIEZAS_CAOS);
        ultimoPaso = `armar ${pieza} y E`;
        await js(`(()=>{ const H = window.__hojarasca, O = H.obras, P = H.progreso, j = H.jugador.estado;
          Object.assign(P.materiales, { tronco: 60, tabla: 60, piedra: 60, cristal: 30 });
          const p = H.PLANOS.find(x => x.id === '${pieza}'); if (!p) return 0;
          O.elegir(p); const x = j.pos.x - Math.sin(j.yaw) * 4, z = j.pos.z - Math.cos(j.yaw) * 4;
          const f = O.fundar(x, z, j.yaw, j.pos.y);
          if (f.ok) { for (let g = 0; g < 12 && f.obra.datos.etapas < f.obra.plano.etapas.length; g++) if (!O.avanzar(f.obra, P.materiales).ok) break; }
          O.elegir(null); P.obras = O.obras.map(o => o.datos);
          H.desafio.usarCercaDe(j.pos); return 1 })()`);
        await cuadros(3);
      }
    } else if (modo === 'desafio') {
      ultimoPaso = 'noche del Desafío (simulada)';
      await js(`(()=>{ const H = window.__hojarasca; H.progreso.horas = 22; for (let i = 0; i < 60; i++) H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 }); return 1 })()`);
      await cuadros(3);
    } else {
      ultimoPaso = 'dormir si se puede';
      await js(`(()=>{ const H = window.__hojarasca; H.progreso.horas = 22; return 1 })()`);
      await js(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',bubbles:true})); 1`);
      await esperar(1500); await cuadros(3);
    }
  };

  const correr = async (modo, pasos) => {
    let anteriores = 0;
    for (let i = 0; i < pasos; i++) {
      donde = `${modo} paso ${i}`;
      try { await accion(modo); } catch (e) { anotar('excepción en la prueba: ' + e.message); break; }
      const mal = await revisar().catch((e) => ['no se pudo revisar: ' + e.message]);
      for (const m of mal) anotar(m);
      // un menú abierto no es un error, pero si queda todo trabado muchos pasos se sale
      if (i % 25 === 24) { await js(`(()=>{ document.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',bubbles:true})); const b = document.getElementById('btn-volver') || document.querySelector('[data-accion=volver]'); window.__hojarasca.volverAlJuego?.(); return 1 })()`).catch(() => 0); }
      // guardar y releer la partida
      if (i % 60 === 59) {
        ultimoPaso = 'guardar y leer';
        const g = await js(`(()=>{ const H = window.__hojarasca; H.guardar(); let n = 0, rotas = 0;
          for (const k of Object.keys(localStorage)) { if (!/^hojarasca(-desafio)?(-p\d)?-v1(-backup)?$/.test(k)) continue; try { const p = JSON.parse(localStorage.getItem(k)); if (p && Array.isArray(p.obras)) n++; } catch (e) { rotas++; } }
          return { n, rotas } })()`).catch((e) => ({ error: e.message }));
        if (g.error || g.rotas || !g.n) anotar('guardado raro: ' + JSON.stringify(g));
      }
      if (errores.length > anteriores) { console.log(`✗ ${donde}: ${errores.slice(anteriores).join(' | ').slice(0, 300)}`); anteriores = errores.length; }
    }
  };
  const recargar = async (modo) => {
    donde = `${modo} recarga`; ultimoPaso = 'recarga de la partida';
    await js(`window.__hojarasca.guardar(); 1`);
    await abrir(); await entrar();
    const ok = await js(`(()=>{ const H = window.__hojarasca; return !!H && !!H.jugador && H.progreso.modo === '${modo}' })()`).catch(() => false);
    if (!ok) anotar('la partida no volvió a cargar');
    for (const m of await revisar().catch((e) => ['no se pudo revisar: ' + e.message])) anotar(m);
    console.log(`${ok ? '✓' : '✗'} ${modo}: la partida guardada vuelve a cargar`);
  };

  try {
    console.log(`caos · semilla ${SEMILLA} · ${PASOS} pasos por modo`);
    await cargar('relax');
    await correr('relax', PASOS);
    await recargar('relax');
    await correr('relax', Math.round(PASOS / 3));
    await cargar('desafio');
    await js(`(()=>{ const P = window.__hojarasca.progreso;
      for (const k of ['arco', 'lanza', 'honda', 'boleadoras', 'ballesta', 'ballestaRepeticion', 'facon', 'maza', 'arpon', 'hachuela', 'jabalina', 'granada', 'humo', 'bengala', 'cuerno', 'rodela', 'chaleco', 'placasCristal', 'carcaj', 'boleadorasCristal']) P.cosas[k] = 1;
      Object.assign(P.desafio, { flechas: 40, flechasFuego: 20, flechasCristal: 20, virotes: 30, hachuelas: 10, jabalinas: 10, granadas: 10, humos: 8, bengalas: 8, boleadoras: 10 });
      return 1 })()`);
    await correr('desafio', PASOS);
    await recargar('desafio');
    await correr('desafio', Math.round(PASOS / 3));
  } catch (e) { anotar('excepción: ' + (e && e.message ? e.message : e)); }
  if (errores.length) { console.log(`ERRORES (${errores.length}):\n` + errores.join('\n')); app.exit(1); return; }
  console.log('✓ sin errores en ' + (PASOS * 2 + Math.round(PASOS / 3) * 2) + ' pasos');
  app.exit(0);
});

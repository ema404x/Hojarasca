// Partidas rotas (Electron + WebGL): se arma una partida de verdad, se le mete basura
// campo por campo (obras con planos que no existen o coordenadas NaN, huerta, majada,
// corral, correo, materiales, posición, hora...) y se vuelve a abrir el juego. Tiene que
// arrancar, jugar unos cuadros sin errores y conservar lo que estaba sano (el día y las
// ramitas sirven de marca). Con basura total (JSON roto, un número) arranca una nueva.
// Uso: npx electron pruebas/humo-guardado-roto.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// Cada caso: (p) => p cambiado. `nueva: true` = basura total, se acepta que arranque de cero.
const CASOS_RELAX = [
  ['plano que no existe', `p.obras.push({ plano: 'no-existe', x: 3, z: 3, rot: 0, etapas: 1 })`],
  ['obra en NaN', `p.obras.push({ plano: 'cantero', x: null, z: 'abc', rot: 0, etapas: 1 })`],
  ['obra con etapas y tinte imposibles', `p.obras.push({ plano: 'pared-modular', x: B.x + 6, z: B.z + 6, rot: 'x', etapas: 99, tinte: 'violeta' })`],
  ['obras que no son objetos', `p.obras.push(null, 5, 'pared', [1, 2])`],
  ['obras no es lista', `p.obras = { a: 1 }`],
  ['datos de obra basura', `p.obras.push({ plano: 'tendal', x: B.x + 9, z: B.z, rot: 0, etapas: 1, tendal: 'x' }, { plano: 'colmena', x: B.x + 12, z: B.z, rot: 0, etapas: 1, colmena: 5 }, { plano: 'lenera', x: B.x + 15, z: B.z, rot: 0, etapas: 1, lenera: [1] }, { plano: 'vivero', x: B.x + 18, z: B.z, rot: 0, etapas: 1, vivero: { macetas: 'no' } })`],
  ['corral basura', `p.corral = { x: 'a', z: null, esquilada: 'no' }`],
  ['corral número', `p.corral = 5`],
  ['huerta basura', `p.huerta = { '1:1': { cultivo: 'habas', dia: 'x' }, zz: 3, '2:2': null, '3:3': { cultivo: 'mandioca', dia: 1 } }`],
  ['majada basura', `p.majada = { esquilada: [1e99, -5, 'a', null] }`],
  ['entradas basura', `p.entradas = { ...p.entradas, calafate: { cantidad: 'muchos' }, 'pan-casero': null, huevo: 3, miel: { cantidad: -4 } }`],
  ['materiales basura', `p.materiales = { tronco: -5, tabla: 'x', piedra: 1e308, lana: null }`],
  ['posición basura', `p.pos = { x: 'a', y: null, z: 1e9 }; p.yaw = 'x'`],
  ['hora basura', `p.horas = 'noche'`],
  ['cosas basura', `p.cosas = { manta: 'si', harina: -2, tijera: null }`],
  ['correo basura', `p.correo = { llegadas: 'x', fotos: null }`],
  ['listas basura', `p.diario = 'hola'; p.renovales = { a: 1 }; p.talados = [null, 'x', 99999, -1]; p.chinches = 7; p.barra = 'x'`],
  ['acopio y gallineros basura', `p.acopio = { tronco: 'x' }; p.gallineros = [1]; p.feria = 'x'; p.visitas = 3`],
  ['caballo, tormenta y carpa basura', `p.caballo = 'x'; p.tormenta = { crecida: 'mucha', rayo: { i: 'x' } }; p.carpa = { x: 'a' }`],
  ['desafío dentro del Relax', `p.modo = 'desafio'; p.desafio = { noche: 'x' }`],
  ['vacía', `p = {}`, true],
  ['JSON roto', `TEXTO:'{"dia": 7, "obras": ['`, true],
  ['un número', `TEXTO:'42'`, true],
];
const CASOS_DESAFIO = [
  ['desafío basura', `p.desafio = 'x'`],
  ['desafío con campos basura', `p.desafio = { ...(p.desafio || {}), noche: 'a', salud: null, cristales: -3, planos: 'todos', aliados: 5 }`],
  ['obras del desafío en NaN', `p.obras.push({ plano: 'empalizada', x: null, z: null, rot: 0, etapas: 1, vida: 'x' }, { plano: 'adarve', x: B.x + 20, z: B.z, rot: 0, etapas: 7 })`],
];

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: false, width: 1024, height: 640, webPreferences: { backgroundThrottling: false } });
  let donde = 'carga';
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(`[${donde}] ${m.slice(0, 300)}`);
  });
  const js = (c) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 90 s (${donde})`)), 90000)),
  ]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const entrar = async () => {
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
  };
  const ajustes = (modo) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'${modo}', autoCalidad:false, guiaPrimerDia:false}));`;
  const jugar = () => js(`(async ()=>{ const H = window.__hojarasca;
    for (const t of ['KeyW', 'KeyE', 'KeyO', 'KeyT', 'KeyO', 'KeyF', 'KeyE', 'KeyM', 'Escape', 'KeyI', 'Escape']) {
      document.dispatchEvent(new KeyboardEvent('keydown', { code: t, bubbles: true }));
      for (let i = 0; i < 4; i++) { H.__bucle(); await new Promise(r => setTimeout(r, 20)); }
      document.dispatchEvent(new KeyboardEvent('keyup', { code: t, bubbles: true }));
    }
    H.guardar();
    const js = H.jugador.estado, p = js.pos, P = H.progreso;
    return { finito: [p.x, p.y, p.z, js.yaw, P.horas, P.dia].every(Number.isFinite), dia: P.dia, ramitas: P.ramitas, obras: H.obras.obras.length } })()`);

  // la partida base, de verdad: se juega un poco y se le ponen marcas
  const base = async (modo, clave) => {
    donde = `${modo}: base`;
    await abrir();
    await js(`localStorage.clear(); ${ajustes(modo)} 1`);
    await abrir(); await entrar();
    return js(`(()=>{ const H = window.__hojarasca, P = H.progreso, r = H.T.lugares.refugio;
      P.dia = 7; P.ramitas = 11;
      const cerca = [['cantero', 8, 4], ['tendal', 12, 4], ['alero', 12, 4], ['horno', 16, 8], ['buzon', 18, 4], ['bebedero', -12, 10]];
      for (const [id, dx, dz] of cerca) if (H.PLANOS.some(q => q.id === id)) P.obras.push({ plano: id, x: r.x + dx, z: r.z + dz, rot: 0, etapas: H.PLANOS.find(q => q.id === id).etapas?.length || 1 });
      H.obras.sincronizar(P.obras); P.obras = H.obras.obras.map(o => o.datos);
      H.guardar();
      return { texto: localStorage.getItem('${clave}'), B: { x: r.x, z: r.z } } })()`);
  };

  const probar = async (modo, clave, casos) => {
    const { texto, B } = await base(modo, clave);
    ok(!!texto, `${modo}: hay partida base guardada`);
    for (const [nombre, cambio, nueva] of casos) {
      donde = `${modo}: ${nombre}`;
      const antes = errores.length;
      let nuevoTexto;
      if (cambio.startsWith('TEXTO:')) nuevoTexto = JSON.parse(`"${cambio.slice(7, -1).replace(/"/g, '\\"')}"`);
      else {
        let p = JSON.parse(texto);
        // eslint-disable-next-line no-new-func
        p = new Function('p', 'B', `${cambio}; return p;`)(p, B);
        nuevoTexto = JSON.stringify(p);
      }
      try {
        await abrir();
        await js(`localStorage.clear(); ${ajustes(modo)} localStorage.setItem('${clave}', ${JSON.stringify(nuevoTexto)}); 1`);
        await abrir(); await entrar();
        const r = await jugar();
        const conserva = nueva || (r.dia === 7 && r.ramitas === 11);
        ok(r.finito && conserva && errores.length === antes, `${modo}: ${nombre} → arranca, juega${nueva ? '' : ' y conserva el día y las ramitas'} (${JSON.stringify(r)})`);
      } catch (e) {
        ok(false, `${modo}: ${nombre} → ${e.message}`);
      }
    }
  };

  try {
    await probar('relax', 'hojarasca-v1', CASOS_RELAX);
    await probar('desafio', 'hojarasca-desafio-v1', CASOS_DESAFIO);
  } catch (e) { errores.push('excepción: ' + (e && e.message ? e.message : e)); }
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});

// Partida real 4.1 F3 (Electron + WebGL): los rasgos de Bruno cambian de verdad lo que el juego calcula.
//  · sin Bruno creado, el pique de la pesca y la amistad valen lo de siempre;
//  · con un Bruno creado (Paciente + Tranquilo + Sociable + Simpático), el contexto de pesca trae un pique 20 % más corto y la amistad suma ~20 % más;
//  · con un Bruno gruñón y reservado, lo contrario (~20 % menos);
//  · lo que resta no se toca; los puntos de amistad siguen enteros; el juego recargado conserva el efecto;
//  · una noche de cielo despejado con Bruno creado corre sin errores (la mirada al cielo usa el factor del cuaderno).
// Uso (después de `node armar.mjs`): electron --no-sandbox -r <ruta>/herramientas/al-monitor.cjs -r <ruta>/herramientas/perfil-propio.cjs pruebas/humo-4-1-efectos.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.setPath('userData', path.resolve(process.env.HUMO_PERFIL || path.join(raiz, 'pruebas', 'salidas', '_perfil-humo-efectos')));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
let fallas = 0;
const ok = (c, t) => { if (c) console.log('✓ ' + t); else { fallas++; console.log('✗ ' + t); } };

setTimeout(() => { console.log('✗ se pasó del tiempo (6 minutos)'); app.exit(1); }, 6 * 60 * 1000).unref();
app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const js = (c) => w.webContents.executeJavaScript(c);
  const errores = [];
  w.webContents.on('console-message', (_e, nivel, msg) => { if (nivel >= 3) errores.push(msg); });
  const cargar = async () => {
    await w.loadFile(path.join(raiz, 'index.html'), { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.__personal && !!window.__hojarasca.__aldea').catch(() => false)) return true; }
    return false;
  };
  await cargar();
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false})); 1`);
  ok(await cargar(), 'cargó el juego (Relax, sin guía)');
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3500);
  ok(await js(`document.getElementById('inicio').classList.contains('oculto')`), 'entró al valle');

  const H = 'window.__hojarasca';
  const pique = () => js(`${H}.__aldea.mundoPesca().pique`);
  const ponerBruno = (parcial) => js(`${H}.__personal.cambiar('bruno', ${JSON.stringify(parcial)}); 1`);
  const base = { personalidad: 'curioso', oficio: 'contador', gustos: ['trenes', 'asado'], hobby: 'fotografia', virtud: 'resistente', defecto: 'distraido' };   // sin pesca ni afecto (los gustos trenes y asado no los comparte ninguno de los vecinos de la lista)

  // ---- 1. sin Bruno creado
  await ponerBruno({ ...base, creado: false });   // (el perfil puede traer un Bruno de otra corrida)
  const p0 = await pique();
  ok(typeof p0 === 'number' && p0 > 0, `el pique base es un número (${p0})`);
  await ponerBruno({ ...base, personalidad: 'tranquilo', virtud: 'paciente', creado: false });
  ok(Math.abs((await pique()) - p0) < 1e-9, 'con rasgos pero sin crear a Bruno, el pique no cambia');

  // ---- 2. Bruno paciente y tranquilo: pique 20 % más corto
  await ponerBruno({ ...base, personalidad: 'tranquilo', virtud: 'paciente', defecto: 'friolero', creado: true });
  ok(Math.abs((await pique()) - p0 * 0.8) < 1e-9, `con Tranquilo + Paciente el pique es un 20 % más corto (${await pique()} vs ${p0})`);
  await ponerBruno({ ...base, personalidad: 'metodico', virtud: 'resistente', defecto: 'impaciente', oficio: 'mensajero', creado: true });
  ok(Math.abs((await pique()) - p0 * 1.2) < 1e-9, 'con Impaciente + Metódico + Mensajero el pique es un 20 % más largo');
  await ponerBruno({ ...base, creado: true });
  ok(Math.abs((await pique()) - p0) < 1e-9, 'un Bruno sin rasgos de pesca deja el pique igual');

  // ---- 3. la amistad
  const vecinos = ['maestra', 'galesa', 'herbolaria', 'abuela', 'madre', 'nena', 'enfermera', 'tejedora', 'pintora', 'modista', 'gerente', 'ramon'];
  const gestos = async () => {
    await js(`${H}.progreso.vecindad = undefined; 1`);
    const r = [];
    for (const k of vecinos) { await js(`${H}.__rincones.amistad(${JSON.stringify(k)}, 6); 1`); r.push(await js(`${H}.progreso.vecindad.personas[${JSON.stringify(k)}].p`)); }
    return r;
  };
  await ponerBruno({ ...base, creado: false, personalidad: 'sociable', virtud: 'simpatico' });
  ok((await gestos()).every((p) => p === 6), 'sin crear a Bruno, un gesto de 6 puntos suma 6 con todos');
  await ponerBruno({ ...base, creado: true, personalidad: 'sociable', virtud: 'simpatico', gustos: ['mate', 'libros'] });
  const mas = await gestos();
  ok(mas.every((p) => p === 7 || p === 8) && mas.some((p) => p === 7) && Number.isInteger(mas[0]), `con Sociable + Simpático suma 7 u 8 (+20 %): ${mas.join(' ')}`);
  await ponerBruno({ ...base, creado: true, personalidad: 'reservado', defecto: 'grunon', gustos: ['trenes', 'asado'] });
  const menos = await gestos();
  ok(menos.every((p) => p === 4 || p === 5), `con Reservado + Gruñón suma 4 o 5 (-20 %): ${menos.join(' ')}`);
  // los gustos compartidos: libros y mate con la maestra, la galesa (mate y libros)
  await ponerBruno({ ...base, creado: true, gustos: ['libros', 'folklore'] });
  const gus = await gestos();
  ok(gus[vecinos.indexOf('maestra')] >= 6 && gus[vecinos.indexOf('ramon')] === 6, `sólo suman los gustos compartidos (maestra: ${gus[0]}, don Ramón, que no comparte: ${gus[vecinos.indexOf('ramon')]})`);

  // ---- 4. recargar: el efecto sigue
  await ponerBruno({ ...base, creado: true, personalidad: 'tranquilo', virtud: 'paciente' });
  await js(`${H}.guardar(); 1`);
  await esperar(500);
  ok(await cargar(), 'recargó');
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(3000);
  ok(Math.abs((await pique()) - p0 * 0.8) < 0.02 * p0 + 1e-9, 'después de recargar, el pique sigue acortado (el oficio puede haber movido los décimos)');

  // ---- 4b. el guardarropa en «Tu personaje»
  await js(`${H}.progreso.cosas.poncho = 0; ${H}.__personal.cambiar('personaje', { poncho: false, botas: 'cuero', gorro: true, bufanda: true, guantes: false }); ${H}.__personal.abrir('pausa'); 1`);
  await esperar(500);
  await js(`document.getElementById('personal-pestana-personaje').click(); 1`);
  await esperar(400);
  const botones = () => js(`JSON.stringify([...document.querySelectorAll('#personal-contenido .personal-segmentos button')].filter((b) => /todos los días|Liviano|lluvia|invierno|nieve/i.test(b.textContent)).map((b) => ({ t: b.textContent, off: b.disabled, on: b.getAttribute('aria-pressed') })))`).then(JSON.parse);
  let bt = await botones();
  ok(bt.length === 5, `la fila Guardarropa tiene los cinco conjuntos (${bt.map((b) => b.t).join(' | ')})`);
  ok(bt.find((b) => /todos los días/.test(b.t)).on === 'true', 'el de todos los días está puesto al arrancar');
  ok(bt.find((b) => /Abrigo de invierno/.test(b.t)).off && bt.find((b) => /lluvia/.test(b.t)).off, 'sin poncho, el de invierno y el de lluvia están bloqueados');
  await js(`[...document.querySelectorAll('#personal-contenido .personal-segmentos button')].find((b) => /Liviano/.test(b.textContent)).click(); 1`);
  await esperar(400);
  const pj = await js(`JSON.stringify(${H}.__personal.datos().personaje)`).then(JSON.parse);
  ok(pj.gorro === false && pj.bufanda === false && pj.poncho === false, 'el liviano se saca el gorro y la bufanda');
  await js(`${H}.progreso.cosas.poncho = 1; ${H}.__personal.abrir('pausa'); 1`);
  await esperar(300);
  await js(`document.getElementById('personal-pestana-bruno').click(); document.getElementById('personal-pestana-personaje').click(); 1`);
  await esperar(300);
  bt = await botones();
  ok(!bt.find((b) => /Abrigo de invierno/.test(b.t)).off && bt.find((b) => /lluvia/.test(b.t)).off, 'con el poncho se desbloquea el de invierno; el de lluvia sigue pidiendo las botas');
  await js(`[...document.querySelectorAll('#personal-contenido .personal-segmentos button')].find((b) => /Abrigo de invierno/.test(b.textContent)).click(); 1`);
  await esperar(400);
  const pj2 = await js(`JSON.stringify(${H}.__personal.datos().personaje)`).then(JSON.parse);
  ok(pj2.poncho === true && pj2.gorro === true && pj2.bufanda === true, 'el abrigo de invierno pone poncho, gorro y bufanda');
  ok(/abrigado|un escalón/.test(await js(`document.getElementById('personal-contenido').textContent`)), 'el panel dice que vas abrigado');
  await js(`${H}.__personal.cerrar(); 1`);

  // ---- 5. una noche despejada con Bruno creado: el cielo corre sin errores
  await js(`${H}.progreso.horas = 23; 1`);
  await esperar(4000);
  ok(errores.filter((m) => !/ERR_|favicon|net::/.test(m)).length === 0, `sin errores de consola (${errores.slice(0, 3).join(' | ')})`);
  ok((await js('JSON.stringify(window.__hojarascaErrores || [])')) === '[]', 'sin errores en la página');

  console.log(fallas ? `\nFALLÓ humo 4.1 efectos (${fallas})` : '\nOK humo 4.1 · los rasgos de Bruno cambian la pesca y la amistad en el juego real');
  app.exit(fallas ? 1 : 0);
});

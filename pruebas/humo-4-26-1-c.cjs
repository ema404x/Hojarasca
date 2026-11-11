// Partida real 4.26.1 (C) (Electron + WebGL): el andén, la mochila, los pedidos y los detalles.
//   1. La campana: en la Aldea (la de la estación se mueve y suena), en una parada chica y en un apeadero (la campanita del poste); el aviso de la E sólo
//      mirándola a 3 m o menos (no de espaldas, no a 4,5 m).
//   2. Los pedidos: la línea gris debajo del pedido; un vecino de confianza sin granja no pide leche ni fruta; con la vaca, la leche en la ventana siguiente.
//   3. La mochila: V tira de a uno, Mayús+V la pila; lo de la Historia no se tira; se guarda, se carga (en Baja) y E lo junta.
//   4. La ropa de cerca (capturas de frente y de espaldas) y la hojarasca con nieve (se tapa: el bloque queda sin instancias).
//   5. Baja: la mariposa (el «objeto naranja» de la plaza) de cerca, en el mismo encuadre de la 4.24.1.
//   6. El Desafío: el nombre del nivel con las perillas (portada) y la campana sin ataque (viene) y con la vía nevada (no viene).
//   Y que no se sume ningún programa de shader.
// Uso (después de `node armar.mjs`): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-humo-4-26-1-c.ps1
//   HUMO_PARTES=campana,pedidos,mochila,ropa,hojarasca,baja,desafio (todas por defecto) · HTML=<otra página> · HUMO_SALIDA=<carpeta>
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-26-1-c'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 14 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 14 * 60 * 1000).unref?.();
const PARTES = (process.env.HUMO_PARTES || 'campana,pedidos,mochila,ropa,hojarasca,baja,desafio').split(',');
const parte = (p) => PARTES.includes(p);

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, P = H.progreso;
  const N = window.__N = {};
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  H.ajustes.limiteFps = 'libre';
  N.programas = () => H.renderer.info.programs.length;
  N.tick = async (seg = 0.5) => { const t0 = performance.now(); while (performance.now() - t0 < seg * 1000) { H.__bucle(); await dormir(14); } return 1; };
  N.tecla = (code, shift = false) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, shiftKey: shift, bubbles: true, cancelable: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, shiftKey: shift, bubbles: true })); return 1; };
  N.tarjeta = () => { const v = document.getElementById('valle-tarjeta'); return !!v && !v.classList.contains('oculto'); };
  N.aviso = () => { const a = document.getElementById('aviso'); return a && !a.classList.contains('oculto') ? a.innerText.replace(/\s+/g, ' ') : ''; };
  N.notas = () => [...document.querySelectorAll('#notas .nota')].map((n) => (n.__titulo || '') + ' / ' + (n.__sub || ''));
  N.esperarNota = async (re, seg = 6) => { const r = new RegExp(re); for (let i = 0; i < seg * 4; i++) { const n = N.notas().find((x) => r.test(x)); if (n) return n; await N.tick(0.25); } return ''; };
  // el jugador a 1,4 m de la persona, mirándola
  N.alLado = (g) => { const p = g.g.position, a = g.g.rotation.y; const x = p.x + Math.sin(a) * 1.4, z = p.z + Math.cos(a) * 1.4; H.jugador.ubicar(x, z, Math.atan2(-(p.x - x), -(p.z - z))); return 1; };
  N.fundido = () => document.getElementById('fundido').classList.contains('activo');
  // el jugador a "d" metros de "b" (sobre la recta de "b" a "hacia"), mirándolo (o de espaldas) y con la vista a la altura de la campana
  N.frente = (b, hacia, d, espaldas = false) => {
    if (!b) b = { x: hacia.x + 1.5, z: hacia.z, y: 0 };
    const dx = hacia.x - b.x, dz = hacia.z - b.z, l = Math.hypot(dx, dz) || 1;
    const x = b.x + dx / l * d, z = b.z + dz / l * d;
    const yaw = Math.atan2(-(b.x - x), -(b.z - z)) + (espaldas ? Math.PI : 0);
    H.jugador.ubicar(x, z, yaw); H.jugador.estado.sentado = false; H.jugador.estado.pitch = espaldas ? 0 : 0.28;
    return { x, z };
  };
  N.tren = (o) => { const t = H.tren, e = t.est; e.subido = false; e.conduce = false; e.varado = false; e.esperaNieve = 0;
    if (o.parado) { e.s = t.poste(o.parada) % t.largo; e.parado = o.parado; e.vel = 0; e.proxima = o.parada; }
    else { e.s = (t.poste(o.parada) + o.metros) % t.largo; e.parado = 0; e.vel = 7; const i = t.paradas.indexOf(o.parada); e.proxima = t.paradas[(i + 1) % t.paradas.length]; }
    return 1; };
  // el lugar a "d" metros de la campana con el piso libre (sin pared en el medio), el más cercano a la recta hacia "hacia"
  N.libre = (b, hacia, d) => { const a0 = Math.atan2(hacia.x - b.x, hacia.z - b.z); for (let k = 0; k < 16; k++) { const a = a0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * Math.PI / 8;
    const x = b.x + Math.sin(a) * d, z = b.z + Math.cos(a) * d; if (!(H.col && H.col.paredEntre && H.col.paredEntre(b.x, b.z, x, z, b.y - 1.2))) return { x, z }; } return hacia; };
  // la aldea con todos sus vecinos (como la auditoría visual: los locales abiertos y los pobladores en su casa)
  N.aldeaEntera = () => { const A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return 0; const a = P.aldea;
    const L = { carpintero: 'carpinteria', veterinaria: 'veterinaria', panadera: 'panaderia', herbolaria: 'herboristeria', herrero: 'herreria', modista: 'costureria', pescador: 'pescaderia', botera: 'varadero', maestra: 'escuela', pintora: 'taller-arte', enfermera: 'puesto-sanitario', andinista: 'refugio-andinista', telegrafista: 'estafeta', fotografa: 'estudio-fotos', tejedora: 'hilanderia', ceramista: 'ceramica', apicultor: 'sala-miel', astronoma: 'observatorio', guardaparque: 'seccional', musico: 'salon' };
    const ks = Object.keys(L).filter((k) => A.estadoEdificio(L[k]));
    a.pobladores = ks.map((clave) => ({ clave, dia: 1 })); a.obras = {}; a.locales = Object.fromEntries(ks.map((k) => [L[k], 1])); a.descubierta = 1; a.llegando = null;
    A.actualizar(4, H.camara.position); return ks.length; };
  N.campanaAldea = () => { const M = H.__mecanicas && H.__mecanicas(); return M && M.dondeCampana ? M.dondeCampana() : null; };
  N.charla = () => ({ abierta: !document.getElementById('charla').classList.contains('oculto'), texto: document.getElementById('charla-texto').textContent,
    pie: document.getElementById('charla-pie') ? document.getElementById('charla-pie').textContent : null, pieVisible: !!document.getElementById('charla-pie') && !document.getElementById('charla-pie').classList.contains('oculto'),
    pieColor: document.getElementById('charla-pie') ? getComputedStyle(document.getElementById('charla-pie')).color : null });
  N.npc = (k) => H.gente.gente.find((g) => (g.claveAldea || g.clave) === k);
  N.ranura = async (re) => { for (let i = 1; i <= 8; i++) { N.tecla('Digit' + i); await N.tick(0.08); if (re.test(H.__ranuraActual())) return H.__ranuraActual(); } return ''; };
  N.soto = (nombre) => { let n = -1; H.escena.traverse((o) => { if (o.name === 'soto-' + nombre) n = Math.max(n, o.count); }); return n; };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [], consola = [];
  const { ipcMain } = require('electron');
  require(path.join(raiz, 'copias-main.cjs')).registrarCopias({ ipcMain, app });
  require(path.join(raiz, 'fotos-main.cjs')).registrarFotos({ ipcMain, app });
  const w = new BrowserWindow({ show: true, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false, preload: path.join(raiz, 'preload.cjs') } });
  w.setContentSize(ANCHO, ALTO);
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { consola.push(m.slice(0, 300)); errores.push(m.slice(0, 200)); }
  });
  w.webContents.on('render-process-gone', (e, d) => console.log('  PROCESO DE LA PÁGINA CAÍDO:', JSON.stringify(d)));
  let donde = 'carga';
  const js = (c, espera = 120000) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en ${espera / 1000} s (${donde})`)), espera))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const N = (c) => js(`(async () => { const H = window.__hojarasca, N = window.__N, P = H.progreso, t = H.tren; return (${c}); })()`);
  const url = process.env.HTML ? path.resolve(process.env.HTML) : path.join(raiz, 'index.html');
  const foto = async (nombre) => {
    for (let intento = 0; intento < 3; intento++) try {
      await esperar(700 + intento * 600);
      const img = await w.webContents.capturePage();
      fs.writeFileSync(path.join(salida, nombre + '.png'), img.toPNG());
      console.log(`  (captura ${nombre}.png)`);
      return;
    } catch (e) { if (intento === 2) console.log(`  (captura ${nombre} no se pudo: ${e && e.message})`); }
  };
  const ajustes = (o) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({calidad:'media', clima:'despejado', musica:false, modo:'relax', relaxTipo:'libre', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'}, ${JSON.stringify(o)}))); 1`;
  const esperarJuego = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false)) return true; } return false; };
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000);
    await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
    await N('N.tick(2)');
    for (let k = 0; k < 6 && (await N('N.tarjeta()')); k++) { await N('(() => { const b = document.querySelector("#valle-tarjeta button[data-valle-opcion]"); if (b) b.click(); return 1 })()'); await N('N.tick(0.6)'); }
  };
  // abre la página con estos ajustes; `limpiar`: partida nueva (borra lo guardado)
  const abrir = async (o, limpiar) => {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`${limpiar ? 'localStorage.clear(); ' : ''}${ajustes(o)}`);
    await w.loadFile(url, { search: '?debug=1' });
    await js('window.__sinPausaPorBlur = true; 1');
    if (!(await esperarJuego())) throw new Error('el juego no cargó');
  };
  const seccion = async (nombre, fn) => {
    if (!parte(nombre)) return;
    donde = nombre;
    try { await fn(); } catch (err) { console.log('ERROR en', nombre + ':', err && err.stack || err); errores.push(`${nombre}: ${err && err.message || err}`); }
    await js(`(() => { const H = window.__hojarasca; if (H) H.__camaraFija = null; return 1 })()`).catch(() => 0);
    console.log('  (programas después de «' + nombre + '»: ' + (await js('window.__hojarasca.renderer.info.programs.length').catch(() => '?')) + ')');
    const fallas = await js('(() => { const C = window.__hojarasca && window.__hojarasca.__caidas; return C && C.fallas ? JSON.stringify(C.fallas()).slice(0, 600) : "" })()').catch(() => '');
    if (fallas && fallas !== '[]') { console.log('  FALLAS DEL JUEGO: ' + fallas); errores.push(nombre + ': fallas del juego ' + fallas.slice(0, 200)); }
  };
  let prog0 = 0;
  try {
    const relax = PARTES.some((p) => ['campana', 'pedidos', 'mochila', 'ropa', 'hojarasca', 'baja'].includes(p));
    if (relax) {
      await abrir({ calidad: parte('campana') || parte('pedidos') || parte('mochila') || parte('ropa') ? 'media' : 'baja' }, true);
      await entrar();
      await N('(() => { H.clima.estado.lluvia = 0; P.dia = 30; P.horas = 11; return 1 })()');
      console.log('  locales abiertos:', await N('N.aldeaEntera()'));
      await N('N.tick(3)');
      prog0 = await N('N.programas()');
      console.log('  programas al empezar:', prog0);
    }

    // ---------------------------------------------------------------- 1. la campana
    await seccion('campana', async () => {
      console.log('— 1. la campana: en la Aldea, en una parada chica y en un apeadero');
      const aldea = await N('(() => { const p = t.paradas.find((q) => q.aldea); return p ? { nombre: p.nombre, campana: N.campanaAldea() } : null })()');
      ok(aldea && aldea.campana, `la Aldea tiene su andén y la campana de la estación está armada (${JSON.stringify(aldea && aldea.campana)})`);
      if (aldea && aldea.campana) {
        await N('N.tren({ parada: t.paradas.find((q) => q.aldea), metros: 60 })');
        // de lejos (4,5 m), de espaldas y de cerca mirándola
        await N('(() => { const b = N.campanaAldea(); N.hacia = N.libre(b, t.paradas.find((q) => q.aldea).anden, 2.2); return 1 })()');
        await N('N.frente(N.campanaAldea(), N.hacia, 4.5)'); await N('N.tick(0.6)');
        const lejos = await N('N.aviso()');
        await N('N.frente(N.campanaAldea(), N.hacia, 2.2, true)'); await N('N.tick(0.6)');
        const espaldas = await N('N.aviso()');
        await N('N.frente(N.campanaAldea(), N.hacia, 2.2)'); await N('N.tick(0.8)');
        const cerca = await N('N.aviso()');
        ok(!/campana/.test(lejos) && !/campana/.test(espaldas), `a 4,5 m o de espaldas no se ofrece («${lejos}» / «${espaldas}»)`);
        ok(/Tocar la campana del andén/.test(cerca), `mirándola a 2,2 m sí («${cerca}»)`);
        await foto('1a-aldea-aviso');
        // con el tren parado en otra parada: suena y se mueve, sin fundido (para verla moverse)
        await N('N.tren({ parada: t.paradas.find((q) => !q.aldea), parado: 50 })'); await N('N.tick(0.3)');
        const antes = await N('H.__mecanicas().medir().campanadas');
        await N('N.tecla("KeyE")'); await N('N.tick(0.25)');
        const m = await N('(() => { const M = H.__mecanicas(), a = M.animables().campana; return { campana: M.medir().campana, campanadas: M.medir().campanadas, w: a ? a.objeto.quaternion.w : null } })()');
        ok(m.campana > 2 && m.w !== null && m.w < 0.999, `la campana de la estación se mueve (quedan ${m.campana.toFixed(1)} s de vaivén, giro w=${m.w && m.w.toFixed(4)})`);
        ok(m.campanadas === antes + 1, `y suena la suya, la de cuando llega el tren (campanadas ${antes} → ${m.campanadas})`);
        const np = await N('N.esperarNota("está parada en", 3)');
        ok(!!np, 'y dice dónde está la trochita («' + np + '»)');
        await foto('1b-aldea-tocada');
        // y con el tren lejos, la trochita viene
        await N('N.tren({ parada: t.paradas.find((q) => q.aldea), metros: 60 })'); await N('N.tick(3.5)');
        await N('N.frente(N.campanaAldea(), N.hacia, 2.2)'); await N('N.tick(0.8)');
        await N('N.tecla("KeyE")'); await N('N.tick(0.3)');
        const fa = await N('N.fundido()'), na = await N('N.esperarNota("^Tocaste la campana del andén")');
        ok(fa && !!na, 'y con el tren lejos la trochita viene (fundido ' + fa + '; «' + na + '»)');
        await N('N.tick(2)');
      }
      for (const [cual, sel] of [['estacion', '(q) => q === t.estacion'], ['chica', '(q) => q.chica && !q.aldea && !q.apeadero'], ['apeadero', '(q) => q.apeadero']]) {
        const p = await N(`(() => { const p = t.paradas.find(${sel}); return p ? { nombre: p.nombre, campana: p.campana } : null })()`);
        ok(p && p.campana && Number.isFinite(p.campana.x), `${cual}: «${p && p.nombre}» tiene su campanita en el poste (${JSON.stringify(p && p.campana)})`);
        if (!p) continue;
        await N(`N.tren({ parada: t.paradas.find(${sel}), metros: 60 })`);
        await N(`N.frente(t.paradas.find(${sel}).campana, t.paradas.find(${sel}).anden, 4.5)`); await N('N.tick(0.6)');
        const lejos = await N('N.aviso()');
        await N(`N.frente(t.paradas.find(${sel}).campana, t.paradas.find(${sel}).anden, 2, true)`); await N('N.tick(0.6)');
        const espaldas = await N('N.aviso()');
        await N(`N.frente(t.paradas.find(${sel}).campana, t.paradas.find(${sel}).anden, 2)`); await N('N.tick(0.8)');
        const cerca = await N('N.aviso()');
        ok(!/campana/.test(lejos) && !/campana/.test(espaldas) && /Tocar la campana del andén/.test(cerca), `${cual}: el aviso sólo mirándola de cerca («${lejos}» / «${espaldas}» / «${cerca}»)`);
        await foto(`1c-${cual}-campana`);
        await N('N.tecla("KeyE")'); await N('N.tick(0.3)');
        ok(!!(await N('N.esperarNota("^Tocaste la campana del andén")')), `${cual}: la E la toca y la trochita viene`);
        await N('N.tick(2)');
        // una toma de lejos, para ver la campanita en el poste
        await N(`N.frente(t.paradas.find(${sel}).campana, t.paradas.find(${sel}).anden, 4.4)`); await N('(() => { H.jugador.estado.pitch = 0.12; return 1 })()'); await N('N.tick(0.6)');
        await foto(`1d-${cual}-poste`);
      }
    });

    // ---------------------------------------------------------------- 2. los pedidos
    await seccion('pedidos', async () => {
      console.log('— 2. los pedidos: la línea gris, sin granja no pide leche ni fruta, con la vaca sí (en la ventana siguiente)');
      const prep = await N(`(() => {
        if (!P.economia) return 'sin economía';
        P.economia.pesos = 0;
        const n = P.negocios || (P.negocios = {}); n.rep = n.rep || {}; n.pedidos = {}; n.fijos = {}; n.cajas = n.cajas || {};
        n.rep.panadera = 20; n.rep.maestra = 20;
        if (P.granja) P.granja.vaca = null;
        const hay = ['panadera', 'maestra'].map((k) => !!N.npc(k));
        return hay.join(',');
      })()`);
      console.log('  vecinos a mano (panadera, maestra):', prep);
      ok(prep === 'true,true', 'la panadera y la maestra están en la aldea');
      const pedido = async (k, dia) => {
        await N(`(() => { P.dia = ${dia}; P.horas = 11; N.alLado(N.npc('${k}')); return 1 })()`); await N('N.tick(0.4)');
        await N(`(() => { H.hablar(N.npc('${k}')); return 1 })()`); await N('N.tick(0.3)');
        for (let i = 0; i < 4 && !(await N('H.__rueda().abierta')); i++) { await N('N.tecla("KeyE")'); await N('N.tick(0.25)'); }
        const rueda = await N('H.__ruedaPlana()');
        const eligio = await N('H.__elegirEnRueda("¿Qué tenés para hoy?")'); await N('N.tick(0.3)');
        if (!eligio) console.log('  (' + k + ': la rueda dice ' + JSON.stringify(rueda) + ')');
        const vistos = [];
        for (let i = 0; i < 6; i++) { const c = await N('N.charla()'); vistos.push(c); if (/necesit/i.test(c.texto) || !c.abierta) break; await N('N.tecla("KeyE")'); await N('N.tick(0.25)'); }
        const c = vistos.find((v) => /necesit/i.test(v.texto)) || vistos[vistos.length - 1] || {};
        return { eligio, ...c };
      };
      const cerrar = async () => { for (let i = 0; i < 8 && (await N('N.charla().abierta')); i++) { await N('N.tecla("Escape")'); await N('N.tick(0.2)'); } };
      // la maestra (su lista: papa, pan casero, frasco de frutilla y manzana) en cuatro ventanas: nunca la manzana
      const vistosM = [];
      for (const dia of [19, 22, 25, 28]) { const c = await pedido('maestra', dia); vistosM.push(c.texto); await cerrar(); }
      console.log('  la maestra:', JSON.stringify(vistosM));
      ok(vistosM.every((x) => !/manzana|leche/i.test(x)) && vistosM.some((x) => /necesit/i.test(x)), 'sin granja la maestra no pide fruta (ni leche) en cuatro ventanas');
      const c1 = await pedido('panadera', 19);
      console.log(`  la panadera, día 19 sin vaca: «${c1.texto}» · gris: «${c1.pie}» (${c1.pieColor})`);
      ok(/necesit/i.test(c1.texto) && !/leche/i.test(c1.texto), 'sin vaca la panadera no pide leche');
      ok(c1.pieVisible && c1.pie === 'Sólo pide lo que se consigue: lo del valle, lo de los puestos que conocés o lo que producís vos.', 'debajo del pedido, la línea de la regla');
      ok(/rgb\((1[2-4]\d), (1[2-4]\d), (1[1-3]\d)\)/.test(c1.pieColor || ''), `y es gris (${c1.pieColor})`);
      await foto('2a-pedido-linea-gris');
      await cerrar();
      ok(!(await N('N.charla().pieVisible')), 'la línea no queda colgada al cerrar');
      await N('(() => { if (!P.granja) return 0; P.granja.vaca = { id: 77, pelaje: "negra", desde: 19, ordenada: 0, lugar: null }; return 1 })()');
      const c2 = await pedido('panadera', 20); await cerrar();
      ok(/necesit/i.test(c2.texto) && !/leche/i.test(c2.texto), `con la vaca recién llegada, en la misma ventana no cambia de idea («${c2.texto}»)`);
      const c3 = await pedido('panadera', 22);
      ok(/leche/i.test(c3.texto), `en la ventana siguiente pide leche («${c3.texto}»)`);
      await foto('2b-pedido-leche');
      await cerrar();
      await N('(() => { if (P.granja) P.granja.vaca = null; P.dia = 30; return 1 })()');
    });

    // ---------------------------------------------------------------- 3. la mochila (antes de guardar)
    let bultoGuardado = null;
    await seccion('mochila', async () => {
      console.log('— 3. la mochila: V de a uno, Mayús+V la pila, lo de la Historia no');
      await N('(() => { const L = H.T.lugares.refugio; H.jugador.ubicar(L.x + 9, L.z + 9, 0.6); P.ramitas = 6; P.cosas = P.cosas || {}; P.cosas["llave-molino"] = 1; return 1 })()');
      await N('N.tick(0.8)');
      const r = await N('N.ranura(/ramita/i)');
      ok(/ramita/i.test(r), `en la mano: «${r}»`);
      const items0 = await N('H.objetos.items.length');
      await N('N.tecla("KeyV")'); await N('N.tick(0.4)');
      const r1 = await N('({ ramitas: P.ramitas, items: H.objetos.items.length, bultos: (H.objetos.bultos() || []).length })');
      ok(r1.ramitas === 5 && r1.items === items0 + 1, `V tira una (ramitas ${r1.ramitas}, objetos en el piso ${items0} → ${r1.items})`);
      await N('N.tecla("KeyV", true)'); await N('N.tick(0.4)');
      const r2 = await N('({ ramitas: P.ramitas, bultos: (H.objetos.bultos() || []).map((b) => ({ id: b.id || (b.carga && b.carga.id), n: b.n || (b.carga && b.carga.n), x: b.x, z: b.z })) })');
      const b = r2.bultos.find((q) => q.n === 5) || r2.bultos[r2.bultos.length - 1];
      ok(r2.ramitas === 0 && !!b, `Mayús+V tira la pila en un bulto (ramitas ${r2.ramitas}, bultos ${JSON.stringify(r2.bultos)})`);
      bultoGuardado = b || null;
      await foto('3a-tiradas');
      const h = await N('N.ranura(/llave del molino/i)');
      ok(/llave/i.test(h), `lo de la Historia en la mano: «${h}»`);
      await N('N.tecla("KeyV")'); await N('N.tick(0.4)');
      const nh = await N('N.notas()');
      ok((await N('P.cosas["llave-molino"]')) === 1 && nh.some((x) => /Es de la Historia/.test(x)), `no se tira (${JSON.stringify(nh.slice(-1))})`);
      await N('N.tecla("KeyV", true)'); await N('N.tick(0.3)');
      ok((await N('P.cosas["llave-molino"]')) === 1, 'ni con Mayús+V');
      ok(await N('H.guardar() !== false'), 'se guarda');
    });

    // ---------------------------------------------------------------- 4. la ropa de cerca
    await seccion('ropa', async () => {
      console.log('— 4. la ropa de cerca (chaleco, campera, delantal y pantalón)');
      const lugar = await N(`(() => {
        const T = H.T, L = T.lugares.refugio, ar = H.veg.arboles.filter((q) => !q.sacado && !q.caido); let s = null;
        for (let r = 30; r < 200 && !s; r += 3) for (let a = 0; a < 6.28 && !s; a += 0.2) { const x = L.x + Math.cos(a) * r, z = L.z + Math.sin(a) * r;
          if (T.agua(x, z) || 1 - T.normal(x, z).y > 0.02 || ar.some((q) => Math.hypot(q.x - x, q.z - z) < 12)) continue; s = { x, z }; }
        if (s) { H.jugador.ubicar(s.x + 6, s.z + 6, 0); window.__N.claro = s; }
        P.horas = 12; return s })()`);
      ok(!!lugar, 'un claro para mirarlos');
      await N('N.tick(1.5)');
      await N('(() => { if (!H.gente.__orig) { H.gente.__orig = H.gente.actualizar; H.gente.actualizar = () => 0; } return 1 })()');
      for (const k of ['poblador-carpintero', 'poblador-herrero', 'poblador-musico', 'guarda', 'aldea-jefe', 'poblador-panadera', 'tobias', 'poblador-guardaparque']) {
        for (const [lado, giro] of [['frente', 0], ['espalda', Math.PI]]) {
          const hay = await N(`(() => { const T = H.T, s = N.claro, g = H.gente.gente.find((q) => q.clave === '${k}'); if (!g) return false;
            for (const q of H.gente.gente) q.g.visible = q === g;
            const a = 0.7; g.g.position.set(s.x, T.altura(s.x, s.z), s.z); g.g.rotation.y = a + ${giro}; g.rumbo = a + ${giro}; g.rumboObjetivo = a + ${giro};
            H.__camaraFija = { x: s.x + Math.sin(a) * 2.4, y: T.altura(s.x, s.z) + 1.25, z: s.z + Math.cos(a) * 2.4, yaw: a, pitch: -0.06 };
            return true })()`);
          if (!hay) { console.log(`  (${k}: no está)`); break; }
          // (la pose y el rumbo se vuelven a fijar en cada cuadro: algo más que la gente los gira hacia vos)
          for (let i = 0; i < 10; i++) { await N(`(() => { const g = H.gente.gente.find((q) => q.clave === '${k}'), a = 0.7 + ${giro}; g.g.rotation.y = a; g.rumbo = a; g.rumboObjetivo = a; return 1 })()`); await N('N.tick(0.05)'); }
          if (lado === 'frente') console.log('  (' + k + ': ' + (await N(`H.gente.gente.find((q) => q.clave === '${k}').nombre`)) + ')');
          await foto(`4-ropa-${k.replace(/^(poblador|aldea)-/, '')}-${lado}`);
        }
      }
      await N('(() => { for (const q of H.gente.gente) q.g.visible = true; if (H.gente.__orig) { H.gente.actualizar = H.gente.__orig; delete H.gente.__orig; } H.__camaraFija = null; return 1 })()');
    });

    // ---------------------------------------------------------------- 5. la hojarasca con nieve
    await seccion('hojarasca', async () => {
      console.log('— 5. la hojarasca con nieve');
      const a = await N(`(() => { const L = H.T.lugares.refugio; const a = H.veg.arboles.filter((q) => !q.sacado && !q.caido).sort((p, q) => Math.hypot(p.x - L.x - 14, p.z - L.z - 10) - Math.hypot(q.x - L.x - 14, q.z - L.z - 10))[0];
        H.jugador.ubicar(a.x + 7, a.z + 7, Math.atan2(7, 7)); H.jugador.estado.pitch = -0.42; P.horas = 15.5; return { x: a.x, z: a.z } })()`);
      await N('N.tick(2)');
      const verano = await N('({ h0: N.soto("hojarasca0"), h1: N.soto("hojarasca1") })');
      await foto('5a-hojarasca-verano');
      await N('(() => { H.ajustes.estacion = "invierno"; return 1 })()');
      let inv = null;
      for (let i = 0; i < 20; i++) { await N('N.tick(1)'); inv = await N('({ h0: N.soto("hojarasca0"), h1: N.soto("hojarasca1") })'); if (inv.h0 === 0 && inv.h1 === 0) break; }
      console.log(`  instancias de hojarasca a la vista: verano ${JSON.stringify(verano)} · invierno ${JSON.stringify(inv)}`);
      ok(verano.h0 + verano.h1 > 0, 'en verano el piso del bosque tiene su hojarasca');
      ok(inv && inv.h0 === 0 && inv.h1 === 0, 'con nieve plena la hojarasca queda tapada (sin instancias: ni se dibuja)');
      await foto('5b-hojarasca-nieve');
      await N('(() => { H.ajustes.estacion = "verano"; return 1 })()');
      let vuelve = null;
      for (let i = 0; i < 20; i++) { await N('N.tick(1)'); vuelve = await N('({ h0: N.soto("hojarasca0"), h1: N.soto("hojarasca1") })'); if (vuelve.h0 + vuelve.h1 > 0) break; }
      ok(vuelve && vuelve.h0 + vuelve.h1 > 0, `y vuelve con el verano (${JSON.stringify(vuelve)})`);
    });

    if (relax) {
      const prog = await js('window.__hojarasca.renderer.info.programs.length').catch(() => prog0);
      console.log(`  programas de shader en Media: ${prog0} → ${prog} (la 4.26.0 con el mismo recorrido: 104 → 105)`);
    }

    // ---------------------------------------------------------------- 6. Baja: cargar, juntar con E y la mariposa de la plaza
    await seccion('baja', async () => {
      console.log('— 6. Baja: se carga lo guardado, E junta el bulto, y la mariposa de la plaza');
      if (parte('mochila')) {
        await abrir({ calidad: 'baja' }, false);
        await entrar();
        const r = await N('({ ramitas: P.ramitas, bultos: (H.objetos.bultos() || []).map((b) => ({ n: b.n || (b.carga && b.carga.n), x: b.x, z: b.z })), llave: P.cosas["llave-molino"] })');
        ok(r.ramitas === 0 && r.bultos.some((b) => b.n === 5) && r.llave === 1, `después de cargar: el bulto sigue en el piso y la llave en la mochila (${JSON.stringify(r)})`);
        const b = r.bultos.find((q) => q.n === 5);
        if (b) {
          await N(`(() => { H.jugador.ubicar(${b.x} + 1.1, ${b.z} + 0.4, Math.atan2(1.1, 0.4)); H.jugador.estado.pitch = -0.75; return 1 })()`);
          await N('N.tick(1)');
          const av = await N('N.aviso()');
          await foto('6a-bulto-aviso');
          const avisos = [av];
          for (let i = 0; i < 4 && (await N('(H.objetos.bultos() || []).length')) > 0; i++) { await N('N.tecla("KeyE")'); await N('N.tick(0.6)'); avisos.push(await N('N.aviso()')); }
          const r2 = await N('({ ramitas: P.ramitas, bultos: (H.objetos.bultos() || []).length })');
          ok(r2.ramitas === 6 && r2.bultos === 0, 'E junta la ramita suelta y el bulto (avisos ' + JSON.stringify(avisos) + '; ramitas ' + r2.ramitas + ', bultos ' + r.bultos.length + ' → ' + r2.bultos + ')');
        }
      } else { await abrir({ calidad: 'baja' }, true); await entrar(); }
      const progB = await N('N.programas()');
      // la plaza, en el encuadre de la 4.24.1 (a3-plaza-dia), con una mariposa a 1,8 m de la cámara, abajo a la izquierda (donde estaba «el objeto naranja»)
      const q = await N(`(() => { const A = H.__aldeaMundo && H.__aldeaMundo(); if (!A) return null; const s = A.estadoEdificio('plaza').sitio; const fx = Math.sin(s.rot), fz = Math.cos(s.rot);
        const x = s.x + fx * 16, z = s.z + fz * 16, yaw = Math.atan2(fx, fz), y = H.T.altura(x, z) + 1.65;
        H.jugador.ubicar(x, z, yaw); P.horas = 12.5; H.clima.estado.lluvia = 0;
        H.__camaraFija = { x, y, z, yaw, pitch: 0.03 };
        const ms = H.bichos._debug.mariposas; const f = { x: -Math.sin(yaw), z: -Math.cos(yaw) }, d = { x: Math.cos(yaw), z: -Math.sin(yaw) };
        window.__N.mariposa = { x: x + f.x * 1.8 - d.x * 0.62, y: y - 0.36, z: z + f.z * 1.8 - d.z * 0.62 };
        for (const m of ms) { m.suerte = 1; }
        return { x, z, yaw } })()`);
      ok(!!q, 'la plaza de la aldea');
      const fijar = `(() => { const m = H.bichos._debug.mariposas[0], p = N.mariposa; m.pos.set(p.x, p.y, p.z); m.obj.set(p.x, p.y, p.z); m.t = 99; return 1 })()`;
      for (let i = 0; i < 30; i++) { await N(fijar); await N('N.tick(0.05)'); }
      const vis = await N('(() => { const m = H.bichos._debug.mariposas[0]; const q = m.g.position.clone().project(H.camara); let enEscena = false; for (let o = m.g; o; o = o.parent) if (o === H.escena) enEscena = true; const ala = m.alas[0].children[0]; return { visible: m.g.visible, enEscena, pos: m.g.position.toArray().map((v) => +v.toFixed(2)), cam: H.camara.position.toArray().map((v) => +v.toFixed(2)), pantalla: [Math.round((q.x + 1) / 2 * innerWidth), Math.round((1 - q.y) / 2 * innerHeight), +q.z.toFixed(3)], alas: m.alas.map((a) => +a.rotation.z.toFixed(2)), ala: ala ? { vis: ala.visible, capas: ala.layers.mask, vert: ala.geometry.attributes.position.count, color: !!ala.geometry.attributes.color, mat: ala.material.type, vc: ala.material.vertexColors, escala: m.g.scale.toArray() } : null } })()');
      console.log('  la mariposa:', JSON.stringify(vis));
      ok(vis.visible, `la mariposa está a la vista (${JSON.stringify(vis)})`);
      await foto('6b-plaza-mariposa-baja');
      // de más cerca, para verle el dibujo
      await N(`(() => { const p = N.mariposa; N.mariposa = { x: p.x, y: p.y, z: p.z }; const c = H.__camaraFija; const dx = p.x - c.x, dz = p.z - c.z, l = Math.hypot(dx, dz); H.__camaraFija = { x: p.x - dx / l * 0.45, y: p.y + 0.12, z: p.z - dz / l * 0.45, yaw: Math.atan2(-dx, -dz), pitch: -0.25 }; return 1 })()`);
      for (let i = 0; i < 12; i++) { await N(fijar); await N('N.tick(0.05)'); }
      await foto('6c-mariposa-de-cerca-baja');
      const progB2 = await N('N.programas()');
      console.log(`  programas de shader en Baja con la mariposa a la vista: ${progB} → ${progB2} (la 4.26.0, con la suya: 91 → 92)`);
      await N('(() => { H.__camaraFija = null; return 1 })()');
    });

    // ---------------------------------------------------------------- 7. el Desafío: el nivel y la campana
    await seccion('desafio', async () => {
      console.log('— 7. el Desafío: el nombre del nivel y la campana');
      await abrir({ calidad: 'media', modo: 'desafio', dificultad: 'normal', perillaCantidad: 0, perillaVida: 0, perillaDano: 0, estacion: 'invierno' }, true);
      const nivel = () => js(`[...document.querySelectorAll('[data-nivel-noche]')].map((e) => ({ t: e.textContent, ve: e.offsetParent !== null }))`);
      const clic = (sel) => js(`(()=>{ const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`);
      const n0 = await nivel();
      console.log('  en la portada:', JSON.stringify(n0));
      ok(n0.some((e) => e.ve && e.t === 'Nivel de la noche: Normal (3 de 5).'), 'Normal sin perillas: «Normal (3 de 5)»');
      for (const k of ['perillaCantidad', 'perillaVida', 'perillaDano']) await clic(`[data-ajuste="${k}"] [data-valor="2"]`);
      await esperar(300);
      const n1 = await nivel();
      ok(n1.some((e) => e.ve && e.t === 'Nivel de la noche: Implacable (5 de 5).'), `Normal con todo en +2: ${JSON.stringify(n1.map((e) => e.t))}`);
      await foto('7a-portada-nivel-implacable');
      for (const k of ['perillaCantidad', 'perillaVida', 'perillaDano']) await clic(`[data-ajuste="${k}"] [data-valor="-2"]`);
      await esperar(300);
      const n2 = await nivel();
      ok(n2.some((e) => e.ve && e.t === 'Nivel de la noche: Tranquila (1 de 5).'), `Normal con todo en −2: ${JSON.stringify(n2.map((e) => e.t))}`);
      await clic('[data-ajuste="perillaCantidad"] [data-valor="1"]'); await clic('[data-ajuste="perillaVida"] [data-valor="0"]'); await clic('[data-ajuste="perillaDano"] [data-valor="0"]');
      await esperar(300);
      const n3 = await nivel();
      console.log('  Normal con la cantidad en +1:', JSON.stringify(n3.map((e) => e.t)));
      ok(n3.some((e) => e.ve && /^Nivel de la noche: (Normal|Dura) \([34] de 5\)\.$/.test(e.t)), 'una sola perilla lo corre a lo sumo un escalón');
      await foto('7b-portada-nivel-una');
      for (const k of ['perillaCantidad', 'perillaVida', 'perillaDano']) await clic(`[data-ajuste="${k}"] [data-valor="0"]`);
      // la campana en el Desafío: sin ataque viene; con la vía nevada, no
      await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3500);
      await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
      await N('N.tick(2)');
      const D = await N('({ desafio: P.modo, ataque: !!(H.desafio && H.desafio.hayAtaque && H.desafio.hayAtaque()), paradas: t.paradas.length })');
      console.log('  Desafío:', JSON.stringify(D));
      const sel = '(q) => !q.aldea && q.campana';
      await N(`(() => { P.horas = 11; return 1 })()`);
      await N(`N.tren({ parada: t.paradas.find(${sel}), metros: 60 })`);
      await N(`N.frente(t.paradas.find(${sel}).campana, t.paradas.find(${sel}).anden, 2)`); await N('N.tick(0.8)');
      const av = await N('N.aviso()');
      ok(!D.ataque && /Tocar la campana del andén/.test(av), `sin ataque, mirándola: «${av}»`);
      await N('N.tecla("KeyE")'); await N('N.tick(0.3)');
      const fund = await N('N.fundido()'), nd = await N('N.esperarNota("^Tocaste la campana del andén", 8)');
      ok(fund && !!nd, 'la E la toca y la trochita viene (fundido ' + fund + '; «' + nd + '»)');
      await N('N.tick(2)');
      // la vía nevada adelante del tren que viene: se planta y espera a la cuadrilla
      await N(`(() => { const p = t.paradas.find(${sel}); N.tren({ parada: t.paradas[(t.paradas.indexOf(p) - 1 + t.paradas.length) % t.paradas.length], metros: 30 }); const s0 = t.est.s + 5.2; t.taparVia([{ desde: (s0 + 0.6) % t.largo, hasta: (s0 + 40) % t.largo }]); return 1 })()`);
      await N('N.tick(1.5)');
      await N(`N.frente(t.paradas.find(${sel}).campana, t.paradas.find(${sel}).anden, 2)`); await N('N.tick(0.6)');
      const s1 = await N('({ s: t.est.s, nieve: t.est.esperaNieve })');
      await N('N.tecla("KeyE")'); await N('N.tick(0.4)');
      const fund2 = await N('N.fundido()');
      const nn = await N('N.notas()');
      ok(s1.nieve > 0 && !fund2 && nn.some((x) => /tapada de nieve/.test(x)), `con la vía nevada no viene (espera de la cuadrilla ${s1.nieve.toFixed(1)} s; ${JSON.stringify(nn.slice(-1))})`);
      await foto('7c-desafio-nieve');
      await N('t.taparVia(null)');
    });
  } catch (err) {
    console.log('ERROR:', err && err.stack || err);
    errores.push(String(err && err.message || err));
  }
  if (consola.length) console.log('consola:', consola.slice(0, 6));
  console.log(errores.length ? `\n${errores.length} problemas:\n${errores.map((e) => '  · ' + e).join('\n')}` : '\nTodo en orden');
  try { app.exit(errores.length ? 1 : 0); } catch { process.exit(errores.length ? 1 : 0); }
});

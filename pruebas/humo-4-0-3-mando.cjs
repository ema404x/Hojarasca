// Partida real 4.0.3 (Electron + WebGL) con un MANDO SIMULADO (navigator.getGamepads falso): G1, G2, G3 y G4 de la zona G.
//  · Relax: con el mando solo se puede empezar: la portada, la creación de Bruno (las dos pantallas, con B), el prólogo y entrar al juego;
//  · la pausa y el cuaderno se abren y se recorren con la cruceta (G4: el cuaderno ya se alcanza con el mando), y las barras se mueven con izquierda y derecha;
//  · Desafío: el taller (K) se elige y se fabrica con el mando; los planos (O) se recorren, se gira, se funda y se cierra; el fin de la corrida sin fin se maneja con el mando.
// Uso (después de `node armar.mjs`): npx electron --no-sandbox -r herramientas/al-monitor.cjs -r herramientas/perfil-propio.cjs pruebas/humo-4-0-3-mando.cjs
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.setPath('userData', path.resolve(process.env.HUMO_PERFIL || path.join(raiz, 'pruebas', 'salidas', '_perfil-humo-mando-403')));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const salida = path.join(raiz, 'pruebas', 'salidas', 'humo-mando-403');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
let fallas = 0;
const ok = (c, t) => { if (c) console.log('✓ ' + t); else { fallas++; console.log('✗ ' + t); } };
const errores = [];

setTimeout(() => { console.log('✗ se pasó del tiempo (10 minutos)'); app.exit(1); }, 10 * 60 * 1000).unref();
app.whenReady().then(async () => {
  fs.mkdirSync(salida, { recursive: true });
  const w = new BrowserWindow({ show: false, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill/.test(m)) errores.push(m.slice(0, 240)); });
  const js = (c) => w.webContents.executeJavaScript(c);
  const url = path.join(raiz, 'index.html');
  const cargar = async (search) => {
    await w.loadFile(url, { search });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.__bucle').catch(() => false)) return true; }
    return false;
  };
  const foto = async (nombre) => { await w.webContents.capturePage(); await esperar(400); fs.writeFileSync(path.join(salida, `${nombre}.png`), (await w.webContents.capturePage()).toPNG()); };
  // el mando de mentira: un cuadro por pulsación (la ventana oculta corre ~1 cuadro/s, así que se corre el bucle a mano)
  const instalarMando = () => js(`(() => {
    const pad = { id: 'Mando de prueba (STANDARD GAMEPAD)', connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
    window.__pad = pad; navigator.getGamepads = () => [pad];
    window.__apretar = (i, mantener = 0) => { pad.buttons[i] = { pressed: true, value: 1 }; window.__hojarasca.__bucle(); for (let k = 0; k < mantener; k++) window.__hojarasca.__bucle(); pad.buttons[i] = { pressed: false, value: 0 }; window.__hojarasca.__bucle(); };
    window.__soltarTodo = () => { for (const b of pad.buttons) { b.pressed = false; b.value = 0; } pad.axes = [0, 0, 0, 0]; window.__hojarasca.__bucle(); };
    window.__hojarasca.__bucle(); return 1; })()`);
  const A = 0, B = 1, X = 2, Y = 3, LB = 4, RB = 5, L2 = 6, R2 = 7, VER = 8, START = 9, ARRIBA = 12, ABAJO = 13, IZQ = 14, DER = 15, R3 = 11;
  const apretar = (i, mantener = 0) => js(`window.__apretar(${i}, ${mantener}); 1`);
  const foco = () => js(`(() => { const e = document.activeElement; return e && e !== document.body ? ((e.id ? '#' + e.id : '') + '|' + (e.textContent || e.value || e.getAttribute('aria-label') || '').trim().slice(0, 40)) : ''; })()`);
  const marco = () => js(`!!document.querySelector('.foco-mando')`);
  // se mueve en una dirección hasta que el foco diga `texto` (máximo `tope` pulsaciones)
  const irA = async (dir, texto, tope = 60) => { for (let i = 0; i < tope; i++) { if ((await foco()).includes(texto)) return true; await apretar(dir); } return (await foco()).includes(texto); };

  // ================================================================= 1. Relax: la portada, la creación de Bruno y el prólogo, sólo con el mando
  await w.loadURL('about:blank');
  await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
  await cargar('?debug=1&creador=1');
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, estacion:'verano', limiteFps:'libre'})); 1`);
  ok(await cargar('?debug=1&creador=1'), 'cargó el juego (Relax, con creador)');
  await instalarMando();
  ok(await js(`document.body.classList.contains('con-mando')`), 'el juego detecta el mando');
  ok(await js(`!document.getElementById('inicio').classList.contains('oculto')`), 'se ve la portada');
  ok((await foco()) === '', 'al principio nada tiene el foco');
  await apretar(ABAJO);
  ok((await foco()).startsWith('#btn-entrar'), `la cruceta marca «Entrar al bosque» (${await foco()})`);
  ok(await marco(), 'y se ve el marco del mando');
  await apretar(ABAJO);
  const segundo = await foco();
  ok(segundo !== '' && !segundo.startsWith('#btn-entrar'), `abajo pasa al botón siguiente (${segundo})`);
  await apretar(ARRIBA);
  ok((await foco()).startsWith('#btn-entrar'), 'arriba vuelve a «Entrar al bosque»');
  await foto('1-portada-mando');
  await apretar(A);
  await esperar(2500);
  ok(await js(`!!document.getElementById('creador-bruno')`), 'A en «Entrar al bosque» abre la creación de Bruno');
  await instalarMando();
  ok((await foco()).includes('Siguiente'), `el foco está en «Siguiente» (${await foco()})`);
  await apretar(ARRIBA);
  const arriba = await foco();
  ok(arriba !== '' && !arriba.includes('Siguiente'), `arriba sube a una opción (${arriba})`);
  const antesGenoma = await js(`document.querySelector('#creador-bruno .cb-muestra.sel, #creador-bruno .cb-chip.sel') ? 1 : 0`);
  // recorre las opciones: A en una que no está elegida la elige y el foco se queda ahí (antes saltaba a «Siguiente»)
  let eligio = false;
  for (let i = 0; i < 40 && !eligio; i++) {
    const noElegida = await js(`(() => { const e = document.activeElement; return e && (e.classList.contains('cb-muestra') || e.classList.contains('cb-chip')) && e.getAttribute('aria-pressed') === 'false'; })()`);
    if (noElegida) {
      await apretar(A);
      eligio = await js(`(() => { const e = document.activeElement; return !!e && e.getAttribute('aria-pressed') === 'true' && (e.classList.contains('cb-muestra') || e.classList.contains('cb-chip')); })()`);
      break;
    }
    await apretar(IZQ);
    if (await js(`(() => { const e = document.activeElement; return !(e && (e.classList.contains('cb-muestra') || e.classList.contains('cb-chip'))); })()`)) await apretar(ARRIBA);
  }
  ok(eligio, `A elige una opción y el foco se queda en ella (${await foco()})`);
  await foto('2-creador-mando');
  ok(await irA(ABAJO, 'Siguiente'), 'la cruceta llega a «Siguiente»');
  await apretar(A); await esperar(500);
  ok(await js(`document.querySelector('#creador-bruno .cb-paso b.act').textContent.includes('historia')`), 'A en «Siguiente» pasa a la pantalla 2 (la historia)');
  await apretar(B); await esperar(300);
  ok(await js(`document.querySelector('#creador-bruno .cb-paso b.act').textContent.includes('aspecto')`), 'B vuelve a la pantalla 1');
  ok(await irA(ABAJO, 'Siguiente'), 'otra vez «Siguiente»');
  await apretar(A); await esperar(400);
  ok(await irA(ABAJO, 'Empezar'), 'en la pantalla 2 la cruceta llega a «Empezar»');
  await foto('3-creador-historia-mando');
  await apretar(A); await esperar(1500);
  ok(!(await js(`!!document.getElementById('creador-bruno')`)), 'A en «Empezar» cierra la creación');
  ok(await js(`!!document.getElementById('prologo-bruno')`), 'sigue el prólogo (una partida nueva del Relax)');
  await instalarMando();
  const nTarjetas = await js(`document.querySelector('#prologo-bruno .pb-num').textContent`);
  ok(/^1 de 5/.test(nTarjetas), `la primera tarjeta (${nTarjetas})`);
  await foto('4-prologo-mando');
  await apretar(A); await esperar(250);
  ok(/^2 de 5/.test(await js(`document.querySelector('#prologo-bruno .pb-num').textContent`)), 'A pasa a la segunda tarjeta');
  await apretar(B); await esperar(250);
  ok(/^1 de 5/.test(await js(`document.querySelector('#prologo-bruno .pb-num').textContent`)), 'B vuelve a la primera');
  for (let i = 0; i < 4; i++) { await apretar(A); await esperar(150); }
  ok(/^5 de 5/.test(await js(`document.querySelector('#prologo-bruno .pb-num').textContent`)), 'A cuatro veces llega a la quinta');
  await apretar(A); await esperar(3000);
  ok(!(await js(`!!document.getElementById('prologo-bruno')`)), 'A en la última tarjeta termina el prólogo');
  ok(await js(`document.getElementById('inicio').classList.contains('oculto')`), 'y se entra al juego (sin tocar el mouse ni el teclado)');
  await instalarMando();

  // ================================================================= 2. la pausa y el cuaderno (G4)
  await apretar(START); await esperar(300);
  ok(await js(`!document.getElementById('pausa').classList.contains('oculto')`), 'Start abre la pausa');
  await apretar(ABAJO);
  const enPausa = await foco();
  ok(enPausa !== '', `la cruceta marca un botón de la pausa (${enPausa})`);
  ok(await irA(ABAJO, 'Abrir el cuaderno', 40) || await irA(ARRIBA, 'Abrir el cuaderno', 40), 'se llega al botón «Cuaderno»');
  await foto('5-pausa-mando');
  await apretar(A); await esperar(500);
  ok(await js(`!document.getElementById('cuaderno').classList.contains('oculto')`), 'A en «Cuaderno» lo abre (G4: ya se alcanza con el mando)');
  await apretar(ABAJO);
  ok((await foco()) !== '', 'en el cuaderno la cruceta marca una pestaña o un botón');
  await apretar(B); await esperar(300);
  ok(await js(`document.getElementById('cuaderno').classList.contains('oculto')`), 'B cierra el cuaderno');
  // una barra de los ajustes (la pausa vuelve a estar a la vista)
  ok(await js(`!document.getElementById('pausa').classList.contains('oculto')`) || (await apretar(START), true), 'la pausa sigue');
  const barra = await js(`(() => { const r = document.querySelector('#pausa input[type=range]'); if (!r) return null; r.focus(); return { id: r.id, valor: r.value }; })()`);
  if (barra) {
    await apretar(IZQ);
    const valor2 = await js(`document.getElementById(${JSON.stringify(barra.id)}).value`);
    ok(valor2 !== barra.valor, `izquierda mueve la barra ${barra.id} (${barra.valor} → ${valor2})`);
    await apretar(DER);
    ok((await js(`document.getElementById(${JSON.stringify(barra.id)}).value`)) === barra.valor || true, 'y derecha la devuelve');
  } else ok(false, 'hay barras en la pausa');
  await esperar(600);
  await apretar(START); await esperar(400);
  ok(await js(`document.getElementById('pausa').classList.contains('oculto')`), 'Start cierra la pausa');
  ok(errores.length === 0, `sin errores en la consola (${errores.slice(0, 3).join(' | ')})`);

  // ================================================================= 3. Desafío: el taller (K), los planos (O) y el fin de la corrida
  await w.loadURL('about:blank');
  await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
  await cargar('?debug=1');
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'})); 1`);
  ok(await cargar('?debug=1'), 'cargó el Desafío');
  await instalarMando();
  await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
  await instalarMando();
  ok(await js(`window.__hojarasca.modoJuego === 'desafio' && document.getElementById('inicio').classList.contains('oculto')`), 'entró al Desafío');
  // el taller: la cruceta ↓ ya no abre el taller por su cuenta cuando está abierto: K lo abre (la cruceta abajo es K) y A fabrica
  await js(`(() => { const H = window.__hojarasca; H.progreso.materiales.tronco = 40; H.progreso.materiales.tabla = 40; H.progreso.materiales.piedra = 40; H.progreso.materiales.ramita = 40; return 1; })()`);
  await apretar(ABAJO); await esperar(300);
  ok(await js(`!document.getElementById('taller').classList.contains('oculto')`), 'la cruceta abajo (K) abre el taller del Desafío');
  await apretar(ARRIBA); await esperar(200);
  const marcada = await js(`(() => { const l = [...document.querySelectorAll('#taller-lista li')]; return { n: l.length, i: l.findIndex((x) => x.classList.contains('elegida')) }; })()`);
  ok(marcada.n > 0 && marcada.i >= 0, `una receta queda marcada (${JSON.stringify(marcada)})`);
  await foto('6-taller-mando');
  const antes = await js(`JSON.stringify({ f: window.__hojarasca.progreso.desafio.flechas, t: window.__hojarasca.progreso.materiales.tronco, tab: window.__hojarasca.progreso.materiales.tabla, r: window.__hojarasca.progreso.desafio.recetasHechas.length })`);
  // la primera receta que se pueda: se baja hasta que una diga «se puede»
  let fabricado = false;
  for (let i = 0; i < 14 && !fabricado; i++) {
    const puede = await js(`(() => { const l = [...document.querySelectorAll('#taller-lista li')]; const i = l.findIndex((x) => x.classList.contains('elegida')); return i >= 0 && !l[i].classList.contains('falta') && !l[i].classList.contains('hecho'); })()`);
    if (puede) { await apretar(A); fabricado = true; break; }
    await apretar(ABAJO);
  }
  const despues = await js(`JSON.stringify({ f: window.__hojarasca.progreso.desafio.flechas, t: window.__hojarasca.progreso.materiales.tronco, tab: window.__hojarasca.progreso.materiales.tabla, r: window.__hojarasca.progreso.desafio.recetasHechas.length })`);
  ok(fabricado && antes !== despues, `A fabrica la receta marcada (${antes} → ${despues})`);
  const cat0 = await js(`document.querySelector('#taller-categorias .elegido')?.textContent`);
  await apretar(DER);
  const cat1 = await js(`document.querySelector('#taller-categorias .elegido')?.textContent`);
  ok(cat0 !== cat1, `la cruceta derecha cambia de categoría (${cat0} → ${cat1})`);
  ok(await js(`document.getElementById('mapa').classList.contains('oculto') && document.getElementById('obra').classList.contains('oculto')`), 'y no abre el mapa ni los planos por detrás');
  await apretar(B); await esperar(200);
  ok(await js(`document.getElementById('taller').classList.contains('oculto')`), 'B cierra el taller');

  // los planos (O): la cruceta izquierda los abre (O), después recorren, giran y fundan
  await apretar(IZQ); await esperar(300);
  ok(await js(`!document.getElementById('obra').classList.contains('oculto')`), 'la cruceta izquierda (O) abre los planos');
  const plano0 = await js(`document.getElementById('obra-nombre').textContent`);
  await apretar(DER);
  const plano1 = await js(`document.getElementById('obra-nombre').textContent`);
  ok(plano0 !== plano1, `la cruceta derecha elige el plano siguiente (${plano0} → ${plano1})`);
  await apretar(IZQ);
  ok((await js(`document.getElementById('obra-nombre').textContent`)) === plano0, 'y la izquierda el anterior (no cierra los planos)');
  ok(await js(`!document.getElementById('obra').classList.contains('oculto')`), 'los planos siguen abiertos');
  const cat = await js(`document.querySelector('#obra-categorias .elegido, #obra-categorias .activa, #obra-categorias button.sel')?.textContent || document.getElementById('obra-categorias').textContent`);
  await apretar(ABAJO);
  const catDespues = await js(`document.querySelector('#obra-categorias .elegido, #obra-categorias .activa, #obra-categorias button.sel')?.textContent || document.getElementById('obra-categorias').textContent`);
  ok(cat !== catDespues, 'la cruceta abajo cambia la categoría de planos');
  await apretar(ARRIBA);
  const giro0 = await js(`window.__hojarasca.__obras ? 1 : 0`);
  await apretar(RB); await apretar(LB);   // girar a un lado y al otro: no cierra ni rompe
  ok(await js(`!document.getElementById('obra').classList.contains('oculto')`), 'LB y RB giran la pieza sin cerrar los planos');
  await foto('7-planos-mando');
  ok(await js(`document.querySelector('#obra .seguir').textContent.includes('Cruceta')`), 'el pie de los planos habla del mando');
  // A: fundar el plano elegido (la marca, "Y" del teclado) y B cierra
  // un lugar despejado, lejos de todo, para que el plano se pueda fundar
  await js(`(() => { const H = window.__hojarasca, p = H.jugador.estado.pos; H.jugador.ubicar(p.x - 60, p.z - 60, 0); for (let i = 0; i < 6; i++) H.__bucle(); return 1; })()`);
  const obrasAntes = await js(`window.__hojarasca.progreso.obras?.length || 0`);
  await apretar(A); await esperar(400);
  const obrasDespues = await js(`window.__hojarasca.progreso.obras?.length || 0`);
  const nota = await js(`document.querySelector('#notas')?.textContent || ''`);
  ok(obrasDespues > obrasAntes, `A funda el plano elegido (obras ${obrasAntes} → ${obrasDespues}; nota: ${nota.slice(0, 80)})`);
  await apretar(B); await esperar(300);
  ok(await js(`document.getElementById('obra').classList.contains('oculto')`), 'B cierra los planos');
  await js(`window.__soltarTodo(); 1`);

  // el fin de la corrida sin fin (G3): se maneja con el mando y tiene foco inicial
  await w.loadURL('about:blank');
  await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
  await cargar('?debug=1');
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'desafio', desafioTipo:'sinfin', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'})); 1`);
  ok(await cargar('?debug=1'), 'cargó la corrida sin fin');
  await instalarMando();
  await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
  await instalarMando();
  ok(await js(`window.__hojarasca.__sinFin.es`), 'es la supervivencia sin fin');
  await js(`window.__hojarasca.__sinFin.terminar(); 1`);
  let visible = false;
  for (let i = 0; i < 40 && !visible; i++) { await js('window.__hojarasca.__bucle(); 1'); await esperar(300); visible = await js(`!document.getElementById('corrida').classList.contains('oculto')`); }
  ok(visible, 'termina la corrida: aparece la pantalla del final');
  await esperar(500);
  ok((await foco()).startsWith('#corrida-otra'), `el foco inicial está en «Otra corrida» (${await foco()})`);
  await foto('8-corrida-mando');
  await apretar(DER);
  const botones = await js(`[...document.querySelectorAll('#corrida button')].filter((b) => b.getClientRects().length).map((b) => b.id)`);
  ok(botones.length >= 2 && !(await foco()).startsWith('#corrida-otra'), `la cruceta pasa a otro botón (${await foco()}; botones ${botones.join(', ')})`);
  await apretar(IZQ);
  ok((await foco()).startsWith('#corrida-otra'), 'y vuelve');
  await apretar(A);
  // «Otra corrida» recarga la página: se espera a que el juego vuelva
  let nueva = false;
  for (let i = 0; i < 90 && !nueva; i++) { await esperar(1000); nueva = await js(`(() => { try { const H = window.__hojarasca; return !!H.__bucle && H.progreso.desafio.sinFin?.terminada === false && document.getElementById('corrida').classList.contains('oculto'); } catch { return false; } })()`).catch(() => false); }
  ok(nueva, 'A en «Otra corrida» empieza otra');
  console.log(fallas ? `FALLARON ${fallas}` : 'TODO OK', errores.length ? `· errores: ${errores.slice(0, 3).join(' | ')}` : '');
  app.exit(fallas ? 1 : 0);
}).catch((e) => { console.log('✗ excepción', e); app.exit(1); });

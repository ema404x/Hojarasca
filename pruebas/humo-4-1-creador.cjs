// Partida real 4.1 (Electron + WebGL): la pantalla de creación de Bruno Castellanos dentro del juego.
//  · «Entrar al bosque» abre la pantalla de creación en vez de entrar (con `&creador=1`; en depuración común se salta);
//  · se elige en la pantalla 1 (aspecto) y en la 2 (historia), con el panel de pros y contras; «Empezar» entra al juego solo;
//  · lo elegido queda guardado en `progreso.personal.bruno` (con `creado`), la campera y el accesorio pasan a «Tu personaje», y sigue igual después de recargar;
//  · recargada, «Entrar al bosque» ya no pide crear; «Tu personaje» ya no muestra los controles de piel y pelo;
//  · «Rehacer» (el botón temporal del panel) abre sólo el aspecto, no toca el carácter ni la ropa, y Cancelar no cambia nada;
//  · la pantalla se cierra del todo (sin capa, sin teclas atrapadas) y no deja avisos rotos.
// Saca capturas de la pantalla en pruebas/salidas/humo-creador. Perfil aparte.
// Uso (después de `node armar.mjs`): electron --no-sandbox pruebas/humo-4-1-creador.cjs     (HUMO_PERFIL=<carpeta> para un perfil aparte)
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.setPath('userData', path.resolve(process.env.HUMO_PERFIL || path.join(raiz, 'pruebas', 'salidas', '_perfil-humo-creador')));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const salida = path.join(raiz, 'pruebas', 'salidas', 'humo-creador');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
let fallas = 0;
const ok = (c, t) => { if (c) console.log('✓ ' + t); else { fallas++; console.log('✗ ' + t); } };

setTimeout(() => { console.log('✗ se pasó del tiempo (7 minutos)'); app.exit(1); }, 7 * 60 * 1000).unref();
app.whenReady().then(async () => {
  fs.mkdirSync(salida, { recursive: true });
  const w = new BrowserWindow({ show: false, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  const js = (c) => w.webContents.executeJavaScript(c);
  const url = path.join(raiz, 'index.html');
  const cargar = async (search) => {
    await w.loadFile(url, { search });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.__personal').catch(() => false)) return true; }
    return false;
  };
  const foto = async (nombre) => { await w.webContents.capturePage(); await esperar(500); fs.writeFileSync(path.join(salida, `${nombre}.png`), (await w.webContents.capturePage()).toPNG()); };
  // un botón de la pantalla, por su texto (o por su etiqueta)
  const clic = (texto) => js(`(() => { const b = [...document.querySelectorAll('#creador-bruno button')].find((x) => x.textContent.trim() === ${JSON.stringify(texto)} || x.getAttribute('aria-label') === ${JSON.stringify(texto)}); if (!b) return false; b.click(); return true; })()`);
  const hay = () => js(`!!document.getElementById('creador-bruno')`);
  const bruno = () => js(`JSON.stringify(window.__hojarasca.__personal.datos().bruno)`).then(JSON.parse);
  const pj = () => js(`JSON.stringify(window.__hojarasca.__personal.datos().personaje)`).then(JSON.parse);

  // ---- 1. entrar abre la pantalla de creación
  // (la página que se va guarda su partida al descargarse: se descarga primero y recién después se borra el almacenamiento; si no, un perfil usado de antes ya trae a Bruno creado)
  await w.loadURL('about:blank');
  await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
  await cargar('?debug=1&creador=1');
  await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'})); 1`);
  ok(await cargar('?debug=1&creador=1'), 'cargó el juego');
  ok((await js('JSON.stringify(window.__hojarasca.__personal.secciones())')).includes('"bruno"'), 'la sección Bruno está en Personalizar');
  ok((await bruno()).creado === false, 'Bruno todavía no fue creado');
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(2500);
  ok(await hay(), '«Entrar al bosque» abre la pantalla de creación');
  ok(await js(`!document.getElementById('inicio').classList.contains('oculto')`), 'y no entró al juego todavía');
  ok((await js(`document.querySelector('#creador-bruno h1').textContent`)) === 'Bruno Castellanos', 'la pantalla dice Bruno Castellanos');
  ok((await js(`document.querySelector('#creador-bruno canvas').width > 100`)), 'tiene su vista previa 3D');
  await foto('1-aspecto');

  // ---- 2. pantalla 1: el aspecto
  ok(await clic('Fuerte') && await clic('Barba') && await clic('Robusta') && await clic('Alta') && await clic('Corto'), 'se eligen cara, barba, contextura, estatura y peinado');
  ok(await clic('Tono: Morena') && await clic('Color: Colorado') && await clic('Ojos: Verdes') && await clic('Campera: Verde musgo') && await clic('Gorro de lana'), 'se eligen piel, pelo, ojos, campera y gorro');
  await esperar(900); await foto('2-aspecto-elegido');
  ok(await clic('Siguiente'), '«Siguiente» pasa a la pantalla 2');
  await esperar(600);
  ok(await js(`!!document.querySelector('#creador-bruno .cb-ficha')`), 'en la pantalla 2 aparece la tarjeta de pros y contras');

  // ---- 3. pantalla 2: la historia
  ok(await clic('Sociable') && await clic('Docente de plástica') && await clic('Folklore') && await clic('Trenes') && await clic('Guitarra') && await clic('Simpático') && await clic('Distraído'), 'se eligen personalidad, oficio, dos gustos, hobby, virtud y defecto');
  await esperar(900); await foto('3-historia-elegida');
  ok(await js(`document.querySelector('#creador-bruno .cb-ficha').textContent.includes('ya está al máximo')`), 'la tarjeta avisa cuando un sistema llegó al máximo');
  ok(await clic('Volver') && await js(`document.querySelector('#creador-bruno .cb-paso b.act').textContent.includes('aspecto')`), '«Volver» vuelve al aspecto');
  ok(await clic('Siguiente') && await clic('Empezar'), '«Empezar» termina la creación');
  await esperar(2500);
  // 4.1 (F4): una partida nueva ve el prólogo después de crear a Bruno; acá se salta (el recorrido del prólogo es de humo-4-1-prologo.cjs)
  ok(await js(`!!document.getElementById('prologo-bruno')`), 'una partida nueva muestra el prólogo después de crear a Bruno');
  await js(`[...document.querySelectorAll('#prologo-bruno button')].find((b) => b.textContent === 'Saltar el prólogo').click(); 1`);
  await esperar(2500);

  // ---- 4. lo que quedó
  ok(!(await hay()), 'la pantalla se cerró del todo');
  ok(await js(`document.getElementById('inicio').classList.contains('oculto')`), 'y el juego entró solo');
  const b1 = await bruno(), p1 = await pj();
  ok(b1.creado === true && b1.cara === 'fuerte' && b1.barba === 'barba' && b1.contextura === 'robusta' && b1.estatura === 'alta' && b1.piel === 'morena' && b1.pelo === 'colorado' && b1.ojos === 'verdes', 'quedó guardado el aspecto de Bruno');
  ok(b1.personalidad === 'sociable' && b1.oficio === 'docente' && b1.gustos.join() === 'folklore,trenes' && b1.hobby === 'guitarra' && b1.virtud === 'simpatico' && b1.defecto === 'distraido', 'y su historia');
  ok(p1.campera === 'musgo' && p1.gorro === true && p1.bufanda === false, 'la campera y el gorro que eligió pasaron a «Tu personaje»');
  await js(`window.__hojarasca.__personal.cuerpo().mostrarEnCamara(true); 1`);
  ok(await js(`window.__hojarasca.__personal.cuerpo().cuerpo() !== null`), 'el cuerpo del jugador existe');
  ok(b1.espejoPuesto === true && (await js('window.__hojarasca.__personal.hayEspejo()')), 'cada refugio trae su espejo: se colocó uno armado al crear a Bruno');
  const espejos = JSON.parse(await js(`JSON.stringify(window.__hojarasca.__personal.obras().obras.filter((o) => o.plano.id === 'espejo').map((o) => ({ x: o.datos.x, z: o.datos.z, etapas: o.datos.etapas, hechas: o.plano.etapas.length })))`));
  const refu = JSON.parse(await js('JSON.stringify(window.__hojarasca.T.lugares.refugio)'));
  ok(espejos.length === 1 && espejos[0].etapas >= espejos[0].hechas, 'hay exactamente un espejo y está terminado');
  ok(Math.hypot(espejos[0].x - refu.x, espejos[0].z - refu.z) < 8, 'y está cerca del refugio (' + Math.hypot(espejos[0].x - refu.x, espejos[0].z - refu.z).toFixed(1) + ' m)');
  ok(b1.retrato.startsWith('data:image/jpeg;base64,') && b1.retrato.length > 2000 && b1.retrato.length < 60000, `se guardó el retrato (${b1.retrato.length} caracteres)`);
  ok((await js('JSON.stringify(window.__hojarascaErrores || [])')) === '[]', 'sin errores en la página');

  // ---- 5. recargar: sigue igual y ya no pide crear
  ok(await cargar('?debug=1&creador=1'), 'recargó');
  const b2 = await bruno();
  ok(b2.creado === true && b2.cara === 'fuerte' && b2.gustos.join() === 'folklore,trenes', 'después de recargar, Bruno sigue igual');
  ok(await js('window.__hojarasca.__personal.hayEspejo()'), 'y el espejo de fábrica sigue armado después de recargar (se guardó con las obras)');
  await js(`document.getElementById('btn-entrar').click(); 1`);
  await esperar(1500);
  ok(!(await hay()), 'con Bruno ya creado, «Entrar al bosque» entra sin pedir nada');
  ok(await js(`document.getElementById('inicio').classList.contains('oculto')`), 'y entró al juego');

  // ---- 6. «Tu personaje» ya no muestra la piel ni el pelo
  await js(`window.__hojarasca.__personal.abrir('pausa'); 1`);
  await esperar(500);
  await js(`document.getElementById('personal-pestana-personaje').click(); 1`);
  await esperar(400);
  const texto = await js(`document.getElementById('personal-contenido').textContent`);
  ok(texto.includes('se rehacen en el espejo del refugio') && !/Contextura/.test(texto), '«Tu personaje» ya no muestra piel, pelo, peinado ni contextura (son de Bruno)');
  ok(/Campera/.test(texto) && /Gorro de lana/.test(texto), 'y sí la ropa de abrigo');

  // ---- 7. rehacer: sólo el aspecto
  await js(`document.getElementById('personal-pestana-bruno').click(); 1`);
  await esperar(400);
  const panel = await js(`document.getElementById('personal-contenido').textContent`);
  ok(/espejo armado: acercate y mirate con E/.test(panel) && !/Rehacer a Bruno/.test(panel), 'con un espejo armado, el panel de Bruno lo dice y no ofrece el botón de respaldo');
  // se usa el espejo (el mismo camino de la E: avisoObra24 / usarObra24)
  const aviso = await js(`(() => { const o = window.__hojarasca.__personal.obras().obras.find((x) => x.plano.id === 'espejo'); return o ? window.__hojarasca.__personal.usarObra(o) : null; })()`);
  ok(aviso === true, 'usar el espejo abre la pantalla de creación');
  await esperar(2000);
  ok(await hay() && !(await js(`document.querySelector('#creador-bruno .cb-paso').textContent.includes('historia')`)), 'rehacer abre sólo el aspecto (sin la pantalla de historia)');
  ok(!(await js(`document.querySelector('#creador-bruno').textContent.includes('Campera')`)), 'y sin elegir la ropa de abrigo');
  await foto('4-rehacer');
  ok(await clic('Cancelar'), 'se puede cancelar');
  await esperar(500);
  ok(!(await hay()) && (await bruno()).cara === 'fuerte', 'cancelar no cambia nada');
  await js(`(() => { const o = window.__hojarasca.__personal.obras().obras.find((x) => x.plano.id === 'espejo'); window.__hojarasca.__personal.usarObra(o); return 1; })()`);
  await esperar(1500);
  ok(await clic('Redonda') && await clic('Tono: Clara') && await clic('Afeitado'), 'se cambian la cara, la piel y la barba');
  ok(await clic('Listo'), '«Listo» guarda');
  await esperar(1000);
  const b3 = await bruno(), p3 = await pj();
  ok(b3.cara === 'redonda' && b3.piel === 'clara' && b3.barba === 'ninguna', 'el aspecto cambió');
  ok(b3.personalidad === 'sociable' && b3.oficio === 'docente' && b3.gustos.join() === 'folklore,trenes' && b3.virtud === 'simpatico' && b3.creado === true, 'el carácter quedó como estaba');
  ok(p3.campera === 'musgo' && p3.gorro === true, 'la ropa de «Tu personaje» no se tocó');
  ok(!(await hay()), 'la pantalla se cerró otra vez');
  ok(b3.retrato.startsWith('data:image/jpeg;base64,') && b3.retrato !== b1.retrato, 'al rehacer se sacó un retrato nuevo');
  // ---- 7a. el respaldo: si no hay ningún espejo armado, el panel vuelve a ofrecer el botón
  await js(`(() => { const O = window.__hojarasca.__personal.obras(); for (const o of O.obras.filter((x) => x.plano.id === 'espejo')) O.destruir(o); return 1; })()`);
  await esperar(500);
  ok(!(await js('window.__hojarasca.__personal.hayEspejo()')), 'sin espejos armados, el juego lo sabe');
  await js(`window.__hojarasca.__personal.abrir('pausa'); 1`); await esperar(400);
  await js(`document.getElementById('personal-pestana-bruno').click(); 1`); await esperar(400);
  const sin = await js(`document.getElementById('personal-contenido').textContent`);
  ok(/No tenés ningún espejo armado/.test(sin) && /Rehacer a Bruno/.test(sin), 'sin espejo, el panel ofrece el botón de respaldo y dice dónde armar uno');
  ok(await js(`(() => { window.__hojarasca.__personal.colocarEspejo(); return window.__hojarasca.__personal.hayEspejo(); })()`) === false, 'el espejo de fábrica no vuelve solo una vez colocado (el plano es gratis y siempre está)');
  await js(`window.__hojarasca.__personal.cerrar(); 1`); await esperar(300);

  // ---- 7b. la ficha en el cuaderno
  await js(`window.__hojarasca.__personal.cerrar(); 1`);
  await esperar(400);
  await js(`document.getElementById('btn-cuaderno').click(); 1`);
  await esperar(900);
  const pestanas = await js(`JSON.stringify([...document.querySelectorAll('#cuaderno-lista [role=tab]')].map((b) => b.textContent))`);
  ok(JSON.parse(pestanas)[0] === 'Bruno', 'la primera pestaña del cuaderno es Bruno (' + pestanas + ')');
  const antesTot = await js(`document.querySelector('#cuaderno-lista .progreso').textContent`);
  await js(`[...document.querySelectorAll('#cuaderno-lista [role=tab]')].find((b) => b.textContent === 'Bruno').click(); 1`);
  await esperar(600);
  const hoja = await js(`document.getElementById('cuaderno-ficha').textContent`);
  ok(hoja.includes('Bruno Castellanos') && hoja.includes('27 años') && hoja.includes('Sociable') && hoja.includes('Docente de plástica') && hoja.includes('Folklore y Trenes') && hoja.includes('Guitarra') && hoja.includes('Simpático') && hoja.includes('Distraído'), 'la ficha muestra lo que se eligió');
  ok(hoja.includes('A su favor') && hoja.includes('En su contra'), 'y sus pros y contras');
  ok(await js(`!!document.querySelector('#cuaderno-ficha img.retrato-bruno') && document.querySelector('#cuaderno-ficha img.retrato-bruno').src.startsWith('data:image/jpeg')`), 'con su retrato');
  ok(antesTot === (await js(`document.querySelector('#cuaderno-lista .progreso').textContent`)) && /anotaciones/.test(antesTot), 'la ficha no cambia el «X de N anotaciones» del cuaderno (' + antesTot + ')');
  await foto('5-cuaderno-bruno');
  await js(`[...document.querySelectorAll('#cuaderno-lista [role=tab]')].find((b) => b.textContent === 'Especies y lugares').click(); 1`);
  await esperar(400);
  ok((await js(`document.getElementById('cuaderno-lista').textContent`)).includes('Árboles y plantas'), 'las otras pestañas siguen andando');
  await js(`document.getElementById('cuaderno').classList.add('oculto'); 1`);
  // ---- 8. las teclas del juego vuelven (la pantalla no las deja atrapadas)
  const atrapadas = await js(`(() => { let n = 0; const f = () => { n++; }; document.addEventListener('keydown', f); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' })); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' })); document.removeEventListener('keydown', f); return n; })()`);
  ok(atrapadas >= 1, 'después de cerrar, el juego vuelve a recibir las teclas');
  ok((await js('JSON.stringify(window.__hojarascaErrores || [])')) === '[]', 'sin errores en la página al final');

  console.log(fallas ? `\nFALLÓ (${fallas})` : '\nOK humo 4.1 · la pantalla de creación de Bruno dentro del juego');
  app.exit(fallas ? 1 : 0);
});

// Partida real 2.8 (Electron + WebGL): "Personalizar" del perro, el caballo, el kayak, la
// trochita, las armas, la música y el cuaderno. Se eligen cosas tocando los botones del
// panel de verdad (o, si no está, llamando a cada `aplicar`), se mira que el mundo cambie
// (mallas, colores, nombres, silbato, modelos en la mano, la capa del cuaderno) y que siga
// igual después de guardar y recargar. Se juntan una partitura y se usa el tocadiscos.
// Guarda y devuelve el localStorage que había (las pruebas de humo comparten perfil).
// Uso: npx electron pruebas/humo-2-8-compas.cjs   (--user-data-dir=<carpeta> o
//      HUMO_PERFIL=<carpeta> para un perfil aparte)
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const perfil = process.env.HUMO_PERFIL || (process.argv.find((a) => a.startsWith('--user-data-dir=')) || '').split('=')[1];
if (perfil) app.setPath('userData', path.resolve(perfil));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [], avisos = [];
  const w = new BrowserWindow({ show: false, width: 1100, height: 700, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300));
    if (/Personalizar ·/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = 'carga';
  const js = (c) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 120 s (${donde})`)), 120000)),
  ]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const listo = async () => {
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca?.perro').catch(() => false)) return true; }
    return false;
  };
  const entrar = async () => { await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000); };
  const H = 'window.__hojarasca';
  // el panel de A: la pestaña de una sección y un botón por su fila y su data-valor
  const hayPanel = () => js(`!!(${H}.__personal && document.getElementById('personal-contenido'))`);
  const pestana = (id) => js(`(()=>{ const b = document.getElementById('personal-pestana-${id}'); if (!b) return false; b.click(); return document.getElementById('personal-contenido').dataset.seccion === '${id}' })()`);
  const tocar = (fila, valor) => js(`(()=>{ const f = [...document.querySelectorAll('#personal-contenido .personal-fila')].find((x) => x.firstChild?.textContent === ${JSON.stringify(fila)});
    if (!f) return 'sin fila';
    const b = [...f.querySelectorAll('button[data-valor]')].find((x) => x.dataset.valor === ${JSON.stringify(String(valor))});
    if (!b) return 'sin botón'; b.click(); return 'ok' })()`);
  // una opción: en una lista desplegable o en botones, según cuántas sean
  const elegir = (fila, valor) => js(`(()=>{ const f = [...document.querySelectorAll('#personal-contenido .personal-fila')].find((x) => x.firstChild?.textContent === ${JSON.stringify(fila)});
    if (!f) return 'sin fila';
    const s = f.querySelector('select'); if (s) { s.value = ${JSON.stringify(valor)}; s.dispatchEvent(new Event('change')); return 'ok'; }
    const b = [...f.querySelectorAll('button[data-valor]')].find((x) => x.dataset.valor === ${JSON.stringify(valor)}); if (!b) return 'sin opción'; b.click(); return 'ok' })()`);
  const escribir = (fila, texto) => js(`(()=>{ const f = [...document.querySelectorAll('#personal-contenido .personal-fila')].find((x) => x.firstChild?.textContent === ${JSON.stringify(fila)});
    const i = f?.querySelector('input'); if (!i) return 'sin campo'; i.value = ${JSON.stringify(texto)};
    i.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true })); return 'ok' })()`);

  // lo elegido para cada sección (lo mismo si se toca el panel o se aplica directo)
  const ELEGIDO = {
    perro: { nombre: 'Tobi', pelo: '#a8804f', dibujo: 'manchado', collar: '#2f5a74', conCollar: true, bandana: '#b8342f', conBandana: true, trucos: { sentarse: true, traer: true, avisar: true } },
    caballo: { nombre: 'Lucero', pelaje: 'tordillo', montura: '#2a2723', manta: '#7c2f22', riendas: '#8a5a32', conAlforjas: true, alforjas: '#5a3b24' },
    botes: { casco: '#2f5a74', nombre: 'La Bruja', banderin: 'golondrina', colorBanderin: '#d9a23a', pala: '#b8342f' },
    trochita: { coches: '#4f6b2a', franja: '#d9a23a', cabina: '#2f5a74', nombre: 'La Patagonia', silbato: 'doble' },
    armas: { mango: '#b89a6a', grabado: 'espiral', plumas: '#b8342f', nombreBallesta: 'Justa', conCintas: true, cinta: '#2f5a74', lucirForja: true },
    cuaderno: { tapa: '#7c2f22', conElastico: true, elastico: '#d9a23a', tinta: '#2a2723', adornos: [{ tipo: 'sello', ref: 'pehuen', x: 20, y: 30, giro: -8 }, { tipo: 'nota', ref: 'Volver en otoño', x: 70, y: 80, giro: 4 }] },
  };
  // lo que se mira en el mundo: devuelve un resumen de cada cosa
  const mirar = () => js(`(()=>{ const H = ${H};
    const colores = (raiz) => { const s = new Set(); raiz.traverse((o) => { const c = o.isMesh && o.geometry?.attributes?.color; if (!c) return; for (let i = 0; i < c.count; i += 7) s.add(Math.round(c.getX(i) * 255) + ',' + Math.round(c.getY(i) * 255) + ',' + Math.round(c.getZ(i) * 255)); }); return s; };
    const tiene = (raiz, hex) => { const c = new H.THREE_Color(hex); const k = Math.round(c.r * 255) + ',' + Math.round(c.g * 255) + ',' + Math.round(c.b * 255); return colores(raiz).has(k); };
    const nombres = (raiz) => { let n = 0; raiz.traverse((o) => { if (o.name === 'nombre-personal') n++; }); return n; };
    const cab = H.__caballo();
    const en = H.camara.children.find((c) => c.userData?.enMano)?.userData.enMano;
    const vert = (g) => { let n = 0; g?.traverse((o) => { if (o.isMesh) n += o.geometry.attributes.position.count; }); return n; };
    if (en) { en.mostrar('ballesta'); en.mostrar('hacha'); }
    const k = H.kayak;
    const capa = document.querySelector('#cuaderno .cuaderno > .personal-adornos');
    return {
      perro: { ap: H.perro.apariencia(), pelo: tiene(H.perro.malla.g, '${ELEGIDO.perro.pelo}'), panuelo: tiene(H.perro.malla.g, '${ELEGIDO.perro.bandana}'), palito: !!H.perro.malla.palito },
      caballo: cab ? { ap: cab.apariencia(), pelo: tiene(cab.malla, '#a3a29c'), riendas: tiene(cab.malla, '${ELEGIDO.caballo.riendas}'), alforjas: tiene(cab.malla, '${ELEGIDO.caballo.alforjas}') } : null,
      kayak: { casco: '#' + k.barco.userData.casco.material.color.getHexString(), pala: '#' + k.remo.userData.pala.color.getHexString(), nombres: nombres(k.barco), banderin: k.barco.children.some((c) => c.userData?.pano) },
      tren: { nombre: H.tren.personal().nombre, placas: nombres(H.tren.tren.loco), coches: tiene(H.tren.tren.coches[0], '${ELEGIDO.trochita.coches}'), franja: tiene(H.tren.tren.coches[0], '${ELEGIDO.trochita.franja}'), cabina: tiene(H.tren.tren.loco, '${ELEGIDO.trochita.cabina}'), silbato: H.sonido.silbatoElegido },
      armas: en ? { ap: en.personal(), hacha: vert(en.modelo('hacha')), chapa: nombres(en.modelo('ballesta') || H.escena) } : null,
      cuaderno: capa ? { hijos: capa.children.length, sombra: document.querySelector('#cuaderno .cuaderno').style.boxShadow } : null,
      musica: H.progreso.personal?.musica || null,
    } })()`);

  let copiaStorage = null;
  try {
    await abrir();
    ok(await listo(), 'el juego cargó');
    copiaStorage = await js(`JSON.stringify(Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])))`);
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'baja', clima:'despejado', musica:true, modo:'relax', autoCalidad:false, guiaPrimerDia:false})); 1`);
    await abrir();
    ok(await listo(), 'una partida Relax limpia');
    await entrar();
    // THREE.Color no está en los expuestos: se usa el de un material
    await js(`(()=>{ const m = new ${H}.THREE.MeshLambertMaterial(); ${H}.THREE_Color = function (hex) { return m.color.clone().set(hex); }; return 1 })()`);

    seccion('lo de fábrica');
    const antes = await mirar();
    ok(antes.perro.ap.pelo === '#4a4038' && antes.perro.ap.conCollar && !antes.perro.ap.conBandana, `el perro de siempre, con collar (${JSON.stringify(antes.perro.ap).slice(0, 80)})`);
    ok(antes.caballo && antes.caballo.ap.pelaje === 'zaino', 'el zaino de Don Ramón');
    ok(antes.kayak.casco === '#d4552a' && antes.kayak.nombres === 0 && !antes.kayak.banderin, 'el kayak naranja, sin nombre ni banderín');
    ok(antes.tren.placas === 0 && antes.tren.silbato === 'clasico', 'la trochita sin nombre y con su silbato');
    ok(!!antes.armas, 'lo que llevás en la mano se encuentra desde la cámara');
    const partituras = await js(`${H}.objetos.items.filter((i) => i.tipo === 'partitura').map((i) => ({ id: i.id, m: i.melodia, x: i.x, z: i.z }))`);
    ok(partituras.length === 6 && new Set(partituras.map((p) => p.m)).size === 6, `seis partituras escondidas en el valle (${partituras.map((p) => p.m).join(', ')})`);
    ok(await js(`!!${H}.objetos.tocadiscos?.grupo?.parent`), 'el tocadiscos está en el refugio');

    seccion('se elige en el panel');
    const panel = await hayPanel();
    if (panel) {
      await js(`${H}.__personal.abrir('pausa'); 1`);
      ok(await pestana('perro'), 'pestaña «Tu perro»');
      const r = [];
      r.push(await escribir('Nombre', 'Tobi'));
      r.push(await tocar('Pelaje', ELEGIDO.perro.pelo));
      r.push(await elegir('Dibujo', 'manchado'));
      r.push(await tocar('Collar', ELEGIDO.perro.collar));
      r.push(await tocar('Pañuelo', ELEGIDO.perro.bandana));
      for (const t of ['Sentarse cuando te quedás quieto', 'Traerte palitos', 'Avisar de noche si anda algo']) r.push(await tocar(t, 'true'));
      ok(r.every((x) => x === 'ok'), `se tocan los botones del perro (${r.join(' ')})`);
      ok(await pestana('botes'), 'pestaña «Tu kayak y tus botes»');
      const b = [await tocar('Casco', ELEGIDO.botes.casco), await escribir('Nombre en la proa', 'La Bruja'), await tocar('Banderín', 'golondrina'), await tocar('Palas del remo', ELEGIDO.botes.pala)];
      ok(b.every((x) => x === 'ok'), `se tocan los botones del kayak (${b.join(' ')})`);
      ok(await pestana('trochita'), 'pestaña «La trochita»');
      const t = [await tocar('Coches', ELEGIDO.trochita.coches), await tocar('Franja y frente', ELEGIDO.trochita.franja), await tocar('Cabina y ténder', ELEGIDO.trochita.cabina), await escribir('Nombre de la locomotora', 'La Patagonia'), await elegir('Silbato', 'doble')];
      ok(t.every((x) => x === 'ok'), `se tocan los botones de la trochita (${t.join(' ')})`);
      for (const id of ['caballo', 'armas', 'musica', 'cuaderno']) ok(await pestana(id), `pestaña ${id}`);
      ok(await js(`!!document.querySelector('#personal-contenido .personal-vista-cuaderno')`), 'el cuaderno muestra su vista para acomodar los adornos');
      // lo que falta, por la misma puerta que el panel (cambiar → guardar → aplicar)
      for (const id of ['caballo', 'armas', 'cuaderno']) await js(`${H}.__personal.cambiar('${id}', ${JSON.stringify(ELEGIDO[id])}); 1`);
      await js(`${H}.__personal.cerrar(); 1`);
    } else {
      console.log('  (sin el panel de main.js: se aplica cada sección directo)');
      await js(`(()=>{ const H = ${H}; H.progreso.personal = { ...(H.progreso.personal || {}), ...${JSON.stringify(ELEGIDO)} }; H.guardar(); return 1 })()`);
    }

    seccion('llega al mundo');
    let e = await mirar();
    ok(e.perro.ap.nombre === 'Tobi' && e.perro.ap.dibujo === 'manchado' && e.perro.pelo && e.perro.panuelo, `el perro: pelaje, manchas y pañuelo (${JSON.stringify(e.perro)})`);
    ok(e.perro.ap.trucos.sentarse && e.perro.ap.trucos.traer && e.perro.ap.trucos.avisar, 'el perro sabe las tres pruebas');
    ok(e.caballo && e.caballo.ap.pelaje === 'tordillo' && e.caballo.pelo && e.caballo.riendas && e.caballo.alforjas, `el caballo: tordillo, riendas y alforjas (${JSON.stringify(e.caballo)})`);
    ok(e.kayak.casco === ELEGIDO.botes.casco && e.kayak.pala === ELEGIDO.botes.pala && e.kayak.nombres === 2 && e.kayak.banderin, `el kayak: casco, palas, nombre a los dos lados y banderín (${JSON.stringify(e.kayak)})`);
    ok(e.tren.nombre === 'La Patagonia' && e.tren.placas === 2 && e.tren.coches && e.tren.franja && e.tren.cabina && e.tren.silbato === 'doble', `la trochita: pintura, nombre y silbato (${JSON.stringify(e.tren)})`);
    ok(e.armas && e.armas.ap.grabado === 'espiral' && e.armas.hacha > antes.armas.hacha && e.armas.chapa === 2, `las armas: mango grabado y la ballesta con nombre (${JSON.stringify(e.armas)})`);
    ok(e.cuaderno && e.cuaderno.hijos === 3 && /\(124, 47, 34\)|#7c2f22/.test(e.cuaderno.sombra), `el cuaderno: tapa, elástico y dos adornos (${JSON.stringify(e.cuaderno)})`);
    ok(!/undefined/.test(await js(`document.getElementById('notas').textContent`)), 'ningún aviso vacío («undefined») al aplicar');
    // la lanza forjada se rearma sola al sacarla
    const lanza = await js(`(()=>{ const H = ${H}, en = H.camara.children.find((c) => c.userData?.enMano).userData.enMano;
      en.mostrar('lanza'); const a = en.modelo('lanza'); H.progreso.cosas.lanzaHielo = 1; en.mostrar('hacha'); en.mostrar('lanza'); const b = en.modelo('lanza');
      delete H.progreso.cosas.lanzaHielo; return { rearmada: a !== b, cintas: !!b.userData.cintas } })()`);
    ok(lanza.rearmada && lanza.cintas, `la lanza forjada se ve distinta y lleva las cintas (${JSON.stringify(lanza)})`);
    // el perro se sienta si te quedás quieto al lado
    const sentado = await js(`(()=>{ const H = ${H}, P = H.perro, j = H.jugador; const p = P.est.pos; j.ubicar(p.x + 2, p.z, 0); j.estado.quieto = 9;
      P.est.estado = 'seguir'; P.est.t = 30; P.est.vel = 0;
      for (let i = 0; i < 120; i++) P.actualizar(0.05, j, H.camara, { noche: 0, guiar: false, existe: () => false }, []);
      return { sentado: +P.est.sentado.toFixed(2), incl: +P.malla.g.rotation.x.toFixed(2) } })()`);
    ok(sentado.sentado > 0.8 && sentado.incl < -0.4, `el perro se sienta al lado tuyo (${JSON.stringify(sentado)})`);

    seccion('la música');
    const p0 = partituras[0];
    const junta = await js(`(()=>{ const H = ${H}, it = H.objetos.items.find((i) => i.id === '${p0.id}');
      const r = H.objetos.usar({ tipo: 'item', it }, () => {}, H.sonido); return { r, tomada: H.progreso.tomados.includes(it.id), m: H.progreso.personal.musica } })()`);
    ok(junta.r?.partitura && junta.tomada && junta.m.halladas.includes(p0.m), `se junta una partitura y queda en el disco (${JSON.stringify(junta.r)})`);
    ok(junta.m.elegida === p0.m, 'la primera que encontrás queda puesta');
    const disco = await js(`(()=>{ const H = ${H}, r = H.objetos.usar({ tipo: 'tocadiscos' }, () => {}, H.sonido); return { r, m: H.progreso.personal.musica } })()`);
    ok(disco.m.encendido === false, `E en el tocadiscos pasa al siguiente y, al final, lo apaga (${JSON.stringify(disco)})`);
    await js(`(()=>{ const H = ${H}; H.objetos.usar({ tipo: 'tocadiscos' }, () => {}, H.sonido); return 1 })()`);
    // adentro del refugio, mirando la mesa: el disco gira si hay audio
    const vitrola = await js(`(()=>{ const H = ${H}, v = H.objetos.tocadiscos, j = H.jugador; j.ubicar(v.pos.x - 1.2, v.pos.z + 0.4, 0); return { giro: v.disco.rotation.y, audio: H.sonido.ctx?.state || 'sin motor' } })()`);
    // (con la ventana escondida el bucle anda lento: se espera a que el disco arranque)
    const suena = await js(`(async ()=>{ for (let i = 0; i < 40; i++) { if (${H}.objetos.tocadiscos.suena()) return true; await new Promise((r) => setTimeout(r, 500)); } return false })()`);
    await esperar(3500);   // unos cuadros para que el plato gire
    const giro = await js(`${H}.objetos.tocadiscos.disco.rotation.y`);
    if (vitrola.audio === 'running') ok(suena && giro !== vitrola.giro, `adentro del refugio suena el disco y el plato gira (${(vitrola.giro - giro).toFixed(2)} rad · ${JSON.stringify(await js(`(()=>{ const H = ${H}; return { ...H.objetos.tocadiscos.estado(), espacio: H.sonido.espacioActual, ahora: H.sonido.ctx.currentTime } })()`))})`);
    else { avisos.push(`sin audio (${vitrola.audio}): no se pudo oír el tocadiscos`); console.log(`  (sin audio: ${vitrola.audio})`); }
    // y al salir se calla
    await js(`(()=>{ const H = ${H}, r = H.T.lugares.refugio; H.jugador.ubicar(r.x + 30, r.z + 30, 0); return 1 })()`);
    const calla = await js(`(async ()=>{ for (let i = 0; i < 40; i++) { if (!${H}.objetos.tocadiscos.suena()) return true; await new Promise((r) => setTimeout(r, 500)); } return false })()`);
    ok(calla, 'afuera del refugio el disco se calla');

    seccion('se guarda y se recarga');
    await js(`${H}.guardar(); 1`);
    await esperar(600);
    await abrir();
    ok(await listo(), 'vuelve a cargar');
    await entrar();
    await js(`(()=>{ const m = new ${H}.THREE.MeshLambertMaterial(); ${H}.THREE_Color = function (hex) { return m.color.clone().set(hex); }; return 1 })()`);
    const guardado = await js(`${H}.progreso.personal`);
    ok(guardado?.perro?.nombre === 'Tobi' && guardado?.botes?.nombre === 'La Bruja' && guardado?.trochita?.silbato === 'doble' && guardado?.armas?.grabado === 'espiral' && guardado?.caballo?.pelaje === 'tordillo', 'lo elegido está en la partida guardada');
    ok(guardado?.musica?.halladas?.includes(p0.m), 'la partitura encontrada sigue en el disco');
    ok(await js(`${H}.objetos.items.find((i) => i.id === '${p0.id}')?.tomado === true`), 'y ya no está en el suelo');
    e = await mirar();
    const aplicado = e.kayak.casco === ELEGIDO.botes.casco && e.tren.placas === 2 && e.armas?.ap.grabado === 'espiral' && e.caballo?.ap.pelaje === 'tordillo';
    if (!aplicado) {
      avisos.push('al cargar no se aplicó lo personal (falta aplicarPersonal() en la carga de main.js)');
      await js(`${H}.__personal?.aplicar?.(); 1`);
      e = await mirar();
    }
    ok(e.perro.ap.nombre === 'Tobi' && e.perro.pelo && e.perro.panuelo, 'el perro sigue siendo Tobi, manchado y con pañuelo');
    ok(e.caballo?.ap.pelaje === 'tordillo' && e.caballo.riendas && e.caballo.alforjas, 'el caballo sigue tordillo, con riendas y alforjas');
    ok(e.kayak.casco === ELEGIDO.botes.casco && e.kayak.nombres === 2 && e.kayak.banderin, 'el kayak sigue azul, con nombre y banderín');
    ok(e.tren.placas === 2 && e.tren.coches && e.tren.silbato === 'doble', 'la trochita sigue pintada, con nombre y su silbato');
    ok(e.armas?.ap.grabado === 'espiral' && e.armas.hacha > antes.armas.hacha && e.armas.chapa === 2, 'las armas siguen como las dejaste');
    ok(e.cuaderno?.hijos === 3, 'el cuaderno sigue con su tapa y sus adornos');
  } catch (err) {
    errores.push('excepción: ' + (err?.message || err));
  } finally {
    if (copiaStorage) {
      // se devuelve lo que había y se traba la escritura: el guardado del beforeunload no lo pisa
      await js(`(()=>{ const c = JSON.parse(${JSON.stringify(copiaStorage)});
        localStorage.clear(); for (const [k, v] of Object.entries(c)) localStorage.setItem(k, v);
        Storage.prototype.setItem = () => {}; Storage.prototype.removeItem = () => {}; Storage.prototype.clear = () => {}; return 1 })()`).catch(() => {});
    }
  }
  for (const a of avisos) console.log(`! ${a}`);
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  console.log('OK humo 2.8 · compás (perro, caballo, kayak, trochita, armas, música, cuaderno)');
  app.exit(0);
});

// Partida real 2.8 (Electron + WebGL): el panel "Personalizar". Se abre con F5 desde la
// portada y desde el juego (y por la pausa y la mochila), se cambia algo en cada sección
// propia (tu personaje, tu interfaz, tu bandera, tu partida) tocando los botones de verdad,
// se mira que llegue al mundo y que siga igual después de recargar. Al final, una partida
// nueva con receta: pocos animales, sin vecinos, y tu ropa que pasa a la nueva.
// Guarda y devuelve el localStorage que había (las pruebas de humo comparten perfil).
// Uso: npx electron pruebas/humo-2-8.cjs     (HUMO_PERFIL=<carpeta> para un perfil aparte)
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: false, width: 1100, height: 700, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300));
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
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__personal)').catch(() => false)) return true; }
    return false;
  };
  const tecla = (code) => js(`document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', key: '${code}', bubbles: true })); 1`);
  const pestana = (id) => js(`(()=>{ const b = document.getElementById('personal-pestana-${id}'); if (!b) return false; b.click(); return document.getElementById('personal-contenido').dataset.seccion === '${id}' })()`);
  // toca el botón con ese data-valor dentro de la fila que tiene ese título
  const tocar = (fila, valor) => js(`(()=>{ const f = [...document.querySelectorAll('#personal-contenido .personal-fila')].find((x) => x.firstChild?.textContent === ${JSON.stringify(fila)});
    if (!f) return 'sin fila';
    const b = [...f.querySelectorAll('button[data-valor]')].find((x) => x.dataset.valor === ${JSON.stringify(String(valor))});
    if (!b) return 'sin botón'; if (b.disabled) return 'bloqueado'; b.click(); return 'ok' })()`);
  const H = 'window.__hojarasca';
  let copiaStorage = null;

  try {
    await abrir();
    ok(await listo(), 'el juego cargó');
    copiaStorage = await js(`JSON.stringify(Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])))`);
    // con sombras (calidad media, fija), para ver la silueta en el mapa de sombras
    if (!(await js(`${H}.__cielo().sol.castShadow`))) {
      await js(`(()=>{ const a = JSON.parse(localStorage.getItem('hojarasca-ajustes-v1') || '{}'); a.calidad = 'media'; a.autoCalidad = false;
        localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(a)); return 1 })()`);
      await abrir();
      ok(await listo(), 'recargó con sombras');
    }
    // una partida Relax limpia en la ranura 1 (lo que había se devuelve al final)
    await js(`(()=>{ const P = ${H}.progreso; P.personal = null; ${H}.ajustes.modo = 'relax'; return 1 })()`);

    seccion('se abre desde la portada con F5');
    await tecla('F5');
    let e = await js(`({ abierto: ${H}.__personal.abierto(), inicio: document.getElementById('inicio').classList.contains('oculto'),
      pestanas: [...document.querySelectorAll('#personal-pestanas button')].map((b) => b.textContent) })`);
    ok(e.abierto && e.inicio, 'F5 abre Personalizar sobre la portada');
    for (const t of ['Tu personaje', 'Tu interfaz', 'Tu bandera', 'Tu partida']) ok(e.pestanas.includes(t), `hay pestaña «${t}»`);
    await tecla('Escape');
    ok(await js(`!${H}.__personal.abierto() && !document.getElementById('inicio').classList.contains('oculto')`), 'Esc vuelve a la portada');

    seccion('entrar y abrir desde el juego');
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
    await js(`${H}.volverAlJuego(); 1`);
    await tecla('F5');
    e = await js(`({ abierto: ${H}.__personal.abierto(), modo: document.getElementById('pausa').classList.contains('oculto') && ${H}.__personal.abierto() })`);
    ok(e.abierto, 'F5 en el juego abre el panel (por la pausa: el mundo se detiene)');
    await tecla('Escape');
    ok(await js(`!document.getElementById('pausa').classList.contains('oculto') && !${H}.__personal.abierto()`), 'Esc vuelve a la pausa');
    await js(`document.getElementById('btn-personalizar').click(); 1`);
    ok(await js(`${H}.__personal.abierto()`), 'el botón de la pausa lo abre');

    seccion('tu personaje');
    ok(await pestana('personaje'), 'pestaña personaje');
    ok(await tocar('Piel', 'oscura') === 'ok', 'elegir piel oscura');
    ok(await tocar('Peinado', 'trenza') === 'ok', 'elegir trenza');
    ok(await tocar('Gorro de lana', 'false') === 'ok', 'sacarse el gorro');
    ok(await tocar('Guantes', 'true') === 'ok', 'ponerse guantes');
    ok(await tocar('Guantes', 'maqui') === 'bloqueado', 'el azul maqui está bloqueado sin anotarlo');
    ok(await tocar('Poncho', 'true') === 'sin botón', 'el poncho no aparece sin haberlo tejido');
    e = await js(`(()=>{ const d = ${H}.__personal.datos().personaje, c = ${H}.__personal.cuerpo(), m = ${H}.__personal.mano();
      let mallas = 0; c.cuerpo().traverse((o) => { if (o.isMesh) mallas++; });
      const s = c.silueta;
      return { d, mallas, oculto: !c.cuerpo().visible, sombra: s.castShadow && s.material.colorWrite === false && s.material.depthWrite === false && s.geometry.attributes.position.count > 300,
        mano: m.grupo ? (m.grupo.children[0].userData.guante || '#' + m.grupo.children[0].material.color.getHexString()) : null } })()`);
    ok(e.d.piel === 'oscura' && e.d.peinado === 'trenza' && e.d.gorro === false && e.d.guantes === true, `se guardó en progreso.personal (${JSON.stringify(e.d).slice(0, 90)})`);
    // 3.4: el cuerpo se funde por grupo que se mueve (de 18 mallas a 6); 3.7.0: estilo P con huesos (2 mallas)
    ok(e.mallas >= 1 && e.oculto, `el cuerpo existe (${e.mallas} piezas) y fuera del modo foto no se ve`);
    ok(e.sombra, 'su silueta de sombra: una malla que no pinta pero hace sombra');
    ok(e.mano === '#8d8a82', `la mano en primera persona lleva el guante gris (${e.mano})`);
    // la sombra entra de verdad en el mapa de sombras (quieto, con sombras encendidas)
    e = await js(`(()=>{ const H = ${H}; if (!H.__cielo().sol.castShadow) return 'sin sombras';
      const s = H.__personal.cuerpo().silueta; let n = 0; s.onBeforeShadow = () => { n++; };
      H.__personal.cerrar(); H.volverAlJuego(); H.jugador.estado.velocidadActual = 0;
      // el límite de cuadros descarta los que llegan seguidos: sin él, cada __bucle cuenta
      const limite = H.ajustes.limiteFps; H.ajustes.limiteFps = 'libre';
      for (let i = 0; i < 40; i++) { H.renderer.shadowMap.needsUpdate = true; H.__bucle(); }   // la sombra aparece tras 0,35 s quieto: al menos 21 cuadros
      s.onBeforeShadow = () => {}; H.ajustes.limiteFps = limite; H.abrir('pausa'); H.__personal.abrir('pausa'); return n })()`);
    ok(e === 'sin sombras' || e > 0, `la silueta se dibuja en el mapa de sombras (${e})`);
    await pestana('personaje');
    // el poncho, una vez tejido, abriga
    await js(`${H}.progreso.cosas.poncho = 1; ${H}.__personal.abrir('pausa'); 1`);
    await pestana('personaje');
    ok(await tocar('Poncho', 'true') === 'ok', 'con un poncho tejido se lo puede poner');
    e = await js(`(()=>{ const H = ${H}; H.abrirModoFoto(true); const v = H.__personal.cuerpo().cuerpo().visible; H.abrirModoFoto(false); return { poncho: H.progreso.personal.personaje.poncho, foto: v, despues: H.__personal.cuerpo().cuerpo().visible } })()`);
    ok(e.poncho === true, 'poncho puesto');
    ok(e.foto && !e.despues, 'en el modo foto te ves, y al salir no');
    await js(`${H}.abrir('pausa'); ${H}.__personal.abrir('pausa'); 1`);

    seccion('tu interfaz');
    ok(await pestana('interfaz'), 'pestaña interfaz');
    ok(await tocar('Mira', 'cruz') === 'ok', 'mira en cruz');
    ok(await tocar('Modo mínimo', 'true') === 'ok', 'modo mínimo');
    ok(await tocar('Brújula', 'false') === 'ok', 'sin brújula');
    ok(await tocar('Color de los avisos', 'lago') === 'ok', 'avisos color lago');
    ok(await tocar('Tamaño de letra', '1.1') === 'ok', 'letra un poco más grande');
    e = await js(`(()=>{ const h = document.getElementById('hud'), r = document.documentElement;
      return { clases: h.className, acento: getComputedStyle(r).getPropertyValue('--acento').trim(), letra: getComputedStyle(r).getPropertyValue('--escala-letra').trim(),
        recursos: getComputedStyle(document.getElementById('recursos')).display, brujula: getComputedStyle(document.getElementById('brujula')).display,
        mira: getComputedStyle(document.getElementById('mira'), '::before').content } })()`);
    ok(/minimalista/.test(e.clases) && /sin-brujula/.test(e.clases) && /mira-cruz/.test(e.clases), `clases del HUD (${e.clases})`);
    ok(e.acento === '#7cc4f0', `el acento llega al CSS (${e.acento})`);
    ok(Math.abs(Number(e.letra) - 1.1 * ({ normal: 1, grande: 1.2, enorme: 1.45 }[(await js(`${H}.ajustes.tamanoLetra`))] || 1)) < 0.01, `la letra se afina encima de la accesibilidad (${e.letra})`);
    ok(e.recursos === 'none' && e.brujula === 'none', 'el modo mínimo esconde las ramitas y la brújula se va');
    ok(e.mira !== 'none' && e.mira !== 'normal', 'la mira en cruz se dibuja');

    seccion('tu bandera');
    ok(await pestana('bandera'), 'pestaña bandera');
    ok(await tocar('Dibujo', 'pez') === 'ok', 'dibujo: trucha');
    ok(await tocar('Primer color', '#b8432f') === 'ok', 'primer color: rojo notro');
    ok(await tocar('Colores', '2') === 'ok', 'dos colores');
    e = await js(`(()=>{ const t = ${H}.__personal.texturaBandera(), c = t.image.getContext('2d'), px = c.getImageData(10, 10, 1, 1).data;
      const b = ${H}.__personal.bandera(); const m = b.mastil;
      const r = ${H}.T.lugares.refugio, v = new ${H}.THREE.Vector3(); if (m) { m.updateWorldMatrix(true, false); m.getWorldPosition(v); }
      const d = m ? Math.hypot(v.x - r.x, v.z - r.z) : -1;
      let panos = 0; ${H}.escena.traverse((o) => { if (o.isMesh && o.material?.map === t && o.visible) panos++; });
      return { px: [px[0], px[1], px[2]], d, panos, datos: ${H}.__personal.datos().bandera, vista: !!document.querySelector('#personal-contenido canvas') } })()`);
    ok(e.px[0] > 150 && e.px[1] < 90, `la textura se repintó con el rojo (${e.px})`);
    ok(e.d > 3 && e.d < 12, `el mástil está junto al refugio (${e.d.toFixed(1)} m)`);
    ok(e.panos === 1, `un solo paño con tu bandera en el mástil (${e.panos})`);
    ok(e.datos.icono === 'pez' && e.datos.cuantos === 2, 'guardada');
    ok(e.vista, 'el panel muestra cómo queda');

    seccion('tu partida');
    ok(await pestana('partida'), 'pestaña partida');
    ok(await tocar('Animales', 'pocos') === 'ok', 'pocos animales');
    ok(await tocar('Vecinos', 'false') === 'ok', 'sin vecinos');
    ok(await tocar('Estación', 'igual') === 'ok', 'estación como está');
    e = await js(`(()=>{ const i = document.querySelector('#personal-contenido .personal-texto'); i.value = 'Tranquilo y solo';
      i.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true })); return ${H}.__personal.datos().partida })()`);
    ok(e.recetas.length === 1 && e.recetas[0].nombre === 'Tranquilo y solo' && e.recetas[0].animales === 'pocos', 'receta guardada con nombre');
    ok(e.actual.animales === 'normal' && e.actual.vecinos === true, 'la partida en curso no cambia');

    seccion('la mochila tiene el botón');
    await js(`${H}.__personal.cerrar(); ${H}.volverAlJuego(); 1`);
    await tecla('KeyI');
    ok(await js(`!document.getElementById('mochila').classList.contains('oculto')`), 'mochila abierta');
    await js(`document.getElementById('btn-personalizar-mochila').click(); 1`);
    ok(await js(`${H}.__personal.abierto() && document.getElementById('mochila').classList.contains('oculto')`), 'el botón de la mochila abre el panel y la cierra');
    await js(`${H}.__personal.cerrar(); 1`);

    seccion('después de recargar');
    await js(`${H}.guardar(); 1`);
    await abrir();
    ok(await listo(), 'recargó');
    e = await js(`(()=>{ const d = ${H}.progreso.personal, h = document.getElementById('hud');
      const px = ${H}.__personal.texturaBandera().image.getContext('2d').getImageData(10, 10, 1, 1).data;
      return { piel: d.personaje.piel, poncho: d.personaje.poncho, clases: h.className, acento: getComputedStyle(document.documentElement).getPropertyValue('--acento').trim(),
        icono: d.bandera.icono, rojo: px[0] > 150 && px[1] < 90, recetas: d.partida.recetas.length, mano: (${H}.__personal.mano().grupo.children[0].userData.guante || '#' + ${H}.__personal.mano().grupo.children[0].material.color.getHexString()) } })()`);
    ok(e.piel === 'oscura' && e.poncho === true, 'tu personaje sigue igual');
    ok(/minimalista/.test(e.clases) && /mira-cruz/.test(e.clases) && e.acento === '#7cc4f0', 'tu interfaz se aplicó al cargar');
    ok(e.icono === 'pez' && e.rojo, 'tu bandera se volvió a pintar');
    ok(e.recetas === 1, 'tus recetas siguen');
    ok(e.mano === '#8d8a82', 'la mano sigue con guante');

    seccion('partida nueva con la receta');
    const antes = await js(`${H}.fauna.pudues.length`);
    await js(`(()=>{ window.confirm = () => true; ${H}.__personal.abrir('inicio'); return 1 })()`);
    await pestana('partida');
    await js(`(()=>{ const b = [...document.querySelectorAll('#personal-contenido button')].find((x) => /partida nueva/.test(x.textContent)); b.click(); return 1 })()`);
    await esperar(1500);
    ok(await listo(), 'recargó con la partida nueva');
    e = await js(`(()=>{ const P = ${H}.progreso; return { dia: P.dia, pos: P.pos, actual: P.personal.partida.actual, piel: P.personal.personaje.piel, recetas: P.personal.partida.recetas.length, pudues: ${H}.fauna.pudues.length } })()`);
    ok(e.actual.animales === 'pocos' && e.actual.vecinos === false, `la partida nueva salió con la receta (${JSON.stringify(e.actual)})`);
    ok(e.pudues < antes, `menos pudúes (${antes} → ${e.pudues})`);
    ok(e.piel === 'oscura' && e.recetas === 1, 'tu personaje y tus recetas pasaron a la nueva');
    ok(!e.pos, 'es una partida nueva de verdad');
    const avisos = await js(`${H}.__avisos()`);
    ok(!avisos.some((a) => /undefined|NaN/.test(a)), `ningún aviso roto (${avisos.filter((a) => /undefined|NaN/.test(a)).join(' | ')})`);
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
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  console.log('OK humo 2.8 · personalizar');
  app.exit(0);
});

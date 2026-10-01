// Partida real 1.8: el juego en ingles. Portada, menus, guia, cuaderno, avisos del HUD
// y los mensajes que se arman con variables.
// Uso: npx electron pruebas/humo-idioma.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
// sólo pruebas: en algunos entornos el renderer con sandbox no carga ni una página (ERR_FAILED)
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  const w = new BrowserWindow({ show: false, width: 1024, height: 640, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill/.test(m)) errores.push(m.slice(0, 300));
  });
  const js = (c) => w.webContents.executeJavaScript(c);
  const ok = (cond, texto) => { pasos.push(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const url = path.join(raiz, 'index.html');
  const cargar = async () => {
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) return true; }
    return false;
  };
  try {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, idioma:'en'})); 1`);
    ok(await cargar(), 'carga en ingles');

    // ---- la portada
    const portada = await js(`(()=>({entrar:document.getElementById('btn-entrar').textContent,
      partidas:document.getElementById('btn-partidas-inicio').textContent,
      guia:document.getElementById('btn-guia-inicio').textContent,
      modo:document.querySelector('.modo-juego span').textContent,
      texto:document.getElementById('inicio').textContent,
      idiomaEs:!!document.querySelector('[data-ajuste="idioma"] [data-valor="es"]')}))()`);
    ok(/forest|Enter/i.test(portada.entrar), 'el boton de entrar esta en ingles: ' + portada.entrar);
    ok(/Saved games/i.test(portada.partidas), 'y el de partidas: ' + portada.partidas);
    ok(/guide/i.test(portada.guia), 'y el de la guia: ' + portada.guia);
    ok(/mode/i.test(portada.modo), 'y el rotulo del modo: ' + portada.modo);
    ok(portada.idiomaEs, 'el selector de idioma sigue ofreciendo el castellano');
    ok(!/Recorrer|Empezar un recorrido|Créditos/.test(portada.texto), 'no quedo texto suelto en castellano en la portada');

    // ---- la guia
    const guia = await js(`(()=>{document.getElementById('btn-guia-inicio').click();
      const t = document.getElementById('guia-contenido').textContent;
      const pest = [...document.querySelectorAll('#guia-contenido .guia-pestana')].map(b=>b.textContent);
      document.getElementById('cerrar-guia').click();
      return {t, pest}})()`);
    ok(guia.pest.length >= 4 && !/Primeros pasos|Recursos/.test(guia.pest.join(' ')), 'las pestanas de la guia estan traducidas: ' + guia.pest.join(' · '));
    ok(/axe|log|plank/i.test(guia.t), 'el contenido de la guia esta en ingles');

    // ---- adentro del juego: avisos y HUD
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2000);
    // Ojo: el HUD apila hasta cinco avisos, así que hay que mirar el último —el que
    // se acaba de agregar— y no todo el cajón, o la prueba pasa con el aviso de otro.
    const avisos = await js(`(()=>{const H=window.__hojarasca;
      const ultima = () => document.getElementById('notas').lastElementChild.textContent;
      H.nota('Plantaste un renoval', 'Un coihue. Va a tardar 6 días en levantar');
      const n = ultima();
      // un mensaje armado con variables, que se reconoce por molde
      H.nota('Hachazo 2 de 3', 'Seguí dándole con H');
      const conMolde = ultima();
      return {n, conMolde, dicc:H.traductor.cuantos, faltan:H.traductor.faltantes.length}})()`);
    ok(/sapling|planted/i.test(avisos.n), 'los avisos salen en ingles: ' + avisos.n.slice(0, 60));
    ok(/Axe blow 2 of 3|blow 2/i.test(avisos.conMolde), 'los mensajes con numeros tambien: ' + avisos.conMolde.slice(0, 50));
    ok(avisos.dicc > 1500, `el diccionario esta cargado (${avisos.dicc} textos)`);

    // ---- el cuaderno, que es el texto mas largo del juego
    const cuaderno = await js(`(()=>{const H=window.__hojarasca;
      H.progreso.entradas.coihue = {dia:1, hora:9};
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyJ',bubbles:true}));
      const t = document.getElementById('cuaderno').textContent;
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyJ',bubbles:true}));
      return t})()`);
    ok(/Species and places|Notebook|entries/i.test(cuaderno), 'el cuaderno esta en ingles');
    ok(!/Sin descubrir/.test(cuaderno), 'no quedo «Sin descubrir» en castellano');

    // ---- una sola palabra para cada cosa
    // Las fichas sin descubrir salen como «Sin descubrir», así que primero se dan por
    // vistas las que interesan: el perro, los piñones y el puesto propio.
    const mezcla = await js(`(()=>{const H=window.__hojarasca;
      for (const id of ['perro','pinones-tostados','puesto-propio','mallin','magallanes'])
        H.progreso.entradas[id] = {dia:1, hora:9};
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyJ',bubbles:true}));
      const t = document.getElementById('cuaderno').textContent;
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyJ',bubbles:true}));
      return t})()`);
    const sueltos = ['pine nut', 'little train', 'stockpile', "carpenter's bench"].filter((p) => mezcla.toLowerCase().includes(p));
    ok(!sueltos.length, 'el cuaderno no mezcla dos nombres para la misma cosa' + (sueltos.length ? ': ' + sueltos.join(', ') : ''));
    const esperados = ['piñones', 'Sheepdog', 'puesto', 'Mallín'].filter((p) => mezcla.includes(p));
    ok(esperados.length === 4, 'y usa los nombres que quedaron: ' + esperados.join(', '));

    // ---- el panel de partidas, que se dibuja al vuelo
    const partidas = await js(`(()=>{const H=window.__hojarasca;
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',bubbles:true}));
      document.getElementById('btn-partidas').click();
      const t = document.getElementById('partidas-lista').textContent;
      document.getElementById('cerrar-partidas').click();
      document.getElementById('btn-seguir').click();
      return t})()`);
    ok(/save|Empty|Start here/i.test(partidas), 'el panel de partidas se traduce al dibujarse: ' + partidas.slice(0, 60));
    ok(!/Partida 1|Vacía/.test(partidas), 'sin restos en castellano');

    // ---- y volver al castellano deja todo como estaba
    await js(`(()=>{const H=window.__hojarasca; H.guardar();
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',bubbles:true}));
      document.getElementById('btn-inicio').click();
      document.querySelector('[data-ajuste="idioma"] [data-valor="es"]').click(); return 1})()`);
    await esperar(1500);
    ok(await cargar(), 'volver al castellano recarga el juego');
    const vuelta = await js(`(()=>({entrar:document.getElementById('btn-entrar').textContent,
      idioma:window.__hojarasca.ajustes.idioma, dicc:window.__hojarasca.traductor.cuantos}))()`);
    ok(vuelta.idioma === 'es' && /bosque|Seguir/i.test(vuelta.entrar), 'el juego vuelve al castellano: ' + vuelta.entrar);
    ok(vuelta.dicc === 0, 'y en castellano el traductor no carga nada');
  } catch (e) {
    errores.push('excepcion: ' + (e && e.message ? e.message : e));
  }
  console.log(pasos.join('\n'));
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});

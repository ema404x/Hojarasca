// 3.8.1 (textos): partida real. El nombre largo del modo («La noche de los duendes» / «The Night of the
// Goblins») no se corta ni desborda en la portada (botón de dos opciones), la pausa ni la lista de partidas,
// en castellano ni en inglés, a 1024×640 y a 800×600. Y en inglés, los avisos del modo (robo, cofre, subida,
// corazón, logros) y el cuaderno no dejan textos sin traducir con vocabulario de la 3.8.
// Uso: node herramientas/suite-paralela.cjs <salida> 1 humo-3-8-1-textos.cjs
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(__dirname, 'salidas', '3-8-1-textos');
fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
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
  const foto = async (nombre) => fs.writeFileSync(path.join(salida, nombre + '.jpg'), (await w.webContents.capturePage()).toJPEG(80));
  const url = path.join(raiz, 'index.html');
  const cargar = async () => {
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) return true; }
    return false;
  };
  // Los elementos visibles con el nombre del modo adentro: ¿se salen de su caja o de la pantalla?
  const medir = (sel, nombre) => js(`(()=>{const out=[];
    for (const el of document.querySelectorAll(${JSON.stringify(sel)})) {
      if (!el.getClientRects().length) continue;
      if (![...el.childNodes].some((n)=>n.nodeType===3 && n.textContent.includes(${JSON.stringify(nombre)}))) continue;
      const b = el.getBoundingClientRect(), cs = getComputedStyle(el);
      const bloque = cs.display !== 'inline';
      const desborda = bloque && el.scrollWidth > el.clientWidth + 1;
      const fuera = b.right > innerWidth + 0.5 || b.left < -0.5;
      const corta = cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1;
      out.push({ que: el.tagName + (el.id ? '#' + el.id : ''), texto: el.textContent.trim().slice(0, 70), desborda, fuera, corta, alto: Math.round(b.height), ancho: Math.round(b.width) });
    }
    return out})()`);
  const revisar = (lista, donde) => {
    ok(lista.length > 0, `${donde}: está el nombre del modo`);
    for (const e of lista) ok(!e.desborda && !e.fuera && !e.corta, `${donde}: «${e.texto}» entra (${e.que} ${e.ancho}×${e.alto}${e.desborda ? ', desborda' : ''}${e.fuera ? ', fuera de pantalla' : ''}${e.corta ? ', cortado' : ''})`);
  };

  try {
    for (const idioma of ['es', 'en']) {
      const nombre = idioma === 'es' ? 'La noche de los duendes' : 'The Night of the Goblins';
      w.setContentSize(1024, 640);
      await w.loadFile(url, { search: '?debug=1' });
      await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, idioma:'${idioma}'})); 1`);
      ok(await cargar(), `carga La noche de los duendes (${idioma})`);
      await esperar(800);
      for (const [an, al] of [[1024, 640], [800, 600]]) {
        w.setContentSize(an, al);
        await esperar(500);
        // ---- la portada: el botón de dos opciones
        const seg = await js(`(()=>{const r=document.querySelector('.modo-juego .segmentos button[data-valor="relax"]'), d=document.querySelector('.modo-juego .segmentos button[data-valor="desafio"]'), s=d.parentElement.getBoundingClientRect(), p=document.querySelector('.modo-juego').getBoundingClientRect();
          return {relax:r.getBoundingClientRect().height, duendes:d.getBoundingClientRect().height, texto:d.textContent, der:s.right, ancho:innerWidth, padre:p.right}})()`);
        ok(seg.texto.includes(nombre), `portada ${idioma} ${an}: el botón dice «${seg.texto}»`);
        ok(seg.duendes <= 50 && Math.abs(seg.duendes - seg.relax) < 2, `portada ${idioma} ${an}: el nombre va en un solo renglón (alto ${seg.duendes}, el Relax ${seg.relax})`);
        ok(seg.der <= seg.ancho, `portada ${idioma} ${an}: el botón de dos opciones entra en la pantalla (${Math.round(seg.der)} de ${seg.ancho})`);
        revisar(await medir('#inicio *', nombre), `portada ${idioma} ${an}`);
        await foto(`portada-${idioma}-${an}`);
        // ---- la lista de partidas desde la portada
        await js(`document.getElementById('btn-partidas-inicio').click(); 1`);
        await esperar(600);
        revisar(await medir('#partidas-lista *', nombre), `partidas ${idioma} ${an}`);
        await foto(`partidas-${idioma}-${an}`);
        await js(`document.getElementById('cerrar-partidas').click(); 1`);
        await esperar(300);
      }
      // ---- adentro: la pausa
      w.setContentSize(1024, 640);
      await js(`document.getElementById('btn-entrar').click(); 1`);
      await esperar(4000);
      for (const [an, al] of [[1024, 640], [800, 600]]) {
        w.setContentSize(an, al);
        await js(`(()=>{const H=window.__hojarasca; H.abrir('pausa'); return 1})()`);
        await esperar(600);
        revisar(await medir('#pausa *', nombre), `pausa ${idioma} ${an}`);
        await foto(`pausa-${idioma}-${an}`);
        await js(`document.getElementById('btn-partidas').click(); 1`);
        await esperar(600);
        revisar(await medir('#partidas-lista *', nombre), `partidas (pausa) ${idioma} ${an}`);
        await js(`document.getElementById('cerrar-partidas').click(); window.__hojarasca.volverAlJuego(); 1`);
        await esperar(400);
      }
      if (idioma !== 'en') continue;
      w.setContentSize(1024, 640);
      // ---- en inglés: los avisos del modo y el cuaderno, con un recolector de lo que falta
      await js(`(()=>{const H=window.__hojarasca;
        const avisos=[['¡Un duende te robó!','Se llevó una semilla dorada y sale corriendo. Pegale y lo suelta'],['Lo recuperaste','La semilla dorada vuelve a tus cosas'],
          ['Lo encontraste','La tabla que se llevó un duende'],['Te devolvieron lo robado','Con la primera luz, los duendes dejaron todo en la puerta'],
          ['Brotó un cofre entre las raíces','Está cerca, con un brillo dorado. Pasá por encima para abrirlo'],['Cofre del alba','2 semillas doradas'],
          ['El tronco hueco','Subí por la escalera de raíces hasta la puerta del corazón. Si te caés, volvés al último descanso'],['Volviste al último descanso','La escalera de raíces sigue para arriba'],
          ['Le reventaste una piedra de ámbar','Quedan 2'],['¡Cayó el Rey Duende!','El Coihue se viene abajo. ¡Afuera, rápido!'],['El Coihue te escupió','Caíste adentro y las raíces te sacaron al valle. La puertita sigue abierta: cuando estés listo, volvé a entrar (el Rey Duende se recompone)'],
          ['El asedio','Cortá las raíces de día (están en el mapa). De noche van a querer recuperar lo que les saques. Con tres zonas libres se abre la puertita del Coihue']];
        for (const [a,b] of avisos) H.nota(a,b);
        document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyJ',bubbles:true}));
        document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyJ',bubbles:true}));
        return 1})()`);
      await esperar(800);
      const falta = await js(`window.__hojarasca.traductor.faltantes.map(([t])=>t)`);
      fs.writeFileSync(path.join(salida, 'faltantes-en.txt'), falta.join('\n'));
      const de38 = falta.filter((t) => /duende|semilla|Coihue|Rey Duende|cofre|lechuz|madriguera|noche de los duendes|robó|puertita|ámbar/i.test(t));
      ok(de38.length === 0, `en inglés no quedan textos de la 3.8 sin traducir (${falta.length} faltantes en total, ver faltantes-en.txt)${de38.length ? ':\n  ' + de38.slice(0, 20).join('\n  ') : ''}`);
    }
    // 3.8.2: en el Relax, el ícono del cristal en la mochila vuelve a ser el cristal (celeste), no la semilla dorada
    w.setContentSize(1024, 640);
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, idioma:'es'})); 1`);
    ok(await cargar(), 'carga el Relax');
    await esperar(800);
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(4000);
    await js(`(()=>{ const H = window.__hojarasca; H.conMateriales((m) => { m.cristal = (m.cristal || 0) + 5; }); H.volverAlJuego(); return 1 })()`);
    await esperar(300);
    await js(`document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyI', bubbles: true })); 1`);
    await esperar(800);
    const color = await js(`(async ()=>{ const img = [...document.querySelectorAll('#mochila-rejilla img')].find((i) => i.parentElement.textContent.includes('(5)') && /semilla|cristal/i.test(i.alt));
      if (!img) return null; await img.decode().catch(() => {}); const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.drawImage(img, 0, 0, 64, 64);
      const d = x.getImageData(30, 30, 1, 1).data; img.scrollIntoView({ block: 'center' }); return { r: d[0], g: d[1], b: d[2], modo: window.__hojarasca.modoJuego } })()`);
    ok(!!color, 'Relax: el cristal está en la mochila');
    ok(color && color.modo === 'relax' && color.b > 180 && color.g > 180 && color.r < 200, `Relax: el ícono del cristal es celeste, no dorado (${JSON.stringify(color)})`);
    await esperar(300);
    fs.writeFileSync(path.join(salida, 'cristal-relax.png'), (await w.webContents.capturePage()).toPNG());
  } catch (e) {
    errores.push('excepcion: ' + (e && e.message ? e.message : e));
  }
  console.log(pasos.join('\n'));
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});

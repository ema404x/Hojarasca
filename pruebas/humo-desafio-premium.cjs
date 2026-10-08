// Partida real del Desafío premium (Electron + WebGL): tutorial, taller por categorías,
// 3.8.0: los textos que mira esta partida dicen lo de los duendes (duendes, Coihue Viejo, madrigueras).
// armas nuevas y mejoras, bloqueo y esquiva, defensas activas (antorchas, campana, pozo,
// red, barril, torre), martillo y refuerzos, perro, compañeros, restos de naves y planos,
// noches especiales, logros, cámara lenta y la nave nodriza hasta la victoria.
// Uso: npx electron pruebas/humo-desafio-premium.cjs   → pruebas/salidas/desafio-premium/
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(__dirname, 'salidas', 'desafio-premium');
fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
// sólo pruebas: en algunos entornos el renderer con sandbox no carga ni una página (ERR_FAILED)
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Error|Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = '';
  const js = (c, limite = 90000) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, rej) => setTimeout(() => rej(new Error(`sin respuesta ${limite / 1000}s en ${donde}`)), limite)),
  ]);
  const ok = (cond, texto) => { pasos.push(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  // la ventana oculta sin GPU casi no dibuja: la simulación avanza en pasos fijos
  const simular = (seg) => js(`(()=>{const H=window.__hojarasca; for(let i=0;i<${Math.round(seg / 0.05)};i++){ H.progreso.horas += 0.05*24/(30*60); H.desafio.actualizar(0.05,{noche:1, dtReal:0.05}); } return 1})()`);
  const foto = async (n) => {
    const url = await js(`(()=>{const H=window.__hojarasca; H.renderer.render(H.escena,H.camara); return H.renderer.domElement.toDataURL('image/jpeg',0.82)})()`);
    fs.writeFileSync(path.join(salida, n + '.jpg'), Buffer.from(url.split(',')[1], 'base64'));
  };
  const url = path.join(raiz, 'index.html');
  try {
    donde = 'carga';
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'baja', clima:'despejado', musica:true, modo:'desafio'})); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    let listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca').catch(() => false); }
    ok(listo, 'el Desafío carga');
    ok(await js(`!document.getElementById('btn-logros-inicio').classList.contains('oculto')`), 'botón de logros en la portada');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(1500);
    await simular(1);
    ok(await js(`!document.getElementById('tutorial').classList.contains('oculto') && document.querySelectorAll('#tutorial p').length === 7`), 'tutorial del primer día visible con 7 pasos');

    // ---- taller por categorías
    donde = 'taller';
    const t = await js(`(()=>{const H=window.__hojarasca, D=H.desafio, P=H.progreso; Object.assign(P.materiales,{tronco:80,tabla:80,piedra:80,cristal:20}); P.ramitas=10;
      const tecla=(c)=>document.dispatchEvent(new KeyboardEvent('keydown',{code:c,bubbles:true}));
      tecla('KeyK'); const cats=document.querySelectorAll('#taller-categorias button').length;
      tecla('Digit1'); tecla('Digit2'); tecla('Digit4');              // armas: lanza, honda, martillo
      tecla('Tab'); tecla('Digit2');                                   // munición: boleadoras
      tecla('Tab'); tecla('Digit1');                                   // mejoras: punta de cristal
      tecla('Escape');
      return {cats, lanza:!!P.cosas.lanza, honda:!!P.cosas.honda, martillo:!!P.cosas.martillo, bol:P.desafio.boleadoras, cristal:!!P.cosas.lanzaCristal, hechas:P.desafio.recetasHechas.length,
        barra:[...document.querySelectorAll('#barra .ranura img')].map(i=>i.alt)}})()`);
    ok(t.cats === 7, 'el taller tiene 7 categorías (la forja de la 2.1; arrojadizas y equipo de la 2.5, al final)');
    ok(t.lanza && t.honda && t.martillo && t.bol === 3 && t.cristal && t.hechas === 5, `fabricación por categorías (${t.hechas} recetas)`);
    ok(t.barra.includes('Honda de cuero') && t.barra.includes('Boleadoras') && t.barra.includes('Lanza con punta dorada'), 'las armas nuevas aparecen en la barra');

    // ---- construir defensas nuevas delante del jugador
    donde = 'construir';
    const c = await js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado, O=H.obras; const res={};
      const poner=(id,d,l)=>{O.elegir(H.PLANOS.find(q=>q.id===id)); const x=js.pos.x-Math.sin(js.yaw)*d+Math.cos(js.yaw)*l, z=js.pos.z-Math.cos(js.yaw)*d-Math.sin(js.yaw)*l;
        const r=O.fundar(x,z,js.yaw,js.pos.y); if(!r.ok) return res[id]=r.motivo; const a=O.avanzar(r.obra,H.progreso.materiales); res[id]=a.ok?true:a.motivo; return r.obra;};
      poner('empalizada',9,-3.1); poner('empalizada',9,3.1); poner('porton-empalizada',9,0); poner('antorcha',6,2.2); poner('campana',4,-4.5);
      poner('torre-vigia',5,7); poner('pozo',16,0); poner('red-cristal',20,-3); poner('barril-resina',24,4); O.elegir(null);
      H.progreso.obras=O.obras.map(o=>o.datos); H.desafio.defensas.refrescar(); return res})()`);
    for (const [id, r] of Object.entries(c)) ok(r === true, `${id} construida ${r === true ? '' : '(' + r + ')'}`);
    await simular(2);
    const tut = await js(`window.__hojarasca.progreso.desafio.tutorial`);
    ok(tut >= 5, `el tutorial avanza solo al hacer cada paso (${tut}/6)`);
    ok(await js(`window.__hojarasca.desafio.defensas.antorchas.every(o=>!!o.userLlama)`), 'las antorchas tienen fuego');
    await foto('01-base-dia');

    // ---- antorcha: se apaga y se vuelve a prender con F
    donde = 'antorcha';
    const an = await js(`(()=>{const H=window.__hojarasca, D=H.desafio, o=D.defensas.antorchas[0]; D.defensas.apagar(o,'bruto'); const apagada=o.datos.apagada;
      H.jugador.ubicar(o.datos.x+1, o.datos.z, 0); document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyF',bubbles:true})); return {apagada, prendida:!o.datos.apagada}})()`);
    ok(an.apagada && an.prendida, 'la antorcha apagada se prende de nuevo con F');

    // ---- torre de vigía: arriba se pega más fuerte
    donde = 'torre';
    const tv = await js(`(()=>{const H=window.__hojarasca, D=H.desafio, o=H.obras.obras.find(q=>q.plano.id==='torre-vigia'); const js=H.jugador.estado;
      js.pos.set(o.datos.x, o.datos.y+2.45, o.datos.z); return !!D.defensas.jugadorEnTorre(js)})()`);
    ok(tv, 'la torre de vigía reconoce al jugador arriba');
    await js(`(()=>{const H=window.__hojarasca, r=H.T.lugares.refugio; const o=H.obras.obras.find(q=>q.plano.id==='antorcha'); H.jugador.ubicar(o.datos.x+2, o.datos.z+2, H.jugador.estado.yaw); return 1})()`);

    // ---- de noche: trampas, armas nuevas, bloqueo y esquiva
    donde = 'noche';
    await js(`window.__hojarasca.progreso.horas = 20.49; 1`);
    await simular(8);
    const n0 = await js(`(()=>{const D=window.__hojarasca.progreso.desafio; return {oleadas:D.oleadas}})()`);
    ok(n0.oleadas === 1, 'baja la primera oleada');
    const tr = await js(`(()=>{const H=window.__hojarasca, D=H.desafio, O=H.obras.obras;
      const pozo=O.find(o=>o.plano.id==='pozo'), barril=O.find(o=>o.plano.id==='barril-resina'), red=O.find(o=>o.plano.id==='red-cristal');
      const a1=D.invocar('rastreador', pozo.datos.x+0.2, pozo.datos.z);
      const a2=D.invocar('tirador', barril.datos.x+1.2, barril.datos.z);
      const a3=D.invocar('rastreador', red.datos.x, red.datos.z+0.3);
      for(let i=0;i<4;i++) D.actualizar(0.05,{noche:1,dtReal:0.05});
      return {atrapado:a1.atrapadoT>0, vida2:a2.vida, vidaMax2:a2.vidaMax, barril:O.includes(barril) && H.obras.obras.includes(barril)}})()`);
    ok(tr.atrapado, 'el pozo atrapa al invasor que lo pisa');
    ok(tr.vida2 < tr.vidaMax2 && !tr.barril, `el barril estalla, lastima y se consume (${Math.round(tr.vida2)}/${tr.vidaMax2})`);
    const ar = await js(`(()=>{const H=window.__hojarasca, D=H.desafio, js=H.jugador.estado, P=H.progreso;
      const c=H.desafio.capsula; H.jugador.ubicar(c.x+14, c.z+14, 0.7);
      const x=js.pos.x-Math.sin(js.yaw)*7, z=js.pos.z-Math.cos(js.yaw)*7; H.camara.position.set(js.pos.x, js.pos.y+1.6, js.pos.z); H.camara.lookAt(x, H.T.altura(x,z)+1, z); H.camara.updateMatrixWorld();
      const a=D.invocar('rastreador', x, z); const piedras0=P.materiales.piedra, bol0=P.desafio.boleadoras;
      D.atacar('boleadoras'); for(let i=0;i<30;i++) D.actualizar(0.05,{noche:1,dtReal:0.05});
      const enredado=a.enredadoT>0;
      for(let i=0;i<20;i++) D.actualizar(0.05,{noche:1,dtReal:0.05});
      D.atacar('honda');
      return {enredado, bol:bol0-P.desafio.boleadoras, piedra:piedras0-P.materiales.piedra}})()`);
    ok(ar.enredado, 'las boleadoras enredan al invasor');
    ok(ar.bol === 1 && ar.piedra === 1, 'boleadoras y honda gastan su munición');
    const bl = await js(`(()=>{const H=window.__hojarasca, D=H.desafio, js=H.jugador.estado, P=H.progreso.desafio;
      const frente={x:js.pos.x-Math.sin(js.yaw)*2, y:js.pos.y, z:js.pos.z-Math.cos(js.yaw)*2};
      P.salud=100; for(let i=0;i<40;i++) D.actualizar(0.05,{noche:1,dtReal:0.05}); P.salud=100; D.herirJugador(20, frente); const sin=100-P.salud;
      P.salud=100; for(let i=0;i<40;i++) D.actualizar(0.05,{noche:1,dtReal:0.05}); P.salud=100; D.bloquear(true); D.herirJugador(20, frente); const con=100-P.salud; D.bloquear(false);
      P.salud=100; for(let i=0;i<40;i++) D.actualizar(0.05,{noche:1,dtReal:0.05}); P.salud=100; js.enSuelo=true; const esq=D.esquivar(1); D.herirJugador(20, frente); const esquivado=100-P.salud;
      return {sin, con, esq, esquivado}})()`);
    ok(bl.con < bl.sin * 0.4, `bloquear con la lanza frena casi todo (${bl.sin} → ${bl.con.toFixed(1)})`);
    ok(bl.esq && bl.esquivado === 0, 'la esquiva da un instante de invulnerabilidad');
    await foto('02-noche-trampas');

    // ---- campana de alarma y lluvia sobre las antorchas
    donde = 'campana';
    const cam = await js(`(()=>{const H=window.__hojarasca, D=H.desafio, o=H.obras.obras.find(q=>q.plano.id==='campana');
      D.invocar('rastreador', o.datos.x+18, o.datos.z); for(let i=0;i<4;i++) D.actualizar(0.05,{noche:1,dtReal:0.05});
      const nota=[...document.querySelectorAll('#notas .nota')].some(n=>/campana/i.test(n.textContent));
      H.clima.estado.lluvia=1; for(let i=0;i<4;i++) D.actualizar(0.05,{noche:1,dtReal:0.05});
      const apagadas=D.defensas.antorchas.every(a=>a.datos.apagada); H.clima.estado.lluvia=0;
      return {nota, apagadas, avisos: (H.__avisos ? H.__avisos() : []).slice(-8)}})()`);
    ok(cam.nota, `la campana suena y avisa cuando se acercan${cam.nota ? '' : ' · últimos avisos: ' + JSON.stringify(cam.avisos)}`);
    ok(cam.apagadas, 'la lluvia apaga las antorchas');

    // ---- martillo y reforzar
    donde = 'martillo';
    const mr = await js(`(()=>{const H=window.__hojarasca, D=H.desafio, js=H.jugador.estado, o=H.obras.obras.find(q=>q.plano.id==='empalizada');
      D.danarObra(o, 150); const antes=o.datos.vida;
      H.camara.position.set(o.datos.x+Math.sin(o.datos.rot)*2, o.datos.y+1.4, o.datos.z+Math.cos(o.datos.rot)*2); H.camara.lookAt(o.datos.x, o.datos.y+1.2, o.datos.z); H.camara.updateMatrixWorld();
      for(let i=0;i<20;i++) D.actualizar(0.05,{noche:1,dtReal:0.05}); D.atacar('martillo'); const despues=o.datos.vida;
      // reforzar toma la defensa más cercana: parado junto al portón, refuerza el portón
      const pt=H.obras.obras.find(q=>q.plano.id==='porton-empalizada');
      const alTaller=()=>{ D.abrirTaller(true); for(let i=0;i<4 && document.querySelector('#taller-categorias button.elegido')?.textContent!=='Base';i++) D.cambiarCategoriaTaller(1); D.fabricar(1); D.abrirTaller(false); };
      H.jugador.ubicar(pt.datos.x+1.1, pt.datos.z+1.1, 0); alTaller();
      const planoPorton=pt.plano.id;
      // y parado contra la empalizada, del lado opuesto al portón, refuerza la empalizada
      const dx=o.datos.x-pt.datos.x, dz=o.datos.z-pt.datos.z, d=Math.hypot(dx,dz)||1;
      H.jugador.ubicar(o.datos.x+dx/d*1.2, o.datos.z+dz/d*1.2, 0); alTaller();
      return {antes, despues, plano:o.plano.id, planoPorton}})()`);
    ok(mr.despues > mr.antes, `el martillo repara (${Math.round(mr.antes)} → ${Math.round(mr.despues)})`);
    ok(mr.plano === 'empalizada-reforzada', `reforzar convierte la empalizada (${mr.plano})`);
    ok(mr.planoPorton === 'porton-reforzado', `reforzar convierte el portón en portón con tranca (${mr.planoPorton})`);

    // ---- perro y cámara lenta con el último invasor
    donde = 'perro';
    const pr = await js(`(()=>{const H=window.__hojarasca, D=H.desafio, js=H.jugador.estado; const a=D.invocar('rastreador', js.pos.x+4, js.pos.z+2); return !!D.objetivoPerro(js, H.perro.est.pos)})()`);
    ok(pr, 'el perro sale a buscar al invasor cercano');
    const sl = await js(`(()=>{const H=window.__hojarasca, D=H.desafio; H.progreso.desafio.oleadaTerminada=false;
      const vivos=D.aliens.filter(a=>a.estado!=='morir'&&a.estado!=='irse');
      // todos caen en una trampa letal a la vez: el último activa la cámara lenta
      for (const a of vivos) { if (a.estado==='bajar') a.estado='avanzar'; a.enredadoT=0; a.atrapadoT=1; a.atrapadoDps=1000; }
      let min=1; for(let i=0;i<10;i++){ D.actualizar(0.05,{noche:1,dtReal:0.05}); min=Math.min(min, D.escalaTiempo); }
      return {min, vivos:vivos.length}})()`);
    ok(sl.min < 1, `cámara lenta al caer el último invasor (escala ${sl.min.toFixed(2)})`);

    // ---- amanecer: logros y récords
    donde = 'amanecer';
    await js(`window.__hojarasca.progreso.horas = 5.98; 1`);
    await simular(2);
    const lg = await js(`(()=>{const H=window.__hojarasca, L=H.desafio.logros; return {primera:L.tiene('primera-noche'), records:L.records('normal')}})()`);
    ok(lg.primera, 'logro «primera noche» desbloqueado');
    ok(lg.records.noches >= 1, 'el récord de noches se registra');

    // ---- compañeros y restos de naves
    donde = 'aliados';
    const al = await js(`(()=>{const H=window.__hojarasca, D=H.desafio; D.aliados.sumar('ramon'); D.aliados.sumar('ema');
      const g=H.gente.gente; return {ramon:!!g.find(n=>n.clave==='ramon')?.enBase, ema:!!g.find(n=>n.clave==='ema')?.enBase, guardados:H.progreso.desafio.companeros.length}})()`);
    ok(al.ramon && al.ema && al.guardados === 2, 'Don Ramón y Ema se instalan en la base');
    const re = await js(`(()=>{const H=window.__hojarasca, D=H.desafio; const hubo=D.eventos.soltarRestos(); const r=H.progreso.desafio.restos; if(!r) return {hubo};
      // 2.1: la nave caída se recorre; el premio está al fondo del pasillo (15.8 m adentro)
      H.jugador.ubicar(r.x+30, r.z, 0); for(let i=0;i<3;i++) D.actualizar(0.05,{noche:0,dtReal:0.05});
      const fx=r.x+15.8*Math.sin(r.rot), fz=r.z+15.8*Math.cos(r.rot);
      H.jugador.ubicar(fx, fz, 0); for(let i=0;i<5;i++) D.actualizar(0.05,{noche:0,dtReal:0.05});
      for (const a of D.aliens.slice()) if (a.estado==='dormido' || a.estado==='avanzar') { a.vida=0; a.estado='irse'; a.t=9; }
      return {hubo, planos:H.progreso.desafio.planos, restos:!!H.progreso.desafio.restos}})()`);
    ok(re.hubo && re.planos?.includes('escudo') && !re.restos, 'los restos de nave dan el plano del escudo');

    // ---- noche roja
    donde = 'roja';
    await js(`(()=>{const H=window.__hojarasca, D=H.progreso.desafio; D.especialAnterior=null; H.progreso.dia++; H.progreso.horas=19.4; return 1})()`);
    await js(`(()=>{const H=window.__hojarasca; for(let i=0;i<30;i++){ H.progreso.horas+=0.01; H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); } return 1})()`);
    await js(`(()=>{const D=window.__hojarasca.progreso.desafio; D.especial='roja'; return 1})()`);
    await js(`window.__hojarasca.progreso.horas = 20.49; 1`);
    await simular(4);
    const roja = await js(`(()=>{const H=window.__hojarasca; return {clase:document.getElementById('velo-especial').className, estado:document.getElementById('desafio-estado').textContent}})()`);
    ok(/roja/.test(roja.clase), 'la noche roja tiñe la pantalla');

    // ---- la nave nodriza
    donde = 'nodriza';
    await js(`(()=>{const H=window.__hojarasca, D=H.progreso.desafio; H.progreso.horas=6.5; return 1})()`);
    await simular(1);
    await js(`(()=>{const H=window.__hojarasca, D=H.progreso.desafio; D.oleadas=19; D.especial=null; D.especialAnterior='roja'; H.progreso.dia++; H.progreso.horas=19.4; return 1})()`);
    await js(`(()=>{const H=window.__hojarasca; for(let i=0;i<30;i++){ H.progreso.horas+=0.01; H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); } H.progreso.horas=20.49; return 1})()`);
    await simular(10);
    // 3.5.1: sin las estructuras de un puesto (3.0) que haya salido cerca: con eso la cuenta fallaba de a ratos
    const nd = await js(`(()=>{const H=window.__hojarasca, D=H.desafio; return {activa:D.nodrizaActiva, blancos:D.eventos.blancos().filter((b)=>!b.puesto).length, hud:!document.getElementById('nodriza-hud').classList.contains('oculto')}})()`);
    ok(nd.activa && nd.blancos === 3 && nd.hud, 'baja la nave nodriza con sus tres núcleos');
    await foto('03-nodriza');
    const vic = await js(`(()=>{const H=window.__hojarasca, D=H.desafio; for (const n of D.eventos.blancos()) D.eventos.herirNucleo(n, 99999);
      for(let i=0;i<5;i++) D.actualizar(0.05,{noche:1,dtReal:0.05}); return {victoria:H.progreso.desafio.victoria, vencedor:D.logros.tiene('vencedor')}})()`);
    ok(vic.victoria && vic.vencedor, 'destruir los núcleos gana el Desafío (logro «vencedor»)');
    await esperar(6000);
    ok(await js(`!document.getElementById('victoria').classList.contains('oculto')`), 'aparece la pantalla de victoria');
    await js(`document.getElementById('victoria-seguir').click(); 1`);
    ok(await js(`document.getElementById('victoria').classList.contains('oculto')`), 'se puede seguir jugando después de ganar');

    // ---- guardado y recarga con todo lo nuevo
    donde = 'guardado';
    await js(`window.__hojarasca.guardar(); 1`);
    await w.loadFile(url, { search: '?debug=1' });
    listo = false;
    for (let i = 0; i < 300 && !listo; i++) { await esperar(1000); listo = await js('!!window.__hojarasca').catch(() => false); }
    const g = await js(`(()=>{const H=window.__hojarasca, D=H.progreso.desafio; return {victoria:D.victoria, planos:D.planos, comp:D.companeros, reforzada:H.obras.obras.some(o=>o.plano.id==='empalizada-reforzada'), mejora:!!H.progreso.cosas.lanzaCristal}})()`);
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(1500);
    await simular(1);
    const g2 = await js(`(()=>{const H=window.__hojarasca; return H.gente.gente.filter(n=>n.enBase).length})()`);
    ok(g.victoria && g.planos.includes('escudo') && g.comp.length === 2 && g.reforzada && g.mejora, 'al recargar se conserva victoria, planos, compañeros, refuerzos y mejoras');
    ok(g2 === 2, 'los compañeros vuelven a la base al cargar');
    await js(`document.getElementById('btn-inicio')?.click(); 1`);
  } catch (e) { errores.push(`${donde}: ${e.message}`); }
  fs.writeFileSync(path.join(salida, 'informe.json'), JSON.stringify({ pasos, errores }, null, 2));
  console.log(pasos.join('\n'));
  if (errores.length) console.log('ERRORES:\n' + errores.join('\n'));
  app.exit(errores.length ? 1 : 0);
});

// Prueba de partida real del modo Desafío (Electron + WebGL):
// menú de modo, kit inicial, fabricar, construir defensas, oleada nocturna,
// combate, derribo de obras, derrota y guardado separado del modo Relax.
// Uso: npx electron pruebas/humo-desafio.cjs   → pruebas/salidas/desafio/
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(__dirname, 'salidas', 'desafio');
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
  const js = (c, limite = 60000) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, rej) => setTimeout(() => rej(new Error(`sin respuesta ${limite / 1000}s en ${donde}`)), limite)),
  ]);
  const ok = (cond, texto) => { pasos.push(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const foto = async (nombre) => fs.writeFileSync(path.join(salida, nombre + '.jpg'), (await w.webContents.capturePage()).toJPEG(72));
  // La ventana oculta sin GPU puede ir a 1 cuadro/s: la simulación avanza en pasos fijos.
  const simular = (seg) => js(`(()=>{const H=window.__hojarasca; for(let i=0;i<${Math.round(seg / 0.05)};i++){ H.progreso.horas += 0.05*24/(30*60); H.desafio.actualizar(0.05,{noche:1}); } return 1})()`);
  const url = path.join(raiz, 'index.html');
  const cargar = async () => {
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 240; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) return true; }
    return false;
  };
  try {
    // ---- Relax: sin HUD de desafío ni categoría Defensa; se deja una partida centinela
    donde = 'relax';
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'relax'})); 1`);
    ok(await cargar(), 'Relax carga');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(1500);
    const relax = await js(`(()=>{const H=window.__hojarasca; H.progreso.ramitas=7; H.guardar();
      return {modo:H.modoJuego, desafio:!!H.desafio, hud:!document.getElementById('desafio-hud').classList.contains('oculto'),
      defensa:[...document.querySelectorAll('#obra-categorias button')].some(b=>b.textContent==='Defensa'), guardada:localStorage.getItem('hojarasca-v1')}})()`);
    ok(relax.modo === 'relax' && !relax.desafio && !relax.hud, 'Relax no tiene invasores ni HUD de salud');
    const centinela = relax.guardada;

    // ---- elegir Desafío desde el menú (recarga con su propia partida)
    donde = 'menu';
    await js(`window.__hojarasca.guardar(); document.getElementById('btn-inicio').click(); 1`); await esperar(500);
    await js(`document.querySelector('[data-ajuste="modo"] button[data-valor="desafio"]').click(); 1`);
    await esperar(1500);
    ok(await cargar(), 'Desafío carga tras elegirlo en el menú');
    donde = 'desafio-inicio';
    const inicio = await js(`(()=>{const H=window.__hojarasca; return {modo:H.modoJuego, texto:document.getElementById('btn-entrar').textContent,
      hacha:!!H.progreso.cosas.hacha, tronco:H.progreso.materiales.tronco, salud:H.progreso.desafio?.salud, capsula:H.desafio.capsula}})()`);
    ok(inicio.modo === 'desafio' && inicio.texto === 'Empezar el Desafío', 'menú muestra el Desafío');
    ok(inicio.hacha && inicio.tronco === 6 && inicio.salud === 100, 'kit inicial: hacha, 6 troncos, salud 100');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2000);
    ok(await js(`!document.getElementById('desafio-hud').classList.contains('oculto') && /los duendes salen en/.test(document.getElementById('desafio-estado').textContent)`), 'HUD con cuenta regresiva');   // 3.8.0: «los duendes salen en»

    // ---- 1.5: talar un árbol en pie, aserrar a mano, banco sin tablas, pehuén protegido, guía F1
    donde = 'recursos';
    const tecla = (c) => `document.dispatchEvent(new KeyboardEvent('keydown',{code:'${c}',bubbles:true}));`;
    const rec = await js(`(()=>{const H=window.__hojarasca, V=H.veg, P=H.progreso, M=P.materiales, js=H.jugador.estado;
      const ini={tronco:M.tronco||0, tabla:M.tabla||0, piedra:M.piedra||0}; const vuelta={x:js.pos.x,z:js.pos.z,yaw:js.yaw,y:js.pos.y};
      const cerca=(f)=>V.arboles.filter(a=>!a.sacado&&!a.caido&&f(a)).sort((a,b)=>Math.hypot(a.x-js.pos.x,a.z-js.pos.z)-Math.hypot(b.x-js.pos.x,b.z-js.pos.z))[0];
      const a=cerca(a=>a.especie!=='pehuen'); const ax=a.x, az=a.z;
      H.jugador.ubicar(a.x+(a.r||0.4)+1.1, a.z, Math.PI/2);
      ${tecla('KeyH')} const tras1={sacado:a.sacado, tronco:M.tronco};
      ${tecla('KeyH')} ${tecla('KeyH')}
      const talado={sacado:a.sacado, tronco:M.tronco, choque:a.choque?a.choque.apagado:true};
      ${tecla('KeyY')} const mano={tronco:M.tronco, tabla:M.tabla};
      // banco de carpintero: 4 troncos y 2 piedras, sin tablas
      const p=H.PLANOS.find(q=>q.id==='banco-trabajo'); H.obras.elegir(p);
      let banco='sin lugar';
      for (const d of [3,4,5,6,8]) { const x=js.pos.x-Math.sin(js.yaw)*d, z=js.pos.z-Math.cos(js.yaw)*d; const r=H.obras.fundar(x,z,js.yaw,js.pos.y); if(!r.ok){banco=r.motivo;continue;} const av=H.obras.avanzar(r.obra,M); banco=av.ok?true:av.motivo; if(av.ok) H.jugador.ubicar(x+1.4,z,js.yaw); break; }
      H.obras.elegir(null); P.obras=H.obras.obras.map(o=>o.datos);
      const antesBanco={tronco:M.tronco, tabla:M.tabla, piedra:M.piedra};
      ${tecla('KeyY')} const enBanco={tronco:M.tronco, tabla:M.tabla};
      const ph=V.arboles.find(q=>q.especie==='pehuen'&&!q.sacado); let pehuen=null;
      if (ph) { H.jugador.ubicar(ph.x+(ph.r||0.5)+1.1, ph.z, Math.PI/2); ${tecla('KeyH')}${tecla('KeyH')}${tecla('KeyH')}${tecla('KeyH')} pehuen=!ph.sacado; }
      H.jugador.ubicar(vuelta.x,vuelta.z,vuelta.yaw,vuelta.y); return {ini,tras1,talado,mano,banco,antesBanco,enBanco,pehuen,especie:a.especie}})()`);
    ok(!rec.tras1.sacado && rec.tras1.tronco === rec.ini.tronco, 'el primer hachazo no voltea el árbol');
    ok(rec.talado.sacado && rec.talado.choque && rec.talado.tronco === rec.ini.tronco + 4, `tres hachazos talan un ${rec.especie} en pie: +4 troncos (${JSON.stringify(rec.talado)})`);
    ok(rec.mano.tronco === rec.talado.tronco - 1 && rec.mano.tabla === rec.ini.tabla + 2, `Y aserra a mano: 1 tronco → 2 tablas (${JSON.stringify(rec.mano)})`);
    ok(rec.banco === true && rec.antesBanco.tabla === rec.mano.tabla && rec.antesBanco.tronco === rec.mano.tronco - 4, `banco de carpintero con 4 troncos y 2 piedras, sin tablas (${rec.banco})`);
    ok(rec.enBanco.tabla === rec.antesBanco.tabla + 4, `en el banco rinde 4 tablas (${JSON.stringify(rec.enBanco)})`);
    ok(rec.pehuen !== false, 'el pehuén no se tala');

    // ---- 1.6: el árbol se viene abajo, queda el tocón y con los días rebrota
    donde = 'caida';
    const caida = await js(`(()=>{const H=window.__hojarasca, V=H.veg;
      const js=H.jugador.estado, vuelta={x:js.pos.x,z:js.pos.z,yaw:js.yaw,y:js.pos.y};
      const estado=()=>({anim:V.arbolesAnimados(), toc:V.cantidadTocones(), talados:H.talados().length});
      const a=V.arboles.filter(q=>!q.sacado&&!q.caido&&q.especie!=='pehuen').sort((p,q)=>Math.hypot(p.x-js.pos.x,p.z-js.pos.z)-Math.hypot(q.x-js.pos.x,q.z-js.pos.z))[0];
      H.jugador.ubicar(a.x+(a.r||0.4)+1.1, a.z, Math.PI/2);
      const antes=estado();
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyH',bubbles:true}));
      const sacude=V.arbolesAnimados()===antes.anim+1 && !a.sacado;
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyH',bubbles:true}));
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyH',bubbles:true}));
      const cae={...estado(), sacado:!!a.sacado, anotado:H.talados().some(t=>V.arboles[t.i]===a)};
      for(let i=0;i<200;i++) V.actualizarCaidas(0.05);
      const despues=estado();
      const dia0=H.progreso.dia;
      H.progreso.dia=dia0+3; H.revisarRebrote(); const brote={...estado(), sacado:!!a.sacado};
      H.progreso.dia=dia0+9; H.revisarRebrote();
      const adulto={...estado(), sacado:!!a.sacado, choque:a.choque?!a.choque.apagado:true};
      H.progreso.dia=dia0; H.jugador.ubicar(vuelta.x,vuelta.z,vuelta.yaw,vuelta.y);
      return {antes,sacude,cae,despues,brote,adulto}})()`);
    ok(caida.sacude, 'el primer hachazo hace temblar el árbol sin voltearlo');
    ok(caida.cae.sacado && caida.cae.toc === caida.antes.toc + 1, `al caer queda el tocón (${JSON.stringify(caida.cae)})`);
    ok(caida.cae.anotado && caida.cae.talados === caida.antes.talados + 1, 'el árbol talado queda anotado en la partida');
    ok(caida.despues.anim === 0, `la malla de la caída se limpia sola (${caida.despues.anim})`);
    ok(caida.brote.sacado && caida.brote.toc === caida.cae.toc, 'a los 3 días hay un brote chico sobre el tocón');
    ok(!caida.adulto.sacado && caida.adulto.choque, `a los 9 días vuelve a ser árbol entero (${JSON.stringify(caida.adulto)})`);
    ok(caida.adulto.toc === 0 && caida.adulto.talados === 0, 'los tocones rebrotados se van de la lista y del suelo');

    // ---- fabricar
    donde = 'fabricar';
    const fab = await js(`(()=>{const H=window.__hojarasca, P=H.progreso; Object.assign(P.materiales,{tronco:30,tabla:30,piedra:40,cristal:2});
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyK',bubbles:true}));
      const abierto=!document.getElementById('taller').classList.contains('oculto');
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'Digit1',bubbles:true}));
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',bubbles:true}));
      const barra=[...document.querySelectorAll('#barra .ranura img')].map(i=>i.alt);
      return {abierto, lanza:!!P.cosas.lanza, piedra:P.materiales.piedra, barra}})()`);
    ok(fab.abierto && fab.lanza && fab.piedra === 38, 'K abre el taller y la lanza gasta 1 tronco + 2 piedras');
    ok(fab.barra[0] === 'Lanza de coihue', 'la lanza queda primera en la barra');

    // ---- construir una empalizada, estacas y una ballesta delante del jugador
    donde = 'construir';
    const obra = await js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado, O=H.obras;
      const poner=(id,d,lado=0)=>{const p=H.PLANOS.find(q=>q.id===id); O.elegir(p);
        const x=js.pos.x-Math.sin(js.yaw)*d+Math.cos(js.yaw)*lado, z=js.pos.z-Math.cos(js.yaw)*d-Math.sin(js.yaw)*lado;
        const r=O.fundar(x,z,js.yaw,js.pos.y); if(!r.ok) return 'fundar '+id+': '+r.motivo; const a=O.avanzar(r.obra,H.progreso.materiales); return a.ok?r.obra:'avanzar '+id+': '+a.motivo;};
      const res={}; for(const [id,d,l] of [['empalizada',6,0],['estacas',10,0],['ballesta-fija',4,4]]){const o=poner(id,d,l); res[id]=typeof o==='string'?o:true;}
      O.elegir(null); H.progreso.obras=O.obras.map(o=>o.datos); return res;})()`);
    ok(obra.empalizada === true, `empalizada construida (${obra.empalizada})`);
    ok(obra.estacas === true, `estacas construidas (${obra.estacas})`);
    ok(obra['ballesta-fija'] === true, `ballesta construida (${obra['ballesta-fija']})`);

    // ---- cae la noche: baja la nave y llegan los invasores
    donde = 'oleada';
    await js(`window.__hojarasca.progreso.horas = 20.49; 1`);
    await simular(10);
    const ol = await js(`(()=>{const H=window.__hojarasca, D=H.progreso.desafio; return {oleadas:D.oleadas, vivos:H.desafio.aliens.length, estado:document.getElementById('desafio-estado').textContent}})()`);
    ok(ol.oleadas === 1 && ol.vivos >= 1, `la primera oleada baja (${ol.vivos} invasores)`);
    ok(/¡Salieron!/.test(ol.estado), 'el HUD anuncia que salieron los duendes');   // 3.8.0
    const d0 = await js(`(()=>{const H=window.__hojarasca, p=H.jugador.estado.pos; return Math.min(...H.desafio.aliens.map(a=>Math.hypot(a.m.g.position.x-p.x,a.m.g.position.z-p.z)))})()`);
    await simular(6);
    const d1 = await js(`(()=>{const H=window.__hojarasca, p=H.jugador.estado.pos; return Math.min(...H.desafio.aliens.map(a=>Math.hypot(a.m.g.position.x-p.x,a.m.g.position.z-p.z)))})()`);
    ok(d1 < d0 - 5, `los invasores se acercan (${d0.toFixed(0)} m → ${d1.toFixed(0)} m)`);

    // ---- combate cuerpo a cuerpo con la lanza
    donde = 'combate';
    await js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado; const a=H.desafio.aliens.find(a=>a.estado==='avanzar'||a.estado==='romper');
      a.m.g.position.set(js.pos.x-Math.sin(js.yaw)*1.8, js.pos.y, js.pos.z-Math.cos(js.yaw)*1.8); a.estado='avanzar'; window.__blanco=a; return 1})()`);
    await esperar(200);
    await foto('01-invasor-cerca');
    let muerto = false;
    for (let i = 0; i < 8 && !muerto; i++) {
      muerto = await js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado, a=window.__blanco; a.m.g.position.set(js.pos.x-Math.sin(js.yaw)*1.8, a.m.g.position.y, js.pos.z-Math.cos(js.yaw)*1.8); H.desafio.atacar('lanza'); return a.estado==='morir'||a.vida<=0})()`);
      await simular(0.65);
    }
    ok(muerto, 'la lanza abate a un rastreador');
    await simular(1.5);
    const tras = await js(`(()=>{const H=window.__hojarasca; return {abatidos:H.progreso.desafio.abatidos}})()`);
    ok(tras.abatidos >= 1, 'se cuenta el invasor abatido');

    // ---- las defensas reciben daño y se derriban
    donde = 'derribo';
    const der = await js(`(()=>{const H=window.__hojarasca, o=H.obras.obras.find(o=>o.plano.id==='empalizada'); const antes=H.obras.obras.length;
      H.desafio.danarObra(o, 100); const vida=o.datos.vida; H.desafio.danarObra(o, 10000);
      return {vida, antes, despues:H.obras.obras.length, guardadas:H.progreso.obras.length}})()`);
    ok(der.vida === 220, `la empalizada pierde resistencia (320 → ${der.vida})`);
    ok(der.despues === der.antes - 1 && der.guardadas === der.despues, 'derribada: sale del mundo y del guardado');

    // ---- disparo de pistola / arco no rompe nada
    donde = 'armas';
    await js(`(()=>{const H=window.__hojarasca, D=H.progreso.desafio; H.progreso.cosas.arco=1; H.progreso.cosas.pistola=1; D.flechas=3; D.cargas=3; return 1})()`);
    await simular(1);
    await js(`window.__hojarasca.desafio.atacar('arco'); 1`);
    await simular(1);
    await js(`window.__hojarasca.desafio.atacar('pistola'); 1`);
    const armas = await js(`(()=>{const D=window.__hojarasca.progreso.desafio; return {flechas:D.flechas, cargas:D.cargas}})()`);
    ok(armas.flechas === 2 && armas.cargas === 2, 'arco y pistola gastan munición');
    await simular(3);
    await foto('02-noche-invasion');

    // ---- amanecer: se resiste la noche y cae la caja de suministros
    donde = 'amanecer';
    await js(`window.__hojarasca.progreso.horas = 5.98; 1`);
    await simular(2);
    const alba = await js(`(()=>{const H=window.__hojarasca, D=H.progreso.desafio; return {noches:D.noches, caja:!!D.caja, tronco:H.progreso.materiales.tronco}})()`);
    ok(alba.noches === 1 && alba.caja, 'al amanecer se cuenta la noche y cae una caja');
    await js(`(()=>{const H=window.__hojarasca, c=H.progreso.desafio.caja; H.jugador.ubicar(c.x, c.z, 0); return 1})()`);
    await simular(14);
    const junto = await js(`(()=>{const H=window.__hojarasca; return {caja:!!H.progreso.desafio.caja, tronco:H.progreso.materiales.tronco}})()`);
    ok(!junto.caja && junto.tronco > alba.tronco, `la caja baja en paracaídas y se abre al pasar (${alba.tronco} → ${junto.tronco} troncos)`);

    // ---- portón: se abre con la puerta, deja de frenar y los invasores lo rompen cerrado
    donde = 'porton';
    const por = await js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado, O=H.obras; Object.assign(H.progreso.materiales,{tronco:30,tabla:30});
      const cap=H.desafio.capsula; H.jugador.ubicar(cap.x-16, cap.z+12, 0.4); const p=H.PLANOS.find(q=>q.id==='porton-empalizada'); O.elegir(p);
      const x=js.pos.x-Math.sin(js.yaw)*5, z=js.pos.z-Math.cos(js.yaw)*5; const r=O.fundar(x,z,js.yaw,js.pos.y); if(!r.ok) return {error:r.motivo};
      O.avanzar(r.obra,H.progreso.materiales); O.elegir(null); const o=r.obra;
      const hoja=H.puertas.lista.find(q=>q.duenio===o); if(!hoja) return {error:'sin hoja'};
      const cerrado=O.portonAbierto(o);
      H.puertas.accionar(hoja); for(let i=0;i<60;i++) H.puertas.actualizar(0.05);
      const abierto=O.portonAbierto(o);
      H.puertas.accionar(hoja); for(let i=0;i<60;i++) H.puertas.actualizar(0.05);
      const vida0=o.datos.vida ?? null; H.desafio.danarObra(o, 50);
      return {cerrado, abierto, recerrado:O.portonAbierto(o), vida:o.datos.vida, vidaMax:p.vida}})()`);
    ok(!por.error, `portón construido ${por.error || ''}`);
    ok(por.cerrado === false && por.abierto === true && por.recerrado === false, 'el portón se abre y se cierra');
    ok(por.vida === por.vidaMax - 50, 'el portón recibe daño como las demás defensas');

    // ---- derrota: vuelve a la base al amanecer, sin invasores, con penalidad
    donde = 'derrota';
    await js(`window.__hojarasca.desafio.herirJugador(500); 1`);
    await esperar(4500);
    const der2 = await js(`(()=>{const H=window.__hojarasca, D=H.progreso.desafio; return {salud:D.salud, horas:H.progreso.horas, aliens:H.desafio.aliens.length, derrotas:D.derrotas, cristal:H.progreso.materiales.cristal, caido:H.desafio.caido}})()`);
    ok(der2.salud === 100 && !der2.caido && der2.derrotas === 1, 'tras caer, se despierta con salud completa');
    ok(Math.abs(der2.horas - 7.2) < 0.2 && der2.aliens === 0 && der2.cristal === 0, 'amanece, los invasores se fueron y se perdieron los cristales');
    await foto('03-despertar');

    // ---- guardado separado por modo y recarga
    donde = 'guardado';
    const g = await js(`(()=>{const H=window.__hojarasca; H.guardar(); return {desafio:!!localStorage.getItem('hojarasca-desafio-v1'), relax:localStorage.getItem('hojarasca-v1')}})()`);
    ok(g.desafio, 'el Desafío se guarda en su propia clave');
    { const r1 = JSON.parse(centinela), r2 = JSON.parse(g.relax || '{}');
      ok(r2.ramitas === r1.ramitas && r2.dia === r1.dia && r2.modo === 'relax', 'la partida Relax queda intacta'); }
    ok(await cargar(), 'recarga el Desafío');
    const re = await js(`(()=>{const H=window.__hojarasca; return {texto:document.getElementById('btn-entrar').textContent, lanza:!!H.progreso.cosas.lanza, derrotas:H.progreso.desafio.derrotas, ballesta:H.obras.obras.some(o=>o.plano.id==='ballesta-fija')}})()`);
    ok(re.texto === 'Seguir resistiendo' && re.lanza && re.derrotas === 1 && re.ballesta, 'al recargar se conserva todo');
  } catch (e) { errores.push(`${donde}: ${e.message}`); }
  const informe = { pasos, errores };
  fs.writeFileSync(path.join(salida, 'informe.json'), JSON.stringify(informe, null, 2));
  console.log(pasos.join('\n'));
  if (errores.length) console.log('ERRORES:\n' + errores.join('\n'));
  app.exit(errores.length ? 1 : 0);
});

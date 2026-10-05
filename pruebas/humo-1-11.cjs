// Prueba de partida real de la 1.11 en el Relax (Electron + WebGL). Todo por las teclas
// de verdad donde se puede: el almacén se compra con los números, el gallinero, el telar,
// la feria, el perro y la charla van con E.
// Uso: npx electron pruebas/humo-1-11.cjs   → pruebas/salidas/1-11/
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(__dirname, 'salidas', '1-11');
fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
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
  const url = path.join(raiz, 'index.html');
  const cargar = async () => {
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 240; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) return true; }
    return false;
  };
  const tecla = (code) => js(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'${code}',bubbles:true})); 1`);
  // A un cuadro por segundo, el aviso tarda en enterarse de que te moviste.
  const aviso = (re) => js(`(async ()=>{let a=''; for(let i=0;i<40;i++){ a=document.getElementById('aviso')?.textContent||''; if(${re}.test(a)) break; await new Promise(r=>setTimeout(r,250)); } return a})()`);
  // Construye una pieza terminada cerca del jugador; prueba varios lugares si uno no sirve.
  const construir = (id, cerca = 5) => js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado, O=H.obras, P=H.progreso;
    Object.assign(P.materiales,{tronco:80,tabla:80,piedra:80});
    const p=H.PLANOS.find(q=>q.id==='${id}'); if(!p) return {error:'no hay plano ${id}'};
    O.elegir(p);
    for (const d of [${cerca}, ${cerca}+2, ${cerca}+4, ${cerca}+7]) for (const a of [0, 0.9, -0.9, 1.8, -1.8, 2.7, -2.7]) {
      const ang=js.yaw+a, x=js.pos.x-Math.sin(ang)*d, z=js.pos.z-Math.cos(ang)*d;
      const r=O.fundar(x,z,js.yaw,js.pos.y); if(!r.ok) continue;
      for (let g=0; g<12 && r.obra.datos.etapas<r.obra.plano.etapas.length; g++) { const k=O.avanzar(r.obra,P.materiales); if(!k.ok) break; }
      O.elegir(null); P.obras=O.obras.map(o=>o.datos);
      return {ok:r.obra.datos.etapas>=r.obra.plano.etapas.length, x:r.obra.datos.x, z:r.obra.datos.z};
    }
    O.elegir(null); return {error:'no hubo lugar para ${id}'}})()`);
  // Te para a `d` metros de (x,z), mirándolo.
  const pararseFrente = (x, z, d = 1.6) => js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado;
    const px=${x}+${d}, pz=${z}; js.pos.x=px; js.pos.z=pz; js.pos.y=H.T.altura(px,pz)+0.05; js.yaw=Math.atan2(px-(${x}), pz-(${z})); js.pitch=-0.1; return 1})()`);

  try {
    donde = 'cargar';
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'relax', guiaPrimerDia:false})); 1`);
    ok(await cargar(), 'el Relax carga');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2000);

    // ================================================================ el almacén, con las teclas de verdad
    donde = 'almacén';
    const m = await js(`(()=>{const H=window.__hojarasca, a=H.est.almacen; if(!a) return null; const P=H.progreso;
      P.entradas.pinon={dia:1,hora:9,cantidad:20}; P.entradas.canto={dia:1,hora:9,cantidad:10}; return {x:a.mostrador.x, z:a.mostrador.z}})()`);
    ok(!!m, 'hay almacén');
    await js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado; js.pos.x=${m.x}+0.6; js.pos.z=${m.z}+0.6; js.pos.y=H.T.altura(js.pos.x,js.pos.z)+0.05; return 1})()`);
    await esperar(2500);
    await tecla('KeyE'); await esperar(600);
    ok(await js(`window.__hojarasca.__abierto().enElAlmacen`), 'E en el mostrador abre el almacén');
    const iHarina = await js(`[...document.querySelectorAll('#trueque li')].findIndex(li=>/harina/i.test(li.textContent))`);
    await tecla('Digit' + (iHarina + 1)); await esperar(300);
    const h1 = await js(`window.__hojarasca.progreso.cosas.harina||0`);
    ok(iHarina >= 4 && h1 === 4, `el ${iHarina + 1} compra la harina (${h1}): del 5 en adelante también se compra`);
    // (3.6.2: el clic en las opciones va con mousedown, como el menú de la charla: el click no llegaba al #hud)
    await js(`document.querySelectorAll('#trueque li')[${iHarina}].dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true, cancelable: true })); 1`); await esperar(300);
    const h2 = await js(`window.__hojarasca.progreso.cosas.harina||0`);
    ok(h2 === 8, `y un clic también (${h2})`);
    await tecla('Escape'); await esperar(300);
    ok(!(await js(`window.__hojarasca.__abierto().enElAlmacen`)), 'Escape cierra el almacén');

    // de vuelta al refugio, donde hay lugar para construir
    await js(`(()=>{const H=window.__hojarasca, r=H.T.lugares.refugio, js=H.jugador.estado; js.pos.x=r.x+14; js.pos.z=r.z+10; js.pos.y=H.T.altura(js.pos.x,js.pos.z)+0.05; return 1})()`);
    await esperar(1200);

    // ================================================================ el gallinero
    donde = 'gallinero';
    const gal = await construir('gallinero');
    ok(gal.ok, `se construye un gallinero (${gal.error || 'ok'})`);
    const gs = await js(`(()=>{const H=window.__hojarasca; H.refrescarGallineros(); H.progreso.dia+=2; return {n:Object.keys(H.gallineros()).length, aves:H.__gallinas().aves?.length ?? -1}})()`);
    ok(gs.n === 1 && gs.aves >= 4, `trae sus gallinas (${gs.n} gallinero, ${gs.aves} gallinas)`);
    await pararseFrente(gal.x, gal.z, 1.8); await esperar(600);
    const avGal = await aviso('/huevo/i');
    ok(/Juntar huevos \(\d+/.test(avGal), `el aviso ofrece los huevos ("${avGal}")`);
    await tecla('KeyE'); await esperar(400);
    const huevos = await js(`window.__hojarasca.progreso.entradas.huevo?.cantidad||0`);
    ok(huevos >= 8, `E junta los huevos (${huevos})`);
    await foto('01-gallinero');

    // ================================================================ el telar
    donde = 'telar';
    await js(`(()=>{const js=window.__hojarasca.jugador.estado; js.pos.x+=6; return 1})()`); await esperar(500);
    const tel = await construir('telar');
    ok(tel.ok, `se construye un telar (${tel.error || 'ok'})`);
    await js(`(()=>{const P=window.__hojarasca.progreso; P.materiales.lana=7; delete P.cosas.manta; return 1})()`);
    await pararseFrente(tel.x, tel.z, 1.5); await esperar(600);
    const avTel = await aviso('/Tejer una manta/');
    ok(/Tejer una manta/.test(avTel), `sin manta, el telar ofrece la manta ("${avTel}")`);
    await tecla('KeyE'); await esperar(300);
    const t1 = await js(`(()=>{const P=window.__hojarasca.progreso; return {manta:P.cosas.manta, lana:P.materiales.lana}})()`);
    ok(t1.manta === 1 && t1.lana === 3, `E teje la manta con cuatro vellones (${JSON.stringify(t1)})`);
    const avTel2 = await aviso('/Tejer un poncho/');
    ok(/Tejer un poncho/.test(avTel2), `después, ponchos ("${avTel2}")`);
    await tecla('KeyE'); await esperar(300);
    const t2 = await js(`(()=>{const P=window.__hojarasca.progreso; return {poncho:P.cosas.poncho, lana:P.materiales.lana}})()`);
    ok(t2.poncho === 1 && t2.lana === 0, `E teje un poncho (${JSON.stringify(t2)})`);

    // ================================================================ la cocina de a dos
    donde = 'cocina';
    const coc = await js(`(()=>{const H=window.__hojarasca, P=H.progreso, js=H.jugador.estado, f=H.clima.fogata;
      f.activa=true; f.vida=100; f.pos.set(js.pos.x+1, js.pos.y, js.pos.z);
      P.entradas.papa={dia:1,hora:9,cantidad:2}; P.entradas.haba={dia:1,hora:9,cantidad:0}; P.entradas.pinon.cantidad=0;
      const antes=P.entradas.huevo.cantidad; H.cocinar();
      return {papas:P.entradas.papa.cantidad, huevos:antes-P.entradas.huevo.cantidad}})()`);
    await esperar(1600);   // se anota cuando termina de cocinarse
    coc.tortilla = await js(`!!window.__hojarasca.progreso.entradas['tortilla-papas']`);
    ok(coc.tortilla && coc.papas === 0 && coc.huevos === 2, `con huevos y papas sale una tortilla y se gastan los dos (${JSON.stringify(coc)})`);
    const torta = await js(`(()=>{const H=window.__hojarasca, P=H.progreso; const antes=P.cosas.harina; H.cocinar(); return {harina:antes-P.cosas.harina}})()`);
    await esperar(1600);
    torta.torta = await js(`!!window.__hojarasca.progreso.entradas['torta-frita']`);
    ok(torta.torta && torta.harina === 1, `con harina y huevo, torta frita (${JSON.stringify(torta)})`);
    await js(`(()=>{const f=window.__hojarasca.clima.fogata; f.activa=false; return 1})()`);

    // ================================================================ la feria
    donde = 'feria';
    await js(`(()=>{const P=window.__hojarasca.progreso; P.dia=5; P.horas=10; return 1})()`);
    await esperar(2500);
    const puesto = await js(`(()=>{const p=window.__hojarasca.__puestoFeria(); return p ? {x:p.x, z:p.z, visible:p.malla.visible} : null})()`);
    ok(puesto?.visible, 'el día de feria aparece el puesto junto al andén');
    await pararseFrente(puesto.x, puesto.z, 2); await esperar(600);
    const avFer = await aviso('/feria/i');
    ok(/Ver la feria/.test(avFer), `el aviso invita ("${avFer}")`);
    await tecla('KeyE'); await esperar(500);
    const lis = await js(`document.querySelectorAll('#feria-lista li').length`);
    ok((await js(`window.__hojarasca.__abierto().enLaFeria`)) && lis === 4, `E abre la feria con cuatro cambios (${lis})`);
    await js(`(()=>{const P=window.__hojarasca.progreso; for (const k of ['haba','papa','frutilla','huevo','pan-casero','empanadas']) P.entradas[k]={dia:1,hora:9,cantidad:30}; P.materiales.lana=20; P.cosas.poncho=6; window.__hojarasca.cambiarFeria(-1); return 1})()`);
    const antes = await js(`JSON.stringify(window.__hojarasca.progreso.materiales)+JSON.stringify(window.__hojarasca.progreso.cosas)`);
    for (const d of ['Digit1', 'Digit2', 'Digit3', 'Digit4']) { await tecla(d); await esperar(250); }
    const fer = await js(`(()=>{const H=window.__hojarasca, P=H.progreso; return {tomadas:P.feria.tomadas.length, marcadas:document.querySelectorAll('#feria-lista li.hecho').length}})()`);
    const despues = await js(`JSON.stringify(window.__hojarasca.progreso.materiales)+JSON.stringify(window.__hojarasca.progreso.cosas)`);
    ok(fer.tomadas === 4 && fer.marcadas === 4, `los números hacen los cuatro cambios (${JSON.stringify(fer)})`);
    ok(antes !== despues, 'y lo que dan llega a la mochila');
    await tecla('Digit1'); await esperar(250);
    ok((await js(`window.__hojarasca.progreso.feria.tomadas.length`)) === 4, 'cada cambio, una vez por feria');
    await foto('02-feria');
    await tecla('Escape'); await esperar(300);
    ok(!(await js(`window.__hojarasca.__abierto().enLaFeria`)), 'Escape cierra la feria');
    await js(`(()=>{const P=window.__hojarasca.progreso; P.horas=19; return 1})()`); await esperar(2500);
    ok(!(await js(`window.__hojarasca.__puestoFeria().malla.visible`)), 'a la noche el puesto ya no está');

    // ================================================================ rastrear con el perro
    donde = 'rastreo';
    const presa = await js(`(()=>{const H=window.__hojarasca; const T=['pudu','huemul','zorro','guanaco','liebre'];
      const l=[...H.fauna.sujetos(), ...H.vida.sujetos(), ...(H.bichos.rastros?.()||[])].filter(s=>T.includes(s.tipo));
      return l.length ? {tipo:l[0].tipo, x:l[0].pos.x, z:l[0].pos.z} : null})()`);
    if (presa) {
      await js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado; H.progreso.horas=12; js.pos.x=${presa.x}+60; js.pos.z=${presa.z}; js.pos.y=H.T.altura(js.pos.x,js.pos.z)+0.05; return 1})()`);
      await esperar(1500);
    }
    const ponerPerro = () => js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado, p=H.perro.est.pos;
      p.x=js.pos.x-Math.sin(js.yaw)*2; p.z=js.pos.z-Math.cos(js.yaw)*2; p.y=H.T.altura(p.x,p.z); js.pitch=-0.3; return 1})()`);
    await ponerPerro(); await esperar(300);
    const avPerro = await aviso('/Pedirle al perro|Dejar el rastro/');
    ok(/Pedirle al perro que rastree/.test(avPerro), `mirando al perro, el aviso ofrece rastrear ("${avPerro}")`);
    await ponerPerro(); await tecla('KeyE'); await esperar(500);
    const r = await js(`(()=>{const H=window.__hojarasca; return {rastro:H.__rastroPerro(), nota:[...document.querySelectorAll('.nota')].map(n=>n.textContent).join(' | ').slice(-200)}})()`);
    if (presa) {
      ok(!!r.rastro, `con un ${presa.tipo} a 60 m, el perro toma el rastro (${r.rastro?.tipo || r.nota})`);
      await esperar(3000);
      const sigue = await js(`(()=>{const H=window.__hojarasca; return {estado:H.perro.est.estado, destino:!!H.__mundoPerro().rastro}})()`);
      ok(sigue.estado === 'rastrear' && sigue.destino, `y va con la nariz al piso (${JSON.stringify(sigue)})`);
      await ponerPerro(); await esperar(1500);
      const avDejar = await aviso('/rastro/');
      ok(/Dejar el rastro/.test(avDejar), `mirándolo de nuevo, se puede dejar ("${avDejar}")`);
      await ponerPerro(); await tecla('KeyE'); await esperar(500);
      ok(!(await js(`window.__hojarasca.__rastroPerro()`)), 'E lo deja');
    } else {
      ok(/El perro olfatea y vuelve/.test(r.nota), `sin animales cerca, el perro olfatea y vuelve (${r.nota})`);
    }

    // ================================================================ una visita
    donde = 'visitas';
    await js(`(()=>{const H=window.__hojarasca, r=H.T.lugares.refugio, js=H.jugador.estado; js.pos.x=r.x-16; js.pos.z=r.z+12; js.pos.y=H.T.altura(js.pos.x,js.pos.z)+0.05; return 1})()`);
    await esperar(800);
    const mesa = await construir('mesa-campo', 5);
    ok(mesa.ok, `se arma la mesa (${mesa.error || 'ok'})`);
    await js(`(()=>{const js=window.__hojarasca.jugador.estado; js.pos.x=${mesa.x}+0.1; js.pos.z=${mesa.z}+0.1; return 1})()`);
    let sillas = 0;
    for (let i = 0; i < 2; i++) { const s = await construir('silla-campo', 2.2); if (s.ok) sillas++; }
    const puesta = await js(`(()=>{const H=window.__hojarasca; return H.mueblesTerminados().filter(m=>['silla-campo','banco'].includes(m.id)).length})()`);
    ok(sillas === 2 && puesta >= 2, `y dos sillas alrededor (${sillas})`);
    const llega = await js(`(()=>{const H=window.__hojarasca, P=H.progreso, js=H.jugador.estado;
      js.pos.x=${mesa.x}+40; js.pos.z=${mesa.z}; P.horas=16.5; P.visitas={ultima:0,cuenta:0,activa:null};
      H.actualizarVisitas(2); const v=H.__visitante();
      return v ? {quien:v.npc.clave, d:Math.hypot(v.npc.pos.x-(${mesa.x}), v.npc.pos.z-(${mesa.z})), activa:P.visitas.activa} : null})()`);
    ok(llega?.quien === 'ramon' && llega.d > 20, `a la tarde viene Don Ramón, caminando desde lejos (${JSON.stringify(llega)})`);
    // lo llevamos a la mesa (a un cuadro por segundo tardaría minutos) y le hablamos
    await js(`(()=>{const H=window.__hojarasca, v=H.__visitante().npc, r=v.ruta[0]; v.pos.x=r.x; v.pos.z=r.z; return 1})()`);
    const pos = await js(`(()=>{const v=window.__hojarasca.__visitante().npc; return {x:v.pos.x, z:v.pos.z}})()`);
    await pararseFrente(pos.x, pos.z, 1.8); await esperar(1500);
    const avVis = await aviso('/Hablar con/');
    ok(/Hablar con Don Ramón/.test(avVis), `se le puede hablar ("${avVis}")`);
    const yerbaAntes = await js(`window.__hojarasca.progreso.cosas.yerba||0`);
    const charla = await js(`(async ()=>{const t=[]; const abierta=()=>!document.getElementById('charla').classList.contains('oculto');
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',bubbles:true}));
      for(let i=0;i<10 && abierta();i++){ t.push(document.getElementById('charla-texto').textContent); document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',bubbles:true})); await new Promise(r=>setTimeout(r,80)); }
      return t})()`);
    const yerba = await js(`(window.__hojarasca.progreso.cosas.yerba||0)`);
    ok(charla.some((x) => /mesa puesta/.test(x)), `cuenta por qué vino (${charla.length} partes)`);
    ok(yerba - yerbaAntes === 8, `y deja un kilo de yerba (+${yerba - yerbaAntes})`);
    ok(await js(`window.__hojarasca.progreso.visitas.activa?.charlo === true`), 'un regalo por visita');
    const vuelve = await js(`(()=>{const H=window.__hojarasca, P=H.progreso, js=H.jugador.estado;
      P.horas=20.5; js.pos.x=${mesa.x}+80; H.actualizarVisitas(2);
      const n=H.gente.gente.find(g=>g.clave==='ramon');
      return {visitante:!!H.__visitante(), deVisita:!!n.deVisita, ultima:P.visitas.ultima, cuenta:P.visitas.cuenta, dMesa:Math.hypot(n.pos.x-(${mesa.x}), n.pos.z-(${mesa.z}))}})()`);
    ok(!vuelve.visitante && !vuelve.deVisita && vuelve.cuenta === 1 && vuelve.dMesa > 20, `a la noche vuelve a su puesto (${JSON.stringify(vuelve)})`);

    // ================================================================ un pedido de fotos
    donde = 'pedidos';
    const erc = await js(`(()=>{const H=window.__hojarasca, P=H.progreso, c=H.correo();
      c.llegadas['c-revista']=P.dia; P.entradas['c-revista']={dia:P.dia,hora:10,cantidad:0};
      c.fotos={'c-revista':{dia:P.dia, enviada:false}};
      // 3.3: si la trochita para en la estación durante la prueba, llega otra carta y Ercilia
      // la entrega antes del envío (es lo correcto en el juego). Hoy ya hubo correo, y lo que
      // estuviera por retirar se da por leído: acá se prueba el envío de la foto.
      c.ultimoDia=P.dia;
      for (const id of Object.keys(c.llegadas)) if (!P.entradas[id]) P.entradas[id]={dia:P.dia,hora:10,cantidad:0};
      const n=H.gente.gente.find(g=>g.clave==='ercilia'); return n ? {x:n.pos.x, z:n.pos.z} : null})()`);
    ok(!!erc, 'Ercilia está en el almacén');
    await pararseFrente(erc.x, erc.z, 1.6); await esperar(1500);
    // 3.1: si otro vecino pasa justo por delante (Don Ramón camina por ahí), E habla con él:
    // es lo correcto en el juego, pero acá queremos a Ercilia; se corre a los demás un momento
    await js(`(()=>{const H=window.__hojarasca, j=H.jugador.estado; for (const g of H.gente.gente) if (g.clave!=='ercilia' && Math.hypot(g.pos.x-j.pos.x, g.pos.z-j.pos.z) < 5) { g.pos.x += 30; g.pos.z += 30; } return 1})()`);
    // 3.3: el juego recalcula de a ratos a quién estás mirando; si Don Ramón pasaba pegado,
    // sin esta espera E le habla a él aunque ya se lo haya corrido (falló 3 de 5 veces)
    await esperar(600);
    const yerba2 = await js(`window.__hojarasca.progreso.cosas.yerba||0`);
    const envio = await js(`(async ()=>{const t=[]; const abierta=()=>!document.getElementById('charla').classList.contains('oculto');
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',bubbles:true}));
      for(let i=0;i<10 && abierta();i++){ t.push(document.getElementById('charla-texto').textContent); document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',bubbles:true})); await new Promise(r=>setTimeout(r,80)); }
      return t})()`);
    ok(envio.some((x) => /¿Es la foto para la revista/.test(x)), `Ercilia pide la foto para la revista (${envio.length} partes${envio.some((x) => /¿Es la foto para la revista/.test(x)) ? '' : `: «${(envio[0] || '').slice(0, 70)}»`})`);
    const env = await js(`(()=>{const H=window.__hojarasca; return {enviada:H.correo().fotos['c-revista'].enviada, yerba:H.progreso.cosas.yerba||0}})()`);
    ok(env.enviada && env.yerba - yerba2 === 16, `la foto sale con el tren y la revista paga en yerba (+${env.yerba - yerba2})`);

    // ================================================================ guardado
    donde = 'guardado';
    await js(`window.__hojarasca.guardar(); 1`);
    ok(await cargar(), 'recarga la partida');
    const re = await js(`(()=>{const P=window.__hojarasca.progreso; return {feria:P.feria.tomadas.length, visitas:P.visitas.cuenta, envio:P.correo.fotos['c-revista']?.enviada, gallineros:Object.keys(P.gallineros).length, poncho:P.cosas.poncho, tortilla:!!P.entradas['tortilla-papas']}})()`);
    ok(re.feria === 4 && re.visitas === 1 && re.envio === true && re.gallineros === 1 && re.tortilla, `al recargar se conserva todo (${JSON.stringify(re)})`);
  } catch (e) { errores.push(`${donde}: ${e.message}`); }

  fs.writeFileSync(path.join(salida, 'informe.json'), JSON.stringify({ pasos, errores }, null, 2));
  console.log(pasos.join('\n'));
  if (errores.length) console.log('ERRORES:\n' + errores.join('\n'));
  app.exit(errores.length ? 1 : 0);
});

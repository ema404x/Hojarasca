// Prueba de partida real de la 1.10 (Electron + WebGL): lo que las pruebas de Node no
// ven porque depende del mundo. Va creciendo con cada cosa de la 1.10.
// Uso: npx electron pruebas/humo-1-10.cjs   → pruebas/salidas/1-10/
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(__dirname, 'salidas', '1-10');
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
  // Las descargas (el cuaderno para compartir) van a la carpeta de salidas, para poder abrirlas.
  const descargas = [];
  w.webContents.session.on('will-download', (_e, item) => { const destino = path.join(salida, item.getFilename()); item.setSavePath(destino); descargas.push(destino); });
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

  try {
    donde = 'cargar';
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'relax', guiaPrimerDia:false})); 1`);
    ok(await cargar(), 'el Relax carga');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2000);

    // ================================================================ 1. la huerta
    donde = 'huerta';
    const cantero = await js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado, O=H.obras, P=H.progreso;
      Object.assign(P.materiales,{tronco:20,tabla:20,piedra:20});
      const p=H.PLANOS.find(q=>q.id==='cantero'); if(!p) return {error:'no hay plano cantero'};
      O.elegir(p);
      const x=js.pos.x-Math.sin(js.yaw)*4, z=js.pos.z-Math.cos(js.yaw)*4;
      const r=O.fundar(x,z,js.yaw,js.pos.y); if(!r.ok) return {error:'fundar: '+r.motivo};
      const a=O.avanzar(r.obra,P.materiales); O.elegir(null); P.obras=O.obras.map(o=>o.datos);
      if(!a.ok) return {error:'avanzar: '+a.motivo};
      js.pos.x=x+1.2; js.pos.z=z; return {ok:true, x, z}})()`);
    ok(cantero.ok, `se construye un cantero (${cantero.error || 'ok'})`);
    await esperar(600);
    // A un cuadro por segundo el aviso tarda en enterarse de que te moviste: se espera.
    const vacio = await js(`(async ()=>{const H=window.__hojarasca; const c=H.canteroCerca(); let aviso='';
      for(let i=0;i<40;i++){ aviso=document.getElementById('aviso')?.textContent||''; if(/cantero|semillas|Sembrar/i.test(aviso)) break; await new Promise(r=>setTimeout(r,250)); }
      return {cerca:!!c, aviso}})()`);
    ok(vacio.cerca, 'parado al lado, el juego encuentra el cantero');
    ok(/faltan semillas/.test(vacio.aviso), `sin semillas, el aviso lo dice ("${vacio.aviso}")`);

    // semillas desde el almacén, por el trueque de verdad
    const compra = await js(`(()=>{const H=window.__hojarasca, P=H.progreso;
      P.entradas.calafate={dia:1,hora:9,cantidad:10}; P.ramitas=10;
      const i=H.__trueques ? -1 : 0; return 1})()`);
    void compra;
    const sembrado = await js(`(()=>{const H=window.__hojarasca, P=H.progreso;
      P.cosas['semillas-habas']=2;
      const c=H.canteroCerca(); H.usarCantero(c);
      const parcela=H.huerta()[c.clave];
      const m=H.__matasHuerta();
      return {parcela, semillas:P.cosas['semillas-habas'], matas:m.hojas.count, frutos:m.frutos.count}})()`);
    ok(sembrado.parcela?.cultivo === 'habas' && sembrado.semillas === 1, 'E siembra habas y gasta una semilla');
    ok(sembrado.matas === 8 && sembrado.frutos === 0, `aparecen las ocho matas, todavía sin fruto (${sembrado.matas}/${sembrado.frutos})`);
    const verde = await js(`(()=>{const H=window.__hojarasca; const c=H.canteroCerca(); H.usarCantero(c); return !!H.huerta()[c.clave]})()`);
    ok(verde, 'lo verde no se cosecha');
    const lista = await js(`(()=>{const H=window.__hojarasca, P=H.progreso;
      P.dia += 5; H.revisarHuerta();
      const m=H.__matasHuerta(); const frutos=m.frutos.count;
      const aviso=document.getElementById('aviso')?.textContent||'';
      const c=H.canteroCerca(); H.usarCantero(c);
      return {frutos, habas:P.entradas.haba?.cantidad||0, anotada:!!P.entradas.haba, vacio:!H.huerta()[c.clave], aviso}})()`);
    ok(lista.frutos > 0, `a los cinco días aparecen las chauchas (${lista.frutos} frutos)`);
    ok(lista.habas === 6 && lista.anotada && lista.vacio, `se cosechan seis habas, van al cuaderno y el cantero queda libre (${lista.habas})`);
    await foto('01-huerta');
    const coc = await js(`(()=>{const H=window.__hojarasca, P=H.progreso;
      return {receta:!!P.entradas['habas-salteadas'], habas:P.entradas.haba.cantidad}})()`);
    void coc;

    // ================================================================ 2. la majada
    donde = 'majada';
    const mj = await js(`(()=>{const H=window.__hojarasca, M=H.__majada(); if(!M) return {error:'sin majada'};
      const js=H.jugador.estado; js.pos.x=M.centro.x+1; js.pos.z=M.centro.z+1; js.pos.y=H.T.altura(js.pos.x,js.pos.z);
      return {ovejas:M.ovejas.length}})()`);
    ok(mj.ovejas === 8, `hay ocho ovejas en el corral del galpón (${mj.error || mj.ovejas})`);
    await esperar(1500);
    const vistas = await js(`(()=>{const H=window.__hojarasca, M=H.__majada();
      return {visibles:M.ovejas.filter(o=>o.g.visible).length, anotada:!!H.progreso.entradas.oveja,
        adentro:M.ovejas.every(o=>Math.hypot(o.pos.x-M.centro.x,o.pos.z-M.centro.z)<8)}})()`);
    ok(vistas.visibles === 8, `se ven las ocho (${vistas.visibles})`);
    ok(vistas.anotada, 'la oveja se anota en el cuaderno al llegar');
    ok(vistas.adentro, 'andan adentro del corral');
    await foto('02-majada');
    const esq = await js(`(()=>{const H=window.__hojarasca, P=H.progreso, M=H.__majada(), js=H.jugador.estado;
      const o=M.ovejas[0]; js.pos.x=o.pos.x+1; js.pos.z=o.pos.z; js.pos.y=o.pos.y;
      const antesSin=P.materiales.lana||0;
      H.esquilarOveja(o);                            // sin tijera
      const sinTijera=(P.materiales.lana||0)===antesSin;
      P.cosas.tijera=1; H.esquilarOveja(o);
      const lana=P.materiales.lana||0;
      H.esquilarOveja(o);                            // otra vez: está corta
      const escala=o.vellon.scale.x;
      return {sinTijera, lana, despues:P.materiales.lana||0, escala, anotado:!!P.entradas.vellon}})()`);
    ok(esq.sinTijera, 'sin tijera no se esquila');
    ok(esq.lana === 2 && esq.despues === 2, `con la tijera da dos vellones, y no dos veces seguidas (${esq.lana}/${esq.despues})`);
    ok(esq.escala < 0.8, `la oveja esquilada se ve flaca (${esq.escala.toFixed(2)})`);
    ok(esq.anotado, 'el vellón se anota');
    // la alfombra se paga con lana
    const alf = await js(`(()=>{const H=window.__hojarasca; const p=H.PLANOS.find(q=>q.id==='alfombra-lana'); return JSON.stringify(p.etapas?.[0]?.pide||p.pide)})()`);
    ok(/"lana":2/.test(alf), `la alfombra de lana pide lana (${alf})`);

    // ================================================================ 3. el correo
    donde = 'correo';
    // Esperar la vuelta entera a un cuadro por segundo no termina nunca: se le pasa al
    // correo "la trochita parada" en el andén de verdad de cada parada.
    const cr = await js(`(()=>{const H=window.__hojarasca, P=H.progreso;
      P.dia = Math.max(P.dia, 3);
      // el tren de verdad pudo haber traído algo mientras corría lo anterior: de cero
      P.correo = {llegadas:{}, ultimoDia:-1};
      for (const k of Object.keys(P.entradas)) if (k.startsWith('c-')) delete P.entradas[k];
      // 3.6: el correo baja donde está el almacén de Ercilia: en el Relax, la parada de la aldea
      const est = H.tren.paradas.find(p=>p.aldea) || H.tren.paradas.find(p=>p.nombre==='Estación del Valle');
      const chica = H.tren.paradas.find(p=>p!==est);
      if (!est) return {error:'no hay parada del almacén'};
      H.revisarCorreo({parado:true, pos:chica.anden});
      const enApeadero = Object.keys(H.correo().llegadas).length;
      H.revisarCorreo({parado:false});
      H.revisarCorreo({parado:true, pos:est.anden});
      const enEstacion = Object.keys(H.correo().llegadas);
      H.revisarCorreo({parado:false}); H.revisarCorreo({parado:true, pos:est.anden});
      return {enApeadero, enEstacion, mismoDia:Object.keys(H.correo().llegadas).length}})()`);
    ok(!cr.error && cr.enApeadero === 0, `en un apeadero no llega correo (${cr.error || cr.enApeadero})`);
    ok(cr.enEstacion?.includes('c-casa'), `en la parada del almacén llega la primera carta (${(cr.enEstacion || []).join(',')})`);
    ok(cr.mismoDia === 1, 'y no llega otra el mismo día aunque el tren vuelva a parar');
    // Al almacén, como en el juego: E sólo mientras la charla está abierta. (La primera
    // versión de esta prueba apretaba E de más parada en el corral, y esquilaba.)
    const charla = await js(`(()=>{const H=window.__hojarasca, P=H.progreso, js=H.jugador.estado;
      const er=H.gente.gente.find(n=>n.clave==='ercilia'); if(!er) return {error:'sin Ercilia'};
      js.pos.x=er.pos.x+1.2; js.pos.z=er.pos.z; js.pos.y=er.pos.y ?? js.pos.y;
      H.hablar(er);
      const abierta=()=>!document.getElementById('charla').classList.contains('oculto');
      const textos=[document.getElementById('charla-texto').textContent];
      for(let i=0;i<10 && abierta();i++){ document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',bubbles:true})); textos.push(document.getElementById('charla-texto').textContent); }
      return {textos, leida:!!P.entradas['c-casa'], lana:P.materiales.lana||0}})()`);
    ok(!charla.error && charla.textos.some((x) => /Llegó carta para vos/.test(x)), `Ercilia te da la carta (${charla.error || 'ok'})`);
    ok(charla.leida, 'leída, queda en el cuaderno');
    await js(`document.getElementById('charla')?.classList.add('oculto'); 1`);

    // ================================================================ 3b. el caballo
    donde = 'caballo';
    const sin = await js(`(()=>{const H=window.__hojarasca; return {cerca:H.caballoCerca(), visible:!!H.__caballo()?.malla.visible}})()`);
    ok(!sin.cerca, 'sin el encargo de Ramón, no hay caballo que montar');
    const cab = await js(`(()=>{const H=window.__hojarasca, P=H.progreso, js=H.jugador.estado;
      P.cosas.caballo = 1;
      const d = H.dondeEstaElCaballo(); js.pos.x=d.x+1; js.pos.z=d.z; js.pos.y=H.T.altura(js.pos.x,js.pos.z);
      return {cerca:H.caballoCerca(), d}})()`);
    ok(cab.cerca, 'con el zaino prestado, espera en el palenque del refugio');
    await esperar(1200);
    const mont = await js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado;
      H.montar(); const ojos=js.alturaOjos;
      return {montado:!!js.montado, anotado:!!H.progreso.entradas.caballo}})()`);
    ok(mont.montado && mont.anotado, 'E sube al zaino y se anota en el cuaderno');
    // Andar: la ventana oculta corre muy pocos cuadros, así que se mueve al jugador a
    // pasos fijos con W apretada y se compara a caballo contra a pie, en el mismo lugar.
    const anda = await js(`(async ()=>{const H=window.__hojarasca, J=H.jugador, js=J.estado;
      const medir=(seg)=>{const x0=js.pos.x, z0=js.pos.z; J.teclas.add('KeyW'); for(let i=0;i<seg/0.05;i++) J.actualizar(0.05); J.teclas.delete('KeyW');
        for(let i=0;i<20;i++) J.actualizar(0.05); return Math.hypot(js.pos.x-x0,js.pos.z-z0);};
      // mirando hacia afuera del refugio, para no medir contra una pared
      js.yaw = H.T.lugares.refugio.mira || 0;
      const x=js.pos.x, z=js.pos.z, yaw=js.yaw;
      const aCaballo=medir(3);
      const ojos=js.alturaOjos;
      const montado=js.montado; js.montado=null;
      js.pos.x=x; js.pos.z=z; js.yaw=yaw; js.pos.y=H.T.altura(x,z);
      for(let i=0;i<10;i++) J.actualizar(0.05);
      const aPie=medir(3);
      js.montado=montado; js.pos.x=x; js.pos.z=z; js.pos.y=H.T.altura(x,z);
      await new Promise(r=>setTimeout(r,1500));
      return {aCaballo, aPie, ojos, visible:!!H.__caballo().malla.visible, aviso:document.getElementById('aviso')?.textContent||''}})()`);
    ok(anda.aCaballo > anda.aPie * 1.5 && anda.aCaballo > 10, `al trote se va bastante más rápido que a pie (${anda.aCaballo.toFixed(1)} m contra ${anda.aPie.toFixed(1)} m en 3 s)`);
    ok(anda.ojos > 2.3, `arriba del caballo se ve desde más alto (${anda.ojos.toFixed(2)} m)`);
    ok(anda.visible, 'el zaino se ve debajo del jinete');
    ok(/Bajarte del zaino|Hablar/.test(anda.aviso), `montado, el aviso sólo ofrece bajar (${anda.aviso})`);
    await foto('04-caballo');
    const riendas = await js(`(()=>{const H=window.__hojarasca, P=H.progreso;
      const t0=P.materiales.tronco||0;
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyH',bubbles:true}));
      return (P.materiales.tronco||0)===t0})()`);
    ok(riendas, 'con las riendas en la mano no se hacha');
    const baja = await js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado, P=H.progreso;
      const x=js.pos.x, z=js.pos.z; H.desmontar();
      return {montado:!!js.montado, cx:P.caballo.x, cz:P.caballo.x===null?null:P.caballo.z, x, z, cerca:H.caballoCerca()}})()`);
    ok(!baja.montado && Math.hypot(baja.cx - baja.x, baja.cz - baja.z) < 0.5, 'al bajarte, el zaino queda donde lo dejaste');
    ok(baja.cerca, 'y lo tenés al lado para volver a subir');

    // ================================================================ 5. logros y cuaderno
    donde = 'logros';
    const lg = await js(`(()=>{const H=window.__hojarasca; const nuevos=H.revisarLogrosRelax(5).map(l=>l.id);
      return {nuevos, boton:!document.getElementById('btn-logros').classList.contains('oculto'), total:H.__logrosRelax().progreso()}})()`);
    ok(['manos-tierra', 'vellon', 'al-tranco'].every((id) => lg.nuevos.includes(id)), `lo hecho en el Relax gana sus logros (${lg.nuevos.join(', ')})`);
    ok(lg.boton, 'el Relax tiene su libreta de logros en la pausa');
    const otra = await js(`window.__hojarasca.revisarLogrosRelax(5).length`);
    ok(otra === 0, 'y no se anuncian dos veces');
    donde = 'album';
    const al = await js(`(()=>{const r=window.__hojarasca.exportarAlbum(); return r ? {nombre:r.nombre, fotos:r.datos.fotos.length, anot:r.datos.anotaciones} : null})()`);
    ok(!!al, `el cuaderno se arma (${al ? al.anot + ' anotaciones' : 'nada'})`);
    await esperar(2500);
    const bajado = descargas.find((f) => f.endsWith('.html'));
    const contenido = bajado && fs.existsSync(bajado) ? fs.readFileSync(bajado, 'utf8') : '';
    ok(/Cuaderno de campo/.test(contenido) && /Lo anotado/.test(contenido) && /Habas/.test(contenido), `y se baja como página: ${bajado ? path.basename(bajado) : 'no bajó nada'} (${contenido.length} bytes)`);

    // ================================================================ 4. tormenta y rayo
    donde = 'tormenta';
    const cre = await js(`(()=>{const H=window.__hojarasca, P=H.progreso;
      H.clima.estado.lluvia = 0.9;
      H.revisarTormenta(0);                 // fija la hora de referencia
      P.horas = (P.horas + 3) % 24;
      H.revisarTormenta(0);
      const c=H.tormenta().crecida, y=H.__agua()?.arroyo?.position.y;
      H.clima.estado.lluvia = 0;
      return {c, y}})()`);
    ok(cre.c > 0.4 && cre.y > 0.2, `tres horas de lluvia fuerte y el arroyo sube (crecida ${cre.c?.toFixed(2)}, ${cre.y?.toFixed(2)} m)`);
    const rayo = await js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado;
      let i=-1; for(let k=0;k<H.veg.arboles.length;k++){const a=H.veg.arboles[k]; const d=Math.hypot(a.x-js.pos.x,a.z-js.pos.z);
        if(!a.sacado && !a.caido && a.especie!=='pehuen' && a.especie!=='seco' && d>40 && d<110){i=k;break;}}
      if(i<0) return {error:'sin árbol a la vista'};
      const ok=H.caerRayo(i); const a=H.veg.arboles[i];
      return {ok, i, caido:!!a.caido, anotado:!!H.progreso.entradas.rayo, pendiente:H.tormenta().rayo?.i, otro:H.caerRayo(null)}})()`);
    ok(rayo.ok && rayo.caido && rayo.pendiente === rayo.i, `un rayo parte un árbol y queda tirado (${rayo.error || rayo.i})`);
    ok(rayo.anotado, 'el rayo va al cuaderno');
    ok(rayo.otro === false, 'con un árbol tirado sin hachar no cae otro rayo');
    await esperar(2500);
    await foto('03-rayo');

    // ================================================================ guardado
    donde = 'guardado';
    await js(`window.__hojarasca.guardar(); 1`);
    ok(await cargar(), 'recarga la partida');
    const re = await js(`(()=>{const P=window.__hojarasca.progreso; return {lana:P.materiales.lana, esq:P.majada.esquilada[0], habas:P.entradas.haba?.cantidad, canteros:P.obras.filter(o=>o.plano==='cantero').length}})()`);
    ok(re.lana === 2 && Number.isFinite(re.esq) && re.habas === 6 && re.canteros === 1, `al recargar se conserva todo (${JSON.stringify(re)})`);
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(1500);
    const tirado = await js(`(()=>{const H=window.__hojarasca; const r=H.tormenta().rayo; const a=r?H.veg.arboles[r.i]:null;
      return {i:r?.i, caido:!!a?.caido, sacado:!!a?.sacado, animados:H.veg.arbolesAnimados(), guardado:JSON.stringify(H.progreso.tormenta)}})()`);
    ok(tirado.i === rayo.i && tirado.caido, `el árbol del rayo sigue tirado después de recargar (${JSON.stringify(tirado)})`);
    const zaino = await js(`(()=>{const H=window.__hojarasca, P=H.progreso, d=H.dondeEstaElCaballo(); return {tiene:!!P.cosas.caballo, x:P.caballo.x, dx:d.x}})()`);
    ok(zaino.tiene && Number.isFinite(zaino.x) && Math.abs(zaino.x - baja.cx) < 0.01, 'al recargar, el zaino sigue donde lo dejaste');
    const lena = await js(`(()=>{const H=window.__hojarasca, P=H.progreso, js=H.jugador.estado, a=H.veg.arboles[H.tormenta().rayo.i];
      P.cosas.hacha=1; js.pos.x=a.x+1.2; js.pos.z=a.z; js.pos.y=H.T.altura(js.pos.x,js.pos.z);
      const antes=P.materiales.tronco||0; H.usarHacha();
      return {troncos:(P.materiales.tronco||0)-antes, sacado:!!a.sacado, caido:!!a.caido, pendiente:H.tormenta().rayo, talado:P.talados.some(t=>H.veg.arboles[t.i]===a)}})()`);
    ok(lena.troncos === 6 && lena.sacado && !lena.caido, `con el hacha se hace leña: +${lena.troncos} troncos y queda el tocón`);
    ok(lena.pendiente === null && lena.talado, 'y el tocón entra al rebrote como cualquier talado');
  } catch (e) { errores.push(`${donde}: ${e.message}`); }

  fs.writeFileSync(path.join(salida, 'informe.json'), JSON.stringify({ pasos, errores }, null, 2));
  console.log(pasos.join('\n'));
  if (errores.length) console.log('ERRORES:\n' + errores.join('\n'));
  app.exit(errores.length ? 1 : 0);
});

// Partida real 2.3 (Electron + WebGL): las diez ideas. Primero el Relax (colmena,
// ahumadero, vivero, leña del invierno, fogón de cuentos), después el Desafío (capullos,
// trochita varada, volador, zanja de fuego, código de partida). El Desafío se hace
// avanzar a mano con `simular`, como en las otras pruebas del Desafío.
// Uso: npx electron pruebas/humo-2-3.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
// sólo pruebas: en algunos entornos el renderer con sandbox no carga ni una página (ERR_FAILED)
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: false, width: 1024, height: 640, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = 'carga';
  const js = (c) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 120 s (${donde})`)), 120000)),
  ]);
  const ok = (cond, texto) => { const l = `${cond ? '✓' : '✗'} ${texto}`; console.log(l); if (!cond) errores.push(texto); };
  const seccion = async (s) => {
    donde = s; console.log(`— ${s}`);
    await js(`(()=>{ const D = window.__hojarasca?.progreso?.desafio; if (D) D.salud = 100; return 1 })()`);
  };
  const simular = (seg) => js(`(()=>{const H=window.__hojarasca; for(let i=0;i<${Math.round(seg / 0.05)};i++){ H.desafio.actualizar(0.05,{noche:1, dtReal:0.05}); } return 1})()`);
  const notas = () => js(`document.getElementById('notas').textContent`);
  const url = path.join(raiz, 'index.html');
  const abrir = async () => {
    try { await w.loadFile(url, { search: '?debug=1' }); }
    catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); }
  };
  const cargar = async (modo, antesDeEntrar = '') => {
    await abrir();
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'${modo}', autoCalidad:false, guiaPrimerDia:false})); 1`);
    await abrir();
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) break; }
    if (antesDeEntrar) await js(antesDeEntrar);
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
  };
  // una pieza terminada cerca del jugador (prueba varios lugares si uno no sirve)
  const construir = (id, cerca = 4) => js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado, O=H.obras, P=H.progreso;
    Object.assign(P.materiales,{tronco:80,tabla:80,piedra:80,cristal:40});
    const p=H.PLANOS.find(q=>q.id==='${id}'); if(!p) return {error:'no hay plano ${id}'};
    O.elegir(p);
    for (const d of [${cerca}, ${cerca}+2, ${cerca}+4, ${cerca}+7, ${cerca}+11]) for (const a of [0, 0.9, -0.9, 1.8, -1.8, 2.7, -2.7, 3.14]) {
      const ang=js.yaw+a, x=js.pos.x-Math.sin(ang)*d, z=js.pos.z-Math.cos(ang)*d;
      const r=O.fundar(x,z,js.yaw,js.pos.y); if(!r.ok) continue;
      for (let g=0; g<12 && r.obra.datos.etapas<r.obra.plano.etapas.length; g++) { const k=O.avanzar(r.obra,P.materiales); if(!k.ok) break; }
      O.elegir(null); P.obras=O.obras.map(o=>o.datos);
      return {ok:r.obra.datos.etapas>=r.obra.plano.etapas.length, x:r.obra.datos.x, z:r.obra.datos.z};
    }
    O.elegir(null); return {error:'no hubo lugar para ${id}'}})()`);
  // te para al lado de (x, z)
  const pararse = (x, z, d = 1.2) => js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado; const px=${x}+${d}, pz=${z};
    js.pos.x=px; js.pos.z=pz; js.pos.y=H.T.altura(px,pz)+0.05; js.yaw=Math.atan2(px-(${x}), pz-(${z})); return 1})()`);
  const obraEn = (id, x, z) => `window.__hojarasca.obras.obras.find(o=>o.plano.id==='${id}' && Math.abs(o.datos.x-(${x}))<0.01 && Math.abs(o.datos.z-(${z}))<0.01)`;

  try {
    // ================================================================ RELAX
    await cargar('relax');
    ok(await js('!!window.__hojarasca'), 'carga el Relax');
    await js(`(()=>{ const H = window.__hojarasca, r = H.T.lugares.refugio, js = H.jugador.estado;
      js.pos.set(r.x + 14, H.T.altura(r.x + 14, r.z + 10) + 0.05, r.z + 10); H.progreso.horas = 11; return 1 })()`);

    await seccion('1. la colmena');
    const cantero = await construir('cantero', 3);
    const colmena = await construir('colmena', 5);
    ok(cantero.ok && colmena.ok, `se arman un cantero y una colmena (${JSON.stringify([cantero, colmena])})`);
    const cosecha = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso;
      const o = ${obraEn('cantero', cantero.x, cantero.z)};
      P.entradas.frutilla = { dia: 1, hora: 9, cantidad: 3 };
      // sembrar y dejarlo listo: se siembra con E y se adelanta el día de siembra
      const js = H.jugador.estado; js.pos.set(o.datos.x + 1.2, js.pos.y, o.datos.z);
      const cc = H.canteroCerca(); if (!cc) return { error: 'no encuentra el cantero' };
      H.usarCantero(cc);
      const parcela = H.huerta()[cc.clave]; if (!parcela) return { error: 'no sembró' };
      parcela.dia -= 30;
      const antes = P.entradas.frutilla.cantidad;
      H.usarCantero(cc);
      return { cosechadas: P.entradas.frutilla.cantidad - antes, sub: document.getElementById('notas').textContent.slice(-90) } })()`);
    ok(cosecha.cosechadas === 5, `con la colmena al lado, la cosecha rinde uno más (${JSON.stringify(cosecha)})`);
    const miel = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso;
      const o = ${obraEn('colmena', colmena.x, colmena.z)};
      const js = H.jugador.estado; js.pos.set(o.datos.x + 1.2, js.pos.y, o.datos.z);
      const c = H.__datosDe(o, 'colmena', (x) => x || { miel: 0, horas: 0 });
      c.miel = 2;
      const aviso = H.__avisoObraQueTrabaja(o);
      H.__usarObraQueTrabaja(H.__obraQueTrabajaCerca());
      return { aviso, miel: P.entradas.miel?.cantidad || 0, anotada: !!P.entradas.miel } })()`);
    ok(/Sacar la miel/.test(miel.aviso) && miel.miel === 2 && miel.anotada, `E saca la miel y queda en el cuaderno (${JSON.stringify(miel)})`);

    await seccion('2. el ahumadero');
    const ahum = await construir('ahumadero', 4);
    ok(ahum.ok, 'se arma un ahumadero');
    const pesca = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso;
      const pez = (id) => ({ id, cm: 32, def: { nombre: 'trucha arcoíris' } });
      for (let i = 0; i < 3; i++) H.__atrapar(pez('arcoiris'));
      H.__atrapar({ id: 'perca', cm: 25, def: { nombre: 'perca criolla' } });
      return { frescas: P.entradas['trucha-fresca']?.cantidad || 0 } })()`);
    ok(pesca.frescas === 2, `de lo que pescás te quedás con dos truchas por día; la perca vuelve (${pesca.frescas})`);
    const ahumado = await js(`(async ()=>{ const H = window.__hojarasca, P = H.progreso;
      const o = ${obraEn('ahumadero', ahum.x, ahum.z)};
      const js = H.jugador.estado; js.pos.set(o.datos.x + 1.3, js.pos.y, o.datos.z);
      P.materiales.tronco = 3;
      H.__usarObraQueTrabaja(o);
      const a = o.datos.ahumadero, colgadas = a.truchas, troncos = P.materiales.tronco;
      a.horas = 11.95;
      P.horas += 0.3;
      await new Promise((r) => setTimeout(r, 1200));
      const listas = a.listas;
      H.__usarObraQueTrabaja(o);
      return { colgadas, troncos, listas, ahumadas: P.entradas['trucha-ahumada']?.cantidad || 0, frescas: P.entradas['trucha-fresca']?.cantidad || 0 } })()`);
    ok(ahumado.colgadas === 2 && ahumado.troncos === 2, `se cuelgan al humo con un tronco (${JSON.stringify(ahumado)})`);
    ok(ahumado.listas === 2 && ahumado.ahumadas === 2 && ahumado.frescas === 0, 'con las horas salen ahumadas');

    await seccion('3. el vivero');
    const semilla = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso, js = H.jugador.estado;
      H.ajustes.estacion = 'otono'; H.__U().uOtono.value = 1; H.__U().uInvierno.value = 0;
      const a = H.veg.arboles.find((t) => !t.sacado && !t.caido && t.especie === 'coihue' && t.esc >= 0.9);
      if (!a) return { error: 'no hay coihue' };
      js.pos.set(a.x + (a.r || 0.4) + 0.9, H.T.altura(a.x + 1.3, a.z) + 0.05, a.z);
      const s = H.__arbolParaSemilla(); if (!s) return { error: 'no ofrece semilla' };
      H.__juntarSemilla(s);
      const otra = H.__arbolParaSemilla();
      return { semillas: P.entradas['semilla-coihue']?.cantidad || 0, otraVez: !!otra } })()`);
    ok(semilla.semillas === 1 && !semilla.otraVez, `en otoño se junta semilla de un coihue grande, una por día (${JSON.stringify(semilla)})`);
    await js(`(()=>{ const H = window.__hojarasca, r = H.T.lugares.refugio, js = H.jugador.estado; js.pos.set(r.x + 14, H.T.altura(r.x + 14, r.z + 10) + 0.05, r.z + 10); return 1 })()`);
    const viv = await construir('vivero', 6);
    ok(viv.ok, 'se arma un vivero');
    const plantines = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso;
      const o = ${obraEn('vivero', viv.x, viv.z)};
      P.entradas.pinon = { dia: 1, hora: 9, cantidad: 2 };
      H.__usarObraQueTrabaja(o);
      const sembradas = o.datos.vivero.macetas.length;
      for (const m of o.datos.vivero.macetas) m.dia -= 3;
      H.__usarObraQueTrabaja(o);
      return { sembradas, coihue: P.entradas['plantin-coihue']?.cantidad || 0, pehuen: P.entradas['plantin-pehuen']?.cantidad || 0 } })()`);
    ok(plantines.sembradas === 3 && plantines.coihue === 1 && plantines.pehuen === 2, `en el vivero germinan y salen plantines (${JSON.stringify(plantines)})`);
    const plantado = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso, js = H.jugador.estado;
      // busca un claro donde un renoval pueda crecer
      for (let i = 0; i < 400; i++) {
        const x = js.pos.x + (Math.random() - 0.5) * 160, z = js.pos.z + (Math.random() - 0.5) * 160;
        if (!H.renovales.sitioBueno(x, z, H.veg).ok) continue;
        js.pos.set(x, H.T.altura(x, z) + 0.05, z);
        const antes = (P.renovales || []).length;
        H.__plantarRenoval();
        const r = (P.renovales || [])[antes];
        return r ? { especie: r.especie, ventaja: P.dia - r.dia } : { error: 'no plantó' };
      }
      return { error: 'no hubo claro' } })()`);
    ok(plantado.especie === 'coihue' && plantado.ventaja === 7, `el plantín se planta con B, ya crecido a la mitad (${JSON.stringify(plantado)})`);

    await seccion('4. la leña del invierno');
    const lena = await js(`(async ()=>{ const H = window.__hojarasca, P = H.progreso, js = H.jugador.estado, r = H.T.lugares.refugio;
      H.ajustes.estacion = 'invierno'; H.__U().uOtono.value = 0; H.__U().uInvierno.value = 1;
      H.clima.fogata.activa = false;
      js.pos.set(r.fogon.x + 1.5, r.fogon.y, r.fogon.z);
      P.materiales.tronco = 0; P.ramitas = 6;
      H.__encenderFuego();
      const sinLena = H.clima.fogata.activa;
      P.materiales.tronco = 2; P.humedadLena = 0.9;
      H.__encenderFuego();
      const mojada = H.clima.fogata.activa;
      return { sinLena, mojada, nota: document.getElementById('notas').textContent.slice(-70) } })()`);
    ok(!lena.sinLena && !lena.mojada && /mojada/.test(lena.nota), `en invierno, sin leña o con la leña mojada no prende (${JSON.stringify(lena)})`);
    const lenera = await construir('lenera', 3);
    ok(lenera.ok, 'se arma una leñera');
    const seca = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso, js = H.jugador.estado, r = H.T.lugares.refugio;
      const o = ${obraEn('lenera', lenera.x, lenera.z)};
      js.pos.set(o.datos.x + 1.4, js.pos.y, o.datos.z);
      P.materiales.tronco = 4;
      H.__usarObraQueTrabaja(o);
      const guardados = o.datos.lenera.secos;
      js.pos.set(r.fogon.x + 1.5, r.fogon.y, r.fogon.z);
      const d = Math.hypot(o.datos.x - js.pos.x, o.datos.z - js.pos.z);
      H.__encenderFuego();
      return { guardados, quedan: o.datos.lenera.secos, prendio: H.clima.fogata.activa, distancia: Math.round(d) } })()`);
    ok(seca.guardados === 4 && seca.prendio && seca.quedan === 3, `con leña seca de la leñera, prende y se lleva un tronco (${JSON.stringify(seca)})`);
    const noches = await js(`(async ()=>{ const H = window.__hojarasca, P = H.progreso, js = H.jugador.estado;
      const espera = (ms) => new Promise((r) => setTimeout(r, ms));
      P.horas = 22; H.__dormir(); await espera(2900);
      const calentito = js.entumecido || 0;
      H.clima.fogata.activa = false; P.cosas.manta = 0;
      P.horas = 22; H.__dormir(); await espera(4300);   // el aviso sale 1,6 s después de despertar
      return { calentito, frio: js.entumecido || 0 } })()`);
    ok(noches.calentito === 0 && noches.frio > 1, `junto al fuego dormís calentito; sin fuego amanecés entumecido (${JSON.stringify(noches)})`);
    ok(/Pasaste frío/.test(await notas()), 'y el juego lo avisa');
    await js(`(()=>{ const H = window.__hojarasca; H.jugador.estado.entumecido = 0; H.ajustes.estacion = 'verano'; H.__U().uInvierno.value = 0; return 1 })()`);

    await seccion('5. el fogón');
    await js(`(()=>{ const H = window.__hojarasca, r = H.T.lugares.refugio, js = H.jugador.estado; js.pos.set(r.x + 16, H.T.altura(r.x + 16, r.z - 12) + 0.05, r.z - 12); return 1 })()`);
    const mesa = await construir('mesa-campo', 4);
    await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado; js.pos.set(${mesa.x} + 1.6, js.pos.y, ${mesa.z}); return 1 })()`);
    const s1 = await construir('silla-campo', 1.5);
    const s2 = await construir('silla-campo', 1.5);
    ok(mesa.ok && s1.ok && s2.ok, 'mesa con dos sillas');
    const visita = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso;
      P.visitas = { ultima: 0, cuenta: 1, activa: null };   // le toca a Nicanor
      P.horas = 16.5; H.__actualizarVisitas(1);
      const v = P.visitas.activa;
      return { quien: v?.clave || null } })()`);
    ok(visita.quien === 'nicanor', `viene una visita (${visita.quien})`);
    const fogon = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso;
      H.clima.encenderFogata(${mesa.x} + 3, H.T.altura(${mesa.x} + 3, ${mesa.z}), ${mesa.z}, 900);
      P.horas = 20.4; H.__actualizarVisitas(1);
      P.horas = 22.3; H.__actualizarVisitas(1);
      return { sigue: !!P.visitas.activa, alFuego: H.__fogonDeVisita(), nota: document.getElementById('notas').textContent.slice(-80) } })()`);
    ok(fogon.sigue && fogon.alFuego, `con el fuego cerca de la mesa, la visita se queda hasta tarde (${JSON.stringify(fogon)})`);
    const cuento = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso;
      const npc = H.gente.gente.find((g) => g.clave === 'nicanor');
      // primero la charla de la visita, entera
      H.__hablar(npc); for (let i = 0; i < 8 && !H.__charla().fin; i++) H.__seguirCharla(); H.__cerrarCharla();
      H.__hablar(npc);
      H.__seguirCharla();
      const primera = document.getElementById('charla-texto').textContent;
      for (let i = 0; i < 8 && !H.__charla().fin; i++) H.__seguirCharla();
      H.__cerrarCharla();
      return { primera: primera.slice(0, 60), anotado: !!P.entradas['c-cuero'] } })()`);
    ok(cuento.anotado && /cuero/.test(cuento.primera), `de noche, al fogón, Nicanor cuenta el cuento del cuero (${JSON.stringify(cuento)})`);
    const lago = await js(`(async ()=>{ const H = window.__hojarasca, P = H.progreso, js = H.jugador.estado;
      const espera = (ms) => new Promise((r) => setTimeout(r, ms));
      const m = H.T.lugares.muelle, p = m.punta || m;
      P.dia = 10; P.horas = 22;
      js.pos.set(p.x, H.T.altura(p.x, p.z) + 0.05, p.z);
      const L = { x: 150, z: 110 };
      js.yaw = Math.atan2(-(L.x - p.x), -(L.z - p.z));
      H.__forzarLomo();
      let visto = false;
      // asoma de a poco: se anota cuando ya salió bien del agua
      for (let i = 0; i < 60 && !P.entradas['avistaje-lago']; i++) { H.__actualizarLomo(0.25); visto = visto || !!H.__lomo().visible; await espera(20); }
      return { visto, anotado: !!P.entradas['avistaje-lago'] } })()`);
    ok(lago.visto && lago.anotado, `una noche de luna, desde la orilla, algo asoma en el lago (${JSON.stringify(lago)})`);

    // ================================================================ DESAFÍO
    await cargar('desafio', `(()=>{ const i = document.getElementById('codigo-partida'); i.value = 'coihue 4821'; i.dispatchEvent(new Event('input')); return 1 })()`);
    ok(await js('!!window.__hojarasca?.desafio'), 'carga el Desafío');

    await seccion('10. el código de partida');
    const codigo = await js(`(()=>{ const H = window.__hojarasca, D = H.progreso.desafio;
      return { semilla: D.semilla, getter: H.desafio.semilla } })()`);
    ok(codigo.semilla === 'COIHUE-4821' && codigo.getter === 'COIHUE-4821', `el código de la portada queda en la partida (${JSON.stringify(codigo)})`);
    const mismas = await js(`(()=>{ const H = window.__hojarasca, D = H.progreso.desafio;
      D.oleadas = 5;
      H.desafio.sembrarCapullos(); const a = JSON.stringify(D.capullos.map((c) => [c.x, c.z]));
      H.desafio.sembrarCapullos(); const b = JSON.stringify(D.capullos.map((c) => [c.x, c.z]));
      D.semilla = 'LENGA-12';
      H.desafio.sembrarCapullos(); const c = JSON.stringify(D.capullos.map((c) => [c.x, c.z]));
      D.semilla = 'COIHUE-4821';
      H.desafio.sembrarCapullos();
      return { iguales: a === b, distintos: a !== c, n: D.capullos.length } })()`);
    ok(mismas.iguales && mismas.distintos, `con el mismo código, los capullos crecen en el mismo lugar; con otro, en otro (${JSON.stringify(mismas)})`);

    await seccion('6. los capullos');
    const vistos = await js(`window.__hojarasca.escena ? window.__hojarasca.escena.children.filter((o) => o.name === 'capullo' && o.visible).length : -1`);
    ok(vistos === 2, `al amanecer de la noche 5 quedan dos capullos a la vista (${vistos})`);
    const quema = await js(`(()=>{ const H = window.__hojarasca, D = H.progreso.desafio, P = H.progreso, js = H.jugador.estado;
      const c = D.capullos[0]; js.pos.set(c.x + 1.2, H.T.altura(c.x + 1.2, c.z) + 0.05, c.z);
      P.ramitas = 2; const cristal0 = P.materiales.cristal || 0;
      const aviso = H.desafio.avisoCercaDe(js.pos);
      H.desafio.usarCercaDe(js.pos);
      for (let i = 0; i < 70; i++) H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 });
      return { aviso, quedan: D.capullos.length, ramitas: P.ramitas, cristal: (P.materiales.cristal || 0) - cristal0 } })()`);
    ok(/Quemar el capullo/.test(quema.aviso) && quema.quedan === 1 && quema.ramitas === 1 && quema.cristal === 1, `E con una ramita quema el capullo (${JSON.stringify(quema)})`);
    const rotura = await js(`(()=>{ const H = window.__hojarasca, D = H.progreso.desafio, P = H.progreso, js = H.jugador.estado;
      P.cosas.lanza = 1;
      const c = D.capullos[0]; const x = c.x + 1.2, z = c.z;
      js.pos.set(x, H.T.altura(x, z) + 0.05, z); js.yaw = Math.atan2(x - c.x, z - c.z);
      const antes = H.desafio.aliens.length;
      for (let g = 0; g < 3; g++) { H.desafio.atacar('lanza'); for (let i = 0; i < 20; i++) H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 }); }
      const nuevo = H.desafio.aliens[H.desafio.aliens.length - 1];
      return { quedan: D.capullos.length, salio: H.desafio.aliens.length - antes, flojo: nuevo ? nuevo.vidaMax < 40 : false } })()`);
    ok(rotura.quedan === 0 && rotura.salio === 1 && rotura.flojo, `a golpes se rompe, y el que sale sale flojo (${JSON.stringify(rotura)})`);
    const abren = await js(`(()=>{ const H = window.__hojarasca, D = H.progreso.desafio;
      for (const a of H.desafio.aliens.slice()) { a.vida = 0; a.estado = 'irse'; a.t = 9; }
      H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      H.desafio.sembrarCapullos();
      const n = D.capullos.length, antes = H.desafio.aliens.length;
      H.desafio.abrirCapullos();
      return { n, salieron: H.desafio.aliens.length - antes, quedan: D.capullos.length } })()`);
    ok(abren.n === 2 && abren.salieron === 2 && abren.quedan === 0, `los que quedan se abren a la noche y suman invasores (${JSON.stringify(abren)})`);

    await seccion('7. la trochita varada');
    const varada = await js(`(()=>{ const H = window.__hojarasca, D = H.progreso.desafio;
      for (const a of H.desafio.aliens.slice()) { a.vida = 0; a.estado = 'irse'; a.t = 9; }
      H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      D.rescate = null; D.oleadas = 5; H.desafio.forzarVarada(); H.progreso.horas = 20.49; return 1 })()`);
    await js(`(()=>{ window.__hojarasca.progreso.horas = 20.6; return 1 })()`);
    await simular(0.5);
    await esperar(3000);
    const v1 = await js(`(()=>{ const H = window.__hojarasca, v = H.progreso.desafio.varada; return { v, varado: !!H.tren.est.varado } })()`);
    ok(!!v1.v && v1.varado, `una noche la trochita se queda varada (${JSON.stringify(v1)})`);
    ok(/se quedó varada/.test(await notas()), 'y el juego avisa dónde');
    const escolta = await js(`(()=>{ const H = window.__hojarasca, v = H.progreso.desafio.varada, js = H.jugador.estado;
      for (const a of H.desafio.aliens.slice()) { a.vida = 0; a.estado = 'irse'; a.t = 9; }
      H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      const p = H.tren.enVia(v.s);
      js.pos.set(p.x + 60, H.T.altura(p.x + 60, p.z) + 0.05, p.z);
      const r0 = v.recorrido;
      for (let i = 0; i < 60; i++) H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      const lejos = v.recorrido - r0;
      js.pos.set(p.x + 4, H.T.altura(p.x + 4, p.z) + 0.05, p.z);
      for (let i = 0; i < 60; i++) H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      return { lejos, cerca: v.recorrido - r0 - lejos } })()`);
    ok(escolta.lejos === 0 && escolta.cerca > 3, `avanza sólo si lo escoltás (${JSON.stringify(escolta)})`);
    const golpes = await js(`(()=>{ const H = window.__hojarasca, v = H.progreso.desafio.varada, js = H.jugador.estado;
      const p = H.tren.enVia(v.s);
      js.pos.set(p.x + 60, H.T.altura(p.x + 60, p.z) + 0.05, p.z);
      const a = H.desafio.invocar('rastreador', p.x + 2, p.z); a.vida = a.vidaMax = 999;
      const v0 = v.vida;
      for (let i = 0; i < 80; i++) H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      a.vida = 0; a.estado = 'irse'; a.t = 9;
      return { antes: v0, despues: v.vida } })()`);
    ok(golpes.despues < golpes.antes, `los invasores van por el tren (${golpes.antes} → ${golpes.despues.toFixed(1)})`);
    const llega = await js(`(()=>{ const H = window.__hojarasca, D = H.progreso.desafio, v = D.varada, js = H.jugador.estado, P = H.progreso;
      H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      v.recorrido = v.falta - 1;
      const p = H.tren.enVia(v.s);
      js.pos.set(p.x + 3, H.T.altura(p.x + 3, p.z) + 0.05, p.z);
      const c0 = P.materiales.cristal || 0;
      for (let i = 0; i < 40; i++) H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      return { llego: v.llego, suelto: !H.tren.est.varado, cristales: (P.materiales.cristal || 0) - c0 } })()`);
    ok(llega.llego && llega.suelto && llega.cristales > 0, `al llegar a la estación, Elsa agradece y el tren sigue (${JSON.stringify(llega)})`);

    await seccion('8. el volador');
    const r0 = await js(`(()=>{ const H = window.__hojarasca, D = H.progreso.desafio, js = H.jugador.estado, r = H.T.lugares.refugio;
      for (const a of H.desafio.aliens.slice()) { a.vida = 0; a.estado = 'irse'; a.t = 9; }
      H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      D.varada = null;
      js.pos.set(r.x + 20, H.T.altura(r.x + 20, r.z + 20) + 0.05, r.z + 20); js.yaw = 0; return 1 })()`);
    const antorcha = await construir('antorcha', 4);
    ok(antorcha.ok, 'una antorcha prendida');
    const apaga = await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado;
      const o = ${obraEn('antorcha', antorcha.x, antorcha.z)}; o.datos.apagada = false;
      H.desafio.defensas.refrescar?.();
      js.pos.set(${antorcha.x} + 25, js.pos.y, ${antorcha.z} + 25);
      const a = H.desafio.invocar('volador', ${antorcha.x} + 45, ${antorcha.z}); a.vida = a.vidaMax = 999;
      let alto = 0;
      for (let i = 0; i < 400 && !o.datos.apagada; i++) { H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 }); alto = Math.max(alto, a.m.g.position.y - H.T.altura(a.m.g.position.x, a.m.g.position.z)); }
      return { apagada: !!o.datos.apagada, alto: +alto.toFixed(1) } })()`);
    ok(apaga.apagada && apaga.alto > 5, `el volador va alto y baja a apagar la antorcha (${JSON.stringify(apaga)})`);
    const lanza = await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado;
      const a = H.desafio.aliens.find((x) => x.tipo === 'volador');
      for (let i = 0; i < 40; i++) H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      // arriba, la lanza no le llega aunque lo tengas justo encima
      js.pos.set(a.m.g.position.x, H.T.altura(a.m.g.position.x, a.m.g.position.z) + 0.05, a.m.g.position.z + 1.2);
      js.yaw = 0;
      const alto = a.m.g.position.y - js.pos.y, v0 = a.vida;
      H.desafio.atacar('lanza');
      return { alto: +alto.toFixed(1), golpe: v0 - a.vida } })()`);
    ok(lanza.alto > 3 && lanza.golpe === 0, `alto, la lanza no le llega (${JSON.stringify(lanza)})`);
    const ballesta = await construir('ballesta-cielo', 4);
    ok(ballesta.ok, 'se arma la ballesta al cielo');
    const tiros = await js(`(()=>{ const H = window.__hojarasca;
      const a = H.desafio.aliens.find((x) => x.tipo === 'volador');
      a.vida = a.vidaMax = 200;
      for (let i = 0; i < 300 && a.vida > 0; i++) H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      return { vida: a.vida, estado: a.estado } })()`);
    ok(tiros.vida < 200, `la ballesta al cielo lo alcanza aunque vaya alto (${JSON.stringify(tiros)})`);

    await seccion('9. la zanja de fuego');
    const zanja = await construir('zanja-fuego', 5);
    ok(zanja.ok, 'se arma una zanja de fuego');
    const carga = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso, js = H.jugador.estado;
      for (const a of H.desafio.aliens.slice()) { a.vida = 0; a.estado = 'irse'; a.t = 9; }
      H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });
      H.clima.estado.lluvia = 0; H.clima.estado.viento = 0;
      for (let i = 0; i < 25; i++) H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 });   // que refresque las defensas
      js.pos.set(${zanja.x} + 1.5, js.pos.y, ${zanja.z});
      P.materiales.tronco = 3;
      const aviso1 = H.desafio.avisoCercaDe(js.pos);
      H.desafio.usarCercaDe(js.pos);
      const o = ${obraEn('zanja-fuego', zanja.x, zanja.z)};
      const lena = o.datos.zanja?.lena;
      H.desafio.usarCercaDe(js.pos);
      return { aviso1, lena, ardiendo: o.datos.zanja?.ardiendo, troncos: P.materiales.tronco } })()`);
    ok(/Cargar la zanja/.test(carga.aviso1) && carga.lena === 2 && carga.ardiendo > 50 && carga.troncos === 1, `se carga con dos troncos y se prende (${JSON.stringify(carga)})`);
    const quemar = await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado;
      js.pos.set(${zanja.x} + 40, js.pos.y, ${zanja.z} + 40);
      const a = H.desafio.invocar('rastreador', ${zanja.x}, ${zanja.z}); a.vida = a.vidaMax = 999;
      const v0 = a.vida;
      for (let i = 0; i < 12; i++) { a.m.g.position.set(${zanja.x}, a.m.g.position.y, ${zanja.z}); H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 }); }
      return { dano: v0 - a.vida } })()`);
    ok(quemar.dano > 5, `el que la cruza se quema (${JSON.stringify(quemar)})`);
    const escape = await js(`(()=>{ const H = window.__hojarasca, e = H.clima.estado;
      // el clima recalcula el viento en cada cuadro: acá se lo fija a mano, y después se devuelve
      Object.defineProperty(e, 'viento', { get: () => 0.95, set: () => {}, configurable: true });
      e.lluvia = 0;
      const limpiar = () => { for (const a of H.desafio.aliens.slice()) { a.vida = 0; a.estado = 'irse'; a.t = 9; } };
      for (let i = 0; i < 1000 && !H.desafio.focos.length; i++) { if (i % 40 === 0) limpiar(); H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 }); }
      delete e.viento; e.viento = 0;
      return { focos: H.desafio.focos.length, avisado: /se escapó al pasto/.test(document.getElementById('notas').textContent) } })()`);
    ok(escape.focos > 0 && escape.avisado, `con viento, el fuego se escapa al pasto (${JSON.stringify(escape)})`);
    const lluvia = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso, js = H.jugador.estado;
      const o = ${obraEn('zanja-fuego', zanja.x, zanja.z)};
      if (!o) return { error: 'la zanja ya no está' };
      o.datos.zanja.ardiendo = 0; o.datos.zanja.lena = 0;   // como si ya se hubiera apagado
      const e = H.clima.estado;
      Object.defineProperty(e, 'lluvia', { get: () => 0.9, set: () => {}, configurable: true });
      js.pos.set(${zanja.x} + 1.5, js.pos.y, ${zanja.z});
      P.materiales.tronco = 4;
      H.desafio.usarCercaDe(js.pos); H.desafio.usarCercaDe(js.pos);
      delete e.lluvia; e.lluvia = 0;
      return { lena: o.datos.zanja.lena, ardiendo: o.datos.zanja.ardiendo } })()`);
    ok(lluvia.lena === 2 && lluvia.ardiendo === 0, `con lluvia no prende, y la leña queda (${JSON.stringify(lluvia)})`);
  } catch (e) {
    errores.push('excepcion: ' + (e && e.message ? e.message : e));
  }
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});

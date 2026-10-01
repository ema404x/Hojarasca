// Partida real 2.4 (Electron + WebGL): las estructuras. Relax: teñir con T, la estufa que
// echa humo y las ventanas encendidas, el horno, el buzón, la galería sobre el tendal,
// el invernadero contra la helada, el embarcadero con el kayak, el corral propio y la
// casa que abriga. Desafío: el adarve se camina. Las teclas van de verdad (keydown).
// Uso: npx electron pruebas/humo-2-4.cjs
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
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const tecla = (code) => js(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'${code}',bubbles:true})); 1`);
  const aviso = (re) => js(`(async ()=>{let a=''; for(let i=0;i<40;i++){ a=document.getElementById('aviso')?.textContent||''; if(${re}.test(a)) break; await new Promise(r=>setTimeout(r,250)); } return a})()`);
  const notas = () => js(`document.getElementById('notas').textContent`);
  const url = path.join(raiz, 'index.html');
  const abrir = async () => {
    try { await w.loadFile(url, { search: '?debug=1' }); }
    catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); }
  };
  const cargar = async (modo) => {
    await abrir();
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'${modo}', autoCalidad:false, guiaPrimerDia:false})); 1`);
    await abrir();
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
  };
  // una pieza terminada en (x, z) exactos, con la rotación que se pida
  const fundarEn = (id, x, z, rot = 0) => js(`(()=>{const H=window.__hojarasca, O=H.obras, P=H.progreso;
    Object.assign(P.materiales,{tronco:80,tabla:80,piedra:80});
    const p=H.PLANOS.find(q=>q.id==='${id}'); if(!p) return {error:'no hay plano ${id}'};
    O.elegir(p); const r=O.fundar((${x}),(${z}),(${rot}),H.jugador.estado.pos.y);
    if(!r.ok){ O.elegir(null); return {error:r.motivo}; }
    for (let g=0; g<12 && r.obra.datos.etapas<r.obra.plano.etapas.length; g++) { const k=O.avanzar(r.obra,P.materiales); if(!k.ok) break; }
    O.elegir(null); P.obras=O.obras.map(o=>o.datos);
    return {ok:r.obra.datos.etapas>=r.obra.plano.etapas.length, x:r.obra.datos.x, z:r.obra.datos.z, y:r.obra.datos.y, rot:r.obra.datos.rot}})()`);
  // una pieza terminada cerca del jugador (prueba varios lugares si uno no sirve)
  const construir = (id, cerca = 4) => js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado, O=H.obras, P=H.progreso;
    Object.assign(P.materiales,{tronco:80,tabla:80,piedra:80});
    const p=H.PLANOS.find(q=>q.id==='${id}'); if(!p) return {error:'no hay plano ${id}'};
    O.elegir(p);
    for (const d of [${cerca}, ${cerca}+2, ${cerca}+4, ${cerca}+7, ${cerca}+11]) for (const a of [0, 0.9, -0.9, 1.8, -1.8, 2.7, -2.7, 3.14]) {
      const ang=js.yaw+a, x=js.pos.x-Math.sin(ang)*d, z=js.pos.z-Math.cos(ang)*d;
      const r=O.fundar(x,z,js.yaw,js.pos.y); if(!r.ok) continue;
      for (let g=0; g<12 && r.obra.datos.etapas<r.obra.plano.etapas.length; g++) { const k=O.avanzar(r.obra,P.materiales); if(!k.ok) break; }
      O.elegir(null); P.obras=O.obras.map(o=>o.datos);
      return {ok:r.obra.datos.etapas>=r.obra.plano.etapas.length, x:r.obra.datos.x, z:r.obra.datos.z, y:r.obra.datos.y};
    }
    O.elegir(null); return {error:'no hubo lugar para ${id}'}})()`);
  const pararse = (x, z, d = 1.2) => js(`(()=>{const H=window.__hojarasca, js=H.jugador.estado; const px=(${x})+(${d}), pz=(${z});
    js.pos.x=px; js.pos.z=pz; js.pos.y=H.T.altura(px,pz)+0.05; js.yaw=Math.atan2(px-(${x}), pz-(${z})); return 1})()`);
  const obraEn = (id, x, z) => `window.__hojarasca.obras.obras.find(o=>o.plano.id==='${id}' && Math.abs(o.datos.x-(${x}))<0.01 && Math.abs(o.datos.z-(${z}))<0.01)`;
  // un claro plano cerca del refugio, para ir armando
  const irA = (dx, dz) => js(`(()=>{ const H = window.__hojarasca, r = H.T.lugares.refugio, js = H.jugador.estado;
    js.pos.set(r.x + (${dx}), H.T.altura(r.x + (${dx}), r.z + (${dz})) + 0.05, r.z + (${dz})); js.yaw = 0; return 1 })()`);

  try {
    // ================================================================ RELAX
    await cargar('relax');
    ok(await js('!!window.__hojarasca'), 'carga el Relax');
    await js(`(()=>{ window.__hojarasca.progreso.horas = 11; return 1 })()`);

    seccion('1. teñir con T');
    await irA(14, 10);
    const pared = await construir('pared-ventana', 3);
    ok(pared.ok, `se arma una pared con ventana (${JSON.stringify(pared)})`);
    await js(`(()=>{ const P = window.__hojarasca.progreso; P.entradas.calafate = { dia: 1, hora: 9, cantidad: 3 }; P.materiales.piedra = 5; return 1 })()`);
    await pararse(pared.x, pared.z, 1.0);
    await tecla('KeyO'); await esperar(300);
    await tecla('KeyT'); await esperar(300);
    const t1 = await js(`(()=>{ const o = ${obraEn('pared-ventana', pared.x, pared.z)}; const P = window.__hojarasca.progreso; return { tinte: o.datos.tinte, calafates: P.entradas.calafate.cantidad, guardado: P.obras.find(d => d === o.datos)?.tinte } })()`);
    ok(t1.tinte === 'calafate' && t1.calafates === 0 && t1.guardado === 'calafate', `T tiñe de calafate y cobra tres frutos (${JSON.stringify(t1)})`);
    await tecla('KeyT'); await esperar(300);
    const t2 = await js(`(()=>{ const o = ${obraEn('pared-ventana', pared.x, pared.z)}; return { tinte: o.datos.tinte, piedra: window.__hojarasca.progreso.materiales.piedra } })()`);
    ok(t2.tinte === 'ocre' && t2.piedra === 4, `T otra vez: ocre, una piedra (${JSON.stringify(t2)})`);
    await tecla('KeyO'); await esperar(300);
    ok(!(await js(`window.__hojarasca.progreso.carpa`)), 'con los planos abiertos, T no armó la carpa');

    seccion('2. la estufa echa humo y la ventana se enciende');
    const estufa = await fundarEn('estufa-hierro', pared.x, pared.z - 2.2);
    const farol = await fundarEn('farol-interior', pared.x + 1.2, pared.z - 1.4);
    ok(estufa.ok && farol.ok, `estufa y farol del lado de adentro (${JSON.stringify([estufa, farol])})`);
    const antes = await js(`window.__hojarasca.__casaViva().chimeneas.length`);
    await pararse(estufa.x, estufa.z, 1.0);
    await esperar(400);
    await tecla('KeyF'); await esperar(400);
    await js(`(()=>{ window.__hojarasca.__actualizarCasaViva(3); return 1 })()`);
    const humo = await js(`(()=>{ const H = window.__hojarasca, c = H.__casaViva().chimeneas; const u = c[c.length - 1]; return { n: c.length, fuego: H.clima.fogata.activa && H.clima.fogata.contenida, y: u.y, x: u.x } })()`);
    ok(humo.fuego && humo.n === antes + 1 && humo.y > estufa.y + 2, `con la estufa prendida, tu chimenea echa humo (${JSON.stringify({ antes, ...humo })})`);
    await js(`(()=>{ window.__hojarasca.progreso.horas = 23; return 1 })()`);
    await esperar(2500);
    await js(`(()=>{ window.__hojarasca.__actualizarCasaViva(3); return 1 })()`);
    const vidrio = await js(`(()=>{ const m = window.__hojarasca.__casaViva().ventanas; return { n: m.count, visible: m.visible, opacidad: m.material.opacity } })()`);
    ok(vidrio.n >= 1 && vidrio.visible && vidrio.opacidad > 0.2, `de noche la ventana se ve encendida (${JSON.stringify(vidrio)})`);
    await js(`(()=>{ const H = window.__hojarasca; H.clima.fogata.vida = -1; H.progreso.horas = 11; return 1 })()`);

    seccion('3. el horno');
    await irA(-16, 14);
    const horno = await construir('horno', 3);
    ok(horno.ok, `se arma el horno (${JSON.stringify(horno)})`);
    await js(`(()=>{ const P = window.__hojarasca.progreso; P.cosas.harina = 2; P.materiales.tronco = 3; return 1 })()`);
    await pararse(horno.x, horno.z, 1.3);
    const aHorno = await aviso('/Hornear/');
    ok(/Hornear pan casero/.test(aHorno), `el aviso dice qué se hornea («${aHorno}»)`);
    await tecla('KeyE'); await esperar(500);
    const pan = await js(`(()=>{ const P = window.__hojarasca.progreso; return { pan: P.entradas['pan-casero']?.cantidad, harina: P.cosas.harina, tronco: P.materiales.tronco } })()`);
    ok(pan.pan === 3 && pan.harina === 0 && pan.tronco === 2, `E hornea tres panes con dos medidas y un tronco (${JSON.stringify(pan)})`);

    seccion('4. el buzón');
    const buzon = await construir('buzon', 4);
    ok(buzon.ok, `se arma el buzón (${JSON.stringify(buzon)})`);
    await js(`(()=>{ const H = window.__hojarasca, P = H.progreso, c = H.correo(); c.llegadas['c-casa'] = P.dia; return 1 })()`);
    await pararse(buzon.x, buzon.z, 1.0);
    const aBuzon = await aviso('/buzón/');
    ok(/hay carta/.test(aBuzon), `el buzón avisa que hay carta («${aBuzon}»)`);
    const carta = await js(`(async ()=>{ const t = []; const abierta = () => !document.getElementById('charla').classList.contains('oculto');
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',bubbles:true})); await new Promise(r=>setTimeout(r,100));
      const quien = document.getElementById('charla-quien').textContent;
      for (let i = 0; i < 14 && abierta(); i++) { t.push(document.getElementById('charla-texto').textContent); document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',bubbles:true})); await new Promise(r=>setTimeout(r,80)); }
      return { quien, partes: t.length, leida: !!window.__hojarasca.progreso.entradas['c-casa'], cerrada: !abierta() } })()`);
    ok(/Tu buzón/.test(carta.quien) && carta.partes > 2 && carta.leida && carta.cerrada, `E abre el buzón y la carta se lee ahí (${JSON.stringify(carta)})`);

    seccion('5. la galería sobre el tendal');
    await irA(22, -14);
    const tendal = await construir('tendal', 4);
    ok(tendal.ok, `se arma un tendal (${JSON.stringify(tendal)})`);
    const alero = await fundarEn('alero', tendal.x, tendal.z, 0);
    ok(alero.ok, `la galería va encima del tendal (${JSON.stringify(alero)})`);
    const seco = await js(`(()=>{ const H = window.__hojarasca, o = ${obraEn('tendal', tendal.x, tendal.z)};
      const js = H.jugador.estado; js.pos.set(${alero.x} + 0.4, H.T.altura(${alero.x}, ${alero.z}) + 0.05, ${alero.z} + 0.3);
      return { tendal: H.obras.cubiertaDePieza(o.datos)?.plano.id, vos: H.obras.bajoCubierta(js.pos)?.cubierta?.id } })()`);
    ok(seco.tendal === 'alero' && seco.vos === 'alero', `abajo no llueve, ni al tendal ni a vos (${JSON.stringify(seco)})`);

    seccion('6. el invernadero y la helada');
    await irA(-20, -18);
    const adentro = await construir('cantero', 3);
    const inv = adentro.ok ? await fundarEn('invernadero', adentro.x, adentro.z, 0) : { error: 'sin cantero' };
    const afuera = await construir('cantero', 8);
    ok(adentro.ok && inv.ok && afuera.ok, `un cantero bajo el invernadero y otro afuera (${JSON.stringify([adentro, inv, afuera])})`);
    const helada = await js(`(()=>{ const H = window.__hojarasca, P = H.progreso;
      const clave = (x, z) => Math.round(x) + ':' + Math.round(z);
      P.huerta[clave(${adentro.x}, ${adentro.z})] = { cultivo: 'habas', dia: P.dia, lluvia: 0, ultimaLluvia: -1 };
      P.huerta[clave(${afuera.x}, ${afuera.z})] = { cultivo: 'habas', dia: P.dia, lluvia: 0, ultimaLluvia: -1 };
      const n = H.__helarLaHuerta();
      return { n, adentro: P.huerta[clave(${adentro.x}, ${adentro.z})].dia - P.dia, afuera: P.huerta[clave(${afuera.x}, ${afuera.z})].dia - P.dia, nota: document.getElementById('notas').textContent } })()`);
    ok(helada.n === 1 && helada.adentro === 0 && helada.afuera === 1 && /Heló la huerta/.test(helada.nota), `la helada atrasa lo de afuera y no lo del invernadero (${JSON.stringify({ ...helada, nota: undefined })})`);

    seccion('7. el embarcadero y el kayak');
    const sitio = await js(`(()=>{ const H = window.__hojarasca, O = H.obras, P = H.PLANOS.find(p => p.id === 'embarcadero');
      const L = { x: 150, z: 110 };
      for (let a = 0; a < 6.28; a += 0.05) for (let r = 90; r < 135; r += 0.7) {
        const x = L.x + Math.cos(a) * r, z = L.z + Math.sin(a) * r;
        for (let k = 0; k < 8; k++) { const rot = k * Math.PI / 4; if (O.revisarSitio(x, z, P, rot).ok) return { x, z, rot }; }
      }
      return null })()`);
    ok(!!sitio, `hay orilla para un embarcadero (${JSON.stringify(sitio)})`);
    if (sitio) {
      await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado; js.pos.set(${sitio.x}, H.T.altura(${sitio.x}, ${sitio.z}) + 0.1, ${sitio.z}); return 1 })()`);
      const emb = await fundarEn('embarcadero', sitio.x, sitio.z, sitio.rot);
      ok(emb.ok, `se arma el embarcadero (${JSON.stringify(emb)})`);
      await esperar(2500);
      await js(`(()=>{ window.__hojarasca.__actualizarCasaViva(3); return 1 })()`);
      const amarre = await js(`(()=>{ const H = window.__hojarasca, k = H.kayak.est; return { d: Math.hypot(k.x - (${emb.x}), k.z - (${emb.z})), plats: H.col.plataformas.filter(p => p.duenio && p.duenio.plano?.id === 'embarcadero').length } })()`);
      ok(amarre.d < 4 && amarre.plats === 1, `al terminarlo, el kayak queda amarrado ahí y las tablas se pisan (${JSON.stringify(amarre)})`);
      // se lleva el kayak lejos y E en las tablas lo trae
      await js(`(()=>{ const H = window.__hojarasca, k = H.kayak.est, js = H.jugador.estado;
        k.x = 150; k.z = 110;
        const lz = -1.2, x = ${emb.x} + lz * Math.sin(${emb.rot}), z = ${emb.z} + lz * Math.cos(${emb.rot});
        js.pos.set(x, ${emb.y} + 0.5, z); return 1 })()`);
      const aEmb = await aviso('/kayak/');
      ok(/Traer el kayak/.test(aEmb), `parado en el embarcadero: «${aEmb}»`);
      await tecla('KeyE'); await esperar(400);
      const trajo = await js(`(()=>{ const k = window.__hojarasca.kayak.est; return Math.hypot(k.x - (${emb.x}), k.z - (${emb.z})) })()`);
      ok(trajo < 4, `E trae el kayak (${trajo.toFixed(2)} m)`);
      const subir = await aviso('/Subir al kayak/');
      ok(/Subir al kayak/.test(subir), `y con el kayak al lado, el aviso vuelve a ser subir («${subir}»)`);
    }

    seccion('8. el corral propio');
    await irA(-30, 30);
    const beb = await construir('bebedero', 5);
    ok(beb.ok, `se arma el bebedero (${JSON.stringify(beb)})`);
    for (const [dx, dz, r] of [[3.4, 0, Math.PI / 2], [-3.4, 0, Math.PI / 2], [0, 3.4, 0], [0, -3.4, 0]]) {
      const c = await fundarEn('cerco', beb.x + dx, beb.z + dz, r);
      if (!c.ok) ok(false, `cerco (${JSON.stringify(c)})`);
    }
    await js(`(()=>{ window.__hojarasca.__actualizarCasaViva(3); return 1 })()`);
    const corral = await js(`(()=>{ const H = window.__hojarasca, c = H.__casaViva().corral, P = H.progreso;
      return { guardado: !!P.corral, ovejas: c ? c.ovejas.length : 0, propias: c ? c.ovejas.every(o => o.propia) : false, nota: /Don Ramón te trajo dos ovejas/.test(document.getElementById('notas').textContent) } })()`);
    ok(corral.guardado && corral.ovejas === 2 && corral.propias && corral.nota, `con cuatro cercos, Don Ramón trae dos ovejas (${JSON.stringify(corral)})`);
    const esquila = await js(`(async ()=>{ const H = window.__hojarasca, c = H.__casaViva().corral, P = H.progreso, js = H.jugador.estado;
      P.cosas.tijera = 1; const lana0 = P.materiales.lana || 0;
      const o = c.ovejas[0]; js.pos.set(o.pos.x + 0.8, o.pos.y + 0.05, o.pos.z);
      await new Promise(r => setTimeout(r, 1500));
      const a = document.getElementById('aviso')?.textContent || '';
      document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',bubbles:true}));
      await new Promise(r => setTimeout(r, 300));
      return { aviso: a, lana: (P.materiales.lana || 0) - lana0, esquiladas: P.corral.esquilada.filter(d => d !== null).length, galpon: P.majada.esquilada.filter(d => d !== null).length } })()`);
    ok(esquila.lana === 2 && esquila.esquiladas === 1 && esquila.galpon === 0, `E esquila la oveja propia, no una del galpón (${JSON.stringify(esquila)})`);

    seccion('9. se guarda');
    const guardada = await js(`(()=>{ const H = window.__hojarasca; H.guardar();
      for (const k of Object.keys(localStorage)) { try { const p = JSON.parse(localStorage.getItem(k)); if (p && p.corral && Array.isArray(p.obras)) return { corral: p.corral.esquilada.length, tinte: p.obras.some(o => o.tinte === 'ocre'), pan: p.entradas?.['pan-casero']?.cantidad }; } catch (e) {} }
      return null })()`);
    ok(guardada && guardada.corral === 2 && guardada.tinte && guardada.pan === 3, `la partida guarda el corral, el tinte y el pan (${JSON.stringify(guardada)})`);

    // ================================================================ DESAFÍO
    await cargar('desafio');
    ok(await js('!!window.__hojarasca?.desafio'), 'carga el Desafío');
    seccion('10. el adarve');
    const planos = await js(`(()=>{ const ids = new Set(window.__hojarasca.PLANOS.map(p => p.id)); return { adarve: ids.has('adarve') } })()`);
    ok(planos.adarve, 'el adarve está en los planos');
    await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado, g = H.T.lugares.galpon || H.T.lugares.refugio; js.pos.set(g.x + 20, H.T.altura(g.x + 20, g.z + 20) + 0.05, g.z + 20); js.yaw = 0; return 1 })()`);
    const adarve = await construir('adarve', 4);
    ok(adarve.ok, `se arma el adarve (${JSON.stringify(adarve)})`);
    const arriba = await js(`(()=>{ const H = window.__hojarasca, p = H.col.plataformas.filter(q => q.duenio && q.duenio.plano?.id === 'adarve');
      return { n: p.length, alto: Math.max(...p.map(q => q.alto)) - (${adarve.y}) } })()`);
    ok(arriba.n === 10 && Math.abs(arriba.alto - 2.06) < 0.01, `se sube por la escalera a la pasarela (${JSON.stringify(arriba)})`);
    // de verdad: el jugador camina escalera arriba hasta la pasarela
    const subida = await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado, x = ${adarve.x}, z = ${adarve.z};
      const o = H.obras.obras.find(q => q.plano.id === 'adarve' && Math.abs(q.datos.x - x) < 0.01), rot = o.datos.rot;
      const al = (lz) => ({ x: x + lz * Math.sin(rot), z: z + lz * Math.cos(rot) });
      const pie = al(-3.9); js.pos.set(pie.x, H.T.altura(pie.x, pie.z) + 0.05, pie.z); js.yaw = rot + Math.PI; js.pitch = 0;
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true }));
      let max = -99; const x0 = js.pos.x, z0 = js.pos.z;
      for (let i = 0; i < 70; i++) { H.jugador.actualizar(0.05); max = Math.max(max, js.pos.y - (${adarve.y})); }
      document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', bubbles: true }));
      return { sobre: max, anduvo: Math.hypot(js.pos.x - x0, js.pos.z - z0) } })()`);
    ok(subida.sobre > 1.8, `caminando para adelante, subís la escalera (${JSON.stringify(subida)})`);

    seccion('11. la torre de vigía se sube caminando');
    await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado, g = H.T.lugares.galpon || H.T.lugares.refugio; js.pos.set(g.x - 24, H.T.altura(g.x - 24, g.z + 18) + 0.05, g.z + 18); js.yaw = 0; return 1 })()`);
    const torre = await construir('torre-vigia', 5);
    ok(torre.ok, `se arma la torre (${JSON.stringify(torre)})`);
    const torreArriba = await js(`(()=>{ const H = window.__hojarasca, js = H.jugador.estado, x = ${torre.x}, z = ${torre.z};
      const o = H.obras.obras.find(q => q.plano.id === 'torre-vigia' && Math.abs(q.datos.x - x) < 0.01), rot = o.datos.rot, base = o.datos.y;
      const c = Math.cos(rot), sn = Math.sin(rot), al = (lx, lz) => ({ x: x + lx * c + lz * sn, z: z - lx * sn + lz * c });
      const pie = al(1.62, 2.3); js.pos.set(pie.x, H.T.altura(pie.x, pie.z) + 0.05, pie.z); js.yaw = rot; js.pitch = 0;
      const local = () => { const dx = js.pos.x - x, dz = js.pos.z - z; return { lx: dx * c - dz * sn, lz: dx * sn + dz * c }; };
      const W = (tipo) => document.dispatchEvent(new KeyboardEvent(tipo, { code: 'KeyW', bubbles: true }));
      W('keydown');
      let i = 0; for (; i < 80 && local().lz > -0.85; i++) H.jugador.actualizar(0.05);
      W('keyup');
      // se frena en el último peldaño, como cualquiera antes de girar
      js.vel.x = 0; js.vel.z = 0;
      for (let k = 0; k < 4; k++) H.jugador.actualizar(0.05);
      const enEscalera = js.pos.y - base;
      // arriba, se gira hacia la plataforma (-x local) y se pasa por el hueco de la baranda
      js.yaw = rot + Math.PI / 2; W('keydown');
      for (let k = 0; k < 16; k++) H.jugador.actualizar(0.05);
      W('keyup');
      // las defensas repasan sus torres una vez por segundo
      for (let k = 0; k < 25; k++) H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 });
      return { enEscalera: +enEscalera.toFixed(2), arriba: +(js.pos.y - base).toFixed(2), lx: +local().lx.toFixed(2), enTorre: !!H.desafio.defensas.jugadorEnTorre(js) } })()`);
    ok(torreArriba.enEscalera > 2.2 && torreArriba.arriba > 2.3 && torreArriba.lx < 1.1 && torreArriba.enTorre, `subís la escalera y pasás a la plataforma (${JSON.stringify(torreArriba)})`);
  } catch (e) {
    errores.push('excepcion: ' + (e && e.message ? e.message : e));
  }
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});

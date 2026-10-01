// Partida real 2.9 (Electron + WebGL): el velero, la tirolesa y el puente colgante.
// Se arma el varadero en la orilla del lago y aparece el velero; se sube con E (el aviso lo
// dice), se caza la escota con las teclas de verdad y se cruza el lago con el viento; contra
// el viento no anda; se baja con E en la otra orilla. Se arman dos postes de tirolesa en
// una ladera: E en el de arriba y el cable te lleva hasta el de abajo (desde abajo no sube).
// Dos estribos a los lados del arroyo: el puente se tiende y se cruza caminando (W).
// Al final se guarda, se recarga, y todo sigue ahí (el velero donde quedó, con su nombre).
// Guarda y devuelve el localStorage que había (las pruebas de humo comparten perfil).
// Uso: npx electron pruebas/humo-2-9-vela.cjs     (HUMO_PERFIL=<carpeta> para un perfil aparte)
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
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 180 s (${donde})`)), 180000)),
  ]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const H = 'window.__hojarasca';
  const listo = async () => {
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.jugador && ${H}.__vela && ${H}.__vela())`).catch(() => false)) return true; }
    return false;
  };
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
    await js(`(()=>{ ${H}.ajustes.limiteFps = 'libre'; for (let i = 0; i < 4; i++) ${H}.__bucle(); return 1 })()`);
  };
  const tecla = (code, tipo = 'keydown') => js(`document.dispatchEvent(new KeyboardEvent('${tipo}', { code: '${code}', key: '${code}', bubbles: true })); 1`);
  // unos cuadros enteros (el aviso y las revisiones periódicas corren en el bucle)
  const cuadros = (n = 6) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return ${H}.__aviso() })()`);
  // una pieza terminada en (x, z) exactos
  const fundarEn = (id, x, z, rot = 0) => js(`(()=>{const H=${H}, O=H.obras, P=H.progreso;
    Object.assign(P.materiales,{tronco:90,tabla:90,piedra:90,lana:20});
    const p=H.PLANOS.find(q=>q.id==='${id}'); if(!p) return {error:'no hay plano ${id}'};
    O.elegir(p); const r=O.fundar((${x}),(${z}),(${rot}),H.T.altura((${x}),(${z})));
    if(!r.ok){ O.elegir(null); return {error:r.motivo}; }
    for (let g=0; g<6 && r.obra.datos.etapas<r.obra.plano.etapas.length; g++) { const k=O.avanzar(r.obra,P.materiales); if(!k.ok) break; }
    O.elegir(null); P.obras=O.obras.map(o=>o.datos);
    return {ok:r.obra.datos.etapas>=r.obra.plano.etapas.length, x:r.obra.datos.x, z:r.obra.datos.z, y:r.obra.datos.y, rot:r.obra.datos.rot}})()`);
  let copiaStorage = null;

  try {
    await abrir();
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!${H}`).catch(() => false)) break; }
    copiaStorage = await js(`JSON.stringify(Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])))`);
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'}));
      // hasta recargar no se escribe más: el guardado del beforeunload no trae de vuelta la partida de antes
      Storage.prototype.setItem = () => {}; Storage.prototype.removeItem = () => {}; Storage.prototype.clear = () => {}; 1`);
    await abrir();
    ok(await listo(), 'el juego cargó (con el velero y las tirolesas creados)');
    await entrar();
    ok(await js(`${H}.progreso.vela === null && !${H}.__vela().est.hay && !${H}.__vela().barco.visible`), 'partida nueva: sin varadero no hay velero');

    // ---------------------------------------------------------------- el velero
    seccion('1. el varadero y el velero');
    const sitio = await js(`(()=>{ const H = ${H}, O = H.obras, P = H.PLANOS.find(p => p.id === 'varadero-velero');
      const L = { x: 150, z: 110 };
      for (let a = 0; a < 6.28; a += 0.05) for (let r = 90; r < 140; r += 0.7) {
        const x = L.x + Math.cos(a) * r, z = L.z + Math.sin(a) * r;
        for (let k = 0; k < 8; k++) { const rot = k * Math.PI / 4; if (O.revisarSitio(x, z, P, rot).ok) return { x, z, rot }; }
      }
      return null })()`);
    ok(!!sitio, `hay orilla para el varadero (${JSON.stringify(sitio)})`);
    const enSeco = await js(`${H}.obras.revisarSitio(${H}.T.lugares.refugio.x + 12, ${H}.T.lugares.refugio.z + 12, ${H}.PLANOS.find(p => p.id === 'varadero-velero'), 0).motivo || ''`);
    ok(/agua|orilla|pegado|pendiente|Gir/.test(enSeco), `lejos del lago, el varadero no se puede poner («${enSeco}»)`);
    await js(`(()=>{ const H = ${H}; H.jugador.estado.pos.set(${sitio.x}, H.T.altura(${sitio.x}, ${sitio.z}) + 0.1, ${sitio.z}); return 1 })()`);
    const vara = await fundarEn('varadero-velero', sitio.x, sitio.z, sitio.rot);
    ok(vara.ok, `se arma el varadero (${JSON.stringify(vara)})`);
    // el velero revisa los varaderos cada medio segundo de juego (los cuadros de la
    // prueba duran casi nada): se le da ese medio segundo de una
    await js(`(()=>{ const H = ${H}; H.__vela().actualizarQuieto(1, H.__U().uTiempo.value); return 1 })()`);
    await cuadros(4);
    let v = await js(`(()=>{ const V = ${H}.__vela(), e = V.est; return { hay: e.hay, visible: V.barco.visible, d: Math.hypot(e.x - (${vara.x}), e.z - (${vara.z})), notas: document.getElementById('notas').textContent } })()`);
    ok(v.hay && v.visible && v.d < 7, `terminado el varadero, el velero queda amarrado ahí (${v.d.toFixed(2)} m)`);
    ok(/velero quedó amarrado/.test(v.notas), 'y lo avisa');
    ok(await js(`${H}.col.plataformas.filter(p => p.duenio && p.duenio.plano?.id === 'varadero-velero').length === 1`), 'las tablas del varadero se pisan');

    seccion('2. lo personal llega al velero');
    const pers = await js(`(()=>{ const H = ${H}; H.__personal.cambiar('botes', { casco: '#2f5a74', nombre: 'Albatros', banderin: 'golondrina', colorBanderin: '#b8322a' });
      const V = H.__vela(); const p = V.personal(); let carteles = 0; V.barco.traverse((o) => { if (o.material?.map) carteles++; });
      return { casco: '#' + V.barco.userData.casco.material.color.getHexString(), nombre: p.nombre, banderin: p.banderin, carteles, kayak: H.kayak.personal().nombre } })()`);
    ok(pers.casco === '#2f5a74' && pers.nombre === 'Albatros' && pers.banderin === 'golondrina' && pers.carteles >= 2 && pers.kayak === 'Albatros',
      `el casco, el nombre a los costados y el banderín del kayak también van en el velero (${JSON.stringify(pers)})`);

    seccion('3. subir con E');
    await js(`(()=>{ const H = ${H}, e = H.__vela().est, js = H.jugador.estado;
      const x = e.x + Math.cos(e.rumbo) * 0 - Math.sin(e.rumbo) * 0, z = e.z;
      // en la punta del varadero, al lado del velero
      const rot = ${vara.rot}, lz = 2.4, px = ${vara.x} + lz * Math.sin(rot), pz = ${vara.z} + lz * Math.cos(rot);
      js.pos.set(px, ${vara.y} + 0.5, pz); js.yaw = 0; return 1 })()`);
    let aviso = await cuadros(6);
    ok(aviso.includes('Subir al velero'), `al lado del velero, el aviso: «${aviso}»`);
    await tecla('KeyE'); await esperar(200);
    v = await js(`(()=>{ const js = ${H}.jugador.estado; return { vela: !!js.enVela, kayak: !!js.enKayak, activo: ${H}.__vela().est.activo, kayakActivo: ${H}.kayak.est.activo } })()`);
    ok(v.vela && v.kayak && v.activo && !v.kayakActivo, `E sube al velero (${JSON.stringify(v)})`);

    seccion('4. contra el viento no anda');
    // viento firme, del oeste; la proa, justo contra el viento
    const contra = await js(`(()=>{ const H = ${H}, V = H.__vela(), e = V.est, js = H.jugador.estado;
      H.clima.estado.vientoBase = 0.7; H.clima.estado.viento = 0.7;
      const x0 = e.x, z0 = e.z;
      // lejos de la orilla: al centro del lago
      e.x = 150; e.z = 110; e.vel = 0;
      const vh = Math.PI / 2 + Math.sin(H.__U().uTiempo.value * 0.0021) * 0.28 + Math.sin(H.__U().uTiempo.value * 0.00057 + 1.3) * 0.12;
      e.rumbo = vh + Math.PI; e.escota = 0.1;
      const ax = e.x, az = e.z;
      for (let i = 0; i < 200; i++) { H.clima.estado.viento = 0.7; H.jugador.actualizar(0.05); }
      return { d: Math.hypot(e.x - ax, e.z - az), flamea: e.flamea, texto: V.texto(H.__U().uTiempo.value) } })()`);
    ok(contra.d < 3 && contra.flamea, `proa al viento, en 10 s no avanza: la vela flamea (${contra.d.toFixed(2)} m · ${contra.texto})`);

    seccion('5. cruzar el lago con el viento de través');
    // de través, apuntando al lado del lago con más agua; se caza con S/W de verdad hasta que esté bien puesta
    await js(`(()=>{ const H = ${H}, e = H.__vela().est;
      const vh = Math.PI / 2 + Math.sin(H.__U().uTiempo.value * 0.0021) * 0.28 + Math.sin(H.__U().uTiempo.value * 0.00057 + 1.3) * 0.12;
      const hondo = (x, z) => H.T.altura(x, z) < -0.35 && Math.hypot(x - 150, z - 110) < 220;
      const agua = (r) => { let n = 0; for (let d = 2; d < 400; d += 2) { if (!hondo(e.x + Math.sin(r) * d, e.z + Math.cos(r) * d)) break; n = d; } return n; };
      const a = vh - Math.PI / 2, b = vh + Math.PI / 2;
      e.rumbo = agua(a) >= agua(b) ? a : b; e.vel = 0; e.escota = 0; e.x0 = e.x; e.z0 = e.z; e.aguaAdelante = Math.max(agua(a), agua(b));
      return 1 })()`);
    await tecla('KeyS');   // soltar escota
    const trim = await js(`(()=>{ const H = ${H}, e = H.__vela().est; let n = 0;
      while (n < 200 && !/bien puesta/.test(H.__vela().texto(H.__U().uTiempo.value))) { H.clima.estado.viento = 0.7; H.jugador.actualizar(0.05); n++; }
      return { n, escota: e.escota, texto: H.__vela().texto(H.__U().uTiempo.value) } })()`);
    await tecla('KeyS', 'keyup');
    ok(/bien puesta/.test(trim.texto) && trim.escota > 0.2, `soltando la escota con S queda bien puesta (${JSON.stringify(trim)})`);
    const cruce = await js(`(()=>{ const H = ${H}, e = H.__vela().est, js = H.jugador.estado; let t = 0, vmax = 0, fuera = 0, trabado = 0;
      const hondo = (x, z) => H.T.altura(x, z) < -0.35 && Math.hypot(x - 150, z - 110) < 220;
      while (t < 150) { H.clima.estado.viento = 0.7; H.jugador.actualizar(0.05); t += 0.05; vmax = Math.max(vmax, e.vel); if (!hondo(e.x, e.z)) fuera++;
        if (e.vel < 0.05 && t > 15) { if (++trabado > 40) break; } else trabado = 0; }
      return { t: +t.toFixed(1), d: Math.hypot(e.x - e.x0, e.z - e.z0), agua: e.aguaAdelante, vmax, fuera, jugadorEnPopa: Math.hypot(js.pos.x - e.x, js.pos.z - e.z),
        equipo: document.getElementById('equipo').textContent, botavara: e.botavara } })()`);
    ok(cruce.vmax > 2 && cruce.d > Math.min(100, cruce.agua - 15), `con viento de través cruza el lago (${cruce.d.toFixed(0)} m en ${cruce.t} s, ${cruce.vmax.toFixed(1)} m/s de punta, había ${cruce.agua} m de agua)`);
    ok(cruce.fuera === 0, 'siempre por agua honda');
    ok(cruce.jugadorEnPopa > 1 && cruce.jugadorEnPopa < 1.7 && Math.abs(cruce.botavara) > 0.15, `el jugador va a popa y la botavara abierta a sotavento (${cruce.jugadorEnPopa.toFixed(2)} m, ${cruce.botavara.toFixed(2)} rad)`);
    await cuadros(3);
    ok(/Velero · viento/.test(await js(`document.getElementById('equipo').textContent`)), 'abajo dice el viento y cómo va la vela');

    seccion('6. bajar con E en la otra orilla');
    // se arrima a la orilla que tiene adelante (si el cruce no llegó hasta ahí)
    const orilla = await js(`(()=>{ const H = ${H}, V = H.__vela(), e = V.est;
      const hondo = (x, z) => H.T.altura(x, z) < -0.35 && Math.hypot(x - 150, z - 110) < 220;
      for (let i = 0; i < 400 && !V.lugarParaBajar(); i++) { const nx = e.x + Math.sin(e.rumbo) * 0.5, nz = e.z + Math.cos(e.rumbo) * 0.5; if (!hondo(nx + Math.sin(e.rumbo) * 2.3, nz + Math.cos(e.rumbo) * 2.3)) break; e.x = nx; e.z = nz; }
      e.vel = 0; H.jugador.actualizar(0.05); return !!V.lugarParaBajar() })()`);
    aviso = await cuadros(6);
    ok(orilla && aviso.includes('Bajar del velero'), `cerca de la orilla, el aviso: «${aviso}»`);
    await tecla('KeyE'); await esperar(200);
    v = await js(`(()=>{ const H = ${H}, js = H.jugador.estado, e = H.__vela().est; return { vela: !!js.enVela, kayak: !!js.enKayak, activo: e.activo, seco: !H.T.agua(js.pos.x, js.pos.z), d: Math.hypot(js.pos.x - e.x, js.pos.z - e.z), bx: e.x, bz: e.z } })()`);
    ok(!v.vela && !v.kayak && !v.activo && v.seco && v.d < 10, `E baja a tierra y el velero queda ahí (${JSON.stringify(v)})`);
    const barcoQuedo = { x: v.bx, z: v.bz };

    // ---------------------------------------------------------------- la tirolesa
    seccion('7. dos postes de tirolesa en una ladera');
    const ladera = await js(`(()=>{ const H = ${H}, O = H.obras, P = H.PLANOS.find(p => p.id === 'poste-tirolesa'), TI = H.__tirolesas(), T = H.T;
      const r = T.lugares.refugio;
      for (let k = 0; k < 6000; k++) {
        const a = k * 2.399, rr = 20 + (k % 60) * 4;
        const x = r.x + Math.cos(a) * rr, z = r.z + Math.sin(a) * rr;
        if (!O.revisarSitio(x, z, P, 0).ok) continue;
        for (let j = 0; j < 12; j++) {
          const b = j * Math.PI / 6, L = 26 + (k % 3) * 8;
          const x2 = x + Math.cos(b) * L, z2 = z + Math.sin(b) * L;
          const y1 = T.altura(x, z), y2 = T.altura(x2, z2);
          if (y1 - y2 < 2.5 || !O.revisarSitio(x2, z2, P, 0).ok) continue;
          if (TI.probarLinea('tirolesa', { x, y: y1, z }, { x: x2, y: y2, z: z2 }).ok) return { x, z, x2, z2, y1, y2, L };
        }
      }
      return null })()`);
    ok(!!ladera, `hay una ladera para tender una tirolesa (${JSON.stringify(ladera)})`);
    const arriba = await fundarEn('poste-tirolesa', ladera.x, ladera.z);
    await js(`(()=>{ const H = ${H}; H.__tirolesas().actualizar(1, H.jugador); return 1 })()`);
    await js(`(()=>{ const H = ${H}, js = H.jugador.estado; js.pos.set(${ladera.x} + 1, H.T.altura(${ladera.x} + 1, ${ladera.z}) + 0.05, ${ladera.z}); return 1 })()`);
    aviso = await cuadros(6);
    ok(arriba.ok && /falta la otra punta/.test(aviso), `con un solo poste, el aviso: «${aviso}»`);
    const abajo = await fundarEn('poste-tirolesa', ladera.x2, ladera.z2);
    ok(abajo.ok, 'se arma el segundo poste');
    await js(`(()=>{ const H = ${H}; H.__tirolesas().actualizar(1, H.jugador); return 1 })()`);
    const tir = await js(`${H}.__tirolesas().lineas.filter(l => l.tipo === 'tirolesa').map(l => ({ largo: l.largo, A: l.A.y, B: l.B.y }))`);
    ok(tir.length === 1 && Math.abs(tir[0].largo - ladera.L) < 0.5, `el cable se tiende solo entre los dos (${JSON.stringify(tir)})`);

    seccion('8. desde abajo no sube; desde arriba, E y abajo');
    await js(`(()=>{ const H = ${H}, js = H.jugador.estado; js.pos.set(${ladera.x2} + 1, H.T.altura(${ladera.x2} + 1, ${ladera.z2}) + 0.05, ${ladera.z2}); return 1 })()`);
    aviso = await cuadros(6);
    ok(/sube desde acá/.test(aviso), `en el poste de abajo: «${aviso}»`);
    await tecla('KeyE'); await esperar(150);
    ok(!(await js(`!!${H}.jugador.estado.enCable`)), 'E no te cuelga para subir');
    await js(`(()=>{ const H = ${H}, js = H.jugador.estado; js.pos.set(${ladera.x} + 1, H.T.altura(${ladera.x} + 1, ${ladera.z}) + 0.05, ${ladera.z}); return 1 })()`);
    aviso = await cuadros(6);
    ok(/Largarse por la tirolesa/.test(aviso), `en el poste de arriba: «${aviso}»`);
    await tecla('KeyE'); await esperar(150);
    const viaje = await js(`(()=>{ const H = ${H}, js = H.jugador.estado; const colgado = !!js.enCable; let t = 0, minPies = 99, vmax = 0;
      while (js.enCable && t < 90) { H.jugador.actualizar(0.05); t += 0.05; if (js.enCable) { minPies = Math.min(minPies, js.pos.y - H.T.altura(js.pos.x, js.pos.z)); vmax = Math.max(vmax, js.velocidadActual); } }
      for (let i = 0; i < 3; i++) H.__bucle();
      return { colgado, t: +t.toFixed(1), llego: !js.enCable, d: Math.hypot(js.pos.x - (${ladera.x2}), js.pos.z - (${ladera.z2})), minPies, vmax, pie: js.pos.y - H.T.altura(js.pos.x, js.pos.z),
        notas: document.getElementById('notas').textContent } })()`);
    ok(viaje.colgado, 'E te cuelga de la roldana');
    ok(viaje.llego && viaje.d < 3 && viaje.t < 40, `la gravedad te lleva hasta el otro poste (${viaje.t} s, ${viaje.vmax.toFixed(1)} m/s de punta, a ${viaje.d.toFixed(2)} m del poste)`);
    ok(viaje.minPies > 0.1 && Math.abs(viaje.pie) < 0.6, `sin tocar el suelo en el camino, y se baja parado (${viaje.minPies.toFixed(2)} m · ${viaje.pie.toFixed(2)} m)`);
    ok(/Llegaste al otro poste/.test(viaje.notas), 'y lo cuenta');

    // ---------------------------------------------------------------- el puente
    seccion('9. dos estribos a los lados del arroyo');
    const cruceArroyo = await js(`(()=>{ const H = ${H}, O = H.obras, P = H.PLANOS.find(p => p.id === 'estribo-puente'), TI = H.__tirolesas(), T = H.T;
      for (let i = 20; i < T.rio.length - 20; i += 3) {
        const p = T.rio[i], q = T.rio[i + 1];
        if (Math.hypot(p.x - 150, p.z - 110) < 240 || Math.max(Math.abs(p.x), Math.abs(p.z)) > 330) continue;
        if (T.puentes.some((b) => Math.hypot(b.x - p.x, b.z - p.z) < 25)) continue;
        const tx = q.x - p.x, tz = q.z - p.z, l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l;
        for (const m of [2.5, 3.5, 5, 6.5]) {
          const d = p.w + m;
          const a = { x: p.x + nx * d, z: p.z + nz * d }, b = { x: p.x - nx * d, z: p.z - nz * d };
          if (!O.revisarSitio(a.x, a.z, P, 0).ok || !O.revisarSitio(b.x, b.z, P, 0).ok) continue;
          if (TI.probarLinea('puente', { ...a, y: T.altura(a.x, a.z) }, { ...b, y: T.altura(b.x, b.z) }).ok) return { a, b, agua: !!T.agua(p.x, p.z), w: p.w };
        }
      }
      return null })()`);
    ok(!!cruceArroyo, `hay un tramo del arroyo para el puente (${JSON.stringify(cruceArroyo)})`);
    const e1 = await fundarEn('estribo-puente', cruceArroyo.a.x, cruceArroyo.a.z);
    const e2 = await fundarEn('estribo-puente', cruceArroyo.b.x, cruceArroyo.b.z);
    ok(e1.ok && e2.ok, 'se arman los dos estribos');
    await js(`(()=>{ const H = ${H}; H.__tirolesas().actualizar(1, H.jugador); return 1 })()`);
    const puente = await js(`(()=>{ const H = ${H}, l = H.__tirolesas().lineas.find(x => x.tipo === 'puente'); if (!l) return null;
      return { largo: l.largo, plats: H.col.plataformas.filter(p => p.duenio === l.duenio).length, comba: l.comba } })()`);
    ok(puente && puente.plats > 10, `el puente se tiende solo entre los dos (${JSON.stringify(puente)})`);

    seccion('10. cruzarlo caminando');
    await js(`(()=>{ const H = ${H}, js = H.jugador.estado; js.pos.set(${e1.x}, ${e1.y} + 0.5, ${e1.z});
      js.yaw = Math.atan2(-((${e2.x}) - (${e1.x})), -((${e2.z}) - (${e1.z}))); js.pitch = 0; js.vel.set(0, 0, 0); H.jugador.actualizar(0.05); return 1 })()`);
    await tecla('KeyW');
    const camino = await js(`(()=>{ const H = ${H}, js = H.jugador.estado; let minRel = 9, t = 0, llego = false, maxLado = 0;
      const ax = ${e1.x}, az = ${e1.z}, bx = ${e2.x}, bz = ${e2.z}, L = Math.hypot(bx - ax, bz - az);
      while (t < 40) { H.jugador.actualizar(0.05); t += 0.05;
        const s = ((js.pos.x - ax) * (bx - ax) + (js.pos.z - az) * (bz - az)) / (L * L);
        const lado = Math.abs(((js.pos.x - ax) * (bz - az) - (js.pos.z - az) * (bx - ax)) / L);
        maxLado = Math.max(maxLado, lado);
        // lo que se aparta de la altura del tablero (la comba incluida) en ese punto
        if (s > 0.1 && s < 0.9) minRel = Math.min(minRel, js.pos.y - ((${e1.y}) + ((${e2.y}) - (${e1.y})) * s + 0.45 - 4 * (${puente ? puente.comba : 0}) * s * (1 - s)));
        if (Math.hypot(js.pos.x - bx, js.pos.z - bz) < 1.2) { llego = true; break; } }
      return { t: +t.toFixed(1), llego, minRel, maxLado, agua: !!H.T.agua(js.pos.x, js.pos.z), enPlataforma: !!js.enPlataforma } })()`);
    await tecla('KeyW', 'keyup');
    ok(camino.llego && camino.t < 30, `con W se cruza el puente de punta a punta (${camino.t} s)`);
    ok(camino.minRel > -0.35 && camino.maxLado < 0.7, `por las tablas, con su comba: sin caerse al arroyo (${camino.minRel.toFixed(2)} m del tablero, ${camino.maxLado.toFixed(2)} m del eje)`);

    // ---------------------------------------------------------------- guardar y recargar
    seccion('11. se guarda y vuelve');
    const antes = await js(`(()=>{ const H = ${H}; H.guardar(); const p = JSON.parse(localStorage.getItem('hojarasca-v1'));
      return { vela: p.vela, obras: p.obras.filter(o => ['varadero-velero', 'poste-tirolesa', 'estribo-puente'].includes(o.plano)).map(o => o.plano).sort(), botes: p.personal?.botes?.nombre } })()`);
    ok(antes.vela && Math.hypot(antes.vela.x - barcoQuedo.x, antes.vela.z - barcoQuedo.z) < 0.5, `progreso.vela: donde quedó el velero (${JSON.stringify(antes.vela)})`);
    ok(antes.obras.join() === 'estribo-puente,estribo-puente,poste-tirolesa,poste-tirolesa,varadero-velero', `las obras quedan guardadas (${antes.obras.join()})`);
    await abrir();
    ok(await listo(), 'recargó');
    await entrar();
    await cuadros(8);
    await js(`(()=>{ const H = ${H}; H.__vela().actualizarQuieto(1, H.__U().uTiempo.value); H.__tirolesas().actualizar(1, H.jugador); return 1 })()`);
    const despues = await js(`(()=>{ const H = ${H}, V = H.__vela(), e = V.est, TI = H.__tirolesas();
      return { hay: e.hay, visible: V.barco.visible, d: Math.hypot(e.x - (${barcoQuedo.x}), e.z - (${barcoQuedo.z})), nombre: V.personal().nombre,
        lineas: TI.lineas.map(l => l.tipo).sort(), plats: H.col.plataformas.filter(p => p.duenio && p.duenio.tendido === 'puente').length } })()`);
    ok(despues.hay && despues.visible && despues.d < 0.5, `el velero sigue donde quedó (${despues.d.toFixed(2)} m)`);
    ok(despues.nombre === 'Albatros', 'con su nombre');
    ok(despues.lineas.join() === 'puente,tirolesa' && despues.plats > 10, `la tirolesa y el puente vuelven a tenderse (${JSON.stringify(despues)})`);
    // guardar arriba del velero: se aparece en tierra, no en el agua
    const aBordo = await js(`(()=>{ const H = ${H}, V = H.__vela(); V.subir(H.jugador); H.guardar(); const p = JSON.parse(localStorage.getItem('hojarasca-v1'));
      const r = { pos: p.pos, seco: !H.T.agua(p.pos.x, p.pos.z) }; V.bajar(H.jugador); return r })()`);
    ok(aBordo.seco, `guardando arriba del velero, se aparece en tierra (${JSON.stringify(aBordo.pos)})`);
  } catch (e) {
    errores.push(`${donde}: ${e.message}`);
  } finally {
    if (copiaStorage) {
      // se devuelve lo que había y se traba la escritura: el guardado del beforeunload no lo pisa
      await js(`(()=>{ const c = JSON.parse(${JSON.stringify(copiaStorage)});
        localStorage.clear(); for (const [k, v] of Object.entries(c)) localStorage.setItem(k, v);
        Storage.prototype.setItem = () => {}; Storage.prototype.removeItem = () => {}; Storage.prototype.clear = () => {}; return 1 })()`).catch(() => {});
    }
  }
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  console.log('OK humo 2.9 · velero, tirolesa y puente colgante');
  app.exit(0);
});

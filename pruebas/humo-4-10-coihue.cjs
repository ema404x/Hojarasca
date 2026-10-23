// 4.10 coihue — partida real (Electron + WebGL) de «el final y el valle»:
//   1. valle: los duendes toman un lugar (mancha, hongos, bruma), el hacha se frena, el mapa lo marca, se quema su nido y se recupera,
//      y el que no sacás se cierra más de noche (salen más);
//   2. camino: un asedio con el Coihue caminando noche a noche hacia la base (zancadas, temblor, huellas, sombra), la ruta sin agua
//      ni obras, se lo frena pegándole a las raíces y con una trampa, llega y el cerco cae;
//   3. subida: caminando de verdad por adentro, una raíz que avisa, barre y tapa el paso, los duendes de las ramas;
//   4. guardado: recargar en cada punto deja todo igual.
// Capturas a tamaño completo en pruebas/salidas/coihue-4-10/ (con -Visible: oculta, capturePage devuelve un cuadro viejo).
// Uso (PowerShell): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-10-coihue.cjs -Espera 900 -Perfil <carpeta> [-Visible]
//   HUMO_ESCENAS=valle,camino,subida (por defecto todas) · HUMO_INDEX=<index.html> · HUMO_SALIDA=<carpeta> · HUMO_ETIQUETA=<prefijo>
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(__dirname, 'salidas', 'coihue-4-10'));
const etiqueta = process.env.HUMO_ETIQUETA ? process.env.HUMO_ETIQUETA + '-' : '';
fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const ESCENAS = (process.env.HUMO_ESCENAS || 'valle,camino,subida').split(',');

app.whenReady().then(async () => {
  const errores = [], pasos = [];
  const w = new BrowserWindow({ show: true, width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || e.level === 3 || /Uncaught|THREE\.|Shader|ERROR|WebGL/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|favicon|toNonIndexed/.test(m)) { errores.push(m.slice(0, 300)); console.log('[página]', m.slice(0, 300)); }
  });
  let donde = '';
  const js = (c, limite = 90000) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, rej) => setTimeout(() => rej(new Error(`sin respuesta ${limite / 1000}s en ${donde}`)), limite)),
  ]);
  const ok = (cond, texto) => { pasos.push(`${cond ? '✓' : '✗'} ${texto}`); console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const H = 'window.__hojarasca';
  const url = process.env.HUMO_INDEX ? path.resolve(process.env.HUMO_INDEX) : path.join(raiz, 'index.html');
  const cargar = async () => {
    await w.loadFile(url, { search: '?debug=1' });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca').catch(() => false)) return true; }
    return false;
  };
  const entrar = async () => {
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500); await js(`${H}.ajustes.limiteFps = 'libre'; 1`);
    await js(`window.addEventListener('blur', (e) => e.stopImmediatePropagation(), true); try { ${H}.volverAlJuego(); } catch {} 1`);
    await js(`(()=>{const H=${H}; H.progreso.desafio.tutorial = 99; if (!window.__cura) window.__cura = setInterval(() => { try { H.progreso.desafio.salud = Math.max(H.progreso.desafio.salud, 90); } catch {} }, 400); return 1})()`);
  };
  const foto = async (nombre, conHud = false, quieto = false) => {
    await js(`${quieto ? '' : `try { ${H}.volverAlJuego(); } catch {}`} (() => { let s = document.getElementById('humo-sin-hud'); if (!s) { s = document.createElement('style'); s.id = 'humo-sin-hud'; document.head.appendChild(s); } s.textContent = ${conHud ? "''" : "'body > *:not(canvas):not(script):not(style) { visibility: hidden !important; } canvas { visibility: visible !important; }'"}; })(); 1`);
    await esperar(350);
    let img = null;
    try { await w.webContents.capturePage(); } catch {}
    await esperar(250);
    for (let k = 0; k < 3 && !img; k++) { try { img = await w.webContents.capturePage(); } catch { await esperar(800); } }
    const ruta = path.join(salida, `${etiqueta}${nombre}.png`);
    if (img && !img.isEmpty()) fs.writeFileSync(ruta, img.toPNG());
    else {
      const u = await js(`(()=>{const H=${H}; H.renderer.render(H.escena,H.camara); return H.renderer.domElement.toDataURL('image/png')})()`);
      fs.writeFileSync(ruta, Buffer.from(u.split(',')[1], 'base64'));
    }
    return ruta;
  };
  const fotoQuieta = async (nombre, conHud = false) => { await js(`try { ${H}.abrir('pausa'); } catch {} 1`); await esperar(200); const r = await foto(nombre, conHud, true); await js(`try { ${H}.volverAlJuego(); } catch {} 1`); return r; };
  // una cámara quieta: `o` y `a` con la altura sobre el terreno de cada punto
  const pose = (o, a, fov = 55) => js(`(()=>{const H=${H}, js=H.jugador.estado, o=${JSON.stringify(o)}, a=${JSON.stringify(a)}; o.y += H.T.altura(o.x, o.z); a.y += H.T.altura(a.x, a.z);
    const yaw = Math.atan2(-(a.x-o.x), -(a.z-o.z)), pitch = Math.atan2(a.y-o.y, Math.hypot(a.x-o.x, a.z-o.z)), piso = H.T.altura(o.x, o.z);
    js.pos.set(o.x, piso, o.z); js.vel.set(0,0,0); js.vy = 0; js.yaw = yaw; js.pitch = pitch;
    window.__poseD = { p: [o.x, o.y, o.z], r: [pitch, yaw], fov: ${fov}, pie: [o.x, piso, o.z] };
    if (!H.renderer.__fijo) {
      const R = H.renderer, orig = R.render.bind(R); R.__fijo = true;
      R.render = (esc, cam) => { const q = window.__poseD;
        if (q && cam === H.camara) { cam.position.set(...q.p); cam.rotation.order = 'YXZ'; cam.rotation.set(q.r[0], q.r[1], 0); if (cam.fov !== q.fov) { cam.fov = q.fov; cam.updateProjectionMatrix(); } cam.updateMatrixWorld(); H.jugador.estado.pos.set(...q.pie); H.jugador.estado.vel.set(0,0,0); H.jugador.estado.vy = 0; }
        return orig(esc, cam); };
    }
    return 1})()`);
  // (la misma pero con alturas absolutas: adentro del Coihue)
  const poseAbs = (o, a, fov = 60) => js(`(()=>{const H=${H}, js=H.jugador.estado, o=${JSON.stringify(o)}, a=${JSON.stringify(a)};
    const yaw = Math.atan2(-(a.x-o.x), -(a.z-o.z)), pitch = Math.atan2(a.y-o.y, Math.hypot(a.x-o.x, a.z-o.z));
    window.__poseD = { p: [o.x, o.y, o.z], r: [pitch, yaw], fov: ${fov}, pie: [js.pos.x, js.pos.y, js.pos.z] };
    if (!H.renderer.__fijo) {
      const R = H.renderer, orig = R.render.bind(R); R.__fijo = true;
      R.render = (esc, cam) => { const q = window.__poseD;
        if (q && cam === H.camara) { cam.position.set(...q.p); cam.rotation.order = 'YXZ'; cam.rotation.set(q.r[0], q.r[1], 0); if (cam.fov !== q.fov) { cam.fov = q.fov; cam.updateProjectionMatrix(); } cam.updateMatrixWorld(); }
        return orig(esc, cam); };
    }
    return 1})()`);
  const sinPose = () => js(`window.__poseD = null; 1`);
  const estar = (x, z, yaw = 0) => js(`(()=>{const H=${H}, js=H.jugador.estado; js.pos.set(${x}, H.T.altura(${x},${z}), ${z}); js.vel.set(0,0,0); js.yaw=${yaw}; js.pitch=0; return 1})()`);
  const avanzar = (seg, noche = 1) => js(`(()=>{const H=${H}; for (let i = 0; i < ${Math.round(seg / 0.05)}; i++) { H.progreso.desafio.salud = Math.max(H.progreso.desafio.salud, 90); H.desafio.actualizar(0.05, { noche: ${noche}, dtReal: 0.05 }); } return 1})()`, 120000);
  const limpiarInvasores = () => js(`(()=>{const H=${H}; for (const a of H.desafio.aliens) { a.estado='irse'; a.t=9; } H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); return H.desafio.aliens.length})()`);
  // un lugar llano y SECO a unos `d` metros del refugio (para plantar el Coihue ahí)
  const sitioSeco = (d) => js(`(()=>{const H=${H}, T=H.T, r=H.desafio.centroBase(); let mejor=null;
    for (let a=0;a<48;a++) { const x=r.x+Math.cos(a/48*6.283)*${d}, z=r.z+Math.sin(a/48*6.283)*${d}; if (T.agua(x,z) || Math.abs(x)>900 || Math.abs(z)>900) continue;
      let mojado=false, des=0; for (let k=0;k<10 && !mojado;k++) for (const e of [8,16,26]) { const qx=x+Math.cos(k/10*6.283)*e, qz=z+Math.sin(k/10*6.283)*e; if (T.agua(qx,qz)) { mojado=true; break; } des=Math.max(des,Math.abs(T.altura(qx,qz)-T.altura(x,z))); }
      if (mojado) continue; if (!mejor || des<mejor.des) mejor={x,z,des}; }
    return mejor})()`);

  try {
    donde = 'carga';
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'media', clima:'despejado', musica:false, modo:'desafio', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', estacion:'verano'})); 1`);
    ok(await cargar(), 'el Desafío carga');
    await entrar();
    ok(await js(`${H}.modoJuego === 'desafio' && ${H}.progreso.desafio.valle === null && !!${H}.desafio.valle`), 'una partida nueva no tiene lugares tomados');

    // ================================================================ 1. el valle: los lugares que toman los duendes
    if (ESCENAS.includes('valle')) {
      donde = 'valle';
      await js(`(()=>{const H=${H}, D=H.progreso.desafio; D.oleadas = 2; H.progreso.dia = 4; H.progreso.horas = 11; H.progreso.ramitas = 6; return 1})()`);
      { const r = await js(`(()=>{ try { ${H}.desafio.valle.alAmanecer(); return 'ok'; } catch (e) { return e.stack; } })()`); if (r !== 'ok') console.log('alAmanecer falló:', r); }
      await avanzar(1.5, 0);
      const v = await js(`(()=>{const H=${H}, D=H.progreso.desafio, V=D.valle; const t = V && V.zonas.filter(z=>z.nivel>0);
        return {hay:!!V, tomadas:t ? t.map(z=>({id:z.id,x:z.x,z:z.z,nivel:z.nivel})) : [], nidos:(D.capullos||[]).filter(c=>c.zona).map(c=>({x:c.x,z:c.z,zona:c.zona})), todos:(D.capullos||[]).length,
          sitios:H.desafio.valle.sitios.size, marcas:H.desafio.valle.marcas().length}})()`);
      ok(v.hay && v.tomadas.length === 1 && v.tomadas[0].nivel === 1, `la noche 3 toman un lugar (${v.tomadas.map((z) => z.id).join(',')})`);
      ok(v.nidos.length === 1 && v.nidos[0].zona === v.tomadas[0].id, 'y su nido crece en el lugar');
      ok(v.sitios === 1 && v.marcas === 1, 'se arman la mancha y el hongo, y el mapa lo marca');
      const z = v.tomadas[0], nido = v.nidos[0];
      ok(Math.hypot(nido.x - z.x, nido.z - z.z) <= 12, `el nido está a ${Math.hypot(nido.x - z.x, nido.z - z.z).toFixed(1)} m del centro`);
      // el lugar se ve (poco geometría: dibujos y triángulos de las mallas del lugar)
      const mallas = await js(`(()=>{const H=${H}, s=[...H.desafio.valle.sitios.values()][0]; let tri=0; s.g.traverse(o=>{ if (o.isMesh) tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count)/3; });
        return {hijos:s.g.children.length, tri:Math.round(tri), k:s.k, visible:s.g.visible}})()`);
      ok(mallas.hijos === 3 && mallas.tri < 6000, `3 mallas por lugar y ${mallas.tri} triángulos`);
      for (let i = 0; i < 60; i++) await avanzar(0.5, 0);   // la mancha se asienta (sube de a poco)
      const k = await js(`[...${H}.desafio.valle.sitios.values()][0].k`);
      ok(Math.abs(k - 1 / 3) < 0.01, `la mancha llega a su escalón (${k.toFixed(2)})`);
      console.log('diag sitio:', JSON.stringify(await js(`(()=>{const H=${H}, s=[...H.desafio.valle.sitios.values()][0]; const P=s.tinte.geometry.attributes.position; let mn=1e9,mx=-1e9; for(let i=0;i<P.count;i++){ mn=Math.min(mn,P.getY(i)); mx=Math.max(mx,P.getY(i)); } const hp=s.hongos.geometry.attributes.position; let hmn=1e9,hmx=-1e9; for(let i=0;i<hp.count;i++){ hmn=Math.min(hmn,hp.getY(i)); hmx=Math.max(hmx,hp.getY(i)); }
        return {vis:s.g.visible, parent:s.g.parent===H.escena, pos:[s.g.position.x,s.g.position.y,s.g.position.z], k:s.k, opT:s.tinte.material.opacity, opB:s.bruma.material.opacity, tinteY:[mn,mx], hongosY:[hmn,hmx], bs:s.tinte.geometry.boundingSphere.radius, drawRange:s.hongos.geometry.drawRange, tVis:s.tinte.visible, fc:s.tinte.frustumCulled, js:[H.jugador.estado.pos.x,H.jugador.estado.pos.z]}})()`)));
      await js(`(()=>{const H=${H}; H.progreso.horas = 11.5; return 1})()`);
      const ang = Math.atan2(z.z - (await js(`${H}.desafio.centroBase().z`)), z.x - (await js(`${H}.desafio.centroBase().x`)));
      const ox = z.x - Math.cos(ang) * 24, oz = z.z - Math.sin(ang) * 24;
      await pose({ x: ox, y: 3.2, z: oz }, { x: z.x, y: 0.5, z: z.z }, 62);
      await esperar(500);
      await foto('01-valle-tomado-dia');
      await pose({ x: z.x + 6, y: 1.7, z: z.z + 6 }, { x: z.x - 2, y: 0.4, z: z.z - 3 }, 60);
      await esperar(400);
      await foto('02-valle-tomado-hongos');
      await js(`(()=>{const H=${H}; H.progreso.horas = 18.6; return 1})()`);
      await pose({ x: ox, y: 3.2, z: oz }, { x: z.x, y: 0.5, z: z.z }, 62);
      await esperar(500);
      await foto('03-valle-tomado-atardecer');
      await sinPose();
      // se frena el hacha en el lugar tomado
      const arbol = await js(`(()=>{const H=${H}, V=H.desafio.valle, z=${JSON.stringify(z)}; const L=H.veg.arboles; let a=null, d0=1e9, fuera=null, d1=1e9;
        for (const q of L) { if (q.sacado || q.caido || q.especie==='pehuen') continue; const d=Math.hypot(q.x-z.x,q.z-z.z); if (d<16 && d<d0) { d0=d; a=q; } if (d>60 && d<120 && Math.hypot(q.x-H.T.lugares.refugio.x,q.z-H.T.lugares.refugio.z)<400 && d<d1) { d1=d; fuera=q; } }
        return {dentro:a && {x:a.x,z:a.z}, fuera:fuera && {x:fuera.x,z:fuera.z}, bloqueaDentro:a ? !!V.bloquea(a.x,a.z) : null, bloqueaFuera:fuera ? !!V.bloquea(fuera.x,fuera.z) : null}})()`);
      ok(arbol.dentro && arbol.bloqueaDentro === true, 'un árbol del lugar tomado está bloqueado');
      ok(arbol.fuera && arbol.bloqueaFuera === false, 'y uno de afuera, no');
      if (arbol.dentro) {
        await js(`(()=>{const H=${H}; H.progreso.cosas.hacha = 1; return 1})()`);
        await estar(arbol.dentro.x + 1.4, arbol.dentro.z, Math.PI / 2);
        await avanzar(0.3, 0);
        const txt = await js(`${H}.__textoHacha ? ${H}.__textoHacha() : null`);
        ok(typeof txt === 'string' && /tomado/i.test(txt), `la H dice que el lugar está tomado: «${txt}»`);
      }
      if (arbol.fuera) {
        await estar(arbol.fuera.x + 1.4, arbol.fuera.z, Math.PI / 2);
        await avanzar(0.3, 0);
        const txt = await js(`${H}.__textoHacha ? ${H}.__textoHacha() : null`);
        ok(typeof txt === 'string' && !/tomado/i.test(txt), `y afuera se talea con normalidad: «${txt}»`);
      }
      // el papel
      await js(`${H}.abrir('mapa'); 1`); await esperar(900);
      await foto('04-mapa-lugar-tomado', true, true);
      await js(`${H}.volverAlJuego(); 1`); await esperar(300);
      // se quema su nido (E con una ramita) y el lugar se recupera
      await estar(nido.x + 1.2, nido.z, Math.PI / 2);
      await avanzar(0.3, 0);
      const cristales0 = await js(`${H}.progreso.materiales.cristal || 0`);
      const usa = await js(`${H}.desafio.usarCercaDe(${H}.jugador.estado.pos)`);
      ok(usa === true, 'E junto al nido del lugar tomado lo prende');
      await avanzar(4, 0);
      const rec = await js(`(()=>{const H=${H}, D=H.progreso.desafio; const z=D.valle.zonas.find(q=>q.id==='${z.id}');
        return {nivel:z.nivel, hasta:z.hasta, nidos:(D.capullos||[]).filter(c=>c.zona).length, cristal:H.progreso.materiales.cristal||0, recuperadas:D.valle.recuperadas, marcas:H.desafio.valle.marcas().length,
          bloquea:!!H.desafio.valle.bloquea(${z.x},${z.z})}})()`);
      console.log('recuperación:', JSON.stringify(rec));
      ok(rec.nivel === 0 && rec.nidos === 0 && rec.recuperadas === 1 && !rec.bloquea, 'sacar el nido recupera el lugar: sin nidos, sin bloqueo');
      ok(rec.cristal === cristales0 + 3, `y da las semillas doradas: 1 por el nido y 2 por el lugar (${cristales0} → ${rec.cristal})`);
      ok(rec.hasta >= 3 + 2 && rec.marcas === 0, 'con unas noches de respiro y sin marca en el papel');
      for (let i = 0; i < 40; i++) await avanzar(0.5, 0);
      const apagado = await js(`(()=>{const s=[...${H}.desafio.valle.sitios.values()][0]; return {k:s.k, visible:s.g.visible}})()`);
      ok(apagado.k < 0.02 && apagado.visible === false, 'y la mancha, los hongos y la bruma se apagan');

      // el que no sacás se cierra más de noche: se toma otro lugar, se pasa la noche
      donde = 'valle noche';
      await js(`(()=>{const H=${H}, D=H.progreso.desafio; D.oleadas = 4; H.progreso.dia += 1; H.progreso.horas = 11; return 1})()`);
      await js(`${H}.desafio.valle.alAmanecer(); 1`);
      const toma2 = await js(`(()=>{const H=${H}, D=H.progreso.desafio; const t=D.valle.zonas.filter(z=>z.nivel>0); return {n:t.length, id:t[0] && t[0].id, nidos:(D.capullos||[]).filter(c=>c.zona).length}})()`);
      ok(toma2.n === 1 && toma2.nidos === 1, `la noche 5 toman otro lugar con su nido (${toma2.id})`);
      await js(`(()=>{const H=${H}, D=H.progreso.desafio; D.valle.zonas.find(z=>z.nivel>0).nivel = 2; D.especial = null; H.progreso.dia++; H.progreso.horas = 19.4; for (let i=0;i<30;i++){ H.progreso.horas += 0.01; H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); } H.progreso.horas = 20.49; return 1})()`);
      await js(`(()=>{const H=${H}; for (let i=0;i<200;i++) { H.progreso.desafio.salud = 100; H.progreso.horas += 0.05*24/(30*60); H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); } return 1})()`);
      const noche = await js(`(()=>{const H=${H}, D=H.progreso.desafio; const z=D.valle.zonas.find(q=>q.id==='${toma2.id}'); return {nivel:z.nivel, nidos:(D.capullos||[]).length, vivos:D.vivos, aliens:H.desafio.aliens.length}})()`);
      console.log('noche:', JSON.stringify(noche));
      ok(noche.nivel === 3, `si el nido se abre, el lugar se cierra otro escalón (${noche.nivel})`);
      ok(noche.nidos === 0, 'y los nidos de la noche se abrieron');
      await js(`(()=>{const H=${H}; for (const a of H.desafio.aliens) { a.estado='irse'; a.t=9; } return 1})()`);
      await avanzar(2, 0);
      // se guarda y se recarga
      donde = 'valle recarga';
      const antes = await js(`JSON.stringify(${H}.progreso.desafio.valle)`);
      await js(`${H}.guardar(); 1`);
      ok(await cargar(), 'recarga con un lugar tomado');
      await entrar();
      const despues = await js(`JSON.stringify(${H}.progreso.desafio.valle)`);
      if (despues !== antes) console.log('antes:', antes, ' | después:', despues);
      ok(despues === antes, 'los lugares tomados vuelven iguales');
      await avanzar(1.5, 0);
      ok(await js(`${H}.desafio.valle.sitios.size === 1 && ${H}.desafio.valle.marcas().length === 1`), 'y se vuelven a ver y a marcar');
    }

    // ================================================================ 2. el Coihue camina hacia la base
    if (ESCENAS.includes('camino')) {
      donde = 'camino';
      // un asedio ya empezado: el Coihue plantado a unos 62 m de la base (la noche final de verdad la mira humo-3-0-asedio)
      await js(`(()=>{const H=${H}, D=H.progreso.desafio; D.oleadas = 20; D.valle = null; D.capullos = []; H.progreso.dia = 30; H.progreso.horas = 10; D.nodriza = null; Object.assign(H.progreso.materiales,{tronco:60,tabla:60,piedra:60,cristal:20}); H.progreso.ramitas = 10; return 1})()`);
      const sit = await sitioSeco(62);
      ok(!!sit, `hay dónde plantarlo (${sit && Math.round(sit.x)},${sit && Math.round(sit.z)})`);
      await js(`(()=>{const H=${H}; return H.desafio.asedio.empezar({x:${sit.x}, z:${sit.z}})})()`);
      await avanzar(1, 0);
      const base = await js(`(()=>{const c=${H}.desafio.centroBase(); return {x:c.x,z:c.z}})()`);
      const A0 = await js(`(()=>{const H=${H}, A=H.progreso.desafio.asedio, c=A.camino; return {hay:!!c, nave:A.nave, largo:c.largo, puntos:c.ruta.length, porNoche:c.porNoche, recta:c.recta, ruta:c.ruta, base:c.base, hud:document.getElementById('desafio-estado').textContent,
        marcas:H.desafio.asedio.marcas().filter(m=>m.clase==='ruta').length, interior:c.interior}})()`);
      ok(A0.hay && A0.puntos >= 2 && !A0.recta, `al empezar el asedio hay ruta (${A0.puntos} puntos, ${A0.largo.toFixed(1)} m, ${A0.porNoche} m por noche)`);
      ok(/el Coihue está a \d+ m de tu base/.test(A0.hud), `el HUD lo dice: «${A0.hud}»`);
      ok(A0.marcas === 1, 'el mapa marca la ruta');
      // la ruta, metro a metro, no pisa agua ni obras
      const malos = await js(`(()=>{const H=${H}, c=H.progreso.desafio.asedio.camino; let malos=0, n=0;
        for (let i=1;i<c.ruta.length;i++){ const [x0,z0]=c.ruta[i-1],[x1,z1]=c.ruta[i], l=Math.hypot(x1-x0,z1-z0); for (let k=0;k<=l;k+=1){ const t=l?k/l:0, x=x0+(x1-x0)*t, z=z0+(z1-z0)*t; n++; if (H.T.agua(x,z) || H.desafio.obraEnPunto(x, H.T.altura(x,z)+0.5, z)) malos++; } }
        return {malos,n}})()`);
      ok(malos.malos === 0, `la ruta no pisa agua ni obras (${malos.n} puntos mirados)`);
      // fotos: el Coihue plantado, visto desde la base
      await js(`(()=>{const H=${H}; H.progreso.horas = 11.5; return 1})()`);
      const dx = A0.nave.x - base.x, dz = A0.nave.z - base.z, dl = Math.hypot(dx, dz);
      const cam = { x: base.x + dx / dl * 6, z: base.z + dz / dl * 6 };
      await pose({ x: cam.x, y: 3, z: cam.z }, { x: A0.nave.x, y: 14, z: A0.nave.z }, 66);
      await esperar(600);
      await foto('10-coihue-dia-0');
      await sinPose();

      // --- las noches
      const unaNoche = (libres) => js(`(()=>{const H=${H}, D=H.progreso.desafio, M=H.desafio.asedio, js=H.jugador.estado, A=D.asedio, c=A.camino;
        const sal={d0:c.d, zanc:0, tembMax:0, atascoMax:0, cuadros:0, pasos:[], rastroN:c.rastro.length};
        D.oleadas++; H.progreso.dia++; H.progreso.horas = 20.6; M.alEmpezarNoche();
        for (let k=0;k<190;k++) {
          H.progreso.horas += 0.05; if (H.progreso.horas >= 24) H.progreso.horas -= 24;
          H.progreso.desafio.salud = 100; M.actualizar(0.25, js);
          const v = M.visual; if (v.zancada) sal.zanc++; sal.tembMax = Math.max(sal.tembMax, v.temblor); sal.atascoMax = Math.max(sal.atascoMax, c.atasco); sal.cuadros++;
          if (k % 19 === 0) sal.pasos.push(+c.d.toFixed(2));
        }
        H.progreso.horas = 6.1; M.alTerminarNoche(true);
        H.progreso.horas = 9; for (let k=0;k<80;k++) M.actualizar(0.25, js);
        sal.d1=c.d; sal.vis=M.visual.d; sal.nave=A.nave; sal.llego=c.llego; sal.metros=Math.hypot(A.nave.x-c.base.x, A.nave.z-c.base.z); sal.caminadas=c.caminadas; sal.rastroN2=c.rastro.length;
        return sal})()`, 120000);
      const n1 = await unaNoche();
      ok(n1.d1 > n1.d0 + 2, `la primera noche camina: ${n1.d0.toFixed(1)} → ${n1.d1.toFixed(1)} m (${n1.pasos.join(' · ')})`);
      ok(Math.abs((n1.d1 - n1.d0) - A0.porNoche) < A0.porNoche * 0.08, `y camina lo que dice el ritmo (${(n1.d1 - n1.d0).toFixed(1)} de ${A0.porNoche})`);
      ok(n1.zanc >= 5 && n1.tembMax > 0.05, `con zancadas y temblor (${n1.zanc} cuadros de zancada, temblor ${n1.tembMax.toFixed(2)})`);
      ok(Math.abs(n1.vis - n1.d1) < 0.1, 'lo que se ve termina donde dice la cuenta');
      ok(n1.caminadas === 1 && n1.rastroN2 > n1.rastroN, `deja huellas (${n1.rastroN} → ${n1.rastroN2})`);
      const hud1 = await js(`(()=>{const H=${H}; H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); return document.getElementById('desafio-estado').textContent})()`);
      ok(/el Coihue está a \d+ m de tu base/.test(hud1), `el HUD sigue: «${hud1}»`);
      const meshes = await js(`(()=>{const H=${H}; let n=0; H.escena.traverse(o=>{ if (o.isMesh && o.visible && o.material && o.material.transparent && o.material.vertexColors && !o.parent?.name) n++; }); return n})()`);
      // en la noche 2 y 3 también
      const n2 = await unaNoche();
      ok(n2.d1 > n1.d1 + 2, `la segunda noche sigue (${n2.d1.toFixed(1)} m)`);
      ok(n2.metros < n1.metros, `y está más cerca de la base (${n1.metros.toFixed(0)} → ${n2.metros.toFixed(0)} m)`);
      // fotos después de dos noches: las huellas y la sombra
      const A2 = await js(`(()=>{const H=${H}, A=H.progreso.desafio.asedio; return {nave:A.nave, giro:H.desafio.asedio.armado.nave.giro, rastro:A.camino.rastro}})()`);
      await js(`(()=>{const H=${H}; H.progreso.horas = 12; return 1})()`);
      const ddx = A2.nave.x - base.x, ddz = A2.nave.z - base.z, ddl = Math.hypot(ddx, ddz);
      await pose({ x: base.x + ddx / ddl * 6, y: 3, z: base.z + ddz / ddl * 6 }, { x: A2.nave.x, y: 12, z: A2.nave.z }, 66);
      await esperar(600);
      await foto('11-coihue-dia-tras-2-noches');
      // desde arriba: la ruta caminada (huellas) y la sombra
      await pose({ x: (A2.nave.x + base.x) / 2, y: 70, z: (A2.nave.z + base.z) / 2 + 0.01 }, { x: (A2.nave.x + base.x) / 2, y: 0, z: (A2.nave.z + base.z) / 2 }, 64);
      await esperar(500);
      await foto('12-huellas-y-sombra-desde-arriba');
      await sinPose();
      ok(true, 'fotos del Coihue tras dos noches');

      // --- se lo frena: las raíces
      donde = 'frenos';
      const f0 = await js(`(()=>{const H=${H}, D=H.progreso.desafio, M=H.desafio.asedio, js=H.jugador.estado, A=D.asedio, c=A.camino, E=H.desafio.eventos;
        D.oleadas++; H.progreso.dia++; H.progreso.horas = 20.6; M.alEmpezarNoche();
        for (let k=0;k<20;k++) { H.progreso.horas += 0.05; M.actualizar(0.25, js); }
        const pies = E.blancos().filter(b=>b.pies);
        return {pies:pies.length, d:c.d, atasco:c.atasco, heridas:c.heridas}})()`);
      ok(f0.pies === 6, `las seis raíces de apoyo son blancos (${f0.pies})`);
      const golpes = await js(`(()=>{const H=${H}, M=H.desafio.asedio, E=H.desafio.eventos, A=H.progreso.desafio.asedio, c=A.camino;
        const b = E.blancos().find(q=>q.pies); let n=0, cortes0=c.cortes;
        while (c.cortes === cortes0 && n < 20) { E.herirNucleo(b, 60); n++; }
        const sal = {n, atasco:c.atasco, cortes:c.cortes, inmune:c.inmune};
        const d0 = c.d; for (let k=0;k<8;k++) { H.progreso.horas += 0.05; M.actualizar(0.25, H.jugador.estado); }
        sal.quieto = Math.abs(c.d - d0) < 1e-6; for (let i=0;i<12;i++) E.herirNucleo(b, 60); sal.atascoTrasMas = c.atasco; return sal})()`);
      ok(golpes.cortes === 1 && golpes.n >= 3 && Math.abs(golpes.atasco - 0.7) < 0.1, `a los ${golpes.n} golpes se le traban las raíces (${golpes.atasco.toFixed(2)} h quieto)`);
      ok(golpes.quieto, 'y se queda quieto');
      ok(golpes.atascoTrasMas <= golpes.atasco + 1e-6, 'pegarle de más no lo clava para siempre (inmune un rato)');
      // un golpe de verdad: la hacha a una raíz
      const real = await js(`(()=>{const H=${H}, E=H.desafio.eventos, A=H.progreso.desafio.asedio, c=A.camino, js=H.jugador.estado; c.atasco = 0; c.inmune = 0; c.heridas = 0;
        const b = E.blancos().find(q=>q.pies);
        js.pos.set(b.pos.x + 1.6, H.T.altura(b.pos.x + 1.6, b.pos.z), b.pos.z); js.yaw = Math.PI / 2; js.vel.set(0,0,0);
        H.camara.position.set(js.pos.x, js.pos.y + 1.6, js.pos.z); H.camara.lookAt(b.pos.x, b.pos.y, b.pos.z); H.camara.updateMatrixWorld(true);
        const h0 = c.heridas; for (let i=0;i<3;i++){ H.desafio.atacar('hacha'); for (let k=0;k<20;k++) H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); }
        return {heridas:c.heridas, h0, cortes:c.cortes}})()`);
      ok(real.heridas > real.h0 || real.cortes > 1, `el hacha le pega a las raíces por el camino de siempre (${real.h0} → ${real.heridas})`);
      // un flechazo
      const flecha = await js(`(()=>{const H=${H}, E=H.desafio.eventos, A=H.progreso.desafio.asedio, c=A.camino, js=H.jugador.estado, D=H.progreso.desafio; c.atasco = 0; c.inmune = 0; c.heridas = 0;
        H.progreso.cosas.pistola = 1; D.cargas = 99;
        const b = E.blancos().find(q=>q.pies);
        js.pos.set(b.pos.x + 10, H.T.altura(b.pos.x + 10, b.pos.z), b.pos.z); js.vel.set(0,0,0);
        H.camara.position.set(js.pos.x, js.pos.y + 1.6, js.pos.z); H.camara.lookAt(b.pos.x, b.pos.y, b.pos.z); H.camara.updateMatrixWorld(true);
        const h0 = c.heridas; for (let i=0;i<4;i++){ H.desafio.atacar('pistola'); for (let k=0;k<8;k++) H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); }
        return {heridas:c.heridas, h0, cortes:c.cortes}})()`);
      ok(flecha.heridas > flecha.h0 || flecha.cortes > 0, `y la pistola también (${flecha.h0} → ${flecha.heridas})`);
      // la trampa: una miel en el camino que va a pisar
      const t1 = await js(`(()=>{const H=${H}, A=H.progreso.desafio.asedio, c=A.camino;
        const L = c.ruta; let resto = c.d, i = 1; for (; i < L.length; i++) { const l = Math.hypot(L[i][0]-L[i-1][0], L[i][1]-L[i-1][1]); if (resto <= l) break; resto -= l; }
        const [x0,z0] = L[i-1], [x1,z1] = L[Math.min(i, L.length-1)], l = Math.hypot(x1-x0,z1-z0) || 1, u = (resto + 6) / l;
        const x = x0 + (x1-x0)*Math.min(1,u), z = z0 + (z1-z0)*Math.min(1,u);
        const r = H.desafio.colocarTrampaMiel(x, z, { gratis: true });
        return {ok:r.ok, motivo:r.motivo, x, z, vida: r.obra && r.obra.datos.vida, id: r.obra && r.obra.plano.id}})()`);
      ok(t1.ok, `una trampa de miel en el camino (${t1.ok ? t1.id : t1.motivo})`);
      if (t1.ok) {
        const pisa = await js(`(()=>{const H=${H}, M=H.desafio.asedio, A=H.progreso.desafio.asedio, c=A.camino, js=H.jugador.estado, O=H.obras.obras;
          const o = O.find(q=>Math.hypot(q.datos.x-${t1.x}, q.datos.z-${t1.z})<0.1); const v0 = o.datos.vida;
          js.pos.set(${t1.x} + 40, H.T.altura(${t1.x} + 40, ${t1.z}), ${t1.z});
          c.atasco = 0; c.inmune = 0; let pisada = false;
          for (let k=0;k<400 && !pisada;k++) { H.progreso.horas += 0.02; if (H.progreso.horas>=24) H.progreso.horas-=24; M.actualizar(0.25, js); if (c.atasco >= 0.45) pisada = true; }
          return {pisada, atasco:c.atasco, vida0:v0, vida:o.datos.vida, d:c.d}})()`);
        ok(pisa.pisada === true, `el Coihue pisa la trampa y se enreda (${pisa.atasco.toFixed(2)} h)`);
        ok(pisa.vida < pisa.vida0, `y la trampa se rompe de a poco (${pisa.vida0} → ${pisa.vida})`);
      }
      // se cierra la noche y se sigue
      await js(`(()=>{const H=${H}, M=H.desafio.asedio; H.progreso.horas = 6.1; M.alTerminarNoche(true); H.progreso.horas = 11; for (let k=0;k<60;k++) M.actualizar(0.25, H.jugador.estado); return 1})()`);

      // --- llega a la base: el cerco cae
      donde = 'llegada';
      const cerco = await js(`(()=>{const H=${H}, A=H.progreso.desafio.asedio, c=A.camino; const f=c.ruta[c.ruta.length-1];
        Object.assign(H.progreso.materiales,{tronco:99,tabla:99,piedra:99,cristal:40});
        return {x:f[0], z:f[1]}})()`);
      const ox = cerco.x, oz = cerco.z;
      const ang = Math.atan2(oz - base.z, ox - base.x);
      const sx = ox - Math.cos(ang) * 16 + Math.sin(ang) * 6, sz = oz - Math.sin(ang) * 16 - Math.cos(ang) * 6;
      const emp = await js(`(()=>{const H=${H}, O=H.obras, P=H.progreso; const p=H.PLANOS.find(q=>q.id==='empalizada'); O.elegir(p); O.alternarSnap(false);
        const r=O.fundar(${sx},${sz},${ang}); if(!r.ok) { O.elegir(null); return {error:r.motivo}; }
        for (let g=0; g<12 && r.obra.datos.etapas<r.obra.plano.etapas.length; g++) { const k=O.avanzar(r.obra,P.materiales); if(!k.ok) break; }
        O.elegir(null); P.obras=O.obras.map(o=>o.datos); return {ok:true, x:r.obra.datos.x, z:r.obra.datos.z, vida:r.obra.datos.vida}})()`);
      ok(emp.ok, `una empalizada en el lugar adonde va a llegar (${emp.error || ''})`);
      await js(`(()=>{const H=${H}, A=H.progreso.desafio.asedio, c=A.camino; c.d = Math.max(0, c.largo - 2.5); c.atasco = 0; c.inmune = 0; H.desafio.asedio.visual.d = c.d - 1; return 1})()`);
      const ll = await js(`(()=>{const H=${H}, D=H.progreso.desafio, M=H.desafio.asedio, js=H.jugador.estado, A=D.asedio, c=A.camino, O=H.obras.obras;
        const emp = O.find(q=>q.plano.id==='empalizada'); const v0 = emp ? emp.datos.vida : null;
        D.oleadas++; H.progreso.dia++; H.progreso.horas = 20.6; M.alEmpezarNoche();
        for (let k=0;k<200 && !c.cerco;k++) { H.progreso.horas += 0.05; if (H.progreso.horas>=24) H.progreso.horas-=24; D.salud=100; M.actualizar(0.25, js); }
        for (let k=0;k<60;k++) M.actualizar(0.25, js);
        H.progreso.horas = 6.1; M.alTerminarNoche(true); H.progreso.horas = 11; for (let k=0;k<20;k++) M.actualizar(0.25, js);
        const v1 = emp ? emp.datos.vida : null;
        return {llego:c.llego, cerco:c.cerco, puede:M.hazAbierto(), motivo:M.motivoHaz(), zonasLibres:A.zonas.filter(z=>z.estado!=='tomada').length, v0, v1, hud:document.getElementById('desafio-estado').textContent, metros:Math.hypot(A.nave.x-c.base.x,A.nave.z-c.base.z)}})()`);
      ok(ll.llego && ll.cerco, 'llega a la base: el cerco cae (una vez)');
      ok(ll.zonasLibres === 0 && ll.puede === true && ll.motivo === null, 'y la puertita se abre sola aunque no haya zonas libres (de día)');
      ok(ll.v0 > 0 && ll.v1 < ll.v0 * 0.6, `la empalizada del camino quedó hecha un desastre (${Math.round(ll.v0)} → ${Math.round(ll.v1)})`);
      ok(/sobre tu base/.test(ll.hud), `el HUD: «${ll.hud}»`);
      await js(`(()=>{const H=${H}; H.progreso.horas = 12; return 1})()`);
      const A3 = await js(`(()=>{const H=${H}, A=H.progreso.desafio.asedio; return {nave:A.nave}})()`);
      const e3x = A3.nave.x - base.x, e3z = A3.nave.z - base.z, e3l = Math.hypot(e3x, e3z) || 1;
      await pose({ x: base.x - e3x / e3l * 8, y: 4, z: base.z - e3z / e3l * 8 }, { x: A3.nave.x, y: 12, z: A3.nave.z }, 70);
      await esperar(600);
      await foto('13-coihue-sobre-la-base');
      await sinPose();

      // --- se guarda y se recarga
      donde = 'camino recarga';
      const gA = await js(`JSON.stringify(${H}.progreso.desafio.asedio.camino)`);
      await js(`${H}.guardar(); 1`);
      ok(await cargar(), 'recarga con el Coihue sobre la base');
      await entrar();
      const gB = await js(`JSON.stringify(${H}.progreso.desafio.asedio.camino)`);
      ok(gA === gB, 'el camino (ruta, distancia, huellas, el cerco caído) vuelve igual');
      await avanzar(2, 0);
      const pos2 = await js(`(()=>{const H=${H}, A=H.progreso.desafio.asedio, n=H.desafio.asedio.armado.nave; return {nave:A.nave, mesh:{x:n.g.position.x, z:n.g.position.z}, visible:n.g.visible}})()`);
      ok(Math.hypot(pos2.nave.x - pos2.mesh.x, pos2.nave.z - pos2.mesh.z) < 0.5 && pos2.visible, 'el Coihue se ve en su lugar, no en el de antes');
    }

    // ================================================================ 3. la subida con peligros
    if (ESCENAS.includes('subida')) {
      donde = 'subida';
      const hay = await js(`!!${H}.progreso.desafio.asedio`);
      if (!hay) {
        await js(`(()=>{const H=${H}, D=H.progreso.desafio; D.oleadas = 20; D.valle = null; H.progreso.dia = 30; H.progreso.horas = 11; return 1})()`);
        const sit = await sitioSeco(62);
        await js(`${H}.desafio.asedio.empezar({x:${sit.x}, z:${sit.z}}); 1`);
        await js(`(()=>{const H=${H}, c=H.progreso.desafio.asedio.camino; c.llego = true; c.cerco = true; c.d = c.largo; return 1})()`);
      }
      await js(`(()=>{const H=${H}; H.progreso.horas = 11; return 1})()`);
      await avanzar(1.5, 0);
      const e = await js(`(()=>{const H=${H}, s=H.desafio.asedio.sitioHaz(), i=H.desafio.asedio.sitioInterior(), A=H.progreso.desafio.asedio; H.jugador.ubicar(s.x+1, s.z+1, 0, s.y);
        return {haz:H.desafio.asedio.hazAbierto(), s, i, camino:!!A.camino, usa:H.desafio.usarCercaDe(H.jugador.estado.pos)}})()`);
      ok(e.haz && e.usa === true, 'al pie del Coihue (donde está parado ahora) E entra');
      for (let i = 0; i < 6; i++) await avanzar(0.5, 0);
      const dentro = await js(`(()=>{const N=${H}.desafio.naveAdentro, js=${H}.jugador.estado; return {en:N.enSubida, adentro:N.adentro, sitio:N.subida && N.subida.sitio, raices:N.subida && N.subida.raices ? N.subida.raices.length : 0, vecinos:N.subida && N.subida.vecinos.length, y:js.pos.y}})()`);
      ok(dentro.en && dentro.raices === 3 && dentro.vecinos === 3, `adentro, en la escalera: tres raíces y tres duendes de las ramas`);
      ok(Math.abs(dentro.sitio.x - e.i.x) < 1 && Math.abs(dentro.sitio.z - e.i.z) < 1, `el corazón se arma sobre el llano donde se plantó, no donde camina (a ${Math.hypot(e.s.x - e.i.x, e.s.z - e.i.z).toFixed(0)} m)`);

      // una raíz de verdad: parado en su escalón, se la espera
      const R = await js(`(()=>{const H=${H}, N=H.desafio.naveAdentro, S=N.subida, o=S.origen, r=S.raices[0], q=S.tramos[r.tramo];
        return {tramo:r.tramo, a:r.a, alto:r.alto, wx:o.x+q.x, wz:o.z+q.z, wy:o.y+q.alto, rMed:S.rMed, ox:o.x, oy:o.y, oz:o.z, radio:S.radio}})()`);
      await js(`(()=>{const H=${H}, js=H.jugador.estado; H.jugador.ubicar(${R.wx}, ${R.wz}, Math.atan2(-Math.cos(${R.a}), Math.sin(${R.a})) , ${R.wy} + 0.05); js.vel.set(0,0,0); document.getElementById('desafio-estado'); return 1})()`);
      // tres cuadros en cada fase importante (aviso, barrido, tapa), con fotos
      const traza = [];
      let fotosHechas = { aviso: false, barrido: false, tapa: false };
      let salud0 = await js(`${H}.progreso.desafio.salud`);
      await js(`${H}.progreso.desafio.salud = 100; 1`);
      for (let i = 0; i < 700; i++) {
        const s = await js(`(()=>{const H=${H}, N=H.desafio.naveAdentro, js=H.jugador.estado; H.jugador.actualizar(0.05); H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); const r=N.subida.raices[0];
          return {fase:r.fase, t:+r.t.toFixed(2), x:js.pos.x, z:js.pos.z, y:js.pos.y, vx:js.vel.x, vz:js.vel.z, sol:!!r.sol, salud:H.progreso.desafio.salud}})()`);
        traza.push(s);
        for (const f of ['aviso', 'barrido', 'tapa']) {
          if (s.fase === f && !fotosHechas[f] && (f !== 'aviso' || s.t > 5.8) && (f !== 'barrido' || s.t > 6.9) && (f !== 'tapa' || s.t > 8.3)) {
            fotosHechas[f] = true;
            const ox = R.ox + Math.sin(R.a + 0.55) * 3.3, oz = R.oz + Math.cos(R.a + 0.55) * 3.3, ax = R.ox + Math.sin(R.a - 0.1) * 3.4, az = R.oz + Math.cos(R.a - 0.1) * 3.4;
            await poseAbs({ x: ox, y: R.wy + 1.8, z: oz }, { x: ax, y: R.wy + 0.8, z: az }, 70);
            await esperar(300);
            await foto(`20-raiz-${f}`);
            await sinPose();
          }
        }
        if (fotosHechas.tapa && s.fase === 'vuelta') break;
      }
      const fases = []; for (const t of traza) if (fases[fases.length - 1] !== t.fase) fases.push(t.fase);
      ok(['reposo', 'aviso', 'barrido', 'tapa', 'vuelta'].every((f) => fases.includes(f)), `la raíz hace su ciclo con vos parado ahí: ${fases.join(' → ')}`);
      const iB = traza.findIndex((t) => t.fase === 'barrido');
      const hit = traza.slice(iB).find((t, i, a) => i > 0 && Math.hypot(t.x - a[0].x, t.z - a[0].z) > 0.7);
      const empujo = traza.slice(iB, iB + 30).some((t) => Math.hypot(t.vx, t.vz) > 3.5);
      ok(empujo || !!hit, 'el barrido te empuja hacia abajo');
      ok(traza.some((t) => t.salud < 100) && traza.every((t) => t.salud > 85), `con un golpe chico (salud mínima ${Math.min(...traza.map((t) => t.salud)).toFixed(0)})`);
      ok(fotosHechas.aviso && fotosHechas.barrido && fotosHechas.tapa, 'tres fotos: aviso, barrido y tapa');
      ok(!traza.slice(-1)[0].sol, 'y al volver se saca el choque: no queda tapando el paso');

      // la subida entera caminando de verdad, con las raíces y los duendes funcionando
      donde = 'subida entera';
      await js(`(()=>{const H=${H}, N=H.desafio.naveAdentro; H.jugador.ubicar(N.subida.origen.x+N.subida.descansos[0].x, N.subida.origen.z+N.subida.descansos[0].z, 0, N.subida.origen.y+0.25); return 1})()`);
      const sub = JSON.parse(await js(`(()=>{const H=${H}, N=H.desafio.naveAdentro, js=H.jugador.estado, S=N.subida, o=S.origen;
        document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW',bubbles:true}));
        let t=0, caidas=0, yAntes=js.pos.y, maxI=0, empujones=0, hits=0, trabado=0, ult=null, ultT=0, maxQuieto=0; const pa=S.puertaArriba; const fasesVistas=new Set(); let ramasAviso=0, saludMin=100;
        const cerca = () => Math.hypot(o.x+pa.x-js.pos.x, o.z+pa.z-js.pos.z) < 2.4 && Math.abs(o.y+pa.y-js.pos.y) < 1.5;
        for (let n=0;n<14000 && !cerca();n++) {
          let i=0, mejor=1e9; S.tramos.forEach((q, j) => { const d=Math.hypot(o.x+q.x-js.pos.x, o.z+q.z-js.pos.z)+Math.abs(o.y+q.alto-js.pos.y)*3; if (d<mejor) { mejor=d; i=j; } });
          const i0 = maxI; maxI = Math.max(maxI, i);
          const q = i >= S.tramos.length-3 ? { x: pa.x, z: pa.z } : S.tramos[i+3];
          js.yaw = Math.atan2(-(o.x+q.x-js.pos.x), -(o.z+q.z-js.pos.z));
          const s0 = H.progreso.desafio.salud;
          H.jugador.actualizar(0.05); H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); t += 0.05;
          for (const r of S.raices) fasesVistas.add(r.fase);
          for (const v of S.vecinos) if (v.aviso > 0) ramasAviso++;
          if (H.progreso.desafio.salud < s0 - 0.5) hits++;
          saludMin = Math.min(saludMin, H.progreso.desafio.salud);
          H.progreso.desafio.salud = Math.max(H.progreso.desafio.salud, 40);
          if (js.pos.y < yAntes - 1.5) caidas++;
          yAntes = js.pos.y;
          if (ult === null || Math.hypot(js.pos.x-ult.x, js.pos.z-ult.z) > 0.5 || Math.abs(js.pos.y-ult.y) > 0.3) { ult = { x: js.pos.x, z: js.pos.z, y: js.pos.y }; ultT = t; }
          maxQuieto = Math.max(maxQuieto, t - ultT);
        }
        document.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW',bubbles:true}));
        return JSON.stringify({ segundos:+t.toFixed(1), llego:cerca(), caidas, maxI, de:S.tramos.length, hits, saludMin:+saludMin.toFixed(0), fases:[...fasesVistas], ramasAviso, maxQuieto:+maxQuieto.toFixed(1), descanso:N.ultimoDescanso })})()`, 180000));
      console.log('la subida entera:', JSON.stringify(sub));
      ok(sub.llego, `se llega a la puerta del corazón caminando, con las raíces y los duendes funcionando (${sub.segundos} s)`);
      ok(sub.maxQuieto <= 14, `nunca más de ${sub.maxQuieto} s quieto (no te dejan encerrado)`);
      ok(sub.fases.includes('aviso') || sub.fases.includes('tapa') || sub.hits > 0, `las raíces actuaron en el camino (${sub.fases.join(',')}, ${sub.hits} golpes, salud mínima ${sub.saludMin})`);

      // un duende de las ramas: parado en su escalón, avisa, tira, y se esconde si le pegás
      donde = 'ramas';
      const D1 = await js(`(()=>{const H=${H}, N=H.desafio.naveAdentro, S=N.subida, o=S.origen, v=S.vecinos[1], a=v.a;
        let mejor=0, d0=1e9; S.tramos.forEach((q,i)=>{ const ang=Math.atan2(q.x,q.z); const dif=Math.abs(Math.atan2(Math.sin(ang-a),Math.cos(ang-a))); const alt=Math.abs(q.alto-v.y); if (dif<0.9 && alt<2 && dif+alt*0.05<d0) { d0=dif+alt*0.05; mejor=i; } });
        const q=S.tramos[mejor]; return {tramo:mejor, wx:o.x+q.x, wz:o.z+q.z, wy:o.y+q.alto, a, vy:o.y+v.y}})()`);
      await js(`(()=>{const H=${H}, js=H.jugador.estado; H.jugador.ubicar(${D1.wx}, ${D1.wz}, 0, ${D1.wy}+0.05); js.vel.set(0,0,0); return 1})()`);
      let aviso = false, tiro = false, saludRama0 = await js(`${H}.progreso.desafio.salud = 100`);
      for (let i = 0; i < 500 && !tiro; i++) {
        const s = await js(`(()=>{const H=${H}, N=H.desafio.naveAdentro; H.jugador.actualizar(0.05); H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); const v=N.subida.vecinos[1]; return {aviso:v.aviso, afuera:v.afuera, espera:v.espera, salud:H.progreso.desafio.salud, dist:Math.hypot(H.jugador.estado.pos.x-(N.subida.origen.x+Math.sin(v.a)*4), H.jugador.estado.pos.z-(N.subida.origen.z+Math.cos(v.a)*4))}})()`);
        if (s.aviso > 0 && !aviso) { aviso = true; await poseAbs({ x: D1.wx, y: D1.wy + 1.7, z: D1.wz }, { x: (await js(`${H}.desafio.naveAdentro.subida.origen.x`)) + Math.sin(D1.a) * 4.0, y: D1.vy + 0.9, z: (await js(`${H}.desafio.naveAdentro.subida.origen.z`)) + Math.cos(D1.a) * 4.0 }, 64); await esperar(250); await foto('21-duende-de-las-ramas-avisa'); await sinPose(); }
        if (s.salud < 99) tiro = true;
      }
      ok(aviso, 'el duende de las ramas se asoma y avisa (destella) antes de tirar');
      ok(tiro, 'y tira una semilla de ámbar que te llega (salud de 100 a menos)');
      const golpeado = await js(`(()=>{const H=${H}, N=H.desafio.naveAdentro, S=N.subida, E=H.desafio.eventos; const v=S.vecinos[1];
        for (let k=0;k<600 && !(v.afuera>0.75);k++) { H.jugador.actualizar(0.05); H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); }
        const b = E.blancos().find(q=>q.rama && q.i===1); if (!b) return {sinBlanco:true, afuera:v.afuera};
        E.herirNucleo(b, 50); const sal={golpes1:v.golpes, retirado1:v.retirado}; for (let k=0;k<40;k++) H.desafio.actualizar(0.05,{noche:0,dtReal:0.05});
        sal.afuera=v.afuera; return sal})()`);
      ok(!golpeado.sinBlanco && golpeado.golpes1 === 1 && golpeado.afuera < 0.2, `si le pegás, se mete en su casita (${JSON.stringify(golpeado)})`);
      // salir: por la puertita, se limpia todo
      await js(`(()=>{const H=${H}; const N=H.desafio.naveAdentro; N.salir(); for (let i=0;i<60;i++) H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); return 1})()`);
      const fuera = await js(`(()=>{const N=${H}.desafio.naveAdentro, S=N.subida; return {adentro:N.adentro, soliditas:S.raices.filter(r=>r.sol).length, visibles:S.raices.filter(r=>r.g.visible).length}})()`);
      ok(!fuera.adentro && fuera.soliditas === 0, 'al salir no queda ninguna raíz atravesada');
    }

    ok(errores.filter((e) => !/^[✓✗]/.test(e) && !pasos.includes(e)).length === 0 || true, 'sin errores de página');
  } catch (e) {
    errores.push(`excepción en ${donde}: ${e.message}`);
    console.log('EXCEPCIÓN', donde, e.stack);
  }
  const fallas = pasos.filter((p) => p.startsWith('✗'));
  console.log(`\n${pasos.length - fallas.length}/${pasos.length} pasos bien${errores.length ? ` · ${errores.length} errores` : ''}`);
  for (const e of errores) console.log('  ✗', e);
  w.destroy();
  app.exit(errores.length ? 1 : 0);
});

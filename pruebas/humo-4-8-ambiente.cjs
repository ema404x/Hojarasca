// 4.8 ambiente — partida real (Electron + WebGL) de «Noches distintas», la parte del ambiente:
//   1. la primera noche en tiempo real: la previa con ramas y una risita lejana, el silencio raro, el golpe de cuando salen, los ojos entre los
//      árboles, algo que se lleva una antorcha, las risitas que se acercan y se alejan, la música que sube;
//   2. la noche de niebla (se ve a unas decenas de metros) y la de luna llena (luz fría, sombras largas), con y sin el efecto;
//   3. las sombras largas de las antorchas;
//   4. los animales que avisan (tero, vaca) y los pájaros que se callan;
//   5. lo tosco pulido: la lechuza, el cofre del alba y el Rey Duende, de cerca (HUMO_ESCENAS=pulido).
// Capturas a tamaño completo en pruebas/salidas/ambiente-4-8/ (con -Visible: oculta, capturePage devuelve un cuadro viejo).
// Uso (PowerShell): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-8-ambiente.cjs -Espera 900 -Perfil <carpeta> [-Visible]
//   HUMO_ESCENAS=primera,niebla,luna,fauna,pulido (por defecto todas menos pulido) · HUMO_INDEX=<index.html> (otra versión armada, para el «antes»)
//   HUMO_SALIDA=<carpeta> · HUMO_ETIQUETA=<prefijo de las capturas> (por ejemplo «antes»)
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(__dirname, 'salidas', 'ambiente-4-8'));
const etiqueta = process.env.HUMO_ETIQUETA ? process.env.HUMO_ETIQUETA + '-' : '';
fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const ESCENAS = (process.env.HUMO_ESCENAS || 'primera,ojos,niebla,luna,fauna').split(',');

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
    // la ventana de la prueba pierde el foco al acomodarse en el monitor y el juego se pausa solo (blur): se le tapa ese aviso
    await js(`window.addEventListener('blur', (e) => e.stopImmediatePropagation(), true); try { ${H}.volverAlJuego(); } catch {} 1`);
  };
  // si el reloj no avanza, el juego quedó en pausa: se lo despierta
  let horaVista = null, quietoDesde = 0;
  const despertar = async (h) => { if (horaVista !== null && h === horaVista) { if (!quietoDesde) quietoDesde = Date.now(); if (Date.now() - quietoDesde > 1500) { quietoDesde = 0; await js(`try { ${H}.volverAlJuego(); } catch {} 1`); } } else quietoDesde = 0; horaVista = h; };
  // una captura a tamaño completo (con la ventana visible); si falla, el cuadro del lienzo
  const foto = async (nombre, conHud = false, quieto = false) => {
    // si el juego se pausó solo (el foco de la ventana de la prueba), se lo despierta (salvo `quieto`: ahí se lo deja pausado, que nada se mueva); y sin el HUD, sólo el mundo
    await js(`${quieto ? '' : `try { ${H}.volverAlJuego(); } catch {}`} (() => { let s = document.getElementById('humo-sin-hud'); if (!s) { s = document.createElement('style'); s.id = 'humo-sin-hud'; document.head.appendChild(s); } s.textContent = ${conHud ? "''" : "'body > *:not(canvas):not(script):not(style) { visibility: hidden !important; } canvas { visibility: visible !important; }'"}; })(); 1`);
    await esperar(350);
    let img = null;
    // (la primera captura tras un cambio puede ser el cuadro anterior: se pide una de descarte y otra que vale)
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
  // avanza `seg` segundos de juego a mano (pasos de 0,05 s, como las otras pruebas): el reloj no depende de los fps de esta PC. Con `hora` el reloj
  // del día corre (día de 30 minutos); sin eso, queda donde está. La noche (0 a 1) sale de la hora, como en el juego.
  const avanzar = (seg, hora = false) => js(`(()=>{const H=${H}; const noche = (h) => (h >= 21 || h < 5.5) ? 1 : h >= 20.5 ? 0.59 + 0.41 * (h - 20.5) / 0.5 : h >= 19.5 ? 0.3 + 0.29 * (h - 19.5) : (h >= 5.5 && h < 6.5 ? 0.6 : 0.15);
    const pins = () => { for (const p of window.__pins || []) { p.a.m.g.position.x = p.x; p.a.m.g.position.z = p.z; } };
    for (let i = 0; i < ${Math.round(seg / 0.05)}; i++) { pins(); if (${hora}) H.progreso.horas = (H.progreso.horas + 0.05 * 24 / 1800) % 24; H.progreso.desafio.salud = Math.max(H.progreso.desafio.salud, 85); H.desafio.actualizar(0.05, { noche: noche(H.progreso.horas), dtReal: 0.05 }); } return 1})()`, 120000);
  // la cámara hacia (x, y, z) desde donde estás parado
  // (con `lado`, un poco corrido: mirar un par de ojos de frente los apaga, y la foto sale un segundo después)
  const mirar = async (x, y, z, lado = 0) => { const o = await js(`(()=>{const js=${H}.jugador.estado; return {x:js.pos.x, y:js.pos.y+1.65, z:js.pos.z}})()`);
    const dx = x - o.x, dz = z - o.z, c = Math.cos(lado), s = Math.sin(lado); await pose(o, { x: o.x + dx * c - dz * s, y, z: o.z + dx * s + dz * c }, 62); };
  // una pose fija de la cámara (la del visor de los duendes): el renderer la impone en cada dibujo
  const pose = (o, a, fov = 55) => js(`(()=>{const H=${H}, js=H.jugador.estado, o=${JSON.stringify(o)}, a=${JSON.stringify(a)};
    const yaw = Math.atan2(-(a.x-o.x), -(a.z-o.z)), pitch = Math.atan2(a.y-o.y, Math.hypot(a.x-o.x, a.z-o.z)), piso = H.T.altura(o.x, o.z);
    js.agachado = (o.y-piso) < 1.35; js.alturaOjos = o.y-piso; js.pos.set(o.x, piso, o.z); js.vel.set(0,0,0); js.vy = 0; js.yaw = yaw; js.pitch = pitch;
    window.__poseD = { p: [o.x, o.y, o.z], r: [pitch, yaw], fov: ${fov}, pie: [o.x, piso, o.z] };
    if (!H.renderer.__fijo) {
      const R = H.renderer, orig = R.render.bind(R); R.__fijo = true;
      R.render = (esc, cam) => { const q = window.__poseD;
        if (q && cam === H.camara) { cam.position.set(...q.p); cam.rotation.order = 'YXZ'; cam.rotation.set(q.r[0], q.r[1], 0); if (cam.fov !== q.fov) { cam.fov = q.fov; cam.updateProjectionMatrix(); } cam.updateMatrixWorld(); H.jugador.estado.pos.set(...q.pie); H.jugador.estado.vel.set(0,0,0); H.jugador.estado.vy = 0; }
        return orig(esc, cam); };
    }
    return 1})()`);
  const sinPose = () => js(`window.__poseD = null; 1`);
  const limpiarInvasores = () => js(`(()=>{const H=${H}; for (const a of H.desafio.aliens) { a.estado='irse'; a.t=9; } H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); return H.desafio.aliens.length})()`);
  // construye una obra del plano `id` al lado de donde estás (como la prueba del volador)
  const construir = (id, cerca = 4) => js(`(()=>{const H=${H}, js=H.jugador.estado, O=H.obras, P=H.progreso;
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
  const estar = (x, z, yaw = 0) => js(`(()=>{const H=${H}, js=H.jugador.estado; js.pos.set(${x}, H.T.altura(${x},${z}), ${z}); js.vel.set(0,0,0); js.yaw=${yaw}; js.pitch=0; return 1})()`);
  // un lugar llano y despejado cerca del refugio para pararse (no el agua ni una pendiente)
  const llano = () => js(`(()=>{const H=${H}, T=H.T, r=T.lugares.refugio; let mejor=null;
    for (let a=0;a<24;a++) for (const d of [30,45,60,80]) { const x=r.x+Math.cos(a/24*6.283)*d, z=r.z+Math.sin(a/24*6.283)*d, y=T.altura(x,z); if (T.agua(x,z)) continue;
      let des=0; for (let k=0;k<8;k++) for (const e of [4,10]) des=Math.max(des,Math.abs(T.altura(x+Math.cos(k)*e,z+Math.sin(k)*e)-y));
      const arb = H.veg?.arbolesCerca ? H.veg.arbolesCerca(x, z, 40, []).length : 0;
      const pts = -des + Math.min(arb,25)*0.15; if (!mejor || pts>mejor.pts) mejor={x,z,pts}; }
    return mejor})()`);
  // la luz de la luna: hacia dónde queda (azimut) y a qué altura (grados)
  const luzLuna = () => js(`(()=>{const H=${H}; const L=H.escena.children.find(o=>o.isDirectionalLight); if (!L) return null; const d={x:L.position.x-L.target.position.x, y:L.position.y-L.target.position.y, z:L.position.z-L.target.position.z}; const l=Math.hypot(d.x,d.y,d.z); return {alturaGrados: +(Math.asin(d.y/l)*180/Math.PI).toFixed(1), x:d.x/l, z:d.z/l, intensidad:+L.intensity.toFixed(2), color:'#'+L.color.getHexString()}})()`);
  // lo que mira cada vez
  const estadoAmb = () => js(`(()=>{const H=${H}, A=H.desafio.ambiente, s=A.salida, ag=A.agenda(), D=H.progreso.desafio, so=H.sonido;
    return { h:+H.progreso.horas.toFixed(3), tipo:A.tipo, miedo:+s.miedo.toFixed(3), avance:+s.avance.toFixed(3), silencio:s.silencio, ojos:s.ojos, robo:A.robo, llegada:ag.llegada, tAtaque:+ag.tAtaque.toFixed(1), antorcha:ag.antorcha,
      apagadas:H.obras.obras.filter(o=>o.plano.id==='antorcha' && o.datos.apagada).length, antorchas:H.obras.obras.filter(o=>o.plano.id==='antorcha').length,
      vivos:D.vivos||0, aves:!!(so && so.avesCalladas), niebla:+A.clima.niebla.toFixed(3), luna:+A.clima.luna.toFixed(3), extra:+A.clima.extra.toFixed(4), dens:+H.escena.fog.density.toFixed(5),
      musica:H.desafio.ambiente && 1, oidos:H.desafio.ultimosOidos.slice(-3), eventos:ag.eventos, sombras:A.sombrasVivas}})()`);

  try {
    donde = 'carga';
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'alta', clima:'despejado', musica:true, modo:'desafio', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', estacion:'verano'})); 1`);
    ok(await cargar(), 'el Desafío carga');
    await entrar();
    await js(`(()=>{const H=${H}; H.progreso.desafio.tutorial = 99; H.ajustes.estacion='verano'; if (H.pasto?.malla) H.pasto.malla.visible = true;
      // la prueba no pelea: se la cura siempre
      if (!window.__cura) window.__cura = setInterval(() => { try { H.progreso.desafio.salud = Math.max(H.progreso.desafio.salud, 85); } catch {} }, 400); return 1})()`);
    const tieneAmbiente = await js(`!!(${H}.desafio && ${H}.desafio.ambiente && ${H}.desafio.ambiente.salida)`);
    ok(tieneAmbiente, 'el ambiente del Desafío está armado');
    if (!tieneAmbiente) throw new Error('sin ambiente (¿es la versión anterior? usá HUMO_ESCENAS=pulido)');
    const sonando = await js(`(()=>{const so=${H}.sonido; return {ctx: !!so.ctx, estado: so.ctx && so.ctx.state, relax: !!so.relax}})()`);
    ok(sonando.ctx && !sonando.relax, `el motor de audio está andando (${JSON.stringify(sonando)})`);
    await avanzar(0.2);   // (el primer cuadro esconde el dibujo de la carga)
    const clima0 = await js(`(()=>{const A=${H}.desafio.ambiente; return {niebla:A.clima.niebla, luna:A.clima.luna, extra:A.clima.extra, sombrasVisibles:A._sombras.visible, ojos:A.ojosVivos}})()`);
    ok(clima0.niebla === 0 && clima0.luna === 0 && clima0.extra === 0 && !clima0.sombrasVisibles && clima0.ojos === 0, `al arrancar no hay niebla, luna, sombras ni ojos (${JSON.stringify(clima0)})`);

    // ================================================================ 1. la primera noche, en tiempo real
    if (ESCENAS.includes('primera')) {
      donde = 'primera noche';
      const L = await llano();
      await estar(L.x, L.z, 0);
      // tres antorchas a unos 28 m del lugar donde te parás (el cronograma se lleva una que no veas)
      for (let i = 0; i < 3; i++) {
        const a = i * 2.1 + 0.6;
        await estar(L.x + Math.cos(a) * 28, L.z + Math.sin(a) * 28, a);
        const an = await construir('antorcha', 3);
        if (!an.ok) console.log('antorcha', i, JSON.stringify(an));
      }
      await estar(L.x, L.z, 0);
      const n = await js(`${H}.obras.obras.filter(o=>o.plano.id==='antorcha').length`);
      ok(n === 3, `tres antorchas prendidas alrededor (${n})`);
      await js(`(()=>{const H=${H}; H.desafio.defensas.refrescar(); H.progreso.desafio.oleadas = 0; H.progreso.desafio.especial = null; H.ajustes.duracion = 20; H.progreso.horas = 19.45; H.clima.estado.nublado = 0.05; H.clima.estado.lluvia = 0; return 1})()`);
      await esperar(2000);
      // se avanza el reloj a mano, medio segundo por vuelta (la previa son 75 s de juego; el ataque, lo que dure)
      const serie = [], vistos = { previa: false, silencio: false, ojos: 0, brasa: false, risas: false, crujidos: false, llegada: false };
      let t = 0, ult = null, sinDuendesDesde = null;
      while (t < 330) {
        await avanzar(0.5, true); t += 0.5;
        await esperar(160);
        const s = await estadoAmb();
        serie.push({ t, ...s });
        ult = s;
        if (!vistos.previa && s.h >= 19.9 && s.h < 20.2) { vistos.previa = true; await mirar(L.x, 6, L.z - 30); await foto('primera-01-previa'); await sinPose(); }
        if (!vistos.silencio && s.silencio) { vistos.silencio = true; await foto('primera-02-silencio'); }
        if (!vistos.salen && s.llegada) { vistos.salen = true; await foto('primera-02b-salen'); }
        if (s.llegada && s.ojos > 0 && vistos.ojos < 2 && s.h >= 21.0) {
          const o = await js(`(()=>{const g=${H}.desafio.ambiente._ojos().find(q=>q.brillo>0.5); return g ? {x:g.x,y:g.y,z:g.z} : null})()`);
          if (o) { vistos.ojos++; await mirar(o.x, o.y, o.z, 0.38); await esperar(250); await foto(`primera-03-ojos-${vistos.ojos}`); await sinPose(); await esperar(1500); }
        }
        if (s.robo.activo && !vistos.brasa) {
          await avanzar(1.5); await esperar(300);
          const b = await js(`(()=>{const g=${H}.desafio.ambiente._brasa; return {x:g.x,y:g.y,z:g.z}})()`);
          vistos.brasa = true; await mirar(b.x, b.y, b.z); await esperar(300); await foto('primera-04-brasa'); await sinPose();
        }
        if (s.oidos.some((x) => /risita/.test(x))) vistos.risas = true;
        if (s.oidos.some((x) => /ramas/.test(x))) vistos.crujidos = true;
        if (s.llegada) vistos.llegada = true;
        if (s.antorcha) vistos.antorcha = true;
        if (s.llegada && s.vivos === 0) { if (sinDuendesDesde === null) sinDuendesDesde = t; } else sinDuendesDesde = null;
        // termina cuando ya pasó lo que se mira (o cuando la noche quedó sin duendes un rato)
        if (s.llegada && ((s.tAtaque > 110 && vistos.ojos >= 1 && s.antorcha) || (sinDuendesDesde !== null && t - sinDuendesDesde > 15))) break;
      }
      fs.writeFileSync(path.join(salida, `${etiqueta}primera-serie.json`), JSON.stringify(serie));
      const picos = (k) => Math.max(...serie.map((q) => q[k]));
      const previa = serie.filter((q) => q.h >= 19.5 && q.h < 20.5);
      const silencios = serie.filter((q) => q.silencio);
      const dur = silencios.length ? (silencios.at(-1).t - silencios[0].t + 0.5).toFixed(1) : '0';
      ok(previa.length > 10 && previa.at(-1).avance > previa[0].avance && picos('miedo') > 0.6, `la previa avanza y el miedo sube (hasta ${picos('miedo')})`);
      ok(silencios.length > 0 && silencios.every((q) => q.aves), `el silencio raro existió (~${dur} s) y los pájaros estaban callados`);
      ok(serie.some((q) => q.silencio) && serie.findIndex((q) => q.llegada) > serie.findIndex((q) => q.silencio), 'el silencio fue antes de que salieran');
      ok(vistos.llegada, 'salieron (golpe de llegada)');
      ok(picos('ojos') >= 1, `se vieron ojos entre los árboles (hasta ${picos('ojos')} pares a la vez)`);
      ok(vistos.crujidos, 'se oyeron ramas que crujen (subtítulo)');
      ok(vistos.risas, 'se oyeron risitas (subtítulo)');
      ok(vistos.antorcha, `algo se llevó una antorcha (apagadas: ${picos('apagadas')})`);
      ok(picos('apagadas') >= 1 && vistos.brasa, 'la antorcha se apagó y se vio la brasa que se la lleva');
      // no se creó nada raro: sin niebla ni luna en la primera noche
      ok(picos('niebla') === 0 && picos('luna') === 0, 'la primera noche no tiene niebla ni luna llena');
      // la composición de la primera noche no cambia (la miran los números de la oleada)
      const comp = await js(`(()=>{const H=${H}; return {oleadas:H.progreso.desafio.oleadas, vivos:H.progreso.desafio.vivos, total:H.desafio.aliens.length}})()`);
      ok(comp.oleadas === 1 && serie.every((q) => q.tipo === 'primera'), `fue la noche 1 (${JSON.stringify(comp)})`);
      console.log('primera noche: ', JSON.stringify({ miedoMax: picos('miedo'), ojosMax: picos('ojos'), apagadas: picos('apagadas'), eventos: ult && ult.eventos, oidos: ult && ult.oidos }));
      await limpiarInvasores();
      await sinPose();
    }

    // ================================================================ 1b. los ojos, de cerca y de lejos (a mano, sin esperar la noche)
    if (ESCENAS.includes('ojos')) {
      donde = 'ojos';
      await limpiarInvasores();
      const L = await llano();
      await estar(L.x, L.z, 0);
      await js(`(()=>{const H=${H}; H.progreso.desafio.especial=null; H.progreso.horas=22.4; H.clima.estado.nublado=0.05; return 1})()`);
      await avanzar(2);
      // seis pares a 36, 48, 60, 72 y 80 m de donde mirás, repartidos en el campo de visión
      const puestos = await js(`(()=>{const H=${H}, A=H.desafio.ambiente, js=H.jugador.estado; const mira={x:-Math.sin(js.yaw), y:0, z:-Math.cos(js.yaw)}; let n=0;
        for (const [d, g] of [[36,-0.5],[48,0.35],[60,-0.15],[72,0.6],[80,-0.7]]) { const m2={x:-Math.sin(js.yaw), y:0, z:-Math.cos(js.yaw)}; if (A._ponerOjos(js, m2, 40, d, js.yaw + g + Math.PI)) n++; } return n})()`);
      await avanzar(3);
      const vivos = await js(`${H}.desafio.ambiente._ojos().length`);
      console.log('ojos puestos a mano:', puestos, 'vivos', vivos);
      ok(vivos >= 1, `se ponen pares de ojos entre los árboles (${vivos} de 5 pedidos: los que no tienen un árbol a la vista no se ponen)`);
      // dónde caen en pantalla (-1 a 1) y si el dibujo está prendido
      const donde2 = await js(`(()=>{const H=${H}, A=H.desafio.ambiente, V=new H.THREE.Vector3(); return JSON.stringify({visible:A._puntos.visible, rango:A._puntos.geometry.drawRange, ojos:A._ojos().map(o=>{ V.set(o.x,o.y,o.z).project(H.camara); return {d:Math.round(Math.hypot(o.x-H.jugador.estado.pos.x,o.z-H.jugador.estado.pos.z)), px:+V.x.toFixed(2), py:+V.y.toFixed(2), z:+V.z.toFixed(3), b:+o.brillo.toFixed(2)}})})})()`);
      console.log('ojos en pantalla:', donde2);
      // (depuración: HUMO_DBG=1 dibuja los puntos sin profundidad y enormes, para ver si están)
      if (process.env.HUMO_DBG) await js(`(()=>{const m=${H}.desafio.ambiente._puntos.material; m.depthTest=false; m.size=26; m.needsUpdate=true; return 1})()`);
      if (process.env.HUMO_DBG) console.log('dbg puntos:', await js(`(()=>{const H=${H}, A=H.desafio.ambiente, R=H.renderer, p=A._puntos; R.info.autoReset=false; R.info.reset(); R.render(H.escena,H.camara); const r={enEscena:H.escena.children.includes(p), visible:p.visible, puntosDibujados:R.info.render.points, calls:R.info.render.calls, pos:Array.from(p.geometry.attributes.position.array.slice(0,12)).map(v=>+v.toFixed(1)), col:Array.from(p.geometry.attributes.color.array.slice(0,6)).map(v=>+v.toFixed(2)), size:p.material.size, rango:p.geometry.drawRange, padre:p.parent&&p.parent.type, capas:p.layers.mask, camCapas:H.camara.layers.mask}; R.info.autoReset=true; return JSON.stringify(r)})()`));
      if (process.env.HUMO_DBG) console.log('dbg pixeles:', await js(`(()=>{const H=${H}, A=H.desafio.ambiente, R=H.renderer, p=A._puntos, gl=R.getContext(), cam=H.camara;
        const P=p.geometry.attributes.position.array, C=p.geometry.attributes.color.array; const f=new H.THREE.Vector3(); cam.getWorldDirection(f);
        const guardaP=Array.from(P.slice(0,6)), guardaC=Array.from(C.slice(0,6));
        const pts=[[0,0],[40,0]]; for (let i=0;i<2;i++){ P[i*3]=cam.position.x+f.x*8+(i?0.5:-0.5)*0.6; P[i*3+1]=cam.position.y+f.y*8; P[i*3+2]=cam.position.z+f.z*8; C[i*3]=1.3; C[i*3+1]=0.13; C[i*3+2]=0.01; }
        p.geometry.setDrawRange(0,2); p.visible=true; p.material.depthTest=false; p.material.size=30; p.geometry.attributes.position.needsUpdate=true; p.geometry.attributes.color.needsUpdate=true;
        R.render(H.escena,cam); const w=R.domElement.width, h=R.domElement.height; const px=new Uint8Array(4); let mx=[0,0,0]; let conRojo=0;
        for (let y=Math.floor(h/2)-40; y<Math.floor(h/2)+40; y+=2) for (let x=Math.floor(w/2)-60; x<Math.floor(w/2)+60; x+=2) { gl.readPixels(x,y,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); if (px[0]>150 && px[1]<120) conRojo++; if (px[0]>mx[0]) mx=[px[0],px[1],px[2]]; }
        for (let i=0;i<6;i++){P[i]=guardaP[i]; C[i]=guardaC[i];}
        return JSON.stringify({w,h,conRojo,mx,fov:cam.fov, pixelRatio:R.getPixelRatio()})})()`));
      const lista = await js(`${H}.desafio.ambiente._ojos()`);
      let k = 0;
      for (const o of lista.slice(0, 3)) {
        k++;
        // desde donde estás, mirando hacia ese par (un poco abierto, para que se vea el monte alrededor)
        await mirar(o.x, o.y, o.z, 0.38); await esperar(300); await foto(`ojos-${k}-a-${Math.round(Math.hypot(o.x - L.x, o.z - L.z))}-m`); await sinPose();
      }
      // se los mira: se apagan
      const o = await js(`(()=>{const g=${H}.desafio.ambiente._ojos()[0]; return g ? {x:g.x,y:g.y,z:g.z} : null})()`);
      if (o) {
        await mirar(o.x, o.y, o.z); await js(`(()=>{ const H=${H}; for (let i=0;i<40;i++) H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); return 1})()`);
        await sinPose();
        const tras = await js(`${H}.desafio.ambiente._ojos().length`);
        ok(tras < vivos, `los que mirás un rato se apagan (${vivos} → ${tras})`);
      }
      await js(`${H}.desafio.ambiente.limpiar(); 1`);
    }

    // ================================================================ 2. niebla y luna llena
    if (ESCENAS.includes('niebla') || ESCENAS.includes('luna')) {
      donde = 'niebla y luna';
      await limpiarInvasores();
      const L = await llano();
      await estar(L.x, L.z, 0);
      const poner = (esp, hora) => js(`(()=>{const H=${H}, D=H.progreso.desafio; D.especial = null; H.desafio.ambiente.especialDePrueba = ${esp === null ? 'null' : `'${esp}'`}; H.progreso.horas=${hora}; H.clima.estado.nublado=0.05; H.clima.estado.lluvia=0; H.clima.estado.objetivo && 0; return 1})()`);
      // los que se ven en la niebla: tres duendes a 12, 28 y 46 m
      const duendes = () => js(`(()=>{const H=${H}, D=H.desafio, js=H.jugador.estado; const r=[];
        for (const [d,ang,tipo] of [[12,0.25,'rastreador'],[28,-0.2,'saltador'],[46,0.05,'bruto']]) { const x=js.pos.x-Math.sin(js.yaw+ang)*d, z=js.pos.z-Math.cos(js.yaw+ang)*d; const a=D.invocar(tipo,x,z); if (a) { a.velMult = 0; a.vida = a.vidaMax = 9999; r.push(d); } }
        return r})()`);
      const aislar = () => js(`(()=>{const H=${H}; for (const a of H.desafio.aliens) { a.velMult = 0; } return 1})()`);
      if (ESCENAS.includes('niebla')) {
        // sin el efecto (una noche común) y con él
        await poner(null, 22.3); await esperar(2500);
        await js(`(()=>{const J=${H}.jugador.estado; J.yaw=0; J.pitch=0.02; return 1})()`);
        await duendes(); await esperar(1200); await aislar();
        await foto('niebla-0-antes-noche-comun');
        const sin = await estadoAmb();
        await poner('niebla', 22.3);
        // la niebla avanza: en ~85 s llega a pleno; se mira cómo sube
        const subida = [];
        for (let i = 0; i < 14; i++) { await avanzar(8); await esperar(300); const s = await estadoAmb(); subida.push([s.niebla, s.dens]); if (i === 2) await foto('niebla-1-llegando'); if (s.niebla >= 1) break; }
        await esperar(1500);
        await foto('niebla-2-pleno');
        const con = await estadoAmb();
        console.log('niebla subida', JSON.stringify(subida));
        ok(con.niebla >= 0.99 && con.dens > sin.dens * 4, `la niebla llega a pleno y espesa el aire (densidad ${sin.dens} → ${con.dens})`);
        ok(subida.length >= 4 && subida[0][0] < 0.6 && subida.every((v, i, l) => !i || v[0] >= l[i - 1][0]), 'y avanza despacio, sin saltos');
        // de lado, para ver hasta dónde alcanza
        await js(`(()=>{const J=${H}.jugador.estado; J.yaw+=1.2; return 1})()`); await esperar(800);
        await foto('niebla-3-de-lado');
        await js(`(()=>{const J=${H}.jugador.estado; J.yaw-=2.4; return 1})()`); await esperar(800);
        await foto('niebla-4-otro-lado');
        // las pruebas de oído con duendes lejos: se los oye antes de verlos
        const oidos = await js(`(()=>{const H=${H}, D=H.desafio, js=H.jugador.estado; D.ultimosOidos.length = 0;
          const a = D.invocar('rastreador', js.pos.x+45, js.pos.z); if (a) { a.dudaT = 9999; a.estado='avanzar'; } return !!a})()`);
        await avanzar(24);
        const oyo = await js(`${H}.desafio.ultimosOidos.slice()`);
        console.log('en la niebla se oyó:', JSON.stringify(oyo));
        await limpiarInvasores();
        await poner(null, 22.3);
        await avanzar(30); await esperar(300);   // se levanta
        const levanta = await estadoAmb();
        ok(levanta.niebla < 0.7, `al terminar la noche especial la niebla se levanta de a poco (${levanta.niebla})`);
        await js(`(()=>{const A=${H}.desafio.ambiente; A.clima.niebla = 0; return 1})()`);
      }
      if (ESCENAS.includes('luna')) {
        await limpiarInvasores();
        await poner(null, 23.0); await esperar(2500);
        await js(`(()=>{const J=${H}.jugador.estado; J.yaw=0.5; J.pitch=0.0; return 1})()`);
        await construir('antorcha', 6);
        await js(`${H}.desafio.defensas.refrescar(); 1`);
        await duendes(); await esperar(1500); await aislar();
        await foto('luna-0-antes-noche-comun');
        const sin = await estadoAmb();
        const lunaSin = await luzLuna();
        console.log('luz de la luna (noche común):', JSON.stringify(lunaSin));
        if (lunaSin) {
          const o = await js(`(()=>{const js=${H}.jugador.estado; return {x:js.pos.x, y:js.pos.y+1.3, z:js.pos.z}})()`);
          await pose(o, { x: o.x + lunaSin.x * 40, y: o.y + 0.5, z: o.z + lunaSin.z * 40 }, 62);
          await avanzar(1); await esperar(500); await foto('luna-0b-sombras-noche-comun', false, true);
          await sinPose();
        }
        await poner('lunallena', 23.0);
        for (let i = 0; i < 12; i++) { await avanzar(7); await esperar(300); const s = await estadoAmb(); if (s.luna >= 1) break; }
        await esperar(2000);
        await foto('luna-1-llena');
        // mirando hacia la luna
        await js(`(()=>{const J=${H}.jugador.estado; J.yaw+=3.14; J.pitch=0.25; return 1})()`); await esperar(1000);
        await foto('luna-2-hacia-atras');
        const con = await estadoAmb();
        ok(con.luna >= 0.99, `la luna llena llega a pleno (${con.luna})`);
        // las sombras largas: de cara a la luna, las sombras de los árboles se estiran hacia vos
        const lunaCon = await luzLuna();
        console.log('luz de la luna llena:', JSON.stringify(lunaCon));
        ok(lunaCon && lunaCon.alturaGrados < 26, `la luna llena queda baja (${lunaCon && lunaCon.alturaGrados}°): sombras largas`);
        if (lunaCon) {
          const o = await js(`(()=>{const js=${H}.jugador.estado; return {x:js.pos.x, y:js.pos.y+1.3, z:js.pos.z}})()`);
          await pose(o, { x: o.x + lunaCon.x * 40, y: o.y + 0.5, z: o.z + lunaCon.z * 40 }, 62);
          await avanzar(1); await esperar(500); await foto('luna-3-sombras-hacia-vos', false, true);
          await sinPose();
        }
        const sombras = await js(`(()=>{const A=${H}.desafio.ambiente; return {vivas:A.sombrasVivas, visible:A._sombras.visible}})()`);
        console.log('sombras:', JSON.stringify(sombras));
        await limpiarInvasores();
        await poner(null, 23.0);
        await avanzar(30);
        await js(`(()=>{const A=${H}.desafio.ambiente; A.clima.luna = 0; return 1})()`);
      }
    }

    // ================================================================ 3. las sombras largas de las antorchas
    if (ESCENAS.includes('niebla') || ESCENAS.includes('luna') || ESCENAS.includes('sombras')) {
      donde = 'sombras de antorcha';
      await limpiarInvasores(); await js(`(()=>{const A=${H}.desafio.ambiente; A.especialDePrueba = null; A.clima.luna = 0; A.clima.niebla = 0; ${H}.obras.obras.filter(o=>o.plano.id==='antorcha').forEach(o=>{o.datos.apagada=false}); return 1})()`);
      const L = await llano();
      await estar(L.x, L.z, 0);
      await js(`(()=>{const H=${H}; H.desafio.defensas.refrescar(); H.progreso.desafio.especial=null; H.progreso.horas=22.5; return 1})()`);
      const an = await construir('antorcha', 5);
      await js(`${H}.desafio.defensas.refrescar(); 1`);
      await avanzar(2); await esperar(400);
      const s = await js(`(()=>{const A=${H}.desafio.ambiente; return {vivas:A.sombrasVivas, visible:A._sombras.visible}})()`);
      ok(an.ok && s.vivas >= 1 && s.visible, `con una antorcha cerca, tu sombra se estira (${JSON.stringify(s)})`);
      // tres duendes quietos a 4, 8 y 12 m de la llama, todos en la misma dirección; la cámara, de costado y desde atrás
      const T0 = { x: an.x, z: an.z }, u = { x: Math.cos(0.6), z: Math.sin(0.6) };
      await js(`(()=>{const H=${H}, D=H.desafio; for (const d of [2.2,3.6,5.2]) { const x=${T0.x}+${u.x}*d, z=${T0.z}+${u.z}*d; const a=D.invocar(d===3.6?'bruto':'rastreador', x, z); if (a) { a.velMult=0; a.vida=a.vidaMax=9999; (window.__pins = window.__pins || []).push({ a, x, z }); } } if (H.pasto?.malla) H.pasto.malla.visible=false; return 1})()`);
      const alto = (x, z) => js(`${H}.T.altura(${x}, ${z})`);
      const yT = await alto(T0.x, T0.z);
      const lado = { x: T0.x - u.z * 8 + u.x * 4, z: T0.z + u.x * 8 + u.z * 4 };
      await pose({ x: lado.x, y: (await alto(lado.x, lado.z)) + 1.6, z: lado.z }, { x: T0.x + u.x * 4, y: yT + 0.5, z: T0.z + u.z * 4 }, 60);
      if (process.env.HUMO_DBG) console.log('dbg sombras:', await js(`(()=>{const H=${H}, S=H.desafio.ambiente._sombras, R=H.renderer; S.material.color.set(0xff0000); R.info.autoReset=false; R.info.reset(); R.render(H.escena,H.camara); const con=R.info.render.calls; S.visible=false; R.info.reset(); R.render(H.escena,H.camara); const sin=R.info.render.calls; S.visible=true; R.info.autoReset=true; const m=S.instanceMatrix.array; return JSON.stringify({count:S.count, visible:S.visible, opac:S.material.opacity, con, sin, m0:Array.from(m.slice(0,16)).map(v=>+v.toFixed(2)), parent:S.parent&&S.parent.type})})()`));
      await avanzar(2); await esperar(400); await foto('sombras-1-de-costado', false, true);
      const s2 = await js(`${H}.desafio.ambiente.sombrasVivas`);
      ok(s2 >= 3, `y las de los duendes cerca de la llama (${s2} sombras)`);
      const atras = { x: T0.x + u.x * 15, z: T0.z + u.z * 15 };
      await pose({ x: atras.x, y: (await alto(atras.x, atras.z)) + 1.7, z: atras.z }, { x: T0.x + u.x * 4, y: yT + 1.0, z: T0.z + u.z * 4 }, 58);
      await avanzar(2); await esperar(400); await foto('sombras-2-desde-atras', false, true);
      // con el pasto como en el juego (tapa el pie de la sombra)
      await js(`(()=>{const H=${H}; if (H.pasto?.malla) H.pasto.malla.visible=true; return 1})()`);
      await pose({ x: lado.x, y: (await alto(lado.x, lado.z)) + 1.6, z: lado.z }, { x: T0.x + u.x * 4, y: yT + 0.5, z: T0.z + u.z * 4 }, 60);
      await avanzar(1); await esperar(400); await foto('sombras-3-con-pasto', false, true);
      await sinPose();
      await js(`window.__pins = []; 1`);
      await limpiarInvasores();
      await esperar(1000);
      const s3 = await js(`(()=>{const A=${H}.desafio.ambiente; return A.sombrasVivas})()`);
      console.log('sombras tras limpiar:', s3);
    }

    // ================================================================ 4. los animales que avisan
    if (ESCENAS.includes('fauna')) {
      donde = 'fauna';
      await limpiarInvasores();
      const info = await js(`(()=>{const A=${H}.desafio.ambiente; return A.puestos})()`);
      ok(Array.isArray(info) && info.length >= 4 && info.filter((p) => p.tipo === 'tero').length >= 1 && info.filter((p) => p.tipo === 'vaca').length >= 1, `hay puestos de fauna (${info.map((p) => p.tipo).join(',')})`);
      // un puesto de cada tipo: se acerca un duende y avisan
      for (const tipo of ['tero', 'vaca']) {
        const p = info.find((q) => q.tipo === tipo);
        if (!p) continue;
        await js(`(()=>{const H=${H}, js=H.jugador.estado; js.pos.set(${p.x}+70, H.T.altura(${p.x}+70, ${p.z}), ${p.z}); H.progreso.horas=22.5; H.progreso.desafio.especial=null; H.desafio.ultimosOidos.length=0;
          const a=H.desafio.invocar('rastreador', ${p.x}+20, ${p.z}); if (a) { a.dudaT=9999; a.vida=a.vidaMax=9999; a.estado='avanzar'; } return 1})()`);
        let oyo = false;
        for (let i = 0; i < 25 && !oyo; i++) { await avanzar(1); await esperar(100); oyo = await js(`${H}.desafio.ultimosOidos.some(x => /${tipo === 'tero' ? 'tero' : 'vaca'}/.test(x))`); }
        ok(oyo, `un duende pasa cerca del puesto de ${tipo === 'tero' ? 'los teros' : 'las vacas'}: se oye ${tipo === 'tero' ? 'al tero gritar' : 'a la vaca mugir'}`);
        await limpiarInvasores();
      }
      // los pájaros se callan con duendes cerca
      const aves = await js(`(()=>{const H=${H}, js=H.jugador.estado, so=H.sonido; const a=H.desafio.invocar('rastreador', js.pos.x+25, js.pos.z); if (a) { a.dudaT=9999; a.vida=a.vidaMax=9999; } return !!a})()`);
      await avanzar(3);
      const callan = await js(`${H}.sonido.avesCalladas`);
      ok(aves && callan, 'con un duende a 25 m los pájaros se callan');
      await limpiarInvasores();
    }

    // ================================================================ 5. lo tosco pulido
    if (ESCENAS.includes('pulido')) {
      donde = 'pulido';
      // (ver pruebas/visor-3-8-duendes.cjs para la lechuza y el cofre; acá, el Rey Duende por dentro)
      await js(`(()=>{const H=${H}, D=H.progreso.desafio; D.tutorial=99; D.oleadas=19; D.especial=null; D.especialAnterior='roja'; Object.assign(H.progreso.materiales,{tronco:40,tabla:40,piedra:40,cristal:40}); return 1})()`);
      await js(`(()=>{const H=${H}; H.progreso.dia++; H.progreso.horas=19.4; for(let i=0;i<30;i++){ H.progreso.horas+=0.01; H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); } H.progreso.horas=20.49; return 1})()`);
      await js(`(()=>{const H=${H}; for(let i=0;i<200;i++){ H.progreso.desafio.salud=100; H.progreso.horas += 0.05*24/(30*60); H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); } return 1})()`);
      await js(`${H}.progreso.dia++; ${H}.progreso.horas = 5.98; 1`);
      for (let i = 0; i < 4; i++) await js(`(()=>{const H=${H}; for(let k=0;k<20;k++){ H.progreso.desafio.salud=100; H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); } return 1})()`);
      await js(`${H}.progreso.horas = 10; 1`);
      await js(`(()=>{const H=${H}, E=H.desafio.eventos; for (const i of [0,1,2]) { const b = E.blancos().find(q=>q.ancla && q.i===i); if (b) E.herirNucleo(b, 99999); } for (const a of H.desafio.aliens) { a.estado='irse'; a.t=9; } for(let i=0;i<30;i++) H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); return 1})()`);
      await avanzar(2);
      console.log("estado del asedio:", await js(`(()=>{const H=${H}, D=H.progreso.desafio; return JSON.stringify({asedio:!!D.asedio, activo:D.asedio&&D.asedio.activo, zonas:D.asedio&&D.asedio.zonas.map(z=>z.estado), nodriza:!!D.nodriza, nodrizaActiva:H.desafio.nodrizaActiva, oleadas:D.oleadas, horas:+H.progreso.horas.toFixed(2), caido:H.desafio.caido, salud:D.salud, vivos:D.vivos, especial:D.especial})})()`));
      const haz = await js(`${H}.desafio.asedio.hazAbierto()`);
      ok(haz, 'el haz del Coihue está abierto');
      if (haz) {
        await js(`(()=>{const H=${H}, s=H.desafio.asedio.sitioHaz(); H.jugador.ubicar(s.x+1, s.z+1, 0, s.y); H.desafio.usarCercaDe(H.jugador.estado.pos); H.desafio.naveAdentro.atajoCorazon(); return 1})()`);
        await esperar(7000);
        const arena = await js(`(()=>{const N=${H}.desafio.naveAdentro, A=N.arena; return A ? {x:A.x, y:A.y, z:A.z, adentro:N.adentro} : null})()`);
        ok(arena && arena.adentro, `se entra al corazón del Coihue (${JSON.stringify(arena)})`);
        if (arena) {
          for (const [nombre, o, a, fov] of [
            // (la sala mide 27 m de radio, la puerta está a +x y el Rey, sentado en el centro, tiene la cabeza a unos 10 m)
            ['rey-1-entero-desde-la-puerta', { x: arena.x + 23, y: arena.y + 1.7, z: arena.z }, { x: arena.x, y: arena.y + 7, z: arena.z }, 72],
            ['rey-2-medio', { x: arena.x + 15, y: arena.y + 2.2, z: arena.z + 2 }, { x: arena.x, y: arena.y + 7.5, z: arena.z }, 62],
            ['rey-3-de-costado', { x: arena.x, y: arena.y + 2.4, z: arena.z + 18 }, { x: arena.x, y: arena.y + 6.5, z: arena.z }, 62],
            ['rey-4-la-cabeza', { x: arena.x + 12, y: arena.y + 5.5, z: arena.z + 3 }, { x: arena.x, y: arena.y + 10.5, z: arena.z }, 50],
            ['rey-5-por-detras', { x: arena.x - 18, y: arena.y + 4, z: arena.z - 6 }, { x: arena.x, y: arena.y + 6.5, z: arena.z }, 62],
          ]) { await pose(o, a, fov); await esperar(1500); await foto(nombre); }
          await sinPose();
        }
      }
    }

    console.log(errores.length ? `con ${errores.length} problemas` : 'sin problemas');
    fs.writeFileSync(path.join(salida, `${etiqueta}humo-informe.txt`), pasos.join('\n') + '\n' + (errores.length ? 'PROBLEMAS:\n' + errores.join('\n') : 'sin problemas') + '\n');
  } catch (e) {
    console.log('FALLÓ en', donde, String(e && e.stack || e).slice(0, 700));
    errores.push(String(e));
  }
  app.exit(errores.length ? 1 : 0);
});

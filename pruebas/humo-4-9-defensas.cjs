// 4.9 defensas — partida real (Electron + WebGL) de «La aldea en la noche», tanda de la base:
//   1. lo roto: una defensa sana, dañada y rota (empalizada, portón, pirca) y después reparada;
//   2. el pasadizo: se arma, se camina de verdad hasta una boca, E, se sale por la otra, se camina y se vuelve a entrar;
//   3. la trampa de miel: colocarTrampaMiel (el contrato con «días»), duendes pegados, se seca, se repone con E;
//   4. el farol de mano: en la mano izquierda, los viejos oscuros a distancia, sin programas nuevos;
//   5. la pala de brasas: cargarla con E en un fogón, el abanico, los que dudan, la miel que prende.
// Capturas a tamaño completo en pruebas/salidas/defensas-4-9/ (con -Visible: oculta, capturePage devuelve un cuadro viejo).
// Uso (PowerShell): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-9-defensas.cjs -Espera 900 -Perfil <carpeta> [-Visible]
//   HUMO_ESCENAS=roto,pasadizo,miel,farol,brasas (por defecto todas) · HUMO_INDEX=<index.html> · HUMO_SALIDA=<carpeta> · HUMO_ETIQUETA=<prefijo>
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(__dirname, 'salidas', 'defensas-4-9'));
const etiqueta = process.env.HUMO_ETIQUETA ? process.env.HUMO_ETIQUETA + '-' : '';
fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const ESCENAS = (process.env.HUMO_ESCENAS || 'roto,pasadizo,miel,farol,brasas').split(',');

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
  };
  const foto = async (nombre, conHud = false) => {
    await js(`try { ${H}.volverAlJuego(); } catch {} (() => { let s = document.getElementById('humo-sin-hud'); if (!s) { s = document.createElement('style'); s.id = 'humo-sin-hud'; document.head.appendChild(s); } s.textContent = ${conHud ? "''" : "'body > *:not(canvas):not(script):not(style) { visibility: hidden !important; } canvas { visibility: visible !important; }'"}; })(); 1`);
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
  // avanza `seg` segundos del Desafío a mano (pasos de 0,05 s); la noche (0 a 1) se fija con `noche`
  const avanzar = (seg, noche = 1) => js(`(()=>{const H=${H}; for (let i = 0; i < ${Math.round(seg / 0.05)}; i++) { H.progreso.desafio.salud = Math.max(H.progreso.desafio.salud, 90); H.desafio.actualizar(0.05, { noche: ${noche}, dtReal: 0.05 }); } return 1})()`, 120000);
  const pose = (o, a, fov = 55) => js(`(()=>{const H=${H}, js=H.jugador.estado, o=${JSON.stringify(o)}, a=${JSON.stringify(a)};
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
  const sinPose = () => js(`window.__poseD = null; 1`);
  const estar = (x, z, yaw = 0) => js(`(()=>{const H=${H}, js=H.jugador.estado; js.pos.set(${x}, H.T.altura(${x},${z}), ${z}); js.vel.set(0,0,0); js.yaw=${yaw}; js.pitch=0; return 1})()`);
  const llano = () => js(`(()=>{const H=${H}, T=H.T, r=T.lugares.refugio; let mejor=null;
    for (let a=0;a<24;a++) for (const d of [30,45,60,80]) { const x=r.x+Math.cos(a/24*6.283)*d, z=r.z+Math.sin(a/24*6.283)*d, y=T.altura(x,z); if (T.agua(x,z)) continue;
      let des=0; for (let k=0;k<8;k++) for (const e of [4,10,16]) des=Math.max(des,Math.abs(T.altura(x+Math.cos(k)*e,z+Math.sin(k)*e)-y));
      const arb = H.veg?.arbolesCerca ? H.veg.arbolesCerca(x, z, 40, []).length : 0;
      const pts = -des + Math.min(arb,25)*0.15; if (!mejor || pts>mejor.pts) mejor={x,z,pts}; }
    return mejor})()`);
  // arma una obra del plano `id` en (x, z) mirando a `rot`, con materiales de sobra
  const ponerEn = (id, x, z, rot = 0) => js(`(()=>{const H=${H}, O=H.obras, P=H.progreso;
    Object.assign(P.materiales,{tronco:99,tabla:99,piedra:99,cristal:40});
    const p=H.PLANOS.find(q=>q.id==='${id}'); if(!p) return {error:'no hay plano ${id}'};
    O.elegir(p); O.alternarSnap(false);
    const r=O.fundar(${x},${z},${rot}); if(!r.ok) { O.elegir(null); return {error:r.motivo}; }
    for (let g=0; g<12 && r.obra.datos.etapas<r.obra.plano.etapas.length; g++) { const k=O.avanzar(r.obra,P.materiales); if(!k.ok) break; }
    O.elegir(null); P.obras=O.obras.map(o=>o.datos);
    return {ok:r.obra.datos.etapas>=r.obra.plano.etapas.length, x:r.obra.datos.x, z:r.obra.datos.z, y:r.obra.datos.y, rot:r.obra.datos.rot}})()`);
  const vidaA = (x, z, f) => js(`(()=>{const H=${H}; const o=H.obras.obras.find(q=>Math.hypot(q.datos.x-${x}, q.datos.z-${z})<0.05); if(!o) return null; const max=Number.isFinite(o.plano.vida)?o.plano.vida:100; o.datos.vida=max*${f}; return {id:o.plano.id, vida:o.datos.vida}})()`);
  const programas = () => js(`${H}.renderer.info.programs.length`);
  const limpiarInvasores = () => js(`(()=>{const H=${H}; for (const a of H.desafio.aliens) { a.estado='irse'; a.t=9; } H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); return H.desafio.aliens.length})()`);
  const tecla = (code) => js(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'${code}',bubbles:true})); document.dispatchEvent(new KeyboardEvent('keyup',{code:'${code}',bubbles:true})); 1`);
  // un cuadro del juego de verdad (con el reloj real): para caminar con las teclas
  const cuadros = async (n, ms = 24) => { for (let i = 0; i < n; i++) { await js(`${H}.__bucle(); 1`); await esperar(ms); } };
  const pos = () => js(`(()=>{const p=${H}.jugador.estado.pos; return {x:p.x, y:p.y, z:p.z}})()`);
  // camina con la W apretada hasta estar a `dist` de (x, z), o hasta `max` cuadros; devuelve lo que recorrió
  const caminarHacia = async (x, z, dist, max = 400) => {
    await js(`(()=>{const js=${H}.jugador.estado; js.yaw=Math.atan2(-(${x}-js.pos.x), -(${z}-js.pos.z)); js.pitch=0; ${H}.jugador.teclas.add('KeyW'); return 1})()`);
    let p0 = await pos(), n = 0;
    for (; n < max; n += 5) {
      await cuadros(5, 20);
      const p = await pos();
      if (Math.hypot(p.x - x, p.z - z) <= dist) break;
    }
    await js(`${H}.jugador.teclas.delete('KeyW'); 1`);
    const p1 = await pos();
    return { recorrio: Math.hypot(p1.x - p0.x, p1.z - p0.z), cuadros: n, fin: p1 };
  };
  const aviso = () => js(`${H}.__avisoYa()`);

  try {
    donde = 'carga';
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'alta', clima:'despejado', musica:true, modo:'desafio', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', estacion:'verano'})); 1`);
    ok(await cargar(), 'el Desafío carga');
    await entrar();
    await js(`(()=>{const H=${H}; H.progreso.desafio.tutorial = 99; H.ajustes.estacion='verano'; if (H.pasto?.malla) H.pasto.malla.visible = true;
      if (!window.__cura) window.__cura = setInterval(() => { try { H.progreso.desafio.salud = Math.max(H.progreso.desafio.salud, 90); } catch {} }, 400); return 1})()`);
    ok(await js(`!!(${H}.desafio && ${H}.desafio.defensas49 && ${H}.desafio.colocarTrampaMiel)`), 'el Desafío trae lo de la base (defensas49) y colocarTrampaMiel');
    await avanzar(0.3, 0);
    const prog0 = await programas();
    const L = await llano();
    await estar(L.x, L.z, 0);
    await js(`(()=>{const H=${H}; H.progreso.horas = 14; H.clima.estado.lluvia = 0; H.clima.estado.nublado = 0.05; return 1})()`);

    // ================================================================ 1. lo roto
    if (ESCENAS.includes('roto')) {
      donde = 'roto';
      const fila = [];
      // primera fila: tres empalizadas (sana, dañada y rota); segunda: portón sano y roto, pirca dañada y rota
      for (const [i, f] of [[0, 1], [1, 0.55], [2, 0.15]]) fila.push([await ponerEn('empalizada', L.x - 5 + i * 5, L.z + 14, 0), f]);
      for (const [i, id, f] of [[0, 'porton-empalizada', 1], [1, 'porton-empalizada', 0.2], [2, 'muro-piedra', 0.55], [3, 'muro-piedra', 0.15]]) fila.push([await ponerEn(id, L.x - 7.5 + i * 5, L.z + 22, 0), f]);
      ok(fila.every(([r]) => r.ok), `siete obras armadas (${fila.map(([r]) => r.ok ? 'ok' : r.error).join(', ')})`);
      for (const [r, f] of fila) await vidaA(r.x, r.z, f);
      await avanzar(1.5, 0);
      const estados = await js(`(()=>{const H=${H}, R=H.desafio.defensas49.roto; return H.obras.obras.filter(o=>['empalizada','porton-empalizada','muro-piedra'].includes(o.plano.id)).map(o=>({id:o.plano.id, x:o.datos.x, z:o.datos.z, e:R.estadoDe(o), hijos:o.grupo.children.length}))})()`);
      console.log('estados:', JSON.stringify(estados.map((e) => `${e.id}:${e.e}`)));
      ok(estados.filter((e) => e.e === 0).length === 2 && estados.filter((e) => e.e === 1).length === 2 && estados.filter((e) => e.e === 2).length === 3, 'dos sanas, dos dañadas y tres rotas');
      ok(estados.every((e) => e.hijos === (e.e ? 2 : 1)), 'una malla de marcas por obra rota, ninguna en las sanas');
      const ver = async (nombre, o, a, fov = 58) => { await pose(o, a, fov); await esperar(500); await foto(nombre); };
      // desde el frente (el lado de -z) y desde atrás, y de cerca
      await ver('roto-01-fila-de-empalizadas', { x: L.x, y: 2.2, z: L.z + 14 - 10 }, { x: L.x, y: 1.3, z: L.z + 14 });
      await ver('roto-02-fila-de-portones-y-pircas', { x: L.x, y: 2.2, z: L.z + 22 - 11 }, { x: L.x, y: 1.3, z: L.z + 22 }, 62);
      await ver('roto-03-empalizada-danada-de-cerca', { x: L.x - 0.5, y: 1.6, z: L.z + 14 - 4.2 }, { x: L.x, y: 1.3, z: L.z + 14 }, 52);
      await ver('roto-04-empalizada-rota-de-cerca', { x: L.x + 5.6, y: 1.5, z: L.z + 14 - 4.4 }, { x: L.x + 5, y: 1.2, z: L.z + 14 }, 52);
      await ver('roto-05-porton-roto-de-cerca', { x: L.x - 2.2, y: 1.7, z: L.z + 22 - 5 }, { x: L.x - 2.5, y: 1.4, z: L.z + 22 }, 52);
      await ver('roto-06-pirca-rota-de-cerca', { x: L.x + 7.6, y: 1.5, z: L.z + 22 - 4.2 }, { x: L.x + 7.5, y: 1.0, z: L.z + 22 }, 52);
      await ver('roto-07-rasante', { x: L.x - 9, y: 0.6, z: L.z + 14 - 2.5 }, { x: L.x + 5, y: 0.9, z: L.z + 14 }, 70);
      await ver('roto-08-desde-atras', { x: L.x + 5, y: 1.8, z: L.z + 14 + 5.5 }, { x: L.x + 5, y: 1.2, z: L.z + 14 }, 55);
      await sinPose();
      // reparadas: vuelve a lo normal
      for (const [r] of fila) await vidaA(r.x, r.z, 1);
      await avanzar(1.5, 0);
      const reparadas = await js(`(()=>{const H=${H}, R=H.desafio.defensas49.roto; return H.obras.obras.filter(o=>['empalizada','porton-empalizada','muro-piedra'].includes(o.plano.id)).every(o=>R.estadoDe(o)===0 && o.grupo.children.length===1 && Math.abs(o.malla.matrix.elements[1])+Math.abs(o.malla.matrix.elements[2])+Math.abs(o.malla.matrix.elements[8])<1e-9)})()`);
      ok(reparadas, 'reparadas: sin marcas y derechas');
      await pose({ x: L.x, y: 2.2, z: L.z + 14 - 10 }, { x: L.x, y: 1.3, z: L.z + 14 }, 58); await esperar(500); await foto('roto-09-reparadas'); await sinPose();
      ok(true, `programas de shader: ${prog0} → ${await programas()}`);
      // la geometría que suman las marcas
      const geo = await js(`(()=>{const H=${H}; return H.desafio.defensas49.roto.geometrias})()`);
      console.log('geometrías de marcas en caché:', geo);
    }

    // ================================================================ 2. el pasadizo
    if (ESCENAS.includes('pasadizo')) {
      donde = 'pasadizo';
      await limpiarInvasores();
      const px = L.x - 30, pz = L.z - 36;   // lejos de las obras de arriba
      await estar(px, pz - 8, Math.PI);
      const r = await ponerEn('pasadizo', px, pz, 0);
      ok(r.ok, `el pasadizo se arma (${r.ok ? 'ok' : r.error})`);
      if (r.ok) {
        const bx = r.x, bz = r.z + 9;
        await avanzar(1, 0);
        // las dos bocas, de lejos y de cerca
        await pose({ x: px + 5, y: 2.2, z: pz - 4 }, { x: px, y: 0.4, z: pz }, 55); await esperar(500); await foto('pasadizo-01-boca-de-adentro');
        await pose({ x: px - 5, y: 2.2, z: bz + 4 }, { x: bx, y: 0.5, z: bz }, 55); await esperar(500); await foto('pasadizo-02-boca-de-afuera');
        await pose({ x: px + 14, y: 7, z: pz + 4.5 }, { x: px, y: 0, z: pz + 4.5 }, 50); await esperar(500); await foto('pasadizo-03-las-dos-desde-arriba');
        await sinPose();
        const cuerpo = await js(`(()=>{const H=${H}; return {a: !!H.desafio.obraEnPunto(${px}, H.T.altura(${px},${pz}) + 0.3, ${pz}), b: !!H.desafio.obraEnPunto(${bx}, H.T.altura(${bx},${bz}) + 0.3, ${bz}), defensas: H.progreso.desafio.cuentaDefensas}})()`);
        ok(!cuerpo.a && !cuerpo.b, 'para los duendes y los tiros las bocas no son un cuerpo (no las ven ni las rompen)');
        // caminar de verdad hasta la boca de adentro
        await estar(px, pz - 7, Math.PI);
        const a1 = await caminarHacia(px, pz, 1.9);
        const aviso1 = await aviso();
        ok(a1.recorrio > 3 && /Bajar al pasadizo/.test(aviso1?.texto || ''), `caminando se llega a la boca (recorrió ${a1.recorrio.toFixed(1)} m) y el aviso dice: ${JSON.stringify(aviso1)}`);
        const antes = await pos();
        await tecla('KeyE');
        await cuadros(6, 30);
        const mitad = await pos();
        ok(Math.hypot(mitad.x - antes.x, mitad.z - antes.z) < 0.2, 'mientras baja, queda quieto');
        await cuadros(60, 30);
        await esperar(200);
        const salio = await pos();
        const dB = Math.hypot(salio.x - bx, salio.z - bz);
        ok(dB > 1.6 && dB < 3.8, `sale a ${dB.toFixed(2)} m de la boca de afuera (${salio.x.toFixed(1)}, ${salio.z.toFixed(1)})`);
        ok(await js(`${H}.desafio.defensas49.pasadizo.usando === false`), 'termina la animación');
        // en un lugar libre: la colisión no lo empuja y se puede caminar
        const libre = await js(`(()=>{const H=${H}, p=H.jugador.estado.pos; const q={x:p.x, y:p.y, z:p.z}; H.col.resolver(q, 0.35, 1.65); return Math.hypot(q.x-p.x, q.z-p.z)})()`);
        ok(libre < 0.01, `el lugar de salida está libre (empujón ${libre.toFixed(3)})`);
        await foto('pasadizo-04-sale-por-afuera');
        await js(`(()=>{const js=${H}.jugador.estado; js.pitch = 0; ${H}.jugador.teclas.add('KeyW'); return 1})()`);
        await cuadros(40, 20);
        await js(`${H}.jugador.teclas.delete('KeyW'); 1`);
        const sigue = await pos();
        ok(Math.hypot(sigue.x - salio.x, sigue.z - salio.z) > 2.5, `y camina: no queda encajonado (avanzó ${Math.hypot(sigue.x - salio.x, sigue.z - salio.z).toFixed(1)} m)`);
        // volver: hacia la boca de afuera, E, y se entra a la base
        const a2 = await caminarHacia(bx, bz, 1.9);
        const aviso2 = await aviso();
        ok(/Meterte en el pasadizo/.test(aviso2?.texto || ''), `junto a la boca de afuera: ${JSON.stringify(aviso2)}`);
        await tecla('KeyE');
        await cuadros(60, 30);
        await esperar(200);
        const adentro = await pos();
        const dA = Math.hypot(adentro.x - px, adentro.z - pz);
        ok(dA > 1.6 && dA < 3.8 && adentro.z < pz + 0.5, `vuelve a entrar a la base, a ${dA.toFixed(2)} m de la tapa (${adentro.x.toFixed(1)}, ${adentro.z.toFixed(1)})`);
        await foto('pasadizo-05-vuelve-a-entrar');
        await js(`(()=>{const js=${H}.jugador.estado; js.pitch = 0; ${H}.jugador.teclas.add('KeyW'); return 1})()`);
        await cuadros(40, 20);
        await js(`${H}.jugador.teclas.delete('KeyW'); 1`);
        const sigue2 = await pos();
        ok(Math.hypot(sigue2.x - adentro.x, sigue2.z - adentro.z) > 2.5, 'y camina por adentro sin quedar encajonado');
        // los duendes no lo usan: uno que va por vos pasa de largo
        const dup = await js(`(()=>{const H=${H}; const a = H.desafio.invocar('rastreador', ${px}, ${pz} + 4); return a ? 1 : 0})()`);
        await avanzar(3, 1);
        const sinCambios = await js(`(()=>{const H=${H}; return H.obras.obras.filter(o=>o.plano.id==='pasadizo').length === 1 && (H.obras.obras.find(o=>o.plano.id==='pasadizo').datos.vida === undefined || H.obras.obras.find(o=>o.plano.id==='pasadizo').datos.vida >= 400)})()`);
        ok(sinCambios, 'los duendes no atacan el pasadizo');
        await limpiarInvasores();
      }
    }

    // ================================================================ 3. la trampa de miel
    if (ESCENAS.includes('miel')) {
      donde = 'miel';
      await limpiarInvasores();
      const mx = L.x + 30, mz = L.z - 30;
      await js(`(()=>{const H=${H}; H.progreso.desafio.miel = 3; Object.assign(H.progreso.materiales, {tabla: 50}); return 1})()`);
      const c = await js(`(()=>{const r = ${H}.desafio.colocarTrampaMiel(${mx}, ${mz}); return {ok: r.ok, motivo: r.motivo, usos: r.obra && r.obra.datos.usos}})()`);
      ok(c.ok && c.usos === 5, `colocarTrampaMiel(x, z): la trampa queda armada y llena (${JSON.stringify(c)})`);
      const gasto = await js(`({miel: ${H}.progreso.desafio.miel, tabla: ${H}.progreso.materiales.tabla})`);
      ok(gasto.miel === 2 && gasto.tabla === 48, `gastó un frasco y dos tablas (${JSON.stringify(gasto)})`);
      await avanzar(1, 1);
      await js(`(()=>{const H=${H}; H.progreso.horas = 22; return 1})()`);
      await pose({ x: mx + 4.5, y: 1.7, z: mz - 3.5 }, { x: mx, y: 0.1, z: mz }, 55); await esperar(500); await foto('miel-01-trampa-llena');
      await sinPose();
      // tres duendes cruzan la trampa de camino a vos
      await estar(mx, mz + 14, 0);
      const ids = [];
      for (let i = 0; i < 3; i++) ids.push(await js(`(()=>{const H=${H}; const a = H.desafio.invocar('rastreador', ${mx} + ${(i - 1) * 0.8}, ${mz} - ${7 + i * 2.4}); if (!a) return -1; a.estado = 'avanzar'; a.t = 9; window.__ali = window.__ali || []; window.__ali.push(a); return window.__ali.length - 1})()`));
      ok(ids.every((i) => i >= 0), 'aparecen tres duendes del otro lado de la trampa');
      let pegados = 0, maximo = 0, quietoSeg = 0, fotoPegado = false;
      for (let t = 0; t < 14; t += 0.25) {
        await avanzar(0.25, 1);
        const s = await js(`(()=>{const L = window.__ali || []; return L.map(a => ({x:a.m.g.position.x, z:a.m.g.position.z, p:a.pegadoT||0, vida:a.vida}))})()`);
        const n = s.filter((a) => a.p > 0).length;
        if (n > 0) quietoSeg += 0.25;
        maximo = Math.max(maximo, n);
        if (n >= 1 && !fotoPegado) { fotoPegado = true; const a = s.find((q) => q.p > 0); await pose({ x: mx + 4, y: 1.5, z: mz - 3.2 }, { x: a.x, y: 0.7, z: a.z }, 52); await esperar(400); await foto('miel-02-duende-pegado'); await sinPose(); }
      }
      const usosTras = await js(`${H}.obras.obras.find(o=>o.plano.id==='trampa-miel').datos.usos`);
      ok(maximo >= 1 && quietoSeg >= 2.5, `los duendes quedaron pegados (hasta ${maximo} a la vez, ~${quietoSeg} s con alguno pegado)`);
      ok(usosTras <= 5 - maximo, `la trampa gastó usos (${usosTras} de 5)`);
      // se agota con más duendes
      for (let i = 0; i < 6; i++) { await js(`${H}.desafio.invocar('rastreador', ${mx} + ${(i % 3) * 0.6 - 0.6}, ${mz} - 0.5 - ${i * 0.1}); 1`); await avanzar(0.3, 1); }
      await avanzar(5, 1);
      const seca = await js(`${H}.obras.obras.find(o=>o.plano.id==='trampa-miel').datos.usos`);
      ok(seca === 0, `con más duendes se seca (${seca})`);
      await limpiarInvasores();
      await pose({ x: mx + 4.5, y: 1.7, z: mz - 3.5 }, { x: mx, y: 0.1, z: mz }, 55); await esperar(500); await foto('miel-03-trampa-seca');
      await sinPose();
      // E la repone: el aviso real
      await estar(mx + 1.8, mz - 0.5, Math.PI / 2);
      const av = await aviso();
      ok(/Echar miel/.test(av?.texto || ''), `junto a la trampa seca el aviso dice: ${JSON.stringify(av)}`);
      await tecla('KeyE'); await cuadros(3, 30);
      const llena = await js(`({usos: ${H}.obras.obras.find(o=>o.plano.id==='trampa-miel').datos.usos, miel: ${H}.progreso.desafio.miel})`);
      ok(llena.usos === 5 && llena.miel === 1, `E la deja llena y gasta un frasco (${JSON.stringify(llena)})`);
      // el taller: la receta que gasta miel
      const rec = await js(`(()=>{const H=${H}; const d = H.progreso.desafio; d.miel = 2; H.obras.obras.find(o=>o.plano.id==='trampa-miel').datos.usos = 1; H.desafio.abrirTaller(true); const cats = document.querySelectorAll('#taller-categorias button'); for (const b of cats) if (/Base/.test(b.textContent)) b.dispatchEvent(new MouseEvent('mousedown', {bubbles:true})); const li = [...document.querySelectorAll('#taller-lista li')].map(l => l.textContent); H.desafio.abrirTaller(false); return li.filter(t => /miel/i.test(t))})()`);
      ok(rec.length >= 1, `el taller (Base) ofrece echar miel: ${JSON.stringify(rec)}`);
      // la guardada: recargar la partida con la trampa
      const guardada = await js(`(()=>{const H=${H}; const o = H.obras.obras.find(q=>q.plano.id==='trampa-miel'); const d = JSON.parse(JSON.stringify(o.datos)); return d})()`);
      ok(guardada.usos === 1 && guardada.plano === 'trampa-miel', `el estado de la trampa viaja en la obra (${JSON.stringify(guardada)})`);
    }

    // ================================================================ 4. el farol de mano
    if (ESCENAS.includes('farol')) {
      donde = 'farol';
      await limpiarInvasores();
      const fx = L.x - 20, fz = L.z + 35;
      await estar(fx, fz, 0);
      await js(`(()=>{const H=${H}; H.progreso.cosas.farolMano = 1; H.progreso.horas = 22.2; H.clima.estado.lluvia = 0; return 1})()`);
      await avanzar(1, 1);
      await foto('farol-01-sin-farol');
      const pA = await programas();
      const ant = await js(`({ int: ${H}.linterna.intensity, col: ${H}.linterna.color.getHexString(), dist: ${H}.linterna.distance })`);
      await js(`${H}.desafio.alternarFarol(); 1`);
      await avanzar(1, 1);
      const luz = await js(`({ int: ${H}.linterna.intensity, col: ${H}.linterna.color.getHexString(), dist: ${H}.linterna.distance, ang: ${H}.linterna.angle, prendido: ${H}.desafio.farolPrendido })`);
      ok(luz.prendido && luz.col === 'ffb25a' && luz.dist < ant.dist + 1 && luz.int > 20, `el farol prende la luz de la linterna en ámbar (${JSON.stringify(luz)})`);
      await foto('farol-02-en-la-mano');
      await js(`(()=>{const H=${H}, js=H.jugador.estado; js.yaw += 0.9; js.pitch = -0.1; return 1})()`);
      await foto('farol-03-alrededor');
      await js(`${H}.jugador.estado.yaw -= 0.9; ${H}.jugador.estado.pitch = 0; 1`);
      const pB = await programas();
      ok(pB === pA, `prender el farol no compila programas nuevos (${pA} → ${pB})`);
      // un viejo oscuro (el bruto) viene por vos: no se acerca a menos de ~5 m
      await js(`${H}.progreso.desafio.oleadas = 6; 1`);
      await js(`(()=>{const H=${H}; const a = H.desafio.invocar('bruto', ${fx}, ${fz} - 16); if (!a) return 0; a.estado = 'avanzar'; a.t = 9; window.__bruto = a; return 1})()`);
      let minCon = 99, enAtaque = 0;
      for (let t = 0; t < 18; t += 0.25) {
        await avanzar(0.25, 1);
        const d = await js(`(()=>{const a = window.__bruto, p = ${H}.jugador.estado.pos; return Math.hypot(a.m.g.position.x - p.x, a.m.g.position.z - p.z)})()`);
        if (t > 4) minCon = Math.min(minCon, d);
      }
      ok(minCon > 4.2, `con el farol prendido el viejo no se acerca a menos de ${minCon.toFixed(1)} m (el radio es 5,5)`);
      await foto('farol-04-el-viejo-se-queda-lejos');
      await js(`${H}.desafio.alternarFarol(); 1`);
      await avanzar(0.5, 1);
      ok(!(await js(`${H}.desafio.farolPrendido`)) && (await js(`${H}.linterna.intensity`)) === 0, 'al apagarlo, la linterna vuelve a lo de siempre (apagada)');
      let minSin = 99;
      for (let t = 0; t < 14; t += 0.25) {
        await avanzar(0.25, 1);
        const d = await js(`(()=>{const a = window.__bruto, p = ${H}.jugador.estado.pos; return Math.hypot(a.m.g.position.x - p.x, a.m.g.position.z - p.z)})()`);
        minSin = Math.min(minSin, d);
      }
      ok(minSin < 3, `sin el farol llega hasta ${minSin.toFixed(1)} m`);
      await limpiarInvasores();
      // la lluvia lo apaga
      await js(`(()=>{const H=${H}; H.desafio.alternarFarol(); H.clima.estado.lluvia = 0.9; return 1})()`);
      await avanzar(0.5, 1);
      ok(!(await js(`${H}.desafio.farolPrendido`)), 'la lluvia fuerte apaga el farol');
      await js(`${H}.clima.estado.lluvia = 0; 1`);
      // la barra
      const nombres = await js(`(()=>{const H=${H}; const out=[]; for (let i=1;i<=9;i++) { document.dispatchEvent(new KeyboardEvent('keydown',{code:'Digit'+i,bubbles:true})); out.push(H.__ranuraActual()); } return out})()`);
      console.log('barra:', JSON.stringify(nombres));
      ok(nombres.some((n) => /Farol de mano/.test(n)), 'el farol de mano está en la barra');
    }

    // ================================================================ 5. la pala de brasas
    if (ESCENAS.includes('brasas')) {
      donde = 'brasas';
      await limpiarInvasores();
      const bx = L.x + 25, bz = L.z + 40;
      await estar(bx, bz, Math.PI);
      await js(`(()=>{const H=${H}; H.progreso.cosas.pala = 1; H.progreso.desafio.brasas = 0; H.progreso.horas = 22.2; H.progreso.desafio.salud = 100; return 1})()`);
      // un fogón prendido al lado
      const fg = await ponerEn('fogon', bx - 1.8, bz + 0.5, 0);
      ok(fg.ok, `el fogón se arma (${fg.ok ? 'ok' : fg.error})`);
      await js(`(()=>{const H=${H}, f=H.obras.obras.find(o=>o.plano.id==='fogon'); H.clima.encenderFogata(f.datos.x, f.datos.y, f.datos.z, 900); return 1})()`);
      await avanzar(1, 1);
      // la pala en la mano (por la barra)
      const nombres = await js(`(()=>{const H=${H}; const out=[]; for (let i=1;i<=9;i++) { document.dispatchEvent(new KeyboardEvent('keydown',{code:'Digit'+i,bubbles:true})); const n = H.__ranuraActual(); out.push(n); if (/Pala de brasas/.test(n)) break; } return out})()`);
      ok(nombres.some((n) => /Pala de brasas/.test(n)), `la pala está en la barra (${JSON.stringify(nombres)})`);
      // sin brasas, el clic avisa
      const sin = await js(`(()=>{const H=${H}; H.desafio.atacar('pala'); return H.progreso.desafio.brasas})()`);
      ok(sin === 0, 'sin brasas no tira nada');
      // cargar con E junto al fogón
      await estar(bx - 0.4, bz + 0.5, Math.PI / 2);
      const av = await aviso();
      ok(/Cargar la pala/.test(av?.texto || ''), `el aviso junto al fogón: ${JSON.stringify(av)}`);
      await tecla('KeyE'); await cuadros(3, 30);
      const carga = await js(`${H}.progreso.desafio.brasas`);
      ok(carga === 6, `E carga la pala (${carga} de 6)`);
      await foto('brasas-01-pala-en-la-mano');
      // la miel y los duendes adelante
      await estar(bx, bz, Math.PI);
      const t = await js(`(()=>{const r = ${H}.desafio.colocarTrampaMiel(${bx}, ${bz} - 7.5, { gratis: true }); return {ok: r.ok, motivo: r.motivo}})()`);
      ok(t.ok, `una trampa de miel a 7,5 m (${JSON.stringify(t)})`);
      await js(`(()=>{const H=${H}; window.__gr = []; for (const [dx, dz] of [[-2.2, -6], [2.2, -7], [0.3, -9.5]]) { const a = H.desafio.invocar('rastreador', ${bx} + dx, ${bz} + dz); if (a) { a.estado = 'avanzar'; a.t = 9; a.cd = 99; window.__gr.push(a); } } return window.__gr.length})()`);
      await js(`(()=>{const js=${H}.jugador.estado; js.yaw = 0; js.pitch = -0.1; return 1})()`);   // yaw 0: mira hacia -z
      const progs = await programas();
      await js(`(()=>{const H=${H}; H.desafio.atacar('pala'); return 1})()`);
      await avanzar(0.18, 1);
      await foto('brasas-02-el-abanico-en-el-aire');
      await avanzar(0.6, 1);
      const r = await js(`(()=>{const H=${H}; const miel = H.obras.obras.find(o=>o.plano.id==='trampa-miel').datos; return { brasas: H.progreso.desafio.brasas, prendida: miel.prendida, ahuy: (window.__gr||[]).map(a=>+(a.ahuyentadoT||0).toFixed(2)), vidas: (window.__gr||[]).map(a=>Math.round(a.vida)) }})()`);
      console.log('abanico:', JSON.stringify(r));
      ok(r.brasas === 5, `gastó una carga (${r.brasas})`);
      ok(r.ahuy.filter((x) => x > 0).length >= 2, `los del abanico dudan (${JSON.stringify(r.ahuy)})`);
      ok(r.vidas.some((v) => v < 100), `y se llevan daño chico (${JSON.stringify(r.vidas)})`);
      await avanzar(0.8, 1);
      const prendida = await js(`${H}.obras.obras.find(o=>o.plano.id==='trampa-miel').datos.prendida`);
      ok(prendida > 0 || (await js(`${H}.obras.obras.find(o=>o.plano.id==='trampa-miel').datos.usos`)) === 0, `una brasa prendió la miel (${prendida.toFixed ? prendida.toFixed(1) : prendida})`);
      await foto('brasas-03-despues-del-abanico');
      await avanzar(1.2, 1);
      await foto('brasas-04-la-miel-arde');
      const pF = await programas();
      ok(pF === progs, `la pala y el abanico no compilan programas nuevos (${progs} → ${pF})`);
      // un segundo abanico: los que retroceden se ven yendo para atrás
      await js(`(()=>{const H=${H}; H.desafio.recarga = 0; H.desafio.atacar('pala'); return 1})()`).catch(() => {});
      await avanzar(0.4, 1);
      await foto('brasas-05-retroceden');
      await limpiarInvasores();
    }

    donde = 'cierre';
    const fin = await programas();
    console.log(`programas de shader: al empezar ${prog0}, al terminar ${fin}`);
    console.log(errores.length ? `con ${errores.length} problemas` : 'sin problemas');
    fs.writeFileSync(path.join(salida, `${etiqueta}humo-informe.txt`), pasos.join('\n') + '\n' + (errores.length ? 'PROBLEMAS:\n' + errores.join('\n') : 'sin problemas') + '\n');
  } catch (e) {
    console.log('FALLÓ en', donde, String(e && e.stack || e).slice(0, 700));
    errores.push(String(e));
  }
  app.exit(errores.length ? 1 : 0);
});

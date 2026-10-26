// 4.10 base — partida real (Electron + WebGL) de «Volver a jugar», tanda de la base:
//   1. las defensas que se curten: siete noches de verdad (cae la noche, golpes, sale el sol), la placa de cada nivel, la pantalla de la base;
//   2. los trofeos: los mandamases de verdad, el tablero, los siete colgados, los bonos, la E caminando, el tablero que cae;
//   3. el perro: la mordida y el gruñido por la misma cuenta del juego, en sus cuatro niveles;
//   4. guardar y recargar, y una partida vieja (sin nada de esto).
// Capturas a tamaño completo en pruebas/salidas/base-4-10/ (con -Visible: oculta, capturePage devuelve un cuadro viejo).
// Uso (PowerShell): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-10-base.cjs -Espera 900 -Perfil <carpeta> [-Visible]
//   HUMO_ESCENAS=curtido,trofeos,perro,guardado (por defecto todas) · HUMO_INDEX=<index.html> · HUMO_SALIDA=<carpeta> · HUMO_ETIQUETA=<prefijo>
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(__dirname, 'salidas', 'base-4-10'));
const etiqueta = process.env.HUMO_ETIQUETA ? process.env.HUMO_ETIQUETA + '-' : '';
fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const ESCENAS = (process.env.HUMO_ESCENAS || 'curtido,trofeos,perro,guardado').split(',');

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
  // avanza `seg` segundos del Desafío a mano (pasos de 0,05 s); la noche (0 a 1) se fija con `noche`
  const avanzar = (seg, noche = 1) => js(`(()=>{const H=${H}; for (let i = 0; i < ${Math.round(seg / 0.05)}; i++) { H.progreso.desafio.salud = Math.max(H.progreso.desafio.salud, 90); H.desafio.actualizar(0.05, { noche: ${noche}, dtReal: 0.05 }); } return 1})()`, 120000);
  // (las alturas de `o` y `a` son sobre el terreno de cada punto)
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
  const sinPose = () => js(`window.__poseD = null; 1`);
  const estar = (x, z, yaw = 0) => js(`(()=>{const H=${H}, js=H.jugador.estado; js.pos.set(${x}, H.T.altura(${x},${z}), ${z}); js.vel.set(0,0,0); js.yaw=${yaw}; js.pitch=0; return 1})()`);
  // un lugar llano y SECO en 30 m a la redonda (el agua y las pendientes dan fotos de un lago o de un cerro)
  const llano = () => js(`(()=>{const H=${H}, T=H.T, r=T.lugares.refugio; let mejor=null;
    for (let a=0;a<36;a++) for (const d of [30,45,60,80,100]) { const x=r.x+Math.cos(a/36*6.283)*d, z=r.z+Math.sin(a/36*6.283)*d, y=T.altura(x,z); if (T.agua(x,z)) continue;
      let des=0, mojado=false; for (let k=0;k<12 && !mojado;k++) for (const e of [6,12,18,26,34]) { const qx=x+Math.cos(k/12*6.283)*e, qz=z+Math.sin(k/12*6.283)*e; if (T.agua(qx,qz)) { mojado=true; break; } des=Math.max(des,Math.abs(T.altura(qx,qz)-y)); }
      if (mojado) continue;
      const pts = -des; if (!mejor || pts>mejor.pts) mejor={x,z,pts,des}; }
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
  const vidaA = (x, z, f) => js(`(()=>{const H=${H}; const o=H.obras.obras.find(q=>Math.hypot(q.datos.x-(${x}), q.datos.z-(${z}))<0.05); if(!o) return null; const max=Number.isFinite(o.plano.vida)?o.plano.vida:100; o.datos.vida=max*${f}; return {id:o.plano.id, vida:o.datos.vida}})()`);
  // un lugar para poner la cámara a ~`r` m de (cx, cz): libre de troncos y rocas en un metro a la redonda y en seco
  const sitioLibre = (cx, cz, r, desde = 0) => js(`(()=>{const H=${H}; for (const d of [${r}, ${r} + 1.2, ${r} - 1]) for (let k=0;k<16;k++){ const a=${desde}+k/16*6.283, x=(${cx})+Math.cos(a)*d, z=(${cz})+Math.sin(a)*d; if (H.T.agua(x,z)) continue; const q={x,y:H.T.altura(x,z),z}; H.col.resolver(q,1.0,1.9); if (Math.hypot(q.x-x,q.z-z)<0.01) return {x,z}; } return {x:(${cx})+${r},z:${cz}}})()`);
  // (diagnóstico) los programas nuevos desde la última vez: su nombre y un pedazo de la clave
  const programasNuevos = () => js(`(()=>{const ps = ${H}.renderer.info.programs; const vistos = window.__pv || (window.__pv = new Set()); const nuevos = []; for (const p of ps) { const k = p.name + '|' + String(p.cacheKey).slice(0, 90); if (!vistos.has(k)) { vistos.add(k); nuevos.push(k); } } return nuevos})()`);
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
  // una foto con el juego congelado (la ventana está a la vista y el juego sigue corriendo mientras se captura: así nada se mueve)
  const fotoQuieta = async (nombre) => { await js(`try { ${H}.abrir('pausa'); } catch {} 1`); await esperar(200); const r = await foto(nombre, false, true); await js(`try { ${H}.volverAlJuego(); } catch {} 1`); return r; };

  // ---- lo propio de la base (4.10)
  // una foto con la cámara en `o` mirando a `a`; si en `o` hay un tronco o una roca (la cámara quedaría adentro o tapada), se corre girando
  // alrededor de lo que se mira, de a poco, hasta un lugar libre
  const verLibre = async (nombre, o, a, fov = 55) => {
    const p = await js(`(()=>{const H=${H}, o=${JSON.stringify(o)}, a=${JSON.stringify(a)}; const vx=o.x-a.x, vz=o.z-a.z;
      for (const g of [0, 0.2, -0.2, 0.4, -0.4, 0.65, -0.65, 0.9, -0.9]) for (const k of [1, 0.85, 1.15]) {
        const c=Math.cos(g), s=Math.sin(g), x=a.x+(vx*c-vz*s)*k, z=a.z+(vx*s+vz*c)*k;
        if (H.T.agua(x,z)) continue; const q={x,y:H.T.altura(x,z),z}; H.col.resolver(q,0.9,1.8);
        // y sin un tronco o una roca a menos de 2,6 m (con las ramas adelante no se ve nada)
        let tapa = false; for (const c of H.col.cercanos(x, z)) { if (c.duenio || c.seg) continue; if (Math.hypot(c.x - x, c.z - z) < (c.r || 0.5) + 2.6) { tapa = true; break; } }
        if (!tapa && Math.hypot(q.x-x,q.z-z)<0.01) return {x, y:o.y, z, giro:g}; }
      return {x:o.x, y:o.y, z:o.z, giro:null}})()`);
    if (p.giro) console.log('  (' + nombre + ': la cámara se corrió ' + p.giro + ' rad para no quedar adentro de algo)');
    await pose({ x: p.x, y: p.y, z: p.z }, a, fov); await esperar(500); await foto(nombre);
  };
  const D = (expr) => js(`(()=>{const H=${H}, D=H.progreso.desafio; return JSON.stringify(${expr})})()`).then((t) => JSON.parse(t));
  const obraEn = (x, z) => js(`(()=>{const H=${H}; const o=H.obras.obras.find(q=>Math.hypot(q.datos.x-(${x}), q.datos.z-(${z}))<0.05); return o ? JSON.stringify({ id: o.plano.id, nivel: H.desafio.baseCrece.nivelDe(o), curt: o.datos.curt || null, hijos: o.grupo.children.length, nombre: H.desafio.baseCrece.nombreDe(o), vida: o.datos.vida }) : null})()`).then((t) => (t ? JSON.parse(t) : null));
  // una noche de verdad: cae la noche (nace la oleada), `golpear` son las obras (x, z, daño) que reciben un golpe, y sale el sol (amanece)
  const unaNoche = async (n, golpear = [], directos = []) => {
    await js(`(()=>{const H=${H}, P=H.progreso; P.dia = ${n + 1}; P.horas = 21; return 1})()`);
    await avanzar(0.3, 1);
    const hubo = await D('D.oleadas');
    for (const [x, z, dano] of golpear) await js(`(()=>{const H=${H}; const o=H.obras.obras.find(q=>Math.hypot(q.datos.x-(${x}), q.datos.z-(${z}))<0.05); if (o) H.desafio.danarObra(o, ${dano}); return 1})()`);
    for (const [x, z] of directos) await js(`(()=>{const H=${H}; const o=H.obras.obras.find(q=>Math.hypot(q.datos.x-(${x}), q.datos.z-(${z}))<0.05); if (o) H.desafio.baseCrece.participo(o); return 1})()`);
    await js(`(()=>{const H=${H}, P=H.progreso; P.horas = 6.2; return 1})()`);
    await avanzar(0.3, 0);
    await limpiarInvasores();
    return hubo;
  };
  const nombres = async () => (await js(`JSON.stringify(Array.from(document.querySelectorAll('.nota, #nota, #notas, [class*=nota]')).map(e=>e.textContent).join(' | ').slice(0, 600))`).then((t) => JSON.parse(t)));

  try {
    donde = 'carga';
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'alta', clima:'despejado', musica:true, modo:'desafio', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre', estacion:'verano'})); 1`);
    ok(await cargar(), 'el Desafío carga');
    await entrar();
    await js(`window.addEventListener('error', (e) => { console.error('PILA ' + String(e.error && e.error.stack).slice(0, 600)); }); 1`);
    await js(`(()=>{const H=${H}; H.progreso.desafio.tutorial = 99; H.ajustes.estacion='verano'; if (H.pasto?.malla) H.pasto.malla.visible = true;
      if (!window.__cura) window.__cura = setInterval(() => { try { H.progreso.desafio.salud = Math.max(H.progreso.desafio.salud, 90); } catch {} }, 400); return 1})()`);
    ok(await js(`!!(${H}.desafio && ${H}.desafio.baseCrece && ${H}.desafio.baseCrece.resumen)`), 'el Desafío trae lo de la base crece (baseCrece)');
    await avanzar(0.3, 0);
    const prog0 = await programas();
    const L = await llano();
    await estar(L.x, L.z, 0);
    await js(`(()=>{const H=${H}; H.progreso.horas = 14; H.clima.estado.lluvia = 0; H.clima.estado.nublado = 0.05; return 1})()`);
    ok(await js(`${H}.desafio.baseCrece.nivelPerro() === 0`), 'el perro empieza sin curtir');

    // ================================================================ 1. las defensas que se curten (siete noches de verdad)
    if (ESCENAS.includes('curtido')) {
      donde = 'curtido';
      // dos empalizadas, un muro de pirca, un portón, la ballesta y una trampa de lazo (que no se curte)
      const pos0 = [['empalizada', -6, 0], ['empalizada', -1, 0], ['muro-piedra', 4, 0], ['porton-empalizada', 9, 0], ['ballesta-fija', 14, 0], ['trampa-lazo', 18, 0]];
      const puestas = [];
      for (const [id, dx, dz] of pos0) puestas.push(await ponerEn(id, L.x + dx, L.z + 14 + dz, 0));
      ok(puestas.every((r) => r.ok), `seis obras armadas (${puestas.map((r) => r.ok ? 'ok' : r.error).join(', ')})`);
      const [A, B, M, P, Ba, Lz] = puestas;
      // antes: ninguna lleva placa
      await avanzar(1.2, 0);
      ok((await obraEn(A.x, A.z)).hijos === 1 && (await obraEn(M.x, M.z)).nivel === 0, 'al principio ninguna lleva placa');
      await pose({ x: L.x + 6, y: 2.4, z: L.z + 14 - 12 }, { x: L.x + 6, y: 1.2, z: L.z + 14 }, 62); await esperar(500); await foto('curtido-01-antes');
      await sinPose();
      const niveles = [];
      for (let n = 1; n <= 7; n++) {
        // A recibe un golpe cada noche; el muro, las noches pares; el portón y la ballesta participan (la ballesta sólo la mitad de las noches); B y el lazo, nunca
        const golpear = [[A.x, A.z, 4]];
        if (n % 2 === 0) golpear.push([M.x, M.z, 4]);
        const directos = [[Ba.x, Ba.z]];
        if (n % 3 === 0) directos.push([P.x, P.z]);
        const hubo = await unaNoche(n, golpear, directos);
        const a = await obraEn(A.x, A.z), m = await obraEn(M.x, M.z), b = await obraEn(B.x, B.z), ba = await obraEn(Ba.x, Ba.z), p = await obraEn(P.x, P.z), lz = await obraEn(Lz.x, Lz.z);
        niveles.push([n, hubo, a.nivel, m.nivel, ba.nivel, p.nivel, b.nivel, lz.nivel]);
        if (n === 2) {
          ok(a.nivel === 1 && /curtid[ao] · nivel 1/.test(a.nombre), `la noche 2: la empalizada golpeada sube al nivel 1 («${a.nombre}»)`);
          await avanzar(1.2, 0);
          await pose({ x: L.x - 6 - 1.4, y: 1.7, z: L.z + 14 - 3.6 }, { x: L.x - 6, y: 1.5, z: L.z + 14 }, 50); await esperar(500); await foto('curtido-02-placa-nivel-1');
          await sinPose();
        }
      }
      console.log('noche · oleadas · A · muro · ballesta · portón · B · lazo :', JSON.stringify(niveles));
      const fin = niveles[niveles.length - 1];
      ok(niveles.every(([n, hubo]) => hubo === n), 'cada noche fue una noche de verdad (D.oleadas 1 a 7)');
      ok(fin[2] === 3, `la empalizada que recibió un golpe cada noche está en el nivel 3 (${fin[2]})`);
      ok(fin[3] === 1, `el muro, que recibió golpes la mitad de las noches, está en el nivel 1 (${fin[3]})`);
      ok(fin[4] === 3, `la ballesta que participó siempre llegó al nivel 3 (${fin[4]})`);
      ok(fin[5] === 1, `el portón que participó cada tercera noche, nivel 1 (${fin[5]})`);
      ok(fin[6] === 0 && fin[7] === 0, 'la empalizada sin golpes y la trampa de lazo, nivel 0');
      // las placas
      await avanzar(1.2, 0);
      const hijos = await js(`JSON.stringify(${H}.obras.obras.map(o=>[o.plano.id, o.grupo.children.length]))`).then((t) => JSON.parse(t));
      console.log('hijos por obra:', JSON.stringify(hijos));
      ok(hijos.filter(([, h]) => h === 2).length === 4 && hijos.filter(([, h]) => h === 1).length === 2, 'cuatro obras con su placa, dos sin ella');
      const resumen = await js(`JSON.stringify(${H}.desafio.baseCrece.resumen())`).then((t) => JSON.parse(t));
      ok(resumen.curtidas === 4 && resumen.defensas[3] === 2 && resumen.defensas[1] === 2, `el resumen de la base cuenta 4 curtidas (${JSON.stringify(resumen.defensas)})`);
      ok(resumen.perro.nivel === 2, `el perro, con siete noches a tu lado, está en el nivel 2 (nivel ${resumen.perro.nivel}, ${resumen.perro.texto})`);
      ok(await js(`${H}.progreso.desafio.crece.perro.noches === 7`), 'el perro contó las siete noches');
      const bonoRep = await js(`${H}.progreso.desafio.bonos.origen.defensa?.reparar || 0`);
      ok(bonoRep > 0 && bonoRep <= 0.1, `las defensas curtidas dan un poco de reparar (${bonoRep})`);
      // de día y con el cielo asentado, para las fotos
      await js(`(()=>{const H=${H}, P=H.progreso; P.horas = 13; P.dia = 20; H.clima.estado.lluvia = 0; return 1})()`);
      await esperar(2500);
      // vista general y de cerca, desde el frente y desde atrás
      const cy = L.z + 14;
      const ver = verLibre;
      await ver('curtido-03-la-fila-a-las-siete-noches', { x: L.x + 6, y: 2.6, z: cy - 14 }, { x: L.x + 6, y: 1.3, z: cy }, 66);
      await ver('curtido-04-empalizada-nivel-3-de-frente', { x: L.x - 6 - 0.9, y: 1.7, z: cy - 3.8 }, { x: L.x - 6, y: 1.5, z: cy }, 48);
      await ver('curtido-05-empalizada-nivel-3-desde-atras', { x: L.x - 6 + 0.9, y: 1.7, z: cy + 3.8 }, { x: L.x - 6, y: 1.5, z: cy }, 48);
      await ver('curtido-06-muro-nivel-1', { x: L.x + 4 - 0.8, y: 1.6, z: cy - 3.8 }, { x: L.x + 4, y: 1.3, z: cy }, 48);
      await ver('curtido-07-ballesta-nivel-3', { x: L.x + 14 - 2.5, y: 1.9, z: cy - 4.5 }, { x: L.x + 14, y: 1.5, z: cy }, 52);
      await ver('curtido-07b-ballesta-desde-atras', { x: L.x + 14 + 2.2, y: 1.9, z: cy + 4.2 }, { x: L.x + 14, y: 1.3, z: cy }, 52);
      await ver('curtido-07c-ballesta-de-costado', { x: L.x + 14 + 4.5, y: 1.4, z: cy - 0.5 }, { x: L.x + 14, y: 1.2, z: cy }, 50);
      await ver('curtido-08-sin-placa-y-con-placa', { x: L.x - 3.5, y: 1.6, z: cy - 5 }, { x: L.x - 3.5, y: 1.4, z: cy }, 58);
      await ver('curtido-09-rasante', { x: L.x - 14, y: 0.6, z: cy - 2.4 }, { x: L.x + 4, y: 1.0, z: cy }, 70);
      await ver('curtido-10-desde-arriba', { x: L.x + 4, y: 14, z: cy - 9 }, { x: L.x + 4, y: 0, z: cy }, 55);
      // el costo: llamadas de dibujo con y sin las placas (la misma vista) y lo que tarda el cuadro de la base
      await pose({ x: L.x + 4, y: 2.4, z: cy - 12 }, { x: L.x + 4, y: 1.2, z: cy }, 62); await esperar(400);
      const costo = await js(`(()=>{const H=${H}, B=H.desafio.baseCrece, R=H.renderer;
        const mirar = () => { H.__bucle(); H.__bucle(); return { calls: R.info.render.calls, tris: R.info.render.triangles }; };
        const con = mirar(); B.mejoras.limpiar(); const sin = mirar(); B.mejoras.actualizar(2); const otra = mirar();
        const t0 = performance.now(); for (let i = 0; i < 3000; i++) B.actualizar(0.016); const us = (performance.now() - t0) / 3000 * 1000;
        return { con, sin, otra, usPorCuadro: us, placas: H.obras.obras.filter(o => o.userCurtido).length }})()`);
      console.log('costo de la base que crece:', JSON.stringify(costo));
      ok(costo.con.calls - costo.sin.calls <= costo.placas && costo.otra.calls === costo.con.calls, `las placas suman a lo sumo una llamada de dibujo cada una (${costo.sin.calls} → ${costo.con.calls} con ${costo.placas} placas)`);
      ok(costo.con.tris - costo.sin.tris < 3000, `y pocos triángulos (+${costo.con.tris - costo.sin.tris})`);
      ok(costo.usPorCuadro < 50, `el cuadro de la base cuesta ${costo.usPorCuadro.toFixed(2)} µs`);
      await sinPose();
      // la pantalla de la base (N) con los niveles
      await tecla('KeyN');
      await esperar(600);
      const panel = await js(`(document.getElementById('base-contenido')?.textContent || '').slice(0, 900)`);
      ok(await js(`!document.getElementById('base').classList.contains('oculto')`), 'N abre la pantalla de la base');
      console.log('pantalla de la base:', JSON.stringify(panel));
      ok(/curtid[ao] · nivel 3/.test(panel), 'la pantalla de la base muestra «curtida · nivel 3»');
      ok(/La base crece/.test(panel) && /Defensas curtidas: 4/.test(panel) && /El perro está/.test(panel), 'y cuenta lo que creció (defensas curtidas, el perro)');
      await foto('curtido-11-pantalla-de-la-base', true, true);
      await tecla('KeyN');
      await js(`try { ${H}.volverAlJuego(); } catch {} 1`);
      ok(true, `programas de shader: ${prog0} → ${await programas()}`);
      // un golpe fuerte: la curtida recibe menos daño que la sin curtir (misma empalizada, mismo golpe)
      const vidaA0 = await obraEn(A.x, A.z), vidaB0 = await obraEn(B.x, B.z);
      await js(`(()=>{const H=${H}; for (const [x,z] of [[${A.x},${A.z}],[${B.x},${B.z}]]) { const o=H.obras.obras.find(q=>Math.hypot(q.datos.x-x, q.datos.z-z)<0.05); o.datos.vida = o.plano.vida; H.desafio.danarObra(o, 100); } return 1})()`);
      const vidaA1 = await obraEn(A.x, A.z), vidaB1 = await obraEn(B.x, B.z);
      const perdidaA = vidaA0.vida >= 0 ? (await js(`${H}.obras.obras.find(q=>Math.hypot(q.datos.x-(${A.x}), q.datos.z-(${A.z}))<0.05).plano.vida`)) - vidaA1.vida : 0;
      const perdidaB = (await js(`${H}.obras.obras.find(q=>Math.hypot(q.datos.x-(${B.x}), q.datos.z-(${B.z}))<0.05).plano.vida`)) - vidaB1.vida;
      ok(perdidaB > 0 && Math.abs(perdidaA / perdidaB - 0.7) < 0.02, `el mismo golpe de 100: la nivel 3 pierde ${perdidaA.toFixed(1)}, la común ${perdidaB.toFixed(1)} (0,7 veces)`);
      void vidaB0;
    }

    // ================================================================ 2. los trofeos del tablero
    if (ESCENAS.includes('trofeos')) {
      donde = 'trofeos';
      await limpiarInvasores();
      await js(`(()=>{const H=${H}, P=H.progreso; P.horas = 13; P.dia = 21; H.clima.estado.lluvia = 0; return 1})()`);
      await esperar(2500);
      const tx = L.x + 4, tz = L.z + 26;   // (en la pradera de las defensas: el frente del tablero da a un claro, sin troncos adelante)
      const r = await ponerEn('tablero-trofeos', tx, tz, 0);
      ok(r.ok, `el tablero de trofeos se arma (${r.ok ? 'ok' : r.error})`);
      await avanzar(1.2, 0);
      const ver = verLibre;
      await ver('trofeos-01-tablero-vacio', { x: tx, y: 1.8, z: tz - 6 }, { x: tx, y: 1.5, z: tz }, 55);
      // el mandamás de la noche 5 de verdad: sale y cae
      await js(`(()=>{const H=${H}, D=H.progreso.desafio; D.oleadas = 5; return 1})()`);
      const jefe = await js(`(()=>{const H=${H}; const a = H.desafio.invocar('jefe', ${tx} + 18, ${tz} + 18); if (!a) return 0; H.desafio.herirDuende(a, 1e7, 'arco'); return 1})()`);
      ok(jefe === 1, 'un mandamás sale y cae');
      ok(await js(`${H}.progreso.desafio.jefeCaido === 5`), 'jefeCaido = 5');
      await avanzar(1.3, 0);
      ok(JSON.stringify(await D('D.crece.trofeos')) === JSON.stringify({ casco: 5 }), 'el casco se ganó al caer el mandamás');
      const tab = JSON.parse(await js(`JSON.stringify(${H}.obras.obras.filter(o=>o.plano.id==='tablero-trofeos').map(o=>o.datos.colgados))`));
      ok(JSON.stringify(tab) === JSON.stringify([['casco']]), 'el tablero lo cuelga');
      ok(await js(`${H}.progreso.desafio.bonos.origen.trofeo?.saludMax === 5`), 'y da +5 de salud máxima (bono «trofeo»)');
      const maxSalud = await js(`(${H}.desafio.saludMax ?? ${H}.progreso.desafio.bonos.origen.trofeo.saludMax + 100)`);
      console.log('salud máxima / bono:', maxSalud);
      await ver('trofeos-02-el-casco', { x: tx - 0.6, y: 1.8, z: tz - 4.2 }, { x: tx - 0.9, y: 1.85, z: tz }, 40);
      // los otros mandamases, también de verdad: las noches 10, 15 y 20
      for (const n of [10, 15, 20]) {
        await js(`(()=>{const H=${H}, D=H.progreso.desafio; D.oleadas = ${n}; D.jefeCaido = -1; const a = H.desafio.invocar('jefe', ${tx} + 18, ${tz} + 18); if (a) H.desafio.herirDuende(a, 1e7, 'arco'); return 1})()`);
        await avanzar(1.3, 0);
      }
      ok(JSON.stringify(Object.keys(await D('D.crece.trofeos')).sort()) === JSON.stringify(['casco', 'hongo', 'ojo', 'piedra']), 'los cuatro mandamases dieron el suyo');
      // el Coihue, el Rey y la cueva: el estado de la partida que los dispara (el Coihue de verdad se prueba en las partidas de la subida)
      await js(`(()=>{const H=${H}, D=H.progreso.desafio; D.crece.vistos.pina = true; D.crece.vistos.corona = true; D.crece.vistos.raiz = true; D.crece.trofeos.pina = 20; D.crece.trofeos.corona = 20; D.crece.trofeos.raiz = 21; return 1})()`);
      await avanzar(1.3, 0);
      const colgados = JSON.parse(await js(`JSON.stringify(${H}.obras.obras.find(o=>o.plano.id==='tablero-trofeos').datos.colgados)`));
      ok(colgados.length === 7, `los siete colgados (${colgados.join(', ')})`);
      const bonos = await D('D.bonos.origen.trofeo');
      ok(bonos.saludMax === 10 && Math.abs(bonos.recarga - 0.06) < 1e-9 && Math.abs(bonos.alcance - 0.06) < 1e-9 && Math.abs(bonos.dano - 0.05) < 1e-9 && Math.abs(bonos.reparar - 0.15) < 1e-9 && Math.abs(bonos.correr - 0.04) < 1e-9, `los siete suman sus bonos: ${JSON.stringify(bonos)}`);
      await ver('trofeos-03-los-siete', { x: tx - 1.2, y: 3.2, z: tz - 4.6 }, { x: tx, y: 1.5, z: tz }, 55);
      await ver('trofeos-04-fila-de-arriba', { x: tx - 0.3, y: 2.0, z: tz - 3.4 }, { x: tx, y: 1.95, z: tz }, 45);
      await ver('trofeos-05-fila-de-abajo', { x: tx - 0.2, y: 1.15, z: tz - 3.3 }, { x: tx, y: 1.05, z: tz }, 45);
      await ver('trofeos-06-corona-y-raiz', { x: tx + 0.3, y: 1.15, z: tz - 1.9 }, { x: tx + 0.3, y: 1.1, z: tz }, 38);
      await ver('trofeos-07-de-costado', { x: tx + 5, y: 1.3, z: tz - 2.6 }, { x: tx, y: 1.4, z: tz }, 58);
      await ver('trofeos-08-rasante', { x: tx - 6, y: 0.55, z: tz - 1.8 }, { x: tx, y: 0.9, z: tz }, 62);
      await ver('trofeos-09-desde-atras', { x: tx, y: 1.7, z: tz + 5 }, { x: tx, y: 1.5, z: tz }, 55);
      await ver('trofeos-10-desde-arriba', { x: tx - 3, y: 7.5, z: tz - 7 }, { x: tx, y: 1.3, z: tz }, 58);
      await sinPose();
      // la E junto al tablero (caminando de verdad)
      await estar(tx, tz - 6, Math.PI);
      const c1 = await caminarHacia(tx, tz, 2.4);
      await js(`${H}.jugador.estado.pitch = 0.0; 1`);
      await cuadros(3, 30);
      const aviso1 = await aviso();
      ok(c1.recorrio > 2 && /Ver los trofeos del tablero \(7 de 7\)/.test(aviso1?.texto || ''), `caminando se llega al tablero (${c1.recorrio.toFixed(1)} m) y el aviso dice: ${JSON.stringify(aviso1)}`);
      await tecla('KeyE');
      await cuadros(3, 30);
      // 4.11.1 (U12): la E abre un panel que se queda (ya no es un aviso de 5,6 s); la segunda E lo cierra
      const panelE = await js(`(()=>{const p=document.getElementById('trofeos-panel'); return p && !p.classList.contains('oculto') ? p.textContent : ''})()`);
      console.log('panel de la E:', JSON.stringify(panelE.slice(0, 300)));
      ok(/Tablero de trofeos/.test(panelE) && /Casco de corteza/.test(panelE), 'la E abre el panel con los trofeos');
      await foto('trofeos-11-el-panel-de-la-E', true);
      await tecla('KeyE');
      await cuadros(2, 30);
      ok(await js(`document.getElementById('trofeos-panel').classList.contains('oculto')`), 'la segunda E cierra el panel');
      // el tablero cae a golpes: se pierden los trofeos y sus bonos
      await js(`(()=>{const H=${H}; const o=H.obras.obras.find(q=>q.plano.id==='tablero-trofeos'); H.desafio.danarObra(o, 99999); return 1})()`);
      await avanzar(1.3, 0);
      ok(JSON.stringify(await D('D.crece.trofeos')) === '{}' && !(await js(`${H}.progreso.desafio.bonos.origen.trofeo`)), 'los duendes tiran el tablero: los trofeos y los bonos se pierden');
      await pose({ x: tx, y: 1.7, z: tz - 6 }, { x: tx, y: 0.8, z: tz }, 55); await esperar(500); await foto('trofeos-12-tablero-caido'); await sinPose();
      // se arma otro y lo perdido no vuelve solo
      const r2 = await ponerEn('tablero-trofeos', tx + 10, tz, 0);
      await avanzar(1.5, 0);
      ok(r2.ok && JSON.stringify(await D('D.crece.trofeos')) === '{}', 'otro tablero: vacío (lo perdido no vuelve solo)');
      ok(true, `programas de shader: ${prog0} → ${await programas()}`);
    }

    // ================================================================ 3. el perro: la mordida y el gruñido, por la misma cuenta del juego
    if (ESCENAS.includes('perro')) {
      donde = 'perro';
      await limpiarInvasores();
      await estar(L.x, L.z - 40, 0);
      const mide = (noches) => js(`(()=>{const H=${H}, A=H.desafio.aliados, js=H.jugador.estado; H.progreso.desafio.crece.perro.noches = ${noches};
        for (const a of H.desafio.aliens) { a.estado='irse'; a.t=9; }
        // la mordida: un bruto al lado del perro, un segundo de mordida
        const px = js.pos.x + 3, pz = js.pos.z;
        const b = H.desafio.invocar('bruto', px, pz); b.vida = b.vidaMax = 1e6;
        const pp = { x: px + 0.6, y: js.pos.y, z: pz }; A.objetivoPerro(js, pp, 1);
        const v0 = b.vida; A.actualizarPerro(1.0, js, pp); const mordida = v0 - b.vida;
        b.estado = 'morir'; b.t = 99;
        // el gruñido: un rastreador a 46 m, a tu espalda (no lo ves)
        const yaw = js.yaw, r = H.desafio.invocar('rastreador', js.pos.x + Math.sin(yaw) * 46, js.pos.z + Math.cos(yaw) * 46);
        A.actualizarPerro(0.5, js, { x: js.pos.x + 1, y: js.pos.y, z: js.pos.z }); A.actualizarPerro(0.5, js, { x: js.pos.x + 1, y: js.pos.y, z: js.pos.z });
        const aviso = A.avisoPerro; r.estado = 'morir'; r.t = 99; for (const a of H.desafio.aliens) { a.estado='irse'; a.t=9; }
        return { nivel: H.desafio.baseCrece.nivelPerro(), mordida, aviso }})()`);
      const filas = [];
      for (const n of [0, 3, 6, 10]) filas.push(await mide(n));
      console.log('perro (nivel · mordida por segundo · gruñido a 46 m):', JSON.stringify(filas));
      ok(filas.map((f) => f.nivel).join() === '0,1,2,3', 'los cuatro niveles del perro');
      ok(Math.abs(filas[0].mordida - 9) < 1e-6 && Math.abs(filas[1].mordida - 10.35) < 1e-6 && Math.abs(filas[2].mordida - 11.7) < 1e-6 && Math.abs(filas[3].mordida - 13.5) < 1e-6, 'muerde 9, 10,35, 11,7 y 13,5 por segundo');
      // (el gruñido depende de hacia dónde mira la cámara de la ventana: sus números exactos están en verificar-4-10-base.mjs, con el perro de verdad)
      await js(`${H}.progreso.desafio.crece.perro.noches = 7; 1`);
    }

    // ================================================================ 4. guardar, recargar y una partida vieja
    if (ESCENAS.includes('guardado')) {
      donde = 'guardado';
      // dejar un estado para guardar: una empalizada nivel 3 y el perro, y un tablero con dos trofeos
      const antes = await js(`JSON.stringify({ crece: ${H}.progreso.desafio.crece, curt: ${H}.obras.obras.filter(o=>o.datos.curt).map(o=>[o.plano.id, o.datos.curt.n]) })`).then((t) => JSON.parse(t));
      await js(`(()=>{const H=${H}, D=H.progreso.desafio; D.crece.trofeos = { casco: 5, ojo: 15 }; D.crece.vistos.jefe = D.jefeCaido; return 1})()`);
      await avanzar(1.3, 0);
      const T2 = await ponerEn('tablero-trofeos', L.x - 30, L.z + 36, 0);
      await avanzar(1.5, 0);
      await js(`${H}.guardar(); 1`);
      await esperar(700);
      const recargar = async () => {
        await w.loadFile(url, { search: '?debug=1' });
        let ok2 = false;
        for (let i = 0; i < 300 && !ok2; i++) { await esperar(1000); ok2 = await js('!!window.__hojarasca').catch(() => false); }
        await js(`document.getElementById('btn-entrar').click(); 1`);
        await esperar(3000);
        await js(`${H}.ajustes.limiteFps = 'libre'; 1`);
        return ok2;
      };
      ok(await recargar(), 'la partida se vuelve a abrir');
      await avanzar(1.5, 0);
      const despues = await js(`JSON.stringify({ crece: ${H}.progreso.desafio.crece, curt: ${H}.obras.obras.filter(o=>o.datos.curt).map(o=>[o.plano.id, o.datos.curt.n]), colgados: ${H}.obras.obras.filter(o=>o.plano.id==='tablero-trofeos').map(o=>o.datos.colgados), bono: ${H}.progreso.desafio.bonos.origen.trofeo || null, placas: ${H}.obras.obras.filter(o=>o.datos.curt && o.grupo.children.length===2).length })`).then((t) => JSON.parse(t));
      console.log('recargada:', JSON.stringify(despues));
      ok(JSON.stringify(despues.crece.trofeos) === JSON.stringify({ casco: 5, ojo: 15 }) && despues.crece.perro.noches === 7, 'recargada: los trofeos y las noches del perro siguen');
      ok(JSON.stringify(despues.curt) === JSON.stringify(antes.curt), `la experiencia de las defensas sigue (${JSON.stringify(despues.curt)})`);
      ok(despues.colgados.some((c) => JSON.stringify(c) === JSON.stringify(['casco', 'ojo'])), 'el tablero vuelve a colgar los dos trofeos');
      ok(despues.bono && despues.bono.saludMax === 5 && Math.abs(despues.bono.alcance - 0.06) < 1e-9, `y sus bonos (${JSON.stringify(despues.bono)})`);
      ok(despues.placas === despues.curt.length, `cada defensa curtida vuelve con su placa (${despues.placas})`);
      ok(await js(`${H}.desafio.baseCrece.nivelPerro() === 2`), 'el perro sigue en el nivel 2');
      void T2;
      // una partida vieja (de la 4.9): sin `crece` ni `curt` ni `colgados`
      fs.mkdirSync(salida, { recursive: true });
      const vacia = path.join(salida, 'vacia.html');
      fs.writeFileSync(vacia, '<!doctype html><meta charset="utf-8"><title>vacia</title>');
      await js(`${H}.guardar(); 1`);
      await esperar(500);
      await w.loadFile(vacia);
      const tocada = await js(`(()=>{ let n = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i), v = localStorage.getItem(k); if (!v || v[0] !== '{' || !v.includes('"oleadas"')) continue;
        const d = JSON.parse(v); if (!d.desafio) continue; delete d.desafio.crece; d.desafio.jefeCaido = -1; if (d.desafio.bonos && d.desafio.bonos.origen) { delete d.desafio.bonos.origen.trofeo; delete d.desafio.bonos.origen.defensa; } for (const o of d.obras || []) { delete o.curt; delete o.colgados; } localStorage.setItem(k, JSON.stringify(d)); n++; } return n })()`);
      ok(tocada >= 1, 'se vuelve vieja la partida guardada (' + tocada + ')');
      ok(await recargar(), 'la partida vieja se abre');
      await avanzar(1.5, 0);
      const vieja = await js(`JSON.stringify({ crece: ${H}.progreso.desafio.crece, curt: ${H}.obras.obras.filter(o=>o.datos.curt).length, nivelPerro: ${H}.desafio.baseCrece.nivelPerro(), tableros: ${H}.obras.obras.filter(o=>o.plano.id==='tablero-trofeos').map(o=>(o.datos.colgados||[]).length) })`).then((t) => JSON.parse(t));
      console.log('partida vieja:', JSON.stringify(vieja));
      ok(JSON.stringify(vieja.crece.trofeos) === '{}' && vieja.crece.perro.noches === 0 && vieja.curt === 0 && vieja.nivelPerro === 0, 'una partida vieja carga limpia: sin trofeos, sin experiencia, perro sin curtir');
      ok(vieja.tableros.every((n) => n === 0), 'y los tableros, vacíos');
      // el mandamás que ya habías vencido en la partida vieja (se anotó en `jefeCaido`) te da su trofeo
      await js(`${H}.progreso.desafio.jefeCaido = 15; 1`);
      await avanzar(1.5, 0);
      ok(JSON.stringify(await D('Object.keys(D.crece.trofeos)')) === JSON.stringify(['ojo']), 'en la partida vieja, el último mandamás vencido da su trofeo');
      await avanzar(2, 0);
      ok(true, 'y el juego anda con ella');
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

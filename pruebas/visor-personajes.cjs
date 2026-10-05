// 3.7.0: capturas y medición de la gente en el juego real (gente-cuerpo.js, el estilo P). Para cada
// variante (`nueva`: la de la 3.7.0; `vieja`: la de la 3.6, con `?gente=vieja`, sólo en depuración)
// abre el juego, pone la aldea completa, para a Rosa (la panadera), a Anselmo (el herrero) y a Lucía en
// la plaza con la luz de la tarde y saca:
//   · <v>-cuerpo.png: los tres de frente, cuerpo entero a 3 m (lente de 45°);
//   · <v>-cara.png: la cara de cada uno a 1 m (lente de retrato de 30°), las tres juntas;
//   · <v>-grupo.png: los tres charlando con Inés, como los ve el jugador (ojos a 1,65 m, 70°, a 3,5 m);
// y mide: triángulos y dibujos por persona, y el costo por cuadro de la gente con 30 personas en la
// plaza (cuadro con la gente menos cuadro sin la gente, en calidad media, sincronizado con la
// placa). Todo queda en pruebas/salidas/personajes-370/ (no va al repositorio). Perfil propio.
//
// Uso (después de `node armar.mjs`):
//   npx electron pruebas/visor-personajes.cjs [variantes=vieja,nueva] [tomas=cuerpo,cara,grupo] [medir=1] [calidad=media]
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.join(raiz, 'pruebas', 'salidas', 'personajes-370');
// nunca un cartel en la pantalla del usuario: el error va a la consola y a un archivo, y se cierra
const errores = [];
const anotarError = (tipo, e) => {
  const texto = `[visor-personajes] ${tipo}: ${e && e.stack ? e.stack : e}\n${errores.slice(-8).join('\n')}\n`;
  try { console.error(texto); fs.mkdirSync(salida, { recursive: true }); fs.appendFileSync(path.join(salida, 'errores.log'), texto); } catch { /* nada */ }
  try { app.exit(1); } catch { process.exit(1); }
};
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => anotarError('excepción', e));
process.on('unhandledRejection', (e) => anotarError('promesa', e));
const perfil = path.join(salida, '_perfil');
try { fs.rmSync(perfil, { recursive: true, force: true }); } catch { /* que quede */ }
app.setPath('userData', perfil);
app.commandLine.appendSwitch('disable-gpu-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const arg = (nombre, defecto) => { const a = process.argv.find((x) => x.startsWith(`${nombre}=`)); return a ? a.slice(nombre.length + 1) : defecto; };

const VARIANTES = arg('variantes', 'vieja,nueva').split(',');
const TOMAS = arg('tomas', 'cuerpo,cara,grupo').split(',').filter(Boolean);
const MEDIR = arg('medir', '1') !== '0';
const LAMINA = arg('lamina', '0') !== '0';
const CALIDAD = arg('calidad', 'media');
const HORA = Number(arg('hora', '17.2'));
const TITULOS = { vieja: 'La de la 3.6', nueva: 'La de la 3.7.0' };

// Lo que corre en la página. Los tres: Rosa (panadera), Anselmo (herrero) y Lucía (nena).
const AYUDA = String.raw`(() => {
  const H = window.__hojarasca, M = H.__aldeaMundo(), T = H.T;
  const P = window.__proto = {};
  P.tres = ['panadera', 'herrero', 'nena'];
  P.npc = (k) => (H.gente.gente || []).find((n) => n.claveAldea === k);
  P.deAldea = () => (H.gente.gente || []).filter((n) => n.claveAldea);
  // la dirección del sol (hacia donde está), en el plano
  P.sol = () => { let s = null; H.escena.traverse((o) => { if (!s && o.isDirectionalLight && o.castShadow) s = o; });
    if (!s) H.escena.traverse((o) => { if (!s && o.isDirectionalLight) s = o; });
    s.updateMatrixWorld(); s.target.updateMatrixWorld();
    const dx = s.position.x - s.target.position.x, dy = s.position.y - s.target.position.y, dz = s.position.z - s.target.position.z;
    return { az: Math.atan2(dx, dz), alto: Math.atan2(dy, Math.hypot(dx, dz)) }; };
  // un lugar en la plaza (en el plano de la aldea) a mundo, con la altura del piso
  P.punto = (lx, lz) => { const w = M.aMundo(lx, lz); return { x: w.x, z: w.z, y: H.gente ? T.altura(w.x, w.z) : 0 }; };
  // parar a alguien en (x, z) mirando hacia el rumbo r (0 = +z), quieto, sin horario
  P.parar = (n, x, z, r) => {
    n.deVisita = true; n.camino = null; n.ruta = null; n.pose = null; n.dormido = false; n.soloCerca = 0; n.espera = 0; n.vel = 0;
    n.pos.set(x, T.altura(x, z), z); n.rumbo = n.rumboObjetivo = r; n.g.rotation.y = r; n.miraFinal = r;
  };
  // la cámara (libre: F4 en depuración) en o, mirando a a
  P.camara = (o, a, fov) => {
    const c = H.camara, js = H.jugador.estado;
    const yaw = Math.atan2(-(a.x - o.x), -(a.z - o.z)), pitch = Math.atan2(a.y - o.y, Math.hypot(a.x - o.x, a.z - o.z));
    js.yaw = yaw; js.pitch = pitch;
    c.position.set(o.x, o.y, o.z); c.rotation.order = 'YXZ'; c.rotation.set(pitch, yaw, 0);
    if (c.fov !== fov) { c.fov = fov; c.updateProjectionMatrix(); }
    for (const k of c.children) k.visible = false;
  };
  // ¿se ve de o a cada punto sin que nada se cruce? (sin contar la gente, el pasto ni lo invisible)
  P.despejado = (o, puntos) => {
    const rc = new H.THREE.Raycaster(), V = H.THREE.Vector3, gente = new Set((H.gente.gente || []).map((n) => n.g));
    const objetos = []; H.escena.traverse((x) => { if (x.isMesh && !x.isInstancedMesh && x.visible) { let q = x, de = false; while (q) { if (gente.has(q)) { de = true; break; } q = q.parent; } if (!de) objetos.push(x); } });
    for (const p of puntos) { const a = new V(o.x, o.y, o.z), b = new V(p.x, p.y, p.z), d = b.clone().sub(a); const L = d.length(); rc.set(a, d.normalize()); rc.far = L; if (rc.intersectObjects(objetos, false).some((h) => h.distance < L - 0.05)) return false; }
    return true;
  };
  P.hora = (h) => { H.progreso.horas = h; H.clima.estado.nublado = 0.1; H.clima.estado.lluvia = 0; };
  // triángulos y dibujos de una persona
  P.medirPersona = (n) => { let tri = 0, dib = 0, ver = 0; n.g.traverse((o) => { if (!o.isMesh || !o.visible) return; const g = o.geometry; const c = g.index ? g.index.count : g.attributes.position.count;
      const dr = g.drawRange; const k = Math.min(c, dr.count === Infinity ? c : dr.count); tri += k / 3; dib++; ver += g.attributes.position.count; });
    return { tri: Math.round(tri), dibujos: dib, vertices: ver }; };
  return 1;
})()`;

app.whenReady().then(async () => {
  fs.mkdirSync(salida, { recursive: true });
  const informe = [];
  const w = new BrowserWindow({ show: arg('ver', '0') === '1', width: 1600, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });   // (oculta: con la pantalla apagada, una ventana a la vista no dibuja)
  const js = (c) => w.webContents.executeJavaScript(c);
  w.webContents.on('console-message', (e) => { const m = String(e.message); if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|Autofill|favicon/.test(m)) errores.push(m.slice(0, 300)); });
  const url = path.join(raiz, 'index.html');
  for (const v of VARIANTES) {
    const search = v === 'vieja' ? '?debug=1&gente=vieja' : '?debug=1';
    await w.loadFile(url, { search });
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'${CALIDAD}', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'})); 1`);
    await w.loadFile(url, { search });
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.gente').catch(() => false)) break; }
    console.log('variante', v);
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(`(() => { const s = document.createElement('style'); s.textContent = 'body > *:not(canvas):not(script) { visibility: hidden !important; } canvas { visibility: visible !important; }'; document.head.appendChild(s); return 1; })()`);
    await js(`window.__hojarasca.__aldeaMundo().listo().then(() => 1)`);
    await js(AYUDA);
    // la aldea completa: los once pobladores con su local abierto
    await js(`(() => { const H = window.__hojarasca, a = H.progreso.aldea; const L = { carpintero: 'carpinteria', panadera: 'panaderia', herrero: 'herreria', pescador: 'pescaderia', maestra: 'escuela', enfermera: 'puesto-sanitario', telegrafista: 'estafeta', tejedora: 'hilanderia', apicultor: 'sala-miel', guardaparque: 'seccional', musico: 'salon' };
      a.pobladores = Object.keys(L).map((clave) => ({ clave, dia: 1 })); a.obras = {}; a.locales = Object.fromEntries(Object.values(L).map((l) => [l, 1])); return 1 })()`);
    // a la plaza (el cuerpo del jugador ahí, así la gente de la aldea se arma y queda despierta)
    const programasAntes = await js(`(() => { const H = window.__hojarasca, M = H.__aldeaMundo(), js = H.jugador.estado, p = M.aMundo(-2, 33);
      js.pos.set(p.x, H.T.altura(p.x, p.z), p.z); js.vel.set(0, 0, 0); window.__proto.hora(${HORA}); return H.renderer.info.programs.length })()`);
    await js(`(async () => { const M = window.__hojarasca.__aldeaMundo(); M.actualizar(4, window.__hojarasca.camara.position); await M.listo(); M.montarCola(); return 1 })()`);
    let cuantos = '';
    for (let i = 0; i < 80; i++) { await esperar(500); cuantos = await js(`(() => { window.__proto.hora(${HORA}); return window.__proto.tres.filter((k) => window.__proto.npc(k)).length + ':' + window.__proto.deAldea().length + ':' + window.__hojarasca.progreso.dia })()`); if (cuantos.startsWith('3:') && Number(cuantos.split(':')[1]) >= 20) break; }
    console.log('gente de la aldea', cuantos);
    // la cámara libre (F4, sólo en depuración): la cámara no sigue al cuerpo
    await js(`(() => { document.dispatchEvent(new KeyboardEvent('keydown', { code: 'F4', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: 'F4', bubbles: true })); return 1 })()`);
    await esperar(500);
    const sol = await js(`JSON.stringify(window.__proto.sol())`);
    console.log('sol', sol);

    // ---- las tomas
    // Los tres paran en la plaza, al oeste del mástil, de cara a un rumbo que deja el sol de la
    // tarde de costado y adelante (así la cara se ve con luz y sombra, no a contraluz).
    const montar = (toma) => `(() => { const H = window.__hojarasca, P = window.__proto, M = H.__aldeaMundo(), T = H.T;
      P.hora(${HORA});
      const s = P.sol(); const r = s.az - 0.55;   // hacia donde miran
      if (!P.centro) {
        // un lugar de la plaza donde ni la cámara del cuerpo (3 m) ni la del grupo tengan nada delante
        const fx0 = Math.sin(r), fz0 = Math.cos(r), lx0 = Math.cos(r), lz0 = -Math.sin(r);
        for (const lz of [41, 42.5, 39.5, 44, 38, 36.5, 35]) { for (const lx of [3, 4.5, 1.5, 7.5, 9, 10.5, 0, 12]) {
          const w = M.aMundo(lx, lz), y0 = T.altura(w.x, w.z);
          const puntos = [-0.9, 0, 0.8].flatMap((k) => [{ x: w.x + lx0 * k, z: w.z + lz0 * k, y: y0 + 0.9 }, { x: w.x + lx0 * k, z: w.z + lz0 * k, y: y0 + 1.5 }, { x: w.x + lx0 * k, z: w.z + lz0 * k, y: y0 + 0.2 }]);
          const o1 = { x: w.x + fx0 * 3, z: w.z + fz0 * 3, y: y0 + 0.95 }, o2 = { x: w.x + fx0 * 3.5 - lx0 * 0.4, z: w.z + fz0 * 3.5 - lz0 * 0.4, y: y0 + 1.65 };
          if (Math.abs(T.altura(o1.x, o1.z) - y0) < 0.4 && P.despejado(o1, puntos) && P.despejado(o2, puntos)) { P.centro = { lx, lz }; break; }
        } if (P.centro) break; }
        if (!P.centro) P.centro = { lx: 2.2, lz: 39.5 };
      }
      const c = M.aMundo(P.centro.lx, P.centro.lz);  // el centro del grupo
      const fx = Math.sin(r), fz = Math.cos(r), lx = Math.cos(r), lz = -Math.sin(r);   // adelante y la derecha de ellos
      const [rosa, anselmo, lucia] = P.tres.map(P.npc);
      const otros = P.deAldea().filter((n) => !P.tres.includes(n.claveAldea));
      const toma = '${toma}';
      if (toma === 'grupo') {
        // charlando: Rosa y Anselmo de tres cuartos, Lucía al lado de Rosa mirando a Anselmo
        const pr = { x: c.x + lx * 0.55, z: c.z + lz * 0.55 }, pa = { x: c.x - lx * 0.55 + fx * 0.25, z: c.z - lz * 0.55 + fz * 0.25 }, pl = { x: c.x + lx * 0.85 + fx * 0.75, z: c.z + lz * 0.85 + fz * 0.75 };
        const hacia = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
        P.parar(rosa, pr.x, pr.z, hacia(pr, pa) + 0.5); P.parar(anselmo, pa.x, pa.z, hacia(pa, pr) - 0.45); P.parar(lucia, pl.x, pl.z, hacia(pl, pa) + 0.2);
        // (S: charlando contentos; las otras variantes no tienen gestos)
        rosa.__gesto = 'sonrisa'; anselmo.__gesto = 'risa'; lucia.__gesto = 'sonrisa';
        anselmo.__quietud = 'cintura'; lucia.__quietud = 'atras';   // (M: poses de quietud)
        // P: Inés Ancalao, la herbolaria (pobladora nueva del prototipo), al lado de Rosa
        if ('${v}' === 'nueva') {
          if (!P.ines) P.ines = H.gente.agregarPoblador({ clave: 'poblador-herbolaria', colores: {}, pos: { x: c.x, z: c.z }, nombre: 'Inés Ancalao', oficio: 'herbolaria', saludo: '', despedida: '', camino: [] });
          const pi = { x: c.x + lx * 1.75 + fx * 0.35, z: c.z + lz * 1.75 + fz * 0.35 };
          P.parar(P.ines, pi.x, pi.z, hacia(pi, pa) - 0.3); P.ines.__gesto = 'sonrisa'; P.ines.dormido = false;
        }
        for (const n of otros) n.dormido = false;
        const o = { x: c.x + fx * 3.5 - lx * 0.4, z: c.z + fz * 3.5 - lz * 0.4 }; o.y = T.altura(o.x, o.z) + 1.65;
        P.camara(o, { x: c.x, z: c.z, y: T.altura(c.x, c.z) + 1.05 }, 70);
      } else {
        // en fila, de frente: Rosa a la izquierda, Anselmo al medio, Lucía a la derecha (vistos desde la cámara)
        const lugar = [[0.9, 0], [0, 0], [-0.8, 0]];
        [rosa, anselmo, lucia].forEach((n, i) => P.parar(n, c.x + lx * lugar[i][0], c.z + lz * lugar[i][0], r));
        for (const n of otros) n.dormido = true;   // nadie que tape
        for (const n of [rosa, anselmo, lucia]) { n.__gesto = null; n.__quietud = undefined; }
        if (toma === 'cuerpo') {
          const o = { x: c.x + fx * 3, z: c.z + fz * 3 }; o.y = T.altura(o.x, o.z) + 0.95;
          P.camara(o, { x: c.x, z: c.z, y: T.altura(c.x, c.z) + 0.85 }, 45);
        }
      }
      return 1 })()`;
    // la cara de uno: la cámara a 1 m de la cara, a su altura
    const caraDe = (k) => `(() => { const H = window.__hojarasca, P = window.__proto; const n = P.npc('${k}');
      n.g.updateMatrixWorld(true); const c = new H.THREE.Vector3(); n.cabeza.getWorldPosition(c); c.y += 0.04 * n.g.scale.y;
      const r = n.g.rotation.y, o = { x: c.x + Math.sin(r) * 1.0, z: c.z + Math.cos(r) * 1.0, y: c.y + 0.02 };
      P.camara(o, { x: c.x, y: c.y, z: c.z }, 30); return 1 })()`;
    const congelar = `(() => { window.__proto.hora(${HORA}); return 1 })()`;
    for (const toma of TOMAS) {
      await js(montar(toma));
      await esperar(2500);
      await js(montar(toma));
      if (toma === 'cara') {
        const recortes = [];
        for (const k of ['panadera', 'herrero', 'nena']) {
          await js(caraDe(k)); await esperar(1200); await js(congelar); await js(caraDe(k)); await esperar(500);
          const img = await w.webContents.capturePage();
          const s = img.getSize();
          // el centro: 560 × 640 (la cara ocupa más o menos la mitad)
          const ancho = Math.round(s.width * 0.35), alto = Math.round(s.height * 0.71);
          recortes.push(img.crop({ x: Math.round((s.width - ancho) / 2), y: Math.round((s.height - alto) / 2), width: ancho, height: alto }).toDataURL());
        }
        const png = await componer(recortes.map((d) => [d]), null);
        fs.writeFileSync(path.join(salida, `${v}-cara.png`), png);
      } else {
        await esperar(800); await js(congelar); await js(montar(toma)); await esperar(600);
        const img = await w.webContents.capturePage();
        fs.writeFileSync(path.join(salida, `${v}-${toma}.png`), img.toPNG());
      }
      console.log('foto', v, toma);
    }

    // ---- la medición
    const personas = await js(`JSON.stringify(Object.fromEntries(window.__proto.tres.map((k) => [k, window.__proto.medirPersona(window.__proto.npc(k))])))`);
    let linea = `${v}: personas ${personas}`;
    if (MEDIR) {
      // 30 personas en la plaza: las 20 de la aldea y 10 más (copias de pobladores), quietas, a la vista
      const r = await js(`(() => { const H = window.__hojarasca, P = window.__proto, M = H.__aldeaMundo(), T = H.T;
        P.hora(${HORA});
        const extra = ['carpintero', 'panadera', 'herrero', 'maestra', 'tejedora', 'musico', 'enfermera', 'apicultor', 'telegrafista', 'pescador'];
        if (!P.extras) P.extras = extra.map((k, i) => { const n = P.deAldea().find((q) => q.claveAldea === k); const w = M.aMundo(0, 0);
          return H.gente.agregarPoblador({ clave: 'poblador-' + k, colores: n ? n.__colores || undefined : undefined, pos: { x: w.x, z: w.z }, nombre: 'copia', oficio: '', saludo: '', despedida: '', camino: [] }); });
        const todos = [...P.deAldea(), ...P.extras];
        // en una grilla de 6 × 5 sobre la plaza, mirando a la cámara
        const o = M.aMundo(6, 25); o.y = T.altura(o.x, o.z) + 1.65;
        todos.forEach((n, i) => { const lx = -1 + (i % 6) * 2.1, lz = 34 + Math.floor(i / 6) * 2.2; const w = M.aMundo(lx + 1.5, lz);
          P.parar(n, w.x, w.z, Math.atan2(o.x - w.x, o.z - w.z)); n.dormido = false; });
        const c = M.aMundo(6, 38.5);
        P.camara(o, { x: c.x, z: c.z, y: T.altura(c.x, c.z) + 0.6 }, 70);
        return todos.length })()`);
      await esperar(3000);
      const medir = (con) => `(() => { const H = window.__hojarasca, P = window.__proto, R = H.renderer, gl = R.getContext(), px = new Uint8Array(4);
        const todos = P.todos || (P.todos = [...P.deAldea(), ...P.extras]);
        const lista = H.gente.gente;
        for (const n of todos) {
          const i = lista.indexOf(n);
          if (${con}) { if (i < 0) lista.push(n); if (!n.g.parent) H.escena.add(n.g); n.dormido = false; }
          else { if (i >= 0) lista.splice(i, 1); if (n.g.parent) n.g.parent.remove(n.g); }
        }
        for (let i = 0; i < 20; i++) H.__bucle();
        const t = [];
        for (let i = 0; i < 300; i++) { const t0 = performance.now(); P.hora(${HORA}); H.__bucle(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); t.push(performance.now() - t0); }
        t.sort((a, b) => a - b);
        R.info.autoReset = false; R.info.reset(); R.render(H.escena, H.camara); const info = { dibujos: R.info.render.calls, tri: R.info.render.triangles }; R.info.autoReset = true;
        return JSON.stringify({ med: +t[t.length >> 1].toFixed(2), p25: +t[t.length >> 2].toFixed(2), p90: +t[Math.floor(t.length * 0.9)].toFixed(2), ...info, programas: R.info.programs.length }) })()`;
      const corridas = [];
      for (let k = 0; k < 5; k++) {
        const sin = JSON.parse(await js(medir(false)));
        const con = JSON.parse(await js(medir(true)));
        corridas.push({ sin, con, gente: +(con.med - sin.med).toFixed(2) });
      }
      corridas.sort((a, b) => a.gente - b.gente);
      const m = corridas[2];
      const img = await w.webContents.capturePage();
      fs.writeFileSync(path.join(salida, `${v}-treinta.png`), img.toPNG());
      linea += `\n  30 personas (${r}): cuadro con gente ${m.con.med} ms (p90 ${m.con.p90}), sin gente ${m.sin.med} ms → la gente cuesta ${m.gente} ms [corridas: ${corridas.map((c) => c.gente).join(', ')}]; dibujos ${m.con.dibujos} (sin gente ${m.sin.dibujos}), triángulos ${m.con.tri} (sin gente ${m.sin.tri}); programas al llegar ${programasAntes} → ${m.con.programas}`;
      // experimentos=huesos,posar,sombra,material: dónde se va el costo (se apaga una cosa y se vuelve a medir)
      for (const ex of arg('experimentos', '').split(',').filter(Boolean)) {
        const cambiar = (poner) => `(() => { const H = window.__hojarasca, P = window.__proto, ex = '${ex}', poner = ${poner};
          const todos = P.todos || (P.todos = [...P.deAldea(), ...P.extras]);
          for (const n of todos) {
            const s = []; n.g.traverse((o) => { if (o.isMesh) s.push(o); });
            const piel = s.find((o) => o.isSkinnedMesh);
            if (ex === 'huesos' && piel) { if (poner) { piel.__upd = piel.skeleton.update; piel.skeleton.update = () => {}; } else if (piel.__upd) piel.skeleton.update = piel.__upd; }
            if (ex === 'posar') { if (poner) { n.__ap = n.alPosar; n.alPosar = null; } else n.alPosar = n.__ap; }
            if (ex === 'sombra') for (const o of s) { if (poner) { o.__cs = o.castShadow; o.castShadow = false; } else o.castShadow = o.__cs; }
            if (ex === 'material') for (const o of s) { if (poner) { o.__mat = o.material; o.material = P.matSimple || (P.matSimple = new H.THREE.MeshLambertMaterial({ vertexColors: true })); } else o.material = o.__mat; }
          } return 1 })()`;
        await js(cambiar(true));
        const cs = [];
        for (let k = 0; k < 3; k++) { const sin = JSON.parse(await js(medir(false))); const con = JSON.parse(await js(medir(true))); cs.push(+(con.med - sin.med).toFixed(2)); }
        await js(cambiar(false));
        cs.sort((a, b) => a - b);
        linea += `\n  sin ${ex}: la gente cuesta ${cs[1]} ms [${cs.join(', ')}]`;
      }
    }
    console.log(linea);
    informe.push(linea);
  }
  if (errores.length) informe.push(`errores de la página:\n${errores.join('\n')}`);
  fs.writeFileSync(path.join(salida, `informe-${VARIANTES.join('-')}.txt`), informe.join('\n'));
  if (LAMINA) await laminas();
  console.log('listo:', salida);
  app.exit(0);

  // Compone imágenes en un canvas: `filas` es [[dataURL, ...], ...] (cada fila, lado a lado);
  // `etiquetas` (opcional), una por fila, a la izquierda. Devuelve el PNG.
  async function componer(filas, etiquetas, escala = 1) {
    const c = new BrowserWindow({ show: false, width: 400, height: 300, webPreferences: { backgroundThrottling: false } });
    await c.loadURL('about:blank');
    const datos = await c.webContents.executeJavaScript(`(async () => {
      const filas = ${JSON.stringify(filas)}, etiquetas = ${JSON.stringify(etiquetas)}, k = ${escala};
      const cargar = (s) => new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = s; });
      const imgs = []; for (const f of filas) imgs.push(await Promise.all(f.map(cargar)));
      const izq = etiquetas ? 300 : 0, sep = 6;
      const anchos = imgs.map((f) => f.reduce((s, i) => s + i.width * k + sep, -sep));
      const W = izq + Math.max(...anchos), Hh = imgs.reduce((s, f) => s + Math.max(...f.map((i) => i.height * k)) + sep, -sep);
      const cv = document.createElement('canvas'); cv.width = Math.round(W); cv.height = Math.round(Hh);
      const x = cv.getContext('2d'); x.fillStyle = '#1d1a17'; x.fillRect(0, 0, cv.width, cv.height);
      let y = 0;
      imgs.forEach((f, j) => { let xx = izq; const alto = Math.max(...f.map((i) => i.height * k));
        for (const i of f) { x.drawImage(i, xx, y, i.width * k, i.height * k); xx += i.width * k + sep; }
        if (etiquetas) { x.fillStyle = '#efe6d6'; x.font = 'bold 30px Georgia, serif'; const [a, b] = etiquetas[j].split(' · ');
          x.fillText(a, 18, y + alto / 2 - 6); if (b) { x.font = '24px Georgia, serif'; x.fillText(b, 18, y + alto / 2 + 28); } }
        y += alto + sep; });
      return cv.toDataURL('image/png'); })()`);
    c.destroy();
    return Buffer.from(datos.split(',')[1], 'base64');
  }
  // Una lámina por toma: las cinco versiones, una debajo de la otra (la cara: las tres caras de
  // cada una), con su nombre a la izquierda. El cuerpo y el grupo van recortados al centro.
  async function laminas() {
    const { nativeImage } = require('electron');
    for (const toma of ['cuerpo', 'cara', 'grupo']) {
      const filas = [], etiquetas = [];
      for (const v of ['vieja', 'nueva']) {
        const f = path.join(salida, `${v}-${toma}.png`);
        if (!fs.existsSync(f)) continue;
        let img = nativeImage.createFromPath(f);
        const s = img.getSize();
        if (toma === 'cuerpo') img = img.crop({ x: Math.round(s.width * 0.2), y: Math.round(s.height * 0.04), width: Math.round(s.width * 0.6), height: Math.round(s.height * 0.92) });
        if (toma === 'grupo') img = img.crop({ x: Math.round(s.width * 0.15), y: Math.round(s.height * 0.12), width: Math.round(s.width * 0.7), height: Math.round(s.height * 0.8) });
        filas.push([img.toDataURL()]); etiquetas.push(TITULOS[v]);
      }
      if (!filas.length) continue;
      // cuerpo y grupo: de a dos columnas no; una columna con las cinco, a escala para que no pase de ~5000 px
      const png = await componer(filas, etiquetas, toma === 'cara' ? 0.6 : 0.5);
      fs.writeFileSync(path.join(salida, `lamina-${toma}.png`), png);
      console.log('lámina', toma);
    }
  }
});

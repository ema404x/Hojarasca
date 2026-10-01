// Partida real 3.0.1 (Electron + WebGL): todas las obras que se construyen, una por una.
// Cada plano se arma con la API de obras (elegir, fundar, avanzar) en el llano y en una
// ladera; se mueve (si es pieza) y se desmonta, y no puede quedar física fantasma. Lo que se
// camina se recorre CAMINANDO (W apretada + jugador.actualizar): el puesto y la casilla por su
// puerta, el mirador y la torre por su escalera (también en la ladera), la casa modular con su
// puerta (E de los dos lados), la casa de dos pisos por la escalera interior, el adarve, la
// pasarela colgante, el puente levadizo y el portón. Las obras que se usan con E se alcanzan
// caminando desde afuera. En el Desafío, un invasor trabado contra una pared le pega a la
// pared y no al piso, la losa o el foso que está pisando.
// Uso: npx electron pruebas/humo-3-0-1-obras.cjs     (--user-data-dir=<carpeta> o HUMO_PERFIL=<carpeta> para un perfil aparte)
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- lo que corre en la página
const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, O = H.obras, T = H.T, col = H.col, J = H.jugador, V3 = H.THREE.Vector3;
  const A = window.__A = {};
  H.ajustes.limiteFps = 'libre';
  const R = (v, n = 2) => Math.round(v * 10 ** n) / 10 ** n;
  A.PL = (id) => H.PLANOS.find((p) => p.id === id);
  const mundoR = (x, z, r, lx, lz) => ({ x: x + lx * Math.cos(r) + lz * Math.sin(r), z: z - lx * Math.sin(r) + lz * Math.cos(r) });
  A.mundo = (o, lx, lz) => mundoR(o.datos.x, o.datos.z, o.datos.rot || 0, lx, lz);
  A.local = (o, x, z) => { const r = o.datos.rot || 0, dx = x - o.datos.x, dz = z - o.datos.z; return { lx: dx * Math.cos(r) - dz * Math.sin(r), lz: dx * Math.sin(r) + dz * Math.cos(r) }; };
  A.materiales = () => Object.assign(H.progreso.materiales, { tronco: 9999, tabla: 9999, piedra: 9999, cristal: 9999, lana: 9999 });
  A.limpiar = () => { if (O.editando) O.cancelarEdicion(); for (const o of [...O.obras]) O.destruir(o); O.elegir(null); H.progreso.obras = []; A.ocupados = []; return 1; };
  A.correr = (n = 25) => { if (H.desafio) for (let i = 0; i < n; i++) H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 }); };

  // la física que es de la obra (también la del puente levadizo, que tiene dueño propio)
  const esDe = (o, d) => !!d && (d === o || d.puente === o);
  A.fisica = (o, cx = null, cz = null, Rr = 16) => {
    const obs = new Set(), x0 = cx ?? o.datos.x, z0 = cz ?? o.datos.z;
    for (let x = x0 - Rr; x <= x0 + Rr; x += 4) for (let z = z0 - Rr; z <= z0 + Rr; z += 4) for (const c of col.cercanos(x, z)) if (esDe(o, c.duenio)) obs.add(c);
    return { obs: obs.size, plats: col.plataformas.filter((p) => esDe(o, p.duenio)).length, din: col.dinamicos.filter((p) => esDe(o, p.duenio)).length };
  };
  const pend = (x, z) => Math.acos(Math.max(-1, Math.min(1, T.normal(x, z).y)));
  A.buscarSitio = (id, pmin = 0, pmax = 0.05, rot = 0) => {
    const p = A.PL(id), r0 = T.lugares.refugio;
    for (let r = 30; r < 260; r += 3.1) {
      const n = Math.max(8, Math.round(2 * Math.PI * r / 3.1));
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + r * 0.37, x = r0.x + Math.cos(a) * r, z = r0.z + Math.sin(a) * r;
        if (Math.abs(x) > 480 || Math.abs(z) > 480) continue;
        const pe = pend(x, z);
        if (pe < pmin || pe > pmax) continue;
        let malo = false;
        for (const [dx, dz] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) { const q = pend(x + dx, z + dz); if (q < pmin * 0.6 || q > pmax * 1.3 + 0.02) malo = true; }
        if (malo || (A.ocupados || []).some((q) => Math.hypot(q.x - x, q.z - z) < 16)) continue;
        if (O.revisarSitio(x, z, p, rot).ok) return { x, z, rot, pendiente: pe };
      }
    }
    return null;
  };
  A.sitioAgua = (id) => {
    const p = A.PL(id), L = { x: 150, z: 110 };
    for (let r = 60; r < 200; r += 0.7) for (let a = 0; a < 6.28; a += 0.04) {
      const x = L.x + Math.cos(a) * r, z = L.z + Math.sin(a) * r;
      for (let k = 0; k < 8; k++) { const rot = k * Math.PI / 4; if (O.revisarSitio(x, z, p, rot).ok) return { x, z, rot }; }
    }
    return null;
  };
  A.sitioMolino = () => {
    const p = A.PL('molino-agua'), rio = T.rio;
    for (let i = 30; i < rio.length - 30; i += 3) {
      const a = rio[i - 2], b = rio[i + 2]; let tx = b.x - a.x, tz = b.z - a.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
      for (const lado of [-1, 1]) for (let d = 1.5; d < 6; d += 0.25) {
        const x = rio[i].x - tz * lado * d, z = rio[i].z + tx * lado * d;
        for (let k = 0; k < 8; k++) { const rot = k * Math.PI / 4; if (O.revisarSitio(x, z, p, rot).ok) return { x, z, rot }; }
      }
    }
    return null;
  };
  A.construir = (id, x, z, rot = 0, ref = null) => {
    A.materiales();
    const p = A.PL(id);
    O.elegir(p);
    const f = O.fundar(x, z, rot, ref);
    if (!f.ok) { O.elegir(null); return { ok: false, error: f.motivo }; }
    const etapas = [];
    for (let g = 0; g < 12 && f.obra.datos.etapas < f.obra.plano.etapas.length; g++) { const q = O.avanzar(f.obra, H.progreso.materiales); etapas.push(q.ok || q.motivo); if (!q.ok) break; }
    O.elegir(null);
    H.progreso.obras = O.obras.map((o) => o.datos);
    (A.ocupados = A.ocupados || []).push({ x: f.obra.datos.x, z: f.obra.datos.z });
    A.correr();
    return { ok: f.obra.datos.etapas >= f.obra.plano.etapas.length, i: O.obras.indexOf(f.obra), etapas };
  };
  A.obra = (i) => O.obras[i];
  A.poner = (id, pmin = 0, pmax = 0.05) => {
    const s = A.PL(id).sobreAgua ? A.sitioAgua(id) : id === 'molino-agua' ? A.sitioMolino() : A.buscarSitio(id, pmin, pmax);
    if (!s) throw new Error('sin sitio para ' + id);
    const c = A.construir(id, s.x, s.z, s.rot);
    if (!c.ok) throw new Error(id + ': ' + c.error);
    return A.obra(c.i);
  };

  // ------------------------------------------------ caminar de verdad
  const tecla = (code, tipo = 'keydown') => document.dispatchEvent(new KeyboardEvent(tipo, { code, key: code, bubbles: true }));
  A.tecla = tecla;
  A.ponerLocal = (o, lx, lz, y = null) => {
    const q = A.mundo(o, lx, lz), js = J.estado;
    js.enCable = false; js.sentado = false; js.agachado = false;
    js.pos.set(q.x, y ?? T.altura(q.x, q.z), q.z); js.vel.set(0, 0, 0); js.vy = 0; js.enSuelo = true;
    for (let i = 0; i < 6; i++) J.actualizar(0.05);
  };
  A.caminarLocal = (o, puntos, { max = 800, tol = 0.28, trabado = 24 } = {}) => {
    const js = J.estado;
    let pasos = 0;
    tecla('KeyW');
    try {
      for (const [lx, lz] of puntos) {
        const t = A.mundo(o, lx, lz);
        let quieto = 0, ax = js.pos.x, az = js.pos.z;
        for (;;) {
          const dx = t.x - js.pos.x, dz = t.z - js.pos.z;
          if (Math.hypot(dx, dz) < tol) break;
          if (++pasos > max) return false;
          js.yaw = Math.atan2(-dx, -dz);
          J.actualizar(0.05);
          quieto = Math.hypot(js.pos.x - ax, js.pos.z - az) < 0.012 ? quieto + 1 : 0;
          ax = js.pos.x; az = js.pos.z;
          if (quieto > trabado) return false;
        }
      }
      return true;
    } finally { tecla('KeyW', 'keyup'); for (let i = 0; i < 10; i++) J.actualizar(0.05); }
  };
  A.dy = (o) => R(J.estado.pos.y - o.datos.y);
  A.pies = (o) => { const l = A.local(o, J.estado.pos.x, J.estado.pos.z); return [R(l.lx), R(l.lz), A.dy(o)]; };
  A.subir = (o, ruta, esperado, tol = 0.13) => {
    A.ponerLocal(o, ruta[0][0], ruta[0][1]);
    const ok = A.caminarLocal(o, ruta.slice(1));
    return { ok: ok && Math.abs(A.dy(o) - esperado) < tol, pies: A.pies(o), esperado };
  };
  A.aviso = () => { for (let i = 0; i < 3; i++) H.__bucle(); return H.__aviso(); };
  // lo que se mide es la obra: sin las plantas y cosas sueltas del lugar, que tienen su propio
  // aviso («Anotar ñire») y le ganan a E cuando quedan en la mira
  const buscarObjetos = H.objetos.buscar;
  A.sinObjetos = (si) => { H.objetos.buscar = si ? () => null : buscarObjetos; return 1; };
  A.avisoAbajo = () => { J.estado.pitch = -0.75; return A.aviso(); };
  A.pulsarE = () => {
    tecla('KeyE'); tecla('KeyE', 'keyup');
    for (let i = 0; i < 25; i++) H.__bucle();
    for (let i = 0; i < 80 && (H.puertas?.lista || []).some((p) => Math.abs(p.abierta - p.objetivo) > 0.001); i++) H.__bucle();
    return 1;
  };
})()`;

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: false, width: 1024, height: 640, webPreferences: { backgroundThrottling: false } });
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
  const partida = async (modo) => {
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', estacion:'verano', musica:false, modo:'${modo}', autoCalidad:false, guiaPrimerDia:false, limiteFps:'libre'})); 1`);
    await abrir();
    let listo = false;
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js(`!!(${H} && ${H}.jugador && ${H}.obras)`).catch(() => false)) { listo = true; break; } }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(2500);
    await js(PAGINA);
    await js(`(()=>{ const P = ${H}.progreso; P.horas = 11; if (P.desafio) P.desafio.salud = 100; for (let i = 0; i < 3; i++) ${H}.__bucle(); return 1 })()`);
    return listo;
  };
  const A = (c) => js(`(()=>{ const A = window.__A, H = window.__hojarasca, O = H.obras, T = H.T; ${c} })()`);
  let copiaStorage = null;

  try {
    await abrir();
    for (let i = 0; i < 300; i++) { await esperar(500); if (await js(`!!${H}`).catch(() => false)) break; }
    copiaStorage = await js(`JSON.stringify(Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])))`);

    for (const modo of ['relax', 'desafio']) {
      seccion(`${modo}: carga`);
      ok(await partida(modo), `carga el ${modo}`);
      // ---------------------------------------------------------------- todas las obras
      seccion(`${modo}: cada plano se arma, se mueve y se desmonta sin dejar física`);
      const r = await A(`
        const res = [], ids = H.PLANOS.filter((p) => ${modo === 'desafio' ? 'p.soloDesafio' : '!p.soloDesafio'}).map((p) => p.id);
        const SOPORTE = { 'techo-modular': 'piso', 'techo-una-agua': 'piso', 'techo-plano': 'piso', 'baranda-modular': 'piso', 'pilar-esquina': 'piso', 'entrepiso-modular': 'paredes', 'entrepiso-escalera': 'paredes', 'escalera-nivel': 'hueco' };
        for (const id of ids) {
          for (const lugar of ['llano', 'ladera']) {
            A.limpiar();
            const p = A.PL(id), pmax = Math.min(0.3, (p.pendienteMax ?? (p.pieza ? 0.45 : 0.3)) - 0.04);
            if (lugar === 'ladera' && (p.sobreAgua || id === 'molino-agua')) continue;
            let s = p.sobreAgua ? A.sitioAgua(id) : id === 'molino-agua' ? A.sitioMolino()
              : SOPORTE[id] ? A.buscarSitio('piso-modular', lugar === 'llano' ? 0 : 0.12, lugar === 'llano' ? 0.05 : 0.36)
              : A.buscarSitio(id, lugar === 'llano' ? 0 : 0.12, lugar === 'llano' ? 0.05 : pmax);
            if (!s) { res.push({ id, lugar, error: 'sin sitio' }); continue; }
            let x = s.x, z = s.z, ref = null;
            if (SOPORTE[id]) {
              const piso = A.construir('piso-modular', s.x, s.z, s.rot); const po = A.obra(piso.i); ref = po.datos.y + 0.285;
              if (SOPORTE[id] !== 'piso') for (const lz of [-1.42, 1.42]) { const q = A.mundo(po, 0, lz); A.construir('pared-modular', q.x, q.z, s.rot, ref); }
              if (SOPORTE[id] === 'hueco') A.construir('entrepiso-escalera', s.x, s.z, s.rot, ref);
              if (id === 'baranda-modular') ({ x, z } = A.mundo(po, 0, -1.42));
              if (id === 'pilar-esquina') ({ x, z } = A.mundo(po, -1.39, -1.39));
            }
            const c = A.construir(id, x, z, s.rot, ref);
            if (!c.ok) { res.push({ id, lugar, error: c.error || 'etapas ' + c.etapas.join() }); continue; }
            const o = A.obra(c.i), x0 = o.datos.x, z0 = o.datos.z;
            const antes = A.fisica(o);
            let movida = null, fantasmas = 0, enEdicion = null;
            if (p.pieza) {
              const e = O.iniciarEdicionCerca({ x: o.datos.x, y: o.datos.y, z: o.datos.z }, 5);
              if (e.ok && e.obra === o) {
                A.correr();
                enEdicion = A.fisica(o, x0, z0);
                for (const [dx, dz] of [[4, 0], [0, 4], [-4, 0], [0, -4], [6, 0], [0, 6]]) { const q = O.confirmarEdicion(x0 + dx, z0 + dz, o.datos.rot || 0, o.datos.y); if (q.ok) { movida = [dx, dz]; break; } }
                if (!movida) O.cancelarEdicion();
                A.correr();
                const despues = A.fisica(o);
                if (movida && (despues.obs !== antes.obs || despues.plats !== antes.plats)) fantasmas++;
              }
              const d = O.desmontarCerca({ x: o.datos.x, y: o.datos.y, z: o.datos.z }, 4.5);
              if (!d.ok || d.datos !== o.datos) O.destruir(o);
            } else {
              for (let n = 0; o.datos.etapas > 0 && n < 10; n++) if (!O.deshacerEtapa({ x: o.datos.x, z: o.datos.z }, 6).ok) break;
              O.cancelarMarcada({ x: o.datos.x, z: o.datos.z }, 9, id);
              if (O.obras.includes(o)) O.destruir(o);
            }
            A.correr();
            const resto = A.fisica(o, x0, z0, 22), restoNuevo = A.fisica(o, null, null, 22);
            res.push({ id, lugar, fis: antes.obs + antes.plats + antes.din, enEdicion: enEdicion ? enEdicion.obs + enEdicion.plats + enEdicion.din : 0, movida: !!movida, fantasmas,
              resto: resto.obs + resto.plats + resto.din + restoNuevo.obs + restoNuevo.plats + restoNuevo.din + (H.puertas?.lista || []).filter((q) => q.duenio === o).length });
          }
        }
        return res;`);
      const fallan = r.filter((x) => x.error && !(x.lugar === 'ladera' && /sitio|Necesita/.test(x.error)));
      ok(!fallan.length, `${r.filter((x) => !x.error).length} armados: todos en el llano y en la ladera donde se puede (fallan: ${JSON.stringify(fallan)})`);
      const sinLlano = r.filter((x) => x.lugar === 'llano' && x.error);
      ok(!sinLlano.length, `todos los planos se arman en el llano (${JSON.stringify(sinLlano)})`);
      const quedan = r.filter((x) => x.resto > 0);
      ok(!quedan.length, `desmontados, no dejan colisiones, pisos ni puertas fantasma (${JSON.stringify(quedan)})`);
      const edicion = r.filter((x) => x.enEdicion > 0 || x.fantasmas > 0);
      ok(!edicion.length, `moviéndolos, la física va con la obra (${JSON.stringify(edicion)})`);
      ok(r.filter((x) => x.movida).length > 20, `se movieron ${r.filter((x) => x.movida).length} piezas`);

      if (modo === 'relax') {
        // ---------------------------------------------------------------- se entra caminando
        seccion('relax: se entra y se sube caminando');
        const edif = await A(`
          const out = {};
          A.limpiar(); let o = A.poner('puesto'); out.puesto = A.subir(o, [[0, -5], [0, -2.5], [0, -0.3], [0.8, 1.0]], 0.58);
          A.limpiar(); o = A.poner('casilla'); out.casilla = A.subir(o, [[0, -4.8], [0, -2.2], [0, 0], [-1, 0.8]], 0.62);
          A.limpiar(); o = A.poner('cobertizo'); out.cobertizo = A.subir(o, [[1.4, -4.9], [1.4, -0.2], [2, 0.3]], 0.52);
          A.limpiar(); o = A.poner('galponcito'); out.galponcito = A.subir(o, [[0, -4.8], [0, 0], [1, 0.5]], 0.38);
          A.limpiar(); o = A.poner('mirador'); out.mirador = A.subir(o, [[0, -6.7], [0, -5.4], [0, -1.8], [0, 0.2], [0.8, 0.4]], 3.49);
          A.limpiar(); o = A.poner('mirador', 0.15, 0.26); out.miradorLadera = A.subir(o, [[0, -6.7], [0, -5.4], [0, -1.8], [0, 0.2]], 3.49);
          A.limpiar(); o = A.poner('pasarela'); out.pasarela = A.subir(o, [[-3.6, 0], [-1.2, 0], [1.2, 0]], 0.29);
          A.limpiar(); o = A.poner('embarcadero'); out.embarcadero = A.subir(o, [[0, -4.2], [0, -2.4], [0, 2.3]], 0.46);
          return out;`);
        for (const [k, v] of Object.entries(edif)) ok(v.ok, `${k}: se llega caminando (${JSON.stringify(v)})`);

        seccion('relax: la casa modular, con puerta (E de los dos lados), y la de dos pisos');
        const casa = await A(`
          const armar = (entrepiso, puertaEn = -1) => {
            A.limpiar();
            const s = A.buscarSitio('piso-modular', 0, 0.05);
            const piso = A.construir('piso-modular', s.x, s.z, 0), po = A.obra(piso.i), arriba = po.datos.y + 0.285;
            const pared = (id, lx, lz, rot, y = arriba) => { const q = A.mundo(po, lx, lz); const c = A.construir(id, q.x, q.z, rot, y); if (!c.ok) throw new Error(id + ': ' + c.error); return A.obra(c.i); };
            const r = { po };
            r.sur = pared(puertaEn < 0 ? 'pared-puerta' : 'pared-modular', 0, -1.42, 0); pared(puertaEn > 0 ? 'pared-puerta' : 'pared-modular', 0, 1.42, puertaEn > 0 ? Math.PI : 0);
            pared('pared-modular', 1.42, 0, Math.PI / 2); pared('pared-ventana', -1.42, 0, Math.PI / 2);
            let techoY = arriba;
            if (entrepiso) {
              const e = A.construir('entrepiso-escalera', s.x, s.z, 0, arriba); if (!e.ok) throw new Error('entrepiso: ' + e.error); r.entrepiso = A.obra(e.i);
              const k = A.construir('escalera-nivel', s.x, s.z, 0, arriba); if (!k.ok) throw new Error('escalera-nivel: ' + k.error);
              techoY = r.entrepiso.datos.y + 0.285;
              pared('pared-modular', 0, -1.42, 0, techoY); pared('pared-modular', 0, 1.42, 0, techoY); pared('pared-modular', 1.42, 0, Math.PI / 2, techoY); pared('pared-modular', -1.42, 0, Math.PI / 2, techoY);
            }
            const t = A.construir('techo-modular', s.x, s.z, 0, techoY); if (!t.ok) throw new Error('techo: ' + t.error);
            const q = A.mundo(po, 0, puertaEn * 2.37); const em = A.construir('escalera-modular', q.x, q.z, puertaEn < 0 ? 0 : Math.PI, arriba); if (!em.ok) throw new Error('escalera: ' + em.error);
            return r;
          };
          const out = {};
          let c = armar(false), po = c.po;
          const hoja = (H.puertas?.lista || []).find((p) => p.duenio === c.sur && !p.postigo);
          out.habitacion = O.estadoModulo(po)?.etiqueta;
          A.ponerLocal(po, 0, -4.6); A.caminarLocal(po, [[0, -1.9]], { trabado: 12 });
          out.cerradaFrena = !A.caminarLocal(po, [[0, -1.2], [0, 0]], { trabado: 12 });
          out.avisoAfuera = A.aviso(); A.pulsarE(); out.abreAfuera = hoja?.objetivo === 1;
          out.entra = A.caminarLocal(po, [[0, -1.2], [0, 0], [0.6, 0.6]]) && Math.abs(A.dy(po) - 0.285) < 0.1;
          out.adentro = !!O.dentro(H.jugador.estado.pos);
          A.caminarLocal(po, [[0, -0.7]]);
          out.avisoAdentro = A.aviso(); A.pulsarE(); out.cierraAdentro = hoja?.objetivo === 0;
          out.cerradaFrenaAdentro = !A.caminarLocal(po, [[0, -2.2]], { trabado: 12 });
          A.caminarLocal(po, [[0.2, -0.4]]); A.pulsarE();
          out.sale = A.caminarLocal(po, [[0, -1.9], [0, -4.5]]);
          c = armar(true); po = c.po;
          A.ponerLocal(po, 0, -4.6); A.caminarLocal(po, [[0, -1.9]], { trabado: 12 }); A.pulsarE();
          out.subeEscalera = A.caminarLocal(po, [[0, -1.0], [0, 0.95]]);
          out.arriba = A.caminarLocal(po, [[0.95, 0.9], [1.0, -0.8], [1.0, 0.9], [0, 0.95], [-1.0, 0.9], [-1.0, -0.8]]) && Math.abs(A.dy(po) - (c.entrepiso.datos.y + 0.285 - po.datos.y)) < 0.15;
          // bajando se sale derecho por la puerta del pie (el dintel ya no traba)
          out.baja = A.caminarLocal(po, [[-1.0, 1.0], [0, 0.95], [0, -2.5]]);
          // con la puerta del lado alto y una pared al pie: se sube de costado por el pie
          c = armar(true, 1); po = c.po;
          A.ponerLocal(po, 0, 4.6); A.caminarLocal(po, [[0, 1.9]], { trabado: 12 }); A.pulsarE();
          out.subeDeCostado = A.caminarLocal(po, [[0, 1.0], [-0.95, 0.9], [-0.95, -0.9], [-0.3, -0.92], [0, -0.9], [0, 0.95]]);
          out.arribaDeCostado = A.caminarLocal(po, [[0.95, 0.9], [1.0, -0.8]]) && Math.abs(A.dy(po) - (c.entrepiso.datos.y + 0.285 - po.datos.y)) < 0.15;
          out.bajaDeCostado = A.caminarLocal(po, [[1.0, 0.9], [0, 0.95], [0, -0.9], [-0.95, -0.92], [-0.95, 0.9], [0, 1.1], [0, 1.9], [0, 4.5]]);
          A.ponerLocal(po, 0, 4.6); A.caminarLocal(po, [[0, 1.9]], { trabado: 12 });
          out.debajoFrena = !A.caminarLocal(po, [[0, 1.0], [0, -1.0]], { trabado: 12 }) && A.pies(po)[1] > 0.5;
          return out;`);
        ok(casa.habitacion === 'habitación cerrada', `cuatro paredes y techo: ${casa.habitacion}`);
        ok(casa.cerradaFrena && /Abrir/.test(casa.avisoAfuera) && casa.abreAfuera, `la puerta cerrada frena; de afuera el aviso dice «${casa.avisoAfuera}» y E la abre`);
        ok(casa.entra && casa.adentro, `se entra caminando por la puerta abierta (${JSON.stringify(casa)})`);
        ok(/Cerrar/.test(casa.avisoAdentro) && casa.cierraAdentro && casa.cerradaFrenaAdentro, `de adentro, «${casa.avisoAdentro}»: E la cierra y frena`);
        ok(casa.sale, 'se vuelve a abrir desde adentro y se sale');
        ok(casa.subeEscalera && casa.arriba && casa.baja, `dos pisos: se sube por la escalera interior, se anda arriba y se baja por la puerta del pie (${JSON.stringify(casa)})`);
        ok(casa.subeDeCostado && casa.arribaDeCostado && casa.bajaDeCostado && casa.debajoFrena, 'con una pared al pie, la escalera se sube de costado; por debajo del lado alto no se la atraviesa');

        seccion('relax: el tabique con puerta y los encastres');
        const tab = await A(`
          A.limpiar(); const o = A.poner('tabique-puerta');
          A.ponerLocal(o, 0, -2.5); const cerrada = !A.caminarLocal(o, [[0, 2]], { trabado: 12 });
          A.ponerLocal(o, 0, -1.0); const aviso1 = A.aviso(); A.pulsarE();
          const pasa = A.caminarLocal(o, [[0, -1.0], [0, 2.2]]);
          A.caminarLocal(o, [[0, 1.2]]); const aviso2 = A.aviso(); A.pulsarE();
          const cerrada2 = !A.caminarLocal(o, [[0, -2]], { trabado: 12 });
          A.caminarLocal(o, [[0.2, 1.4]]); A.pulsarE();
          const vuelve = A.caminarLocal(o, [[0, 1.0], [0, -2.2]]);
          const enc = [];
          for (const id of ['pared-modular', 'pared-puerta', 'cerco', 'seto', 'pasarela', 'senda-piedra']) {
            A.limpiar(); const a = A.poner(id), L = a.plano.snap.largo, q = A.mundo(a, L + 0.35, 0.3);
            const c = A.construir(id, q.x, q.z, 0); if (!c.ok) { enc.push({ id, error: c.error }); continue; }
            const b = A.obra(c.i), f = A.mundo(a, L / 2, 0), i = A.mundo(b, -L / 2, 0);
            enc.push({ id, junta: Math.round(Math.hypot(f.x - i.x, f.z - i.z) * 1000) / 1000 });
          }
          return { cerrada, aviso1, pasa, aviso2, cerrada2, vuelve, enc };`);
        ok(tab.cerrada && /Abrir/.test(tab.aviso1) && tab.pasa && /Cerrar/.test(tab.aviso2) && tab.cerrada2 && tab.vuelve, `tabique con puerta: E de los dos lados y se pasa con la hoja abierta (${JSON.stringify(tab)})`);
        ok(tab.enc.every((e) => e.junta < 0.05), `los tramos se encadenan punta con punta (${JSON.stringify(tab.enc)})`);

        seccion('relax: una escalera de acceso no queda colgando en la ladera');
        const lad = await A(`
          A.limpiar();
          const s = A.buscarSitio('piso-modular', 0.2, 0.34); if (!s) return { sin: true };
          const n = T.normal(s.x, s.z), rot = Math.round(Math.atan2(n.x, n.z) / (Math.PI / 2)) * (Math.PI / 2) + Math.PI;
          const piso = A.construir('piso-modular', s.x, s.z, rot), po = A.obra(piso.i);
          const q = A.mundo(po, 0, -2.37), e = A.construir('escalera-modular', q.x, q.z, po.datos.rot, po.datos.y + 0.285);
          if (!e.ok) return { rechazo: e.error };
          const s2 = A.subir(po, [[0, -4.6], [0, -3.0], [0, 0]], 0.285);
          return { sube: s2.ok, s2 };`);
        ok(lad.sin || lad.sube || /colgando/.test(lad.rechazo || ''), `en la ladera, o se sube o se rechaza con motivo (${JSON.stringify(lad)})`);
        const techo = await A(`
          // un techo no se levanta sobre un tablado ajeno (el andén de la estación, un muelle)
          const P = A.PL('techo-modular');
          for (const q of H.col.plataformas) {
            if (q.duenio || q.radio !== undefined || q.largo < 3 || q.ancho < 3 || q.alto < T.altura(q.x, q.z) + 0.3) continue;
            const r = O.revisarSitio(q.x, q.z, P, 0);
            return { alto: Math.round((q.alto - T.altura(q.x, q.z)) * 100) / 100, ok: r.ok, motivo: r.motivo || '' };
          }
          return { sin: true };`);
        ok(techo.sin || (!techo.ok && /piso construido/.test(techo.motivo)), `un techo pide un piso tuyo, no cualquier tablado (${JSON.stringify(techo)})`);

        seccion('relax: lo que se usa con E se alcanza caminando');
        const usos = await A(`
          const lista = [['colmena', /colmena|miel|abejas/i], ['ahumadero', /ahumadero|trucha/i], ['vivero', /vivero|almácigo|plant/i], ['lenera', /leñera|tronco/i], ['horno', /horn/i],
            ['buzon', /buzón/i], ['molino-agua', /molino|muela|harina/i], ['aserradero', /aserradero|tronco|tabla/i], ['estacion-meteo', /pronóstico|radio/i], ['radio-refugio', /radio/i],
            ['tendal', /tendal|colgar/i], ['cantero', /cantero|sembrar/i], ['gallinero', /huevo|nidal|gallin/i], ['telar', /tej|telar/i], ['acopio', /acopio/i], ['poste-tirolesa', /tirolesa/i]];
          const out = [];
          A.sinObjetos(true);
          for (const [id, re] of lista) {
            A.limpiar(); const o = A.poner(id); const d = (o.plano.radio || 1.5) + 3; let bien = 0; const avisos = [];
            for (const [ax, az] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
              A.ponerLocal(o, ax * (d + 30), az * (d + 30)); A.aviso();
              A.ponerLocal(o, ax * d, az * d); A.caminarLocal(o, [[ax * 0.05, az * 0.05]], { trabado: 10, max: 300 });
              // el aviso lo puede tapar alguien que pasa (un vecino); lo que decide E es la misma búsqueda
              const av = A.avisoAbajo(); avisos.push(av);
              if (re.test(av) || H.__obraQueTrabajaCerca?.() === o) bien++;
            }
            out.push({ id, bien, avisos: bien ? undefined : avisos });
          }
          A.sinObjetos(false);
          return out;`);
        const noAlcanzan = usos.filter((u) => u.bien < 1);
        ok(!noAlcanzan.length, `${usos.length} obras que se usan con E se alcanzan caminando (sin alcance: ${JSON.stringify(noAlcanzan)})`);
      } else {
        // ---------------------------------------------------------------- el fortín
        seccion('desafío: adarve, torre, pasarela colgante, puente y portón, caminando');
        const f = await A(`
          const out = {};
          A.limpiar(); let o = A.poner('adarve');
          out.adarve = A.subir(o, [[0, -4.4], [0, -3.3], [0, -0.7], [0, 0], [1.2, 0], [-1.2, 0]], 2.06);
          A.caminarLocal(o, [[0, 0], [0, 1.4]], { trabado: 12 }); out.barandaAdarve = A.dy(o) > 1.9;
          out.bajaAdarve = A.caminarLocal(o, [[0, -0.6], [0, -3.4], [0, -4.4]]);
          const P = A.mundo(o, 4.6, 0); const pa = A.construir('pasarela-colgante', P.x, P.z, (o.datos.rot || 0) + Math.PI / 2);
          A.subir(o, [[0, -4.4], [0, -3.3], [0, -0.7], [0, 0]], 2.06);
          out.pasarela = pa.ok && A.caminarLocal(o, [[1.4, 0], [4.6, 0], [7.4, 0]]) && Math.abs(A.dy(o) - 2.05) < 0.15;
          A.limpiar(); o = A.poner('torre-vigia'); out.torre = A.subir(o, [[1.6, 3.4], [1.6, 1.6], [1.6, -0.9], [0.6, -0.6], [0, 0]], 2.42);
          A.limpiar(); o = A.poner('torre-vigia', 0.15, 0.3); out.torreLadera = A.subir(o, [[1.6, 3.4], [1.6, 1.6], [1.6, -0.9], [0.6, -0.6], [0, 0]], 2.42);
          A.limpiar(); o = A.poner('puente-levadizo');
          A.ponerLocal(o, 0, -2.0); out.puenteSubidoFrena = !A.caminarLocal(o, [[0, 2.5]], { trabado: 12 });
          A.ponerLocal(o, 1.6, -1.2); A.caminarLocal(o, [[0.5, -1.0]], { trabado: 12 }); out.avisoPuente = A.aviso(); A.pulsarE(); A.correr(40);
          A.ponerLocal(o, 0, -1.0); out.puenteBajado = A.caminarLocal(o, [[0, 0.8], [0, 3.6]]) && Math.abs(A.dy(o) - 0.36) < 0.15;
          const e = O.iniciarEdicionCerca({ x: o.datos.x, y: o.datos.y, z: o.datos.z }, 5); A.correr(); out.puenteEnEdicion = A.fisica(o); if (e.ok) O.cancelarEdicion(); A.correr();
          out.portones = [];
          for (const id of ['porton-empalizada', 'porton-reforzado']) {
            A.limpiar(); o = A.poner(id); const r = { id };
            A.ponerLocal(o, 0, -3); r.cerrado = !A.caminarLocal(o, [[0, 2]], { trabado: 12 });
            A.ponerLocal(o, 0, -1.2); r.aviso = A.aviso(); A.pulsarE();
            r.abre = A.caminarLocal(o, [[0, 2.5]]);
            A.caminarLocal(o, [[0, 1.2]]); A.pulsarE(); r.cierraDelOtroLado = !A.caminarLocal(o, [[0, -2]], { trabado: 12 });
            out.portones.push(r);
          }
          A.limpiar(); o = A.poner('puesto-tirador'); A.ponerLocal(o, 0, -3); out.detrasDelParapeto = A.caminarLocal(o, [[0, -0.2], [0, 0.3]]);
          return out;`);
        ok(f.adarve.ok && f.barandaAdarve && f.bajaAdarve, `adarve: se sube, la baranda frena y se baja (${JSON.stringify(f.adarve)})`);
        ok(f.pasarela, 'desde el adarve se cruza la pasarela colgante');
        ok(f.torre.ok && f.torreLadera.ok, `torre de vigía: se sube caminando, en el llano y en la ladera (${JSON.stringify([f.torre, f.torreLadera])})`);
        ok(f.puenteSubidoFrena && /Bajar/.test(f.avisoPuente) && f.puenteBajado, `puente levadizo: subido frena, «${f.avisoPuente}», bajado se cruza`);
        ok(f.puenteEnEdicion.obs + f.puenteEnEdicion.plats === 0, `moviéndolo, el tablero no deja pared invisible (${JSON.stringify(f.puenteEnEdicion)})`);
        ok(f.portones.every((r) => r.cerrado && /Abrir/.test(r.aviso) && r.abre && r.cierraDelOtroLado), `portones: cerrado frena, E abre, se pasa y del otro lado E cierra (${JSON.stringify(f.portones)})`);
        ok(f.detrasDelParapeto, 'se entra al puesto de tirador por atrás');

        seccion('desafío: lo que se usa con E se alcanza caminando');
        const usos = await A(`
          const lista = [['catapulta', /catapulta/i, (o) => { o.datos.piedras = 0; }], ['troncos-colgantes', /colgar/i, (o) => { o.datos.armada = false; }], ['trampa-lazo', /lazo/i, (o) => { o.datos.armada = false; }],
            ['abrojos', /abrojos/i], ['rampa-troncos', /rampa|tronco/i], ['armero', /armero/i, () => { H.progreso.desafio.flechas = 0; H.progreso.cosas.arco = 1; }], ['adarve', /resina/i], ['zanja-fuego', /zanja/i]];
          const out = [];
          A.sinObjetos(true);
          for (const [id, re, prep] of lista) {
            A.limpiar(); const o = A.poner(id); if (prep) prep(o); A.correr(); const d = (o.plano.radio || 1.5) + 3; let bien = 0; const avisos = [];
            for (const [ax, az] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
              A.ponerLocal(o, ax * (d + 30), az * (d + 30)); A.aviso();
              A.ponerLocal(o, ax * d, az * d); A.caminarLocal(o, [[ax * 0.05, az * 0.05]], { trabado: 10, max: 300 });
              // el aviso lo puede tapar un compañero que mira (Ramón, Ema); lo del fortín lo resuelve la misma búsqueda de E
              const av = A.avisoAbajo(); avisos.push(av);
              if (re.test(av) || re.test(H.desafio.avisoCercaDe(H.jugador.estado.pos, Infinity) || '')) bien++;
              if (prep) prep(o);
            }
            out.push({ id, bien, avisos: bien ? undefined : avisos });
          }
          A.sinObjetos(false);
          return out;`);
        const noAlcanzan = usos.filter((u) => u.bien < 1);
        ok(!noAlcanzan.length, `${usos.length} defensas que se usan con E se alcanzan caminando (sin alcance: ${JSON.stringify(noAlcanzan)})`);

        seccion('desafío: un invasor trabado le pega a la pared, no a lo que pisa');
        const trab = await A(`
          const escenario = (piso, pared, lzPiso) => {
            A.limpiar();
            const s = A.buscarSitio('losa-piedra', 0, 0.05);
            const po = A.obra(A.construir(pared, s.x, s.z, 0).i);
            const q = A.mundo(po, 0, lzPiso); const c = A.construir(piso, q.x, q.z, 0); if (!c.ok) return { piso, error: c.error };
            const js = H.jugador.estado, lado = A.mundo(po, 0, 9), ini = A.mundo(po, 0, lzPiso);
            const a = H.desafio.invocar('rastreador', ini.x, ini.z); if (!a) return { piso, error: 'sin invasor' };
            a.vida = a.vidaMax = 5000;
            let blanco = null;
            for (let i = 0; i < 400 && !blanco; i++) { js.pos.set(lado.x, T.altura(lado.x, lado.z), lado.z); H.desafio.actualizar(0.05, { noche: 1, dtReal: 0.05 }); if (a.estado === 'romper' && a.obra) blanco = a.obra.plano.id; }
            a.estado = 'irse'; a.t = 9; H.desafio.actualizar(0.05, { noche: 0, dtReal: 0.05 });
            return { piso, pared, blanco };
          };
          H.progreso.horas = 23;
          const out = [escenario('losa-piedra', 'empalizada', -1.9), escenario('abrojos', 'muro-piedra', -2.8), escenario('piso-modular', 'muro-piedra', -2.0), escenario('foso-estacas', 'empalizada', -1.2)];
          H.progreso.horas = 11;
          return out;`);
        ok(trab.every((t) => t.blanco === t.pared), `trabado contra la pared, rompe la pared (${JSON.stringify(trab)})`);
      }
    }
  } catch (e) {
    errores.push(`${donde}: ${e.message}`);
  } finally {
    if (copiaStorage) {
      await js(`(()=>{ const c = JSON.parse(${JSON.stringify(copiaStorage)});
        localStorage.clear(); for (const [k, v] of Object.entries(c)) localStorage.setItem(k, v);
        Storage.prototype.setItem = () => {}; Storage.prototype.removeItem = () => {}; Storage.prototype.clear = () => {}; return 1 })()`).catch(() => {});
    }
  }
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  console.log('OK humo 3.0.1 · todas las obras: se arman, se mueven, se desmontan, se entran y se suben caminando');
  app.exit(0);
});

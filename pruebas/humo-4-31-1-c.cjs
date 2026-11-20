// Partida real 4.31.1 (C): cacería de bugs del mundo, la física y la naturaleza. Barre el mapa entero buscando cosas adentro de
// construcciones o debajo de pisos (piedritas, piñas, leña suelta, árboles, matas), caídas fuera del mapa, y recorre lo nuevo de la
// 4.31.0 (C) con invierno, nieve, noche, Ultra, a caballo y en el Desafío, mirando la consola.
// Uso (después de `node armar.mjs`), con el candado de Electron tomado y minimizado:
//   powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-4-30-1-a.ps1 -Script pruebas\humo-4-31-1-c.cjs -Perfil perfil-4311-c
//   HUMO_PARTES=dentro,caidas,puente,invierno,caballo,desafio · HUMO_SALIDA=<carpeta> · HTML=<otra página>
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.env.HUMO_SALIDA || path.join(raiz, 'pruebas', 'salidas', 'humo-4-31-1-c'));
const ANCHO = 1366, ALTO = 768;
fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('ERROR: la prueba tardó más de 20 minutos'); try { app.exit(2); } catch { process.exit(2); } }, 20 * 60 * 1000).unref?.();
const PARTES = (process.env.HUMO_PARTES || 'dentro,caidas,puente,invierno,caballo,desafio').split(',');
const parte = (p) => PARTES.includes(p);

const PAGINA = String.raw`(() => {
  const H = window.__hojarasca, P = H.progreso, T = H.T, J = H.jugador;
  const N = window.__N = {};
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  H.ajustes.limiteFps = 'libre';
  N.nat = () => (H.__naturaleza ? H.__naturaleza() : null);
  N.programas = () => H.renderer.info.programs.length;
  N.tick = async (seg = 0.5) => { const t0 = performance.now(); while (performance.now() - t0 < seg * 1000) { H.__bucle(); await dormir(14); } return 1; };
  N.abajo = (code) => document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true, cancelable: true }));
  N.arriba = (code) => document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true }));
  N.soltarTodo = () => { for (const c of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'Space', 'KeyC']) N.arriba(c); return 1; };
  N.tarjeta = () => { const v = document.getElementById('valle-tarjeta'); return !!v && !v.classList.contains('oculto'); };
  N.pararseMirando = async (x, z, mx, mz, pitch = -0.15) => { N.soltarTodo(); const yaw = Math.atan2(-(mx - x), -(mz - z)); J.ubicar(x, z, yaw); J.estado.pitch = pitch; J.estado.sentado = false; J.estado.agachado = !!N.agachar; await N.tick(0.5); J.estado.yaw = yaw; J.estado.pitch = pitch; await N.tick(0.4); return 1; };
  N.aviso = () => { const a = H.__avisoYa(); return a ? a.tecla + ' · ' + a.texto : ''; };
  N.cands = () => { const c = N.nat()._debug.candidatos(J.estado); return Object.keys(c).join(',') + ' · pos ' + J.estado.pos.x.toFixed(1) + ',' + J.estado.pos.z.toFixed(1) + ' pitch ' + J.estado.pitch.toFixed(2) + ' yaw ' + J.estado.yaw.toFixed(2); };
  N.e = async () => { N.abajo('KeyE'); await N.tick(0.05); N.arriba('KeyE'); return 1; };
  // ¿(x, z) cae adentro de un obstáculo (círculo o pared) o debajo de un piso (una plataforma más alta que el suelo)?
  N.ocupado = (x, z, holgura = 0.05) => {
    for (const o of H.col.cercanos(x, z)) {
      if (o.despejado || o.sinTocon) continue;
      if (o.seg) { const ax = o.bx - o.ax, az = o.bz - o.az, l2 = ax * ax + az * az || 1; let u = ((x - o.ax) * ax + (z - o.az) * az) / l2; u = Math.max(0, Math.min(1, u)); if (Math.hypot(o.ax + ax * u - x, o.az + az * u - z) < (o.r || 0) + holgura) return 'pared' + (o.nombre ? ' ' + o.nombre : ''); }
      else if (Math.hypot(o.x - x, o.z - z) < (o.r || 0) + holgura) return 'obstaculo' + (o.nombre ? ' ' + o.nombre : '');
    }
    const p = H.col.plataformaBaja(x, z);
    if (p && p.alto > T.altura(x, z) + 0.25) return 'bajo un piso (' + (p.nombre || p.tipo || '?') + ' a ' + (p.alto - T.altura(x, z)).toFixed(2) + ' m)';
    return null;
  };
  return 1;
})()`;

app.whenReady().then(async () => {
  const errores = [];
  const { ipcMain } = require('electron');
  require(path.join(raiz, 'copias-main.cjs')).registrarCopias({ ipcMain, app });
  require(path.join(raiz, 'fotos-main.cjs')).registrarFotos({ ipcMain, app });
  const w = new BrowserWindow({ show: true, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { backgroundThrottling: false, preload: path.join(raiz, 'preload.cjs') } });
  w.setContentSize(ANCHO, ALTO);
  const consola = [];
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught|Shader Error|WebGLProgram/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) { errores.push(m.slice(0, 200)); consola.push(m.slice(0, 300)); }
  });
  let donde = 'carga';
  const js = (c, espera = 240000) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en ${espera / 1000} s (${donde})`)), espera))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const N = (c) => js(`(async () => { const H = window.__hojarasca, N = window.__N, P = H.progreso, T = H.T, J = H.jugador, nat = N.nat(); return (${c}); })()`);
  const url = process.env.HTML ? path.resolve(process.env.HTML) : path.join(raiz, 'index.html');
  const foto = async (nombre, seg = 0) => {
    if (seg) await N(`N.tick(${seg})`);
    try {
      const datos = await js(`(() => { const H = window.__hojarasca; H.__bucle(); return H.renderer.domElement.toDataURL('image/jpeg', 0.88); })()`);
      fs.writeFileSync(path.join(salida, nombre + '.jpg'), Buffer.from(datos.split(',')[1], 'base64'));
      console.log(`  (captura ${nombre}.jpg)`);
    } catch (e) { console.log(`  (captura ${nombre} no se pudo: ${e && e.message})`); }
  };
  const ajustes = (o) => `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify(Object.assign({calidad:'alta', clima:'despejado', musica:false, modo:'relax', relaxTipo:'libre', autoCalidad:false, guiaPrimerDia:false, estacion:'verano'}, ${JSON.stringify(o)}))); 1`;
  const esperarJuego = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!window.__hojarasca.jugador').catch(() => false)) return true; } return false; };
  const seccion = async (nombre, fn) => {
    if (!parte(nombre)) return;
    donde = nombre;
    console.log(`\n=== ${nombre}`);
    try { await fn(); } catch (err) { console.log('ERROR en', nombre + ':', err && err.stack || err); errores.push(`${nombre}: ${err && err.message || err}`); }
    await N('N.soltarTodo()').catch(() => 0);
    const fallas = await js('(() => { const C = window.__hojarasca && window.__hojarasca.__caidas; return C && C.fallas ? JSON.stringify(C.fallas()).slice(0, 600) : "" })()').catch(() => '');
    if (fallas && fallas !== '[]') { console.log('  FALLAS DEL JUEGO: ' + fallas); errores.push(nombre + ': fallas del juego ' + fallas.slice(0, 200)); }
    if (consola.length) { console.log('  CONSOLA: ' + consola.splice(0).join(' | ')); }
  };
  const entrar = async (aj) => {
    await w.loadFile(url, { search: '?debug=1' });
    await js(`localStorage.clear(); ${ajustes(aj)}`);
    await w.loadFile(url, { search: '?debug=1' });
    await js('window.__sinPausaPorBlur = true; 1');
    if (!(await esperarJuego())) throw new Error('el juego no cargó');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(3000);
    await js(PAGINA); await js('window.__sinPausaPorBlur = true; 1');
    await N('N.tick(2)');
    for (let k = 0; k < 6 && (await N('N.tarjeta()')); k++) { await N('(() => { const b = document.querySelector("#valle-tarjeta button[data-valle-opcion]"); if (b) b.click(); return 1 })()'); await N('N.tick(0.6)'); }
    await N('(async () => { const A = H.__aldeaMundo && H.__aldeaMundo(); if (A && A.listo) await A.listo(); return 1 })()');
    await N('N.tick(1)');
  };
  try {
    if (PARTES.some((p) => p !== 'desafio')) {
      await entrar({});
      await N('(() => { H.clima.estado.lluvia = 0; P.dia = 12; P.horas = 11.5; for (const k of ["chilco","notro","maqui","calafate","nire","maiten","amancay","coiron","arrayan","lenga","coihue","helecho","chaura","neneo"]) P.entradas[k] = P.entradas[k] || 1; return 1 })()');
      await N('N.tick(1)');
    }

    await seccion('dentro', async () => {
      // piedritas, piñas y leña suelta de todo el mapa: ¿alguna adentro de una pared, de un tronco o debajo de un piso?
      // (las reglas se reproducen con las funciones del juego, celda por celda)
      const s = await N(`(() => { const d = nat._debug, out = { piedras: 0, pilas: 0, malas: [] }; if (!d.sueloPiedra) return out;   // (la versión de antes no las expone)
        const azar = (i, j, sal) => 0;
        for (let x = -460; x <= 460; x += 3.5) for (let z = -460; z <= 460; z += 3.5) {
          const t = d.sueloPiedra(x, z); if (!t) continue; out.piedras++;
          const o = N.ocupado(x, z, 0.1); if (o && out.malas.length < 400) out.malas.push({ que: t, x: +x.toFixed(1), z: +z.toFixed(1), o });
        }
        for (let x = -460; x <= 460; x += 4) for (let z = -460; z <= 460; z += 4) {
          if (!d.lugarLena(x, z)) continue; out.pilas++;
          const o = N.ocupado(x, z, 0.5); if (o && out.malas.length < 800) out.malas.push({ que: 'lena', x, z, o });
        }
        return out; })()`);
      const tipos = {};
      for (const m of s.malas) { const k = m.que + ' · ' + m.o.replace(/[\d.]+ m\)/, 'm)'); tipos[k] = (tipos[k] || 0) + 1; }
      console.log(`  muestras de suelo con piedrita/piña: ${s.piedras}, con leña: ${s.pilas}; adentro de algo: ${s.malas.length}`);
      for (const [k, n] of Object.entries(tipos).sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(`    ${n} × ${k}`);
      console.log('  ejemplos: ' + JSON.stringify(s.malas.slice(0, 12)));
      fs.writeFileSync(path.join(salida, 'dentro.json'), JSON.stringify(s.malas, null, 1));
      // las que el juego pone de verdad (pila o piedrita de una celda) adentro de algo
      const reales = await N(`(async () => { const out = []; const vistos = new Set();
        for (let x = -440; x <= 440; x += 24) for (let z = -440; z <= 440; z += 24) {
          if (T.agua(x, z)) continue;
          J.ubicar(x, z, 0); nat.actualizar(0.6);
          for (const p of nat._debug.piedras) { if (vistos.has(p.id)) continue; vistos.add(p.id); const o = N.ocupado(p.x, p.z, 0.08); if (o) out.push({ que: p.tipo, id: p.id, x: +p.x.toFixed(1), z: +p.z.toFixed(1), o }); }
          for (const l of nat._debug.pilas) { if (vistos.has(l.id)) continue; vistos.add(l.id); const o = N.ocupado(l.x, l.z, 0.5); if (o) out.push({ que: 'lena', id: l.id, x: +l.x.toFixed(1), z: +l.z.toFixed(1), o }); }
        }
        return { n: vistos.size, out }; })()`);
      console.log(`  de verdad: ${reales.n} piedritas/pilas vistas; adentro de algo: ${reales.out.length}`);
      for (const m of reales.out.slice(0, 30)) console.log('    ' + JSON.stringify(m));
      fs.writeFileSync(path.join(salida, 'dentro-reales.json'), JSON.stringify(reales.out, null, 1));
      // árboles y matas atravesados por paredes o debajo de pisos
      const veg = await N(`(() => { const out = [];
        for (const a of H.veg.arboles) { if (a.sacado || a.caido) continue; const o = N.ocupado(a.x, a.z, -0.02); if (o && /pared|bajo un piso/.test(o)) out.push({ que: 'arbol ' + a.especie, x: +a.x.toFixed(1), z: +a.z.toFixed(1), o }); }
        for (const m of H.veg.matas) { if (m.sacado || m.despejado) continue; const o = N.ocupado(m.x, m.z, 0.15); if (o && /pared|bajo un piso/.test(o)) out.push({ que: 'mata ' + m.tipo, x: +m.x.toFixed(1), z: +m.z.toFixed(1), o }); }
        return out; })()`);
      console.log(`  árboles y matas en paredes o bajo pisos: ${veg.length}`);
      for (const m of veg.slice(0, 40)) console.log('    ' + JSON.stringify(m));
      fs.writeFileSync(path.join(salida, 'dentro-veg.json'), JSON.stringify(veg, null, 1));
    });

    await seccion('caidas', async () => {
      // de punta a punta del mapa: aparecer, caminar un poco y ver que sigas arriba del suelo (o en el agua) y sin números raros
      // (de a una fila por pedido: con la PC ocupada, todo junto pasaba los 4 minutos de espera)
      const r = { n: 0, out: [] };
      for (let x = -440; x <= 440; x += 55) {
        const f = await N(`(async () => { const out = []; let n = 0;
        for (let z = -440; z <= 440; z += 55) { const x = ${x};
          J.ubicar(x, z, Math.random() * 6.28); n++;
          N.abajo('KeyW'); N.abajo('ShiftLeft');
          for (let k = 0; k < 40; k++) H.__bucle();
          N.soltarTodo();
          const e = J.estado, h = T.altura(e.pos.x, e.pos.z), ag = T.agua(e.pos.x, e.pos.z);
          const bien = Number.isFinite(e.pos.x + e.pos.y + e.pos.z) && e.pos.y > h - 0.6 - (ag ? 3 : 0) && Math.abs(e.pos.x) < 600 && Math.abs(e.pos.z) < 600;
          if (!bien) out.push({ desde: [x, z], pos: [e.pos.x, e.pos.y, e.pos.z].map((v) => +(+v).toFixed(2)), suelo: +h.toFixed(2), agua: !!ag });
        }
        return { n, out }; })()`);
        r.n += f.n; r.out.push(...f.out);
      }
      console.log(`  ${r.n} lugares; mal: ${r.out.length}`);
      for (const m of r.out.slice(0, 20)) console.log('    ' + JSON.stringify(m));
      ok(r.out.length === 0, 'nadie se cae del mapa');
    });

    await seccion('puente', async () => {
      // las piedritas debajo de un piso (un puente, un andén, un muelle): ¿se patean desde arriba?
      const L = await N(`(async () => { const out = [];
        for (let x = -440; x <= 440 && out.length < 6; x += 24) for (let z = -440; z <= 440 && out.length < 6; z += 24) {
          J.ubicar(x, z, 0); nat.actualizar(0.6);
          for (const p of nat._debug.piedras) { const pl = H.col.plataformaBaja(p.x, p.z); if (pl && pl.alto > T.altura(p.x, p.z) + 0.6 && !out.some((o) => o.id === p.id)) out.push({ id: p.id, x: p.x, z: p.z, alto: pl.alto, suelo: T.altura(p.x, p.z) }); }
        }
        return out; })()`);
      console.log('  piedritas debajo de un piso: ' + JSON.stringify(L.slice(0, 6)));
      if (!L.length) return;
      const p = L[0];
      // caminar por arriba del piso hacia la piedrita
      const p2 = L.find((q) => q.alto - q.suelo > 1.2) || p;
      Object.assign(p, p2);
      await N(`(J.ubicar(${p.x + 1.2}, ${p.z}, Math.atan2(1.2, 0)), J.estado.pos.y = ${p.alto}, N.tick(0.4))`);
      const y = await N('J.estado.pos.y');
      console.log(`  parado arriba a y ${y.toFixed(2)} (la piedra a ${p.suelo.toFixed(2)})`);
      await foto('puente-0-arriba');
      await N(`(() => { const e = J.estado; e.pos.y = ${p.alto}; e.enSuelo = true; e.pos.x = ${p.x} + 0.3; e.pos.z = ${p.z}; e.vel.x = -3; e.vel.z = 0; e.corriendo = false; for (let k = 0; k < 20; k++) nat.actualizar(1 / 60); return 1 })()`);
      const q = await N(`(() => { const q = nat._debug.piedras.find((o) => o.id === ${JSON.stringify(p.id)}); return q ? { x: q.x, z: q.z, mueve: q.mueve } : null })()`);
      const mov = q ? Math.hypot(q.x - p.x, q.z - p.z) : 0;
      console.log(`  la piedrita de abajo se movió ${mov.toFixed(2)} m`);
      ok(mov < 0.05, `la piedrita de abajo del piso no se patea desde arriba (parado a ${(y - p.suelo).toFixed(2)} m sobre ella)`);
    });

    await seccion('sapito', async () => {
      // una orilla con poca agua adelante (entre 7 y 13 m, y después tierra): con nueve saltos, ¿la piedra pica en la tierra de enfrente?
      const L = await N(`(() => { const out = [];
        for (let x = -440; x <= 440 && out.length < 40; x += 3) for (let z = -440; z <= 440 && out.length < 40; z += 3) {
          if (T.agua(x, z) || !T.agua(x + 1.5, z) || T.pendiente[T.indice(x, z)] > 0.3) continue;
          let s = 1.5; while (s < 30 && T.agua(x + s, z)) s += 0.5;
          if (s > 8.5 && s < 14) out.push({ x, z, ancho: s });
        }
        return out; })()`);
      console.log(`  orillas angostas: ${L.length}`);
      let probadas = 0, enTierra = 0, ondas = 0;
      for (const o of L) {
        await N(`(N.agachar = true, N.pararseMirando(${o.x}, ${o.z}, ${o.x + 10}, ${o.z}, -0.05))`);
        const av = await N('N.aviso()');
        if (!/sapito/.test(av)) continue;
        const r = await N(`(async () => { const M = nat.mundo, a0 = M.anillo, marcas = []; M.anillo = (x, z, nv, op) => { marcas.push([x, z]); return a0(x, z, nv, op); };
          const az = Math.random; Math.random = () => 0.99; try { await N.e(); } finally { Math.random = az; }
          await N.tick(3); M.anillo = a0; return { n: marcas.length, tierra: marcas.filter(([x, z]) => !T.agua(x, z)).length }; })()`);
        probadas++; enTierra += r.tierra; ondas += r.n;
        if (r.tierra && !(await N('N.yaFoto'))) { await N('(N.yaFoto = 1)'); }
        if (probadas === 1) await foto('sapito-angosto', 0.01);
        if (probadas >= 3) break;
      }
      await N('(N.agachar = false, J.estado.agachado = false, 1)');
      console.log(`  ${probadas} tiros de nueve saltos en orillas angostas: ${ondas} ondas, ${enTierra} en la tierra de enfrente`);
      ok(probadas > 0 && enTierra === 0, `el sapito no pica en tierra (${enTierra} de ${ondas})`);
    });

    await seccion('tronco', async () => {
      // los atados de leña que la barrida de antes encontró metidos en un tronco: mirarlos de cerca
      for (const [i, [x, z]] of [[-410.8, 363.7], [-407.8, 124.6], [-380.3, -123.7]].entries()) {
        await N(`(() => { J.ubicar(${x} + 2.2, ${z} + 1.2, 0); nat.actualizar(0.6); return 1 })()`);
        await N(`N.pararseMirando(${x} + 2.2, ${z} + 1.2, ${x}, ${z}, -0.5)`);
        const hay = await N(`nat._debug.pilas.filter((l) => Math.hypot(l.x - ${x}, l.z - ${z}) < 0.6).length`);
        console.log(`  leña en (${x}, ${z}): ${hay ? 'está' : 'no está'}`);
        await foto(`tronco-${i}`);
      }
    });

    await seccion('flota', async () => {
      // árboles en pendiente: el tronco nace 25 cm bajo el suelo del centro; ¿cuánto queda en el aire del lado de abajo?
      const r = await N(`(() => { const out = []; let n = 0;
        for (const a of H.veg.arboles) { if (a.sacado || a.caido) continue; n++;
          const rt = Math.max(0.15, (a.r || 0.4) - 0.12); let min = Infinity;
          for (let k = 0; k < 8; k++) { const an = k / 8 * 6.283; min = Math.min(min, T.altura(a.x + Math.cos(an) * rt, a.z + Math.sin(an) * rt)); }
          const hueco = (a.pie ?? a.y - 0.25) - min; if (hueco > 0.05) out.push({ x: +a.x.toFixed(1), z: +a.z.toFixed(1), especie: a.especie, esc: +(a.esc || 1).toFixed(2), r: +rt.toFixed(2), hueco: +hueco.toFixed(2) }); }
        out.sort((p, q) => q.hueco - p.hueco); return { n, out: out.slice(0, 30), cuantos: out.length, mas10: out.filter((o) => o.hueco > 0.1).length, mas25: out.filter((o) => o.hueco > 0.25).length, adentro: out.filter((o) => o.hueco > 0.1 && Math.abs(o.x) < 440 && Math.abs(o.z) < 440).length }; })()`);
      console.log(`  ${r.n} árboles; con el tronco en el aire del lado de abajo: ${r.cuantos} (más de 10 cm: ${r.mas10}, de ésos ${r.adentro} adentro del mapa caminable; más de 25 cm: ${r.mas25})`);
      for (const o of r.out.slice(0, 8)) console.log('    ' + JSON.stringify(o));
      const t = { x: -410.8, z: 363.7 };   // (el de la captura de la leña: un coihue del bosque, no del borde)
      if (t) { await N(`N.pararseMirando(${t.x} + 2.4, ${t.z} + 1.3, ${t.x}, ${t.z}, -0.35)`); await foto('flota-0'); console.log('  foto de ' + JSON.stringify(t)); }
    });

    await seccion('suelo', async () => {
      // el tronco de la captura de la leña (−410,8, 363,7): ¿dónde nace, dónde dice T.altura que está el suelo y dónde está el suelo dibujado?
      const r = await N(`(() => { const L = H.veg.arboles.filter((a) => Math.hypot(a.x + 410.8, a.z - 363.7) < 2.5);
        const rc = new H.THREE.Raycaster(); const out = [];
        for (const a of L) { const hits = [];
          for (const [dx, dz] of [[0, 0], [0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5]]) { rc.set(new H.THREE.Vector3(a.x + dx, a.y + 40, a.z + dz), new H.THREE.Vector3(0, -1, 0)); rc.far = 80;
            const h = rc.intersectObjects(H.escena.children, true).filter((i) => !i.object.isInstancedMesh && !i.object.isSprite && !i.object.isPoints).slice(0, 2).map((i) => (i.object.name || i.object.type) + ' ' + i.point.y.toFixed(2));
            hits.push({ dx, dz, T: +T.altura(a.x + dx, a.z + dz).toFixed(2), malla: hits.length ? undefined : 0, rayo: h }); }
          out.push({ x: +a.x.toFixed(2), z: +a.z.toFixed(2), y: +a.y.toFixed(2), pie: a.pie, esp: a.especie, esc: a.esc, r: a.r, hits }); }
        return out; })()`);
      console.log(JSON.stringify(r, null, 1));
    });

    await seccion('malla', async () => {
      // el suelo dibujado contra el que se pisa: 3000 lugares al azar (fuera de la aldea, que tiene su parche fino), un rayo contra la malla
      // del terreno y T.altura
      const r = await N(`(() => { const m = H.escena.getObjectByName('terreno'); const rc = new H.THREE.Raycaster(); const d = []; let s = 7;
        const az = () => (s = (s * 16807) % 2147483647) / 2147483647;
        for (let k = 0; k < 3000; k++) { const x = (az() - 0.5) * 860, z = (az() - 0.5) * 860; if (Math.hypot(x - 40, z + 339) < 200) continue;
          rc.set(new H.THREE.Vector3(x, 300, z), new H.THREE.Vector3(0, -1, 0)); rc.far = 600; const h = rc.intersectObject(m, false)[0]; if (h) d.push(Math.abs(h.point.y - T.altura(x, z))); }
        d.sort((a, b) => a - b); const q = (f) => +d[Math.floor(d.length * f)].toFixed(3); return { n: d.length, mediana: q(0.5), p95: q(0.95), p99: q(0.99), max: +d[d.length - 1].toFixed(2) }; })()`);
      console.log('  suelo dibujado contra el que se pisa: ' + JSON.stringify(r));
      await N(`N.pararseMirando(-405, 360, -420, 372, -0.25)`);
      await foto('malla-ladera');
    });

    await seccion('plano', async () => {
      // el plano gris verdoso a 18,15 m que corta los troncos en (−410, 363): ¿qué es?
      const r = await N(`(() => { const rc = new H.THREE.Raycaster(); rc.set(new H.THREE.Vector3(-410.8, 60, 363.2), new H.THREE.Vector3(0, -1, 0)); rc.far = 100;
        return rc.intersectObjects(H.escena.children, true).slice(0, 6).map((i) => { const o = i.object, g = o.geometry; g.computeBoundingBox && !g.boundingBox && g.computeBoundingBox(); const b = g.boundingBox;
          let cad = []; for (let p = o; p; p = p.parent) cad.push((p.name || p.type)); 
          return { y: +i.point.y.toFixed(2), tipo: o.type, nombre: o.name, cadena: cad.join(' < '), geo: g.type, caja: b ? [b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z].map((v) => +v.toFixed(1)) : null, pos: [o.position.x, o.position.y, o.position.z].map((v) => +v.toFixed(1)), mat: o.material && (o.material.name || o.material.type), color: o.material && o.material.color ? o.material.color.getHexString() : '', transparente: !!(o.material && o.material.transparent), vis: o.visible, orden: o.renderOrder, ud: Object.keys(o.userData || {}).join('/') }; }); })()`);
      console.log(JSON.stringify(r, null, 1));
      console.log('  agua ahí: ' + JSON.stringify(await N('T.agua(-410.8, 363.2)')) + ' · altura ' + (await N('T.altura(-410.8, 363.2)')));
    });

    await seccion('esquina', async () => {
      // las esquinas del valle (a más de 520 m del centro): ¿se ve el piso de la cordillera por encima del suelo?
      const r = await N(`(() => { const cord = []; H.escena.traverse((o) => { if (o.renderOrder === 899 && o.isMesh) cord.push(o); }); const rc = new H.THREE.Raycaster(); let n = 0, arriba = 0, peor = 0, ej = null;
        for (let x = -440; x <= 440; x += 8) for (let z = -440; z <= 440; z += 8) { if (Math.hypot(x, z) < 520) continue; n++;
          rc.set(new H.THREE.Vector3(x, 400, z), new H.THREE.Vector3(0, -1, 0)); rc.far = 800; const h = rc.intersectObjects(cord, false)[0];
          const t = T.altura(x, z); if (h && h.point.y > t + 0.05) { arriba++; if (h.point.y - t > peor) { peor = h.point.y - t; ej = { x, z, suelo: +t.toFixed(1), cordillera: +h.point.y.toFixed(1) }; } } }
        return { n, arriba, peor: +peor.toFixed(1), ej }; })()`);
      console.log('  esquinas: ' + JSON.stringify(r));
      ok(r.arriba === 0, `el piso de la cordillera no asoma en el valle (${r.arriba} de ${r.n})`);
      await N(`N.pararseMirando(-405, 360, -420, 372, -0.25)`);
      await foto('esquina-0');
      await N(`N.pararseMirando(330, 372, 352, 400, -0.12)`);
      await foto('esquina-1');
    });

    await seccion('mata', async () => {
      // la mata que la barrida encontró metida en una pared
      const info = await N(`(() => { const m = H.veg.matas.find((m) => Math.abs(m.x + 406.3) < 0.2 && Math.abs(m.z + 307.3) < 0.2); if (!m) return null; const os = H.col.cercanos(m.x, m.z).filter((o) => o.seg).map((o) => ({ ax: +o.ax.toFixed(1), az: +o.az.toFixed(1), bx: +o.bx.toFixed(1), bz: +o.bz.toFixed(1), r: o.r, claves: Object.keys(o).join('/') })); return { tipo: m.tipo, esc: m.esc, os } })()`);
      console.log('  ' + JSON.stringify(info));
      if (!info) return;
      await N(`N.pararseMirando(-406.3 + 5, -307.3 + 3, -406.3, -307.3, -0.3)`);
      await foto('mata-pared');
    });

    await seccion('avisos', async () => {
      // con el hacha, mirando un ñire chico: el aviso dice H (talar), no «Sacudir»; la E igual lo sacude
      await N('(P.cosas.hacha = true, 1)');
      const a = await N(`(() => { const L = H.veg.arboles.filter((a) => (a.especie === 'nire' || a.especie === 'maiten' || a.especie === 'arrayan') && (a.esc || 1) <= 0.95 && !a.sacado && Math.hypot(a.x - 40, a.z + 339) > 260 && T.pendiente[T.indice(a.x, a.z)] < 0.25);
        for (const c of L) { const x = c.x + c.r + 1.0, z = c.z; if (!T.agua(x, z) && !H.veg.arbolesCerca(x, z, 2.5).filter((b) => b !== c).length && !H.veg.matasCerca(x, z, 3.6).length) return { x: c.x, z: c.z, r: c.r, especie: c.especie }; } return null; })()`);
      if (!a) { console.log('  (no hay árbol chico)'); return; }
      console.log('  árbol: ' + JSON.stringify(a));
      await N(`N.pararseMirando(${a.x + a.r + 1.0}, ${a.z}, ${a.x}, ${a.z}, 0.2)`);
      const av = await N('N.aviso()');
      console.log('  candidatos: ' + await N('N.cands ? N.cands() : ""'));
      ok(/^H · Talar/.test(av), `con el hacha, mirando el ${a.especie}: «${av}»`);
      await foto('avisos-hacha');
      await N('(P.cosas.hacha = false, 1)');
      const av2 = await N('N.aviso()');
      ok(/^E · Sacudir/.test(av2), `sin el hacha: «${av2}»`);
    });

    await seccion('invierno', async () => {
      // invierno, nevando, de noche, con Ultra: sacudir, tocar el agua, nadar y salir; nada a la consola
      await N(`(() => { H.ajustes.estacion = 'invierno'; P.horas = 23; H.clima.estado.lluvia = 0.8; return 1 })()`);
      await N('N.tick(2)');
      const m = await N(`(() => { const L = H.veg.matas.filter((m) => m.tipo === 'chilco' && !m.sacado && !m.despejado && !T.agua(m.x, m.z) && T.pendiente[T.indice(m.x, m.z)] < 0.25 && Math.hypot(m.x - 40, m.z + 339) > 260); for (const c of L) { const x = c.x + 1.5, z = c.z; if (!T.agua(x, z) && !H.veg.matasCerca(x, z, 1.0).length && !N.ocupado(x, z, 0.4)) return { x: c.x, z: c.z }; } return null; })()`);
      if (m) { await N(`N.pararseMirando(${m.x + 1.5}, ${m.z}, ${m.x}, ${m.z}, -0.12)`); console.log('  aviso:', await N('N.aviso()'), '·', await N('N.cands()')); await N('N.e()'); await foto('invierno-arbusto', 0.3); }
      await N(`(J.ubicar(150, 110, 0), N.tick(1.2))`);
      ok(await N('J.estado.nadando'), 'en invierno en el lago se nada');
      await N(`(J.ubicar(150, 110 + 120, 0), N.tick(1.5))`);
      console.log('  avisos:', await N('H.__avisos().slice(-4).join(" | ")'));
    });

    await seccion('caballo', async () => {
      // montado: ni la E de la naturaleza ni patear; al bajar, sí
      const ok1 = await N(`(() => { try { const c = H.dondeEstaElCaballo && H.dondeEstaElCaballo(); return JSON.stringify(c) } catch (e) { return 'x ' + e.message } })()`);
      console.log('  caballo:', ok1);
    });

    await seccion('ultralog', async () => {
      // con Ultra: qué programa de la placa deja el aviso X3595 («gradient instruction used in a loop») y en qué línea del traducido
      await entrar({ ultra: true });
      for (const [x, z] of [[40.3 + 30 * Math.sin(2.99), -339.1 + 30 * Math.cos(2.99)], [150, 40], [-287, -266], [-200, 150], [183, 20]]) await N(`(J.ubicar(${x}, ${z}, 0.7), N.tick(2.5))`);
      await N('(P.horas = 22, H.clima.estado.lluvia = 0.9, N.tick(3))');
      const r = await N(`(() => { const gl = H.renderer.getContext(), dbg = gl.getExtension('WEBGL_debug_shaders'), out = [];
        for (const p of H.renderer.info.programs) { const log = gl.getProgramInfoLog(p.program) || ''; if (!/X3595|gradient/.test(log)) continue;
          const src = dbg && p.fragmentShader ? dbg.getTranslatedShaderSource(p.fragmentShader) : ''; const lineas = src.split(String.fromCharCode(10));
          const m = /[(]([0-9]+),/.exec(log); const n = m ? +m[1] : 0;
          out.push({ nombre: p.name, clave: String(p.cacheKey).slice(0, 160), log: log.slice(0, 200), linea: lineas.slice(Math.max(0, n - 8), n + 3).join(String.fromCharCode(10)), lineaV: (dbg && p.vertexShader ? dbg.getTranslatedShaderSource(p.vertexShader) : '').split(String.fromCharCode(10)).slice(Math.max(0, n - 6), n + 2).join(String.fromCharCode(10)), largo: lineas.length }); }
        return { programas: H.renderer.info.programs.length, out }; })()`);
      console.log(`  programas: ${r.programas}; con el aviso: ${r.out.length}`);
      for (const o of r.out) console.log(`  ${o.nombre} · ${o.clave} · ${o.largo} líneas\n  ${o.log}\nFRAG:\n${o.linea}\nVERT:\n${o.lineaV}`);
    });

    await seccion('desafio', async () => {
      await entrar({ modo: 'desafio' });
      ok(await N('!H.__naturaleza || !H.__naturaleza()'), 'en el Desafío no hay naturaleza que se toca');
      await N(`(J.ubicar(150, 230, 0), N.abajo('KeyW'), N.tick(3))`); await N('N.soltarTodo()');
    });
  } catch (err) { console.log('ERROR:', err && err.stack || err); errores.push(String(err && err.message || err)); }
  console.log(`\n${errores.length ? '✗ ' + errores.length + ' problemas:\n  ' + errores.join('\n  ') : '✓ todo bien'}`);
  app.exit(errores.length ? 1 : 0);
});

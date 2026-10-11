// 3.8.7 (duendes): partida real de La noche de los duendes (Electron + WebGL), segunda mirada.
//  1. Duendes trabados: con varios códigos de partida, noches enteras con la IA de verdad y el jugador en su base;
//     cada duende se sigue cada 5 s y se anota el que pasa 25 s sin moverse sin tener por qué (sin pelear, sin
//     romper, sin estar enredado ni colgado).
// Uso: HOJ_PERFIL=<carpeta> npx electron --no-sandbox -r ./herramientas/perfil-propio.cjs pruebas/humo-3-8-7-duendes.cjs
//   (CODIGOS=a,b,c para otros códigos; SOLO=trabados,... para una sección)
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const SOLO = process.env.SOLO ? process.env.SOLO.split(',') : null;
const toca = (n) => !SOLO || SOLO.includes(n);

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: false, width: 1024, height: 640, webPreferences: { backgroundThrottling: false } });
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(m.slice(0, 300));
  });
  let donde = 'carga';
  const js = (c, lim = 300000) => Promise.race([
    w.webContents.executeJavaScript(c),
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió (${donde})`)), lim)),
  ]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const url = path.join(raiz, 'index.html');
  const H = 'window.__hojarasca';
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const entrar = async () => {
    for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!window.__hojarasca && !!document.getElementById("btn-entrar")', 5000).catch(() => false)) break; }
    await js(`document.getElementById('btn-entrar').click(); 1`);
    await esperar(3000);
    await js(`${H}.ajustes.limiteFps = 'libre'; 1`);
  };
  const nueva = async (ajustes, antes = '') => {
    await abrir();
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', ${JSON.stringify(JSON.stringify({ calidad: 'muybaja', clima: 'despejado', musica: false, modo: 'desafio', autoCalidad: false, guiaPrimerDia: false, ...ajustes }))}); ${antes} 1`);
    await abrir(); await entrar();
  };

  try {
    // ---------------------------------------------------------------- 1. trabados
    if (toca('trabados')) {
      const codigos = (process.env.CODIGOS || 'LENGA-7,COIHUE-3,ZORRO-12,NIRE-44').split(',');
      for (const codigo of codigos) {
        seccion(`trabados · ${codigo}`);
        await nueva({});
        // el código de la partida: el mapa de esa semilla (la base, los puestos, las canteras)
        await js(`(()=>{ const H=${H}, D=H.progreso.desafio; D.semilla=${JSON.stringify(codigo)}; H.__sinFin.empezarMapa(); D.tutorial = 99; D.oleadas = 4; return 1 })()`);
        for (let noche = 0; noche < 2; noche++) {
          await js(`(()=>{ const H=${H}; H.progreso.dia++; H.progreso.horas=19.4; for(let i=0;i<30;i++){ H.progreso.horas+=0.01; H.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); } H.progreso.horas=20.49; const d=H.progreso.desafio; return { oleadas: d.oleadas, oleadaNoche: d.oleadaNoche, terminada: d.oleadaTerminada, dia: H.progreso.dia, victoria: !!d.victoria, alba: d.asedioAlAlba, nido: !!d.nido, salud: d.salud, caido: H.desafio.caido } })()`).then((x) => console.log("   antes: " + JSON.stringify(x)));
          // 4 minutos de noche, el jugador quieto en su base (la vida al tope); cada 5 s, dónde está cada uno
          const r = await js(`(()=>{ const H=${H}, D=H.desafio, J=H.jugador.estado, base={ x: J.pos.x, z: J.pos.z };
            const seg = new Map(), trabados = [];
            const resc = () => { const r = H.progreso.desafio.rescate; return r && !r.caido ? H.T.lugares[r.lugar] : null; };
            const ocupado = (a) => (H.progreso.desafio.varada && Math.hypot(a.m.g.position.x - J.pos.x, a.m.g.position.z - J.pos.z) > 14) || (resc() && Math.hypot(a.m.g.position.x - resc().x, a.m.g.position.z - resc().z) < (resc().radio || 4.5) + 3) || a.acecho === 'esconderse' || a.estado !== 'avanzar' || a.enredadoT > 0 || a.atrapadoT > 0 || a.colgadoT > 0 || a.dudaT > 0 || a.congeladoT > 0 || a.tanteoTotal > 0 || a.def.vuela || a.guardiaAsedio || a.puesto;
            for (let i = 0; i < 4800; i++) {
              H.progreso.desafio.salud = 1e5; J.pos.x = base.x; J.pos.z = base.z;
              H.progreso.horas += 0.05 * 24 / (30 * 60);
              D.actualizar(0.05, { noche: 1, dtReal: 0.05 });
              if (i % 100) continue;
              for (const a of D.aliens) {
                const p = a.m.g.position, d = Math.hypot(p.x - J.pos.x, p.z - J.pos.z);
                const s = seg.get(a) || { x: p.x, z: p.z, t: 0 };
                if (Math.hypot(p.x - s.x, p.z - s.z) > 1 || ocupado(a) || d < a.def.alcance + 2.5 || (a.def.aDistancia && d < a.def.alcance)) { s.x = p.x; s.z = p.z; s.t = 0; }
                else s.t += 5;
                seg.set(a, s);
                if (s.t === 25) trabados.push({ delante: (() => { const L = resc(), b = L && d > 14 ? L : J.pos, ang = Math.atan2(b.x - p.x, b.z - p.z), out = []; for (let k = 1; k <= 12; k += 1) { const w = H.T.agua(p.x + Math.sin(ang) * k, p.z + Math.cos(ang) * k); out.push(w ? (w.lago ? "L" : (w.prof).toFixed(1)) : "."); } return out.join(" "); })(), puente: Math.round(Math.min(...H.T.puentes.map((q) => Math.hypot(q.x - p.x, q.z - p.z)))), tipo: a.tipo, x: +p.x.toFixed(1), z: +p.z.toFixed(1), d: +d.toFixed(1), agua: !!H.T.agua(p.x, p.z), estado: a.estado, desvioT: +(a.desvioT || 0).toFixed(1), robo: !!a.robo, acecho: a.acecho, rescate: H.progreso.desafio.rescate ? H.progreso.desafio.rescate.lugar + " a " + Math.round(Math.hypot(p.x - H.T.lugares[H.progreso.desafio.rescate.lugar].x, p.z - H.T.lugares[H.progreso.desafio.rescate.lugar].z)) + " m" : null, varada: !!H.progreso.desafio.varada });
              }
            }
            return { trabados, vivos: D.aliens.filter((a) => a.estado !== 'morir' && a.estado !== 'irse').length, oleada: H.progreso.desafio.oleadas } })()`);
          console.log(`   noche ${r.oleada}: ${r.vivos} vivos al final; trabados: ${JSON.stringify(r.trabados)}`);
          ok(r.trabados.length === 0, `${codigo}, noche ${r.oleada}: ningún duende trabado (${r.trabados.length})`);
          await js(`(()=>{ const H=${H}; for (const a of H.desafio.aliens) { a.estado='irse'; a.t=9; } H.progreso.desafio.salud = 100; H.progreso.dia++; H.progreso.horas=6.5; for (let i=0;i<40;i++) H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); H.progreso.horas=12; return 1 })()`);
        }
      }
    }
    // ---------------------------------------------------------------- 2. el arsenal: cada arma gasta lo suyo, y guardar con armas en la mano
    if (toca('arsenal')) {
      seccion('arsenal');
      await nueva({});
      const MUN = { arco: 'flechas', ballesta: 'virotes', hachuela: 'hachuelas', jabalina: 'jabalinas', granada: 'granadas', humo: 'humos', bengala: 'bengalas', boleadoras: 'boleadoras', pistola: 'cargas' };
      const dar = `(()=>{ const H=${H}, P=H.progreso, D=P.desafio; P.cosas = P.cosas || {};
        for (const k of ['arco','lanza','honda','boleadoras','ballesta','facon','maza','arpon','hachuela','jabalina','granada','humo','bengala','cuerno','pistola','martillo']) P.cosas[k]=1;
        Object.assign(D, { flechas: 10, virotes: 10, hachuelas: 5, jabalinas: 5, granadas: 5, humos: 5, bengalas: 5, boleadoras: 5, cargas: 10, emplastos: 1, tutorial: 99 }); P.materiales.piedra = 10; P.horas = 12; return 1 })()`;
      await js(dar);
      const cuadros = (n) => js(`(()=>{ for (let i=0;i<${n};i++) ${H}.__bucle(); return 1 })()`);
      await cuadros(5);
      // cada arma: un tiro gasta uno (y nada más)
      for (const [arma, k] of Object.entries(MUN).concat([['honda', 'piedra']])) {
        await js(`(()=>{ for (let i=0;i<40;i++) ${H}.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); return 1 })()`);   // la recarga del tiro anterior
        const r = await js(`(()=>{ const H=${H}, P=H.progreso, D=P.desafio; const cuanto = () => '${k}' === 'piedra' ? P.materiales.piedra : D['${k}'];
          const antes = cuanto(); const tiro = H.desafio.atacar('${arma}'); return { tiro, antes, despues: cuanto(), recarga: +H.desafio.recarga.toFixed(2) } })()`);
        ok(r.tiro && r.despues === r.antes - 1 && r.recarga > 0, `${arma}: un tiro gasta uno (${JSON.stringify(r)})`);
      }
      await cuadros(60);
      // la barra: el martillo elegido; se gasta el último emplasto (las casillas de después se corren) y se guarda
      const elegir = async (nombre) => { for (let i = 1; i <= 8; i++) { await js(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'Digit${i}',bubbles:true})); document.dispatchEvent(new KeyboardEvent('keyup',{code:'Digit${i}',bubbles:true})); 1`); await cuadros(2); if (String(await js(`${H}.__ranuraActual()`)).includes(nombre)) return i; } return -1; };
      console.log('   la barra: ' + JSON.stringify(await (async () => { const v = []; for (let i = 1; i <= 8; i++) { await js(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'Digit${i}',bubbles:true})); document.dispatchEvent(new KeyboardEvent('keyup',{code:'Digit${i}',bubbles:true})); 1`); await cuadros(2); v.push(await js(`${H}.__ranuraActual()`)); } return v; })()));
      const iBal = await elegir('Martillo');
      ok(iBal > 0, `el martillo está en la barra, después del emplasto (casilla ${iBal})`);
      await js(`(()=>{ const H=${H}; H.progreso.desafio.salud = 40; H.desafio.usarEmplasto(); return 1 })()`);
      await cuadros(20);
      const antes = await js(`${H}.__ranuraActual()`);
      await js(`${H}.guardar(); 1`);
      await abrir(); await entrar(); await cuadros(5);
      const despues = await js(`${H}.__ranuraActual()`);
      ok(/Martillo/.test(antes) && antes === despues, `gastado el último emplasto, guardar y abrir: sigue elegido el martillo («${antes}» → «${despues}»)`);
      // con una hachuela en el aire, el arpón afuera y una granada volando: al abrir, la hachuela vuelve y nada se duplica
      await js(dar); await cuadros(5);
      const tiros = await js(`(()=>{ const H=${H}, D=H.progreso.desafio; H.desafio.atacar('hachuela'); for (let i=0;i<3;i++) H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); H.desafio.atacar('arpon'); return { hachuelas: D.hachuelas, tiradas: { ...(D.armasTiradas || {}) } } })()`);
      await js(`${H}.guardar(); 1`);
      await abrir(); await entrar(); await cuadros(5);
      const vuelta = await js(`(()=>{ const D=${H}.progreso.desafio; return { hachuelas: D.hachuelas, tiradas: { ...(D.armasTiradas || {}) } } })()`);
      ok(vuelta.hachuelas === tiros.hachuelas + 1 && !Object.keys(vuelta.tiradas).length, `la hachuela en el aire vuelve a tus cosas al abrir, una sola vez (${JSON.stringify({ tiros, vuelta })})`);
    }
    // ---------------------------------------------------------------- 3. el fuego: la zanja prende y, con viento, se corre al pasto
    if (toca('fuego')) {
      seccion('fuego');
      await nueva({});
      await js(`(()=>{ const P=${H}.progreso; P.desafio.tutorial = 99; P.horas = 12; return 1 })()`);
      const poner = (id, dx, dz) => js(`(()=>{ const H = ${H}, O = H.obras, P = H.progreso, j = H.jugador.estado;
        Object.assign(P.materiales, { tronco: 200, tabla: 200, piedra: 200, cristal: 200 });
        const p = H.PLANOS.find(q => q.id === '${id}'); if (!p) return { error: 'no hay plano ${id}' };
        for (const r of [0, 1.5, 3, 4.5]) for (let k = 0; k < 8; k++) {
          O.elegir(p); const a = k * Math.PI / 4, x = j.pos.x + (${dx}) + Math.cos(a) * r, z = j.pos.z + (${dz}) + Math.sin(a) * r;
          const f = O.fundar(x, z, 0, j.pos.y); if (!f.ok) continue;
          for (let g = 0; g < 12 && f.obra.datos.etapas < f.obra.plano.etapas.length; g++) { if (!O.avanzar(f.obra, P.materiales).ok) break; }
          O.elegir(null); P.obras = O.obras.map(o => o.datos); H.desafio.fortin.refrescar(); H.desafio.defensas.refrescar();
          return { ok: true, i: O.obras.indexOf(f.obra), x: f.obra.datos.x, z: f.obra.datos.z };
        } O.elegir(null); return { error: 'sin lugar' } })()`);
      // un claro llano cerca del refugio
      await js(`(()=>{ const H=${H}, r=H.T.lugares.refugio, j=H.jugador.estado; for (let k=0;k<40;k++){ const x=r.x+60+(k%6)*20, z=r.z-60-Math.floor(k/6)*20; if (H.T.agua(x,z)) continue; j.pos.set(x, H.T.altura(x,z)+0.05, z); return k; } return -1 })()`);
      const zj = await poner('zanja-fuego', 0, -4);
      const em = zj.ok ? await poner('empalizada', 5, -4) : null;
      ok(zj.ok && em?.ok, `se arman la zanja y una empalizada al este, a favor del viento (${JSON.stringify([zj, em])})`);
      if (zj.ok && em?.ok) {
        await js(`(()=>{ const H=${H}; for (let i = 0; i < 25; i++) H.desafio.actualizar(0.05,{noche:0,dtReal:0.05}); return 1 })()`);   // (las zanjas se repasan una vez por segundo)
        const prende = await js(`(()=>{ const H=${H}, D=H.desafio, j=H.jugador.estado, E=H.clima.estado; E.lluvia = 0; E.objetivo = 'despejado';
          j.pos.set(${zj.x} - 1.6, H.T.altura(${zj.x} - 1.6, ${zj.z}) + 0.05, ${zj.z});
          const a1 = D.avisoCercaDe(j.pos); D.usarCercaDe(j.pos); const a2 = D.avisoCercaDe(j.pos); D.usarCercaDe(j.pos); const a3 = D.avisoCercaDe(j.pos);
          j.pos.set(${zj.x} - 25, H.T.altura(${zj.x} - 25, ${zj.z}) + 0.05, ${zj.z});
          const a = D.invocar('rastreador', ${zj.x}, ${zj.z}); a.vida = a.vidaMax = 5000; a.dudaT = 999;
          const o = H.obras.obras[${em.i}], vida0 = o.datos.vida ?? o.plano.vida;
          let focos = 0;
          for (let i = 0; i < 1400; i++) { E.viento = E.vientoBase = 1.1; E.lluvia = 0; H.progreso.desafio.salud = 100; D.actualizar(0.05, { noche: 1, dtReal: 0.05 }); focos = Math.max(focos, D.focos.length); }
          return { avisos: [a1, a2, a3], focos, duende: Math.round(a.vidaMax - a.vida), empalizada: [vida0, Math.round(o.datos.vida ?? vida0)] } })()`);
        ok(/Prender|La zanja arde/.test(prende.avisos.join(' ')), `E prende la zanja (${prende.avisos.join(' · ')})`);
        ok(prende.focos > 0, `con viento, el fuego se corre al pasto (${prende.focos} focos a la vez)`);
        ok(prende.duende > 0, `el duende en la zanja se quema (${prende.duende})`);
        ok(prende.empalizada[1] < prende.empalizada[0], `la madera a favor del viento se chamusca (${prende.empalizada.join(' → ')})`);
      }
    }
    // ---------------------------------------------------------------- 4. las dificultades: cuántos vienen, cuánto aguantan y cuánto pegan
    if (toca('dificultades')) {
      seccion('dificultades');
      const med = {};
      for (const dif of ['tranquila', 'normal', 'implacable']) {
        await nueva({ dificultad: dif });
        med[dif] = await js(`(()=>{ const H=${H}, D=H.progreso.desafio, De=H.desafio; D.tutorial = 99; D.oleadas = 6;
          H.progreso.dia++; H.progreso.horas=19.4; for(let i=0;i<30;i++){ H.progreso.horas+=0.01; De.actualizar(0.05,{noche:1,dtReal:0.05}); } H.progreso.horas=20.49;
          for (let i=0;i<400;i++){ H.progreso.horas += 0.05*24/1800; D.salud = 100; De.actualizar(0.05,{noche:1,dtReal:0.05}); }
          const vivos = De.aliens.filter((a) => a.estado !== 'morir' && a.estado !== 'irse');
          const r = vivos.find((a) => a.tipo === 'rastreador');
          D.salud = 100; const j = H.jugador.estado; De.herirJugador(10, { x: j.pos.x + 1, y: j.pos.y, z: j.pos.z });
          return { invasores: D.vivos, vidaRastreador: r ? r.vidaMax : null, golpe10: +(100 - D.salud).toFixed(2), oleada: D.oleadas } })()`);
        console.log(`   ${dif}: ${JSON.stringify(med[dif])}`);
      }
      const t = med.tranquila, n = med.normal, i = med.implacable;
      ok(t.invasores < n.invasores && n.invasores < i.invasores, `vienen más cuanto más difícil (${t.invasores} · ${n.invasores} · ${i.invasores})`);
      ok(t.golpe10 < n.golpe10 && n.golpe10 < i.golpe10, `pegan más (${t.golpe10} · ${n.golpe10} · ${i.golpe10})`);
      ok(!t.vidaRastreador || !i.vidaRastreador || (t.vidaRastreador < n.vidaRastreador && n.vidaRastreador < i.vidaRastreador), `aguantan más (${t.vidaRastreador} · ${n.vidaRastreador} · ${i.vidaRastreador})`);
    }
    // ---------------------------------------------------------------- 5. tirones: cada cosa nueva de la noche, la primera vez, sin compilar nada a mitad del juego
    if (toca('tirones')) {
      seccion('tirones');
      await nueva({});
      await js(`(()=>{ const P=${H}.progreso, D=P.desafio; P.cosas = P.cosas || {}; for (const k of ['arco','lanza','honda','boleadoras','ballesta','facon','maza','arpon','hachuela','jabalina','granada','humo','bengala','cuerno','pistola','martillo']) P.cosas[k]=1;
        Object.assign(D, { flechas: 30, flechasFuego: 10, virotes: 10, hachuelas: 5, jabalinas: 5, granadas: 5, humos: 5, bengalas: 5, boleadoras: 5, cargas: 10, tutorial: 99, oleadas: 6 }); P.materiales.piedra = 10; P.horas = 21; return 1 })()`);
      // 150 cuadros de calma (el primer cuadro del juego prepara lo suyo) y después cada cosa, 45 cuadros
      const frames = (cod, n = 45) => js(`(async ()=>{ const H=${H}, D=H.desafio, j=H.jugador.estado, gl=H.renderer.getContext(); ${cod}
        const lento=[]; for (let i=0;i<${n};i++){ H.progreso.desafio.salud=1e5; const t0=performance.now(); H.__bucle(); gl.finish(); const ms=performance.now()-t0; if (ms>200) lento.push(Math.round(ms)); if (i%8===7) await new Promise(r=>setTimeout(r,0)); } return lento })()`);
      await frames('', 150);
      const acciones = {
        'bajar un duende de cada tipo': "for (const t of ['rastreador','tirador','saltador','escupidor','excavador','volador','bruto']) { const a = D.invocar(t, j.pos.x + 25, j.pos.z + 12); a.vida = a.vidaMax = 1e6; a.dudaT = 999; }",
        'herir un duende': "D.herirDuende(D.aliens.find((a) => a.tipo === 'rastreador'), 5, 'jugador');",
        'matar un duende (semillas, efectos)': "const a = D.aliens.find((a) => a.tipo === 'saltador'); a.vida = 1; D.herirDuende(a, 999, 'jugador');",
        'herir al jugador': "D.herirJugador(5, { x: j.pos.x + 1, y: j.pos.y, z: j.pos.z });",
        'arco': "for (let i = 0; i < 2; i++) { H.desafio.atacar('arco'); }",
        'ballesta': "H.desafio.atacar('ballesta');",
        'honda': "H.desafio.atacar('honda');",
        'hachuela': "H.desafio.atacar('hachuela');",
        'jabalina': "H.desafio.atacar('jabalina');",
        'granada': "H.desafio.atacar('granada');",
        'humo': "H.desafio.atacar('humo');",
        'bengala': "H.desafio.atacar('bengala');",
        'pistola': "H.desafio.atacar('pistola');",
        'boleadoras': "H.desafio.atacar('boleadoras');",
        'arpón': "H.desafio.atacar('arpon');",
        'cuerno': "H.desafio.atacar('cuerno');",
        'hacha': "H.desafio.atacar('hacha');",
      };
      const lentos = {};
      for (const [nombre, cod] of Object.entries(acciones)) {
        // el recargado entre una y otra: se simula tiempo para que el arma vuelva a estar lista
        await js(`(()=>{ for (let i=0;i<40;i++) ${H}.desafio.actualizar(0.05,{noche:1,dtReal:0.05}); return 1 })()`);
        lentos[nombre] = await frames(cod);
        console.log(`   ${nombre}: ${lentos[nombre].length ? 'tirón de ' + lentos[nombre].join(', ') + ' ms' : 'sin tirones'}`);
        ok(!lentos[nombre].length || process.env.TOLERAR, `${nombre}: ningún cuadro de más de 200 ms (un programa que compila mid-juego son 250-350 ms)`);
      }
    }
  } catch (e) {
    errores.push('excepcion: ' + (e && e.message ? e.message : e));
  }
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});

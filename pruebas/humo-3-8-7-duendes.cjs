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
  } catch (e) {
    errores.push('excepcion: ' + (e && e.message ? e.message : e));
  }
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); app.exit(1); return; }
  app.exit(0);
});

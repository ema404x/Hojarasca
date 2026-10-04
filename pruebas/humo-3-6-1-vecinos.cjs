// Partida real 3.6.1 (vecinos): la tecla E y el aviso dicen y hacen lo mismo en TODOS los lugares con
// algo para hacer (SEGUIR-EN-OTRA-PC.md §4.2: «la tecla E y el aviso comparten prioridad»).
// Recorre la aldea completa y el valle: cada asiento, cada puerta, cada mecánica de la aldea (aljibe,
// duende, libros, préstamo, pizarrón, dibujos, horario, casillas, mapa, camilla, estufas), los
// mostradores del almacén y de la casa de té, el andén y los vecinos donde estén a cada hora (de
// madrugada, a la mañana, a la tarde y a la noche). En cada punto mira hacia varios lados, lee el
// aviso, aprieta E y compara: lo que pasó tiene que ser lo que decía el aviso (y sin aviso, nada).
// Uso: npx electron pruebas/humo-3-6-1-vecinos.cjs --user-data-dir=<carpeta propia>
//      (o HUMO_PERFIL=<carpeta>). Borra el localStorage del perfil: usar uno aparte.
const { app, BrowserWindow, dialog } = require('electron');
// que la prueba nunca muestre un cuadro de error en la pantalla del usuario: lo escribe y sale
dialog.showErrorBox = () => {};
process.on('uncaughtException', (e) => { console.log(`ERROR (proceso principal): ${e && e.stack ? e.stack : e}`); app.exit(1); });
process.on('unhandledRejection', (e) => { console.log(`ERROR (promesa sin atender): ${e && e.stack ? e.stack : e}`); app.exit(1); });
const path = require('path');
const os = require('os');
const raiz = path.resolve(__dirname, '..');
if (process.env.HUMO_PERFIL) app.setPath('userData', path.resolve(process.env.HUMO_PERFIL));
else if (!process.argv.some((a) => a.startsWith('--user-data-dir'))) app.setPath('userData', path.join(os.tmpdir(), 'hojarasca-humo-3-6-1-vecinos'));
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// lo que corre en la página
const AYUDA = String.raw`(() => {
  const H = window.__hojarasca;
  const A = window.__m361v = {};
  const $ = (id) => document.getElementById(id);
  A.tecla = (tipo, code) => document.dispatchEvent(new KeyboardEvent(tipo, { code, bubbles: true }));
  A.toque = (code) => { A.tecla('keydown', code); A.tecla('keyup', code); };
  A.paso = (dt = 0.05) => { H.jugador.actualizar(dt); H.puertas.actualizar(dt); };
  A.poner = (x, z, yaw = 0, y = null) => { const e = H.jugador.estado; H.jugador.teclas.clear(); if (e.sentado) H.jugador.sentarse(false); H.jugador.ubicar(x, z, yaw, y); e.vel.set(0, 0, 0); e.vy = 0; e.sentado = false; for (let i = 0; i < 8; i++) A.paso(); e.yaw = yaw; e.pitch = -0.2; };
  A.charla = () => ({ abierta: !$('charla').classList.contains('oculto'), quien: $('charla-quien').textContent, texto: $('charla-texto').textContent, opciones: [...$('charla-opciones').children].map((li) => li.textContent), menu: !$('charla-opciones').classList.contains('oculto') });
  // todo lo que E puede cambiar, en una foto
  A.foto = () => {
    const e = H.jugador.estado, ab = H.__abierto(), c = A.charla();
    for (const n of $('notas').children) n.dataset.vista = '1';
    return {
      charla: c.abierta ? c.quien : null, sentado: !!e.sentado, almacen: !!ab.enElAlmacen, feria: !!ab.enLaFeria, tren: !!e.enTren, montado: !!e.montado,
      cargas: !$('cargas')?.classList.contains('oculto'),
      puertas: H.puertas.lista.map((p) => (p.objetivo > 0.5 ? 1 : 0)).join(''), entradas: Object.keys(H.progreso.entradas || {}).length,
      materiales: JSON.stringify(H.progreso.materiales), mec: JSON.stringify(H.progreso.mecanicas), usosAldea: JSON.stringify(H.progreso.aldea?.usos || {}),
      x: e.pos.x, z: e.pos.z,
    };
  };
  A.notasNuevas = () => [...$('notas').children].filter((n) => !n.dataset.vista).map((n) => n.lastChild?.textContent || n.textContent);
  // dejar todo como estaba antes de la próxima prueba
  A.limpiar = () => {
    for (let i = 0; i < 6 && !$('charla').classList.contains('oculto'); i++) A.toque('Escape');
    const ab = H.__abierto();
    if (ab.enElAlmacen || ab.enLaFeria) A.toque('Escape');
    if (!$('cargas')?.classList.contains('oculto')) A.toque('Escape');
    if (H.jugador.estado.enTren) { H.jugador.estado.enTren = false; }
    if (document.getElementById('pausa') && !document.getElementById('pausa').classList.contains('oculto')) H.volverAlJuego?.();
  };
  return 1;
})()`;

// Lo que tiene que haber pasado con E, según lo que decía el aviso (corre en la página): '' si cuadra.
function fabricaCuadra() {
const MECANICA = {
  'Leer un libro': { charla: 'Biblioteca Popular' }, 'Leer la plaquita del duende': { charla: 'El duende de la plaza' },
  'Mirar el pizarrón': { charla: 'El pizarrón' }, 'Mirar los dibujos de los chicos': { charla: 'Los dibujos de los chicos' },
  'Mirar el horario de trenes': { charla: 'Horario de trenes' }, 'Mirar el mapa del valle': { charla: 'El mapa del valle' },
  'Sacar agua del aljibe': { nota: /^Agua fresca del aljibe/ }, 'Recostarte en la camilla': { nota: /camilla|recostás/i },
  'Calentarte junto a la estufa': { nota: /^Te calentaste/ }, 'Abrir tu casilla de correo': { notaOCharla: /casilla/i },
  'Pedir un libro prestado': { nota: /^Te llevás «|^Ya tenés uno|^Por hoy ya está/ },
};
function cuadra(aviso, a, d, notas) {
  const t = aviso?.texto || '';
  const cambio = a.charla !== d.charla || a.sentado !== d.sentado || a.almacen !== d.almacen || a.feria !== d.feria || a.tren !== d.tren || a.montado !== d.montado
    || a.cargas !== d.cargas || a.puertas !== d.puertas || a.entradas !== d.entradas || a.materiales !== d.materiales || a.mec !== d.mec || a.usosAldea !== d.usosAldea || notas.length > 0;
  if (!aviso || aviso.tecla !== 'E') return cambio ? `sin aviso de E, E hizo algo (${d.charla ? `charla con ${d.charla}` : d.sentado ? 'te sentó' : notas[0] || 'otra cosa'})` : '';
  let m;
  if ((m = /^Hablar con (.+)$/.exec(t))) return d.charla && d.charla.startsWith(m[1]) ? '' : `E: ${d.charla ? `habló con ${d.charla}` : d.sentado ? 'te sentó' : notas[0] || 'nada'}`;
  if (/^Sentarte a tomar/.test(t)) return d.sentado && d.charla ? '' : 'E no te sentó a la mesa de la invitación';
  if (/^Sentarte en |^Acostarte/.test(t)) return d.sentado ? '' : `E no te sentó (${d.charla ? `charla con ${d.charla}` : notas[0] || 'nada'})`;
  if (t === 'Ver qué hay en el almacén') return d.almacen ? '' : `E no abrió el almacén (${d.charla ? `charla con ${d.charla}` : notas[0] || 'nada'})`;
  if (t === 'Ver la feria') return d.feria ? '' : 'E no abrió la feria';
  if (t === 'Pedir algo en la casa de té') return d.entradas !== a.entradas || notas.length ? '' : 'E no pidió en la casa de té';
  if ((m = /^(Abrir|Cerrar) (.+)$/.exec(t)) && !/casilla/.test(t)) return d.puertas !== a.puertas ? '' : `E no movió ${m[2]} (${d.charla ? `charla con ${d.charla}` : d.sentado ? 'te sentó' : notas[0] || 'nada'})`;
  if (/^Subir a la trochita/.test(t)) return d.tren ? '' : 'E no te subió al tren';
  if (/^Devolver «|^Leer «.*el libro prestado/.test(t)) return notas.length || d.charla ? '' : 'E no hizo lo del libro';
  if (/^Aportar a la obra|^La obra de /.test(t)) return notas.length ? '' : 'E no aportó a la obra';
  const k = MECANICA[t];
  if (k) {
    if (k.charla) return (d.charla || '').startsWith(k.charla + ',') ? '' : `E: ${d.charla ? `abrió «${d.charla}»` : d.sentado ? 'te sentó' : notas[0] || 'nada'}`;
    if (k.nota) return notas.some((x) => k.nota.test(x)) ? '' : `E: ${d.charla ? `charla con ${d.charla}` : notas[0] || 'nada'}`;
    if (k.notaOCharla) return notas.some((x) => k.notaOCharla.test(x)) || /casilla/i.test(d.charla || '') ? '' : `E: ${d.charla || notas[0] || 'nada'}`;
  }
  return cambio ? '' : 'E no hizo nada';
}
  return cuadra;
}

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
    new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 300 s (${donde})`)), 300000)),
  ]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const seccion = (s) => { donde = s; console.log(`— ${s}`); };
  const url = path.join(raiz, 'index.html');
  const abrir = async () => { try { await w.loadFile(url, { search: '?debug=1' }); } catch (e) { await esperar(1500); await w.loadFile(url, { search: '?debug=1' }); } };
  const listo = async () => { for (let i = 0; i < 300; i++) { await esperar(1000); if (await js('!!(window.__hojarasca && window.__hojarasca.__aldea)').catch(() => false)) return true; } return false; };
  const H = 'window.__hojarasca';
  const ajustes = `localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'baja', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false, limiteFps: 'libre', estacion: 'verano' }));`;
  const cuadros = (n = 4) => js(`(()=>{ for (let i = 0; i < ${n}; i++) ${H}.__bucle(); return 1 })()`);
  const asentar = async (veces = 6) => { for (let i = 0; i < veces; i++) { await esperar(160); await cuadros(3); } };
  const aldeaMontada = async (maximo = 900) => {
    await js(`${H}.__aldeaMundo().listo().then(() => 1)`);
    for (let i = 0; i < maximo; i++) { const c = await js(`(()=>{ ${H}.__bucle(); return ${H}.__aldeaMundo().medir().cola })()`); if (c === 0) return i; if (i % 20 === 19) await esperar(30); }
    return -1;
  };

  try {
    await w.loadURL('about:blank');
    await w.webContents.session.clearStorageData({ storages: ['localstorage'] });
    await abrir();
    ok(await listo(), 'el juego cargó');
    await js(`(()=>{ localStorage.clear(); ${ajustes} return 1 })()`);
    await abrir();
    ok(await listo(), 'una partida Relax limpia');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    await js(`${H}.volverAlJuego?.(); ${H}.ajustes.limiteFps = 'libre'; 1`);
    await js(AYUDA);
    await js(`window.__m361v.cuadra = (${fabricaCuadra.toString()})(); 1`);
    await js(`(()=>{ const P = ${H}.progreso, a = P.aldea; const L = { carpintero: 'carpinteria', panadera: 'panaderia', herrero: 'herreria', pescador: 'pescaderia', maestra: 'escuela', enfermera: 'puesto-sanitario', telegrafista: 'estafeta', tejedora: 'hilanderia', apicultor: 'sala-miel', guardaparque: 'seccional', musico: 'salon' };
      a.pobladores = Object.keys(L).map((clave) => ({ clave, dia: 1 })); a.obras = {}; a.llegando = null; a.locales = Object.fromEntries(Object.values(L).map((l) => [l, 1])); a.descubierta = 1;
      P.dia = 3; P.horas = 10; P.cosas.hacha = 1; P.materiales = { tronco: 6, tabla: 6, piedra: 6 }; return 1 })()`);
    await js(`(()=>{ const M = ${H}.__aldeaMundo(); const o = M.aMundo(6, 29); window.__m361v.poner(o.x, o.z, 0); M.actualizar(4, ${H}.camara.position); return 1 })()`);
    ok(await aldeaMontada() >= 0, 'la aldea completa, montada');
    await asentar(6);
    await js(`${H}.__mecanicas().revisar(); 1`);

    // ------------------------------------------------------------ E y el aviso en cada lugar
    const HORAS = (process.env.HORAS || '3,10.5,16.5,20.5').split(',').map(Number);
    const fallas = [];
    let probadas = 0;
    for (const hora of HORAS) {
      seccion(`E y el aviso a las ${hora} h`);
      // los vecinos, cada uno en su lugar de esa hora (lejos se acomodan de una)
      await js(`(()=>{ const H = ${H}; H.progreso.horas = ${hora}; const A = window.__m361v; A.poner(H.T.lugares.refugio.x + 8, H.T.lugares.refugio.z + 8, 0); H.__aldea.actualizar(1); H.__aldea.actualizar(1); return 1 })()`);
      await asentar(2);
      // los puntos: asientos, puertas, mecánicas, mostradores, andenes y la gente (aldea y valle)
      const puntos = await js(`(()=>{ const H = ${H}, M = H.__mecanicas(), P = [];
        const cerca = (x, z) => Math.hypot(x - H.T.lugares.refugio.x, z - H.T.lugares.refugio.z) < 200 || Math.hypot(x - ${'M.centro.x'}, z - M.centro.z) < 160;
        for (const s of H.est.sentaderos) if (!s.cama) P.push({ que: 'asiento ' + s.nombre, x: s.x, z: s.z, y: s.y - 0.45, r: [0.8, 1.2] });
        for (const p of H.puertas.lista) { const q = p.centro || p.pos || p; if (Number.isFinite(q.x) && cerca(q.x, q.z)) P.push({ que: 'puerta ' + (p.nombre || ''), x: q.x, z: q.z, y: q.y ?? null, r: [0.8] }); }
        for (const c of M.candidatos()) P.push({ que: 'mecánica ' + c.tipo + ' (' + c.edificio + ')', x: c.x, z: c.z, y: c.y, r: [0.5, 1.1] });
        if (H.est.casaTe) P.push({ que: 'mostrador de la casa de té', x: H.est.casaTe.mostrador.x, z: H.est.casaTe.mostrador.z, y: null, r: [1, 2.5] });
        if (H.est.almacen) { const a = H.est.almacen; const q = a.mostrador || a; P.push({ que: 'mostrador del almacén', x: q.x, z: q.z, y: null, r: [0.9, 1.6] }); }
        for (const g of H.gente.gente) if (!g.dormido && !g.aBordo && g.pos && cerca(g.pos.x, g.pos.z)) P.push({ que: 'vecino ' + g.nombre, x: g.pos.x, z: g.pos.z, y: g.pos.y, r: [1.1] });
        return P })()`);
      for (let i = 0; i < puntos.length; i += 25) {
        const tanda = puntos.slice(i, i + 25);
        const r = await js(`(async ()=>{ const H = ${H}, A = window.__m361v, e = H.jugador.estado, salida = [];
          const ok = A.cuadra;
          for (const p of ${JSON.stringify(tanda)}) for (const r of p.r) for (let k = 0; k < 4; k++) {
            const a = (k / 4) * Math.PI * 2 + 0.3;
            const x = p.x + Math.sin(a) * r, z = p.z + Math.cos(a) * r;
            for (const mirar of ['al punto', 'de costado']) {
              const yaw = Math.atan2(-(p.x - x), -(p.z - z)) + (mirar === 'al punto' ? 0 : 1.2);
              // (si no cuadra se prueba otra vez: algo del mundo que pasa solo, como el perro que encuentra
              // un rastro o un lugar que se anota, no es de E)
              let aviso = null, mal = '', salto = false;
              for (let intento = 0; intento < 2; intento++) {
                A.limpiar();
                A.poner(x, z, yaw, p.y);
                if (Math.hypot(e.pos.x - x, e.pos.z - z) > 0.3) { salto = true; break; }   // ahí no se puede estar parado
                aviso = H.__avisoYa();
                const antes = A.foto();
                A.toque('KeyE');
                for (let i = 0; i < 2; i++) H.__bucle();
                // (la casa de té trae lo pedido un rato después)
                if (aviso?.texto === 'Pedir algo en la casa de té') await new Promise((r) => setTimeout(r, 800));
                const notas = A.notasNuevas(), despues = A.foto();
                mal = ok(aviso, antes, despues, notas);
                if (!mal) break;
              }
              if (salto) continue;
              salida.push(mal ? { que: p.que, aviso: aviso ? aviso.tecla + ' ' + aviso.texto : '(nada)', mal, x: +x.toFixed(1), z: +z.toFixed(1) } : 1);
              A.limpiar();
              if (e.sentado) H.jugador.sentarse(false);
            }
          }
          return salida })()`);
        probadas += r.length;
        for (const x of r) if (x !== 1) fallas.push({ hora, ...x });
      }
    }
    const unicas = [...new Map(fallas.map((f) => [`${f.que}|${f.aviso}|${f.mal}`, f])).values()];
    ok(probadas > 1000 && !unicas.length, `${probadas} veces E en ${HORAS.length} horas: el aviso y E hacen lo mismo${unicas.length ? `; no (${unicas.length}):\n    ${unicas.slice(0, 60).map((f) => `${f.hora} h · ${f.que} [${f.x}, ${f.z}] · aviso «${f.aviso}» · ${f.mal}`).join('\n    ')}` : ''}`);
  } catch (err) {
    errores.push(`excepción: ${err && err.message ? err.message : err}`);
  }
  if (errores.length) { console.log(`ERRORES (${errores.length}):\n${errores.join('\n')}`); app.exit(1); return; }
  console.log('OK humo 3.6.1 vecinos');
  app.exit(0);
});

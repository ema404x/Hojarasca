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
    // (con «media@» delante: la aldea a medio crecer, con una obra en curso y uno recién bajado del tren)
    const HORAS = (process.env.HORAS ?? '3,10.5,16.5,20.5,media@10.5,media@15').split(',').filter(Boolean);
    let config = 'completa';
    const fallas = [];
    let probadas = 0;
    for (const x of HORAS) {
      const [conf, hs] = x.includes('@') ? x.split('@') : ['completa', x];
      const hora = Number(hs);
      if (conf !== config) {
        config = conf;
        await js(`(()=>{ const a = ${H}.progreso.aldea; a.pobladores = [{ clave: 'carpintero', dia: 1 }, { clave: 'panadera', dia: 1 }, { clave: 'herrero', dia: 2 }]; a.locales = { carpinteria: 1, panaderia: 1 };
          a.obras = { herreria: { etapa: 1, aportado: { tabla: 2 }, lista: null, desde: 2 } }; a.llegando = { clave: 'pescador', dia: 3 }; ${H}.progreso.materiales = { tronco: 2, tabla: 1, piedra: 0 }; return 1 })()`);
        await js(`(()=>{ const M = ${H}.__aldeaMundo(); const o = M.aMundo(6, 29); window.__m361v.poner(o.x, o.z, 0); M.actualizar(4, ${H}.camara.position); return 1 })()`);
        await aldeaMontada(); await asentar(4); await js(`${H}.__mecanicas().revisar(); 1`);
      }
      seccion(`E y el aviso a las ${hora} h${conf !== 'completa' ? ` (aldea ${conf})` : ''}`);
      // los vecinos, cada uno en su lugar de esa hora (lejos se acomodan de una)
      await js(`(()=>{ const H = ${H}; H.progreso.horas = ${hora}; const A = window.__m361v; A.poner(H.T.lugares.refugio.x + 8, H.T.lugares.refugio.z + 8, 0); H.__aldea.actualizar(1); H.__aldea.actualizar(1); return 1 })()`);
      await asentar(2);
      // los puntos: asientos, puertas, mecánicas, mostradores, andenes y la gente (aldea y valle)
      const puntos = await js(`(()=>{ const H = ${H}, M = H.__mecanicas(), P = [];
        const cerca = (x, z) => Math.hypot(x - H.T.lugares.refugio.x, z - H.T.lugares.refugio.z) < 200 || Math.hypot(x - ${'M.centro.x'}, z - M.centro.z) < 160;
        for (const s of H.est.sentaderos) if (!s.cama) P.push({ que: 'asiento ' + s.nombre, x: s.x, z: s.z, y: s.y - 0.45, r: [0.8, 1.2] });
        for (const p of H.puertas.lista) { const q = p.centro || p.pos || p; if (Number.isFinite(q.x) && cerca(q.x, q.z)) P.push({ que: 'puerta ' + (p.nombre || ''), x: q.x, z: q.z, y: q.y ?? null, r: [0.8] }); }
        for (const c of M.candidatos()) P.push({ que: 'mecánica ' + c.tipo + ' (' + c.edificio + ')', x: c.x, z: c.z, y: c.y, r: [0.5, 1.1] });
        const ag = H.__aldea.mundo(); const obra = ag.estado().aldea.obras && Object.keys(ag.estado().aldea.obras)[0];
        if (obra) { const AM = H.__aldeaMundo(); let sx = 0, sz = 0, n = 0; for (let lx = -46; lx <= 92; lx += 1) for (let lz = -2; lz <= 72; lz += 1) { const w = AM.aMundo(lx, lz); if (ag.obraCerca({ x: w.x, z: w.z })) { sx += w.x; sz += w.z; n++; } } if (n) P.push({ que: 'obra ' + obra, x: sx / n, z: sz / n, y: null, r: [0.5, 2, 3.5, 5] }); }
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
        for (const y of r) if (y !== 1) fallas.push({ hora: x, ...y });
      }
    }
    const unicas = [...new Map(fallas.map((f) => [`${f.que}|${f.aviso}|${f.mal}`, f])).values()];
    if (HORAS.length) ok(probadas > 400 * HORAS.length && !unicas.length, `${probadas} veces E en ${HORAS.length} horas: el aviso y E hacen lo mismo${unicas.length ? `; no (${unicas.length}):\n    ${unicas.slice(0, 60).map((f) => `${f.hora} h · ${f.que} [${f.x}, ${f.z}] · aviso «${f.aviso}» · ${f.mal}`).join('\n    ')}` : ''}`);

    // ------------------------------------------------------------ el menú de la charla, en la partida
    const vista = () => js(`(()=>{ const c = document.getElementById('charla'), ul = document.getElementById('charla-opciones');
      const lis = [...ul.querySelectorAll('li')];
      return { abierta: !c.classList.contains('oculto'), quien: document.getElementById('charla-quien').textContent, texto: document.getElementById('charla-texto').textContent,
        seguir: document.getElementById('charla-seguir').textContent, menu: !ul.classList.contains('oculto'), opciones: lis.map((l) => l.textContent), elegida: lis.findIndex((l) => l.classList.contains('elegida')) } })()`);
    const tecla = async (code) => { await js(`(()=>{ window.__m361v.toque('${code}'); return 1 })()`); await cuadros(1); };
    const npc = (clave) => `(${H}.gente.gente.find((g) => (g.claveAldea || g.clave) === '${clave}'))`;
    const hastaMenu = async (max = 10) => { let v = await vista(); for (let i = 0; i < max && v.abierta && !v.menu; i++) { await tecla('KeyE'); v = await vista(); } return v; };
    const hablarCon = async (clave) => { await js(`(()=>{ ${H}.hablar(${npc(clave)}); return 1 })()`); return hastaMenu(); };
    const opcion = (v, re) => v.opciones.findIndex((t) => re.test(t));
    const elegir = async (re) => { const v = await vista(); const i = opcion(v, re); if (i < 0) return { error: `no está ${re} en ${v.opciones.join(' / ')}` }; await tecla(`Digit${i + 1}`); return vista(); };
    const cerrar = () => js(`(()=>{ ${H}.__cerrarCharla(); return 1 })()`);
    const reloj = (dia, horas) => js(`(()=>{ const P = ${H}.progreso; P.dia = ${dia}; P.horas = ${horas}; return 1 })()`);
    // los vecinos en su lugar de esa hora (lejos se acomodan de una) y vos donde digas
    const acomodar = async (dia, horas) => {
      await reloj(dia, horas);
      await js(`(()=>{ const H = ${H}; window.__m361v.poner(H.T.lugares.refugio.x + 8, H.T.lugares.refugio.z + 8, 0); H.__aldea.actualizar(1); H.__aldea.actualizar(1); return 1 })()`);
    };
    // un lugar desde donde el aviso dice `texto` (alrededor de x, z, mirando hacia ahí)
    const dondeDice = (x, z, re, radios = [0.8, 1.2, 1.6, 2.2]) => js(`(async ()=>{ const H = ${H}, A = window.__m361v;
      for (const r of ${JSON.stringify(radios)}) for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, px = ${x} + Math.sin(a) * r, pz = ${z} + Math.cos(a) * r;
        for (const g of [0, 0.45, -0.45]) { A.poner(px, pz, Math.atan2(-(${x} - px), -(${z} - pz)) + g); const av = H.__avisoYa(); if (av && ${re}.test(av.texto)) return { x: px, z: pz, yaw: H.jugador.estado.yaw, aviso: av.texto }; } }
      return null })()`);
    const P = `${H}.progreso`;
    let e, v;

    seccion('el menú en el almacén: lo del lugar no se pierde');
    await acomodar(3, 10.5);
    await js(`(()=>{ ${P}.cosas.yerba = 6; ${P}.cosas.harina = 1; return 1 })()`);
    const most = await js(`(()=>{ const a = ${H}.est.almacen; return { x: a.mostrador.x, z: a.mostrador.z } })()`);
    const lugarAlmacen = await dondeDice(most.x, most.z, /Ver qué hay en el almacén/);
    ok(!!lugarAlmacen, `al mostrador del almacén, el aviso: ${lugarAlmacen?.aviso}`);
    if (lugarAlmacen) {
      await js(`(()=>{ window.__m361v.poner(${lugarAlmacen.x}, ${lugarAlmacen.z}, ${lugarAlmacen.yaw}); return 1 })()`);
      v = await hablarCon('ercilia');
      ok(v.menu && opcion(v, /Ver qué hay en el almacén/) >= 0 && /Nada más, chau/.test(v.opciones[v.opciones.length - 1]), `hablándole a Ercilia, lo del almacén en el menú (${v.opciones.join(' / ')})`);
      ok(/1 a \d+, o la ruedita y E, para elegir · Escape para despedirte/.test(v.seguir), `el pie: ${v.seguir}`);
      v = await elegir(/Regalar/);
      ok(v.menu && /Mejor no/.test(v.opciones[v.opciones.length - 1]) && opcion(v, /yerba/i) >= 0, `el submenú de regalar (${v.opciones.join(' / ')})`);
      v = await elegir(/Mejor no/);
      ok(v.menu && opcion(v, /Ver qué hay en el almacén/) >= 0, `con «Mejor no», de vuelta al menú, con lo del almacén (${v.opciones.join(' / ')})`);
      await elegir(/Regalar/); await tecla('Escape'); v = await vista();
      ok(v.menu && opcion(v, /Ver qué hay en el almacén/) >= 0, 'con Escape, también');
      // la ruedita mueve, E elige
      const i0 = v.elegida;
      await js(`(()=>{ window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 })); return 1 })()`); v = await vista();
      ok(v.elegida === (i0 + 1) % v.opciones.length, `la ruedita mueve la marca (${i0} → ${v.elegida})`);
      await js(`(()=>{ window.dispatchEvent(new WheelEvent('wheel', { deltaY: -100 })); window.dispatchEvent(new WheelEvent('wheel', { deltaY: -100 })); return 1 })()`); v = await vista();
      ok(v.elegida === (i0 + v.opciones.length - 1) % v.opciones.length, 'y para atrás (da la vuelta)');
      // el clic en una opción (con el mouse suelto)
      const iCom = opcion(v, /¿Cómo andás\?/);
      await js(`(()=>{ const li = document.querySelectorAll('#charla-opciones li')[${iCom}]; li.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true })); return 1 })()`);
      v = await vista();
      ok(v.abierta && !v.menu && v.texto.length > 5, `el clic elige: «${v.texto.slice(0, 60)}»`);
      
      v = await hastaMenu();
      ok((await js(`getComputedStyle(document.querySelector('#charla-opciones li')).pointerEvents`)) === 'auto', 'las opciones reciben el mouse (el HUD no)');
      // E elige la marcada: la del almacén
      const iLug = opcion(v, /Ver qué hay en el almacén/);
      await js(`(()=>{ ${H}.__moverCharla(${iLug} - ${v.elegida}); return 1 })()`);
      await tecla('KeyE');
      e = await js(`(()=>({ almacen: ${H}.__abierto().enElAlmacen, charla: !document.getElementById('charla').classList.contains('oculto') }))()`);
      ok(e.almacen && !e.charla, 'elegido lo del lugar: se abre el almacén y se cierra la charla');
      await tecla('Escape');
    }

    seccion('el menú en la biblioteca: el préstamo, las dos veces');
    await acomodar(3, 10.2);
    const prest = await js(`(()=>{ const c = ${H}.__mecanicas().candidatos().find((q) => q.tipo === 'prestamo'); return c ? { x: c.x, z: c.z } : null })()`);
    const lugarBib = prest && await dondeDice(prest.x, prest.z, /Pedir un libro prestado/, [0.5, 0.8, 1.1, 1.3]);
    ok(!!lugarBib, `al mostrador de la biblioteca: ${lugarBib?.aviso}`);
    if (lugarBib) {
      await js(`(()=>{ window.__m361v.poner(${lugarBib.x}, ${lugarBib.z}, ${lugarBib.yaw}); return 1 })()`);
      v = await hablarCon('abuela');
      ok(v.menu && opcion(v, /Pedir un libro prestado/) >= 0, `la abuela, con el préstamo en el menú (${v.opciones.join(' / ')})`);
      v = await elegir(/Pedir un libro prestado/);
      e = await js(`(()=>({ prestado: ${P}.mecanicas.prestado, notas: document.getElementById('notas').textContent }))()`);
      ok(!v.abierta && e.prestado && /Te llevás «/.test(e.notas), `se lleva el libro (${e.prestado?.id})`);
      v = await hablarCon('abuela');
      ok(v.menu && opcion(v, /^\d+\. Devolver «/) >= 0, `después, devolverlo (${v.opciones.join(' / ')})`);
      v = await elegir(/Devolver «/);
      e = await js(`${P}.mecanicas.prestado`);
      ok(!v.abierta && e === null, 'devuelto');
    }

    seccion('alejarse, pausar, el modo foto y el que se va a lo suyo');
    await acomodar(3, 10.5);
    // el jefe de estación, a las 10:58 (a las 11 cambia de lugar: del andén a adentro, o al revés)
    await reloj(3, 10.97);
    await js(`(()=>{ const n = ${npc('jefe')}; window.__m361v.poner(n.pos.x + 1.4, n.pos.z, Math.PI / 2); return 1 })()`);
    v = await hablarCon('jefe');
    ok(v.menu, 'charlando con el jefe');
    const antesJefe = await js(`(()=>{ const n = ${npc('jefe')}; return { x: n.pos.x, z: n.pos.z } })()`);
    await reloj(3, 11.2);
    await js(`(()=>{ const H = ${H}, j = H.jugador.estado; for (let i = 0; i < 60; i++) { H.__aldea.actualizar(0.5); H.gente.actualizar(0.05, j, H.camara, ${npc('jefe')}, 0); } return 1 })()`);
    e = await js(`(()=>{ const n = ${npc('jefe')}; return { d: Math.hypot(n.pos.x - ${antesJefe.x}, n.pos.z - ${antesJefe.z}), camino: n.camino?.length || 0 } })()`);
    v = await vista();
    ok(e.d < 0.3 && v.abierta && v.menu, `mientras le hablás no se va (se movió ${e.d.toFixed(2)} m)`);
    // la pausa con el menú abierto
    await js(`(()=>{ ${H}.abrir('pausa'); return 1 })()`); await esperar(500);
    await js(`(()=>{ ${H}.volverAlJuego(); return 1 })()`); await esperar(450); await cuadros(2);
    v = await vista();
    ok(v.abierta && v.menu, 'de la pausa se vuelve al menú');
    // el modo foto: las teclas no tocan el menú; al salir, sí
    await js(`(()=>{ ${H}.abrirModoFoto(true); return 1 })()`); await cuadros(1);
    const iAntes = v.elegida;
    await tecla('Digit2'); await js(`(()=>{ ${H}.__moverCharla(1); return 1 })()`);
    v = await vista();
    ok(v.abierta && v.menu && v.elegida === iAntes, 'en el modo foto el menú no se toca');
    await js(`(()=>{ ${H}.abrirModoFoto(false); return 1 })()`); await cuadros(1);
    v = await vista();
    ok(v.abierta && v.menu, 'al salir del modo foto, sigue');
    // Escape desde el menú se despide
    await tecla('Escape'); v = await vista();
    ok(!v.abierta, 'Escape desde el menú se despide');
    await js(`(()=>{ const H = ${H}, j = H.jugador.estado; for (let i = 0; i < 6; i++) { H.__aldea.actualizar(0.5); H.gente.actualizar(0.05, j, H.camara, null, 0); } return 1 })()`);
    e = await js(`(()=>{ const n = ${npc('jefe')}; return { camino: n.camino?.length || 0, d: Math.hypot(n.pos.x - ${antesJefe.x}, n.pos.z - ${antesJefe.z}) } })()`);
    ok(e.camino > 0 || e.d > 0.3, 'y ahí sí sigue a lo suyo');
    // alejarse con el menú abierto
    await js(`(()=>{ const n = ${npc('jefe')}; window.__m361v.poner(n.pos.x + 1.4, n.pos.z, Math.PI / 2); return 1 })()`);
    v = await hablarCon('jefe');
    await js(`(()=>{ const n = ${npc('jefe')}, e = ${H}.jugador.estado; e.pos.x = n.pos.x + 9; for (let i = 0; i < 3; i++) ${H}.__avisoYa(); return 1 })()`);
    v = await vista();
    ok(!v.abierta, 'alejándote, la charla se cierra');

    seccion('de noche, con lluvia y sin nada para regalar');
    await acomodar(4, 21.4);
    await js(`(()=>{ ${P}.cosas = { hacha: 1 }; ${P}.materiales = {}; for (const k of Object.keys(${P}.entradas)) if (${P}.entradas[k].cantidad) ${P}.entradas[k].cantidad = 0; ${H}.clima.estado.lluvia = 0.9; return 1 })()`);
    const madre = await js(`(()=>{ const n = ${npc('madre')}; return n ? { x: n.pos.x, z: n.pos.z } : null })()`);
    await js(`(()=>{ window.__m361v.poner(${madre.x} + 1.2, ${madre.z}, Math.PI / 2); return 1 })()`);
    v = await hablarCon('madre');
    ok(v.menu && opcion(v, /Regalar/) < 0, `sin nada para regalar, no está «Regalar…» (${v.opciones.join(' / ')})`);
    await elegir(/Invitar/); v = await elegir(/té/);
    ok(v.abierta && /noche|tarde|mañana/i.test(v.texto), `de noche no acepta: «${v.texto}»`);
    await cerrar();
    await js(`(()=>{ ${H}.clima.estado.lluvia = 0; return 1 })()`);

    seccion('invitar a la casa de té, y recargar a la mitad');
    // un martes a las 16:30: la madre está libre y la galesa atiende la galería
    await acomodar(2, 16.5);
    await js(`(()=>{ ${P}.cosas.yerba = 4; ${P}.vecindad.personas.madre && (${P}.vecindad.personas.madre.invito = 0); return 1 })()`);
    const m2 = await js(`(()=>{ const n = ${npc('madre')}; return { x: n.pos.x, z: n.pos.z } })()`);
    await js(`(()=>{ window.__m361v.poner(${m2.x} + 1.2, ${m2.z}, Math.PI / 2); return 1 })()`);
    v = await hablarCon('madre');
    await elegir(/Invitar/); v = await elegir(/té/);
    ok(v.abierta && /casa de té/.test(v.texto), `acepta: «${v.texto}»`);
    await tecla('KeyE'); await tecla('KeyE');
    e = await js(`(()=>({ c: ${H}.__vecindad().cita(), guardada: ${P}.vecindad.cita }))()`);
    ok(e.c?.que === 'te' && e.c.porAldea && e.guardada?.clave === 'madre', `va a la casa de té por las calles, y queda guardado (${e.c?.fase})`);
    await js(`(()=>{ ${H}.guardar(); return 1 })()`);
    // recargar la partida a la mitad
    await abrir();
    ok(await listo(), 'recargada');
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(2500);
    await js(`${H}.volverAlJuego?.(); ${H}.ajustes.limiteFps = 'libre'; 1`);
    await js(AYUDA);
    await js(`(()=>{ const H = ${H}; for (let i = 0; i < 4; i++) { H.__aldea.actualizar(0.6); H.__vecindad().actualizar(0.6); } return 1 })()`);
    e = await js(`(()=>({ c: ${H}.__vecindad().cita(), guardada: ${H}.progreso.vecindad.cita }))()`);
    ok(e.c?.clave === 'madre' && e.c.que === 'te', `después de recargar, la madre sigue yendo a la casa de té (${e.c?.fase})`);
    // la acompaño caminando a 2,5 m (antes se frenaba con vos al lado): llega a su silla, se sienta a la
    // altura de la silla, no queda en el aire
    await js(`(()=>{ const H = ${H}, j = H.jugador.estado, n = ${npc('madre')};
      for (let i = 0; i < 3000 && H.__vecindad().cita()?.fase === 'yendo'; i++) { j.pos.x = n.pos.x + 2.5; j.pos.z = n.pos.z; H.gente.actualizar(0.05, j, H.camara, null, 0); if (i % 10 === 0) { H.__aldea.actualizar(0.5); H.__vecindad().actualizar(0.6); } } return 1 })()`);
    e = await js(`(()=>{ const H = ${H}, c = H.__vecindad().cita(), n = ${npc('madre')}; return { fase: c?.fase, d: c ? Math.hypot(n.pos.x - c.lugar.x, n.pos.z - c.lugar.z) : -1, pose: n.pose, asiento: n.asiento, saltos: H.__aldea.mundo().estado().saltos } })()`);
    ok(e.fase === 'esperando' && e.d < 0.6 && e.pose === 'sentado', `llegó caminando y se sentó (${e.fase}, a ${e.d.toFixed(2)} m de su silla)`);
    ok(Number.isFinite(e.asiento) && e.asiento > 0.3 && e.asiento < 0.7, `a la altura de la silla de la casa de té (${e.asiento})`);
  } catch (err) {
    errores.push(`excepción: ${err && err.message ? err.message : err}`);
  }
  if (errores.length) { console.log(`ERRORES (${errores.length}):\n${errores.join('\n')}`); app.exit(1); return; }
  console.log('OK humo 3.6.1 vecinos');
  app.exit(0);
});

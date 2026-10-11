// 3.8.7 (mundo): en el juego de verdad (Electron + WebGL), lo del HUD y el sonido que se ve y se oye jugando.
//   1. Notas: la misma nota seguida no se apila; con muchas, la importante queda y el «✓ Guardado» no se pierde.
//   2. Subtítulos: se van solos y el aviso de la tecla E sube con la caja.
//   3. Letra enorme: los sonidos escritos no se agrandan dos veces; la nota no pisa la brújula en 1366×768; la mochila entra.
//   4. Dormido en el refugio y vuelto a la portada, el ambiente es el del bosque (no «adentro»).
//   5. Volver a la portada y entrar otra vez no rehace el arranque (no repite la nota del primer día).
//   6. Árbol seco: sin «Anotar undefined». Nada para juntar más allá del borde caminable.
//   7. Plaza de la aldea: pisar la laja suena a piedra y el césped a pasto; el alero suena a roca y no a cueva.
//   8. Huerta: sembrar la primera mata no compila un programa nuevo.
// Uso: HOJ_PERFIL=<carpeta> npx electron --no-sandbox -r ./herramientas/perfil-propio.cjs pruebas/humo-3-8-7-mundo.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const errores = [];
  const w = new BrowserWindow({ show: false, width: 1366, height: 768, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  w.setContentSize(1366, 768);
  let donde = 'carga';
  w.webContents.on('console-message', (e) => {
    const m = String(e.message);
    if ((e.level === 'error' || /Uncaught/.test(m)) && !/Security|GL_INVALID|PCF|Autofill|AudioContext|favicon/.test(m)) errores.push(`[${donde}] ${m.slice(0, 300)}`);
  });
  const js = (c) => Promise.race([w.webContents.executeJavaScript(c), new Promise((_, no) => setTimeout(() => no(new Error(`la página no respondió en 90 s (${donde})`)), 90000))]);
  const ok = (cond, texto) => { console.log(`${cond ? '✓' : '✗'} ${texto}`); if (!cond) errores.push(texto); };
  const url = path.join(raiz, 'index.html');
  const H = 'window.__hojarasca';
  const listo = async () => { for (let i = 0; i < 300; i++) { await esperar(500); if (await js(`!!(${H} && ${H}.__caidas && ${H}.__caidas.modo() === "inicio")`).catch(() => false)) return; } throw new Error('no llegó a la portada'); };
  try {
    await w.loadFile(url, { search: '?debug=1' }); await esperar(300);
    await js(`localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({calidad:'muybaja', clima:'despejado', musica:false, modo:'relax', autoCalidad:false, guiaPrimerDia:false})); 1`);
    await w.loadFile(url, { search: '?debug=1' }); await listo();
    await js(`document.getElementById('btn-entrar').click(); 1`); await esperar(1500);
    await js(`(()=>{ const H = ${H}; H.volverAlJuego?.(true); H.jugador.pedirBloqueo = () => {}; H.progreso.horas = 11; return 1 })()`);

    // ---------------------------------------------------------------- 1. notas
    donde = 'notas';
    await js(`document.querySelectorAll('#notas .nota').forEach((n) => n.remove()); 1`);
    const n1 = await js(`(()=>{ const H = ${H}; for (let i = 0; i < 6; i++) H.nota('No hay orilla cerca', 'Acercate a la costa'); return document.querySelectorAll('#notas .nota').length })()`);
    ok(n1 === 1, `seis veces la misma nota, una sola a la vista (${n1})`);
    const n2 = await js(`(()=>{ const H = ${H}; H.nota('Día 9', 'Amanece en el bosque', true); for (let i = 0; i < 6; i++) H.nota('Nota ' + i, 'chica'); const t = [...document.querySelectorAll('#notas .nota')].map((n) => n.textContent); return { n: t.length, importante: t.some((x) => x.includes('Día 9')), hud: !!document.querySelector('#notas #guardado-hud') } })()`);
    ok(n2.n === 4 && n2.importante && n2.hud, `con siete notas quedan cuatro, la importante entre ellas y el «✓ Guardado» sigue en su columna (${JSON.stringify(n2)})`);
    const g = await js(`(()=>{ const H = ${H}; document.querySelectorAll('#notas .nota').forEach((n) => n.remove()); window.dispatchEvent(new CustomEvent('hojarasca:guardado', { detail: { ok: true } })); H.nota('Una', 'nota'); H.nota('Dos', 'notas'); const h = document.getElementById('guardado-hud').getBoundingClientRect(); const ns = [...document.querySelectorAll('#notas .nota')].map((n) => n.getBoundingClientRect()); return { h: [h.top, h.bottom], ns: ns.map((r) => [r.top, r.bottom]) } })()`);
    const solapa = g.ns.some((r) => r[0] < g.h[1] && r[1] > g.h[0]);
    ok(!solapa, `el «✓ Guardado» no se encima con las notas (${JSON.stringify(g)})`);

    // ---------------------------------------------------------------- 2. subtítulos
    donde = 'subtítulos';
    await js(`(()=>{ const H = ${H}; H.ajustes.subtitulos = true; document.body.classList.add('con-subtitulos'); document.querySelectorAll('#notas .nota').forEach((n) => n.remove()); H.nota('Un aviso', 'para los subtítulos'); H.nota('Otro aviso', 'más'); return 1 })()`);
    await esperar(300);
    const s1 = await js(`(()=>{ const c = document.getElementById('subtitulos'); const hud = document.getElementById('hud'); return { visible: !c.classList.contains('oculto'), alto: getComputedStyle(hud).getPropertyValue('--alto-subtitulos'), filas: c.children.length } })()`);
    ok(s1.visible && s1.filas >= 2 && parseInt(s1.alto) > 20, `los subtítulos se ven y dicen cuánto miden (${JSON.stringify(s1)})`);
    await esperar(12600);
    const s2 = await js(`(()=>{ const c = document.getElementById('subtitulos'); return { visible: !c.classList.contains('oculto'), alto: getComputedStyle(document.getElementById('hud')).getPropertyValue('--alto-subtitulos') } })()`);
    ok(!s2.visible && parseInt(s2.alto) === 0, `a los 12 s se van solos y el aviso baja (${JSON.stringify(s2)})`);
    await js(`${H}.ajustes.subtitulos = false; document.body.classList.remove('con-subtitulos'); document.getElementById('subtitulos').classList.add('oculto'); 1`);

    // ---------------------------------------------------------------- 3. letra enorme en 1366×768
    donde = 'letra';
    await js(`(()=>{ const H = ${H}; H.ajustes.tamanoLetra = 'enorme'; H.ajustes.sonidosEscritos = true; document.documentElement.style.setProperty('--escala-letra', '1.45'); return 1 })()`);
    await esperar(200);
    const l1 = await js(`(()=>{ const H = ${H}; document.getElementById('sonidos-escritos').classList.remove('oculto'); const p = document.createElement('p'); p.textContent = 'ruido de prueba'; document.getElementById('sonidos-escritos').appendChild(p); const fs = parseFloat(getComputedStyle(p).fontSize);
      document.querySelectorAll('#notas .nota').forEach((n) => n.remove()); H.nota('Una nota con letra enorme', 'y su renglón de abajo');
      const nota = document.querySelector('#notas .nota').getBoundingClientRect(), br = document.getElementById('brujula').getBoundingClientRect();
      const mo = document.getElementById('mochila'); mo.classList.remove('oculto'); const mr = mo.getBoundingClientRect(); mo.classList.add('oculto');
      p.remove();
      return { fs, nota: [nota.left, nota.right, nota.top, nota.bottom], br: [br.left, br.right, br.top, br.bottom], mochila: [mr.left, mr.right], W: innerWidth } })()`);
    ok(l1.fs < 22, `los sonidos escritos no se agrandan dos veces (${l1.fs.toFixed(1)} px de letra, antes ~36)`);
    const pisa = l1.nota[0] < l1.br[1] && l1.nota[1] > l1.br[0] && l1.nota[2] < l1.br[3] && l1.nota[3] > l1.br[2];
    ok(!pisa, `la nota no pisa la brújula (${JSON.stringify({ nota: l1.nota, brujula: l1.br })})`);
    ok(l1.mochila[0] >= 0 && l1.mochila[1] <= l1.W + 1, `la mochila entra en 1366 de ancho (${l1.mochila.map(Math.round)})`);
    await js(`(()=>{ ${H}.ajustes.tamanoLetra = 'normal'; document.documentElement.style.setProperty('--escala-letra', '1'); return 1 })()`);

    // ---------------------------------------------------------------- 4. la portada no suena «adentro»
    donde = 'portada';
    await js(`(()=>{ const H = ${H}, r = H.T.lugares.refugio; H.jugador.ubicar(r.x - 0.5, r.z + 0.5, 0); for (let i = 0; i < 20; i++) H.__bucle(); return 1 })()`);
    const adentro = await js(`${H}.__techo()`);
    await js(`document.getElementById('btn-inicio').click(); 1`); await esperar(300);
    for (let k = 0; k < 6; k++) { await js(`(()=>{ for (let i = 0; i < 5; i++) ${H}.__bucle(); return 1 })()`); await esperar(250); }
    const portada = await js(`(()=>({ modo: ${H}.__caidas.modo(), techo: ${H}.__techo() }))()`);
    ok(portada.modo === 'inicio' && portada.techo.espacio === 'bosque' && !portada.techo.bajoTecho && portada.techo.techo === null,
      `en la portada, con el jugador dormido en el refugio, el ambiente es el del bosque (${JSON.stringify(portada)}; adentro era ${JSON.stringify(adentro)})`);

    // ---------------------------------------------------------------- 5. volver a entrar no repite el arranque
    donde = 'reentrada';
    await js(`document.querySelectorAll('#notas .nota').forEach((n) => n.remove()); document.getElementById('btn-entrar').click(); 1`);
    await esperar(2200);
    const rep = await js(`[...document.querySelectorAll('#notas .nota')].map((n) => n.textContent).filter((t) => /Salí a caminar/.test(t)).length`);
    ok(rep === 0, `volver a entrar no repite «Salí a caminar» (${rep})`);
    await js(`(()=>{ ${H}.volverAlJuego?.(true); return 1 })()`);

    // ---------------------------------------------------------------- 6. el árbol seco y el borde
    donde = 'seco';
    const seco = await js(`(()=>{ const H = ${H}, a = H.veg.arboles.find((q) => q.especie === 'seco' && !q.sacado); if (!a) return { hay: false };
      H.progreso.horas = 11; const e = H.jugador.estado; H.jugador.ubicar(a.x + 1.4, a.z, Math.PI / 2); H.camara.updateMatrixWorld(true); for (let i = 0; i < 40; i++) H.__bucle();
      const av = H.__avisoYa(); return { hay: true, aviso: av ? av.texto : '' } })()`);
    ok(!seco.hay || !/undefined/.test(seco.aviso), `junto a un árbol seco el aviso no dice «undefined» (${JSON.stringify(seco)})`);
    const fuera = await js(`${H}.objetos.items.filter((it) => Math.abs(it.x) > 470 + 1.5 || Math.abs(it.z) > 470 + 1.5).length`);
    ok(fuera === 0, `nada para juntar más allá del borde caminable (${fuera})`);

    // ---------------------------------------------------------------- 7. los pasos de la plaza y el sonido del alero
    donde = 'pasos';
    const pasos = await js(`(async()=>{ const H = ${H}, e = H.jugador.estado, ap = H.__aldea.puntos?.('plaza') ; const am = H.__aldeaMundo(); if (!am) return { aldea: false };
      const p = H.T.lugares.estacion; H.jugador.ubicar(p.x + 30, p.z + 30, 0); for (let i = 0; i < 200; i++) { H.__bucle(); if (am.montarCola) am.montarCola(); await new Promise((r) => setTimeout(r, 30)); }
      const plat = H.col.plataformas.filter((q) => q.suelo === 'piedra' || q.suelo === 'pasto');
      const c = { piedra: 0, pasto: 0, otro: 0 }; for (const q of H.col.plataformas) if (q.suelo === 'piedra') c.piedra++; else if (q.suelo === 'pasto') c.pasto++;
      const res = { aldea: true, ...c };
      const pl = H.col.plataformas.find((q) => q.suelo === 'piedra' && !q.radioInterior && q.radio);
      if (pl) { H.jugador.ubicar(pl.x, pl.z, 0, pl.alto); for (let i = 0; i < 6; i++) H.jugador.actualizar(0.05); res.superficieLaja = e.superficie; }
      const pa = H.col.plataformas.find((q) => q.suelo === 'pasto');
      if (pa) { H.jugador.ubicar(pa.x + pa.largo / 2 - 3, pa.z + 0.5, 0, pa.alto); for (let i = 0; i < 6; i++) H.jugador.actualizar(0.05); res.superficiePasto = e.superficie; }
      return res })()`);
    ok(pasos.aldea && pasos.piedra > 0 && pasos.pasto > 0, `la aldea tiene plataformas de piedra y de pasto (${JSON.stringify(pasos)})`);
    ok(!pasos.superficieLaja || pasos.superficieLaja === 'piedra', `la laja de la plaza suena a piedra (${pasos.superficieLaja})`);
    ok(!pasos.superficiePasto || ['pasto', 'piedra', 'nieve'].includes(pasos.superficiePasto), `el césped de la plaza no suena a tablón (${pasos.superficiePasto})`);
    const alero = await js(`(async()=>{ const H = ${H}, c = H.T.lugares.cueva; if (!c) return null; const f = async (x, z, y) => { H.jugador.ubicar(x, z, 0, y); for (let k = 0; k < 4; k++) { for (let i = 0; i < 3; i++) H.__bucle(); await new Promise((r) => setTimeout(r, 200)); } return H.__techo().espacio };
      return { abajo: await f((c.x + c.pared.x) / 2, (c.z + c.pared.z) / 2, c.y), arriba: await f((c.x + c.pared.x) / 2, (c.z + c.pared.z) / 2, c.y + 6) } })()`);
    ok(!alero || (alero.abajo !== 'cueva' && alero.arriba === 'bosque'), `el alero suena a roca abajo y a bosque arriba, no a cueva (${JSON.stringify(alero)})`);

    // ---------------------------------------------------------------- 8. la huerta no compila al sembrar
    donde = 'huerta';
    const hu = await js(`(async()=>{ const H = ${H}; const antes = H.renderer.info.programs.length; const m = H.__rincones.mundo?.()?.matas?.(); if (!m) return { sin: true };
      const ic = !!m.hojas.instanceColor && !!m.frutos.instanceColor; return { ic, antes } })()`);
    ok(hu.sin || hu.ic, `las matas de la huerta traen el color por instancia desde el principio (${JSON.stringify(hu)})`);
  } catch (e) { errores.push(`excepción [${donde}]: ${e && e.stack || e}`); }
  console.log(errores.length ? `\nFALLÓ (${errores.length}):\n${errores.join('\n')}` : '\nOK humo 3.8.7 mundo');
  app.exit(errores.length ? 1 : 0);
});

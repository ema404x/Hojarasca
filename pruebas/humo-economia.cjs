// Partida real 3.8.8: la economía en el juego de verdad (Chromium sin pantalla, vía Playwright).
// Abre index.html (después de `node armar.mjs`), entra al Relax y recorre: el banco en su lugar, el gerente atendiendo detrás del mostrador,
// el mostrador (préstamo, pago, abastecimiento, casas, puesto), el cierre de cuentas de un día nuevo, un jornal y una etapa de casa con precio.
// Saca fotos a pruebas/salidas/economia/.
// Uso: node pruebas/humo-economia.cjs        (necesita playwright: PLAYWRIGHT_BROWSERS_PATH apuntando a un Chromium)
const path = require('path');
const fs = require('fs');
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const raiz = path.resolve(__dirname, '..');
const salida = path.join(raiz, 'pruebas', 'salidas', 'economia');
fs.mkdirSync(salida, { recursive: true });
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const errores = [], pasos = [];
  const b = await chromium.launch({ headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
  const pg = await b.newPage({ viewport: { width: 1100, height: 700 } });
  pg.on('console', (m) => { const t = m.text(); if (m.type() === 'error' && !/Security|GL_INVALID|PCF|Autofill|AudioContext|GPU stall|WebGL/.test(t)) errores.push(t.slice(0, 300)); });
  pg.on('pageerror', (e) => errores.push('PAGEERROR ' + String(e).slice(0, 400)));
  const ok = (cond, texto) => { pasos.push(`${cond ? '✓' : '✗'} ${texto}`); console.log(pasos.at(-1)); if (!cond) errores.push(texto); };
  // (el render por software va a menos de un cuadro por segundo: antes de sacar una foto se esperan unos cuadros nuevos)
  const cuadros = async (n = 4) => { const c0 = await ev(() => { if (!window.__cuadros) { window.__cuadros = 0; const f = () => { window.__cuadros++; requestAnimationFrame(f); }; requestAnimationFrame(f); } return window.__cuadros; }); for (let i = 0; i < 90; i++) { await esperar(500); if ((await ev(() => window.__cuadros)) - c0 >= n) return; } };
  const foto = async (n) => { await cuadros(4); return pg.screenshot({ path: path.join(salida, n + '.png'), timeout: 180000 }); };
  const ev = (f, a) => pg.evaluate(f, a);
  try {
    const url = 'file://' + path.join(raiz, 'index.html') + '?debug=1';
    await pg.goto(url);
    await ev(() => { localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'muybaja', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false })); });
    await pg.goto(url);
    let listo = false;
    for (let i = 0; i < 240 && !listo; i++) { await esperar(1000); listo = await ev(() => !!window.__hojarasca).catch(() => false); }
    ok(listo, 'carga el Relax');
    await ev(() => { document.getElementById('btn-entrar').click(); });
    await esperar(3000);

    // ---- 1. la partida trae economía y negocios; el banco está en el plano
    const a = await ev(() => { const H = window.__hojarasca, p = H.progreso; return { eco: !!p.economia, neg: !!p.negocios, dia: p.dia, edi: H.__aldea.edificio('banco-pueblo'), pts: Object.keys(H.__aldea.puntos('banco-pueblo')) }; });
    ok(a.eco && a.neg, 'la partida nueva trae economía y negocios');
    ok(a.edi && Number.isFinite(a.edi.x) && a.pts.includes('adentro') && a.pts.includes('cliente'), `el banco está en el plano (${a.edi ? a.edi.x.toFixed(0) + ', ' + a.edi.z.toFixed(0) : '?'})`);

    // ---- 2. a las 10 de un día hábil, el gerente atiende detrás del mostrador
    await ev(() => { const H = window.__hojarasca, p = H.progreso; p.dia = 2; p.horas = 10; p.aldea = p.aldea || {}; });
    // que la aldea se arme y los vecinos se ubiquen: se acerca el jugador y se dan varias vueltas
    await ev(() => { const H = window.__hojarasca, e = H.__aldea.edificio('banco-pueblo'), q = H.__aldea.puntos('banco-pueblo'); const js = H.jugador.estado; js.pos.set(q.cliente.x, H.T.altura(q.cliente.x, q.cliente.z) + 0.1, q.cliente.z); js.yaw = Math.atan2(-(q.adentro.x - q.cliente.x), -(q.adentro.z - q.cliente.z)); });
    // (el render por software va a menos de un cuadro por segundo: se montan los edificios y se arman todos los vecinos de una, sin esperar los cuadros)
    await ev(() => { const H = window.__hojarasca, AM = H.__aldeaMundo(); let n = 0; while (AM.medir().cola > 0 && n < 200) { AM.montarCola(true); n++; } H.__aldea.mundo().prearmar(120000); });
    ok(await ev(() => !!window.__hojarasca.__aldeaMundo().estadoEdificio('banco-pueblo')?.montada), 'el banco está montado en el valle');
    let g = null;
    for (let i = 0; i < 120 && !g; i++) {
      await ev(() => window.__hojarasca.__aldea.mundo().revisarDia()); await esperar(500);
      g = await ev(() => { const H = window.__hojarasca, M = H.__aldea.mundo(), st = M.personas.get('gerente'), q = H.__aldea.puntos('banco-pueblo'); if (!st?.npc) return null; return { x: st.npc.pos.x, z: st.npc.pos.z, qx: q.adentro.x, qz: q.adentro.z, nombre: st.npc.nombre, d: Math.hypot(st.npc.pos.x - q.adentro.x, st.npc.pos.z - q.adentro.z) }; });
    }
    ok(!!g, 'el gerente existe en la aldea');
    if (g) ok(g.d < 2.5, `el gerente atiende detrás del mostrador (a ${g.d.toFixed(1)} m de su lugar)`);
    await ev(() => { for (let k = 0; k < 4; k++) window.__hojarasca.__aldea.actualizar(0.6); });
    const vis = await ev(() => { const n = window.__hojarasca.__aldea.mundo().personas.get('gerente')?.npc; return { vis: !!n?.g?.visible, dormido: !!n?.dormido }; });
    ok(vis.vis && !vis.dormido, 'y está despierto y a la vista');
    await foto('01-adentro-del-banco');
    // desde afuera
    await ev(() => { const H = window.__hojarasca, q = H.__aldea.puntos('banco-pueblo'), js = H.jugador.estado; const x = q.puerta.x + Math.sin(q.puerta.rot) * 9, z = q.puerta.z + Math.cos(q.puerta.rot) * 9; js.pos.set(x, H.T.altura(x, z) + 0.1, z); js.yaw = Math.atan2(-(q.puerta.x - x), -(q.puerta.z - z)); });
    await esperar(2500); await foto('02-fachada');

    // ---- 3. hablarle abre el mostrador
    await ev(() => { const H = window.__hojarasca, q = H.__aldea.puntos('banco-pueblo'), js = H.jugador.estado; js.pos.set(q.cliente.x, H.T.altura(q.cliente.x, q.cliente.z) + 0.1, q.cliente.z); const st = H.__aldea.mundo().personas.get('gerente'); H.hablar(st.npc); });
    await esperar(500);
    const charla = await ev(() => ({ visible: !document.getElementById('charla').classList.contains('oculto'), texto: document.getElementById('charla').textContent.slice(0, 200) }));
    ok(charla.visible && /Amadeo|mostrador|Buenas/.test(charla.texto), 'hablarle abre su charla');
    for (let i = 0; i < 6 && !(await ev(() => window.__hojarasca.__enElBanco())); i++) { await ev(() => document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', bubbles: true }))); await esperar(300); }
    ok(await ev(() => window.__hojarasca.__enElBanco()), 'con E se pasa al mostrador y se abre el panel');
    await foto('03-mostrador-prestamos');
    const clic = (texto) => ev((t) => { const bs = [...document.querySelectorAll('#banco-pueblo-contenido button')]; const b = bs.find((x) => x.textContent.includes(t) && !x.disabled); if (!b) return false; b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })); return true; }, texto);
    const pesos = () => ev(() => window.__hojarasca.progreso.economia.pesos);

    // ---- 4. un préstamo, de verdad
    ok(await clic('$2.000 · devolvés'), 'pide un préstamo de $2.000');
    ok(await pesos() === 2000, `y la billetera sube ($${await pesos()})`);
    await esperar(300); await foto('04-con-deuda');
    ok(await clic('Pagar $500'), 'paga $500');
    ok(await pesos() === 1500, 'y baja la billetera');
    ok(await clic('Abastecimiento'), 'pasa a Abastecimiento');
    await foto('05-abastecimiento');
    ok(await clic('Casas y alquiler'), 'pasa a Casas y alquiler');
    await foto('06-casas');
    ok(await clic('Mi puesto'), 'pasa a Mi puesto');
    await foto('07-puesto');
    // se sale con Escape, como el resto de los paneles
    await ev(() => document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true })));
    await esperar(300);
    ok(!(await ev(() => window.__hojarasca.__enElBanco())), 'Escape cierra el mostrador');

    // ---- 5. un día nuevo: la aldea cierra las cuentas, corre el interés
    const antes = await ev(() => { const n = window.__hojarasca.progreso.negocios; return { cierre: n.cierre, debe: n.banco.prestamo?.debe, caja: n.cajas.carpintero }; });
    await ev(() => { const H = window.__hojarasca; H.progreso.dia += 2; H.__aldea.mundo().revisarDia(); });
    const despues = await ev(() => { const n = window.__hojarasca.progreso.negocios; return { cierre: n.cierre, debe: n.banco.prestamo?.debe, cajas: Object.keys(n.cajas).length }; });
    ok(despues.cierre === await ev(() => window.__hojarasca.progreso.dia) && despues.debe > antes.debe, `dos días después: las cuentas al día y el interés corrió (${antes.debe} → ${despues.debe})`);

    // ---- 6. un jornal de verdad: llega el carpintero, se le habla y la charla termina en el sueldo
    await ev(() => {
      const H = window.__hojarasca, p = H.progreso, a = p.aldea;
      a.pobladores = [{ clave: 'carpintero', dia: 1 }]; a.locales = { carpinteria: 1 }; p.materiales = { ...p.materiales, tronco: 0 }; p.economia.pesos = 0; p.negocios.cajas = {};
      const AM = H.__aldeaMundo(), q = H.__aldea.puntos('carpinteria'), js = H.jugador.estado;
      js.pos.set(q.cliente.x, H.T.altura(q.cliente.x, q.cliente.z) + 0.1, q.cliente.z);
      let n = 0; while (AM.medir().cola > 0 && n < 200) { AM.montarCola(true); n++; }
      H.__aldea.mundo().prearmar(120000);
      for (let k = 0; k < 6; k++) H.__aldea.actualizar(0.6);
    });
    const carp = await ev(() => { const n = window.__hojarasca.__aldea.mundo().personas.get('carpintero')?.npc; return !!n; });
    ok(carp, 'el carpintero está en su carpintería');
    await ev(() => { const H = window.__hojarasca; H.hablar(H.__aldea.mundo().personas.get('carpintero').npc); });
    await esperar(400);
    const vistos = [];
    for (let i = 0; i < 8 && (await ev(() => !document.getElementById('charla').classList.contains('oculto'))); i++) {
      vistos.push(await ev(() => document.getElementById('charla').textContent.replace(/\s+/g, ' ')));
      if (i === 1) await foto('08-jornal');
      await ev(() => document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', bubbles: true }))); await esperar(250);
    }
    const oferta = vistos.join(' | ');
    ok(/Son \$1\.100 por el jornal/.test(oferta), `el carpintero ofrece el jornal («${(vistos[1] || '').slice(0, 80)}…»)`);
    const cobro = await ev(() => ({ pesos: window.__hojarasca.progreso.economia.pesos, libro: window.__hojarasca.progreso.economia.libro.at(-1), oficio: window.__hojarasca.progreso.negocios.oficio.carpintero, caja: window.__hojarasca.progreso.negocios.cajas.carpintero }));
    ok(cobro.pesos === 1100 && /^Jornal: /.test(cobro.libro?.motivo || '') && cobro.oficio === 1, `el jornal paga $1.100 y queda en el libro («${cobro.libro?.motivo}»; caja del local $${cobro.caja})`);
    // hablarle de nuevo el mismo día: ya no hay jornal
    await ev(() => { const H = window.__hojarasca; H.hablar(H.__aldea.mundo().personas.get('carpintero').npc); });
    await esperar(400);
    const otra = await ev(() => document.getElementById('charla').textContent);
    ok(/ya me ayudaste|mañana/i.test(otra) || !/\$1\.100 por el jornal/.test(otra), 'el mismo día no hay un segundo jornal');
    for (let i = 0; i < 8 && (await ev(() => !document.getElementById('charla').classList.contains('oculto'))); i++) { await ev(() => document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }))); await esperar(250); }

    // ---- 7. una etapa de casa con precio, en la obra de verdad
    const casa = await ev(() => {
      const H = window.__hojarasca, p = H.progreso, js = H.jugador.estado;
      const plano = H.PLANOS.find((x) => x.id === 'cabana-piedra');
      if (!plano) return { error: 'sin plano' };
      // un lugar llano del valle, lejos de todo, cerca del refugio
      const r = H.T.lugares?.refugio || { x: js.pos.x, z: js.pos.z };
      js.pos.set(r.x + 22, H.T.altura(r.x + 22, r.z + 22) + 0.1, r.z + 22); js.yaw = 0;
      H.obras.elegir(plano);
      p.economia.pesos = 0; p.materiales = { ...p.materiales, piedra: 40, tronco: 40, tabla: 60 };
      return { ok: true };
    });
    ok(!casa.error, 'se elige la cabaña');
    let marca = { obras: 0 };
    for (let i = 0; i < 40 && marca.obras < 1; i++) {
      marca = await ev((i2) => {
        const H = window.__hojarasca, js = H.jugador.estado, r = H.T.lugares?.refugio || { x: js.pos.x, z: js.pos.z };
        const x = r.x + 30 + (i2 % 8) * 9, z = r.z + 30 + Math.floor(i2 / 8) * 9;
        js.pos.set(x, H.T.altura(x, z) + 0.1, z); js.yaw = 0.3 * i2;
        H.__aldea.accionObra();
        return { obras: H.obras.obras.length, nota: document.getElementById('notas').textContent };
      }, i);
    }
    await ev(() => { window.__hojarasca.__aldea.accionObra(); });   // sin plata: no avanza
    const sinPlata = await ev(() => ({ etapas: window.__hojarasca.obras.obras.at(-1)?.datos.etapas, pesos: window.__hojarasca.progreso.economia.pesos, nota: document.getElementById('notas').textContent }));
    ok(sinPlata.etapas === 0 && /Falta plata/.test(sinPlata.nota), `sin plata no se levanta la primera etapa («${sinPlata.nota.slice(0, 60)}»)`);
    await ev(() => { window.__hojarasca.progreso.economia.pesos = 13000; window.__hojarasca.__aldea.accionObra(); });
    const conPlata = await ev(() => { const o = window.__hojarasca.obras.obras.at(-1); return { etapas: o?.datos.etapas, pagadas: o?.datos.pagadas, pesos: window.__hojarasca.progreso.economia.pesos }; });
    ok(conPlata.etapas === 1 && conPlata.pesos === 400 && conPlata.pagadas === 1, `con $13.000 se levanta y se cobra el terreno ($12.600; quedan $${conPlata.pesos})`);
    await foto('09-obra-de-la-cabana');

    // ---- 8. guardar y recargar: todo sigue ahí
    await ev(() => { window.__hojarasca.guardar(); });
    const guardado = await ev(() => { return Math.max(0, ...Object.values(localStorage).map((v) => v.length)); });
    ok(guardado > 1000, `la partida se guarda (${guardado} caracteres)`);
    await pg.reload();
    for (let i = 0; i < 240; i++) { await esperar(1000); if (await ev(() => !!window.__hojarasca).catch(() => false)) break; }
    await ev(() => { const b = document.getElementById('btn-continuar') || document.getElementById('btn-entrar'); b?.click(); });
    await esperar(3500);
    const tras = await ev(() => { const p = window.__hojarasca.progreso; return { pesos: p.economia?.pesos, debe: p.negocios?.banco?.prestamo?.debe, pagadas: p.obras?.find((o) => o.plano === 'cabana-piedra')?.pagadas }; });
    ok(tras.pesos === 400 && tras.debe > 0 && tras.pagadas === 1, `después de recargar: $${tras.pesos}, debe ${tras.debe}, etapa pagada ${tras.pagadas}`);
  } catch (e) {
    errores.push('EXCEPCIÓN ' + (e && e.stack ? e.stack : e));
  }
  await b.close();
  fs.writeFileSync(path.join(salida, 'resumen.txt'), pasos.join('\n') + '\n\nERRORES:\n' + errores.join('\n') + '\n');
  console.log(errores.length ? `\nFALLÓ (${errores.length}):\n` + errores.join('\n') : '\nOK humo-economia: ' + pasos.length + ' pasos');
  process.exit(errores.length ? 1 : 0);
})();

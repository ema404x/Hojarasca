// 3.9.2: la parte de la ECONOMÍA DEL BANCO de la partida real (la llama humo-3-9-2-mejoras.cjs con su contexto): el horario del gerente, hablarle, el mostrador
// (préstamo, pago, abastecimiento, casas y alquiler, puesto propio) y una casa terminada de verdad. Es lo que el guion de Playwright (herramientas/partida-real-economia.cjs)
// nunca llegó a ver en el juego real.
module.exports = async (c) => {
  const { js, ok, H, foto, mirar, armarMundo, aLaHora, estarEn, pasar, esperar, cuadro } = c;
  const tecla = (code) => js(`document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', bubbles: true })); 1`);   // (sólo keydown, como el guion de Playwright: con el keyup pegado no avanzaba la charla)
  const ID = 'banco-pueblo';
  console.log('— la economía del banco, en el juego');
  await js(`(() => { const P = ${H}.progreso; P.economia.pesos = 0; P.negocios.cajas = {}; return 1 })()`);
  await estarEn(ID);
  const gerente = () => js(`(() => { const st = ${H}.__aldea.mundo().personas.get('gerente'); return st ? { lugar: st.destino?.lugar || null, punto: st.destino?.punto || null, visible: !!st.npc?.g?.visible, dormido: !!st.npc?.dormido } : null })()`);
  const aHora = async (dia, h, n = 14) => { await aLaHora(dia, h); await js(`${H}.__aldea.mundo().revisarDia(); 1`); await pasar(n); return gerente(); };

  // ---- el horario (el del cartel de la puerta): lunes a sábado de 8:30 a 12:30 y de 14:30 a 18; el domingo no. Se busca un día sin fiesta (esos días el pueblo
  // se va al predio y el gerente también: es lo diseñado) y se recorre el reloj hacia adelante, como pasa en el juego
  let dia = 0;
  for (const d of [9, 10, 11, 12, 8, 16, 17, 18]) {
    const g1 = await aHora(d, 10.0), g2 = await aHora(d, 15.0);
    if (g1 && g2 && g1.lugar === 'trabajo' && g2.lugar === 'trabajo') { dia = d; break; }
    console.log('  (el día ' + d + ' el gerente no trabaja a las 10 y a las 15: ' + JSON.stringify([g1 && g1.lugar, g2 && g2.lugar]) + ')');
  }
  ok(dia > 0, `hay un día hábil sin fiesta para probar el horario (día ${dia})`);
  const sec = [[7.9, false, 'a las 7:54 todavía no abrió'], [8.6, true, 'a las 8:36 ya abrió'], [10.0, true, 'a las 10 atiende'], [12.3, true, 'a las 12:18 todavía atiende'], [12.7, false, 'a las 12:42 cerró a la siesta'], [13.8, false, 'a las 13:48 sigue cerrado (30 minutos antes de abrir ya espera en su puesto: ver conTiempo)'], [14.7, true, 'a las 14:42 abrió de nuevo'], [17.8, true, 'a las 17:48 sigue atendiendo'], [18.3, false, 'a las 18:18 cerró']];
  await aHora(dia, 7.0);
  for (const [h, abierto, texto] of sec) { const g = await aHora(dia, h, 16); ok(!!g && (g.lugar === 'trabajo' && g.punto === 'adentro') === abierto, `${texto} (${g && g.lugar}/${g && g.punto})`); }
  const diaDom = Math.ceil(dia / 7) * 7;   // el domingo es el día 7, 14, 21…
  const dom = await aHora(diaDom, 10.0, 16);
  console.log('  domingo (día ' + diaDom + ') 10:00:', JSON.stringify(dom));
  ok(!!dom && dom.lugar !== 'trabajo', 'el domingo no atiende');
  for (const ds of [6, 13, 20]) { const g = await aHora(ds, 15.0, 16); const g2 = await aHora(ds, 16.5, 16); console.log(`  sábado (día ${ds}) 15:00 → ${g && g.lugar}; 16:30 → ${g2 && g2.lugar}`); }
  // (de acá en más los días sólo avanzan, como en el juego: el cierre de cuentas de la aldea no vuelve para atrás)
  const base = 22;
  await aHora(base, 10.0, 18);

  // ---- hablarle y pasar al mostrador (el saludo ahora depende de tus deudas, tus negocios, el día y la estación)
  await js(`(() => { const H = ${H}, q = H.__aldea.puntos('${ID}'), js = H.jugador.estado; const e = H.__aldea.edificio('${ID}'); js.pos.set(q.cliente.x, H.T.altura(q.cliente.x, q.cliente.z) + 0.1, q.cliente.z); H.__hablar(H.__aldea.mundo().personas.get('gerente').npc); return 1 })()`);
  await esperar(300);
  const charla = () => js(`({ visible: !document.getElementById('charla').classList.contains('oculto'), texto: document.getElementById('charla').textContent.replace(/\\s+/g, ' ') })`);
  let ch = await charla();
  ok(ch.visible && /Amadeo/.test(ch.texto), 'hablarle abre su charla');
  await foto('economia-01-saludo', true);
  const dichos = [];
  for (let i = 0; i < 10 && !(await js(`${H}.__enElBanco()`)); i++) { const t = (await charla()).texto; dichos.push(t); if (i === 3) await foto('economia-01b-saludo-del-banco', true); await tecla('KeyE'); await esperar(300); }
  console.log('  lo que dijo hasta el mostrador:\n    ' + dichos.map((t) => t.slice(0, 260)).join('\n    '));
  ok(await js(`${H}.__enElBanco()`), 'con E se pasa al mostrador');
  const clic = (texto) => js(`(() => { const bs = [...document.querySelectorAll('#banco-pueblo-contenido button')]; const b = bs.find((x) => x.textContent.includes(${JSON.stringify(texto)}) && !x.disabled); if (!b) return false; b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })); return true })()`);
  const pesos = () => js(`${H}.progreso.economia.pesos`);
  const voz = () => js(`(document.querySelector('#banco-pueblo-contenido .banco-texto')?.textContent || '')`);
  console.log('  su frase en Préstamos:', await voz());
  await foto('economia-02-mostrador', true);

  // ---- un préstamo, un pago y el saldo
  ok(await clic('$2.000 · devolvés'), 'pide un préstamo de $2.000');
  ok((await pesos()) === 2000, `la billetera sube ($${await pesos()})`);
  console.log('  Amadeo después del préstamo:', await voz());
  ok(/Amadeo/.test(await voz()), 'y Amadeo lo comenta');
  await foto('economia-03-con-deuda', true);
  ok(await clic('Pagar $500'), 'paga $500');
  ok((await pesos()) === 1500, 'baja la billetera');
  console.log('  Amadeo después del pago:', await voz());

  // ---- el abastecimiento: se le da lo que el banco pide (se llena la mochila de todo y se entrega)
  await js(`(() => { const P = ${H}.progreso; P.materiales = { ...(P.materiales || {}), tronco: 99, tabla: 99, piedra: 99, cristal: 99, lana: 99 }; P.cosas = { ...(P.cosas || {}), harina: 99, poncho: 9 };
    P.entradas = P.entradas || {}; for (const id of ['huevo', 'haba', 'papa', 'frutilla', 'miel', 'trucha-fresca', 'trucha-ahumada', 'frasco-frutilla', 'calafate-seco', 'hongos-secos', 'pan-casero', 'empanadas']) { const e = P.entradas[id] || (P.entradas[id] = {}); e.cantidad = 99; } return 1 })()`);
  ok(await clic('Abastecimiento'), 'pasa a Abastecimiento');
  const textoAbasto = await js(`document.querySelector('#banco-pueblo-contenido').textContent.replace(/\\s+/g, ' ')`);
  console.log('  pedido:', (textoAbasto.match(/El banco necesita[^T]*/) || [''])[0]);
  await foto('economia-04-abastecimiento', true);
  const p0 = await pesos();
  ok(await clic('Entregar el pedido'), 'entrega el pedido del banco');
  ok((await pesos()) > p0, `y cobra por encima del mercado ($${p0} → $${await pesos()})`);
  console.log('  Amadeo después del pedido:', await voz());

  // ---- una casa terminada, de verdad, y el alquiler
  await js(`(() => { const H = ${H}; H.jugador.estado.pos.set(0, 0, 0); document.getElementById('banco-pueblo').classList.add('oculto'); return 1 })()`);
  await tecla('Escape'); await esperar(300);
  ok(!(await js(`${H}.__enElBanco()`)), 'Escape cierra el mostrador');
  const casa = await js(`(() => {
    const H = ${H}, p = H.progreso, js = H.jugador.estado;
    const plano = H.PLANOS.find((x) => x.id === 'cabana-piedra');
    if (!plano) return { error: 'sin plano' };
    const r = H.T.lugares?.refugio || { x: js.pos.x, z: js.pos.z };
    js.pos.set(r.x + 22, H.T.altura(r.x + 22, r.z + 22) + 0.1, r.z + 22); js.yaw = 0;
    H.obras.elegir(plano);
    p.economia.pesos = 60000; p.materiales = { ...p.materiales, piedra: 400, tronco: 400, tabla: 400, cristal: 40, lana: 40 };
    return { ok: true };
  })()`);
  ok(!casa.error, 'se elige la cabaña');
  let marca = { obras: 0 };
  for (let i = 0; i < 40 && marca.obras < 1; i++) {
    marca = await js(`(() => { const H = ${H}, js = H.jugador.estado, r = H.T.lugares?.refugio || { x: js.pos.x, z: js.pos.z }; const i2 = ${i}; const x = r.x + 30 + (i2 % 8) * 9, z = r.z + 30 + Math.floor(i2 / 8) * 9;
      js.pos.set(x, H.T.altura(x, z) + 0.1, z); js.yaw = 0.3 * i2; H.__aldea.accionObra(); return { obras: H.obras.obras.length, x, z } })()`);
  }
  ok(marca.obras >= 1, 'se funda la obra de la cabaña');
  for (let k = 0; k < 6; k++) { await js(`${H}.__aldea.accionObra(); 1`); await esperar(150); }
  await esperar(1200); await tecla('Escape'); await esperar(300);   // (el cuadro para ponerle nombre a la casa)
  const estadoCasa = await js(`(() => { const o = ${H}.obras.obras.at(-1); return { etapas: o?.datos.etapas, pagadas: o?.datos.pagadas, poseidas: ${H}.progreso.negocios.casas.poseidas, pesos: ${H}.progreso.economia.pesos } })()`);
  console.log('  casa:', JSON.stringify(estadoCasa));
  ok(estadoCasa.etapas === 4 && estadoCasa.poseidas['cabana-piedra'] === 1, 'la cabaña quedó terminada y registrada como tuya');
  ok(estadoCasa.pesos === 60000 - 36000, `y se pagó el terreno y la mano de obra en las cuatro etapas ($${estadoCasa.pesos})`);
  await js(`document.getElementById('pausa').classList.add('oculto'); 1`);
  // cómo se ve con el terreno y la luz
  await aLaHora(base, 11);
  await js(`(() => { const H = ${H}, o = H.obras.obras.at(-1).datos, js = H.jugador.estado; const d = o; return 1 })()`);
  const datosCasa = await js(`(() => { const o = ${H}.obras.obras.at(-1).datos; return { x: o.x, z: o.z, y: o.y, yaw: o.yaw ?? o.rot ?? 0 } })()`);
  console.log('  ubicación:', JSON.stringify(datosCasa));
  for (const [nombre, dx, dz] of [['casa-frente', 0, 9], ['casa-3-4', 7, 7]]) {
    await js(`(() => { const H = ${H}, o = ${JSON.stringify(datosCasa)}; const x = o.x + ${dx}, z = o.z + ${dz}, y = H.T.altura(x, z) + 1.9; const yaw = Math.atan2(-(o.x - x), -(o.z - z)); const js = H.jugador.estado; js.pos.set(x, y - 1.65, z); js.vel.set(0, 0, 0); js.yaw = yaw; js.pitch = -0.12; H.__camaraFija = null; return 1 })()`);
    await cuadro(6); await esperar(300); await cuadro(4);
    await foto('economia-casa-' + nombre.replace('casa-', ''));
  }
  // al banco: el alquiler
  await estarEn(ID);
  await js(`(() => { const H = ${H}, q = H.__aldea.puntos('${ID}'), js = H.jugador.estado; js.pos.set(q.cliente.x, H.T.altura(q.cliente.x, q.cliente.z) + 0.1, q.cliente.z); H.__banco().abrir('casas'); return 1 })()`);
  await esperar(300);
  await foto('economia-05-casas', true);
  ok(await clic('Poner en alquiler'), 'pone la cabaña en alquiler');
  const alq = await js(`${H}.progreso.negocios.casas.alquiladas`);
  console.log('  alquiler:', JSON.stringify(alq));
  ok(Object.keys(alq).length === 1, `se instala un inquilino (${Object.values(alq)[0]?.inquilino})`);
  console.log('  Amadeo después del alquiler:', await voz());
  await foto('economia-06-alquilada', true);
  const antesRenta = await pesos();
  await js(`(() => { const H = ${H}; H.progreso.dia += 3; H.__aldea.mundo().revisarDia(); return 1 })()`);
  const cobrado = await js(`${H}.progreso.negocios.casas.cobrado`);
  ok(cobrado > 0 && (await pesos()) > antesRenta, `tres días después, el alquiler entra solo (cobrado $${cobrado})`);

  // ---- el puesto propio
  await js(`(() => { ${H}.progreso.economia.pesos = Math.max(${H}.progreso.economia.pesos, 9000); ${H}.__banco().abrir('puesto'); return 1 })()`);
  await esperar(300);
  ok(await clic('Comprar el puesto'), 'compra el puesto en la feria');
  await foto('economia-07-puesto', true);
  ok(await clic('Dejar 1 lote'), 'deja un lote en consigna');
  await js(`(() => { const H = ${H}; H.progreso.dia += 1; H.__aldea.mundo().revisarDia(); return 1 })()`);
  const cajaP = await js(`${H}.progreso.negocios.casas.puesto?.caja`);
  ok(cajaP > 0, `al día siguiente el puesto vendió (caja $${cajaP})`);
  await js(`${H}.__banco().dibujar(); 1`);
  ok(await clic('Retirar la caja'), 'retira la caja del puesto');
  console.log('  Amadeo después de retirar:', await voz());
  await foto('economia-08-caja', true);

  // ---- el vencimiento: un préstamo que se pasa de plazo cambia el saludo y no deja pedir
  await js(`(() => { const H = ${H}; H.progreso.economia.pesos = 20000; H.__banco().abrir('prestamos'); return 1 })()`);
  await clic('Saldar todo');
  ok(await clic('$1.000 · devolvés'), 'pide otro préstamo de $1.000 (después de saldar el primero)');
  await js(`(() => { const H = ${H}; H.__banco().cerrar(); H.progreso.dia += 14; H.__aldea.mundo().revisarDia(); H.__banco().abrir('prestamos'); return 1 })()`);
  await esperar(300);
  const vencido = await js(`document.querySelector('#banco-pueblo-contenido').textContent.replace(/\\s+/g, ' ')`);
  console.log('  vencido:', vencido.slice(0, 500));
  ok(/Venció|plazo/.test(vencido), 'pasado el plazo, el mostrador lo dice (y el interés sube)');
  await foto('economia-09-vencido', true);
  await js(`${H}.__banco().cerrar(); 1`);
  // al hablarle, ahora el saludo es el de la deuda vencida
  await js(`(() => { const H = ${H}, q = H.__aldea.puntos('${ID}'), js = H.jugador.estado; js.pos.set(q.cliente.x, H.T.altura(q.cliente.x, q.cliente.z) + 0.1, q.cliente.z); return 1 })()`);
  { const d0 = await js(`${H}.progreso.dia`); for (let d = d0; d < d0 + 9; d++) { const g = await aHora(d, 10.0, 16); if (g && g.lugar === 'trabajo') break; } }   // (un día en que atienda)
  await js(`(() => { const H = ${H}, q = H.__aldea.puntos('${ID}'), js = H.jugador.estado, st = H.__aldea.mundo().personas.get('gerente'); js.pos.set(q.cliente.x, H.T.altura(q.cliente.x, q.cliente.z) + 0.1, q.cliente.z); js.yaw = Math.atan2(-(st.npc.pos.x - q.cliente.x), -(st.npc.pos.z - q.cliente.z)); H.__hablar(st.npc); return 1 })()`); await esperar(300);
  const dichos2 = [];
  for (let i = 0; i < 10 && !(await js(`${H}.__enElBanco()`)); i++) { dichos2.push((await charla()).texto); await tecla('KeyE'); await esperar(300); }
  console.log('  con la deuda vencida dijo:\n    ' + dichos2.map((t) => t.slice(0, 260)).join('\n    '));
  ok(dichos2.some((t) => /vencid|plazo|gotera|reclam|aritmética/i.test(t)), 'con la deuda vencida su saludo cambia');
  await js(`${H}.__banco().cerrar(); 1`); await tecla('Escape'); await esperar(200);
};

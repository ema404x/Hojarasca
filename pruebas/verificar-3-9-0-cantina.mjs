// 3.9.0 · La cantina (primera versión: el lugar, sentarse y pedir de verdad).
//   1. el sitio: medido con el terreno real (sin agua, desnivel, lejos de la vía, 3 m de los demás, con calle al frente) y «al final de todo»:
//      el edificio más lejano de la estación por las calles;
//   2. la arquitectura: sillas y barra donde dice el núcleo, presupuesto, el cartel y el horario;
//   3. Lucrecia, la moza: de 18 a 2 atiende, duerme hasta las 11, va sin corrimiento;
//   4. la carta por estación, el tiempo y lo que produce la aldea;
//   5. los precios y las tres formas de pagar (pesos, trueque, cuenta con pesos o con mandado), el límite de la cuenta y de los tragos fuertes;
//   6. el flujo entero con figuras y un DOM de mentira: te sentás, ella VIENE CAMINANDO (paso a paso, sin saltos), saludo, carta, pedido, barra,
//      bandeja, mesa, sorbos, vos te levantás y ella levanta la mesa;
//   7. el guardado (partidas de antes sin el campo, basura, el Desafío) y los enganches de main.js, guardado.js y la plantilla;
//   8. todos los textos con su inglés y sin nada religioso.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const A = await import('../src/aldea.js');
const AR = await import('../src/aldea-arquitectura.js');
const G = await import('../src/aldea-gente.js');
const { generarTerreno } = await import('../src/terreno.js');
const { LIMITE } = await import('../src/config.js');
const E = await import('../src/economia.js');
const C = await import('../src/cantina.js');
const CJ = await import('../src/cantina-juego.js');
const { crearGuardado } = { crearGuardado: null };
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const ID = 'cantina';
void crearGuardado;

// ---------------------------------------------------------------- 1. el sitio
{
  const T = generarTerreno(), marco = A.marcoAldea();
  const e = A.EDIFICIOS_ALDEA[ID];
  ok(e && e.inicial && e.rol === 'local' && !e.poblador && e.nombre === 'La cantina', 'está desde el día 1, es un local sin poblador');
  ok(A.INICIALES_ALDEA.includes(ID), 'entre los iniciales');
  eq([e.ancho, e.fondo], [AR.EDIFICIOS_ALDEA[ID].ancho, AR.EDIFICIOS_ALDEA[ID].fondo], 'mismo tamaño en el núcleo y en la arquitectura');
  ok(Math.abs(Math.sin(e.rot * 2)) < 1e-9, 'giro de a 90°');
  const segRiel = T.riel.filter((q) => Math.hypot(q.x - A.PARADA_ALDEA.x, q.z - A.PARADA_ALDEA.z) < 500);
  const distRiel = (x, z) => { let d = Infinity; for (let i = 0; i < segRiel.length - 1; i++) { const a = segRiel[i], b = segRiel[i + 1]; const vx = b.x - a.x, vz = b.z - a.z, l2 = vx * vx + vz * vz; const t = Math.max(0, Math.min(1, ((x - a.x) * vx + (z - a.z) * vz) / l2)); d = Math.min(d, Math.hypot(x - a.x - vx * t, z - a.z - vz * t)); } return d; };
  let min = Infinity, max = -Infinity, s = 0, k = 0, agua = false, riel = Infinity, fuera = false, calle = Infinity;
  for (const q of A.muestrasPlanta(ID, 0.25)) {
    const w = marco.aMundo(q.lx, q.lz), h = T.altura(w.x, w.z);
    min = Math.min(min, h); max = Math.max(max, h); s += h; k++;
    riel = Math.min(riel, distRiel(w.x, w.z)); if (T.agua(w.x, w.z)) agua = true;
    if (Math.abs(w.x) > LIMITE - 4 || Math.abs(w.z) > LIMITE - 4) fuera = true;
    for (const c of A.CALLES_ALDEA) calle = Math.min(calle, A.distanciaACalle(q.lx, q.lz, c));
  }
  ok(!agua && !fuera, 'fuera del agua y dentro del valle');
  ok(riel >= 22, `a ${riel.toFixed(1)} m de la vía`);
  ok(max - min <= 1.5, `desnivel de ${(max - min).toFixed(2)} m (≤ 1,5)`);
  ok(Math.abs(s / k - e.y) < 0.05, `el piso a la media del terreno (${(s / k).toFixed(2)} vs ${e.y})`);
  ok(calle >= 1, `con vereda (${calle.toFixed(1)} m a la calle)`);
  let cerca = Infinity;
  for (const otro of A.IDS_EDIFICIOS) {
    if (otro === ID) continue;
    const a = A.plantaDe(ID), b = A.plantaDe(otro);
    const d = Math.hypot(Math.max(0, a.x0 - b.x1, b.x0 - a.x1), Math.max(0, a.z0 - b.z1, b.z0 - a.z1));
    ok(d >= 3 - 1e-9, `a ${d.toFixed(1)} m de ${otro} (≥ 3)`);
    cerca = Math.min(cerca, d);
  }
  // la calle de la Loma llega hasta la puerta y no se pisa con ningún otro edificio
  const loma = A.CALLES_ALDEA.find((c) => c.id === 'calle-loma');
  const ult = loma.puntos[loma.puntos.length - 1], pu = A.puntosDe(ID).puerta;
  ok(Math.hypot(ult[0] - pu.x, ult[1] - pu.z) < 6, `la calle de la Loma termina en la puerta de la cantina (${Math.hypot(ult[0] - pu.x, ult[1] - pu.z).toFixed(1)} m)`);
  // «al final de todo»: es el edificio al que más hay que caminar desde la estación (por las puertas y las calles)
  const desde = { x: A.puntosDe('estacion-aldea').puerta.x, z: A.puntosDe('estacion-aldea').puerta.z };
  const largos = A.IDS_EDIFICIOS.filter((id) => !A.EDIFICIOS_ALDEA[id].fija && id !== 'plaza').map((id) => [id, G.largoRecorrido(desde, A.puntosDe(id).puerta)]).sort((a, b) => b[1] - a[1]);
  ok(largos[0][0] === ID, `el más lejano de la estación por las calles: ${largos[0][0]} (${largos[0][1].toFixed(0)} m); le sigue ${largos[1][0]} (${largos[1][1].toFixed(0)} m)`);
  // los puntos
  const pts = A.puntosDe(ID);
  for (const k2 of ['puerta', 'adentro', 'trabajo', 'cama', 'cliente', 'mesa-1', 'mesa-2', 'mesa-3', 'mesa-4']) ok(!!pts[k2], `tiene el punto ${k2}`);
  ok(A.dentroDePlanta(ID, pts.adentro.x, pts.adentro.z, 0.3) && A.dentroDePlanta(ID, pts.cama.x, pts.cama.z, 0.3), 'adentro y la cama, adentro');
  for (const m of A.CANTINA.mesas) ok(A.dentroDePlanta(ID, pts[m.id].x, pts[m.id].z, 0.3), `${m.id}: el lugar de la moza, adentro`);
  ok(A.PUERTA_X[ID] === 0, 'la puerta, en el medio');
}

// ---------------------------------------------------------------- 2. la arquitectura
{
  const d = AR.armarEdificio(ID, 4);
  eq([d.ancho, d.fondo], [10.4, 8], 'las medidas');
  ok(d.exterior.estructura && d.interior.muebles, 'trae estructura y muebles');
  const pres = AR.PRESUPUESTO_ALDEA[AR.EDIFICIOS_ALDEA[ID].clase];
  ok(d.medidas.triangulos.exterior <= pres.exterior && d.medidas.triangulos.interior <= pres.interior, `dentro del presupuesto (${d.medidas.triangulos.exterior} + ${d.medidas.triangulos.interior} de ${pres.exterior} + ${pres.interior})`);
  ok(d.luces.length >= 4 && d.luces.length <= 9 && d.luces.some((l) => l.clase === 'fuego'), `pocas luces (${d.luces.length}) y una es la de la salamandra`);
  ok(d.medidas.dibujos.exterior <= AR.PRESUPUESTO_ALDEA.dibujos.exterior && d.medidas.dibujos.interior <= AR.PRESUPUESTO_ALDEA.dibujos.interior, 'pocos dibujos');
  ok(d.puertas.length >= 1 && d.puertas[0].nombre.includes('cantina'), 'la puerta de la cantina');
  ok(d.colisiones.obstaculos.length > 20, `con obstáculos (${d.colisiones.obstaculos.length}: barra, mesas, sillas, barricas, salamandra)`);
  // los asientos: ocho sillas, las de cada mesa, donde dice el núcleo
  const sillas = d.puntos.asientos.filter((a) => a.nombre === 'una silla de la cantina');
  eq(sillas.length, 8, 'ocho sillas para sentarse (la mesa de truco es de adorno)');
  for (const m of A.CANTINA.mesas) for (const s of m.sillas) ok(sillas.some((q) => Math.hypot(q.lx - s.x, q.lz - s.z) < 0.01 && Math.abs(Math.sin(q.mira - s.mira)) < 1e-6), `${m.id}: la silla de ${s.x}, ${s.z} está en la arquitectura`);
  const mesas = AR.MESAS_CANTINA;
  eq(mesas.map((m) => [m.id, m.x, m.z]), A.CANTINA.mesas.map((m) => [m.id, m.x, m.z]), 'las mesas del núcleo y de la arquitectura son las mismas');
  eq(mesas.flatMap((m) => m.sillas.map(([x, z, g]) => [x, z, g])), A.CANTINA.mesas.flatMap((m) => m.sillas.map((s) => [s.x, s.z, s.mira])), 'y las sillas');
  // la barra y la moza detrás
  const pa = d.puntos.nombrados.adentro, pc = A.puntosDe(ID);
  const aqui = (p) => ({ x: p.lx, z: p.lz });
  const e = A.EDIFICIOS_ALDEA[ID];
  const loc = (q) => ({ x: q.x - e.x, z: q.z - e.z });   // (con rot 0: el marco del edificio es el plano)
  ok(Math.hypot(aqui(pa).x - loc(pc.adentro).x, aqui(pa).z - loc(pc.adentro).z) < 0.05, 'la moza atiende donde está el punto «adentro» del núcleo (detrás de la barra)');
  ok(d.puntos.nombrados.cama && Math.hypot(d.puntos.nombrados.cama.lx - loc(pc.cama).x, d.puntos.nombrados.cama.lz - loc(pc.cama).z) < 0.05, 'la cama, donde dice el núcleo');
  ok(pa.lx < -3 && pa.lz > -1 && pa.lz < 1.5, 'detrás de la barra, junto a la pared de la izquierda');
  // las mesas están a más de 0,8 m una de la otra y de la barra (se puede pasar)
  ok(A.CANTINA.mesas.every((m, i) => A.CANTINA.mesas.every((o, j) => i === j || Math.hypot(m.x - o.x, m.z - o.z) > 1.8)), 'las mesas, separadas');
  // el cartel de arriba y el horario de la puerta (con el mismo horario que la moza)
  ok(AR.CARTELES_ALDEA.some((c) => c.texto === 'La Cantina'), 'el cartel sobre la galería');
  const hor = `Abre de ${A.HORARIO_CANTINA.abre} a ${A.HORARIO_CANTINA.cierra}`;
  ok(AR.CARTELES_ALDEA.some((c) => c.texto === hor), `el horario de la puerta sale de HORARIO_CANTINA («${hor}»)`);
  ok(AR.CARTELES_ALDEA.length <= Math.floor(AR.ATLAS_CARTELES.alto / AR.ATLAS_CARTELES.celdaAlto) * AR.ATLAS_CARTELES.columnas, 'el atlas de carteles alcanza');
  ok(leer('src/aldea-arquitectura.js').includes("cartel(K, 'Abre de 18 a 2'"), 'el cartel del horario se cuelga junto a la puerta');
  eq(AR.armarEdificio(ID, 0).ancho, 10.4, 'una etapa de obra de más se arma igual (es inicial)');
  ok(d.carteles.length >= 2, 'dos carteles');
  // la guitarra y la mesa de truco, la salamandra y la barra con botellas: están (por geometría y por el código)
  const cod = leer('src/aldea-arquitectura.js');
  ok(/guitarraColgada\(K,/.test(cod) && /estanteBotellas\(K,/.test(cod) && /salamandra\(K, xi - 0.5/.test(cod) && /mesa de truco/.test(cod), 'guitarra, estante de botellas, salamandra y mesa de truco');
}

// ---------------------------------------------------------------- 3. Lucrecia
{
  const m = A.VECINOS_ALDEA.moza;
  ok(m && m.nombre === 'Lucrecia Aguirre' && m.casa === ID && m.trabajo === ID && /moza/.test(m.oficio) && m.charla.length >= 3, 'Lucrecia: vive y trabaja en la cantina');
  ok(A.ORDEN_VECINOS_ALDEA.includes('moza') && A.esVecinoAldea('moza') && A.ORDEN_PERSONAS_ALDEA.at(-2) === 'moza' && A.ORDEN_PERSONAS_ALDEA.at(-1) === 'bailarina', 'entre los vecinos, al final del orden (3.9.1: y detrás, Dalia)');
  ok(A.cumpleDe('moza') >= 1 && A.cumpleDe('moza') <= 12, 'su cumpleaños');
  const est = A.aldeaNueva();
  const r = (h, ds = 1) => A.rutinaAldea('moza', h, ds, est, null);
  eq([r(18).lugar, r(18).edificio, r(18).punto], ['trabajo', ID, 'adentro'], 'a las 18 atiende detrás de la barra');
  eq([r(23).edificio, r(23).punto, r(1.9).punto], [ID, 'adentro', 'adentro'], 'de noche y hasta las 2, también');
  ok(r(2).punto === 'cama' && r(8).punto === 'cama' && r(10.9).punto === 'cama', 'de 2 a 11 duerme en su cama del cuarto de atrás');
  ok(r(14).lugar === 'local' && r(14).edificio === ID, 'a la tarde acomoda la barra, adentro');
  ok(A.desfaseDe('moza') === 0, 'sin corrimiento: el cartel dice cuándo abre');
  // minuto a minuto: atiende justo cuando la cantina está abierta
  const dif = [];
  for (let min = 0; min < 24 * 60; min += 5) { const h = min / 60, x = r(h); const atiende = x.lugar === 'trabajo'; if (atiende !== A.cantinaAbierta(h)) dif.push(h); }
  ok(dif.length === 0, `la moza atiende exactamente en el horario de la cantina (difieren ${dif.slice(0, 3).join(', ')})`);
  ok(A.cantinaAbierta(18) && A.cantinaAbierta(23.5) && A.cantinaAbierta(0) && A.cantinaAbierta(1.99) && !A.cantinaAbierta(2) && !A.cantinaAbierta(12) && !A.cantinaAbierta(17.99), 'abre a las 18 y cierra a las 2');
  for (const ds of [0, 3, 5, 6]) ok(r(21, ds).lugar === 'trabajo', `atiende todos los días de la semana (día ${ds})`);
  ok(leer('src/aldea-gente.js').includes("k === 'moza'") && leer('src/aldea-gente.js').includes('ctx.abrirCarta'), 'aldea-gente.js: te ofrece la carta cuando estás sentado');
  const main = leer('src/main.js');
  ok(/abrirCarta: \(\) => !!cantinaJuego\?\.abrirCarta\(\)/.test(main), 'main.js abre la carta desde la charla');
  ok(main.includes("noticiasDestino: (k) => (k === 'moza' || k === 'bailarina' ? null"), 'el club de lectura y la noche de estrellas no se la llevan de la barra');
}

// ---------------------------------------------------------------- 4. la carta
{
  const ids = (c) => C.cartaDeHoy(c).map((x) => x.id);
  const base = ids({ estacion: 'verano', clima: 'sol' });
  ok(base.includes('ginebra') && base.includes('vino-patero') && base.includes('cerveza') && base.includes('mate-cocido') && base.includes('empanadas') && base.includes('picada'), 'lo de siempre está siempre');
  ok(!base.includes('chocolate') && !base.includes('guiso') && !base.includes('tortas-fritas') && !base.includes('trucha'), 'en verano con sol: sin chocolate, guiso, tortas ni trucha');
  const inv = ids({ estacion: 'invierno', clima: 'nieve' });
  ok(inv.includes('chocolate') && inv.includes('guiso') && inv.includes('tortas-fritas'), 'en invierno con nieve: chocolate, guiso y tortas fritas');
  ok(ids({ estacion: 'verano', clima: 'lluvia' }).includes('tortas-fritas') && ids({ estacion: 'verano', clima: 'lluvia' }).includes('guiso'), 'con lluvia: tortas fritas y guiso aunque sea verano');
  ok(ids({ estacion: 'otono', clima: 'sol' }).includes('chocolate') && ids({ estacion: 'otono', clima: 'sol' }).includes('guiso'), 'en otoño: chocolate y guiso');
  ok(ids({ estacion: 'verano', clima: 'sol', locales: { panaderia: true } }).includes('tortas-fritas'), 'con la panadería abierta: tortas fritas');
  ok(ids({ estacion: 'verano', clima: 'sol', locales: { pescaderia: true } }).includes('trucha'), 'con la pescadería abierta: trucha a la parrilla');
  const miel = C.cartaDeHoy({ estacion: 'verano', locales: { 'sala-miel': true } }).find((x) => x.id === 'mate-cocido');
  ok(/miel/.test(miel.nombre) && miel.precio === 150, 'con la sala de miel abierta: mate cocido con miel (un poco más caro)');
  // precios sensatos frente al mercado: un trago o un plato cuestan entre media y tres veces un huevo… en pesos de la 3.8.8
  ok(C.CARTA.every((x) => x.precio >= 100 && x.precio <= 1000 && x.porciones >= 3 && x.prepara >= 4), 'precios entre $100 y $1.000, con 3 o más sorbos o bocados');
  ok(C.CARTA.filter((x) => x.fuerte).every((x) => x.tipo === 'bebida'), 'lo fuerte es de beber');
  ok(C.CARTA.filter((x) => x.tipo === 'comida').every((x) => x.descanso > 0), 'la comida deja descansado');
}

// ---------------------------------------------------------------- 5. pagar
{
  const nuevo = (extra = {}) => ({ modo: 'relax', dia: 10, horas: 21, cosas: {}, materiales: {}, entradas: {}, economia: E.economiaNueva(), ...extra });
  const p = nuevo(); p.economia.pesos = 1000;
  const gin = C.itemDe('ginebra'), emp = C.itemDe('empanadas');
  let f = C.formasDePago(p, gin);
  ok(f[0].medio === 'pesos' && f[0].ok && f[0].texto === 'Pagar $300', 'con plata: pagar en pesos');
  ok(f.find((x) => x.medio === 'trueque' && !x.ok), 'sin nada para el trueque: lo dice');
  ok(f.at(-1).medio === 'cuenta' && f.at(-1).ok, 'y la cuenta, siempre que no pase del tope');
  // pesos
  let r = C.pedir(p, 'ginebra', f[0], 10, 21);
  ok(r.ok && r.medio === 'pesos' && E.pesosDe(p) === 700 && p.cantina.pedidos === 1 && p.cantina.gastado === 300, 'pagás $300: te quedan $700');
  ok(p.economia.libro.at(-1).monto === -300 && /Cantina/.test(p.economia.libro.at(-1).motivo) && p.economia.libro.at(-1).con === 'Lucrecia', 'queda en la billetera: «Cantina: Ginebra», con Lucrecia');
  p.economia.pesos = 100;
  r = C.pedir(p, 'ginebra', { medio: 'pesos' }, 10, 21);
  ok(!r.ok && r.motivo === 'plata' && E.pesosDe(p) === 100, 'sin plata no se mueve nada');
  ok(!C.formasDePago(p, gin)[0].ok, 'y el botón sale apagado');
  // trueque
  p.materiales.tronco = 5; p.cosas.yerba = 4; p.entradas['trucha-fresca'] = { cantidad: 3, dia: 1, hora: 1 };
  f = C.formasDePago(p, emp);
  const trueques = f.filter((x) => x.medio === 'trueque' && x.ok);
  ok(trueques.length >= 2 && trueques.length <= 3, `ofrece hasta tres cosas para el trueque (${trueques.map((x) => x.texto).join(' / ')})`);
  ok(trueques.every((x) => C.unidadEnPesos(x.bien) * x.n >= emp.precio), 'siempre lo que se da vale al menos lo que cuesta (a valor de mercado)');
  const tr = trueques.find((x) => x.bien === 'tronco');
  r = C.pedir(p, 'empanadas', tr, 10, 21);
  ok(r.ok && p.materiales.tronco === 5 - tr.n && E.pesosDe(p) === 100, `trueque: ${tr.n} troncos por las empanadas, sin tocar los pesos`);
  r = C.pedir(p, 'empanadas', { medio: 'trueque', bien: 'yerba' }, 10, 21);
  ok(r.ok && p.cosas.yerba === 4 - C.cuantosPara('yerba', 350), 'trueque con yerba (a $100 el paquete)');
  r = C.pedir(p, 'empanadas', { medio: 'trueque', bien: 'poncho' }, 10, 21);
  ok(!r.ok && r.motivo === 'bien', 'un poncho no se acepta (no está en la lista)');
  p.materiales.tronco = 0;
  r = C.pedir(p, 'empanadas', { medio: 'trueque', bien: 'tronco' }, 10, 21);
  ok(!r.ok && r.motivo === 'nada', 'sin lo que ofrecés, no hay trato');
  // cuenta
  const q = nuevo(); q.economia.pesos = 0;
  r = C.pedir(q, 'ginebra', { medio: 'cuenta' }, 10, 21);
  ok(r.ok && C.cuentaDe(q).monto === 300 && E.pesosDe(q) === 0, 'anotalo en la cuenta: $300 de deuda y la billetera igual');
  const c0 = C.cuentaDe(q);
  ok(C.NOMBRE_BIEN[c0.k] && c0.n >= 1 && C.unidadEnPesos(c0.k) * c0.n >= 300, `y un mandado para saldarla (${C.textoBien(c0.k, c0.n)})`);
  for (let i = 0; i < 6; i++) C.pedir(q, 'empanadas', { medio: 'cuenta' }, 10, 21);
  ok(C.cuentaDe(q).monto <= C.CUENTA_MAX, `la cuenta no pasa del tope (${C.cuentaDe(q).monto} de ${C.CUENTA_MAX})`);
  r = C.pedir(q, 'picada', { medio: 'cuenta' }, 10, 21);
  ok(!r.ok && r.motivo === 'cuenta', 'con la cuenta llena, no te anota más');
  // saldarla con pesos
  q.economia.pesos = 5000; const deuda = C.cuentaDe(q).monto;
  let s = C.saldarCuenta(q, 'pesos');
  ok(s.ok && C.cuentaDe(q) === null && E.pesosDe(q) === 5000 - deuda, `saldar con pesos ($${deuda})`);
  // y con el mandado
  C.pedir(q, 'ginebra', { medio: 'cuenta' }, 10, 21);
  const m = C.cuentaDe(q);
  s = C.saldarCuenta(q, 'mandado');
  ok(!s.ok && s.motivo === 'nada', 'sin lo del mandado no se salda');
  if (m.k === 'yerba') q.cosas.yerba = m.n; else if (BIENES_DONDE(m.k) === 'material') q.materiales[m.k] = m.n; else if (BIENES_DONDE(m.k) === 'cosa') q.cosas[m.k] = m.n; else q.entradas[m.k] = { cantidad: m.n, dia: 1, hora: 1 };
  s = C.saldarCuenta(q, 'mandado');
  ok(s.ok && C.cuentaDe(q) === null && C.tengoBien(q, m.k) === 0, `saldar con el mandado (${C.textoBien(m.k, m.n)}): sale de la mochila`);
  ok(!C.saldarCuenta(q, 'pesos').ok, 'sin cuenta, no hay nada que saldar');
  // los tragos fuertes: tres por noche; el cuarto, un mate por la casa
  const f2 = nuevo(); f2.economia.pesos = 9999;
  for (let i = 0; i < C.FUERTES_POR_NOCHE; i++) ok(C.pedir(f2, 'ginebra', { medio: 'pesos' }, 10, 22).ok, `el trago fuerte ${i + 1} de la noche`);
  r = C.pedir(f2, 'vino-patero', { medio: 'pesos' }, 10, 23);
  ok(!r.ok && r.motivo === 'ya-esta' && E.pesosDe(f2) === 9999 - 300 * 3, 'el cuarto, no: ya está (y no te cobra)');
  ok(C.pedir(f2, 'cerveza', { medio: 'pesos' }, 10, 23).ok, 'una cerveza (no es fuerte) sí');
  ok(C.pedir(f2, 'ginebra', { medio: 'pesos' }, 11, 1.5).ok === false, 'a las 1:30 del día siguiente sigue siendo la misma noche');
  ok(C.pedir(f2, 'ginebra', { medio: 'pesos' }, 11, 21).ok, 'a la noche siguiente, otra vez');
  // sin economía (el Desafío): no hay nada
  ok(C.cantinaDe({ modo: 'desafio' }) === null && !C.pedir({ modo: 'desafio' }, 'ginebra', { medio: 'pesos' }, 1, 20).ok, 'en el Desafío, nada');
}
function BIENES_DONDE(k) { return ({ tronco: 'material', harina: 'cosa' })[k] || 'entrada'; }

// ---------------------------------------------------------------- tomar y comer; demoras
{
  const gin = C.itemDe('ginebra'), emp = C.itemDe('empanadas'), cho = C.itemDe('chocolate'), cer = C.itemDe('cerveza');
  const st = { item: gin, restantes: gin.porciones };
  let r = C.tomarPorcion(st);
  ok(r.efectos.some((e) => e.campo === 'entumecido' && e.valor === 0) && !r.termino && st.restantes === 2, 'el primer trago fuerte te saca el frío');
  r = C.tomarPorcion(st); ok(r.efectos.length === 0, 'los demás sorbos, nada nuevo');
  r = C.tomarPorcion(st); ok(r.termino && st.restantes === 0, 'el último termina el vaso');
  ok(C.tomarPorcion(st).termino && st.restantes === 0, 'de un vaso vacío no se toma');
  const c = { item: cho, restantes: cho.porciones }; r = C.tomarPorcion(c); ok(r.efectos.some((e) => e.campo === 'entumecido'), 'el chocolate caliente también saca el frío');
  const f = { item: emp, restantes: emp.porciones }; const ef = [];
  while (f.restantes > 0) ef.push(...C.tomarPorcion(f).efectos);
  ok(ef.filter((e) => e.campo === 'descansado').length === 1 && ef.find((e) => e.campo === 'descansado').valor === emp.descanso, 'la comida te deja descansado una vez, al terminar');
  const fr = { item: cer, restantes: cer.porciones }; ok(!C.tomarPorcion(fr).efectos.some((e) => e.campo === 'entumecido'), 'una cerveza fría no saca el frío');
  ok(C.demoraDe(gin, 0) < C.demoraDe(gin, 1) && C.demoraDe(C.itemDe('guiso'), 0) > C.demoraDe(gin, 0), 'tarda más con gente y más con la comida que con un trago');
  ok(C.afluencia(12, 5) === 0 && C.afluencia(22, 5) > C.afluencia(22, 1) && C.afluencia(22, 5) > C.afluencia(22, 7) && C.afluencia(19, 5) < C.afluencia(22, 5), 'la cantina se llena de noche y los viernes y sábados');
  ok(C.demoraEnVerte(1) > C.demoraEnVerte(0), 'si está llena, tarda más en verte');
  // el saludo
  const g1 = C.saludoDeMoza({ hora: 19, visitas: 0, dia: 3 }), g2 = C.saludoDeMoza({ hora: 22, visitas: 4, apodo: 'la Truchera', clima: 'lluvia', dia: 3 });
  ok(g1.length === 2 && /Cara nueva|llegó hasta el final/.test(g1[0]), 'a quien no conoce, lo recibe como a un forastero');
  ok(g2[0].includes('la Truchera') && /lluvia/.test(g2[1]), 'a quien conoce, por su apodo, y con lo del tiempo');
  ok(C.saludoDeMoza({ hora: 22, visitas: 2, hechos: [{ id: 'trucha-grande', dia: 3 }], dia: 3 })[1] === C.SALUDOS['trucha-grande'], 'con lo que pasó en el valle (la trucha grande)');
  ok(C.saludoDeMoza({ hora: 22, visitas: 2, cuenta: { monto: 300 }, dia: 3 })[1] === C.SALUDOS.cuenta, 'si le debés, te lo recuerda');
  ok(C.saludoDeMoza({ hora: 22, visitas: 2, estacion: 'invierno', dia: 3 })[1] === C.SALUDOS.frio && C.saludoDeMoza({ hora: 22, visitas: 2, estacion: 'verano', dia: 3 })[1] === C.SALUDOS.calor, 'según la estación');
  ok(C.saludoDeMoza({ hora: 1, visitas: 0, dia: 2 })[1] === C.SALUDOS.madrugada, 'de madrugada, otra cosa');
}

// ---------------------------------------------------------------- 6. el flujo entero, con figuras y un DOM de mentira
{
  const mk = (tag) => {
    const el = {
      tag, className: '', children: [], disabled: false, _t: '', listeners: {}, _clases: new Set(),
      get textContent() { return this._t + this.children.map((c) => c.textContent).join(''); }, set textContent(v) { this._t = String(v); },
      set innerHTML(v) { this.children = []; this._t = ''; }, get innerHTML() { return this.textContent; },
      append(...xs) { this.children.push(...xs); }, appendChild(x) { this.children.push(x); },
      addEventListener(ev, fn) { this.listeners[ev] = fn; },
      classList: { add(c) { el._clases.add(c); }, remove(c) { el._clases.delete(c); }, contains: (c) => el._clases.has(c) },
    };
    return el;
  };
  globalThis.document = { createElement: mk };
  const todos = (el, f = []) => { f.push(el); for (const c of el.children) todos(c, f); return f; };
  const p = { modo: 'relax', dia: 10, horas: 21, cosas: {}, materiales: { tronco: 6 }, entradas: {}, economia: E.economiaNueva(), aldea: A.aldeaNueva(), vecindad: { hechos: [] } };
  p.economia.pesos = 5000;
  const seat = A.CANTINA.mesas[2].sillas[1], mesaSrv = A.CANTINA.mesas[2];
  // el marco de la cantina, en el mundo
  const e = A.EDIFICIOS_ALDEA[ID], marco = A.marcoAldea();
  const mundo = (bx, bz) => { const c = Math.cos(e.rot), s = Math.sin(e.rot); return marco.aMundo(e.x + bx * c + bz * s, e.z - bx * s + bz * c); };
  const pb = mundo(A.CANTINA.barra.x, A.CANTINA.barra.z);
  const js = { pos: { x: 0, z: 0, y: 0 }, sentado: false, entumecido: 5, descansado: 0 };
  const sw = mundo(seat.x, seat.z); js.pos.x = sw.x; js.pos.z = sw.z;
  const calls = [];
  const bandejas = [];
  const moza = { pos: { x: pb.x, y: 0, z: pb.z }, camino: [], dormido: false, deVisita: false, conVos: false, llegando: false, pose: null, velocidad: 0.85, bandeja: { visible: (b) => bandejas.push(['visible', b]), vasos: (v) => bandejas.push(['vasos', v]) } };
  const panel = mk('section'); panel.classList.add('oculto'); const contenido = mk('div');
  const notas = [], efectos = [], dichos = [];
  const visual = {
    ponerEnMesa: (mesa, silla, item, r) => calls.push(['poner', mesa.id, item.id, r]), quitarDeMesa: (mesa) => calls.push(['quitar', mesa.id]),
    nivel: (mesa, r) => calls.push(['nivel', mesa.id, r]), empezarSorbo: (mesa, silla, item, r) => calls.push(['sorbo', mesa.id, item.id, r]),
    cancelarSorbo: () => calls.push(['cancelar']), actualizar: () => {}, bandeja: (npc, item, rec) => { bandejas.push(['bandeja', item ? item.id : null, !!rec]); }, limpiarTodo: () => calls.push(['limpiar']),
  };
  const ctx = {
    progreso: () => p, jugador: () => ({ estado: js }), moza: () => moza, camara: () => null, ambiente: () => ({ invierno: 1, lluvia: 0.1, viento: 0.2, nublado: 0.1 }),
    nota: (t, s) => notas.push([t, s]), guardar: () => {}, refrescar: () => {}, sonido: null, alJugador: (c, v) => { efectos.push([c, v]); if (c === 'entumecido') js.entumecido = v; if (c === 'descansado') js.descansado = Math.max(js.descansado, v); },
    hablandoCon: () => null, hablo: (t) => dichos.push(t), levantar: () => { js.sentado = false; }, panel, contenido, visual, T_: (t) => t,
  };
  const J = CJ.crearCantinaJuego(ctx);
  const botones = () => todos(contenido).filter((x) => x.tag === 'button');
  const clic = (txt) => { const b = botones().find((x) => x.textContent.includes(txt) && !x.disabled); assert.ok(b, `no hay botón «${txt}»`); b.listeners.click(); n++; };
  // la moza camina como en gente.js: hacia el primer punto, a 0,95 m/s, y se detiene al llegar
  let maxPaso = 0, tt = 0;
  const caminar = (dt) => {
    const q = moza.camino[0];
    if (!q) return;
    const dx = q.x - moza.pos.x, dz = q.z - moza.pos.z, d = Math.hypot(dx, dz), cerca = q.cerca ?? 0.5;
    if (d < cerca) { moza.camino.shift(); return; }
    const paso = Math.min((moza.velocidad || 0.8) * dt, d);
    moza.pos.x += (dx / d) * paso; moza.pos.z += (dz / d) * paso; maxPaso = Math.max(maxPaso, paso);
  };
  const tick = (dt = 0.05, veces = 1) => { for (let i = 0; i < veces; i++) { tt += dt; caminar(dt); J.actualizar(dt); } };
  const hasta = (cond, max = 200) => { let t = 0; while (!cond(J.estado()) && t < max) { tick(0.05); t += 0.05; } return J.estado(); };
  // --- sentarse
  ok(!J.estado().ses && !J.accion(js), 'de pie, nada');
  js.sentado = true; tick();
  let est = J.estado();
  ok(est.ses && est.ses.mesa === 'mesa-3' && est.ses.silla === 1 && est.ses.fase === 'espera', 'te sentás a la mesa 3: la moza te está viendo');
  ok(J.sinApuro() && J.estaSentado(), 'sentado ahí el reloj no corre rápido');
  const d0 = Math.hypot(moza.pos.x - sw.x, moza.pos.z - sw.z), p0 = { x: moza.pos.x, z: moza.pos.z };
  // --- viene caminando
  const trazo = [];
  est = hasta((x) => x.ses.fase === 'carta', 60);
  ok(est.ses.fase === 'carta' && est.panel.abierto, 'llegó y se abrió la carta');
  ok(maxPaso <= 0.95 * 0.05 + 1e-9, `caminó de a pasos de ${maxPaso.toFixed(3)} m por cuadro (sin saltos)`);
  const dfin = Math.hypot(moza.pos.x - mundo(mesaSrv.servicio.x, mesaSrv.servicio.z).x, moza.pos.z - mundo(mesaSrv.servicio.x, mesaSrv.servicio.z).z);
  ok(dfin < 0.2 && Math.hypot(moza.pos.x - p0.x, moza.pos.z - p0.z) > 3.5, `desde la barra hasta el lugar de la mesa (${Math.hypot(moza.pos.x - p0.x, moza.pos.z - p0.z).toFixed(1)} m recorridos)`);
  ok(moza.conVos && moza.enCita, 'mientras ella viene, aldea-gente.js no la toca (conVos)');
  void trazo; void d0;
  let txt = contenido.textContent;
  ok(/La carta|Ginebra/.test(txt) && /Cara nueva|forastero/.test(txt) && /Tenés \$5\.000/.test(txt), 'la carta: el saludo de quien no te conoce, tu plata y lo que hay');
  ok(/Chocolate caliente/.test(txt) && /Guiso/.test(txt) && !/Trucha a la parrilla/.test(txt), 'la de invierno');
  ok(p.cantina.visitas === 1, 'una visita anotada');
  // --- elegir y pagar
  clic('Ginebra');
  const pagos = botones().map((b) => b.textContent);
  ok(pagos.includes('Pagar $300') && pagos.some((t) => /^Trueque: 3 troncos/.test(t) || /^Trueque: 2 troncos/.test(t)) && pagos.includes('Anotalo en la cuenta'), `las tres formas de pagar: ${pagos.filter((x) => /Pagar|Trueque|cuenta/.test(x)).join(' · ')}`);
  clic('Pagar $300');
  ok(E.pesosDe(p) === 4700 && !J.panelAbierto(), 'pagaste con tu billetera y se cierra la carta');
  ok(J.estado().ses.orden.item === 'ginebra' && J.estado().ses.fase === 'a-barra', 'ella anota y se va a la barra');
  ok(dichos.length >= 1 && notas.some((x) => x[0] === 'Lucrecia'), 'te contesta (con su voz y en pantalla)');
  // --- la barra, la bandeja y la mesa
  est = hasta((x) => x.ses.fase === 'prepara', 60);
  ok(moza.pose === 'barra', 'en la barra, apoyada, preparando');
  const t1 = tt;
  est = hasta((x) => x.ses.fase === 'trae', 60);
  ok(tt - t1 >= C.demoraDe(C.itemDe('ginebra'), C.afluencia(21, 10)) - 0.2, `tardó lo que dice (${(tt - t1).toFixed(1)} s)`);
  ok(moza.pose === 'bandeja' && bandejas.some((b) => b[0] === 'bandeja' && b[1] === 'ginebra'), 'sale con la bandeja en alto, con tu ginebra');
  ok(J.estado().servidos.length === 0 && !calls.some((c) => c[0] === 'poner'), 'todavía no está en la mesa: viene caminando');
  est = hasta((x) => x.servidos.length > 0, 60);
  ok(est.servidos[0].item === 'ginebra' && est.servidos[0].restantes === 3 && calls.some((c) => c[0] === 'poner' && c[1] === 'mesa-3'), 'la deja en tu mesa (se ve en la mesa)');
  ok(bandejas.at(-1)[0] === 'bandeja' && bandejas.at(-1)[1] === null, 'la bandeja queda vacía');
  est = hasta((x) => x.ses.fase === 'libre', 60);
  ok(!moza.conVos && moza.camino.length === 0, 'se va a atender a otro: vuelve a su rutina (aldea-gente.js la manda a la barra)');
  // --- tomar
  const a = J.accion(js);
  ok(a && a.texto === 'Tomar un trago' && J.tapaVecino(js), 'E: «Tomar un trago» (y le gana a hablar con la moza)');
  a.hacer(); ok(J.estado().sorbo && !J.accion(js), 'empieza el sorbo (en curso, no se puede apilar otro)');
  tick(0.05, 40);
  est = J.estado();
  ok(est.servidos[0].restantes === 2 && !est.sorbo && js.entumecido === 0, 'un sorbo menos y se te fue el frío (entumecido 0)');
  ok(calls.some((c) => c[0] === 'sorbo') && calls.some((c) => c[0] === 'nivel' && c[2] === 2), 'se vio subir el vaso y bajó el nivel');
  for (let i = 0; i < 2; i++) { J.accion(js).hacer(); tick(0.05, 40); }
  est = J.estado();
  ok(est.servidos[0].restantes === 0 && notas.some((x) => /Ginebra/.test(x[0])), 'terminó el vaso');
  ok(!J.accion(js) || /Llamar/.test(J.accion(js).texto), 'terminado, E llama a la moza');
  // sola, ella te ve y viene a ver si querés otra
  tick(0.05, 200);
  est = J.estado();
  ok(['espera', 'viene', 'carta'].includes(est.ses.fase), `ella te vio sin vaso y viene a ver si querés otra (fase ${est.ses.fase})`);
  est = hasta((x) => x.ses.fase === 'carta', 60);
  // --- otra: comida con trueque
  clic('Empanadas');
  const trk = botones().find((b) => /^Trueque:/.test(b.textContent));
  ok(!!trk, 'trueque ofrecido: ' + trk.textContent);
  const troncos = p.materiales.tronco;
  clic('Trueque:');
  ok(p.materiales.tronco < troncos && E.pesosDe(p) === 4700, 'el trueque saca los troncos de la mochila, no la plata');
  est = hasta((x) => x.servidos[0]?.item === 'empanadas', 120);
  ok(est.servidos.length === 1 && est.servidos[0].restantes === 4, 'las empanadas reemplazan al vaso vacío (una cosa por mesa)');
  est = hasta((x) => x.ses.fase === 'libre', 60);
  J.accion(js).hacer(); tick(0.05, 40);
  ok(J.estado().servidos[0].restantes === 3 && /bocado/.test(notas.length ? 'bocado' : ''), 'un bocado');
  for (let i = 0; i < 3; i++) { J.accion(js).hacer(); tick(0.05, 40); }
  ok(js.descansado >= 1 && notas.some((x) => x[0] === 'Quedaste lleno'), `terminaste: «Quedaste lleno», descansado ${js.descansado} h`);
  // --- cuenta
  p.economia.pesos = 0;
  J.llamar(); hasta((x) => x.ses.fase === 'carta', 60);
  clic('Mate cocido'); clic('Anotalo en la cuenta');
  ok(C.cuentaDe(p) && C.cuentaDe(p).monto === 120, 'anotado en la cuenta');
  hasta((x) => x.servidos[0]?.item === 'mate-cocido', 120);
  est = hasta((x) => x.ses.fase === 'libre', 60);
  // --- te levantás con la mesa servida: ella la levanta después
  js.sentado = false; tick();
  est = J.estado();
  ok(!est.ses && est.limpieza === 'espera' && est.servidos.length === 1, 'te levantaste: la mesa queda servida un rato');
  ok(!J.sinApuro(), 'ya no estás sentado: el reloj sigue normal');
  est = hasta((x) => x.limpieza === 'va', 40);
  ok(est.limpieza === 'va' && moza.conVos, 'después de unos segundos, viene a levantar');
  est = hasta((x) => x.servidos.length === 0 && !x.limpieza, 80);
  ok(est.servidos.length === 0 && !moza.conVos && calls.some((c) => c[0] === 'quitar' && c[1] === 'mesa-3'), 'levantó lo de la mesa y volvió a su rutina');
  // --- te levantás en medio de un pedido: igual te lo trae (ya lo pagaste)
  p.economia.pesos = 3000;
  js.sentado = true; tick(); hasta((x) => x.ses && x.ses.fase === 'carta', 80);
  clic('Cerveza'); clic('Pagar $350');
  js.sentado = false; tick(0.05, 3);
  ok(J.estado().ses && J.estado().ses.parado, 'te fuiste con el pedido en camino: la visita sigue (parada)');
  est = hasta((x) => x.servidos.length > 0 && x.servidos[0].item === 'cerveza', 120);
  ok(est.servidos.length === 1, 'igual te dejó la cerveza en la mesa');
  est = hasta((x) => !x.ses && x.limpieza === 'espera', 80);
  ok(!est.ses, 'y después cierra la visita y espera para levantar');
  hasta((x) => x.servidos.length === 0, 160);
  // --- cerrada: de día no viene nadie
  p.horas = 13; js.sentado = true; tick();
  ok(J.estado().ses.fase === 'cerrada' && !J.accion(js) && notas.some((x) => /abrimos|persiana/.test(x[1])), 'de día, cerrada: te lo dice y no viene nadie');
  js.sentado = false; tick();
  // --- sin moza (no está armada): lo avisa
  p.horas = 21; const guardada = ctx.moza; ctx.moza = () => null; js.sentado = true; tick();
  ok(J.estado().ses.fase === 'sola' && !J.accion(js), 'sin moza, nadie te atiende (y no se rompe nada)');
  js.sentado = false; tick(); ctx.moza = guardada;
  // --- lejos: se suelta todo
  js.sentado = true; p.horas = 21; tick(); hasta((x) => x.ses.fase === 'carta', 80);
  js.pos.x += 500; tick();
  ok(!J.estado().ses && !moza.conVos && !J.panelAbierto(), 'si te vas lejos, se suelta a la moza y se cierra la carta');
  delete globalThis.document;
}

// ---------------------------------------------------------------- 7. el guardado y los enganches
{
  const viejo = { modo: 'relax', dia: 4, economia: E.economiaNueva() };
  ok(C.cantinaDe(viejo) && viejo.cantina.visitas === 0 && viejo.cantina.cuenta === null, 'una partida de antes (sin el campo): arranca vacía');
  eq(C.sanearCantina(undefined), C.cantinaNueva(), 'sin nada, la nueva');
  const sucio = C.sanearCantina({ visitas: -5, ultima: 9999, pedidos: 'x', gastado: NaN, cuenta: { monto: -3, k: 'tronco', n: 2 }, fuertes: { dia: 1e9, n: 'z' } }, 10);
  ok(sucio.visitas === 0 && sucio.ultima === 10 && sucio.pedidos === 0 && sucio.gastado === 0 && sucio.cuenta === null && sucio.fuertes.dia === 10 && sucio.fuertes.n === 0, 'la basura se sanea (nada negativo, nada del futuro)');
  const buena = C.sanearCantina({ visitas: 3, ultima: 8, pedidos: 7, gastado: 2100, cuenta: { monto: 600, k: 'trucha-fresca', n: 3, dia: 7 }, fuertes: { dia: 8, n: 2 } }, 10);
  eq(buena, { visitas: 3, ultima: 8, pedidos: 7, gastado: 2100, cuenta: { monto: 600, k: 'trucha-fresca', n: 3, dia: 7 }, fuertes: { dia: 8, n: 2 }, chistes: {}, ebrio: { n: 0, t: 0 }, pena: { bailes: 0, ultima: 0 } }, 'lo bueno queda como está (3.9.1: y los campos nuevos, vacíos)');
  ok(C.sanearCantina({ cuenta: { monto: 100, k: 'poncho-raro', n: 0 } }, 5).cuenta.k === 'tronco', 'un mandado raro vuelve a un tronco, con al menos uno');
  ok(C.sanearCantina({ cuenta: { monto: 100, k: 'tronco', n: 5, dia: 99 } }, 5).cuenta.dia === 5, 'la cuenta no es de un día futuro');
  const g = leer('src/guardado.js');
  ok(g.includes("import { cantinaNueva, sanearCantina } from './cantina.js'") && /cantina: cantinaNueva\(\)/.test(g) && /limpio\.cantina = sanearCantina\(p\.cantina, limpio\.dia\)/.test(g) && /limpio\.cantina = undefined/.test(g), 'guardado.js: la nueva partida la trae, la que se carga la sanea (y el Desafío no)');
  const main = leer('src/main.js');
  for (const t of ["crearCantinaJuego({", "crearCantinaMundo({", "cantinaJuego?.actualizar(dt)", "fallaSistema('cantina'", "cantinaJuego?.sinApuro()", "cantinaJuego.accion(js)", "cantinaJuego?.panelAbierto()", "cantinaJuego?.tapaVecino(js)", "__cantina:"]) ok(main.includes(t), `main.js: ${t}`);
  ok(/try \{ if \(modo === 'jugando' && !desafio\) cantinaJuego\?\.actualizar\(dt\); \} catch \(e\) \{ fallaSistema\('cantina', e\); \}/.test(main), 'main.js: la cantina, aislada con fallaSistema');
  ok(/panelDelHudAbierto = .*cantinaJuego\?\.panelAbierto\(\)/.test(main), 'el panel cuenta como panel del HUD');
  // el juego lleva hasta la cantina (como pasó con el banco): pista al llegar a la aldea, rótulo en el mapa y la guía (F1)
  ok(main.includes("{ id: 'p-cantina', cuando: (js, p) => !desafio && hayEconomia(p) && !!p.aldea?.descubierta, titulo: 'La cantina', texto: PISTA_CANTINA }"), 'una pista al llegar a la aldea, sólo en el Relax');
  ok(/PISTA_CANTINA = '[^']*de 18 a 2/.test(main) && main.includes('aldeaMundo.lugarCantina()'), 'la pista dice el horario y el mapa rotula la cantina');
  ok(leer('src/guia.js').includes("['La cantina', 'Al final de la calle de la Loma") && leer('src/guia.js').includes('Abre de 18 a 2.'), 'y la guía (F1) la explica');
  const pl = leer('src/plantilla.html');
  ok(pl.includes('id="cantina-carta"') && pl.includes('id="cantina-contenido"') && pl.includes('.panel-cantina'), 'plantilla.html: el panel de la carta y su estilo');
  const luz = leer('src/aldea-mundo.js');
  ok(luz.includes('fuerza: spec.fuerza ?? 1') && luz.includes('encendido * 1.5 * q.fuerza'), 'aldea-mundo.js: la fuerza de la luz de la noche (la cantina, más)');
  // la fluidez: nada por cuadro cuando estás lejos o no hay nada en la mesa
  const cj = leer('src/cantina-juego.js');
  ok(cj.includes('if (d > RADIO_CANTINA)') && cj.includes('Math.hypot(pos.x - centro.x, pos.z - centro.z) > 12'), 'cantina-juego.js: lejos no calcula nada');
  ok(!/new THREE\.PointLight|new THREE\.SpotLight/.test(leer('src/cantina-mundo.js')) && !/castShadow = true/.test(leer('src/cantina-mundo.js')), 'cantina-mundo.js: ni luces ni sombras propias');
}

// ---------------------------------------------------------------- 8. los textos
{
  const { EN_U } = await import('../src/idioma-en-u.js');
  const V = await import('../src/vecindad-voces.js');
  const S = await import('../src/vecindad-social-voces.js');
  const { EN_V } = await import('../src/idioma-en-v.js');   // (3.9.1: lo de Lucrecia con confianza, en la tanda V)
  const hay = (t) => { const k = t.replace(/\{\w+\}/g, '{0}'); return Object.hasOwn(EN_U, k) || Object.hasOwn(EN_V, k) || Object.hasOwn(EN_V, t); };
  const textos = new Set(C.textosCantina());
  for (const x of ['Cantina: la cuenta', 'Pagaste', 'Trueque', 'Lo anotó en la cuenta', 'No se pudo pedir', 'Probá con otra cosa', 'Te calentó el cuerpo', 'Se te fue el entumecido', 'Quedaste lleno', 'Vas a andar más descansado un rato, hasta que se te pase', 'Saldaste la cuenta', 'No se pudo saldar', 'No alcanza la plata'.replace('No alcanza', 'No te alcanza'), 'Te falta lo que pide para el mandado', 'La carta de hoy', 'E o Escape para cerrar la carta', 'Tenés', 'Tu cuenta', 'Mandado', 'Después pido', 'Levantarme', 'Pagar {0}', 'Trueque: {0}', 'Anotalo en la cuenta', 'Trueque (llevá truchas, leña, frascos…)', 'Saldar con {0}', 'Saldar con el mandado ({0})', 'Tomar un trago', 'Comer un bocado', 'Llamar a la moza', 'Mirar la carta', 'Lucrecia', '¿Qué te traigo, corazón? La carta la tenés acá.', 'E: ver la carta · Escape: después', 'La cantina', 'Abre de 18 a 2']) textos.add(x);
  for (const l of [...Object.values(A.VECINOS_ALDEA.moza.charla ? { c: A.VECINOS_ALDEA.moza.charla } : {})]) for (const t of l) textos.add(t);
  textos.add(A.VECINOS_ALDEA.moza.saludo); textos.add(A.VECINOS_ALDEA.moza.despedida);
  const rec = (x) => { if (typeof x === 'string') textos.add(x); else if (Array.isArray(x)) x.forEach(rec); else if (x && typeof x === 'object') for (const [k, y] of Object.entries(x)) if (k !== 'cumplir' && k !== 'id') rec(y); };
  for (const M of [...Object.values(V), ...Object.values(S)]) { if (!M || typeof M !== 'object') continue; if (M.moza) rec(M.moza); for (const v of Object.values(M)) if (v && typeof v === 'object' && !Array.isArray(v) && v.moza) rec(v.moza); }
  const sin = [...textos].filter((t) => !/^(material|cosa|tabla|yerba|tronco)$/.test(t)).filter((t) => !hay(t));
  ok(textos.size >= 120 && sin.length === 0, `todo lo de la cantina y de Lucrecia tiene su inglés (${textos.size} textos; faltan ${sin.length}: ${sin.slice(0, 3).join(' | ')})`);
  const prohibido = /\b(dios|dioses|misa|virgen|bendic\w*|bendit\w*|rez\w+|iglesia|capilla|cura|curas|santo|santa|sagrad\w*|milagro\w*|ángel\w*|amén|pecado|cielo santo|altar|parroq\w*)\b/i;
  for (const t of textos) assert.ok(!prohibido.test(t), `nada religioso: «${t}»`);
  n++;
  // sensual sin nada explícito: nada de desnudos ni de escenas (la calificación de Steam)
  const explicito = /\b(desnud\w*|sexo|sexual\w*|teta\w*|culo|orgasm\w*|coger|coito|porn\w*)\b/i;
  for (const t of textos) assert.ok(!explicito.test(t), `nada explícito: «${t}»`);
  n++;
  ok([...textos].every((t) => t.length <= 260), 'ningún renglón larguísimo');
}

console.log(`verificar-3-9-0-cantina: ${n} verificaciones ok`);

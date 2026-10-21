// 4.6: los puestos de ruta (src/puestos-ruta.js, puestos-ruta-mundo.js, puestos-ruta-juego.js) y la parada nueva de la trochita, en Node:
//   · los cuatro puestos en sus coordenadas fijas (no dependen de la calidad), con sus puntos (puerta, ventanilla, fogón, depósito, catre);
//   · la reparación: tres etapas de $3.000 y 10 tablas y 10 piedras en total, con la maquinaria de pesos de la 4.2; lo que falta;
//   · la caja de $5.000 que se repone $700 por día, los precios propios (perfiles de comercio.js) y los bienes de zona protegidos;
//   · el depósito (las reglas de la barraca: 40 de cada material), el descanso (como una casa con confort) y el panel sin fletes;
//   · el guardado: lo nuevo saneado (buscado con Object.hasOwn), una partida de antes con los cuatro abandonados, el Desafío sin nada;
//   · el valle de verdad: no pisan estructuras, vía ni agua, el apeadero del Riel Sur entra a la trochita, la geometría es de tipo 0 o 4
//     y cada etapa se ve distinta;
//   · la tecla E y el aviso con la misma función, en el mismo lugar de main.js; módulos puros; sin luces nuevas.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registrarThree } from './ayuda-three.mjs';
import { cargarValle } from './ayuda-4-0-3-valle.mjs';

registrarThree();
const R = await import('../src/puestos-ruta.js');
const C = await import('../src/comercio.js');
const M = await import('../src/mercado.js');
const E = await import('../src/economia.js');
const OP = await import('../src/obra-pesos.js');
const AL = await import('../src/almacen.js');
const AB = await import('../src/abrigo.js');
const { crearPuestosRutaJuego } = await import('../src/puestos-ruta-juego.js');
const { crearPuestoDeCargas } = await import('../src/comercio-mundo.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const IDS = ['A', 'B', 'C', 'D'];
const partida = (x = {}) => ({ modo: 'relax', dia: 5, horas: 12, economia: { ...E.economiaNueva(), pesos: 20000 }, comercio: C.comercioNuevo(), materiales: { tabla: 12, piedra: 12 }, entradas: {}, cosas: {}, ...x });

// ---------------------------------------------------------------- 1. los cuatro puestos, en coordenadas fijas
{
  eq(R.IDS_PUESTOS, IDS, 'cuatro puestos: A, B, C y D');
  eq(IDS.map((id) => R.PUESTOS_RUTA[id].nombre), ['Puesto de la Cantera', 'Puesto del Paso', 'Puesto de la Estepa', 'Puesto del Riel Sur'], 'con sus nombres');
  const P = (id) => R.PUESTOS_RUTA[id].pos;
  ok(Math.hypot(P('A').x + 320, P('A').z + 288) < 4.5, `A, junto a (−320, −288), corrido de la vía (${P('A').x}, ${P('A').z})`);
  ok(P('B').x - -351.8 > 7 && P('B').x - -351.8 < 10 && Math.abs(P('B').z + 20) < 2, `B, unos 8 m al este de la vía en (−350, −20) (${P('B').x}, ${P('B').z})`);
  eq(P('C'), { x: 320, z: 80 }, 'C, en (320, 80)');
  ok(Math.hypot(P('D').x - 288, P('D').z + 224) < 10.5, `D, detrás de su andén, junto a (288, −224) (${P('D').x}, ${P('D').z})`);
  ok(IDS.filter((id) => R.PUESTOS_RUTA[id].parada).join() === 'D', 'sólo el del Riel Sur es parada de la trochita');
  const t = leer('src/puestos-ruta.js');
  ok(!/calidad|CALIDADES|densidad/.test(t.replace(/^\s*\/\/.*$/gm, '')), 'las coordenadas no dependen de la calidad gráfica');
  // del marco local al mundo y vuelta
  for (const id of IDS) {
    for (const [lx, lz] of [[0, 0], [1.3, -2], [-4, 3.5]]) { const w = R.aMundo(id, lx, lz), l = R.aLocal(id, w.x, w.z); ok(Math.abs(l.x - lx) < 1e-9 && Math.abs(l.z - lz) < 1e-9, `${id}: aMundo y aLocal son inversas`); }
    for (const k of R.PUNTOS) { const q = R.puntoDe(id, k); ok(Number.isFinite(q.x) && Number.isFinite(q.z), `${id}: el punto ${k}`); }
    const f = R.puntoDe(id, 'puerta'), c = R.PUESTOS_RUTA[id].pos;
    const frente = { x: Math.sin(R.PUESTOS_RUTA[id].rot), z: Math.cos(R.PUESTOS_RUTA[id].rot) };
    ok(((f.x - c.x) * frente.x + (f.z - c.z) * frente.z) > 2, `${id}: la puerta está al frente`);
    ok(R.adentro(id, c.x, c.z) && !R.adentro(id, f.x, f.z), `${id}: adentro de la casilla, sí; en la puerta, no`);
    ok(R.puestoCerca(c, 8)?.id === id && R.puestoCerca({ x: c.x + 50, z: c.z }, 8) === null, `${id}: puestoCerca`);
  }
  ok(R.puntoDe('E', 'puerta') === null && R.puntoDe('A', 'toString') === null && R.puntoDe('__proto__', 'puerta') === null, 'lo que no existe da null (buscado con Object.hasOwn)');
  ok(Math.hypot(R.puntoDe('B', 'puerta').x - R.PUESTOS_RUTA.B.pos.x, R.puntoDe('B', 'puerta').z - R.PUESTOS_RUTA.B.pos.z) < 3, 'el punto de anclaje del puesto B (para el arriero): PUESTOS_RUTA.B.pos y puntoDe(\'B\', …)');
}

// ---------------------------------------------------------------- 2. la reparación
{
  eq(R.ETAPAS_PUESTO.length, 3, 'tres etapas');
  ok(R.ETAPAS_PUESTO.every((e) => e.pesos === 3000), 'de $3.000 cada una');
  const suma = (k) => R.ETAPAS_PUESTO.reduce((s, e) => s + (e.pide[k] || 0), 0);
  ok(suma('tabla') === 10 && suma('piedra') === 10 && R.ETAPAS_PUESTO.every((e) => Object.keys(e.pide).every((k) => k === 'tabla' || k === 'piedra')), '10 tablas y 10 piedras en total, repartidas');
  for (const id of IDS) {
    ok(OP.tienePrecio(R.idPrecioPuesto(id)) && OP.precioTotal(R.idPrecioPuesto(id)) === 9000 && [0, 1, 2].every((i) => OP.precioDeEtapa(R.idPrecioPuesto(id), i) === 3000), `${id}: anotado en la maquinaria de pesos de la 4.2 (obra-pesos.js)`);
  }
  const p = partida();
  ok(R.etapaDe(p, 'A') === 0 && !R.reparado(p, 'A') && p.puestosRuta && Object.keys(p.puestosRuta).length === 4, 'una partida sin puestos los crea abandonados');
  eq(R.textoReparar(p, 'A'), 'Reparar el puesto de la cantera (1 de 3: paredes y puerta) · $3.000, 5 tablas y 2 piedras', 'el aviso dice qué etapa y cuánto cuesta');
  // lo que falta
  const sin = partida({ materiales: { tabla: 1 }, economia: { ...E.economiaNueva(), pesos: 1000 } });
  const f = R.faltaPara(sin, 'C', sin.materiales);
  ok(!f.ok && f.materiales.join() === '4 tablas,2 piedras' && f.pago.falta === 2000, `lo que falta (${JSON.stringify(f)})`);
  eq(R.textoFalta(f), 'Faltan 4 tablas, 2 piedras y $2.000', 'en palabras');
  const r0 = R.repararEtapa(sin, 'C', sin.materiales);
  ok(!r0.ok && r0.motivo === 'materiales' && R.etapaDe(sin, 'C') === 0 && sin.economia.pesos === 1000 && sin.materiales.tabla === 1, 'sin materiales no se repara ni se cobra');
  const sinPlata = partida({ economia: { ...E.economiaNueva(), pesos: 2999 } });
  const r1 = R.repararEtapa(sinPlata, 'C', sinPlata.materiales);
  ok(!r1.ok && r1.motivo === 'plata' && sinPlata.materiales.tabla === 12 && sinPlata.economia.pesos === 2999, 'con un peso de menos tampoco');
  // las tres etapas
  for (let i = 1; i <= 3; i++) {
    const antes = { pesos: p.economia.pesos, tabla: p.materiales.tabla, piedra: p.materiales.piedra };
    const r = R.repararEtapa(p, 'A', p.materiales);
    const e = R.ETAPAS_PUESTO[i - 1];
    ok(r.ok && r.etapa === i && antes.pesos - p.economia.pesos === 3000 && antes.tabla - p.materiales.tabla === e.pide.tabla && antes.piedra - p.materiales.piedra === e.pide.piedra, `etapa ${i}: cobra $3.000, ${e.pide.tabla} tablas y ${e.pide.piedra} piedras`);
  }
  ok(R.reparado(p, 'A') && p.puestosRuta.A.desde === 5 && p.economia.pesos === 11000 && p.materiales.tabla === 2 && p.materiales.piedra === 2, 'reparado: $9.000, 10 tablas y 10 piedras en total');
  ok(E.ultimosMovimientos(p, 1)[0].motivo === 'Reparación: puesto de la cantera' && E.ultimosMovimientos(p, 1)[0].monto === -3000, 'el libro de la billetera dice qué se pagó');
  ok(R.repararEtapa(p, 'A', p.materiales).motivo === 'reparado' && R.textoReparar(p, 'A') === '' && R.proximaEtapa(p, 'A') === null, 'reparado no se repara de nuevo');
  ok(R.etapaDe(p, 'B') === 0, 'los otros siguen abandonados');
  eq([0, 1, 2, 3].map((e) => { const q = partida(); q.puestosRuta = R.puestosRutaNuevos(); q.puestosRuta.D.etapa = e; return R.textoEstado(q, 'D'); }),
    ['Puesto del Riel Sur: abandonado', 'Puesto del Riel Sur: reparándose (1 de 3)', 'Puesto del Riel Sur: reparándose (2 de 3)', 'Puesto del Riel Sur: reparado'], 'cómo está, en una línea');
}

// ---------------------------------------------------------------- 3. la caja, los precios propios y los bienes de zona
{
  for (const id of IDS) {
    const nombre = R.PUESTOS_RUTA[id].nombre;
    ok(M.cajaMaxima(nombre) === 5000, `${id}: la caja del puesto es de $5.000`);
    ok(C.perfilDe(nombre).quien === R.PUESTOS_RUTA[id].quien, `${id}: lo atiende ${R.PUESTOS_RUTA[id].quien.toLowerCase()}`);
    const b = C.bienesDe(nombre);
    ok(b.length >= 6 && b.length <= 9 && b.every(C.esBien), `${id}: compra y vende ${b.length} bienes, todos del mercado (${b.join(', ')})`);
    for (const bien of b) { const pr = C.precios(C.comercioNuevo(), nombre, bien, 7, 'otono'); ok(Number.isFinite(pr.compra) && pr.compra > pr.venta && pr.venta >= 1, `${id}: precio de ${bien}`); }
  }
  // los perfiles que el Relax no usaba, reusados: el capataz de la cantera (A) y el baqueano (B)
  ok(C.perfilDe('Puesto de la Cantera').produce.slice(0, 2).join() === C.perfilDe('Parada Alta').produce.join() && C.perfilDe('Puesto de la Cantera').pide.join() === C.perfilDe('Parada Alta').pide.join(), 'A: el perfil de la «Parada Alta» (el capataz de la cantera)');
  ok(C.perfilDe('Puesto del Paso').produce.join() === C.perfilDe('Parada del Mirador').produce.join(), 'B: el de la «Parada del Mirador» (el baqueano)');
  ok(C.perfilDe('Parada Alta').caja === undefined && M.cajaMaxima('Parada Alta') === 4000 + (C.hashTexto('Parada Alta|caja') % 41) * 100, 'las paradas de siempre siguen con su caja de antes');
  ok(C.perfilDe('Puesto de la Estepa').produce.includes('lana') && C.perfilDe('Puesto del Riel Sur').produce.includes('poncho'), 'C y D: perfiles nuevos de la estepa (lana, ponchos)');
  // los bienes de zona (los suma otro paquete): antes de que existan no se ofrecen; después, sí, sin tocar nada acá
  const zona = ['cuero', 'hierbas', 'junco', 'piedra-cantera'];
  const faltaban = zona.filter((k) => !C.esBien(k));
  for (const k of faltaban) ok(!IDS.some((id) => C.bienesDe(R.PUESTOS_RUTA[id].nombre).includes(k)), `sin «${k}» en BIENES, ningún puesto lo ofrece`);
  for (const k of faltaban) C.BIENES[k] = { nombre: k, donde: 'material', lote: 2, valor: 5 };
  ok(C.bienesDe('Puesto de la Estepa').includes('cuero') && C.bienesDe('Puesto de la Cantera').includes('piedra-cantera'), 'con los bienes de zona sumados, la estepa vende cuero y la cantera piedra de cantera');
  ok(IDS.every((id) => C.bienesDe(R.PUESTOS_RUTA[id].nombre).length <= 9), 'y ninguno pasa de nueve cosas');
  for (const k of faltaban) delete C.BIENES[k];
  // la caja: arranca llena al terminar la reparación y se repone $700 por día, con tope
  const p = partida({ dia: 10 });
  for (let i = 0; i < 3; i++) R.repararEtapa(p, 'C', p.materiales);
  const t = p.comercio.mercado['Puesto de la Estepa'];
  ok(t && t.caja === 5000, 'el puesto reparado abre con $5.000 en la caja');
  M.registrarVenta(t, 'lana', 4200);
  ok(t.caja === 800, 'le vendés: paga de su caja');
  M.tienda(p.comercio, 'Puesto de la Estepa', 11);
  ok(t.caja === 1500, 'al otro día, $700 más');
  M.tienda(p.comercio, 'Puesto de la Estepa', 30);
  ok(t.caja === 5000, 'y no pasa de $5.000');
  ok(M.MERCADO.cajaDia === 700, 'se repone $700 por día (mercado.js)');
}

// ---------------------------------------------------------------- 4. el depósito y el descanso
{
  const p = partida({ materiales: { tabla: 20, piedra: 20, tronco: 55, lana: 3 } });
  const nada = R.guardarEnPuesto(p, 'B', p.materiales);
  ok(!Object.keys(nada.guardado).length && p.materiales.tronco === 55, 'abandonado, el depósito no guarda nada');
  for (let i = 0; i < 3; i++) R.repararEtapa(p, 'B', p.materiales);
  ok(R.DEPOSITO === 'barraca' && R.GUARDA.join() === AL.ALMACENES.barraca.guarda.join(), 'el depósito usa las reglas de la barraca de almacen.js');
  const r = R.guardarEnPuesto(p, 'B', p.materiales);
  ok(r.guardado.tronco === 40 && p.materiales.tronco === 15 && r.sobra.join() === 'tronco' && r.guardado.lana === 3 && p.materiales.lana === 0, `guarda hasta 40 de cada uno (${JSON.stringify(r)})`);
  eq(R.resumenDeposito(p, 'B'), 'Troncos 40/40 · Tablas 10/40 · Piedra 10/40 · Lana 3/40', 'el resumen del depósito');
  const s = R.sacarDePuesto(p, 'B', p.materiales);
  ok(s.tronco === 40 && s.lana === 3 && p.materiales.tronco === 55 && !R.hayEnDeposito(p, 'B'), 'sin nada a mano, saca todo');
  // el catre del puesto: una casa con lo justo (cerrada, con calor y confort 6): amanecés descansado
  ok(AB.casaCerrada(R.CASA_PUESTO) && AB.comoDormiste({ invierno: 1, casa: R.CASA_PUESTO }) === 'calentito' && AB.horasDescansado({ como: 'normal', casa: R.CASA_PUESTO }) === AB.ABRIGO.horasDescanso, 'dormir en el puesto: bajo techo, tibio y descansado');
}

// ---------------------------------------------------------------- 5. el guardado
{
  const nuevos = R.puestosRutaNuevos();
  ok(IDS.every((id) => nuevos[id].etapa === 0 && nuevos[id].desde === 0 && AL.totalGuardado('barraca', nuevos[id].deposito) === 0), 'una partida nueva: los cuatro abandonados y vacíos');
  eq(R.sanearPuestosRuta(undefined), nuevos, 'una partida de antes (sin puestosRuta): los cuatro abandonados');
  eq(R.sanearPuestosRuta([1, 2]), nuevos, 'un arreglo: igual');
  const roto = R.sanearPuestosRuta(JSON.parse('{"A":{"etapa":7,"deposito":{"n":9,"g":{"tronco":"12","hacha":1,"oro":5}},"desde":-3},"B":{"etapa":-1},"C":"x","D":{"etapa":"2"},"E":{"etapa":3},"__proto__":{"etapa":3}}'));
  ok(roto.A.etapa === 3 && roto.B.etapa === 0 && roto.C.etapa === 0 && roto.D.etapa === 2 && roto.A.desde === 0, `etapas acotadas de 0 a 3 (${JSON.stringify(roto)})`);
  eq(roto.A.deposito, { n: 0, g: { tronco: 12 } }, 'el depósito, con las reglas de la barraca (sin cosas ajenas)');
  ok(!Object.hasOwn(roto, 'E') && Object.keys(roto).join() === 'A,B,C,D' && Object.getPrototypeOf(roto) === Object.prototype, 'lo que no es un puesto se descarta');
  ok(leer('src/puestos-ruta.js').includes('if (!Object.hasOwn(v, id) || !objeto(v[id])) continue;'), 'se busca por nombre con Object.hasOwn');
  // ida y vuelta por la partida guardada
  const almacen = new Map();
  globalThis.localStorage = { getItem: (k) => (almacen.has(k) ? almacen.get(k) : null), setItem: (k, v) => almacen.set(k, String(v)), removeItem: (k) => almacen.delete(k), key: () => null, length: 0 };
  const G = await import('../src/guardado.js');
  G.usarModoGuardado('relax', 1);
  const base = G.progresoNuevo();
  ok(base.puestosRuta && IDS.every((id) => base.puestosRuta[id].etapa === 0), 'progresoNuevo trae los cuatro puestos abandonados');
  const q = JSON.parse(JSON.stringify(base));
  q.economia.pesos = 20000; q.materiales = { tabla: 20, piedra: 20, tronco: 9 }; q.dia = 4;
  for (let i = 0; i < 3; i++) R.repararEtapa(q, 'D', q.materiales);
  R.repararEtapa(q, 'A', q.materiales);
  R.guardarEnPuesto(q, 'D', q.materiales);
  G.escribirPartida('relax', 1, q);
  const l = G.leerPartida('relax', 1), pl = l?.progreso || l;
  ok(pl.puestosRuta.D.etapa === 3 && pl.puestosRuta.A.etapa === 1 && pl.puestosRuta.D.deposito.g.tronco === 9 && pl.puestosRuta.D.desde === 4, 'la etapa, el depósito y el día siguen después de guardar');
  ok(pl.comercio.mercado['Puesto del Riel Sur']?.caja === 5000, 'y la caja del puesto (en el mercado, como las paradas)');
  const vieja = JSON.parse(JSON.stringify(q)); delete vieja.puestosRuta;
  G.escribirPartida('relax', 1, vieja);
  const lv = G.leerPartida('relax', 1), pv = lv?.progreso || lv;
  ok(IDS.every((id) => pv.puestosRuta[id].etapa === 0), 'una partida de antes de la 4.6 carga con los cuatro abandonados');
  G.usarModoGuardado('desafio', 1);
  ok(G.progresoNuevo().puestosRuta === undefined, 'el otro modo no trae puestos de ruta');
  const g = leer('src/guardado.js');
  ok(g.includes("limpio.puestosRuta = modoPartida === 'desafio' ? undefined : sanearPuestosRuta(p.puestosRuta);"), 'guardado.js sanea lo nuevo (en un bloque propio «4.6 puestos»)');
}

// ---------------------------------------------------------------- 6. la E y el aviso con un juego de mentira
{
  const p = partida();
  const notas = [], abiertos = [], durmio = [];
  const mundo = { refrescados: [], refrescar(id) { this.refrescados.push(id); return true; } };
  const J = crearPuestosRutaJuego({ progreso: () => p, desafio: () => false, mundo, nota: (t, s) => notas.push([t, s]), guardar() {}, refrescarBarra() {}, abrirComercio: (par) => abiertos.push(par), dormir: (o) => durmio.push(o), horas: () => p.horas });
  const js = (id, cual, dx = 0, dz = 0) => { const q = R.puntoDe(id, cual); return { pos: { x: q.x + dx, y: 0, z: q.z + dz } }; };
  ok(J.accion({ pos: { x: 0, y: 0, z: 0 } }) === null, 'lejos de los puestos: nada');
  const a0 = J.accion(js('A', 'puerta'));
  ok(a0?.tipo === 'reparar' && a0.texto === R.textoReparar(p, 'A'), `junto al puesto abandonado: reparar («${a0?.texto}»)`);
  ok(J.accion(js('A', 'mostrador'))?.tipo === 'reparar' && J.accion(js('A', 'centro'))?.tipo === 'reparar', 'abandonado, la ventanilla y adentro también ofrecen reparar');
  a0.hacer();
  ok(R.etapaDe(p, 'A') === 1 && mundo.refrescados.join() === 'A' && /^Etapa 1 de 3: paredes y puerta$/.test(notas.at(-1)[0]), `E paga la etapa y se rehace lo que se ve (${notas.at(-1).join(' · ')})`);
  J.accion(js('A', 'puerta')).hacer(); J.accion(js('A', 'puerta')).hacer();
  ok(R.reparado(p, 'A') && notas.at(-1)[0] === '¡Puesto de la Cantera reparado!' && /\$5\.000 en la caja/.test(notas.at(-1)[1]), `al terminar lo dice (${notas.at(-1).join(' · ')})`);
  // reparado: adentro, el catre; en la ventanilla, el panel; en el alero, el depósito
  p.horas = 22;
  const ad = J.accion(js('A', 'catre'));
  ok(ad?.tipo === 'dormir' && ad.texto === 'Dormir en el catre del puesto', 'de noche, adentro: el catre');
  p.horas = 14;
  ok(J.accion(js('A', 'catre'))?.texto === 'Dormir una siesta en el catre del puesto', 'de día, una siesta');
  ad.hacer();
  eq(durmio.at(-1), { puestoRuta: 'A' }, 'E duerme en el puesto (dormir de main.js, con el catre del puesto)');
  const co = J.accion(js('A', 'mostrador'));
  ok(co?.tipo === 'comerciar' && co.texto === 'Comerciar en el puesto de la cantera', 'en la ventanilla: comerciar');
  co.hacer();
  const par = abiertos.at(-1);
  ok(par.nombre === 'Puesto de la Cantera' && par.sinFletes === true && par.cerca(R.puntoDe('A', 'mostrador')) && !par.cerca(R.PUESTOS_RUTA.B.pos), 'abre el panel del puesto, sin fletes y con su propio «cerca»');
  p.materiales = { tronco: 4 };
  const de = J.accion(js('A', 'deposito'));
  ok(de?.tipo === 'deposito' && /^Guardar en el depósito del puesto \(/.test(de.texto), `en el alero: guardar («${de?.texto}»)`);
  de.hacer();
  ok(R.enDeposito(p, 'A', 'tronco') === 4 && !p.materiales.tronco, 'guardó');
  ok(J.accion(js('A', 'deposito')).texto.startsWith('Sacar del depósito del puesto'), 'sin nada a mano: sacar');
  // el fogón (la F): sólo reparado y a mano
  ok(J.fogonCerca(R.puntoDe('A', 'fogon'))?.id === 'A' && J.fogonCerca(R.puntoDe('B', 'fogon')) === null, 'la F prende el fogón de un puesto reparado, no el de uno abandonado');
  // el Riel Sur comercia por la trochita (con fletes): la E de acá no abre un panel aparte
  for (let i = 0; i < 3; i++) R.repararEtapa(p, 'D', { tabla: 99, piedra: 99 });
  ok(J.accion(js('D', 'mostrador'))?.tipo !== 'comerciar', 'en el Riel Sur la ventanilla es el puesto de cargas de la trochita');
  // en el otro modo, nada
  const J2 = crearPuestosRutaJuego({ progreso: () => p, desafio: () => true });
  ok(J2.accion(js('A', 'puerta')) === null && J2.fogonCerca(R.puntoDe('A', 'fogon')) === null, 'en el otro modo, nada');
}

// ---------------------------------------------------------------- 7. el panel del puesto (comercio-mundo.js): sin fletes, se cierra al alejarte
{
  const p = partida({ materiales: { tronco: 6 } });
  for (let i = 0; i < 3; i++) R.repararEtapa(p, 'A', { tabla: 99, piedra: 99 });
  const notas = [];
  const parada = { nombre: 'Puesto de la Cantera', sinFletes: true, cerca: (pos) => Math.hypot(pos.x - R.puntoDe('A', 'mostrador').x, pos.z - R.puntoDe('A', 'mostrador').z) < 3.4 };
  const puesto = crearPuestoDeCargas({ progreso: () => p, dia: () => 5, temporada: () => 'verano', tren: { paradas: [], conduciendo: () => false, puestoCerca: () => null }, nota: (t, s) => notas.push([t, s]), guardar() {}, refrescar() {}, sonido: null });
  ok(puesto.abrir(parada, 'fletes') && puesto.modo() === 'comprar', 'sin fletes: abre en comprar');
  puesto.pasarModo(1); ok(puesto.modo() === 'vender', 'Tab: vender');
  puesto.pasarModo(1); ok(puesto.modo() === 'comprar', 'Tab: vuelve a comprar');
  const caja0 = M.tienda(p.comercio, 'Puesto de la Cantera', 5).caja, pesos0 = p.economia.pesos;
  ok(puesto.venderBien('tronco') && p.economia.pesos > pesos0 && M.tienda(p.comercio, 'Puesto de la Cantera', 5).caja < caja0, 'se le vende y paga de su caja');
  puesto.vigilar(R.puntoDe('A', 'mostrador')); ok(puesto.abierto(), 'junto a la ventanilla sigue abierto');
  puesto.vigilar(R.PUESTOS_RUTA.C.pos); ok(!puesto.abierto(), 'lejos, se cierra');
  // el apeadero del Riel Sur, abandonado: no abre (tampoco desde la cabina) y lo dice
  ok(!puesto.abrir({ nombre: 'Puesto del Riel Sur', atiende: () => false }) && /abandonado/.test(notas.at(-1)[0]), `el Riel Sur abandonado no comercia (${notas.at(-1)[0]})`);
  const cm = leer('src/comercio-mundo.js');
  ok(cm.includes("const MODOS_SIN_FLETES = ['comprar', 'vender'];") && cm.includes('estado.parada.cerca ? estado.parada.cerca(pos) :'), 'comercio-mundo.js: el puesto de ruta sin fletes y con su «cerca»');
}

// ---------------------------------------------------------------- 8. el valle de verdad: dónde caen, el apeadero y lo que se ve
{
  const { valle, M: MM, THREE } = cargarValle(['puestos-ruta.js', 'puestos-ruta-mundo.js']);
  const PR = MM.puestos_ruta, PM = MM.puestos_ruta_mundo;
  const progreso = { modo: 'relax', dia: 3, economia: { ...E.economiaNueva(), pesos: 50000 }, comercio: C.comercioNuevo(), materiales: { tabla: 99, piedra: 99 } };
  const V = valle({ aldea: true });
  const { T, escena, col, est } = V;
  // el apeadero: se arma otra trochita con él (como en main.js) y se compara con la de siempre
  const TR = MM.trochita;
  const carteles = [];
  const tren = TR.crearTrochita(T, escena, col, new Proxy({}, { get: () => () => {} }), { cartel: (tx, x, z) => carteles.push({ tx, x, z }), sentaderos: [], aldea: { indice: MM.aldea.PARADA_ALDEA.indice, nombre: MM.aldea.NOMBRE_ALDEA }, lugaresAntes: est.lugaresSorteo || null, apeaderos: [PM.apeaderoDelRielSur(T, () => progreso)] });
  ok(V.tren.paradas.length === 4 && tren.paradas.length === 5, `sin apeaderos (el otro modo, las pruebas viejas) cuatro paradas; con el del Riel Sur, cinco (${tren.paradas.map((p) => p.nombre).join(', ')})`);
  const D = tren.paradas.find((p) => p.nombre === 'Puesto del Riel Sur');
  ok(D && D.apeadero && D.chica && !D.luz.isLight && D.cubiertas.length === 0 && typeof D.atiende === 'function', 'el Riel Sur es un apeadero chico, sin galpón ni luz');
  ok(tren.paradas.every((p, i) => i === 0 || p.s > tren.paradas[i - 1].s) && tren.paradas.map((p) => p.orden).join() === '0,1,2,3,4', 'las paradas, en orden por la vía');
  ok(tren.paradas.filter((p) => p !== D).every((p) => Math.abs(p.indice - D.indice) >= 40), 'lejos de las otras paradas');
  ok(Math.hypot(D.anden.x - PR.PUESTOS_RUTA.D.pos.x, D.anden.z - PR.PUESTOS_RUTA.D.pos.z) > 5 && Math.hypot(D.anden.x - PR.PUESTOS_RUTA.D.pos.x, D.anden.z - PR.PUESTOS_RUTA.D.pos.z) < 8, 'el andén queda entre la vía y el puesto');
  ok(carteles.some((c) => c.tx === 'Puesto del Riel Sur'), 'con su cartel');
  ok(tren.puestoCerca(D.cargas, 2.2) === null, 'abandonado, su ventanilla no comercia');
  progreso.puestosRuta = PR.puestosRutaNuevos(); progreso.puestosRuta.D.etapa = 3;
  ok(tren.puestoCerca(D.cargas, 2.2) === D, 'reparado, sí: es el puesto de cargas de esa parada');
  const fl = C.fletesDelDia(9, tren.paradas.map((p) => p.nombre), 'Puesto del Riel Sur');
  ok(fl.length === 2 && fl.every((f) => f.desde === 'Puesto del Riel Sur' && f.hasta !== f.desde), 'y ofrece sus fletes como toda parada');
  progreso.puestosRuta = PR.puestosRutaNuevos();
  // dónde caen: tierra firme, sin agua, lejos de la vía y de toda estructura
  const riel = T.riel;
  const lugares = [...Object.entries(T.lugares).filter(([, v]) => v && Number.isFinite(v.x)).map(([k, v]) => ({ k, x: v.x, z: v.z, r: v.radio || 4 })),
    ...['faro', 'molino', 'casaTe', 'torre', 'galpon', 'almacen', 'cueva'].filter((k) => est[k]).map((k) => ({ k, x: est[k].x, z: est[k].z, r: est[k].radio || 6 })),
    ...est.cabañas.map((c) => ({ k: c.nombre, x: c.x, z: c.z, r: c.radio || 5 })), ...tren.paradas.filter((p) => p !== D).map((p) => ({ k: p.nombre, x: p.x, z: p.z, r: 14 }))];
  for (const id of IDS) {
    const P = PR.PUESTOS_RUTA[id];
    let agua = 0, hmin = Infinity, hmax = -Infinity;
    for (let lx = -6; lx <= 6; lx += 1) for (let lz = -3; lz <= 5; lz += 1) { const q = PR.aMundo(id, lx, lz); if (T.agua(q.x, q.z)) agua++; const h = T.altura(q.x, q.z); hmin = Math.min(hmin, h); hmax = Math.max(hmax, h); }
    ok(agua === 0, `${id}: sin agua alrededor`);
    ok(hmax - hmin < 3.5, `${id}: el suelo da para la pirca (desnivel ${(hmax - hmin).toFixed(2)} m)`);
    const dRiel = Math.min(...riel.map((r) => Math.hypot(r.x - P.pos.x, r.z - P.pos.z)));
    ok(dRiel > 8, `${id}: la casilla, a ${dRiel.toFixed(1)} m de la vía`);
    // ninguna cosa del puesto sobre la vía: lo más cerca de la vía (fogón, tronco, cartel), a más de 3,2 m
    for (const k of ['fogon', 'tronco', 'cartel', 'deposito', 'mostrador']) { const q = R.puntoDe(id, k), d = Math.min(...riel.map((r) => Math.hypot(r.x - q.x, r.z - q.z))); ok(d > 3.2, `${id}: ${k} a ${d.toFixed(1)} m de la vía`); }
    for (const l of lugares) ok(Math.hypot(l.x - P.pos.x, l.z - P.pos.z) > l.r + 8, `${id}: lejos de ${l.k} (${Math.hypot(l.x - P.pos.x, l.z - P.pos.z).toFixed(0)} m)`);
  }
  // lo que se ve: una malla por puesto, de tipo 0 o 4, y cada etapa distinta
  const sentaderos = [], cubiertas = [];
  const mundo = PM.crearPuestosRutaMundo({ T, escena, grupo: est.grupo, mat: est.mat, col, cartel: (tx, x, z) => carteles.push({ tx, x, z }), sentaderos, cubiertas, progreso: () => progreso });
  ok(Object.keys(mundo.puestos).length === 4 && carteles.filter((c) => /^Puesto de la|^Puesto del Paso/.test(c.tx)).length === 3, 'cuatro puestos, tres carteles propios (el del Riel Sur está en el andén)');
  const tipos = (id) => [...new Set(mundo.puestos[id].malla.geometry.attributes.aTipo.array)];
  const tris = (id) => mundo.puestos[id].malla.geometry.attributes.position.count / 3;
  const firmas = {};
  for (const id of IDS) {
    ok(mundo.puestos[id].malla.material === est.mat && mundo.puestos[id].malla.parent === est.grupo, `${id}: con el material de las estructuras, en su grupo (el corte por distancia de siempre)`);
    const caras = [];
    for (let e = 0; e <= 3; e++) {
      progreso.puestosRuta[id].etapa = e;
      if (e === 3) progreso.puestosRuta[id].deposito = { n: 0, g: { tronco: 30, piedra: 10 } };
      mundo.refrescar(id);
      ok(tipos(id).every((t) => t === 0 || t === 4), `${id} etapa ${e}: tipo 0 o 4 (${tipos(id)})`);
      ok(tris(id) > 300 && tris(id) < 6000, `${id} etapa ${e}: ${tris(id)} triángulos`);
      const g = mundo.puestos[id].malla.geometry; g.computeBoundingBox();
      caras.push(`${tris(id)}|${g.boundingBox.max.y.toFixed(2)}`);
    }
    firmas[id] = caras;
    ok(new Set(caras).size === 4, `${id}: cada etapa se ve distinta (${caras.join(' · ')})`);
    const antes = tris(id);
    progreso.puestosRuta[id].deposito = { n: 0, g: { tronco: 40, piedra: 40, tabla: 40, lana: 40 } };
    ok(mundo.refrescar(id) && tris(id) > antes, `${id}: lo guardado se ve en el alero (${antes} → ${tris(id)} triángulos)`);
    ok(!mundo.refrescar(id), `${id}: sin cambios no se rehace nada`);
  }
  ok(sentaderos.length === 8 && sentaderos.every((s) => s.puestoRuta && Number.isFinite(s.y)), 'reparados: el banco y el tronco del fogón de cada uno son asientos');
  ok(cubiertas.length === 4, 'y bajo cada techo arreglado no llueve');
  // la casilla pisa firme: el piso sobre lo más alto del terreno y la pirca hasta lo más bajo
  for (const id of IDS) { const q = mundo.puestos[id]; ok(q.y0 > q.gmax && q.y0 - q.gmax < 0.25 && q.gmax - q.gmin < 2.5, `${id}: el piso a ${(q.y0 - q.gmin).toFixed(2)} m del punto más bajo (pirca)`); }
  // lo que choca: paredes con el hueco de la puerta y el piso para pararse adentro
  for (const id of IDS) {
    const c = R.PUESTOS_RUTA[id].pos;
    ok(col.plataformaEn ? !!col.plataformaEn(c.x, c.z, mundo.puestos[id].y0 + 0.5) : true, `${id}: adentro se pisa el piso`);
  }
  void THREE;
}

// ---------------------------------------------------------------- 9. main.js, módulos puros, sin luces
{
  for (const f of ['src/puestos-ruta.js', 'src/puestos-ruta-juego.js']) {
    const t = leer(f);
    ok(!/from 'three'|document\.|window\./.test(t), `${f} es puro (sin three ni DOM)`);
  }
  for (const f of ['src/puestos-ruta.js', 'src/puestos-ruta-juego.js', 'src/puestos-ruta-mundo.js']) {
    const t = leer(f);
    ok(!/^export (async function|function\*)|^export .* from /m.test(t) && [...t.matchAll(/^import .*$/gm)].every((m) => /^import (\* as THREE|\{ [^}]+ \}) from '[^']+';$/.test(m[0])), `${f}: imports y exports que entiende armar.mjs`);
    ok(!/new THREE\.(PointLight|SpotLight|OctahedronGeometry|Vector4|Frustum|Shape)/.test(t), `${f}: sin luces nuevas ni lo que el three local no trae`);
    ok(!/[ñÑ]/.test([...t.matchAll(/^export (?:const|function|let) ([^\s(=]+)/gm)].map((m) => m[1]).join(' ')), `${f}: lo exportado, sin ñ`);
    ok(!/\r\n/.test(t), `${f}: fines de línea LF`);
  }
  const mundo = leer('src/puestos-ruta-mundo.js');
  ok([...mundo.matchAll(/tipo:\s*(\d)/g)].every((m) => m[1] === '0' || m[1] === '4'), 'puestos-ruta-mundo.js: material tipo 0 o 4');
  const main = leer('src/main.js');
  ok(main.includes("import { crearPuestosRutaMundo, apeaderoDelRielSur } from './puestos-ruta-mundo.js';") && main.includes("import { crearPuestosRutaJuego } from './puestos-ruta-juego.js';"), 'main.js importa los puestos');
  ok(main.includes('apeaderos: esDesafio ? null : [apeaderoDelRielSur(T, () => progreso)] });'), 'la trochita del Relax tiene el apeadero del Riel Sur');
  ok(main.includes('if (!esDesafio) {\n      try {\n        puestosRutaMundo = crearPuestosRutaMundo('), 'los puestos se arman sólo en el Relax');
  // la tecla E y el aviso: la misma función (puestosJuego.accion), en el mismo lugar (después del puesto de cargas, antes del cantero)
  const iE = main.indexOf("case 'KeyE': {"), fE = main.indexOf("case 'Tab':", iE), tecla = main.slice(iE, fE);
  const enE = (t) => { const i = tecla.indexOf(t); ok(i >= 0, `en la tecla E: ${t}`); return i; };
  ok(enE('puestoDeCargasCerca()) { cargas().abrir') < enE('const a = puestosJuego.accion(js); if (a) { a.hacer(); cachePuestos = null; break; }') && enE('const a = puestosJuego.accion(js);') < enE('const c = canteroCerca()'), 'E: el puesto de ruta va después del puesto de cargas y antes del cantero');
  const iA = main.indexOf("let aviso = objetivo ? { tecla: 'E'"), fA = main.indexOf('mostrarAviso(aviso);', iA), aviso = main.slice(iA, fA);
  const enA = (t) => { const i = aviso.indexOf(t); ok(i >= 0, `en el aviso: ${t}`); return i; };
  ok(enA("texto: 'Comerciar en el puesto de cargas'") < enA('cachePuestos.texto') && enA('cachePuestos.texto') < enA('cacheCantero &&'), 'el aviso del puesto de ruta, en el mismo lugar que la tecla');
  ok(main.includes('cachePuestos = puestosJuego ? puestosJuego.accion(js) : null;'), 'el aviso usa la misma función que la tecla');
  ok(aviso.includes("texto: 'Encender el fogón del puesto'") && main.includes('const fp = puestosJuego?.fogonCerca(js.pos); if (fp) {'), 'la F prende el fogón del puesto (aviso y tecla)');
  ok(main.includes('const enCasaAldea = !desafio && (!!opRincon?.casaAldea || !!opRincon?.puestoRuta);') && main.includes('horasDescansado({ como, casa: !desafio && opRincon?.puestoRuta ? CASA_PUESTO : casa })'), 'dormir en el puesto: bajo techo y con descanso');
  ok(leer('src/trochita.js').includes('if (p.cargas && (!p.atiende || p.atiende()) && Math.hypot('), 'trochita.js: el apeadero comercia sólo si el puesto atiende');
}

console.log(`OK 4.6 puestos de ruta · ${n} verificaciones · cuatro puestos fijos, reparación en tres etapas con pesos, caja de $5.000, depósito, descanso y el apeadero del Riel Sur`);

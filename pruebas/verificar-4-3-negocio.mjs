// 4.3: el negocio propio (negocio-propio.js, planos-negocio.js, negocio-propio-juego.js), en Node:
//   · los dos locales (almacén de campo y panadería y cafetería): existen, cuestan lo que dice la escala de PRECIOS_CONSTRUCCION.md, geometría sana y dentro de un
//     presupuesto de triángulos, los estantes se llenan y se vacían a la vista, una vista guardada rota no los tira, física sana;
//   · el stock: surtir desde la mochila hasta el tope, sacar, que lo que no vende el local no entre;
//   · los precios: tres niveles, ordenados, redondos, que no se disparen sobre la plaza;
//   · la demanda: más clientes con precios baratos, con fama, con variedad; ninguno sin mercadería, de noche, con el local cerrado o con vos lejos;
//   · los clientes: quiénes son, qué piden (sólo lo que el local puede vender), cuánto esperan; despachar; el faltante; la fama sube con buena atención y baja si los dejás;
//   · la caja con tope: se llena, no se atiende, se retira a la billetera; al desarmar vuelve todo;
//   · el guardado: el campo nuevo, las partidas viejas sin él, una partida rota;
//   · el equilibrio: lo que rinde un local bien atendido frente a los jornales y frente a vender lo mismo al mercado;
//   · el cableado de main.js, construccion.js, guardado.js y la plantilla.
import assert from 'assert/strict';
import fs from 'fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const { PLANO, PLANOS } = await import('../src/construccion.js');
const { Constructor } = await import('../src/geometria.js');
const O = await import('../src/obra-pesos.js');
const N = await import('../src/negocio-propio.js');
const PN = await import('../src/planos-negocio.js');
const { BIENES, COMERCIO } = await import('../src/comercio.js');
const E = await import('../src/economia.js');
const R = await import('../src/propiedad.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const cerca = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, `${m} (${a} vs ${b})`);

const LOCALES = { 'local-almacen': { tipo: 'almacen', pesos: 28000 }, 'local-panaderia': { tipo: 'panaderia', pesos: 36000 } };
const MATERIALES = new Set(['tabla', 'tronco', 'piedra', 'lana']);

// ---------------------------------------------------------------- 1. los dos locales
eq(PN.IDS_PLANOS_NEGOCIO.sort(), Object.keys(LOCALES).sort(), 'los dos locales del bloque');
eq(N.IDS_LOCALES.slice().sort(), Object.keys(LOCALES).sort(), 'negocio-propio.js conoce los mismos dos');
eq(Object.keys(PN.LOCALES_QUE_SE_USAN).sort(), Object.keys(LOCALES).sort(), 'y los dos se usan con E');
ok(new Set(PLANOS.map((p) => p.id)).size === PLANOS.length, 'ningún id de plano repetido en todo el catálogo');
for (const [id, def] of Object.entries(LOCALES)) {
  const P = PLANO[id];
  ok(P && P.pieza === true && P.etapas.length === 1 && P.etapas[0].termina, `${id}: está en el catálogo, una etapa`);
  ok(P.soloRelax === true && !P.soloDesafio && P.categoria === 'trabajo', `${id}: sólo en el Relax, en Trabajo`);
  ok(Object.entries(P.pide).every(([k, c]) => MATERIALES.has(k) && Number.isInteger(c) && c > 0), `${id}: materiales que existen`);
  ok(P.texto.length > 150 && P.nombre && P.radio > 0 && P.separacion > 0, `${id}: nombre, texto y medidas`);
  eq(P.etapas[0].pesos, def.pesos, `${id}: la etapa declara $${def.pesos}`);
  eq(O.precioDeEtapa(id, 0), def.pesos, `${id}: el registro tiene su precio`);
  ok(def.pesos >= 25000 && def.pesos <= 40000 && def.pesos % 500 === 0, `${id}: en la escala del local de campo ($25.000 a $40.000), redondo`);
  ok(def.pesos < 110000, `${id}: menos que la casona`);
  ok(!P.funciones?.includes('luz') && !P.luzInterior, `${id}: sin luces dinámicas`);
  eq(N.tipoDePlano(id), def.tipo, `${id}: es el tipo ${def.tipo}`);
  // la geometría en sus tres estados: el fantasma, el local recién armado (cerrado y vacío) y el local lleno
  const llena = Object.fromEntries(N.catalogo(def.tipo).map((k) => [k, 3]));
  const tris = {};
  for (const [nombre, datos] of [['fantasma', null], ['vacio', {}], ['lleno', { local: { abierto: true, p: llena } }], ['cerrado-lleno', { local: { abierto: false, p: llena } }]]) {
    for (const suelo of [null, (x, z) => 0.2 + 0.1 * x]) {
      const c = new Constructor(); P.etapas[0].arma(c, P, datos, suelo);
      ok(c.pos.length > 0 && c.pos.every(Number.isFinite) && c.col.every(Number.isFinite), `${id} (${nombre}): dibuja sin números rotos`);
      ok(c.tipo.every((t) => t === 0 || t === 4), `${id} (${nombre}): sólo tipo 0 y 4`);
      tris[nombre] = c.pos.length / 9;
    }
  }
  ok(tris.vacio >= 400 && tris.vacio <= 1000, `${id}: vacío ${Math.round(tris.vacio)} triángulos (400 a 1000)`);
  ok(tris.lleno <= 1600, `${id}: lleno ${Math.round(tris.lleno)} triángulos (tope 1600; el edificio es mucho más que la mediana del juego, ~250)`);
  ok(tris.lleno > tris.vacio + 200, `${id}: los estantes llenos se ven (${Math.round(tris.vacio)} → ${Math.round(tris.lleno)})`);
  ok(tris.fantasma > tris.vacio, `${id}: el fantasma del plano se ve surtido`);
  // abierto o cerrado cambia lo que se ve (el toldo y el cartel)
  { const a = new Constructor(), b = new Constructor(); P.etapas[0].arma(a, P, { local: { abierto: true, p: {} } }, null); P.etapas[0].arma(b, P, { local: { abierto: false, p: {} } }, null);
    ok(a.pos.length !== b.pos.length || a.pos.some((v, i) => v !== b.pos[i]), `${id}: abierto y cerrado se ven distinto (toldo y cartel)`); }
  // una vista guardada rota no tira la obra
  for (const rota of [{ abierto: 1, p: { constructor: 3, huevo: 'x', 'pan-casero': -4, miel: 99, __proto__: 5 } }, { p: null }, 'texto', 5, { abierto: true, p: [1, 2] }]) {
    const c = new Constructor();
    P.etapas[0].arma(c, P, { local: rota }, null);
    ok(c.pos.every(Number.isFinite), `${id}: una vista rota (${JSON.stringify(rota)?.slice(0, 40)}) no la tira`);
  }
  let x0 = Infinity, x1 = -Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity, y0 = Infinity;
  { const c = new Constructor(); P.etapas[0].arma(c, P, { local: { abierto: true, p: llena } }, null);
    for (let k = 0; k < c.pos.length; k += 3) { x0 = Math.min(x0, c.pos[k]); x1 = Math.max(x1, c.pos[k]); y0 = Math.min(y0, c.pos[k + 1]); y1 = Math.max(y1, c.pos[k + 1]); z0 = Math.min(z0, c.pos[k + 2]); z1 = Math.max(z1, c.pos[k + 2]); } }
  ok(y0 >= -0.16, `${id}: no se hunde (${y0.toFixed(2)})`);
  ok(y1 <= P.alto + 0.1 && y1 >= P.alto * 0.7, `${id}: entra en su alto (${y1.toFixed(2)} de ${P.alto.toFixed(2)})`);
  ok(Math.max(Math.abs(x0), Math.abs(x1)) <= P.ancho / 2 + 0.05 && Math.max(Math.abs(z0), Math.abs(z1)) <= P.fondo / 2 + 0.05, `${id}: entra en su ancho y su fondo`);
  ok(P.ancho <= 5.3 && P.fondo <= 4.5, `${id}: no es una mole (${P.ancho.toFixed(1)} × ${P.fondo.toFixed(1)} m)`);
  // la física: platea a ras, el fondo y el mostrador; se entra por los costados y los clientes esperan al frente
  const reg = { s: [], c: [], p: [] };
  P.fisica({ segmento: (...a) => reg.s.push(a), circulo: (...a) => reg.c.push(a), plataforma: (...a) => reg.p.push(a) });
  ok(reg.p.length === 1 && reg.p[0].every(Number.isFinite) && reg.p[0][0] === 0 && reg.p[0][1] === 0 && reg.p[0][4] > 0 && reg.p[0][4] <= 0.3, `${id}: el piso es una plataforma a ras`);
  ok(reg.s.length === 2, `${id}: choca con el fondo y el mostrador`);
  for (const s of reg.s) ok(s.length === 7 && s.every(Number.isFinite) && s[4] > 0 && s[5] < s[6] && s[6] <= P.alto + 0.1 && Math.abs(s[0]) <= P.ancho / 2 && Math.abs(s[2]) <= P.ancho / 2, `${id}: segmento sano`);
  const mostrador = reg.s.find((s) => s[1] < 0 && s[3] < 0);
  ok(mostrador && Math.abs(mostrador[0] - mostrador[2]) <= 2.7, `${id}: el mostrador deja pasar por los costados (${Math.abs(mostrador[0] - mostrador[2]).toFixed(1)} m de largo)`);
  const M = PN.MEDIDAS[id];
  ok(mostrador[1] > -M.D / 2 && mostrador[1] === PN.MOSTRADOR_Z(M.D), `${id}: el mostrador está adentro de la platea`);
  for (const s of PN.SITIOS_CLIENTES(M.D)) ok(s.z < -M.D / 2 && s.z > -M.D / 2 - 1.2 && Math.abs(s.x) <= 1.2, `${id}: los clientes esperan al frente, fuera de la platea`);
}

// ---------------------------------------------------------------- 2. lo que se vende
for (const t of N.IDS_TIPOS) {
  const cat = N.catalogo(t);
  ok(cat.length >= 6 && cat.every((k) => Object.hasOwn(BIENES, k)), `${t}: vende ${cat.length} cosas y todas son bienes del mercado`);
  ok(new Set(cat).size === cat.length, `${t}: sin repetidos`);
  ok(cat.every((k) => Object.hasOwn(PN.MEDIDAS, N.TIPOS[t].plano) && Object.hasOwn(N.UNIDAD, k)), `${t}: cada cosa tiene su nombre en singular y plural`);
}
ok(N.catalogo('almacen').length > N.catalogo('panaderia').length, 'el almacén vende más cosas que la panadería');
ok(['pan-casero', 'empanadas', 'huevo', 'miel'].every((k) => N.catalogo('panaderia').includes(k)) && !N.catalogo('panaderia').some((k) => ['tronco', 'tabla', 'piedra', 'poncho'].includes(k)), 'la panadería vende lo suyo y no madera ni piedra');
ok(['tronco', 'tabla', 'piedra', 'poncho', 'pan-casero'].every((k) => N.catalogo('almacen').includes(k)), 'el almacén vende de todo un poco (leña, tablas, piedra, ponchos, pan)');
eq(N.catalogo('inventado'), [], 'un tipo que no existe no vende nada');
ok(N.esLocal('local-almacen') && !N.esLocal('tienda-campo') && !N.esLocal(undefined), 'esLocal distingue');
// cada tipo del catálogo del plano también tiene lugar en los estantes (qué se dibuja)
for (const [id, def] of Object.entries(LOCALES)) {
  const P = PLANO[id];
  const sin = new Constructor(); P.etapas[0].arma(sin, P, { local: { abierto: true, p: {} } }, null);
  for (const k of N.catalogo(def.tipo)) {
    const con = new Constructor(); P.etapas[0].arma(con, P, { local: { abierto: true, p: { [k]: 3 } } }, null);
    ok(con.pos.length > sin.pos.length, `${id}: ${k} se ve en el local cuando hay`);
  }
}

// ---------------------------------------------------------------- 3. stock: surtir y sacar
{
  const est = N.negocioPropioNuevo(); est.tipo = 'almacen';
  const mochila = { 'pan-casero': 20, tronco: 3, empanadas: 9, huevo: 100 };
  const envio = { tengo: (k) => mochila[k] || 0, quitar: (k, c) => { mochila[k] -= c; } };
  eq(N.surtir(est, 'pan-casero', 5, envio), 5, 'surtir 5 panes');
  eq([est.stock['pan-casero'], mochila['pan-casero']], [5, 15], 'salen de la mochila y entran al estante');
  eq(N.surtir(est, 'pan-casero', 1000, envio), 13, 'llenar: hasta el tope (6 lotes de 3 = 18)');
  eq([est.stock['pan-casero'], mochila['pan-casero']], [18, 2], 'tope 18, sobran 2 en la mochila');
  eq(N.surtir(est, 'pan-casero', 1, envio), 0, 'lleno: no entra más');
  eq(N.surtir(est, 'tronco', 10, envio), 3, 'sólo pone lo que llevás');
  eq(N.surtir(est, 'empanadas', 3, envio), 0, 'el almacén no vende empanadas: no las acepta');
  eq(mochila.empanadas, 9, 'y no se las lleva');
  eq(N.topeEstante('huevo'), 36, 'tope de huevos: 6 lotes de 6');
  eq(N.surtir(est, 'huevo', 1000, envio), 36, 'los huevos llegan a 36');
  eq(N.surtirTodo(est, envio), [], 'ya está todo lleno: nada que poner');
  mochila.miel = 1; mochila.poncho = 2;
  eq(N.surtirTodo(est, envio).map((x) => x.k).sort(), ['miel', 'poncho'], 'surtir todo pone lo que llevás de lo que vende');
  eq(N.sacarDelEstante(est, 'huevo', 10), 10, 'sacar 10 huevos');
  eq(est.stock.huevo, 26, 'quedan 26');
  eq(N.sacarDelEstante(est, 'huevo'), 26, 'sacar todo');
  ok(!('huevo' in est.stock), 'sin nada, la clave desaparece');
  eq(N.sacarDelEstante(est, 'huevo'), 0, 'sacar de un estante vacío no hace nada');
  eq(N.unidadesEnEstantes(est), 18 + 3 + 1 + 2, 'cuenta lo que hay');
  const otro = N.negocioPropioNuevo();
  eq(N.surtir(otro, 'huevo', 3, envio), 0, 'sin tipo de local, no se surte');
}

// ---------------------------------------------------------------- 4. precios
{
  for (const k of Object.keys(BIENES)) {
    const [b, m, c] = [0, 1, 2].map((i) => N.precioUnidad(k, i));
    ok(b <= m && m < c && b >= 10, `${k}: barato ${b} ≤ normal ${m} < caro ${c}`);
    ok([b, m, c].every((v) => v % 10 === 0), `${k}: precios redondos a $10`);
    ok(m <= N.precioPlaza(k) * 1.2 + 10 && c <= N.precioPlaza(k) * 1.5 + 10, `${k}: el local cobra apenas más que la plaza (no se dispara)`);
    ok(b >= N.precioPlaza(k) * 0.9, `${k}: ni el barato regala (${b} vs plaza ${N.precioPlaza(k)})`);
  }
  eq(N.precioUnidad('pan-casero', 1), 230, 'un pan casero a precio normal: $230 (plaza $200)');
  eq(N.precioUnidad('poncho', 1), 2300, 'un poncho: $2.300 (plaza $2.000)');
  eq(N.precioUnidad('inventado', 1), 0, 'una cosa que no existe no tiene precio');
  const est = N.negocioPropioNuevo(); est.tipo = 'almacen';
  ok(N.ponerPrecio(est, 'huevo', 2) && N.nivelDeProducto(est, 'huevo') === 2, 'poner caro');
  ok(N.ponerPrecio(est, 'huevo', 1) && !('huevo' in est.precios), 'volver a normal no guarda nada');
  ok(!N.ponerPrecio(est, 'huevo', 7) && !N.ponerPrecio(est, 'empanadas', 0), 'un nivel que no existe o una cosa que el local no vende: no');
  eq([0, 1, 2].map(N.siguienteNivel), [1, 2, 0], 'el botón de precio da la vuelta');
}

// ---------------------------------------------------------------- 5. demanda
{
  const surtido = (tipo, nivel = 1, rep = 50, cosas = null) => {
    const est = N.negocioPropioNuevo(); est.tipo = tipo; est.abierto = true; est.rep = rep;
    for (const k of cosas || N.catalogo(tipo)) { est.stock[k] = 10; if (nivel !== 1) est.precios[k] = nivel; }
    return est;
  };
  const LL = (e, env) => N.llegadasPorDia(e, e.tipo, env);
  const barato = LL(surtido('almacen', 0)), normal = LL(surtido('almacen', 1)), caro = LL(surtido('almacen', 2));
  ok(barato > normal && normal > caro, `más clientes con precios baratos: ${barato.toFixed(1)} > ${normal.toFixed(1)} > ${caro.toFixed(1)}`);
  ok(caro > 0.3 * normal && barato < 1.6 * normal, 'pero ni el caro espanta a todos ni el barato duplica');
  const r0 = LL(surtido('almacen', 1, 0)), r50 = LL(surtido('almacen', 1, 50)), r100 = LL(surtido('almacen', 1, 100));
  ok(r0 < r50 && r50 < r100 && r100 / r0 < 2.2, `la fama trae gente: ${r0.toFixed(1)} < ${r50.toFixed(1)} < ${r100.toFixed(1)}`);
  const poca = LL(surtido('almacen', 1, 50, ['huevo'])), cinco = LL(surtido('almacen', 1, 50, ['huevo', 'pan-casero', 'miel', 'harina', 'papa']));
  ok(poca < cinco * 0.7, `la variedad también: una cosa sola ${poca.toFixed(1)} < cinco cosas ${cinco.toFixed(1)}`);
  eq(N.llegadasPorDia(N.negocioPropioNuevo(), 'almacen'), 0, 'sin nada en los estantes no viene nadie');
  ok(LL(surtido('almacen', 1, 50), { lluvia: 1 }) < LL(surtido('almacen', 1, 50)), 'llueve y viene menos gente');
  ok(LL(surtido('almacen', 0, 100)) <= N.DEMANDA.tope, 'nunca pasa del tope por día');
  // sólo se cuenta lo que hay: un precio caro en algo que no tenés no espanta
  { const est = surtido('almacen', 1, 50, ['huevo', 'pan-casero', 'miel', 'harina', 'papa']); est.precios.tronco = 2; eq(N.factorPrecio(est, 'almacen'), 1, 'un precio caro en lo que no tenés no cuenta'); }
  // el día: las horas
  const est = surtido('almacen', 1, 50);
  let suma = 0;
  for (let h = 0; h < 24; h++) suma += N.tasaPorHora(est, 'almacen', h + 0.5);
  cerca(suma, LL(est), 0.01, 'las horas suman el día');
  ok(N.tasaPorHora(est, 'almacen', 3) === 0 && N.tasaPorHora(est, 'almacen', 23) === 0 && N.tasaPorHora(est, 'almacen', 7.9) === 0 && N.tasaPorHora(est, 'almacen', 21) === 0, 'de noche no sale nadie de compras');
  ok(N.tasaPorHora(est, 'almacen', 17.5) > N.tasaPorHora(est, 'almacen', 13.5), 'la tardecita se compra más que la siesta');
  eq(N.nivelDeRep(0), 0, 'fama 0: nadie te conoce'); eq(N.nivelDeRep(50), 2, 'fama 50: con clientela'); eq(N.nivelDeRep(100), 4, 'fama 100: el mejor del valle');
}

// ---------------------------------------------------------------- 6. los clientes
{
  const est = N.negocioPropioNuevo(); est.tipo = 'panaderia';
  const cat = new Set(N.catalogo('panaderia'));
  const perfiles = new Set();
  let lineas = 0, pedidos = 0;
  for (let i = 0; i < 300; i++) {
    const c = N.armarCliente(est, 'panaderia', `s${i}`, 8 + (i % 13));
    ok(c && c.pide.length >= 1 && c.pide.length <= 3, 'un cliente pide de una a tres cosas');
    ok(c.pide.every((x) => cat.has(x.k) && x.n >= 1 && x.n <= 6), 'y sólo cosas que la panadería vende, en cantidades razonables');
    ok(new Set(c.pide.map((x) => x.k)).size === c.pide.length, 'sin repetir');
    ok(Object.hasOwn(N.PERFILES, c.perfil) && c.paciencia >= 40 && c.paciencia <= 90 && c.listo === false && c.espera === 0, 'su perfil, su paciencia, todavía no llegó');
    perfiles.add(c.perfil); lineas += c.pide.length; pedidos++;
    eq(N.armarCliente(est, 'panaderia', `s${i}`, 8 + (i % 13)), c, 'el mismo cliente para la misma cuenta');
  }
  ok(!perfiles.has('constructor'), 'a la panadería no viene el constructor (nada que comprar: tablas, leña, piedra)');
  ok(perfiles.has('vecina') && perfiles.has('merendera') && perfiles.has('viajero') && perfiles.has('hachero'), `y sí vecinas, hacheros y viajeros (${[...perfiles].join(', ')})`);
  ok(lineas / pedidos > 1.3 && lineas / pedidos < 1.8, `hay variedad: ${(lineas / pedidos).toFixed(2)} cosas por cliente`);
  const alm = new Set(); for (let i = 0; i < 400; i++) alm.add(N.armarCliente(est, 'almacen', `a${i}`, 12).perfil);
  ok(alm.has('constructor') && alm.has('tejedora') && alm.size === N.IDS_PERFILES.length, 'al almacén vienen todos los perfiles');
  // por hora: a la mañana, más vecinas; a la tarde, más viajeros
  const cuenta = (hora, perfil) => { let c = 0; for (let i = 0; i < 600; i++) if (N.armarCliente(est, 'almacen', `h${hora}|${i}`, hora).perfil === perfil) c++; return c; };
  ok(cuenta(9, 'vecina') > cuenta(19, 'vecina'), 'las vecinas salen a la mañana');
  ok(cuenta(19, 'viajero') > cuenta(9, 'viajero'), 'los viajeros llegan a la tardecita');
  const c1 = N.armarCliente(est, 'panaderia', 'x', 12);
  ok(/\d/.test(N.fraseDePedido(c1)) || /un |una /.test(N.fraseDePedido(c1)), 'lo que dice es una frase de pedido');
  ok(N.textoLista([{ k: 'pan-casero', n: 2 }, { k: 'miel', n: 1 }]) === '2 panes caseros y 1 frasco de miel', 'se lista en castellano: 2 panes caseros y 1 frasco de miel');
}

// ---------------------------------------------------------------- 7. despachar
{
  const nuevo = () => { const e = N.negocioPropioNuevo(); e.tipo = 'almacen'; e.abierto = true; e.rep = 50; ['pan-casero', 'miel', 'huevo'].forEach((k) => { e.stock[k] = 10; }); return e; };
  const cliente = (pide, espera = 5) => ({ perfil: 'vecina', pide, paciencia: 60, espera, edad: 0, listo: true, frase: 0 });
  let est = nuevo();
  let r = N.despachar(est, cliente([{ k: 'pan-casero', n: 2 }, { k: 'miel', n: 1 }]));
  ok(r.ok && r.total === 2 * 230 + 690 && r.unidades === 3 && !r.faltan.length, 'vende 2 panes y una miel a precio normal');
  eq([est.stock['pan-casero'], est.stock.miel, est.caja], [8, 9, r.total], 'baja el stock y sube la caja');
  eq([est.hoy.atendidos, est.hoy.ventas, est.total.atendidos, est.total.ventas], [1, r.total, 1, r.total], 'y las cuentas del día y del total');
  ok(est.rep > 50, `bien atendido (rápido y completo): la fama sube (${est.rep})`);
  // rápido vs lento
  const a = nuevo(), b = nuevo();
  N.despachar(a, cliente([{ k: 'pan-casero', n: 1 }], 5)); N.despachar(b, cliente([{ k: 'pan-casero', n: 1 }], 50));
  ok(a.rep > b.rep && b.rep >= 50, `rápido sube más que lento (${a.rep} > ${b.rep})`);
  // barato sube más que caro
  const ba = nuevo(), ca = nuevo(); ba.precios['pan-casero'] = 0; ca.precios['pan-casero'] = 2;
  N.despachar(ba, cliente([{ k: 'pan-casero', n: 1 }], 5)); N.despachar(ca, cliente([{ k: 'pan-casero', n: 1 }], 5));
  ok(ba.rep > ca.rep, 'el precio barato da más fama que el caro');
  eq(N.despachar(ca, cliente([{ k: 'pan-casero', n: 1 }], 5)).total, N.precioUnidad('pan-casero', 2), 'a precio caro cobra el caro');
  // faltante
  est = nuevo(); est.stock['pan-casero'] = 1;
  r = N.despachar(est, cliente([{ k: 'pan-casero', n: 3 }, { k: 'tronco', n: 2 }]));
  ok(r.ok && r.total === 230, 'vende lo que hay');
  eq(r.faltan, [{ k: 'pan-casero', n: 2 }, { k: 'tronco', n: 2 }], 'y dice lo que faltó');
  ok(est.rep < 50, `los faltantes bajan la fama (${est.rep})`);
  ok(!('pan-casero' in est.stock) && est.hoy.faltas === 2, 'se vació el pan y se anotaron los faltantes');
  // nada
  est = nuevo(); est.stock = {};
  r = N.despachar(est, cliente([{ k: 'pan-casero', n: 3 }]));
  ok(r.ok && r.nada && r.total === 0 && est.caja === 0 && est.rep < 50, 'si no tenés nada de lo que pide, se va sin comprar y baja la fama');
  // la caja con tope
  est = nuevo(); est.caja = N.CAJA_MAX - 100;
  r = N.despachar(est, cliente([{ k: 'pan-casero', n: 1 }]));
  ok(!r.ok && r.motivo === 'caja' && est.stock['pan-casero'] === 10 && est.caja === N.CAJA_MAX - 100 && est.hoy.atendidos === 0, 'sin lugar en la caja no se atiende y no se mueve nada');
  est.caja = N.CAJA_MAX - 230;
  ok(N.despachar(est, cliente([{ k: 'pan-casero', n: 1 }])).ok && est.caja === N.CAJA_MAX, 'justo hasta el tope sí');
  // la fama no pasa de 100 ni baja de 0
  est = nuevo(); est.rep = 99.9;
  for (let i = 0; i < 20; i++) { est.stock['pan-casero'] = 10; N.despachar(est, cliente([{ k: 'pan-casero', n: 1 }], 1)); est.caja = 0; }
  ok(est.rep <= 100, 'la fama no pasa de 100');
  est = nuevo(); est.rep = 1;
  for (let i = 0; i < 10; i++) N.sinAtender(est);
  eq(est.rep, 0, 'ni baja de 0');
  // subir cuesta más cuando ya sos conocido
  const nov = nuevo(), vet = nuevo(); nov.rep = 10; vet.rep = 90;
  N.despachar(nov, cliente([{ k: 'pan-casero', n: 1 }], 1)); N.despachar(vet, cliente([{ k: 'pan-casero', n: 1 }], 1));
  ok(nov.rep - 10 > vet.rep - 90, 'a quien recién empieza le sube más rápido que al que ya es conocido');
}

// ---------------------------------------------------------------- 8. la cola
{
  const nuevo = (o = {}) => { const e = N.negocioPropioNuevo(); e.tipo = 'almacen'; e.abierto = true; e.rep = 60; N.catalogo('almacen').forEach((k) => { e.stock[k] = 12; }); return Object.assign(e, o); };
  const env = (x = {}) => ({ hora: 10, dia: 3, presente: true, lluvia: 0, ...x });
  const llegan = (est, e, pasos = 600, dt = 1, dh = 1 / 75) => { const cola = N.colaNueva(); let c = 0; for (let i = 0; i < pasos; i++) c += N.avanzarCola(cola, est, est.tipo, dt, dh, { ...e, hora: (e.hora || 10) + (i * dh) % 1 * 0.9 }).filter((x) => x.tipo === 'llega').length; return c; };
  ok(llegan(nuevo(), env()) > 0, 'abierto, con mercadería, a la hora y con vos cerca: llegan clientes');
  eq(llegan(nuevo({ abierto: false }), env()), 0, 'cerrado: nadie');
  eq(llegan(nuevo(), env({ presente: false })), 0, 'si no estás cerca: nadie (no hay ventas sin vos)');
  eq(llegan(nuevo({ stock: {} }), env()), 0, 'sin mercadería: nadie');
  eq(llegan(nuevo(), env({ hora: 3 })), 0, 'de madrugada: nadie');
  eq(llegan(nuevo(), env({ hora: 22 })), 0, 'de noche: nadie');
  eq(llegan(nuevo({ caja: N.CAJA_MAX }), env()), 0, 'con la caja llena: nadie');
  { const e = nuevo({ tipo: 'panaderia' }), cola = N.colaNueva(); let c = 0; for (let i = 0; i < 600; i++) c += N.avanzarCola(cola, e, 'almacen', 1, 1 / 75, env()).length; eq(c, 0, 'si el estado es de otro tipo de local que el que se atiende, no llega nadie (el estado manda)'); }
  // máximo tres a la vez
  { const est = nuevo(), cola = N.colaNueva(); let max = 0;
    for (let i = 0; i < 2000; i++) { N.avanzarCola(cola, est, 'almacen', 1, 0.05, env({ hora: 17.5 })); max = Math.max(max, cola.clientes.length); }
    ok(max === N.COLA.maxPresentes, `hasta ${max} clientes a la vez (los que esperan sin atender)`); }
  // el juego limita a las figuras libres
  { const est = nuevo(), cola = N.colaNueva(); for (let i = 0; i < 400; i++) N.avanzarCola(cola, est, 'almacen', 1, 0.05, env({ hora: 17.5, max: 1 })); ok(cola.clientes.length === 1, 'con una sola figura libre, uno solo'); }
  // paciencia: sólo gasta el que ya llegó al mostrador
  { const est = nuevo(), cola = N.colaNueva();
    cola.clientes.push({ perfil: 'vecina', pide: [{ k: 'huevo', n: 2 }], paciencia: 60, espera: 0, edad: 0, listo: false, frase: 0 }, { perfil: 'vecina', pide: [{ k: 'huevo', n: 2 }], paciencia: 60, espera: 0, edad: 0, listo: true, frase: 0 });
    const rep0 = est.rep; let ev = [];
    for (let i = 0; i < 59; i++) ev.push(...N.avanzarCola(cola, est, 'almacen', 1, 0, env({ hora: 5 })));
    ok(ev.length === 0 && cola.clientes.length === 2, 'a los 59 s todavía esperan');
    ev = N.avanzarCola(cola, est, 'almacen', 2, 0, env({ hora: 5 }));
    ok(ev.length === 1 && ev[0].tipo === 'se-cansa' && cola.clientes.length === 1 && !cola.clientes[0].listo, 'a los 60 s el que esperaba en el mostrador se cansa; el que venía caminando, no');
    ok(est.rep < rep0 && est.hoy.perdidos === 1 && est.total.perdidos === 1, `y la fama baja (${rep0} → ${est.rep})`);
    for (let i = 0; i < 150; i++) ev = N.avanzarCola(cola, est, 'almacen', 1, 0, env({ hora: 5 }));
    ok(cola.clientes.length === 0 && est.hoy.perdidos === 1, 'el que nunca llegó al mostrador desaparece sin castigo (se perdió)'); }
  // si te vas, se van sin castigo
  { const est = nuevo(), cola = N.colaNueva(); cola.clientes.push({ perfil: 'vecina', pide: [{ k: 'huevo', n: 2 }], paciencia: 60, espera: 10, edad: 20, listo: true, frase: 0 });
    const rep0 = est.rep, ev = N.avanzarCola(cola, est, 'almacen', 1, 0, env({ presente: false }));
    ok(ev.length === 1 && ev[0].tipo === 'parte' && cola.clientes.length === 0 && est.rep === rep0 && est.hoy.perdidos === 0, 'si te alejás, los que esperaban se van y la fama queda como estaba'); }
  eq(N.primeroEnLaCola({ clientes: [{ listo: false }, { listo: true, id: 7 }] }).id, 7, 'se atiende al primero que ya llegó');
  // el día entero, cuántos vienen (con la mitad de los pasos de un día real, a 75 s por hora)
  { const est = nuevo({ rep: 50 }); let c = 0; const cola = N.colaNueva();
    for (let h = 8; h < 21; h++) for (let s = 0; s < 75; s++) { const ev = N.avanzarCola(cola, est, 'almacen', 1, 1 / 75, env({ hora: h + s / 75 })); c += ev.filter((x) => x.tipo === 'llega').length; for (const q of cola.clientes) q.listo = true; if (cola.clientes[0]) cola.clientes.shift(); }
    cerca(c, N.llegadasPorDia(est, 'almacen', {}), 3.2, 'en un día llegan los que dice la cuenta'); }
}

// ---------------------------------------------------------------- 9. el día, la caja y cerrar el local
{
  const est = N.negocioPropioNuevo(); est.tipo = 'panaderia'; est.abierto = true; est.rep = 40;
  ok(N.ponerAlDia(est, 5) && est.hoy.dia === 5, 'arranca el día 5');
  ok(!N.ponerAlDia(est, 5), 'dos veces el mismo día no hace nada');
  est.hoy.atendidos = 5; est.hoy.ventas = 3000; est.hoy.perdidos = 0;
  ok(N.ponerAlDia(est, 6) && est.rep > 40 && est.total.dias === 1 && est.total.mejorDia === 3000 && est.hoy.atendidos === 0, 'un día bueno sube un poco la fama, se anota el mejor y se vuelve a cero');
  est.hoy.atendidos = 5; est.hoy.perdidos = 1; const r1 = est.rep;
  N.ponerAlDia(est, 7);
  eq(est.rep, r1, 'un día en que dejaste a alguien sin atender no suma');
  // la caja
  const p = { modo: 'relax', economia: E.economiaNueva() };
  est.caja = 7300;
  eq(N.retirarCaja(p, est), 7300, 'retirar la caja devuelve lo que había');
  eq([est.caja, E.pesosDe(p)], [0, 7300], 'la caja queda en cero y la plata va a la billetera');
  eq(p.economia.libro.at(-1).motivo, 'Ventas de tu local', 'queda anotado en el libro');
  eq(N.retirarCaja(p, est), 0, 'con la caja vacía no hay nada que retirar');
  eq(N.retirarCaja({ modo: 'desafio' }, { ...est, caja: 100 }), 0, 'sin economía (el Desafío) no se retira nada');
  // cerrar el local: todo vuelve
  const e2 = N.negocioPropioNuevo(); e2.tipo = 'almacen'; e2.abierto = true; e2.stock = { huevo: 12, tronco: 4 }; e2.caja = 900; e2.precios = { huevo: 2 }; e2.rep = 70;
  const dado = {};
  const c = N.cerrarLocal(p, e2, (k, q) => { dado[k] = (dado[k] || 0) + q; });
  eq(dado, { huevo: 12, tronco: 4 }, 'al desarmar vuelve la mercadería');
  eq([c.plata, E.pesosDe(p)], [900, 8200], 'y la plata de la caja');
  ok(e2.tipo === null && !e2.abierto && !Object.keys(e2.stock).length && !Object.keys(e2.precios).length, 'el estado queda limpio');
  eq(e2.rep, 70, 'y el nombre que te hiciste se queda');
  // los avisos
  const nuevo = N.negocioPropioNuevo(); nuevo.tipo = 'almacen';
  ok(/cerrado/.test(N.avisoDelLocal(nuevo, 'almacen', N.colaNueva(), 10)), 'aviso: cerrado');
  nuevo.abierto = true; ok(/sin mercadería/.test(N.avisoDelLocal(nuevo, 'almacen', N.colaNueva(), 10)), 'aviso: sin mercadería');
  nuevo.stock.huevo = 5; ok(/esperando clientes/.test(N.avisoDelLocal(nuevo, 'almacen', N.colaNueva(), 10)), 'aviso: esperando clientes');
  ok(/no sale nadie/.test(N.avisoDelLocal(nuevo, 'almacen', N.colaNueva(), 23)), 'aviso: de noche no sale nadie');
  nuevo.caja = N.CAJA_MAX; ok(/caja está llena/.test(N.avisoDelLocal(nuevo, 'almacen', N.colaNueva(), 10)), 'aviso: la caja llena');
  const cl = N.colaNueva(); cl.clientes.push({ perfil: 'hachero', pide: [{ k: 'huevo', n: 2 }], listo: true });
  ok(/^Atender: 2 huevos \(hachero\)/.test(N.avisoDelLocal(nuevo, 'almacen', cl, 10)), `aviso: «${N.avisoDelLocal(nuevo, 'almacen', cl, 10)}»`);
  ok(/abrirlo y surtirlo/.test(N.avisoDelLocal(N.negocioPropioNuevo(), 'almacen', N.colaNueva(), 10)), 'aviso: recién armado');
  // la vista del local (lo que se dibuja)
  const v = N.vistaDelLocal({ tipo: 'almacen', abierto: true, stock: { huevo: 1, 'pan-casero': 18, miel: 5, poncho: 6 } });
  eq(v, { abierto: true, p: { huevo: 1, 'pan-casero': 3, miel: 3, poncho: 3 } }, 'la vista: poco, lleno, casi lleno');
  eq(N.pasoDeEstante(0, 'huevo'), 0, 'vacío es 0'); eq(N.pasoDeEstante(9, 'huevo'), 1, '9 de 36 huevos: poco'); eq(N.pasoDeEstante(18, 'huevo'), 2, '18 de 36: medio');
  ok(N.firmaDeVista(v) !== N.firmaDeVista({ ...v, abierto: false }) && N.firmaDeVista(v) === N.firmaDeVista({ p: { ...v.p }, abierto: true }), 'la firma cambia con lo que se ve y no con el orden');
}

// ---------------------------------------------------------------- 10. el guardado
{
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), key: (i) => [...mem.keys()][i] ?? null, get length() { return mem.size; } };
  const G = await import('../src/guardado.js');
  // una partida nueva del Relax trae el campo; la del Desafío, no
  G.usarModoGuardado('relax', 1);
  const nueva = G.progresoNuevo();
  ok(nueva.negocioPropio && nueva.negocioPropio.v === 1 && nueva.negocioPropio.tipo === null && nueva.negocioPropio.rep === N.REP_INICIAL, 'una partida nueva del Relax arranca con el negocio sin abrir');
  G.usarModoGuardado('desafio', 1);
  ok(G.progresoNuevo().negocioPropio === undefined, 'la del Desafío no tiene negocio');
  G.usarModoGuardado('relax', 1);
  // una partida vieja (sin el campo) se carga igual y recibe el estado nuevo, sin tocar lo demás
  ok(G.escribirPartida('relax', 1, { modo: 'relax', dia: 12, horas: 10, obras: [{ plano: 'pila-piedra', x: 1, z: 2, rot: 0, etapas: 1 }], economia: { ...E.economiaNueva(), pesos: 500 } }), 'se guarda una partida de antes del negocio');
  let r = G.leerPartida('relax', 1).progreso;
  eq(r.negocioPropio, N.negocioPropioNuevo(), 'la partida vieja recibe un negocio sin abrir');
  eq(r.economia.pesos, 500, 'y no se toca nada más');
  ok(r.obras.length === 1 && r.obras[0].plano === 'pila-piedra', 'ni las obras');
  // una con negocio abierto vuelve igual
  const est = N.negocioPropioNuevo(); est.tipo = 'panaderia'; est.abierto = true; est.stock = { 'pan-casero': 12, empanadas: 8 }; est.precios = { empanadas: 2, miel: 0, tronco: 2 }; est.rep = 63.4; est.caja = 2400;
  est.hoy = { dia: 12, clientes: 7, atendidos: 6, perdidos: 1, faltas: 2, ventas: 1800, unidades: 14 }; est.total = { clientes: 40, atendidos: 36, perdidos: 4, ventas: 9000, unidades: 80, dias: 5, mejorDia: 2100 };
  G.escribirPartida('relax', 2, { modo: 'relax', dia: 12, horas: 10, economia: E.economiaNueva(), negocioPropio: est });
  r = G.leerPartida('relax', 2).progreso;
  eq(r.negocioPropio, { ...est, precios: { empanadas: 2, miel: 0 } }, 'el negocio vuelve igual (menos el precio de una cosa que la panadería no vende: el tronco)');
  // una partida del Desafío no lo trae aunque venga en el archivo
  G.escribirPartida('desafio', 1, { modo: 'desafio', dia: 3, horas: 10, negocioPropio: est });
  ok(G.leerPartida('desafio', 1).progreso.negocioPropio === undefined, 'el Desafío no tiene negocio aunque el archivo lo traiga');
  // basura
  for (const rota of [null, 7, 'x', [], { tipo: 'inventado', abierto: true, stock: { huevo: 5 } }, { tipo: 'almacen', stock: { huevo: -4, constructor: 9, miel: 'x', 'pan-casero': 1e9 }, rep: 'abc', caja: 1e12, hoy: { dia: -3 }, precios: { huevo: 7, miel: 2 } }]) {
    const s = N.sanearNegocioPropio(rota, 20);
    ok(s.v === 1 && (s.tipo === null || Object.hasOwn(N.TIPOS, s.tipo)), `basura (${JSON.stringify(rota)?.slice(0, 30)}): un estado sano`);
    ok(Number.isFinite(s.rep) && s.rep >= 0 && s.rep <= 100 && s.caja >= 0 && s.caja <= N.CAJA_MAX && s.hoy.dia <= 20, '… con la fama, la caja y el día en su rango');
    ok(Object.entries(s.stock).every(([k, c]) => N.catalogo(s.tipo).includes(k) && c >= 1 && c <= N.topeEstante(k)), '… y el stock dentro del tope y del catálogo');
    ok(Object.values(s.precios).every((v) => v === 0 || v === 2) && !(s.abierto && s.tipo === null), '… los precios sólo 0 o 2 y no abierto sin tipo');
  }
  eq(N.sanearNegocioPropio({ tipo: 'almacen', stock: { 'pan-casero': 1e9 } }, 5).stock, { 'pan-casero': 18 }, 'el stock guardado se recorta al tope');
}

// ---------------------------------------------------------------- 11. el equilibrio: que valga la pena, sin romper la economía
{
  // el mismo jugador que atiende en pocos segundos todos los días, con las reglas de verdad (un día = 30 min reales = 75 s por hora)
  const PRODUCCION = {
    almacen: { bueno: { 'pan-casero': 8, huevo: 12, miel: 3, 'frasco-frutilla': 3, 'calafate-seco': 2, poncho: 1, 'hongos-secos': 2, 'trucha-ahumada': 2, tronco: 6, tabla: 4, piedra: 4, harina: 4, papa: 6, lana: 2 }, chico: { huevo: 6, papa: 4, miel: 2, tronco: 4, 'calafate-seco': 2, 'pan-casero': 3 } },
    panaderia: { bueno: { 'pan-casero': 8, empanadas: 8, miel: 3, 'frasco-frutilla': 3, huevo: 8, harina: 4, 'calafate-seco': 2 }, chico: { 'pan-casero': 4, empanadas: 3, huevo: 4, miel: 2 } },
  };
  const mercado = (k) => N.precioPlaza(k) * (1 - COMERCIO.margen);   // lo que se cobraría sin local
  function jugar(tipo, prod, nivel, dias = 30, atiende = 8) {
    const est = N.negocioPropioNuevo(); est.tipo = tipo; est.abierto = true;
    if (nivel !== 1) for (const k of N.catalogo(tipo)) est.precios[k] = nivel;
    const cola = N.colaNueva(); let ventas = 0, costo = 0, perdidos = 0, clientes = 0;
    for (let d = 1; d <= dias; d++) {
      N.ponerAlDia(est, d);
      for (const [k, c] of Object.entries(PRODUCCION[tipo][prod])) N.surtir(est, k, c, { tengo: () => 1e5, quitar: () => {} });
      for (let h = N.HORA_ABRE; h < N.HORA_CIERRA; h++) for (let s = 0; s < 75; s++) {
        const ev = N.avanzarCola(cola, est, tipo, 1, 1 / 75, { hora: h + s / 75, dia: d, presente: true });
        for (const e of ev) { if (e.tipo === 'llega') clientes++; if (e.tipo === 'se-cansa') perdidos++; }
        for (const c of cola.clientes) if (!c.listo && c.edad >= 8) c.listo = true;
        const c = N.primeroEnLaCola(cola);
        if (c && c.espera >= atiende) { const r = N.despachar(est, c); cola.clientes.splice(cola.clientes.indexOf(c), 1); if (r.ok) { ventas += r.total; for (const v of r.vendidos) costo += mercado(v.k) * v.n; } }
      }
      est.caja = 0;
    }
    return { ventas: ventas / dias, margen: (ventas - costo) / dias, clientes: clientes / dias, perdidos: perdidos / dias, rep: est.rep };
  }
  const JORNAL = 3200;
  const bueno = jugar('almacen', 'bueno', 1), chico = jugar('almacen', 'chico', 1), panBueno = jugar('panaderia', 'bueno', 1);
  ok(bueno.margen >= 700 && bueno.margen <= 0.7 * JORNAL, `almacén bien surtido, precios normales: gana $${Math.round(bueno.margen)}/día sobre venderlo al mercado (entre $700 y el 70 % de los jornales)`);
  ok(panBueno.margen >= 600 && panBueno.margen <= 0.7 * JORNAL, `panadería bien surtida: $${Math.round(panBueno.margen)}/día sobre venderlo al mercado`);
  ok(chico.margen < bueno.margen * 0.55 && chico.margen >= 200, `un surtido chico rinde bastante menos: $${Math.round(chico.margen)} vs $${Math.round(bueno.margen)}/día (valen la pena los edificios de la 4.2)`);
  ok(bueno.clientes >= 4 && bueno.clientes <= 12, `unos ${bueno.clientes.toFixed(1)} clientes por día (de 4 a 12)`);
  ok(bueno.perdidos < 0.3, 'atendiendo en 8 s no se pierde casi nadie');
  const lento = jugar('almacen', 'bueno', 1, 30, 50);
  ok(lento.margen < bueno.margen && lento.perdidos > bueno.perdidos, `atender lento (50 s) rinde menos y pierde clientes ($${Math.round(lento.margen)}/día)`);
  const baratos = jugar('almacen', 'bueno', 0), caros = jugar('almacen', 'bueno', 2);
  ok(baratos.clientes > bueno.clientes && bueno.clientes > caros.clientes, `precios: barato ${baratos.clientes.toFixed(1)} > normal ${bueno.clientes.toFixed(1)} > caro ${caros.clientes.toFixed(1)} clientes por día`);
  ok(baratos.margen < bueno.margen, 'y vender barato gana menos por día que el precio normal (pero te hace fama más rápido)');
  ok(baratos.rep >= bueno.rep - 5 && caros.rep < bueno.rep, `la fama: barato ${baratos.rep.toFixed(0)}, normal ${bueno.rep.toFixed(0)}, caro ${caros.rep.toFixed(0)}`);
  ok(baratos.ventas <= 2.2 * JORNAL + 8000 && bueno.ventas < 3 * JORNAL + 4000, `lo que se factura ($${Math.round(bueno.ventas)}/día) viene de mercadería que ya produjiste (no de la nada)`);
  // el precio del local y el de los edificios de oficio de la 4.2: el local no los hace obsoletos
  const diasParaPagarse = (pesos, margen) => pesos / margen;
  ok(diasParaPagarse(28000, bueno.margen) >= 12, `el almacén se paga en ${diasParaPagarse(28000, bueno.margen).toFixed(0)} días (al menos un año del juego, 12 días)`);
  ok(diasParaPagarse(36000, panBueno.margen) >= 12, `la panadería, en ${diasParaPagarse(36000, panBueno.margen).toFixed(0)} días`);
  // y frente a la tienda de campo (que vende por vos sin que estés, con 4 % de comisión): atender vos paga más por lote, pero te cuesta el tiempo
  const tienda = (k) => R.precioDeConsigna(k) / BIENES[k].lote;
  ok(['pan-casero', 'miel', 'poncho', 'empanadas', 'frasco-frutilla'].every((k) => N.precioUnidad(k, 1) > tienda(k) && N.precioUnidad(k, 1) <= 1.45 * N.precioPlaza(k)), 'el local paga mejor que la consigna sin pasarse de la plaza');
}

// ---------------------------------------------------------------- 12. main.js, construccion.js, guardado.js y la plantilla usan todo esto
{
  const m = leer('src/main.js'), c = leer('src/construccion.js'), g = leer('src/guardado.js'), pl = leer('src/plantilla.html'), j = leer('src/negocio-propio-juego.js');
  const tiene = (t, msg) => ok(m.includes(t), msg);
  tiene("import { crearNegocioJuego } from './negocio-propio-juego.js';", 'main.js trae el juego del negocio');
  tiene('negocioJuego = crearNegocioJuego({', 'y lo arma (aislado en un try)');
  tiene("fallaSistema('negocio-propio-armado', e); negocioJuego = null;", 'si falla al armarse, el resto sigue');
  tiene('OBRAS_QUE_TRABAJAN.push(...(negocioJuego?.ids || []));', 'los dos locales entran en las obras que trabajan (aviso y E con la misma prioridad)');
  tiene('if (negocioJuego?.esLocal(o.plano.id)) return negocioJuego.aviso(o);', 'el aviso');
  tiene('if (negocioJuego?.esLocal(o.plano.id)) { negocioJuego.usar(o); refrescarBarra(true); return; }', 'y la tecla E');
  tiene('if (o && negocioJuego?.esLocal(o.plano.id)) { negocioJuego.usar(o, true); break; }', 'Mayús + E abre el panel aunque haya un cliente');
  tiene('if (negocioJuego?.panelAbierto()) { negocioJuego.cerrarPanel(); break; }', 'E cierra el panel');
  tiene('else if (negocioJuego?.panelAbierto()) negocioJuego.cerrarPanel();', 'Escape también');
  tiene('|| !!negocioJuego?.panelAbierto() || !!fiestasJuego?.panelAbierto() || !!cantinaJuego?.panelAbierto() || !!teJuego?.panelAbierto();', 'el panel cuenta como un panel del HUD (no se camina, no hay aviso)');
  tiene('if (negocioJuego?.panelAbierto()) { aviso = null; marcarHud(); }', 'con el panel abierto no hay aviso');
  tiene('if (vecino?.clienteNegocio) vecino = null;', 'los clientes de tu local no se charlan: E sobre el mostrador los atiende');
  tiene('acumuladoVecino = 0; vecino = gente.cerca(js, camara);', 'y la búsqueda del vecino de siempre queda como estaba');
  tiene("try { if (modo === 'jugando' && !desafio && !foto.activo) negocioJuego?.actualizar(dt); } catch (e) { fallaSistema('negocio-propio', e); }", 'el bucle lo avanza aislado con fallaSistema');
  tiene("negocioJuego.alDesarmar(d);", 'al desarmar el local la mercadería y la caja vuelven a vos');
  ok(m.indexOf('negocioJuego.alDesarmar(d)') < m.indexOf('almacenJuego.devolver(d)'), '… (antes de lo demás, por la misma puerta que todos los desarmados)');
  ok(c.includes("import { PIEZAS_NEGOCIO } from './planos-negocio.js';") && c.includes('PIEZAS.push(...PIEZAS_NEGOCIO);'), 'construccion.js suma los dos locales con una línea');
  ok(g.includes("import { negocioPropioNuevo, sanearNegocioPropio } from './negocio-propio.js';") && g.includes('limpio.negocioPropio = sanearNegocioPropio(p.negocioPropio, limpio.dia);') && g.includes('negocioPropio: negocioPropioNuevo()'), 'guardado.js: el campo nuevo, con valor por defecto y saneado');
  ok(g.includes('limpio.negocioPropio = undefined;'), '… y en el Desafío no existe');
  ok(pl.includes('id="negocio-panel"') && pl.includes('id="negocio-contenido"') && pl.includes('.panel-negocio'), 'la plantilla trae el panel y su estilo');
  ok(!/Math\.random/.test(leer('src/negocio-propio.js')), 'las reglas no usan azar suelto (todo sale de la cuenta: pruebas y simulador dan lo mismo)');
  ok(!/escuela/.test(j) && !/gamepad|bmandob/i.test(j), 'sin mando ni nada heredado');
  // (el armado de un solo archivo sólo conoce el primer nombre de «export const A = 1, B = 2;»: una declaración por constante)
  for (const f of ['src/negocio-propio.js', 'src/negocio-propio-juego.js', 'src/planos-negocio.js']) ok(!/^export const [A-Za-z_]+ = [0-9]+, [A-Za-z_]+ =/m.test(leer(f)), `${f}: una constante exportada por declaración`);
  // nada por cuadro: el juego del negocio trabaja cada 0,25 s y sin geometría ni luces nuevas
  ok(/const PASO = 0\.25;/.test(j) && /if \(acum < PASO\) return;/.test(j) && !/new THREE\.|PointLight|SpotLight/.test(j), 'trabaja cada 0,25 s, sin geometría ni luces propias');
  ok(/armarPobladorDeAPoco/.test(j) && /ctx\.msFigura/.test(j), 'las figuras se arman de a poco, con el planificador antitirones');
  ok(/dormido = true/.test(j) && /sinFrenar = true/.test(j), 'las figuras sin uso están dormidas y no se frenan al pasar a tu lado');
}

console.log(`verificar-4-3-negocio: ${n} comprobaciones OK`);

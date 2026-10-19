// 4.2: los edificios de oficio propios (planos-oficios.js, oficios-propios.js), en Node:
//   · las ocho piezas: existen, cuestan lo que dice la escala ($15.000 a $60.000), ids únicos, materiales que existen, geometría sana y dentro de un presupuesto de triángulos, física sana;
//   · los talleres que producen (panadería, telar grande, cervecería, quesería, cantería): cargar, esperar, retirar, el tope de tandas (volver a las semanas no rompe nada), el oficio y la tienda;
//   · la herrería (afilar, templar, el golpe de más), la carpintería (más madera de sobra), la tienda de campo (vender por días, la caja, el tope) y la cerveza más barata en la cantina;
//   · que valgan la pena pero no regalen (días en recuperar el precio), el guardado de la partida y el cableado de main.js.
import assert from 'assert/strict';
import fs from 'fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const { PLANO, PLANOS } = await import('../src/construccion.js');
const { Constructor } = await import('../src/geometria.js');
const O = await import('../src/obra-pesos.js');
const OP = await import('../src/oficios-propios.js');
const { PIEZAS_OFICIOS, OFICIOS_PROPIOS_QUE_SE_USAN } = await import('../src/planos-oficios.js');
const { BIENES } = await import('../src/comercio.js');
const { economiaNueva, pesosDe, formatoPesos } = await import('../src/economia.js');
const { ahorroDeObra } = await import('../src/oficios.js');
const { SERVICIO } = await import('../src/aldea.js');
const C = await import('../src/cantina.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };

const PRECIOS = { 'herreria-propia': 32000, carpinteria: 22000, 'panaderia-horno': 27000, cerveceria: 42000, 'telar-grande': 36000, queseria: 24000, 'tienda-campo': 30000, canteria: 18000 };
const IDS = Object.keys(PRECIOS);
const MATERIALES = new Set(['tabla', 'tronco', 'piedra', 'lana']);

// ---------------------------------------------------------------- 1. las ocho piezas
eq(PIEZAS_OFICIOS.map((p) => p.id).sort(), [...IDS].sort(), 'las ocho del bloque');
eq(OP.IDS_OFICIOS_PROPIOS.slice().sort(), [...IDS].sort(), 'oficios-propios.js conoce las mismas ocho');
eq(Object.keys(OFICIOS_PROPIOS_QUE_SE_USAN).sort(), [...IDS].sort(), 'y todas se usan con E');
eq(new Set(PLANOS.map((p) => p.id)).size, PLANOS.length, 'ningún id de plano repetido en todo el catálogo');
ok(IDS.every((id) => PLANOS.filter((p) => p.id === id).length === 1), 'y las ocho una sola vez');
for (const id of IDS) {
  const P = PLANO[id];
  ok(P && P.pieza === true && P.etapas.length === 1 && P.etapas[0].termina, `${id}: está en el catálogo, una etapa`);
  ok(P.soloRelax === true && !P.soloDesafio, `${id}: sólo en el Relax`);
  ok(P.categoria === 'trabajo', `${id}: en Trabajo (categoría que ya existía)`);
  ok(Object.entries(P.pide).every(([k, c]) => MATERIALES.has(k) && Number.isInteger(c) && c > 0), `${id}: materiales que existen`);
  ok(P.nombre && P.texto && P.texto.length > 120 && P.radio > 0 && P.separacion > 0, `${id}: nombre, texto y medidas`);
  ok(!/\b(the|and|with|workshop)\b/i.test(P.texto + P.nombre), `${id}: todo en castellano`);
  eq(P.etapas[0].pesos, PRECIOS[id], `${id}: la etapa declara ${formatoPesos(PRECIOS[id])}`);
  eq(O.precioDeEtapa(id, 0), PRECIOS[id], `${id}: el registro tiene su precio`);
  ok(PRECIOS[id] % 500 === 0 && PRECIOS[id] >= 15000 && PRECIOS[id] <= 60000, `${id}: dentro de la escala de los edificios de oficio ($15.000 a $60.000) y redondo`);
  ok(PRECIOS[id] <= 80000 && PRECIOS[id] < 110000, `${id}: menos que la casona`);
  ok(!P.funciones?.includes('luz') && !P.luzInterior, `${id}: sin luces dinámicas`);
  // la geometría: sin números rotos, sólo tipo 0 y 4, dentro de lo que dice medir, con presupuesto de triángulos
  for (const suelo of [null, (x, z) => 0.2 + 0.1 * x]) {
    const c = new Constructor(); P.etapas[0].arma(c, P, {}, suelo);
    ok(c.pos.length > 0 && c.pos.every(Number.isFinite) && c.col.every(Number.isFinite), `${id}: dibuja sin números rotos`);
    ok(c.tipo.every((t) => t === 0 || t === 4), `${id}: sólo tipo 0 y 4`);
  }
  const c = new Constructor(); P.etapas[0].arma(c, P, {}, null);
  const tris = c.pos.length / 9;
  ok(tris <= 1000 && tris >= 300, `${id}: ${Math.round(tris)} triángulos (tope 1000; la mediana del juego es ~250)`);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let k = 0; k < c.pos.length; k += 3) { x0 = Math.min(x0, c.pos[k]); x1 = Math.max(x1, c.pos[k]); y0 = Math.min(y0, c.pos[k + 1]); y1 = Math.max(y1, c.pos[k + 1]); z0 = Math.min(z0, c.pos[k + 2]); z1 = Math.max(z1, c.pos[k + 2]); }
  ok(y0 >= -0.16, `${id}: no se hunde (${y0.toFixed(2)})`);
  ok(y1 <= P.alto + 0.05 && y1 >= P.alto * 0.7, `${id}: entra en su alto (${y1.toFixed(2)} de ${P.alto.toFixed(2)})`);
  ok(Math.max(Math.abs(x0), Math.abs(x1)) <= P.ancho / 2 + 0.05, `${id}: entra en su ancho`);
  ok(Math.max(Math.abs(z0), Math.abs(z1)) <= P.fondo / 2 + 0.05, `${id}: entra en su fondo`);
  ok(P.ancho <= 4.6 && P.fondo <= 4.0, `${id}: no es una mole (${P.ancho.toFixed(1)} × ${P.fondo.toFixed(1)} m)`);
  // la física: el fondo y lo grande, en coordenadas locales; se entra por el frente (-z)
  const reg = { s: [], c: [], p: [] };
  P.fisica({ segmento: (...a) => reg.s.push(a), circulo: (...a) => reg.c.push(a), plataforma: (...a) => reg.p.push(a) });
  // el piso: una plataforma a ras del suelo (limpia el pasto de adentro y se camina) del tamaño de la platea
  ok(reg.p.length === 1 && reg.p[0].every(Number.isFinite) && reg.p[0][0] === 0 && reg.p[0][1] === 0 && reg.p[0][4] > 0 && reg.p[0][4] <= 0.3 && reg.p[0][2] <= P.ancho - 0.4 && reg.p[0][3] <= P.fondo - 0.6 && reg.p[0][2] >= 3 && reg.p[0][3] >= 3, `${id}: el piso es una plataforma baja del tamaño de la platea (${reg.p[0]?.slice(2, 5)})`);
  ok(reg.s.length >= 1, `${id}: choca con el fondo`);
  for (const s of reg.s) ok(s.length === 7 && s.every(Number.isFinite) && s[4] > 0 && s[5] < s[6] && s[6] <= P.alto + 0.1 && Math.abs(s[0]) <= P.ancho / 2 && Math.abs(s[2]) <= P.ancho / 2 && Math.abs(s[1]) <= P.fondo / 2 && Math.abs(s[3]) <= P.fondo / 2, `${id}: segmento sano`);
  for (const q of reg.c) ok(q.length === 5 && q.every(Number.isFinite) && q[2] > 0 && q[3] < q[4] && q[4] <= P.alto + 0.1 && Math.abs(q[0]) + q[2] <= P.ancho / 2 && Math.abs(q[1]) + q[2] <= P.fondo / 2, `${id}: círculo sano`);
  ok(!reg.s.some((s) => s[1] < 0 && s[3] < 0 && Math.abs(s[0] - s[2]) > P.ancho * 0.6), `${id}: el frente queda abierto`);
}
ok(Math.max(...Object.values(PRECIOS)) < 60001 && Math.min(...Object.values(PRECIOS)) >= 15000, 'toda la tanda entre $15.000 y $60.000');
ok(PRECIOS.cerveceria > PRECIOS['telar-grande'] && PRECIOS['telar-grande'] > PRECIOS['herreria-propia'] && PRECIOS.canteria === Math.min(...Object.values(PRECIOS)), 'el más barato es la cantería (rinde sin gastar nada) y el más caro la cervecería (la que más rinde)');

// ---------------------------------------------------------------- 2. los talleres que producen
const mundo = (inv, niveles = {}, tienda = false) => ({
  tengo: (e) => inv[e.k] || 0,
  quitar: (e, c) => { assert.ok((inv[e.k] || 0) >= c, `quitó de más ${e.k}`); inv[e.k] -= c; },
  nivel: (of) => niveles[of] || 0,
  tienda,
});
const AHORA = 24 * 10 + 8;   // día 10, ocho de la mañana
{
  eq(OP.IDS_TALLERES.sort(), ['canteria', 'cerveceria', 'panaderia-horno', 'queseria', 'telar-grande'], 'los cinco talleres');
  for (const id of OP.IDS_TALLERES) {
    const def = OP.TALLERES[id];
    ok(def.horas === 24 && def.tope >= 3 && def.tope <= 4, `${id}: una tanda por día y un tope chico (${def.tope})`);
    ok(def.entrada.every((e) => BIENES[e.k] || e.k === 'leche' || e.k === 'lana' || e.k === 'tronco'), `${id}: lo que pide existe`);
    ok(def.salida.k ? !!BIENES[def.salida.k] : def.salida.pesos > 0, `${id}: lo que da es un bien que ya existe o pesos`);
    ok(def.carga && def.cargo && def.retira && def.vacio && def.info, `${id}: tiene sus textos`);
  }
  // la panadería, de punta a punta
  const def = OP.TALLERES['panaderia-horno'];
  const inv = { harina: 20, tronco: 5 };
  const t = OP.sanearTaller({}, def.tope);
  eq(OP.avisoTaller(t, def, AHORA, mundo(inv)), 'Amasar y encender el horno grande', 'vacío y con todo: ofrece cargar');
  let r = OP.usarTaller(t, def, AHORA, mundo(inv));
  eq([r.cargo, t.n, inv.harina, inv.tronco], [3, 3, 8, 2], 'carga tres tandas (el tope) y gasta 12 de harina y 3 troncos');
  eq(r.retiro, null, 'todavía no hay nada para retirar');
  ok(/en marcha/.test(OP.avisoTaller(t, def, AHORA + 3, mundo(inv))) && /faltan unas 21 horas/.test(OP.avisoTaller(t, def, AHORA + 3, mundo(inv))), 'a las 3 horas: en marcha y faltan 21');
  eq(OP.listos(t, def, AHORA + 23.9), 0, 'a las 23,9 horas todavía no');
  eq(OP.listos(t, def, AHORA + 24), 1, 'al día, una');
  eq(OP.listos(t, def, AHORA + 49), 2, 'a los dos días, dos');
  eq(OP.avisoTaller(t, def, AHORA + 25, mundo(inv)), 'Retirar 8 panes caseros y volver a cargar', 'el aviso dice lo que hay y que se puede volver a cargar (queda harina)');
  eq(OP.avisoTaller(t, def, AHORA + 25, mundo({})), 'Retirar 8 panes caseros', 'y sin harina no ofrece cargar');
  // el que se va un mes: no se acumula más que el tope
  eq(OP.listos(t, def, AHORA + 24 * 30), 3, 'un mes después: tres tandas, no treinta');
  r = OP.usarTaller(t, def, AHORA + 24 * 30, mundo(inv));
  eq(r.retiro, { k: 'pan-casero', donde: 'entrada', n: 24, una: 'pan casero', varias: 'panes caseros', bono: false }, 'retira 24 panes');
  eq([t.n, r.cargo, inv.harina, inv.tronco], [2, 2, 0, 0], 'y vuelve a cargar con lo que alcanza (2 tandas: le queda 0 de harina y 0 troncos)');
  ok(t.desde === AHORA + 24 * 30, 'el reloj arranca desde ahora, no desde hace un mes');
  const m = OP.mensajeTaller(r, def, t);
  ok(m.titulo === '24 panes caseros' && /Sacaste del horno: 24 panes caseros/.test(m.detalle) && /Para otra tanda faltan 4 medidas de harina y 1 tronco/.test(m.detalle), `el mensaje: ${m.titulo} / ${m.detalle}`);
  // sin nada para cargar
  const t2 = OP.sanearTaller({}, 3), inv2 = { harina: 1 };
  r = OP.usarTaller(t2, def, AHORA, mundo(inv2));
  eq([r.cargo, t2.n, inv2.harina, r.falta], [0, 0, 1, ['3 medidas de harina', '1 tronco']], 'sin insumos no carga y dice qué falta');
  ok(/Faltan 3 medidas de harina y 1 tronco/.test(OP.mensajeTaller(r, def, t2).detalle) && OP.avisoTaller(t2, def, AHORA, mundo(inv2)) === 'Panadería de horno grande: faltan 3 medidas de harina y 1 tronco', 'y lo dice en el mensaje y en el aviso');
  // una tanda de a una: la que se alcanza a cargar
  const inv3 = { harina: 4, tronco: 1 };
  const t3 = OP.sanearTaller({}, 3);
  eq([OP.usarTaller(t3, def, AHORA, mundo(inv3)).cargo, t3.n], [1, 1], 'con harina para una, una tanda');
  eq(OP.usarTaller(t3, def, AHORA + 24, mundo({ harina: 0, tronco: 0 })).retiro.n, 8, 'y al día, sus 8 panes');
  // el oficio: un pan más por tanda desde huertero 3
  eq(OP.porTanda(def, mundo({}, { huertero: 2 })).n, 8, 'huertero 2: 8 panes');
  eq(OP.porTanda(def, mundo({}, { huertero: 3 })).n, 9, 'huertero 3: 9 panes');
  eq(OP.porTanda(def, mundo({}, { huertero: 5 })).n, 9, 'huertero 5: 9 (no se acumula de más)');
  // el telar grande: 5 vellones son 2 ponchos, más eficiente que a mano (3 por poncho)
  const tg = OP.TALLERES['telar-grande'], invT = { lana: 12 }, tT = OP.sanearTaller({}, 3);
  OP.usarTaller(tT, tg, AHORA, mundo(invT));
  eq([tT.n, invT.lana], [2, 2], 'con 12 vellones, dos tandas y sobran 2');
  const rT = OP.usarTaller(tT, tg, AHORA + 48, mundo(invT));
  eq([rT.retiro.k, rT.retiro.donde, rT.retiro.n], ['poncho', 'cosa', 4], 'a los dos días, 4 ponchos');
  ok(tg.entrada[0].n / tg.salida.n < 3, 'el telar grande gasta menos lana por poncho que a mano (2,5 contra 3)');
  // la cervecería: paga en pesos al retirar (Lucrecia), con el oficio de huertero mejor
  const ce = OP.TALLERES.cerveceria;
  const pb = OP.porTanda(ce, mundo({}, { huertero: 0 })), pm = OP.porTanda(ce, mundo({}, { huertero: 3 }));
  eq([pb.pesos, pm.pesos, pb.con], [1300, 1500, 'Lucrecia, de la cantina'], 'un barril: $1.300, $1.500 con huertero 3');
  const invC = { harina: 6, tronco: 2 }, tC = OP.sanearTaller({}, 3);
  OP.usarTaller(tC, ce, AHORA, mundo(invC));
  const rC = OP.usarTaller(tC, ce, AHORA + 72, mundo(invC));
  eq([rC.retiro.pesos, rC.retiro.n, rC.lotes], [2600, 2, 2], 'dos barriles: $2.600');
  ok(/Despachaste a la cantina: 2 barriles de cerveza, \$2\.600 de Lucrecia/.test(OP.mensajeTaller(rC, ce, tC).detalle), 'el mensaje de la cervecería');
  // la quesería: Ercilia compra; con tienda de campo, un cuarto más
  const qs = OP.TALLERES.queseria;
  eq([OP.porTanda(qs, mundo({})).pesos, OP.porTanda(qs, mundo({}, {}, true)).pesos, OP.porTanda(qs, mundo({}, {}, true)).conTienda], [1100, 1400, true], 'queso: $1.100 al almacén, $1.400 con tu tienda');
  ok(OP.porTanda(OP.TALLERES.cerveceria, mundo({}, {}, true)).pesos === 1300, 'la tienda no cambia la cerveza');
  // la cantería no gasta nada y rinde con el oficio
  const ca = OP.TALLERES.canteria, tK = OP.sanearTaller({}, ca.tope);
  const rK = OP.usarTaller(tK, ca, AHORA, mundo({}));
  eq([rK.cargo, tK.n, ca.entrada.length], [4, 4, 0], 'se pone a trabajar de una (cuatro tandas), sin gastar nada');
  eq([OP.porTanda(ca, mundo({}, { picapedrero: 0 })).n, OP.porTanda(ca, mundo({}, { picapedrero: 3 })).n, OP.porTanda(ca, mundo({}, { picapedrero: 5 })).n], [3, 4, 5], 'piedra: 3, 4 y 5 por tanda según el picapedrero');
  eq(OP.usarTaller(tK, ca, AHORA + 24 * 90, mundo({}, { picapedrero: 5 })).retiro.n, 20, 'vuelve a los tres meses: 4 tandas de 5 = 20 piedras, nada más');
  // basura en el estado
  eq(OP.sanearTaller(null, 3), { n: 0, desde: 0 }, 'sin estado: vacío');
  eq(OP.sanearTaller({ n: 99, desde: 'x' }, 3), { n: 3, desde: 0 }, 'con basura: dentro del tope');
  eq(OP.sanearTaller({ n: -4, desde: -5 }, 3), { n: 0, desde: 0 }, 'sin negativos');
  eq(OP.listos({ n: 2, desde: 500 }, def, 100), 0, 'si el reloj quedó atrás, no hay nada listo (y no da negativos)');
  for (const id of OP.IDS_TALLERES) {
    const d = OP.TALLERES[id], tt = OP.sanearTaller({}, d.tope);
    const textos = [OP.avisoTaller(tt, d, AHORA, mundo({ lana: 9, harina: 9, tronco: 9, leche: 99 })), OP.avisoTaller(tt, d, AHORA, mundo({})), OP.textoEntrada(d)];
    const rr = OP.usarTaller(tt, d, AHORA, mundo({ lana: 9, harina: 9, tronco: 9, leche: 99 }));
    textos.push(OP.mensajeTaller(rr, d, tt).titulo, OP.mensajeTaller(rr, d, tt).detalle, OP.mensajeTaller(OP.usarTaller(tt, d, AHORA + 100, mundo({})), d, tt).detalle);
    ok(textos.every((x) => typeof x === 'string' && x.length >= 4 && !/undefined|NaN|\[object/.test(x)), `${id}: los textos salen enteros`);
  }
}

// ---------------------------------------------------------------- 3. que valgan la pena, pero no regalen
{
  const unidad = (k) => (k === 'leche' ? 0 : Math.round((BIENES[k].valor * 100) / BIENES[k].lote));   // la leche no tiene mercado: vale lo que la hace el queso
  const valorTanda = (def) => (def.salida.pesos ? def.salida.pesos : unidad(def.salida.k) * def.salida.n);
  const costoTanda = (def) => def.entrada.reduce((s, e) => s + (e.k === 'leche' ? 0 : unidad(e.k) * e.n), 0);
  // cuántas tandas por día alcanza a cargar un jugador con lo que el juego le da: la majada (8 ovejas × 2 vellones cada 6 días) son ~2,7 vellones por día
  // (0,55 tandas del telar) y una vaca da 4 litros por día (0,5 tandas de la quesería); los demás, con insumos de sobra, una por día
  const RITMO = { 'telar-grande': 0.55, queseria: 0.5 };
  const neto = {};
  for (const id of OP.IDS_TALLERES) {
    const def = OP.TALLERES[id];
    neto[id] = Math.round((valorTanda(def) - costoTanda(def)) * (RITMO[id] || 1));
    const dias = PRECIOS[id] / neto[id];
    ok(neto[id] > 0 && dias >= 15 && dias <= 120, `${id}: rinde $${neto[id]} netos por día y el precio se recupera en ${Math.round(dias)} días (entre 15 y 120)`);
    ok(valorTanda(def) > costoTanda(def), `${id}: transformar vale más que vender la materia prima`);
  }
  // un año del juego son 12 días: nada se paga solo en un año (salvo con mucha constancia) y ninguno rinde más que el jornal de un día
  ok(Object.values(neto).every((v) => v < 3200), 'ninguno rinde por día más que el ingreso de un jugador goloso ($3.200)');
  const todos = Object.values(neto).reduce((s, v) => s + v, 0), costoTodos = IDS.reduce((s, id) => s + PRECIOS[id], 0);
  ok(costoTodos > 200000, `armar los ocho cuesta ${formatoPesos(costoTodos)}: un destino para años de plata`);
  console.log(`  (netos por día: ${JSON.stringify(neto)}; suma ${todos})`);
}

// ---------------------------------------------------------------- 4. la herrería propia
{
  ok(OP.FILO_TOPE === SERVICIO.filo, 'afilar da los mismos usos que el herrero de la aldea');
  const aldea = { afilado: 3 };
  let pagos = 0;
  const env = { tengoMaterial: () => 99, pesos: () => 99999, puedeTemplar: () => true, pagarTemple: () => { pagos++; } };
  const h = OP.sanearHerreria({});
  eq(h, { templado: false }, 'sin templar');
  eq(OP.avisoHerreria(h, aldea, env), 'Afilar el hacha y el pico en tu forja', 'con el filo gastado: afilar');
  eq(OP.usarHerreria(h, aldea, env), { accion: 'afilar', usos: 10 }, 'afila');
  eq(aldea.afilado, 10, 'el filo vuelve a 10');
  eq(OP.avisoHerreria(h, aldea, env), 'Templar el hacha y el pico (una sola vez)', 'con el filo al día: templar');
  eq(OP.avisoHerreria(h, aldea, { ...env, puedeTemplar: () => false }), 'Tu forja: templar pide piedra, troncos y plata', 'sin lo necesario: lo avisa');
  eq(OP.usarHerreria(h, aldea, { ...env, tengoMaterial: (k) => (k === 'piedra' ? 4 : 99), pesos: () => 1000 }), { accion: 'falta', falta: ['2 piedras', '$1.500'] }, 'sin piedra ni plata: qué falta');
  ok(pagos === 0 && !h.templado, 'y no cobró nada');
  eq(OP.usarHerreria(h, aldea, { ...env, tengoMaterial: (k) => (k === 'tronco' ? 1 : 99) }), { accion: 'falta', falta: ['1 tronco'] }, 'un tronco: singular');
  eq(OP.usarHerreria(h, aldea, env), { accion: 'templar' }, 'templa');
  ok(h.templado === true && pagos === 1, 'queda templado y se pagó una vez');
  eq(OP.usarHerreria(h, aldea, env), { accion: 'al-dia' }, 'y después, al día');
  eq(OP.avisoHerreria(h, aldea, env), 'Tu forja: el filo está al día', 'el aviso lo dice');
  aldea.afilado = 0;
  eq(OP.usarHerreria(h, aldea, env), { accion: 'afilar', usos: 10 }, 'templada y con el filo gastado: afila de nuevo (gratis)');
  eq(OP.usarHerreria(h, null, env), { accion: 'sin-aldea' }, 'sin libreta de aldea no se rompe');
  eq(OP.sanearHerreria({ templado: 'si' }), { templado: false }, 'sólo un verdadero templa');
  eq(OP.TEMPLE, { piedra: 6, tronco: 2, pesos: 2500, golpesMenos: 2 }, 'lo que pide el temple');
  // el golpe de más
  eq([6, 5, 4, 3, 2, 1].map((g) => OP.golpesConFiloTemplado(g, 10, false)), [5, 4, 3, 2, 1, 1], 'con filo: uno menos (como el herrero de la aldea)');
  eq([6, 5, 4, 3, 2, 1].map((g) => OP.golpesConFiloTemplado(g, 10, true)), [4, 3, 2, 1, 1, 1], 'templado: dos menos, nunca menos de uno');
  eq(OP.golpesConFiloTemplado(6, 0, true), 6, 'sin filo, los golpes de la tabla (aunque esté templado)');
  const A = await import('../src/aldea.js');
  eq([6, 5, 4, 3].map((g) => A.golpesConFilo(g, { afilado: 4 })), [5, 4, 3, 2], 'y el del herrero de la aldea sigue como antes');
}

// ---------------------------------------------------------------- 5. la carpintería: más madera de sobra
{
  eq([OP.extraMadera(0), OP.extraMadera(2), OP.extraMadera(3), OP.extraMadera(5)], [0.1, 0.1, 0.15, 0.15], 'el extra: 10 %, y 15 % con hachero 3');
  const pide = { tabla: 20, tronco: 10, piedra: 20 };
  const sin = ahorroDeObra(pide, 0, {}), con = ahorroDeObra(pide, 0, {}, 0.1);
  eq(sin.devuelve, {}, 'sin oficio y sin carpintería no sobra nada (como antes)');
  eq(con.devuelve, { tabla: 2, tronco: 1 }, 'con carpintería: 2 de 20 tablas y 1 de 10 troncos (la piedra no)');
  const sumado = ahorroDeObra(pide, 3, {}, 0.1);   // constructor 3 (15 %) + 10 %
  eq(sumado.devuelve, { tabla: 5, tronco: 2, piedra: 3 }, 'se suma al oficio de constructor sólo en la madera (25 % de 20 y de 10; la piedra, 15 %)');
  eq(ahorroDeObra(pide, 3, {}), { devuelve: { tabla: 3, tronco: 1, piedra: 3 }, resto: { tabla: 0, tronco: 0.5, piedra: 0 } }, 'y sin carpintería es lo de siempre');
  // el resto se arrastra y nunca sobra todo
  let resto = {}, juntado = 0;
  for (let i = 0; i < 10; i++) { const a = ahorroDeObra({ tabla: 3 }, 0, resto, 0.1); resto = a.resto; juntado += a.devuelve.tabla || 0; }
  eq(juntado, 3, 'en diez etapas de 3 tablas sobran 3 (el 10 % arrastrado)');
  ok((ahorroDeObra({ tabla: 1 }, 5, {}, 0.5).devuelve.tabla || 0) === 0, 'de una sola tabla nunca sobra');
  eq(ahorroDeObra(pide, 0, {}, 'basura').devuelve, {}, 'un extra roto no suma');
  ok(/10 %/.test(OP.textoCarpinteria(1)) && /15 %/.test(OP.textoCarpinteria(3)), 'el texto dice el porcentaje que corresponde');
}

// ---------------------------------------------------------------- 6. la tienda de campo
{
  const p = { dia: 10, modo: 'relax', economia: { ...economiaNueva(), pesos: 0 }, materiales: {}, cosas: { poncho: 2 }, entradas: { 'pan-casero': { cantidad: 7 }, miel: { cantidad: 3 }, huevo: { cantidad: 12 } } };
  const t = OP.sanearTienda({}, 10);
  eq(t, { stock: {}, caja: 0, dia: 10 }, 'tienda vacía');
  ok(/sin mercadería/.test(OP.avisoTienda(t, { cosas: {}, entradas: {}, materiales: {} })), 'sin nada: lo dice');
  eq(OP.avisoTienda(t, p), 'Tu tienda: dejar la mercadería a la venta', 'con mercadería en la mochila: ofrece dejarla');
  eq(OP.venderDias(t, 10), 0, 'el mismo día no vende');
  const dejado = OP.dejarEnTienda(p, t);
  eq(dejado, [{ k: 'poncho', lotes: 2 }, { k: 'pan-casero', lotes: 2 }, { k: 'miel', lotes: 3 }], 'deja ponchos, pan (por lotes de 3: 6 de 7) y miel; los huevos no se tocan');
  eq([p.cosas.poncho, p.entradas['pan-casero'].cantidad, p.entradas.miel.cantidad, p.entradas.huevo.cantidad], [0, 1, 0, 12], 'y se descuenta de la mochila');
  eq(OP.lotesEnTienda(t), 7, 'siete lotes a la venta');
  eq(OP.dejarEnTienda(p, t), [], 'dejar de nuevo con nada que dejar: nada');
  // los precios: la plaza menos una comisión chica (4 % en vez de 10 %)
  const pu = await import('../src/propiedad.js');
  for (const k of OP.TIENDA.mercaderia) ok(OP.precioEnTienda(k) > pu.precioDeConsigna(k) && OP.precioEnTienda(k) <= BIENES[k].valor * 100, `${k}: ${formatoPesos(OP.precioEnTienda(k))} el lote: más que la consigna de la feria, nunca más que el valor`);
  // vende por día: hasta 4 lotes, lo más caro primero
  const caja0 = t.caja;
  eq(OP.venderDias(t, 11), 4, 'al día siguiente vende 4 lotes');
  ok(t.caja - caja0 === OP.precioEnTienda('poncho') * 2 + OP.precioEnTienda('miel') * 2, 'los dos ponchos primero (lo más caro) y después la miel');
  eq(OP.lotesEnTienda(t), 3, 'quedan 3');
  eq(OP.venderDias(t, 11), 0, 'el mismo día no vende dos veces');
  eq(OP.venderDias(t, 40), 3, 'a las semanas vende lo que quedaba y no más');
  eq(OP.venderDias(t, 40 + 100), 0, 'sin mercadería no hay ventas (ni errores)');
  // la caja
  ok(t.caja > 0, 'queda plata en la caja');
  const enCaja = t.caja;
  eq(OP.retirarCajaTienda(p, t), enCaja, 'se retira toda');
  eq([pesosDe(p), t.caja], [enCaja, 0], 'va a la billetera');
  const l = p.economia.libro.at(-1);
  eq([l.monto, l.motivo, l.con], [enCaja, 'Ventas de tu tienda de campo', 'Tu tienda'], 'y queda en el libro');
  eq(OP.retirarCajaTienda(p, t), 0, 'la caja vacía no retira nada');
  // el tope por cosa, la basura y el límite de días
  const p2 = { dia: 5, economia: { ...economiaNueva(), pesos: 0 }, materiales: {}, cosas: { poncho: 40 }, entradas: {} };
  const t2 = OP.sanearTienda({}, 5);
  OP.dejarEnTienda(p2, t2);
  eq([t2.stock.poncho, p2.cosas.poncho], [12, 28], 'el tope es de 12 lotes por cosa: el resto queda en la mochila');
  eq(OP.sanearTienda({ stock: { poncho: 99, tronco: 4, miel: -2, 'pan-casero': 'x' }, caja: 'mucho', dia: 7000 }, 12), { stock: { poncho: 12 }, caja: 0, dia: 12 }, 'basura: sólo mercadería conocida, con tope, sin negativos, sin días del futuro');
  const t3 = OP.sanearTienda({ stock: { poncho: 12 }, dia: 1 }, 400);
  eq(OP.venderDias(t3, 400), 12, 'un año de ausencia: vende lo que había (12 como mucho por el tope de 12 días × 4)');
  const t4 = OP.sanearTienda({ stock: { poncho: 12, miel: 12, 'pan-casero': 12 }, dia: 1 }, 400);
  eq(OP.venderDias(t4, 400), 36, 'con 36 lotes y un año: 12 días × 4 = 48 de cupo, vende los 36');
  const t5 = OP.sanearTienda({ stock: { poncho: 12, miel: 12, 'pan-casero': 12, empanadas: 12 }, dia: 1 }, 400);
  eq(OP.venderDias(t5, 400), 48, 'y con 48 lotes, el tope de doce días: 48');
  ok(t5.caja <= OP.TIENDA.cajaMax, 'la caja tiene techo');
}

// ---------------------------------------------------------------- 7. la cerveza propia en la cantina
{
  const base = C.cartaDeHoy({ estacion: 'verano', clima: 'sol', dia: 5 });
  const mia = C.cartaDeHoy({ estacion: 'verano', clima: 'sol', dia: 5, prod: C.produccionDe({ obras: [{ plano: 'cerveceria', etapas: 1 }] }) });
  const ce = (lista, id) => lista.find((x) => x.id === id);
  eq([ce(base, 'cerveza').precio, ce(mia, 'cerveza').precio], [350, 260], 'la cerveza artesanal: $350 → $260');
  eq([ce(base, 'cerveza-negra').precio, ce(mia, 'cerveza-negra').precio], [380, 290], 'la negra: $380 → $290');
  ok(ce(mia, 'cerveza').nombre === 'Tu cerveza artesanal' && ce(mia, 'cerveza-negra').nombre === 'Tu cerveza negra', 'con su nombre');
  eq(base.filter((x) => !/cerveza/.test(x.id)).map((x) => [x.id, x.precio]), mia.filter((x) => !/cerveza/.test(x.id)).map((x) => [x.id, x.precio]), 'el resto de la carta, igual');
  eq(base.length, mia.length, 'y la misma cantidad de platos');
  ok(!C.produccionDe({ obras: [{ plano: 'cerveceria', etapas: 0 }] }).cerveza && !C.produccionDe({ obras: [] }).cerveza && !C.produccionDe(null).cerveza && !C.produccionDe({}).cerveza, 'sin la cervecería terminada, nada cambia (partida vieja incluida)');
  ok(C.produccionDe({ obras: [{ plano: 'cerveceria', etapas: 1 }] }).cerveza === true, 'terminada, sí');
  const sin = C.cartaDeHoy({ estacion: 'verano', clima: 'sol', dia: 5, prod: C.produccionDe({ aldea: { locales: {} } }) });
  eq(sin.map((x) => x.precio), base.map((x) => x.precio), 'sin cervecería, la carta es la de siempre');
}

// ---------------------------------------------------------------- 8. el guardado: el estado vive en la obra y las partidas viejas quedan igual
{
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), key: (i) => [...mem.keys()][i] ?? null, get length() { return mem.size; } };
  const G = await import('../src/guardado.js');
  const obras = [
    { plano: 'panaderia-horno', x: 1, z: 2, rot: 0, etapas: 1, pagadas: 1, taller: { n: 3, desde: 250.5 } },
    { plano: 'herreria-propia', x: 8, z: 2, rot: 0, etapas: 1, pagadas: 1, taller: { templado: true } },
    { plano: 'tienda-campo', x: 3, z: 8, rot: 0, etapas: 1, pagadas: 1, taller: { stock: { poncho: 4 }, caja: 1200, dia: 9 } },
    { plano: 'canteria', x: 5, z: 5, rot: 0, etapas: 1 },   // sin estado: como una pieza recién armada
  ];
  ok(G.escribirPartida('relax', 1, { modo: 'relax', dia: 12, horas: 10, obras, economia: { ...economiaNueva(), pesos: 500 } }), 'se guarda');
  const r = G.leerPartida('relax', 1).progreso;
  eq(r.obras[0].taller, { n: 3, desde: 250.5 }, 'las tandas cargadas vuelven igual');
  eq(r.obras[1].taller, { templado: true }, 'el temple vuelve');
  eq(r.obras[2].taller, { stock: { poncho: 4 }, caja: 1200, dia: 9 }, 'la tienda vuelve con su caja y su mercadería');
  ok(!('taller' in r.obras[3]), 'y lo que no tenía estado sigue sin inventarle uno');
  eq(O.reintegroAlDesmontar({ dia: 3, economia: { ...economiaNueva() } }, 'queseria', 1, 1), 12000, 'desmontar uno devuelve la mitad del precio que de verdad se pagó ($12.000 de $24.000)');
  eq(O.puedePagarEtapa({ dia: 3 }, 'cerveceria', 0), { ok: true, precio: 0 }, 'una partida sin economía lo arma sin pagar y sin romperse');
  const pagar = O.puedePagarEtapa({ dia: 3, modo: 'relax', economia: { ...economiaNueva(), pesos: 41999 } }, 'cerveceria', 0);
  ok(pagar.ok === false && pagar.falta === 1, 'a la cervecería le faltan $1 con $41.999: no se construye sin plata');
}

// ---------------------------------------------------------------- 9. main.js, construccion.js y los demás usan todo esto
{
  const m = leer('src/main.js'), c = leer('src/construccion.js'), cant = leer('src/cantina.js');
  const tiene = (t, msg) => ok(m.includes(t), msg);
  tiene("import { OFICIOS_PROPIOS_QUE_SE_USAN } from './planos-oficios.js';", 'main.js trae la lista de lo que se usa con E');
  tiene('OBRAS_QUE_TRABAJAN.push(...Object.keys(OFICIOS_PROPIOS_QUE_SE_USAN));', 'los ocho entran en las obras que trabajan (aviso y E con la misma prioridad)');
  tiene('if (Object.hasOwn(OFICIOS_PROPIOS_QUE_SE_USAN, o.plano.id)) return avisoOficioPropio(o);', 'el aviso');
  tiene('if (Object.hasOwn(OFICIOS_PROPIOS_QUE_SE_USAN, o.plano.id) && usarOficioPropio(o))', 'y la tecla E');
  tiene("const a = ahorroDeObra(r.etapa.pide, nivelDe('obrero'), of.resto.obra, carpinteriaExtra());", 'la carpintería suma al ahorro de obra');
  tiene("const golpesParaTalarAhora = () => conTemple(golpesConFilo(golpesParaTalar(GOLPES_TALA, nivelDe('hachero')), progreso?.aldea));", 'el temple cuenta al talar');
  tiene("const golpesParaPicarAhora = (mata) => conTemple(golpesConFilo(golpesParaPicar(nivelDe('picapedrero'), mata?.esc), progreso?.aldea));", 'y al picar');
  tiene("if (!(progreso?.aldea?.afilado > 0)) return false;", 'el temple sólo se mira si hay filo (nada nuevo por cuadro)');
  tiene("datosDe(o, 'taller'", 'el estado vive en la obra');
  tiene('get tienda() { return tiendaDeCampoArmada(); }', 'el aviso (que corre cada cuadro junto al taller) no recorre las obras: la tienda se mira sólo cuando hace falta');
  tiene('avisarSobrante(paso);   // 4.2', 'armar una pieza también avisa lo que te sobró');
  ok(!/function\s+\w*[Oo]ficioPropio[\s\S]{0,40}requestAnimationFrame/.test(m), 'ningún bucle por cuadro');
  ok(c.includes("import { PIEZAS_OFICIOS } from './planos-oficios.js';") && c.includes('PIEZAS.push(...PIEZAS_OFICIOS)'), 'construccion.js los suma con una línea');
  ok(cant.includes('cerveza: tieneCerveceria(p)'), 'la cantina mira la cervecería');
  ok(!/Math\.random\(\)/.test(leer('src/oficios-propios.js')), 'el cálculo no usa azar (se puede repetir)');
  for (const f of ['src/oficios-propios.js', 'src/planos-oficios.js']) ok(!/\b(en|English|translate)\b\s*:/.test(leer(f)) && !/idioma-en/.test(leer(f)), `${f}: sin traducciones ni inglés`);
}

console.log(`verificar-4-2-oficios: ${n} comprobaciones OK`);

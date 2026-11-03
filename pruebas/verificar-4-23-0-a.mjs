// 4.23.0 · A · Lo que se produce vale (el paquete «4.23.0 · Lo que se produce vale» de AUDITORIA_4_20_0_A.md), en Node con los módulos reales:
//   · la granja y la cocina a leña tienen valor de mercado: leche, carne (vaca, cordero, cerdo), chorizo, seis frutas y seis mermeladas (`BIENES`);
//     se venden en los puestos de la trochita (nueve cosas como mucho por puesto: caben en los lugares libres), en la consigna de la feria y en la
//     tienda de campo, y los vecinos de confianza (nivel 3) pueden pedirlas;
//   · lo de siempre no se mueve: el abastecimiento del banco, el azar de una parada sin perfil, las existencias y la caja con que arranca cada puesto,
//     los pedidos de los niveles 0 a 2;
//   · salida pública para los talleres: la tienda de campo vende hasta 6 lotes por día (eran 4) y 12 clases (eran 8), el puesto de la feria 3 lotes (eran 2) y
//     12 clases (eran 8); la tienda se queda con lo que hace falta para una receta;
//   · la renta de las casas, al doble (también para las que ya estaban alquiladas); se paga en 70 a 80 días;
//   · los precios de ocho obras que pasaban de 4 veces sus materiales (la regla de PRECIOS_CONSTRUCCION.md);
//   · lo que dicen las herramientas de la auditoría después: el cociente tranquilo / a fondo no empeora (2,54 de la 4.21.0).
// Las mutaciones (que cada línea de acá falle si se deshace el cambio) las corre `pruebas/mutaciones-4-23-0-a.mjs`.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const raiz = fileURLToPath(new URL('..', import.meta.url));
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const entre = (v, a, b, m) => ok(v >= a && v <= b, `${m} (${v}, esperado de ${a} a ${b})`);

const C = await import('../src/comercio.js');
const E = await import('../src/economia.js');
const M = await import('../src/mercado.js');
const N = await import('../src/negocios.js');
const P = await import('../src/pedidos.js');
const B = await import('../src/prestamos.js');
const R = await import('../src/propiedad.js');
const OP = await import('../src/oficios-propios.js');
const CN = await import('../src/construccion.js');
const OB = await import('../src/obra-pesos.js');
const CA = await import('../src/cantina.js');

const herramienta = (nombre, ...args) => {
  const r = spawnSync(process.execPath, [`herramientas/${nombre}`, ...args], { cwd: raiz, encoding: 'utf8', timeout: 120000 });
  assert.equal(r.status, 0, `${nombre} terminó mal: ${r.stderr}`);
  return r.stdout;
};
const filaDe = (salida, claveCelda) => {
  const l = salida.split('\n').find((x) => x.includes(claveCelda));
  assert.ok(l, `no está la fila «${claveCelda}»`);
  return l.split('│').map((c) => c.trim().replace(/^'|'$/g, '')).filter((c, i) => i > 0 && c !== '');
};
const partida = (extra = {}) => ({ modo: 'relax', dia: 5, horas: 12, cosas: {}, materiales: {}, entradas: {}, economia: E.economiaNueva(), ...extra });

// ============================================================ 1. el valor de lo que se produce
const GRANJA = {
  leche: [4, 3], 'carne-vaca': [2, 7], 'carne-cordero': [2, 6], 'carne-cerdo': [2, 7], chorizo: [3, 6],
  manzana: [5, 4], pera: [5, 4], ciruela: [5, 4], cereza: [5, 4], frambuesa: [5, 4], grosella: [5, 4],
  'mermelada-manzana': [1, 4], 'mermelada-pera': [1, 4], 'mermelada-ciruela': [1, 4], 'mermelada-cereza': [1, 4], 'mermelada-frambuesa': [1, 4], 'mermelada-grosella': [1, 4],
};
{
  for (const [k, [lote, valor]] of Object.entries(GRANJA)) {
    ok(C.esBien(k), `${k} está en BIENES`);
    eq([C.BIENES[k].lote, C.BIENES[k].valor, C.BIENES[k].donde], [lote, valor, 'entrada'], `${k}: lote ${lote}, valor ${valor}, sale del cuaderno`);
    ok(C.DE_GRANJA_CON_VALOR.includes(k), `${k} está en la lista de lo de la granja`);
    ok(CA.unidadEnPesos(k) > 0, `${k} tiene precio por unidad`);
  }
  eq(C.DE_GRANJA_CON_VALOR.length, 17, 'son diecisiete cosas');
  eq([...C.DE_GRANJA_CON_VALOR].sort(), Object.keys(GRANJA).sort(), 'la lista es la misma');
  // el precio por unidad (lo que vale el lote entre cuántos trae)
  eq([CA.unidadEnPesos('leche'), CA.unidadEnPesos('carne-vaca'), CA.unidadEnPesos('carne-cordero'), CA.unidadEnPesos('chorizo'), CA.unidadEnPesos('manzana'), CA.unidadEnPesos('mermelada-pera')],
    [75, 350, 300, 200, 80, 400], 'leche $75, carne $350, cordero $300, chorizo $200, fruta $80, mermelada $400');
  // son los mismos ids que usa la cocina y la granja (si no, el valor no llega a nada)
  const CP = await import('../src/cocina-pasos.js');
  for (const k of CP.DE_LA_GRANJA) ok(Object.hasOwn(C.BIENES, k) || k === 'frutilla', `${k} de la granja vale`);
  for (const f of CP.FRUTAS.filter((x) => x !== 'frutilla')) ok(Object.hasOwn(C.BIENES, `mermelada-${f}`), `la mermelada de ${f} vale`);
  // ninguna cosa nueva se vende más cara que lo que cuesta un cambio de vecino la regala: los cambios más generosos, por unidad
  const cambios = CP.CAMBIOS_VECINOS;
  for (const [clave, lista] of Object.entries(cambios)) for (const c of lista) {
    const [id, cuantos] = c.da;
    if (!Object.hasOwn(C.BIENES, id)) continue;
    const sale = cuantos * CA.unidadEnPesos(id);
    const pide = c.pide.tipo === 'material' || (c.pide.tipo === 'cosa' && c.pide.k === 'yerba') ? c.pide.n * (c.pide.k === 'yerba' ? 100 : CA.unidadEnPesos(c.pide.k)) : 0;
    if (pide > 0) ok(sale / pide <= 3.2, `${clave}: ${id} ×${cuantos} por ${c.pide.k} ×${c.pide.n}: vale ${(sale / pide).toFixed(2)} veces (no pasa de 3,2)`);
  }
}

// ============================================================ 2. los puestos de la trochita
const PUESTOS = {
  'Estación del Valle': 'carne-vaca', 'Parada del Mallín': 'leche', 'Apeadero del Faro': 'carne-cordero', 'Parada Arrayanes': 'carne-cerdo', 'Parada Alta': 'chorizo',
  'Parada del Molino': 'manzana', 'Apeadero de la Casa de Té': 'mermelada-frambuesa', 'Parada del Mirador': 'ciruela', 'Parada del Bosque': 'cereza',
};
{
  for (const [parada, bien] of Object.entries(PUESTOS)) {
    const l = C.bienesDe(parada);
    ok(l.includes(bien), `${parada} trabaja con ${bien}`);
    ok(l.length <= 9, `${parada}: ${l.length} cosas (nueve como mucho, una por número)`);
    ok(C.perfilDe(parada).pide.includes(bien), `${parada} la pide (la paga a más: ×1,5)`);
  }
  eq(C.bienesDe('Apeadero del Pescador').filter((b) => C.DE_GRANJA_CON_VALOR.includes(b)), ['grosella', 'mermelada-manzana'], 'el apeadero del pescador, dos');
  // lo que ya había en cada puesto sigue ahí
  const VIEJO = {
    'Estación del Valle': ['harina', 'tabla', 'huevo', 'poncho', 'pan-casero', 'piedra', 'miel', 'trucha-ahumada'],
    'Parada del Mallín': ['lana', 'huevo', 'haba', 'tabla', 'harina', 'frasco-frutilla', 'papa', 'tronco'],
    'Parada Alta': ['piedra', 'cristal', 'empanadas', 'pan-casero', 'lana', 'tronco', 'harina', 'hongos-secos'],
    'Puesto del Riel Sur': ['poncho', 'lana', 'huevo', 'papa', 'miel', 'trucha-fresca', 'tabla', 'junco', 'cuero'],
    'Aldea de los Duendes': ['frasco-frutilla', 'huevo', 'calafate-seco', 'tabla', 'piedra', 'tronco', 'lana', 'harina', 'pan-casero'],
  };
  for (const [parada, viejo] of Object.entries(VIEJO)) eq(C.bienesDe(parada).filter((b) => !C.DE_GRANJA_CON_VALOR.includes(b)), viejo, `${parada}: lo de siempre, en el mismo orden`);
  for (const p of ['Puesto de la Cantera', 'Puesto del Paso', 'Puesto de la Estepa', 'Puesto del Riel Sur', 'Aldea de los Duendes']) eq(C.bienesDe(p).filter((b) => C.DE_GRANJA_CON_VALOR.includes(b)), [], `${p} (ya tenía nueve) no cambia`);
  // cada cosa tiene dónde venderse: un puesto, o (las que no entraron en los nueve lugares) la consigna y la tienda
  const enPuestos = new Set(Object.keys(PUESTOS).flatMap((p) => C.bienesDe(p)).concat(C.bienesDe('Apeadero del Pescador')));
  const sinPuesto = C.DE_GRANJA_CON_VALOR.filter((k) => !enPuestos.has(k));
  eq(sinPuesto.sort(), ['frambuesa', 'mermelada-cereza', 'mermelada-ciruela', 'mermelada-grosella', 'mermelada-pera', 'pera'], 'seis quedan sin puesto de trochita (no hay lugar: nueve cosas por puesto)');
  for (const k of sinPuesto) { ok(OP.TIENDA.mercaderia.includes(k), `${k}: la vende la tienda de campo`); ok(R.precioDeConsigna(k) > 0, `${k}: la vende la consigna de la feria`); }
  // comprar y vender un lote de lo nuevo anda con el mercado real
  const c = C.comercioNuevo();
  const t = M.tienda(c, 'Parada Alta', 12);
  const pr = C.precios(c, 'Parada Alta', 'chorizo', 12, 'verano', M.factorDe(t, 'Parada Alta', 'chorizo'));
  ok(pr && pr.venta > 0 && pr.compra > pr.venta && pr.lote === 3, `el puesto de la cantera paga el chorizo (${pr?.venta}) y lo cobra más caro (${pr?.compra})`);
  const v = C.vender(c, 'Parada Alta', 'chorizo', 12, 'verano', 3, M.factorDe(t, 'Parada Alta', 'chorizo'));
  ok(v.ok && v.cantidad === 3, 'se le vende un lote');
  // la cantera paga el chorizo mejor que el valor base (pide: ×1,5 menos el margen y el corrimiento), en el rango de ±12 % del día
  entre(pr.venta, Math.floor(6 * 1.5 * 0.88 * 0.88), Math.ceil(6 * 1.5 * 0.88 * 1.12 * 1.3), 'el chorizo en la cantera, en unidades de yerba');
}

// ============================================================ 3. lo de siempre no se movió
{
  // (a) las existencias y la caja con que arranca un puesto, para lo que ya había: el mismo azar y el mismo orden que antes
  for (const parada of Object.keys(PUESTOS).concat(['Apeadero del Pescador', 'Puesto de la Estepa', 'Estación del Valle'])) {
    const viejo = C.bienesDe(parada).filter((b) => !C.DE_GRANJA_CON_VALOR.includes(b));
    const r = C.azarDe(C.hashTexto(`${parada}|mercado`));
    const esperado = {};
    for (const b of viejo) esperado[b] = Math.max(0, Math.min(M.MERCADO.stockMax, M.nivelBase(parada, b) + Math.round((r() - 0.5) * 3)));
    const caja = Math.round((M.cajaMaxima(parada) * (0.45 + r() * 0.35)) / 100) * 100;
    const t = M.tienda(C.comercioNuevo(), parada, 7);
    for (const b of viejo) assert.equal(t.stock[b], esperado[b], `${parada}: ${b}`);
    n++;
    eq(t.caja, caja, `${parada}: la caja con que arranca es la de siempre`);
    for (const b of C.bienesDe(parada).filter((x) => C.DE_GRANJA_CON_VALOR.includes(x))) ok(Number.isInteger(t.stock[b]) && t.stock[b] >= 0 && t.stock[b] <= 14, `${parada}: ${b} arranca con existencias (${t.stock[b]})`);
  }
  // (b) un puesto guardado antes de esto (sin las existencias de lo nuevo) las completa al volver
  const viejo = C.comercioNuevo();
  viejo.mercado['Parada Alta'] = { dia: 3, caja: 2000, stock: { piedra: 9, cristal: 9, empanadas: 2, 'pan-casero': 2, lana: 2, tronco: 2, harina: 5, 'hongos-secos': 5 } };
  const t2 = M.tienda(C.sanearComercio(JSON.parse(JSON.stringify(viejo))), 'Parada Alta', 3);
  ok(Number.isFinite(t2.stock.chorizo) && t2.stock.chorizo === M.nivelBase('Parada Alta', 'chorizo'), 'el puesto de una partida vieja completa el chorizo con su nivel de siempre');
  eq(t2.caja, 2000, 'y no toca la caja');
  // (c) el banco pide lo de siempre: nunca lo de la granja, y la elección es la de antes (la misma lista sin lo nuevo)
  const ids = Object.keys(C.BIENES).filter((x) => !C.DE_GRANJA_CON_VALOR.includes(x) && !['poncho', 'cristal', 'junco', 'hierbas', 'arcilla', 'cuero', 'piedra-cantera'].includes(x) && !C.perfilDe('Aldea de los Duendes').produce.includes(x));
  let distintos = new Set();
  for (let v = 0; v < 80; v++) {
    const p = partida({ dia: v * 7 + 1 });
    const a = B.abastoDe(p, v * 7 + 1);
    ok(a && !C.DE_GRANJA_CON_VALOR.includes(a.k), `ventana ${v}: el banco pide ${a?.k}, no lo de la granja`);
    distintos.add(a.k);
  }
  ok(distintos.size >= 8 && [...distintos].every((k) => ids.includes(k)), `el banco sigue pidiendo de la lista de siempre (${distintos.size} cosas distintas)`);
  // (d) una parada sin perfil arma el suyo con el azar de siempre y sin lo de la granja
  const vistos = new Set();
  for (let i = 0; i < 300; i++) { const p = C.perfilDe(`Parada inventada ${i}`); for (const b of [...p.produce, ...p.pide, ...p.otros]) vistos.add(b); }
  ok([...vistos].every((b) => !C.DE_GRANJA_CON_VALOR.includes(b)), 'el perfil armado de una parada sin nombre conocido no usa lo de la granja');
  ok(vistos.size >= 15, 'y usa de lo demás');
}

// ============================================================ 4. los pedidos de los vecinos
{
  const VIEJO_NECESITA = {
    carpintero: ['tronco', 'piedra', 'lana'], panadera: ['harina', 'huevo', 'miel'], herrero: ['piedra', 'tronco', 'cristal'],
    pescador: ['tronco', 'lana', 'pan-casero'], maestra: ['papa', 'pan-casero', 'frasco-frutilla'], enfermera: ['miel', 'lana', 'frasco-frutilla'],
    telegrafista: ['tronco', 'pan-casero', 'empanadas'], tejedora: ['lana', 'frutilla', 'poncho'], apicultor: ['tabla', 'frasco-frutilla', 'harina'],
    guardaparque: ['trucha-ahumada', 'tronco', 'hongos-secos'], musico: ['tabla', 'empanadas', 'miel'], veterinaria: ['huevo', 'lana', 'haba'],
    herbolaria: ['miel', 'calafate-seco', 'hongos-secos'], modista: ['lana', 'poncho', 'cristal'], botera: ['tabla', 'tronco', 'lana'],
    pintora: ['cristal', 'frutilla', 'calafate-seco'], andinista: ['trucha-ahumada', 'pan-casero', 'empanadas'], fotografa: ['cristal', 'miel', 'papa'],
    ceramista: ['piedra', 'haba', 'papa'], astronoma: ['cristal', 'empanadas', 'miel'],
  };
  const noEstacion = new Set(C.perfilDe('Aldea de los Duendes').produce);
  const conRep = (k, rep) => { const p = partida(); N.negociosDe(p).rep[k] = rep; return p; };
  let granjaVista = 0, vecinosConGranja = 0;
  const puestoDe = (b) => [...Object.keys(PUESTOS), 'Apeadero del Pescador'].some((par) => C.bienesDe(par).includes(b));
  for (const k of Object.keys(VIEJO_NECESITA)) {
    ok(P.hayPedidos(k), `${k} pide`);
    const pool = VIEJO_NECESITA[k].filter((b) => !noEstacion.has(b));
    let vio = new Set(), granja = new Set();
    for (let d = 1; d <= 300; d += 3) {
      // niveles 0 a 2: sólo lo de siempre (las dos primeras, o las tres)
      for (const [rep, tope] of [[0, 2], [3, 2], [8, 3]]) {
        const ped = P.pedidoDe(conRep(k, rep), k, d);
        const permitidas = (pool.length ? pool : VIEJO_NECESITA[k]).slice(0, tope);
        if (!permitidas.includes(ped.k)) assert.fail(`${k} (rep ${rep}) pide ${ped.k}, que no está entre ${permitidas.join(', ')}`);
        n++;
      }
      const alto = P.pedidoDe(conRep(k, 16), k, d);
      vio.add(alto.k);
      if (C.DE_GRANJA_CON_VALOR.includes(alto.k)) granja.add(alto.k);
    }
    ok(granja.size === 1, `${k} de confianza (nivel 3) pide además una cosa de la granja o la cocina (${[...granja].join(',') || 'ninguna'})`);
    const g = [...granja][0];
    ok(puestoDe(g), `${k}: ${g} se consigue en algún puesto de la trochita`);
    ok(vio.size >= 3, `${k}: de confianza sigue pidiendo de varias cosas`);
    granjaVista += granja.size; vecinosConGranja++;
  }
  eq([granjaVista, vecinosConGranja], [20, 20], 'los veinte vecinos');
  // el pago de un pedido de lo nuevo sale del valor del lote (y es redondo a $50)
  eq(P.premioDe('leche', 8, 1.1), 650, 'dos lotes de leche (8 litros) pagados a 1,1: $650');
  eq(P.premioDe('carne-vaca', 4, 1.1), 1550, 'dos lotes de carne de vaca (4 kg): $1.550');
}

// ============================================================ 5. salida pública para los talleres
{
  eq([OP.TIENDA.lotesPorDia, OP.TIENDA.tipos, OP.TIENDA.stockMax], [6, 12, 12], 'la tienda de campo: 6 lotes por día, 12 clases, 12 lotes de cada una');
  eq([R.PROPIEDAD.puesto.lotesPorDia, R.PROPIEDAD.puesto.tiposMax, R.PROPIEDAD.puesto.stockMax], [3, 12, 12], 'el puesto de la feria: 3 lotes por día, 12 clases');
  for (const k of OP.TIENDA.mercaderia) ok(C.esBien(k), `${k} de la tienda es un bien`);
  eq(OP.TIENDA.mercaderia.length, 25, 'ocho de siempre y diecisiete nuevos');
  eq(new Set(OP.TIENDA.mercaderia).size, 25, 'sin repetir');
  for (const k of ['poncho', 'pan-casero', 'empanadas']) ok(OP.TIENDA.mercaderia.includes(k), `${k}, lo que hacen los talleres, sigue`);
  // lo que el horno grande y el telar sacan por día (8 panes y 2 ponchos) entra en el cupo (antes, con 4, no)
  const lotesDelHorno = 8 / C.BIENES['pan-casero'].lote, lotesDelTelar = 2 / C.BIENES.poncho.lote;
  ok(lotesDelHorno + lotesDelTelar > 4 && lotesDelHorno + lotesDelTelar <= OP.TIENDA.lotesPorDia, `el horno y el telar suman ${(lotesDelHorno + lotesDelTelar).toFixed(2)} lotes por día: más que 4, menos que 6`);
  // la tienda vende 6 lotes por día, lo más caro primero
  const t = { stock: { poncho: 6, 'pan-casero': 6, 'carne-vaca': 6 }, caja: 0, dia: 1 };
  const vend = OP.venderDias(t, 3);
  eq(vend, 12, 'en dos días, doce lotes');
  eq(t.stock, { 'pan-casero': 6 }, 'los seis ponchos y los seis lotes de carne primero (valor 20 y 7 contra 6): sólo queda el pan');
  ok(t.caja >= 6 * OP.precioEnTienda('poncho') + 6 * OP.precioEnTienda('carne-vaca'), 'la caja tiene lo vendido a precio de plaza menos la comisión');
  // precios: la tienda paga cerca del valor de plaza
  for (const k of C.DE_GRANJA_CON_VALOR) { const p = OP.precioEnTienda(k); entre(p, C.BIENES[k].valor * 100 * 0.5, C.BIENES[k].valor * 100 * 1.05, `${k} en la tienda`); }
  // lo que se guarda para cocinar
  const p = partida();
  p.entradas = Object.fromEntries(OP.TIENDA.mercaderia.filter((k) => C.BIENES[k].donde === 'entrada').map((k) => [k, { cantidad: 0 }]));
  p.cosas = { poncho: 0 };
  p.entradas['carne-vaca'].cantidad = 5; p.entradas.chorizo.cantidad = 2; p.entradas.leche.cantidad = 9; p.entradas.manzana.cantidad = 4; p.entradas['mermelada-pera'].cantidad = 3; p.entradas['pan-casero'].cantidad = 7;
  const ts = OP.sanearTienda({}, 5);
  const dejado = OP.dejarEnTienda(p, ts);
  const de = Object.fromEntries(dejado.map((x) => [x.k, x.lotes]));
  eq(de, { 'pan-casero': 2, 'carne-vaca': 1, leche: 1, 'mermelada-pera': 2 }, 'deja 2 lotes de pan (7 panes), 1 de carne (se queda con 2 kg de 5, 3 → 1 lote), 1 de leche (se queda con 4 de 9), 2 frascos de mermelada');
  eq([p.entradas['carne-vaca'].cantidad, p.entradas.chorizo.cantidad, p.entradas.leche.cantidad, p.entradas.manzana.cantidad, p.entradas['mermelada-pera'].cantidad, p.entradas['pan-casero'].cantidad],
    [3, 2, 5, 4, 1, 1], 'queda en la mochila lo de una receta (el asado: 2 kilos y 2 chorizos) y un frasco');
  const q = partida(); q.entradas = { chorizo: { cantidad: 3 }, 'carne-cerdo': { cantidad: 2 } };
  eq(OP.dejarEnTienda(q, OP.sanearTienda({}, 5)), [], 'con justo lo de una receta no deja nada');
  ok(!OP.hayParaDejar(q) && /sin mercadería/.test(OP.avisoTienda(OP.sanearTienda({}, 5), q)), 'y el aviso no dice «dejar la mercadería»');
  q.entradas.chorizo.cantidad = 5;
  ok(OP.hayParaDejar(q) && /dejar la mercadería/.test(OP.avisoTienda(OP.sanearTienda({}, 5), q)), 'con un lote de más sí');
  // doce clases a la vez, y una tienda guardada con ocho sigue igual
  const ocho = Object.fromEntries(['poncho', 'empanadas', 'pan-casero', 'frasco-frutilla', 'miel', 'trucha-ahumada', 'hongos-secos', 'calafate-seco'].map((k) => [k, 3]));
  eq(OP.sanearTienda({ stock: ocho, caja: 100, dia: 3 }, 9).stock, ocho, 'una tienda guardada con ocho clases queda igual');
  const trece = Object.fromEntries(OP.TIENDA.mercaderia.slice(0, 15).map((k) => [k, 2]));
  eq(Object.keys(OP.sanearTienda({ stock: trece, caja: 0, dia: 1 }, 9).stock).length, 12, 'y con más de doce guarda doce');
  // el puesto de la feria: 3 lotes por día, 12 clases
  const f = partida(); f.economia.pesos = 6000; R.comprarPuesto(f, 1);
  f.materiales = { tabla: 99, piedra: 99, tronco: 99, lana: 99, cristal: 99, cuero: 99, junco: 99, hierbas: 99, arcilla: 99, 'piedra-cantera': 99 };
  f.cosas = { poncho: 9, harina: 99 };
  f.entradas = Object.fromEntries(['huevo', 'haba', 'papa', 'frutilla', 'miel', 'leche', 'chorizo'].map((k) => [k, { cantidad: 99 }]));
  let dejadas = 0;
  for (const b of Object.keys(C.BIENES)) { const r = R.dejarEnPuesto(f, b, 1); if (r.ok) dejadas++; }
  eq(dejadas, 12, 'el puesto de la feria acepta doce clases (con ocho, como antes, rechazaría de la novena en adelante)');
  eq(R.dejarEnPuesto(f, 'pera', 1).motivo === 'falta' || R.dejarEnPuesto(f, 'pera', 1).motivo === 'tipos', true, 'la siguiente no entra');
  const g = partida(); g.economia.pesos = 6000; R.comprarPuesto(g, 1); g.materiales = { tabla: 99 }; R.dejarEnPuesto(g, 'tabla', 6);
  const vendidos = R.ventasDelPuesto(g, 2);
  eq(vendidos, 3, 'el puesto vende 3 lotes por día');
  const lo = N.sanearNegocios(JSON.parse(JSON.stringify({ casas: { puesto: { caja: 5, stock: Object.fromEntries(Object.keys(C.BIENES).slice(0, 14).map((k) => [k, 2])), dia: 1 } } })), 5);
  eq(Object.keys(lo.casas.puesto.stock).length, 12, 'el guardado del puesto conserva doce clases');
  const ocho2 = N.sanearNegocios({ casas: { puesto: { caja: 5, stock: Object.fromEntries(Object.keys(C.BIENES).slice(0, 8).map((k) => [k, 2])), dia: 1 } } }, 5);
  eq(Object.keys(ocho2.casas.puesto.stock).length, 8, 'y uno viejo con ocho, ocho');
  // los textos que lo dicen
  const main = leer('src/main.js');
  ok(main.includes('vende hasta 6 por día, lo más caro primero') && main.includes('vende hasta 6 lotes por día') && !main.includes('vende hasta 4'), 'el aviso de la tienda dice seis');
  ok(leer('src/planos-oficios.js').includes('vende hasta seis lotes por día') && !leer('src/planos-oficios.js').includes('hasta cuatro lotes'), 'el texto del plano de la tienda dice seis');
  ok(leer('src/main.js').includes('te quedás con lo de una receta'), 'y que se guarda lo de una receta');
}

// ============================================================ 6. la renta, al doble
{
  eq(Object.fromEntries(Object.entries(R.PROPIEDAD.casas).map(([k, c]) => [k, c.renta])), { 'cabana-piedra': 600, 'casa-galeria': 1000, casona: 1600 }, 'renta de $600, $1.000 y $1.600 por día');
  for (const id of Object.keys(R.PROPIEDAD.casas)) {
    const c = R.PROPIEDAD.casas[id];
    const dias = c.total / (R.rentaDe(id) * R.PROPIEDAD.ocupacion);
    entre(dias, 65, 85, `${id}: la casa se paga en ${dias.toFixed(0)} días (eran 141 a 162)`);
  }
  // una casa ya alquilada con la renta vieja anotada ($300) cobra la nueva
  const p = partida(); p.obras = [{ plano: 'cabana-piedra', etapas: 4 }];
  R.registrarCasa(p, 'cabana-piedra');
  const al = R.ponerEnAlquiler(p, 'cabana-piedra', 6);
  eq(al.renta, 600, 'se alquila a $600');
  p.negocios.casas.alquiladas['cabana-piedra'].renta = 300;
  let cobrado = 0; for (let d = 7; d <= 106; d++) cobrado += R.alquilerDelDia(p, d, 1);
  entre(cobrado, 100 * 600 * 0.7, 100 * 600 + 1, `cien días de una casa alquilada con la renta vieja: $${cobrado}`);
  let q = partida(); q.obras = [{ plano: 'casona', etapas: 4 }, { plano: 'casona', etapas: 4 }]; R.registrarCasa(q, 'casona'); R.registrarCasa(q, 'casona'); R.ponerEnAlquiler(q, 'casona', 6); R.ponerEnAlquiler(q, 'casona', 6);
  let c2 = 0; for (let d = 7; d <= 106; d++) c2 += R.alquilerDelDia(q, d, 1);
  entre(c2, 100 * 2 * 1600 * 0.7, 200 * 1600 + 1, `dos casonas: $${c2}`);
  // con la demanda alta o baja
  const r1 = partida(); r1.obras = [{ plano: 'casona', etapas: 4 }]; R.registrarCasa(r1, 'casona'); R.ponerEnAlquiler(r1, 'casona', 6);
  let alta = 0, baja = 0; const r2 = structuredClone(r1);
  for (let d = 7; d <= 66; d++) { alta += R.alquilerDelDia(r1, d, 2); baja += R.alquilerDelDia(r2, d, 0.1); }
  ok(alta > baja && alta <= 60 * 1600 * 1.25 + 1 && baja >= 60 * 1600 * 0.9 * 0.7, 'la demanda sube o baja la renta dentro de sus topes (−10 % / +25 %)');
  ok(leer('src/propiedad.js').includes('rentaDe(id) * Math.max(0.9'), 'el cobro del día usa la renta de hoy');
}

// ============================================================ 7. los precios de las obras
{
  const v = (k) => (C.BIENES[k].valor * 100) / C.BIENES[k].lote;
  const razon = (id) => {
    const p = CN.PLANOS.find((x) => x.id === id);
    assert.ok(p, `existe el plano ${id}`);
    const pesos = OB.preciosDePlano(p).reduce((a, b) => a + b, 0);
    const mat = p.etapas.reduce((s, e) => s + Object.entries(e.pide || {}).reduce((q, [k, c]) => q + v(k) * c, 0), 0);
    return { pesos, mat, razon: pesos / mat };
  };
  const NUEVOS = { 'herreria-propia': 18000, cerveceria: 29500, 'telar-grande': 21500, queseria: 17500, 'tienda-campo': 23500, canteria: 13000, 'reloj-pie': 7500, 'arana-velas': 4550 };
  for (const [id, precio] of Object.entries(NUEVOS)) {
    const r = razon(id);
    eq(r.pesos, precio, `${id}: $${precio}`);
    ok(r.razon <= 4, `${id}: ${r.razon.toFixed(2)} veces los materiales (la regla es hasta 4)`);
    ok(r.razon >= 3, `${id}: no se pasó para abajo (${r.razon.toFixed(2)})`);
    ok(r.pesos % 50 === 0 && (id === 'arana-velas' || id === 'reloj-pie' || r.pesos % 500 === 0), `${id}: redondo (a $500 los edificios, a $50 las piezas de lujo)`);
  }
  // las cuatro de entre 4,1 y 4,4 (comercios y locales) quedan como estaban; son las únicas que pasan de 4
  const PASAN = { 'panaderia-horno': 27000, carpinteria: 22000, 'local-panaderia': 36000, 'local-almacen': 28000 };
  for (const [id, precio] of Object.entries(PASAN)) { const r = razon(id); eq(r.pesos, precio, `${id} no cambia`); ok(r.razon > 4 && r.razon < 4.5, `${id}: ${r.razon.toFixed(2)}`); }
  const todas = CN.PLANOS.filter((p) => OB.preciosDePlano(p).some((x) => x > 0)).map((p) => ({ id: p.id, ...razon(p.id) }));
  eq(todas.filter((x) => x.razon > 4).map((x) => x.id).sort(), Object.keys(PASAN).sort(), 'de las 59 obras con pesos sólo cuatro pasan de 4 veces (eran doce)');
  eq(todas.length, 59, 'sigue habiendo 59 obras con pesos');
  ok(todas.every((x) => x.razon >= 1) && todas.every((x) => x.pesos >= 800 && x.pesos <= 80000), 'ninguna debajo de 1 ni de menos de $800 ni de más de $80.000');
  ok(todas.find((x) => x.id === 'cerveceria').pesos < R.PROPIEDAD.casas['cabana-piedra'].total, 'la cervecería ya no cuesta más que la cabaña');
  eq(todas.reduce((s, x) => s + x.pesos, 0), 853850, 'el catálogo de obras con pesos suma $853.850 (eran $916.300)');
  // las etapas de cada una siguen sumando el total (se cobra por etapas)
  for (const id of Object.keys(NUEVOS)) { const p = CN.PLANOS.find((x) => x.id === id); eq(OB.preciosDePlano(p).reduce((a, b) => a + b, 0), NUEVOS[id], `${id}: las etapas suman el precio`); }
  // los textos que nombran los precios
  const po = leer('src/planos-oficios.js');
  for (const t of ['herrería propia ($18.000)', 'cervecería artesanal ($29.500)', 'telar grande ($21.500)', 'quesería ($17.500)', 'tienda de campo ($23.500)', 'cantería ($13.000)']) ok(po.includes(t), `el encabezado de planos-oficios.js dice ${t}`);
  ok(leer('src/planos-lujo.js').includes('araña de velas ($4.550), reloj de pie ($7.500)'), 'el encabezado de planos-lujo.js');
  ok(leer('PRECIOS_CONSTRUCCION.md').includes('herrería propia $18.000') && leer('PRECIOS_CONSTRUCCION.md').includes('telar grande $21.500'), 'la tabla de PRECIOS_CONSTRUCCION.md');
}

// ============================================================ 8. lo que dicen las herramientas de la auditoría ahora
{
  const planos = herramienta('auditoria-4-20-a-planos.mjs');
  ok(/Sobre 59 obras con pesos, 4 pasan de 4 veces, 0 están por debajo/.test(planos), 'la herramienta de planos: sólo cuatro pasan de 4 veces');
  const valores = herramienta('auditoria-4-20-a-valores.mjs');
  const q = filaDe(valores, "'queseria'");
  ok(q.includes('600') && q.includes('500'), `la quesería ya cuenta la leche: entra $600 y deja $500 por tanda (${q.join(' | ')})`);
  ok(!/Productos de la granja:[^\n]*\nDe ésos, con valor en el mercado \(BIENES\): ninguno/.test(valores), 'la herramienta ya no dice que la granja no vale');
  const ritmo = herramienta('auditoria-4-20-a-ritmo.mjs', '36');
  const cat = filaDe(ritmo, '1079850');
  const dia = (s) => Number(/día (\d+)/.exec(s)[1]);
  const [tr, me, af] = [dia(cat[2]), dia(cat[3]), dia(cat[4])];
  entre(tr, 236, 245, `el catálogo (de $1.079.850) para el tranquilo: día ${tr} (era 254 con $1.142.300)`);
  entre(af, 92, 98, `y para el que juega a fondo: día ${af} (era 100)`);
  ok(me >= 160 && me <= 175, `y para el medio: día ${me}`);
  const cociente = tr / af;
  ok(cociente <= 2.54 + 1e-9, `el cociente tranquilo / a fondo no empeora: ${cociente.toFixed(2)} (el de la 4.21.0: 2,54)`);
  ok(cociente >= 2.2, `ni se pasó de rosca: ${cociente.toFixed(2)}`);
  // el piso del jugador tranquilo no se tocó ($4.363 por día en los días 20 a 40 y las 3 primeras horas)
  const tranq = filaDe(ritmo, "'tranquilo (turno + 1 jornal)'");
  eq([tranq[7], tranq[8]], ['4363', '4586'], 'el tranquilo sigue en $4.363 por día (días 20 a 40) y $4.586 (100 a 140)');
  const afondo = filaDe(ritmo, "'a fondo (con vender excedente)'");
  entre(Number(afondo[4]), 90000, 93000, 'a las 3 horas el que juega a fondo tiene unos $91.000 (era $91.100)');
  entre(Number(afondo[7]), 10800, 10950, 'y por día (días 20 a 40) unos $10.900 (era $10.913)');
  // los pedidos con el nivel más alto pagan un poco menos (la cuarta cosa es barata): como mucho 10 % menos de lo de la 4.21.0 ($810)
  const c = filaDe(ritmo, "'C. turno + jornales + pedidos + abasto + tablón'");
  const ped = Number(/pedido (\d+)/.exec(c[7])[1]);
  entre(ped, 729, 810, `el pedido del nivel más alto, $${ped} por día (era $810)`);
  // el mercado de los puestos sigue con su techo de $450 por puesto por día
  const merc = herramienta('auditoria-4-20-a-mercado.mjs', '60');
  const m3 = filaDe(merc, '│ 2 ');
  entre(Number(m3[3]), 4900, 5000, 'el mercado absorbe unos $4.950 por día con 3 puestos');
  // los fletes de la 4.21.0 siguen igual
  const fl = herramienta('auditoria-4-20-a-fletes.mjs');
  eq(filaDe(fl, 'sin furgón (3 a la vez, 2 por parada)')[5], '19277', 'los fletes siguen en $19.277 por hora (los de la 4.21.0)');
}

// ============================================================ 9. el resto de lo que se tocó no se rompió
{
  // el comercio entero con una parada de cada tipo: ningún bien nuevo rompe `precios`, `comprar` ni `vender`
  const c = C.comercioNuevo();
  for (const parada of Object.keys(PUESTOS).concat(['Apeadero del Pescador'])) {
    const t = M.tienda(c, parada, 20);
    for (const b of C.bienesDe(parada)) {
      const pr = C.precios(c, parada, b, 20, 'invierno', M.factorDe(t, parada, b));
      ok(pr.compra > pr.venta && pr.venta >= 1 && pr.lote === C.BIENES[b].lote, `${parada} / ${b}: compra ${pr.compra} > venta ${pr.venta}`);
    }
  }
  // el estado guardado de un puesto con lo nuevo vuelve igual
  const g = C.sanearComercio(JSON.parse(JSON.stringify(c)));
  ok(Object.keys(g.mercado['Parada Alta'].stock).includes('chorizo'), 'lo guardado del puesto conserva el chorizo');
  eq(Object.keys(g.mercado).length, 10, 'diez puestos guardados');
  // el valor de lo nuevo en la consigna: nunca más del 90 % del valor
  for (const b of C.DE_GRANJA_CON_VALOR) ok(R.precioDeConsigna(b) / (C.BIENES[b].valor * 100) <= 0.9 + 1e-9, `${b} en la consigna: como mucho el 90 %`);
  // cambios de los vecinos de la cocina: nadie puede comprar lo nuevo a menos que su puesto lo tenga (esBien ya los acepta)
  ok(C.esBien('carne-cordero') && !C.esBien('carne-pollo'), 'esBien conoce lo nuevo y sólo eso');
}

console.log(`verificar-4-23-0-a: ${n} comprobaciones OK`);

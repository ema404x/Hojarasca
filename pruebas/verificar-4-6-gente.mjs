// 4.6 gente: la gente fuera del pueblo y el tablón de encargos de la plaza (src/tablon.js, gente-campo.js, gente-campo-juego.js,
// tablon-mundo.js y gente-campo-mundo.js), en Node:
//   · el tablón: 3 a la vista por día, 1 entrega por día, 2 días de plazo, hasta 2 tomados; pagos ×1,5 / ×2 / ×2,5 según la
//     distancia a la plaza del lugar de donde sale la cosa, entre $700 y $2.200; lo que suma por día; los piñones sólo en otoño;
//     los materiales nuevos (del agente «recursos») sólo cuando el juego los conoce;
//   · los pedidos de la gente del campo (2 o 3 por persona, uno por vez, el mismo tope de 2 por día de los vecinos) y las
//     tienditas (precios por encima de lo que paga un puesto del tren, un poco por día, lo que se compra una vez, el pico de
//     cantero con picapedrero nivel 3);
//   · la charla (gente-campo-juego.js y vecindad-juego.js con un contexto de mentira) y la rueda («Pedidos y compras»);
//   · el guardado (partida nueva, partida de antes sin el campo nuevo, datos rotos, el Desafío sin nada);
//   · lo enganchado en main.js (la E y el aviso en el mismo orden) y guardado.js, la ropa de los tres nuevos y que no hay inglés.
import assert from 'assert/strict';
import fs from 'fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const TB = await import('../src/tablon.js');
const GC = await import('../src/gente-campo.js');
const { crearGenteCampoJuego } = await import('../src/gente-campo-juego.js');
const { economiaNueva, pesosDe } = await import('../src/economia.js');
const { negociosNuevo } = await import('../src/negocios.js');
const { BIENES, COMERCIO } = await import('../src/comercio.js');
const { PEDIDOS } = await import('../src/pedidos.js');
const { categoriaDeOpcion, iconoDeOpcion, CATEGORIAS_VISTA } = await import('../src/social-rueda.js');
const R = await import('../src/gente-ropa.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const sinRotos = (v, ruta = '') => {
  if (typeof v === 'number') ok(Number.isFinite(v), `${ruta}: número finito (${v})`);
  else if (typeof v === 'string') ok(!/undefined|NaN|\[object/.test(v), `${ruta}: sin undefined ni NaN («${v.slice(0, 60)}»)`);
  else if (Array.isArray(v)) v.forEach((x, i) => sinRotos(x, `${ruta}[${i}]`));
  else if (v && typeof v === 'object') for (const k of Object.keys(v)) sinRotos(v[k], `${ruta}.${k}`);
};
const relax = (pesos = 0, dia = 1) => ({ modo: 'relax', dia, horas: 12, economia: { ...economiaNueva(), pesos }, negocios: negociosNuevo(), materiales: {}, cosas: {}, entradas: {}, aldea: { pobladores: [] }, genteCampo: GC.genteCampoNueva() });
const tengoDe = (p) => (donde, k) => (donde === 'material' ? p.materiales[k] || 0 : donde === 'cosa' ? p.cosas[k] || 0 : p.entradas[k]?.cantidad || 0);
const darle = (p, donde, k, n2) => { if (donde === 'material') p.materiales[k] = (p.materiales[k] || 0) + n2; else if (donde === 'cosa') p.cosas[k] = (p.cosas[k] || 0) + n2; else { p.entradas[k] = p.entradas[k] || { dia: 1, hora: 0, cantidad: 0 }; p.entradas[k].cantidad += n2; } };
const aplicar = (p) => (efs) => { for (const f of efs) darle(p, f.tipo, f.k, f.n); };
// «antes de juntar»: el juego no conoce los materiales nuevos; «después»: sí (como si «recursos» los hubiera sumado)
// 4.6 (junta): BIENES ya trae los materiales de «recursos»; para simular el «antes» se los saca
const BIENES_ANTES = Object.fromEntries(Object.entries(BIENES).filter(([k]) => !TB.MATERIALES_ZONA.includes(k)));
const antes = (k) => TB.existeEnJuego(k, { tronco: {}, tabla: {}, piedra: {}, cristal: {}, lana: {} }, BIENES_ANTES);
const despues = (k) => TB.existeEnJuego(k, { tronco: {}, tabla: {}, piedra: {}, cristal: {}, lana: {}, junco: {}, hierbas: {}, arcilla: {}, cuero: {}, 'piedra-cantera': {} }, BIENES);

// ============================================================ 1. el tablón: distancias y pagos
{
  eq(TB.TABLON.aLaVista, 3, '3 encargos a la vista'); eq(TB.TABLON.entregasPorDia, 1, '1 entrega por día'); eq(TB.TABLON.plazo, 2, '2 días de plazo');
  const m = Object.fromEntries(Object.keys(TB.ORIGENES).map((k) => [k, TB.multiplicadorDe(k)]));
  eq(m, { mallin: 1.5, galpon: 1.5, desembocadura: 2, cabana: 2, cantera: 2, pehuenal: 2, arrayanes: 2.5, puestoAlto: 2.5 }, 'el multiplicador de cada lugar, por su distancia a la plaza');
  for (const [k, o] of Object.entries(TB.ORIGENES)) {
    const d = TB.distanciaAPlaza(o), mult = TB.multiplicadorDe(k);
    ok(mult === (d <= 350 ? 1.5 : d <= 550 ? 2 : 2.5), `${k}: ${d} m → ×${mult}`);
  }
  ok(TB.distanciaAPlaza(TB.ORIGENES.mallin) > 300 && TB.distanciaAPlaza(TB.ORIGENES.arrayanes) > 550, 'todo lo que pide el tablón queda lejos de la plaza (más de 300 m)');
  const pagos = [];
  for (const e of TB.ENCARGOS_TABLON) {
    const pago = TB.pagoDe(e.k, e.n, e.origen);
    pagos.push(pago);
    ok(pago >= 700 && pago <= 2200 && pago % 50 === 0, `${e.id}: paga $${pago} (entre $700 y $2.200, redondo)`);
    // lo que paga un pedido del pueblo por lo mismo (pedidos.js: lotes × valor × 1,10), por el multiplicador del lugar (salvo el tope)
    const pueblo = e.n * TB.valorUnidad(e.k) * PEDIDOS.base;
    ok(pago >= Math.min(700, pueblo * 1.5) - 50 && pago <= Math.max(700, pueblo * 2.5) + 50, `${e.id}: entre ×1,5 y ×2,5 lo de un pedido del pueblo ($${Math.round(pueblo)})`);
    ok(Object.hasOwn(TB.ORIGENES, e.origen) && e.quien.length === 2 && e.para, `${e.id}: lugar, quién y para qué`);
  }
  // 4.6 (junta): con los BIENES de «recursos» el junco vale lo de comercio.js y el más barato quedó en $750 (antes $700, con el valor de respaldo)
  ok(Math.min(...pagos) <= 800 && Math.max(...pagos) === 2200, 'el más barato paga cerca de $700 y el más caro $2.200');
  ok(new Set(TB.ENCARGOS_TABLON.map((e) => e.origen)).size >= 7, 'salen de siete lugares distintos o más');
  ok(TB.ENCARGOS_TABLON.some((e) => TB.multiplicadorDe(e.origen) === 2.5) && TB.ENCARGOS_TABLON.some((e) => TB.multiplicadorDe(e.origen) === 1.5), 'hay de los tres tramos');
  // los materiales nuevos: sólo cuando el juego los conoce
  for (const k of TB.MATERIALES_ZONA) { ok(!antes(k) && despues(k), `${k}: aparece recién al juntar con «recursos»`); }
  for (const k of ['lana', 'trucha-fresca', 'pinon', 'yerba', 'calafate-seco']) ok(antes(k), `${k}: existe desde ya`);
}

// ============================================================ 2. el tablón: la vista del día, tomar, plazos, entregar y el tope
{
  const ctxA = { existe: antes, estacion: 'verano' }, ctxD = { existe: despues, estacion: 'otono' };
  const t = TB.tablonNuevo();
  for (let d = 1; d <= 120; d++) {
    for (const c of [ctxA, ctxD]) {
      const v = TB.aLaVista(t, d, c);
      eq(v.length, 3, `día ${d}: tres a la vista`);
      eq(new Set(v.map((x) => x.id)).size, 3, `día ${d}: tres distintos`);
      ok(v.every((x) => c.existe(x.k)), `día ${d}: sólo cosas que el juego conoce`);
      if (c.estacion !== 'otono') ok(!v.some((x) => x.k === 'pinon'), `día ${d}: piñones sólo en otoño`);
    }
    eq(TB.aLaVista(t, d, ctxA), TB.aLaVista(t, d, ctxA), `día ${d}: lo mismo cada vez que lo mirás`);
  }
  const dias = new Set();
  for (let d = 1; d <= 30; d++) dias.add(TB.aLaVista(t, d, ctxD).map((x) => x.tpl).join());
  ok(dias.size >= 20, 'cambia por día');
  ok([...Array(60)].some((_, i) => TB.aLaVista(t, i + 1, ctxD).some((x) => x.k === 'pinon')), 'en otoño, alguna vez piden piñones');
  // tomar
  const p = relax(0, 5);
  const tb = p.genteCampo.tablon;
  const vista = TB.aLaVista(tb, 5, ctxD);
  const r1 = TB.tomar(tb, vista[0].id, 5, ctxD);
  ok(r1.ok && r1.encargo.hasta === 6 && r1.encargo.desde === 5, 'tomado el día 5: hasta el 6 (dos días)');
  eq(TB.aLaVista(tb, 5, ctxD).length, 2, 'tomar uno no trae otro: quedan dos a la vista');
  ok(!TB.tomar(tb, vista[0].id, 5, ctxD).ok, 'no se toma dos veces');
  ok(TB.tomar(tb, vista[1].id, 5, ctxD).ok, 'se pueden tener dos');
  const r3 = TB.tomar(tb, vista[2].id, 5, ctxD);
  ok(!r3.ok && r3.motivo === 'lleno', 'pero no tres');
  // entregar
  const tengo = tengoDe(p);
  const x = tb.tomados[0];
  const sin = TB.entregar(p, tb, x.id, 5, tengo);
  ok(!sin.ok && sin.motivo === 'falta', 'sin lo pedido, no se entrega');
  darle(p, TB.dondeDe(x.k), x.k, x.n);
  const e1 = TB.entregar(p, tb, x.id, 5, tengo);
  ok(e1.ok && e1.pago === x.pago && pesosDe(p) === x.pago, `entregado: cobrás $${x.pago} por la economía`);
  ok(p.economia.libro.some((mv) => mv.monto === x.pago && /tablón/.test(mv.motivo)), 'queda en el libro de la billetera');
  aplicar(p)(e1.efectos);
  eq(tengo(TB.dondeDe(x.k), x.k), 0, 'lo entregado se descuenta');
  const y = tb.tomados[0];
  darle(p, TB.dondeDe(y.k), y.k, y.n);
  const e2 = TB.entregar(p, tb, y.id, 5, tengo);
  ok(!e2.ok && e2.motivo === 'cupo', 'una sola entrega por día');
  const e3 = TB.entregar(p, tb, y.id, 6, tengo);
  ok(e3.ok, 'al otro día, sí (todavía en plazo)');
  eq(tb.hechos, 2, 'dos hechos');
  // vencer
  const z = TB.aLaVista(tb, 7, ctxD)[0];
  TB.tomar(tb, z.id, 7, ctxD);
  eq(TB.tablonDe(tb, 8).length, 0, 'el día 8 todavía no vence (tomado el 7)');
  const venc = TB.tablonDe(tb, 9);
  ok(venc.length === 1 && tb.tomados.length === 0, 'el día 9 se venció y se borró, sin castigo');
  eq(pesosDe(p), x.pago + y.pago, 'ningún peso de más ni de menos');
  // las filas del panel
  const q = relax(0, 10);
  const filas = TB.filasTablon(q.genteCampo.tablon, 10, ctxD, tengoDe(q));
  ok(filas.length === 3 && filas.every((f) => f.tipo === 'tomar' && f.puede && /\$\d/.test(f.titulo) && /m, ×/.test(f.detalle)), 'el panel: tres para tomar, con el pago, la distancia y el multiplicador');
  sinRotos(filas, 'filas');
  ok(filas.every((fi) => !/[Dd]e el/.test(fi.detalle)), 'sin «de el» (del mallín, del pehuenal)');
  eq(TB.deLugar('el mallín'), 'del mallín', '«del»'); eq(TB.deLugar('la cantera'), 'de la cantera', '«de la»');
  TB.tomar(q.genteCampo.tablon, filas[0].id, 10, ctxD);
  const f2 = TB.filasTablon(q.genteCampo.tablon, 10, ctxD, tengoDe(q));
  ok(f2[0].tipo === 'entregar' && !f2[0].puede && /tenés 0/.test(f2[0].estado) && f2.length === 3, 'arriba, lo tomado para entregar');
  // lo que suma por día: entregando uno por día el de mejor pago, 120 días
  const s = relax(0, 1);
  let total = 0;
  for (let d = 1; d <= 120; d++) {
    const v = TB.aLaVista(s.genteCampo.tablon, d, { existe: despues, estacion: d % 90 < 30 ? 'otono' : 'verano' });
    const mejor = v.sort((a, b) => b.pago - a.pago)[0];
    total += mejor.pago;
  }
  const porDia = total / 120;
  ok(porDia >= 1000 && porDia <= 2000, `entregando todos los días el mejor: ~$${Math.round(porDia)}/día (entre $1.000 y $2.000, sobre los ~$3.200 de hoy)`);
  ok(2200 * TB.TABLON.entregasPorDia < 3200, 'el tope del día ($2.200) no llega a lo que dan hoy los jornales');
}

// ============================================================ 3. los pedidos de la gente del campo
{
  const personas = [...GC.CLAVES_CAMPO, ...GC.VALLE_CON_TRATO];
  eq(GC.CLAVES_CAMPO, ['fermin', 'belisario', 'tobias'], 'tres personas nuevas: el pastor, el arriero y el cantero');
  eq([GC.PERSONAS_CAMPO.fermin.oficio, GC.PERSONAS_CAMPO.belisario.oficio, GC.PERSONAS_CAMPO.tobias.oficio], ['pastor', 'arriero', 'cantero'], 'sus oficios');
  for (const k of personas) {
    const l = GC.LISTA_PEDIDOS[k];
    ok(l.length >= 2 && l.length <= 3, `${k}: 2 o 3 pedidos`);
    for (const x of l) {
      const pago = GC.pagoPedido(x.k, x.n);
      ok(pago >= 300 && pago <= 1200, `${x.id}: paga $${pago} (como un pedido del pueblo, un poco más)`);
      ok(x.pide.length > 30 && x.gracias.length > 10, `${x.id}: lo dice con su voz`);
    }
  }
  const p = relax(0, 3);
  const g = p.genteCampo;
  const ped = GC.pedidoCampo(g, 'nicanor', 3, antes);
  ok(ped && GC.pedidoCampo(g, 'nicanor', 4, antes).id === ped.id && ped.hasta === 4, 'un pedido por ventana de dos días');
  const tengo = tengoDe(p);
  ok(GC.puedeEntregarCampo(p, g, 'nicanor', 3, tengo, antes).motivo === 'falta', 'sin lo que pide, no');
  darle(p, ped.donde, ped.k, ped.n);
  p.negocios.hoy = { dia: 3, jornales: 0, pedidos: PEDIDOS.porDia };
  ok(GC.puedeEntregarCampo(p, g, 'nicanor', 3, tengo, antes).motivo === 'cupo', 'con los dos pedidos de los vecinos ya entregados hoy, no (el mismo tope)');
  p.negocios.hoy.pedidos = 1;
  const v = GC.puedeEntregarCampo(p, g, 'nicanor', 3, tengo, antes);
  ok(v.ok, 'con lugar en el tope, sí');
  GC.anotarEntregaCampo(p, g, 'nicanor', 3, v.pedido);
  eq(p.negocios.hoy.pedidos, 2, 'cuenta en el tope de los vecinos');
  ok(GC.pedidoCampo(g, 'nicanor', 4, antes) === null && GC.pedidoCampo(g, 'nicanor', 5, antes), 'entregado: hasta la ventana que viene no pide');
  ok(GC.LISTA_PEDIDOS.belisario.some((x) => x.k === 'pinon'), 'el arriero compra piñones');
}

// ============================================================ 4. las tienditas
{
  const p = relax(0, 2);
  const g = p.genteCampo;
  const ctx = { existe: despues, tiene: (k) => !!p.cosas[k], nivel: () => 0 };
  for (const k of [...GC.CLAVES_CAMPO, ...GC.VALLE_CON_TRATO]) ok(GC.TIENDAS[k].length >= 3 && GC.tiendaDe(g, k, 2, ctx).length >= 3, `${k}: una tiendita con tres cosas o más`);
  // ningún precio por debajo de lo que paga el mejor puesto del tren (lo pide, el día caro, sin vender antes): no se revende
  for (const [k, lista] of Object.entries(GC.TIENDAS)) for (const c of lista) {
    if (!Object.hasOwn(BIENES, c.k)) continue;
    const vale = TB.valorUnidad(c.k) * c.n, mejorPuesto = vale * COMERCIO.caro * 1.12 * (1 - COMERCIO.margen);
    ok(c.precio >= mejorPuesto * 0.95, `${k}/${c.id}: $${c.precio} no se revende en un puesto (paga como mucho ~$${Math.round(mejorPuesto)})`);
  }
  ok(GC.TIENDAS.nicanor.some((c) => c.k === 'trucha-fresca') && GC.TIENDAS.nicanor.some((c) => c.k === 'mosca'), 'Nicanor: truchas y carnada con mosca');
  ok(GC.TIENDAS.ema.some((c) => /^semillas/.test(c.k)) && GC.TIENDAS.ema.some((c) => c.tipo === 'dato') && GC.TIENDAS.ema.some((c) => c.k === GC.HERRAMIENTAS_CAMPO.hoz), 'Josefina: semillas, datos del valle y la hoz');
  ok(GC.TIENDAS.fermin.some((c) => c.k === 'lana') && GC.TIENDAS.fermin.some((c) => c.k === 'cuero'), 'Fermín: lana y cuero');
  ok(GC.TIENDAS.tobias.some((c) => c.k === GC.HERRAMIENTAS_CAMPO.pico && c.requiere?.oficio === 'picapedrero' && c.requiere.nivel === 3), 'Tobías: el pico de cantero, con picapedrero nivel 3');
  // el cuero (material nuevo) recién al juntar
  ok(!GC.tiendaDe(g, 'fermin', 2, { ...ctx, existe: antes }).some((c) => c.k === 'cuero') && GC.tiendaDe(g, 'fermin', 2, ctx).some((c) => c.k === 'cuero'), 'el cuero, recién cuando el juego lo conoce');
  // un poco por día
  const truchas = GC.tiendaDe(g, 'nicanor', 2, ctx).find((c) => c.id === 'truchas');
  for (let i = 0; i < truchas.porDia; i++) GC.anotarCompra(g, 'nicanor', 'truchas', 2);
  ok(!GC.tiendaDe(g, 'nicanor', 2, ctx).find((c) => c.id === 'truchas').puede && GC.tiendaDe(g, 'nicanor', 3, ctx).find((c) => c.id === 'truchas').puede, 'las truchas se acaban por hoy y mañana hay');
  p.cosas.mosca = 1;
  ok(!GC.tiendaDe(g, 'nicanor', 3, ctx).some((c) => c.id === 'mosca'), 'lo que se compra una vez, si ya lo tenés, no aparece');
  ok(!GC.tiendaDe(g, 'tobias', 3, ctx).find((c) => c.id === 'pico').puede && GC.tiendaDe(g, 'tobias', 3, { ...ctx, nivel: () => 3 }).find((c) => c.id === 'pico').puede, 'el pico de cantero, recién con picapedrero nivel 2');
  const d1 = GC.datoDelValle(g), d2 = GC.datoDelValle(g);
  ok(d1 !== d2 && GC.DATOS_VALLE.includes(d1), 'los datos del valle, uno distinto cada vez');
}

// ============================================================ 5. la charla (con un contexto de mentira)
{
  const p = relax(5000, 4);
  p.oficios = {};
  const notas = [], herramientas = [];
  let nivel = 0;
  const cj = crearGenteCampoJuego({
    progreso: () => p, desafio: () => false, dia: () => p.dia, horas: () => 10, lluvia: () => 0, existe: despues,
    cantidad: tengoDe(p), aplicar: aplicar(p), tiene: (k) => (p.cosas[k] || 0) > 0, nivel: () => nivel,
    pagar: (m, mot, con) => { if (p.economia.pesos < m) return false; p.economia.pesos -= m; return true; }, cobrar: (m) => { p.economia.pesos += m; },
    darHerramienta: (id) => { herramientas.push(id); p.cosas[id] = 1; return true; }, nota: (t, s) => notas.push(`${t} · ${s}`), guardar: () => {}, refrescarBarra: () => {},
  });
  ok(cj.esDeCampo('fermin') && !cj.esDeCampo('nicanor') && cj.tieneTrato('nicanor') && cj.tieneTrato('ema') && !cj.tieneTrato('ramon'), 'quién es del campo y quién tiene trato');
  const s = cj.sesion({ clave: 'fermin' });
  ok(s?.campo && /majada/.test(s.saludo), 'Fermín: su sesión de charla, con su saludo de la mañana');
  ok(p.genteCampo.conocidos.fermin === 4, 'queda anotado el día que lo conociste');
  const op = cj.opciones('fermin').map((o) => o.id);
  eq(op, ['campo:historia', 'campo:pedido', 'campo:tienda'], 'Fermín: su historia, su pedido y su tiendita');
  ok(cj.opciones('nicanor').every((o) => o.id !== 'campo:historia') && cj.opciones('nicanor').some((o) => o.id === 'campo:tienda'), 'Nicanor: pedido y tiendita (sus historias son las de siempre)');
  eq(cj.opciones('ramon'), [], 'Don Ramón: lo de siempre');
  // historia
  const h = cj.elegir(s, 'campo:historia');
  ok(h.tipo === 'historia' && h.historia.partes.length === 3 && p.genteCampo.historias.fermin === 1, 'cuenta una historia de tres renglones y queda anotada');
  ok(cj.opciones('fermin')[0].titulo.includes(GC.HISTORIAS_CAMPO.fermin[1].titulo), 'la próxima vez, la siguiente');
  // tienda
  const t = cj.elegir(s, 'campo:tienda');
  ok(t.tipo === 'menu' && t.sub.opciones.length >= 4 && t.sub.opciones.at(-1).id === 'volver', 'Comprarle algo…: el submenú con «Mejor no»');
  const antesPesos = p.economia.pesos;
  const c = cj.elegir(s, 'campo:comprar:lana');
  ok(c.tipo === 'renglones' && p.materiales.lana === 2 && p.economia.pesos === antesPesos - 850, 'comprar dos vellones: $850 y la lana en la mochila');
  const e = cj.elegir(s, 'campo:comprar:esquiladora');
  ok(e.tipo === 'renglones' && herramientas.includes(GC.HERRAMIENTAS_CAMPO.esquiladora), 'la esquiladora, por el enganche de las herramientas');
  ok(!cj.elegir(s, 'campo:tienda').sub.opciones.some((o) => o.id === 'campo:comprar:esquiladora'), 'y ya no se ofrece');
  p.economia.pesos = 100;
  const sinPlata = cj.elegir(s, 'campo:comprar:lana');
  ok(/Te faltan \$750/.test(sinPlata.renglones[0]) && p.materiales.lana === 2, 'sin plata no hay trato (y dice cuánto falta)');
  // el pico de cantero
  p.economia.pesos = 9000;
  const st = cj.sesion({ clave: 'tobias' });
  const pi = cj.elegir(st, 'campo:comprar:pico');
  ok(/picapedrero nivel 3/.test(pi.renglones[0]) && !herramientas.includes(GC.HERRAMIENTAS_CAMPO.pico), 'el pico de cantero, sin el oficio, no');
  nivel = 3;
  cj.elegir(st, 'campo:comprar:pico');
  ok(herramientas.includes(GC.HERRAMIENTAS_CAMPO.pico) && p.economia.pesos === 9000 - 4000, 'con picapedrero nivel 3, sí: $4.000');
  // el dato de Josefina
  const se = { clave: 'ema' };
  const dato = cj.elegir(se, 'campo:comprar:dato');
  ok(GC.DATOS_VALLE.includes(dato.renglones[0]), 'Josefina te cuenta un dato del valle');
  // el pedido
  const ped = GC.pedidoCampo(p.genteCampo, 'fermin', 4, despues);
  const falta = cj.elegir(s, 'campo:pedido');
  ok(falta.renglones[0] === ped.pide && /hasta el día/.test(falta.renglones[1]), 'sin lo que pide, te lo pide con su voz');
  darle(p, ped.donde, ped.k, ped.n);
  ok(/^Entregarle/.test(cj.opciones('fermin').find((o) => o.id === 'campo:pedido').titulo), 'con lo pedido encima, la opción dice «Entregarle…»');
  const pesos0 = p.economia.pesos;
  const da = cj.elegir(s, 'campo:pedido');
  ok(da.renglones[0] === ped.gracias && p.economia.pesos === pesos0 + ped.pago && tengoDe(p)(ped.donde, ped.k) === 0, 'entregado: las gracias, el pago y lo entregado se descuenta');
  ok(!cj.opciones('fermin').some((o) => o.id === 'campo:pedido'), 'y no pide más hasta la otra ventana');
  sinRotos(notas, 'notas');
  // en el Desafío, nada
  const d = crearGenteCampoJuego({ progreso: () => ({ ...relax(), modo: 'desafio' }), desafio: () => true });
  ok(d.sesion({ clave: 'fermin' }) === null && d.opciones('nicanor').length === 0, 'en el Desafío no hay nada de esto');
}

// ============================================================ 6. la rueda y vecindad-juego
{
  eq(categoriaDeOpcion('campo:pedido'), 'trato', 'el pedido va en «Pedidos y compras»');
  eq(categoriaDeOpcion('campo:tienda'), 'trato', 'la tiendita también');
  eq(categoriaDeOpcion('campo:historia'), 'charla', 'la historia, en «Charlar»');
  ok(CATEGORIAS_VISTA.trato?.nombre === 'Pedidos y compras' && CATEGORIAS_VISTA.trato.icono === 'canasta', 'la categoría nueva, con su ícono');
  // con las reglas sociales (Nicanor y Josefina son vecinos): lo del campo en su categoría, no en «Charlar»
  const S = await import('../src/vecindad-social.js');
  ok(S.CATEGORIAS_RUEDA.some((c) => c.id === 'trato' && c.icono === 'canasta'), 'la vida social conoce «Pedidos y compras»');
  const gr = S.opcionesRueda('nicanor', { modo: 'relax', dia: 3, vecindad: (await import('../src/vecindad.js')).vecindadNueva() }, { menu: [{ id: 'como-andas', titulo: '¿Cómo andás?' }, { id: 'campo:pedido', titulo: 'Su pedido' }, { id: 'campo:tienda', titulo: 'Comprarle algo…' }] });
  const trato = gr.find((g) => g.categoria === 'trato');
  ok(trato && trato.opciones.map((o) => o.id).join() === 'campo:pedido,campo:tienda' && !gr.find((g) => g.categoria === 'charla').opciones.some((o) => /^campo:/.test(o.id)), 'Nicanor: el pedido y la tiendita en «Pedidos y compras»');
  eq(iconoDeOpcion('campo:comprar:pico', 'Pico de cantero · $4.000'), 'herramienta', 'el pico, con el ícono de herramienta');
  eq(iconoDeOpcion('campo:comprar:truchas', 'Dos truchas frescas · $700'), 'pez', 'las truchas, con el pez');
  const vj = leer('src/vecindad-juego.js');
  ok(vj.includes('if (!clave) return ctx.campo?.sesion?.(npc) || null;'), 'vecindad-juego: la sesión de la gente del campo');
  ok(vj.includes("if (s.campo) { for (const o of ctx.campo?.opciones?.(s.clave) || []) lista.push(o); lista.push({ id: 'chau', titulo: TITULOS.chau }); return lista; }"), 'su menú corto');
  ok(vj.includes('for (const o of ctx.campo?.opciones?.(s.clave) || []) lista.push(o);   // 4.6 gente: el pedido y la tiendita de Nicanor y Josefina'), 'Nicanor y Josefina: lo suyo antes de «chau»');
  ok(vj.includes("if (/^campo:/.test(String(id)) && ctx.campo) {"), 'elegir: lo del campo');
  // con el juego de la vecindad de verdad
  const { crearVecindadJuego } = await import('../src/vecindad-juego.js');
  const p = relax(3000, 2);
  p.vecindad = (await import('../src/vecindad.js')).vecindadNueva();
  const cj = crearGenteCampoJuego({ progreso: () => p, desafio: () => false, dia: () => p.dia, existe: despues, cantidad: tengoDe(p), aplicar: aplicar(p), pagar: () => true, cobrar: () => {} });
  const vj2 = crearVecindadJuego({ campo: cj, progreso: () => p, desafio: () => false });
  const s = vj2.abrir({ clave: 'tobias' });
  ok(s?.campo && s.clave === 'tobias', 'abrir con Tobías: su sesión');
  const m = vj2.menu(s);
  eq(m.opciones.map((o) => o.id), ['campo:historia', 'campo:pedido', 'campo:tienda', 'chau'], 'su menú: historia, pedido, tiendita y chau');
  const r = vj2.elegir(s, 'campo:tienda');
  ok(r.tipo === 'menu' && s.sub?.tipo === 'campo-tienda', 'la tiendita abre su submenú');
  const v = vj2.elegir(s, 'volver');
  ok(v.tipo === 'menu' && s.sub === null, '«Mejor no» vuelve');
  const sn = vj2.abrir({ clave: 'nicanor' });
  const mn = vj2.menu(sn).opciones.map((o) => o.id);
  ok(mn.includes('campo:tienda') && mn.includes('como-andas') && mn.at(-1) === 'chau', 'Nicanor: su menú de siempre, con la tiendita y el pedido');
}

// ============================================================ 7. el guardado
{
  const nueva = GC.sanearGenteCampo(undefined, 3);
  eq(nueva, GC.genteCampoNueva(), 'una partida de antes: vacío');
  const roto = GC.sanearGenteCampo({
    tablon: { dia: 1e9, quitados: [1, 'x|1', null], tomados: [{ id: 'a|1', tpl: 'lana-tejer', k: 'lana', n: -4, pago: 1e9, origen: 'galpon', desde: 99, hasta: 1e8 }, { id: 'b', tpl: 'x', k: 'y', origen: 'marte' }, 7, { id: 'c|1', tpl: 'c', k: 'pinon', n: 3, pago: 700, origen: 'pehuenal', desde: 1, hasta: 2 }, { id: 'd|1', tpl: 'd', k: 'lana', n: 3, pago: 700, origen: 'galpon', desde: 1, hasta: 2 }], entregas: 'x', hechos: -3 },
    pedidos: { nicanor: 4, ramon: 2, fermin: 'x', __proto__: 1 }, tienda: { dia: 99, compras: { 'nicanor|truchas': 5, 'otro|x': 3, 'fermin|lana': -1 } }, historias: { tobias: 99, nadie: 1 }, datos: -1, conocidos: { belisario: 50 },
  }, 10);
  sinRotos(roto, 'roto');
  ok(roto.tablon.dia <= 10 && roto.tablon.tomados.length === 2 && roto.tablon.tomados[0].pago <= 2200 && roto.tablon.tomados[0].n >= 1 && roto.tablon.tomados[0].hasta === roto.tablon.tomados[0].desde + 1, 'el tablón roto: fechas acotadas, a lo sumo dos tomados, pago con techo, plazo de dos días');
  ok(roto.tablon.quitados.every((x) => typeof x === 'string') && roto.tablon.entregas.n === 0 && roto.tablon.hechos === 0, 'lo demás del tablón, saneado');
  eq(roto.pedidos, { nicanor: 4 }, 'pedidos: sólo de quien tiene trato y con número');
  eq(roto.tienda, { dia: 10, compras: { 'nicanor|truchas': 5 } }, 'la tienda: sólo lo válido');
  eq(roto.historias, { tobias: 10 }, 'historias: sólo de quien tiene trato, acotadas');
  ok(roto.datos === 0 && roto.conocidos.belisario === 10, 'datos y conocidos, acotados');
  // ida y vuelta por la partida
  const almacen = new Map();
  globalThis.localStorage = { getItem: (kk) => (almacen.has(kk) ? almacen.get(kk) : null), setItem: (kk, v) => almacen.set(kk, String(v)), removeItem: (kk) => almacen.delete(kk), key: () => null, length: 0 };
  const G = await import('../src/guardado.js');
  G.usarModoGuardado('relax', 1);
  const pn = G.progresoNuevo();
  ok(pn.genteCampo && pn.genteCampo.tablon.tomados.length === 0, 'partida nueva del Relax: el tablón vacío');
  const con = JSON.parse(JSON.stringify(pn)); con.dia = 6;
  con.genteCampo.tablon.tomados = [{ id: 'lana-tejer|5', tpl: 'lana-tejer', k: 'lana', n: 3, pago: 1500, origen: 'galpon', quien: 'modista', desde: 5, hasta: 6 }];
  con.genteCampo.pedidos = { fermin: 2 }; con.genteCampo.historias = { tobias: 1 };
  G.escribirPartida('relax', 1, con);
  const l = G.leerPartida('relax', 1), pl = l?.progreso || l;
  eq(pl.genteCampo.tablon.tomados, con.genteCampo.tablon.tomados, 'lo tomado sobrevive al guardado');
  ok(pl.genteCampo.pedidos.fermin === 2 && pl.genteCampo.historias.tobias === 1, 'y los pedidos y las historias');
  const vieja = JSON.parse(JSON.stringify(con)); delete vieja.genteCampo;
  G.escribirPartida('relax', 1, vieja);
  const l2 = G.leerPartida('relax', 1), p2 = l2?.progreso || l2;
  eq(p2.genteCampo, GC.genteCampoNueva(), 'una partida de la 4.5 (sin el campo nuevo) carga con todo vacío');
  eq(p2.dia, 6, 'y lo demás queda como estaba');
  G.usarModoGuardado('desafio', 1);
  ok(G.progresoNuevo().genteCampo === undefined, 'el Desafío no trae nada de esto');
  const gu = leer('src/guardado.js');
  ok(gu.includes("limpio.genteCampo = modoPartida === 'desafio' ? undefined : sanearGenteCampo(p.genteCampo, limpio.dia);"), 'guardado.js: el bloque de 4.6 gente');
}

// ============================================================ 8. lo enganchado en main.js
{
  const main = leer('src/main.js');
  const tecla = main.slice(main.indexOf("case 'KeyE': {"), main.indexOf("case 'Tab':"));
  const aviso = main.slice(main.indexOf('let aviso = objetivo ?'), main.indexOf('mostrarAviso(aviso);'));
  const tt = tecla.indexOf('tablonJuego.accion(js)'), tm = tecla.indexOf('mecanicasAldea.accion(js)'), to = tecla.indexOf('aldeaGente.obraCerca(js.pos)');
  ok(tt > to && tt < tm, 'E: el tablón, después de la obra de la aldea y antes de lo de cada lugar');
  const at = aviso.indexOf('cacheTablon.texto'), am = aviso.indexOf('cacheMecanica.texto'), ao = aviso.indexOf('aldeaGente.avisoObra(cacheObraAldea)');
  ok(at > ao && at < am, 'el aviso, en el mismo lugar');
  ok(main.includes('cacheTablon = tablonJuego ? tablonJuego.accion(js) : null;   // 4.6 gente'), 'el aviso usa la misma función');
  ok(main.includes('if (tablonJuego?.abierto() && tablonJuego.tecla(codigo)) return;'), 'con el tablón abierto, sus teclas');
  ok(main.includes('if (tablonJuego?.abierto()) aviso = null;'), 'con el tablón abierto, sin aviso');
  ok(main.includes("try { if (modo === 'jugando' && !desafio) { genteCampoMundo?.actualizar(dt, js, charla.npc); tablonJuego?.actualizar(js); } } catch (e) { fallaSistema('gente-campo', e); }"), 'cada cuadro, aislado y sólo en el Relax');
  ok(main.includes("} catch (e) { fallaSistema('gente-campo-armado', e); genteCampoJuego = null; genteCampoMundo = null; tablonJuego = null; }"), 'el armado, aislado');
  ok(main.includes('campo: genteCampoJuego,   // 4.6 gente'), 'la vecindad recibe lo del campo');
  ok(main.includes('function darHerramientaDeZona(id) {'), 'el enganche de las herramientas de zona, con su respaldo');
  ok((main.match(/\/\/ 4\.6 gente/g) || []).length >= 8, 'los cambios de main.js, marcados «4.6 gente»');
}

// ============================================================ 9. la gente: ropa, textos, castellano
{
  for (const k of GC.CLAVES_CAMPO) {
    ok(Object.hasOwn(R.ASPECTO, k), `${k}: ropa y aspecto propios`);
    const a = R.aspectoGente(k, {}, {}, { invierno: true });
    ok(a.conocido && a.colores.poncho && a.colores.bufanda, `${k}: abrigado en invierno`);
    const p = GC.PERSONAS_CAMPO[k];
    ok(p.saludos.madrugada && p.saludos.manana && p.saludos.tarde && p.saludos.noche && p.saludos.lluvia && p.despedida, `${k}: saludos por la hora y despedida`);
    ok(GC.HISTORIAS_CAMPO[k].length === 2 && GC.HISTORIAS_CAMPO[k].every((h) => h.partes.length === 3), `${k}: dos historias cortas`);
  }
  // nombres que no chocan con los de la aldea
  const aldea = leer('src/aldea.js');
  for (const k of GC.CLAVES_CAMPO) ok(!aldea.includes(`'${GC.PERSONAS_CAMPO[k].completo}'`) && !new RegExp(`\\b${k}:`).test(aldea), `${k}: un nombre nuevo`);
  // todo en castellano (y nada explícito: no hay romance acá)
  const textos = JSON.stringify([GC.PERSONAS_CAMPO, GC.HISTORIAS_CAMPO, GC.LISTA_PEDIDOS, GC.TIENDAS, GC.DATOS_VALLE, TB.ENCARGOS_TABLON]);
  ok(!/(?<!\p{L})(the|and|with|you|your|buy|sell|quest)(?!\p{L})/iu.test(textos), 'todo en castellano');
  sinRotos(JSON.parse(textos), 'textos');
  // el mundo: sólo fijo y lejos de la plaza
  for (const [nom, q] of [['galpón', GC.GALPON_RESPALDO], ['puesto del paso', GC.PUESTO_PASO], ['cantera', GC.CANTERA]]) ok(Math.hypot(q.x - TB.PLAZA.x, q.z - TB.PLAZA.z) > 300, `${nom}: a más de 300 m de la plaza (nada nuevo carga la plaza)`);
  const mundo = leer('src/gente-campo-mundo.js');
  ok(mundo.includes('gente.armarPobladorDeAPoco(def)') && /ARMAR_A = 220/.test(mundo), 'las figuras se arman de a poco y recién al acercarte');
  const tm = leer('src/tablon-mundo.js');
  ok(tm.includes('malla.castShadow = false') && tm.includes('new THREE.MeshLambertMaterial({ vertexColors: true })'), 'el tablón: una malla sin sombra y con el material del puesto de la feria');
  for (const f of ['src/tablon.js', 'src/gente-campo.js', 'src/gente-campo-juego.js']) ok(!/from 'three'|document\.|window\./.test(leer(f)), `${f}: puro (sin three ni DOM)`);
  for (const f of ['src/tablon.js', 'src/gente-campo.js', 'src/gente-campo-juego.js', 'src/gente-campo-mundo.js', 'src/tablon-mundo.js']) ok(!leer(f).includes('\r'), `${f}: fines de línea LF`);
}

console.log(`verificar-4-6-gente: ${n} comprobaciones OK`);

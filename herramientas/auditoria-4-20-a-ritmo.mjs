// 4.20.0 (A): el ritmo de la plata por día y por hora, con los módulos reales (jornales, empleo, pedidos, abastecimiento, tablón, mercado de los puestos).
//   node herramientas/auditoria-4-20-a-ritmo.mjs [días] [--propuesta]
// Un día de juego son 30 minutos de reloj (ajuste «Duración del día», 20/30/45); durmiendo a tiempo se juegan unos 20 a 25 minutos por día.
// Cada fuente tiene su tope diario REAL (lo que dicen los módulos). Los minutos que lleva cada cosa son SUPUESTOS (no se midieron): están
// marcados y se pueden mover con las constantes de abajo; lo medido son los pesos.
// Con --propuesta se aplica en memoria la tabla de valores nuevos (ver AUDITORIA_4_20_0_A.md) y se vuelve a correr.
import { registrarThree } from '../pruebas/ayuda-three.mjs';

registrarThree();
const E = await import('../src/economia.js');
const N = await import('../src/negocios.js');
const T = await import('../src/trabajos.js');
const P = await import('../src/pedidos.js');
const V = await import('../src/aldea-viva.js');
const B = await import('../src/prestamos.js');
const C = await import('../src/comercio.js');
const M = await import('../src/mercado.js');
const NF = await import('../src/negocios-fx.js');
const EM = await import('../src/empleo.js');
const OF = await import('../src/oficios.js');
const TA = await import('../src/tablon.js');
// 4.23.0: los precios de las obras salen de los planos reales (antes eran constantes del informe: 916.300 y los de las metas)
const CN = await import('../src/construccion.js');
const OP = await import('../src/obra-pesos.js');
const valorMat = (k) => C.BIENES[k].valor * 100 / C.BIENES[k].lote;
const planoDe = (id) => { const p = CN.PLANOS.find((x) => x.id === id); return { pesos: OP.preciosDePlano(p).reduce((a, b) => a + b, 0), mat: Math.round(p.etapas.reduce((s, e) => s + Object.entries(e.pide || {}).reduce((q, [k, n]) => q + valorMat(k) * n, 0), 0)) }; };
const pesosDeTodas = CN.PLANOS.reduce((s, p) => s + OP.preciosDePlano(p).reduce((a, b) => a + b, 0), 0);
const costoDe = (id) => { const x = planoDe(id); return x.pesos + x.mat; };

const DIAS = Number(process.argv[2]) || 36;
const VARIANTE = (process.argv.find((a) => a.startsWith('--variante=')) || '').slice(11) || (process.argv.includes('--propuesta') ? 'final' : 'base');
const PROPUESTA = VARIANTE !== 'base';
const RESUMEN = process.argv.includes('--resumen');
const $ = (v) => '$' + Math.round(v).toLocaleString('es-AR');
const claves = Object.keys(T.TRABAJOS);

// ---------------------------------------------------------------- la tabla de valores nuevos (en memoria; no toca el juego)
if (PROPUESTA) {
  // (se llena en la segunda pasada del informe: ver el final de este archivo)
  const prop = await import('./auditoria-4-20-a-propuesta.mjs');
  prop.aplicar({ E, N, T, P, V, B, C, M, NF, EM, OF, TA }, VARIANTE);
}

// ---------------------------------------------------------------- supuestos de tiempo (segundos reales por acción) — NO medidos
export const SEG = {
  turno: 330,          // el turno dura de 3,2 a 4 horas de juego (8 tareas de 0,4 h): ~75 s por hora de juego, más fichar
  jornal: 60,          // caminar al vecino y la charla
  pedido: 45,          // entregar un pedido (la mercadería ya está en la mochila)
  tablon: 40,          // tomar y entregar el encargo (ídem)
  abasto: 45,
  puesto: 150,         // ir a un puesto de la trochita, vender o comprar (andén incluido)
};

// ---------------------------------------------------------------- un día de cada política
const mundo = () => {
  const p = { modo: 'relax', dia: 1, horas: 12, cosas: {}, materiales: {}, entradas: {}, economia: E.economiaNueva(), oficios: OF.oficiosNuevos(), comercio: C.comercioNuevo(), tablon: TA.tablonNuevo() };
  return p;
};
const dar = (p, bien, cant) => { const b = C.BIENES[bien]; if (b.donde === 'material') p.materiales[bien] = (p.materiales[bien] || 0) + cant; else if (b.donde === 'entrada') p.entradas[bien] = { dia: 1, hora: 1, cantidad: ((p.entradas[bien]?.cantidad) || 0) + cant }; else p.cosas[bien] = (p.cosas[bien] || 0) + cant; };
const aPesos = (u) => Math.round(u * 100);
const factor = (p, nombre, bien, dia) => M.factorDe(M.tienda(p.comercio, nombre, dia), nombre, bien) * V.factorEvento(dia, NF.temporadaDelDia(dia), bien);
const PARADAS = ['Estación del Valle', 'Parada del Mallín', 'Apeadero del Faro', 'Parada Arrayanes', 'Parada Alta', 'Parada del Molino', 'Apeadero de la Casa de Té', 'Parada del Mirador', 'Apeadero del Pescador', 'Parada del Bosque', 'Aldea de los Duendes'];

// lo que cuesta comprar `n` de `bien` hoy en el puesto más barato (con el corrimiento por lote); 0 si no se consigue
function costoDeComprar(p, bien, n, dia) {
  const lote = C.BIENES[bien].lote, lotes = Math.ceil(n / lote);
  let mejor = Infinity;
  for (const nombre of [...PARADAS, 'Puesto de la Cantera', 'Puesto del Paso', 'Puesto de la Estepa', 'Puesto del Riel Sur']) {
    if (!C.bienesDe(nombre).includes(bien)) continue;
    const c = C.comercioDeHoy(JSON.parse(JSON.stringify(p.comercio)), dia);
    let tot = 0;
    for (let i = 0; i < lotes; i++) { const pr = C.precios(c, nombre, bien, dia, NF.temporadaDelDia(dia), factor(p, nombre, bien, dia)); if (pr.quedanCompra <= 0) { tot = Infinity; break; } tot += aPesos(pr.compra); c.hoy.comprados[`${nombre}|${bien}`] = (c.hoy.comprados[`${nombre}|${bien}`] || 0) + 1; }
    mejor = Math.min(mejor, tot);
  }
  return mejor;
}

// vende en un puesto lo que se puede de `solo` (mercadería infinita) y devuelve los pesos
function venderEn(p, nombre, dia, solo) {
  p.comercio = C.comercioDeHoy(p.comercio, dia);
  const m = M.tienda(p.comercio, nombre, dia);
  let total = 0;
  for (let v = 0; v < 200; v++) {
    let mejor = null;
    for (const b of C.bienesDe(nombre).filter((x) => solo.includes(x))) {
      const pr = C.precios(p.comercio, nombre, b, dia, NF.temporadaDelDia(dia), factor(p, nombre, b, dia));
      if (pr.quedanVenta <= 0 || !M.puedeComprarte(m, b, aPesos(pr.venta)).ok) continue;
      if (!mejor || pr.venta > mejor.v) mejor = { b, v: pr.venta };
    }
    if (!mejor) break;
    const r = C.vender(p.comercio, nombre, mejor.b, dia, NF.temporadaDelDia(dia), 1e9, factor(p, nombre, mejor.b, dia));
    if (!r.ok) break;
    M.registrarVenta(m, mejor.b, aPesos(r.precio));
    total += aPesos(r.precio);
  }
  return total;
}

// `o`: { turno, jornales (cuántos aprovecha), pedidos, abasto, tablon, mercado: { puestos: K, de: [bienes] } , nlocales: cuántos locales con jornal hay abiertos }
function jugar(o, n = DIAS) {
  const p = mundo();
  const por = { turno: 0, jornal: 0, pedido: 0, abasto: 0, tablon: 0, mercado: 0 };
  const seg = { turno: 0, jornal: 0, pedido: 0, abasto: 0, tablon: 0, mercado: 0 };
  const costos = { pedido: 0, abasto: 0, tablon: 0 };
  const dias = [];
  let ascendio = {};
  for (let d = 1; d <= n; d++) {
    p.dia = d;
    if (o.xp) for (const id of ['huertero', 'picapedrero', 'obrero']) OF.sumarXp(p.oficios, id, o.xp);   // el oficio sube con lo que hacés (cosechar, picar, construir)
    const temp = NF.temporadaDelDia(d);
    // los locales con jornal abiertos hoy (van llegando de a uno cada tanto): los primeros de la lista
    const abiertos = claves.slice(0, Math.min(claves.length, o.nlocales ? o.nlocales(d) : claves.length));
    V.cerrarCuentas(p, d, abiertos, temp);
    const dem = V.demandaDe(d, temp);
    const antes = () => E.pesosDe(p);
    const netoAntes = Object.values(por).reduce((a, b) => a + b, 0);
    if (o.turno && !EM.esDiaLibre(d)) {
      const k = EM.IDS_PUESTOS.slice().sort((a, b) => EM.sueldoDe(b, EM.escalonDe(p, b)) - EM.sueldoDe(a, EM.escalonDe(p, a)))[0];
      const a = antes();
      if (EM.fichar(p, k, d, EM.PUESTOS[k].desde).ok) { while (!EM.hacerTarea(p).terminado); const r = EM.cerrarTurno(p, 'completo'); if (r.ascendio) ascendio[r.ascendio.nombre] = ascendio[r.ascendio.nombre] || d; por.turno += antes() - a; seg.turno += SEG.turno; }
    }
    // jornales: los que mejor pagan primero
    if (o.jornales) {
      let hechos = 0;
      const orden = abiertos.slice().sort((a, b) => T.sueldoDe(p, b, dem) - T.sueldoDe(p, a, dem));
      for (const k of orden) { if (hechos >= o.jornales) break; const a = antes(); const r = T.cumplirJornal(p, k, d, 'x', dem); if (r.ok) { por.jornal += antes() - a; seg.jornal += SEG.jornal; hechos++; } }
    }
    if (o.pedidos) for (const k of abiertos) {
      const q = P.pedidoDe(p, k, d);
      if (!q) continue;
      const costo = costoDeComprar(p, q.k, q.n, d);
      if (!(q.premio > costo * 1.15)) continue;                                  // sólo si deja al menos un 15 %
      const r = P.cerrarPedido(p, k, d, 'x', true);
      if (r.ok) { por.pedido += r.premio - costo; costos.pedido += costo; seg.pedido += SEG.pedido; }
    }
    if (o.abasto) {
      const a = B.abastoDe(p, d);
      if (a) { const costo = costoDeComprar(p, a.k, a.n, d); if (a.premio > costo * 1.15) { dar(p, a.k, a.n); const r = B.cumplirAbasto(p, d); if (r.ok) { por.abasto += r.premio - costo; costos.abasto += costo; seg.abasto += SEG.abasto; } } }
    }
    if (o.tablon) {
      const t = p.tablon;
      TA.tablonDe(t, d);
      const vista = TA.aLaVista(t, d, { estacion: temp });
      let mejor = null;
      for (const e of vista) { const costo = costoDeComprar(p, e.k, e.n, d); const g = e.pago - (Number.isFinite(costo) ? costo : (TA.valorUnidad(e.k) * e.n)); if (!mejor || g > mejor.g) mejor = { e, g, costo }; }
      if (mejor && mejor.g > 0) { por.tablon += mejor.g; costos.tablon += mejor.e.pago - mejor.g; seg.tablon += SEG.tablon; }
    }
    if (o.mercado) {
      let hoy = 0;
      for (let i = 0; i < o.mercado.puestos; i++) hoy += venderEn(p, PARADAS[(d * 3 + i) % PARADAS.length], d, o.mercado.de || C.ID_BIENES);
      por.mercado += hoy; seg.mercado += o.mercado.puestos * SEG.puesto;
    }
    // la plata de hoy para la curva
    dias.push(Object.values(por).reduce((a, b) => a + b, 0) - netoAntes);
  }
  const total = Object.values(por).reduce((a, b) => a + b, 0), seg_total = Object.values(seg).reduce((a, b) => a + b, 0);
  return { por, seg, total, segTotal: seg_total, ascendio, dias };
}

const filas = [];
const casos = [
  ['A. sólo el turno (Historia tranquila)', { turno: true }],
  ['B. turno + 1 jornal', { turno: true, jornales: 1 }],
  ['C. turno + jornales + pedidos + abasto + tablón', { turno: true, jornales: 2, pedidos: true, abasto: true, tablon: true }],
  ['D. C + vender excedente en 3 puestos por día', { turno: true, jornales: 2, pedidos: true, abasto: true, tablon: true, mercado: { puestos: 3 } }],
  ['E. sólo mercado (vender en 3 puestos por día)', { mercado: { puestos: 3 } }],
  ['F. sólo jornales (los dos que mejor pagan)', { jornales: 2 }],
  ['G. sólo tablón', { tablon: true }],
  ['H. sólo pedidos y abasto (comprando la mercadería)', { pedidos: true, abasto: true }],
];
for (const [nombre, o] of casos) {
  // con 20 locales abiertos (pueblo completo) y con sólo 4 (los primeros días: ver aldea.js LLEGADA)
  const r = jugar({ ...o, nlocales: () => 20 });
  const r4 = jugar({ ...o, nlocales: (d) => 2 + Math.floor(d / 6) });
  filas.push({
    caso: nombre,
    pesosPorDia: Math.round(r.total / DIAS),
    pueblo_en_formacion: Math.round(r4.total / DIAS),
    minutosPorDia: +(r.segTotal / DIAS / 60).toFixed(1),
    pesosPorMinuto: r.segTotal ? Math.round(r.total / (r.segTotal / 60)) : '-',
    pesosPorHora: r.segTotal ? Math.round((r.total / DIAS) / (r.segTotal / DIAS / 3600)) : '-',
    detalle: Object.entries(r.por).filter(([, v]) => v > 0).map(([k, v]) => `${k} ${Math.round(v / DIAS)}`).join(' · '),
  });
}
console.log(`# El ritmo de la plata${PROPUESTA ? ' (CON LA PROPUESTA)' : ' (valores de hoy)'} — ${DIAS} días, día de 30 minutos\n`);
console.table(filas);
console.log('\npesosPorDia = con los 20 locales con jornal abiertos; pueblo_en_formacion = de 2 locales y uno más cada 6 días (el pueblo llega de a uno: ver aldea.js LLEGADA).');
console.log('minutosPorDia y pesosPorHora usan los SUPUESTOS de tiempo de SEG (no medidos).');

// ---------------------------------------------------------------- la curva de las primeras horas y cuánto tarda cada meta
const MIN_POR_DIA = 25;   // SUPUESTO: un día de 30 minutos, durmiendo a tiempo, se juega en ~20 a 25 minutos reales
const perfiles = [
  ['tranquilo (turno + 1 jornal)', { turno: true, jornales: 1, xp: 8, nlocales: (d) => 2 + Math.floor(d / 6) }],
  ['medio (todo menos vender excedente)', { turno: true, jornales: 2, pedidos: true, abasto: true, tablon: true, xp: 14, nlocales: (d) => 2 + Math.floor(d / 6) }],
  ['a fondo (con vender excedente)', { turno: true, jornales: 2, pedidos: true, abasto: true, tablon: true, mercado: { puestos: 3 }, xp: 20, nlocales: (d) => 2 + Math.floor(d / 6) }],
];
const LARGO = 400;
const curvas = perfiles.map(([nombre, o]) => { const r = jugar(o, LARGO); let s = 0; return { nombre, acum: r.dias.map((x) => (s += x)), r }; });
console.log('\n# Plata ganada (neta, sin gastar) a las 1, 2, 3, 6 y 10 horas de juego (' + MIN_POR_DIA + ' min por día) y por día\n');
const horas = [1, 2, 3, 6, 10];
console.table(curvas.map((c) => { const f = { perfil: c.nombre }; for (const h of horas) { const d = Math.max(1, Math.round((h * 60) / MIN_POR_DIA)); f[`${h} h (día ${d})`] = Math.round(c.acum[d - 1]); } f['por día, días 20-40'] = Math.round((c.acum[39] - c.acum[19]) / 20); f['por día, días 100-140'] = Math.round((c.acum[139] - c.acum[99]) / 40); return f; }));

// el catálogo en orden de compra y el día en que se alcanza, a precios de la economía (materiales a valor base)
const metas = [
  ['El pico comprado (almacén) + los $400 de las puntas', 1600], ['Escritura del lote de la Loma', 8000], ['Establo del caballo ($6.000 + materiales)', 6000 + 4500], ['Puesto propio en la feria', 6000],
  [`Telar grande (${$(planoDe('telar-grande').pesos)} + ${$(planoDe('telar-grande').mat)})`, costoDe('telar-grande')], ['Cabaña ($36.000 + $11.500)', 47500], [`Local de almacén propio (${$(planoDe('local-almacen').pesos)} + ${$(planoDe('local-almacen').mat)})`, costoDe('local-almacen')], ['Casa con galería ($66.000 + $18.150)', 84150],
  ['Planta alta ($64.000 + $30.100)', 94100], ['Casona ($110.000 + $27.300)', 137300],
];
let corrido = 0;
const g = [];
for (const [nombre, costo] of metas) { corrido += costo; const f = { meta: nombre, costo, acumuladoDeLaLista: corrido }; for (const c of curvas) { const d = c.acum.findIndex((x) => x >= corrido) + 1; f[c.nombre.split(' ')[0]] = d > 0 ? `día ${d} (${(d * MIN_POR_DIA / 60).toFixed(0)} h)` : '>400 días'; } g.push(f); }
console.log('\n# Día en que se llega a cada meta si se compra en este orden (y se gasta todo lo ganado en eso)\n');
console.table(g);
const total = pesosDeTodas + 212000 + 14000;   // 4.23.0: calculado (los planos con pesos, las tres casas, la escritura y el puesto)
const f = { 'todo el catálogo de obras con pesos (planos + casas + escritura + puesto)': total };
for (const c of curvas) { const d = c.acum.findIndex((x) => x >= total) + 1; f[c.nombre.split(' ')[0]] = d > 0 ? `día ${d} (${(d * MIN_POR_DIA / 60).toFixed(0)} h)` : '>400 días'; }
console.log('\nSólo los pesos de las obras (sin materiales ni negocios):'); console.table([f]);

if (RESUMEN) {
  const dia = (acum, costo) => { const d = acum.findIndex((x) => x >= costo) + 1; return d > 0 ? d : 999; };
  const cab = 47500, galeria = 233950 - 0, tot = pesosDeTodas + 212000 + 14000;
  console.log('RESUMEN ' + JSON.stringify({ variante: VARIANTE, perfiles: curvas.map((c) => ({ p: c.nombre.split(' ')[0], dia20_40: Math.round((c.acum[39] - c.acum[19]) / 20), dia3h: Math.round(c.acum[6]), telar67k: dia(c.acum, 26100 + costoDe('telar-grande')), cabana115k: dia(c.acum, 115000), casona465k: dia(c.acum, 465350), catalogo: dia(c.acum, tot) })) }));
}

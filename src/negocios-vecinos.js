// 4.4 · COMPRAR UN NEGOCIO DE UN VECINO Y SER SOCIO. Las reglas, sin DOM, sin three y sin el juego (se prueban en Node). Sólo en el Relax: sin economía
// (el Desafío) no hay nada de esto.
//
//   · ocho negocios con dueño en la aldea (el almacén de Ercilia, la casa de té de Ceinwen, la cantina de Lucrecia, la panadería de Rosa, la herrería de
//     Anselmo, la pescadería de Aurelio, la hilandería de Elvira y la sala de miel de Guido), cada uno con su precio ($80.000 a $200.000), lo que vende por
//     día, lo que cuesta sostenerlo y cuánto le importa a su dueño (`apego`);
//   · la REACCIÓN del vecino a la oferta de compra: depende de la amistad (puntos), de cuánto de su historia le escuchaste, de lo fuerte que sea su lazo con el
//     local y, para Lucrecia, del romance. Va de «se ofende» a «se emociona», con el precio que pide y si se queda de empleado o se va a otra cosa;
//   · el negocio comprado rinde una GANANCIA POR DÍA (ventas del día − insumos − sueldo del personal − gastos fijos), que cae a una caja con tope; la
//     cobrás cuando pasás a verlo (y si no pasás, el negocio rinde menos: la gestión);
//   · la SOCIEDAD: ponés plata (un mínimo y un máximo por negocio), te corresponde un porcentaje de lo que gana por día y te retirás con aviso, con una
//     devolución que crece con los días;
//   · 4.4.3: VENDER DE VUELTA el negocio comprado (al dueño de siempre, por un porcentaje de lo que pagaste) y SUMAR PLATA a una sociedad ya hecha;
//   · el guardado: `progreso.negociosVecinos` (una partida de antes no lo trae y sale vacío; el Desafío no lo tiene). Todo cobro y pago pasa por economia.js.
import { hayEconomia, cobrar, pagar, formatoPesos, pesosDe, MAX_PESOS } from './economia.js';
import { diaSemanaDe, esPobladorAldea, localAbierto, LOTE_DE } from './aldea.js';

const entero = (v, max = 1e9) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0; };
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const dia1 = (d) => Math.max(1, Math.floor(Number(d) || 1));
const aMil = (n, paso = 500) => Math.round(n / paso) * paso;

// ---------------------------------------------------------------- los ocho negocios
// `semana`: cuánto vende cada día de la semana (lunes a domingo; la media es 1). `ventas`: lo que vende un día corriente; `insumos`: la parte que se va en
// mercadería y reposición; `sueldo`: lo que cobra por día quien atiende (el vecino, o quien lo reemplace); `gastos`: alquiler, impuestos y luz por día.
// `apego` (0 a 1): cuánto le pesa su local (su historia); los de más de 0,8 se emocionan, se resisten y piden que antes sepas de dónde vienen. `puedeIrse`:
// si el vecino puede dejar el mostrador (los que dan un servicio de noche o al público de siempre no se van). `minimoSocio`: los puntos de amistad que hacen
// falta para que te acepte de socio (50 es «amigo»; 140, «compadre»). `romance`: sólo Lucrecia (la historia con ella cambia el trato).
const sem = (...v) => Object.freeze(v);
export const NEGOCIOS = Object.freeze({
  panaderia: { id: 'panaderia', vecino: 'panadera', dueno: 'Rosa', nombre: 'la panadería de Rosa', corto: 'la panadería', rotulo: 'La panadería', precio: 80000,
    ventas: 3500, insumos: 0.4, sueldo: 650, gastos: 200, semana: sem(1, 1, 1, 1, 1.05, 1.2, 0.75), apego: 0.6, minimoSocio: 50, puedeIrse: true, romance: false },
  pescaderia: { id: 'pescaderia', vecino: 'pescador', dueno: 'Aurelio', nombre: 'la pescadería de Aurelio', corto: 'la pescadería', rotulo: 'La pescadería', precio: 85000,
    ventas: 3350, insumos: 0.4, sueldo: 600, gastos: 200, semana: sem(1, 1, 1, 1.05, 1.15, 1.1, 0.7), apego: 0.5, minimoSocio: 50, puedeIrse: true, romance: false },
  'sala-miel': { id: 'sala-miel', vecino: 'apicultor', dueno: 'Guido', nombre: 'la sala de miel de Guido', corto: 'la sala de miel', rotulo: 'La sala de miel', precio: 95000,
    ventas: 3600, insumos: 0.4, sueldo: 650, gastos: 200, semana: sem(0.95, 0.95, 0.95, 1, 1.05, 1.3, 0.8), apego: 0.55, minimoSocio: 50, puedeIrse: true, romance: false },
  hilanderia: { id: 'hilanderia', vecino: 'tejedora', dueno: 'Elvira', nombre: 'la hilandería de Elvira', corto: 'la hilandería', rotulo: 'La hilandería', precio: 110000,
    ventas: 4100, insumos: 0.4, sueldo: 700, gastos: 250, semana: sem(1, 1, 1, 1, 1, 1.1, 0.9), apego: 0.65, minimoSocio: 60, puedeIrse: true, romance: false },
  'casa-te': { id: 'casa-te', vecino: 'galesa', dueno: 'Ceinwen', nombre: 'la casa de té de Ceinwen', corto: 'la casa de té', rotulo: 'Casa de Té', precio: 130000,
    ventas: 4500, insumos: 0.4, sueldo: 750, gastos: 250, semana: sem(1, 1, 1, 1, 1.1, 1.2, 0.7), apego: 0.95, minimoSocio: 80, puedeIrse: false, romance: false },
  herreria: { id: 'herreria', vecino: 'herrero', dueno: 'Anselmo', nombre: 'la herrería de Anselmo', corto: 'la herrería', rotulo: 'La herrería', precio: 150000,
    ventas: 5100, insumos: 0.4, sueldo: 850, gastos: 300, semana: sem(1.1, 1.1, 1.1, 1.05, 1, 0.85, 0.8), apego: 0.7, minimoSocio: 70, puedeIrse: true, romance: false },
  almacen: { id: 'almacen', vecino: 'ercilia', dueno: 'Ercilia', nombre: 'el almacén de Ercilia', corto: 'el almacén', rotulo: 'Almacén de Ramos Generales', precio: 170000,
    ventas: 5500, insumos: 0.4, sueldo: 900, gastos: 300, semana: sem(1.05, 1, 1, 1, 1.1, 1.1, 0.75), apego: 0.95, minimoSocio: 95, puedeIrse: false, romance: false },
  cantina: { id: 'cantina', vecino: 'moza', dueno: 'Lucrecia', nombre: 'la cantina de Lucrecia', corto: 'la cantina', rotulo: 'La cantina', precio: 200000,
    ventas: 6250, insumos: 0.4, sueldo: 1000, gastos: 350, semana: sem(0.7, 0.75, 0.8, 0.95, 1.35, 1.6, 0.85), apego: 1, minimoSocio: 110, puedeIrse: false, romance: true },
});
export const IDS_NEGOCIOS = Object.freeze(Object.keys(NEGOCIOS));
export const hayNegocio = (id) => typeof id === 'string' && Object.hasOwn(NEGOCIOS, id);
// «tuyo» o «tuya», según el negocio (la panadería es tuya; el almacén, tuyo)
// 4.10.1: «de» + un nombre con artículo: «de la panadería», «del almacén» (antes salía «de el almacén»)
export const deNegocio = (texto) => String(texto).replace(/^el /, 'del ').replace(/^(?!del )/, 'de ');
// 4.10.1: «lo» o «la» para el negocio («al comprarlo», «al comprarla»)
export const loDe = (id) => (/^la /.test(NEGOCIOS[id]?.corto || '') ? 'la' : 'lo');
export const tuyoDe = (id) => (/^la /.test(NEGOCIOS[id]?.corto || '') ? 'tuya' : 'tuyo');
export const negocioDeVecino = (clave) => IDS_NEGOCIOS.find((id) => NEGOCIOS[id].vecino === clave) || null;
// el vecino con el que se habla de negocios en general (no tiene uno propio: te cuenta lo que sabe)
export const CONSEJERO = 'gerente';

export const COMPRA = {
  topeDias: 10,                 // la caja guarda hasta diez días de ganancia
  diasDeCuenta: 30,              // si pasan más días de una vez (dormir mucho, volver tras un tiempo) sólo se cuentan los últimos treinta
  gestion: { gracia: 3, porDia: 0.04, piso: 0.7 },   // sin pasar a verlo: hasta 3 días rinde todo; después baja 4 % por día, hasta el 70 %
  sinVecino: 0.88,               // si el vecino se fue, las ventas son el 88 % (era la cara del negocio)
  bonoCompadre: 1.05,            // si se quedó de empleado y es tu compadre, se esmera
  variacion: 0.24,               // lo que varía un día de otro (±12 %), parejo para el mismo día y el mismo negocio
  espera: { ofendido: 4, seNiega: 1 },   // días que pasan antes de volver a proponérselo
  amistadAlCerrar: 4,            // lo que suma de amistad un trato cerrado
  amistadOfendido: -3,
  redondeo: 500,
};
// lo que rinde cada uno según cuántos negocios tenés (el primero rinde todo; con más, tu atención se reparte)
export const FACTORES_CARTERA = Object.freeze([1, 0.93, 0.86, 0.79, 0.72, 0.65, 0.58, 0.55]);
export const factorCartera = (n) => FACTORES_CARTERA[Math.max(0, Math.min(FACTORES_CARTERA.length - 1, Math.floor(Number(n) || 0)))];

// ---------------------------------------------------------------- la sociedad
export const SOCIEDAD = {
  porcentajeMax: 45,             // nunca más del 45 %: para ser dueño, se compra
  maxSocios: 3,                  // sociedades a la vez
  minimoFraccion: 0.10,          // el aporte mínimo: el 10 % del precio del negocio
  maximoFraccion: 0.40,          // y el máximo, el 40 %
  factorAmigo: 0.9,              // un amigo te da el 90 % de lo que corresponde al aporte; un compadre, todo
  factorCompadre: 1,
  avisoDias: 2,                  // el retiro se hace efectivo dos días después de avisar
  devolucion: Object.freeze([{ hasta: 6, parte: 0.6 }, { hasta: 18, parte: 0.8 }, { hasta: 36, parte: 0.92 }, { hasta: Infinity, parte: 1 }]),
};
// cuánto del aporte se devuelve si te retirás después de `dias` días de socio
export function devolucionPorDias(dias) {
  const d = Math.max(0, Math.floor(Number(dias) || 0));
  return SOCIEDAD.devolucion.find((t) => d < t.hasta).parte;
}

// 4.4.3 · vender de vuelta: el precio es un porcentaje de lo que pagaste (entre el 50 y el 85 %). Parte de 55 %, suma 0,25 puntos por día de haberlo tenido
// (hasta 60 días: +15) y hasta +15 por la amistad (de 50 a 180 puntos); resta hasta 15 si lo descuidaste (días sin pasar a verlo, caja que se llenó y se perdió).
export const VENTA = {
  base: 0.55, porDia: 0.0025, diasMax: 60, amistadMax: 0.15, amistadDesde: 50, amistadHasta: 180,
  piso: 0.5, techo: 0.85,
  regateo: -0.05,       // con poca amistad (< 50 puntos) regatea
  emocion: 0.03,        // si volvía a su local (se había ido) o es de apego fuerte y te quiere (95), se emociona
  ofensa: -0.05,        // si lo vendés enseguida (menos de 7 días) se ofende un poco
  enseguida: 7,
  amistad: { ofendido: -2, regatea: 0, acepta: 1, emocionado: 2 },
  descuido: { dias: 0.12, perdido: 0.10, max: 0.15 },
  recompra: { dias: 30, recargo: 1.1 },   // si lo vendiste hace menos de 30 días de juego, recomprarlo cuesta un 10 % más
  redondeo: 50,
};
export const APORTE_EXTRA = { minimoFraccion: 0.05, maxExtras: 8, redondeo: 500 };
// 4.4.3: lo que devolverían de TODO lo puesto si te retiraras el día `dia`: cada aporte cuenta sus propios días (el original desde que entraste y cada aporte
// adicional desde el día que lo hiciste), así lo que sumaste ayer no vuelve entero sólo porque la sociedad es vieja
export function devolucionDe(s, dia) {
  if (!s) return 0;
  const extras = Array.isArray(s.extras) ? s.extras : [], sumaExtras = extras.reduce((t, q) => t + q.monto, 0);
  let t = Math.max(0, s.aporte - sumaExtras) * devolucionPorDias(dia - s.desde);
  for (const q of extras) t += q.monto * devolucionPorDias(dia - q.dia);
  return t;
}

// ---------------------------------------------------------------- las cuentas de un negocio
// un número parejo entre 0 y 1 para un texto (el mismo día y el mismo negocio dan siempre lo mismo)
export function azarParejo(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;   // (el último mezclado: sin él, textos parecidos dan números parecidos)
  return (h >>> 0) / 4294967296;
}
// lo que gana un día corriente (sin gestión, sin variación, sin cartera)
export function gananciaBase(id) {
  const N = NEGOCIOS[id];
  return N ? Math.round(N.ventas * (1 - N.insumos) - N.sueldo - N.gastos) : 0;
}
export const topeDeCaja = (id) => (hayNegocio(id) ? Math.max(100, Math.round((gananciaBase(id) * COMPRA.topeDias) / 100) * 100) : 0);
// cuánto tarda en pagarse a su precio de lista, a ganancia base
export const diasParaPagarse = (id, precio = null) => { const g = gananciaBase(id); return g > 0 ? Math.ceil((precio ?? NEGOCIOS[id].precio) / g) : Infinity; };
// la gestión: cuántos días pasaron sin que pases a verlo
export function factorGestion(diasSinVer) {
  const G = COMPRA.gestion, d = Math.max(0, Math.floor(Number(diasSinVer) || 0));
  return d <= G.gracia ? 1 : Math.max(G.piso, 1 - G.porDia * (d - G.gracia));
}
// El día `dia` del negocio `id`. `o`: { gestion, cartera, sinVecino, bono }. Devuelve { ventas, insumos, sueldo, gastos, bruto, neto, semana, azar }.
export function gananciaDelDia(id, dia, o = {}) {
  const N = NEGOCIOS[id];
  if (!N) return { ventas: 0, insumos: 0, sueldo: 0, gastos: 0, bruto: 0, neto: 0, semana: 1, azar: 1 };
  const d = dia1(dia);
  const semana = N.semana[diaSemanaDe(d)];
  const azar = 1 + (azarParejo(`${id}|${d}`) - 0.5) * COMPRA.variacion;
  const ventas = Math.round(N.ventas * semana * azar * (o.gestion ?? 1) * (o.bono ?? 1) * (o.sinVecino ? COMPRA.sinVecino : 1) / 10) * 10;
  const insumos = Math.round((ventas * N.insumos) / 10) * 10;
  const bruto = ventas - insumos - N.sueldo - N.gastos;
  const neto = Math.max(0, Math.round((bruto > 0 ? bruto * (o.cartera ?? 1) : 0) / 10) * 10);
  return { ventas, insumos, sueldo: N.sueldo, gastos: N.gastos, bruto, neto, semana, azar };
}

// Lo que rinde un día corriente de la semana con esas condiciones (la media de los siete días, sin la variación de cada día): para decir «unos $X por día»
export function gananciaEstimada(id, o = {}) {
  const N = NEGOCIOS[id];
  if (!N) return 0;
  const f = (o.gestion ?? 1) * (o.bono ?? 1) * (o.sinVecino ? COMPRA.sinVecino : 1);
  let suma = 0;
  for (const s of N.semana) suma += Math.max(0, N.ventas * s * f * (1 - N.insumos) - N.sueldo - N.gastos) * (o.cartera ?? 1);
  return Math.round(suma / 7 / 10) * 10;
}

// ---------------------------------------------------------------- lo guardado
export const negociosVecinosNuevo = () => ({ v: 1, comprados: {}, socios: {}, ultimoDia: 0, orden: 0, rechazos: {}, vendidos: {}, historial: [], total: { ganado: 0, invertido: 0, devuelto: 0, cobrado: 0, vendido: 0 } });
const HISTORIAL_MAX = 24;
const destinoValido = (d) => (d === 'se-va' ? 'se-va' : 'queda');
function sanearComprado(id, x, hoy) {
  const N = NEGOCIOS[id];
  const tope = topeDeCaja(id);
  return {
    desde: Math.min(hoy, Math.max(1, entero(x.desde, 1e6) || 1)), pagado: entero(x.pagado, 1e8), destino: N.puedeIrse ? destinoValido(x.destino) : 'queda',
    orden: entero(x.orden, 1e4), visita: Math.min(hoy, Math.max(1, entero(x.visita, 1e6) || 1)), bono: x.bono === COMPRA.bonoCompadre ? COMPRA.bonoCompadre : 1,
    caja: Math.min(tope, entero(x.caja, 1e8)), total: entero(x.total, 1e10), perdido: entero(x.perdido, 1e10), mala: entero(x.mala, 1e6),
    ultimo: objeto(x.ultimo) ? { dia: entero(x.ultimo.dia, 1e6), neto: entero(x.ultimo.neto, 1e8), ventas: entero(x.ultimo.ventas, 1e8) } : null,
  };
}
function sanearSocio(id, x, hoy) {
  const N = NEGOCIOS[id];
  const aporte = Math.min(aMil(N.precio * SOCIEDAD.maximoFraccion), Math.max(0, entero(x.aporte, 1e8)));
  const pct = Math.min(SOCIEDAD.porcentajeMax, Math.max(0, Math.round(Number(x.pct) * 10) / 10 || 0));
  const aviso = objeto(x.aviso) && entero(x.aviso.sale, 1e6) > 0 ? { dia: Math.min(hoy, Math.max(1, entero(x.aviso.dia, 1e6) || 1)), sale: entero(x.aviso.sale, 1e6) } : null;
  // 4.4.3: los aportes adicionales (nunca suman más que el aporte total) y el porcentaje de antes del último, que rige hasta el día del aporte
  const extras = [];
  let resto = aporte;
  if (Array.isArray(x.extras)) for (const q of x.extras.slice(0, APORTE_EXTRA.maxExtras)) {
    if (!objeto(q)) continue;
    const monto = Math.min(resto, entero(q.monto, 1e8));
    if (monto <= 0) continue;
    extras.push({ dia: Math.min(hoy, Math.max(1, entero(q.dia, 1e6) || 1)), monto });
    resto -= monto;
  }
  const previo = objeto(x.previo) && entero(x.previo.dia, 1e6) > 0
    ? { dia: Math.min(hoy, entero(x.previo.dia, 1e6)), pct: Math.min(SOCIEDAD.porcentajeMax, Math.max(0, Math.round(Number(x.previo.pct) * 10) / 10 || 0)) } : null;
  return {
    desde: Math.min(hoy, Math.max(1, entero(x.desde, 1e6) || 1)), aporte, pct, caja: Math.min(topeDeSocio(id, pct), entero(x.caja, 1e8)),
    total: entero(x.total, 1e10), aviso, ultimo: objeto(x.ultimo) ? { dia: entero(x.ultimo.dia, 1e6), parte: entero(x.ultimo.parte, 1e8) } : null, extras, previo,
  };
}
export const topeDeSocio = (id, pct) => Math.max(100, Math.round((gananciaBase(id) * (Number(pct) || 0) / 100 * COMPRA.topeDias) / 100) * 100);
export function sanearNegociosVecinos(v, hoy = 1) {
  const e = negociosVecinosNuevo();
  if (!objeto(v)) return e;
  const h = dia1(hoy);
  e.ultimoDia = Math.min(h, entero(v.ultimoDia, 1e6));
  e.orden = entero(v.orden, 1e4);
  if (objeto(v.comprados)) for (const id of IDS_NEGOCIOS) if (objeto(v.comprados[id])) e.comprados[id] = sanearComprado(id, v.comprados[id], h);
  if (objeto(v.socios)) for (const id of IDS_NEGOCIOS) if (objeto(v.socios[id]) && !e.comprados[id] && entero(v.socios[id].aporte) > 0) e.socios[id] = sanearSocio(id, v.socios[id], h);
  if (objeto(v.rechazos)) for (const id of IDS_NEGOCIOS) { const d = entero(v.rechazos[id], 1e6); if (d > h) e.rechazos[id] = d; }
  // 4.4.3: los negocios que vendiste de vuelta (para el recargo si los recomprás pronto)
  if (objeto(v.vendidos)) for (const id of IDS_NEGOCIOS) if (objeto(v.vendidos[id]) && !e.comprados[id]) e.vendidos[id] = { dia: Math.min(h, Math.max(1, entero(v.vendidos[id].dia, 1e6) || 1)), monto: entero(v.vendidos[id].monto, 1e8), pagado: entero(v.vendidos[id].pagado, 1e8) };
  if (Array.isArray(v.historial)) e.historial = v.historial.filter((x) => objeto(x) && hayNegocio(x.local) && typeof x.tipo === 'string').slice(-HISTORIAL_MAX)
    .map((x) => ({ dia: entero(x.dia, 1e6), tipo: String(x.tipo).slice(0, 16), local: x.local, monto: Math.floor(Number(x.monto) || 0) }));
  if (objeto(v.total)) for (const k of Object.keys(e.total)) e.total[k] = entero(v.total[k], 1e11);
  return e;
}
export const leerNegociosVecinos = (p) => (objeto(p?.negociosVecinos) && p.negociosVecinos.v === 1 ? p.negociosVecinos : null);
export function asegurarNegociosVecinos(p) {
  if (!hayEconomia(p)) return null;
  if (!leerNegociosVecinos(p)) p.negociosVecinos = negociosVecinosNuevo();
  return p.negociosVecinos;
}
const anotar = (e, dia, tipo, local, monto) => { e.historial.push({ dia, tipo, local, monto: Math.floor(monto) }); while (e.historial.length > HISTORIAL_MAX) e.historial.shift(); };
export const esTuyo = (p, id) => !!leerNegociosVecinos(p)?.comprados && Object.hasOwn(leerNegociosVecinos(p).comprados, id);
export const esSocio = (p, id) => !!leerNegociosVecinos(p)?.socios && Object.hasOwn(leerNegociosVecinos(p).socios, id);
export const tusNegocios = (p) => { const e = leerNegociosVecinos(p); return e ? Object.keys(e.comprados).sort((a, b) => e.comprados[a].orden - e.comprados[b].orden) : []; };
export const tusSociedades = (p) => { const e = leerNegociosVecinos(p); return e ? IDS_NEGOCIOS.filter((id) => Object.hasOwn(e.socios, id)) : []; };
// los vecinos que se fueron a otra cosa después de venderte el local (para la rutina de la aldea)
export const vecinosQueSeFueron = (p) => { const e = leerNegociosVecinos(p); return e ? Object.keys(e.comprados).filter((id) => e.comprados[id].destino === 'se-va').map((id) => NEGOCIOS[id].vecino) : []; };

// ---------------------------------------------------------------- ¿está para la venta?
// El negocio tiene que existir: los de los pobladores, con el poblador ya instalado y el local abierto.
export function negocioAbierto(p, id) {
  const N = NEGOCIOS[id];
  if (!N) return false;
  if (!esPobladorAldea(N.vecino)) return true;   // Ercilia, Ceinwen y Lucrecia están desde el primer día
  const a = p?.aldea;
  return !!a && Array.isArray(a.pobladores) && a.pobladores.some((q) => q?.clave === N.vecino) && localAbierto(a, LOTE_DE[N.vecino]);
}
export const hayNegocios = (p) => hayEconomia(p) && p.modo !== 'desafio';

// ---------------------------------------------------------------- la reacción del vecino a la compra
// `ctx`: { puntos (amistad, 0 a 200), hist (partes de su historia que ya te contó), histTotal, etapa (el romance: 'conocidos', 'novios'…), dia }
// Devuelve { tipo, mult, precio, destino, pide }:
//   tipo: 'ofendido' | 'se-niega' | 'resiste' (pide que antes sepas de dónde viene: `pide: 'historia'`) | 'pide-mas' | 'acepta-condiciones' | 'acepta'
//   los tres últimos cierran trato, a `precio` (el de lista por `mult`); `destino`: 'queda' (de empleado) o 'se-va' (a otra cosa)
export const TIPOS_QUE_VENDEN = Object.freeze(['pide-mas', 'acepta-condiciones', 'acepta']);
export function reaccionCompra(id, ctx = {}) {
  const N = NEGOCIOS[id];
  if (!N) return { tipo: 'se-niega', mult: 1, precio: 0, destino: null, pide: null };
  const p = Math.max(0, Number(ctx.puntos) || 0), h = Math.max(0, Math.floor(Number(ctx.hist) || 0)), ht = Math.max(0, Math.floor(Number(ctx.histTotal) || 0));
  const fuerte = N.apego >= 0.8;
  const etapa = N.romance ? String(ctx.etapa || '') : '';   // (el romance sólo cuenta con quien se puede)
  const novios = etapa === 'novios' || etapa === 'comprometidos' || etapa === 'casados';
  const separados = etapa === 'separados';
  let tipo, mult;
  if (p < 20) { tipo = fuerte ? 'ofendido' : 'se-niega'; mult = 1; }
  else if (p < 50) { tipo = fuerte ? 'se-niega' : 'pide-mas'; mult = 1.4; }
  else if (fuerte && h < 2 && !novios) { tipo = 'resiste'; mult = 1; }
  else if (p < 95) { tipo = 'pide-mas'; mult = 1.2; }
  else if (p < 140) { tipo = 'acepta-condiciones'; mult = 1.05; }
  else if (p < 180) { tipo = 'acepta'; mult = 0.95; }
  else { tipo = 'acepta'; mult = 0.9; }
  const vende = TIPOS_QUE_VENDEN.includes(tipo);
  if (vende) {
    if (ht > 0 && h >= ht) mult *= fuerte ? 0.93 : 0.96;
    if (etapa === 'novios') mult *= 0.92;
    else if (etapa === 'comprometidos' || etapa === 'casados') mult *= 0.85;
    else if (separados) mult *= 1.15;
    mult = Math.max(0.8, Math.min(1.45, mult));
  }
  const precio = vende ? Math.max(COMPRA.redondeo, aMil(N.precio * mult, COMPRA.redondeo)) : 0;
  const destino = !vende ? null : (!N.puedeIrse || fuerte) ? 'queda' : p >= 95 ? 'queda' : 'se-va';
  return { tipo, mult: vende ? Math.round(mult * 1000) / 1000 : 1, precio, destino, pide: tipo === 'resiste' ? 'historia' : null };
}

// ---------------------------------------------------------------- comprar
// ¿Se puede ofrecer ahora? { ok, motivo, reaccion, precio (a pagar, con el aporte de socio descontado), credito, faltan }
//   motivos: 'nada' (no hay economía), 'tuyo', 'no-esta' (todavía no llegó o no abrió el local), 'espera' (se negó hace poco; `hasta`), y los de la reacción
export function evaluarCompra(p, id, ctx = {}) {
  if (!hayNegocios(p) || !hayNegocio(id)) return { ok: false, motivo: 'nada' };
  if (esTuyo(p, id)) return { ok: false, motivo: 'tuyo' };
  if (!negocioAbierto(p, id)) return { ok: false, motivo: 'no-esta' };
  const e = leerNegociosVecinos(p);
  const dia = dia1(ctx.dia ?? p.dia);
  if (e && e.rechazos[id] > dia) return { ok: false, motivo: 'espera', hasta: e.rechazos[id] };
  let r = reaccionCompra(id, ctx);
  if (!TIPOS_QUE_VENDEN.includes(r.tipo)) return { ok: false, motivo: r.tipo, reaccion: r };
  // 4.4.3: si se lo vendiste de vuelta hace menos de 30 días de juego, recomprarlo cuesta un 10 % más
  const vend = e?.vendidos?.[id], recargo = vend && dia - vend.dia < VENTA.recompra.dias ? VENTA.recompra.recargo : 1;
  if (recargo > 1) r = { ...r, precio: aMil(r.precio * recargo, COMPRA.redondeo), recargo };
  const credito = e?.socios?.[id] ? aMil(devolucionDe(e.socios[id], dia), 50) : 0;
  const precio = Math.max(COMPRA.redondeo, r.precio - credito);
  const saldo = pesosDe(p);
  return { ok: saldo >= precio, motivo: saldo >= precio ? null : 'dinero', reaccion: r, precio, credito, recargo, faltan: Math.max(0, precio - saldo) };
}
// El vecino se negó (o se ofendió): no vuelve a hablarse del tema por unos días. Anota la fecha de espera.
export function anotarRechazo(p, id, tipo, dia) {
  const e = asegurarNegociosVecinos(p);
  if (!e || !hayNegocio(id)) return 0;
  const d = dia1(dia ?? p.dia), espera = tipo === 'ofendido' ? COMPRA.espera.ofendido : tipo === 'se-niega' ? COMPRA.espera.seNiega : 0;
  if (espera > 0) e.rechazos[id] = d + espera;
  return espera;
}
// Cierra el trato: paga, el negocio pasa a ser tuyo (y si eras socio, se cierra la sociedad: el aporte descuenta del precio y la caja es tuya).
export function comprar(p, id, ctx = {}) {
  const v = evaluarCompra(p, id, ctx);
  if (!v.ok) return { ok: false, motivo: v.motivo, faltan: v.faltan || 0, reaccion: v.reaccion };
  const e = asegurarNegociosVecinos(p), N = NEGOCIOS[id], dia = dia1(ctx.dia ?? p.dia);
  const r = pagar(p, v.precio, `Compraste ${N.nombre}`, N.dueno);
  if (!r.ok) return { ok: false, motivo: 'dinero', faltan: r.faltan || 0 };
  let cajaSocio = 0;
  if (e.socios[id]) { cajaSocio = e.socios[id].caja; delete e.socios[id]; if (cajaSocio > 0) cobrar(p, cajaSocio, `Tu parte ${deNegocio(N.nombre)}, al comprar${loDe(id)}`, N.dueno); }
  e.comprados[id] = {
    desde: dia, pagado: v.precio + v.credito, destino: v.reaccion.destino || 'queda', orden: ++e.orden, visita: dia, bono: ctx.compadre && v.reaccion.destino === 'queda' ? COMPRA.bonoCompadre : 1,
    caja: 0, total: 0, perdido: 0, mala: 0, ultimo: null,
  };
  if (!e.ultimoDia) e.ultimoDia = dia;
  e.total.invertido += v.precio;
  anotar(e, dia, 'compra', id, -v.precio);
  delete e.rechazos[id];
  if (e.vendidos) delete e.vendidos[id];
  return { ok: true, precio: v.precio, credito: v.credito, cajaSocio, destino: e.comprados[id].destino, reaccion: v.reaccion, ganancia: gananciaBase(id), tope: topeDeCaja(id), recargo: v.recargo };
}

// ---------------------------------------------------------------- la caja
// Pasaste a verlo: la gestión vuelve a empezar
export function visitar(p, id, dia) {
  const n = leerNegociosVecinos(p)?.comprados?.[id];
  if (n) n.visita = Math.max(n.visita, dia1(dia ?? p.dia));
  return !!n;
}
// Retirás la caja de un negocio tuyo (o tu parte de una sociedad) a la billetera
export function retirarCaja(p, id, dia) {
  const e = leerNegociosVecinos(p);
  if (!e || !hayNegocio(id)) return { ok: false, monto: 0, motivo: 'nada' };
  const N = NEGOCIOS[id], d = dia1(dia ?? p.dia);
  const n = e.comprados[id] || e.socios[id];
  if (!n) return { ok: false, monto: 0, motivo: 'nada' };
  const propio = !!e.comprados[id];
  if (propio) n.visita = Math.max(n.visita, d);
  if (!(n.caja > 0)) return { ok: false, monto: 0, motivo: 'vacia' };
  const r = cobrar(p, n.caja, propio ? `Caja ${deNegocio(N.nombre)}` : `Tu parte ${deNegocio(N.nombre)}`, N.dueno);
  if (!r.ok) return { ok: false, monto: 0, motivo: 'techo' };
  n.caja -= r.monto;
  e.total.cobrado += r.monto;
  anotar(e, d, propio ? 'caja' : 'parte', id, r.monto);
  return { ok: true, monto: r.monto, resta: n.caja };
}
// Todo lo que hay en las cajas (para el aviso y el cuaderno)
export function cajasTotal(p) {
  const e = leerNegociosVecinos(p);
  if (!e) return 0;
  return Object.values(e.comprados).reduce((s, n) => s + n.caja, 0) + Object.values(e.socios).reduce((s, n) => s + n.caja, 0);
}
export const cajaDe = (p, id) => { const e = leerNegociosVecinos(p); const n = e?.comprados?.[id] || e?.socios?.[id]; return n ? n.caja : 0; };

// ---------------------------------------------------------------- pasa el tiempo
// Al empezar el día `dia` se cuentan los días que pasaron desde la última vez (de a uno, hasta treinta). Devuelve un resumen para el aviso:
//   { dias, propios: [{ id, neto, caja, llena }], socios: [{ id, parte, caja }], retiros: [{ id, devuelto, caja }], total }
// (sin nada tuyo, o el mismo día, devuelve null)
export function pasarDia(p, dia) {
  const e = leerNegociosVecinos(p);
  if (!e || !hayEconomia(p)) return null;
  const hoy = dia1(dia ?? p.dia);
  if (!e.ultimoDia) { e.ultimoDia = hoy; return null; }
  if (hoy <= e.ultimoDia) { if (hoy < e.ultimoDia) e.ultimoDia = hoy; return null; }
  const desde = Math.max(e.ultimoDia, hoy - COMPRA.diasDeCuenta);
  const ids = tusNegocios(p);
  const resumen = { dias: hoy - e.ultimoDia, propios: {}, socios: {}, retiros: [], total: 0 };
  for (let d = desde; d < hoy; d++) {
    // 1. tus negocios: lo que rindió el día d
    ids.forEach((id, i) => {
      const n = e.comprados[id];
      if (!n || d <= n.desde) return;
      if (factorGestion(d - n.visita) < 1) n.mala = (n.mala || 0) + 1;   // 4.4.3: un día sin atención (cuenta para el precio de venta)
      const g = gananciaDelDia(id, d, { gestion: factorGestion(d - n.visita), cartera: factorCartera(i), sinVecino: n.destino === 'se-va', bono: n.bono });
      const lugar = Math.max(0, topeDeCaja(id) - n.caja), entra = Math.min(g.neto, lugar);
      n.caja += entra; n.total += entra; n.perdido += g.neto - entra;
      n.ultimo = { dia: d, neto: g.neto, ventas: g.ventas };
      const r = resumen.propios[id] || (resumen.propios[id] = { id, neto: 0, caja: 0, llena: false });
      r.neto += g.neto; r.caja = n.caja; r.llena = n.caja >= topeDeCaja(id);
      resumen.total += entra;
    });
    // 2. tus sociedades: tu parte del día d (y los retiros que se hacen efectivos al empezar el día d+1)
    for (const id of tusSociedades(p)) {
      const s = e.socios[id];
      if (!s || d <= s.desde) continue;
      const pctDia = s.previo && d <= s.previo.dia ? s.previo.pct : s.pct;   // 4.4.3: el aporte adicional rinde desde el día siguiente
      const parte = Math.round((gananciaDelDia(id, d).neto * pctDia) / 100 / 10) * 10;
      const entra = Math.min(parte, Math.max(0, topeDeSocio(id, s.pct) - s.caja));
      s.caja += entra; s.total += entra; s.ultimo = { dia: d, parte };
      const r = resumen.socios[id] || (resumen.socios[id] = { id, parte: 0, caja: 0 });
      r.parte += parte; r.caja = s.caja;
      resumen.total += entra;
      if (s.aviso && d + 1 >= s.aviso.sale) {
        const ret = cerrarSociedad(p, id, d + 1);
        if (ret.ok) { resumen.retiros.push({ id, devuelto: ret.devuelto, caja: ret.caja }); delete resumen.socios[id]; }
      }
    }
  }
  e.ultimoDia = hoy;
  e.total.ganado += resumen.total;
  return { dias: resumen.dias, propios: Object.values(resumen.propios), socios: Object.values(resumen.socios), retiros: resumen.retiros, total: resumen.total };
}

// ---------------------------------------------------------------- la sociedad: entrar, avisar, retirarse
// Cuánto se puede aportar: [mínimo, máximo] (de a $500)
export function rangoDeAporte(id) {
  const N = NEGOCIOS[id];
  if (!N) return { min: 0, max: 0 };
  return { min: Math.max(COMPRA.redondeo, aMil(N.precio * SOCIEDAD.minimoFraccion, COMPRA.redondeo)), max: aMil(N.precio * SOCIEDAD.maximoFraccion, COMPRA.redondeo) };
}
// los montos que se ofrecen: el mínimo, uno en el medio y el máximo
export function montosDeAporte(id) {
  const { min, max } = rangoDeAporte(id);
  return [...new Set([min, aMil((min + max) / 2, 1000), max])].filter((x) => x >= min && x <= max);
}
// el porcentaje que te toca por `aporte`: lo que corresponde al aporte sobre el precio del negocio, por el factor de la amistad (amigo 0,9; compadre 1)
export function porcentajeDe(id, aporte, factor = SOCIEDAD.factorAmigo) {
  const N = NEGOCIOS[id];
  if (!N) return 0;
  return Math.min(SOCIEDAD.porcentajeMax, Math.max(0.5, Math.round(((aporte / N.precio) * 100 * factor) * 10) / 10));
}
// La reacción a la propuesta de socio. tipo: 'rechaza' (no te conoce lo suficiente) | 'resiste' (pide que antes escuches algo de su historia) | 'acepta'
export function reaccionSocio(id, ctx = {}) {
  const N = NEGOCIOS[id];
  if (!N) return { tipo: 'rechaza', factor: 0, pide: null };
  const p = Math.max(0, Number(ctx.puntos) || 0), h = Math.max(0, Math.floor(Number(ctx.hist) || 0));
  if (p < N.minimoSocio) return { tipo: 'rechaza', factor: 0, pide: null, faltan: Math.ceil(N.minimoSocio - p) };
  if (N.apego >= 0.8 && h < 1) return { tipo: 'resiste', factor: 0, pide: 'historia' };
  return { tipo: 'acepta', factor: p >= 140 ? SOCIEDAD.factorCompadre : SOCIEDAD.factorAmigo, pide: null };
}
export function evaluarSocio(p, id, aporte, ctx = {}) {
  if (!hayNegocios(p) || !hayNegocio(id)) return { ok: false, motivo: 'nada' };
  if (esTuyo(p, id)) return { ok: false, motivo: 'tuyo' };
  if (esSocio(p, id)) return { ok: false, motivo: 'ya' };
  if (!negocioAbierto(p, id)) return { ok: false, motivo: 'no-esta' };
  if (tusSociedades(p).length >= SOCIEDAD.maxSocios) return { ok: false, motivo: 'tope' };
  const r = reaccionSocio(id, ctx);
  if (r.tipo !== 'acepta') return { ok: false, motivo: r.tipo, reaccion: r };
  const { min, max } = rangoDeAporte(id), a = Math.floor(Number(aporte) || 0);
  if (a < min || a > max) return { ok: false, motivo: 'monto', reaccion: r, min, max };
  const saldo = pesosDe(p);
  return { ok: saldo >= a, motivo: saldo >= a ? null : 'dinero', reaccion: r, aporte: a, pct: porcentajeDe(id, a, r.factor), faltan: Math.max(0, a - saldo) };
}
export function entrarSocio(p, id, aporte, ctx = {}) {
  const v = evaluarSocio(p, id, aporte, ctx);
  if (!v.ok) return { ok: false, motivo: v.motivo, faltan: v.faltan || 0, reaccion: v.reaccion };
  const e = asegurarNegociosVecinos(p), N = NEGOCIOS[id], dia = dia1(ctx.dia ?? p.dia);
  const r = pagar(p, v.aporte, `Aporte de socio en ${N.nombre}`, N.dueno);
  if (!r.ok) return { ok: false, motivo: 'dinero', faltan: r.faltan || 0 };
  e.socios[id] = { desde: dia, aporte: v.aporte, pct: v.pct, caja: 0, total: 0, aviso: null, ultimo: null, extras: [], previo: null };
  if (!e.ultimoDia) e.ultimoDia = dia;
  e.total.invertido += v.aporte;
  anotar(e, dia, 'socio', id, -v.aporte);
  return { ok: true, aporte: v.aporte, pct: v.pct, porDia: Math.round((gananciaBase(id) * v.pct) / 100), tope: topeDeSocio(id, v.pct) };
}
// Avisás que te retirás: se hace efectivo `avisoDias` días después (hasta entonces seguís cobrando tu parte)
export function avisarRetiro(p, id, dia) {
  const s = leerNegociosVecinos(p)?.socios?.[id];
  if (!s) return { ok: false, motivo: 'nada' };
  const d = dia1(dia ?? p.dia);
  if (s.aviso) return { ok: false, motivo: 'ya', sale: s.aviso.sale };
  s.aviso = { dia: d, sale: d + SOCIEDAD.avisoDias };
  return { ok: true, sale: s.aviso.sale, devolucion: Math.round(devolucionDe(s, s.aviso.sale)) };
}
export function cancelarRetiro(p, id) {
  const s = leerNegociosVecinos(p)?.socios?.[id];
  if (!s || !s.aviso) return false;
  s.aviso = null;
  return true;
}
// cuánto devolverían hoy (si el aviso ya estuviera cumplido): para mostrarlo antes de avisar
export const devolucionHoy = (p, id, dia) => { const s = leerNegociosVecinos(p)?.socios?.[id]; return s ? Math.round(devolucionDe(s, dia1(dia ?? p.dia) + SOCIEDAD.avisoDias)) : 0; };
// Se cumple el retiro (lo llama `pasarDia` al llegar el día): devuelve el aporte según los días y te da lo que hay en la caja
export function cerrarSociedad(p, id, dia) {
  const e = leerNegociosVecinos(p), s = e?.socios?.[id];
  if (!s) return { ok: false };
  const N = NEGOCIOS[id], d = dia1(dia ?? p.dia);
  const devuelto = Math.round(devolucionDe(s, d)), caja = s.caja;
  const total = devuelto + caja;
  if (total > 0) cobrar(p, total, `Te retiraste de la sociedad ${deNegocio(N.nombre)}`, N.dueno);
  e.total.devuelto += devuelto; e.total.cobrado += caja;
  anotar(e, d, 'retiro', id, total);
  delete e.socios[id];
  return { ok: true, devuelto, caja, perdido: s.aporte - devuelto };
}

// ---------------------------------------------------------------- 4.4.3 · vender de vuelta
// El porcentaje de lo que pagaste que te darían: { base, porDias, porAmistad, ajuste, descuido, fraccion }. `n`: el negocio comprado; `ctx`: { puntos, dia }.
export function fraccionVenta(n, ctx = {}, ajuste = 0) {
  const dia = dia1(ctx.dia), tenido = Math.max(0, dia - n.desde);
  const porDias = VENTA.porDia * Math.min(tenido, VENTA.diasMax);
  const puntos = Math.max(0, Number(ctx.puntos) || 0);
  const porAmistad = VENTA.amistadMax * Math.max(0, Math.min(1, (puntos - VENTA.amistadDesde) / (VENTA.amistadHasta - VENTA.amistadDesde)));
  const descuidoDias = (n.mala || 0) / Math.max(1, tenido), descuidoCaja = (n.perdido || 0) / Math.max(1, (n.total || 0) + (n.perdido || 0));
  const descuido = Math.min(VENTA.descuido.max, descuidoDias * VENTA.descuido.dias + descuidoCaja * VENTA.descuido.perdido);
  const fraccion = Math.max(VENTA.piso, Math.min(VENTA.techo, VENTA.base + porDias + porAmistad + ajuste - descuido));
  return { base: VENTA.base, porDias, porAmistad, ajuste, descuido, fraccion };
}
// Cómo reacciona el vecino cuando le vendés el local de vuelta: 'ofendido' (lo vendés enseguida), 'regatea' (poca amistad), 'emocionado' (vuelve a su local,
// o es de apego fuerte y te quiere) o 'acepta'. Devuelve { tipo, precio, fraccion, detalle, amistad, vuelve } (el precio es de lo que pagaste, sin la caja).
export function reaccionVenta(id, n, ctx = {}) {
  const N = NEGOCIOS[id];
  if (!N || !n) return { tipo: 'acepta', precio: 0, fraccion: 0, detalle: null, amistad: 0, vuelve: false };
  const dia = dia1(ctx.dia), tenido = Math.max(0, dia - n.desde), puntos = Math.max(0, Number(ctx.puntos) || 0);
  const vuelve = n.destino === 'se-va';
  let tipo, ajuste = 0;
  if (tenido < VENTA.enseguida) { tipo = 'ofendido'; ajuste = VENTA.ofensa; }
  else if (puntos < 50) { tipo = 'regatea'; ajuste = VENTA.regateo; }
  else if (vuelve || (N.apego >= 0.8 && puntos >= 95)) { tipo = 'emocionado'; ajuste = VENTA.emocion; }
  else tipo = 'acepta';
  const detalle = fraccionVenta(n, ctx, ajuste);
  const pagado = entero(n.pagado, 1e8);
  const precio = Math.round((pagado * detalle.fraccion) / VENTA.redondeo) * VENTA.redondeo;
  return { tipo, precio, fraccion: detalle.fraccion, detalle, amistad: VENTA.amistad[tipo], vuelve };
}
// ¿Se puede vender ahora? { ok, motivo, reaccion, precio (lo que pagan por el negocio), caja (lo que había en la caja), total, pagado, dias }
//   motivos: 'nada' (no hay economía), 'no-tuyo', 'techo' (la billetera no puede con tanta plata junta)
export function evaluarVenta(p, id, ctx = {}) {
  if (!hayNegocios(p) || !hayNegocio(id)) return { ok: false, motivo: 'nada' };
  const n = leerNegociosVecinos(p)?.comprados?.[id];
  if (!n) return { ok: false, motivo: 'no-tuyo' };
  const dia = dia1(ctx.dia ?? p.dia), r = reaccionVenta(id, n, { ...ctx, dia });
  const caja = entero(n.caja, 1e8), total = r.precio + caja;
  const techo = pesosDe(p) + total > MAX_PESOS;
  return { ok: !techo && r.precio > 0, motivo: techo ? 'techo' : null, reaccion: r, precio: r.precio, caja, total, pagado: entero(n.pagado, 1e8), dias: Math.max(0, dia - n.desde) };
}
// Cierra la venta: te pagan lo que había en la caja, la sociedad (si hubiera una) se cierra, te pagan el negocio y el vecino vuelve a ser el dueño. Se puede
// recomprar más tarde (con recargo si es en menos de 30 días). Soltar a los empleados que tuvieras por este vecino lo hace el juego (con aviso).
export function vender(p, id, ctx = {}) {
  const v = evaluarVenta(p, id, ctx);
  if (!v.ok) return { ok: false, motivo: v.motivo || 'nada' };
  const e = asegurarNegociosVecinos(p), N = NEGOCIOS[id], dia = dia1(ctx.dia ?? p.dia), n = e.comprados[id];
  let cajaCobrada = 0;
  if (n.caja > 0) {
    const c = cobrar(p, n.caja, `Caja ${deNegocio(N.nombre)}, al venderlo`, N.dueno);
    if (c.ok) { cajaCobrada = c.monto; e.total.cobrado += c.monto; }
  }
  const r = cobrar(p, v.precio, `Vendiste ${N.nombre}`, N.dueno);
  let sociedad = null;
  if (e.socios[id]) sociedad = cerrarSociedad(p, id, dia);   // (no debería haber: comprar cierra la sociedad; por si una partida rara la trae)
  delete e.comprados[id];
  (e.vendidos || (e.vendidos = {}))[id] = { dia, monto: r.monto, pagado: v.pagado };
  e.total.vendido = (e.total.vendido || 0) + r.monto;
  anotar(e, dia, 'venta', id, r.monto);
  return { ok: true, precio: r.monto, caja: cajaCobrada, total: r.monto + cajaCobrada, pagado: v.pagado, fraccion: v.reaccion.fraccion, tipo: v.reaccion.tipo, amistad: v.reaccion.amistad, sociedad,
    perdida: v.pagado - r.monto, vuelve: v.reaccion.vuelve, vecino: N.vecino };
}
// Si lo recomprás ahora, ¿hay recargo? { recargo, hasta } (hasta: el día en que se acaba) o null
export function recargoDeRecompra(p, id, dia) {
  const vend = leerNegociosVecinos(p)?.vendidos?.[id], d = dia1(dia ?? p?.dia);
  return vend && d - vend.dia < VENTA.recompra.dias ? { recargo: VENTA.recompra.recargo, hasta: vend.dia + VENTA.recompra.dias } : null;
}

// ---------------------------------------------------------------- 4.4.3 · sumar plata a una sociedad ya hecha
// Lo que falta para el aporte total máximo (el 40 % del precio) y los montos que se ofrecen: un tercio, dos tercios y todo lo que falta (de a $500; nada
// por debajo del 5 % del precio, salvo el último pedazo)
export const restoDeAporte = (id, s) => (hayNegocio(id) && s ? Math.max(0, rangoDeAporte(id).max - s.aporte) : 0);
export const minimoDeAporteExtra = (id, s) => { const resto = restoDeAporte(id, s); return resto <= 0 ? 0 : Math.min(resto, Math.max(APORTE_EXTRA.redondeo, aMil(NEGOCIOS[id].precio * APORTE_EXTRA.minimoFraccion, APORTE_EXTRA.redondeo))); };
export function montosDeAporteExtra(id, s) {
  const resto = restoDeAporte(id, s), min = minimoDeAporteExtra(id, s);
  if (resto <= 0) return [];
  return [...new Set([aMil(resto / 3, APORTE_EXTRA.redondeo), aMil((resto * 2) / 3, APORTE_EXTRA.redondeo), resto])].filter((x) => x >= min && x <= resto);
}
// lo que sube tu porcentaje por `monto` (al mismo precio por punto que el aporte original: el monto sobre el precio del negocio por el factor de la amistad)
export const puntosDeAporte = (id, monto, factor = SOCIEDAD.factorAmigo) => (NEGOCIOS[id] ? Math.round(((Number(monto) || 0) / NEGOCIOS[id].precio) * 100 * factor * 10) / 10 : 0);
export const porcentajeConAporte = (id, s, monto, factor) => Math.min(SOCIEDAD.porcentajeMax, Math.round((s.pct + puntosDeAporte(id, monto, factor)) * 10) / 10);
// La reacción: 'acepta' | 'tope' (ya pusiste lo máximo) | 'rechaza' (la amistad bajó de lo que hacía falta para entrar) | 'resiste' | 'aviso' (avisaste que te retirás)
export function reaccionAporteExtra(id, s, ctx = {}) {
  const N = NEGOCIOS[id];
  if (!N || !s) return { tipo: 'rechaza', factor: 0 };
  if (restoDeAporte(id, s) <= 0 || (s.extras || []).length >= APORTE_EXTRA.maxExtras) return { tipo: 'tope', factor: 0 };
  if (s.aviso) return { tipo: 'aviso', factor: 0 };
  const r = reaccionSocio(id, ctx);
  return r.tipo === 'acepta' ? { tipo: 'acepta', factor: r.factor } : { tipo: r.tipo, factor: 0, faltan: r.faltan, pide: r.pide };
}
export function evaluarAporteExtra(p, id, monto, ctx = {}) {
  if (!hayNegocios(p) || !hayNegocio(id)) return { ok: false, motivo: 'nada' };
  const s = leerNegociosVecinos(p)?.socios?.[id];
  if (!s) return { ok: false, motivo: 'no-socio' };
  const r = reaccionAporteExtra(id, s, ctx);
  if (r.tipo !== 'acepta') return { ok: false, motivo: r.tipo, reaccion: r };
  const min = minimoDeAporteExtra(id, s), max = restoDeAporte(id, s), a = Math.floor(Number(monto) || 0);
  if (a < min || a > max) return { ok: false, motivo: 'monto', reaccion: r, min, max };
  const saldo = pesosDe(p);
  return { ok: saldo >= a, motivo: saldo >= a ? null : 'dinero', reaccion: r, aporte: a, aporteTotal: s.aporte + a, pct: porcentajeConAporte(id, s, a, r.factor), pctAntes: s.pct, faltan: Math.max(0, a - saldo) };
}
export function sumarAporte(p, id, monto, ctx = {}) {
  const v = evaluarAporteExtra(p, id, monto, ctx);
  if (!v.ok) return { ok: false, motivo: v.motivo, faltan: v.faltan || 0, reaccion: v.reaccion };
  const e = asegurarNegociosVecinos(p), N = NEGOCIOS[id], dia = dia1(ctx.dia ?? p.dia), s = e.socios[id];
  const r = pagar(p, v.aporte, `Aporte adicional a tu sociedad en ${N.nombre}`, N.dueno);
  if (!r.ok) return { ok: false, motivo: 'dinero', faltan: r.faltan || 0 };
  if (!s.previo || s.previo.dia < dia) s.previo = { dia, pct: s.pct };   // hasta hoy se cobra al porcentaje de antes; el nuevo rinde desde mañana
  if (!Array.isArray(s.extras)) s.extras = [];
  s.extras.push({ dia, monto: v.aporte });
  s.aporte += v.aporte;
  s.pct = v.pct;
  e.total.invertido += v.aporte;
  anotar(e, dia, 'aporte', id, -v.aporte);
  return { ok: true, aporte: v.aporte, aporteTotal: s.aporte, pct: s.pct, pctAntes: v.pctAntes, porDia: Math.round((gananciaBase(id) * s.pct) / 100), tope: topeDeSocio(id, s.pct), resto: restoDeAporte(id, s) };
}

// ---------------------------------------------------------------- lo que se cuenta
// Un resumen de tus cosas, para el cuaderno y para el banco. `hoy`: el día (para los días de socio y la gestión).
export function resumenNegociosVecinos(p, hoy = null) {
  const e = leerNegociosVecinos(p), d = dia1(hoy ?? p?.dia);
  const ids = tusNegocios(p);
  const propios = ids.map((id, i) => {
    const n = e.comprados[id], N = NEGOCIOS[id];
    const porDia = gananciaEstimada(id, { gestion: factorGestion(d - n.visita), cartera: factorCartera(i), sinVecino: n.destino === 'se-va', bono: n.bono });
    return { id, nombre: N.nombre, corto: N.corto, dueno: N.dueno, destino: n.destino, desde: n.desde, pagado: n.pagado, caja: n.caja, tope: topeDeCaja(id), total: n.total, perdido: n.perdido,
      ultimo: n.ultimo, mala: n.mala || 0, sinVer: d - n.visita, gestion: factorGestion(d - n.visita), cartera: factorCartera(i), porDia, base: gananciaBase(id), sueldo: N.sueldo, gastos: N.gastos, llena: n.caja >= topeDeCaja(id) };
  });
  const socios = tusSociedades(p).map((id) => {
    const s = e.socios[id], N = NEGOCIOS[id];
    return { id, nombre: N.nombre, corto: N.corto, dueno: N.dueno, desde: s.desde, dias: Math.max(0, d - s.desde), aporte: s.aporte, pct: s.pct, caja: s.caja, tope: topeDeSocio(id, s.pct), total: s.total,
      porDia: Math.round((gananciaBase(id) * s.pct) / 100), aviso: s.aviso, devolucion: Math.round(devolucionDe(s, d)), ultimo: s.ultimo, extras: (s.extras || []).length, restoAporte: restoDeAporte(id, s), aporteMax: rangoDeAporte(id).max };
  });
  return {
    hay: !!e && (propios.length > 0 || socios.length > 0), propios, socios, caja: cajasTotal(p), porDia: propios.reduce((s, x) => s + x.porDia, 0) + socios.reduce((s, x) => s + x.porDia, 0),
    total: e ? e.total : { ganado: 0, invertido: 0, devuelto: 0, cobrado: 0, vendido: 0 }, historial: e ? e.historial.slice().reverse() : [],
  };
}
// «$1.200 por día»
export const porDiaTexto = (n) => `${formatoPesos(n)} por día`;

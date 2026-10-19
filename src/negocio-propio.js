// 4.3 · EL NEGOCIO PROPIO: reglas (módulo puro, se prueba en Node). Lo que toca el juego (los clientes que caminan, la E, el panel) está en
// negocio-propio-juego.js y la geometría de los locales en planos-negocio.js. Nada de acá corre por cuadro: son cuentas que se hacen al
// despachar, al surtir o cada tanto (el juego avanza la cola unas pocas veces por segundo).
//
// Cómo anda el local:
//   · es UN local por partida (`progreso.negocioPropio`): el estado vive acá, no en la obra, así el stock, la caja y el nombre que te hacés
//     sobreviven aunque lo muevas o lo rehagas; el local es el edificio donde se atiende (planos-negocio.js);
//   · estantes con stock real: lo que dejás sale de tu mochila (o de tus depósitos, si es material) y cada cosa tiene su tope (6 lotes);
//   · tres precios por producto (barato, normal, caro): el precio mueve cuántos clientes vienen (`factorPrecio`) y cuánto ganás por cada uno;
//   · la reputación (0 a 100) sube con buena atención (despachar rápido, tener lo que piden) y con los días, y baja si dejás clientes sin
//     atender o te faltan cosas: trae más clientes (`factorReputacion`);
//   · los clientes llegan sólo si el local está abierto, vos estás cerca y hay algo para vender; se acercan caminando al mostrador (hasta
//     tres juntos), piden algo de lo que les gusta (cada perfil tiene sus gustos), y esperan un rato: cada despacho es con la E;
//   · lo que se cobra entra a la caja del local (con tope: llena, no se atiende más); se retira de a toda a la billetera.
// Sólo en el Relax (sin economía no hay negocio). Los partidas viejas no traen el campo: arrancan en el estado nuevo, sin tocar nada más.
import { BIENES, esBien, hashTexto, azarDe } from './comercio.js';
import { hayEconomia, cobrar, formatoPesos } from './economia.js';

const entero = (v, max = 1e7) => Math.max(0, Math.min(max, Math.floor(Number(v)) || 0));
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
const redondo = (v, paso = 10) => Math.round(v / paso) * paso;

export const CAJA_MAX = 12000;          // lo que entra en la caja del local (igual que las cajas de la aldea: negocios.js)
export const REP_INICIAL = 25;
export const HORA_ABRE = 8;
export const HORA_CIERRA = 21;   // cuándo sale a comprar la gente (el local abierto de noche no vende)
export const LOTES_POR_ESTANTE = 6;     // lo que cabe de cada producto, en lotes del mercado (comercio.js)

// ---------------------------------------------------------------- los tipos de local
// `mercaderia`: lo que se vende (ids de comercio.js); `plano`: el edificio (planos-negocio.js). Para sumar un tipo: una entrada acá, su plano y,
// si hace falta, un perfil de cliente nuevo. El resto (stock, precios, clientes, caja) sale solo.
export const TIPOS = {
  almacen: {
    id: 'almacen', plano: 'local-almacen', nombre: 'Almacén de campo', corto: 'tu almacén',
    mercaderia: ['huevo', 'harina', 'papa', 'pan-casero', 'miel', 'frasco-frutilla', 'calafate-seco', 'hongos-secos', 'trucha-ahumada', 'poncho', 'lana', 'tronco', 'tabla', 'piedra'],
  },
  panaderia: {
    id: 'panaderia', plano: 'local-panaderia', nombre: 'Panadería y cafetería', corto: 'tu panadería',
    mercaderia: ['pan-casero', 'empanadas', 'miel', 'frasco-frutilla', 'calafate-seco', 'huevo', 'harina'],
  },
};
export const IDS_TIPOS = Object.keys(TIPOS);
export const IDS_LOCALES = IDS_TIPOS.map((t) => TIPOS[t].plano);
export const tipoDePlano = (id) => IDS_TIPOS.find((t) => TIPOS[t].plano === id) || null;
export const esLocal = (id) => tipoDePlano(id) !== null;
export const catalogo = (tipo) => (Object.hasOwn(TIPOS, tipo) ? TIPOS[tipo].mercaderia : []);

// Cómo se dice cada cosa suelta (una unidad, varias)
export const UNIDAD = {
  huevo: ['huevo', 'huevos'], harina: ['medida de harina', 'medidas de harina'], papa: ['papa', 'papas'], haba: ['haba', 'habas'], frutilla: ['frutilla', 'frutillas'],
  'pan-casero': ['pan casero', 'panes caseros'], empanadas: ['empanada', 'empanadas'], miel: ['frasco de miel', 'frascos de miel'], 'frasco-frutilla': ['frasco de dulce', 'frascos de dulce'],
  'calafate-seco': ['puñado de calafate seco', 'puñados de calafate seco'], 'hongos-secos': ['bolsita de llao llao seco', 'bolsitas de llao llao seco'],
  'trucha-ahumada': ['trucha ahumada', 'truchas ahumadas'], poncho: ['poncho', 'ponchos'], lana: ['vellón de lana', 'vellones de lana'], tronco: ['tronco de leña', 'troncos de leña'],
  tabla: ['tabla', 'tablas'], piedra: ['piedra', 'piedras'],
};
export const nombreUnidad = (k, n = 2) => (Object.hasOwn(UNIDAD, k) ? UNIDAD[k][n === 1 ? 0 : 1] : (BIENES[k]?.nombre || k).toLowerCase());
export const textoCantidad = (k, n) => `${n} ${nombreUnidad(k, n)}`;
const lista = (partes) => (partes.length <= 1 ? partes.join('') : `${partes.slice(0, -1).join(', ')} y ${partes.at(-1)}`);
export const textoLista = (items) => lista(items.map((x) => textoCantidad(x.k, x.n)));

// ---------------------------------------------------------------- los precios
// Tres niveles. El precio de plaza de una unidad es el de comercio.js (`precioPlaza`: lo que vale el lote entre cuántos trae); el local cobra un poco más (es lo que gana), y el cliente
// reacciona: con barato vienen más y se van contentos; con caro vienen menos. `demanda` es el mínimo de clientes que quedan (se eleva a la
// sensibilidad del perfil: el viajero casi no mira el precio, la vecina sí). `rep`: cuánto vale la buena atención para la reputación.
export const NIVELES = [
  { id: 'barato', nombre: 'Barato', mult: 0.98, demanda: 1.3, rep: 1.25 },
  { id: 'normal', nombre: 'Normal', mult: 1.15, demanda: 1.0, rep: 1.0 },
  { id: 'caro', nombre: 'Caro', mult: 1.4, demanda: 0.5, rep: 0.6 },
];
export const NIVEL_NORMAL = 1;
export const nivelDeProducto = (est, k) => { const n = est?.precios?.[k]; return n === 0 || n === 2 ? n : NIVEL_NORMAL; };
// (lo mismo que `unidadEnPesos` de cantina.js: acá se calcula sin traer media aldea de dependencias, para que los planos puedan importar este módulo)
export const precioPlaza = (k) => (esBien(k) ? Math.max(1, Math.round((BIENES[k].valor * 100) / BIENES[k].lote)) : 0);
export const precioUnidad = (k, nivel = NIVEL_NORMAL) => (esBien(k) ? Math.max(10, redondo(precioPlaza(k) * NIVELES[nivel === 0 || nivel === 2 ? nivel : 1].mult, 10)) : 0);
export const topeEstante = (k) => (esBien(k) ? LOTES_POR_ESTANTE * BIENES[k].lote : 0);
export const hayStock = (est, k) => entero(est?.stock?.[k]) > 0;
export const unidadesEnEstantes = (est) => Object.values(est?.stock || {}).reduce((s, n) => s + entero(n), 0);
export const valorDelStock = (est) => Object.entries(est?.stock || {}).reduce((s, [k, n]) => s + entero(n) * precioUnidad(k, nivelDeProducto(est, k)), 0);

// ---------------------------------------------------------------- los clientes (quiénes son y qué les gusta)
// `gustos`: peso de cada cosa; `horas`: cuándo sale (fuera de ese rato, la mitad de ganas); `sens`: cuánto le pesa el precio.
export const PERFILES = {
  vecina: { nombre: 'una vecina', etiqueta: 'Vecina de la aldea', sens: 1.15, horas: [8, 14], peso: 3, gustos: { huevo: 3, 'pan-casero': 3, harina: 2, papa: 2, miel: 1, 'frasco-frutilla': 1 } },
  hachero: { nombre: 'un hachero', etiqueta: 'Hachero', sens: 0.9, horas: [11, 19], peso: 2, gustos: { empanadas: 3, 'pan-casero': 2, 'trucha-ahumada': 2, tronco: 1, harina: 1, 'hongos-secos': 1 } },
  merendera: { nombre: 'una vecina con ganas de merendar', etiqueta: 'Vecina', sens: 1.0, horas: [15, 20], peso: 2, gustos: { 'pan-casero': 4, empanadas: 3, miel: 2, 'frasco-frutilla': 2, 'calafate-seco': 1 } },
  constructor: { nombre: 'un constructor', etiqueta: 'Constructor', sens: 0.8, horas: [8, 17], peso: 1.5, gustos: { tabla: 3, tronco: 3, piedra: 2, lana: 1 } },
  tejedora: { nombre: 'una tejedora', etiqueta: 'Tejedora', sens: 0.9, horas: [9, 18], peso: 1, gustos: { lana: 3, poncho: 1, harina: 2, miel: 1 } },
  viajero: { nombre: 'un viajero de la trochita', etiqueta: 'Viajero', sens: 0.45, horas: [11, 20], peso: 2, gustos: { 'frasco-frutilla': 3, miel: 2, 'calafate-seco': 3, 'hongos-secos': 2, poncho: 1, 'trucha-ahumada': 2, empanadas: 2 } },
};
export const IDS_PERFILES = Object.keys(PERFILES);
// cuántas unidades pide de cada cosa, de a cuánto (el resto, entre 1 y 3)
export const PEDIDO = { huevo: [2, 4], harina: [1, 2], papa: [2, 3], 'pan-casero': [1, 3], empanadas: [1, 3], miel: [1, 2], 'frasco-frutilla': [1, 2], 'calafate-seco': [1, 2], 'hongos-secos': [1, 2], 'trucha-ahumada': [1, 2], poncho: [1, 1], lana: [1, 2], tronco: [1, 3], tabla: [1, 3], piedra: [1, 3] };
const rangoPedido = (k) => PEDIDO[k] || [1, Math.min(3, BIENES[k]?.lote || 1)];

// El peso de cada cosa entre todos los gustos: lo que más se pide pesa más al calcular cuántos clientes trae un precio
const POPULARIDAD = (() => { const p = {}; for (const f of Object.values(PERFILES)) for (const [k, w] of Object.entries(f.gustos)) p[k] = (p[k] || 0) + w * f.peso; return p; })();
export const popularidad = (k) => POPULARIDAD[k] || 0.5;

// ---------------------------------------------------------------- la demanda
export const DEMANDA = { llegadasBase: 5.2, tope: 14, lluvia: 0.7, repMin: 0.7, repPaso: 0.7, variedadMin: 0.5, variedadPaso: 0.1, variedadPlena: 5 };
// Cuánto vale la reputación para atraer gente: de 0,65 (nadie te conoce) a 1,55 (el mejor del valle)
export const factorReputacion = (rep) => DEMANDA.repMin + DEMANDA.repPaso * (limitar(Number(rep) || 0, 0, 100) / 100);
// Cuánta gente viene con tus precios: el promedio, pesado por lo popular, de lo que tenés en los estantes (lo que no está, no cuenta)
export function factorPrecio(est, tipo) {
  let s = 0, w = 0;
  for (const k of catalogo(tipo)) {
    if (!hayStock(est, k)) continue;
    const peso = popularidad(k);
    s += peso * NIVELES[nivelDeProducto(est, k)].demanda; w += peso;
  }
  return w > 0 ? s / w : 1;
}
// Cuánta variedad se ve en los estantes: con cinco cosas distintas, la gente encuentra lo que busca
export const cuantasCosas = (est, tipo) => catalogo(tipo).filter((k) => hayStock(est, k)).length;
export const factorVariedad = (est, tipo) => limitar(DEMANDA.variedadMin + DEMANDA.variedadPaso * cuantasCosas(est, tipo), DEMANDA.variedadMin, 1);
// Clientes que se esperan en un día con el local abierto y vos ahí todo el rato
export function llegadasPorDia(est, tipo, env = {}) {
  if (!cuantasCosas(est, tipo)) return 0;
  const lluvia = env.lluvia > 0.4 ? DEMANDA.lluvia : 1;
  return Math.min(DEMANDA.tope, DEMANDA.llegadasBase * factorReputacion(est.rep) * factorPrecio(est, tipo) * factorVariedad(est, tipo) * lluvia);
}
// Cómo se reparte el día: la mañana de compras y la tardecita
const PESO_HORA = { 8: 0.6, 9: 1.0, 10: 1.2, 11: 1.2, 12: 0.9, 13: 0.6, 14: 0.6, 15: 0.8, 16: 1.0, 17: 1.3, 18: 1.3, 19: 0.9, 20: 0.5 };
const PESO_TOTAL = Object.values(PESO_HORA).reduce((s, v) => s + v, 0);
export const pesoDeHora = (hora) => PESO_HORA[Math.floor(Number(hora))] || 0;
export const tasaPorHora = (est, tipo, hora, env = {}) => (pesoDeHora(hora) > 0 ? (llegadasPorDia(est, tipo, env) * pesoDeHora(hora)) / PESO_TOTAL : 0);

// ---------------------------------------------------------------- el estado guardado
export function negocioPropioNuevo() {
  return {
    v: 1, tipo: null, abierto: false, stock: {}, precios: {}, rep: REP_INICIAL, caja: 0,
    hoy: { dia: 0, clientes: 0, atendidos: 0, perdidos: 0, faltas: 0, ventas: 0, unidades: 0 },
    total: { clientes: 0, atendidos: 0, perdidos: 0, ventas: 0, unidades: 0, dias: 0, mejorDia: 0 },
  };
}
export const hayNegocioPropio = (p) => hayEconomia(p) && objeto(p?.negocioPropio);
export function negocioPropioDe(p) {
  if (!hayEconomia(p)) return null;
  if (!objeto(p.negocioPropio)) p.negocioPropio = negocioPropioNuevo();
  return p.negocioPropio;
}
export function sanearNegocioPropio(v, hoy = 1e6) {
  const base = negocioPropioNuevo();
  if (!objeto(v)) return base;
  const dia = Math.max(1, entero(hoy, 1e6));
  const tipo = Object.hasOwn(TIPOS, v.tipo) ? v.tipo : null;
  const stock = {}, precios = {};
  if (tipo && objeto(v.stock)) for (const k of catalogo(tipo)) { const n = Math.min(entero(v.stock[k], 1e4), topeEstante(k)); if (n > 0) stock[k] = n; }
  if (tipo && objeto(v.precios)) for (const k of catalogo(tipo)) if (v.precios[k] === 0 || v.precios[k] === 2) precios[k] = v.precios[k];
  const h = objeto(v.hoy) ? v.hoy : {}, t = objeto(v.total) ? v.total : {};
  const rep = Number(v.rep);
  return {
    v: 1, tipo, abierto: v.abierto === true && tipo !== null, stock, precios,
    rep: Number.isFinite(rep) ? Math.round(limitar(rep, 0, 100) * 10) / 10 : REP_INICIAL, caja: entero(v.caja, CAJA_MAX),
    hoy: { dia: Math.min(dia, entero(h.dia, 1e6)), clientes: entero(h.clientes, 500), atendidos: entero(h.atendidos, 500), perdidos: entero(h.perdidos, 500), faltas: entero(h.faltas, 500), ventas: entero(h.ventas, 1e7), unidades: entero(h.unidades, 1e5) },
    total: { clientes: entero(t.clientes, 1e7), atendidos: entero(t.atendidos, 1e7), perdidos: entero(t.perdidos, 1e7), ventas: entero(t.ventas, 1e10), unidades: entero(t.unidades, 1e8), dias: entero(t.dias, 1e6), mejorDia: entero(t.mejorDia, 1e8) },
  };
}

// ---------------------------------------------------------------- lo que se ve en el local
// Cuánto se ve de cada cosa en el estante (0 vacío, 1 poco, 2 medio, 3 lleno) y si está abierto: la obra lo guarda en `datos.local` (una copia,
// sólo para dibujar: la verdad está en `progreso.negocioPropio`) y la malla se rehace cuando la firma cambia (al surtir, al vender, al abrir).
export const pasoDeEstante = (n, k) => { const h = entero(n); return h <= 0 ? 0 : h <= topeEstante(k) * 0.25 ? 1 : h <= topeEstante(k) * 0.6 ? 2 : 3; };
export function vistaDelLocal(est) {
  const p = {};
  for (const k of catalogo(est.tipo)) { const s = pasoDeEstante(est.stock[k], k); if (s > 0) p[k] = s; }
  return { abierto: est.abierto === true, p };
}
export const firmaDeVista = (v) => `${v?.abierto ? 'A' : 'C'}|${Object.entries(v?.p || {}).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, s]) => k + s).join(',')}`;

// ---------------------------------------------------------------- la reputación
export const REP_NIVELES = [
  { desde: 0, nombre: 'Nadie te conoce' }, { desde: 20, nombre: 'Un local más del valle' }, { desde: 40, nombre: 'Con clientela' },
  { desde: 65, nombre: 'De confianza' }, { desde: 85, nombre: 'El mejor del valle' },
];
export const nivelDeRep = (rep) => { let n = 0; REP_NIVELES.forEach((x, i) => { if ((Number(rep) || 0) >= x.desde) n = i; }); return n; };
export const nombreDeRep = (rep) => REP_NIVELES[nivelDeRep(rep)].nombre;
export const REP = { rapido: 0.6, normal: 0.36, lento: 0.15, tiempoRapido: 15, tiempoNormal: 35, completo: 0.2, falta: 0.5, sinNada: 0.6, sinAtender: 1.5, diaBueno: 0.2, atendidosParaDiaBueno: 3 };
// Sumar o restar: lo que sube cuesta más a medida que te hacés conocido (nunca de golpe); lo que baja, no
function moverRep(est, d) {
  est.rep = Math.round(limitar(est.rep + (d > 0 ? d * (1 - est.rep / 130) : d), 0, 100) * 10) / 10;
}

// ---------------------------------------------------------------- el día
// Pone al día los contadores de hoy (al pasar de día se cierran las cuentas del anterior: si atendiste a la gente, la fama sube de a poco)
export function ponerAlDia(est, dia) {
  const d = Math.max(1, entero(dia, 1e6));
  if (est.hoy.dia === d) return false;
  if (est.hoy.dia > 0) {
    if (est.hoy.atendidos > 0) est.total.dias++;
    if (est.hoy.atendidos >= REP.atendidosParaDiaBueno && est.hoy.perdidos === 0) moverRep(est, REP.diaBueno);
    est.total.mejorDia = Math.max(est.total.mejorDia, est.hoy.ventas);
  }
  est.hoy = { dia: d, clientes: 0, atendidos: 0, perdidos: 0, faltas: 0, ventas: 0, unidades: 0 };
  return true;
}

// ---------------------------------------------------------------- surtir los estantes
// `env`: { tengo(k), quitar(k, n) } (la mochila, y los depósitos si es material: lo arma el juego)
export function surtir(est, k, n, env) {
  if (!est.tipo || !catalogo(est.tipo).includes(k)) return 0;
  const cabe = topeEstante(k) - entero(est.stock[k]);
  const mueve = Math.min(entero(n, 1e5), cabe, entero(env.tengo(k)));
  if (mueve <= 0) return 0;
  env.quitar(k, mueve);
  est.stock[k] = entero(est.stock[k]) + mueve;
  return mueve;
}
// Todo lo que tenés de lo que vende el local, hasta el tope de cada cosa: [{ k, n }]
export function surtirTodo(est, env) {
  const puesto = [];
  for (const k of catalogo(est.tipo)) { const n = surtir(est, k, 1e5, env); if (n > 0) puesto.push({ k, n }); }
  return puesto;
}
// Sacar del estante (todo o hasta `n`): vuelve [{ k, n }] y el que llama se lo da al jugador
export function sacarDelEstante(est, k, n = 1e5) {
  const hay = entero(est.stock[k]), saca = Math.min(hay, entero(n, 1e5));
  if (saca <= 0) return 0;
  est.stock[k] = hay - saca;
  if (est.stock[k] <= 0) delete est.stock[k];
  return saca;
}
export function ponerPrecio(est, k, nivel) {
  if (!est.tipo || !catalogo(est.tipo).includes(k) || ![0, 1, 2].includes(nivel)) return false;
  if (nivel === NIVEL_NORMAL) delete est.precios[k]; else est.precios[k] = nivel;
  return true;
}
export const siguienteNivel = (nivel) => (nivel + 1) % 3;
// Retira la caja a la billetera: vuelve los pesos
export function retirarCaja(p, est) {
  if (est.caja <= 0) return 0;
  const r = cobrar(p, est.caja, 'Ventas de tu local', est.tipo ? TIPOS[est.tipo].corto : 'Tu local');
  if (r.ok) est.caja -= r.monto;
  return r.monto || 0;
}
// Al desarmar el local: todo vuelve a vos (la mercadería, la plata de la caja). El estante queda vacío y el nombre que te hiciste, también.
export function cerrarLocal(p, est, darCosa) {
  const devuelto = [];
  for (const k of Object.keys(est.stock)) { const n = sacarDelEstante(est, k); if (n > 0) { darCosa(k, n); devuelto.push({ k, n }); } }
  const plata = retirarCaja(p, est);
  est.abierto = false; est.tipo = null; est.precios = {};
  return { devuelto, plata };
}

// ---------------------------------------------------------------- un cliente
// Armar un cliente de la hora: quién es y qué pide. `semilla` (número) hace que sea el mismo para la misma cuenta (pruebas, simulador).
export function armarCliente(est, tipo, semilla, hora = 12) {
  const r = azarDe(hashTexto(`cliente|${semilla}`));
  const cat = catalogo(tipo);
  const posibles = IDS_PERFILES.filter((id) => cat.some((k) => PERFILES[id].gustos[k]));
  if (!posibles.length) return null;
  const pesoPerfil = (id) => { const f = PERFILES[id]; return f.peso * ((hora >= f.horas[0] && hora < f.horas[1]) ? 1 : 0.35); };
  let x = r() * posibles.reduce((s, id) => s + pesoPerfil(id), 0), perfil = posibles[posibles.length - 1];
  for (const id of posibles) { x -= pesoPerfil(id); if (x <= 0) { perfil = id; break; } }
  const f = PERFILES[perfil];
  const lineas = 1 + (r() < 0.4 ? 1 : 0) + (r() < 0.1 ? 1 : 0);
  const gustos = cat.filter((k) => f.gustos[k]);
  const pide = [];
  for (let i = 0; i < lineas && gustos.length; i++) {
    let y = r() * gustos.reduce((s, k) => s + f.gustos[k], 0), k = gustos[gustos.length - 1];
    for (const g of gustos) { y -= f.gustos[g]; if (y <= 0) { k = g; break; } }
    gustos.splice(gustos.indexOf(k), 1);
    const [a, b] = rangoPedido(k);
    pide.push({ k, n: a + Math.floor(r() * (b - a + 1)) });
  }
  return { perfil, pide, paciencia: Math.round(COLA.paciencia * (0.8 + r() * 0.4)), espera: 0, edad: 0, listo: false, frase: Math.floor(r() * 1000) };
}
const FRASES = [
  (l) => `Buenas. ¿Me das ${l}?`, (l) => `Quería ${l}, si tenés.`, (l) => `Vengo por ${l}.`, (l) => `¿Me alcanzás ${l}, por favor?`, (l) => `Ponme ${l}.`,
];
export const fraseDePedido = (c) => FRASES[(c?.frase || 0) % FRASES.length](textoLista(c.pide));
export const etiquetaDe = (c) => PERFILES[c?.perfil]?.etiqueta || 'Cliente';

// Despachar un cliente (E): vende lo que haya de lo que pidió, cobra a la caja y mueve la reputación.
// Vuelve { ok, motivo?, vendidos, faltan, total, unidades }. Con `motivo: 'caja'` no se atiende (la caja no tiene lugar) y nada se mueve.
export function despachar(est, c) {
  const vendidos = [], faltan = [];
  let total = 0, unidades = 0, repNivel = 0;
  for (const l of c.pide) {
    const hay = entero(est.stock[l.k]), n = Math.min(l.n, hay);
    if (n < l.n) faltan.push({ k: l.k, n: l.n - n });
    if (n > 0) { const nv = nivelDeProducto(est, l.k), pu = precioUnidad(l.k, nv); vendidos.push({ k: l.k, n, pu, sub: pu * n }); total += pu * n; unidades += n; repNivel += NIVELES[nv].rep * pu * n; }
  }
  if (est.caja + total > CAJA_MAX) return { ok: false, motivo: 'caja', vendidos: [], faltan: [], total, unidades: 0 };
  if (!vendidos.length) {
    est.hoy.atendidos++; est.hoy.faltas += faltan.length; est.total.atendidos++;
    moverRep(est, -REP.sinNada * faltan.length);
    return { ok: true, nada: true, vendidos, faltan, total: 0, unidades: 0 };
  }
  for (const v of vendidos) { est.stock[v.k] = entero(est.stock[v.k]) - v.n; if (est.stock[v.k] <= 0) delete est.stock[v.k]; }
  est.caja += total;
  est.hoy.atendidos++; est.hoy.ventas += total; est.hoy.unidades += unidades; est.hoy.faltas += faltan.length;
  est.total.atendidos++; est.total.ventas += total; est.total.unidades += unidades;
  const espera = Number(c.espera) || 0;
  const rapidez = espera <= REP.tiempoRapido ? REP.rapido : espera <= REP.tiempoNormal ? REP.normal : REP.lento;
  const precio = total > 0 ? repNivel / total : 1;
  let d = rapidez * precio - REP.falta * faltan.length;
  if (!faltan.length) d += REP.completo;
  moverRep(est, d);
  return { ok: true, vendidos, faltan, total, unidades, rep: d };
}
// El cliente se cansó de esperar (o vos no estabas): baja la fama
export function sinAtender(est, conCastigo = true) {
  est.hoy.perdidos++; est.total.perdidos++;
  if (conCastigo) moverRep(est, -REP.sinAtender);
}

// ---------------------------------------------------------------- la cola de clientes
export const COLA = { maxPresentes: 3, paciencia: 60, vidaMax: 150, radioAtencion: 35, radioPartir: 50 };
export function colaNueva() { return { n: 0, acum: 0, clientes: [] }; }
export const hayLugarEnCola = (cola, max = COLA.maxPresentes) => cola.clientes.length < Math.min(COLA.maxPresentes, max);
// Avanza la cola `dt` segundos reales (y `dtHoras` horas de juego). `env`: { hora, dia, presente (estás a menos de radioAtencion), lluvia }.
// `env.max`: lo más que puede haber a la vez. Puede sumar clientes (llegan) y sacarlos (se fueron). Vuelve los eventos: [{ tipo: 'llega' | 'se-cansa' | 'parte' | 'extravio', cliente }].
// Un cliente `listo` es el que ya llegó al mostrador (el juego lo marca): sólo ése gasta paciencia.
export function avanzarCola(cola, est, tipo, dt, dtHoras, env = {}) {
  const ev = [];
  const abre = est.abierto && est.tipo === tipo;
  for (const c of [...cola.clientes]) {
    c.edad += dt;
    const sale = () => { cola.clientes.splice(cola.clientes.indexOf(c), 1); };
    if (!env.presente && !c.partiendo) { sale(); ev.push({ tipo: 'parte', cliente: c }); continue; }
    if (c.listo) {
      c.espera += dt;
      if (c.espera >= c.paciencia) { sale(); sinAtender(est, true); ev.push({ tipo: 'se-cansa', cliente: c }); }
    } else if (c.edad >= COLA.vidaMax) { sale(); ev.push({ tipo: 'extravio', cliente: c }); }
  }
  const hora = Number(env.hora) || 0;
  const puede = abre && env.presente && hora >= HORA_ABRE && hora < HORA_CIERRA && est.caja < CAJA_MAX;
  if (!puede) { cola.acum = 0; return ev; }
  cola.acum += tasaPorHora(est, tipo, hora, env) * Math.max(0, dtHoras);
  const max = Number.isFinite(env.max) ? env.max : COLA.maxPresentes;   // (el juego dice cuántos puede haber a la vez: los que tienen figura libre)
  while (cola.acum >= 1 && hayLugarEnCola(cola, max)) {
    cola.acum -= 1;
    const c = armarCliente(est, tipo, `${env.dia || 0}|${cola.n++}`, hora);
    if (!c) break;
    cola.clientes.push(c); est.hoy.clientes++; est.total.clientes++;
    ev.push({ tipo: 'llega', cliente: c });
  }
  if (!hayLugarEnCola(cola, max)) cola.acum = Math.min(cola.acum, 1);
  return ev;
}
export const primeroEnLaCola = (cola) => cola.clientes.find((c) => c.listo) || null;

// ---------------------------------------------------------------- lo que muestra el panel y lo que dice el aviso (puro: se prueba)
export function filasDelPanel(est, tipo, env = {}) {
  return catalogo(tipo).map((k) => ({
    k, nombre: BIENES[k].nombre, hay: entero(est.stock[k]), tope: topeEstante(k), nivel: nivelDeProducto(est, k), precio: precioUnidad(k, nivelDeProducto(est, k)),
    plaza: precioPlaza(k), enMano: entero(env.tengo ? env.tengo(k) : 0), lote: BIENES[k].lote,
  }));
}
export function resumenDelDia(est) {
  const h = est.hoy;
  return `${h.atendidos} ${h.atendidos === 1 ? 'cliente atendido' : 'clientes atendidos'}${h.perdidos ? `, ${h.perdidos} sin atender` : ''}`;
}
export function avisoDelLocal(est, tipo, cola, ahoraHora, hayPanel = false) {
  const T = TIPOS[tipo];
  if (est.tipo !== tipo) return `${T.nombre}: abrirlo y surtirlo`;
  const espera = primeroEnLaCola(cola);
  if (espera) return `Atender: ${textoLista(espera.pide)} (${etiquetaDe(espera).toLowerCase()})`;
  if (!est.abierto) return `${T.corto}: cerrado. Abrirlo, surtir y fijar precios`;
  if (est.caja >= CAJA_MAX) return `${T.corto}: la caja está llena, retirá la plata`;
  if (!cuantasCosas(est, tipo)) return `${T.corto}: sin mercadería. Surtí los estantes`;
  if (!(ahoraHora >= HORA_ABRE && ahoraHora < HORA_CIERRA)) return `${T.corto}: a esta hora no sale nadie de compras`;
  return `${T.corto}: esperando clientes${est.caja > 0 ? ` · en caja ${formatoPesos(est.caja)}` : ''}`;
}

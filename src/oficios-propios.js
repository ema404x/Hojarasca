// 4.2 · LOS EDIFICIOS DE OFICIO PROPIOS: reglas (módulo puro, se prueba en Node). La geometría está en planos-oficios.js y el cableado
// del juego (la tecla E, el aviso, el guardado dentro de cada obra) en main.js. Ocho construcciones de $18.000 a $42.000 que le dan un
// destino a la plata y que hacen algo modesto pero real. Los precios y por qué: PRECIOS_CONSTRUCCION.md y CAMBIOS_4_2_OFICIOS.md.
//
//   · talleres que producen (panadería de horno grande, telar grande, cervecería, quesería, cantería): se CARGAN con E (lo que pide cada uno) y
//     trabajan solos: una tanda por día, hasta un tope de tandas en el taller. Volver a los días o a las semanas no rompe nada: lo que hay es lo
//     que cabe (el tope), y al volver con E se RETIRA lo hecho y se vuelve a cargar de una. Nada corre por cuadro: el estado es un contador y la
//     hora en que arrancó, y todo se calcula al apretar E o al mostrar el aviso. Lo que sale es un bien que ya existe (panes, ponchos, piedra) o
//     pesos del comprador de siempre (Lucrecia por los barriles, Ercilia por el queso);
//   · la herrería propia: afilar el hacha y el pico sin ir a la aldea y TEMPLARlos (una vez): con filo, un golpe menos todavía;
//   · la carpintería: al terminar una obra sobra más madera (se suma al oficio de constructor);
//   · la tienda de campo: vende por vos hasta cuatro lotes por día (comisión chica), y el queso se paga más.
// El oficio del jugador mejora el rendimiento donde tiene sentido (`bono`). Sólo en el Relax: las piezas son `soloRelax` y los pesos
// pasan por economia.js.
import { BIENES } from './comercio.js';
import { precioDeConsigna } from './propiedad.js';
import { tengoBien, quitarBien } from './cantina.js';
import { cobrar, formatoPesos } from './economia.js';

const entero = (v, max = 1e7) => Math.max(0, Math.min(max, Math.floor(Number(v)) || 0));
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

// ---------------------------------------------------------------- los talleres que producen
// entrada/salida: { k, n, donde: 'material' | 'cosa' | 'entrada', una, varias } · pesos: { pesos, con, una, varias } (por cada `n`)
// bono: lo que suma el oficio, por tanda (el más alto que se alcance)
export const TALLERES = {
  'panaderia-horno': {
    nombre: 'Panadería de horno grande', corto: 'el horno grande', tope: 3, horas: 24,
    entrada: [{ k: 'harina', n: 4, donde: 'cosa', una: 'medida de harina', varias: 'medidas de harina' }, { k: 'tronco', n: 1, donde: 'material', una: 'tronco', varias: 'troncos' }],
    salida: { k: 'pan-casero', n: 8, donde: 'entrada', una: 'pan casero', varias: 'panes caseros' },
    bono: [{ oficio: 'huertero', nivel: 3, mas: 1, dice: 'con mano de huertero sale un pan más por tanda' }],
    carga: 'Amasar y encender el horno grande', cargo: 'Amasaste y encendiste el horno grande', retira: 'Sacaste del horno',
    vacio: 'El horno grande está frío', info: 'Una tanda por día: 8 panes caseros con 4 medidas de harina y un tronco (a mano, 3 con 2 medidas).',
  },
  'telar-grande': {
    nombre: 'Telar grande', corto: 'el telar grande', tope: 3, horas: 24,
    entrada: [{ k: 'lana', n: 5, donde: 'material', una: 'vellón de lana', varias: 'vellones de lana' }],
    salida: { k: 'poncho', n: 2, donde: 'cosa', una: 'poncho', varias: 'ponchos' },
    bono: [],
    carga: 'Urdir el telar grande', cargo: 'Urdiste el telar grande', retira: 'Bajaste del telar',
    vacio: 'El telar grande está sin urdir', info: 'Una tanda por día: 2 ponchos con 5 vellones (a mano, 3 vellones por poncho).',
  },
  cerveceria: {
    nombre: 'Cervecería artesanal', corto: 'la cervecería', tope: 3, horas: 24,
    entrada: [{ k: 'harina', n: 3, donde: 'cosa', una: 'medida de harina', varias: 'medidas de harina' }, { k: 'tronco', n: 1, donde: 'material', una: 'tronco', varias: 'troncos' }],
    salida: { pesos: 1300, n: 1, con: 'Lucrecia, de la cantina', una: 'barril de cerveza', varias: 'barriles de cerveza' },
    bono: [{ oficio: 'huertero', nivel: 3, mas: 200, dice: 'con cebada de huertero cada barril sale $200 mejor' }],
    carga: 'Macerar y encender la olla', cargo: 'Pusiste a macerar la tanda', retira: 'Despachaste a la cantina',
    vacio: 'La olla está fría', info: 'Un barril por día, con 3 medidas de harina y un tronco. Lucrecia lo paga contado y a vos la cerveza te sale más barata en la cantina.',
  },
  queseria: {
    nombre: 'Quesería', corto: 'la quesería', tope: 3, horas: 24,
    entrada: [{ k: 'leche', n: 8, donde: 'entrada', una: 'litro de leche', varias: 'litros de leche' }],
    salida: { pesos: 1100, n: 2, con: 'Ercilia, del almacén', una: 'queso', varias: 'quesos', tienda: 1.25 },
    bono: [],
    carga: 'Cuajar la leche', cargo: 'Pusiste la leche a cuajar', retira: 'Sacaste de la prensa',
    vacio: 'La tina está vacía', info: 'Una tanda por día: 8 litros de leche de tu vaca son 2 quesos. Ercilia los compra; con una tienda de campo los vendés vos y se pagan un cuarto más.',
  },
  canteria: {
    nombre: 'Cantería', corto: 'la cantería', tope: 4, horas: 24,
    entrada: [],
    salida: { k: 'piedra', n: 3, donde: 'material', una: 'piedra', varias: 'piedras' },
    bono: [{ oficio: 'picapedrero', nivel: 3, mas: 1, dice: 'con oficio de picapedrero sale una piedra más' }, { oficio: 'picapedrero', nivel: 5, mas: 2, dice: 'de maestro picapedrero, dos más' }],
    carga: 'Poner a trabajar la cantería', cargo: 'Pusiste a trabajar la cantería', retira: 'Juntaste de la cantería',
    vacio: 'La cantería está parada', info: 'Tres piedras por día, sin gastar nada: la cuadrilla de canteros pica y acarrea mientras no estás.',
  },
};
export const IDS_TALLERES = Object.keys(TALLERES);

const lista = (partes) => (partes.length <= 1 ? partes.join('') : `${partes.slice(0, -1).join(', ')} y ${partes.at(-1)}`);
export const textoUnidades = (e, n) => `${n} ${n === 1 ? e.una : e.varias}`;
export const textoEntrada = (def) => (def.entrada.length ? lista(def.entrada.map((e) => textoUnidades(e, e.n))) : 'nada');

// El estado de un taller (vive en la obra: `obra.datos.taller`): cuántas tandas hay cargadas y desde cuándo (hora absoluta del juego)
export function sanearTaller(v, tope = 12) {
  const x = objeto(v) ? v : {};
  const n = entero(x.n, Math.max(1, tope));
  const desde = Number.isFinite(Number(x.desde)) ? Math.max(0, Number(x.desde)) : 0;
  return { n, desde };
}
// Cuántas tandas ya están listas
export function listos(t, def, ahora) {
  if (!t || t.n <= 0) return 0;
  return Math.max(0, Math.min(t.n, Math.floor((Number(ahora) - t.desde) / def.horas + 1e-9)));
}
// El oficio mejora el rendimiento: lo más alto que se alcance
export function bonoDe(def, nivelDe) {
  let mas = 0, dice = '';
  for (const b of def.bono || []) if ((Number(nivelDe?.(b.oficio)) || 0) >= b.nivel && b.mas > mas) { mas = b.mas; dice = b.dice; }
  return { mas, dice };
}
// Lo que da una tanda hoy: { unidades | pesos, ... } (con el oficio y, en la quesería, la tienda de campo)
export function porTanda(def, env = {}) {
  const s = def.salida, b = bonoDe(def, env.nivel);
  if (s.pesos) {
    const mult = s.tienda && env.tienda ? s.tienda : 1;
    return { pesos: Math.round(((s.pesos + b.mas) * mult) / 50) * 50, n: s.n, una: s.una, varias: s.varias, con: s.con, bono: b.mas > 0, conTienda: mult > 1 };
  }
  return { k: s.k, donde: s.donde, n: s.n + b.mas, una: s.una, varias: s.varias, bono: b.mas > 0 };
}
const textoTanda = (p, lotes) => (p.pesos ? `${p.n * lotes} ${p.n * lotes === 1 ? p.una : p.varias} (${formatoPesos(p.pesos * lotes)})` : textoUnidades(p, p.n * lotes));
// Lo que falta para cargar una tanda: ['2 medidas de harina', …] (vacío si alcanza)
export function faltaParaCargar(def, env) {
  const falta = [];
  for (const e of def.entrada) { const hay = entero(env.tengo(e)); if (hay < e.n) falta.push(textoUnidades(e, e.n - hay)); }
  return falta;
}
const puedeCargar = (def, env) => faltaParaCargar(def, env).length === 0;

// E en el taller: retira lo que está listo y vuelve a cargar con lo que haya (hasta el tope). Devuelve { retiro, cargo, falta, lotes }.
// `env`: { tengo(e), quitar(e, n), nivel(oficio), tienda }. El que llama le da al jugador lo retirado y paga los pesos (`entregar`).
export function usarTaller(t, def, ahora, env) {
  const r = { retiro: null, cargo: 0, falta: [], lotes: 0 };
  const hechos = listos(t, def, ahora);
  if (hechos > 0) {
    const p = porTanda(def, env);
    r.lotes = hechos;
    r.retiro = p.pesos ? { pesos: p.pesos * hechos, con: p.con, n: p.n * hechos, una: p.una, varias: p.varias, bono: p.bono, conTienda: p.conTienda } : { k: p.k, donde: p.donde, n: p.n * hechos, una: p.una, varias: p.varias, bono: p.bono };
    t.n -= hechos; t.desde += hechos * def.horas;
  }
  if (t.n <= 0) { t.n = 0; t.desde = Number(ahora); }
  while (t.n < def.tope) {
    if (!puedeCargar(def, env)) { r.falta = faltaParaCargar(def, env); break; }
    for (const e of def.entrada) env.quitar(e, e.n);
    t.n++; r.cargo++;
  }
  return r;
}
// Lo que dice el aviso al acercarse (se llama seguido: sin trabajo de más)
export function avisoTaller(t, def, ahora, env) {
  const hechos = listos(t, def, ahora);
  if (hechos > 0) {
    const p = porTanda(def, env);
    return `Retirar ${textoTanda(p, hechos)}${t.n - hechos < def.tope && puedeCargar(def, env) ? ' y volver a cargar' : ''}`;
  }
  if (t.n < def.tope && puedeCargar(def, env)) return t.n > 0 ? `${def.carga} (otra tanda)` : def.carga;
  if (t.n > 0) {
    const falta = Math.max(1, Math.ceil(def.horas - (Number(ahora) - t.desde)));
    return `${def.nombre}: ${t.n} ${t.n === 1 ? 'tanda' : 'tandas'} en marcha, ${falta === 1 ? 'falta una hora' : `faltan unas ${falta} horas`}`;
  }
  return `${def.nombre}: faltan ${lista(faltaParaCargar(def, env))}`;
}
// El aviso de después de apretar E: { titulo, detalle, bien }
export function mensajeTaller(r, def, t) {
  const partes = [];
  if (r.retiro) partes.push(r.retiro.pesos ? `${def.retira}: ${textoUnidades(r.retiro, r.retiro.n)}, ${formatoPesos(r.retiro.pesos)} de ${r.retiro.con}` : `${def.retira}: ${textoUnidades(r.retiro, r.retiro.n)}`);
  if (r.cargo > 0) partes.push(`${def.cargo}${r.cargo > 1 ? ` (${r.cargo} tandas)` : ''}`);
  if (!partes.length) {
    if (t.n > 0) return { titulo: def.nombre, detalle: `${t.n} ${t.n === 1 ? 'tanda' : 'tandas'} en marcha. ${def.info}` };
    return { titulo: def.vacio, detalle: r.falta.length ? `Faltan ${lista(r.falta)}. ${def.info}` : def.info };
  }
  const extra = r.retiro?.bono ? ' (el oficio se nota)' : '';
  const sigue = r.falta.length ? `. Para otra tanda faltan ${lista(r.falta)}` : '';
  return { titulo: r.retiro ? `${textoUnidades(r.retiro, r.retiro.n)}${extra}` : def.cargo, detalle: partes.join('. ') + sigue };
}

// ---------------------------------------------------------------- la herrería propia
export const FILO_TOPE = 10;                    // los usos que da una afilada (los mismos que el herrero de la aldea: SERVICIO.filo)
export const TEMPLE = { piedra: 6, tronco: 2, pesos: 2500, golpesMenos: 2 };
export const GOLPES_MENOS_FILO = 1;
// Con el filo afilado: un golpe menos (nunca menos de uno); templado, dos menos
export const golpesConFiloTemplado = (golpes, afilado, templado) => (entero(afilado) > 0 ? Math.max(1, golpes - (templado ? TEMPLE.golpesMenos : GOLPES_MENOS_FILO)) : golpes);
export function sanearHerreria(v) { const x = objeto(v) ? v : {}; return { templado: x.templado === true }; }
export function avisoHerreria(h, aldea, env) {
  if (entero(aldea?.afilado) < FILO_TOPE) return 'Afilar el hacha y el pico en tu forja';
  if (!h.templado) return env.puedeTemplar() ? 'Templar el hacha y el pico (una sola vez)' : 'Tu forja: templar pide piedra, troncos y plata';
  return 'Tu forja: el filo está al día';
}
// E en la forja: afila (gratis, cuando quieras); con el filo al día, templa (una vez, si tenés lo que pide)
export function usarHerreria(h, aldea, env) {
  if (!aldea) return { accion: 'sin-aldea' };
  if (entero(aldea.afilado) < FILO_TOPE) { aldea.afilado = FILO_TOPE; return { accion: 'afilar', usos: FILO_TOPE }; }
  if (h.templado) return { accion: 'al-dia' };
  const falta = [];
  if (env.tengoMaterial('piedra') < TEMPLE.piedra) falta.push(`${TEMPLE.piedra - env.tengoMaterial('piedra')} ${TEMPLE.piedra - env.tengoMaterial('piedra') === 1 ? 'piedra' : 'piedras'}`);
  if (env.tengoMaterial('tronco') < TEMPLE.tronco) falta.push(`${TEMPLE.tronco - env.tengoMaterial('tronco')} ${TEMPLE.tronco - env.tengoMaterial('tronco') === 1 ? 'tronco' : 'troncos'}`);
  if (env.pesos() < TEMPLE.pesos) falta.push(formatoPesos(TEMPLE.pesos - env.pesos()));
  if (falta.length) return { accion: 'falta', falta };
  env.pagarTemple();
  h.templado = true;
  return { accion: 'templar' };
}

// ---------------------------------------------------------------- la carpintería
export const CARPINTERIA = { extra: 0.10, extraMaestro: 0.15, nivelMaestro: 3 };   // lo que sobra de la madera, además del oficio de constructor
export const extraMadera = (nivelHachero) => (entero(nivelHachero) >= CARPINTERIA.nivelMaestro ? CARPINTERIA.extraMaestro : CARPINTERIA.extra);
export const textoCarpinteria = (nivelHachero) => `Al terminar una etapa, sobra un ${Math.round(extraMadera(nivelHachero) * 100)} % más de tablas y troncos (se suma al oficio de constructor${entero(nivelHachero) >= CARPINTERIA.nivelMaestro ? '' : '; con oficio de hachero, 15 %'}).`;

// ---------------------------------------------------------------- la tienda de campo
export const TIENDA = {
  lotesPorDia: 4, comision: 0.04, stockMax: 12, tipos: 8, diasMax: 12, cajaMax: 400000,
  mercaderia: ['poncho', 'empanadas', 'pan-casero', 'frasco-frutilla', 'miel', 'trucha-ahumada', 'hongos-secos', 'calafate-seco'],
};
// Lo que paga la tienda por un lote: el precio de la plaza menos la comisión chica (la del puesto de la feria es de 10 %)
export const precioEnTienda = (bien) => (BIENES[bien] ? Math.round(((precioDeConsigna(bien) / 0.9) * (1 - TIENDA.comision)) / 10) * 10 : 0);
export function sanearTienda(v, hoy = 1e6) {
  const x = objeto(v) ? v : {};
  const stock = {};
  if (objeto(x.stock)) for (const k of TIENDA.mercaderia) { const n = entero(x.stock[k], TIENDA.stockMax); if (n > 0 && Object.keys(stock).length < TIENDA.tipos) stock[k] = n; }
  const dia = Math.max(1, entero(hoy, 1e6)), d = entero(x.dia, 1e6);
  return { stock, caja: entero(x.caja, TIENDA.cajaMax), dia: d >= 1 ? Math.min(dia, d) : dia };
}
export const lotesEnTienda = (t) => Object.values(t?.stock || {}).reduce((s, n) => s + n, 0);
// Lo que vendió la tienda desde la última vez (hasta cuatro lotes por día, lo más caro primero, hasta un año del juego): vuelve cuántos lotes
export function venderDias(t, hoy) {
  const dia = Math.max(1, entero(hoy, 1e6));
  if (!t.dia || t.dia > dia) t.dia = dia;
  const dias = Math.min(TIENDA.diasMax, dia - t.dia);
  let cupo = dias * TIENDA.lotesPorDia, vendidos = 0;
  while (cupo-- > 0) {
    const hay = Object.keys(t.stock).filter((b) => t.stock[b] > 0).sort((a, b) => BIENES[b].valor - BIENES[a].valor || (a < b ? -1 : 1));
    if (!hay.length) break;
    const b = hay[0];
    t.caja = Math.min(TIENDA.cajaMax, t.caja + precioEnTienda(b));
    t.stock[b]--;
    if (t.stock[b] <= 0) delete t.stock[b];
    vendidos++;
  }
  t.dia = dia;
  return vendidos;
}
// Dejar en la tienda todo lo que tengas para vender (por lotes enteros, hasta el tope por cosa): vuelve [{ k, lotes }]
export function dejarEnTienda(p, t) {
  const dejado = [];
  for (const k of TIENDA.mercaderia) {
    const b = BIENES[k];
    if (!b) continue;
    const ya = t.stock[k] || 0;
    if (!ya && Object.keys(t.stock).length >= TIENDA.tipos) continue;
    const lotes = Math.min(Math.floor(tengoBien(p, k) / b.lote), TIENDA.stockMax - ya);
    if (lotes < 1 || !quitarBien(p, k, lotes * b.lote)) continue;
    t.stock[k] = ya + lotes;
    dejado.push({ k, lotes });
  }
  return dejado;
}
export function retirarCajaTienda(p, t) {
  if (t.caja <= 0) return 0;
  const r = cobrar(p, t.caja, 'Ventas de tu tienda de campo', 'Tu tienda');
  if (r.ok) t.caja -= r.monto;
  return r.monto || 0;
}
export const aTexto = (k, lotes) => `${lotes * (BIENES[k]?.lote || 1)} ${(BIENES[k]?.nombre || k).toLowerCase()}`;
export function avisoTienda(t, p) {
  if (t.caja > 0) return `Tu tienda: retirar ${formatoPesos(t.caja)} de la caja${TIENDA.mercaderia.some((k) => tengoBien(p, k) >= (BIENES[k]?.lote || 1)) ? ' y dejar mercadería' : ''}`;
  if (TIENDA.mercaderia.some((k) => tengoBien(p, k) >= (BIENES[k]?.lote || 1))) return 'Tu tienda: dejar la mercadería a la venta';
  const hay = lotesEnTienda(t);
  return hay ? `Tu tienda: ${hay} ${hay === 1 ? 'lote a la venta' : 'lotes a la venta'}` : 'Tu tienda de campo: sin mercadería';
}

// ---------------------------------------------------------------- las obras
export const IDS_OFICIOS_PROPIOS = ['herreria-propia', 'carpinteria', 'panaderia-horno', 'cerveceria', 'telar-grande', 'queseria', 'tienda-campo', 'canteria'];
// El aviso que se ve apenas se acerca (antes de calcular nada): lo usa la prueba para saber que todos tienen texto
export const AVISO_GENERICO = {
  'herreria-propia': 'Tu forja', carpinteria: 'Tu banco de carpintero', 'panaderia-horno': 'El horno grande', 'cerveceria': 'La cervecería', 'telar-grande': 'El telar grande',
  queseria: 'La quesería', 'tienda-campo': 'Tu tienda de campo', canteria: 'La cantería',
};

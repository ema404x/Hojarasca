// 3.1: fundar un pueblo. Cuando tenés una casa terminada y vacía (un puesto, una casilla
// o una casa de módulos, con puerta y cama) y el valle está cuidado, alguien baja de la
// trochita en la estación y te pregunta si se puede quedar. Si le decís que sí, se muda a
// esa casa, vive ahí con su rutina de todos los días y te ofrece lo suyo: el carpintero
// aserra, la panadera hornea, el herrero forja y afila, el pescador cambia pescado y la
// maestra lee tu cuaderno y te da mandados. El pueblo lleva el nombre que le pongas, en
// un cartel.
//
// Lo que NO hay (el usuario lo pidió así): los pobladores no consumen, no pasan hambre
// y no se van. El pueblo sólo crece. Y no es un modo aparte: es parte del Relax.
//
// Para la historia (otra parte de la 3.1): `puedeLlegarPoblador(progreso)` dice si hoy
// podría llegar alguien, `llamarPoblador(pueblo)` hace que el próximo venga sin esperar
// y `escucharPueblo(fn)` avisa cuando alguien llega, se queda o el pueblo recibe nombre.
//
// Módulo puro (se prueba en Node): sin three ni DOM.
import { ENTRADAS } from './cuaderno.js';
import { vecinosActivos } from './personal-partida.js';

// Cuándo puede llegar alguien: días entre uno y otro y cuánto tiene que estar anotado
// el valle (cada poblador pide un poco más).
export const LLEGADA = { entreDias: 2, anotaciones: 12, porPoblador: 6 };
// Lo que ofrece cada uno, por día.
export const SERVICIO = { troncosPorDia: 6, tablasPorTronco: 5, yerbaPorPan: 2, panes: 3, troncosPorTruchas: 2, truchas: 2, filo: 10, yerbaMandado: 4, cantosHacha: 3, cantosTijera: 2 };

export const POBLADORES = {
  carpintero: {
    nombre: 'Tito Arrieta', oficio: 'carpintero', mano: null,
    colores: { ropa: '#8a6d4b', abrigo: '#5d4630', gorro: 'boina', pelo: '#4a3a2c', barba: '#6b5a48' },
    llegada: [
      'Buenas. Me llamo Tito Arrieta, soy carpintero. Vengo del valle de abajo, donde ya no queda madera que trabajar.',
      'En el tren me dijeron que acá arriba alguien anda levantando casas. Donde se construye, un carpintero siempre sirve.',
    ],
    saludo: 'Buenas, vecino. La sierra ya está afilada.', despedida: 'Cuando juntes troncos, ya sabés dónde estoy.',
    resumen: 'Te aserra troncos: cinco tablas por tronco, hasta seis troncos por día.',
  },
  panadera: {
    nombre: 'Rosa Quilodrán', oficio: 'panadera', mano: 'mate',
    colores: { ropa: '#b08a6a', abrigo: '#7a4f3e', gorro: 'gorro', pelo: '#2e2622', bufanda: '#d8cdb8' },
    llegada: [
      'Hola. Soy Rosa Quilodrán, panadera. Me vine con la masa madre en un frasco, envuelta en una toalla para que no se enfríe.',
      'Un pueblo sin pan no es pueblo. Si me dejás quedarme, el horno va a estar prendido todas las mañanas.',
    ],
    saludo: 'Pasá, que recién sale la tanda.', despedida: 'Y no te comas todo en el camino, eh.',
    resumen: 'Te cambia pan casero por yerba: tres panes por dos de yerba, una vez por día.',
  },
  herrero: {
    nombre: 'Anselmo Ruiz', oficio: 'herrero', mano: null,
    colores: { ropa: '#5a5048', abrigo: '#3a322c', gorro: 'gorro', pelo: '#2a2420', barba: '#3a322c' },
    llegada: [
      'Anselmo Ruiz, herrero. Traigo el yunque en el furgón, que pesa más que yo.',
      'Donde hay hachas hay filo que se gasta. Si me das un techo, le doy fragua a este lugar.',
    ],
    saludo: 'El fuego de la fragua ya está vivo.', despedida: 'Cuidá el filo, que no es eterno.',
    resumen: 'Forja lo que te falte (el hacha, la tijera) con cantos rodados y te afila el hacha: diez árboles con un hachazo menos, una vez por día.',
  },
  pescador: {
    nombre: 'Aurelio Nahuel', oficio: 'pescador de red', mano: 'cana',
    colores: { ropa: '#56707e', abrigo: '#34505e', gorro: 'sombrero', pelo: '#2e2622', barba: '#7a746a' },
    llegada: [
      'Aurelio Nahuel. Pesco con red y con caña, lo que el lago quiera dar.',
      'Nicanor me escribió que acá el agua es generosa. Si hay una casa para mí, me quedo a probar.',
    ],
    saludo: 'El lago estuvo bueno hoy.', despedida: 'Que pique, vecino.',
    resumen: 'Te cambia dos truchas frescas por dos troncos de leña, una vez por día.',
  },
  maestra: {
    nombre: 'Delia Ferreyra', oficio: 'maestra', mano: 'planilla',
    colores: { ropa: '#7c6a8a', abrigo: '#4e4260', gorro: null, pelo: '#5a4232', bufanda: '#c9b89a' },
    llegada: [
      'Buen día. Soy Delia Ferreyra, maestra rural. Me mandaron a abrir una escuela donde hubiera chicos, o donde fuera a haberlos.',
      'Un pueblo que empieza necesita alguien que anote lo que pasa. ¿Me dejás una casa?',
    ],
    saludo: 'Buen día. ¿Trajiste el cuaderno?', despedida: 'Seguí anotando, que de eso se aprende.',
    resumen: 'Lee tu cuaderno, te dice qué te falta anotar y te da mandados: cuatro de yerba por cada uno cumplido.',
  },
};
export const ORDEN_POBLADORES = ['carpintero', 'panadera', 'herrero', 'pescador', 'maestra'];
export const esPoblador = (clave) => typeof clave === 'string' && Object.hasOwn(POBLADORES, clave);

// ---------------------------------------------------------------- estado y saneo
export function puebloNuevo() {
  return { nombre: '', cartel: null, pobladores: [], llegando: null, ultimaLlegada: 0, llamado: false, usos: {}, afilado: 0, mandado: null, mandados: 0 };
}
const entero = (v, d = 0) => (Number.isFinite(Number(v)) ? Math.floor(Number(v)) : d);
const numero = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
export function limpiarNombre(texto) {
  if (typeof texto !== 'string') return '';
  // sin caracteres de control ni espacios de más; un nombre, no un párrafo
  return texto.replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 28);
}
function sanearCasa(c) {
  if (!c || typeof c !== 'object') return null;
  const x = numero(c.x), z = numero(c.z);
  if (x === null || z === null || typeof c.id !== 'string' || !c.id) return null;
  return { id: c.id.slice(0, 80), plano: typeof c.plano === 'string' ? c.plano.slice(0, 40) : '', nombre: limpiarNombre(c.nombre) || 'tu casa', x, z, rot: numero(c.rot) ?? 0 };
}
export function sanearPueblo(v) {
  const x = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  const base = puebloNuevo();
  const vistos = new Set();
  const pobladores = [];
  for (const p of Array.isArray(x.pobladores) ? x.pobladores : []) {
    if (!p || !esPoblador(p.clave) || vistos.has(p.clave)) continue;
    const casa = sanearCasa(p.casa);
    if (!casa) continue;
    vistos.add(p.clave);
    pobladores.push({ clave: p.clave, casa, dia: Math.max(1, entero(p.dia, 1)) });
  }
  const llegando = x.llegando && esPoblador(x.llegando.clave) && !vistos.has(x.llegando.clave)
    ? { clave: x.llegando.clave, dia: Math.max(1, entero(x.llegando.dia, 1)) } : null;
  const usos = {};
  for (const k of ORDEN_POBLADORES) if (x.usos && Object.hasOwn(x.usos, k) && entero(x.usos[k]) > 0) usos[k] = entero(x.usos[k]);
  const cx = numero(x.cartel?.x), cz = numero(x.cartel?.z);
  const nombre = limpiarNombre(x.nombre);
  const idsEntradas = new Set(ENTRADAS.map((e) => e.id));
  const mandado = x.mandado && typeof x.mandado.id === 'string' && idsEntradas.has(x.mandado.id) ? { id: x.mandado.id, dia: Math.max(1, entero(x.mandado.dia, 1)) } : null;
  return {
    ...base,
    nombre,
    cartel: nombre && cx !== null && cz !== null ? { x: cx, z: cz, rot: numero(x.cartel.rot) ?? 0 } : null,
    pobladores, llegando,
    ultimaLlegada: Math.max(0, entero(x.ultimaLlegada)),
    llamado: x.llamado === true,
    usos,
    afilado: Math.max(0, Math.min(SERVICIO.filo, entero(x.afilado))),
    mandado,
    mandados: Math.max(0, entero(x.mandados)),
  };
}

// ---------------------------------------------------------------- avisos para otros módulos
const oyentes = new Set();
export function escucharPueblo(fn) {
  if (typeof fn !== 'function') return () => {};
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}
function avisar(tipo, datos) {
  for (const fn of [...oyentes]) { try { fn({ tipo, ...datos }); } catch { /* un oyente roto no frena al pueblo */ } }
}

// ---------------------------------------------------------------- casas
export const claveCasa = (plano, x, z) => `${plano}@${(Math.round(Number(x) * 10) / 10).toFixed(1)},${(Math.round(Number(z) * 10) / 10).toFixed(1)}`;
// Ocupada si es la misma casa o si alguien ya vive ahí (una casa movida un poco, o una de
// módulos a la que se le sumó una cama, cambia de clave pero sigue siendo la misma).
export const CERCA_CASA = 5;
export const casaOcupada = (pueblo, id, x = NaN, z = NaN) => (pueblo?.pobladores || []).some((p) => p.casa?.id === id || Math.hypot(p.casa.x - x, p.casa.z - z) < CERCA_CASA);
// Las casas aptas que no son de nadie. `casas`: [{ id, … }] (las arma pueblo-mundo.js).
export function casasLibres(casas, pueblo) {
  return (casas || []).filter((c) => c && c.id && !casaOcupada(pueblo, c.id, c.x, c.z));
}

// ---------------------------------------------------------------- la llegada
export function quienLlega(pueblo) {
  const p = pueblo || puebloNuevo();
  const ya = new Set((p.pobladores || []).map((x) => x.clave));
  return ORDEN_POBLADORES.find((k) => !ya.has(k)) || null;
}
export const anotacionesDe = (progreso) => Object.keys(progreso?.entradas || {}).length;
export const anotacionesPedidas = (pueblo) => LLEGADA.anotaciones + LLEGADA.porPoblador * (pueblo?.pobladores?.length || 0);

// ¿Puede llegar alguien hoy? `casasLibres`: cuántas casas aptas y vacías hay (el mundo
// lo sabe; sin decirlo, se da por hecho que hay una). Devuelve { ok, motivo, quien }.
export function puedeLlegarPoblador(progreso, libres = 1) {
  if (!progreso || typeof progreso !== 'object') return { ok: false, motivo: 'Sin partida', quien: null };
  if (progreso.modo === 'desafio') return { ok: false, motivo: 'En el Desafío no llega nadie a quedarse', quien: null };
  if (!vecinosActivos(progreso)) return { ok: false, motivo: 'En esta partida no hay vecinos', quien: null };
  const pueblo = progreso.pueblo || puebloNuevo();
  const quien = quienLlega(pueblo);
  if (!quien) return { ok: false, motivo: 'Ya vinieron todos los que tenían que venir', quien: null };
  if (pueblo.llegando) return { ok: false, motivo: 'Hay alguien esperando en la estación', quien: pueblo.llegando.clave };
  if (!(Number(libres) >= 1)) return { ok: false, motivo: 'Hace falta una casa terminada, con puerta y cama, que no sea de nadie', quien };
  const dia = Math.max(1, entero(progreso.dia, 1));
  if (!pueblo.llamado && pueblo.ultimaLlegada && dia - pueblo.ultimaLlegada < LLEGADA.entreDias) return { ok: false, motivo: 'El próximo tren con gente viene en unos días', quien };
  const faltan = anotacionesPedidas(pueblo) - anotacionesDe(progreso);
  if (!pueblo.llamado && faltan > 0) return { ok: false, motivo: `El valle todavía se conoce poco: faltan ${faltan} anotaciones en el cuaderno`, quien, faltan };
  return { ok: true, motivo: '', quien };
}
// La historia (u otro evento) puede llamar al próximo: viene sin esperar días ni anotaciones.
export function llamarPoblador(pueblo) {
  if (!pueblo || typeof pueblo !== 'object') return false;
  pueblo.llamado = true;
  avisar('llamado', {});
  return true;
}
export function empezarLlegada(pueblo, clave, dia) {
  if (!pueblo || !esPoblador(clave) || pueblo.llegando) return null;
  pueblo.llegando = { clave, dia: Math.max(1, entero(dia, 1)) };
  avisar('llego', { clave });
  return pueblo.llegando;
}
// Aceptar al que llegó y darle la casa. Devuelve el poblador o null.
export function aceptarPoblador(pueblo, casa, dia) {
  if (!pueblo?.llegando) return null;
  const c = sanearCasa(casa);
  if (!c || casaOcupada(pueblo, c.id, c.x, c.z)) return null;
  const nuevo = { clave: pueblo.llegando.clave, casa: c, dia: Math.max(1, entero(dia, 1)) };
  pueblo.pobladores.push(nuevo);
  pueblo.llegando = null;
  pueblo.ultimaLlegada = nuevo.dia;
  pueblo.llamado = false;
  avisar('asentado', { clave: nuevo.clave, casa: c.id });
  return nuevo;
}
export function nombrarPueblo(pueblo, texto, cartel = null) {
  const nombre = limpiarNombre(texto);
  if (!pueblo || !nombre || !(pueblo.pobladores || []).length) return false;
  pueblo.nombre = nombre;
  if (cartel && Number.isFinite(cartel.x) && Number.isFinite(cartel.z)) pueblo.cartel = { x: cartel.x, z: cartel.z, rot: Number(cartel.rot) || 0 };
  avisar('nombre', { nombre });
  return true;
}
// Dónde va el cartel: a la entrada del pueblo, del lado de la estación.
export function lugarDelCartel(casas, estacion = null) {
  const lista = (casas || []).filter((c) => Number.isFinite(c?.x) && Number.isFinite(c?.z));
  if (!lista.length) return null;
  const cx = lista.reduce((s, c) => s + c.x, 0) / lista.length, cz = lista.reduce((s, c) => s + c.z, 0) / lista.length;
  let dx = 1, dz = 0;
  if (estacion && Number.isFinite(estacion.x) && Number.isFinite(estacion.z)) {
    const d = Math.hypot(estacion.x - cx, estacion.z - cz);
    if (d > 0.5) { dx = (estacion.x - cx) / d; dz = (estacion.z - cz) / d; }
  }
  const lejos = 9;
  // mira hacia el que llega desde la estación
  return { x: cx + dx * lejos, z: cz + dz * lejos, rot: Math.atan2(dx, dz) };
}

// ---------------------------------------------------------------- la rutina del día
// A la noche adentro; a la mañana y a la tarde, trabajando al lado de la casa; al
// mediodía, un rato en la plaza (junto al cartel); al caer la tarde, en la puerta.
export function rutinaPoblador(horas) {
  const h = ((Number(horas) % 24) + 24) % 24;
  if (h < 7 || h >= 22) return 'adentro';
  if (h >= 12 && h < 14) return 'plaza';
  if (h >= 19) return 'puerta';
  return 'trabajo';
}

// ---------------------------------------------------------------- lo que ofrece cada uno
// Devuelve lo que dice y, si hay trato, los efectos que tiene aceptarlo:
//   { partes: [...], seguir?: texto del último renglón, efectos?: [...] }
// Efectos: { tipo: 'material'|'cosa'|'entrada', k, n } (se suma n), { tipo: 'cosa', k, fijar }
// y { tipo: 'pueblo', campo, valor }. main.js/pueblo-mundo.js los aplican.
const cant = (progreso, tipo, k) => {
  if (tipo === 'material') return entero(progreso?.materiales?.[k]);
  if (tipo === 'cosa') return entero(progreso?.cosas?.[k]);
  return entero(progreso?.entradas?.[k]?.cantidad);
};
const yaHoy = (pueblo, clave, dia) => !!pueblo?.usos && Object.hasOwn(pueblo.usos, clave) && pueblo.usos[clave] === dia;
const DALE = 'E: dale · Escape: otro día';
// Las anotaciones que la maestra puede mandarte a buscar: lo que se ve y se encuentra.
const SECCIONES_MANDADO = ['flora', 'frutos', 'fauna', 'peces', 'lugares', 'cielo'];
export function pendientesDelCuaderno(entradas = {}) {
  return ENTRADAS.filter((e) => SECCIONES_MANDADO.includes(e.seccion) && !Object.hasOwn(entradas || {}, e.id));
}
export function servicioDe(clave, progreso, dia) {
  const pueblo = progreso?.pueblo || puebloNuevo();
  const S = SERVICIO;
  const uso = { tipo: 'pueblo', campo: 'uso', valor: clave };
  switch (clave) {
    case 'carpintero': {
      if (yaHoy(pueblo, clave, dia)) return { partes: ['Hoy ya aserré lo tuyo. La sierra también descansa: mañana traeme más.'] };
      const troncos = cant(progreso, 'material', 'tronco');
      if (!troncos) return { partes: [`Si me traés troncos, te los hago tablas: ${S.tablasPorTronco} por tronco. Hasta ${S.troncosPorDia} por día.`] };
      const n = Math.min(S.troncosPorDia, troncos);
      return {
        partes: [`Traés ${n === 1 ? 'un tronco' : `${n} troncos`}. Te los paso por la sierra: salen ${n * S.tablasPorTronco} tablas.`],
        seguir: DALE,
        efectos: [{ tipo: 'material', k: 'tronco', n: -n }, { tipo: 'material', k: 'tabla', n: n * S.tablasPorTronco }, uso],
        titulo: `${n * S.tablasPorTronco} tablas del carpintero`,
      };
    }
    case 'panadera': {
      if (yaHoy(pueblo, clave, dia)) return { partes: ['La tanda de hoy ya salió. Mañana temprano hay más.'] };
      if (cant(progreso, 'cosa', 'yerba') < S.yerbaPorPan) return { partes: [`Por ${S.yerbaPorPan} de yerba te doy ${S.panes} panes. Yerba hay en el almacén de Ercilia.`] };
      return {
        partes: [`Te cambio ${S.panes} panes caseros por ${S.yerbaPorPan} de yerba. Están calentitos.`],
        seguir: DALE,
        efectos: [{ tipo: 'cosa', k: 'yerba', n: -S.yerbaPorPan }, { tipo: 'entrada', k: 'pan-casero', n: S.panes }, uso],
        titulo: `${S.panes} panes de la panadería`,
      };
    }
    case 'herrero': {
      const cantos = cant(progreso, 'entrada', 'canto');
      if (!cant(progreso, 'cosa', 'hacha')) {
        if (cantos < S.cantosHacha) return { partes: [`¿Sin hacha? Traeme ${S.cantosHacha} cantos rodados del río y te forjo una.`] };
        return { partes: [`Con ${S.cantosHacha} cantos rodados te forjo un hacha. Cabo de lenga, filo de acero.`], seguir: DALE,
          efectos: [{ tipo: 'entrada', k: 'canto', n: -S.cantosHacha }, { tipo: 'cosa', k: 'hacha', fijar: 1 }], titulo: 'El herrero te forjó un hacha' };
      }
      if (!cant(progreso, 'cosa', 'tijera') && cantos >= S.cantosTijera) {
        return { partes: [`Te veo sin tijera de esquilar. Con ${S.cantosTijera} cantos rodados te la forjo.`], seguir: DALE,
          efectos: [{ tipo: 'entrada', k: 'canto', n: -S.cantosTijera }, { tipo: 'cosa', k: 'tijera', fijar: 1 }], titulo: 'El herrero te forjó una tijera' };
      }
      if (yaHoy(pueblo, clave, dia)) return { partes: ['El hacha ya te la afilé hoy. Mañana la vemos.'] };
      if (pueblo.afilado >= S.filo) return { partes: ['Tu hacha todavía tiene el filo que le di. Usala y volvé.'] };
      return {
        partes: [`Dame esa hacha, que le paso la piedra. Los próximos ${S.filo} árboles caen con un hachazo menos.`],
        seguir: DALE,
        efectos: [{ tipo: 'pueblo', campo: 'afilado', valor: S.filo }, uso],
        titulo: 'El herrero te afiló el hacha',
      };
    }
    case 'pescador': {
      if (yaHoy(pueblo, clave, dia)) return { partes: ['Lo de hoy ya lo cambiamos. Mañana hay más.'] };
      if (cant(progreso, 'material', 'tronco') < S.troncosPorTruchas) return { partes: [`Por ${S.troncosPorTruchas} troncos de leña te doy ${S.truchas} truchas frescas. Para ahumar, o para el fuego.`] };
      return {
        partes: [`Te cambio ${S.truchas} truchas frescas por ${S.troncosPorTruchas} troncos. Salieron esta mañana.`],
        seguir: DALE,
        efectos: [{ tipo: 'material', k: 'tronco', n: -S.troncosPorTruchas }, { tipo: 'entrada', k: 'trucha-fresca', n: S.truchas }, uso],
        titulo: `${S.truchas} truchas del pescador`,
      };
    }
    case 'maestra': {
      const entradas = progreso?.entradas || {};
      const m = pueblo.mandado;
      const E = m ? ENTRADAS.find((e) => e.id === m.id) : null;
      if (m && E && Object.hasOwn(entradas, m.id)) {
        return {
          partes: [`¡Anotaste ${E.nombre.toLowerCase()}! Así me gusta.`, `Tomá: ${S.yerbaMandado} de yerba, para el mate de la tarde.`],
          efectos: [{ tipo: 'cosa', k: 'yerba', n: S.yerbaMandado }, { tipo: 'pueblo', campo: 'mandado', valor: null }, { tipo: 'pueblo', campo: 'mandados', valor: 1 }],
          titulo: 'Mandado cumplido',
        };
      }
      if (m && E) return { partes: [`Todavía no anotaste ${E.nombre.toLowerCase()}.`, `Una pista: ${E.pista}`] };
      const pend = pendientesDelCuaderno(entradas);
      const total = Object.keys(entradas).length;
      if (!pend.length) return { partes: [`Llevás ${total} anotaciones. No te falta nada de lo que se ve en el valle: ya me enseñás vos a mí.`] };
      const e = pend[(pueblo.mandados * 7) % pend.length];
      return {
        partes: [
          `A ver ese cuaderno… Llevás ${total} ${total === 1 ? 'anotación' : 'anotaciones'}. Bien.`,
          `Te falta, por ejemplo, ${e.nombre.toLowerCase()}. ${e.pista}`,
          'Cuando lo anotes, pasá a contarme: tengo algo para vos.',
        ],
        efectos: [{ tipo: 'pueblo', campo: 'mandado', valor: { id: e.id, dia: Math.max(1, entero(dia, 1)) } }],
        titulo: `Mandado: ${e.nombre}`,
      };
    }
    default: return { partes: [] };
  }
}
// Aplica los efectos que tocan al pueblo (los demás los aplica quien tenga el mundo).
export function aplicarAlPueblo(pueblo, efectos, dia) {
  for (const f of efectos || []) {
    if (f.tipo !== 'pueblo') continue;
    if (f.campo === 'uso' && esPoblador(f.valor)) pueblo.usos = { ...(pueblo.usos || {}), [f.valor]: Math.max(1, entero(dia, 1)) };
    else if (f.campo === 'afilado') pueblo.afilado = Math.max(0, Math.min(SERVICIO.filo, entero(f.valor)));
    else if (f.campo === 'mandado') pueblo.mandado = f.valor && typeof f.valor.id === 'string' ? { id: f.valor.id, dia: f.valor.dia } : null;
    else if (f.campo === 'mandados') pueblo.mandados = Math.max(0, entero(pueblo.mandados)) + Math.max(0, entero(f.valor));
  }
}
// Para las pruebas y para lo que no pasa por el mundo: aplica todo sobre una partida.
export function aplicarEfectos(progreso, efectos, dia) {
  for (const f of efectos || []) {
    if (f.tipo === 'material') {
      progreso.materiales = progreso.materiales || {};
      progreso.materiales[f.k] = Math.max(0, entero(progreso.materiales[f.k]) + entero(f.n));
    } else if (f.tipo === 'cosa') {
      progreso.cosas = progreso.cosas || {};
      progreso.cosas[f.k] = f.fijar !== undefined ? f.fijar : Math.max(0, entero(progreso.cosas[f.k]) + entero(f.n));
    } else if (f.tipo === 'entrada') {
      progreso.entradas = progreso.entradas || {};
      const e = progreso.entradas[f.k] || (progreso.entradas[f.k] = { dia: Math.max(1, entero(dia, 1)), hora: 12, cantidad: 0 });
      e.cantidad = Math.max(0, entero(e.cantidad) + entero(f.n));
    }
  }
  progreso.pueblo = progreso.pueblo || puebloNuevo();
  aplicarAlPueblo(progreso.pueblo, efectos, dia);
}
// El filo del herrero: cuántos hachazos hacen falta con el hacha afilada.
export const golpesConFilo = (golpes, pueblo) => (entero(pueblo?.afilado) > 0 ? Math.max(1, golpes - 1) : golpes);
export function gastarFilo(pueblo) {
  if (!pueblo || entero(pueblo.afilado) <= 0) return false;
  pueblo.afilado = entero(pueblo.afilado) - 1;
  return true;
}

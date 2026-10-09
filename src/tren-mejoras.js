// 3.7.3 «La trochita» (PLAN_3_7.md): las mejoras del tren y el taller ferroviario de la aldea (sólo en el Relax).
// Módulo puro (se prueba en Node): sin three ni DOM. Lo visual del taller está en aldea-arquitectura.js
// (`armarTallerTren`) y aldea-mundo.js; el juego (la tecla E, el panel, el reloj) en taller-tren-juego.js; el tren
// mejorado lo dibuja el equipo del tren (trochita.js / tren.js), que lee `progreso.tren` con `aplicarMejoras`.
//
// El estado, `progreso.tren` (el contrato con el equipo del tren; `taller` es sólo del taller):
//   loco: { caldera: 0..3, freno: 0..3, farol, silbato: 'comun'|'grave'|'doble'|'pajaro', quitanieves, arenero,
//           pintura: { cuerpo, franja, ruedas } ('#rrggbb' de PALETA_TREN, o null: la de siempre / la de "Personalizar"),
//           nombre ('' = el de "Personalizar", o ninguno), banderines }
//   vagones: { pasajeros, comedor, carga, caballo, mirador, dormitorio }   (los que ya están hechos: al principio, ninguno)
//   composicion: [ids de vagones, en orden detrás del ténder]   (hasta VAGONES_MAX; vacía: los que tengas, o los dos
//                coches de segunda de siempre: así la lee `composicionDe` de tren-viaje.js, del equipo del tren)
//   taller: { arreglado, hechas: [ids de mejoras], pedido: null | { id, aportado: { tabla, tronco, piedra }, hierro,
//             desde, empezo, listo }, ultimo, avisar: [ids] }   (las horas, absolutas: día × 24 + hora)
//
// Cómo anda (decidido para la 3.7.3, como las obras del pueblo de aldea.js y sin economía nueva):
//   · el galpón está desde el principio, viejo y a medio usar (Martín vive en el cuarto del fondo y lo tiene
//     andando con lo que hay); con la primera mejora se arregla: esa pide además la chapa y el zócalo
//     (`ARREGLO_TALLER`) y, al terminarla, el galpón queda como nuevo (`arreglado`);
//   · se pide UNA mejora por vez (el foso es uno solo): `pedirMejora`. Vos llevás las tablas, los troncos y las
//     piedras (de a poco, como en las obras: `aportarMejora`); las piezas de hierro las forja Anselmo en la
//     herrería, dos por día (a las 9 y a las 15), sin que le lleves nada: es su servicio a la aldea. Mientras la
//     herrería no abrió, Martín las encarga a los talleres de El Maitén y llega una por día con el tren de las 11;
//   · cuando está todo (material y piezas), Ernesto y Martín la arman: queda lista a las 7 de la mañana, a los
//     `dias` días; las chicas (`dias` 0) se hacen en el día, en `horas` horas de taller (de 8 a 19);
//   · `avanzarTaller(tren, dia, hora)` lleva el reloj: anda igual de a un cuadro, durmiendo o pasando varios
//     días de una (repasa cada momento que pasó, en orden, sin saltearse ninguno);
//   · la pintura, el nombre, el silbato que suena y la composición del tren se cambian en el panel, sin
//     materiales (Martín pinta de noche; los vagones se enganchan en el desvío).
// Sin combustible: la locomotora anda sola, como siempre.

// ---------------------------------------------------------------- medidas
export const VAGONES_MAX = 4;          // detrás del ténder (con el ténder y la loco, unos 55 m: entran en los andenes)
export const HIERRO_POR_DIA = 2;       // lo que forja Anselmo
export const HORAS_FORJA = [9, 15];    // cuándo termina cada pieza en la herrería
export const HORA_TREN_PIEZAS = 11;    // sin herrería: la pieza que llega de El Maitén con el tren
export const HORA_LISTA = 7;           // las de varios días quedan listas a primera hora
export const HORARIO_TALLER = [8, 19]; // las de un rato se hacen en este horario
export const LARGO_NOMBRE = 18;   // (el que pinta tren.js)
const TOPE_DIA = 1e6;
const TOPE_PASOS = 400;                // momentos que repasa `avanzarTaller` de una vez (más de 100 días)

export const SILBATOS = {
  comun: { nombre: 'El de siempre', dice: 'agudo y corto, el de toda la vida' },
  grave: { nombre: 'Grave', dice: 'una nota baja que se oye del otro lado del lago' },
  doble: { nombre: 'De dos tonos', dice: 'dos notas, como los trenes del norte' },
  pajaro: { nombre: 'Pájaro', dice: 'un trino que imita al chucao' },
};
export const IDS_SILBATOS = Object.keys(SILBATOS);
export const VAGONES = {
  pasajeros: { nombre: 'Coche de pasajeros', corto: 'pasajeros', dice: 'con la salamandra: ahí viajan los vecinos, calentitos' },
  comedor: { nombre: 'Coche comedor', corto: 'comedor', dice: 'con la cocina a leña: cocinar y matear en viaje' },
  carga: { nombre: 'Furgón de carga', corto: 'carga', dice: 'más fletes para el puesto de cargas' },
  caballo: { nombre: 'Jaula para el caballo', corto: 'caballo', dice: 'el zaino viaja con vos' },
  mirador: { nombre: 'Coche mirador', corto: 'mirador', dice: 'abierto a los costados, para las fotos' },
  dormitorio: { nombre: 'Coche dormitorio', corto: 'dormitorio', dice: 'dos literas: hacer noche donde quieras' },
};
export const IDS_VAGONES = Object.keys(VAGONES);
// La paleta de la pintura: los colores de los trenes de verdad del sur (el negro humo y el rojo de la Trochita) y
// los del valle. Lo que se guarda es el id.
export const PALETA_TREN = {
  negro: { nombre: 'Negro humo', hex: '#2e3133' },
  rojo: { nombre: 'Rojo trochita', hex: '#9a3324' },
  bordo: { nombre: 'Bordó', hex: '#6e2219' },
  verde: { nombre: 'Verde ciprés', hex: '#3d5a42' },
  azul: { nombre: 'Azul lago', hex: '#2f4a66' },
  ocre: { nombre: 'Ocre', hex: '#b0803e' },
  crema: { nombre: 'Crema', hex: '#e4d3a6' },
  dorado: { nombre: 'Dorado', hex: '#c0913e' },
  gris: { nombre: 'Gris acero', hex: '#7a766e' },
  blanco: { nombre: 'Blanco', hex: '#dcd5c4' },
};
export const IDS_PALETA = Object.keys(PALETA_TREN);
export const PARTES_PINTURA = { cuerpo: 'La caldera y la cabina', franja: 'La franja y los filetes', ruedas: 'Las ruedas' };
// (null: la de siempre, la del tren de tren.js o la de "Personalizar")
export const PINTURA_INICIAL = { cuerpo: null, franja: null, ruedas: null };
export const NOMBRE_INICIAL = '';
export const NOMBRE_DE_SIEMPRE = 'La Hojarasca';
// un color de la paleta: su id o su '#rrggbb' → el '#rrggbb' (o null, la de siempre)
const HEX_PALETA = IDS_PALETA.map((k) => PALETA_TREN[k].hex);
export function colorTren(v) {
  if (typeof v !== 'string') return null;
  if (Object.hasOwn(PALETA_TREN, v)) return PALETA_TREN[v].hex;
  const h = v.toLowerCase();
  return HEX_PALETA.includes(h) ? h : null;
}
export const nombreColor = (v) => { const h = colorTren(v); return h ? PALETA_TREN[IDS_PALETA[HEX_PALETA.indexOf(h)]].nombre : 'La de siempre'; };

// Lo que pide arreglar el galpón (va con la primera mejora): chapas nuevas (tablas para los cabios y el
// entablonado) y piedra para el zócalo que se descalzó.
export const ARREGLO_TALLER = { tabla: 8, piedra: 6 };

// ---------------------------------------------------------------- las mejoras
// Cada una: nombre, grupo ('loco' | 'vagon' | 'adorno'), lo que es (`dice`), lo que pide (`pide`: tablas, troncos y
// piedras que llevás vos; `hierro`: las piezas que forja Anselmo), cuántos días tarda (`dias`; 0: en el día, en
// `horas`), lo que hace falta antes (`requiere`: ids de otras mejoras) y lo que cambia (`efecto`: { campo, valor }
// de la loco, o { vagon }).
const M = (nombre, grupo, dice, pide, hierro, dias, requiere, efecto, extra = {}) => ({ nombre, grupo, dice, pide, hierro, dias, requiere, efecto, ...extra });
export const MEJORAS_TREN = {
  'caldera-1': M('Caldera: tubos nuevos', 'loco', 'Tubos de humo nuevos y ladrillo refractario en el hogar: levanta presión más rápido.', { tabla: 2, piedra: 6 }, 4, 2, [], { campo: 'caldera', valor: 1 }, { nivel: 1 }),
  'caldera-2': M('Caldera: recalentador', 'loco', 'Un recalentador de vapor: más fuerza en las subidas, sin perder el paso.', { tabla: 2, piedra: 8, tronco: 2 }, 6, 3, ['caldera-1'], { campo: 'caldera', valor: 2 }, { nivel: 2 }),
  'caldera-3': M('Caldera: alta presión', 'loco', 'Válvulas y domo nuevos: la caldera trabaja a toda presión, como recién salida de la fábrica.', { piedra: 10, tronco: 4 }, 8, 4, ['caldera-2'], { campo: 'caldera', valor: 3 }, { nivel: 3 }),
  'freno-1': M('Freno: zapatas nuevas', 'loco', 'Zapatas de fundición nuevas en todas las ruedas: frena parejo y sin chirrido.', { tabla: 4 }, 3, 1, [], { campo: 'freno', valor: 1 }, { nivel: 1 }),
  'freno-2': M('Freno de vacío', 'loco', 'El freno de vacío en todo el tren: los vagones frenan junto con la locomotora.', { tabla: 2, piedra: 2 }, 5, 2, ['freno-1'], { campo: 'freno', valor: 2 }, { nivel: 2 }),
  'freno-3': M('Freno: ajuste fino', 'loco', 'Timonería nueva y el freno del ténder: para justo en el andén, al centímetro.', { tabla: 2, tronco: 1 }, 7, 3, ['freno-2'], { campo: 'freno', valor: 3 }, { nivel: 3 }),
  farol: M('Farol de proa', 'loco', 'Un farol grande con reflector: ilumina la vía de noche.', { tabla: 1 }, 2, 1, [], { campo: 'farol', valor: true }),
  'silbato-grave': M('Silbato grave', 'adorno', 'Un silbato de nota baja que se oye del otro lado del lago.', {}, 2, 0, [], { campo: 'silbato', valor: 'grave' }, { horas: 4 }),
  'silbato-doble': M('Silbato de dos tonos', 'adorno', 'Dos campanas en el mismo silbato: suena como los trenes del norte.', { tabla: 1 }, 3, 1, ['silbato-grave'], { campo: 'silbato', valor: 'doble' }),
  'silbato-pajaro': M('Silbato pájaro', 'adorno', 'Un silbato chiquito que imita al chucao. Martín jura que los chucaos contestan.', { tabla: 1 }, 2, 1, ['silbato-doble'], { campo: 'silbato', valor: 'pajaro' }),
  quitanieves: M('Quitanieves', 'loco', 'La pala de proa: abre la vía en la gran nevada.', { tabla: 4, tronco: 2 }, 6, 3, ['freno-1'], { campo: 'quitanieves', valor: true }),
  arenero: M('Arenero', 'loco', 'El domo de arena con sus caños: echa arena en los rieles y la loco no patina con lluvia ni con hielo.', { piedra: 6 }, 3, 2, ['caldera-1'], { campo: 'arenero', valor: true }),
  banderines: M('Guardas y banderines', 'adorno', 'Banderines en el frente y guardas pintadas en la cabina, para las fiestas.', { tabla: 2 }, 0, 0, [], { campo: 'banderines', valor: true }, { horas: 3 }),
  pasajeros: M('Coche de pasajeros', 'vagon', 'Un coche de primera con asientos de madera y la salamandra en el medio: los vecinos viajan y charlan, y vos llegás calentito.', { tabla: 12, tronco: 4, piedra: 2 }, 4, 3, [], { vagon: 'pasajeros' }),
  comedor: M('Coche comedor', 'vagon', 'Un coche con la cocina a leña, mesas y la pava siempre puesta: cocinar y matear en viaje.', { tabla: 14, tronco: 6, piedra: 4 }, 6, 4, ['pasajeros'], { vagon: 'comedor' }),
  carga: M('Furgón de carga', 'vagon', 'Un furgón cerrado con puertas corredizas: más fletes para el puesto de cargas.', { tabla: 12, tronco: 4 }, 6, 3, [], { vagon: 'carga' }),
  caballo: M('Jaula para el caballo', 'vagon', 'Una jaula de listones con su pesebre: el zaino viaja con vos.', { tabla: 10, tronco: 4 }, 4, 3, [], { vagon: 'caballo' }),
  mirador: M('Coche mirador', 'vagon', 'Un coche abierto a los costados, con baranda y bancos mirando afuera: para las fotos.', { tabla: 10, tronco: 2 }, 5, 3, [], { vagon: 'mirador' }),
  dormitorio: M('Coche dormitorio', 'vagon', 'Dos literas, una salamandra y cortinas: para hacer noche donde quieras.', { tabla: 16, tronco: 6, piedra: 2 }, 6, 5, ['comedor'], { vagon: 'dormitorio' }),
};
export const IDS_MEJORAS = Object.keys(MEJORAS_TREN);
export const esMejora = (id) => typeof id === 'string' && Object.hasOwn(MEJORAS_TREN, id);
export const mejoraDe = (id) => (esMejora(id) ? MEJORAS_TREN[id] : null);
export const GRUPOS_MEJORA = { loco: 'La locomotora', vagon: 'Los vagones', adorno: 'Los detalles' };
const MATERIALES = ['tabla', 'tronco', 'piedra'];

// ---------------------------------------------------------------- utilidades (sin tirar nunca: el guardado puede traer cualquier cosa)
const num = (v) => (typeof v === 'number' ? v : typeof v === 'string' || typeof v === 'boolean' ? Number(v) : NaN);
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const entero = (v, min = 0, max = 1e6) => { const n = Math.floor(num(v)); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min; };
const diaValido = (d, def = 1) => { const n = Math.floor(num(d)); return Number.isFinite(n) && n >= 1 ? Math.min(TOPE_DIA, n) : def; };
const horaValida = (h) => { const n = num(h); return Number.isFinite(n) ? ((n % 24) + 24) % 24 : 12; };
export const momento = (dia, hora) => diaValido(dia) * 24 + horaValida(hora);
const leer = (o, k) => (objeto(o) && Object.hasOwn(o, k) ? o[k] : undefined);

// ---------------------------------------------------------------- el estado
export function trenNuevo() {
  return {
    loco: { caldera: 0, freno: 0, farol: false, silbato: 'comun', quitanieves: false, arenero: false, pintura: { ...PINTURA_INICIAL }, nombre: NOMBRE_INICIAL, banderines: false },
    // ningún vagón nuevo: van los dos coches de segunda de siempre (tren-viaje.js)
    vagones: { pasajeros: false, comedor: false, carga: false, caballo: false, mirador: false, dormitorio: false },
    composicion: [],
    taller: { arreglado: false, hechas: [], pedido: null, ultimo: 0, avisar: [] },
  };
}
// El nombre: letras (con tildes y ñ), números, espacios y un poco de puntuación; sin espacios de más.
export function sanearNombreTren(v) {
  if (typeof v !== 'string') return NOMBRE_INICIAL;
  const t = v.replace(/[^\p{L}\p{N} .,'«»"\-¡!¿?]/gu, '').replace(/\s+/g, ' ').trim().slice(0, LARGO_NOMBRE).trim();
  return t || NOMBRE_INICIAL;
}
const sanearCuentas = (v) => Object.fromEntries(MATERIALES.map((k) => [k, entero(leer(v, k), 0, 999)]));
function sanearPedido(v, hoy) {
  if (!objeto(v) || !esMejora(v.id)) return null;
  const tope = momento(hoy, 23.99);
  const m = (x) => { const n = num(x); return Number.isFinite(n) && n >= 24 && n <= tope + 24 * 30 ? n : null; };
  const desde = m(v.desde) ?? momento(hoy, 12);
  const empezo = m(v.empezo);
  const listo = m(v.listo);
  const pide = pideMejora(v.id, !!v.arreglo);
  const aportado = Object.fromEntries(MATERIALES.map((k) => [k, Math.min(entero(leer(v.aportado, k), 0, 999), pide[k] || 0)]));
  const hierro = entero(v.hierro, 0, MEJORAS_TREN[v.id].hierro);
  // armándose sólo si de verdad estaba todo (un guardado retocado no regala una mejora)
  const todo = MATERIALES.every((k) => aportado[k] >= (pide[k] || 0)) && hierro >= MEJORAS_TREN[v.id].hierro;
  const arranco = todo && empezo !== null && empezo >= desde;
  return { id: v.id, arreglo: !!v.arreglo, aportado, hierro, desde: Math.min(desde, tope), empezo: arranco ? empezo : null, listo: arranco ? (listo !== null && listo >= empezo ? listo : cuandoLista(v.id, empezo)) : null };
}
// Un `progreso.tren` cualquiera (de un guardado roto, de otra versión, basura): siempre uno válido. Lo hecho
// manda: si una mejora está en `hechas`, su efecto vale (no se puede tener la caldera 3 sin la 1 y la 2).
export function sanearTren(v, hoy = null) {
  const n = trenNuevo();
  if (!objeto(v)) return n;
  const dia = hoy === null ? TOPE_DIA : diaValido(hoy);
  const t = objeto(v.taller) ? v.taller : {};
  // lo hecho: ids conocidos, sin repetir, y cada uno con lo que requiere (en orden de la tabla)
  const pedidas = new Set(Array.isArray(t.hechas) ? t.hechas.filter(esMejora) : []);
  const hechas = [];
  for (const id of IDS_MEJORAS) if (pedidas.has(id) && MEJORAS_TREN[id].requiere.every((r) => hechas.includes(r))) hechas.push(id);
  // lo que viene de la loco y los vagones (una partida que el equipo del tren tocó, o la de antes del taller): sólo
  // lo que se puede ver como hecho; el nivel no pasa de lo hecho en el taller
  const L = objeto(v.loco) ? v.loco : {};
  const loco = n.loco;
  for (const id of hechas) { const e = MEJORAS_TREN[id].efecto; if (e.campo && e.campo !== 'silbato') loco[e.campo] = typeof e.valor === 'number' ? Math.max(loco[e.campo], e.valor) : e.valor; }
  const silbatos = silbatosDe({ taller: { hechas } });
  loco.silbato = typeof L.silbato === 'string' && silbatos.includes(L.silbato) ? L.silbato : 'comun';
  const P = objeto(L.pintura) ? L.pintura : {};
  for (const k of Object.keys(PARTES_PINTURA)) loco.pintura[k] = colorTren(P[k]);
  loco.nombre = sanearNombreTren(L.nombre);
  const vagones = n.vagones;
  for (const id of hechas) { const e = MEJORAS_TREN[id].efecto; if (e.vagon) vagones[e.vagon] = true; }
  const comp = [];
  for (const k of Array.isArray(v.composicion) ? v.composicion : []) if (typeof k === 'string' && Object.hasOwn(vagones, k) && vagones[k] && !comp.includes(k) && comp.length < VAGONES_MAX) comp.push(k);
  const pedido = sanearPedido(t.pedido, dia);
  const valePedido = pedido && !hechas.includes(pedido.id) && MEJORAS_TREN[pedido.id].requiere.every((r) => hechas.includes(r));
  const ultimo = num(t.ultimo);
  return {
    loco, vagones, composicion: comp,
    taller: {
      arreglado: !!t.arreglado || hechas.length > 0,
      hechas,
      pedido: valePedido ? { ...pedido, arreglo: !hechas.length && !t.arreglado } : null,
      ultimo: Number.isFinite(ultimo) && ultimo >= 0 ? Math.min(ultimo, momento(dia, 23.99)) : 0,
      avisar: Array.isArray(t.avisar) ? [...new Set(t.avisar.filter((id) => hechas.includes(id)))].slice(-8) : [],
    },
  };
}
// Desde la 3.7.2 (sin `progreso.tren`): el tren de siempre, con el galpón viejo esperando. Si el equipo del tren
// guardó algo antes, se respeta lo que se pueda (ver `sanearTren`).
export function migrarTren(p) {
  return sanearTren(objeto(p) ? p.tren : null, objeto(p) ? p.dia : null);
}

// ---------------------------------------------------------------- consultas
const tallerDe = (tren) => (objeto(tren?.taller) ? tren.taller : { arreglado: false, hechas: [], pedido: null, ultimo: 0, avisar: [] });
export const hecha = (tren, id) => Array.isArray(tallerDe(tren).hechas) && tallerDe(tren).hechas.includes(id);
export const silbatosDe = (tren) => ['comun', ...IDS_MEJORAS.filter((id) => hecha(tren, id) && MEJORAS_TREN[id].efecto.campo === 'silbato').map((id) => MEJORAS_TREN[id].efecto.valor)];
export const vagonesHechos = (tren) => IDS_VAGONES.filter((k) => !!tren?.vagones?.[k]);
// Lo que pide una mejora en materiales (con el arreglo del galpón si es la primera).
export function pideMejora(id, conArreglo = false) {
  const m = mejoraDe(id);
  if (!m) return {};
  const pide = {};
  for (const k of MATERIALES) { const n = (m.pide[k] || 0) + (conArreglo ? ARREGLO_TALLER[k] || 0 : 0); if (n > 0) pide[k] = n; }
  return pide;
}
// ¿Se puede pedir? { puede, motivo }: 'hecha' | 'requiere' (con `falta`: la mejora que hace falta antes) | 'ocupado'
// (hay otra en el taller) | 'desconocida'.
export function puedePedir(tren, id) {
  if (!esMejora(id)) return { puede: false, motivo: 'desconocida' };
  if (hecha(tren, id)) return { puede: false, motivo: 'hecha' };
  const falta = MEJORAS_TREN[id].requiere.find((r) => !hecha(tren, r));
  if (falta) return { puede: false, motivo: 'requiere', falta };
  const p = tallerDe(tren).pedido;
  if (p) return { puede: false, motivo: p.id === id ? 'pedida' : 'ocupado' };
  return { puede: true, motivo: null };
}
// Lo que falta del pedido de ahora: { materiales: { k: n }, hierro: n, todo: bool }.
export function faltaDelPedido(tren) {
  const p = tallerDe(tren).pedido;
  if (!p) return null;
  const pide = pideMejora(p.id, p.arreglo);
  const materiales = {};
  for (const k of MATERIALES) { const n = Math.max(0, (pide[k] || 0) - (p.aportado?.[k] || 0)); if (n > 0) materiales[k] = n; }
  const hierro = Math.max(0, MEJORAS_TREN[p.id].hierro - (p.hierro || 0));
  return { materiales, hierro, todo: !Object.keys(materiales).length && hierro === 0 };
}
// En qué anda el taller: 'libre' | 'juntando' (faltan material o piezas) | 'armando' (Ernesto y Martín trabajan).
export function estadoTaller(tren) {
  const p = tallerDe(tren).pedido;
  if (!p) return 'libre';
  return p.empezo !== null && p.empezo !== undefined ? 'armando' : 'juntando';
}
// Cuándo queda lista una que se empieza a armar en `t` (horas absolutas).
export function cuandoLista(id, t) {
  const m = mejoraDe(id);
  if (!m) return t;
  const dia = Math.floor(t / 24), hora = t - dia * 24;
  if (m.dias > 0) return (dia + m.dias) * 24 + HORA_LISTA;
  // las de un rato: en el horario del taller; si no entran hoy, mañana a primera hora
  const [abre, cierra] = HORARIO_TALLER;
  const desde = hora < abre ? dia * 24 + abre : hora >= cierra ? (dia + 1) * 24 + abre : t;
  const horas = m.horas || 3;
  const d = Math.floor(desde / 24), h = desde - d * 24;
  return h + horas <= cierra ? desde + horas : (d + 1) * 24 + abre + horas;
}

// ---------------------------------------------------------------- acciones
// Pedir una mejora: queda en el taller esperando el material y las piezas. { ok, motivo, pedido }.
export function pedirMejora(tren, id, dia = 1, hora = 12) {
  const r = puedePedir(tren, id);
  if (!r.puede) return { ok: false, motivo: r.motivo, falta: r.falta || null };
  const t = tallerDe(tren);
  if (!objeto(tren.taller)) tren.taller = t;
  const arreglo = !t.arreglado && !t.hechas.length;
  t.pedido = { id, arreglo, aportado: { tabla: 0, tronco: 0, piedra: 0 }, hierro: 0, desde: momento(dia, hora), empezo: null, listo: null };
  if (!Number.isFinite(t.ultimo) || t.ultimo < t.pedido.desde) t.ultimo = t.pedido.desde;
  arrancarSiEsta(t, t.pedido.desde);
  return { ok: true, motivo: null, pedido: t.pedido };
}
// Dejar el pedido (lo aportado vuelve: Martín no se queda con nada). { ok, devuelto }.
export function cancelarPedido(tren) {
  const t = tallerDe(tren);
  if (!t.pedido || t.pedido.empezo !== null) return { ok: false, devuelto: {} };
  const devuelto = Object.fromEntries(MATERIALES.filter((k) => t.pedido.aportado[k] > 0).map((k) => [k, t.pedido.aportado[k]]));
  t.pedido = null;
  return { ok: true, devuelto };
}
// Llevar material: se toma lo que haga falta de lo que tenés (de a poco, como en las obras del pueblo).
// `disponibles`: { tabla, tronco, piedra }. Devuelve { ok, dado: { k: n }, faltan, completo, empezo }.
export function aportarMejora(tren, disponibles, dia = 1, hora = 12) {
  const t = tallerDe(tren);
  const p = t.pedido;
  if (!p) return { ok: false, motivo: 'sin-pedido', dado: {}, faltan: {}, completo: false, empezo: false };
  if (p.empezo !== null) return { ok: false, motivo: 'armando', dado: {}, faltan: {}, completo: true, empezo: true };
  const pide = pideMejora(p.id, p.arreglo);
  const dado = {};
  for (const k of MATERIALES) {
    const falta = Math.max(0, (pide[k] || 0) - (p.aportado[k] || 0));
    const hay = entero(leer(disponibles, k), 0, 1e6);
    const n = Math.min(falta, hay);
    if (n > 0) { p.aportado[k] = (p.aportado[k] || 0) + n; dado[k] = n; }
  }
  const ahora = momento(dia, hora);
  const empezo = arrancarSiEsta(t, ahora);
  const f = faltaDelPedido(tren);
  return { ok: Object.keys(dado).length > 0, motivo: Object.keys(dado).length ? null : 'nada', dado, faltan: f.materiales, hierroFalta: f.hierro, completo: Object.keys(f.materiales).length === 0, empezo };
}
// Con todo (material y piezas), se empieza a armar en `t`.
function arrancarSiEsta(taller, t) {
  const p = taller.pedido;
  if (!p || p.empezo !== null) return false;
  const pide = pideMejora(p.id, p.arreglo);
  if (MATERIALES.some((k) => (p.aportado[k] || 0) < (pide[k] || 0))) return false;
  if ((p.hierro || 0) < MEJORAS_TREN[p.id].hierro) return false;
  p.empezo = t;
  p.listo = cuandoLista(p.id, t);
  return true;
}
// Los momentos en que llega una pieza de hierro entre `desde` (sin contar) y `hasta` (contando).
function piezasEntre(desde, hasta, herreria) {
  const horas = herreria ? HORAS_FORJA : [HORA_TREN_PIEZAS];
  const lista = [];
  for (let d = Math.floor(desde / 24); d <= Math.floor(hasta / 24) && lista.length < TOPE_PASOS; d++) for (const h of horas) { const t = d * 24 + h; if (t > desde && t <= hasta) lista.push(t); }
  return lista;
}
// El reloj del taller. `dia`, `hora`: ahora. `herreria`: si la herrería de Anselmo está abierta (si no, las piezas
// llegan de El Maitén, de a una). Repasa en orden todo lo que pasó desde la última vez (las piezas, el arranque y la
// mejora terminada), sirva para un cuadro o para una noche entera durmiendo. Devuelve { piezas, empezo, lista }:
// `lista` es el id de la mejora que quedó lista (y queda en `taller.avisar` hasta que el juego la anuncie).
export function avanzarTaller(tren, dia, hora, { herreria = false } = {}) {
  const t = tallerDe(tren);
  const ahora = momento(dia, hora);
  const salida = { piezas: 0, empezo: false, lista: null };
  if (!Number.isFinite(t.ultimo) || t.ultimo <= 0) t.ultimo = ahora;
  if (ahora <= t.ultimo) return salida;
  const desde = t.ultimo;
  t.ultimo = ahora;
  const p = t.pedido;
  if (!p) return salida;
  // las piezas que se forjaron mientras tanto (y, con la última, se puede empezar)
  const falta = () => MEJORAS_TREN[p.id].hierro - (p.hierro || 0);
  if (p.empezo === null && falta() > 0) {
    for (const tp of piezasEntre(Math.max(desde, p.desde), ahora, herreria)) {
      if (falta() <= 0) break;
      p.hierro = (p.hierro || 0) + 1; salida.piezas++;
      if (arrancarSiEsta(t, tp)) { salida.empezo = true; break; }
    }
  }
  if (p.empezo === null && arrancarSiEsta(t, ahora)) salida.empezo = true;
  // ¿quedó lista?
  if (p.empezo !== null && p.listo !== null && ahora >= p.listo) {
    terminarMejora(tren, p.id);
    salida.lista = p.id;
  }
  return salida;
}
// La mejora terminada: su efecto en la loco o el vagón nuevo (enganchado si entra), el galpón arreglado.
function terminarMejora(tren, id) {
  const t = tallerDe(tren);
  const m = MEJORAS_TREN[id];
  if (!t.hechas.includes(id)) t.hechas.push(id);
  t.pedido = null;
  t.arreglado = true;
  if (!objeto(tren.loco)) tren.loco = trenNuevo().loco;
  if (!objeto(tren.vagones)) tren.vagones = trenNuevo().vagones;
  if (!Array.isArray(tren.composicion)) tren.composicion = [];
  const e = m.efecto;
  if (e.vagon) {
    tren.vagones[e.vagon] = true;
    if (!tren.composicion.includes(e.vagon) && tren.composicion.length < VAGONES_MAX) tren.composicion.push(e.vagon);
  } else if (e.campo) tren.loco[e.campo] = typeof e.valor === 'number' ? Math.max(Number(tren.loco[e.campo]) || 0, e.valor) : e.valor;
  t.avisar = [...(t.avisar || []).filter((x) => x !== id), id].slice(-8);
}
// Lo que hay que anunciar (las que quedaron listas y todavía no se dijeron), y se borra.
export function tomarAvisos(tren) {
  const t = tallerDe(tren);
  const lista = Array.isArray(t.avisar) ? t.avisar.filter(esMejora) : [];
  t.avisar = [];
  return lista;
}

// ---------------------------------------------------------------- pintura, nombre, silbato, composición
// (`color`: un id o un '#rrggbb' de la paleta; null vuelve a la de siempre)
export function pintar(tren, parte, color) {
  if (!Object.hasOwn(PARTES_PINTURA, parte)) return false;
  const h = colorTren(color);
  if (!h && color !== null) return false;
  if (!objeto(tren.loco)) tren.loco = trenNuevo().loco;
  if (!objeto(tren.loco.pintura)) tren.loco.pintura = { ...PINTURA_INICIAL };
  tren.loco.pintura[parte] = h;
  return true;
}
// El que sigue (para elegir con una sola tecla): la de siempre, después los de la paleta en orden, y otra vez.
export function colorSiguiente(actual, paso = 1) {
  const lista = [null, ...HEX_PALETA], h = colorTren(actual);
  const i = Math.max(0, lista.indexOf(h));
  return lista[(((i + paso) % lista.length) + lista.length) % lista.length];
}
export function ponerNombre(tren, texto) {
  if (typeof texto !== 'string' || !sanearNombreTren(texto)) return false;
  if (!objeto(tren.loco)) tren.loco = trenNuevo().loco;
  tren.loco.nombre = sanearNombreTren(texto);
  return true;
}
export function elegirSilbato(tren, id) {
  if (!silbatosDe(tren).includes(id)) return false;
  if (!objeto(tren.loco)) tren.loco = trenNuevo().loco;
  tren.loco.silbato = id;
  return true;
}
// La composición: los vagones en orden detrás del ténder (hasta VAGONES_MAX, sólo los hechos, sin repetir). Vacía,
// van los que tengas (o los dos de segunda de siempre): ver `composicionDe` de tren-viaje.js. { ok, composicion, motivo }.
export function elegirComposicion(tren, lista) {
  if (!Array.isArray(lista)) return { ok: false, motivo: 'lista', composicion: tren?.composicion || [] };
  const hechos = vagonesHechos(tren);
  const comp = [];
  for (const k of lista) if (typeof k === 'string' && hechos.includes(k) && !comp.includes(k)) comp.push(k);
  if (comp.length > VAGONES_MAX) return { ok: false, motivo: 'largo', composicion: tren.composicion };
  tren.composicion = comp;
  return { ok: true, motivo: null, composicion: comp };
}
// Enganchar o desenganchar un vagón (al final del tren). { ok, motivo, composicion }.
export function alternarVagon(tren, id) {
  const comp = Array.isArray(tren?.composicion) ? [...tren.composicion] : [];
  if (!vagonesHechos(tren).includes(id)) return { ok: false, motivo: 'no-hecho', composicion: comp };
  if (comp.includes(id)) return elegirComposicion(tren, comp.filter((k) => k !== id));
  if (comp.length >= VAGONES_MAX) return { ok: false, motivo: 'largo', composicion: comp };
  return elegirComposicion(tren, [...comp, id]);
}
// Pasar un vagón un lugar más adelante (más cerca de la locomotora).
export function adelantarVagon(tren, id) {
  const comp = Array.isArray(tren?.composicion) ? [...tren.composicion] : [];
  const i = comp.indexOf(id);
  if (i <= 0) return { ok: false, motivo: 'primero', composicion: comp };
  [comp[i - 1], comp[i]] = [comp[i], comp[i - 1]];
  return elegirComposicion(tren, comp);
}

// ---------------------------------------------------------------- textos
const NOMBRE_MAT = { tabla: ['tabla', 'tablas'], tronco: ['tronco', 'troncos'], piedra: ['piedra', 'piedras'] };
// "6 tablas, 2 troncos y 1 piedra"
export function textoMateriales(m) {
  const partes = MATERIALES.filter((k) => (m?.[k] || 0) > 0).map((k) => `${m[k]} ${NOMBRE_MAT[k][m[k] === 1 ? 0 : 1]}`);
  if (partes.length < 2) return partes[0] || '';
  return `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
}
export const textoPiezas = (n) => (n === 1 ? 'una pieza de hierro' : `${n} piezas de hierro`);
export function textoDias(id) {
  const m = mejoraDe(id);
  if (!m) return '';
  return m.dias === 0 ? `${m.horas || 3} horas de taller` : m.dias === 1 ? 'un día' : `${m.dias} días`;
}
// Lo que pide, dicho entero: "4 tablas y 6 piedras, más 4 piezas de hierro · 2 días".
export function textoPide(id, conArreglo = false) {
  const m = mejoraDe(id);
  if (!m) return '';
  const mat = textoMateriales(pideMejora(id, conArreglo));
  const hierro = m.hierro ? textoPiezas(m.hierro) : '';
  const lo = mat && hierro ? `${mat}, más ${hierro}` : mat || hierro || 'nada';
  return `${lo} · ${textoDias(id)}`;
}
// "Lista el día 5 a las 7" (para el panel y el calendario).
export function textoListo(t) {
  if (!Number.isFinite(t)) return '';
  // 3.8.3: los minutos se redondean junto con la hora (a las 13,995 decía «a las 13:60»)
  const min = Math.round(t * 60), d = Math.floor(min / 1440), r = min - d * 1440;
  const hh = Math.floor(r / 60), mm = r % 60;
  return `el día ${d} a las ${hh}${mm ? `:${String(mm).padStart(2, '0')}` : ''}`;
}
// Para el calendario del cuaderno (aldea-vida.js): lo que queda listo cada día.
export function eventosTaller(tren) {
  const p = tallerDe(tren).pedido;
  if (!p || p.listo === null || p.listo === undefined) return [];
  return [{ tipo: 'taller', id: p.id, dia: Math.floor(p.listo / 24), nombre: MEJORAS_TREN[p.id].nombre, texto: `En el taller: ${MEJORAS_TREN[p.id].nombre.toLowerCase()}, ${p.listo % 24 <= HORA_LISTA ? 'a primera hora' : p.listo % 24 < 13 ? 'a la mañana' : 'a la tarde'}` }];
}

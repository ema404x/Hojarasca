// 4.3 · El empleo fijo. Un puesto en un local de la aldea (el almacén de Ercilia, la casa de té de Ceinwen, el taller ferroviario de
// Martín y el banco de Amadeo): fichás, hacés el turno con tareas cortas del puesto (E en cada lugar) y al final cobrás el sueldo.
// Con los días trabajados y el nivel de un oficio relacionado, subís de escalón (Aprendiz, Empleado y Encargado) y el sueldo crece.
//
// Módulo puro (sin DOM, sin three y sin la aldea: se prueba en Node). Sólo en el Relax: sin economía (el Desafío) no hay empleo.
//   · `progreso.empleo = { v, locales, turno, hoy, total, historial }`; una partida de antes no lo trae y sale vacío;
//   · `locales[local] = { dias, faltas, escalon, ultimo, cobrado }`: lo que llevás en cada local (días cumplidos, abandonos, el escalón más
//     alto que alcanzaste, el último día que cumpliste y lo cobrado en total);
//   · `turno` (null si no estás trabajando) = { local, dia, desde, hasta, escalon, sueldo, total, hechas, fichado, seq }: el turno en curso;
//   · `hoy = { dia, turnos }`: hay un turno por día (el turno ocupa uno de los dos jornales del día: ver trabajos.js);
//   · todo pago pasa por `cobrar` de economia.js, con el motivo escrito.
import { hayEconomia, cobrar, formatoPesos } from './economia.js';
import { nivelOficio } from './oficios.js';

export const EMPLEO = {
  tareasPorTurno: 8,       // tareas de un turno completo
  horasPorTarea: 0.4,      // horas de juego que corre el reloj con cada tarea (el resto del rato corre solo, al caminar)
  horasPorTareaEstimada: 0.5,   // lo mismo con el camino de una a otra: para avisar cuántas tareas entran antes de la hora de cierre
  cumplido: 0.75,          // desde esta fracción de las tareas el día cuenta como cumplido
  multa: 0.25,             // lo que se descuenta de lo hecho si te vas antes de tiempo
  turnosPorDia: 1,
  adelanto: 0.5,           // se ficha desde media hora antes del turno
  horasMinimas: 1.5,       // y hasta que falten al menos 1,5 h para que termine
  gracia: 0.75,            // pasada la hora de cierre el turno se cierra solo, con lo hecho, a los 45 minutos
  redondeo: 50,
  historialMax: 24,
  diasLibres: [6],         // domingo (el 7.º día de la semana: ver diaSemanaDe de aldea.js)
};

export const ESCALONES = [
  { id: 'aprendiz', nombre: 'Aprendiz', dias: 0, nivelOficio: 0 },
  { id: 'empleado', nombre: 'Empleado', dias: 5, nivelOficio: 1 },
  { id: 'encargado', nombre: 'Encargado', dias: 14, nivelOficio: 2 },
];

// Cada puesto: el local de la aldea, quién manda, el turno, el sueldo por escalón (turno completo), el oficio que cuenta para ascender
// y las tareas. El cartel de turnos (`ficha`) mira, por defecto, hacia la puerta del local (`giro`: lo que se aparta de eso, en radianes). Los lugares (`x`, `z`) están en el marco del edificio (el centro de su planta, +z hacia la puerta) y `dy` es la altura
// del piso sobre el nivel del lote; `seg` es lo que lleva la tarea, en segundos.
export const PUESTOS = {
  almacen: {
    local: 'almacen', saludos: ['Tomá el delantal: atendé a los que entren y lo demás se hace solo.','Hoy no se para: la mercadería no se acomoda sola.'], nombre: 'el almacén', completo: 'Almacén de Ramos Generales', jefe: 'Ercilia', desde: 16, hasta: 20,
    sueldos: [1600, 2100, 2700], cargos: ['Ayudante de mostrador', 'Despachante', 'Encargado del almacén'],
    oficio: 'huertero', oficioNombre: 'huertero',
    ficha: { x: 2.4, z: 0.9, dy: 0.45, giro: -Math.PI / 2 },
    tareas: [
      { id: 'mostrador', nombre: 'Atender el mostrador', x: 0, z: -1.1, dy: 0.45, seg: 4, hecho: 'Atendiste a un cliente', donde: 'frente al mostrador' },
      { id: 'bolsas', nombre: 'Pesar y embolsar la yerba y la harina', x: -2.4, z: 0.3, dy: 0.45, seg: 5, hecho: 'Embolsaste la mercadería', donde: 'junto a las bolsas, a la izquierda' },
      { id: 'cajones', nombre: 'Acomodar la mercadería en los cajones', x: 2, z: -0.7, dy: 0.45, seg: 5, hecho: 'Los cajones quedaron ordenados', donde: 'junto a los cajones, a la derecha' },
      { id: 'vereda', nombre: 'Barrer la vereda', x: -0.9, z: 2.8, dy: 0.5, seg: 4, hecho: 'La vereda quedó limpia', donde: 'afuera, en la vereda' },
    ],
  },
  'casa-te': {
    local: 'casa-te', saludos: ['Pasá, querida: las mesas esperan y la tanda no se amasa sola.','Cuidado con las tazas, que son de mi abuela.'], nombre: 'la casa de té', completo: 'Casa de Té', jefe: 'Ceinwen', desde: 9, hasta: 13,
    sueldos: [1600, 2000, 2600], cargos: ['Ayudante de salón', 'Moza de té', 'Encargada del salón'],
    oficio: 'huertero', oficioNombre: 'huertero',
    ficha: { x: 0.85, z: 3.2, dy: 0.24 },
    tareas: [
      { id: 'servir', nombre: 'Servir el té en las mesas', x: -0.8, z: 1.8, dy: 0.24, seg: 4, hecho: 'Serviste una mesa', donde: 'en la galería, entre las mesas' },
      { id: 'amasar', nombre: 'Amasar y hornear la tanda', x: -1.2, z: -2.4, dy: 0.38, seg: 6, hecho: 'La tanda entró al horno', donde: 'adentro, en la mesada de la cocina (abrí la puerta con E)' },
      { id: 'lena', nombre: 'Cargar leña a la cocina', x: 0.4, z: -3.2, dy: 0.38, seg: 4, hecho: 'La cocina quedó con leña', donde: 'adentro, junto a la cocina económica' },
      { id: 'bandejas', nombre: 'Armar las bandejas con scones', x: 2.2, z: -1.2, dy: 0.38, seg: 5, hecho: 'Las bandejas están listas', donde: 'adentro, en la mesa larga' },
    ],
  },
  'taller-tren': {
    local: 'taller-tren', saludos: ['Ponete los guantes: acá se trabaja con fuego y con paciencia.','Lo que sale de este taller anda sobre rieles: sin apuro, pero bien hecho.'], nombre: 'el taller ferroviario', completo: 'Taller ferroviario', jefe: 'Martín', desde: 8, hasta: 12,
    sueldos: [1800, 2300, 2800], cargos: ['Ayudante de taller', 'Herrero de taller', 'Encargado del taller'],
    oficio: 'picapedrero', oficioNombre: 'picapedrero',
    ficha: { x: 1.5, z: 2.3, dy: 0.33 },
    tareas: [
      { id: 'fragua', nombre: 'Atizar la fragua con el fuelle', x: 2.9, z: -0.5, dy: 0.33, seg: 5, hecho: 'La fragua quedó al rojo', donde: 'junto a la fragua y el yunque' },
      { id: 'morsa', nombre: 'Limar piezas en la morsa', x: 0, z: -1.3, dy: 0.33, seg: 5, hecho: 'Limaste una pieza', donde: 'en el banco de la morsa' },
      { id: 'ruedas', nombre: 'Aceitar el juego de ruedas', x: -5.4, z: 1.4, dy: 0.33, seg: 5, hecho: 'Las ruedas quedaron aceitadas', donde: 'al fondo, junto a las ruedas de repuesto' },
      { id: 'barril', nombre: 'Llenar el barril para templar', x: 5, z: -2, dy: 0.33, seg: 4, hecho: 'El barril quedó lleno', donde: 'junto a los barriles, a la derecha' },
    ],
  },
  'banco-pueblo': {
    local: 'banco-pueblo', saludos: ['Sin apuro, pero sin errores: la plata ajena se cuenta dos veces.','Bienvenido a la ventanilla: lo que se anota, se anota derecho.'], nombre: 'el banco', completo: 'Banco del Pueblo', jefe: 'Amadeo', desde: 8.5, hasta: 12.5,
    sueldos: [1700, 2200, 2800], cargos: ['Ayudante de ventanilla', 'Cajero', 'Encargado de caja'],
    oficio: 'obrero', oficioNombre: 'constructor',
    ficha: { x: 2.2, z: 2.9, dy: 0.32, giro: -Math.PI / 2 },
    tareas: [
      { id: 'billetes', nombre: 'Contar los billetes de la caja', x: -1.0, z: 1.4, dy: 0.32, seg: 5, hecho: 'La caja cerró justa', donde: 'frente al mostrador, a la izquierda' },
      { id: 'sellos', nombre: 'Sellar los formularios', x: 1.5, z: 1.4, dy: 0.32, seg: 4, hecho: 'Sellaste los formularios', donde: 'frente al mostrador, a la derecha' },
      { id: 'archivo', nombre: 'Ordenar el archivo de legajos', x: -2.5, z: 2.5, dy: 0.32, seg: 5, hecho: 'El archivo quedó en orden', donde: 'junto al banco de espera, a la izquierda' },
      { id: 'reja', nombre: 'Lustrar los bronces de la reja', x: 0.1, z: 1.4, dy: 0.32, seg: 4, hecho: 'La reja brilla', donde: 'frente a la ventanilla, en el medio' },
    ],
  },
};
export const IDS_PUESTOS = Object.keys(PUESTOS);
export const hayPuesto = (k) => typeof k === 'string' && Object.hasOwn(PUESTOS, k);

const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const entero = (v, max = 1e7) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0; };
const real = (v, a, b) => { const n = Number(v); return Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : a; };
const dia1 = (v) => Math.max(1, entero(v, 1e6));
const redondear = (n) => Math.round(n / EMPLEO.redondeo) * EMPLEO.redondeo;
export const diaSemana = (dia) => ((dia1(dia) - 1) % 7 + 7) % 7;
export const esDiaLibre = (dia) => EMPLEO.diasLibres.includes(diaSemana(dia));
// «16», «8:30»
export function horaCorta(h) {
  const x = ((Number(h) || 0) % 24 + 24) % 24, hh = Math.floor(x + 1e-9), mm = Math.round((x - hh) * 60);
  return mm === 0 ? String(hh) : `${hh}:${String(mm).padStart(2, '0')}`;
}
export function horaReloj(h) {
  const x = ((Number(h) || 0) % 24 + 24) % 24, hh = Math.floor(x + 1e-9), mm = Math.min(59, Math.floor((x - hh) * 60 + 1e-9));
  return `${hh}:${String(mm).padStart(2, '0')}`;
}

// ---------------------------------------------------------------- el estado guardado
export const empleoNuevo = () => ({ v: 1, locales: {}, turno: null, hoy: { dia: 0, turnos: 0 }, total: { turnos: 0, cobrado: 0, abandonos: 0 }, historial: [] });
const localNuevo = () => ({ dias: 0, faltas: 0, escalon: 0, ultimo: 0, cobrado: 0 });

function sanearLocal(v, hoy) {
  const b = objeto(v) ? v : {};
  return { dias: entero(b.dias, 1e5), faltas: entero(b.faltas, 1e5), escalon: Math.min(ESCALONES.length - 1, entero(b.escalon, 9)), ultimo: Math.min(hoy, entero(b.ultimo, 1e6)), cobrado: entero(b.cobrado, 1e9) };
}
function sanearTurno(v, hoy) {
  if (!objeto(v) || !hayPuesto(v.local)) return null;
  const P = PUESTOS[v.local], total = Math.max(1, entero(v.total, 40) || EMPLEO.tareasPorTurno);
  const seq = (Array.isArray(v.seq) ? v.seq : []).filter((id) => P.tareas.some((t) => t.id === id)).slice(0, total);
  const esc = Math.min(ESCALONES.length - 1, entero(v.escalon, 9));
  if (seq.length < total) return null;
  return {
    local: v.local, dia: Math.min(hoy, dia1(v.dia)), desde: P.desde, hasta: P.hasta, escalon: esc, sueldo: P.sueldos[esc], total,
    hechas: Math.min(total, entero(v.hechas, 40)), fichado: real(v.fichado, 0, 24), seq,
  };
}
// Lo guardado, saneado. `hoy`: el día de la partida (nada puede ser de un día que todavía no llegó).
export function sanearEmpleo(v, hoy = 1e6) {
  const base = empleoNuevo();
  if (!objeto(v)) return base;
  const dia = dia1(hoy);
  const locales = {};
  if (objeto(v.locales)) for (const k of IDS_PUESTOS) if (Object.hasOwn(v.locales, k)) locales[k] = sanearLocal(v.locales[k], dia);
  const h = objeto(v.hoy) ? { dia: Math.min(dia, entero(v.hoy.dia, 1e6)), turnos: entero(v.hoy.turnos, 9) } : base.hoy;
  const t = objeto(v.total) ? { turnos: entero(v.total.turnos, 1e6), cobrado: entero(v.total.cobrado, 1e10), abandonos: entero(v.total.abandonos, 1e6) } : base.total;
  const historial = (Array.isArray(v.historial) ? v.historial : []).filter((x) => objeto(x) && hayPuesto(x.local)).map((x) => ({
    dia: Math.min(dia, dia1(x.dia)), local: x.local, escalon: Math.min(ESCALONES.length - 1, entero(x.escalon, 9)), hechas: entero(x.hechas, 40), total: Math.max(1, entero(x.total, 40)),
    monto: entero(x.monto, 1e7), motivo: ['completo', 'tiempo', 'abandono', 'dia'].includes(x.motivo) ? x.motivo : 'completo',
  })).slice(-EMPLEO.historialMax);
  return { v: 1, locales, turno: sanearTurno(v.turno, dia), hoy: h, total: t, historial };
}
export const hayEmpleo = (p) => hayEconomia(p) && objeto(p?.empleo);
// El estado de la partida (lo crea si no estaba). Sin economía (el Desafío), null.
export function empleoDe(p) {
  if (!hayEconomia(p)) return null;
  if (!objeto(p.empleo)) p.empleo = empleoNuevo();
  return p.empleo;
}
// Lo guardado sin tocar nada (null si no hay): para mirar sin crear
const leer = (p) => (hayEconomia(p) && objeto(p.empleo) ? p.empleo : null);
const localDe = (e, k) => (e.locales[k] || (e.locales[k] = localNuevo()));

// ---------------------------------------------------------------- escalones y sueldos
export const nivelDeOficio = (p, k) => (hayPuesto(k) ? nivelOficio(p?.oficios, PUESTOS[k].oficio) : 0);
// El escalón que te toca por lo hecho: el más alto cuyos días y nivel de oficio cumplís (nunca bajás del que ya alcanzaste)
export function escalonDe(p, k) {
  if (!hayPuesto(k)) return 0;
  const l = leer(p)?.locales?.[k] || localNuevo(), n = nivelDeOficio(p, k);
  let esc = 0;
  for (let i = 1; i < ESCALONES.length; i++) if (l.dias >= ESCALONES[i].dias && n >= ESCALONES[i].nivelOficio) esc = i;
  return Math.max(esc, Math.min(ESCALONES.length - 1, l.escalon || 0));
}
export const sueldoDe = (k, escalon) => (hayPuesto(k) ? PUESTOS[k].sueldos[Math.max(0, Math.min(ESCALONES.length - 1, escalon | 0))] : 0);
export const cargoDe = (k, escalon) => (hayPuesto(k) ? PUESTOS[k].cargos[Math.max(0, Math.min(ESCALONES.length - 1, escalon | 0))] : '');
// Lo que falta para el próximo escalón: { hay, escalon, dias, oficio, oficioNombre } (las dos cuentas que faltan, 0 si ya están)
export function faltaParaAscender(p, k) {
  if (!hayPuesto(k)) return { hay: false };
  const esc = escalonDe(p, k);
  if (esc >= ESCALONES.length - 1) return { hay: false, tope: true };
  const sig = ESCALONES[esc + 1], l = leer(p)?.locales?.[k] || localNuevo();
  return { hay: true, escalon: esc + 1, nombre: sig.nombre, dias: Math.max(0, sig.dias - l.dias), oficio: Math.max(0, sig.nivelOficio - nivelDeOficio(p, k)), nivelOficio: sig.nivelOficio, oficioNombre: PUESTOS[k].oficioNombre };
}

// ---------------------------------------------------------------- las tareas de un turno
// El orden de las tareas de un turno: parejo (las cuatro se reparten por igual) y sin repetir la misma dos veces seguidas. Sale de la
// semilla (el día y el local), así el mismo turno es siempre el mismo.
function azarDe(semilla) { let s = (semilla >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
const claveNumerica = (txt) => { let h = 2166136261; for (let i = 0; i < txt.length; i++) h = Math.imul(h ^ txt.charCodeAt(i), 16777619); return h >>> 0; };
export function secuenciaDelTurno(k, dia, total = EMPLEO.tareasPorTurno) {
  if (!hayPuesto(k)) return [];
  const ids = PUESTOS[k].tareas.map((t) => t.id), azar = azarDe(claveNumerica(`${k}|${dia1(dia)}`) ^ 0x9e3779b9), seq = [];
  while (seq.length < total) {
    const tanda = ids.slice();
    for (let i = tanda.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [tanda[i], tanda[j]] = [tanda[j], tanda[i]]; }
    if (seq.length && tanda[0] === seq[seq.length - 1]) tanda.push(tanda.shift());
    seq.push(...tanda);
  }
  return seq.slice(0, total);
}
export const tareaDe = (k, id) => (hayPuesto(k) ? PUESTOS[k].tareas.find((t) => t.id === id) || null : null);
export const turnoActivo = (p) => leer(p)?.turno || null;
export function tareaActual(p) {
  const t = turnoActivo(p);
  return t && t.hechas < t.total ? tareaDe(t.local, t.seq[t.hechas]) : null;
}
// Cuántas tareas entran si fichás a la `hora`: las que caben hasta el cierre (con el cuarto de hora que se deja de gracia)
export function tareasPosibles(k, hora) {
  if (!hayPuesto(k)) return 0;
  const P = PUESTOS[k], desde = Math.max(Number(hora) || 0, P.desde);
  return Math.max(0, Math.min(EMPLEO.tareasPorTurno, Math.floor((P.hasta + 0.25 - desde) / EMPLEO.horasPorTareaEstimada + 1e-9)));
}
// Lo que cobrás hoy por lo hecho (para el cartel del turno): proporcional a las tareas, redondeado
export const sueldoAcumulado = (t) => (t ? redondear(t.sueldo * Math.min(1, t.hechas / t.total)) : 0);

// ---------------------------------------------------------------- fichar
export const turnosDelDia = (p, dia) => { const h = leer(p)?.hoy; return h && h.dia === dia1(dia) ? entero(h.turnos, 9) : 0; };
// ¿Podés fichar ahora en `k`?: { ok, sueldo, escalon, cargo, desde, hasta, posibles } o { ok: false, motivo }
//   motivo: 'nada' (no hay economía o puesto), 'activo' (ya estás en un turno), 'domingo', 'hoy' (ya hiciste el turno de hoy), 'temprano', 'tarde'
export function puedeFichar(p, k, dia, hora) {
  if (!hayEconomia(p) || !hayPuesto(k)) return { ok: false, motivo: 'nada' };
  const P = PUESTOS[k];
  if (turnoActivo(p)) return { ok: false, motivo: 'activo' };
  if (p?.negociosVecinos?.comprados && Object.hasOwn(p.negociosVecinos.comprados, k)) return { ok: false, motivo: 'tuyo' };   // 4.4: si le compraste el local al vecino, ya no tomás turnos ahí
  if (esDiaLibre(dia)) return { ok: false, motivo: 'domingo' };
  if (turnosDelDia(p, dia) >= EMPLEO.turnosPorDia) return { ok: false, motivo: 'hoy' };
  const h = ((Number(hora) || 0) % 24 + 24) % 24;
  if (h < P.desde - EMPLEO.adelanto) return { ok: false, motivo: 'temprano', desde: P.desde };
  if (h > P.hasta - EMPLEO.horasMinimas) return { ok: false, motivo: 'tarde', desde: P.desde, hasta: P.hasta };
  const esc = escalonDe(p, k);
  return { ok: true, sueldo: P.sueldos[esc], escalon: esc, cargo: P.cargos[esc], desde: P.desde, hasta: P.hasta, posibles: tareasPosibles(k, h) };
}
// Ficha: arma el turno. Devuelve { ok, turno } o { ok: false, motivo }
export function fichar(p, k, dia, hora) {
  const v = puedeFichar(p, k, dia, hora);
  if (!v.ok) return v;
  const e = empleoDe(p), P = PUESTOS[k], d = dia1(dia);
  e.turno = { local: k, dia: d, desde: P.desde, hasta: P.hasta, escalon: v.escalon, sueldo: v.sueldo, total: EMPLEO.tareasPorTurno, hechas: 0, fichado: ((Number(hora) || 0) % 24 + 24) % 24, seq: secuenciaDelTurno(k, d) };
  e.hoy = e.hoy.dia === d ? e.hoy : { dia: d, turnos: 0 };
  e.hoy.turnos++;
  return { ok: true, turno: e.turno };
}
// Una tarea hecha: { ok, hechas, terminado, tarea } (si ya no queda ninguna, terminado)
export function hacerTarea(p) {
  const e = empleoDe(p), t = e?.turno;
  if (!t || t.hechas >= t.total) return { ok: false, motivo: 'nada' };
  const tarea = tareaDe(t.local, t.seq[t.hechas]);
  t.hechas++;
  return { ok: true, hechas: t.hechas, terminado: t.hechas >= t.total, tarea };
}

// ---------------------------------------------------------------- cobrar y cerrar
// Lo que se paga por un turno con `hechas` tareas: proporcional, y si te fuiste antes, con la multa. { monto, multa, proporcion }
export function pagoDelTurno(t, abandono = false) {
  if (!t || !(t.hechas > 0)) return { monto: 0, multa: 0, proporcion: 0 };
  const proporcion = Math.min(1, t.hechas / t.total), bruto = redondear(t.sueldo * proporcion);
  const multa = abandono && proporcion < 1 ? Math.min(bruto, redondear(bruto * EMPLEO.multa)) : 0;
  return { monto: bruto - multa, multa, proporcion };
}
// Cierra el turno en curso: cobra, suma el día si lo cumpliste, anota el historial y mira si ascendés.
//   motivo: 'completo' (hiciste todas), 'tiempo' (se pasó la hora de cierre), 'dia' (pasó el día: dormiste) o 'abandono' (te fuiste)
// Devuelve { ok, monto, multa, hechas, total, cumplido, motivo, ascendio: null | { escalon, nombre, cargo, sueldo }, local }
export function cerrarTurno(p, motivo = 'completo', nombre = '') {
  const e = empleoDe(p), t = e?.turno;
  if (!t) return { ok: false, motivo: 'nada' };
  const P = PUESTOS[t.local], abandono = motivo === 'abandono', pago = pagoDelTurno(t, abandono);
  const cumplido = !abandono && t.hechas >= Math.ceil(t.total * EMPLEO.cumplido);
  const l = localDe(e, t.local), antes = escalonDe(p, t.local);
  let ascendio = null;
  if (pago.monto > 0) cobrar(p, pago.monto, `Sueldo: ${P.cargos[t.escalon]}, ${P.nombre}`, P.jefe);
  l.cobrado = Math.min(1e9, l.cobrado + pago.monto);
  e.total.cobrado = Math.min(1e10, e.total.cobrado + pago.monto);
  if (t.hechas === 0) e.hoy.turnos = Math.max(0, e.hoy.turnos - 1);   // fichaste y no hiciste nada: el día queda libre
  else e.total.turnos++;
  if (abandono && t.hechas > 0) { l.faltas++; e.total.abandonos++; }
  if (cumplido) { l.dias++; l.ultimo = t.dia; }
  const despues = escalonDe(p, t.local);
  if (despues > antes) { l.escalon = despues; ascendio = { escalon: despues, nombre: ESCALONES[despues].nombre, cargo: P.cargos[despues], sueldo: P.sueldos[despues] }; }
  if (t.hechas > 0) e.historial = [...e.historial, { dia: t.dia, local: t.local, escalon: t.escalon, hechas: t.hechas, total: t.total, monto: pago.monto, motivo }].slice(-EMPLEO.historialMax);
  e.turno = null;
  return { ok: true, local: t.local, monto: pago.monto, multa: pago.multa, hechas: t.hechas, total: t.total, cumplido, motivo, ascendio };
}
// ¿Hay que cerrar el turno de solo?: 'dia' (ya es otro día), 'tiempo' (pasó la hora de cierre y la gracia) o null. `reloj`: con la hora de tu
// reloj (que corre de verdad) el turno no se cierra por la hora, sólo por el día.
export function motivoDeCierre(p, dia, hora, reloj = false) {
  const t = turnoActivo(p);
  if (!t) return null;
  if (dia1(dia) !== t.dia) return 'dia';
  if (!reloj && (((Number(hora) || 0) % 24 + 24) % 24) > t.hasta + EMPLEO.gracia) return 'tiempo';
  return null;
}

// ---------------------------------------------------------------- textos
// «el almacén» → «del almacén» / «al almacén»; «la casa de té» → «de la casa de té» / «a la casa de té»
export const deNombre = (nombre) => (nombre.startsWith('el ') ? `del ${nombre.slice(3)}` : `de ${nombre}`);
export const aNombre = (nombre) => (nombre.startsWith('el ') ? `al ${nombre.slice(3)}` : `a ${nombre}`);
const motivoTexto = { domingo: 'Hoy es domingo: no se trabaja.', hoy: 'Ya hiciste tu turno de hoy.', activo: 'Ya estás en un turno.', tuyo: 'Este local ahora es tuyo: ya no se toman turnos acá.' };
// El cartel del puesto: «Ayudante de mostrador · turno de 16 a 20 · $1.600»
export const textoPuesto = (k, escalon) => `${cargoDe(k, escalon)} · turno de ${horaCorta(PUESTOS[k].desde)} a ${horaCorta(PUESTOS[k].hasta)} · ${formatoPesos(sueldoDe(k, escalon))}`;
// Lo que pregunta el cartel para tomar el puesto
export function textoOferta(k, escalon, posibles = EMPLEO.tareasPorTurno) {
  const P = PUESTOS[k], parcial = posibles < EMPLEO.tareasPorTurno ? ` Llegás con el turno empezado: entran ${posibles} tareas de ${EMPLEO.tareasPorTurno}, y cobrás por las que hagas.` : '';
  return `¿Querés trabajar acá? ${cargoDe(k, escalon)} en ${P.nombre}: turno de ${horaCorta(P.desde)} a ${horaCorta(P.hasta)}, ${formatoPesos(sueldoDe(k, escalon))}. ${P.jefe} te dice qué hacer; las tareas se hacen con E y se cobra al terminar.${parcial}`;
}
// El aviso de la E junto al cartel cuando no podés fichar: por qué
export function textoNoPodes(v, k) {
  const P = PUESTOS[k];
  if (!v || v.ok) return '';
  if (v.motivo === 'temprano') return `Se ficha desde las ${horaCorta(P.desde - EMPLEO.adelanto)}: el turno es de ${horaCorta(P.desde)} a ${horaCorta(P.hasta)}.`;
  if (v.motivo === 'tarde') return `Se terminó la hora de fichar (el turno es de ${horaCorta(P.desde)} a ${horaCorta(P.hasta)}). Volvé mañana.`;
  return motivoTexto[v.motivo] || '';
}
// El pie del aviso al terminar: «Cobraste $1.600 · 3 de 5 días para Empleado»
export function textoCierre(r, p) {
  if (!r?.ok) return '';
  const f = faltaParaAscender(p, r.local), partes = [];
  if (r.monto > 0) partes.push(`Cobraste ${formatoPesos(r.monto)}${r.multa > 0 ? ` (menos ${formatoPesos(r.multa)} por irte antes)` : ''}`);
  else partes.push('No cobraste nada: no hiciste ninguna tarea');
  if (r.motivo !== 'abandono' && r.hechas < r.total) partes.push(`${r.hechas} de ${r.total} tareas`);
  if (!r.ascendio && f.hay && r.cumplido) {
    const l = leer(p)?.locales?.[r.local] || localNuevo(), falta = [];
    if (f.dias > 0) falta.push(`${l.dias} de ${ESCALONES[f.escalon].dias} días`);
    if (f.oficio > 0) falta.push(`${f.oficioNombre} nivel ${f.nivelOficio}`);
    if (falta.length) partes.push(`Para ${f.nombre}: ${falta.join(' y ')}`);
  }
  return partes.join(' · ');
}

// ---------------------------------------------------------------- el cuaderno
// Lo que muestra el cuaderno: el historial laboral por local y los últimos turnos
export function resumenEmpleo(p) {
  const e = leer(p);
  if (!e) return { hay: hayEconomia(p), locales: IDS_PUESTOS.map((k) => ({ local: k, nombre: PUESTOS[k].completo, jefe: PUESTOS[k].jefe, turno: `${horaCorta(PUESTOS[k].desde)} a ${horaCorta(PUESTOS[k].hasta)}`, dias: 0, faltas: 0, cobrado: 0, trabajo: false, escalon: 0, escalonNombre: ESCALONES[0].nombre, cargo: PUESTOS[k].cargos[0], sueldo: PUESTOS[k].sueldos[0], falta: faltaParaAscender(p, k) })), total: { turnos: 0, cobrado: 0, abandonos: 0 }, historial: [], turno: null };
  const locales = IDS_PUESTOS.map((k) => {
    const l = e.locales[k] || localNuevo(), esc = escalonDe(p, k), f = faltaParaAscender(p, k);
    return { local: k, nombre: PUESTOS[k].completo, jefe: PUESTOS[k].jefe, turno: `${horaCorta(PUESTOS[k].desde)} a ${horaCorta(PUESTOS[k].hasta)}`, dias: l.dias, faltas: l.faltas, cobrado: l.cobrado, trabajo: l.dias > 0 || l.cobrado > 0 || esc > 0, escalon: esc, escalonNombre: ESCALONES[esc].nombre, cargo: PUESTOS[k].cargos[esc], sueldo: PUESTOS[k].sueldos[esc], falta: f };
  });
  return { hay: true, locales, total: { ...e.total }, historial: e.historial.slice(-8).reverse(), turno: e.turno ? { ...e.turno } : null };
}

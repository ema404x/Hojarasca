// 2.3: el Desafío con semilla. El valle ya sale siempre igual (el terreno tiene semilla
// fija desde la RC1); lo que cambiaba de una partida a otra eran las noches. Con un
// código —COIHUE-4821— cada decisión de azar de la noche (qué especial, dónde baja la
// nave, si atacan a un vecino, dónde crecen los capullos, qué cae de la caja) sale de
// ese código, de la noche y del tema, así que dos partidas con el mismo código tienen
// las mismas noches aunque se jueguen distinto. Cada semana hay un código nuevo,
// sacado de la fecha. Puro, sin THREE.
export const PALABRAS = [
  'COIHUE', 'LENGA', 'NIRE', 'PEHUEN', 'CIPRES', 'ARRAYAN', 'MAITEN', 'CALAFATE',
  'AMANCAY', 'NOTRO', 'CHILCO', 'MUTISIA', 'HUEMUL', 'PUDU', 'CHUCAO', 'CONDOR',
  'CAUQUEN', 'MARTIN', 'COIPO', 'ZORRO', 'TRUCHA', 'LAGO', 'ARROYO', 'CERRO',
  'MALLIN', 'ESTEPA', 'TROCHITA', 'PUESTO', 'FOGON', 'NEVADO', 'VIENTO', 'LLOVIZNA',
];

// FNV-1a de 32 bits: el mismo texto da siempre el mismo número, en cualquier máquina.
export function hashTexto(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}
// mulberry32, el mismo generador que usa el terreno
export function generador(n) {
  let a = n >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Normaliza lo que escribió la persona: mayúsculas, sin acentos ni espacios, PALABRA-NNNN.
// Devuelve null si no se parece a un código.
export function normalizarCodigo(texto) {
  if (typeof texto !== 'string') return null;
  const s = texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const m = /^([A-Z]{3,12})-?(\d{1,6})$/.exec(s);
  return m ? `${m[1]}-${m[2]}` : null;
}
// Un código al azar, para el que quiere compartir su partida.
export function codigoAlAzar(azar = Math.random) {
  return `${PALABRAS[Math.floor(azar() * PALABRAS.length)]}-${String(1000 + Math.floor(azar() * 9000))}`;
}
// La semana ISO de una fecha (año, número de semana).
export function semanaIso(fecha = new Date()) {
  const d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
  const dia = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dia);
  const inicio = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return { anio: d.getUTCFullYear(), semana: Math.ceil(((d - inicio) / 86400000 + 1) / 7) };
}
// El código de la semana: igual para todos los que jueguen esa semana.
export function codigoDeLaSemana(fecha = new Date()) {
  const { anio, semana } = semanaIso(fecha);
  const r = generador(hashTexto(`hojarasca-semana-${anio}-${semana}`));
  return codigoAlAzar(r);
}

// El azar de una decisión: `azarDe('COIHUE-4821', 7, 'rescate')`. Si no hay código,
// devuelve Math.random: la partida sin código sigue igual que siempre.
export function azarDe(codigo, ...claves) {
  if (!codigo) return Math.random;
  return generador(hashTexto(`${codigo}|${claves.join('|')}`));
}

// Récords por código, en el navegador (como los logros): { 'COIHUE-4821': { noches, abatidos, fecha } }
export function sanearRecordsSemilla(v) {
  const x = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  const s = {};
  for (const [k, r] of Object.entries(x).slice(-60)) {
    const c = normalizarCodigo(k);
    if (!c || !r || typeof r !== 'object') continue;
    s[c] = { noches: Math.max(0, Math.floor(Number(r.noches) || 0)), abatidos: Math.max(0, Math.floor(Number(r.abatidos) || 0)), fecha: String(r.fecha || '').slice(0, 10) };
  }
  return s;
}
// ¿Mejoró el récord de este código? Devuelve el récord nuevo (o el mismo).
export function registrarSemilla(records, codigo, { noches = 0, abatidos = 0, fecha = '' } = {}) {
  if (!codigo) return null;
  const antes = records[codigo] || { noches: 0, abatidos: 0, fecha: '' };
  const mejor = noches > antes.noches || (noches === antes.noches && abatidos > antes.abatidos);
  if (mejor) records[codigo] = { noches, abatidos, fecha };
  return { ...records[codigo] || antes, mejoro: mejor };
}

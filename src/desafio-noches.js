// 4.8 noches: noches distintas en «La noche de los duendes» (módulo puro: sin THREE ni DOM; se prueba en Node).
//   1. Dos noches especiales nuevas: la niebla y la luna llena (se suman a roja, eclipse, silenciosa y apagón).
//   2. Los giros: a eso de las dos de la mañana pasa algo que cambia la noche (baja la niebla, llegan
//      refuerzos, se quiebra una defensa).
//   3. Las noches que se encadenan: lo que pasó una noche cambia la siguiente (un duende que escapó con lo
//      robado vuelve con compañía, una defensa sin arreglar es por donde entran, ganar sin un rasguño trae
//      una noche más grande, los que huyeron con la luz vuelven más grandes).
// No importa nada de desafio-reglas.js (reglas lo importa a él): lo que necesita de afuera entra por parámetro.

// ---------------------------------------------------------------- 1. las noches nuevas
// La niebla: se ve a pocos metros (`vista` acorta el alcance de los tiradores, lo mismo que la lluvia en
// `efectoClima`), se los oye de más lejos (`oido` agranda el radio de los ruidos del acecho), el perro gruñe de más
// lejos (`perro`) y la visibilidad del jugador queda en `visibilidad` metros (la usa el ambiente para la bruma).
export const NIEBLA = {
  nombre: 'Noche de niebla', aviso: 'La niebla baja del monte: esta noche los vas a oír antes de verlos',
  cantidad: 1.15, vista: 0.5, oido: 1.45, perro: 1.6, visibilidad: 26,
};
// La luna llena: vienen sobre todo los viejos oscuros (más duros, pocos y grandes) y hay más luz.
//   porcionViejos: la parte de los que vienen de viejos (en una noche grande común es 0,6);
//   brutos: la parte de la noche que es de grandotes (los traviesos de adelante se vuelven brutos);
//   vidaViejos: cuánto más aguanta un viejo; luz: cuánta luz de luna se suma (0 a 1, para el ambiente).
export const LUNALLENA = {
  nombre: 'Luna llena', aviso: 'Sale la luna llena y los viejos oscuros bajan del monte',
  cantidad: 0.85, porcionViejos: 0.92, brutos: 0.3, vidaViejos: 1.2, luz: 0.6,
};
// Las franjas del azar de `nocheEspecial`: de 0 a 0,38 son las de siempre (roja, eclipse, silenciosa y apagón: no se
// tocan); arriba van las nuevas. Sobre 0,49 la noche es común.
export const ESPECIAL_BASE = 0.38;
export const ESPECIAL_TOTAL = 0.49;
export const FRANJAS_NUEVAS = [{ id: 'niebla', hasta: 0.435 }, { id: 'lunallena', hasta: ESPECIAL_TOTAL }];
// Qué noche nueva toca con este azar (ya sabiendo que es especial y que cae arriba de las de siempre).
export function especialNueva(azar) {
  const a = Number(azar);
  if (!(a > ESPECIAL_BASE) || a > ESPECIAL_TOTAL) return null;
  for (const f of FRANJAS_NUEVAS) if (a <= f.hasta) return f.id;
  return null;
}
// La luna llena trae más grandotes: se vuelven brutos algunos de los traviesos hasta llegar a esa parte de la noche
// (nunca más de 7). Cambia la lista en el lugar y la devuelve.
export function conMasBrutos(lista, parte) {
  const tope = Math.min(7, Math.round(lista.length * (Number(parte) || 0)));
  let hay = 0;
  for (const t of lista) if (t === 'bruto') hay++;
  for (let i = 0; i < lista.length && hay < tope; i++) {
    if (lista[i] === 'rastreador' || lista[i] === 'saltador') { lista[i] = 'bruto'; hay++; }
  }
  return lista;
}

// ---------------------------------------------------------------- 2. los giros a mitad de noche
export const HORA_GIRO = 2.0;   // las dos de la mañana del reloj del juego (se puede cambiar acá)
export const GIRO = { desde: 2, probTemprana: 0.2, prob: 0.4 };   // no en la primera; la 2 menos seguido
export const GIROS = {
  niebla: {
    nombre: 'Baja la niebla', aviso: 'Baja la niebla del monte',
    texto: 'La niebla se cierra sobre el valle: ya no se los ve, sólo se los oye', peso: 3, desde: 2,
    noCon: ['niebla', 'apagon'],
  },
  refuerzos: {
    nombre: 'Llegan refuerzos', aviso: 'Más duendes bajan del monte',
    texto: 'Se oyen cuernos en el monte: viene gente fresca a terminar lo que dejaron a medias', peso: 3, desde: 3,
    noCon: [],
  },
  defensa: {
    nombre: 'Se quiebra una defensa', aviso: 'Algo cruje en la base',
    texto: 'La madera se venció sola: una de tus defensas quedó a punto de caer', peso: 2, desde: 3,
    noCon: [], requiere: 'defensas',
  },
};
// ¿Pasa algo a mitad de esta noche y qué? Devuelve el id del giro o null. `azar` de 0 a 1 (una sola tirada: la
// primera parte dice si pasa y el resto elige cuál).
//   noche: el número de la noche; especial: la noche especial (o null); jefe/final/rescate/varada: noches que ya
//   traen lo suyo (nunca se suma un giro a un jefe, a la final ni a un rescate); anterior: el giro de la noche
//   anterior (no se repite seguido); hayDefensas: hay una defensa que se pueda quebrar; yaHuboRefuerzo: ya llegaron
//   refuerzos esta noche (los de las 1:30 de siempre).
export function elegirGiro({ noche = 1, especial = null, jefe = false, final = false, rescate = false, varada = false,
  anterior = null, hayDefensas = false, yaHuboRefuerzo = false, azar = 0.5 } = {}) {
  const n = Math.floor(Number(noche) || 1);
  if (n < GIRO.desde || jefe || final || rescate || varada) return null;
  const prob = n < 4 ? GIRO.probTemprana : GIRO.prob;
  const a = Number(azar);
  if (!Number.isFinite(a) || a < 0 || a >= prob) return null;
  const posibles = Object.keys(GIROS).filter((id) => {
    const g = GIROS[id];
    if (n < g.desde || id === anterior) return false;
    if (especial && g.noCon.includes(especial)) return false;
    if (g.requiere === 'defensas' && !hayDefensas) return false;
    if (id === 'refuerzos' && yaHuboRefuerzo) return false;
    return true;
  });
  if (!posibles.length) return null;
  let total = 0;
  for (const id of posibles) total += GIROS[id].peso;
  let x = (a / prob) * total;
  for (const id of posibles) { x -= GIROS[id].peso; if (x < 0) return id; }
  return posibles[posibles.length - 1];
}
// ¿Hay niebla en la noche en curso? La de la noche especial o la que bajó a las dos (`giro`: { id, noche }).
export function hayNiebla(especial, giro, noche) {
  return especial === 'niebla' || (!!giro && giro.id === 'niebla' && giro.noche === noche);
}
export function sanearGiro(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v) || typeof v.id !== 'string' || !Object.hasOwn(GIROS, v.id)) return null;
  const n = Number(v.noche);
  return Number.isFinite(n) && v.noche !== null && v.noche !== '' && typeof v.noche !== 'boolean' ? { id: v.id, noche: Math.max(0, Math.min(1e6, Math.floor(n))) } : null;
}

// ---------------------------------------------------------------- 3. las noches que se encadenan
// `cadena` va en la partida. Describe lo que le toca a UNA noche (`paraNoche`, el número de la noche) y lo que
// está pasando hoy (`hoy`):
//   escapo { cosa, n }  los que se escaparon con lo robado anoche: vuelven con compañía
//   perfecta            anoche no te rompieron nada ni te hirieron: esta noche viene más grande
//   vueltos             los que seguían vivos con la primera luz: vuelven, de grandotes
//   brecha { x, z, nombre, noche }  una defensa que quedó sin arreglar: por ahí entran
// Si la noche que arranca no es `paraNoche` (se salteó una, o se cayó), no cuenta nada.
export const CADENA = {
  companiasPorEscape: 2, companiasMax: 4, parteGrande: 0.25, vueltosMax: 3, danoPerfecta: 0.25,
  brechaBajo: 0.5, tope: 24,
};
export function cadenaNueva() {
  return { paraNoche: 0, escapo: null, perfecta: false, vueltos: 0, brecha: null, hoy: { noche: 0, escapados: 0, cosa: null } };
}
const COSAS = ['cristal', 'ramita', 'tabla', 'piedra'];
const CON_LA_COSA = { cristal: 'tu semilla dorada', ramita: 'tu ramita', tabla: 'tu leña', piedra: 'tu piedra' };
const fin = (v) => v !== null && v !== '' && typeof v !== 'boolean' && Number.isFinite(Number(v));
const entero = (v, max) => Math.max(0, Math.min(max, Math.floor(fin(v) ? Number(v) : 0)));
export function sanearCadena(v) {
  const x = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  const base = cadenaNueva();
  const hoy = x.hoy && typeof x.hoy === 'object' ? x.hoy : {};
  const e = x.escapo && typeof x.escapo === 'object' ? x.escapo : null;
  const b = x.brecha && typeof x.brecha === 'object' ? x.brecha : null;
  return {
    ...base,
    paraNoche: entero(x.paraNoche, 1e6),
    escapo: e && COSAS.includes(e.cosa) && entero(e.n, 9) > 0 ? { cosa: e.cosa, n: entero(e.n, 9) } : null,
    perfecta: x.perfecta === true,
    vueltos: entero(x.vueltos, CADENA.vueltosMax),
    brecha: b && fin(b.x) && fin(b.z) && Math.abs(Number(b.x)) < 1e5 && Math.abs(Number(b.z)) < 1e5 && fin(b.noche)
      ? { x: Number(b.x), z: Number(b.z), nombre: typeof b.nombre === 'string' ? b.nombre.slice(0, 40) : 'una defensa', noche: entero(b.noche, 1e6) } : null,
    hoy: { noche: entero(hoy.noche, 1e6), escapados: entero(hoy.escapados, 99), cosa: COSAS.includes(hoy.cosa) ? hoy.cosa : null },
  };
}
// Un duende se escapó con `cosa` (la soltó porque se cansó de correr y no lo alcanzaron).
export function anotarEscape(cadena, noche, cosa) {
  const h = cadena.hoy;
  if (h.noche !== noche) { h.noche = noche; h.escapados = 0; h.cosa = null; }
  h.escapados = Math.min(99, h.escapados + 1);
  if (COSAS.includes(cosa)) h.cosa = cosa;
  return cadena;
}
// Al amanecer de una noche aguantada: qué le toca a la que sigue. `res`: perdidas (obras caídas), dano (lo que te
// hirieron), saludMax, vivos (los que seguían en pie con la primera luz).
export function cerrarNoche(cadena, noche, { perdidas = 0, dano = 0, saludMax = 100, vivos = 0 } = {}) {
  const h = cadena.hoy;
  const escapados = h.noche === noche ? h.escapados : 0;
  const cosa = h.noche === noche ? h.cosa : null;
  cadena.paraNoche = noche + 1;
  cadena.escapo = escapados > 0 && cosa ? { cosa, n: Math.min(9, escapados) } : null;
  cadena.perfecta = perdidas === 0 && dano < saludMax * CADENA.danoPerfecta;
  cadena.vueltos = Math.min(CADENA.vueltosMax, Math.max(0, Math.floor(vivos)));
  cadena.hoy = { noche: 0, escapados: 0, cosa: null };
  return cadena;
}
// Caíste: la noche se repite como si no hubiera pasado nada de esto.
export function olvidarCadena(cadena) {
  cadena.paraNoche = 0; cadena.escapo = null; cadena.perfecta = false; cadena.vueltos = 0; cadena.brecha = null;
  cadena.hoy = { noche: 0, escapados: 0, cosa: null };
  return cadena;
}
// La defensa más maltrecha (vida de 0 a 1) de las que hay, si quedó por debajo de la mitad. `defensas`: [{ x, z, nombre, ratio }].
export function elegirBrecha(defensas, paraNoche) {
  let peor = null;
  for (const d of defensas || []) {
    if (!d || !fin(d.x) || !fin(d.z) || !fin(d.ratio)) continue;
    if (d.ratio < CADENA.brechaBajo && (!peor || d.ratio < peor.ratio)) peor = d;
  }
  return peor ? { x: Number(peor.x), z: Number(peor.z), nombre: String(peor.nombre || 'una defensa').slice(0, 40), noche: paraNoche } : null;
}
// Lo que le toca a la noche `n` (null si nada). Sólo lee.
export function efectoCadena(cadena, n) {
  if (!cadena) return null;
  const toca = cadena.paraNoche === n;
  const brecha = cadena.brecha && cadena.brecha.noche === n ? cadena.brecha : null;
  const escapo = toca ? cadena.escapo : null, perfecta = toca && cadena.perfecta, vueltos = toca ? cadena.vueltos : 0;
  if (!escapo && !perfecta && !vueltos && !brecha) return null;
  const textos = [];
  if (escapo) textos.push(escapo.n > 1 ? 'Los que se escaparon con tus cosas volvieron con compañía.' : `El que se escapó con ${CON_LA_COSA[escapo.cosa]} volvió con compañía.`);
  if (vueltos) textos.push(vueltos > 1 ? 'Los que se fueron con la primera luz volvieron más grandes.' : 'El que se fue con la primera luz volvió más grande.');
  if (perfecta) textos.push('Anoche no pudieron con vos: esta noche bajan en más cantidad.');
  if (brecha) textos.push(`Dejaste ${brecha.nombre} sin arreglar: esta noche entran por ahí.`);
  return { companias: escapo ? Math.min(CADENA.companiasMax, escapo.n * CADENA.companiasPorEscape) : 0, grande: perfecta, vueltos, brecha, textos };
}
// La lista de tipos de la noche con lo que trae la cadena. El jefe sigue siendo uno solo y va último; nunca pasa de
// `tope`. La lista de entrada no se toca.
export function aplicarCadena(lista, efecto, tope = CADENA.tope) {
  if (!efecto) return lista;
  const conJefe = lista.includes('jefe');
  const base = conJefe ? lista.filter((t) => t !== 'jefe') : lista.slice();
  const extra = [];
  for (let i = 0; i < efecto.vueltos; i++) extra.push('bruto');
  for (let i = 0; i < efecto.companias; i++) extra.push('rastreador');
  if (efecto.grande && base.length) for (let i = 0; i < Math.ceil(base.length * CADENA.parteGrande); i++) extra.push(base[i % base.length]);
  const sitio = Math.max(1, tope - (conJefe ? 1 : 0));
  const salida = base.slice(0, Math.max(0, sitio - extra.length)).concat(extra).slice(0, sitio);
  if (conJefe) salida.push('jefe');
  return salida;
}

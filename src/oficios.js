// 3.1: rangos y oficios. Lo que hacés seguido, lo hacés mejor: talar y aserrar te hace
// hachero, pescar te hace pescador, abatir invasores y seguir rastros te hace cazador,
// levantar obras te hace constructor, la huerta te hace huertero y el remo, navegante.
//
// Cada oficio tiene cinco niveles. Cada nivel da una mano chica pero de verdad (un
// hachazo menos, un pique más rápido, un poco de material que sobra en la obra…),
// siempre modesta: el valle no se vuelve fácil, se vuelve tuyo.
//
// La experiencia sale de acciones reales (las cuenta main.js). Una partida vieja arranca
// en cero, pero se le acredita una vez lo que ya hizo (árboles talados, peces, obras…),
// con un tope: nadie arranca de maestro.
//
// Módulo puro (se prueba en Node): sin three ni DOM.

// Experiencia acumulada que hace falta para llegar a cada nivel (el 0 es no tener oficio).
export const UMBRALES = [0, 40, 120, 260, 480, 800];
export const NIVEL_MAX = UMBRALES.length - 1;

// Cuánta experiencia da cada cosa.
export const XP = {
  tala: 12,        // un árbol talado
  mata: 4,         // un tronco caído o un pedrero
  aserrar: 1,      // un tronco aserrado
  pez: 10,         // un pez sacado
  abatido: 4,      // un invasor abatido (Desafío)
  jefe: 20,        // el jefe del nido
  rastro: 8,       // unas huellas leídas
  rastreo: 12,     // un animal encontrado con el perro
  etapa: 4,        // cada etapa de obra, más un tercio de lo que costó
  siembra: 2,
  cosecha: 6,
  remo: 1,         // cada `METROS_REMO` metros remados o navegados
};
export const METROS_REMO = 25;

export const OFICIOS = {
  hachero: {
    nombre: 'Hachero', de: 'Talar, hacer troncos y aserrar',
    titulos: ['Aprendiz de hachero', 'Hachero', 'Hachero de monte', 'Hachero baqueano', 'Maestro hachero'],
    habilidades: [
      'Al talar sale un tronco más',
      'Aserrando a mano sale una tabla más por tronco',
      'Los árboles caen con un hachazo menos',
      'Los troncos caídos y los pedreros rinden uno más',
      'Al talar salen dos troncos más',
    ],
  },
  pescador: {
    nombre: 'Pescador', de: 'Sacar peces con la caña',
    titulos: ['Aprendiz de pescador', 'Pescador', 'Pescador de orilla', 'Pescador baqueano', 'Maestro pescador'],
    habilidades: [
      'Los peces pican un poco antes',
      'Tenés más tiempo para clavar cuando pica',
      'Los peces pican antes todavía',
      'La línea aguanta un poco más el tirón',
      'Los peces pican mucho antes',
    ],
  },
  cazador: {
    nombre: 'Cazador', de: 'Abatir invasores en el Desafío y leer rastros',
    titulos: ['Aprendiz de rastreador', 'Rastreador', 'Cazador', 'Cazador baqueano', 'Maestro cazador'],
    habilidades: [
      'Pulso firme: el arco se tensa un poco más rápido',
      'Ojo de baqueano: las huellas se leen desde más lejos',
      'Pulso más firme: el arco se tensa más rápido todavía',
      'Los rastros aparecen más seguido',
      'Pulso de cazador: el arco se tensa mucho más rápido',
    ],
  },
  // el id no es `constructor`: todo objeto hereda uno, y una búsqueda descuidada lo encontraría
  obrero: {
    nombre: 'Constructor', de: 'Levantar obras por etapas',
    titulos: ['Aprendiz de constructor', 'Constructor', 'Constructor de oficio', 'Constructor baqueano', 'Maestro constructor'],
    habilidades: [
      'En cada obra sobra un 5% del material',
      'Sobra un 10% del material',
      'Sobra un 15% del material',
      'Sobra un 20% del material',
      'Sobra un 25% del material',
    ],
  },
  huertero: {
    nombre: 'Huertero', de: 'Sembrar y cosechar en tus canteros',
    titulos: ['Aprendiz de huertero', 'Huertero', 'Huertero de oficio', 'Huertero baqueano', 'Maestro huertero'],
    habilidades: [
      'Las cosechas rinden un poco más',
      'Las cosechas rinden más',
      'Las cosechas rinden bastante más',
      'Las cosechas rinden mucho más',
      'Las cosechas rinden como nunca',
    ],
  },
  navegante: {
    nombre: 'Navegante', de: 'Remar en el kayak y navegar en el velero',
    titulos: ['Aprendiz de remero', 'Remero', 'Navegante', 'Navegante baqueano', 'Maestro navegante'],
    habilidades: [
      'Remás un 4% más fuerte',
      'Remás un 8% más fuerte',
      'Remás un 12% más fuerte',
      'Remás un 16% más fuerte',
      'Remás un 20% más fuerte',
    ],
  },
};
export const ORDEN_OFICIOS = ['hachero', 'pescador', 'cazador', 'obrero', 'huertero', 'navegante'];
export const esOficio = (id) => typeof id === 'string' && Object.hasOwn(OFICIOS, id);

const entero = (v) => Math.max(0, Math.floor(Number.isFinite(Number(v)) ? Number(v) : 0));
const fraccion = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.min(50, n) : 0; };
const TOPE_XP = 99999;

// Una partida nueva: nada que acreditar (no hay nada hecho todavía).
export function oficiosNuevos() {
  return { version: 1, xp: {}, resto: { obra: {}, cosecha: 0 }, metros: 0, acreditado: true };
}
// Una partida vieja no lo trae: sale sin acreditar, y main.js le acredita lo hecho una vez.
export function sanearOficios(v) {
  const x = v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  if (!x) return { ...oficiosNuevos(), acreditado: false };
  const xp = {};
  const crudo = x.xp && typeof x.xp === 'object' ? x.xp : {};
  for (const id of ORDEN_OFICIOS) {
    const n = Object.hasOwn(crudo, id) ? Math.min(TOPE_XP, entero(crudo[id])) : 0;
    if (n > 0) xp[id] = n;
  }
  const obra = {};
  const ro = x.resto?.obra && typeof x.resto.obra === 'object' ? x.resto.obra : {};
  for (const k of ['tronco', 'tabla', 'piedra', 'lana', 'cristal']) if (Object.hasOwn(ro, k) && fraccion(ro[k]) > 0) obra[k] = Math.min(0.999, fraccion(ro[k]));
  return {
    version: 1, xp,
    resto: { obra, cosecha: Math.min(0.999, fraccion(x.resto?.cosecha)) },
    metros: Math.min(METROS_REMO, fraccion(x.metros)),
    acreditado: x.acreditado === true,
  };
}

export function nivelDe(xp) {
  const n = entero(xp);
  let nivel = 0;
  for (let i = 1; i < UMBRALES.length; i++) if (n >= UMBRALES[i]) nivel = i;
  return nivel;
}
export const xpDe = (of, id) => (of?.xp && Object.hasOwn(of.xp, id) ? entero(of.xp[id]) : 0);
export const nivelOficio = (of, id) => nivelDe(xpDe(of, id));
export const tituloDe = (id, nivel) => (esOficio(id) && nivel >= 1 ? OFICIOS[id].titulos[Math.min(NIVEL_MAX, nivel) - 1] : '');
export const habilidadDe = (id, nivel) => (esOficio(id) && nivel >= 1 ? OFICIOS[id].habilidades[Math.min(NIVEL_MAX, nivel) - 1] : '');

// Suma experiencia. Devuelve si subió de nivel, y a cuál. `of` se modifica.
export function sumarXp(of, id, cuanto) {
  const n = entero(cuanto);
  if (!of || !esOficio(id) || n <= 0) return { subio: false, nivel: nivelOficio(of, id), antes: nivelOficio(of, id), id };
  if (!of.xp || typeof of.xp !== 'object') of.xp = {};
  const antes = nivelDe(xpDe(of, id));
  of.xp[id] = Math.min(TOPE_XP, xpDe(of, id) + n);
  const nivel = nivelDe(of.xp[id]);
  return { subio: nivel > antes, nivel, antes, id, titulo: tituloDe(id, nivel), habilidad: habilidadDe(id, nivel) };
}

// Cómo va un oficio: para el cuaderno.
export function estadoOficio(of, id) {
  const xp = xpDe(of, id), nivel = nivelDe(xp);
  const desde = UMBRALES[nivel], hasta = UMBRALES[nivel + 1] ?? null;
  return {
    id, nombre: OFICIOS[id].nombre, de: OFICIOS[id].de, xp, nivel, titulo: tituloDe(id, nivel),
    desde, hasta, avance: hasta === null ? 1 : (xp - desde) / (hasta - desde), falta: hasta === null ? 0 : hasta - xp,
    habilidades: OFICIOS[id].habilidades.map((texto, i) => ({ nivel: i + 1, texto, tiene: nivel >= i + 1 })),
  };
}
// El rango que se muestra: el título del oficio más alto (a igual nivel, el de más experiencia).
export function rangoGeneral(of) {
  let mejor = null;
  for (const id of ORDEN_OFICIOS) {
    const xp = xpDe(of, id), nivel = nivelDe(xp);
    if (nivel < 1) continue;
    if (!mejor || nivel > mejor.nivel || (nivel === mejor.nivel && xp > mejor.xp)) mejor = { id, nivel, xp };
  }
  return mejor ? { ...mejor, titulo: tituloDe(mejor.id, mejor.nivel) } : { id: null, nivel: 0, xp: 0, titulo: 'Recién llegado' };
}

// ---------------------------------------------------------------- las habilidades
const nv = (n) => Math.max(0, Math.min(NIVEL_MAX, Math.floor(Number(n) || 0)));
// hachero
export const troncosAlTalar = (base, n) => base + (nv(n) >= 5 ? 2 : nv(n) >= 1 ? 1 : 0);
export const tablasAMano = (base, n) => base + (nv(n) >= 2 ? 1 : 0);
export const golpesParaTalar = (base, n) => (nv(n) >= 3 ? Math.max(1, base - 1) : base);
export const extraDeMata = (n) => (nv(n) >= 4 ? 1 : 0);
// pescador: cuánto se acorta la espera del pique, cuánto dura el pique para clavar y
// cuánto se tensa la línea cuando el pez tira
const PIQUE = [1, 0.92, 0.92, 0.84, 0.84, 0.75];
export const factorPique = (n) => PIQUE[nv(n)];
export const segundosParaClavar = (n) => (nv(n) >= 2 ? 1.4 : 1.1);
export const factorLinea = (n) => (nv(n) >= 4 ? 0.9 : 1);
// cazador: el arco se tensa como si pasara más tiempo; las huellas y los rastros
const PULSO = [1, 1.08, 1.08, 1.16, 1.16, 1.25];
export const factorPulso = (n) => PULSO[nv(n)];
export const radioHuellas = (base, n) => (nv(n) >= 2 ? base + 0.6 : base);
export const factorEsperaRastro = (n) => (nv(n) >= 4 ? 0.75 : 1);
// navegante
export const factorRemo = (n) => 1 + 0.04 * nv(n);

// constructor (`obrero`): lo que sobra de una etapa. La fracción que no llega a una unidad se
// guarda (`resto`) y se suma en la próxima, así el 5% de una etapa chica no se pierde.
const AHORRO = [0, 0.05, 0.10, 0.15, 0.20, 0.25];
export const porcentajeAhorro = (n) => AHORRO[nv(n)];
export function ahorroDeObra(pide, n, resto = {}) {
  const pct = AHORRO[nv(n)];
  const devuelve = {};
  const nuevoResto = { ...resto };
  if (pct <= 0 || !pide || typeof pide !== 'object') return { devuelve, resto: nuevoResto };
  for (const [k, cant] of Object.entries(pide)) {
    const c = entero(cant);
    if (c <= 0) continue;
    const total = c * pct + (Object.hasOwn(nuevoResto, k) ? fraccion(nuevoResto[k]) : 0);
    // nunca sobra todo lo que se pidió
    const entera = Math.min(c - 1, Math.floor(total + 1e-9));
    if (entera > 0) devuelve[k] = entera;
    nuevoResto[k] = Math.min(0.999, Math.max(0, total - Math.max(0, entera)));
  }
  return { devuelve, resto: nuevoResto };
}
// huertero: cuánto más rinde una cosecha, con el mismo arrastre de fracciones.
const COSECHA = [0, 0.15, 0.3, 0.45, 0.6, 0.75];
export function extraDeCosecha(cantidad, n, resto = 0) {
  const pct = COSECHA[nv(n)];
  const total = entero(cantidad) * pct + fraccion(resto);
  const extra = Math.floor(total + 1e-9);
  return { extra, resto: Math.min(0.999, total - extra) };
}
// Experiencia de una etapa de obra: un poco por la etapa y un poco por lo que costó.
export function xpDeEtapa(pide) {
  let total = 0;
  for (const v of Object.values(pide || {})) total += entero(v);
  return XP.etapa + Math.round(total / 3);
}
// 3.6: lo que aportás a una obra de la aldea, de a poco: lo puesto cuenta como en tus obras y
// la etapa suma su parte sólo al completarse (aportar de a uno no rinde más que de una vez).
// 3.6.1: `antes`: lo que ya estaba aportado a la etapa. El tercio se cuenta sobre lo acumulado:
// redondeado de a un aporte, de a dos rendía la mitad más que todo junto (dos materiales, un
// punto) y de a uno no daba nada. Así, en cualquier orden, la etapa da lo mismo.
export function xpDeAporte(usados, completa = false, antes = 0) {
  let total = 0;
  for (const v of Object.values(usados || {})) total += entero(v);
  const previo = entero(antes);
  return Math.round((previo + total) / 3) - Math.round(previo / 3) + (completa ? XP.etapa : 0);
}

// ---------------------------------------------------------------- partidas viejas
// Lo que ya hiciste antes de que existieran los oficios, contado con lo que la partida
// ya guardaba. Con tope: como mucho, lo que lleva al nivel 3.
export const TOPE_CREDITO = UMBRALES[3];
export function creditoInicial(p) {
  const x = p && typeof p === 'object' ? p : {};
  const c = {};
  const talados = Array.isArray(x.talados) ? x.talados.length : 0;
  c.hachero = talados * XP.tala;
  let peces = 0;
  for (const v of Object.values(x.peces && typeof x.peces === 'object' ? x.peces : {})) peces += entero(v?.cantidad);
  c.pescador = peces * XP.pez;
  c.cazador = entero(x.desafio?.abatidos) * XP.abatido + entero(x.rastreos) * XP.rastreo;
  let etapas = 0;
  for (const o of Array.isArray(x.obras) ? x.obras : []) etapas += entero(o?.etapas);
  c.obrero = etapas * (XP.etapa + 4);
  const cant = (id) => entero(x.entradas?.[id]?.cantidad);
  const cosechas = ['haba', 'papa', 'frutilla-huerta'].filter((id) => x.entradas && Object.hasOwn(x.entradas, id)).length;
  c.huertero = cosechas * XP.cosecha * 2 + Math.min(20, cant('haba') + cant('papa'));
  c.navegante = x.entradas && Object.hasOwn(x.entradas, 'kayak') ? 20 : 0;
  const salida = {};
  for (const id of ORDEN_OFICIOS) { const n = Math.min(TOPE_CREDITO, entero(c[id])); if (n > 0) salida[id] = n; }
  return salida;
}
// Acredita una sola vez. Devuelve lo acreditado (vacío si ya estaba).
export function acreditarOficios(of, p) {
  if (!of || of.acreditado) return {};
  const credito = creditoInicial(p);
  for (const [id, n] of Object.entries(credito)) sumarXp(of, id, n);
  of.acreditado = true;
  return credito;
}

// 4.18.0 (A): el REGISTRO de las subtramas optativas de la Historia («El trato del molino», GUION_HISTORIA.md §6 y los bloques «Optativas» de
// cada capítulo). Módulo PURO (sin three ni DOM; se prueba en Node). Para cada optativa: en qué capítulos está abierta, quién la ofrece y con qué
// condición, cómo se cumple (una escena, una entrega, llegar a un lugar, juntar ovejas, un encargo) y el premio del guion.
//
// Reglas:
//   · NUNCA traban: no son objetivos del capítulo. Se ven en el panel de la historia (con la estrellita) mientras están abiertas y ofrecidas,
//     y con la tilde cuando se hicieron; en la guía queda la lista de las hechas.
//   · Hasta cuándo siguen abiertas: lo que dice el guion; si no dice, hasta el fin del acto (`desde` … `hasta`, ids de capítulo). Las
//     escenas de cada optativa se disparan sólo en esa ventana (historia-disparadores.js pisa el `cap` de sus disparadores con ella).
//   · Hecha = queda anotada en `historia.optativas[id] = día` una sola vez, y en ese momento se da el premio (una sola vez). Los LAZOS del
//     guion los da la escena (`lazo:<quién>:<n>`); si la escena vista no trae el lazo de esa persona, lo da el registro. Lo mismo con el ramal.
//   · Los encargos de los vecinos con arco (los de PERSONAS_LAZO): cada encargo cumplido con la historia en marcha suma +1 al lazo de quien lo pidió.
import { CAPITULOS, PERSONAS_LAZO, cambiarLazo, sumarRamal } from './historia.js';
import { TEXTO_ACTO1 } from './historia-texto-acto1.js';
import { TEXTO_ACTO2 } from './historia-texto-acto2.js';
import { TEXTO_ACTO3 } from './historia-texto-acto3.js';
import { TEXTO_OPTATIVAS } from './historia-texto-optativas.js';
import { ESCENAS_ACTO1 } from './historia-escenas-acto1.js';
import { ESCENAS_ACTO2 } from './historia-escenas-acto2.js';
import { ESCENAS_ACTO3 } from './historia-escenas-acto3.js';
import { ESCENAS_OPTATIVAS } from './historia-escenas-optativas.js';
import { efectosDe, PERSONAJES_HISTORIA } from './historia-escenas-util.js';
import { PERSONAJES_ACTO2 } from './historia-escenas-acto2-util.js';
import { PERSONAJES_ACTO3 } from './historia-escenas-acto3-util.js';

const ESCENAS = { ...ESCENAS_ACTO1, ...ESCENAS_ACTO2, ...ESCENAS_ACTO3, ...ESCENAS_OPTATIVAS };
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const ent = (v, max = 1e6) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
const IDX = Object.fromEntries(CAPITULOS.map((c, i) => [c.id, i]));
const vista = (id) => (s) => s.escenas.has(id);
const encargoHecho = (id) => (s) => obj(s.encargos)[id] === 'hecho';

// Las flechas de más (optativa del capítulo 11): cuántas suma al carcaj de la noche
export const FLECHAS_DE_MAS = 15;
// Lo que se paga por las seis tablas de coihue que le vendés a Tito (D2 = b)
export const PRECIO_TABLAS_TITO = 900;
export const TABLAS_TITO = 6;
// Las ovejas desparramadas del corral de Ramón (capítulo 9, si la tranquera amaneció abierta)
export const OVEJAS_DESPARRAMADAS = 6;
// Los lugares lindos de la vuelta para la ingeniera (capítulo 4): dos de tres, con Graciela de acompañante
export const LUGARES_VUELTA = { mirador: 16, faro: 30, 'casa-te': 14 };
export const vueltasDe = (s) => Object.keys(LUGARES_VUELTA).filter((k) => s.temas.has(`vuelta:${k}`) || (k === 'casa-te' && s.escenas.has('te-graciela'))).length;
// El pan de Rosa (el frasco de la masa madre): uno cada mañana, tres mañanas
export const PAN_ROSA_DIAS = 3;

// ---------------------------------------------------------------- el registro
// `desde` / `hasta`: ids de capítulo (inclusive). `ofrece(s, h)`: además de estar en la ventana. `hecha(s, h)`. `enCurso(s, h)`: un avance a
// medias (opcional) y `avance(s, h)`: el texto de ese avance. `escenas`: las que la cumplen o la tocan (para el lazo que ya dio la escena).
// `disparadores`: las claves de DISPARADORES que se abren en la ventana. `premio`: { lazos, ramal, cuenta, materiales, entradas, pesos, pan, flechas, texto }.
// `ventana: true`: sólo cuenta como hecha dentro de su ventana (los encargos, que se pueden cumplir en cualquier momento).
export const OPTATIVAS = [
  // ---- ACTO I
  { id: 'frasco-masa-madre', desde: 'llave', hasta: 'ramal', quien: 'rosa',
    ofrece: (s) => s.escenas.has('nota-eusebio') || s.temas.has('optativa:frasco-masa-madre'),
    enCurso: (s) => s.objetos.has('frasco-masa-madre'),
    avance: (s) => (s.pobladores.has('panadera') ? 'llevale el frasco a Rosa, en la panadería (E sobre ella)' : 'el frasco está en tu mochila: Rosa todavía no llegó a la aldea'),
    hecha: vista('frasco-rosa'), escenas: ['frasco-rosa'], disparadores: ['frasco-rosa'],
    premio: { pan: PAN_ROSA_DIAS, texto: 'Rosa te va a dejar un pan cada mañana, tres mañanas' } },
  { id: 'oveja', desde: 'bolsa', hasta: 'ramal', quien: 'ramon',
    ofrece: (s) => s.temas.has('optativa:oveja'),
    enCurso: (s) => ovejaSuelta(s),
    avance: () => 'la oveja te sigue si no te alejás: llevala al Puesto Alto',
    hecha: vista('oveja-ramon'), escenas: ['oveja-ramon'], disparadores: ['oveja-ramon'],
    premio: { lazos: { ramon: 1 }, texto: 'Ramón te mira distinto' } },
  { id: 'banco-primero', desde: 'bolsa', hasta: 'ramal', quien: 'ramon', ventana: true,
    ofrece: () => true, hecha: encargoHecho('e-banco'), premio: null },
  { id: 'encargo', desde: 'mesa', hasta: 'ramal', quien: null,
    ofrece: () => true, hecha: (s) => s.aceptados >= 1, premio: null },
  { id: 'fermin-pan', desde: 'mesa', hasta: 'ramal', quien: 'fermin',
    ofrece: (s) => s.escenas.has('fermin-galpon') || s.temas.has('optativa:fermin-pan'),
    avance: (s) => (s.pan >= 1 || s.harina >= 1 ? 'llevale un pan o una medida de harina al galpón de esquila (E sobre él)' : 'te falta un pan casero o una medida de harina'),
    hecha: vista('fermin-pan'), escenas: ['fermin-pan'], disparadores: ['fermin-pan'],
    premio: { lazos: { fermin: 1 }, texto: 'Fermín no dice nada, pero te guarda un mate' } },
  { id: 'vuelta-ingeniera', desde: 'ramal', hasta: 'ramal', quien: 'graciela',
    ofrece: (s) => s.escenas.has('anden-graciela'),
    enCurso: (s) => vueltasDe(s) >= 1,
    avance: (s) => `${Math.min(2, vueltasDe(s))} de 2 lugares con Graciela`,
    hecha: (s) => vueltasDe(s) >= 2, escenas: ['te-graciela', 'vuelta-ingeniera'], disparadores: ['vuelta-ingeniera', 'te-graciela'],
    premio: { lazos: { graciela: 2 }, ramal: 2, texto: 'Graciela anota algo en el cuaderno que no es una cuenta' } },
  { id: 'vuelta-completa', desde: 'ramal', hasta: 'ramal', quien: 'guarda', ventana: true,
    ofrece: () => true, hecha: encargoHecho('e-vuelta'), premio: null },
  // ---- ACTO II
  { id: 'trigo-abuelo', desde: 'rueda', hasta: 'cuaderno', quien: 'ema',
    ofrece: (s) => s.decisiones.bolsa === 'c' && s.escenas.has('piedras-molino'),
    hecha: vista('trigo-abuelo'), escenas: ['trigo-abuelo'], disparadores: ['trigo-abuelo'], premio: { lazos: { ema: 1 } } },
  { id: 'tablas-tito', desde: 'rueda', hasta: 'cuaderno', quien: 'tito',
    ofrece: (s) => s.decisiones.coihue === 'b' && s.escenas.has('piedras-molino'),
    avance: (s) => (s.tablas >= TABLAS_TITO ? 'llevale las seis tablas a Tito, en la carpintería' : `te faltan tablas (${Math.min(TABLAS_TITO, s.tablas)} de ${TABLAS_TITO})`),
    hecha: vista('tablas-tito'), escenas: ['tablas-tito'], disparadores: ['tablas-tito', 'tablas-tito:hablar'],
    premio: null },   // (la plata la paga el efecto de la escena, con las tablas: historia-disparadores-optativas.js)
  { id: 'truchas', desde: 'rueda', hasta: 'cuaderno', quien: 'nicanor',
    ofrece: (s) => s.escenas.has('piedras-molino'), hecha: vista('truchas-nicanor'), escenas: ['truchas-nicanor'], disparadores: ['truchas-nicanor'], premio: null },
  { id: 'masa-crece', desde: 'perdido', hasta: 'cuaderno', quien: 'rosa',
    ofrece: (s) => s.decisiones.bolsa === 'b', hecha: vista('masa-crece'), escenas: ['masa-crece'], disparadores: ['masa-crece'], premio: null },
  { id: 'foto-sofia', desde: 'perdido', hasta: 'cuaderno', quien: 'sofia',
    ofrece: (s) => s.temas.has('obj:foto-movida'), hecha: vista('foto-sofia'), escenas: ['foto-sofia'], disparadores: ['foto-sofia', 'foto-sofia:hablar'], premio: null },
  { id: 'tres-de-tres', desde: 'perdido', hasta: 'cuaderno', quien: 'nicanor', ventana: true,
    ofrece: () => true, hecha: encargoHecho('e-pesca'), premio: null },
  { id: 'concurso', desde: 'cosecha', hasta: 'cuaderno', quien: 'ercilia', ventana: true,
    ofrece: () => true, hecha: (s) => s.cintaDulce, premio: { lazos: { ercilia: 1 }, texto: 'Ercilia cuelga tu cinta en el almacén' } },
  { id: 'fermin-habla', desde: 'cosecha', hasta: 'cuaderno', quien: 'fermin',
    ofrece: (s) => s.escenas.has('minga-aldea'), hecha: vista('fermin-mulas'), escenas: ['fermin-mulas'], disparadores: ['fermin-mulas'], premio: { lazos: { fermin: 1 } } },
  { id: 'veta-vuelve', desde: 'cuaderno', hasta: 'cuaderno', quien: 'tobias',
    ofrece: (s) => s.decisiones.coihue === 'c', hecha: vista('veta-vuelve'), escenas: ['veta-vuelve'], disparadores: ['veta-vuelve'],
    premio: { entradas: { canto: 10 }, texto: 'Diez cantos blancos de la veta: sirven para la honda' } },
  { id: 'mulas', desde: 'cuaderno', hasta: 'cuaderno', quien: 'belisario',
    ofrece: (s) => s.escenas.has('los-del-cerro'), hecha: vista('mulas-belisario'), escenas: ['mulas-belisario'], disparadores: ['mulas-belisario'], premio: null },
  { id: 'noventa', desde: 'cuaderno', hasta: 'cuaderno', quien: 'herminia',
    ofrece: () => true, hecha: vista('herminia-noventa'), escenas: ['herminia-noventa'], disparadores: ['herminia-noventa'], premio: null },
  // ---- ACTO III
  { id: 'papel-elsa', desde: 'frios', hasta: 'arco', quien: 'guarda',
    ofrece: (s) => s.escenas.has('ramon-cama'), hecha: vista('papel-elsa'), escenas: ['papel-elsa'], disparadores: ['papel-elsa'], premio: { lazos: { guarda: 1 } } },
  { id: 'visita-ramon', desde: 'frios', hasta: 'arco', quien: 'ramon',
    ofrece: (s) => s.escenas.has('ramon-sanitario'), hecha: vista('visita-ramon'), escenas: ['visita-ramon'], disparadores: ['visita-ramon'], premio: { lazos: { ramon: 1 } } },
  { id: 'trochita-nieve', desde: 'frios', hasta: 'arco', quien: 'guarda', ventana: true,
    ofrece: () => true, hecha: encargoHecho('t-trochita-nieve'), premio: { ramal: 1, texto: 'Un flete más en la cuenta del ramal' } },
  { id: 'juntar-ovejas', desde: 'frios', hasta: 'golpea', quien: 'ramon',
    ofrece: (s) => s.temas.has('optativa:juntar-ovejas'),
    enCurso: (s) => s.temas.has('optativa:juntar-ovejas') && !s.temas.has('arreo:corral-ramon'),
    avance: () => 'las ovejas te siguen si pasás cerca: llevalas al corral del Puesto Alto',
    hecha: vista('juntar-ovejas'), escenas: ['juntar-ovejas'], disparadores: ['juntar-ovejas'],
    premio: { materiales: { lana: 2 }, texto: 'Dos vellones de la majada que juntaste' } },
  { id: 'llave-79', desde: 'golpea', hasta: 'arco', quien: 'ema',
    ofrece: (s) => s.trato === 'trato' && s.llave79, hecha: vista('llave-79'), escenas: ['llave-79'], disparadores: ['llave-79'], premio: null },
  { id: 'pedir-perdon', desde: 'golpea', hasta: 'arco', quien: null,
    ofrece: (s) => s.trato === 'pelea', hecha: (s) => s.escenas.has('pedir-perdon') || s.perdon, escenas: ['pedir-perdon'], disparadores: ['pedir-perdon'], premio: null },
  { id: 'flechas-de-mas', desde: 'arco', hasta: 'nevada', quien: 'tito',
    ofrece: (s) => s.escenas.has('tito-arco') && !s.escenas.has('noche-espera'),
    avance: (s) => (s.escenas.has('blancos-paso') ? 'llevale a Tito más plumas y puntas (E sobre él)' : 'primero aprendé a tirar con el arco en el Puesto del Paso'),
    hecha: vista('flechas-de-mas'), escenas: ['flechas-de-mas'], disparadores: ['flechas-de-mas'],
    premio: { flechas: FLECHAS_DE_MAS, texto: `Un segundo atado: ${FLECHAS_DE_MAS} flechas más para la noche` } },
  { id: 'cumple-nevada', desde: 'arco', hasta: 'nevada', quien: 'ercilia',
    ofrece: (s) => !!s.cumple && !s.escenas.has('noche-espera'),
    avance: () => 'hay un cumpleaños en la aldea hoy, de 15 a 21: andá igual',
    hecha: vista('cumple-nevada'), escenas: ['cumple-nevada'], disparadores: ['cumple-nevada'], premio: { lazos: { ercilia: 1 } } },
  { id: 'alguien-te-espera', desde: 'arco', hasta: 'nevada', quien: 'pareja',
    ofrece: (s) => s.amor && !s.escenas.has('noche-espera'), hecha: vista('pareja-noche-antes'), escenas: ['pareja-noche-antes'], disparadores: ['pareja-noche-antes'], premio: null },
  { id: 'volver-a-subir', desde: 'deshielo', hasta: 'deshielo', quien: 'ramon',
    ofrece: (s) => s.decisiones.majada === 'c' && s.escenas.has('majada-fin'), hecha: vista('volver-a-subir'), escenas: ['volver-a-subir'], disparadores: ['volver-a-subir'], premio: null },
];
export const OPTATIVA = Object.fromEntries(OPTATIVAS.map((o) => [o.id, o]));
export const IDS_OPTATIVAS_REGISTRO = OPTATIVAS.map((o) => o.id);

// La oveja escapada de Ramón: se eligió «Arrearla vos» en el evento que la historia ofreció en el capítulo 2, y todavía no llegó
export function ovejaSuelta(s) {
  if (!s.temas.has('optativa:oveja') || s.temas.has('arreo:oveja-ramon')) return false;
  return s.eventosOpcion?.oveja === 'buscar' && (Number(s.eventosDia?.oveja) || 0) >= (Number(s.ofrecidas?.oveja) || 1);
}

// ---------------------------------------------------------------- las ventanas
export const capsDe = (o) => CAPITULOS.slice(IDX[o.desde], IDX[o.hasta] + 1).map((c) => c.id);
export function enVentana(o, h) {
  if (!h?.activa || h.fase === 'fin') return false;
  const i = Math.max(0, Math.min(CAPITULOS.length - 1, h.capitulo || 0));
  return i >= IDX[o.desde] && i <= IDX[o.hasta];
}
// El texto del tablón: el de B (TEXTO_OPTATIVAS.tablon) o el de los capítulos
const TEXTOS_CAP = (() => {
  const t = {};
  for (const T of [TEXTO_ACTO1, TEXTO_ACTO2, TEXTO_ACTO3]) for (const c of Object.values(obj(T.capitulos))) for (const o of c.optativas || []) if (!t[o.id]) t[o.id] = o.texto;
  return t;
})();
export const textoOptativa = (id) => obj(obj(TEXTO_OPTATIVAS.tablon)[id]).texto || TEXTOS_CAP[id] || id;

// El estado de una optativa: 'hecha' | 'en-curso' | 'ofrecida' | 'cerrada'
export function estadoOptativa(o, s, h) {
  if (Object.hasOwn(obj(h?.optativas), o.id)) return 'hecha';
  if (!enVentana(o, h)) return 'cerrada';
  let ofrecida = false;
  try { ofrecida = !!o.ofrece(s, h); } catch { ofrecida = false; }
  if (!ofrecida) return 'cerrada';
  let curso = false;
  try { curso = !!o.enCurso?.(s, h); } catch { curso = false; }
  return curso ? 'en-curso' : 'ofrecida';
}

// ---------------------------------------------------------------- los premios
// Las personas con lazo que una escena vista ya movió (para no dar dos veces el lazo del guion)
function lazosDeEscenas(o, s) {
  const r = new Set();
  let ramal = false;
  for (const id of o.escenas || []) {
    if (!s.escenas.has(id) || !Object.hasOwn(ESCENAS, id)) continue;
    for (const ef of efectosDe(ESCENAS[id])) {
      const p = ef.split(':');
      if (p[0] === 'lazo' && Number(p[2]) > 0) r.add(p[1]);
      if (p[0] === 'ramal') ramal = true;
    }
  }
  return { lazos: r, ramal };
}
// El premio que queda por dar al cumplirse (sin lo que ya dio la escena)
export function premioDe(o, s) {
  const p = o.premio;
  if (!p) return null;
  const ya = lazosDeEscenas(o, s);
  const r = { lazos: {}, ramal: 0, cuenta: { ...(p.cuenta || {}) }, materiales: { ...(p.materiales || {}) }, entradas: { ...(p.entradas || {}) }, pesos: p.pesos || 0, pan: p.pan || 0, flechas: p.flechas || 0, texto: p.texto || '' };
  for (const [q, n] of Object.entries(p.lazos || {})) if (PERSONAS_LAZO.includes(q) && !ya.lazos.has(q)) r.lazos[q] = n;
  if (p.ramal && !ya.ramal) r.ramal = p.ramal;
  return r;
}

// Revisa las optativas: anota las recién hechas y aplica la parte del premio que es de la historia (lazos, ramal, el pan de Rosa, las flechas).
// Devuelve [{ id, texto, premio }] para que el juego dé las cosas (cuenta, materiales, entradas, pesos) y avise.
export function revisarOptativas(h, s, dia = 1) {
  const salida = [];
  if (!h?.activa || h.fase === 'fin' || !s) return salida;
  if (!h.optativas || typeof h.optativas !== 'object' || Array.isArray(h.optativas)) h.optativas = {};
  for (const o of OPTATIVAS) {
    if (Object.hasOwn(h.optativas, o.id)) continue;
    if (o.ventana && !enVentana(o, h)) continue;
    let ok = false;
    try { ok = !!o.hecha(s, h); } catch { ok = false; }
    if (!ok) continue;
    h.optativas[o.id] = Math.max(1, ent(dia));
    const pr = premioDe(o, s);
    if (pr) {
      for (const [q, n] of Object.entries(pr.lazos)) cambiarLazo(h, q, n);
      if (pr.ramal) sumarRamal(h, pr.ramal);
      if (pr.pan) h.panRosa = { quedan: pr.pan, ultimo: Math.max(1, ent(dia)) };
      if (pr.flechas) h.flechasExtra = Math.min(99, ent(h.flechasExtra, 99) + pr.flechas);
    }
    salida.push({ id: o.id, texto: textoOptativa(o.id), premio: pr });
  }
  return salida;
}
// El pan de Rosa: uno por mañana (de 6 a 12), tres mañanas desde el día siguiente al frasco. Devuelve true si hoy toca (y lo descuenta).
export function panDeHoy(h, dia, horas) {
  const p = h?.panRosa;
  if (!p || typeof p !== 'object' || ent(p.quedan, 9) <= 0) return false;
  if (ent(dia) <= ent(p.ultimo) || !(Number(horas) >= 6 && Number(horas) < 12)) return false;
  h.panRosa = { quedan: ent(p.quedan, 9) - 1, ultimo: ent(dia) };
  return true;
}

// ---------------------------------------------------------------- los encargos de los vecinos con arco: +1 al lazo de quien lo pidió
// `encargos`: [{ id, quien }] (los de encargos.js y encargos-temporada.js). La primera vez se anota lo ya hecho como base (sin lazo).
export function revisarEncargos(h, p, encargos, dia = 1) {
  const dados = [];
  if (!h?.activa || h.fase === 'fin') return dados;
  const hechos = Object.entries(obj(p?.encargos)).filter(([, v]) => v === 'hecho').map(([k]) => k);
  if (!h.encargosLazo || typeof h.encargosLazo !== 'object' || Array.isArray(h.encargosLazo)) {
    h.encargosLazo = {};
    for (const k of hechos) h.encargosLazo[k] = 0;
    return dados;
  }
  const quien = Object.fromEntries((encargos || []).map((e) => [e.id, e.quien]));
  for (const k of hechos) {
    if (Object.hasOwn(h.encargosLazo, k) || Object.keys(h.encargosLazo).length >= 200) continue;
    const q = quien[k];
    if (PERSONAS_LAZO.includes(q)) { cambiarLazo(h, q, 1); h.encargosLazo[k] = Math.max(1, ent(dia)); dados.push({ id: k, quien: q }); }
    else h.encargosLazo[k] = 0;
  }
  return dados;
}

// ---------------------------------------------------------------- el tablón (el panel de la historia) y la guía
// Las optativas a la vista en el capítulo en curso: las ofrecidas y en curso (con su avance) y las hechas cuya ventana incluye este capítulo
export function optativasDelPanel(h, s) {
  if (!h?.activa || h.fase === 'fin' || !s) return [];
  const r = [];
  for (const o of OPTATIVAS) {
    const e = estadoOptativa(o, s, h);
    if (e === 'cerrada') continue;
    if (e === 'hecha' && !enVentana(o, h)) continue;
    let extra = '';
    if (e !== 'hecha' && o.avance) { try { extra = o.avance(s, h) || ''; } catch { extra = ''; } }
    const t = obj(obj(TEXTO_OPTATIVAS.tablon)[o.id]);
    const texto = e === 'hecha' && t.hecha ? t.hecha : e === 'en-curso' && t.enCurso ? t.enCurso : textoOptativa(o.id);
    r.push({ id: o.id, estado: e, texto: extra && e !== 'hecha' ? `${texto} · ${extra}` : texto, hecho: e === 'hecha' });
  }
  return r;
}
// Las hechas, para la guía: [{ id, texto, dia }]
export const optativasHechas = (h) => Object.entries(obj(h?.optativas)).filter(([k]) => Object.hasOwn(OPTATIVA, k)).map(([k, d]) => ({ id: k, texto: textoOptativa(k), dia: ent(d) })).sort((a, b) => a.dia - b.dia);

// ---------------------------------------------------------------- la charla de historia: una línea arriba de todo en la E del vecino
// El nombre de la persona en los textos (ramon, josefina, rosa…) a la clave que tiene en el juego (ramon, ema, panadera…)
export const CLAVE_DE = Object.fromEntries(Object.entries({ ...PERSONAJES_HISTORIA, ...PERSONAJES_ACTO2, ...PERSONAJES_ACTO3 }).filter(([, v]) => typeof v?.clave === 'string').map(([k, v]) => [k, v.clave]));
const CHARLAS = (() => {
  const r = {};
  for (const T of [TEXTO_ACTO1, TEXTO_ACTO2, TEXTO_ACTO3, TEXTO_OPTATIVAS]) for (const [quien, lista] of Object.entries(obj(T.charla))) {
    const clave = CLAVE_DE[quien] || quien;
    for (const l of Array.isArray(lista) ? lista : []) if (l && typeof l.id === 'string' && typeof l.texto === 'string') (r[clave] ||= []).push(l);
  }
  return r;
})();
export const charlasDe = (clave) => (Object.hasOwn(CHARLAS, clave) ? CHARLAS[clave] : []);
function cuandoOk(w, s, h) {
  if (!w) return true;
  if (w.decision) return s.decisiones[w.decision] === w.es;
  if (w.optativa) return Object.hasOwn(obj(h.optativas), w.optativa) || s.temas.has(`optativa-hecha:${w.optativa}`);
  if (w.escena) return s.escenas.has(w.escena);
  if (w.trato) return s.trato === w.trato || (w.trato === 'fuerte' && s.decisiones.duendes === 'b');
  if (w.noche) return s.nocheEstado === w.noche;
  return false;
}
// La línea que el vecino tiene para decir ahora (una vez cada una): la de una optativa hecha (de cualquier capítulo ya llegado) o la del
// capítulo en curso cuya condición se cumple. Entre varias, la de capítulo más alto y, a igual capítulo, la que tiene condición.
export function lineaDeHistoria(h, s, clave) {
  if (!h?.activa || h.fase !== 'jugando' || !s) return null;
  const n = Math.max(0, h.capitulo || 0) + 1;
  const oidas = obj(h.oidas);
  const c = charlasDe(clave).filter((l) => !Object.hasOwn(oidas, l.id) && Number(l.cap) <= n && (Number(l.cap) === n || l.cuando?.optativa) && cuandoOk(l.cuando, s, h));
  if (!c.length) return null;
  c.sort((a, b) => (Number(b.cap) - Number(a.cap)) || ((b.cuando ? 1 : 0) - (a.cuando ? 1 : 0)));
  return c[0];
}
export function oirLinea(h, id, dia = 1) {
  if (typeof id !== 'string') return false;
  if (!h.oidas || typeof h.oidas !== 'object' || Array.isArray(h.oidas)) h.oidas = {};
  if (Object.hasOwn(h.oidas, id) || Object.keys(h.oidas).length >= 400) return false;
  h.oidas[id] = Math.max(1, ent(dia));
  return true;
}

// ---------------------------------------------------------------- el arreo de las optativas (la oveja escapada y las ovejas desparramadas)
// Lo que el mundo tiene que arrear ahora (historia-arreo-mundo.js), o null. `origen`: { punto, hacia?, dist } para la oveja (hacia el cerro);
// `disperso`: alrededor del corral. `destino`: el corral del Puesto Alto.
export function arreoDeOptativa(h, hechos = {}) {
  if (!h?.activa || h.fase !== 'jugando') return null;
  const temas = obj(h.temas), i = h.capitulo || 0;
  const t = (k) => Object.hasOwn(temas, k);
  const ev = obj(hechos);   // (progreso.eventosValle.hechos: la opción elegida en el evento de la oveja)
  if (i >= IDX.bolsa && i <= IDX.ramal && t('optativa:oveja') && !t('arreo:oveja-ramon') && ev?.oveja?.opcion === 'buscar' && ent(ev.oveja.dia) >= ent(temas['optativa:oveja']))
    return { clave: 'oveja', destino: 'oveja-ramon', punto: 'puesto', dx: 7, dz: 4, n: 1, min: 1, origen: { punto: 'puesto', hacia: 'mirador', dist: 55 } };
  const majadaEnCamino = ['a', 'c'].includes(obj(h.decisiones).majada) && !t('arreo:galpon-esquila') && !t('arreo:puesto-paso');
  if (i >= IDX.frios && i <= IDX.golpea && t('optativa:juntar-ovejas') && !t('arreo:corral-ramon') && !majadaEnCamino)
    return { clave: 'juntar', destino: 'corral-ramon', punto: 'puesto', dx: 7, dz: 4, n: OVEJAS_DESPARRAMADAS, min: OVEJAS_DESPARRAMADAS, disperso: { r0: 18, r1: 42 } };
  return null;
}
// Las posiciones de partida de las ovejas de un arreo de optativa (deterministas: el mismo lugar cada vez que se carga la partida)
export function posicionesArreo(a, puntoDe) {
  const base = puntoDe(a.punto);
  if (!base) return null;
  const corral = { x: base.x + a.dx, z: base.z + a.dz };
  if (a.disperso) {
    const r = [];
    for (let k = 0; k < a.n; k++) { const ang = (k / a.n) * 6.283 + 0.7, rad = a.disperso.r0 + ((k * 7) % 5) / 4 * (a.disperso.r1 - a.disperso.r0); r.push({ x: corral.x + Math.cos(ang) * rad, z: corral.z + Math.sin(ang) * rad }); }
    return { corral, ovejas: r };
  }
  const o = a.origen, desde = puntoDe(o.punto) || base, hacia = o.hacia ? puntoDe(o.hacia) : null;
  let ux = 0.7, uz = 0.7;
  if (hacia) { const dx = hacia.x - desde.x, dz = hacia.z - desde.z, l = Math.hypot(dx, dz) || 1; ux = dx / l; uz = dz / l; }
  return { corral, ovejas: [{ x: desde.x + ux * o.dist, z: desde.z + uz * o.dist }] };
}

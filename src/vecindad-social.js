// 3.7.4: la vida social "tipo Sims" (PLAN_3_7.md, «3.7.4 — Vida social tipo Sims»). Las REGLAS de la rueda de
// interacciones, la barra de relación, el humor del día, los deseos, lo que los vecinos vienen a hacerte a vos y lo
// que hacen entre ellos. Lo visual (la rueda, las burbujas, las emociones arriba de la cabeza, las barras, las voces
// y las animaciones) lo hace otro equipo con lo que devuelve esto. Los textos están en vecindad-social-voces.js.
//
// ================================================================ EL CONTRATO (para el equipo de lo visual)
//   INTERACCIONES: { id: { categoria, nombre, icono, anim: { yo, el }, requiere, duracion (s), … } }
//       categoria: 'amistosa' | 'graciosa' | 'picante' | 'romantica' | 'juntos' (las de la rueda propia) y, para lo
//       de siempre (la charla de la 3.6), 'charla' | 'ayuda'. `requiere`: { nivelAmistad?, nivelRomance?, pareja?,
//       hora?: [desde, hasta), lugar?: [..], cosas?: [{ tipo, k, n }], humor?: [..], ofendido?, afuera? }.
//       ANIM_JUGADOR y ANIM_VECINO: todos los ids de animación que puede pedir esto (y nada más).
//   CATEGORIAS_RUEDA: [{ id, nombre, icono }] en el orden de la rueda.
//   opcionesRueda(persona, estado, ctx) → [{ categoria, nombre, icono, opciones: [{ id, nombre, icono, disponible,
//       motivo?, de: 'social'|'charla' }] }]. Las de `de: 'charla'` (los temas, regalar, invitar a tomar algo, dar una
//       mano, el servicio, lo del amor de la 3.7.1, la cocina, la granja) se eligen como siempre, con `elegir` de
//       vecindad-juego.js (pasale su menú en `ctx.menu`); las de `de: 'social'`, con `probarInteraccion`.
//   probarInteraccion(persona, id, estado, ctx) → { exito, motivo?, reaccion: { animEl, emocion, burbuja, renglon },
//       efectos: { amistad, romance, humor, cosas: [{ tipo, k, n }], otros: [...] }, relacion, memoria? }
//       APLICA lo suyo (amistad, romance, humor, lo hecho hoy, el deseo); lo que se gasta de la mochila viene en
//       `efectos.cosas` (con `aplicarEfectos` de vecindad-juego.js, como al regalar). `amistad` y `romance`: cuánto
//       se movió cada BARRA (0 a 100). `otros`: { tipo: 'pesca'|'caminar'|'foto'|'mate'|'cartas', con, … } (lo
//       que el juego engancha con la pesca, el paseo de la 3.7.1, el modo foto y el mate), { tipo: 'gusto', persona,
//       cosa } (para el cuaderno) y { tipo: 'deseo', id, … } (cumpliste su deseo).
//   relacionDe(persona, estado, ctx?) → { amistad: 0..100, romance: 0..100, nivel, nivelRomance, marcas, romanceVisible }
//   humorDe(persona, estado, dia, ctx) → { humor, emocion, motivo, causa }
//   deseoDe(persona, estado, dia) → { id, texto, pide, cumplir: { tipo, … }, premio, hasta } | null;
//       cumplirDeseo(persona, estado, hecho, dia) → { ok, renglon, premio, efectos } | null
//   iniciativa(persona, estado, ctx) → null | { tipo, id?, renglones, animEl, burbuja }
//   entreVecinos(a, b, estado, ctx) → { id, quienes, animA, animB, animC?, burbujas, renglon?, quien? }
//   sanearSocial(x, hoy) y conSocial(vecindadSaneada, vecindadOriginal, hoy) (lo usa guardado.js)
// ================================================================
//
// `estado`: la partida (`progreso`, con `vecindad`, `amor` y `aldea`) o la vecindad sola. Lo de esta versión se
// guarda en `progreso.vecindad.social` (ver `socialNuevo`). `ctx`, en todas: { dia, hora, clima, lugar, romance
// (el ajuste), ritmo (el de la aldea), semilla, desafio, nombre (tu apodo), menu, inventario }.
//
// Decisiones del usuario que respeta: la barra de relación SE VE (antes era sin números; los niveles siguen); lo
// picante es sin violencia y se arregla pidiendo perdón; lo romántico sólo con las candidatas adultas y solteras
// de la 3.7.1, según la etapa (nunca con chicos, casados ni Pocha); respeta el ajuste «ritmo de la aldea»; nada
// religioso y sin economía nueva. Módulo puro: sin three ni DOM, determinista (todo el azar sale de semillas).
import { PERSONAS_VECINDAD, PERFILES_VECINOS, REGALABLES, HECHOS, NIVELES_AMISTAD, AMISTAD, esPersonaVecindad, esRegalable, nombreCorto, nivelDe, climaDe, cambiarAmistad, puntosAmistad, revelarGusto, gustoDe, ayudas, vecindadNueva } from './vecindad.js';
import { VOCES } from './vecindad-voces.js';
import { esCandidata, puedeRomance, romanceActivo, etapaAmor, coquetear, sumarAfectoDe, ETAPAS_AMOR } from './amor.js';
import { esCumpleanos, esPersonaAldea, CHICOS_ALDEA, num, azar } from './aldea.js';
import { ritmoDe } from './aldea-vida.js';
import { VOCES_SOCIAL, VOCES_SOCIAL_AMOR, FRASES_SOCIAL } from './vecindad-social-voces.js';

// ---------------------------------------------------------------- utilidades
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const tieneDe = (o, k) => objeto(o) && Object.hasOwn(o, k);
const entero = (v, d = 0) => (Number.isFinite(num(v)) ? Math.floor(num(v)) : d);
const TOPE_DIA = 1e6;
const diaValido = (v, d = 1) => Math.max(1, Math.min(TOPE_DIA, entero(v, d)));
const acotar = (x, a, b) => Math.max(a, Math.min(b, x));
const horaNorm = (h) => ((((Number.isFinite(num(h)) ? num(h) : 12) % 24) + 24) % 24);
function hashTexto(s) {
  let h = 2166136261;
  for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
const sorteo = (s) => azar(hashTexto(s));
const elegirDe = (lista, s) => (Array.isArray(lista) && lista.length ? lista[hashTexto(s) % lista.length] : null);
// Reemplaza {x} con `datos`; si falta alguna marca, null (y se prueba con otro renglón).
function llenar(texto, datos = {}) {
  if (typeof texto !== 'string') return null;
  let falta = false;
  const r = texto.replace(/\{(\w+)\}/g, (_t, k) => {
    const v = tieneDe(datos, k) ? datos[k] : null;
    if (v === null || v === undefined || v === '') { falta = true; return ''; }
    return String(v);
  });
  return falta ? null : r;
}
// El primer renglón de `lista` (empezando por uno elegido con `semilla`) que se pueda llenar.
function renglonDe(lista, datos, semilla) {
  const l = (Array.isArray(lista) ? lista : [lista]).filter((x) => typeof x === 'string' && x);
  if (!l.length) return null;
  const desde = hashTexto(semilla) % l.length;
  for (let i = 0; i < l.length; i++) { const t = llenar(l[(desde + i) % l.length], datos); if (t) return t; }
  return null;
}
const textoSano = (s, tope = 30) => (typeof s === 'string' ? s.replace(/[\u0000-\u001f<>{}]/g, '').trim().slice(0, tope) : '');
const esChico = (k) => CHICOS_ALDEA.includes(k);
const MAYORES = new Set(['abuela', 'ramon', 'martin', 'ercilia', 'modista', 'tejedora']);

// ---------------------------------------------------------------- las animaciones y los íconos
// Todos los ids de animación que esto puede pedir (el equipo de lo visual tiene que tener cada uno).
export const ANIM_JUGADOR = [
  'saludar', 'abrazar', 'chocar-cinco', 'aplaudir', 'palmada-hombro', 'hablar', 'contar', 'hacer-broma', 'hacer-morisqueta',
  'discutir', 'burlarse', 'quejarse', 'ignorar', 'pedir-perdon', 'piropo', 'susurrar', 'abrazo-largo', 'tomar-mano', 'bailar-lento',
  'besar', 'cebar-mate', 'jugar-cartas', 'pescar', 'caminar', 'posar', 'patear-pelota', 'bailar',
];
export const ANIM_VECINO = [
  'saludar', 'abrazar', 'chocar-cinco', 'festejar', 'suspirar', 'asentir', 'hablar', 'contar', 'pensar', 'reir', 'mirar-raro',
  'negar', 'encogerse', 'cruzarse-brazos', 'irse-ofendido', 'cachetada-suave', 'sonrojarse', 'discutir', 'burlarse', 'sorprenderse',
  'susurrar', 'abrazo-largo', 'tomar-mano', 'bailar-lento', 'besar', 'cebar-mate', 'tomar-mate', 'jugar-cartas', 'pescar', 'caminar',
  'posar', 'patear-pelota', 'bailar',
];
// Las emociones de arriba de la cabeza (un ícono cada una).
export const EMOCIONES = ['contento', 'risa', 'enojado', 'triste', 'cansado', 'enamorado', 'tranquilo', 'sorpresa', 'verguenza', 'confundido'];
export const HUMORES = ['contento', 'cansado', 'enojado', 'triste', 'enamorado', 'tranquilo'];

// ---------------------------------------------------------------- las interacciones
// `base`: la chance de que salga bien con un conocido de humor tranquilo. `gana`/`pierde`: puntos de amistad
// (internos, de 0 a 200: la barra es la mitad). `romance`: afecto (0 a 100). `veces`: cuántas por día con la misma
// persona. `amable`: lo amable nunca sale mal con un compadre. `mal`: cómo reacciona cuando sale mal.
const I = (categoria, nombre, icono, yo, el, duracion, base, extra = {}) => ({
  categoria, nombre, icono, anim: { yo, el }, requiere: extra.requiere || {}, duracion, base,
  gana: extra.gana ?? 2, pierde: extra.pierde ?? 1, romance: extra.romance ?? 0, veces: extra.veces ?? 3,
  amable: extra.amable ?? (categoria !== 'picante' && categoria !== 'romantica'),
  mal: extra.mal || ['mirar-raro', 'encogerse'],
  ...(extra.otro ? { otro: extra.otro } : {}),
});
const DE_DIA = [7, 21];
export const INTERACCIONES = {
  // amistosas
  saludar: I('amistosa', 'Saludar', 'saludo', 'saludar', 'saludar', 2, 0.95, { gana: 1, pierde: 0, veces: 2 }),
  abrazo: I('amistosa', 'Saludar con un abrazo', 'abrazo', 'abrazar', 'abrazar', 3, 0.7, { gana: 3 }),
  chocar: I('amistosa', 'Chocar los cinco', 'cinco', 'chocar-cinco', 'chocar-cinco', 2, 0.8, { gana: 2 }),
  felicitar: I('amistosa', 'Felicitar', 'aplauso', 'aplaudir', 'festejar', 3, 0.85, { gana: 2, veces: 1 }),
  consolar: I('amistosa', 'Consolar', 'consuelo', 'palmada-hombro', 'suspirar', 4, 0.75, { gana: 4, veces: 1, requiere: { humor: ['triste', 'cansado', 'enojado'] } }),
  tiempo: I('amistosa', 'Hablar del tiempo', 'nube', 'hablar', 'asentir', 4, 0.9, { gana: 1, veces: 1 }),
  gustos: I('amistosa', 'Preguntarle qué le gusta', 'estrella', 'hablar', 'contar', 5, 0.75, { gana: 2, veces: 1 }),
  perdon: I('amistosa', 'Pedir perdón', 'perdon', 'pedir-perdon', 'asentir', 4, 0.6, { gana: 4, pierde: 0, veces: 2, requiere: { ofendido: true }, mal: ['cruzarse-brazos', 'negar'] }),
  // graciosas
  chiste: I('graciosa', 'Contar un chiste', 'chiste', 'contar', 'reir', 4, 0.65, { gana: 2 }),
  broma: I('graciosa', 'Hacer una broma', 'broma', 'hacer-broma', 'reir', 3, 0.5, { gana: 3, pierde: 2, mal: ['mirar-raro', 'cruzarse-brazos'] }),
  adivinanza: I('graciosa', 'Una adivinanza', 'pregunta', 'contar', 'pensar', 4, 0.65, { gana: 2, mal: ['encogerse', 'mirar-raro'] }),
  cuento: I('graciosa', 'Contar un cuento de pesca', 'pez', 'contar', 'reir', 5, 0.6, { gana: 2, mal: ['mirar-raro', 'suspirar'] }),
  morisqueta: I('graciosa', 'Hacer una morisqueta', 'morisqueta', 'hacer-morisqueta', 'reir', 2, 0.55, { gana: 2, mal: ['mirar-raro', 'negar'] }),
  // picantes (sin violencia): bajan la amistad y se arreglan pidiendo perdón. `exito`: se lo tomó en broma.
  discutir: I('picante', 'Discutir', 'rayo', 'discutir', 'discutir', 4, 0.15, { pierde: 6, veces: 2, mal: ['discutir', 'irse-ofendido'] }),
  burlarse: I('picante', 'Burlarse', 'lengua', 'burlarse', 'cruzarse-brazos', 3, 0.2, { pierde: 5, veces: 2, mal: ['cruzarse-brazos', 'irse-ofendido'] }),
  quejarse: I('picante', 'Quejarse', 'queja', 'quejarse', 'suspirar', 3, 0.3, { pierde: 3, veces: 2, mal: ['suspirar', 'cruzarse-brazos'] }),
  ignorar: I('picante', 'Ignorar', 'nada', 'ignorar', 'mirar-raro', 2, 0.25, { pierde: 2, veces: 2, mal: ['mirar-raro', 'irse-ofendido'] }),
  // románticas (sobre la 3.7.1): sólo con candidatas y según la etapa
  piropo: I('romantica', 'Tirar un piropo', 'corazon', 'piropo', 'sonrojarse', 3, 0, { veces: 1, requiere: { nivelRomance: 'conocidos' } }),
  susurrar: I('romantica', 'Susurrarle algo', 'susurro', 'susurrar', 'sonrojarse', 3, 0.55, { romance: 3, veces: 2, requiere: { nivelRomance: 'coqueteo' }, mal: ['mirar-raro', 'encogerse'] }),
  'abrazo-largo': I('romantica', 'Un abrazo largo', 'abrazo', 'abrazo-largo', 'abrazo-largo', 5, 0.55, { romance: 3, veces: 2, requiere: { nivelRomance: 'coqueteo' }, mal: ['irse-ofendido', 'mirar-raro'] }),
  mano: I('romantica', 'Tomarla de la mano', 'mano', 'tomar-mano', 'tomar-mano', 4, 0.6, { romance: 3, veces: 2, requiere: { nivelRomance: 'saliendo' }, mal: ['mirar-raro', 'irse-ofendido'] }),
  'bailar-lento': I('romantica', 'Bailar lento', 'baile', 'bailar-lento', 'bailar-lento', 20, 0.6, { romance: 4, veces: 1, requiere: { nivelRomance: 'saliendo', hora: [10, 24] }, mal: ['negar', 'irse-ofendido'] }),
  beso: I('romantica', 'Darle un beso', 'beso', 'besar', 'besar', 3, 0.45, { romance: 5, veces: 3, requiere: { nivelRomance: 'saliendo' }, mal: ['cachetada-suave', 'irse-ofendido'] }),
  // juntos, ahí mismo (algunas enganchan con lo que ya hay: el mate, la pesca, el paseo, el modo foto)
  mate: I('juntos', 'Tomar un mate', 'mate', 'cebar-mate', 'tomar-mate', 20, 0.85, { gana: 3, veces: 1, requiere: { cosas: [{ tipo: 'cosa', k: 'yerba', n: 1 }] }, otro: 'mate', mal: ['negar', 'encogerse'] }),
  cartas: I('juntos', 'Jugar un truco', 'cartas', 'jugar-cartas', 'jugar-cartas', 30, 0.75, { gana: 3, veces: 1, requiere: { hora: [9, 23] }, otro: 'cartas', mal: ['negar', 'encogerse'] }),
  pescar: I('juntos', 'Ir a pescar', 'pesca', 'pescar', 'pescar', 60, 0.7, { gana: 3, veces: 1, requiere: { hora: [6, 20] }, otro: 'pesca', mal: ['negar', 'encogerse'] }),
  caminar: I('juntos', 'Caminar juntos', 'pasos', 'caminar', 'caminar', 30, 0.8, { gana: 2, veces: 1, requiere: { hora: DE_DIA }, otro: 'caminar', mal: ['negar', 'encogerse'] }),
  foto: I('juntos', 'Sacarse una foto', 'foto', 'posar', 'posar', 5, 0.8, { gana: 2, veces: 1, requiere: { hora: DE_DIA }, otro: 'foto', mal: ['negar', 'mirar-raro'] }),
  pelota: I('juntos', 'Jugar a la pelota', 'pelota', 'patear-pelota', 'patear-pelota', 30, 0.55, { gana: 3, veces: 1, requiere: { hora: [8, 20], afuera: true }, mal: ['negar', 'encogerse'] }),
  ranchera: I('juntos', 'Bailar una ranchera', 'musica', 'bailar', 'bailar', 20, 0.6, { gana: 3, veces: 1, requiere: { hora: [10, 24] }, mal: ['negar', 'mirar-raro'] }),
};
export const esInteraccion = (id) => typeof id === 'string' && Object.hasOwn(INTERACCIONES, id);
export const ORDEN_INTERACCIONES = Object.keys(INTERACCIONES);

// Las categorías, en el orden de la rueda (empezando arriba y en el sentido del reloj).
export const CATEGORIAS_RUEDA = [
  { id: 'charla', nombre: 'Charlar', icono: 'charla' },
  { id: 'amistosa', nombre: 'Amistosas', icono: 'abrazo' },
  { id: 'graciosa', nombre: 'Graciosas', icono: 'chiste' },
  { id: 'juntos', nombre: 'Juntos', icono: 'mate' },
  { id: 'hacer', nombre: 'Hacer juntos', icono: 'herramienta' },   // 3.8.4: lo de los rincones (aprender, el sulky, la pista)
  { id: 'ayuda', nombre: 'Regalar y ayudar', icono: 'regalo' },
  { id: 'romantica', nombre: 'Románticas', icono: 'corazon' },
  { id: 'picante', nombre: 'Picantes', icono: 'rayo' },
];
// Lo de siempre (el menú de vecindad-juego.js): en qué categoría va cada opción y con qué ícono.
const DEL_MENU = [
  [/^como-andas$/, 'charla', 'charla'], [/^novedades$/, 'charla', 'diario'], [/^historia$/, 'charla', 'libro'], [/^contame$/, 'charla', 'libro'],
  [/^servicio$/, 'ayuda', 'oficio'], [/^regalar$/, 'ayuda', 'regalo'], [/^ayudar$/, 'ayuda', 'herramienta'], [/^invitar$/, 'juntos', 'taza'],
  [/^amor/, 'romantica', 'corazon'], [/^cocina/, 'ayuda', 'olla'], [/^granja/, 'ayuda', 'granja'],
  [/^rincones:/, 'hacer', 'herramienta'],   // 3.8.4: su sección propia («Hacer juntos»), no entre los regalos
];
const TITULOS_MENU = { 'como-andas': '¿Cómo andás?', novedades: 'Novedades', historia: 'Tu historia', regalar: 'Regalar…', invitar: 'Invitar a tomar algo…', ayudar: 'Dar una mano…', amor: 'Lo nuestro…' };

// ---------------------------------------------------------------- el estado (progreso.vecindad.social)
export const SOCIAL = {
  topeGanaDia: 8,       // puntos de amistad que da la rueda por persona y por día (los deseos y el perdón, aparte)
  diasOfendido: 3,      // si no le pedís perdón, se le pasa solo a los tres días
  diasDeseo: 3,         // cada cuántos días cambia el deseo de cada uno
  premioDeseo: { amistad: 12, romance: 3, humor: 3 },
  repite: 0.15,         // cuánto baja la chance cada vez que repetís lo mismo en el día
  topeHumor: 4,
  topeIniciativasDia: { tranquilo: 1, normal: 2, animado: 3 },
  chanceIniciativa: { tranquilo: 0.3, normal: 0.45, animado: 0.65 },
  diasRecuerdo: 7,
};
export function socialNuevo() {
  return {
    dia: 0,           // el día de lo de "hoy"
    hecho: {},        // persona → { id: veces } (lo hecho HOY con cada uno)
    puntos: {},       // persona → lo que le hiciste hoy, para su humor (−4 a 4)
    ganado: {},       // persona → amistad que ya dio la rueda hoy
    ofendido: {},     // persona → desde qué día está ofendido
    deseos: {},       // persona → { v: ventana del deseo, c: día en que se cumplió }
    recuerdo: {},     // persona → { id, dia, bien } (lo último que pasó con vos, para que lo comente)
    vino: {},         // persona → el último día en que se te acercó
    iniciativa: { ultima: -1e9, dia: 0, n: 0 },
  };
}
const esVecindad = (x) => objeto(x) && objeto(x.personas) && Array.isArray(x.hechos);
// De `estado` saca la vecindad, lo social y la partida. `crear`: si falta, lo arma.
function partes(estado, crear = false) {
  const e = objeto(estado) ? estado : null;
  let v = null, progreso = null;
  if (e && esVecindad(e)) v = e;
  else if (e) {
    progreso = e;
    if (esVecindad(e.vecindad)) v = e.vecindad;
    else if (crear) { e.vecindad = vecindadNueva(); v = e.vecindad; }
  }
  if (!v && crear) v = vecindadNueva();
  let s = v && objeto(v.social) ? v.social : null;
  if (!s && crear && v) { v.social = socialNuevo(); s = v.social; }
  return { v, s, progreso, base: progreso || v };
}
// Lo de hoy: al cambiar el día se vacía (y lo viejo se olvida).
function alDia(s, d) {
  if (s.dia === d) return s;
  s.dia = d;
  s.hecho = {}; s.puntos = {}; s.ganado = {};
  for (const k of Object.keys(s.ofendido)) if (d - s.ofendido[k] >= SOCIAL.diasOfendido || s.ofendido[k] > d) delete s.ofendido[k];
  for (const k of Object.keys(s.recuerdo)) if (d - s.recuerdo[k].dia > SOCIAL.diasRecuerdo || s.recuerdo[k].dia > d) delete s.recuerdo[k];
  for (const k of Object.keys(s.vino)) if (s.vino[k] !== d) delete s.vino[k];
  return s;
}
const diaCtx = (progreso, ctx) => diaValido(ctx?.dia ?? progreso?.dia, 1);
const horaCtx = (progreso, ctx) => horaNorm(ctx?.hora ?? progreso?.horas);
const vecesHoy = (s, persona, id, d) => (s && s.dia === d && tieneDe(s.hecho, persona) && tieneDe(s.hecho[persona], id) ? s.hecho[persona][id] : 0);
const ofendidoHoy = (s, persona, d) => !!s && tieneDe(s.ofendido, persona) && d - s.ofendido[persona] < SOCIAL.diasOfendido && s.ofendido[persona] <= d;
const puntosHoy = (s, persona, d) => (s && s.dia === d && tieneDe(s.puntos, persona) ? s.puntos[persona] : 0);

// ---------------------------------------------------------------- la barra de relación
// 3.7.4, decisión del usuario: la barra se VE (amistad y romance de 0 a 100); los niveles siguen y se marcan en
// la barra (`marcas`). Romance: el afecto de la 3.7.1, sólo con las candidatas (y con el ajuste prendido).
export function relacionDe(persona, estado, ctx = {}) {
  const nada = { amistad: 0, romance: 0, nivel: 'conocido', nivelRomance: null, marcas: { amigo: 25, compadre: 70 }, romanceVisible: false };
  if (!esPersonaVecindad(persona)) return nada;
  const { base, progreso } = partes(estado);
  const amistad = Math.round(puntosAmistad(persona, base) / AMISTAD.tope * 100);
  const nivel = base ? nivelDe(persona, base) : 'conocido';
  const marcas = { amigo: Math.round(AMISTAD.umbral.amigo / AMISTAD.tope * 100), compadre: Math.round(AMISTAD.umbral.compadre / AMISTAD.tope * 100) };
  if (!esCandidata(persona) || !romanceActivo(ctx)) return { amistad, romance: 0, nivel, nivelRomance: null, marcas, romanceVisible: false };
  const f = progreso?.amor?.personas && tieneDe(progreso.amor.personas, persona) ? progreso.amor.personas[persona] : null;
  const romance = f ? Math.round(acotar(Number.isFinite(num(f.afecto)) ? num(f.afecto) : 0, 0, 100)) : 0;
  const nivelRomance = progreso ? etapaAmor(persona, progreso) : 'conocidos';
  return { amistad, romance, nivel, nivelRomance, marcas, romanceVisible: romance > 0 || nivelRomance !== 'conocidos' };
}

// ---------------------------------------------------------------- el humor del día
// Cambia con el clima, si durmió bien, su trabajo, lo que le hiciste hoy, si está ofendido con vos, los
// cumpleaños y el amor. Cambia cómo responde (la chance de la rueda y algunos renglones).
const EMOCION_HUMOR = { contento: 'contento', cansado: 'cansado', enojado: 'enojado', triste: 'triste', enamorado: 'enamorado', tranquilo: 'tranquilo' };
const PAREJA = ['novios', 'comprometidos', 'casados'];
const fichaAmor = (progreso, k) => (objeto(progreso?.amor?.personas) && tieneDe(progreso.amor.personas, k) ? progreso.amor.personas[k] : null);
export function humorDe(persona, estado, dia, ctx = {}) {
  const t = (humor, causa) => ({ humor, emocion: EMOCION_HUMOR[humor], motivo: FRASES_SOCIAL.motivoHumor[causa] || FRASES_SOCIAL.motivoHumor.normal, causa });
  if (!esPersonaVecindad(persona)) return t('tranquilo', 'normal');
  const { v, s, progreso } = partes(estado);
  const d = diaValido(dia ?? ctx?.dia ?? progreso?.dia, 1);
  const h = horaNorm(ctx?.hora ?? progreso?.horas);
  const rasgos = PERFILES_VECINOS[persona].rasgos;
  const pts = puntosHoy(s, persona, d);
  const amorOn = romanceActivo(ctx) && esCandidata(persona);
  const fa = amorOn ? fichaAmor(progreso, persona) : null;
  if (ofendidoHoy(s, persona, d)) return t('enojado', 'ofendido');
  if (fa && Number(fa.enojo) >= d) return t('enojado', 'celos');
  if (pts <= -2) return t('enojado', 'le-hiciste-mal');
  if (esCumpleanos(persona, d)) return t('contento', 'cumple');
  if (fa && pts >= 2 && ETAPAS_AMOR.indexOf(fa.etapa) >= ETAPAS_AMOR.indexOf('coqueteo') && fa.etapa !== 'separados') return t('enamorado', 'vos');
  if (fa && PAREJA.includes(fa.etapa) && d - (Number(fa.contacto) || 0) <= 1) return t('enamorado', 'pareja');
  if (pts >= 2) return t('contento', 'le-hiciste-bien');
  // durmió mal (los trasnochadores, más seguido)
  if (sorteo(`${persona}:sueño:${d}`) < (rasgos.includes('trasnochador') ? 0.2 : 0.1)) return t('cansado', 'durmio-mal');
  // lo que extraña (cada tanto)
  if (Object.hasOwn(FRASES_SOCIAL.extrana, persona) && sorteo(`${persona}:extraña:${d}`) < 0.08) return { ...t('triste', 'extrana'), motivo: FRASES_SOCIAL.extrana[persona] };
  // el trabajo y el cansancio de la tarde
  const ganas = v && tieneDe(v.personas, persona) ? v.personas[persona].ganas : null;
  if (h >= 19.5 && rasgos.includes('trabajador') && !esChico(persona)) return t('cansado', 'trabajo');
  if (ganas && num(ganas.descanso) >= 0.75) return t('cansado', 'sin-descanso');
  if (h >= 22 || h < 6) return t('cansado', 'tarde');
  // el clima
  const c = climaDe(ctx?.clima);
  const r = sorteo(`${persona}:clima:${d}`);
  if (c === 'lluvia' || c === 'nieve') {
    if (rasgos.includes('jardinero') && c === 'lluvia') return t('contento', 'lluvia-plantas');
    if ((rasgos.includes('jugueton') || esChico(persona)) && c === 'nieve') return t('contento', 'nieve-jugar');
    if (rasgos.includes('andariego')) return t('triste', c === 'nieve' ? 'nieve-encierro' : 'lluvia-encierro');
    if (rasgos.includes('casero')) return t('tranquilo', c === 'nieve' ? 'nieve-casa' : 'lluvia-casa');
    if (r < 0.3) return t('triste', 'gris');
  }
  if (c === 'viento' && r < 0.35) return t('cansado', 'viento');
  if (c === 'sol' && r < 0.55) return t('contento', 'sol');
  if (pts >= 1) return t('contento', 'le-hiciste-bien');
  return t('tranquilo', 'normal');
}
const MOD_HUMOR = { contento: 0.15, enamorado: 0.2, tranquilo: 0.05, cansado: -0.15, triste: -0.1, enojado: -0.3 };

// ---------------------------------------------------------------- lo que hace falta para cada una
// Cuánto tenés de algo (la partida, { materiales, cosas, entradas } o una función (k, tipo) → cantidad).
function cuantoHay(inv, tipo, k) {
  if (typeof inv === 'function') return entero(inv(k, tipo));
  if (!objeto(inv)) return 0;
  if (tipo === 'material') return entero(inv.materiales?.[k]);
  if (tipo === 'cosa') return entero(inv.cosas?.[k]);
  return entero(inv.entradas?.[k]?.cantidad);
}
const idxEtapa = (e) => ETAPAS_AMOR.indexOf(e);
// La etapa que cuenta para la rueda: separados vale como coqueteo (hay que reconquistarla).
const etapaRueda = (e) => (e === 'separados' ? 'coqueteo' : e);
// ¿Se puede ahora? Devuelve { ok, motivo, oculta }: `oculta` = ni se muestra (lo romántico con quien no puede
// haber romance, nunca).
function revisar(persona, id, estado, ctx, partesYa = null) {
  const def = INTERACCIONES[id];
  const { s, progreso, base } = partesYa || partes(estado);
  const d = diaCtx(progreso, ctx), h = horaCtx(progreso, ctx);
  const req = def.requiere;
  const M = FRASES_SOCIAL.motivos;
  if (def.categoria === 'romantica') {
    if (!esCandidata(persona) || !progreso) return { ok: false, motivo: M.noSePuede, oculta: true };
    const pr = puedeRomance(persona, progreso, ctx);
    if (!pr.ok) return { ok: false, motivo: M.noSePuede, oculta: true };
    const et = etapaRueda(etapaAmor(persona, progreso));
    if (req.nivelRomance && idxEtapa(et) < idxEtapa(req.nivelRomance)) return { ok: false, motivo: req.nivelRomance === 'coqueteo' ? M.faltaOnda : M.faltaSalir };
    const fa = fichaAmor(progreso, persona);
    if (id === 'piropo' && fa && fa.piropo === d) return { ok: false, motivo: M.yaHoy };
  }
  if (req.ofendido && !ofendidoHoy(s, persona, d)) return { ok: false, motivo: M.noOfendido, oculta: true };
  if (req.nivelAmistad && NIVELES_AMISTAD.indexOf(base ? nivelDe(persona, base) : 'conocido') < NIVELES_AMISTAD.indexOf(req.nivelAmistad)) return { ok: false, motivo: M.faltaConfianza };
  if (req.humor && !req.humor.includes(humorDe(persona, estado, d, ctx).humor)) return { ok: false, motivo: M.estaBien, oculta: true };
  if (id === 'consolar' && ofendidoHoy(s, persona, d)) return { ok: false, motivo: M.ofendido };
  if (req.hora && !(h >= req.hora[0] && h < req.hora[1])) return { ok: false, motivo: h < req.hora[0] && h >= 4 ? M.temprano : M.tarde };
  if (req.afuera && climaDe(ctx?.clima) === 'lluvia') return { ok: false, motivo: M.llueve };
  if (id === 'mate' && (esChico(persona) || VOCES[persona]?.noToma?.mate)) return { ok: false, motivo: M.noTomaMate, oculta: esChico(persona) };
  if (req.cosas) {
    const inv = ctx?.inventario ?? progreso;
    for (const c of req.cosas) if (!inv || cuantoHay(inv, c.tipo, c.k) < c.n) return { ok: false, motivo: c.k === 'yerba' ? M.sinYerba : M.faltaAlgo };
  }
  if (vecesHoy(s, persona, id, d) >= def.veces) return { ok: false, motivo: M.yaHoy };
  return { ok: true, motivo: null };
}

// ---------------------------------------------------------------- la rueda
// Las opciones de la rueda, por categoría (en el orden de CATEGORIAS_RUEDA; las vacías no van). `ctx.menu`: las
// opciones de siempre ([{ id, titulo }] del menú de vecindad-juego.js); si no viene, se arma lo básico.
export function opcionesRueda(persona, estado, ctx = {}) {
  if (!esPersonaVecindad(persona) || ctx?.desafio) return [];
  const pp = partes(estado);
  const { progreso, base } = pp;
  const d = diaCtx(progreso, ctx);
  const grupos = Object.fromEntries(CATEGORIAS_RUEDA.map((c) => [c.id, []]));
  // lo de siempre
  let menu = Array.isArray(ctx?.menu) ? ctx.menu : null;
  if (!menu) {
    menu = ['como-andas', 'novedades', 'historia', 'regalar', 'invitar'].map((id) => ({ id, titulo: TITULOS_MENU[id] }));
    if (base && ayudas(persona, base, d).length) menu.push({ id: 'ayudar', titulo: TITULOS_MENU.ayudar });
    if (progreso && esCandidata(persona) && puedeRomance(persona, progreso, ctx).ok) menu.push({ id: 'amor', titulo: TITULOS_MENU.amor });
  }
  for (const o of menu) {
    if (!objeto(o) || typeof o.id !== 'string' || o.id === 'chau' || o.id === 'volver') continue;
    const m = DEL_MENU.find(([re]) => re.test(o.id));
    const cat = m ? m[1] : (CATEGORIAS_RUEDA.some((c) => c.id === o.categoria) ? o.categoria : 'charla');
    // (lo del amor, sólo si puede haber romance: el menú de la 3.7.1 ya lo filtra, pero acá se vuelve a mirar)
    if (cat === 'romantica' && !(progreso && esCandidata(persona) && puedeRomance(persona, progreso, ctx).ok)) continue;
    grupos[cat].push({ id: o.id, nombre: String(o.titulo || o.nombre || o.id), icono: m ? m[2] : 'charla', disponible: o.disponible !== false, de: 'charla' });
  }
  // lo de la rueda
  for (const id of ORDEN_INTERACCIONES) {
    const def = INTERACCIONES[id];
    const r = revisar(persona, id, estado, ctx, pp);
    if (r.oculta) continue;
    const o = { id, nombre: def.nombre, icono: def.icono, disponible: r.ok, de: 'social' };
    if (!r.ok) o.motivo = r.motivo;
    grupos[def.categoria].push(o);
  }
  return CATEGORIAS_RUEDA.filter((c) => grupos[c.id].length).map((c) => ({ categoria: c.id, nombre: c.nombre, icono: c.icono, opciones: grupos[c.id] }));
}

// ---------------------------------------------------------------- la chance
// Cómo influye la forma de ser (los rasgos de vecindad.js) en cada una.
const RASGO_SOCIAL = {
  charlatan: { tiempo: 0.15, chiste: 0.1, gustos: 0.1, cuento: 0.1, ignorar: -0.1 },
  solitario: { abrazo: -0.2, chocar: -0.1, ranchera: -0.2, caminar: 0.1, pescar: 0.1, 'abrazo-largo': -0.1 },
  jugueton: { broma: 0.25, morisqueta: 0.25, chocar: 0.15, pelota: 0.3, adivinanza: 0.1, burlarse: 0.15 },
  curioso: { adivinanza: 0.15, gustos: 0.1, foto: 0.1, cuento: 0.05 },
  trabajador: { cartas: -0.1, pelota: -0.1, quejarse: -0.1 },
  goloso: { mate: 0.1 },
  casero: { caminar: -0.1, mate: 0.1, pescar: -0.1 },
  andariego: { caminar: 0.2, pescar: 0.1, foto: 0.05 },
  lector: { adivinanza: 0.2, cuento: 0.1, broma: -0.05 },
  jardinero: { tiempo: 0.1 },
  madrugador: { cartas: -0.05 },
  trasnochador: { ranchera: 0.15, cartas: 0.1, 'bailar-lento': 0.1 },
};
const CHICOS_MOD = { morisqueta: 0.35, pelota: 0.35, chiste: 0.1, adivinanza: 0.1, cartas: -0.2, tiempo: -0.2, ranchera: -0.1 };
// La chance de que salga bien (0 a 1) y si está asegurado. Exportada para las pruebas y por si la rueda quiere
// mostrar un aviso ("hoy no está de humor").
export function chanceInteraccion(persona, id, estado, ctx = {}) {
  if (!esPersonaVecindad(persona) || !esInteraccion(id)) return { chance: 0, seguro: false };
  const def = INTERACCIONES[id];
  const { s, progreso, base } = partes(estado);
  const d = diaCtx(progreso, ctx);
  const nivel = base ? nivelDe(persona, base) : 'conocido';
  const humor = humorDe(persona, estado, d, ctx).humor;
  const veces = vecesHoy(s, persona, id, d);
  const ofendido = ofendidoHoy(s, persona, d);
  const rel = relacionDe(persona, estado, ctx);
  let p = def.base + rel.amistad / 100 * 0.35;
  if (def.categoria === 'picante') {
    // (la chance de que se lo tome en broma)
    p = def.base + (nivel === 'compadre' ? 0.35 : nivel === 'amigo' ? 0.12 : 0) + (humor === 'contento' ? 0.1 : humor === 'enojado' || humor === 'cansado' ? -0.15 : 0);
  } else p += MOD_HUMOR[humor] || 0;
  if (id === 'consolar' && humor === 'triste') p += 0.3;
  if (id === 'abrazo' && humor === 'triste') p += 0.1;
  if (id === 'felicitar' && esCumpleanos(persona, d)) p += 0.2;
  for (const rg of PERFILES_VECINOS[persona].rasgos) p += RASGO_SOCIAL[rg]?.[id] || 0;
  if (esChico(persona)) p += CHICOS_MOD[id] || 0;
  if (MAYORES.has(persona) && id === 'pelota') p -= 0.3;
  if (id === 'ranchera' && ['salon', 'plaza'].includes(ctx?.lugar)) p += 0.2;
  if (id === 'pescar' && ['pescador', 'nicanor', 'botera'].includes(persona)) p += 0.25;
  if (ofendido && id !== 'perdon' && def.categoria !== 'picante') p -= 0.35;
  if (id === 'perdon') p += nivel === 'amigo' ? 0.15 : nivel === 'compadre' ? 0.3 : 0;
  p -= SOCIAL.repite * veces;
  let seguro = false;
  if (def.categoria === 'romantica') {
    const fa = progreso ? fichaAmor(progreso, persona) : null;
    const afecto = fa ? num(fa.afecto) || 0 : 0;
    p += afecto / 200 + (humor === 'enamorado' ? 0.1 : 0);
    if (fa && Number(fa.enojo) >= d) p -= 0.4;
    else if (fa && PAREJA.includes(fa.etapa)) seguro = true;   // con tu pareja, lo romántico sale siempre
  }
  // lo amable nunca sale mal con quien te quiere mucho
  if (def.amable && nivel === 'compadre') seguro = true;
  return { chance: seguro ? 1 : acotar(Math.round(p * 1000) / 1000, 0.05, 0.97), seguro };
}

// ---------------------------------------------------------------- los renglones de la reacción
const CLAVE_VOZ = { abrazo: 'abrazo', chiste: 'chiste', broma: 'broma', tiempo: 'tiempo', consolar: 'consuelo', felicitar: 'felicitar', perdon: 'perdon', mate: 'mate', cartas: 'cartas', caminar: 'caminar', foto: 'foto', pelota: 'pelota' };
const CLAVE_AMOR = { susurrar: 'susurrar', 'abrazo-largo': 'abrazoLargo', mano: 'mano', 'bailar-lento': 'bailarLento', beso: 'beso' };
function renglonReaccion(persona, id, bien, humor, datos, semilla) {
  const voz = tieneDe(VOCES_SOCIAL, persona) ? VOCES_SOCIAL[persona] : {};
  const gen = FRASES_SOCIAL.reaccion[id] || {};
  const lado = bien ? 'bien' : 'mal';
  const cands = [];
  if (CLAVE_AMOR[id]) {
    const va = tieneDe(VOCES_SOCIAL_AMOR, persona) ? VOCES_SOCIAL_AMOR[persona][CLAVE_AMOR[id]] : null;
    if (va?.[lado]) cands.push(va[lado]);
  }
  if (!bien && ['cansado', 'enojado', 'triste'].includes(humor) && sorteo(`${semilla}:humor`) < 0.5) cands.push(...(FRASES_SOCIAL.porHumor[humor] || []));
  const vk = CLAVE_VOZ[id] ? voz[CLAVE_VOZ[id]] : null;
  if (typeof vk === 'string' && bien) cands.push(vk);
  else if (objeto(vk) && vk[lado]) cands.push(vk[lado]);
  if (cands.length) { const t = renglonDe(cands, datos, semilla); if (t) return t; }
  // lo genérico de esa interacción, mezclado con lo de siempre de cada uno
  const propias = Array.isArray(voz[lado]) ? voz[lado] : [];
  const pool = sorteo(`${semilla}:propia`) < 0.5 && propias.length ? [...propias, ...(gen[lado] || [])] : [...(gen[lado] || []), ...propias];
  return renglonDe(pool.length ? pool : FRASES_SOCIAL.reaccion.generica[lado], datos, semilla) || renglonDe(FRASES_SOCIAL.reaccion.generica[lado], datos, semilla);
}
const EMOCION_BIEN = { amistosa: 'contento', graciosa: 'risa', juntos: 'contento', romantica: 'enamorado' };
const EMOCION_MAL = { amistosa: 'confundido', graciosa: 'confundido', juntos: 'cansado', romantica: 'verguenza' };

// ---------------------------------------------------------------- probar una interacción
const sumarHecho = (s, persona, id) => {
  if (!tieneDe(s.hecho, persona)) s.hecho[persona] = {};
  s.hecho[persona][id] = Math.min(9, (s.hecho[persona][id] || 0) + 1);
};
const sumarPuntos = (s, persona, n) => { s.puntos[persona] = acotar((s.puntos[persona] || 0) + n, -SOCIAL.topeHumor, SOCIAL.topeHumor); };
// Cambia la amistad (puntos internos) y devuelve cuánto se movió la barra.
function moverAmistad(base, persona, n, d) {
  if (!n) return 0;
  const antes = puntosAmistad(persona, base);
  cambiarAmistad(base, persona, n, d);
  return Math.round((puntosAmistad(persona, base) - antes) / AMISTAD.tope * 1000) / 10;
}
const recordarCon = (s, persona, id, d, bien) => { s.recuerdo[persona] = { id, dia: d, bien: !!bien }; return { id, dia: d, bien: !!bien }; };
// Hacer una interacción de la rueda con `persona`. Decide si sale bien (humor, relación, forma de ser, si ya lo
// hiciste hoy; con la semilla `ctx.semilla`, siempre igual) y APLICA lo que cambia.
export function probarInteraccion(persona, id, estado, ctx = {}) {
  const vacio = { amistad: 0, romance: 0, humor: 0, cosas: [], otros: [] };
  const no = (motivo, renglon = null) => ({ exito: false, motivo, reaccion: { animEl: null, emocion: null, burbuja: null, renglon }, efectos: vacio, relacion: relacionDe(persona, estado, ctx) });
  if (!esPersonaVecindad(persona) || !esInteraccion(id) || ctx?.desafio) return no('no-se');
  const def = INTERACCIONES[id];
  const pp = partes(estado, true);
  const { s, progreso, base } = pp;
  const d = diaCtx(progreso, ctx);
  alDia(s, d);
  const rv = revisar(persona, id, estado, ctx, pp);
  if (!rv.ok) return { ...no(rv.oculta ? 'no-se-puede' : 'no-disponible', rv.oculta ? null : rv.motivo), reaccion: { animEl: rv.oculta ? null : 'negar', emocion: null, burbuja: rv.oculta ? null : def.icono, renglon: rv.oculta ? null : rv.motivo } };
  const humor = humorDe(persona, estado, d, ctx).humor;
  const veces = vecesHoy(s, persona, id, d);
  const semilla = `${persona}:${id}:${d}:${veces}:${entero(ctx?.semilla)}`;
  const datos = { nombre: textoSano(ctx?.nombre) || null, quien: nombreCorto(persona) };
  const efectos = { amistad: 0, romance: 0, humor: 0, cosas: [], otros: [] };
  let exito, animEl, emocion, renglon, memoria = null;
  sumarHecho(s, persona, id);

  if (id === 'piropo') {
    // el piropo es el de la 3.7.1 (amor.js): uno por día, con su chance y sus renglones
    const r = coquetear(progreso, persona, { ...ctx, dia: d });
    if (!r.ok) return no('no-disponible', r.renglones?.[0] || FRASES_SOCIAL.motivos.yaHoy);
    exito = r.resultado !== 'no';
    efectos.romance = r.cambio;
    animEl = r.resultado === 'gusto' ? 'sonrojarse' : r.resultado === 'rie' ? 'reir' : 'mirar-raro';
    emocion = r.resultado === 'gusto' ? 'enamorado' : r.resultado === 'rie' ? 'risa' : 'confundido';
    renglon = r.renglones[0];
    sumarPuntos(s, persona, exito ? 1 : -1);
    efectos.humor = exito ? 1 : -1;
    if (r.subio) efectos.otros.push({ tipo: 'etapa', etapa: r.subio });
  } else if (def.categoria === 'picante') {
    // exito: se lo tomó en broma (baja apenas); si no, se ofende hasta que le pidas perdón
    const { chance } = chanceInteraccion(persona, id, estado, ctx);
    exito = sorteo(semilla) < chance;
    const nivelAntes = nivelDe(persona, base);
    efectos.amistad = moverAmistad(base, persona, exito ? -1 : -def.pierde, d);
    if (exito) {
      animEl = 'reir'; emocion = 'risa';
      renglon = renglonDe(FRASES_SOCIAL.reaccion.enBroma[id], datos, semilla);
    } else {
      s.ofendido[persona] = d;
      sumarPuntos(s, persona, -2);
      efectos.humor = -2;
      animEl = elegirDe(def.mal, semilla); emocion = 'enojado';
      const voz = tieneDe(VOCES_SOCIAL, persona) ? VOCES_SOCIAL[persona].enojo : null;
      renglon = renglonDe(sorteo(`${semilla}:voz`) < 0.6 && voz ? [...voz, ...FRASES_SOCIAL.reaccion[id].mal] : FRASES_SOCIAL.reaccion[id].mal, datos, semilla);
      memoria = recordarCon(s, persona, id, d, false);
    }
    if (nivelDe(persona, base) !== nivelAntes) efectos.otros.push({ tipo: 'nivel', antes: nivelAntes, despues: nivelDe(persona, base) });
  } else {
    const { chance, seguro } = chanceInteraccion(persona, id, estado, ctx);
    exito = seguro || sorteo(semilla) < chance;
    const cumple = id === 'felicitar' && esCumpleanos(persona, d);
    if (exito) {
      if (id === 'perdon') {
        delete s.ofendido[persona];
        efectos.amistad = moverAmistad(base, persona, def.gana, d);
        sumarPuntos(s, persona, 2);
        efectos.humor = 2;
      } else {
        let n = Math.max(1, Math.round(def.gana * (veces ? 0.5 : 1) * (cumple ? 2 : 1)));
        if (!def.gana) n = 0;
        const ya = s.ganado[persona] || 0;
        n = Math.max(0, Math.min(n, SOCIAL.topeGanaDia - ya));
        s.ganado[persona] = ya + n;
        efectos.amistad = moverAmistad(base, persona, n, d);
        const ph = id === 'consolar' ? 3 : 1;
        sumarPuntos(s, persona, ph);
        efectos.humor = ph;
      }
      if (def.romance) {
        const r = sumarAfectoDe(progreso, persona, def.romance * (veces ? 0.5 : 1), { ...ctx, dia: d });
        if (r) { efectos.romance = r.cambio; if (r.subio) efectos.otros.push({ tipo: 'etapa', etapa: r.subio }); }
      }
      animEl = def.anim.el;
      emocion = id === 'consolar' ? 'tranquilo' : id === 'adivinanza' ? 'sorpresa' : EMOCION_BIEN[def.categoria] || 'contento';
    } else {
      if (def.pierde) efectos.amistad = moverAmistad(base, persona, -def.pierde, d);
      if (def.categoria === 'romantica') { const r = sumarAfectoDe(progreso, persona, -2, { ...ctx, dia: d }); if (r) efectos.romance = r.cambio; }
      if (id !== 'perdon') { sumarPuntos(s, persona, -1); efectos.humor = -1; }
      animEl = elegirDe(def.mal, semilla);
      emocion = animEl === 'cachetada-suave' || animEl === 'irse-ofendido' || animEl === 'cruzarse-brazos' ? 'enojado' : EMOCION_MAL[def.categoria] || 'confundido';
      memoria = recordarCon(s, persona, id, d, false);
    }
    renglon = cumple && exito ? renglonDe(FRASES_SOCIAL.felicitarCumple, datos, semilla) : renglonReaccion(persona, id, exito, humor, datos, semilla);
    // lo que engancha con otros sistemas
    if (exito && def.otro) {
      const o = { tipo: def.otro, con: persona };
      // 3.7.5: con el truco de verdad (`ctx.trucoReal`: fiestas-juego.js lo juega en un panel) no se sortea quién ganó
      if (id === 'cartas' && ctx?.trucoReal) o.real = true;
      else if (id === 'cartas') o.gano = sorteo(`${semilla}:truco`) < 0.5;
      efectos.otros.push(o);
      if (id === 'cartas' && !o.real) renglon = `${renglon} ${renglonDe(o.gano ? FRASES_SOCIAL.truco.ganaste : FRASES_SOCIAL.truco.perdiste, datos, semilla)}`;
    }
    if (exito && id === 'mate') efectos.cosas.push({ tipo: 'cosa', k: 'yerba', n: -1 });
    if (exito && id === 'gustos') {
      const g = gustoParaContar(persona, base);
      if (g) { revelarGusto(base, persona, g); efectos.otros.push({ tipo: 'gusto', persona, cosa: g }); renglon = `${renglon} ${llenar(FRASES_SOCIAL.cuentaGusto, { cosa: REGALABLES[g].el })}`; }
    }
    if (exito && id === 'beso' && !(s.recuerdo[persona]?.id === 'beso' && s.recuerdo[persona]?.bien)) memoria = recordarCon(s, persona, id, d, true);
  }
  // si era su deseo, se cumple
  if (exito && def.categoria !== 'picante') {
    const c = cumplirDeseo(persona, progreso || base, { tipo: 'interaccion', id }, d, ctx);
    if (c?.ok) {
      efectos.amistad = Math.round((efectos.amistad + c.efectos.amistad) * 10) / 10;
      efectos.romance += c.efectos.romance;
      efectos.otros.push({ tipo: 'deseo', id: c.id, premio: c.premio });
      renglon = `${renglon} ${c.renglon}`;
      memoria = c.memoria;
    }
  }
  const salida = { exito, reaccion: { animEl, emocion, burbuja: def.icono, renglon }, efectos, relacion: relacionDe(persona, estado, ctx) };
  if (memoria) salida.memoria = memoria;
  return salida;
}
// Una cosa que le encanta (o le gusta) y que todavía no sabés, para "preguntarle qué le gusta".
function gustoParaContar(persona, base) {
  const f = base?.personas?.[persona] || base?.vecindad?.personas?.[persona];
  const ya = Array.isArray(f?.conoce) ? f.conoce : [];
  const g = PERFILES_VECINOS[persona].gustos;
  return [...g.encanta, ...g.gusta].find((c) => esRegalable(c) && !ya.includes(c)) || null;
}

// ---------------------------------------------------------------- los deseos
// Cada uno tiene un deseo chico y concreto que se ve al hablarle ("Rosa quiere frutillas"). Cambia cada
// SOCIAL.diasDeseo días (no todos el mismo día) y, si lo cumplís, suma mucho.
const TIPOS_DESEO = ['regalo', 'interaccion', 'invitar', 'ayudar', 'hecho'];
const ventanaDe = (persona, d) => Math.floor((d - 1 + (hashTexto(persona) % SOCIAL.diasDeseo)) / SOCIAL.diasDeseo);
function indiceDeseo(persona, ventana) {
  const lista = VOCES_SOCIAL[persona]?.deseos || [];
  if (!lista.length) return -1;
  const i = hashTexto(`${persona}:deseo:${ventana}`) % lista.length;
  const antes = hashTexto(`${persona}:deseo:${ventana - 1}`) % lista.length;
  return i === antes && lista.length > 1 ? (i + 1) % lista.length : i;
}
const premioDe = (persona) => ({ amistad: SOCIAL.premioDeseo.amistad, romance: esCandidata(persona) ? SOCIAL.premioDeseo.romance : 0, humor: 'contento' });
export function deseoDe(persona, estado, dia) {
  if (!esPersonaVecindad(persona)) return null;
  const { s, progreso } = partes(estado);
  const d = diaValido(dia ?? progreso?.dia, 1);
  const vent = ventanaDe(persona, d);
  const i = indiceDeseo(persona, vent);
  if (i < 0) return null;
  const x = s && tieneDe(s.deseos, persona) ? s.deseos[persona] : null;
  if (x && x.v === vent && x.c) return null;   // ya se lo cumpliste
  const ds = VOCES_SOCIAL[persona].deseos[i];
  const hasta = (vent + 1) * SOCIAL.diasDeseo - (hashTexto(persona) % SOCIAL.diasDeseo);   // el último día de este deseo
  return { id: ds.id, texto: ds.texto, pide: ds.pide, cumplir: { ...ds.cumplir }, premio: premioDe(persona), hasta };
}
// ¿`hecho` cumple el deseo? hecho: { tipo: 'regalo', k } | { tipo: 'interaccion', id } | { tipo: 'invitar', que } |
// { tipo: 'ayudar' } | { tipo: 'hecho', id }. Con `hecho` null, mira lo que hiciste en el valle (los hechos de
// vecindad.js desde que empezó el deseo). Si lo cumple, suma el premio y lo marca. Devuelve { ok, id, renglon,
// premio, efectos: { amistad, romance } (lo que se movió la barra), memoria } o null.
export function cumplirDeseo(persona, estado, hecho, dia, ctx = {}) {
  const ds = deseoDe(persona, estado, dia);
  if (!ds) return null;
  const { v, s, progreso, base } = partes(estado, true);
  const d = diaValido(dia ?? progreso?.dia, 1);
  const c = ds.cumplir;
  let ok = false;
  if (objeto(hecho)) {
    if (hecho.tipo === 'regalo') ok = c.tipo === 'regalo' && hecho.k === c.k;
    else if (hecho.tipo === 'interaccion') ok = c.tipo === 'interaccion' && hecho.id === c.id;
    else if (hecho.tipo === 'invitar') ok = c.tipo === 'invitar' && hecho.que === c.que;
    else if (hecho.tipo === 'ayudar') ok = c.tipo === 'ayudar';
    else if (hecho.tipo === 'hecho') ok = c.tipo === 'hecho' && hecho.id === c.id;
  } else if (c.tipo === 'hecho' && v) {
    const desde = ds.hasta - SOCIAL.diasDeseo + 1;
    ok = v.hechos.some((h) => h.id === c.id && h.dia >= desde && h.dia <= d);
  }
  if (!ok) return null;
  alDia(s, d);
  s.deseos[persona] = { v: ventanaDe(persona, d), c: d };
  const p = ds.premio;
  const amistad = moverAmistad(base, persona, p.amistad, d);
  let romance = 0;
  if (p.romance && progreso && romanceActivo(ctx)) { const r = sumarAfectoDe(progreso, persona, p.romance, { ...ctx, dia: d }); if (r) romance = r.cambio; }
  sumarPuntos(s, persona, SOCIAL.premioDeseo.humor);
  const voz = VOCES_SOCIAL[persona].deseos.find((x) => x.id === ds.id);
  return { ok: true, id: ds.id, renglon: voz?.gracias || FRASES_SOCIAL.deseoGracias, premio: p, efectos: { amistad, romance }, memoria: recordarCon(s, persona, `deseo:${ds.id}`, d, true) };
}

// ---------------------------------------------------------------- la iniciativa (lo que te vienen a hacer a vos)
// Cada tanto, uno que está libre y cerca se te acerca: a saludarte, a invitarte a algo, a pedirte una mano o a
// contarte un chisme. Sin agobiar: respeta el ajuste «ritmo de la aldea» de la 3.7.0 (cuánto se espera entre un
// acercamiento y otro, y cuántos por día) y cada uno viene como mucho una vez por día. Si devuelve algo, lo marca.
// ctx: { dia, hora, ritmo, ahora (horas absolutas; si no, dia × 24 + hora), libre (si está libre), semilla, desafio }.
const INVITA = { mate: 'mate', cartas: 'cartas', caminar: 'caminar', pescar: 'pescar', ranchera: 'ranchera' };
const INVITA_TEXTO = { mate: /mate/i, cartas: /truco|cartas|chinch[oó]n|naipe/i, caminar: /camin|vuelta|paseo|pasear/i, pescar: /pesc/i, ranchera: /ranchera|bail/i };
export function iniciativa(persona, estado, ctx = {}) {
  if (!esPersonaVecindad(persona) || ctx?.desafio || ctx?.libre === false) return null;
  const { s, progreso, base } = partes(estado);
  const d = diaCtx(progreso, ctx), h = horaCtx(progreso, ctx);
  if (h < 8 || h >= 21) return null;
  const ritmo = ['tranquilo', 'normal', 'animado'].includes(ctx?.ritmo) ? ctx.ritmo : 'normal';
  const ahora = Number.isFinite(num(ctx?.ahora)) ? num(ctx.ahora) : d * 24 + h;
  if (s) {
    const ini = s.iniciativa;
    if (ahora - ini.ultima < ritmoDe(ritmo).esperaCharla) return null;
    if (ini.dia === d && ini.n >= SOCIAL.topeIniciativasDia[ritmo]) return null;
    if (tieneDe(s.vino, persona) && s.vino[persona] === d) return null;
  }
  const hm = humorDe(persona, estado, d, ctx);
  if (hm.humor === 'enojado') return null;
  const nivel = base ? nivelDe(persona, base) : 'conocido';
  const rasgos = PERFILES_VECINOS[persona].rasgos;
  let p = SOCIAL.chanceIniciativa[ritmo] * (nivel === 'compadre' ? 1.25 : nivel === 'amigo' ? 1 : 0.4);
  if (rasgos.includes('charlatan')) p *= 1.3;
  if (rasgos.includes('solitario')) p *= 0.6;
  p *= hm.humor === 'contento' || hm.humor === 'enamorado' ? 1.2 : hm.humor === 'cansado' ? 0.6 : hm.humor === 'triste' ? 0.7 : 1;
  const sem = `${persona}:ini:${d}:${Math.floor(h)}:${entero(ctx?.semilla)}`;
  if (sorteo(sem) >= Math.min(0.95, p)) return null;
  // qué viene a hacer
  const voz = VOCES_SOCIAL[persona] || {};
  const deseo = deseoDe(persona, estado, d);
  const opciones = [['saludar', 1]];
  if (nivel !== 'conocido' && h >= 9 && h < 20) opciones.push(['invitar', 0.8]);
  if (nivel !== 'conocido' && deseo) opciones.push(['pedir', 1]);
  if (rasgos.includes('charlatan') || ['abuela', 'nelida', 'ercilia', 'madre', 'telegrafista', 'modista'].includes(persona)) opciones.push(['chisme', 0.9]);
  if (nivel === 'compadre' || rasgos.includes('jugueton')) opciones.push(['interaccion', 0.7]);
  let q = sorteo(`${sem}:tipo`) * opciones.reduce((a, [, w]) => a + w, 0);
  let tipo = opciones[opciones.length - 1][0];
  for (const [t, w] of opciones) { q -= w; if (q < 0) { tipo = t; break; } }
  const datos = { nombre: textoSano(ctx?.nombre) || null, quien: nombreCorto(persona) };
  const r = { tipo, renglones: [], animEl: 'saludar', burbuja: 'saludo' };
  if (tipo === 'invitar') {
    const posibles = Object.keys(INVITA).filter((id) => revisar(persona, id, estado, { ...ctx, inventario: () => 99 }).ok && !(id === 'mate' && VOCES[persona]?.noToma?.mate));
    // (si lo que dice él nombra algo que se puede hacer ahora, es eso; si no, uno de los genéricos)
    const propia = typeof voz.viene?.invitar === 'string' ? voz.viene.invitar : null;
    const nombrada = propia ? Object.keys(INVITA).find((id) => INVITA_TEXTO[id].test(propia)) : null;
    const usarPropia = nombrada && posibles.includes(nombrada) && sorteo(`${sem}:propia`) < 0.6;
    const id = usarPropia ? nombrada : elegirDe(posibles.length ? posibles : ['caminar'], `${sem}:que`);
    r.id = id; r.burbuja = INTERACCIONES[id].icono; r.animEl = 'hablar';
    r.renglones = [usarPropia ? renglonDe([propia], datos, sem) || renglonDe(FRASES_SOCIAL.invita[id], datos, sem) : renglonDe(FRASES_SOCIAL.invita[id], datos, sem)];
  } else if (tipo === 'pedir') {
    r.id = deseo.id; r.burbuja = iconoDeseo(deseo); r.animEl = 'hablar';
    r.renglones = [deseo.pide];
  } else if (tipo === 'chisme') {
    r.burbuja = 'susurro'; r.animEl = 'susurrar';
    const c = chismeDe(persona, base, sem);
    r.renglones = [renglonDe(sorteo(`${sem}:ch`) < 0.5 && voz.viene?.chisme ? [voz.viene.chisme] : [c || voz.viene?.chisme].filter(Boolean), datos, sem) || c];
  } else if (tipo === 'interaccion') {
    const id = elegirDe(nivel === 'compadre' ? ['abrazo', 'chocar', 'chiste'] : ['chocar', 'morisqueta', 'chiste'], `${sem}:int`);
    r.id = id; r.burbuja = INTERACCIONES[id].icono; r.animEl = INTERACCIONES[id].anim.el === 'reir' ? 'contar' : INTERACCIONES[id].anim.el;
    r.renglones = [renglonDe(FRASES_SOCIAL.vieneA[id], datos, sem)];
  } else {
    r.renglones = [renglonDe([voz.viene?.saludar, ...FRASES_SOCIAL.saludaAl].filter(Boolean), datos, sem)];
  }
  r.renglones = r.renglones.filter((x) => typeof x === 'string' && x);
  if (!r.renglones.length) r.renglones = [FRASES_SOCIAL.saludaAl[0]];
  // lo marca
  const { s: s2 } = partes(estado, true);
  const ini = s2.iniciativa;
  if (ini.dia !== d) { ini.dia = d; ini.n = 0; }
  ini.n++; ini.ultima = ahora;
  s2.vino[persona] = d;
  return r;
}
const ICONO_COSA = {
  yerba: 'mate', 'trucha-fresca': 'pez', 'trucha-ahumada': 'pez', frutilla: 'frutilla', 'frasco-frutilla': 'frutilla', miel: 'miel',
  'pan-casero': 'pan', empanadas: 'pan', harina: 'pan', lana: 'lana', poncho: 'lana', tronco: 'madera', tabla: 'madera', piedra: 'piedra',
  canto: 'piedra', pluma: 'pluma', calafate: 'baya', 'calafate-seco': 'baya', pinon: 'pinon', 'hongos-secos': 'hongo', llaollao: 'hongo',
  huevo: 'huevo', papa: 'huerta', haba: 'huerta',
};
const iconoDeseo = (ds) => (ds.cumplir.tipo === 'regalo' ? ICONO_COSA[ds.cumplir.k] || 'regalo' : ds.cumplir.tipo === 'interaccion' ? INTERACCIONES[ds.cumplir.id]?.icono || 'estrella'
  : ds.cumplir.tipo === 'invitar' ? (ds.cumplir.que === 'te' ? 'taza' : 'mate') : ds.cumplir.tipo === 'ayudar' ? 'herramienta' : 'estrella');
export const iconoDeDeseo = (ds) => (objeto(ds) && objeto(ds.cumplir) ? iconoDeseo(ds) : null);
// Un chisme inocente: dos vecinos que se llevan bien (o no tanto) y algo que hicieron.
function chismeDe(persona, base, sem) {
  const otros = PERSONAS_VECINDAD.filter((k) => k !== persona && esPersonaAldea(k));
  const a = elegirDe(otros, `${sem}:a`);
  const amigos = PERFILES_VECINOS[a].amigos.filter((k) => k !== persona && esPersonaVecindad(k));
  const b = elegirDe(amigos.length ? amigos : otros.filter((k) => k !== a), `${sem}:b`);
  return renglonDe(FRASES_SOCIAL.chismes, { a: nombreCorto(a), b: nombreCorto(b) }, `${sem}:chisme`);
}

// ---------------------------------------------------------------- entre vecinos
// Qué hacen dos (o tres) que se cruzan: se saludan, charlan, se ríen, se abrazan, discuten, bailan, juegan al
// truco, toman mate, juegan a la pelota o se cuentan un chisme. Según sus amistades (PERFILES_VECINOS), su forma de
// ser, su humor del día, la hora y el lugar. Con burbujas de íconos (de qué hablan) y, a veces, un renglón.
// `b`: una clave o una lista de una o dos. ctx: { dia, hora, lugar, clima, semilla }. No cambia nada.
export const ENTRE = {
  saludarse: { a: 'saludar', b: 'saludar' },
  charlar: { a: 'hablar', b: 'asentir' },
  reirse: { a: 'reir', b: 'reir' },
  abrazarse: { a: 'abrazar', b: 'abrazar' },
  discutir: { a: 'discutir', b: 'cruzarse-brazos' },
  bailar: { a: 'bailar', b: 'bailar' },
  cartas: { a: 'jugar-cartas', b: 'jugar-cartas' },
  mate: { a: 'cebar-mate', b: 'tomar-mate' },
  pelota: { a: 'patear-pelota', b: 'patear-pelota' },
  chisme: { a: 'susurrar', b: 'sorprenderse' },
};
const PAREJAS_FIJAS = [['padre', 'madre'], ['herrero', 'modista']];
const sonPareja = (a, b) => PAREJAS_FIJAS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
const sonAmigos = (a, b) => PERFILES_VECINOS[a].amigos.includes(b) || PERFILES_VECINOS[b].amigos.includes(a);
const tomaMate = (k) => !esChico(k) && !VOCES[k]?.noToma?.mate;
export function entreVecinos(a, b, estado, ctx = {}) {
  const otros = (Array.isArray(b) ? b : [b]).filter((k) => esPersonaVecindad(k) && k !== a).slice(0, 2);
  if (!esPersonaVecindad(a) || !otros.length) return null;
  const quienes = [a, ...otros];
  const b0 = otros[0];
  const { progreso } = partes(estado);
  const d = diaCtx(progreso, ctx), h = horaCtx(progreso, ctx);
  const sem = `${quienes.join('+')}:${d}:${Math.floor(h * 2)}:${entero(ctx?.semilla)}`;
  const hum = quienes.map((k) => humorDe(k, null, d, { ...ctx, romance: false }).humor);
  const rasgos = new Set(quienes.flatMap((k) => PERFILES_VECINOS[k].rasgos));
  const pareja = sonPareja(a, b0), amigos = pareja || sonAmigos(a, b0), chicos = quienes.every(esChico), algunChico = quienes.some(esChico);
  const noche = h >= 21 || h < 7;
  const lluvia = ['lluvia', 'nieve'].includes(climaDe(ctx?.clima));
  const w = { saludarse: 1, charlar: 1.5 };
  if (!noche) {
    w.reirse = (amigos ? 1.2 : 0.4) + (rasgos.has('charlatan') || rasgos.has('jugueton') ? 0.4 : 0);
    w.abrazarse = pareja ? 1.5 : amigos ? 0.6 : 0.1;
    w.discutir = (amigos || pareja ? 0.15 : 0.4) + (hum.includes('enojado') ? 0.8 : 0) + (chicos ? 0.4 : 0);
    if (ctx?.lugar === 'salon') w.bailar = algunChico && !chicos ? 0.3 : pareja ? 4.5 : 3;   // (en el salón se va a bailar)
    else if (pareja && h >= 17) w.bailar = 0.4;
    if (!algunChico && amigos && h >= 15 && !(lluvia && ctx?.lugar === 'plaza')) w.cartas = 0.6 + (rasgos.has('trasnochador') ? 0.3 : 0);
    if (quienes.every(tomaMate)) w.mate = 0.7;
    if ((chicos || (algunChico && rasgos.has('jugueton'))) && !lluvia && h >= 8 && h < 20) w.pelota = 1.8;
    if (quienes.some((k) => ['abuela', 'nelida', 'ercilia', 'madre', 'telegrafista', 'modista'].includes(k)) && !chicos) w.chisme = 0.9;
  }
  if (hum.includes('cansado')) { w.reirse = (w.reirse || 0) * 0.6; w.pelota = (w.pelota || 0) * 0.5; }
  const ids = Object.keys(w).filter((k) => w[k] > 0);
  let q = sorteo(sem) * ids.reduce((s, k) => s + w[k], 0);
  let id = ids[ids.length - 1];
  for (const k of ids) { q -= w[k]; if (q < 0) { id = k; break; } }
  const an = ENTRE[id];
  const salida = { id, quienes, animA: an.a, animB: an.b, burbujas: burbujasEntre(id, a, b0, ctx, sem) };
  if (otros[1]) salida.animC = an.b;
  // a veces, un renglón (corto, con los nombres)
  if (sorteo(`${sem}:renglon`) < 0.4) {
    const quien = sorteo(`${sem}:quien`) < 0.5 ? a : b0;
    const otro = quien === a ? b0 : a;
    const t = renglonDe(FRASES_SOCIAL.entre[id], { otro: nombreCorto(otro) }, `${sem}:texto`);
    if (t) { salida.renglon = t; salida.quien = quien; }
  }
  return salida;
}
const TEMA_ENTRE = { cartas: ['cartas'], mate: ['mate'], pelota: ['pelota'], bailar: ['musica'], discutir: ['rayo'], chisme: ['susurro'], abrazarse: ['corazon'], reirse: ['risa'], saludarse: ['saludo'] };
function burbujasEntre(id, a, b, ctx, sem) {
  const r = [...(TEMA_ENTRE[id] || [])];
  if (id === 'charlar' || id === 'discutir' || id === 'reirse') {
    // de qué hablan: algo que les gusta a los dos (o a uno), el tiempo o el tren
    const ga = [...PERFILES_VECINOS[a].gustos.encanta, ...PERFILES_VECINOS[a].gustos.gusta];
    const comun = ga.filter((c) => gustoDe(b, c) === 'encanta' || gustoDe(b, c) === 'gusta');
    const cosa = elegirDe(comun.length ? comun : ga, `${sem}:tema`);
    if (cosa && ICONO_COSA[cosa]) r.push(ICONO_COSA[cosa]);
    const c = climaDe(ctx?.clima);
    r.push(elegirDe([c === 'sol' ? 'sol' : c === 'nieve' ? 'nieve' : c === 'lluvia' ? 'lluvia' : 'nube', 'tren', 'risa', 'corazon'], `${sem}:tema2`));
  }
  return [...new Set(r)].slice(0, 3);
}

// ---------------------------------------------------------------- lo que recuerda
// Lo último que pasó con vos (de los últimos días), con una línea para que lo comente al saludarte (o null).
export function recuerdoDe(persona, estado, dia) {
  const { s, progreso } = partes(estado);
  const d = diaValido(dia ?? progreso?.dia, 1);
  const r = s && tieneDe(s.recuerdo, persona) ? s.recuerdo[persona] : null;
  if (!r || d - r.dia > SOCIAL.diasRecuerdo || r.dia > d || r.dia === d) return null;
  const pool = r.id.startsWith('deseo:') ? FRASES_SOCIAL.recuerda.deseo : r.bien ? FRASES_SOCIAL.recuerda[r.id] || FRASES_SOCIAL.recuerda.bien : FRASES_SOCIAL.recuerda.mal;
  return { id: r.id, bien: r.bien, renglon: renglonDe(pool, { nombre: null }, `${persona}:${r.id}:${r.dia}`) };
}

// ---------------------------------------------------------------- el paso del día y el guardado
// Llamarla al empezar el día (no hace falta: todo se pone al día solo la primera vez que se usa).
export function pasarDiaSocial(estado, dia) {
  const { s } = partes(estado, true);
  alDia(s, diaValido(dia, 1));
  return true;
}
const diaOCero = (v, tope = TOPE_DIA) => Math.max(0, Math.min(tope, entero(v, 0)));
// Todo saneado (un guardado roto o retocado no rompe nada ni crece sin límite): sólo personas conocidas,
// interacciones que existen, números acotados y fechas que no son del futuro.
export function sanearSocial(x0, hoy = null) {
  const x = objeto(x0) ? x0 : {};
  const tope = Number.isFinite(num(hoy)) ? diaValido(hoy, 1) : TOPE_DIA;
  const r = socialNuevo();
  r.dia = diaOCero(x.dia, tope);
  const porPersona = (o, f) => { const out = {}; if (objeto(o)) for (const k of PERSONAS_VECINDAD) if (Object.hasOwn(o, k)) { const y = f(o[k], k); if (y !== null && y !== undefined) out[k] = y; } return out; };
  r.hecho = porPersona(x.hecho, (o) => {
    if (!objeto(o)) return null;
    const m = {};
    for (const id of ORDEN_INTERACCIONES) if (Object.hasOwn(o, id)) { const n = acotar(entero(o[id]), 0, 9); if (n) m[id] = n; }
    return Object.keys(m).length ? m : null;
  });
  r.puntos = porPersona(x.puntos, (n) => { const v = acotar(entero(n), -SOCIAL.topeHumor, SOCIAL.topeHumor); return v || null; });
  r.ganado = porPersona(x.ganado, (n) => { const v = acotar(entero(n), 0, SOCIAL.topeGanaDia); return v || null; });
  r.ofendido = porPersona(x.ofendido, (n) => { const v = diaOCero(n, tope); return v || null; });
  r.vino = porPersona(x.vino, (n) => { const v = diaOCero(n, tope); return v || null; });
  r.deseos = porPersona(x.deseos, (o) => (objeto(o) ? { v: diaOCero(o.v, Math.ceil(tope / SOCIAL.diasDeseo) + 1), c: diaOCero(o.c, tope) } : null));
  r.recuerdo = porPersona(x.recuerdo, (o, k) => {
    if (!objeto(o) || typeof o.id !== 'string') return null;
    const id = o.id.startsWith('deseo:') ? ((VOCES_SOCIAL[k]?.deseos || []).some((ds) => `deseo:${ds.id}` === o.id) ? o.id : null) : esInteraccion(o.id) ? o.id : null;
    const dia = diaOCero(o.dia, tope);
    return id && dia ? { id, dia, bien: o.bien === true } : null;
  });
  const ini = objeto(x.iniciativa) ? x.iniciativa : {};
  const ult = num(ini.ultima);
  r.iniciativa = { ultima: Number.isFinite(ult) ? acotar(ult, -1e9, tope * 24 + 24) : -1e9, dia: diaOCero(ini.dia, tope), n: acotar(entero(ini.n), 0, 9) };
  return r;
}
// Para guardado.js: a la vecindad ya saneada le suma lo social saneado (si la original lo traía; una partida
// vieja no lo trae y queda igual que antes).
export function conSocial(vecindad, original, hoy = null) {
  if (objeto(vecindad) && objeto(original) && objeto(original.social)) vecindad.social = sanearSocial(original.social, hoy);
  return vecindad;
}
// Todos los íconos que puede pedir esto (las burbujas, la rueda, los deseos): el equipo de lo visual dibuja cada uno.
export const ICONOS = [...new Set([
  ...Object.values(INTERACCIONES).map((x) => x.icono), ...CATEGORIAS_RUEDA.map((c) => c.icono), ...DEL_MENU.map((m) => m[2]),
  ...Object.values(ICONO_COSA), ...Object.values(TEMA_ENTRE).flat(), 'sol', 'nieve', 'lluvia', 'nube', 'tren', 'risa', 'corazon',
  'regalo', 'estrella', 'herramienta', 'taza', 'charla', 'saludo', 'susurro',
])];
export const TIPOS_DE_DESEO = TIPOS_DESEO;
export const HECHOS_DESEO = Object.keys(HECHOS);

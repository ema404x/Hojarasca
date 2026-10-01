// 2.8: "Tu personaje y tu ropa". Módulo puro (se prueba en Node): lo que se puede
// elegir, qué hace falta para desbloquear cada cosa, cuánto abriga la ropa y los
// colores que usan la malla del cuerpo (personal-personaje-mundo.js), la mano y la
// manga en primera persona.
//
// La ropa de arranque es la de cualquiera que llega al valle: campera, gorro de lana,
// bufanda y botas de cuero. El poncho sale del telar (o de la carta de Amalia), las
// botas de goma del almacén, y los tintes más lindos de lo que anotaste en el cuaderno.
import { registrarSeccion, elegir } from './personalizacion.js';
import { fila, segmentos, muestras, siNo, parrafo } from './personal-controles.js';

export const PIELES = [
  { id: 'clara', nombre: 'Clara', color: '#f0d0b4' },
  { id: 'rosada', nombre: 'Rosada', color: '#e2b595' },
  { id: 'trigena', nombre: 'Trigueña', color: '#c49a70' },
  { id: 'morena', nombre: 'Morena', color: '#9c6b47' },
  { id: 'oscura', nombre: 'Oscura', color: '#6e4a31' },
  { id: 'muyoscura', nombre: 'Muy oscura', color: '#4a3122' },
];
export const PELOS = [
  { id: 'negro', nombre: 'Negro', color: '#1f1a17' },
  { id: 'castano', nombre: 'Castaño', color: '#3a2a1e' },
  { id: 'claro', nombre: 'Castaño claro', color: '#6b4e33' },
  { id: 'rubio', nombre: 'Rubio', color: '#b8955a' },
  { id: 'colorado', nombre: 'Colorado', color: '#8e4524' },
  { id: 'canoso', nombre: 'Canoso', color: '#b9b4ab' },
];
export const PEINADOS = [
  { id: 'corto', nombre: 'Corto' },
  { id: 'largo', nombre: 'Largo' },
  { id: 'trenza', nombre: 'Trenza' },
  { id: 'rodete', nombre: 'Rodete' },
  { id: 'rapado', nombre: 'Rapado' },
];
export const CONTEXTURAS = [
  { id: 'delgada', nombre: 'Delgada', ancho: 0.88 },
  { id: 'media', nombre: 'Mediana', ancho: 1 },
  { id: 'robusta', nombre: 'Robusta', ancho: 1.16 },
];
// Los colores de la lana. `pide`: la anotación del cuaderno que lo desbloquea (el tinte
// sale de esa planta o fruto); sin `pide`, está desde el principio.
export const LANAS = [
  { id: 'crudo', nombre: 'Lana cruda', color: '#e2d6bd' },
  { id: 'gris', nombre: 'Gris de oveja', color: '#8d8a82' },
  { id: 'marron', nombre: 'Marrón', color: '#6b4a3a' },
  { id: 'negro', nombre: 'Negro', color: '#2e2a26' },
  { id: 'ocre', nombre: 'Ocre', color: '#b0773a' },
  { id: 'musgo', nombre: 'Verde musgo', color: '#5f6b3e' },
  { id: 'notro', nombre: 'Rojo notro', color: '#b8432f', pide: 'notro', ayuda: 'Anotá el notro en el cuaderno' },
  { id: 'calafate', nombre: 'Violeta calafate', color: '#6b4a78', pide: 'calafate', ayuda: 'Juntá calafates' },
  { id: 'maqui', nombre: 'Azul maqui', color: '#3b3f63', pide: 'maqui', ayuda: 'Anotá el maqui en el cuaderno' },
];
// Lo que se puede llevar puesto. `abrigo`: cuánto abriga (ver templarNoche).
export const PRENDAS = {
  poncho: { nombre: 'Poncho', abrigo: 2, ayuda: 'Tejé uno en el telar' },
  gorro: { nombre: 'Gorro de lana', abrigo: 1 },
  bufanda: { nombre: 'Bufanda', abrigo: 1 },
  guantes: { nombre: 'Guantes', abrigo: 1 },
};
export const BOTAS = [
  { id: 'cuero', nombre: 'De cuero', color: '#4a3626' },
  { id: 'goma', nombre: 'De goma', color: '#1e1e1c', pide: 'botas', ayuda: 'Se cambian en el almacén' },
];
// Con esto la ropa ya pesa en una noche de invierno sin fuego (poncho, gorro y bufanda).
export const ABRIGO_QUE_TEMPLA = 4;

const ids = (lista) => lista.map((x) => x.id);
const de = (lista, id) => lista.find((x) => x.id === id) || lista[0];

export function personajeDefecto() {
  return {
    piel: 'trigena', pelo: 'castano', peinado: 'corto', contextura: 'media',
    campera: 'marron',
    poncho: false, colorPoncho: 'gris',
    gorro: true, colorGorro: 'ocre',
    bufanda: true, colorBufanda: 'crudo',
    guantes: false, colorGuantes: 'gris',
    botas: 'cuero',
  };
}
const lana = (v, def) => elegir(v, ids(LANAS), def);
export function sanearPersonaje(d) {
  const x = d && typeof d === 'object' ? d : {};
  const b = personajeDefecto();
  return {
    piel: elegir(x.piel, ids(PIELES), b.piel),
    pelo: elegir(x.pelo, ids(PELOS), b.pelo),
    peinado: elegir(x.peinado, ids(PEINADOS), b.peinado),
    contextura: elegir(x.contextura, ids(CONTEXTURAS), b.contextura),
    campera: lana(x.campera, b.campera),
    poncho: typeof x.poncho === 'boolean' ? x.poncho : b.poncho,
    colorPoncho: lana(x.colorPoncho, b.colorPoncho),
    gorro: typeof x.gorro === 'boolean' ? x.gorro : b.gorro,
    colorGorro: lana(x.colorGorro, b.colorGorro),
    bufanda: typeof x.bufanda === 'boolean' ? x.bufanda : b.bufanda,
    colorBufanda: lana(x.colorBufanda, b.colorBufanda),
    guantes: typeof x.guantes === 'boolean' ? x.guantes : b.guantes,
    colorGuantes: lana(x.colorGuantes, b.colorGuantes),
    botas: elegir(x.botas, ids(BOTAS), b.botas),
  };
}

// ¿Ya lo tenés? Sirve para los colores (`lana:notro`), las botas (`botas:goma`) y las
// prendas (`poncho`). Lo que no pide nada, sí.
const anotado = (p, id) => !!p?.entradas && typeof p.entradas === 'object' && Object.hasOwn(p.entradas, id);
const tiene = (p, id) => !!p?.cosas && typeof p.cosas === 'object' && Object.hasOwn(p.cosas, id) && Number(p.cosas[id]) > 0;
export function desbloqueado(progreso, que) {
  const [tipo, id] = String(que).includes(':') ? String(que).split(':') : ['prenda', String(que)];
  if (tipo === 'lana') { const l = LANAS.find((x) => x.id === id); return !!l && (!l.pide || anotado(progreso, l.pide)); }
  if (tipo === 'botas') { const b = BOTAS.find((x) => x.id === id); return !!b && (!b.pide || anotado(progreso, b.pide) || tiene(progreso, b.pide)); }
  if (id === 'poncho') return anotado(progreso, 'poncho') || tiene(progreso, 'poncho');
  return Object.hasOwn(PRENDAS, id);
}

// Cuánto abriga lo que llevás puesto.
export function abrigoDeRopa(d) {
  const x = sanearPersonaje(d);
  let n = 0;
  for (const k of Object.keys(PRENDAS)) if (x[k]) n += PRENDAS[k].abrigo;
  return n;
}
// 2.8: la ropa en una noche de invierno sin fuego (ver abrigo.js / dormir en main.js).
// Con poncho, gorro y bufanda (o guantes en vez de algo), la noche mejora un escalón:
// 'frio' pasa a 'fresco' y 'fresco' a 'normal'. Lo que ya era bueno queda igual.
export function templarNoche(como, d) {
  if (abrigoDeRopa(d) < ABRIGO_QUE_TEMPLA) return como;
  if (como === 'frio') return 'fresco';
  if (como === 'fresco') return 'normal';
  return como;
}

// Los colores ya resueltos, para la malla del cuerpo.
export function aspecto(d) {
  const x = sanearPersonaje(d);
  const l = (id) => de(LANAS, id).color;
  return {
    piel: de(PIELES, x.piel).color,
    pelo: de(PELOS, x.pelo).color,
    peinado: x.peinado,
    ancho: de(CONTEXTURAS, x.contextura).ancho,
    campera: l(x.campera),
    poncho: x.poncho ? l(x.colorPoncho) : null,
    gorro: x.gorro ? l(x.colorGorro) : null,
    bufanda: x.bufanda ? l(x.colorBufanda) : null,
    guantes: x.guantes ? l(x.colorGuantes) : null,
    botas: de(BOTAS, x.botas).color,
    botasAltas: x.botas === 'goma',
    pantalon: '#3f3a33',
  };
}
// Para la mano en primera persona (y para quien dibuje algo en la mano, como enmano.js):
// la manga es del poncho si lo llevás, si no de la campera; la mano, guante o piel.
export const colorManga = (progreso) => { const a = aspecto(progreso?.personal?.personaje); return a.poncho || a.campera; };
export const colorMano = (progreso) => { const a = aspecto(progreso?.personal?.personaje); return a.guantes || a.piel; };

// ---------------------------------------------------------------- el panel
function construir(cont, api) {
  const d = api.datos;
  const p = api.progreso;
  const redibujar = () => { cont.innerHTML = ''; construir(cont, api); };
  const cambiar = (parcial) => { api.cambiar(parcial); redibujar(); };
  const opcionesLana = LANAS.map((l) => ({ valor: l.id, color: l.color, texto: l.nombre, bloqueado: !desbloqueado(p, `lana:${l.id}`), titulo: l.ayuda }));

  cont.appendChild(parrafo('Así te ven la sombra, las fotos del modo foto y tus manos. La ropa abriga de verdad: con poncho, gorro y bufanda una noche de invierno sin fuego se pasa mejor.'));
  fila(cont, 'Piel', muestras(PIELES.map((x) => ({ valor: x.id, color: x.color, texto: x.nombre })), d.piel, (v) => cambiar({ piel: v }), 'Tono de piel'));
  fila(cont, 'Pelo', muestras(PELOS.map((x) => ({ valor: x.id, color: x.color, texto: x.nombre })), d.pelo, (v) => cambiar({ pelo: v }), 'Color de pelo'));
  fila(cont, 'Peinado', segmentos(PEINADOS.map((x) => ({ valor: x.id, texto: x.nombre })), d.peinado, (v) => cambiar({ peinado: v })));
  fila(cont, 'Contextura', segmentos(CONTEXTURAS.map((x) => ({ valor: x.id, texto: x.nombre })), d.contextura, (v) => cambiar({ contextura: v })));
  fila(cont, 'Campera', muestras(opcionesLana, d.campera, (v) => cambiar({ campera: v }), 'Color de la campera'));
  for (const k of Object.keys(PRENDAS)) {
    const pr = PRENDAS[k];
    const hay = desbloqueado(p, k);
    const color = `color${k[0].toUpperCase()}${k.slice(1)}`;
    const caja = document.createElement('div');
    caja.className = 'personal-prenda';
    if (!hay) caja.appendChild(parrafo(`Todavía no tenés. ${pr.ayuda || ''}`.trim(), 'personal-bloqueado'));
    else {
      caja.appendChild(siNo(d[k], (v) => cambiar({ [k]: v }), ['Puesto', 'Sin']));
      if (d[k]) caja.appendChild(muestras(opcionesLana, d[color], (v) => cambiar({ [color]: v }), `Color: ${pr.nombre}`));
    }
    fila(cont, pr.nombre, caja);
  }
  fila(cont, 'Botas', segmentos(BOTAS.map((b) => ({ valor: b.id, texto: b.nombre, bloqueado: !desbloqueado(p, `botas:${b.id}`), titulo: b.ayuda })), d.botas, (v) => cambiar({ botas: v })));
  const n = abrigoDeRopa(d);
  cont.appendChild(parrafo(n >= ABRIGO_QUE_TEMPLA
    ? 'Vas bien abrigado: en invierno, sin fuego, la noche se pasa un escalón mejor.'
    : `Abrigo: ${n} de ${ABRIGO_QUE_TEMPLA}. Con poncho, gorro y bufanda la ropa ya ayuda de noche.`));
}

export const SECCION_PERSONAJE = registrarSeccion({
  id: 'personaje',
  titulo: 'Tu personaje',
  orden: 10,
  porDefecto: personajeDefecto,
  sanear: sanearPersonaje,
  construir,
  // lo lleva al mundo main.js (api.mundo.personaje, ver personal-personaje-mundo.js)
  aplicar: (datos, api) => { api?.mundo?.personaje?.aplicar?.(datos); },
});

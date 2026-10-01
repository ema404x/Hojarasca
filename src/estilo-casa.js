// 2.8: el estilo de tu refugio, tus casas, tu fortín y tu jardín. Módulo puro (sin three
// ni DOM): lo importan construccion.js y estructuras.js (en el juego y en las pruebas de
// Node que arman las obras en una VM) y personal-casa.js (el panel "Personalizar").
//
// `ESTILO` es el estado vivo: personal-casa.js lo escribe en su `aplicar` y las obras lo
// leen cuando se rehacen. Las obras que ya existen se vuelven a armar sólo si su "firma"
// de estilo cambió (ver `firmaEstiloObra` y `repintar` en construccion.js).
import { hexALineal } from './tintes.js';

// ---------------------------------------------------------------- las paletas
// `valor: null` es la madera (o el techo) como vino: no se pinta nada.
export const PINTURAS_PARED = [
  { valor: null, color: '#6e5238', nombre: 'Madera natural' },
  { valor: '#e6e1d3', color: '#e6e1d3', nombre: 'Cal' },
  { valor: '#b0773a', color: '#b0773a', nombre: 'Ocre' },
  { valor: '#8a3b2e', color: '#8a3b2e', nombre: 'Colorado' },
  { valor: '#d4b24c', color: '#d4b24c', nombre: 'Amarillo' },
  { valor: '#7fa3b8', color: '#7fa3b8', nombre: 'Celeste' },
  { valor: '#5d7a52', color: '#5d7a52', nombre: 'Verde' },
  { valor: '#6b4a78', color: '#6b4a78', nombre: 'Calafate' },
  { valor: '#8c8c86', color: '#8c8c86', nombre: 'Gris' },
];
export const PINTURAS_ABERTURAS = [
  { valor: null, color: '#4a3b2c', nombre: 'Madera natural' },
  { valor: '#3f5a44', color: '#3f5a44', nombre: 'Verde inglés' },
  { valor: '#35557a', color: '#35557a', nombre: 'Azul' },
  { valor: '#8a2f2a', color: '#8a2f2a', nombre: 'Colorado' },
  { valor: '#e8e4da', color: '#e8e4da', nombre: 'Blanco' },
  { valor: '#d4a23a', color: '#d4a23a', nombre: 'Amarillo' },
  { valor: '#2b2724', color: '#2b2724', nombre: 'Negro' },
];
export const PINTURAS_TECHO = [
  { valor: null, color: '#45382f', nombre: 'Tablas' },
  { valor: '#8e3a2c', color: '#8e3a2c', nombre: 'Chapa colorada' },
  { valor: '#4f6b4a', color: '#4f6b4a', nombre: 'Chapa verde' },
  { valor: '#7a7c7e', color: '#7a7c7e', nombre: 'Chapa gris' },
  { valor: '#3e5270', color: '#3e5270', nombre: 'Chapa azul' },
  { valor: '#9a7b58', color: '#9a7b58', nombre: 'Tejuela clara' },
];

// Lo de adentro del refugio: lugares fijos y qué puede ir en cada uno.
export const LUGARES_INTERIOR = [
  { id: 'alfombra', nombre: 'Alfombra', opciones: [['nada', 'Nada'], ['lana-roja', 'Lana colorada'], ['lana-cruda', 'Lana cruda'], ['guarda', 'Guarda pampa'], ['cuero', 'Cuero de oveja']] },
  { id: 'rincon', nombre: 'Rincón de la ventana', opciones: [['nada', 'Nada'], ['sillon', 'Sillón'], ['mecedora', 'Mecedora'], ['maceta', 'Maceta con helecho'], ['baul', 'Baúl']] },
  { id: 'rinconPuerta', nombre: 'Rincón de la puerta', opciones: [['nada', 'Nada'], ['perchero', 'Perchero con poncho'], ['maceta', 'Maceta con helecho'], ['baul', 'Baúl']] },
  { id: 'ventana', nombre: 'Alféizar', opciones: [['nada', 'Nada'], ['macetas', 'Macetitas con flores'], ['frascos', 'Frascos de colores'], ['vela', 'Vela']] },
  { id: 'mesa', nombre: 'Sobre la mesa', opciones: [['nada', 'Nada'], ['florero', 'Florero'], ['mate', 'Mate y pava'], ['candil', 'Candil'], ['libros', 'Libros']] },
];
// Los cuadros: cada uno muestra una de tus fotos (el id del desafío de fotos) o nada.
export const CUADROS = [
  { id: 'cuadroCostado', nombre: 'Cuadro de la pared del costado' },
  { id: 'cuadroCama', nombre: 'Cuadro sobre la cama' },
];
export const FAROLES = [['nada', 'Ninguno'], ['dos', 'Dos en la entrada'], ['cuatro', 'Cuatro por el sendero']];
export const CERCOS = [['nada', 'Ninguno'], ['palos', 'Palo a pique'], ['varas', 'Cerco de varas'], ['pirca', 'Pirca baja']];

// El fortín: cómo se ve la madera, el estandarte y el color del fuego de las antorchas.
export const MADERAS_FORTIN = [['rustica', 'Madera rústica'], ['pirca', 'Con pie de pirca'], ['pintada', 'Madera pintada']];
export const PINTURAS_FORTIN = [
  { valor: '#8a3b2e', color: '#8a3b2e', nombre: 'Colorado' },
  { valor: '#35557a', color: '#35557a', nombre: 'Azul' },
  { valor: '#3f5a44', color: '#3f5a44', nombre: 'Verde' },
  { valor: '#e6e1d3', color: '#e6e1d3', nombre: 'Cal' },
  { valor: '#2b2724', color: '#2b2724', nombre: 'Negro' },
  { valor: '#b0773a', color: '#b0773a', nombre: 'Ocre' },
];
export const ESTANDARTES = [
  { valor: null, color: '#6b5238', nombre: 'Sin estandarte' },
  { valor: '#b8342f', color: '#b8342f', nombre: 'Rojo notro' },
  { valor: '#2f5a74', color: '#2f5a74', nombre: 'Azul lago' },
  { valor: '#d9a23a', color: '#d9a23a', nombre: 'Amarillo' },
  { valor: '#4f6b2a', color: '#4f6b2a', nombre: 'Verde lenga' },
  { valor: '#e8e2d6', color: '#e8e2d6', nombre: 'Blanco lana' },
  { valor: '#2a2723', color: '#2a2723', nombre: 'Negro' },
];
// `fuego` son los colores de siempre (desafio-defensas.js): elegirlo deja todo igual.
export const LLAMAS = {
  fuego: { nombre: 'Fuego de leña', llama: '#ffb347', halo: '#ff9a3d', charco: '#ffb066', luz: '#ff9a45' },
  cobre: { nombre: 'Verde de cobre', llama: '#8dffb4', halo: '#3fd98a', charco: '#6fe0a0', luz: '#5fe09a' },
  azufre: { nombre: 'Azul de azufre', llama: '#9cc0ff', halo: '#5a7dff', charco: '#7f9cff', luz: '#6f8cff' },
  sal: { nombre: 'Amarillo de sal', llama: '#fff07a', halo: '#ffd23d', charco: '#ffe066', luz: '#ffd84a' },
};
export const ORDEN_LLAMAS = ['fuego', 'cobre', 'azufre', 'sal'];

// El jardín: la paleta con la que nacen los canteros, los setos y las sendas nuevas.
export const FLORES = {
  amancay: { nombre: 'Amancay', colores: ['#f2a93b', '#f7c548', '#e8892f'], centro: '#c0582a' },
  lupinos: { nombre: 'Lupinos', colores: ['#8e6bbf', '#c77dbb', '#6f7fd1', '#e3a3c9'], centro: '#f2ead8' },
  chilco: { nombre: 'Chilco', colores: ['#c2264b', '#8f1d4f', '#d8475f'], centro: '#5b2a6e' },
  margaritas: { nombre: 'Margaritas', colores: ['#f4f1e6', '#fff7d6', '#ece6d3'], centro: '#e0b12a' },
  mosqueta: { nombre: 'Rosa mosqueta', colores: ['#e79ab0', '#f1b8c8', '#d8738f'], centro: '#f2d15a' },
  mezcla: { nombre: 'De todo un poco', colores: ['#f2a93b', '#8e6bbf', '#c2264b', '#f4f1e6', '#e79ab0', '#6f7fd1'], centro: '#e0b12a' },
};
export const SETOS = {
  calafate: { nombre: 'Calafate', hoja: '#3d5530', fruto: '#4b2f5e' },
  ligustro: { nombre: 'Ligustro podado', hoja: '#4f6b36', fruto: null },
  mosqueta: { nombre: 'Rosa mosqueta', hoja: '#566b38', fruto: '#e79ab0' },
};
export const SENDAS = {
  laja: { nombre: 'Lajas', colores: ['#8a8680', '#7d7a74', '#969089'] },
  canto: { nombre: 'Canto rodado', colores: ['#a19a8c', '#8f887b', '#b3ab9c', '#7f786d'] },
  ladrillo: { nombre: 'Ladrillo', colores: ['#9a5a3e', '#a8664a', '#8a4f36'] },
};

export const refugioDefecto = () => ({
  pared: null, aberturas: null, techo: null,
  casas: { pared: null, aberturas: null, techo: null },
  interior: { alfombra: 'nada', rincon: 'nada', rinconPuerta: 'nada', ventana: 'nada', mesa: 'nada', cuadroCostado: '', cuadroCama: '' },
  // el mástil viene puesto: ahí flamea tu bandera (personal-bandera.js)
  exterior: { faroles: 'nada', cerco: 'nada', mastil: true },
});
export const fortinDefecto = () => ({ madera: 'rustica', pintura: '#8a3b2e', estandarte: null, llama: 'fuego' });
export const jardinDefecto = () => ({ flores: 'amancay', seto: 'calafate', senda: 'laja' });

// ---------------------------------------------------------------- el estado vivo
export const ESTILO = {
  casas: { pared: null, aberturas: null, techo: null },
  fortin: fortinDefecto(),
  jardin: jardinDefecto(),
  version: 0,
};
export function fijarEstilo(parte, datos) {
  if (!Object.hasOwn(ESTILO, parte) || parte === 'version' || !datos || typeof datos !== 'object') return false;
  const antes = JSON.stringify(ESTILO[parte]);
  ESTILO[parte] = JSON.parse(JSON.stringify(datos));
  if (antes === JSON.stringify(ESTILO[parte])) return false;
  ESTILO.version++;
  return true;
}

// ---------------------------------------------------------------- marcar lo que se arma
// Envuelve `agregar` de un Constructor (geometria.js) para anotar qué vértices salió de
// cada pieza, con su color y la zona que se esté armando. Así después se puede pintar
// "las paredes" o "el techo" sin tocar el resto, y sin cambiar cómo se arma nada.
export function marcarConstructor(c) {
  const marcas = [];
  marcas.zona = null;
  marcas.etapa = '';
  const agregar = c.agregar;
  c.agregar = function (geo, o) {
    const v0 = this.pos.length / 3;
    const r = agregar.call(this, geo, o);
    marcas.push({ v0, v1: this.pos.length / 3, color: typeof o?.color === 'string' ? o.color.toLowerCase() : null, zona: marcas.zona, etapa: marcas.etapa });
    return r;
  };
  return marcas;
}

// ---------------------------------------------------------------- qué se pinta de cada obra
const MADERA_OSCURA_OBRA = '#4a3b2c';
const TECHOS_OBRA = new Set(['#4e4038', '#453a30', '#44382f']);
const NO_PINTAR = new Set(['#91a7a3']);   // el vidrio de la casilla
const MADERAS_OBRA = new Set(['#6b5238', '#4a3b2c', '#8a6b4a', '#5f4a33', '#7a5f43', '#765b41', '#6a4f36']);

// Zona de una pieza de tus casas: 'pared', 'aberturas' (marcos, postes, jambas), 'techo' o null.
export function zonaCasa(plano, etapa, color) {
  if (!plano || plano.categoria !== 'refugios' || !color || NO_PINTAR.has(color)) return null;
  const tipo = plano.snap?.tipo;
  if (tipo === 'piso' || tipo === 'entrepiso' || tipo === 'acceso' || tipo === 'baranda') return null;
  if (tipo === 'techo' || (!plano.pieza && /techo/i.test(etapa || ''))) return TECHOS_OBRA.has(color) ? 'techo' : null;
  const pared = tipo === 'muro' || tipo === 'pilar' || (!plano.pieza && /pared|cerramiento/i.test(etapa || ''));
  if (!pared) return null;
  return color === MADERA_OSCURA_OBRA ? 'aberturas' : 'pared';
}
// Zona de una defensa: sólo la madera se pinta (la piedra, el hierro y el cristal no).
export function zonaFortin(plano, color) {
  return plano?.categoria === 'defensa' && color && MADERAS_OBRA.has(color) ? 'madera' : null;
}

const colorValido = (v) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
function pinturaLimpia(p) {
  const x = p && typeof p === 'object' ? p : {};
  return {
    pared: colorValido(x.pared) ? x.pared.toLowerCase() : null,
    aberturas: colorValido(x.aberturas) ? x.aberturas.toLowerCase() : null,
    techo: colorValido(x.techo) ? x.techo.toLowerCase() : null,
  };
}
export const hayPintura = (p) => !!p && !!(p.pared || p.aberturas || p.techo);

// La pintura que le toca a una obra de tus casas: la suya (elegida en el panel para esa
// casa), si no el tinte de la tecla T manda (null: nada encima), si no la paleta general.
export function pinturaDeObra(plano, datos) {
  if (plano?.categoria !== 'refugios') return null;
  if (datos && datos.pintura && typeof datos.pintura === 'object') return pinturaLimpia(datos.pintura);
  if (datos?.tinte) return null;
  const g = pinturaLimpia(ESTILO.casas);
  return hayPintura(g) ? g : null;
}

// Las obras del fortín que llevan estandarte y dónde (coordenadas locales de la pieza).
// `lado`: hacia dónde cuelga el paño (-1: hacia el paso del portón, para no invadir el
// tramo vecino).
export const ESTANDARTE_EN = {
  'torre-vigia': { x: -1.05, z: 1.05, y0: 3.3, alto: 1.6, lado: 1 },   // la otra esquina lleva tu bandera
  'porton-empalizada': { x: 1.42, z: 0, y0: 2.45, alto: 1.3, lado: -1 },
  'porton-reforzado': { x: 1.42, z: 0, y0: 2.55, alto: 1.3, lado: -1 },
  'muro-almenado': { x: 0, z: 0, y0: 2.45, alto: 1.25, lado: 1 },
};
// Dónde va el pie de pirca: tramos [ax, az, bx, bz] locales (la torre, al pie de cada poste).
// El paso del portón queda libre.
export const PIE_PIRCA = {
  empalizada: [[-1.5, 0, 1.5, 0]],
  'porton-empalizada': [[-1.55, 0, -1.0, 0], [1.0, 0, 1.55, 0]],
  campana: [[-0.66, 0, -0.34, 0], [0.34, 0, 0.66, 0]],
  embudo: [[-0.7, -1.2, -3.2, 1.6], [0.7, -1.2, 3.2, 1.6]],
};
export const POSTES_TORRE = [[-1.05, -1.05], [1.05, -1.05], [-1.05, 1.05], [1.05, 1.05]];

// Lo que define cómo se ve una obra según el estilo. Si no cambió, no se rehace.
export function firmaEstiloObra(plano, datos) {
  if (!plano) return '';
  if (plano.categoria === 'refugios') {
    // pisos, entrepisos, escaleras y barandas no tienen nada que pintar: no se rehacen
    if (['piso', 'entrepiso', 'acceso', 'baranda'].includes(plano.snap?.tipo)) return '';
    const p = pinturaDeObra(plano, datos);
    return p ? `c|${p.pared}|${p.aberturas}|${p.techo}` : '';
  }
  if (plano.categoria === 'defensa') {
    const f = ESTILO.fortin || fortinDefecto();
    const pirca = f.madera === 'pirca' && (Object.hasOwn(PIE_PIRCA, plano.id) || plano.id === 'torre-vigia');
    const pintada = f.madera === 'pintada' ? f.pintura : '';
    const est = Object.hasOwn(ESTANDARTE_EN, plano.id) && f.estandarte ? f.estandarte : '';
    return pirca || pintada || est ? `f|${pirca ? 1 : 0}|${pintada}|${est}` : '';
  }
  if (plano.jardin) return `j|${estiloJardinDe(plano, datos)}`;
  return '';
}

// ---------------------------------------------------------------- el jardín
const TABLA_JARDIN = { flores: FLORES, seto: SETOS, senda: SENDAS };
// El estilo de una pieza de jardín: el que se eligió al plantarla o, si no tiene, el actual.
export function estiloJardinDe(plano, datos) {
  const tipo = plano?.jardin;
  if (!tipo || !Object.hasOwn(TABLA_JARDIN, tipo)) return null;
  const tabla = TABLA_JARDIN[tipo];
  const propio = datos && typeof datos.jardin === 'string' ? datos.jardin : null;
  if (propio && Object.hasOwn(tabla, propio)) return propio;
  const actual = ESTILO.jardin?.[tipo];
  return actual && Object.hasOwn(tabla, actual) ? actual : Object.keys(tabla)[0];
}

// ---------------------------------------------------------------- pintar colores por vértice
const luz = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
// Pinta los vértices de `rangos` ([[v0, v1], …]) de un arreglo de colores lineales. La
// veta se conserva: cada vértice queda tan claro u oscuro respecto de la media como era.
export function pintarRangos(a, rangos, hex, fuerza = 0.82) {
  if (!a || !colorValido(hex) || !rangos?.length) return 0;
  const [tr, tg, tb] = hexALineal(hex);
  let media = 0, n = 0;
  for (const [v0, v1] of rangos) for (let v = v0; v < v1; v++) { media += luz(a[v * 3], a[v * 3 + 1], a[v * 3 + 2]); n++; }
  if (!n) return 0;
  media = Math.max(0.004, media / n);
  for (const [v0, v1] of rangos) {
    for (let v = v0; v < v1; v++) {
      const i = v * 3;
      const rel = Math.min(1.6, Math.max(0.35, luz(a[i], a[i + 1], a[i + 2]) / media));
      a[i] = a[i] * (1 - fuerza) + tr * rel * fuerza;
      a[i + 1] = a[i + 1] * (1 - fuerza) + tg * rel * fuerza;
      a[i + 2] = a[i + 2] * (1 - fuerza) + tb * rel * fuerza;
    }
  }
  return n;
}
// Junta las marcas por zona: { pared: [[v0, v1], …], … }. `zonaDe(marca)` decide.
export function rangosPorZona(marcas, zonaDe) {
  const out = {};
  for (const m of marcas || []) {
    const z = zonaDe(m);
    if (!z || m.v1 <= m.v0) continue;
    (out[z] ||= []).push([m.v0, m.v1]);
  }
  return out;
}

// ---------------------------------------------------------------- tus casas, agrupadas
// Las piezas de refugio terminadas que se tocan (a menos de `radio` entre centros) son
// una misma casa. Devuelve [{ piezas, x, z, n }], la más cercana a `desde` primero.
export function agruparCasas(obras, desde = null, radio = 3.7) {
  const lista = (obras || []).filter((o) => o?.plano?.categoria === 'refugios' && o.datos &&
    Number.isFinite(o.datos.x) && Number.isFinite(o.datos.z) && o.datos.etapas >= (o.plano.etapas?.length || 1));
  const padre = lista.map((_, i) => i);
  const raiz = (i) => { while (padre[i] !== i) i = padre[i] = padre[padre[i]]; return i; };
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      const a = lista[i].datos, b = lista[j].datos;
      const r = lista[i].plano.pieza && lista[j].plano.pieza ? radio : radio + 2;
      if (Math.hypot(a.x - b.x, a.z - b.z) <= r) padre[raiz(i)] = raiz(j);
    }
  }
  const grupos = new Map();
  lista.forEach((o, i) => { const k = raiz(i); if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(o); });
  const casas = [...grupos.values()].map((piezas) => ({
    piezas,
    n: piezas.length,
    x: piezas.reduce((s, o) => s + o.datos.x, 0) / piezas.length,
    z: piezas.reduce((s, o) => s + o.datos.z, 0) / piezas.length,
  }));
  if (desde && Number.isFinite(desde.x)) casas.sort((a, b) => Math.hypot(a.x - desde.x, a.z - desde.z) - Math.hypot(b.x - desde.x, b.z - desde.z));
  return casas;
}

// ---------------------------------------------------------------- el mástil del refugio
// En coordenadas del refugio (+z sale por la puerta). Lo usa estructuras.js para plantarlo
// y cualquiera que necesite saber dónde está sin tener el mundo armado.
export const MASTIL_LOCAL = { lx: -3.7, lz: 5.4, alto: 6.2 };
export function aMundoRefugio(ref, lx, lz) {
  const r = ref?.rot || 0;
  return { x: ref.x + lx * Math.cos(r) + lz * Math.sin(r), z: ref.z - lx * Math.sin(r) + lz * Math.cos(r) };
}
export const posicionMastil = (ref) => aMundoRefugio(ref, MASTIL_LOCAL.lx, MASTIL_LOCAL.lz);

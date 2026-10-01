// 2.8: "Tu interfaz". Módulo puro (se prueba en Node): el color de los avisos de tecla,
// un retoque del tamaño de letra, la mira, la brújula y un modo con lo mínimo en pantalla.
//
// Accesibilidad primero (ver accesibilidad.js): el tamaño de letra de los ajustes sigue
// mandando; acá sólo se afina encima (×0,9 a ×1,2). Los colores de peligro, salud y aviso
// de la paleta daltónica no se tocan: el acento es sólo el borde de los avisos de tecla.
// El modo mínimo nunca esconde la salud del Desafío, los avisos ni los subtítulos.
import { registrarSeccion, elegir } from './personalizacion.js';
import { fila, segmentos, muestras, siNo, parrafo } from './personal-controles.js';

export const ACENTOS = [
  { id: 'papel', nombre: 'Papel (el de siempre)', color: '#efe6d2' },
  { id: 'musgo', nombre: 'Musgo', color: '#a9c46a' },
  { id: 'notro', nombre: 'Notro', color: '#ff7a5c' },
  { id: 'lago', nombre: 'Lago', color: '#7cc4f0' },
  { id: 'calafate', nombre: 'Calafate', color: '#c9a2f2' },
  { id: 'sol', nombre: 'Sol', color: '#ffd56a' },
];
export const LETRAS = [
  { valor: 0.9, nombre: 'Un poco más chica' },
  { valor: 1, nombre: 'Como en los ajustes' },
  { valor: 1.1, nombre: 'Un poco más grande' },
  { valor: 1.2, nombre: 'Más grande' },
];
export const MIRAS = [
  { id: 'punto', nombre: 'Punto' },
  { id: 'cruz', nombre: 'Cruz' },
  { id: 'circulo', nombre: 'Círculo' },
  { id: 'ninguna', nombre: 'Sin mira' },
];

export const interfazDefecto = () => ({ acento: 'papel', letra: 1, mira: 'punto', brujula: true, minimalista: false });
export function sanearInterfaz(d) {
  const x = d && typeof d === 'object' ? d : {};
  const b = interfazDefecto();
  return {
    acento: elegir(x.acento, ACENTOS.map((a) => a.id), b.acento),
    letra: elegir(Number(x.letra), LETRAS.map((l) => l.valor), b.letra),
    mira: elegir(x.mira, MIRAS.map((m) => m.id), b.mira),
    brujula: typeof x.brujula === 'boolean' ? x.brujula : b.brujula,
    minimalista: typeof x.minimalista === 'boolean' ? x.minimalista : b.minimalista,
  };
}
export const colorAcento = (id) => (ACENTOS.find((a) => a.id === id) || ACENTOS[0]).color;
// La escala final de la letra: la de accesibilidad por el retoque propio.
export const escalaFinal = (escalaAccesibilidad, d) => Math.round((Number(escalaAccesibilidad) || 1) * sanearInterfaz(d).letra * 1000) / 1000;
// Las clases que main.js pone en el HUD (puro: se prueba sin DOM).
export function clasesHud(d) {
  const x = sanearInterfaz(d);
  return {
    minimalista: x.minimalista,
    'sin-brujula': !x.brujula,
    [`mira-${x.mira}`]: true,
  };
}

function construir(cont, api) {
  const d = api.datos;
  const redibujar = () => { cont.innerHTML = ''; construir(cont, api); };
  const cambiar = (parcial) => { api.cambiar(parcial); redibujar(); };
  cont.appendChild(parrafo('Cómo se ve lo que está encima del bosque. El tamaño de letra grande y los colores para daltonismo siguen en los Ajustes de la pausa: esto se suma a eso.'));
  fila(cont, 'Color de los avisos', muestras(ACENTOS.map((a) => ({ valor: a.id, color: a.color, texto: a.nombre })), d.acento, (v) => cambiar({ acento: v }), 'Color de acento'),
    'El borde de los avisos de tecla («E · Hablar»).');
  fila(cont, 'Tamaño de letra', segmentos(LETRAS.map((l) => ({ valor: l.valor, texto: l.nombre })), d.letra, (v) => cambiar({ letra: v })));
  fila(cont, 'Mira', segmentos(MIRAS.map((m) => ({ valor: m.id, texto: m.nombre })), d.mira, (v) => cambiar({ mira: v })));
  fila(cont, 'Brújula', siNo(d.brujula, (v) => cambiar({ brujula: v }), ['Mostrarla', 'Esconderla']),
    'Sin brújula tampoco se ven el rumbo de tus chinches ni los invasores en el borde.');
  fila(cont, 'Modo mínimo', siNo(d.minimalista, (v) => cambiar({ minimalista: v }), ['Lo mínimo', 'Todo']),
    'Esconde ramitas, encargos, equipo y la barra (aparece un momento al cambiar de mano). Quedan los avisos, la salud y los subtítulos.');
}

export const SECCION_INTERFAZ = registrarSeccion({
  id: 'interfaz',
  titulo: 'Tu interfaz',
  orden: 20,
  porDefecto: interfazDefecto,
  sanear: sanearInterfaz,
  construir,
  aplicar: (datos, api) => { api?.mundo?.interfaz?.aplicar?.(datos); },
});

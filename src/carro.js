// 4.11.5: el carro del caballo. Módulo puro (sin three ni DOM; se prueba en Node).
//
// Se hace en TU carpintería (el banco de carpintero que construís) con tablas, troncos y el hierro de las llantas, los ejes y los
// herrajes (lo forja Anselmo: se paga en pesos). Una vez hecho, queda en tu poder para siempre: se engancha o se desengancha del
// caballo en «Personalizar → Tu caballo» (como las alforjas). Enganchado y con vos montado, suma 16 casillas a la mochila
// (CASILLAS_CARRO, en carga.js). Desenganchado, el carro se guarda: no ocupa lugar en el mundo.
//
// El estado vive en `progreso.personal.caballo` (personal-caballo.js): `carro` (¿lo hiciste?) y `enganchado` (¿va detrás del caballo?).
// Una partida vieja no tiene esos campos y se abre sin carro, igual que antes. Sólo en el Relax.
import { CASILLAS_CARRO } from './carga.js';
import { formatoPesos } from './economia.js';

// Lo que pide el carro: materiales (tablas del piso y las barandas, troncos de las varas y los ejes) y pesos por el hierro.
export const CARRO = { pide: { tabla: 14, tronco: 4 }, pesos: 6000 };

// La distancia del eje de las ruedas al enganche del caballo (m), y el alto del enganche; los usa el dibujo (caballo-mundo.js)
export const ENGANCHE = { largo: 2.05, atras: 1.25, alto: 0.98 };

const entero = (v) => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n > 0 ? n : 0; };

export const tieneCarro = (cab) => cab?.carro === true;
export const carroEnganchado = (cab) => cab?.carro === true && cab?.enganchado === true;
// Cuántas casillas suma si estuvieras montado (0 si no hay carro enganchado): para el renglón de la mochila
export const casillasDelCarro = (cab) => (carroEnganchado(cab) ? CASILLAS_CARRO : 0);

const NOMBRE = { tabla: ['tabla', 'tablas'], tronco: ['tronco', 'troncos'] };
const plural = (k, n) => `${n} ${NOMBRE[k][n === 1 ? 0 : 1]}`;

// Lo que pide, dicho de corrido: «14 tablas, 4 troncos y $6.000 de hierro»
export function textoPedido() {
  return `${Object.keys(CARRO.pide).map((k) => plural(k, CARRO.pide[k])).join(', ')} y ${formatoPesos(CARRO.pesos)} de hierro`;
}

// ¿Alcanza? tengo(k) → cuántas unidades de ese material tenés; pesos: cuánta plata. Devuelve { ok, falta: ['3 tablas', ...] }
export function faltaParaElCarro(tengo, pesos) {
  const falta = [];
  for (const k of Object.keys(CARRO.pide)) {
    const f = CARRO.pide[k] - entero(tengo(k));
    if (f > 0) falta.push(plural(k, f));
  }
  const fp = CARRO.pesos - entero(pesos);
  if (fp > 0) falta.push(`${formatoPesos(fp)} de hierro`);
  return { ok: falta.length === 0, falta };
}

// El caballo ya con el carro hecho y enganchado (no toca el original). Si ya lo tenía, igual.
export const conCarroHecho = (cab) => ({ ...(cab || {}), carro: true, enganchado: true });

// Lo que dice el banco de carpintero. cab: los datos del caballo; tengo/pesos como arriba; hayCaballo: ¿tenés caballo?
export function avisoCarro(cab, tengo, pesos) {
  if (tieneCarro(cab)) return cab.enganchado === true ? 'Tu carro va enganchado al caballo' : 'Tu carro está guardado: enganchalo en Personalizar, «Tu caballo»';
  const f = faltaParaElCarro(tengo, pesos);
  return f.ok ? `Hacer el carro del caballo (${textoPedido()})` : `El carro del caballo: ${textoPedido()}`;
}

// Lo que dice el aviso del banco de carpintero ya con el carro: se suma a lo de siempre (más madera en cada obra)
export const textoCasillasCarro = () => `Enganchado y montado, suma ${CASILLAS_CARRO} casillas a la mochila`;

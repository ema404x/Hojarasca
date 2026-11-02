// 4.17.0: la tarjeta final de la Historia («El trato del molino»), armada con piezas según el estado (GUION_HISTORIA.md, capítulo 13). Módulo PURO (se prueba en Node).
// Las dos mitades son los dos finales: A (el trato: se sigue con la costumbre de la bolsa) y B (la pelea: el valle quedó tranquilo). Después se agregan las piezas
// que corresponden (el ramal, la majada, la escuela, Graciela, la noche perdida) y, siempre, la última.
import { estadoRamal, lazoDe } from './historia.js';
import { finalDeLazos } from './historia-texto-lazos.js';

export const FINAL_A = [
  'El valle sigue raro. Las herramientas a veces amanecen en otro lado, el pan de Rosa crece de más, Nicanor ve luces sobre el lago y ya nadie se ríe de él. Cada cosecha, una bolsa del molino se deja en el umbral. Nadie la ve irse.',
  'Eusebio tenía razón: no hay que tenerles miedo ni confianza. Hay que tener trato. Como con los vecinos.',
];
export const FINAL_B = [
  'El valle quedó tranquilo. Las herramientas amanecen donde las dejás y el pan crece lo que tiene que crecer.',
  'A veces, de noche, te parece oír una risa lejos, y te quedás quieto, esperando. Nunca es. O casi nunca.',
  'Herminia dice que los vecinos que se van, a veces vuelven. Que hay que dejar la puerta entornada. Vos la dejás.',
];
export const PIEZAS_FINAL = {
  ramalSalvado: 'La trochita pasa todos los días, con el silbato largo en la curva del puente. Elsa saluda con la mano.',
  ramalAPrueba: 'La trochita pasa tres veces por semana. Cada vez que pasa, la mirás hasta que se pierde.',
  majadaA: 'En la estepa hay un puesto nuevo, con un cartel pintado a mano. Ramón lo visita los domingos y lo critica.',
  escuela: 'En la escuela de la aldea, los chicos dibujan puertitas. Ninguno toca una raíz.',
  graciela: 'Graciela alquiló la casa de al lado del hospedaje. Dice que es para contar mejor.',
  nochePerdida: 'El galpón tiene una pared nueva, mal clavada. No la cambiaste.',
  siempre: 'La historia termina acá, pero el valle no. Queda todo por andar. Tomate tu tiempo: acá nadie tiene apuro, y el que tiene, se le pasa.',
};

// 4.18.2: una línea corta de epílogo por cada vecino con lazo de la casa (>= 3 casi todos) y, donde el guion lo justifique (Tito), una tirante (lazo < 0). Las escribe B
// (TEXTO_LAZOS.final[quien] = [{ id, min?, max?, texto }]) y `finalDeLazos` las elige y las ordena; si falta un vecino, no sale nada. Van después de la de Graciela.
// 4.19.0: `finalDeLazos(lazoDe, final)` sabe el final (trato o pelea): hay líneas que sólo valen con uno (la de Nicanor y las luces del lago, con el valle tranquilo, no).
export function piezasLazos(h, trato = 'trato') {
  let r = [];
  try { r = finalDeLazos((q) => lazoDe(h, q), trato === 'pelea' ? 'pelea' : 'trato'); } catch { r = []; }
  return (Array.isArray(r) ? r : []).map((t) => (typeof t === 'string' ? t : t?.texto)).filter((t) => typeof t === 'string' && t);
}

// 4.19.0: con los siete vecinos de la casa la tarjeta final suma siete párrafos más y quedaba con scroll. Se parte en páginas: cada una con el largo que se lee cómodo en la
// tarjeta sin barra (TOPE_PAGINA caracteres), sin cortar nunca un párrafo, con el cierre («La historia termina acá…») siempre en la última, acompañado, y con lugar en la última para
// el premio y los dos botones. Una tarjeta corta (el final sin vecinos, hasta TOPE_UNICA caracteres) queda en una sola página, como antes.
export const TOPE_PAGINA = 560;
// lo que ocupan en la última página el premio y los dos botones, medido en caracteres de texto (la última tiene que dejarles lugar)
export const RESERVA_ULTIMA = 160;
export const TOPE_UNICA = 620;
export function paginarFinal(texto, tope = TOPE_PAGINA) {
  const t = (Array.isArray(texto) ? texto : []).filter((x) => typeof x === 'string' && x);
  const max = Math.max(200, Math.floor(Number(tope) || TOPE_PAGINA));
  if (!t.length) return [];
  if (t.reduce((s, x) => s + x.length, 0) <= TOPE_UNICA) return [t];
  // la última página se arma desde el cierre hacia atrás, con lugar para el premio y las dos salidas (el cierre va siempre, y acompañado si entra algo más)
  let i = t.length - 1, largo = t[i].length;
  while (i > 0 && largo + t[i - 1].length + RESERVA_ULTIMA <= max) { i--; largo += t[i].length; }
  const ultima = t.slice(i);
  const paginas = [];
  let actual = [], suma = 0;
  for (const p of t.slice(0, i)) {
    if (actual.length && suma + p.length > max) { paginas.push(actual); actual = []; suma = 0; }
    actual.push(p); suma += p.length;
  }
  if (actual.length) paginas.push(actual);
  paginas.push(ultima);
  return paginas;
}

// { titulo, subtitulo, texto: [párrafos], paginas: [[párrafos]], final: 'trato' | 'pelea' } para un historial dado (`h` = progreso.historia)
export function tarjetaFinal(h) {
  const trato = h?.duendes?.trato === 'pelea' ? 'pelea' : 'trato';
  const texto = [...(trato === 'trato' ? FINAL_A : FINAL_B)];
  const ramal = estadoRamal(h);
  if (ramal === 'salvado') texto.push(PIEZAS_FINAL.ramalSalvado);
  else texto.push(PIEZAS_FINAL.ramalAPrueba);
  if (h?.decisiones?.majada === 'a') texto.push(PIEZAS_FINAL.majadaA);
  if (h?.decisiones?.cuaderno === 'a') texto.push(PIEZAS_FINAL.escuela);
  if (lazoDe(h, 'graciela') >= 3) texto.push(PIEZAS_FINAL.graciela);
  texto.push(...piezasLazos(h, trato));   // 4.18.2 (4.19.0: con el final, para las líneas que sólo valen con uno)
  if (h?.duendes?.noche === 'perdida') texto.push(PIEZAS_FINAL.nochePerdida);
  texto.push(PIEZAS_FINAL.siempre);
  return { titulo: trato === 'trato' ? 'El trato' : 'La pelea', arriba: 'La historia del valle · final', texto, paginas: paginarFinal(texto), final: trato };
}

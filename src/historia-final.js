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

// 4.22.0: «el valle se acuerda». Una línea por cada decisión grande (D1 a D5, y la firmeza del trato de la D6), según cómo la tomaste: hasta hoy sólo la D4 A y la D5 A
// tenían la suya (`escuela` y `majadaA`, arriba). Cada una cuenta qué quedó en el valle de lo que decidiste, sin números ni premios nuevos y sin nombrar el lazo. Van en el
// orden de las decisiones (D1 a D6), después del ramal y antes de Graciela y de los vecinos; cada decisión aporta como mucho una. Corta cada una (cabe en la tarjeta sin barra).
export const ECOS_FINAL = {
  bolsa: {
    a: 'Cada otoño, sobre el tocón de la raíz aparece un puñado de piñones bien juntos. Vos hacés como que no ves quién los deja.',
    b: 'La panadería de Rosa huele a algo que no sale en la receta. Ella dice que es la masa; Ercilia, que es la deuda bien llevada.',
    c: 'Josefina guarda la nota de Eusebio en el bolsillo de la camisa. A veces la saca para comparar su letra con la tuya y no sabe cuál ganó.',
  },
  coihue: {
    a: 'El coihue sigue en pie y el aserradero quedó aguas abajo. Tito jura que la caminata le hace bien a las tablas. A las piernas, no tanto.',
    b: 'Del tocón del coihue brotan renuevos que nadie plantó. Josefina los cuenta de a uno cuando cree que no la ves.',
    c: 'La pirca de Tobías abraza la raíz del coihue. Cuando baja el viento de la cantera, las piedras silban una nota grave.',
  },
  molienda: {
    a: 'Los fletes de harina siguen saliendo por la trochita. Graciela los anota con letra contenta; Ercilia todavía no los perdona.',
    b: 'El fiado largo llenó el almacén de gente cada invierno. En la mesa larga hay un lugar más por año, y siempre alguien lo ocupa.',
    c: 'Cada cosecha la harina se parte en tres: el almacén, la estación y una medida para la raíz. Nadie se pelea, y Ercilia dice que es la costumbre.',
  },
  cuaderno: {
    b: 'El cuaderno de Eusebio duerme en tu repisa, al lado del canto blanco. Josefina lo mira de reojo, como a un amigo discreto.',
    c: 'En el último tren llegó una científica con una cinta métrica. Le pidió permiso al coihue en voz baja antes de medirlo.',
  },
  majada: {
    b: 'La majada pasó el invierno en tu corral y Ramón la cuenta cada mañana. Fermín cruza el valle sin mirar para tu lado. Se le va pasando.',
    c: 'Las ovejas de Ramón pastan en el Puesto del Paso. Él baja a tomar mate y de la majada no se habla. Fermín te saluda con el sombrero y sigue.',
  },
  // D6 con la bolsa de Eusebio en el umbral (el trato firme: `decisiones.duendes === 'b'`)
  duendes: {
    b: 'La bolsa de Eusebio que pusiste en el umbral no volvió. En su lugar, cada cosecha amanece un piolín colorado con un nudo que no es tuyo.',
  },
};
// Las líneas de eco que corresponden a lo decidido, en el orden de las decisiones. La D4 A y la D5 A siguen siendo `escuela` y `majadaA` (van en su lugar).
export function piezasDecisiones(h) {
  const d = h?.decisiones && typeof h.decisiones === 'object' && !Array.isArray(h.decisiones) ? h.decisiones : {};
  const r = [];
  for (const k of ['bolsa', 'coihue', 'molienda', 'cuaderno', 'majada', 'duendes']) {
    const v = Object.hasOwn(d, k) ? d[k] : null;
    if (k === 'cuaderno' && v === 'a') { r.push(PIEZAS_FINAL.escuela); continue; }
    if (k === 'majada' && v === 'a') { r.push(PIEZAS_FINAL.majadaA); continue; }
    const t = Object.hasOwn(ECOS_FINAL, k) && (v === 'a' || v === 'b' || v === 'c') && Object.hasOwn(ECOS_FINAL[k], v) ? ECOS_FINAL[k][v] : '';
    if (t) r.push(t);
  }
  return r;
}

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
  texto.push(...piezasDecisiones(h));   // 4.22.0: una línea por decisión (D1 a D6) en su orden; la D4 A (la escuela) y la D5 A (el puesto) también salen de acá
  if (lazoDe(h, 'graciela') >= 3) texto.push(PIEZAS_FINAL.graciela);
  texto.push(...piezasLazos(h, trato));   // 4.18.2 (4.19.0: con el final, para las líneas que sólo valen con uno)
  if (h?.duendes?.noche === 'perdida') texto.push(PIEZAS_FINAL.nochePerdida);
  texto.push(PIEZAS_FINAL.siempre);
  return { titulo: trato === 'trato' ? 'El trato' : 'La pelea', arriba: 'La historia del valle · final', texto, paginas: paginarFinal(texto), final: trato };
}

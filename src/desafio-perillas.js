// 4.22.0 (A): la dificultad del Desafío en tres perillas, y lo que cuesta caer.
//
// Las tres dificultades de siempre (Tranquila, Normal, Implacable) mueven las tres cosas a la vez: cuántos duendes vienen, cuánto
// aguantan y cuánto pegan. Implacable es un salto de golpe (×1,4 de cantidad, ×1,25 de vida, ×1,35 de daño) y no había cómo subir
// una sola. Las perillas se suman a la dificultad elegida, de a cinco pasos cada una (−2 a +2), y se cambian entre una noche y otra
// (los duendes que ya bajaron siguen como estaban). En 0 no cambian nada: una partida vieja o una que nunca las tocó juega igual.
//
// Módulo puro (sin THREE ni DOM; se prueba en Node).

export const CLAVES_PERILLA = ['cantidad', 'vida', 'dano'];
export const PASO_MAXIMO = 2;
// El multiplicador de cada paso (−2, −1, 0, +1, +2). Los extremos de la cantidad y del daño son los de las dificultades
// extremas (0,6 y 1,4); la vida, que es lo que más alarga una noche, se mueve la mitad.
export const PERILLAS = {
  cantidad: { nombre: 'Cuántos duendes', ajuste: 'perillaCantidad', pasos: [0.6, 0.8, 1, 1.2, 1.4], uno: 'duendes', mas: 'más', menos: 'menos' },
  vida: { nombre: 'Cuánto aguantan', ajuste: 'perillaVida', pasos: [0.8, 0.9, 1, 1.1, 1.2], uno: 'vida', mas: 'más', menos: 'menos' },
  dano: { nombre: 'Cuánto pegan', ajuste: 'perillaDano', pasos: [0.6, 0.8, 1, 1.2, 1.4], uno: 'daño', mas: 'más', menos: 'menos' },
};
export const AJUSTES_PERILLA = Object.fromEntries(CLAVES_PERILLA.map((k) => [PERILLAS[k].ajuste, 0]));

// Un paso válido: entero de −2 a +2 (cualquier otra cosa, 0).
export function pasoDe(v) {
  if (v === null || v === '' || typeof v === 'boolean') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(-PASO_MAXIMO, Math.min(PASO_MAXIMO, Math.round(n))) : 0;
}
export const perillasNeutras = () => ({ cantidad: 0, vida: 0, dano: 0 });
export function sanearPerillas(x) {
  const r = perillasNeutras();
  if (x && typeof x === 'object' && !Array.isArray(x)) for (const k of CLAVES_PERILLA) r[k] = pasoDe(x[k]);
  return r;
}
// Las tres perillas a partir de los ajustes guardados (`perillaCantidad`, `perillaVida`, `perillaDano`).
export function perillasDeAjustes(a) {
  const r = perillasNeutras();
  if (a && typeof a === 'object') for (const k of CLAVES_PERILLA) r[k] = pasoDe(a[PERILLAS[k].ajuste]);
  return r;
}
// Lo que multiplican: { cantidad, vida, dano }.
export function multiplicadoresPerillas(p) {
  const s = sanearPerillas(p), r = {};
  for (const k of CLAVES_PERILLA) r[k] = PERILLAS[k].pasos[s[k] + PASO_MAXIMO];
  return r;
}
export const perillasEnCero = (p) => CLAVES_PERILLA.every((k) => sanearPerillas(p)[k] === 0);
// ¿Alguna perilla deja la noche más fácil que la dificultad elegida? Entonces no se anotan récords ni el logro de Implacable.
export const perillasFacilitan = (p) => CLAVES_PERILLA.some((k) => sanearPerillas(p)[k] < 0);

const porcentaje = (m) => Math.round(Math.abs(m - 1) * 100);
export function textoPerillas(p) {
  const s = sanearPerillas(p), m = multiplicadoresPerillas(s);
  if (perillasEnCero(s)) return 'Como la dificultad elegida. Se suman a ella: mové una sola si querés subir o bajar sólo eso.';
  const partes = CLAVES_PERILLA.filter((k) => s[k] !== 0)
    .map((k) => `${porcentaje(m[k])} % ${s[k] > 0 ? PERILLAS[k].mas : PERILLAS[k].menos} de ${PERILLAS[k].uno}`);
  const lista = partes.length > 1 ? `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}` : partes[0];
  return `Sobre la dificultad elegida: ${lista}.${perillasFacilitan(s) ? ' Más fácil que la dificultad: no se anotan récords ni el logro de Implacable.' : ''}`;
}

// ---------------------------------------------------------------- 4.26.1: el nombre del nivel (pendiente de la 4.22.0)
// Con las perillas, la dificultad elegida ya no dice cuánto cuesta la noche: Normal con todo en +2 es casi una Implacable y con todo en −2 casi una
// Tranquila. El nivel junta las tres cosas (cuántos vienen × cuánto aguantan × cuánto pegan: lo que hay que tumbar y lo que duele) y lo dice en cinco
// escalones con nombre, de «Tranquila» (1 de 5) a «Implacable» (5 de 5), y si queda más allá de una punta. Es sólo el nombre: no cambia ninguna regla
// (los récords y el logro de Implacable siguen mirando la dificultad elegida y si alguna perilla facilita).
export const NIVELES_DIFICULTAD = ['Tranquila', 'Suave', 'Normal', 'Dura', 'Implacable'];
// el logaritmo de cantidad × vida × daño a mitad de camino entre los escalones: Tranquila (−1,33), Suave (−0,67), Normal (0), Dura (0,43), Implacable (0,86)
export const CORTES_NIVEL = [-1.0, -0.33, 0.215, 0.645];
export const MAS_ALLA_NIVEL = 0.3;   // (todo +1 o todo −1 mueve unos 0,46-0,55: pasarse de una punta en más de esto es «más dura que Implacable» o «más suave que Tranquila»)
// `base`: la dificultad elegida ({ cantidad, vida, dano }, la de desafio-reglas.js); `perillas`: los tres pasos. Devuelve { n (1 a 5), nombre, mas (−1, 0, 1) }.
export function nivelDeDificultad(base, perillas) {
  const m = multiplicadoresPerillas(perillas), b = base && typeof base === 'object' ? base : {};
  const f = (k) => { const v = Number(b[k]); return Number.isFinite(v) && v > 0 ? v : 1; };
  const L = Math.log(f('cantidad') * m.cantidad) + Math.log(f('vida') * m.vida) + Math.log(f('dano') * m.dano);
  const i = CORTES_NIVEL.filter((c) => L >= c).length;
  const puntas = [-1.33, 0.86];
  const mas = L > puntas[1] + MAS_ALLA_NIVEL ? 1 : L < puntas[0] - MAS_ALLA_NIVEL ? -1 : 0;
  return { n: i + 1, nombre: NIVELES_DIFICULTAD[i], mas };
}
export function textoNivel(base, perillas) {
  const v = nivelDeDificultad(base, perillas);
  const nombre = v.mas > 0 ? 'más dura que Implacable' : v.mas < 0 ? 'más suave que Tranquila' : v.nombre;
  return `Nivel de la noche: ${nombre} (${v.n} de ${NIVELES_DIFICULTAD.length}).`;
}

// ---------------------------------------------------------------- lo que cuesta caer
// Caer no te saca de la partida: perdés las semillas doradas y parte de la madera y la piedra, y la noche cuenta como pasada. Hasta la 4.21.0
// era plano (30 % de los materiales sin importar la noche): pasada la mitad de la campaña las semillas sobran y lo único que dolía era el
// 30 %, que se recupera talando. Ahora el castigo crece con la noche (20 % más 1 % por noche, hasta 40 %: la noche 10 sigue en 30 %) y en
// Tranquila, la dificultad para aprender, se guarda un cuarto de las semillas.
export const CASTIGO = { materialesBase: 0.2, materialesPorNoche: 0.01, materialesTope: 0.4, cristalesGuardaTranquila: 0.25 };
export function castigoDeCaer(noche, claveDificultad = 'normal') {
  const n = Math.max(1, Math.min(999, Math.floor(Number(noche) || 1)));
  const materiales = Math.min(CASTIGO.materialesTope, Math.round((CASTIGO.materialesBase + CASTIGO.materialesPorNoche * n) * 100) / 100);
  const guarda = claveDificultad === 'tranquila' ? CASTIGO.cristalesGuardaTranquila : 0;
  return { materiales, cristalesQueQuedan: guarda };
}
// Lo que queda de lo que tenías: { tronco, tabla, piedra, cristal } -> el mismo objeto, con el castigo aplicado (sin pasarse de cero).
export function aplicarCastigo(materiales, castigo) {
  const M = materiales || {};
  M.cristal = Math.floor((Number(M.cristal) || 0) * castigo.cristalesQueQuedan);
  for (const k of ['tronco', 'tabla', 'piedra']) if (M[k]) M[k] = Math.floor(M[k] * (1 - castigo.materiales));
  return M;
}
export function textoCaida(castigo) {
  return castigo.cristalesQueQuedan > 0
    ? 'Perdiste parte de las semillas doradas y de los materiales'
    : 'Perdiste las semillas doradas y parte de los materiales';
}

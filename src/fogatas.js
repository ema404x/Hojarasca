// 3.8.7: los fuegos del valle (decisión del usuario). Hasta cuatro prendidos a la vez, cada uno con su leña: se consume
// por su cuenta. Antes había uno solo y prender otro apagaba el anterior. Y la siesta al lado del fuego lo consume según
// el tiempo dormido (antes lo apagaba entero): una siesta corta lo deja más bajo, una larga lo puede apagar.
//
// Módulo puro (se prueba en Node): qué lugar usa un fuego nuevo, cuál es el más cercano, cuánto se consume durmiendo y lo
// que se guarda. Lo que se ve (las llamas, el humo, la luz) está en clima.js.

export const MAX_FOGATAS = 4;
// a menos de esto, prender es avivar el mismo fuego (no uno nuevo al lado)
export const MISMO_FUEGO = 1.5;
// la vida es en segundos de reloj: se apaga en 0 y quedan las brasas hasta -60 (ver clima.js)
export const BRASAS = -40;
export const VIDA_MAX = 3600;

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const vivo = (f) => !!f && f.activa && num(f.vida) > 0;

// Dónde va un fuego nuevo en (x, z): el que ya arde ahí (se aviva), si no un lugar libre, y si están los cuatro, el que
// menos leña tiene. Devuelve { i, reemplaza } (`reemplaza`: apaga uno que estaba prendido en otro lado).
export function lugarParaFogata(lista, x, z) {
  let libre = -1, menor = -1;
  for (let i = 0; i < lista.length; i++) {
    const f = lista[i];
    if (f.activa && Math.hypot(num(f.pos?.x) - x, num(f.pos?.z) - z) < MISMO_FUEGO) return { i, reemplaza: false };
  }
  for (let i = 0; i < lista.length; i++) {
    const f = lista[i];
    if (!vivo(f)) { if (libre < 0) libre = i; continue; }
    if (menor < 0 || num(f.vida) < num(lista[menor].vida)) menor = i;
  }
  if (libre >= 0) return { i: libre, reemplaza: false };
  return { i: Math.max(0, menor), reemplaza: true };
}

// El más cercano a (x, z): primero entre los que arden; si no arde ninguno, entre los que todavía tienen brasas. -1 si no
// hay ninguno prendido.
export function masCercano(lista, x, z) {
  let mejor = -1, d0 = Infinity, vivoMejor = false;
  for (let i = 0; i < lista.length; i++) {
    const f = lista[i];
    if (!f.activa) continue;
    const v = vivo(f);
    const d = Math.hypot(num(f.pos?.x) - x, num(f.pos?.z) - z);
    if ((v && !vivoMejor) || (v === vivoMejor && d < d0)) { mejor = i; d0 = d; vivoMejor = v; }
  }
  return mejor;
}

// ¿Arde un fuego a menos de `r` metros de (x, z)? Devuelve su índice o -1.
export function fuegoEn(lista, x, z, r = MISMO_FUEGO) {
  let mejor = -1, d0 = r;
  for (let i = 0; i < lista.length; i++) {
    if (!vivo(lista[i])) continue;
    const d = Math.hypot(num(lista[i].pos?.x) - x, num(lista[i].pos?.z) - z);
    if (d < d0) { d0 = d; mejor = i; }
  }
  return mejor;
}

// La vida que le queda a un fuego después de dormir `horas` horas de juego (`segundosPorHora`: cuánto dura una hora en
// segundos de reloj). Si no alcanza, queda en brasas.
export function consumirDormido(vida, horas, segundosPorHora) {
  const v = num(vida);
  if (v <= 0) return v;
  const resto = v - Math.max(0, num(horas)) * Math.max(0, num(segundosPorHora));
  return resto > 0 ? resto : BRASAS;
}

// Lo que se guarda: los que arden, con su lugar, su leña y si son de una estufa (contenidos).
export function fogatasParaGuardar(lista) {
  return lista.filter(vivo).slice(0, MAX_FOGATAS).map((f) => ({
    x: Math.round(num(f.pos.x) * 100) / 100, y: Math.round(num(f.pos.y) * 100) / 100, z: Math.round(num(f.pos.z) * 100) / 100,
    vida: Math.round(Math.min(VIDA_MAX, num(f.vida))), ...(f.contenida ? { contenida: true } : {}),
  }));
}
export function sanearFogatas(v) {
  if (!Array.isArray(v)) return [];
  const salida = [];
  for (const f of v) {
    if (!f || typeof f !== 'object' || Array.isArray(f)) continue;
    const x = Number(f.x), y = Number(f.y), z = Number(f.z), vida = Number(f.vida);
    if (![x, y, z, vida].every(Number.isFinite) || Math.abs(x) > 5000 || Math.abs(z) > 5000 || Math.abs(y) > 2000 || vida <= 0) continue;
    salida.push({ x, y, z, vida: Math.min(VIDA_MAX, vida), ...(f.contenida === true ? { contenida: true } : {}) });
    if (salida.length >= MAX_FOGATAS) break;
  }
  return salida;
}

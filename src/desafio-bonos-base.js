// 4.10 base: el respaldo local de los bonos. Mientras no esté `desafio-bonos.js` (lo define y sube la rama «guardian»), la base
// anota sus bonos acá con los mismos tres nombres del contrato: sumarBono(d, origen, clave, valor), quitarBonosDeOrigen(d, origen)
// y bonoDe(d, clave). Al juntar las ramas se cambia el import de `desafio-base-juego.js` y este archivo se va.
//
// Los bonos de la base viajan en `d.crece.bonos` ({ origen: { clave: valor } }): una fracción por clave (0,05 = 5 %).
export const CLAVES_BONO = ['saludMax', 'correr', 'recarga', 'dano', 'reparar', 'alcance'];
const mapa = (d) => {
  if (!d.crece || typeof d.crece !== 'object') d.crece = {};
  if (!d.crece.bonos || typeof d.crece.bonos !== 'object' || Array.isArray(d.crece.bonos)) d.crece.bonos = {};
  return d.crece.bonos;
};
export function sumarBono(d, origen, clave, valor) {
  if (!CLAVES_BONO.includes(clave) || !(Number(valor) > 0)) return false;
  const m = mapa(d);
  if (!Object.hasOwn(m, origen)) m[origen] = {};
  m[origen][clave] = (m[origen][clave] || 0) + Number(valor);
  return true;
}
export function quitarBonosDeOrigen(d, origen) {
  const m = mapa(d);
  if (!Object.hasOwn(m, origen)) return false;
  delete m[origen];
  return true;
}
export function bonoDe(d, clave) {
  let suma = 0;
  for (const o of Object.values(mapa(d))) suma += Number(o?.[clave]) || 0;
  return suma;
}
// Lo guardado: sólo las claves del contrato y números finitos, no negativos.
export function sanearBonos(v) {
  const salida = {};
  if (!v || typeof v !== 'object' || Array.isArray(v)) return salida;
  for (const [origen, claves] of Object.entries(v)) {
    if (!claves || typeof claves !== 'object' || Array.isArray(claves) || origen === '__proto__') continue;
    const limpio = {};
    for (const k of CLAVES_BONO) { const n = Number(claves[k]); if (Object.hasOwn(claves, k) && claves[k] !== null && claves[k] !== '' && typeof claves[k] !== 'boolean' && Number.isFinite(n) && n > 0) limpio[k] = Math.min(10, n); }
    if (Object.keys(limpio).length) salida[origen] = limpio;
  }
  return salida;
}

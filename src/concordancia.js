// 4.0.3 (II-11): la concordancia del participio con el nombre de una obra para las notas «X desmontada» y «X recolocado».
// Antes era «a si la primera palabra termina en a, o si no»: «Cortinas desmontado», «Torre de vigía desmontado», «Estación meteorológica desmontado».
// Reglas: el plural se nota en la -s de la primera palabra (Cortinas, Estacas trampa, Cuadros y fotos); el género, en su final (-a, y unos pocos
// femeninos que no la llevan: Estación, Torre, Red, Pared, Cruz, Luz).
const FEMENINOS = new Set(['estación', 'torre', 'red', 'pared', 'cruz', 'luz', 'noche', 'fuente', 'llave', 'mesada']);
export function participio(nombre, raiz) {
  const palabra = String(nombre || '').trim().split(/\s+/)[0] || '';
  const p = palabra.toLowerCase();
  const plural = /s$/.test(p) && !/(us|is)$/.test(p) && p.length > 3;
  const femenino = plural ? /as$/.test(p) : (/a$/.test(p) || FEMENINOS.has(p));
  return `${raiz}${femenino ? 'a' : 'o'}${plural ? 's' : ''}`;
}

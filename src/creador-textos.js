// 4.1 (F2): los textos de Bruno que se muestran, en un solo lugar. Módulo puro (sin three ni DOM): se prueba en Node.
//
// TODO provisorio: los textos definitivos (la frase de cada rasgo, su pro y su contra escritos) los escribe el autor (ver TEXTOS_BRUNO.md) y entran en la F4.
// Hoy cada pro y contra se arma con una frase genérica a partir de su efecto, en texto claro y SIN números. Cuando estén los definitivos, se cambia `lineaDeContribucion`
// (y sólo ella): la pantalla de creación y la ficha del cuaderno la usan las dos.
import { contribuciones, sanearGenoma, efectosAplicados, efectosBrutos, sistemasAlTope, PROTAGONISTA } from './creador-personaje.js';
import { PERSONALIDADES, OFICIOS, GUSTOS, HOBBIES, VIRTUDES, DEFECTOS, SISTEMAS } from './creador-catalogo.js';

export const NOMBRE_SISTEMA = { abrigo: 'el abrigo', afecto: 'el trato con los vecinos', pesca: 'la pesca', cuaderno: 'el cuaderno' };
export const CLASE_TEXTO = { personalidad: 'Su forma de ser', oficio: 'Su oficio', hobby: 'Su hobby', gustos: 'Lo que le gusta', virtud: 'Su virtud', defecto: 'Su defecto' };

// Una línea de pro o de contra, o null si no hay nada que mostrar (el contra de un gusto de sabor no se lista).
export function lineaDeContribucion(c) {
  if (c.sistema === null) {
    if (c.lado === 'contra' && c.clase === 'gustos') return null;
    return `${CLASE_TEXTO[c.clase]}: se nota en el día a día`;
  }
  return `${CLASE_TEXTO[c.clase]}: ${c.pasos > 0 ? 'mejora' : 'empeora'} ${NOMBRE_SISTEMA[c.sistema]}`;
}

const nombreDe = (lista, id) => (lista.find((x) => x.id === id) || lista[0]).nombre;

// La ficha de Bruno para el cuaderno: todo lo elegido, ordenado, y los pros y contras en texto. `retrato`: la foto guardada (o null).
export function fichaDeBruno(bruno) {
  const g = sanearGenoma(bruno);
  const todas = contribuciones(g);
  const lineas = (lado) => todas.filter((c) => c.lado === lado).map(lineaDeContribucion).filter((t) => t !== null);
  const alTope = sistemasAlTope(g), brutos = efectosBrutos(g);
  return {
    nombre: `${PROTAGONISTA.nombre} ${PROTAGONISTA.apellido}`,
    edad: PROTAGONISTA.edad,
    presentacion: 'Llegó al valle buscando paz, lejos del ruido de la ciudad.',
    retrato: typeof bruno?.retrato === 'string' && bruno.retrato ? bruno.retrato : null,
    datos: [
      ['Personalidad', nombreDe(PERSONALIDADES, g.personalidad)],
      ['Oficio de antes', nombreDe(OFICIOS, g.oficio)],
      ['Gustos', g.gustos.map((id) => nombreDe(GUSTOS, id)).join(' y ')],
      ['Hobby', nombreDe(HOBBIES, g.hobby)],
      ['Virtud', nombreDe(VIRTUDES, g.virtud)],
      ['Defecto', nombreDe(DEFECTOS, g.defecto)],
    ],
    pros: lineas('pro'),
    contras: lineas('contra'),
    avisos: alTope.map((s) => (brutos[s] > 0 ? `Ya está al máximo en ${NOMBRE_SISTEMA[s].replace(/^el /, '')}: otro rasgo no suma más.` : `Ya no empeora más ${NOMBRE_SISTEMA[s]}: otro rasgo no resta más.`)),
    sistemas: SISTEMAS.map((s) => ({ id: s, nombre: NOMBRE_SISTEMA[s], valor: efectosAplicados(g)[s] })),
  };
}

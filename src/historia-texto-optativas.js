// 4.18.0 (A): HUECO de los textos de las subtramas optativas de la Historia. Lo reemplaza el archivo de B (rama v4180-b) al juntar
// (`git checkout --theirs`). Mismo formato que las partes de historia-texto-acto3.js:
//   tablon[id]  = { texto, enCurso?, hecha? }   lo que dice el panel de la historia de cada optativa (si falta, se usa el de los capítulos)
//   notas[id]   = { titulo, texto }             notas que se leen
//   objetos[id] = { nombre, texto }             objetos de historia nuevos
//   raro[id]    = { titulo, texto, cap, donde } el cuaderno de lo raro (mismo id que el efecto `raro:<id>`)
//   charla[quien] = [{ id, cap, texto, cuando? }]   (`cuando`: { optativa } | { decision, es } | { escena })
export const TEXTO_OPTATIVAS = { tablon: {}, notas: {}, objetos: {}, raro: {}, charla: {} };

// 4.6.1: ayuda para que las pruebas que leen el código prueben lo que hace y no cómo está escrito.
//
// Muchas pruebas buscaban una línea exacta de main.js (o de otro archivo) con `includes`: se rompían cada vez que otra
// versión sumaba una condición a esa línea, aunque el juego anduviera bien. Con esto:
//   · `expresion(fuente, 'const escala = ', entorno)`: evalúa lo que está a la derecha del `=` en esa línea con un mundo
//     de mentira (`entorno`) y devuelve el valor (si es una función, la función). Se prueba la conducta.
//   · `funcion(fuente, 'nombre', entorno)`: lo mismo con una función entera (`function nombre(…) { … }` en la columna 0).
//   · `enUnaLinea(fuente, [partes])`: hay una línea que tiene todas esas partes (textos o expresiones regulares), en
//     cualquier orden y con lo que sea en el medio. Para los enganches que no se pueden correr en Node.
//   · `literal(fuente, 'export const X = ')`: el valor de un literal (lista, objeto, `new Set([...])`) sin importar el módulo.
import assert from 'node:assert/strict';

const evaluar = (codigo, entorno) => new Function('env', `with (env) { return (${codigo}); }`)(
  new Proxy(entorno, { has: (t, k) => typeof k === 'string' && Object.hasOwn(t, k) }),
);

// La línea que empieza (sin contar la sangría) con `inicio` (y, si se da, que también tiene `ademas`): lo que sigue,
// hasta el `;` del final (sin el comentario)
export function derechaDe(fuente, inicio, ademas = '') {
  const linea = fuente.split('\n').find((l) => l.trimStart().startsWith(inicio) && l.includes(ademas));
  assert.ok(linea, `el código tiene «${inicio}${ademas ? ` … ${ademas}` : ''}»`);
  return linea.trimStart().slice(inicio.length).replace(/;\s*(\/\/.*)?$/, '');
}
export function expresion(fuente, inicio, entorno = {}, ademas = '') { return evaluar(derechaDe(fuente, inicio, ademas), entorno); }

export function funcion(fuente, nombre, entorno = {}) {
  const m = new RegExp(`(^|\\n)(async )?function ${nombre}\\(`).exec(fuente);
  assert.ok(m, `el código tiene la función ${nombre}`);
  const i0 = m.index + (m[1] ? 1 : 0);
  const i1 = fuente.indexOf('\n}\n', i0);
  return evaluar(fuente.slice(i0, i1 + 2), entorno);
}

export function enUnaLinea(fuente, partes) {
  return fuente.split('\n').some((l) => partes.every((p) => (typeof p === 'string' ? l.includes(p) : p.test(l))));
}

export function literal(fuente, inicio) { return expresion(fuente, inicio, {}); }

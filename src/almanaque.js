// 2.1: lo que llega y lo que se va.
//
// Varias especies del valle ya cambiaban con la estación —el picaflor, las bandurrias y
// los cauquenes se iban en invierno, el ciervo bramaba en otoño—, pero el juego no lo
// decía en ningún lado. El almanaque lo cuenta en la ficha de cada una, avisa cuando
// llegan y cuando se van, y en otoño se ven pasar las bandadas de cauquenes que migran
// hacia el norte.
//
// Cada texto dice lo que el juego hace de verdad: si una ficha dice que en invierno no
// está, es porque en invierno el juego no la muestra.

export const ALMANAQUE = {
  picaflor: { cuando: 'De primavera a otoño. En invierno se va al norte, a zonas más templadas.', invierno: false },
  bandurria: { cuando: 'De primavera a otoño, en los pastizales. En invierno migra al norte.', invierno: false },
  cauquen: { cuando: 'De primavera a otoño. En otoño pasan altas las bandadas que migran al norte; en invierno no queda ninguno.', invierno: false, migra: true },
  manganga: { cuando: 'Con calor y sin lluvia. En invierno no se ve.', invierno: false },
  mariposa: { cuando: 'Con calor y sin lluvia. En invierno no se ve.', invierno: false },
  panal: { cuando: 'Se oye con calor. En invierno el panal calla.', invierno: false },
  lagartija: { cuando: 'Al mediodía, con sol. En invierno pasa bajo tierra.', invierno: false },
  murcielago: { cuando: 'Al anochecer, de verano a otoño. En invierno hiberna.', invierno: false },
  ciervo: { cuando: 'Todo el año. En otoño es la brama: los machos se oyen de lejos, al atardecer.' },
  concon: { cuando: 'Todo el año, de noche.' },
};
// (sin eñe en el nombre: el armador reconoce los identificadores con \w, y una Ñ lo cortaba)
export const TODO_EL_ANIO = 'Todo el año.';

// La línea para la ficha del cuaderno. Sólo fauna.
export function cuandoSeVe(entrada) {
  if (!entrada || entrada.seccion !== 'fauna') return null;
  return ALMANAQUE[entrada.id]?.cuando || TODO_EL_ANIO;
}

// Las aves que se van en invierno (los bichos también desaparecen, pero no migran).
export const MIGRAN = ['picaflor', 'bandurria', 'cauquen'];

// El aviso cuando cambia la estación: quiénes se van o quiénes vuelven. `nombres` da
// el nombre visible de cada especie. Sólo nombra las que ya anotaste.
export function avisoDeEstacion(antes, ahora, anotadas = {}, nombres = {}) {
  if (!antes || antes === ahora) return null;
  const lista = MIGRAN.filter((id) => anotadas[id]).map((id) => nombres[id] || id);
  if (!lista.length) return null;
  const unir = (l) => (l.length === 1 ? l[0] : `${l.slice(0, -1).join(', ')} y ${l[l.length - 1]}`);
  if (ahora === 'invierno') return { titulo: 'Se fueron al norte', texto: `Ya no se ven: ${unir(lista)}. Vuelven con el calor.` };
  if (antes === 'invierno') return { titulo: 'Volvieron', texto: `Otra vez en el valle: ${unir(lista)}.` };
  return null;
}

// La bandada de cauquenes que migra en otoño: cada cuánto pasa (segundos de reloj).
export function esperaMigracion(azar = Math.random) { return 240 + azar() * 180; }
// La V: el ave i, detrás de la punta, alternando de lado.
export function lugarEnLaV(i, separacion = 3.2) {
  if (i === 0) return { lateral: 0, atras: 0 };
  const fila = Math.ceil(i / 2), lado = i % 2 ? 1 : -1;
  return { lateral: lado * fila * separacion, atras: fila * separacion * 0.8 };
}

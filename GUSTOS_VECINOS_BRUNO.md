# Qué le gusta a cada vecino (propuesta de la F0, a corregir)

Sirve para la **afinidad de los gustos** de Bruno: si Bruno y un vecino comparten un gusto, el afecto con ese vecino sube un poco más (+1 paso, con el tope del 20 %).

**Cómo la armé.** Conté en el bloque de voces de cada vecino (`src/vecindad-voces.js`) las palabras de cada gusto (mate, folklore, lluvia, trenes, asado, libros).
**E(n)** quiere decir «hay evidencia: n palabras en sus voces». **P** quiere decir «propuesta mía, sin evidencia suficiente, a partir de su oficio». Las palabras sueltas
no prueban un gusto: un vecino puede nombrar el tren sin que le guste. Por eso todo está para que lo corrijas.

## Hallazgo importante: el mate no discrimina

El mate aparece en las voces de **casi todos** los vecinos (31 de 36 bloques). Como gusto de Bruno daría afinidad con casi todo el pueblo, y el gusto dejaría de ser una
elección. Tres salidas, a decidir:

- **A.** Dejarlo, con la afinidad a la mitad (+0,5 paso) para todos, porque es un gusto compartido por casi todos.
- **B.** Cambiarlo por un gusto que sí diferencie (por ejemplo «caminar» o «el campo»).
- **C.** Dejarlo como está, sabiendo que es el gusto «seguro» y que casi siempre suma.

Recomendación: la **A**. Mantiene la cultura del lugar sin que sea una elección obvia.

**Decidido el 14-10: A.** El mate da **medio paso** de afinidad (no uno) con quien lo comparte.

## La tabla

| Vecino | Evidencia | Gustos propuestos | Nota |
|---|---|---|---|
| jefe | trenes E22, mate E8 | trenes, asado | el asado es P |
| nelida | trenes E3, mate E2 | trenes, libros | libros P |
| abuela | mate E2 | mate, lluvia | lluvia P |
| padre | mate E3, trenes E2 | asado, folklore | los dos P |
| madre | trenes E2 | libros, lluvia | los dos P |
| nene | trenes E7, mate E3 | trenes, lluvia | lluvia P (los charcos) |
| nena | libros E7, mate E2 | libros, lluvia | lluvia P |
| galesa | mate E4 | mate, libros | libros P (la casa de té) |
| ercilia | trenes E3, mate E1 | trenes, folklore | folklore P |
| carpintero | mate E3 | asado, folklore | los dos P |
| panadera | lluvia E1 | mate, lluvia | mate P |
| herrero | mate E3, trenes E1 | asado, trenes | asado P |
| pescador | mate E4, trenes E1 | mate, lluvia | lluvia P |
| maestra | mate E4, libros E2 | libros, mate | |
| enfermera | mate E3, libros E1 | libros, lluvia | lluvia P |
| telegrafista | mate E5, lluvia E2, trenes E2 | trenes, lluvia | |
| tejedora | mate E3 | mate, folklore | folklore P |
| apicultor | sin evidencia | lluvia, libros | los dos P |
| guardaparque | mate E3 | lluvia, mate | lluvia P |
| musico | folklore E7, mate E4 | folklore, mate | |
| veterinaria | mate E4, trenes E1 | asado, mate | asado P |
| fotografa | mate E2 | lluvia, trenes | los dos P (los paisajes) |
| andinista | mate E3 | mate, asado | asado P |
| herbolaria | mate E1 | lluvia, libros | los dos P |
| pintora | sin evidencia | lluvia, libros | los dos P |
| ceramista | mate E2, asado E1 | mate, asado | |
| botera | mate E3 | lluvia, mate | lluvia P |
| astronoma | lluvia E1, trenes E1, asado E1 | libros, lluvia | libros P |
| modista | folklore E1, libros E1, trenes E2 | folklore, libros | |
| martin | trenes E20, mate E6, asado E2 | trenes, asado | |
| gerente | mate E4, libros E3, trenes E2 | libros, mate | |
| moza | mate E3, trenes E3, folklore E1 | folklore, mate | |
| bailarina | no está en este archivo de voces | folklore | todo P (el chamamé y el tango en la peña) |
| ramon | mate E7, lluvia E1 | mate, lluvia | |
| nicanor | mate E4 | mate, lluvia | lluvia P |
| ema (Josefina) | mate E3 | lluvia, mate | lluvia P |
| guarda (Elsa) | trenes E14, mate E3 | trenes, mate | |

## Lo que se ve en el reparto

- Los gustos con **más evidencia** son los **trenes** (jefe, Martín, Elsa y la estación), los **libros** (nena, maestra, gerente) y el **folklore** (músico).
- El **asado** y la **lluvia** casi no tienen evidencia en las voces: están asignados sobre todo por mi propuesta. Si querés que valgan algo, hay que **escribirles
  una línea a los vecinos** que los comparten (a decidir si entra en la 4.1; no estaba en el alcance).
- Cada vecino queda con **dos gustos** (la bailarina, con uno), así Bruno comparte algo con la mayoría eligiendo dos.

## Líneas de los vecinos para el asado y la lluvia (decidido el 14-10)

Se escribe **una línea por cada vecino que comparte el gusto**, para que lo diga en voz alta al charlar con Bruno. Alcance, contado sobre la tabla de arriba:
- **Asado:** 8 vecinos (jefe, padre, carpintero, herrero, veterinaria, andinista, ceramista, martin).
- **Lluvia:** 18 vecinos (abuela, madre, nene, nena, panadera, pescador, enfermera, telegrafista, apicultor, guardaparque, fotografa, herbolaria, pintora, botera, astronoma, ramon, nicanor, ema (Josefina)).
- Las líneas hay que **revisarlas con el tono de cada vecino** (están en `src/vecindad-voces.js`). Propuesta: las **borrador yo** en la voz de cada uno y vos las corregís,
  porque son textos de los vecinos y no de Bruno. Esto **cambia lo que dijimos** (los textos los escribís vos), así que queda **a confirmar**.
- Son textos nuevos en español y, más adelante, en inglés. Entra en la 4.1 como decidiste.

# 4.10.5 — la partida `humo-3-5-1-desafio` intermitente (era de la prueba)

## El síntoma
En «entre tandas no queda nadie colgado en la cola» (noche final) la partida fallaba más o menos 1 de cada 3 o 4 corridas con
`{"vivos":1,"aliens":1,"hay":true,"nod":true}`.

## Cómo se reprodujo
Con una copia de la partida con un volcado de los invasores justo antes de la comprobación (corridas seguidas, con el Math.random sembrado y el reloj
falso de `ayuda-determinista.cjs`). Falló en 3 de 8 corridas. El que quedaba era siempre el mismo:

`jefe · estado 'avanzar' · t ≈ 2,1 a 2,7 s · vida 2268 (entera) · huyeT 0 · enNave false · bajoTierra false · sin puesto ni guardia · curas 0`,
a unos 400 m del lugar de la base (en la boca del aro). En una corrida, un volcado tomado 4 s antes lo mostró en estado `bajar`
(recién saliendo de la tierra) con la vida entera. En las corridas verdes, ese mismo jefe ya había salido en ese momento y la prueba lo había quemado.

## Causa
No es un bug del juego. El jefe de la oleada es el último de la cola que sale por el aro, y la cola de bajada tiene ritmo propio (`ritmoTras`) más el
espacio que se libera en la base (`bajarAlien` hace esperar al jefe cuando la base está llena). La prueba esperaba un tiempo fijo (6 veces 2 s de
simulación más 4 s) y a veces el jefe salía de la tierra después del último «quemar»: estaba recién nacido, no colgado. No era ni el curandero, ni
uno que huye, ni uno pegado en la miel, ni dormido, ni del enjambre, ni quedó en `porBajar`.

## El arreglo (sólo la prueba)
`pruebas/humo-3-5-1-desafio.cjs`: en lugar de un tiempo fijo, se repite «simular 1 s, quemar los que caminan, simular 1 s» y se mira la calma después de
cada vuelta, hasta 90 vueltas. Se corta cuando `vivos === 0` y no hay invasores. La comprobación sigue siendo la misma: si la cola de verdad
quedara colgada (un duende que nunca baja o nunca muere), jamás se llegaría a la calma y la prueba fallaría igual.

No se tocó el código del juego, así que no hay prueba de Node nueva ni cambios en el gate.

## Evidencia
- `humo-3-5-1-desafio`: 8 corridas seguidas en verde (23 comprobaciones cada una), de a una.
- `humo-3-0-asedio`, `humo-4-8-noches`, `humo-4-8-ataques`, `humo-4-9-aliados`, `humo-4-10-coihue`: en verde, de a una.

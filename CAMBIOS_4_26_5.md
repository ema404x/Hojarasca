# Hojarasca 4.26.5 — Cacería de bugs en el pueblo

Ramas v4265-a (la gente), v4265-b (lo construido) y v4265-c (lo que se hace), juntadas. Detalle en CAMBIOS_4_26_5_A.md, _B.md y _C.md. 0 shaders, 0 llamadas de dibujo nuevas.

- La gente: los vecinos que pasaban por una calle con vos parado cerca se quedaban clavados para siempre; ahora se frenan a mirarte 8 s y siguen. Los puntos de casa y trabajo que caían 0,3 m adentro de un muro o un mueble (la panadera, el apicultor, el gerente) se corren al lugar libre más cercano.
- El puesto de cargas no abría a pie desde la 4.26.1 («Cargas · undefined», vacío): anda otra vez en todas las paradas.
- Guardar arriba de la trochita parada en la Aldea te cargaba a 706 m, en la Estación del Valle: ahora se carga donde estabas.
- Los pedidos decían «2 de frascos de miel»: ahora «2 frascos de miel». Tirar con V con el puesto abierto actualiza el panel.
- Las lajas del camino de la Casa de Té ya no quedan en cuña (una punta colgada, la otra hundida): se apoyan en la pendiente.
- Verificación: npm run verify de corrido; pruebas nuevas verificar-4-26-5-a (12; 6 mutaciones), -b (17; 12 mutaciones) y -c (29; 9 mutaciones); recorridas reales del pueblo de día, al ocaso y de noche.

## Anotado sin tocar
- La cola de la noche en la puerta de la estación (no se sabe si es gente de paso o trabada).
- El suelo que se ve en la Aldea difiere del que se pisa hasta 42 cm en algunos puntos.
- Los bajos de los techos del andén se ven negros puros.
- El cartel del banco no dice domingo cerrado ni el sábado de baile.
- V con una charla abierta tira lo de la mano; el «E para subir» de la trochita sale antes de que se pueda subir.
- Sin ver: la trochita llegando y saliendo con gente, los objetos en la mano y los pedidos con la E; la Historia pasando por el pueblo.

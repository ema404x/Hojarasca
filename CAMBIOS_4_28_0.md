# Hojarasca 4.28.0 — Nivel Ultra

Ramas v4280-a (el ajuste, la luz y el cielo), v4280-b (el bosque y el pasto) y v4280-c (personajes, casas y materiales), juntadas, más una pasada final con todo junto. Detalle en CAMBIOS_4_28_0_A.md, _B.md y _C.md.

- Ajuste nuevo en Gráficos: «Ultra (efectos nuevos, pide una buena placa)», sólo con la calidad en Alta; se prende y apaga en vivo y la autocalidad nunca lo prende. Es el único lugar con shaders nuevos: con Ultra apagado, Alta, Media y Baja quedan como en la 4.27.0 (mismos programas de shader en las mismas tomas).
- Luz y cielo: niebla volumétrica en capas que se mueve con el viento (bancos sobre el lago y en los bajos al amanecer, más espesa entre los árboles, iluminada por faroles y linterna de noche), rayos de sol, cielo con dispersión atmosférica, sombras suaves y más finas, oclusión ambiental, aliento visible con frío.
- Bosque y pasto: viento con ráfagas en el pasto y las hojas, prado más tupido de cerca con tallos, espigas y florcitas, pasto que se aplasta al pisarlo, suelo con hojarasca y relieve y sin el corte recto junto a las casas, copas encendidas a contraluz, polvo dorado en los rayos, rocío y gotas que brillan.
- Casas y personajes: veta y relieve en madera y troncos, piedra con juntas hundidas, madera mojada más oscura y chapa con brillo con lluvia, charcos en el ripio y las lajas, nieve pegada en paredes y cercos, musgo y líquenes, la gente de cerca con gestos y tela. La nieve en sombra, en Ultra, ya no se ve azul profundo.
- Rendimiento (notebook de desarrollo, 3 rondas): plaza de día 24,2 ms en Alta y 31,6 en Ultra; bosque denso 22,5 y 28,8.
- Verificación: npm run verify de corrido; pruebas nuevas verificar-4-28-0-a, -b y -c con mutaciones; capturas Alta/Ultra de día, ocaso, noche, nieve y lluvia.

## Sin ver / afuera
- Afuera: las hojas que caen, los vidrios que reflejan el cielo, el vapor de la olla, el resplandor extra de noche.
- Sin ver en movimiento: el viento y el pasto pisado (las capturas son quietas) y el aliento de noche.
- Próxima (pedida): agua, fuego y luz chica, nubes y cielo nocturno, rastros, vida chica, pelo y ropa con viento, desenfoque en cinemáticas, todo en Ultra.

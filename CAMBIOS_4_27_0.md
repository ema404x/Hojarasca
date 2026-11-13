# Hojarasca 4.27.0 — Panales silvestres

Rama v4270-a. Detalle en CAMBIOS_4_27_0_A.md. 0 shaders, 0 llamadas de dibujo nuevas (los panales van fundidos en la malla del panal que ya existía; las abejas son la misma nube). Clave nueva de guardado: `panales`.

- Ocho panales silvestres en árboles grandes del bosque, siempre en los mismos lugares para una misma partida, colgando a una altura que se alcanza parado.
- De día, con sol y fuera del invierno, las abejas vuelan alrededor del panal y se oye el zumbido; la noche y la lluvia las guardan.
- E a 2,5 m: «Sacar miel del panal» da un frasco de miel; el panal se vuelve a llenar en 5 días de sol. Las abejas se alborotan pero no pican.
- En la Historia, la colmena (O → Trabajo) aparece después de sacar miel de un panal silvestre por primera vez: «Te llevás un puñado de abejas.» Relax, igual que antes; el Desafío no cambia.
- Cuaderno: entrada nueva «Panal silvestre».
- Verificación: npm run verify de corrido; prueba nueva verificar-4-27-0-a (310 comprobaciones, 33 mutaciones); humo real en Historia (Media y Baja) y Relax (Alta).

## Sin ver / pendiente
- La recarga de 5 días de sol se probó en Node, no jugando.
- No se vio un panal en una ladera fuerte ni qué pasa si se tala su árbol.

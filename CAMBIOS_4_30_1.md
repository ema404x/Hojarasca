# Hojarasca 4.30.1 — La captura de la plaza

Ramas v4301-a (el caballo) y v4301-b (el retablo, los árboles y el paso de la gente), juntadas. Detalle en CAMBIOS_4_30_1_A.md y _B.md. 0 shaders nuevos.

- Los caballos (los atados de la plaza y el tuyo) se corren al lugar libre más cercano: nunca dentro de troncos, paredes ni muebles. Montado choca el caballo entero (cabeza, pecho y grupa), no sólo vos.
- El caballo: riendas que cuelgan en curva hasta la montura, el estribo de hierro (era una cuerda con bola), el cuello unido a la cabeza y los cuatro cascos apoyados en la loma (antes quedaban hasta 19 cm en el aire).
- El retablo de los títeres: de tablas en las cuatro caras, 2,5 m de alto, con guarda, cortinas recogidas, telón con luna y la cortina de los titiriteros atrás; la boca da a la plaza.
- Árboles: el álamo pegado al retablo, a 3 m; el frutal de los Jones ya no mete la copa en la casa de Nélida.
- La gente camina sin patinar: el ritmo del paso sale de la velocidad (pie de apoyo ≤2 cm por paso, antes 21–43 cm); con pollera el paso es más corto y la rodilla no asoma por la tela, ni quieta en la ladera ni caminando.
- Verificación: npm run verify de corrido; pruebas nuevas verificar-4-30-1-a (74; 17 mutaciones) y -b (427; 25 mutaciones); vistas en el lugar de la captura.

## Anotado
- La grupa del caballo contra un tronco, montado, probada en Node y no vista a ojo; la rodilla contra la pollera a mucha velocidad, sin medir.

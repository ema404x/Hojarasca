# Plan 3.8.0 — La noche de los duendes

Decidido con el usuario el 06-10-2026, en la charla. Va después de terminar la 3.7.

**Qué cambia:** en el **Desafío**, los extraterrestres pasan a ser **duendes**. Así el juego cuenta una sola historia,
la de la Aldea de los Duendes. En el **Relax** no cambia nada: los duendes siguen siendo sólo leyenda.

## Decisiones
- **Tono:** traviesos de día y oscuros de noche.
  - Al anochecer son pillos y graciosos: roban, se ríen y hacen trampas.
  - En las noches grandes salen los viejos, oscuros y de miedo.
- **Jefe final:**
  - Reemplaza a la nave nodriza **el Coihue Viejo**: un coihue gigante y hueco, casa de los duendes, que despierta y camina con sus raíces.
  - Se sube por adentro, como hoy se entra a la nave, hasta su corazón.
  - Ahí está **el Rey Duende**, en el lugar de la Madre.
- **Conexión con el Relax:** sólo por la leyenda. En el Relax los duendes nunca aparecen. La abuela Herminia cuenta "la noche en que salieron los duendes", que es lo que se juega en el Desafío.

## Equivalencias propuestas

| Hoy | Pasa a ser |
|---|---|
| invasores de noche | duendes que salen del bosque |
| voladores | duendes montados en lechuzas o cauquenes |
| capullos | nidos de hongos y musgo |
| puestos invasores | madrigueras entre las raíces |
| cristal | semillas doradas o piedras de luz |
| evolución de los aliens | duendes que crecen, de chiquitos a viejos grandotes |
| nave nodriza / Madre | Coihue Viejo / Rey Duende |

Todo el Desafío se rehace con esto: enemigos, jefe, arena, textos, sonidos, logros, el cuaderno y el inglés.

## Reglas
- Nada religioso.
- Sin tomar figuras sagradas o delicadas del folclore real: los duendes son los de la leyenda local de la aldea.
- Sin "invasores que roban" a la base. Esa idea se rechazó antes: el robo de los traviesos es travesura de noche, sin perder lo construido. Confirmarlo con el usuario.

## Prototipo de imágenes (06-10)
Está en la rama `proto-duendes` (`?debug=1&duendes=proto`; las capturas y láminas para votar quedan en `pruebas/salidas/proto-duendes/`).
- **Opciones:**
  - estilos de duende A tallado, B cuento, C bosque y musgo, D oscuro;
  - Rey 1–3;
  - Coihue 1–3;
  - semillas o piedras de luz.
- **Elección:** pendiente, la decide el usuario con su equipo.
- **Al pasarlo al juego:**
  - LOD e instanciado: hoy 30 duendes suman unos 76 dibujos y unos 2,5 ms;
  - lechuza con aleteo;
  - copa del Coihue con el follaje del juego;
  - interior y trono más grandes;
  - poses y animación con el esqueleto de `gente-cuerpo`;
  - que el estilo A se distinga más del C.

# Decisiones de diseño y equilibrio (respondidas el 26-10-2026)

Respuestas del usuario a las preguntas abiertas de `CAMBIOS_4_10_1_*` a `CAMBIOS_4_10_4_*`. **Todavía no se implementó nada**: es la lista de lo que se hace cuando el usuario diga «arrancá».

## Se hace
1. **Pesadilla (R11/D8/R2-9):** subir el tope de 24 duendes por oleada sólo en Pesadilla, para que conserve el +30 % toda la partida.
2. **Mandamás (R5/D15):** estudios del bestiario a 1/2/4 caídas (el premio del tercero sigue en +5 % de daño).
3. **Otra vuelta (E2):** la vuelta 2 conserva todo: habilidades, bestiario, trofeos y reglas elegidas.
4. **Panadera (S2-7):** 3 panes a $600 (precio de mercado).
5. **Pájaros (Q4/R2-8):** pasarlos al bus «El bosque» (el texto no cambia, no hay que retraducir).
6. **Gramola (Q7):** pasa a respetar «Solo el bosque» y la perilla de Música.
7. **Noches más largas con «Hora de tu reloj» (D7):** deshabilitar la combinación (chip apagado).
8. **Nueva partida (U9):** el motivo de lo bloqueado se escribe debajo del chip.
9. **Choque (G-7):** horno de la panadería, barril y mesa de quesería pasan a tener choque.
10. **Torreón (G-8):** correr la mesa 10 cm al oeste (también la alfombra y el farol colgante).
11. **Sombras de antorchas (V10):** cada una con su opacidad.
12. **Empleado (D3):** el que sale de turno sale caminando desde el local.
13. **Versión de la partida (E3):** una versión vieja no guarda encima de una partida más nueva.
14. **A* de la noche (H2-3 b y c):** repartirlo en varios cuadros (la ruta nueva se aplica 2 a 5 cuadros después).

### Segunda tanda (misma fecha)
15. **Órdenes y refuerzos del giro (C11/B11c):** persisten entre noches (no se reinician).
16. **Diario y Puesto Alto (A14):** las tres cosas: anotación «conociste a Fermín/Belisario/Tobías», encargo del Puesto Alto en el tablón y botón para soltar un papel del tablón.
17. **Fermín/Belisario/Tobías (D1):** reintentar armarse cada tanto si no hubo lugar.
18. **Bordes de la gente (R10/D2):** al contratar a un compadre de visita se corta la visita; la novia empleada que aparece en dos lugares se prueba primero en una partida real (Electron) antes de tocar.
19. **Empleado (D3):** ya en la lista de arriba.
20. **Pies fijos (U10):** se arman desde el código con la tecla configurada (rehacer su traducción al final).
21. **Tablero de trofeos (U12):** pasa de aviso de 5,6 s a panel que se cierra a mano.
22. **Semilla del cantero (S5):** se elige con Tab o la rueda.
23. **Picada de la tarde (S6):** aclarar el texto del encargo a «entre las 19 y las 22».
24. **Recetas y ropa (P4):** viajan también a una ranura vacía («Empezar acá»).
25. **Pájaros dentro de casa (Q5):** se atenúan con la puerta cerrada.
26. **Radio de madrugada (Q12):** puede apagarse y descarta el audio que llega tarde.
27. **Casa de Té (S2):** la demanda del pueblo sigue el calendario.
28. **Guardado (M8):** si falla el `rename`, no escribir directo: devolver `false` y queda la copia anterior.
29. **Empaquetado (M11):** `empaquetar.ps1` pregunta antes de matar un `Hojarasca.exe` abierto y el `.sh` verifica el `index.html` del asar como el `.ps1`.
30. **Madrigueras (V7):** el suelo de las de ladera sigue el terreno (aceptado el costo de memoria).
31. **Postes del tablero (V13):** se calzan en laderas laterales.
32. **Foco (U7):** arreglar el foco al redibujar la lista de la mochila y las pestañas del cuaderno.

## No se hace
- Huellas del Coihue (V8): quedan como están.
- Novio/novia o cita invitados al té/mate (E4): siguen aceptando.
- Piña del Coihue (D9): hay que cortar al menos una raíz; «Entre las cenizas» (D14): sólo cuenta la base, no tus caídas.
- Cartel de sobrecarga (A10): queda mostrando el total que hay que liberar.
- Relojes desfasados en la sincronía (E11): se deja.
- Bloom, rayos y agua al «Bajar» (P6): sólo baja la resolución.
- Cadena «grande» de las noches (R12): no se toca hasta jugar el equilibrio.
- `cerrarCuenta` todo o nada (S2-9): queda como está (a favor del jugador).
- S2-7 y el resto de la sección «Se hace» siguen siendo la lista de trabajo.

## Sin responder
Nada: todas las preguntas abiertas de las 4.10.1 a 4.10.4 tienen respuesta.

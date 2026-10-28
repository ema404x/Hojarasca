# Historia nueva (de cero) — decisiones del usuario (28-10-2026)

Todavía NO se implementó nada de esto. Se hace en etapas: guion → aprobación del usuario → motor de escenas (en paralelo al guion) → misiones y escenas por capítulo.

## Decisiones
1. **Duración:** 5 a 8 horas de juego (hoy la Historia dura unas 2 a 3, estimado).
2. **Método:** empezar la Historia de cero. Un guion nuevo completo; lo actual (8 capítulos de `src/historia.js`) se reemplaza. Se pueden reutilizar los sistemas del juego (tarjetas, eventos del valle, charla con vecinos, economía del Relax), no el guion.
3. **«Guionadas» significa:** escenas con cámara y diálogos; misiones con varios pasos y giros (no sólo «juntá X»); personajes con arco propio (Ramón, Josefina y los vecinos con subtramas y relaciones que evolucionan); elecciones que importan (cambian misiones y finales).
4. **Dónde va:** todo en el juego base. No se manda a un DLC (esto reemplaza la nota «las historias largas van al DLC» para esta Historia).
5. **Incluye lo ya decidido para los duendes** (`DECISIONES_HISTORIA_DUENDES.md`): tono de misterio ambiguo; los duendes sólo se ven y se oyen; noche de defensa con arsenal prestado y misiones previas para conseguir las armas; dos finales (trato o pelea). Esa parte se está construyendo en la 4.13.0 (ramas `v4130-a` y `v4130-b`) y se integra al guion nuevo.

## Reglas permanentes (siguen valiendo)
Sólo teclado y ratón; textos en castellano rioplatense (el inglés se hace al final, no se escribe); nada religioso ni figuras sagradas del folclore real; lo sensual sugerido nunca explícito; la Historia es el Relax con `relaxTipo='historia'` y no se mezcla con las reglas del Desafío; ideas rechazadas (ver `DECISIONES_DISENO_4_10.md`) no se vuelven a proponer.

## Etapas
1. **Guion** (agente de redacción): biblia de la historia con capítulos, personajes y arcos, misiones paso a paso, escenas, elecciones y finales, y cómo entran los duendes. Se muestra al usuario para aprobar.
2. **Motor de escenas** (en paralelo): director de escenas con cámara dirigida, diálogos que avanzan con tecla o clic, saltear escena, pausa que respeta el guardado.
3. **Contenido:** misiones y escenas capítulo por capítulo, con pruebas por capítulo.

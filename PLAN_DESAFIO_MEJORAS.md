# Hojarasca — mejoras del modo Desafío (notas del 21-10-2026, para seguir en otra sesión)

El usuario pidió planificar mejoras del Desafío; la charla quedó en el arranque (se le hicieron tres preguntas y no llegó a responderlas): **retomar acá con ellas**. Nada se ejecutó.

## Lo que ya existe (leído de los documentos, no jugado en esa sesión)
- Desde la 3.8.0 el Desafío es **«La noche de los duendes»** (`PLAN_3_8.md`, `CAMBIOS_3_8_0.md`): los extraterrestres pasaron a ser duendes (traviesos al anochecer, oscuros de noche), el jefe es **el Coihue Viejo** con **el Rey Duende** en el corazón (reemplaza a la nave nodriza y la Madre). En el Relax los duendes son sólo leyenda (la abuela Herminia cuenta «la noche en que salieron los duendes»). Nada religioso ni figuras sagradas del folclore real.
- Ya hechos: el modo sin fin con top 10 por dificultad (3.8.4), el código de la semana (se conserva aunque se saque el torneo), noches grandes, defensas, aliados, fortín, asedio, nido, zanja, supervivencia, tutorial, logros y mapa del Desafío (≈40 archivos `src/desafio-*.js`).
- **Pendiente anotado en la 3.8.0:** la lechuza se ve tosca; las raíces del cofre del alba parecen patas; los huesos del Rey Duende son pivotes rígidos (no piel por huesos); los sonidos nuevos se generaron pero nadie los escuchó; falta medir en la 4600G la subida, la noche final con 30 duendes y el corazón.
- **Ideas aprobadas el 9-10 (`DECISIONES_3_8_4.md`, «La noche de los duendes, más») que en el código NO se encuentran** (búsqueda por nombre en `src/desafio*.js`; pueden existir con otros nombres: verificar jugando): más tipos de noche (niebla, luna llena con los viejos, la de los ladrones —sólo traviesos que roban—, tormenta); duendes nuevos (uno que se esconde en los árboles, uno que apaga las antorchas, uno que cura a los demás); defensas nuevas del bosque (trampas de miel, espantajos con campanitas, faroles que encandilan); aliados de la aldea en las noches grandes (Anselmo arregla defensas rotas, la abuela Herminia prende faroles y fogones, Martín pasa con la trochita tocando el silbato, los chicos tiran piedras con hondas desde la empalizada); y que la primera noche dé miedo desde el principio.
- Steam: la demo incluirá las primeras 5 noches del Desafío (`DECISIONES_3_8_4.md`).

## Preguntas que quedaron sin responder (retomar)
1. ¿Qué mejorar? (marcar todo): más variedad de noches y duendes; más defensas y aliados; más miedo y ambiente (clima, tensión, sonido y música; pulir la lechuza, las raíces y el Rey Duende); rejugabilidad y progreso (mejoras entre partidas, recompensas que pasen al Relax, desafíos semanales, variantes de mapa).
2. ¿Cuál es hoy el mayor problema, jugándolo? (se vuelve repetitivo / la dificultad / falta de motivo para volver / no lo jugó lo suficiente y conviene una revisión del estado actual primero).
3. ¿Cómo se relaciona con el Relax? (separados como hoy / recompensas que pasan al Relax / el Relax da ventajas al Desafío).

## Para tener presente
- Los sistemas de la 4.2 a la 4.4 (pesos, negocios, depósitos, pico) son sólo del Relax; en el Desafío no existen, salvo el pico (arranca con hacha y pico) y el acopio con tope de 40 (decisión a revisar: `CAMBIOS_4_4_2_CONSTRUCCION.md`, D2).
- Nunca se jugó «el Desafío con lo nuevo»: conviene empezar con una revisión del estado actual (jugar varias noches y anotar) antes de decidir.
- Medir fps en la 4600G, sobre todo la noche final y la subida.

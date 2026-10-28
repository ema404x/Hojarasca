# Duendes en el modo Historia — decisiones del usuario (28-10-2026)

Todavía NO se implementó nada. Se arranca cuando el usuario diga «dale». Análisis de base: en el código la Historia es el Relax con `relaxTipo = 'historia'` (estado en `progreso.historia`, 8 capítulos en `src/historia.js`); el Desafío es un modo aparte y no se mezclan sus reglas.

## Decisiones
1. **Forma:** combinar A y B: primero presencia y encuentros en capítulos (A), después una noche de defensa como clímax (B).
2. **Tono:** misterio ambiguo: no se sabe si los duendes son enemigos hasta el clímax.
3. **Encuentro (paso 2):** los duendes solo se ven y se oyen; no hablan con el jugador.
4. **Noche de defensa (paso 3):** el jugador usa un arsenal prestado (arco, honda y algunas defensas armadas), **pero antes hay misiones previas para conseguir las armas** (objetivos de capítulo para fabricarlas o ganarlas).
5. **Final:** dos finales (uno si hubo trato con los duendes y otro si hubo pelea).

## Plan propuesto (3 pasos)
1. **Presencia (chico):** en los capítulos 5 y 6, siluetas lejanas, risas de noche, luciérnagas raras. `instalarDuendes` y `precalentarDuendes` solo en Historia; animador mínimo (idle, mirar, correr, desaparecer); campo nuevo en `sanearHistoria` (con default).
2. **Encuentro con decisión (mediano):** evento del valle nuevo («los duendes en el galpón») con 2 o 3 opciones, que guardan la elección (trato o pelea) y llevan al final correspondiente. Misiones previas para conseguir las armas.
3. **La noche (grande):** noche guionada propia (no el Desafío entero): un solo lado de ataque, defensas prearmadas, arsenal prestado, resultado que vuelve como momento de capítulo, reintento sin castigo. Dos finales según la elección del paso 2 y el resultado. Medir fps en la Ryzen 5 4600G.

## Riesgos conocidos
- `verificar-3-1-historia.mjs` exige 6 a 8 capítulos (hoy 8): meter todo dentro de capítulos existentes o subir el tope; `verificar-3-8-3-relax`, `3-8-6-relax` y `3-8-7-progreso` fijan el capítulo 8; los trucos de consola («historia capitulo N») dependen del orden.
- `sanearHistoria` descarta campos desconocidos: declarar los nuevos ahí y en las pruebas de basura.
- La risa de los duendes en el Relax está apagada por decisión de la 3.8.5: encenderla solo en escenas de Historia.
- Rendimiento: la plaza anda justa; los duendes van instanciados; la noche entera hay que medirla.
- Las historias largas van al DLC: esto tiene que ser corto.
- No proponer lo ya rechazado (invasores que roban, trincheras, sabotaje, expediciones, noche de ladrones/tormenta, espantajos, farol que encandila).

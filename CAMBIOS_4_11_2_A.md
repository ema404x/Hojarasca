# CAMBIOS 4.11.2 · A: geometría y aspecto del mundo

Rama `v4112-a` (sale de `main` = 4.11.1). No se subió la versión ni se unió a `main`. Las decisiones del usuario son las de `DECISIONES_DISENO_4_10.md` (puntos 9, 10, 11, 30 y 31); el detalle de cada hallazgo, en `CAMBIOS_4_10_3_VISUAL_GEOMETRIA.md`. V8 (huellas del Coihue) no se toca, como se pidió.

## Qué se hizo

| Código | Qué | Dónde |
|---|---|---|
| G-7 | Los edificios de oficio propios ganan choque en lo grande que se atravesaba | `src/planos-oficios.js` (`fisica` de cada edificio) |
| G-8 | **Ya estaba hecho desde la 4.10.4** (R2-3): no se cambió código; se volvió a probar | `src/planos-ampliar.js` (sin cambios) |
| V10 | Cada sombra larga de antorcha con la opacidad de su nivel | `src/desafio-ambiente.js`, `src/desafio-ambiente-mundo.js` |
| V7 | El suelo de las madrigueras en ladera sigue el terreno (geometría por puesto) | `src/desafio-puestos-mundo.js` |
| V13 | Los postes del tablero de trofeos llegan al suelo en laderas laterales | `src/desafio-trofeos-formas.js`, `src/planos-trofeos.js` |

### G-7: choque en los oficios propios
El informe original no está en el repositorio, así que se revisó cada edificio de `planos-oficios.js` contra lo que dibuja. Los del pueblo (`aldea-arquitectura.js`, incluido el horno de barro de la panadería y los barriles) ya tienen choque; lo que no lo tenía eran las cosas grandes de **tus** edificios de oficio. Ahora chocan:
- Herrería: el barril de agua y la mesita de las tenazas.
- Carpintería: el caballete con el tronco y la pila de tablones del piso.
- Panadería de horno grande: la mesa de amasar (el horno ya chocaba).
- Cervecería: la mesa de degustación y el barril suelto.
- Telar grande: el cesto de lana.
- Quesería: la mesa de la prensa y los tarros de leche.
- Tienda de campo: los dos barriles de atrás del mostrador.
- Cantería: los bloques apilados, las lajas y la grúa de mano.

Quedan sin choque, a propósito, las cosas bajas o chicas (cestos de pan, leña, carretilla, banquito, fuelle, carbón, balde, bolsas de grano) y los demás muebles sueltos del juego (`mesa-campo`, `estante`, etc.), que no se tocaron.
Los edificios están abiertos de costado (sólo tienen choque atrás y en lo grande), así que ninguno se puede cerrar con esto: la prueba exige que se llegue a menos de 1,3 m del centro (donde se usa con E).

### G-8: el torreón
`mesas: [{ x: 0.2 }]`, la alfombra en `x: 0.2` y el farol colgante en `0.2` ya estaban corridos 10 cm al oeste desde la 4.10.4 (R2-3, pasaje de 0,69 a 0,79 m). Se verificó de nuevo con la prueba de alcanzabilidad (cuatro giros) y **caminando con el motor del juego** (humo): se entra por la puerta, se pasa entre la mesa y el hogar y se llega a z local 1,08.

### V10: sombras largas con su opacidad
La opacidad era del material (uno para las ocho sombras) y valía el máximo de la tanda. Sin shaders ni luces nuevos: ahora son tres mallas instanciadas (un `Group` llamado `sombras-antorcha`), una por nivel de opacidad (0,65 / 0,75 / 0,84 según `alfa` 0..0,5; `nivelDeSombra` y `OPACIDAD_SOMBRA` en `desafio-ambiente.js`). Los tres materiales son clones del mismo `MeshBasicMaterial` (mismo programa; sólo cambia un número que no se toca más); el de la carga sigue compilándose al arrancar. El tope de 8 sombras sigue.
- Costo medido en el juego (Electron, con tu sombra y tres duendes): **+2 llamadas de dibujo** (de 182 a 184, antes sumaba 1 en total: ahora una por nivel con sombras; como mucho 3). Triángulos: +8 (los de dos cuadrados).
- `_sombras` ahora es el grupo (para la humo de la 4.8 sigue valiendo `.visible`).

### V7: el suelo de las madrigueras
`calzarSuelo(grupo, altura, x, z, y0)` (en `desafio-puestos-mundo.js`) le da a cada puesto su copia de la **posición y la normal** del suelo (montículo y raíces) con cada vértice a la altura del terreno de su lugar y la normal inclinada con la pendiente (cizalla: `n' = (nx − fx·ny, ny, nz − fz·ny)`). El color y los índices se siguen compartiendo. Sólo si el terreno se aparta más de 12 cm (`LADERA_PUESTO`) de lo llano en los 7 m del suelo; la decisión es del grupo entero (montículo y raíces se mueven juntos). Al sacar el puesto de la lista se sueltan (`dispose`) sus copias.
- **Memoria medida**: 67 KB por madriguera en ladera (la compartida entera pesa 145 KB y se sigue compartiendo con los puestos en llano); cuatro madrigueras: 268 KB. El terreno real casi no tiene llanos de 14 m (el mejor se aparta 14 cm a 7 m), así que casi todas las madrigueras reales llevan copia: con unas 10 a la vez serían menos de 0,7 MB.
- **Dibujos medidos** (humo, cámara quieta, dibujo directo): una madriguera a la vista suma 24 llamadas de dibujo y 86.820 triángulos **antes y después, iguales** (sigue habiendo dos mallas de suelo por puesto). En la GPU las geometrías se suben al dibujarlas, así que sólo cuestan las de las madrigueras que se ven.
- Con el terreno real, el suelo nunca se aleja del terreno más de 0,46 m (lo que sobresalen el montículo y los lomos de raíz); con la geometría compartida de antes se iba a más de un metro.
- Captura antes/después: ver la lista de abajo (`desafio-madriguera-antes-*` y `-despues-*`): antes, una loza negra flotando en el aire cuesta abajo; después, el montículo y las raíces apoyados en el terreno.

### V13: postes del tablero
`armarTablero(c, colgados, suelo)` recibe el `suelo` que ya le pasa `construccion.js` a cada `arma` (ver `calces.js`) y, si el terreno bajo un poste está más de 4 cm por debajo del pie, agrega una caja del mismo poste hasta el suelo (+18 cm enterrados). En llano no se agrega nada (misma malla que antes). `alturaDelPoste` es la regla pura.

## Decisiones propias (sin consultar)
1. G-8: no se cambió nada (ya estaba), se dejó escrito acá y se sumó a la prueba nueva.
2. G-7: sólo los edificios de oficio propios y sólo lo grande (ver arriba). Los círculos y segmentos se pusieron en la mitad de atrás o a los costados de cada edificio, no en el frente.
3. V10: tres niveles y no por-sombra continuo, porque una opacidad por sombra exigiría un atributo por instancia (shader nuevo) o una malla por sombra (más dibujos). Tres mallas fijas es lo que cabe sin shaders nuevos.
4. V7: umbral de 12 cm para copiar; la decisión es del grupo entero. Se corrigen también las normales (si no, el montículo inclinado se iluminaba como si estuviera plano).
5. V13: el poste agrega una caja entera hasta el suelo, enterrada 18 cm; el poste de arriba de la ladera queda hundido en el terreno (no se toca).

## Pruebas
- Nueva `pruebas/verificar-4-11-2-mundo.mjs` (gate: `node herramientas/sumar-prueba.cjs . verificar-4-11-2-mundo.mjs`; 103 pasos): G-7 (16 cosas × 2 giros con el choque real del juego; entrada y alcance al centro de los 8 edificios en dos giros por búsqueda en anchura con la física del jugador), G-8 (texto de la mesa/alfombra/farol y alcance al fondo del torreón en dos giros), V10 (reglas de niveles y el mundo de ambiente real en Node con una antorcha, el jugador y duendes: dos sombras, dos opacidades distintas, tope de 8, esconder y limpiar), V7 (regla pura, geometría compartida intacta, vértices sobre el terreno, normales, y el enganche con `crearPuestosMundo` sobre el terreno real: llano comparte, ladera copia y suelta al salir), V13 (cuatro laderas y el control en llano).
- Mutaciones a propósito (todas hacen fallar la prueba): quitar un choque (quesería, herrería); volver la mesa del torreón a 0,3; un choque que tapa el centro; sombras siempre del mismo nivel / opacidades iguales; umbral de V7 enorme / sin enganche / sin `dispose` / normales planas; V13 sin pasar el `suelo` / sin la extensión.
- Ajustada una existente, lo mínimo: `verificar-4-8-ambiente.mjs` (una expresión regular que miraba `sombras.setMatrixAt(0, _m); sombras.count = 1;`, ahora `nivelesSombra[0]...`). Nada se aflojó.
- `pruebas/humo-4-11-2-mundo.cjs` (partida real, Electron; `--modo=relax` y `--modo=desafio`): caminando con el motor del juego, los edificios de oficio, el torreón, el tablero en una ladera real, cuatro madrigueras en laderas reales (antes/después) y las sombras con una antorcha de verdad.

## Verificación
- `npm run verify`: **301 pasos OK, de corrido** (los 300 de la 4.11.1 más la prueba nueva).
- `verify:paralelo` durante el trabajo: un paso con falla, `verificar-construccion-premium-rc6`, por el tiempo (20 s dentro de una `vm`, con 14 procesos más y otros agentes con Electron); solo pasa en 6,6 s. **Es de tiempo, no un bug.**
- Partidas reales (Electron, notebook, monitor externo, `-Visible`): `humo-4-11-2-mundo` en las dos modalidades, todo en verde. Existentes: `humo-4-8-ambiente` (sombras) y `humo-4-10-base` (trofeos) sin fallas.
- Capturas a tamaño completo (1600×900), en `pruebas/salidas/mundo-4-11-2/` de la carpeta de trabajo (no se versionan): `relax-torreon-*` (planta baja, pasaje, fuera), `relax-oficio-*` (panadería, quesería y cantería, de frente y de lado), `desafio-tablero-*` (ladera de frente y poste de abajo, llano), `desafio-madriguera-antes-*` y `-despues-*` (de costado, desde abajo y desde arriba), `desafio-sombras-*`.

## Lo que no se verificó / avisos
- `humo-4-2-oficios` falla en «E retira 8 panes / 4 ponchos» (0 → 0) y `humo-3-0-contra` en «la noche 4 bajan 16»: **también fallan en la 4.11.1 sin estos cambios** (se corrieron en una copia de `main`). No son de esta tanda; sin arreglar (son de las pruebas o de la carga/inventario).
- G-7 no cubre otros muebles sueltos fuera de los oficios propios; si el informe original hablaba de otro edificio, no se pudo saber (el informe no está en el repositorio).
- V10: el cambio de aspecto de la noche se miró en una escena (antorcha y cuatro sombras); queda por ver con una noche grande y muchas antorchas. La diferencia entre niveles (0,65 a 0,84) es sutil sobre el suelo oscuro.
- V7: sólo se miró en cuatro laderas de 1,6 a 1,8 m de desnivel a 7 m; en pendientes muy fuertes (> 3 m) el suelo copia el terreno pero no se miró. La normal inclinada se verificó en Node, no por la luz en pantalla.
- V13: se miró una ladera de 0,47 m en 3,3 m; no hay prueba con el trofeo colgado (no cambia la geometría de los trofeos).

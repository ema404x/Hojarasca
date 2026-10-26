# Hojarasca 4.11.3 — Proceso y guardado (última de las cuatro versiones con las decisiones de diseño)

Rama `v4113-integra` (sobre `main` = 4.11.2). Viene de `v4113-a` (`CAMBIOS_4_11_3_A.md`, con el detalle).
Decisiones del usuario: `DECISIONES_DISENO_4_10.md`. Con esta versión quedan implementadas todas las decisiones de esa lista.

## Qué trae
- **Partida de una versión más nueva = sólo lectura:** si una versión vieja del juego abre una partida guardada por una más nueva, no la pisa: ni el botón, ni el autoguardado, ni el guardado al cerrar, ni el respaldo, ni la copia a la carpeta sincronizada. Se ve el aviso en la portada, una marca fija «Sólo lectura: no se guarda», la nota al entrar y un texto en la pausa. Empezar de nuevo, Otra vuelta, importar y borrar siguen permitidos (son órdenes del jugador); las opciones del juego (volumen, calidad) se siguen guardando.
- **Guardado seguro:** si falla el `rename` (p. ej. el sincronizador tiene el archivo tomado), ya no se escribe directo: se borra el temporal, queda la copia anterior y se reintenta en el próximo guardado; el aviso sale al tercer fallo seguido.
- **Ruta del Coihue repartida en cuadros:** el A* corre en 350 unidades de trabajo por cuadro, con el mismo resultado. En la notebook: base despejada de 1,6 a 2,1 ms en un cuadro a 0,6 ms; base cercada de 13 ms en un cuadro a 0,6 a 0,8 ms por cuadro durante 11 cuadros.
- **Empaquetado más seguro:** `empaquetar.ps1` pregunta antes de cerrar un `Hojarasca.exe` abierto (`-Forzar` lo cierra sin preguntar, `-EnSeco` sólo decide); sin consola interactiva no mata nada. El `.sh` tiene lo equivalente y ahora también verifica el `index.html` del asar.

## Decisiones de la junta
- Conflicto sólo en `package.json` (línea `verify:pasos`), resuelto a mano.
- No se hizo la parte (b) de H2-3 (compartir distancias entre los tres intentos de la ruta).
- Textos nuevos sólo en castellano.

## Verificación
- `npm run verify` de corrido: **303 pasos OK** (302 de la 4.11.2 + la prueba nueva, 617 comprobaciones, 26 mutaciones a propósito atrapadas).
- Partidas reales sobre la junta (ocultas, de a una, en el monitor externo): `humo-4-11-3-proceso` (33 de 33), `humo-4-11-0-vuelta`, `humo-4-10-1-guardado`, `humo-guardado-roto` y `humo-partidas` sin ninguna línea fallida; `humo-3-0-asedio` llega al final sin fallas.

## Pendiente
- **Sin probar:** una carpeta sincronizada real (Dropbox, OneDrive; el `rename` que falla es simulado), el empaquetado completo con un `Hojarasca.exe` abierto, la marca «Sólo lectura» en una captura, y los milisegundos en la 4600G.
- `humo-4-10-1-guardado` y `humo-4-10-base` fallan a veces por tiempo (`enTren`: el mundo no estaba listo) y pasan al repetirlas.

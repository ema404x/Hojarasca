# Hojarasca 4.14.0 — Motor de escenas (EN CURSO)

Rama `v4140-escenas`, worktree `trabajo\tescenas`, sobre `main` = 4.12.3. No se subió versión.

## Estado al pausar
**Hecho:** sólo la investigación y el diseño. No hay código escrito todavía (ningún archivo de `src/` ni de `pruebas/` tocado), no se corrió Electron ni el gate, no se tomó el candado `hx\electron.lock`.

**Falta (todo):** `src/escenas.js`, `src/escenas-mundo.js`, estilos, la escena demo, el truco, el enganche en `main.js`, pruebas, humo, el gate y la documentación de la API de este archivo.

### Lo que se averiguó (para no repetirlo)
- Josefina es `ema` en el código (`gente.gente`, campo `clave`). Los NPC se buscan en `gente.gente` por `clave`.
- Para capturar un NPC se sigue el patrón de `cantina-juego.js` (`tomar`/`soltar`): `conVos=true`, `enCita=true`, `pose=null`, `soloCerca=0`, `dormido=false`, y al soltar restaurar lo guardado (`camino` vuelve a su valor original: los de `ruta` no tienen `camino`). Caminar: `n.camino = [{x,z,cerca}]` (lo consume `caminarHacia` en `gente.js`). `aldea-gente.js` no toca a los `conVos`.
- Las poses existentes (`g.pose`) son palear, hachar, mirar, aplaudir, contar, brindar, tocar, etc., y las de quietud (`g.__quietud`: cintura, cruzados, barba, gorro, atras, delantal, juntas). **No existen «saludo» ni «señalar»**: hay que hacerlas en `escenas-mundo.js`, aplicadas después de `gente.actualizar` (main.js ~10847) moviendo `brazos[i].rotation` y `codo`, con mezcla de entrada y salida.
- La cámara la pone `jugador.actualizar` desde `estado.yaw/pitch`. Idea: dejar que corra (con `activo()` en falso durante la escena para que no lea input) y después pisar `camara.position` y `rotation` (orden `YXZ`, yaw/pitch) con la pose dirigida; al final, mezclar desde la última pose hacia la que dejó `jugador.actualizar`. Interpolar yaw/pitch por el camino corto, no el punto de mira.
- Puntos de enganche mínimos en `main.js`: `activo:` del jugador (línea ~872) y `alSoltar:` (~880, hoy Esc con el mouse bloqueado abre la pausa: durante la escena hay que soltar el mouse al empezar y que `alSoltar` no abra pausa); el clic del lienzo (~3363) no debe bloquear el mouse en escena; el `keydown` (~3367, interceptar temprano: Enter/Espacio avanzan, Esc/Tab saltan, 1–4 eligen, F1 deja pasar a la pausa); el cuadro (~10640, llamar al director con `dtReal` sólo si `modo==='jugando'`) y tras `gente.actualizar`; `guardar()` (~9590, como `banco.activa`: no guardar mientras corre una escena); `btn-inicio` (~2531): saltar la escena antes de guardar.
- Guardado: el `abrir('pausa')` llama a `guardar()`, así que se guarda al pausar. Decisión: durante una escena `guardar()` no escribe (como el banco de pruebas); las vistas se marcan sólo al terminar o saltar; `enCurso` nunca se persiste. Así al recargar la escena queda pendiente y los efectos no se duplican.
- Estado de «vistas»: clave propia `progreso.historia.escenas = { vistas:{id:día}, elecciones:{escena:{eleccion:opcion}} }`, saneada por `sanearEscenas` (en `escenas.js`; rechazar `__proto__`, `constructor`, `prototype`; tope de cantidad). Enganche en `historia.js`: un import y una línea `h.escenas = sanearEscenas(v.escenas);` justo antes del comentario «una historia terminada no vuelve atrás». No tocar `historiaNueva` (v4130-a le agregó `duendes` ahí y en `sanearHistoria` la línea `h.duendes = sanearDuendes(...)` está pegada a ese lugar); un accesor `escenasDe(historia)` crea el default si falta.
- Truco: comando `escena` (`demo`, `saltar`) en `src/trucos.js` + entrada en `AYUDA` de `trucos-textos.js` + `m.escena(id)` en el mundo de `trucos-juego.js` y `ctx.pedirEscena` en `main.js` (~11318); la escena arranca cuando `modo` vuelve a `'jugando'`. La demo se registra sólo al invocar el truco y es efímera (no marca vistas). Revisar `pruebas/verificar-trucos.mjs` por conteos de comandos.
- UI: DOM creado por JS con `<style>` inyectado (como `CSS_VALLE` de `historia-ui.js`), z-index 45 (las tarjetas usan 40); barras de cine, caja de diálogo con máquina de escribir, botones de elección, velo de fundido, y `body.escena-en-curso #hud` atenuado.

### Diseño del formato de datos (a documentar al terminar)
Escena: `{ id, titulo, repetible?, efimera?, personajes:{ref:{clave,nombre,color}}, pasos:[...] }`. Pasos: `plano`, `dialogo`, `gesto`, `espera`, `sonido`, `hora`, `clima`, `eleccion`, `efecto`, `fundido`, `salto`; cada uno con `sinEsperar` y condición `si:{eleccion,es}`; las opciones de una elección pueden llevar `a:'etiqueta'`. Saltar aplica lo que falta en orden (efectos, posiciones finales de gestos, hora final, elección por defecto) y marca la escena vista.

### Próximos pasos concretos
1. `src/escenas.js` (puro, probable en Node): validación, director con adaptador de mundo falso, cámara con yaw/pitch, saltar, elecciones, `sanearEscenas`.
2. `src/escenas-demo.js` («Llegada de Josefina», 3–4 planos, 6–8 líneas, una elección).
3. `src/escenas-mundo.js` + CSS + enganches mínimos descritos arriba.
4. `pruebas/verificar-4-14-0-escenas.mjs` con mutaciones, sumarla con `node herramientas/sumar-prueba.cjs . verificar-4-14-0-escenas.mjs`; `pruebas/humo-4-14-0-escenas.cjs` (con candado de Electron, monitor externo, `-Visible` para capturas).
5. `node armar.mjs`, `npm run verify` completo y anotar la línea «verify: N pasos OK».
6. Completar este documento (API, decisiones, verificación, lo no visto).

## Verificación
Nada verificado todavía.

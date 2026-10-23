# 4.10.1 · NPC (rama `bugs-410-npc`, sale de `origin/main` = 4.10.0)

Arreglos del informe `trabajo/bugs3/zona-NPC.md` (11 hallazgos + 3 dudas). Primero se reprodujo cada uno con los arneses del informe (portados a esta copia);
lo que no se confirmó, se descartó y queda anotado. Todo con su prueba en `pruebas/verificar-4-10-1-npc.mjs` (enganchada al gate; ejecuta la conducta con los módulos reales
y un mundo de mentira: `pruebas/ayuda-npc-mundo.mjs`). No se subió la versión.

## Estado de cada hallazgo

| # | Hallazgo | Estado |
|---|----------|--------|
| 1 | Vecino contratado en dos lugares (club de lectura / noche de estrellas) | **Arreglado y probado** |
| 2 | Compadre empleado que viene «de visita» a tu mesa | **Arreglado y probado** |
| 3 | Comprarle el negocio a un empleado: dos sueldos y dos lugares | **Arreglado y probado** |
| 4 | Lena, Chela, Ana y Susana con cuerpo de varón | **No se confirmó (falso positivo del arnés)** |
| 5 | El chico que estudia afuera aparece en la plaza del concurso | **Arreglado y probado** |
| 6 | «de el almacén» (socio, retiro, cuaderno, historial, libro) y «al comprarla» | **Arreglado y probado** |
| 7 | «En ese horario deja su panadera» | **Arreglado y probado** |
| 8 | «Eso ya no es tuya» | **Arreglado y probado** |
| 9 | Regex `/@(d+)$/` con la barra perdida | **Arreglado y probado** |
| 10 | «Los vecinos se suman a la noche» sin «y» | **Arreglado y probado** |
| 11 | Pospuestos viejos E4–E9 | **Pospuestos** (ver abajo) |
| D1–D3 | Las tres dudas | **Sin tocar** (preguntas abajo) |

### 1 · club de lectura y estrellas × empleado de turno
Reproducido (`club.mjs`: dobles todos los miércoles de club desde las 18:00). Causa: `noticiasDestino` (main.js) no miraba si el vecino estaba de turno.
Arreglo: `empleadosNegocioJuego.deTurno(k)` (de turno ahora y sin que la aldea se lo haya llevado a una fiesta o cita); `noticiasDestino` devuelve `null` para quien está de turno,
así `rutinaAldea` lo deja «fuera» y no va al club ni a las estrellas. Prueba: 12 días de club/estrellas de la partida de 400 días, con dos asistentes contratados cada día,
minuto a minuto de 15 a 20:40: 0 dobles (antes 11 en 120 días). Cuando termina el turno puede volver a ir.

### 2 · visita del compadre
`puedeVenir` y `traerVisita` (main.js) también preguntan `deTurno`: el empleado de turno no «puede venir» ni lo trae `traerVisita` (ni la visita restaurada al cargar).
Se elige otro compadre / se saltea el turno de visita, como cuando no hay nadie. Prueba: con la figura de aldea existente (el caso del informe), `puedeVenir` da falso,
`traerVisita` devuelve falso sin dejar visita ni figura «de visita»; libre del turno vuelve a poder venir.

### 3 · comprarle el negocio a un empleado tuyo
`cerrarCompra` (negocios-vecinos-juego.js) llama a `liberarEmpleado(vecino, 'compra')` (el mismo camino que ya usaba la venta de la 4.4.3): el empleo termina con aviso
(«X dejó de trabajar en tu local» en el aviso de la compra y «Le compraste su negocio: ya no atiende tu local» en el del empleo), se le paga lo del turno en curso y no hay castigo de amistad.
Prueba: Rosa contratada, se cierra la compra, queda sin empleo, la rutina la devuelve a su panadería, no vuelven a aparecer asientos «Sueldo: Rosa» y la guarda del 4.4.2 (no se la puede contratar de nuevo) sigue.

### 4 · NO SE CONFIRMÓ
El arnés `mujer.mjs` armaba con `R = {}`; el juego arma con `ROPA[clave]` (gente.js:558/564), y `ROPA['visitante-lena']`, `visitante-chela`, `visitante-ana` y `familia-mama` ya traen `trenza`/`pollera`/`rodete`,
con lo cual `mujer` da verdadero (el mismo arnés da «varón» también para la panadera del pueblo, que es obviamente mujer). Comprobado en geometría real (hash de `crearPersona` con `ROPA[clave]` = `mujer: true`)
y en el visor del juego: capturas a tamaño completo en `trabajo/bugs410/npc/mujer-ya-correcta-{visitante-lena,visitante-chela,familia-mama}/` (falda larga, rodete, cara de mujer; el visor no pasa los colores de la
persona, sólo la forma). Sin cambios de código; la prueba queda como regresión (los cuatro, y los tres varones siguen siendo varones).

### 5 · chico que estudia afuera
`presentes` de `concursos-juego.js` excluye a quien tiene `chicoAfuera`: no va a la plaza, ni de jurado, ni compite en el fallo. Prueba: control con el chico en casa (va a la plaza) y con el chico afuera (no).

### 6/7/8 · textos
`deNegocio()` y `loDe()` en `negocios-vecinos.js`: «Sos socio del almacén», «Te retiraste de la sociedad del almacén», «Socio del almacén de Ercilia», historial «retiraste la caja del almacén»,
asientos del libro «Caja del almacén de Ercilia», «Tu parte del almacén de Ercilia, al comprarlo» (y «al comprarla» para los femeninos). «Eso ya no es tuyo» (neutro, siempre).
Al contratar: «En ese horario deja lo que hacía» (ya era lo que decía con los vecinos de la aldea; se unificó). Prueba: los ocho negocios × compra/sociedad/aporte/retiro/venta, cuaderno y libro, sin «de el», «Eso … tuya» ni placeholders.
Los asientos ya escritos en partidas viejas no se tocan.

### 9 · regex
`/@(\d+)$/` en `vecindad.js`. Efecto: ahora sí se olvida lo comentado de días viejos (como decía el comentario del código). Prueba de conducta con `comentarioSobreVos`.

### 10 · «y»
«Anselmo, la abuela Herminia y los chicos». Prueba por texto (el aviso vive en un cierre de la partida de Desafío que no se puede armar en Node).

### 11 · pospuestos
- E4 (`invitar` acepta a quien camina con vos): cambiaría lo que se ve al invitar; es una **pregunta** (abajo).
- E5 (radio vs. charlas con Julia), E6 (avisos que se repiten al recargar), E7 (jóvenes con charlas de chicos), E9 (lluvia): no son triviales ni obviamente un bug; sin tocar.

## Pruebas
- Nueva: `pruebas/verificar-4-10-1-npc.mjs` (59 comprobaciones), enganchada al gate (`sumar-prueba.cjs`). Helper: `pruebas/ayuda-npc-mundo.mjs`.
- Verificadas contra el código viejo: las secciones 1, 3, 5 y los textos fallan sin los arreglos.
- Ajustes mínimos a pruebas existentes que fijaban texto o firma exacta: `verificar-3-7-5-noticias` y `verificar-3-9-0-cantina` (la línea de `noticiasDestino` ahora lleva `|| empleadosNegocioJuego?.deTurno(k)`),
  `verificar-4-4-3-venta` (firma `liberar(k, motivo)`, la compra también suelta al empleado, «Eso ya no es tuyo»).
- Humo en Electron: `humo-4-4-empleados.cjs` (contratar, figura, turnos, despedir) «TODO BIEN» con los cambios.
- Gate y caos: ver el final de este documento.

## Decisiones tomadas sin consultar
1. **Un vecino con turno activo no va al club, a las estrellas ni a visitas** (en vez de pausar el turno). Es lo más conservador: el turno, el sueldo y la figura del mostrador no cambian; lo que cambia es que ese miércoles el vecino no va al club (queda un lugar menos en la lectura).
   Las fiestas, citas y el asado siguen mandando sobre el turno como antes (el empleado se ausenta y cobra).
2. **Al comprarle el negocio a un empleado, el empleo termina con aviso** (no se bloquea la compra), copiando lo que ya hacía la venta de la 4.4.3. Si preferís bloquear la compra («despedilo primero»), es un cambio chico en `cerrarCompra`.
3. **Hallazgo 4 descartado** en vez de «arreglarlo» con ASPECTO nuevo: no hay nada que arreglar.
4. «Eso ya no es tuyo» y «deja lo que hacía» sin variar por género/oficio (la forma más corta que no cambia otros textos).
5. La regex arreglada activa por primera vez el olvido de lo comentado viejo (era el comportamiento descrito y no tiene efecto visible con el tope actual).

## Preguntas para el usuario
- E4: ¿el vecino que camina con vos (novia/novio) o está en una cita debería negarse a que lo invites al té/mate, con una frase como la de «de visita»? Hoy acepta.
- D1 (`gente-campo-mundo.js:143`): si Fermín/Belisario/Tobías no encuentran lugar libre al armarse (árboles/rocas con otra calidad gráfica), nunca se vuelve a intentar en la sesión. ¿Reintentar cada tanto? No se pudo reproducir en Node.
- D2 (`amor-mundo.js:693`, `amor-escenas.js:472`): novia que es tu empleada cuyo paseo ya venía andando cuando empieza el turno: posible parpadeo y estar en el mostrador a la vez. Depende del orden de actualización en `main.js`; sólo por lectura. ¿Probar en partida real?
- D3: el empleado que sale de turno reaparece donde la rutina lo dejó (su puerta de las 8:29) y camina desde ahí, no desde tu local. ¿Lo hacemos salir desde el local?
- Borde sin cubrir: contratar a un compadre que justo está de visita en tu mesa (la visita ya en curso no se corta; sólo se impide que empiece).

## Cierre
- `npm run verify` de corrido: **282 pasos OK** (281 de la 4.10.0 + la prueba nueva), sin fallas.
- `node pruebas/humo-caos.cjs`: limpio («sin errores en 934 pasos»).

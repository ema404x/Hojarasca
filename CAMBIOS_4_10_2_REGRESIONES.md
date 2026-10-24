# 4.10.2 · regresiones del pase 4.10.1 (zona R) y sistemas del Relax (zona S)

Rama `bugs-4-10-2-regresiones` (sale de `origin/main` = 4.10.1). Sin subir la versión, sin push. Informes de origen: `trabajo\bugs4\zona-R.md` y `zona-S.md`.
Pruebas nuevas: `pruebas/verificar-4-10-2-regresiones.mjs` (120 comprobaciones, enganchada al gate con `sumar-prueba.cjs`). EJECUTA la conducta: módulos
puros reales, funciones sacadas de `main.js` y `desafio.js` con un mundo de mentira (`funcion`, `expresion`) y la consola real de trucos; sólo el enganche
de Electron queda por línea. Comprobado que falla con el código de la 4.10.1.
Nada de esto se vio en Electron (la PC estaba ocupada): ver «Para correr después».

## Estado de cada hallazgo

### Zona R
| # | Hallazgo | Estado |
|---|---|---|
| R1 | El aviso «Partida de una versión más nueva» se perdía (temporizador de 6 s con el HUD de la portada oculto) | **Arreglado.** Sale por `avisosAlEntrar` (al volver al juego, como «El juego se recuperó»). Hasta que se muestra, `guardar()` no pisa `versionJuego` (`versionAlGuardar` en `guardado.js`, `versionPendiente` en `main.js`); una vez mostrado, se guarda la versión de esta copia como siempre. |
| R2 | La campana no avisaba a los aliados entre las 19:30 y ~20:25 (`deNoche()` mira la oscuridad del cielo) | **Arreglado.** La campana usa `alarmaPosible()` = `enVentanaDeNoche(horas)` (desde `HORA_ATAQUE - 1` hasta el amanecer, la misma ventana en que están los vecinos) o duendes a la vista. De día sigue sin cambiar las órdenes (lo de la 4.10.1). `deNoche()` no se tocó (lo usa el fortín). |
| R3 | El perro (`alertaDeLaTarde`) y el pronóstico del tablón (`hayBlanco`) seguían diciendo el lado viejo con una brecha de la cadena | **Arreglado.** Nuevo `brechaProxima()` (la brecha decidida a las 19:30 para la noche que viene). El perro mira hacia la brecha en vez del lado; el tablón la cuenta como «algo que los llama a otra parte». Sin brecha, nada cambia. |
| R4 | Tablero de trofeos inalcanzable pegado a una puerta (radios 3,4 y 3,2 m) | **Arreglado.** La puerta le gana al tablero sólo si está igual o más cerca (`distanciaTrofeos` / `distanciaPuerta` en el contexto de la tabla). Si falta algún dato, gana la puerta como en la 4.10.1. El nido de al lado y dormir en la cabaña siguen ganando. La E y el aviso salen de la misma tabla. |
| R5 | Los estudios del Mandamás pedían 5/15/40 abatidos y la campaña sólo tiene 4 jefes | **Arreglado (contenido).** Umbrales propios `jefe: [1, 2, 4]` (`UMBRALES_PROPIOS`): el primero a la primera caída (noche 5), el tercero con el de la noche 20. Los demás tipos no cambian. Ver «Decisiones» y «Preguntas». |
| R6 | «No se repite el giro» comparaba con el último giro que hubo (`d.giro` ya es null de madrugada) | **Arreglado.** Se anota en qué noche fue el giro (`giroAnteriorNoche`, saneado en la partida) y sólo cuenta si fue la noche anterior. Una partida sin ese dato se comporta como antes. |
| R7 | Guardar y abrir a mitad de noche sumaba dos veces los invasores | **Arreglado.** `empezarOleada` no suma al retomar (`retomada`). Prueba: por línea del código (la función entera no se puede correr en Node). |
| R8 | `materiales N` con casillas listaba materiales en cero o sin cambios | **Arreglado.** El aviso lista sólo los que cambiaron; si ninguno cambió, la lista de siempre. Probado con la consola real. |
| R9 | `humo-trucos` aísla el `blur` y el pointer lock | **No se tocó / no se confirmó.** Necesita Electron; queda como duda para una partida real. |
| R10 | Una visita en curso al cargar se termina si el compadre está de turno | **Pospuesto.** Es el borde que ya anotaba el agente NPC; arreglarlo exige decidir si el vecino queda en dos lugares o la visita se termina; es de diseño y de efecto bajo. |
| R11 | «Pesadilla» sin efecto en la cantidad desde la noche ~7 en Implacable | **Confirmado por lectura (1,4 x 1,3 pasa el tope de 24) y pospuesto: es una pregunta de equilibrio.** Ver «Preguntas». |
| R12 | La cadena «grande» cambia variedad por cantidad | **Pospuesto.** Es anterior a la 4.10.1 y cambia la composición de las noches (equilibrio). |

### Zona S
| # | Hallazgo | Estado |
|---|---|---|
| S1 | Cocinar al fuego: el resultado se perdía si en el 1,2 s se abría la pausa/cuaderno/tarjeta | **Arreglado.** `registrar(id, juntado, aunPausado)`: lo que ya se pagó se acredita aunque `modo` ya no sea `jugando`. Las demás llamadas de `registrar` no cambian (en pausa no anotan nada suelto). Probado con las funciones reales `cocinar` y `registrar`. |
| S2 | Precios de los puestos de la trochita por la estación del cielo | **Arreglado.** `temporada: () => temporadaDelDia(progreso.dia)` (la del calendario, como dice `negocios-fx.js:9`). Ver «Preguntas» por la Casa de Té. |
| S3 | Helada: «Tapar los canteros» cuesta 2 tablas y no hacía nada | **Arreglado.** Efecto nuevo `{ tipo: 'tapar' }` -> `taparHuerta(huerta, dia)` marca los canteros afectables como ya helados esa noche (`ultimaHelada = dia + 1`), que es lo que mira `helarHuerta`. Sólo protege una noche, lo sembrado después no queda tapado, y el calafate y lo ya listo no se marcan. «Dejarlos» no cambia. |
| S4 | «Un regalo de Elsa» inalcanzable (máximo 1 de gratitud, pide 3) | **Arreglado.** La carta del ramal (`s-derrumbe-ramal`, el seguimiento de ayudar en el derrumbe) suma 2 de gratitud a la guarda: 1 + 2 = 3. Nicanor no se tocó (con `llevar` o las dos vías sí llega). |
| S5 | Los calafates casi no se siembran (orden fijo de semillas) | **Pospuesto: pregunta.** Elegir la semilla es una función de interfaz y cambiar la preferencia automática cambia cómo se juega. |
| S6 | `e-nocheagua` cuenta cualquier pez | **Arreglado (la mitad).** Sólo cuentan las truchas (`TRUCHAS` de `ahumadero.js`). La ventana 19-22 no se tocó: el texto del encargo dice «después de las siete» y un tope a las 22 sigue sin decirlo (ver «Preguntas»). |
| S7 | «Truchas en la puerta» daba yerba y ramitas | **Arreglado (texto).** Título y texto dicen lo que de verdad llega («Un paquete en la puerta»: yerba y ramitas). El premio no cambia. |
| S8 | Los premios no anotaban el cuaderno | **Arreglado (cobrarPremio).** Mosca, farol, manta y hacha que llegan de regalo/evento/encargo quedan anotados en «Del almacén», en silencio (sin nota nueva). El hacha del herrero (`aldea-gente.js`, efecto `cosa` con `fijar`) no pasa por `cobrarPremio` y no se tocó. |
| S9 | Préstamo vencido sin tope | **Arreglado.** `BANCO.topeDeuda = 2`: el interés compuesto del atraso deja de crecer cuando la deuda llega al doble de lo pedido; una deuda que ya lo pasó no crece ni se achica. Los primeros días no cambian. |

## Pruebas existentes ajustadas (lo mínimo)
- `verificar-2-9-tren.mjs`: fijaba el texto `temporada: () => estacionDe({ invierno… })` ("los precios con la estación que se ve") para el puesto de cargas; ahora fija el calendario (S2). El otro `temporada` (la demanda del pueblo en `crearAldeaGente`) no se tocó.
- `verificar-4-10-1-desafio.mjs`: la campana se evaluaba con `deNoche`; ahora con `alarmaPosible` (R2). Mismas dos comprobaciones.
- `verificar-3-1-historia.mjs`: la lista de tipos de efecto de los eventos suma `tapar` (y sigue exigiendo que algún evento lo use).

## Decisiones tomadas sin consultar (siempre la más conservadora)
1. R1: se evaluó pushear a `avisosAlEntrar` y conservar `versionJuego` sólo mientras el aviso no se mostró (en vez de no tocar nunca la versión o de guardar siempre la más nueva).
2. R3: el perro mira a la brecha (el lado real) en vez de callarse; el tablón sólo suma la brecha como «blanco» (no cambió el texto).
3. R4: "gana la más cercana" y no "gana siempre el tablero" ni subir/bajar radios (no se tocó ningún radio).
4. R5: umbrales 1/2/4 sólo para el jefe (no un multiplicador general). Alcanzables en la campaña; en la corrida sin fin se llegan antes.
5. R6: campo nuevo en la partida (`giroAnteriorNoche`) con un saneado; sin él, comportamiento viejo (no rompe partidas ni pruebas anteriores).
6. S2: sólo el puesto de cargas, que es lo que pedía el informe.
7. S3: protege una noche (la de la helada de ese día), no un invernadero permanente.
8. S4: se sumó gratitud en la carta del ramal en vez de subir el +1 del derrumbe (para que el regalo siga siendo de 2 pasos).
9. S6: sólo truchas; sin cambiar la ventana horaria.
10. S8: anotación en silencio (sin nota/sonido) y sólo para entradas de la sección «Del almacén».
11. S9: tope en el doble del monto pedido (el informe sugería «el doble»).

## Preguntas para vos
- R5: ¿1/2/4 caídas del Mandamás para sus tres estudios te parece bien, o preferís bajar el premio del tercer estudio (el +5 % de daño) o hacerlos 1/2/3?
- R11: en Implacable, la «Pesadilla» pierde su 1,3 x de cantidad desde la noche ~7 porque la oleada topa en 24. ¿Subir el tope sólo para pesadilla, o está bien (la pesadilla igual trae daño, vida, niebla y sin cofre)?
- S5: ¿querés elegir la semilla del cantero (Tab o rueda)? Es interfaz y la hace el otro agente si querés.
- S2: la demanda del pueblo en la Casa de Té (`crearAldeaGente`, `temporada: () => estacionDe(...)`) sigue por el cielo: ¿también por el calendario?
- S6: ¿extender la ventana de la «picada de la tarde» (hoy 19 a 22) o aclararla en el texto del encargo?
- R12 y R10: dejados sin tocar; ¿los querés en una 4.10.3?

## Pruebas sueltas que corrí (una a la vez, solo Node)
Con el código final:
- `verificar-4-10-2-regresiones.mjs`: 120 comprobaciones, verde (y falla con el código de la 4.10.1).
- Las ajustadas: `verificar-2-9-tren`, `verificar-4-10-1-desafio`, `verificar-3-1-historia`: verde.
- Las que tocan lo cambiado: `verificar-4-10-1-version`, `-4-10-1-mundo` (206), `-4-10-1-npc`, `verificar-4-8-ataques`, `-4-8-noches`, `-4-10-guardian`, `-4-10-base`, `-4-10-partidas`, `-4-9-dias`, `-4-6-1-interacciones`, `verificar-trucos` (597), `-4-6-recursos` (374), `verificar-3-8-8-banco` (118), `-3-8-8-negocios` (603), `-3-8-8-economia`, `verificar-huerta`, `verificar-relax`, `verificar-guardado-rc2` y unas 60 más que nombran eventos del valle, préstamos, trofeos, interacciones, giros, brechas, `registrar`, `cobrarPremio`, pesca o temporada: todas verdes.
- `herramientas/revisar-escritura.cjs`: sin avisos. `node armar.mjs`: arma bien.
- NO corrí `npm run verify` ni `verify:paralelo`, ni humo-*, ni nada de Electron.

## Para correr después (PC libre)
1. `npm run verify` completo (tiene un paso más: la prueba nueva).
2. Electron, a mano o con humo:
   - R1: guardar una partida con `versionJuego: "4.99.0"` en localStorage, abrir, quedarse >10 s en la portada, «Seguir»: la nota sale al entrar, y recién después de verla se guarda con la versión de esta copia.
   - R2/R3: Desafío, noche 3+, campana hecha, nivel de Anselmo >= 1: tocarla a las 20:00 (los vecinos mueven órdenes); con un muro al 30 % a las 19:50 el perro mira al muro y el tablón dice «a otra parte».
   - R4: un tablero de trofeos pegado a la puerta de la cabaña: desde cada lado se puede usar el tablero o la puerta según cuál esté más cerca; el aviso coincide con la E.
   - S1: fogón con 4 frutillas + receta del frasco: E, y a los 0,5 s Esc: al volver está el frasco.
   - S2: Ajustes > Estación fija en invierno; los precios del puesto de cargas siguen la fecha.
   - S3: invierno, cantero sembrado, evento «helada», aceptar «Tapar»: pasada la medianoche el cantero no se atrasa.

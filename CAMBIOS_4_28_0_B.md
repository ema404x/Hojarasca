# 4.28.0 (B) — Nivel Ultra: el bosque y el pasto

Todo lo de esta zona vive detrás de `esUltra(ajustes)` **y** de la calidad que corre (`calidadActiva === 'alta'`: con Alta elegida y Media corriendo hasta reiniciar, no se prende). Con Ultra apagado no se toca ningún material, no se arma ninguna malla, textura ni programa: Alta, Media y Baja son la 4.27.0. Se prende y se apaga **en vivo** (sin reiniciar): al apagarlo (o al bajar la calidad, también la autocalidad) cada material vuelve a su `onBeforeCompile` y su clave de programa de siempre y se sueltan los búferes y texturas de Ultra.

## Qué hay
Archivo nuevo `src/ultra-bosque.js` (los parches, el pisado, las motas y el conjunto que se revisa en cada cuadro); `materiales.js` sólo **anota** (referencias débiles) las plantas con viento o copa y el suelo; `pasto.js` suma `ponerUltra` (la malla densa); `main.js`, tres líneas (import, `crearUltraBosque()`, la revisión junto a `pasto.actualizar`) y `__ultraBosque` en depuración.

Mecanismo: `parcharUltra(m, parche)` envuelve el `onBeforeCompile` (lo de Ultra corre después de lo de siempre) y le da una clave de programa propia = la clave de Alta (calculada antes de envolver) + `ultra-b-4.28.0`; `quitarUltra` devuelve todo como estaba. Si un anclaje del código de siempre no está, avisa por consola y esa parte queda como en Alta (la prueba exige que estén todos).

1. **Viento**: una ola de ráfaga (frente que avanza a ~10 m/s en la dirección del viento, cortada a lo ancho) barre el pasto y las copas a la vez; más fuerte con lluvia (`uLluvia`) y con el viento del temporal (`uViento` de siempre). La hoja de pasto que dobla la ola se aclara (muestra el lomo): se ven las ráfagas cruzar el prado. Las copas se doblan con la ola y las hojas se agitan más. **Los troncos quedan quietos**: la madera a menos de ~0,4 m del eje del árbol no se dobla; las ramas de afuera, de a poco.
2. **Pasto**: el doble de matas a menos de ~20 m (una malla más, hija del pasto, con el **mismo material**: ningún programa más; 18.802 matas en Alta, las mismas que el pasto de siempre tiene en ese cuadrado; se funde de 12 a 20 m). **El pisado**: una textura de 64 × 64 (0,375 m por texel) que sigue al jugador; donde pisa, el pasto se aplasta (baja y se abre hacia su lado) y se recupera solo en ~18 s; no marca nadando ni a caballo.
3. **Suelo**: el **grano de menos de 4 m** cerca de la cámara (hasta ~28 m): tres escalas de ruido (40, 16 y 7 cm) que se apagan con la distancia y con el tamaño del píxel, con **relieve por píxel** (la normal sigue la pendiente del grano: derivadas de pantalla), cavidades más oscuras, piedritas en la tierra, el camino y las laderas, y hojitas en el piso del bosque. Sobre la nieve queda casi liso. **El borde de `marcarPisos`**: el corte del pasto (y de flores y helechos) se quiebra con ruido **sólo hacia afuera** del 0,4 de siempre (nunca sale pasto dentro de un piso, tampoco en las obras chicas), el pasto se achica antes de llegar y el suelo del borde queda pisoteado: se acabó el polígono recto.
4. **Follaje**: la luz que atraviesa las hojas en un cono más ancho que el de Alta (a contraluz se enciende la copa entera, no sólo lo que tapa el sol), más en el borde de la copa y con algo de luz que pasa a la cara de la sombra.

### Agregado del usuario («que se sienta en los detalles»)
5. **Polvo y polen en los rayos del bosque**: 520 motas que flotan en una caja de 22 m alrededor de la cámara y **brillan sólo donde les da el sol**: las mismas manchas de sol que el suelo del bosque (`materialTerreno`, luz moteada) proyectadas hacia el sol; más a contraluz. Algunas doradas (polen). No con lluvia ni de noche.
6. **Hojas que caen** (afuera al cerrar: ver abajo): 300 hojas que caen de ~13 m dando vueltas y derivando con el viento, sólo bajo el bosque; más en otoño y con viento, ninguna en invierno. El polvo (y las hojas) son **un solo dibujo de puntos** (un programa, sólo de Ultra), colgado de la malla del pasto.
7. **Tallos y florcitas de cerca** (hasta ~12 m): en algunas matas la hoja del medio es un tallo fino más alto con espiga dorada (4,5 %) o con una florcita en la punta, blanca, amarilla o lila (4 %; no en la estepa ni en invierno).
8. **Gotas que brillan** en el pasto y en las hojas de cerca: después de la lluvia (`uMojado`) y con el **rocío de la mañana** (de 5 a 10, más al alba); nada con nieve. Brillan con el sol que rebota y algo de cielo.

## Criterios
1. **Ultra apagado = 4.27.0**: en la partida real, 103 programas al empezar en la base (4.27.0 + base de Ultra) y en esta rama, y los mismos por toma (104/105). Capturas base contra rama (Ultra apagado) en las mismas seis puestas: dentro del ruido de dos corridas de la base entre sí (lo que cambia es el pasto que se mueve y las nubes: plaza de día 5,3 % contra 4,4 % de ruido; bosque denso 6,2/4,5 contra 2,2; prado de día 20,6 contra 24,6; plaza al ocaso 4,2 contra 52,7). Revisadas a ojo las del suelo del prado: idénticas salvo las hojas que se mueven. En Node: el texto de los programas, sus uniformes y sus claves, iguales antes, sin Ultra y después de prenderlo y apagarlo.
2. **Rendimiento** (notebook Ryzen 7 7730U, la máquina de desarrollo; ventana visible a 60 cuadros, el bucle real del juego, cronómetro de la placa, 3 rondas con Ultra / Alta / Ultra en cada una; ver abajo «medición»): **bosque denso 25,1 ms** (Alta 22,7) y **plaza de día 26,9 ms** (Alta 24,1), con todo lo de esta zona prendido: entra en 33 ms.
3. **Se ve**: capturas Ultra contra Alta (de día, al ocaso, de noche, con nieve y con lluvia) en `C:\Users\Andres\AppData\Local\Temp\hx\b4280\` (`u3`/`a2` verano, `u5i`/`a3i` invierno, `u3l`/`a3l` lluvia, `u3`/`a3` rocío y tallos). Se ve mejor: el prado más tupido y con florcitas, las copas encendidas a contraluz al ocaso, el polvo dorado en los rayos del bosque, el rocío de la mañana, el suelo del bosque con hojarasca y el borde de la casa sin el polígono. De noche casi no cambia (el pasto y las copas apenas).
4. Prueba `pruebas/verificar-4-28-0-b.mjs` (en `verify:pasos`): **170 comprobaciones**, 21 mutaciones (un proceso por copia de `ultra-bosque.js` o `pasto.js`), todas fallan.

## Medición
| encuadre | Ultra | Alta | Ultra otra vez | cuadros |
|---|---|---|---|---|
| bosque denso de día, corrida de diagnóstico | 24,9 (p95 25,5) | 22,6 (25,2) | 25,2 (25,8) | 252 · 289 · 261 |
| bosque denso de día, ronda 1 | 25,1 (25,7) | 22,7 (23,7) | 25,2 (26,6) | 251 · 289 · 261 |
| plaza de día, ronda 1 | 26,9 (28,2) | 24,1 (24,9) | 26,9 (29,0) | 218 · 237 · 216 |

Placa en ms por cuadro (p50 y p95), el cuadro entero (sombras, escena y postproceso); la CPU no cambia (6,7 ms en el bosque; 9,5 a 13,9 en la plaza, con la gente). **Ultra cuesta ~2,5 ms de placa** en los dos lugares. Llamadas de dibujo: +2 a +4 (la malla densa y las motas). Ningún programa nuevo jugando (0 compilaciones en los cuadros medidos). Las rondas 2 a 5 salieron con la ventana estrangulada (6 a 7 cuadros en 7 s, la placa con el reloj bajo: Alta también daba 120 a 1000 ms) y no se cuentan: **sólo dos rondas limpias, no tres**.

La primera tanda con la herramienta de la auditoría (`-Medir 1`) salió con la ventana estrangulada a 1 cuadro por segundo (intervalo 1016 ms, también con `HOJ_SIN_FRENO`): esos números (hasta 900 ms de placa con el lastre) no sirven y se descartaron; se midió con el bucle real de la partida a 60 cuadros. **Falta medir con lo de A y C juntos** (cada zona midió la suya): sumando lo de las tres zonas se puede pasar de 33 ms.

## Qué quedó afuera / decisiones
- La ola del viento es por cuenta en los vértices: **las sombras de los árboles no se mueven** con ella (como en Alta: el mapa de sombras usa el material de profundidad de siempre). Agregarlo es un programa de sombras más por material; no se hizo.
- La «transparencia de luz» del follaje es la del estilo (sin dispersión dentro de la copa ni sombra propia de la luz que pasa).
- **Afuera: las hojas que caen.** Están programadas (`MOTAS_HOJAS`, en el mismo dibujo que el polvo) pero no se llegaron a ver en ninguna captura (no se capturó el otoño ni en movimiento): quedan en 0 al cerrar. Con 300 vuelven.
- Las florcitas son la punta de una hoja con cabeza (un rombo chico de color), no una flor con pétalos: de cerca, a menos de 2 m, se nota.
- Al apagar Ultra se recompilan los programas de Alta de las plantas y del suelo (un tirón de un momento); lo mismo al prenderlo. Es el cambio de un ajuste, no pasa jugando.
- En el primer pase el grano del suelo con relieve ponía la nieve azul con el sol bajo: ahora sobre la nieve queda casi liso. Una captura de la nieve en el bosque denso salió azul entera en tres corridas con la ventana estrangulada y no en las demás (con y sin el relieve): ver «no visto».

## No visto a ojo
- Las ráfagas, el pisado y las hojas que caen **en movimiento** (las capturas son quietas: se ven las ráfagas como bandas claras y el pasto aplastado bajo los pies).
- El otoño (las hojas que caen son más en otoño: no se capturó).
- La nieve del bosque denso salió azul en tres corridas estranguladas (u3i, u4i y una de diagnóstico sin el relieve) y blanca en las demás: no se encontró la causa en el código de Ultra (sin huellas, sin el pisado, sin el relieve, el mismo color con y sin el pasto y las motas medido en la partida); la sospecha es el mapa de sombras sin rehacer con los cuadros lentos. **Queda abierto**: en una de cada dos o tres corridas de invierno con Ultra, un encuadre del bosque denso sale con la nieve azul (en sombra); no se vio con Ultra apagado (una sola corrida de Alta en invierno) y no se llegó a confirmar la causa.
- Media y Baja con Ultra prendido no se probaron en partida (la prueba de Node cubre que no se prende).

## Claves de guardado
Ninguna nueva (el ajuste `ultra` es de la base).

## Pruebas
- Nueva: `pruebas/verificar-4-28-0-b.mjs` (170, 21 mutaciones), en verde.
- Ajustadas a propósito (sólo para no contar los `ultra*.js`, cuyos programas existen sólo con Ultra): `verificar-4-21-0-c.mjs`, `verificar-4-22-0-c.mjs`, `verificar-4-24-0-c.mjs` y `verificar-4-24-1-c.mjs` contaban 18 `ShaderMaterial` (y en las dos de la 4.24, 17 texturas de datos) en todo `src/`; las motas y el pisado suman uno y una en `ultra-bosque.js`.
- Previas: las 290 `verificar-*.mjs` que leen `main.js`, `materiales.js` o `pasto.js`, en verde (`verificar-4-18-0-optativas-a.mjs` falló una vez en paralelo por una carpeta temporal y pasó sola). No se corrió `npm run verify` completo.

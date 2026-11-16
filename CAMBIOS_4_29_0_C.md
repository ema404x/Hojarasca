# 4.29.0 (C): Ultra en personajes, cine y lo que no entró en la 4.28.0

Todo detrás de `esUltra(ajustes)`; con Ultra apagado, Alta/Media/Baja = 4.28.0.

## Qué hay y dónde mirarlo (capturas Alta/Ultra en `hx\c4290\`)
1. **Pelo y ropa con viento** (`gente-viento-*`, plaza de la aldea, 11:00): cada persona trae `aVientoU` (pollera, poncho con flecos, bufanda, faldón de la campera, pelo largo; más movimiento cuanto más abajo). El vértice se mueve después de la piel con la misma ola de ráfaga del pasto y las copas (hasta 38 cm, más con lluvia). Tres tomas seguidas (calma / media / cresta): las polleras y el chamal vuelan y se ven las piernas; en Alta, rígidas.
2. **Ropa mojada** (`gente-mojada-ultra` contra `gente-seca-ultra`, lluvia): la persona se moja a cielo abierto (20 s), no adentro, y se seca en 2 min; tela 50 % y pelo 55 % más oscuros, con brillo. Va por el hueso 23 libre de su tramo en la textura de huesos (sin uniformes por persona). La manga de la mano en primera persona se moja con lluvia a cielo abierto y al nadar (3 s). Los vecinos no nadan: no se mojan «al salir del agua».
3. **Cine** (`cine-*`, `cine2-*`): profundidad de campo sólo con Ultra y sólo en cinemáticas (`ultra-cine.js` puro, `ultra-cine-mundo.js` la pasada). Enfoca el punto al que mira la cámara dirigida (el que habla); círculo de lente real (un general a 11 m casi no desenfoca, un primer plano deja el fondo blando); entra y sale en ~1 s; se compila al prender Ultra.
4. **Hojas que caen** (`hojas-*-1..3`, bosque en otoño, 11:30): 450 hojas más grandes (26 cm) y más redondas; más en otoño y con viento, ninguna en invierno.
5. **Vidrios que reflejan el cielo** (`vidrios-*`): la causa de que salieran iguales era que `vidrioUltra` nunca se llamaba (sólo estaba definida). Ahora se engancha en la aldea y en todos los vidrios del valle; de día se ve el cuarto oscuro, arriba el cielo, abajo el paisaje y una franja de brillo; de noche, la luz de adentro.
6. **Vapor de ollas y pavas** (`vapor-*-1..3`, cocina a leña con chocolate): bocanadas chicas más grandes, blancas y en hebras; la olla echa más y más alto; la pava echa vapor por el pico (sólo Ultra).

## Medido (notebook, ventana visible, 3 rondas, bucle real; la PC estaba más caliente que en la 4.28.0)
| Toma | Ultra 4.28.0 | Ultra con C |
|---|---|---|
| plaza de día | 34,8 ms | 34,7 ms (−0,1) |
| bosque denso | 23,0 ms | 23,9 ms (+0,8: las hojas) |
El cine no tiene tope (corre sólo en escenas). Una serie anterior con la PC compartida dio ruido de hasta 5 ms entre rondas; la de arriba es la limpia.

## Ultra apagado = 4.28.0
Mismos programas en las tres tomas (plaza 105, bosque 104, gente 105; hash de claves idéntico) y capturas con diferencia de ruido (2–6 %, igual que dos corridas de la base entre sí con el reloj fijo).

## Pruebas
`pruebas/verificar-4-29-0-c.mjs` (en `verify:pasos`): 88 comprobaciones (incluye personas armadas en una VM) y 39 mutaciones, todas atrapadas. Ajustes a pruebas viejas, a propósito: `verificar-4-28-0-c` (vidrios y vapor ahora llevan Ultra; la mutación de la gente con el enganche nuevo) y `verificar-4-28-0-a` (6 programas compilados al prender Ultra: suma el del cine). Corridas en verde las que leen lo tocado (gente, escenas, cocina, estructuras, tren, 4.28.0 a/b/c).

## Quedó afuera
Mojado «al salir del agua» de los vecinos (no nadan). Capturas por herramienta nueva: `herramientas/capturas-4-29-0-c.cjs` y `-escenarios.cjs`.

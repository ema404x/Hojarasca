# 4.26.4 (C): el puesto de troncos entra a la regla de interiores

## Qué cambió
- **El pasto del piso del puesto** (`src/main.js`, `canterosParaPisos`): lo que asomaba por el piso no era el terreno ni una rendija de la malla, era pasto. El mapa de pisos sin pasto (`marcarPisos`) es de 2 m por celda con filtro lineal; junto a las paredes (y sobre todo en las cuatro esquinas, donde el filtro se multiplica en las dos direcciones) la marca quedaba por debajo del umbral del pasto (0,4) y las matas salían entre las tablas. Ahora el puesto, desde que tiene piso (etapa 2), suma a su marca un rectángulo 20 cm más ancho por lado y un círculo de 0,7 m en cada esquina. Sólo la marca: no se pisa ni se dibuja.
- **Sin tocar la malla**: el piso sigue a 0,58 m, el escalón a 0,36 m y las tablas igual (probé subir el piso 6 y 10 cm: no hacía falta, y el pasto seguía asomando). Ninguna llamada de dibujo ni shader nuevo, sin claves de guardado.
- **`puesto` entra a `CASAS_CERRADAS`** (`src/interior-visible.js`): desde adentro ya no se dibuja el exterior.

## Qué se midió (equivalencia de imagen de `hx\c4260\equiv.js`, Alta, verano, 72 muestras del puesto)
- Antes (puesto en la regla, sin la marca): 6 de 72 sobre el ruido, hasta 0,3 %; se ve el pasto y un triángulo verde contra la pared.
- Con la marca sólo ensanchada 40 cm por lado: 0, 0, 0 (y una a la tercera, una mariposa). Con 20 cm por lado: 1, 1, 0 (siempre la misma esquina). Con 20 cm y los círculos de las esquinas (lo entregado): **0, 0 y 2 muestras de 0,04 a 0,07 %, que son bichos volando (mariposas) en el cuadro, no pasto ni hueco**.

## Qué se vio (partida real, Alta)
- Entrar y salir caminando (27 pasos de 25 cm cada vez, a las 14 h y a las 23 h, `hx\c4264-paseo.js`): la regla apaga el exterior en los 9 pasos de adentro mirando hacia el fondo (de z = −0,74 a 1,2 m del centro) y nunca afuera ni mirando la puerta al salir; la altura de los ojos recorre 12,92 a 13,46 con un salto máximo de 0,21 m por paso (igual que antes: ningún escalón nuevo que trabe). Capturas del interior de día y de noche en `hx\c4264\paseo-nuevo2\fotos`.
- Antes (4.26.3, la misma ruta): 0 pasos con la regla, mismos saltos.

## Qué cambia de afuera (decirlo)
- El mapa de pisos es de 2 m y la marca nueva es un poco más grande: en la ruta de prueba el pasto del frente (a 1 m de la pared) pasó de denso a ralo, un parche de ~2 m de ancho, porque una celda más cayó dentro de la marca. Depende de cómo caiga el puesto contra la grilla; el resto del puesto (troncos, techo, pilotes) se ve igual. Es lo mismo que ya pasa alrededor de cualquier casa; no se pudo cerrar el pasto de adentro sin mover algo del de afuera.

## Qué no se vio
- Otros sitios del puesto (otra grilla, otra ladera): la equivalencia es de un solo puesto; el cálculo con la grilla real (24 posiciones y giros, en la prueba) da 0,52 como peor valor interior.
- La diferencia de afuera contra una referencia congelada (el pasto se mueve entre cuadros).

## Pruebas
`pruebas/verificar-4-26-4-c.mjs` (en `verify:pasos`): 14 comprobaciones y 11 mutaciones atrapadas, con la marca real de `marcarPisos` contra la grilla de 2 m. Ajustadas a propósito (el puesto entra): `verificar-4-26-0-c`, `-4-26-1-a`, `-4-26-3-a`. En verde: `-3-5-distancia`, `-3-5-vegetacion`, `-3-6-mundo`, `-4-26-0-b`, `-4-26-1-b`, `-4-26-1-c`, `-4-26-2-a`.

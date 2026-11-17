# 4.29.2 (A) — Ultra: el suelo de cerca, el borde de los pisos y la cascada

Todo detrás de `esUltra` con la calidad que corre en Alta. Con Ultra apagado Alta/Media/Baja son la 4.29.1: lo del suelo entra sólo en los
programas de Ultra del suelo y del pasto (clave propia de Ultra, `ultra-b-4.28.0`), y la cascada de Ultra arma sus dos programas
(`cascada-ultra-4.29.2-cortina` y `-espuma`) al prenderlo y los suelta al apagarlo. Sin claves de guardado nuevas.

## Qué y dónde mirarlo
1. **El grano del suelo de cerca** (`src/ultra-suelo.js`, entra por `parcheTerreno` de `ultra-bosque.js`): a menos de ~3 m (se apaga hasta
   los 5, y según el tamaño del píxel: no titila) el suelo deja de ser una mancha lisa. Césped y pasto: granulado de puntas claras y huecos
   oscuros, y alguna paja (un primer intento con hebras cruzadas se leía como tejido: descartado). Tierra, camino y estepa: granza de 1 a
   3 cm y arenilla. Piso del bosque: ramitas. Suma al relieve del grano de la 4.28.0. Las «piedras» de la 4.28.0, que de cerca eran
   manchones grises lisos (gusanos con relieve en el camino del refugio), se rompen en grava. Procedural, sin texturas: no hay mosaico.
   Mirarlo: el camino del refugio, el césped de la plaza, la tierra junto a las casas del este de la aldea, el piso del bosque.
2. **El borde de los pisos** (mismo archivo, por `parchePasto` y `parcheAnillo`): `marcarPisos` tiene téxeles de 2 m y el pasto se cortaba
   en líneas rectas. Con Ultra el pasto, las flores y los helechos leen los pisos corridos por un desvío (senos torcidos y ruido, hasta
   ~1,4 m) a menos de 25 m y sólo cerca de un piso: el corte queda en una franja irregular. El pasto nunca entra en un piso (el corte sólo
   se corre hacia afuera). Mirarlo: el pasto junto al fogón y las casas del jugador (antes una diagonal recta, ahora un borde quebrado).
3. **La cascada** (`src/ultra-cascada.js`; `main.js` la mueve después de `cascada.actualizar`; `agua.js` sólo expone `partes`): la cortina
   es agua que cae (hilos que aceleran según el tiempo de vuelo, espuma en grumos que bajan, agua oscura entre hilo e hilo, chispas del sol
   con la receta del río rápido de Ultra); la poza con espuma que se abre en remolinos y burbujas, más ancha; neblina que sube hasta ~7 m y
   se va río abajo, y rocío de gotas redondas (las dos con el material de la bruma de siempre: ningún programa más; las gotas cuadradas de
   Alta se esconden). Mirarlo: desde la poza mirando el salto.

Capturas, Alta a la izquierda y Ultra a la derecha: `C:\Users\Andres\AppData\Local\Temp\hx\a4292\final2\par-*.png` (el borde de cerca:
`par-b4z-borde.png`).

## Milisegundos (placa, bucle real, 3 rondas Alta/Ultra alternadas, ventana visible, lienzo de 1080p; mediana)
| | 4.29.1 (misma herramienta, PC fresca) | 4.29.2 A (al final, PC caliente) |
|---|---|---|
| Plaza de día | Alta 26,6 · Ultra 35,0 (Ultra/Alta 1,32) | Alta 29,9 · Ultra 39,4 (1,32) |
| Bosque denso | Alta 24,2 · Ultra 31,8 (1,31) | Alta 27,4 · Ultra 35,9 (1,31) |
| Cascada (k1) | Alta 20,2 · Ultra 26,7 (+6,5) | Alta 21,1 · Ultra 29,4 (+8,3) |

La PC se fue calentando con las corridas (Alta en la plaza de 26,6 a 29,9 sin cambiar nada de Alta): la comparación justa es Ultra contra
Alta en la misma corrida. En la plaza y el bosque la razón quedó igual a la de la 4.29.1 (lo de esta zona, dentro del ruido). La cascada
suma ~1,5 a 2 ms donde se ve y queda en 29,4, bajo 33. Medidas intermedias (con el desvío en el color del suelo y el grano hasta 7 m) daban
+1,5 a 2,5 ms en la plaza: una corrida sin los agregados del suelo lo confirmó (35,8 con Alta 28,9) y se recortó (ver «Afuera»).

## Afuera
- **El desvío en el color del suelo** (el borde de la máscara corrido y deshilachado con flecos finos también en el suelo, no sólo en el
  pasto): costaba ~2 ms en la plaza (el césped de la aldea no tiene matas que tapen el suelo: se pinta cada píxel). El color del suelo
  queda como en la 4.29.1; el corte irregular lo hace el pasto.
- **El relieve de las piedras del ripio de la aldea**: hecho, sacado primero por el mismo costo; no se llegó a ver claro en las capturas.
- **El borde pisoteado de la 4.28.0 corrido con el desvío**: afuera por lo mismo; queda como estaba.
- El grano de cerca se achicó de 7 a 5 m por el mismo costo.
- La cortina de Alta tiene el mismo error que se arregló en la de Ultra (velocidad × reloj con la velocidad según la altura: con el reloj
  grande los hilos se aplastan en rayas horizontales). Alta no se toca en esta versión; queda anotado.
- La franja clara al pie de las paredes de las casas de la aldea (unos 20 cm, recta) no es del corte de los pisos: está igual en Alta.
- La roca oscura al pie de la cascada (una de la poza, delante de la cortina) sigue ahí.

## No visto a ojo
- La cascada y el grano en movimiento (las capturas son quietas), de noche, con nieve y con lluvia.

## Pruebas
- Nueva: `pruebas/verificar-4-29-2-a.mjs` (en `verify:pasos`): 34 comprobaciones, 12 mutaciones (un proceso por copia), todas atrapadas.
- En verde: `verificar-4-28-0-a`, `-4-28-0-b`, `-4-28-0-c`, `-4-29-0-a`, `-4-29-0-b`, `-4-29-0-c`, `-4-29-1-a`, `-4-21-0-c`, `-4-22-0-c`,
  `-4-24-0-c`, `-4-24-1-c`. `verificar-4-29-0-a` exige que `agua.js` no nombre a Ultra: el comentario de `partes` no lo nombra.

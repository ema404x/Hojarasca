# 4.29.2 (B) — fuego en la aldea, huellas en el ripio y vecinos mojados

Todo detrás de `esUltra` y de la calidad que corre (como `ultra-vida.js`); con Ultra apagado no se arma nada nuevo ni cambia ningún programa.

## Qué hay
1. **Hornos y fraguas de la aldea con fuego** (Ultra): el horno de barro de la panadería y el de la cerámica, la fragua de la herrería y la fragua
   chica del taller del tren arden con las llamas y las chispas del fogón de la 4.29.0 (tres lenguas, ruido que sube; en el horno lenguas bajas
   en la boca y pocas chispas, en la fragua el fuego avivado sobre las brasas con chispas que suben a la campana). La luz de la fragua de la
   herrería titila como un fuego (el ruido de 0,6 a 1,35 y se corre unos cm), no como una vela. Sin programa nuevo (es el de las llamas).
   - `aldea-arquitectura.js`: anota dónde arde cada fuego (`extra.fuegos`, sólo datos; la geometría no cambia).
   - `aldea-mundo.js`: `fuegosUltra(cam, radio)`: los fuegos a menos de 32 m (los de adentro sólo si se ve el interior).
   - `ultra-vida.js`: `aldeaFuegos` / `fuegoAldea`; `main.js` le pasa la aldea (`u.aldea`).
2. **Huellas en el ripio** (Ultra): las huellas finas (tuyas, de la gente cercana, de los animales; se borran solas) en las calles y la plaza de
   ripio: la piedra corrida deja la tierra apisonada más oscura y alrededor la grava amontonada más clara (en la nieve, barro). `ultra-materiales.js`
   (`inyectarRipioUltra`, el programa de Ultra del ripio que ya existía).
3. **Vecinos mojados al salir del agua: no se hace.** Ningún vecino pisa agua: `gente.js` frena el paso antes del agua (4.25.2), nadie nace en el
   agua, la gente del campo no se para en el agua y en 200 m alrededor de la aldea no hay agua (medido con el terreno). Anotado, no se fuerza.

## Dónde mirarlo (`C:\Users\Andres\AppData\Local\Temp\hx\b4292\`, Ultra a la izquierda / Alta a la derecha)
- `par-u1-fragua-noche.jpg`, `par-u2-fragua-dia.jpg`: la fragua de la herrería (en Alta sólo la placa naranja de las brasas).
- `par-u3-horno-pan-noche.jpg`: el horno de la panadería de noche (en Alta, la boca negra).
- `par-u4-horno-ceramica-dia.jpg`, `par-u7-taller-fragua-noche.jpg`: el horno de la cerámica y la fragua del taller del tren.
- `par-u5.jpg` (arriba con pisadas, abajo sin; misma partida en Ultra): la fila de pisadas en el ripio frente a la plaza. `d5-diff.png`: la
  diferencia ×4 contra Alta (las pisadas una por una). Se ve, suave.

## Rendimiento
Bucle real de la partida, ventana visible y sin freno, 3 rondas de 60 cuadros (Alta y Ultra alternados en la misma partida), la rama y la
4.29.1 (`git archive`) medidas una detrás de la otra (`hx4292\m-rama`, `m-base`); ms de placa, en negrita la mediana:
| | Alta rama | Ultra rama | Alta 4.29.1 | Ultra 4.29.1 | lo de B |
|---|---|---|---|---|---|
| Plaza de día (05) | 26,0 · 26,8 · 30,8 | 34,8 · 38,4 · 39,0 → **38,4** | 28,9 · 29,6 · 30,1 | 38,1 · 39,5 · 38,0 → **38,1** | +0,3 (ruido) |
| Bosque denso (b1) | 26,8 · 24,9 · 25,4 | 32,3 · 33,8 · 32,8 → **32,8** | 26,2 · 25,2 · 25,4 | 33,6 · 33,1 · 32,7 → **33,1** | ≈ 0 |
La PC anduvo caliente y ruidosa (Alta en la plaza de 26 a 31): los absolutos no sirven; la diferencia con la base, sí: dentro de 0,5 ms. En el bosque
no hay nada de B (las fraguas están en la aldea); en la plaza, el ripio con las huellas y, si la fragua cae a menos de 32 m, sus llamas.

## Ultra apagado = 4.29.1
Partida real con Ultra apagado, la 4.29.1 y la rama: los mismos programas (103 al empezar, 105 en la toma del ripio) y la captura igual dentro
del ruido (diferencia media 1,6 sobre 255, 3 % de píxeles > 8: el pasto y la gente). Con Ultra apagado lo nuevo son datos (`extra.fuegos`) que nadie lee.

## Qué quedó afuera
- **Huellas en las lajas** (polvo seco, húmedas con lluvia): hechas y probadas dos veces en la plaza (`par4-lajas.jpg`, `par4-lajas-lluvia.jpg`):
  las marcas están en la textura pero en la laja no se veían claro. Sacadas; el material de la aldea queda como en la 4.29.1.
- Los hornos no tienen luz propia (la aldea arma una luz por edificio y nuevas luces cambian los programas): titilan las llamas, no la luz.
- Vecinos mojados (ver arriba).

## Pruebas
- Nueva `pruebas/verificar-4-29-2-b.mjs` (en `verify:pasos`): 34 comprobaciones, 12 mutaciones (un proceso por copia), todas atrapadas.
- En verde: `verificar-4-29-0-b`, `4-28-0-a`, `4-28-0-b`, `4-28-0-c`, `4-29-0-c`, `4-29-1-b`, `3-7-0-arquitectura`. No se corrió `npm run verify`.

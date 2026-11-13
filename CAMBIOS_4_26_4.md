# Hojarasca 4.26.4 — Los cuatro pendientes

Ramas v4264-a (cinemáticas), v4264-b (la vuelta en trochita) y v4264-c (el puesto de troncos), juntadas. Detalle en CAMBIOS_4_26_4_A.md, _B.md y _C.md. 0 shaders nuevos, 0 llamadas de dibujo nuevas.

- Encuentro del galpón: la cámara mira al grupo de duendes desde tu lado; los 12 quedan en cuadro con el galponcito adelante, atrás, al costado y mirando a la pared de la estación.
- Silueta del anochecer: en el monte cerrado del molino ahora aparece entre los árboles (a unos 22 m), parada en el piso; prefiere un lugar con la vista limpia si lo hay.
- La vuelta en trochita: en la Historia, hasta la primera vuelta, tocar la campanita del andén llama al tren si falta más de 25 s (en la partida real llegó en 18 s); el objetivo lo dice. Después, la campana vuelve a ser sólo sonido. Ningún horario cambia; el Desafío tampoco.
- Puesto de troncos: entra a la regla de no dibujar el exterior desde adentro; el pasto que asomaba por el piso se saca con la marca de pisos (sin tocar la malla ni el escalón).
- Verificación: npm run verify de corrido; pruebas nuevas verificar-4-26-4-a (54; 19 mutaciones), -b (55; 18 mutaciones) y -c (14; 11 mutaciones); humos reales de las tres zonas.

## Sin ver / pendiente
- Puesto de troncos: el pasto justo frente a la puerta puede quedar más ralo en un parche de unos 2 m (la marca de pisos es de 2 m por celda).
- La silueta del monte cerrado se vio de día (no de noche cerrada); la campanita de 25 s se vio en la Aldea, no en otras paradas ni de noche.
- Arriba de la trochita el contador de programas pasa de 110 a 111 (sin materiales nuevos en el código: un programa que ya existía y se usa ahí).

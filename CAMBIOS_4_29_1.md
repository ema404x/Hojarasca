# Hojarasca 4.29.1 — Ultra medido y el pueblo

Ramas v4291-a (Ultra medido) y v4291-b (bugs anotados del pueblo), juntadas. Detalle en CAMBIOS_4_29_1_A.md y _B.md. 0 shaders nuevos.

- Ultra, medido con la PC en reposo y recortado: oclusión de 4 a 3 muestras, niebla de 7 a 6 pasos, relieve de materiales apagado entre 12 y 20 m. Plaza de día 34,8 ms (Alta 26,5 ese día), bosque denso 31,4, lago al amanecer 26,0. Se acepta la plaza en 34,8: ese día la PC midió todo ~2,3 ms más lento (Alta 26,5 contra 24,2 del 13-11).
- V con una charla, su menú o cualquier panel abierto ya no tira lo que tenés en la mano.
- La trochita: «E para subir» sólo cuando la E sube; si no, «acercate a una puerta».
- El cartel del banco dice el horario: «Lun a sáb 8:30 a 12:30 y 14:30 a 18» y «Sáb. de baile hasta las 16 · Dom. cerrado».
- Los bajos del alero del andén (Aldea y Estación del Valle) se ven madera oscura, no un hueco negro.
- El suelo de la Aldea que se pisa sigue al que se ve: el peor desvío baja de 42 a 12,8 cm (en Media y Alta, con el parche cada 1 m; Baja y Muy baja quedan como antes).
- Verificación: npm run verify de corrido; pruebas nuevas verificar-4-29-1-a (7 mutaciones) y -b (20 mutaciones); vistas en la partida real.

## Anotado
- La cola de la noche en la estación no se reproduce: son 2 o 3 vecinos que salen juntos de la cantina a las 23:10 (gente de paso).
- Si Ultra se siente pesado en la plaza, lo que queda para recortar es la base de la 4.28.0 (sombras, cielo, composición).

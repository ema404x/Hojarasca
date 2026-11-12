# Hojarasca 4.26.3 — El galpón y la buhardilla

Rama v4263-a. Detalle en CAMBIOS_4_26_3_A.md. 0 shaders, 0 llamadas de dibujo nuevas.

- El encuentro del galpón: con el galponcito construido, los duendes se sentaban adentro, detrás de las tablas, y sólo asomaban los ojos. Ahora se paran adelante tuyo, fuera de la huella del galponcito, en el piso.
- Interiores: la buhardilla entra a la regla de no dibujar el exterior desde adentro (equivalencia de imagen en ruido). La cabaña de tablas y piedra queda como está: las diferencias de la 4.26.1 eran ruido. El puesto de troncos queda afuera: asoma el pasto por el piso bajo.
- Verificación: npm run verify de corrido; prueba nueva verificar-4-26-3-a (26 comprobaciones, 9 mutaciones); humo real del galpón con el galponcito en pie y caminata entrando y saliendo de la buhardilla de día y de noche.

## Sin ver / pendiente
- En el encuentro del galpón, con el galponcito atrás tuyo o mirando a la pared, la cámara sigue tu frente y los duendes pueden quedar fuera de cuadro.
- Puesto de troncos fuera de la regla (habría que subir el piso).

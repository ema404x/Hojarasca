# Hojarasca 2.6.1 — Revisión de todo el juego

Sobre la 2.6.0. Ninguna cosa nueva: bugs y trabajo de más, en todo el juego. Cada cambio
lleva un comentario `2.6.1:` en el código.

## Bugs

**Relax y la tecla E**
- Cambiar el idioma en los ajustes no recargaba: seguía en el idioma anterior.
- Con la feria abierta, E hablaba con Elsa o te bajaba del caballo en vez de cerrarla.
- El aviso de la casa de té, el de dormir (carpa antes que obra) y el aviso durante una
  charla no decían lo mismo que hacía la E.
- En las escaleras sin lugar para la cabeza, el jugador alternaba cada cuadro entre el
  aire y el suelo (sobre el agua, salpicaba o nadaba de mentira).
- Mover una pared mientras se caía el piso de abajo dejaba una pared invisible.
- La lagartija recorría todas las piedras del mapa cada 2,5 s (tirón); el coipo podía
  romper el juego si no encontraba agua honda.
- Con el escudo en la mano, pasar a la caña o al grabador lo dejaba a la vista.
- El mando: si Windows ve otro aparato como mando (un volante, unos auriculares), ahora
  se prefiere el de verdad; una zona muerta rara ya no deja los palitos muertos.

**Desafío**
- Los voladores reciclados volvían persiguiendo la antorcha de su vida anterior.
- Ema le tiraba a los excavadores bajo tierra (erraba siempre y perdía el turno).
- Los fosos rotos quedaban en memoria para siempre.

**Guardado y archivos**
- Si la partida principal estaba rota pero era JSON válido, la copia de respaldo buena
  quedaba tapada y la ranura parecía vacía.
- Nombres raros en un guardado (`constructor`, `__proto__`) en planos, cultivos,
  cartas, encargos y fotos: rompían la carga o daban NaN. Ahora se ignoran.
- Una posición guardada que no es un número dejaba al jugador en ningún lado.
- Las fotos se escriben de a una por vez en un archivo aparte y se renombran: un corte
  de luz ya no deja una foto a medias; lo mismo la carpeta sincronizada.
- Si un archivo desaparecía mientras el juego arrancaba (OneDrive guardando), quedaba
  abierto sin ventana.

## Trabajo por cuadro (lo que se nota en máquinas chicas)

- **Sonido:** cada tono, golpe, voz, frase de música y gota en el techo quedaba
  enganchado para siempre (la lluvia sobre el techo sumaba ~30 por segundo). Ahora se
  suelta cada uno al terminar.
- **Colisiones:** los vecinos de la grilla se guardan y sólo se rehacen al cambiar de
  celda o de obras; quitar una obra ya no recorre toda la grilla.
- **Búsquedas de cerca** (vegetación, perro, fauna): sin armar un texto por celda.
- **Interfaz:** el aviso de E, el estado y los recursos ya no se reescriben cada cuadro
  si no cambiaron.
- **Cielo, clima, invasores, perro, majada, torretas:** sin vectores, colores ni objetos
  nuevos por cuadro; la majada lejos no se calcula.

## Verificación

- `npm run verify` y la suite de partidas reales (Electron), incluida la de caos con dos
  semillas. Ver el LEEME del paquete para los números.

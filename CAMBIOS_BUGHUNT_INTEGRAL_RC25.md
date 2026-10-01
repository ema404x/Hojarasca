# Hojarasca RC25 — Bug Hunt Integral

Pasada de estabilidad centrada en errores de gameplay/runtime encontrados sobre RC24 Hotfix.

## Correcciones
- El guardado conserva `pos.y`: cargar una partida desde un entrepiso/terraza ya no devuelve al jugador a la planta baja.
- Saves anteriores sin `y` siguen siendo compatibles.
- `obras.dentro()` valida altura en refugios prefabricados: techo/sótano ya no cuentan como interior.
- Puertas apiladas eligen la puerta de la planta del jugador.
- Catres, talleres y estufas apilados respetan la planta actual.
- Fuego/fogón propio exige proximidad vertical además de horizontal.
- Cambiar el preset de clima invalida el temporizador anterior y se aplica en el siguiente tick.
- Se mantiene el hotfix de fauna RC24 Runtime (`estadoMundo` del pudú).

## QA
Nueva prueba `verificar-bughunt-integral-rc25.mjs`, más cadena histórica completa y smoke test WebGL/runtime.

# Hojarasca — Ecosistema Atmosférico RC18

## Objetivo

Profundizar la sensación de Patagonia viva sin convertir el juego en una simulación pesada: ritmos diarios por especie, conducta de descanso/forrajeo, rutas de huida con cobertura intermedia, alarma aviar en cadena, rastros de más fauna y una atmósfera local que responda a mallines, riberas y ráfagas.

## Cambios principales

- `src/ecosistema.js` incorpora `actividadFaunaPatagonica()` como reloj ecológico compartido por especie y clima.
- Nuevo `perfilRefugioTerreno()` para separar bosque denso, borde/matorral, ambiente abierto y humedad local.
- `destinoEscapeConCobertura()` puede buscar una cobertura objetivo y premiar bordes seguros, en lugar de favorecer siempre el bosque más denso.
- Huemul: incorpora estado de descanso y actividad crepuscular continua; su huida favorece matorral/borde seguro sin perder validación de agua y pendiente.
- Zorro colorado: su ventana de actividad deja de depender de un booleano fijo de noche y usa el reloj ecológico compartido.
- Guanaco y liebre: la frecuencia de desplazamiento tranquilo cambia con hora/clima; la alarma sigue teniendo prioridad absoluta.
- Zorzales: una alarma local puede propagarse a otros individuos cercanos mediante la red ecológica existente.
- Bandurrias: actividad visible modulada por hora y clima, manteniendo la reacción acústica de RC16/RC17.
- Nieve: se amplían rastros a guanacos y liebres, preservando la API histórica de huellas.
- `src/clima.js`: ráfagas locales con mayor amplitud en estepa/exposición y amortiguación en bosque.
- `src/niebla.js`: bolsillos de bruma baja específicos alrededor del mallín y persistencia local guiada por ribera/humedad.
- El coste sigue acotado: no se añaden pathfinders globales, mallas de niebla dinámicas por frame ni sistemas de partículas independientes por animal.

## QA

Nueva regresión `pruebas/verificar-ecosistema-atmosferico-rc18.mjs` para ritmos diarios, mal tiempo, perfil de refugio, rutas de cobertura, descanso, alarma aviar, rastros ampliados, ráfagas y niebla local.

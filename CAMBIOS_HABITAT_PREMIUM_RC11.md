# Hojarasca — Hábitat Premium RC11

## Objetivo

RC11 convierte la semántica arquitectónica de RC10 en experiencia jugable. Una casa propia ya no sólo se detecta como “habitación”: ahora puede distinguir cubierta, interior acústico, protección climática, mobiliario, confort, descanso, iluminación y una fuente de calor construida.

## Catálogo

El catálogo pasa de 30 a **34 planos** con cuatro piezas de mobiliario funcional:

- **Catre de campaña**: aporta confort y se reconoce como punto de descanso del refugio.
- **Silla de campo**: mobiliario compacto con contribución de confort.
- **Farol interior**: crea una `PointLight` real ligada a la obra y regulada por el ciclo día/noche.
- **Estufa a leña**: fuente de calor construible con fuego contenido; su caño puede atravesar de forma explícita la familia de cubiertas modulares sin desactivar la validación 3D general.

Mesa, estante y banco existentes también participan ahora del cálculo de confort.

## Cubierta vs. interior

Se separan dos conceptos que antes quedaban acoplados:

- `bajoCubierta(pos)`: detecta una cubierta física sobre el módulo aunque el espacio sea abierto.
- `dentro(pos)`: sigue exigiendo una habitación modular cerrada/habitable para tratarla como interior completo.

Así una galería con tres paredes + marco abierto + techo detiene lluvia/nieve, pero no adopta acústica de habitación cerrada.

## Hábitat semántico

La nueva API `estadoHabitat(pos, contexto)` extiende `estadoModulo()` con:

- protección contra precipitación;
- protección frente al viento según cerramientos;
- confort de 0 a 10;
- detección de catre;
- iluminación interior;
- fuente de calor;
- calor activo cuando el fuego correspondiente está encendido;
- índice agregado de calidad del hábitat de 0 a 100.

El cálculo usa únicamente piezas terminadas del mismo nivel/módulo y excluye cualquier pieza que esté siendo movida.

## Clima y audio

- Las habitaciones modulares cerradas cuentan como interior para audio y postproceso.
- Las cubiertas modulares abiertas bloquean precipitación sin forzar reverberación interior.
- El clima admite fuego `contenida`: una estufa no muestra el círculo de piedras/leños de una fogata exterior, reduce la llama/chispa, evita humo exterior y no pierde intensidad por lluvia.

## Luz interior

Los faroles construidos crean una luz dinámica propiedad de la obra. `actualizarAmbiente(noche)` ajusta su intensidad sin duplicar luces al editar, cancelar, cargar o reconstruir una pieza.

## UX

El panel de obra y el HUD comunican:

- confort;
- protección;
- catre;
- fuente/calor activo;
- luz interior;
- estado bajo cubierta.

Los avisos distinguen “Encender la estufa”, “Encender tu fogón” y “Dormir en tu catre”.

## Compatibilidad

Se conserva la conducta de RC10: una habitación cerrada continúa siendo válida para dormir aunque no tenga catre. El catre mejora semántica/UX/confort sin invalidar partidas anteriores.

## QA

Nueva regresión `pruebas/verificar-habitat-premium-rc11.mjs`:

- presencia de los 34 planos;
- habitación vacía con confort estructural base;
- construcción física de catre, silla, farol y estufa;
- confort equipado hasta 10/10;
- fuente de calor apagada/activa;
- protección total en habitación cerrada;
- farol ligado a la obra y ciclo día/noche;
- galería abierta bajo cubierta pero fuera de `dentro()`;
- integración de cubierta con clima;
- combustión contenida de estufa;
- UX específica de catre/estufa.

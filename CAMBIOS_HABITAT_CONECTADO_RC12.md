# Hojarasca RC12 — Hábitat Conectado

RC12 convierte la semántica de habitación de RC10/RC11 en una **red interior multiambiente**. El objetivo no es sumar decoración aislada, sino permitir casas modulares de varios módulos que se comporten como una sola vivienda cuando corresponde y como ambientes separados cuando existe una división real.

## Cambios principales

- Catálogo ampliado a **37 planos**.
- Nuevo **Tabique interior**: cierra clima/acústica pero no es portante y no sostiene entrepisos.
- Nuevo **Tabique con puerta interior**: hoja funcional, colisión dinámica y apertura consultable por dueño.
- Nueva **Alfombra de lana**: pieza de confort de bajo perfil para interiores.
- Los módulos contiguos cubiertos pueden formar una sola vivienda incluso sin pared en el borde compartido.
- `estadoModulo()` distingue cierre físico de **cierre efectivo**. Una unión abierta hacia otro módulo cubierto no se considera una abertura al exterior.
- Nueva red `redInterior()`: recorre ambientes conectados y conserva un factor de transmisión por unión.
- Unión abierta: transmisión completa.
- Marco abierto: transmisión alta.
- Puerta interior cerrada: transmisión térmica reducida y sin propagación lumínica semántica.
- Puerta interior abierta: recuperación de transferencia de calor y luz entre ambientes.
- `estadoHabitat()` informa ambientes conectados, área interior, calor propagado y luz compartida.
- El HUD diferencia **calor activo local**, **calor compartido** y **luz compartida**.

## Correcciones de ingeniería

### Encuentros de cubierta

Los techos modulares tienen aleros reales, por lo que dos cubiertas vecinas se solapan ligeramente en planta. RC11 podía rechazar ese encuentro como colisión. RC12 agrega una regla geométrica explícita que sólo permite el solape cuando:

- ambas piezas pertenecen a la familia `modular-techo`;
- están a la misma cota;
- tienen orientación compatible;
- sus centros corresponden a módulos adyacentes de 3 m.

No se relajó la validación global de solapes.

### Colocación consciente de nivel

RC11 elegía la plataforma más alta disponible al colocar mobiliario. En una casa con cubierta plana transitable eso podía mandar un farol o una estufa a la terraza aunque el jugador estuviera en planta baja.

RC12 pasa la altura real del jugador a `moverFantasma()`, `fundar()` y `confirmarEdicion()`. `baseColocacion()` selecciona ahora la superficie físicamente alcanzable desde ese nivel. Esto permite colocar de forma coherente en planta baja, entrepiso o terraza.

## QA específico

`pruebas/verificar-habitat-conectado-rc12.mjs` valida:

- 37 planos y presencia de las tres piezas nuevas;
- vivienda abierta de dos módulos con cierre efectivo correcto;
- red interior de dos ambientes;
- calor y luz propagados por unión abierta;
- puerta interior cerrada con transferencia térmica amortiguada;
- puerta interior abierta con transferencia completa;
- alfombra aumentando confort local;
- mobiliario permaneciendo en planta baja bajo una terraza transitable;
- mobiliario colocable deliberadamente sobre la terraza mediante referencia de altura;
- contrato `aperturaPorDuenio()` de puertas.

# Hojarasca 4.11.0 — Ajustes del Desafío (primera de cuatro versiones con las decisiones de diseño)

Rama `v4110-integra` (sobre `main` = 4.10.4). Juntada de `v4110-a` (`CAMBIOS_4_11_0_A.md`) y `v4110-b` (`CAMBIOS_4_11_0_B.md`).
Decisiones del usuario: `DECISIONES_DISENO_4_10.md`. Siguen la 4.11.1 (interfaz y sonido), la 4.11.2 (mundo y gente) y la 4.11.3 (proceso y guardado).

## Qué trae (La noche de los duendes)
- **Pesadilla con tope propio:** la oleada, el cupo de duendes vivos y la cadena de noches topaban en 24; en Pesadilla el tope sube a 31 (24 × 1,3), así que conserva su +30 % de duendes toda la partida (en Implacable pasaba a igualar a la dificultad normal desde la noche ~7). El resto de las dificultades y el modo sin fin quedan en 24.
- **Mandamás:** sus estudios del bestiario quedan en 1, 2 y 4 caídas (ya estaba desde la 4.10.2; se corrigieron los comentarios) y el tercero sigue dando +5 % de daño.
- **«Noches más largas» no se combina con «Hora de tu reloj»** (el reloj de la PC no se alarga): queda deshabilitado y también «Manos llenas», que alarga la noche. Una partida guardada con esa combinación carga igual.
- **Motivo de lo bloqueado a la vista:** en «Nueva partida», debajo de cada chip bloqueado se escribe por qué («Sin aliados no hay perro», «Ya elegiste 2 ventajas», «Con la hora de tu reloj no se pueden alargar las noches»…), no sólo al pasar el mouse.
- **«Otra vuelta» se lleva todo:** habilidades del guardián con sus niveles y puntos sin gastar, bestiario entero, trofeos ganados y el modo, las ventajas y las reglas elegidas. Lo de la partida (noche, base, defensas, recursos, aldea, pedidos, órdenes, perro curtido) empieza de cero. Los bonos se rehacen por origen. Los trofeos viajan, pero el tablero es una obra: hay que armar otro para que vuelva el bono.
- **Órdenes a los vecinos:** ya persistían entre noches (se dejó fijado con pruebas, incluido un control que recorre `src/`).
- **Noche silenciosa:** los refuerzos (los del giro y los de la 1:30) ahora son tiradores, igual que el resto de esa noche, y sin curandero ni enjambre.

## Decisiones de la junta
- Se mantuvo el cambio de los refuerzos de la noche silenciosa del agente B (es una lectura suya de la pregunta B11c); si no se quiere, se saca con dos líneas de `desafio.js`.
- Choque de importaciones de `desafio.js` y de la línea `verify:pasos` resueltos a mano.
- `nuevaVuelta` vive en `src/desafio-vuelta-nueva.js` (un ciclo de módulos con `desafio-reglas.js`).

## Verificación
- `npm run verify` de corrido: **298 pasos OK** (296 de la 4.10.4 + la prueba de cada agente).
- Partidas reales sobre la junta (ocultas, de a una, en el monitor externo): `humo-4-11-0-desafio-a`, `humo-4-11-0-vuelta`, `humo-4-10-coihue` (69/69) y `humo-4-9-aliados` (53) en verde; `humo-3-5-1-desafio`, `humo-4-8-noches` y `humo-3-0-asedio` sin ninguna línea fallida.
- Mutaciones a propósito: 22 (agente A) y las de cada regla del B: todas hacen fallar sus pruebas.

## Pendiente
- **Sin medir** los cuadros con 31 duendes más enjambre en la 4600G (pesadilla Implacable noche 10+).
- **Sin jugar:** una Pesadilla de 20 noches y una campaña entera con Otra vuelta.
- `humo-4-10-partidas` y `humo-1-10-desafio`: ya fallaban antes (el primero se ajustó); `humo-4-10-1-guardado` y `humo-4-9-aliados` fallan a veces por tiempo.
- El texto nuevo de «Otra vuelta» y los motivos están sólo en castellano (inglés al final).

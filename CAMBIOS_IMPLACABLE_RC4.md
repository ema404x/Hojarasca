# Hojarasca — Implacable RC4

## Objetivo

RC4 no agrega contenido por cantidad. Cierra una clase completa de defectos que hacía que el mundo pudiera sentirse procedural o inacabado: edificios que desaparecen, complejos que se pisan, piezas físicas sin representación visual, objetos apareciendo dentro de arquitectura y colocadores que solo medían distancia al centro.

## Implantación arquitectónica

- Registro global de huellas ocupadas para las estructuras principales.
- Cada estructura nueva respeta radio real + margen de seguridad de las anteriores.
- Cabañas y Puesto Alto también participan del sistema aunque tengan colocadores propios.
- Faro y cueva respetan huellas incluso en rutas de fallback.
- Retiro ferroviario proporcional al radio del edificio.
- Huellas comprobadas también contra estaciones de La Trochita.

## Correcciones concretas

- Faro: colocación garantizada mediante búsqueda escalonada/fallback compatible con su cimentación adaptativa.
- Almacén/Galpón: eliminado el solapamiento masivo que podía mezclar corrales, cobertizos y comercio.
- Almacén/Galpón: fachadas orientadas hacia el sendero/acceso.
- Casa de Té: el escalón de acceso ahora forma parte de la geometría antes de materializar la malla; ya no existe suelo físico invisible.
- Molino: radio real normalizado para colocación, limpieza y reserva.
- Cueva: radio real normalizado para colocación y reserva.
- Vegetación: despeje basado en la huella real de cada complejo.
- Coleccionables: generación posterior a arquitectura y estaciones; no nacen dentro de zonas ocupadas.
- NPCs: Ercilia integrada al almacén; posiciones/rutas principales auditadas contra obstáculos.

## Auditoría geométrica real

La prueba `verificar-geometria-headless-rc3.mjs`, ampliada en RC4, construye el mundo con el runtime Three.js real y comprueba:

- matrices y bounding boxes finitos;
- presencia de todas las estructuras dinámicas críticas;
- huellas entre edificios y estaciones;
- soportes/implantación del faro;
- orientación de almacén y galpón;
- posiciones y rutas de NPCs;
- coleccionables frente a edificios/estaciones;
- componentes grandes desconectados/flotantes mediante voxelización;
- correspondencia de cada plataforma física con una superficie visual mediante Raycaster.

Resultado actual de referencia:

- 99 mallas
- 825 obstáculos
- 173 plataformas
- 0 componentes grandes flotantes detectados
- 0 plataformas sin superficie visual detectadas

## Protección de regresiones

Se incorpora `pruebas/verificar-implacable-rc4.mjs` y el release check exige su presencia. La cadena completa de `npm run verify` debe quedar verde antes de una entrega.

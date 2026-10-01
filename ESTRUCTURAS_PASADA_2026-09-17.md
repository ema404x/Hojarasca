# Hojarasca — pasada estructural

## Objetivo
Reforzar las estructuras para que la lógica constructiva, la geometría visible y la colisión sean coherentes, con detalles que expliquen cómo se sostienen los edificios.

## Cambios
- Marco estructural reutilizable: soleras, vigas de coronación, riostras y pares de cubierta.
- Aplicado al refugio, cabañas, casa de té, almacén y galpón.
- Corregido un hueco invisible excesivo en la pared frontal del refugio.
- Corregida la abertura de entrada del almacén para que coincida con la puerta de 1,1 m.
- Añadida colisión a las barandas superiores de la torre de guardaparques.
- Verificada sintaxis de los módulos estructurales y de colisiones.

## Verificación
Se ejecutó `node --check` sobre los módulos JS modificados y relacionados. No se pudo regenerar `index.html` en este entorno porque el proyecto no trae `node_modules` y la instalación de dependencias no terminó dentro del tiempo disponible. Por eso el bundle existente se conserva intacto y los cambios están en `src/`.

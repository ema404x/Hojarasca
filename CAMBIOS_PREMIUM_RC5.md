# Hojarasca — Premium RC5 · Terminación fina

RC5 responde a defectos visibles encontrados al recorrer la build RC4. La prioridad no fue añadir contenido, sino eliminar contradicciones de montaje que hacían que una estructura pareciera inacabada aun cuando sus sistemas generales funcionaran.

## Accesos del refugio y cabañas

- Se elimina el travesaño del refugio que estaba colocado a 1,05 m dentro del hueco de entrada.
- Los marcos pasan a estar formados por jambas laterales y un dintel superior real.
- El hueco vertical entre troncos se amplía para que no invada la hoja de puerta.
- Las hojas se apoyan sobre la cota superior del piso en lugar de arrancar enterradas dentro de la plataforma.
- Las cabañas reciben la misma regla de acceso limpio y coherente.

## Fotos del refugio

- Las fotos dinámicas ya no usan el offset fijo `z=-1.68`.
- La estructura publica la posición de la cara interior de la pared del fondo.
- `refugiovivo.js` ancla cada marco contra esa pared real.
- Se conserva la liberación recursiva de geometría/material/textura al reemplazar fotos.

## Chimeneas

- La chimenea principal del refugio se reconstruye como un fuste continuo desde el hogar hasta el remate exterior.
- El hogar, fuste y punto de emisión de humo usan el mismo eje arquitectónico.
- Las cabañas publican el punto de humo en la altura real de su remate, no varios metros por debajo.

## QA

Se incorpora `pruebas/verificar-premium-rc5.mjs`, que protege explícitamente:

- ausencia del antiguo travesaño dentro de la puerta;
- cotas coherentes de puerta/marco;
- continuidad de chimeneas;
- punto de humo en la boca real;
- fotos ancladas a una pared declarada por la estructura.

Toda la cadena histórica V2→RC5, auditoría geométrica headless, build reproducible y release check debe quedar verde antes de empaquetar.

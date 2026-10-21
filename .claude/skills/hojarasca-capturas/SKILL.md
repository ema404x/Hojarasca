---
name: hojarasca-capturas
description: Cómo sacar capturas útiles de Hojarasca (antes/después de un lugar, un personaje, una obra) con la cámara bien puesta, y cómo revisarlas. Usala cuando haya que mostrarle al usuario cómo quedó algo o verificar que nada flota ni se atraviesa.
---

# Capturas en Hojarasca

## Herramienta
`herramientas/recorrido-mapa.cjs` (oculta, con perfil propio; ver la skill `hojarasca-partidas` para lanzar Electron):
```
set HUMO_OCULTO=1 & set HOJ_PERFIL=<carpeta temporal> & node_modules\electron\dist\electron.exe --no-sandbox -r <ruta>\herramientas\al-monitor.cjs -r <ruta>\herramientas\perfil-propio.cjs herramientas\recorrido-mapa.cjs --fase=fotos --vistas=<vistas.json> --salida=<carpeta>
```
Cada vista: `{ id, x, z, mira: { x, z } | yaw, horas, alto }`. Guarda `<id>.jpg`.
Si la captura de Electron falla con la ventana oculta (`UnknownVizError`), la herramienta saca el cuadro del lienzo (sin carteles): está bien.

## Poner bien la cámara (lo que más falla)
- **Leé las coordenadas del objeto desde el código** (las constantes exportadas: `PUESTOS_RUTA`, `PUNTOS` de recursos, posiciones de la gente), no a ojo.
- Cámara a **8–15 m** del objeto, a la altura de los ojos (`alto` ~1,7) y mirando a su centro; para algo grande (un puesto, la cantera) 15–25 m. Nunca a menos de 4 m: queda pegada a una roca o a un tronco y no se ve nada.
- Antes de usar el punto de cámara, comprobá que no cae dentro de una colisión ni de un árbol (desplazala unos metros si hace falta) y que el terreno no tapa la vista (en ladera, subí `alto` o mirá desde abajo).
- Para «se apoya o flota» sumá una toma **rasante** (alto 0,5–1 m, de costado). Para ver el conjunto, una **desde arriba** (alto 20–30 m).
- Hora fija (`horas: 11.5`) y la misma calidad en antes y después. Para la noche, `horas: 22` con las luces que correspondan.
- La vegetación cercana tarda en montarse con la ventana oculta: dejá correr cuadros antes de capturar.

## Antes / después
- «Antes» se saca de la versión anterior armada en una carpeta temporal, con **las mismas vistas** (mismo archivo json).
- Mandale al usuario los pares, y lo que todavía está mal, dicho de frente.

## Revisar
- Abrí **cada** captura a tamaño completo antes de describirla.
- Buscá: cosas flotando o hundidas, piezas atravesadas, árboles que salen de techos, faroles o carteles pegados, gente sin los pies en el suelo, texturas que se ven azules o grises de más.
- Lo que no se puede juzgar a ojo (unos centímetros), medirlo en Node con las posiciones y el terreno.

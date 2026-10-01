# Hojarasca Mega RC2

RC2 se centra en convertir la rama maestra en un producto reproducible y distribuible, sin perder las correcciones estructurales V2–V8.

## Núcleo

- Empaquetador offline propio: 43 módulos de `src/` → un único `index.html` reproducible.
- Three.js r186 embebido localmente; cero dependencia de CDN en ejecución.
- 69 APIs de Three usadas por el juego verificadas contra el runtime local.
- `Raycaster` y geometrías base probadas fuera del renderer.

## Robustez

- Guardado transaccional con backup sano, recuperación y migraciones.
- Un JSON sintácticamente válido pero que no parece una partida ya no invalida un backup sano.
- Recolección repetida, pesca, cocina y fotos persisten en el mismo evento, sin esperar al autoguardado.
- Saneamiento de ajustes/posición dañados.
- IDs de progresión históricos normalizados.
- Integridad DOM y progresión verificadas automáticamente.
- Mapa visual determinista.
- Cámara libre de desarrollo oculta salvo `?debug=1`.
- Las fotos del refugio liberan textura, material y geometría al reemplazarse, evitando acumulación de memoria GPU.

## Desktop / Steam

- Capturas PNG validadas en el proceso principal.
- Renderer aislado con `sandbox`, `contextIsolation`, navegación externa y popups bloqueados.
- Instancia única y registro de crashes.
- Icono Windows ICO multirresolución.
- Artefactos NSIS/portable diferenciados.
- Target `dist:steam:win` para generar una carpeta de depot.
- Paquete marcado como privado / UNLICENSED.

## Estado

La RC2 pasa la cadena automatizada completa, pero todavía requiere smoke test WebGL/Electron en hardware real antes de declararse Gold.

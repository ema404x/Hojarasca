# Hojarasca — Premium Construction Evolution RC6

## Evolución principal

La construcción propia pasa de 7 opciones casi lineales a un catálogo de **14 planos** en cuatro categorías. Se preservan los planos existentes y se suman casilla de tablas, cobertizo rural, banco de carpintero, pasarela, cerco, mesa de campo y estante.

## Sistema de colocación

- Rotación persistente a 45° con R o rueda.
- Tab cambia categoría; 1–8 elige dentro de la categoría.
- Huella real por plano en lugar de una muestra fija para todos.
- Validación de pendiente, agua, vías, senderos, vegetación, estructuras del mundo y obras propias.
- Piezas de mobiliario pueden apoyarse sobre plataformas construidas.
- Estado del sitio y orientación visibles en el panel.

## Obra y progresión

- Marcador visible en etapa 0.
- Marcar un sitio no despeja vegetación hasta comenzar la primera etapa.
- Supr cancela una marca sin empezar sin gasto ni física residual.
- Piezas de una etapa comprueban materiales antes de fundarse, evitando marcadores huérfanos.
- El avance busca una obra cercana del mismo plano seleccionado.
- El panel muestra costo total, materiales, etapas y porcentaje.

## Utilidad real

- Cobertizo rural y banco de carpintero exponen la función `aserrar`.
- Una base propia puede convertirse en taller y reducir viajes al galpón de esquila.
- Casilla y puesto son refugios habitables.

## Física y QA

- Física acotada verticalmente para estructuras y piezas nuevas.
- Pasarela es caminable; cerco bloquea; mesa, banco, estante y talleres ocupan el volumen visible.
- Auditoría headless RC6 genera todos los planos completos: **14 planos · 4 categorías · 31 obstáculos · 18 plataformas**.
- Todos los vértices y bounds deben ser finitos y cada plano debe poder completarse de principio a fin.

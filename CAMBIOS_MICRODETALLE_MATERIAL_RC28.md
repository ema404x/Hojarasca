# CAMBIOS MICRODETALLE MATERIAL — RC28

## Objetivo
Subir el realismo a corta distancia sin sumar geometría pesada ni reabrir stutter. RC28 trabaja sobre shaders y estado climático ya existentes.

## Humedad con memoria
- Nuevo estado global `uMojado`: las superficies se empapan rápido y se secan de forma gradual.
- El secado tarda más con cielo cubierto, evitando el cambio instantáneo mojado/seco al terminar la lluvia.
- La lluvia visible (`uLluvia`) sigue separada de la humedad material, por lo que gotas/precipitación no se confunden con superficie mojada.

## Suelo
- Humedad persistente sobre barro, senderos y bajos.
- Charcos procedurales muy sutiles en zonas planas/compactadas, sin decals ni geometría extra.
- Los charcos toman color del cielo y respuesta Fresnel para integrarse con la iluminación.

## Madera, piedra y techos
- Veta procedural de madera a corta distancia.
- Micrograno mineral para piedra/techo.
- Todo microdetalle se desvanece antes de distancia media para evitar shimmer.
- Madera/piedra conservan humedad después de la lluvia, con oscurecimiento y brillo controlados.
- Base de materiales con marca húmeda/musgo algo más creíble cerca del suelo.

## Rendimiento
- Sin texturas nuevas, decals, reflection probes ni draw calls.
- Se reutiliza ruido ya calculado dentro del shader.
- El detalle fino sólo aparece entre ~0–52 m y se apaga progresivamente.

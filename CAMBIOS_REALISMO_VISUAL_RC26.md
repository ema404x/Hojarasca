# CAMBIOS_REALISMO_VISUAL_RC26

## Objetivo
Dar un salto visual al mundo patagónico sin romper la estabilidad lograda en RC25 ni reintroducir tirones.

## Cambios principales

### 1) Cielo y atmósfera
- Gradiente del cielo reajustado para un mediodía más frío y limpio, y amaneceres/atardeceres más creíbles.
- Banda de dispersión atmosférica cerca del horizonte para mejorar la sensación de aire y profundidad.
- Nueva capa sutil de nubes altas/cirros encima de las nubes bajas ya existentes.
- Niebla con mayor persistencia matinal y un despeje algo más claro al mediodía.

### 2) Cordillera y paisaje lejano
- Coloración más rica en la cordillera: mezcla de roca fría, roca cálida y pasto alto según pendiente y exposición al sol.
- Contraluz suave en crestas lejanas para separar mejor el horizonte.

### 3) Terreno y materiales
- Suelo con más variedad cromática: pedregullo, pasto seco y transición más orgánica entre sendero, bosque, humedad y roca.
- En lluvia, la respuesta especular del suelo gana un componente Fresnel sutil para que el mojado se lea mejor sin exagerar.

### 4) Postproceso
- Grading más fotográfico: sombras frías, luces levemente cálidas y mejor profundidad vegetal.
- Soporte directo para clima/tarde/humedad dentro del compositor final.
- Exposición final ligeramente refinada para preservar lectura en noche y mal tiempo.

## Rendimiento
- Todos los cambios están concentrados en shaders ya existentes o en uniformes livianos.
- No se agregan sistemas pesados nuevos, ni geometría extra significativa, ni simulaciones por frame fuera de la tubería visual actual.

## Resultado esperado
RC26 hace que Hojarasca se vea más realista y patagónico en:
- profundidad del aire
- lectura del horizonte
- riqueza del suelo
- cielos más naturales
- atardeceres más lindos
- clima húmedo más convincente

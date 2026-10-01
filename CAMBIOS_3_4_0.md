# Hojarasca 3.4.0 — Tal cual HushWood, con la Patagonia de verdad

Tercera vuelta del estilo. Referencia: las capturas de **HushWood** (OoyGames, Steam 4842880).
No es low-poly facetado: es pintado, con pincelada amplia. Y lo nuestro se respeta: cada especie
de la Patagonia se reconoce como en la naturaleza, con ese acabado.

## Luz y color
- Paleta sin verde lima: verdes hondos y naturales, sombras de color (verde azulado, pardo), luces
  doradas. La saturación bajó y el lima de las copas al sol se corrige aparte.
- **Hora dorada de verdad**: antes, a las 18:30 el juego todavía no la tomaba como tarde (en el
  verano patagónico el sol sigue alto) y el atardecer salía lavado. Ahora el sol pasa por tres
  tonos, el cielo se pone durazno y lavanda y el ambiente se entibia.
- Bruma gris azulada más marcada: separa el bosque en planos. Con techo: ya no aparece la sábana
  pálida sobre el lago y el borde del valle.
- Rayos de sol más visibles a la tarde.
- Suelo pintado: musgo verde azulado en el bosque, prado con manchas secas, piso oscuro y frío bajo
  las copas (nunca negro), roca más clara.
- Calidad baja y muy baja (sin postproceso) con el mismo dorado de la tarde.

## Árboles
- **Copas de hojas pintadas**: racimos de hojitas, agujas o escamas (atlas pintado por código al
  cargar), con ramas marrón rojizo que salen del tronco y sostienen cada racimo. Se acabaron los
  bultos facetados y las ramas que atravesaban las copas.
- **Troncos** pardo rojizos con vetas verticales y el lado del sol tibio.
- Cada especie como es:
  - **arrayán**: varios troncos color canela con manchones claros, copa densa y oscura;
  - **coihue**: alto, en capas de racimos alrededor del fuste (ya no "en platos");
  - **pehuén**: tronco recto, pisos de ramas gruesas casi horizontales con la punta levantada,
    cubiertas de escamas;
  - **lenga y ñire**: copa abierta con las ramas a la vista;
  - **maitén**: copa redonda con cortina colgante;
  - **ciprés**: cónico, tupido de ramitas de escamas.
- A media distancia (50–120 m) las copas ya no son bultos redondos apilados: el borde lo recortan
  las hojas pintadas y la luz se quiebra hoja por hoja. Mismos dibujos y triángulos.
- Los árboles lejanos pre-dibujados funden los dos ángulos vecinos: ya no cambian de golpe.
- Rocas más redondas y suaves.

## Sotobosque, pasto y flores
- **Helechos plumosos** (frondas pintadas) en vez de estrellas de triángulos.
- **Pasto denso**: matas de tres hojas, unas tres veces más hojas de cerca, con menos triángulos.
- **Flores reales en matas**: lupinos violetas, rosados y lilas, margaritas y amancay. En invierno
  se van; en otoño los helechos se ponen rojizos.
- **Sotobosque en bloques** (pendiente desde la 3.3): el piso del bosque pasó de 30–45 dibujos por
  cuadro a 9–11.

## Paisaje lejano
- **Cordillera nueva**: cuatro cordones a 800–3200 m, cada uno más alto y más claro, con picos
  irregulares, agujas y portezuelos; bosque abajo, franja de lenga (roja en otoño), roca gris
  violácea, nieve en las cumbres y en las canaletas. En invierno baja la nieve.
- **Lago** pintado: reflejo de la costa, los cerros y el cielo; verde azulado hondo, orilla clara.
- **Nubes** grandes de borde blando, agrupadas, con panza lavanda.

## Gente y animales
- Vecinos con proporciones de adulto, formas suaves (sin facetas), manos de mitón, cara con
  mentón, nariz, orejas y cejas, pelo y barba con volumen. Ropa de la zona: Ramón con poncho con
  guarda y flecos, bombachas y botas; Ema con campera de guardaparque y trenza; Ercilia con
  pollera, delantal y rodete; Elsa con abrigo largo; Nicanor con campera larga y botas de goma; los
  pobladores con chaleco, delantal o pañuelo según el oficio. Cada uno con sus colores y sombrero
  de siempre. El mate es una calabaza con virola y bombilla.
- Animales con su anatomía real: perro de campo (pecho, manchas, antifaz), pudú (ciervo enano,
  orejas redondas, cuernitos en el macho), huemul, ciervo, zorro, guanaco, liebre, cauquén, oveja
  con vellón en mechones, gallina, caballo criollo con recado (pelero, bastos, cojinillo),
  carpintero negro (copete rojo en el macho), cóndor con las primarias abiertas, cachaña.
- Mismos pivotes y animaciones; ninguna figura suma dibujos (varias bajan) y no hay materiales
  nuevos. Suben los triángulos por figura (1,5 a 4 veces).

## Números (esta PC, mismas vistas)
- Dibujos por cuadro: iguales o menos en todas las vistas medidas. Triángulos: 4–17% menos.
- Carga: el atlas de hojas se pinta en ~30 ms; los árboles lejanos se hornean en ~45–50 ms (igual
  que antes).
- Ojo: las hojas recortadas de cerca usan descarte de píxeles, que la 3.2 había evitado. Parado al
  lado de un ciprés la placa trabaja ~0,5–1 ms más en alta. Falta medirlo en la Radeon integrada.

## QA
- `npm run verify`: 124 de 124. Partidas reales (Electron): las 42 en verde.
- `humo-2-8` pedía más de 10 piezas en el cuerpo del jugador; ahora se funde en 6 a propósito
  (menos dibujos). Se ajustó la prueba (≥ 5) y pasó.
- Trabajo en cinco equipos con copias separadas (luz y color; forma del bosque; sotobosque y
  pasto; paisaje lejano; gente y animales) y un sexto para los árboles a media distancia; cada
  uno con el gate en verde y capturas antes/después.

## Queda para después
- La sábana de bruma del piedemonte todavía algo pálida al ocaso; alguna faceta en los cerros
  cercanos.
- Amancay que en algunos tramos del borde del bosque arma una franja de cantero.
- Rayos de sol todavía suaves al mediodía.
- La gente todavía algo rígida (brazos como tubos, caras simples); escalón visible de cerca en
  algunas uniones (cuello del perro y del huemul, hombros); crin del caballo como lámina.
- Medir en la Radeon integrada el costo de las hojas recortadas (cerca y a media distancia).

# 1.3.0 — Desafío premium

Tercera ronda del modo Desafío: 21 mejoras. Los tipos de invasores no cambian (se
dejaron para más adelante por pedido), y por eso tampoco hay jefe cada 5 noches.

## Combate
- **Armas nuevas:** honda de cuero (tira tus piedras, rápida y barata), boleadoras
  (enredan al invasor 3,4 s; al bruto sólo lo frenan) y martillo de carpintero.
- **Mejoras con cristales** (K → Mejoras): punta de cristal para la lanza (34 → 52),
  arco reforzado (más rápido, 56) y condensador para la pistola (clic derecho: disparo
  cargado de 150 que atraviesa a todos los de la línea, gasta 3 cargas).
- **Bloquear** con la lanza (clic derecho sostenido: frena el 75% de lo que viene de
  adelante, con chispas) y **esquivar** (doble toque A/D: salto lateral con un instante
  de invulnerabilidad).
- **Efectos de golpe:** astillas en la madera, chispas y polvo en la piedra, gotas verdes
  en los invasores, destello al morir, explosiones con humo y marca en el suelo.
- **Cámara lenta** cuando cae el último invasor de la noche (y cuando cae la nodriza).
- **Música de tensión** adaptativa: dron grave, cuerdas, latido que se acelera con la
  cercanía y la cantidad de invasores, tonos vidriosos de presencia alienígena y un
  acorde de resolución al amanecer.

## Base
- **Antorcha de guardia:** fuego con luz real (hasta 4 luces según calidad, asignadas a
  las antorchas más cercanas sin recompilar shaders) y charco de luz sobre el suelo. Los
  invasores esquivan la luz; los brutos las apagan; la lluvia también. F las prende.
- **Campana de alarma:** suena sola cuando un invasor se acerca a 30 m y avisa la dirección.
- **Torre de vigía:** plataforma a 2,4 m con escalera; desde arriba +25% de daño y más
  alcance, y los invasores no te alcanzan con las manos.
- **Trampas:** pozo con estacas (atrapa y lastima, se rearma), red de cristal (frena al
  30%) y barril de resina (estalla a 2 m: daño en área, se consume).
- **Reforzar** (K → Base): empalizada → empalizada reforzada (600) · pirca → muro
  almenado (1150).
- **Martillo:** tocá una defensa dañada para devolverle un 10% por golpe (un material
  cada tres golpes).

## Mundo
- **El perro** ladra cuando se acercan y muerde a los invasores a menos de 14 m tuyo.
- **Compañeros:** Don Ramón se suma tras 2 noches con 6 defensas y repara lo dañado; Ema
  tras 4 noches con 10 defensas y tira flechas desde la base.
- **Restos de naves** cada tres noches (en el mapa): cada uno da un plano alienígena,
  en orden: generador de escudo (absorbe la mitad del daño de las obras en 9 m, un
  cristal por noche), faro de plasma (torreta de 30 m) y baliza de sanación.
- **Clima:** la lluvia y la niebla acortan la vista de los tiradores; con nieve los
  invasores van más lentos; la lluvia apaga las antorchas.
- **Noches especiales** desde la cuarta (anunciadas una hora antes): noche roja (casi el
  doble de invasores), eclipse (más oscuro, más rápidos) y noche silenciosa (sólo
  tiradores).
- **Final:** en la noche 20 baja la nave nodriza. Hay que destruir sus tres núcleos
  (arco, honda, pistola o torretas) mientras larga invasores. Si amanece, se retira y
  vuelve. Al caer: pantalla de victoria y se sigue en modo infinito.

## Progresión y pulido
- **Tutorial del primer día** (6 pasos que se tildan solos, con premio).
- **Logros** (18) y **récords por dificultad** (noches, racha, abatidos, victorias), en
  la portada y en la pausa.
- Taller por categorías (Tab), clic sobre la receta para fabricar.
- Cápsula y restos marcados en el mapa; nave con haz corregido.

## Técnica
- Módulos nuevos: `desafio-efectos.js`, `desafio-musica.js`, `desafio-logros.js`,
  `desafio-aliados.js`, `desafio-defensas.js`, `desafio-eventos.js`, `desafio-tutorial.js`.
- `construccion.js`: 11 piezas nuevas (dos sólo por mejora, tres por plano alienígena),
  física declarativa con plataformas y `reemplazarPlano`.
- `perro.js` acepta un objetivo de ataque; `gente.js` deja trabajar a los vecinos
  instalados en la base.
- Pruebas: `verificar-modo-desafio.mjs` y `verificar-logros.mjs` en `npm run verify`;
  `npm run verify:desafio-premium` (partida real, 42 comprobaciones).

# 1.5.0 — Guía del juego y recursos más accesibles

## El problema
Conseguir tablas era casi imposible y el juego no lo explicaba:
- Los troncos sólo salían de árboles caídos (el mapa no tenía ninguno) y de 5 troncos
  sueltos en todo el valle; el más cercano a la base estaba a 57 m.
- Las tablas sólo se aserraban en el galpón de esquila (a 499 m de la base) o en un banco
  de carpintero propio, que a su vez **pedía 5 tablas** (el huevo y la gallina).
- La pista de inicio hablaba de una tecla K que en el Relax no hace nada.

## Recursos
| | antes | 1.5.0 |
|---|---|---|
| Árbol en pie (todas las especies menos el pehuén) | no se podía | **3 hachazos (H) → 4 troncos**; el árbol cae y deja de chocar |
| Pehuén | — | protegido: no se tala (avisa por qué) |
| Tronco suelto | 2 troncos | 3 troncos |
| Pedrero | 3 piedras | 4 piedras |
| Aserrar (Y) | sólo en el galpón o en un banco: 1 → 4 | **a mano en cualquier lado: 1 → 2**; en banco o galpón 1 → 4 |
| Banco de carpintero | 5 tablas + 2 troncos | **4 troncos + 2 piedras** |
| Kit inicial del Desafío | 4 troncos, 4 piedras | 6 troncos, 6 tablas, 6 piedras |

El aviso en pantalla muestra el progreso (“Talar el árbol (2/3)”) y, cuando llevás troncos
pero ninguna tabla, sugiere “Aserrar a mano (1 tronco → 2 tablas)”. Junto al banco dice
“Aserrar en el banco (1 tronco → 4 tablas)”.

## Guía del juego (F1)
- Se abre con **F1** en partida, desde **Pausa → Guía del juego** y desde la **portada**.
  Esc o F1 la cierran.
- Pestañas: Primeros pasos · Recursos (de dónde sale cada cosa) · Construcción · Armas y
  defensas (sólo Desafío) · Vivir en el bosque (sólo Relax) · Teclas.
- El contenido se filtra según el modo (`src/guia.js`, módulo puro probado en Node).

## Pistas y tutorial
- Pistas nuevas: “La guía del juego” (F1), “Madera” (cómo talar), “Tablas” (Y para aserrar).
  Se corrigió la de “Mirá alrededor” (E para anotar, Z prismáticos).
- Tutorial del Desafío: “Talá un árbol” y un paso nuevo, “Aserrá tablas”.
- Textos del cuaderno, la mochila, los planos y la lista de controles actualizados.

## Pruebas
- `pruebas/verificar-guia.mjs` (en `npm run verify`): contenido por modo, cableado, pistas,
  costos y rendimientos.
- `pruebas/humo-desafio.cjs`: talar en pie (el primer hachazo no voltea, el tercero da +4),
  aserrar a mano (+2), banco sin tablas, aserrar en el banco (+4), pehuén protegido, F1
  abre la guía y Esc vuelve a la pausa.
